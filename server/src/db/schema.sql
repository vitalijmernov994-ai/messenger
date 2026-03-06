-- iMSITChat: нормализованная схема БД
-- Роли: user, admin

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  role        VARCHAR(50)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dialogs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Участники диалога (личный диалог = ровно 2 участника)
CREATE TABLE IF NOT EXISTS dialog_participants (
  dialog_id  UUID NOT NULL REFERENCES dialogs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dialog_id, user_id),
  UNIQUE (dialog_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dialog_id  UUID NOT NULL REFERENCES dialogs(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname    VARCHAR(255),
  local_photo TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_dialog_created ON messages(dialog_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dialog_participants_user ON dialog_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
