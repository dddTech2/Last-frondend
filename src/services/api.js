// La URL se toma de la variable de entorno VITE_API_URL si existe,
// de lo contrario usa la URL de producción por defecto.
// export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
export const BASE_URL = import.meta.env.VITE_API_URL || "https://backend-475190189080.us-central1.run.app/api/v1";


// Función para obtener el token de autenticación
const getAuthToken = () => {
  const tokenData = localStorage.getItem('authToken');
  if (tokenData) {
    const token = JSON.parse(tokenData);
    return token.access_token;
  }
  return null;
};

export const apiRequest = async (endpoint, method = 'GET', body = null) => {
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

    // Si es 204 No Content, no hay body para parsear
    if (response.status === 204) {
      return null;
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
export const getUserProfile = () => apiRequest('/users/me');
export const changePassword = (current_password, new_password) => apiRequest('/users/me/change-password', 'PUT', { current_password, new_password });

// --- Endpoints de Administración de Usuarios (Admin) ---
export const getUsers = (skip = 0, limit = 100) => apiRequest(`/users/?skip=${skip}&limit=${limit}`);
export const createUser = (userData) => apiRequest('/users/', 'POST', userData);
export const updateUser = (userId, userData) => apiRequest(`/users/${userId}`, 'PUT', userData);
export const deleteUser = (userId) => apiRequest(`/users/${userId}`, 'DELETE');
export const resetUserPassword = (userId, new_password) => apiRequest(`/users/${userId}/password`, 'PUT', { new_password });
export const updateUserRoles = (userId, role_ids) => apiRequest(`/users/${userId}/roles`, 'PUT', { role_ids });
export const unlockUser = (userId) => apiRequest(`/users/${userId}/unlock`, 'POST');


// --- Endpoints de Segmentación ---
export const getAvailableFilterFields = () => apiRequest('/audience/available-filters');
export const getDistinctValues = (fieldName) => apiRequest(`/audience/filters/distinct-values/${fieldName}`);
export const getSimpleFilters = () => apiRequest('/audience/filters/simple');
export const getSimpleClientCount = (definition) => apiRequest('/audience/count/simple', 'POST', definition);
export const createSimpleFilter = (filterData) => apiRequest('/audience/filters/simple', 'POST', filterData);

// --- Endpoints de Campañas ---
export const getCampaignStats = () => apiRequest('/campaigns/stats');
export const getDashboardStats = () => apiRequest('/campaigns/dashboard-stats');
export const refreshCampaignStats = () => apiRequest('/campaigns/stats/refresh', 'POST');
export const getCampaignById = (campaignId) => apiRequest(`/campaigns/${campaignId}`);
export const updateCampaign = (campaignId, campaignData) => apiRequest(`/campaigns/${campaignId}`, 'PUT', campaignData);
export const createAndLaunchCampaign = (campaignData) => apiRequest('/campaigns/', 'POST', campaignData);
export const activateCampaign = (campaignId) => apiRequest(`/campaigns/${campaignId}/activate`, 'POST');
export const inactivateCampaign = (campaignId) => apiRequest(`/campaigns/${campaignId}/inactivate`, 'POST');
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

export const downloadCampaignLogReport = async (campaignId) => {
  const token = getAuthToken();
  const headers = {
    'Accept': 'text/csv,application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/reports/send-log-report?campaign_id=${campaignId}&action=download`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Error ${response.status}`);
  }
  return response;
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
export const getSignedUploadUrl = (conversation_id, mime_type, kind = 'media') =>
  apiRequest('/whatsapp/media/generate_signed_upload_url', 'POST', { conversation_id, mime_type, kind });

export const uploadMediaFromGCS = (storage_object, mime_type = null) =>
  apiRequest('/whatsapp/media/upload_from_gcs', 'POST', { storage_object, mime_type });

export const getSignedUploadForMedia = (conversation_id, content_type, kind, original_filename) =>
  apiRequest('/conversations/signed-upload', 'POST', { conversation_id, content_type, kind, original_filename });

// --- Endpoints de Usuarios (Filtros de Conversaciones) ---
export const getMyTeam = (coordinatorId) => {
  const queryParams = new URLSearchParams();
  if (coordinatorId) queryParams.append('coordinator_id', coordinatorId);
  const queryString = queryParams.toString();
  return apiRequest(queryString ? `/users/my-team?${queryString}` : '/users/my-team');
};

export const getCoordinators = () => apiRequest('/users/coordinators');

// --- Endpoints de Conversaciones ---
export const getConversations = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);
  if (params.search) queryParams.append('search', params.search);
  if (params.filter) queryParams.append('filter', params.filter);
  if (params.coordinator_id) queryParams.append('coordinator_id', params.coordinator_id);

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
export const sendDocumentFromGCS = (conversationId, gcsUrl) => apiRequest(`/conversations/${conversationId}/reply/document-from-gcs`, 'POST', { storage_object: gcsUrl });
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

export const getCampaignHistory = (params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else if (key === 'status' && value) {
        // Status debe ser un array, convertir si es string
        queryParams.append(key, value);
      } else {
        queryParams.append(key, value);
      }
    }
  });
  return apiRequest(`/reports/campaign-history?${queryParams.toString()}`);
};

