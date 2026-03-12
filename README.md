# Control Financiero — App multiusuario con Supabase + Vercel

Sistema financiero de fricción cero con autenticación, cubos personalizables y panel admin.

---

## 🚀 Setup completo (15-20 minutos)

### Paso 1: Crear proyecto en Supabase (5 min)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (gratis)
2. Haz clic en **"New Project"**
3. Pon nombre: `control-financiero`
4. Elige una contraseña para la base de datos (guárdala)
5. Región: **West EU (Ireland)** (la más cercana a ti)
6. Espera ~2 minutos a que se cree

### Paso 2: Crear las tablas (2 min)

1. En tu proyecto Supabase, ve a **SQL Editor** (icono en el menú lateral)
2. Haz clic en **"New Query"**
3. Copia todo el contenido del archivo `supabase-schema.sql`
4. Pégalo en el editor
5. **IMPORTANTE**: En las políticas de admin, reemplaza las líneas que dicen
   `current_setting('app.settings.admin_email', true)` por tu email literal:
   ```sql
   auth.jwt() ->> 'email' = 'tu-email@ejemplo.com'
   ```
6. Haz clic en **"Run"**
7. Deberías ver "Success" — 5 tablas creadas

### Paso 3: Configurar autenticación (3 min)

#### Email + Contraseña (ya activo por defecto)
No necesitas hacer nada, viene activado.

#### Google OAuth
1. En Supabase, ve a **Authentication** → **Providers**
2. Busca **Google** y actívalo
3. Necesitas crear credenciales en Google Cloud Console:
   - Ve a [console.cloud.google.com](https://console.cloud.google.com)
   - Crea un proyecto (o usa uno existente)
   - Ve a **APIs & Services** → **Credentials**
   - Crea **OAuth 2.0 Client ID** (tipo: Web Application)
   - En "Authorized redirect URIs" añade:
     `https://TU-PROYECTO.supabase.co/auth/v1/callback`
     (la URL la encuentras en Supabase → Settings → API → Project URL)
   - Copia el **Client ID** y **Client Secret**
4. Pega ambos en Supabase → Authentication → Providers → Google
5. Guarda

### Paso 4: Obtener las claves de Supabase (1 min)

1. En Supabase, ve a **Settings** → **API**
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi...`

### Paso 5: Subir a GitHub (3 min)

1. Crea un repositorio en [github.com/new](https://github.com/new)
2. Sube todos los archivos de esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "v2 - multiusuario con Supabase"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/control-financiero.git
   git push -u origin main
   ```

### Paso 6: Desplegar en Vercel (3 min)

1. Ve a [vercel.com](https://vercel.com) y regístrate con GitHub
2. **"Add New Project"** → selecciona tu repositorio
3. **IMPORTANTE** — En "Environment Variables" añade:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOi...
   VITE_ADMIN_EMAIL = tu-email@ejemplo.com
   ```
4. Framework Preset: **Vite**
5. Haz clic en **"Deploy"**
6. En 30 segundos tienes tu URL: `https://control-financiero.vercel.app`

### Paso 7: Configurar redirect de Google (1 min)

Si activaste Google OAuth, vuelve a Google Cloud Console y añade tu URL de Vercel como redirect URI autorizado:
- `https://tu-app.vercel.app` (origin)

Y en Supabase → Authentication → URL Configuration:
- Site URL: `https://tu-app.vercel.app`
- Redirect URLs: `https://tu-app.vercel.app`

---

## 📱 Instalar en iPhone

1. Abre **Safari** → tu URL de Vercel
2. Botón **Compartir** (⬆️) → **"Añadir a pantalla de inicio"**
3. Ya tienes tu app nativa

---

## 🔐 Panel Admin

Si estás logueado con el email que pusiste en `VITE_ADMIN_EMAIL`:
1. Ve a **Ajustes**
2. Aparece el botón **"🔐 Panel Admin"**
3. Verás estadísticas agregadas de todos los usuarios

---

## 🏗️ Arquitectura

```
Usuario → Auth (Google/Email) → Supabase
                                    ├── profiles (quién es)
                                    ├── user_cubos (sus categorías)
                                    ├── monthly_data (ingresos/mes)
                                    ├── expenses (gastos diarios)
                                    └── cubo_totals (fijos mensuales)
```

Cada usuario solo ve sus propios datos (Row Level Security).
El admin puede ver datos agregados de todos.

---

## 🔧 Desarrollo local

```bash
cp .env.example .env
# Edita .env con tus claves de Supabase
npm install
npm run dev
```

Abre `http://localhost:5173`
