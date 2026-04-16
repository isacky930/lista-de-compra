import { supabase } from './supabaseClient.js'

// ELEMENTOS
const lista = document.getElementById('lista')
const input = document.getElementById('item')

// ============================
// AUTH
// ============================
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) window.location.href = 'login.html'
  return user
}

// ============================
// UI HELPERS
// ============================
function criarItemElemento(item) {
  const li = document.createElement('li')

  const span = document.createElement('span')
  span.textContent = item.item

  const btn = document.createElement('button')
  btn.textContent = 'Remover'
  btn.classList.add('btn-remove')

  btn.addEventListener('click', () => removerItem(item.id))

  li.appendChild(span)
  li.appendChild(btn)

  return li
}

function limparInput() {
  input.value = ''
  input.focus()
}

// ============================
// LISTA
// ============================
async function carregarLista() {
  const { data, error } = await supabase
    .from('lista_compras')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error(error)
    return
  }

  lista.innerHTML = ''
  data.forEach(item => {
    const elemento = criarItemElemento(item)
    lista.appendChild(elemento)
  })
}

// ============================
// AÇÕES
// ============================
async function adicionarItem() {
  const valor = input.value.trim()

  if (!valor) return

  const user = await getUser()

  input.disabled = true

  const { error } = await supabase
    .from('lista_compras')
    .insert({
      item: valor,
      adicionado_por: user.id
    })

  input.disabled = false

  if (error) {
    mostrarErro('Erro ao adicionar item')
    return
  }

  limparInput()
  carregarLista()
}

async function removerItem(id) {
  const { error } = await supabase
    .from('lista_compras')
    .delete()
    .eq('id', id)

  if (error) {
    mostrarErro('Erro ao remover item')
    return
  }

  carregarLista()
}

// ============================
// UX
// ============================
function mostrarErro(msg) {
  alert(msg) // depois vamos melhorar isso
}

// ENTER
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    adicionarItem()
  }
})

// ============================
// INIT
// ============================
async function init() {
  await getUser()
  await carregarLista()
}

init()