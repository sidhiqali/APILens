'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useParams } from 'next/navigation';

// Mock data for demonstration
const mockAPI = {
  name: 'User Management API',
  version: 'v2.1.0',
  openapi_url: 'https://api.example.com/docs'
};

const mockChangelogs = [
  {
    version: 'v2.1.0',
    timestamp: '2025-01-31T08:00:00Z',
    change_type: 'breaking',
    description: 'Removed deprecated /users/legacy endpoint. All clients must migrate to /users/v2'
  },
  {
    version: 'v2.0.5',
    timestamp: '2025-01-30T14:30:00Z',
    change_type: 'non-breaking',
    description: 'Added new optional field "avatar_url" to user profile response'
  },
  {
    version: 'v2.0.4',
    timestamp: '2025-01-29T16:45:00Z',
    change_type: 'non-breaking',
    description: 'Improved error messages for validation failures'
  },
  {
    version: 'v2.0.3',
    timestamp: '2025-01-28T10:15:00Z',
    change_type: 'breaking',
    description: 'Changed authentication from API key to OAuth 2.0'
  }
];

interface ChangelogItem {
  version: string;
  timestamp: string;
  change_type: string;
  description: string;
}

const APIDetailPage = () => {
  const [api, setApi] = useState<any>(null);
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    // Simulate API loading with mock data
    setTimeout(() => {
      setApi(mockAPI);
      setChangelogs(mockChangelogs);
      setLoading(false);
    }, 500);
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{api.name}</h2>
                <p className="text-gray-600">Version: {api.version}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Download size={16} />
                <span>Export Changes</span>
              </button>
              <a
                href={api.openapi_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ExternalLink size={16} />
                <span>View API Docs</span>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Version History</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {changelogs.map((log: ChangelogItem, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-4 p-4 border rounded-lg ${log.change_type === 'breaking' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                  >
                    {log.change_type === 'breaking' ? (
                      <AlertTriangle className="text-red-600 mt-1" size={16} />
                    ) : (
                      <CheckCircle className="text-green-600 mt-1" size={16} />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Version {log.version}
                        </h4>
                        <span className="text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p
                        className={`text-sm mt-1 ${log.change_type === 'breaking' ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        {log.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIDetailPage;
