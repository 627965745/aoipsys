import React, { useState, useEffect } from "react";
import {
    Table,
    Input,
    Space,
    Tag,
    message,
    Breadcrumb,
    Tooltip,
    Modal,
    Button,
} from "antd";
import { useTranslation } from "react-i18next";
import { getResourceCondition, getResource, requestPdf } from "../../api/api";
import { Link } from "react-router-dom";
import {
    SearchOutlined,
    ToolOutlined,
    FileTextOutlined,
    BookOutlined,
    ReadOutlined,
    ExclamationCircleOutlined,
    AppstoreOutlined,
    CodeOutlined,
    EllipsisOutlined,
    FilePdfOutlined,
} from "@ant-design/icons";
import MdViewer from "../../components/MdViewer";
import html2pdf from 'html2pdf.js';
import axios from "axios";
import qs from "qs";

const { Search } = Input;

const Home = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [resources, setResources] = useState([]);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentResource, setCurrentResource] = useState(null);
    const [originalData, setOriginalData] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [plainPdfLoading, setPlainPdfLoading] = useState(false);

    // Fetch initial conditions
    useEffect(() => {
        fetchResources(1, pageSize);
        fetchConditions();
    }, [i18n.language]);
    const fetchConditions = async () => {
        try {
            const response = await getResourceCondition({
                language: i18n.language,
            });
            if (response.data.status === 0) {
                const nestedData = response.data.data || [];
                setOriginalData(nestedData);

                // Extract categories (parent items)
                const categoryData = nestedData.map((item) => ({
                    id: item.id,
                    name: item.name,
                }));

                // Extract all products (children items)
                const productData = nestedData.reduce((acc, category) => {
                    if (category.children) {
                        // Convert object to array of products
                        const products = Object.entries(
                            category.children
                        ).map(([id, name]) => ({
                            id,
                            name,
                            categoryId: category.id,
                        }));
                        return acc.concat(products);
                    }
                    return acc;
                }, []);

                setCategories(categoryData);
                setProducts(productData);
            }
        } catch (error) {
            message.error(error.response?.data?.message || t("fetchResourcesError"));
        }
    };

    // Fetch resources with complete object info
    const fetchResources = async (page, rows,query = searchQuery) => {
        setLoading(true);
        try {
            const params = {
                query,
                page,
                rows,
                product: selectedProduct?.id || "",
                category: selectedCategory?.id || "",
                language: i18n.language,
            };
            const response = await getResource(params);
            if (response.data.status === 0) {
                setResources(response.data.data.rows || []);
                setTotal(response.data.data.total || 0);
            }
        } catch (error) {
            message.error(error.response?.data?.message || t("fetchResourcesError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources(1, pageSize);
    }, [selectedProduct, selectedCategory]);

    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
        fetchResources(1, pageSize, value);
    };

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
        fetchResources(pagination.current, pagination.pageSize, searchQuery);
    };

    const typeConfig = {
        0: {
            key: "document"
        },
        1: {
            key: "software"
        },
        2: {
            key: "firmware"
        },
        3: {
            key: "other"
        },
    };

    const handleResourceClick = (record) => {
        const hasUrl = record.url && record.url.trim() !== "";
        const hasMarkdown = record.resource_names?.resource_markdown && record.resource_names.resource_markdown.trim() !== "";

        if (hasUrl && !hasMarkdown) {
            Modal.confirm({
                title: t("confirmJump"),
                icon: <ExclamationCircleOutlined />,
                content: t("jumpToExternalLink"),
                okText: t("confirm"),
                cancelText: t("cancel"),
                onOk() {
                    window.open(record.url, "_blank");
                },
            });
        } else if (!hasUrl && hasMarkdown) {
            setCurrentResource(record);
            setIsModalOpen(true);
        } else if (hasUrl && hasMarkdown) {
            setCurrentResource(record);
            
            setIsModalOpen(true);
        }
    };

    const handleUrlClick = (url) => {
        Modal.confirm({
            title: t("confirmJump"),
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>{t("jumpToExternalLink")}</p>
                    <p className="text-gray-500 break-all mt-2">{url}</p>
                </div>
            ),
            okText: t("confirm"),
            cancelText: t("cancel"),
            onOk() {
                window.open(url, "_blank");
            },
        });
    };

    const handleConvertToPdf = async () => {
        if (!currentResource?.resource_names?.resource_markdown) return;
        
        setPdfLoading(true);
        try {
            const element = document.getElementById('markdown-content');
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: `${currentResource.resource_names.resource_name}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 3,
                },
                jsPDF: { 
                    unit: 'in', 
                    format: 'a4', 
                    orientation: 'portrait'
                }
            };

            await html2pdf().set(opt).from(element).save();
            message.success(t('pdfDownloadSuccess'));
        } catch (error) {
            console.error('PDF download error:', error);
            message.error(t('pdfDownloadError'));
        } finally {
            setPdfLoading(false);
        }
    };

    const handleResquestPdf = async () => {
        if (!currentResource?.id) return;
        
        setPlainPdfLoading(true);
        try {
            // Create a direct axios instance to bypass the interceptors
            const directAxios = axios.create({
                baseURL: import.meta.env.VITE_API_BASE_URL,
                timeout: 10000,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                withCredentials: true,
                responseType: 'blob'
            });
            
            const response = await directAxios.post(
                "/Client/Search/pdfGet", 
                qs.stringify({
                    id: currentResource.id,
                    language: i18n.language
                })
            );
            
            // Response should be a blob directly
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${currentResource.resource_names.resource_name}.pdf`;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            message.success(t('pdfDownloadSuccess'));
        } catch (error) {
            console.error('PDF download error:', error);
            message.error(t('pdfDownloadError'));
        } finally {
            setPlainPdfLoading(false);
        }
    };

    const getFileExtension = (url) => {
        if (!url) return '';
        const match = url.match(/\.([^./?#]+)(?:[?#]|$)/);
        return match ? match[1].toUpperCase() : '';
    };

    const columns = [
        {
            title: t("type"),
            dataIndex: "type",
            key: "type",
            width: 120,
            render: (type) => (
                <Space>
                    <span>{t(typeConfig[type]?.key || "notAvailable")}</span>
                </Space>
            ),
        },
        {
            title: t("productName"),
            dataIndex: ["product_names", "product_name"],
            key: "product_name",
            width: 120,
        },
        {
            title: t("resourceName"),
            dataIndex: ["resource_names", "resource_name"],
            key: "name",
            width: 120,
        },
        {
            title: t("timeUpdated"),
            dataIndex: "time_updated",
            key: "time_updated",
            width: 180,
            // render: (time) => new Date(time).toLocaleString(),
        },
        {
            title: t("action"),
            key: "action",
            width: 100,
            render: (_, record) => {
                const hasUrl = record.url && record.url.trim() !== "";
                const hasMarkdown = record.resource_names?.resource_markdown && record.resource_names.resource_markdown.trim() !== "";
                const isSoftwareOrFirmware = record.type === 1 || record.type === 2;
                const fileType = getFileExtension(record.url);
                
                if (!hasUrl && !hasMarkdown) {
                    return (
                        <Tooltip title={t("notAvailableInYourLanguage")}>
                            <Button type="link" disabled className="text-gray-500">{t("currentlyUnavailable")}</Button>
                        </Tooltip>
                    );
                }
                
                return (
                    <Tooltip title={fileType ? `${t("fileType")}: ${fileType}` : ''}>
                        <Button type="link" onClick={() => handleResourceClick(record)}>
                            {!hasMarkdown && isSoftwareOrFirmware ? t("download") : t("view")}
                        </Button>
                    </Tooltip>
                );
            },
        },
    ];

    const handleCategoryClick = (category) => {
        setSelectedCategory(
            selectedCategory?.id === category.id ? null : category
        );
        setSelectedProduct(null);
    };

    const handleProductClick = (product) => {
        setSelectedProduct(selectedProduct?.id === product.id ? null : product);
    };

    const breadcrumbItems = [
        {
            title: (
                <Link
                    to="/"
                    onClick={() => {
                        setSelectedProduct(null);
                        setSelectedCategory(null);
                    }}
                >
                    {t("resource")}
                </Link>
            ),
        },
        ...(selectedCategory
            ? [
                  {
                      title: selectedCategory.name,
                  },
              ]
            : []),
        ...(selectedProduct
            ? [
                  {
                      title: selectedProduct.name,
                  },
              ]
            : []),
    ];

    const getFilteredProducts = () => {
        if (!selectedCategory) return products;

        // Find the selected category in the original data
        const categoryData = originalData.find(
            (c) => c.id === selectedCategory.id
        );

        // If category has children (products), convert the object to array
        if (categoryData && categoryData.children) {
            return Object.entries(categoryData.children).map(([id, name]) => ({
                id,
                name,
                categoryId: categoryData.id,
            }));
        }

        return [];
    };

    return (
        <div className="p-6">
            <Breadcrumb className="mb-4" items={breadcrumbItems} />

            {/* Product and Category Links */}
            <div className="mb-4">
                <div className="mb-2">
                    <h3 className="text-lg font-medium">{t("category")}:</h3>
                    <Space wrap className="mt-2">
                        {categories.map((category) => (
                            <Tag
                                key={category.id}
                                className="cursor-pointer px-4 py-2 text-sm"
                                color={
                                    selectedCategory?.id === category.id
                                        ? "blue"
                                        : "default"
                                }
                                onClick={() => handleCategoryClick(category)}
                            >
                                {category.name}
                            </Tag>
                        ))}
                    </Space>
                </div>
                <div className="mb-2 mt-6">
                    <h3 className="text-lg font-medium">{t("product")}:</h3>
                    <Space wrap className="mt-2">
                        {getFilteredProducts().map((product) => (
                            <Tag
                                key={product.id}
                                className="cursor-pointer px-4 py-2 text-sm"
                                color={
                                    selectedProduct?.id === product.id
                                        ? "blue"
                                        : "default"
                                }
                                onClick={() => handleProductClick(product)}
                            >
                                {product.name}
                            </Tag>
                        ))}
                    </Space>
                </div>
            </div>

            <div className="mb-4 mt-6">
                <Search
                    placeholder={t("search")}
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={handleSearch}
                    className="max-w-xl"
                />
            </div>

            <Table
                columns={columns}
                dataSource={resources}
                rowKey="id"
                loading={loading}
                pagination={{
                    total,
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total, range) =>
                        t("showingEntries", {
                            start: range[0],
                            end: range[1],
                            total,
                        }),
                    onChange: (page, newPageSize) => {
                        handleTableChange({ current: page, pageSize: newPageSize });
                    },
                }}
            />

            <Modal
                title={`${t('resourceName')}: ${currentResource?.resource_names?.resource_name}`}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={1300}
            >
                {currentResource?.url && (
                    <div className="mb-4">
                        <div className="flex items-center">
                            <Tooltip title={getFileExtension(currentResource.url) ? `${t("fileType")}: ${getFileExtension(currentResource.url)}` : ''}>
                                {currentResource.type === 1 ? (
                                    <Button 
                                        type="primary"
                                        onClick={() => handleUrlClick(currentResource.url)}
                                    >
                                        {t('download')}
                                    </Button>
                                ) : (
                                    <a 
                                        className="text-blue-500 hover:text-blue-700 mr-2"
                                        onClick={() => handleUrlClick(currentResource.url)}
                                    >
                                        {t('visitExternalLink')}
                                    </a>
                                )}
                            </Tooltip>
                        </div>
                        <div className="mt-2">
                            <p className="text-gray-500 break-all">{currentResource.url}</p>
                        </div>
                    </div>
                )}
                {currentResource?.resource_names?.resource_markdown && currentResource.type !== 1 && (
                    <>
                        <div className="flex justify-start">
                            <Button
                                type="primary"
                                icon={<FilePdfOutlined />}
                                onClick={handleConvertToPdf}
                                loading={pdfLoading}
                                disabled={pdfLoading || plainPdfLoading}
                            >
                                {t('downloadPdf')}
                            </Button>
                            <Button
                                type="primary"
                                className="ml-2"
                                icon={<FilePdfOutlined />}
                                onClick={handleResquestPdf}
                                loading={plainPdfLoading}
                                disabled={pdfLoading || plainPdfLoading}
                            >
                                {t('downloadPlainPdf')}
                            </Button>
                        </div>
                        <div id="markdown-content">
                            <MdViewer content={currentResource.resource_names.resource_markdown} />
                        </div>
                    </>
                )}
                {currentResource?.resource_names?.resource_markdown && currentResource.type === 1 && (
                    <div id="markdown-content">
                        <MdViewer content={currentResource.resource_names.resource_markdown} />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Home;
