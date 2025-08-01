'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import { useAuthHooks } from '@/hooks/useAuth';
import { User, Mail, Key, Save, Loader2 } from 'lucide-react';

const SettingsPage = () => {
  const { user, updateProfile, isUpdateProfilePending } = useAuthHooks();
  const [formData, setFormData] = useState({
    email: '',
    notificationPreferences: {
      email: true,
      breakingChanges: true,
      nonBreakingChanges: false,
      apiErrors: true,
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        notificationPreferences: user.notificationPreferences || {
          email: true,
          breakingChanges: true,
          nonBreakingChanges: false,
          apiErrors: true,
        },
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      email: formData.email,
      notificationPreferences: formData.notificationPreferences,
    });
  };

  const handleNotificationChange = (
    key: keyof typeof formData.notificationPreferences
  ) => {
    setFormData((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: !prev.notificationPreferences[key],
      },
    }));
  };

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600">
              Manage your account and notification preferences
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Information */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold flex items-center">
                      <User size={20} className="mr-2" />
                      Profile Information
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">
                      Notification Preferences
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose how you want to be notified about API changes
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email Notifications
                        </label>
                        <p className="text-xs text-gray-500">
                          Receive notifications via email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.notificationPreferences.email}
                          onChange={() => handleNotificationChange('email')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Breaking Changes
                        </label>
                        <p className="text-xs text-gray-500">
                          Notify about breaking changes in APIs
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            formData.notificationPreferences.breakingChanges
                          }
                          onChange={() =>
                            handleNotificationChange('breakingChanges')
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Non-Breaking Changes
                        </label>
                        <p className="text-xs text-gray-500">
                          Notify about non-breaking changes
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            formData.notificationPreferences.nonBreakingChanges
                          }
                          onChange={() =>
                            handleNotificationChange('nonBreakingChanges')
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          API Errors
                        </label>
                        <p className="text-xs text-gray-500">
                          Notify about API errors and failures
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.notificationPreferences.apiErrors}
                          onChange={() => handleNotificationChange('apiErrors')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* API Key */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Key size={20} className="mr-2" />
                    API Key
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          Personal API Key
                        </span>
                        <button
                          type="button"
                          className="text-blue-600 text-sm hover:text-blue-800"
                        >
                          Regenerate
                        </button>
                      </div>
                      <code className="text-xs text-gray-600 break-all">
                        {user?.api_key || 'Loading...'}
                      </code>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use this key to access the APILens API programmatically
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isUpdateProfilePending}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdateProfilePending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </Layout>
    </RouteGuard>
  );
};

export default SettingsPage;
