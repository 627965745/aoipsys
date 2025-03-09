import React from 'react';
import { Input, Radio, Space, InputNumber } from "antd";

const AddEdit = ({ 
    language, 
    onChange,
    isEditing,
    t
}) => {
    const handleChange = (field, value) => {
        onChange({ ...language, [field]: value });
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <div>
                <div className="mb-2">{t('languageName')}</div>
                <Input
                    placeholder={t('enterLanguageName')}
                    value={language?.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                />
            </div>
            {!isEditing && (
                <div>
                    <div className="mb-2">{t('id')}</div>
                    <Input
                        placeholder={t('enterID')}
                        value={language?.id}
                        onChange={(e) => handleChange('id', e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
            )}
            <div>
                <div className="mb-2">{t('status')}</div>
                <Radio.Group 
                    value={language?.enabled}
                    onChange={(e) => handleChange('enabled', e.target.value)}
                >
                    <Radio value={1}>{t('enabled')}</Radio>
                    <Radio value={0}>{t('disabled')}</Radio>
                </Radio.Group>
            </div>
        </Space>
    );
};

export default AddEdit;
