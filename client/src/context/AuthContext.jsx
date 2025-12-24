import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

const BackendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Set axios defaults
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    useEffect(() => {
        const verifyToken = async () => {
            if (token) {
                try {
                    const response = await axios.get(`${BackendURL}/api/auth/me`);
                    setUser(response.data.employee);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        verifyToken();
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${BackendURL}/api/auth/login`, { email, password });
            const { token, employee } = response.data;
            
            localStorage.setItem('token', token);
            setToken(token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(employee);
            
            toast.success('Login successful!');
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.message;
            toast.error(message || 'Login failed. Please try again.');
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        toast.info('Logged out successfully');
    };

    const updateProfile = async (data) => {
        try {
            const response = await axios.put(`${BackendURL}/api/auth/updatedetails`, data);
            setUser(response.data.employee);
            toast.success('Profile updated successfully');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Update failed';
            toast.error(message);
            return { success: false, message };
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};