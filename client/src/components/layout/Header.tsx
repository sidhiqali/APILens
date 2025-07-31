
'use client';

import { Bell, Menu, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const Header = (props: {
    sidebarOpen: string | boolean | undefined;
    setSidebarOpen: (arg0: boolean) => void;
}) => {
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        if (darkMode) {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
    };


    return (
        <header className="sticky top-0 z-10 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
            <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                    <button
                        aria-controls="sidebar"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.setSidebarOpen(!props.sidebarOpen);
                        }}
                        className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
                    >
                        <Menu />
                    </button>
                    <Link className="block flex-shrink-0 lg:hidden" href="/">
                        <h1 className="text-xl font-semibold">API Monitor</h1>
                    </Link>
                </div>

                <div className="hidden sm:block">
                    <h1 className="text-xl font-semibold">API Monitor</h1>
                </div>

                <div className="flex items-center gap-3 2xsm:gap-7">
                    <ul className="flex items-center gap-2 2xsm:gap-4">
                        <li>
                            <button onClick={toggleDarkMode} className="p-2 text-gray-400 hover:text-gray-600">
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        </li>
                        <li>
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Bell size={20} />
                            </button>
                        </li>
                    </ul>

                    <div className="relative">
                        <Link className="flex items-center gap-4" href="#">
                            <span className="hidden text-right lg:block">
                                <span className="block text-sm font-medium text-black dark:text-white">User</span>
                                <span className="block text-xs">user@example.com</span>
                            </span>
                            <span className="h-12 w-12 rounded-full">
                                <img src="/images/user.png" alt="User" />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
