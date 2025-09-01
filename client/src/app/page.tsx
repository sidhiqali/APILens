'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center flex-shrink-0">
                <Eye className="w-8 h-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  APILens
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
              Monitor Your APIs
              <span className="block text-blue-600">Like Never Before</span>
            </h1>
            <p className="max-w-3xl mx-auto mb-8 text-xl text-gray-600">
              APILens automatically tracks changes in your OpenAPI
              specifications, alerts you to breaking changes, and maintains a
              complete history of your API evolution.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-3 text-lg font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-3 text-lg font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Everything You Need for API Monitoring
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools to keep your APIs in check and your
              integrations stable.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                APILens
              </span>
            </div>
            <p className="mb-4 text-gray-600">
              Monitor your APIs. Prevent integration failures. Ship with
              confidence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
