# MacroFit Web

Frontend Vite/React con instalación PWA y almacenamiento local. Se construye con `Dockerfile.vite` y se sirve como SPA desde Nginx en el puerto interno 80. No necesita Node en runtime, variables `NEXT_PUBLIC_*` ni PostgreSQL.

Las llamadas de análisis usan `/api/macrofit/analyze-plate` en el mismo origen. En desarrollo, Vite las envía al BFF en localhost:3000; en producción, Caddy las envía a `bff-api:3000`. El BFF llama al API interno en el puerto 3007.

`nx build macro-fit-web` ejecuta primero `typecheck`. La generación del service worker está habilitada en producción y deshabilitada en desarrollo/tests. Los archivos `dev-dist` se excluyen de lint y del contexto Docker.

Los errores del análisis se muestran al usuario y no agregan alimentos al registro. La selección de platos, las imágenes admitidas, los límites y la configuración están descritos en [MacroFit API](../macro-fit-api/README.md).
