/* ================================================================
                 PRODUCCIÓN — DETALLES DE RECHAZOS
================================================================ */
//const API_BASE = "https://minisistema-production.up.railway.app";

import { dom } from "./core.js";

const CSV_DETALLES_PRODUCCION =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQITw3POfXAnKjpDthFO7nX3S6-hz-KtZbwI3C0LZMdu-XcGMggDEY3SmbSCxAMzdCsagvVtoDudINJ/pub?gid=0&single=true&output=csv";


let detallesOriginales = [];
let ultimoTotal = 0;
let ordenActual = "original"; 

export async function cargarDetallesProduccion(semana) {
  const empresa = dom.empresaSelect.value;
  const hacienda = dom.haciendaSelect.value;
  
   if (dom.tituloDetalle) {
    dom.tituloDetalle.innerText = `DETALLES — SEMANA ${semana}`;
  }

  dom.tablaDetalle.innerHTML = `
    <tr><td colspan="3">Cargando detalles...</td></tr>
  `;

   try {
  
    const res = await fetch(CSV_DETALLES_PRODUCCION);
    const csv = await res.text();

    const parsed = Papa.parse(csv.trim(), {
      header: true,
      skipEmptyLines: true
    });

    const filas = parsed.data || [];

    const filtrados = filas.filter(f => {
      const semOk = String(f.SEM).trim() === String(semana).trim();
      const tipoOk = String(f.TIPO || "").trim().toUpperCase() === "RECHAZO";

      const empOk = (empresa === "GLOBAL") || (String(f.EMPRESA).trim() === String(empresa).trim());
      const hacOk = (hacienda === "GLOBAL") || (String(f.HACIENDA).trim() === String(hacienda).trim());

      return semOk && tipoOk && empOk && hacOk;
    });

     if (!filtrados.length) {
      dom.tablaDetalle.innerHTML = `<tr><td colspan="3">Sin detalles</td></tr>`;
      detallesOriginales = [];
      ultimoTotal = 0;
      return;
    }

    detallesOriginales = [...filtrados];
    ultimoTotal = detallesOriginales.reduce((acc, f) => acc + (Number(f.VALOR) || 0), 0);
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
  const filas = items.map(item => `
    <tr>
      <td>${item.TIPO}</td>
      <td class="detalle-largo">${item.DETALLE}</td>
      <td>${(Number(item.VALOR) || 0).toFixed(2)}</td>
    </tr>
  `).join("");

  dom.tablaDetalle.innerHTML = `
    ${filas}
    <tr class="fila-total">
      <td colspan="2">TOTAL</td>
      <td>${(Number(total) || 0).toFixed(2)}</td>
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