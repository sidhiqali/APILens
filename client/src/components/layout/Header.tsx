'use client';

import { Bell, Menu, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/auth';

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex w-full bg-white border-b border-gray-200">
      <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="block rounded-sm border border-gray-300 bg-white p-1.5 shadow-sm hover:bg-gray-50 lg:hidden"
          >
            <Menu className="text-gray-600" />
          </button>
          <Link className="block flex-shrink-0 lg:hidden" href="/dashboard">
            <h1 className="text-xl font-semibold text-gray-900">APILens</h1>
          </Link>
        </div>

        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold text-gray-900">APILens</h1>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <li>
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} />
              </button>
            </li>
          </ul>

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="hidden text-right lg:block">
                <span className="block text-sm font-medium text-gray-900">
                  {user?.email || 'User'}
                </span>
                <span className="block text-xs text-gray-600">
                  {user?.email || 'user@example.com'}
                </span>
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
