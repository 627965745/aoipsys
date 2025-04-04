import { useState, useEffect } from "react";
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
    const [pageSize, setPageSize] = useState(10);
    const [languages, setLanguages] = useState([]);

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
        setLoading(true);
        try {
            const response = await getLanguageCombo();
            if (response.data.status === 0) {
                setLanguages(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching languages:", error);
        } finally {
            setLoading(false);
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
        const productFromUrl = searchParams.get('product');
        
        const fetchInitialData = async () => {
            try {
                await fetchLanguages();
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
                message.error(error.response?.data?.message || t('fetchProductsError'));
            }
        };

        fetchInitialData();
    }, [searchParams]);

    const handleAdd = () => {
        if (products.length === 0) {
            message.warning(t('addProductFirst'));
            return;
        }
        
        // Initialize empty markdowns for all available languages
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
            markdowns: initialMarkdowns, // Pre-populate with empty values for all languages
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
                names: newResource.names || {}, // Direct object with language keys and string values
                markdowns: newResource.markdowns || {}, // Direct object with language keys and string values
                type: newResource.type,
                level: newResource.level
            });

            if (response.data.status === 0) {
                message.success(response.data.message || t('resourceCreateSuccess'));
                setIsModalVisible(false);
                fetchData(1, nameFilter, productFilter);
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
        
        // Initialize empty markdowns for all available languages
        languages.forEach(lang => {
            markdownsObj[lang.id] = '';
        });
        
        // Handle the case where names is an object with language keys
        if (record.names && typeof record.names === 'object' && !Array.isArray(record.names)) {
            // Names is already in the correct format with language keys and string values
            Object.entries(record.names).forEach(([language, value]) => {
                // If value is a string, use it directly
                if (typeof value === 'string') {
                    namesObj[language] = value;
                } 
                // If value is an object with resource_name, extract it
                else if (value && value.resource_name) {
                    namesObj[language] = value.resource_name;
                }
            });
        } 
        // Handle the case where names is an array of {language, value} objects
        else if (record.names && Array.isArray(record.names)) {
            record.names.forEach(item => {
                namesObj[item.language] = item.value;
            });
        }
        
        // Handle markdowns field if it exists as an object
        if (record.markdowns && typeof record.markdowns === 'object' && !Array.isArray(record.markdowns)) {
            Object.entries(record.markdowns).forEach(([language, value]) => {
                markdownsObj[language] = value;
            });
        }
        // Handle markdowns field if it exists as an array
        else if (record.markdowns && Array.isArray(record.markdowns)) {
            record.markdowns.forEach(item => {
                markdownsObj[item.language] = item.value;
            });
        }
        // Extract markdowns from names object if they exist there (for backward compatibility)
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
            markdowns: markdownsObj, // Now contains empty strings for all languages
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
                names: editingResource.names || {}, // Direct object with language keys and string values
                markdowns: editingResource.markdowns || {}, // Direct object with language keys and string values
                type: editingResource.type,
                level: editingResource.level
            });

            if (response.data.status === 0) {
                message.success(response.data.message || t('resourceUpdateSuccess'));
                setEditModalVisible(false);
                fetchData(pagination.current, nameFilter, productFilter);
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
        // First check if record has markdowns field
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
        
        // Fallback to check if record has names with markdown content (for backward compatibility)
        if (record.names && typeof record.names === 'object') {
            // Set the first non-empty markdown as default
            const markdownsByLanguage = {};
            let hasContent = false;
            
            // Extract all markdowns by language
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
        
        // Fallback for empty markdown
        setCurrentMarkdown({});
        setViewMarkdown(true);
    };

    const handleClearFilter = () => {
        setProductFilter("");
        setCurrentProductName("");
        setSearchParams({});
        fetchData(1, nameFilter, "");
    };

    // Create a separate component for the resource name cell
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
                            // Handle both string values and object values with resource_name
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
                // First check if record has markdowns field with content
                const hasMarkdownsField = markdowns && 
                    Object.values(markdowns).some(content => 
                        content && content.trim() !== ''
                    );
                
                // Fallback to check names field for markdowns (backward compatibility)
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
