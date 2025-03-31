import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Space, Input } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getLanguageList, createLanguage, updateLanguage } from '../../api/api';
import { useTranslation } from 'react-i18next';
import AddEdit from './AddEdit';

const LangList = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [showIds, setShowIds] = useState({});

    const [newLanguage, setNewLanguage] = useState({
        id: undefined,
        name: "",
        enabled: 1
    });

    const [editingLanguage, setEditingLanguage] = useState(null);

    const fetchData = async (page = 1, query = searchQuery) => {
        setLoading(true);
        try {
            const response = await getLanguageList({
                query,
                page,
                rows: pageSize
            });

            if (response.data.status === 0) {
                setData(response.data.data.rows);
                setPagination({
                    ...pagination,
                    current: page,
                    total: response.data.data.total,
                });
            } else {
                message.error(error.response?.data?.message || t('fetchLanguagesError'));
            }
        } catch (error) {
            console.error("Error fetching languages:", error);
            message.error(error.response?.data?.message || t('fetchLanguagesError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = () => {
        setIsModalVisible(true);
        setNewLanguage({
            id: undefined,
            name: "",
            enabled: 1
        });
    };

    const handleCreate = async () => {
        if (!setNewLanguage.validate()) {
            return;
        }

        try {
            const response = await createLanguage({
                id: newLanguage.id,
                name: newLanguage.name.trim(),
                enabled: newLanguage.enabled
            });

            if (response.data.status === 0) {
                message.success(t('languageCreateSuccess'));
                setIsModalVisible(false);
                fetchData(1);
            } else {
                message.error(error.response?.data?.message || t('languageCreateError'));
            }
        } catch (error) {
            console.error("Error creating language:", error);
            message.error(error.response?.data?.message || t('languageCreateError'));
        }
    };

    const handleEdit = (record) => {
        setEditingLanguage({
            id: record.id,
            name: record.name,
            enabled: record.enabled
        });
        setEditModalVisible(true);
    };

    const handleUpdate = async () => {
        if (!setEditingLanguage.validate()) {
            return;
        }

        try {
            const response = await updateLanguage({
                id: editingLanguage.id,
                name: editingLanguage.name.trim(),
                enabled: editingLanguage.enabled
            });

            if (response.data.status === 0) {
                message.success(t('languageUpdateSuccess'));
                setEditModalVisible(false);
                fetchData(pagination.current);
            } else {
                message.error(error.response?.data?.message || t('languageUpdateError'));
            }
        } catch (error) {
            console.error("Error updating language:", error);
            message.error(error.response?.data?.message || t('languageUpdateError'));
        }
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        fetchData(1, value);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setNewLanguage.resetErrors?.();
    };

    const handleEditModalCancel = () => {
        setEditModalVisible(false);
        setEditingLanguage.resetErrors?.();
    };

    const columns = [
        {
            title: t('languageName'),
            dataIndex: 'name',
            width: '30%',
            render: (name, record) => (
                <div>
                    <div>{name}</div>
                    <Button 
                        type="link" 
                        size="small" 
                        className="p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowIds(prev => ({
                                ...prev,
                                [record.id]: !prev[record.id]
                            }));
                        }}
                    >
                        {showIds[record.id] ? (
                            <span className="text-xs text-gray-400">ID: {record.id}</span>
                        ) : (
                            <span className="text-xs text-gray-400">{t('showId')}</span>
                        )}
                    </Button>
                </div>
            )
        },
        {
            title: t('timeCreated'),
            dataIndex: 'time_created',
            width: '20%',
        },
        {
            title: t('timeUpdated'),
            dataIndex: 'time_updated',
            width: '20%',
        },
        {
            title: t('status'),
            dataIndex: 'enabled',
            width: '15%',
            align: 'center',
            render: (enabled) => (
                <span style={{ color: enabled ? '#52c41a' : '#ff4d4f' }}>
                    {enabled ? <CheckOutlined /> : <CloseOutlined />}
                </span>
            ),
        },
        {
            title: t('action'),
            key: 'action',
            width: '15%',
            align: 'center',
            render: (_, record) => (
                <Button 
                    type="link" 
                    onClick={() => handleEdit(record)}
                >
                    {t('edit')}
                </Button>
            ),
        }
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold">{t('languageManagement')}</h1>
            <div className="flex justify-between mb-4 mt-4">
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    {t('addLanguage')}
                </Button>
                <Input.Search
                    placeholder={t('searchLanguagePlaceholder')}
                    allowClear
                    onSearch={handleSearch}
                    style={{ width: 300 }}
                    onChange={(e) => {
                        if (!e.target.value) {
                            handleSearch("");
                        }
                    }}
                />
            </div>
            <Table 
                columns={columns} 
                dataSource={data}
                pagination={{
                    total: pagination.total,
                    current: pagination.current,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => t('showingEntries', { start: range[0], end: range[1], total }),
                    onChange: (page, newPageSize) => {
                        setPagination(prev => ({
                            ...prev,
                            current: page,
                        }));
                        if (newPageSize !== pageSize) {
                            setPageSize(newPageSize);
                        }
                        fetchData(page, searchQuery);
                    },
                }}
                loading={loading}
                rowKey="id"
            />
            <Modal
                title={t('addLanguage')}
                open={isModalVisible}
                onOk={handleCreate}
                onCancel={handleModalCancel}
                okText={t('confirm')}
                cancelText={t('cancel')}
            >
                <AddEdit
                    language={newLanguage}
                    onChange={setNewLanguage}
                    isEditing={false}
                    t={t}
                />
            </Modal>

            <Modal
                title={t('editLanguage')}
                open={editModalVisible}
                onOk={handleUpdate}
                onCancel={handleEditModalCancel}
                okText={t('confirm')}
                cancelText={t('cancel')}
            >
                <AddEdit
                    language={editingLanguage}
                    onChange={setEditingLanguage}
                    isEditing={true}
                    t={t}
                />
            </Modal>
        </div>
    );
};

export default LangList;
