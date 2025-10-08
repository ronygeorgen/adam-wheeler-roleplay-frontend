import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import RoleplayViewerPage from './pages/RoleplayViewerPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/roleplay/:categoryId/:modelId" element={<RoleplayViewerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;