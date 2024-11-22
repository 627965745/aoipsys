import { useEffect, useRef, useState } from "react";
import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";

function MdEdit() {
    const [markdownContent, setMarkdownContent] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const editorRef = useRef(null);

    const formatHTML = (html) => {
        let formatted = html;
        formatted = formatted.replace(/>/g, ">\n");
        formatted = formatted.replace(/<(?!\/)/g, "\n<");
        formatted = formatted.replace(/\n\s*\n/g, "\n");
        let indent = 0;
        return formatted
            .split("\n")
            .map((line) => {
                if (line.match(/<\//)) indent -= 2;
                const spaces = " ".repeat(Math.max(0, indent));
                if (line.match(/<[^/]/) && !line.match(/\/>/)) indent += 2;
                return spaces + line;
            })
            .join("\n");
    };

    const handleChange = () => {
        // Get markdown content
        const markdown = editorRef.current?.getInstance().getMarkdown();
        // Get HTML content
        const html = editorRef.current?.getInstance().getHTML();

        setMarkdownContent(markdown);
        setHtmlContent(html);
    };

    return (
        <div>
            <Editor
                ref={editorRef}
                initialValue={markdownContent}
                previewStyle="vertical"
                height="500px"
                onChange={handleChange}
            />

            {/* Optional: Display stored content */}
            <div className="mt-4">
                {/* <h3>Stored Markdown:</h3>
        <pre>{markdownContent}</pre> */}

                <h3>Stored HTML:</h3>
                <pre
                    style={{
                        backgroundColor: "#ffffff",
                        padding: "1rem",
                        borderRadius: "4px",
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {formatHTML(htmlContent)}
                </pre>
            </div>
        </div>
    );
}

export default MdEdit;
