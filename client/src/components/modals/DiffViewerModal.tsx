
'use client';

import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    oldValue: any;
    newValue: any;
    title: string;
}

const DiffViewerModal = ({ isOpen, onClose, oldValue, newValue, title }: Props) => {
    if (!isOpen) return null;

    const oldCode = JSON.stringify(oldValue, null, 2) || '';
    const newCode = JSON.stringify(newValue, null, 2) || '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div className="overflow-auto flex-grow">
                    <ReactDiffViewer oldValue={oldCode} newValue={newCode} splitView={true} />
                </div>
            </div>
        </div>
    );
};

export default DiffViewerModal;
