import { useState, useEffect } from "react";
import {
    Table,
    Input,
    Button,
    message,
    Modal,
    Radio,
    Space,
    Select,
} from "antd";
import { useTranslation } from "react-i18next";
import {
    getProductList,
    createProduct,
    updateProduct,
    getCategoryDropdown,
} from "../../api/api";
import {
    SearchOutlined,
    PlusOutlined,
    CheckOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

const ProductList = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [nameFilter, setNameFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        category: undefined,
        enabled: 1,
    });
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentCategoryName, setCurrentCategoryName] = useState("");
    const [pageSize, setPageSize] = useState(10);

    const fetchCategories = async () => {
        try {
            const response = await getCategoryDropdown();
            if (response.data.status === 0) {
                setCategories(response.data.data || []);
                return response;
            } else {
                message.error(t("fetchCategoriesError"));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            message.error(t("fetchCategoriesError"));
        }
    };

    const fetchData = async (page = 1, query = "", category = "") => {
        setLoading(true);
        try {
            const response = await getProductList({
                page,
                rows: pageSize,
                query,
                category,
            });

            if (response.data.status === 0) {
                setData(response.data.data.rows);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    total: response.data.data.total,
                }));
            } else {
                message.error(t("fetchProductsError"));
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            message.error(t("fetchProductsError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const categoryFromUrl = searchParams.get("category");

        const fetchInitialData = async () => {
            try {
                const categoriesResponse = await getCategoryDropdown();
                if (categoriesResponse.data.status === 0) {
                    const categoryData = categoriesResponse.data.data || [];
                    setCategories(categoryData);

                    if (categoryFromUrl) {
                        setCategoryFilter(categoryFromUrl);
                        fetchData(1, "", categoryFromUrl);
                    } else {
                        fetchData(1, "", "");
                    }
                }
            } catch (error) {
                message.error(t("fetchCategoriesError"));
            }
        };

        fetchInitialData();
    }, [searchParams]);

    useEffect(() => {
        if (categories.length > 0) {
            const categoryFromUrl = searchParams.get("category");
            if (categoryFromUrl) {
                const matchingCategory = categories.find(
                    (c) => c.id === categoryFromUrl
                );
                if (matchingCategory) {
                    setCurrentCategoryName(matchingCategory.name);
                }
            }
        }
    }, [categories]);

    const handleAdd = () => {
        if (categories.length === 0) {
            message.warning(t("addCategoryFirst"));
            return;
        }
        setIsModalVisible(true);
        setNewProduct({
            name: "",
            category: undefined,
            enabled: 1,
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleCreate = async () => {
        if (!newProduct.name.trim()) {
            message.error(t("productNameRequired"));
            return;
        }
        if (!newProduct.category) {
            message.error(t("categoryRequired"));
            return;
        }

        try {
            const response = await createProduct({
                name: newProduct.name.trim(),
                category: newProduct.category,
                enabled: newProduct.enabled,
            });

            if (response.data.status === 0) {
                message.success(t("productCreateSuccess"));
                setIsModalVisible(false);
                fetchData(1, nameFilter, categoryFilter);
            } else {
                message.error(t("productCreateError"));
            }
        } catch (error) {
            console.error("Error creating product:", error);
            message.error(t("productCreateError"));
        }
    };

    const handleEdit = (record) => {
        setEditingProduct({
            id: record.id,
            name: record.name,
            category: record.category_name,
            enabled: record.enabled,
        });
        setEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingProduct(null);
    };

    const handleUpdate = async () => {
        if (!editingProduct.name.trim()) {
            message.error(t("productNameRequired"));
            return;
        }
        if (!editingProduct.category) {
            message.error(t("categoryRequired"));
            return;
        }

        try {
            const response = await updateProduct({
                id: editingProduct.id,
                name: editingProduct.name.trim(),
                category: editingProduct.category,
                enabled: editingProduct.enabled,
            });

            if (response.data.status === 0) {
                message.success(t("productUpdateSuccess"));
                setEditModalVisible(false);
                fetchData(pagination.current, nameFilter, categoryFilter);
            } else {
                message.error(t("productUpdateError"));
            }
        } catch (error) {
            console.error("Error updating product:", error);
            message.error(t("productUpdateError"));
        }
    };

    const handleClearFilter = () => {
        setCategoryFilter("");
        setCurrentCategoryName("");
        setSearchParams({});
        fetchData(1, nameFilter, "");
    };

    const columns = [
        {
            title: t("productName"),
            dataIndex: "name",
            render: (text, record) => (
                <Link
                    to={`/admin/resource?product=${record.id}`}
                    className="text-blue-600 hover:text-blue-800"
                >
                    {text}
                </Link>
            ),
            filterDropdown: ({
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
            }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder={t("searchProductPlaceholder")}
                        value={selectedKeys[0]}
                        onChange={(e) =>
                            setSelectedKeys(
                                e.target.value ? [e.target.value] : []
                            )
                        }
                        onPressEnter={() => {
                            confirm();
                            setNameFilter(selectedKeys[0]);
                            fetchData(1, selectedKeys[0], categoryFilter);
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
                            fetchData(1, selectedKeys[0], categoryFilter);
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
                            fetchData(1, "", categoryFilter);
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
            width: "20%",
        },
        {
            title: t("categoryName"),
            dataIndex: "category_name",
            width: "20%",
        },
        {
            title: t("timeCreated"),
            dataIndex: "time_created",
            width: "20%",
        },
        {
            title: t("timeUpdated"),
            dataIndex: "time_updated",
            width: "20%",
        },
        {
            title: t("status"),
            dataIndex: "enabled",
            width: "10%",
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
        fetchData(newPagination.current, nameFilter, categoryFilter);
    };

    const handleSearch = (selectedKeys, confirm) => {
        confirm();
        setNameFilter(selectedKeys[0]);
        fetchData(1, selectedKeys[0], categoryFilter);
    };

    const handleCategoryFilter = (value) => {
        setCategoryFilter(value);
        fetchData(1, nameFilter, value);
    };

    return (
        <div className="flex flex-col mb-4">
            <h1 className="text-2xl font-bold">{t("productManagement")}</h1>

            <div className="flex justify-between items-center mb-4 mt-4">
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    {t("addProduct")}
                </Button>
                {currentCategoryName && (
                    <div className="flex items-center">
                        <span className="text-gray-600">
                            {t("showingProductsForCategory")}:{" "}
                            <span className="font-medium">
                                {currentCategoryName}
                            </span>
                        </span>
                        <Button
                            type="link"
                            onClick={handleClearFilter}
                            className="ml-2"
                        >
                            {t("showAll")}
                        </Button>
                    </div>
                )}
                <Select
                    placeholder={t("selectCategory")}
                    value={categoryFilter || undefined}
                    onChange={(value) => {
                        setCategoryFilter(value);
                        setSearchParams(value ? { category: value } : {});
                        fetchData(1, nameFilter, value);
                    }}
                    allowClear
                    style={{ width: 200 }}
                    options={categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                    }))}
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
                        fetchData(page, nameFilter, categoryFilter);
                    },
                }}
                loading={loading}
                rowKey="id"
            />
            <Modal
                title={t("addProduct")}
                open={isModalVisible}
                onOk={handleCreate}
                onCancel={handleCancel}
                okText={t("confirm")}
                cancelText={t("cancel")}
            >
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Input
                        placeholder={t("enterProductName")}
                        value={newProduct.name}
                        onChange={(e) =>
                            setNewProduct({
                                ...newProduct,
                                name: e.target.value,
                            })
                        }
                    />
                    <Select
                        placeholder={t("selectCategory")}
                        value={newProduct.category}
                        onChange={(value) =>
                            setNewProduct({
                                ...newProduct,
                                category: value,
                            })
                        }
                        style={{ width: "100%" }}
                    >
                        {categories.map((category) => (
                            <Select.Option
                                key={category.id}
                                value={category.id}
                            >
                                {category.name}
                            </Select.Option>
                        ))}
                    </Select>
                    <Radio.Group
                        value={newProduct.enabled}
                        onChange={(e) =>
                            setNewProduct({
                                ...newProduct,
                                enabled: e.target.value,
                            })
                        }
                    >
                        <Radio value={1}>{t("enabled")}</Radio>
                        <Radio value={0}>{t("disabled")}</Radio>
                    </Radio.Group>
                </Space>
            </Modal>
            <Modal
                title={t("editProduct")}
                open={editModalVisible}
                onOk={handleUpdate}
                onCancel={handleEditCancel}
                okText={t("confirm")}
                cancelText={t("cancel")}
            >
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Input
                        placeholder={t("enterProductName")}
                        value={editingProduct?.name}
                        onChange={(e) =>
                            setEditingProduct({
                                ...editingProduct,
                                name: e.target.value,
                            })
                        }
                    />
                    <Select
                        placeholder={t("selectCategory")}
                        value={editingProduct?.category}
                        defaultValue={editingProduct?.category}
                        onChange={(value) =>
                            setEditingProduct({
                                ...editingProduct,
                                category: value,
                            })
                        }
                        style={{ width: "100%" }}
                    >
                        {categories.map((category) => (
                            <Select.Option
                                key={category.id}
                                value={category.id}
                            >
                                {category.name}
                            </Select.Option>
                        ))}
                    </Select>
                    <Radio.Group
                        value={editingProduct?.enabled}
                        onChange={(e) =>
                            setEditingProduct({
                                ...editingProduct,
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

export default ProductList;
