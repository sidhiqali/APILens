'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Clock,
  ArrowRight,
  Activity,
  Bell,
  Settings,
  Users,
  FileText,
  X,
  Filter,
} from 'lucide-react';
import { clsx } from 'clsx';
import logger from '@/utils/logger';

interface SearchResult {
  id: string;
  type: 'api' | 'notification' | 'changelog' | 'setting' | 'team' | 'page';
  title: string;
  description?: string;
  url: string;
  metadata?: {
    status?: string;
    lastModified?: string;
    severity?: string;
    [key: string]: any;
  };
}

interface SearchFilter {
  type:
    | 'all'
    | 'api'
    | 'notification'
    | 'changelog'
    | 'setting'
    | 'team'
    | 'page';
  label: string;
  icon: React.ElementType;
  count?: number;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
  isModal?: boolean;
  onClose?: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = 'Search APIs, notifications, settings...',
  className = '',
  onResultSelect,
  isModal = false,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] =
    useState<SearchFilter['type']>('all');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const filters: SearchFilter[] = [
    { type: 'all', label: 'All', icon: Search },
    { type: 'api', label: 'APIs', icon: Activity },
    { type: 'notification', label: 'Notifications', icon: Bell },
    { type: 'changelog', label: 'Changes', icon: FileText },
    { type: 'team', label: 'Team', icon: Users },
    { type: 'setting', label: 'Settings', icon: Settings },
  ];

  const performSearch = async (
    searchQuery: string
  ): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'api',
        title: 'User Management API',
        description: 'RESTful API for user authentication and management',
        url: '/apis/user-management',
        metadata: { status: 'active', lastModified: '2024-01-15' },
      },
      {
        id: '2',
        type: 'notification',
        title: 'API Breaking Change Alert',
        description: 'Version 2.0 introduces breaking changes',
        url: '/notifications/breaking-change-alert',
        metadata: { severity: 'high', lastModified: '2024-01-14' },
      },
      {
        id: '3',
        type: 'changelog',
        title: 'Authentication API Changes',
        description: 'Added OAuth 2.0 support and deprecated API keys',
        url: '/changelogs/auth-api-changes',
        metadata: { lastModified: '2024-01-13' },
      },
      {
        id: '4',
        type: 'setting',
        title: 'Notification Preferences',
        description: 'Configure email and webhook notifications',
        url: '/settings/notifications',
      },
      {
        id: '5',
        type: 'team',
        title: 'Team Member: John Doe',
        description: 'Senior Developer - john.doe@company.com',
        url: '/team/members/john-doe',
      },
    ];

    return mockResults.filter((result) => {
      const matchesQuery =
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === 'all' || result.type === selectedFilter;
      return matchesQuery && matchesFilter;
    });
  };

  useEffect(() => {
    const searchDebounced = async () => {
      if (!query.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await performSearch(query);
        setResults(searchResults);
      } catch (error) {
        logger.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchDebounced, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, selectedFilter]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleResultSelect = (result: SearchResult) => {
    saveRecentSearch(query);

    if (onResultSelect) {
      onResultSelect(result);
    } else {
      router.push(result.url);
    }

    if (isModal && onClose) {
      onClose();
    }

    setQuery('');
    setResults([]);
  };

  const handleRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery);
    searchRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!results.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setQuery('');
          setResults([]);
          setSelectedIndex(-1);
          if (isModal && onClose) onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, isModal, onClose]);

  useEffect(() => {
    if (isModal && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isModal]);

  const getResultIcon = (type: SearchResult['type']) => {
    const iconMap = {
      api: Activity,
      notification: Bell,
      changelog: FileText,
      setting: Settings,
      team: Users,
      page: FileText,
    };
    return iconMap[type] || FileText;
  };

  const showResults = query.trim() && (results.length > 0 || isLoading);
  const showRecent = !query.trim() && recentSearches.length > 0;

  return (
    <div className={clsx('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setSelectedIndex(-1);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {(showResults || showRecent) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-1 p-2 border-b border-gray-200">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            {filters.map((filter) => (
              <button
                key={filter.type}
                onClick={() => setSelectedFilter(filter.type)}
                className={clsx(
                  'flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors',
                  selectedFilter === filter.type
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <filter.icon className="w-3 h-3" />
                <span>{filter.label}</span>
                {filter.count && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded">
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div ref={resultsRef} className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              </div>
            )}

            {showResults && !isLoading && (
              <>
                {results.map((result, index) => {
                  const Icon = getResultIcon(result.type);
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className={clsx(
                        'flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0',
                        selectedIndex === index && 'bg-blue-50'
                      )}
                    >
                      <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h4>
                        {result.description && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {result.description}
                          </p>
                        )}
                        {result.metadata && (
                          <div className="flex items-center space-x-2 mt-1">
                            {result.metadata.status && (
                              <span
                                className={clsx(
                                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                  result.metadata.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                )}
                              >
                                {result.metadata.status}
                              </span>
                            )}
                            {result.metadata.severity && (
                              <span
                                className={clsx(
                                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                  result.metadata.severity === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : result.metadata.severity === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                )}
                              >
                                {result.metadata.severity}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  );
                })}

                {results.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No results found for "{query}"</p>
                  </div>
                )}
              </>
            )}

            {showRecent && (
              <>
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Recent Searches
                  </h4>
                </div>
                {recentSearches.map((recentQuery, index) => (
                  <div
                    key={index}
                    onClick={() => handleRecentSearch(recentQuery)}
                    className="flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{recentQuery}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      <div className="relative z-10 flex items-start justify-center pt-16 px-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-6">
            <GlobalSearch
              isModal={true}
              onClose={onClose}
              placeholder="Search APIs, notifications, settings..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
