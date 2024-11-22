import React, { useState, useEffect } from 'react';
import { Table, Input, Space, Tag, message, Breadcrumb, Tooltip, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { getResourceCondition, getResource } from '../../api/api';
import { Link } from 'react-router-dom';
import { SearchOutlined, ToolOutlined, FileTextOutlined, BookOutlined, ReadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import MdViewer from '../../components/MdViewer';

const { Search } = Input;

const Home = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [resources, setResources] = useState([]);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentResource, setCurrentResource] = useState(null);
    const [originalData, setOriginalData] = useState([]);
    const [pageSize, setPageSize] = useState(10);

    // Fetch initial conditions
    useEffect(() => {
        const fetchConditions = async () => {
            try {
                const response = await getResourceCondition();
                if (response.data.status === 0) {
                    const nestedData = response.data.data || [];
                    setOriginalData(nestedData);
                    
                    // Extract categories (parent items)
                    const categoryData = nestedData.map(item => ({
                        id: item.id,
                        name: item.name
                    }));
                    
                    // Extract all products (children items)
                    const productData = nestedData.reduce((acc, category) => {
                        return acc.concat(category.children || []);
                    }, []);
                    
                    setCategories(categoryData);
                    setProducts(productData);
                }
            } catch (error) {
                message.error(t('fetchResourcesError'));
            }
        };
        fetchConditions();
    }, []);

    // Fetch resources with complete object info
    const fetchResources = async (page = 1, query = searchQuery) => {
        setLoading(true);
        try {
            const params = {
                query,
                page,
                rows: pageSize,
                product: selectedProduct?.id || '',
                category: selectedCategory?.id || '',
            };

            const response = await getResource(params);
            if (response.data.status === 0) {
                setResources(response.data.data.rows || []);
                setTotal(response.data.data.total || 0);
            }
        } catch (error) {
            message.error(t('fetchResourcesError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources(1);
    }, [selectedProduct, selectedCategory]);

    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
        fetchResources(1, value);
    };

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        fetchResources(pagination.current);
    };

    const typeConfig = {
        0: {
            key: 'tool',
            icon: <ToolOutlined className="ml-2 text-gray-500" />
        },
        1: {
            key: 'document',
            icon: <FileTextOutlined className="ml-2 text-gray-500" />
        },
        2: {
            key: 'manual',
            icon: <BookOutlined className="ml-2 text-gray-500" />
        },
        3: {
            key: 'article',
            icon: <ReadOutlined className="ml-2 text-gray-500" />
        }
    };

    const handleResourceClick = (record) => {
        const hasUrl = record.url && record.url.trim() !== '';
        const hasMarkdown = record.markdown && record.markdown.trim() !== '';

        if (hasUrl && !hasMarkdown) {
            Modal.confirm({
                title: t('confirmJump'),
                icon: <ExclamationCircleOutlined />,
                content: t('jumpToExternalLink'),
                okText: t('confirm'),
                cancelText: t('cancel'),
                onOk() {
                    window.open(record.url, '_blank');
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
            title: t('confirmJump'),
            icon: <ExclamationCircleOutlined />,
            content: t('jumpToExternalLink'),
            okText: t('confirm'),
            cancelText: t('cancel'),
            onOk() {
                window.open(url, '_blank');
            },
        });
    };

    const columns = [
        {
            title: t('type'),
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (type) => (
                <Space>
                    <span>{t(typeConfig[type]?.key || 'notAvailable')}</span>
                    <Tooltip title={t(typeConfig[type]?.key || 'notAvailable')}>
                        {typeConfig[type]?.icon}
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: t('productName'),
            dataIndex: 'product_name',
            key: 'product_name',
            width: 120,
        },
        {
            title: t('resourceName'),
            dataIndex: 'name',
            key: 'name',
            width: 120,
            
        },
        {
            title: t('timeUpdated'),
            dataIndex: 'time_updated',
            key: 'time_updated',
            width: 180,
            // render: (time) => new Date(time).toLocaleString(),
        },
        {
            title: t('action'),
            key: 'action',
            width: 100,
            render: (_, record) => (
                <a onClick={() => handleResourceClick(record)}>
                    {t('view')}
                </a>
            ),
        },
    ];

    const handleCategoryClick = (category) => {
        setSelectedCategory(selectedCategory?.id === category.id ? null : category);
        setSelectedProduct(null);
    };

    const handleProductClick = (product) => {
        setSelectedProduct(selectedProduct?.id === product.id ? null : product);
    };

    const breadcrumbItems = [
        {
            title: <Link to="/" onClick={() => {
                setSelectedProduct(null);
                setSelectedCategory(null);
            }}>{t('resource')}</Link>
        },
        ...(selectedCategory ? [{
            title: selectedCategory.name
        }] : []),
        ...(selectedProduct ? [{
            title: selectedProduct.name
        }] : [])
    ];

    const getFilteredProducts = () => {
        if (!selectedCategory) return products;
        
        const categoryData = originalData.find(c => c.id === selectedCategory.id);
        return categoryData ? (categoryData.children || []) : [];
    };

    return (
        <div className="p-6">
            <Breadcrumb className="mb-4" items={breadcrumbItems} />

            {/* Product and Category Links */}
            <div className="mb-4">
                <div className="mb-2">
                    <h3 className="text-lg font-medium">{t('category')}:</h3>
                    <Space wrap className="mt-2">
                        {categories.map(category => (
                            <Tag
                                key={category.id}
                                className="cursor-pointer px-4 py-2 text-sm"
                                color={selectedCategory?.id === category.id ? 'blue' : 'default'}
                                onClick={() => handleCategoryClick(category)}
                            >
                                {category.name}
                            </Tag>
                        ))}
                    </Space>
                </div>
                <div className="mb-2 mt-6">
                    <h3 className="text-lg font-medium">{t('product')}:</h3>
                    <Space wrap className="mt-2">
                        {getFilteredProducts().map(product => (
                            <Tag
                                key={product.id}
                                className="cursor-pointer px-4 py-2 text-sm"
                                color={selectedProduct?.id === product.id ? 'blue' : 'default'}
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
                    placeholder={t('search')}
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
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => t('showingEntries', { start: range[0], end: range[1], total }),
                    onChange: (page, newPageSize) => {
                        setCurrentPage(page);
                        if (newPageSize !== pageSize) {
                            setPageSize(newPageSize);
                        }
                        fetchResources(page);
                    },
                }}
                onChange={handleTableChange}
            />

            <Modal
                title={`${t('resourceName')}: ${currentResource?.name}`}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800}
                
            >
                {currentResource?.url && (
                    <div className="mb-4">
                        <a 
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => handleUrlClick(currentResource.url)}
                        >
                            {t('visitExternalLink')}
                        </a>
                    </div>
                )}
                {currentResource?.markdown && (
                    <MdViewer content={currentResource.markdown} />
                )}
            </Modal>
        </div>
    );
};

export default Home;
