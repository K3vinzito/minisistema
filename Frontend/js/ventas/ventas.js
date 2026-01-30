export function initVentas() {
  const API_BASE = "https://minisistema.onrender.com";
  const API_CLIENTES = `${API_BASE}/api/clientes`;
  const API_VENTAS = `${API_BASE}/api/ventas`;



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
          <td>${c.razon_social}</td>
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
    document.getElementById("razonSocial").value = c.razon_social;
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

  /* ======================================================*/
  function construirOrdenesDesdeUI() {
    const filas = document.querySelectorAll(".autorizacion-inputs");
    const mapa = new Map(); // key: cliente_id

    filas.forEach(fila => {
      const sel = fila.querySelector(".aut-razon");
      const cliente_id = Number(sel.value);
      const razon_social = sel.options[sel.selectedIndex]?.text?.trim() || "";

      const origen = fila.querySelector(".aut-origen").value.trim();
      const cantidad = Number(fila.querySelector(".aut-cant").value || 0);
      const unidad = fila.querySelector(".aut-unidad").value.trim();
      const precio = Number(fila.querySelector(".aut-precio").value || 0);
      const subtotal = Number(fila.querySelector(".aut-subtotal").value || 0);
      const retencion = Number(fila.querySelector(".aut-retencion").value || 0);
      const pago = Number(fila.querySelector(".aut-pago").value || 0);
      const semana = fila.querySelector(".aut-sem").value;
      const fecha = fila.querySelector(".aut-fecha").value;

      // validación mínima (sin inventar reglas nuevas)
      if (!cliente_id || !razon_social) return;
      if (!origen) return;
      if (!cantidad || !precio) return;

      const detalle = { origen, cantidad, unidad, precio, subtotal, retencion, pago };

      if (!mapa.has(cliente_id)) {
        mapa.set(cliente_id, {
          cliente_id,
          razon_social,
          semana,
          fecha,
          detalles: [detalle],
        });
      } else {
        mapa.get(cliente_id).detalles.push(detalle);
      }
    });

    return [...mapa.values()];
  }


  /* ======================================================
     SELECTS
  ====================================================== */
  function actualizarSelectRazon() {
    document.querySelectorAll(".aut-razon").forEach(select => {
      const selected = select.value;

      select.innerHTML = `<option value="">Seleccione</option>`;
      clientes.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.razon_social}</option>`;
      });

      // intenta mantener selección anterior
      if ([...select.options].some(o => o.value === selected)) {
        select.value = selected;
      }
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
    document.getElementById("razonSocial").value = c.razon_social;
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

  // ================= CARGAR FACTURACIÓN DESDE BD (DETALLE REAL) =================
  async function cargarOrdenesPendientes() {
    const token = localStorage.getItem("token");
    if (!token) return;

    factHistBody.innerHTML = "";

    try {
      const res = await fetch(`${API_VENTAS}/pendientes-detalle`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("No se pudo cargar facturación");

      const detalles = await res.json();

      detalles.forEach(d => {
        crearFila({
          razon_social: d.razon_social,
          origen: d.origen,
          cant: d.cantidad,
          unidad: d.unidad,
          precio: d.precio,
          subtotal: d.subtotal,
          retencion: d.retencion,
          pago: d.pago,
          orden_id: d.orden_id,
          detalle_id: d.detalle_id
        }, factHistBody);
      });

    } catch (err) {
      console.error(err);
      alert("Error cargando facturación");
    }
  }

  function agregarEventosFila(row) {
    const btnEditar = row.querySelector(".btn-editar");
    const btnEliminar = row.querySelector(".btn-eliminar");
    const btnAcciones = row.querySelector(".fact-acciones");

    const detalleId = row.dataset.detalleId;
    const ordenId = row.dataset.ordenId;

    const iconEditar = "✏️";
    const iconGuardar = "💾";
    const iconEliminar = "🗑️";
    const iconAdjuntar = "📎";

    btnEditar.innerHTML = iconEditar;
    btnEliminar.innerHTML = iconEliminar;

    /* =====================================================
       EDITAR / GUARDAR
    ===================================================== */
    btnEditar.onclick = async () => {
      const celdas = row.querySelectorAll(".fact-cell");
      const editando = row.dataset.editando === "1";

      // === ENTRAR EN MODO EDICIÓN ===
      if (!editando) {
        row.dataset.editando = "1";

        // Razón social (select clientes)
        const razonActual = celdas[0].textContent.trim();
        const selRazon = document.createElement("select");
        clientes.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c.id;
          opt.textContent = c.razon_social;
          if (c.razon_social === razonActual) opt.selected = true;
          selRazon.appendChild(opt);
        });
        celdas[0].innerHTML = "";
        celdas[0].appendChild(selRazon);

        // Origen
        const selOrigen = document.createElement("select");
        ["MIRELYA", "ONAHOUSE"].forEach(o => {
          const opt = document.createElement("option");
          opt.value = o;
          opt.textContent = o;
          if (o === celdas[1].textContent.trim()) opt.selected = true;
          selOrigen.appendChild(opt);
        });
        celdas[1].innerHTML = "";
        celdas[1].appendChild(selOrigen);

        // Cantidad
        const inpCant = document.createElement("input");
        inpCant.type = "number";
        inpCant.value = celdas[2].textContent;
        celdas[2].innerHTML = "";
        celdas[2].appendChild(inpCant);

        // Unidad
        const selUnidad = document.createElement("select");
        ["KILO", "QUINTAL"].forEach(u => {
          const opt = document.createElement("option");
          opt.value = u;
          opt.textContent = u;
          if (u === celdas[3].textContent.trim()) opt.selected = true;
          selUnidad.appendChild(opt);
        });
        celdas[3].innerHTML = "";
        celdas[3].appendChild(selUnidad);

        // Precio
        const inpPrecio = document.createElement("input");
        inpPrecio.type = "number";
        inpPrecio.step = "0.01";
        inpPrecio.value = celdas[4].textContent;
        celdas[4].innerHTML = "";
        celdas[4].appendChild(inpPrecio);

        // Recalcular automático
        function recalcular() {
          const cant = Number(inpCant.value || 0);
          const precio = Number(inpPrecio.value || 0);
          const subtotal = cant * precio;
          const ret = subtotal * 0.01;
          const pago = subtotal - ret;

          celdas[5].textContent = subtotal.toFixed(2);
          celdas[6].textContent = ret.toFixed(2);
          celdas[7].textContent = pago.toFixed(2);
        }

        inpCant.oninput = recalcular;
        inpPrecio.oninput = recalcular;

        btnEditar.innerHTML = "💾";
        btnEditar.title = "Guardar";
        return;
      }

      // === GUARDAR ===
      try {
        const token = localStorage.getItem("token");

        const payload = {
          origen: celdas[1].querySelector("select").value,
          cantidad: Number(celdas[2].querySelector("input").value),
          unidad: celdas[3].querySelector("select").value,
          precio: Number(celdas[4].querySelector("input").value),
          subtotal: Number(celdas[5].textContent),
          retencion: Number(celdas[6].textContent),
          pago: Number(celdas[7].textContent)
        };

        const res = await fetch(`${API_VENTAS}/detalle/${row.dataset.detalleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Error guardando");

        // Volver a texto
        celdas[0].textContent = celdas[0].querySelector("select").selectedOptions[0].text;
        celdas[1].textContent = payload.origen;
        celdas[2].textContent = payload.cantidad;
        celdas[3].textContent = payload.unidad;
        celdas[4].textContent = payload.precio.toFixed(2);

        row.dataset.editando = "0";
        btnEditar.innerHTML = "✏️";
        btnEditar.title = "Editar";

      } catch (err) {
        console.error(err);
        alert("Error al guardar cambios");
      }
    };

    /* =====================================================
       ELIMINAR (BD REAL)
    ===================================================== */
    btnEliminar.onclick = async () => {
      if (!detalleId) {
        alert("Registro inválido");
        return;
      }

      if (!confirm("¿Eliminar este registro?")) return;

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_VENTAS}/detalle/${detalleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("No se pudo eliminar");

        row.remove();

      } catch (err) {
        console.error(err);
        alert("Error eliminando registro");
      }
    };

    /* =====================================================
       ADJUNTAR DOCUMENTOS
    ===================================================== */
    let btnCargar = row.querySelector(".btn-cargar-doc");
    if (!btnCargar) {
      btnCargar = document.createElement("button");
      btnCargar.className = "btn-cargar-doc";
      btnCargar.innerHTML = iconAdjuntar;
      btnCargar.title = "Adjuntar documentos";
      btnCargar.onclick = () => abrirModal(row);
      btnAcciones.appendChild(btnCargar);
    }
  }

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



  // ================= BOTÓN GENERAR ORDEN (CORREGIDO) =================
  btnGenerarOrden.addEventListener("click", async () => {
    const filas = document.querySelectorAll(".autorizacion-inputs");
    if (!filas.length) {
      alert("No hay registros para generar orden");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesión inválida");
      return;
    }

    // ===== AGRUPAR POR CLIENTE (1 ORDEN / VARIOS DETALLES) =====
    const ordenes = {};

    filas.forEach(fila => {
      const sel = fila.querySelector(".aut-razon");
      const cliente_id = Number(sel.value);
      const razon_social = sel.options[sel.selectedIndex]?.text || "";

      const origen = fila.querySelector(".aut-origen").value;
      const cantidad = Number(fila.querySelector(".aut-cant").value);
      const unidad = fila.querySelector(".aut-unidad").value;
      const precio = Number(fila.querySelector(".aut-precio").value);
      const subtotal = Number(fila.querySelector(".aut-subtotal").value);
      const retencion = Number(fila.querySelector(".aut-retencion").value);
      const pago = Number(fila.querySelector(".aut-pago").value);
      const semana = fila.querySelector(".aut-sem").value;
      const fecha = fila.querySelector(".aut-fecha").value;

      if (!cliente_id || !origen || !cantidad || !precio) return;

      if (!ordenes[cliente_id]) {
        ordenes[cliente_id] = {
          cliente_id,
          razon_social,
          semana,
          fecha,
          detalles: []
        };
      }

      ordenes[cliente_id].detalles.push({
        origen,
        cantidad,
        unidad,
        precio,
        subtotal,
        retencion,
        pago
      });
    });

    const payloads = Object.values(ordenes);
    if (!payloads.length) {
      alert("No hay órdenes válidas");
      return;
    }

    try {
      for (const orden of payloads) {
        const res = await fetch(`${API_VENTAS}/orden`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(orden)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al guardar orden");
        }
      }

      // limpiar autorización
      document.querySelectorAll(".autorizacion-inputs").forEach(f => f.remove());
      actualizarTotales();

      // ir a facturación
      document.querySelector(".ventas-tab[data-tab='facturacion']").click();
      cargarFacturacion();

    } catch (err) {
      console.error(err);
      alert(err.message);
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


  // ========================= CREAR FILA =========================
  function crearFila(d, contenedor) {
    const row = document.createElement("div");
    row.className = "fact-hist-row";

    // 🔑 IDS REALES
    row.dataset.ordenId = d.orden_id;
    row.dataset.detalleId = d.detalle_id;
    row.dataset.archivos = d.archivos || "[]";

    row.innerHTML = `
    <div><input type="checkbox" class="fact-check"></div>
    <div class="fact-cell">${d.razon_social}</div>
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
    agregarEventosFila(row);
  }

  // ========================= CARGAR FACTURACIÓN =========================
  function cargarFacturacion() {
    factHistBody.innerHTML = "";
    factAprobadasBody.innerHTML = "";

    // 🔵 PENDIENTES DESDE BD
    cargarOrdenesPendientes();

    // 🟢 APROBADAS (local, por ahora)
    const aprobadas = JSON.parse(localStorage.getItem("factAprobadas") || "[]");
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
