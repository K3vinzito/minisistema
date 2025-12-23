/* ================================================================
   MÓDULO LIQUIDACIONES

================================================================ */

window.LiquidacionesModule = {

  /* ================= COLUMNAS CLICKEABLES ================= */

  esColumnaClickeable(header) {
    // Liquidaciones NO tiene detalles
    return false;
  },

  /* ================= RENDER CELDA ================= */

  renderCelda(row, header) {
    // Se muestra el valor normal, sin span clickeable
    return row[header] ?? "";
  },

  /* ================= DETALLES ================= */

  construirURLDetalles() {
    // Liquidaciones NO tiene detalles
    return null;
  },

  /* ================= FORMATO ================= */

  formatearValor(valor) {
    // Liquidaciones = dinero
    return `$${Number(valor).toFixed(2)}`;
  },

  formatearTotal(total) {
    return `$${Number(total).toFixed(2)}`;
  },

  /* ================= MANEJO DE CLICK ================= */

  manejarClickDetalle() {
    const tablaDetalle = document.getElementById("tablaDetalle");
    tablaDetalle.innerHTML = `
      <tr>
        <td colspan="3">Liquidaciones no tiene detalles</td>
      </tr>
    `;
  }
};


