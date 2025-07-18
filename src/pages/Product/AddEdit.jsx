import { useState, useEffect, useRef } from "react";
import { Input, Select, Radio, Space, Tabs, Button } from "antd";
import { useTranslation } from "react-i18next";

const AddEdit = ({ product, onChange, languages, categories }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(null);
    const [errors, setErrors] = useState({});

    // Create refs for input fields
    const inputRefs = useRef({});

    // Initialize activeTab when component mounts or languages change
    useEffect(() => {
        if (languages?.length > 0) {
            if (!activeTab) setActiveTab(languages[0].id);
        }
    }, [languages]);

    // Focus input when tab changes
    useEffect(() => {
        if (activeTab && inputRefs.current[activeTab]) {
            // Use setTimeout to ensure the tab has fully rendered
            setTimeout(() => {
                inputRefs.current[activeTab]?.focus();
            }, 100);
        }
    }, [activeTab]);

    const validateInputs = () => {
        const newErrors = {};

        // Check display name
        if (!product?.name || product.name.trim() === "") {
            newErrors.displayName = t("productDisplayNameRequired");
        }

        // Check category
        if (!product?.category) {
            newErrors.category = t("categoryRequired");
        }

        // Check all enabled language inputs
        const emptyLanguages = languages
            .filter(
                (lang) =>
                    !product?.names?.[lang.id] ||
                    !product.names[lang.id].trim()
            );

        if (emptyLanguages?.length > 0) {
            newErrors.languages = emptyLanguages.map((lang) => lang.id);
            // Set active tab to first empty language
            setActiveTab(emptyLanguages[0].id);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Make validate method available to parent
    useEffect(() => {
        if (typeof onChange === "function") {
            onChange.validate = validateInputs;
        }
    }, [product, languages]);

    const handleLanguageNameChange = (langId, value) => {
        const newNames = { ...(product.names || {}) };

        if (value.trim() === "") {
            delete newNames[langId];
        } else {
            newNames[langId] = value.trim();
        }

        // Clear error for this language when user types
        if (errors.languages) {
            setErrors((prev) => ({
                ...prev,
                languages: prev.languages.filter((id) => id !== langId),
            }));
        }

        onChange({ ...product, names: newNames });
    };

    return (
        <Space direction="vertical" style={{ width: "100%" }}>
            <div>
                <div className="mb-2">{t("displayName")}</div>
                <Input
                    placeholder={t("enterProductName")}
                    value={product?.name || ""}
                    onChange={(e) => {
                        onChange({ ...product, name: e.target.value });
                        if (errors.displayName) {
                            setErrors((prev) => ({
                                ...prev,
                                displayName: null,
                            }));
                        }
                    }}
                    status={errors.displayName ? "error" : ""}
                />
                {errors.displayName && (
                    <div className="text-red-500 text-sm mt-1">
                        {errors.displayName}
                    </div>
                )}
            </div>

            <div>
                <div className="mb-2">{t("category")}</div>
                <Select
                    placeholder={t("selectCategory")}
                    value={product?.category}
                    onChange={(value) => {
                        onChange({ ...product, category: value });
                        if (errors.category) {
                            setErrors((prev) => ({ ...prev, category: null }));
                        }
                    }}
                    style={{ width: "100%" }}
                    status={errors.category ? "error" : ""}
                    showSearch
                    filterOption={(input, option) =>
                        option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {categories.map((category) => (
                        <Select.Option key={category.id} value={category.id}>
                            {category.name}
                        </Select.Option>
                    ))}
                </Select>
                {errors.category && (
                    <div className="text-red-500 text-sm mt-1">
                        {errors.category}
                    </div>
                )}
            </div>

            <div>
                <div className="mb-2">{t("productNames")}</div>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={
                        languages
                            .map((language) => {
                                const hasError = errors.languages?.includes(
                                    language.id
                                );
                                return {
                                    key: language.id,
                                    label: language.name,
                                    children: (
                                        <>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Input
                                                placeholder={t(
                                                    "enterProductName"
                                                )}
                                                value={product.names?.[language.id] || ""}
                                                onChange={(e) =>
                                                    handleLanguageNameChange(
                                                        language.id,
                                                        e.target.value
                                                    )
                                                }
                                                status={hasError ? "error" : ""}
                                                ref={(el) =>
                                                    (inputRefs.current[language.id] = el)
                                                }
                                            />
                                            <Button 
                                                type="primary"
                                                onClick={() => {
                                                    if (product?.name) {
                                                        handleLanguageNameChange(language.id, product.name);
                                                    }
                                                }}
                                            >
                                                {t('applyName')}
                                            </Button>
                                            
                                        </div>
                                        {hasError && (
                                            <div className="text-red-500 text-sm mt-1">
                                                {t("productNameRequired")}
                                            </div>
                                        )}
                                        </>
                                    ),
                                };
                            }) || []
                    }
                />
            </div>

            <div>
                <div className="mb-2">{t("status")}</div>
                <Radio.Group
                    value={product?.enabled}
                    onChange={(e) =>
                        onChange({ ...product, enabled: e.target.value })
                    }
                >
                    <Radio value={1}>{t("enabled")}</Radio>
                    <Radio value={0}>{t("disabled")}</Radio>
                </Radio.Group>
            </div>
        </Space>
    );
};

export default AddEdit;
