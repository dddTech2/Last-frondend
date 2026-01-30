/**
 * Utilidades para formateo de datos de campañas
 */

/**
 * Formatea un valor numérico como moneda colombiana (COP)
 * @param {number} val - Valor a formatear
 * @returns {string} Valor formateado como moneda
 */
export const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: 0 
  }).format(val || 0);
};

/**
 * Formatea un número con separadores de miles
 * @param {number} val - Valor a formatear
 * @returns {string} Número formateado
 */
export const formatNumber = (val) => {
  return new Intl.NumberFormat('es-CO').format(val || 0);
};

/**
 * Convierte una fecha en formato YYYY-MM a un label legible
 * @param {string} yyyyMm - Fecha en formato YYYY-MM
 * @returns {string} Fecha formateada (ej: "enero 2026")
 */
export const formatMonthLabel = (yyyyMm) => {
  const [year, month] = yyyyMm.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * Convierte una fecha completa a formato legible corto
 * @param {string} dateStr - Fecha ISO string
 * @returns {string} Fecha formateada corta
 */
export const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { 
    month: 'short', 
    day: 'numeric',
    year: '2-digit'
  });
};

/**
 * Convierte una fecha completa a formato legible largo
 * @param {string} dateStr - Fecha ISO string
 * @returns {string} Fecha formateada larga
 */
export const formatDateLong = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
