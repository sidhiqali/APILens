'use client';

import React from 'react';
import { useAuth } from '@/store/auth';
import RouteGuard from '@/components/RouteGuard';

const DebugPage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <RouteGuard requireAuth={true}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Authentication</h1>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Auth State</h2>
          <div className="space-y-4">
            <div>
              <strong className="text-blue-600">User Email:</strong>{' '}
              {user?.email || 'Not logged in'}
            </div>
            <div>
              <strong className="text-blue-600">Authenticated:</strong>{' '}
              <span
                className={isAuthenticated ? 'text-green-600' : 'text-red-600'}
              >
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <strong className="text-blue-600">Auth Token:</strong>{' '}
              <span className="text-gray-600">
                {isAuthenticated
                  ? 'Stored as httpOnly cookie (secure)'
                  : 'None'}
              </span>
            </div>
            <div>
              <strong className="text-blue-600">Visible Cookies:</strong>{' '}
              <span className="text-gray-600">
                {document.cookie || 'None visible to JavaScript'}
              </span>
            </div>
            <div>
              <strong className="text-blue-600">LocalStorage:</strong>{' '}
              <span className="text-gray-600">
                {localStorage.getItem('auth-storage') || 'Empty'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
};

export default DebugPage;
