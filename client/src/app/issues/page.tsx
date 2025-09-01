'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import { useDashboardStats, useApis } from '@/hooks/useApis';
import {
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  ExternalLink,
  Filter,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const IssuesPage = () => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'health' | 'performance'>('all');
  
  const { data: statsData } = useDashboardStats();
  const { data: apisData, isLoading: apisLoading, refetch } = useApis({});

  const stats = statsData || {
    totalApis: 0,
    activeApis: 0,
    healthyApis: 0,
    unhealthyApis: 0,
    criticalIssues: 0,
    totalChanges: 0,
  };

  const allApis = apisData || [];

  const unhealthyApis = allApis.filter((api: any) => 
    api.healthStatus && !['healthy', 'checking'].includes(api.healthStatus)
  );

  const criticalApis = allApis.filter((api: any) => 
    api.healthStatus === 'error' || api.changeCount > 5
  );

  const performanceApis = allApis.filter((api: any) => 
    api.healthStatus === 'unhealthy' || api.healthStatus === 'degraded'
  );

  const getFilteredIssues = () => {
    switch (filter) {
      case 'critical':
        return criticalApis;
      case 'health':
        return unhealthyApis;
      case 'performance':
        return performanceApis;
      default:
        return [...criticalApis, ...unhealthyApis, ...performanceApis]
          .filter((api, index, arr) => 
            arr.findIndex(a => a.id === api.id) === index
          );
    }
  };

  const filteredIssues = getFilteredIssues();

  const getIssueType = (api: any) => {
    if (api.healthStatus === 'error') return 'critical';
    if (api.changeCount > 5) return 'critical';
    if (api.healthStatus === 'unhealthy') return 'health';
    if (api.healthStatus === 'degraded') return 'performance';
    return 'warning';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'health':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'performance':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getIssueDescription = (api: any) => {
    if (api.healthStatus === 'error') {
      return 'API is experiencing critical errors and is unavailable';
    }
    if (api.healthStatus === 'unhealthy') {
      return 'API health checks are failing';
    }
    if (api.healthStatus === 'degraded') {
      return 'API performance is degraded';
    }
    if (api.changeCount > 5) {
      return `High change frequency detected (${api.changeCount} changes)`;
    }
    return 'API requires attention';
  };

  const getIssueSeverity = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'health':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'performance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Issues & Alerts</h1>
              <p className="text-gray-600">
                Monitor critical issues, health problems, and performance alerts
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
                View All APIs
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Issues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredIssues.length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">
                    {criticalApis.length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unhealthy APIs</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.unhealthyApis}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Healthy APIs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.healthyApis}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8 px-6">
                {[
                  { id: 'all', label: 'All Issues', count: filteredIssues.length },
                  { id: 'critical', label: 'Critical', count: criticalApis.length },
                  { id: 'health', label: 'Health Issues', count: unhealthyApis.length },
                  { id: 'performance', label: 'Performance', count: performanceApis.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      filter === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {apisLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading issues...</p>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Issues Found
                  </h3>
                  <p className="text-gray-600">
                    {filter === 'all' 
                      ? 'All your APIs are healthy and performing well!'
                      : `No ${filter} issues detected.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIssues.map((api: any) => {
                    const issueType = getIssueType(api);
                    return (
                      <div
                        key={api.id}
                        className={`p-4 rounded-lg border-l-4 ${getIssueSeverity(issueType)} bg-white border border-gray-200`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getIssueIcon(issueType)}
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {api.apiName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {getIssueDescription(api)}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Status: {api.healthStatus}</span>
                                <span>Changes: {api.changeCount || 0}</span>
                                <span>
                                  Last checked: {
                                    api.lastChecked
                                      ? formatDistanceToNow(new Date(api.lastChecked), { addSuffix: true })
                                      : 'Never'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getIssueSeverity(issueType)}`}>
                              {issueType.toUpperCase()}
                            </span>
                            <Link
                              href={`/apis/${api.id}?highlight=issues`}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </RouteGuard>
  );
};

export default IssuesPage;