export const exportCampaignHistory = (filters, email) => {
  const queryParams = new URLSearchParams();
  queryParams.append('email', email);

  // Normalizar filtros para que coincidan con el schema del backend
  const normalizedFilters = {
    start_date: filters.start_date || null,
    end_date: filters.end_date || null,
    channel: filters.channel || null,
    status: filters.status ? [filters.status] : null, // Convertir a lista
    client_cedula: filters.client_cedula || null,
    recipient_contact: filters.recipient_contact || null,
    skip: 0,
    limit: 50
  };

  // Eliminar campos null para no enviarlos
  const cleanFilters = Object.fromEntries(
    Object.entries(normalizedFilters).filter(([_, v]) => v !== null && v !== '')
  );

  return apiRequest(`/reports/campaign-history/export?${queryParams.toString()}`, 'POST', cleanFilters);
};

export const getClientNamesLookup = async (file) => {
  return apiRequestWithFile('/reports/client-names-lookup', 'POST', file);
};

// --- Endpoints de Información del Cliente ---
export const getResultadoGestor = (cedula) => apiRequest(`/client-info/resultado-gestor/${cedula}`);
export const getCompromisos = (cedula) => apiRequest(`/client-info/compromisos/${cedula}`);
export const getObligaciones = (cedula) => apiRequest(`/client-info/obligaciones/${cedula}`);
export const getObligacionesByCedula = (cedula) => apiRequest(`/client-info/obligaciones/${cedula}`);
export const getClientChannelsByCedula = (cedula) => apiRequest(`/client-info/channels/${cedula}`);

// --- Endpoints de Demográficos ---
export const getClientProfile = (cedula, includeParams = null) => {
  let endpoint = `/client-info/profile/${cedula}`;
  if (includeParams) {
    const queryParams = new URLSearchParams();
    if (includeParams.include) queryParams.append('include', includeParams.include);
    if (includeParams.messages_limit) queryParams.append('messages_limit', includeParams.messages_limit);
    if (includeParams.messages_offset) queryParams.append('messages_offset', includeParams.messages_offset);
    const queryString = queryParams.toString();
    if (queryString) endpoint += `?${queryString}`;
  }
  return apiRequest(endpoint);
};

export const reverseSearchContact = (contactValue) => apiRequest(`/client-info/contact/${contactValue}`);

export const updateContactStatus = (contactValue, channel, status, detail = null) =>
  apiRequest('/client-info/contact/status', 'PATCH', { contact_value: contactValue, channel, status, detail });

