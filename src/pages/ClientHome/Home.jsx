import React, { useState, useEffect, useRef } from "react";
import { message, Modal, Button, Switch, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import {
    getResourceCondition,
    getResource,
    getUserMarkdown,
    logout,
    getLanguageCombo,
    getUserInfo,
    subscribeEmail,
    chatBot,
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
    Zap,
    Loader2,
    MessageSquare,
} from "lucide-react";
import { ExclamationCircleOutlined, FilePdfOutlined, FileMarkdownOutlined } from "@ant-design/icons";
import MdViewer from "../../components/MdViewer"; // 假设路径一致
import ClaimVsc from "./ClaimVsc";
import qs from "qs";

const isMarkdown = (text) => {
    if (!text) return false;
    const mdPatterns = [
        /(?:^|\n)#{1,6}\s+/,         // headers
        /(?:^|\n)[-*+]\s+/,          // unordered lists
        /(?:^|\n)\d+\.\s+/,          // ordered lists
        /\*\*[^*]+\*\*/,             // bold
        /\*[^*]+\*/,                 // italic
        /`[^`]+`/,                   // inline code
        /```/,                       // code block
        /\[([^\]]+)\]\(([^)]+)\)/    // links
    ];
    return mdPatterns.some(pattern => pattern.test(text));
};

