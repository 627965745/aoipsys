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
    const [languageName, setLanguageName] = useState(null);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        fetchLanguages();
    }, []);

    useEffect(() => {
        if (languages.length > 0) {
            const currentLanguage = languages.find(lang => lang.id === i18n.language);
            setLanguageName(currentLanguage?.name);
        }
    }, [i18n.language, languages]);

    const fetchLanguages = async () => {
        setLoadingLanguages(true);
        try {
            const response = await getLanguageCombo();
            if (response.data.status === 0) {
                setLanguages(response.data.data);
                
                let currentLanguage = response.data.data.find(lang => lang.id === i18n.language);
                if (!currentLanguage) {
                    const languageCode = i18n.language.split('_')[0];
                    currentLanguage = response.data.data.find(lang => lang.id.startsWith(languageCode));
                }

                if (!currentLanguage && response.data.data.length > 0) {
                    currentLanguage = response.data.data[0];
                    i18n.changeLanguage(currentLanguage.id);
                }
                setLanguageName(currentLanguage?.name);
            }
        } catch (error) {
            console.error("Error fetching languages:", error);
        } finally {
            setLoadingLanguages(false);
        }
    };

    const handleLanguageChange = (value) => {
        i18n.changeLanguage(value);
        const selectedLanguage = languages.find(lang => lang.id === value);
        setLanguageName(selectedLanguage?.name);
    };

    const getLanguageFlag = (langCode) => {
        const countryCode = langCode.slice(-2);

        const flagEmoji = countryCode
            .toUpperCase()
            .split('')
            .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
            .join('');
        
        return flagEmoji;
    };

    const handleLogout = async () => {
        try {
            const response = await logout();
            if (response.data.status === 0) {
                message.success(t("logoutSuccess"));
                await checkAuthStatus(); // Update auth context
                navigate("/login");
            } else {
                message.error(error.response?.data?.message || t("logoutFailed"));
            }
        } catch (error) {
            message.error(error.response?.data?.message || t("logoutError"));
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
                        value={languageName}
                        className="w-[120px]"
                        onChange={handleLanguageChange}
                        loading={loadingLanguages}
                        notFoundContent={null}
                    >
                        {languages.map((lang) => (
                            <Select.Option key={lang.id} value={lang.id}>
                                <span className="mr-2">{getLanguageFlag(lang.id)}</span>
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
