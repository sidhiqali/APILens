'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
} from 'lucide-react';

// Mock data for demonstration
const mockStats = {
  totalApis: 5,
  activeApis: 4,
  totalChanges: 12,
  criticalChanges: 2,
};

const mockApis = [
  {
    id: '1',
    name: 'User Management API',
    version: 'v2.1.0',
    status: 'active',
    lastCheck: '2025-01-31T08:00:00Z',
    changes: 3,
    criticalChanges: 1,
  },
  {
    id: '2',
    name: 'Payment Gateway API',
    version: 'v1.5.2',
    status: 'active',
    lastCheck: '2025-01-31T07:45:00Z',
    changes: 2,
    criticalChanges: 0,
  },
  {
    id: '3',
    name: 'Notification Service',
    version: 'v3.0.1',
    status: 'active',
    lastCheck: '2025-01-31T08:15:00Z',
    changes: 4,
    criticalChanges: 1,
  },
  {
    id: '4',
    name: 'Analytics API',
    version: 'v1.2.0',
    status: 'active',
    lastCheck: '2025-01-31T07:30:00Z',
    changes: 3,
    criticalChanges: 0,
  },
  {
    id: '5',
    name: 'Legacy API',
    version: 'v1.0.0',
    status: 'inactive',
    lastCheck: '2025-01-30T15:00:00Z',
    changes: 0,
    criticalChanges: 0,
  },
];

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = 'blue',
}: any) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredApis, setFilteredApis] = useState(mockApis);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = mockApis.filter(
      (api) =>
        api.name.toLowerCase().includes(term.toLowerCase()) ||
        api.version.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredApis(filtered);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Monitor your APIs and track changes</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} />
          <span>Add API</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Activity}
          title="Total APIs"
          value={mockStats.totalApis}
          subtitle="APIs monitored"
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          title="Active APIs"
          value={mockStats.activeApis}
          subtitle="Currently monitoring"
          color="green"
        />
        <StatCard
          icon={Clock}
          title="Total Changes"
          value={mockStats.totalChanges}
          subtitle="In the last 30 days"
          color="indigo"
        />
        <StatCard
          icon={AlertTriangle}
          title="Critical Changes"
          value={mockStats.criticalChanges}
          subtitle="Require attention"
          color="red"
        />
      </div>

      {/* APIs List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Your APIs</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search APIs..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {filteredApis.map((api) => (
              <div
                key={api.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-3 h-3 rounded-full ${api.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}`}
                  ></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{api.name}</h3>
                    <p className="text-sm text-gray-500">
                      Version {api.version}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {api.changes}
                    </p>
                    <p className="text-xs text-gray-500">Changes</p>
                  </div>

                  {api.criticalChanges > 0 && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle size={16} />
                      <span className="text-sm font-medium">
                        {api.criticalChanges}
                      </span>
                    </div>
                  )}

                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      Last checked:{' '}
                      {new Date(api.lastCheck).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(api.lastCheck).toLocaleDateString()}
                    </p>
                  </div>

                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredApis.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No APIs found matching your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
