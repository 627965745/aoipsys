import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Space, Input, Radio, Select } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { getUserList, createUser, updateUser, resetUserPassword } from '../../api/api';
import { useTranslation } from 'react-i18next';
import AddEditUser from './AddEdit';

const UserList = () => {
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

    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        level: 0,
        group: undefined,
        enabled: 1,
        company: "",
        position: "",
        industry: "",
        contact: ""
    });

    const [editingUser, setEditingUser] = useState(null);
    const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
    const [resettingUser, setResettingUser] = useState(null);
    const [showIds, setShowIds] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchData = async (page, rows, query) => {
        setLoading(true);
        try {
            const response = await getUserList({
                query,
                page,
                rows
            });

            if (response.data.status === 0) {
                setData(response.data.data.rows);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total,
                }));
            } else {
                message.error(t('fetchUsersError'));
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            message.error(t('fetchUsersError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize, searchQuery);
    }, []);

    const handleAdd = () => {
        setIsModalVisible(true);
        setNewUser({
            name: "",
            email: "",
            level: 0,
            group: undefined,
            enabled: 1,
            company: "",
            position: "",
            industry: "",
            contact: ""
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setNewUser({
            name: "",
            email: "",
            level: 0,
            group: undefined,
            enabled: 1,
            company: "",
            position: "",
            industry: "",
            contact: ""
        });
    };

    const handleCreate = async () => {
        if (!newUser.name.trim()) {
            message.error(t('userNameRequired'));
            return;
        }
        if (!newUser.email.trim()) {
            message.error(t('emailRequired'));
            return;
        }

        try {
            const response = await createUser({
                name: newUser.name.trim(),
                email: newUser.email.trim(),
                level: newUser.level,
                group: newUser.group,
                enabled: newUser.enabled,
                company: newUser.company,
                position: newUser.position,
                industry: newUser.industry,
                contact: newUser.contact
            });

            if (response.data.status === 0) {
                message.success(t('operationSuccess'));
                setSuccessMessage(response.data.message || t('userCreateSuccess'));
                setSuccessModalVisible(true);
                setIsModalVisible(false);
                fetchData(1, pagination.pageSize, searchQuery);
            } else {
                message.error(t('userCreateError'));
            }
        } catch (error) {
            console.error("Error creating user:", error);
            message.error(t('userCreateError'));
        }
    };

    const handleEdit = (record) => {
        setEditingUser({
            id: record.id,
            name: record.name,
            email: record.email,
            level: record.level,
            group: record.group,
            enabled: record.enabled,
            company: record.company || "",
            position: record.position || "",
            industry: record.industry || "",
            contact: record.contact || ""
        });
        setEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingUser(null);
    };

    const handleUpdate = async () => {
        if (!editingUser.name.trim()) {
            message.error(t('userNameRequired'));
            return;
        }
        if (!editingUser.email.trim()) {
            message.error(t('emailRequired'));
            return;
        }

        try {
            const response = await updateUser({
                id: editingUser.id,
                name: editingUser.name.trim(),
                email: editingUser.email.trim(),
                level: editingUser.level,
                group: editingUser.group,
                enabled: editingUser.enabled,
                company: editingUser.company,
                position: editingUser.position,
                industry: editingUser.industry,
                contact: editingUser.contact
            });

            if (response.data.status === 0) {
                message.success(t('userUpdateSuccess'));
                setEditModalVisible(false);
                fetchData(pagination.current, pagination.pageSize, searchQuery);
            } else {
                message.error(t('userUpdateError'));
            }
        } catch (error) {
            console.error("Error updating user:", error);
            message.error(t('userUpdateError'));
        }
    };


    const handleTableChange = (page, newPageSize) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: newPageSize,
        }));
        fetchData(page, newPageSize, searchQuery);
    }

    const handleResetPassword = async () => {
        try {
            const response = await resetUserPassword({
                id: resettingUser.id
            });

            if (response.data.status === 0) {
                message.success(t('resetPasswordSuccess'));
                setSuccessMessage(response.data.message || t('resetPasswordSuccess'));
                setSuccessModalVisible(true);
                setResetPasswordModalVisible(false);
            } else {
                message.error(t('resetPasswordError'));
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            message.error(t('resetPasswordError'));
        }
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        fetchData(pagination.current, pagination.pageSize, value);
    };

    const expandedRowRender = (record) => {
        const detailColumns = [
            {
                title: t('accessLevel'),
                dataIndex: 'level',
                key: 'level',
                width: '20%',
                align: 'center',
            },
            {
                title: t('userGroup'),
                dataIndex: 'group',
                key: 'group',
                width: '20%',
                align: 'center',
                render: (group) => {
                    const groupOptions = [
                        { value: 1, label: t('normalUser') },
                        { value: 2, label: t('admin') },
                        { value: 3, label: `${t('normalUser')} + ${t('admin')}` }
                    ];
                    const option = groupOptions.find(opt => opt.value === group);
                    return option ? option.label : group;
                }
            },
            {
                title: t('lastLogin'),
                dataIndex: 'time_login_last',
                key: 'time_login_last',
                width: '20%',
                render: (time_login_last) => (
                    time_login_last ? time_login_last : <span className="text-gray-400">{t('neverLoggedIn')}</span>
                )
            },
            {
                title: t('timeCreated'),
                dataIndex: 'time_created',
                key: 'time_created',
                width: '20%',
            },
            {
                title: t('timeUpdated'),
                dataIndex: 'time_updated',
                key: 'time_updated',
                width: '20%',
            },
        ];

        return (
            <Table 
                columns={detailColumns} 
                dataSource={[record]} 
                pagination={false} 
                rowKey="id"
            />
        );
    };

    const columns = [
        {
            title: t('userName'),
            dataIndex: 'name',
            width: '15%',
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
            title: t('email'),
            dataIndex: 'email',
            width: '15%',
        },
        {
            title: t('company'),
            dataIndex: 'company',
            width: '15%',
            render: (company) => (
                company ? company : <span className="text-gray-400">{t('notProvided')}</span>
            )
        },
        {
            title: t('position'),
            dataIndex: 'position',
            width: '10%',
            render: (position) => (
                position ? position : <span className="text-gray-400">{t('notProvided')}</span>
            )
        },
        {
            title: t('industry'),
            dataIndex: 'industry',
            width: '10%',
            render: (industry) => (
                industry ? industry : <span className="text-gray-400">{t('notProvided')}</span>
            )
        },
        {
            title: t('contact'),
            dataIndex: 'contact',
            width: '15%',
            render: (contact) => (
                contact ? contact : <span className="text-gray-400">{t('notProvided')}</span>
            )
        },
        {
            title: t('status'),
            dataIndex: 'enabled',
            width: '8%',
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
            width: '10%',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button 
                        type="link" 
                        onClick={() => handleEdit(record)}
                    >
                        {t('edit')}
                    </Button>
                    <Button 
                        type="link"
                        onClick={() => {
                            setResettingUser(record);
                            setResetPasswordModalVisible(true);
                        }}
                    >
                        {t('resetPassword')}
                    </Button>
                </Space>
            ),
        }
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold">{t('userManagement')}</h1>
            <div className="flex justify-between mb-4 mt-4">
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    {t('addUser')}
                </Button>
                <Input.Search
                    placeholder={t('searchUserPlaceholder')}
                    allowClear
                    onSearch={handleSearch}
                    style={{ width: 300 }}
                />
            </div>
            <Table 
                columns={columns} 
                dataSource={data}
                pagination={{
                    total: pagination.total,
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => t('showingEntries', { start: range[0], end: range[1], total }),
                    onChange: (page, newPageSize) => {
                        handleTableChange(page, newPageSize);
                    },
                }}
                expandable={{
                    expandedRowRender,
                    expandRowByClick: false,
                }}
                loading={loading}
                rowKey="id"
            />
            <Modal
                title={t('addUser')}
                open={isModalVisible}
                onOk={handleCreate}
                onCancel={handleCancel}
                okText={t('confirm')}
                cancelText={t('cancel')}
            >
                <AddEditUser
                    user={newUser}
                    onChange={setNewUser}
                    t={t}
                />
            </Modal>

            <Modal
                title={t('editUser')}
                open={editModalVisible}
                onOk={handleUpdate}
                onCancel={handleEditCancel}
                okText={t('confirm')}
                cancelText={t('cancel')}
            >
                <AddEditUser
                    user={editingUser}
                    onChange={setEditingUser}
                    t={t}
                />
            </Modal>

            <Modal
                title={t('resetPasswordConfirmation')}
                open={resetPasswordModalVisible}
                onOk={handleResetPassword}
                onCancel={() => {
                    setResetPasswordModalVisible(false);
                    setResettingUser(null);
                }}
                okText={t('confirm')}
                cancelText={t('cancel')}
            >
                <p>{t('resetPasswordConfirmationMessage', { 
                    replace: { email: resettingUser?.email } 
                })}</p>
            </Modal>

            <Modal
                title={t('operationSuccess')}
                open={successModalVisible}
                onOk={() => setSuccessModalVisible(false)}
                okText={t('confirm')}
                footer={[
                    <Button key="submit" type="primary" onClick={() => setSuccessModalVisible(false)}>
                        {t('confirm')}
                    </Button>
                ]}
            >
                <p>{successMessage}</p>
            </Modal>
            
        </div>
    );
};

export default UserList;