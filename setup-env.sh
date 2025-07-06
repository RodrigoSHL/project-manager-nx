#!/bin/bash

# Script para configurar el archivo .env del monorepo

echo "🔧 Configurando variables de entorno del monorepo..."
echo ""

# Verificar si ya existe el archivo .env
if [ -f ".env" ]; then
    echo "⚠️  El archivo .env ya existe."
    read -p "¿Deseas sobrescribirlo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuración cancelada."
        exit 1
    fi
fi

# Copiar el archivo de ejemplo
cp env.example .env

echo "✅ Archivo .env creado desde env.example"
echo ""

# Mostrar información de configuración
echo "📋 Configuración actual:"
echo "   Base de datos: ${DATABASE_NAME:-project_management}"
echo "   Usuario: ${DATABASE_USERNAME:-project_user}"
echo "   Puerto API: ${API_PORT:-3000}"
echo "   Puerto BD: ${DATABASE_PORT:-5432}"
echo ""

# Preguntar si quiere personalizar
read -p "¿Deseas personalizar la configuración? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔧 Personalización de configuración:"
    echo ""
    
    # Base de datos
    read -p "Nombre de la base de datos [project_management]: " db_name
    if [ ! -z "$db_name" ]; then
        sed -i.bak "s/DATABASE_NAME=.*/DATABASE_NAME=$db_name/" .env
    fi
    
    read -p "Usuario de la base de datos [project_user]: " db_user
    if [ ! -z "$db_user" ]; then
        sed -i.bak "s/DATABASE_USERNAME=.*/DATABASE_USERNAME=$db_user/" .env
    fi
    
    read -p "Contraseña de la base de datos [project_password]: " db_pass
    if [ ! -z "$db_pass" ]; then
        sed -i.bak "s/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=$db_pass/" .env
    fi
    
    read -p "Puerto de la API [3000]: " api_port
    if [ ! -z "$api_port" ]; then
        sed -i.bak "s/API_PORT=.*/API_PORT=$api_port/" .env
    fi
    
    read -p "Puerto de la base de datos [5432]: " db_port
    if [ ! -z "$db_port" ]; then
        sed -i.bak "s/DATABASE_PORT=.*/DATABASE_PORT=$db_port/" .env
    fi
    
    # Limpiar archivos de backup
    rm -f .env.bak
    
    echo ""
    echo "✅ Configuración personalizada guardada"
fi

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "📝 Para usar la configuración:"
echo "   1. Levantar la base de datos: docker-compose up -d"
echo "   2. Iniciar la API: npm run serve project-api"
echo ""
echo "📊 Información de conexión:"
echo "   Base de datos: localhost:${DATABASE_PORT:-5432}"
echo "   API: http://localhost:${API_PORT:-3000}/api"
echo ""
echo "🔍 Para verificar la configuración:"
echo "   cat .env" 