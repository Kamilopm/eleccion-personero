# 🏗️ ARQUITECTURA TÉCNICA DEL SISTEMA

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (HTML + CSS + JavaScript puro - Servido desde /public)    │
├─────────────────────────────────────────────────────────────┤
│  • index.html      → Página principal (ingreso código)      │
│  • vote.html       → Página de emisión de voto              │
│  • admin.html      → Panel de administración                │
│  • app.js          → Lógica principal                       │
│  • vote.js         → Lógica de votación                     │
│  • admin.js        → Lógica del panel admin                 │
│  • styles.css      → Estilos globales                       │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP Requests
┌─────────────────────────────────────────────────────────────┐
│                    SERVERLESS FUNCTION                       │
│              (UNA SOLA: /api/[...path].js)                  │
├─────────────────────────────────────────────────────────────┤
│  Enrutamiento Manual:                                       │
│  • /api/health              → Health check                  │
│  • /api/config              → Configuración de votación     │
│  • /api/admin/verify        → Verificar código admin        │
│  • /api/admin/students      → Gestión de estudiantes        │
│  • /api/admin/candidates    → Gestión de candidatos         │
│  • /api/vote/verify         → Verificar código de votación  │
│  • /api/vote/cast           → Emitir voto (función atómica) │
│  • /api/admin/stats         → Estadísticas                  │
└─────────────────────────────────────────────────────────────┘
                              ↓ SQL Queries
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  • students      → Estudiantes y códigos de votación        │
│  • candidates    → Candidatos y contador de votos           │
│  • votes         → Registro de votos (auditoría)            │
│  • config        → Configuración global (estado votación)   │
│  • cast_vote()   → Función SQL atómica para votar           │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Votación

### 1. Estudiante Ingresa Código
```
Usuario → index.html → app.js
  ↓
  POST /api/vote/verify { access_code: "6112" }
  ↓
  SELECT * FROM students WHERE access_code = '6112'
  ↓
  Si válido y no ha votado → Redirige a vote.html
  Si inválido → Muestra error
  Si ya votó → Bloquea acceso
```

### 2. Estudiante Vota
```
Usuario selecciona candidato → vote.js
  ↓
  POST /api/vote/cast { access_code: "6112", candidate_id: 1 }
  ↓
  SELECT election_status FROM config → Verifica que esté abierta
  ↓
  CALL cast_vote('6112', 1) → Función atómica SQL
  ↓
  Transacción atómica:
    1. Verificar código existe
    2. Verificar no ha votado
    3. Marcar estudiante como votado
    4. Insertar voto en tabla votes
    5. Incrementar contador del candidato
  ↓
  Si éxito → Muestra confirmación
  Si error → Rollback automático
```

### 3. Admin Importa Estudiantes
```
Admin sube Excel → admin.js
  ↓
  Leer archivo en navegador (FileReader)
  ↓
  Convertir a base64
  ↓
  POST /api/admin/import-students { file_base64, filename }
  ↓
  Backend:
    1. Decodificar base64
    2. Parsear Excel con XLSX
    3. Validar columnas (Nombre, Grado, Curso)
    4. Generar códigos: <grado><curso><lista>
    5. INSERT INTO students (evita duplicados)
  ↓
  Retorna cantidad insertada y duplicados omitidos
```

## 🔐 Seguridad

### Autenticación y Autorización

```
┌──────────────────────────────────────────────────────────┐
│ Nivel Frontend (sessionStorage)                          │
├──────────────────────────────────────────────────────────┤
│ • access_code (temporal, solo durante votación)         │
│ • adminCode (temporal, sesión admin)                     │
│ • NO se almacena nada permanente                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Nivel Backend (cada request)                             │
├──────────────────────────────────────────────────────────┤
│ • Rutas admin: Verifican admin_code en tabla config     │
│ • Rutas voto: Verifican access_code en tabla students   │
│ • Función cast_vote: Validación atómica en SQL          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Nivel Base de Datos                                      │
├──────────────────────────────────────────────────────────┤
│ • service_role key: Solo en backend (variable entorno)  │
│ • Constraints: UNIQUE en access_code                     │
│ • Función SQL: SECURITY DEFINER con validaciones        │
│ • Transacciones: Garantizan atomicidad                   │
└──────────────────────────────────────────────────────────┘
```

