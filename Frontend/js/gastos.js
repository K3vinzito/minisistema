/* ================================================================
                      GASTOS — DETALLES
================================================================ */
const API_BASE = "https://minisistema-production.up.railway.app";

import { dom } from "./core.js";

let detallesGastos = [];
let totalGastos = 0;
let ordenGastos = "original"; // original | desc | asc

export async function cargarDetallesGastos(semana, rubro) {
  const empresa = dom.empresaSelect.value;
  const hacienda = dom.haciendaSelect.value;

  // 🔹 reset de orden al cargar nuevos datos
  ordenGastos = "original";
  detallesGastos = [];
  totalGastos = 0;

  // ✅ reset del icono
  const icon = document.getElementById("iconOrden");
  if (icon) icon.src = "img/clasificar.png";

  dom.tablaDetalle.innerHTML = `
    <tr><td colspan="3">Cargando detalles...</td></tr>
  `;

  try {
    const url = new URL(`${API_BASE}/api/gastos/detalles`);
    url.search = new URLSearchParams({
      sem: semana,
      empresa,
      hacienda,
      rubro
    });

    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok || !data.items?.length) {
      dom.tablaDetalle.innerHTML =
        `<tr><td colspan="3">Sin detalles</td></tr>`;
      return;
    }

    detallesGastos = [...data.items];
    totalGastos = data.total;

    renderGastos(detallesGastos);

  } catch (err) {
    console.error("Error gastos:", err);
    dom.tablaDetalle.innerHTML =
      `<tr><td colspan="3">Error al cargar detalles</td></tr>`;
  }
}

function renderGastos(items) {
  const filas = items.map(item => `
    <tr>
      <td>${item.tipo}</td>
      <td class="detalle-largo">${item.detalle}</td>
      <td>$${Number(item.valor).toFixed(2)}</td>
    </tr>
  `).join("");

  dom.tablaDetalle.innerHTML = `
    ${filas}
    <tr class="fila-total">
      <td colspan="2">TOTAL</td>
      <td>$${Number(totalGastos).toFixed(2)}</td>
    </tr>
  `;
}

/* ===== ORDENAR (BOTÓN GLOBAL) ===== */
export function ordenarGastosPorValor() {
  if (!detallesGastos.length) return;

  let items;

  if (ordenGastos === "original") {
    items = [...detallesGastos].sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
    ordenGastos = "desc";
  } else if (ordenGastos === "desc") {
    items = [...detallesGastos].sort((a, b) => Math.abs(a.valor) - Math.abs(b.valor));
    ordenGastos = "asc";
  } else {
    items = [...detallesGastos];
    ordenGastos = "original";
  }

  // ✅ actualizar icono según estado
  const icon = document.getElementById("iconOrden");
  if (icon) {
    icon.src =
      ordenGastos === "desc"
        ? "img/orden-descendiente.png"
        : ordenGastos === "asc"
          ? "img/orden-ascendente.png"
          : "img/clasificar.png";
  }

  renderGastos(items);
}
