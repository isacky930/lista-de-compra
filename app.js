import { supabase } from './supabaseClient.js'

// ============================================
// BASE DE DADOS DE PRODUTOS COM PREÇOS
// ============================================
const PRODUTOS_COMUNS = {
  'arroz': 7.50,
  'feijão': 8.90,
  'macarrão': 4.50,
  'leite': 5.20,
  'pão': 9.90,
  'ovos': 12.00,
  'queijo': 25.00,
  'manteiga': 18.50,
  'açúcar': 6.50,
  'sal': 3.50,
  'óleo': 8.20,
  'café': 15.00,
  'chá': 12.00,
  'suco': 7.50,
  'refrigerante': 8.00,
  'água': 4.50,
  'cerveja': 6.50,
  'vinho': 25.00,
  'frango': 18.00,
  'carne': 35.00,
  'peixe': 42.00,
  'banana': 5.99,
  'maçã': 8.50,
  'laranja': 6.50,
  'morango': 12.00,
  'tomate': 7.50,
  'alface': 4.50,
  'cenoura': 3.50,
  'batata': 4.20,
  'cebola': 5.50,
  'alho': 8.00,
  'brócolis': 9.50,
  'chocolate': 5.50,
  'bolo': 20.00,
  'biscoito': 8.00,
  'bolacha': 6.50,
  'iogurte': 4.50,
  'requeijão': 12.00,
  'mozzarela': 16.00,
  'presunto': 22.00,
  'salsicha': 14.00,
  'linguiça': 18.00,
  'bacon': 20.00,
  'presunto': 22.00,
  'peito de frango': 16.00,
  'coxa de frango': 12.00,
  'asa de frango': 10.00,
  'desinfetante': 5.50,
  'sabão': 4.00,
  'shampoo': 12.00,
  'sabonete': 3.50,
  'papel higiênico': 25.00,
  'lenço de papel': 8.00,
  'detergente': 4.50,
  'amaciante': 8.00,
  'desodorante': 15.00,
  'escova de dente': 9.00,
  'pasta de dente': 8.50,
  'fio dental': 12.00,
  'absorvente': 18.00,
  'fralda': 45.00,
  'papel machê': 6.50,
  'tampa plástica': 4.50,
  'sacola': 2.00,
  'abraçadeira': 3.00,
}

// ============================================
// ELEMENTOS DO DOM
// ============================================
const lista = document.getElementById('lista')
const inputItem = document.getElementById('item')
const inputPreco = document.getElementById('preco')
const adicionarBtn = document.getElementById('adicionarBtn')
const valorTotal = document.getElementById('valorTotal')
const totalItens = document.getElementById('totalItens')
const itensComprados = document.getElementById('itensComprados')
const itensPendentes = document.getElementById('itensPendentes')

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Recupera o usuário logado
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) window.location.href = 'login.html'
  return user
}

// Procura preço automático no banco de produtos
function buscarPrecoAutomatico(nome) {
  const normalizados = Object.keys(PRODUTOS_COMUNS).map(k => ({
    chave: k,
    preco: PRODUTOS_COMUNS[k],
    similarity: calcularSimilaridade(nome.toLowerCase(), k)
  }))
  
  const melhor = normalizados.sort((a, b) => b.similarity - a.similarity)[0]
  return melhor && melhor.similarity > 0.6 ? melhor.preco : null
}

// Calcula similaridade entre strings (para autocomplete)
function calcularSimilaridade(str1, str2) {
  const len = Math.max(str1.length, str2.length)
  if (len === 0) return 1.0
  
  let matches = 0
  for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
    if (str1[i] === str2[i]) matches++
  }
  
  return matches / len
}

// Formata valor em moeda
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0)
}

// Mostra sugestões de autocomplete
function mostrarSugestoes(text) {
  if (!text || text.length < 2) return

  const matches = Object.keys(PRODUTOS_COMUNS).filter(prod =>
    prod.startsWith(text.toLowerCase())
  ).slice(0, 5)

  let container = document.querySelector('.sugestoes-list')
  if (container) container.remove()

  if (matches.length === 0) return

  container = document.createElement('div')
  container.className = 'sugestoes-list'

  matches.forEach(prod => {
    const div = document.createElement('div')
    div.className = 'sugestao-item'
    div.innerHTML = `
      <span class="sugestao-nome">${prod.charAt(0).toUpperCase() + prod.slice(1)}</span>
      <span class="sugestao-preco">R$ ${PRODUTOS_COMUNS[prod].toFixed(2)}</span>
    `
    div.onclick = () => {
      inputItem.value = prod.charAt(0).toUpperCase() + prod.slice(1)
      inputPreco.value = PRODUTOS_COMUNS[prod].toFixed(2)
      container.remove()
      inputItem.focus()
    }
    container.appendChild(div)
  })

  inputItem.parentElement.style.position = 'relative'
  inputItem.parentElement.appendChild(container)
}

