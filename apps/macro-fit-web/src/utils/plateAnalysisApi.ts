import { PlateAnalysisResponse } from '../types/nutrition';

export interface AnalyzePlateOptions {
  hints?: string;
  plateTypeHint?: 'plato_extendido' | 'plato_hondo' | 'bowl';
}

export async function analyzePlateImage(
  imageBlobOrFile: Blob | File,
  options?: AnalyzePlateOptions
): Promise<PlateAnalysisResponse> {
  const formData = new FormData();
  formData.append('image', imageBlobOrFile, 'plate.jpg');
  if (options?.hints) {
    formData.append('hints', options.hints);
  }
  if (options?.plateTypeHint) {
    formData.append('plateTypeHint', options.plateTypeHint);
  }

  const response = await fetch('/api/analyze-plate', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error del servidor al analizar plato (${response.status}: ${response.statusText})`
    );
  }

  return response.json();
}
