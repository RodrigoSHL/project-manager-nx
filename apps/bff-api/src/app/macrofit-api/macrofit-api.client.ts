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

  searchProducts(query: string, view?: 'preview') {
    return this.request(
      `/products/search?q=${encodeURIComponent(query)}${
        view === 'preview' ? '&view=preview' : ''
      }`
    );
  }

  analyzeProductLabel(file: { buffer: Buffer; mimetype: string }) {
    const form = new FormData();
    form.append(
      'image',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      'label'
    );
    return this.request('/analyze-product-label', {
      method: 'POST',
      body: form,
    });
  }

  records(userId: string, path: string, method: string, body?: unknown) {
    return this.request(`/me${path}`, {
      method,
      headers: { 'content-type': 'application/json', 'x-user-id': userId },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  analyzeMealText(body: { text: string; mealType?: string }) {
    return this.request('/analyze-meal-text', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
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
      const body = await response.json().catch((error: unknown) => {
        if (
          error instanceof Error &&
          ['TimeoutError', 'AbortError'].includes(error.name)
        ) {
          throw error;
        }
        return null;
      });
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
          'El servicio de MacroFit tardó demasiado en responder.'
        );
      }
      throw new ServiceUnavailableException(
        'El servicio de MacroFit no está disponible.'
      );
    }
  }
}
