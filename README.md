# README

## Структура работы с БД

app/prisma/schema.prisma - это декларативное описание структуры данных, единственный источник правды о том, какие таблицы существуют и как они связаны
```
provider = "prisma-client-js" - конкретизирует генератор именно для JS-клиента
output - куда именно положить сгенерированный код 
datasource db { ... } - блок, описывающий тип базы данных

model User { ... } - описывает таблиу User
@unique - создает уникальный индекс в БД, при попытке создать дубликат вызовет ошибку на уровне БД
@default(cuid()) - при создании записи, если значение не передано явно, генерируется cuid (collision-resistant unique identifier — короткая уникальная строка, альтернатива UUID, оптимизированная для сортируемости и меньшего размера)

model Account { ... }, эта модель - стандартная структура, которую требует NextAuth Prisma Adapter для хранения OAuth-связей (один пользователь может иметь несколько привязанных провайдеров: Google + GitHub)

model Session { ... } - фактически не используется для ранения сессий (JWT хранится только в подписанной cookie, без обращения к базе на каждый запрос) - но Prisma Adapter все равно требует эту модель в схеме для совместимости с OAuth-логикой
```

### Два разных потребителя базы данных

Есть два независимых процесса, которым нужна база данных, и у каждого — свой файл конфигурации:
```
┌─────────────────────────────────────────────────────────────┐
│  1. Prisma CLI (когда ВЫ вручную запускаете команды)          │
│     npx prisma migrate dev                                   │
│     npx prisma generate                                      │
│     npx prisma studio                                        │
│                                                                │
│     → читает: prisma.config.ts                                │
│     → использует: DIRECT_URL (прямое подключение к Neon)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  2. Ваше Next.js приложение (когда работает сервер)            │
│     API routes, Server Components, Server Actions             │
│                                                                │
│     → читает: lib/prisma.ts                                   │
│     → использует: DATABASE_URL (pooled-подключение через      │
│       PgBouncer, оптимизировано под serverless/много запросов) │
└─────────────────────────────────────────────────────────────┘
```

![db-workflow](https://github.com/avanyushkin/teamflow-saas/blob/feature/(auth)/images/db-workflow.png)

![db-workflow](https://github.com/avanyushkin/teamflow-saas/blob/feature/(auth)/images/db-workflow2.png)

## Реализация системы авторизации

### Поток 1 (регистрация без NextAuth)

1. register/page.tsx onSubmit(values) ->
2. actions.ts registerUser(values)
     - formSchemaRegister.safaParse - револидация
     - prisma.user.findFirst - проверка уникальности username/email
     - bcrypt.hash(password) - хэш пароля
     - prisma.user.create - запись в БД (таблица User)
     - return ok: true -> router.push('/login')
Это отдельная от NextAuth ветка - она не проходит ни через providers, ни через callbacks. NextAuth здась вообще не учавствует, только Prisma напрямую

### Поток 2 (логин через Credentials (username/password))

1. login/page.tsx signIn('credentials', {username, password, redirect: false}) ->
2. [...nextauth]/route.ts это http-точка, куда физически литит запрос и передает управление в authConfig ->
3. auth.ts CredentialsProvider(credentials)
    - prisma.user.findUnique(username) -> bcrypt.compare(password, user.password) возарвщает {id, name, email} или null -> 
    - callbacks.signIn({user, account}) account.provider === "credentials" -> сразу return true (доверяем authorize) -> 
    - callbacks.jwt({token, user}) user есть только в момент самого входа -> token.id = user.id ->
    - callbacks.session({session, token}) session.user.id = token.id ->
    - браузер получает JWT в cookie (next-auth.session.token) ->
    - login/page.tsx получает (ok: true) -> router.push("/")

### Поток 3 (логин через OAuth (google / github))

1. login/page.tsx signIn("google") / signIn("github") ->
2. редирект на consent-экран Google/Github (пользователь подтверждает доступ) ->
3. Google/GitHub редиректит обратно на /api/auth/callback/google (это url, который регистрируется на Google/GitHub console) ->
4. auth.ts callbacks.signIn({user, account, profile}) если нашли юзера user.id = exitingUser.id, если не нашли то генерируем юзернейм и разбиваем firstName/lastName ->
   auth.ts callbacks.jwt({token, user}) token.id = user.id - та же функция, что и в потоке 2 ->
   auth.ts callbacks.session ->
   JWT-cookie в браузере, редирект обратно в приложение

Почему signIn callback вообще нужен именно для OAuth: в потоке 
Credentials пользователь уже гарантировано существует в БД (его нашел 
authorize). А в OAuth потоке NextAuth ничего не знает про таблицу User
- google просто дает почту и имя этого пользователя. Именно для этого
callbacks.jwt / callbacks.session - общие для всех провайдеров, а логика
заполнения user.id разная: для Credentials ее делает authorize, для OAuth - signIn

### Потом 4 (проверка сессии при заходе на любую страницу)

1. Запрос к /login или /register ->
2. middleware.ts getToken({req, secret: }) - читает и проверяет JWT прямо из cookie
без обращения к authConfig целиком (edge runtime, легкая проверка)
token === null -> не залогинен, пускаем на /login /register
token !== null - залогинен, пускаем на общие страницы

## Реализация Home page

1. Составляем схему для БД для карточки, участниа (RBAC)
```
- @relation("OwnedCards", ...) - именованная связь. Она нужна, потому что между User и Card будет две разных связи (владелец и 
участник через CardMember) - Prisma требует явно назвать связь, 
если их несколько между одной парой моделей, иначе не поймет, какая из них какая
- @@unique([cardId, userId]) в CardMember гарантирует, что один пользователь не может быть добавлен в одну карточку дважды
- onDelete: Cascade - если карточку или пользователя удалили, связка CardMember удалится автоматически, а не останется "битой" ссылкой
```

2. Запуск меграции:
```
npx prisma migrate dev --name add_card_and_card_member
```

3. Создаем тестовые данные через Prisma Studio
```
npx prisma studio
```

4. zod-validation и actions.ts/createCard

### Создание карточки

1. Создал UI формы (Dialog) для создания карточки текущим юзером. Реализовал возможность добавлять со-участников карточки
   (получаю их из БД) (./create-card-dialog.tsx)
2. Создал простой UI карточки и развестил их на home page (./task-card.tsx)
3. Детальный просмотр карточки
3.1. Реализована проверка доступа к карточке (тк у карточки есть свой прямой URL, любой залогиненый пользователь теоретически
     может ввести в адресную строку чужой /cards/<id> и попытаться посмотреть чужую задачу)