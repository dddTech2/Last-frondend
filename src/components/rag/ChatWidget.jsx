import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, X, Send, Minimize2, Loader2, Paperclip, FileText, Download, ExternalLink } from 'lucide-react';
import { RAG_BASE_URL, downloadDocument, getDocumentUrl } from '../../services/ragService';
import { toast } from 'sonner';
import DocumentPreviewModal from '../DocumentPreviewModal';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Hola, soy tu asistente virtual de Renovar. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    return sessionStorage.getItem('ragSessionId');
  });

  // Modal state for document preview
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    documentUrl: null,
    documentName: ''
  });
  
  // State for dropdown menu
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('ragSessionId', sessionId);
    }
  }, [sessionId]);

  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // WebSocket Connection Logic
  useEffect(() => {
    if (!isOpen) return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    const connect = () => {
      setConnectionStatus('connecting');
      
      // Determine WS URL
      let wsUrl = RAG_BASE_URL.replace(/^http/, 'ws');
      wsUrl += '/chat/ws';

      const token = localStorage.getItem('authToken') ? JSON.parse(localStorage.getItem('authToken')).access_token : null;
      if (token) {
        wsUrl += `?token=${token}`;
      }

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WS Connected');
        setConnectionStatus('connected');
        setWs(socket);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Capture session_id from any message that has it
          if (data.session_id && data.session_id !== sessionId) {
            setSessionId(data.session_id);
          }
          
          if (data.type === 'start') {
            setIsTyping(true);
            setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }]);
          } else if (data.type === 'stream') {
            setMessages(prev => {
              const lastIdx = prev.length - 1;
              if (lastIdx < 0) return prev;
              
              const lastMessage = prev[lastIdx];
              if (lastMessage && lastMessage.role === 'assistant') {
                const newContent = lastMessage.content + (data.content || '');
                // Create a new object for the updated message to avoid mutating state
                const updatedMessage = { ...lastMessage, content: newContent };
                // Return a new array with the updated message
                return [...prev.slice(0, lastIdx), updatedMessage];
              }
              return prev;
            });
          } else if (data.type === 'end') {
            setIsTyping(false);
          } else if (data.type === 'sources') {
             setMessages(prev => {
              const lastIdx = prev.length - 1;
              if (lastIdx < 0) return prev;

              const lastMessage = prev[lastIdx];
              if (lastMessage && lastMessage.role === 'assistant') {
                const updatedMessage = { ...lastMessage, sources: Array.isArray(data.sources) ? data.sources : [] };
                return [...prev.slice(0, lastIdx), updatedMessage];
              }
              return prev;
            });
          } else if (data.error) {
            setMessages(prev => [...prev, { role: 'system', content: `Error: ${data.error}` }]);
            setIsTyping(false);
          } else if (data.response) {
            // Handle full response from non-streaming backend
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: String(data.response || ''), 
              sources: Array.isArray(data.sources) ? data.sources : [] 
            }]);
            setIsTyping(false);
          } else if (data.role && data.content) {
             // Standard full message fallback
             setMessages(prev => [...prev, { 
                 role: data.role, 
                 content: String(data.content || ''), 
                 sources: Array.isArray(data.sources) ? data.sources : [] 
             }]);
             setIsTyping(false);
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('WS Error:', error);
        setConnectionStatus('error');
      };

      socket.onclose = () => {
        console.log('WS Closed');
        setConnectionStatus('disconnected');
        setWs(null);
      };

      return socket;
    };

    const socket = connect();

    return () => {
      if (socket) socket.close();
    };
  }, [isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message: userMessage, session_id: sessionId }));
    } else {
      // Fallback or reconnect logic
      setMessages(prev => [...prev, { role: 'system', content: 'Error: No hay conexión con el servidor.' }]);
      setIsTyping(false);
    }
  };

  const handlePreview = async (docId, fileName) => {
    if (!docId) {
      toast.error("No se puede预览 el documento: ID no encontrado");
      return;
    }
    
    try {
      toast.info(`Cargando ${fileName}...`);
      const url = await getDocumentUrl(docId);
      setPreviewModal({
        isOpen: true,
        documentUrl: url,
        documentName: fileName
      });
      toast.success("Documento cargado");
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Error al cargar el documento");
    }
  };

  const handleDownload = async (docId, fileName) => {
    if (!docId) {
      toast.error("No se puede descargar el documento: ID no encontrado");
      return;
    }
    
    try {
      toast.info(`Iniciando descarga de ${fileName}...`);
      const url = await getDocumentUrl(docId);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'documento';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Descarga iniciada");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error al descargar el documento");
    }
  };

  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      documentUrl: null,
      documentName: ''
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-all transform hover:scale-105 z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-label="Abrir chat de ayuda"
      >
        <MessageCircle className="h-8 w-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 rounded-t-2xl text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">Asistente Renovar</h3>
            <p className="text-xs text-indigo-200">
              {connectionStatus === 'connected' ? 'En línea' : 
               connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : msg.role === 'system'
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-indigo">
                 <ReactMarkdown 
                    components={{
                        a: ({node, ...props}) => <a {...props} className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer" />
                    }}
                 >
                    {typeof msg.content === 'string' ? msg.content : ''}
                 </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}</p>
              )}

              {/* Citations / Sources */}
              {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                  {msg.sources.map((source, sIdx) => {
                    if (!source) return null;
                    // Try to resolve the name from various possible fields including metadata
                    const sourceName = source.file_name || 
                                       source.name || 
                                       source.filename || 
                                       source.metadata?.file_name || 
                                       source.metadata?.source || 
                                       `Fuente ${sIdx + 1}`;
                    
                    // Try to resolve page number
                    const pageNum = source.page || source.metadata?.page;

                    // Try to resolve document ID
                    const docId = source.document_id || source.id || source.metadata?.document_id;

                    if (!docId) {
                      return (
                        <span
                          key={sIdx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200"
                          title="Documento sin ID disponible"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {sourceName}
                        </span>
                      );
                    }

                    return (
                      <div key={sIdx} className="relative">
                        <button 
                          onClick={() => setOpenDropdown(openDropdown === sIdx ? null : sIdx)}
                          onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-indigo-600 cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
                          title={pageNum ? `Página ${pageNum}` : sourceName}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {sourceName}
                          <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {/* Dropdown with actions */}
                        {openDropdown === sIdx && (
                          <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                            <button
                              onClick={() => {
                                handlePreview(docId, sourceName);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver documento
                            </button>
                            <button
                              onClick={() => {
                                handleDownload(docId, sourceName);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                            >
                              <Download className="h-3 w-3" />
                              Descargar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200 rounded-b-2xl">
        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 pl-4 pr-10 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 rounded-xl text-sm transition-all"
            disabled={connectionStatus !== 'connected'}
          />
          <button
            type="submit"
            disabled={!input.trim() || connectionStatus !== 'connected'}
            className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        {connectionStatus === 'disconnected' && (
             <p className="text-xs text-red-500 mt-1 text-center">Desconectado. Reintentando...</p>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewModal.isOpen && (
        <DocumentPreviewModal
          fileUrl={previewModal.documentUrl}
          onClose={closePreviewModal}
        />
      )}
    </div>
  );
};

export default ChatWidget;
