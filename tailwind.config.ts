import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        surface: "var(--bg-surface)",
        "surface-muted": "var(--bg-surface-muted)",
        elevated: "var(--bg-surface-elevated)",
        ink: "var(--text-primary)",
        slate: "var(--text-secondary)",
        mist: "var(--text-muted)",
        line: "var(--border-subtle)",
        "line-strong": "var(--border-strong)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        "accent-soft": "var(--accent-soft)",
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        warning: "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        info: "var(--info)",
        "info-soft": "var(--info-soft)"
      },
      fontFamily: {
        sans: ["var(--font-ui)"],
        display: ["var(--font-display)"]
      },
      borderRadius: {
        scorlo: "1.5rem",
        shell: "2rem"
      },
      boxShadow: {
        scorlo: "0 16px 36px rgba(17, 24, 39, 0.08)",
        soft: "0 8px 20px rgba(17, 24, 39, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
