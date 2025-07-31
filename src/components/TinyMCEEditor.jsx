import React, { useState, useRef } from 'react';
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
        height: isFullscreen ? 'calc(100vh - 120px)' : height,
        menubar: true,
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
            'emoticons', 'autosave', 'save', 'directionality', 'nonbreaking',
            'pagebreak', 'quickbars', 'textcolor', 'colorpicker'
        ],
        toolbar: [
            'undo redo | save | formatselect fontselect fontsizeselect',
            'bold italic underline strikethrough | forecolor backcolor | subscript superscript',
            'alignleft aligncenter alignright alignjustify | outdent indent',
            'bullist numlist | table | link image media | emoticons charmap',
            'searchreplace | visualblocks code preview fullscreen help'
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
        font_formats: 'Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings,zapf dingbats',
        fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 36pt 48pt 72pt',
        line_height_formats: '1 1.1 1.2 1.3 1.4 1.5 1.6 1.8 2 2.5 3',
        table_default_attributes: {
            border: '1'
        },
        table_default_styles: {
            borderCollapse: 'collapse'
        },
        image_advtab: true,
        quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
        quickbars_insert_toolbar: 'quickimage quicktable',
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
                if (disabled) {
                    editor.setMode('readonly');
                }
            });
        }
    };

    return (
        <div className={`tinymce-editor-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="editor-controls">
                <Button 
                    type="primary"
                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    size="small"
                >
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </Button>
            </div>
            
            <Editor
                ref={editorRef}
                initialValue={content}
                init={editorConfig}
                onEditorChange={handleEditorChange}
                disabled={disabled}
            />
            
            <style jsx>{`
                .tinymce-editor-wrapper {
                    position: relative;
                    border: 1px solid #d9d9d9;
                    border-radius: 6px;
                    overflow: hidden;
                }
                
                .tinymce-editor-wrapper.fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    background: white;
                    border: none;
                    border-radius: 0;
                }
                
                .editor-controls {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    z-index: 1001;
                }
                
                .tinymce-editor-wrapper :global(.tox-tinymce) {
                    border: none;
                }
                
                .tinymce-editor-wrapper.fullscreen :global(.tox-tinymce) {
                    height: 100vh !important;
                }
                
                .tinymce-editor-wrapper :global(.tox-toolbar-overlord) {
                    padding-right: 100px;
                }
            `}</style>
        </div>
    );
};

export default TinyMCEEditor; 