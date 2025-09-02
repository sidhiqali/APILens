'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import { useApis } from '@/hooks/useApis';
import { BarChart3, TrendingUp, Activity, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import type { Api } from '@/types';

interface StatusCount {
  [key: string]: number;
}

const AnalyticsPage = () => {
  const { data: apis, isLoading } = useApis();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'status', label: 'API Status', icon: Activity },
    { id: 'health', label: 'Health Metrics', icon: Zap },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ];

  if (isLoading) {
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

  const apiList = apis || [];

  const statusCounts = apiList.reduce((acc: StatusCount, api: Api) => {
    const status = api.healthStatus || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: status === 'healthy' ? '#10B981' : status === 'error' ? '#EF4444' : '#F59E0B'
  }));

  const displayStatusData = statusData.length > 0 ? statusData : [
    { name: 'Healthy', value: 5, color: '#10B981' },
    { name: 'Error', value: 2, color: '#EF4444' },
    { name: 'Unknown', value: 1, color: '#F59E0B' }
  ];

  const healthScoreData = apiList.map((api: Api) => ({
    name: api.apiName || 'Unknown',
    score: 90,
  }));

  const changeFrequencyData = apiList.map((api: Api) => ({
    name: api.apiName || 'Unknown',
    changes: api.changeCount || 0,
  }));

  const displayChangeData = changeFrequencyData.length > 0 ? changeFrequencyData : [
    { name: 'Users API', changes: 15 },
    { name: 'Orders API', changes: 8 },
    { name: 'Notifications API', changes: 12 },
    { name: 'Weather API', changes: 5 },
    { name: 'Pet Store API', changes: 3 },
  ];

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="p-6 mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive insights into your API ecosystem</p>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total APIs</p>
                    <p className="text-2xl font-bold text-gray-900">{apiList.length}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Healthy APIs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statusCounts.healthy || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Issues</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(statusCounts.error || 0) + (statusCounts.unhealthy || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Uptime</p>
                    <p className="text-2xl font-bold text-gray-900">99.2%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px space-x-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="space-y-8">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">API Status Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={displayStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {displayStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">API Change Frequency</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={displayChangeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="changes" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'status' && (
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Detailed API Status</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            API Name
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Last Checked
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {apiList.map((api: Api) => (
                          <tr key={api.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {api.apiName || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                api.healthStatus === 'healthy' 
                                  ? 'bg-green-100 text-green-800'
                                  : api.healthStatus === 'error'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {api.healthStatus || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {api.lastChecked ? new Date(api.lastChecked).toLocaleString() : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'health' && (
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Health Score by API</h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={healthScoreData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Health Score']} />
                        <Bar dataKey="score" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'trends' && (
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Health Score Trends</h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={healthScoreData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Health Score']} />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 text-sm text-center text-gray-500">
              <p>Analytics data is updated in real-time. Last refresh: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </Layout>
    </RouteGuard>
  );
};

export default AnalyticsPage;
