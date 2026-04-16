import { supabase } from './supabaseClient.js'

// ELEMENTOS
const emailInput = document.getElementById('email')
const senhaInput = document.getElementById('senha')
const btnLogin = document.querySelector('.btn-login')
const btnCadastro = document.querySelector('.btn-cadastro')

// ============================
// UI
// ============================
function setLoading(button, loading) {
  if (!button) return

  if (loading) {
    button.disabled = true
    button.textContent = 'Carregando...'
  } else {
    button.disabled = false
    button.textContent = button.dataset.label
  }
}

function mostrarErro(msg) {
  criarToast(msg, 'erro')
}

function mostrarSucesso(msg) {
  criarToast(msg, 'sucesso')
}

// Toast simples (sem biblioteca)
function criarToast(msg, tipo) {
  const toast = document.createElement('div')
  toast.className = `toast ${tipo}`
  toast.textContent = msg

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// ============================
// VALIDAÇÃO
// ============================
function validar() {
  const email = emailInput.value.trim()
  const senha = senhaInput.value.trim()

  if (!email) {
    mostrarErro('Digite seu email')
    return false
  }

  if (senha.length < 6) {
    mostrarErro('Senha deve ter no mínimo 6 caracteres')
    return false
  }

  return true
}

// ============================
// LOGIN
// ============================
async function login() {
  if (!validar()) return

  setLoading(btnLogin, true)

  const email = emailInput.value
  const senha = senhaInput.value

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  })

  setLoading(btnLogin, false)

  if (error) {
    mostrarErro('Email ou senha inválidos')
    return
  }

  mostrarSucesso('Login realizado!')
  
  setTimeout(() => {
    window.location.href = 'index.html'
  }, 800)
}

// ============================
// CADASTRO
// ============================
async function cadastro() {
  if (!validar()) return

  setLoading(btnCadastro, true)

  const email = emailInput.value
  const senha = senhaInput.value

  const { error } = await supabase.auth.signUp({
    email,
    password: senha
  })

  setLoading(btnCadastro, false)

  if (error) {
    mostrarErro(error.message)
    return
  }

  mostrarSucesso('Conta criada! Faça login.')
}

// ============================
// EVENTOS
// ============================
btnLogin?.addEventListener('click', login)
btnCadastro?.addEventListener('click', cadastro)

// ENTER
senhaInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login()
})