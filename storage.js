
// ========== ALAYAKAP STORAGE MANAGER ==========
// Central storage management with per-user notifications

// Generate unique IDs
function generateId(prefix = 'id') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ===== USER MANAGEMENT =====
function getUsers() {
  return JSON.parse(localStorage.getItem('ak_users') || '[]');
}

function setUsers(users) {
  localStorage.setItem('ak_users', JSON.stringify(users));
}

function getCurrentUserId() {
  return localStorage.getItem('ak_currentUser');
}

function setCurrentUserId(userId) {
  localStorage.setItem('ak_currentUser', userId);
}

function getCurrentUser() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const users = getUsers();
  return users.find(u => u.id === userId);
}

function logoutUser() {
  localStorage.removeItem('ak_currentUser');
}

// ===== REQUESTS MANAGEMENT =====
function getAllRequests() {
  return JSON.parse(localStorage.getItem('ak_all_requests') || '[]');
}

function setAllRequests(requests) {
  localStorage.setItem('ak_all_requests', JSON.stringify(requests));
}

function addRequest(request) {
  const requests = getAllRequests();
  request.id = request.id || generateId('req');
  request.timestamp = Date.now();
  requests.push(request);
  setAllRequests(requests);
  
  // Notify all other users about new request
  notifyAllUsersOfNewRequest(request.title, request.category, request.userId);
  
  return request;
}

function updateRequest(requestId, updates) {
  const requests = getAllRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index > -1) {
    const oldStatus = requests[index].status;
    requests[index] = { ...requests[index], ...updates };
    setAllRequests(requests);
    
    // Notify recipient of status change
    if (updates.status && updates.status !== oldStatus) {
      notifyRecipientOfUpdate(
        requests[index].userId,
        requests[index].title,
        oldStatus,
        updates.status
      );
    }
    
    return requests[index];
  }
  return null;
}

function deleteRequest(requestId) {
  let requests = getAllRequests();
  requests = requests.filter(r => r.id !== requestId);
  setAllRequests(requests);
}

function getUserRequests(userId) {
  const requests = getAllRequests();
  return requests.filter(r => r.userId === userId);
}

// ===== DONATIONS MANAGEMENT =====
function getAllDonations() {
  return JSON.parse(localStorage.getItem('ak_all_donations') || '[]');
}

function setAllDonations(donations) {
  localStorage.setItem('ak_all_donations', JSON.stringify(donations));
}

function addDonation(donation) {
  const donations = getAllDonations();
  donation.id = donation.id || generateId('don');
  donation.timestamp = Date.now();
  donations.push(donation);
  setAllDonations(donations);
  
  // Notify recipient of donation match
  if (donation.requestId) {
    notifyRecipientOfDonation(
      donation.requestId,
      donation.donorName,
      donation.title
    );
  }
  
  // Create confirmation notification for donor
  createNotification(
    donation.donorId,
    'update',
    'DONATION SUBMITTED',
    `Your donation of ${donation.quantity || 1} ${donation.title} has been submitted successfully. Status: ${donation.status}`
  );
  
  return donation;
}

function updateDonation(donationId, updates) {
  const donations = getAllDonations();
  const index = donations.findIndex(d => d.id === donationId);
  if (index > -1) {
    const oldStatus = donations[index].status;
    donations[index] = { ...donations[index], ...updates };
    setAllDonations(donations);
    
    // Notify donor of status change
    if (updates.status && updates.status !== oldStatus) {
      notifyDonorOfUpdate(
        donations[index].donorId,
        donations[index].title,
        oldStatus,
        updates.status
      );
      
      // If completed, send pickup reminder
      if (updates.status === 'Completed') {
        notifyPickupReminder(
          donations[index].donorId,
          donations[index].title,
          donations[index].location || 'specified location',
          'soon'
        );
      }
    }
    
    return donations[index];
  }
  return null;
}

function getUserDonations(userId) {
  const donations = getAllDonations();
  return donations.filter(d => d.donorId === userId);
}

// ===== NOTIFICATIONS MANAGEMENT =====
function getAllNotifications() {
  return JSON.parse(localStorage.getItem('ak_all_notifications') || '[]');
}

function setAllNotifications(notifications) {
  localStorage.setItem('ak_all_notifications', JSON.stringify(notifications));
}

function addNotification(notification) {
  const notifications = getAllNotifications();
  notification.id = notification.id || generateId('notif');
  notification.timestamp = notification.timestamp || Date.now();
  notification.read = notification.read || false;
  notifications.unshift(notification);
  setAllNotifications(notifications);
  return notification;
}

