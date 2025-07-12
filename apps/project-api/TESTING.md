# Guía de Testing para Project API

Esta guía te ayudará a ejecutar y escribir tests para el backend de gestión de proyectos.

## 🏗️ Estructura de Tests

```
apps/project-api/
├── src/
│   └── app/
│       └── projects/
│           ├── projects.service.spec.ts     # Tests unitarios del servicio
│           └── projects.controller.spec.ts  # Tests del controlador
└── jest.config.ts                           # Configuración Jest principal
```

## 🚀 Comandos de Testing

### Tests Unitarios
```bash
# Ejecutar todos los tests unitarios
npm run test:api

# Ejecutar tests en modo watch
npm run test:api:watch

# Ejecutar tests con coverage
npm run test:api:coverage

# Ejecutar tests específicos
npm run test:api -- --testNamePattern="create"
```



### Todos los Tests
```bash
# Ejecutar todos los tests del proyecto
npm run test

# Ejecutar todos los tests con coverage
npm run test:coverage
```

## 📋 Tipos de Tests

### 1. **Tests Unitarios** (`*.spec.ts`)

**Ubicación**: `src/app/projects/projects.service.spec.ts`

**Propósito**: Probar la lógica de negocio del servicio de forma aislada.

**Características**:
- Usan mocks para las dependencias
- Son rápidos y no requieren base de datos
- Prueban casos específicos de la lógica

**Ejemplo**:
```typescript
describe('create', () => {
  it('should create a new project with basic data', async () => {
    const createProjectDto = {
      name: 'Test Project',
      businessUnit: 'Test Unit',
      description: 'Test Description',
    };

    const expectedProject = {
      id: 'test-id',
      ...createProjectDto,
      status: ProjectStatus.PLANNING,
      priority: ProjectPriority.MEDIUM,
    };

    mockProjectsService.create.mockResolvedValue(expectedProject);
    const result = await service.create(createProjectDto);
    
    expect(result).toEqual(expectedProject);
  });
});
```

### 2. **Tests de Controlador** (`*.controller.spec.ts`)

**Ubicación**: `src/app/projects/projects.controller.spec.ts`

**Propósito**: Probar que los endpoints del controlador funcionan correctamente.

**Características**:
- Prueban la integración entre controlador y servicio
- Verifican códigos de respuesta HTTP
- Usan mocks para el servicio





## 📊 Coverage y Reportes

### Ver Coverage
```bash
npm run test:api:coverage
```

Esto generará un reporte en `coverage/apps/project-api/` con:
- Porcentaje de cobertura por archivo
- Líneas cubiertas/no cubiertas
- Funciones cubiertas/no cubiertas

### Configuración de Coverage
```json
{
  "collectCoverageFrom": [
    "**/*.(t|j)s",
    "!**/*.spec.ts",
    "!**/*.e2e-spec.ts",
    "!**/node_modules/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## 🧪 Escribiendo Tests

### Convenciones de Naming
- **Archivos**: `*.spec.ts` para unitarios, `*.e2e-spec.ts` para E2E
- **Describe**: Describe la funcionalidad que se está probando
- **It**: Describe el comportamiento específico que se está probando

### Estructura de un Test
```typescript
describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockRepository: Repository<Project>;

  beforeEach(async () => {
    // Setup - preparar el entorno de testing
  });

  afterEach(() => {
    // Cleanup - limpiar después de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      // Arrange - preparar datos
      const createProjectDto = { /* ... */ };
      
      // Act - ejecutar la acción
      const result = await service.create(createProjectDto);
      
      // Assert - verificar el resultado
      expect(result).toBeDefined();
      expect(result.name).toBe(createProjectDto.name);
    });

    it('should throw error for invalid data', async () => {
      // Arrange
      const invalidDto = { /* ... */ };
      
      // Act & Assert
      await expect(service.create(invalidDto)).rejects.toThrow();
    });
  });
});
```

### Mocks y Stubs
```typescript
// Mock de un repositorio
const mockRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};

// Configurar comportamiento del mock
mockRepository.save.mockResolvedValue(expectedResult);
mockRepository.findOne.mockResolvedValue(null); // Simular no encontrado
```

### Testing de Errores
```typescript
it('should throw NotFoundException when project not found', async () => {
  const projectId = 'non-existent-id';
  
  mockRepository.findOne.mockResolvedValue(null);
  
  await expect(service.findOne(projectId))
    .rejects
    .toThrow(NotFoundException);
});
```

## 🔧 Debugging de Tests

### Debug Tests Unitarios
```bash
npm run test:api -- --runInBand --detectOpenHandles
```



### Logs en Tests
```typescript
// Habilitar logs en tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Tests E2E fallan por conexión a BD**
   - Verificar que la BD de testing existe
   - Verificar variables de entorno en `.env.test`

2. **Mocks no funcionan**
   - Verificar que se importan correctamente
   - Usar `jest.clearAllMocks()` en `afterEach`

3. **Tests lentos**
   - Usar `--runInBand` para ejecutar tests secuencialmente
   - Optimizar configuración de Jest

### Comandos de Limpieza
```bash
# Limpiar cache de Jest
npx jest --clearCache

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📈 Métricas de Calidad

### Cobertura Mínima Recomendada
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Tipos de Tests por Proporción
- **Unitarios**: 80%
- **Integración**: 20%

## 🎯 Mejores Prácticas

1. **Test Naming**: Usar nombres descriptivos que expliquen qué se está probando
2. **Arrange-Act-Assert**: Seguir el patrón AAA en todos los tests
3. **Mocks**: Mockear solo las dependencias externas, no la lógica de negocio
4. **Isolation**: Cada test debe ser independiente
5. **Fast**: Los tests deben ejecutarse rápidamente
6. **Reliable**: Los tests deben ser determinísticos

## 📚 Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest) 