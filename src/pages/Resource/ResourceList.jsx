import { useState, useEffect } from "react";
import { Table, Input, Button, message, Modal, Radio, Space, Select, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { getResourceList, createResource, updateResource, getProductDropdown } from "../../api/api";
import { SearchOutlined, PlusOutlined, CheckOutlined, CloseOutlined, LinkOutlined, EyeOutlined } from "@ant-design/icons";
import MdViewer from "../../components/MdViewer";
import MdEditor from '../../components/MdEditor';
import AddEdit from "./AddEdit";
import { useSearchParams } from "react-router-dom";

const { TextArea } = Input;

const ResourceList = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [nameFilter, setNameFilter] = useState("");
    const [productFilter, setProductFilter] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newResource, setNewResource] = useState({
        name: "",
        product: undefined,
        enabled: 1,
        url: "",
        markdown: "",
        type: 0,
        level: 0
    });
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [products, setProducts] = useState([]);
    const [viewMarkdown, setViewMarkdown] = useState(false);
    const [currentMarkdown, setCurrentMarkdown] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentProductName, setCurrentProductName] = useState("");
    const [pageSize, setPageSize] = useState(10);

    const typeOptions = [
        { value: 0, label: t('tool') },
        { value: 1, label: t('document') },
        { value: 2, label: t('manual') },
        { value: 3, label: t('article') }
    ];

    const fetchProducts = async () => {
        try {
            const response = await getProductDropdown();
            if (response.data.status === 0) {
                setProducts(response.data.data || []);
            } else {
                message.error(t('fetchProductsError'));
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            message.error(t('fetchProductsError'));
        }
    };

    const fetchData = async (page = 1, query = "", product = "") => {
        setLoading(true);
        try {
            const response = await getResourceList({
                page,
                rows: pageSize,
                query,
                product,
            });

            if (response.data.status === 0) {
                setData(response.data.data.rows);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    total: response.data.data.total,
                }));
            } else {
                message.error(t('fetchResourcesError'));
            }
        } catch (error) {
            console.error("Error fetching resources:", error);
            message.error(t('fetchResourcesError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const productFromUrl = searchParams.get('product');
        
        const fetchInitialData = async () => {
            try {
                const productsResponse = await getProductDropdown();
                if (productsResponse.data.status === 0) {
                    const productData = productsResponse.data.data || [];
                    setProducts(productData);
                    
                    if (productFromUrl) {
                        const matchingProduct = productData.find(p => p.id === productFromUrl);
                        if (matchingProduct) {
                            setCurrentProductName(matchingProduct.name);
                            setProductFilter(productFromUrl);
                            fetchData(1, "", productFromUrl);
                        }
                    } else {
                        fetchData(1, "", "");
                    }
                }
            } catch (error) {
                message.error(t('fetchProductsError'));
            }
        };

        fetchInitialData();
    }, [searchParams]);

    const handleAdd = () => {
        if (products.length === 0) {
            message.warning(t('addProductFirst'));
            return;
        }
        setIsModalVisible(true);
        setNewResource({
            name: "",
            product: undefined,
            enabled: 1,
            url: "",
            markdown: "",
            type: 0,
            level: 0
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setNewResource({
            name: "",
            product: undefined,
            enabled: 1,
            url: "",
            markdown: "",
            type: 0,
            level: 0
        });
    };

    const handleCreate = async () => {
        if (!newResource.name.trim()) {
            message.error(t('resourceNameRequired'));
            return;
        }
        if (!newResource.product) {
            message.error(t('productRequired'));
            return;
        }

        try {
            const response = await createResource({
                name: newResource.name.trim(),
                product: newResource.product,
                enabled: newResource.enabled,
                url: newResource.url.trim(),
                markdown: newResource.markdown.trim(),
                type: newResource.type,
                level: newResource.level
            });

            if (response.data.status === 0) {
                message.success(t('resourceCreateSuccess'));
                setIsModalVisible(false);
                fetchData(1, nameFilter, productFilter);
            } else {
                message.error(t('resourceCreateError'));
            }
        } catch (error) {
            console.error("Error creating resource:", error);
            message.error(t('resourceCreateError'));
        }
    };

    const handleEdit = (record) => {
        setEditingResource({
            id: record.id,
            name: record.name,
            product: record.product,
            enabled: record.enabled,
            url: record.url,
            markdown: record.markdown,
            type: record.type,
            level: record.level
        });
        setEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingResource(null);
        setTimeout(() => {
            if (editingResource) {
                setEditingResource({
                    ...editingResource,
                    markdown: ""
                });
            }
        }, 100);
    };

    const handleUpdate = async () => {
        if (!editingResource.name.trim()) {
            message.error(t('resourceNameRequired'));
            return;
        }
        if (!editingResource.product) {
            message.error(t('productRequired'));
            return;
        }

        try {
            const response = await updateResource({
                id: editingResource.id,
                name: editingResource.name.trim(),
                product: editingResource.product,
                enabled: editingResource.enabled,
                url: editingResource.url.trim(),
                markdown: editingResource.markdown.trim(),
                type: editingResource.type,
                level: editingResource.level
            });

            if (response.data.status === 0) {
                message.success(t('resourceUpdateSuccess'));
                setEditModalVisible(false);
                fetchData(pagination.current, nameFilter, productFilter);
            } else {
                message.error(t('resourceUpdateError'));
            }
        } catch (error) {
            console.error("Error updating resource:", error);
            message.error(t('resourceUpdateError'));
        }
    };

    const handleMarkdownModalClose = () => {
        setViewMarkdown(false);
        setCurrentMarkdown("");
    };

    const handleMarkdownPreview = (markdown) => {
        // Reset viewer and set new content in next tick
        setViewMarkdown(false);
        setTimeout(() => {
            setCurrentMarkdown(markdown);
            setViewMarkdown(true);
        }, 0);
    };

    const handleClearFilter = () => {
        setProductFilter("");
        setCurrentProductName("");
        setSearchParams({});
        fetchData(1, nameFilter, "");
    };

    const columns = [
        {
            title: t('resourceName'),
            dataIndex: "name",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                <Input
                    placeholder={t('searchResourcePlaceholder')}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => {
                        confirm();
                        setNameFilter(selectedKeys[0]);
                        fetchData(1, selectedKeys[0], productFilter);
                    }}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Button
                    type="primary"
                    onClick={() => {
                        confirm();
                        setNameFilter(selectedKeys[0]);
                        fetchData(1, selectedKeys[0], productFilter);
                    }}
                    size="small"
                    style={{ width: 90, marginRight: 8 }}
                >
                    {t('search')}
                </Button>
                <Button
                    onClick={() => {
                        clearFilters();
                        setNameFilter("");
                        fetchData(1, "", productFilter);
                    }}
                    size="small"
                    style={{ width: 90 }}
                >
                    {t('reset')}
                    </Button>
                </div>
            ),
            filterIcon: (filtered) => (
                <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
            width: "15%",
        },
        {
            title: t('productName'),
            dataIndex: "product_name",
            width: "12%",
        },
        {
            title: t('type'),
            dataIndex: "type",
            width: "8%",
            render: (type) => typeOptions[type]?.label,
        },
        {
            title: t('accessLevel'),
            dataIndex: "level",
            width: "8%",
            align: "center",
        },
        {
            title: t('url'),
            dataIndex: "url",
            width: "5%",
            align: "center",
            render: (url) => (
                <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {url ? (
                        <Tooltip title={url}>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                                <LinkOutlined />
                            </a>
                        </Tooltip>
                    ) : (
                        <span className="text-gray-400">{t('notAvailable')}</span>
                    )}
                </div>
            ),
        },
        {
            title: t('markdown'),
            dataIndex: "markdown",
            width: "5%",
            align: "center",
            render: (markdown) => (
                <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {markdown ? (
                        <Tooltip title={t('viewMarkdown')}>
                            <Button 
                                type="link" 
                                icon={<EyeOutlined />}
                                onClick={() => handleMarkdownPreview(markdown)}
                            />
                        </Tooltip>
                    ) : (
                        <span className="text-gray-400">{t('notAvailable')}</span>
                    )}
                </div>
            ),
        },
        {
            title: t('timeCreated'),
            dataIndex: "time_created",
            width: "12%",
        },
        {
            title: t('timeUpdated'),
            dataIndex: "time_updated",
            width: "12%",
        },
        {
            title: t('status'),
            dataIndex: "enabled",
            width: "5%",
            align: "center",
            render: (enabled) => (
                <span style={{ 
                    color: enabled ? '#52c41a' : '#ff4d4f',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {enabled ? <CheckOutlined /> : <CloseOutlined />}
                </span>
            ),
        },
        {
            title: t('action'),
            key: 'action',
            width: "8%",
            align: "center",
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
            <h1 className="text-2xl font-bold">{t('resourceManagement')}</h1>
            
            <div className="flex justify-between items-center mb-4 mt-4">
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    {t('addResource')}
                </Button>
                {currentProductName && (
                <div className="flex items-center">
                    <span className="text-gray-600">
                        {t('showingResourcesForProduct')}: <span className="font-medium">{currentProductName}</span>
                    </span>
                    <Button 
                        type="link" 
                        onClick={handleClearFilter}
                        className="ml-2"
                    >
                        {t('showAll')}
                    </Button>
                </div>
            )}
                <Select
                    placeholder={t("selectProduct")}
                    value={productFilter || undefined}
                    onChange={(value) => {
                        setProductFilter(value);
                        setSearchParams(value ? { product: value } : {});
                        fetchData(1, nameFilter, value);
                    }}
                    allowClear
                    style={{ width: 200 }}
                    options={products.map((product) => ({
                        value: product.id,
                        label: product.name,
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
                        fetchData(page, nameFilter, productFilter);
                    },
                }}
                loading={loading}
                rowKey="id"
            />
            <Modal
                title={t('addResource')}
                open={isModalVisible}
                onOk={handleCreate}
                onCancel={handleCancel}
                okText={t('confirm')}
                cancelText={t('cancel')}
                width={1200}
            >
                <AddEdit
                    resource={newResource}
                    onChange={setNewResource}
                    products={products}
                    typeOptions={typeOptions}
                    t={t}
                />
            </Modal>

            <Modal
                title={t('editResource')}
                open={editModalVisible}
                onOk={handleUpdate}
                onCancel={handleEditCancel}
                okText={t('confirm')}
                cancelText={t('cancel')}
                width={1200}
                destroyOnClose={true}
                afterClose={() => {
                    setEditingResource(null);
                }}
            >
                <AddEdit
                    key={editingResource?.id}
                    resource={editingResource}
                    onChange={setEditingResource}
                    products={products}
                    typeOptions={typeOptions}
                    t={t}
                />
            </Modal>
            <Modal
                title={t('markdownPreview')}
                open={viewMarkdown}
                onCancel={handleMarkdownModalClose}
                afterClose={() => setCurrentMarkdown("")}
                destroyOnClose={true}
                footer={null}
                width={800}
            >
                <MdViewer key={currentMarkdown} content={currentMarkdown} />
            </Modal>
        </div>
    );
};

export default ResourceList;
