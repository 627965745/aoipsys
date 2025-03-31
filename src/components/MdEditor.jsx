import React, { useRef } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

const MdEditor = ({ content, onChange }) => {
    const editorRef = React.useRef();

    const handleChange = () => {
        const markdown = editorRef.current?.getInstance().getMarkdown();
        onChange(markdown);
    };

    return (
        <div className="markdown-editor">
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
        </div>
    );
};

export default MdEditor;
