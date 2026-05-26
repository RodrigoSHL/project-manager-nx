# user-api

NestJS app creada dentro del monorepo NX para gestión de usuarios (Jira-like).  
Puerto: `USER_API_PORT` (default `3002`). Comparte la misma PostgreSQL que `project-api`.

---

## 1. Cómo se creó la app NX

### Problema con generadores NX

`@nx/nest:app` **no acepta argumentos posicionales**; hay que usar el flag `--name=`:

```bash
# ❌ Esto falla:
npx nx g @nx/nest:app user-api

# ✅ Comando correcto:
npx nx g @nx/nest:app \
  --name=user-api \
  --directory=apps/user-api \
  --unitTestRunner=none \
  --e2eTestRunner=none \
  --no-interactive
```

### Generador de recursos `@nx/nest:resource`

A diferencia de `@nx/nest:app`, el generador de recursos **sí acepta argumento posicional** y ese argumento es el **path completo**, no solo el nombre.

```bash
# ❌ Esto pone los archivos en src/ sin subcarpeta:
npx nx g @nx/nest:resource apps/user-api/src/workspaces --unitTestRunner=none --no-interactive

# ✅ Comando correcto — el nombre va dos veces (carpeta + nombre de archivo):
npx nx g @nx/nest:resource apps/user-api/src/<module>/<module> --unitTestRunner=none --no-interactive

# Ejemplo real:
npx nx g @nx/nest:resource apps/user-api/src/workspaces/workspaces --unitTestRunner=none --no-interactive
```

> Esto genera: `src/workspaces/workspaces.module.ts`, `workspaces.controller.ts`, `workspaces.service.ts`, `dto/`, `entities/`

---

## 2. Estructura del módulo

```
apps/user-api/src/
├── main.ts
├── app/
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── config/
│       └── database.config.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
└── workspaces/
    ├── workspaces.module.ts
    ├── workspaces.controller.ts
    ├── workspaces.service.ts
    ├── entities/
    │   └── workspace.entity.ts
    └── dto/
        ├── create-workspace.dto.ts
        └── update-workspace.dto.ts
```

---

## 3. Configuración de DB (`database.config.ts`)

Se reutiliza la misma base de datos que `project-api` (`project_management_db`).  
No hay migración manual: TypeORM con `synchronize: true` crea la tabla automáticamente en dev.

```typescript
// apps/user-api/src/app/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'project_management_db',
  entities: [],            // se pasan en AppModule vía spread
  synchronize: true,       // sólo dev — en prod usar migraciones
  logging: process.env.NODE_ENV === 'development',
};
```

El `entities: []` vacío es intencional: se completa en `AppModule` con spread para poder declarar las entidades explícitamente por app:

```typescript
// app.module.ts
TypeOrmModule.forRoot({
  ...databaseConfig,
  entities: [User],  // cada app declara sólo sus entidades
})
```

---

## 4. Entidad (`user.entity.ts`)

Tabla: `users`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 5. DTOs y validación

Se usa `class-validator` (ya instalado en el monorepo).

```typescript
// create-user.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
```

```typescript
// update-user.dto.ts  (generado automáticamente)
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

El `ValidationPipe` global en `main.ts` activa la validación:
- `whitelist: true` — descarta campos no declarados en el DTO
- `forbidNonWhitelisted: true` — lanza error si llegan campos extra
- `transform: true` — convierte tipos automáticamente

---

## 6. Servicio CRUD (`users.service.ts`)

> **Problema del generador**: el código generado usa `findOne(id: number)` y `+id` (parseInt).  
> Como los IDs son UUID (string), se reemplazó todo a `id: string`.

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepo.create(dto);   // instancia sin persistir
    return this.usersRepo.save(user);           // INSERT
  }

  findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);                    // valida existencia → 404 si no
    await this.usersRepo.update(id, dto);      // UPDATE
    return this.findOne(id);                   // devuelve el registro actualizado
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);                    // valida existencia → 404 si no
    await this.usersRepo.delete(id);           // DELETE
  }
}
```

---

