
'use client';

import React from 'react';

interface Props {
    prevStep: () => void;
    formData: any;
    handleSubmit: () => void;
    loading: boolean;
}

const Step4_Confirmation = ({ prevStep, formData, handleSubmit, loading }: Props) => {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Step 4: Confirmation & Activation</h3>
            <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                <div>
                    <h4 className="font-medium">API Name:</h4>
                    <p>{formData.apiName}</p>
                </div>
                <div>
                    <h4 className="font-medium">OpenAPI URL:</h4>
                    <p className="truncate">{formData.openApiUrl}</p>
                </div>
                <div>
                    <h4 className="font-medium">Check Frequency:</h4>
                    <p>{formData.checkFrequency}</p>
                </div>
                <div>
                    <h4 className="font-medium">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-medium">Monitoring:</h4>
                    <p>{formData.isActive ? 'Enabled' : 'Disabled'}</p>
                </div>
            </div>
            <div className="flex justify-between mt-6">
                <button
                    onClick={prevStep}
                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                    Previous
                </button>
                <button
                    onClick={handleSubmit}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                    disabled={loading}
                >
                    {loading ? 'Activating...' : 'Confirm & Activate'}
                </button>
            </div>
        </div>
    );
};

export default Step4_Confirmation;
