import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { claimCDKey, claimCDKeyHistory, getUserMarkdown } from "../../api/api";
import { message } from "antd";
import { Key, Zap, Download, Info, Shield, BookOpen, Copy, Check, AlertCircle, History, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import MdViewer from "../../components/MdViewer";

const contentTranslations = {
    en: {
        title: "Claim Trial VSC (AES67 Virtual Soundcard)",
        subtitle: "Follow the steps below to agree to the terms, review the installation guide, and claim your trial.",
        termsTitle: "Terms of Service",
        termsPrompt: "Please read and agree to the following terms:",
        term1: "1. License Grant: Digisynthetic grants you a non-exclusive, non-transferable trial license to install and use the Software solely for evaluation purposes.",
        term2: "2. Prohibitions & Restrictions: You shall not plagiarize, copy, modify, distribute, or share cracked versions of the Software. Reverse engineering, decompiling, or disassembling the Software is strictly prohibited.",
        term3: "3. Intellectual Property: All title, ownership rights, and intellectual property rights in and to the Software shall remain the exclusive property of Digisynthetic.",
        term4: "4. Disclaimer of Warranty: The Software is provided 'AS IS' without any warranty, express or implied. Use of the Software is at your own risk.",
        term5: "5. Limitation of Liability: In no event shall Digisynthetic be liable for any direct, indirect, incidental, or consequential damages arising out of the use or inability to use the Software.",
        term6: "6. License Termination: This trial license will terminate automatically at the end of the evaluation period, or immediately if you fail to comply with any terms.",
        agreeTerms: "I agree to the terms and conditions",
        guideTitle: "VSC Installation & User Guide (Windows)",
        claimTitle: "Claim Your Trial",
        claimBtn: "Claim Trial VSC",
        infoText: "The activation code will be shown on screen upon successful claim.",
        agreeError: "Please agree to the terms of service first.",
        claimSuccess: "VSC trial activation code claimed successfully!",
        activationCodeLabel: "Your Activation Code:",
        claimedTitle: "Activation Code Claimed",
        claimedDesc: "You have already claimed a VSC activation code. If you need more, please email kidney@digisynthetic.com",
        copySuccess: "Copied to clipboard!",
        copyFailed: "Failed to copy.",
        mailHint: "Need more codes? Email kidney@digisynthetic.com",
        historyTitle: "Historical Activation Code",
        noHistory: "No activation code records found.",
        step1Label: "Terms",
        step2Label: "User Guide",
        step3Label: "Claim Trial",
        nextBtn: "Next",
        backBtn: "Back"
    },
    zh_CN: {
        title: "申请 VSC 激活码 (AES67 虚拟声卡)",
        subtitle: "按照以下步骤同意条款、查看安装指南并领取您的激活码。",
        termsTitle: "服务条款",
        termsPrompt: "请阅读并同意以下条款：",
        term1: "1. 授权许可：顶力（Digisynthetic）授予您一项非排他性、不可转让的试用许可，允许您仅出于评估目的安装和使用本软件。",
        term2: "2. 禁止与限制：严禁剽窃、复制、修改、分发或共享本软件 of 破解版本。严禁进行逆向工程、反编译或反汇编。",
        term3: "3. 知识产权：本软件的所有权、所有权权益以及知识产权均属于顶力公司，并由其独占保留。",
        term4: "4. 免责声明：本软件按“原样”提供，不提供任何明示或暗示的保证。您需自行承担全部风险。",
        term5: "5. 责任限制：在任何情况下，对于因使用本软件而导致的任何损害，顶力公司均不承担责任。",
        term6: "6. 许可终止：本许可将在评估期结束时自动终止，或者在您违反协议任何条款时立即终止。",
        agreeTerms: "我同意条款和条件",
        guideTitle: "VSC 安装与用户指南 (Windows)",
        claimTitle: "领取试用",
        claimBtn: "领取试用 VSC 激活码",
        infoText: "成功领取后，激活码将显示在下方。",
        agreeError: "请先同意服务条款。",
        claimSuccess: "成功领取 VSC 试用激活码！",
        activationCodeLabel: "您的激活码：",
        claimedTitle: "激活码已领取",
        claimedDesc: "您已领取过 VSC 激活码。如果还需要，请联系 kidney@digisynthetic.com",
        copySuccess: "已复制到剪贴板！",
        copyFailed: "复制失败。",
        mailHint: "还需要？发送邮件至 kidney@digisynthetic.com",
        historyTitle: "历史激活码",
        noHistory: "暂无已领取的激活码记录。",
        step1Label: "服务条款",
        step2Label: "用户指南",
        step3Label: "领取激活码",
        nextBtn: "下一步",
        backBtn: "上一步"
    },
    es_ES: {
        title: "Solicitar Código VSC (Tarjeta de Sonido Virtual AES67)",
        subtitle: "Siga los pasos a continuación para aceptar los términos, revisar la guía de instalación y solicitar su prueba.",
        termsTitle: "Términos de Servicio",
        termsPrompt: "Por favor lea y acepte los siguientes términos:",
        term1: "1. Concesión de Licencia: Digisynthetic le otorga una licencia de prueba no exclusiva y no transferible para instalar y usar el Software únicamente con fines de evaluación.",
        term2: "2. Prohibiciones y Restricciones: No podrá plagiar, copiar, modificar, distribuir ni compartir versiones pirateadas del Software. Queda estrictamente prohibida la ingeniería inversa.",
        term3: "3. Propiedad Intelectual: Todos los títulos, derechos de propiedad y derechos de propiedad intelectual del Software seguirán siendo propiedad exclusiva de Digisynthetic.",
        term4: "4. Exclusión de Garantía: El Software se proporciona 'TAL CUAL', sin ninguna garantía de ningún tipo. El uso del Software es bajo su propio riesgo.",
        term5: "5. Limitación de Responsabilidad: En ningún caso Digisynthetic será responsable de ningún daño que surja del uso o la imposibilidad de usar el Software.",
        term6: "6. Terminación de la Licencia: Esta licencia de prueba terminará automáticamente al final del período de evaluación, o inmediatamente si no cumple con alguno de los términos.",
        agreeTerms: "Acepto los términos y condiciones",
        guideTitle: "Guía de Instalación y de Usuario de VSC (Windows)",
        claimTitle: "Solicitar su Prueba",
        claimBtn: "Solicitar Código VSC",
        infoText: "El código de activación se mostrará en pantalla una vez solicitado con éxito.",
        agreeError: "Por favor, acepte primero los términos de servicio.",
        claimSuccess: "¡Código de activación VSC solicitado con éxito!",
        activationCodeLabel: "Su Código de Activación:",
        claimedTitle: "Código de Activación Ya Solicitado",
        claimedDesc: "Ya ha solicitado un código de activación VSC. Si necesita más, envíe un correo electrónico a kidney@digisynthetic.com",
        copySuccess: "¡Copiado al portapapeles!",
        copyFailed: "Error al copiar.",
        mailHint: "¿Necesita más códigos? Correo electrónico a kidney@digisynthetic.com",
        historyTitle: "Código de Activación Histórico",
        noHistory: "No se encontraron registros de códigos de activación.",
        step1Label: "Términos",
        step2Label: "Guía de Usuario",
        step3Label: "Solicitar Prueba",
        nextBtn: "Siguiente",
        backBtn: "Atrás"
    }
};

const ClaimVsc = () => {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    
    // Choose translation base
    const lang = i18n.language.startsWith("zh")
        ? "zh_CN"
        : i18n.language.startsWith("es")
        ? "es_ES"
        : "en";
        
    const text = contentTranslations[lang];

    const [currentStep, setCurrentStep] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [activationCode, setActivationCode] = useState(() => {
        // Hydrate from localStorage if exists for this user
        if (user?.email) {
            return localStorage.getItem(`vsc_activation_code_${user.email}`) || "";
        }
        return "";
    });
    const [copied, setCopied] = useState(false);
    const [historyCode, setHistoryCode] = useState("");
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyCopied, setHistoryCopied] = useState(false);
    const [isHistoryChecked, setIsHistoryChecked] = useState(false);

    // Guide Markdown loading states
    const [guideMarkdown, setGuideMarkdown] = useState("");
    const [loadingGuide, setLoadingGuide] = useState(false);

    // Terms Markdown loading states
    const [termsMarkdown, setTermsMarkdown] = useState("");
    const [loadingTerms, setLoadingTerms] = useState(false);

    useEffect(() => {
        if (user?.email) {
            const savedCode = localStorage.getItem(`vsc_activation_code_${user.email}`);
            if (savedCode) {
                setActivationCode(savedCode);
            }
        }
        fetchHistory();
    }, [user]);

    // Load guide and terms markdown when language changes
    useEffect(() => {
        const fetchContent = async () => {
            setLoadingGuide(true);
            setLoadingTerms(true);
            try {
                const response = await getUserMarkdown({
                    id: "AZ7aPDOac0mn0fJM4LtWrA",
                    language: i18n.language
                });
                if (response.data.status === 0) {
                    setGuideMarkdown(response.data.data || "");
                }
            } catch (error) {
                console.error("Failed to load VSC guide markdown:", error);
            } finally {
                setLoadingGuide(false);
            }

            try {
                const response = await getUserMarkdown({
                    id: "AZ7etU6XcA6K4uA0B1DEaA",
                    language: i18n.language
                });
                if (response.data.status === 0) {
                    setTermsMarkdown(response.data.data || "");
                }
            } catch (error) {
                console.error("Failed to load VSC terms markdown:", error);
            } finally {
                setLoadingTerms(false);
            }
        };
        fetchContent();
    }, [i18n.language]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await claimCDKeyHistory({ product: "01hdbc9fzgq7sn1" });
            if (response.data.status === 0 && response.data.data) {
                const code = response.data.data;
                setHistoryCode(code);
                setActivationCode(code);
            }
        } catch (error) {
            console.error("Failed to load history code:", error);
        } finally {
            setLoadingHistory(false);
            setIsHistoryChecked(true);
        }
    };

    const handleClaim = async () => {
        if (!agreed) {
            message.warning(text.agreeError);
            return;
        }

        setClaiming(true);
        try {
            const response = await claimCDKey({ 
                product: "01hdbc9fzgq7sn1"
            });
            if (response.data.status === 0) {
                const code = response.data.data || "";
                setActivationCode(code);
                if (user?.email && code) {
                    localStorage.setItem(`vsc_activation_code_${user.email}`, code);
                }
                message.success(text.claimSuccess);
                fetchHistory(); // Refresh history
            }
        } catch (error) {
            console.error("VSC Claim error:", error);
            message.error(error.response?.data?.message || "Failed to claim activation code");
        } finally {
            setClaiming(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(activationCode);
            setCopied(true);
            message.success(text.copySuccess);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            message.error(text.copyFailed);
        }
    };

    const handleCopyHistory = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setHistoryCopied(true);
            message.success(text.copySuccess);
            setTimeout(() => setHistoryCopied(false), 2000);
        } catch (err) {
            message.error(text.copyFailed);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-1 px-1">
            {/* Header */}
            <div className="mb-2.5">
                <h1 className="text-2xl font-bold text-gray-800 mb-0.5 flex items-center gap-2">
                    <Key className="h-6 w-6 text-[#B8BE14]" />
                    {text.title}
                </h1>
                <p className="text-sm text-gray-600">
                    {text.subtitle}
                </p>
            </div>

            {!isHistoryChecked ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-[#B8BE14]" />
                </div>
            ) : !activationCode ? (
                // Wizard flow when user hasn't claimed an activation code yet
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-between max-w-md mx-auto mb-4 bg-white p-3 border border-gray-150 rounded-xl shadow-sm">
                        {[
                            { step: 1, label: text.step1Label },
                            { step: 2, label: text.step2Label },
                            { step: 3, label: text.step3Label }
                        ].map((item, index) => (
                            <React.Fragment key={item.step}>
                                {index > 0 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${currentStep >= item.step ? 'bg-[#B8BE14]' : 'bg-gray-200'}`} />
                                )}
                                <div className="flex flex-col items-center">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                        currentStep === item.step
                                            ? 'bg-[#B8BE14] text-white shadow-md ring-4 ring-[#B8BE14]/20'
                                            : currentStep > item.step
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {currentStep > item.step ? <Check className="w-3.5 h-3.5" /> : item.step}
                                    </div>
                                    <span className={`text-[10px] mt-1 font-medium whitespace-nowrap transition-colors duration-300 ${
                                        currentStep === item.step ? 'text-gray-800' : 'text-gray-400'
                                    }`}>
                                        {item.label}
                                    </span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                        {currentStep === 1 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="h-5 w-5 text-blue-500" />
                                    <h2 className="text-base font-semibold text-gray-800">
                                        {text.termsTitle}
                                    </h2>
                                </div>
                                <div className="border border-gray-150 rounded-xl p-4 max-h-[400px] overflow-y-auto bg-gray-50/50 prose prose-sm max-w-none">
                                    {loadingTerms ? (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 className="w-7 h-7 animate-spin text-[#B8BE14]" />
                                        </div>
                                    ) : (
                                        <MdViewer content={termsMarkdown} />
                                    )}
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer group select-none pt-1">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="rounded border-gray-300 text-[#B8BE14] focus:ring-[#B8BE14] h-4 w-4 transition duration-200"
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition duration-200">
                                        {text.agreeTerms}
                                    </span>
                                </label>
                                <div className="flex justify-end pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        disabled={!agreed}
                                        className="bg-[#B8BE14] hover:bg-[#a3aa12] text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        {text.nextBtn}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <BookOpen className="h-5 w-5 text-blue-500" />
                                    <h2 className="text-base font-semibold text-gray-800">
                                        {text.guideTitle}
                                    </h2>
                                </div>
                                <div className="border border-gray-150 rounded-xl p-4 max-h-[400px] overflow-y-auto bg-gray-50/50 prose prose-sm max-w-none">
                                    {loadingGuide ? (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 className="w-7 h-7 animate-spin text-[#B8BE14]" />
                                        </div>
                                    ) : (
                                        <MdViewer content={guideMarkdown} />
                                    )}
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => setCurrentStep(1)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-1.5 text-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        {text.backBtn}
                                    </button>
                                    <button
                                        onClick={() => setCurrentStep(3)}
                                        className="bg-[#B8BE14] hover:bg-[#a3aa12] text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-1.5 text-sm"
                                    >
                                        {text.nextBtn}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Key className="h-5 w-5 text-[#B8BE14]" />
                                    <h2 className="text-base font-semibold text-gray-800">
                                        {text.claimTitle}
                                    </h2>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-750 border border-gray-150 leading-relaxed">
                                    <p>{text.infoText}</p>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-1.5 text-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        {text.backBtn}
                                    </button>
                                    <button
                                        onClick={handleClaim}
                                        disabled={claiming}
                                        className="bg-[#B8BE14] hover:bg-[#a3aa12] text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 text-sm"
                                    >
                                        <Key className="h-4 w-4" />
                                        {claiming ? "..." : text.claimBtn}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Split layout once the activation code is claimed (2/5 and 3/5 width split)
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch">
                    {/* Left Column: Code Display (takes 2/5 width) */}
                    <div className="lg:col-span-2 flex flex-col gap-3">
                        <div className="bg-white border border-green-200 p-4 rounded-xl shadow-sm flex flex-col justify-between flex-1">
                            <div>
                                <div className="flex items-center gap-2 text-green-600 font-semibold mb-2.5 text-sm">
                                    <Check className="h-5 w-5 bg-green-100 rounded-full p-0.5" />
                                    {text.claimSuccess}
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                            {text.activationCodeLabel}
                                        </span>
                                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                            <code className="font-mono text-sm text-gray-900 flex-1 select-all break-all leading-tight">
                                                {activationCode}
                                            </code>
                                            <button
                                                onClick={handleCopy}
                                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition duration-200"
                                                title="Copy Code"
                                            >
                                                {copied ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-1.5 text-xs text-gray-500 mt-1 bg-blue-50/50 p-2.5 rounded-lg">
                                        <AlertCircle className="text-blue-500 h-4.5 w-4.5 shrink-0" />
                                        <p>{text.mailHint}</p>
                                    </div>
                                </div>
                            </div>

                            {/* History Section */}
                            <div className="mt-4 pt-3 border-t border-gray-150">
                                <h3 className="font-semibold text-gray-800 mb-1.5 text-sm flex items-center gap-1.5">
                                    <History className="h-4 w-4 text-indigo-500" />
                                    {text.historyTitle}
                                </h3>
                                {loadingHistory ? (
                                    <div className="text-xs text-gray-400 py-1.5">Loading...</div>
                                ) : historyCode ? (
                                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                        <code className="font-mono text-xs text-gray-800 flex-1 select-all break-all leading-tight">
                                            {historyCode}
                                        </code>
                                        <button
                                            onClick={() => handleCopyHistory(historyCode)}
                                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition duration-200"
                                            title="Copy Code"
                                        >
                                            {historyCopied ? (
                                                <Check className="h-3.5 w-3.5 text-green-500" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">{text.noHistory}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: User Guide (takes 3/5 width) */}
                    <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <BookOpen className="h-5 w-5 text-blue-500" />
                                <h2 className="text-base font-semibold text-gray-800">
                                    {text.guideTitle}
                                </h2>
                            </div>
                            <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 prose prose-sm max-w-none max-h-[550px] overflow-y-auto">
                                {loadingGuide ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-7 h-7 animate-spin text-[#B8BE14]" />
                                    </div>
                                ) : (
                                    <MdViewer content={guideMarkdown} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaimVsc;
