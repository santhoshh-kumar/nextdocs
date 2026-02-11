import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DocumentMeta } from '@/types/document.types';

export interface DocumentState {
  currentDocumentId: string | null;
  meta: DocumentMeta | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: string | null;
}

const initialState: DocumentState = {
  currentDocumentId: null,
  meta: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setCurrentDocument: (
      state,
      action: PayloadAction<{
        id: string;
        meta: DocumentMeta;
      }>
    ) => {
      state.currentDocumentId = action.payload.id;
      state.meta = action.payload.meta;
      state.isLoading = false;
      state.error = null;
    },

    updateMeta: (state, action: PayloadAction<Partial<DocumentMeta> & { updatedAt: string }>) => {
      if (!state.meta) {
        console.warn('updateMeta called but state.meta is null — update ignored');
        return;
      }

      const { updatedAt, ...rest } = action.payload;
      state.meta = {
        ...state.meta,
        ...rest,
        updatedAt,
      };
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    setLastSaved: (state, action: PayloadAction<string>) => {
      state.lastSaved = action.payload;
      state.isSaving = false;
    },

    clearDocument: (state) => {
      state.currentDocumentId = null;
      state.meta = null;
      state.isLoading = false;
      state.isSaving = false;
      state.error = null;
      state.lastSaved = null;
    },
  },
});

export const {
  setCurrentDocument,
  updateMeta,
  setLoading,
  setSaving,
  setError,
  setLastSaved,
  clearDocument,
} = documentSlice.actions;

export default documentSlice.reducer;
