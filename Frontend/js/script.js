
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




// ===================== CONSTANTES 
export const MODULOS_SIN_SELECTORES = ["Resumen"];


const HECTAREAS = {
  PORVENIR: 94, ESPERANZA: 36, "EL CISNE": 13, VAQUERIA: 61.4,
  ESTRELLITA: 66.65, PRIMAVERA: 67, "LA MARIA": 252.16, "AGRO&SOL": 381.5
};

//const MODULOS_CON_DETALLES = ["Producción", "Gastos"];
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

async function cargarModuloVentas() {
  // esconder UI normal (selectores, kpis, tabla, gráfico) si quieres que ventas sea pantalla completa
  document.querySelector(".selectores")?.style.setProperty("display", "none");
  document.querySelector(".kpis")?.style.setProperty("display", "none");
  document.querySelector(".zona-superior")?.style.setProperty("display", "none");
  document.querySelector(".zona-inferior")?.style.setProperty("display", "none");

  // mostrar contenedor ventas
  const cont = document.getElementById("modulo-ventas");
  cont.style.display = "block";

  // inyectar html
  const html = await fetch("js/ventas/ventas.html").then(r => r.text());
  cont.innerHTML = html;

  // iniciar lógica
  initVentas();
}

function cerrarModuloVentas() {
  //destroyVentas();

  const cont = document.getElementById("modulo-ventas");
  cont.style.display = "none";
  cont.innerHTML = "";

  // restaurar UI normal
  document.querySelector(".selectores")?.style.setProperty("display", "flex");
  document.querySelector(".kpis")?.style.setProperty("display", "flex");
  document.querySelector(".zona-superior")?.style.setProperty("display", "grid");
  document.querySelector(".zona-inferior")?.style.setProperty("display", "flex");
}



