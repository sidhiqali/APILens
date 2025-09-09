import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/store/auth';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@/types';

export const useAuthHooks = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    user,
    isAuthenticated,
    isLoading,
    login: setAuthData,
    logout: clearAuthData,
    setLoading,
    updateUser,
    setError,
  } = useAuth();

  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authService.validateSession(),
    enabled: false,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  useEffect(() => {
    if (sessionQuery.isLoading) {
      setLoading(true);
      return;
    }

    setLoading(false);

    if (
      sessionQuery.data?.success &&
      sessionQuery.data.data &&
      !isAuthenticated
    ) {
      setAuthData(sessionQuery.data.data);
    }
  }, [
    sessionQuery.data,
    sessionQuery.isLoading,
    isAuthenticated,
    setAuthData,
    setLoading,
  ]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuthData(response.data);
        toast.success(`Welcome back, ${response.data.email}!`, {
          duration: 3000,
          position: 'top-center',
        });
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          response.message ||
            'Registration successful! Please check your email for verification link.',
          {
            duration: 6000,
            position: 'top-center',
            style: {
              background: '#10B981',
              color: '#fff',
              fontWeight: '500',
            },
          }
        );
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
        },
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuthData();
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/login');
    },
    onError: (error: any) => {
      clearAuthData();
      queryClient.clear();
      router.push('/login');
      toast.error(error.response?.data?.message || 'Logout failed');
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (request: ForgotPasswordRequest) =>
      authService.forgotPassword(request),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Password reset email sent! Check your inbox.');
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to send reset email'
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (request: ResetPasswordRequest) =>
      authService.resetPassword(request),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Password reset successful! You can now login.');
        router.push('/login');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Password reset failed');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (request: ChangePasswordRequest) =>
      authService.changePassword(request),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Password changed successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Password change failed');
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Email verified successfully!');
        router.push('/login');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Email verification failed');
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: () => authService.resendVerificationEmail(),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Verification email sent!');
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to send verification email'
      );
    },
  });

  const profileQuery = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (userData: Partial<any>) => authService.updateProfile(userData),
    onSuccess: (response) => {
      if (response.success && response.data) {
        updateUser(response.data);
        queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
        toast.success('Profile updated successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Profile update failed');
    },
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: (file: File) => authService.uploadProfilePicture(file),
    onSuccess: (response) => {
      if (response.success && response.data) {
        updateUser({ profilePicture: response.data.profilePicture });
        queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
        toast.success('Profile picture updated!');
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to upload profile picture'
      );
    },
  });

  const login = (credentials: LoginRequest) => {
    loginMutation.mutate(credentials);
  };

  const register = (userData: RegisterRequest) => {
    registerMutation.mutate(userData);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const forgotPassword = (email: string) => {
    forgotPasswordMutation.mutate({ email });
  };

  const resetPassword = (token: string, password: string) => {
    resetPasswordMutation.mutate({ token, password });
  };

  const changePassword = (currentPassword: string, newPassword: string) => {
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const verifyEmail = (token: string) => {
    verifyEmailMutation.mutate(token);
  };

  const resendVerification = () => {
    resendVerificationMutation.mutate();
  };

  const updateProfile = (userData: Partial<any>) => {
    updateProfileMutation.mutate(userData);
  };

  const uploadProfilePicture = (file: File) => {
    uploadProfilePictureMutation.mutate(file);
  };

  return {
    user,
    isAuthenticated,
    isLoading:
      isLoading || loginMutation.isPending || registerMutation.isPending,

    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerification,
    updateProfile,
    uploadProfilePicture,

    loginMutation,
    registerMutation,
    logoutMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
    changePasswordMutation,
    verifyEmailMutation,
    resendVerificationMutation,
    updateProfileMutation,
    uploadProfilePictureMutation,

    profileQuery,
    sessionQuery,

    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isForgotPasswordPending: forgotPasswordMutation.isPending,
    isResetPasswordPending: resetPasswordMutation.isPending,
    isChangePasswordPending: changePasswordMutation.isPending,
    isVerifyEmailPending: verifyEmailMutation.isPending,
    isResendVerificationPending: resendVerificationMutation.isPending,
    isUpdateProfilePending: updateProfileMutation.isPending,
    isUploadProfilePicturePending: uploadProfilePictureMutation.isPending,

    profile: profileQuery.data?.data,
    isProfileLoading: profileQuery.isLoading,
    isSessionValid: sessionQuery.data?.success,
  };
};

export const useUser = () => {
  const { profileQuery } = useAuthHooks();
  return profileQuery;
};

export const useLogin = () => {
  const { loginMutation } = useAuthHooks();
  return loginMutation;
};

export const useRegister = () => {
  const { registerMutation } = useAuthHooks();
  return registerMutation;
};

export const useLogout = () => {
  const { logoutMutation } = useAuthHooks();
  return logoutMutation;
};
