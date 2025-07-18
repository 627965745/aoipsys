import React, { useState, useEffect, useRef } from 'react';
import { Input, Radio, Space, Select, Upload, message, Button, Modal, Form, Tabs, Progress } from "antd";
import MdEditor from '../../components/MdEditor';
import { InboxOutlined, DeleteOutlined, LinkOutlined, CopyOutlined } from '@ant-design/icons';
import { uploadFile } from '../../api/api';

const { Dragger } = Upload;

const AddEditResource = ({ 
    resource, 
    onChange, 
    products, 
    typeOptions,
    languages,
    t
}) => {
    const [isManualUrlModalVisible, setIsManualUrlModalVisible] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [activeTab, setActiveTab] = useState(null);
    const [markdownTab, setMarkdownTab] = useState(null);
    const [errors, setErrors] = useState({});
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Create refs for input fields
    const inputRefs = useRef({});

    const validateInputs = () => {
        const newErrors = {};
        
        // Check display name
        if (!resource?.name || resource.name.trim() === '') {
            newErrors.name = t("resourceNameRequired");
        }

        // Check product
        if (!resource?.product) {
            newErrors.product = t("productRequired");
        }

        // Check all enabled language inputs
        const emptyLanguages = languages
            .filter(lang => !resource?.names?.[lang.id] || 
                           !resource.names[lang.id].trim());

        if (emptyLanguages?.length > 0) {
            newErrors.languages = emptyLanguages.map(lang => lang.id);
            // Set active tab to first empty language
            setActiveTab(emptyLanguages[0].id);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Make validate method available to parent
    useEffect(() => {
        if (typeof onChange === 'function') {
            onChange.validate = validateInputs;
        }
    }, [resource, languages]);

    // Initialize tabs when component mounts or languages change
    useEffect(() => {
        if (languages?.length > 0) {
            // Filter enabled languages first
            const enabledLanguages = languages
            
            if (enabledLanguages.length > 0) {
                if (!activeTab) setActiveTab(enabledLanguages[0].id);
                if (!markdownTab) setMarkdownTab(enabledLanguages[0].id);
            }
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

    const handleChange = (field, value) => {
        onChange({ ...resource, [field]: value });
    };

    const handleLanguageNameChange = (langId, value) => {
        const newNames = { ...(resource.names || {}) };
        
        if (value.trim() === '') {
            delete newNames[langId];
        } else {
            newNames[langId] = value.trim();
        }
        
        // Clear error for this language when user types
        if (errors.languages) {
            setErrors(prev => ({
                ...prev,
                languages: prev.languages.filter(id => id !== langId)
            }));
        }
        
        onChange({ ...resource, names: newNames });
    };

    const handleLanguageMarkdownChange = (langId, value) => {
        const newMarkdowns = { ...(resource.markdowns || {}) };
        
        if (!value.trim()) {
            delete newMarkdowns[langId];
        } else {
            newMarkdowns[langId] = value.trim();
        }
        
        onChange({ ...resource, markdowns: newMarkdowns });
    };

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const response = await uploadFile(formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                    if (percentCompleted === 100) {
                        setIsProcessing(true);
                    }
                }
            });

            if (response.data.status === 0) {
                const filename = response.data.data;
                const relativePath = `/uploads/${filename}`;
                handleChange('url', relativePath);
                
                const fullUrl = `${window.location.origin}${relativePath}`;
                message.success(`${t('uploadSuccess')}: ${fullUrl}`);
                
                return false;
            } else {
                message.error(error.response?.data?.message || t('uploadError'));
                return Upload.LIST_IGNORE;
            }
        } catch (error) {
            console.error("Upload error:", error);
            message.error(error.response?.data?.message || t('uploadError'));
            return Upload.LIST_IGNORE;
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setIsProcessing(false);
        }
    };

    const uploadProps = {
        name: 'file',
        multiple: false,
        maxCount: 1,
        beforeUpload: handleUpload,
        showUploadList: {
            showDownloadIcon: false,
            showRemoveIcon: false,
        },
    };

    const handleDeleteUrl = () => {
        handleChange('url', '');
    };

    const urlRegex = /^https?:\/\/([\w-]+\.)+[\w-]+(:\d+)?(\/[\w-./?%&=+#]*)?$/;

    const isValidUrl = (urlString) => {
        return urlRegex.test(urlString);
    };

    const showManualUrlModal = () => {
        if (resource?.url) {
            Modal.confirm({
                title: t('replaceUrlConfirmation'),
                content: t('replaceUrlWarning'),
                okText: t('confirm'),
                cancelText: t('cancel'),
                onOk: () => {
                    setManualUrl('');
                    setIsManualUrlModalVisible(true);
                }
            });
        } else {
            setManualUrl('');
            setIsManualUrlModalVisible(true);
        }
    };

    const handleManualUrlChange = (e) => {
        let value = e.target.value;
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
            value = 'https://' + value.replace(/^https?:\/\//, '');
        }
        setManualUrl(value);
    };

    const handleManualUrlSubmit = () => {
        if (!manualUrl.trim() || manualUrl === 'https://') {
            message.error(t('urlRequired'));
            return;
        }

        if (!isValidUrl(manualUrl.trim())) {
            message.error(t('invalidUrl'));
            return;
        }

        handleChange('url', manualUrl.trim());
        setIsManualUrlModalVisible(false);
        setManualUrl('');
    };

    const copyUrlToClipboard = () => {
        const url = resource.url.startsWith('/') ? `${window.location.origin}${resource.url}` : resource.url;
        navigator.clipboard.writeText(url)
            .then(() => {
                message.success('链接已复制到剪贴板');
            })
            .catch(err => {
                console.error('复制失败:', err);
                message.error('复制失败，请手动复制');
            });
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                    <div className="mb-2">{t('displayName')}</div>
                    <Input
                        placeholder={t('enterResourceName')}
                        value={resource?.name}
                        onChange={(e) => {
                            handleChange('name', e.target.value);
                            if (errors.name) {
                                setErrors(prev => ({ ...prev, name: null }));
                            }
                        }}
                        status={errors.name ? "error" : ""}
                    />
                    {errors.name && (
                        <div className="text-red-500 text-sm mt-1">{errors.name}</div>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div className="mb-2">{t('productName')}</div>
                    <Select
                        placeholder={t('selectProduct')}
                        value={resource?.product}
                        onChange={(value) => {
                            handleChange('product', value);
                            if (errors.product) {
                                setErrors(prev => ({ ...prev, product: null }));
                            }
                        }}
                        style={{ width: '100%' }}
                        status={errors.product ? "error" : ""}
                        showSearch
                        filterOption={(input, option) =>
                            option?.children?.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {products.map(product => (
                            <Select.Option key={product.id} value={product.id}>
                                {product.name}
                            </Select.Option>
                        ))}
                    </Select>
                    {errors.product && (
                        <div className="text-red-500 text-sm mt-1">{errors.product}</div>
                    )}
                </div>
            </div>

            <div>
                <div className="mb-2">{t('resourceNames')}</div>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={languages
                        .map(language => {
                            const hasError = errors.languages?.includes(language.id);
                            return {
                                key: language.id,
                                label: language.name,
                                children: (
                                    <div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Input
                                                placeholder={t('enterResourceName')}
                                                value={resource.names?.[language.id] || ''}
                                                onChange={(e) => handleLanguageNameChange(language.id, e.target.value)}
                                                ref={el => inputRefs.current[language.id] = el}
                                                status={hasError ? "error" : ""}
                                            />
                                            <Button 
                                                type="primary"
                                                onClick={() => {
                                                    if (resource?.name) {
                                                        handleLanguageNameChange(language.id, resource.name);
                                                    }
                                                }}
                                            >
                                                {t('applyName')}
                                            </Button>
                                        </div>
                                        {hasError && (
                                            <div className="text-red-500 text-sm mt-1">
                                                {t("resourceNameRequired")}
                                            </div>
                                        )}
                                    </div>
                                )
                            };
                        }) || []
                    }
                />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                    <div className="mb-2">{t('type')}</div>
                    <Select
                        placeholder={t('type')}
                        value={resource?.type}
                        onChange={(value) => handleChange('type', value)}
                        style={{ width: '100%' }}
                        showSearch
                        filterOption={(input, option) =>
                            option?.children?.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {typeOptions.map(option => (
                            <Select.Option key={option.value} value={option.value}>
                                {option.label}
                            </Select.Option>
                        ))}
                    </Select>
                </div>
                <div style={{ flex: 1 }}>
                    <div className="mb-2">{t('accessLevel')}</div>
                    <Input
                        type="number"
                        placeholder={t('accessLevel')}
                        value={resource?.level}
                        onChange={(e) => handleChange('level', parseInt(e.target.value) || 0)}
                        min={0}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <div className="mb-2">{t('status')}</div>
                    <Radio.Group 
                        value={resource?.enabled}
                        onChange={(e) => handleChange('enabled', e.target.value)}
                    >
                        <Radio value={1}>{t('enabled')}</Radio>
                        <Radio value={0}>{t('disabled')}</Radio>
                    </Radio.Group>
                </div>
            </div>

            <div>
                <div className="mb-2 flex justify-between items-center">
                    <span>{t('url')}</span>
                    <Button 
                        type="link" 
                        icon={<LinkOutlined />}
                        onClick={showManualUrlModal}
                    >
                        {t('enterManualUrl')}
                    </Button>
                </div>
                {resource?.url ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <a 
                                href={resource.url.startsWith('/') ? `${window.location.origin}${resource.url}` : resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                            >
                                {resource.url.startsWith('/') ? `${window.location.origin}${resource.url}` : resource.url}
                            </a>
                            {resource?.url && (
                                <>
                                    <button
                                        onClick={copyUrlToClipboard}
                                        className="text-blue-500 hover:text-blue-700 underline ml-2"
                                        type="button"
                                    >
                                        复制到剪贴板
                                    </button>
                                    <button 
                                        onClick={handleDeleteUrl}
                                        className="text-red-500 hover:text-red-700 underline ml-2"
                                        type="button"
                                    >
                                        {t('deleteUrl')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        {!isUploading && !isProcessing && (
                            <Dragger {...uploadProps}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">{t('clickOrDragFile')}</p>
                                <p className="ant-upload-hint">
                                    {t('uploadHint')}
                                </p>
                            </Dragger>
                        )}
                        {(isUploading || isProcessing) && (
                            <div className="mt-4">
                                <Progress 
                                    percent={uploadProgress} 
                                    status={uploadProgress === 100 ? "success" : "active"}
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                />
                                {isProcessing && uploadProgress === 100 && (
                                    <div className="text-center mt-2 text-gray-600">
                                        {t('processingFile')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                title={t('enterManualUrl')}
                open={isManualUrlModalVisible}
                onOk={handleManualUrlSubmit}
                onCancel={() => {
                    setIsManualUrlModalVisible(false);
                    setManualUrl('');
                }}
                okText={t('confirm')}
                cancelText={t('cancel')}
            >
                <Form.Item
                    validateStatus={manualUrl && manualUrl !== 'https://' && !isValidUrl(manualUrl) ? 'error' : ''}
                    help={manualUrl && manualUrl !== 'https://' && !isValidUrl(manualUrl) ? t('invalidUrlHint') : ''}
                >
                    <Input
                        placeholder={t('enterUrlPlaceholder')}
                        value={manualUrl}
                        onChange={handleManualUrlChange}
                        onFocus={(e) => {
                            const val = e.target.value;
                            e.target.value = '';
                            e.target.value = val;
                        }}
                    />
                </Form.Item>
            </Modal>

            <div>
                <div className="mb-2">{t('markdowns')}</div>
                <Tabs
                    activeKey={markdownTab}
                    onChange={setMarkdownTab}
                    items={languages
                        .map(language => ({
                            key: language.id,
                            label: language.name,
                            children: (
                                <MdEditor
                                    content={resource?.markdowns?.[language.id] || ''}
                                    onChange={(markdown) => handleLanguageMarkdownChange(language.id, markdown)}
                                    onCancel={() => setIsModalVisible(false)}
                                />
                            )
                        })) || []
                    }
                />
            </div>
        </Space>
    );
};

export default AddEditResource;