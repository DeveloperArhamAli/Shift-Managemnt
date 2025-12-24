import React, { useState, useEffect } from 'react';
import {
    FaUser, FaEnvelope, FaPhone, FaClock,
    FaCalendar, FaEdit, FaSave, FaTimes,
    FaHistory, FaKey, FaCalendarAlt,
    FaCheckCircle, FaTimesCircle,
    FaHourglassHalf, FaArrowRight,
    FaArrowLeft, FaLock, FaEye,
    FaEyeSlash, FaUsers
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        shift: '',
        weeklyOff: [],
        customTiming: { start: '', end: '' }
    });
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const BackendURL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        if (user) {
            fetchProfileData();
            fetchLeaveHistory();
            fetchAttendanceHistory();
        }
    }, [user]);

    const fetchProfileData = () => {
        setProfileData({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            shift: user?.shift || 'shift1',
            weeklyOff: user?.weeklyOff || [],
            customTiming: user?.customTiming || { start: '09:00', end: '17:00' }
        });
    };

    const fetchLeaveHistory = async () => {
        try {
            let response;
            if (user?.role === 'admin') {
                // For admin, fetch all leaves but we'll filter to show only their own
                response = await axios.get(`${BackendURL}/api/leaves`);
                // Filter to show only admin's own leaves
                const adminLeaves = response.data.data.filter(leave => 
                    leave.employee?._id === user._id || leave.employeeId === user._id
                );
                setLeaveHistory(adminLeaves);
            } else {
                // For employees, fetch their own leaves
                response = await axios.get(`${BackendURL}/api/leaves/employee/${user?._id}`);
                setLeaveHistory(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching leave history:', error);
            setLeaveHistory([]);
        }
    };

    const fetchAttendanceHistory = async () => {
        try {
            const response = await axios.get(`${BackendURL}/api/employees/${user?._id}/attendance`);
            setAttendanceHistory(response.data.data || []);
        } catch (error) {
            console.error('Error fetching attendance history:', error);
            setAttendanceHistory([]);
        }
    };

    const handleProfileUpdate = async () => {
        try {
            const result = await updateProfile({
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone
            });
            
            if (result.success) {
                setEditMode(false);
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        }
    };

    const getShiftInfo = (shift) => {
        const shiftInfo = {
            shift1: { name: 'Shift 1', timing: '9:00 AM - 5:00 PM', color: 'bg-blue-100 text-blue-800' },
            shift2: { name: 'Shift 2', timing: '5:00 PM - 1:00 AM', color: 'bg-amber-100 text-amber-800' },
            shift3: { name: 'Shift 3', timing: '1:00 AM - 9:00 AM', color: 'bg-purple-100 text-purple-800' },
        };
        return shiftInfo[shift] || shiftInfo.shift1;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            present: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Present' },
            absent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Absent' },
            half_day: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Half Day' },
            on_leave: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'On Leave' }
        };
        return statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    };

    const getLeaveTypeBadge = (type) => {
        const typeConfig = {
            planned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planned' },
            emergency: { bg: 'bg-red-100', text: 'text-red-800', label: 'Emergency' },
            sick: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Sick' },
            casual: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Casual' }
        };
        return typeConfig[type] || { bg: 'bg-gray-100', text: 'text-gray-800', label: type };
    };

    const getLeaveStatusBadge = (status) => {
        const statusConfig = {
            approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <FaCheckCircle />, label: 'Approved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <FaTimesCircle />, label: 'Rejected' },
            pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <FaHourglassHalf />, label: 'Pending' }
        };
        return statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaClock />, label: status };
    };

    const shiftInfo = getShiftInfo(user?.shift);

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-50 to-blue-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                            <p className="text-gray-600 mt-1">
                                {user?.role === 'admin' ? 'Admin Profile - Viewing personal information' : 'Manage your personal information and history'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {user?.role === 'admin' && (
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                                    <FaUsers />
                                    Admin Account
                                </span>
                            )}
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                    editMode 
                                        ? 'border border-red-300 text-red-600 hover:bg-red-50' 
                                        : 'border border-blue-300 text-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                {editMode ? (
                                    <>
                                        <FaTimes />
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <FaEdit />
                                        Edit Profile
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* Sidebar - User Info Card */}
                    <div className="w-2/4">
                        <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm p-6 sticky top-6">
                            <div className="text-center mb-6">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                    user?.role === 'admin' 
                                        ? 'bg-linear-to-br from-red-600 to-red-700' 
                                        : 'bg-linear-to-br from-primary-600 to-primary-700'
                                }`}>
                                    <FaUser className="text-white text-3xl" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{user?.name}</h3>
                                <p className="text-gray-600 text-sm mb-3">{user?.email}</p>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    user?.role === 'admin' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {user?.role?.toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <FaPhone className="text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Phone</div>
                                        <div className="font-medium text-gray-800">{user?.phone || 'Not provided'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <FaClock className="text-gray-600" />
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <div className="text-sm text-gray-500">Shift</div>
                                        <div className="flex items-center gap-1">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${shiftInfo.color}`}>
                                                {shiftInfo.name}
                                            </span>
                                            <div className="text-sm text-gray-600">{shiftInfo.timing}</div>
                                        </div>
                                    </div>
                                </div>

                                {user?.weeklyOff && user.weeklyOff.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <FaCalendar className="text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Weekly Off</div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {user.weeklyOff.map(day => (
                                                    <span key={day} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Tabs */}
                    <div className="w-170">
                        {/* Tabs Navigation */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1 mb-6">
                            <div className="flex space-x-1">
                                {[
                                    { id: 'profile', label: 'Profile Info', icon: <FaUser /> },
                                    { id: 'leaves', label: 'My Leaves', icon: <FaCalendarAlt /> },
                                    { id: 'attendance', label: 'My Attendance', icon: <FaHistory /> }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            activeTab === tab.id
                                                ? 'bg-white text-primary-600 shadow-sm border border-gray-200'
                                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
                                        }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Profile Information Tab */}
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">Profile Information</h3>
                                    {user?.role === 'admin' && (
                                        <span className="text-sm text-gray-500">
                                            Administrative privileges active
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({
                                                ...profileData,
                                                name: e.target.value
                                            })}
                                            className={`w-full px-4 py-3 border ${editMode ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent`}
                                            disabled={!editMode}
                                        />
                                    </div>

                                    {/* Email Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({
                                                ...profileData,
                                                email: e.target.value
                                            })}
                                            className={`w-full px-4 py-3 border ${editMode ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent`}
                                            disabled={!editMode}
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({
                                                ...profileData,
                                                phone: e.target.value
                                            })}
                                            className={`w-full px-4 py-3 border ${editMode ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent`}
                                            disabled={!editMode}
                                        />
                                    </div>

                                    {/* Shift */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Shift
                                        </label>
                                        <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${shiftInfo.color}`}>
                                                {shiftInfo.name}
                                            </span>
                                            <div className="text-sm text-gray-600 mt-1">{shiftInfo.timing}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Weekly Off Days */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Weekly Off Days
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                                        {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                                            <div key={day} className="text-center">
                                                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                                    user?.weeklyOff?.includes(day)
                                                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {editMode && (
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={handleProfileUpdate}
                                            className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold"
                                        >
                                            <FaSave />
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Leave History Tab */}
                        {activeTab === 'leaves' && (
                            <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200/50">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {user?.role === 'admin' ? 'My Leave Applications' : 'My Leave History'}
                                        </h3>
                                        <span className="text-sm text-gray-500">
                                            Showing personal leave records
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {leaveHistory.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaCalendarAlt className="text-gray-400 text-xl" />
                                            </div>
                                            <h4 className="text-gray-700 font-medium mb-2">No Leave History</h4>
                                            <p className="text-gray-500">
                                                {user?.role === 'admin' 
                                                    ? "You haven't applied for any leaves as admin" 
                                                    : "You haven't applied for any leaves yet"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="bg-gray-50/50 border-b border-gray-200/50">
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Period
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Reason
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Type & Status
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Duration
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200/50">
                                                    {leaveHistory.map(leave => {
                                                        const typeBadge = getLeaveTypeBadge(leave.type);
                                                        const statusBadge = getLeaveStatusBadge(leave.status);
                                                        return (
                                                            <tr key={leave._id} className="hover:bg-gray-50/30 transition-colors">
                                                                <td className="px-4 py-4">
                                                                    <div className="font-medium text-gray-800">
                                                                        {moment(leave.startDate).format('MMM DD')} - {moment(leave.endDate).format('MMM DD')}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {moment(leave.createdAt).format('MMM DD, YYYY')}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="text-sm text-gray-800 max-w-[200px] line-clamp-2">
                                                                        {leave.reason}
                                                                    </div>
                                                                    {leave.notes && (
                                                                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                                            Note: {leave.notes}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="space-y-2">
                                                                        <span className={`${typeBadge.bg} ${typeBadge.text} px-3 py-1 rounded-full text-xs font-semibold inline-block`}>
                                                                            {typeBadge.label}
                                                                        </span>
                                                                        <div className={`${statusBadge.bg} ${statusBadge.text} px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}>
                                                                            {statusBadge.icon}
                                                                            {statusBadge.label}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="font-medium text-gray-800">
                                                                        {moment(leave.endDate).diff(moment(leave.startDate), 'days') + 1} days
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Attendance History Tab */}
                        {activeTab === 'attendance' && (
                            <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200/50">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {user?.role === 'admin' ? 'My Attendance Record' : 'My Attendance History'}
                                        </h3>
                                        <span className="text-sm text-gray-500">
                                            Personal attendance tracking
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {attendanceHistory.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaHistory className="text-gray-400 text-xl" />
                                            </div>
                                            <h4 className="text-gray-700 font-medium mb-2">No Attendance Record</h4>
                                            <p className="text-gray-500">
                                                {user?.role === 'admin' 
                                                    ? "No attendance records found for admin account" 
                                                    : "No attendance history found"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="bg-gray-50/50 border-b border-gray-200/50">
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Shift & Status
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Timings
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Hours
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200/50">
                                                    {attendanceHistory.map(record => {
                                                        const statusBadge = getStatusBadge(record.status);
                                                        const shiftColor = record.shift === 'shift1' ? 'bg-blue-100 text-blue-800' :
                                                                           record.shift === 'shift2' ? 'bg-amber-100 text-amber-800' :
                                                                           'bg-purple-100 text-purple-800';
                                                        return (
                                                            <tr key={record._id} className="hover:bg-gray-50/30 transition-colors">
                                                                <td className="px-4 py-4">
                                                                    <div className="font-medium text-gray-800">
                                                                        {moment(record.date).format('MMM DD, YYYY')}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {moment(record.date).format('dddd')}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="space-y-2">
                                                                        <span className={`${shiftColor} px-3 py-1 rounded-full text-xs font-semibold inline-block`}>
                                                                            {record.shift}
                                                                        </span>
                                                                        <span className={`${statusBadge.bg} ${statusBadge.text} px-3 py-1 rounded-full text-xs font-semibold inline-block`}>
                                                                            {statusBadge.label}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="space-y-1">
                                                                        <div className="text-sm text-gray-800">
                                                                            In: {record.checkIn ? moment(record.checkIn).format('hh:mm A') : '--'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-800">
                                                                            Out: {record.checkOut ? moment(record.checkOut).format('hh:mm A') : '--'}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="font-medium text-gray-800">
                                                                        {record.totalHours || '--'} hrs
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;