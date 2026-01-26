const API_BASE = "https://minisistema.onrender.com";

let modo = "login";

const usuarioInput = document.getElementById("usuario");
const passwordInput = document.getElementById("password");
const btnSubmit = document.getElementById("btnSubmit");
const errorMsg = document.getElementById("errorMsg");
const toggleForm = document.getElementById("toggleForm");
const formTitle = document.getElementById("formTitle");

toggleForm.addEventListener("click", () => {
  modo = modo === "login" ? "register" : "login";

  formTitle.textContent = modo === "login"
    ? "Iniciar Sesión"
    : "Registro de Usuario";

  btnSubmit.textContent = modo === "login"
    ? "Ingresar"
    : "Registrarse";

  toggleForm.textContent = modo === "login"
    ? "¿No tienes cuenta? Registrarse"
    : "¿Ya tienes cuenta? Iniciar sesión";

  errorMsg.textContent = "";
});

btnSubmit.addEventListener("click", async () => {
  const usuario = usuarioInput.value.trim();
  const password = passwordInput.value.trim();

  if (!usuario || !password) {
    errorMsg.textContent = "Usuario y contraseña son obligatorios";
    return;
  }

  try {
    const url = modo === "login"
      ? `${API_BASE}/api/auth/login`
      : `${API_BASE}/api/auth/register`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error || "Error de autenticación";
      return;
    }

    // =====================
    // REGISTER OK
    // =====================
    if (modo === "register") {
      errorMsg.style.color = "lime";
      errorMsg.textContent = "Usuario creado. Ahora inicia sesión.";
      modo = "login";
      toggleForm.click();
      return;
    }

    // =====================
    // LOGIN OK
    // =====================
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    localStorage.setItem("rol", data.usuario.rol);

    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    errorMsg.textContent = "Error de conexión con el servidor";
  }
});

[usuarioInput, passwordInput].forEach(input => {
  input.addEventListener("keyup", e => {
    if (e.key === "Enter") btnSubmit.click();
  });
});
