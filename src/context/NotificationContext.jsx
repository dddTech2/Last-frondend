import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, BASE_URL } from '../services/api';
import { NotificationContext } from './NotificationContextDefinition';
import { NotificationsSocket } from '../utils/NotificationsSocket';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import NotificationToast from '../components/NotificationToast';

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(true);
  const { getAccessToken, isAuthenticated, loading: authLoading } = useAuth(); // Get authLoading
  const socketRef = useRef(/** @type {NotificationsSocket | undefined} */ (undefined));
  const subscribersRef = useRef({});

  const subscribe = useCallback((event, callback) => {
    if (!subscribersRef.current[event]) {
      subscribersRef.current[event] = [];
    }
    subscribersRef.current[event].push(callback);
    // Return an unsubscribe function for cleanup
    return () => {
      if (subscribersRef.current[event]) {
        subscribersRef.current[event] = subscribersRef.current[event].filter(
          (cb) => cb !== callback
        );
      }
    };
  }, []);

  const handleNewNotification = useCallback((msg) => {
    // Dispatch to generic subscribers first
    if (subscribersRef.current[msg.event]) {
      subscribersRef.current[msg.event].forEach((callback) => {
        try {
          callback(msg.payload);
        } catch (e) {
          console.error(`Error in subscriber for event ${msg.event}:`, e);
        }
      });
    }

    // Silence keepalive events to avoid log noise
    if (msg.event === 'keepalive') return;

    // Original logic for notifications panel
    console.debug('[NotificationContext] Event received:', msg.event, msg.payload);
    console.log('--- NUEVA ACTUALIZACIÓN DE NOTIFICACIÓN ---');
    console.log('Evento:', msg.event);
    console.log('Contenido:', msg.payload);
    console.log('-------------------------------------------');
    if (msg.event === 'snapshot') {
      const list = msg.payload.slice().sort((a, b) => (new Date(a.created_at) < new Date(b.created_at) ? 1 : -1));
      setNotifications(list);
    const unread = list.reduce((acc, n) => acc + (n && n.is_read ? 0 : 1), 0);
    setUnreadCount(unread);
    console.debug('[NotificationContext] Snapshot applied. Count:', list.length, 'Unread:', unread);
      setLoading(false);
      setLoadingCount(false);
    } else if (msg.event === 'notification.created') {
      if (!msg.payload || !msg.payload.id) {
        console.warn('[NotificationContext] Received notification.created event with invalid payload:', msg.payload);
        return;
      }
      setNotifications((prev) => {
        // Ensure prev is an array, default to empty array if somehow undefined
        const currentNotifications = Array.isArray(prev) ? prev : [];
        const existingIndex = currentNotifications.findIndex(n => n.id === msg.payload.id);
        if (existingIndex > -1) {
          const newNotifications = [...currentNotifications];
          newNotifications[existingIndex] = msg.payload;
          console.debug('[NotificationContext] Updated duplicate notification (created).');
          return newNotifications;
        }
        console.debug('[NotificationContext] New notification prepended.');
        return [msg.payload, ...currentNotifications];
      });
      setUnreadCount((prev) => prev + 1);
      toast(<NotificationToast notification={msg.payload} />, {
        id: msg.payload.id,
        duration: 5000,
      });
    } else if (msg.event === 'notification.read') {
      setNotifications((prev) =>
        prev.map((n) => (n.id === msg.payload.id ? { ...n, is_read: true } : n))
      );
      console.debug('[NotificationContext] Marked as read (WS event):', msg.payload.id);
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (msg.event === 'unread_count.updated') {
      setUnreadCount(msg.payload.count);
      console.debug('[NotificationContext] Unread count updated:', msg.payload.count);
      setLoadingCount(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      const list = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
      console.debug('[NotificationContext] REST fetch shape:', {
        topLevelArray: Array.isArray(response),
        hasDataArray: Array.isArray(response?.data),
        finalCount: list.length,
      });
    setNotifications(list);
    const unread = list.reduce((acc, n) => acc + (n && n.is_read ? 0 : 1), 0);
    setUnreadCount(unread);
    console.debug('[NotificationContext] REST fetch applied. Unread derived:', unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      console.debug('[NotificationContext] markAsRead called:', notificationId);
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      console.debug('[NotificationContext] markAllAsRead called');
      await markAllNotificationsAsRead();
      // After marking all as read, refetch notifications to ensure UI is updated
      // This is a fallback in case WebSocket event for 'read-all' is not immediately propagated or handled.
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    console.debug('[NotificationContext] useEffect triggered.');
    console.debug('[NotificationContext] Dependencies: isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
    // Log previous values of dependencies to identify which one changed
    // This requires a ref to store previous values, but for now, just logging current state.

    // Wait for AuthContext to finish loading before proceeding
    if (authLoading) {
      console.debug('[NotificationContext] AuthContext is still loading, deferring socket connection and notification fetch.');
      return;
    }

    const currentToken = getAccessToken();
    console.debug('[NotificationContext] Current token from getAccessToken (useEffect):', currentToken ? currentToken.substring(0, 10) + '...' : 'Not Available');

    if (!isAuthenticated || !currentToken) {
      console.debug('[NotificationContext] User not authenticated or token not available, skipping socket connection and notification fetch.');
      socketRef.current?.close();
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setLoadingCount(false);
      return;
    }

    const getToken = async () => {
      const token = getAccessToken();
      console.debug('[NotificationContext] getToken callback executed. Token:', token ? token.substring(0, 10) + '...' : 'Not Available');
      if (!token) {
        console.warn("[NotificationContext] No access token available for WebSocket connection (inside getToken callback).");
        return "";
      }
      return token;
    };

    console.debug('[NotificationContext] Initializing socket with available token...');
    socketRef.current = new NotificationsSocket(getToken, handleNewNotification);
    socketRef.current.connect(BASE_URL);
    // fetchNotifications(); // Optimization: Socket sends initial snapshot, no need to fetch manually.

    return () => {
      // Nota: se eliminó clearTimeout(connectTimeout) porque la variable nunca se define y generaba ReferenceError
      console.debug('[NotificationContext] Cleaning up socket...');
      socketRef.current?.close();
    };
  }, [getAccessToken, handleNewNotification, fetchNotifications, isAuthenticated, authLoading]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, loadingCount, fetchNotifications, markAsRead, markAllAsRead, subscribe }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
