import React, { useState } from 'react';
import { Input, Radio, Space } from "antd";

const AddEdit = ({ 
    language, 
    onChange,
    isEditing,
    t
}) => {
    const [idError, setIdError] = useState('');
    const [nameError, setNameError] = useState('');

    // Add reset function for errors
    const resetErrors = () => {
        setIdError('');
        setNameError('');
    };

    // Expose reset function to parent
    onChange.resetErrors = resetErrors;

    const validateLanguageId = (value) => {
        const languageIdPattern = /^[a-z]{2}_[A-Z]{2}$/;        
        if (!value) {
            return '语言ID不能为空';
        }
        
        if (!languageIdPattern.test(value)) {
            return '语言ID格式必须为 xx_XX（例如：zh_CN）';
        }
        
        
        return '';
    };

    const validateName = (value) => {
        if (!value || !value.trim()) {
            return '语言名称不能为空';
        }
        return '';
    };

    const handleChange = (field, value) => {
        if (field === 'id') {
            const error = validateLanguageId(value);
            setIdError(error);
        } else if (field === 'name') {
            const error = validateName(value);
            setNameError(error);
        }
        onChange({ ...language, [field]: value });
    };

    // Add validate method to be accessed by parent
    onChange.validate = () => {
        if (!isEditing) {
            const idValidationError = validateLanguageId(language?.id);
            setIdError(idValidationError);
            if (idValidationError) {
                return false;
            }
        }
        
        const nameValidationError = validateName(language?.name);
        setNameError(nameValidationError);
        if (nameValidationError) {
            return false;
        }
        
        return true;
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <div>
                <div className="mb-2">{t('languageName')}</div>
                <Input
                    placeholder={t('enterLanguageName')}
                    value={language?.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    status={nameError ? "error" : ""}
                />
                {nameError && (
                    <div className="text-red-500 text-sm mt-1">{nameError}</div>
                )}
            </div>
            {!isEditing && (
                <div>
                    <div className="mb-2">{t('languageID')}</div>
                    <Input
                        placeholder="zh_CN, en_GB, ja_JP"
                        value={language?.id}
                        onChange={(e) => handleChange('id', e.target.value)}
                        status={idError ? "error" : ""}
                        style={{ width: '100%' }}
                    />
                    {idError && (
                        <div className="text-red-500 text-sm mt-1">{idError}</div>
                    )}
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
