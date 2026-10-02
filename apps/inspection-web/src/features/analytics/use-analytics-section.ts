import { useEffect, useState } from 'react';
import type { LoadState } from './models';

export function useAnalyticsSection<T>(
  enabled: boolean,
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: readonly unknown[]
): LoadState<T> {
  const identity = JSON.stringify(dependencies);
  const [state, setState] = useState<LoadState<T> & { identity: string }>({
    data: null,
    loading: false,
    error: null,
    identity: '',
  });
  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null, identity: '' });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null, identity });
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null, identity });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'No fue posible cargar la sección.',
            identity,
          });
      });
    return () => controller.abort();
  }, [enabled, identity]);
  if (!enabled) return { data: null, loading: false, error: null };
  return state.identity === identity
    ? state
    : { data: null, loading: true, error: null };
}
