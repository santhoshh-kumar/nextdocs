'use client';

import { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { MonacoBinding } from 'y-monaco';
import { Editor as MonacoEditor, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { config } from '@/lib/config';

interface EditorProps {
  roomId: string;
}

export default function Editor({ roomId }: EditorProps) {
  const [editorRef, setEditorRef] = useState<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef) {
      return;
    }

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(config.realtime.wsUrl, roomId, ydoc);
    const ytext = ydoc.getText('monaco');

    let binding: MonacoBinding | null = null;

    const initBinding = async () => {
      // We dynamically import y-monaco to prevent SSR issues, as it relies on
      // the window object which is not available on the server.
      const { MonacoBinding } = await import('y-monaco');

      binding = new MonacoBinding(
        ytext,
        editorRef.getModel()!,
        new Set([editorRef]),
        provider.awareness
      );
    };

    void initBinding();

    return () => {
      if (binding) {
        binding.destroy();
      }
      provider.destroy();
      ydoc.destroy();
    };
  }, [editorRef, roomId]);

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    setEditorRef(editor);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden bg-[#1e1e1e]">
      <MonacoEditor
        height="100%"
        defaultLanguage="typescript"
        defaultValue="// Connecting to room..."
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbersMinChars: 4,
          glyphMargin: false,
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}
