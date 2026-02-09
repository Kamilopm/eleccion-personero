# ⚡ GUÍA RÁPIDA DE DESPLIEGUE (10 MINUTOS)

Sigue estos pasos exactamente y tendrás el sistema funcionando.

## 📌 PASO 1: SUPABASE (5 minutos)

### 1.1 Crear Proyecto
```
1. Ve a: https://supabase.com
2. Clic en "Start your project"
3. Clic en "New Project"
4. Nombre: votacion-escolar
5. Contraseña: [crea una segura]
6. Región: [elige la más cercana]
7. Clic en "Create new project"
8. ESPERA 1-2 minutos
```

### 1.2 Ejecutar SQL
```
1. Menú lateral → "SQL Editor"
2. Clic en "+ New query"
3. Abre el archivo "database.sql"
4. COPIA TODO el contenido
5. PEGA en el editor de Supabase
6. Clic en "Run" (botón verde)
7. Debe decir "Success. No rows returned"
```

### 1.3 Obtener Credenciales
```
1. Menú lateral → "Settings" (⚙️)
2. Clic en "API"
3. COPIA estos valores:

   ✅ Project URL:
   https://xxxxxxxxxxx.supabase.co
   
   ✅ service_role key (NO la anon key):
   Clic en el ícono del ojo → COPIA la clave
   
4. Guárdalos en un archivo temporal
```

## 📌 PASO 2: VERCEL (5 minutos)

### Opción A: Con GitHub (Recomendado)

```
1. Sube este proyecto a GitHub

2. Ve a: https://vercel.com
3. Clic en "Add New..." → "Project"
4. Selecciona tu repositorio
5. Clic en "Import"

6. IMPORTANTE - Variables de Entorno:
   Clic en "Environment Variables"
   
   Variable 1:
   Name: SUPABASE_URL
   Value: [pega tu Project URL]
   
   Variable 2:
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [pega tu service_role key]
   
7. Clic en "Deploy"
8. ESPERA 1-2 minutos
9. ¡LISTO! Te da una URL
```

### Opción B: Sin GitHub (CLI)

```
1. Instala Node.js desde: https://nodejs.org

2. Abre terminal en la carpeta del proyecto

3. Ejecuta:
   npm install -g vercel

4. Ejecuta:
   vercel

5. Sigue las instrucciones

6. Configura variables:
   vercel env add SUPABASE_URL
   [pega tu URL]
   
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   [pega tu key]

7. Ejecuta:
   vercel --prod
```

## 📌 PASO 3: VERIFICAR (1 minuto)

```
1. Abre tu URL de Vercel:
   https://tu-proyecto.vercel.app

2. Deberías ver la página de votación ✅

3. Prueba el endpoint:
   https://tu-proyecto.vercel.app/api/health
   
   Debe mostrar: {"ok":true} ✅

4. Ve al panel admin:
   https://tu-proyecto.vercel.app/admin.html
   
   Código: ADMIN2026 ✅
```

## 🎯 PRIMEROS PASOS DESPUÉS DE INSTALAR

### 1. Agregar Candidatos
```
Panel Admin → Pestaña "Candidatos"
- Nombre: Juan Pérez
- Partido: Lista A
- Clic en "Agregar Candidato"

Repite para más candidatos
```

### 2. Importar Estudiantes
```
Crea un archivo Excel con:

| Nombre          | Grado | Curso | Lista |
|-----------------|-------|-------|-------|
| Ana García      | 6     | 1     | 12    |
| Luis Pérez      | 7     | 2     | 3     |
| María Torres    | 8     | 1     | 5     |

Panel Admin → Pestaña "Estudiantes"
- Selecciona tu archivo Excel
- Clic en "Importar Estudiantes"
- Verás los códigos generados automáticamente
```

### 3. Abrir Votación
```
Panel Admin → Pestaña "Votación"
- Clic en "Abrir Votación"
- Estado cambia a 🟢 ABIERTA
```

### 4. Probar Votación
```
1. Copia un código de un estudiante (ejemplo: 6112)
2. Ve a la página principal
3. Ingresa el código
4. Selecciona un candidato
5. Confirma el voto
6. ¡Éxito! ✅
```

### 5. Ver Resultados
```
Panel Admin → Pestaña "Estadísticas"
- Total de votos
- Participación %
- Resultados por candidato
- Participación por grado
```

## 🚨 SOLUCIÓN RÁPIDA DE PROBLEMAS

### "Faltan variables de entorno"
```
❌ Problema: No configuraste las variables en Vercel
✅ Solución: Ve a Vercel → Tu proyecto → Settings → 
            Environment Variables → Agrégalas
```

### "Código incorrecto" en admin
```
❌ Problema: El código por defecto es ADMIN2026
✅ Solución: Usa ADMIN2026 (mayúsculas)
            O cámbialo en Supabase → config table
```

### No aparecen estudiantes importados
```
❌ Problema: Excel con formato incorrecto
✅ Solución: Verifica columnas: Nombre, Grado, Curso
            Debe ser un archivo .xlsx, .xls o .csv
```

### "La votación está cerrada"
```
❌ Problema: No abriste la votación
✅ Solución: Panel admin → Votación → Abrir Votación
```

### Error al votar
```
❌ Problema: Código ya usado o incorrecto
✅ Solución: Verifica el código en Panel Admin → Estudiantes
            Cada código solo puede votar UNA VEZ
```

## 📋 CHECKLIST FINAL

Antes de lanzar tu votación oficial, verifica:

- [ ] Supabase configurado correctamente
- [ ] Variables de entorno en Vercel
- [ ] Endpoint /api/health funciona
- [ ] Panel admin accesible con ADMIN2026
- [ ] Candidatos agregados
- [ ] Estudiantes importados (con códigos visibles)
- [ ] Probaste votar con un código
- [ ] Votación cerrada (hasta el día de elección)
- [ ] Estadísticas funcionan

## 🎉 ¡LISTO PARA PRODUCCIÓN!

Tu sistema está 100% funcional y listo para usar en una votación real.

**URLs Importantes:**
- Votación: `https://tu-proyecto.vercel.app`
- Admin: `https://tu-proyecto.vercel.app/admin.html`
- Health: `https://tu-proyecto.vercel.app/api/health`

**Código Admin:** `ADMIN2026`

---

**El día de la votación:**

1. Abre la votación desde el panel admin
2. Comparte la URL con los estudiantes
3. Cada estudiante usa su código único
4. Monitorea en tiempo real desde Estadísticas
5. Cierra la votación cuando termines
6. Descarga resultados o toma screenshots

¡Éxito en tu votación! 🗳️✨
