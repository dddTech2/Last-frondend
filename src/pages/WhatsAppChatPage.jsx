import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  getConversations,
  sendMessage,
  getConversation,
  BASE_URL,
  getSignedUploadUrl,
  uploadMediaFromGCS,
  sendImageFromGCS,
  sendVideoFromGCS,
  sendAudioFromGCS,
  sendDocumentFromGCS,
  sendStickerFromGCS,
  sendTemplatedMessage,
  markConversationAsRead,
  getMyTeam,
  getCoordinators,
} from '../services/api';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import useDebounce from '../hooks/useDebounce';
import ExpiredSessionModal from '../components/ExpiredSessionModal';
import WppConversationSidebar from '../components/WppConversationSidebar';
import WppChatArea from '../components/WppChatArea';
import WppClientInfo from '../components/WppClientInfo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import useSound from '../hooks/useSound';
import { toast } from 'sonner';


const WhatsAppChatPage = () => {
  const { subscribe } = useNotifications();
  const { user, logout } = useAuth();
  const userRole = user?.decoded?.role || user?.decoded?.roles?.[0] || 'gestor';

  const resolvedRoles = useMemo(() => {
    if (Array.isArray(user?.decoded?.roles)) return user.decoded.roles;
    return user?.decoded?.role ? [user.decoded.role] : [];
  }, [user]);

  const roleMatches = (target) =>
    resolvedRoles.some(r => r.toLowerCase() === target.toLowerCase());

  const showFilters = roleMatches('Coordinador') || roleMatches('Admin') || roleMatches('Gerente') || roleMatches('Super Administrador');
  const showCoordinatorDropdown = roleMatches('Admin') || roleMatches('Gerente') || roleMatches('Super Administrador');

  // Server-side filter state
  const [serverFilter, setServerFilter] = useState(null);
  const [coordinatorFilter, setCoordinatorFilter] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const { play: playNotificationSound, init: initNotificationSound } = useSound('/new-notificationWpp.mp3');

  const [allConversations, setAllConversations] = useState([]);
  const [visibleConversations, setVisibleConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [previewFileUrl, setPreviewFileUrl] = useState(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [messagesCache, setMessagesCache] = useState({}); // Cache de mensajes
  const messageCacheLimitRef = useRef(5); // Máximo 5 conversaciones cacheadas
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedObligation, setSelectedObligation] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [adminfoData, setAdminfoData] = useState({ url: null, loading: false });

  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isExpiredSessionModalOpen, setIsExpiredSessionModalOpen] = useState(false);

  // Estados para paginación
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadOlderMessagesTimeoutRef = useRef(null); // Para debouncing

  // Refs to hold current values for the WebSocket handler
  const selectedConversationRef = useRef(selectedConversation);
  selectedConversationRef.current = selectedConversation;
  const isNearBottomRef = useRef(isNearBottom);
  isNearBottomRef.current = isNearBottom;

  // Función de debug para inspeccionar el estado del sistema de carga
  const debugPaginationState = useCallback(() => {
    console.log('[DEBUG] Pagination State:', {
      selectedConversation: selectedConversation?.id,
      messagesCount: messages.length,
      totalMessages,
      isLoadingMessages,
      hasMoreMessages,
      offset,
      isLoadingOlderMessages,
      messages: messages.slice(0, 3).map(m => ({
        id: m.id || m.message_id,
        type: m.message_type,
        timestamp: m.timestamp || m.created_at,
        body: m.body?.substring(0, 50)
      }))
    });
  }, [selectedConversation, messages, totalMessages, isLoadingMessages, hasMoreMessages, offset, isLoadingOlderMessages]);

  // Exponer función de debug en window para acceso desde consola
  useEffect(() => {
    window.debugPaginationState = debugPaginationState;
    return () => {
      delete window.debugPaginationState;
    };
  }, [debugPaginationState]);

  // Función helper para actualizar cache con límite de 5 conversaciones
  const updateMessagesCache = useCallback((conversationId, messages) => {
    setMessagesCache(prevCache => {
      const newCache = { ...prevCache };
      const cacheKeys = Object.keys(newCache);

      // Si ya tenemos 5 conversaciones y esta es nueva, eliminar la más antigua
      if (cacheKeys.length >= messageCacheLimitRef.current && !newCache[conversationId]) {
        const oldestKey = cacheKeys[0];
        delete newCache[oldestKey];
      }

      newCache[conversationId] = messages;
      return newCache;
    });
  }, []);

  // Efecto para inicializar el audio en la primera interacción del usuario
  useEffect(() => {
    const handleFirstInteraction = () => {
      initNotificationSound();
    };

    // Usamos { once: true } para que el listener se elimine automáticamente después de ejecutarse una vez.
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      // Aunque { once: true } los elimina, es buena práctica limpiarlos en el cleanup por si el componente se desmonta antes.
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [initNotificationSound]);

  // Definir funciones antes de usarlas en useEffect
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Detectar si está cerca del final (últimos 100px)
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    setIsNearBottom(isNearBottom);

    // Mostrar/ocultar botón de scroll
    const shouldShowButton = scrollTop + clientHeight < scrollHeight - 200;
    setShowScrollButton(shouldShowButton);

    // La detección de scroll hacia arriba ahora es manejada por WppMessageList
  }, []);

  // Función para cargar mensajes más antiguos usando paginación del backend
  const loadOlderMessages = useCallback(async () => {
    if (!selectedConversation || isLoadingOlderMessages || !hasMoreMessages) return;

    // DEBOUNCING: Si hay un timeout pendiente, cancelarlo y resetear
    if (loadOlderMessagesTimeoutRef.current) {
      clearTimeout(loadOlderMessagesTimeoutRef.current);
    }

    // Solo ejecutar una vez cada 500ms (evita múltiples llamadas simultáneas)
    loadOlderMessagesTimeoutRef.current = setTimeout(async () => {
      setIsLoadingOlderMessages(true);
      console.debug('[Pagination] Loading older messages for conversation:', selectedConversation.id, 'offset:', offset);

      try {
        // Cargar la siguiente página de mensajes usando offset
        const conversationData = await getConversation(selectedConversation.id, {
          limit: 20,
          offset: offset
        });

        if (conversationData && conversationData.messages && Array.isArray(conversationData.messages)) {
          const olderMessages = conversationData.messages;
          console.debug(`[Pagination] Loaded ${olderMessages.length} older messages`);

          if (olderMessages.length > 0) {
            // Guardar el scroll actual antes de agregar mensajes
            const container = messagesContainerRef.current;
            const previousScrollHeight = container.scrollHeight;

            // Agregar mensajes antiguos al inicio, evitando duplicados
            setMessages(prevMessages => {
              const existingIds = new Set(prevMessages.map(m => m.id || m.message_id));
              const uniqueOlderMessages = olderMessages.filter(m => !existingIds.has(m.id || m.message_id));
              return [...uniqueOlderMessages, ...prevMessages];
            });

            // Actualizar offset para la próxima carga
            setOffset(prev => prev + 20);

            // Actualizar hasMoreMessages basado en la respuesta del backend
            setHasMoreMessages(conversationData.has_more || false);

            // Restaurar la posición del scroll después de agregar mensajes
            setTimeout(() => {
              if (container) {
                const newScrollHeight = container.scrollHeight;
                const scrollDifference = newScrollHeight - previousScrollHeight;
                container.scrollTop = scrollDifference;
              }
            }, 100);

            console.debug(`[Pagination] Updated offset to: ${offset + 50}`);
            console.debug(`[Pagination] Has more messages: ${conversationData.has_more}`);
          } else {
            setHasMoreMessages(false);
            console.debug('[Pagination] No older messages found');
          }
        } else {
          setHasMoreMessages(false);
          console.debug('[Pagination] Invalid response format');
        }
      } catch (error) {
        console.error('[Pagination] Error loading older messages:', error);
        setHasMoreMessages(false);
      } finally {
        setIsLoadingOlderMessages(false);
      }
    }, 500); // Esperar 500ms antes de ejecutar
  }, [selectedConversation, isLoadingOlderMessages, hasMoreMessages, offset]);

  const CONVERSATION_PAGE_SIZE = 50;

  const filteredConversations = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    const hasTerm = term.length > 0;

    const normalize = (value) => {
      if (value === null || value === undefined) return '';
      return value.toString().toLowerCase();
    };

    const isWithin24Hours = (timestamp) => {
      if (!timestamp) return false;

      let parsed;
      const date = new Date(timestamp);
      if (!Number.isNaN(date.getTime())) {
        parsed = date.getTime();
      } else if (!Number.isNaN(Number(timestamp))) {
        parsed = Number(timestamp) * 1000; // Unix seconds
      } else {
        return false;
      }

      const now = Date.now();
      const windowMs = 24 * 60 * 60 * 1000;
      return now - parsed <= windowMs;
    };

    const resolveMessageBody = (message) => (
      message?.body ??
      message?.text ??
      message?.text?.body ??
      message?.caption ??
      message?.media?.caption ??
      message?.interactive?.body ??
      message?.interactive?.text ??
      ''
    );

    const resolveMessageType = (message) => {
      if (!message) return '';
      const raw = message.message_type || message.type || message.kind || message.media?.type || message.payload?.type;
      return typeof raw === 'string' ? raw.toLowerCase() : '';
    };

    return allConversations.filter((conversation) => {
      const status = (conversation.read_status || '').toLowerCase();

      const matchesFilter = (() => {
        switch (activeFilter) {
          case 'Nuevos':
            return status !== 'read';
          case 'Activos':
            return isWithin24Hours(conversation.last_client_message_at);
          default:
            return true;
        }
      })();

      if (!matchesFilter) {
        return false;
      }

      if (!hasTerm) {
        return true;
      }

      const lastMessage = conversation.messages && conversation.messages.length > 0 ? conversation.messages[0] : null;
      const searchPool = [
        conversation.chat_title,
        conversation.customer_phone_number,
        conversation.client_cedula,
        conversation.client_name,
        conversation.customer_name,
        resolveMessageBody(lastMessage),
        resolveMessageType(lastMessage),
      ];

      const basicMatch = searchPool.some((value) => normalize(value).includes(term));
      const tagsMatch = Array.isArray(conversation.tags)
        ? conversation.tags.some((tag) => normalize(tag.name).includes(term))
        : false;

      return basicMatch || tagsMatch;
    });
  }, [allConversations, debouncedSearchTerm, activeFilter]);

  useEffect(() => {
    const initialPage = filteredConversations.slice(0, CONVERSATION_PAGE_SIZE);
    setVisibleConversations(initialPage);
    setConversationPage(2);
    setHasMoreConversations(filteredConversations.length > CONVERSATION_PAGE_SIZE);
  }, [filteredConversations]);

  const fetchAllConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const params = { limit: 10000 };
      if (serverFilter) params.filter = serverFilter;
      if (coordinatorFilter) params.coordinator_id = coordinatorFilter;
      const conversationsData = await getConversations(params);
      setAllConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (error.message?.includes('403')) {
        toast.error('No tienes acceso a este gestor');
      } else if (error.message?.includes('400')) {
        toast.error('Filtro no valido');
      } else if (error.message?.includes('404')) {
        toast.error('Coordinador no encontrado');
      }
    } finally {
      setIsLoadingConversations(false);
    }
  }, [serverFilter, coordinatorFilter]);

  // Fetch coordinators once on mount (Admin/Gerente only)
  useEffect(() => {
    if (!showFilters || !showCoordinatorDropdown) return;

    setIsLoadingFilters(true);
    getCoordinators()
      .then(data => setCoordinators(data || []))
      .catch(() => setCoordinators([]))
      .finally(() => setIsLoadingFilters(false));
  }, [showFilters, showCoordinatorDropdown]);

  // Fetch team members: when coordinator changes (Admin/Gerente) or on mount (Coordinador)
  useEffect(() => {
    if (!showFilters) return;

    setIsLoadingFilters(true);
    const teamPromise = coordinatorFilter
      ? getMyTeam(coordinatorFilter)
      : getMyTeam();

    teamPromise
      .then(data => setTeamMembers(data || []))
      .catch(() => setTeamMembers([]))
      .finally(() => setIsLoadingFilters(false));
  }, [showFilters, coordinatorFilter]);

  useEffect(() => {
    fetchAllConversations();
  }, [fetchAllConversations]);

  const handleLoadMoreConversations = useCallback(() => {
    if (!hasMoreConversations || isLoadingConversations) return;

    const nextPage = conversationPage;
    const startIndex = (nextPage - 1) * CONVERSATION_PAGE_SIZE;
    const endIndex = nextPage * CONVERSATION_PAGE_SIZE;

    const newVisible = filteredConversations.slice(startIndex, endIndex);

    if (newVisible.length > 0) {
      setVisibleConversations(prev => [...prev, ...newVisible]);
      setConversationPage(nextPage + 1);
    }

    setHasMoreConversations(endIndex < filteredConversations.length);
  }, [conversationPage, hasMoreConversations, isLoadingConversations, filteredConversations]);

  const handleSelectConversation = useCallback(async (convo) => {
    if (convo.read_status === 'sent') {
      try {
        await markConversationAsRead(convo.id);
        const updateConversations = (conversations) =>
          conversations.map(c =>
            c.id === convo.id ? { ...c, read_status: 'read' } : c
          );
        setAllConversations(updateConversations);
      } catch (error) {
        console.error("Error marking conversation as read", error);
      }
    }
    setSelectedConversation(convo);
  }, []);

  // Efecto para cargar los mensajes iniciales de una conversación
  useEffect(() => {
    if (selectedConversation) {
      const now = new Date();
      const lastMessageTime = new Date(selectedConversation.last_client_message_at);
      const diff = now - lastMessageTime;
      const hours = diff / (1000 * 60 * 60);
      setIsSessionExpired(hours > 24);

      const fetchMessages = async () => {
        const cachedMessages = messagesCache[selectedConversation.id];

        if (cachedMessages) {
          setMessages(cachedMessages);
          setIsLoadingMessages(false);
          setTimeout(() => scrollToBottom(), 100);
        } else {
          setIsLoadingMessages(true);
        }

        try {
          setHasMoreMessages(true);
          setOffset(0);
          setIsLoadingOlderMessages(false);
          setTotalMessages(0);

          const conversationData = await getConversation(selectedConversation.id, { limit: 20, offset: 0 });

          if (conversationData && conversationData.messages && Array.isArray(conversationData.messages)) {
            const apiMessages = conversationData.messages;

            setMessagesCache(prevCache => {
              const cachedMsgs = prevCache[selectedConversation.id] || [];
              const messageMap = new Map(cachedMsgs.map(m => [m.id || m.message_id, m]));

              // Update map with API messages, but don't overwrite cached ones
              apiMessages.forEach(apiMsg => {
                const id = apiMsg.id || apiMsg.message_id;
                if (!messageMap.has(id)) {
                  messageMap.set(id, apiMsg);
                }
              });

              const mergedMessages = Array.from(messageMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

              // Update the active messages state
              setMessages(mergedMessages);

              // Return the updated cache
              return {
                ...prevCache,
                [selectedConversation.id]: mergedMessages
              };
            });

            setTotalMessages(conversationData.total_messages || apiMessages.length);
            setHasMoreMessages(conversationData.has_more || false);
            setOffset(20);

            if (!cachedMessages) {
              setTimeout(() => scrollToBottom(), 100);
            }
          } else if (!cachedMessages) {
            setMessages([]);
            setHasMoreMessages(false);
            setTotalMessages(0);
          }
        } catch (error) {
          console.error('[Pagination] Error fetching recent messages:', error);
          if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
            alert(`Error al cargar mensajes: ${error.message}`);
          }
          if (!cachedMessages) {
            setMessages([]);
            setHasMoreMessages(false);
            setTotalMessages(0);
          }
        } finally {
          setIsLoadingMessages(false);
        }
      };

      fetchMessages();
    } else {
      setMessages([]);
      setHasMoreMessages(false);
      setOffset(0);
      setIsLoadingOlderMessages(false);
      setIsLoadingMessages(false);
      setTotalMessages(0);
    }
  }, [selectedConversation, scrollToBottom]);

  // Memoized WebSocket message handler
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      // Reproducir sonido solo para mensajes entrantes
      if (newMessage.direction === 'inbound') {
        playNotificationSound();
      }

      const updateConvoList = (prev) => {
        const convoIndex = prev.findIndex(c => c.id === newMessage.conversation_id);
        if (convoIndex === -1) return prev;

        const isConversationSelected = selectedConversationRef.current?.id === newMessage.conversation_id;

        const updatedConvo = {
          ...prev[convoIndex],
          messages: [newMessage], // Actualizamos con el último mensaje
          updated_at: newMessage.timestamp,
          last_client_message_at: newMessage.direction === 'inbound' ? newMessage.timestamp : prev[convoIndex].last_client_message_at,
          read_status: isConversationSelected ? 'read' : 'sent',
        };

        const newConversations = [...prev];
        newConversations.splice(convoIndex, 1);
        return [updatedConvo, ...newConversations].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      };

      setAllConversations(updateConvoList);

      setMessagesCache(prevCache => {
        const currentMessages = prevCache[newMessage.conversation_id] || [];
        if (!currentMessages.some(msg => (msg.id || msg.message_id) === (newMessage.id || newMessage.message_id))) {
          const updatedMessages = [...currentMessages, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return { ...prevCache, [newMessage.conversation_id]: updatedMessages };
        }
        return prevCache;
      });

      if (selectedConversationRef.current?.id === newMessage.conversation_id) {
        setMessages(prevMessages => {
          if (!prevMessages.some(msg => (msg.id || msg.message_id) === (newMessage.id || newMessage.message_id))) {
            const updatedMessages = [...prevMessages, newMessage];
            return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          return prevMessages;
        });

        if (isNearBottomRef.current) {
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    const handleMessageUpdate = (updatedMessage) => {
      setMessagesCache(prevCache => {
        const currentMessages = prevCache[updatedMessage.conversation_id] || [];
        const messageIndex = currentMessages.findIndex(msg => (msg.id || msg.message_id) === (updatedMessage.id || updatedMessage.message_id));

        if (messageIndex !== -1) {
          const updatedMessages = [...currentMessages];
          updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updatedMessage };
          return { ...prevCache, [updatedMessage.conversation_id]: updatedMessages };
        }
        return prevCache;
      });

      if (selectedConversationRef.current?.id === updatedMessage.conversation_id) {
        setMessages(prevMessages => {
          const messageIndex = prevMessages.findIndex(msg => (msg.id || msg.message_id) === (updatedMessage.id || updatedMessage.message_id));
          if (messageIndex !== -1) {
            const updatedMessages = [...prevMessages];
            updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updatedMessage };
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    };

    const unsubscribeCreated = subscribe('conversation.message.created', handleNewMessage);
    const unsubscribeUpdated = subscribe('conversation.message.updated', handleMessageUpdate);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [subscribe, scrollToBottom]);

  // Efecto para manejar el scroll del contenedor de mensajes (solo para el botón de scroll to bottom)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

    const handleSendMessage = async () => {
    if (selectedTemplate) {
      if (!selectedConversation || !selectedObligation) return;
      try {
        await sendTemplatedMessage({
          template_id: selectedTemplate.id,
          phone_number: selectedConversation.customer_phone_number,
          cedula: selectedConversation.client_cedula,
          obligacion: selectedObligation,
        });
        toast.success('Plantilla enviada correctamente');
        setSelectedTemplate(null);
        setSelectedObligation(null);
        fetchAllConversations();
      } catch (error) {
        const message = error?.message || 'Error al enviar la plantilla';
        toast.error(message);
      }
    } else {
      if (newMessage.trim() === '' || !selectedConversation) return;

      const temporaryId = -Date.now();
      const optimisticMessage = {
        id: temporaryId,
        message_id: `temp_${Date.now()}`,
        body: newMessage,
        timestamp: new Date().toISOString(),
        from_phone_number: 'me',
        message_type: 'text',
        status: 'pending',
      };

      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      const messageToSend = newMessage;
      setNewMessage('');
      // No hacer scroll aquí - el useLayoutEffect en WppMessageList lo hará automáticamente
      // si el usuario estaba viendo el final de la conversación

      // Optimistic update for conversation list (ya no es necesario con WebSocket)

      try {
        const messageData = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: selectedConversation.customer_phone_number,
          type: 'text',
          text: { body: messageToSend },
        };
        const sentMessage = await sendMessage(selectedConversation.id, messageData);

        if (sentMessage && sentMessage.messages && sentMessage.messages.length > 0) {
          const finalMessage = sentMessage.messages[0];
          const updateMessageState = (prevMessages) =>
            prevMessages.map(msg =>
              msg.id === temporaryId
                ? { ...msg, status: 'sent', message_id: finalMessage.id, id: finalMessage.id }
                : msg
            );

          setMessages(updateMessageState);
          setMessagesCache(prevCache => ({
            ...prevCache,
            [selectedConversation.id]: updateMessageState(prevCache[selectedConversation.id] || [])
          }));
        }

      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === temporaryId ? { ...msg, status: 'failed' } : msg
          )
        );
        if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
          toast.error('Error al enviar el mensaje: ' + error.message);
        }
      }
    }
  };

  const handleViewInAdminfo = () => {
    if (adminfoData.url) {
      window.open(adminfoData.url, '_blank');
    } else {
      toast.error('La URL de Adminfo no está disponible para este cliente.');
    }
  };

  const handleMediaFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      let detectedType = type;
      if (type === 'image' && file.type.startsWith('video/')) {
        detectedType = 'video';
      }
      setSelectedMediaFile(file);
      setMediaType(detectedType);
    }
  };

  const handleCancelMedia = () => {
    setSelectedMediaFile(null);
    setMediaType('');
  };




  const handleSendMedia = async () => {
    if (!selectedMediaFile || !selectedConversation || !mediaType) return;

    const temporaryId = -Date.now();
    const localMediaUrl = URL.createObjectURL(selectedMediaFile);

    const optimisticMessage = {
      id: temporaryId,
      message_id: `temp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      from_phone_number: 'me',
      status: 'pending',
      message_type: mediaType,
      localMediaUrl: localMediaUrl, // <-- LA PROPIEDAD CLAVE
      body: selectedMediaFile.name,
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setSelectedMediaFile(null);
    setMediaType('');
    setTimeout(scrollToBottom, 100);

    setIsUploadingMedia(true);
    let temporaryUrl = localMediaUrl;

    try {
      // Determinar el tipo MIME correcto
      let mimeType = selectedMediaFile.type;
      if (mediaType === 'audio' && !mimeType) {
        mimeType = 'audio/mpeg';
      } else if (!mimeType) {
        mimeType = 'application/octet-stream';
      }

      // Paso 1: Obtener URL firmada para subida directa a GCS (Usando el nuevo endpoint de WhatsApp)
      // El backend espera: conversation_id, mime_type, kind
      const signedUploadResponse = await getSignedUploadUrl(
        parseInt(selectedConversation.id),
        mimeType,
        mediaType === 'audio' ? 'audio' : 'media'
      );

      // Paso 2: Subir archivo directamente a GCS usando la URL firmada
      // Nota: El backend devuelve 'signed_url' y 'gcs_object_name'
      const uploadResponse = await fetch(signedUploadResponse.signed_url, {
        method: 'PUT',
        body: selectedMediaFile,
        headers: {
          'Content-Type': mimeType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir el archivo a Google Cloud Storage. Verifique la configuración de CORS en el bucket.');
      }

      // Paso 3: Registrar el archivo en Meta para obtener el media_id (Paso requerido según el API)
      // Endpoint: /api/v1/whatsapp/media/upload_from_gcs
      const storageObject = signedUploadResponse.gcs_object_name;

      // Intentar subir a Meta (esto devuelve el media_id si es necesario, 
      // o el backend se encarga de procesar el storage_object en los reply endpoints)
      // Según Untitled-1.json, los endpoints de reply esperan el storage_object

      let response;
      switch (mediaType) {
        case 'image':
          response = await sendImageFromGCS(selectedConversation.id, storageObject);
          break;
        case 'video':
          response = await sendVideoFromGCS(selectedConversation.id, storageObject);
          break;
        case 'audio':
          response = await sendAudioFromGCS(selectedConversation.id, storageObject);
          break;
        case 'document':
          response = await sendDocumentFromGCS(selectedConversation.id, storageObject, selectedMediaFile.name);
          break;
        case 'sticker':
          response = await sendStickerFromGCS(selectedConversation.id, storageObject);
          break;
        default:
          throw new Error('Tipo de medio no soportado');
      }

      if (response) {
        // Al recibir la respuesta, reemplazamos el mensaje.
        // El nuevo objeto 'response' NO tendrá 'localMediaUrl',
        // por lo que WppMessageContent usará la carga diferida normal.
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === temporaryId ? response : msg
          )
        );
      }
    } catch (error) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === temporaryId ? { ...msg, status: 'failed' } : msg
        )
      );
      console.error('Error sending media:', error);
      if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
        toast.error('Error al enviar el medio: ' + error.message);
      }
    } finally {
      setIsUploadingMedia(false);
      URL.revokeObjectURL(localMediaUrl);
    }
  };
  return (
    <div className="flex h-full min-h-0 bg-transparent overflow-hidden" style={{ background: 'transparent' }}>
      <WppConversationSidebar
        conversations={visibleConversations}
        isLoading={isLoadingConversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        userRole={userRole}
        onConversationInitiated={() => fetchAllConversations()}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onLoadMore={handleLoadMoreConversations}
        hasMore={hasMoreConversations}
        showFilters={showFilters}
        showCoordinatorDropdown={showCoordinatorDropdown}
        teamMembers={teamMembers}
        coordinators={coordinators}
        serverFilter={serverFilter}
        onServerFilterChange={setServerFilter}
        coordinatorFilter={coordinatorFilter}
        onCoordinatorFilterChange={(val) => {
          setCoordinatorFilter(val);
          setServerFilter(null);
        }}
        isLoadingFilters={isLoadingFilters}
      />

      <WppChatArea
        selectedConversation={selectedConversation}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleMediaFileSelect={handleMediaFileSelect}
        selectedMediaFile={selectedMediaFile}
        handleSendMedia={handleSendMedia}
        handleCancelMedia={handleCancelMedia}
        isUploadingMedia={isUploadingMedia}
        onDocumentClick={setPreviewFileUrl}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        showScrollButton={showScrollButton}
        scrollToBottom={scrollToBottom}
        isLoadingMessages={isLoadingMessages}
        isLoadingOlderMessages={isLoadingOlderMessages}
        hasMoreMessages={hasMoreMessages}
        onLoadOlderMessages={loadOlderMessages}
        isSessionExpired={isSessionExpired}
        onOpenExpiredSessionModal={() => setIsExpiredSessionModalOpen(true)}
        selectedTemplate={selectedTemplate}
        onCancelTemplate={() => setSelectedTemplate(null)}
        adminfoData={adminfoData}
        handleViewInAdminfo={handleViewInAdminfo}
      />

      {userRole !== 'administrador' && (
        <WppClientInfo
          selectedConversation={selectedConversation}
          userRole={userRole}
          setClientInfo={setClientInfo}
          onAdminfoUrlChange={setAdminfoData}
        />
      )}

      <DocumentPreviewModal fileUrl={previewFileUrl} onClose={() => setPreviewFileUrl(null)} />
      <ExpiredSessionModal
        isOpen={isExpiredSessionModalOpen}
        onClose={() => setIsExpiredSessionModalOpen(false)}
        onConversationInitiated={() => {
          // Esta función ahora es manejada por el Sidebar,
          // se puede dejar vacía o conectar a una nueva lógica de recarga si es necesario.
          console.log("onConversationInitiated from Modal called");
        }}
        conversation={selectedConversation}
        clientInfo={clientInfo}
        onTemplateSelect={setSelectedTemplate}
        onObligationSelect={setSelectedObligation}
      />
    </div>
  );
};

export default WhatsAppChatPage;
