export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
  realtime: {
    wsUrl: process.env.NEXT_PUBLIC_REALTIME_URL || 'ws://localhost:1234',
  },
} as const;
