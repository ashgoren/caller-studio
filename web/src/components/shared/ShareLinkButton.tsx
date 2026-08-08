import { IconButton, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useNotify } from '@/hooks/useNotify';

export const ShareLinkButton = ({ kind, token }: { kind: 'd' | 'p'; token: string }) => {
  const { toastSuccess } = useNotify();

  return (
    <Tooltip title='Copy share link'>
      <IconButton size='small' onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/share/${kind}/${token}`);
        toastSuccess('Share link copied', { undo: false });
      }}>
        <LinkIcon fontSize='small' />
      </IconButton>
    </Tooltip>
  );
};
