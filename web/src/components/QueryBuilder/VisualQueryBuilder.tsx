import { Box, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Add, CreateNewFolder, Close } from '@mui/icons-material';
import { QueryBuilder } from 'react-querybuilder';
import { QueryBuilderDnD } from '@react-querybuilder/dnd';
import * as ReactDnD from 'react-dnd';
import * as ReactDndHtml5Backend from 'react-dnd-html5-backend';
import * as ReactDndTouchBackend from 'react-dnd-touch-backend';
import { MaterialValueEditor, QueryBuilderMaterial } from '@react-querybuilder/material';
import { DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { operators, textOperators, numberOperators, booleanOperators, dateOperators } from './constants';
import type { Field, RuleGroupType, ActionProps, CombinatorSelectorProps, ValueEditorProps } from 'react-querybuilder';

type QueryBuilderComponentProps = {
  fields: Field[];
  query: RuleGroupType;
  onQueryChange: (query: RuleGroupType) => void;
};

const CombinatorSelector = ({ value, handleOnChange }: CombinatorSelectorProps) => (
  <ToggleButtonGroup
    size='small'
    exclusive
    value={value}
    onChange={(_e, val) => val && handleOnChange(val)}
  >
    <ToggleButton value='and' color='warning'>ALL</ToggleButton>
    <ToggleButton value='or' color='info'>ANY</ToggleButton>
  </ToggleButtonGroup>
);

const AddRuleAction = ({ handleOnClick, disabled }: ActionProps) => (
  <IconButton size='small' onClick={handleOnClick} disabled={disabled} sx={{ p: 0.25 }} title='Add rule'>
    <Tooltip title='Add rule'>
      <Add sx={{ fontSize: 18 }} />
    </Tooltip>
  </IconButton>
);

const AddGroupAction = ({ handleOnClick, disabled }: ActionProps) => (
  <IconButton size='small' onClick={handleOnClick} disabled={disabled} sx={{ p: 0.25 }} title='Add group'>
    <Tooltip title='Add group'>
      <CreateNewFolder sx={{ fontSize: 18 }} />
    </Tooltip>
  </IconButton>
);

const RemoveAction = ({ handleOnClick, disabled, className }: ActionProps) => (
  <IconButton className={className} size='small' onClick={handleOnClick} disabled={disabled} sx={{ p: 0.25 }} title='Remove'>
    <Close sx={{ fontSize: 16 }} />
  </IconButton>
);

const DatePickerInput = ({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) => (
  <DatePicker
    value={value ? parseISO(value) : null}
    onChange={date => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
    disabled={disabled}
    slotProps={{ textField: { variant: 'standard', size: 'small', sx: { width: 150 } } }}
  />
);

const ValueEditor = (props: ValueEditorProps) => {
  if (props.inputType === 'date' && props.operator !== 'null' && props.operator !== 'notNull') {
    if (props.operator === 'between' || props.operator === 'notBetween') {
      const [from = '', to = ''] = (props.value ?? '').split(',');
      return (
        <>
          <DatePickerInput
            value={from}
            disabled={props.disabled}
            onChange={date => props.handleOnChange(`${date},${to}`)}
          />
          <DatePickerInput
            value={to}
            disabled={props.disabled}
            onChange={date => props.handleOnChange(`${from},${date}`)}
          />
        </>
      );
    }
    return (
      <DatePickerInput
        value={props.value ?? ''}
        disabled={props.disabled}
        onChange={props.handleOnChange}
      />
    );
  }
  return <MaterialValueEditor {...props} />;
};

export const VisualQueryBuilder = ({ fields, query, onQueryChange }: QueryBuilderComponentProps) => {
  return (
    <Box sx={styles}>
      <QueryBuilderDnD dnd={{ ...ReactDnD, ...ReactDndHtml5Backend, ...ReactDndTouchBackend }}>
        <QueryBuilderMaterial>
          <QueryBuilder
            fields={fields}
            query={query}
            onQueryChange={onQueryChange}
            enableDragAndDrop
            getRuleGroupClassname={rg => rg.combinator === 'or' ? 'rg-or' : 'rg-and'}
            operators={operators}
            getOperators={getOperatorsForField}
            getDefaultOperator={getDefaultOperatorForField}
            getValueEditorType={getValueEditorTypeForField}
            getValues={getValuesForField}
            controlElements={{
              combinatorSelector: CombinatorSelector,
              valueEditor: ValueEditor,
              addRuleAction: AddRuleAction,
              addGroupAction: AddGroupAction,
              removeRuleAction: RemoveAction,
              removeGroupAction: RemoveAction,
            }}
          />
        </QueryBuilderMaterial>
      </QueryBuilderDnD>
    </Box>
  )
};

type FieldMisc = { fieldData: Field };

const getOperatorsForField = (field: string, misc: FieldMisc) => {
  if (!field) return operators;
  const { inputType } = misc.fieldData;
  if (inputType === 'string') return operators.filter(op => textOperators.includes(op.name));
  if (inputType === 'number') return operators.filter(op => numberOperators.includes(op.name));
  if (inputType === 'boolean') return operators.filter(op => booleanOperators.includes(op.name));
  if (inputType === 'date') return operators.filter(op => dateOperators.includes(op.name));
  return null;
};

const getDefaultOperatorForField = (field: string, misc: FieldMisc) => {
  if (!field) return '=';
  const { inputType } = misc.fieldData;
  if (inputType === 'string') return 'contains';
  if (inputType === 'number') return '=';
  if (inputType === 'boolean') return '=';
  return '=';
};

const getValueEditorTypeForField = (_field: string, _operator: string, misc: FieldMisc) => {
  return misc.fieldData.inputType === 'boolean' ? 'select' : 'text';
};

const getValuesForField = (_field: string, _operator: string, misc: FieldMisc) => {
  if (misc.fieldData.inputType === 'boolean') {
    return [{ name: 'true', label: 'TRUE' }];
    // return [{ name: 'true', label: 'TRUE' }, { name: 'false', label: 'FALSE' }];
  }
  return [];
};

const styles = {
  '& .rule': {
    position: { xs: 'relative', sm: 'static' },
    display: 'flex',
    gap: { xs: 1, sm: 2 },
    alignItems: 'center',
    flexWrap: 'wrap',
    py: { xs: 1.5, sm: 0.75 },
    pr: { xs: 5, sm: 0 },
    borderBottom: { xs: '2px solid', sm: 'none' },
    borderColor: 'divider',
  },
  '& .rule:last-child': {
    borderBottom: 'none',
    pb: { xs: 1.5, sm: 0 },
  },
  '& .rule-remove': {
    position: { xs: 'absolute', sm: 'static' },
    top: { xs: 8, sm: 'auto' },
    right: { xs: 0, sm: 'auto' },
  },
  '& .ruleGroup-header': {
    display: 'flex',
    gap: 2,
    alignItems: 'center',
    borderBottom: '1px solid',
    borderColor: 'divider',
    pb: 0.75,
    mb: 0,
  },
  '& .rule-fields': { width: 150 },
  '& .rule-operators': { width: 180 },
  '& .rule-value': { width: 200 },
  '& .ruleGroup-body': { display: 'flex', flexDirection: 'column' },
  '& .ruleGroup': { mt: 2, p: 2, border: '1px solid', borderRadius: 1 },
  '& .ruleGroup.rg-and': {
    backgroundColor: 'background.paper',
    borderColor: 'warning.main',
  },
  '& .ruleGroup.rg-or': {
    backgroundColor: 'action.hover',
    borderColor: 'info.main',
  },
  '& .queryBuilder-dragHandle': {
    display: { xs: 'none', sm: 'flex' },
  },
  '& .queryBuilder > .ruleGroup': {
    mt: 0,
    p: 0,
    border: 'none',
    backgroundColor: 'transparent',
  },
  '& .queryBuilder > .ruleGroup > .ruleGroup-header': { display: 'none' },
};
