
'use client';

import React, { useEffect } from 'react';
import { useValidateApiUrl } from '@/hooks/useApis';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';

interface Props {
    nextStep: () => void;
    prevStep: () => void;
    formData: any;
}

const Step3_Validation = ({ nextStep, prevStep, formData }: Props) => {
    const validateApiMutation = useValidateApiUrl();

    useEffect(() => {
        validateApiMutation.mutate({ url: formData.openApiUrl });
    }, [formData.openApiUrl]);

    const { isPending, isError, isSuccess, data, error } = validateApiMutation;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Step 3: Validation & Testing</h3>
            <div className="p-6 border rounded-md bg-gray-50 min-h-[200px] flex items-center justify-center">
                {isPending && (
                    <div className="flex flex-col items-center text-gray-600">
                        <Loader className="animate-spin mb-2" />
                        <p>Validating OpenAPI specification...</p>
                    </div>
                )}
                {isError && (
                    <div className="text-red-600 flex flex-col items-center">
                        <AlertTriangle className="mb-2" />
                        <p>Validation Failed:</p>
                        <p className="text-sm">{error.message}</p>
                    </div>
                )}
                {isSuccess && (
                    <div className="text-green-600 flex flex-col items-center">
                        <CheckCircle className="mb-2" />
                        <p>{data.message}</p>
                        <div className="text-sm text-gray-700 mt-2 text-center">
                            <p>Version: {data.specInfo.version}</p>
                            <p>Found {data.specInfo.endpoints} endpoints and {data.specInfo.schemas} schemas.</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-between mt-6">
                <button
                    onClick={prevStep}
                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                    Previous
                </button>
                <button
                    onClick={nextStep}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    disabled={!isSuccess}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Step3_Validation;
