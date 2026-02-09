// vote.js - Página de emisión de voto

const API_BASE = '/api';

let accessCode = '';
let selectedCandidateId = null;

window.addEventListener('DOMContentLoaded', async () => {
    // Verificar que venimos de la página anterior
    accessCode = sessionStorage.getItem('accessCode');
    const studentName = sessionStorage.getItem('studentName');

    if (!accessCode || !studentName) {
        window.location.href = '/';
        return;
    }

    // Mostrar nombre del estudiante
    document.getElementById('studentName').textContent = `Bienvenido/a, ${studentName}`;

    // Cargar candidatos
    await loadCandidates();
});

async function loadCandidates() {
    try {
        const response = await fetch(`${API_BASE}/candidates`);
        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            renderCandidates(data.candidates);
        } else {
            showMessage('No hay candidatos disponibles', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al cargar candidatos', 'error');
    }
}

function renderCandidates(candidates) {
    const container = document.getElementById('candidatesContainer');
    container.innerHTML = '';

    candidates.forEach(candidate => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.innerHTML = `
            <h3>${candidate.name}</h3>
            <p>${candidate.party}</p>
        `;

        card.addEventListener('click', () => {
            selectedCandidateId = candidate.id;
            confirmVote(candidate);
        });

        container.appendChild(card);
    });
}

function confirmVote(candidate) {
    if (confirm(`¿Confirmas tu voto por ${candidate.name} (${candidate.party})?
    
Esta acción no se puede deshacer.`)) {
        castVote();
    }
}

async function castVote() {
    if (!selectedCandidateId) {
        showMessage('Selecciona un candidato', 'error');
        return;
    }

    try {
        showMessage('Registrando tu voto...', 'info');

        const response = await fetch(`${API_BASE}/vote/cast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_code: accessCode,
                candidate_id: selectedCandidateId
            })
        });

        const data = await response.json();

        if (data.success) {
            // Limpiar sessionStorage
            sessionStorage.removeItem('accessCode');
            sessionStorage.removeItem('studentName');

            // Mostrar mensaje de éxito
            document.getElementById('candidatesContainer').innerHTML = `
                <div class="card" style="text-align: center; padding: 40px;">
                    <h2 style="color: #28a745; margin-bottom: 20px;">✅ ¡Voto Registrado!</h2>
                    <p style="font-size: 1.1em; color: #555;">Tu voto ha sido registrado exitosamente.</p>
                    <p style="margin-top: 20px;"><a href="/" style="color: #667eea; font-weight: 600;">Volver al inicio</a></p>
                </div>
            `;
            document.getElementById('statusMessage').style.display = 'none';
        } else {
            showMessage(data.error || 'Error al registrar voto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
    }
}

function showMessage(message, type) {
    const statusMsg = document.getElementById('statusMessage');
    statusMsg.textContent = message;
    statusMsg.className = `status-message ${type}`;
}
