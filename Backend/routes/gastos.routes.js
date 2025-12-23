const express = require('express');
const router = express.Router();
const db = require('../db');

// ===============================
// DETALLES DE GASTOS
// ===============================
router.get('/detalles', async (req, res) => {
  try {
    const sem = Number(req.query.sem);
    const rubro = (req.query.rubro || '').trim().toUpperCase();

    // ===== Normalización de filtros =====
    const empresaRaw = (req.query.empresa || '').trim();
    const haciendaRaw = (req.query.hacienda || '').trim();

    const empresa = (!empresaRaw || empresaRaw.toUpperCase() === 'GLOBAL')
      ? null
      : empresaRaw.toUpperCase().trim();

    const hacienda = (!haciendaRaw || haciendaRaw.toUpperCase() === 'GLOBAL')
      ? null
      : haciendaRaw
          .toUpperCase()
          .replace(/^LA\s+/i, '')
          .replace(/^EL\s+/i, '')
          .trim();

    if (!sem || !rubro) {
      return res.json({ ok: false, msg: 'Parámetros obligatorios: sem, rubro' });
    }

    // ===== WHERE base =====
    const where = ['sem = ?'];
    const params = [sem];

    // ===== LÓGICA DE RUBROS =====
    if (rubro === 'GENERAL') {
      where.push(`
        rubro NOT IN (
          'FUMIGACION',
          'FERTILIZANTES',
          'MATERIAL DE RIEGO',
          'COMBUSTIBLE HACIENDAS'
        )
      `);
    } 
    else if (rubro === 'TOTAL') {
      // TOTAL = no filtrar rubro
    } 
    else {
      where.push('rubro = ?');
      params.push(rubro);
    }

    // ===== Empresa =====
    if (empresa) {
      where.push('UPPER(empresa) = ?');
      params.push(empresa);
    }

    // ===== Hacienda (NORMALIZADA) =====
    if (hacienda) {
      where.push(`
        UPPER(
          REPLACE(
            REPLACE(hacienda, 'LA ', ''),
            'EL ', ''
          )
        ) = ?
      `);
      params.push(hacienda);
    }

    const whereSql = where.join(' AND ');

    // ===== 1) Detalles =====
    const [rows] = await db.query(
      `
      SELECT
        rubro AS tipo,
        detalle AS detalle,
        valor AS valor
      FROM detalle_gastos
      WHERE ${whereSql}
      ORDER BY rubro, id ASC
      `,
      params
    );

    // ===== 2) Total =====
    const [tot] = await db.query(
      `
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM detalle_gastos
      WHERE ${whereSql}
      `,
      params
    );

    return res.json({
      ok: true,
      filtros: {
        sem,
        empresa: empresa || 'GLOBAL',
        hacienda: hacienda || 'GLOBAL',
        rubro
      },
      items: rows,
      total: Number(tot[0].total || 0),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno',
      error: String(err)
    });
  }
});

module.exports = router;
