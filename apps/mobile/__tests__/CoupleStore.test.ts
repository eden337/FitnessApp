import type { AxiosInstance } from 'axios';
import type { Socket } from 'socket.io-client';
import { CoupleStore } from '../src/stores/CoupleStore';
import { SOCKET_EVENTS } from '@fitnessapp/shared';

const sampleCouple = (members: { userId: string; role: 'owner' | 'member' }[] = []) => ({
  id: 'couple-1',
  inviteCode: 'ABCDEFGH',
  createdAt: '2026-04-25T00:00:00.000Z',
  members: members.map((m) => ({ ...m, joinedAt: '2026-04-25T00:00:00.000Z' })),
});

const sampleProfile = (id: string, displayName = 'Jane') => ({
  id,
  email: `${id}@b.io`,
  displayName,
  locale: 'en' as const,
  gender: 'female' as const,
  birthDate: '1990-04-15',
  heightCm: 165,
});

const buildApi = () => {
  const get = jest.fn();
  const post = jest.fn();
  const del = jest.fn();
  const api = { get, post, delete: del, put: jest.fn(), patch: jest.fn() } as unknown as AxiosInstance;
  return { api, get, post, delete: del };
};

describe('CoupleStore', () => {
  it('fetch: stores the view returned by the server', async () => {
    const { api, get } = buildApi();
    get.mockResolvedValueOnce({
      data: { view: { couple: sampleCouple([{ userId: 'a', role: 'owner' }]), partners: [] } },
    });
    const store = new CoupleStore({ api });
    await store.fetch();
    expect(store.status).toBe('ready');
    expect(store.view?.couple.inviteCode).toBe('ABCDEFGH');
    expect(store.isPaired).toBe(false);
    expect(store.inviteCode).toBe('ABCDEFGH');
  });

  it('fetch: surfaces server error', async () => {
    const { api, get } = buildApi();
    get.mockRejectedValueOnce({ response: { data: { error: { code: 'unauthenticated' } } } });
    const store = new CoupleStore({ api });
    await store.fetch();
    expect(store.status).toBe('error');
    expect(store.errorMessage).toBe('unauthenticated');
  });

  it('isPaired flips to true once a second member appears', async () => {
    const { api, get } = buildApi();
    get.mockResolvedValueOnce({
      data: {
        view: {
          couple: sampleCouple([
            { userId: 'a', role: 'owner' },
            { userId: 'b', role: 'member' },
          ]),
          partners: [sampleProfile('b')],
        },
      },
    });
    const store = new CoupleStore({ api });
    await store.fetch();
    expect(store.isPaired).toBe(true);
  });

  it('create: posts and applies the result', async () => {
    const { api, post } = buildApi();
    post.mockResolvedValueOnce({
      data: { couple: sampleCouple([{ userId: 'a', role: 'owner' }]), partners: [] },
    });
    const store = new CoupleStore({ api });
    expect(await store.create()).toBe(true);
    expect(post).toHaveBeenCalledWith('/api/v1/couples');
    expect(store.view?.couple.id).toBe('couple-1');
  });

  it('create: surfaces error', async () => {
    const { api, post } = buildApi();
    post.mockRejectedValueOnce({ response: { data: { error: { code: 'already_in_couple' } } } });
    const store = new CoupleStore({ api });
    expect(await store.create()).toBe(false);
    expect(store.errorMessage).toBe('already_in_couple');
  });

  it('join: posts the invite code and applies the result', async () => {
    const { api, post } = buildApi();
    post.mockResolvedValueOnce({
      data: {
        couple: sampleCouple([
          { userId: 'a', role: 'owner' },
          { userId: 'b', role: 'member' },
        ]),
        partners: [sampleProfile('a')],
      },
    });
    const store = new CoupleStore({ api });
    expect(await store.join('ABCDEFGH')).toBe(true);
    expect(post).toHaveBeenCalledWith('/api/v1/couples/join', { inviteCode: 'ABCDEFGH' });
  });

  it('join: surfaces unknown invite code', async () => {
    const { api, post } = buildApi();
    post.mockRejectedValueOnce({ response: { data: { error: { code: 'invite_not_found' } } } });
    const store = new CoupleStore({ api });
    expect(await store.join('ZZZZZZZZ')).toBe(false);
    expect(store.errorMessage).toBe('invite_not_found');
  });

  it('leave: clears the view on success', async () => {
    const { api, get, delete: del } = buildApi();
    get.mockResolvedValueOnce({
      data: { view: { couple: sampleCouple([{ userId: 'a', role: 'owner' }]), partners: [] } },
    });
    del.mockResolvedValueOnce({ data: { disbanded: true } });
    const store = new CoupleStore({ api });
    await store.fetch();
    expect(await store.leave()).toBe(true);
    expect(store.view).toBeNull();
  });

  it('leave: returns false and stores error on failure', async () => {
    const { api, delete: del } = buildApi();
    del.mockRejectedValueOnce({ response: { data: { error: { code: 'not_a_member' } } } });
    const store = new CoupleStore({ api });
    expect(await store.leave()).toBe(false);
    expect(store.errorMessage).toBe('not_a_member');
  });

  it('leave: falls back to a generic message when server returns nothing', async () => {
    const { api, delete: del } = buildApi();
    del.mockRejectedValueOnce({});
    const store = new CoupleStore({ api });
    expect(await store.leave()).toBe(false);
    expect(store.errorMessage).toBe('failed to leave couple');
  });

  it('reset clears all state', () => {
    const { api } = buildApi();
    const store = new CoupleStore({ api });
    store.onReady({
      view: { couple: sampleCouple([{ userId: 'a', role: 'owner' }]), partners: [] },
    });
    store.reset();
    expect(store.view).toBeNull();
    expect(store.status).toBe('idle');
  });

  describe('socket bindings', () => {
    const buildSocketStub = () => {
      const handlers = new Map<string, (payload: unknown) => void>();
      const socket = {
        on: jest.fn((event: string, fn: (payload: unknown) => void) => {
          handlers.set(event, fn);
        }),
        off: jest.fn((event: string) => {
          handlers.delete(event);
        }),
        emit: jest.fn(),
      } as unknown as Socket;
      return { socket, handlers };
    };

    it('bindSocket emits hello and registers handlers', () => {
      const { api } = buildApi();
      const store = new CoupleStore({ api });
      const { socket, handlers } = buildSocketStub();
      store.bindSocket(socket);
      expect((socket.emit as jest.Mock)).toHaveBeenCalledWith(SOCKET_EVENTS.hello);
      expect(handlers.has(SOCKET_EVENTS.ready)).toBe(true);
      expect(handlers.has(SOCKET_EVENTS.memberJoined)).toBe(true);
      expect(handlers.has(SOCKET_EVENTS.memberLeft)).toBe(true);
    });

    it('bindSocket replaces a previously-bound socket', () => {
      const { api } = buildApi();
      const store = new CoupleStore({ api });
      const first = buildSocketStub();
      const second = buildSocketStub();
      store.bindSocket(first.socket);
      store.bindSocket(second.socket);
      expect((first.socket.off as jest.Mock)).toHaveBeenCalled();
    });

    it('unbindSocket removes the handlers and is safe to call when nothing is bound', () => {
      const { api } = buildApi();
      const store = new CoupleStore({ api });
      store.unbindSocket(); // no-op
      const { socket } = buildSocketStub();
      store.bindSocket(socket);
      store.unbindSocket();
      expect((socket.off as jest.Mock)).toHaveBeenCalledWith(SOCKET_EVENTS.ready);
    });

    it('onReady seeds the view from the server payload', () => {
      const { api } = buildApi();
      const store = new CoupleStore({ api });
      store.onReady({
        view: { couple: sampleCouple([{ userId: 'a', role: 'owner' }]), partners: [] },
      });
      expect(store.view).not.toBeNull();
      expect(store.status).toBe('ready');
    });

    it('onMemberJoined refetches', async () => {
      const { api, get } = buildApi();
      get.mockResolvedValueOnce({
        data: {
          view: {
            couple: sampleCouple([
              { userId: 'a', role: 'owner' },
              { userId: 'b', role: 'member' },
            ]),
            partners: [sampleProfile('b')],
          },
        },
      });
      const store = new CoupleStore({ api });
      store.onMemberJoined({
        couple: sampleCouple([
          { userId: 'a', role: 'owner' },
          { userId: 'b', role: 'member' },
        ]),
        member: sampleProfile('b'),
      });
      await Promise.resolve();
      expect(get).toHaveBeenCalledWith('/api/v1/couples/me');
    });

    it('onMemberLeft refetches when the couple has 2 members or fewer', async () => {
      const { api, get } = buildApi();
      get.mockResolvedValueOnce({ data: { view: null } });
      const store = new CoupleStore({ api });
      store.onReady({
        view: {
          couple: sampleCouple([
            { userId: 'a', role: 'owner' },
            { userId: 'b', role: 'member' },
          ]),
          partners: [sampleProfile('b')],
        },
      });
      store.onMemberLeft({ coupleId: 'couple-1', userId: 'b' });
      await Promise.resolve();
      expect(get).toHaveBeenCalled();
    });

    it('onMemberLeft prunes locally when 3+ members remain', () => {
      const { api } = buildApi();
      const store = new CoupleStore({ api });
      store.onReady({
        view: {
          couple: sampleCouple([
            { userId: 'a', role: 'owner' },
            { userId: 'b', role: 'member' },
            { userId: 'c', role: 'member' },
          ]),
          partners: [sampleProfile('b'), sampleProfile('c', 'Carl')],
        },
      });
      store.onMemberLeft({ coupleId: 'couple-1', userId: 'b' });
      expect(store.view?.couple.members.map((m) => m.userId)).toEqual(['a', 'c']);
      expect(store.view?.partners.map((p) => p.id)).toEqual(['c']);
    });

    it('onMemberLeft is a no-op when there is no current view', () => {
      const { api } = buildApi();
      const store = new CoupleStore({ api });
      store.onMemberLeft({ coupleId: 'couple-1', userId: 'b' });
      expect(store.view).toBeNull();
    });
  });
});
