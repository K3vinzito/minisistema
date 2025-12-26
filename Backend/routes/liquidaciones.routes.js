const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================
// DETALLES DE LIQUIDACIONES (DESCUENTOS)
// ======================================
router.get("/detalles", async (req, res) => {
  try {
    const sem = Number(req.query.sem);
    const tipo = (req.query.tipo || "").toUpperCase();

    const empresaRaw = (req.query.empresa || "").trim();
    const haciendaRaw = (req.query.hacienda || "").trim();

    const empresa =
      !empresaRaw || empresaRaw === "GLOBAL" ? null : empresaRaw;
    const hacienda =
      !haciendaRaw || haciendaRaw === "GLOBAL" ? null : haciendaRaw;

    if (!sem || !tipo) {
      return res.json({
        ok: false,
        msg: "Parámetros obligatorios: sem, tipo"
      });
    }

    const where = ["sem = ?", "tipo = ?"];
    const params = [sem, tipo];

    if (empresa) {
      where.push("empresa = ?");
      params.push(empresa);
    }

    if (hacienda) {
      where.push("hacienda = ?");
      params.push(hacienda);
    }

    const sql = `
      SELECT tipo, detalle, valor
      FROM detalle_liquidaciones
      WHERE ${where.join(" AND ")}
      ORDER BY ABS(valor) DESC
    `;

    const [rows] = await db.query(sql, params);

    const total = rows.reduce(
      (acc, r) => acc + Number(r.valor || 0),
      0
    );

    res.json({
      ok: true,
      items: rows,
      total
    });
  } catch (err) {
    console.error("Error liquidaciones:", err);
    res.json({
      ok: false,
      msg: "Error interno del servidor"
    });
  }
});

module.exports = router;
