import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  FaSignInAlt,
  FaUser,
  FaLock,
  FaBuilding,
  FaUsers,
  FaClock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
  FaCog,
  FaPhoneAlt,
  FaCheckCircle,
  FaChartLine,
  FaCalendarCheck,
  FaBell,
  FaKey,
  FaEnvelope
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LogoImage from '../assets/images/expresslogo.jpg';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('rememberedEmail');
  });
  
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: localStorage.getItem('rememberedEmail') || '',
      password: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    const { email, password } = data;
    
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        toast.success('Login successful! Redirecting...');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    if (role === 'admin') {
      setValue('email', 'tanveeranjum');
      setValue('password', 'admin123456');
    } else {
      setValue('email', 'jahangir');
      setValue('password', '123456');
    }
    
    setRememberMe(true);
    toast.info(`Demo ${role} credentials loaded. Click Sign In to continue.`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-50 to-blue-50 flex items-center justify-center p-4 md:p-6">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-[0.02]"></div>
      
      <div className="w-full relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Info Section */}
          <div className="lg:w-3/4">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                  <img 
                    src={LogoImage} 
                    alt="Logo" 
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    Express Shift <span className="text-primary-600">Management</span>
                  </h1>
                  <p className="text-gray-600 mt-2 max-w-2xl">
                    Streamline your workforce scheduling with intelligent shift management and real-time operations.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {[
                {
                  icon: <FaClock className="text-2xl" />,
                  title: "Smart Scheduling",
                  desc: "Automated 3-shift system with conflict detection",
                  color: "bg-gradient-to-br from-blue-500 to-blue-600"
                },
                {
                  icon: <FaUsers className="text-2xl" />,
                  title: "Team Management",
                  desc: "Role-based access for 25+ employees",
                  color: "bg-gradient-to-br from-green-500 to-green-600"
                },
                {
                  icon: <FaChartLine className="text-2xl" />,
                  title: "Real-time Analytics",
                  desc: "Live updates and performance insights",
                  color: "bg-gradient-to-br from-purple-500 to-purple-600"
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md hover:border-primary-200 hover:-translate-y-1"
                >
                  <div className={`inline-flex items-center justify-center p-3 rounded-xl ${item.color} mb-4`}>
                    <div className="text-white">{item.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Trusted by Teams Worldwide</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "99.9%", label: "System Uptime", icon: <FaCheckCircle />, bg: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
                  { value: "25+", label: "Active Users", icon: <FaUsers />, bg: "bg-gradient-to-br from-primary-600 to-primary-700" },
                  { value: "24/7", label: "Support", icon: <FaBell />, bg: "bg-gradient-to-br from-amber-500 to-amber-600" },
                ].map((stat, i) => (
                  <div 
                    key={i}
                    className={`${stat.bg} text-white rounded-xl p-5 text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
                  >
                    <div className="text-3xl font-bold mb-1 flex items-center justify-center gap-2">
                      {stat.icon}
                      {stat.value}
                    </div>
                    <div className="text-sm opacity-90">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Copyright © {new Date().getFullYear()} | Developed by{' '}
                <span className="font-semibold text-primary-600">Tanveer Anjum</span>
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="lg:w-2/4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              {/* Header */}
              <div className="mb-2 flex gap-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-primary-100 to-primary-200 rounded-2xl mb-4">
                  <FaShieldAlt className="text-2xl text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Welcome
                  </h2>
                  <p className="text-gray-600">
                    Sign in to access your dashboard
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FaEnvelope />
                    </div>
                    <input
                      type="text"
                      {...register("email", { 
                        required: "Email is required",
                      })}
                      className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-gray-50`}
                      placeholder="you@company.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FaKey />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", { 
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters"
                        }
                      })}
                      className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-gray-50`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500/50 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    onClick={() => toast.info("Please contact your administrator for password reset")}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <FaArrowRight />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Accounts */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-center text-gray-600 mb-6">
                  Try our demo accounts
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDemoLogin("admin")}
                    className="flex items-center justify-center space-x-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50/50 font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-sm bg-primary-50/20"
                  >
                    <FaUser />
                    <span>Admin Demo</span>
                  </button>
                  <button
                    onClick={() => handleDemoLogin("employee")}
                    className="flex items-center justify-center space-x-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50/50 font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-sm bg-gray-50/20"
                  >
                    <FaUsers />
                    <span>Employee Demo</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;