export const bulkSearchContacts = async (file) => {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/client-info/contacts/bulk`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error en la búsqueda masiva' }));
    throw new Error(errorData.detail || errorData.message || 'Error en la búsqueda masiva');
  }

  return response.blob();
};

export const bulkGetActiveChannels = async (file, channelType, filterType = 'TODOS_ACTIVOS') => {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/client-info/channels/bulk?channel_type=${channelType}&filter_type=${filterType}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error en la búsqueda de canales' }));
    throw new Error(errorData.detail || errorData.message || 'Error en la búsqueda de canales');
  }

  return response.blob();
};

// --- Endpoints de Políticas de Condonación ---
export const calculateCondonation = (obligation_ids) => apiRequest('/condonation-policies/calculate', 'POST', { obligation_ids });

// --- Endpoints de WhatsApp ---
export const getClientActiveNumbersByCedula = (cedula) => apiRequest('/whatsapp/initiate', 'POST', { cedula });
export const sendTemplatedMessage = (data) => apiRequest('/whatsapp/send_from_template', 'POST', data);
export const checkRoutingChannel = (phoneNumber) => apiRequest(`/whatsapp/routing/${phoneNumber}`, 'GET');
export const sendDirectWhatsAppMessage = (data) => apiRequest('/whatsapp/send', 'POST', { ...data, messaging_product: 'whatsapp' });
export const fetchWhatsAppProfile = (phoneNumber, instanceName = null) =>
  apiRequest('/whatsapp/fetch_profile', 'POST', { phone_number: phoneNumber, instance_name: instanceName });
export const fetchWhatsAppProfilePicture = (phoneNumber, instanceName = null) =>
  apiRequest('/whatsapp/fetch_profile_picture', 'POST', { phone_number: phoneNumber, instance_name: instanceName });

// --- Endpoints de Historial de Comunicaciones ---
export const getClientCommunicationHistory = (cedula, page = 1, limit = 20, communicationType = 'DOCUMENTO') => {
  const queryParams = new URLSearchParams({
    page,
    limit,
    communication_type: communicationType
  }).toString();
  return apiRequest(`/communications/history/${cedula}?${queryParams}`);
};

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
export const updateEmployeeFull = (cedula, employeeData) => apiRequest(`/employees/${cedula}/full`, 'PUT', employeeData);
export const requestRetirement = (retirementData) => apiRequest('/employees/retire', 'POST', retirementData);
export const approveContract = (cedula) => apiRequest(`/employees/${cedula}/juridico/approve`, 'POST', {});
export const rejectContract = (cedula, motivo) => apiRequest(`/employees/${cedula}/juridico/reject`, 'POST', { motivo });
export const approveRetirement = (cedula, data = {}) => apiRequest(`/employees/${cedula}/retire/approve`, 'POST', data);
export const rejectRetirement = (cedula, motivo) => apiRequest(`/employees/${cedula}/retire/reject`, 'POST', { motivo_rechazo_juridico: motivo });

// --- Endpoints de Credenciales de Empleados ---
export const checkEmployeeCredential = (adminfo) => apiRequest(`/employee-credentials/${adminfo}`);
export const checkMyEmployeeCredentials = () => apiRequest('/employee-credentials/me/check');

// --- Gestión de Contraseñas de Empleados (Admin) ---
export const uploadEmployeeCredentialsCSV = (file) => apiRequestWithFile('/employee-credentials/upload-csv', 'POST', file);
export const createEmployeeCredential = (credentialData) => apiRequest('/employee-credentials/', 'POST', credentialData);
export const getAllEmployeeCredentials = () => apiRequest('/employee-credentials/');
export const getEmployeeCredential = (adminfo) => apiRequest(`/employee-credentials/${adminfo}`);
export const updateEmployeeCredential = (adminfo, credentialData) => apiRequest(`/employee-credentials/${adminfo}`, 'PUT', credentialData);
export const deleteEmployeeCredential = (adminfo) => apiRequest(`/employee-credentials/${adminfo}`, 'DELETE');
export const verifyEmployeeCredential = (adminfo, password = null) => {
  const body = password ? { password } : {};
  return apiRequest(`/employee-credentials/${adminfo}/verify`, 'POST', body);
};

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

export const uploadCommunicationTemplateFile = async (file) => {
  try {
    // 1. Obtener URL firmada
    const filename = file.name;
    const contentType = file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const response = await apiRequest(
      `/communications/templates/upload-url?filename=${encodeURIComponent(filename)}&content_type=${encodeURIComponent(contentType)}`,
      'POST'
    );

    const { upload_url, file_identifier } = response;

    if (!upload_url || !file_identifier) {
      console.error('Respuesta inesperada del servidor:', response);
      throw new Error('Respuesta inválida del servidor al solicitar URL de carga');
    }

    // 2. Subir archivo a GCS/S3
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Error al subir archivo a almacenamiento: ${uploadResponse.statusText}`);
    }

    return { file_path: file_identifier };
  } catch (error) {
    console.error('Error en uploadCommunicationTemplateFile:', error);
    throw error;
  }
};

export const updateCommunicationTemplate = (templateId, templateData) => apiRequest(`/communications/templates/${templateId}`, 'PUT', templateData);
export const generateCommunication = (communicationData) => apiRequest('/communications/generate', 'POST', communicationData);
export const sendCommunication = (commId, channel, sendData) => {
  const query = channel ? `?channel=${encodeURIComponent(channel)}` : '';
  return apiRequest(`/communications/${commId}/send${query}`, 'PATCH', sendData);
};