function getUserNotifications(userId) {
  const notifications = getAllNotifications();
  return notifications.filter(n => n.userId === userId);
}

function markNotificationAsRead(notificationId) {
  const notifications = getAllNotifications();
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index > -1) {
    notifications[index].read = true;
    notifications[index].badge = false;
    setAllNotifications(notifications);
  }
}

function deleteNotification(notificationId) {
  let notifications = getAllNotifications();
  notifications = notifications.filter(n => n.id !== notificationId);
  setAllNotifications(notifications);
}

// ===== NOTIFICATION CREATORS =====
function createNotification(userId, type, title, message) {
  const icons = {
    'match': '❤️',
    'new_request': '🎁',
    'update': '✅',
    'reminder': '⏰'
  };
  
  return addNotification({
    userId: userId,
    type: type,
    icon: icons[type] || '📢',
    title: title,
    message: message,
    timeAgo: 'Just now',
    badge: true
  });
}

function notifyRecipientOfDonation(requestId, donorName, itemName) {
  const request = getAllRequests().find(r => r.id === requestId);
  if (request && request.userId) {
    createNotification(
      request.userId,
      'match',
      'DONATION MATCH FOUND',
      `${donorName} wants to donate ${itemName} to your request! Check your dashboard for details.`
    );
  }
}

function notifyAllUsersOfNewRequest(requestTitle, requestCategory, excludeUserId) {
  const users = getUsers();
  users.forEach(user => {
    if (user.id !== excludeUserId) {
      createNotification(
        user.id,
        'new_request',
        'NEW DONATION REQUEST',
        `A new request for ${requestTitle} (${requestCategory}) has been added to the donation listing.`
      );
    }
  });
}

function notifyDonorOfUpdate(donorId, itemName, oldStatus, newStatus) {
  createNotification(
    donorId,
    'update',
    'DONATION STATUS UPDATED',
    `Your donation "${itemName}" status changed from ${oldStatus} to ${newStatus}.`
  );
}

function notifyRecipientOfUpdate(recipientId, itemName, oldStatus, newStatus) {
  createNotification(
    recipientId,
    'update',
    'REQUEST STATUS UPDATED',
    `Your request for "${itemName}" status changed from ${oldStatus} to ${newStatus}.`
  );
}

function notifyPickupReminder(userId, itemName, location, time) {
  createNotification(
    userId,
    'reminder',
    'PICKUP REMINDER',
    `Don't forget to coordinate pickup for "${itemName}" at ${location}. Contact the recipient to arrange details.`
  );
}

// ===== INITIALIZATION =====
function initializeDefaultData() {
  if (getAllRequests().length === 0) {
    const defaultRequests = [
      {
        id: generateId('req'),
        title: 'School Books',
        category: 'Book',
        img: 'https://i.imgur.com/2Q9Gk6J.png',
        requestedBy: 'Juan Dela Cruz',
        location: 'Agoo, La Union',
        contact: 'juan@email.com',
        date: '2025-01-07',
        status: 'Active',
        userId: 'default1',
        quantity: 5,
        timestamp: Date.now() - 86400000
      },
      {
        id: generateId('req'),
        title: 'Canned Goods',
        category: 'Food',
        img: 'https://i.imgur.com/3c7s9hH.png',
        requestedBy: 'Ana Santos',
        location: 'San Fernando',
        contact: 'ana@email.com',
        date: '2025-01-25',
        status: 'Active',
        userId: 'default2',
        quantity: 10,
        timestamp: Date.now() - 172800000
      }
    ];
    setAllRequests(defaultRequests);
  }
}

initializeDefaultData();

// Export functions globally
window.StorageManager = {
  generateId,
  getUsers,
  setUsers,
  getCurrentUserId,
  setCurrentUserId,
  getCurrentUser,
  logoutUser,
  getAllRequests,
  setAllRequests,
  addRequest,
  updateRequest,
  deleteRequest,
  getUserRequests,
  getAllDonations,
  setAllDonations,
  addDonation,
  updateDonation,
  getUserDonations,
  getAllNotifications,
  setAllNotifications,
  addNotification,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
  notifyRecipientOfDonation,
  notifyAllUsersOfNewRequest,
  notifyDonorOfUpdate,
  notifyRecipientOfUpdate,
  notifyPickupReminder,
  initializeDefaultData
};
