import React, { useState, useEffect } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaSearch,
    FaUserPlus, FaFilter, FaSync,
    FaPhone, FaEnvelope, FaIdCard,
    FaCalendarTimes, FaClock, FaCheckCircle,
    FaTimesCircle, FaUserFriends
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Employees = () => {
    const { isAdmin } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterShift, setFilterShift] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        shift: 'shift1',
        customTiming: { start: '09:00', end: '17:00' },
        weeklyOff: [],
        role: 'employee',
        status: 'active'
    });

    const BackendURL = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BackendURL}/api/employees`);
            setEmployees(response.data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedEmployee) {
                // Update existing employee
                await axios.put(`${BackendURL}/api/employees/${selectedEmployee._id}`, formData);
                toast.success('Employee updated successfully');
            } else {
                // Create new employee
                await axios.post(`${BackendURL}/api/employees`, formData);
                toast.success('Employee created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchEmployees();
        } catch (error) {
            console.error('Error saving employee:', error);
            toast.error(error.response?.data?.message || 'Failed to save employee');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${BackendURL}/api/employees/${selectedEmployee._id}`);
            toast.success('Employee deleted successfully');
            setShowDeleteModal(false);
            fetchEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.error('Failed to delete employee');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            shift: 'shift1',
            customTiming: { start: '09:00', end: '17:00' },
            weeklyOff: [],
            role: 'employee',
            status: 'active'
        });
        setSelectedEmployee(null);
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            name: employee.name,
            email: employee.email,
            password: '',
            phone: employee.phone,
            shift: employee.shift,
            customTiming: employee.customTiming || { start: '09:00', end: '17:00' },
            weeklyOff: employee.weeklyOff || [],
            role: employee.role,
            status: employee.status
        });
        setShowModal(true);
    };

    const handleAddNew = () => {
        resetForm();
        setShowModal(true);
    };

    const getShiftBadge = (shift) => {
        const shiftConfig = {
            shift1: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Shift 1' },
            shift2: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Shift 2' },
            shift3: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shift 3' },
        };
        const config = shiftConfig[shift] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
        return (
            <span className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full text-xs font-semibold`}>
                {config.label}
            </span>
        );
    };

    const getRoleBadge = (role) => {
        const config = role === 'admin' 
            ? { bg: 'bg-red-100', text: 'text-red-800', icon: '👑' }
            : { bg: 'bg-blue-100', text: 'text-blue-800', icon: '👤' };
        return (
            <span className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}>
                <span>{config.icon}</span>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const config = status === 'active'
            ? { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle /> }
            : { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaTimesCircle /> };
        return (
            <span className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}>
                {config.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getShiftTiming = (employee) => {
    const formatTime = (time24) => {
        if (!time24 || !time24.includes(':')) return time24;
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    if (employee.customTiming?.start && employee.customTiming?.end) {
        return `${formatTime(employee.customTiming.start)} - ${formatTime(employee.customTiming.end)}`;
    }
    
    const shiftMap = {
        'shift1': '8:00 AM - 6:00 PM',
        'shift2': '2:00 PM - 1:00 AM', 
        'shift3': '7:00 PM - 9:00 AM'
    };
    
    return shiftMap[employee.shift];
};

    const filteredEmployees = employees.filter(employee => {
        const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesShift = filterShift === 'all' || employee.shift === filterShift;
        const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
        return matchesSearch && matchesShift && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-50 to-blue-50 w-full">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
                <div className="px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Employees Management</h1>
                            <p className="text-gray-600 mt-1">Manage your team members and their details</p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                            >
                                <FaUserPlus />
                                Add Employee
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filters Card */}
                <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <select
                                value={filterShift}
                                onChange={(e) => setFilterShift(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent bg-white"
                            >
                                <option value="all">All Shifts</option>
                                <option value="shift1">Shift 1</option>
                                <option value="shift2">Shift 2</option>
                                <option value="shift3">Shift 3</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <button
                                onClick={fetchEmployees}
                                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                title="Refresh"
                            >
                                <FaSync />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Employee List</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Total: {filteredEmployees.length} employees
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                                Showing {filteredEmployees.length} of {employees.length}
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading employees...</p>
                            </div>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaUserFriends className="text-gray-400 text-2xl" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-2">No employees found</h4>
                            <p className="text-gray-500 max-w-md mx-auto">
                                {searchTerm || filterShift !== 'all' || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No employees have been added yet'}
                            </p>
                            {isAdmin && !searchTerm && (
                                <button
                                    onClick={handleAddNew}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    <FaPlus />
                                    Add your first employee
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200/50">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Shift & Timing
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Role & Status
                                        </th>
                                        {isAdmin && (
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200/50">
                                    {filteredEmployees.sort((a, b) => (a.shift > b.shift) ? 1 : -1).map(employee => (
                                        <tr key={employee._id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                                                        <span className="text-white font-semibold text-sm">
                                                            {employee.name?.charAt(0) || 'E'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800">{employee.name}</div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                                                <FaIdCard className="text-gray-400" />
                                                                {employee.employeeId}
                                                            </span>
                                                            {employee.weeklyOff?.length > 0 && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded">
                                                                    <FaCalendarTimes />
                                                                    Off: {
                                                                        employee.weeklyOff?.length > 1
                                                                            ? `${employee.weeklyOff?.length} days`
                                                                            : `${employee.weeklyOff?.length} day`
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <FaEnvelope className="text-gray-400" />
                                                        <span className="truncate max-w-45">{employee.email}</span>
                                                    </div>
                                                    {employee.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <FaPhone className="text-gray-400" />
                                                            {employee.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-center">
                                                    {getShiftBadge(employee.shift)}
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <FaClock className="text-gray-400" />
                                                        <p className='text-xs'>{getShiftTiming(employee)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {getRoleBadge(employee.role)}
                                                    {getStatusBadge(employee.status)}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(employee)}
                                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEmployee(employee);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Employee Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-8 mx-auto p-4 w-full max-w-2xl">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FaTimesCircle className="text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter full name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter email address"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="Enter phone number"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Shift */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Shift Schedule *
                                        </label>
                                        <select
                                            value={formData.shift}
                                            onChange={(e) => setFormData({...formData, shift: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                        >
                                            <option value="shift1">Shift 1 (8 AM - 6 PM)</option>
                                            <option value="shift2">Shift 2 (4 PM - 1 AM)</option>
                                            <option value="shift3">Shift 3 (7 PM - 9 AM)</option>
                                        </select>
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role *
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status *
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>

                                    {/* Password for new employees */}
                                    {!selectedEmployee && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="Enter password (min. 6 characters)"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Weekly Off Days */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Weekly Off Days
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                        {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                                            <label key={day} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.weeklyOff.includes(day)}
                                                    onChange={(e) => {
                                                        const weeklyOff = [...formData.weeklyOff];
                                                        if (e.target.checked) {
                                                            weeklyOff.push(day);
                                                        } else {
                                                            const index = weeklyOff.indexOf(day);
                                                            if (index > -1) {
                                                                weeklyOff.splice(index, 1);
                                                            }
                                                        }
                                                        setFormData({...formData, weeklyOff});
                                                    }}
                                                    className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="mt-8 pt-6 border-t border-gray-200/50">
                                    <button
                                        type="submit"
                                        className="w-full px-6 py-4 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold"
                                    >
                                        {selectedEmployee ? 'Update Employee' : 'Create Employee'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-8 mx-auto p-4 w-full max-w-md">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                                    <FaTrash className="text-red-600 text-2xl" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
                                    Confirm Delete
                                </h3>
                                <p className="text-gray-600 text-center mb-6">
                                    Are you sure you want to delete employee{' '}
                                    <strong className="text-gray-800">{selectedEmployee.name}</strong>?
                                    This action cannot be undone.
                                </p>
                                <div className="flex justify-center space-x-4">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Delete Employee
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;