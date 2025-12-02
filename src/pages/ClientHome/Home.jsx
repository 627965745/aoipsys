import React, { useState, useEffect } from "react";
import { message, Modal, Button, Switch, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { getResourceCondition, getResource, requestPdf, getUserMarkdown, logout, getLanguageCombo, getUserInfo, subscribeEmail } from "../../api/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
    Search,
    ChevronRight,
    Home as HomeIcon,
    Library,
    CloudCog,
    Settings,
    User,
    LogOut,
    Cpu,
    Zap,
    FileText,
    Calendar,
    Download,
    Globe,
    ChevronDown,
    Lock,
    Mail,
    ExternalLink
} from "lucide-react";
import { ExclamationCircleOutlined, FilePdfOutlined } from "@ant-design/icons";
import MdViewer from "../../components/MdViewer";
import qs from "qs";

const Home = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, checkAuthStatus } = useAuth();
    
    // Resource states
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
    const [currentMarkdown, setCurrentMarkdown] = useState("");
    const [loadingView, setLoadingView] = useState(false);
    const [originalData, setOriginalData] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [plainPdfLoading, setPlainPdfLoading] = useState(false);
    const [plainPdfProgress, setPlainPdfProgress] = useState(0);

    // Layout states (from ClientAppLayout)
    const [languages, setLanguages] = useState([]);
    const [languageName, setLanguageName] = useState(null);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [sidebarActive, setSidebarActive] = useState("resources");

    useEffect(() => {
        fetchConditions();
        fetchLanguages();
    }, [i18n.language]);

    useEffect(() => {
        if (user) {
            fetchUserSubscriptionStatus();
        }
    }, [user]);

    useEffect(() => {
        if (languages.length > 0) {
            const currentLanguage = languages.find(lang => lang.id === i18n.language);
            setLanguageName(currentLanguage?.name);
        }
    }, [i18n.language, languages]);

    // Fetch functions from Home.jsx
    const fetchConditions = async () => {
        try {
            const response = await getResourceCondition({
                language: i18n.language,
            });
            if (response.data.status === 0) {
                const nestedData = response.data.data || [];
                setOriginalData(nestedData);

                const categoryData = nestedData.map((item) => ({
                    id: item.id,
                    name: item.name,
                    highlighted: item.highlighted,
                }));

                const productData = nestedData.reduce((acc, category) => {
                    if (category.children) {
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

    const fetchResources = async (page, rows, query = searchQuery) => {
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
        } else if (!searchQuery) {
            setResources([]);
            setTotal(0);
            setCurrentPage(1);
        }
    }, [selectedProduct, selectedCategory]);

    // Functions from ClientAppLayout
    const fetchLanguages = async () => {
        setLoadingLanguages(true);
        try {
            const response = await getLanguageCombo();
            if (response.data.status === 0) {
                setLanguages(response.data.data);
                
                let currentLanguage = response.data.data.find(lang => lang.id === i18n.language);
                if (!currentLanguage) {
                    const languageCode = i18n.language.split('_')[0];
                    currentLanguage = response.data.data.find(lang => lang.id.startsWith(languageCode));
                }

                if (!currentLanguage && response.data.data.length > 0) {
                    currentLanguage = response.data.data[0];
                    i18n.changeLanguage(currentLanguage.id);
                }
                setLanguageName(currentLanguage?.name);
            }
        } catch (error) {
            console.error("Error fetching languages:", error);
        } finally {
            setLoadingLanguages(false);
        }
    };

    const handleLanguageChange = (value) => {
        i18n.changeLanguage(value);
        const selectedLanguage = languages.find(lang => lang.id === value);
        setLanguageName(selectedLanguage?.name);
        setShowLanguageDropdown(false);
    };

    const getLanguageFlag = (langCode) => {
        const countryCode = langCode.slice(-2);
        const flagEmoji = countryCode
            .toUpperCase()
            .split('')
            .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
            .join('');
        return flagEmoji;
    };

    const handleLogout = async () => {
        try {
            const response = await logout();
            if (response.data.status === 0) {
                message.success(t("logoutSuccess"));
                await checkAuthStatus(); 
                navigate("/login");
            } else {
                message.error(t("logoutFailed"));
            }
        } catch (error) {
            message.error(error.response?.data?.message || t("logoutError"));
            await checkAuthStatus(); 
            navigate("/login");
        }
    };

    const handleSubscriptionToggle = async (checked) => {
        setSubscriptionLoading(true);
        try {
            const response = await subscribeEmail({ 
                is_subscribed: checked ? 1 : 0 
            });
            if (response.data?.status === 0) {
                setIsSubscribed(checked);
                message.success(
                    checked 
                        ? t('subscriptionEnabled') || 'Email subscription enabled'
                        : t('subscriptionDisabled') || 'Email subscription disabled'
                );
            } else {
                message.error(t('subscriptionUpdateFailed') || 'Failed to update subscription');
            }
        } catch (error) {
            console.error("Error updating subscription:", error);
            message.error(error.response?.data?.message || t('subscriptionUpdateError') || 'Error updating subscription');
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const fetchUserSubscriptionStatus = async () => {
        try {
            const response = await getUserInfo();
            if (response.data?.status === 0 && response.data?.data) {
                setIsSubscribed(response.data.data.is_subscribed === 1);
            }
        } catch (error) {
            console.error("Error fetching user subscription status:", error);
        }
    };

    // Resource handlers
    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
        if (!value && !selectedProduct) {
            setResources([]);
            setTotal(0);
            return;
        }
        fetchResources(1, pageSize, value);
    };

    const handleTableChange = (page, newPageSize) => {
        setCurrentPage(page);
        setPageSize(newPageSize);
        if (selectedProduct) {
            fetchResources(page, newPageSize, searchQuery);
        }
    };

    const typeConfig = {
        0: { key: "document" },
        1: { key: "software" },
        2: { key: "firmware" },
        3: { key: "other" },
    };

    const handleResourceClick = async (record) => {
        const hasUrl = record.url && record.url.trim() !== "";
        const hasMarkdown = record.is_markdown === 1;

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
            await fetchMarkdownData(record.id);
        } else if (hasUrl && hasMarkdown) {
            setCurrentResource(record);
            await fetchMarkdownData(record.id);
        }
    };

    const fetchMarkdownData = async (resourceId) => {
        setIsModalOpen(false);
        setLoadingView(true);
        try {
            const response = await getUserMarkdown({ 
                id: resourceId,
                language: i18n.language 
            });
            
            if (response.data.status === 0 && response.data.data) {
                setCurrentMarkdown(response.data.data || "");
            } else {
                message.error(response.data.message || t('fetchMarkdownError'));
                setCurrentMarkdown("");
            }
        } catch (error) {
            console.error("Error fetching markdown:", error);
            message.error(error.response?.data?.message || t('fetchMarkdownError'));
            setCurrentMarkdown("");
        } finally {
            setLoadingView(false);
            setIsModalOpen(true);
        }
    };

    const handleUrlClick = (url, isDownload = false) => {
        if (isDownload) {
            const link = document.createElement('a');
            link.href = url;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            Modal.confirm({
                title: t("confirmJump"),
                icon: <ExclamationCircleOutlined />,
                content: (
                    <div>
                        <p>{t("jumpToExternalLink")}</p>
                        <p className="text-[#99a1af] break-all mt-2">{url}</p>
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
                
                xhr.onreadystatechange = () => {
                    if (xhr.readyState >= 2 && !totalSize) {
                        const contentLength = xhr.getResponseHeader('content-length');
                        if (contentLength) {
                            totalSize = parseInt(contentLength, 10);
                        }
                    }
                };
                
                xhr.onprogress = (event) => {
                    let percentCompleted;
                    const total = event.total || totalSize;
                    
                    if (total > 0) {
                        percentCompleted = Math.round((event.loaded * 100) / total);
                    } else {
                        const loadedKB = Math.round(event.loaded / 1024);
                        percentCompleted = Math.min(85, Math.sqrt(loadedKB) * 8);
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
                }, { skipNulls: false, allowEmptyArrays: true, encode: true });
                
                xhr.send(formData);
            });
            
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            const dateString = formatDateForFilename(currentResource.time_updated);
            link.download = `${currentResource.resource_name}${dateString}.pdf`;
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
            if (smoothingInterval) {
                cancelAnimationFrame(smoothingInterval);
            }
        } finally {
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
            const year = date.getFullYear().toString().slice(-2); 
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
            const day = date.getDate().toString().padStart(2, '0');
            return `_${year}${month}${day}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(
            selectedCategory?.id === category.id ? null : category
        );
        setSelectedProduct(null);
    };

    const handleProductClick = (product) => {
        setSelectedProduct(selectedProduct?.id === product.id ? null : product);
    };

    const getFilteredProducts = () => {
        if (!selectedCategory) return [];

        const categoryData = originalData.find(
            (c) => c.id === selectedCategory.id
        );

        if (categoryData && categoryData.children) {
            return Object.entries(categoryData.children).map(([id, name]) => ({
                id,
                name,
                categoryId: categoryData.id,
            }));
        }

        return [];
    };

    const getCurrentLanguageLabel = () => {
        const lang = i18n.language;
        const found = languages.find(l => l.id === lang);
        return found ? found.name : lang;
    };

    // Sidebar Button Component
    const SidebarButton = ({ icon: Icon, label, active, badge, onClick }) => {
        return (
            <button 
                onClick={onClick}
                className={`
                    group flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-300
                    ${active 
                        ? 'bg-[rgba(0,211,242,0.2)] text-[#00d3f2] font-medium border border-[rgba(0,211,242,0.3)]' 
                        : 'text-[#99a1af] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }
                `}
            >
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${active ? 'text-[#00d3f2]' : 'text-[#99a1af] group-hover:text-white'}`} />
                    <span>{label}</span>
                </div>
                {badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-[#00d3f2] text-[#0a0e27] rounded">
                        {badge}
                    </span>
                )}
                {!badge && active && <ChevronRight className="w-3 h-3 text-[#00d3f2]" />}
            </button>
        );
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-slate-300 font-sans">
            {/* Sidebar */}
            <div className="flex flex-col w-64 h-screen bg-[rgba(0,0,0,0.3)] backdrop-blur-md border-r border-[rgba(255,255,255,0.1)] text-sm flex-shrink-0 fixed left-0 top-0 z-50">
                {/* Header / Logo Area */}
                <div className="flex items-center gap-3 px-6 py-6 mb-2 border-b border-[rgba(255,255,255,0.1)]">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d3f2] to-[#2b7fff] shadow-lg shadow-[rgba(0,211,242,0.3)]">
                        <Zap className="w-5 h-5 text-white" fill="currentColor" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight text-white uppercase font-sans">
                            {t("brand")}
                        </span>
                        <span className="text-[10px] text-[#99a1af] uppercase tracking-widest">
                            {t("cloudConsole")}
                        </span>
                    </div>
                </div>

                {/* Navigation Groups */}
                <div className="flex-1 overflow-y-auto py-4">
                    {/* Group 1: Platform */}
                    <div className="mb-6">
                        <div className="px-6 mb-2 text-xs font-semibold text-[#99a1af] uppercase tracking-wider">
                            {t("platform")}
                        </div>
                        <nav className="space-y-1 px-3">
                            <SidebarButton icon={HomeIcon} label={t("home")} onClick={() => {}} />
                            <SidebarButton icon={Library} label={t("resourcesDocs")} active={sidebarActive === "resources"} onClick={() => setSidebarActive("resources")} badge="NEW" />
                            <SidebarButton icon={CloudCog} label={t("cloudControl")} badge="Beta" onClick={() => {}} />
                        </nav>
                    </div>

                    {/* Group 2: Devices */}
                    <div className="mb-6">
                        <div className="px-6 mb-2 text-xs font-semibold text-[#99a1af] uppercase tracking-wider">
                            {t("myDevices")}
                        </div>
                        <nav className="space-y-1 px-3">
                            <SidebarButton icon={Cpu} label={t("audioMatrixPro")} onClick={() => {}} />
                            <SidebarButton icon={Cpu} label={t("dspProcessors")} onClick={() => {}} />
                        </nav>
                    </div>
                </div>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.3)]">
                    <div className="mb-4 space-y-1">
                        <button 
                            onClick={() => {}}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-[#99a1af] hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all duration-300"
                        >
                            <Settings className="w-5 h-5" />
                            <span>{t("settings")}</span>
                        </button>
                        <button 
                            onClick={() => navigate("/reset-password?source=client")}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-[#99a1af] hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all duration-300"
                        >
                            <Lock className="w-5 h-5" />
                            <span>{t("changePassword")}</span>
                        </button>
                        <div className="flex items-center justify-between w-full px-4 py-2.5 text-[#99a1af]">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5" />
                                <span className="text-sm">{t("subscribeToEmails")}</span>
                            </div>
                            <Switch
                                size="small"
                                checked={isSubscribed}
                                loading={subscriptionLoading}
                                onChange={handleSubscriptionToggle}
                            />
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-[#ff6b9d] hover:text-[#ff8fb5] hover:bg-[rgba(255,107,157,0.1)] rounded-lg transition-all duration-300"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>{t("logout")}</span>
                        </button>
                    </div>

                    {user && (
                        <div className="flex items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00d3f2] to-[#2b7fff] flex items-center justify-center text-sm font-bold text-white ring-2 ring-[rgba(255,255,255,0.2)]">
                                {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name || t('user')}</p>
                                <p className="text-xs text-[#99a1af] truncate">{user.email || ''}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="ml-64 flex-1 flex flex-col min-h-screen relative z-0">
                
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-40 bg-[rgba(0,0,0,0.3)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[#99a1af]">
                        <span className="hover:text-[#00d3f2] cursor-pointer transition-colors">{t("resource")}</span>
                        {selectedCategory && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <span className="hover:text-[#00d3f2] cursor-pointer transition-colors">{selectedCategory.name}</span>
                            </>
                        )}
                        {selectedProduct && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-white font-medium">{selectedProduct.name}</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Language Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,211,242,0.3)] rounded-lg text-white hover:border-[#00d3f2] transition-all duration-300 px-3 py-2"
                            >
                                <Globe className="h-4 w-4 text-[#00d3f2]" />
                                <span className="text-sm">{getCurrentLanguageLabel()}</span>
                                <ChevronDown className={`h-4 w-4 text-[#00d3f2] transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showLanguageDropdown && (
                                <div className="absolute right-0 mt-2 w-40 bg-[#1a1f3a] border border-[rgba(0,211,242,0.3)] rounded-lg shadow-2xl overflow-hidden z-10">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.id}
                                            onClick={() => handleLanguageChange(lang.id)}
                                            className={`w-full px-4 py-3 text-left hover:bg-[rgba(0,211,242,0.1)] transition-colors text-sm ${
                                                i18n.language === lang.id ? 'bg-[rgba(0,211,242,0.2)] text-[#00d3f2]' : 'text-white'
                                            }`}
                                        >
                                            <span className="mr-2">{getLanguageFlag(lang.id)}</span>
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
                    <div className="max-w-8xl mx-auto space-y-6">
                        
                        {/* Filter Section */}
                        <section className="space-y-6">
                            {/* Categories */}
                            <div className="space-y-3">
                                <h2 className="text-lg font-medium text-white">{t("category")}:</h2>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category, index) => (
                                        <button 
                                key={category.id}
                                            onClick={() => handleCategoryClick(category)}
                                            className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                                    category.highlighted === 1 
                                                    ? selectedCategory?.id === category.id
                                                        ? 'bg-[#645D21] text-white font-semibold shadow-lg'
                                                        : 'bg-[#B8BE14] text-white font-semibold hover:bg-[#a3aa12] shadow-md'
                                                    : selectedCategory?.id === category.id
                                                        ? 'bg-[#00d3f2] text-[#0a0e27] font-medium shadow-lg shadow-[rgba(0,211,242,0.3)]'
                                                        : index < 3
                                                        ? 'bg-[rgba(0,211,242,0.2)] text-[#00d3f2] border border-[rgba(0,211,242,0.3)] shadow-md hover:bg-[rgba(0,211,242,0.3)]'
                                                        : 'bg-[rgba(255,255,255,0.05)] text-[#99a1af] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(0,211,242,0.3)] hover:bg-[rgba(0,211,242,0.1)] hover:text-[#00d3f2]'
                                            }`}
                            >
                                {category.name}
                                        </button>
                        ))}
                </div>
                            </div>

                            {/* Products */}
                            <div className="space-y-3">
                                <h2 className="text-lg font-medium text-white">{t("product")}:</h2>
                                <div className="flex flex-wrap gap-2">
                        {!selectedCategory ? (
                                        <div className="text-[#99a1af] italic py-2">
                                {t("pleaseChooseCategory") || "Please choose a category"}
                            </div>
                        ) : (
                            getFilteredProducts().map((product) => (
                                            <button 
                                    key={product.id}
                                                onClick={() => handleProductClick(product)}
                                                className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 border ${
                                        selectedProduct?.id === product.id
                                                        ? 'bg-[rgba(0,211,242,0.2)] border-[rgba(0,211,242,0.3)] text-[#00d3f2]' 
                                                        : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#99a1af] hover:border-[rgba(0,211,242,0.3)] hover:text-[#00d3f2]'
                                                }`}
                                >
                                    {product.name}
                                            </button>
                            ))
                        )}
                </div>
            </div>
                        </section>

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4">
                            {/* Search */}
                            <div className="relative w-full sm:w-96 group flex-1">
                                <input
                                    type="text"
                                    className="block w-full pl-4 pr-12 py-3 border border-[rgba(255,255,255,0.1)] rounded-lg leading-5 bg-[rgba(255,255,255,0.05)] text-white placeholder-[#99a1af] focus:outline-none focus:border-[#00d3f2] focus:ring-2 focus:ring-[rgba(0,211,242,0.3)] transition-all duration-300 sm:text-sm"
                                    placeholder={t("searchPlaceholder")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                                />
                            </div>
                            <button 
                                onClick={() => handleSearch(searchQuery)}
                                className="px-6 py-3 bg-gradient-to-r from-[#00d3f2] to-[#00b8db] text-[#0a0e27] rounded-lg hover:from-[#00b8db] hover:to-[#009fc4] focus:outline-none transition-all duration-300 shadow-lg shadow-[rgba(0,211,242,0.3)]"
                            >
                                <Search className="w-5 h-5" />
                            </button>
            </div>

                        {/* Resource Table */}
                        <div className="w-full overflow-hidden rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-[#99a1af] min-w-[640px]" style={{ tableLayout: 'fixed' }}>
                                    <colgroup>
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '20%' }} />
                                        <col style={{ width: '35%' }} />
                                        <col style={{ width: '15%' }} />
                                        <col style={{ width: '20%' }} />
                                    </colgroup>
                                    <thead className="text-xs uppercase bg-[rgba(0,0,0,0.3)] text-[#99a1af] border-b border-[rgba(255,255,255,0.1)]">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-4 font-semibold tracking-wider" style={{ width: '10%' }}>{t("type")}</th>
                                            <th className="px-4 sm:px-6 py-4 font-semibold tracking-wider" style={{ width: '20%' }}>{t("productName")}</th>
                                            <th className="px-4 sm:px-6 py-4 font-semibold tracking-wider" style={{ width: '35%' }}>{t("resourceName")}</th>
                                            <th className="px-4 sm:px-6 py-4 font-semibold tracking-wider" style={{ width: '15%' }}>{t("timeUpdated")}</th>
                                            <th className="px-4 sm:px-6 py-4 font-semibold tracking-wider text-center" style={{ width: '20%' }}>{t("action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center text-[#99a1af]">
                                                    {t("loading")}
                                                </td>
                                            </tr>
                                        ) : resources.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center text-[#99a1af]">
                                                    {searchQuery 
                        ? (t("noSearchResults") || "No search results found")
                        : !selectedProduct 
                            ? (t("pleaseChooseProduct") || "Please choose a product to view resources")
                            : (t("noData") || "No data")
                                                    }
                                                </td>
                                            </tr>
                                        ) : (
                                            resources.map((item) => {
                                                const hasUrl = item.url && item.url.trim() !== "";
                                                const hasMarkdown = item.is_markdown === 1;
                                                const isSoftwareOrFirmware = item.type === 1 || item.type === 2;
                                                const fileType = getFileExtension(item.url);

                                                return (
                                                    <tr 
                                                        key={item.id} 
                                                        className="hover:bg-[rgba(255,255,255,0.05)] transition-colors group"
                                                    >
                                                        <td className="px-4 sm:px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 rounded bg-[rgba(0,211,242,0.2)] text-[#00d3f2]">
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-medium text-white">{t(typeConfig[item.type]?.key || "notAvailable")}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 font-medium text-white">{item.product_name}</td>
                                                        <td className="px-4 sm:px-6 py-4 text-[#d1d5dc]">{item.resource_name}</td>
                                                        <td className="px-4 sm:px-6 py-4">
                                                            <div className="flex items-center gap-2 text-[#99a1af]">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {item.time_updated}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4">
                                                            <div className="flex justify-center">
                                                                {!hasUrl && !hasMarkdown ? (
                                                                    <Tooltip title={t("notAvailableInYourLanguage")}>
                                                                        <span className="text-[#99a1af] text-xs">{t("currentlyUnavailable")}</span>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Tooltip title={fileType ? `${t("fileType")}: ${fileType}` : ''}>
                                                                        <button 
                                                                            onClick={() => handleResourceClick(item)}
                                                                            disabled={loadingView}
                                                                            className="text-[#00d3f2] hover:text-[#00b8db] font-medium text-xs px-3 py-1.5 rounded-full bg-[rgba(0,211,242,0.1)] hover:bg-[rgba(0,211,242,0.2)] transition-all duration-300 border border-[rgba(0,211,242,0.3)] flex items-center gap-1"
                                                                        >
                                                                            <span>{!hasMarkdown && isSoftwareOrFirmware ? t("download") : t("view")}</span>
                                                                            {!hasMarkdown && isSoftwareOrFirmware ? <Download className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                                                                        </button>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination Footer */}
                            <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 bg-[rgba(0,0,0,0.3)] border-t border-[rgba(255,255,255,0.1)] gap-4">
                                <span className="text-xs text-[#99a1af]">
                                    {t("showingEntries", {
                                        start: total === 0 ? 0 : (currentPage - 1) * pageSize + 1,
                                        end: Math.min(currentPage * pageSize, total),
                    total,
                                    })}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleTableChange(currentPage - 1, pageSize)}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded border border-[rgba(255,255,255,0.1)] text-[#99a1af] hover:border-[rgba(0,211,242,0.3)] hover:text-[#00d3f2] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        &lt;
                                    </button>
                                    {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
                                        .slice(Math.max(0, currentPage - 3), Math.min(Math.ceil(total / pageSize), currentPage + 2))
                                        .map(page => (
                                            <button 
                                                key={page}
                                                onClick={() => handleTableChange(page, pageSize)}
                                                className={`w-8 h-8 flex items-center justify-center rounded font-medium transition-all duration-300 ${
                                                    page === currentPage 
                                                        ? 'bg-[#00d3f2] text-[#0a0e27] shadow-lg shadow-[rgba(0,211,242,0.3)]'
                                                        : 'border border-[rgba(255,255,255,0.1)] text-[#99a1af] hover:border-[rgba(0,211,242,0.3)] hover:text-[#00d3f2]'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))
                                    }
                                    <button 
                                        onClick={() => handleTableChange(currentPage + 1, pageSize)}
                                        disabled={currentPage >= Math.ceil(total / pageSize)}
                                        className="w-8 h-8 flex items-center justify-center rounded border border-[rgba(255,255,255,0.1)] text-[#99a1af] hover:border-[rgba(0,211,242,0.3)] hover:text-[#00d3f2] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        &gt;
                                    </button>
                                    
                                    <div className="ml-4 flex items-center gap-2">
                                        <select 
                                            value={pageSize}
                                            onChange={(e) => handleTableChange(1, Number(e.target.value))}
                                            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-xs rounded px-2 py-1.5 outline-none focus:border-[#00d3f2] transition-all duration-300"
                                        >
                                            <option value={10}>10 / {t("page")}</option>
                                            <option value={20}>20 / {t("page")}</option>
                                            <option value={50}>50 / {t("page")}</option>
                                            <option value={100}>100 / {t("page")}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer Copyright */}
                    <footer className="mt-16 text-center text-sm text-[#99a1af] pb-4">
                        {t("copyright")}
                    </footer>
                </div>
            </main>

            {/* Modal for Markdown View */}
            <Modal
                title={`${t('resourceName')}: ${currentResource?.resource_name}`}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setCurrentResource(null);
                    setCurrentMarkdown("");
                }}
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
                                        className="text-blue-500 hover:text-blue-700 mr-2 cursor-pointer"
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
                {currentResource?.is_markdown === 1 && currentResource.type !== 1 && (
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
                            <MdViewer content={currentMarkdown} />
                        </div>
                    </>
                )}
                {currentResource?.is_markdown === 1 && currentResource.type === 1 && (
                    <div id="markdown-content">
                        <MdViewer content={currentMarkdown} />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Home;
