import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket } from 'socket.io-client';
import { sql } from 'kysely';
import { buildAppWithSync, type BuiltApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { getTestDb, closeTestDb, truncateAll, validRegisterPayload } from './helpers/test-app.js';
import { SOCKET_EVENTS } from '@fitnessapp/shared';

const buildLiveApp = async (): Promise<BuiltApp> => {
  const env = loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://fitnessapp:fitnessapp@localhost:5432/fitnessapp_test',
    BCRYPT_COST: '4',
    JWT_ACCESS_SECRET: 'test-access-secret-with-enough-entropy',
    JWT_REFRESH_SECRET: 'test-refresh-secret-with-enough-entropy',
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_TTL: '30d',
    CORS_ORIGINS: 'http://localhost:19006',
  } as NodeJS.ProcessEnv);
  const built = await buildAppWithSync({ env, db: getTestDb(), attachSync: true });
  await built.app.listen({ host: '127.0.0.1', port: 0 });
  return built;
};

const baseUrl = (built: BuiltApp): string => {
  const addr = built.app.server.address() as AddressInfo;
  return `http://127.0.0.1:${addr.port}`;
};

const register = async (built: BuiltApp, overrides: Partial<Record<string, unknown>> = {}) => {
  const res = await built.app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: validRegisterPayload(overrides),
  });
  return res.json() as { accessToken: string; user: { id: string } };
};

type ConnectOptions = { token?: string; authorizationHeader?: string };

const connect = (url: string, opts: ConnectOptions): Promise<Socket> =>
  new Promise((resolve, reject) => {
    const socket = ioClient(url, {
      auth: opts.token ? { token: opts.token } : {},
      extraHeaders: opts.authorizationHeader
        ? { Authorization: opts.authorizationHeader }
        : {},
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
  });

const waitFor = <T>(socket: Socket, event: string): Promise<T> =>
  new Promise((resolve) => socket.once(event, (payload: T) => resolve(payload)));

describe('Socket.IO gateway', () => {
  let built: BuiltApp;
  let url: string;

  beforeAll(async () => {
    built = await buildLiveApp();
    url = baseUrl(built);
  });
  afterAll(async () => {
    await built.app.close();
    await closeTestDb();
  });
  beforeEach(async () => {
    await truncateAll();
    await sql`TRUNCATE TABLE couple_members, couples RESTART IDENTITY CASCADE`.execute(getTestDb());
  });

  it('rejects connections with no auth token', async () => {
    await expect(connect(url, {})).rejects.toBeDefined();
  });

  it('rejects connections with a malformed JWT', async () => {
    await expect(connect(url, { token: 'not-a-real-jwt' })).rejects.toBeDefined();
  });

  it('accepts a token in the Authorization header (Bearer scheme)', async () => {
    const a = await register(built);
    const sock = await connect(url, { authorizationHeader: `Bearer ${a.accessToken}` });
    sock.emit(SOCKET_EVENTS.hello);
    const ready = await waitFor<{ view: unknown }>(sock, SOCKET_EVENTS.ready);
    expect(ready.view).toBeNull();
    sock.disconnect();
  });

  it('hello on a paired user joins the couple room and returns the view', async () => {
    const a = await register(built, { email: 'a@b.io' });
    const create = await built.app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: { authorization: `Bearer ${a.accessToken}` },
    });
    expect(create.statusCode).toBe(201);

    const sock = await connect(url, { token: a.accessToken });
    sock.emit(SOCKET_EVENTS.hello);
    const ready = await waitFor<{ view: { couple: { id: string } } | null }>(sock, SOCKET_EVENTS.ready);
    expect(ready.view).not.toBeNull();
    expect(ready.view?.couple.id).toBe(create.json().couple.id);
    sock.disconnect();
  });

  it('hello returns view: null when the user is not in any couple', async () => {
    const a = await register(built);
    const sock = await connect(url, { token: a.accessToken });
    sock.emit(SOCKET_EVENTS.hello);
    const ready = await waitFor<{ view: unknown }>(sock, SOCKET_EVENTS.ready);
    expect(ready.view).toBeNull();
    sock.disconnect();
  });

  it('emits couple:member-joined to existing members when a partner joins', async () => {
    const a = await register(built, { email: 'a@b.io' });
    const b = await register(built, { email: 'b@b.io' });
    const create = await built.app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: { authorization: `Bearer ${a.accessToken}` },
    });
    const inviteCode = create.json().couple.inviteCode;

    const sockA = await connect(url, { token: a.accessToken });
    sockA.emit(SOCKET_EVENTS.hello);
    await waitFor(sockA, SOCKET_EVENTS.ready);

    const memberJoined = waitFor<{ member: { id: string } }>(sockA, SOCKET_EVENTS.memberJoined);
    const joinRes = await built.app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: { authorization: `Bearer ${b.accessToken}` },
      payload: { inviteCode },
    });
    expect(joinRes.statusCode).toBe(200);
    const event = await memberJoined;
    expect(event.member.id).toBe(b.user.id);
    sockA.disconnect();
  });

  it('emits couple:member-left to remaining members when a partner leaves', async () => {
    const a = await register(built, { email: 'a@b.io' });
    const b = await register(built, { email: 'b@b.io' });
    const create = await built.app.inject({
      method: 'POST',
      url: '/api/v1/couples',
      headers: { authorization: `Bearer ${a.accessToken}` },
    });
    await built.app.inject({
      method: 'POST',
      url: '/api/v1/couples/join',
      headers: { authorization: `Bearer ${b.accessToken}` },
      payload: { inviteCode: create.json().couple.inviteCode },
    });

    const sockA = await connect(url, { token: a.accessToken });
    sockA.emit(SOCKET_EVENTS.hello);
    await waitFor(sockA, SOCKET_EVENTS.ready);

    const memberLeft = waitFor<{ userId: string }>(sockA, SOCKET_EVENTS.memberLeft);
    await built.app.inject({
      method: 'DELETE',
      url: '/api/v1/couples/me',
      headers: { authorization: `Bearer ${b.accessToken}` },
    });
    const event = await memberLeft;
    expect(event.userId).toBe(b.user.id);
    sockA.disconnect();
  });
});
