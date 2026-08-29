import { useEffect, useRef } from "preact/hooks";
import { monaco } from "../monaco";

interface CodeEditorProps {
    value: string;
    language?: string;
    onChange?: (value: string) => void;
}

export function CodeEditor({
    value,
    language = "cpp",
    onChange,
}: CodeEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const modelRef = useRef<monaco.editor.ITextModel | null>(null);
    const onChangeRef = useRef(onChange);

    // Create Monaco once on mount
    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const model = monaco.editor.createModel(
            value,
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
                padding: {
                    top: 12,
                },
            },
        );

        editorRef.current = editor;
        modelRef.current = model;

        const changeListener = model.onDidChangeContent(() => {
            onChangeRef.current?.(
                model.getValue(),
            );
        });

        // Remove monaco resouce
        return () => {
            changeListener.dispose();
            editor.dispose();
            model.dispose();
            editorRef.current = null;
            modelRef.current = null;
        }
    }, []);

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

    // Allow external source to modify
    useEffect(() => {
        const model = modelRef.current;

        if (!model) {
            return;
        }

        if (model.getValue() !== value) {
            model.setValue(value);
        }
    }, [value]);

    return (
        <div
            ref={containerRef}
            class="code-editor"
        />
    )
}