import { useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  MessageSquareText,
  Trash2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { WorkItemPhoto } from '../models';
import { WORK_PHOTO_ACCEPT } from '../work-photo-api';

export type WorkItemPhotoPreview = WorkItemPhoto & { previewUrl: string };

type WorkItemAdditionalInfoProps = {
  itemId: string;
  comment: string;
  photos: WorkItemPhotoPreview[];
  readonly: boolean;
  busy: boolean;
  error?: string;
  onCommentChange: (comment: string) => void;
  onUpload: (itemId: string, files: File[]) => Promise<void>;
  onDelete: (photo: WorkItemPhotoPreview) => Promise<void>;
};

export function WorkItemAdditionalInfo({
  itemId,
  comment,
  photos,
  readonly,
  busy,
  error,
  onCommentChange,
  onUpload,
  onDelete,
}: WorkItemAdditionalInfoProps) {
  const [expanded, setExpanded] = useState(
    Boolean(comment.trim() || photos.length)
  );
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    await onUpload(itemId, Array.from(files));
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-1 text-left text-sm font-medium text-slate-600 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        <span className="flex min-w-0 items-center gap-2">
          <MessageSquareText className="size-4 shrink-0" />
          <span className="truncate">Comentario y fotografías</span>
          {comment.trim() ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">
              Comentado
            </span>
          ) : null}
          {photos.length ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded ? (
        <div className="mt-3 grid gap-4 rounded-lg bg-slate-50 p-3 sm:p-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Comentario de la revisión
            <textarea
              rows={3}
              maxLength={2000}
              value={comment}
              disabled={readonly}
              placeholder="Agrega una observación opcional sobre este punto."
              onChange={(event) => onCommentChange(event.target.value)}
              className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
            />
            <span className="text-right text-xs font-normal text-slate-400">
              {comment.length}/2000
            </span>
          </label>

          {photos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <figure
                  key={photo.id}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <img
                    src={photo.previewUrl}
                    alt={photo.originalName}
                    className="aspect-square w-full object-cover"
                  />
                  {!readonly ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDelete(photo)}
                      className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-slate-950/80 text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">
                        Eliminar {photo.originalName}
                      </span>
                    </button>
                  ) : null}
                  <figcaption className="truncate px-2 py-2 text-xs text-slate-600">
                    {photo.originalName}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No hay fotografías para este elemento.
            </p>
          )}

          {!readonly ? (
            <div className="flex flex-wrap gap-2">
              <input
                ref={galleryInput}
                type="file"
                multiple
                accept={WORK_PHOTO_ACCEPT}
                aria-label="Seleccionar fotografías"
                className="sr-only"
                onChange={(event) => {
                  void upload(event.target.files);
                  event.target.value = '';
                }}
              />
              <input
                ref={cameraInput}
                type="file"
                accept={WORK_PHOTO_ACCEPT}
                capture="environment"
                aria-label="Tomar fotografía"
                className="sr-only"
                onChange={(event) => {
                  void upload(event.target.files);
                  event.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => galleryInput.current?.click()}
              >
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                Agregar fotos
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => cameraInput.current?.click()}
              >
                <Camera className="size-4" />
                Tomar foto
              </Button>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
