import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  GoogleGenAI,
  Type,
  ThinkingLevel,
  type GenerateContentParameters,
} from '@google/genai';
import { z } from 'zod';
import { PlateAnalysisResponseDto } from './dto/analyze-plate.dto';

const nonNegative = z.number().finite().min(0);
const analysisSchema = z.object({
  dish_name: z.string().trim().min(1).max(200),
  plate_type_detected: z.enum(['plato_extendido', 'plato_hondo', 'bowl']),
  total_estimated_kcal: nonNegative,
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        category: z.enum([
          'proteina',
          'carbohidrato',
          'grasa',
          'verdura',
          'fruta',
          'lacteo',
          'legumbre',
        ]),
        estimated_grams: nonNegative.max(10000),
        confidence: z.enum(['alta', 'media', 'baja']),
        nutritional_density_per_100g: z.object({
          kcal: nonNegative.max(1000),
          protein_g: nonNegative.max(100),
          carbs_g: nonNegative.max(100),
          fat_g: nonNegative.max(100),
          fiber_g: nonNegative.max(100),
        }),
      })
    )
    .min(1)
    .max(50),
  clinical_tip: z.string().max(2000),
});

function positiveSetting(
  name: string,
  fallback: number,
  maximum: number
): number {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}`);
  }
  return value;
}

@Injectable()
export class PlateAnalysisService {
  private readonly logger = new Logger(PlateAnalysisService.name);
  private readonly aiClient: GoogleGenAI | null;
  private readonly modelName =
    process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
  private readonly timeoutMs = positiveSetting(
    'GEMINI_TIMEOUT_MS',
    30000,
    30000
  );
  private readonly requestsPerMinute = positiveSetting(
    'MACROFIT_REQUESTS_PER_MINUTE',
    10,
    1000
  );
  private readonly maxConcurrent = positiveSetting(
    'MACROFIT_MAX_CONCURRENT_ANALYSES',
    2,
    20
  );
  private active = 0;
  private windowStart = Date.now();
  private windowRequests = 0;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    this.aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;
    if (!this.aiClient)
      this.logger.warn(
        'Gemini is not configured; analysis requests will return 503.'
      );
  }

  readiness() {
    if (!this.aiClient) {
      throw new ServiceUnavailableException(
        'El análisis de imágenes no está configurado.'
      );
    }
    // Configuration readiness only: this endpoint never makes a paid provider call.
    return { status: 'ready', provider: 'gemini', model: this.modelName };
  }

  async analyzePlate(
    imageBuffer: Buffer,
    mimeType: string,
    hints?: string,
    plateTypeHint?: string
  ): Promise<PlateAnalysisResponseDto> {
    this.readiness();
    if (Date.now() - this.windowStart >= 60000) {
      this.windowStart = Date.now();
      this.windowRequests = 0;
    }
    if (
      this.active >= this.maxConcurrent ||
      this.windowRequests >= this.requestsPerMinute
    ) {
      throw new HttpException(
        'Hay demasiados análisis en curso. Intenta nuevamente en un minuto.',
        429
      );
    }
    this.windowRequests++;
    this.active++;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const systemInstruction = `Eres un nutricionista clínico experto en análisis visual de alimentos y composición de platos preparados.
Tu función es descomponer una imagen de comida en sus componentes individuales e ingredientes crudos/cocidos reales.

Reglas de análisis:
1. Desglosa las preparaciones compuestas en sus ingredientes clave (ejemplo: si ves un guiso o cazuela, separa la carne, papa, choclo, zapallo y caldo).
2. Si detectas arroz, fideos o carnes, reporta siempre el estado "cocido".
3. Para cada ingrediente, proporciona:
   - name: Nombre claro del alimento.
   - category: 'proteina', 'carbohidrato', 'grasa', 'verdura', 'fruta', 'lacteo', 'legumbre'.
   - estimated_grams: Gramaje estimado asumiendo un plato extendido estándar de 25 cm de diámetro.
   - confidence: 'alta', 'media', 'baja'.
   - nutritional_density_per_100g: Valores nutricionales oficiales por cada 100g (kcal, proteina, carbohidratos, grasas, fibra).
4. No incluyas explicaciones en texto plano fuera del esquema JSON.`;

      const promptText = `Analiza la imagen adjunta. 
Referencia: Plato estándar de 25 cm de diámetro, tomado desde ángulo cenital o 45°.
Contexto adicional del usuario: "${
        hints || 'Sin pista adicional'
      }" (si el usuario escribió algo como "lomo saltado sin freír", prioriza esta preparación).
Tipo de plato sugerido por usuario: "${plateTypeHint || 'plato_extendido'}".

