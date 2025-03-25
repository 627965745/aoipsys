import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Image, Select } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword, logout } from "../api/api";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from "../contexts/AuthContext";

const ResetPassword = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();
    const [captchaUrl, setCaptchaUrl] = useState(
        `${import.meta.env.VITE_API_BASE_URL}/Common/Captcha/get`
    );
    const [loading, setLoading] = useState(false);
    const { checkAuthStatus } = useAuth();

    // Get source from URL parameters
    const searchParams = new URLSearchParams(location.search);
    
    const source = searchParams.get("source") || "client";
    useEffect(() => {
        refreshCaptcha();
    }, []);

    const refreshCaptcha = () => {
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}/Common/Captcha/get`;
            const uniqueUrl = `${url}?t=${new Date().getTime()}`;
            setCaptchaUrl(uniqueUrl);
        } catch (error) {
            message.error(t("captchaLoadError"));
        }
    };

    const handleSubmit = async (values) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error(error.response?.data?.message || t("passwordsNotMatch"));
            return;
        }

        setLoading(true);
        try {
            const response = await resetPassword({
                captcha: values.captcha,
                original: values.currentPassword,
                new: values.newPassword,
            });

            if (response.data.status === 0) {
                message.success(t("passwordResetSuccess"));
                try {
                    navigate(source === "admin" ? "/admin/" : "/", { replace: true });
                } catch (error) {
                    console.error("Logout error:", error);
                    await checkAuthStatus();
                    navigate(source === "admin" ? "/admin/login" : "/login", { replace: true });
                }
            } else {
                message.error(error.response?.data?.message || t("passwordResetError"));
                refreshCaptcha();
                form.setFieldsValue({ captcha: "" });
                form.resetFields(["captcha"]);
                form.setFields([
                    {
                        name: "captcha",
                        value: "",
                        touched: false,
                        validating: false,
                    },
                ]);
            }
        } catch (error) {
            console.error("Reset password error:", error);
            message.error(error.response?.data?.message || t("passwordResetError"));
            refreshCaptcha();
            form.setFieldsValue({ captcha: "" });
            form.resetFields(["captcha"]);
            form.setFields([
                {
                    name: "captcha",
                    value: "",
                    touched: false,
                    validating: false,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (value) => {
        i18n.changeLanguage(value);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg relative">
                <div className="absolute left-4 top-4">
                    <Button 
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                    >
                        {t('back')}
                    </Button>
                </div>

                <div className="absolute right-4 -top-4 ">
                    <Select
                        defaultValue={i18n.language}
                        onChange={handleLanguageChange}
                        style={{ width: 120 }}
                    >
                        <Select.Option value="en_GB">English</Select.Option>
                        <Select.Option value="zh_CN">中文</Select.Option>
                    </Select>
                </div>

                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {t("resetPassword")}
                    </h2>
                </div>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="mt-8 space-y-6"
                >
                    <Form.Item
                        name="currentPassword"
                        label={t("currentPassword")}
                        rules={[
                            { required: true, message: t("passwordRequired") },
                        ]}
                    >
                        <Input.Password
                            placeholder={t("enterCurrentPassword")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        label={t("newPassword")}
                        rules={[
                            { required: true, message: t("passwordRequired") },
                            { min: 8, message: t("passwordMinLength") },
                        ]}
                    >
                        <Input.Password placeholder={t("enterNewPassword")} />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label={t("confirmPassword")}
                        dependencies={["newPassword"]}
                        rules={[
                            {
                                required: true,
                                message: t("confirmPasswordRequired"),
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("newPassword") === value
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error(t("passwordsNotMatch"))
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder={t("confirmNewPassword")} />
                    </Form.Item>

                    <Form.Item
                        name="captcha"
                        label={t("captcha")}
                        rules={[
                            { required: true, message: t("captchaRequired") },
                        ]}
                    >
                        <div className="flex gap-4">
                            <Input placeholder={t("enterCaptcha")} />
                            <Image
                                src={captchaUrl}
                                alt="captcha"
                                preview={false}
                                className="cursor-pointer"
                                onClick={refreshCaptcha}
                            />
                        </div>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="w-full"
                        >
                            {t("resetPassword")}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default ResetPassword;
