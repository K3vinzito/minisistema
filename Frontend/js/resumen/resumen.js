/* ================================================================
   MÓDULO RESUMEN — KPIs IZQUIERDA + GASTOS DERECHA COMPACTO
================================================================ */

import { showLoader, hideLoader } from "../core.js";
// ================= CLAVES INTERNAS DE COLUMNAS 
const COL = {
  SEM: "SEM",
  DEV_IVA: "DEV. IVA",
  V_RECH: "V. RECHAZO",
  ARR_VILLA: "ARR. VILLA/ECHEV.",
  REEMB: "REFEMB. OLSOS",
  TOTAL_FRUTA: "TOTAL FRUTA",
  TOTAL_INGRESOS: "TOTAL INGRESOS",

  ARRIENDO: "ARRIENDO",
  MO_ADM: "M.O ADM",
  MO_AGRIC: "M.O AGRIC.",
  MO_EMBAR: "M.O EMBAR.",
  SRI: "SRI",
  IESS: "IESS",
  MRL: "MRL",
  LUZ: "LUZ",
  ACTIVOS_FIJOS: "ACTIVOS FIJOS",
  RIEGO: "RIEGO",
  COMBUSTIBLE: "COMBUSTIBLE",
  COMPRAS: "COMPRAS",

  TOTAL_GASTOS: "TOTAL GASTOS",
  UTILIDAD: "UTILIDAD PRODUCTIVA"
};


const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRk5A0GczheFss5URcUT0kHoaCEQvnPlLHBYJNjKULyhfLgolqwjqwttJlNTr50_mzxEByQ6yaCNCPS/pub?gid=0&single=true&output=csv";

const tablaFlujo = document.querySelector(".tabla-flujo tbody");
const theadFlujo = document.querySelector(".tabla-flujo thead tr");

const totalUtilidadElem = document.querySelector(".card-saldo .saldo-principal strong");
const ingresosElem = document.querySelector(".card-saldo .saldo-detalle div:nth-child(1) span");
const egresosElem = document.querySelector(".card-saldo .saldo-detalle div:nth-child(2) span");

const resumenEmpresaSelect = document.getElementById("resumenEmpresaSelect");
const resumenHaciendaSelect = document.getElementById("resumenHaciendaSelect");

const contenedorKPIs = document.querySelector(".card-saldo");

let datosOriginales = [];
let headers = [];
const colorValor = v => v >= 0 ? "#0b5394" : "#a73b3e";

function formatoUSD(valor) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

// ================= CARGA CSV

export function cargarResumen() {

  showLoader("Resumen");

  Papa.parse(SHEET_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: ({ data, meta }) => {

      datosOriginales = data
        .map(f => ({
          ...f,
          EMPRESA: (f.EMPRESA || "").trim(),
          HACIENDA: (f.HACIENDA || "").trim()
        }))
        .filter(f => f.EMPRESA && f.HACIENDA);

      headers = meta.fields;

      llenarEmpresas();
      renderTablaResumen();
      insertarCarteraMinimalista();

      hideLoader("Resumen");
    },
    error: () => {
      hideLoader("Resumen");
      alert("Error cargando resumen");
    }
  });
}

function llenarEmpresas() {
  let empresas = [...new Set(datosOriginales.map(f => f.EMPRESA))];

  if (empresas.includes("GLOBAL")) {
    empresas = ["GLOBAL", ...empresas.filter(e => e !== "GLOBAL")];
  }

  resumenEmpresaSelect.innerHTML = "";
  empresas.forEach(e => resumenEmpresaSelect.append(new Option(e, e)));
  resumenEmpresaSelect.value = "GLOBAL";

  actualizarHaciendas();
}


function actualizarHaciendas() {
  const empresa = resumenEmpresaSelect.value;
  let haciendas = [...new Set(
    datosOriginales
      .filter(f => f.EMPRESA === empresa)
      .map(f => f.HACIENDA)
  )];

  if (haciendas.includes("GLOBAL")) {
    haciendas = ["GLOBAL", ...haciendas.filter(h => h !== "GLOBAL")];
  }

  resumenHaciendaSelect.innerHTML = "";
  haciendas.forEach(h => resumenHaciendaSelect.append(new Option(h, h)));
  resumenHaciendaSelect.value = "GLOBAL";
}

function filtrarDatos() {
  return datosOriginales.filter(f =>
    f.EMPRESA === resumenEmpresaSelect.value &&
    f.HACIENDA === resumenHaciendaSelect.value
  );
}

