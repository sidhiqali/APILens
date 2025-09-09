'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Eye, 
  ArrowRight, 
  Activity, 
  GitCommit, 
  AlertTriangle, 
  Bell, 
  BarChart3, 
  Shield, 
  Zap, 
  Clock, 
  Database, 
  Globe,
  Code,
  CheckCircle,
  Users,
  BookOpen
} from 'lucide-react';

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
                href="/dashboard"
                className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900"
              >
                View Demo
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Explore System
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
              Intelligent API
              <span className="block text-blue-600">Change Detection System</span>
            </h1>
            <p className="max-w-4xl mx-auto mb-8 text-xl text-gray-600">
              APILens is an automated monitoring system that detects, analyzes, and alerts on changes 
              in OpenAPI specifications. Built with modern web technologies to solve the critical problem 
              of API evolution tracking in microservices architectures.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-3 text-lg font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Explore Live Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center px-8 py-3 text-lg font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50"
              >
                View Features
                <Eye className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              The Problem We&apos;re Solving
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              In modern microservices architectures, API changes happen frequently but tracking their impact is complex and error-prone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="p-6 bg-white border border-red-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-center text-gray-900">Breaking Changes</h3>
              <p className="text-center text-gray-600">
                Undetected API changes can break downstream services and integrations, causing system failures.
              </p>
            </div>
            
            <div className="p-6 bg-white border border-yellow-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-center text-gray-900">Manual Monitoring</h3>
              <p className="text-center text-gray-600">
                Developers spend countless hours manually tracking API changes across multiple services and versions.
              </p>
            </div>
            
            <div className="p-6 bg-white border border-blue-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg">
                <GitCommit className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-center text-gray-900">Version Control</h3>
              <p className="text-center text-gray-600">
                No centralized system to track API evolution history and understand the impact of changes over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Our Solution: APILens
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              An intelligent, automated system that monitors OpenAPI specifications, detects changes, 
              and provides real-time insights into API evolution.
            </p>
          </div>
          
          <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h3 className="mb-6 text-2xl font-bold text-gray-900">How It Works</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Automated Monitoring</h4>
                    <p className="text-gray-600">Continuously monitors OpenAPI specifications at scheduled intervals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Intelligent Analysis</h4>
                    <p className="text-gray-600">Compares new versions against previous snapshots to detect changes</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Impact Assessment</h4>
                    <p className="text-gray-600">Categorizes changes and calculates impact scores for prioritization</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-semibold text-blue-600">4</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Real-time Alerts</h4>
                    <p className="text-gray-600">Sends notifications via WebSocket for immediate awareness</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-lg bg-gray-50">
              <h4 className="mb-4 text-lg font-semibold text-gray-900">Technology Stack</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="mb-2 font-medium text-gray-700">Backend</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• NestJS Framework</li>
                    <li>• MongoDB Database</li>
                    <li>• Redis Caching</li>
                    <li>• WebSocket Gateway</li>
                  </ul>
                </div>
                <div>
                  <h5 className="mb-2 font-medium text-gray-700">Frontend</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Next.js 13+ App Router</li>
                    <li>• React Query</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              System Features & Capabilities
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Comprehensive features designed to provide complete visibility into API changes and their impact.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Real-time Monitoring</h3>
              <p className="text-gray-600">
                Automated health checks and change detection with configurable monitoring intervals and batch processing.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-green-100 rounded-lg">
                <GitCommit className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Change Tracking</h3>
              <p className="text-gray-600">
                Detailed change logs with before/after comparisons, impact scoring, and categorization of modifications.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-yellow-100 rounded-lg">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Smart Notifications</h3>
              <p className="text-gray-600">
                Intelligent alerting system with severity levels, real-time WebSocket updates, and notification management.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-purple-100 rounded-lg">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Version History</h3>
              <p className="text-gray-600">
                Complete API evolution timeline with snapshot storage, version comparison, and rollback capabilities.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Health Monitoring</h3>
              <p className="text-gray-600">
                API health status tracking, endpoint availability monitoring, and automated issue detection.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Team Collaboration</h3>
              <p className="text-gray-600">
                Multi-user support with role-based access control, shared dashboards, and collaborative change management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              System Architecture & Implementation
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Built with modern software engineering principles and scalable architecture patterns.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="p-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <h3 className="mb-6 text-xl font-bold text-gray-900">Key Architectural Decisions</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 mt-1 text-green-600" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Microservices Design</h4>
                    <p className="text-sm text-gray-600">Modular NestJS architecture with separated concerns</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 mt-1 text-green-600" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Real-time Communication</h4>
                    <p className="text-sm text-gray-600">WebSocket implementation for instant notifications</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 mt-1 text-green-600" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Scalable Scheduling</h4>
                    <p className="text-sm text-gray-600">Intelligent batch processing with configurable intervals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-5 h-5 mt-1 text-green-600" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Type Safety</h4>
                    <p className="text-sm text-gray-600">End-to-end TypeScript for reliability and maintainability</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <h3 className="mb-6 text-xl font-bold text-gray-900">Performance Optimizations</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Zap className="flex-shrink-0 w-5 h-5 mt-1 text-yellow-600" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Efficient Change Detection</h4>
                    <p className="text-sm text-gray-600">Smart diffing algorithms for accurate change identification</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Zap className="flex-shrink-0 w-5 h-5 mt-1 text-yellow-600" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Caching Strategy</h4>
                    <p className="text-sm text-gray-600">Redis-based caching for improved response times</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Zap className="flex-shrink-0 w-5 h-5 mt-1 text-yellow-600" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Optimistic Updates</h4>
                    <p className="text-sm text-gray-600">React Query for smooth user experience</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Zap className="flex-shrink-0 w-5 h-5 mt-1 text-yellow-600" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Mock System Integration</h4>
                    <p className="text-sm text-gray-600">Automated testing with Prism mock servers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 text-white bg-gray-900">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Eye className="w-10 h-10 text-blue-400" />
              <span className="ml-3 text-2xl font-bold">
                APILens
              </span>
            </div>
            <div className="mb-6">
              <p className="max-w-2xl mx-auto text-gray-300">
                An intelligent API monitoring and change detection system designed to solve real-world 
                problems in microservices architecture and API management.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-3">
              <div>
                <h4 className="mb-2 font-semibold text-blue-400">Core Technologies</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>NestJS & Node.js</li>
                  <li>Next.js & React</li>
                  <li>MongoDB & Redis</li>
                  <li>TypeScript</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-blue-400">Key Features</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>Real-time Change Detection</li>
                  <li>Automated Health Monitoring</li>
                  <li>Smart Notification System</li>
                  <li>Version History Tracking</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-blue-400">Architecture</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>Microservices Design</li>
                  <li>WebSocket Communication</li>
                  <li>Intelligent Scheduling</li>
                  <li>Scalable Processing</li>
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-700">
              <div className="flex justify-center space-x-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Explore Live Demo
                </Link>
                <a
                  href="https://github.com/sidhiqali/APILens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-2 text-white transition-colors bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  <Code className="w-4 h-4 mr-2" />
                  View Source Code
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
