const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// RUTAS
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend activo" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`✅ API corriendo en http://localhost:${PORT}`)
);

const pool = require("./db");

app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1");
    res.json({ ok: true, message: "Conectado a MySQL" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

