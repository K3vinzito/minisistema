/* ================================================================
                LIQUIDACIONES — DETALLES (BD)
================================================================ */
const API_BASE = "https://minisistema-production.up.railway.app";

import { dom } from "./core.js";

export async function cargarDetallesLiquidaciones(semana, tipo = "DESCUENTOS") {
  const hacienda = dom.haciendaSelect.value;

  dom.tablaDetalle.innerHTML = `
    <tr><td colspan="3">Cargando detalles...</td></tr>
  `;

  try {
    const url = new URL(`${API_BASE}/api/liquidaciones/detalles`);
    url.search = new URLSearchParams({
      sem: semana,
      hacienda,
      tipo
    });

    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok || !data.items?.length) {
      dom.tablaDetalle.innerHTML =
        `<tr><td colspan="3">Sin detalles</td></tr>`;
      return;
    }

    const filas = data.items.map(item => `
      <tr>
        <td>${item.tipo}</td>
        <td class="detalle-largo">${item.detalle}</td>
        <td>$${Math.abs(Number(item.valor)).toFixed(2)}</td>
      </tr>
    `).join("");

    dom.tablaDetalle.innerHTML = `
      ${filas}
      <tr class="fila-total">
        <td colspan="2">TOTAL</td>
        <td>$${Math.abs(Number(data.total)).toFixed(2)}</td>
      </tr>
    `;
  } catch (err) {
    console.error("Error liquidaciones:", err);
    dom.tablaDetalle.innerHTML =
      `<tr><td colspan="3">Error al cargar detalles</td></tr>`;
  }
}
