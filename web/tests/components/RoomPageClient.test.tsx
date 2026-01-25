import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoomPageClient from '../../components/RoomPageClient';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

jest.mock('y-websocket', () => {
    return {
        WebsocketProvider: jest.fn().mockImplementation(() => ({
            destroy: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            disconnect: jest.fn(),
            connect: jest.fn(),
            awareness: {
                destroy: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                setLocalStateField: jest.fn(),
                getLocalState: jest.fn(),
                getStates: jest.fn(() => new Map()),
            }
        })),
    };
});
jest.mock('../../components/JoinRoomModal', () => {
    return function MockJoinRoomModal({ onJoin }: { onJoin: (info: { name: string; color: string }) => void }) {
        return (
            <div data-testid="join-modal">
                <button
                    data-testid="join-btn"
                    onClick={() => onJoin({ name: 'Test User', color: '#000' })}
                >
                    Join
                </button>
            </div>
        );
    };
});
jest.mock('../../components/Editor', () => {
    return function MockEditor({ roomId, userName, userColor }: { roomId: string, userName: string, userColor: string }) {
        return (
            <div data-testid="editor-view">
                Editor: {roomId} - {userName} - {userColor}
            </div>
        );
    };
});
jest.mock('@/lib/config', () => ({
    config: {
        realtime: {
            wsUrl: 'ws://mock-url',
        },
    },
}));


describe('RoomPageClient', () => {
    const roomId = 'test-room-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    test('initializes websocket provider and doc on mount', () => {
        render(<RoomPageClient roomId={roomId} />);

        expect(WebsocketProvider).toHaveBeenCalledTimes(1);
        expect(WebsocketProvider).toHaveBeenCalledWith(
            'ws://mock-url',
            roomId,
            expect.any(Y.Doc)
        );
    });

    test('renders JoinRoomModal initially', () => {
        render(<RoomPageClient roomId={roomId} />);

        // Should show "Waiting to join..." in the main area OR the JoinModal overlay
        // Based on code: 
        // 1. JoinRoomModal is rendered if !hasJoined
        // 2. "Waiting to join..." is rendered in <main> if !hasJoined

        expect(screen.getByTestId('join-modal')).toBeInTheDocument();
        expect(screen.getByText('Waiting to join...')).toBeInTheDocument();
        expect(screen.queryByTestId('editor-view')).not.toBeInTheDocument();
    });

    test('transitions to Editor when user joins', () => {
        render(<RoomPageClient roomId={roomId} />);

        const joinBtn = screen.getByTestId('join-btn');

        act(() => {
            fireEvent.click(joinBtn);
        });

        // Now hasJoined = true
        // Should hide JoinRoomModal (local state in RoomPageClient)
        expect(screen.queryByTestId('join-modal')).not.toBeInTheDocument();

        // Should show Editor
        expect(screen.getByTestId('editor-view')).toBeInTheDocument();
        expect(screen.getByTestId('editor-view')).toHaveTextContent(`Editor: ${roomId} - Test User - #000`);
    });

    test('cleans up provider and doc on unmount', () => {
        const { unmount } = render(<RoomPageClient roomId={roomId} />);

        // Get the mock instance returned by the constructor
        // When using mockImplementation returning an object, 
        // sometimes instances doesn't capture it as expected or it's safer to use results.
        const mockProviderInstance = (WebsocketProvider as jest.Mock).mock.results[0].value;

        unmount();

        expect(mockProviderInstance.destroy).toHaveBeenCalled();
    });
});
