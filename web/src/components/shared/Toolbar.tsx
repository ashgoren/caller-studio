import { Box } from '@mui/material';

// Bordered, shadowed bar for a group of formatting buttons.
export const ToolbarBar = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 0.25, p: 0.5,
    width: 'fit-content', flexShrink: 0,
    border: 1, borderColor: 'divider', borderRadius: 1,
    bgcolor: 'background.paper', boxShadow: 1,
  }}>
    {children}
  </Box>
);

export const ToolbarDivider = () => (
  <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', mx: 1 }} />
);

// Toolbar button — prevents focus loss on both mouse and touch, so formatting
// commands still apply to whatever text selection was active before the click.
export const ToolbarButton = ({ label, title, onAction, style, active, disabled }: {
  label: React.ReactNode; title: string; onAction: () => void; style?: React.CSSProperties; active?: boolean; disabled?: boolean;
}) => {
  const handleAction = () => { if (!disabled) onAction(); };
  return (
    <Box
      component='button'
      title={title}
      disabled={disabled}
      sx={{
        border: 'none', background: 'none', cursor: 'pointer',
        px: '9px', py: '7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1, color: 'text.primary', borderRadius: 0.5,
        '&:hover': { bgcolor: 'action.hover' },
        '&:active': { bgcolor: 'action.selected' },
        ...(active && { bgcolor: 'action.selected', color: 'primary.main' }),
        '&:disabled': { color: 'text.disabled', cursor: 'default', bgcolor: 'transparent' },
      }}
      style={style}
      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
      onTouchStart={(e: React.TouchEvent) => e.preventDefault()}
      onTouchEnd={(e: React.TouchEvent) => { e.preventDefault(); handleAction(); }}
      onClick={handleAction}
    >
      {label}
    </Box>
  );
};
