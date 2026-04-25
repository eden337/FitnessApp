import { io, type Socket } from 'socket.io-client';

export type SocketClient = {
  socket: Socket;
  /** Wait for the next occurrence of `event` exactly once. Cancels the listener after firing. */
  once: <T>(event: string) => Promise<T>;
  close: () => void;
};

export type CreateSocketClientOptions = {
  url: string;
  /** Access token presented in the auth handshake. Refreshed by the AuthStore. */
  token: string;
};

/**
 * Wrap a Socket.IO client so callers don't have to know about its
 * idiosyncrasies. We always go straight to the websocket transport (no
 * polling fallback) because the server has TLS-terminated WebSocket support
 * end-to-end and polling is a needless extra round-trip on RN.
 */
export const createSocketClient = ({ url, token }: CreateSocketClientOptions): SocketClient => {
  const socket = io(url, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
  });

  return {
    socket,
    once<T>(event: string): Promise<T> {
      return new Promise((resolve) => socket.once(event, (payload: T) => resolve(payload)));
    },
    close() {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};
