const tableBody = document.getElementById('beds-table-body')
const searchInput = document.getElementById('search-bed')

const bedForm = document.getElementById('bed-form')
const bedModal = document.getElementById('bed-modal')

const openModalButton = document.getElementById('open-bed-modal')
const closeModalButton = document.getElementById('close-bed-modal')

let beds = []
let editingBedId = null

async function loadBeds() {
    const token = localStorage.getItem('token')

    if (!token) {
        window.location.href = './index.html'
        return
    }

    try {
        const response = await fetch(`${API_URL}/leitos`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        beds = Array.isArray(data) ? data : []

        renderBeds(beds)

    } catch (error) {
        console.log(error)

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">Erro ao carregar leitos.</td>
            </tr>
        `
    }
}

function renderBeds(list) {
    if (!list || list.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">Nenhum leito encontrado.</td>
            </tr>
        `
        return
    }

    tableBody.innerHTML = list.map((bed) => `
        <tr>
            <td>${bed.numero || '-'}</td>
            <td>${bed.setor || '-'}</td>
            <td>
                <span class="status ${getBedStatusClass(bed.status)}">
                    ${bed.status || 'Disponível'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="action-button edit" onclick="editBed(${bed.id_leito})">
                        <i class="ri-edit-line"></i>
                    </button>

                    <button class="action-button delete" onclick="deleteBed(${bed.id_leito})">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('')
}

function getBedStatusClass(status) {
    const normalized = String(status || '').toLowerCase()

    if (normalized === 'ocupado') return 'pending'
    if (normalized === 'manutenção' || normalized === 'manutencao') return 'inactive'
    return 'done'
}

searchInput.addEventListener('input', () => {
    const value = searchInput.value.toLowerCase()

    const filteredBeds = beds.filter((bed) => {
        return (
            bed.numero?.toString().toLowerCase().includes(value) ||
            bed.setor?.toLowerCase().includes(value) ||
            bed.status?.toLowerCase().includes(value)
        )
    })

    renderBeds(filteredBeds)
})

openModalButton.addEventListener('click', () => {
    bedModal.classList.add('active')
})

closeModalButton.addEventListener('click', closeModal)

bedModal.addEventListener('click', (event) => {
    if (event.target === bedModal) {
        closeModal()
    }
})

function closeModal() {
    bedModal.classList.remove('active')
    bedForm.reset()
    editingBedId = null

    document.querySelector('#bed-modal .modal-header h2').innerText = 'Novo leito'
}

bedForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const token = localStorage.getItem('token')

    const newBed = {
        numero: document.getElementById('bed-number').value,
        setor: document.getElementById('bed-sector').value,
        tipo: 'Hospitalar',
        status: document.getElementById('bed-status').value
    }

    try {
        const url = editingBedId
            ? `${API_URL}/leitos/${editingBedId}`
            : `${API_URL}/leitos`

        const method = editingBedId ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newBed)
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao salvar leito')
            return
        }

        alert(
            editingBedId
                ? 'Leito atualizado com sucesso!'
                : 'Leito cadastrado com sucesso!'
        )

        closeModal()
        await loadBeds()

    } catch (error) {
        console.log(error)
        alert('Erro ao conectar com o servidor')
    }
})

function editBed(id) {
    const bed = beds.find((b) => b.id_leito === id)

    if (!bed) return

    editingBedId = id

    document.getElementById('bed-number').value = bed.numero || ''
    document.getElementById('bed-sector').value = bed.setor || ''
    document.getElementById('bed-status').value = bed.status || 'Disponível'

    document.querySelector('#bed-modal .modal-header h2').innerText = 'Editar leito'

    bedModal.classList.add('active')
}

async function deleteBed(id) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este leito?')

    if (!confirmDelete) return

    const token = localStorage.getItem('token')

    try {
        const response = await fetch(`${API_URL}/leitos/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.erro || 'Erro ao excluir leito')
            return
        }

        alert('Leito excluído com sucesso!')

        loadBeds()

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

loadBeds()
