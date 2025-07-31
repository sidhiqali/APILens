
'use client';

import React, { useState } from 'react';
import { useGetApiSnapshots } from '@/hooks/useChangelog';
import Select from 'react-select';
import ReactDiffViewer from 'react-diff-viewer';

const VersionComparisonView = ({ apiId }: { apiId: string }) => {
    const { data: snapshots, isLoading, isError } = useGetApiSnapshots(apiId);
    const [fromVersion, setFromVersion] = useState<any>(null);
    const [toVersion, setToVersion] = useState<any>(null);

    if (isLoading) return <div className="p-4 text-center">Loading snapshots...</div>;
    if (isError) return <div className="p-4 text-center text-red-500">Failed to load snapshots.</div>;
    if (!snapshots || snapshots.length < 2) {
        return <div className="p-4 text-center text-gray-500">At least two snapshots are required to compare versions.</div>;
    }

    const snapshotOptions = snapshots.map((s: any) => ({
        value: s._id,
        label: `v${s.version} - ${new Date(s.createdAt).toLocaleString()}`,
        content: s.snapshot,
    }));

    const oldCode = fromVersion ? JSON.stringify(fromVersion.content, null, 2) : '';
    const newCode = toVersion ? JSON.stringify(toVersion.content, null, 2) : '';

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Select
                    options={snapshotOptions}
                    onChange={setFromVersion}
                    value={fromVersion}
                    placeholder="Select version to compare from..."
                />
                <Select
                    options={snapshotOptions}
                    onChange={setToVersion}
                    value={toVersion}
                    placeholder="Select version to compare to..."
                />
            </div>
            {fromVersion && toVersion && (
                <div className="border rounded-md overflow-hidden">
                    <ReactDiffViewer oldValue={oldCode} newValue={newCode} splitView={true} />
                </div>
            )}
        </div>
    );
};

export default VersionComparisonView;
