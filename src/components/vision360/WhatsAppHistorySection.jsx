import React, { useState } from 'react';
import { MessageCircle, ExternalLink, Image as ImageIcon, File, Mic } from 'lucide-react';
import { getConversation } from '../../services/api';
import { toast } from 'sonner';

const WhatsAppHistorySection = ({ conversations }) => {
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectConversation = async (convo) => {
    setSelectedConvo(convo);
    setIsLoading(true);
    try {
      const data = await getConversation(convo.conversation_id || convo.id, { limit: 50 });
      setMessages(data.messages || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar mensajes');
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageContent = (msg) => {
    switch (msg.message_type) {
      case 'text':
        return <p className="text-sm">{msg.body}</p>;
      case 'image':
        return (
          <div className="flex items-center gap-2 text-gray-500 italic bg-gray-50 p-2 rounded">
            <ImageIcon className="w-4 h-4" />
            <span className="text-xs">📷 Imagen</span>
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-2 text-gray-500 italic bg-gray-50 p-2 rounded">
            <Mic className="w-4 h-4" />
            <span className="text-xs">🎤 Audio</span>
          </div>
        );
      case 'document':
        return (
          <div className="flex items-center gap-2 text-gray-500 italic bg-gray-50 p-2 rounded">
            <File className="w-4 h-4" />
            <span className="text-xs">📄 Documento</span>
          </div>
        );
      default:
        return <p className="text-sm italic text-gray-400">Tipo de mensaje no soportado: {msg.message_type}</p>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex overflow-hidden">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Conversaciones ({(conversations || []).length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(conversations || []).length === 0 ? (
            <p className="p-4 text-center text-gray-500 text-sm">No hay conversaciones de WhatsApp</p>
          ) : (
            (conversations || []).map((convo, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectConversation(convo)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConvo?.conversation_id === convo.conversation_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900 truncate">{convo.customer_phone_number}</span>
                  <span className="text-xs text-gray-400">
                    {convo.last_client_message_at ? new Date(convo.last_client_message_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {convo.assigned_to_name ? `Gestor: ${convo.assigned_to_name}` : 'Sin asignar'}
                </div>
                <div className="mt-2">
                   <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                     convo.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                   }`}>
                     {convo.status === 'open' ? 'Abierta' : 'Cerrada'}
                   </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-2/3 flex flex-col bg-gray-50/50">
        {selectedConvo ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm">
              <div>
                <h4 className="font-bold text-gray-800">{selectedConvo.customer_phone_number}</h4>
                <p className="text-xs text-gray-500">ID: {selectedConvo.conversation_id}</p>
              </div>
              <a
                href="/chat" 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Ir al Chat de Gestión
              </a>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div key={idx} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                        isOutbound 
                          ? 'bg-green-100 text-gray-800 rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                      }`}>
                        {getMessageContent(msg)}
                        <p className={`text-[10px] mt-1 text-right ${isOutbound ? 'text-green-700' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {messages.length === 0 && !isLoading && (
                 <p className="text-center text-gray-400 mt-10">No hay mensajes disponibles</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p>Seleccione una conversación para ver el historial</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppHistorySection;
