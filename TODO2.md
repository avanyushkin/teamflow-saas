# TeamFlow — TODO2: план до конца MVP

Продолжение `TODO.md` (файл удалён из рабочего дерева, но жив в истории — `git show <commit>:TODO.md`,
последний раз тронут в `679b409`). Этот документ написан после ревизии фактического состояния кода
на `2026-08-17` (ветка `feature/home`) и фиксирует три архитектурных решения, принятых при планировании:

1. **Доменная модель расширяется** с плоской `Card/CardMember` до полной иерархии
   `Organization → Project → Task → Comment` (+ `Subscription` под биллинг). `Card` эволюционирует в `Project`
   (это уже сущность с владельцем/участниками/ролями — семантически ближе всего к проекту, чем к задаче).
2. **Заводится отдельный backend-сервис** (`services/backend`, Node/Express) — не только под файлы, как
   в исходном плане, а как выделенная песочница под весь бэкенд-стек, который не ложится естественно в
   Next.js Server Actions: Socket.io, BullMQ, кастомный JWT access/refresh + Redis-сессии, файлы,
   собственный REST API с версионированием/пагинацией/HATEOAS. Next.js остаётся монолитом для
   CRUD-логики продукта (Server Actions/Route Handlers), `services/backend` — для всего, что требует
   долгоживущего процесса или отдельного transport-слоя.
3. **Auth остаётся на next-auth v4** (JWT-стратегия). Тема "JWT access+refresh с ротацией" и
   "express-session + Redis" не выбрасывается, а переезжает в `services/backend` как отдельный
   учебный модуль (см. Этап 2), не конфликтуя с текущим рабочим flow в Next.js.

Отмечай пункты по мере готовности: `- [ ]` → `- [x]`. Уже реализованное на момент написания — сразу
помечено `[x]` с указанием файла, чтобы не переделывать.

---

## Этап 0. Ревизия фундамента

- [x] Prisma выбран основным ORM (`lib/prisma.ts`, `@prisma/adapter-neon` для serverless)
- [ ] Восстановить `TODO.md` из истории (`git restore TODO.md` или `git show <sha>:TODO.md > TODO.md`) —
      он всё ещё ценен как архивный документ первоначального видения; TODO2 его не копирует, а продолжает
- [ ] ESLint + Prettier единая конфигурация, Husky + lint-staged, conventional commits (`feat:`, `fix:`
      вместо текущего вольного `feat (feature/home): ...`)
