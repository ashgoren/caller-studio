import { useEffect, useState } from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Box, Typography } from '@mui/material';
import { ToolbarBar, ToolbarButton } from './Toolbar';

interface Props {
  value: string;
  onChange?: (value: string) => void;
  editable?: boolean;
  label?: string;
  minHeight?: number | string;
  underline?: boolean;
  autoFocus?: boolean;
  toolbar?: boolean;
  onEditorReady?: (editor: Editor | null) => void;
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

// Bold/Italic toolbar for a RichTextEditor. Exported so a parent can render it
// wherever it needs to live (e.g. pinned in a header, outside the scrolling content).
export const RichTextToolbar = ({ editor }: { editor: Editor | null }) => {
  const activeFormats = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
    }),
  });

  if (!editor) return null;

  return (
    <ToolbarBar>
      <ToolbarButton label='B' title='Bold' active={activeFormats?.bold ?? false} onAction={() => editor.chain().focus().toggleBold().run()}
        style={{ fontWeight: 700, fontSize: '0.875rem' }} />
      <ToolbarButton label='I' title='Italic' active={activeFormats?.italic ?? false} onAction={() => editor.chain().focus().toggleItalic().run()}
        style={{ fontStyle: 'italic', fontSize: '0.875rem' }} />
    </ToolbarBar>
  );
};

export const RichTextEditor = ({ value, onChange, editable = true, label, minHeight = 120, underline = true, autoFocus = false, toolbar = true, onEditorReady }: Props) => {
  const [focused, setFocused] = useState(false);

  // Read-only viewers must recreate on value change to pick up external updates (tiptap only
  // patches options in place otherwise); editable instances must not, or typing resets the cursor.
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
  }, editable ? [] : [value]);

  useEffect(() => {
    onEditorReady?.(editor);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

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
      {toolbar && (
        <Box sx={{ mb: 1 }}>
          <RichTextToolbar editor={editor} />
        </Box>
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
