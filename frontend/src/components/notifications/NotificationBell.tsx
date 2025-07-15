import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const actualUnreadCount = notifications.filter(notif => !notif.isRead).length;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.lienRedirection) {
      window.location.href = notification.lienRedirection;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead_assigned':
        return '👤';
      case 'lead_converted':
        return '✅';
      case 'payment_received':
        return '💰';
      case 'appointment_reminder':
        return '📅';
      case 'document_uploaded':
        return '📎';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const displayedNotifications = notifications.slice(0, 10);

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className={`notification-bell-button ${actualUnreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
        aria-label={`Notifications (${actualUnreadCount} non lues)`}
      >
        <span className="bell-icon">🔔</span>
        {actualUnreadCount > 0 && (
          <span className="notification-badge">
            {actualUnreadCount > 99 ? '99+' : actualUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {actualUnreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Marquer tout comme lu
              </button>
            )}
          </div>

          <div className="notification-list">
            {displayedNotifications.length > 0 ? (
              displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : 'read'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-date">
                        {formatDate(notification.date)}
                      </span>
                      {notification.nomClient && (
                        <span className="notification-client">
                          Client: {notification.nomClient}
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="notification-unread-indicator" />
                  )}
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <span>Aucune notification</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;