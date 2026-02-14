import { BASE_URL } from './api';

// RAG endpoints are mounted at root /rag, not under /api/v1
// We need to derive the root URL from BASE_URL (which ends in /api/v1)
const ROOT_URL = BASE_URL.replace(/\/api\/v1\/?$/, '');
export const RAG_BASE_URL = `${ROOT_URL}/rag`;

// Helper to get token (duplicated from api.js since it's not exported)
const getAuthToken = () => {
  const tokenData = localStorage.getItem('authToken');
  if (tokenData) {
    const token = JSON.parse(tokenData);
    return token.access_token;
  }
  return null;
};

const ragApiRequest = async (endpoint, method = 'GET', body = null) => {
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
    // endpoint should start with / but relative to RAG_BASE_URL
    const url = `${RAG_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error en la petición a ${endpoint}` }));
      throw new Error(errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) return null;

    return await response.json();
  } catch (error) {
    console.error(`RAG API request failed: ${error.message}`);
    throw error;
  }
};

// --- RAG Documents Management ---

export const getDocuments = (page = 1, pageSize = 10, search = '') => {
  const queryParams = new URLSearchParams({
    page,
    page_size: pageSize,
  });
  if (search) queryParams.append('search', search);

  return ragApiRequest(`/documents?${queryParams.toString()}`);
};

export const uploadDocument = async (file, metadata = {}) => {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append('file', file);
  
  if (metadata.category) formData.append('category', metadata.category);
  if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));

  try {
    const response = await fetch(`${RAG_BASE_URL}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al subir documento' }));
      throw new Error(errorData.detail || errorData.message || 'Error al subir documento');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    throw error;
  }
};

export const deleteDocument = (documentId) => {
  return ragApiRequest(`/documents/${documentId}`, 'DELETE');
};

export const getRagStats = () => {
  return ragApiRequest('/admin/stats');
};

// --- RAG Chat ---

export const sendChatMessage = (message, sessionId = null) => {
  return ragApiRequest('/chat', 'POST', { message, session_id: sessionId });
};

export const getChatHistory = (sessionId) => {
    // This endpoint might not exist or be different based on backend code check
    // Checked endpoints.py: No explicit history endpoint, chat memory is internal.
    // For now, we'll comment this out or handle it if needed.
    // return ragApiRequest(`/chat/history/${sessionId}`);
    return Promise.resolve([]); // Placeholder
};

export const downloadDocument = async (documentId, filename) => {
    const token = getAuthToken();
    const headers = {};
  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  
    try {
      // Backend returns a JSON with { url: signed_url }
      const response = await fetch(`${RAG_BASE_URL}/documents/${documentId}/download`, {
        method: 'GET',
        headers,
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener URL de descarga');
      }

      const data = await response.json();
      const signedUrl = data.url;

      // Trigger download
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = filename || 'documento';
      a.target = '_blank'; // Open in new tab since it's likely a GCS/S3 link
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  };