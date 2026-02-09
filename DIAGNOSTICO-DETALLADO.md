# 🔍 DIAGNÓSTICO DETALLADO - Error de Conexión Admin

## 📋 VERIFICACIÓN PASO A PASO

Por favor, verifica EXACTAMENTE cada uno de estos puntos y dime en cuál falla:

---

## ✅ PASO 1: Verificar Supabase

### 1.1 Tablas Creadas
Ve a Supabase → **Table Editor**

¿Ves estas 4 tablas?
- [ ] students
- [ ] candidates  
- [ ] votes
- [ ] config

**Si NO las ves**: El SQL no se ejecutó correctamente.

### 1.2 Verificar Tabla Config
En Supabase → **Table Editor** → **config**

¿Hay una fila con estos datos?
- id = 1
- election_status = closed
- admin_code = ADMIN2026

**Si NO existe**: Ejecuta esto en SQL Editor:
```sql
INSERT INTO config (id, election_status, admin_code)
VALUES (1, 'closed', 'ADMIN2026')
ON CONFLICT (id) DO UPDATE SET admin_code = 'ADMIN2026';
```

### 1.3 Verificar Función SQL
En Supabase → **Database** → **Functions**

¿Ves la función `cast_vote`?

**Si NO existe**: Ejecuta de nuevo el archivo `database.sql` COMPLETO.

---

## ✅ PASO 2: Verificar Vercel

### 2.1 Variables de Entorno
Ve a Vercel → Tu Proyecto → **Settings** → **Environment Variables**

¿Tienes EXACTAMENTE estas dos variables?
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**Verifica que:**
- Los nombres estén EXACTOS (mayúsculas, sin espacios)
- Los valores estén completos (no cortados)
- La URL termine en `.supabase.co`
- La KEY empiece con `eyJ...`

### 2.2 ¿Usaste la KEY correcta?
En Supabase → Settings → API → **Project API keys**

Hay TRES keys. ¿Cuál usaste?
- ❌ anon / public (INCORRECTA)
- ✅ service_role (CORRECTA)

**Si usaste la anon key**: Cámbiala por la service_role key en Vercel.

### 2.3 Redesplegar después de cambios
Después de agregar/cambiar variables:

Ve a Vercel → **Deployments** → (menú 3 puntos) → **Redeploy**

---

## ✅ PASO 3: Verificar Estructura de Archivos

### 3.1 Verificar que subiste TODOS los archivos
En tu repositorio GitHub o en Vercel, verifica:

```
votacion-escolar/
├── api/
│   └── [...path].js          ← ¿Existe este archivo?
├── public/
│   ├── admin.html            ← ¿Existe?
│   ├── admin.js              ← ¿Existe?
│   └── (otros archivos)
├── package.json              ← ¿Existe?
└── vercel.json               ← ¿Existe?
```

**El archivo MÁS IMPORTANTE es**: `api/[...path].js`

### 3.2 Verificar el nombre del archivo
El archivo DEBE llamarse exactamente:
```
[...path].js
```

NO debe llamarse:
- ❌ [...path].js (sin corchetes)
- ❌ path.js
- ❌ api.js

---

## ✅ PASO 4: Probar Endpoints Específicos

Abre estas URLs en tu navegador y dime QUÉ respuesta obtienes:

### 4.1 Health Check
```
https://TU-PROYECTO.vercel.app/api/health
```

**Respuesta esperada**: `{"ok":true}`

**Si obtienes**:
- ❌ 404 Not Found → El archivo `api/[...path].js` no existe o está mal nombrado
- ❌ 500 Error → Hay un error en el código o faltan variables de entorno
- ❌ Nada/timeout → El despliegue falló

### 4.2 Config
```
https://TU-PROYECTO.vercel.app/api/config
```

**Respuesta esperada**: `{"election_status":"closed"}`

**Si obtienes**:
- ❌ Error 500 → No se puede conectar a Supabase
- ❌ {"error":"..."} → Dime el mensaje exacto

### 4.3 Admin Verify (con herramienta)

Usa este comando en tu terminal (reemplaza la URL):

```bash
curl -X POST https://TU-PROYECTO.vercel.app/api/admin/verify \
  -H "Content-Type: application/json" \
  -d '{"admin_code":"ADMIN2026"}'
```

