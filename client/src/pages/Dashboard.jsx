import { useState, useEffect } from 'react';
import {
    FaUsers, FaUserCheck, FaUserTimes, FaClock, FaExclamationTriangle, FaCalendarPlus, FaEdit, FaSync, FaChartLine, FaCalendarAlt, FaCog, FaEllipsisH, FaTimesCircle, FaIdBadge, FaRegClock, FaUser
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import moment from 'moment';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import formatTo12Hour from "../utils/timeFormatter"

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const { user, isAdmin } = useAuth();
    const [dashboardData, setDashboardData] = useState({
        currentShift: null,
        employees: [],
        todayLeaves: [],
        stats: {
            total: 0,
            present: 0,
            absent: 0,
            onLeave: 0,
            weeklyOff: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [emergencyLeave, setEmergencyLeave] = useState({
        employeeId: '',
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        reason: '',
        notes: ''
    });
    const [attendanceData, setAttendanceData] = useState({
        status: 'present',
        notes: '',
        date: moment().format('YYYY-MM-DD')
    });
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    const BackendURL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetchDashboardData();
        
        const socket = io('http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });
        setSocket(socket);

        if (isAdmin) {
            socket.emit('joinAdminRoom');
        }

        socket.on('newLeave', (leave) => {
            addNotification({
                type: 'info',
                title: 'New Leave Request',
                message: `${leave.employeeName} has applied for leave`,
                timestamp: new Date()
            });
            fetchDashboardData();
        });

        socket.on('employeeUpdated', () => {
            fetchDashboardData();
        });

        socket.on('attendanceMarked', (attendance) => {
            addNotification({
                type: 'success',
                title: 'Attendance Updated',
                message: `Attendance marked for employee`,
                timestamp: new Date()
            });
            fetchDashboardData();
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        toast.info(notification.message);
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            const [shiftRes, employeesRes, leavesRes] = await Promise.all([
                axios.get(`${BackendURL}/api/shifts/current`),
                axios.get(`${BackendURL}/api/employees/today/status`),
                axios.get(`${BackendURL}/api/leaves/today`)
            ]);

            const employees = employeesRes.data.data;
            const stats = {
                total: employees.length,
                present: employees.filter(e => e.todayStatus === 'present').length,
                absent: employees.filter(e => e.todayStatus === 'absent').length,
                onLeave: employees.filter(e => e.todayStatus === 'on_leave').length,
                weeklyOff: employees.filter(e => e.todayStatus === 'weekly_off').length
            };

            setDashboardData({
                currentShift: shiftRes.data.data,
                employees: employees,
                todayLeaves: leavesRes.data.data,
                stats: stats
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmergencyLeave = async () => {
        try {
            await axios.post(`${BackendURL}/api/leaves/emergency`, emergencyLeave);
            toast.success('Emergency leave added successfully');
            setShowEmergencyModal(false);
            setEmergencyLeave({
                employeeId: '',
                startDate: moment().format('YYYY-MM-DD'),
                endDate: moment().format('YYYY-MM-DD'),
                reason: '',
                notes: ''
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Error adding emergency leave:', error);
            toast.error(error.response?.data?.message || 'Failed to add emergency leave');
        }
    };

    const handleEditEmployee = (employee) => {
        setSelectedEmployee(employee);
        setShowEditModal(true);
    };

    const handleUpdateEmployee = async () => {
        try {
            const updateData = {
                shift: selectedEmployee.shift,
                todayStatus: selectedEmployee.todayStatus,
                customTiming: selectedEmployee.customTiming,
                weeklyOff: selectedEmployee.weeklyOff,
                status: selectedEmployee.status,
                notes: selectedEmployee.notes
            };
            
            delete updateData.password;
            
            await axios.put(`${BackendURL}/api/employees/${selectedEmployee._id}`, updateData);
            toast.success('Employee updated successfully');
            setShowEditModal(false);
            fetchDashboardData();
        } catch (error) {
            console.error('Error updating employee:', error);
            toast.error(error.response?.data?.message || 'Failed to update employee');
        }
    };

    const handleMarkAttendance = (employee) => {
        setSelectedEmployee(employee);
        setAttendanceData({
            status: 'present',
            notes: '',
            date: moment().format('YYYY-MM-DD')
        });
        setShowAttendanceModal(true);
    };

    const handleSubmitAttendance = async () => {
        try {
            await axios.post(`${BackendURL}/api/employees/${selectedEmployee._id}/attendance`, {
                ...attendanceData,
                employeeId: selectedEmployee._id
            });
            toast.success('Attendance marked successfully');
            setShowAttendanceModal(false);
            fetchDashboardData();
        } catch (error) {
            console.error('Error marking attendance:', error);
            toast.error('Failed to mark attendance');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            present: { bg: 'bg-green-100', text: 'text-green-800', label: 'Present', icon: '✓' },
            absent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Absent', icon: '✗' },
            on_leave: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'On Leave', icon: '📅' },
            weekly_off: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Weekly Off', icon: '🏖️' }
        };
        
        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown', icon: '?' };
        return (
            <span className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}>
                <span>{config.icon}</span>
                {config.label}
            </span>
        );
    };

    const getShiftColor = (shiftCode) => {
        switch(shiftCode) {
            case 'shift1': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' };
            case 'shift2': return { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' };
            case 'shift3': return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' };
            default: return { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' };
        }
    };

    const getShiftLabel = (shiftCode) => {
        switch(shiftCode) {
            case 'shift1': return 'Shift 1';
            case 'shift2': return 'Shift 2';
            case 'shift3': return 'Shift 3';
        }
    };

    const formatTime12Hour = (time24) => {
        if (!time24 || !time24.includes(':')) return time24;
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const getShiftTiming = (employee) => {
    if (employee.customTiming?.start && employee.customTiming?.end) {
        return `${formatTo12Hour(employee.customTiming.start)} - ${formatTo12Hour(employee.customTiming.end)}`;
    }
    
    const shiftMap = {
        'shift1': `${formatTo12Hour('09:00')} - ${formatTo12Hour('17:00')}`,
        'shift2': `${formatTo12Hour('17:00')} - ${formatTo12Hour('01:00')}`, 
        'shift3': `${formatTo12Hour('01:00')} - ${formatTo12Hour('09:00')}`
    };
    
    return shiftMap[employee.shift];
    };

    // Chart Data
    const attendanceChartData = {
        labels: ['Present', 'On Leave', 'Weekly Off', 'Absent'],
        datasets: [
            {
                label: 'Today\'s Attendance',
                data: [
                    dashboardData.stats.present,
                    dashboardData.stats.onLeave,
                    dashboardData.stats.weeklyOff,
                    dashboardData.stats.absent
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(251, 191, 36, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2,
                borderRadius: 6,
            },
        ],
    };

    const shiftDistributionData = {
        labels: ['Shift 1', 'Shift 2', 'Shift 3'],
        datasets: [
            {
                label: 'Employees per Shift',
                data: [
                    dashboardData.employees.filter(e => e.shift === 'shift1').length,
                    dashboardData.employees.filter(e => e.shift === 'shift2').length,
                    dashboardData.employees.filter(e => e.shift === 'shift3').length,
                ],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(168, 85, 247, 1)',
                ],
                borderWidth: 2,
                borderRadius: 6,
            },
        ],
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-50 to-blue-50 w-full">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                <p className="text-gray-600">
                                    Welcome back, <span className="font-semibold text-primary-600">{user?.name}</span>
                                </p>
                                {dashboardData.currentShift && (
                                    <span className="inline-flex items-center gap-1.5 text-sm bg-primary-50/70 text-primary-700 px-3 py-1.5 rounded-full border border-primary-200">
                                        <FaClock className="text-primary-500" />
                                        <span className="font-medium">{dashboardData.currentShift.name}:</span>
                                        <span>{`${dashboardData.currentShift.startTime} - ${dashboardData.currentShift.endTime}`}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchDashboardData}
                                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/80 transition-all duration-200 hover:border-gray-400"
                            >
                                <FaSync className="text-gray-500" />
                                <span className="font-medium">Refresh</span>
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowEmergencyModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    <FaCalendarPlus />
                                    <span className="font-medium">Emergency Leave</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1 mb-6">
                    <div className="flex space-x-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
                            { id: 'details', label: 'Detailed View', icon: <FaUsers /> }
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

                {activeTab === 'overview' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                {
                                    title: "Total Employees",
                                    value: dashboardData.stats.total,
                                    description: "All shifts combined",
                                    icon: <FaUsers className="text-xl" />,
                                    color: "from-blue-500 to-blue-600",
                                    progress: 100
                                },
                                {
                                    title: "Present Today",
                                    value: dashboardData.stats.present,
                                    description: `${((dashboardData.stats.present / dashboardData.stats.total) * 100).toFixed(1)}% attendance`,
                                    icon: <FaUserCheck className="text-xl" />,
                                    color: "from-green-500 to-green-600",
                                    progress: (dashboardData.stats.present / dashboardData.stats.total) * 100
                                },
                                {
                                    title: "On Leave",
                                    value: dashboardData.stats.onLeave,
                                    description: `${dashboardData.todayLeaves.length} ${dashboardData.todayLeaves.length === 1 ? 'application' : 'applications'}`,
                                    icon: <FaUserTimes className="text-xl" />,
                                    color: "from-amber-500 to-amber-600",
                                    progress: (dashboardData.stats.onLeave / dashboardData.stats.total) * 100
                                },
                                {
                                    title: "Weekly Off",
                                    value: dashboardData.stats.weeklyOff,
                                    description: "Scheduled day off",
                                    icon: <FaCalendarAlt className="text-xl" />,
                                    color: "from-primary-500 to-primary-600",
                                    progress: (dashboardData.stats.weeklyOff / dashboardData.stats.total) * 100
                                }
                            ].map((stat, index) => (
                                <div key={index} className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium mb-1">{stat.title}</p>
                                            <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{stat.description}</p>
                                        </div>
                                        <div className={`bg-linear-to-br ${stat.color} p-3 rounded-xl text-white`}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div 
                                            className={`bg-linear-to-r ${stat.color} h-1.5 rounded-full transition-all duration-500`}
                                            style={{ width: `${stat.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">Attendance Distribution</h3>
                                </div>
                                <div className="h-72">
                                    <Pie 
                                        data={attendanceChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        padding: 20,
                                                        usePointStyle: true,
                                                    }
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(context) {
                                                            const value = context.raw;
                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                            const percentage = Math.round((value / total) * 100);
                                                            return `${context.label}: ${value} (${percentage}%)`;
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">Shift Distribution</h3>
                                </div>
                                <div className="h-72">
                                    <Bar 
                                        data={shiftDistributionData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        stepSize: 1
                                                    },
                                                    grid: {
                                                        color: 'rgba(0, 0, 0, 0.05)'
                                                    }
                                                },
                                                x: {
                                                    grid: {
                                                        display: false
                                                    }
                                                }
                                            },
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Leaves Alert */}
                        {dashboardData.todayLeaves.length > 0 && (
                            <div className="mb-6 bg-amber-200/70 border border-amber-200 rounded-xl p-5">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <FaExclamationTriangle className="text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h4 className="font-semibold text-amber-800">
                                                Today's Leaves ({dashboardData.todayLeaves.length})
                                            </h4>
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                {dashboardData.todayLeaves.length} Active
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {dashboardData.todayLeaves.map(leave => (
                                                <div key={leave._id} className="bg-white rounded-lg p-4 border border-amber-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-gray-800">{leave.employeeName}</span>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {moment(leave.startDate).format('MMM D')} - {moment(leave.endDate).format('MMM D')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{leave.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Employees Table */}
                        <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Employee Status Today</h3>
                                    <p className="text-sm text-gray-500 mt-1">Real-time attendance and shift information</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                                        Total: {dashboardData.employees.length}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-200/50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Shift & Timing
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Weekly Off
                                            </th>
                                            {isAdmin && (
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200/50">
                                        {dashboardData.employees.sort((a, b) => (a.shift > b.shift) ? 1 : -1).map(employee => {
                                            const shiftColor = getShiftColor(employee.shift);
                                            return (
                                                <tr key={employee._id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2.5 rounded-lg ${shiftColor.bg} ${shiftColor.border} border`}>
                                                                <FaUser className={shiftColor.text} />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-800">{employee.name}</div>
                                                                <div className="text-sm text-gray-500">{employee.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                                                            <FaIdBadge className="text-gray-400" />
                                                            {employee.employeeId}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`px-3 py-1.5 ${shiftColor.bg} ${shiftColor.text} text-sm font-semibold rounded-full inline-block text-center`}>
                                                                {getShiftLabel(employee.shift)}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                                <p className='text-xs'>{getShiftTiming(employee)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            {getStatusBadge(employee.todayStatus)}
                                                            {employee.leaveReason && (
                                                                <div className="text-xs text-gray-500 italic">
                                                                    {employee.leaveReason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {employee.weeklyOff?.map(day => (
                                                                <span key={day} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleEditEmployee(employee)}
                                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                                                                    title="Edit Employee"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMarkAttendance(employee)}
                                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                                                                    title="Mark Attendance"
                                                                >
                                                                    <FaUserCheck />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEmergencyLeave({
                                                                            ...emergencyLeave,
                                                                            employeeId: employee._id
                                                                        });
                                                                        setShowEmergencyModal(true);
                                                                    }}
                                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                                                                    title="Emergency Leave"
                                                                >
                                                                    <FaCalendarPlus />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.employees.map(employee => {
                            const shiftColor = getShiftColor(employee.shift);
                            return (
                                <div key={employee._id} className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`p-3.5 rounded-xl ${shiftColor.bg} ${shiftColor.border} border`}>
                                            <FaUser className={`text-xl ${shiftColor.text}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800">{employee.name}</h4>
                                            <p className="text-sm text-gray-500 truncate">{employee.email}</p>
                                            <div className="mt-2">
                                                {getStatusBadge(employee.todayStatus)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col text-sm">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Shift:</span>
                                            <span className={`font-medium ${shiftColor.text}`}>
                                                {getShiftLabel(employee.shift)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Timing:</span>
                                            <span className="font-medium text-gray-800">{getShiftTiming(employee)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Employee ID:</span>
                                            <span className="font-medium text-gray-800">{employee.employeeId}</span>
                                        </div>
                                        {employee.weeklyOff?.length > 0 && (
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-500">Weekly Off:</span>
                                                <div className="flex flex-wrap gap-1 justify-end">
                                                    {employee.weeklyOff.map(day => (
                                                        <span key={day} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                            {day.charAt(0).toUpperCase() + day.slice(1)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleEditEmployee(employee)}
                                            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50/50 transition-colors font-medium"
                                        >
                                            <FaEdit />
                                            Manage Employee
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Emergency Leave Modal */}
            {showEmergencyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
                        <div className="flex justify-between items-center pb-3 border-b">
                            <div className="flex items-center">
                                <FaCalendarPlus className="text-red-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-900">Add Emergency Leave</h3>
                            </div>
                            <button onClick={() => setShowEmergencyModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimesCircle className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Employee *
                                    </label>
                                    <select
                                        value={emergencyLeave.employeeId}
                                        onChange={(e) => setEmergencyLeave({
                                            ...emergencyLeave,
                                            employeeId: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Choose employee...</option>
                                        {dashboardData.employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter reason for leave"
                                        value={emergencyLeave.reason}
                                        onChange={(e) => setEmergencyLeave({
                                            ...emergencyLeave,
                                            reason: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={emergencyLeave.startDate}
                                        onChange={(e) => setEmergencyLeave({
                                            ...emergencyLeave,
                                            startDate: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={emergencyLeave.endDate}
                                        onChange={(e) => setEmergencyLeave({
                                            ...emergencyLeave,
                                            endDate: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Additional notes..."
                                    value={emergencyLeave.notes}
                                    onChange={(e) => setEmergencyLeave({
                                        ...emergencyLeave,
                                        notes: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start">
                                    <FaExclamationTriangle className="text-yellow-600 mt-0.5 mr-3 shrink-0" />
                                    <div className="text-yellow-800 text-sm">
                                        This will immediately mark the employee as on leave and notify all admins.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4 mt-6 border-t">
                            <button
                                onClick={() => setShowEmergencyModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEmergencyLeave}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Add Emergency Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {showEditModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                     <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
                        <div className="flex justify-between items-center pb-3 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">Edit Employee Details</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimesCircle className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                                    <select
                                        value={selectedEmployee.shift}
                                        onChange={(e) => setSelectedEmployee({
                                            ...selectedEmployee,
                                            shift: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="shift1">Shift 1 (9 AM - 5 PM)</option>
                                        <option value="shift2">Shift 2 (5 PM - 1 AM)</option>
                                        <option value="shift3">Shift 3 (1 AM - 9 AM)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={selectedEmployee.todayStatus}
                                        onChange={(e) => setSelectedEmployee({
                                            ...selectedEmployee,
                                            todayStatus: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="on_leave">On Leave</option>
                                        <option value="weekly_off">Weekly Off</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Off Days</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                                        <label key={day} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployee.weeklyOff?.includes(day)}
                                                onChange={(e) => {
                                                    const weeklyOff = [...(selectedEmployee.weeklyOff || [])];
                                                    if (e.target.checked) {
                                                        weeklyOff.push(day);
                                                    } else {
                                                        const index = weeklyOff.indexOf(day);
                                                        if (index > -1) {
                                                            weeklyOff.splice(index, 1);
                                                        }
                                                    }
                                                    setSelectedEmployee({
                                                        ...selectedEmployee,
                                                        weeklyOff
                                                    });
                                                }}
                                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">
                                                {day.charAt(0).toUpperCase() + day.slice(1)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Add any notes about this employee..."
                                    value={selectedEmployee.notes || ''}
                                    onChange={(e) => setSelectedEmployee({
                                        ...selectedEmployee,
                                        notes: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4 mt-6 border-t">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateEmployee}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mark Attendance Modal */}
            {showAttendanceModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
                        <div className="flex justify-between items-center pb-3 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">Mark Attendance</h3>
                            <button onClick={() => setShowAttendanceModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimesCircle className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="mt-4">
                            <div className="p-4 bg-blue-50 rounded-lg mb-4">
                                <div className="text-blue-800 text-sm">
                                    Marking attendance for <strong>{selectedEmployee.name}</strong>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={attendanceData.date}
                                        onChange={(e) => setAttendanceData({
                                            ...attendanceData,
                                            date: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={attendanceData.status}
                                        onChange={(e) => setAttendanceData({
                                            ...attendanceData,
                                            status: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="on_leave">On Leave</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Add any notes..."
                                        value={attendanceData.notes}
                                        onChange={(e) => setAttendanceData({
                                            ...attendanceData,
                                            notes: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4 mt-6 border-t">
                            <button
                                onClick={() => setShowAttendanceModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitAttendance}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Mark Attendance
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;