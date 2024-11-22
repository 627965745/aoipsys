import React, { useState } from 'react';
import { Input, Radio, Space, Select, Upload, message, Button, Modal, Form } from "antd";
import MdEditor from '../../components/MdEditor';
import { InboxOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import { uploadFile } from '../../api/api';

const { Dragger } = Upload;

const AddEditResource = ({ 
    resource, 
    onChange, 
    products, 
    typeOptions,
    t
}) => {
    const [isManualUrlModalVisible, setIsManualUrlModalVisible] = useState(false);
    const [manualUrl, setManualUrl] = useState('https://');

    const handleChange = (field, value) => {
        onChange({ ...resource, [field]: value });
    };

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await uploadFile(formData);
            if (response.data.status === 0) {
                const filename = response.data.data;
                const fullUrl = `https://rentwx.highmec.com/uploads/${filename}`;
                handleChange('url', fullUrl);
                return false;
            } else {
                message.error(t('uploadError'));
                return Upload.LIST_IGNORE;
            }
        } catch (error) {
            console.error("Upload error:", error);
            message.error(t('uploadError'));
            return Upload.LIST_IGNORE;
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

    const urlRegex = /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;

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
                    setManualUrl('https://');
                    setIsManualUrlModalVisible(true);
                }
            });
        } else {
            setManualUrl('https://');
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
        setManualUrl('https://');
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                    <div className="mb-2">{t('resourceName')}</div>
                    <Input
                        placeholder={t('enterResourceName')}
                        value={resource?.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <div className="mb-2">{t('productName')}</div>
                    <Select
                        placeholder={t('selectProduct')}
                        value={resource?.product}
                        onChange={(value) => handleChange('product', value)}
                        style={{ width: '100%' }}
                    >
                        {products.map(product => (
                            <Select.Option key={product.id} value={product.id}>
                                {product.name}
                            </Select.Option>
                        ))}
                    </Select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                    <div className="mb-2">{t('type')}</div>
                    <Select
                        placeholder={t('type')}
                        value={resource?.type}
                        onChange={(value) => handleChange('type', value)}
                        style={{ width: '100%' }}
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
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                            >
                                {resource.url}
                            </a>
                           
                                
                                {resource?.url && (
                                    <button 
                                        onClick={handleDeleteUrl}
                                        className="text-red-500 hover:text-red-700 underline ml-2"
                                        type="button"
                                    >
                                        {t('deleteUrl')}
                                    </button>
                                )}
                            
                        </div>

                    </div>
                ) : (
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
            </div>

            <Modal
                title={t('enterManualUrl')}
                open={isManualUrlModalVisible}
                onOk={handleManualUrlSubmit}
                onCancel={() => {
                    setIsManualUrlModalVisible(false);
                    setManualUrl('https://');
                }}
                okText={t('confirm')}
                cancelText={t('cancel')}
            >
                <Form.Item
                    validateStatus={manualUrl !== 'https://' && !isValidUrl(manualUrl) ? 'error' : ''}
                    help={manualUrl !== 'https://' && !isValidUrl(manualUrl) ? t('invalidUrlHint') : ''}
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
                <div className="mb-2">{t('markdown')}</div>
                <MdEditor
                    content={resource?.markdown}
                    onChange={(markdown) => handleChange('markdown', markdown)}
                />
            </div>
        </Space>
    );
};

export default AddEditResource;