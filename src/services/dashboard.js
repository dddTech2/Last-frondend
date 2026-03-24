import { apiRequest } from './api';

// --- Dashboard Predictivo Endpoints ---

// 4.1. Filtros Iniciales y KPIs Generales
export const getDashboardOpciones = () => apiRequest('/dashboard/filtros/opciones');
export const getDashboardKPIs = (filters) => apiRequest('/dashboard/kpis', 'POST', filters);

// 4.2. Pestaña: Visión General
export const getDashboardFunnel = (filters) => apiRequest('/dashboard/funnel', 'POST', filters);
export const getDashboardTendencia = (filters, queryParams = '') => {
  const query = queryParams ? `?${queryParams}` : '';
  return apiRequest(`/dashboard/tendencia${query}`, 'POST', filters);
};
export const getDashboardDistribucionTiempos = (filters) => apiRequest('/dashboard/distribucion-tiempos', 'POST', filters);

// 4.3. Pestaña: Desempeño
export const getDashboardAgrupacion = (dimension, filters) => apiRequest(`/dashboard/agrupacion/${dimension}`, 'POST', filters);

// 4.5. Pestaña: Análisis de Pagos
export const getDashboardPagos = (filters) => apiRequest('/dashboard/pagos', 'POST', filters);

// 4.6. Pestaña: Monitoreo de Cola
export const getDashboardAnalisisCola = (filters) => apiRequest('/dashboard/analisis-cola', 'POST', filters);

// 4.7. Pestaña: Análisis Detallado de Tiempo
export const getDashboardAnalisisTiemposFranjas = (filters) => apiRequest('/dashboard/analisis-tiempos-franjas', 'POST', filters);

// 4.8. Scorecard Individual de Gestor
export const getDashboardGestorResumen = (nombre, filters) => apiRequest(`/dashboard/gestor/${nombre}/resumen`, 'POST', filters);

// 4.9. Análisis Avanzado (ROI, Promesas, Eficiencia)
export const getDashboardAnalisisAvanzado = (filters) => apiRequest('/dashboard/analisis-avanzado', 'POST', filters);
