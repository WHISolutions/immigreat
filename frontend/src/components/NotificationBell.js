import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, removeNotification } = useNotifications();

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    if (notification.lienRedirection) {
      window.location.href = notification.lienRedirection;
    }
  };

  const handleMarkAsRead = (id) => {
    removeNotification(id);
  };

  return (
    <div className="notifications">
      <span className="icon icon-md icon-interactive" onClick={toggleNotifications}>
        <i className="fas fa-bell"></i>
        {notifications.length > 0 && (
          <span className="icon-badge">{notifications.length}</span>
        )}
      </span>
      {isOpen && notifications.length > 0 && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
          </div>
          <div className="notification-list">
            {notifications.map(notification => (
              <div key={notification.id} className="notification-item">
                <div 
                  className="notification-content"
                  onClick={() => notification.lienRedirection && handleNotificationClick(notification)}
                >
                  <div className="notification-title">
                    <strong>{notification.type.replace('_', ' ').toUpperCase()}</strong>
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-meta">
                    {notification.nomClient && (
                      <div className="notification-client">Client: {notification.nomClient}</div>
                    )}
                    <div className="notification-time">
                      {new Date(notification.date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button 
                  className="notification-close" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(notification.id);
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="notification-footer">
            <button 
              className="mark-all-read"
              onClick={() => notifications.forEach(n => removeNotification(n.id))}
            >
              Tout marquer comme lu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}