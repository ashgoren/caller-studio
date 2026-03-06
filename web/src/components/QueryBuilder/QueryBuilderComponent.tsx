import { useState } from 'react';
import { formatQuery } from 'react-querybuilder';
import { parseSQL } from 'react-querybuilder/parseSQL';
import { Box, Collapse, IconButton, Paper, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ModeToggle } from './ModeToggle';
import { VisualQueryBuilder } from './VisualQueryBuilder';
import { SQLEditor } from './SQLEditor';
import { removeEmptyRules } from './utils';
import { FigureFilterSection } from '@/components/FigureFilter/FigureFilterSection';
import type { Field, RuleGroupType } from 'react-querybuilder';
import type { FigureFilterState } from '@/lib/types/figureFilter';

type QueryMode = 'visual' | 'sql';

type QueryBuilderComponentProps = {
  fields: Field[];
  defaultQuery: RuleGroupType;
  query: RuleGroupType;
  onQueryChange: (query: RuleGroupType) => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  figureFilter?: FigureFilterState;
  onFigureFilterChange?: (state: FigureFilterState) => void;
};

export const QueryBuilderComponent = ({ fields, defaultQuery, query, onQueryChange, filterOpen, setFilterOpen, figureFilter, onFigureFilterChange }: QueryBuilderComponentProps) => {
  const [mode, setMode] = useState<QueryMode>('visual');
  const [sqlText, setSqlText] = useState('');
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Sync SQL when switching to SQL mode
  const handleModeChange = (newMode: QueryMode) => {
    if (newMode === 'sql') {
      const cleanedQuery = removeEmptyRules(query);
      setSqlText(cleanedQuery.rules.length ? formatQuery(cleanedQuery, 'sql') : '');
      setSqlError(null);
    }
    setMode(newMode);
  };

  // Parse SQL back to query
  const applySql = () => {
    if (!sqlText.trim()) {
      onQueryChange(defaultQuery);
      setSqlError(null);
      return;
    }
    try {
      const parsed = parseSQL(sqlText);
      onQueryChange(parsed);
      setSqlError(null);
    } catch {
      setSqlError('Invalid SQL syntax');
    }
  };

  return (
    <Collapse in={filterOpen}>
      <Paper sx={{ mb: 2, p: 2, boxShadow: 3, borderRadius: 2, backgroundColor: 'action.hover' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ModeToggle mode={mode} handleModeChange={handleModeChange} />
          <Tooltip title='Close'>
            <IconButton size='small' onClick={() => setFilterOpen(false)}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>

        {mode === 'visual' ?
          <VisualQueryBuilder fields={fields} query={query} onQueryChange={onQueryChange} />
        :
          <SQLEditor sqlText={sqlText} setSqlText={setSqlText} sqlError={sqlError} applySql={applySql} />
        }

        {figureFilter && onFigureFilterChange &&
          <FigureFilterSection state={figureFilter} onChange={onFigureFilterChange} />
        }
      </Paper>
    </Collapse>
  );
};
