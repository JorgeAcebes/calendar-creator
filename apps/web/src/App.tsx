import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorLayout from '@/components/layout/EditorLayout';
import Dashboard from '@/pages/Dashboard';
import Donate from '@/pages/Donate';
import ToastContainer from '@/components/layout/Toast';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor/:id" element={<EditorLayout />} />
        <Route path="/donate" element={<Donate />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
};

export default App;
