const Notification = require('../../models/Notification');
const logger = require('../../utils/logger/logger');

const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    
    logger.info('Notification created', {
      userId: notificationData.user,
      type: notificationData.type
    });
    
    return notification;
  } catch (error) {
    logger.error('Error creating notification', error);
    throw error;
  }
};

const sendNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = await createNotification({
      user: userId,
      type,
      title,
      message,
      data
    });
    
    return notification;
  } catch (error) {
    logger.error('Error sending notification', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendNotification
};
