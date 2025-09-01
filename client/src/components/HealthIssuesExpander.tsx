'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { apiService } from '@/services/api.service';

interface HealthIssue {
  type: string;
  severity: string;
  title: string;
  description: string;
  suggestion?: string;
  affectedEndpoints?: string[];
  relatedChanges?: Array<{
    date: string;
    changeType: string;
    description: string;
  }>;
}

interface HealthIssuesData {
  apiId: string;
  apiName: string;
  healthStatus: string;
  issueCount: number;
  issues: HealthIssue[];
  lastChecked: string;
}

interface HealthIssuesExpanderProps {
  apiId: string;
  healthStatus: string;
  showTrigger?: boolean;
}

const getSeverityIcon = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'high':
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'border-red-200 bg-red-50';
    case 'high':
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    default:
      return 'border-blue-200 bg-blue-50';
  }
};

export function HealthIssuesExpander({ 
  apiId, 
  healthStatus, 
  showTrigger = true 
}: HealthIssuesExpanderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [issuesData, setIssuesData] = useState<HealthIssuesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldShowExpander = healthStatus && healthStatus !== 'healthy';

  const fetchHealthIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getApiHealthIssues(apiId);
      setIssuesData(data);
    } catch (err) {
      console.error('Failed to fetch health issues:', err);
      setError('Failed to load detailed health information');
    } finally {
      setLoading(false);
    }
  }, [apiId]);

  useEffect(() => {
    if (isExpanded && !issuesData && shouldShowExpander) {
      fetchHealthIssues();
    }
  }, [isExpanded, issuesData, shouldShowExpander, fetchHealthIssues]);

  if (!shouldShowExpander) {
    return null;
  }

  return (
    <div className="mt-4">
      {showTrigger && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 mr-2" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-2" />
          )}
          View Detailed Issues
          {issuesData && (
            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              {issuesData.issueCount}
            </span>
          )}
        </button>
      )}

      {isExpanded && (
        <div className="mt-3 border border-gray-200 rounded-lg bg-white">
          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-600">Loading issue details...</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {issuesData && !loading && !error && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">Health Issues</h4>
                  <div className="text-sm text-gray-500">
                    Last checked: {new Date(issuesData.lastChecked).toLocaleString()}
                  </div>
                </div>

                {issuesData.issues.length === 0 ? (
                  <div className="py-8 text-center">
                    <Info className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No specific issues detected</p>
                    <p className="text-xs text-gray-400 mt-1">
                      The API may have general health concerns but no detailed issues are available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issuesData.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg ${getSeverityColor(issue.severity)}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3 mt-0.5">
                            {getSeverityIcon(issue.severity)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              <h5 className="text-sm font-semibold text-gray-900">
                                {issue.title}
                              </h5>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                                issue.severity.toLowerCase() === 'critical' 
                                  ? 'bg-red-100 text-red-800'
                                  : issue.severity.toLowerCase() === 'high' || issue.severity.toLowerCase() === 'warning'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {issue.severity}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3">
                              {issue.description}
                            </p>

                            {issue.suggestion && (
                              <div className="mb-3 p-3 bg-white border border-gray-200 rounded">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Suggestion
                                </div>
                                <p className="text-sm text-gray-700">{issue.suggestion}</p>
                              </div>
                            )}

                            {issue.affectedEndpoints && issue.affectedEndpoints.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Affected Endpoints
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {issue.affectedEndpoints.map((endpoint, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border"
                                    >
                                      {endpoint}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {issue.relatedChanges && issue.relatedChanges.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Related Changes
                                </div>
                                <div className="space-y-2">
                                  {issue.relatedChanges.map((change, i) => (
                                    <div key={i} className="p-2 bg-white border border-gray-200 rounded">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-600">
                                          {change.changeType}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(change.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-700 mt-1">
                                        {change.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
