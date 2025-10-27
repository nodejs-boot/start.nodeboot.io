import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';
import HomePage from './pages/HomePage';
import ScaffolderPage from './pages/ScaffolderPage';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <CopilotKit
        runtimeUrl="/api/chat"
        publicApiKey={process.env.REACT_APP_COPILOTKIT_API_KEY}
      >
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/scaffolder/:projectType" element={<ScaffolderPage />} />
            </Routes>
          </BrowserRouter>
        </div>
      </CopilotKit>
    </ThemeProvider>
  );
}

export default App;