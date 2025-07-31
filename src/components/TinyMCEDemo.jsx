import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider } from 'antd';
import TinyMCEEditor from './TinyMCEEditor';

const { Title, Text } = Typography;

const TinyMCEDemo = () => {
    const [content, setContent] = useState(`
        <h2>Welcome to TinyMCE Editor with Outlook-like Features!</h2>
        <p>This editor includes all the formatting tools you'd expect from Outlook:</p>
        <ul>
            <li><strong>Font formatting</strong> - Change font family, size, and style</li>
            <li><em>Text styling</em> - Bold, italic, underline, strikethrough</li>
            <li><span style="color: #e74c3c;">Text colors</span> and <span style="background-color: #f1c40f;">highlighting</span></li>
            <li>Lists, tables, and alignment options</li>
            <li>Links, images, and media insertion</li>
        </ul>
        <p>Try editing this content to see all the available features!</p>
    `);

    const [savedContent, setSavedContent] = useState('');

    const handleContentChange = (newContent) => {
        setContent(newContent);
    };

    const handleSave = () => {
        setSavedContent(content);
        console.log('Saved content:', content);
    };

    const handleReset = () => {
        setContent(`
            <h2>Welcome to TinyMCE Editor with Outlook-like Features!</h2>
            <p>This editor includes all the formatting tools you'd expect from Outlook:</p>
            <ul>
                <li><strong>Font formatting</strong> - Change font family, size, and style</li>
                <li><em>Text styling</em> - Bold, italic, underline, strikethrough</li>
                <li><span style="color: #e74c3c;">Text colors</span> and <span style="background-color: #f1c40f;">highlighting</span></li>
                <li>Lists, tables, and alignment options</li>
                <li>Links, images, and media insertion</li>
            </ul>
            <p>Try editing this content to see all the available features!</p>
        `);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={1}>TinyMCE Rich Text Editor Demo</Title>
            <Text type="secondary">
                A comprehensive rich text editor with Outlook-like formatting capabilities
            </Text>
            
            <Divider />
            
            <Card title="Rich Text Editor" style={{ marginBottom: '20px' }}>
                <Space style={{ marginBottom: '16px' }}>
                    <Button type="primary" onClick={handleSave}>
                        Save Content
                    </Button>
                    <Button onClick={handleReset}>
                        Reset to Default
                    </Button>
                </Space>
                
                <TinyMCEEditor
                    content={content}
                    onChange={handleContentChange}
                    height={500}
                    placeholder="Start typing your content here..."
                />
            </Card>

            {savedContent && (
                <Card title="Saved Content Preview" style={{ marginTop: '20px' }}>
                    <div 
                        dangerouslySetInnerHTML={{ __html: savedContent }}
                        style={{ 
                            border: '1px solid #f0f0f0',
                            padding: '16px',
                            borderRadius: '6px',
                            backgroundColor: '#fafafa'
                        }}
                    />
                </Card>
            )}

            <Card title="Available Features" style={{ marginTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div>
                        <Title level={4}>Text Formatting</Title>
                        <ul>
                            <li>Font family selection (Arial, Times New Roman, etc.)</li>
                            <li>Font size control (8pt to 72pt)</li>
                            <li>Bold, italic, underline, strikethrough</li>
                            <li>Subscript and superscript</li>
                            <li>Text color and highlighting</li>
                        </ul>
                    </div>
                    
                    <div>
                        <Title level={4}>Layout & Structure</Title>
                        <ul>
                            <li>Text alignment (left, center, right, justify)</li>
                            <li>Indentation controls</li>
                            <li>Line height adjustment</li>
                            <li>Bulleted and numbered lists</li>
                            <li>Tables with styling options</li>
                        </ul>
                    </div>
                    
                    <div>
                        <Title level={4}>Content & Media</Title>
                        <ul>
                            <li>Link insertion and editing</li>
                            <li>Image upload and insertion</li>
                            <li>Media embedding</li>
                            <li>Emoticons and special characters</li>
                            <li>Date/time insertion</li>
                        </ul>
                    </div>
                    
                    <div>
                        <Title level={4}>Productivity Features</Title>
                        <ul>
                            <li>Auto-save functionality</li>
                            <li>Spell check</li>
                            <li>Find and replace</li>
                            <li>Word count</li>
                            <li>Fullscreen editing mode</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default TinyMCEDemo; 