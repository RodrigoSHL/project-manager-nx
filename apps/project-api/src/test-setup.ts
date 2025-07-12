/// <reference types="jest" />
import 'reflect-metadata';

// Configuración global para tests unitarios
beforeAll(() => {
  // Configurar variables de entorno para testing
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Limpiar después de todos los tests
  jest.clearAllMocks();
});

// Configurar timeouts más largos para tests de base de datos
jest.setTimeout(30000); 