### Prevención de Fraude

**1. Doble Votación (Impedida por)**
- Columna `has_voted` en tabla students
- Función SQL `cast_vote` verifica antes de insertar
- Lock de fila en SQL (FOR UPDATE)
- Transacción atómica (todo o nada)

**2. Códigos Duplicados (Impedido por)**
- Constraint UNIQUE en columna `access_code`
- Validación al importar Excel
- Base de datos rechaza duplicados

**3. Votación Cerrada (Impedida por)**
- Verificación de `election_status` antes de permitir voto
- Frontend también verifica (pero no confía solo en eso)
- Backend hace validación definitiva

## 📊 Modelo de Datos Completo

```sql
┌────────────────────────────────────────────────────────────┐
│ students                                                    │
├────────────────────────────────────────────────────────────┤
│ id              BIGSERIAL PRIMARY KEY                      │
│ full_name       TEXT NOT NULL                              │
│ grade           INTEGER CHECK (grade > 0 AND grade <= 13)  │
│ course          INTEGER CHECK (course > 0)                 │
│ list_number     INTEGER CHECK (list_number > 0)            │
│ access_code     TEXT UNIQUE NOT NULL                       │
│ has_voted       BOOLEAN DEFAULT FALSE                      │
│ voted_at        TIMESTAMP                                  │
│ created_at      TIMESTAMP DEFAULT NOW()                    │
├────────────────────────────────────────────────────────────┤
│ Índices:                                                   │
│ • idx_students_access_code (búsqueda rápida)             │
│ • idx_students_grade (estadísticas)                       │
│ • idx_students_has_voted (conteo votos)                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ candidates                                                  │
├────────────────────────────────────────────────────────────┤
│ id              BIGSERIAL PRIMARY KEY                      │
│ name            TEXT NOT NULL                              │
│ party           TEXT NOT NULL                              │
│ votes           INTEGER DEFAULT 0 CHECK (votes >= 0)       │
│ created_at      TIMESTAMP DEFAULT NOW()                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ votes (auditoría - no relacionado con students)           │
├────────────────────────────────────────────────────────────┤
│ id              BIGSERIAL PRIMARY KEY                      │
│ candidate_id    BIGINT REFERENCES candidates(id)           │
│ created_at      TIMESTAMP DEFAULT NOW()                    │
├────────────────────────────────────────────────────────────┤
│ Índices:                                                   │
│ • idx_votes_candidate_id (conteo por candidato)           │
│ • idx_votes_created_at (análisis temporal)                │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ config (una sola fila)                                     │
├────────────────────────────────────────────────────────────┤
│ id              INTEGER PRIMARY KEY DEFAULT 1              │
│ election_status TEXT CHECK (status IN ('open','closed'))   │
│ admin_code      TEXT NOT NULL                              │
│ created_at      TIMESTAMP DEFAULT NOW()                    │
├────────────────────────────────────────────────────────────┤
│ Constraint: SOLO puede existir id = 1                     │
└────────────────────────────────────────────────────────────┘
```

## ⚡ Optimizaciones

### Frontend
- **Sin frameworks**: Carga instantánea
- **sessionStorage**: Solo datos temporales durante votación
- **Validación client-side**: Reduce requests innecesarios
- **CSS puro**: Sin dependencias externas

### Backend
- **UNA función**: Cumple límite de Vercel Hobby
- **Enrutamiento eficiente**: Sin overhead de Express
- **Conexión persistente**: Supabase mantiene pool de conexiones
- **Sin procesamiento pesado**: Excel se parsea en memoria

