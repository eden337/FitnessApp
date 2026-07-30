import { makeAutoObservable, runInAction } from 'mobx';
import type { AxiosInstance } from 'axios';
import {
  type CoupleMemberJoinedEvent,
  type CoupleMemberLeftEvent,
  type CoupleReadyEvent,
  type CoupleView,
  SOCKET_EVENTS,
} from '@fitnessapp/shared';
import type { Socket } from 'socket.io-client';

export type CoupleStatus = 'idle' | 'loading' | 'ready' | 'error';

export type CoupleStoreDeps = {
  api: AxiosInstance;
};

/**
 * Owns the caller's couple view + partner list and reacts to socket events
 * to keep the view fresh when the partner joins/leaves. The store is
 * decoupled from socket creation: callers attach a socket via `bindSocket`
 * once one is available, and detach via `unbindSocket` on sign-out.
 */
export class CoupleStore {
  view: CoupleView | null = null;
  status: CoupleStatus = 'idle';
  errorMessage: string | null = null;

  private readonly api: AxiosInstance;
  private socket: Socket | null = null;

  constructor(deps: CoupleStoreDeps) {
    this.api = deps.api;
    makeAutoObservable<this, 'api' | 'socket'>(this, { api: false, socket: false });
  }

  get isPaired(): boolean {
    return this.view !== null && this.view.couple.members.length > 1;
  }

  get inviteCode(): string | null {
    return this.view?.couple.inviteCode ?? null;
  }

  async fetch(): Promise<void> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
    });
    try {
      const res = await this.api.get<{ view: CoupleView | null }>('/api/v1/couples/me');
      runInAction(() => {
        this.view = res.data.view;
        this.status = 'ready';
      });
    } catch (err) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = messageOf(err, 'failed to load couple');
      });
    }
  }

  async create(): Promise<boolean> {
    return this.mutate(() => this.api.post<CoupleView>('/api/v1/couples'));
  }

  async join(inviteCode: string): Promise<boolean> {
    return this.mutate(() =>
      this.api.post<CoupleView>('/api/v1/couples/join', { inviteCode }),
    );
  }

  async leave(): Promise<boolean> {
    runInAction(() => {
      this.errorMessage = null;
    });
    try {
      await this.api.delete('/api/v1/couples/me');
      runInAction(() => {
        this.view = null;
        this.status = 'ready';
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.errorMessage = messageOf(err, 'failed to leave couple');
      });
      return false;
    }
  }

  private async mutate(call: () => Promise<{ data: CoupleView }>): Promise<boolean> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
    });
    try {
      const res = await call();
      runInAction(() => {
        this.view = res.data;
        this.status = 'ready';
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = messageOf(err, 'request failed');
      });
      return false;
    }
  }

  bindSocket = (socket: Socket): void => {
    this.unbindSocket();
    this.socket = socket;
    socket.on(SOCKET_EVENTS.ready, (e: CoupleReadyEvent) => this.onReady(e));
    socket.on(SOCKET_EVENTS.memberJoined, (e: CoupleMemberJoinedEvent) =>
      this.onMemberJoined(e),
    );
    socket.on(SOCKET_EVENTS.memberLeft, (e: CoupleMemberLeftEvent) =>
      this.onMemberLeft(e),
    );
    socket.on('connect', this.onSocketConnect);
    if (socket.connected) this.onSocketConnect();
  };

  unbindSocket = (): void => {
    if (!this.socket) return;
    this.socket.off(SOCKET_EVENTS.ready);
    this.socket.off(SOCKET_EVENTS.memberJoined);
    this.socket.off(SOCKET_EVENTS.memberLeft);
    this.socket.off('connect', this.onSocketConnect);
    this.socket = null;
  };

  private onSocketConnect = (): void => {
    this.socket?.emit(SOCKET_EVENTS.hello);
  };

  /** Public for tests; in production only the socket bindings call these. */
  onReady = (event: CoupleReadyEvent): void => {
    runInAction(() => {
      this.view = event.view;
      this.status = 'ready';
    });
  };

  onMemberJoined = (_event: CoupleMemberJoinedEvent): void => {
    void this.fetch();
  };

  onMemberLeft = (event: CoupleMemberLeftEvent): void => {
    if (!this.view) return;
    if (this.view.couple.members.length <= 2) {
      // Last partner left → solo (or completely disbanded). Refetch to get
      // the canonical state.
      void this.fetch();
      return;
    }
    runInAction(() => {
      if (!this.view) return;
      this.view = {
        couple: {
          ...this.view.couple,
          members: this.view.couple.members.filter((m) => m.userId !== event.userId),
        },
        partners: this.view.partners.filter((p) => p.id !== event.userId),
      };
    });
  };

  reset = (): void => {
    runInAction(() => {
      this.view = null;
      this.status = 'idle';
      this.errorMessage = null;
    });
  };
}

const messageOf = (err: unknown, fallback: string): string => {
  const r = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
    ?.response?.data?.error;
  return r?.code ?? r?.message ?? fallback;
};
