/* ================================================================
   PRODUCCIÓN — DETALLES DE RECHAZOS (OPTIMIZADO)
================================================================ */
const API_BASE = "https://minisistema-production.up.railway.app";

import { dom } from "./core.js";

export async function cargarDetallesProduccion(semana) {
  const empresa = dom.empresaSelect.value;
  const hacienda = dom.haciendaSelect.value;

  dom.tablaDetalle.innerHTML = `
    <tr><td colspan="3">Cargando detalles...</td></tr>
  `;

  try {
    const url = new URL(`${API_BASE}/api/produccion/detalles`);
    url.search = new URLSearchParams({
      sem: semana,
      empresa,
      hacienda,
      tipo: "RECHAZO"
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
        <td>${Number(item.valor)}</td>
      </tr>
    `).join("");

    dom.tablaDetalle.innerHTML = `
      ${filas}
      <tr class="fila-total">
        <td colspan="2">TOTAL</td>
        <td>${Number(data.total)}</td>
      </tr>
    `;

  } catch (err) {
    console.error("Error producción:", err);
    dom.tablaDetalle.innerHTML =
      `<tr><td colspan="3">Error al cargar detalles</td></tr>`;
  }
}
