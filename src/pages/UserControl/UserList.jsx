import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Space, Input, Radio, Select } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
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
    const [pageSize, setPageSize] = useState(10);

    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        level: 0,
        group: 0,
        enabled: 1
    });

    const [editingUser, setEditingUser] = useState(null);
    const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
    const [resettingUser, setResettingUser] = useState(null);
    const [showIds, setShowIds] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchData = async (page = 1, query = searchQuery) => {
        setLoading(true);
        try {
            const response = await getUserList({
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
        fetchData();
    }, []);

    const handleAdd = () => {
        setIsModalVisible(true);
        setNewUser({
            name: "",
            email: "",
            level: 0,
            group: 0,
            enabled: 1
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setNewUser({
            name: "",
            email: "",
            level: 0,
            group: 0,
            enabled: 1
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
                enabled: newUser.enabled
            });

            if (response.data.status === 0) {
                message.success(t('operationSuccess'));
                setSuccessMessage(responseMessage);
                setSuccessModalVisible(true);
                setIsModalVisible(false);
                fetchData(1);

                alert(JSON.stringify(response.data, null, 2));
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
            enabled: record.enabled
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
                enabled: editingUser.enabled
            });

            if (response.data.status === 0) {
                message.success(t('userUpdateSuccess'));
                setEditModalVisible(false);
                fetchData(pagination.current);
            } else {
                message.error(t('userUpdateError'));
            }
        } catch (error) {
            console.error("Error updating user:", error);
            message.error(t('userUpdateError'));
        }
    };

    const handleTableChange = (newPagination) => {
        fetchData(newPagination.current);
    };

    const handleResetPassword = async () => {
        try {
            const response = await resetUserPassword({
                id: resettingUser.id
            });

            if (response.data.status === 0) {
                message.success(t('resetPasswordSuccess'));
                setSuccessMessage(response.data.message);
                setSuccessModalVisible(true);
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
        fetchData(1, value);
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
            title: t('accessLevel'),
            dataIndex: 'level',
            width: '8%',
            align: 'center',
        },
        {
            title: t('userGroup'),
            dataIndex: 'group',
            width: '8%',
            align: 'center',
        },
        {
            title: t('lastLogin'),
            dataIndex: 'time_login_last',
            width: '12%',
            render: (time_login_last) => (
                time_login_last ? time_login_last : <span className="text-gray-400">{t('neverLoggedIn')}</span>
            )
        },
        {
            title: t('timeCreated'),
            dataIndex: 'time_created',
            width: '12%',
        },
        {
            title: t('timeUpdated'),
            dataIndex: 'time_updated',
            width: '12%',
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
            width: '15%',
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