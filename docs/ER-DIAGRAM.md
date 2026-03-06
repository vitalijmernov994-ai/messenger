# ER-диаграмма предметной области iMSITChat

## Описание сущностей

- **users** — пользователи (email, пароль в хеше, имя, роль: user/admin).
- **dialogs** — диалоги (личный чат один на один).
- **dialog_participants** — связь многие-ко-многим между пользователями и диалогами (в личном диалоге ровно 2 участника).
- **messages** — сообщения (диалог, отправитель, текст, дата/время).

## Диаграмма (Mermaid)

```mermaid
erDiagram
  users ||--o{ dialog_participants : "participates"
  dialogs ||--o{ dialog_participants : "has"
  dialogs ||--o{ messages : "contains"
  users ||--o{ messages : "sends"

  users {
    uuid id PK
    varchar email UK
    varchar password
    varchar name
    varchar role
    timestamptz created_at
  }

  dialogs {
    uuid id PK
    timestamptz created_at
  }

  dialog_participants {
    uuid dialog_id PK,FK
    uuid user_id PK,FK
    timestamptz joined_at
  }

  messages {
    uuid id PK
    uuid dialog_id FK
    uuid sender_id FK
    text body
    timestamptz created_at
  }
```

## Нормализация

- Таблицы в 3НФ: нет повторяющихся групп, все неключевые атрибуты зависят только от первичного ключа.
- Связь пользователь–диалог вынесена в отдельную таблицу `dialog_participants` для поддержки личных диалогов (ровно два участника на диалог).
