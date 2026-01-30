import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import usuariosRoutes from "./routes/usuarios.js";
import authRoutes from "./routes/auth.js";
import clientesRoutes from "./routes/clientes.js";
import ventasRoutes from "./routes/ventas.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================
// Middlewares globales
// ==================
app.use(cors());
app.use(express.json());

// ==================
// Rutas
// ==================
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/uploads", express.static("Backend/uploads"));


// ==================
// Ruta de prueba
// ==================
app.get("/api/db-test", (req, res) => {
  res.json({
    ok: true,
    message: "Backend funcionando correctamente",
    time: new Date()
  });
});

// ==================
// Start server
// ==================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
