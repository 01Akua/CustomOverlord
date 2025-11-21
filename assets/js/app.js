import { filterCompatibleParts, findRelatedParts } from './compatibility.js'
import { populateBrandModelYear, updateModels, updateYears, buildCategoryOptions, renderResultsGrid, renderProductDetail, renderRelated } from './ui.js'

const state = {
  motos: [],
  parts: [],
  selection: { marca: null, modelo: null, año: null },
  filters: { search: '', category: 'Todas', maxPrice: 300000, sort: 'asc' },
  results: [],
  cart: [],
  user: null,
  overrides: {}
}

const el = {
  brand: document.getElementById('brandSelect'),
  model: document.getElementById('modelSelect'),
  year: document.getElementById('yearSelect'),
  view: document.getElementById('viewParts'),
  results: document.getElementById('results'),
  resultsGrid: document.getElementById('resultsGrid'),
  resultsSubtitle: document.getElementById('resultsSubtitle'),
  filterCategory: document.getElementById('filterCategory'),
  searchQuery: document.getElementById('searchQuery'),
  filterPrice: document.getElementById('filterPrice'),
  filterPriceValue: document.getElementById('filterPriceValue'),
  filterSort: document.getElementById('filterSort'),
  resetFilters: document.getElementById('resetFilters'),
  product: document.getElementById('product'),
  productDetail: document.getElementById('productDetail'),
  relatedGrid: document.getElementById('relatedGrid'),
  backToResults: document.getElementById('backToResults'),
  startSearch: document.getElementById('startSearch'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  themeLabel: document.getElementById('themeLabel'),
  captureBtn: document.getElementById('captureBtn')
}
const elCart = {
  btn: document.getElementById('cartButton'),
  section: document.getElementById('cart'),
  list: document.getElementById('cartList'),
  total: document.getElementById('cartTotal'),
  clear: document.getElementById('cartClear'),
  checkout: document.getElementById('cartCheckout'),
  badge: document.getElementById('cartBadge')
}
const elAuth = {
  btn: document.getElementById('authButton'),
  section: document.getElementById('auth'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  loginSubmit: document.getElementById('loginSubmit'),
  regName: document.getElementById('regName'),
  regEmail: document.getElementById('regEmail'),
  regPassword: document.getElementById('regPassword'),
  regIsAdmin: document.getElementById('regIsAdmin'),
  regSubmit: document.getElementById('regSubmit'),
  label: document.getElementById('authLabel')
}
const elAdmin = {
  btn: document.getElementById('adminButton'),
  section: document.getElementById('admin'),
  back: document.getElementById('adminBack'),
  search: document.getElementById('adminSearch'),
  category: document.getElementById('adminCategory'),
  reset: document.getElementById('adminReset'),
  save: document.getElementById('adminSave'),
  table: document.getElementById('adminTable')
}

init()

async function init() {
  initTheme()
  lucide.createIcons()
  AOS.init({ once: true })
  gsap.from('#heroTitle', { y: 20, opacity: 0, duration: 0.8 })
  gsap.from('#startSearch', { y: 20, opacity: 0, duration: 0.8, delay: 0.2 })
  await loadData()
  seedDemoAdmin()
  populateBrandModelYear(state.motos, { brand: el.brand, model: el.model, year: el.year })
  buildCategoryOptions(state.parts, el.filterCategory)
  el.filterPrice.value = state.filters.maxPrice
  el.filterPriceValue.textContent = formatCurrency(state.filters.maxPrice)
  if (el.filterCategory.querySelector('option')) el.filterCategory.value = 'Todas'
  wireEvents()
  updateAdminVisibility()
}

async function loadData() {
  const motos = await fetch('./data/motos.json').then(r => r.json())
  const parts = await fetch('./data/parts.json').then(r => r.json())
  state.motos = motos
  const overrides = JSON.parse(localStorage.getItem('co-parts-overrides') || '{}')
  state.overrides = overrides
  state.parts = parts.map(p => ({ ...p, ...(overrides[p.id] || {}) }))
  const cart = JSON.parse(localStorage.getItem('co-cart') || '[]')
  state.cart = Array.isArray(cart) ? cart : []
  const user = JSON.parse(localStorage.getItem('co-user') || 'null')
  state.user = user
}

function wireEvents() {
  el.startSearch.addEventListener('click', () => {
    document.getElementById('search').scrollIntoView({ behavior: 'smooth' })
  })

  el.brand.addEventListener('change', e => {
    state.selection.marca = e.target.value || null
    state.selection.modelo = null
    state.selection.año = null
    if (state.selection.marca) updateModels(state.motos, state.selection.marca, el.model)
    el.year.innerHTML = ''
    el.year.disabled = true
    checkReady()
  })

  el.model.addEventListener('change', e => {
    state.selection.modelo = e.target.value || null
    state.selection.año = null
    if (state.selection.marca && state.selection.modelo) updateYears(state.motos, state.selection.marca, state.selection.modelo, el.year)
    checkReady()
  })

  el.year.addEventListener('change', e => {
    state.selection.año = Number(e.target.value) || null
    checkReady()
  })

  el.view.addEventListener('click', () => {
    const selectedBrand = el.brand.value || null
    const selectedModel = el.model.value || null
    const selectedYear = el.year.value ? parseInt(el.year.value, 10) : null
    state.selection = { marca: selectedBrand, modelo: selectedModel, año: selectedYear }
    if (!state.selection.marca || !state.selection.modelo || !state.selection.año) return
    const filtered = filterCompatibleParts(state.parts, state.selection)
    state.results = filtered
    el.resultsSubtitle.textContent = `${state.selection.marca} ${state.selection.modelo} • ${state.selection.año}`
    applyFilters()
    showSection('results')
    gsap.from('#resultsGrid', { opacity: 0, y: 20, duration: 0.4 })
  })

  el.filterCategory.addEventListener('change', e => {
    state.filters.category = e.target.value
    applyFilters()
  })
  el.filterPrice.addEventListener('input', e => {
    state.filters.maxPrice = Number(e.target.value)
    el.filterPriceValue.textContent = formatCurrency(state.filters.maxPrice)
    applyFilters()
  })
  el.filterSort.addEventListener('change', e => {
    state.filters.sort = e.target.value
    applyFilters()
  })
  let searchTimer
  el.searchQuery.addEventListener('input', e => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      state.filters.search = (e.target.value || '').toLowerCase().trim()
      applyFilters()
    }, 200)
  })
  el.resetFilters.addEventListener('click', () => {
    state.filters = { search: '', category: 'Todas', maxPrice: 300000, sort: 'asc' }
    el.filterCategory.value = 'Todas'
    el.filterPrice.value = 300000
    el.filterPriceValue.textContent = formatCurrency(300000)
    el.filterSort.value = 'asc'
    el.searchQuery.value = ''
    applyFilters()
  })

  el.backToResults.addEventListener('click', () => {
    showSection('results')
  })

  el.themeToggle.addEventListener('click', toggleTheme)
  el.captureBtn.addEventListener('click', capture)

  window.addEventListener('co:addToCart', e => {
    addToCart(e.detail.part)
  })

  elCart.btn.addEventListener('click', () => showSection('cart'))
  elCart.clear.addEventListener('click', () => { state.cart = []; persistCart(); renderCart(); })
  elCart.checkout.addEventListener('click', () => {
    alert('Compra simulada. Gracias por tu pedido.')
    state.cart = []
    persistCart()
    renderCart()
  })

  elAuth.btn.addEventListener('click', () => showSection('auth'))
  elAuth.loginSubmit.addEventListener('click', login)
  elAuth.regSubmit.addEventListener('click', register)

  elAdmin.btn.addEventListener('click', () => { showSection('admin'); renderAdmin(); })
  elAdmin.back.addEventListener('click', () => showSection('results'))
  elAdmin.reset.addEventListener('click', () => { elAdmin.search.value=''; elAdmin.category.value='Todas'; renderAdmin(); })
  elAdmin.search.addEventListener('input', () => renderAdmin())
  elAdmin.category.addEventListener('change', () => renderAdmin())
}

