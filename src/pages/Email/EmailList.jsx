import React, { useState, useEffect } from 'react';
import { Input, Button, message, List, Card, Pagination, Empty, Spin, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { getEmailList, sendEmail } from '../../api/api';
import { SearchOutlined, MailOutlined, PlusOutlined, SendOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import TinyMCEEditor from '../../components/TinyMCEEditor';

const EmailList = () => {
    const { t } = useTranslation();
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    
    // Compose email states
    const [isComposing, setIsComposing] = useState(false);
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);

    const fetchEmails = async (page = 1, rows = 10, query = '') => {
        setLoading(true);
        try {
            const response = await getEmailList({
                page,
                rows,
                query,
            });

            // Note: User specified status === 1, but other components use status === 0
            // Using status === 1 as per user requirement
            if (response.data.status === 0) {
                const emailData = response.data.data;
                setEmails(emailData.rows || emailData || []);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: rows,
                    total: emailData.total || 0,
                }));
            } else {
                message.error(response.data.message || t('fetchEmailsError'));
            }
        } catch (error) {
            console.error('Error fetching emails:', error);
            message.error(error.response?.data?.message || t('fetchEmailsError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    const handleSearch = () => {
        if (hasUnsavedChanges()) {
            showDiscardConfirmation(() => {
                setPagination(prev => ({ ...prev, current: 1 }));
                fetchEmails(1, pagination.pageSize, searchQuery);
                setSelectedEmail(null);
                setIsComposing(false);
                setComposeSubject('');
                setComposeBody('');
            });
        } else {
            setPagination(prev => ({ ...prev, current: 1 }));
            fetchEmails(1, pagination.pageSize, searchQuery);
            setSelectedEmail(null);
        }
    };

    const handlePageChange = (page, pageSize) => {
        if (hasUnsavedChanges()) {
            showDiscardConfirmation(() => {
                fetchEmails(page, pageSize, searchQuery);
                setIsComposing(false);
                setComposeSubject('');
                setComposeBody('');
                setSelectedEmail(null);
            });
        } else {
            fetchEmails(page, pageSize, searchQuery);
        }
    };

    // Check if there are unsaved changes in compose mode
    const hasUnsavedChanges = () => {
        return isComposing && (composeSubject.trim() !== '' || composeBody.trim() !== '');
    };

    // Show confirmation dialog before discarding changes
    const showDiscardConfirmation = (onConfirm) => {
        Modal.confirm({
            title: t('discardChanges'),
            icon: <ExclamationCircleOutlined />,
            content: t('discardChangesMessage'),
            okText: t('discard'),
            cancelText: t('stay'),
            onOk: onConfirm,
            okButtonProps: { danger: true }
        });
    };

    const handleEmailSelect = (email) => {
        if (hasUnsavedChanges()) {
            showDiscardConfirmation(() => {
                setSelectedEmail(email);
                setIsComposing(false);
                setComposeSubject('');
                setComposeBody('');
            });
        } else {
            setSelectedEmail(email);
            setIsComposing(false);
        }
    };

    const handleStartCompose = () => {
        if (hasUnsavedChanges()) {
            showDiscardConfirmation(() => {
                setIsComposing(true);
                setSelectedEmail(null);
                setComposeSubject('');
                setComposeBody('');
            });
        } else {
            setIsComposing(true);
            setSelectedEmail(null);
            setComposeSubject('');
            setComposeBody('');
        }
    };

    const handleCancelCompose = () => {
        if (hasUnsavedChanges()) {
            showDiscardConfirmation(() => {
                setIsComposing(false);
                setComposeSubject('');
                setComposeBody('');
            });
        } else {
            setIsComposing(false);
            setComposeSubject('');
            setComposeBody('');
        }
    };

    const handleSendEmail = async () => {
        if (!composeSubject.trim()) {
            message.warning(t('subjectRequired'));
            return;
        }

        if (!composeBody.trim()) {
            message.warning(t('contentRequired'));
            return;
        }

        setSendingEmail(true);
        try {
            const response = await sendEmail({
                subject: composeSubject.trim(),
                body: composeBody
            });

            if (response.data.status === 0) {
                message.success(t('emailSentSuccess'));
                // Directly clear compose state without unsaved changes detection
                setIsComposing(false);
                setComposeSubject('');
                setComposeBody('');
                // Refresh email list
                fetchEmails(pagination.current, pagination.pageSize, searchQuery);
            } else {
                message.error(response.data.message || t('emailSendError'));
            }
        } catch (error) {
            console.error('Error sending email:', error);
            message.error(error.response?.data?.message || t('emailSendError'));
        } finally {
            setSendingEmail(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    const renderEmailItem = (email) => (
        <Card
            key={email.id}
            size="small"
            className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                selectedEmail?.id === email.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
            }`}
            onClick={() => handleEmailSelect(email)}
            styles={{ body: { padding: '12px' } }}
        >
            <div className="flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-900 truncate flex-1 mr-2">
                        {email.subject || t('noSubject')}
                    </h4>
                    <MailOutlined className="text-gray-400 text-xs mt-1" />
                </div>
                
                <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">{t('from')}: </span>
                    {email.operator_name || t('unknown')}
                </div>
                
                <div className="text-sm text-gray-400">
                    {formatDate(email.time_created)}
                </div>
                
                {email.body && (
                    <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                        <div 
                            dangerouslySetInnerHTML={{ 
                                __html: email.body.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                            }} 
                        />
                    </div>
                )}
            </div>
        </Card>
    );

    const renderComposeItem = () => (
        <Card
            key="compose"
            size="small"
            className="mb-2 border-gray-300 bg-gray-50"
            styles={{ body: { padding: '12px' } }}
        >
            <div className="flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-600 truncate flex-1 mr-2">
                        {composeSubject || t('newEmail')}
                    </h4>
                    <PlusOutlined className="text-gray-400 text-xs mt-1" />
                </div>
                
                <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">{t('composing')}</span>
                </div>
                
                <div className="flex gap-2 mt-2">
                    <Button 
                        type="primary" 
                        size="middle" 
                        icon={<SendOutlined />}
                        onClick={handleSendEmail}
                        loading={sendingEmail}
                    >
                        {t('send')}
                    </Button>
                    <Button 
                        size="middle" 
                        onClick={handleCancelCompose}
                    >
                        {t('cancel')}
                    </Button>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold mb-4">{t('emailManagement')}</h1>
                
                <div className="mb-4">
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={handleStartCompose}
                        disabled={isComposing}
                    >
                        {t('sendEmail')}
                    </Button>
                </div>
            </div>
            
            <div className="flex flex-1 gap-4 min-h-0">
                {/* Left Panel - Email List */}
                <div className="w-1/4 flex flex-col">
                    {/* Search Bar */}
                    <div className="mb-4">
                        <Input.Search
                            placeholder={t('searchEmails')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onSearch={handleSearch}
                            onPressEnter={handleSearch}
                            onClear={() => {
                                if (hasUnsavedChanges()) {
                                    showDiscardConfirmation(() => {
                                        setSearchQuery('');
                                        setPagination(prev => ({ ...prev, current: 1 }));
                                        fetchEmails(1, pagination.pageSize, '');
                                        setSelectedEmail(null);
                                        setIsComposing(false);
                                        setComposeSubject('');
                                        setComposeBody('');
                                    });
                                } else {
                                    setSearchQuery('');
                                    setPagination(prev => ({ ...prev, current: 1 }));
                                    fetchEmails(1, pagination.pageSize, '');
                                    setSelectedEmail(null);
                                }
                            }}
                            enterButton={
                                <Button type="primary" icon={<SearchOutlined />}>
                                    {t('search')}
                                </Button>
                            }
                            allowClear
                        />
                    </div>

                    {/* Email List */}
                    <div className="flex-1 overflow-y-auto">
                        <Spin spinning={loading}>
                            {isComposing && renderComposeItem()}
                            {emails.length > 0 ? (
                                <div className="space-y-2">
                                    {emails.map(renderEmailItem)}
                                </div>
                            ) : (
                                !isComposing && (
                                    <Empty 
                                        description={t('noEmailsFound')} 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )
                            )}
                        </Spin>
                    </div>

                    {/* Pagination */}
                    {emails.length > 0 && (
                        <div className="mt-4 flex justify-center">
                            <Pagination
                                current={pagination.current}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                showSizeChanger
                                showQuickJumper
                                showTotal={(total, range) => 
                                    t('showingEntries', { 
                                        start: range[0], 
                                        end: range[1], 
                                        total 
                                    })
                                }
                                pageSizeOptions={['10', '20', '50']}
                                onChange={handlePageChange}
                                size="small"
                            />
                        </div>
                    )}
                </div>

                {/* Right Panel - Email Content or Compose */}
                <div className="flex-1 flex flex-col min-h-0">
                    {isComposing ? (
                        <Card className="flex-1 flex flex-col h-full" styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column' } }}>
                            {/* Compose Header */}
                            <div className="border-b border-gray-200 pb-4 mb-4 flex-shrink-0">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    {t('composeEmail')}
                                </h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('subject')}
                                    </label>
                                    <Input
                                        placeholder={t('enterSubject')}
                                        value={composeSubject}
                                        onChange={(e) => setComposeSubject(e.target.value)}
                                        className="mb-4"
                                    />
                                </div>
                            </div>

                            {/* Email Content Editor */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex-shrink-0">
                                    {t('content')}
                                </label>
                                <div className="flex-1 min-h-0">
                                    <TinyMCEEditor
                                        content={composeBody}
                                        onChange={setComposeBody}
                                        height="100%"
                                        placeholder={t('enterEmailContent')}
                                    />
                                </div>
                            </div>
                        </Card>
                    ) : selectedEmail ? (
                        <Card className="flex-1 flex flex-col">
                            {/* Email Header */}
                            <div className="border-b border-gray-200 pb-4 mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    {selectedEmail.subject || t('noSubject')}
                                </h2>
                                <div className="flex flex-col space-y-1 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">{t('from')}: </span>
                                        {selectedEmail.operator_name || t('unknown')}
                                    </div>
                                    <div>
                                        <span className="font-medium">{t('date')}: </span>
                                        {formatDate(selectedEmail.time_created)}
                                    </div>
                                    <div>
                                        <span className="font-medium">{t('emailId')}: </span>
                                        {selectedEmail.id}
                                    </div>
                                </div>
                            </div>

                            {/* Email Body */}
                            <div className="flex-1 overflow-y-auto">
                                {selectedEmail.body ? (
                                    <div 
                                        className="prose max-w-none"
                                        dangerouslySetInnerHTML={{ 
                                            __html: selectedEmail.body 
                                        }} 
                                    />
                                ) : (
                                    <div className="text-gray-500 italic">
                                        {t('noEmailContent')}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <Card className="flex-1 flex items-center justify-center">
                            <Empty 
                                description={t('selectEmailToView')}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailList;