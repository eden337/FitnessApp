import type { FastifyInstance } from 'fastify';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { SOCKET_EVENTS, type Couple, type UserProfile } from '@fitnessapp/shared';
import type { TokenSigner } from '../../lib/tokens.js';
import type { CouplesService, CoupleEventEmitter } from '../couples/service.js';

export type SyncGateway = {
  io: SocketIOServer;
  emitter: CoupleEventEmitter;
  close: () => Promise<void>;
};

export type SyncGatewayDeps = {
  app: FastifyInstance;
  signer: TokenSigner;
  couplesService: CouplesService;
};

/**
 * Creates a Socket.IO server bound to Fastify's underlying HTTP listener and
 * a `CoupleEventEmitter` that fans out events to the appropriate room.
 *
 * Authentication: every socket presents `auth.token` (JWT access token) on
 * connection. The middleware verifies it with the shared signer; on success
 * the userId is stashed on `socket.data.userId`. The connect handler then
 * looks up the user's couple and joins the room `couple:<id>`.
 *
 * Room shape: one Socket.IO room per couple. Member-joined and member-left
 * events are emitted to that room AFTER the corresponding DB write commits
 * (the REST handlers call into the service, which uses this emitter).
 */
export const createSyncGateway = ({
  app,
  signer,
  couplesService,
}: SyncGatewayDeps): SyncGateway => {
  const io = new SocketIOServer(app.server, {
    cors: { origin: true, credentials: true },
    serveClient: false,
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth as { token?: string } | undefined)?.token ??
      headerBearer(socket.handshake.headers.authorization);
    if (!token) return next(new Error('unauthenticated'));
    try {
      const { sub } = signer.verifyAccess(token);
      socket.data.userId = sub;
      next();
    } catch {
      next(new Error('unauthenticated'));
    }
  });

  io.on('connection', (socket) => {
    void onConnection(socket, couplesService);
  });

  const emitter: CoupleEventEmitter = {
    emitMemberJoined: (coupleId, payload) => {
      io.to(roomFor(coupleId)).emit(SOCKET_EVENTS.memberJoined, payload);
    },
    emitMemberLeft: (coupleId, payload) => {
      io.to(roomFor(coupleId)).emit(SOCKET_EVENTS.memberLeft, payload);
    },
  };

  const close = async (): Promise<void> => {
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  };

  return { io, emitter, close };
};

const onConnection = async (socket: Socket, couplesService: CouplesService): Promise<void> => {
  // The auth middleware guarantees `userId` is set before this fires.
  const userId = socket.data.userId as string;
  socket.on(SOCKET_EVENTS.hello, async () => {
    const view = await couplesService.getMyView(userId);
    if (view) {
      void socket.join(roomFor(view.couple.id));
    }
    socket.emit(SOCKET_EVENTS.ready, { view });
  });
};

const roomFor = (coupleId: string): string => `couple:${coupleId}`;

const headerBearer = (header: string | undefined): string | null => {
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
};

// Re-export the public types only — keeps `Couple` / `UserProfile` resolvable
// from this module's index without having to traverse to @fitnessapp/shared.
export type { Couple, UserProfile };
