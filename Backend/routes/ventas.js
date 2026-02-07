import express from "express";
import pool from "../db.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import path from "path";


const router = express.Router();


/* ======================================================
   CREAR ORDEN DE VENTA (SIN FACTURA: SE ASIGNA AL APROBAR)
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
      total_cantidad += Number(d.cantidad) || 0;
      total_subtotal += Number(d.subtotal) || 0;
      total_retencion += Number(d.retencion) || 0;
      total_pago += Number(d.pago) || 0;
    });

    // 1) Crear cabecera (factura_numero se queda NULL aquí)
    const ordenRes = await client.query(
      `INSERT INTO orden_venta
       (cliente_id, razon_social, semana, fecha,
        total_cantidad, total_subtotal, total_retencion, total_pago, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDIENTE')
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

    // 2) Insertar detalles (todos arrancan como aprobado = false)
    for (const d of detalles) {
      await client.query(
        `INSERT INTO orden_venta_detalle
         (orden_id, origen, cantidad, unidad, precio, subtotal, retencion, pago, aprobado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)`,
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

    // 3) Respuesta
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
      WHERE d.aprobado = false
      ORDER BY o.created_at DESC, d.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando pendientes" });
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
   ACTUALIZAR DETALLE
====================================================== */
/* ======================================================
   ACTUALIZAR DETALLE + RECALCULAR ORDEN
====================================================== */
router.put("/detalle/:id", authRequired, async (req, res) => {
  const client = await pool.connect();
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
    await client.query("BEGIN");

    // 1️⃣ Obtener orden_id
    const detRes = await client.query(
      "SELECT orden_id FROM orden_venta_detalle WHERE id = $1",
      [id]
    );

    if (!detRes.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Detalle no encontrado" });
    }

    const ordenId = detRes.rows[0].orden_id;

    // 2️⃣ Actualizar detalle
    await client.query(
      `UPDATE orden_venta_detalle
       SET origen = $1,
           cantidad = $2,
           unidad = $3,
           precio = $4,
           subtotal = $5,
           retencion = $6,
           pago = $7
       WHERE id = $8`,
      [origen, cantidad, unidad, precio, subtotal, retencion, pago, id]
    );

    // 3️⃣ Recalcular totales
    const totalesRes = await client.query(
      `SELECT
         SUM(cantidad)  AS total_cantidad,
         SUM(subtotal)  AS total_subtotal,
         SUM(retencion) AS total_retencion,
         SUM(pago)      AS total_pago
       FROM orden_venta_detalle
       WHERE orden_id = $1`,
      [ordenId]
    );

    const t = totalesRes.rows[0];

    // 4️⃣ Actualizar cabecera
    await client.query(
      `UPDATE orden_venta
       SET total_cantidad = $1,
           total_subtotal = $2,
           total_retencion = $3,
           total_pago = $4
       WHERE id = $5`,
      [
        t.total_cantidad || 0,
        t.total_subtotal || 0,
        t.total_retencion || 0,
        t.total_pago || 0,
        ordenId
      ]
    );

    await client.query("COMMIT");
    res.json({ ok: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error actualizando detalle" });
  } finally {
    client.release();
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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT orden_id FROM orden_venta_detalle WHERE id = $1",
      [req.params.id]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Detalle no encontrado" });
    }

    const ordenId = rows[0].orden_id;

    await client.query(
      "DELETE FROM orden_venta_detalle WHERE id = $1",
      [req.params.id]
    );

    const countRes = await client.query(
      "SELECT COUNT(*) FROM orden_venta_detalle WHERE orden_id = $1",
      [ordenId]
    );

    if (Number(countRes.rows[0].count) === 0) {
      await client.query(
        "DELETE FROM orden_venta WHERE id = $1",
        [ordenId]
      );
    }

    await client.query("COMMIT");
    res.json({ ok: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error eliminando detalle" });
  } finally {
    client.release();
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

/* ======================================================
   APROBAR DETALLES DE ORDEN
====================================================== */
router.put("/aprobar-detalle", authRequired, async (req, res) => {
  const { detalles } = req.body;

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: "No hay detalles para aprobar" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Aprobar los detalles seleccionados
    await client.query(
      `
      UPDATE orden_venta_detalle
      SET aprobado = true
      WHERE id = ANY($1)
      `,
      [detalles]
    );

    // 2. Buscar órdenes afectadas
    const { rows } = await client.query(
      `
      SELECT DISTINCT orden_id
      FROM orden_venta_detalle
      WHERE id = ANY($1)
      `,
      [detalles]
    );
    
    // 3. Para cada orden, verificar si TODOS los detalles están aprobados
    for (const r of rows) {
      const { rows: pendientes } = await client.query(
        `
        SELECT COUNT(*) 
        FROM orden_venta_detalle
        WHERE orden_id = $1 AND aprobado = false
        `,
        [r.orden_id]
      );

      if (Number(pendientes[0].count) === 0) {
        await client.query(
          `UPDATE orden_venta SET estado = 'APROBADA' WHERE id = $1`,
          [r.orden_id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error aprobando facturación" });
  } finally {
    client.release();
  }
});


    /* ======================================================
   APROBAR DETALLE (NO TODA LA ORDEN)
====================================================== */
/* ======================================================
   APROBAR DETALLE (GENERA FACTURA CUANDO TODOS ESTÁN OK)
====================================================== */
router.put("/detalle/:id/aprobar", authRequired, async (req, res) => {
  const client = await pool.connect();
  const detalleId = req.params.id;

  try {
    await client.query("BEGIN");

    // 1️⃣ Obtener orden_id del detalle
    const detRes = await client.query(
      "SELECT orden_id FROM orden_venta_detalle WHERE id = $1",
      [detalleId]
    );

    if (!detRes.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Detalle no encontrado" });
    }

    const ordenId = detRes.rows[0].orden_id;

    // 2️⃣ Aprobar el detalle
    await client.query(
      "UPDATE orden_venta_detalle SET aprobado = true WHERE id = $1",
      [detalleId]
    );

    // 3️⃣ Verificar si quedan detalles pendientes
    const pendRes = await client.query(
      `SELECT COUNT(*) AS pendientes
       FROM orden_venta_detalle
       WHERE orden_id = $1 AND aprobado = false`,
      [ordenId]
    );

    const pendientes = Number(pendRes.rows[0].pendientes);

    // 4️⃣ Si NO quedan pendientes → aprobar orden y generar factura
    if (pendientes === 0) {

      // Generar número de factura solo una vez
      const facRes = await client.query(
        "SELECT factura_numero FROM orden_venta WHERE id = $1",
        [ordenId]
      );

      let facturaNumero = facRes.rows[0].factura_numero;

      if (!facturaNumero) {
        facturaNumero = `FAC-${String(ordenId).padStart(6, "0")}`;

        await client.query(
          `UPDATE orden_venta
           SET estado = 'APROBADA',
               factura_numero = $1
           WHERE id = $2`,
          [facturaNumero, ordenId]
        );
      } else {
        await client.query(
          "UPDATE orden_venta SET estado = 'APROBADA' WHERE id = $1",
          [ordenId]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error aprobando detalle" });
  } finally {
    client.release();
  }
});

/* ======================================================
   DESAPROBAR DETALLE (REGRESA A PENDIENTES)
====================================================== */
router.put("/detalle/:id/desaprobar", authRequired, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Obtener orden_id
    const { rows } = await client.query(
      "SELECT orden_id FROM orden_venta_detalle WHERE id = $1",
      [req.params.id]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Detalle no encontrado" });
    }

    const ordenId = rows[0].orden_id;

    // 2️⃣ Marcar detalle como NO aprobado
    await client.query(
      "UPDATE orden_venta_detalle SET aprobado = false WHERE id = $1",
      [req.params.id]
    );

    // 3️⃣ Regresar orden a estado PENDIENTE
    await client.query(
      "UPDATE orden_venta SET estado = 'PENDIENTE' WHERE id = $1",
      [ordenId]
    );

    await client.query("COMMIT");
    res.json({ ok: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error al desaprobar detalle" });
  } finally {
    client.release();
  }
});

/* ======================================================
   FACTURACIÓN — DETALLE DE ÓRDENES APROBADAS
====================================================== */
router.get("/aprobadas-detalle", authRequired, async (req, res) => {
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
      WHERE d.aprobado = true
      ORDER BY o.created_at DESC, d.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando aprobadas" });
  }
});


/* ======================================================
   SUBIR ARCHIVOS A DETALLE DE ORDEN
====================================================== */
router.post(
  "/detalle/:id/archivo",
  authRequired,
  upload.array("archivos"),
  async (req, res) => {
    const detalleId = req.params.id;

    try {
      const files = req.files;

      if (!files || !files.length) {
        return res.status(400).json({ error: "Sin archivos" });
      }

      for (const f of files) {
        await pool.query(
          `INSERT INTO orden_venta_archivo
           (detalle_id, nombre_original, nombre_archivo, tipo, size)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            detalleId,
            f.originalname,
            f.filename,
            f.mimetype,
            f.size
          ]
        );
      }

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error subiendo archivos" });
    }
  }
);
router.get(
  "/detalle/:id/archivo",
  authRequired,
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM orden_venta_archivo WHERE detalle_id = $1",
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error listando archivos" });
    }
  }
);

router.delete(
  "/archivo/:id",
  authRequired,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT nombre_archivo FROM orden_venta_archivo WHERE id = $1",
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Archivo no encontrado" });
      }

      const filePath = `Backend/uploads/${rows[0].nombre_archivo}`;

      await pool.query(
        "DELETE FROM orden_venta_archivo WHERE id = $1",
        [req.params.id]
      );

      import("fs").then(fs => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error eliminando archivo" });
    }
  }
);

/* ======================================================
   RESUMEN — FACTURACIÓN DESDE ÓRDENES APROBADAS
   (KARDEX MANUAL POR AHORA)
====================================================== */
router.get("/resumen-facturacion", authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        o.semana,
        o.razon_social,
        o.factura_numero,
        SUM(d.cantidad) AS qq
      FROM orden_venta o
      JOIN orden_venta_detalle d ON d.orden_id = o.id
      WHERE o.estado = 'APROBADA'
      GROUP BY o.semana, o.razon_social, o.factura_numero
      ORDER BY o.semana
    `);

    // Agrupar por semana (estructura que espera el frontend)
    const semanasMap = {};

    rows.forEach(r => {
      if (!semanasMap[r.semana]) {
        semanasMap[r.semana] = {
          semana: r.semana,
          dias: ["Lu", "Ma", "Mi", "Ju", "Vi"], // fijo por ahora
          lotes: [],        // vendrá del Excel luego
          libras: [],       // vendrá del Excel luego
          facturacion: []
        };
      }

      semanasMap[r.semana].facturacion.push({
        cliente: r.razon_social,
        factura_numero: r.factura_numero,
        qq: Number(r.qq)
      });
    });

    res.json(Object.values(semanasMap));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando resumen de facturación" });
  }
});



export default router;
