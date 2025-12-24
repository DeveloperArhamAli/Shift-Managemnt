import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaHome, 
    FaUser, 
    FaSignOutAlt, 
    FaBell, 
    FaCog, 
    FaBars,
    FaChevronDown,
    FaUsers
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import LogoImage from "../assets/images/expresslogo.jpg";

const CustomNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg fixed w-full z-10">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 ">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Logo and Brand */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white mr-2"
                        >
                            <FaBars className="h-5 w-5" />
                        </button>

                        {/* Logo and Brand */}
                        <Link to="/" className="flex items-center space-x-3 -mx-3">
                            <div className="flex items-center justify-center">
                                <img 
                                    src={LogoImage} 
                                    alt="Logo" 
                                    className="w-18 h-18 md:w-20 md:h-20 object-contain"
                                />
                            </div>
                            <div className="hidden md:block">
                                <span className="font-bold text-lg">Shift Management</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links - Center */}
                    <div className="hidden lg:flex items-center space-x-6 ml-8">
                        <Link
                            to="/"
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 hover:text-white transition-colors"
                        >
                            <FaHome className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                        
                        {user?.role === 'admin' && (
                            <Link
                                to="/employees"
                                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 hover:text-white transition-colors"
                            >
                                <FaUsers className="h-4 w-4" />
                                <span>Employees</span>
                            </Link>
                        )}
                    </div>

                    {/* Right side - User menu */}
                    <div className="flex items-center space-x-4">
                        {/* User dropdown */}
                        <div className="relative">
                            <button
                                onClick={toggleUserMenu}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                            >
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-800 border-2 border-white/20">
                                    <FaUser className="h-5 w-5" />
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="font-semibold text-sm">{user?.name || 'User'}</div>
                                    <div className="text-xs text-blue-200">{user?.role.charAt(0).toUpperCase() + user?.role.slice(1) || 'Role'}</div>
                                </div>
                                <FaChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown menu */}
                            {userMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setUserMenuOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-20 border border-gray-200">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="font-semibold text-gray-800">{user?.name}</div>
                                            <div className="text-sm text-gray-600">{user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}</div>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <FaUser className="h-4 w-4 mr-3" />
                                            <span>My Profile</span>
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <FaSignOutAlt className="h-4 w-4 mr-3" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden bg-blue-700 border-t border-blue-800">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <Link
                                to="/"
                                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 hover:text-white transition-colors"
                                onClick={closeMobileMenu}
                            >
                                <FaHome className="h-5 w-5" />
                                <span>Dashboard</span>
                            </Link>
                            
                            {user?.role === 'admin' && (
                                <Link
                                    to="/employees"
                                    className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 hover:text-white transition-colors"
                                    onClick={closeMobileMenu}
                                >
                                    <FaUsers className="h-5 w-5" />
                                    <span>Employees</span>
                                </Link>
                            )}
                            
                            <Link
                                to="/profile"
                                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 hover:text-white transition-colors"
                                onClick={closeMobileMenu}
                            >
                                <FaUser className="h-5 w-5" />
                                <span>My Profile</span>
                            </Link>
                            
                            <Link
                                to="/settings"
                                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 hover:text-white transition-colors"
                                onClick={closeMobileMenu}
                            >
                                <FaCog className="h-5 w-5" />
                                <span>Settings</span>
                            </Link>
                            
                            <button
                                onClick={() => {
                                    closeMobileMenu();
                                    handleLogout();
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-red-600 hover:text-white transition-colors"
                            >
                                <FaSignOutAlt className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default CustomNavbar;