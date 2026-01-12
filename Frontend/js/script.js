/* ================================================================
            MINI SISTEMA AGRÍCOLA — SCRIPT PRINCIPAL
================================================================ */
const API_BASE = "https://minisistema-production.up.railway.app";
let cssResumen = null;

import { state, dom, num, showLoader, hideLoader } from "./core.js";
import { cargarDetallesProduccion, ordenarProduccionPorValor } from "./produccion.js";
import { cargarDetallesGastos, ordenarGastosPorValor } from "./gastos.js";
import { cargarDetallesLiquidaciones, ordenarLiquidacionesPorValor } from "./liquidaciones.js";
import { cargarResumen } from "./resumen/resumen.js";
import { initVentas } from "./ventas/ventas.js";
import { initManoObra } from "./mano_obra/mano_obra.js";


// ===================== CONSTANTES
export const MODULOS_SIN_SELECTORES = ["Resumen"];

const HECTAREAS = {
  PORVENIR: 94, ESPERANZA: 36, "EL CISNE": 13, VAQUERIA: 61.4,
  ESTRELLITA: 66.65, PRIMAVERA: 67, "LA MARIA": 252.16, "AGRO&SOL": 381.5
};

const MODULOS_CON_DETALLES = ["Producción", "Gastos", "Liquidaciones"];

const sheetURLs = {
  Producción: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRWUa0XHVhUxy79IY5bv2vppEWhA50Mye4loI4wCErMtGjSM7uP1MHWcCSb8ciUwi6YT2XO7iQhKhFq/pub?gid=0&single=true&output=csv",
  Gastos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGqKfSKtI7fdrgu6Ssz43ZFgXrrTf4B8fzWdKt6PAUJiRibhzE75cW9YNAN10T6cU3ORoqst4OTZiD/pub?gid=0&single=true&output=csv",
  Liquidaciones: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSme-Xj4jhGJVEG8QwV-plPbjvhvpEhLRY4gII1Uf85wmRBeVXa-adOqMkUl8EpQMBKvZdUg504-Zd2/pub?gid=0&single=true&output=csv"
};

const MAPA_RUBROS_GASTOS = {
  Fumigacion: "FUMIGACION", Fertilizacion: "FERTILIZANTES",
  Riego: "MATERIAL DE RIEGO", Combustible: "COMBUSTIBLE HACIENDAS",
  General: "GENERAL", TOTAL: "TOTAL"
};

// ===================== FUNCIONES DE APOYO
async function cargarModuloManoObra() {
  // 🔥 CERRAR RESUMEN SI ESTABA ABIERTO
  document.getElementById("modulo-resumen")?.style.setProperty("display", "none");
  const cssResumen = document.getElementById("css-resumen");
  const cssResumenPrint = document.getElementById("css-resumen-print");
  if (cssResumen) cssResumen.disabled = true;
  if (cssResumenPrint) cssResumenPrint.disabled = true;

// Mantener selectores globales
document.querySelector(".selectores")?.style.setProperty("display", "flex");

// Ocultar solo lo que Mano de Obra no usa
document.querySelector(".kpis")?.style.setProperty("display", "none");
document.querySelector(".zona-superior")?.style.setProperty("display", "none");
document.querySelector(".zona-inferior")?.style.setProperty("display", "none");


  // Ocultar otros módulos independientes
  document.getElementById("modulo-ventas")?.style.setProperty("display", "none");

  const cont = document.getElementById("modulo-mano-obra");
  cont.innerHTML = "";
  cont.style.display = "block";

  const html = await fetch("js/mano_obra/mano_obra.html").then(r => r.text());
  cont.innerHTML = html;

  initManoObra();
}




async function cargarModuloVentas() {
  document.querySelector(".selectores")?.style.setProperty("display", "none");
  document.querySelector(".kpis")?.style.setProperty("display", "none");
  document.querySelector(".zona-superior")?.style.setProperty("display", "none");
  document.querySelector(".zona-inferior")?.style.setProperty("display", "none");

  const cont = document.getElementById("modulo-ventas");
  cont.style.display = "block";

  const html = await fetch("js/ventas/ventas.html").then(r => r.text());
  cont.innerHTML = html;

  initVentas();
}