// ================= TABLA + KPIs 
const HEADER_MAP = {
  [COL.SEM]: "SEM",
  [COL.DEV_IVA]: "DEV. IVA",
  [COL.V_RECH]: "V. RECH",
  [COL.ARR_VILLA]: "ARR.<br>VILLA/CHEV.",
  [COL.REEMB]: "REFEMB.<br>OLS",
  [COL.TOTAL_FRUTA]: "TOTAL FRUTA",
  [COL.TOTAL_INGRESOS]: "TOTAL<br>INGRESOS",

  [COL.ARRIENDO]: "ARRIENDO",
  [COL.MO_ADM]: "M.O ADM",
  [COL.MO_AGRIC]: "M.O AGRIC",
  [COL.MO_EMBAR]: "M.O EMB",
  [COL.SRI]: "SRI",
  [COL.IESS]: "IESS",
  [COL.MRL]: "MRL",
  [COL.LUZ]: "LUZ",
  [COL.ACTIVOS_FIJOS]: "ACTIVOS<br>FIJOS",
  [COL.RIEGO]: "RIEGO",
  [COL.COMBUSTIBLE]: "COMBUSTIBLE",
  [COL.COMPRAS]: "COMPRAS",

  [COL.TOTAL_GASTOS]: "TOTAL<br>GASTOS",
  [COL.UTILIDAD]: "UTILIDAD<br>PRODUCTIVA"
};

// En resumen.js
function renderTablaResumen() {
  const datos = filtrarDatos();
  const cols = headers.filter(h =>
    !h.toLowerCase().includes("empresa") &&
    !h.toLowerCase().includes("hacienda")
  );

  // 1. RENDERIZADO DE HEADERS
  theadFlujo.innerHTML = "";
  let idxSEM = -1;
  let idxUtilProd = -1;

  cols.forEach((c, i) => {
    const th = document.createElement("th");
    th.dataset.col = c;
    th.innerHTML = HEADER_MAP[c] || c;

    const name = c.toLowerCase();
    if (name === "sem") idxSEM = i;
    if (name.includes("utilidad productiva")) {
      idxUtilProd = i;
      th.style.background = "#fff6cc";
    }
    theadFlujo.appendChild(th);
  });

  // 2. RENDERIZADO DE FILAS Y CÁLCULO DE TOTALES
  const totales = Object.fromEntries(cols.map(c => [c, 0]));
  tablaFlujo.innerHTML = "";

  let semanasGanancia = 0;
  let semanasPerdida = 0;

  datos.forEach(fila => {
    const tr = document.createElement("tr");
    cols.forEach((c, i) => {
      const td = document.createElement("td");
      td.dataset.col = c;
      const txt = fila[c] || "$0.00";
      const num = parseFloat(txt.replace(/[$,]/g, "")) || 0;
      totales[c] += num;
      td.textContent = txt;

      const name = c.toLowerCase();

      // Colores de fondo suaves
      if (name.includes("total ingresos")) td.style.background = "#d8f0d8";
      if (name.includes("total egresos") || name.includes("total gastos")) td.style.background = "#f8d8d8";

      // Estilos especiales SEM y Utilidad
      if (i === idxSEM) {
        td.style.background = "#f3f3f3";
        td.style.fontWeight = "600";
      }
      if (i === idxUtilProd) {
        td.style.background = num < 0 ? "#f8d8d8" : "#fff9d9";
        td.style.fontWeight = "600";
        if (num >= 0) semanasGanancia++;
        else semanasPerdida++;
      }
      tr.appendChild(td);
    });
    tablaFlujo.appendChild(tr);
  });

  // 3. ACTUALIZAR INFO DE SEMANAS (Ganancia vs Pérdida)
  const titulo = document.querySelector(".card-tabla h3, .card-tabla h2, .card-tabla .tabla-header h3");
  if (titulo) {
    let info = titulo.querySelector(".semanas-info");
    if (!info) {
      info = document.createElement("span");
      info.className = "semanas-info";
      info.style.fontSize = "13px";
      info.style.fontWeight = "500";
      info.style.color = "#888";
      info.style.marginLeft = "10px";
      titulo.appendChild(info);
    }
    info.textContent = `Semanas en Ganancia: ${semanasGanancia} - Semanas en Pérdida: ${semanasPerdida}`;
  }

  // 4. FILA TOTAL (Sticky al final)
  const trTotal = document.createElement("tr");
  trTotal.className = "total";

  cols.forEach((c, i) => {
    const td = document.createElement("td");
    const name = c.toLowerCase();

    if (i === 0) {
      td.textContent = "TOTAL";
    } else {
      const v = totales[c];
      td.textContent = formatoUSD(v);
      td.style.color = colorValor(v);

      if (name.includes("total ingresos")) td.style.background = "#b3e6b3";
      if (name.includes("total egresos") || name.includes("total gastos")) td.style.background = "#f0b3b3";
      if (i === idxUtilProd) {
        td.style.background = v < 0 ? "#f0b3b3" : "#ffe699";
        td.style.fontSize = "15px";
      }
    }
    trTotal.appendChild(td);
  });
  tablaFlujo.appendChild(trTotal);

  // 5. RESTAURACIÓN DE GRÁFICOS Y KPIs
  let totalIngresos = 0;

  cols.forEach(c => {
    const v = totales[c] || 0;
    const k = c.toLowerCase();

    if (c === COL.TOTAL_INGRESOS) {
      ingresosElem.textContent = formatoUSD(v);
      ingresosElem.style.color = "#1b5e20";
      totalIngresos = v;
    }
    if (k.includes("egresos") || k.includes("gastos")) {
      egresosElem.textContent = formatoUSD(v);
      egresosElem.style.color = "#7a1f1f";
    }
    if (c === COL.UTILIDAD) {
      totalUtilidadElem.textContent = formatoUSD(v);
      totalUtilidadElem.style.color = colorValor(v);

      // ===== BAR RITA SEGÚN UTILIDAD 
      const barrita = document.querySelector(".barrita-imagen");
      if (barrita) {
        if (v < 0) {
          barrita.classList.add("barrita-negativa");
        } else {
          barrita.classList.remove("barrita-negativa");
        }
      }
    }

  });

  renderGastos(totalIngresos, datos, cols);
}


