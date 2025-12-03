import React, { useState, useEffect } from "react";
import { message, Modal, Button, Switch, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { 
  getResourceCondition, 
  getResource, 
  getUserMarkdown, 
  logout, 
  getLanguageCombo, 
  getUserInfo, 
  subscribeEmail 
} from "../../api/api"; // 假设路径一致
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // 假设路径一致
import {
  Search,
  ChevronRight,
  Home as HomeIcon,
  FileText,
  Settings,
  Lock,
  Mail,
  Globe,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Download,
  ExternalLink,
  Calendar,
  Zap
} from "lucide-react";
import { ExclamationCircleOutlined, FilePdfOutlined } from "@ant-design/icons";
import MdViewer from "../../components/MdViewer"; // 假设路径一致
import qs from "qs";

// 简单的 SVG Logo 组件，替代原来的图片
const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 shrink-0 bg-[#B8BE14] rounded-lg flex items-center justify-center shadow-md">
       <Zap className="text-white w-6 h-6" fill="currentColor"/>
    </div>
    <span className="text-[#1f2937] font-bold text-2xl tracking-wider">
      DOCS
    </span>
  </div>
);

const Home = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, checkAuthStatus } = useAuth();

  // --- 核心状态 (来自原 Home.jsx) ---
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [originalData, setOriginalData] = useState([]);

  // --- Modal & Markdown 状态 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState(null);
  const [currentMarkdown, setCurrentMarkdown] = useState("");
  const [loadingView, setLoadingView] = useState(false);
  const [plainPdfLoading, setPlainPdfLoading] = useState(false);
  const [plainPdfProgress, setPlainPdfProgress] = useState(0);

  // --- 布局 & 用户状态 ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('resources-docs');
  const [languages, setLanguages] = useState([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // --- API Effects ---
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
    if (selectedProduct) {
      fetchResources(1, pageSize);
    } else if (!searchQuery) {
      setResources([]);
      setTotal(0);
      setCurrentPage(1);
    }
  }, [selectedProduct, selectedCategory]);

  // --- Data Fetching Functions ---
  const fetchConditions = async () => {
    try {
      const response = await getResourceCondition({ language: i18n.language });
      if (response.data.status === 0) {
        const nestedData = response.data.data || [];
        setOriginalData(nestedData);
        
        // 映射 Categories
        const categoryData = nestedData.map((item) => ({
          id: item.id,
          name: item.name,
          highlighted: item.highlighted,
        }));
        setCategories(categoryData);
        
        // 如果有高亮分类，默认选中第一个 (可选优化)
        // if (categoryData.length > 0 && !selectedCategory) setSelectedCategory(categoryData[0]);
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

  const fetchLanguages = async () => {
    try {
      const response = await getLanguageCombo();
      if (response.data.status === 0) {
        setLanguages(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
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

  // --- Handlers ---
  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory?.id === category.id ? null : category);
    setSelectedProduct(null); // 重置产品选择
  };

  const handleProductClick = (product) => {
    setSelectedProduct(selectedProduct?.id === product.id ? null : product);
  };

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
    if (selectedProduct || searchQuery) {
      fetchResources(page, newPageSize, searchQuery);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await logout();
      if (response.data.status === 0) {
        message.success(t("logoutSuccess"));
        await checkAuthStatus();
        navigate("/login");
      }
    } catch (error) {
      message.error(t("logoutFailed"));
    }
  };

  const handleSubscriptionToggle = async (checked) => {
    setSubscriptionLoading(true);
    try {
      const response = await subscribeEmail({ is_subscribed: checked ? 1 : 0 });
      if (response.data?.status === 0) {
        setIsSubscribed(checked);
        message.success(checked ? t('subscriptionEnabled') : t('subscriptionDisabled'));
      }
    } catch (error) {
      message.error(t('subscriptionUpdateError'));
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // --- Resource Interaction Handlers (Download/View) ---
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
        onOk() { window.open(record.url, "_blank"); },
      });
    } else {
      setCurrentResource(record);
      await fetchMarkdownData(record.id);
    }
  };

  const fetchMarkdownData = async (resourceId) => {
    setLoadingView(true);
    setIsModalOpen(false); // 先关闭防止闪烁
    try {
      const response = await getUserMarkdown({ id: resourceId, language: i18n.language });
      if (response.data.status === 0) {
        setCurrentMarkdown(response.data.data || "");
        setIsModalOpen(true);
      } else {
        message.error(response.data.message || t('fetchMarkdownError'));
      }
    } catch (error) {
      message.error(t('fetchMarkdownError'));
    } finally {
      setLoadingView(false);
    }
  };

  const handleResquestPdf = async () => {
     if (!currentResource?.id) return;
     setPlainPdfLoading(true);
     setPlainPdfProgress(10); // Start progress
     
     // 模拟平滑进度条逻辑简化版
     const timer = setInterval(() => {
        setPlainPdfProgress(prev => Math.min(prev + 5, 90));
     }, 200);

     try {
         const response = await new Promise((resolve, reject) => {
             const xhr = new XMLHttpRequest();
             xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL}/Client/Search/pdfGet`);
             xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
             xhr.responseType = 'blob';
             xhr.withCredentials = true;
             
             xhr.onload = () => {
                 if (xhr.status >= 200 && xhr.status < 300) resolve({ data: xhr.response });
                 else reject(new Error(`HTTP ${xhr.status}`));
             };
             xhr.onerror = () => reject(new Error('Network error'));
             
             const formData = qs.stringify({
                 id: currentResource.id,
                 language: i18n.language
             });
             xhr.send(formData);
         });

         clearInterval(timer);
         setPlainPdfProgress(100);

         const blob = response.data;
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `${currentResource.resource_name}.pdf`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         message.success(t('pdfDownloadSuccess'));
     } catch (error) {
         clearInterval(timer);
         message.error(t('pdfDownloadError'));
     } finally {
         setTimeout(() => {
             setPlainPdfLoading(false);
             setPlainPdfProgress(0);
         }, 500);
     }
  };

  // --- Helpers ---
  const getFilteredProducts = () => {
    if (!selectedCategory) return [];
    const categoryData = originalData.find((c) => c.id === selectedCategory.id);
    if (categoryData && categoryData.children) {
      return Object.entries(categoryData.children).map(([id, name]) => ({
        id,
        name,
        categoryId: categoryData.id,
      }));
    }
    return [];
  };

  const typeConfig = {
    0: { key: "document" },
    1: { key: "software" },
    2: { key: "firmware" },
    3: { key: "other" },
  };

  const getCurrentLanguageLabel = () => {
      const lang = languages.find(l => l.id === i18n.language);
      return lang ? lang.name : 'Language';
  };

  return (
    <div className="min-h-screen flex bg-[#f5f7fa] font-sans relative">
      {/* --- Mobile Overlay --- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- Left Sidebar (Figma Style) --- */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-[#e5e7eb] flex flex-col shadow-lg lg:shadow-sm
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-[#6b7280] hover:bg-[#f3f4f6] rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-[#e5e7eb]">
          <Logo />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveMenu('home')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
              activeMenu === 'home'
                ? 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]'
                : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]'
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span>{t.home || "Home"}</span>
          </button>

          <button
            onClick={() => setActiveMenu('resources-docs')}
            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
              activeMenu === 'resources-docs'
                ? 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]'
                : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <span>{t("resourcesDocs")}</span>
            </div>
            <span className="text-xs bg-[#0369a1] text-white px-2 py-0.5 rounded font-bold">
              NEW
            </span>
          </button>
        </nav>

        {/* Bottom Menu & User Settings */}
        <div className="p-4 border-t border-[#e5e7eb] space-y-1">
          {/* Email Subscription Switch */}
          <div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-[#6b7280] rounded-lg">
            <div className="flex items-center gap-3">
               <Mail className="h-5 w-5" />
               <span className="text-sm">{t("subscribeToEmails")}</span>
            </div>
            <Switch 
                size="small" 
                checked={isSubscribed}
                loading={subscriptionLoading}
                onChange={handleSubscriptionToggle}
            />
          </div>

          <button onClick={() => navigate("/reset-password?source=client")} className="w-full flex items-center gap-3 px-4 py-2.5 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937] rounded-lg transition-all duration-300">
            <Lock className="h-5 w-5" />
            <span>{t("changePassword")}</span>
          </button>

          <button onClick={() => {}} className="w-full flex items-center gap-3 px-4 py-2.5 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937] rounded-lg transition-all duration-300">
            <Settings className="h-5 w-5" />
            <span>{t("settings")}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[#dc2626] hover:bg-[#fee2e2] hover:text-[#991b1b] rounded-lg transition-all duration-300"
          >
            <LogOut className="h-5 w-5" />
            <span>{t("logout")}</span>
          </button>

          {/* Language Selector */}
          <div className="relative pt-2">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-[#d1d5db] rounded-lg text-[#1f2937] hover:border-[#0369a1] transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#0369a1]" />
                <span className="text-sm">{getCurrentLanguageLabel()}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-[#0369a1] transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLanguageDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#d1d5db] rounded-lg shadow-xl overflow-hidden z-20">
                {languages.map(lang => (
                    <button
                        key={lang.id}
                        onClick={() => {
                            i18n.changeLanguage(lang.id);
                            setShowLanguageDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#f3f4f6] transition-colors text-sm ${
                            i18n.language === lang.id ? 'bg-[#e0f2fe] text-[#0369a1]' : 'text-[#1f2937]'
                        }`}
                    >
                        {lang.name}
                    </button>
                ))}
              </div>
            )}
          </div>
          
          {/* User Profile Mini */}
          {user && (
            <div className="mt-4 pt-4 border-t border-[#e5e7eb] flex items-center gap-3 px-2">
                 <div className="w-8 h-8 rounded-full bg-[#B8BE14] flex items-center justify-center text-white font-bold text-xs">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1f2937] truncate">{user.name}</p>
                    <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
                 </div>
            </div>
          )}
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-30 bg-white p-2 rounded-lg shadow-md border border-[#e5e7eb] text-[#1f2937]"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* --- Top Header Section --- */}
        <div className="p-4 sm:p-6 border-b border-[#e5e7eb] bg-white">
          <h1 className="text-[#1f2937] text-xl font-semibold mb-1 mt-12 lg:mt-0 flex items-center gap-2">
            {t("resourcesDocs")}
            {selectedCategory && (
                <>
                    <ChevronRight className="h-4 w-4 text-[#9ca3af]" />
                    <span className="text-[#0369a1]">{selectedCategory.name}</span>
                </>
            )}
             {selectedProduct && (
                <>
                    <ChevronRight className="h-4 w-4 text-[#9ca3af]" />
                    <span className="text-[#6b7280] text-base font-normal">{selectedProduct.name}</span>
                </>
            )}
          </h1>

          {/* Category Tabs */}
          <div className="mt-6">
            <label className="text-[#374151] font-medium mb-3 block text-sm uppercase tracking-wide">{t("category")}:</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 border ${
                    selectedCategory?.id === category.id
                      ? 'bg-[#645D21] text-white border-[#645D21] shadow-md'
                      : category.highlighted === 1
                      ? 'bg-[#B8BE14] text-white border-[#B8BE14] hover:bg-[#a3aa12]'
                      : 'bg-white text-[#6b7280] border-[#d1d5db] hover:border-[#B8BE14] hover:bg-[#B8BE14] hover:text-white'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Selection Section */}
          <div className="mt-6">
            <label className="text-[#374151] font-medium mb-3 block text-sm uppercase tracking-wide">{t("product")}:</label>
            <div className="flex gap-2 flex-wrap">
                {!selectedCategory ? (
                    <p className="text-[#9ca3af] italic text-sm">{t("pleaseChooseCategory") || "Please choose a category..."}</p>
                ) : getFilteredProducts().length === 0 ? (
                    <p className="text-[#9ca3af] italic text-sm">{t("noProductsAvailable") || "No products available"}</p>
                ) : (
                    getFilteredProducts().map((product) => (
                        <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className={`px-3 py-1.5 rounded-md text-sm transition-all duration-300 border ${
                                selectedProduct?.id === product.id
                                    ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] font-medium'
                                    : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#0369a1] hover:text-[#0369a1]'
                            }`}
                        >
                            {product.name}
                        </button>
                    ))
                )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 flex gap-3 max-w-3xl">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder={t("searchPlaceholder") || "Search firmware data..."}
                className="w-full pl-4 pr-4 py-3 bg-white border border-[#d1d5db] rounded-lg text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:border-[#B8BE14] focus:ring-2 focus:ring-[#B8BE14] focus:ring-opacity-20 transition-all duration-300"
              />
            </div>
            <button 
                onClick={() => handleSearch(searchQuery)}
                className="px-6 py-3 bg-[#B8BE14] text-white rounded-lg hover:bg-[#a3aa12] focus:outline-none transition-all duration-300 shadow-md flex items-center justify-center"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* --- Table Section --- */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f9fafb]">
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                                <th className="text-left px-6 py-4 text-[#6b7280] uppercase text-xs font-semibold tracking-wider w-[10%]">
                                    {t("type")}
                                </th>
                                <th className="text-left px-6 py-4 text-[#6b7280] uppercase text-xs font-semibold tracking-wider w-[20%]">
                                    {t("productName")}
                                </th>
                                <th className="text-left px-6 py-4 text-[#6b7280] uppercase text-xs font-semibold tracking-wider w-[30%]">
                                    {t("resourceName") || "Brochure Name"}
                                </th>
                                <th className="text-left px-6 py-4 text-[#6b7280] uppercase text-xs font-semibold tracking-wider w-[15%]">
                                    {t("timeUpdated") || "Size / Update"}
                                </th>
                                <th className="text-center px-6 py-4 text-[#6b7280] uppercase text-xs font-semibold tracking-wider w-[15%]">
                                    {t("action")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb]">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-[#9ca3af]">{t("loading")}</td></tr>
                            ) : resources.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16">
                                        <p className="text-[#9ca3af]">
                                            {searchQuery 
                                                ? t("noSearchResults") 
                                                : !selectedProduct 
                                                    ? t("pleaseChooseProduct") || "Please choose a product..." 
                                                    : t("noData")}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                resources.map((item) => {
                                    const isSoftwareOrFirmware = item.type === 1 || item.type === 2;
                                    const hasMarkdown = item.is_markdown === 1;
                                    return (
                                        <tr key={item.id} className="hover:bg-[#f9fafb] transition-colors">
                                            <td className="px-6 py-4">
                                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#e0f2fe] text-[#0369a1]">
                                                    <FileText className="w-3 h-3" />
                                                    {t(typeConfig[item.type]?.key || "other")}
                                                 </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#1f2937] font-medium">
                                                {item.product_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#4b5563]">
                                                {item.resource_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#6b7280]">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {item.time_updated ? item.time_updated.split(' ')[0] : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleResourceClick(item)}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-[#0369a1] hover:text-[#0284c7] hover:underline transition-all"
                                                >
                                                    {!hasMarkdown && isSoftwareOrFirmware ? t("download") : t("view")}
                                                    {!hasMarkdown && isSoftwareOrFirmware ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {total > 0 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#6b7280] text-sm">
                    <div>
                        {t("showing")} {Math.min((currentPage - 1) * pageSize + 1, total)} - {Math.min(currentPage * pageSize, total)} {t("of")} {total} {t("items")}
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleTableChange(currentPage - 1, pageSize)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-[#d1d5db] rounded hover:bg-white disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="bg-[#B8BE14] text-white px-3 py-1 rounded text-xs">
                            {currentPage}
                        </span>
                        <button 
                             onClick={() => handleTableChange(currentPage + 1, pageSize)}
                             disabled={currentPage >= Math.ceil(total / pageSize)}
                             className="px-3 py-1 border border-[#d1d5db] rounded hover:bg-white disabled:opacity-50"
                        >
                            Next
                        </button>
                        
                        <select 
                             value={pageSize}
                             onChange={(e) => handleTableChange(1, Number(e.target.value))}
                             className="ml-2 border border-[#d1d5db] rounded px-2 py-1 bg-white focus:border-[#0369a1] outline-none"
                        >
                             <option value={10}>10 / Page</option>
                             <option value={20}>20 / Page</option>
                             <option value={50}>50 / Page</option>
                        </select>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e7eb] p-4 text-center bg-white">
          <p className="text-[#9ca3af] text-sm">{t("copyright") || "© 2026 DIGISYNTHETIC. All rights reserved."}</p>
        </div>
      </main>

       {/* --- Modal for Markdown View (保留功能性组件样式) --- */}
       <Modal
            title={`${t('resourceName')}: ${currentResource?.resource_name}`}
            open={isModalOpen}
            onCancel={() => {
                setIsModalOpen(false);
                setCurrentResource(null);
                setCurrentMarkdown("");
            }}
            footer={null}
            width={1200}
            className="top-10"
        >
            {currentResource?.url && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                     <div className="flex items-center justify-between">
                         <span className="text-gray-500 text-sm break-all">{currentResource.url}</span>
                         {currentResource.type === 1 ? (
                             <Button type="primary" onClick={() => window.location.href = currentResource.url}>
                                 {t('download')}
                             </Button>
                         ) : (
                             <a href={currentResource.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                 {t('visitExternalLink')} <ExternalLink className="w-3 h-3"/>
                             </a>
                         )}
                     </div>
                </div>
            )}
            
            {currentResource?.is_markdown === 1 && (
                <div>
                     {currentResource.type !== 1 && (
                         <div className="flex justify-end mb-4">
                              <Button 
                                  type="default" 
                                  icon={<FilePdfOutlined />} 
                                  onClick={handleResquestPdf}
                                  loading={plainPdfLoading}
                              >
                                  {plainPdfLoading ? `${Math.round(plainPdfProgress)}%` : t('downloadPdf')}
                              </Button>
                         </div>
                     )}
                     <div className="prose max-w-none">
                         <MdViewer content={currentMarkdown} />
                     </div>
                </div>
            )}
        </Modal>
    </div>
  );
};

export default Home;