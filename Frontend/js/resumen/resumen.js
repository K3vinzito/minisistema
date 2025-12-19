/* ================================================================
   MÓDULO RESUMEN — KPIs IZQUIERDA + GASTOS DERECHA COMPACTO
================================================================ */

import { showLoader, hideLoader } from "../core.js";
// ================= CLAVES INTERNAS DE COLUMNAS =================
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

// ================= CARGA CSV =================
/*
export function cargarResumen() {

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
                .filter(f => f.EMPRESA !== "" && f.HACIENDA !== "");

            headers = meta.fields;

            llenarEmpresas();
            renderTablaResumen();
            insertarCarteraMinimalista();
        }
    });
}
*/
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





// ================= TABLA + KPIs =================
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
        th.innerHTML = HEADER_MAP[c] || c; // Usamos el mapa bonito con <br>

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
            totalIngresos = v; // ¡Guardamos este valor para el gráfico!
        }
        if (k.includes("egresos") || k.includes("gastos")) {
            egresosElem.textContent = formatoUSD(v);
            egresosElem.style.color = "#7a1f1f";
        }
if (c === COL.UTILIDAD) {
            totalUtilidadElem.textContent = formatoUSD(v);
            totalUtilidadElem.style.color = colorValor(v);
        }
    });

    // === AQUÍ ESTÁ LA MAGIA QUE FALTABA ===
    // Llamamos a la función que dibuja las barras pasándole los datos correctos
    renderGastos(totalIngresos, datos, cols);
}


// ================= FUNCION LISTA DE GASTOS CON PORCENTAJES SUAVES =================
/*
function renderGastos(totalIngresos, datos, cols) {
    const derecha = document.querySelector(".card-saldo .gastos-lista");
    derecha.innerHTML = "";
    derecha.style.display = "flex";
    derecha.style.flexDirection = "column";
    derecha.style.gap = "4px";

    const idxTotalIngreso = cols.findIndex(c => c.toLowerCase().includes("total ingresos"));
    const idxTotalEgreso = cols.findIndex(c => c.toLowerCase().includes("total egresos") || c.toLowerCase().includes("total gastos"));
    const gastosCols = cols.slice(idxTotalIngreso + 1, idxTotalEgreso);

    const maxValor = Math.max(
        totalIngresos,
        ...gastosCols.map(col => datos.reduce((sum, f) => sum + (parseFloat((f[col] || "$0.00").replace(/[$,]/g, "")) || 0), 0))
    );

    function crearBarra(labelText, valor, color) {
        const fila = document.createElement("div");
        fila.style.display = "flex";
        fila.style.alignItems = "center";

        // Label con viñeta
        const label = document.createElement("div");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.width = "140px";
        label.style.fontSize = "12px";
        label.style.fontWeight = "500";
        label.style.color = "#666";

        const viñeta = document.createElement("span");
        viñeta.style.display = "inline-block";
        viñeta.style.width = "8px";
        viñeta.style.height = "8px";
        viñeta.style.borderRadius = "50%";
        viñeta.style.backgroundColor = color;
        viñeta.style.marginRight = "6px";
        viñeta.style.flexShrink = "0";

        label.appendChild(viñeta);
        label.appendChild(document.createTextNode(labelText));

        // Barra de fondo
        const barraFondo = document.createElement("div");
        barraFondo.style.flex = "1";
        barraFondo.style.height = "12px";
        barraFondo.style.background = "#f2f2f2";
        barraFondo.style.borderRadius = "6px";
        barraFondo.style.overflow = "hidden";
        barraFondo.style.position = "relative";

        // Barra de color
        const barraColor = document.createElement("div");
        barraColor.style.height = "100%";
        barraColor.style.width = "0%";
        barraColor.style.background = color;
        barraColor.style.borderRadius = "6px";
        barraColor.style.transition = "width 0.6s ease";

        // Texto porcentaje suave
        const porcentaje = document.createElement("span");
        porcentaje.style.position = "absolute";
        porcentaje.style.right = "6px";
        porcentaje.style.top = "50%";
        porcentaje.style.transform = "translateY(-50%)";
        porcentaje.style.fontSize = "10px";
        porcentaje.style.fontWeight = "600";
        porcentaje.style.color = "#888"; // gris suave
        porcentaje.textContent = totalIngresos > 0 ? `${Math.round((valor / totalIngresos) * 100)}%` : "0%";

        barraFondo.appendChild(barraColor);
        barraFondo.appendChild(porcentaje);

        fila.appendChild(label);
        fila.appendChild(barraFondo);
        derecha.appendChild(fila);

        setTimeout(() => {
            barraColor.style.width = `${maxValor > 0 ? (valor / maxValor) * 100 : 0}%`;
        }, 50);

        return fila;
    }

    const colorIngreso = "#a8d5ba";
    const colorGasto = "#f4c2c2";

    // Total Ingresos
    crearBarra("Total Ingresos", totalIngresos, colorIngreso);

    // Barras de gastos
    gastosCols.forEach(col => {
        const valor = datos.reduce((sum, f) => sum + (parseFloat((f[col] || "$0.00").replace(/[$,]/g, "")) || 0), 0);
        crearBarra(col, valor, colorGasto);
    });
}
*/
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

  // ===== helper =====
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

  // ===== render =====
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



