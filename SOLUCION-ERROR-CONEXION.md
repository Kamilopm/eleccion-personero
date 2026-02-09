# 🔧 SOLUCIÓN: "Error de conexión" en Admin

## ❌ Problema
Al intentar ingresar al panel de administración con el código ADMIN2026, aparece el mensaje:
**"Error de conexión"**

## 🎯 Causa
Este error ocurre porque **el sistema aún no está desplegado**. El sistema necesita estar corriendo en Vercel con Supabase configurado para funcionar.

## ✅ Solución: Desplegar el Sistema

### Opción 1: Despliegue Rápido (Recomendado)

#### PASO 1: Configurar Supabase (3 minutos)

1. Ve a https://supabase.com y crea una cuenta
2. Clic en "New Project"
3. Nombre: `votacion-escolar`
4. Contraseña: [crea una y guárdala]
5. Región: South America (o la más cercana)
6. Clic en "Create new project"
7. **ESPERA 2 minutos** mientras se crea

#### PASO 2: Ejecutar el SQL (2 minutos)

1. En Supabase, ve a **SQL Editor** (menú lateral)
2. Clic en **"+ New query"**
3. Abre el archivo `database.sql` del proyecto
4. **Copia TODO el contenido**
5. **Pégalo** en el editor de Supabase
6. Clic en **"Run"** (botón verde)
7. Debe decir: **"Success. No rows returned"**

#### PASO 3: Obtener Credenciales (1 minuto)

1. Ve a **Settings** (⚙️) → **API**
2. Copia y guarda estos valores:

```
SUPABASE_URL:
https://xxxxxxxxxx.supabase.co

SUPABASE_SERVICE_ROLE_KEY:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(haz clic en el ícono del ojo para verla)
```

⚠️ **IMPORTANTE**: Usa la `service_role` key, NO la `anon` key

#### PASO 4: Desplegar en Vercel (4 minutos)

**Si tienes GitHub:**

1. Sube el proyecto a un repositorio GitHub
2. Ve a https://vercel.com
3. Clic en "Add New..." → "Project"
4. Selecciona tu repositorio
5. Clic en "Import"
6. En **Environment Variables**, agrega:

```
Name: SUPABASE_URL
Value: [pega tu URL de Supabase]

Name: SUPABASE_SERVICE_ROLE_KEY
Value: [pega tu service_role key]
```

7. Clic en **"Deploy"**
8. Espera 2 minutos
9. Te dará una URL como: `https://votacion-escolar-xxx.vercel.app`

**Si NO tienes GitHub (usando CLI):**

1. Instala Node.js desde https://nodejs.org
2. Abre terminal en la carpeta del proyecto
3. Ejecuta:
```bash
npm install -g vercel
vercel login
vercel
```
4. Sigue las instrucciones
5. Cuando pida variables de entorno, agrégalas

#### PASO 5: Verificar que Funciona

1. Abre tu URL de Vercel: `https://tu-proyecto.vercel.app`
2. Deberías ver la página principal ✅
3. Ve a: `https://tu-proyecto.vercel.app/api/health`
4. Debe mostrar: `{"ok":true}` ✅
5. Ve a: `https://tu-proyecto.vercel.app/admin.html`
6. Ingresa código: **ADMIN2026** ✅
7. **¡Ahora sí funciona!** 🎉

---

## 🧪 Opción 2: Probar Localmente (Para Desarrolladores)

Si quieres probar el sistema en tu computadora antes de desplegarlo:

### Requisitos
- Node.js instalado
- Supabase ya configurado (Pasos 1-3 de arriba)

### Pasos

1. **Instalar dependencias:**
```bash
cd votacion-escolar
npm install
```

2. **Crear archivo `.env.local`:**
```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

3. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

4. **Correr localmente:**
```bash
vercel dev
```

5. **Abrir en navegador:**
```
http://localhost:3000
http://localhost:3000/admin.html
```

6. **Probar con ADMIN2026**

---

## 🔍 Verificación de Problemas

### Error persiste después de desplegar?

#### Verificar Variables de Entorno en Vercel:

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Verifica que existan:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Si no están, agrégalas
5. **Deployments** → **Redeploy** (botón de 3 puntos)

#### Verificar que el SQL se ejecutó:

1. Ve a Supabase
2. **Table Editor**
3. Deberías ver las tablas:
   - students
   - candidates
   - votes
   - config
4. Si NO existen, ejecuta de nuevo el `database.sql`

#### Verificar la función serverless:

1. En Vercel: **Deployments** → [tu deployment]
2. Clic en **"View Function Logs"**
3. Busca errores relacionados con:
   - "Faltan variables de entorno"
   - "Cannot connect to Supabase"

#### Verificar el código admin en la base de datos:

1. En Supabase: **Table Editor** → **config**
2. Verifica que exista una fila con:
   - `id = 1`
   - `admin_code = ADMIN2026`
3. Si no existe, ejecuta en SQL Editor:
```sql
INSERT INTO config (id, election_status, admin_code)
VALUES (1, 'closed', 'ADMIN2026')
ON CONFLICT (id) DO UPDATE SET admin_code = 'ADMIN2026';
```

---

## 📞 Checklist de Diagnóstico

Marca lo que ya hiciste:

- [ ] Creé proyecto en Supabase
- [ ] Ejecuté el archivo `database.sql` completo
- [ ] Obtuve SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
- [ ] Desplegué en Vercel (o configuré localmente)
- [ ] Agregué las variables de entorno en Vercel
- [ ] Verifiqué que `/api/health` retorna `{"ok":true}`
- [ ] Las tablas existen en Supabase
- [ ] La tabla `config` tiene el código ADMIN2026

Si marcaste todos, el sistema DEBE funcionar.

---

## ⚡ Solución Express (Sin Desplegar)

Si solo quieres VER que el código está correcto sin desplegarlo, puedes:

1. Revisar el código en `api/[...path].js`
2. Ver que la ruta `/admin/verify` existe
3. Ver que consulta la tabla `config`
4. Confirmar que el SQL crea la tabla `config` con ADMIN2026

Pero para USAR el sistema, **SÍ o SÍ necesitas desplegarlo**.

---

## 🎯 Resumen

**"Error de conexión"** = El sistema no está desplegado todavía

**Solución**:
1. Configurar Supabase (ejecutar SQL)
2. Desplegar en Vercel (con variables de entorno)
3. Abrir la URL de Vercel
4. Usar ADMIN2026

**Tiempo total**: 10-15 minutos

**Resultado**: Sistema funcionando al 100% ✅

---

¿Necesitas ayuda específica con algún paso? Revisa los logs en Vercel o Supabase para ver el error exacto.
