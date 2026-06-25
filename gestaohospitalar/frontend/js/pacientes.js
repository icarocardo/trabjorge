const tableBody = document.getElementById('patients-table-body')
const searchInput = document.getElementById('search-patient')

let patients = []
let editingPatientId = null

async function loadPatients() {
    const token = localStorage.getItem('token')

    if (!token) {
        window.location.href = './index.html'
        return
    }

    try {
        const response = await fetch(`${API_URL}/pacientes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        console.log(data)

        patients = data

        renderPatients(patients)

    } catch (error) {
        console.log(error)

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Erro ao carregar pacientes.</td>
            </tr>
        `
    }
}

function renderPatients(list) {
    if (!list || list.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Nenhum paciente encontrado.</td>
            </tr>
        `
        return
    }

    tableBody.innerHTML = list.map((patient) => `
        <tr>
            <td>${patient.nome || '-'}</td>
            <td>${patient.cpf || '-'}</td>
            <td>${patient.telefone || '-'}</td>
            <td>${patient.email || '-'}</td>
            <td>
                <span class="status ${patient.status === 'Inativo' ? 'inactive' : 'done'}">
                    ${patient.status || 'Ativo'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="action-button edit" onclick="editPatient(${patient.id_paciente})">
                        <i class="ri-edit-line"></i>
                    </button>

                    <button class="action-button delete" onclick="deletePatient(${patient.id_paciente})">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('')
}

searchInput.addEventListener('input', () => {
    const value = searchInput.value.toLowerCase()

    const filteredPatients = patients.filter((patient) => {
        return (
            patient.nome?.toLowerCase().includes(value) ||
            patient.cpf?.includes(value)
        )
    })

    renderPatients(filteredPatients)
})

function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')

    window.location.href = './index.html'
}

loadPatients()

const openPatientModal = document.getElementById('open-patient-modal')
const closePatientModal = document.getElementById('close-patient-modal')
const patientModal = document.getElementById('patient-modal')

openPatientModal.addEventListener('click', () => {
    patientModal.classList.add('active')
})

closePatientModal.addEventListener('click', () => {
    patientModal.classList.remove('active')
})

patientModal.addEventListener('click', (event) => {
    if (event.target === patientModal) {
        patientModal.classList.remove('active')
    }
})

const patientForm = document.getElementById('patient-form')

patientForm.addEventListener('submit', async (event) => {

    event.preventDefault()

    const token = localStorage.getItem('token')

    const newPatient = {
        nome: document.getElementById('patient-name').value,
        cpf: document.getElementById('patient-cpf').value,
        data_nascimento: document.getElementById('patient-birth').value,
        telefone: document.getElementById('patient-phone').value,
        email: document.getElementById('patient-email').value
    }

    try {

        const url = editingPatientId
            ? `${API_URL}/pacientes/${editingPatientId}`
            : `${API_URL}/pacientes`

        const method = editingPatientId ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newPatient)
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao cadastrar paciente')
            return
        }

        alert(
            editingPatientId
                ? 'Paciente atualizado com sucesso!'
                : 'Paciente cadastrado com sucesso!'
        )

        patientForm.reset()

        editingPatientId = null

        document.querySelector('#patient-modal .modal-header h2').innerText = 'Novo paciente'

        patientModal.classList.remove('active')

        loadPatients()

    } catch (error) {

        console.log(error)

        alert('Erro ao conectar com o servidor')
    }

})

function editPatient(id) {

    const patient = patients.find((p) => p.id_paciente === id)

    if (!patient) return

    editingPatientId = id

    document.getElementById('patient-name').value = patient.nome || ''
    document.getElementById('patient-cpf').value = patient.cpf || ''
    document.getElementById('patient-birth').value = patient.data_nascimento || ''
    document.getElementById('patient-phone').value = patient.telefone || ''
    document.getElementById('patient-email').value = patient.email || ''

    document.querySelector('.modal-header h2').innerText = 'Editar paciente'

    patientModal.classList.add('active')
}

async function deletePatient(id) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este paciente?')

    if (!confirmDelete) return

    const token = localStorage.getItem('token')

    try {
        const response = await fetch(`${API_URL}/pacientes/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao excluir paciente')
            return
        }

        alert('Paciente excluído com sucesso!')

        loadPatients()

    } catch (error) {
        console.log(error)
        alert('Erro ao conectar com o servidor')
    }
}
