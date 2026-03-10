export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  public_id?: string | null;
  role: UserRole;
  created_at: Date;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface Dialog {
  id: string;
  created_at: Date;
}

export interface Message {
  id: string;
  dialog_id: string;
  sender_id: string;
  body: string;
  created_at: Date;
  file_url?: string | null;
  file_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
}

export interface MessageWithSender extends Message {
  sender_name: string;
  sender_email: string;
  sender_avatar_url?: string | null;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