function applyFilters() {
  let list = [...state.results]
  if (state.filters.search) {
    list = list.filter(p => {
      const name = (p.nombre || '').toLowerCase()
      const equiv = Array.isArray(p.equivalentes) ? p.equivalentes.join(' ').toLowerCase() : ''
      return name.includes(state.filters.search) || equiv.includes(state.filters.search)
    })
  }
  if (state.filters.category && state.filters.category !== 'Todas') list = list.filter(p => p.categoria === state.filters.category)
  list = list.filter(p => Number(p.precio) <= state.filters.maxPrice)
  list.sort((a,b) => state.filters.sort === 'asc' ? a.precio - b.precio : b.precio - a.precio)
  renderResultsGrid(el.resultsGrid, list, onDetails)
  if (window.lucide) window.lucide.createIcons()
  const countEl = document.getElementById('resultsCount')
  if (countEl) countEl.textContent = String(list.length)
}

function onDetails(part) {
  renderProductDetail(el.productDetail, part)
  const related = findRelatedParts(state.parts, part)
  renderRelated(el.relatedGrid, related, onDetails)
  showSection('product')
  if (window.lucide) window.lucide.createIcons()
}

function showSection(id) {
  document.getElementById('results').classList.toggle('hidden', id !== 'results')
  document.getElementById('product').classList.toggle('hidden', id !== 'product')
  document.getElementById('cart').classList.toggle('hidden', id !== 'cart')
  document.getElementById('auth').classList.toggle('hidden', id !== 'auth')
  document.getElementById('admin').classList.toggle('hidden', id !== 'admin')
}

