// ========== ALAYAKAP AUTHENTICATION SYSTEM ==========
// Include this script in ALL pages after storage.js

// Check if user is logged in
function checkAuth() {
  const currentUserId = localStorage.getItem('ak_currentUser');
  if (!currentUserId) {
    // Only redirect if NOT on login page or homepage
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'Login_Signup.html' && currentPage !== 'Homepage.html' && 
        currentPage !== 'aboutus.html' && currentPage !== 'contactus.html') {
      alert('Please login to access this page');
      window.location.href = 'Login_Signup.html';
      return null;
    }
    return null;
  }
  
  const users = JSON.parse(localStorage.getItem('ak_users') || '[]');
  const user = users.find(u => u.id === currentUserId);
  
  if (!user) {
    localStorage.removeItem('ak_currentUser');
    window.location.href = 'Login_Signup.html';
    return null;
  }
  
  return user;
}

// Update navigation with user info
function updateNavigation() {
  const currentUser = checkAuth();
  const authButtons = document.querySelector('.auth-buttons');
  
  if (!authButtons) return;
  
  if (currentUser) {
    // User is logged in - show name and logout
    authButtons.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="color: #374151; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          ${currentUser.name.split(' ')[0]}
        </span>
        <button onclick="handleLogout()" style="background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 9999px; border: none; font-weight: 500; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);" onmouseover="this.style.background='#dc2626'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#ef4444'; this.style.transform='translateY(0)'">
          Logout
        </button>
      </div>
    `;
  } else {
    // User not logged in - show login/signup
    authButtons.innerHTML = `
      <a href="Login_Signup.html" class="btn-login" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Login</a>
      <a href="Login_Signup.html" class="btn-signup" style="background: #4f46e5; color: white; padding: 0.5rem 1rem; border-radius: 9999px; text-decoration: none; font-weight: 500; transition: all 0.3s; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Sign Up</a>
    `;
  }
}

// Logout function
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('ak_currentUser');
    alert('Logged out successfully!');
    window.location.href = 'Homepage.html';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Check auth for protected pages
  const currentPage = window.location.pathname.split('/').pop();
  const protectedPages = [
    'donation_listing.html',
    'donor_dashboard.html', 
    'recipient_dashboard.html',
    'notifications.html'
  ];
  
  if (protectedPages.includes(currentPage)) {
    const user = checkAuth();
    if (!user) {
      return; // Already redirected
    }
  }
  
  // Update navigation
  updateNavigation();
  
  // If on login page and already logged in, redirect to homepage
  if (currentPage === 'Login_Signup.html') {
    const currentUserId = localStorage.getItem('ak_currentUser');
    if (currentUserId) {
      const users = JSON.parse(localStorage.getItem('ak_users') || '[]');
      const user = users.find(u => u.id === currentUserId);
      if (user) {
        window.location.href = 'Homepage.html';
      }
    }
  }
});

// Make functions globally available
window.checkAuth = checkAuth;
window.updateNavigation = updateNavigation;
window.handleLogout = handleLogout;