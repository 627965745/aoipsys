import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Button } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

const TinyMCEEditor = ({ 
    content = '', 
    onChange, 
    onCancel, 
    height = 400,
    placeholder = 'Start typing...',
    disabled = false 
}) => {
    const editorRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [editorInstance, setEditorInstance] = useState(null);

    // Set initial content when editor is ready
    useEffect(() => {
        if (editorInstance && content) {
            if (editorInstance.getContent() === '') {
                editorInstance.setContent(content);
            }
        }
    }, [editorInstance]);

    // Update editor content when prop changes from external source
    useEffect(() => {
        if (editorInstance) {
            const currentContent = editorInstance.getContent();
            if (currentContent !== content && content !== '') {
                // Save cursor position
                const bookmark = editorInstance.selection.getBookmark();
                editorInstance.setContent(content);
                // Restore cursor position
                try {
                    editorInstance.selection.moveToBookmark(bookmark);
                } catch (e) {
                    // If bookmark restoration fails, just focus the editor
                    editorInstance.focus();
                }
            }
        }
    }, [content]);

    const handleEditorChange = (content, editor) => {
        if (onChange) {
            onChange(content);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // TinyMCE configuration with Outlook-like features
    const editorConfig = {
        height: isFullscreen ? 'calc(100vh - 120px)' : (height === "100%" ? '100%' : height),
        menubar: false,
        language: 'zh_CN',
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
            'emoticons', 'autosave', 'save', 'directionality', 'nonbreaking',
            'pagebreak', 'quickbars'
        ],
        toolbar: [
            'undo redo | blocks fontfamily fontsize',
            'bold italic underline strikethrough | forecolor backcolor | table link image media',
            'alignleft aligncenter alignright alignjustify | outdent indent',
            'bullist numlist | subscript superscript | emoticons charmap',
            'searchreplace | visualblocks code'
        ].join(' | '),
        menu: {
            file: { title: 'File', items: 'newdocument restoredraft | preview | export print | deleteallconversations' },
            edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace' },
            view: { title: 'View', items: 'code | visualaid visualchars visualblocks | spellchecker | preview fullscreen' },
            insert: { title: 'Insert', items: 'image link media template codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor | insertdatetime' },
            format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript codeformat | formats blockformats fontformats fontsizes align lineheight | forecolor backcolor | removeformat' },
            tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
            table: { title: 'Table', items: 'inserttable | cell row column | tableprops deletetable' }
        },
        font_formats: 'Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Calibri=calibri,sans-serif; Cambria=cambria,serif; Comic Sans MS=comic sans ms,sans-serif; Consolas=consolas,monaco,monospace; Courier New=courier new,courier,monospace; Georgia=georgia,palatino,serif; Helvetica=helvetica,arial,sans-serif; Impact=impact,chicago,sans-serif; Lucida Console=lucida console,monaco,monospace; Lucida Sans=lucida sans,lucida grande,sans-serif; Microsoft YaHei=microsoft yahei,sans-serif; Palatino=palatino,palatino linotype,serif; Segoe UI=segoe ui,arial,sans-serif; SimSun=simsun,serif; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco,monospace; Times New Roman=times new roman,times,serif; Trebuchet MS=trebuchet ms,geneva,sans-serif; Verdana=verdana,geneva,sans-serif; Webdings=webdings; Wingdings=wingdings,zapf dingbats',
        fontsize_formats: '8px 9px 10px 11px 12px 13px 14px 15px 16px 17px 18px 20px 22px 24px 26px 28px 30px 32px 34px 36px 38px 40px 42px 44px 46px 48px 50px 52px 54px 56px 58px 60px 64px 68px 72px 80px 88px 96px',
        line_height_formats: '1 1.1 1.2 1.3 1.4 1.5 1.6 1.8 2 2.5 3',
        table_default_attributes: {
            border: '1',
            style: 'border-collapse: collapse; border: 1px solid black;'
        },
        table_default_styles: {
            borderCollapse: 'collapse',
            border: '1px solid black'
        },
        table_cell_default_styles: {
            border: '1px solid black',
            padding: '5px'
        },
        image_advtab: true,
        quickbars_selection_toolbar: 'bold italic fontfamily fontsize | quicklink h1 h2 h3',
        quickbars_insert_toolbar: false,
        contextmenu: 'link image table',
        skin: 'oxide',
        content_css: 'default',
        placeholder: placeholder,
        paste_data_images: true,
        paste_as_text: false,
        paste_auto_cleanup_on_paste: true,
        paste_remove_styles: false,
        paste_remove_styles_if_webkit: false,
        autosave_ask_before_unload: true,
        autosave_interval: '30s',
        autosave_prefix: 'tinymce-autosave-{path}{query}-{id}-',
        autosave_restore_when_empty: false,
        autosave_retention: '2m',
        browser_spellcheck: true,
        resize: false,
        branding: false,
        promotion: false,
        setup: (editor) => {
            editor.on('init', () => {
                setEditorInstance(editor);
                if (disabled) {
                    editor.setMode('readonly');
                }
            });
        }
    };

    return (
        <div className={`relative border border-gray-300 rounded-md overflow-hidden h-full ${
            isFullscreen ? 'tinymce-fullscreen' : ''
        }`}>
            <div className="absolute top-3 right-1 z-50">
                <Button 
                    type="primary"
                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "退出全屏" : "全屏编辑"}
                    size="small"
                    className="mr-5"
                >
                    {isFullscreen ? "退出全屏" : "全屏编辑"}
                </Button>
            </div>
            
            <div className="h-full">
                <Editor
                    apiKey="n5tf3rcf536lcxh3jdnjhmlquebrc9dh91skj22kbxwi4cf7"
                    onInit={(evt, editor) => editorRef.current = editor}
                    initialValue=""
                    init={editorConfig}
                    onEditorChange={handleEditorChange}
                    disabled={disabled}
                />
            </div>
            
            <style>{`
                .tox-tinymce {
                    border: none !important;
                    height: 100% !important;
                }
                
                .tox-edit-area__iframe {
                    height: 100% !important;
                }
                
                .tox-toolbar-overlord {
                    padding-right: 100px !important;
                }
                
                .tinymce-fullscreen {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    z-index: 1000 !important;
                    background: white !important;
                    border: none !important;
                    border-radius: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                }
                
                .tinymce-fullscreen .tox-tinymce {
                    height: 100vh !important;
                }
                
                /* Ensure table borders are visible */
                .mce-content-body table {
                    border-collapse: collapse !important;
                    border: 1px solid black !important;
                }
                
                .mce-content-body table td,
                .mce-content-body table th {
                    border: 1px solid black !important;
                    padding: 5px !important;
                }
            `}</style>
        </div>
    );
};

export default TinyMCEEditor; 