import { useEffect, useRef } from "preact/hooks";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { monaco } from "../monaco";

interface CodeEditorProps {
    yText: Y.Text;
    language?: string;
    readOnly?: boolean;
}

export function CodeEditor({
    yText,
    language = "cpp",
    readOnly = false,
}: CodeEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const modelRef = useRef<monaco.editor.ITextModel | null>(null);

    // Create Monaco and bind to Yjs
    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const model = monaco.editor.createModel(
            "",
            language,
        );

        const editor = monaco.editor.create(
            containerRef.current,
            {
                model,
                theme: "vs-dark",
                automaticLayout: true,
                fontSize: 14,
                lineHeight: 22,
                tabSize: 4,
                insertSpaces: true,
                minimap: {
                    enabled: false,
                },
                scrollBeyondLastLine: false,
                wordWrap: "off",
                readOnly,
                padding: {
                    top: 12,
                },
            },
        );

        const binding = new MonacoBinding(
            yText,
            model,
            new Set([editor])
        );

        editorRef.current = editor;
        modelRef.current = model;


        // Remove monaco resouce
        return () => {
            binding.destroy()
            editor.dispose();
            model.dispose();
            editorRef.current = null;
            modelRef.current = null;
        }
    }, [yText]);

    // Allow language change
    useEffect(() => {
        const model = modelRef.current;

        if (!model) {
            return;
        }

        if (model.getLanguageId() !== language) {
            monaco.editor.setModelLanguage(model, language);
        }
    }, [language]);

    // lock until downloaded
    useEffect(() => {
        editorRef.current?.updateOptions({
            readOnly,
        })
    }, [readOnly]);

    return (
        <div
            ref={containerRef}
            class="code-editor"
        />
    )
}