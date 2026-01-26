import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../db.js";

const router = express.Router();

/**
 * POST /api/auth/login
 * body: { usuario, password }
 */
router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({
      ok: false,
      error: "Usuario y password son obligatorios"
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, usuario, password, rol, activo
       FROM usuarios
       WHERE usuario = $1
       LIMIT 1`,
      [usuario]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        ok: false,
        error: "Credenciales inválidas"
      });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.status(403).json({
        ok: false,
        error: "Usuario inactivo"
      });
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return res.status(401).json({
        ok: false,
        error: "Credenciales inválidas"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        usuario: user.usuario,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "8h" }
    );

    return res.json({
      ok: true,
      token,
      usuario: {
        id: user.id,
        usuario: user.usuario,
        rol: user.rol
      }
    });

  } catch (err) {
    console.error("Error login:", err);
    return res.status(500).json({
      ok: false,
      error: "Error del servidor"
    });
  }
});

/**
 * POST /api/auth/register
 * body: { usuario, password }
 * crea SOLO usuarios tipo "user"
 */
router.post("/register", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({
      ok: false,
      error: "Usuario y password son obligatorios"
    });
  }

  try {
    // Verificar si el usuario ya existe
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = $1",
      [usuario]
    );

    if (existe.rowCount > 0) {
      return res.status(409).json({
        ok: false,
        error: "El usuario ya existe"
      });
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usuario normal
    await pool.query(
      `INSERT INTO usuarios (usuario, password, rol, activo)
       VALUES ($1, $2, 'user', true)`,
      [usuario, passwordHash]
    );

    return res.status(201).json({
      ok: true,
      message: "Usuario registrado correctamente"
    });

  } catch (err) {
    console.error("Error register:", err);
    return res.status(500).json({
      ok: false,
      error: "Error del servidor"
    });
  }
});

export default router;
