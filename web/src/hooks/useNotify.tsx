import { useSnackbar, closeSnackbar } from 'notistack';
import { useUndoActions } from '@/contexts/UndoContext';
import { Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const useNotify = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { undo } = useUndoActions();

  return {
    toastSuccess: (message: string, options: { undo?: boolean } = {}) => enqueueSnackbar(message, {
      variant: 'success',
      anchorOrigin: { vertical: 'top', horizontal: 'right' },
      action: (snackbarId) => (
        <>
          {options.undo !== false && (
            <Button size='small' color='inherit' onClick={undo}>
              Undo
            </Button>
          )}
          <IconButton size='small' color='inherit' onClick={() => closeSnackbar(snackbarId)}>
            <CloseIcon fontSize='small' />
          </IconButton>
        </>
      )
    }),
    toastError: (message: string) => enqueueSnackbar(message, {
      variant: 'error',
      anchorOrigin: { vertical: 'top', horizontal: 'center' }
    })
  };
};