// 简单的 SVG Logo 组件，替代原来的图片
const Logo = () => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 bg-[#B8BE14] rounded-lg flex items-center justify-center shadow-md">
            <Zap className="text-white w-6 h-6" fill="currentColor" />
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
    const [loadingResourceId, setLoadingResourceId] = useState(null);
    const [plainPdfLoading, setPlainPdfLoading] = useState(false);
    const [plainPdfProgress, setPlainPdfProgress] = useState(0);

    // --- 布局 & 用户状态 ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState("resources-docs");
    const [languages, setLanguages] = useState([]);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const languageMenuRef = useRef(null);
    const userMenuRef = useRef(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);

    // --- Chatbot States ---
    const [chatOpen, setChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [chatSession, setChatSession] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatSlowRequest, setChatSlowRequest] = useState(false);
    const [chatDimensions, setChatDimensions] = useState({ width: 480, height: 450 });
    const [chatResized, setChatResized] = useState(false);
    const chatRef = useRef(null);
    const messagesEndRef = useRef(null);
    const chatInputRef = useRef(null);
    const isResizingRef = useRef(false);

    const handleResizeMouseDown = (e) => {
        e.preventDefault();
        isResizingRef.current = true;
        setChatResized(true);

        const rect = chatRef.current?.querySelector(".floating-chat-window")?.getBoundingClientRect();
        const bodyRect = chatRef.current?.querySelector(".chat-messages-body")?.getBoundingClientRect();
        
        const startWidth = rect ? rect.width : chatDimensions.width;
        const startHeight = bodyRect ? bodyRect.height : chatDimensions.height;
        const startX = e.clientX;
        const startY = e.clientY;

        const handleMouseMove = (moveEvent) => {
            if (!isResizingRef.current) return;
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            const newWidth = Math.max(340, Math.min(800, startWidth + deltaX));
            const newHeight = Math.max(250, Math.min(700, startHeight + deltaY));
            setChatDimensions({
                width: newWidth,
                height: newHeight
            });
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleSendChatMessage = async () => {
        const text = chatInput.trim();
        if (!text || chatLoading) return;

        // Add user message
        const newMessages = [...chatMessages, { sender: "user", text }];
        setChatMessages(newMessages);
        setChatInput("");
        setChatLoading(true);
        setChatSlowRequest(false);

        // Auto-scroll to bottom after setting user message
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);

        let slowTimer = setTimeout(() => {
            setChatSlowRequest(true);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        }, 30000);

        try {
            // Call API with 60s timeout
            const response = await chatBot(
                {
                    session: chatSession || "",
                    message: text,
                    language: i18n.language,
                },
                {
                    timeout: 60000,
                }
            );

            if (response.data.status === 0) {
                const { session, message: botReply } = response.data.data || response.data || {};
                
                if (session) {
                    setChatSession(session);
                }

                setChatMessages((prev) => [
                    ...prev,
                    { sender: "bot", text: botReply || "" },
                ]);
            } else {
                setChatMessages((prev) => [
                    ...prev,
                    {
                        sender: "bot",
                        text: response.data.message || t("chatTimeout") || "Request timed out. Please try again later.",
                        isError: true,
                    },
                ]);
            }
        } catch (error) {
            console.error("ChatBot error:", error);
            setChatMessages((prev) => [
                ...prev,
                {
                    sender: "bot",
                    text: t("chatTimeout") || "Request timed out. Please try again later.",
                    isError: true,
                },
            ]);
        } finally {
            clearTimeout(slowTimer);
            setChatLoading(false);
            setChatSlowRequest(false);
            // Auto-scroll to bottom after loader goes away
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        }
    };

    const handleClearChat = () => {
        setChatMessages([]);
        setChatSession("");
    };

    useEffect(() => {
        if (chatOpen) {
            setTimeout(() => {
                chatInputRef.current?.focus();
            }, 100);
        }
    }, [chatOpen]);

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
                setShowLanguageDropdown(false);
            }
            if (chatRef.current && !chatRef.current.contains(event.target)) {
                setChatOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // --- Data Fetching Functions ---
    const fetchConditions = async () => {
        try {
            const response = await getResourceCondition({
                language: i18n.language,
            });
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
            message.error(
                error.response?.data?.message || t("fetchResourcesError")
            );
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
            message.error(
                error.response?.data?.message || t("fetchResourcesError")
            );
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
        setSelectedCategory(
            selectedCategory?.id === category.id ? null : category
        );
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
        setShowUserMenu(false);
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
            const response = await subscribeEmail({
                is_subscribed: checked ? 1 : 0,
            });
            if (response.data?.status === 0) {
                setIsSubscribed(checked);
                message.success(
                    checked
                        ? t("subscriptionEnabled")
                        : t("subscriptionDisabled")
                );
            }
        } catch (error) {
            message.error(t("subscriptionUpdateError"));
        } finally {
            setSubscriptionLoading(false);
        }
    };

    // --- Resource Interaction Handlers (Download/View) ---
    const handleResourceClick = async (record) => {
        if (loadingResourceId) return; // 防止重复点击
        
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
        } else {
            setCurrentResource(record);
            await fetchMarkdownData(record.id);
        }
    };

    const fetchMarkdownData = async (resourceId) => {
        setLoadingResourceId(resourceId);
        setIsModalOpen(false); // 先关闭防止闪烁
        try {
            const response = await getUserMarkdown({
                id: resourceId,
                language: i18n.language,
            });
            if (response.data.status === 0) {
                setCurrentMarkdown(response.data.data || "");
                
            } else {
                message.error(response.data.message || t("fetchMarkdownError"));
            }
        } catch (error) {
            message.error(t("fetchMarkdownError"));
        } finally {
            setLoadingResourceId(null);
			setIsModalOpen(true);
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

    const handleDownloadMarkdown = () => {
        if (!currentMarkdown || !currentResource?.resource_name) return;

        try {
            const blob = new Blob([currentMarkdown], { type: "text/markdown;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const dateString = formatDateForFilename(currentResource.time_updated);
            link.download = `${currentResource.resource_name}${dateString}.md`;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            message.success(t("mdDownloadSuccess"));
        } catch (error) {
            console.error("Markdown download error:", error);
            message.error(t("mdDownloadError"));
        }
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

    // --- Helpers ---
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

    const typeConfig = {
        0: { key: "document" },
        1: { key: "software" },
        2: { key: "firmware" },
        3: { key: "other" },
    };

    const getCurrentLanguageLabel = () => {
        const lang = languages.find((l) => l.id === i18n.language);
        return lang ? lang.name : "Language";
    };

    return (
        <div className="h-screen flex bg-[#f5f7fa] font-sans relative overflow-hidden">
            {/* --- Mobile Overlay --- */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* --- Left Sidebar (Figma Style) --- */}
            <aside
                className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white border-r border-[#e5e7eb] flex flex-col shadow-lg lg:shadow-sm
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden absolute top-4 right-4 p-2 text-[#6b7280] hover:bg-[#f3f4f6] rounded-lg"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Logo */}
                <div className="px-6 py-3 border-b border-[#e5e7eb] flex items-center h-[75px]">
                    <Logo />
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 space-y-4 overflow-y-auto">

                    {/* Category List */}
                    <div className="space-y-1">
                        <label className="text-[#374151] font-semibold mb-2 block text-xs uppercase tracking-wider px-4">
                            {t("category") || "分类"}
                        </label>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        setActiveMenu("resources-docs");
                                        handleCategoryClick(category);
                                        setSidebarOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                                        activeMenu === "resources-docs" && selectedCategory?.id === category.id
                                            ? "bg-[#645D21] text-white font-medium shadow-sm"
                                            : category.highlighted === 1
                                            ? "bg-[#B8BE14]/15 text-[#645D21] hover:bg-[#B8BE14]/25 font-medium"
                                            : "text-[#4b5563] hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Bottom Activation Code Button */}
                <div className="p-4 border-t border-[#e5e7eb]">
                    <button
                        onClick={() => {
                            setActiveMenu("claim-vsc");
                            setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-semibold border ${
                            activeMenu === "claim-vsc"
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md hover:bg-indigo-700"
                                : "bg-indigo-50/60 text-indigo-600 border-indigo-100 hover:bg-indigo-100/80 hover:text-indigo-700"
                        }`}
                    >
                        <Zap className="h-4.5 w-4.5" />
                        <span>{t("claimTrialVsc") || "申请 VSC 激活码"}</span>
                    </button>
                </div>
            </aside>

            {/* --- Main Content --- */}
            <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
                <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white shadow-sm">
                    <div className="flex w-full items-center justify-between gap-3 px-4 py-3 relative">
                        <div className="flex-1 flex items-center justify-start gap-3">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden rounded-lg border border-[#d1d5db] bg-white p-2 text-[#1f2937] shadow-sm transition hover:border-[#0369a1]"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Centered Chatbot Wrapper - Responsive Flexbox */}
                        <div ref={chatRef} className="flex-initial z-50 w-auto sm:w-full max-w-[40px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[300px] xl:max-w-[360px] mx-2">
                            {/* Style block for shimmer & breathing glow */}
                            <style>{`
                                @keyframes shimmer-sweep {
                                    0% { transform: translateX(-150%) skewX(-15deg); }
                                    90%, 100% { transform: translateX(300%) skewX(-15deg); }
                                }
                                @keyframes glow-breath {
                                    0%, 100% { 
                                        box-shadow: 0 0 12px rgba(184, 190, 20, 0.25), 0 0 0 1px rgba(184, 190, 20, 0.1);
                                        border-color: rgba(184, 190, 20, 0.8);
                                    }
                                    50% { 
                                        box-shadow: 0 0 22px rgba(184, 190, 20, 0.55), 0 0 0 3px rgba(184, 190, 20, 0.25);
                                        border-color: rgba(184, 190, 20, 1);
                                    }
                                }
                            `}</style>

                            <div className="lg:relative">
                                {/* Trigger Bar */}
                                <div
                                    onClick={() => setChatOpen((prev) => !prev)}
                                    className="flex items-center justify-center sm:justify-start gap-2.5 rounded-full border-2 border-transparent w-10 h-10 sm:w-full sm:h-auto px-0 sm:px-4 py-0 sm:py-[7px] cursor-pointer select-none transition-all duration-300 bg-white hover:bg-gray-50/50 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden animate-[glow-breath_4s_infinite]"
                                >
                                    {/* Shimmer sweep effect */}
                                    <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-[#B8BE14]/20 to-transparent -skew-x-12 -translate-x-full animate-[shimmer-sweep_3.5s_infinite] pointer-events-none"></div>

                                    <MessageSquare className="h-4.5 w-4.5 text-[#B8BE14] shrink-0" />
                                    <span className="hidden sm:block text-sm text-gray-500 font-medium truncate w-full select-none text-left">
                                        {t("chatPlaceholder") || "Chat with our advanced AI Agent..."}
                                    </span>
                                </div>

                                {/* Floating Chat Window */}
                                <div
                                    style={chatResized ? { width: `${chatDimensions.width}px` } : undefined}
                                    className={`floating-chat-window absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[calc(100vw-2rem)] md:w-[480px] max-w-[400px] md:max-w-[calc(100vw-2rem)] bg-white border border-[#e5e7eb] rounded-2xl shadow-xl overflow-hidden z-50 transition-[opacity,transform] duration-300 origin-top ${
                                        chatOpen
                                            ? "opacity-100 scale-y-100 translate-y-0"
                                            : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
                                    }`}
                                >
                                    {/* Chat Header */}
                                    <div className="bg-gradient-to-r from-[#B8BE14] to-[#a3aa12] px-4 py-3 text-white flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                                                AI
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-sm font-semibold leading-tight">{t("chatTitle") || "AI Assistant"}</h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {chatMessages.length > 0 && (
                                                <button
                                                    onClick={handleClearChat}
                                                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white transition font-medium"
                                                    title={t("chatClear") || "Clear Chat"}
                                                >
                                                    {t("chatClear") || "Clear Chat"}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setChatOpen(false)}
                                                className="p-1 rounded hover:bg-white/10 text-white transition"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Messages Body */}
                                    <div
                                        style={chatResized ? { height: `${chatDimensions.height}px` } : undefined}
                                        className="chat-messages-body overflow-y-auto p-4 bg-gray-50/50 space-y-3 flex flex-col scrollbar-thin h-[300px] sm:h-[400px] md:h-[450px]"
                                    >
                                        {chatMessages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                                                <div className="w-12 h-12 rounded-2xl bg-[#B8BE14]/15 flex items-center justify-center mb-3 text-[#B8BE14]">
                                                    <MessageSquare className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-600 mb-1">
                                                    {t("chatTitle") || "AI Assistant"}
                                                </p>
                                                <p className="text-xs max-w-[200px]">
                                                    {t("chatWelcomeDesc") || "Is there anything you would like to ask about our products?"}
                                                </p>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm text-left ${
                                                            msg.sender === "user"
                                                                ? "bg-[#B8BE14] text-white rounded-tr-none"
                                                                : msg.isError
                                                                ? "bg-red-50 text-red-700 border border-red-100 rounded-tl-none"
                                                                : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                                                        }`}
                                                    >
                                                        {msg.sender === "bot" && !msg.isError && isMarkdown(msg.text) ? (
                                                            <MdViewer content={msg.text} />
                                                        ) : (
                                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {/* Loading spinner for pending response */}
                                        {chatLoading && (
                                            <div className="flex flex-col gap-2 justify-start items-start">
                                                <div className="max-w-[85%] bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm shadow-sm flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 text-[#B8BE14] animate-spin" />
                                                    <span>{t("chatProcessing") || "Processing your message..."}</span>
                                                </div>
                                                {chatSlowRequest && (
                                                    <div className="max-w-[85%] bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl rounded-tl-none px-4 py-2 text-xs shadow-sm text-left animate-fade-in">
                                                        <span>{t("chatSlowRequest") || "Still processing your message, please wait a moment..."}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Bottom Input Area inside Dropdown */}
                                    <div className="p-3 bg-white border-t border-[#e5e7eb] flex items-center gap-2 relative">
                                        <input
                                            ref={chatInputRef}
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                                    handleSendChatMessage();
                                                }
                                            }}
                                            placeholder={t("chatPlaceholder") || "tell me what you are looking for"}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#B8BE14] focus:bg-white transition-all p-2"
                                        />
                                        <button
                                            onClick={handleSendChatMessage}
                                            disabled={!chatInput.trim() || chatLoading}
                                            className="bg-[#B8BE14] hover:bg-[#a3aa12] disabled:opacity-50 disabled:hover:bg-[#B8BE14] text-white rounded-xl px-3.5 py-1.5 text-sm font-medium transition flex items-center gap-1 shrink-0"
                                        >
                                            <span>{t("chatSend") || "Send"}</span>
                                        </button>
                                    </div>

                                    {/* Resize Handle */}
                                    <div
                                        onMouseDown={handleResizeMouseDown}
                                        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-50 select-none group"
                                    >
                                        <svg
                                            className="w-2.5 h-2.5 text-gray-400 group-hover:text-[#B8BE14] transition"
                                            viewBox="0 0 6 6"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <line x1="5" y1="1" x2="1" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                                            <line x1="5" y1="3" x2="3" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-end gap-3 shrink-0">
                            <div ref={languageMenuRef} className="relative">
                                <button
                                    onClick={() =>
                                        setShowLanguageDropdown((prev) => !prev)
                                    }
                                    className="flex items-center gap-2 rounded-full border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#1f2937] shadow-sm transition hover:border-[#0369a1]"
                                >
                                    <Globe className="h-4 w-4 text-[#0369a1]" />
                                    <span>{getCurrentLanguageLabel()}</span>
                                    <ChevronDown
                                        className={`h-4 w-4 text-[#0369a1] transition-transform ${
                                            showLanguageDropdown ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>
                                {showLanguageDropdown && (
                                    <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-xl">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.id}
                                                onClick={() => {
                                                    i18n.changeLanguage(lang.id);
                                                    setShowLanguageDropdown(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                                                    i18n.language === lang.id
                                                        ? "bg-[#e0f2fe] text-[#0369a1]"
                                                        : "text-[#1f2937] hover:bg-[#f3f4f6]"
                                                }`}
                                            >
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {user ? (
                                <div ref={userMenuRef} className="relative">
                                    <button
                                        onClick={() =>
                                            setShowUserMenu((prev) => !prev)
                                        }
                                        className="flex items-center gap-2 rounded-full border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#1f2937] shadow-sm transition hover:border-[#0369a1]"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B8BE14] text-xs font-bold uppercase text-white">
                                            {user.name
                                                ? user.name.slice(0, 2)
                                                : "U"}
                                        </div>
                                        <span className="whitespace-nowrap">
                                            {user.name || "User"}
                                        </span>
                                        <ChevronDown
                                            className={`h-4 w-4 text-[#0369a1] transition-transform ${
                                                showUserMenu ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                    {showUserMenu && (
                                        <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl">
                                            <div className="flex items-center gap-3 border-b border-[#f3f4f6] pb-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B8BE14] text-sm font-semibold text-white uppercase">
                                                    {user.name
                                                        ? user.name
                                                              .slice(0, 2)
                                                              .toUpperCase()
                                                        : "U"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#1f2937]">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-[#6b7280]">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                <div className="flex items-center justify-between rounded-xl bg-[#f9fafb] px-3 py-2">
                                                    <span className="text-sm text-[#374151]">
                                                        {t("subscribeToEmails")}
                                                    </span>
                                                    <Switch
                                                        size="small"
                                                        checked={isSubscribed}
                                                        loading={subscriptionLoading}
                                                        onChange={
                                                            handleSubscriptionToggle
                                                        }
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        navigate(
                                                            "/reset-password?source=client"
                                                        );
                                                    }}
                                                    className="w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#1f2937] transition hover:border-[#0369a1]"
                                                >
                                                    {t("changePassword")}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        handleLogout();
                                                    }}
                                                    className="w-full rounded-xl border border-[#fee2e2] bg-white px-3 py-2 text-sm text-[#dc2626] transition hover:bg-[#fee2e2]"
                                                >
                                                    {t("logout")}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate("/login")}
                                    className="rounded-full border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#1f2937] shadow-sm transition hover:border-[#0369a1]"
                                >
                                    {t("login")}
                                </button>
                            )}
                        </div>
                    </div>
                </header>
                {/* --- Top Header Section --- */}
                {activeMenu === "resources-docs" && (
                    <div className="p-4 sm:p-6 border-b border-[#e5e7eb] bg-white">
                    <div className="flex flex-col gap-6">
                        <div className="flex-1">
                            <h1 className="text-[#1f2937] text-xl font-semibold mb-1 flex items-center gap-2">
                                {t("resourcesDocs")}
                                {selectedCategory && (
                                    <>
                                        <ChevronRight className="h-4 w-4 text-[#9ca3af]" />
                                        <span className="text-[#0369a1]">
                                            {selectedCategory.name}
                                        </span>
                                    </>
                                )}
                                {selectedProduct && (
                                    <>
                                        <ChevronRight className="h-4 w-4 text-[#9ca3af]" />
                                        <span className="text-[#6b7280] text-base font-normal">
                                            {selectedProduct.name}
                                        </span>
                                    </>
                                )}
                            </h1>


                            {/* Product Selection Section */}
                            <div className="mt-6">
                                <label className="text-[#374151] font-medium mb-3 block text-sm uppercase tracking-wide">
                                    {t("product")}:
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {!selectedCategory ? (
                                        <p className="text-[#9ca3af] italic text-sm">
                                            {t("pleaseChooseCategory") ||
                                                "Please choose a category..."}
                                        </p>
                                    ) : getFilteredProducts().length === 0 ? (
                                        <p className="text-[#9ca3af] italic text-sm">
                                            {t("noProductsAvailable") ||
                                                "No products available"}
                                        </p>
                                    ) : (
                                        getFilteredProducts().map((product) => (
                                            <button
                                                key={product.id}
                                                onClick={() =>
                                                    handleProductClick(product)
                                                }
                                                className={`px-3 py-1.5 rounded-md text-sm transition-all duration-300 border ${
                                                    selectedProduct?.id === product.id
                                                        ? "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] font-medium"
                                                        : "bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#0369a1] hover:text-[#0369a1]"
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
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            handleSearch(searchQuery)
                                        }
                                        placeholder={
                                            t("searchPlaceholder") ||
                                            "Search firmware data..."
                                        }
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

                    </div>
                </div>
                )}

                {/* --- Table Section --- */}
                {activeMenu === "resources-docs" && (
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
                                            {t("resourceName") ||
                                                "Brochure Name"}
                                        </th>
                                        <th className="text-left px-6 py-4 text-[#6b7280] uppercase text-xs font-semibold tracking-wider w-[15%]">
                                            {t("timeUpdated") ||
                                                "Size / Update"}
                                        </th>
                                        <th className="text-center px-6 py-4 text-[#6b7280] uppercase text-xs font-semibold tracking-wider w-[15%]">
                                            {t("action")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb]">
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-16 text-center text-[#9ca3af]"
                                            >
                                                {t("loading")}
                                            </td>
                                        </tr>
                                    ) : resources.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="text-center py-16"
                                            >
                                                <p className="text-[#9ca3af]">
                                                    {searchQuery
                                                        ? t("noSearchResults")
                                                        : !selectedProduct
                                                        ? t(
                                                              "pleaseChooseProduct"
                                                          ) ||
                                                          "Please choose a product..."
                                                        : t("noData")}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        resources.map((item) => {
                                            const isSoftwareOrFirmware =
                                                item.type === 1 ||
                                                item.type === 2;
                                            const hasMarkdown =
                                                item.is_markdown === 1;
                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-[#f9fafb] transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#e0f2fe] text-[#0369a1]">
                                                            <FileText className="w-3 h-3" />
                                                            {t(
                                                                typeConfig[
                                                                    item.type
                                                                ]?.key ||
                                                                    "other"
                                                            )}
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
                                                            {item.time_updated
                                                                ? item.time_updated.split(
                                                                      " "
                                                                  )[0]
                                                                : "-"}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() =>
                                                                handleResourceClick(
                                                                    item
                                                                )
                                                            }
                                                            disabled={!!loadingResourceId}
                                                            className={`inline-flex items-center gap-1 text-sm font-medium transition-all ${
                                                                loadingResourceId
                                                                    ? "text-gray-400 cursor-not-allowed"
                                                                    : "text-[#0369a1] hover:text-[#0284c7] hover:underline"
                                                            }`}
                                                        >
                                                            {loadingResourceId === item.id ? (
                                                                <>
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    {t("loading")}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {!hasMarkdown &&
                                                                    isSoftwareOrFirmware
                                                                        ? t("download")
                                                                        : t("view")}
                                                                    {!hasMarkdown &&
                                                                    isSoftwareOrFirmware ? (
                                                                        <Download className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                    )}
                                                                </>
                                                            )}
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
                                {t("showing")}{" "}
                                {Math.min(
                                    (currentPage - 1) * pageSize + 1,
                                    total
                                )}{" "}
                                - {Math.min(currentPage * pageSize, total)}{" "}
                                {t("of")} {total} {t("items")}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        handleTableChange(
                                            currentPage - 1,
                                            pageSize
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-[#d1d5db] rounded hover:bg-white disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="bg-[#B8BE14] text-white px-3 py-1 rounded text-xs">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() =>
                                        handleTableChange(
                                            currentPage + 1,
                                            pageSize
                                        )
                                    }
                                    disabled={
                                        currentPage >=
                                        Math.ceil(total / pageSize)
                                    }
                                    className="px-3 py-1 border border-[#d1d5db] rounded hover:bg-white disabled:opacity-50"
                                >
                                    Next
                                </button>

                                <select
                                    value={pageSize}
                                    onChange={(e) =>
                                        handleTableChange(
                                            1,
                                            Number(e.target.value)
                                        )
                                    }
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
                )}

                {activeMenu === "claim-vsc" && (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f9fafb]">
                        <ClaimVsc />
                    </div>
                )}

                {/* Footer */}
                <div className="border-t border-[#e5e7eb] p-4 text-center bg-white">
                    <p className="text-[#9ca3af] text-sm">
                        {t("copyright") ||
                            "© 2026 DIGISYNTHETIC. All rights reserved."}
                    </p>
                </div>
            </main>

            {/* --- Modal for Markdown View (保留功能性组件样式) --- */}
            <Modal
                title={`${t("resourceName")}: ${
                    currentResource?.resource_name
                }`}
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
                            <span className="text-gray-500 text-sm break-all">
                                {currentResource.url}
                            </span>
                            {currentResource.type === 1 ? (
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        (window.location.href =
                                            currentResource.url)
                                    }
                                >
                                    {t("download")}
                                </Button>
                            ) : (
                                <a
                                    href={currentResource.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {t("visitExternalLink")}{" "}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {currentResource?.is_markdown === 1 && (
                    <div>
                        {currentResource.type !== 1 && (
                            <div className="flex justify-end gap-3 mb-4">
                                <Button
                                    type="default"
                                    icon={<FileMarkdownOutlined />}
                                    onClick={handleDownloadMarkdown}
                                >
                                    {t("downloadMarkdown")}
                                </Button>
                                <Button
                                    type="default"
                                    icon={<FilePdfOutlined />}
                                    onClick={handleResquestPdf}
                                    loading={plainPdfLoading}
                                >
                                    {plainPdfLoading
                                        ? `${Math.round(plainPdfProgress)}%`
                                        : t("downloadPdf")}
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
