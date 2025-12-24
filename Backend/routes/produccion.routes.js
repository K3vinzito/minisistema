const express = require('express');
const router = express.Router();
const db = require('../db');

// ===============================
// DETALLES DE PRODUCCIÓN (RECHAZOS)
// ===============================
router.get('/detalles', async (req, res) => {
  try {
    const sem = Number(req.query.sem);
    const tipo = (req.query.tipo || '').trim().toUpperCase();

    const empresaRaw = (req.query.empresa || '').trim();
    const haciendaRaw = (req.query.hacienda || '').trim();

    const empresa = (!empresaRaw || empresaRaw.toUpperCase() === 'GLOBAL') ? null : empresaRaw;

    // NORMALIZAR HACIENDA
    const hacienda = (!haciendaRaw || haciendaRaw.toUpperCase() === 'GLOBAL')
      ? null
      : haciendaRaw
          .toUpperCase()
          .replace(/^LA\s+/i, '')
          .replace(/^EL\s+/i, '')
          .trim();

    if (!sem || !tipo) {
      return res.json({ ok: false, msg: 'Parámetros obligatorios: sem, tipo' });
    }

    const where = [
      'sem = ?',
      'tipo = ?'
    ];
    const params = [sem, tipo];

    if (empresa) {
      where.push('empresa = ?');
      params.push(empresa);
    }

    if (hacienda) {
      // COMPARACIÓN NORMALIZADA EN BD
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

    const [rows] = await db.query(
      `
      SELECT
        tipo AS tipo,
        detalle AS detalle,
        valor AS valor
      FROM detalle_produccion
      WHERE ${whereSql}
      ORDER BY id ASC
      `,
      params
    );

    const [tot] = await db.query(
      `
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM detalle_produccion
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
        tipo
      },
      items: rows,
      total: Number(tot[0].total || 0),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: 'Error interno', error: String(err) });
  }
});

module.exports = router;
