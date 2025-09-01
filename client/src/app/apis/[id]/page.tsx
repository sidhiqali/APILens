'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import {
  useApi,
  useDeleteApi,
  useToggleApiStatus,
  useCheckApi,
} from '@/hooks/useApis';
import {
  useGetApiChanges,
  useGetApiIssues,
} from '@/hooks/useChangelog';
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

const ApiDetailPage = ({ params }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [id, setId] = useState<string>('');
  const [isParamsLoaded, setIsParamsLoaded] = useState(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
      setIsParamsLoaded(true);
    });
  }, [params]);

  const { data: api, isLoading: apiLoading, error: apiError } = useApi(id);
  const { data: apiChanges, isLoading: changesLoading } = useGetApiChanges(id);
  const { data: apiIssues, isLoading: issuesLoading } = useGetApiIssues(id);
  const deleteApiMutation = useDeleteApi();
  const toggleStatusMutation = useToggleApiStatus();
  const checkApiMutation = useCheckApi();

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const highlight = searchParams.get('highlight');
    const notificationId = searchParams.get('notification');
    
    if (tab && ['overview', 'changes', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (notificationId) {
      setActiveTab('changes');
      
      setTimeout(() => {
        const changesSection = document.getElementById('changes-section');
        if (changesSection) {
          changesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          changesSection.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            changesSection.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
        }
        
        const banner = document.createElement('div');
        banner.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50';
        banner.innerHTML = `
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            <span>Viewing API details from notification</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-blue-600 hover:text-blue-800">×</button>
          </div>
        `;
        document.body.appendChild(banner);
        
        setTimeout(() => {
          if (banner.parentElement) {
            banner.remove();
          }
        }, 5000);
      }, 500);
    }
    
    if (highlight === 'issues') {
      setActiveTab('overview');
      setTimeout(() => {
        const issuesSection = document.getElementById('issues-section');
        if (issuesSection) {
          issuesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          issuesSection.classList.add('ring-2', 'ring-red-500', 'ring-opacity-50');
          setTimeout(() => {
            issuesSection.classList.remove('ring-2', 'ring-red-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 500);
    }
  }, [searchParams]);

  if (!isParamsLoaded) {
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

  const handleDelete = async () => {
    try {
      await deleteApiMutation.mutateAsync(id);
      router.push('/apis');
    } catch (error) {
      console.error('Failed to delete API:', error);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await toggleStatusMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to toggle API status:', error);
    }
  };

  const handleCheckNow = async () => {
    try {
      await checkApiMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to check API:', error);
    }
  };

  const handleEdit = () => {
    router.push(`/add-api?edit=${id}`);
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

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
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

                <div className="bg-white border rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Changes</h3>
                  </div>
                  <div className="p-6">
                    {changesLoading ? (
                      <div className="py-8 text-center">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-gray-400" />
                        <p className="text-gray-500">Loading changes...</p>
                      </div>
                    ) : apiChanges && apiChanges.length > 0 ? (
                      <div className="space-y-4">
                        {apiChanges.slice(0, 5).map((change: any, index: number) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {change.type || 'Schema Change'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {change.description || 'API schema has been updated'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {change.timestamp ? new Date(change.timestamp).toLocaleString() : 'Recently'}
                              </p>
                            </div>
                          </div>
                        ))}
                        {apiChanges.length > 5 && (
                          <button 
                            onClick={() => setActiveTab('changes')}
                            className="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            View all {apiChanges.length} changes
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-gray-500">
                        No changes detected yet. Changes will appear here once
                        monitoring begins.
                      </p>
                    )}
                  </div>
                </div>

                <div id="issues-section" className="bg-white border rounded-lg shadow-sm transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Active Issues</h3>
                  </div>
                  <div className="p-6">
                    {issuesLoading ? (
                      <div className="py-8 text-center">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-gray-400" />
                        <p className="text-gray-500">Loading issues...</p>
                      </div>
                    ) : apiIssues && apiIssues.length > 0 ? (
                      <div className="space-y-4">
                        {apiIssues.map((issue: any) => (
                          <div key={issue.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    issue.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                    issue.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                    issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {issue.severity}
                                  </span>
                                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                    {issue.type}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    issue.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {issue.status}
                                  </span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                  {issue.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {issue.description}
                                </p>
                                <div className="text-xs text-gray-500">
                                  <span>Affected: {Array.isArray(issue.affectedEndpoints) ? issue.affectedEndpoints.join(', ') : issue.affectedEndpoints}</span>
                                  <span className="mx-2">•</span>
                                  <span>{new Date(issue.timestamp).toLocaleString()}</span>
                                </div>
                              </div>
                              {issue.severity === 'Critical' && (
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">No Active Issues</h4>
                        <p className="text-sm text-gray-500">
                          This API is running smoothly with no detected issues.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Health Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-4">
                      {getStatusIcon(api.healthStatus)}
                      <span className="ml-3 text-lg font-medium text-gray-900">
                        {api.healthStatus || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Check:</span>
                          <span className="text-gray-900">
                            {api.lastChecked ? new Date(api.lastChecked).toLocaleString() : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Check Frequency:</span>
                          <span className="text-gray-900">{api.checkFrequency} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className={`font-medium ${
                            api.isActive ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {api.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {api.healthStatus && api.healthStatus !== 'healthy' && (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          {api.healthStatus === 'error' && 'The API health endpoint is returning error responses. This may indicate service unavailability or critical issues.'}
                          {api.healthStatus === 'degraded' && 'The API is experiencing performance issues. Response times may be slower than normal.'}
                          {api.healthStatus === 'unhealthy' && 'The API is reporting an unhealthy status. Some functionality may be impaired.'}
                          {api.healthStatus === 'warning' && 'The API has minor issues that should be monitored.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {api.tags && api.tags.length > 0 && (
                  <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Tags</h3>
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

                <div className="p-6 bg-white border rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={handleCheckNow}
                      disabled={checkApiMutation.isPending}
                      className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      {checkApiMutation.isPending ? 'Checking...' : 'Force Check Now'}
                    </button>
                    <button 
                      onClick={handleToggleStatus}
                      disabled={toggleStatusMutation.isPending}
                      className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      {api?.isActive ? 'Pause Monitoring' : 'Resume Monitoring'}
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="p-4 bg-white border rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Changes</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {apiChanges ? apiChanges.length : 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white border rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Breaking Changes</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {apiChanges ? apiChanges.filter((c: any) => c.breaking).length : 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white border rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Last 7 Days</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {apiChanges ? 
                          apiChanges.filter((c: any) => 
                            new Date(c.timestamp || c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ).length : 0
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div id="changes-section" className="bg-white border rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Change History</h3>
                </div>
                <div className="p-6">
                  {changesLoading ? (
                    <div className="py-12 text-center">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
                      <p className="text-gray-500">Loading change history...</p>
                    </div>
                  ) : apiChanges && apiChanges.length > 0 ? (
                    <div className="space-y-6">
                      {apiChanges.map((change: any, index: number) => (
                        <div key={index} className="relative">
                          {index !== apiChanges.length - 1 && (
                            <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200" />
                          )}
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                change.breaking ? 'bg-red-100' : 'bg-blue-100'
                              }`}>
                                {change.breaking ? (
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <Activity className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {change.type || 'Schema Change'}
                                </h4>
                                {change.breaking && (
                                  <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                                    Breaking
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {change.timestamp ? new Date(change.timestamp).toLocaleString() : 
                                   change.createdAt ? new Date(change.createdAt).toLocaleString() : 'Unknown time'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                {change.description || 'API schema has been updated with new changes.'}
                              </p>
                              {change.details && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <h5 className="text-xs font-medium text-gray-700 mb-2">Change Details:</h5>
                                  <div className="space-y-1">
                                    {Array.isArray(change.details) ? 
                                      change.details.map((detail: string, i: number) => (
                                        <p key={i} className="text-xs text-gray-600">• {detail}</p>
                                      )) :
                                      <p className="text-xs text-gray-600">{change.details}</p>
                                    }
                                  </div>
                                </div>
                              )}
                              {change.affectedEndpoints && change.affectedEndpoints.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-gray-500">Affected endpoints: </span>
                                  <span className="text-xs text-gray-600">
                                    {change.affectedEndpoints.slice(0, 3).join(', ')}
                                    {change.affectedEndpoints.length > 3 && ` +${change.affectedEndpoints.length - 3} more`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-6 text-lg font-semibold text-gray-900">API Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    API Name
                  </label>
                  <input
                    type="text"
                    defaultValue={api.apiName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    OpenAPI URL
                  </label>
                  <input
                    type="url"
                    defaultValue={api.openApiUrl}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    defaultValue={api.tags?.join(', ')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
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
