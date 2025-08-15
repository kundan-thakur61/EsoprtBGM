/* src/features/notifications/NotificationsPage.jsx */
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications,
  markAsRead,
  clearAllNotifications,
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
} from './notificationsSlice';
import { addNotification, markRead, markAllRead } from './notificationsSlice';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const isLoading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markRead(id));
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
    dispatch(clearAllNotifications());
  };

  if (isLoading) {
    return <div className="p-6">Loading notifications…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary-600 hover:underline"
          >
            Mark All Read & Clear
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-4 rounded border ${
                n.read ? 'bg-gray-100 border-gray-200' : 'bg-white border-primary-600'
              } flex justify-between items-start`}
            >
              <div>
                <p className="font-medium">{n.message}</p>
                {n.type && (
                  <span className="text-xs text-gray-500 uppercase">{n.type}</span>
                )}
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-sm text-green-600 hover:underline"
                >
                  Mark Read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
