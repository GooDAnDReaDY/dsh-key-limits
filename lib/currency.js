// lib/currency.js — Multi-currency normalization and exchange rate caching
import { readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULT_RATES = {
  USD: 1.0,
  CNY: 7.25,
  RUB: 95.0,
  EUR: 0.92,
}

export const CURRENCY_SYMBOLS = {
  USD: '$',
  CNY: '¥',
  RUB: '₽',
  EUR: '€',
}

export function normalizeCurrency(cur) {
  if (!cur) return 'USD'
  const c = String(cur).trim().toUpperCase()
  if (c === '$' || c === 'USD') return 'USD'
  if (c === '¥' || c === 'CNY' || c === 'RMB') return 'CNY'
  if (c === '₽' || c === 'RUB' || c === 'RUR') return 'RUB'
  if (c === '€' || c === 'EUR') return 'EUR'
  return 'USD'
}

export function getCurrencySymbol(cur) {
  const norm = normalizeCurrency(cur)
  return CURRENCY_SYMBOLS[norm] || norm
}

export function convertCurrency(amount, fromCur, toCur, rates = DEFAULT_RATES) {
  if (amount == null) return null
  const num = Number(amount)
  if (!Number.isFinite(num)) return null
  const from = normalizeCurrency(fromCur)
  const to = normalizeCurrency(toCur)
  if (from === to) return num

  const activeRates = { ...DEFAULT_RATES, ...(rates || {}) }
  const fromRate = Number(activeRates[from]) || DEFAULT_RATES[from] || 1.0
  const toRate = Number(activeRates[to]) || DEFAULT_RATES[to] || 1.0

  // Normalize via USD base: amount_in_usd = num / fromRate; target = amount_in_usd * toRate
  const inUsd = num / fromRate
  return inUsd * toRate
}

export function formatConvertedBalance({
  amount,
  fromCurrency = 'USD',
  toCurrency = 'auto',
  rates = DEFAULT_RATES,
  locale = 'en',
} = {}) {
  if (amount == null) return { formatted: '—', hint: null, convertedAmount: null }
  const num = Number(amount)
  if (!Number.isFinite(num)) return { formatted: '—', hint: null, convertedAmount: null }

  const from = normalizeCurrency(fromCurrency)
  const fromSym = getCurrencySymbol(from)

  if (!toCurrency || toCurrency === 'auto' || normalizeCurrency(toCurrency) === from) {
    return {
      formatted: `${fromSym}${num.toFixed(2)}`,
      convertedAmount: num,
      currency: from,
      symbol: fromSym,
      hint: null,
    }
  }

  const to = normalizeCurrency(toCurrency)
  const toSym = getCurrencySymbol(to)
  const converted = convertCurrency(num, from, to, rates)
  if (converted == null) {
    return {
      formatted: `${fromSym}${num.toFixed(2)}`,
      convertedAmount: num,
      currency: from,
      symbol: fromSym,
      hint: null,
    }
  }

  const activeRates = { ...DEFAULT_RATES, ...(rates || {}) }
  const effectiveRate = Number(activeRates[to]) || DEFAULT_RATES[to] || 1.0
  const rateDisplay = effectiveRate >= 10 ? effectiveRate.toFixed(1) : effectiveRate.toFixed(2)

  // Use '~' prefix for converted estimate
  const formatted = `~${toSym}${converted.toFixed(converted >= 100 ? 0 : 2)}`
  const hint = `orig: ${fromSym}${num.toFixed(2)} at ${rateDisplay}`

  return {
    formatted,
    convertedAmount: converted,
    currency: to,
    symbol: toSym,
    hint,
    originalFormatted: `${fromSym}${num.toFixed(2)}`,
    rate: effectiveRate,
  }
}

const RATES_CACHE_TTL_MS = 24 * 3600000 // 24 hours

export class CurrencyManager {
  constructor({ storeDir, logger, fetchFn } = {}) {
    this.storeDir = storeDir || null
    this.logger = logger || null
    this.fetchFn = fetchFn || (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : null)
    this.cachePath = storeDir ? join(storeDir, 'rates.json') : null
    this.rates = { ...DEFAULT_RATES }
    this.fetchedAt = 0
    this._loadCache()
  }

  _loadCache() {
    if (!this.cachePath) return
    try {
      const raw = JSON.parse(readFileSync(this.cachePath, 'utf8'))
      if (raw && typeof raw === 'object' && raw.rates && typeof raw.rates === 'object') {
        this.rates = {
          ...DEFAULT_RATES,
          USD: 1.0,
          CNY: Number(raw.rates.CNY) || DEFAULT_RATES.CNY,
          RUB: Number(raw.rates.RUB) || DEFAULT_RATES.RUB,
          EUR: Number(raw.rates.EUR) || DEFAULT_RATES.EUR,
        }
        this.fetchedAt = typeof raw.fetchedAt === 'number' ? raw.fetchedAt : 0
      }
    } catch (e) {
      // cache missing or invalid, fallback to DEFAULT_RATES
    }
  }

  _saveCache() {
    if (!this.cachePath || !this.storeDir) return
    try {
      mkdirSync(this.storeDir, { recursive: true })
      const payload = JSON.stringify({
        rates: this.rates,
        fetchedAt: this.fetchedAt,
      }, null, 2)
      writeFileSync(this.cachePath, payload, { mode: 0o600 })
      try { chmodSync(this.cachePath, 0o600) } catch (e) { /* ignore */ }
    } catch (err) {
      this.logger?.warn?.('[dsh-key-limits] CurrencyManager save error:', err?.message)
    }
  }

  async updateRates(force = false) {
    const now = Date.now()
    if (!force && this.fetchedAt && (now - this.fetchedAt) < RATES_CACHE_TTL_MS) {
      return this.rates
    }
    if (!this.fetchFn) return this.rates

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 4000)
      const res = await this.fetchFn('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
        headers: { 'User-Agent': 'dsh-key-limits' }
      })
      clearTimeout(timer)

      if (res && res.ok) {
        const body = await res.json()
        const r = body && body.rates
        if (r && typeof r === 'object') {
          this.rates = {
            ...DEFAULT_RATES,
            USD: 1.0,
            CNY: Number(r.CNY) || this.rates.CNY,
            RUB: Number(r.RUB) || this.rates.RUB,
            EUR: Number(r.EUR) || this.rates.EUR,
          }
          this.fetchedAt = now
          this._saveCache()
        }
      }
    } catch (err) {
      // offline / blocked in test: fallback to existing or default rates safely
      this.logger?.debug?.('[dsh-key-limits] Currency rates fetch skipped or failed:', err?.message)
    }
    return this.rates
  }

  getRates() {
    return { ...this.rates, fetchedAt: this.fetchedAt }
  }

  convert(amount, fromCur, toCur) {
    return convertCurrency(amount, fromCur, toCur, this.rates)
  }

  format(opts) {
    return formatConvertedBalance({ ...opts, rates: this.rates })
  }
}