/* ================================================================
   MINI SISTEMA AGRÍCOLA — SCRIPT PRINCIPAL (ESTABLE)
================================================================ */
const API_BASE = "https://minisistema-production.up.railway.app/";

import { state, dom, num, showLoader, hideLoader } from "./core.js";
import { cargarDetallesProduccion } from "./produccion.js";
import { cargarDetallesGastos } from "./gastos.js";

/* ===================== CONSTANTES ===================== */

const HECTAREAS = {
  PORVENIR: 94,
  ESPERANZA: 36,
  "EL CISNE": 13,
  VAQUERIA: 61.4,
  ESTRELLITA: 66.65,
  PRIMAVERA: 67,
  "LA MARIA": 252.16,
  "AGRO&SOL": 381.5
};

const MODULOS_CON_DETALLES = ["Producción", "Gastos"];

const sheetURLs = {
  Producción: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRWUa0XHVhUxy79IY5bv2vppEWhA50Mye4loI4wCErMtGjSM7uP1MHWcCSb8ciUwi6YT2XO7iQhKhFq/pub?gid=0&single=true&output=csv",
  Gastos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGqKfSKtI7fdrgu6Ssz43ZFgXrrTf4B8fzWdKt6PAUJiRibhzE75cW9YNAN10T6cU3ORoqst4OTZiD/pub?gid=0&single=true&output=csv",
  Liquidaciones: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSme-Xj4jhGJVEG8QwV-plPbjvhvpEhLRY4gII1Uf85wmRBeVXa-adOqMkUl8EpQMBKvZdUg504-Zd2/pub?gid=0&single=true&output=csv"
};

const MAPA_RUBROS_GASTOS = {
  Fumigacion: "FUMIGACION",
  Fertilizacion: "FERTILIZANTES",
  Riego: "MATERIAL DE RIEGO",
  Combustible: "COMBUSTIBLE HACIENDAS",
  General: "GENERAL",
  TOTAL: "TOTAL"
};

/* ===================== TITULO ===================== */

function actualizarTituloModulo() {
  dom.tituloPrincipal.innerText =
    state.currentModule === "Producción" ? "PRODUCCIÓN AGRÍCOLA" :
    state.currentModule === "Gastos" ? "CONTROL DE GASTOS" :
    state.currentModule === "Liquidaciones" ? "LIQUIDACIONES COMERCIALES" :
    state.currentModule;
}

/* ===================== CARGA DE DATOS ===================== */

async function cargarDatosModulo(modulo) {
  showLoader(modulo);

  if (state.dataModules[modulo]) {
    refrescarUI();
    hideLoader(modulo);
    return;
  }

  const res = await fetch(sheetURLs[modulo]);
  const csv = await res.text();
  const parsed = Papa.parse(csv.trim(), { skipEmptyLines: true });
  const lines = parsed.data;
  if (!lines.length) return;

  const headers = lines[0];
  state.headersModules[modulo] = headers;

  const data = {};
  for (const row of lines.slice(1)) {
    const empresa = row[1];
    const hacienda = row[2];
    if (!empresa || !hacienda) continue;

    data[empresa] ??= {};
    data[empresa][hacienda] ??= [];

    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i] ?? ""));
    data[empresa][hacienda].push(obj);
  }

  state.dataModules[modulo] = data;
  refrescarUI();
  hideLoader(modulo);
}

/* ===================== UI ===================== */

function refrescarUI() {
  actualizarTituloModulo();
  cargarEmpresas();
  dom.empresaSelect.value = "GLOBAL";

  cargarHaciendas();
  dom.haciendaSelect.value = "GLOBAL";

  actualizarKPIs();
  renderTabla();
  renderGrafico();
  ajustarLayoutPorModulo();
}

function cargarEmpresas() {
  const data = state.dataModules[state.currentModule] || {};
  dom.empresaSelect.innerHTML =
    ["GLOBAL", ...Object.keys(data)].map(e => `<option>${e}</option>`).join("");
}

function cargarHaciendas() {
  const e = dom.empresaSelect.value;
  const data = state.dataModules[state.currentModule] || {};
  dom.haciendaSelect.innerHTML =
    ["GLOBAL", ...(data[e] ? Object.keys(data[e]) : [])]
      .map(h => `<option>${h}</option>`).join("");
}

/* ===================== KPIs ===================== */

function actualizarKPIs() {
  const data = state.dataModules[state.currentModule] || {};
  const headers = state.headersModules[state.currentModule] || [];
  const e = dom.empresaSelect.value;
  const h = dom.haciendaSelect.value;

  const fila = (data[e]?.[h] || []).find(r => r[headers[0]] === "0");

  dom.kpisContainer.innerHTML = "";
  headers.slice(3).forEach(head => {
    dom.kpisContainer.innerHTML += `
      <div class="kpi">
        <h4>${head}</h4>
        <span>${fila ? fila[head] : "0"}</span>
      </div>`;
  });
}

