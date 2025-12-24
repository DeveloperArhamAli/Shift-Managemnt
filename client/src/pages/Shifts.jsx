import React, { useState, useEffect } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaClock,
    FaExclamationTriangle, FaSync,
    FaCalendarAlt, FaCheckCircle,
    FaTimesCircle, FaPalette,
    FaInfoCircle, FaUserClock
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatTo12Hour, formatShiftTiming, calculateDuration } from '../utils/timeFormatter';

const Shifts = () => {
    const { isAdmin } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        startTime: '',
        endTime: '',
        description: '',
        color: '#3b82f6',
        isActive: true
    });

    const BackendURL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BackendURL}/api/shifts`);
            const shiftsData = response.data.data || response.data || [];
            setShifts(Array.isArray(shiftsData) ? shiftsData : []);
        } catch (error) {
            console.error('Error fetching shifts:', error);
            toast.error('Failed to load shifts');
            setShifts([]);
        } finally {
            setLoading(false);
        }
    };

    const initializeDefaultShifts = async () => {
        try {
            await axios.post(`${BackendURL}/api/shifts/initialize`);
            toast.success('Default shifts initialized successfully');
            fetchShifts();
        } catch (error) {
            console.error('Error initializing shifts:', error);
            toast.error(error.response?.data?.message || 'Failed to initialize shifts');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedShift) {
                await axios.put(`${BackendURL}/api/shifts/${selectedShift._id}`, formData);
                toast.success('Shift updated successfully');
            } else {
                await axios.post(`${BackendURL}/api/shifts`, formData);
                toast.success('Shift created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchShifts();
        } catch (error) {
            console.error('Error saving shift:', error);
            toast.error(error.response?.data?.message || 'Failed to save shift');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${BackendURL}/api/shifts/${selectedShift._id}`);
            toast.success('Shift deleted successfully');
            setShowDeleteModal(false);
            fetchShifts();
        } catch (error) {
            console.error('Error deleting shift:', error);
            toast.error(error.response?.data?.message || 'Failed to delete shift');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            startTime: '',
            endTime: '',
            description: '',
            color: '#3b82f6',
            isActive: true
        });
        setSelectedShift(null);
    };

    const handleEdit = (shift) => {
        setSelectedShift(shift);
        setFormData({
            name: shift.name,
            code: shift.code,
            startTime: shift.startTime,
            endTime: shift.endTime,
            description: shift.description || '',
            color: shift.color || '#3b82f6',
            isActive: shift.isActive !== undefined ? shift.isActive : true
        });
        setShowModal(true);
    };

    const handleAddNew = () => {
        resetForm();
        setShowModal(true);
    };

    const getShiftBadge = (shift) => {
        return (
            <span
                style={{ backgroundColor: shift.color }}
                className="text-white px-3 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-1"
            >
                <FaClock />
                {shift.name}
            </span>
        );
    };

    const getCurrentShift = () => {
        if (!Array.isArray(shifts) || shifts.length === 0) {
            return null;
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        for (const shift of shifts) {
            if (!shift.startTime || !shift.endTime) continue;

            const [startHour, startMinute] = shift.startTime.split(':').map(Number);
            const [endHour, endMinute] = shift.endTime.split(':').map(Number);
            
            const startTime = startHour * 60 + startMinute;
            let endTime = endHour * 60 + endMinute;
            
            if (endTime < startTime) {
                endTime += 24 * 60;
                const adjustedCurrentTime = currentTime < startTime ? 
                    currentTime + 24 * 60 : currentTime;
                
                if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
                    return shift;
                }
            } else {
                if (currentTime >= startTime && currentTime < endTime) {
                    return shift;
                }
            }
        }
        return null;
    };

    // Use the imported calculateDuration function
    // Remove the local calculateDuration function since we're importing it

    const currentShift = getCurrentShift();

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-50 to-blue-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Shift Management</h1>
                            <p className="text-gray-600 mt-1">Configure and manage work shifts</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={initializeDefaultShifts}
                                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <FaSync />
                                Initialize Default Shifts
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={handleAddNew}
                                    className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                                >
                                    <FaPlus />
                                    Add Shift
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Current Shift Alert */}
                {currentShift && (
                    <div className="mb-6 bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <FaUserClock className="text-blue-600 text-xl" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-blue-800">Current Active Shift</h3>
                                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                        LIVE NOW
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gray-800">{currentShift.name}</span>
                                        <div 
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: currentShift.color || '#3b82f6' }}
                                        ></div>
                                    </div>
                                    <div className="text-gray-700">
                                        <FaClock className="inline mr-2 text-gray-400" />
                                        {formatShiftTiming(currentShift.startTime, currentShift.endTime)}
                                    </div>
                                    {currentShift.description && (
                                        <div className="text-sm text-gray-600">
                                            {currentShift.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shifts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {Array.isArray(shifts) && shifts.map(shift => (
                        <div 
                            key={shift._id} 
                            className="bg-white rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                            style={{ borderLeft: `4px solid ${shift.color || '#3b82f6'}` }}
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-1">{shift.name}</h4>
                                        <p className="text-sm text-gray-500">{shift.description}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        shift.isActive 
                                            ? 'bg-emerald-100 text-emerald-800' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {shift.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Timing:</span>
                                        <span className="font-medium text-gray-800">
                                            {formatShiftTiming(shift.startTime, shift.endTime)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Duration:</span>
                                        <span className="font-medium text-gray-800">
                                            {calculateDuration(shift.startTime, shift.endTime)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Shift Code:</span>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                                            {shift.code}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: shift.color || '#3b82f6' }}
                                        >
                                            <FaClock className="text-white text-sm" />
                                        </div>
                                        {currentShift?._id === shift._id && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(shift)}
                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                                                title="Edit Shift"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedShift(shift);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                                                title="Delete Shift"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Shifts Table */}
                <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">All Shifts</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Total: {Array.isArray(shifts) ? shifts.length : 0} shifts configured
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchShifts}
                                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                title="Refresh"
                            >
                                <FaSync />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading shifts...</p>
                            </div>
                        </div>
                    ) : !Array.isArray(shifts) || shifts.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCalendarAlt className="text-gray-400 text-2xl" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-2">No shifts found</h4>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                Click "Initialize Default Shifts" to create the standard 3-shift system
                            </p>
                            <button
                                onClick={initializeDefaultShifts}
                                className="inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
                            >
                                <FaSync />
                                Initialize Default Shifts
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200/50">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Shift Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Timing (12-hour format)
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Description
                                        </th>
                                        {isAdmin && (
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200/50">
                                    {shifts.map(shift => (
                                        <tr key={shift._id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="w-3 h-8 rounded"
                                                        style={{ backgroundColor: shift.color || '#3b82f6' }}
                                                    ></div>
                                                    <div>
                                                        <div className="font-medium text-gray-800">{shift.name}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                                {shift.code}
                                                            </span>
                                                            {currentShift?._id === shift._id && (
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                                    Current
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-gray-800">
                                                        {formatShiftTiming(shift.startTime, shift.endTime)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {calculateDuration(shift.startTime, shift.endTime)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {shift.isActive ? (
                                                        <>
                                                            <FaCheckCircle className="text-emerald-500" />
                                                            <span className="text-emerald-700 font-medium">Active</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaTimesCircle className="text-gray-400" />
                                                            <span className="text-gray-600 font-medium">Inactive</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 max-w-50 line-clamp-2">
                                                    {shift.description || 'No description'}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(shift)}
                                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedShift(shift);
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

            {/* Add/Edit Shift Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-8 mx-auto p-4 w-full max-w-2xl">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {selectedShift ? 'Edit Shift' : 'Add New Shift'}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Shift Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Shift Name *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Morning Shift"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Shift Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Shift Code *
                                        </label>
                                        <select
                                            value={formData.code}
                                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Select code...</option>
                                            <option value="shift1">shift1</option>
                                            <option value="shift2">shift2</option>
                                            <option value="shift3">shift3</option>
                                        </select>
                                    </div>

                                    {/* Start Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* End Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Color */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Shift Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => setFormData({...formData, color: e.target.value})}
                                                className="w-12 h-12 cursor-pointer rounded-lg border border-gray-300"
                                            />
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FaPalette className="text-gray-400" />
                                                <span>Pick a color</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={formData.isActive}
                                            onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                        >
                                            <option value={true}>Active</option>
                                            <option value={false}>Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g., Morning shift for regular employees"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                    />
                                </div>

                                {/* Color Preview */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-10 h-10 rounded-lg"
                                            style={{ backgroundColor: formData.color }}
                                        ></div>
                                        <div>
                                            <div className="font-medium text-gray-800">Color Preview</div>
                                            <div className="text-sm text-gray-600">
                                                This color will be used for shift identification
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Duration Info */}
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <FaClock className="text-blue-600" />
                                        <div>
                                            <div className="font-medium text-blue-800">Shift Duration</div>
                                            <div className="text-blue-700">
                                                {formData.startTime && formData.endTime 
                                                    ? calculateDuration(formData.startTime, formData.endTime)
                                                    : 'Set times to see duration'}
                                            </div>
                                            {formData.startTime && formData.endTime && (
                                                <div className="text-sm text-blue-600 mt-1">
                                                    Display: {formatShiftTiming(formData.startTime, formData.endTime)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="mt-8 pt-6 border-t border-gray-200/50">
                                    <button
                                        type="submit"
                                        className="w-full px-6 py-4 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold"
                                    >
                                        {selectedShift ? 'Update Shift' : 'Create Shift'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedShift && (
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
                                    Are you sure you want to delete shift{' '}
                                    <strong className="text-gray-800">{selectedShift.name}</strong>?
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
                                        Delete Shift
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

export default Shifts;