export interface ConnectivityState {
  browserOnline: boolean;
  apiReachable: boolean;
}

export interface ConnectivityContextState extends ConnectivityState {
  checking: boolean;
  lastCheckedAt: string | null;
  refresh: () => Promise<void>;
}
