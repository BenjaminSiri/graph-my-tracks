// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RootStoreProvider } from './stores/RootStore';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <RootStoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </RootStoreProvider>
  );
}

export default App;
