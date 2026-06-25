const tableBody = document.getElementById('consultations-table-body')
const searchInput = document.getElementById('search-consultation')

const consultationForm = document.getElementById('consultation-form')
const consultationModal = document.getElementById('consultation-modal')

const openModalButton = document.getElementById('open-consultation-modal')
const closeModalButton = document.getElementById('close-consultation-modal')

const patientSelect = document.getElementById('consultation-patient')
const doctorSelect = document.getElementById('consultation-doctor')

let consultations = []
let patients = []
let doctors = []
let editingConsultationId = null

async function loadConsultations() {
    const token = localStorage.getItem('token')

    if (!token) {
        window.location.href = './index.html'
        return
    }

    try {
        const response = await fetch(`${API_URL}/consultas`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        consultations = data

        renderConsultations(consultations)

    } catch (error) {
        console.log(error)

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Erro ao carregar consultas.</td>
            </tr>
        `
    }
}

async function loadPatientsAndDoctors() {
    const token = localStorage.getItem('token')

    try {
        const patientsResponse = await fetch(`${API_URL}/pacientes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const doctorsResponse = await fetch(`${API_URL}/medicos`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        patients = await patientsResponse.json()
        doctors = await doctorsResponse.json()

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

    } catch (error) {
        console.log(error)
    }
}

function renderConsultations(list) {
    if (!list || list.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Nenhuma consulta encontrada.</td>
            </tr>
        `
        return
    }

    tableBody.innerHTML = list.map((consultation) => {
        const paciente = patients.find(
            p => p.id_paciente === consultation.id_paciente
        )

        const medico = doctors.find(
            d => d.id_medico === consultation.id_medico
        )

        return `
            <tr>
                <td>${paciente?.nome || '-'}</td>
                <td>${medico?.nome || '-'}</td>
                <td>${formatConsultationDate(consultation.data_consulta, consultation.horario)}</td>
                <td>${consultation.motivo || '-'}</td>
                <td>
                    <span class="status ${getStatusClass(consultation.status)}">
                        ${consultation.status || 'Agendada'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-button edit" onclick="editConsultation(${consultation.id_consulta})">
                            <i class="ri-edit-line"></i>
                        </button>

                        <button class="action-button delete" onclick="deleteConsultation(${consultation.id_consulta})">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
    }).join('')
}

function formatDate(date) {
    if (!date) return '-'

    return new Date(date).toLocaleString('pt-BR')
}

function formatConsultationDate(data, horario) {

    if (!data) return '-'

    const formattedDate = new Date(data)
        .toLocaleDateString('pt-BR')

    const formattedTime = horario
        ? horario.slice(0, 5)
        : '--:--'

    return `${formattedDate} • ${formattedTime}`
}

searchInput.addEventListener('input', () => {
    const value = searchInput.value.toLowerCase()

    const filtered = consultations.filter((consultation) => {

        const patient = patients.find(
            p => p.id_paciente === consultation.id_paciente
        )

        const doctor = doctors.find(
            d => d.id_medico === consultation.id_medico
        )

        return (
            patient?.nome?.toLowerCase().includes(value) ||
            doctor?.nome?.toLowerCase().includes(value) ||
            consultation.status?.toLowerCase().includes(value)
        )
    })

    renderConsultations(filtered)
})

openModalButton.addEventListener('click', () => {
    consultationModal.classList.add('active')
})

closeModalButton.addEventListener('click', closeModal)

consultationModal.addEventListener('click', (event) => {
    if (event.target === consultationModal) {
        closeModal()
    }
})

function closeModal() {
    consultationModal.classList.remove('active')
    consultationForm.reset()
    editingConsultationId = null

    document.querySelector('#consultation-modal .modal-header h2').innerText = 'Nova consulta'
}

consultationForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const token = localStorage.getItem('token')

    const newConsultation = {

        id_paciente: Number(
            document.getElementById('consultation-patient').value
        ),

        id_medico: Number(
            document.getElementById('consultation-doctor').value
        ),

        data_consulta:
            document.getElementById('consultation-date')
                .value
                .split('T')[0],

        horario:
            document.getElementById('consultation-date')
                .value
                .split('T')[1],

        motivo:
            document.getElementById('consultation-reason').value,

        status:
            document.getElementById('consultation-status').value
    }

    try {
        const url = editingConsultationId
            ? `${API_URL}/consultas/${editingConsultationId}`
            : `${API_URL}/consultas`

        const method = editingConsultationId ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newConsultation)
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao salvar consulta')
            return
        }

        alert(
            editingConsultationId
                ? 'Consulta atualizada com sucesso!'
                : 'Consulta cadastrada com sucesso!'
        )

        closeModal()
        loadConsultations()

    } catch (error) {
        console.log(error)
        alert('Erro ao conectar com o servidor')
    }
})

function editConsultation(id) {
    const consultation = consultations.find((c) => c.id_consulta === id)

    if (!consultation) return

    editingConsultationId = id

    document.getElementById('consultation-patient').value = consultation.id_paciente || ''
    document.getElementById('consultation-doctor').value = consultation.id_medico || ''
    document.getElementById('consultation-date').value = consultation.data_consulta && consultation.horario ? `${consultation.data_consulta}T${consultation.horario}` : ''
    document.getElementById('consultation-reason').value = consultation.motivo || ''
    document.getElementById('consultation-status').value = consultation.status || 'Agendada'

    document.querySelector('#consultation-modal .modal-header h2').innerText = 'Editar consulta'

    consultationModal.classList.add('active')
}

async function deleteConsultation(id) {
    const confirmDelete = confirm('Tem certeza que deseja cancelar/excluir esta consulta?')

    if (!confirmDelete) return

    const token = localStorage.getItem('token')

    try {
        const response = await fetch(`${API_URL}/consultas/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao excluir consulta')
            return
        }

        alert('Consulta removida com sucesso!')

        loadConsultations()

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

async function initConsultas() {
    await loadPatientsAndDoctors()
    await loadConsultations()
}

initConsultas()
