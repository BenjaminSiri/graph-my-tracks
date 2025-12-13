// App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RootStoreProvider } from './stores/RootStore';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import GlobalStyle from './styles/GlobalStyle';

function App() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/callback' && location.pathname !== '/login';

  return (
    <RootStoreProvider>
      <GlobalStyle />
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </RootStoreProvider>
  );
}

export default App;