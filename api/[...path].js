import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Inicializar Supabase con service_role key (NUNCA usar anon key)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función auxiliar para parsear el body
async function parseBody(req) {
  // En Vercel, el body ya puede venir parseado
  if (req.body) {
    return req.body;
  }
  
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Handler principal con enrutamiento manual
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.query.path ? req.query.path.join('/') : '';
  
  // Log para debugging (puedes ver esto en Vercel Logs)
  console.log('Request:', req.method, 'Path:', path, 'URL:', req.url);

  try {
    // HEALTH CHECK
    if (path === 'health') {
      return res.status(200).json({ ok: true });
    }

    // VERIFICAR CÓDIGO DE ADMIN
    if (path === 'admin/verify' && req.method === 'POST') {
      const body = await parseBody(req);
      const { admin_code } = body;
      
      console.log('Admin verify - Código recibido:', admin_code ? 'SÍ' : 'NO');

      const { data, error } = await supabase
        .from('config')
        .select('admin_code')
        .eq('id', 1)
        .single();

      if (error || !data) {
        console.error('Error al consultar config:', error);
        return res.status(500).json({ error: 'Error al verificar código' });
      }
      
      console.log('Código en DB:', data.admin_code, 'Código recibido:', admin_code);

      if (data.admin_code === admin_code) {
        return res.status(200).json({ valid: true });
      } else {
        return res.status(401).json({ valid: false, error: 'Código incorrecto' });
      }
    }

    // OBTENER CONFIGURACIÓN
    if (path === 'config') {
      const { data, error } = await supabase
        .from('config')
        .select('election_status')
        .eq('id', 1)
        .single();

      if (error) {
        return res.status(500).json({ error: 'Error al obtener configuración' });
      }

      return res.status(200).json(data);
    }

    // ACTUALIZAR ESTADO DE VOTACIÓN
    if (path === 'admin/election-status' && req.method === 'POST') {
      const body = await parseBody(req);
      const { admin_code, status } = body;

      // Verificar admin
      const { data: config } = await supabase
        .from('config')
        .select('admin_code')
        .eq('id', 1)
        .single();

      if (!config || config.admin_code !== admin_code) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      // Actualizar estado
      const { error } = await supabase
        .from('config')
        .update({ election_status: status })
        .eq('id', 1);

      if (error) {
        return res.status(500).json({ error: 'Error al actualizar estado' });
      }

      return res.status(200).json({ success: true });
    }

    // IMPORTAR ESTUDIANTES DESDE EXCEL
    if (path === 'admin/import-students' && req.method === 'POST') {
      const body = await parseBody(req);
      const { admin_code, file_base64, filename } = body;

      // Verificar admin
      const { data: config } = await supabase
        .from('config')
        .select('admin_code')
        .eq('id', 1)
        .single();

      if (!config || config.admin_code !== admin_code) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      try {
        // Decodificar archivo
        const buffer = Buffer.from(file_base64, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
          return res.status(400).json({ error: 'El archivo está vacío' });
        }

        // Procesar estudiantes
        const students = [];
        const errors = [];
        
        // Obtener máximo número de lista actual para asignar secuencialmente
        const { data: existingStudents } = await supabase
          .from('students')
          .select('list_number')
          .order('list_number', { ascending: false })
          .limit(1);

        let nextListNumber = existingStudents && existingStudents.length > 0 
          ? existingStudents[0].list_number + 1 
          : 1;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          
          // Buscar columnas (flexible con nombres)
          const nombre = row['Nombre'] || row['nombre'] || row['NOMBRE'] || row['Nombres'] || row['NOMBRES'];
          const grado = row['Grado'] || row['grado'] || row['GRADO'] || row['Curso'] || row['curso'];
          const curso = row['Curso'] || row['curso'] || row['CURSO'] || row['Sección'] || row['seccion'];
          let lista = row['Lista'] || row['lista'] || row['LISTA'] || row['Número'] || row['numero'];

          // Validar campos obligatorios
          if (!nombre || !grado || !curso) {
            errors.push(`Fila ${i + 2}: Faltan datos obligatorios (Nombre, Grado, Curso)`);
            continue;
          }

          // Normalizar grado y curso
          const gradeNum = parseInt(String(grado).replace(/[^\d]/g, ''));
          const courseNum = parseInt(String(curso).replace(/[^\d]/g, ''));

          if (isNaN(gradeNum) || isNaN(courseNum)) {
            errors.push(`Fila ${i + 2}: Grado o Curso inválidos`);
            continue;
          }

          // Asignar número de lista
          let listNumber;
          if (lista) {
            listNumber = parseInt(String(lista).replace(/[^\d]/g, ''));
            if (isNaN(listNumber)) {
              listNumber = nextListNumber++;
            }
          } else {
            listNumber = nextListNumber++;
          }

          // Generar código de acceso: <grado><curso><lista>
          const accessCode = `${gradeNum}${courseNum}${String(listNumber).padStart(2, '0')}`;

          students.push({
            full_name: nombre.trim(),
            grade: gradeNum,
            course: courseNum,
            list_number: listNumber,
            access_code: accessCode,
            has_voted: false
          });
        }

        if (students.length === 0) {
          return res.status(400).json({ 
            error: 'No se pudieron procesar estudiantes',
            details: errors 
          });
        }

        // Insertar estudiantes (ignorar duplicados)
        const { data: inserted, error: insertError } = await supabase
          .from('students')
          .insert(students)
          .select();

        if (insertError) {
          // Si hay error de duplicados, intentar insertar uno por uno
          let successCount = 0;
          let duplicateCount = 0;

          for (const student of students) {
            const { error: singleError } = await supabase
              .from('students')
              .insert(student);

            if (!singleError) {
              successCount++;
            } else if (singleError.code === '23505') {
              duplicateCount++;
            }
          }

          return res.status(200).json({ 
            success: true,
            inserted: successCount,
            duplicates: duplicateCount,
            errors: errors.length > 0 ? errors : undefined
          });
        }

        return res.status(200).json({ 
          success: true,
          inserted: inserted.length,
          errors: errors.length > 0 ? errors : undefined
        });

      } catch (error) {
        console.error('Error procesando Excel:', error);
        return res.status(500).json({ 
          error: 'Error al procesar archivo',
          details: error.message 
        });
      }
    }

    // OBTENER ESTUDIANTES
    if (path === 'admin/students') {
      const body = req.method === 'POST' ? await parseBody(req) : {};
      const { admin_code } = body;

      // Verificar admin
      const { data: config } = await supabase
        .from('config')
        .select('admin_code')
        .eq('id', 1)
        .single();

      if (!config || config.admin_code !== admin_code) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('grade', { ascending: true })
        .order('course', { ascending: true })
        .order('list_number', { ascending: true });

      if (error) {
        return res.status(500).json({ error: 'Error al obtener estudiantes' });
      }

      return res.status(200).json({ students: data });
    }

    // ELIMINAR ESTUDIANTE
    if (path === 'admin/students/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const { admin_code, student_id } = body;

      // Verificar admin
      const { data: config } = await supabase
        .from('config')
        .select('admin_code')
        .eq('id', 1)
        .single();

      if (!config || config.admin_code !== admin_code) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student_id);

      if (error) {
        return res.status(500).json({ error: 'Error al eliminar estudiante' });
      }

      return res.status(200).json({ success: true });
    }

    // OBTENER CANDIDATOS
    if (path === 'candidates') {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        return res.status(500).json({ error: 'Error al obtener candidatos' });
      }

      return res.status(200).json({ candidates: data });
    }

    // AGREGAR CANDIDATO
    if (path === 'admin/candidates/add' && req.method === 'POST') {
      const body = await parseBody(req);
      const { admin_code, name, party } = body;

      // Verificar admin
      const { data: config } = await supabase
        .from('config')
        .select('admin_code')
        .eq('id', 1)
        .single();

      if (!config || config.admin_code !== admin_code) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { data, error } = await supabase
        .from('candidates')
        .insert({ name, party, votes: 0 })
        .select();

      if (error) {
        return res.status(500).json({ error: 'Error al agregar candidato' });
      }

      return res.status(200).json({ success: true, candidate: data[0] });
    }

    // ELIMINAR CANDIDATO
    if (path === 'admin/candidates/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const { admin_code, candidate_id } = body;

      // Verificar admin
      const { data: config } = await supabase
        .from('config')
        .select('admin_code')
        .eq('id', 1)
        .single();

      if (!config || config.admin_code !== admin_code) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidate_id);

      if (error) {
        return res.status(500).json({ error: 'Error al eliminar candidato' });
      }

      return res.status(200).json({ success: true });
    }

    // VERIFICAR CÓDIGO DE VOTACIÓN
    if (path === 'vote/verify' && req.method === 'POST') {
      const body = await parseBody(req);
      const { access_code } = body;

      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, has_voted')
        .eq('access_code', access_code)
        .single();

      if (error || !data) {
        return res.status(404).json({ valid: false, error: 'Código no encontrado' });
      }

      if (data.has_voted) {
        return res.status(403).json({ valid: false, error: 'Ya has votado' });
      }

      return res.status(200).json({ 
        valid: true, 
        student_name: data.full_name 
      });
    }

    // EMITIR VOTO (usando función SQL atómica)
    if (path === 'vote/cast' && req.method === 'POST') {
      const body = await parseBody(req);
      const { access_code, candidate_id } = body;

      // Verificar que la votación esté abierta
      const { data: config } = await supabase
        .from('config')
        .select('election_status')
        .eq('id', 1)
        .single();

      if (!config || config.election_status !== 'open') {
        return res.status(403).json({ error: 'La votación está cerrada' });
      }

      // Llamar a la función SQL atómica
      const { data, error } = await supabase
        .rpc('cast_vote', {
          p_access_code: access_code,
          p_candidate_id: candidate_id
        });

      if (error) {
        console.error('Error al votar:', error);
        return res.status(400).json({ error: error.message || 'Error al registrar voto' });
      }

      if (!data) {
        return res.status(400).json({ error: 'No se pudo registrar el voto' });
      }

      return res.status(200).json({ success: true });
    }

    // OBTENER ESTADÍSTICAS
    if (path === 'admin/stats') {
      const body = req.method === 'POST' ? await parseBody(req) : {};
      const { admin_code } = body;

      // Verificar admin
      const { data: config } = await supabase
        .from('config')
        .select('admin_code')
        .eq('id', 1)
        .single();

      if (!config || config.admin_code !== admin_code) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      // Total estudiantes
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Total votos
      const { count: totalVotes } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('has_voted', true);

      // Votos por candidato
      const { data: candidates } = await supabase
        .from('candidates')
        .select('*')
        .order('votes', { ascending: false });

      // Participación por grado
      const { data: students } = await supabase
        .from('students')
        .select('grade, has_voted');

      const byGrade = {};
      students.forEach(s => {
        if (!byGrade[s.grade]) {
          byGrade[s.grade] = { total: 0, voted: 0 };
        }
        byGrade[s.grade].total++;
        if (s.has_voted) {
          byGrade[s.grade].voted++;
        }
      });

      const participationByGrade = Object.keys(byGrade).map(grade => ({
        grade: parseInt(grade),
        total: byGrade[grade].total,
        voted: byGrade[grade].voted,
        percentage: Math.round((byGrade[grade].voted / byGrade[grade].total) * 100)
      })).sort((a, b) => a.grade - b.grade);

      return res.status(200).json({
        totalStudents,
        totalVotes,
        participation: totalStudents > 0 ? Math.round((totalVotes / totalStudents) * 100) : 0,
        candidates,
        participationByGrade
      });
    }

    // Ruta no encontrada
    console.log('⚠️ Ruta no encontrada:', path, 'Método:', req.method);
    return res.status(404).json({ 
      error: 'Ruta no encontrada',
      path: path,
      method: req.method,
      availableRoutes: [
        'GET /api/health',
        'GET /api/config',
        'GET /api/candidates',
        'POST /api/admin/verify',
        'POST /api/admin/election-status',
        'POST /api/admin/import-students',
        'POST /api/admin/students',
        'POST /api/admin/students/delete',
        'POST /api/admin/candidates/add',
        'POST /api/admin/candidates/delete',
        'POST /api/vote/verify',
        'POST /api/vote/cast',
        'POST /api/admin/stats'
      ]
    });

  } catch (error) {
    console.error('Error en handler:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