### Base de Datos
- **Índices estratégicos**: Búsquedas en O(log n)
- **Función SQL atómica**: Menos round trips
- **Constraints en DB**: Validación a nivel más bajo
- **Optimización de queries**: SELECT solo campos necesarios

## 🚀 Escalabilidad

### Límites del Sistema (Plan Gratuito)

**Vercel Hobby:**
- Hasta 100 GB transferencia/mes
- 1 función serverless (✅ usamos 1)
- Límite de 10s por ejecución
- ~1000 requests concurrentes

**Supabase Free:**
- 500 MB base de datos
- 2 GB transferencia/mes
- Sin límite de conexiones activas
- 50,000 filas ≈ 50 MB (con índices)

### Capacidad Real

**Estudiantes:**
- Hasta ~50,000 estudiantes cómodamente
- Cada estudiante = ~1 KB en DB

**Votos concurrentes:**
- ~500-1000 votos simultáneos
- Función SQL atómica previene race conditions

**Estadísticas:**
- Cálculos en tiempo real hasta 10,000 registros
- Para más, considerar vistas materializadas

## 🛠️ Stack Tecnológico

```
┌────────────────────────────────────────────────────────────┐
│ FRONTEND                                                    │
├────────────────────────────────────────────────────────────┤
│ • HTML5                                                    │
│ • CSS3 (Grid, Flexbox, Variables CSS)                     │
│ • JavaScript ES6+ (Fetch API, Async/Await, Modules)      │
│ • NO frameworks, NO build tools                           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ BACKEND                                                     │
├────────────────────────────────────────────────────────────┤
│ • Node.js (runtime de Vercel)                             │
│ • Vercel Serverless Functions                             │
│ • @supabase/supabase-js (cliente)                         │
│ • XLSX (parseo de Excel)                                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ BASE DE DATOS                                              │
├────────────────────────────────────────────────────────────┤
│ • PostgreSQL 15 (Supabase)                                │
│ • PL/pgSQL (función cast_vote)                            │
│ • Transacciones ACID                                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ HOSTING                                                     │
├────────────────────────────────────────────────────────────┤
│ • Vercel (CDN global + Serverless)                        │
│ • Supabase (Database + API)                               │
│ • 100% Cloud, 100% Gratis                                 │
└────────────────────────────────────────────────────────────┘
```

## 🔍 Monitoreo y Debugging

### Logs en Vercel
```
Dashboard → Deployments → [Tu deployment] → View Function Logs

Ver:
- Request/Response de cada llamada
- Errores en funciones serverless
- Tiempos de ejecución
```

### Logs en Supabase
```
Dashboard → Logs → API

Ver:
- Queries SQL ejecutadas
- Errores de base de datos
- Tiempos de respuesta
```

### Métricas Importantes
```
- Total votos / Total estudiantes = Participación
- Votos por minuto (día de elección)
- Errores vs requests exitosos
- Tiempo promedio de respuesta
```

## 📝 Notas Técnicas Importantes

1. **¿Por qué UNA función serverless?**
   - Vercel Hobby limita a 1 función en plan gratuito
   - Enrutamiento manual es eficiente y simple

2. **¿Por qué service_role key?**
   - Necesitamos acceso total desde backend
   - anon key tiene Row Level Security que complicaría
   - service_role NUNCA se expone al cliente

3. **¿Por qué función SQL para votar?**
   - Atomicidad garantizada
   - Previene race conditions
   - Menos round trips (más rápido)
   - Validación a nivel de DB

4. **¿Por qué NO localStorage?**
   - No es persistente entre dispositivos
   - Fácil de manipular por el usuario
   - sessionStorage es suficiente para sesión temporal

5. **¿Por qué NO Firebase?**
   - Requisito del proyecto
   - Supabase es más familiar para devs SQL
   - PostgreSQL es más robusto para transacciones

---

**Esta arquitectura cumple TODOS los requisitos:**
- ✅ 100% gratis
- ✅ Una sola función serverless
- ✅ Sin Firebase ni localStorage
- ✅ Listo para producción
- ✅ Seguro y escalable
