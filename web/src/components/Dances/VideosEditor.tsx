import { Box, Button, IconButton, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { PendingVideo } from '@/hooks/useDanceVideos';

export const VideosEditor = ({ videos, onChange }: {
  videos: PendingVideo[];
  onChange: (videos: PendingVideo[]) => void;
}) => {
  const handleAdd = () =>
    onChange([...videos, { tempId: crypto.randomUUID(), url: '', description: '' }]);

  const handleRemove = (tempId: string) =>
    onChange(videos.filter(v => v.tempId !== tempId));

  const handleUpdate = (tempId: string, field: 'url' | 'description', value: string) =>
    onChange(videos.map(v => v.tempId === tempId ? { ...v, [field]: value } : v));

  return (
    <Box>
      <Stack spacing={1.5}>
        {videos.map(v => (
          <Box key={v.tempId} sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              label='Description'
              value={v.description}
              onChange={e => handleUpdate(v.tempId, 'description', e.target.value)}
              variant='standard'
              sx={{ flex: '1 1 0' }}
            />
            <TextField
              label='URL'
              value={v.url}
              onChange={e => handleUpdate(v.tempId, 'url', e.target.value)}
              variant='standard'
              sx={{ flex: '2 1 0' }}
            />
            <IconButton size='small' onClick={() => handleRemove(v.tempId)} sx={{ mb: 0.5, flexShrink: 0 }}>
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Box>
        ))}
      </Stack>
      <Button size='small' startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: videos.length > 0 ? 1 : 0 }}>
        Add video
      </Button>
    </Box>
  );
};