export const sendBatchCommunication = (communication_ids, recipient_contact, sender_password = null) => {
  return apiRequest('/communications/send-batch', 'POST', {
    communication_ids,
    recipient_contact,
    sender_password
  });
};

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
export const addCommunicationTemplateField = (templateId, fieldData) => apiRequest(`/communications/templates/${templateId}/fields`, 'POST', fieldData);
export const updateCommunicationTemplateField = (fieldId, fieldData) => apiRequest(`/communications/templates/fields/${fieldId}`, 'PUT', fieldData);
export const deleteCommunicationTemplateField = (fieldId) => apiRequest(`/communications/templates/fields/${fieldId}`, 'DELETE');
export const getAvailableVariables = () => apiRequest('/communications/available-variables');

// --- Endpoints de Comunicaciones Jurídicas ---
export const getLegalBatches = () => apiRequest('/communications/legal/batches');
export const getLegalBatchCommunications = (batchId) => apiRequest(`/communications/legal/batches/${batchId}/communications`);
export const uploadLegalBatchReview = (batchId, file) => apiRequestWithFile(`/communications/legal/batches/${batchId}/upload-review`, 'POST', file);
export const generateLegalBatchCorrespondence = (batchId) => apiRequest(`/communications/legal/batches/${batchId}/generate-correspondence`, 'POST');
export const sendLegalBatchCorrespondence = (batchId, credentials) => apiRequest(`/communications/legal/batches/${batchId}/send`, 'POST', credentials);


// --- Endpoints de Reportes ---
export const getEffectivenessReport = (params) => {
  // params: { start_date, end_date, coordinator_code, system_origin }
  const queryParams = new URLSearchParams(params).toString();
  return apiRequest(`/communications/reports/effectiveness?${queryParams}`);
};

export const refreshEffectivenessReport = () => {
  return apiRequest('/communications/reports/effectiveness/refresh', 'POST');
};

// --- Endpoints para Campañas por CSV ---
export const getTemplateVariablesDetail = (templateId) => apiRequest(`/templates/${templateId}/variables-detail`);

export const testCampaignCSV = async (formData) => {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}/whatsapp/test_campaign_csv`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al enviar mensaje de prueba");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en testCampaignCSV:", error);
    throw error;
  }
};


export const uploadCampaignCSV = async (formData) => {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}/whatsapp/upload_campaign_csv`, {
      method: 'POST',
      headers,
      body: formData, // No establecer Content-Type, el navegador lo hace automáticamente con boundary
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al cargar el CSV');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en uploadCampaignCSV:', error);
    throw error;
  }
};

// --- Endpoints de Reportes de Campañas Masivas ---
export const getCampaignEffectivenessReport = (params) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiRequest(`/reports/campaign-effectiveness${queryParams ? `?${queryParams}` : ''}`);
};

export const getDailyActivityReport = (params) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiRequest(`/reports/daily-activity${queryParams ? `?${queryParams}` : ''}`);
};

export const refreshEffectivenessViews = () => {
  return apiRequest('/reports/refresh-effectiveness-views', 'POST');
};

// --- Endpoints de BI WhatsApp Granular Dashboard ---
export const getWhatsAppMessages = (params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  return apiRequest(`/bi/whatsapp/messages?${queryParams.toString()}`);
};

export const getWhatsAppPayments = (params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  return apiRequest(`/bi/whatsapp/payments?${queryParams.toString()}`);
};

export const getWhatsAppAgreements = (params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  return apiRequest(`/bi/whatsapp/agreements?${queryParams.toString()}`);
};

