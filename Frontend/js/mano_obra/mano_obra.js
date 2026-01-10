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
  contenido.textContent = "Datos actualizados para " +
    document.getElementById("empresa-select-mano").value + " / " +
    document.getElementById("hacienda-select-mano").value;
}

// Exportar función para llamar desde el main cuando se seleccione el módulo
export { cargarModuloManoObra };
