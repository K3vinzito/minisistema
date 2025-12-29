/* ================================================================
                      GASTOS — DETALLES
================================================================ */
//const API_BASE = "https://minisistema-production.up.railway.app";

import { dom } from "./core.js";
const CSV_DETALLES_GASTOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3yzCzfky5TeiKNaNOcIdNeGAvotBE-RincIpCt4kOIEnV8-rLLWk4tG0xaNG6Xt2jT2FsTVqr6iC1/pub?gid=0&single=true&output=csv";

/* ===== estado local ===== */

let detallesGastos = [];
let totalGastos = 0;
let ordenGastos = "original"; // original | desc | asc

/* ================================================================
   CARGAR DETALLES GASTOS
================================================================ */
export async function cargarDetallesGastos(semana, rubro) {
  const empresa = dom.empresaSelect.value;
  const hacienda = dom.haciendaSelect.value;

  dom.tablaDetalle.innerHTML =
    `<tr><td colspan="3">Cargando detalles...</td></tr>`;

  try {
    // 1) Leer CSV
    const res = await fetch(CSV_DETALLES_GASTOS);
    const csv = await res.text();

    // 2) Parsear CSV
    const parsed = Papa.parse(csv.trim(), {
      header: true,
      skipEmptyLines: true
    });

    const filas = parsed.data || [];

    // 3) Filtrar
    detallesOriginales = filas.filter(f => {
      const semOk = String(f.SEM).trim() === String(semana).trim();
      const rubroOk =
        rubro === "TOTAL" || String(f.RUBRO).trim() === String(rubro).trim();

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

    // 4) Total
    ultimoTotal = detallesOriginales.reduce(
      (acc, f) => acc + (Number(f.VALOR) || 0),
      0
    );

    ordenActual = "original";
    const icon = document.getElementById("iconOrden");
    if (icon) icon.src = "img/clasificar.png";

    // 5) Render
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
  const filasHtml = items.map(f => `
    <tr>
      <td>${f.RUBRO}</td>
      <td class="detalle-largo">${f.DETALLE}</td>
      <td>${(Number(f.VALOR) || 0).toFixed(2)}</td>
    </tr>
  `).join("");

  dom.tablaDetalle.innerHTML = `
    ${filasHtml}
    <tr class="fila-total">
      <td colspan="2">TOTAL</td>
      <td>${(Number(total) || 0).toFixed(2)}</td>
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
      (a, b) => (Number(b.VALOR) || 0) - (Number(a.VALOR) || 0)
    );
    ordenActual = "desc";
  }
  else if (ordenActual === "desc") {
    items = [...detallesOriginales].sort(
      (a, b) => (Number(a.VALOR) || 0) - (Number(b.VALOR) || 0)
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