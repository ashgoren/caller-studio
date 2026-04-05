import { Box } from '@mui/material';
import { useNavigate } from 'react-router';
import { MODEL_PATHS } from '@/lib/paths';
import type { PrimaryModel } from '@/lib/types/database';

export const RelationCell = <TRelation,>({ items, model, getId, getLabel }: {
  items: TRelation[] | null | undefined;
  model: PrimaryModel;
  getId: (item: TRelation) => number;
  getLabel: (item: TRelation) => string;
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
      {items?.map((item) => (
        <Box
          key={getId(item)}
          onClick={(e) => {
            e.stopPropagation();
            const url = `${MODEL_PATHS[model]}/${getId(item)}`;
            if (e.metaKey || e.ctrlKey) window.open(url, '_blank');
            else navigate(url);
          }}
          sx={{ cursor: 'pointer', textDecoration: 'underline', color: 'secondary.main', '&:hover': { color: 'secondary.dark' } }}
        >
          {getLabel(item)}
        </Box>
      ))}
    </Box>
  );
};
