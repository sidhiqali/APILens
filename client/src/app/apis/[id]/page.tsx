'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import { apiService } from '@/services/api.service';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Settings,
  Trash2,
  Edit,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const ApiDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: apiResponse,
    isLoading: apiLoading,
    error: apiError,
  } = useQuery({
    queryKey: ['api', params.id],
    queryFn: () => apiService.getApiById(params.id),
  });

  const deleteApiMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      router.push('/dashboard');
    },
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const api = apiResponse?.data;

  const handleDelete = async () => {
    try {
      await deleteApiMutation.mutateAsync(params.id);
    } catch (error) {
      console.error('Failed to delete API:', error);
    }
  };

  const handleEdit = () => {
    router.push(`/add-api?edit=${params.id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (apiLoading) {
    return (
      <RouteGuard requireAuth={true}>
        <Layout>
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  if (apiError || !api) {
    return (
      <RouteGuard requireAuth={true}>
        <Layout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                API Not Found
              </h2>
              <p className="mb-4 text-gray-600">
                The API you're looking for doesn't exist or you don't have
                access to it.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="p-6 mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {api.apiName}
                </h1>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    {getStatusIcon(api.healthStatus)}
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(api.healthStatus)}`}
                    >
                      {api.healthStatus || 'Unknown'}
                    </span>
                  </div>
                  <a
                    href={api.openApiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View OpenAPI
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'changes', label: 'Changes', icon: TrendingUp },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Info */}
              <div className="space-y-6 lg:col-span-2">
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold">
                    API Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        API Name
                      </label>
                      <p className="text-gray-900">{api.apiName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Check Frequency
                      </label>
                      <p className="text-gray-900">
                        {api.checkFrequency} minutes
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">
                        OpenAPI URL
                      </label>
                      <p className="text-gray-900 break-all">
                        {api.openApiUrl}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Created
                      </label>
                      <p className="text-gray-900">
                        {api.createdAt
                          ? new Date(api.createdAt).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Last Updated
                      </label>
                      <p className="text-gray-900">
                        {api.updatedAt
                          ? new Date(api.updatedAt).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Changes */}
                <div className="bg-white border rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Recent Changes</h3>
                  </div>
                  <div className="p-6">
                    <p className="py-8 text-center text-gray-500">
                      No changes detected yet. Changes will appear here once
                      monitoring begins.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Health Status */}
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold">Health Status</h3>
                  <div className="flex items-center justify-center py-6">
                    {getStatusIcon(api.healthStatus)}
                    <span className="ml-3 text-lg font-medium">
                      {api.healthStatus || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {api.tags && api.tags.length > 0 && (
                  <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {api.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded hover:bg-gray-50">
                      Force Check Now
                    </button>
                    <button className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded hover:bg-gray-50">
                      Download Report
                    </button>
                    <button className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded hover:bg-gray-50">
                      Export Changelog
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Change History</h3>
              </div>
              <div className="p-6">
                <div className="py-12 text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h4 className="mb-2 text-lg font-medium text-gray-900">
                    No Changes Yet
                  </h4>
                  <p className="mb-4 text-gray-600">
                    This API hasn't been monitored long enough to detect
                    changes. Check back later to see the change history.
                  </p>
                  <p className="text-sm text-gray-500">
                    Monitoring frequency: Every {api.checkFrequency} minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-6 text-lg font-semibold">API Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    API Name
                  </label>
                  <input
                    type="text"
                    defaultValue={api.apiName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    OpenAPI URL
                  </label>
                  <input
                    type="url"
                    defaultValue={api.openApiUrl}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Check Frequency (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={api.checkFrequency}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    defaultValue={api.tags?.join(', ')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. production, user-api, v2"
                  />
                </div>
                <div className="pt-4">
                  <button className="px-4 py-2 mr-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Save Changes
                  </button>
                  <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Delete API
              </h3>
              <p className="mb-6 text-gray-600">
                Are you sure you want to delete "{api.apiName}"? This action
                cannot be undone and will remove all associated monitoring data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteApiMutation.isPending}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteApiMutation.isPending ? (
                    <>
                      <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </RouteGuard>
  );
};

export default ApiDetailPage;
