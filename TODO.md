# TeamFlow — план реализации

SaaS для управления командными проектами (мини-Linear/Trello: организации, проекты, канбан-доска, биллинг).
Весь код пишется руками, без ИИ-инструментов. Этот файл — одновременно roadmap проекта и чек-лист
по теории из `fullstack dev theory.pdf` (Junior Foundation → Middle) — каждая тема должна быть
закрыта не только в теории, но и практикой внутри этого репозитория.

Отмечай пункты по мере готовности: `- [ ]` → `- [x]`.

Стек на старте: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui + react-hook-form + zod.

---

## Этап 0. Фундамент

- [ ] Зафиксировать доменную модель: User, Organization, Membership (роли), Project, Task, Comment, Subscription
- [ ] ESLint/Prettier, Husky + lint-staged, conventional commits
- [ ] `tsconfig.json` в строгом режиме: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`
- [ ] Docker Compose: Postgres, Redis, Mailhog
- [ ] Git-практика по ходу проекта: rebase vs merge (осознанный выбор для каждого случая), cherry-pick при переносе фикса между ветками, `git bisect` хотя бы раз на реальном баге

## Этап 1. База данных и ORM

- [ ] PostgreSQL вручную: спроектировать таблицы, ключи, индексы без ORM (попрактиковать чистый SQL: `JOIN`, `EXPLAIN ANALYZE`, транзакции `BEGIN/COMMIT/ROLLBACK`, `VIEW`)
- [x] Выбрать ORM — **Prisma** для основного слоя приложения
- [ ] Отдельно попробовать **DrizzleORM** на одном модуле (для сравнения парадигм, как в теории)
- [ ] Миграции + seed-скрипт с тестовыми данными
- [ ] JSON/JSONB-поле хотя бы в одной таблице (например, настройки пользователя) + запрос через `->>`

## Этап 2. Аутентификация и мультитенантность

- [ ] Auth.js (NextAuth v5): credentials (bcrypt) + OAuth (GitHub/Google)
- [ ] Понять и явно прописать разницу JWT (access+refresh, rotation) vs сессии (express-session+Redis) — выбрать один подход осознанно, а не по умолчанию
- [ ] RBAC: роли owner/admin/member на уровне организации, middleware-проверки
- [ ] Email-верификация и восстановление пароля через Resend/Mailhog
- [ ] Безопасные куки: `httpOnly`, `secure`, `SameSite`, защита от CSRF (токены в заголовках)

## Этап 3. Backend API

- [ ] Server Actions для мутаций (создание орг/проектов/задач)
- [ ] Route Handlers для внешнего REST (вебхуки, публичный API)
- [ ] Спроектировать эндпоинты осознанно: версионирование, пагинация, фильтрация, сортировка, статус-коды с пониманием тела ответа (не только "200 значит ок")
- [ ] Валидация через zod, шаренная между клиентом и сервером
- [ ] DOMPurify для любого пользовательского HTML/rich-text контента (комментарии к задачам)

## Этап 4. React: глубокое погружение (concurrent features)

Отдельный этап под конкретные технические задачи, которые нужно закрыть руками:

- [ ] **ScrollView с императивным API**: компонент на `forwardRef` + `useImperativeHandle`, с TS-типизацией хендла (`scrollToTop()`, `scrollToItem(id)`, `getScrollPosition()`) — применить в канбан-доске или ленте комментариев
- [ ] **useTransition**: применить на реальном сценарии с заметной нагрузкой (например, фильтрация/поиск задач по большому списку) — обновление списка не блокирует ввод в поле поиска
- [ ] **startTransition** (standalone, без хука): изучить отличие от `useTransition`, применить там, где не нужен `isPending` (например, смена вкладки с тяжёлым перерендером)
- [ ] **Suspense + `React.lazy`**: разбить хотя бы один тяжёлый раздел (например, модалку с richtext-редактором или график активности) на отдельный чанк, посмотреть в Network как грузится чанк, понять и кратко зафиксировать для себя, как Suspense перехватывает промис из lazy-компонента и что происходит при ошибке загрузки чанка
- [ ] **ErrorBoundary**: обернуть ключевые независимые зоны приложения (канбан-доска, сайдбар, виджет комментариев) в отдельные `ErrorBoundary`, проверить на реальной падающей ошибке, что ломается только виджет, а не всё приложение
- [ ] **React DevTools Profiler**: снять профиль до/после оптимизаций (`memo`/`useCallback`/`useMemo`/правильные `key`), зафиксировать конкретные компоненты, у которых пропали лишние ре-рендеры

## Этап 5. UI, канбан-доска, клиентское состояние

- [ ] Kanban-доска с drag-n-drop (`dnd-kit`)
- [ ] Серверное состояние — **TanStack Query** (queryKey/queryFn, `useMutation`, инвалидация vs `setQueryData`, оптимистичные обновления)
- [ ] Клиентское UI-состояние — **Zustand** (persist, devtools, slices)
- [ ] Мини-эксперимент с **Redux Toolkit** на одном изолированном модуле (`createEntityAdapter`, нормализация, middleware) — чтобы на практике сравнить с Zustand/TanStack Query и понять, когда что уместно
- [ ] Тема light/dark через `next-themes`

## Этап 6. CSS и дизайн-система (продвинутый уровень)

- [ ] Tailwind: кастомная тема, свои плагины, `@apply`, `group`/`peer`
- [ ] shadcn/ui — кастомизация компонентов под свою дизайн-систему
- [ ] CSS Container Queries — хотя бы на карточках задач (адаптация к ширине контейнера, а не вьюпорта)
- [ ] CSS Layers (`@layer`) — навести порядок в каскаде между Tailwind base/своими стилями/сторонней библиотекой
- [ ] View Transition API — плавный переход при открытии карточки задачи в модалку/detail-view
- [ ] Framer Motion для анимаций, где View Transition не подходит

## Этап 7. Accessibility (a11y)

- [ ] ARIA roles/states/properties только там, где семантического HTML недостаточно (кастомные select/modal/tabs в канбан-доске)
- [ ] Управление фокусом: focus trap в модалках, возврат фокуса на элемент, который открыл модалку
- [ ] Клавиатурная навигация по всей канбан-доске (не только мышью)
- [ ] `:focus-visible` вместо безусловного outline
- [ ] Автоматизированный аудит: axe DevTools + Lighthouse a11y
- [ ] Хотя бы один прогон вручную со скринридером (NVDA+Firefox или VoiceOver+Safari)

## Этап 8. Производительность

- [ ] Замерить Core Web Vitals (LCP, CLS, INP) на ключевых страницах, довести до "хорошо"
- [ ] `preload` для критичных шрифтов/hero-изображений, `preconnect`/`dns-prefetch` для внешних origin (Stripe, аватарки в S3/R2)
- [ ] Next/Image + AVIF/WebP + lazy loading для всех изображений, кроме LCP-элемента
- [ ] Виртуализация длинного списка (например, лог активности) через `@tanstack/virtual`
- [ ] Debounce на поиске, throttle на скролл-трекинге — руками, без библиотек, с пониманием проблемы "debounce внутри useState" и её решения через `useRef`
- [ ] Анализ бандла (`@next/bundle-analyzer`), найти и устранить один реальный источник раздутия

## Этап 9. Real-time

- [ ] WebSocket-слой: Socket.io (комнаты по проекту, аутентификация через handshake) — live-обновления канбан-доски и комментариев
- [ ] Presence (кто сейчас смотрит доску)
- [ ] Redis Adapter для горизонтального масштабирования Socket.io

## Этап 10. Файлы и вложения

- [ ] Загрузка вложений к задачам/аватаров через presigned URL в S3-совместимое хранилище (Cloudflare R2)
- [ ] На стороне отдельного небольшого Node/Express-сервиса (см. Этап 15) — `multer` + `multipart/form-data` + `sharp` для ресайза изображений, чтобы руками пройти этот путь, а не только через SDK хранилища

## Этап 11. Биллинг

- [ ] Stripe Checkout, Customer Portal, вебхуки (`checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`)
- [ ] Feature gating по тарифу в middleware/server actions

## Этап 12. Фоновые задачи и очереди

- [ ] BullMQ + Redis: email-дайджесты, обработка Stripe-вебхуков, напоминания о дедлайнах
- [ ] Повторные попытки, отслеживание состояния джобы

## Этап 13. Тестирование

- [ ] Unit — Vitest/Jest + React Testing Library, включая mocking API/хуков/контекста
- [ ] Осознанные снапшот-тесты (не "для галочки")
- [ ] Интеграционные тесты API — Supertest
- [ ] E2E — Playwright: регистрация, приглашение в организацию, создание проекта, оплата (Stripe test mode)

## Этап 14. Безопасность

- [ ] Content-Security-Policy для продакшн-сборки
- [ ] Ревизия cookie-флагов и CSRF-защиты (см. Этап 2) на всех формах
- [ ] DOMPurify-ревизия всех мест рендера пользовательского контента

## Этап 15. DevOps и инфраструктура

- [ ] Dockerfile для Next.js-приложения
- [ ] Отдельный небольшой Node/Express-сервис (файлы, см. Этап 10) — свой Dockerfile
- [ ] docker-compose: app + file-service + Postgres + Redis
- [ ] GitHub Actions: lint → typecheck → test → build на каждый PR
- [ ] Деплой: Vercel (app) + Neon/Supabase (Postgres) + Upstash Redis
- [ ] Nginx/SSL — если поднимается отдельный сервер под file-service, а не только serverless
- [ ] Базовое знакомство с Kubernetes (Pod/Deployment/Service/Ingress) — задеплоить file-service в minikube ради практики, не для прода

## Этап 16. Middle-стретч (по желанию, отдельная ветка)

Необязательно для MVP, но закрывает оставшуюся часть теории и стоит попробовать хотя бы точечно:

- [ ] Переписать file-service на **NestJS** вместо Express (модули, провайдеры, декораторы, guards, interceptors, Swagger)
- [ ] GraphQL-эндпоинт поверх одного модуля (Apollo Server или NestJS/GraphQL, code-first) — для сравнения с REST
- [ ] Turborepo/pnpm workspaces — вынести общие типы/zod-схемы в shared-пакет, настроить `tsconfig` references между пакетами
- [ ] Storybook + Chromatic для UI-кита (визуальные регрессии)
- [ ] Winston/Pino логирование с correlation-id в file-service

## Этап 17. Наблюдаемость и качество процесса

- [ ] Sentry для ошибок фронта/бэка
- [ ] Один ADR (Architecture Decision Record) на нетривиальное решение проекта (например, "почему Prisma, а не Drizzle для основного слоя")
- [ ] Прогнать себя по чек-листу код-ревью на одном PR так, как ревьюил бы чужой код

---

## Открытый вопрос

Стек технологий из `fullstack dev theory.pdf` — учтён построчно выше (React internals, TS advanced types,
a11y, performance, CSS, state management, Next.js advanced, Node.js, PostgreSQL, auth, testing, WebSocket,
Docker, NestJS/GraphQL/Redis/K8s). Если появится отдельный документ именно со стеком — сверить с этим
списком и дополнить недостающее.
