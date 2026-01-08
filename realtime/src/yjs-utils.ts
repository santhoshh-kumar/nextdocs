import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as map from 'lib0/map';
import { WebSocket } from 'ws';

import logger from './logger';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

const docs = new Map<string, WSSharedDoc>();

class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<WebSocket, Set<number>>;
  awareness: awarenessProtocol.Awareness;

  constructor(name: string) {
    super({ gc: true });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);

    this.on('update', this._updateHandler.bind(this));
    this.awareness.on('update', this._awarenessUpdateHandler.bind(this));
  }

  _updateHandler(update: Uint8Array, origin: unknown): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    this.conns.forEach((_, conn) => {
      if (conn !== origin && conn.readyState === WebSocket.OPEN) {
        try {
          conn.send(message, { binary: true });
        } catch (err) {
          logger.error('Failed to send update', {
            error: (err as Error).message,
          });
        }
      }
    });
  }

  _awarenessUpdateHandler(
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ): void {
    const changedClients = added.concat(updated).concat(removed);

    // Track which client IDs each connection controls
    if (origin instanceof WebSocket) {
      const clientIds = this.conns.get(origin);
      if (clientIds) {
        added.forEach((id) => clientIds.add(id));
        removed.forEach((id) => clientIds.delete(id));
      }
    }

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    this.conns.forEach((_, conn) => {
      if (conn !== origin && conn.readyState === WebSocket.OPEN) {
        try {
          conn.send(message, { binary: true });
        } catch (err) {
          logger.error('Failed to send awareness update', {
            error: (err as Error).message,
          });
        }
      }
    });
  }

  destroy(): void {
    this.awareness.destroy();
    super.destroy();
  }
}

function getYDoc(docName: string): WSSharedDoc {
  return map.setIfUndefined(docs, docName, () => {
    const doc = new WSSharedDoc(docName);
    logger.debug('Created Yjs document', { docName });
    return doc;
  });
}

function handleMessage(conn: WebSocket, doc: WSSharedDoc, message: Uint8Array): void {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MESSAGE_SYNC:
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

        if (encoding.length(encoder) > 1) {
          conn.send(encoding.toUint8Array(encoder), { binary: true });
        }
        break;

      case MESSAGE_AWARENESS:
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;

      default:
        logger.warn('Unknown message type', { messageType });
    }
  } catch (err) {
    logger.error('Error handling message', {
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
  }
}

export function setupWSConnection(conn: WebSocket, docName: string): void {
  const doc = getYDoc(docName);

  doc.conns.set(conn, new Set());

  // Send sync step 1 (full document state)
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(encoder, doc);
  conn.send(encoding.toUint8Array(encoder), { binary: true });

  // Send current awareness states (cursors, presence)
  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
    );
    conn.send(encoding.toUint8Array(awarenessEncoder), { binary: true });
  }

  conn.on('message', (message) => {
    handleMessage(conn, doc, new Uint8Array(message as Buffer));
  });

  conn.on('close', () => {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);

    if (controlledIds) {
      awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
    }

    // Clean up document when last connection closes
    if (doc.conns.size === 0) {
      logger.debug('Destroying Yjs document (no connections)', { docName });
      doc.destroy();
      docs.delete(docName);
    }
  });
}

export function getDocsStats(): Array<{ name: string; connections: number }> {
  return Array.from(docs.entries()).map(([name, doc]) => ({
    name,
    connections: doc.conns.size,
  }));
}

export { docs };