// ================= FUNCION LISTA DE GASTOS CON PORCENTAJES SUAVES 

function renderGastos(totalIngresos, datos, cols) {
  const derecha = document.querySelector(".card-saldo .gastos-lista");
  if (!derecha) return;

  derecha.innerHTML = "";

  const idxTotalIngreso = cols.indexOf(COL.TOTAL_INGRESOS);

  const idxTotalEgreso = cols.findIndex(c =>
    c.toLowerCase().includes("total egresos") ||
    c.toLowerCase().includes("total gastos")
  );

  if (idxTotalIngreso === -1 || idxTotalEgreso === -1) return;

  const gastosCols = cols.slice(idxTotalIngreso + 1, idxTotalEgreso);

  const totalGastos = gastosCols.reduce((sum, col) =>
    sum + datos.reduce((a, f) =>
      a + (parseFloat((f[col] || "0").replace(/[$,]/g, "")) || 0), 0
    ), 0
  );

  const maxValor = Math.max(totalIngresos, totalGastos);

  // ===== helper 
  function crearFila(labelText, valor, color) {
    const fila = document.createElement("div");
    fila.className = "gasto-item";

    const label = document.createElement("div");
    label.className = "gasto-label";

    const bullet = document.createElement("span");
    bullet.className = "gasto-bullet";
    bullet.style.backgroundColor = color;

    label.appendChild(bullet);
    label.appendChild(document.createTextNode(labelText));

    const barra = document.createElement("div");
    barra.className = "gasto-barra";

    const barraColor = document.createElement("div");
    barraColor.className = "gasto-barra-color";
    barraColor.style.backgroundColor = color;

    const porcentaje = document.createElement("span");
    porcentaje.className = "gasto-porcentaje";
    porcentaje.textContent =
      totalIngresos > 0
        ? `${Math.round((valor / totalIngresos) * 100)}%`
        : "0%";

    barra.appendChild(barraColor);
    barra.appendChild(porcentaje);

    fila.appendChild(label);
    fila.appendChild(barra);
    derecha.appendChild(fila);

    // animación
    requestAnimationFrame(() => {
      barraColor.style.width =
        maxValor > 0 ? `${(valor / maxValor) * 100}%` : "0%";
    });
  }

  // ===== render 
  crearFila("Total Ingresos", totalIngresos, "#a8d5ba");

  gastosCols.forEach(col => {
    const valor = datos.reduce(
      (sum, f) =>
        sum + (parseFloat((f[col] || "0").replace(/[$,]/g, "")) || 0),
      0
    );
    crearFila(col, valor, "#f4c2c2");
  });
}