function cerrarModuloManoObra() {
  const cont = document.getElementById("modulo-mano-obra");
  if (!cont) return;

  cont.style.display = "none";
  cont.innerHTML = "";

  // restaurar layout general
  document.querySelector(".selectores")?.style.setProperty("display", "flex");
  document.querySelector(".kpis")?.style.setProperty("display", "flex");
  document.querySelector(".zona-superior")?.style.setProperty("display", "grid");
  document.querySelector(".zona-inferior")?.style.setProperty("display", "flex");
}


function cerrarModuloVentas() {
  const cont = document.getElementById("modulo-ventas");
  cont.style.display = "none";
  cont.innerHTML = "";

  document.querySelector(".selectores")?.style.setProperty("display", "flex");
  document.querySelector(".kpis")?.style.setProperty("display", "flex");
  document.querySelector(".zona-superior")?.style.setProperty("display", "grid");
  document.querySelector(".zona-inferior")?.style.setProperty("display", "flex");
}

function actualizarTituloModulo() {
  const icono = {
    "Resumen": "img/resumen.png",
    "Producción": "img/produccion.png",
    "Gastos": "img/gastos.png",
    "Liquidaciones": "img/liquidaciones.png",
    "Ventas": "img/iconoventas.png",
    "Mano de Obra": "img/icono.png"


  };

  const texto = {
    "Resumen": "RESUMEN EJECUTIVO",
    "Producción": "PRODUCCIÓN AGRÍCOLA",
    "Gastos": "CONTROL DE GASTOS",
    "Liquidaciones": "LIQUIDACIONES COMERCIALES",
    "Ventas": "Modulo Ventas Cacao",
    "Mano de Obra": "MANO DE OBRA"
  };

  const subtitulo = {
    "Resumen": "Resumen general de la operación",
    "Producción": "Detalles de cosecha y rendimiento",
    "Gastos": "Control y análisis de gastos",
    "Liquidaciones": "Detalle de pagos y descuentos",
    "Ventas": "Informe de ventas comerciales",
    "Mano de Obra": "Control Labores de campo"

  };

  const modulo = state.currentModule;

  if (!texto[modulo]) {
    dom.tituloPrincipal.innerText = modulo;
    return;
  }

  dom.tituloPrincipal.innerHTML = `
    <img src="${icono[modulo]}" class="icono-titulo" alt="${modulo}">
    <div class="titulo-textos">
      <span class="titulo-principal">${texto[modulo]}</span>
      <span class="titulo-subtitulo">${subtitulo[modulo] || ""}</span>
    </div>
  `;
}



function cargarEmpresas() {
  const data = state.dataModules[state.currentModule] || {};
  const empresas = Object.keys(data).filter(e => e && e !== "GLOBAL");

  dom.empresaSelect.innerHTML =
    ["GLOBAL", ...empresas]
      .map(e => `<option value="${e}">${e}</option>`)
      .join("");
}

function cargarHaciendas() {
  const e = dom.empresaSelect.value;
  const data = state.dataModules[state.currentModule] || {};

  const listaHaciendas =
    e !== "GLOBAL" && data[e]
      ? Object.keys(data[e]).filter(h => h && h !== "GLOBAL")
      : [];

  dom.haciendaSelect.innerHTML =
    ["GLOBAL", ...listaHaciendas]
      .map(h => `<option value="${h}">${h}</option>`)
      .join("");
}

// ===================== RESET DETALLES

