'use client';

import { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { MonacoBinding } from 'y-monaco';
import { Editor as MonacoEditor, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface EditorProps {
  roomId: string;
  userName: string;
  userColor: string;
  provider: WebsocketProvider;
  ydoc: Y.Doc;
}

const sanitizeColor = (color: string) => {
  // Only allow valid 6-character hex codes
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }
  return '#000000';
};

const sanitizeName = (name: string) => {
  // JSON.stringify quotes the string and escapes characters (e.g. quotes)
  // safe for use in CSS content: "..."
  let safe = JSON.stringify(name);

  // Further escape < and > to prevent breaking out of <style> tag
  // when inserted via innerHTML. \3c and \3e are CSS escapes.
  safe = safe.replace(/</g, '\\3c ').replace(/>/g, '\\3e ');
  return safe;
};

export default function Editor({ roomId, userName, userColor, provider, ydoc }: EditorProps) {
  const [editorRef, setEditorRef] = useState<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef) {
      return;
    }

    const ytext = ydoc.getText('monaco');
    let mounted = true;

    let binding: MonacoBinding | null = null;

    const initBinding = async () => {
      // We dynamically import y-monaco to prevent SSR issues, as it relies on
      // the window object which is not available on the server.
      const { MonacoBinding } = await import('y-monaco');

      if (!mounted) {
        return;
      }

      const model = editorRef.getModel();
      if (!model) {
        return;
      }

      binding = new MonacoBinding(
        ytext,
        model,
        new Set([editorRef]),
        provider.awareness
      );
    };

    const styleElement = document.createElement('style');
    document.head.appendChild(styleElement);

    const updateCursorStyles = () => {
      let css = '';
      provider.awareness.getStates().forEach((state, clientId) => {
        // Only show cursor if user is fully joined
        if (state.user && state.user.status === 'joined') {
          const rawColor = state.user.color || '#000000';
          const rawName = state.user.name || 'Anonymous';

          const color = sanitizeColor(rawColor);
          const nameQuoted = sanitizeName(rawName);

          css += `
            .yRemoteSelection-${clientId} {
              background-color: ${color}80;
            }
            .yRemoteSelectionHead-${clientId} {
              height: 100%;
              border-left: 2px solid ${color};
            }
            .yRemoteSelectionHead-${clientId}::after {
              content: ${nameQuoted};
              background-color: ${color};
              color: white;
              font-size: 10px;
              padding: 1px 4px;
              position: absolute;
              top: -22px;
              left: -2px;
              border-top-right-radius: 4px;
              border-bottom-right-radius: 4px;
              border-top-left-radius: 4px;
              white-space: nowrap;
              z-index: 100;
              pointer-events: none;
              font-weight: 500;
            }
          `;
        }
      });
      styleElement.innerHTML = css;
    };

    provider.awareness.on('change', updateCursorStyles);
    provider.awareness.on('update', updateCursorStyles);

    void initBinding();

    return () => {
      mounted = false;
      document.head.removeChild(styleElement);
      if (binding) {
        binding.destroy();
      }
      // Provider/Doc cleanup handled by parent
      provider.awareness.off('change', updateCursorStyles);
      provider.awareness.off('update', updateCursorStyles);
    };
  }, [editorRef, roomId, userName, userColor, provider, ydoc]);

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
      <style jsx global>{`
        .yRemoteSelection {
          opacity: 0.5;
        }
        .yRemoteSelectionHead {
          position: absolute;
          border-left: 2px solid;
          /* Removed top/bottom/right borders for minimal look */
          height: 100%;
          box-sizing: border-box;
        }
        .yRemoteSelectionHead::after {
          position: absolute;
          /* Removed border for minimal look */
          /* Typography for the name label */
          font-family: inherit;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
