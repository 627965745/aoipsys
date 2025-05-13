import { Button, Form, Input, message } from "antd";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { register } from "../api/api";

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [captchaUrl, setCaptchaUrl] = useState("");

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const fetchCaptcha = async () => {
        try {
            const url = `${
                import.meta.env.VITE_API_BASE_URL
            }/Common/Captcha/get`;
            const uniqueUrl = `${url}?t=${new Date().getTime()}`;
            setCaptchaUrl(uniqueUrl);
        } catch (error) {
            message.error(t("captchaLoadError"));
        }
    };

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
            };

            const response = await register(registerData);

            if (response.data && response.data.status === 0) {
                message.success(t("registerSuccess"));
                navigate("/login");
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-xl p-8 space-y-8 bg-white rounded-lg shadow-lg relative">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {t("register")}
                    </h2>
                </div>
                <Form
                    form={form}
                    name="register"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                    style={{ maxWidth: 600, margin: "0 auto", padding: "24px" }}
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

                    <div className="flex gap-4">
                        <Form.Item
                            name="password"
                            label={t("password")}
                            className="flex-1"
                            rules={[
                                { required: true, message: t("passwordError") },
                                { min: 8, max: 32, message: t("passwordLengthError") },
                            ]}
                        >
                            <Input.Password placeholder={t("passwordPlaceholder")} />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label={t("confirmPassword")}
                            className="flex-1"
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
                        >
                            <Input.Password placeholder={t("confirmPasswordPlaceholder")} />
                        </Form.Item>
                    </div>

                    <div className="flex gap-4">
                        <Form.Item
                            name="name"
                            label={t("name")}
                            className="flex-1"
                            rules={[
                                { required: true, message: t("nameError") },
                            ]}
                        >
                            <Input placeholder={t("namePlaceholder")} />
                        </Form.Item>

                        <Form.Item
                            name="industry"
                            label={t("industry")}
                            className="flex-1"
                            rules={[
                                { required: true, message: t("industryError") },
                            ]}
                        >
                            <Input placeholder={t("industryPlaceholder")} />
                        </Form.Item>
                    </div>

                    <div className="flex gap-4">
                        <Form.Item
                            name="company"
                            label={t("company")}
                            className="flex-1"
                            rules={[
                                { required: true, message: t("companyError") },
                            ]}
                        >
                            <Input placeholder={t("companyPlaceholder")} />
                        </Form.Item>

                        <Form.Item
                            name="position"
                            label={t("position")}
                            className="flex-1"
                            rules={[
                                { required: true, message: t("positionError") },
                            ]}
                        >
                            <Input placeholder={t("positionPlaceholder")} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="contact"
                        label={t("contact")}
                        rules={[
                            { required: true, message: t("contactError") },
                        ]}
                    >
                        <Input placeholder={t("contactPlaceholder")} />
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

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            {t("register")}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Register;
