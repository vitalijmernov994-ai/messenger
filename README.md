# iMSITChat — веб-мессенджер

Итоговый проект: локальный веб-мессенджер с backend, frontend и реляционной БД.

## Технологический стек

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React 18, Vite, TypeScript, TailwindCSS
- **БД:** PostgreSQL
- **Обновление сообщений в реальном времени:** WebSocket (Socket.io)
- **Аутентификация:** JWT, хеширование паролей (bcrypt)
- **Запуск:** Docker, docker-compose

## Структура проекта

```
local mobile messenger/
├── client/                 # SPA (React + Vite)
│   ├── src/
│   │   ├── api.ts          # HTTP-клиент к API
│   │   ├── context/        # Auth, Socket
│   │   ├── pages/          # Login, Register, Dialogs, Chat
│   │   └── ...
│   ├── Dockerfile
│   └── package.json
├── server/                  # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── db/             # pool, schema.sql, migrate
│   │   ├── controllers/     # auth, users, dialogs, messages
│   │   ├── services/       # auth, user, dialog, message
│   │   ├── repositories/   # user, dialog, message
│   │   ├── middleware/     # auth
│   │   ├── routes/
│   │   ├── socket.ts       # Socket.io
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── docs/
│   └── ER-DIAGRAM.md       # ER-диаграмма БД
├── docker-compose.yml
├── SETUP.md                # Инструкция по установке окружения
└── README.md
```

## Запуск проекта

### Вариант 1: Docker (рекомендуется)

1. Установите [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/).
2. В корне проекта выполните:

```bash
docker-compose up -d --build
```

3. Откройте в браузере: **http://localhost:5173** (клиент). API: **http://localhost:3001**.

Остановка: `docker-compose down`.

### Вариант 2: Локальный запуск (без Docker контейнеров)

1. Установите Node.js (LTS) и PostgreSQL.
2. Создайте БД и пользователя:

```sql
CREATE USER imsitchat WITH PASSWORD 'imsitchat_secret';
CREATE DATABASE imsitchat OWNER imsitchat;
```

3. В корне проекта:

```bash
npm run install:all
```

4. Запустите PostgreSQL (порт 5432). В двух терминалах:

```bash
# Терминал 1 — сервер
cd server && npm run dev
```

```bash
# Терминал 2 — клиент
cd client && npm run dev
```

5. Откройте **http://localhost:5173**. API сервера: **http://localhost:3001**.

Переменные окружения сервера (при необходимости):  
`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`.

## Тесты

Из папки `server`:

```bash
cd server
npm test
```

Требования: запущенный PostgreSQL и выполненная миграция (сервер при старте выполняет миграцию сам, для тестов можно один раз выполнить миграцию или поднять БД и запустить сервер кратковременно).

- Модульные тесты: `authService.test.ts`, `authController.test.ts`
- Интеграционные: `integration/api.test.ts`

## Вход администратора

При первом запуске создаётся учётная запись администратора:

- **Email:** `admin@imsitchat.local`
- **Пароль:** `admin123`

После входа под этим пользователем в интерфейсе появится ссылка **«Админ-панель»** (страница `/admin`) со списком всех пользователей.

## Функциональность

- Регистрация и авторизация пользователей
- Роли: user, admin
- Личные диалоги (один на один)
- Отправка и получение текстовых сообщений
- Автообновление сообщений через WebSocket
- История сообщений в БД, отображение даты/времени
- Защита доступа к чужим чатам, JWT, CORS, rate limit

## Лицензия

Учебный проект.
