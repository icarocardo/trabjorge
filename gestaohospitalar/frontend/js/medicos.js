const tableBody = document.getElementById('doctors-table-body')
const searchInput = document.getElementById('search-doctor')

const doctorForm = document.getElementById('doctor-form')

const openDoctorModal = document.getElementById('open-doctor-modal')
const closeDoctorModal = document.getElementById('close-doctor-modal')
const doctorModal = document.getElementById('doctor-modal')

let doctors = []
let editingDoctorId = null

/* LOAD */

async function loadDoctors() {

    const token = localStorage.getItem('token')

    if (!token) {
        window.location.href = './index.html'
        return
    }

    try {

        const response = await fetch(`${API_URL}/medicos`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        doctors = data

        renderDoctors(doctors)

    } catch (error) {

        console.log(error)

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Erro ao carregar médicos.
                </td>
            </tr>
        `
    }
}

/* RENDER */

function renderDoctors(list) {

    if (!list || list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Nenhum médico encontrado.
                </td>
            </tr>
        `

        return
    }

    tableBody.innerHTML = list.map((doctor) => `
        <tr>

            <td>${doctor.nome || '-'}</td>

            <td>${doctor.crm || '-'}</td>

            <td>${doctor.especialidade || '-'}</td>

            <td>
                <span class="status ${doctor.status === 'Inativo' ? 'inactive' : 'done'}">
                    ${doctor.status || 'Ativo'}
                </span>
            </td>

            <td>
                <div class="table-actions">

                    <button
                        class="action-button edit"
                        onclick="editDoctor(${doctor.id_medico})"
                    >
                        <i class="ri-edit-line"></i>
                    </button>

                    <button
                        class="action-button delete"
                        onclick="deleteDoctor(${doctor.id_medico})"
                    >
                        <i class="ri-delete-bin-line"></i>
                    </button>

                </div>
            </td>

        </tr>
    `).join('')
}

/* SEARCH */

searchInput.addEventListener('input', () => {

    const value = searchInput.value.toLowerCase()

    const filteredDoctors = doctors.filter((doctor) => {

        return (
            doctor.nome?.toLowerCase().includes(value) ||
            doctor.crm?.toLowerCase().includes(value) ||
            doctor.especialidade?.toLowerCase().includes(value)
        )
    })

    renderDoctors(filteredDoctors)
})

/* MODAL */

openDoctorModal.addEventListener('click', () => {
    doctorModal.classList.add('active')
})

closeDoctorModal.addEventListener('click', () => {

    doctorModal.classList.remove('active')

    doctorForm.reset()

    editingDoctorId = null

    document.querySelector('#doctor-modal .modal-header h2').innerText = 'Novo médico'
})

doctorModal.addEventListener('click', (event) => {

    if (event.target === doctorModal) {
        doctorModal.classList.remove('active')
    }
})

/* CREATE / UPDATE */

doctorForm.addEventListener('submit', async (event) => {

    event.preventDefault()

    const token = localStorage.getItem('token')

    const newDoctor = {
        nome: document.getElementById('doctor-name').value,
        crm: document.getElementById('doctor-crm').value,
        especialidade: document.getElementById('doctor-specialty').value
    }

    try {

        const url = editingDoctorId
            ? `${API_URL}/medicos/${editingDoctorId}`
            : `${API_URL}/medicos`

        const method = editingDoctorId ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newDoctor)
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao salvar médico')
            return
        }

        alert(
            editingDoctorId
                ? 'Médico atualizado com sucesso!'
                : 'Médico cadastrado com sucesso!'
        )

        doctorForm.reset()

        editingDoctorId = null

        document.querySelector('#doctor-modal .modal-header h2').innerText = 'Novo médico'

        doctorModal.classList.remove('active')

        loadDoctors()

    } catch (error) {

        console.log(error)

        alert('Erro ao conectar com o servidor')
    }
})

/* EDIT */

function editDoctor(id) {

    const doctor = doctors.find((d) => d.id_medico === id)

    if (!doctor) return

    editingDoctorId = id

    document.getElementById('doctor-name').value = doctor.nome || ''
    document.getElementById('doctor-crm').value = doctor.crm || ''
    document.getElementById('doctor-specialty').value = doctor.especialidade || ''

    document.querySelector('#doctor-modal .modal-header h2').innerText = 'Editar médico'

    doctorModal.classList.add('active')
}

/* DELETE */

async function deleteDoctor(id) {

    const confirmDelete = confirm('Tem certeza que deseja excluir este médico?')

    if (!confirmDelete) return

    const token = localStorage.getItem('token')

    try {

        const response = await fetch(`${API_URL}/medicos/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao excluir médico')
            return
        }

        alert('Médico excluído com sucesso!')

        loadDoctors()

    } catch (error) {

        console.log(error)

        alert('Erro ao conectar com o servidor')
    }
}

/* LOGOUT */

function logout() {

    localStorage.removeItem('token')
    localStorage.removeItem('usuario')

    window.location.href = './index.html'
}

/* INIT */

loadDoctors()
