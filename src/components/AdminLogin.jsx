import React, { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useTranslation } from "react-i18next";
import { login } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LoginForm = () => {
    const { t } = useTranslation();
    const [captchaUrl, setCaptchaUrl] = useState("");
    const [captchaValue, setCaptchaValue] = useState("");
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { checkAuthStatus } = useAuth();

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const fetchCaptcha = async () => {
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}/Common/Captcha/get`;
            const uniqueUrl = `${url}?t=${new Date().getTime()}`;

            setCaptchaUrl(uniqueUrl);
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
                navigate("/admin", { replace: true });
            } else {
                message.error(response.data.message || t("loginFailed"));
                setCaptchaValue("");
                fetchCaptcha();
            }
        } catch (error) {
            message.error(t("loginError"));
            setCaptchaValue("");
            fetchCaptcha();
        }
    };

    return (
        <div className="min-h-full flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {t("adminLogin")}
                    </h2>
                </div>

                <Form
                    form={form}
                    name="login"
                    onFinish={onFinish}
                    className="mt-8 space-y-6"
                    layout="vertical"
                >
                    <Form.Item
                        label={t("email")}
                        name="email"
                        rules={[{ required: true, message: t("emailError") }]}
                    >
                        <Input
                            placeholder={t("emailPlaceholder")}
                            className="rounded-md"
                        />
                    </Form.Item>

                    <Form.Item
                        label={t("password")}
                        name="password"
                        rules={[
                            { required: true, message: t("passwordError") },
                        ]}
                    >
                        <Input.Password
                            placeholder={t("passwordPlaceholder")}
                            className="rounded-md"
                        />
                    </Form.Item>

                    <Form.Item
                        label={t("captcha")}
                        name="captcha"
                        rules={[{ required: true, message: t("captchaError") }]}
                    >
                        <div className="flex w-full">
                            <Input
                                placeholder={t("captchaPlaceholder")}
                                className="flex-1 rounded-l-md rounded-r-none border-r-0"
                                value={captchaValue}
                                onChange={(e) => setCaptchaValue(e.target.value)}
                            />
                            {captchaUrl && (
                                <div className="h-[32px] w-[100px] border border-l-0 border-[#d9d9d9] rounded-r-md overflow-hidden">
                                    <img
                                        src={captchaUrl}
                                        alt="captcha"
                                        onClick={fetchCaptcha}
                                        className="h-full w-full cursor-pointer object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    </Form.Item>

                    <div className="flex flex-col space-y-4">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full rounded-md"
                        >
                            {t("login")}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default LoginForm;
