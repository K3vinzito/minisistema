require("dotenv").config();
const express = require("express");
const cors = require("cors");

const gastosRoutes = require("./routes/gastos.routes");
const produccionRoutes = require("./routes/produccion.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas API
app.use("/api/gastos", gastosRoutes);
app.use("/api/produccion", produccionRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "API Minisistema OK" });
});

// PUERTO PARA RENDER
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
