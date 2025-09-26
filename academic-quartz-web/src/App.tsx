import { Routes, Route } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';

function App() {

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Future routes can be added here */}
    </Routes>
  )
}

export default App;
