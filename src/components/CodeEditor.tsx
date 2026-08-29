import { useEffect, useRef } from "preact/hooks";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness.js";
import * as Y from "yjs";
import { monaco } from "../monaco";

interface CodeEditorProps {
    yText: Y.Text;
    awareness: Awareness;
    language?: string;
    readOnly?: boolean;
}

export function CodeEditor({
    yText,
    awareness,
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
            new Set([editor]),
            awareness,
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
    }, [yText, awareness]);

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

    // Add style for the cursors
    useEffect(() => {
        const style = document.createElement("style");

        style.dataset.collabCursors = "true";

        document.head.appendChild(style);

        const updateStyles =
            (): void => {
                let css = "";

                for (const [clientId, state] of awareness.getStates()) {
                    // Don't render own cursor
                    if (clientId === awareness.clientID) {
                        continue;
                    }

                    const user =
                        (
                            state as {
                                user?: {
                                    name?: unknown,
                                    color?: unknown;
                                }
                            }
                        ).user;

                    if (typeof user?.name !== "string" || typeof user?.color !== "string") {
                        continue;
                    }

                    // Currently internally generated so safe.
                    // Will sanitise/escape after

                    css += `
.yRemoteSelection-${clientId} {
    background-color: ${user.color}55;
}

.yRemoteSelectionHead-${clientId} {
    border-left-color: ${user.color};
}

.yRemoteSelectionHead-${clientId}::after {
    content: "${user.name}";

    position: absolute;

    left: -2px;
    top: -20px;

    padding: 2px 5px;

    border-radius: 3px;

    white-space: nowrap;

    background: ${user.color};
    color: #111;

    font-family: sans-serif;
    font-size: 10px;
    line-height: 14px;

    pointer-events: none;
}
`;
                }

                style.textContent = css;
            };
        awareness.on(
            "change",
            updateStyles,
        );

        updateStyles();

        return () => {
            awareness.off(
                "change",
                updateStyles,
            );

            style.remove();
        }
    }, [awareness]);

    return (
        <div
            ref={containerRef}
            class="code-editor"
        />
    )
}