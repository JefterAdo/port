import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Menu, X, Briefcase, LogOut, ChevronDown, ChevronRight, User } from 'lucide-react';
import useAuthStore from '../../store/auth-store';
import { NAV_ITEMS } from '../../utils/constants';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);
  const location = useLocation();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };
  
  const toggleUserMenu = () => {
    setUserMenuOpen(prev => !prev);
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link to="/dashboard" className="flex items-center">
                  <div className="bg-primary rounded-full p-1.5 mr-2">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-neutral-900">RHDP</span>
                </Link>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {NAV_ITEMS.map(item => {
                  if (item.adminOnly && user?.role !== 'admin') return null;
                  
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon as React.ElementType;
                  const hasSubMenu = item.subMenu && item.subMenu.length > 0;
                  const isSubMenuOpen = openSubMenus.includes(item.path);
                  
                  return (
                    <div key={item.path} className="relative group">
                      <div 
                        className={`inline-flex items-center px-1 pt-1 text-sm font-medium cursor-pointer ${
                          isActive
                            ? 'border-b-2 border-primary text-neutral-900'
                            : 'text-neutral-500 hover:border-b-2 hover:border-neutral-300 hover:text-neutral-700'
                        }`}
                        onClick={() => {
                          if (hasSubMenu) {
                            setOpenSubMenus(prev => 
                              prev.includes(item.path) 
                                ? prev.filter(path => path !== item.path)
                                : [...prev, item.path]
                            );
                          }
                        }}
                      >
                        {Icon && <Icon className="mr-1 h-4 w-4" />}
                        {item.label}
                        {hasSubMenu && (
                          item.menuDirection === 'horizontal' 
                            ? <ChevronDown className="ml-1 h-3 w-3" />
                            : <ChevronRight className="ml-1 h-3 w-3" />
                        )}
                      </div>
                      
                      {/* Sous-menu */}
                      {hasSubMenu && isSubMenuOpen && (
                        <div 
                          className={`absolute z-10 mt-1 bg-white shadow-lg rounded-md py-1 ${
                            item.menuDirection === 'horizontal' 
                              ? 'flex space-x-4 p-2 left-0 min-w-max' 
                              : 'flex flex-col space-y-1 right-0 min-w-[200px]'
                          }`}
                        >
                          {item.subMenu.map(subItem => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 whitespace-nowrap"
                              onClick={() => setOpenSubMenus([])}
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={toggleUserMenu}
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </div>
                      <span className="ml-2 text-sm font-medium text-neutral-700">{user?.firstName} {user?.lastName}</span>
                      <ChevronDown className="ml-1 h-4 w-4 text-neutral-500" />
                    </div>
                  </button>
                </div>
                
                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pt-2 pb-3">
            {NAV_ITEMS.map(item => {
              if (item.adminOnly && user?.role !== 'admin') return null;
              
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon as React.ElementType;
              const hasSubMenu = item.subMenu && item.subMenu.length > 0;
              const isSubMenuOpen = openSubMenus.includes(item.path);
              
              return (
                <div key={item.path}>
                  <div
                    className={`block pl-3 pr-4 py-2 text-base font-medium ${
                      isActive
                        ? 'bg-primary/10 border-l-4 border-primary text-primary'
                        : 'border-l-4 border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800'
                    }`}
                    onClick={() => {
                      if (hasSubMenu) {
                        setOpenSubMenus(prev => 
                          prev.includes(item.path) 
                            ? prev.filter(path => path !== item.path)
                            : [...prev, item.path]
                        );
                      } else {
                        setMobileMenuOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        {Icon && <Icon className="mr-2 h-5 w-5" />}
                        {item.label}
                      </div>
                      {hasSubMenu && (
                        <ChevronDown className={`h-4 w-4 transition-transform ${isSubMenuOpen ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </div>
                  
                  {/* Sous-menu mobile */}
                  {hasSubMenu && isSubMenuOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subMenu.map(subItem => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className="block pl-3 pr-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800 border-l-2 border-neutral-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-neutral-200 pt-4 pb-3">
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-neutral-800">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm font-medium text-neutral-500">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/profile"
                className="block px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="mr-2 h-5 w-5" />
                Mon profil
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 flex items-center"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;