const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

import usuariosRoutes from "./routes/usuarios.js";

app.use("/api/usuarios", usuariosRoutes);


// IMPORTAR DB (PostgreSQL)
const pool = require("./db");

// RUTA RAÍZ (EVITA Cannot GET /)
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API Minisistema corriendo correctamente 🚀",
  });
});

// RUTAS
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend activo" });
});

// TEST DB POSTGRES
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      ok: true,
      message: "Conectado a PostgreSQL",
      time: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ API corriendo en puerto ${PORT}`);
});