function actualizarTituloModulo() {
  if (state.currentModule === "Resumen") {
    dom.tituloPrincipal.innerText = "RESUMEN EJECUTIVO";
    return;
  }

  dom.tituloPrincipal.innerText =
    state.currentModule === "Producción" ? "PRODUCCIÓN AGRÍCOLA" :
      state.currentModule === "Gastos" ? "CONTROL DE GASTOS" :
        state.currentModule === "Liquidaciones" ? "LIQUIDACIONES COMERCIALES" :
          state.currentModule === "Ventas" ? "" :
            state.currentModule;
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

  // SI ES RESUMEN, NO EJECUTAR UI GLOBAL
  if (state.currentModule === "Resumen") {
    ajustarLayoutPorModulo();
    return;
  }

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

function actualizarKPIs() {
  const data = state.dataModules[state.currentModule] || {};
  const headers = state.headersModules[state.currentModule] || [];
  const e = dom.empresaSelect.value;
  const h = dom.haciendaSelect.value;

  let filasParaSumar = [];
  if (e === "GLOBAL") {
    Object.values(data).forEach(empresas => {
      Object.values(empresas).forEach(haciendas => {
        const filaCero = haciendas.find(r => r[headers[0]] === "0");
        if (filaCero) filasParaSumar.push(filaCero);
      });
    });
  } else if (h === "GLOBAL") {
    Object.values(data[e] || {}).forEach(haciendas => {
      const filaCero = haciendas.find(r => r[headers[0]] === "0");
      if (filaCero) filasParaSumar.push(filaCero);
    });
  } else {
    const fila = (data[e]?.[h] || []).find(r => r[headers[0]] === "0");
    if (fila) filasParaSumar.push(fila);
  }

  dom.kpisContainer.innerHTML = "";
  headers.slice(3).forEach(head => {
    const totalKpi = filasParaSumar.reduce((acc, curr) => acc + num(curr[head]), 0);
    dom.kpisContainer.innerHTML += `
      <div class="kpi">
        <h4>${head}</h4>
        <span>${totalKpi.toLocaleString()}</span>
      </div>`;
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
      if (
        state.currentModule === "Liquidaciones" &&
        hd.toLowerCase().includes("descuento")
      ) {
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
      if (state.currentModule === "Producción") cargarDetallesProduccion(el.dataset.semana);
      if (state.currentModule === "Gastos") cargarDetallesGastos(el.dataset.semana, el.dataset.rubro);
      if (state.currentModule === "Liquidaciones") {
        cargarDetallesLiquidaciones(
          el.dataset.semana,
          el.dataset.tipo
        );
      }
    };
  });



  const hect = HECTAREAS[h?.toUpperCase()] ? ` (${HECTAREAS[h.toUpperCase()]} has)` : "";
  dom.tituloTabla.innerText = `${state.currentModule} - ${e} / ${h}${hect}`;
}

//funcion para resetera detalles

function resetPanelDetalles() {
  if (dom.tablaDetalle) {
    dom.tablaDetalle.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; color:#888;">
          Seleccione un registro para ver el detalle
        </td>
      </tr>
    `;
  }

  if (dom.tituloDetalle) {
    dom.tituloDetalle.innerText = "DETALLES";
  }
}


//============== GRAFICO

function renderGrafico(tipo = state.tipoGrafico) {
  if (state.currentModule === "Resumen") return;

  const headers = state.headersModules[state.currentModule] || [];
  if (!state.datosFiltrados.length || headers.length < 4) return;

  if (!tipo || !headers.includes(tipo)) tipo = headers[3];
  state.tipoGrafico = tipo;

  const labels = state.datosFiltrados.map(r => `Sem ${r[headers[0]]}`);
  const valores = state.datosFiltrados.map(r => num(r[tipo]));

  const maxReal = Math.max(...valores);
  const minReal = Math.min(...valores);
  let yMin, yMax;

  // --- ESCALA DINÁMICA ---
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

  // 🔁 REUTILIZAR GRÁFICO SI ES EL MISMO MÓDULO
  if (state.chart && state.chartModulo === state.currentModule) {
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].data = valores;
    state.chart.data.datasets[0].label = tipo;
    state.chart.options.scales.y.min = yMin;
    state.chart.options.scales.y.max = yMax;
    state.chart.update();
    return;
  }

  // 🧹 DESTRUIR SOLO SI CAMBIÓ EL MÓDULO
  if (state.chart && state.chartModulo !== state.currentModule) {
    state.chart.destroy();
    state.chart = null;
  }

  // 🆕 CREAR GRÁFICO
  state.chart = new Chart(ctx, {
    type: "line",
    plugins: [ChartDataLabels],
    data: {
      labels,
      datasets: [{
        label: tipo,
        data: valores,
        fill: true,
        tension: 0.4,
        borderColor: "rgba(186,2,125,0.4)",
        backgroundColor: "rgba(186,2,125,0.25)",
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: "easeOutQuart"
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: (value) => {
            if (maxReal <= 50) {
              return value.toLocaleString("es-EC", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
            }
            return Math.round(value).toLocaleString("es-EC");
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
            callback: (value) => {
              if (maxReal <= 50) {
                return value.toLocaleString("es-EC", { minimumFractionDigits: 1 });
              }
              return value.toLocaleString("es-EC");
            }
          }
        }
      }
    }
  });

  // 🔐 REGISTRAR MÓDULO ACTUAL DEL GRÁFICO
  state.chartModulo = state.currentModule;

  // ===== TABS DE MÉTRICAS
  dom.tabsContainer.innerHTML = "";
  headers.slice(3).forEach(h => {
    const b = document.createElement("button");
    b.className = "tab" + (h === tipo ? " active" : "");
    b.textContent = h;
    b.onclick = () => renderGrafico(h);
    dom.tabsContainer.appendChild(b);
  });
}


function ajustarLayoutPorModulo() {
  const esResumen = state.currentModule === "Resumen";

  // ===== VISTA GLOBAL (selectores, KPIs, tablas, gráfico) 
  const selectores = document.querySelector(".selectores");
  const kpis = document.querySelector(".kpis");
  const zonaSuperior = document.querySelector(".zona-superior");
  const zonaInferior = document.querySelector(".zona-inferior");

  if (selectores) selectores.style.display = esResumen ? "none" : "flex";
  if (kpis) kpis.style.display = esResumen ? "none" : "flex";
  if (zonaSuperior) zonaSuperior.style.display = esResumen ? "none" : "grid";
  if (zonaInferior) zonaInferior.style.display = esResumen ? "none" : "flex";

  // ===== PANEL DETALLES (solo para Producción y Gastos)
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
    // En Resumen, no existe sentido para detalles
    if (dom.panelDetalles) dom.panelDetalles.style.display = "none";
  }

  // ===== MÓDULO RESUMEN 
  const resumen = document.getElementById("modulo-resumen");
  if (resumen) resumen.style.display = esResumen ? "flex" : "none";

  // ===== CSS DEL RESUMEN  
  const cssResumen = document.getElementById("css-resumen");
  const cssResumenPrint = document.getElementById("css-resumen-print");
  if (cssResumen) cssResumen.disabled = !esResumen;
  if (cssResumenPrint) cssResumenPrint.disabled = !esResumen;
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");

  if (window.innerWidth <= 768) {

    sidebar.classList.toggle("mobile-open");
  } else {

    sidebar.classList.toggle("min");
  }
}

// ===================== SIDEBAR (UN SOLO CONTROL) 

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

  // sincronizar overlay con estado real del sidebar en móvil
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) {
    if (sidebar?.classList.contains("mobile-open")) abrirOverlaySiAplica();
    else cerrarOverlaySiAplica();
  } else {
    // en desktop nunca overlay
    cerrarOverlaySiAplica();
  }
});

/* Click fuera (overlay) */
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

    if (nombreBoton.includes("PRODUCCIÓN")) state.currentModule = "Producción";
    else if (nombreBoton.includes("GASTOS")) state.currentModule = "Gastos";
    else if (nombreBoton.includes("LIQUIDACIONES")) state.currentModule = "Liquidaciones";
    else if (nombreBoton.includes("RESUMEN")) state.currentModule = "Resumen";
    else if (nombreBoton.includes("VENTAS")) state.currentModule = "Ventas";

    dom.empresaSelect.innerHTML = "";
    dom.haciendaSelect.innerHTML = "";
    actualizarTituloModulo();

    if (state.currentModule === "Ventas") {
      cargarModuloVentas();
      return;
    }

    if (state.currentModule === "Resumen") {
      cargarResumen();
    } else {
      cargarDatosModulo(state.currentModule);
    }

    ajustarLayoutPorModulo();
  };
});


document.addEventListener("click", (e) => {
  const btn = e.target.closest("#btnOrdenValor");
  if (!btn) return;

  if (state.currentModule === "Gastos") {
    ordenarGastosPorValor();
  }

  if (state.currentModule === "Producción") {
    ordenarProduccionPorValor();
  }

  if (state.currentModule === "Liquidaciones") {
    ordenarLiquidacionesPorValor();
  }
});




dom.empresaSelect.onchange = () => { cargarHaciendas(); refrescarUI();  resetPanelDetalles(); };
dom.haciendaSelect.onchange = () => { actualizarKPIs(); renderTabla(); renderGrafico();   resetPanelDetalles();};

//===================== INICIO 
// Restaurar UI normal
document.getElementById("modulo-resumen").style.display = "none";
document.querySelector(".selectores").style.display = "flex";
dom.kpisContainer.style.display = "flex";
document.querySelector(".zona-superior").style.display = "grid";
document.querySelector(".zona-inferior").style.display = "flex";
cssResumen = document.getElementById("css-resumen");
if (cssResumen) cssResumen.disabled = true;

cargarDatosModulo(state.currentModule);

