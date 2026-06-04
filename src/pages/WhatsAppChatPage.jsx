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
  fetchWhatsAppProfile,
  fetchWhatsAppProfilePicture,
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

  // Responsive state for client info panel
  const [showClientInfo, setShowClientInfo] = useState(window.innerWidth >= 1200);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setShowClientInfo(false);
      } else {
        setShowClientInfo(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estados para validación de perfil WhatsApp
  const [wppProfileData, setWppProfileData] = useState(null);
  const [isLoadingWppProfile, setIsLoadingWppProfile] = useState(false);
  const wppProfileCacheRef = useRef({}); // Caché de sesión local: { [phone_number]: { name, status, profilePic } }

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

      return matchesFilter;
    });
  }, [allConversations, activeFilter]);

  useEffect(() => {
    const initialPage = filteredConversations.slice(0, CONVERSATION_PAGE_SIZE);
    setVisibleConversations(initialPage);
    setConversationPage(2);
    setHasMoreConversations(filteredConversations.length > CONVERSATION_PAGE_SIZE);
  }, [filteredConversations]);

  const fetchAllConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const params = { limit: 100 };
      if (serverFilter) params.filter = serverFilter;
      if (coordinatorFilter) params.coordinator_id = coordinatorFilter;
      if (debouncedSearchTerm.trim() !== '') params.search = debouncedSearchTerm.trim();
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
  }, [serverFilter, coordinatorFilter, debouncedSearchTerm]);

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
    if (selectedConversationRef.current?.id === convo.id) return;
    
    // Clear messages instantly to give immediate visual feedback and unmount old message tree
    setMessages([]);
    setIsLoadingMessages(true);

    if (convo.read_status === 'sent') {
      // Optmistic UI update without blocking
      setAllConversations(conversations => {
        const index = conversations.findIndex(c => c.id === convo.id);
        if (index === -1) return conversations;
        const newConvos = [...conversations];
        newConvos[index] = { ...newConvos[index], read_status: 'read' };
        return newConvos;
      });

      // Fire and forget the API call
      markConversationAsRead(convo.id).catch(error => {
        console.error("Error marking conversation as read", error);
      });
    }
    
    setSelectedConversation(convo);
  }, []);

  const selectedConversationId = selectedConversation?.id;
  const selectedConversationLastClientMessageAt = selectedConversation?.last_client_message_at;
  const selectedConversationIsEvolution = selectedConversation?.active_channel === 'EVOLUTION' || (selectedConversation?.active_channel && selectedConversation?.active_channel.value === 'EVOLUTION') || !!selectedConversation?.evolution_instance_id || !!selectedConversation?.is_evolution;

  // Efecto para cargar el perfil de WhatsApp bajo demanda con caché de sesión
  useEffect(() => {
    if (!selectedConversation) {
      setWppProfileData(null);
      return;
    }

    const phone = selectedConversation.customer_phone_number;

    // Verificar si ya existe en la caché
    if (wppProfileCacheRef.current[phone]) {
      setWppProfileData(wppProfileCacheRef.current[phone]);
      return;
    }

    const loadProfileInfo = async () => {
      setIsLoadingWppProfile(true);
      let resolvedName = selectedConversation.chat_title || `WhatsApp (${phone})`;
      let statusText = '';
      let picUrl = '';

      try {
        const [profileRes, picRes] = await Promise.allSettled([
          fetchWhatsAppProfile(phone),
          fetchWhatsAppProfilePicture(phone)
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value) {
          const data = profileRes.value;
          if (data.exists) {
            resolvedName = data.pushName || data.verifiedName || resolvedName;
            if (data.status) {
              statusText = data.status;
            }
          }
        }

        if (picRes.status === 'fulfilled' && picRes.value) {
          picUrl = picRes.value.profilePictureUrl || '';
        }
      } catch (error) {
        console.error('Error al cargar perfil de WhatsApp:', error);
      }

      const resultProfile = {
        name: resolvedName,
        status: statusText,
        profilePic: picUrl
      };

      wppProfileCacheRef.current[phone] = resultProfile;
      setWppProfileData(resultProfile);
      setIsLoadingWppProfile(false);
    };

    loadProfileInfo();
  }, [selectedConversation]);

  // Efecto para cargar los mensajes iniciales de una conversación
  useEffect(() => {
    if (selectedConversationId) {
      const now = new Date();
      const lastMessageTime = new Date(selectedConversationLastClientMessageAt);
      const diff = now - lastMessageTime;
      const hours = diff / (1000 * 60 * 60);
      setIsSessionExpired(!selectedConversationIsEvolution && hours > 24);

      const fetchMessages = async () => {
        const cachedMessages = messagesCache[selectedConversation.id];

        if (cachedMessages) {
          setMessages(cachedMessages);
          setIsLoadingMessages(false);
          // Usamos requestAnimationFrame para asegurar que se renderice antes de hacer scroll
          requestAnimationFrame(() => {
            setTimeout(() => scrollToBottom(), 50);
          });
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
              const cachedMsgs = prevCache[selectedConversationId] || [];
              const messageMap = new Map(cachedMsgs.map(m => [m.id || m.incoming_id || m.message_id, m]));

              // Update map with API messages, but don't overwrite cached ones
              apiMessages.forEach(apiMsg => {
                const id = apiMsg.id || apiMsg.incoming_id || apiMsg.message_id;
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
  }, [selectedConversationId, selectedConversationLastClientMessageAt, selectedConversationIsEvolution, scrollToBottom]);

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
          ...(newMessage.channel && { active_channel: newMessage.channel }),
          ...(newMessage.system_phone_number && { system_phone_number: newMessage.system_phone_number }),
          ...(newMessage.evolution_instance_id && { evolution_instance_id: newMessage.evolution_instance_id })
        };

        const newConversations = [...prev];
        newConversations.splice(convoIndex, 1);
        return [updatedConvo, ...newConversations].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      };

      setAllConversations(updateConvoList);

      setMessagesCache(prevCache => {
        const currentMessages = prevCache[newMessage.conversation_id] || [];
        if (!currentMessages.some(msg => 
          (msg.message_id && newMessage.message_id && msg.message_id === newMessage.message_id) || 
          (msg.id && (newMessage.id || newMessage.incoming_id) && msg.id === (newMessage.id || newMessage.incoming_id)) ||
          (msg.id === newMessage.id)
        )) {
          const updatedMessages = [...currentMessages, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return { ...prevCache, [newMessage.conversation_id]: updatedMessages };
        }
        return prevCache;
      });

      if (selectedConversationRef.current?.id === newMessage.conversation_id) {
        setMessages(prevMessages => {
          if (!prevMessages.some(msg => 
            (msg.message_id && newMessage.message_id && msg.message_id === newMessage.message_id) || 
            (msg.id && (newMessage.id || newMessage.incoming_id) && msg.id === (newMessage.id || newMessage.incoming_id)) ||
            (msg.id === newMessage.id)
          )) {
            const updatedMessages = [...prevMessages, newMessage];
            return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          return prevMessages;
        });
        
        setSelectedConversation(prev => ({
          ...prev,
          ...(newMessage.channel && { active_channel: newMessage.channel }),
          ...(newMessage.system_phone_number && { system_phone_number: newMessage.system_phone_number }),
          ...(newMessage.evolution_instance_id && { evolution_instance_id: newMessage.evolution_instance_id })
        }));

        if (isNearBottomRef.current) {
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    const handleMessageUpdate = (updatedMessage) => {
      setMessagesCache(prevCache => {
        const currentMessages = prevCache[updatedMessage.conversation_id] || [];
        const messageIndex = currentMessages.findIndex(msg => 
          (msg.message_id && updatedMessage.message_id && msg.message_id === updatedMessage.message_id) || 
          (msg.id && (updatedMessage.id || updatedMessage.incoming_id) && msg.id === (updatedMessage.id || updatedMessage.incoming_id)) ||
          (msg.id === updatedMessage.id)
        );

        if (messageIndex !== -1) {
          const updatedMessages = [...currentMessages];
          updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updatedMessage };
          return { ...prevCache, [updatedMessage.conversation_id]: updatedMessages };
        }
        return prevCache;
      });

      if (selectedConversationRef.current?.id === updatedMessage.conversation_id) {
        setMessages(prevMessages => {
          const messageIndex = prevMessages.findIndex(msg => 
            (msg.message_id && updatedMessage.message_id && msg.message_id === updatedMessage.message_id) || 
            (msg.id && (updatedMessage.id || updatedMessage.incoming_id) && msg.id === (updatedMessage.id || updatedMessage.incoming_id)) ||
            (msg.id === updatedMessage.id)
          );
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
        setSelectedTemplate(null);
        setSelectedObligation(null);
        fetchConversations();
      } catch (error) {
        console.error('Error sending template message:', error);
        alert('Error al enviar la plantilla: ' + error.message);
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
          alert('Error al enviar el mensaje: ' + error.message);
        }
      }
    }
  };

  const handleSendAudioBlob = async (audioBlob) => {
    const audioFile = new File([audioBlob], `voicenote_${new Date().getTime()}.webm`, { type: 'audio/webm' });
    await handleSendMedia(audioFile, 'audio');
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




  const handleSendMedia = async (overrideFile = null, overrideType = null) => {
    const fileToSend = overrideFile instanceof File ? overrideFile : selectedMediaFile;
    const typeToSend = overrideType && typeof overrideType === 'string' ? overrideType : mediaType;

    if (!fileToSend || !selectedConversation || !typeToSend) return;

    const temporaryId = -Date.now();
    const localMediaUrl = URL.createObjectURL(fileToSend);

    const optimisticMessage = {
      id: temporaryId,
      message_id: `temp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      from_phone_number: 'me',
      status: 'pending',
      message_type: typeToSend,
      localMediaUrl: localMediaUrl, // <-- LA PROPIEDAD CLAVE
      body: typeToSend === 'audio' ? 'Nota de voz' : fileToSend.name,
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    
    // Solo limpiar si no se está usando un override (flujo normal)
    if (!(overrideFile instanceof File)) {
      setSelectedMediaFile(null);
      setMediaType('');
    }
    setTimeout(scrollToBottom, 100);

    setIsUploadingMedia(true);
    let temporaryUrl = localMediaUrl;

    try {
      // Determinar el tipo MIME correcto
      let mimeType = fileToSend.type;
      if (typeToSend === 'audio' && !mimeType) {
        mimeType = 'audio/mpeg';
      } else if (!mimeType) {
        mimeType = 'application/octet-stream';
      }

      // Paso 1: Obtener URL firmada para subida directa a GCS (Usando el nuevo endpoint de WhatsApp)
      // El backend espera: conversation_id, mime_type, kind
      const signedUploadResponse = await getSignedUploadUrl(
        parseInt(selectedConversation.id),
        mimeType,
        typeToSend === 'audio' ? 'audio' : 'media'
      );

      // Paso 2: Subir archivo directamente a GCS usando la URL firmada
      // Nota: El backend devuelve 'signed_url' y 'gcs_object_name'
      const uploadResponse = await fetch(signedUploadResponse.signed_url, {
        method: 'PUT',
        body: fileToSend,
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
      // Según Untitled-1.json, los endpoints       let response;
      let response;
      switch (typeToSend) {
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
          response = await sendDocumentFromGCS(selectedConversation.id, storageObject, fileToSend.name);
          break;
        case 'sticker':
          response = await sendStickerFromGCS(selectedConversation.id, storageObject);
          break;
        default:
          throw new Error('Tipo de archivo no soportado para envío por GCS');
      }

      if (response) {
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.id === temporaryId) {
               const realMessageId = response.messages && response.messages.length > 0 
                  ? response.messages[0].id 
                  : (response.id || temporaryId);
               return { ...msg, id: realMessageId, message_id: realMessageId, status: 'sent', localMediaUrl: undefined };
            }
            return msg;
          })
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
        alert('Error al enviar el medio: ' + error.message);
      }
    } finally {
      setIsUploadingMedia(false);
      URL.revokeObjectURL(localMediaUrl);
    }
  };
  return (
    <div className="flex h-full min-h-0 bg-transparent overflow-hidden relative" style={{ background: 'transparent' }}>
      {/* Sidebar: hidden on mobile when a conversation is selected */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 h-full flex-col min-h-0`}>
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
      </div>

      {/* Chat Area: hidden on mobile when NO conversation is selected */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 h-full min-w-0 flex-col`}>
        <WppChatArea
          selectedConversation={selectedConversation}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          handleMediaFileSelect={handleMediaFileSelect}
          selectedMediaFile={selectedMediaFile}
          handleSendMedia={handleSendMedia}
          handleSendAudioBlob={handleSendAudioBlob}
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
          toggleClientInfo={() => setShowClientInfo(prev => !prev)}
          showClientInfo={showClientInfo}
          onBack={() => setSelectedConversation(null)}
          wppProfileData={wppProfileData}
          isLoadingWppProfile={isLoadingWppProfile}
        />
      </div>

      {/* Client Info Panel: toggled on/off, overlays on mobile/tablet, static columns on desktop */}
      {userRole !== 'administrador' && selectedConversation && showClientInfo && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-full bg-white shadow-2xl border-l border-gray-200 md:w-96 lg:static lg:w-96 lg:shadow-none lg:z-auto flex flex-col h-full min-h-0">
          <WppClientInfo
            selectedConversation={selectedConversation}
            userRole={userRole}
            setClientInfo={setClientInfo}
            onAdminfoUrlChange={setAdminfoData}
            onClose={() => setShowClientInfo(false)}
          />
        </div>
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
