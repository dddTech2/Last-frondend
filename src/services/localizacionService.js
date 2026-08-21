// src/services/localizacionService.js
import { apiRequest } from './api';

/**
 * Servicio para interactuar con los endpoints de Localización y Scraping On-Demand.
 */
export const localizacionService = {
  /**
   * Encola una o varias cédulas para consulta asíncrona en Celery.
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
   */
  async getEstadoTarea(taskId) {
    return await apiRequest(`/localizacion/tareas/${taskId}`, 'GET');
  },

  /**
   * Ejecuta consulta síncrona en vivo para 1 cédula.
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
   */
  async getPerfilPersona(cedula) {
    return await apiRequest(`/localizacion/persona/${cedula}`, 'GET');
  },

  /**
   * Consulta el historial inmutable de intentos de una cédula.
   */
  async getHistorialCedula(cedula, params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/localizacion/historial/${encodeURIComponent(cedula)}${query ? `?${query}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  /**
   * Consulta el historial global de scraping para auditoría.
   * Si se envía cédula, utiliza /localizacion/historial/{cedula}.
   */
  async getHistorialGlobal(params = {}) {
    const { cedula, ...rest } = params;
    let endpoint = '/localizacion/historial';
    if (cedula && String(cedula).trim()) {
      const cleanCedula = encodeURIComponent(String(cedula).trim());
      const query = new URLSearchParams(rest).toString();
      endpoint = `/localizacion/historial/${cleanCedula}${query ? `?${query}` : ''}`;
    } else {
      const query = new URLSearchParams(params).toString();
      endpoint = `/localizacion/historial${query ? `?${query}` : ''}`;
    }
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
