// Static user credentials
const STATIC_USER = {
  userId: 'bijay',
  password: '7606938822',
};

export async function login(userId, password) {
  if (userId === STATIC_USER.userId && password === STATIC_USER.password) {
    // Store in localStorage
    localStorage.setItem('userId', userId);
    localStorage.setItem('isAuthenticated', 'true');
    return { success: true, userId };
  }
  return { success: false, error: 'Invalid credentials' };
}

export function logout() {
  localStorage.removeItem('userId');
  localStorage.removeItem('isAuthenticated');
}

export function isAuthenticated() {
  return localStorage.getItem('isAuthenticated') === 'true';
}

export function getCurrentUserId() {
  return localStorage.getItem('userId');
}
