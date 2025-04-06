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
    getLanguageCombo,
} from "../../api/api";
import {
    SearchOutlined,
    PlusOutlined,
    CheckOutlined,
    CloseOutlined,
    TranslationOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import AddEdit from './AddEdit';

const ProductList = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
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
        names: {},
        enabled: 1,
    });
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentCategoryName, setCurrentCategoryName] = useState("");

    const fetchCategories = async () => {
        try {
            const response = await getCategoryDropdown();
            if (response.data.status === 0) {
                setCategories(response.data.data || []);
                return response;
            } else {
                message.error(error.response?.data?.message || t("fetchCategoriesError"));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            message.error(error.response?.data?.message || t("fetchCategoriesError"));
        }
    };

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

    const fetchData = async (page, rows, query, category) => {
        setLoading(true);
        try {
            const response = await getProductList({
                page,
                rows,
                query,
                category,
            });

            if (response.data.status === 0) {
                setData(response.data.data.rows);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total,
                }));
            } else {
                message.error(error.response?.data?.message || t("fetchProductsError"));
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            message.error(error.response?.data?.message || t("fetchProductsError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const categoryFromUrl = searchParams.get("category");

        const fetchInitialData = async () => {
            try {
                await fetchLanguages();
                const categoriesResponse = await getCategoryDropdown();
                if (categoriesResponse.data.status === 0) {
                    const categoryData = categoriesResponse.data.data || [];
                    setCategories(categoryData);

                    if (categoryFromUrl) {
                        setCategoryFilter(categoryFromUrl);
                        fetchData(pagination.current, pagination.pageSize, "", categoryFromUrl);
                    } else {
                        fetchData(pagination.current, pagination.pageSize, "", "");
                    }
                }
            } catch (error) {
                message.error(error.response?.data?.message || t("fetchCategoriesError"));
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
            names: {},
            enabled: 1,
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleCreate = async () => {
        if (setNewProduct.validate && !setNewProduct.validate()) {
            return;
        }

        try {
            const response = await createProduct({
                name: newProduct.name.trim(),
                category: newProduct.category,
                names: newProduct.names || {},
                enabled: newProduct.enabled,
            });

            if (response.data.status === 0) {
                message.success(t("productCreateSuccess"));
                setNewProduct({
                    name: "",
                    category: undefined,
                    names: {},
                    enabled: 1,
                });
                setIsModalVisible(false);
                fetchData(1, pagination.pageSize, "", categoryFilter);
            } else {
                message.error(error.response?.data?.message || t("productCreateError"));
            }
        } catch (error) {
            console.error("Error creating product:", error);
            message.error(error.response?.data?.message || t("productCreateError"));
        }
    };

    const handleEdit = (record) => {
        setEditingProduct({
            id: record.id,
            name: record.name,
            category: record.category,
            names: record.names || {},
            enabled: record.enabled,
        });
        setEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingProduct(null);
    };

    const handleUpdate = async () => {
        if (setEditingProduct.validate && !setEditingProduct.validate()) {
            return;
        }

        try {
            const response = await updateProduct({
                id: editingProduct.id,
                name: editingProduct.name.trim(),
                category: editingProduct.category,
                names: editingProduct.names || {},
                enabled: editingProduct.enabled,
            });

            if (response.data.status === 0) {
                message.success(t("productUpdateSuccess"));
                setEditModalVisible(false);
                fetchData(pagination.current, pagination.pageSize, nameFilter, categoryFilter);
            } else {
                message.error(error.response?.data?.message || t("productUpdateError")); 
            }
        } catch (error) {
            console.error("Error updating product:", error);
            message.error(error.response?.data?.message || t("productUpdateError"));
        }
    };


    const handleTableChange = (page, newPageSize) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: newPageSize,
        }));
        fetchData(page, newPageSize, nameFilter, categoryFilter);
    }

    const handleClearFilter = () => {
        setCategoryFilter("");
        setCurrentCategoryName("");
        setSearchParams({});
        fetchData(pagination.current, pagination.pageSize, nameFilter, "");
    };

    const ProductNameCell = ({ record, languages }) => {
        const [showTranslations, setShowTranslations] = useState(false);
        
        return (
            <div>
                <div className="flex items-center">
                    <Link
                        to={`/admin/resource?product=${record.id}`}
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
            title: t("productName"),
            dataIndex: "name",
            render: (text, record) => <ProductNameCell record={record} languages={languages} />,
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
                            setNameFilter(selectedKeys[0]);
                            fetchData(pagination.current, pagination.pageSize, selectedKeys[0], categoryFilter);
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
                            setNameFilter(selectedKeys[0]);
                            fetchData(pagination.current, pagination.pageSize, selectedKeys[0], categoryFilter);
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
                            fetchData(pagination.current, pagination.pageSize, "", categoryFilter);
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


    const handleSearch = (selectedKeys, confirm) => {
        confirm();
        setNameFilter(selectedKeys[0]);
        fetchData(pagination.current, pagination.pageSize, selectedKeys[0], categoryFilter);
    };

    const handleCategoryFilter = (value) => {
        setCategoryFilter(value);
        fetchData(pagination.current, pagination.pageSize, nameFilter, value);
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
                        fetchData(pagination.current, pagination.pageSize, nameFilter, value);
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
                    pageSize: pagination.pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => t('showingEntries', { start: range[0], end: range[1], total }),
                    onChange: (page, newPageSize) => {
                        handleTableChange(page, newPageSize);
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
                <AddEdit
                    product={newProduct}
                    onChange={setNewProduct}
                    categories={categories}
                    languages={languages}
                />
            </Modal>
            <Modal
                title={t("editProduct")}
                open={editModalVisible}
                onOk={handleUpdate}
                onCancel={handleEditCancel}
                okText={t("confirm")}
                cancelText={t("cancel")}
            >
                {editingProduct && (
                    <AddEdit
                        product={editingProduct}
                        onChange={setEditingProduct}
                        categories={categories}
                        languages={languages}
                    />
                )}
            </Modal>
        </div>
    );
};

export default ProductList;
