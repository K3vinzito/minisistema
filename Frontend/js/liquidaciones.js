/* ================================================================
   LIQUIDACIONES — DETALLES DESDE GOOGLE SHEETS (AGRUPADO)
================================================================ */

import { dom } from "./core.js";

const CSV_DETALLES_LIQUIDACIONES =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN4DhXzK6uTyZcR-HyF9h_yGkSHyNt-iaFN6zYXeNK-6hXJQMgxgQ6DNBzj5IT4DDeSBr6vVnrV0Rv/pub?gid=0&single=true&output=csv";

/* ===== estado local ===== */
let detallesOriginales = [];
let ultimoTotal = 0;
let ordenActual = "original"; // original | desc | asc

/* ================================================================
   UTILIDADES MONETARIAS
================================================================ */

function parseValor(valor) {
  return Number(
    String(valor)
      .replace(/\$/g, "")
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

function formatMoney(valor) {
  const signo = valor < 0 ? "-" : "";
  return `${signo}$${Math.abs(valor).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/* ================================================================
   AGRUPAR POR DETALLE
================================================================ */
function agruparPorDetalle(items) {
  const mapa = {};

  items.forEach(f => {
    const key = f.DETALLE.trim().toUpperCase();
    const valor = parseValor(f.VALOR);

    if (!mapa[key]) {
      mapa[key] = { ...f, VALOR: valor };
    } else {
      mapa[key].VALOR += valor;
    }
  });

  return Object.values(mapa);
}

/* ================================================================
   CARGAR DETALLES LIQUIDACIONES
================================================================ */
export async function cargarDetallesLiquidaciones(semana) {
  const hacienda = dom.haciendaSelect.value;

  dom.tablaDetalle.innerHTML =
    `<tr><td colspan="3">Cargando detalles...</td></tr>`;

  try {
    const res = await fetch(CSV_DETALLES_LIQUIDACIONES);
    const csv = await res.text();

    const parsed = Papa.parse(csv.trim(), {
      header: true,
      skipEmptyLines: true
    });

    const filas = parsed.data || [];

    detallesOriginales = filas.filter(f => {
      const semOk = String(f.SEM).trim() === String(semana).trim();
      const tipoOk = String(f.TIPO || "").trim().toUpperCase() === "DESC. LIQUID.";
      const detalleOk = String(f.DETALLE || "").trim().toUpperCase() !== "CAJAS";
      const hacOk = hacienda === "GLOBAL" || String(f.HACIENDA).trim() === String(hacienda).trim();

      return semOk && tipoOk && detalleOk && hacOk;
    });

    if (!detallesOriginales.length) {
      dom.tablaDetalle.innerHTML =
        `<tr><td colspan="3">Sin detalles</td></tr>`;
      ultimoTotal = 0;
      return;
    }

    // 🔹 Agrupar por DETALLE
    detallesOriginales = agruparPorDetalle(detallesOriginales);

    // 🔹 TOTAL REAL
    ultimoTotal = detallesOriginales.reduce(
      (acc, f) => acc + parseValor(f.VALOR),
      0
    );

    ordenActual = "original";
    const icon = document.getElementById("iconOrden");
    if (icon) icon.src = "img/clasificar.png";

    renderTabla(detallesOriginales, ultimoTotal);

  } catch (err) {
    console.error("Error LIQUIDACIONES CSV:", err);
    dom.tablaDetalle.innerHTML =
      `<tr><td colspan="3">Error al cargar detalles</td></tr>`;
  }
}

/* ================================================================
   RENDER TABLA
================================================================ */
function renderTabla(items, total) {
  const filasHtml = items.map(f => {
    const valor = parseValor(f.VALOR);
    return `
      <tr>
        <td>${f.TIPO}</td>
        <td class="detalle-largo">${f.DETALLE}</td>
        <td>${formatMoney(valor)}</td>
      </tr>
    `;
  }).join("");

  const totalSum = items.reduce((acc, f) => acc + parseValor(f.VALOR), 0);

  dom.tablaDetalle.innerHTML = `
    ${filasHtml}
    <tr class="fila-total">
      <td colspan="2">TOTAL</td>
      <td>${formatMoney(totalSum)}</td>
    </tr>
  `;
}

/* ================================================================
   ORDENAR POR VALOR (manteniendo signo)
================================================================ */
export function ordenarLiquidacionesPorValor() {
  if (!detallesOriginales.length) return;

  let items;

  if (ordenActual === "original") {
    items = [...detallesOriginales].sort(
      (a, b) => parseValor(b.VALOR) - parseValor(a.VALOR)
    );
    ordenActual = "desc";
  }
  else if (ordenActual === "desc") {
    items = [...detallesOriginales].sort(
      (a, b) => parseValor(a.VALOR) - parseValor(b.VALOR)
    );
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
