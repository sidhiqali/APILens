
'use client';

import React, { useState } from 'react';
import { useGetApi, useDeleteApi, useUpdateApi, useCheckApiNow } from '@/hooks/useApis';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, ExternalLink, Trash2, Power, PowerOff, RefreshCw } from 'lucide-react';
import ChangelogTimeline from '@/components/ChangelogTimeline';
import DetailedChangeView from '@/components/DetailedChangeView';
import VersionComparisonView from '@/components/VersionComparisonView';
import { unparse } from 'papaparse';
import { useGetApiChanges } from '@/hooks/useChangelog';

const APIDetailPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const apiId = Array.isArray(id) ? id[0] : id;
    const [activeTab, setActiveTab] = useState('timeline');

    const { data: api, isLoading, isError } = useGetApi(apiId);
    const { data: detailedChanges } = useGetApiChanges(apiId);
    const deleteApiMutation = useDeleteApi();
    const updateApiMutation = useUpdateApi();
    const checkApiNowMutation = useCheckApiNow();

    if (isLoading) return <div className="p-6">Loading API details...</div>;
    if (isError) return <div className="p-6 text-red-500">Error loading API.</div>;

    const handleExport = () => {
        if (detailedChanges) {
            const csv = unparse(detailedChanges.map((c: any) => ({
                path: c.path,
                changeType: c.changeType,
                severity: c.severity,
                description: c.description,
                oldValue: JSON.stringify(c.oldValue),
                newValue: JSON.stringify(c.newValue),
            })));
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${api.apiName}-changes.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${api.healthStatus === 'healthy' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {api.healthStatus === 'healthy' ? <CheckCircle className="text-green-600" /> : <AlertTriangle className="text-red-600" />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{api.apiName}</h2>
                        <p className="text-gray-600">Version: {api.version}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        Export CSV
                    </button>
                    <button onClick={() => checkApiNowMutation.mutate(apiId)} disabled={checkApiNowMutation.isPending} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <RefreshCw size={16} className={checkApiNowMutation.isPending ? 'animate-spin' : ''} />
                        <span>Check Now</span>
                    </button>
                    <a href={api.openApiUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <ExternalLink size={16} />
                        <span>API Docs</span>
                    </a>
                    <button onClick={() => updateApiMutation.mutate({ id: apiId, isActive: !api.isActive })} className={`flex items-center space-x-2 px-4 py-2 border rounded-md ${api.isActive ? 'border-gray-300 hover:bg-gray-50' : 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100'}`}>
                        {api.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                        <span>{api.isActive ? 'Disable' : 'Enable'}</span>
                    </button>
                    <button onClick={() => deleteApiMutation.mutate(apiId, { onSuccess: () => router.push('/dashboard') })} className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                        <Trash2 size={16} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('timeline')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Change Timeline
                        </button>
                        <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Detailed Changes
                        </button>
                        <button onClick={() => setActiveTab('comparison')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'comparison' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Version Comparison
                        </button>
                    </nav>
                </div>
                <div className="p-6">
                    {activeTab === 'timeline' && <ChangelogTimeline apiId={apiId} />}
                    {activeTab === 'details' && <DetailedChangeView apiId={apiId} />}
                    {activeTab === 'comparison' && <VersionComparisonView apiId={apiId} />}
                </div>
            </div>
        </div>
    );
};

export default APIDetailPage;
