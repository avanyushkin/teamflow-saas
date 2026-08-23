# TeamFlow — TODO (roadmap v3)

Продолжение `TODO.md`/`TODO2.md` (оба удалены из рабочего дерева этим коммитом, но живы в истории:
`git show 6e6de2e:TODO2.md`, `git show 679b409:TODO.md`). Причина переписывания — смена фокуса: вместо
равномерного покрытия всей теории сейчас сознательно усиливаем **Redux Toolkit, проектирование Web API,
бэкенд на Express и связку фронтенд↔бэкенд**. Остальные темы из TODO2 никуда не делись, но сдвинуты
ниже по списку и не блокируют текущую работу.

Весь код по-прежнему пишется руками, без ИИ-инструментов. Отмечай пункты по мере готовности: `- [ ]` → `- [x]`.

---

## Этап 0. Рефакторинг: классическая структура → модульная архитектура

Сейчас проект организован по техническим слоям: все страницы в `app/`, все компоненты плоским списком в
`components/`, вся бизнес-логика в паре `actions.ts` на route-group, весь `lib/` — общая свалка утилит.
Это нормально для маленького MVP, но не масштабируется на Organization/Project/Task/Comment и тем более
на два бэкенда (Next.js + Express). Цель этапа — перейти на модульную (feature-based) структуру, где
код сгруппирован по домену, а не по типу файла.

- [ ] Спроектировать целевую структуру, например:
  ```
  app/                      — только роутинг (page.tsx/layout.tsx), тонкий, без бизнес-логики
  modules/
    auth/                   — components, actions.ts, schemas.ts, types.ts (из app/(auth)/*)
    projects/               — cards-board, create-card-dialog, task-card, member-row, actions.ts,
                               zod-schemas/card.ts (из app/(cards)/* + components/*)
    profile/                — profile page logic, getProfileData
  shared/
    ui/                     — текущий components/ui (shadcn-примитивы)
    lib/                    — prisma.ts, utils.ts, levenshtein.ts
    store/                  — Redux store (см. Этап 2)
  ```
- [ ] Перенести `app/(cards)/actions.ts` + `zod-schemas/card.ts` + связанные компоненты в `modules/projects/`
      (учесть, что `Card` мигрирует в `Project`, см. Этап 1 — переносить и переименовывать одновременно,
      не в два прохода)
- [ ] Перенести `app/(auth)/*` (`login`, `register`, `zod-schemas.ts`) в `modules/auth/`
- [ ] Перенести профильную логику (`getProfileData`, `app/profile/page.tsx`) в `modules/profile/`
- [ ] `components/ui/*` → `shared/ui/` (это уже фактически "чужой", неймспейс shadcn, не трогать логику,
      просто зафиксировать в новой структуре как shared-слой)
- [ ] Обновить все импорты и алиасы в `tsconfig.json` под новую структуру (`@/modules/*`, `@/shared/*`)
- [ ] Явно зафиксировать правило: `app/**/page.tsx` не содержит бизнес-логику — только композицию
      компонентов из `modules/*` и передачу данных, которые он получил от server actions/route handlers
- [ ] После переезда — прогнать `npm run build` и `npm run lint`, чтобы рефакторинг не оставил битых
      импортов (сначала переносить и чинить импорты, а не удалять старое, пока новое не собирается)

## Этап 1. Доменная модель v2 — довести до конца (сейчас в процессе, есть баг)

`prisma/schema.prisma` уже частично переписан (незакоммичено): `Card` → `Project`, добавлены
`Organization`, `Membership`, `Task`, `Comment`, `Subscription`. Но миграция не закончена и не собирается:

- [ ] Починить `ProjectMember.role`: ссылается на `CardRole`, а enum был переименован в `ProjectRole`
      (`prisma/schema.prisma` — `model ProjectMember`)
- [ ] Починить `ProjectMember.card`: связь `card Card @relation(...)` ссылается на модель `Card`, которой
      больше нет в схеме (модель называется `Project`) — переименовать поле и тип связи
- [ ] После правки схемы — прогнать `npx prisma validate`, затем `npx prisma migrate dev`
- [ ] Обновить `app/(cards)/actions.ts` (после Этапа 0 — `modules/projects/actions.ts`) под новые имена:
      весь код сейчас всё ещё обращается к `prisma.card`/`prisma.cardMember` — это не соберётся с новой
      схемой (`getMyCards`, `getCardById`, `createCard`, `updateMemberRole`, `getProfileData`)
