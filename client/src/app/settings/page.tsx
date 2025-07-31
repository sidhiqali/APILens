'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import { userService } from '@/services/user.service';
import { User, Mail, Key } from 'lucide-react';

const SettingsPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getUserProfile().then(
      (response) => {
        setUser(response.data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
      }
    );
  }, []);

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">
            Manage your account and notification preferences
          </p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User size={20} className="mr-2" />
                    Profile Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      defaultValue={user.username}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Key size={20} className="mr-2" />
                  API Keys
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Production Key
                      </span>
                      <button className="text-blue-600 text-sm">
                        Regenerate
                      </button>
                    </div>
                    <code className="text-xs text-gray-600">
                      {user.api_key}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SettingsPage;
