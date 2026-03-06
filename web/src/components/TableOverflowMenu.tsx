import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useConfirm } from 'material-ui-confirm';
import { clearPersistence } from '@/hooks/usePersistence';
import type { Model } from '@/lib/types/database';

export const TableOverflowMenu = ({ model, onClearFilters }: {
  model: Model;
  onClearFilters: () => void;
}) => {
  const confirm = useConfirm();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleClearFilters = async () => {
    setMenuAnchor(null);
    const { confirmed } = await confirm({
      title: 'Clear filters',
      description: <>Are you sure you want to clear all filters?<br /><strong>This action cannot be undone.</strong></>,
      confirmationText: 'Clear',
      cancellationText: 'Cancel',
    });
    if (!confirmed) return;
    onClearFilters();
  };

  const handleClearState = async () => {
    setMenuAnchor(null);
    const { confirmed } = await confirm({
      title: 'Clear all state',
      description: <>Are you sure you want to clear all state, including filters, sort, etc?<br /><strong>This action cannot be undone.</strong></>,
      confirmationText: 'Clear',
      cancellationText: 'Cancel',
    });
    if (!confirmed) return;
    clearPersistence(`mrt_${model}`);
    window.location.reload();
  };

  return (
    <>
      <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={handleClearFilters}>Clear filters</MenuItem>
        <MenuItem onClick={handleClearState}>Clear all state</MenuItem>
      </Menu>
    </>
  );
};