/* ===================== TABLA ===================== */

function renderTabla() {
  const data = state.dataModules[state.currentModule] || {};
  const headers = state.headersModules[state.currentModule] || [];
  const e = dom.empresaSelect.value;
  const h = dom.haciendaSelect.value;

  state.datosFiltrados =
    (data[e]?.[h] || []).filter(r => r[headers[0]] !== "0");

  const headersTabla = headers.filter((_, i) => i !== 1 && i !== 2);
  dom.theadTabla.innerHTML = headersTabla.map(h => `<th>${h}</th>`).join("");

  dom.tablaBody.innerHTML = state.datosFiltrados.map(row =>
    `<tr>${headersTabla.map(hd => {
      let val = row[hd] ?? "";

      if (state.currentModule === "Producción" && hd.toLowerCase().includes("rechazado")) {
        val = `<span class="detalle-clic" data-semana="${row[headers[0]]}">${val}</span>`;
      }

      if (state.currentModule === "Gastos" && MAPA_RUBROS_GASTOS[hd]) {
        val = `<span class="detalle-clic" data-semana="${row[headers[0]]}" data-rubro="${MAPA_RUBROS_GASTOS[hd]}">${val}</span>`;
      }

      return `<td>${val}</td>`;
    }).join("")}</tr>`
  ).join("");

  document.querySelectorAll(".detalle-clic").forEach(el => {
    el.onclick = () => {
      if (state.currentModule === "Producción")
        cargarDetallesProduccion(el.dataset.semana);
      if (state.currentModule === "Gastos")
        cargarDetallesGastos(el.dataset.semana, el.dataset.rubro);
    };
  });

  const hect = HECTAREAS[h?.toUpperCase()] ? ` (${HECTAREAS[h.toUpperCase()]} has)` : "";
  dom.tituloTabla.innerText = `${state.currentModule} - ${e} / ${h}${hect}`;
}

/* ===================== GRÁFICO ===================== */

function renderGrafico(tipo = state.tipoGrafico) {
  const headers = state.headersModules[state.currentModule] || [];
  if (!state.datosFiltrados.length || headers.length < 4) return;

  if (!tipo) {
    tipo = headers[3];
    state.tipoGrafico = tipo;
  }

  const labels = state.datosFiltrados.map(r => `Sem ${r[headers[0]]}`);
  const valores = state.datosFiltrados.map(r => num(r[tipo]));

  const max = Math.max(...valores);
  const margen = max * 0.1;

  if (!state.chart) {
    state.chart = new Chart(document.getElementById("grafico"), {
      type: "line",
      data: { labels, datasets: [{ label: tipo, data: valores, fill: true, tension: 0.4,
        borderColor: "rgba(186,2,125,0.4)", backgroundColor: "rgba(186,2,125,0.25)",
        pointRadius: 0, pointHoverRadius: 5 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { suggestedMax: max + margen } }
      }
    });
  } else {
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].label = tipo;
    state.chart.data.datasets[0].data = valores;
    state.chart.options.scales.y.suggestedMax = max + margen;
    state.chart.update();
  }

  dom.tabsContainer.innerHTML = "";
  headers.slice(3).forEach(h => {
    const b = document.createElement("button");
    b.className = "tab" + (h === tipo ? " active" : "");
    b.textContent = h;
    b.onclick = () => renderGrafico(h);
    dom.tabsContainer.appendChild(b);
  });
}

/* ===================== LAYOUT ===================== */

function ajustarLayoutPorModulo() {
  const zona = document.querySelector(".zona-superior");
  if (MODULOS_CON_DETALLES.includes(state.currentModule)) {
    zona.classList.remove("sin-detalles");
    dom.panelDetalles.style.display = "flex";
  } else {
    zona.classList.add("sin-detalles");
    dom.panelDetalles.style.display = "none";
    dom.tablaDetalle.innerHTML = "";
  }
}

/* ===================== EVENTOS ===================== */

dom.moduloBtns.forEach(btn => {
  btn.onclick = () => {
    dom.moduloBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    state.currentModule =
      btn.dataset.modulo === "produccion" ? "Producción" :
      btn.dataset.modulo === "gastos" ? "Gastos" :
      btn.dataset.modulo === "liquidaciones" ? "Liquidaciones" :
      state.currentModule;

    cargarDatosModulo(state.currentModule);
  };
});

dom.empresaSelect.onchange = refrescarUI;
dom.haciendaSelect.onchange = () => {
  actualizarKPIs();
  renderTabla();
  renderGrafico();
};

/* ===================== INICIO ===================== */

cargarDatosModulo(state.currentModule);
