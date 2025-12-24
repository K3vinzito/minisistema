const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend activo" });
});

// Rutas
app.use("/api/gastos", require("./routes/gastos.routes"));
app.use("/api/produccion", require("./routes/produccion.routes"));

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => console.log(`✅ API corriendo en http://localhost:${PORT}`));
