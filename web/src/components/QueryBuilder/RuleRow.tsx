import type { Ref } from 'react';
import { Box, IconButton, MenuItem, Select, TextField } from '@mui/material';
import Close from '@mui/icons-material/Close';
import DragIndicator from '@mui/icons-material/DragIndicator';
import { DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { useSortable } from '@dnd-kit/react/sortable';
import { operators, textOperators, numberOperators, booleanOperators, dateOperators } from './constants';
import { isFigureRule, newFieldRule, newFigureRule } from '@/lib/fieldFilter';
import type { FilterRule, FieldRule, Field } from '@/lib/types/fieldFilter';

const PHRASES = ['A1', 'A2', 'B1', 'B2'];

const getOperatorsForType = (inputType: string) => {
  if (inputType === 'string') return operators.filter(op => textOperators.includes(op.name));
  if (inputType === 'number') return operators.filter(op => numberOperators.includes(op.name));
  if (inputType === 'boolean') return operators.filter(op => booleanOperators.includes(op.name));
  if (inputType === 'date') return operators.filter(op => dateOperators.includes(op.name));
  return operators;
};

const getDefaultOperatorForType = (inputType: string): string =>
  inputType === 'string' ? 'contains' : '=';

const ValueInput = ({ rule, fields, onChange }: { rule: FieldRule; fields: Field[]; onChange: (rule: FieldRule) => void }) => {
  const fieldDef = fields.find(f => f.name === rule.field);
  const inputType = fieldDef?.inputType ?? 'string';

  if (inputType === 'boolean') {
    return (
      <Select size='small' value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })} sx={{ width: 120 }}>
        <MenuItem value='true'>TRUE</MenuItem>
      </Select>
    );
  }

  if (inputType === 'date') {
    if (rule.operator === 'between' || rule.operator === 'notBetween') {
      const [from = '', to = ''] = (rule.value ?? '').split(',');
      return (
        <>
          <DatePicker
            value={from ? parseISO(from) : null}
            onChange={date => onChange({ ...rule, value: `${date ? format(date, 'yyyy-MM-dd') : ''},${to}` })}
            slotProps={{ textField: { variant: 'standard', size: 'small', sx: { width: 130 } } }}
          />
          <DatePicker
            value={to ? parseISO(to) : null}
            onChange={date => onChange({ ...rule, value: `${from},${date ? format(date, 'yyyy-MM-dd') : ''}` })}
            slotProps={{ textField: { variant: 'standard', size: 'small', sx: { width: 130 } } }}
          />
        </>
      );
    }
    return (
      <DatePicker
        value={rule.value ? parseISO(rule.value) : null}
        onChange={date => onChange({ ...rule, value: date ? format(date, 'yyyy-MM-dd') : '' })}
        slotProps={{ textField: { variant: 'standard', size: 'small', sx: { width: 150 } } }}
      />
    );
  }

  return (
    <TextField
      size='small'
      type={inputType === 'number' ? 'number' : 'text'}
      value={rule.value}
      onChange={e => onChange({ ...rule, value: e.target.value })}
      sx={{ width: 200 }}
    />
  );
};

export const RuleRow = ({ rule, fields, index, showFigures, onUpdate, onRemove }: {
  rule: FilterRule;
  fields: Field[];
  index: number;
  showFigures: boolean;
  onUpdate: (rule: FilterRule) => void;
  onRemove: () => void;
}) => {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({ id: rule.id, index });

  const rowSx = {
    opacity: isDragging ? 0.5 : 1,
    borderTop: isDropTarget ? '2px solid' : '2px solid transparent',
    borderColor: isDropTarget ? 'primary.main' : 'transparent',
  };

  if (isFigureRule(rule)) {
    return (
      <Box ref={ref as Ref<HTMLDivElement>} sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center', py: 0.75, ...rowSx }}>
        <Box ref={handleRef as Ref<HTMLDivElement>} sx={{ display: { xs: 'none', sm: 'flex' }, cursor: 'grab' }}>
          <DragIndicator sx={{ fontSize: 18, opacity: 0.5 }} />
        </Box>
        <Select
          size='small'
          value='__figure__'
          onChange={e => {
            const v = e.target.value;
            if (v !== '__figure__') {
              const fieldDef = fields.find(f => f.name === v);
              const nr = newFieldRule();
              onUpdate({ ...nr, field: v, operator: getDefaultOperatorForType(fieldDef?.inputType ?? 'string') });
            }
          }}
          sx={{ width: 150 }}
        >
          <MenuItem value='__figure__'>Figures</MenuItem>
          {fields.map(f => <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>)}
        </Select>
        <Select size='small' value={rule.phrase} displayEmpty onChange={e => onUpdate({ ...rule, phrase: e.target.value })} sx={{ width: 130 }}>
          <MenuItem value=''>Any phrase</MenuItem>
          {PHRASES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </Select>
        <TextField
          size='small'
          type='number'
          placeholder='Beats'
          slotProps={{ input: { inputProps: { min: 0, max: 16 } } }}
          value={rule.beats ?? ''}
          onChange={e => onUpdate({ ...rule, beats: e.target.value === '' ? null : Number(e.target.value) })}
          sx={{ width: 90 }}
        />
        <TextField
          size='small'
          placeholder='Description'
          value={rule.description}
          onChange={e => onUpdate({ ...rule, description: e.target.value })}
          sx={{ flex: 1, minWidth: 100 }}
        />
        <IconButton size='small' onClick={onRemove} sx={{ p: 0.25 }}>
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    );
  }

  const fieldDef = fields.find(f => f.name === rule.field);
  const inputType = fieldDef?.inputType ?? 'string';
  const fieldOperators = getOperatorsForType(inputType);

  return (
    <Box ref={ref as Ref<HTMLDivElement>} sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center', flexWrap: 'wrap', py: 0.75, ...rowSx }}>
      <Box ref={handleRef as Ref<HTMLDivElement>} sx={{ display: { xs: 'none', sm: 'flex' }, cursor: 'grab' }}>
        <DragIndicator sx={{ fontSize: 18, opacity: 0.5 }} />
      </Box>
      <Select
        size='small'
        displayEmpty
        value={rule.field}
        onChange={e => {
          const v = e.target.value;
          if (v === '__figure__') {
            onUpdate(newFigureRule());
          } else {
            const fd = fields.find(f => f.name === v);
            onUpdate({ ...rule, field: v, operator: getDefaultOperatorForType(fd?.inputType ?? 'string'), value: '' });
          }
        }}
        sx={{ width: 150 }}
      >
        <MenuItem value='' disabled><em>Select field</em></MenuItem>
        {fields.map(f => <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>)}
        {showFigures && <MenuItem value='__figure__'>Figures</MenuItem>}
      </Select>
      {rule.field && (
        <Select
          size='small'
          value={rule.operator}
          onChange={e => onUpdate({ ...rule, operator: e.target.value, value: '' })}
          sx={{ width: 180 }}
        >
          {fieldOperators.map(op => <MenuItem key={op.name} value={op.name}>{op.label}</MenuItem>)}
        </Select>
      )}
      {rule.field && !['null', 'notNull'].includes(rule.operator) && (
        <ValueInput rule={rule as FieldRule} fields={fields} onChange={r => onUpdate(r)} />
      )}
      <IconButton size='small' onClick={onRemove} sx={{ p: 0.25 }}>
        <Close sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
};
