import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-router':   ['react-router'],
          'vendor-mui':      ['@mui/material', '@mui/icons-material', '@mui/system', '@emotion/react', '@emotion/styled', '@mui/x-date-pickers', 'date-fns'],
          'vendor-mrt':      ['material-react-table', '@tanstack/react-table'],
          'vendor-query':    ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-dnd':      ['@dnd-kit/react', '@dnd-kit/helpers'],
          'vendor-tiptap':     ['@tiptap/react', '@tiptap/core', '@tiptap/starter-kit', '@tiptap/markdown'],
        }
      }
    }
  }
})
