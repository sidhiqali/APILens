'use client';

import React, { useState } from 'react';
import { Plus, Play, Pause, RefreshCw, Settings, MoreHorizontal } from 'lucide-react';

interface QuickActionsProps {
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ className = '' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const quickActions = [
    {
      label: 'Add API',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      action: () => window.location.href = '/add-api',
    },
    {
      label: 'Refresh All',
      icon: RefreshCw,
      color: 'bg-green-600 hover:bg-green-700 text-white',
      action: () => {
        // Trigger refresh of all APIs
        window.location.reload();
      },
    },
  ];

  const dropdownActions = [
    {
      label: 'Pause All Monitoring',
      icon: Pause,
      action: () => {
        // Implement pause all functionality
        console.log('Pause all monitoring');
      },
    },
    {
      label: 'Resume All Monitoring',
      icon: Play,
      action: () => {
        // Implement resume all functionality
        console.log('Resume all monitoring');
      },
    },
    {
      label: 'Dashboard Settings',
      icon: Settings,
      action: () => window.location.href = '/settings',
    },
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Quick Action Buttons */}
      {quickActions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={`
            inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg 
            transition-colors duration-200 ${action.color}
          `}
          title={action.label}
        >
          <action.icon className="w-4 h-4 mr-2" />
          {action.label}
        </button>
      ))}

      {/* Dropdown for More Actions */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="
            inline-flex items-center px-2 py-2 text-sm font-medium text-gray-700 
            bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
            transition-colors duration-200
          "
          title="More Actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="
              absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 
              py-1 z-20 animate-in fade-in duration-200
            ">
              {dropdownActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    setIsDropdownOpen(false);
                  }}
                  className="
                    w-full text-left px-4 py-2 text-sm text-gray-700 
                    hover:bg-gray-100 transition-colors duration-200
                    flex items-center space-x-2
                  "
                >
                  <action.icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickActions;
