#!/usr/bin/env node

/**
 * Application Generator CLI
 * Creates a new React application with standard structure and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TEMPLATE_NAME = '@template';
const APPS_DIR = 'apps';

// Helper functions
function toPascalCase(str) {
  return str.replace(/(^\w|[\s-_]\w)/g, match => match.replace(/[\s-_]/, '').toUpperCase());
}

function toCamelCase(str) {
  return str.replace(/([\s-_]\w)/g, match => match.replace(/[\s-_]/, '').toUpperCase());
}

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[\s_]/g, '-');
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  console.log(`📄 Created file: ${filePath}`);
}

function generatePackageJson(appName) {
  const kebabName = toKebabCase(appName);
  return `{
  "name": "${TEMPLATE_NAME}/${kebabName}",
  "version": "1.0.0",
  "description": "${toPascalCase(appName)} application for Enterprise SaaS Template",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \\"src/**/*.{ts,tsx}\\"",
    "clean": "rm -rf dist",
    "docker:build": "docker build -t enterprise-${kebabName} .",
    "docker:run": "docker run -p 3000:80 enterprise-${kebabName}"
  },
  "dependencies": {
    "${TEMPLATE_NAME}/shared-types": "*",
    "${TEMPLATE_NAME}/ui-components": "*",
    "${TEMPLATE_NAME}/api-client": "*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "react-query": "^3.39.3",
    "react-hook-form": "^7.48.2",
    "react-hot-toast": "^2.4.1",
    "@hookform/resolvers": "^3.3.2",
    "joi": "^17.11.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.294.0",
    "date-fns": "^2.30.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/uuid": "^9.0.7",
    "@types/jest": "^29.5.8",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "typescript": "^5.2.2",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@playwright/test": "^1.40.1",
    "ts-jest": "^29.1.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}`;
}

function generateViteConfig(appName) {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    // Define global constants
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});`;
}

function generateTsConfig() {
  return `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterables"],
    "module": "ESNext",
    "skipLibCheck": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"],
      "@/pages/*": ["pages/*"],
      "@/hooks/*": ["hooks/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"],
      "@/config/*": ["config/*"]
    },

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "src/**/*",
    "vite.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}`;
}

function generateTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../libs/ui-components/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define your theme colors here
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}`;
}

function generatePostcssConfig() {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
}

function generateIndexHtml(appName) {
  const pascalName = toPascalCase(appName);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pascalName} - Enterprise SaaS Template</title>
    <meta name="description" content="${pascalName} application built with Enterprise SaaS Template" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

function generateMainTsx() {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { environment } from './config/environment';

import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
        {environment.isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);`;
}

function generateApp(appName) {
  const pascalName = toPascalCase(appName);
  return `import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import { MainLayout } from './components/layout/MainLayout';
import { LoadingSpinner } from '@template/ui-components';

// Pages
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/Dashboard';
import { ExamplesList } from './pages/examples/ExamplesList';
import { ExampleDetail } from './pages/examples/ExampleDetail';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/examples" element={<ExamplesList />} />
        <Route path="/examples/:id" element={<ExampleDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}

export default App;`;
}

function generateIndexCss() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

/* Focus styles */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background;
}`;
}

function generateEnvironmentConfig(appName) {
  const kebabName = toKebabCase(appName);
  return `/**
 * Environment configuration
 * Controls feature flags and service configuration
 */

interface EnvironmentConfig {
  // API configuration
  apiUrl: string;
  apiTimeout: number;
  
  // Feature flags
  useMockAuth: boolean;
  enableMfa: boolean;
  enableAnalytics: boolean;
  enableDevTools: boolean;
  
  // Service URLs
  services: {
    auth: string;
    example: string;
    notification: string;
    users: string;
  };
}

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// Environment variables with defaults
const config: EnvironmentConfig = {
  // API configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Feature flags
  useMockAuth: import.meta.env.VITE_USE_MOCK_AUTH === 'true' || isDevelopment,
  enableMfa: import.meta.env.VITE_ENABLE_MFA === 'true' || false,
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || false,
  enableDevTools: isDevelopment,
  
  // Service URLs - these would typically be different in production
  services: {
    auth: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001',
    example: import.meta.env.VITE_EXAMPLE_SERVICE_URL || 'http://localhost:8002',
    notification: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8003',
    users: import.meta.env.VITE_USERS_SERVICE_URL || 'http://localhost:8004',
  },
};

// Validate required configuration
if (isProduction) {
  if (!import.meta.env.VITE_API_URL) {
    console.warn('VITE_API_URL is not set, using default');
  }
}

