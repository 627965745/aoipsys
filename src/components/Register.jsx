import { Button, Form, Input, message } from "antd";
import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { validateEmail, register } from "../api/api";

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const isForgetPassword = location.pathname.includes('forget');
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [captchaUrl, setCaptchaUrl] = useState("");

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const fetchCaptcha = async () => {
        try {
            const url = "https://rentwx.highmec.com/obj/Common/Captcha/get";
            const uniqueUrl = `${url}?t=${new Date().getTime()}`;
            setCaptchaUrl(uniqueUrl);
        } catch (error) {
            message.error(t("captchaLoadError"));
        }
    };

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleGetCode = async () => {
        try {
            const email = form.getFieldValue("email");
            const captcha = form.getFieldValue("captcha");

            if (!email || !captcha) {
                message.error(t("enterEmailAndCaptcha"));
                return;
            }

            setSendingCode(true);
            const response = await validateEmail({ email, captcha });

            if (response.data.status === 0) {
                message.success(t("emailValidationSent"));
                setShowPasswordFields(true);
                startCountdown();
            } else {
                message.error(
                    response.data.message || t("emailValidationFailed")
                );
                fetchCaptcha();
            }
        } catch (error) {
            message.error(
                error.response?.data?.message || t("emailValidationFailed")
            );
            fetchCaptcha();
        } finally {
            setSendingCode(false);
        }
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const registerData = {
                email: values.email,
                password: values.password,
                code: values.code,
            };

            await register(registerData);
            message.success(isForgetPassword ? t("passwordResetSuccess") : t("registerSuccess"));
            navigate("/login");
        } catch (error) {
            message.error(
                error.response?.data?.message || 
                (isForgetPassword ? t("passwordResetFailed") : t("registerFailed"))
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg relative">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isForgetPassword ? t("forgetPassword") : t("register")}
                    </h2>
                </div>
                <Form
                    form={form}
                    name="register"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                    style={{ maxWidth: 400, margin: "0 auto", padding: "24px" }}
                >
                    <Form.Item
                        name="email"
                        label={t("email")}
                        rules={[
                            { required: true, message: t("emailError") },
                            { type: "email", message: t("emailError") },
                        ]}
                    >
                        <Input placeholder={t("emailPlaceholder")} />
                    </Form.Item>

                    <Form.Item
                        label={t("captcha")}
                        name="captcha"
                        rules={[{ required: true, message: t("captchaError") }]}
                    >
                        <Input placeholder={t("captchaPlaceholder")} />
                    </Form.Item>

                    {captchaUrl && (
                        <div
                            style={{
                                textAlign: "center",
                                marginBottom: "16px",
                            }}
                        >
                            <img
                                src={captchaUrl}
                                alt="captcha"
                                onClick={fetchCaptcha}
                                style={{ cursor: "pointer" }}
                            />
                        </div>
                    )}

                    {!showPasswordFields && (
                        <Form.Item>
                            <Button
                                type="primary"
                                onClick={handleGetCode}
                                loading={sendingCode}
                                block
                            >
                                {t("getEmailVerification")}
                            </Button>
                        </Form.Item>
                    )}

                    {showPasswordFields && (
                        <>
                            <Form.Item
                                name="password"
                                label={t("password")}
                                rules={[
                                    {
                                        required: true,
                                        message: t("passwordError"),
                                    },
                                    {
                                        min: 8,
                                        max: 32,
                                        message: t("passwordLengthError"),
                                    },
                                ]}
                            >
                                <Input.Password
                                    placeholder={t("passwordPlaceholder")}
                                />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                label={t("confirmPassword")}
                                dependencies={["password"]}
                                rules={[
                                    {
                                        required: true,
                                        message: t("confirmPasswordError"),
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (
                                                !value ||
                                                getFieldValue("password") ===
                                                    value
                                            ) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                new Error(
                                                    t("passwordsNotMatch")
                                                )
                                            );
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    placeholder={t("passwordPlaceholder")}
                                />
                            </Form.Item>

                            <Form.Item
                                name="code"
                                label={t("verificationCode")}
                                rules={[
                                    {
                                        required: true,
                                        message: t("verificationCodeError"),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={t(
                                        "verificationCodePlaceholder"
                                    )}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                >
                                    {isForgetPassword ? t("resetPassword") : t("register")}
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form>
            </div>
        </div>
    );
};

export default Register;
