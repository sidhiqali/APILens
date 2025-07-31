
'use client';

import React from 'react';
import Select from 'react-select/creatable';

interface Props {
    nextStep: () => void;
    prevStep: () => void;
    formData: any;
    updateFormData: (data: any) => void;
}

const frequencyOptions = [
    { value: '5m', label: 'Every 5 minutes' },
    { value: '15m', label: 'Every 15 minutes' },
    { value: '1h', label: 'Every hour' },
    { value: '6h', label: 'Every 6 hours' },
    { value: '1d', label: 'Every day' },
];

const Step2_MonitoringConfig = ({ nextStep, prevStep, formData, updateFormData }: Props) => {
    const handleFrequencyChange = (selectedOption: any) => {
        updateFormData({ checkFrequency: selectedOption.value });
    };

    const handleTagsChange = (newValue: any) => {
        updateFormData({ tags: newValue.map((tag: any) => tag.value) });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Step 2: Monitoring Configuration</h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check Frequency</label>
                    <Select
                        options={frequencyOptions}
                        value={frequencyOptions.find(opt => opt.value === formData.checkFrequency)}
                        onChange={handleFrequencyChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <Select
                        isMulti
                        isClearable
                        onChange={handleTagsChange}
                        value={formData.tags.map((tag: string) => ({ value: tag, label: tag }))}
                        placeholder="Type to create new tags..."
                    />
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={(e) => updateFormData({ isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Enable monitoring immediately
                    </label>
                </div>
                <div className="flex justify-between">
                    <button
                        onClick={prevStep}
                        className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                    >
                        Previous
                    </button>
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

export default Step2_MonitoringConfig;
