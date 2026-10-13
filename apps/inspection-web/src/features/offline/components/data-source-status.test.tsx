import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSourceStatus, LocalDataBanner } from './data-source-status';
import { ConnectivityStatus } from './connectivity-status';
import { resolveDataSourceMode, type DataSourceMode } from '../models';

const mocks = vi.hoisted(() => ({
  preferredMode: 'REMOTE' as DataSourceMode,
  connectivity: { browserOnline: true, apiReachable: true, checking: false },
  setMode: vi.fn(),
}));
vi.mock('../offline-context', () => ({
  useOffline: () => ({
    mode: resolveDataSourceMode(
      mocks.preferredMode,
      mocks.connectivity.apiReachable
    ),
    setMode: mocks.setMode,
    pendingSummary: { total: 2 },
  }),
}));
vi.mock('../../../hooks/use-connectivity', () => ({
  useConnectivity: () => mocks.connectivity,
}));

function preview() {
  return (
    <MemoryRouter>
      <DataSourceStatus />
      <ConnectivityStatus />
      <LocalDataBanner />
    </MemoryRouter>
  );
}

describe('data source indicators', () => {
  beforeEach(() => {
    mocks.preferredMode = 'REMOTE';
    mocks.connectivity = {
      browserOnline: true,
      apiReachable: true,
      checking: false,
    };
    mocks.setMode.mockReset();
  });

  it('shows remote data without a local banner', () => {
    render(preview());
    expect(
      screen.getByRole('status', { name: 'Origen de datos: Datos remotos' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Uso de copia local' })
    ).not.toBeInTheDocument();
  });

  it('distinguishes a local copy from an available connection and preserves the pending sync link', () => {
    mocks.preferredMode = 'LOCAL';
    render(preview());
    expect(
      screen.getByRole('status', { name: 'Origen de datos: Copia local' })
    ).toBeInTheDocument();
    expect(screen.getByText('En línea')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Abrir sincronización: 2 cambios/ })
    ).toHaveAttribute('href', '/sync');
    fireEvent.click(
      screen.getByRole('button', { name: 'Volver a datos remotos' })
    );
    expect(mocks.setMode).toHaveBeenCalledWith('REMOTE');
  });

  it('follows automatic fallback and recovery while preventing a switch to an unavailable server', () => {
    mocks.connectivity = {
      browserOnline: false,
      apiReachable: false,
      checking: false,
    };
    const view = render(preview());
    expect(
      screen.getByRole('status', { name: 'Origen de datos: Copia local' })
    ).toBeInTheDocument();
    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Volver a datos remotos' })
    ).not.toBeInTheDocument();
    mocks.connectivity = {
      browserOnline: true,
      apiReachable: true,
      checking: false,
    };
    view.rerender(preview());
    expect(
      screen.getByRole('status', { name: 'Origen de datos: Datos remotos' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Uso de copia local' })
    ).not.toBeInTheDocument();
  });

  it('keeps a deliberately selected local copy when connectivity recovers', () => {
    mocks.preferredMode = 'LOCAL';
    mocks.connectivity.apiReachable = false;
    const view = render(preview());
    mocks.connectivity.apiReachable = true;
    view.rerender(preview());
    expect(
      screen.getByRole('status', { name: 'Origen de datos: Copia local' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Volver a datos remotos' })
    ).toBeInTheDocument();
  });

  it('shows checking rather than a server failure while checking the initial connection', () => {
    mocks.connectivity = {
      browserOnline: true,
      apiReachable: false,
      checking: true,
    };
    render(preview());
    expect(
      screen.getByText('Comprobando la conexión con el servidor…')
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/El servidor no está disponible/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Volver a datos remotos' })
    ).not.toBeInTheDocument();
  });
});
