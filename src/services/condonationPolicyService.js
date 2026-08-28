// src/services/condonationPolicyService.js
import { apiRequest } from './api';

/**
 * Servicio para interactuar con la gestión de Políticas de Condonación
 * (Base para la variable dinámica {{POLITICA:meses}}).
 */
export const condonationPolicyService = {
  /**
   * Obtiene la versión de política actualmente activa con todas sus reglas.
   */
  async getActivePolicy() {
    return await apiRequest('/condonation-policies/active', 'GET');
  },

  /**
   * Lista el histórico de todas las versiones de políticas creadas.
   */
  async getAllPolicies() {
    return await apiRequest('/condonation-policies/', 'GET');
  },

  /**
   * Obtiene el detalle de una versión específica de política por su ID.
   */
  async getPolicyById(policyId) {
    return await apiRequest(`/condonation-policies/${policyId}`, 'GET');
  },

  /**
   * Crea una nueva versión de política con su matriz de reglas.
   */
  async createPolicy(policyData) {
    return await apiRequest('/condonation-policies/', 'POST', policyData);
  },

  /**
   * Actualiza los datos o la matriz de reglas de una política existente.
   */
  async updatePolicy(policyId, policyData) {
    return await apiRequest(`/condonation-policies/${policyId}`, 'PUT', policyData);
  },

  /**
   * Activa una política específica (desactivando las demás).
   */
  async activatePolicy(policyId) {
    return await apiRequest(`/condonation-policies/${policyId}/activate`, 'PUT');
  },

  /**
   * Elimina una política inactiva.
   */
  async deletePolicy(policyId) {
    return await apiRequest(`/condonation-policies/${policyId}`, 'DELETE');
  },

  /**
   * Simula en tiempo real los valores condonados y montos a pagar.
   */
  async simulateCalculation(simulationData) {
    return await apiRequest('/condonation-policies/simulate', 'POST', simulationData);
  },

  /**
   * Ejecuta el seed inicial en caso de que la tabla esté vacía.
   */
  async seedDefaultPolicy() {
    return await apiRequest('/condonation-policies/seed', 'POST');
  },
};

export default condonationPolicyService;