export const environment = {
  ...config,
  isDevelopment,
  isProduction,
  
  // Helper methods
  getServiceUrl(service: keyof typeof config.services): string {
    return config.services[service];
  },
  
  isFeatureEnabled(feature: keyof Pick<EnvironmentConfig, 'enableMfa' | 'enableAnalytics' | 'enableDevTools'>): boolean {
    return config[feature];
  },
};`;
}

function generateAuthContext() {
  return `import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IUser } from '@template/shared-types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app start
    const initAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authService.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      authService.removeToken();
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      authService.removeToken();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}`;
}

function generateAuthService() {
  return `import { IUser, ILoginResponse } from '@template/shared-types';
import { environment } from '../config/environment';

const API_BASE_URL = environment.services.auth;

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  async login(email: string, password: string): Promise<ILoginResponse> {
    const response = await fetch(\`\${API_BASE_URL}/api/v1/auth/login\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.accessToken);
    this.setRefreshToken(data.refreshToken);
    
    return data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(\`\${API_BASE_URL}/api/v1/auth/logout\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${this.getToken()}\`,
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    this.removeToken();
    this.removeRefreshToken();
  }

  async getCurrentUser(): Promise<IUser> {
    const response = await fetch(\`\${API_BASE_URL}/api/v1/auth/me\`, {
      headers: {
        'Authorization': \`Bearer \${this.getToken()}\`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const data = await response.json();
    return data.data;
  }

  async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(\`\${API_BASE_URL}/api/v1/auth/refresh\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.removeToken();
      this.removeRefreshToken();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.setToken(data.accessToken);
    return data.accessToken;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  removeRefreshToken(): void {
    localStorage.removeItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();`;
}

function generateMainLayout(appName) {
  const pascalName = toPascalCase(appName);
  return `import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  User,
  Bell
} from 'lucide-react';
import { Button } from '@template/ui-components';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Examples', href: '/examples', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(\`\${path}/\`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={\`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 \${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }\`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">${pascalName.charAt(0)}</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">${pascalName}</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = isActivePath(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={\`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors \${
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }\`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-700 dark:text-gray-300"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}`;
}

function generateDashboard(appName) {
  const pascalName = toPascalCase(appName);
  return `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@template/ui-components';
import { Activity, Users, TrendingUp, Package } from 'lucide-react';

const stats = [
  {
    name: 'Total Users',
    value: '2,651',
    change: '+12.5%',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Active Sessions',
    value: '1,432',
    change: '+4.3%',
    icon: Activity,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Examples Created',
    value: '892',
    change: '+8.2%',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'Growth Rate',
    value: '23.4%',
    change: '+2.1%',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to your ${pascalName} dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.name}
              </CardTitle>
              <div className={\`p-2 rounded-md \${stat.bgColor}\`}>
                <stat.icon className={\`h-4 w-4 \${stat.color}\`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <p className="text-xs text-green-600 font-medium mt-1">
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions in your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New user registered', time: '2 minutes ago', user: 'John Doe' },
                { action: 'Example created', time: '5 minutes ago', user: 'Jane Smith' },
                { action: 'Settings updated', time: '10 minutes ago', user: 'Admin' },
                { action: 'New comment added', time: '15 minutes ago', user: 'Bob Wilson' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Create New Example</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Add a new example to your collection</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Invite Users</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Send invitations to new team members</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">View Reports</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Check detailed analytics and reports</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}`;
}

function generateExamplesList() {
  return `import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge 
} from '@template/ui-components';
import { IExample, ExampleStatus } from '@template/shared-types';

// Mock data
const MOCK_EXAMPLES: IExample[] = [
  {
    id: '1',
    title: 'User Authentication System',
    description: 'Complete authentication system with JWT tokens and role-based access control',
    category: 'Security',
    status: ExampleStatus.ACTIVE,
    priority: 'HIGH' as any,
    tags: ['auth', 'jwt', 'rbac'],
    metadata: { views: 245, likes: 18 },
    isPublic: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    createdBy: 'user-1',
  },
  {
    id: '2',
    title: 'API Rate Limiting',
    description: 'Implementation of rate limiting for REST APIs using Redis',
    category: 'Performance',
    status: ExampleStatus.ACTIVE,
    priority: 'NORMAL' as any,
    tags: ['api', 'rate-limiting', 'redis'],
    metadata: { views: 156, likes: 12 },
    isPublic: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    createdBy: 'user-2',
  },
  {
    id: '3',
    title: 'Database Migrations',
    description: 'Automated database migration system with rollback support',
    category: 'Database',
    status: ExampleStatus.DRAFT,
    priority: 'NORMAL' as any,
    tags: ['database', 'migrations', 'postgres'],
    metadata: { views: 89, likes: 7 },
    isPublic: false,
    createdAt: '2024-01-12T11:30:00Z',
    updatedAt: '2024-01-19T13:20:00Z',
    createdBy: 'user-1',
  },
];

const statusColors = {
  [ExampleStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [ExampleStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
  [ExampleStatus.ARCHIVED]: 'bg-gray-100 text-gray-800',
  [ExampleStatus.DELETED]: 'bg-red-100 text-red-800',
};

export function ExamplesList() {
  const [examples] = useState<IExample[]>(MOCK_EXAMPLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const filteredExamples = examples.filter(example => {
    const matchesSearch = example.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         example.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || example.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(examples.map(e => e.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examples</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your example collection
          </p>
        </div>
        <Button asChild>
          <Link to="/examples/new">
            <Plus className="mr-2 h-4 w-4" />
            New Example
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search examples..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExamples.map((example) => (
          <Card key={example.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Link 
                      to={\`/examples/\${example.id}\`}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {example.title}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[example.status]}>
                      {example.status}
                    </Badge>
                    <Badge variant="outline">
                      {example.category}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {example.description}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {example.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {example.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{example.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span>{example.metadata.views} views</span>
                  <span>{example.metadata.likes} likes</span>
                </div>
                <span>
                  {new Date(example.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredExamples.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No examples found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first example'
              }
            </p>
            {!searchQuery && !selectedCategory && (
              <Button asChild>
                <Link to="/examples/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Example
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}`;
}

function generateLogin() {
  return `import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import toast from 'react-hot-toast';
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@template/ui-components';
import { useAuth } from '../../contexts/AuthContext';

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).required(),
});

interface LoginForm {
  email: string;
  password: string;
}

export function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: joiResolver(loginSchema),
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your credentials to access the application
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Development hint */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <strong>Development:</strong> Use any email/password combination to sign in
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}`;
}

function generateDockerfile(appName) {
  const kebabName = toKebabCase(appName);
  return `# Multi-stage build for ${appName}
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Copy built application
COPY --from=build /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ${kebabName}

# Change ownership
RUN chown -R ${kebabName}:nodejs /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`;
}

function generateNginxConfig() {
  return `events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Don't cache index.html
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
}`;
}

function generateReadme(appName) {
  const pascalName = toPascalCase(appName);
  const kebabName = toKebabCase(appName);
  
  return `# ${pascalName}

${pascalName} application built with the Enterprise SaaS Template.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
\`\`\`

### Environment Variables

Create a \`.env\` file based on \`.env.example\`:

\`\`\`env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_USE_MOCK_AUTH=true
VITE_ENABLE_MFA=false
VITE_ENABLE_ANALYTICS=false

# Service URLs
VITE_AUTH_SERVICE_URL=http://localhost:8001
VITE_EXAMPLE_SERVICE_URL=http://localhost:8002
VITE_NOTIFICATION_SERVICE_URL=http://localhost:8003
VITE_USERS_SERVICE_URL=http://localhost:8004
\`\`\`

## 📋 Available Scripts

### Development
- \`pnpm run dev\` - Start development server
- \`pnpm run build\` - Build for production
- \`pnpm run preview\` - Preview production build

### Testing
- \`pnpm test\` - Run unit tests
- \`pnpm run test:watch\` - Run tests in watch mode
- \`pnpm run test:coverage\` - Run tests with coverage
- \`pnpm run test:e2e\` - Run end-to-end tests
- \`pnpm run test:e2e:ui\` - Run E2E tests with UI

### Code Quality
- \`pnpm run lint\` - Run ESLint
- \`pnpm run lint:fix\` - Fix ESLint issues
- \`pnpm run typecheck\` - Run TypeScript checks
- \`pnpm run format\` - Format code with Prettier

### Docker
- \`pnpm run docker:build\` - Build Docker image
- \`pnpm run docker:run\` - Run Docker container

## 🏗️ Project Structure

\`\`\`
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components
│   └── ui/             # UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── examples/      # Example pages
│   └── ...
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── config/             # Configuration files
├── App.tsx             # Main App component
├── main.tsx            # Entry point
└── index.css           # Global styles
\`\`\`

## 🧪 Testing

### Unit Tests
Components and utilities are tested using Jest and React Testing Library.

\`\`\`bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage
\`\`\`

### End-to-End Tests
E2E tests are written using Playwright.

\`\`\`bash
# Run E2E tests
pnpm run test:e2e

# Run E2E tests with UI
pnpm run test:e2e:ui
\`\`\`

## 🎨 Styling

This application uses:
- **Tailwind CSS** for utility-first styling
- **Dark mode support** with class-based toggling
- **Responsive design** with mobile-first approach
- **Shared UI components** from \`@template/ui-components\`

## 🔧 Configuration

### Environment Configuration
The app uses environment-based configuration in \`src/config/environment.ts\`.

### Feature Flags
- \`VITE_USE_MOCK_AUTH\` - Use mock authentication (development)
- \`VITE_ENABLE_MFA\` - Enable multi-factor authentication
- \`VITE_ENABLE_ANALYTICS\` - Enable analytics tracking
- \`VITE_ENABLE_DEV_TOOLS\` - Enable development tools

## 📱 Features

- **Authentication & Authorization** - JWT-based auth with RBAC
- **Responsive Design** - Mobile-first responsive UI
- **Dark Mode** - System preference + manual toggle
- **Real-time Updates** - WebSocket support for live data
- **Error Handling** - Comprehensive error boundaries
- **Performance** - Code splitting and lazy loading
- **Accessibility** - WCAG 2.1 compliant components
- **Internationalization** - Multi-language support ready

## 🐳 Docker Deployment

\`\`\`bash
# Build production image
docker build -t ${kebabName} .

# Run container
docker run -p 80:80 ${kebabName}
\`\`\`

## 📚 Documentation

- [Component Documentation](./docs/components.md)
- [API Integration](./docs/api.md)
- [Testing Guide](./docs/testing.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Follow the coding standards defined in ESLint configuration
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commit messages

## 📄 License

This project is part of the Enterprise SaaS Template.
`;
}

// Main function
function createApp() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Error: Application name is required');
    console.log('Usage: node create-app.js <app-name>');
    console.log('Example: node create-app.js customer-portal');
    process.exit(1);
  }

  const appName = args[0];
  const kebabName = toKebabCase(appName);
  const pascalName = toPascalCase(appName);
  
  console.log(`🚀 Creating ${pascalName} Application...`);
  
  // Create directory structure
  const appDir = path.join(APPS_DIR, kebabName);
  const srcDir = path.join(appDir, 'src');
  const publicDir = path.join(appDir, 'public');
  
  createDirectory(appDir);
  createDirectory(srcDir);
  createDirectory(publicDir);
  createDirectory(path.join(srcDir, 'components'));
  createDirectory(path.join(srcDir, 'components', 'layout'));
  createDirectory(path.join(srcDir, 'components', 'ui'));
  createDirectory(path.join(srcDir, 'contexts'));
  createDirectory(path.join(srcDir, 'hooks'));
  createDirectory(path.join(srcDir, 'pages'));
  createDirectory(path.join(srcDir, 'pages', 'auth'));
  createDirectory(path.join(srcDir, 'pages', 'examples'));
  createDirectory(path.join(srcDir, 'services'));
  createDirectory(path.join(srcDir, 'types'));
  createDirectory(path.join(srcDir, 'utils'));
  createDirectory(path.join(srcDir, 'config'));

  // Generate core files
  writeFile(path.join(appDir, 'package.json'), generatePackageJson(appName));
  writeFile(path.join(appDir, 'vite.config.ts'), generateViteConfig(appName));
  writeFile(path.join(appDir, 'tsconfig.json'), generateTsConfig());
  writeFile(path.join(appDir, 'tailwind.config.js'), generateTailwindConfig());
  writeFile(path.join(appDir, 'postcss.config.js'), generatePostcssConfig());
  writeFile(path.join(appDir, 'index.html'), generateIndexHtml(appName));
  writeFile(path.join(appDir, 'Dockerfile'), generateDockerfile(appName));
  writeFile(path.join(appDir, 'nginx.conf'), generateNginxConfig());
  writeFile(path.join(appDir, 'README.md'), generateReadme(appName));

  // Generate source files
  writeFile(path.join(srcDir, 'main.tsx'), generateMainTsx());
  writeFile(path.join(srcDir, 'App.tsx'), generateApp(appName));
  writeFile(path.join(srcDir, 'index.css'), generateIndexCss());

  // Generate configuration
  writeFile(path.join(srcDir, 'config', 'environment.ts'), generateEnvironmentConfig(appName));

  // Generate contexts
  writeFile(path.join(srcDir, 'contexts', 'AuthContext.tsx'), generateAuthContext());

  // Generate services
  writeFile(path.join(srcDir, 'services', 'authService.ts'), generateAuthService());

  // Generate components
  writeFile(path.join(srcDir, 'components', 'layout', 'MainLayout.tsx'), generateMainLayout(appName));

  // Generate pages
  writeFile(path.join(srcDir, 'pages', 'Dashboard.tsx'), generateDashboard(appName));
  writeFile(path.join(srcDir, 'pages', 'examples', 'ExamplesList.tsx'), generateExamplesList());
  writeFile(path.join(srcDir, 'pages', 'auth', 'Login.tsx'), generateLogin());

  console.log(`\n✅ ${pascalName} Application created successfully!`);
  console.log(`📁 Location: ${appDir}`);
  console.log(`\n🔧 Next steps:`);
  console.log(`1. cd ${appDir}`);
  console.log(`2. pnpm install`);
  console.log(`3. Copy .env.example to .env and configure`);
  console.log(`4. pnpm run dev`);
  console.log(`\n📚 Don't forget to add your new app to the workspace configuration!`);
}

// Run the generator
createApp();