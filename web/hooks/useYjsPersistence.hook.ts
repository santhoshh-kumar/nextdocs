import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { documentService } from '@/services/document.service';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setSaving, setLastSaved, setError } from '@/stores/document/document.slice';
import type { DocumentMeta } from '@/types/document.types';

const SAVE_DEBOUNCE_MS = 500;

export function useYjsPersistence(
  documentId: string,
  ydoc: Y.Doc | null,
  meta: DocumentMeta | null
) {
  const dispatch = useAppDispatch();
  const { isSaving, lastSaved } = useAppSelector((state) => state.document);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // We use a ref to avoid recreating the timeout handler when meta changes
  const metaRef = useRef(meta);

  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  useEffect(() => {
    if (!ydoc || !meta) {
      return;
    }

    const handleUpdate = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // We debounce saves to avoid excessive IndexedDB writes during rapid edits
      saveTimeoutRef.current = setTimeout(async () => {
        const currentMeta = metaRef.current;

        if (!currentMeta) {
          console.warn('Cannot save: meta is null');
          return;
        }

        try {
          dispatch(setSaving(true));
          dispatch(setError(null));

          await documentService.saveDocument(documentId, ydoc, currentMeta);

          dispatch(setLastSaved(new Date().toISOString()));
        } catch (err) {
          console.error('Failed to save document:', err);
          dispatch(setError(err instanceof Error ? err.message : 'Failed to save document'));
        } finally {
          dispatch(setSaving(false));
        }
      }, SAVE_DEBOUNCE_MS);
    };

    ydoc.on('update', handleUpdate);

    return () => {
      ydoc.off('update', handleUpdate);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [documentId, ydoc, meta, dispatch]);

  return {
    isSaving,
    lastSaved: lastSaved ? new Date(lastSaved) : null,
  };
}
