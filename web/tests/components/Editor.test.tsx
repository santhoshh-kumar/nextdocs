import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebsocketProvider } from 'y-websocket';
import Editor from '../../components/Editor';
import { config } from '@/lib/config';

jest.mock('y-websocket', () => ({
  __esModule: true,
  WebsocketProvider: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    destroy: jest.fn(),
    awareness: {},
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
    render(<Editor roomId={roomId} />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('initializes WebsocketProvider with correct URL and room ID', () => {
    render(<Editor roomId={roomId} />);

    expect(WebsocketProvider).toHaveBeenCalledTimes(1);
    expect(WebsocketProvider).toHaveBeenCalledWith(
      config.realtime.wsUrl,
      roomId,
      expect.anything()
    );
  });
});
