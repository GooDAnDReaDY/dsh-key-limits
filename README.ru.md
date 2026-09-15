# 📦 @goodandready/dsh-key-limits

<div align="center">

<h3>Мониторинг лимитов квот, тарифных планов и балансов API-ключей в реальном времени для DeepSeek Harness</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-key-limits"><img src="https://img.shields.io/npm/v/@goodandready/dsh-key-limits.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GooDAnDReaDY/dsh-key-limits.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<!-- Обязательная кнопка перехода на витрину всех проектов -->
<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/Все_проекты_автора-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="Все проекты автора"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a>
</p>

<!-- Обязательный блок поддержки проекта -->
<table align="center">
  <tr>
    <td align="center">
      ⭐ <strong>Если вам нравится этот плагин, поставьте ему Star на GitHub</strong> — это покажет мне, что плагин полезен, и добавит мотивации продолжать его развитие.
      <br><br>
      🐛 <strong>Если вы нашли баг или хотите предложить новую функцию</strong>, создайте Issue на GitHub на любом языке — я рассмотрю предложение и реализую полезные улучшения в одной из следующих версий плагина.
    </td>
  </tr>
</table>

</div>

---

## ⚡ Обзор и решаемая проблема

Разработчики и исследователи искусственного интеллекта регулярно работают с десятком разных провайдеров LLM, корпоративными квотами и тарифными подписками одновременно (OpenCode GO, Ollama Cloud, Qwen Cloud, Kimi, GLM, MiniMax, Cline, DeepSeek, OpenRouter, Command Code).

Без наглядного мониторинга квот непосредственно в DeepSeek Harness (DSH):
- Сессии диалога внезапно падают с ошибками посреди генерации кода, когда 5-часовое окно или месячный лимит кредитов исчерпан.
- Пользователь не видит, какой конкретно аккаунт или ключ привязан к активной модели текущего чата.
- Постоянное переключение по десяткам личных кабинетов провайдеров отвлекает от работы.

`dsh-key-limits` решает эту задачу, обеспечивая ненавязчивый фоновый контроль остатков квот и балансов прямо в веб-интерфейсе DSH. Плагин намеренно исключает громоздкий бухгалтерский учёт и тяжелые базы данных расходов, фокусируясь исключительно на живом контроле лимитов.

---

## 🏗️ Архитектура и схема движения данных

```mermaid
graph LR
  subgraph Client ["Клиент Web UI (DSH)"]
    FC["FloatChip (Плавающий чип)"]
    CB["ActiveKeyButton (Кнопка в строке ввода)"]
    SC["Карточка настроек (settings.plugin.item)"]
    M["Модальные окна (Все лимиты / Активный ключ)"]
  end

  subgraph Backend ["Бэкенд плагина (Cordis)"]
    Router["HTTP API (/dsh-key-limits)"]
    CredStore["Защищённое хранилище учётных данных"]
    Updater["Локальный One-Click Updater"]
  end

  subgraph Providers ["Провайдеры и Реестры"]
    P1["OpenCode GO / Ollama / Qwen"]
    P2["Command Code / Cline / GLM"]
    P3["DeepSeek / OpenRouter / MiniMax"]
    NPM["Реестр npmjs.org"]
  end

  FC -->|Клик| M
  CB -->|Клик| M
  M -->|Опрос квот раз в 60с| Router
  SC -->|Сохранение ключей| Router
  SC -->|Проверка обновления| Updater
  Router --> CredStore
  Router -->|Параллельный опрос (таймаут 12с)| P1
  Router -->|Параллельный опрос (таймаут 12с)| P2
  Router -->|Параллельный опрос (таймаут 12с)| P3
  Updater -->|Проверка версий и установка| NPM
```

---

## ✨ Исчерпывающий разбор возможностей

### 1. Плавающий чип (`FloatChip`)
- **Постоянный индикатор**: отображает минимальный оставшийся процент квоты среди всех ключей (или общее число активных аккаунтов).
- **Свободное перемещение с защитой от вылета**: перетаскивается мышью и жестами с автоограничением границами окна (`viewport clamping`). Координаты сохраняются в `localStorage`.
- **Окно всех лимитов**: клик открывает подробный список всех 9 аккаунтов с полосами заполнения, датами сброса и тарифами.

### 2. Кнопка в строке ввода сообщений (`ActiveKeyButton`)
- Встроена в панель ввода сообщений (`conversation.composer.bar`, приоритет 10).
- Автоматически инспектирует модель текущего диалога и отображает актуальный процент или денежный баланс именно для неё.
- Клик открывает детальную модалку только активного ключа.

### 3. Очередность аккаунтов и «Активный всегда сверху»
- **Ручной порядок (`order`)**: в настройках можно менять последовательность аккаунтов с помощью кнопок ▲ / ▼.
- **Закрепление активного (`activeOnTop`)**: аккаунт, привязанный к открытому чату, автоматически выводится на первое место. По умолчанию включено.

