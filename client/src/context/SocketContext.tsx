import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL || '';

type SocketContextValue = {
  joinDialog: (dialogId: string, onJoined?: () => void) => void;
  leaveDialog: (dialogId: string) => void;
  onNewMessage: (cb: (msg: unknown) => void) => () => void;
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextValue>(null!);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!auth?.token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }
    const s = io(API, { auth: { token: auth.token }, path: '/socket.io' });
    socketRef.current = s;
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [auth?.token]);

  const joinDialog = useCallback((dialogId: string, onJoined?: () => void) => {
    const s = socketRef.current;
    if (!s) return;
    s.emit('join_dialog', dialogId, (ack: { error?: string } | { ok?: boolean }) => {
      if ('error' in ack) return;
      onJoined?.();
    });
  }, []);

  const leaveDialog = useCallback((dialogId: string) => {
    socketRef.current?.emit('leave_dialog', dialogId);
  }, []);

  const onNewMessage = useCallback((callback: (msg: unknown) => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('new_message', callback);
    return () => s.off('new_message', callback);
  }, []);

  const value: SocketContextValue = {
    joinDialog,
    leaveDialog,
    onNewMessage,
    socket: socketRef.current,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
