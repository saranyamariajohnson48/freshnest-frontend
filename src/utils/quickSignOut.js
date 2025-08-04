// Quick sign-out utility - run this in browser console
export const quickSignOut = async () => {
  try {
    console.log('🔴 Quick sign-out initiated...');
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    console.log('✅ Cleared localStorage');
    
    // Sign out from Clerk if available
    if (window.Clerk) {
      await window.Clerk.signOut();
      console.log('✅ Signed out from Clerk');
    }
    
    // Redirect to login
    window.location.href = '/login';
    
    console.log('✅ Quick sign-out completed');
  } catch (error) {
    console.error('❌ Error during quick sign-out:', error);
  }
};

// Make it available globally for console use
if (typeof window !== 'undefined') {
  window.quickSignOut = quickSignOut;
}

console.log('🔧 Quick sign-out utility loaded. Run quickSignOut() in console to sign out immediately.');