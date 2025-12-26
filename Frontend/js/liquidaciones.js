/* ================================================================
                LIQUIDACIONES — DETALLES (BD)
================================================================ */
const API_BASE = "https://minisistema-production.up.railway.app";

import { dom } from "./core.js";

/* 🟢 ESTADO LOCAL DE ORDEN */
let detallesOriginales = [];
let ultimoTotal = 0;
let ordenActual = "original"; // original | desc | asc

export async function cargarDetallesLiquidaciones(semana, tipo = "DESCUENTOS") {
  const hacienda = dom.haciendaSelect.value;

  // 🔁 reset de orden cada vez que se cargan nuevos datos
  ordenActual = "original";
  detallesOriginales = [];
  ultimoTotal = 0;

  // ✅ reset del icono
  const icon = document.getElementById("iconOrden");
  if (icon) icon.src = "img/clasificar.png";

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

    detallesOriginales = [...data.items];
    ultimoTotal = data.total;

    renderTabla(detallesOriginales, ultimoTotal);

  } catch (err) {
    console.error("Error liquidaciones:", err);
    dom.tablaDetalle.innerHTML =
      `<tr><td colspan="3">Error al cargar detalles</td></tr>`;
  }
}

function renderTabla(items, total) {
  const filas = items.map(item => `
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
      <td>$${Math.abs(Number(total)).toFixed(2)}</td>
    </tr>
  `;
}

export function ordenarLiquidacionesPorValor() {
  if (!detallesOriginales.length) return;

  let items;

  if (ordenActual === "original") {
    items = [...detallesOriginales].sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
    ordenActual = "desc";
  }
  else if (ordenActual === "desc") {
    items = [...detallesOriginales].sort((a, b) => Math.abs(a.valor) - Math.abs(b.valor));
    ordenActual = "asc";
  }
  else {
    items = [...detallesOriginales];
    ordenActual = "original";
  }

  // ✅ actualizar icono según estado
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
