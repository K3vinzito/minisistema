import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * GET /api/clientes
 * Lista clientes
 */
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM clientes ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error listando clientes:", err);
    res.status(500).json({ message: "Error listando clientes" });
  }
});

/**
 * POST /api/clientes
 * Crea cliente
 */
router.post("/", async (req, res) => {
  try {
    const {
      razon_social,
      ruc,
      direccion,
      personal,
      cargo,
      telefono,
      email,
    } = req.body;

    if (!razon_social || !ruc) {
      return res.status(400).json({ message: "razon_social y ruc son obligatorios" });
    }

    const { rows } = await pool.query(
      `INSERT INTO clientes
        (razon_social, ruc, direccion, personal, cargo, telefono, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [razon_social, ruc, direccion || "", personal || "", cargo || "", telefono || "", email || ""]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creando cliente:", err);

    // RUC duplicado
    if (err.code === "23505") {
      return res.status(409).json({ message: "Ya existe un cliente con ese RUC" });
    }

    res.status(500).json({ message: "Error creando cliente" });
  }
});

/**
 * PUT /api/clientes/:id
 * Actualiza cliente
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      razon_social,
      ruc,
      direccion,
      personal,
      cargo,
      telefono,
      email,
    } = req.body;

    if (!razon_social || !ruc) {
      return res.status(400).json({ message: "razon_social y ruc son obligatorios" });
    }

    const { rows } = await pool.query(
      `UPDATE clientes SET
        razon_social=$1,
        ruc=$2,
        direccion=$3,
        personal=$4,
        cargo=$5,
        telefono=$6,
        email=$7,
        updated_at=NOW()
       WHERE id=$8
       RETURNING *`,
      [razon_social, ruc, direccion || "", personal || "", cargo || "", telefono || "", email || "", id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error actualizando cliente:", err);

    if (err.code === "23505") {
      return res.status(409).json({ message: "Ya existe un cliente con ese RUC" });
    }

    res.status(500).json({ message: "Error actualizando cliente" });
  }
});

/**
 * DELETE /api/clientes/:id
 * Elimina cliente
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      "DELETE FROM clientes WHERE id=$1",
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando cliente:", err);
    res.status(500).json({ message: "Error eliminando cliente" });
  }
});

export default router;
