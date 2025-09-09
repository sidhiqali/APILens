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
  Shield, 
  Zap, 
  Clock, 
  Database, 
  Globe,
  Code,
  CheckCircle,
  Users,
  PlayCircle,
  TrendingUp,
  Server,
  Lock,
  Layers
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
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                View Demo
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
              <Zap className="w-4 h-4 mr-2" />
              Live System • Real-time Monitoring
            </div>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl lg:text-7xl">
              Intelligent API
              <span className="block text-blue-600">Change Detection System</span>
            </h1>
            <p className="max-w-4xl mx-auto mb-4 text-2xl font-medium text-gray-700">
              Monitor API changes. Detect. Analyze. Act.
            </p>
            <p className="max-w-3xl mx-auto mb-12 text-xl text-gray-600">
              Automated monitoring system that detects, analyzes, and alerts on changes 
              in OpenAPI specifications with real-time insights and intelligent notifications.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Explore Live Demo
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-gray-700 transition-all bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg"
              >
                How It Works
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              The Challenges We Solve
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Modern microservices face critical API management challenges that can break systems
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-500 rounded-xl shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-center text-gray-900">Breaking Changes</h3>
              <p className="text-center text-gray-600 text-sm">
                Undetected API changes break downstream services
              </p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-500 rounded-xl shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-center text-gray-900">Manual Monitoring</h3>
              <p className="text-center text-gray-600 text-sm">
                Developers waste hours tracking API changes manually
              </p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-500 rounded-xl shadow-lg">
                <GitCommit className="w-6 h-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-center text-gray-900">Version Control</h3>
              <p className="text-center text-gray-600 text-sm">
                No centralized system to track API evolution history
              </p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-purple-500 rounded-xl shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-center text-gray-900">Security Risks</h3>
              <p className="text-center text-gray-600 text-sm">
                Unmonitored endpoints expose potential vulnerabilities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Why APILens?
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Intelligent automation that transforms how you monitor and manage API changes
            </p>
          </div>
          
          {/* 4-Step Flow */}
          <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-2xl shadow-lg">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">1. Monitoring</h3>
                  <p className="text-gray-600 text-sm">
                    Continuous automated monitoring of OpenAPI specifications
                  </p>
                </div>
              </div>
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-1/2 right-0 w-8 h-0.5 bg-gray-300 transform translate-x-4"></div>
            </div>
            
            <div className="relative">
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-500 rounded-2xl shadow-lg">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">2. Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    Smart diffing algorithms detect and categorize changes
                  </p>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 right-0 w-8 h-0.5 bg-gray-300 transform translate-x-4"></div>
            </div>
            
            <div className="relative">
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-500 rounded-2xl shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">3. Impact</h3>
                  <p className="text-gray-600 text-sm">
                    Calculates impact scores and prioritizes critical changes
                  </p>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 right-0 w-8 h-0.5 bg-gray-300 transform translate-x-4"></div>
            </div>
            
            <div>
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-500 rounded-2xl shadow-lg">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">4. Alerts</h3>
                  <p className="text-gray-600 text-sm">
                    Real-time WebSocket notifications with severity levels
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tech Stack */}
          <div className="p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
            <h3 className="mb-8 text-2xl font-bold text-center text-gray-900">Built with Industry-Leading Technologies</h3>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 mb-2 bg-red-500 rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">NestJS</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 mb-2 bg-black rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Next.js</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 mb-2 bg-green-500 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">MongoDB</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 mb-2 bg-red-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Redis</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 mb-2 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">TypeScript</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 mb-2 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">VS Code</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Powerful Features for Modern APIs
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Everything you need to monitor, track, and manage API changes with confidence
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
            {/* First Row */}
            <div className="group p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl border border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-blue-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Real-time Monitoring</h3>
              <p className="text-blue-600 text-sm font-medium mb-3">Always watching, always ready</p>
              <p className="text-gray-700">
                Automated health checks with configurable intervals, batch processing, and intelligent scheduling
              </p>
            </div>
            
            <div className="group p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl border border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-green-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <GitCommit className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Change Tracking</h3>
              <p className="text-green-600 text-sm font-medium mb-3">Never miss a single change</p>
              <p className="text-gray-700">
                Detailed logs with before/after comparisons, impact scoring, and smart categorization
              </p>
            </div>
            
            <div className="group p-8 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl border border-yellow-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-yellow-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Smart Notifications</h3>
              <p className="text-yellow-600 text-sm font-medium mb-3">Intelligent alerts when it matters</p>
              <p className="text-gray-700">
                Real-time WebSocket updates with severity levels and customizable notification management
              </p>
            </div>
            
            {/* Second Row */}
            <div className="group p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl border border-purple-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-purple-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Version History</h3>
              <p className="text-purple-600 text-sm font-medium mb-3">Complete evolution timeline</p>
              <p className="text-gray-700">
                Full API timeline with snapshot storage, version comparison, and rollback capabilities
              </p>
            </div>
            
            <div className="group p-8 bg-gradient-to-br from-red-50 to-red-100 rounded-3xl border border-red-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-red-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Health Monitoring</h3>
              <p className="text-red-600 text-sm font-medium mb-3">Proactive health insights</p>
              <p className="text-gray-700">
                Continuous health tracking, endpoint availability monitoring, and automated issue detection
              </p>
            </div>
            
            <div className="group p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl border border-indigo-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-indigo-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Team Collaboration</h3>
              <p className="text-indigo-600 text-sm font-medium mb-3">Built for teams</p>
              <p className="text-gray-700">
                Multi-user support with role-based access, shared dashboards, and collaborative management
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              System Architecture
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Built with modern software engineering principles and scalable architecture patterns
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
              <h3 className="mb-8 text-2xl font-bold text-gray-900">Core System Components</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 mb-1">Custom Diff Engine</h4>
                    <p className="text-gray-600">Structural and document change detection with breaking change analysis</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 mb-1">OpenAPI Parser & Validator</h4>
                    <p className="text-gray-600">YAML/JSON spec parsing with SemVer validation and error handling</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 mb-1">Multi-Frontend Architecture</h4>
                    <p className="text-gray-600">Web dashboard (Next.js) and VS Code extension with shared backend APIs</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 mb-1">External Source Integration</h4>
                    <p className="text-gray-600">GitHub APIs, Slack webhooks, Prism mock servers, and API registries</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
              <h3 className="mb-8 text-2xl font-bold text-gray-900">Intelligent Workflow Features</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-xl flex-shrink-0">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 mb-1">Severity Classification</h4>
                    <p className="text-gray-600">Automatic severity assessment with version guidance and impact scoring</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-xl flex-shrink-0">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 mb-1">Dual Notification System</h4>
                    <p className="text-gray-600">Web UI dashboards and VS Code extension alerts with real-time updates</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-xl flex-shrink-0">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 mb-1">Metrics & Analytics</h4>
                    <p className="text-gray-600">Accuracy tracking (FP/FN), response time monitoring, and persistence storage</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-xl flex-shrink-0">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 mb-1">Developer Integration</h4>
                    <p className="text-gray-600">Command palette, status bar integration, and inline validation in VS Code</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 text-white bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl shadow-lg">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <span className="ml-4 text-3xl font-bold">
                APILens
              </span>
            </div>
            
            <div className="mb-12">
              <p className="text-2xl font-semibold mb-4">
                Built with ❤️ using modern technologies
              </p>
              <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                Powered by NestJS, Next.js, MongoDB, Redis, and TypeScript
              </p>
            </div>
            
            <div className="flex justify-center space-x-6 mb-12">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Globe className="w-5 h-5 mr-2" />
                Explore Live Demo
              </Link>
              <a
                href="https://github.com/sidhiqali/APILens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white transition-all bg-gray-700 rounded-xl hover:bg-gray-600 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Code className="w-5 h-5 mr-2" />
                View Source Code
              </a>
            </div>
            
            <div className="pt-8 border-t border-gray-700">
              <p className="text-gray-400">
                © 2024 APILens. Intelligent API Change Detection System.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
