import { Viewer } from '@toast-ui/react-editor';
import React from 'react';
import '@toast-ui/editor/dist/toastui-editor.css';

const MdViewer = ({ content }) => {
    return (
        <div className="markdown-viewer" key={content}>
            <Viewer 
                initialValue={content || ''} 
                height="500px"
            />
        </div>
    );
};

export default React.memo(MdViewer);