- [ ] Обновить фронтенд-компоненты (`cards-board.tsx`, `task-card.tsx`, `member-row.tsx`,
      `create-card-dialog.tsx`) под переименованные поля/типы
- [ ] Seed-скрипт (`prisma/seed.ts`) — тестовые организации, проекты, задачи, пользователи с разными
      ролями (сейчас тестовые данные создаются вручную через Prisma Studio)
- [ ] RBAC на уровне `Organization` через `Membership.role`, отдельно от текущего `ProjectMember.role`
      (пример: `MEMBER` организации не обязан быть участником каждого проекта)

## Этап 2. Redux Toolkit — основной слой клиентского состояния (приоритет)

В TODO2 RTK был "мини-экспериментом на одном модуле". Сейчас цель — сделать его основным инструментом
клиентского state management в приложении (не только для сравнения, а как рабочий инструмент), включая
RTK Query как основной способ общения с REST API (Этапы 3–5).

- [ ] Настроить store: `configureStore`, типизированные `useAppDispatch`/`useAppSelector`, `<Provider>`
      в `app/layout.tsx` (учесть client-only природу Provider в App Router — обёртка через `"use client"`
      компонент)
- [ ] Слайс клиентского UI-состояния (не серверные данные): открытые модалки, выбранный вид доски,
      локальные фильтры — то, что раньше планировалось под Zustand
- [ ] `createEntityAdapter` для нормализованных сущностей — участники проекта, задачи канбан-доски
      (нормализация вместо вложенных массивов, `selectAll`/`selectById`/`selectIds`)
- [ ] Кастомный middleware (например, логирование каждого экшена в dev-режиме) — понять сигнатуру
      `(store) => (next) => (action) => {...}` руками, не копируя готовый `redux-logger`
- [ ] **RTK Query** как основной слой данных для REST API (Этапы 3–4): `createApi`, `endpoints`,
      теги и инвалидация (`providesTags`/`invalidatesTags`), `useXQuery`/`useXMutation` хуки в компонентах
- [ ] Оптимистичные обновления через RTK Query (`onQueryStarted` + `updateQueryData`) — применить на
      перемещении задачи по канбан-доске (Этап 6) и на promote/demote роли участника
- [ ] Redux DevTools — проверить трассировку экшенов и time-travel debugging на реальном сценарии
- [ ] Короткий письменный вывод: когда Server Actions (текущий подход в `modules/*`), а когда RTK Query
      — на конкретных примерах из проекта (например: мутация формы создания проекта — server action;
      живой список задач с частым обновлением — RTK Query к Route Handler)

## Этап 3. Web API — проектирование REST в Next.js Route Handlers

- [ ] `app/api/v1/...` — версионирование в пути, вынести первый реальный ресурс (например,
      `GET/POST /api/v1/projects`, `GET/PATCH/DELETE /api/v1/projects/:id`) как альтернативу part
      текущих server actions, специально для чтения через RTK Query с клиента
- [ ] Пагинация (`?page=&limit=` или cursor-based — выбрать одну осознанно и объяснить почему) на списке
      проектов/задач
- [ ] Фильтрация и сортировка через query-параметры (задачи по `status`/`assigneeId`, сортировка по
      `createdAt`/`dueDate`)
- [ ] Осознанные статус-коды и тело ответа: `201` + `Location`-заголовок при создании, `409` при
      конфликте (дубликат участника), `422` с деталями zod-валидации, `404` vs `403` (не путать
      "не найдено" с "нет доступа" — сейчас в `getCardById` оба случая возвращают `null`, для REST API
      это должны быть разные коды)
- [ ] Zod-схемы, шаренные между клиентом (react-hook-form resolver) и сервером (route handler
      validation) — вынести общие схемы в `shared/schemas/`
- [ ] HATEOAS и Content Negotiation на одном показательном эндпоинте (`GET /api/v1/projects/:id`
      отдаёт `_links` на задачи/участников; `Accept: application/json` vs кастомный
      `application/vnd.teamflow.v1+json`)
- [ ] DOMPurify для `Comment.content`, если комментарии допускают rich text/HTML

## Этап 4. Backend на Express (`services/backend`)

Отдельный сервис, не конкурирующий с Next.js за продуктовый CRUD — песочница под всё, что не ложится
естественно в Server Actions/Route Handlers, и одновременно полигон для чистого REST/Express-стека.

