import { CheckCircle2, Download, LoaderCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { offlineSiteKey } from '../../../db/inspection-db';
import { useOffline } from '../offline-context';
import { useState } from 'react';

export function OfflineSiteButton({
  tenantId,
  siteId,
}: {
  tenantId: string;
  siteId: string;
}) {
  const offline = useOffline();
  const [busy, setBusy] = useState(false);
  const record = offline.offlineSites.find(
    (item) => item.id === offlineSiteKey(tenantId, siteId)
  );
  const downloading = busy || record?.status === 'DOWNLOADING';

  async function download() {
    setBusy(true);
    try {
      await offline.cacheSite(tenantId, siteId);
    } catch {
      // El contexto conserva el mensaje de error para mostrarlo junto al botón.
    } finally {
      setBusy(false);
    }
  }

  if (offline.mode === 'LOCAL') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => offline.setMode('REMOTE')}
      >
        Volver a datos remotos
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={downloading}
        onClick={() => void download()}
      >
        {downloading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        {downloading
          ? 'Descargando…'
          : record?.status === 'READY'
          ? 'Actualizar descarga'
          : 'Descargar para uso offline'}
      </Button>
      {record?.status === 'READY' ? (
        <>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="size-4" /> Disponible offline
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => offline.setMode('LOCAL')}
          >
            Abrir copia local
          </Button>
        </>
      ) : null}
      {record?.status === 'ERROR' ? (
        <span className="text-xs text-red-700">{record.error}</span>
      ) : null}
    </div>
  );
}
