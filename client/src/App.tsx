import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dialogs from './pages/Dialogs';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Search from './pages/Search';
import UserProfile from './pages/UserProfile';
import Contacts from './pages/Contacts';

function Protected({ children }: { children: React.ReactNode }) {
  const { auth, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-800 dark:text-slate-100">Загрузка...</div>;
  if (!auth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { auth, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-800 dark:text-slate-100">Загрузка...</div>;
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { customThemeColor, customBackgroundImage, customBackgroundVideo, hasGlassUI } = useTheme();
  const hasMediaBackground = !!(customBackgroundImage || customBackgroundVideo);

  const hasColorBg = customThemeColor && !hasMediaBackground;

  return (
    <div
      className={`min-h-screen relative ${hasGlassUI ? 'theme-glass' : ''}`}
      style={hasColorBg ? { backgroundColor: customThemeColor } : hasMediaBackground ? undefined : undefined}
    >
      {hasMediaBackground && (
        <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
          {customBackgroundVideo && (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src={customBackgroundVideo}
            />
          )}
          {customBackgroundImage && !customBackgroundVideo && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${customBackgroundImage})` }}
            />
          )}
          <div className="absolute inset-0 bg-black/25" aria-hidden />
        </div>
      )}
      <div
        className={`relative z-10 min-h-screen ${
          !hasColorBg && !hasMediaBackground
            ? 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'
            : ''
        }`}
        style={hasColorBg ? { background: 'transparent' } : undefined}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <Protected>
                <Dialogs />
              </Protected>
            }
          />
          <Route
            path="/chat/:dialogId"
            element={
              <Protected>
                <Chat />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminOnly>
                <Admin />
              </AdminOnly>
            }
          />
          <Route
            path="/settings"
            element={
              <Protected>
                <Settings />
              </Protected>
            }
          />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route
            path="/search"
            element={
              <Protected>
                <Search />
              </Protected>
            }
          />
          <Route
            path="/user/:id"
            element={
              <Protected>
                <UserProfile />
              </Protected>
            }
          />
          <Route
            path="/contacts"
            element={
              <Protected>
                <Contacts />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