**Respuesta esperada**: `{"valid":true}`

**Si no tienes curl**, usa esta página HTML:

```html
<!DOCTYPE html>
<html>
<body>
<button onclick="test()">Probar Admin</button>
<pre id="result"></pre>

<script>
async function test() {
  const response = await fetch('https://TU-PROYECTO.vercel.app/api/admin/verify', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({admin_code: 'ADMIN2026'})
  });
  const data = await response.json();
  document.getElementById('result').textContent = JSON.stringify(data, null, 2);
}
</script>
</body>
</html>
```

---

## ✅ PASO 5: Revisar Logs

### 5.1 Logs de Vercel
Ve a Vercel → **Deployments** → [Tu deployment más reciente] → **View Function Logs**

¿Qué errores ves cuando intentas ingresar al admin?

Busca mensajes como:
- "Faltan variables de entorno"
- "Cannot connect to Supabase"
- "Error al verificar código"

### 5.2 Logs de Supabase
Ve a Supabase → **Logs** → **API**

Filtra por tiempo reciente. ¿Ves requests llegando cuando intentas ingresar?

---

## ✅ PASO 6: Verificar Browser Console

### 6.1 Abrir Developer Tools
Abre tu sitio: `https://TU-PROYECTO.vercel.app/admin.html`

Presiona **F12** o **Ctrl+Shift+I**

Ve a la pestaña **Console**

### 6.2 Intentar ingresar
Ingresa ADMIN2026 y da click en Ingresar

¿Qué errores ves en la consola?

Busca:
- CORS errors
- Network errors
- 404 errors
- Failed to fetch

### 6.3 Ver Network
Ve a la pestaña **Network**

Intenta ingresar de nuevo

¿Ves un request a `/api/admin/verify`?
- Si NO aparece → El JavaScript no se está ejecutando
- Si aparece con error → Clic en él y dime el status code

---

## 🎯 REPORTE DE DIAGNÓSTICO

Por favor responde estas preguntas ESPECÍFICAS:

1. **¿Ves las 4 tablas en Supabase?** (students, candidates, votes, config)
   - [ ] Sí
   - [ ] No

2. **¿La tabla config tiene admin_code = ADMIN2026?**
   - [ ] Sí
   - [ ] No
   - [ ] No sé cómo verificar

3. **¿Qué key usaste en Vercel?**
   - [ ] service_role (correcta)
   - [ ] anon/public (incorrecta)
   - [ ] No estoy seguro

4. **¿Qué responde `/api/health`?**
   - Escribe aquí: _________________

5. **¿Qué responde `/api/config`?**
   - Escribe aquí: _________________

6. **¿Qué error ves en Browser Console (F12)?**
   - Escribe aquí: _________________

7. **¿Qué error ves en Vercel Function Logs?**
   - Escribe aquí: _________________

---

## 🔧 SOLUCIONES RÁPIDAS SEGÚN EL PROBLEMA

### Problema: 404 en /api/health
**Solución**: El archivo `api/[...path].js` no está en el lugar correcto
1. Verifica que existe la carpeta `api/` en la raíz
2. Verifica que el archivo se llama `[...path].js` (con corchetes)
3. Redeploy

### Problema: 500 Error / "Faltan variables de entorno"
**Solución**: Variables de entorno no configuradas
1. Ve a Vercel → Settings → Environment Variables
2. Agrega `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy

### Problema: "Error al verificar código" / Respuesta vacía
**Solución**: La tabla config no existe o está vacía
1. Ve a Supabase → SQL Editor
2. Ejecuta:
```sql
INSERT INTO config (id, election_status, admin_code)
VALUES (1, 'closed', 'ADMIN2026')
ON CONFLICT (id) DO UPDATE SET admin_code = 'ADMIN2026';
```

### Problema: CORS error en browser
**Solución**: Hay un problema con el backend
1. Verifica que el código de `api/[...path].js` tiene las líneas CORS:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
```

### Problema: "Failed to fetch"
**Solución**: La URL del API está mal
1. Verifica en `admin.js` que `API_BASE` sea `/api`
2. NO debe ser `http://localhost` ni otra URL

---

## 📞 Siguiente Paso

Responde las 7 preguntas del REPORTE DE DIAGNÓSTICO y te diré exactamente qué hacer para solucionar tu problema específico.
