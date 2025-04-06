import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from "react";
import { useAuth } from '../contexts/AuthContext';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import GroupError from './GroupError';
import i18n from '../i18n';

const PUBLIC_PATHS = ['/login', '/admin/login', '/register'];
const LOGIN_PATHS = ['/login', '/admin/login'];

export const ProtectedRoute = ({ children, requiredGroups = [] }) => {
    const { user } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        // Set language based on path before showing any messages
        if (location.pathname.startsWith('/admin')) {
            i18n.changeLanguage('zh_CN');
        }

        if (!PUBLIC_PATHS.includes(location.pathname) && !user) {
            message.error(t('pleaseLoginFirst'));
        }
    }, [location.pathname, user, t]);

    // Redirect logged-in users trying to access login pages
    if (user && LOGIN_PATHS.includes(location.pathname)) {
        if (user.group === 1) {
            return <Navigate to="/" replace />;
        } else if (user.group === 2) {
            return <Navigate to="/admin" replace />;
        } else if (user.group === 3) {
            // For group 3, redirect based on which login page they're on
            if (location.pathname === '/login') {
                return <Navigate to="/" replace />;
            } else if (location.pathname === '/admin/login') {
                return <Navigate to="/admin" replace />;
            }
        }
    }

    // Allow public paths for non-logged-in users
    if (PUBLIC_PATHS.includes(location.pathname)) {
        return children;
    }

    // Check if user is authenticated
    if (!user) {
        return <Navigate 
            to={location.pathname.startsWith('/admin') ? '/admin/login' : '/login'} 
            replace 
        />;
    }

    // Show GroupError component for unauthorized access
    if (requiredGroups.length > 0 && !requiredGroups.includes(user.group)) {
        return <GroupError />;
    }

    return children;
}; 