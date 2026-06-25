const tableBody = document.getElementById('records-table-body')
const searchInput = document.getElementById('search-record')

const recordForm = document.getElementById('record-form')
const recordModal = document.getElementById('record-modal')

const openModalButton = document.getElementById('open-record-modal')
const closeModalButton = document.getElementById('close-record-modal')

const patientSelect = document.getElementById('record-patient')
const doctorSelect = document.getElementById('record-doctor')
const consultationSelect = document.getElementById('record-consultation')

let records = []
let patients = []
let doctors = []
let consultations = []
let editingRecordId = null

async function loadPatientsAndDoctors() {
    const token = localStorage.getItem('token')

    const headers = {
        Authorization: `Bearer ${token}`
    }

    const patientsResponse = await fetch(`${API_URL}/pacientes`, { headers })
    const doctorsResponse = await fetch(`${API_URL}/medicos`, { headers })
    const consultationsResponse = await fetch(`${API_URL}/consultas`, { headers })

    patients = await patientsResponse.json()
    doctors = await doctorsResponse.json()
    consultations = await consultationsResponse.json()

    patientSelect.innerHTML = `
        <option value="">Selecione um paciente</option>
        ${patients.map(patient => `
            <option value="${patient.id_paciente}">
                ${patient.nome}
            </option>
        `).join('')}
    `

    doctorSelect.innerHTML = `
        <option value="">Selecione um médico</option>
        ${doctors.map(doctor => `
            <option value="${doctor.id_medico}">
                ${doctor.nome} - ${doctor.especialidade}
            </option>
        `).join('')}
    `

    consultationSelect.innerHTML = `
    <option value="">
        Selecione uma consulta
    </option>

    ${consultations.map(consultation => {

        const patient = patients.find(
            p => p.id_paciente === consultation.id_paciente
        )

        const doctor = doctors.find(
            d => d.id_medico === consultation.id_medico
        )

        return `
            <option value="${consultation.id_consulta}">
                ${patient?.nome || 'Paciente'}
                - ${doctor?.nome || 'Médico'}
                - ${consultation.data_consulta}
            </option>
        `
    }).join('')}
  `
}

async function loadRecords() {
    const token = localStorage.getItem('token')

    if (!token) {
        window.location.href = './index.html'
        return
    }

    try {
        const response = await fetch(`${API_URL}/prontuarios`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        records = data

        renderRecords(records)

    } catch (error) {
        console.log(error)

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">Erro ao carregar prontuários.</td>
            </tr>
        `
    }
}

function renderRecords(list) {
    if (!list || list.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">Nenhum prontuário encontrado.</td>
            </tr>
        `
        return
    }

    tableBody.innerHTML = list.map((record) => {
        const patient = patients.find(
            p => p.id_paciente === record.id_paciente
        )

        const doctor = doctors.find(
            d => d.id_medico === record.id_medico
        )

        return `
            <tr>
                <td>${patient?.nome || '-'}</td>
                <td>${doctor?.nome || '-'}</td>
                <td>${record.diagnostico || '-'}</td>
                <td>${formatRecordDate(record.data_registro)}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-button edit" onclick="editRecord(${record.id_prontuario})">
                            <i class="ri-edit-line"></i>
                        </button>

                        <button class="action-button delete" onclick="deleteRecord(${record.id_prontuario})">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
    }).join('')
}

searchInput.addEventListener('input', () => {
    const value = searchInput.value.toLowerCase()

    const filtered = records.filter((record) => {
        const patient = patients.find(
            p => p.id_paciente === record.id_paciente
        )

        return (
            patient?.nome?.toLowerCase().includes(value) ||
            record.diagnostico?.toLowerCase().includes(value)
        )
    })

    renderRecords(filtered)
})

openModalButton.addEventListener('click', () => {
    recordModal.classList.add('active')
})

closeModalButton.addEventListener('click', closeModal)

recordModal.addEventListener('click', (event) => {
    if (event.target === recordModal) {
        closeModal()
    }
})

function closeModal() {
    recordModal.classList.remove('active')
    recordForm.reset()
    editingRecordId = null

    document.querySelector('#record-modal .modal-header h2').innerText = 'Novo prontuário'
}

recordForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const token = localStorage.getItem('token')

    const newRecord = {
        id_paciente: Number(document.getElementById('record-patient').value),
        id_medico: Number(document.getElementById('record-doctor').value),
        id_consulta: Number( document.getElementById('record-consultation').value),
        diagnostico: document.getElementById('record-diagnosis').value,
        observacoes: document.getElementById('record-observations').value,
        medicamentos: document.getElementById('record-medications').value
    }

    try {
        const url = editingRecordId
            ? `${API_URL}/prontuarios/${editingRecordId}`
            : `${API_URL}/prontuarios`

        const method = editingRecordId ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newRecord)
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao salvar prontuário')
            return
        }

        alert(
            editingRecordId
                ? 'Prontuário atualizado com sucesso!'
                : 'Prontuário cadastrado com sucesso!'
        )

        closeModal()
        loadRecords()

    } catch (error) {
        console.log(error)
        alert('Erro ao conectar com o servidor')
    }
})

function editRecord(id) {
    const record = records.find(
        r => r.id_prontuario === id
    )

    if (!record) return

    editingRecordId = id

    document.getElementById('record-patient').value = record.id_paciente || ''
    document.getElementById('record-doctor').value = record.id_medico || ''
    document.getElementById('record-diagnosis').value = record.diagnostico || ''
    document.getElementById('record-observations').value = record.observacoes || ''
    document.getElementById('record-medications').value = record.medicamentos || ''

    document.querySelector('#record-modal .modal-header h2').innerText = 'Editar prontuário'

    recordModal.classList.add('active')
}

async function deleteRecord(id) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este prontuário?')

    if (!confirmDelete) return

    const token = localStorage.getItem('token')

    try {
        const response = await fetch(`${API_URL}/prontuarios/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao excluir prontuário')
            return
        }

        alert('Prontuário excluído com sucesso!')

        loadRecords()

    } catch (error) {
        console.log(error)
        alert('Erro ao conectar com o servidor')
    }
}

function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')

    window.location.href = './index.html'
}

function formatRecordDate(date) {

    if (!date) return '-'

    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

async function initProntuarios() {
    await loadPatientsAndDoctors()
    await loadRecords()
}

initProntuarios()
