import express from "express";
import pool from "../db.js";
import { authRequired } from "../middleware/authMiddleware.js";


const router = express.Router();
router.post("/orden", authRequired, async (req, res) => {
  const {
    cliente_id,
    razon_social,
    semana,
    fecha,
    detalles
  } = req.body;

  if (!cliente_id || !razon_social || !detalles?.length) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ===== CALCULAR TOTALES =====
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

    // ===== INSERT ORDEN =====
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

    // ===== INSERT DETALLES =====
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

    res.json({
      ok: true,
      orden_id: ordenId
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error al guardar orden" });
  } finally {
    client.release();
  }
});
router.get("/pendientes", authRequired, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.razon_social,
        o.semana,
        o.fecha,
        o.total_cantidad,
        o.total_subtotal,
        o.total_retencion,
        o.total_pago
      FROM orden_venta o
      WHERE o.estado = 'PENDIENTE'
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar pendientes" });
  }
});
router.get("/orden/:id", authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const detalles = await pool.query(
      `SELECT * FROM orden_venta_detalle
       WHERE orden_id = $1`,
      [id]
    );

    res.json(detalles.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener detalle" });
  }
});
router.put("/aprobar/:id", authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE orden_venta
       SET estado = 'APROBADA'
       WHERE id = $1`,
      [id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al aprobar orden" });
  }
});
export default router;
