'use client';

import React from 'react';
import { Activity, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface StatsCardsProps {
  stats?: {
    totalApis: number;
    activeApis: number;
    healthyApis: number;
    unhealthyApis: number;
    totalChanges: number;
    criticalIssues: number;
    avgResponseTime: number;
    uptimePercentage: number;
  };
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total APIs',
      value: stats?.totalApis || 0,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: null,
    },
    {
      title: 'Active APIs',
      value: stats?.activeApis || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: stats?.activeApis ? `${((stats.activeApis / (stats.totalApis || 1)) * 100).toFixed(1)}%` : null,
    },
    {
      title: 'Total Changes',
      value: stats?.totalChanges || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: null,
    },
    {
      title: 'Critical Issues',
      value: stats?.criticalIssues || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: null,
    },
  ];

  const additionalCards = [
    {
      title: 'Avg Response Time',
      value: `${stats?.avgResponseTime || 0}ms`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: null,
    },
    {
      title: 'Uptime',
      value: `${stats?.uptimePercentage || 0}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      {/* Secondary Stats */}
      {stats && (stats.avgResponseTime || stats.uptimePercentage) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {additionalCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: string | null;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor, 
  change 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-xs text-gray-500 mt-1">{change} of total</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
