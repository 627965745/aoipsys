import { useState, useEffect, useRef } from "react";
import { Table, Input, Button, message, Modal, Radio, Space, Select, Tooltip, Tabs } from "antd";
import { useTranslation } from "react-i18next";
import { getResourceList, createResource, updateResource, getProductDropdown, getLanguageCombo } from "../../api/api";
import { SearchOutlined, PlusOutlined, CheckOutlined, CloseOutlined, LinkOutlined, EyeOutlined, TranslationOutlined } from "@ant-design/icons";
import MdViewer from "../../components/MdViewer";
import MdEditor from '../../components/MdEditor';
import AddEdit from "./AddEdit";
import { useSearchParams } from "react-router-dom";

const { TextArea } = Input;

const ResourceList = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
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
        markdowns: {},
        names: {},
        type: 0,
        level: 0
    });
    const [editModalVisible, setEditModalVisible] = useState(false);    
    const [editingResource, setEditingResource] = useState(null);
    const [products, setProducts] = useState([]);
    const [viewMarkdown, setViewMarkdown] = useState(false);
    const [currentMarkdown, setCurrentMarkdown] = useState({});
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentProductName, setCurrentProductName] = useState("");
    const [languages, setLanguages] = useState([]);
    const initialDataFetched = useRef(false);
    const combosFetched = useRef(false);

    const typeOptions = [
        { value: 0, label: t('document') },
        { value: 1, label: t('software') },
        { value: 2, label: t('firmware') },
        { value: 3, label: t('other') }
    ];

    const fetchProducts = async () => {
        try {
            const response = await getProductDropdown();
            if (response.data.status === 0) {
                setProducts(response.data.data || []);
            } else {
                message.error(error.response?.data?.message || t('fetchProductsError'));
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            message.error(error.response?.data?.message || t('fetchProductsError'));
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

    const fetchData = async (page, rows, query, product) => {
        setLoading(true);
        try {
            const response = await getResourceList({
                page,
                rows,
                query,
                product,
            });

            if (response.data.status === 0) {
                setData(response.data.data.rows);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total,
                }));
            } else {
                message.error(error.response?.data?.message || t('fetchResourcesError'));
            }
        } catch (error) {
            console.error("Error fetching resources:", error);
            message.error(error.response?.data?.message || t('fetchResourcesError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!combosFetched.current) {
            combosFetched.current = true;
            
            const fetchInitialData = async () => {
                try {
                    await fetchLanguages();
                    const productsResponse = await getProductDropdown();
                    if (productsResponse.data.status === 0) {
                        const productData = productsResponse.data.data || [];
                        setProducts(productData);
                    }
                } catch (error) {
                    message.error(error.response?.data?.message || t('fetchProductsError'));
                }
            };

            fetchInitialData();
        }
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            const productFromUrl = searchParams.get('product');
            
            if (!initialDataFetched.current) {
                initialDataFetched.current = true;
                if (productFromUrl) {
                    const matchingProduct = products.find(p => p.id === productFromUrl);
                    if (matchingProduct) {
                        setCurrentProductName(matchingProduct.name);
                        setProductFilter(productFromUrl);
                        fetchData(pagination.current, pagination.pageSize, "", productFromUrl);
                    }
                } else {
                    setCurrentProductName("");
                    setProductFilter("");
                    fetchData(pagination.current, pagination.pageSize, "", "");
                }
            }
            else {
                if (productFromUrl) {
                    const matchingProduct = products.find(p => p.id === productFromUrl);
                    if (matchingProduct) {
                        setCurrentProductName(matchingProduct.name);
                        setProductFilter(productFromUrl);
                        fetchData(pagination.current, pagination.pageSize, "", productFromUrl);
                    }
                } else {
                    setCurrentProductName("");
                    setProductFilter("");
                    fetchData(pagination.current, pagination.pageSize, "", "");
                }
            }
        }
    }, [searchParams, products]);

    const handleAdd = () => {
        if (products.length === 0) {
            message.warning(t('addProductFirst'));
            return;
        }
        
        const initialMarkdowns = {};
        languages.forEach(lang => {
            initialMarkdowns[lang.id] = '';
        });
        
        setIsModalVisible(true);
        setNewResource({
            name: "",
            product: undefined,
            enabled: 1,
            url: "",
            markdowns: initialMarkdowns,
            names: {},
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
            markdowns: {},
            names: {},
            type: 0,
            level: 0
        });
    };

    const handleCreate = async () => {
        if (setNewResource.validate && !setNewResource.validate()) {
            return;
        }

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
                names: newResource.names || {}, 
                markdowns: newResource.markdowns || {}, 
                type: newResource.type,
                level: newResource.level
            });

            if (response.data.status === 0) {
                message.success(response.data.message || t('resourceCreateSuccess'));
                setIsModalVisible(false);
                fetchData(1, pagination.pageSize, nameFilter, productFilter);
            } else {
                message.error(error.response?.data?.message || t('resourceCreateError'));
            }
        } catch (error) {
            console.error("Error creating resource:", error);
            message.error(error.response?.data?.message || t('resourceCreateError'));
        }
    };

    const handleEdit = (record) => {
        const namesObj = {};
        const markdownsObj = {};
        
        languages.forEach(lang => {
            markdownsObj[lang.id] = '';
        });
        
        if (record.names && typeof record.names === 'object' && !Array.isArray(record.names)) {
            Object.entries(record.names).forEach(([language, value]) => {
                if (typeof value === 'string') {
                    namesObj[language] = value;
                } 
                else if (value && value.resource_name) {
                    namesObj[language] = value.resource_name;
                }
            });
        } 
        else if (record.names && Array.isArray(record.names)) {
            record.names.forEach(item => {
                namesObj[item.language] = item.value;
            });
        }
        
        if (record.markdowns && typeof record.markdowns === 'object' && !Array.isArray(record.markdowns)) {
            Object.entries(record.markdowns).forEach(([language, value]) => {
                markdownsObj[language] = value;
            });
        }
        else if (record.markdowns && Array.isArray(record.markdowns)) {
            record.markdowns.forEach(item => {
                markdownsObj[item.language] = item.value;
            });
        }
        else if (record.names && typeof record.names === 'object' && !Array.isArray(record.names)) {
            Object.entries(record.names).forEach(([language, data]) => {
                if (data && data.resource_markdown) {
                    markdownsObj[language] = data.resource_markdown;
                }
            });
        }
        
        setEditingResource({
            id: record.id,
            name: record.name,
            product: record.product,
            enabled: record.enabled,
            url: record.url,
            names: namesObj,
            markdowns: markdownsObj,
            type: record.type,
            level: record.level
        });
        
        setEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingResource(null);
    };

    const handleUpdate = async () => {
        if (setEditingResource.validate && !setEditingResource.validate()) {
            return;
        }

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
                names: editingResource.names || {},
                markdowns: editingResource.markdowns || {},
                type: editingResource.type,
                level: editingResource.level
            });

            if (response.data.status === 0) {
                message.success(response.data.message || t('resourceUpdateSuccess'));
                setEditModalVisible(false);
                fetchData(pagination.current, pagination.pageSize, nameFilter, productFilter);
            } else {
                message.error(error.response?.data?.message || t('resourceUpdateError'));
            }
        } catch (error) {
            console.error("Error updating resource:", error);
            message.error(error.response?.data?.message || t('resourceUpdateError'));
        }
    };

    const handleMarkdownModalClose = () => {
        setViewMarkdown(false);
        setCurrentMarkdown({});
    };

    const handleMarkdownPreview = (record) => {
        if (record.markdowns && typeof record.markdowns === 'object') {
            const hasContent = Object.values(record.markdowns).some(content => 
                content && content.trim() !== ''
            );
            
            if (hasContent) {
                setCurrentMarkdown(record.markdowns);
                setViewMarkdown(true);
                return;
            }
        }
        
        if (record.names && typeof record.names === 'object') {
            const markdownsByLanguage = {};
            let hasContent = false;
            
            Object.entries(record.names).forEach(([langId, data]) => {
                if (data && data.resource_markdown) {
                    markdownsByLanguage[langId] = data.resource_markdown;
                    hasContent = true;
                }
            });
            
            if (hasContent) {
                setCurrentMarkdown(markdownsByLanguage);
                setViewMarkdown(true);
                return;
            }
        }
        
        setCurrentMarkdown({});
        setViewMarkdown(true);
    };

    const handleTableChange = (page, newPageSize) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: newPageSize,
        }));
        fetchData(page, newPageSize, nameFilter, productFilter);
    }

    const handleClearFilter = () => {
        setSearchParams({});
    };

    const ResourceNameCell = ({ record, languages }) => {
        const [showTranslations, setShowTranslations] = useState(false);
        
        return (
            <div>
                <div className="flex items-center">
                    <span className="mr-2">{record.name}</span>
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
                        {Object.entries(record.names).map(([langId, value]) => {
                            const langName = languages?.find(l => l.id === langId)?.name || langId;
                            const displayValue = typeof value === 'string' ? value : 
                                               (value && value ? value : '');
                            return (
                                <div key={langId} className="text-xs text-gray-400">
                                    {langName}: {displayValue}
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
            title: t('resourceName'),
            dataIndex: "name",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                <Input
                    ref={(input) => input && setTimeout(() => input.focus(), 100)}
                    placeholder={t('searchResourcePlaceholder')}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => {
                        setNameFilter(selectedKeys[0]);
                        fetchData(pagination.current, pagination.pageSize, selectedKeys[0], productFilter);
                        confirm();
                    }}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Button
                    type="primary"
                    onClick={() => {
                        setNameFilter(selectedKeys[0]);
                        fetchData(pagination.current, pagination.pageSize, selectedKeys[0], productFilter);
                        confirm();
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
                        fetchData(pagination.current, pagination.pageSize, "", productFilter);
                        confirm();
                    }}
                    size="small"
                    style={{ width: 90 }}
                >
                    {t('reset')}
                    </Button>
                </div>
            ),
            filterIcon: (filtered) => (
                <Button 
                    size="small" 
                    type={filtered ? 'primary' : 'default'}
                    icon={<SearchOutlined />}
                >
                    {t('search')}
                </Button>
            ),
            width: "15%",
            render: (text, record) => <ResourceNameCell record={record} languages={languages} />,
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
            dataIndex: "markdowns",
            width: "5%",
            align: "center",
            render: (markdowns, record) => {
                const hasMarkdownsField = markdowns && 
                    Object.values(markdowns).some(content => 
                        content && content.trim() !== ''
                    );
                
                const hasMarkdownsInNames = !hasMarkdownsField && 
                    record.names && 
                    Object.values(record.names).some(data => 
                        data && data.resource_markdown && data.resource_markdown.trim() !== ''
                    );
                
                const hasMarkdown = hasMarkdownsField || hasMarkdownsInNames;
                
                return (
                    <div style={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        {hasMarkdown ? (
                            <Tooltip title={t('viewMarkdown')}>
                                <Button 
                                    type="link" 
                                    icon={<EyeOutlined />}
                                    onClick={() => handleMarkdownPreview(record)}
                                />
                            </Tooltip>
                        ) : (
                            <span className="text-gray-400">{t('notAvailable')}</span>
                        )}
                    </div>
                );
            },
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
                        setSearchParams(value ? { product: value } : {});
                    }}
                    allowClear
                    style={{ width: 200 }}
                    showSearch
                    filterOption={(input, option) =>
                        option?.label?.toLowerCase().includes(input.toLowerCase())
                    }
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
                    languages={languages}
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
                    languages={languages}
                    t={t}
                />
            </Modal>
            <Modal
                title={t('markdownPreview')}
                open={viewMarkdown}
                onCancel={handleMarkdownModalClose}
                afterClose={() => setCurrentMarkdown({})}
                destroyOnClose={true}
                footer={null}
                width={1200}
            >
                {Object.keys(currentMarkdown).length > 0 ? (
                    <Tabs
                        defaultActiveKey={Object.keys(currentMarkdown).find(key => 
                            currentMarkdown[key] && currentMarkdown[key].trim() !== ''
                        ) || Object.keys(currentMarkdown)[0]}
                        items={languages
                            .map(language => {
                                const content = currentMarkdown[language.id] || '';
                                return {
                                    key: language.id,
                                    label: language.name,
                                    children: <MdViewer key={`${language.id}-${content}`} content={content} />
                                };
                            })}
                    />
                ) : (
                    <div className="text-center py-4 text-gray-500">{t('noMarkdownContent')}</div>
                )}
            </Modal>
        </div>
    );
};

export default ResourceList;
