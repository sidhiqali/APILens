'use client';

import { useState } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import { useAuth } from '@/store/auth';

export default function LoginDebugPage() {
  const [email, setEmail] = useState('ali@gmail.com');
  const [password, setPassword] = useState('');
  const { login, isLoginPending } = useAuthHooks();
  const { user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    console.log('🔄 Starting login process...');
    console.log('📧 Email:', email);
    console.log('🔐 Password length:', password.length);

    try {
      await login({ email, password });
      console.log('✅ Login completed');

      // Check localStorage immediately after login
      setTimeout(() => {
        console.log(
          '🗄️ LocalStorage auth-storage:',
          localStorage.getItem('auth-storage')
        );
        console.log('🍪 Cookies:', document.cookie);
        console.log('🔍 Auth store state:', {
          user,
          isAuthenticated,
        });
      }, 1000);
    } catch (error) {
      console.error('❌ Login error:', error);
    }
  };

  const checkStorage = () => {
    console.log('=== STORAGE CHECK ===');
    console.log(
      '🗄️ localStorage auth-storage:',
      localStorage.getItem('auth-storage')
    );
    console.log('🍪 All cookies:', document.cookie);
    console.log('🔍 Auth store state:', {
      user,
      isAuthenticated,
    });
  };

  const clearStorage = () => {
    localStorage.removeItem('auth-storage');
    console.log('🧹 Cleared localStorage');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Login Debug Tool
        </h1>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleLogin}
            disabled={isLoginPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoginPending ? 'Logging in...' : 'Debug Login'}
          </button>

          <button
            onClick={checkStorage}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Check Storage
          </button>

          <button
            onClick={clearStorage}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear Storage
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-semibold text-gray-800 mb-2">
            Current Auth State:
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Authenticated:</span>{' '}
              <span
                className={isAuthenticated ? 'text-green-600' : 'text-red-600'}
              >
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">User:</span>{' '}
              <span className="text-gray-600">{user?.email || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">Access Token:</span>{' '}
              <span className="text-gray-600">
                Stored as httpOnly cookie (not visible to JavaScript)
              </span>
            </div>
            <div>
              <span className="font-medium">Refresh Token:</span>{' '}
              <span className="text-gray-600">
                Stored as httpOnly cookie (not visible to JavaScript)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Note:</strong> This app now uses httpOnly cookies for tokens
            (more secure). Tokens are not visible in JavaScript or localStorage
            - check the Network tab to see cookies being set.
          </p>
          <p>
            Open browser console to see detailed debug logs and check
            Application → Cookies for httpOnly cookies.
          </p>
        </div>
      </div>
    </div>
  );
}
