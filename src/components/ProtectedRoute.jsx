import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from "react";
import { useAuth } from '../contexts/AuthContext';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import GroupError from './GroupError';

const PUBLIC_PATHS = ['/login', '/admin/login', '/register', '/forget'];
const LOGIN_PATHS = ['/login', '/admin/login'];

export const ProtectedRoute = ({ children, requiredGroups = [] }) => {
    const { user } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        if (!PUBLIC_PATHS.includes(location.pathname) && !user) {
            message.error(t('pleaseLoginFirst'));
        }
    }, [location.pathname, user, t]);

    // Redirect logged-in users trying to access login pages
    if (user && LOGIN_PATHS.includes(location.pathname)) {
        return <Navigate to={user.group === 1 ? '/' : '/admin'} replace />;
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