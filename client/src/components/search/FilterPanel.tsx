'use client';

import React, { useState, useCallback } from 'react';
import {
  Filter,
  X,
  CheckSquare,
  Square,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { clsx } from 'clsx';

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
  count?: number;
  color?: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'daterange' | 'search';
  options?: FilterOption[];
  value?: any;
  placeholder?: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
}

export interface FilterState {
  [groupId: string]: any;
}

interface FilterPanelProps {
  filters: FilterGroup[];
  initialState?: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAll?: () => void;
  className?: string;
  showActiveCount?: boolean;
  isCollapsible?: boolean;
  title?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  initialState = {},
  onFiltersChange,
  onClearAll,
  className = '',
  showActiveCount = true,
  isCollapsible = false,
  title = 'Filters',
}) => {
  const [filterState, setFilterState] = useState<FilterState>(initialState);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    Object.entries(filterState).forEach(([groupId, value]) => {
      const group = filters.find((f) => f.id === groupId);
      if (!group) return;

      switch (group.type) {
        case 'checkbox':
          count += Array.isArray(value) ? value.length : 0;
          break;
        case 'radio':
        case 'select':
          count += value ? 1 : 0;
          break;
        case 'daterange':
          count += value?.start || value?.end ? 1 : 0;
          break;
        case 'search':
          count += value?.trim() ? 1 : 0;
          break;
      }
    });
    return count;
  }, [filterState, filters]);

  const activeCount = getActiveFilterCount();

  const updateFilter = (groupId: string, value: any) => {
    const newState = { ...filterState, [groupId]: value };
    setFilterState(newState);
    onFiltersChange(newState);
  };

  const handleClearAll = () => {
    const clearedState: FilterState = {};
    filters.forEach((group) => {
      switch (group.type) {
        case 'checkbox':
          clearedState[group.id] = [];
          break;
        case 'daterange':
          clearedState[group.id] = { start: '', end: '' };
          break;
        default:
          clearedState[group.id] = '';
      }
    });
    setFilterState(clearedState);
    onFiltersChange(clearedState);
    onClearAll?.();
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const renderFilterGroup = (group: FilterGroup) => {
    const isGroupCollapsed = collapsedGroups.includes(group.id);
    const currentValue = filterState[group.id];

    return (
      <div key={group.id} className="border-b border-gray-200 last:border-b-0">
        <div
          className={clsx(
            'flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50',
            group.isCollapsible ? 'cursor-pointer' : 'cursor-default'
          )}
          onClick={
            group.isCollapsible
              ? () => toggleGroupCollapse(group.id)
              : undefined
          }
        >
          <h3 className="text-sm font-medium text-gray-900">{group.label}</h3>
          <div className="flex items-center space-x-2">
            {getGroupActiveCount(group, currentValue) > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {getGroupActiveCount(group, currentValue)}
              </span>
            )}
            {group.isCollapsible && (
              <ChevronDown
                className={clsx(
                  'w-4 h-4 text-gray-500 transition-transform',
                  isGroupCollapsed && 'transform rotate-180'
                )}
              />
            )}
          </div>
        </div>

        {!isGroupCollapsed && (
          <div className="px-4 pb-4">
            {renderFilterContent(group, currentValue)}
          </div>
        )}
      </div>
    );
  };

  const getGroupActiveCount = (group: FilterGroup, value: any): number => {
    switch (group.type) {
      case 'checkbox':
        return Array.isArray(value) ? value.length : 0;
      case 'radio':
      case 'select':
        return value ? 1 : 0;
      case 'daterange':
        return value?.start || value?.end ? 1 : 0;
      case 'search':
        return value?.trim() ? 1 : 0;
      default:
        return 0;
    }
  };

  const renderFilterContent = (group: FilterGroup, currentValue: any) => {
    switch (group.type) {
      case 'checkbox':
        return (
          <div className="space-y-2">
            {group.options?.map((option) => (
              <label
                key={option.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <div className="relative">
                  {(currentValue || []).includes(option.value) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <input
                    type="checkbox"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    checked={(currentValue || []).includes(option.value)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const currentArray = currentValue || [];
                      const newValue = checked
                        ? [...currentArray, option.value]
                        : currentArray.filter((v: any) => v !== option.value);
                      updateFilter(group.id, newValue);
                    }}
                  />
                </div>
                <span className="text-sm text-gray-700">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500">
                    ({option.count})
                  </span>
                )}
                {option.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {group.options?.map((option) => (
              <label
                key={option.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="radio"
                  name={group.id}
                  value={option.value as string}
                  checked={currentValue === option.value}
                  onChange={() => updateFilter(group.id, option.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500">
                    ({option.count})
                  </span>
                )}
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => updateFilter(group.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">{group.placeholder || 'Select...'}</option>
            {group.options?.map((option) => (
              <option key={option.id} value={option.value as string}>
                {option.label}
                {option.count !== undefined && ` (${option.count})`}
              </option>
            ))}
          </select>
        );

      case 'daterange':
        const dateValue = currentValue || { start: '', end: '' };
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateValue.start || ''}
                onChange={(e) =>
                  updateFilter(group.id, {
                    ...dateValue,
                    start: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateValue.end || ''}
                onChange={(e) =>
                  updateFilter(group.id, { ...dateValue, end: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>
        );

      case 'search':
        return (
          <input
            type="text"
            placeholder={group.placeholder || 'Search...'}
            value={currentValue || ''}
            onChange={(e) => updateFilter(group.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
          />
        );

      default:
        return null;
    }
  };

  if (isPanelCollapsed && isCollapsible) {
    return (
      <div
        className={clsx(
          'bg-white border border-gray-200 rounded-lg',
          className
        )}
      >
        <button
          onClick={() => setIsPanelCollapsed(false)}
          className="w-full p-3 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{title}</span>
            {showActiveCount && activeCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {activeCount}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={clsx('bg-white border border-gray-200 rounded-lg', className)}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          {showActiveCount && activeCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeCount > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          )}
          {isCollapsible && (
            <button
              onClick={() => setIsPanelCollapsed(true)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filters.map(renderFilterGroup)}
      </div>
    </div>
  );
};

export const createAPIFilters = (): FilterGroup[] => [
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    options: [
      {
        id: 'active',
        label: 'Active',
        value: 'active',
        count: 15,
        color: '#10B981',
      },
      {
        id: 'inactive',
        label: 'Inactive',
        value: 'inactive',
        count: 3,
        color: '#EF4444',
      },
      {
        id: 'pending',
        label: 'Pending',
        value: 'pending',
        count: 2,
        color: '#F59E0B',
      },
    ],
  },
  {
    id: 'category',
    label: 'Category',
    type: 'radio',
    options: [
      { id: 'rest', label: 'REST API', value: 'rest', count: 12 },
      { id: 'graphql', label: 'GraphQL', value: 'graphql', count: 5 },
      { id: 'websocket', label: 'WebSocket', value: 'websocket', count: 3 },
    ],
  },
  {
    id: 'lastModified',
    label: 'Last Modified',
    type: 'daterange',
    placeholder: 'Select date range',
  },
  {
    id: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search APIs...',
  },
];

export const createNotificationFilters = (): FilterGroup[] => [
  {
    id: 'severity',
    label: 'Severity',
    type: 'checkbox',
    options: [
      {
        id: 'critical',
        label: 'Critical',
        value: 'critical',
        count: 2,
        color: '#DC2626',
      },
      { id: 'high', label: 'High', value: 'high', count: 5, color: '#EA580C' },
      {
        id: 'medium',
        label: 'Medium',
        value: 'medium',
        count: 8,
        color: '#D97706',
      },
      { id: 'low', label: 'Low', value: 'low', count: 12, color: '#65A30D' },
    ],
  },
  {
    id: 'type',
    label: 'Type',
    type: 'checkbox',
    options: [
      { id: 'api_change', label: 'API Change', value: 'api_change', count: 15 },
      { id: 'api_error', label: 'API Error', value: 'api_error', count: 8 },
      {
        id: 'breaking_change',
        label: 'Breaking Change',
        value: 'breaking_change',
        count: 3,
      },
      { id: 'system', label: 'System', value: 'system', count: 2 },
    ],
  },
  {
    id: 'read',
    label: 'Read Status',
    type: 'radio',
    options: [
      { id: 'all', label: 'All', value: '', count: 28 },
      { id: 'unread', label: 'Unread', value: 'false', count: 12 },
      { id: 'read', label: 'Read', value: 'true', count: 16 },
    ],
  },
];

export default FilterPanel;