// ================= CARTERA MINIMALISTA + BANNER 

function insertarCarteraMinimalista() {
  const card = document.querySelector(".card-actividad");
  if (!card || card.querySelector(".cartera-minimalista")) return;

  const empresas = [
    { nombre: "TECNIAGREX S.A.", semanas: [0, 0, 0, 0, 182576.30 ] },
    { nombre: "KRASNAYA S.A.", semanas: [0, 0, 0, 0, 96261.50] }
  ];

  const totalColumnas = empresas[0].semanas.map((_, i) =>
    empresas.reduce((sum, e) => sum + e.semanas[i], 0)
  );

  const totalGlobal = totalColumnas.reduce((a, b) => a + b, 0);

  let html = `
    <div class="cartera-minimalista">

      <div class="cartera-header">
        <div class="col-empresa">EMPRESA</div>
        <div>SEM 48</div>
        <div>SEM 49</div>
        <div>SEM 50</div>
        <div>SEM 51</div>
        <div class="col-total">TOTAL</div>
      </div>
  `;

  empresas.forEach(e => {
    const total = e.semanas.reduce((a, b) => a + b, 0);

    html += `
      <div class="cartera-row">
        <div class="col-empresa">${e.nombre}</div>

        ${e.semanas.map(s => `
          <div class="col-semana ${s === 0 ? "valor-cero" : "valor-ok"}">
            ${formatoUSD(s)}
          </div>
        `).join("")}

        <div class="col-total valor-total">
          ${formatoUSD(total)}
        </div>
      </div>
    `;
  });

  html += `
      <div class="cartera-total">
        <div class="col-empresa">TOTAL</div>

        ${totalColumnas.map(t => `
          <div class="col-semana">
            ${formatoUSD(t)}
          </div>
        `).join("")}

        <div class="col-total">
          ${formatoUSD(totalGlobal)}
        </div>
      </div>

    </div>

    <div class="cartera-banner">
      <span class="banner-icon">🛈</span>
      <span>Semanas 50-51 en proceso de liquidación.</span>
    </div>
  `;

  card.insertAdjacentHTML("beforeend", html);
}

resumenEmpresaSelect.addEventListener("change", () => {
  actualizarHaciendas();
  renderTablaResumen();
});
resumenHaciendaSelect.addEventListener("change", renderTablaResumen);


// ================= AGREGAR IMAGEN ENTRE TOTAL UTILIDAD E INGRESOS/EGRESOS, PEGADA A LA IZQUIERDA 

