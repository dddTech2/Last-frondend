// src/services/obligationUrlService.js
import { apiRequest } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-renovar-475190189080.us-central1.run.app/api/v1';

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Servicio para gestión y carga por lotes (batches) de Tokens y Enlaces de Pago de Obligaciones.
 */
export const obligationUrlService = {
  /**
   * Carga masiva por lotes (batches) de archivo CSV, TSV, TXT o Excel.
   */
  async uploadFile(file) {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/obligation-urls/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error al procesar el archivo' }));
      throw new Error(errorData.detail || errorData.message || 'Error en la carga masiva');
    }

    return await response.json();
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
