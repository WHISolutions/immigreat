import React from 'react';
import NotificationBell from '../components/notifications/NotificationBell';

const HeaderWithNotifications: React.FC = () => {
  return (
    <div className="header-with-notifications">
      <h1>Dashboard</h1>
      <NotificationBell />
    </div>
  );
};

export default HeaderWithNotifications;