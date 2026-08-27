import { useState, useRef, useEffect, useCallback } from "react";
import { message } from "antd";
import { useTranslation } from "react-i18next";
import { getCaptcha } from "../api/api";

export const useCaptcha = () => {
    const { t } = useTranslation();
    const [captchaUrl, setCaptchaUrl] = useState("");
    const captchaUrlRef = useRef("");

    // 替换验证码地址前，先释放上一个 blob URL
    const applyCaptchaUrl = useCallback((url) => {
        if (captchaUrlRef.current?.startsWith("blob:")) {
            URL.revokeObjectURL(captchaUrlRef.current);
        }
        captchaUrlRef.current = url;
        setCaptchaUrl(url);
    }, []);

    const fetchCaptcha = useCallback(async () => {
        try {
            // 使用 arraybuffer 以便同时处理 JSON 和图片流
            const response = await getCaptcha({ responseType: "arraybuffer" });
            const contentType = response.headers["content-type"] || "";

            if (contentType.includes("application/json")) {
                // 如果是 JSON (Base64 模式)
                const enc = new TextDecoder("utf-8");
                const json = JSON.parse(enc.decode(response.data));
                if (json.status === 0 && json.data?.image) {
                    applyCaptchaUrl(json.data.image);
                } else {
                    message.error(t("captchaLoadError"));
                }
            } else if (contentType.includes("image")) {
                // 如果是图片流模式，将其转为 Blob URL，这样不会产生第二次网络请求
                const blob = new Blob([response.data], { type: contentType });
                applyCaptchaUrl(URL.createObjectURL(blob));
            } else {
                message.error(t("captchaLoadError"));
            }
        } catch (error) {
            console.error("Captcha fetch error:", error);
            message.error(t("captchaLoadError"));
        }
    }, [applyCaptchaUrl, t]);

    // 组件卸载时释放最后一个 blob URL
    useEffect(() => {
        return () => {
            if (captchaUrlRef.current?.startsWith("blob:")) {
                URL.revokeObjectURL(captchaUrlRef.current);
            }
        };
    }, []);

    return { captchaUrl, fetchCaptcha };
};
