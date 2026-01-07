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

  // ================== SELECTORES DEL MÓDULO MANO DE OBRA
  empresaSelectMano: document.getElementById("empresa-select-mano"),
  haciendaSelectMano: document.getElementById("hacienda-select-mano"),
};

// ===================== UTILIDADES 

export const num = v => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;

  let s = v.toString().trim();

  // eliminar símbolos
  s = s.replace(/[$%\s]/g, "");

  // 1️⃣ Formato miles: 1,234 | 12,345 | 123,456
  if (/^\d{1,3}(,\d{3})+$/.test(s)) {
    s = s.replace(/,/g, "");
  }

  // 2️⃣ Formato miles + decimal: 12,345.67
  else if (/^\d{1,3}(,\d{3})+\.\d+$/.test(s)) {
    s = s.replace(/,/g, "");
  }

  // 3️⃣ Formato decimal latino: 0,98 | 10,5 | 0,997
  else if (/^\d+,\d+$/.test(s)) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

//===================== LOADER 

const moduloCargado = {
  "Producción": false,
  "Gastos": false,
  "Liquidaciones": false,
  "Resumen": false,
  "Mano de Obra": false   // <=== agregado
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
