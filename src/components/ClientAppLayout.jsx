import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Button, Layout as AntLayout, Menu, theme, Space, message, Select } from 'antd';
import { useTranslation } from "react-i18next";
import { logout, getLanguageCombo } from "../api/api";
import { Dropdown } from 'antd';
import { UserOutlined, LockOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content } = AntLayout;

const ClientAppLayout = () => {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const { user, checkAuthStatus } = useAuth();
    const [languages, setLanguages] = useState([]);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Fetch available languages from API
    useEffect(() => {
        const fetchLanguages = async () => {
            setLoadingLanguages(true);
            try {
                const response = await getLanguageCombo();
                if (response.data.status === 0) {
                    // Filter only enabled languages
                    setLanguages(response.data.data);
                } else {
                    console.error("Failed to fetch languages");
                }
            } catch (error) {
                console.error("Error fetching languages:", error);
            } finally {
                setLoadingLanguages(false);
            }
        };

        fetchLanguages();
    }, []);


    const handleLanguageChange = (value) => {
        i18n.changeLanguage(value);
    };

    const handleLogout = async () => {
        try {
            const response = await logout();
            if (response.data.status === 0) {
                message.success(t("logoutSuccess"));
                await checkAuthStatus(); // Update auth context
                navigate("/login");
            } else {
                message.error(response.data.message || t("logoutFailed"));
            }
        } catch (error) {
            message.error(t("logoutError"));
            await checkAuthStatus(); // Update auth context
            navigate("/login");
        }
    };

    const handleMenuClick = ({ key }) => {
        switch (key) {
            case 'logout':
                handleLogout();
                break;
            case 'changePassword':
                navigate("/reset-password?source=client");
                break;
            default:
                break;
        }
    };

    const userMenu = {
        items: [
            {
                key: 'changePassword',
                label: t('changePassword'),
                icon: <LockOutlined />
            },
            {
                type: 'divider'
            },
            {
                key: 'logout',
                label: t('logout'),
                icon: <LogoutOutlined />,
                danger: true
            }
        ],
        onClick: handleMenuClick
    };

    return (
        <AntLayout className="h-screen">
            <Header className="flex items-center">
                <div className="demo-logo" />
                <Menu
                    theme="dark"
                    mode="horizontal"
                    defaultSelectedKeys={['home']}
                    className="flex-1 min-w-0"
                    items={[
                        {
                            key: "home",
                            label: <Link to="/">{t("home")}</Link>,
                        },
                    ]}
                />
                <Space>
                <Select
                        defaultValue={i18n.language}
                        onChange={handleLanguageChange}
                        className="w-[120px]"
                        loading={loadingLanguages}
                    >
                        {languages.map(lang => (
                            <Select.Option key={lang.id} value={lang.id}>
                                {lang.name}
                            </Select.Option>
                        ))}
                    </Select>
                    {user ? (
                        <Dropdown menu={userMenu} placement="bottomRight">
                            <Button 
                                type="text" 
                                icon={<UserOutlined className="text-white hover:text-white" />}
                                className="flex items-center text-white hover:text-white"
                            >
                                <span className="ml-1 text-white hover:text-white">
                                    {user.name || t('user')}
                                </span>
                            </Button>
                        </Dropdown>
                    ) : (
                        <Button onClick={() => navigate("/login")} type="primary">
                            {t('login')}
                        </Button>
                    )}
                </Space>
            </Header>
            <Content className="p-6 m-0 min-h-[280px] bg-white rounded-lg">
                <Outlet />
            </Content>
        </AntLayout>
    );
};

export default ClientAppLayout;
