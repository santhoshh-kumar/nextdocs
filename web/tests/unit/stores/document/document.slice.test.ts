import documentReducer, {
  setCurrentDocument,
  updateMeta,
  setLoading,
  setSaving,
  setError,
  setLastSaved,
  clearDocument,
} from '@/stores/document/document.slice';
import type { DocumentState } from '@/stores/document/document.slice';

describe('document.slice', () => {
  const initialState: DocumentState = {
    currentDocumentId: null,
    meta: null,
    isLoading: false,
    isSaving: false,
    error: null,
    lastSaved: null,
  };

  describe('setCurrentDocument', () => {
    it('should set document data', () => {
      const meta = {
        title: 'Test Document',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const state = documentReducer(
        initialState,
        setCurrentDocument({
          id: 'test-id',
          meta,
        })
      );

      expect(state.currentDocumentId).toBe('test-id');
      expect(state.meta).toEqual(meta);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateMeta', () => {
    it('should update metadata fields with explicit updatedAt', () => {
      const existingMeta = {
        title: 'Original',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const stateWithMeta: DocumentState = {
        ...initialState,
        meta: existingMeta,
      };

      const state = documentReducer(
        stateWithMeta,
        updateMeta({ title: 'Updated', updatedAt: '2024-06-15T12:00:00.000Z' })
      );

      expect(state.meta?.title).toBe('Updated');
      expect(state.meta?.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(state.meta?.updatedAt).toBe('2024-06-15T12:00:00.000Z');
    });

    it('should warn and no-op if meta is null', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const state = documentReducer(
        initialState,
        updateMeta({ title: 'Updated', updatedAt: '2024-06-15T12:00:00.000Z' })
      );

      expect(state.meta).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'updateMeta called but state.meta is null — update ignored'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      const state = documentReducer(initialState, setLoading(true));

      expect(state.isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      const loadingState: DocumentState = {
        ...initialState,
        isLoading: true,
      };

      const state = documentReducer(loadingState, setLoading(false));

      expect(state.isLoading).toBe(false);
    });
  });

  describe('setSaving', () => {
    it('should set saving state to true', () => {
      const state = documentReducer(initialState, setSaving(true));

      expect(state.isSaving).toBe(true);
    });

    it('should set saving state to false', () => {
      const savingState: DocumentState = {
        ...initialState,
        isSaving: true,
      };

      const state = documentReducer(savingState, setSaving(false));

      expect(state.isSaving).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const state = documentReducer(initialState, setError('Test error'));

      expect(state.error).toBe('Test error');
    });

    it('should clear error when null', () => {
      const errorState: DocumentState = {
        ...initialState,
        error: 'Previous error',
      };

      const state = documentReducer(errorState, setError(null));

      expect(state.error).toBeNull();
    });
  });

  describe('setLastSaved', () => {
    it('should set lastSaved from payload and clear isSaving', () => {
      const savingState: DocumentState = {
        ...initialState,
        isSaving: true,
      };

      const timestamp = '2024-06-15T12:00:00.000Z';
      const state = documentReducer(savingState, setLastSaved(timestamp));

      expect(state.lastSaved).toBe(timestamp);
      expect(state.isSaving).toBe(false);
    });
  });

  describe('clearDocument', () => {
    it('should reset to initial state', () => {
      const populatedState: DocumentState = {
        currentDocumentId: 'test-id',
        meta: {
          title: 'Test',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        isLoading: false,
        isSaving: true,
        error: 'Some error',
        lastSaved: '2024-01-01T00:00:00.000Z',
      };

      const state = documentReducer(populatedState, clearDocument());

      expect(state).toEqual(initialState);
    });
  });
});
