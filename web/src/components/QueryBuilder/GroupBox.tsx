import type { Ref } from 'react';
import { Box, Button, IconButton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import CreateNewFolder from '@mui/icons-material/CreateNewFolder';
import DragIndicator from '@mui/icons-material/DragIndicator';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';
import { RuleRow } from './RuleRow';
import { isFilterGroup, newFieldRule, newFilterGroup } from '@/lib/fieldFilter';
import type { FilterGroup, FilterRule, Field } from '@/lib/types/fieldFilter';

type GroupBoxProps = {
  group: FilterGroup;
  fields: Field[];
  index: number;
  showFigures: boolean;
  onUpdate: (group: FilterGroup) => void;
  onRemove: () => void;
};

export const GroupBody = ({ group, fields, showFigures, onChange }: { group: FilterGroup; fields: Field[]; showFigures: boolean; onChange: (group: FilterGroup) => void }) => {
  const updateItem = (index: number, updated: FilterRule | FilterGroup) => {
    const rules = [...group.rules];
    rules[index] = updated;
    onChange({ ...group, rules });
  };

  const removeItem = (index: number) => {
    onChange({ ...group, rules: group.rules.filter((_, i) => i !== index) });
  };

  return (
    <DragDropProvider onDragEnd={event => {
      onChange({ ...group, rules: move(group.rules, event) as (FilterRule | FilterGroup)[] });
    }}>
      {group.rules.map((item, index) =>
        isFilterGroup(item) ? (
          <GroupBox
            key={item.id}
            group={item}
            fields={fields}
            index={index}
            showFigures={showFigures}
            onUpdate={updated => updateItem(index, updated)}
            onRemove={() => removeItem(index)}
          />
        ) : (
          <RuleRow
            key={item.id}
            rule={item}
            fields={fields}
            index={index}
            showFigures={showFigures}
            onUpdate={updated => updateItem(index, updated)}
            onRemove={() => removeItem(index)}
          />
        )
      )}
    </DragDropProvider>
  );
};

const GroupBox = ({ group, fields, index, showFigures, onUpdate, onRemove }: GroupBoxProps) => {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({ id: group.id, index });
  const isOr = group.combinator === 'or';

  return (
    <Box
      ref={ref as Ref<HTMLDivElement>}
      sx={{
        mt: 2, p: 2, borderRadius: 1,
        border: '1px solid',
        borderColor: isOr ? 'info.main' : 'warning.main',
        backgroundColor: isOr ? 'action.hover' : 'background.paper',
        opacity: isDragging ? 0.5 : 1,
        outline: isDropTarget ? '2px solid' : undefined,
        outlineColor: isDropTarget ? 'primary.main' : undefined,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: group.rules.length ? 1 : 0 }}>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Box ref={handleRef as Ref<HTMLDivElement>} sx={{ display: { xs: 'none', sm: 'flex' }, cursor: 'grab' }}>
            <DragIndicator sx={{ fontSize: 18, opacity: 0.5 }} />
          </Box>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>Group</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            size='small'
            exclusive
            value={group.combinator}
            onChange={(_, val) => val && onUpdate({ ...group, combinator: val })}
          >
            <ToggleButton value='and' color='warning'>ALL</ToggleButton>
            <ToggleButton value='or' color='info'>ANY</ToggleButton>
          </ToggleButtonGroup>
          <IconButton size='small' onClick={onRemove} sx={{ p: 0.25 }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <GroupBody group={group} fields={fields} showFigures={showFigures} onChange={onUpdate} />

      <Box sx={{ display: 'flex', gap: 2, mt: group.rules.length ? 2 : 0 }}>
        <Button size='small' color='secondary' startIcon={<Add />} onClick={() => onUpdate({ ...group, rules: [...group.rules, newFieldRule()] })}>
          Add rule
        </Button>
        <Button size='small' color='secondary' startIcon={<CreateNewFolder />} onClick={() => onUpdate({ ...group, rules: [...group.rules, newFilterGroup()] })}>
          Add group
        </Button>
      </Box>
    </Box>
  );
};
