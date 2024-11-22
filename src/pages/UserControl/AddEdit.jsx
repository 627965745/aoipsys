import React from 'react';
import { Input, Radio, Space, InputNumber, Select } from "antd";

const AddEditUser = ({ 
    user, 
    onChange,
    t
}) => {
    const handleChange = (field, value) => {
        onChange({ ...user, [field]: value });
    };

    const groupOptions = [
        { value: 1, label: t('normalUser') },
        { value: 2, label: t('admin') },
        { value: 3, label: t('superAdmin') }
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <div>
                <div className="mb-2">{t('userName')}</div>
                <Input
                    placeholder={t('enterUserName')}
                    value={user?.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                />
            </div>
            <div>
                <div className="mb-2">{t('email')}</div>
                <Input
                    placeholder={t('enterEmail')}
                    value={user?.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                />
            </div>
            <div>
                <div className="mb-2">{t('accessLevel')}</div>
                <InputNumber
                    min={0}
                    placeholder={t('enterAccessLevel')}
                    value={user?.level}
                    onChange={(value) => handleChange('level', value)}
                    style={{ width: '100%' }}
                />
            </div>
            <div>
                <div className="mb-2">{t('userGroup')}</div>
                <Select
                    placeholder={t('selectUserGroup')}
                    value={user?.group}
                    onChange={(value) => handleChange('group', value)}
                    style={{ width: '100%' }}
                >
                    {groupOptions.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            </div>
            <div>
                <div className="mb-2">{t('status')}</div>
                <Radio.Group 
                    value={user?.enabled}
                    onChange={(e) => handleChange('enabled', e.target.value)}
                >
                    <Radio value={1}>{t('enabled')}</Radio>
                    <Radio value={0}>{t('disabled')}</Radio>
                </Radio.Group>
            </div>
        </Space>
    );
};

export default AddEditUser;
