import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import LoginPage from '@/pages/LoginPage';
import UserManagementPage from '@/pages/UserManagementPage';
import AccessLogsPage from '@/pages/AccessLogsPage';
import ProfilePage from '@/pages/ProfilePage';
import EquipmentManagement from '@/pages/EquipmentManagement';
import EquipmentListPage from '@/pages/EquipmentListPage';
import EquipmentDetailsPage from '@/pages/EquipmentDetailsPage';
import ProtectedRoute from '@/components/ProtectedRoute';

import DashboardHome from '@/pages/Dashboard/Home';
import ImportReport from '@/pages/Dashboard/ImportReport';
import Reports from '@/pages/Dashboard/Reports';
import Alarms from '@/pages/Dashboard/Alarms';
import LifeExpectancy from '@/pages/Dashboard/LifeExpectancy';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    <Route 
                      path="/dashboard"
                      element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/dashboard/import-report"
                      element={<ProtectedRoute><ImportReport /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/dashboard/reports"
                      element={<ProtectedRoute><Reports /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/dashboard/alarms"
                      element={<ProtectedRoute><Alarms /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/dashboard/life-expectancy"
                      element={<ProtectedRoute><LifeExpectancy /></ProtectedRoute>} 
                    />
                    
                    <Route 
                      path="/life-expectancy"
                      element={<ProtectedRoute><LifeExpectancy /></ProtectedRoute>} 
                    />

                    <Route 
                      path="/equipment"
                      element={<ProtectedRoute><EquipmentManagement /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/equipment/list"
                      element={<ProtectedRoute><EquipmentListPage /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/equipment/:id"
                      element={<ProtectedRoute><EquipmentDetailsPage /></ProtectedRoute>} 
                    />
                    
                    <Route 
                      path="/devices"
                      element={<Navigate to="/equipment?tab=devices" replace />} 
                    />

                    <Route 
                      path="/user-management"
                      element={<ProtectedRoute level={3}><UserManagementPage /></ProtectedRoute>} 
                    />
                     <Route 
                      path="/access-logs"
                      element={<ProtectedRoute level={3}><AccessLogsPage /></ProtectedRoute>} 
                    />
                     <Route 
                      path="/profile"
                      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
                    />

                    <Route path="/report-import" element={<Navigate to="/dashboard/import-report" replace />} />
                    <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
                    <Route path="/alarms" element={<Navigate to="/dashboard/alarms" replace />} />
                    <Route path="/predictions" element={<Navigate to="/dashboard/life-expectancy" replace />} />
                    
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                  <Toaster />
              </div>
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;