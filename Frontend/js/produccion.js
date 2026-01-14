/* ================================================================
                 PRODUCCIÓN — DETALLES DE RECHAZOS
================================================================ */
//const API_BASE = "https://minisistema-production.up.railway.app";

import { dom } from "./core.js";

const CSV_DETALLES_PRODUCCION = {
  "2025": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQITw3POfXAnKjpDthFO7nX3S6-hz-KtZbwI3C0LZMdu-XcGMggDEY3SmbSCxAMzdCsagvVtoDudINJ/pub?gid=0&single=true&output=csv",
  "2026": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHGDNBfcQxxQnuLURGZnu8o51q8CgwX8WzFXFrgkYjVbAXtgKXYOPwsPAB0K_V0DGwY44R-u7bxB5J/pub?gid=0&single=true&output=csv"
};



let detallesOriginales = [];
let ultimoTotal = 0;
let ordenActual = "original"; 

export async function cargarDetallesProduccion(semana, periodoActual) {
  const empresa = dom.empresaSelect.value;
  const hacienda = dom.haciendaSelect.value;

// 🔹 Usar el periodo pasado como argumento; si no viene, usar PERIODO_ACTUAL global
const periodo = periodoActual || window.PERIODO_ACTUAL || "2025"; 

// 🔹 Validar que exista la URL
const urlCSV = CSV_DETALLES_PRODUCCION[periodo];
if (!urlCSV) {
  console.error(`No hay URL CSV definida para el periodo ${periodo}`);
  dom.tablaDetalle.innerHTML = `<tr><td colspan="3">No hay datos para este periodo</td></tr>`;
  return;
}


  if (dom.tituloDetalle) {
    dom.tituloDetalle.innerText = `DETALLES — SEMANA ${semana}`;
  }

  dom.tablaDetalle.innerHTML = `
    <tr><td colspan="3">Cargando detalles...</td></tr>
  `;

  try {
    const res = await fetch(urlCSV);
    const csv = await res.text();

    const parsed = Papa.parse(csv.trim(), {
      header: true,
      skipEmptyLines: true
    });

    const filas = parsed.data || [];

const filtrados = filas.filter(f => {
  // 🔹 normalizar nombres de columnas
  const sem = String(f.SEM?.trim() || f["SEM"]?.trim() || "").trim();
  const tipo = String(f.TIPO?.trim() || f["TIPO"]?.trim() || "").toUpperCase();
  const emp = String(f.EMPRESA?.trim() || f["EMPRESA"]?.trim() || "").trim();
  const hac = String(f.HACIENDA?.trim() || f["HACIENDA"]?.trim() || "").trim();

  // 🔹 filtros
  const semOk = sem === String(semana).trim();
  const tipoOk = tipo === "RECHAZO";
  const empOk = empresa === "GLOBAL" || emp === empresa;
  const hacOk = hacienda === "GLOBAL" || hac === hacienda;

  return semOk && tipoOk && empOk && hacOk;
});



    if (!filtrados.length) {
      dom.tablaDetalle.innerHTML = `<tr><td colspan="3">Sin detalles</td></tr>`;
      detallesOriginales = [];
      ultimoTotal = 0;
      return;
    }

    detallesOriginales = [...filtrados];
    ultimoTotal = detallesOriginales.reduce(
      (acc, f) => acc + (Number(f.VALOR) || 0), 0
    );
    ordenActual = "original";

    const icon = document.getElementById("iconOrden");
    if (icon) icon.src = "img/clasificar.png";

    renderTabla(detallesOriginales, ultimoTotal);

  } catch (err) {
    console.error("Error producción (CSV):", err);
    dom.tablaDetalle.innerHTML =
      `<tr><td colspan="3">Error al cargar detalles</td></tr>`;
  }
}





function renderTabla(items, total) {
  const formatearNumero = (valor) => {
    const n = Number(valor) || 0;
    return n.toLocaleString("es-EC", {
      maximumFractionDigits: 0
    });
  };

  const filas = items.map(item => `
    <tr>
      <td>${item.TIPO}</td>
      <td class="detalle-largo">${item.DETALLE}</td>
      <td>${formatearNumero(item.VALOR)}</td>
    </tr>
  `).join("");

  dom.tablaDetalle.innerHTML = `
    ${filas}
    <tr class="fila-total">
      <td colspan="2">TOTAL</td>
      <td>${formatearNumero(total)}</td>
    </tr>
  `;
}


export function ordenarProduccionPorValor() {
  if (!detallesOriginales.length) return;

  let items;

  if (ordenActual === "original") {
    items = [...detallesOriginales].sort((a, b) => (Number(b.VALOR) || 0) - (Number(a.VALOR) || 0));
    ordenActual = "desc";
  }
  else if (ordenActual === "desc") {
    items = [...detallesOriginales].sort((a, b) => (Number(a.VALOR) || 0) - (Number(b.VALOR) || 0));
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