- [ ] Инициализация проекта: `services/backend`, TypeScript, модульная структура с самого начала
      (`routes/`, `controllers/`, `services/`, `middleware/`, `types/` — не повторять текущую плоскую
      структуру монолита)
- [ ] Express + базовые middleware: `express.json()`, `cors` (осознанно настроенный, не `origin: "*"`),
      `helmet`, централизованный error-handling middleware (`(err, req, res, next) => ...`)
- [ ] Собственный REST-ресурс на Express (например, файлы/вложения или activity log — см. будущие
      этапы файлов/real-time) с теми же принципами версионирования/пагинации, что и в Этапе 3, чтобы
      сравнить DX Route Handlers vs Express на одинаковой задаче
- [ ] Подключение к БД из Express: тот же Postgres, что и у Next.js-приложения — решить осознанно,
      шарить ли Prisma-клиент/схему между двумя сервисами или взять `pg` напрямую для части модулей
- [ ] Собственный JWT access+refresh с Refresh Token Rotation (короткий access, длинный refresh,
      инвалидация старого refresh при использовании) — независимо от next-auth в Next.js
- [ ] RBAC-мидлвар (`requireRole('ADMIN')`) — сравнить с текущей RBAC-логикой в Next.js middleware/actions
- [ ] `nodemon`/`ts-node-dev` для дев-цикла, `npm run dev` в `services/backend/package.json`

## Этап 5. Связка фронтенд ↔ бэкенд

Как Next.js-фронтенд реально говорит с двумя бэкендами (собственные Route Handlers + внешний
`services/backend`) — это отдельная, осознанно закрываемая тема, а не побочный эффект Этапов 2–4.

- [ ] Единый API-клиент слой (`shared/api/`): базовый `fetch`-wrapper с базовым URL по окружению
      (`NEXT_PUBLIC_API_URL` для Express, относительные пути для собственных Route Handlers),
      единая обработка ошибок/таймаутов
- [ ] RTK Query `baseQuery` — настроить `fetchBaseQuery` под оба источника (два `createApi` или один
      с динамическим `baseUrl` по эндпоинту) + `prepareHeaders` для проброса токена авторизации
- [ ] CORS end-to-end: с браузера на `services/backend` (другой порт/origin) — увидеть реальную preflight
      OPTIONS-ошибку хотя бы раз до того, как настроить `cors` правильно, чтобы понимать, что чинишь
- [ ] Мост авторизации между next-auth (JWT в httpOnly cookie на стороне Next.js) и собственным
      JWT `services/backend` — решить и задокументировать: прокидывать next-auth токен в Express для
      верификации, или выдавать отдельный токен `services/backend` после логина в Next.js
- [ ] Единообразные loading/error/empty состояния на клиенте, управляемые статусами RTK Query
      (`isLoading`/`isFetching`/`isError`) — без ручных `useState<boolean>` на каждый запрос
- [ ] `socket.io-client` на фронтенде + Redux: диспатчить экшены в store по событиям сокета
      (обновление канбан-доски другим участником), закрыть тему до полноценного канбана из Этапа 6

---

## Этап 6. Канбан-доска и остальной state management

- [ ] Канбан-доска задач (`Task`) с drag-n-drop через **dnd-kit**, колонки = `Task.status`
- [ ] Прогнать перемещение задачи через RTK Query оптимистичные обновления (см. Этап 2)
- [ ] TanStack Query — короткое сравнение с уже внедрённым RTK Query на одном и том же эндпоинте
      (не как основной инструмент, а как осознанное сравнение подходов)
- [ ] Zustand — короткое сравнение с Redux-слайсом на одном и том же куске UI-состояния
- [ ] `next-themes` — light/dark toggle (переменные тёмной темы уже есть в `app/globals.css`)

## Этап 7. CSS и дизайн-система

- [x] Tailwind v4 через `@theme inline`, shadcn/ui на базе `@base-ui/react`
- [ ] Кастомный Tailwind-плагин (утилиты для канбан-колонок)
- [ ] `@apply`, `group`/`peer` на практике
- [ ] CSS Modules — осознанно на одном сложном компоненте (канбан-доска), для сравнения с Tailwind
- [ ] CSS Container Queries на карточке задачи
- [ ] CSS Layers (`@layer`)
- [ ] View Transition API — переход при открытии задачи в детальный вид
- [ ] Framer Motion — там, где View Transition не подходит

