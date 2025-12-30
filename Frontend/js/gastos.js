/* ================================================================
   GASTOS — DETALLES DESDE GOOGLE SHEETS
================================================================ */

import { dom } from "./core.js";

const CSV_DETALLES_GASTOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3yzCzfky5TeiKNaNOcIdNeGAvotBE-RincIpCt4kOIEnV8-rLLWk4tG0xaNG6Xt2jT2FsTVqr6iC1/pub?gid=0&single=true&output=csv";

/* ===== estado local ===== */
let detallesOriginales = [];
let ultimoTotal = 0;
let ordenActual = "original"; // original | desc | asc

/* ================================================================
   MAPEOS DE RUBROS (CLICK -> SHEET)
================================================================ */

// Lo que llega desde el click (tu tabla principal) vs cómo se llama en el Sheet
const MAP_RUBRO_CLICK_A_SHEET = {
  "FUMIGACION": "FUMIGACION",
  "FERTILIZACION": "FERTILIZANTES",
  "RIEGO": "MATERIAL DE RIEGO",
  "COMBUSTIBLE": "COMBUSTIBLE HACIENDAS"
};

// Rubros que NO deben entrar en GENERAL (NOMBRES EXACTOS DEL SHEET)
const RUBROS_SHEET_EXCLUIDOS_GENERAL = [
  "FUMIGACION",
  "FERTILIZANTES",
  "MATERIAL DE RIEGO",
  "COMBUSTIBLE HACIENDAS"
];

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
  return `$${Number(valor).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/* ================================================================
   CARGAR DETALLES GASTOS
================================================================ */
export async function cargarDetallesGastos(semana, rubro) {
  const empresa = dom.empresaSelect.value;
  const hacienda = dom.haciendaSelect.value;

  dom.tablaDetalle.innerHTML =
    `<tr><td colspan="3">Cargando detalles...</td></tr>`;

  try {
    const res = await fetch(CSV_DETALLES_GASTOS);
    const csv = await res.text();

    const parsed = Papa.parse(csv.trim(), {
      header: true,
      skipEmptyLines: true
    });

    const filas = parsed.data || [];

    const rubroClick = String(rubro || "").trim().toUpperCase();

    // Si es un rubro "especial" (FERTILIZACION/RIEGO/COMBUSTIBLE), se traduce al nombre real del Sheet
    const rubroSheetEsperado = MAP_RUBRO_CLICK_A_SHEET[rubroClick]
      ? MAP_RUBRO_CLICK_A_SHEET[rubroClick].toUpperCase()
      : rubroClick; // si no está en el mapa, usamos tal cual

    detallesOriginales = filas.filter(f => {
      const semOk = String(f.SEM).trim() === String(semana).trim();

      const rubroSheet = String(f.RUBRO || "").trim().toUpperCase();

      let rubroOk = false;

      if (rubroClick === "TOTAL") {
        rubroOk = true;
      }
      else if (rubroClick === "GENERAL") {
        // GENERAL = TODO lo que NO sea los 4 rubros principales (según nombres reales del Sheet)
        rubroOk = !RUBROS_SHEET_EXCLUIDOS_GENERAL.includes(rubroSheet);
      }
      else {
        // Rubro normal = coincide con el rubro real del Sheet (con mapa aplicado)
        rubroOk = rubroSheet === rubroSheetEsperado;
      }

      const empOk =
        empresa === "GLOBAL" || String(f.EMPRESA).trim() === String(empresa).trim();

      const hacOk =
        hacienda === "GLOBAL" || String(f.HACIENDA).trim() === String(hacienda).trim();

      return semOk && rubroOk && empOk && hacOk;
    });

    if (!detallesOriginales.length) {
      dom.tablaDetalle.innerHTML =
        `<tr><td colspan="3">Sin detalles</td></tr>`;
      ultimoTotal = 0;
      return;
    }

    ultimoTotal = detallesOriginales.reduce(
      (acc, f) => acc + parseValor(f.VALOR),
      0
    );

    ordenActual = "original";
    const icon = document.getElementById("iconOrden");
    if (icon) icon.src = "img/clasificar.png";

    renderTabla(detallesOriginales, ultimoTotal);

  } catch (err) {
    console.error("Error GASTOS CSV:", err);
    dom.tablaDetalle.innerHTML =
      `<tr><td colspan="3">Error al cargar detalles</td></tr>`;
  }
}

/* ================================================================
   RENDER TABLA
================================================================ */
function renderTabla(items, total) {
  const filasHtml = items.map(f => {
    const valorNum = parseValor(f.VALOR);
    return `
      <tr>
        <td>${f.RUBRO}</td>
        <td class="detalle-largo">${f.DETALLE}</td>
        <td>${formatMoney(valorNum)}</td>
      </tr>
    `;
  }).join("");

  dom.tablaDetalle.innerHTML = `
    ${filasHtml}
    <tr class="fila-total">
      <td colspan="2">TOTAL</td>
      <td>${formatMoney(total)}</td>
    </tr>
  `;
}

/* ================================================================
   ORDENAR POR VALOR
================================================================ */
export function ordenarGastosPorValor() {
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
