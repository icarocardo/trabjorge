const tableBody = document.getElementById('internments-table-body')
const searchInput = document.getElementById('search-internment')

const internmentForm = document.getElementById('internment-form')
const internmentModal = document.getElementById('internment-modal')

const openModalButton = document.getElementById('open-internment-modal')
const closeModalButton = document.getElementById('close-internment-modal')

const patientSelect = document.getElementById('internment-patient')
const doctorSelect = document.getElementById('internment-doctor')
const bedSelect = document.getElementById('internment-bed')

let internments = []
let patients = []
let doctors = []
let beds = []

async function loadBaseData() {
    const token = localStorage.getItem('token')

    const headers = {
        Authorization: `Bearer ${token}`
    }

    const patientsResponse = await fetch(`${API_URL}/pacientes`, { headers })
    const doctorsResponse = await fetch(`${API_URL}/medicos`, { headers })
    const bedsResponse = await fetch(`${API_URL}/leitos`, { headers })

    patients = await patientsResponse.json()
    doctors = await doctorsResponse.json()
    beds = await bedsResponse.json()

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

    const availableBeds = beds.filter(
        bed => bed.status === 'Disponível'
    )

    bedSelect.innerHTML = `
        <option value="">Selecione um leito</option>
        ${availableBeds.map(bed => `
            <option value="${bed.id_leito}">
                Leito ${bed.numero} - ${bed.setor}
            </option>
        `).join('')}
    `
}

async function loadInternments() {
    const token = localStorage.getItem('token')

    if (!token) {
        window.location.href = './index.html'
        return
    }

    try {
        const response = await fetch(`${API_URL}/internacoes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        internments = data

        renderInternments(internments)

    } catch (error) {
        console.log(error)

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Erro ao carregar internações.</td>
            </tr>
        `
    }
}

function renderInternments(list) {
    if (!list || list.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Nenhuma internação encontrada.</td>
            </tr>
        `
        return
    }

    tableBody.innerHTML = list.map((internment) => {
        const patient = patients.find(
            p => p.id_paciente === internment.id_paciente
        )

        const doctor = doctors.find(
            d => d.id_medico === internment.id_medico
        )

        const bed = beds.find(
            b => b.id_leito === internment.id_leito
        )

        return `
            <tr>
                <td>${patient?.nome || '-'}</td>
                <td>${doctor?.nome || '-'}</td>
                <td>${bed ? `Leito ${bed.numero}` : '-'}</td>
                <td>${formatInternmentDate(internment.data_entrada)}</td>
                <td>
                    <span class="status ${internment.status === 'Alta' ? 'done' : 'pending'}">
                        ${internment.status || 'Internado'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-button edit" onclick="dischargeInternment(${internment.id_internacao})">
                            <i class="ri-check-line"></i>
                        </button>

                        <button class="action-button delete" onclick="deleteInternment(${internment.id_internacao})">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
    }).join('')
}

function formatInternmentDate(date) {
    if (!date) return '-'

    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

searchInput.addEventListener('input', () => {
    const value = searchInput.value.toLowerCase()

    const filtered = internments.filter((internment) => {
        const patient = patients.find(
            p => p.id_paciente === internment.id_paciente
        )

        const doctor = doctors.find(
            d => d.id_medico === internment.id_medico
        )

        return (
            patient?.nome?.toLowerCase().includes(value) ||
            doctor?.nome?.toLowerCase().includes(value) ||
            internment.status?.toLowerCase().includes(value)
        )
    })

    renderInternments(filtered)
})

openModalButton.addEventListener('click', () => {
    internmentModal.classList.add('active')
})

closeModalButton.addEventListener('click', closeModal)

internmentModal.addEventListener('click', (event) => {
    if (event.target === internmentModal) {
        closeModal()
    }
})

function closeModal() {
    internmentModal.classList.remove('active')
    internmentForm.reset()
}

internmentForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const token = localStorage.getItem('token')

    const newInternment = {
        id_paciente: Number(document.getElementById('internment-patient').value),
        id_medico: Number(document.getElementById('internment-doctor').value),
        id_leito: Number(document.getElementById('internment-bed').value),
        motivo: document.getElementById('internment-reason').value
    }

    try {
        const response = await fetch(`${API_URL}/internacoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newInternment)
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao salvar internação')
            return
        }

        alert('Internação cadastrada com sucesso!')

        closeModal()

        await loadBaseData()
        await loadInternments()

    } catch (error) {
        console.log(error)
        alert('Erro ao conectar com o servidor')
    }
})

async function dischargeInternment(id) {
    const confirmDischarge = confirm('Deseja registrar alta hospitalar?')

    if (!confirmDischarge) return

    const token = localStorage.getItem('token')

    try {
        const response = await fetch(`${API_URL}/internacoes/${id}/alta`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao registrar alta')
            return
        }

        alert('Alta registrada com sucesso!')

        await loadBaseData()
        await loadInternments()

    } catch (error) {
        console.log(error)
        alert('Erro ao conectar com o servidor')
    }
}

async function deleteInternment(id) {
    const confirmDelete = confirm('Tem certeza que deseja excluir esta internação?')

    if (!confirmDelete) return

    const token = localStorage.getItem('token')

    try {
        const response = await fetch(`${API_URL}/internacoes/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao excluir internação')
            return
        }

        alert('Internação excluída com sucesso!')

        await loadBaseData()
        await loadInternments()

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

async function initInternments() {
    await loadBaseData()
    await loadInternments()
}

initInternments()