- [ ] `.env.example` — сейчас `.env`/`.env.local` есть, но нет шаблона для онбординга
- [ ] `tsconfig.json`: добавить `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
      `noPropertyAccessFromIndexSignature` — сейчас включён только базовый `strict`
- [ ] Git-практика по ходу проекта (не разовое упражнение, а фиксировать по факту):
  - [ ] хотя бы один осознанный **rebase** линейной feature-ветки перед мержем и один **merge commit**
        там, где важно сохранить историю параллельной работы — коротко записать, почему выбран каждый
  - [ ] **cherry-pick** реального фикса из `feature/*` в `main` в обход промежуточных коммитов
  - [ ] **`git bisect`** хотя бы раз на реальном баге (например, регрессия в поиске карточек)
  - [ ] выбрать стратегию ветвления осознанно: сейчас де-факто `main`/`dev`/`feature/*` — решить,
        GitFlow это или переход на trunk-based, и задокументировать в `CONTRIBUTING.md`

## Этап 1. Доменная модель v2 и база данных

- [ ] Новая Prisma-схема:
  - `Organization` (id, name, slug)
  - `Membership` (userId, organizationId, role: OWNER/ADMIN/MEMBER) — RBAC на уровне организации,
        отдельно от текущего `CardMember` (который остаётся/переименуется под `Project`)
  - `Project` — миграция текущего `Card` (переименование модели + `organizationId`)
  - `ProjectMember` — миграция текущего `CardMember`
  - `Task` (новая сущность: принадлежит `Project`, есть `status` для канбан-колонок: `TODO/IN_PROGRESS/DONE`,
        `assigneeId`, `dueDate`)
  - `Comment` (принадлежит `Task`, автор — `User`, содержимое — rich text под DOMPurify, см. Этап 3)
  - `Subscription` (заготовка под Этап 11: `organizationId`, `stripeCustomerId`, `plan`, `status`)
- [ ] Написать и прогнать миграцию (`prisma migrate dev`), обновить все текущие server actions
      (`app/(cards)/actions.ts`) под новые имена/связи
- [ ] **Seed-скрипт** (`prisma/seed.ts` + `seed` в `prisma.config.ts`) — тестовые организации,
      проекты, задачи, пользователи с разными ролями
- [ ] Хотя бы одно **JSONB-поле** (например, `User.settings` или `Task.metadata`) + выборка через `->>`
      в сыром SQL-запросе (`prisma.$queryRaw`)
- [ ] Ручная практика чистого PostgreSQL (без ORM, в `psql`/DataGrip): `JOIN`, `EXPLAIN ANALYZE` на
      запросе списка задач с фильтрами, транзакции `BEGIN/COMMIT/ROLLBACK`, один `VIEW`
      (например, "задачи с просроченным дедлайном по организациям")
- [ ] **DrizzleORM** — переписать один изолированный модуль (например, чтение `Task` для канбан-доски)
      на Drizzle, чтобы на практике сравнить с Prisma (типобезопасность запросов, миграции, DX)
- [ ] **MongoDB** — использовать для одного осмысленно document-ориентированного кейса, где реляционная
      модель избыточна: activity log / лента событий (`{ type, actorId, projectId, payload, createdAt }`)
      в `services/backend`. Задача — на практике почувствовать разницу парадигм, а не "просто добавить",
      поэтому реализовать чтение ленты активности на карточке проекта через Mongo, а не Postgres

## Этап 2. Аутентификация, авторизация, мультитенантность

- [x] next-auth v4: Credentials (bcrypt) + Google + GitHub OAuth (`app/configs/auth.ts`)
- [x] Middleware-защита роутов через `getToken` (`middleware.ts`)
- [x] RBAC на уровне карточки: `isOwner`/`isAdmin`/`canManage`, `updateMemberRole` (`app/(cards)/actions.ts`)
- [ ] Перенести RBAC на уровень `Organization` (роль в `Membership`) + оставить `ProjectMember`-роль как
      второй, более узкий уровень (пример: `MEMBER` организации может не быть участником каждого проекта)
- [ ] Email-верификация и восстановление пароля (Resend в проде / Mailhog в докере, см. Этап 15)
- [ ] Явная ревизия cookie-флагов next-auth (`httpOnly`, `secure`, `sameSite`) — задать вручную в
      `authConfig.cookies`, не полагаться на дефолты молча
- [ ] **Type Guards и Assertion Functions** на реальных auth-проверках вместо `if`-цепочек:
      `function isMembershipRole(x: unknown): x is MembershipRole`,
      `function assertSession(session: Session | null): asserts session is Session` — использовать в
      server actions вместо повторяющихся ранних `return`
- [ ] `services/backend` (отдельный модуль, не конкурирует с next-auth в вебе, а закрывает теорию):
  - [ ] Собственный JWT access+refresh с **Refresh Token Rotation** (короткий access, длинный refresh,
        инвалидация старого refresh при использовании) — для service-to-service или мобильного клиента
  - [ ] `express-session` + Redis-стор — поднять параллельно JWT-потоку, чтобы сравнить на практике
  - [ ] `passport.js` + Google/GitHub OAuth — независимо от next-auth, как отдельный learning-модуль
  - [ ] RBAC-мидлвар на Express (`requireRole('ADMIN')`) — сравнить с реализацией в Next.js middleware

## Этап 3. Backend API

- [x] Server Actions для мутаций (`app/(cards)/actions.ts`, `app/api/auth/actions.ts`)
- [ ] Route Handlers под публичный REST в Next.js (`app/api/v1/...`) — версионирование в пути,
      пагинация (`?page=&limit=` или cursor-based), фильтрация/сортировка задач по статусу/исполнителю
- [ ] Осознанная работа со статус-кодами и телом ответа: `201` с `Location`-заголовком при создании,
      `409` при конфликте (например, дубликат приглашения в организацию), `422` с деталями валидации
      (не просто "200 значит ок")
- [ ] **HATEOAS** и **Content Negotiation** — реализовать на одном эндпоинте показательно (например,
      `GET /api/v1/tasks/:id` отдаёт `_links` на проект/комментарии; `Accept: application/json` vs
      кастомный `application/vnd.teamflow.v1+json`)
- [ ] Собственный REST API в `services/backend` для файлов/активности — с теми же принципами
      версионирования/пагинации, чтобы закрыть тему на изолированном сервисе, а не только в Next.js
- [ ] Zod-схемы, шаренные между клиентом (react-hook-form resolver) и сервером (server action/route
      handler validation) — вынести общие схемы в `lib/schemas/`
- [ ] **DOMPurify** — для рендера `Comment.content`, если комментарии допускают rich text/HTML
- [ ] **Продвинутые типы TypeScript** на реальных местах кода бэкенда:
  - [ ] `infer` + Conditional Types: `type ActionResult<T> = T extends (...args: any[]) => Promise<infer R> ? R : never`
        — вывести тип успешного ответа из существующих server actions без ручного дублирования
  - [ ] Mapped Types: `type FieldErrors<T> = { [K in keyof T]?: string[] }` для отображения ошибок
        zod-валидации в формах создания задачи/проекта
  - [ ] Template Literal Types: типизировать имена событий Socket.io (`type ProjectEvent = \`project:${string}:updated\``)
        и/или версионированные пути `\`/api/v${1 | 2}/${string}\``
  - [ ] Declaration file: написать `.d.ts` для одной нетипизированной зависимости в `services/backend`
        (проверить, есть ли такая после установки multer/sharp — если все с `@types`, взять любую
        внутреннюю утилиту без типов и явно задокументировать её сигнатуру через `.d.ts`)

## Этап 4. React: concurrent features — почти закрыт

- [x] `ScrollView` на `forwardRef` + `useImperativeHandle` (`components/scroll-view.tsx`)
- [x] `useTransition` на поиске/фильтрации карточек (`components/cards-board.tsx`)
- [x] standalone `startTransition`
- [x] `Suspense` + `React.lazy` для `CreateCardDialog` (`components/home-content.tsx`)
- [x] `ErrorBoundary` на независимых зонах (доска карточек, чат-заглушка на странице карточки)
- [ ] Применить `ScrollView`/виртуализацию к канбан-доске Task-колонок после Этапа 1/5 (сейчас
      применено только к списку карточек)
- [ ] **React DevTools Profiler**: снять профиль до/после точечных `memo`/`useCallback`/`useMemo` на
      канбан-доске (после Этапа 5), зафиксировать конкретные компоненты, где пропали лишние ре-рендеры

## Этап 5. Канбан-доска и стейт-менеджмент

- [ ] Канбан-доска задач (`Task`) с drag-n-drop через **dnd-kit**, колонки = `Task.status`
- [ ] **TanStack Query**: `queryKey/queryFn` для чтения проектов/задач, `useMutation` для
      создания/перемещения задачи, **оптимистичные обновления** при drag-n-drop (сразу переносим
      карточку в UI, откатываем при ошибке сервера), инвалидация vs `setQueryData` — использовать оба
      подхода в разных местах и понимать разницу; **prefetching** при наведении на проект,
      **paginated/infinite query** для длинного списка задач
- [ ] **Zustand**: клиентский UI-стейт, не относящийся к серверным данным (открытые модалки, выбранный
      вид доски list/board, локальные фильтры) — со **slices**, **persist** (сохранить последний
      выбранный вид между сессиями) и **devtools**
- [ ] **Redux Toolkit** — мини-эксперимент на одном изолированном модуле (например, локальный кэш
      участников проекта для автокомплита): `createEntityAdapter`, нормализация, кастомный middleware
      (логирование экшенов) — чтобы на практике сравнить с Zustand/TanStack Query
- [ ] Короткий письменный вывод (ADR или комментарий в README): когда Context, когда Zustand, когда
      TanStack Query, когда Redux Toolkit — на конкретных примерах из этого проекта
- [ ] `next-themes` — light/dark toggle (CSS-переменные для тёмной темы уже есть в `app/globals.css`,
      но переключателя нет)

## Этап 6. CSS и дизайн-система

- [x] Tailwind v4 через `@theme inline` в `app/globals.css`, shadcn/ui на базе `@base-ui/react`
- [ ] Кастомный Tailwind-плагин (например, утилиты для канбан-колонок или паттерн `.card-elevated`)
- [ ] `@apply` в одном переиспользуемом компонентном классе, `group`/`peer` — на практике (например,
      hover-состояние иконки внутри карточки задачи через `group-hover`)
- [ ] Кастомизация shadcn/ui компонентов под собственную дизайн-систему (не дефолтные токены)
- [ ] **CSS Modules** — осознанно применить хотя бы к одному сложному компоненту (например, канбан-доска
      с нестандартной сеткой), чтобы предметно сравнить с Tailwind-подходом, а не пропускать тему
- [ ] **CSS Container Queries** на карточке задачи — адаптация к ширине контейнера (доска/список), а
      не вьюпорта
- [ ] **CSS Layers** (`@layer`) — упорядочить каскад между Tailwind base/кастомными стилями/сторонней
      библиотекой (актуально после появления CSS Modules и кастомного плагина)
- [ ] **View Transition API** — плавный переход при открытии задачи в модалку/detail-view
- [ ] **Framer Motion** — анимации там, где View Transition не подходит (например, drag-n-drop
      перетаскивание карточки, появление тоста)
- [ ] CSS keyframes/transitions напрямую (без библиотек) — минимум один пример, чтобы не полагаться
      только на Framer Motion
- [ ] Адаптивная/резиновая вёрстка без фреймворков на одном экране: `clamp()` для типографики,
      `minmax()`/`auto-fit` в CSS Grid для сетки проектов без media-запросов

## Этап 7. Accessibility (a11y)

- [ ] ARIA roles/states/properties на кастомных элементах канбан-доски (drag handle, колонка как
      `role="list"`, карточка как `role="listitem"`)
- [ ] Focus trap в модалках (`CreateCardDialog` и будущая модалка задачи), возврат фокуса на элемент,
      открывший модалку
- [ ] Клавиатурная навигация по канбан-доске (перемещение карточки между колонками с клавиатуры —
      dnd-kit это поддерживает "из коробки", но нужно проверить и донастроить)
- [ ] `:focus-visible` вместо безусловного `outline` по всему проекту
- [ ] Автоматизированный аудит: **axe DevTools** + **Lighthouse a11y** на ключевых страницах (главная,
      карточка проекта, канбан-доска)
- [ ] Один ручной прогон со скринридером (NVDA+Firefox или VoiceOver+Safari) на сценарии
      "зарегистрироваться → создать проект → создать задачу"

## Этап 8. Производительность

- [x] Частичный debounce на поиске (`components/cards-board.tsx`, ручной `setTimeout`)
- [x] `React.lazy`/`Suspense` для тяжёлой модалки создания карточки
- [ ] Замерить **Core Web Vitals** (LCP, CLS, INP) на главной и странице проекта, довести до "хорошо"
      (Chrome DevTools Performance / `web-vitals` пакет)
- [ ] **Next/Image** + AVIF/WebP + lazy loading для всех изображений, кроме LCP-элемента (сейчас
      картинки только в `images/` для README — появятся аватары/вложения после Этапа 10)
- [ ] `preload` для критичных шрифтов, `preconnect`/`dns-prefetch` для внешних origin (Stripe, S3/R2)
- [ ] **Виртуализация** длинного списка через `@tanstack/react-virtual` — лог активности (после Этапа 1
      MongoDB-фида) или длинный список задач в проекте
- [ ] Переиспользуемые **debounce/throttle хуки** (`useDebouncedValue`, `useThrottledCallback`) —
      написать руками, с пониманием проблемы "debounce внутри `useState`" и решением через `useRef`;
      throttle применить на scroll-трекинге (например, sticky-заголовок доски)
- [ ] **Bundle analyzer** (`@next/bundle-analyzer`) — найти и устранить один реальный источник раздутия
      бандла (кандидат: react-hook-form+zod уже частично вынесены через lazy — проверить, что ещё тяжёлое)
- [ ] Динамические импорты (`next/dynamic`) там, где `React.lazy` неприменим (например, тяжёлый чарт
      активности без Suspense-обёртки)

## Этап 9. Real-time

- [ ] **Socket.io** в `services/backend`: комнаты по `projectId`, аутентификация через handshake
      (передать JWT из next-auth сессии при коннекте, верифицировать на сервере)
- [ ] Live-обновления канбан-доски (перемещение задачи другим участником) и живая лента комментариев
- [ ] **Presence** — кто сейчас смотрит доску (набор онлайн user id по комнате)
- [ ] **Redis Adapter** для Socket.io — горизонтальное масштабирование на несколько инстансов
      `services/backend`

## Этап 10. Файлы и вложения

- [ ] `services/backend`: загрузка вложений к задачам и аватаров через `multer` + `multipart/form-data`
- [ ] `sharp` для ресайза/оптимизации изображений на сервере (thumbnail для аватаров)
- [ ] Presigned URL для прямой загрузки в S3-совместимое хранилище (Cloudflare R2)
- [ ] Обработка больших файлов через **streams** (`Readable`/`Writable`/`Transform`) и `pipe`, не
      буферизируя целиком в памяти — применимо к загрузке крупных вложений
- [ ] Вынести тяжёлый `sharp`-ресайз в **worker_threads**, чтобы не блокировать event loop основного
      процесса `services/backend` — на практике почувствовать разницу с/без выноса
- [ ] Осознанно применить **cluster** (или `worker_threads` для CPU-bound части) в `services/backend`
      и коротко зафиксировать, чем `cluster` отличается от `worker_threads` по кейсам применения
- [ ] Практика **Event Loop** осмысленно: где в `services/backend` код попадает в poll/check/timers
      фазы (например, `setImmediate` после обработки файла vs `setTimeout(0)`) — небольшой
      демонстрационный пример с комментарием, не просто теория
- [ ] Обработка `process.env`, глобальных объектов, `uncaughtException`/`unhandledRejection` на
      верхнем уровне `services/backend` (graceful shutdown при фатальной ошибке)

## Этап 11. Биллинг

- [ ] Модель `Subscription` из Этапа 1 — привязка к `Organization`
- [ ] Stripe Checkout + Customer Portal
- [ ] Вебхуки: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
      (Route Handler в Next.js, с верификацией подписи)
- [ ] Feature gating по тарифу — проверка плана организации в middleware/server actions (например,
      лимит на количество проектов на бесплатном плане)

## Этап 12. Фоновые задачи и очереди

- [ ] **BullMQ** + Redis в `services/backend`: email-дайджесты, обработка Stripe-вебхуков асинхронно,
      напоминания о дедлайнах задач
- [ ] Retry-политика и отслеживание состояния джобы (failed/completed/active) — минимальный dashboard
      или лог

## Этап 13. Тестирование

Сейчас в проекте нет ни одного теста и ни одной тестовой зависимости — этап с нуля.

- [ ] **Jest** + **React Testing Library** — конфигурация для Next.js 16 (`jest.config.ts`,
      `next/jest`)
- [ ] Компонентные тесты с **mocking**: замокать server action (`getMyCards`/будущий `getProjects`),
      замокать `useSession`/auth-хук, замокать React Context (после появления Zustand/контекстов)
- [ ] Осознанные **снапшот-тесты** — только там, где UI стабилен и снапшот реально ловит регресс
      (например, рендер пустого состояния доски), не на каждый компонент подряд
- [ ] **Supertest** — интеграционные тесты REST API в `services/backend` (аутентификация, CRUD
      вложений) и/или Route Handlers в Next.js
- [ ] Моки БД для тестов — in-memory Postgres (`pg-mem`) или тестовый контейнер (Testcontainers) для
      integration-тестов, не мок Prisma-клиента целиком
- [ ] **Playwright** e2e — минимум: регистрация/логин (credentials + один OAuth в mock-режиме),
      создание организации → проекта → задачи, перемещение задачи по канбан-доске, оплата в Stripe
      test mode

## Этап 14. Безопасность

- [ ] **Content-Security-Policy** для прод-сборки (`next.config.ts` → `headers()`, сейчас конфиг пуст)
- [ ] Явная настройка `httpOnly`/`secure`/`SameSite` на всех куках, не только next-auth дефолт
      (см. Этап 2), плюс на кастомных куках `services/backend` (refresh-token)
- [ ] **CSRF**-защита на всех формах вне Server Actions — токен в заголовке для REST-эндпоинтов
      `services/backend` (Server Actions в Next.js уже защищены встроенным механизмом)
- [ ] **DOMPurify**-ревизия всех мест рендера пользовательского контента (описания проектов,
      комментарии к задачам) — не только внедрить один раз, а пройтись по всем точкам вывода

## Этап 15. DevOps и инфраструктура

- [ ] Dockerfile для Next.js-приложения (multi-stage build)
- [ ] Dockerfile для `services/backend`
- [ ] `docker-compose.yml`: app + `services/backend` + Postgres + MongoDB + Redis + Mailhog
- [ ] **GitHub Actions**: lint → typecheck → test → build на каждый PR (матрица под оба пакета после
      Этапа 16, до этого — два отдельных job'а на монолит и на `services/backend`)
- [ ] Секреты и конфигурация: env vars на платформе деплоя + базовое знакомство с Vault (хотя бы
      локальный запуск `vault server -dev` и чтение одного секрета оттуда, без полноценной интеграции)
- [ ] Деплой: Vercel (Next.js-приложение) + Neon (уже используется) + Upstash Redis
- [ ] Деплой `services/backend` на облачный сервер (Railway или DigitalOcean/EC2) + Nginx + SSL
      (Let's Encrypt/Certbot)
- [ ] Базовое знакомство с Kubernetes: `Pod`/`Deployment`/`Service`/`Ingress` — задеплоить
      `services/backend` в **minikube** ради практики (не для прода)

## Этап 16. Middle-стретч (по желанию, после MVP)

Закрывает оставшуюся часть теории, не блокирует MVP:

- [ ] Переписать `services/backend` на **NestJS** (модули, провайдеры, декораторы, guards,
      interceptors, Swagger) вместо голого Express
- [ ] **GraphQL**-эндпоинт поверх одного модуля (Apollo Server или NestJS/GraphQL, code-first) —
      сравнить с существующим REST на том же домене
- [ ] **Turborepo/pnpm workspaces**: разнести на `apps/web` (текущий Next.js) + `apps/backend`
      (текущий `services/backend`) + `packages/shared` (общие Zod-схемы и типы) — настроить
      **`tsconfig` references** между пакетами (это единственное место, где реально нужна тема
      "монорепозитории" из стека — до этого момента её вводить искусственно не нужно)
- [ ] **Storybook** + Chromatic для UI-кита (визуальные регрессии на shadcn-компонентах)
- [ ] **Winston/Pino** логирование с correlation-id в `services/backend`

## Этап 17. Наблюдаемость и процесс (soft skills)

- [ ] **Sentry** для ошибок фронта и `services/backend`
- [ ] Минимум один **ADR** (Architecture Decision Record) на нетривиальное решение — например,
      "почему Prisma остаётся основным ORM, а Drizzle — экспериментом" или "почему отдельный
      backend-сервис, а не всё в Next.js Route Handlers"
- [ ] Формальный код-ревью себя на одном PR по чек-листу, будто ревьюишь чужой код (завести
      `CODE_REVIEW_CHECKLIST.md` и реально пройти по нему)
- [ ] Оценка задач в Story Points — расписать Этапы 9–12 (real-time/файлы/биллинг/очереди) в
      story points и сверить оценку с фактическим временем после выполнения
- [ ] Написать техническую документацию для "джуниора", как будто онбордишь нового разработчика в
      проект — README-раздел или отдельный `ONBOARDING.md`, объясняющий доменную модель и архитектуру
      бэкенда (Next.js монолит vs `services/backend`) — это и есть практика менторства, раз рядом нет
      реального джуна

---

## Как читать этот план

Порядок этапов — рекомендованный, а не жёсткий: Этап 1 (доменная модель) блокирует почти всё
остальное, поэтому логично начать с него. Этапы 4 и частично 8 уже в основном закрыты — отмечены
явно, чтобы не тратить время на повтор. Этапы 13 (тестирование) и 7 (a11y) стоит начинать тянуть
параллельно с Этапом 5, а не откладывать до конца — иначе тесты придётся писать на уже большую
кодовую базу разом.