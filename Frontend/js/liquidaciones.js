/* ================================================================
   LIQUIDACIONES — DETALLES AGRUPADOS DESDE GOOGLE SHEETS
================================================================ */

import { dom } from "./core.js";

const CSV_DETALLES_LIQUIDACIONES =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN4DhXzK6uTyZcR-HyF9h_yGkSHyNt-iaFN6zYXeNK-6hXJQMgxgQ6DNBzj5IT4DDeSBr6vVnrV0Rv/pub?gid=0&single=true&output=csv";

/* ===== estado ===== */
let detallesOriginales = [];
let totalGeneral = 0;
let ordenActual = "original";

/* ================================================================
   UTILIDADES
================================================================ */

function parseValor(valor) {
  return Number(String(valor).replace(/\$/g, "").replace(/,/g, "").trim()) || 0;
}

function formatMoney(valor) {
  return valor.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  });
}

/* ✅ ICONO ORDEN (mapeo invertido según tus imágenes actuales) */
function actualizarIconoOrden() {
  const icon = document.getElementById("iconOrden");
  if (!icon) return;

  // Según tu captura: cuando está ASC (menor→mayor) se ve el icono “al revés”.
  // Entonces invertimos el mapeo:
  icon.src =
    ordenActual === "desc"
      ? "img/orden-ascendente.png"     // <-- invertido
      : ordenActual === "asc"
        ? "img/orden-descendiente.png" // <-- invertido
        : "img/clasificar.png";
}

/* ================================================================
   CARGAR Y AGRUPAR LIQUIDACIONES
================================================================ */
export async function cargarDetallesLiquidaciones(semana) {
  const hacienda = dom.haciendaSelect.value;

  if (dom.tituloDetalle) {
    dom.tituloDetalle.innerText = `DETALLES — SEMANA ${semana}`;
  }

  dom.tablaDetalle.innerHTML = `<tr><td colspan="3">Cargando detalles...</td></tr>`;

  try {
    const csv = await fetch(CSV_DETALLES_LIQUIDACIONES).then(r => r.text());
    const rows = Papa.parse(csv.trim(), { header: true }).data;

    const filtrados = rows.filter(r =>
      String(r.SEM) === String(semana) &&
      String(r.TIPO).trim().toUpperCase() === "DESC. LIQUID." &&
      String(r.DETALLE).trim().toUpperCase() !== "CAJAS" &&
      (hacienda === "GLOBAL" || String(r.HACIENDA).trim() === String(hacienda).trim())
    );

    // AGRUPAR POR DETALLE
    const mapa = {};
    filtrados.forEach(r => {
      const det = (r.DETALLE || "").trim();
      mapa[det] ??= { tipo: r.TIPO, detalle: det, valor: 0 };
      mapa[det].valor += parseValor(r.VALOR);
    });

    detallesOriginales = Object.values(mapa);

    totalGeneral = detallesOriginales.reduce((acc, r) => acc + r.valor, 0);

    // ✅ RESET ORDEN + ICONO AL CAMBIAR DE SEMANA
    ordenActual = "original";
    actualizarIconoOrden();

    renderTabla(detallesOriginales, totalGeneral);

  } catch (err) {
    console.error(err);
    dom.tablaDetalle.innerHTML = `<tr><td colspan="3">Error al cargar liquidaciones</td></tr>`;
  }
}

/* ================================================================
   RENDER TABLA
================================================================ */
function renderTabla(items, total) {
  dom.tablaDetalle.innerHTML = `
    ${items.map(r => `
      <tr>
        <td>${r.tipo}</td>
        <td class="detalle-largo">${r.detalle}</td>
        <td>${formatMoney(r.valor)}</td>
      </tr>
    `).join("")}
    <tr class="fila-total">
      <td colspan="2">TOTAL</td>
      <td>${formatMoney(total)}</td>
    </tr>
  `;
}

/* ================================================================
   ORDENAR POR VALOR
================================================================ */
export function ordenarLiquidacionesPorValor() {
  if (!detallesOriginales.length) return;

  let items;

  if (ordenActual === "original") {
    items = [...detallesOriginales].sort((a, b) => b.valor - a.valor);
    ordenActual = "desc";
  } else if (ordenActual === "desc") {
    items = [...detallesOriginales].sort((a, b) => a.valor - b.valor);
    ordenActual = "asc";
  } else {
    items = [...detallesOriginales];
    ordenActual = "original";
  }

  // ✅ actualizar icono siempre
  actualizarIconoOrden();

  renderTabla(items, totalGeneral);
}
