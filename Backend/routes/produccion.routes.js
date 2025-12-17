const express = require("express");
const router = express.Router();
const db = require("../db");

/* ================= TABLA PRINCIPAL ================= */

router.get("/", async (req, res) => {
  const { empresa = "GLOBAL", hacienda = "GLOBAL" } = req.query;

  const [rows] = await db.query(
    `SELECT * FROM produccion
     WHERE (? = 'GLOBAL' OR empresa = ?)
       AND (? = 'GLOBAL' OR hacienda = ?)
     ORDER BY semana`
    , [empresa, empresa, hacienda, hacienda]
  );

  res.json(rows);
});

/* ================= DETALLES ================= */

router.get("/detalles", async (req, res) => {
  const { semana, empresa = "GLOBAL", hacienda = "GLOBAL" } = req.query;

  const [rows] = await db.query(
    `SELECT tipo, detalle, SUM(valor) AS valor
     FROM produccion_detalle
     WHERE semana = ?
       AND (? = 'GLOBAL' OR empresa = ?)
       AND (? = 'GLOBAL' OR hacienda = ?)
     GROUP BY tipo, detalle
     ORDER BY valor DESC`,
    [semana, empresa, empresa, hacienda, hacienda]
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
