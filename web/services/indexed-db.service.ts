import { openDB, type IDBPDatabase } from 'idb';
import type { StoredDocument } from '@/types/document.types';

const DB_NAME = 'nextdesk-db';
const DB_VERSION = 1;
const DOCUMENTS_STORE = 'documents';

class IndexedDBService {
  private static instance: IndexedDBService;
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private isSupported: boolean = true;

  private constructor() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isSupported = false;
    }
  }

  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.isSupported) {
      throw new Error('IndexedDB not supported');
    }

    if (!this.dbPromise) {
      this.dbPromise = this.initDB();
    }

    return this.dbPromise;
  }

  private async initDB(): Promise<IDBPDatabase> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // We check if store exists to support future schema migrations
          if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
            const store = db.createObjectStore(DOCUMENTS_STORE, {
              keyPath: 'id',
            });

            store.createIndex('updatedAt', 'meta.updatedAt');
            store.createIndex('createdAt', 'meta.createdAt');
          }
        },
      });

      return db;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      this.isSupported = false;
      throw error;
    }
  }

  public async getDocument(id: string): Promise<StoredDocument | undefined> {
    try {
      const db = await this.getDB();
      return await db.get(DOCUMENTS_STORE, id);
    } catch (error) {
      console.error('Failed to get document:', error);
      return undefined;
    }
  }

  public async saveDocument(document: StoredDocument): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put(DOCUMENTS_STORE, document);
    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    }
  }

  public async deleteDocument(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      await db.delete(DOCUMENTS_STORE, id);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  }

  public async getAllDocumentIds(): Promise<string[]> {
    try {
      const db = await this.getDB();
      const keys = await db.getAllKeys(DOCUMENTS_STORE);
      return keys as string[];
    } catch (error) {
      console.error('Failed to get document IDs:', error);
      return [];
    }
  }

  public async getAllDocuments(): Promise<StoredDocument[]> {
    try {
      const db = await this.getDB();
      return await db.getAll(DOCUMENTS_STORE);
    } catch (error) {
      console.error('Failed to get documents:', error);
      return [];
    }
  }

  public async clearAllDocuments(): Promise<void> {
    try {
      const db = await this.getDB();
      await db.clear(DOCUMENTS_STORE);
    } catch (error) {
      console.error('Failed to clear documents:', error);
      throw error;
    }
  }

  public isAvailable(): boolean {
    return this.isSupported;
  }
}

export const indexedDBService = IndexedDBService.getInstance();
