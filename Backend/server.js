const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// RUTAS
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend activo" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`✅ API corriendo en http://localhost:${PORT}`)
);
