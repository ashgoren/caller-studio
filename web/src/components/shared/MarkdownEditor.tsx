import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { Box, Typography } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
  dragbar?: boolean;
}

const withTitle = (command: ICommand, title: string): ICommand => ({
  ...command,
  buttonProps: { ...command.buttonProps, title },
});

const toolbar = [
  withTitle(commands.bold, 'Bold (Ctrl+B)'),
  withTitle(commands.italic, 'Italic (Ctrl+I)'),
  withTitle(commands.strikethrough, 'Strikethrough'),
  commands.divider,
  commands.group(
    [commands.title1, commands.title2, commands.title3],
    { name: 'title', groupName: 'title', buttonProps: { title: 'Heading' } }
  ),
  commands.divider,
  withTitle(commands.link, 'Link'),
  withTitle(commands.quote, 'Blockquote'),
  commands.divider,
  withTitle(commands.unorderedListCommand, 'Bullet list'),
  withTitle(commands.orderedListCommand, 'Numbered list'),
];

const extraToolbar = [
  withTitle(commands.fullscreen, 'Fullscreen'),
];

export const MarkdownEditor = ({ label, value, onChange, height = 200, dragbar = true }: Props) => {
  const { mode, systemMode } = useColorScheme();
  const colorMode = mode === 'system' ? (systemMode ?? 'light') : (mode ?? 'light');

  return (
    <Box>
      {label && (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ fontWeight: 400, display: 'block', mb: 0.5 }}
        >
          {label}
        </Typography>
      )}
      <Box data-color-mode={colorMode} sx={{ '& .w-md-editor-text': { height: '100%' } }}>
        <MDEditor
          value={value}
          onChange={v => onChange(v ?? '')}
          height={height}
          visibleDragbar={dragbar}
          preview='edit'
          commands={toolbar}
          extraCommands={extraToolbar}
          previewOptions={{ remarkPlugins: [remarkBreaks, remarkGfm] }}
        />
      </Box>
    </Box>
  );
};
