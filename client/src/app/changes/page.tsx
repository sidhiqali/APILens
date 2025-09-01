'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import { useChangelogs } from '@/hooks/useChangelogs';
import {
  Clock,
  Activity,
  ExternalLink,
  Filter,
  RefreshCw,
  GitCommit,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  ChevronDown,
  Search,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { clsx } from 'clsx';

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type TypeFilter = 'all' | 'breaking' | 'addition' | 'modification' | 'deprecation';

const ChangesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filterParams = {
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    ...(severityFilter !== 'all' && { severity: severityFilter }),
    ...(typeFilter !== 'all' && { type: typeFilter }),
    ...(dateFilter !== 'all' && { 
      days: dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90 
    }),
  };

  const {
    data: changesData,
    isLoading,
    isError,
    refetch,
  } = useChangelogs(filterParams);

  const changes = changesData?.changes || [];
  const totalChanges = changesData?.total || 0;
  const totalPages = Math.ceil(totalChanges / itemsPerPage);

  const formatChangeType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'breaking':
        return 'bg-red-100 text-red-800';
      case 'addition':
        return 'bg-green-100 text-green-800';
      case 'modification':
        return 'bg-blue-100 text-blue-800';
      case 'deprecation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isError) {
    return (
      <RouteGuard requireAuth={true}>
        <Layout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Failed to load changes
              </h2>
              <p className="text-gray-600">
                Please try refreshing the page or contact support if the issue persists.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Changes</h1>
              <p className="text-gray-600">
                Track all changes across your APIs with detailed history
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <Link
                href="/apis"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Activity className="w-4 h-4 mr-2" />
                View APIs
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Changes</p>
                  <p className="text-2xl font-bold text-gray-900">{totalChanges}</p>
                </div>
                <GitCommit className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Showing</p>
                  <p className="text-2xl font-bold text-gray-900">{changes.length}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Page</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentPage} of {totalPages || 1}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Filtered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {severityFilter !== 'all' || typeFilter !== 'all' || searchTerm ? 'Yes' : 'No'}
                  </p>
                </div>
                <Filter className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {totalChanges} change{totalChanges !== 1 ? 's' : ''} found
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={clsx('w-4 h-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search changes, APIs, endpoints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                />
              </div>

              {showFilters && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Severity
                      </label>
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Change Type
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="breaking">Breaking Changes</option>
                        <option value="addition">Additions</option>
                        <option value="modification">Modifications</option>
                        <option value="deprecation">Deprecations</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Time Period
                      </label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Time</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSeverityFilter('all');
                          setTypeFilter('all');
                          setDateFilter('all');
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading changes...</span>
              </div>
            ) : changes.length === 0 ? (
              <div className="py-12 text-center">
                <GitCommit className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No changes found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || severityFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your filters to see more changes.'
                    : 'No API changes have been detected yet. Changes will appear here when your APIs are updated.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {changes.map((change: any) => (
                  <div key={change.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getSeverityIcon(change.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2 space-x-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {change.apiName || 'Unknown API'}
                              </h3>
                              <span className={clsx(
                                'px-2 py-1 text-xs font-medium rounded-full border',
                                getSeverityColor(change.severity)
                              )}>
                                {change.severity}
                              </span>
                              <span className={clsx(
                                'px-2 py-1 text-xs font-medium rounded-full',
                                getChangeTypeColor(change.changeType)
                              )}>
                                {formatChangeType(change.changeType)}
                              </span>
                            </div>
                            <p className="mb-3 text-gray-600">
                              {change.description || `${change.changes?.length || 0} changes detected`}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{formatDistanceToNow(new Date(change.detectedAt), { addSuffix: true })}</span>
                              <span>{format(new Date(change.detectedAt), 'MMM d, yyyy HH:mm')}</span>
                              {change.changes && (
                                <span>{change.changes.length} modification{change.changes.length !== 1 ? 's' : ''}</span>
                              )}
                              {change.version && <span>Version {change.version}</span>}
                            </div>
                          </div>
                          <div className="flex items-center ml-4 space-x-2">
                            <Link
                              href={`/apis/${change.apiId}?change=${change.id}`}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalChanges)} of {totalChanges} changes
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
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

export default ChangesPage;
