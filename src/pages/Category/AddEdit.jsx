import { useState, useEffect, useRef } from "react";
import { Input, Radio, Space, Tabs, Button, Checkbox } from "antd";
import { useTranslation } from "react-i18next";

const AddEdit = ({ category, onChange, languages }) => {
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
        if (!category?.name || category.name.trim() === "") {
            newErrors.displayName = t("categoryDisplayNameRequired");
        }

        // Check all enabled language inputs
        const emptyLanguages = languages.filter(
            (lang) =>
                !category?.names?.[lang.id] || !category.names[lang.id].trim()
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
    }, [category, languages]);

    const handleLanguageNameChange = (langId, value) => {
        const newNames = { ...(category.names || {}) };

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

        onChange({ ...category, names: newNames });
    };

    const getNameByLanguage = (langCode) => {
        return category.names?.[langCode] || "";
    };

    return (
        <Space direction="vertical" style={{ width: "100%" }}>
            <div>
                <div className="mb-2">{t("displayName")}</div>
                <Input
                    placeholder={t("enterCategoryName")}
                    value={category.name || ""}
                    onChange={(e) => {
                        onChange({ ...category, name: e.target.value });
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
                <div className="mb-2">{t("categoryNames")}</div>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={
                        languages.map((language) => {
                            const hasError = errors.languages?.includes(
                                language.id
                            );
                            return {
                                key: language.id,
                                label: language.name,
                                children: (
                                    <>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder={t("enterCategoryName")}
                                            value={
                                                category.names?.[language.id] ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                handleLanguageNameChange(
                                                    language.id,
                                                    e.target.value
                                                )
                                            }
                                            status={hasError ? "error" : ""}
                                            ref={(el) =>
                                                (inputRefs.current[
                                                    language.id
                                                ] = el)
                                            }
                                        />
                                        <Button
                                            type="primary"
                                            onClick={() => {
                                                if (category?.name) {
                                                    handleLanguageNameChange(
                                                        language.id,
                                                        category.name
                                                    );
                                                }
                                            }}
                                        >
                                            {t("applyName")}
                                        </Button>
                                        
                                    </div>
                                    {hasError && (
                                            <div className="text-red-500 text-sm mt-1">
                                                {t("categoryNameRequired")}
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
                <div>{t("highlighted")}
                <Checkbox  className="ml-2"
                    checked={category.highlighted === 1}
                    onChange={(e) =>
                        onChange({ ...category, highlighted: e.target.checked ? 1 : 0 })
                    }
                >
                    
                </Checkbox></div>
            </div>
            <div>
                <div className="mb-2">{t("status")}</div>
                <Radio.Group
                    value={category.enabled}
                    onChange={(e) =>
                        onChange({ ...category, enabled: e.target.value })
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
