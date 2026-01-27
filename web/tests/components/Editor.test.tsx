import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Editor from '../../components/Editor';

jest.mock('y-websocket', () => ({
  __esModule: true,
  WebsocketProvider: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    destroy: jest.fn(),
    awareness: {
      on: jest.fn(),
      off: jest.fn(),
      getStates: jest.fn().mockReturnValue(new Map()),
    },
  })),
}));

jest.mock('monaco-editor', () => ({}));

jest.mock('y-monaco', () => ({
  __esModule: true,
  MonacoBinding: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
  })),
}));

jest.mock('@monaco-editor/react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Editor: ({ onMount }: { onMount: (editor: unknown) => void }) => {
      React.useEffect(() => {
        if (onMount) {
          onMount({ getModel: jest.fn() });
        }
      }, [onMount]);
      return <div data-testid="monaco-editor">Monaco Editor</div>;
    },
  };
});

jest.mock('@/lib/config', () => ({
  config: {
    realtime: {
      wsUrl: 'ws://test-url:1234',
    },
  },
}));

describe('Editor Component', () => {
  const roomId = 'test-room-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the editor container', () => {
    const mockProvider = new WebsocketProvider('ws://test', 'test', new Y.Doc());
    const mockDoc = new Y.Doc();
    render(<Editor roomId={roomId} userName="Test User" userColor="#000000" provider={mockProvider} ydoc={mockDoc} />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });
});
