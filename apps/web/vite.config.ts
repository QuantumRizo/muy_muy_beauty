/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno de pruebas (node es suficiente para lógica pura, jsdom para componentes)
    environment: 'node',
    // Incluir archivos de test en src/__tests__/
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Priorizar cobertura de la lógica de negocio crítica
      include: [
        'src/lib/commissions.ts',
        'src/utils/agenda.ts',
        'src/lib/dateUtils.ts',
      ],
    },
  },
})
