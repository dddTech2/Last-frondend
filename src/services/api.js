export const BASE_URL = "https://backend-475190189080.us-central1.run.app/api/v1";
//export const BASE_URL = "http://localhost:8000/api/v1";


// Función para obtener el token de autenticación
const getAuthToken = () => {
  const tokenData = localStorage.getItem('authToken');
  if (tokenData) {
    const token = JSON.parse(tokenData);
    return token.access_token;
  }
  return null;
};

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const traceId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const start = performance.now();
  const isNotif = endpoint.startsWith('/notifications');
  if (isNotif) console.debug('[API][Notifications][REQUEST]', { traceId, endpoint, method, body });
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error en la petición a ${endpoint}` }));
      let errorMessage = `Error en la petición a ${endpoint}`;

      if (response.status === 422 && errorData.detail) {
        // FastAPI validation errors often come as an array of objects
        errorMessage = errorData.detail.map(err => `${err.loc.join('.')} -> ${err.msg}`).join('; ');
      } else if (errorData.detail && typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }

      if (isNotif) {
        console.error('[API][Notifications][HTTP_ERROR]', { traceId, endpoint, status: response.status, errorMessage, errorData });
      }
      
      // Crear error con status code incluido para identificarlo después
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }
    const json = await response.json();
    if (isNotif) {
      const dur = (performance.now() - start).toFixed(1);
      console.debug('[API][Notifications][RESPONSE]', { traceId, endpoint, durationMs: dur, size: (Array.isArray(json) ? json.length : (json?.data?.length ?? 'n/a')) });
    }
    return json;
  } catch (error) {
    if (isNotif) {
      const dur = (performance.now() - start).toFixed(1);
      console.error('[API][Notifications][ERROR]', { traceId, endpoint, method, durationMs: dur, message: error.message });
    } else {
      // No loguear errores 404 - son esperados cuando se busca un recurso que no existe
      // Solo loguear errores reales de la aplicación
      if (error.status !== 404) {
        console.error(`API request failed: ${error.message}`);
      }
    }

    // Provide more specific error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      throw new Error('Error de conexión: No se pudo conectar al servidor. Verifica tu conexión a internet.');
    }

    throw error;
  }
};

const apiRequestWithFile = async (endpoint, method = 'POST', file) => {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append('file', file);

  const config = {
    method,
    headers,
    body: formData,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error en la petición a ${endpoint}` }));
      let errorMessage = `Error en la petición a ${endpoint}`;

      if (response.status === 422 && errorData.detail) {
        errorMessage = errorData.detail.map(err => `${err.loc.join('.')} -> ${err.msg}`).join('; ');
      } else if (errorData.detail && typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error(`API file request failed: ${error.message}`);
    throw error;
  }
};

// --- Endpoints de Autenticación ---
export const checkUserIdentifier = (identifier) => apiRequest('/auth/login/check-identifier', 'POST', { identifier });
export const loginWithPassword = (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  return fetch(`${BASE_URL}/auth/login/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  }).then(async response => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error en el login');
    }
    return response.json();
  });
};
export const firstTimeLogin = (identifier, password) => apiRequest('/auth/login/first-time', 'POST', { identifier, password });

// --- Endpoints de Usuario ---
export const changePassword = (current_password, new_password) => apiRequest('/users/me/change-password', 'PUT', { current_password, new_password });


// --- Endpoints de Segmentación ---
export const getAvailableFilterFields = () => apiRequest('/audience/available-filters');
export const getDistinctValues = (fieldName) => apiRequest(`/audience/filters/distinct-values/${fieldName}`);
export const getSimpleFilters = () => apiRequest('/audience/filters/simple');
export const getSimpleClientCount = (definition) => apiRequest('/audience/count/simple', 'POST', definition);
export const createSimpleFilter = (filterData) => apiRequest('/audience/filters/simple', 'POST', filterData);

// --- Endpoints de Campañas ---
export const getCampaignStats = () => apiRequest('/campaigns/stats');
export const refreshCampaignStats = () => apiRequest('/campaigns/stats/refresh', 'POST');
export const createAndLaunchCampaign = (campaignData) => apiRequest('/campaigns/', 'POST', campaignData);
export const getAllCampaigns = () => apiRequest('/campaigns/');
export const deleteCampaign = (campaignId) => apiRequest(`/campaigns/${campaignId}`, 'DELETE');

// Preview de campaña en CSV (respuesta como Blob)
export const getCampaignPreviewCSV = async (payload) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/csv,application/octet-stream,application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/campaigns/preview/csv`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    try {
      const ct = res.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data?.detail)) {
          throw new Error(data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; '));
        }
        throw new Error(data?.detail || data?.message || `Error ${res.status}`);
      } else {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }
    } catch (e) {
      throw new Error(e.message || `Error ${res.status}`);
    }
  }
  return res;
};