function checkReady() {
  const ready = !!(state.selection.marca && state.selection.modelo && state.selection.año)
  el.view.disabled = !ready
}

function initTheme() {
  const saved = localStorage.getItem('co-theme') || 'dark'
  document.documentElement.classList.toggle('dark', saved === 'dark')
  document.documentElement.classList.toggle('light', saved === 'light')
  updateThemeIcon(saved)
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  const next = isDark ? 'light' : 'dark'
  document.documentElement.classList.toggle('dark', next === 'dark')
  document.documentElement.classList.toggle('light', next === 'light')
  localStorage.setItem('co-theme', next)
  updateThemeIcon(next)
}

function updateThemeIcon(mode) {
  el.themeIcon.setAttribute('data-lucide', mode === 'dark' ? 'moon' : 'sun')
  lucide.createIcons()
  if (el.themeLabel) el.themeLabel.textContent = mode === 'dark' ? 'Oscuro' : 'Claro'
}

function capture() {
  html2canvas(document.body).then(canvas => {
    const link = document.createElement('a')
    link.download = 'custom-overlord.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  })
}

function formatCurrency(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function addToCart(part) {
  const idx = state.cart.findIndex(i => i.id === part.id)
  if (idx >= 0) state.cart[idx].qty += 1
  else state.cart.push({ id: part.id, nombre: part.nombre, precio: part.precio, qty: 1 })
  persistCart()
  renderCartBadge()
}

function renderCart() {
  elCart.list.innerHTML = ''
  for (const item of state.cart) {
    const div = document.createElement('div')
    div.className = 'card'
    div.innerHTML = `
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div>
            <div class="card-title">${item.nombre}</div>
            <div class="compat">${formatCurrency(item.precio)}</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-secondary" data-dec="${item.id}">-</button>
            <span class="badge">${item.qty}</span>
            <button class="btn-secondary" data-inc="${item.id}">+</button>
            <button class="btn-secondary" data-del="${item.id}">x</button>
          </div>
        </div>
      </div>
    `
    div.querySelector('[data-inc]').addEventListener('click', () => { item.qty += 1; persistCart(); renderCart() })
    div.querySelector('[data-dec]').addEventListener('click', () => { item.qty = Math.max(1, item.qty - 1); persistCart(); renderCart() })
    div.querySelector('[data-del]').addEventListener('click', () => { state.cart = state.cart.filter(i => i.id !== item.id); persistCart(); renderCart() })
    elCart.list.appendChild(div)
  }
  const total = state.cart.reduce((s, i) => s + i.precio * i.qty, 0)
  elCart.total.textContent = formatCurrency(total)
  renderCartBadge()
}

function renderCartBadge() {
  if (elCart.badge) elCart.badge.textContent = String(state.cart.reduce((s,i)=>s+i.qty,0))
}

function persistCart() {
  localStorage.setItem('co-cart', JSON.stringify(state.cart))
}

function login() {
  const email = elAuth.loginEmail.value.trim().toLowerCase()
  const pass = elAuth.loginPassword.value
  const users = JSON.parse(localStorage.getItem('co-users') || '[]')
  const u = users.find(x => x.email === email && x.password === pass)
  if (!u) { alert('Credenciales inválidas'); return }
  state.user = { email: u.email, name: u.name, role: u.role }
  localStorage.setItem('co-user', JSON.stringify(state.user))
  elAuth.label.textContent = state.user.name
  updateAdminVisibility()
  showSection('results')
}

function register() {
  const name = elAuth.regName.value.trim()
  const email = elAuth.regEmail.value.trim().toLowerCase()
  const password = elAuth.regPassword.value
  const role = elAuth.regIsAdmin.checked ? 'admin' : 'user'
  const users = JSON.parse(localStorage.getItem('co-users') || '[]')
  if (users.find(u => u.email === email)) { alert('Email ya registrado'); return }
  users.push({ name, email, password, role })
  localStorage.setItem('co-users', JSON.stringify(users))
  alert('Cuenta creada')
}

function updateAdminVisibility() {
  const isAdmin = state.user && state.user.role === 'admin'
  elAdmin.btn.classList.toggle('hidden', !isAdmin)
}

function renderAdmin() {
  buildCategoryOptions(state.parts, elAdmin.category)
  elAdmin.category.value = elAdmin.category.value || 'Todas'
  const q = (elAdmin.search.value || '').toLowerCase()
  let list = [...state.parts]
  if (q) list = list.filter(p => p.nombre.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
  const cat = elAdmin.category.value
  if (cat && cat !== 'Todas') list = list.filter(p => p.categoria === cat)
  elAdmin.table.innerHTML = ''
  for (const p of list) {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td class="p-3">${p.nombre}</td>
      <td class="p-3">${p.sku || ''}</td>
      <td class="p-3">${p.categoria}</td>
      <td class="p-3"><input class="table-input" type="number" min="0" value="${p.precio}" data-price="${p.id}"></td>
      <td class="p-3"><input class="table-input" type="number" min="0" value="${p.stock ?? 0}" data-stock="${p.id}"></td>
    `
    elAdmin.table.appendChild(tr)
  }
  elAdmin.save.onclick = () => {
    const inputsPrice = elAdmin.table.querySelectorAll('input[data-price]')
    const inputsStock = elAdmin.table.querySelectorAll('input[data-stock]')
    const overrides = { ...(state.overrides || {}) }
    inputsPrice.forEach(inp => { const id = Number(inp.getAttribute('data-price')); overrides[id] = { ...(overrides[id]||{}), precio: Number(inp.value) } })
    inputsStock.forEach(inp => { const id = Number(inp.getAttribute('data-stock')); overrides[id] = { ...(overrides[id]||{}), stock: Number(inp.value) } })
    localStorage.setItem('co-parts-overrides', JSON.stringify(overrides))
    state.overrides = overrides
    state.parts = state.parts.map(p => ({ ...p, ...(overrides[p.id] || {}) }))
    alert('Cambios guardados')
    applyFilters()
  }
}

function seedDemoAdmin() {
  const users = JSON.parse(localStorage.getItem('co-users') || '[]')
  if (!Array.isArray(users) || users.length === 0) {
    users.push({ name: 'Admin Demo', email: 'admin@customoverlord.local', password: 'admin123', role: 'admin' })
    localStorage.setItem('co-users', JSON.stringify(users))
  }
}