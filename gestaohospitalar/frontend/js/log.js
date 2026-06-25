function renderErrorLogs() {
    const logs = getErrorLogs()
    const body = document.getElementById('error-log-body')

    if (!body) return

    if (!logs || logs.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="5">Nenhum log de erro encontrado.</td>
            </tr>
        `
        return
    }

    body.innerHTML = logs.map((log) => `
        <tr>
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${log.page}</td>
            <td>${log.action}</td>
            <td>${log.message}</td>
            <td>${log.details ? `<pre class="log-details">${escapeHtml(log.details)}</pre>` : '-'}</td>
        </tr>
    `).join('')
}

function escapeHtml(value) {
    if (value == null) return ''
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

const refreshButton = document.getElementById('refresh-log-button')
const clearButton = document.getElementById('clear-log-button')

refreshButton?.addEventListener('click', () => {
    renderErrorLogs()
})

clearButton?.addEventListener('click', () => {
    const confirmClear = confirm('Deseja limpar todos os logs de erro?')
    if (!confirmClear) return

    clearErrorLogs()
    renderErrorLogs()
})

renderErrorLogs()
