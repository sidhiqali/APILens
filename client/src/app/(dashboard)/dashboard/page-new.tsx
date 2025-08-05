'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  ExternalLink,
  Settings,
  Trash2,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import {
  useDashboardStats,
  useApis,
  useToggleApiStatus,
  useDeleteApi,
  useCheckApi,
} from '@/hooks/useApis';
import { formatDistanceToNow } from 'date-fns';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();

  // Fetch APIs list
  const {
    data: apisData,
    isLoading: apisLoading,
    error: apisError,
  } = useApis({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: filterStatus,
  });

  // Mutations
  const toggleStatusMutation = useToggleApiStatus();
  const deleteApiMutation = useDeleteApi();
  const checkApiMutation = useCheckApi();

  // Handle actions
  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const handleDeleteApi = (id: string) => {
    if (window.confirm('Are you sure you want to delete this API?')) {
      deleteApiMutation.mutate(id);
    }
  };

  const handleCheckNow = (id: string) => {
    checkApiMutation.mutate(id);
  };

  // Get stats with fallback to default values
  const stats = statsData
    ? statsData
    : {
        totalApis: 0,
        activeApis: 0,
        totalChanges: 0,
        criticalIssues: 0,
        healthyApis: 0,
        unhealthyApis: 0,
        totalNotifications: 0,
        unreadNotifications: 0,
        recentNotifications: 0,
        avgResponseTime: 0,
        uptimePercentage: 0,
      };

  // Get APIs list with fallback
  const apis = apisData?.success ? apisData.data : [];
  const pagination = apisData?.pagination || {
    page: 1,
    limit: itemsPerPage,
    total: 0,
    totalPages: 1,
  };

  const getStatusColor = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      case 'checking':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'unhealthy':
        return <AlertTriangle className="w-4 h-4" />;
      case 'checking':
        return <Clock className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Monitor your APIs and track changes
              </p>
            </div>
            <Link
              href="/add-api"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add API
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total APIs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats.totalApis}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active APIs
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {statsLoading ? '...' : stats.activeApis}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Changes
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {statsLoading ? '...' : stats.totalChanges}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Critical Issues
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {statsLoading ? '...' : stats.criticalIssues}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search APIs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as 'all' | 'active' | 'inactive'
                    )
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* APIs List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your APIs</h2>
            </div>

            {/* Loading State */}
            {apisLoading && (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading APIs...</p>
              </div>
            )}

            {/* Error State */}
            {apisError && (
              <div className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-600">Failed to load APIs</p>
              </div>
            )}

            {/* Empty State */}
            {!apisLoading && !apisError && apis && apis.length === 0 && (
              <div className="p-6 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No APIs found
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by adding your first API to monitor.
                </p>
                <Link
                  href="/add-api"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First API
                </Link>
              </div>
            )}

            {/* APIs Table */}
            {!apisLoading && !apisError && apis && apis.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        API Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Checked
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Changes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apis.map((api: any) => (
                      <tr key={api._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {api.apiName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {api.type} {api.version && `• ${api.version}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              api.healthStatus
                            )}`}
                          >
                            {getStatusIcon(api.healthStatus)}
                            <span className="ml-1 capitalize">
                              {api.healthStatus}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {api.lastChecked
                            ? formatDistanceToNow(new Date(api.lastChecked), {
                                addSuffix: true,
                              })
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {api.changeCount || 0} changes
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCheckNow(api._id)}
                              disabled={checkApiMutation.isPending}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              title="Check now"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(api._id)}
                              disabled={toggleStatusMutation.isPending}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title={
                                api.isActive
                                  ? 'Pause monitoring'
                                  : 'Resume monitoring'
                              }
                            >
                              {api.isActive ? (
                                <PauseCircle className="w-4 h-4" />
                              ) : (
                                <PlayCircle className="w-4 h-4" />
                              )}
                            </button>
                            <Link
                              href={`/apis/${api._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/apis/${api._id}/settings`}
                              className="text-gray-600 hover:text-gray-900"
                              title="Settings"
                            >
                              <Settings className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteApi(api._id)}
                              disabled={deleteApiMutation.isPending}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Delete API"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!apisLoading &&
              !apisError &&
              apis &&
              apis.length > 0 &&
              pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{' '}
                      of {pagination.total} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </Layout>
    </RouteGuard>
  );
};

export default DashboardPage;
