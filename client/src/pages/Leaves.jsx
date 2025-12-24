import React, { useState, useEffect } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaSearch,
    FaCalendarPlus, FaFilter, FaCheck,
    FaTimes, FaClock, FaUser,
    FaCalendarAlt, FaCalendarDay,
    FaHourglassHalf, FaExclamationCircle,
    FaInfoCircle, FaSync, FaCalendarTimes,
    FaRegCalendarCheck, FaRegCalendarTimes,
    FaCalendar, FaList, FaTh
} from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';

const Leaves = () => {
    const { user, isAdmin } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [employees, setEmployees] = useState([]); // Add employees state
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [leavesByDate, setLeavesByDate] = useState({});
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [formData, setFormData] = useState({
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().add(1, 'days').format('YYYY-MM-DD'),
        reason: '',
        type: 'planned',
        notes: ''
    });

    const BackendURL = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        if (viewMode === 'list') {
            fetchLeaves();
        } else {
            fetchCalendarLeaves();
        }
        fetchEmployees(); // Fetch employees for admin dropdown
    }, [activeTab, viewMode, selectedDate]);

    useEffect(() => {
        if (viewMode === 'calendar') {
            fetchCalendarLeaves();
        }
    }, [selectedDate.getMonth()]); // Refetch when month changes

    // Add fetchEmployees function
    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${BackendURL}/api/employees`);
            setEmployees(response.data.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            let url = `${BackendURL}/api/leaves`;
            
            if (activeTab !== 'all') {
                url = `${BackendURL}/api/leaves/status/${activeTab}`;
            }
            
            const response = await axios.get(url);
            setLeaves(response.data.data);
        } catch (error) {
            console.error('Error fetching leaves:', error);
            toast.error('Failed to load leaves');
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendarLeaves = async () => {
        try {
            setCalendarLoading(true);
            const startDate = moment(selectedDate).startOf('month').format('YYYY-MM-DD');
            const endDate = moment(selectedDate).endOf('month').format('YYYY-MM-DD');
            
            const response = await axios.get(`${BackendURL}/api/leaves/bydate`, {
                params: { startDate, endDate }
            });
            
            setLeavesByDate(response.data.data || {});
        } catch (error) {
            console.error('Error fetching calendar leaves:', error);
            toast.error('Failed to load calendar data');
        } finally {
            setCalendarLoading(false);
        }
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        fetchLeavesForDate(date);
    };

    const fetchLeavesForDate = async (date) => {
        try {
            setLoading(true);
            const dateStr = moment(date).format('YYYY-MM-DD');
            const startDate = moment(date).startOf('month').format('YYYY-MM-DD');
            const endDate = moment(date).endOf('month').format('YYYY-MM-DD');
            
            const response = await axios.get(`${BackendURL}/api/leaves/bydate`, {
                params: { startDate, endDate }
            });
            
            setLeavesByDate(response.data.data || {});
            
            // Filter leaves for the selected date
            const leavesForDate = response.data.data[dateStr] || [];
            setLeaves(leavesForDate);
            setViewMode('list');
            setActiveTab('all');
        } catch (error) {
            console.error('Error fetching leaves for date:', error);
            toast.error('Failed to load leaves for selected date');
        } finally {
            setLoading(false);
        }
    };

    // Add handleAddNew function
    const handleAddNew = () => {
        resetForm();
        setShowModal(true);
    };

    // Add handleEdit function
    const handleEdit = (leave) => {
        if (!isAdmin && leave.employee._id !== user?._id) {
            toast.error('You can only edit your own leaves');
            return;
        }

        setSelectedLeave(leave);
        setFormData({
            startDate: moment(leave.startDate).format('YYYY-MM-DD'),
            endDate: moment(leave.endDate).format('YYYY-MM-DD'),
            reason: leave.reason,
            type: leave.type,
            notes: leave.notes || ''
        });
        setShowModal(true);
    };

    // Add resetForm function
    const resetForm = () => {
        setFormData({
            startDate: moment().format('YYYY-MM-DD'),
            endDate: moment().add(1, 'days').format('YYYY-MM-DD'),
            reason: '',
            type: 'planned',
            notes: ''
        });
        setSelectedLeave(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedLeave) {
                // Update existing leave
                await axios.put(`${BackendURL}/api/leaves/${selectedLeave._id}`, formData);
                toast.success('Leave updated successfully');
            } else {
                // Create new leave
                await axios.post(`${BackendURL}/api/leaves`, formData);
                toast.success('Leave application submitted successfully');
            }
            setShowModal(false);
            resetForm();
            fetchLeaves();
            if (viewMode === 'calendar') {
                fetchCalendarLeaves();
            }
        } catch (error) {
            console.error('Error saving leave:', error);
            toast.error(error.response?.data?.message || 'Failed to save leave');
        }
    };

    // Add handleDelete function
    const handleDelete = async () => {
        try {
            await axios.delete(`${BackendURL}/api/leaves/${selectedLeave._id}`);
            toast.success('Leave deleted successfully');
            setShowDeleteModal(false);
            fetchLeaves();
            if (viewMode === 'calendar') {
                fetchCalendarLeaves();
            }
        } catch (error) {
            console.error('Error deleting leave:', error);
            toast.error('Failed to delete leave');
        }
    };

    // Add handleStatusChange function
    const handleStatusChange = async (leaveId, status) => {
        try {
            await axios.put(`${BackendURL}/api/leaves/${leaveId}`, { status });
            toast.success(`Leave ${status} successfully`);
            fetchLeaves();
            if (viewMode === 'calendar') {
                fetchCalendarLeaves();
            }
        } catch (error) {
            console.error('Error updating leave status:', error);
            toast.error('Failed to update leave status');
        }
    };

    // Add getLeaveDuration function
    const getLeaveDuration = (startDate, endDate) => {
        const start = moment(startDate);
        const end = moment(endDate);
        const days = end.diff(start, 'days') + 1;
        return `${days} day${days > 1 ? 's' : ''}`;
    };

    // Add getTabCounts function
    const getTabCounts = () => {
        const counts = {
            all: leaves.length,
            pending: leaves.filter(l => l.status === 'pending').length,
            approved: leaves.filter(l => l.status === 'approved').length,
            rejected: leaves.filter(l => l.status === 'rejected').length
        };
        return counts;
    };

    const tabCounts = getTabCounts();

    // Add getStatusBadge function
    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <FaHourglassHalf />, label: 'Pending' },
            approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <FaCheck />, label: 'Approved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <FaTimes />, label: 'Rejected' }
        };
        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaInfoCircle />, label: 'Unknown' };
        return (
            <span className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    // Add getTypeBadge function
    const getTypeBadge = (type) => {
        const typeConfig = {
            planned: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FaCalendarAlt />, label: 'Planned' },
            emergency: { bg: 'bg-red-100', text: 'text-red-800', icon: <FaExclamationCircle />, label: 'Emergency' },
            sick: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <FaCalendarTimes />, label: 'Sick' },
            casual: { bg: 'bg-teal-100', text: 'text-teal-800', icon: <FaCalendarDay />, label: 'Casual' }
        };
        const config = typeConfig[type] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaCalendarAlt />, label: type };
        return (
            <span className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    // Add tile content for calendar
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = moment(date).format('YYYY-MM-DD');
            const dateLeaves = leavesByDate[dateStr] || [];
            
            if (dateLeaves.length === 0) return null;
            
            const approvedLeaves = dateLeaves.filter(l => l.status === 'approved');
            const pendingLeaves = dateLeaves.filter(l => l.status === 'pending');
            
            return (
                <div className="flex flex-col items-center mt-1">
                    {approvedLeaves.length > 0 && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mb-0.5"></div>
                    )}
                    {pendingLeaves.length > 0 && (
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    )}
                    {dateLeaves.length > 2 && (
                        <span className="text-[9px] text-gray-500 mt-0.5">+{dateLeaves.length}</span>
                    )}
                </div>
            );
        }
        return null;
    };

    // Add tile className for calendar
    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = moment(date).format('YYYY-MM-DD');
            const todayStr = moment().format('YYYY-MM-DD');
            const dateLeaves = leavesByDate[dateStr] || [];
            
            if (dateStr === todayStr) {
                return 'today-tile';
            }
            
            if (dateLeaves.length > 0) {
                return 'has-leaves-tile';
            }
        }
        return '';
    };

    const getLeavesForSelectedDate = () => {
        const dateStr = moment(selectedDate).format('YYYY-MM-DD');
        return leavesByDate[dateStr] || [];
    };

    // Add filteredLeaves for list view
    const filteredLeaves = leaves.filter(leave => {
        const matchesSearch = 
            leave.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leave.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leave.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // If not admin, only show own leaves
        if (!isAdmin && leave.employee?._id !== user?._id) {
            return false;
        }
        
        return matchesSearch;
    });

    // Add CSS for calendar styling
    const calendarStyles = `
        .react-calendar {
            width: 100%;
            max-width: 800px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            font-family: inherit;
            padding: 1rem;
        }
        
        .react-calendar__tile--active {
            background: #2563eb;
            color: white;
        }
        
        .react-calendar__tile--now {
            background: #f3f4f6;
        }
        
        .today-tile {
            background: #dbeafe !important;
            border: 2px solid #3b82f6 !important;
        }
        
        .has-leaves-tile {
            background: #f0f9ff;
        }
        
        .react-calendar__tile:hover {
            background: #f3f4f6;
        }
        
        .react-calendar__navigation button {
            color: #374151;
            font-weight: 600;
        }
        
        .react-calendar__month-view__weekdays {
            text-transform: uppercase;
            font-weight: 600;
            color: #6b7280;
            font-size: 0.75rem;
        }
    `;

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-50 to-blue-50">
            <style>{calendarStyles}</style>
            
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
                            <p className="text-gray-600 mt-1">Manage leave applications and approvals</p>
                        </div>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                        >
                            <FaCalendarPlus />
                            Apply for Leave
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* View Mode Toggle */}
                <div className="flex justify-end mb-4">
                    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                                viewMode === 'list' 
                                    ? 'bg-primary-600 text-white' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <FaList />
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                                viewMode === 'calendar' 
                                    ? 'bg-primary-600 text-white' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <FaCalendar />
                            Calendar View
                        </button>
                    </div>
                </div>

                {viewMode === 'calendar' ? (
                    /* Calendar View */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/50 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-800">Leave Calendar</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                        <span className="text-sm text-gray-600">Approved</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                        <span className="text-sm text-gray-600">Pending</span>
                                    </div>
                                </div>
                            </div>
                            
                            {calendarLoading ? (
                                <div className="flex items-center justify-center h-96">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-4 text-gray-600">Loading calendar...</p>
                                    </div>
                                </div>
                            ) : (
                                <Calendar
                                    onChange={handleDateClick}
                                    value={selectedDate}
                                    tileContent={tileContent}
                                    tileClassName={tileClassName}
                                    className="mx-auto"
                                    onActiveStartDateChange={({ activeStartDate }) => {
                                        setSelectedDate(activeStartDate);
                                    }}
                                />
                            )}
                            
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-gray-800">
                                        Selected Date: {moment(selectedDate).format('MMMM D, YYYY')}
                                    </h4>
                                    <button
                                        onClick={() => fetchLeavesForDate(selectedDate)}
                                        className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
                                    >
                                        <FaSync className="text-sm" />
                                        View Leaves
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Selected Date Leaves */}
                        <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-6">
                                Leaves on {moment(selectedDate).format('MMM D, YYYY')}
                            </h3>
                            
                            {getLeavesForSelectedDate().length === 0 ? (
                                <div className="text-center py-8">
                                    <FaCalendar className="text-gray-300 text-4xl mx-auto mb-3" />
                                    <p className="text-gray-500">No leaves scheduled for this date</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-125 overflow-y-auto">
                                    {getLeavesForSelectedDate().map((leave) => (
                                        <div key={leave._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-800">
                                                        {leave.employeeName}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {leave.reason}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {getStatusBadge(leave.status)}
                                                        {getTypeBadge(leave.type)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-500">
                                                        {moment(leave.startDate).format('MMM D')} - {moment(leave.endDate).format('MMM D')}
                                                    </div>
                                                    {leave.isSpanning && (
                                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                            Multi-day
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* List View */
                    <>
                        {/* Filters Card */}
                        <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm p-5 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or reason..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchLeaves}
                                        className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        title="Refresh"
                                    >
                                        <FaSync />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1 mb-6">
                            <div className="flex space-x-1">
                                {[
                                    { id: 'all', label: 'All Leaves', icon: <FaCalendarAlt /> },
                                    { id: 'pending', label: 'Pending', icon: <FaHourglassHalf /> },
                                    { id: 'approved', label: 'Approved', icon: <FaRegCalendarCheck /> },
                                    { id: 'rejected', label: 'Rejected', icon: <FaRegCalendarTimes /> }
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
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                            activeTab === tab.id
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {tabCounts[tab.id]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Leaves Table */}
                        <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {activeTab === 'all' ? 'All Leaves' : 
                                         activeTab === 'pending' ? 'Pending Leaves' :
                                         activeTab === 'approved' ? 'Approved Leaves' : 'Rejected Leaves'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Showing {filteredLeaves.length} of {tabCounts[activeTab]} leave applications
                                    </p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-4 text-gray-600">Loading leave applications...</p>
                                    </div>
                                </div>
                            ) : filteredLeaves.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaCalendarAlt className="text-gray-400 text-2xl" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No leaves found</h4>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        {searchTerm
                                            ? 'Try adjusting your search'
                                            : activeTab === 'all'
                                            ? 'No leave applications yet'
                                            : `No ${activeTab} leave applications`}
                                    </p>
                                    {!searchTerm && activeTab === 'all' && (
                                        <button
                                            onClick={handleAddNew}
                                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            <FaPlus />
                                            Apply for your first leave
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
                                                    Leave Period
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Details
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Applied On
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200/50">
                                            {filteredLeaves.map(leave => {
                                                return (
                                                    <tr key={leave._id} className="hover:bg-gray-50/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                                                                    <span className="text-white font-semibold text-sm">
                                                                        {leave.employeeName?.charAt(0) || leave.employee?.name?.charAt(0) || 'E'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-800">
                                                                        {leave.employeeName || leave.employee?.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 truncate max-w-45">
                                                                        {leave.employeeEmail || leave.employee?.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <div className="font-medium text-gray-800">
                                                                    {moment(leave.startDate).format('MMM DD')} - {moment(leave.endDate).format('MMM DD, YYYY')}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <span className="text-sm text-gray-800 line-clamp-2">{leave.reason}</span>
                                                                    {leave.notes && (
                                                                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                                            Note: {leave.notes}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {getTypeBadge(leave.type)}
                                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                                        {getLeaveDuration(leave.startDate, leave.endDate)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {getStatusBadge(leave.status)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-600">
                                                                {moment(leave.createdAt).format('MMM DD, YYYY')}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {moment(leave.createdAt).fromNow()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {(isAdmin || leave.employee?._id === user?._id) && (
                                                                    <button
                                                                        onClick={() => handleEdit(leave)}
                                                                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                                                                        title="Edit"
                                                                    >
                                                                        <FaEdit />
                                                                    </button>
                                                                )}
                                                                
                                                                {(isAdmin || leave.employee?._id === user?._id) && leave.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedLeave(leave);
                                                                            setShowDeleteModal(true);
                                                                        }}
                                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                                                                        title="Delete"
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                )}
                                                                
                                                                {isAdmin && leave.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleStatusChange(leave._id, 'approved')}
                                                                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600 hover:text-emerald-700"
                                                                            title="Approve"
                                                                        >
                                                                            <FaCheck />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleStatusChange(leave._id, 'rejected')}
                                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                                                                            title="Reject"
                                                                        >
                                                                            <FaTimes />
                                                                        </button>
                                                                    </>
                                                                )}
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
                    </>
                )}
            </div>

            {/* Add/Edit Leave Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-8 mx-auto p-4 w-full max-w-2xl">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {selectedLeave ? 'Edit Leave Application' : 'Apply for Leave'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FaTimes className="text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6">
                                {isAdmin && !selectedLeave && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Employee
                                        </label>
                                        <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent">
                                            <option value={user?._id}>Apply for myself</option>
                                            {employees.map((employee) => (
                                                <option key={employee._id} value={employee._id}>
                                                    {employee.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                            min={moment().format('YYYY-MM-DD')}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                            min={formData.startDate}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Leave Type */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Leave Type *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                    >
                                        <option value="planned">Planned Leave</option>
                                        <option value="emergency">Emergency Leave</option>
                                        <option value="sick">Sick Leave</option>
                                        <option value="casual">Casual Leave</option>
                                    </select>
                                </div>

                                {/* Reason */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason *
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Please provide reason for leave..."
                                        value={formData.reason}
                                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Additional Notes */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Any additional information..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                                    />
                                </div>

                                {/* Leave Duration Info */}
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <FaClock className="text-blue-600" />
                                        <div>
                                            <div className="font-medium text-blue-800">Leave Duration</div>
                                            <div className="text-blue-700">
                                                {getLeaveDuration(formData.startDate, formData.endDate)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="mt-8 pt-6 border-t border-gray-200/50">
                                    <button
                                        type="submit"
                                        className="w-full px-6 py-4 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold"
                                    >
                                        {selectedLeave ? 'Update Leave' : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedLeave && (
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
                                    Are you sure you want to delete this leave application?
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
                                        Delete Application
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

export default Leaves;