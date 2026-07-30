import { io } from 'socket.io-client';
import { createSocketClient } from '../src/services/socketClient';

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

describe('createSocketClient', () => {
  it('reads the latest access token for every handshake and closes cleanly', () => {
    const socket = {
      once: jest.fn(),
      removeAllListeners: jest.fn(),
      disconnect: jest.fn(),
    };
    (io as jest.Mock).mockReturnValue(socket);
    let token = 'first';

    const client = createSocketClient({
      url: 'https://sync.example',
      getToken: () => token,
    });
    const options = (io as jest.Mock).mock.calls[0][1] as {
      auth: (callback: (payload: { token: string | null }) => void) => void;
    };
    const callback = jest.fn();
    options.auth(callback);
    token = 'refreshed';
    options.auth(callback);

    expect(callback).toHaveBeenNthCalledWith(1, { token: 'first' });
    expect(callback).toHaveBeenNthCalledWith(2, { token: 'refreshed' });

    client.close();
    expect(socket.removeAllListeners).toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalled();
  });
});
