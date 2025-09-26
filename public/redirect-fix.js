// Immediate redirect fix for login/dashboard to onboarding
(function() {
  // Check if we're on the dashboard or login success
  const currentPath = window.location.pathname;
  const hasToken = document.cookie.includes('idToken=');
  
  // If user is on dashboard or just logged in, redirect to onboarding
  if (currentPath === '/dashboard' && hasToken) {
    window.location.href = '/onboarding/business';
    return;
  }
  
  // If user just logged in from login page, redirect to onboarding
  if (currentPath === '/login' && hasToken) {
    window.location.href = '/onboarding/business';
    return;
  }
  
  // If user is on root and has token, redirect to onboarding
  if ((currentPath === '/' || currentPath === '') && hasToken) {
    window.location.href = '/onboarding/business';
    return;
  }
})();











