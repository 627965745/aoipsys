import { Button, Form, Input, message, Modal, Checkbox } from "antd";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { register } from "../api/api";
import { User, Lock, Eye, EyeOff, Globe, ChevronDown, Building, Briefcase, Phone, Mail } from 'lucide-react';
import loginImage from "../assets/loginImage.webp";
import logoImage from "../assets/62dec083aa150333bea0f372c3e84e30062b9518.png";
import ravennaLogo from "../assets/ba3babc66b385e025079f4da0dc333957d991d49.png";
import { DigisyntheticLogoSmall, DigisyntheticLogoLarge, SoundNetLogo } from "./LogoSvg";
import { useCaptcha } from "../hooks/useCaptcha";

const Register = () => {
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { captchaUrl, fetchCaptcha } = useCaptcha();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    useEffect(() => {
        fetchCaptcha();
    }, []);

    // Effect to handle dynamic URL changes
    useEffect(() => {
        const email = searchParams.get('email');
        if (email) {
            form.setFieldsValue({ email });
        }
    }, [searchParams, form]);

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const registerData = {
                email: values.email,
                password: values.password,
                captcha: values.captcha,
                name: values.name || "",
                company: values.company || "",
                position: values.position || "",
                industry: values.industry || "",
                contact: values.contact || "",
                is_subscribed: values.emailSubscription ? 1 : 0,
            };

            const response = await register(registerData);

            if (response.data && response.data.status === 0) {
                message.success(t("registerSuccess"));
                Modal.info({
                    title: t("registerSuccessTitle"),
                    content: t("registerSuccessMessage"),
                    onOk() {
                        navigate("/login");
                    },
                });
            } else {
                message.error(
                    error.response?.data?.message || t("registerFailed")
                );
                fetchCaptcha();
            }
        } catch (error) {
            console.error("Registration error:", error);
            message.error(error.response?.data?.message || t("registerFailed"));
            fetchCaptcha();
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLanguageLabel = () => {
        const lang = i18n.language;
        if (lang === "zh_CN") return "中文";
        if (lang === "es_ES") return "Español";
        return "English";
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

                            {showLanguageDropdown && (
                                <div className="absolute right-0 mt-2 w-40 bg-[#1a1f3a] border border-[rgba(0,211,242,0.3)] rounded-lg shadow-2xl overflow-hidden z-10">
                                    <button
                                        onClick={() => changeLanguage('en_GB')}
                                        className={`w-full px-4 py-3 text-left hover:bg-[rgba(0,211,242,0.1)] transition-colors ${
                                            i18n.language === 'en_GB' ? 'bg-[rgba(0,211,242,0.2)] text-[#00d3f2]' : 'text-white'
                                        }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => changeLanguage('zh_CN')}
                                        className={`w-full px-4 py-3 text-left hover:bg-[rgba(0,211,242,0.1)] transition-colors ${
                                            i18n.language === 'zh_CN' ? 'bg-[rgba(0,211,242,0.2)] text-[#00d3f2]' : 'text-white'
                                        }`}
                                    >
                                        中文
                                    </button>
                                    <button
                                        onClick={() => changeLanguage('es_ES')}
                                        className={`w-full px-4 py-3 text-left hover:bg-[rgba(0,211,242,0.1)] transition-colors ${
                                            i18n.language === 'es_ES' ? 'bg-[rgba(0,211,242,0.2)] text-[#00d3f2]' : 'text-white'
                                        }`}
                                    >
                                        Español
                                    </button>
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
                    />
                </div>

                {/* Right Side - Register Form */}
                <div className="w-full lg:w-[58%] flex items-center justify-center p-4 sm:p-8">
                    <div className="w-full max-w-2xl">
                        {/* Brand Info */}
                        <div className="mb-6 sm:mb-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4">
                                <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <div className="mb-2 flex items-center justify-center">
                                <DigisyntheticLogoLarge className="h-8 w-auto" fill="white" />
                            </div>
                            <p className="text-[#99a1af]">{t("subtitle")}</p>
                        </div>

                        {/* Register Form */}
                        <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 sm:p-8 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
                            <h2 className="text-white text-xl font-medium mb-2">{t("register")}</h2>
                            <p className="text-[#99a1af] mb-6">{t("signInText")}</p>

                            <Form
                                form={form}
                                name="register"
                                onFinish={onFinish}
                                autoComplete="off"
                                layout="vertical"
                                className="space-y-5"
                                initialValues={{
                                    email: searchParams.get('email'),
                                    emailSubscription: true
                                }}
                            >
                                {/* Email Field */}
                                <div className="mb-0">
                                    <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                        <span className="text-red-400">* </span>{t("email")}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                            <Mail className="h-5 w-5 text-[#00d3f2]" />
                                        </div>
                                        <Form.Item
                                            name="email"
                                            rules={[
                                                { required: true, message: t("emailError") },
                                                { type: "email", message: t("emailError") },
                                            ]}
                                            className="mb-0"
                                        >
                                            <Input
                                                placeholder={t("emailPlaceholder")}
                                                className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                style={{ 
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    height: '48px'
                                                }}
                                            />
                                        </Form.Item>
                                    </div>
                                </div>

                                {/* Password and Confirm Password Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Password Field */}
                                    <div className="mb-0">
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            <span className="text-red-400">* </span>{t("password")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <Lock className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Form.Item
                                                name="password"
                                                rules={[
                                                    { required: true, message: t("passwordError") },
                                                    { min: 8, max: 32, message: t("passwordLengthError") },
                                                ]}
                                                className="mb-0"
                                            >
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder={t("passwordPlaceholder")}
                                                    className="w-full pl-12 pr-12 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        height: '48px'
                                                    }}
                                                />
                                            </Form.Item>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#00d3f2] hover:text-[#00b8db] transition-colors z-20"
                                                style={{ height: '48px', top: '0' }}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="mb-0">
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            <span className="text-red-400">* </span>{t("confirmPassword")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <Lock className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Form.Item
                                                name="confirmPassword"
                                                dependencies={["password"]}
                                                rules={[
                                                    { required: true, message: t("confirmPasswordError") },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            if (!value || getFieldValue("password") === value) {
                                                                return Promise.resolve();
                                                            }
                                                            return Promise.reject(new Error(t("passwordsNotMatch")));
                                                        },
                                                    }),
                                                ]}
                                                className="mb-0"
                                            >
                                                <Input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder={t("confirmPasswordPlaceholder")}
                                                    className="w-full pl-12 pr-12 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        height: '48px'
                                                    }}
                                                />
                                            </Form.Item>
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#00d3f2] hover:text-[#00b8db] transition-colors z-20"
                                                style={{ height: '48px', top: '0' }}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Name and Industry Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Name Field */}
                                    <div className="mb-0">
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            <span className="text-red-400">* </span>{t("name")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <User className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Form.Item
                                                name="name"
                                                rules={[{ required: true, message: t("nameError") }]}
                                                className="mb-0"
                                            >
                                                <Input
                                                    placeholder={t("namePlaceholder")}
                                                    className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        height: '48px'
                                                    }}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>

                                    {/* Industry Field */}
                                    <div className="mb-0">
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            <span className="text-red-400">* </span>{t("industry")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <Building className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Form.Item
                                                name="industry"
                                                rules={[{ required: true, message: t("industryError") }]}
                                                className="mb-0"
                                            >
                                                <Input
                                                    placeholder={t("industryPlaceholder")}
                                                    className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        height: '48px'
                                                    }}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>

                                {/* Company and Position Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Company Field */}
                                    <div className="mb-0">
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            <span className="text-red-400">* </span>{t("company")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <Building className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Form.Item
                                                name="company"
                                                rules={[{ required: true, message: t("companyError") }]}
                                                className="mb-0"
                                            >
                                                <Input
                                                    placeholder={t("companyPlaceholder")}
                                                    className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        height: '48px'
                                                    }}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>

                                    {/* Position Field */}
                                    <div className="mb-0">
                                        <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                            <span className="text-red-400">* </span>{t("position")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <Briefcase className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Form.Item
                                                name="position"
                                                rules={[{ required: true, message: t("positionError") }]}
                                                className="mb-0"
                                            >
                                                <Input
                                                    placeholder={t("positionPlaceholder")}
                                                    className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        height: '48px'
                                                    }}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Field */}
                                <div className="mb-0">
                                    <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                        <span className="text-red-400">* </span>{t("contact")}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                            <Phone className="h-5 w-5 text-[#00d3f2]" />
                                        </div>
                                        <Form.Item
                                            name="contact"
                                            rules={[{ required: true, message: t("contactError") }]}
                                            className="mb-0"
                                        >
                                            <Input
                                                placeholder={t("contactPlaceholder")}
                                                className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                style={{ 
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    height: '48px'
                                                }}
                                            />
                                        </Form.Item>
                                    </div>
                                </div>

                                {/* Captcha Field */}
                                <div className="mb-0">
                                    <label className="block text-[#d1d5dc] mb-2 text-sm font-medium">
                                        <span className="text-red-400">* </span>{t("captcha")}
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <Lock className="h-5 w-5 text-[#00d3f2]" />
                                            </div>
                                            <Form.Item
                                                name="captcha"
                                                rules={[{ required: true, message: t("captchaError") }]}
                                                className="mb-0"
                                            >
                                                <Input
                                                    placeholder={t("captchaPlaceholder")}
                                                    className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white placeholder-[#6a7282] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        height: '48px'
                                                    }}
                                                />
                                            </Form.Item>
                                        </div>
                                        {captchaUrl && (
                                            <div className="h-12 w-30 border border-[rgba(0,211,242,0.3)] rounded-lg overflow-hidden cursor-pointer hover:border-[#00d3f2] transition-all duration-300">
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

                                {/* Newsletter Checkbox */}
                                <div className="flex items-start gap-3">
                                    <Form.Item
                                        name="emailSubscription"
                                        valuePropName="checked"
                                        className="mb-0"
                                    >
                                        <Checkbox className="mt-1">
                                            <span className="text-[#99a1af] text-sm">
                                                {t("emailSubscriptionText") || "I would like to receive email updates about products, promotions, and news"}
                                            </span>
                                        </Checkbox>
                                    </Form.Item>
                                </div>

                                {/* Submit Button */}
                                <Form.Item className="mb-0">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-gradient-to-r from-[#00d3f2] to-[#2b7fff] text-white rounded-lg hover:from-[#00b8db] hover:to-[#1e6eef] focus:outline-none focus:ring-2 focus:ring-[rgba(0,211,242,0.5)] transition-all duration-300 shadow-[0px_10px_15px_-3px_rgba(0,184,219,0.3),0px_4px_6px_-4px_rgba(0,184,219,0.3)] hover:shadow-[0px_15px_20px_-3px_rgba(0,184,219,0.4),0px_6px_8px_-4px_rgba(0,184,219,0.4)] hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? t("loading") : t("register")}
                                    </button>
                                </Form.Item>

                                {/* Sign In Link */}
                                <div className="text-center text-[#99a1af]">
                                    {t("noAccount") ? t("noAccount").replace("Don't have an account?", "Already have an account?") : "Already have an account?"}{' '}
                                    <Link to="/login" className="text-[#00d3f2] hover:text-[#00b8db] transition-colors">
                                        {t("signIn")}
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

export default Register;
