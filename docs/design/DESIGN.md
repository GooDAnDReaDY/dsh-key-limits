# DESIGN.md — dsh-key-limits

## Product / Purpose
- **Назначение:** Отображение квот, оставшихся лимитов и балансов API-ключей/подписок провайдеров в DeepSeek Harness (DSH). Предотвращает внезапное исчерпание лимитов при диалогах с AI.
- **Канонический путь репозитория:** `/mnt/external/Project/DEV/dhsplugins/dsh-key-limits` (согласно `dhs-plugin-release-workflow`).
- **Аудитория:** Разработчики и пользователи DSH, использующие несколько провайдеров (OpenCode, DeepSeek, OpenRouter, Kimi, GLM, MiniMax, Cline, Ollama, Command Code).
- **Статус:** Production-ready. Версия 0.2.9.

---

## User Surfaces
- **Web/UI:**
  - `FloatChip`: плавающий draggable-чип с индикацией минимальной оставшейся квоты и количества активных ключей. Клик открывает All Limits Hub.
  - `ActiveKeyButton`: компактная кнопка в composer bar рядом с вводом сообщения. Показывает текущий активный ключ и процент остатка. Клик открывает One Limit Modal текущего провайдера.
  - `AllLimitsModal`: оверлей со всеми добавленными подписками, окнами квот (5h, weekly, monthly) и балансами.
  - `AddKeyModal`: диалог добавления ключа с валидацией провайдера и автоматическим тестом квоты.
- **DSH UI / settings / slots:**
  - `settings.plugin.item`: key = `dsh-key-limits` (`SETTINGS_NS`), карточка в «Настройки → Плагины → Настройки плагинов».
  - `conversation.composer.bar`: id = `key-limits-active`.
  - Body Root: `#dsh-key-limits-root` для плавающего чипа.
- **API:**
  - `GET /dsh-key-limits/health` — проверка работоспособности.
  - `GET /dsh-key-limits/config` — публичная конфигурация UI и схемы провайдеров (`schemas`).
  - `GET /dsh-key-limits/subs` — список подписок, карточки квот, балансы.
  - `POST /dsh-key-limits/subs` — создание/обновление подписки (секреты в DSH credentials).
  - `DELETE /dsh-key-limits/subs?id=` — удаление подписки.
  - `GET /dsh-key-limits/active-sub?sessionId=` — привязка сессии к ключу и квоте.
  - `GET /dsh-key-limits/update` — статус обновлений из npmjs.
  - `POST /dsh-key-limits/update` — запуск автообновления.
- **CLI:** Отсутствует. Управление только через UI и штатный `dsh plugin --profile web add/remove`.
- **Документация:**
  - `README.md` (English, канонический).
  - `README.zh.md` (Chinese, обязательный).
  - `README.ru.md` (Russian, зеркальный).
  - `CHANGELOG.md`, `docs/design/DESIGN.md`.

---

## Visual Direction
- **Атмосфера:** Премиальный утилитарный системный интерфейс. Гармоничное встраивание в нативный дизайн DSH (Dark/Light режимы ядра).
- **Спокойная цветовая схема:** 
  - Карточки подписок имеют вертикальный flex gap 12px.
  - Здоровые остатки (>30%) выводятся в нейтральном цвете темы, без кричащей кислотно-зелёной заливки.
  - Прогресс-бары: лаконичные полосы высотой 5px.
  - Таймер сброса: читаемый человеческий формат (`X d Y h Z m` для >= 24ч, `Y h Z m` для < 24ч).
- **Утверждённые референсы:** Нативные компоненты ядра DSH (`settings.plugin.item`, `dsw-alias-*` переменные, бейджи и кнопки ядра).
- **Не копировать:** Интерфейсы сторонних дашбордов, неоморфизм, избыточные анимации, градиенты без семантики.

---

## Foundations
- **Цвета и роли:**
  - Фоны и границы: `var(--dsw-alias-bg-base)`, `var(--dsw-alias-bg-layer-3)`, `var(--dsw-alias-border-subtle)`.
  - Текст: `var(--dsw-alias-label-primary)`, `var(--dsw-alias-label-secondary)`, `var(--dsw-alias-label-tertiary)`.
  - Семантические цвета квот:
    - Normal / Safe (> 30% remaining): спокойный нейтральный цвет текста / `var(--dsw-alias-state-success)`.
    - Warning (15% .. 30% remaining): `var(--dsw-alias-state-warning)`.
    - Danger (< 15% remaining): `var(--dsw-alias-state-danger)`.
    - Muted / Stale / No Route: `var(--dsw-alias-label-tertiary)`.
- **Типографика:** Системный DSH стек шрифтов, tabular-nums для цифр процентов и балансов.
- **Сетка, отступы, responsive:** Bento-сетка для окон квот (`.kl-bentoGrid`), карточка скругление 12px, модалка 24px, плавающий чип 999px pill.
- **Accessibility:** 
  - Навигация с клавиатуры: карточка открывается по кнопке с `aria-expanded`.
  - Закрытие всех модалок по клавише `Escape` и клику на оверлей.
  - Не полагаться только на цвет: цветовой индикатор всегда дублируется числовым значением процентов или знаком статуса.

