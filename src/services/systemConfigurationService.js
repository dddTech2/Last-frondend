// src/services/systemConfigurationService.js
import { apiRequest } from './api';

/**
 * Servicio para gestión de configuraciones del sistema y reglas de WhatsApp.
 */
export const systemConfigurationService = {
  /**
   * Obtiene el banner público para cualquier usuario autenticado en el Dashboard.
   */
  async getPublicBanner() {
    return await apiRequest('/system-configurations/public-banner', 'GET');
  },

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
   * Guarda todos los parámetros del banner del sistema de una sola vez.
   */
  async saveBannerConfig({ enabled, title, text, type, dismissible }) {
    return await Promise.all([
      this.upsert('SYSTEM_BANNER_ENABLED', enabled ? 'true' : 'false', 'Activar o desactivar el banner en el Dashboard', 'boolean'),
      this.upsert('SYSTEM_BANNER_TITLE', title || 'Atención', 'Título del banner de aviso', 'string'),
      this.upsert('SYSTEM_BANNER_TEXT', text || '', 'Mensaje descriptivo del banner', 'string'),
      this.upsert('SYSTEM_BANNER_TYPE', type || 'warning', 'Estilo visual del banner (warning, info, danger, success)', 'string'),
      this.upsert('SYSTEM_BANNER_DISMISSIBLE', dismissible ? 'true' : 'false', 'Permitir cerrar el banner temporalmente', 'boolean'),
    ]);
  },

  /**
   * Elimina una configuración.
   */
  async delete(key) {
    return await apiRequest(`/system-configurations/${encodeURIComponent(key)}`, 'DELETE');
  },
};

export default systemConfigurationService;
