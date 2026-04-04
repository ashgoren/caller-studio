import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Box, Typography } from '@mui/material';

interface Props {
  value: string;
  onChange?: (value: string) => void;
  editable?: boolean;
  label?: string;
  minHeight?: number | string;
  underline?: boolean;
  autoFocus?: boolean;
}

// Load the StarterKit (bold, italic, etc) & Markdown extensions
const EXTENSIONS = [
  StarterKit,
  Markdown.configure({ markedOptions: { breaks: true } }),
];

// Styles applied to the editor in both edit & view modes
const PROSE_SX = {
  '& p': { margin: '0 0 1em 0' },
  '& p:last-child': { marginBottom: 0 },
  '& h1': { fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.4em 0' },
  '& h2': { fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.4em 0' },
  '& h3': { fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4em 0' },
  '& ul, & ol': { paddingLeft: '1.4em', marginBottom: '1em' },
  '& hr': { margin: '1.4em 0', borderColor: 'divider' },
} as const;

export const RichTextEditor = ({ value, onChange, editable = true, label, minHeight = 120, underline = true, autoFocus = false }: Props) => {
  const [focused, setFocused] = useState(false);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value,
    contentType: 'markdown',
    editable,
    autofocus: autoFocus ? 'start' : false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getMarkdown());
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  // If the value changes externally while the editor is blurred, update the content. This would be if the user edits on another device.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editor.getMarkdown();
    if (current !== value) {
      editor.commands.setContent(editor.storage.markdown.manager.parse(value), { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editable) {
    if (!value.trim()) return null;
    return (
      <Box sx={PROSE_SX}>
        <EditorContent editor={editor} />
      </Box>
    );
  }

  return (
    <>
      {label && (
        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 400, display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          ...(underline && {
            borderBottom: focused ? 2 : 1,
            borderColor: focused ? 'primary.main' : 'text.secondary',
            pb: 0.5,
          }),
          cursor: 'text',
          ...PROSE_SX,
          '& .ProseMirror': { outline: 'none', minHeight },
        }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </Box>
    </>
  );
};
