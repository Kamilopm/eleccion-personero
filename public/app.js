// app.js - Página principal de votación

const API_BASE = '/api';

document.getElementById('accessForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const accessCode = document.getElementById('accessCode').value.trim();
    const statusMsg = document.getElementById('statusMessage');
    
    if (!accessCode) {
        showMessage('Por favor ingresa tu código de votación', 'error');
        return;
    }

    try {
        // Verificar si la votación está abierta
        const configRes = await fetch(`${API_BASE}/config`);
        const config = await configRes.json();
        
        if (config.election_status !== 'open') {
            showMessage('La votación está cerrada actualmente', 'error');
            return;
        }

        // Verificar código de acceso
        showMessage('Verificando código...', 'info');
        
        const response = await fetch(`${API_BASE}/vote/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_code: accessCode })
        });

        const data = await response.json();

        if (data.valid) {
            // Guardar datos en sessionStorage (temporal)
            sessionStorage.setItem('accessCode', accessCode);
            sessionStorage.setItem('studentName', data.student_name);
            
            // Redirigir a página de votación
            window.location.href = '/vote.html';
        } else {
            showMessage(data.error || 'Código inválido', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
    }
});

function showMessage(message, type) {
    const statusMsg = document.getElementById('statusMessage');
    statusMsg.textContent = message;
    statusMsg.className = `status-message ${type}`;
}
