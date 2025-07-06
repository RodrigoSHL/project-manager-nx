# Project Manager Web

Frontend para la gestión de proyectos conectado con la API de proyectos.

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con la siguiente configuración:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Ejecutar el Proyecto

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## Conexión con la API

### Estructura de Datos

El frontend está conectado con la API de proyectos y utiliza los siguientes tipos de datos:

- **Project**: Información principal del proyecto
- **Repository**: Repositorios de código
- **Environment**: Entornos de despliegue
- **TeamMember**: Miembros del equipo
- **Task**: Tareas del proyecto
- **Technology**: Tecnologías utilizadas
- **CloudService**: Servicios cloud
- **UsefulLink**: Enlaces útiles

### Funcionalidades Implementadas

1. **Carga de Proyectos**: Obtiene todos los proyectos de la API
2. **Estadísticas**: Muestra estadísticas de proyectos
3. **Datos Dinámicos**: Todos los componentes muestran datos reales de la API
4. **Manejo de Errores**: Interfaz para manejar errores de conexión
5. **Estados de Carga**: Indicadores de carga mientras se obtienen datos
6. **Seed de Datos**: Botón para ejecutar el seed de datos de ejemplo

### Servicios

- `projectService`: Maneja todas las llamadas a la API
- `useProjects`: Hook personalizado para el estado de los proyectos

### Componentes

- `ProjectDashboard`: Dashboard principal con datos dinámicos
- `LoadingSpinner`: Componente de carga
- `ErrorMessage`: Componente para mostrar errores

## Desarrollo

### Estructura de Archivos

```
src/
├── components/
│   ├── ui/                    # Componentes de UI base
│   └── project-dashboard.tsx  # Dashboard principal
├── hooks/
│   └── useProjects.ts         # Hook para manejo de proyectos
├── services/
│   └── projectService.ts      # Servicio de API
└── types/
    └── project.ts             # Tipos TypeScript
```

### Agregar Nuevas Funcionalidades

1. **Nuevos Endpoints**: Agregar métodos en `projectService.ts`
2. **Nuevos Tipos**: Definir interfaces en `project.ts`
3. **Nuevos Estados**: Extender el hook `useProjects.ts`
4. **Nuevos Componentes**: Crear componentes en `components/`

## Troubleshooting

### Error de Conexión

Si ves errores de conexión:

1. Verifica que la API esté corriendo en el puerto correcto
2. Revisa la URL en `NEXT_PUBLIC_API_URL`
3. Usa el botón "Ejecutar Seed" para cargar datos de ejemplo
4. Revisa la consola del navegador para más detalles

### Datos Vacíos

Si no se muestran datos:

1. Ejecuta el seed de datos desde el botón en el header
2. Verifica que la API esté respondiendo correctamente
3. Revisa los logs de la API para errores 