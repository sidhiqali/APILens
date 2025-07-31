
'use client';

import React from 'react';
import { useGetChangelog } from '@/hooks/useChangelog';
import { AlertTriangle, CheckCircle, GitCommit } from 'lucide-react';

const ChangelogTimeline = ({ apiId }: { apiId: string }) => {
    const { data: changelog, isLoading, isError } = useGetChangelog(apiId);

    if (isLoading) return <div className="p-4 text-center">Loading changelog...</div>;
    if (isError) return <div className="p-4 text-center text-red-500">Failed to load changelog.</div>;
    if (!changelog || changelog.length === 0) {
        return <div className="p-4 text-center text-gray-500">No changes detected yet.</div>;
    }

    const getChangeIcon = (changeType: string) => {
        switch (changeType) {
            case 'breaking':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'non-breaking':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            default:
                return <GitCommit className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {changelog.map((item: any, index: number) => (
                    <li key={item._id}>
                        <div className="relative pb-8">
                            {index !== changelog.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                        {getChangeIcon(item.changeType)}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            <span className={`font-medium text-gray-900 capitalize`}>{item.changeType}</span> change from v{item.fromVersion} to v{item.toVersion}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        <time dateTime={item.detectedAt}>{new Date(item.detectedAt).toLocaleDateString()}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChangelogTimeline;
