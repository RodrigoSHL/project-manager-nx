import { Cloud, CloudOff, Database } from 'lucide-react';
import { useConnectivity } from '../../../hooks/use-connectivity';
import { useOffline } from '../offline-context';

export function ConnectivityStatus() {
  const { isOnline } = useConnectivity();
  const { mode } = useOffline();
  const local = mode === 'LOCAL';
  const Icon = local ? Database : isOnline ? Cloud : CloudOff;
  return (
    <span
      className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        local
          ? 'bg-blue-50 text-blue-700'
          : isOnline
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-800'
      }`}
    >
      <Icon className="size-3.5" />
      {local ? 'Modo local' : isOnline ? 'Online' : 'Sin conexión'}
    </span>
  );
}
