# Backend

API simples em Node.js para atender o frontend do sistema hospitalar.

## Como rodar

```bash
cd backend
npm start
```

A API sobe em `http://localhost:3000`.

## Login

Use qualquer email valido e qualquer senha com pelo menos 3 caracteres.

Exemplo:

- Email: `admin@hospital.com`
- Senha: `123456`

## Rotas

- `POST /auth/login`
- `GET/POST /pacientes`
- `PUT/DELETE /pacientes/:id`
- `GET/POST /medicos`
- `PUT/DELETE /medicos/:id`
- `GET/POST /consultas`
- `PUT/DELETE /consultas/:id`
- `GET/POST /leitos`
- `PUT/DELETE /leitos/:id`
- `GET/POST /internacoes`
- `PUT /internacoes/:id/alta`
- `DELETE /internacoes/:id`
- `GET/POST /prontuarios`
- `PUT/DELETE /prontuarios/:id`
