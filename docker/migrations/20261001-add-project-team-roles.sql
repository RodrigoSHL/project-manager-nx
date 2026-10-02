-- Ejecutar en la base de project-api si TYPEORM_SYNCHRONIZE=false.
-- Agrega opciones al enum existente sin modificar los roles asignados.
ALTER TYPE public.team_members_role_enum ADD VALUE IF NOT EXISTS 'member';
ALTER TYPE public.team_members_role_enum ADD VALUE IF NOT EXISTS 'analyst';
ALTER TYPE public.team_members_role_enum ADD VALUE IF NOT EXISTS 'technician';
