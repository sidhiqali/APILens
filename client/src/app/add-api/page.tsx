'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import { apiService } from '@/services/api.service';
import { useRouter } from 'next/navigation';

const AddAPIPage = () => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAddApi = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    apiService.createAPI({ name, openapi_url: url, category }).then(
      () => {
        router.push('/dashboard');
      },
      (error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();
        setLoading(false);
        setMessage(resMessage);
      }
    );
  };

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Add New API</h2>
            <p className="text-gray-600">
              Configure monitoring for a new API endpoint
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleAddApi} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Stripe API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAPI/Swagger URL
                </label>
                <input
                  type="url"
                  placeholder="https://api.stripe.com/openapi.json"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll fetch the API specification from this URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category/Group
                </label>
                <input
                  type="text"
                  placeholder="e.g., Payment Processing"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading && (
                    <span className="spinner-border spinner-border-sm"></span>
                  )}
                  Add API
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {message && (
                <div className="alert alert-danger mt-4" role="alert">
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </Layout>
    </RouteGuard>
  );
};

export default AddAPIPage;
