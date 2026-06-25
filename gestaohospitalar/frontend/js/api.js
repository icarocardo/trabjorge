const API_URL = 'http://localhost:3000'

function getToken() {
    return localStorage.getItem('token')
}

function getAuthHeaders() {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}

function requireAuth() {
    const token = getToken()

    if (!token) {
        window.location.href = './index.html'
        return null
    }

    return token
}

function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')

    window.location.href = './index.html'
}

function getStatusClass(status) {
    if (!status) return 'pending'

    const normalized = String(status).toLowerCase()

    if (normalized === 'cancelada' || normalized === 'inativo') return 'inactive'
    if (normalized === 'concluída' || normalized === 'concluida' || normalized === 'disponível' || normalized === 'disponivel' || normalized === 'alta' || normalized === 'ativo') return 'done'
    return 'pending'
}

function openModal(modal) {
    if (!modal) return
    modal.classList.add('active')
}

function closeModal(modal) {
    if (!modal) return
    modal.classList.remove('active')
}

function formatDate(dateValue, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
    if (!dateValue) return '-'

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('pt-BR', options)
}

function formatDateTime(dateValue) {
    if (!dateValue) return '-'

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const ERROR_LOG_KEY = 'errorLogs'

function getErrorLogs() {
    try {
        const logs = localStorage.getItem(ERROR_LOG_KEY)
        return logs ? JSON.parse(logs) : []
    } catch (error) {
        console.error('Falha ao ler logs de erro', error)
        return []
    }
}

function saveErrorLogs(logs) {
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs))
}

function logError(entry) {
    const logs = getErrorLogs()
    const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        page: entry.page || 'Desconhecido',
        action: entry.action || 'N/A',
        message: entry.message || 'Erro não identificado',
        details: entry.details || null
    }

    logs.unshift(newEntry)

    if (logs.length > 200) {
        logs.splice(200)
    }

    saveErrorLogs(logs)
}

function clearErrorLogs() {
    localStorage.removeItem(ERROR_LOG_KEY)
}
