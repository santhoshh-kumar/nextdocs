import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebsocketProvider } from 'y-websocket';
import JoinRoomModal from '../../components/JoinRoomModal';

// Mock dependencies
jest.mock('y-websocket', () => ({
    WebsocketProvider: jest.fn(),
}));

jest.mock('@/lib/names', () => ({
    getRandomName: jest.fn(() => 'Test User'),
}));

jest.mock('@/lib/colors', () => ({
    COLORS: ['#FF0000', '#00FF00', '#0000FF'],
    getRandomColor: jest.fn(() => '#FF0000'),
    generateRandomHexColor: jest.fn(() => '#123456'),
}));

interface MockAwareness {
    clientID: number;
    getLocalState: jest.Mock;
    setLocalStateField: jest.Mock;
    getStates: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;
}

type AwarenessListener = () => void;

describe('JoinRoomModal', () => {
    let mockProvider: { awareness: MockAwareness };
    let mockAwareness: MockAwareness;
    let onJoinMock: jest.Mock;
    let awarenessListeners: Record<string, AwarenessListener[]> = {};

    beforeEach(() => {
        awarenessListeners = {};
        jest.clearAllMocks();

        // Setup Awareness Mock
        mockAwareness = {
            clientID: 1,
            getLocalState: jest.fn(),
            setLocalStateField: jest.fn(),
            getStates: jest.fn(() => new Map()),
            on: jest.fn((event: string, handler: AwarenessListener) => {
                if (!awarenessListeners[event]) awarenessListeners[event] = [];
                awarenessListeners[event].push(handler);
            }),
            off: jest.fn((event: string, handler: AwarenessListener) => {
                if (awarenessListeners[event]) {
                    awarenessListeners[event] = awarenessListeners[event].filter(h => h !== handler);
                }
            }),
        };

        mockProvider = {
            awareness: mockAwareness,
        };

        onJoinMock = jest.fn();
    });

    const renderComponent = () => {
        return render(<JoinRoomModal onJoin={onJoinMock} provider={mockProvider as unknown as WebsocketProvider} />);
    };

    test('renders correctly', () => {
        renderComponent();
        expect(screen.getByText('Join Room')).toBeInTheDocument();
        expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Join Session' })).toBeInTheDocument();
    });

    test('initializes with random name and color', () => {
        renderComponent();
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('user', expect.objectContaining({
            name: '',
            color: '#FF0000',
            status: 'claiming',
        }));
    });

    test('updates name on input', () => {
        renderComponent();
        const input = screen.getByLabelText('Display Name');
        fireEvent.change(input, { target: { value: 'New Name' } });
        expect(input).toHaveValue('New Name');
    });

    test('disables join button if name is empty', () => {
        renderComponent();
        const input = screen.getByLabelText('Display Name');
        fireEvent.change(input, { target: { value: '   ' } });
        const button = screen.getByRole('button', { name: 'Join Session' });
        expect(button).toBeDisabled();
    });

    test('calls onJoin and updates awareness when submitted', () => {
        renderComponent();
        const button = screen.getByRole('button', { name: 'Join Session' });

        act(() => {
            fireEvent.click(button);
        });

        expect(onJoinMock).toHaveBeenCalledWith({ name: 'Test User', color: '#FF0000' });
        expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('user', expect.objectContaining({
            name: 'Test User',
            color: '#FF0000',
            status: 'joined',
        }));
    });

    describe('Conflict Resolution', () => {
        const triggerAwarenessChange = () => {
            if (awarenessListeners['change']) {
                awarenessListeners['change'].forEach(h => h());
            }
        };

        test('resolves conflict when another user is already joined with the same color', () => {
            renderComponent();

            // Setup conflict: Local user claiming #FF0000 (default), Remote user joined #FF0000
            mockAwareness.getLocalState.mockReturnValue({
                user: { name: '', color: '#FF0000', status: 'claiming', claimTimestamp: 1000 }
            });

            const remoteState = {
                user: { name: 'Existing User', color: '#FF0000', status: 'joined', claimTimestamp: 500 }
            };

            const states = new Map();
            states.set(2, remoteState); // Remote client ID 2
            mockAwareness.getStates.mockReturnValue(states);

            // Trigger change
            act(() => {
                triggerAwarenessChange();
            });

            // Should pick a new color (first available from filtered list)
            // Original list: ['#FF0000', '#00FF00', '#0000FF']
            // Used: '#FF0000' -> Available: ['#00FF00', '#0000FF']
            // Random mock isn't controlling 'Math.random' here, so we check if setLocalStateField was called with a DIFFERENT color
            expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('user', expect.objectContaining({
                color: expect.not.stringMatching('#FF0000'),
                status: 'claiming'
            }));
        });

        test('resolves conflict when another user is claiming with earlier timestamp', () => {
            renderComponent();

            // Local: claiming #FF0000 at 1000
            mockAwareness.getLocalState.mockReturnValue({
                user: { name: '', color: '#FF0000', status: 'claiming', claimTimestamp: 1000 }
            });

            // Remote: claiming #FF0000 at 500 (earlier wins)
            const remoteState = {
                user: { name: 'Rival', color: '#FF0000', status: 'claiming', claimTimestamp: 500 }
            };

            const states = new Map();
            states.set(2, remoteState);
            mockAwareness.getStates.mockReturnValue(states);

            act(() => {
                triggerAwarenessChange();
            });

            expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('user', expect.objectContaining({
                color: expect.not.stringMatching('#FF0000'),
            }));
        });

        test('resolves conflict via clientID tie-breaker (remote lower ID wins)', () => {
            renderComponent();

            // Local: ID 10, claiming #FF0000 at 1000
            mockAwareness.clientID = 10;
            mockAwareness.getLocalState.mockReturnValue({
                user: { name: '', color: '#FF0000', status: 'claiming', claimTimestamp: 1000 }
            });

            // Remote: ID 2, claiming #FF0000 at 1000 (Same time, Lower ID wins)
            const remoteState = {
                user: { name: 'Rival', color: '#FF0000', status: 'claiming', claimTimestamp: 1000 }
            };

            const states = new Map();
            states.set(2, remoteState);
            mockAwareness.getStates.mockReturnValue(states);

            act(() => {
                triggerAwarenessChange();
            });

            expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('user', expect.objectContaining({
                color: expect.not.stringMatching('#FF0000'),
            }));
        });

        test('generates random hex color when all preset colors are taken', () => {
            renderComponent();

            // Local: claiming #FF0000
            mockAwareness.getLocalState.mockReturnValue({
                user: { name: '', color: '#FF0000', status: 'claiming', claimTimestamp: 1000 }
            });

            // Remote users taking ALL preset colors
            const states = new Map();
            states.set(2, { user: { name: 'User 1', color: '#FF0000', status: 'joined', claimTimestamp: 100 } });
            states.set(3, { user: { name: 'User 2', color: '#00FF00', status: 'joined', claimTimestamp: 100 } });
            states.set(4, { user: { name: 'User 3', color: '#0000FF', status: 'joined', claimTimestamp: 100 } });

            mockAwareness.getStates.mockReturnValue(states);

            act(() => {
                triggerAwarenessChange();
            });

            // Should use the mocked generateRandomHexColor value '#123456'
            expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('user', expect.objectContaining({
                color: '#123456',
                status: 'claiming'
            }));
        });

        test('does NOT change color if no conflict exists', () => {
            renderComponent();

            mockAwareness.getLocalState.mockReturnValue({
                user: { name: '', color: '#FF0000', status: 'claiming', claimTimestamp: 1000 }
            });

            // Remote user has different color
            const remoteState = {
                user: { name: 'Friend', color: '#00FF00', status: 'joined', claimTimestamp: 500 }
            };

            const states = new Map();
            states.set(2, remoteState);
            mockAwareness.getStates.mockReturnValue(states);

            jest.clearAllMocks(); // Clear initial setLocalStateField call

            act(() => {
                triggerAwarenessChange();
            });

            expect(mockAwareness.setLocalStateField).not.toHaveBeenCalled();
        });

        test('does NOT change color if local user wins (earlier timestamp)', () => {
            renderComponent();

            // Local: Earlier (Wins)
            mockAwareness.getLocalState.mockReturnValue({
                user: { name: '', color: '#FF0000', status: 'claiming', claimTimestamp: 500 }
            });

            // Remote: Later (Loses)
            const remoteState = {
                user: { name: 'Latecomer', color: '#FF0000', status: 'claiming', claimTimestamp: 1000 }
            };

            const states = new Map();
            states.set(2, remoteState);
            mockAwareness.getStates.mockReturnValue(states);

            jest.clearAllMocks();

            act(() => {
                triggerAwarenessChange();
            });

            expect(mockAwareness.setLocalStateField).not.toHaveBeenCalled();
        });
    });
});
