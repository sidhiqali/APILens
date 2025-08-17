'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import FilterPanel, { FilterGroup, FilterState } from '@/components/search/FilterPanel';
import { useApis, useDeleteApi, useToggleApiStatus, useCheckApi, apiQueryKeys } from '@/hooks/useApis';
import { useWebSocket } from '@/providers/WebSocketProvider';
import {
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  Eye,
  Settings,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';

const APIsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedApis, setSelectedApis] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [additionalFilters, setAdditionalFilters] = useState<FilterState>({});

  // Initialize filters from URL parameters
  useEffect(() => {
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    if (status && ['all', 'active', 'inactive'].includes(status)) {
      setStatusFilter(status as 'all' | 'active' | 'inactive');
    }
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const { data: apis = [], isLoading } = useApis({
    search: searchTerm,
    status: statusFilter,
  });

  const deleteApiMutation = useDeleteApi();
  const toggleStatusMutation = useToggleApiStatus();
  const checkApiMutation = useCheckApi();

  // Set up real-time updates via WebSocket
  useEffect(() => {
    const unsubscribe = subscribe('api_status_changed', (data: any) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.detail(data.apiId) });
    });

    const unsubscribeApiUpdated = subscribe('api_updated', (data: any) => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.detail(data.apiId) });
    });

    const unsubscribeApiDeleted = subscribe('api_deleted', (data: any) => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
      queryClient.removeQueries({ queryKey: apiQueryKeys.detail(data.apiId) });
    });

    return () => {
      unsubscribe();
      unsubscribeApiUpdated();
      unsubscribeApiDeleted();
    };
  }, [subscribe, queryClient]);

  const getStatusIcon = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Pause className="w-4 h-4 text-gray-400" />;
    }
    
    switch (status?.toLowerCase()) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string, isActive: boolean) => {
    if (!isActive) {
      return 'bg-gray-100 text-gray-600';
    }
    
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleSelectApi = (apiId: string) => {
    setSelectedApis(prev =>
      prev.includes(apiId)
        ? prev.filter(id => id !== apiId)
        : [...prev, apiId]
    );
  };

  const handleSelectAll = () => {
    if (selectedApis.length === apis.length) {
      setSelectedApis([]);
    } else {
      setSelectedApis(apis.map(api => api.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    // TODO: Implement bulk actions
    console.log(`Bulk ${action} for APIs:`, selectedApis);
  };

  // Get unique values for filter options
  const allTags = Array.from(new Set(apis.flatMap(api => api.tags || [])));
  const allHealthStatuses = Array.from(new Set(apis.map(api => api.healthStatus).filter(Boolean)));
  const allCheckFrequencies = Array.from(new Set(apis.map(api => api.checkFrequency).filter(Boolean)));

  // Filter configuration
  const filterGroups: FilterGroup[] = [
    {
      id: 'healthStatus',
      label: 'Health Status',
      type: 'checkbox',
      options: allHealthStatuses.map(status => ({
        id: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
        count: apis.filter(api => api.healthStatus === status).length
      }))
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'checkbox',
      options: allTags.map(tag => ({
        id: tag,
        label: tag,
        value: tag,
        count: apis.filter(api => api.tags?.includes(tag)).length
      }))
    },
    {
      id: 'checkFrequency',
      label: 'Check Frequency',
      type: 'radio',
      options: allCheckFrequencies.map(freq => ({
        id: freq,
        label: freq,
        value: freq,
        count: apis.filter(api => api.checkFrequency === freq).length
      }))
    }
  ];

  const filteredApis = apis.filter(api => {
    const matchesSearch = !searchTerm || 
      api.apiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && api.isActive) ||
      (statusFilter === 'inactive' && !api.isActive);

    // Additional filters
    const matchesHealthStatus = !additionalFilters.healthStatus?.length || 
      additionalFilters.healthStatus.includes(api.healthStatus);
    
    const matchesTags = !additionalFilters.tags?.length || 
      additionalFilters.tags.some((tag: string) => api.tags?.includes(tag));
    
    const matchesCheckFrequency = !additionalFilters.checkFrequency || 
      api.checkFrequency === additionalFilters.checkFrequency;
    
    return matchesSearch && matchesStatus && matchesHealthStatus && matchesTags && matchesCheckFrequency;
  });

  const activeApis = filteredApis.filter(api => api.isActive);
  const inactiveApis = filteredApis.filter(api => !api.isActive);

  if (isLoading) {
    return (
      <RouteGuard requireAuth={true}>
        <Layout>
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  const ApiCard = ({ api, isInactive = false }: { api: any; isInactive?: boolean }) => (
    <div className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${isInactive ? 'opacity-75' : ''}`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={selectedApis.includes(api.id)}
              onChange={() => handleSelectApi(api.id)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{api.apiName}</h3>
                {isInactive && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1 space-x-2">
                {getStatusIcon(api.healthStatus, api.isActive)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(api.healthStatus, api.isActive)}`}>
                  {api.isActive ? (api.healthStatus || 'Unknown') : 'Paused'}
                </span>
                <span className="text-sm text-gray-500">
                  Check: {api.checkFrequency}
                </span>
              </div>
              {api.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{api.description}</p>
              )}
              {api.tags && api.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {api.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {api.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                      +{api.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions Dropdown */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <MoreVertical className="w-4 h-4" />
            </button>
            {/* TODO: Add dropdown menu */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => toggleStatusMutation.mutate(api.id)}
              disabled={toggleStatusMutation.isPending}
              className={`flex items-center px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                api.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50'
              }`}
            >
              {toggleStatusMutation.isPending ? (
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              ) : api.isActive ? (
                <Pause className="w-3 h-3 mr-1" />
              ) : (
                <Play className="w-3 h-3 mr-1" />
              )}
              {api.isActive ? 'Pause' : 'Resume'}
            </button>
            
            {api.isActive && (
              <button
                onClick={() => checkApiMutation.mutate(api.id)}
                disabled={checkApiMutation.isPending}
                className="flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${checkApiMutation.isPending ? 'animate-spin' : ''}`} />
                Check Now
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
            <button
              onClick={() => router.push(`/apis/${api.id}`)}
              className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 whitespace-nowrap"
              title="View Details"
            >
              <Eye className="w-3 h-3" />
            </button>
            <button
              onClick={() => router.push(`/apis/${api.id}?tab=settings`)}
              className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 whitespace-nowrap"
              title="Settings"
            >
              <Settings className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${api.apiName}"? This action cannot be undone.`)) {
                  deleteApiMutation.mutate(api.id);
                }
              }}
              disabled={deleteApiMutation.isPending}
              className="flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 disabled:opacity-50 whitespace-nowrap"
              title="Delete API"
            >
              {deleteApiMutation.isPending ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* API URL */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 truncate flex-1 pr-2">
              {api.openApiUrl}
            </span>
            <a
              href={api.openApiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="p-6 mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">APIs</h1>
              <p className="mt-1 text-gray-600">
                Manage and monitor your API endpoints
              </p>
            </div>
            <button
              onClick={() => router.push('/add-api')}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add API
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center justify-between mb-6 space-x-4">
            <div className="flex items-center flex-1 space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search APIs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 pr-8 min-w-[120px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedApis.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedApis.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('toggle')}
                  className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                >
                  Toggle Status
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mb-6">
              <FilterPanel
                filters={filterGroups}
                initialState={additionalFilters}
                onFiltersChange={setAdditionalFilters}
                onClearAll={() => setAdditionalFilters({})}
                title="Advanced Filters"
                className="bg-gray-50"
              />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total APIs</p>
                  <p className="text-lg font-semibold text-gray-900">{apis.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <Play className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-lg font-semibold text-gray-900">{activeApis.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <Pause className="w-8 h-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Inactive</p>
                  <p className="text-lg font-semibold text-gray-900">{inactiveApis.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Issues</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {apis.filter(api => api.healthStatus === 'error' || api.healthStatus === 'warning').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active APIs Section */}
          {activeApis.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Active APIs ({activeApis.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedApis.length === apis.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-600">Select All</label>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeApis.map((api) => (
                  <ApiCard key={api.id} api={api} />
                ))}
              </div>
            </div>
          )}

          {/* Inactive APIs Section */}
          {inactiveApis.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Inactive APIs ({inactiveApis.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {inactiveApis.map((api) => (
                  <ApiCard key={api.id} api={api} isInactive={true} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredApis.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No APIs found' : 'No APIs yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first API to monitor'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/add-api')}
                  className="inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First API
                </button>
              )}
            </div>
          )}
        </div>
      </Layout>
    </RouteGuard>
  );
};

export default APIsPage;
