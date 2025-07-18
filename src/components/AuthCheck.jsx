import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkUser } from '../api/api';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

const publicPaths = ['/login', '/admin/login', '/register', '/language'];

const AuthCheck = ({ children }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (publicPaths.includes(location.pathname)) {
                    setAuthorized(true);
                    setLoading(false);
                    return;
                }

                const response = await checkUser();
                const { group } = response.data.data;

                const isAdminPath = location.pathname.startsWith('/admin');
                const isUserPath = !isAdminPath;

                const authorized = (
                    (group === 1 && isUserPath) ||
                    (group === 2 && isAdminPath) ||
                    group === 3
                );

                if (!authorized) {
                    message.error(error.response?.data?.message || t('notAuthorized'));
                    navigate(group === 1 ? '/' : '/admin');
                    return;
                }

                setAuthorized(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                message.error(error.response?.data?.message || t('pleaseLoginFirst'));
                navigate(location.pathname.startsWith('/admin') ? '/admin/login' : '/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [location.pathname]);

    if (loading) {
        return null; 
    }

    return authorized ? children : null;
};

export default AuthCheck;