---

## Components And States
- **Компоненты:** `FloatChip`, `ActiveKeyButton`, `KeyLimitsPluginCard`, `AllLimitsModal`, `OneLimitModal`, `AddKeyModal`, `QuotaBars`, `BalanceBlock`.
- **Loading:** Деликатный пульсирующий индикатор / `klT("loading")`, без блокировки страницы.
- **Empty:** Иконка ключа и явный призыв настроить подписки в карточке настроек.
- **Stale:** Пометка `stale` (оранжевый бейдж), если данные кэша старше `SUBS_REFRESH_MS` и фоновый запрос в процессе.
- **Error:** Компактный красный баннер с текстом ошибки провайдера (`kl-errBanner`).
- **Destructive Action:** Подтверждение удаления подписки с отображением её метки.

---

## User Flows
- **Критический путь 1 (First Run):** Установка плагина → Настройки → Плагины → карточка Key Limits → «+ Add key» → выбор провайдера → ввод ключа → автоматический refresh квот → появление статуса в Floating Chip и Composer Bar.
- **Критический путь 2 (Диагностика лимита в чате):** Пользователь общается в сессии → видит процент оставшейся квоты в composer bar → кликает → видит модалку текущего провайдера со временем сброса (Rolling 5h, Weekly).
- **Критический путь 3 (Сводка подписок):** Клик на Floating Chip → All Limits Hub → просмотр балансов и квот по всем добавленным ключам → ручной точечный refresh по необходимости.

---

## Do / Don't
- **Do:**
  - Использовать CSS-переменные DSH `var(--dsw-alias-*)`.
  - Ограничивать координаты чипа границами вьюпорта (clamping).
  - Защищать динамические стили атрибутом `data-dsh-plugin="dsh-key-limits"`.
  - Сохранять секреты только через сервис DSH credentials.
- **Don't:**
  - Не добавлять сбор статистики токенов, графики расходов, историю сессий и ledger.
  - Не хардкодить цвета или шрифты вне CSS-переменных.
  - Не использовать зашитый русский текст в кодовой базе плагина.

---

## Locked Design Decisions
- **2026-08-27:** Разделение UX: кнопка в строке ввода (`conversation.composer.bar`) отображает *только одну активную подписку* сессии; плавающий чип и карточка настроек отображают *все подписки*.
- **2026-08-27:** Отказ от Command Center, графиков, подсчёта потраченных долларов и ledger — плагин строго ориентирован на квоты и лимиты.
- **2026-09-04:** Хранение ключей переведено на сервис DSH credentials, в `subs.json` сохраняется только `credentialRef`.
- **2026-09-15:** Изоляция стилей через `data-dsh-plugin="dsh-key-limits"` с выгрузкой через `ctx.effect`.
- **2026-09-15:** Clamping плавающего чипа в границах видимого экрана и поддержка `Escape` для модалок.
- **2026-09-17:** Разделение констант namespace: маршрутный префикс `ROUTE_PREFIX = '/dsh-key-limits'` и пространство настроек `SETTINGS_NS = 'dsh-key-limits'` (#32).
- **2026-09-17:** Полное удаление зашитого словаря `KL_ru` и браузерного fallback из плагина; `en` и `zh` в плагине, `ru` через `dsh-russian-lang` (#28).
- **2026-09-17:** Исключение всех standalone `rgba` и `hex` цветов из `src/client/*` в пользу CSS-токенов темы DSH `var(--dsw-alias-*)` (#33).
- **2026-09-17:** Декомпозиция `lib/subs.js` (1006 строк) на `lib/provider-fetchers.js` и компактный `lib/subs.js` (#35).
- **2026-09-17:** Каноническое размещение репозитория плагина в `/mnt/external/Project/DEV/dhsplugins/dsh-key-limits` согласно стандарту `dhs-plugin-release-workflow` (#9).
- **2026-09-17:** Публикационный слой `publish.sh` и `.gitattributes` исключают внутренние файлы разработки (`AGENTS.md`, `index.md`, `docs/plans`, деплойные скрипты) из публичного GitHub-зеркала (#31).
- **2026-09-27:** Внедрение аналитического блока (v0.2.8): расчет здоровья пула `poolStats` (#71), скользящий расчет скорости выгорания квоты `calcBurnRate` и времени до исчерпания на 24ч горизонте (#72), обратный отсчет до сброса `findNearestReset` в тултипе чипа и бейджах (#73), компактный SVG-спарклайн `UsageSparkline` без тяжелых чарт-библиотек с нулевым хардкодом цветов (#74).
- **2026-09-27:** Расширение провайдеров и эргономики UI (v0.2.9): нативный фетчер SiliconFlow (#75), фетчеры Anthropic, Groq и Gemini с выносом в `lib/provider-extra-fetchers.js` для соблюдения стандарта 600 строк (#76), режим привязки чипа к углу экрана Docked Mode (#77), глобальный хоткей `Alt+K` для вызова хаба лимитов (#78), всплывающий баннер Danger Toast при падении квоты активного ключа ниже 15% (#79).