function insertarBarritaImagen() {
  const contenedor = document.querySelector(".card-saldo");
  if (!contenedor) return;

  // Evitar duplicados
  if (contenedor.querySelector(".barrita-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "barrita-wrapper";

  const img = document.createElement("img");
  img.src = "img/barrita.png";
  img.alt = "Barrita decorativa";
  img.className = "barrita-imagen";

  wrapper.appendChild(img);

  const bloqueUtilidad = contenedor.querySelector(".saldo-principal");
  if (bloqueUtilidad) {
    bloqueUtilidad.insertAdjacentElement("afterend", wrapper);
  }
}

// Llamar función después de cargar KPIs
document.addEventListener("DOMContentLoaded", () => {
  insertarBarritaImagen();
});

document.addEventListener("click", function (e) {
  if (e.target.id === "btnImprimirFlujo") {
    imprimirFlujoDetallado();
  }
});


// ================= IMPRIMIR REPORTE DE FLUJOS 
function imprimirFlujoDetallado() {

  const tablaFlujo = document.querySelector(".card-tabla");
  const consolidado = document.querySelector(".card-saldo");

  if (!tablaFlujo || !consolidado) {
    alert("No se encontró el contenido para imprimir");
    return;
  }

  const empresa = resumenEmpresaSelect.value;
  const hacienda = resumenHaciendaSelect.value;

  let titulo = "FLUJO PRODUCTIVO";
  if (hacienda && hacienda !== "GLOBAL") {
    titulo += ` HACIENDA ${hacienda}`;
  } else if (empresa && empresa !== "GLOBAL") {
    titulo += ` – ${empresa}`;
  }

  const fecha = new Date().toLocaleDateString("es-EC");

  const ventana = window.open("", "_blank", "width=1200,height=800");

  ventana.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${titulo}</title>
  <link rel="stylesheet" href="js/resumen/resumen.print.css">
</head>

<body>

<div class="print-header">
  <div class="ph-top">
    <span>MINI SISTEMA AGRÍCOLA</span>
    <span>${fecha}</span>
  </div>
  <div class="ph-title">${titulo}</div>
</div>

<div class="print-separador"></div>

${tablaFlujo.outerHTML}

${consolidado.outerHTML}

<script>
  window.onload = () => {
    window.print();
    window.onafterprint = () => window.close();
  };
</script>

</body>
</html>
`);



  ventana.document.close();
}


// ================= GRÁFICO FLUJO PRODUCTIVO (INGRESOS, GASTOS, UTILIDAD)

function crearModalGrafico() {
  if (document.getElementById("modalGraficoFlujo")) return;

  const modal = document.createElement("div");
  modal.id = "modalGraficoFlujo";
  modal.className = "modal-flujo hidden";

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <strong>Gráfica Lineal de Flujo Productivo</strong>
        <button class="btn-cerrar" id="btnCerrarGrafico">✖</button>
      </div>
      <div class="modal-body">
        <canvas id="graficoFlujo"></canvas>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("btnCerrarGrafico")
    .addEventListener("click", cerrarGraficoFlujo);
}

let chartFlujo = null;
// FUNCION PARA MOSTRA GRAFICO
function mostrarGraficoFlujo() {
  crearModalGrafico();

  const empresa = resumenEmpresaSelect.value;
  const hacienda = resumenHaciendaSelect.value;

  // 1️⃣ Filtrar datos según selección
  const datosFiltrados = datosOriginales.filter(f =>
    (empresa === "GLOBAL" || f.EMPRESA === empresa) &&
    (hacienda === "GLOBAL" || f.HACIENDA === hacienda)
  );

  if (!datosFiltrados.length) {
    alert("No hay datos para graficar");
    return;
  }

  // 2️⃣ Preparar datos para el gráfico
  const etiquetas = datosFiltrados.map(f => f.SEM || "");

  const ingresos = datosFiltrados.map(f =>
    parseFloat((f["TOTAL INGRESOS"] || "0").replace(/[^0-9.-]+/g, "")) || 0
  );

  const gastos = datosFiltrados.map(f =>
    parseFloat(
      (f["TOTAL GASTOS"] || f["TOTAL EGRESOS"] || "0")
        .replace(/[^0-9.-]+/g, "")
    ) || 0
  );

  const utilidad = datosFiltrados.map(f =>
    parseFloat(
      (f["UTILIDAD PRODUCTIVA"] || "0")
        .replace(/[^0-9.-]+/g, "")
    ) || 0
  );

  // 3️⃣ Mostrar modal
  document
    .getElementById("modalGraficoFlujo")
    .classList.remove("hidden");

  // 4️⃣ Inicializar canvas
  const canvas = document.getElementById("graficoFlujo");
  const ctx = canvas.getContext("2d");

  if (chartFlujo) chartFlujo.destroy();

  // 5️⃣ Crear gráfico
  chartFlujo = new Chart(ctx, {
    type: "line",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "Total Ingresos",
          data: ingresos,
          borderColor: "#1b5e20",
          backgroundColor: "rgba(173,216,230,0.4)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: "Total Gastos",
          data: gastos,
          borderColor: "#7a1f1f",
          backgroundColor: "rgba(255,182,193,0.4)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: "Utilidad Productiva",
          data: utilidad,
          borderColor: "#af9500",
          backgroundColor: "rgba(230,216,173,0.25)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            padding: 8
          }
        },
        tooltip: {
          callbacks: {
            label: ctx =>
              "$" + ctx.parsed.y.toLocaleString("es-EC")
          }
        },
        datalabels: {
          display: true,
          anchor: "end",
          align: "top",
          font: { size: 10 },
          color: "#333",
          formatter: v => "$" + v.toLocaleString("es-EC")
        }
      },
      layout: {
        padding: {
          top: 10,
          bottom: 30,
          left: 10,
          right: 10
        }
      },
      scales: {
        y: {
          ticks: {
            callback: v => "$" + v.toLocaleString("es-EC")
          },
          grid: {
            color: "#ddd"
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}


function cerrarGraficoFlujo() {
  const modal = document.getElementById("modalGraficoFlujo");
  if (modal) modal.classList.add("hidden");
}

// === EXPONER FUNCIONES AL HTML 
window.mostrarGraficoFlujo = mostrarGraficoFlujo;
window.cerrarGraficoFlujo = cerrarGraficoFlujo;
window.imprimirFlujoDetallado = imprimirFlujoDetallado;













