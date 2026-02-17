import { useEffect, useCallback } from 'react';
import { documentService } from '@/services/document.service';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import {
  setCurrentDocument,
  setLoading,
  setError,
  updateMeta as updateMetaAction,
} from '@/stores/document/document.slice';
import { setYDoc, getYDoc } from '@/stores/document/ydoc-holder';
import type { DocumentMeta } from '@/types/document.types';

const DEFAULT_DOC_ID = 'default-doc';

export function useDocument(documentId?: string) {
  const id = documentId || DEFAULT_DOC_ID;
  const dispatch = useAppDispatch();
  const { meta, isLoading, error } = useAppSelector((state) => state.document);

  useEffect(() => {
    let currentRequestId = 0;

    async function loadDoc() {
      const thisRequest = ++currentRequestId;

      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        const result = await documentService.getOrCreateDocument(id);

        if (thisRequest === currentRequestId) {
          setYDoc(result.ydoc);
          dispatch(
            setCurrentDocument({
              id,
              meta: result.meta,
            })
          );
        }
      } catch (err) {
        console.error('Failed to load document:', err);

        if (thisRequest === currentRequestId) {
          dispatch(setError(err instanceof Error ? err.message : 'Failed to load document'));
        }
      } finally {
        if (thisRequest === currentRequestId) {
          dispatch(setLoading(false));
        }
      }
    }

    loadDoc();

    return () => {
      currentRequestId++;
    };
  }, [id, dispatch]);

  const updateMeta = useCallback(
    (updates: Partial<DocumentMeta>) => {
      if (!meta) {
        console.warn('Cannot update meta: meta is null');
        return;
      }

      const previousMeta = { ...meta };
      const updatedAt = new Date().toISOString();

      dispatch(updateMetaAction({ ...updates, updatedAt }));

      documentService.updateMetadata(id, updates).catch((err) => {
        console.error('Failed to persist metadata update:', err);
        dispatch(updateMetaAction({ ...previousMeta, updatedAt: previousMeta.updatedAt }));
      });
    },
    [meta, id, dispatch]
  );

  return {
    ydoc: getYDoc(),
    meta,
    isLoading,
    error: error ? new Error(error) : null,
    updateMeta,
  };
}
