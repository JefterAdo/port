import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import rhdpTheme from './theme/rhdpTheme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={rhdpTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
