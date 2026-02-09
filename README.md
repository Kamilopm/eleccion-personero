# 🗳️ Sistema de Votación Escolar

Sistema completo de votación en línea para colegios, 100% gratuito y listo para producción.

## ✨ Características

- ✅ **100% Gratis**: Usa Vercel y Supabase (planes gratuitos)
- 📱 **Responsive**: Funciona en celulares y computadores
- 🔒 **Seguro**: Códigos únicos de votación, un voto por estudiante
- 📊 **Panel Admin**: Importar Excel, gestionar candidatos, ver estadísticas
- ⚡ **Tiempo Real**: Datos persistentes en PostgreSQL
- 🚀 **Fácil Deploy**: Sin instalar nada localmente

## 📋 Requisitos Previos

- Una cuenta en [Vercel](https://vercel.com) (gratis)
- Una cuenta en [Supabase](https://supabase.com) (gratis)
- Un navegador web

## 🚀 Instrucciones de Instalación Paso a Paso

### PASO 1: Configurar Supabase (Base de Datos)

1. **Crear proyecto en Supabase**
   - Ve a https://supabase.com
   - Haz clic en "Start your project"
   - Crea una cuenta o inicia sesión
   - Clic en "New Project"
   - Nombre del proyecto: `votacion-escolar`
   - Elige una contraseña segura (guárdala bien)
   - Región: Elige la más cercana a tu ubicación
   - Clic en "Create new project"
   - Espera 1-2 minutos mientras se crea

2. **Ejecutar el Script SQL**
   - En el menú lateral, ve a "SQL Editor"
   - Clic en "New query"
   - Abre el archivo `database.sql` de este proyecto
   - **COPIA TODO EL CONTENIDO** del archivo
   - **PÉGALO** en el editor SQL de Supabase
   - Clic en "Run" (botón verde abajo a la derecha)
   - Deberías ver el mensaje "Success. No rows returned"

3. **Obtener las credenciales**
   - Ve a "Settings" (⚙️ en el menú lateral)
   - Clic en "API"
   - Anota estos dos valores (los necesitarás después):
     * **Project URL**: `https://xxxxx.supabase.co`
     * **service_role key** (en "Project API keys"): Clic en el ícono del ojo para verla

   ⚠️ **IMPORTANTE**: Usa la `service_role` key, NO la `anon` key

### PASO 2: Subir el Código a GitHub (Opcional pero Recomendado)

Si tienes cuenta de GitHub:

1. Crea un nuevo repositorio en GitHub
2. Sube todos los archivos del proyecto
3. NO subas el archivo `.env` (está en .gitignore)

Si NO tienes GitHub, puedes usar el CLI de Vercel directamente.

### PASO 3: Desplegar en Vercel

**Opción A: Desde GitHub (Recomendado)**

1. Ve a https://vercel.com
2. Clic en "Add New..." → "Project"
3. Selecciona tu repositorio de GitHub
4. Clic en "Import"
5. **Configurar Variables de Entorno**:
   - Clic en "Environment Variables"
   - Agrega estas dos variables:
     
     ```
     SUPABASE_URL = https://xxxxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY = tu-service-role-key-aqui
     ```
   
   - Reemplaza los valores con los que obtuviste en el Paso 1
6. Clic en "Deploy"
7. Espera 1-2 minutos
8. ¡Listo! Te dará una URL como `https://tu-proyecto.vercel.app`

**Opción B: Sin GitHub (CLI)**

1. Instala Vercel CLI (requiere Node.js):
   ```bash
   npm install -g vercel
   ```

2. En la carpeta del proyecto:
   ```bash
   vercel
   ```

3. Sigue las instrucciones en pantalla
4. Configura las variables de entorno:
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

### PASO 4: Verificar la Instalación

1. Abre tu sitio: `https://tu-proyecto.vercel.app`
2. Deberías ver la página principal de votación
3. Ve a: `https://tu-proyecto.vercel.app/api/health`
4. Deberías ver: `{"ok":true}`

¡Ya está funcionando! 🎉

## 📖 Manual de Uso

### Para Administradores

1. **Acceder al Panel**
   - Ve a: `https://tu-proyecto.vercel.app/admin.html`
   - Ingresa el código: `ADMIN2026` (puedes cambiarlo después en Supabase)

2. **Importar Estudiantes**
   - Prepara un archivo Excel (.xlsx, .xls o .csv) con estas columnas:
     * **Nombre** (obligatorio)
     * **Grado** (obligatorio, ejemplo: 6)
     * **Curso** (obligatorio, ejemplo: 1)
     * **Lista** (opcional, si no está, se asigna automáticamente)
   
   - Ejemplo de Excel:
     ```
     | Nombre          | Grado | Curso | Lista |
     |-----------------|-------|-------|-------|
     | Ana García      | 6     | 1     | 12    |
     | Luis Pérez      | 7     | 2     | 3     |
     | María Torres    | 8     | 1     | 5     |
     ```
   
   - En el panel, pestaña "Estudiantes"
   - Selecciona el archivo
   - Clic en "Importar Estudiantes"
   - Los estudiantes aparecerán con sus códigos generados

3. **Códigos de Votación**
   - Se generan automáticamente con formato: `<grado><curso><lista>`
   - Ejemplos:
     * 6°1 lista 12 → **6112**
     * 7°2 lista 03 → **7203**
     * 8°1 lista 05 → **8105**

4. **Agregar Candidatos**
   - Pestaña "Candidatos"
   - Ingresa nombre y partido/lista
   - Clic en "Agregar Candidato"

5. **Abrir Votación**
   - Pestaña "Votación"
   - Clic en "Abrir Votación"
   - Ahora los estudiantes pueden votar

6. **Ver Estadísticas**
   - Pestaña "Estadísticas"
   - Verás:
     * Total de votos
     * Participación general
     * Participación por grado
     * Resultados por candidato

7. **Cerrar Votación**
   - Pestaña "Votación"
   - Clic en "Cerrar Votación"
   - Los estudiantes ya no podrán votar

### Para Estudiantes

1. **Votar**
   - Ve a: `https://tu-proyecto.vercel.app`
   - Ingresa tu código de votación (ejemplo: 6112)
   - Selecciona un candidato
   - Confirma tu voto
   - ¡Listo! No puedes votar de nuevo

## 🔧 Estructura del Proyecto

```
votacion-escolar/
├── api/
│   └── [...path].js          # Única función serverless (backend)
├── public/
│   ├── index.html            # Página principal (votación)
│   ├── vote.html             # Página de emisión de voto
│   ├── admin.html            # Panel de administración
│   ├── app.js                # JavaScript principal
│   ├── vote.js               # JavaScript de votación
│   ├── admin.js              # JavaScript del panel admin
│   └── styles.css            # Estilos globales
├── database.sql              # Script SQL para Supabase
├── package.json              # Dependencias
├── vercel.json               # Configuración de Vercel
└── README.md                 # Este archivo
```

## 🔒 Seguridad

- ✅ Códigos de votación únicos
- ✅ Un voto por estudiante (validación atómica en base de datos)
- ✅ Service role key solo en backend (nunca expuesta)
- ✅ Votación se puede abrir/cerrar desde admin
- ✅ Registro de auditoría de todos los votos

## 🐛 Solución de Problemas

### Error: "Faltan variables de entorno"
- Verifica que agregaste `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel
- Asegúrate de usar la `service_role` key, NO la `anon` key

### No aparecen los estudiantes después de importar
- Verifica que el archivo Excel tenga las columnas correctas
- Revisa que los datos sean válidos (grado y curso numéricos)
- Verifica en Supabase > Table Editor > students si se insertaron

### Error al votar: "La votación está cerrada"
- Ve al panel admin, pestaña "Votación"
- Clic en "Abrir Votación"

### No puedo acceder al panel admin
- El código por defecto es: `ADMIN2026`
- Si lo cambiaste, verifica en Supabase > Table Editor > config

## 🎯 Modelo de Datos

### Tabla: `students`
- `id`: ID único
- `full_name`: Nombre completo
- `grade`: Grado (6, 7, 8, etc.)
- `course`: Curso (1, 2, 3, etc.)
- `list_number`: Número de lista
- `access_code`: Código único de votación
- `has_voted`: Si ya votó (true/false)
- `voted_at`: Fecha y hora del voto

### Tabla: `candidates`
- `id`: ID único
- `name`: Nombre del candidato
- `party`: Partido o lista
- `votes`: Contador de votos

### Tabla: `votes`
- `id`: ID único
- `candidate_id`: ID del candidato votado
- `created_at`: Fecha y hora del voto

### Tabla: `config`
- `id`: Siempre 1 (una sola fila)
- `election_status`: 'open' o 'closed'
- `admin_code`: Código de administrador

## 📊 Límites del Plan Gratuito

**Vercel Hobby (Gratis)**
- 100 GB de ancho de banda/mes
- 1 función serverless (✅ usamos solo 1)
- Sin límite de proyectos

**Supabase Free Tier**
- 500 MB de base de datos
- 2 GB de transferencia/mes
- Más que suficiente para una escuela

## 🔄 Actualizaciones

Para actualizar el código:

1. Haz los cambios en tu repositorio GitHub
2. Haz commit y push
3. Vercel detectará los cambios y desplegará automáticamente
4. O desde Vercel: "Deployments" → "Redeploy"

## ❓ Preguntas Frecuentes

**¿Puedo cambiar el código de administrador?**
Sí, en Supabase:
- Table Editor → `config`
- Edita el campo `admin_code`

**¿Los votos son anónimos?**
Sí, la tabla `votes` no tiene relación con `students`. Solo se registra quién votó, no por quién votó.

**¿Puedo tener múltiples elecciones?**
Este sistema está diseñado para una elección. Para múltiples elecciones necesitarías modificar el código.

**¿Cuántos estudiantes soporta?**
Miles. El plan gratuito de Supabase soporta 500 MB, suficiente para ~50,000 estudiantes.

**¿Funciona sin internet?**
No, requiere conexión a internet tanto para votar como para administrar.

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección "Solución de Problemas"
2. Verifica los logs en Vercel: "Deployments" → Clic en el deployment → "View Function Logs"
3. Verifica los logs en Supabase: "Logs" → "API"

## 📝 Licencia

Este proyecto es de código abierto. Puedes usarlo, modificarlo y distribuirlo libremente.

## 🎓 Créditos

Sistema desarrollado para facilitar elecciones escolares de forma gratuita y accesible.

---

**¿Listo para tu primera votación?** 🗳️

Sigue las instrucciones paso a paso y en 15 minutos tendrás tu sistema funcionando.
