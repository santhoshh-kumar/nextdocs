'use client';

import { useState, useEffect } from 'react';
import { WebsocketProvider } from 'y-websocket';
import { getRandomName } from '@/lib/names';
import { COLORS, getRandomColor, generateRandomHexColor } from '@/lib/colors';

interface JoinRoomModalProps {
  onJoin: (userInfo: { name: string; color: string }) => void;
  provider: WebsocketProvider;
}

interface UserAwarenessState {
  user?: {
    name: string;
    color: string;
    status: 'claiming' | 'joined';
    claimTimestamp: number;
  };
}

export default function JoinRoomModal({ onJoin, provider }: JoinRoomModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setName(getRandomName());

    // Initial Claim
    const initialColor = getRandomColor();
    setColor(initialColor);

    const claimTimestamp = Date.now();
    provider.awareness.setLocalStateField('user', {
      name: '', // Empty name initially
      color: initialColor,
      status: 'claiming',
      claimTimestamp
    });

    const handleAwarenessChange = () => {
      const myClientId = provider.awareness.clientID;
      const myState = provider.awareness.getLocalState() as UserAwarenessState;
      if (!myState || !myState.user || myState.user.status !== 'claiming') return;

      const myColor = myState.user.color;
      const myTimestamp = myState.user.claimTimestamp;

      const states = provider.awareness.getStates();
      let conflictDetected = false;

      states.forEach((state: UserAwarenessState, clientId) => {
        if (clientId === myClientId) return; // Skip self
        if (!state.user || !state.user.color) return;

        if (state.user.color === myColor) {
          // Conflict found! Check if I lose.
          // Rule 1: Joined > Claiming
          if (state.user.status === 'joined') {
            conflictDetected = true;
          }
          // Rule 2: Earlier Claim > Later Claim
          else if (state.user.status === 'claiming') {
            if (state.user.claimTimestamp < myTimestamp) {
              conflictDetected = true;
            }
            // Rule 3: Tie-breaker (Lower ID wins)
            else if (state.user.claimTimestamp === myTimestamp && clientId < myClientId) {
              conflictDetected = true;
            }
          }
        }
      });

      if (conflictDetected) {
        // I lost. Pick new color.
        const usedColors = new Set<string>();
        states.forEach((state: UserAwarenessState) => {
          if (state.user && state.user.color) {
            usedColors.add(state.user.color);
          }
        });

        const availableColors = COLORS.filter(c => !usedColors.has(c));
        const newColor = availableColors.length > 0
          ? availableColors[Math.floor(Math.random() * availableColors.length)]
          : (() => {
            let randomHex = generateRandomHexColor();
            while (usedColors.has(randomHex)) {
              randomHex = generateRandomHexColor();
            }
            return randomHex;
          })();

        // Update state to restart claim
        setColor(newColor);
        provider.awareness.setLocalStateField('user', {
          ...myState.user,
          color: newColor,
          claimTimestamp: Date.now()
        });
      }
    };

    provider.awareness.on('change', handleAwarenessChange);

    // Run verification immediately once
    handleAwarenessChange();

    return () => {
      provider.awareness.off('change', handleAwarenessChange);
    };
  }, [provider]);

  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const finalName = name.trim();

      // Update local state to 'joined'
      provider.awareness.setLocalStateField('user', {
        name: finalName,
        color,
        status: 'joined',
        claimTimestamp: Date.now() // Timestamp doesn't matter much for joined state, but good for tracking
      });

      onJoin({ name: finalName, color });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-room-title"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            <svg
              className="h-8 w-8 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <h2 id="join-room-title" className="text-2xl font-bold text-white">Join Room</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your display name to start collaborating.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-400">
              Display Name
            </label>
            <div className="relative mt-2">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Ex. Anonymous Zebra"
                autoFocus
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border border-zinc-700"
                style={{ backgroundColor: color }}
                title="Your cursor color"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Join Session
          </button>
        </form>
      </div>
    </div>
  );
}
