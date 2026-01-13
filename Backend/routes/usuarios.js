import express from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";
import { authRequired, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===============================
   GET → Listar usuarios (ADMIN)
================================ */
router.get(
  "/",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, usuario, rol, activo, created_at
         FROM usuarios
         ORDER BY id`
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Error listar usuarios:", err);
      res.status(500).json({ error: "Error al listar usuarios" });
    }
  }
);

/* ===============================
   POST → Crear usuario (ADMIN)
================================ */
router.post(
  "/",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    const { usuario, password, rol } = req.body;

    if (!usuario || !password || !rol) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    try {
      const existe = await pool.query(
        "SELECT id FROM usuarios WHERE usuario = $1",
        [usuario]
      );

      if (existe.rowCount > 0) {
        return res.status(409).json({ error: "Usuario ya existe" });
      }

      const hash = await bcrypt.hash(password, 10);

      await pool.query(
        `INSERT INTO usuarios (usuario, password, rol, activo)
         VALUES ($1, $2, $3, true)`,
        [usuario, hash, rol]
      );

      res.json({ ok: true, message: "Usuario creado" });
    } catch (err) {
      console.error("Error crear usuario:", err);
      res.status(500).json({ error: "Error al crear usuario" });
    }
  }
);

/* ===============================
   PUT → Editar usuario (ADMIN)
================================ */
router.put(
  "/:id",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { usuario, rol } = req.body;

    if (!usuario || !rol) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    try {
      await pool.query(
        `UPDATE usuarios
         SET usuario = $1, rol = $2
         WHERE id = $3`,
        [usuario, rol, id]
      );

      res.json({ ok: true, message: "Usuario actualizado" });
    } catch (err) {
      console.error("Error actualizar usuario:", err);
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  }
);

/* ===============================
   PUT → Activar / Desactivar (ADMIN)
================================ */
router.put(
  "/:id/estado",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({ error: "Estado inválido" });
    }

    try {
      await pool.query(
        `UPDATE usuarios
         SET activo = $1
         WHERE id = $2`,
        [activo, id]
      );

      res.json({ ok: true, message: "Estado actualizado" });
    } catch (err) {
      console.error("Error estado usuario:", err);
      res.status(500).json({ error: "Error al cambiar estado" });
    }
  }
);

export default router;
