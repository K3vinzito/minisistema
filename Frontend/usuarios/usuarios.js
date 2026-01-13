const API_URL = "https://minisistema.onrender.com/api/usuarios";
const token = localStorage.getItem("token");

if (!token) {
  alert("No autorizado");
  window.location.href = "login.html";
}

async function cargarUsuarios() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("No autorizado");
    }

    const usuarios = await res.json();
    renderTabla(usuarios);

  } catch (err) {
    console.error(err);
    alert("Error cargando usuarios");
  }
}

function renderTabla(data) {
  const tbody = document.getElementById("tablaUsuarios");
  tbody.innerHTML = "";

  data.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.usuario}</td>
      <td>${u.rol}</td>
      <td>${u.activo ? "✅" : "❌"}</td>
      <td>
        <button onclick="toggleEstado(${u.id}, ${u.activo})">
          ${u.activo ? "Desactivar" : "Activar"}
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function toggleEstado(id, estadoActual) {
  try {
    const res = await fetch(`${API_URL}/${id}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ activo: !estadoActual })
    });

    if (!res.ok) throw new Error();

    cargarUsuarios();

  } catch (err) {
    alert("Error al cambiar estado");
  }
}

// INIT
cargarUsuarios();