### 4. Человекопонятный таймер сброса (`fmtReset`)
- Если до сброса больше 24 часов: отображает дни, часы и минуты (например, `5д 5ч 19м`).
- Если меньше 24 часов: только часы и минуты (например, `4ч 59м`).
- Для истекших окон выводится статус обновления.

### 5. Спокойный и нативный дизайн
- Вертикальный отступ **12px** между карточками исключает наплывы границ и слипание.
- Нейтральные тона темы для нормальных остатков (>30%), предупреждающие янтарный (<30%) и красный (<15%) зарезервированы только для реального исчерпания.
- Аккуратные прогресс-бары высотой 5px.

### 6. Встроенное автообновление в один клик
- Проверка наличия новой версии в карточке настроек.
- Установка точной опубликованной версии из npm без ручного ввода консольных команд.
- Защита: разрешены только loopback-запросы с совпадающим Origin.

---

## 🔌 Поддерживаемые провайдеры

| ID провайдера | Название | Типы окон квот | Метод авторизации |
|---------------|----------|----------------|-------------------|
| `commandcode` | Command Code | Скользящее 5ч / Неделя / Месяц (тарифы GOAT, Pro, Max) | API-ключ (`user_...` или токен) |
| `opencode-go` | OpenCode GO | Скользящее 5ч / Неделя / Месяц | Сессионная кука (`auth`) и Workspace ID |
| `ollama` | Ollama Cloud | Сессия / Неделя / Месяц | API-ключ и сессионная кука |
| `qwen` | Qwen Cloud | 5 часов / 1 неделя (Token Plan) | Сессионная кука и опциональный `sec_token` |
| `kimi` | Kimi for Coding | Недельный лимит вызовов | API-ключ (`sk-kimi-...`) |
| `glm` | GLM (Z.ai) | Дневной / Месячный лимит | API-ключ личного кабинета |
| `minimax` | MiniMax Coding Plan | Квота Coding Plan | API-ключ (`sk-cp-...`) |
| `cline` | Cline | 5 часов / Неделя / Месяц | Bearer API токен |
| `deepseek` | DeepSeek | Баланс лицевого счёта ($ / ¥) | API-ключ (`sk-...`) |
| `openrouter` | OpenRouter | Баланс лицевого счёта ($ credits) | API-ключ (`sk-or-...`) |

---

## 📦 Быстрая установка

Установка официального публичного пакета в профиль DSH:

```bash
dsh plugin --profile web add @goodandready/dsh-key-limits
```

Перезапуск веб-интерфейса:

```bash
dsh web --profile web
```

---

## ⚙️ Параметры конфигурации (`settings.yaml`)

```yaml
# ~/.dsh/profiles/web/settings.yaml
plugins:
  '@goodandready/dsh-key-limits':
    storageDir: ~/.dsh/storages/dsh-key-limits
    refreshIntervalMs: 60000
    activeOnTop: true
    order: []
```

### Таблица параметров

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `storageDir` | `string` | `~/.dsh/storages/dsh-key-limits` | Каталог хранения файла метаданных подписок `subs.json`. |
| `refreshIntervalMs` | `number` | `60000` (1 мин) | Интервал фонового опроса провайдеров в миллисекундах. |
| `activeOnTop` | `boolean` | `true` | Закреплять ли аккаунт активной сессии на самом верху списка. |
| `order` | `string[]` | `[]` | Пользовательский порядок идентификаторов подписок. |

---

## 🛠️ Разработка и тестирование

```bash
# Сборка клиентского бандла lib/client.js
npm run build:client

# Запуск полного набора тестов
npm test
```

### Структура проекта

```
.
├── lib/
│   ├── index.js          # Точка входа Cordis и маршруты HTTP
│   ├── client.js         # Собранный клиентский бандл
│   ├── cards.js          # Генерация карточек квот
│   ├── subs.js           # Опрос API провайдеров и расчёт окон
│   ├── paths.js          # Утилиты путей
│   └── plugin-updater.js # Безопасный One-Click Updater
├── src/client/           # Исходники модулей браузерного клиента
│   ├── 01-prelude.js     # Стили и привязки React
│   ├── 02-locale.js      # Словари локализации (en, zh, ru)
│   ├── 03-format.js      # Форматирование дат, процентов и цветов
│   ├── 04-modals.js      # Модальные окна AllLimitsModal и OneLimitModal
│   ├── 05-bar.js         # Кнопка панели ввода ActiveKeyButton
│   ├── 06-float.js       # Плавающий бейдж FloatChip
│   ├── 07-settings.js    # Карточка настроек, сортировка и апдейтер
│   └── 08-apply.js       # Инициализация плагина и регистрация слотов
├── cordis.patch.yml      # Манифест расширения Cordis
└── test/                 # Модульные тесты
```

---

## 📄 Лицензия

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)

