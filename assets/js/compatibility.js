export function matchPartToMoto(part, moto) {
  const brand = (moto?.marca ?? '').toLowerCase().trim()
  const model = (moto?.modelo ?? '').toLowerCase().trim()
  const year = Number(moto?.año)
  const combos = Array.isArray(part.compatibilidad) ? part.compatibilidad : []
  for (const c of combos) {
    const cBrand = (c.marca ?? '').toLowerCase().trim()
    const cModel = (c.modelo ?? '').toLowerCase().trim()
    if (cBrand === brand && cModel === model) {
      const years = Array.isArray(c.años) ? c.años.map(n => Number(n)) : []
      if (years.includes(year)) return 'exact'
      return 'brand_model_only'
    }
  }
  return 'not_compatible'
}

export function filterCompatibleParts(parts, moto) {
  const out = []
  for (const p of parts) {
    const status = matchPartToMoto(p, moto)
    if (status !== 'not_compatible') out.push({ ...p, _match: status })
  }
  return out
}

export function findRelatedParts(parts, base) {
  const sameCat = parts.filter(x => x.id !== base.id && x.categoria === base.categoria)
  return sameCat.slice(0, 6)
}

export function formatPrice(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}