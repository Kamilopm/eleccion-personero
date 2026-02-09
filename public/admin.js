// admin.js - Panel de administración

const API_BASE = '/api';
let adminCode = '';

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = document.getElementById('adminCode').value.trim();
    
    try {
        const response = await fetch(`${API_BASE}/admin/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: code })
        });

        const data = await response.json();

        if (data.valid) {
            adminCode = code;
            sessionStorage.setItem('adminCode', code);
            showAdminPanel();
        } else {
            showMessage('Código incorrecto', 'error', 'statusMessage');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error', 'statusMessage');
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    adminCode = '';
    sessionStorage.removeItem('adminCode');
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
});

// Verificar si ya hay sesión
window.addEventListener('DOMContentLoaded', () => {
    const savedCode = sessionStorage.getItem('adminCode');
    if (savedCode) {
        adminCode = savedCode;
        verifyAndShowPanel();
    }
});

async function verifyAndShowPanel() {
    try {
        const response = await fetch(`${API_BASE}/admin/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: adminCode })
        });

        const data = await response.json();

        if (data.valid) {
            showAdminPanel();
        } else {
            sessionStorage.removeItem('adminCode');
        }
    } catch (error) {
        sessionStorage.removeItem('adminCode');
    }
}

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    
    // Cargar datos iniciales
    loadStudents();
    loadCandidates();
    loadElectionStatus();
    loadStats();
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Cambiar tab activa
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tab}Tab`).classList.add('active');
        
        // Recargar datos si es necesario
        if (tab === 'students') loadStudents();
        if (tab === 'candidates') loadCandidates();
        if (tab === 'election') loadElectionStatus();
        if (tab === 'stats') loadStats();
    });
});

// ESTUDIANTES
document.getElementById('importBtn')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('Selecciona un archivo', 'error', 'adminStatus');
        return;
    }

    try {
        showMessage('Procesando archivo...', 'info', 'adminStatus');
        
        // Leer archivo como base64
        const base64 = await readFileAsBase64(file);
        
        const response = await fetch(`${API_BASE}/admin/import-students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_code: adminCode,
                file_base64: base64,
                filename: file.name
            })
        });

        const data = await response.json();

        if (data.success) {
            let message = `✅ Estudiantes importados: ${data.inserted}`;
            if (data.duplicates > 0) {
                message += ` | Duplicados omitidos: ${data.duplicates}`;
            }
            if (data.errors) {
                message += `\n\nErrores: ${data.errors.join(', ')}`;
            }
            showMessage(message, 'success', 'adminStatus');
            loadStudents();
            fileInput.value = '';
        } else {
            showMessage(data.error || 'Error al importar', 'error', 'adminStatus');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al procesar archivo', 'error', 'adminStatus');
    }
});

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

