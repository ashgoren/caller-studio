import { SnackbarProvider, closeSnackbar } from 'notistack'
import { CssBaseline, Box, IconButton } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { theme } from './themeConfig';
import { NavBar } from './NavBar';
import type { ReactNode } from 'react';

export const ThemedShell = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={theme} defaultMode='system'>
    <CssBaseline />
    {children}
  </ThemeProvider>
);

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <ThemedShell>
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={4000}
        disableWindowBlurListener
        iconVariant={{ error: <ErrorOutlineIcon sx={{mr: 1}} />  }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        action={(snackbarId) => (
          <IconButton size='small' color='inherit' onClick={() => closeSnackbar(snackbarId)}>
            <CloseIcon fontSize='small' />
          </IconButton>
        )}
      >
        <Box sx={{ backgroundColor: 'background.default' }}>
          <NavBar />
          <Box component='main' sx={{ p: 2 }}>
            {children}
          </Box>
        </Box>
      </SnackbarProvider>
    </ThemedShell>
  );
};
