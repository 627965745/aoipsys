import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
    getProductDropdown, 
    getUserDropdown,
    createCDKey, 
    readCDKey, 
    updateCDKey 
} from "../../api/api";
import { 
    Modal, 
    Select, 
    Input, 
    Button, 
    Switch, 
    Popover, 
    message, 
    Pagination, 
    Tooltip, 
    Empty, 
    Spin, 
    Form,
    Badge
} from "antd";
import { 
    Key, 
    User, 
    Copy, 
    Check, 
    Plus, 
    Power, 
    Filter,
    X
} from "lucide-react";

const CDKeyPage = () => {
    const { t } = useTranslation();

    // Combo Options states
    const [productOptions, setProductOptions] = useState([]);
    const [operatorOptions, setOperatorOptions] = useState([]);

    // Data lists
    const [cdkeys, setCdkeys] = useState([]);
    
    // Loading states
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingKeys, setLoadingKeys] = useState(false);
    const [submittingCreate, setSubmittingCreate] = useState(false);
    const [submittingUpdate, setSubmittingUpdate] = useState(null); // stores cdkey ID being updated

    // Filtering states
    const [productFilter, setProductFilter] = useState("01hdbc9fzgq7sn1");
    const [operatorFilter, setOperatorFilter] = useState("");

    // Pagination states
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 200,
        total: 0,
    });

    // Create Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [cdkeyCount, setCdkeyCount] = useState(0);
    const [createForm] = Form.useForm();

    // Popover Edit states
    const [editingKeyId, setEditingKeyId] = useState(null);
    const [editForm] = Form.useForm();

    // Clipboard copy tracker
    const [copiedKey, setCopiedKey] = useState(null);

    // Dynamic autocomplete fetch helper for products
    const handleProductSearch = async (value = "") => {
        try {
            const response = await getProductDropdown({ query: value });
            if (response.data.status === 0) {
                setProductOptions(response.data.data || []);
            }
        } catch (error) {
            console.error("Error searching products:", error);
        }
    };

    const handleTextareaChange = (e) => {
        const text = e.target.value || "";
        const count = text.split(/\s+/).map(id => id.trim()).filter(id => id.length > 0).length;
        setCdkeyCount(count);
    };

    // Dynamic autocomplete fetch helper for operators
    const handleOperatorSearch = async (value = "") => {
        if (!value.trim()) {
            setOperatorOptions([]);
            return;
        }
        try {
            const response = await getUserDropdown({ query: value });
            if (response.data.status === 0) {
                const data = response.data.data || [];
                const options = data.map(item => {
                    const val = item.email || item.id || item.name || "";
                    const lbl = item.name && item.email ? `${item.name} (${item.email})` : (item.name || item.id || item.email || "");
                    return { value: val, label: lbl };
                });
                setOperatorOptions(options);
            }
        } catch (error) {
            console.error("Error searching operators:", error);
        }
    };

    // Initial load: Fetch initial product and operator dropdown listings
    useEffect(() => {
        const fetchInitialOptions = async () => {
            setLoadingProducts(true);
            try {
                // Initial products list
                const prodResponse = await getProductDropdown({ query: "" });
                if (prodResponse.data.status === 0) {
                    const data = prodResponse.data.data || [];
                    setProductOptions(data);
                    
                    // Check if default VSC product is in the list, otherwise fallback to the first one
                    const hasVsc = data.some(p => p.id === "01hdbc9fzgq7sn1");
                    if (hasVsc) {
                        setProductFilter("01hdbc9fzgq7sn1");
                    } else if (data.length > 0) {
                        setProductFilter(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Error loading initial options:", error);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchInitialOptions();
    }, [t]);

    // Fetch CDKeys handler
    const fetchCDKeys = async (page = pagination.current, pageSize = pagination.pageSize, prod = productFilter, op = operatorFilter) => {
        if (!prod) return;

        setLoadingKeys(true);
        try {
            const response = await readCDKey({
                product: prod,
                operator: op ? op.trim() : "",
                query: "",
                page: page,
                rows: pageSize
            });

            if (response.data.status === 0) {
                const result = response.data.data || {};
                setCdkeys(result.rows || []);
                setPagination({
                    current: page,
                    pageSize: pageSize,
                    total: result.total || 0
                });
            } else {
                message.error(response.data.message || t("unknownError"));
            }
        } catch (error) {
            console.error("Error reading CDKeys:", error);
            message.error(error.response?.data?.message || t("unknownError"));
        } finally {
            setLoadingKeys(false);
        }
    };

    // Auto-fetch whenever selected filters change (satisfies: "搜出来点结果以后直接read")
    useEffect(() => {
        if (productFilter) {
            fetchCDKeys(1, pagination.pageSize, productFilter, operatorFilter);
        } else {
            setCdkeys([]);
            setPagination(prev => ({ ...prev, total: 0, current: 1 }));
        }
    }, [productFilter, operatorFilter]);

    // Pagination change handler
    const handlePageChange = (page, pageSize) => {
        fetchCDKeys(page, pageSize, productFilter, operatorFilter);
    };

    // Bulk CDKeys creation handler
    const handleCreateSubmit = async (values) => {
        setSubmittingCreate(true);
        try {
            const ids = (values.cdkeysText || "")
                .split(/\s+/)
                .map(id => id.trim())
                .filter(id => id.length > 0);

            if (ids.length === 0) {
                message.warning(t("addCDKeyPlaceholder"));
                setSubmittingCreate(false);
                return;
            }

            const response = await createCDKey({
                ids: ids,
                product: values.product,
                enabled: values.enabled ? 1 : 0
            });

            if (response.data.status === 0) {
                message.success(t("createCDKeySuccess"));
                setIsCreateModalOpen(false);
                createForm.resetFields();
                setCdkeyCount(0);
                
                // Switch focus to the targeted product to show new keys
                setProductFilter(values.product);
                // Also trigger refresh directly just in case it was already selected
                fetchCDKeys(1, pagination.pageSize, values.product, operatorFilter);
            } else {
                message.error(response.data.message || t("unknownError"));
            }
        } catch (error) {
            console.error("Error creating CDKeys:", error);
            message.error(error.response?.data?.message || t("unknownError"));
        } finally {
            setSubmittingCreate(false);
        }
    };

    // Single CDKey update handler
    const handleUpdateSubmit = async (cdkeyId, values) => {
        setSubmittingUpdate(cdkeyId);
        try {
            const response = await updateCDKey({
                id: cdkeyId,
                product: values.product,
                operator: values.operator || "",
                enabled: values.enabled ? 1 : 0
            });

            if (response.data.status === 0) {
                message.success(t("updateCDKeySuccess"));
                setEditingKeyId(null);
                
                // Refresh currently viewed list
                fetchCDKeys(pagination.current, pagination.pageSize, productFilter, operatorFilter);
            } else {
                message.error(response.data.message || t("unknownError"));
            }
        } catch (error) {
            console.error("Error updating CDKey:", error);
            message.error(error.response?.data?.message || t("unknownError"));
        } finally {
            setSubmittingUpdate(null);
        }
    };

    // Popover click trigger
    const handleCardClick = (cdkey) => {
        setEditingKeyId(cdkey.id);
        editForm.setFieldsValue({
            product: productFilter,
            operator: cdkey.operator || undefined,
            enabled: !!cdkey.enabled
        });
        // Make sure options lists are populated for editing dropdowns
        handleProductSearch("");
        
        // Seed the operator options with the current operator itself so it displays correctly
        if (cdkey.operator) {
            const label = cdkey.operator_name ? `${cdkey.operator_name} (${cdkey.operator})` : cdkey.operator;
            setOperatorOptions([{ value: cdkey.operator, label: label }]);
        } else {
            setOperatorOptions([]);
        }
    };

    // Copy to clipboard helper
    const handleCopyToClipboard = async (e, text) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(text);
            message.success(t("copySuccess") || "Copied!");
            setTimeout(() => setCopiedKey(null), 2000);
        } catch (err) {
            message.error(t("copyFailed") || "Copy failed");
        }
    };

    // Styling configuration based on CDKey state
    const getCardConfig = (cdkey) => {
        const isAssigned = !!cdkey.operator;
        const isEnabled = !!cdkey.enabled;

        if (isAssigned && isEnabled) {
            return {
                bg: "bg-green-50 border-green-200 hover:border-green-400 hover:shadow-green-100",
                text: "text-green-800",
                badge: "success",
                label: t("statusAssignedActive") || "已发放（启用）",
                iconColor: "text-green-500",
                darkText: "text-green-900"
            };
        } else if (isAssigned && !isEnabled) {
            return {
                bg: "bg-red-50 border-red-200 hover:border-red-400 hover:shadow-red-100",
                text: "text-red-800",
                badge: "error",
                label: t("statusAssignedDisabled") || "已发放（禁用）",
                iconColor: "text-red-500",
                darkText: "text-red-900"
            };
        } else if (!isAssigned && isEnabled) {
            return {
                bg: "bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-blue-100",
                text: "text-blue-800",
                badge: "processing",
                label: t("statusUnassignedActive") || "未发放（启用）",
                iconColor: "text-blue-500",
                darkText: "text-blue-900"
            };
        } else {
            return {
                bg: "bg-gray-100 border-gray-300 hover:border-gray-400 hover:shadow-gray-200",
                text: "text-gray-600",
                badge: "warning",
                label: t("statusUnassignedDisabled") || "未发放（禁用）",
                iconColor: "text-gray-400",
                darkText: "text-gray-800"
            };
        }
    };

    // Popover Edit form
    const renderEditForm = (cdkey) => {
        const config = getCardConfig(cdkey);
        return (
            <Form
                form={editForm}
                layout="vertical"
                onFinish={(values) => handleUpdateSubmit(cdkey.id, values)}
                className="w-80 p-2"
                requiredMark={false}
            >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <span className="text-xs font-mono font-bold text-gray-800 break-all select-all flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-500" />
                        {cdkey.id}
                    </span>
                </div>

                {/* Display status and current operator details in the popover */}
                <div className="mb-4 bg-gray-50/80 p-3 rounded-lg border border-gray-200 text-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">{t("status")}:</span>
                        <Badge status={config.badge} text={
                            <span className={`text-xs font-semibold ${config.darkText}`}>
                                {config.label}
                            </span>
                        } />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-500 font-medium">{t("operator")}:</span>
                        <span className="font-semibold text-gray-700">
                            {cdkey.operator_name ? cdkey.operator_name : t("unassigned")}
                        </span>
                    </div>
                </div>
                
                <Form.Item
                    name="product"
                    label={<span className="text-xs font-medium text-gray-600">{t("product")}</span>}
                    rules={[{ required: true, message: t("productRequired") }]}
                    className="mb-3"
                >
                    <Select
                        placeholder={t("selectProduct")}
                        showSearch
                        filterOption={false}
                        onSearch={handleProductSearch}
                        options={productOptions.map((p) => ({
                            value: p.id,
                            label: p.name,
                        }))}
                        className="w-full"
                    />
                </Form.Item>

                <Form.Item
                    name="operator"
                    label={<span className="text-xs font-medium text-gray-600">{t("operator")}</span>}
                    className="mb-3"
                >
                    <Select
                        placeholder={t("search") || "搜索..."}
                        showSearch
                        filterOption={false}
                        onSearch={handleOperatorSearch}
                        options={operatorOptions}
                        allowClear
                        className="w-full"
                    />
                </Form.Item>

                <Form.Item
                    name="enabled"
                    label={<span className="text-xs font-medium text-gray-600">{t("status")}</span>}
                    valuePropName="checked"
                    className="mb-4"
                >
                    <Switch 
                        checkedChildren={t("enabled")} 
                        unCheckedChildren={t("disabled")} 
                    />
                </Form.Item>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <Button 
                        onClick={() => setEditingKeyId(null)}
                    >
                        {t("cancel")}
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={submittingUpdate === cdkey.id}
                    >
                        {t("confirm")}
                    </Button>
                </div>
            </Form>
        );
    };

    return (
        <div className="flex flex-col min-h-screen pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {t("cdkeyManagement") || "激活码管理"}
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        {t("cdkeyDescription") || "Manage software trial activation keys, view allocation states, and update user access credentials."}
                    </p>
                </div>
                
                <Button
                    type="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                        createForm.setFieldsValue({
                            product: productFilter,
                            enabled: true
                        });
                        setCdkeyCount(0);
                        handleProductSearch(""); // fetch initial list for creation dialog
                        setIsCreateModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 h-9 rounded-lg"
                    disabled={loadingProducts || productOptions.length === 0}
                >
                    {t("addCDKey") || "添加激活码"}
                </Button>
            </div>

            {/* Filter Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {/* Product Selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                            {t("product")} <span className="text-red-500">*</span>
                        </label>
                        <Select
                            placeholder={t("selectProduct")}
                            value={productFilter}
                            onChange={(value) => setProductFilter(value)}
                            allowClear={false}
                            showSearch
                            loading={loadingProducts}
                            filterOption={false}
                            onSearch={handleProductSearch}
                            options={productOptions.map((p) => ({
                                value: p.id,
                                label: p.name,
                            }))}
                            className="w-full"
                        />
                    </div>

                    {/* Operator Filter */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                            {t("operator")}
                        </label>
                        <Select
                            placeholder={t("searchUserPlaceholder") || "Search operator..."}
                            value={operatorFilter || undefined}
                            onChange={(value) => setOperatorFilter(value || "")}
                            allowClear
                            showSearch
                            filterOption={false}
                            onSearch={handleOperatorSearch}
                            options={operatorOptions}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Color Legend & Pagination row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                {/* Color Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                    <span className="text-gray-450 font-bold uppercase tracking-wider text-[10px] mr-1">
                        {t("status") || "Status"}:
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-50 border border-blue-200"></span>
                        {t("statusUnassignedActive")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-green-50 border border-green-200"></span>
                        {t("statusAssignedActive")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-50 border border-red-200"></span>
                        {t("statusAssignedDisabled")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-gray-100 border border-gray-300"></span>
                        {t("statusUnassignedDisabled")}
                    </span>
                </div>

                {/* Inline Pagination */}
                {productFilter && cdkeys.length > 0 && (
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        showSizeChanger
                        onChange={handlePageChange}
                        pageSizeOptions={["10", "20", "50", "100", "200"]}
                        size="small"
                        showTotal={(total, range) => 
                            t('showingEntries', { start: range[0], end: range[1], total }) || 
                            `Showing ${range[0]}-${range[1]} of ${total} entries`
                        }
                    />
                )}
            </div>

            {/* Content Body */}
            {loadingKeys ? (
                <div className="flex items-center justify-center py-20 flex-1">
                    <Spin size="large" />
                </div>
            ) : !productFilter ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <Empty description={t("pleaseChooseProduct") || "Please select a product to manage activation codes."} />
                </div>
            ) : cdkeys.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-350 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <Empty description={t("noData") || "No activation codes found matching criteria."} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-between">
                    {/* Grid of CDKeys cards */}
                    <div className="flex flex-wrap gap-4 mb-8 justify-start">
                        {cdkeys.map((cdkey) => {
                            const config = getCardConfig(cdkey);
                            const isPopoverOpen = editingKeyId === cdkey.id;

                            return (
                                <Popover
                                    key={cdkey.id}
                                    content={renderEditForm(cdkey)}
                                    trigger="click"
                                    open={isPopoverOpen}
                                    onOpenChange={(visible) => {
                                        if (visible) {
                                            handleCardClick(cdkey);
                                        } else {
                                            setEditingKeyId(null);
                                        }
                                    }}
                                    placement="bottom"
                                >
                                    <div 
                                        className={`relative border rounded-lg p-2.5 w-[181px] shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 flex items-center justify-between select-none ${config.bg}`}
                                    >
                                        <code className="font-mono text-xs font-bold select-all break-all tracking-tight text-gray-800 mr-2 leading-none">
                                            {cdkey.id}
                                        </code>
                                        
                                        <Tooltip title={copiedKey === cdkey.id ? t("copySuccess") || "Copied!" : t("copyUrl") || "Copy to clipboard"}>
                                            <button
                                                onClick={(e) => handleCopyToClipboard(e, cdkey.id)}
                                                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-all flex items-center justify-center border border-transparent hover:border-gray-200 shrink-0"
                                            >
                                                {copiedKey === cdkey.id ? (
                                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </Tooltip>
                                    </div>
                                </Popover>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bulk Create CDKeys Modal */}
            <Modal
                title={t("addCDKey") || "添加激活码"}
                open={isCreateModalOpen}
                onCancel={() => {
                    setIsCreateModalOpen(false);
                    createForm.resetFields();
                    setCdkeyCount(0);
                }}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreateSubmit}
                    initialValues={{
                        enabled: true
                    }}
                    requiredMark={false}
                    className="pt-2"
                >
                    <Form.Item
                        name="product"
                        label={<span className="font-semibold text-gray-750">{t("product")}</span>}
                        rules={[{ required: true, message: t("productRequired") }]}
                    >
                        <Select
                            placeholder={t("selectProduct")}
                            showSearch
                            filterOption={false}
                            onSearch={handleProductSearch}
                            options={productOptions.map((p) => ({
                                value: p.id,
                                label: p.name,
                            }))}
                            className="w-full"
                        />
                    </Form.Item>

                    <Form.Item
                        name="cdkeysText"
                        label={
                            <span className="font-semibold text-gray-750 flex items-center justify-between w-full">
                                <span>{t("addCDKeyPlaceholder") || "Enter activation codes"}</span>
                                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                                    {t("cdkeyCount") || "Count"}: {cdkeyCount}
                                </span>
                            </span>
                        }
                        rules={[{ required: true, message: t("addCDKeyPlaceholder") }]}
                        help={t("addCDKeyHelp") || "Enter activation codes, one code per line."}
                    >
                        <Input.TextArea
                            rows={6}
                            placeholder={`KEY-XXXX-XXXX\nKEY-YYYY-YYYY\nKEY-ZZZZ-ZZZZ`}
                            className="font-mono text-sm"
                            onChange={handleTextareaChange}
                        />
                    </Form.Item>

                    <Form.Item
                        name="enabled"
                        label={<span className="font-semibold text-gray-750">{t("status")}</span>}
                        valuePropName="checked"
                    >
                        <Switch 
                            checkedChildren={t("enabled")} 
                            unCheckedChildren={t("disabled")} 
                        />
                    </Form.Item>

                    <div className="flex justify-end gap-3 border-t border-gray-150 pt-4 mt-6">
                        <Button 
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                createForm.resetFields();
                                setCdkeyCount(0);
                            }}
                        >
                            {t("cancel")}
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            loading={submittingCreate}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {t("confirm")}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CDKeyPage;
