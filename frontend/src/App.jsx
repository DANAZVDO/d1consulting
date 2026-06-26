import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TenantProvider } from './contexts/TenantContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { PlaceholderPage } from './pages/PlaceholderPage';

function App() {
  return (
    <TenantProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="content" element={<PlaceholderPage title="Content Calendar" />} />
            <Route path="campaigns" element={<PlaceholderPage title="Ad Campaigns" />} />
            <Route path="leads" element={<PlaceholderPage title="Leads Management" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TenantProvider>
  );
}

export default App;
