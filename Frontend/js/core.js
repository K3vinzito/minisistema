/* ================================================================
   CORE — Funciones compartidas por todos los módulos
================================================================ */

export const state = {
  currentModule: "Producción",
  dataModules: {},
  headersModules: {},
  datosFiltrados: [],
  chart: null,
  tipoGrafico: null
};

/* ===================== ELEMENTOS DOM ===================== */

export const dom = {
  moduloBtns: document.querySelectorAll(".menu-item"),
  empresaSelect: document.getElementById("empresaSelect"),
  haciendaSelect: document.getElementById("haciendaSelect"),
  tablaBody: document.getElementById("tablaBody"),
  theadTabla: document.getElementById("theadTabla"),
  tituloTabla: document.getElementById("titulo-tabla"),
  tituloPrincipal: document.getElementById("titulo"),
  tabsContainer: document.querySelector(".tabs"),
  kpisContainer: document.querySelector(".kpis"),
  tablaDetalle: document.getElementById("tablaDetalle"),
  panelDetalles: document.getElementById("panel-detalles"),
  loader: document.getElementById("loader")
};

/* ===================== UTILIDADES ===================== */

export const num = v => +((v || "0").toString().replace(/[$,%\s]/g, "")) || 0;

/* ===================== LOADER ===================== */

const moduloCargado = {
  "Producción": false,
  "Gastos": false,
  "Liquidaciones": false,
  "Resumen": false   // 👈 NUEVO
};


export function showLoader(modulo) {
  dom.loader.style.display = "flex";
  requestAnimationFrame(() => {
    dom.loader.style.opacity = "1";
  });
}


export function hideLoader(modulo) {
  dom.loader.style.opacity = "0";
  setTimeout(() => {
    dom.loader.style.display = "none";
    if (modulo) {
      moduloCargado[modulo] = true;
    }
  }, 350);
}


