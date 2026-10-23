import { useState } from 'react';

export function useSaveAction() {
  const [saveError, setSaveError] = useState<string | null>(null);
  async function save(action: () => Promise<boolean>, success: () => void) {
    setSaveError(null);
    try {
      if (await action()) success();
      else
        setSaveError(
          'No se pudo confirmar el guardado. Cierra este formulario y actualiza los registros antes de reintentar.'
        );
    } catch {
      setSaveError('No se pudo confirmar el guardado. Revisa la conexión.');
    }
  }
  return { save, saveError };
}