// --- Endpoints de Campañas Recurrentes (Schedules) ---
export const createSchedule = (scheduleData) => apiRequest('/schedules/', 'POST', scheduleData);
export const getSchedules = () => apiRequest('/schedules/');
export const updateSchedule = (scheduleId, scheduleData) => apiRequest(`/schedules/${scheduleId}`, 'PATCH', scheduleData);
export const deleteSchedule = (scheduleId) => apiRequest(`/schedules/${scheduleId}`, 'DELETE');
export const getScheduleCampaigns = (scheduleId) => apiRequest(`/schedules/${scheduleId}/campaigns`);

// --- Endpoints de Plantillas ---
export const getTemplates = () => apiRequest('/templates/');
export const getTemplatesByStatus = (status) => apiRequest(`/templates/?status=${status}`);

export const createTemplate = (templateData) => apiRequest('/templates/', 'POST', templateData);

// Contar caracteres de plantilla SMS
export const getCharacterCount = (content) => apiRequest('/templates/character-count', 'POST', { content });

// --- Endpoints de Notificaciones ---
export const getNotifications = () => apiRequest('/notifications/');
export const getUnreadNotificationsCount = () => apiRequest('/notifications/unread-count');
export const markNotificationAsRead = (notificationId) => apiRequest(`/notifications/${notificationId}/read`, 'PATCH');
export const markAllNotificationsAsRead = () => apiRequest('/notifications/read-all', 'POST');

export const getTemplatePreview = (templateId) => apiRequest(`/templates/${templateId}/preview`);
export const getTemplatePreviewWithCedula = (templateId, cedula) => apiRequest(`/templates/${templateId}/preview?cedula=${cedula}`);
export const getTemplateById = (templateId) => apiRequest(`/templates/${templateId}`);
import TemplateReviewRequest from '../schemas/TemplateReviewRequest';
export const getTemplateVariables = () => apiRequest('/templates/variables');
export const getPendingTemplates = () => apiRequest('/templates/pending-review');
export const approveTemplate = (templateId) => apiRequest(`/templates/${templateId}/internal-approve`, 'POST', {});
export const rejectTemplate = (templateId, rejection_reason) => {
  const body = new TemplateReviewRequest(false, rejection_reason);
  return apiRequest(`/templates/${templateId}/internal-reject`, 'POST', body);
};
export const reviewTemplate = (templateId, reviewData) => apiRequest(`/templates/${templateId}/review`, 'POST', reviewData);

// --- Endpoints de Contactos ---
export const uploadContactsCSV = (file) => apiRequestWithFile('/staff-contacts/bulk', 'POST', file);

// --- Endpoints de WhatsApp Media ---
export const getSignedUploadUrl = (conversation_id, mime_type, original_filename) =>
  apiRequest('/whatsapp/media/generate_signed_upload_url', 'POST', { conversation_id, mime_type, original_filename });

export const getSignedUploadForMedia = (conversation_id, content_type, kind, original_filename) =>
  apiRequest('/conversations/signed-upload', 'POST', { conversation_id, content_type, kind, original_filename });

