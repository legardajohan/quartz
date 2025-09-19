import { Routes, Route } from 'react-router-dom';
import LoginForm from './features/auth/components/LoginForm';
import './App.css'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      {/* Future routes can be added here */}
    </Routes>
  )
}

export default App;
