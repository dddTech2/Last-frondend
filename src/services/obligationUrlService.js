// src/services/obligationUrlService.js
import { apiRequest, apiRequestWithFile } from './api';

/**
 * Servicio para gestión y carga por lotes (batches) de Tokens y Enlaces de Pago de Obligaciones.
 */
export const obligationUrlService = {
  /**
   * Carga masiva directa por archivo CSV, TSV, TXT o Excel (para archivos <= 25MB).
   */
  async uploadFile(file) {
    return await apiRequestWithFile('/obligation-urls/upload', 'POST', file);
  },

  /**
   * Ingesta un lote JSON de registros {obligacion, url} (para chunking cliente sin límite de tamaño).
   */
  async ingestBatch(items) {
    return await apiRequest('/obligation-urls/batch', 'POST', { items });
  },

  /**
   * Obtiene estadísticas de cobertura global de tokens / URLs de pago.
   */
  async getStats() {
    return await apiRequest('/obligation-urls/stats', 'GET');
  },

  /**
   * Obtiene lista paginada de tokens/URLs con búsqueda opcional.
   */
  async getPaginated({ page = 1, size = 20, search = '' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    return await apiRequest(`/obligation-urls/?${params.toString()}`, 'GET');
  },

  /**
   * Obtiene la URL de una obligación específica.
   */
  async getByObligacion(obligacion) {
    return await apiRequest(`/obligation-urls/${encodeURIComponent(obligacion)}`, 'GET');
  },

  /**
   * Obtiene la URL de la obligación más reciente de una cédula.
   */
  async getByCedula(cedula) {
    return await apiRequest(`/obligation-urls/by-cedula/${encodeURIComponent(cedula)}`, 'GET');
  },

  /**
   * Guarda o actualiza manualmente la URL/token de una obligación.
   */
  async saveManual(obligacion, url) {
    return await apiRequest('/obligation-urls/manual', 'POST', { obligacion, url });
  },

  /**
   * Elimina la URL configurada para una obligación.
   */
  async deleteUrl(obligacion) {
    return await apiRequest(`/obligation-urls/${encodeURIComponent(obligacion)}`, 'DELETE');
  },
};

export default obligationUrlService;
