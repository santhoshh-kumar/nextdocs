'use client';

import { Editor as MonacoEditor } from '@monaco-editor/react';

interface EditorProps {
  roomId: string; // Reserved for future use
}

export default function Editor({ roomId }: EditorProps) {
  void roomId; // Suppress unused warning until Yjs integration

  return (
    <div className="h-full w-full overflow-hidden bg-[#1e1e1e]">
      <MonacoEditor
        height="100%"
        defaultLanguage="typescript"
        defaultValue="// Start coding..."
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
        // We'll add onMount logic later for Yjs
      />
    </div>
  );
}

