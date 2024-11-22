import { useState, useEffect } from "react";
import { Table, Input, Button, message, Modal, Radio, Space } from "antd";
import { Link, useNavigate } from "react-router-dom"; // Add this import
import { useTranslation } from "react-i18next";
import { getCategoryList, createCategory, updateCategory } from "../../api/api";
import {
    SearchOutlined,
    PlusOutlined,
    CheckOutlined,
    CloseOutlined,
} from "@ant-design/icons";

const CategoryList = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [nameFilter, setNameFilter] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [enabled, setEnabled] = useState(1);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [pageSize, setPageSize] = useState(10);

    const fetchData = async (page = 1, query = "") => {
        setLoading(true);
        try {
            const response = await getCategoryList({
                page,
                rows: pageSize,
                query,
            });

            if (response.data.status === 0) {
                setData(response.data.data.rows);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    total: response.data.data.total,
                }));
            } else {
                message.error(t("fetchCategoriesError"));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            message.error(t("fetchCategoriesError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = () => {
        setIsModalVisible(true);
        setNewCategoryName("");
        setEnabled(1);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleCreate = async () => {
        if (!newCategoryName.trim()) {
            message.error(t("categoryNameRequired"));
            return;
        }

        try {
            const response = await createCategory({
                name: newCategoryName.trim(),
                enabled: enabled,
            });

            if (response.data.status === 0) {
                message.success(t("categoryCreateSuccess"));
                setIsModalVisible(false);
                fetchData(1, nameFilter);
            } else {
                message.error(t("categoryCreateError"));
            }
        } catch (error) {
            console.error("Error creating category:", error);
            message.error(t("categoryCreateError"));
        }
    };

    const handleEdit = (record) => {
        setEditingCategory({
            id: record.id,
            name: record.name,
            enabled: record.enabled,
        });
        setEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingCategory(null);
    };

    const handleUpdate = async () => {
        if (!editingCategory.name.trim()) {
            message.error(t("categoryNameRequired"));
            return;
        }

        try {
            const response = await updateCategory({
                id: editingCategory.id,
                name: editingCategory.name.trim(),
                enabled: editingCategory.enabled,
            });

            if (response.data.status === 0) {
                message.success(t("categoryUpdateSuccess"));
                setEditModalVisible(false);
                fetchData(pagination.current, nameFilter);
            } else {
                message.error(t("categoryUpdateError"));
            }
        } catch (error) {
            console.error("Error updating category:", error);
            message.error(t("categoryUpdateError"));
        }
    };

    const columns = [
        {
            title: t("categoryName"),
            dataIndex: "name",
            render: (text, record) => (
                record.enabled ? (
                    <Link
                        to={`/admin/product?category=${record.id}`}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        {text}
                    </Link>
                ) : (
                    <span className="text-gray-400">
                        {text}
                    </span>
                )
            ),
            filterDropdown: ({
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
            }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder={t("searchCategoryPlaceholder")}
                        value={selectedKeys[0]}
                        onChange={(e) =>
                            setSelectedKeys(
                                e.target.value ? [e.target.value] : []
                            )
                        }
                        onPressEnter={() => {
                            confirm();
                            setNameFilter(selectedKeys[0]);
                            fetchData(1, selectedKeys[0]);
                        }}
                        style={{
                            width: 188,
                            marginBottom: 8,
                            display: "block",
                        }}
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            confirm();
                            setNameFilter(selectedKeys[0]);
                            fetchData(1, selectedKeys[0]);
                        }}
                        size="small"
                        style={{ width: 90, marginRight: 8 }}
                    >
                        {t("search")}
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters();
                            setNameFilter("");
                            fetchData(1, "");
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        {t("reset")}
                    </Button>
                </div>
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{ color: filtered ? "#1890ff" : undefined }}
                />
            ),
            width: "30%",
        },
        {
            title: t("timeCreated"),
            dataIndex: "time_created",
            width: "30%",
        },
        {
            title: t("timeUpdated"),
            dataIndex: "time_updated",
            width: "30%",
        },
        {
            title: t("status"),
            dataIndex: "enabled",
            width: "20%",
            align: "center",
            render: (enabled) => (
                <span
                    style={{
                        color: enabled ? "#52c41a" : "#ff4d4f",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {enabled ? <CheckOutlined /> : <CloseOutlined />}
                </span>
            ),
        },
        {
            title: t("action"),
            key: "action",
            width: "10%",
            align: "center",
            render: (_, record) => (
                <Button type="link" onClick={() => handleEdit(record)}>
                    {t("edit")}
                </Button>
            ),
        },
    ];

    const handleTableChange = (newPagination, filters, sorter) => {
        fetchData(newPagination.current, nameFilter);
    };

    return (

            <div className="flex flex-col mb-4">
                <h1 className="text-2xl font-bold">
                    {t("categoryManagement")}
                </h1>
                <div className="flex justify-start mb-4 mt-4">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        {t("addCategory")}
                    </Button>
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
                            fetchData(page, nameFilter);
                        },
                    }}
                    loading={loading}
                    rowKey="id"
                />
                <Modal
                    title={t("addCategory")}
                    open={isModalVisible}
                    onOk={handleCreate}
                    onCancel={handleCancel}
                    okText={t("confirm")}
                    cancelText={t("cancel")}
                >
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Input
                            placeholder={t("enterCategoryName")}
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <Radio.Group
                            value={enabled}
                            onChange={(e) => setEnabled(e.target.value)}
                        >
                            <Radio value={1}>{t("enabled")}</Radio>
                            <Radio value={0}>{t("disabled")}</Radio>
                        </Radio.Group>
                    </Space>
                </Modal>
                <Modal
                    title={t("editCategory")}
                    open={editModalVisible}
                    onOk={handleUpdate}
                    onCancel={handleEditCancel}
                    okText={t("confirm")}
                    cancelText={t("cancel")}
                >
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Input
                            placeholder={t("enterCategoryName")}
                            value={editingCategory?.name}
                            onChange={(e) =>
                                setEditingCategory({
                                    ...editingCategory,
                                    name: e.target.value,
                                })
                            }
                        />
                        <Radio.Group
                            value={editingCategory?.enabled}
                            onChange={(e) =>
                                setEditingCategory({
                                    ...editingCategory,
                                    enabled: e.target.value,
                                })
                            }
                        >
                            <Radio value={1}>{t("enabled")}</Radio>
                            <Radio value={0}>{t("disabled")}</Radio>
                        </Radio.Group>
                    </Space>
                </Modal>
            </div>
    );
};

export default CategoryList;
