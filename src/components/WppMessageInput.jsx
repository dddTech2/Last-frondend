import React, { useRef, useEffect, useState } from 'react';
import {
  Paperclip,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Smile,
  Send,
  X,
  Sticker,
  Mic
} from 'lucide-react';

const WppMessageInput = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleMediaFileSelect,
  selectedMediaFile,
  handleSendMedia,
  isUploadingMedia,
  selectedConversation,
  isSessionExpired,
  onOpenExpiredSessionModal,
  selectedTemplate,
  selectedObligation,
  handleCancelMedia, // Nueva prop para cancelar selección
  handleSendAudioBlob // Prop para notas de voz
}) => {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // Referencias a los inputs ocultos
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const stickerInputRef = useRef(null);

  // Generar URL de previsualización cuando cambia el archivo seleccionado
  useEffect(() => {
    if (selectedMediaFile) {
      // Solo generar preview para imágenes y videos
      if (selectedMediaFile.type.startsWith('image/') || selectedMediaFile.type.startsWith('video/')) {
        const url = URL.createObjectURL(selectedMediaFile);
        setMediaPreviewUrl(url);
      } else {
        setMediaPreviewUrl(null);
      }
    } else {
      setMediaPreviewUrl(null);
    }

    // Cleanup
    return () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [selectedMediaFile]);

  // Cerrar menú si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ajuste automático de altura del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileClick = () => {
    setShowAttachMenu(false);
  };

  const triggerFileInput = (ref) => {
    if (ref.current) {
      ref.current.value = null; // Resetear valor para permitir seleccionar el mismo archivo
      ref.current.click();
    }
    handleFileClick();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      // Fallback: Si el usuario deniega o no hay micrófono
    }
  };

  const stopRecording = (cancel = false) => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (!cancel && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (handleSendAudioBlob) {
          handleSendAudioBlob(audioBlob);
        }
      }
      audioChunksRef.current = [];
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
    setRecordingDuration(0);
  };

  const handleCancelRecording = () => {
    stopRecording(true);
  };

  const handleSendRecording = () => {
    stopRecording(false);
  };

  // Renderizado del panel de previsualización
  const renderMediaPreview = () => {
    if (!selectedMediaFile) return null;

    const isImage = selectedMediaFile.type.startsWith('image/');
    const isVideo = selectedMediaFile.type.startsWith('video/');
    const isAudio = selectedMediaFile.type.startsWith('audio/');

    // Formatear tamaño del archivo
    const formatSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-[#f0f2f5] rounded-lg shadow-lg border border-gray-200 p-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 z-40">
        {/* Contenedor de la miniatura/icono */}
        <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center overflow-hidden border border-gray-300 flex-shrink-0 relative">
          {(isImage || isVideo) && mediaPreviewUrl ? (
            isImage ? (
              <img src={mediaPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <video src={mediaPreviewUrl} className="w-full h-full object-cover" />
            )
          ) : (
            <div className="text-gray-500">
              {isAudio ? <Music className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
            </div>
          )}
        </div>

        {/* Información del archivo */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate" title={selectedMediaFile.name}>
            {selectedMediaFile.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatSize(selectedMediaFile.size)} • {selectedMediaFile.type.split('/')[1]?.toUpperCase() || 'ARCHIVO'}
          </p>
        </div>

        {/* Botón de Cancelar */}
        <button
          onClick={handleCancelMedia}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          title="Cancelar envío"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderContent = () => {
    // Caso 1: Sesión expirada y plantilla seleccionada
    if (isSessionExpired && selectedTemplate) {
      return (
        <div className="flex items-center justify-between w-full gap-4 px-2">
          <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg text-center border border-gray-200">
            <p className="text-sm text-gray-600">
              Plantilla seleccionada: <span className="font-semibold text-gray-800">{selectedTemplate.name}</span>
            </p>
          </div>
          <button
            className={`px-6 py-3 rounded-full font-semibold text-sm shadow-md transition-all transform active:scale-95 flex items-center gap-2
              ${selectedObligation
                ? 'bg-[#00a884] text-white hover:bg-[#008f6f]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            onClick={handleSendMessage}
            disabled={!selectedObligation}
          >
            <span>ENVIAR PLANTILLA</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Caso 2: Sesión expirada
    if (isSessionExpired) {
      return (
        <div className="flex-1 flex items-center justify-center p-2">
          <button
            onClick={onOpenExpiredSessionModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>Continuar Conversación (24h excedidas)</span>
          </button>
        </div>
      );
    }

    // Caso 3: Chat normal activo
    return (
      <div className="flex items-end gap-2 w-full relative">
        {/* Renderizado de Previsualización */}
        {renderMediaPreview()}

        {/* Inputs ocultos */}
        <input type="file" accept="image/*,video/*" ref={imageInputRef} onChange={(e) => handleMediaFileSelect(e, 'image')} className="hidden" />
        <input type="file" accept="image/webp,image/png" ref={stickerInputRef} onChange={(e) => handleMediaFileSelect(e, 'sticker')} className="hidden" />
        <input type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv" ref={documentInputRef} onChange={(e) => handleMediaFileSelect(e, 'document')} className="hidden" />
        <input type="file" accept="audio/*" ref={audioInputRef} onChange={(e) => handleMediaFileSelect(e, 'audio')} className="hidden" />

        {/* Menú de Adjuntos */}
        {showAttachMenu && (
          <div
            ref={menuRef}
            className="absolute bottom-14 left-0 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[180px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <AttachmentOption icon={<ImageIcon className="w-5 h-5 text-purple-500" />} label="Fotos y videos" onClick={() => triggerFileInput(imageInputRef)} />
            <AttachmentOption icon={<Sticker className="w-5 h-5 text-blue-500" />} label="Sticker" onClick={() => triggerFileInput(stickerInputRef)} />
            <AttachmentOption icon={<FileText className="w-5 h-5 text-indigo-500" />} label="Documento" onClick={() => triggerFileInput(documentInputRef)} />
            <AttachmentOption icon={<Music className="w-5 h-5 text-red-500" />} label="Audio" onClick={() => triggerFileInput(audioInputRef)} />
          </div>
        )}

        {/* Botón de Adjuntar */}
        <div className="pb-2">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-full transition-colors ${showAttachMenu ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Adjuntar"
            disabled={!selectedConversation}
          >
            {showAttachMenu ? <X className="w-6 h-6" /> : <Paperclip className="w-6 h-6" />}
          </button>
        </div>

        {/* Input de Texto o Ui de Grabación */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-300 focus-within:border-white focus-within:ring-2 focus-within:ring-[#00a884] transition-all py-2 px-4 min-h-[44px] flex items-center">
          {isRecording ? (
            <div className="w-full flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <span className="text-red-500 text-base font-semibold ml-2">{formatDuration(recordingDuration)}</span>
              </div>
              <button 
                onClick={handleCancelRecording}
                className="text-gray-500 hover:text-red-500 font-medium text-sm flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              placeholder="Escribe un mensaje"
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 resize-none max-h-[120px] leading-relaxed py-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedConversation}
              rows={1}
            />
          )}
        </div>

        {/* Botón de Enviar o Micrófono */}
        <div className="pb-1">
          {selectedMediaFile ? (
            <button
              className={`p-3 rounded-full shadow-md transition-all transform active:scale-95 flex items-center justify-center
                ${isUploadingMedia
                  ? 'bg-gray-100 text-gray-400 cursor-wait'
                  : 'bg-[#00a884] text-white hover:bg-[#008f6f]'}`}
              onClick={handleSendMedia}
              disabled={isUploadingMedia}
              title={isUploadingMedia ? 'Subiendo...' : `Enviar ${selectedMediaFile.name}`}
            >
              {isUploadingMedia ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </button>
          ) : isRecording ? (
            <button
              className="p-3 rounded-full shadow-lg transition-all flex items-center justify-center bg-[#00a884] text-white hover:bg-[#008f6f] scale-110"
              onClick={handleSendRecording}
              title="Enviar nota de voz"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : newMessage.trim() ? (
            <button
              className={`p-3 rounded-full shadow-sm transition-all transform active:scale-95 flex items-center justify-center bg-[#00a884] text-white hover:bg-[#008f6f] shadow-md`}
              onClick={handleSendMessage}
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              className={`p-3 rounded-full shadow-sm transition-all flex items-center justify-center touch-none select-none
                ${!selectedConversation 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#00a884] text-white hover:bg-[#008f6f]'}`}
              onClick={() => { if(selectedConversation) startRecording(); }}
              disabled={!selectedConversation}
              title="Haz clic para grabar audio"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <footer
      className="w-full bg-[#f0f2f5] px-4 py-2 flex-shrink-0 border-t border-gray-200"
      style={{ zIndex: 20 }}
    >
      <div className="max-w-4xl mx-auto w-full">
        {renderContent()}
      </div>
    </footer>
  );
};

const AttachmentOption = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors group w-full text-left"
  >
    <div className="group-hover:scale-110 transition-transform duration-200">
      {icon}
    </div>
    <span className="text-gray-700 text-sm font-medium">{label}</span>
  </button>
);

export default WppMessageInput;