## 7. Módulo (`users.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],  // registra el Repository<User>
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],                      // exportado por si otros módulos lo necesitan
})
export class UsersModule {}
```

---

## 8. Controller (`users.controller.ts`)

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);   // ← string, no +id
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

---

## 9. `main.ts`

```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
// ↑ Carga el .env de la raíz del monorepo (dos niveles arriba de apps/user-api)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: acepta múltiples orígenes separados por coma en CORS_ORIGIN
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.USER_API_PORT || process.env.PORT || 3002;
  await app.listen(port);
}
```

---

## 10. Variables de entorno (`.env`)

```env
# Compartidas con project-api (host, puerto, usuario, contraseña)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=user_project
DATABASE_PASSWORD=password_project
NODE_ENV=development

# project-api apunta a esta DB
DATABASE_NAME=project_management_db

# user-api apunta a su propia DB (misma instancia Postgres, distinta base)
USER_DATABASE_NAME=user_management_db

# Puerto de user-api
USER_API_PORT=3002

# CORS (separar con coma para múltiples orígenes)
CORS_ORIGIN=http://localhost:4200,http://localhost:3000
```

> El script `docker/init-db.sh` crea automáticamente `user_management_db` la primera vez  
> que levanta el contenedor (`docker compose up`). No hay que crearla a mano.

---

## 11. Comandos para levantar y compilar

```bash
# Compilar
npx nx build user-api

# Servir en dev (watch mode)
npx nx serve user-api

# Todas las apps en paralelo
npx nx run-many --all --target=serve --parallel=20
```

---

## 12. Prueba rápida con curl

### Users

```bash
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","name":"Jane Doe"}'

curl http://localhost:3002/api/users
curl http://localhost:3002/api/users/<uuid>

curl -X PATCH http://localhost:3002/api/users/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith"}'

curl -X DELETE http://localhost:3002/api/users/<uuid>
```

### Workspaces

```bash
curl -X POST http://localhost:3002/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","slug":"acme-corp","description":"Main workspace"}'

curl http://localhost:3002/api/workspaces
curl http://localhost:3002/api/workspaces/<uuid>
curl http://localhost:3002/api/workspaces/slug/acme-corp

curl -X PATCH http://localhost:3002/api/workspaces/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corporation"}'

curl -X DELETE http://localhost:3002/api/workspaces/<uuid>
```

---

---

## 13. WorkspacesModule

Generado con:
```bash
npx nx g @nx/nest:resource apps/user-api/src/workspaces/workspaces --unitTestRunner=none --no-interactive
```

**Tabla:** `workspaces` en `user_management_db`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | auto-generado |
| `name` | varchar 255 | nombre del workspace |
| `slug` | varchar 100 UNIQUE | solo minúsculas, números y guiones |
| `description` | text nullable | — |
| `createdAt` / `updatedAt` | timestamp | auto |

**Endpoints:**

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/workspaces` | Crear (valida slug único + formato) |
| `GET` | `/api/workspaces` | Listar todos |
| `GET` | `/api/workspaces/:id` | Buscar por UUID |
| `GET` | `/api/workspaces/slug/:slug` | Buscar por slug |
| `PATCH` | `/api/workspaces/:id` | Actualizar |
| `DELETE` | `/api/workspaces/:id` | Eliminar |

**Validaciones del slug** (`create-workspace.dto.ts`):
- Solo `a-z`, `0-9` y `-` (regex `/^[a-z0-9-]+$/`)
- Unicidad verificada en el service → `ConflictException` si ya existe

---

## Gotchas y lecciones aprendidas

| Problema | Causa | Solución |
|---|---|---|
| `nx g @nx/nest:app user-api` falla | `@nx/nest:app` no acepta positional args | Usar `--name=user-api` explícito |
| `nx g @nx/nest:resource apps/user-api/src/workspaces` pone archivos en `src/` | El path define la ubicación Y el nombre — sin subcarpeta si se da solo el directorio | Repetir el nombre: `src/workspaces/workspaces` |
| `findOne(+id)` rompe con UUIDs | El generador asume IDs numéricos | Cambiar a `id: string` y eliminar el `+` |
| `dotenv` no carga variables | `process.cwd()` apunta a la raíz del monorepo | `path.resolve(process.cwd(), '../../.env')` — relativo desde donde se ejecuta NX |
| Slug duplicado en workspace | No hay constraint a nivel código | `ConflictException` en el service antes del `save` |
