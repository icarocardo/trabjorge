const form = document.getElementById('login-form')

form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const email = document.getElementById('email').value
    const senha = document.getElementById('senha').value

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        })

        const data = await response.json()

        console.log(data)

        if (!response.ok) {
            alert(data.erro || 'Erro ao fazer login')
            return
        }

        localStorage.setItem('token', data.token)
        localStorage.setItem('usuario', JSON.stringify(data.usuario))

        alert('Login realizado com sucesso!')

        window.location.href = './dashboard.html'

    } catch (error) {
        console.log(error)
        alert('Erro ao conectar com o servidor')
    }
})
