import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

interface Notification {
  id: string;
  type: string;
  message: string;
  date: string;
  lienRedirection?: string;
  nomClient?: string;
  isRead: boolean; // Ajout de la propriété isRead
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void; // Nouvelle fonction
  markAllAsRead: () => void; // Nouvelle fonction
  unreadCount: number; // Nombre de notifications non lues
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Calculer unreadCount basé sur notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // Récupérer les informations utilisateur depuis le localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token') || undefined;
    
    const currentSocket = connectSocket(userData.id, token); // Passer userId et token

    // Assurez-vous que currentSocket est non nul avant d'attacher des écouteurs
    if (currentSocket) {
      // Écouter les deux noms d'événements pour compatibilité
      currentSocket.on('nouvelle_notification', (notification: Omit<Notification, 'id' | 'isRead'>) => {
        console.log('Notification reçue (nouvelle_notification):', notification);
        addNotification(notification);
      });

      currentSocket.on('new_notification', (notification: Omit<Notification, 'id' | 'isRead'>) => {
        console.log('Notification reçue (new_notification):', notification);
        addNotification(notification);
      });

      currentSocket.on('disconnect', () => {
        console.log('Déconnecté du serveur WebSocket');
      });

      currentSocket.on('connect_error', (err: Error) => {
        console.error('Erreur de connexion WebSocket:', err);
      });
    }

    return () => {
      // Assurez-vous que currentSocket est non nul avant de détacher les écouteurs
      if (currentSocket) {
        currentSocket.off('nouvelle_notification');
        currentSocket.off('new_notification');
        currentSocket.off('disconnect');
        currentSocket.off('connect_error');
      }
      disconnectSocket(); // disconnectSocket gère déjà la nullité de la variable socket globale
    };
  }, []); // Le tableau de dépendances vide est correct ici

  const addNotification = (notificationData: Omit<Notification, 'id' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: new Date().toISOString() + Math.random().toString(36).substring(2, 15),
      isRead: false, // Par défaut, non lue
    };
    setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  const markAsRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};