Genera el desglose completo de alimentos según el esquema solicitado.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          dish_name: {
            type: Type.STRING,
            description: 'Nombre general del plato identificado',
          },
          plate_type_detected: {
            type: Type.STRING,
            enum: ['plato_extendido', 'plato_hondo', 'bowl'],
            description: 'Tipo de plato detectado según forma y proporciones',
          },
          total_estimated_kcal: {
            type: Type.NUMBER,
            description: 'Suma calórica total estimada del plato',
          },
          items: {
            type: Type.ARRAY,
            description: 'Lista de ingredientes o alimentos desglosados',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'Nombre claro del alimento',
                },
                category: {
                  type: Type.STRING,
                  enum: [
                    'proteina',
                    'carbohidrato',
                    'grasa',
                    'verdura',
                    'fruta',
                    'lacteo',
                    'legumbre',
                  ],
                },
                estimated_grams: {
                  type: Type.NUMBER,
                  description:
                    'Gramaje estimado asumiendo un plato extendido estándar de 25 cm de diámetro',
                },
                confidence: {
                  type: Type.STRING,
                  enum: ['alta', 'media', 'baja'],
                },
                nutritional_density_per_100g: {
                  type: Type.OBJECT,
                  properties: {
                    kcal: { type: Type.NUMBER },
                    protein_g: { type: Type.NUMBER },
                    carbs_g: { type: Type.NUMBER },
                    fat_g: { type: Type.NUMBER },
                    fiber_g: { type: Type.NUMBER },
                  },
                  required: [
                    'kcal',
                    'protein_g',
                    'carbs_g',
                    'fat_g',
                    'fiber_g',
                  ],
                },
              },
              required: [
                'name',
                'category',
                'estimated_grams',
                'confidence',
                'nutritional_density_per_100g',
              ],
            },
          },
          clinical_tip: {
            type: Type.STRING,
            description:
              'Consejo breve de saciedad, fibra o control glicémico.',
          },
        },
        required: [
          'dish_name',
          'plate_type_detected',
          'total_estimated_kcal',
          'items',
          'clinical_tip',
        ],
      };

      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(
            new GatewayTimeoutException(
              'Gemini tardó demasiado en responder. Intenta nuevamente.'
            )
          );
        }, this.timeoutMs);
      });
      const request: GenerateContentParameters = {
        model: this.modelName,
        contents: [
          { inlineData: { data: imageBuffer.toString('base64'), mimeType } },
          promptText,
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          maxOutputTokens: 8192,
          abortSignal: controller.signal,
          httpOptions: {
            timeout: this.timeoutMs,
            // One retry below shares the deadline and provider quota.
            retryOptions: { attempts: 1 },
          },
        },
      };
      const generate = async () => {
        try {
          return await this.aiClient!.models.generateContent(request);
        } catch (error: unknown) {
          const status =
            typeof error === 'object' && error !== null && 'status' in error
              ? Number(error.status)
              : undefined;
          if (
            controller.signal.aborted ||
            ![408, 500, 502, 503, 504].includes(status ?? 0)
          ) {
            throw error;
          }
          await new Promise<void>((resolve, reject) => {
            const onAbort = () => {
              clearTimeout(retryTimer);
              reject(error);
            };
            const retryTimer = setTimeout(() => {
              controller.signal.removeEventListener('abort', onAbort);
              resolve();
            }, 300);
            controller.signal.addEventListener('abort', onAbort, {
              once: true,
            });
            if (controller.signal.aborted) onAbort();
          });
          if (Date.now() - this.windowStart >= 60000) {
            this.windowStart = Date.now();
            this.windowRequests = 0;
          }
          // Retrying also consumes a provider request; never exceed the quota.
          if (this.windowRequests >= this.requestsPerMinute) throw error;
          this.windowRequests++;
          this.logger.warn(
            `Retrying Gemini transient failure (status=${status}).`
          );
          return this.aiClient!.models.generateContent(request);
        }
      };
      const response = await Promise.race([generate(), timeout]);
      let parsed: PlateAnalysisResponseDto;
      try {
        parsed = analysisSchema.parse(JSON.parse(response.text || ''));
      } catch {
        throw new BadGatewayException(
          'Gemini devolvió un análisis inválido. Intenta con otra foto.'
        );
      }
      parsed.total_estimated_kcal = parsed.items.reduce(
        (total, item) =>
          total +
          Math.round(
            (item.nutritional_density_per_100g.kcal * item.estimated_grams) /
              100
          ),
        0
      );
      return parsed;
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        throw new GatewayTimeoutException(
          'Gemini tardó demasiado en responder. Intenta nuevamente.'
        );
      }
      if (error instanceof HttpException) throw error;
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number(error.status)
          : undefined;
      // Never log the provider payload, request, photo, hints or credentials.
      this.logger.warn(
        `Gemini analysis failed (status=${status || 'unavailable'}).`
      );
      if (status === 408 || status === 504) {
        throw new GatewayTimeoutException(
          'Gemini tardó demasiado en responder. Intenta nuevamente.'
        );
      }
      if (status === 429 || status === 503) {
        throw new ServiceUnavailableException(
          'Gemini no está disponible o agotó su cuota. Intenta más tarde.'
        );
      }
      if (status === 401 || status === 403 || status === 404) {
        throw new ServiceUnavailableException(
          'El servicio de análisis tiene un problema de configuración.'
        );
      }
      throw new BadGatewayException(
        'No fue posible obtener el análisis de Gemini. Intenta nuevamente.'
      );
    } finally {
      if (timer) clearTimeout(timer);
      this.active--;
    }
  }
}