function resetPanelDetalles() {
  if (dom.tablaDetalle) {
    dom.tablaDetalle.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; color:#888;">
          Seleccione un registro para ver el detalle 𖤘
        </td>
      </tr>
    `;
  }
  if (dom.tituloDetalle) {
    dom.tituloDetalle.innerText = "DETALLES";
  }
}

// ===================== CARGA DE DATOS

async function cargarDatosModulo(modulo) {
  showLoader(modulo);
  try {
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
  } catch (err) {
    console.error("Error cargando Google Sheets:", err);
  } finally {
    hideLoader(modulo);
  }
}

// ===================== UI PRINCIPAL

function refrescarUI() {
  actualizarTituloModulo();

  // ===============================
  // MANO DE OBRA
  // ===============================
  if (state.currentModule === "Mano de Obra") {

    // 👉 activar clase para CSS
    document.body.classList.add("modulo-mano-obra-activo");

    // 👉 mostrar selectores globales
    document.querySelector(".selectores")?.style.setProperty("display", "flex");

    // 👉 refresco propio del módulo si existe
    if (window.initManoObraRefresco) {
      window.initManoObraRefresco();
    }

    return; // ⛔ salir aquí (NO sigue flujo normal)
  }

  // ===============================
  // OTROS MÓDULOS
  // ===============================
  document.body.classList.remove("modulo-mano-obra-activo");

  // ===============================
  // RESUMEN
  // ===============================
  if (state.currentModule === "Resumen") {
    ajustarLayoutPorModulo();
    return;
  }

  // ===============================
  // PRODUCCIÓN / GASTOS / LIQUIDACIONES
  // ===============================
  if (dom.empresaSelect.options.length <= 1) {
    cargarEmpresas();
    dom.empresaSelect.value = "GLOBAL";
  }

  cargarHaciendas();
  actualizarKPIs();
  renderTabla();
  renderGrafico();
  ajustarLayoutPorModulo();
}


/* ================================================================
   KPIs 
================================================================ */
function actualizarKPIs() {
  const data = state.dataModules[state.currentModule] || {};
  const headers = state.headersModules[state.currentModule] || [];
  const empresa = dom.empresaSelect.value;
  const hacienda = dom.haciendaSelect.value;

  if (!headers.length) return;

  const SEM_COL = headers[0]; // "SEM"

  // 🔎 función para encontrar la fila SEM = 0
  const findSem0 = (arr) =>
    (arr || []).find(r => String(r[SEM_COL]) === "0") || null;

  let filaBase = null;

  /* =====================================================
     SELECCIÓN DE FILA BASE (UNA SOLA FILA)
  ===================================================== */

  // 1️⃣ GLOBAL / GLOBAL
  if (empresa === "GLOBAL" && hacienda === "GLOBAL") {
    filaBase = findSem0(data?.GLOBAL?.GLOBAL);
  }

  // 2️⃣ Empresa específica / GLOBAL
  else if (empresa !== "GLOBAL" && hacienda === "GLOBAL") {
    filaBase = findSem0(data?.[empresa]?.GLOBAL);
  }

  // 3️⃣ Empresa + Hacienda específica
  else {
    filaBase = findSem0(data?.[empresa]?.[hacienda]);
  }

  /* =====================================================
     RENDER KPIs (lectura directa desde Sheets)
  ===================================================== */
  dom.kpisContainer.innerHTML = "";

  headers.slice(3).forEach(head => {
    const valor = filaBase ? num(filaBase[head]) : 0;

    let valorFormateado = valor;

    // 🟢 GASTOS y LIQUIDACIONES en moneda
    if (state.currentModule === "Gastos" || state.currentModule === "Liquidaciones") {
      valorFormateado = `$${valor.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    } else {
      // 🔒 PRODUCCIÓN igual que antes
      valorFormateado = valor.toLocaleString("es-EC");
    }

    dom.kpisContainer.innerHTML += `
    <div class="kpi">
      <h4>${head}</h4>
      <span>${valorFormateado}</span>
    </div>
  `;
  });

}


