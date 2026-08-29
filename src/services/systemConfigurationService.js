// src/services/systemConfigurationService.js
import { apiRequest } from './api';

/**
 * Servicio para gestión de configuraciones del sistema y reglas de WhatsApp.
 */
export const systemConfigurationService = {
  /**
   * Obtiene todas las configuraciones del sistema.
   */
  async getAll() {
    return await apiRequest('/system-configurations/', 'GET');
  },

  /**
   * Obtiene las reglas estructuradas de WhatsApp (límites, periodos de gracia y reglas de elegibilidad por plantilla).
   */
  async getWhatsAppRules() {
    return await apiRequest('/system-configurations/whatsapp-rules', 'GET');
  },

  /**
   * Obtiene una configuración por su clave.
   */
  async getByKey(key) {
    return await apiRequest(`/system-configurations/${encodeURIComponent(key)}`, 'GET');
  },

  /**
   * Crea o actualiza una configuración.
   */
  async upsert(key, value, description = null, type = 'string') {
    return await apiRequest('/system-configurations/', 'POST', {
      key,
      value: String(value),
      description,
      type,
    });
  },

  /**
   * Actualiza el valor de una configuración existente.
   */
  async update(key, value, description = null) {
    return await apiRequest(`/system-configurations/${encodeURIComponent(key)}`, 'PUT', {
      value: String(value),
      description,
    });
  },

  /**
   * Elimina una configuración.
   */
  async delete(key) {
    return await apiRequest(`/system-configurations/${encodeURIComponent(key)}`, 'DELETE');
  },
};

export default systemConfigurationService;
