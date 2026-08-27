# dsh-key-limits — ТЗ

**Статус:** draft, ждёт approve перед кодом  
**Дата:** 2026-08-27  
**Пакет:** `@goodandready/dsh-key-limits`  
**Замена:** `@goodandready/dsh-spendmeter` (deprecate → remove со staging)

## 1. Цель

Плагин DSH web только для **лимитов/квот по ключам (подпискам)**.  
Никакого учёта spend, ledger, тарифов, графиков, сессий, CSV.

## 2. Пользовательские поверхности

| # | Поверхность | Поведение |
|---|-------------|-----------|
| A | **Плавающий chip** (fixed, drag) | Показывает агрегат/индикатор (напр. худший % среди подписок или «N keys»). Клик → **одна страница/модалка со всеми подписками и их лимитами**. Drag = перемещение, позиция в `localStorage`. |
| B | **Кнопка в строке ввода** (`conversation.composer.bar`) | Показывает лимит **активной** подписки текущей сессии (обычно % remaining). Клик → модалка **только этой** подписки. Нет привязки → `—` / muted, клик либо no-op, либо короткая заглушка «нет ключа». |
| C | **Карточка настроек** (`settings.plugin.item`, key = NS) | Только: список ключей/подписок, add/edit/delete, refresh квот, статус. Единый вид карточки (`sm-*` / skill dsh-plugin-authoring). Свёрнута по умолчанию. |

**Не делаем:** sidebar footer, composer.dock, ¥ float, Command Center tabs, slash-команды (опционально позже одна `/limits`), spend pill, context.

## 3. Активная подписка

Та же семантика, что у spendmeter SubChip:

- по `sessionId` → route provider (+ fingerprint credentials, если есть);
- match к сохранённой подписке;
- квоты из кэша/refresh.

Правило UX: **bar = одна активная**; **float chip / settings = все**.

## 4. Host (серверная половина)

### 4.1 Config (минимум)

```
storageDir: string   // default ~/.dsh/storages/dsh-key-limits
refreshHours: number // default 24
ui: {
  floatChip: boolean // default true
  composerBar: boolean // default true
}
```

Без: currency, prices, OpenRouter tariffs, budget, anomaly, syncMinutes ledger, pill slots.

### 4.2 Хранилище

- Каталог: `~/.dsh/storages/dsh-key-limits/`
- Секреты ключей — как сейчас через credentials / encrypted store (перенести паттерн из `dsh-spendmeter` `lib/subs.js`, без ledger).
- Миграция (опционально, phase 2): импорт `subs` из spendmeter storage — **не блокер v1**.

### 4.3 HTTP API (prefix `/dsh-key-limits`)

| Method | Path | Назначение |
|--------|------|------------|
| GET | `/health` | `{ ok: true, name }` |
| GET | `/config` | публичный ui-config |
| GET | `/subs` | список подписок + quota windows / balance / stale / error |
| GET | `/subs?refresh=1` | refresh всех |
| GET | `/subs?refresh=1&id=` | refresh одной |
| POST | `/subs` | add/update |
| DELETE | `/subs?id=` | delete |
| GET | `/active-sub?sessionId=` | активная подписка + quota для bar |

Нет: `/summary`, `/sessions`, `/requests`, `/deepseek-wallet` (¥ — только если провайдер deepseek отдаёт balance **как часть quota card**, не отдельный float).

### 4.4 Провайдеры v1

Перенос fetchers из spendmeter `PROVIDERS` (без spend-логики):

- cline, deepseek, openrouter, ollama, qwen, kimi, glm, minimax, opencode-go (если oauth стабилен)

Неподдерживаемый provider → status `unsupported`, без падения плагина.

### 4.5 Inject

`webServer`, `sessions` (для active-sub), `credentials`, `settings`, client: `slots`, `locale` (+ runtime).

**Не** подписываемся на `session/event` для usage/ledger.

## 5. Client

- Исходники сразу модульно: `src/client/*` + `npm run build:client` → `lib/client.js` (как в spendmeter 0.1.23+).
- Компоненты: `FloatChip`, `ActiveKeyButton`, `AllLimitsModal`, `OneLimitModal`, `SettingsCard`, `SubsList`.
- Стили: префикс `kl-` (key-limits), тема только CSS variables; карточка настроек — эталон skill.
- i18n: `en`/`ru` через `ctx.locale.register('dsh-key-limits', …)`.
- ErrorBoundary вокруг body mount.

## 6. Вне scope (явно)

- Учёт токенов/$, графики, peak/off-peak, CSV, anomaly, budget pace
- Context UI
- Публикация npm без отдельного approve
- Автомиграция секретов spendmeter в v1 (можно issue follow-up)

## 7. Критерии приёмки

1. На staging: plugin load без `failed to apply`.
2. Bar показывает % (или баланс) активной подписки; клик → только она.
3. Float chip drag + клик → все подписки с лимитами.
4. Settings: add key → refresh → видно окна квот; delete работает.
5. `dsh-spendmeter` снят с profile web после cutover.
6. Smoke: remove/add file: + restart + health + journal clean.
7. Тёмная и светлая тема: карточка не ломается.

## 8. Риски

- Путаница двух плагинов на staging → жёсткий cutover (remove spendmeter).
- OAuth/cookie провайдеры сложнее api_key → в UI честный status/error.
- NS settings key должен совпадать с namespace (`dsh-key-limits`).
