import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router'
import { Box, Typography, IconButton, AppBar, Toolbar, Tooltip, Button, Menu, MenuItem, CircularProgress } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useTitle } from '@/contexts/TitleContext';
import { useUndoState, useUndoActions } from '@/contexts/UndoContext';
import { ColorModeToggle } from './ColorModeToggle';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { label: 'Dances', path: '/dances' },
  { label: 'Programs', path: '/programs' },
  { label: 'Settings', path: '/settings' },
];

export const NavBar = () => {
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [navMenuAnchorEl, setNavMenuAnchorEl] = useState<null | HTMLElement>(null);
  const accountMenuOpen = Boolean(accountMenuAnchorEl);
  const navMenuOpen = Boolean(navMenuAnchorEl);

  const navigate = useNavigate();
  const { title } = useTitle();
  const { user, signOut } = useAuth();
  const { canUndo, canRedo, undoLabel, redoLabel, isExecuting } = useUndoState();
  const { undo, redo, clearStacks } = useUndoActions();

  const handleToggleAccountMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAccountMenuAnchorEl(prevAnchorEl => prevAnchorEl ? null : event.currentTarget);
  };

  const handleSignOut = (event: React.MouseEvent<HTMLElement>) => {
    try {
      signOut().catch(err => console.error('Error signing out:', err));
      handleToggleAccountMenu(event);
      clearStacks();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (user && canUndo) undo();
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (user && canRedo) redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, canUndo, canRedo, undo, redo]);

  return (
    <>
      <AppBar
        position='fixed'
        color='default'
        elevation={1}
      >
        <Toolbar sx={{ position: 'relative' }}>
          {user ? (
            <>
              <Button
                color='inherit'
                onClick={(e) => setNavMenuAnchorEl(e.currentTarget)}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{
                  position: { sm: 'absolute' },
                  left: { sm: '50%' },
                  top: { sm: '50%' },
                  transform: { sm: 'translate(-50%, -50%)' },
                  textTransform: 'none',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  maxWidth: { xs: 'calc(100vw - 200px)', sm: 'none' },
                  overflow: 'hidden',
                  '& .MuiButton-endIcon': { flexShrink: 0 },
                }}
              >
                <Box component='span' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {title}
                </Box>
              </Button>
              <Menu anchorEl={navMenuAnchorEl} open={navMenuOpen} onClose={() => setNavMenuAnchorEl(null)}>
                {NAV_ITEMS.map(item => (
                  <MenuItem key={item.path} onClick={() => { navigate(item.path); setNavMenuAnchorEl(null); }}>
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <Typography variant='h6' component='h1' sx={{ flexGrow: 1, textAlign: 'center' }}>
              {title}
            </Typography>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {user && (
            <>
              {isExecuting ? (
                <CircularProgress size={24} color='inherit' sx={{ mx: 1 }} />
              ) : (
                <>
                  <Tooltip title={canUndo ? `Undo: ${undoLabel}` : ''}>
                    <span>
                      <IconButton color='inherit' onClick={undo} disabled={!canUndo}>
                        <UndoIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={canRedo ? `Redo: ${redoLabel}` : ''}>
                    <span>
                      <IconButton color='inherit' onClick={redo} disabled={!canRedo}>
                        <RedoIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </>
          )}

          {user && (
            <>
              <Button
                color='inherit'
                onClick={handleToggleAccountMenu}
                sx={{ textTransform: 'none' }}
              >
                {user.email?.split('@')[0]}
              </Button>
              <Menu anchorEl={accountMenuAnchorEl} open={accountMenuOpen} onClose={handleToggleAccountMenu}>
                <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
              </Menu>
            </>
          )}

          <ColorModeToggle />

        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer to offset fixed AppBar */}
    </>
  );
}
