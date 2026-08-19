// src/services/localizacionService.js
import { apiRequest } from './api';

/**
 * Servicio para interactuar con los endpoints de Localización y Scraping On-Demand.
 */
export const localizacionService = {
  /**
   * Encola una o varias cédulas para consulta asíncrona en Celery.
   * @param {Array<string>} cedulas - Lista de números de cédula.
   * @param {Array<string>} [fuentes] - Lista de fuentes opcional.
   * @param {boolean} [cascade=true] - Cascada inteligente.
   * @param {string} [priority='NORMAL'] - Prioridad ('ALTA' | 'NORMAL').
   */
  async encolarConsulta(cedulas, fuentes = null, cascade = true, priority = 'NORMAL') {
    return await apiRequest('/localizacion/consultar', 'POST', {
      cedulas,
      fuentes,
      cascade,
      priority,
    });
  },

  /**
   * Obtiene el estado y progreso en tiempo real de una tarea encolada.
   * @param {string} taskId - ID de la tarea Celery.
   */
  async getEstadoTarea(taskId) {
    return await apiRequest(`/localizacion/tareas/${taskId}`, 'GET');
  },

  /**
   * Ejecuta consulta síncrona en vivo para 1 cédula.
   * @param {string} cedula - Número de cédula.
   * @param {Array<string>} [fuentes] - Fuentes rápidas.
   * @param {string} [tipoDocumento='CC'] - Tipo de documento.
   * @param {string} [fechaNacimiento] - Fecha de nacimiento.
   * @param {string} [fechaExpedicion] - Fecha de expedición.
   */
  async consultarInmediato(cedula, fuentes = null, tipoDocumento = 'CC', fechaNacimiento = null, fechaExpedicion = null) {
    return await apiRequest('/localizacion/consultar-inmediato', 'POST', {
      cedula,
      tipo_documento: tipoDocumento,
      fuentes,
      fecha_nacimiento: fechaNacimiento,
      fecha_expedicion: fechaExpedicion,
    });
  },

  /**
   * Obtiene el perfil consolidado 360° de localización para una cédula.
   * @param {string} cedula - Número de cédula.
   */
  async getPerfilPersona(cedula) {
    return await apiRequest(`/localizacion/persona/${cedula}`, 'GET');
  },

  /**
   * Consulta el historial inmutable de intentos de una cédula.
   * @param {string} cedula - Número de cédula.
   * @param {Object} [params] - Filtros (fuente, status, limit, offset).
   */
  async getHistorialCedula(cedula, params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/localizacion/historial/${cedula}${query ? `?${query}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  /**
   * Consulta el historial global de scraping para auditoría.
   * @param {Object} [params] - Filtros (fuente, status, run_id, limit, offset).
   */
  async getHistorialGlobal(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/localizacion/historial${query ? `?${query}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  /**
   * Consulta el estado de conectividad y salud de cada scraper.
   */
  async getHealth() {
    return await apiRequest('/localizacion/health', 'GET');
  },
};

export default localizacionService;
