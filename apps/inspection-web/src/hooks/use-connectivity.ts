import { useConnectivityContext } from '../features/connectivity/connectivity-context';

export function useConnectivity() {
  return useConnectivityContext();
}
