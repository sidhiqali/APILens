
'use client';

import React from 'react';

interface Props {
    nextStep: () => void;
    formData: any;
    updateFormData: (data: any) => void;
}

const Step1_BasicInfo = ({ nextStep, formData, updateFormData }: Props) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateFormData({ [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Step 1: Basic Information</h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Name</label>
                    <input
                        type="text"
                        name="apiName"
                        placeholder="e.g., Payment Processing API"
                        value={formData.apiName}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">OpenAPI/Swagger URL</label>
                    <input
                        type="url"
                        name="openApiUrl"
                        placeholder="https://api.example.com/openapi.json"
                        value={formData.openApiUrl}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                    <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={nextStep}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step1_BasicInfo;
