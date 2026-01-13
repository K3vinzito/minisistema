// mano_obra.js
import { showLoader, hideLoader } from "../core.js"; // si usas loader

const contenedorModulo = document.getElementById("modulo-mano_obra");

async function cargarModuloManoObra() {
  showLoader();

  // Traer el HTML propio del módulo
  const res = await fetch("mano_obra.html");
  const html = await res.text();

  // Inyectar en el contenedor principal
  contenedorModulo.innerHTML = html;

  // Mostrar el módulo
  contenedorModulo.style.display = "block";

  // Inicializar selectores, eventos y cargar datos
  inicializarSelectores();
  hideLoader();
}

function inicializarSelectores() {
  const empresaSelect = document.getElementById("empresa-select-mano");
  const haciendaSelect = document.getElementById("hacienda-select-mano");

  // Ejemplo de llenado
  ["Global", "Porvenir", "San José"].forEach(emp => {
    const option = document.createElement("option");
    option.value = emp;
    option.textContent = emp;
    empresaSelect.appendChild(option);
  });

  empresaSelect.addEventListener("change", actualizarDatos);
  haciendaSelect.addEventListener("change", actualizarDatos);
}

function actualizarDatos() {
  const contenido = document.getElementById("mano-obra-contenido");
  contenido.textContent =
    "Datos actualizados para " +
    document.getElementById("empresa-select-mano").value +
    " / " +
    document.getElementById("hacienda-select-mano").value;
}

// ==================================================
// MODULO MANO DE OBRA — INTEGRADO A AGROPORTAL
// ==================================================

import { dom } from "../core.js";

export function initManoObra() {

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBUAf62AAk6qplGMW6ZlQPHXfYO3ShUMqCPc0EpcuVcgL7ub9cRgC1Y5aHk4JR27ZzDKCjcrErNqo0/pub?gid=0&single=true&output=csv";

  let datosCSV = [];
  let semanaActual = "";
  let graficaLabor = null;

  /* ===============================
     UTILIDADES MONEDA / PERSONAS
  ================================ */

  // 👉 PARA CÁLCULOS (NO TOCAR)
  const parseMoneda = v =>
    Number(String(v || "").replace(/\$/g, "").replace(/,/g, "")) || 0;

  // 👉 UI VALOR: $1,000.00
  const formatValor = v => {
    const n = Number(v);
    if (isNaN(n)) return "$0.00";
    return `$${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // 👉 UI PERSONAS: 1,000
  const formatPersonas = v => {
    const n = Number(v);
    if (isNaN(n)) return "0";
    return n.toLocaleString("en-US", {
      maximumFractionDigits: 0
    });
  };

  // ==================================================
  // CARGA CSV
  // ==================================================
  async function cargarCSV() {
    try {
      const res = await fetch(CSV_URL);
      const text = await res.text();

      datosCSV = text
        .trim()
        .split("\n")
        .slice(1)
        .map(f => f.split(",").map(v => v.trim()));

      cargarSelectorSemanas();
      inicializarSelectoresManoObra();
      refrescar();

    } catch (err) {
      console.error("❌ Error CSV Mano de Obra:", err);
    }
  }

  // ==================================================
  // FILTRO GLOBAL
  // ==================================================
  function filtrarDatos() {
    const empresa = dom.empresaSelect.value;
    const hacienda = dom.haciendaSelect.value;

    return datosCSV.filter(f => {
      if (empresa && empresa !== "GLOBAL" && f[1] !== empresa) return false;
      if (hacienda && hacienda !== "GLOBAL" && f[2] !== hacienda) return false;
      if (semanaActual && f[0] !== semanaActual) return false;
      return true;
    });
  }

// ==================================================
// SELECTOR DE SEMANAS (TABLA IZQUIERDA)
// ==================================================
function cargarSelectorSemanas() {
  const select = document.getElementById("laborSelect");
  if (!select) return;

  const semanas = [
    ...new Set(
      datosCSV
        .map(f => f[0])
        .filter(v => v !== undefined && v !== null && v !== "")
    )
  ].sort((a, b) => Number(a) - Number(b));

  select.innerHTML = `<option value="">Todas las semanas</option>`;

  semanas.forEach(s => {
    const num = Number(s);
    const label = `Semana ${String(num).padStart(2, "0")}`;

    const option = document.createElement("option");
    option.value = s;          // 👈 valor REAL del CSV (3, 10, etc)
    option.textContent = label; // 👈 lo que ve el usuario

    select.appendChild(option);
  });

  select.onchange = () => {
    semanaActual = select.value; // sigue siendo 3, 10, etc
    refrescar();
  };
}


  // ==================================================
  // TABLA IZQUIERDA — CATEGORÍAS
  // ==================================================
function renderTablaCategorias() {
  const data = filtrarDatos();
  const categorias = {};

  data.forEach(f => {
    const categoria = f[3];
    if (!categoria) return;

    categorias[categoria] ??= { personas: 0, valor: 0 };
    categorias[categoria].personas += Number(f[5]) || 0;
    categorias[categoria].valor += parseMoneda(f[6]);
  });

  const thead = document.querySelector("#tabla-izquierda thead");
  const tbody = document.querySelector("#tabla-izquierda tbody");
  const tfoot = document.querySelector("#tabla-izquierda tfoot");
  if (!thead || !tbody || !tfoot) return;

  thead.innerHTML = `
    <tr>
      <th>#</th>
      <th>Categoría</th>
      <th># Pers.</th>
      <th>Valor</th>
    </tr>`;

  tbody.innerHTML = "";
  tfoot.innerHTML = "";

  let totalP = 0;
  let totalV = 0;
  let i = 1;

  Object.entries(categorias)
    .sort((a, b) => a[0].localeCompare(b[0], "es", { sensitivity: "base" }))
    .forEach(([cat, d]) => {
      totalP += d.personas;
      totalV += d.valor;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i++}</td>
        <td>${cat}</td>
        <td class="clickable">${formatPersonas(d.personas)}</td>
        <td>${formatValor(d.valor)}</td>
      `;

      tr.querySelector(".clickable").onclick = () =>
        renderTablaLabores(cat);

      tbody.appendChild(tr);
    });

  tfoot.innerHTML = `
    <tr>
      <td colspan="2"><strong>TOTAL</strong></td>
      <td><strong>${formatPersonas(totalP)}</strong></td>
      <td><strong>${formatValor(totalV)}</strong></td>
    </tr>`;
}