function renderTabla() {
  const data = state.dataModules[state.currentModule] || {};
  const headers = state.headersModules[state.currentModule] || [];
  const e = dom.empresaSelect.value;
  const h = dom.haciendaSelect.value;

  state.datosFiltrados = (data[e]?.[h] || []).filter(r => r[headers[0]] !== "0");

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

      if (state.currentModule === "Liquidaciones" && hd.toLowerCase().includes("descuento")) {
        val = `
          <span class="detalle-clic"
            data-semana="${row[headers[0]]}"
            data-tipo="DESCUENTOS">
            ${val}
          </span>
        `;
      }

      return `<td>${val}</td>`;
    }).join("")}</tr>`
  ).join("");

  document.querySelectorAll(".detalle-clic").forEach(el => {
    el.onclick = () => {

      // quitar activo anterior
      document.querySelectorAll(".detalle-clic.activo")
        .forEach(a => a.classList.remove("activo"));

      // marcar el actual
      el.classList.add("activo");

      if (state.currentModule === "Producción") {
        cargarDetallesProduccion(el.dataset.semana);
      }

      if (state.currentModule === "Gastos") {
        cargarDetallesGastos(el.dataset.semana, el.dataset.rubro);
      }

      if (state.currentModule === "Liquidaciones") {
        cargarDetallesLiquidaciones(el.dataset.semana, el.dataset.tipo);
      }
    };
  });

  const hect = HECTAREAS[h?.toUpperCase()] ? ` (${HECTAREAS[h.toUpperCase()]} has)` : "";
  dom.tituloTabla.innerText = `${state.currentModule} - ${e} / ${h}${hect}`;
}

function renderGrafico(tipo = state.tipoGrafico) {
  if (state.currentModule === "Resumen") return;

  const headers = state.headersModules[state.currentModule] || [];
  if (!state.datosFiltrados.length || headers.length < 4) return;

  if (!tipo || !headers.includes(tipo)) tipo = headers[3];
  state.tipoGrafico = tipo;

  const labels = state.datosFiltrados.map(r => `Sem ${r[headers[0]]}`);

  // 🔢 valores numéricos reales (para el gráfico)
  const valores = state.datosFiltrados.map(r => num(r[tipo]));

  // 🔤 valores texto originales (para mostrar)
  const valoresTexto = state.datosFiltrados.map(r => r[tipo] ?? "");

  const maxReal = Math.max(...valores);
  const minReal = Math.min(...valores);
  let yMin, yMax;

  if (maxReal <= 2.5) {
    yMin = Math.max(0, minReal - 0.1);
    yMax = maxReal + 0.1;
  } else if (maxReal <= 50) {
    yMin = Math.floor(minReal) - 1;
    yMax = Math.ceil(maxReal) + 1;
  } else if (maxReal <= 5000) {
    yMin = Math.floor(minReal / 500) * 500;
    yMax = Math.ceil((maxReal * 1.1) / 500) * 500;
  } else {
    yMin = Math.floor(minReal / 5000) * 5000;
    if (minReal - yMin < 1000) yMin -= 5000;
    yMax = Math.ceil((maxReal * 1.05) / 5000) * 5000;
  }

  if (yMin < 0) yMin = 0;

  const ctx = document.getElementById("grafico");
  if (!ctx) return;

  if (state.chart && state.chartModulo === state.currentModule) {
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].data = valores;
    state.chart.data.datasets[0].label = tipo;
    state.chart.data.datasets[0].valoresTexto = valoresTexto;
    state.chart.options.scales.y.min = yMin;
    state.chart.options.scales.y.max = yMax;
    state.chart.update();
    return;
  }

  if (state.chart && state.chartModulo !== state.currentModule) {
    state.chart.destroy();
    state.chart = null;
  }

  state.chartModulo = state.currentModule;

  state.chart = new Chart(ctx, {
    type: "line",
    plugins: [ChartDataLabels],
    data: {
      labels,
      datasets: [{
        label: tipo,
        data: valores,
        valoresTexto, 
        fill: true,
        tension: 0.4,
        borderColor: "rgba(186,2,125,0.4)",
        backgroundColor: "rgba(186,2,125,0.25)",
        pointRadius: 3,
        borderWidth: 2,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: (_, ctx) => {
            return ctx.dataset.valoresTexto[ctx.dataIndex];
          },
          font: { weight: "bold", size: 10 },
          color: "#484848"
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: false,
          min: yMin,
          max: yMax,
          ticks: {
            callback: value => Math.round(value)
          }
        }
      }
    }
  });

  dom.tabsContainer.innerHTML = "";
  headers.slice(3).forEach(h => {
    const b = document.createElement("button");
    b.className = "tab" + (h === tipo ? " active" : "");
    b.textContent = h;
    b.onclick = () => {
      dom.tabsContainer
        .querySelectorAll(".tab")
        .forEach(t => t.classList.remove("active"));
      b.classList.add("active");
      renderGrafico(h);
    };
    dom.tabsContainer.appendChild(b);
  });
}




function ajustarLayoutPorModulo() {
  const esResumen = state.currentModule === "Resumen";

  const selectores = document.querySelector(".selectores");
  const kpis = document.querySelector(".kpis");
  const zonaSuperior = document.querySelector(".zona-superior");
  const zonaInferior = document.querySelector(".zona-inferior");

  if (selectores) selectores.style.display = esResumen ? "none" : "flex";
  if (kpis) kpis.style.display = esResumen ? "none" : "flex";
  if (zonaSuperior) zonaSuperior.style.display = esResumen ? "none" : "grid";
  if (zonaInferior) zonaInferior.style.display = esResumen ? "none" : "flex";

  if (!esResumen) {
    const zona = document.querySelector(".zona-superior");
    if (zona) {
      if (MODULOS_CON_DETALLES.includes(state.currentModule)) {
        zona.classList.remove("sin-detalles");
        if (dom.panelDetalles) dom.panelDetalles.style.display = "flex";
      } else {
        zona.classList.add("sin-detalles");
        if (dom.panelDetalles) dom.panelDetalles.style.display = "none";
      }
    }
  } else {
    if (dom.panelDetalles) dom.panelDetalles.style.display = "none";
  }

  const resumen = document.getElementById("modulo-resumen");
  if (resumen) resumen.style.display = esResumen ? "flex" : "none";

  const cssResumen = document.getElementById("css-resumen");
  const cssResumenPrint = document.getElementById("css-resumen-print");
  if (cssResumen) cssResumen.disabled = !esResumen;
  if (cssResumenPrint) cssResumenPrint.disabled = !esResumen;
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) sidebar.classList.toggle("mobile-open");
  else sidebar.classList.toggle("min");
}

// ===================== SIDEBAR

const btnToggle = document.querySelector(".sidebar-toggle");
const overlay = document.querySelector(".sidebar-overlay");

function abrirOverlaySiAplica() {
  if (window.innerWidth <= 768) overlay?.classList.add("active");
}
function cerrarOverlaySiAplica() {
  overlay?.classList.remove("active");
}
function cerrarSidebarMobile() {
  document.querySelector(".sidebar")?.classList.remove("mobile-open");
  cerrarOverlaySiAplica();
}

btnToggle?.addEventListener("click", () => {
  toggleSidebar();
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) {
    if (sidebar?.classList.contains("mobile-open")) abrirOverlaySiAplica();
    else cerrarOverlaySiAplica();
  } else {
    cerrarOverlaySiAplica();
  }
});

overlay?.addEventListener("click", cerrarSidebarMobile);

// ===================== EVENTOS

dom.moduloBtns.forEach(btn => {
  btn.onclick = () => {
    resetPanelDetalles();

    if (window.innerWidth <= 768) {
      setTimeout(() => {
        document.querySelector(".sidebar")?.classList.remove("mobile-open");
        document.querySelector(".sidebar-overlay")?.classList.remove("active");
      }, 0);
    }

    dom.moduloBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const nombreBoton = btn.innerText.trim();

    if (state.currentModule === "Ventas" && !nombreBoton.includes("VENTAS")) {
      cerrarModuloVentas();
    }
    if (state.currentModule === "Mano de Obra" && !nombreBoton.includes("MANO DE OBRA")) {
  cerrarModuloManoObra();
}


    if (nombreBoton.includes("PRODUCCIÓN")) state.currentModule = "Producción";
    else if (nombreBoton.includes("GASTOS")) state.currentModule = "Gastos";
    else if (nombreBoton.includes("LIQUIDACIONES")) state.currentModule = "Liquidaciones";
    else if (nombreBoton.includes("VENTAS")) state.currentModule = "Ventas";
    else if (nombreBoton.includes("MANO DE OBRA")) state.currentModule = "Mano de Obra";
    else if (nombreBoton.includes("RESUMEN")) state.currentModule = "Resumen";


    dom.empresaSelect.innerHTML = "";
    dom.haciendaSelect.innerHTML = "";
    actualizarTituloModulo();

    if (state.currentModule === "Ventas") {
      cargarModuloVentas();
      return;
    }

    if (state.currentModule === "Mano de Obra") {
      cargarModuloManoObra();
      return;
    }

    if (state.currentModule === "Resumen") cargarResumen();
    else cargarDatosModulo(state.currentModule);

    ajustarLayoutPorModulo();

  };
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("#btnOrdenValor");
  if (!btn) return;

  if (state.currentModule === "Gastos") ordenarGastosPorValor();
  if (state.currentModule === "Producción") ordenarProduccionPorValor();
  if (state.currentModule === "Liquidaciones") ordenarLiquidacionesPorValor();
});

dom.empresaSelect.onchange = () => {
  cargarHaciendas();
  refrescarUI();
  resetPanelDetalles();
};

dom.haciendaSelect.onchange = () => {
  actualizarKPIs();
  renderTabla();
  renderGrafico();
  resetPanelDetalles();
};

//===================== INICIO
document.getElementById("modulo-resumen").style.display = "none";
document.querySelector(".selectores").style.display = "flex";
dom.kpisContainer.style.display = "flex";
document.querySelector(".zona-superior").style.display = "grid";
document.querySelector(".zona-inferior").style.display = "flex";
cssResumen = document.getElementById("css-resumen");
if (cssResumen) cssResumen.disabled = true;

cargarDatosModulo(state.currentModule);
