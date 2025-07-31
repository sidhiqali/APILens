'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/axios';

const TestApiPage = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/health');
      setResult(
        `✅ Backend connected! Response: ${JSON.stringify(response, null, 2)}`
      );
    } catch (error: any) {
      setResult(
        `❌ Backend connection failed: ${error.message}\nFull error: ${JSON.stringify(error, null, 2)}`
      );
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: 'sidhiq@gmail.com',
        password: 'test123', // Use the password you registered with
      });
      setResult(
        `✅ Login test successful! Response: ${JSON.stringify(response, null, 2)}`
      );
    } catch (error: any) {
      setResult(
        `❌ Login test failed: ${error.message}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}`
      );
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>

      <div className="space-y-4 mb-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </button>

        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Login API'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default TestApiPage;