// ==================================================
// TABLA DERECHA — LABORES (SUMA y PROMEDIO P/U) + SWITCH FUNCIONAL
// ==================================================
let categoriaSeleccionadaActual = null; // guardamos la categoría clickeada

function renderTablaLabores(categoriaSeleccionada) {
  if (!categoriaSeleccionada) return;

  categoriaSeleccionadaActual = categoriaSeleccionada; // actualizar categoría actual

  const data = filtrarDatos();
  const labores = {};

  // Estado del switch
  const completo = document.getElementById("switchModoVista")?.checked ?? true;

  data.forEach(f => {
    if (f[3] !== categoriaSeleccionada) return;

    const labor = f[4];
    if (!labor) return;

    labores[labor] ??= { personas: 0, valor: 0, avance: 0, puSum: 0, puCount: 0, unidad: "" };

    labores[labor].personas += Number(f[5]) || 0;
    labores[labor].valor += parseMoneda(f[6]);
    labores[labor].avance += Number(f[8]) || 0;
    labores[labor].puSum += parseFloat(f[9]) || 0;
    labores[labor].puCount += 1;
    labores[labor].unidad = f[7] || labores[labor].unidad;
  });

  const thead = document.querySelector("#tabla-derecha thead");
  const tbody = document.querySelector("#tabla-derecha tbody");
  const tfoot = document.querySelector("#tabla-derecha tfoot");
  if (!thead || !tbody || !tfoot) return;

  // Cabecera según modo
  if (completo) {
    thead.innerHTML = `
      <tr>
        <th>#</th>
        <th>Labor</th>
        <th>Unidad</th>
        <th># Pers.</th>
        <th>Avance</th>
        <th>P/U</th>
        <th>Valor</th>
      </tr>`;
  } else {
    thead.innerHTML = `
      <tr>
        <th>#</th>
        <th>Labor</th>
        <th># Pers.</th>
        <th>Valor</th>
      </tr>`;
  }

  tbody.innerHTML = "";
  tfoot.innerHTML = "";

  let totalP = 0;
  let totalV = 0;
  let totalAvance = 0;
  let i = 1;

  Object.entries(labores)
    .sort((a, b) => a[0].localeCompare(b[0], "es", { sensitivity: "base" }))
    .forEach(([labor, d]) => {
      totalP += d.personas;
      totalV += d.valor;
      totalAvance += d.avance;

      const puPromedio = d.puCount > 0 ? d.puSum / d.puCount : 0;

      if (completo) {
        tbody.innerHTML += `
          <tr>
            <td>${i++}</td>
            <td>${labor}</td>
            <td>${d.unidad}</td>
            <td>${formatPersonas(d.personas)}</td>
            <td>${d.avance.toFixed(2)}</td>
            <td>${puPromedio.toFixed(2)}</td>
            <td>${formatValor(d.valor)}</td>
          </tr>`;
      } else {
        tbody.innerHTML += `
          <tr>
            <td>${i++}</td>
            <td>${labor}</td>
            <td>${formatPersonas(d.personas)}</td>
            <td>${formatValor(d.valor)}</td>
          </tr>`;
      }
    });

  // Pie de tabla
  if (completo) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="3"><strong>TOTAL</strong></td>
        <td><strong>${formatPersonas(totalP)}</strong></td>
        <td><strong>${totalAvance.toFixed(2)}</strong></td>
        <td><strong>-</strong></td>
        <td><strong>${formatValor(totalV)}</strong></td>
      </tr>`;
  } else {
    tfoot.innerHTML = `
      <tr>
        <td colspan="2"><strong>TOTAL</strong></td>
        <td><strong>${formatPersonas(totalP)}</strong></td>
        <td><strong>${formatValor(totalV)}</strong></td>
      </tr>`;
  }
}

// ==================================================
// SWITCH DINÁMICO — CAMBIO DE VISTA
// ==================================================
const switchVista = document.getElementById("switchModoVista");
switchVista?.addEventListener("change", () => {
  if (categoriaSeleccionadaActual) {
    renderTablaLabores(categoriaSeleccionadaActual);
  }
});

// ==================================================
// TABLA IZQUIERDA — al hacer clic en categoría
// ==================================================
function renderTablaCategorias() {
  const data = filtrarDatos();
  const categorias = {};

  data.forEach(f => {
    const categoria = f[3];
    if (!categoria) return;

    categorias[categoria] ??= { personas: 0, valor: 0 };
    categorias[categoria].personas += Number(f[5]) || 0;
    categorias[categoria].valor += parseMoneda(f[6]);
  });

  const thead = document.querySelector("#tabla-izquierda thead");
  const tbody = document.querySelector("#tabla-izquierda tbody");
  const tfoot = document.querySelector("#tabla-izquierda tfoot");
  if (!thead || !tbody || !tfoot) return;

  thead.innerHTML = `
    <tr>
      <th>#</th>
      <th>Categoría</th>
      <th># Pers.</th>
      <th>Valor</th>
    </tr>`;

  tbody.innerHTML = "";
  tfoot.innerHTML = "";

  let totalP = 0;
  let totalV = 0;
  let i = 1;

Object.entries(categorias)
  .sort((a, b) => a[0].localeCompare(b[0], "es", { sensitivity: "base" }))
  .forEach(([cat, d]) => {
    totalP += d.personas;
    totalV += d.valor;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i++}</td>
      <td>${cat}</td>
      <td class="clickable">${formatPersonas(d.personas)}</td>
      <td>${formatValor(d.valor)}</td>
    `;

    // 👉 Evento clic en valor de categoría
    tr.querySelector(".clickable").onclick = () => {
      // 1️⃣ quitar selección anterior
      document.querySelectorAll("#tabla-izquierda tbody tr.clickable-selected")
              .forEach(r => r.classList.remove("clickable-selected"));

      // 2️⃣ marcar la fila actual como seleccionada
      tr.classList.add("clickable-selected");

      // 3️⃣ refrescar la tabla derecha con esta categoría
      renderTablaLabores(cat);
    };

    tbody.appendChild(tr);
  });

