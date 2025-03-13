import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import AdminControls from './components/adminControls';
import Dashboard from './components/dashboard';
import Register from './components/register';
import ProtectedRoute from './components/protectedRoutes';
import Profile from './components/profile';

function App() {

  const role=localStorage.getItem('role');
  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>} />
        <Route path="/adminControls" element={
          <ProtectedRoute allowedRoles={['admin']}>
          <AdminControls />
        </ProtectedRoute>}/>
        <Route path="*" element={<Navigate to="/" replace/>} />
      </Routes>
  );
}

export default App;
