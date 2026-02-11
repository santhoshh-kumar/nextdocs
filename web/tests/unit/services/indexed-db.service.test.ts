import 'fake-indexeddb/auto';
import { indexedDBService } from '@/services/indexed-db.service';
import type { StoredDocument } from '@/types/document.types';

describe('indexed-db.service', () => {
  beforeEach(async () => {
    await indexedDBService.clearAllDocuments();
  });

  describe('saveDocument and getDocument', () => {
    it('should save and retrieve a document', async () => {
      const doc: StoredDocument = {
        id: 'test-doc',
        meta: {
          title: 'Test Document',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        yjsState: new Uint8Array([1, 2, 3, 4]),
        version: 1,
      };

      await indexedDBService.saveDocument(doc);
      const retrieved = await indexedDBService.getDocument('test-doc');

      expect(retrieved).toEqual(doc);
    });

    it('should return undefined for non-existent document', async () => {
      const retrieved = await indexedDBService.getDocument('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should update existing document', async () => {
      const doc: StoredDocument = {
        id: 'test-doc',
        meta: {
          title: 'Original Title',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        yjsState: new Uint8Array([1, 2, 3]),
        version: 1,
      };

      await indexedDBService.saveDocument(doc);

      const updatedDoc: StoredDocument = {
        ...doc,
        meta: {
          ...doc.meta,
          title: 'Updated Title',
        },
      };

      await indexedDBService.saveDocument(updatedDoc);
      const retrieved = await indexedDBService.getDocument('test-doc');

      expect(retrieved?.meta.title).toBe('Updated Title');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      const doc: StoredDocument = {
        id: 'test-doc',
        meta: {
          title: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        yjsState: new Uint8Array([1, 2, 3]),
        version: 1,
      };

      await indexedDBService.saveDocument(doc);
      await indexedDBService.deleteDocument('test-doc');

      const retrieved = await indexedDBService.getDocument('test-doc');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllDocumentIds', () => {
    it('should return all document IDs', async () => {
      const doc1: StoredDocument = {
        id: 'doc-1',
        meta: {
          title: 'Doc 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        yjsState: new Uint8Array([1]),
        version: 1,
      };

      const doc2: StoredDocument = {
        id: 'doc-2',
        meta: {
          title: 'Doc 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        yjsState: new Uint8Array([2]),
        version: 1,
      };

      await indexedDBService.saveDocument(doc1);
      await indexedDBService.saveDocument(doc2);

      const ids = await indexedDBService.getAllDocumentIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('doc-1');
      expect(ids).toContain('doc-2');
    });

    it('should return empty array when no documents exist', async () => {
      const ids = await indexedDBService.getAllDocumentIds();
      expect(ids).toEqual([]);
    });
  });

  describe('getAllDocuments', () => {
    it('should return all documents', async () => {
      const doc1: StoredDocument = {
        id: 'doc-1',
        meta: {
          title: 'Doc 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        yjsState: new Uint8Array([1]),
        version: 1,
      };

      const doc2: StoredDocument = {
        id: 'doc-2',
        meta: {
          title: 'Doc 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        yjsState: new Uint8Array([2]),
        version: 1,
      };

      await indexedDBService.saveDocument(doc1);
      await indexedDBService.saveDocument(doc2);

      const docs = await indexedDBService.getAllDocuments();
      expect(docs).toHaveLength(2);
    });
  });

  describe('clearAllDocuments', () => {
    it('should clear all documents', async () => {
      const doc: StoredDocument = {
        id: 'test-doc',
        meta: {
          title: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        yjsState: new Uint8Array([1]),
        version: 1,
      };

      await indexedDBService.saveDocument(doc);
      await indexedDBService.clearAllDocuments();

      const ids = await indexedDBService.getAllDocumentIds();
      expect(ids).toEqual([]);
    });
  });

  describe('isAvailable', () => {
    it('should return true when IndexedDB is supported', () => {
      expect(indexedDBService.isAvailable()).toBe(true);
    });
  });
});