## Этап 8. Accessibility (a11y)

- [ ] ARIA roles/states на кастомных элементах канбан-доски
- [ ] Focus trap в модалках, возврат фокуса на открывший элемент
- [ ] Клавиатурная навигация по канбан-доске
- [ ] `:focus-visible` вместо безусловного `outline`
- [ ] axe DevTools + Lighthouse a11y
- [ ] Один ручной прогон со скринридером

## Этап 9. Производительность

- [x] Частичный debounce на поиске, `React.lazy`/`Suspense` для модалки создания карточки
- [ ] Core Web Vitals (LCP, CLS, INP) на главной и странице проекта
- [ ] Next/Image + AVIF/WebP + lazy loading
- [ ] Виртуализация длинного списка (`@tanstack/react-virtual`)
- [ ] Переиспользуемые debounce/throttle хуки руками (`useRef`, не `useState`)
- [ ] Bundle analyzer — найти и устранить источник раздутия

## Этап 10. Real-time

- [ ] Socket.io в `services/backend`: комнаты по `projectId`, аутентификация через handshake
- [ ] Presence — кто сейчас смотрит доску
- [ ] Redis Adapter для горизонтального масштабирования Socket.io

## Этап 11. Файлы и вложения

- [ ] `services/backend`: `multer` + `multipart/form-data`, `sharp` для ресайза
- [ ] Presigned URL в S3-совместимое хранилище (Cloudflare R2)
- [ ] Обработка больших файлов через streams (`Readable`/`Writable`/`Transform`)
- [ ] `worker_threads` для тяжёлого `sharp`-ресайза, чтобы не блокировать event loop
- [ ] Graceful shutdown, `uncaughtException`/`unhandledRejection` на верхнем уровне `services/backend`

## Этап 12. Биллинг

- [ ] `Subscription` — привязка к `Organization`
- [ ] Stripe Checkout + Customer Portal + вебхуки с верификацией подписи
- [ ] Feature gating по тарифу

## Этап 13. Фоновые задачи и очереди

- [ ] BullMQ + Redis в `services/backend`: email-дайджесты, Stripe-вебхуки, напоминания о дедлайнах

## Этап 14. Тестирование

- [ ] Jest/Vitest + React Testing Library, конфигурация под Next.js 16
- [ ] Мокинг server actions / RTK Query эндпоинтов / auth-хуков
- [ ] Supertest — интеграционные тесты REST API в `services/backend` и Route Handlers
- [ ] Playwright e2e: регистрация → организация → проект → задача → канбан

## Этап 15. Безопасность

- [ ] Content-Security-Policy для прод-сборки
- [ ] Явные cookie-флаги (`httpOnly`/`secure`/`SameSite`) в next-auth и в `services/backend`
- [ ] CSRF-защита на REST-эндпоинтах `services/backend`
- [ ] DOMPurify-ревизия всех мест рендера пользовательского контента

## Этап 16. DevOps и инфраструктура

- [ ] Dockerfile для Next.js-приложения и для `services/backend`
- [ ] `docker-compose.yml`: app + `services/backend` + Postgres + Redis
- [ ] GitHub Actions: lint → typecheck → test → build
- [ ] Деплой: Vercel (app) + Neon + Upstash Redis, `services/backend` на Railway/EC2 + Nginx/SSL

## Этап 17. Middle-стретч (по желанию)

- [ ] `services/backend` на NestJS вместо голого Express — для сравнения
- [ ] GraphQL-эндпоинт поверх одного модуля
- [ ] Turborepo/pnpm workspaces — `apps/web` + `apps/backend` + `packages/shared`
- [ ] Winston/Pino логирование с correlation-id

## Этап 18. Наблюдаемость и процесс

- [ ] Sentry для фронта и `services/backend`
- [ ] ADR на нетривиальные решения (например, "почему RTK Query вместо TanStack Query как основной
      data layer")
- [ ] Формальный код-ревью себя на одном PR по чек-листу

---

## Как читать этот план

Этапы 0–5 — активный фокус прямо сейчас (модульная архитектура → доменная модель → Redux Toolkit →
Web API → Express → связка фронт/бэк), в этом порядке, потому что каждый следующий зависит от
предыдущего. Этапы 6–18 — продолжение общей теории из прежнего плана, актуальны, но не блокируют
текущую работу и не требуют забегать вперёд.
