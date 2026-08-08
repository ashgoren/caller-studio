import { useEffect, useState } from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
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

const fmtBtnSx = {
  border: 'none', background: 'none', cursor: 'pointer',
  px: '9px', py: '7px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1, color: 'text.primary', borderRadius: 0.5,
  '&:hover': { bgcolor: 'action.hover' },
  '&:active': { bgcolor: 'action.selected' },
} as const;

const fmtBtnActiveSx = {
  bgcolor: 'action.selected',
  color: 'primary.main',
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

  const fmtButtons = [
    { label: 'B', active: activeFormats?.bold ?? false, style: { fontWeight: 700, fontSize: '0.875rem' } as React.CSSProperties, action: () => editor.chain().focus().toggleBold().run() },
    { label: 'I', active: activeFormats?.italic ?? false, style: { fontStyle: 'italic', fontSize: '0.875rem' } as React.CSSProperties, action: () => editor.chain().focus().toggleItalic().run() },
  ];

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 0.25, p: 0.5,
      width: 'fit-content', flexShrink: 0,
      border: 1, borderColor: 'divider', borderRadius: 1,
      bgcolor: 'background.paper', boxShadow: 1,
    }}>
      {fmtButtons.map(({ label, style, action, active }) => (
        <Box key={label} component='button' sx={{ ...fmtBtnSx, ...(active && fmtBtnActiveSx) }}
          onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
          onTouchStart={(e: React.TouchEvent) => e.preventDefault()}
          onTouchEnd={(e: React.TouchEvent) => { e.preventDefault(); action(); }}
          onClick={action}
        >
          <span style={style}>{label}</span>
        </Box>
      ))}
    </Box>
  );
};

export const RichTextEditor = ({ value, onChange, editable = true, label, minHeight = 120, underline = true, autoFocus = false, toolbar = true, onEditorReady }: Props) => {
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

  useEffect(() => {
    onEditorReady?.(editor);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

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
