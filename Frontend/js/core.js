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

// ===================== ELEMENTOS DOM 

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
  tablaDetalle: document.getElementById("tablaDetalle") || null,
  panelDetalles: document.getElementById("panel-detalles") || null,
  loader: document.getElementById("loader"),
  tituloDetalle: document.querySelector("#panel-detalles .titulo-tabla"),

};

// ===================== UTILIDADES 

export const num = v => {
  if (v === null || v === undefined) return 0;

  let s = v.toString().trim();

  // eliminar símbolos
  s = s.replace(/[$%\s]/g, "");

  // si tiene coma decimal y NO punto → convertir coma a punto
  if (s.includes(",") && !s.includes(".")) {
    s = s.replace(",", ".");
  } else {
    // si tiene miles con coma → eliminar comas
    s = s.replace(/,/g, "");
  }

  return Number(s) || 0;
};


//===================== LOADER 

const moduloCargado = {
  "Producción": false,
  "Gastos": false,
  "Liquidaciones": false,
  "Resumen": false
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


