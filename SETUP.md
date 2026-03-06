# Инструкция по запуску iMSITChat

## Требования

Для запуска проекта нужен только **Docker Desktop**.

| Что | Скачать |
|-----|---------|
| Docker Desktop | https://www.docker.com/products/docker-desktop/ |

---

## Запуск за 3 шага

### Шаг 1 — Скачай Docker Desktop и установи

Скачай по ссылке выше, установи, **запусти** — в трее должна появиться иконка кита.

### Шаг 2 — Открой терминал в папке проекта

Перейди в папку `local mobile messenger` и выполни:

```bash
docker-compose up --build
```

Первый запуск занимает 3–5 минут (скачиваются образы, собирается проект).

### Шаг 3 — Открой в браузере

```
http://localhost:5173
```

---

## Учётная запись администратора

При первом запуске создаётся автоматически:

| Поле | Значение |
|------|----------|
| Email | `admin@imsitchat.local` |
| Пароль | `admin123` |

---

## Остановка проекта

```bash
docker-compose down
```

---

## Запуск тестов

```bash
cd server
npm install
npm test
```

---

## Технологический стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| База данных | PostgreSQL |
| Реальное время | WebSocket (Socket.IO) |
| Аутентификация | JWT, bcrypt |
| Инфраструктура | Docker, docker-compose, GitHub Actions |