// --- Endpoints de Conversaciones ---
export const getConversations = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);
  if (params.search) queryParams.append('search', params.search); // Añadir parámetro de búsqueda

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/conversations/?${queryString}`
    : '/conversations/';

  return apiRequest(endpoint);
};
export const assignConversation = (conversationId, userId) => apiRequest(`/conversations/${conversationId}/assign/${userId}`, 'POST');
export const getConversation = (conversationId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/conversations/${conversationId}?${queryString}`
    : `/conversations/${conversationId}`;

  return apiRequest(endpoint);
};
export const getConversationMessages = (conversationId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.before) queryParams.append('before', params.before);
  if (params.after) queryParams.append('after', params.after);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/conversations/${conversationId}/messages?${queryString}`
    : `/conversations/${conversationId}/messages`;

  return apiRequest(endpoint);
};
export const sendMessage = (conversationId, messageData) => apiRequest(`/conversations/${conversationId}/reply`, 'POST', messageData);
export const markConversationAsRead = (conversationId) => apiRequest(`/conversations/${conversationId}/read`, 'PATCH');
export const markConversationAsUnread = (conversationId) => apiRequest(`/conversations/${conversationId}/unread`, 'PATCH');
export const getLastMessageForConversation = async (conversationId) => {
  const response = await getConversationMessages(conversationId, { limit: 1 });
  return response.messages && response.messages.length > 0 ? response.messages[0] : null;
};
// --- Endpoints de Respuesta Multimedia desde GCS ---
export const sendAudioFromGCS = (conversationId, gcsUrl) => apiRequest(`/conversations/${conversationId}/reply/audio-from-gcs`, 'POST', { storage_object: gcsUrl });
export const sendDocumentFromGCS = (conversationId, gcsUrl, filename) => apiRequest(`/conversations/${conversationId}/reply/document-from-gcs`, 'POST', { storage_object: gcsUrl, filename });
export const sendImageFromGCS = (conversationId, gcsUrl) => apiRequest(`/conversations/${conversationId}/reply/image-from-gcs`, 'POST', { storage_object: gcsUrl });
export const sendVideoFromGCS = (conversationId, gcsUrl) => apiRequest(`/conversations/${conversationId}/reply/video-from-gcs`, 'POST', { storage_object: gcsUrl });
export const sendStickerFromGCS = (conversationId, gcsUrl) => apiRequest(`/conversations/${conversationId}/reply/sticker-from-gcs`, 'POST', { storage_object: gcsUrl });
export const getMediaUrl = async (conversationId, messageId, retries = 3, initialDelay = 500) => {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiRequest(`/conversations/${conversationId}/messages/${messageId}/media/signed-url`);
      return response;
    } catch (error) {
      if (i === 0) { // Solo mostrar el warning en el primer intento
        console.warn(`Attempt ${i + 1} failed to get media URL for message ${messageId}:`, error.message);
      }
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error(`All attempts failed to get media URL for message ${messageId}:`, error);
        return { error: true, message: error.message };
      }
    }
  }
};
export const addTagToConversation = (conversationId, tagName) => apiRequest(`/conversations/${conversationId}/tags`, 'POST', { name: tagName });

export const getObligationUrlByCedula = (cedula) => apiRequest(`/obligation-urls/by-cedula/${cedula}`);

// --- Endpoints de Información del Cliente ---
export const getResultadoGestor = (cedula) => apiRequest(`/client-info/resultado-gestor/${cedula}`);
export const getCompromisos = (cedula) => apiRequest(`/client-info/compromisos/${cedula}`);
export const getObligaciones = (cedula) => apiRequest(`/client-info/obligaciones/${cedula}`);
export const getObligacionesByCedula = (cedula) => apiRequest(`/client-info/obligaciones/${cedula}`);

// --- Endpoints de Políticas de Condonación ---
export const calculateCondonation = (obligation_ids) => apiRequest('/condonation-policies/calculate', 'POST', { obligation_ids });

// --- Endpoints de WhatsApp ---
export const getClientActiveNumbersByCedula = (cedula) => apiRequest('/whatsapp/initiate', 'POST', { cedula });
export const sendTemplatedMessage = (data) => apiRequest('/whatsapp/send_from_template', 'POST', data);

// --- Endpoints de Administración de Personal ---
export const getEmployees = (params) => {
  // Filtra los parámetros para excluir claves con valor `undefined`
  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryParams = new URLSearchParams(filteredParams).toString();
  return apiRequest(`/employees/?${queryParams}`);
};
export const createEmployee = (employeeData) => apiRequest('/employees/', 'POST', employeeData);

/**
 * Obtener empleado por cédula - maneja 404 sin lanzar excepción
 * Retorna null si no existe (en lugar de lanzar error)
 */
export const getEmployeeByCedula = async (cedula) => {
  try {
    return await apiRequest(`/employees/${cedula}`);
  } catch (error) {
    // Si es 404, retornar null (empleado no existe)
    if (error.status === 404) {
      return null;
    }
    // Para otros errores, relanzar
    throw error;
  }
};

export const updateEmployee = (cedula, employeeData) => apiRequest(`/employees/${cedula}`, 'PUT', employeeData);
export const requestRetirement = (retirementData) => apiRequest('/employees/retire', 'POST', retirementData);
export const approveContract = (cedula) => apiRequest(`/employees/${cedula}/juridico/approve`, 'POST', {});
export const rejectContract = (cedula, motivo) => apiRequest(`/employees/${cedula}/juridico/reject`, 'POST', { motivo });
export const approveRetirement = (cedula) => apiRequest(`/employees/${cedula}/retire/approve`, 'POST', {});
export const rejectRetirement = (cedula, motivo) => apiRequest(`/employees/${cedula}/retire/reject`, 'POST', { motivo_rechazo_juridico: motivo });

// --- Endpoints de Comunicaciones (Documents) ---
export const getCommunicationTemplates = (statusFilter = 'APPROVED', templateType = null) => {
  let endpoint = `/communications/templates?status_filter=${statusFilter}`;
  if (templateType) {
    endpoint += `&template_type=${templateType}`;
  }
  return apiRequest(endpoint);
};
export const getCommunicationTemplate = (templateId) => apiRequest(`/communications/templates/${templateId}`);
export const getCommunicationTemplateFile = async (filePath) => {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}/communications/templates/file/${encodeURIComponent(filePath)}`, {
      method: 'GET',
      headers,  
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Obtener el tipo MIME de la respuesta
    const mimeType = response.headers.get('content-type') || 'text/plain';
    const blob = await response.blob();
    
    // Retornar blob con tipo MIME
    return {
      blob,
      mimeType,
      url: URL.createObjectURL(blob),
    };
  } catch (error) {
    console.error(`Error fetching template file: ${error.message}`);
    throw error;
  }
};
export const createCommunicationTemplate = (templateData) => apiRequest('/communications/templates', 'POST', templateData);
export const updateCommunicationTemplate = (templateId, templateData) => apiRequest(`/communications/templates/${templateId}`, 'PUT', templateData);
export const generateCommunication = (communicationData) => apiRequest('/communications/generate', 'POST', communicationData);
export const sendCommunication = (commId, sendData) => apiRequest(`/communications/${commId}/send`, 'PATCH', sendData);
export const getCommunicationPreview = async (commId) => {
  const token = getAuthToken();
  const headers = {
    'Accept': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,text/plain,application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/communications/${commId}/preview`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    try {
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        if (Array.isArray(errorData?.detail)) {
          throw new Error(errorData.detail.map(err => err.msg || err.message || JSON.stringify(err)).join('; '));
        }
        throw new Error(errorData?.detail || errorData?.message || `Error ${response.status}`);
      }
      const text = await response.text();
      throw new Error(text || `Error ${response.status}`);
    } catch (error) {
      console.error('Error obteniendo preview de comunicación:', error);
      throw error;
    }
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  if (contentType.startsWith('text/')) {
    return response.text();
  }
  return response.blob();
};

// --- Endpoints para campos de plantillas de comunicación ---
export const getCommunicationTemplateFields = (templateId) => apiRequest(`/communications/templates/${templateId}/fields`);
export const updateCommunicationTemplateField = (fieldId, fieldData) => apiRequest(`/communications/templates/fields/${fieldId}`, 'PUT', fieldData);
