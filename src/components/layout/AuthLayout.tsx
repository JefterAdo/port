import React from 'react';
import { Briefcase } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/auth-store';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="flex justify-center">
          <div className="bg-primary rounded-full p-3 inline-flex">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900">
          RHDP
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Plateforme d'Assistance à la Communication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-in-up">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;