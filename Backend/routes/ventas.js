import express from "express";
import pool from "../db.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ======================================================
   CREAR ORDEN DE VENTA
====================================================== */
router.post("/orden", authRequired, async (req, res) => {
  const { cliente_id, razon_social, semana, fecha, detalles } = req.body;

  if (!cliente_id || !razon_social || !detalles?.length) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let total_cantidad = 0;
    let total_subtotal = 0;
    let total_retencion = 0;
    let total_pago = 0;

    detalles.forEach(d => {
      total_cantidad += Number(d.cantidad);
      total_subtotal += Number(d.subtotal);
      total_retencion += Number(d.retencion);
      total_pago += Number(d.pago);
    });

    const ordenRes = await client.query(
      `INSERT INTO orden_venta
       (cliente_id, razon_social, semana, fecha,
        total_cantidad, total_subtotal, total_retencion, total_pago)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        cliente_id,
        razon_social,
        semana,
        fecha,
        total_cantidad,
        total_subtotal,
        total_retencion,
        total_pago
      ]
    );

    const ordenId = ordenRes.rows[0].id;

    for (const d of detalles) {
      await client.query(
        `INSERT INTO orden_venta_detalle
         (orden_id, origen, cantidad, unidad, precio,
          subtotal, retencion, pago)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          ordenId,
          d.origen,
          d.cantidad,
          d.unidad,
          d.precio,
          d.subtotal,
          d.retencion,
          d.pago
        ]
      );
    }

    await client.query("COMMIT");

    res.json({ ok: true, orden_id: ordenId });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error al guardar orden" });
  } finally {
    client.release();
  }
});

/* ======================================================
   FACTURACIÓN — DETALLE DE ÓRDENES PENDIENTES
====================================================== */
router.get("/pendientes-detalle", authRequired, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.id              AS detalle_id,
        o.id              AS orden_id,
        o.razon_social,
        d.origen,
        d.cantidad,
        d.unidad,
        d.precio,
        d.subtotal,
        d.retencion,
        d.pago
      FROM orden_venta o
      JOIN orden_venta_detalle d ON d.orden_id = o.id
      WHERE o.estado = 'PENDIENTE'
      ORDER BY o.created_at DESC, d.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando detalle de facturación" });
  }
});

/* ======================================================
   LISTAR ÓRDENES (CABECERA)
====================================================== */
router.get("/pendientes", authRequired, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM orden_venta
      WHERE estado = 'PENDIENTE'
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar pendientes" });
  }
});

/* ======================================================
   DETALLE POR ORDEN
====================================================== */
router.get("/orden/:id", authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orden_venta_detalle WHERE orden_id = $1",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo detalle" });
  }
});

/* ======================================================
   ELIMINAR DETALLE
====================================================== */
router.delete("/detalle/:id", authRequired, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM orden_venta_detalle WHERE id = $1",
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando detalle" });
  }
});
router.put("/detalle/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const {
    origen,
    cantidad,
    unidad,
    precio,
    subtotal,
    retencion,
    pago
  } = req.body;

  try {
    await pool.query(
      `UPDATE orden_venta_detalle
       SET origen=$1, cantidad=$2, unidad=$3, precio=$4,
           subtotal=$5, retencion=$6, pago=$7
       WHERE id=$8`,
      [origen, cantidad, unidad, precio, subtotal, retencion, pago, id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando detalle" });
  }
});

/* ======================================================
   APROBAR ORDEN
====================================================== */
router.put("/aprobar/:id", authRequired, async (req, res) => {
  try {
    await pool.query(
      "UPDATE orden_venta SET estado = 'APROBADA' WHERE id = $1",
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error aprobando orden" });
  }
});

export default router;
