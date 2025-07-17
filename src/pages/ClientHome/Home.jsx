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
    const [plainPdfLoading, setPlainPdfLoading] = useState(false);
    const [plainPdfProgress, setPlainPdfProgress] = useState(0);

    // Fetch initial conditions
    useEffect(() => {
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
                    highlighted: item.highlighted,
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
        if (selectedProduct) {
            fetchResources(1, pageSize);
        } else {
            // Clear resources when no product is selected
            setResources([]);
            setTotal(0);
            setCurrentPage(1);
        }
    }, [selectedProduct, selectedCategory]);

    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
        if (selectedProduct) {
            fetchResources(1, pageSize, value);
        }
    };

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
        if (selectedProduct) {
            fetchResources(pagination.current, pagination.pageSize, searchQuery);
        }
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

    const handleUrlClick = (url, isDownload = false) => {
        if (isDownload) {
            // Direct download without opening new page
            const link = document.createElement('a');
            link.href = url;
            link.download = ''; // Let browser determine filename from URL
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Show confirmation for external links
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
        }
    };



        const handleResquestPdf = async () => {
        if (!currentResource?.id) return;
        
        setPlainPdfLoading(true);
        setPlainPdfProgress(0);
        
        let currentProgress = 0;
        let targetProgress = 0;
        let smoothingInterval = null;
        let totalSize = 0;
        
        const smoothProgress = () => {
            if (currentProgress < targetProgress) {
                currentProgress = Math.min(targetProgress, currentProgress + 2);
                setPlainPdfProgress(currentProgress);
                
                if (currentProgress < targetProgress) {
                    smoothingInterval = requestAnimationFrame(smoothProgress);
                } else {
                    smoothingInterval = null;
                }
            }
        };
        
        try {
            const response = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL}/Client/Search/pdfGet`);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.responseType = 'blob';
                xhr.withCredentials = true;
                
                // Try to get content-length from response headers
                xhr.onreadystatechange = () => {
                    if (xhr.readyState >= 2 && !totalSize) { // Headers received
                        const contentLength = xhr.getResponseHeader('content-length');
                        if (contentLength) {
                            totalSize = parseInt(contentLength, 10);
                            console.log('Got content-length from headers:', totalSize);
                        }
                    }
                };
                
                xhr.onprogress = (event) => {
                    let percentCompleted;
                    
                    const total = event.total || totalSize;
                    
                    if (total > 0) {
                        percentCompleted = Math.round((event.loaded * 100) / total);
                        console.log('Progress:', percentCompleted + '%', `(${event.loaded}/${total} bytes)`);
                    } else {
                        const loadedKB = Math.round(event.loaded / 1024);
                        percentCompleted = Math.min(85, Math.sqrt(loadedKB) * 8);
                        console.log('Estimated progress:', percentCompleted + '%', `(${loadedKB}KB loaded, no total)`);
                    }
                    
                    targetProgress = Math.round(percentCompleted);
                    
                    if (!smoothingInterval) {
                        smoothProgress();
                    }
                };
                
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        targetProgress = 100;
                        if (!smoothingInterval) {
                            smoothProgress();
                        }
                        
                        const waitForCompletion = () => {
                            if (currentProgress >= 100) {
                                resolve({ data: xhr.response });
                            } else {
                                requestAnimationFrame(waitForCompletion);
                            }
                        };
                        waitForCompletion();
                    } else {
                        reject(new Error(`HTTP ${xhr.status}`));
                    }
                };
                
                xhr.onerror = () => reject(new Error('Network error'));
                
                const formData = qs.stringify({
                    id: currentResource.id,
                    language: i18n.language
                });
                
                xhr.send(formData);
            });
            
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            const dateString = formatDateForFilename(currentResource.time_updated);
            link.download = `${currentResource.resource_names.resource_name}${dateString}.pdf`;
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
            // Clean up smoothing animation on error
            if (smoothingInterval) {
                cancelAnimationFrame(smoothingInterval);
            }
        } finally {
            // Clean up smoothing animation
            if (smoothingInterval) {
                cancelAnimationFrame(smoothingInterval);
            }
            
            setTimeout(() => {
                setPlainPdfLoading(false);
                setPlainPdfProgress(0);
            }, 1000);
        }
    };

    const getFileExtension = (url) => {
        if (!url) return '';
        const match = url.match(/\.([^./?#]+)(?:[?#]|$)/);
        return match ? match[1].toUpperCase() : '';
    };

    const formatDateForFilename = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
            const day = date.getDate().toString().padStart(2, '0');
            return `_${year}${month}${day}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
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
        if (!selectedCategory) return [];

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
                                    category.highlighted === 1 
                                        ? undefined 
                                        : (selectedCategory?.id === category.id ? "blue" : "default")
                                }
                                style={
                                    category.highlighted === 1 
                                        ? {
                                            backgroundColor: selectedCategory?.id === category.id 
                                                ? "#645D21" 
                                                : "#B8BE14",
                                            color: "white",
                                            border: "none"
                                        }
                                        : {}
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
                        {!selectedCategory ? (
                            <div className="text-gray-500 italic py-2">
                                {t("pleaseChooseCategory") || "Please choose a category"}
                            </div>
                        ) : (
                            getFilteredProducts().map((product) => (
                                <Tag
                                    key={product.id}
                                    className="cursor-pointer px-4 py-2 text-sm border-0"
                                    color={
                                        selectedProduct?.id === product.id
                                            ? "blue"
                                            : "default"
                                    }                                   
                                    onClick={() => handleProductClick(product)}
                                >
                                    {product.name}
                                </Tag>
                            ))
                        )}
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
                locale={{
                    emptyText: !selectedProduct 
                        ? (t("pleaseChooseProduct") || "Please choose a product to view resources")
                        : (t("noData") || "No data")
                }}
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
                                        onClick={() => handleUrlClick(currentResource.url, true)}
                                    >
                                        {t('download')}
                                    </Button>
                                ) : (
                                    <a 
                                        className="text-blue-500 hover:text-blue-700 mr-2"
                                        onClick={() => handleUrlClick(currentResource.url, false)}
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
                                onClick={handleResquestPdf}
                                loading={plainPdfLoading}
                                disabled={plainPdfLoading}
                            >
                                {plainPdfLoading ? `${Math.round(plainPdfProgress)}%` : t('downloadPdf')}
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
