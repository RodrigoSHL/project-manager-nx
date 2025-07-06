#!/bin/bash

# Script para verificar que las tablas se crearon correctamente

# Cargar variables de entorno desde el archivo .env (solo las variables de base de datos)
if [ -f ".env" ]; then
    # Cargar solo las variables de base de datos, evitando caracteres especiales
    export DATABASE_HOST=$(grep "^DATABASE_HOST=" .env | cut -d'=' -f2)
    export DATABASE_PORT=$(grep "^DATABASE_PORT=" .env | cut -d'=' -f2)
    export DATABASE_NAME=$(grep "^DATABASE_NAME=" .env | cut -d'=' -f2)
    export DATABASE_USERNAME=$(grep "^DATABASE_USERNAME=" .env | cut -d'=' -f2)
    export DATABASE_PASSWORD=$(grep "^DATABASE_PASSWORD=" .env | cut -d'=' -f2)
    echo "✅ Variables de entorno cargadas desde .env"
else
    echo "⚠️  Archivo .env no encontrado, usando valores por defecto"
fi

# Valores por defecto si no están en .env
DATABASE_NAME=${DATABASE_NAME:-project_management_db}
DATABASE_USERNAME=${DATABASE_USERNAME:-user_project}
DATABASE_PASSWORD=${DATABASE_PASSWORD:-password_project}

echo "🔍 Verificando tablas en la base de datos..."
echo "📊 Configuración:"
echo "   Base de datos: $DATABASE_NAME"
echo "   Usuario: $DATABASE_USERNAME"
echo ""

# Verificar que PostgreSQL esté corriendo
if ! docker ps | grep -q project_management_db; then
    echo "❌ PostgreSQL no está corriendo"
    echo "   Ejecuta: docker-compose up -d"
    exit 1
fi

echo "✅ PostgreSQL está corriendo"
echo ""

# Listar todas las tablas
echo "📋 Tablas creadas:"
docker exec project_management_db psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -c "\dt" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Conexión exitosa"
    
    # Contar tablas
    table_count=$(docker exec project_management_db psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    echo "📊 Total de tablas: $table_count"
    echo ""
    
    if [ "$table_count" -gt 0 ]; then
        echo "🎉 Las tablas se crearon correctamente"
        echo ""
        echo "📝 Para verificar desde la API:"
        echo "   curl http://localhost:3000/api/projects"
    else
        echo "⚠️  No se encontraron tablas"
        echo "   Asegúrate de que la API se haya iniciado al menos una vez"
        echo ""
        echo "💡 Para crear las tablas:"
        echo "   npm run serve project-api"
    fi
else
    echo "❌ Error al conectar con la base de datos"
    echo "   Verifica las credenciales en el archivo .env"
    echo "   Usuario: $DATABASE_USERNAME"
    echo "   Base de datos: $DATABASE_NAME"
fi

echo ""
echo "🔧 Comandos útiles:"
echo "   Conectar a la BD: docker exec -it project_management_db psql -U $DATABASE_USERNAME -d $DATABASE_NAME"
echo "   Ver logs de la API: npm run serve project-api"
echo "   Resetear BD: docker-compose down -v && docker-compose up -d" 