import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../contexts/ToastContext';
import authService from '../services/authService';

export const useClerkAuth = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { success, error } = useToastContext();

  const handleGoogleSignIn = async (clerkUser, selectedRole = null) => {
    try {
      // Validate required user data
      if (!clerkUser?.primaryEmailAddress?.emailAddress) {
        throw new Error('Email address is required for Google sign-in');
      }

      // Extract user data from Clerk
      const userData = {
        email: clerkUser.primaryEmailAddress.emailAddress,
        fullName: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImage: clerkUser.imageUrl,
        clerkId: clerkUser.id,
        provider: 'google'
      };

      // Add role if provided
      if (selectedRole) {
        userData.role = selectedRole;
      }

      console.log('Processing Google sign-in with Clerk user:', {
        email: userData.email,
        fullName: userData.fullName,
        clerkId: userData.clerkId,
        role: userData.role
      });

      // Send to your backend to create/login user
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      console.log('Sending request to:', `${apiUrl}/api/auth/google-signin`);

      const response = await fetch(`${apiUrl}/api/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Backend response status:', response.status);

      const data = await response.json();
      console.log('Backend response data:', data);

      // Handle role selection requirement
      if (response.status === 202 && data.requiresRoleSelection) {
        console.log('Role selection required for new user');
        // Store temporary user data for role selection
        sessionStorage.setItem('pendingGoogleUser', JSON.stringify({
          clerkUser: {
            id: clerkUser.id,
            primaryEmailAddress: { emailAddress: clerkUser.primaryEmailAddress.emailAddress },
            fullName: clerkUser.fullName,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
          },
          userData: data
        }));
        
        // Navigate to role selection
        navigate('/google-role-selection');
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }

      // Validate response data
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server - missing token or user data');
      }

      // Store the JWT token using consistent authService keys
      localStorage.setItem('freshnest_access_token', data.token);
      localStorage.setItem('freshnest_user', JSON.stringify(data.user));
      
      // Also calculate and store token expiry (assuming 1 hour expiry)
      const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
      localStorage.setItem('freshnest_token_expiry', expiryTime.toString());

      console.log('Google sign-in successful, user role:', data.user.role);

      // Trigger a storage event to notify other components
      window.dispatchEvent(new Event('storage'));

      // Show success message
      success(`Welcome ${data.user?.fullName || data.user?.email}! 🎉`, {
        duration: 3000
      });

      // Redirect based on user role
      setTimeout(() => {
        if (data.user && (data.user.role === 'admin' || data.user.role === 'Admin')) {
          console.log('Redirecting to admin dashboard');
          navigate("/admin/dashboard");
        } else if (data.user && (data.user.role === 'retailer' || data.user.role === 'Retailer')) {
          console.log('Redirecting to retailer dashboard');
          navigate("/retailer/dashboard");
        } else if (data.user && (data.user.role === 'staff' || data.user.role === 'Staff')) {
          console.log('Redirecting to staff dashboard');
          navigate("/staff/dashboard");
        } else if (data.user && (data.user.role === 'supplier' || data.user.role === 'Supplier')) {
          console.log('Redirecting to supplier dashboard');
          navigate("/supplier/dashboard");
        } else if (data.user && (data.user.role === 'user' || data.user.role === 'User')) {
          console.log('Redirecting to user dashboard');
          navigate("/user/dashboard");
        } else {
          console.log('Redirecting to user dashboard (default)');
          navigate("/user/dashboard"); // Default to user dashboard
        }
      }, 100);

    } catch (err) {
      console.error('Google sign-in error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err.message.includes('Server error: 500')) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (err.message.includes('Email address is required')) {
        errorMessage = 'Unable to get your email from Google. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      error(errorMessage, { duration: 5000 });
      
      // Sign out from Clerk if backend authentication fails
      try {
        await signOut();
        console.log('Signed out from Clerk due to backend error');
      } catch (signOutErr) {
        console.error('Error signing out from Clerk:', signOutErr);
      }
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Sign out from Clerk
      await signOut();
      
      // Navigate to home
      navigate('/');
      
      success('Signed out successfully!', { duration: 2000 });
    } catch (err) {
      console.error('Sign out error:', err);
      error('Error signing out. Please try again.', { duration: 3000 });
    }
  };

  return {
    user,
    handleGoogleSignIn,
    handleSignOut,
    isSignedIn: !!user
  };
};