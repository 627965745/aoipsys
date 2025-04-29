import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Button } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

const MdEditor = ({ content, onChange, onCancel }) => {
    const editorRef = React.useRef();
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const closeButton = document.querySelector('.ant-modal-close-x');
        if (closeButton) {
            closeButton.style.display = isFullscreen ? 'none' : 'block';
        }

        // Cleanup function to ensure the close button is visible when component unmounts
        return () => {
            if (closeButton) {
                closeButton.style.display = 'block';
            }
        };
    }, [isFullscreen]);

    // Reset fullscreen state when modal is closed
    useEffect(() => {
        if (onCancel) {
            const originalOnCancel = onCancel;
            onCancel = () => {
                setIsFullscreen(false);
                originalOnCancel();
            };
        }
    }, [onCancel]);

    const handleChange = () => {
        const markdown = editorRef.current?.getInstance().getMarkdown();
        onChange(markdown);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        if (editorRef.current) {
            const editor = editorRef.current.getInstance();
            editor.setHeight(isFullscreen ? '400px' : 'calc(100vh - 100px)');
        }
    };

    return (
        <div className={`markdown-editor ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="editor-toolbar">
                <Button 
                    type="primary"
                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "退出全屏" : "全屏编辑"}
                >
                    {isFullscreen ? "退出全屏" : "全屏编辑"}
                </Button>
            </div>
            <Editor
                ref={editorRef}
                initialValue={content || ''}
                previewStyle="vertical"
                height="400px"
                initialEditType="markdown"
                useCommandShortcut={true}
                onChange={handleChange}
                toolbarItems={[
                    ['heading', 'bold', 'italic', 'strike'],
                    ['hr', 'quote'],
                    ['ul', 'ol', 'task'],
                    ['table', 'image', 'link'],
                    ['code', 'codeblock'],
                    ['scrollSync']
                ]}
            />
            <style jsx>{`
                .markdown-editor {
                    position: relative;
                }
                .markdown-editor.fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    background: white;
                    padding: 20px;
                }
                .editor-toolbar {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 1;
                }
            `}</style>
        </div>
    );
};

export default MdEditor;
