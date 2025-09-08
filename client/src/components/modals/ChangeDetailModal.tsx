'use client';

import React from 'react';
import { X, AlertTriangle, Plus, Minus, Edit, Code, FileText, Settings } from 'lucide-react';

interface ChangeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  change: any;
}

export const ChangeDetailModal: React.FC<ChangeDetailModalProps> = ({
  isOpen,
  onClose,
  change,
}) => {
  if (!isOpen || !change) return null;

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added': return <Plus className="w-4 h-4 text-green-600" />;
      case 'removed': return <Minus className="w-4 h-4 text-red-600" />;
      case 'modified': return <Edit className="w-4 h-4 text-blue-600" />;
      default: return <Edit className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPathIcon = (path: string) => {
    if (path.includes('paths.')) return <Code className="w-4 h-4 text-purple-600" />;
    if (path.includes('components.schemas.')) return <FileText className="w-4 h-4 text-blue-600" />;
    if (path.includes('info.')) return <Settings className="w-4 h-4 text-gray-600" />;
    return <Edit className="w-4 h-4 text-gray-600" />;
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const formatPath = (path: string) => {
    // Make paths more readable
    return path
      .replace('components.schemas.', 'Schema: ')
      .replace('paths.', 'Endpoint: ')
      .replace('info.', 'API Info: ')
      .replace('.parameters.', ' → Parameter: ')
      .replace('.responses.', ' → Response: ')
      .replace('.get', ' [GET]')
      .replace('.post', ' [POST]')
      .replace('.put', ' [PUT]')
      .replace('.patch', ' [PATCH]')
      .replace('.delete', ' [DELETE]');
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

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'breaking':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'addition':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'deprecation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'non-breaking':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Change Details</h2>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getSeverityColor(change.severity)}`}>
                {change.severity} severity
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getChangeTypeColor(change.changeType)}`}>
                {change.changeType}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(change.detectedAt || change.createdAt || change.timestamp).toLocaleString()}
              </span>
            </div>
            {change.summary && (
              <p className="text-gray-700 mt-2">{change.summary}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {change.changes && change.changes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Detailed Changes ({change.changes.length})
              </h3>
              
              {change.changes.map((detail: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getChangeIcon(detail.changeType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getPathIcon(detail.path)}
                            <h4 className="font-medium text-gray-900">{formatPath(detail.path)}</h4>
                          </div>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            detail.changeType === 'added' ? 'bg-green-100 text-green-800' :
                            detail.changeType === 'removed' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {detail.changeType}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{detail.description}</p>
                      
                      {/* Show value changes */}
                      <div className="space-y-3">
                        {detail.changeType === 'modified' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {detail.oldValue !== undefined && detail.oldValue !== null && (
                              <div>
                                <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                                  <Minus className="w-4 h-4 mr-1" />
                                  Before
                                </h5>
                                <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800 overflow-x-auto max-h-40">
                                  {formatValue(detail.oldValue)}
                                </pre>
                              </div>
                            )}
                            {detail.newValue !== undefined && detail.newValue !== null && (
                              <div>
                                <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                                  <Plus className="w-4 h-4 mr-1" />
                                  After
                                </h5>
                                <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800 overflow-x-auto max-h-40">
                                  {formatValue(detail.newValue)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {detail.changeType === 'added' && detail.newValue !== undefined && detail.newValue !== null && (
                          <div>
                            <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                              <Plus className="w-4 h-4 mr-1" />
                              Added Value
                            </h5>
                            <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800 overflow-x-auto max-h-40">
                              {formatValue(detail.newValue)}
                            </pre>
                          </div>
                        )}
                        
                        {detail.changeType === 'removed' && detail.oldValue !== undefined && detail.oldValue !== null && (
                          <div>
                            <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                              <Minus className="w-4 h-4 mr-1" />
                              Removed Value
                            </h5>
                            <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800 overflow-x-auto max-h-40">
                              {formatValue(detail.oldValue)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Detailed Changes Available</h3>
              <p className="text-gray-600">
                This change record doesn't contain detailed change information. This might be from an older version
                of the system or the change was recorded without detailed tracking.
              </p>
            </div>
          )}

          {/* Additional Information */}
          {(change.fromVersion || change.toVersion) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Version Information</h4>
              <div className="text-sm text-blue-800">
                {change.fromVersion && <span>From: <code className="bg-blue-100 px-1 rounded">{change.fromVersion}</code></span>}
                {change.fromVersion && change.toVersion && <span className="mx-2">→</span>}
                {change.toVersion && <span>To: <code className="bg-blue-100 px-1 rounded">{change.toVersion}</code></span>}
              </div>
            </div>
          )}

          {change.impactScore !== undefined && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Impact Assessment</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Impact Score:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  change.impactScore >= 80 ? 'bg-red-100 text-red-800' :
                  change.impactScore >= 60 ? 'bg-orange-100 text-orange-800' :
                  change.impactScore >= 30 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {change.impactScore}/100
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
