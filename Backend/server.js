require("dotenv").config();
const express = require("express");
const app = express();

const gastosRoutes = require("./routes/gastos.routes");
const produccionRoutes = require("./routes/produccion.routes");

app.use(express.json());

app.use("/api/gastos", gastosRoutes);
app.use("/api/produccion", produccionRoutes);

app.get("/", (req, res) => {
  res.json({ status: "API Minisistema OK" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
