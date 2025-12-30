export const theme = {
  colors: {
    primary: '#000000',
    secondary: '#ffffff',
    background: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    border: '#e5e5e5',
    error: '#ef4444',
    success: '#10b981',
  },
  fonts: {
    body: 'system-ui, -apple-system, sans-serif',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
};

export type Theme = typeof theme;
