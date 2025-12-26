/* ================================================================
                 PRODUCCIÓN — DETALLES DE RECHAZOS
================================================================ */
const API_BASE = "https://minisistema-production.up.railway.app";

import { dom } from "./core.js";

/* 🟢 ORDEN — estado local (NO afecta carga) */
let detallesOriginales = [];
let ultimoTotal = 0;
let ordenActual = "original"; // original | desc | asc

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
      detallesOriginales = [];
      return;
    }

    /* 🟢 ORDEN — guardar orden original */
    detallesOriginales = [...data.items];
    ultimoTotal = data.total;
    ordenActual = "original";

    const icon = document.getElementById("iconOrden");
    if (icon) icon.src = "img/clasificar.png";


    /* 🔵 RENDER ORIGINAL (SIN CAMBIOS) */
    renderTabla(detallesOriginales, ultimoTotal);

  } catch (err) {
    console.error("Error producción:", err);
    dom.tablaDetalle.innerHTML =
      `<tr><td colspan="3">Error al cargar detalles</td></tr>`;
  }
}

/* 🟢 ORDEN — función de render (misma estructura que antes) */
function renderTabla(items, total) {
  const filas = items.map(item => `
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
      <td>${Number(total)}</td>
    </tr>
  `;
}
export function ordenarProduccionPorValor() {
  if (!detallesOriginales.length) return;

  let items;

  if (ordenActual === "original") {
    items = [...detallesOriginales].sort((a, b) => b.valor - a.valor);
    ordenActual = "desc";
  }
  else if (ordenActual === "desc") {
    items = [...detallesOriginales].sort((a, b) => a.valor - b.valor);
    ordenActual = "asc";
  }
  else {
    items = [...detallesOriginales];
    ordenActual = "original";
  }

  const icon = document.getElementById("iconOrden");
  if (icon) {
    icon.src =
      ordenActual === "desc"
        ? "img/orden-descendiente.png"
        : ordenActual === "asc"
          ? "img/orden-ascendente.png"
          : "img/clasificar.png";
  }

  renderTabla(items, ultimoTotal);
}
