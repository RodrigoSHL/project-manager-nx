import { CloudOff } from 'lucide-react';

export function OfflineContentUnavailable({
  subject = 'Este contenido',
}: {
  subject?: string;
}) {
  return (
    <section className="mt-6 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-8 text-center">
      <CloudOff className="mx-auto size-8 text-amber-700 dark:text-amber-300" />
      <h2 className="mt-3 font-semibold text-slate-950 dark:text-slate-100">
        {subject} no está disponible sin conexión
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 dark:text-slate-300">
        Conéctate al servidor y descarga la Mina, Faena o Sitio antes de salir a
        terreno.
      </p>
    </section>
  );
}
