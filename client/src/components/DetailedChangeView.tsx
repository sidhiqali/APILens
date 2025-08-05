'use client';

import React, { useState } from 'react';
import { useGetApiChanges } from '@/hooks/useChangelog';
import { Eye } from 'lucide-react';
// import DiffViewerModal from '../modals/DiffViewerModal';

const DetailedChangeView = ({ apiId }: { apiId: string }) => {
  const { data: changes, isLoading, isError } = useGetApiChanges(apiId);
  const [selectedChange, setSelectedChange] = useState<any>(null);

  if (isLoading)
    return <div className="p-4 text-center">Loading detailed changes...</div>;
  if (isError)
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load changes.
      </div>
    );
  if (!changes || changes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No detailed changes available.
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-red-400';
      case 'medium':
        return 'bg-yellow-400';
      case 'low':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <>
      <div className="space-y-4">
        {changes.map((change: any) => (
          <div
            key={change._id}
            className="p-4 border rounded-md hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span
                  className={`w-3 h-3 rounded-full ${getSeverityColor(change.severity)}`}
                ></span>
                <div>
                  <p className="font-mono text-sm">{change.path}</p>
                  <p className="text-xs text-gray-600">{change.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChange(change)}
                className="p-2 rounded-md hover:bg-gray-200"
              >
                <Eye size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {selectedChange &&
        {
          /*
                <DiffViewerModal
                    isOpen={!!selectedChange}
                    onClose={() => setSelectedChange(null)}
                    oldValue={selectedChange.oldValue}
                    newValue={selectedChange.newValue}
                    title={`Diff for ${selectedChange.path}`}
                />
                */
        }}
    </>
  );
};

export default DetailedChangeView;
