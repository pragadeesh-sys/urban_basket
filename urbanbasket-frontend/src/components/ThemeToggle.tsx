import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        type="button"
        className={theme === 'light' ? 'active' : ''}
        aria-pressed={theme === 'light'}
        title="Light theme"
        onClick={() => setTheme('light')}
      >
        <Sun size={16} />
      </button>
      <button
        type="button"
        className={theme === 'dark' ? 'active' : ''}
        aria-pressed={theme === 'dark'}
        title="Dark theme"
        onClick={() => setTheme('dark')}
      >
        <Moon size={16} />
      </button>
    </div>
  );
}
