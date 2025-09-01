'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import { useCreateApi } from '@/hooks/useApis';
import { CreateApiRequest } from '@/types';
import {
  ArrowLeft,
  Globe,
  Tag,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const AddAPIPage = () => {
  const router = useRouter();
  const createApiMutation = useCreateApi();

  const [formData, setFormData] = useState<CreateApiRequest>({
    apiName: '',
    openApiUrl: '',
    type: 'REST',
    description: '',
    tags: [],
    checkFrequency: '1h',
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.apiName.trim()) {
      newErrors.apiName = 'API name is required';
    }
    
    if (!formData.openApiUrl.trim()) {
      newErrors.openApiUrl = 'OpenAPI URL is required';
    } else if (!isValidUrl(formData.openApiUrl)) {
      newErrors.openApiUrl = 'Please enter a valid URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    createApiMutation.mutate(formData, {
      onSuccess: () => {
        router.push('/dashboard');
      }
    });
  };

  const handleInputChange = (field: keyof CreateApiRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Add New API</h1>
            <p className="text-gray-600">
              Configure monitoring for a new API endpoint
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  API Name *
                </label>
                <input
                  type="text"
                  value={formData.apiName}
                  onChange={(e) => handleInputChange('apiName', e.target.value)}
                  placeholder="e.g., User Management API"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 ${
                    errors.apiName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.apiName && (
                  <p className="mt-1 text-sm text-red-600">{errors.apiName}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  OpenAPI/Swagger URL *
                </label>
                <input
                  type="url"
                  value={formData.openApiUrl}
                  onChange={(e) => handleInputChange('openApiUrl', e.target.value)}
                  placeholder="https://api.example.com/v1/docs/swagger.json"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 ${
                    errors.openApiUrl ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.openApiUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.openApiUrl}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  URL to your API's OpenAPI/Swagger specification file
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="REST">REST API</option>
                  <option value="GraphQL">GraphQL</option>
                  <option value="SOAP">SOAP</option>
                  <option value="gRPC">gRPC</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your API..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Monitoring Configuration</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Check Frequency
                </label>
                <select
                  value={formData.checkFrequency}
                  onChange={(e) => handleInputChange('checkFrequency', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="5m">Every 5 minutes</option>
                  <option value="15m">Every 15 minutes</option>
                  <option value="1h">Every hour</option>
                  <option value="6h">Every 6 hours</option>
                  <option value="1d">Daily</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  How often should we check for changes in your API
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Tags help organize and filter your APIs
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createApiMutation.isPending}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createApiMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating API...
                  </>
                ) : (
                  'Create API'
                )}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </Layout>
    </RouteGuard>
  );
};

export default AddAPIPage;
