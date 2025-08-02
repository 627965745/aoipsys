import React, { useMemo, useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Layout as AntLayout, Menu, theme, Space, message, Select } from 'antd';
import { useTranslation } from "react-i18next";
import { logout, getLanguageCombo } from "../api/api";
import { Dropdown } from 'antd';
import { UserOutlined, LockOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content } = AntLayout;

const AdminAppLayout = () => {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, checkAuthStatus } = useAuth();
    const [languages, setLanguages] = useState([]);
    const [languageName, setLanguageName] = useState(null);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const [selectedKey, setSelectedKey] = useState(() => {
        const pathParts = location.pathname.split('/');
        return pathParts[2] || '';
    });

    useEffect(() => {
        const pathParts = location.pathname.split('/');
        const currentKey = pathParts[2] || '';
        setSelectedKey(currentKey);
    }, [location.pathname]);

    useEffect(() => {
        i18n.changeLanguage('zh_CN');
        fetchLanguages();
    }, []);

    useEffect(() => {
        if (languages.length > 0) {
            const currentLanguage = languages.find(lang => lang.id === i18n.language);
            setLanguageName(currentLanguage?.name);
        }
    }, [i18n.language, languages]);

    const fetchLanguages = async () => {
        try {
            const response = await getLanguageCombo();
            if (response.data.status === 0) {
                setLanguages(response.data.data);
                let currentLanguage = response.data.data.find(lang => lang.id === 'zh_CN');
                
                if (!currentLanguage && response.data.data.length > 0) {
                    currentLanguage = response.data.data[0];
                }
                
                setLanguageName(currentLanguage?.name);
            }
        } catch (error) {
            console.error("Error fetching languages:", error);
        }
    };

    const handleLanguageChange = (value) => {
        i18n.changeLanguage(value);
        const selectedLanguage = languages.find(lang => lang.id === value);
        setLanguageName(selectedLanguage?.name);
    };

    const handleLogout = async () => {
        try {
            const response = await logout();
            if (response.data.status === 0) {
                message.success(t("logoutSuccess"));
                await checkAuthStatus();
                navigate("/admin/login");
            } else {
                message.error(error.response?.data?.message || t("logoutError"));
            }
        } catch (error) {
            message.error(error.response?.data?.message || t("logoutError"));
            await checkAuthStatus();
            navigate("/admin/login");
        }
    };

    const handleMenuClick = ({ key }) => {
        switch (key) {
            case 'logout':
                handleLogout();
                break;
            case 'changePassword':
                navigate("/reset-password?source=admin");
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

    const sidebarComponent = useMemo(() => {
        if (!user) return null;
        
        return (
            <div className="w-[120px] mr-6 border-r border-[#f0f0f0]">
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    className="h-screen border-r-0"
                    onSelect={({ key }) => {
                        setSelectedKey(key);
                        if (location.pathname === `/admin/${key}`) {
                            navigate(`/admin/${key}`, { replace: true, state: { refresh: Date.now() } });
                        } else {
                            navigate(`/admin/${key}`, { replace: true });
                        }
                    }}
                    items={[
                        {
                            key: "category",
                            label: t("category")
                        },
                        {
                            key: "product",
                            label: t("product")
                        },
                        {
                            key: "resource",
                            label: t("resource")
                        },
                        {
                            key: "user",
                            label: t("userManagement")
                        },
                        {
                            key: "email",
                            label: t("emailManagement")
                        },
                        {
                            key: "language",
                            label: t("languageManagement")
                        },
                    ]}
                />
            </div>
        );
    }, [user, t, selectedKey]);

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
                            onClick: () => setSelectedKey(''),
                            label: <Link to="/admin">{t("home")}</Link>,
                        },
                    ]}
                />
                <Space>
                    <div className="mr-2">
                        <Select
                            value={languageName}
                            className="w-[120px]"
                            onChange={handleLanguageChange}
                            notFoundContent={null}
                    >
                        {languages.map((lang) => (
                            <Select.Option key={lang.id} value={lang.id}>
                                {lang.name}
                            </Select.Option>
                        ))}
                    </Select>
                </div>
                    {user ? (
                        <Dropdown menu={userMenu} placement="bottomRight">
                            <Button 
                                type="text" 
                                icon={<UserOutlined className="text-white hover:text-white" />}
                                className="flex items-center text-white hover:text-white"
                            >
                                <span className="ml-1 text-white hover:text-white">
                                    {t('admin')}
                                </span>
                            </Button>
                        </Dropdown>
                    ) : (
                        <Button onClick={() => navigate("/admin/login")} type="primary">
                            {t('login')}
                        </Button>
                    )}
                </Space>
            </Header>
            <AntLayout className="h-full">
                <Content
                    className="p-6 m-0 min-h-full"
                    style={{
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <div className="flex min-h-full">
                        {sidebarComponent}
                        <div className="flex-1">
                            <Outlet key={location.state?.refresh || null} />
                        </div>
                    </div>
                </Content>
            </AntLayout>
        </AntLayout>
    );
};

export default AdminAppLayout;