// ================= CARTERA MINIMALISTA + BANNER =================
/*
function insertarCarteraMinimalista() {
    const card = document.querySelector(".card-actividad");
    if (!card || card.querySelector(".cartera-minimalista")) return;

    const empresas = [
        { nombre: "TECNIAGREX S.A.", semanas: [0, 55714.88, 0, 0] },
        { nombre: "KRASNAYA S.A.", semanas: [2264.64, 108256.51, 0, 0] }
    ];

    const totalColumnas = empresas[0].semanas.map((_, i) =>
        empresas.reduce((sum, e) => sum + e.semanas[i], 0)
    );
    const totalGlobal = totalColumnas.reduce((a, b) => a + b, 0);

    let html = `
        <div class="cartera-minimalista" style="
            border-radius:6px;
            overflow:hidden;
            background:#fafafa;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.17);
            font-family:'Segoe UI', sans-serif;
            font-size:13px;
            margin-bottom:6px;
        ">
            <div style="
                display:flex;
                font-weight:600;
                background:#ffffffff;
                color:#555;
                padding:6px 8px;
                border-bottom:1px solid #ccc;
            ">
                <div style="flex:2;">EMPRESA</div>
                <div style="flex:1; text-align:center;">SEM 48</div>
                <div style="flex:1; text-align:center;">SEM 49</div>
                <div style="flex:1; text-align:center;">SEM 50</div>
                <div style="flex:1; text-align:center;">SEM 51</div>
                <div style="flex:1; text-align:center;">TOTAL</div>
            </div>
    `;

    empresas.forEach(e => {
        const total = e.semanas.reduce((a, b) => a + b, 0);
        html += `
            <div style="
                display:flex;
                padding:6px 8px;
                border-bottom:1px solid #ddd;
                background:#fff;
            ">
                <div style="flex:2; font-weight:500;">${e.nombre}</div>
                ${e.semanas.map(s => `
                    <div style="flex:1; text-align:center; color:${s === 0 ? '#999' : '#0b5394'};">
                        ${formatoUSD(s)}
                    </div>
                `).join("")}
                <div style="
                    flex:1;
                    text-align:center;
                    font-weight:600;
                    color:${total === 0 ? '#ffffffff' : '#000'};
                ">
                    ${formatoUSD(total)}
                </div>
            </div>
        `;
    });

    html += `
        <div style="
            display:flex;
            padding:6px 8px;
            background:#f5f5f5;
            font-weight:700;
            border-top:1px solid #ccccccff;
        ">
            <div style="flex:2; text-align:right;">TOTAL</div>
            ${totalColumnas.map(t => `
                <div style="flex:1; text-align:center;">${formatoUSD(t)}</div>
            `).join("")}
            <div style="flex:1; text-align:center;">${formatoUSD(totalGlobal)}</div>
        </div>
        </div>

        <!-- BANNER INFORMATIVO -->
<div class="cartera-banner" style="
    background:#fff1f8;
    color:#757474;
    font-size:18px;
    display:flex;
    align-items:center;
    justify-content:flex-start;;
    gap:6px;
    padding:4px 6px;
    border-radius:4px;
    margin-top:14px;
">
    <span style="
        color:#db0871;
        font-weight:100;
        font-size:20px;
        line-height:1;
    ">🛈</span>
    <span>
    Semanas 50-51 en proceso de Liquidacion.</span>
</div>
    `;

    card.insertAdjacentHTML("beforeend", html);
}
*/
function insertarCarteraMinimalista() {
  const card = document.querySelector(".card-actividad");
  if (!card || card.querySelector(".cartera-minimalista")) return;

  // ⚠️ Datos simulados (luego pueden venir del backend)
  const empresas = [
    { nombre: "TECNIAGREX S.A.", semanas: [0, 55714.88, 0, 0] },
    { nombre: "KRASNAYA S.A.", semanas: [2264.64, 108256.51, 0, 0] }
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

//document.addEventListener("DOMContentLoaded", cargarResumen);

// ================= AGREGAR IMAGEN ENTRE TOTAL UTILIDAD E INGRESOS/EGRESOS, PEGADA A LA IZQUIERDA =================
/*
function insertarBarritaImagen() {
    const contenedor = document.querySelector(".card-saldo");

    // Evitar duplicar la imagen
    if (contenedor.querySelector(".barrita-imagen")) return;

    const imgWrapper = document.createElement("div");
    imgWrapper.style.display = "flex";
    imgWrapper.style.justifyContent = "flex-start"; // pegada a la izquierda
    imgWrapper.style.alignItems = "center";
    imgWrapper.style.margin = "6px 0"; // margen arriba y abajo

    const img = document.createElement("img");
    img.src = "img/barrita.png"; // ruta local
    img.alt = "Barrita decorativa";
    img.className = "barrita-imagen";
    img.style.width = "80px"; // tamaño pequeño
    img.style.height = "auto"; 
    img.style.objectFit = "contain";

    imgWrapper.appendChild(img);

    // Insertar justo **entre Total Utilidad y Ingresos/Egresos**
    const totalUtilidadElem = contenedor.querySelector(".saldo-principal");
    totalUtilidadElem.insertAdjacentElement("afterend", imgWrapper);
}
*/
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


// ================= IMPRIMIR REPORTE DE FLUJOS =================
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


// ================= GRÁFICO FLUJO PRODUCTIVO (INGRESOS, GASTOS, UTILIDAD) =================
/*
function crearModalGrafico() {
  if (document.getElementById("modalGraficoFlujo")) return;

  const modal = document.createElement("div");
  modal.id = "modalGraficoFlujo";
  modal.className = "modal-flujo hidden";

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <strong>Gráfica Lineal de Flujo Productivo</strong>
        <button class="btn-cerrar" onclick="cerrarGraficoFlujo()">✖</button>
      </div>
      <canvas id="graficoFlujo"></canvas>
    </div>
  `;

  document.body.appendChild(modal);
}
*/
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

function mostrarGraficoFlujo() {
     crearModalGrafico(); 
    const empresa = resumenEmpresaSelect.value;
    const hacienda = resumenHaciendaSelect.value;

    // Filtrar datos según empresa y hacienda seleccionadas
    const datosFiltrados = datosOriginales.filter(f =>
        (empresa === "GLOBAL" || f.EMPRESA === empresa) &&
        (hacienda === "GLOBAL" || f.HACIENDA === hacienda)
    );

    if (!datosFiltrados.length) {
        alert("No hay datos para graficar");
        return;
    }

    const etiquetas = datosFiltrados.map(f => f.SEM || "");
    const ingresos = datosFiltrados.map(f => parseFloat((f["TOTAL INGRESOS"] || "0").replace(/[^0-9.-]+/g, "")) || 0);
    const gastos = datosFiltrados.map(f => parseFloat((f["TOTAL GASTOS"] || f["TOTAL EGRESOS"] || "0").replace(/[^0-9.-]+/g, "")) || 0);
    const utilidad = datosFiltrados.map(f => parseFloat((f["UTILIDAD PRODUCTIVA"] || "0").replace(/[^0-9.-]+/g, "")) || 0);

document.getElementById("modalGraficoFlujo")
  .classList.remove("hidden");

    const canvas = document.getElementById("graficoFlujo");
    canvas.style.width = "70%";
    canvas.style.height = "600px"; // altura vertical fija, delgada
    const ctx = canvas.getContext("2d");

    if (chartFlujo) chartFlujo.destroy();

    chartFlujo = new Chart(ctx, {
        type: "line",
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: "Total Ingresos",
                    data: ingresos,
                    borderColor: "#1b5e20",
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: "rgba(173,216,230,0.4)", // azul pastel
                    tension: 0.35,
                    pointRadius: 3,       // puntos pequeños
                    pointHoverRadius: 5,
                    datalabels: {
                        display: true,
                        align: 'top',
                        color: '#000',
                        font: {
                            size: 10
                        },
                        formatter: v => "$" + v.toLocaleString("es-EC")
                    }
                },
                {
                    label: "Total Gastos",
                    data: gastos,
                    borderColor: "#7a1f1f",
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: "rgba(255,182,193,0.4)", // rojo pastel
                    tension: 0.35,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    datalabels: {
                        display: true,
                        align: 'top',
                        color: '#000',
                        font: {
                            size: 10
                        },
                        formatter: v => "$" + v.toLocaleString("es-EC")
                    }
                },
                {
                    label: "Utilidad Productiva",
                    data: utilidad,
                    borderColor: "#af9500ff",
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: "rgba(230, 216, 173, 0.25)",
                    tension: 0.35,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    datalabels: {
                        display: true,
                        align: 'top',
                        color: '#000',
                        font: {
                            size: 10
                        },
                        formatter: v => "$" + v.toLocaleString("es-EC")
                    }
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
                        label: ctx => "$" + ctx.parsed.y.toLocaleString("es-EC")
                    }
                },
                // plugin para mostrar los valores encima de los puntos
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    font: {
                        size: 20
                    },
                    color: '#333333ff'
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
                    beginAtZero: false,
                    ticks: {
                        callback: v => "$" + v.toLocaleString("es-EC")
                    },
                    grid: {
                        drawTicks: true,
                        color: ctx => ctx.tick.value === 0 ? '#373737ff' : '#ddd',
                        lineWidth: ctx => ctx.tick.value === 0 ? 2 : 1
                    }
                }
            }
        },
        plugins: [ChartDataLabels] // recuerda incluir el plugin chartjs-plugin-datalabels en tu HTML
    });
}

function cerrarGraficoFlujo() {
  const modal = document.getElementById("modalGraficoFlujo");
  if (modal) modal.classList.add("hidden");
}

// === EXPONER FUNCIONES AL HTML ===
window.mostrarGraficoFlujo = mostrarGraficoFlujo;
window.cerrarGraficoFlujo = cerrarGraficoFlujo;
window.imprimirFlujoDetallado = imprimirFlujoDetallado;













