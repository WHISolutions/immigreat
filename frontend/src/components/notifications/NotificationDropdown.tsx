import React, { useState, useRef, useEffect } from 'react';
import { useRealNotifications } from '../../hooks/useRealNotifications';
import './NotificationDropdown.css';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = useRealNotifications();

  // Fermer le dropdown quand on clique en dehors
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

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    // Marquer comme lue si pas encore lue
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Redirection si disponible
    if (notification.lienRedirection) {
      window.location.href = notification.lienRedirection;
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
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
      case 'invoice_overdue':
        return '⚠️';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'urgent';
      case 'haute':
        return 'high';
      case 'normale':
        return 'normal';
      case 'basse':
        return 'low';
      default:
        return 'normal';
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

  const getTypeDisplayName = (type: string) => {
    const typeNames: { [key: string]: string } = {
      'lead_assigned': 'LEAD ASSIGNÉ',
      'lead_converted': 'LEAD CONVERTI',
      'payment_received': 'PAIEMENT REÇU',
      'appointment_reminder': 'RAPPEL RDV',
      'document_uploaded': 'DOCUMENT AJOUTÉ',
      'invoice_overdue': 'FACTURE RETARD',
      'system': 'SYSTÈME'
    };
    return typeNames[type] || type.toUpperCase().replace(/_/g, ' ');
  };

  // Afficher seulement les 5 dernières notifications
  const displayedNotifications = notifications.slice(0, 5);

  return (
    <div className={`notification-dropdown-container ${className}`} ref={dropdownRef}>
      <button
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
        aria-label={`Notifications (${unreadCount} non lues)`}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-count-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="notification-dropdown-content">
            {loading && notifications.length === 0 ? (
              <div className="notification-loading">
                <span>Chargement...</span>
              </div>
            ) : error ? (
              <div className="notification-error">
                <span>Erreur: {error}</span>
              </div>
            ) : displayedNotifications.length > 0 ? (
              <div className="notification-list">
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : 'read'} priority-${getPriorityClass(notification.priority)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon-wrapper">
                      <span className="notification-type-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-header-content">
                        <span className="notification-type">
                          {getTypeDisplayName(notification.type)}
                        </span>
                        <span className="notification-time">
                          {formatDate(notification.date)}
                        </span>
                      </div>
                      
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      
                      {notification.nomClient && (
                        <div className="notification-client">
                          Client: {notification.nomClient}
                        </div>
                      )}
                    </div>
                    
                    {!notification.isRead && (
                      <div className="notification-unread-dot" />
                    )}
                    
                    <button 
                      className="notification-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      aria-label="Supprimer cette notification"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notification-empty">
                <span className="empty-icon">🔕</span>
                <span>Aucune notification</span>
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <div className="notification-dropdown-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  setIsOpen(false);
                  // Rediriger vers une page de toutes les notifications si elle existe
                  window.location.href = '/notifications';
                }}
              >
                Voir tout ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
