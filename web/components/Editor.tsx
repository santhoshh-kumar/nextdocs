'use client';

import '@blocknote/core/fonts/inter.css';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';
import { useDocument } from '@/hooks/useDocument.hook';
import { useYjsPersistence } from '@/hooks/useYjsPersistence.hook';
import type { DocumentMeta } from '@/types/document.types';
import type * as Y from 'yjs';

export default function Editor() {
  const { ydoc, meta, isLoading, error } = useDocument();

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-destructive">Failed to load document: {error.message}</div>
      </div>
    );
  }

  if (isLoading || !ydoc || !meta) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading document...</div>
      </div>
    );
  }

  return <EditorContent ydoc={ydoc} meta={meta} />;
}

// We separate this component to ensure BlockNote editor is only created
// after the Yjs document is fully loaded from IndexedDB
function EditorContent({ ydoc, meta }: { ydoc: Y.Doc; meta: DocumentMeta }) {
  useYjsPersistence('default-doc', ydoc, meta);

  const editor = useCreateBlockNote({
    collaboration: {
      fragment: ydoc.getXmlFragment('blocknote'),
      user: {
        name: 'Local User',
        color: '#3b82f6',
      },
    },
  });

  return <BlockNoteView editor={editor} shadCNComponents={{}} />;
}