tfoot.innerHTML = `
  <tr>
    <td colspan="2"><strong>TOTAL</strong></td>
    <td><strong>${formatPersonas(totalP)}</strong></td>
    <td><strong>${formatValor(totalV)}</strong></td>
  </tr>`;

}


  // ==================================================
  // MODAL + GRÁFICA
  // ==================================================
  document.getElementById("btnGrafica")?.addEventListener("click", () => {
    document.getElementById("modalGrafica")?.classList.add("activo");
    cargarSelectorLaboresModal();
  });

  function cargarEmpresasManoObra() {
    if (!dom.empresaSelect) return;

    const empresas = [...new Set(datosCSV.map(f => f[1]).filter(Boolean))];

    dom.empresaSelect.innerHTML =
      `<option value="GLOBAL">GLOBAL</option>` +
      empresas.map(e => `<option value="${e}">${e}</option>`).join("");
  }

  function cargarHaciendasManoObra() {
    if (!dom.haciendaSelect) return;

    const empresa = dom.empresaSelect.value;

    const haciendas = [
      ...new Set(
        datosCSV
          .filter(f => empresa === "GLOBAL" || f[1] === empresa)
          .map(f => f[2])
          .filter(Boolean)
      )
    ];

    dom.haciendaSelect.innerHTML =
      `<option value="GLOBAL">GLOBAL</option>` +
      haciendas.map(h => `<option value="${h}">${h}</option>`).join("");
  }

  function inicializarSelectoresManoObra() {
    if (!dom.empresaSelect || !dom.haciendaSelect) return;

    cargarEmpresasManoObra();
    cargarHaciendasManoObra();

    dom.empresaSelect.onchange = () => {
      semanaActual = "";
      const selSemana = document.getElementById("laborSelect");
      if (selSemana) selSemana.value = "";

      cargarHaciendasManoObra();
      refrescar();
    };

    dom.haciendaSelect.onchange = () => {
      semanaActual = "";
      const selSemana = document.getElementById("laborSelect");
      if (selSemana) selSemana.value = "";

      refrescar();
    };
  }

  function cargarSelectorLaboresModal() {
    const select = document.getElementById("selectLaborModal");
    if (!select) return;

    const labores = [...new Set(filtrarDatos().map(f => f[4]).filter(Boolean))];

    select.innerHTML =
      `<option value="">Seleccione una labor</option>` +
      labores.map(l => `<option value="${l}">${l}</option>`).join("");

    select.onchange = () => renderGraficaLabor(select.value);
  }

  // ==================================================
  // GRÁFICA LABOR
  // ==================================================
  function renderGraficaLabor(laborSeleccionada) {
    const canvas = document.getElementById("graficaLabor");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (graficaLabor) {
      graficaLabor.destroy();
      graficaLabor = null;
    }

    if (!laborSeleccionada) return;

    const dataSemanas = {};

    datosCSV.forEach(fila => {
      if (fila[4] !== laborSeleccionada) return;

      const semana = fila[0];
      const valor = parseMoneda(fila[6]);

      if (!dataSemanas[semana]) dataSemanas[semana] = 0;
      dataSemanas[semana] += valor;
    });

    const labels = Object.keys(dataSemanas).sort((a, b) => Number(a) - Number(b));
    const values = labels.map(s => dataSemanas[s]);
    const maxVal = Math.max(...values, 0);

    graficaLabor = new Chart(ctx, {
      type: "line",
      plugins: [ChartDataLabels],
      data: {
        labels,
        datasets: [{
          label: `Valor Monetario - ${laborSeleccionada}`,
          data: values,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.2)",
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => formatValor(ctx.raw)
            }
          },
          datalabels: {
            formatter: v => formatValor(v),
            font: { size: 10 },
            color: "#6b7280"
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: maxVal * 1.15,
            ticks: {
              callback: v => formatValor(v)
            }
          }
        }
      }
    });
  }

  // ==================================================
  // REFRESCO GLOBAL
  // ==================================================
  function refrescar() {
    renderTablaCategorias();
    document.querySelector("#tabla-derecha tbody").innerHTML = "";
    document.querySelector("#tabla-derecha tfoot").innerHTML = "";
  }

  window.initManoObraRefresco = refrescar;

  // ==================================================
  // INIT
  // ==================================================
  cargarCSV();
}
