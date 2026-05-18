import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: { name: 'light' | 'dark' | 'system'; icon: any; label: string }[] = [
    { name: 'light', icon: Sun, label: 'Light' },
    { name: 'dark', icon: Moon, label: 'Dark' },
    { name: 'system', icon: Laptop, label: 'System' },
  ];

  return (
    <div className="flex items-center bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 p-1 rounded-full">
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name)}
          className={cn(
            "p-2 rounded-full transition-all relative group",
            theme === t.name 
              ? "text-cyan-500 bg-white/10" 
              : "text-slate-500 hover:text-slate-300"
          )}
          title={t.label}
        >
          <t.icon className="w-4 h-4" />
          {theme === t.name && (
            <motion.div
              layoutId="activeTheme"
              className="absolute inset-0 bg-white/10 rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