// --- Endpoints de Tickets ---
export const getTickets = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status_filter) queryParams.append('status_filter', params.status_filter);
  if (params.module_filter) queryParams.append('module_filter', params.module_filter);
  if (params.type_filter) queryParams.append('type_filter', params.type_filter);
  if (params.priority_filter) queryParams.append('priority_filter', params.priority_filter);
  if (params.search) queryParams.append('search', params.search);
  if (params.skip !== undefined) queryParams.append('skip', params.skip);
  if (params.limit !== undefined) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/tickets?${queryString}` : '/tickets';
  return apiRequest(endpoint);
};

export const getTicket = (ticketId) => apiRequest(`/tickets/${ticketId}`);

export const updateTicket = (ticketId, data) => apiRequest(`/tickets/${ticketId}`, 'PATCH', data);

export const addTicketComment = (ticketId, content) => apiRequest(`/tickets/${ticketId}/comments`, 'POST', { content });

export const createTicket = async (formData) => {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: 'POST',
    headers,
    body: formData, // El browser agrega Content-Type: multipart/form-data con el boundary correcto
  };

  try {
    const response = await fetch(`${BASE_URL}/tickets`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error al crear ticket` }));
      let errorMessage = `Error al crear ticket`;

      if (response.status === 422 && errorData.detail) {
        errorMessage = Array.isArray(errorData.detail)
          ? errorData.detail.map(err => `${err.loc.join('.')} -> ${err.msg}`).join('; ')
          : errorData.detail;
      } else if (errorData.detail && typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }

      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createTicket:', error);
    throw error;
  }
};

// ── Informe Llamadas 3CX ──────────────────────────────────
export const getCallsDashboard = ({ anio, mes, coordinador } = {}) => {
  const params = new URLSearchParams({ anio, mes });
  if (coordinador) params.append('coordinador', coordinador);
  return apiRequest(`/reports-etl/informe-llamadas/dashboard?${params}`);
};

export const getCallsDetail = ({ fecha_inicio, fecha_fin, adminfo, coordinador } = {}) => {
  const params = new URLSearchParams({ fecha_inicio, fecha_fin });
  if (adminfo) params.append('adminfo', adminfo);
  if (coordinador) params.append('coordinador', coordinador);
  return apiRequest(`/reports-etl/informe-llamadas/detalle?${params}`);
};

export const getCallsAlertsNN = () =>
  apiRequest('/reports-etl/informe-llamadas/alertas-nn');

// --- Endpoints de Instancias de Evolution API ---
export const getEvolutionInstances = () => apiRequest('/whatsapp/evolution-instances/');
export const createEvolutionInstance = (data) => apiRequest('/whatsapp/evolution-instances/', 'POST', data);
export const getEvolutionInstanceQR = (instanceId) => apiRequest(`/whatsapp/evolution-instances/${instanceId}/qr`);
export const restartEvolutionInstance = (instanceId) => apiRequest(`/whatsapp/evolution-instances/${instanceId}/restart`, 'POST');
export const syncEvolutionInstanceProfile = (instanceId) => apiRequest(`/whatsapp/evolution-instances/${instanceId}/sync_profile`, 'POST');
export const configureEvolutionInstanceWebhook = (instanceId, webhookUrl = null) => {
  const endpoint = webhookUrl 
    ? `/whatsapp/evolution-instances/${instanceId}/configure_webhook?webhook_url=${encodeURIComponent(webhookUrl)}`
    : `/whatsapp/evolution-instances/${instanceId}/configure_webhook`;
  return apiRequest(endpoint, 'POST');
};
export const updateEvolutionInstanceSettings = (instanceId, data) => apiRequest(`/whatsapp/evolution-instances/${instanceId}`, 'PUT', data);
export const deleteEvolutionInstance = (instanceId) => apiRequest(`/whatsapp/evolution-instances/${instanceId}`, 'DELETE');



// --- Endpoints de Productividad ---
export const getProductividadDinamica = (params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  return apiRequest(`/reports-etl/productividad/dinamica?${queryParams.toString()}`);
};

export const getProductividadDiaADia = (params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  return apiRequest(`/reports-etl/productividad/dia-a-dia?${queryParams.toString()}`);
};

export const uploadProductividadPagos = (file) => {
  return apiRequestWithFile('/reports-etl/productividad/pagos/upload', 'POST', file);
};

export const getInasistencias = (params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  const queryString = queryParams.toString();
  return apiRequest(queryString ? `/reports-etl/productividad/inasistencias?${queryString}` : '/reports-etl/productividad/inasistencias');
};

export const createInasistencia = (inasistenciaData) => {
  return apiRequest('/reports-etl/productividad/inasistencias', 'POST', inasistenciaData);
};

export const deleteInasistencia = (id) => {
  return apiRequest(`/reports-etl/productividad/inasistencias/${id}`, 'DELETE');
};

export const downloadProductividadDesagregadoExcel = async (params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  const token = getAuthToken();
  const headers = {
    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/reports-etl/productividad/desagregado/excel?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Error ${response.status}`);
  }
  return response.blob();
};
