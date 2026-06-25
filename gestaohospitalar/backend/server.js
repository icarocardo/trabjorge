const http = require('http')
const { URL } = require('url')

const PORT = process.env.PORT || 3000
const TOKEN = 'dev-token-gestao-hospitalar'

const db = {
    pacientes: [
        {
            id_paciente: 1,
            nome: 'Ana Souza',
            cpf: '123.456.789-00',
            data_nascimento: '1990-05-12',
            telefone: '(11) 99999-1111',
            email: 'ana@email.com',
            status: 'Ativo'
        },
        {
            id_paciente: 2,
            nome: 'Carlos Lima',
            cpf: '987.654.321-00',
            data_nascimento: '1985-09-22',
            telefone: '(11) 98888-2222',
            email: 'carlos@email.com',
            status: 'Ativo'
        }
    ],
    medicos: [
        {
            id_medico: 1,
            nome: 'Dra. Mariana Alves',
            crm: 'CRM-SP 123456',
            especialidade: 'Cardiologia',
            status: 'Ativo'
        },
        {
            id_medico: 2,
            nome: 'Dr. Rafael Costa',
            crm: 'CRM-SP 654321',
            especialidade: 'Clínica Geral',
            status: 'Ativo'
        }
    ],
    consultas: [
        {
            id_consulta: 1,
            id_paciente: 1,
            id_medico: 1,
            data_consulta: new Date().toISOString().slice(0, 10),
            horario: '09:30',
            motivo: 'Consulta de rotina',
            status: 'Agendada'
        }
    ],
    leitos: [
        {
            id_leito: 1,
            numero: '101',
            setor: 'UTI',
            tipo: 'Hospitalar',
            status: 'Disponível'
        },
        {
            id_leito: 2,
            numero: '202',
            setor: 'Enfermaria',
            tipo: 'Hospitalar',
            status: 'Ocupado'
        }
    ],
    internacoes: [],
    prontuarios: []
}

const idFields = {
    pacientes: 'id_paciente',
    medicos: 'id_medico',
    consultas: 'id_consulta',
    leitos: 'id_leito',
    internacoes: 'id_internacao',
    prontuarios: 'id_prontuario'
}

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    })
    response.end(JSON.stringify(data))
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = ''

        request.on('data', chunk => {
            body += chunk
        })

        request.on('end', () => {
            if (!body) {
                resolve({})
                return
            }

            try {
                resolve(JSON.parse(body))
            } catch (error) {
                reject(error)
            }
        })
    })
}

function isAuthorized(request) {
    return request.headers.authorization === `Bearer ${TOKEN}`
}

function getNextId(resource) {
    const idField = idFields[resource]
    const values = db[resource].map(item => Number(item[idField]) || 0)
    return Math.max(0, ...values) + 1
}

function normalizeResourceItem(resource, data, existing = {}) {
    const now = new Date().toISOString()

    if (resource === 'pacientes') {
        return {
            ...existing,
            ...data,
            status: data.status || existing.status || 'Ativo'
        }
    }

    if (resource === 'medicos') {
        return {
            ...existing,
            ...data,
            status: data.status || existing.status || 'Ativo'
        }
    }

    if (resource === 'consultas') {
        return {
            ...existing,
            ...data,
            status: data.status || existing.status || 'Agendada'
        }
    }

    if (resource === 'leitos') {
        return {
            ...existing,
            ...data,
            tipo: data.tipo || existing.tipo || 'Hospitalar',
            status: data.status || existing.status || 'Disponível'
        }
    }

    if (resource === 'internacoes') {
        return {
            ...existing,
            ...data,
            data_entrada: existing.data_entrada || now,
            status: data.status || existing.status || 'Internado'
        }
    }

    if (resource === 'prontuarios') {
        return {
            ...existing,
            ...data,
            data_registro: existing.data_registro || now
        }
    }

    return { ...existing, ...data }
}

function findById(resource, id) {
    const idField = idFields[resource]
    return db[resource].find(item => Number(item[idField]) === Number(id))
}

function deleteById(resource, id) {
    const idField = idFields[resource]
    const index = db[resource].findIndex(item => Number(item[idField]) === Number(id))

    if (index === -1) return null

    const [deleted] = db[resource].splice(index, 1)
    return deleted
}

async function handleLogin(request, response) {
    const body = await readBody(request)

    if (!body.email || !body.senha || String(body.senha).length < 3) {
        sendJson(response, 401, { erro: 'Email ou senha inválidos' })
        return
    }

    sendJson(response, 200, {
        token: TOKEN,
        usuario: {
            id: 1,
            nome: 'Administrador',
            email: body.email
        }
    })
}

async function handleCollection(request, response, resource) {
    if (request.method === 'GET') {
        sendJson(response, 200, db[resource])
        return
    }

    if (request.method === 'POST') {
        const body = await readBody(request)
        const idField = idFields[resource]
        const item = normalizeResourceItem(resource, {
            ...body,
            [idField]: getNextId(resource)
        })

        db[resource].push(item)

        if (resource === 'internacoes') {
            const bed = findById('leitos', item.id_leito)
            if (bed) bed.status = 'Ocupado'
        }

        sendJson(response, 201, item)
        return
    }

    sendJson(response, 405, { erro: 'Método não permitido' })
}

async function handleItem(request, response, resource, id) {
    const current = findById(resource, id)

    if (!current) {
        sendJson(response, 404, { erro: 'Registro não encontrado' })
        return
    }

    if (request.method === 'PUT') {
        const body = await readBody(request)
        const updated = normalizeResourceItem(resource, body, current)
        Object.assign(current, updated)
        sendJson(response, 200, current)
        return
    }

    if (request.method === 'DELETE') {
        const deleted = deleteById(resource, id)
        sendJson(response, 200, deleted)
        return
    }

    sendJson(response, 405, { erro: 'Método não permitido' })
}

function handleDischarge(response, id) {
    const internment = findById('internacoes', id)

    if (!internment) {
        sendJson(response, 404, { erro: 'Internação não encontrada' })
        return
    }

    internment.status = 'Alta'
    internment.data_alta = new Date().toISOString()

    const bed = findById('leitos', internment.id_leito)
    if (bed) bed.status = 'Disponível'

    sendJson(response, 200, internment)
}

async function route(request, response) {
    if (request.method === 'OPTIONS') {
        sendJson(response, 204, {})
        return
    }

    const url = new URL(request.url, `http://${request.headers.host}`)
    const [, resource, id, action] = url.pathname.split('/')

    try {
        if (resource === 'auth' && id === 'login' && request.method === 'POST') {
            await handleLogin(request, response)
            return
        }

        if (!resource && request.method === 'GET') {
            sendJson(response, 200, {
                nome: 'Gestao Hospitalar API',
                status: 'online'
            })
            return
        }

        if (!isAuthorized(request)) {
            sendJson(response, 401, { erro: 'Token inválido ou ausente' })
            return
        }

        if (!db[resource]) {
            sendJson(response, 404, { erro: 'Rota não encontrada' })
            return
        }

        if (!id) {
            await handleCollection(request, response, resource)
            return
        }

        if (resource === 'internacoes' && action === 'alta' && request.method === 'PUT') {
            handleDischarge(response, id)
            return
        }

        await handleItem(request, response, resource, id)
    } catch (error) {
        sendJson(response, 500, {
            erro: 'Erro interno do servidor',
            detalhes: error.message
        })
    }
}

const server = http.createServer(route)

server.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`)
})
