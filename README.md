# Recuerdo Digital — Florería Angélica

Sistema de medallones QR con perfil digital memorial.

## Flujo

1. Admin crea un nuevo medallón desde `/admin/dashboard`
2. Copia el link y se lo envía a la familia
3. La familia entra a `/crear/[token]` y completa el perfil (nombre, fechas, fotos, mensaje)
4. El perfil queda publicado en `/memorial/[id]`
5. El QR del medallón apunta a esa URL

## Setup

### 1. Clonar y instalar
```bash
npm install
```

### 2. Crear proyecto en Supabase
- Ir a https://supabase.com y crear proyecto
- Ejecutar el SQL de `supabase/schema.sql` en el SQL Editor
- Copiar las credenciales

### 3. Variables de entorno
Crear `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
ADMIN_PASSWORD=clave-admin-secreta
NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
```

### 4. Correr en desarrollo
```bash
npm run dev
```

### 5. Deploy en Vercel
- Conectar el repo en vercel.com
- Agregar las variables de entorno en Vercel
- Deploy automático en cada push

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/admin` | Login del administrador |
| `/admin/dashboard` | Panel: crear y gestionar medallones |
| `/crear/[token]` | Formulario para la familia |
| `/memorial/[id]` | Página pública del memorial (QR apunta aquí) |
