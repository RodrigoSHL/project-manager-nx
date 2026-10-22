import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConnectivityProvider,
  useConnectivityContext,
} from './connectivity-context';
import { connectionPresentation } from './connectivity-presentation';
import { checkApiReachability } from '../../services/connectivity-service';

vi.mock('../../services/connectivity-service', () => ({
  checkApiReachability: vi.fn(),
}));

function Connection() {
  const state = useConnectivityContext();
  return <p role="status">{connectionPresentation(state).label}</p>;
}

describe('initial connectivity check', () => {
  beforeEach(() => vi.mocked(checkApiReachability).mockReset());
  it('retries the first failed check before reporting a server failure', async () => {
    vi.mocked(checkApiReachability)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    render(
      <ConnectivityProvider>
        <Connection />
      </ConnectivityProvider>
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Comprobando conexión'
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('En línea')
    );
    expect(checkApiReachability).toHaveBeenCalledTimes(2);
  });
  it('reports an unavailable server when both initial checks fail', async () => {
    vi.mocked(checkApiReachability).mockResolvedValue(false);
    render(
      <ConnectivityProvider>
        <Connection />
      </ConnectivityProvider>
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Sin servidor')
    );
    expect(checkApiReachability).toHaveBeenCalledTimes(2);
  });
  it('does not retry a successful first check', async () => {
    vi.mocked(checkApiReachability).mockResolvedValue(true);
    render(
      <ConnectivityProvider>
        <Connection />
      </ConnectivityProvider>
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('En línea')
    );
    expect(checkApiReachability).toHaveBeenCalledTimes(1);
  });
});
