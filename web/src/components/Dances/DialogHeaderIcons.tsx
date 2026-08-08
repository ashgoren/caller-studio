import { Box, IconButton, Tooltip } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

// Print (optional) / Edit / Close row shared by the Walkthrough and Cues dialogs.
export const DialogHeaderIcons = ({ onPrint, onEdit, editLabel, onClose }: {
  onPrint?: () => void;
  onEdit: () => void;
  editLabel: string;
  onClose: () => void;
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, flexShrink: 0 }}>
    {onPrint && (
      <Tooltip title='Print'>
        <IconButton size='small' onClick={onPrint}><PrintIcon fontSize='small' /></IconButton>
      </Tooltip>
    )}
    <Tooltip title={editLabel}>
      <IconButton size='small' onClick={onEdit}><EditIcon fontSize='small' /></IconButton>
    </Tooltip>
    <Tooltip title='Close'>
      <IconButton size='small' onClick={onClose}><CloseIcon fontSize='small' /></IconButton>
    </Tooltip>
  </Box>
);
