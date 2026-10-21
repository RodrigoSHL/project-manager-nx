import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class MacrofitApiClient {
  private readonly baseUrl = (
    process.env.MACROFIT_API_URL || 'http://localhost:3007/api'
  ).replace(/\/$/, '');

  health() {
    return this.request('/health');
  }
  ready() {
    return this.request('/ready');
  }

  analyze(
    file: { buffer: Buffer; mimetype: string },
    body: { hints?: string; plateTypeHint?: string }
  ) {
    const form = new FormData();
    form.append(
      'image',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      'plate'
    );
    if (body.hints !== undefined) form.append('hints', body.hints);
    if (body.plateTypeHint !== undefined)
      form.append('plateTypeHint', body.plateTypeHint);
    return this.request('/analyze-plate', { method: 'POST', body: form });
  }

  private async request(path: string, init: RequestInit = {}) {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: AbortSignal.timeout(35000),
      });
      const body = await response.json();
      if (!response.ok) {
        const message =
          typeof body?.message === 'string' ||
          (Array.isArray(body?.message) &&
            body.message.every((item: unknown) => typeof item === 'string'))
            ? body.message
            : 'No fue posible completar la solicitud de MacroFit.';
        throw new HttpException(
          { statusCode: response.status, message },
          response.status
        );
      }
      if (!body || typeof body !== 'object')
        throw new BadGatewayException('Respuesta inválida de MacroFit.');
      return body;
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Error &&
        ['TimeoutError', 'AbortError'].includes(error.name)
      ) {
        throw new GatewayTimeoutException(
          'El servicio de análisis tardó demasiado en responder.'
        );
      }
      throw new ServiceUnavailableException(
        'El servicio de análisis no está disponible.'
      );
    }
  }
}
