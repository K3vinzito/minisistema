const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({
      ok: false,
      message: "Usuario y contraseña son obligatorios",
    });
  }

  try {
    const result = await db.query(
      "SELECT id, usuario, password, rol, activo FROM usuarios WHERE usuario = $1 LIMIT 1",
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.status(403).json({
        ok: false,
        message: "Usuario inactivo",
      });
    }

    // ⚠️ COMPARACIÓN DIRECTA (temporal)
    if (user.password !== password) {
      return res.status(401).json({
        ok: false,
        message: "Contraseña incorrecta",
      });
    }

    // ✅ Login correcto
    res.json({
      ok: true,
      usuario: {
        id: user.id,
        usuario: user.usuario,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("Error login:", error);
    res.status(500).json({
      ok: false,
      message: "Error del servidor",
    });
  }
});

module.exports = router;
