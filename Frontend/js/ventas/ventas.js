export function initVentas() {
  const API_BASE = "https://minisistema.onrender.com";
  const API_CLIENTES = `${API_BASE}/api/clientes`;


  /* ======================================================
     TABS VENTAS
  ====================================================== */
  const tabsVentas = document.querySelectorAll(".ventas-tab");
  const vistasVentas = document.querySelectorAll(".ventas-vista");

  tabsVentas.forEach(tab => {
    tab.addEventListener("click", () => {
      tabsVentas.forEach(t => t.classList.remove("active"));
      vistasVentas.forEach(v => v.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  /* ======================================================
     DIRECTORIO
  ====================================================== */
  let clientes = [];
  let editIndex = null;

  const tablaClientes = document.getElementById("tablaClientes");
  const guardarClienteBtn = document.getElementById("guardarCliente");

  function renderClientes() {
    tablaClientes.innerHTML = "";
    clientes.forEach((c) => {
      tablaClientes.innerHTML += `
        <tr>
          <td>${c.razon}</td>
          <td>${c.ruc}</td>
          <td>${c.direccion}</td>
          <td>${c.personal}</td>
          <td>${c.cargo}</td>
          <td>${c.telefono}</td>
          <td>${c.email}</td>
          <td>
            <button class="btn-editar" onclick="editarCliente(${c.id})">Editar</button>
            <button class="btn-eliminar" onclick="eliminarCliente(${c.id})">Eliminar</button>

          </td>
        </tr>
      `;
    });
  }

 window.editarCliente = function (id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
    document.getElementById("razonSocial").value = c.razon;
    document.getElementById("ruc").value = c.ruc;
    document.getElementById("direccion").value = c.direccion;
    document.getElementById("personal").value = c.personal;
    document.getElementById("cargo").value = c.cargo;
    document.getElementById("telefono").value = c.telefono;
    document.getElementById("email").value = c.email;
    editIndex = id;
  };

window.eliminarCliente = async function (id) {
  try {
    const res = await fetch(`${API_CLIENTES}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("No se pudo eliminar");

    if (editIndex === id) editIndex = null;

    await cargarDirectorio();
    actualizarSelectOrigen();
    actualizarSelectUnidad();
  } catch (err) {
    console.error(err);
    alert("Error eliminando cliente");
  }
};


  function guardarDirectorio() {
    localStorage.setItem("directorio", JSON.stringify(clientes));
  }

  async function cargarDirectorio() {
    try {
      const res = await fetch(API_CLIENTES);
      if (!res.ok) throw new Error("No se pudo cargar clientes");
      clientes = await res.json();
      renderClientes();
      actualizarSelectRazon();
    } catch (err) {
      console.error(err);
      alert("Error cargando clientes desde el servidor");
    }
  }


 guardarClienteBtn.addEventListener("click", async () => {
  const payload = {
    razon_social: document.getElementById("razonSocial").value.trim(),
    ruc: document.getElementById("ruc").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    personal: document.getElementById("personal").value.trim(),
    cargo: document.getElementById("cargo").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    email: document.getElementById("email").value.trim()
  };

  try {
    let res;

    if (editIndex !== null) {
      // UPDATE
      res = await fetch(`${API_CLIENTES}/${editIndex}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      // CREATE
      res = await fetch(API_CLIENTES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (res.status === 409) {
      const msg = await res.json();
      alert(msg.message);
      return;
    }

    if (!res.ok) throw new Error("Error guardando cliente");

    editIndex = null;
    await cargarDirectorio();
    actualizarSelectOrigen();
    actualizarSelectUnidad();

    ["razonSocial", "ruc", "direccion", "personal", "cargo", "telefono", "email"]
      .forEach(id => document.getElementById(id).value = "");

  } catch (err) {
    console.error(err);
    alert("Error guardando cliente");
  }
});


  /* ======================================================
     SELECTS
  ====================================================== */
  function actualizarSelectRazon() {
    document.querySelectorAll(".aut-razon").forEach(select => {
      const selected = select.value;
      select.innerHTML = `<option value="">Seleccione</option>`;
      clientes.forEach(c => {
        select.innerHTML += `<option value="${c.razon}">${c.razon}</option>`;
      });
      select.value = selected;
    });
  }

  function actualizarSelectOrigen() {
    ["MIRELYA", "ONAHOUSE"].forEach(() => { });
    document.querySelectorAll(".aut-origen").forEach(select => {
      const selected = select.value;
      select.innerHTML = `
        <option value="">Seleccione</option>
        <option value="MIRELYA">MIRELYA</option>
        <option value="ONAHOUSE">ONAHOUSE</option>
      `;
      select.value = selected;
    });
  }

  function actualizarSelectUnidad() {
    document.querySelectorAll(".aut-unidad").forEach(select => {
      const selected = select.value;
      select.innerHTML = `
        <option value="QUINTAL">QUINTAL</option>
        <option value="KILO">KILO</option>
      `;
      select.value = selected || "QUINTAL";
    });
  }

  /* ======================================================
     INICIALIZACIÓN BASE
  ====================================================== */
  cargarDirectorio();
  actualizarSelectOrigen();
  actualizarSelectUnidad();
  // ================= TABS VENTAS =================
  //const tabsVentas = document.querySelectorAll(".ventas-tab");
  //const vistasVentas = document.querySelectorAll(".ventas-vista");

  tabsVentas.forEach(tab => {
    tab.addEventListener("click", () => {
      tabsVentas.forEach(t => t.classList.remove("active"));
      vistasVentas.forEach(v => v.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  // ================= DIRECTORIO =================
  // clientes = [];
  //let editIndex = null;
  // const tablaClientes = document.getElementById("tablaClientes");
  //const guardarClienteBtn = document.getElementById("guardarCliente");


  function editarCliente(i) {
    const c = clientes[i];
    document.getElementById("razonSocial").value = c.razon;
    document.getElementById("ruc").value = c.ruc;
    document.getElementById("direccion").value = c.direccion;
    document.getElementById("personal").value = c.personal;
    document.getElementById("cargo").value = c.cargo;
    document.getElementById("telefono").value = c.telefono;
    document.getElementById("email").value = c.email;
    editIndex = i;
  }

  function eliminarCliente(i) {
    if (editIndex === i) editIndex = null;
    clientes.splice(i, 1);
    renderClientes();
    actualizarSelectRazon();
    actualizarSelectOrigen();
    actualizarSelectUnidad();
    guardarDirectorio();
  }



  document.querySelectorAll("#directorio .directorio-form input").forEach(input => {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        guardarClienteBtn.click();
      }
    });
  });

  /* === inicialización segura === */
  cargarDirectorio();
  actualizarSelectOrigen();
  actualizarSelectUnidad();




  // ================= AUTORIZACION =================
  const btnNuevoRegistro = document.getElementById("nuevoRegistro");
  const btnGenerarOrden = document.getElementById("generarOrden");

  // Función para agregar una nueva fila de autorización
  function agregarFilaAutorizacion(inicial = false) {
    const fila = document.createElement("div");
    fila.className = "autorizacion-inputs";

    fila.innerHTML = `
    <select class="aut-razon"></select>
    <select class="aut-origen"></select>
    <input type="number" class="aut-cant">
    <select class="aut-unidad">
      <option>KILO</option>
      <option>QUINTAL</option>
      <option>LIBRA</option>
    </select>
    <input class="aut-precio">
    <input class="aut-subtotal" readonly>
    <input class="aut-retencion" readonly>
    <input class="aut-pago" readonly>
    <input class="aut-sem" readonly>
    <input class="aut-fecha" readonly>
    <button class="btn-eliminar-fila">X</button>
  `;

    const selectOrigen = fila.querySelector(".aut-origen");
    selectOrigen.innerHTML = `
    <option value="">Seleccione</option>
    <option value="MIRELYA">MIRELYA</option>
    <option value="ONAHOUSE">ONAHOUSE</option>
  `;

    const contenedor = document.querySelector(".autorizacion-registro");
    const filaTotal = contenedor.querySelector(".autorizacion-totales");
    if (filaTotal) contenedor.insertBefore(fila, filaTotal);
    else contenedor.appendChild(fila);

    actualizarSelectRazon();

    const cant = fila.querySelector(".aut-cant");
    const precio = fila.querySelector(".aut-precio");
    const subtotal = fila.querySelector(".aut-subtotal");
    const retencion = fila.querySelector(".aut-retencion");
    const pago = fila.querySelector(".aut-pago");
    const sem = fila.querySelector(".aut-sem");
    const fecha = fila.querySelector(".aut-fecha");
    const btnEliminar = fila.querySelector(".btn-eliminar-fila");

    function calcular() {
      const c = parseFloat(cant.value) || 0;
      const p = parseFloat(precio.value) || 0;
      const s = c * p;
      subtotal.value = s.toFixed(2);
      retencion.value = (s * 0.01).toFixed(2);
      pago.value = (s - s * 0.01).toFixed(2);

      const hoy = new Date();
      const start = new Date(hoy.getFullYear(), 0, 1);
      const diff = hoy - start + (start.getDay() + 1) * 86400000;
      const week = Math.ceil(diff / (7 * 86400000));
      sem.value = week;
      fecha.value = hoy.toISOString().split("T")[0];

      actualizarTotales();
    }

    cant.addEventListener("input", calcular);
    precio.addEventListener("input", calcular);
    fila.querySelector(".aut-razon").addEventListener("input", actualizarTotales);
    selectOrigen.addEventListener("input", actualizarTotales);

    // Eliminar fila del contenedor de Autorización
    btnEliminar.onclick = () => {
      fila.remove();
      actualizarTotales();
    };

    if (inicial) calcular();
  }

  // Función para actualizar la fila de totales
  function actualizarTotales() {
    const filas = document.querySelectorAll(".autorizacion-inputs");
    let totalCant = 0, totalPrecio = 0, totalSubtotal = 0, totalRetencion = 0, totalPago = 0;

    filas.forEach(fila => {
      const cant = parseFloat(fila.querySelector(".aut-cant").value) || 0;
      const precio = parseFloat(fila.querySelector(".aut-precio").value) || 0;
      const subtotal = parseFloat(fila.querySelector(".aut-subtotal").value) || 0;
      const retencion = parseFloat(fila.querySelector(".aut-retencion").value) || 0;
      const pago = parseFloat(fila.querySelector(".aut-pago").value) || 0;

      totalCant += cant;
      totalPrecio += precio;
      totalSubtotal += subtotal;
      totalRetencion += retencion;
      totalPago += pago;
    });

    const filaTotal = document.querySelector(".autorizacion-totales");
    if (!filaTotal) return;

    filaTotal.querySelector(".total-cant").textContent = totalCant;
    filaTotal.querySelector(".total-precio").textContent = totalPrecio.toFixed(2);
    filaTotal.querySelector(".total-subtotal").textContent = totalSubtotal.toFixed(2);
    filaTotal.querySelector(".total-retencion").textContent = totalRetencion.toFixed(2);
    filaTotal.querySelector(".total-pago").textContent = totalPago.toFixed(2);

    const totalEliminar = filaTotal.querySelector(".total-eliminar");
    if (totalEliminar) totalEliminar.textContent = "-";
  }

  // Botón “Nuevo Registro”
  btnNuevoRegistro.addEventListener("click", () => agregarFilaAutorizacion());


  // ================= BOTÓN GENERAR ORDEN =================
  btnGenerarOrden.addEventListener("click", () => {
    const filasAut = document.querySelectorAll(".autorizacion-inputs");
    if (!filasAut.length) return;

    let ultimaFila = null;

    filasAut.forEach(fila => {
      const razon = fila.querySelector(".aut-razon").value;
      const origen = fila.querySelector(".aut-origen").value;
      const cant = fila.querySelector(".aut-cant").value;
      const unidad = fila.querySelector(".aut-unidad").value;
      const precio = fila.querySelector(".aut-precio").value;
      const subtotal = fila.querySelector(".aut-subtotal").value;
      const retencion = fila.querySelector(".aut-retencion").value;
      const pago = fila.querySelector(".aut-pago").value;

      const row = document.createElement("div");
      row.className = "fact-hist-row";
      row.dataset.archivos = "[]";
      row.innerHTML = `
      <div><input type="checkbox" class="fact-check"></div>
      <div class="fact-cell">${razon}</div>
      <div class="fact-cell">${origen}</div>
      <div class="fact-cell">${cant}</div>
      <div class="fact-cell">${unidad}</div>
      <div class="fact-cell">${precio}</div>
      <div class="fact-cell">${subtotal}</div>
      <div class="fact-cell">${retencion}</div>
      <div class="fact-cell">${pago}</div>
      <div class="fact-acciones">
        <button class="btn-editar" title="Editar">✏️</button>
        <button class="btn-eliminar" title="Eliminar">🗑️</button>
      </div>
    `;
      factHistBody.appendChild(row);
      agregarEventosFila(row);
      ultimaFila = row;
    });

    guardarFacturacion();

    // LIMPIAR AUTORIZACION
    const contenedor = document.querySelector(".autorizacion-registro");
    contenedor.querySelectorAll(".autorizacion-inputs").forEach(fila => fila.remove());
    actualizarTotales();

    // CAMBIAR A PESTAÑA FACTURACION
    const tabVentas = document.querySelector(".ventas-tab[data-tab='facturacion']");
    if (tabVentas) tabVentas.click();

    // PARPADEO SUAVE DE LA NUEVA FILA
    if (ultimaFila) {
      ultimaFila.style.transition = "background 0.6s ease";
      let parpadeos = 0;
      const maxParpadeos = 3;

      const interval = setInterval(() => {
        if (parpadeos >= maxParpadeos) {
          ultimaFila.style.background = ""; // Restablece color original
          clearInterval(interval);
          return;
        }
        ultimaFila.style.background = ultimaFila.style.background === "rgba(255, 249, 157, 0.6)" ? "" : "rgba(255, 249, 157, 0.6)";
        parpadeos += 0.5; // cada cambio cuenta como medio parpadeo
      }, 400);
    }
  });











  // ================= FACTURACION =================
  const factHistBody = document.getElementById("fact-historial-body");
  const factAprobadasBody = document.getElementById("fact-aprobadas-body");
  const btnAprobar = document.getElementById("aprobarFacturacion");

  // Crear contenedor para botones en cabecera
  const headerBotonesContainer = document.createElement("div");
  headerBotonesContainer.style.display = "flex";
  headerBotonesContainer.style.gap = "10px";
  headerBotonesContainer.style.marginBottom = "10px";
  btnAprobar.parentNode.insertBefore(headerBotonesContainer, btnAprobar);
  headerBotonesContainer.appendChild(btnAprobar);

  // ================= BOTÓN APROBAR =================
  btnAprobar.textContent = "Aprobar facturación";
  btnAprobar.style.background = "#4caf50";
  btnAprobar.style.color = "#fff";
  btnAprobar.style.border = "none";
  btnAprobar.style.borderRadius = "6px";
  btnAprobar.style.padding = "6px 14px";
  btnAprobar.style.cursor = "pointer";
  btnAprobar.style.fontWeight = "600";
  btnAprobar.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
  btnAprobar.onmouseover = () => btnAprobar.style.background = "#45a049";
  btnAprobar.onmouseout = () => btnAprobar.style.background = "#4caf50";

  // ================= BOTÓN IMPRIMIR =================
  const btnImprimirGlobal = document.createElement("button");
  btnImprimirGlobal.textContent = "Imprimir seleccionadas";
  btnImprimirGlobal.title = "Imprimir órdenes seleccionadas";
  btnImprimirGlobal.style.background = "#1e88e5";
  btnImprimirGlobal.style.color = "#fff";
  btnImprimirGlobal.style.border = "none";
  btnImprimirGlobal.style.borderRadius = "6px";
  btnImprimirGlobal.style.padding = "6px 14px";
  btnImprimirGlobal.style.cursor = "pointer";
  btnImprimirGlobal.style.fontWeight = "600";
  btnImprimirGlobal.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
  btnImprimirGlobal.onmouseover = () => btnImprimirGlobal.style.background = "#1976d2";
  btnImprimirGlobal.onmouseout = () => btnImprimirGlobal.style.background = "#1e88e5";
  headerBotonesContainer.appendChild(btnImprimirGlobal);

  // Evento de impresión
  btnImprimirGlobal.onclick = imprimirOrdenesSeleccionadas;

  // ================= IMPRESION =================
  function imprimirOrdenesSeleccionadas() {
    const filas = factHistBody.querySelectorAll(".fact-hist-row");

    let contenido = "";
    let totalCant = 0;
    let totalSubtotal = 0;
    let totalRetencion = 0;
    let totalPago = 0;

    filas.forEach(row => {
      const check = row.querySelector(".fact-check");
      if (check && check.checked) {
        const c = row.querySelectorAll(".fact-cell");
        const cant = parseFloat(c[2].textContent) || 0;
        const subtotal = parseFloat(c[5].textContent) || 0;
        const retencion = parseFloat(c[6].textContent) || 0;
        const pago = parseFloat(c[7].textContent) || 0;

        totalCant += cant;
        totalSubtotal += subtotal;
        totalRetencion += retencion;
        totalPago += pago;

        contenido += `
        <tr>
          <td>${c[0].textContent}</td>
          <td>${c[1].textContent}</td>
          <td>${c[2].textContent}</td>
          <td>${c[3].textContent}</td>
          <td>${c[4].textContent}</td>
          <td>${c[5].textContent}</td>
          <td>${c[6].textContent}</td>
          <td>${c[7].textContent}</td>
        </tr>
      `;
      }
    });

    if (!contenido) {
      alert("Seleccione al menos una orden para imprimir.");
      return;
    }

    const ventana = window.open("", "_blank");
    ventana.document.write(`
    <html>
    <head>
      <title>Reporte de Órdenes</title>
      <style>
        body { font-family: Arial; padding: 20px; color: #333; }
        h2 { text-align: center; color: #1e88e5; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
        th { background: #f3f4f6; }
        tfoot td { font-weight: bold; background: #f3f4f6; }
        .firmas { margin-top: 60px; display: flex; justify-content: space-between; }
        .firma { text-align: center; width: 45%; }
        .cargo { color: #777; font-size: 12px; margin-top: 4px; }
      </style>
    </head>
    <body>
      <h2>Órdenes de Venta</h2>
      <table>
        <thead>
          <tr>
            <th>Razón Social</th>
            <th>Origen</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th>Retención</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          ${contenido}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">TOTALES</td>
            <td>${totalCant}</td>
            <td></td>
            <td></td>
            <td>${totalSubtotal.toFixed(2)}</td>
            <td>${totalRetencion.toFixed(2)}</td>
            <td>${totalPago.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="firmas">
        <div class="firma">
          ELABORADO POR<br>
          <strong>ING. CLAUDIA LEÓN</strong><br>
          <span class="cargo">Responsable de Venta</span>
        </div>
        <div class="firma">
          AUTORIZACIÓN<br>
          <strong>ING. MANUEL BLACIO</strong><br>
          <span class="cargo">Director General</span>
        </div>
      </div>
      <script>
        window.onload = () => window.print();
        window.onafterprint = () => window.close();
      </script>
    </body>
    </html>
  `);
    ventana.document.close();
  }

  // ================= MODAL ARCHIVOS =================
  const modal = document.createElement("div");
  modal.id = "modalArchivos";
  modal.style.display = "none";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.background = "rgba(0,0,0,0.5)";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  const modalContent = document.createElement("div");
  modalContent.style.background = "#fff";
  modalContent.style.width = "60%";
  modalContent.style.height = "60%";
  modalContent.style.display = "flex";
  modalContent.style.flexDirection = "row";
  modalContent.style.borderRadius = "8px";
  modalContent.style.padding = "10px";
  modalContent.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  modalContent.style.position = "relative";

  const closeModal = document.createElement("span");
  closeModal.textContent = "✖";
  closeModal.style.position = "absolute";
  closeModal.style.top = "10px";
  closeModal.style.right = "15px";
  closeModal.style.cursor = "pointer";
  closeModal.style.fontSize = "18px";
  closeModal.onclick = () => { modal.style.display = "none"; };
  modalContent.appendChild(closeModal);

  const leftSection = document.createElement("div");
  leftSection.style.flex = "1";
  leftSection.style.marginRight = "5px";
  leftSection.style.display = "flex";
  leftSection.style.flexDirection = "column";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.style.marginBottom = "10px";
  leftSection.appendChild(fileInput);

  const archivosContainer = document.createElement("div");
  archivosContainer.style.flex = "1";
  archivosContainer.style.overflowY = "auto";
  leftSection.appendChild(archivosContainer);

  const previewContainer = document.createElement("div");
  previewContainer.style.flex = "1";
  previewContainer.style.marginLeft = "5px";
  previewContainer.style.background = "#f9f9f9";
  previewContainer.style.border = "1px solid #ddd";
  previewContainer.style.borderRadius = "4px";
  previewContainer.style.display = "flex";
  previewContainer.style.justifyContent = "center";
  previewContainer.style.alignItems = "center";
  previewContainer.style.overflow = "auto";

  modalContent.appendChild(leftSection);
  modalContent.appendChild(previewContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // ================= FUNCIONES MODAL =================
  let filaActual = null;
  function abrirModal(fila) {
    filaActual = fila;
    modal.style.display = "flex";
    archivosContainer.innerHTML = "";
    previewContainer.innerHTML = "";

    archivosContainer.style.border = "1px solid #d1d5db";
    archivosContainer.style.borderRadius = "6px";
    archivosContainer.style.padding = "8px";
    archivosContainer.style.background = "#fafafa";
    archivosContainer.style.maxHeight = "100%";
    archivosContainer.style.overflowY = "auto";

    let archivosGuardados = JSON.parse(fila.dataset.archivos || "[]");

    if (!fila.archivosObj) fila.archivosObj = [];
    archivosGuardados.forEach(nombre => {
      if (!fila.archivosObj.some(a => a.name === nombre)) {
        fila.archivosObj.push({ name: nombre, file: null });
      }
    });

    filaActual.archivosObj.forEach(a => agregarArchivoLista(a));

    fileInput.onchange = () => {
      const nuevosArchivos = Array.from(fileInput.files);
      nuevosArchivos.forEach(f => filaActual.archivosObj.push({ name: f.name, file: f }));

      filaActual.dataset.archivos = JSON.stringify(filaActual.archivosObj.map(a => a.name));

      archivosContainer.innerHTML = "";
      filaActual.archivosObj.forEach(a => agregarArchivoLista(a));
      fileInput.value = "";
      guardarFacturacion();
    };
  }

  function obtenerIconoArchivo(nombre) {
    const ext = nombre.split(".").pop().toLowerCase();
    if (ext === "pdf") return "📄";
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "🖼️";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    return "📁";
  }

  function agregarArchivoLista(archivoObj) {
    const fila = document.createElement("div");
    fila.style.display = "flex";
    fila.style.alignItems = "center";
    fila.style.justifyContent = "space-between";
    fila.style.padding = "6px 8px";
    fila.style.border = "1px solid #e5e7eb";
    fila.style.borderRadius = "4px";
    fila.style.marginBottom = "6px";
    fila.style.background = "#fff";

    const info = document.createElement("div");
    info.style.display = "flex";
    info.style.alignItems = "center";
    info.style.gap = "6px";
    info.style.cursor = "pointer";
    info.style.flex = "1";

    const icono = document.createElement("span");
    icono.textContent = obtenerIconoArchivo(archivoObj.name);

    const nombre = document.createElement("span");
    nombre.textContent = archivoObj.name;
    nombre.style.fontSize = "13px";

    info.onclick = () => mostrarPreview(archivoObj);

    info.appendChild(icono);
    info.appendChild(nombre);

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "✕";
    btnEliminar.style.border = "none";
    btnEliminar.style.background = "transparent";
    btnEliminar.style.cursor = "pointer";
    btnEliminar.style.fontSize = "14px";
    btnEliminar.style.color = "#6b7280";

    btnEliminar.onclick = () => {
      filaActual.archivosObj = filaActual.archivosObj.filter(a => a.name !== archivoObj.name);
      filaActual.dataset.archivos = JSON.stringify(filaActual.archivosObj.map(a => a.name));
      archivosContainer.innerHTML = "";
      filaActual.archivosObj.forEach(a => agregarArchivoLista(a));
      previewContainer.innerHTML = "";
      guardarFacturacion();
    };

    fila.appendChild(info);
    fila.appendChild(btnEliminar);
    archivosContainer.appendChild(fila);
  }

  function mostrarPreview(archivoObj) {
    previewContainer.innerHTML = "";

    if (!archivoObj.file) {
      previewContainer.textContent = "No se puede previsualizar este archivo (guardado previamente).";
      return;
    }

    const file = archivoObj.file;
    const url = URL.createObjectURL(file);

    if (file.type === "application/pdf") {
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      previewContainer.appendChild(iframe);
    } else if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = url;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "contain";
      previewContainer.appendChild(img);
    } else {
      previewContainer.textContent = "Vista previa no disponible para este tipo de archivo.";
    }
  }

  // ========================= FUNCIONES DE FILA =========================
  function agregarEventosFila(row) {
    const btnEditar = row.querySelector(".btn-editar");
    const btnEliminar = row.querySelector(".btn-eliminar");

    // === ESTILO MINIMALISTA BASE ===
    const estiloAccion = btn => {
      btn.style.background = "#fff";
      btn.style.border = "1px solid #ccc";
      btn.style.borderRadius = "4px";
      btn.style.width = "32px";
      btn.style.height = "32px";
      btn.style.cursor = "pointer";
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.padding = "0";
      btn.style.marginRight = "4px"; // separación entre botones
    };

    estiloAccion(btnEditar);
    estiloAccion(btnEliminar);

    // === ICONOS ===
    const iconEditar = "✏️";    // lápiz
    const iconGuardar = "💾";   // disco de guardar
    const iconEliminar = "🗑️";  // papelera
    const iconRestaurar = "↩️";  // flecha restaurar
    const iconAdjuntar = "📎";  // clip

    btnEditar.innerHTML = iconEditar;
    btnEditar.title = "Editar";

    // Mantener el emoji según contenedor
    if (row.parentElement === factAprobadasBody) {
      btnEliminar.innerHTML = iconRestaurar;
      btnEliminar.title = "Restaurar";
    } else {
      btnEliminar.innerHTML = iconEliminar;
      btnEliminar.title = "Eliminar";
    }

    // ================= EDITAR / GUARDAR =================
    btnEditar.addEventListener("click", () => {
      const celdas = row.querySelectorAll(".fact-cell");
      const editable = celdas[0].isContentEditable;

      if (!editable) {
        celdas.forEach(c => {
          c.contentEditable = true;
          c.style.background = "#fff";
          c.style.border = "1px solid #d1d5db";
          c.style.borderRadius = "4px";
          c.style.padding = "2px 4px";
        });
        btnEditar.innerHTML = iconGuardar;
        btnEditar.title = "Guardar";
      } else {
        celdas.forEach(c => {
          c.contentEditable = false;
          c.style.background = "#f9fafb";
          c.style.border = "none";
          c.style.padding = "0";
        });
        btnEditar.innerHTML = iconEditar;
        btnEditar.title = "Editar";
        guardarFacturacion();
      }
    });

    // ================= ELIMINAR / RESTAURAR =================
    btnEliminar.addEventListener("click", () => {
      if (btnEliminar.title === "Eliminar") {
        row.remove();
      } else if (btnEliminar.title === "Restaurar") {
        factHistBody.appendChild(row);
        btnEliminar.innerHTML = iconEliminar;
        btnEliminar.title = "Eliminar";
      }
      guardarFacturacion();
    });

    // ================= BOTÓN CARGAR DOCUMENTOS =================
    let btnCargar = row.querySelector(".btn-cargar-doc");
    if (!btnCargar) {
      btnCargar = document.createElement("button");
      btnCargar.className = "btn-cargar-doc";
      btnCargar.innerHTML = iconAdjuntar;
      estiloAccion(btnCargar);
      btnCargar.title = "Adjuntar documentos";
      btnCargar.onclick = () => abrirModal(row);
      row.querySelector(".fact-acciones").appendChild(btnCargar);
    }
  }

  // ========================= CREAR FILA =========================
  function crearFila(d, contenedor) {
    const row = document.createElement("div");
    row.className = "fact-hist-row";
    row.dataset.archivos = d.archivos || "[]";
    row.innerHTML = `
    <div><input type="checkbox" class="fact-check"></div>
    <div class="fact-cell">${d.razon}</div>
    <div class="fact-cell">${d.origen}</div>
    <div class="fact-cell">${d.cant}</div>
    <div class="fact-cell">${d.unidad}</div>
    <div class="fact-cell">${d.precio}</div>
    <div class="fact-cell">${d.subtotal}</div>
    <div class="fact-cell">${d.retencion}</div>
    <div class="fact-cell">${d.pago}</div>
    <div class="fact-acciones">
      <button class="btn-editar" title="Editar"></button>
      <button class="btn-eliminar" title="Eliminar"></button>
    </div>
  `;
    contenedor.appendChild(row);

    // Agregar eventos de la fila
    agregarEventosFila(row);
  }

  // ========================= CARGAR FACTURACIÓN =========================
  function cargarFacturacion() {
    const historial = JSON.parse(localStorage.getItem("factHistorial") || "[]");
    const aprobadas = JSON.parse(localStorage.getItem("factAprobadas") || "[]");

    historial.forEach(d => crearFila(d, factHistBody));
    aprobadas.forEach(d => crearFila(d, factAprobadasBody));
  }

  // ========================= GUARDAR FACTURACIÓN =========================
  function guardarFacturacion() {
    const historial = [];
    const aprobadas = [];

    function guardarFilas(filas, arr) {
      filas.forEach(row => {
        const c = row.querySelectorAll(".fact-cell");
        arr.push({
          razon: c[0]?.textContent || "",
          origen: c[1]?.textContent || "",
          cant: c[2]?.textContent || "",
          unidad: c[3]?.textContent || "",
          precio: c[4]?.textContent || "",
          subtotal: c[5]?.textContent || "",
          retencion: c[6]?.textContent || "",
          pago: c[7]?.textContent || "",
          archivos: row.dataset.archivos || "[]"
        });
      });
    }

    guardarFilas(factHistBody.querySelectorAll(".fact-hist-row"), historial);
    guardarFilas(factAprobadasBody.querySelectorAll(".fact-hist-row"), aprobadas);

    localStorage.setItem("factHistorial", JSON.stringify(historial));
    localStorage.setItem("factAprobadas", JSON.stringify(aprobadas));
  }

  // ========================= BOTÓN APROBAR =========================
  btnAprobar.addEventListener("click", () => {
    const filas = factHistBody.querySelectorAll(".fact-hist-row");
    filas.forEach(fila => {
      const check = fila.querySelector(".fact-check");
      if (check && check.checked) {
        check.checked = false; // desmarcar
        factAprobadasBody.appendChild(fila);

        const btnEliminar = fila.querySelector(".btn-eliminar");
        const iconEliminar = "🗑️";
        const iconRestaurar = "↩️";

        // Cambiar a restaurar
        btnEliminar.innerHTML = iconRestaurar;
        btnEliminar.title = "Restaurar";

        // Reasignar evento del botón restaurar
        btnEliminar.onclick = () => {
          factHistBody.appendChild(fila);
          btnEliminar.innerHTML = iconEliminar;
          btnEliminar.title = "Eliminar";
          guardarFacturacion();
        };
      }
    });
    guardarFacturacion();
  });

  // ========================= INICIALIZACIÓN =========================
  document.addEventListener("DOMContentLoaded", () => {
    cargarDirectorio();
    cargarFacturacion();
  });








  /* ================= RESUMEN KARDEX ================= */

  const resumenData = [
    {
      semana: "Semana 01",
      dias: ["LU", "MA", "MI", "JU", "VI"],
      lotes: Array.from({ length: 10 }, (_, i) => i + 1),
      libras: [
        [12, 10, 14, 11, 9],
        [15, 12, 13, 14, 10],
        [8, 9, 10, 11, 12],
        [14, 15, 16, 14, 13],
        [9, 10, 11, 10, 9],
        [16, 14, 15, 16, 14],
        [10, 11, 12, 11, 10],
        [13, 14, 15, 13, 12],
        [11, 12, 13, 12, 11],
        [14, 13, 14, 15, 13]
      ],
      facturacion: [
        { cliente: "Cliente A", factura: "FAC-001", qq: 3 },
        { cliente: "Cliente B", factura: "FAC-002", qq: 1 }
      ]
    },
    {
      semana: "Semana 02",
      dias: ["LU", "MA", "MI", "JU", "VI"],
      lotes: Array.from({ length: 10 }, (_, i) => i + 1),
      libras: [
        [10, 11, 12, 10, 9],
        [14, 13, 12, 11, 10],
        [9, 10, 11, 10, 9],
        [15, 14, 15, 14, 13],
        [10, 11, 12, 11, 10],
        [14, 15, 16, 15, 14],
        [11, 12, 13, 12, 11],
        [13, 14, 14, 13, 12],
        [12, 13, 14, 13, 12],
        [15, 14, 15, 16, 14]
      ],
      facturacion: [
        { cliente: "Exportadora X", factura: "FAC-010", qq: 2 }
      ]
    },
    {
      semana: "Semana 03",
      dias: ["LU", "MA", "MI", "JU", "VI"],
      lotes: Array.from({ length: 10 }, (_, i) => i + 1),
      libras: [
        [11, 12, 13, 12, 11],
        [13, 14, 15, 14, 13],
        [10, 11, 12, 11, 10],
        [16, 15, 16, 15, 14],
        [11, 12, 13, 12, 11],
        [15, 16, 17, 16, 15],
        [12, 13, 14, 13, 12],
        [14, 15, 16, 15, 14],
        [13, 14, 15, 14, 13],
        [16, 15, 16, 17, 15]
      ],
      facturacion: []
    },
    {
      semana: "Semana 04",
      dias: ["LU", "MA", "MI", "JU", "VI"],
      lotes: Array.from({ length: 10 }, (_, i) => i + 1),
      libras: [
        [9, 10, 11, 10, 9],
        [12, 13, 14, 13, 12],
        [8, 9, 10, 9, 8],
        [14, 15, 16, 15, 14],
        [10, 11, 12, 11, 10],
        [15, 16, 17, 16, 15],
        [11, 12, 13, 12, 11],
        [13, 14, 15, 14, 13],
        [12, 13, 14, 13, 12],
        [14, 15, 16, 15, 14]
      ],
      facturacion: [
        { cliente: "Cliente Final", factura: "FAC-020", qq: 4 }
      ]
    }
  ];

  // ================= RENDER =================
  function renderResumen() {
    const contenedor = document.querySelector(".resumen-contenedor");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    resumenData.forEach((sem, index) => {
      let totalSemana = 0;

      const thead = `
      <tr>
        <th>L</th>
        ${sem.lotes.map(l => `<th>${l}</th>`).join("")}
        <th>T</th>
        <th>LAT</th>
      </tr>
    `;

      const tbody = sem.dias.map((dia, dIndex) => {
        let totalDia = 0;

        const celdas = sem.libras.map(lote => {
          totalDia += lote[dIndex];
          return `<td>${lote[dIndex]}</td>`;
        });

        totalSemana += totalDia;

        return `
        <tr>
          <td>${dia}</td>
          ${celdas.join("")}
          <td><strong>${totalDia}</strong></td>
          <td>${(totalDia / 50).toFixed(1)}</td>
        </tr>
      `;
      }).join("");

      const facturacionHTML = sem.facturacion.length
        ? sem.facturacion.map(f => `
          <div class="factura-item">
            <span>${f.cliente}</span>
            <small>${f.factura} · ${f.qq} qq</small>
          </div>
        `).join("")
        : `<small style="color:#9ca3af;font-size:11px;">Sin despachos</small>`;

      contenedor.innerHTML += `
      <div class="resumen-semana">
        <h4>${sem.semana}</h4>

        <div class="resumen-layout">

          <table class="kardex-table">
            <thead>${thead}</thead>
            <tbody>${tbody}</tbody>
            <tfoot>
              <tr>
                <td colspan="${sem.lotes.length + 1}">TOTAL SEMANA</td>
                <td>${totalSemana}</td>
                <td>${(totalSemana / 50).toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="control-seco">

            <div class="control-resumen">

              <div class="control-linea">
                <span>Saldo anterior (qq)</span>
                <input type="number" class="input-saldo-anterior" value="${index === 0 ? 0 : ""}">
              </div>

              <div class="control-linea">
                <span>Quintales secos</span>
                <input type="number" class="input-quintales" value="0">
              </div>

              <div class="control-linea total">
                <span>Total disponible</span>
                <strong class="valor-total-disponible">0.00</strong>
              </div>

              <div class="control-linea">
                <span>Despacho</span>
                <input type="number" class="input-despacho" value="0">
              </div>

              <div class="control-linea total">
                <span>Saldo final</span>
                <strong class="valor-saldo-final">0.00</strong>
              </div>

            </div>

            <div class="control-facturacion">
              <h5>Facturación</h5>
              ${facturacionHTML}
            </div>

          </div>
        </div>
      </div>
    `;
    });

    recalcularTodasLasSemanas();
  }

  // ================= KARDEX LOGICA =================
  function recalcularSemana(semanaEl) {
    const saldoAnterior = parseFloat(semanaEl.querySelector('.input-saldo-anterior')?.value || 0);
    const quintales = parseFloat(semanaEl.querySelector('.input-quintales')?.value || 0);
    const despacho = parseFloat(semanaEl.querySelector('.input-despacho')?.value || 0);

    const totalDisponible = saldoAnterior + quintales;
    const saldoFinal = totalDisponible - despacho;

    semanaEl.querySelector('.valor-total-disponible').textContent = totalDisponible.toFixed(2);
    semanaEl.querySelector('.valor-saldo-final').textContent = saldoFinal.toFixed(2);

    return saldoFinal;
  }

  function recalcularTodasLasSemanas() {
    const semanas = document.querySelectorAll('.resumen-semana');
    let saldoArrastrado = 0;

    semanas.forEach((semana, index) => {
      const saldoAnteriorInput = semana.querySelector('.input-saldo-anterior');

      if (index === 0) {
        saldoArrastrado = parseFloat(saldoAnteriorInput.value || 0);
      } else {
        saldoAnteriorInput.value = saldoArrastrado.toFixed(2);
      }

      saldoArrastrado = recalcularSemana(semana);
    });
  }

  // ================= EVENTOS =================
  document.addEventListener("DOMContentLoaded", () => {
    renderResumen();

    document.querySelector(".resumen-contenedor")
      .addEventListener("input", e => {
        if (
          e.target.classList.contains("input-saldo-anterior") ||
          e.target.classList.contains("input-quintales") ||
          e.target.classList.contains("input-despacho")
        ) {
          recalcularTodasLasSemanas();
        }
      });
  });














  // 👉 Autorización (fila inicial)
  agregarFilaAutorizacion(true);

  // 👉 Facturación (historial + aprobadas)
  cargarFacturacion();

  // 👉 Resumen (kardex)
  renderResumen();

}
