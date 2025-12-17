const express = require("express");
const router = express.Router();
const db = require("../db");

/* ================= TABLA PRINCIPAL ================= */

router.get("/", async (req, res) => {
  const { empresa = "GLOBAL", hacienda = "GLOBAL" } = req.query;

  const [rows] = await db.query(
    `SELECT * FROM gastos
     WHERE (? = 'GLOBAL' OR empresa = ?)
       AND (? = 'GLOBAL' OR hacienda = ?)
     ORDER BY semana`,
    [empresa, empresa, hacienda, hacienda]
  );

  res.json(rows);
});

/* ================= DETALLES ================= */

router.get("/detalles", async (req, res) => {
  const { semana, rubro, empresa = "GLOBAL", hacienda = "GLOBAL" } = req.query;

  const [rows] = await db.query(
    `SELECT rubro AS tipo, descripcion AS detalle, SUM(valor) AS valor
     FROM gastos_detalle
     WHERE semana = ?
       AND rubro = ?
       AND (? = 'GLOBAL' OR empresa = ?)
       AND (? = 'GLOBAL' OR hacienda = ?)
     GROUP BY rubro, descripcion
     ORDER BY valor DESC`,
    [semana, rubro, empresa, empresa, hacienda, hacienda]
  );

  const total = rows.reduce((s, r) => s + Number(r.valor), 0);

  rows.push({
    tipo: "TOTAL",
    detalle: "",
    valor: total
  });

  res.json(rows);
});

module.exports = router;
