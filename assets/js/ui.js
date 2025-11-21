import { formatPrice } from './compatibility.js'

export function populateBrandModelYear(motos, selects) {
  const brands = Array.from(new Set(motos.map(m => m.marca))).sort();
  fillSelect(selects.brand, ['Selecciona marca', ...brands]);
  selects.model.innerHTML = '';
  selects.model.disabled = true;
  selects.year.innerHTML = '';
  selects.year.disabled = true;
}

export function updateModels(motos, brand, modelSelect) {
  const models = Array.from(new Set(motos.filter(m => m.marca === brand).map(m => m.modelo))).sort();
  fillSelect(modelSelect, ['Selecciona modelo', ...models]);
  modelSelect.disabled = false;
}

export function updateYears(motos, brand, model, yearSelect) {
  const years = new Set();
  for (const m of motos) if (m.marca === brand && m.modelo === model) for (const y of m.años) years.add(y);
  fillSelect(yearSelect, ['Selecciona año', ...Array.from(years).sort((a,b)=>a-b)]);
  yearSelect.disabled = false;
}

export function buildCategoryOptions(parts, select) {
  const cats = Array.from(new Set(parts.map(p => p.categoria))).sort();
  fillSelect(select, ['Todas', ...cats]);
}

export function renderResultsGrid(container, parts, onDetails) {
  container.innerHTML = '';
  if (!parts.length) {
    const msg = document.createElement('div');
    msg.className = 'text-co-gray';
    msg.textContent = 'No hay resultados con los filtros actuales.';
    container.appendChild(msg);
    return;
  }
  for (const p of parts) {
    const card = document.createElement('div');
    card.className = 'card';
    const warn = p._match === 'brand_model_only' ? '<span class="badge warning">Verifica año</span>' : (p._match === 'exact' ? '<span class="badge">Compatibilidad exacta</span>' : '');
    card.innerHTML = `
      <div class="card-body">
        <div class="flex items-center gap-2">
          <i data-lucide="package"></i>
          <h4 class="card-title">${p.nombre}</h4>
        </div>
        <div class="flex items-center justify-between">
          <span class="price">${formatPrice(p.precio)}</span>
          <span class="badge">Stock: ${p.stock ?? '-'}</span>
        </div>
        <p class="compat mt-1">${p.categoria} • ${p.compatibilidad[0]?.marca ?? ''} ${p.compatibilidad[0]?.modelo ?? ''}</p>
        ${p.equivalentes ? `<p class="compat mt-1">Equivalentes: ${p.equivalentes.join(', ')}</p>` : ''}
        <div class="mt-3 flex items-center gap-2">${warn}</div>
        <div class="mt-4 flex gap-2">
          <button class="btn-primary" data-id="${p.id}">Ver detalles</button>
          <button class="btn-secondary" data-add="${p.id}">Agregar al carrito</button>
        </div>
      </div>
    `;
    card.querySelector('button[data-id]').addEventListener('click', () => onDetails(p));
    card.querySelector('button[data-add]').addEventListener('click', () => {
      const ev = new CustomEvent('co:addToCart', { detail: { part: p } })
      window.dispatchEvent(ev)
    })
    container.appendChild(card);
    if (window.lucide) window.lucide.createIcons();
  }
}

export function renderProductDetail(container, part) {
  container.innerHTML = `
    <div>
      <h2 class="font-display text-3xl">${part.nombre}</h2>
      <p class="mt-2 text-co-gray">${part.descripcion ?? 'Sin descripción disponible'}</p>
      <div class="mt-4">
        <span class="price text-2xl">${formatPrice(part.precio)}</span>
        <span class="badge ml-2">Stock: ${part.stock ?? '-'}</span>
      </div>
      <div class="mt-6">
        <h4 class="font-semibold">Compatibilidad exacta</h4>
        <ul class="mt-2 text-sm text-co-gray">
          ${part.compatibilidad.map(c => `<li>${c.marca} ${c.modelo} • ${Array.isArray(c.años) ? c.años.join(', ') : ''}</li>`).join('')}
        </ul>
      </div>
      <div class="mt-6">
        <h4 class="font-semibold">Especificaciones técnicas</h4>
        <p class="text-co-gray">${part.especificaciones ?? 'No especificadas'}</p>
      </div>
      ${part.equivalentes ? `
      <div class="mt-6">
        <h4 class="font-semibold">Equivalentes</h4>
        <p class="text-co-gray">${part.equivalentes.join(', ')}</p>
      </div>` : ''}
      ${part.recomendaciones ? `
      <div class="mt-6">
        <h4 class="font-semibold">Recomendaciones de instalación</h4>
        <p class="text-co-gray">${part.recomendaciones}</p>
      </div>` : ''}
      <div class="mt-8">
        <button class="btn-primary" id="detailAddCart">Agregar al carrito</button>
      </div>
    </div>
  `;
  const btn = document.getElementById('detailAddCart')
  if (btn) btn.addEventListener('click', () => {
    const ev = new CustomEvent('co:addToCart', { detail: { part } })
    window.dispatchEvent(ev)
  })
}

export function renderRelated(container, parts, onDetails) {
  container.innerHTML = '';
  for (const p of parts) {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-body">
        <div class="flex items-center gap-2"><i data-lucide="package"></i><h4 class="card-title">${p.nombre}</h4></div>
        <div class="price mt-1">${formatPrice(p.precio)}</div>
        <button class="btn-secondary mt-3" data-id="${p.id}">Ver</button>
      </div>
    `;
    el.querySelector('button[data-id]').addEventListener('click', () => onDetails(p));
    container.appendChild(el);
    if (window.lucide) window.lucide.createIcons();
  }
}

function fillSelect(select, items) {
  select.innerHTML = '';
  for (const it of items) {
    const opt = document.createElement('option');
    opt.value = it === items[0] ? '' : it;
    opt.textContent = it;
    select.appendChild(opt);
  }
}