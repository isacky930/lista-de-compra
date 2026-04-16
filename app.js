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

// Calcula distância de Levenshtein (para correção automática de typos)
function distanciaLevenshtein(str1, str2) {
  const m = str1.length
  const n = str2.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

// Sugere correção automática de typos
function sugerirCorrecao(texto) {
  const normalizado = texto.toLowerCase().trim()
  if (!normalizado || normalizado.length < 2) return null

  const sugestoes = Object.keys(PRODUTOS_COMUNS)
    .map(produto => ({
      produto,
      distancia: distanciaLevenshtein(normalizado, produto)
    }))
    .filter(s => s.distancia <= 2)
    .sort((a, b) => a.distancia - b.distancia)

  return sugestoes.length > 0 ? sugestoes[0].produto : null
}

// Mostra notificação (sucesso, erro, info)
function mostrarNotificacao(mensagem, tipo = 'info') {
  const existente = document.querySelector('.notificacao')
  if (existente) existente.remove()

  const notificacao = document.createElement('div')
  notificacao.className = `notificacao notificacao-${tipo} mostrar`
  
  const icons = {
    sucesso: '✓',
    erro: '✕',
    info: 'ℹ'
  }

  notificacao.innerHTML = `
    <i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : tipo === 'erro' ? 'exclamation-circle' : 'info-circle'}" aria-hidden="true"></i>
    <span>${mensagem}</span>
  `

  document.body.appendChild(notificacao)

  setTimeout(() => {
    notificacao.classList.remove('mostrar')
    setTimeout(() => notificacao.remove(), 300)
  }, 3500)
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
  try {
    console.log('🔄 Carregando lista...')
    
    const { data, error } = await supabase
      .from('lista_compras')
      .select('*')
    
    if (error) {
      console.error('❌ Erro ao carregar lista:', error)
      mostrarNotificacao('Erro ao carregar lista: ' + error.message, 'erro')
      return
    }

    console.log('✓ Lista carregada:', data?.length || 0, 'itens')
    
    lista.innerHTML = ''
    
    if (!data || data.length === 0) {
      console.log('📭 Lista vazia')
      lista.innerHTML = `
        <li class="empty-state" role="status">
          <i class="fas fa-clipboard-list" aria-hidden="true"></i>
          <p>Sua lista está vazia</p>
          <small>Adicione itens abaixo</small>
        </li>
      `
      atualizarEstatisticas()
      return
    }

    console.log('📋 Renderizando', data.length, 'itens')
    
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

    atualizarEstatisticas()
  } catch (err) {
    console.error('❌ Erro inesperado ao carregar lista:', err)
    mostrarNotificacao('Erro inesperado: ' + err.message, 'erro')
  }
}

// Adiciona novo item à lista
window.adicionarItem = async function () {
  const itemValue = inputItem.value.trim()

  // Validação: campo vazio
  if (!itemValue) {
    mostrarNotificacao('Digite o nome do produto para continuar', 'erro')
    inputItem.focus()
    inputItem.classList.add('input-error')
    setTimeout(() => inputItem.classList.remove('input-error'), 500)
    return
  }

  // Tenta sugerir correção se houver typo
  const correcao = sugerirCorrecao(itemValue)
  let itemFinal = itemValue

  if (correcao && correcao.toLowerCase() !== itemValue.toLowerCase()) {
    // Pergunta se quer a correção
    const confirmar = confirm(`Você quis dizer "${correcao.charAt(0).toUpperCase() + correcao.slice(1)}"?`)
    if (confirmar) {
      itemFinal = correcao.charAt(0).toUpperCase() + correcao.slice(1)
    }
  } else {
    // Capitaliza primeira letra
    itemFinal = itemValue.charAt(0).toUpperCase() + itemValue.slice(1).toLowerCase()
  }

  const user = await getUser()
  const preco = parseFloat(inputPreco.value) || 0

  console.log('➕ Adicionando item:', itemFinal, 'Preço:', preco)

  const { data: insertData, error } = await supabase.from('lista_compras').insert({
    item: itemFinal,
    preco: preco,
    comprado: false,
    adicionado_por: user.id
  }).select()

  if (error) {
    console.error('❌ Erro na inserção:', error)
    mostrarNotificacao('Erro ao adicionar: ' + error.message, 'erro')
    return
  }

  console.log('✓ Item inserido:', insertData)
  mostrarNotificacao(`✓ "${itemFinal}" adicionado com sucesso!`, 'sucesso')
  inputItem.value = ''
  inputPreco.value = ''
  document.querySelector('.sugestoes-list')?.remove()
  
  // Pequeno delay para o Supabase processar
  await new Promise(resolve => setTimeout(resolve, 300))
  
  console.log('🔄 Recarregando lista...')
  await carregarLista()
  inputItem.focus()
}

// Remove item da lista
window.removerItem = async function (id) {
  if (!confirm('Remover item?')) return

  console.log('🗑️ Removendo item:', id)

  const { error } = await supabase.from('lista_compras').delete().eq('id', id)
  if (error) {
    console.error('❌ Erro ao remover:', error)
    mostrarNotificacao('Erro ao remover: ' + error.message, 'erro')
    return
  }
  
  console.log('✓ Item removido')
  mostrarNotificacao('Item removido com sucesso!', 'sucesso')
  carregarLista()
}

// Altera status de comprado
window.alterarStatus = async function (id, comprado) {
  console.log('✓ Alterando status do item:', id, '→', comprado)

  const { error } = await supabase.from('lista_compras').update({ comprado }).eq('id', id)
  if (error) {
    console.error('❌ Erro ao atualizar:', error)
    mostrarNotificacao('Erro ao atualizar: ' + error.message, 'erro')
    return
  }
  console.log('✓ Status alterado')
  carregarLista()
}

// Limpa itens comprados
window.limparComprados = async function () {
  if (!confirm('Remover todos os itens comprados?')) return

  console.log('🗑️ Removendo itens comprados...')

  const { error } = await supabase.from('lista_compras').delete().eq('comprado', true)
  if (error) {
    console.error('❌ Erro ao limpar:', error)
    mostrarNotificacao('Erro ao limpar: ' + error.message, 'erro')
    return
  }
  
  console.log('✓ Itens comprados removidos')
  mostrarNotificacao('Itens comprados removidos!', 'sucesso')
  carregarLista()
}

// Limpa toda a lista
window.limparLista = async function () {
  if (!confirm('Remover TODOS os itens da lista?')) return

  const { error } = await supabase.from('lista_compras').delete().gt('id', '0')
  if (error) {
    mostrarNotificacao('Erro ao limpar: ' + error.message, 'erro')
    return
  }
  mostrarNotificacao('Lista limpa com sucesso!', 'sucesso')
  carregarLista()
}

// Atualiza estatísticas
async function atualizarEstatisticas() {
  try {
    const { data, error } = await supabase.from('lista_compras').select('*')
    
    if (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
      return
    }

    if (!data) {
      console.warn('⚠️ Dados de estatísticas são null')
      return
    }

    console.log('📊 Atualizando estatísticas com', data.length, 'itens')

    const total = data.length
    const comprados = data.filter(i => i.comprado).length
    const pendentes = total - comprados
    const valorTotalCompras = data.reduce((sum, item) => sum + (item.preco || 0), 0)

    totalItens.textContent = total
    itensComprados.textContent = comprados
    itensPendentes.textContent = pendentes
    valorTotal.textContent = formatarMoeda(valorTotalCompras)
  } catch (err) {
    console.error('❌ Erro inesperado ao atualizar estatísticas:', err)
  }
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