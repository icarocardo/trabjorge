async function loadDashboard() {
    const token = localStorage.getItem('token')

    if (!token) {
        window.location.href = './index.html'
        return
    }

    try {
        const headers = {
            Authorization: `Bearer ${token}`
        }

        const patientsResponse = await fetch(`${API_URL}/pacientes`, { headers })
        const doctorsResponse = await fetch(`${API_URL}/medicos`, { headers })
        const consultationsResponse = await fetch(`${API_URL}/consultas`, { headers })
        const bedsResponse = await fetch(`${API_URL}/leitos`, { headers })

        const patients = await patientsResponse.json()
        const doctors = await doctorsResponse.json()
        const consultations = await consultationsResponse.json()
        const beds = await bedsResponse.json()

        const patientsList = Array.isArray(patients) ? patients : []
        const doctorsList = Array.isArray(doctors) ? doctors : []
        const consultationsList = Array.isArray(consultations) ? consultations : []
        const bedsList = Array.isArray(beds) ? beds : []

        document.getElementById('total-patients').innerText = patientsList.length
        document.getElementById('total-doctors').innerText = doctorsList.length
        document.getElementById('total-consultations').innerText = consultationsList.length

        const occupiedBeds = bedsList.filter(
            bed => bed.status === 'Ocupado'
        ).length

        document.getElementById('total-beds').innerText = occupiedBeds

        renderRecentConsultations(consultationsList, patientsList, doctorsList)

    } catch (error) {
        console.log(error)
        alert('Erro ao carregar dashboard')
    }
}

function renderRecentConsultations(consultations, patients, doctors) {
    const tableBody = document.getElementById('recent-consultations-body')

    if (!tableBody) return

    if (!consultations || consultations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">Nenhuma consulta encontrada.</td>
            </tr>
        `
        return
    }

    tableBody.innerHTML = consultations.slice(-5).reverse().map((consultation) => {
        const patient = patients.find(
            p => p.id_paciente === consultation.id_paciente
        )

        const doctor = doctors.find(
            d => d.id_medico === consultation.id_medico
        )

        return `
            <tr>
                <td>${patient?.nome || '-'}</td>
                <td>${doctor?.nome || '-'}</td>
                <td>${doctor?.especialidade || '-'}</td>
                <td>
                    <span class="status ${getStatusClass(consultation.status)}">
                        ${consultation.status || 'Agendada'}
                    </span>
                </td>
            </tr>
        `
    }).join('')
}

function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')

    window.location.href = './index.html'
}

loadDashboard()
