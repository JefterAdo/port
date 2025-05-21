import { createTheme } from '@mui/material/styles';

const rhdpTheme = createTheme({
  palette: {
    primary: {
      main: '#FF7900', // Orange RHDP
      light: '#FFB347',
      dark: '#CC6100',
      contrastText: '#FFF',
    },
    secondary: {
      main: '#009A44', // Vert RHDP
      light: '#4DC47D',
      dark: '#007A37',
      contrastText: '#FFF',
    },
    background: {
      default: '#F7F7F7',
      paper: '#FFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    subtitle1: {
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          backgroundColor: '#F7F7F7',
        },
        '#root': {
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFF',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'hidden',
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
  },
});

export default rhdpTheme;