// ============================================
// GERENCIAMENTO DA LISTA
// ============================================

// Carrega e renderiza a lista do Supabase
async function carregarLista() {
  const { data, error } = await supabase.from('lista_compras').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('Erro ao carregar lista:', error)
    return
  }

  lista.innerHTML = ''
  
  if (data.length === 0) {
    lista.innerHTML = `
      <li class="empty-state" role="status">
        <i class="fas fa-clipboard-list" aria-hidden="true"></i>
        <p>Sua lista está vazia</p>
        <small>Adicione itens abaixo</small>
      </li>
    `
  } else {
    data.forEach((item) => {
      const precoItem = item.preco || 0
      const li = document.createElement('li')
      li.className = item.comprado ? 'done' : ''
      li.innerHTML = `
        <div class="item-content">
          <input type="checkbox" class="item-checkbox" onchange="alterarStatus('${item.id}', this.checked)" ${item.comprado ? 'checked' : ''} aria-label="Marcar ${item.item} como comprado">
          <div class="item-details">
            <span class="item-text ${item.comprado ? 'comprado' : ''}">${item.item}</span>
            <span class="item-preco">R$ ${precoItem.toFixed(2)}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-delete" onclick="removerItem('${item.id}')" aria-label="Remover ${item.item}">
            <i class="fas fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      `
      lista.appendChild(li)
    })
  }

  atualizarEstatisticas()
}

// Adiciona novo item à lista
window.adicionarItem = async function () {
  if (!inputItem.value.trim()) {
    alert('Digite o nome do produto')
    return
  }

  const user = await getUser()
  const preco = parseFloat(inputPreco.value) || 0

  const { error } = await supabase.from('lista_compras').insert({
    item: inputItem.value.trim(),
    preco: preco,
    comprado: false,
    adicionado_por: user.id
  })

  if (error) {
    alert('Erro ao adicionar: ' + error.message)
    return
  }

  inputItem.value = ''
  inputPreco.value = ''
  document.querySelector('.sugestoes-list')?.remove()
  carregarLista()
  inputItem.focus()
}

// Remove item da lista
window.removerItem = async function (id) {
  if (!confirm('Remover item?')) return

  const { error } = await supabase.from('lista_compras').delete().eq('id', id)
  if (error) {
    alert('Erro ao remover: ' + error.message)
    return
  }
  carregarLista()
}

// Altera status de comprado
window.alterarStatus = async function (id, comprado) {
  const { error } = await supabase.from('lista_compras').update({ comprado }).eq('id', id)
  if (error) {
    console.error('Erro ao atualizar:', error)
    return
  }
  carregarLista()
}

// Limpa itens comprados
window.limparComprados = async function () {
  if (!confirm('Remover todos os itens comprados?')) return

  const { error } = await supabase.from('lista_compras').delete().eq('comprado', true)
  if (error) {
    alert('Erro ao limpar: ' + error.message)
    return
  }
  carregarLista()
}

// Limpa toda a lista
window.limparLista = async function () {
  if (!confirm('Remover TODOS os itens da lista?')) return

  const { error } = await supabase.from('lista_compras').delete().neq('id', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
  if (error) {
    alert('Erro ao limpar: ' + error.message)
    return
  }
  carregarLista()
}

// Atualiza estatísticas
async function atualizarEstatisticas() {
  const { data, error } = await supabase.from('lista_compras').select('*')
  if (error) return

  const total = data.length
  const comprados = data.filter(i => i.comprado).length
  const pendentes = total - comprados
  const valorTotalCompras = data.reduce((sum, item) => sum + (item.preco || 0), 0)

  totalItens.textContent = total
  itensComprados.textContent = comprados
  itensPendentes.textContent = pendentes
  valorTotal.textContent = formatarMoeda(valorTotalCompras)
}

// Realiza logout
window.logout = async function () {
  await supabase.auth.signOut()
  window.location.href = 'login.html'
}

// ============================================
// EVENT LISTENERS
// ============================================

// Autocomplete ao digitar
inputItem.addEventListener('input', (e) => {
  mostrarSugestoes(e.target.value)
  
  // Tenta preencher preço automaticamente
  if (!inputPreco.value) {
    const precoAuto = buscarPrecoAutomatico(e.target.value)
    if (precoAuto) {
      inputPreco.value = precoAuto.toFixed(2)
    }
  }
})

// Enter para adicionar
inputItem.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') adicionarItem()
})

inputPreco.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') adicionarItem()
})

// Remove sugestões ao clicar fora
document.addEventListener('click', (e) => {
  if (e.target !== inputItem && !e.target.closest('.sugestoes-list')) {
    document.querySelector('.sugestoes-list')?.remove()
  }
})

// ============================================
// INICIALIZAÇÃO
// ============================================
getUser().then(() => carregarLista())