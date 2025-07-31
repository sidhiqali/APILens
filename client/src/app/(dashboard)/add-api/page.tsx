
'use client';

import React, { useState } from 'react';
import Step1_BasicInfo from '@/components/api-registration/Step1_BasicInfo';
import Step2_MonitoringConfig from '@/components/api-registration/Step2_MonitoringConfig';
import Step3_Validation from '@/components/api-registration/Step3_Validation';
import Step4_Confirmation from '@/components/api-registration/Step4_Confirmation';
import { useCreateApi } from '@/hooks/useApis';
import { useRouter } from 'next/navigation';

const AddApiPage = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        apiName: '',
        openApiUrl: '',
        description: '',
        checkFrequency: '1h',
        tags: [],
        isActive: true,
    });

    const router = useRouter();
    const createApiMutation = useCreateApi();

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const updateFormData = (newData: any) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    };

    const handleSubmit = () => {
        createApiMutation.mutate(formData, {
            onSuccess: () => {
                router.push('/dashboard');
            },
        });
    };

    const steps = [
        <Step1_BasicInfo key={1} nextStep={nextStep} formData={formData} updateFormData={updateFormData} />,
        <Step2_MonitoringConfig key={2} nextStep={nextStep} prevStep={prevStep} formData={formData} updateFormData={updateFormData} />,
        <Step3_Validation key={3} nextStep={nextStep} prevStep={prevStep} formData={formData} />,
        <Step4_Confirmation key={4} prevStep={prevStep} formData={formData} handleSubmit={handleSubmit} loading={createApiMutation.isPending} />,
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Add New API</h2>
                <p className="text-gray-600">Follow the steps to configure monitoring for a new API.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-8">
                {steps[step - 1]}
            </div>
        </div>
    );
};

export default AddApiPage;
