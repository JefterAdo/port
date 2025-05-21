import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../components/layout/AuthLayout';
import MainLayout from '../components/layout/MainLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';

// Dashboard Pages
import DashboardPage from '../pages/dashboard/DashboardPage';

// EDLS Pages
import EDLSListPage from '../pages/edls/EDLSListPage';
import NewEDLSPage from '../pages/edls/NewEDLSPage';
import EditEDLSPage from '../pages/edls/EditEDLSPage';

// Analysis Pages
import AnalysisPage from '../pages/analysis/AnalysisPage';
import NewAnalysisPage from '../pages/analysis/NewAnalysisPage';
import AnalysisDetailPage from '../pages/analysis/AnalysisDetailPage';

// Response Pages
import RHDPchatPage from '../pages/rhdpchat/RHDPchatPage';

// History Pages
import HistoryPage from '../pages/history/HistoryPage';

// Search Pages
import SearchPage from '../pages/search/SearchPage';

// Forces & Faiblesses Pages
import PartiesListPage from '../pages/forces/PartiesListPage';
import PartyDetailPage from '../pages/forces/PartyDetailPage';

// Error Pages
import NotFoundPage from '../pages/error/NotFoundPage';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          
          {/* Public Routes - No Layout */}
          <Route path="/rhdpchat" element={<RHDPchatPage />} />
          
          {/* App Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* EDLS Routes */}
            <Route path="/edls" element={<EDLSListPage />} />
            <Route path="/edls/nouveau" element={<NewEDLSPage />} />
            <Route path="/edls/edit/:id" element={<EditEDLSPage />} />

            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/analysis/new" element={<NewAnalysisPage />} />
            <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
            
            <Route path="/rhdpchat" element={<RHDPchatPage />} />
            
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Forces & Faiblesses Routes */}
            <Route path="/parties" element={<PartiesListPage />} />
            <Route path="/parties/:id" element={<PartyDetailPage />} />
          </Route>
          
          {/* Error Routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;