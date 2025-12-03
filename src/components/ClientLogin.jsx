import React, { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useTranslation } from "react-i18next";
import { login, getCaptcha, getLanguageCombo } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { User, Lock, Eye, EyeOff, Globe, ChevronDown, ShieldCheck } from "lucide-react";
import loginImage from "../assets/loginImage.png";
import logoImage from "../assets/62dec083aa150333bea0f372c3e84e30062b9518.png";
import ravennaLogo from "../assets/ba3babc66b385e025079f4da0dc333957d991d49.png";
import { DigisyntheticLogoSmall, DigisyntheticLogoLarge, SoundNetLogo } from "./LogoSvg";

const ClientLogin = () => {
    const { t, i18n } = useTranslation();
    const [captchaUrl, setCaptchaUrl] = useState("");
    const [captchaValue, setCaptchaValue] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [languages, setLanguages] = useState([]);
    const [loginImageLoaded, setLoginImageLoaded] = useState(false);
    const navigate = useNavigate();
    const { checkAuthStatus } = useAuth();

    useEffect(() => {
        fetchLanguages();
        // 在小屏幕下（没有左侧图片）直接加载验证码
        const isSmallScreen = window.innerWidth < 1024;
        if (isSmallScreen) {
            fetchCaptcha();
        }
    }, []);

    // 等待左侧图片加载完成后再加载验证码
    useEffect(() => {
        if (loginImageLoaded) {
            fetchCaptcha();
        }
    }, [loginImageLoaded]);

    const fetchLanguages = async () => {
        try {
            const response = await getLanguageCombo();
            if (response.data.status === 0) {
                setLanguages(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching languages:", error);
        }
    };

    const fetchCaptcha = async () => {
        try {
            const response = await getCaptcha();
            if (response.data.status === 0) {
                setCaptchaUrl(response.data.data.image);
            } else {
                message.error(t("captchaLoadError"));
            }
        } catch (error) {
            message.error(t("captchaLoadError"));
        }
    };

    const onFinish = async (values) => {
        try {
            const response = await login({
                email: values.email,
                password: values.password,
                captcha: values.captcha,
            });

            if (response.data.status === 0) {
                await checkAuthStatus();
                message.success(t("loginSuccess"));
                navigate("/", { replace: true });
            } else {
                message.error(error.response?.data?.message || t("loginFailed"));
                fetchCaptcha();
                setCaptchaValue("");
            }
        } catch (error) {
            message.error(error.response?.data?.message || t("loginError"));
            fetchCaptcha();
            setCaptchaValue("");
        }
    };

    const getCurrentLanguageLabel = () => {
        const currentLanguage = languages.find(lang => lang.id === i18n.language);
        return currentLanguage?.name || i18n.language;
    };

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setShowLanguageDropdown(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]">
            {/* Top Navigation */}
            <nav className="w-full bg-[rgba(0,0,0,0.2)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)]">
                <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo Section */}
                        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-wrap">
                            {/* DIGISYNTHETIC Logo */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                                    <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                                </div>
                                <div className="h-6 sm:h-8 w-auto hidden sm:block">
                                    <DigisyntheticLogoSmall className="h-full w-auto" fill="white" />
                                </div>
                            </div>

                            {/* SoundNet Logo */}
                            <div className="h-6 sm:h-8 w-auto hidden md:block">
                                <SoundNetLogo className="h-full w-auto" />
                            </div>

                            {/* RAVENNA Logo */}
                            <div className="h-10 sm:h-16 w-auto hidden lg:block">
                                <img src={ravennaLogo} alt="RAVENNA" className="h-full w-auto object-contain" />
                            </div>
                        </div>

                        {/* Language Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white hover:border-[#00d3f2] transition-all duration-300 px-3 sm:px-5 py-2"
                            >
                                <Globe className="h-4 w-4 text-[#00d3f2]" />
                                <span className="hidden sm:inline">{getCurrentLanguageLabel()}</span>
                                <ChevronDown className={`h-4 w-4 text-[#00d3f2] transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                            </button>

{/* Dropdown Menu */}
                                            {showLanguageDropdown && (
                                                <div className="absolute right-0 mt-2 w-40 bg-[#1a1f3a] border border-[rgba(0,211,242,0.3)] rounded-lg shadow-2xl overflow-hidden z-10">
                                                    {languages.map((lang) => (
                                                        <button
                                                            key={lang.id}
                                                            onClick={() => changeLanguage(lang.id)}
                                                            className={`w-full px-4 py-3 text-left hover:bg-[rgba(0,211,242,0.1)] transition-colors ${
                                                                i18n.language === lang.id ? 'bg-[rgba(0,211,242,0.2)] text-[#00d3f2]' : 'text-white'
                                                            }`}
                                                        >
                                                            {lang.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row">
                {/* Left Side - Image */}
                <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,211,242,0.1)] to-transparent"></div>
                    <div className="absolute top-20 left-20 w-64 h-64 bg-[rgba(0,184,219,0.2)] rounded-full blur-3xl"></div>
                    <img
                        src={loginImage}
                        alt="Digisynthetic Documentation"
                        className="absolute inset-0 w-full h-full object-cover"
                        onLoad={() => setLoginImageLoaded(true)}
                    />
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-[58%] flex items-center justify-center p-4 sm:p-8">
                    <div className="w-full max-w-md">
                        {/* Brand Info */}
                        <div className="mb-8 sm:mb-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4">
                                <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <div className="mb-2 flex items-center justify-center">
                                <DigisyntheticLogoLarge className="h-8 w-auto" fill="white" />
                            </div>
                            <p className="text-[#99a1af]">{t("subtitle")}</p>
                        </div>

                        {/* Login Form */}
                        <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 sm:p-8 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
                            <h2 className="text-white text-xl font-medium mb-2">{t("welcome")}</h2>
                            <p className="text-[#99a1af] mb-6">{t("signInText")}</p>

                            <Form
                                name="login"
                                onFinish={onFinish}
                                className="space-y-6"
                                layout="vertical"
                            >
                                {/* Email Field */}
                                <Form.Item
                                    name="email"
                                    rules={[{ required: true, message: t("emailError") }]}
                                    className="mb-0"
                                >
                                    <div>
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            {t("email")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <User className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t("emailPlaceholder")}
                                                className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                style={{ 
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    height: '48px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Form.Item>

                                {/* Password Field */}
                                <Form.Item
                                    name="password"
                                    rules={[
                                        { required: true, message: t("passwordError") },
                                    ]}
                                    className="mb-0"
                                >
                                    <div>
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            {t("password")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <Lock className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t("passwordPlaceholder")}
                                                className="w-full pl-12 pr-12 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                style={{ 
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    height: '48px'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#00d3f2] hover:text-[#00b8db] transition-colors z-10"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </Form.Item>

                                {/* Captcha Field */}
                                <Form.Item
                                    name="captcha"
                                    rules={[{ required: true, message: t("captchaError") }]}
                                    className="mb-0"
                                >
                                    <div>
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            {t("captcha")}
                                        </label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <ShieldCheck className="h-5 w-5 text-cyan-400" />
                                                </div>
                                                <Input
                                                    placeholder={t("captchaPlaceholder")}
                                                    value={captchaValue}
                                                    onChange={(e) => setCaptchaValue(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-300 hover:border-cyan-400/50"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        height: '48px'
                                                    }}
                                                />
                                            </div>
                                            {captchaUrl && (
                                                <div className="h-12 w-30 border border-cyan-400/30 rounded-lg overflow-hidden cursor-pointer hover:border-cyan-400 transition-all duration-300">
                                                    <img
                                                        src={captchaUrl}
                                                        alt="captcha"
                                                        onClick={fetchCaptcha}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Form.Item>

                                {/* Submit Button */}
                                <Form.Item className="mb-0">
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-[#00d3f2] to-[#2b7fff] text-white rounded-lg hover:from-[#00b8db] hover:to-[#1e6eef] focus:outline-none focus:ring-2 focus:ring-[rgba(0,211,242,0.5)] transition-all duration-300 shadow-[0px_10px_15px_-3px_rgba(0,184,219,0.3),0px_4px_6px_-4px_rgba(0,184,219,0.3)] hover:shadow-[0px_15px_20px_-3px_rgba(0,184,219,0.4),0px_6px_8px_-4px_rgba(0,184,219,0.4)] hover:-translate-y-0.5 font-medium"
                                    >
                                        {t("signIn")}
                                    </button>
                                </Form.Item>

                                {/* Sign Up Link */}
                                <div className="text-center text-[#99a1af]">
                                    {t("noAccount")}{' '}
                                    <Link to="/register" className="text-[#00d3f2] hover:text-[#00b8db] transition-colors">
                                        {t("signUp")}
                                    </Link>
                                </div>

                                {/* Admin Login Link */}
                                <div className="text-center">
                                    <Link
                                        to="/admin/login"
                                        className="text-[#99a1af] hover:text-[#00d3f2] transition-colors"
                                    >
                                        {t("adminLogin")}
                                    </Link>
                                </div>
                            </Form>
                        </div>

                        {/* Footer Text */}
                        <p className="text-center text-[#6a7282] mt-6 sm:mt-8 text-sm sm:text-base">
                            {t("copyright")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
