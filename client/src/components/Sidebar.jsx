import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    FaTachometerAlt, FaUsers, FaCalendarAlt, 
    FaClock, FaUser, FaCog, FaChartLine,
    FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { isAdmin, user } = useAuth();

    const menuItems = [
        {
            title: 'Dashboard',
            path: '/',
            icon: <FaTachometerAlt />,
            allowed: true,
            color: 'text-blue-600'
        },
        {
            title: 'Employees',
            path: '/employees',
            icon: <FaUsers />,
            allowed: true,
            color: 'text-emerald-600'
        },
        {
            title: 'Leaves',
            path: '/leaves',
            icon: <FaCalendarAlt />,
            allowed: true,
            color: 'text-amber-600'
        },
        {
            title: 'Shifts',
            path: '/shifts',
            icon: <FaClock />,
            allowed: isAdmin,
            color: 'text-purple-600'
        },
        {
            title: 'Profile',
            path: '/profile',
            icon: <FaUser />,
            allowed: true,
            color: 'text-primary-600'
        },
    ];

    return (
        <aside className="hidden lg:flex lg:w-64 flex-col bg-white/80 backdrop-blur-sm border-r border-gray-200/50 h-screen fixed z-10">

            {/* Navigation Menu */}
            <div className="py-6">
                <nav className="space-y-1 px-4">
                    {menuItems
                        .filter(item => item.allowed)
                        .map((item, index) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={index}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-l-4 border-primary-500 text-primary-700 font-semibold'
                                            : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-800'
                                    }`}
                                >
                                    <span className={`text-lg ${isActive ? item.color : 'text-gray-400'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="font-medium">{item.title}</span>
                                    {isActive && (
                                        <span className="ml-auto w-2 h-2 rounded-full bg-primary-500"></span>
                                    )}
                                </Link>
                            );
                        })}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200/50">
                <p className="text-xs text-gray-500 text-center">
                    Copyright © {new Date().getFullYear()}
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                    Developed by{' '} <span className="font-semibold text-primary-600">Tanveer Anjum</span>
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;