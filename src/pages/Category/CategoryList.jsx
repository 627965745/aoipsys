import { useState, useEffect } from "react";
import { Table, Input, Button, message, Modal, Radio, Space, Tabs } from "antd";
import { Link, useNavigate } from "react-router-dom"; // Add this import
import { useTranslation } from "react-i18next";
import { getCategoryList, createCategory, updateCategory, getLanguageCombo } from "../../api/api";
import {
    SearchOutlined,
    PlusOutlined,
    CheckOutlined,
    CloseOutlined,
    TranslationOutlined
} from "@ant-design/icons";
import AddEdit from './AddEdit';

const CategoryList = () => {
    const { t, i18n } = useTranslation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [nameFilter, setNameFilter] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: "",
        names: {},
        enabled: 1,
    });
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [pageSize, setPageSize] = useState(10);
    const [languages, setLanguages] = useState();

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
                message.error(error.response?.data?.message || t("fetchCategoriesError"));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            message.error(error.response?.data?.message || t("fetchCategoriesError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        setLoadingLanguages(true);
        try {
            const response = await getLanguageCombo();
            if (response.data.status === 0) {
                setLanguages(response.data.data);

            }
        } catch (error) {
            console.error("Error fetching languages:", error);
        } finally {
            setLoadingLanguages(false);
        }
    };

    const handleAdd = () => {
        setIsModalVisible(true);
        setNewCategory({
            name: "",
            names: {},
            enabled: 1,
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleCreate = async () => {
        // Call validation before submitting
        if (!setNewCategory.validate || !setNewCategory.validate()) {
            return;
        }
        
        try {
            const response = await createCategory({
                name: newCategory.name,
                names: newCategory.names,
                enabled: newCategory.enabled
            });

            if (response.data.status === 0) {
                message.success(t("categoryCreateSuccess"));
                setNewCategory({
                    name: "",
                    names: {},
                    enabled: 1,
                });
                setIsModalVisible(false);
                fetchData(1, nameFilter);
            } else {
                message.error(error.response?.data?.message || t("categoryCreateError"));
            }
        } catch (error) {
            console.error("Error creating category:", error);
            message.error(error.response?.data?.message || t("categoryCreateError"));
        }
    };

    const handleEdit = (record) => {
        setEditingCategory({
            id: record.id,
            name: record.name,
            names: record.names || {},  // Ensure names is initialized as an object
            enabled: record.enabled,
        });
        setEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingCategory(null);
    };

    const handleUpdate = async () => {
        // Call validation before submitting
        if (!setEditingCategory.validate || !setEditingCategory.validate()) {
            return;
        }
        
        try {
            const response = await updateCategory({
                id: editingCategory.id,
                name: editingCategory.name,
                names: editingCategory.names,
                enabled: editingCategory.enabled
            });

            if (response.data.status === 0) {
                message.success(t("categoryUpdateSuccess"));
                setEditingCategory(null);
                setEditModalVisible(false);
                fetchData(pagination.current, nameFilter);
            } else {
                message.error(error.response?.data?.message || t("categoryUpdateError"));
            }
        } catch (error) {
            console.error("Error updating category:", error);
            message.error(error.response?.data?.message || t("categoryUpdateError"));
        }
    };

    // Create a separate component for the category name cell
    const CategoryNameCell = ({ record, languages }) => {
        const [showTranslations, setShowTranslations] = useState(false);
        
        return (
            <div>
                <div className="flex items-center">
                    <Link
                        to={`/admin/product?category=${record.id}`}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                        {record.name}
                    </Link>
                    <TranslationOutlined 
                        className="text-gray-400 cursor-pointer hover:text-blue-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTranslations(!showTranslations);
                        }}
                    />
                </div>
                
                {showTranslations && record.names && Object.entries(record.names).length > 0 && (
                    <div className="mt-1">
                        {Object.entries(record.names).map(([langId, data]) => {
                            const langName = languages?.find(l => l.id === langId)?.name || langId;
                            return (
                                <div key={langId} className="text-xs text-gray-400">
                                    {langName}: {data}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const columns = [
        {
            title: t("categoryName"),
            dataIndex: "name",
            render: (_, record) => <CategoryNameCell record={record} languages={languages} />,
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
                <AddEdit
                    category={newCategory}
                    onChange={setNewCategory}
                    languages={languages}
                />
            </Modal>
            <Modal
                title={t("editCategory")}
                open={editModalVisible}
                onOk={handleUpdate}
                onCancel={handleEditCancel}
                okText={t("confirm")}
                cancelText={t("cancel")}
            >
                {editingCategory && (
                    <AddEdit
                        category={editingCategory}
                        onChange={setEditingCategory}
                        languages={languages}
                    />
                )}
            </Modal>
        </div>
    );
};

export default CategoryList;
