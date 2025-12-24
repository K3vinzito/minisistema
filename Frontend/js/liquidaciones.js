/* ================================================================
                     MÓDULO LIQUIDACIONES
================================================================ */

window.LiquidacionesModule = {

  // ================= COLUMNAS CLICKEABLES 

  esColumnaClickeable(header) {
    return false;
  },

  // ================= RENDER CELDA 

  renderCelda(row, header) {
    return row[header] ?? "";
  },

  // ================= DETALLES 

  construirURLDetalles() {
    return null;
  },

  // ================= FORMATO 

  formatearValor(valor) {
    return `$${Number(valor).toFixed(2)}`;
  },

  formatearTotal(total) {
    return `$${Number(total).toFixed(2)}`;
  },

  // ================= MANEJO DE CLICK 

  manejarClickDetalle() {
    const tablaDetalle = document.getElementById("tablaDetalle");
    tablaDetalle.innerHTML = `
      <tr>
        <td colspan="3">Liquidaciones no tiene detalles</td>
      </tr>
    `;
  }
};