document.getElementById('refreshStudents')?.addEventListener('click', loadStudents);

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/admin/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: adminCode })
        });

        const data = await response.json();

        if (data.students) {
            document.getElementById('studentCount').textContent = data.students.length;
            renderStudentsTable(data.students);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderStudentsTable(students) {
    const container = document.getElementById('studentsTable');
    
    if (students.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No hay estudiantes registrados</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Grado</th>
                    <th>Curso</th>
                    <th>Lista</th>
                    <th>Código</th>
                    <th>Votó</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
    `;

    students.forEach(student => {
        html += `
            <tr>
                <td>${student.full_name}</td>
                <td>${student.grade}°</td>
                <td>${student.course}</td>
                <td>${student.list_number}</td>
                <td><strong>${student.access_code}</strong></td>
                <td>${student.has_voted ? '✅' : '❌'}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteStudent(${student.id})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

async function deleteStudent(id) {
    if (!confirm('¿Eliminar este estudiante?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/students/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: adminCode, student_id: id })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Estudiante eliminado', 'success', 'adminStatus');
            loadStudents();
        }
    } catch (error) {
        showMessage('Error al eliminar', 'error', 'adminStatus');
    }
}

// CANDIDATOS
document.getElementById('addCandidateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('candidateName').value.trim();
    const party = document.getElementById('candidateParty').value.trim();

    try {
        const response = await fetch(`${API_BASE}/admin/candidates/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: adminCode, name, party })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Candidato agregado', 'success', 'adminStatus');
            document.getElementById('addCandidateForm').reset();
            loadCandidates();
        }
    } catch (error) {
        showMessage('Error al agregar candidato', 'error', 'adminStatus');
    }
});

async function loadCandidates() {
    try {
        const response = await fetch(`${API_BASE}/candidates`);
        const data = await response.json();

        if (data.candidates) {
            renderCandidatesTable(data.candidates);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderCandidatesTable(candidates) {
    const container = document.getElementById('candidatesTable');
    
    if (candidates.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No hay candidatos registrados</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Partido / Lista</th>
                    <th>Votos</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
    `;

    candidates.forEach(candidate => {
        html += `
            <tr>
                <td>${candidate.name}</td>
                <td>${candidate.party}</td>
                <td>${candidate.votes}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteCandidate(${candidate.id})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

async function deleteCandidate(id) {
    if (!confirm('¿Eliminar este candidato?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/candidates/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: adminCode, candidate_id: id })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Candidato eliminado', 'success', 'adminStatus');
            loadCandidates();
        }
    } catch (error) {
        showMessage('Error al eliminar', 'error', 'adminStatus');
    }
}

// VOTACIÓN
document.getElementById('openElection')?.addEventListener('click', async () => {
    await updateElectionStatus('open');
});

document.getElementById('closeElection')?.addEventListener('click', async () => {
    if (!confirm('¿Cerrar la votación? Los estudiantes no podrán votar más.')) return;
    await updateElectionStatus('closed');
});

async function updateElectionStatus(status) {
    try {
        const response = await fetch(`${API_BASE}/admin/election-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: adminCode, status })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(`Votación ${status === 'open' ? 'abierta' : 'cerrada'}`, 'success', 'adminStatus');
            loadElectionStatus();
        }
    } catch (error) {
        showMessage('Error al actualizar estado', 'error', 'adminStatus');
    }
}

async function loadElectionStatus() {
    try {
        const response = await fetch(`${API_BASE}/config`);
        const data = await response.json();

        const statusText = data.election_status === 'open' ? '🟢 ABIERTA' : '🔴 CERRADA';
        document.getElementById('electionStatus').textContent = statusText;
    } catch (error) {
        console.error('Error:', error);
    }
}

// ESTADÍSTICAS
document.getElementById('refreshStats')?.addEventListener('click', loadStats);

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/admin/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: adminCode })
        });

        const data = await response.json();

        if (data) {
            renderStats(data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderStats(stats) {
    const container = document.getElementById('statsContainer');

    let html = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${stats.totalStudents}</h3>
                <p>Total Estudiantes</p>
            </div>
            <div class="stat-card">
                <h3>${stats.totalVotes}</h3>
                <p>Total Votos</p>
            </div>
            <div class="stat-card">
                <h3>${stats.participation}%</h3>
                <p>Participación</p>
            </div>
        </div>

        <div class="results-table">
            <h3>Resultados por Candidato</h3>
            <table>
                <thead>
                    <tr>
                        <th>Candidato</th>
                        <th>Partido</th>
                        <th>Votos</th>
                        <th>Porcentaje</th>
                    </tr>
                </thead>
                <tbody>
    `;

    stats.candidates.forEach(candidate => {
        const percentage = stats.totalVotes > 0 
            ? Math.round((candidate.votes / stats.totalVotes) * 100) 
            : 0;
        
        html += `
            <tr>
                <td><strong>${candidate.name}</strong></td>
                <td>${candidate.party}</td>
                <td>${candidate.votes}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        <div class="grade-participation">
            <h3>Participación por Grado</h3>
            <table>
                <thead>
                    <tr>
                        <th>Grado</th>
                        <th>Total Estudiantes</th>
                        <th>Votaron</th>
                        <th>Participación</th>
                    </tr>
                </thead>
                <tbody>
    `;

    stats.participationByGrade.forEach(grade => {
        html += `
            <tr>
                <td>${grade.grade}°</td>
                <td>${grade.total}</td>
                <td>${grade.voted}</td>
                <td>${grade.percentage}%</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// Utilidad
function showMessage(message, type, elementId) {
    const statusMsg = document.getElementById(elementId);
    if (statusMsg) {
        statusMsg.textContent = message;
        statusMsg.className = `status-message ${type}`;
    }
}

// Hacer funciones globales para onclick
window.deleteStudent = deleteStudent;
window.deleteCandidate = deleteCandidate;
