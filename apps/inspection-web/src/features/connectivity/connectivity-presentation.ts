import type { ConnectivityContextState } from './models';

export function connectionPresentation(
  state: Pick<
    ConnectivityContextState,
    'browserOnline' | 'apiReachable' | 'checking'
  >
) {
  if (!state.browserOnline) {
    return {
      status: 'offline' as const,
      label: 'Sin conexión',
      detail: 'Los cambios se guardarán en este dispositivo',
    };
  }
  if (state.apiReachable) {
    return {
      status: 'online' as const,
      label: 'En línea',
      detail: 'Servidor disponible',
    };
  }
  if (state.checking) {
    return {
      status: 'checking' as const,
      label: 'Comprobando conexión',
      detail: 'Verificando la disponibilidad del servidor',
    };
  }
  return {
    status: 'unavailable' as const,
    label: 'Sin servidor',
    detail: 'Usando datos guardados en este dispositivo',
  };
}
