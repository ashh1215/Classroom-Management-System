import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import Admin from './components/admin';
import Dashboard from './components/dashboard';
import Register from './components/register';
import ProtectedRoute from './components/protectedRoutes';

// import './App.css';

function App() {

  const role=localStorage.getItem('role');
  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>} />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
          <Admin />
        </ProtectedRoute>}/>
        <Route path="*" element={<Navigate to="/" replace/>} />
      </Routes>
  );
}

export default App;
