import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { createSocketClient } from '../services/socketClient';
import { getSocketBaseUrl } from '../services/runtimeConfig';
import { useStores } from '../stores/StoresContext';

/**
 * Owns the single authenticated Socket.IO connection. Stores bind only their
 * event names; persisted REST reconciliation remains the source of truth.
 */
export const SyncConnection: React.FC = observer(() => {
  const { auth, couple, activity } = useStores();
  const authenticatedUserId =
    auth.status === 'authenticated' ? auth.user?.id ?? null : null;

  useEffect(() => {
    if (!authenticatedUserId || !auth.getTokens().accessToken) return;
    const client = createSocketClient({
      url: getSocketBaseUrl(),
      getToken: () => auth.getTokens().accessToken,
    });
    couple.bindSocket(client.socket);
    activity.bindSocket(client.socket);
    return () => {
      couple.unbindSocket();
      activity.unbindSocket();
      client.close();
    };
  }, [activity, auth, authenticatedUserId, couple]);

  return null;
});
