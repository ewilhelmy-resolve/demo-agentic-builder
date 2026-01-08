import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

/**
 * Apply theme to document based on preference
 */
function applyTheme(theme: Theme) {
	const root = window.document.documentElement;
	root.classList.remove("light", "dark");

	if (theme === "system") {
		const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
			.matches
			? "dark"
			: "light";
		root.classList.add(systemTheme);
	} else {
		root.classList.add(theme);
	}
}

/**
 * Theme store with persistence
 * Manages light/dark/system theme preference
 */
export const useThemeStore = create<ThemeStore>()(
	persist(
		(set) => ({
			theme: "light",
			setTheme: (theme) => {
				applyTheme(theme);
				set({ theme });
			},
		}),
		{
			name: "theme-storage",
			onRehydrateStorage: () => (state) => {
				// Apply theme on rehydration
				if (state?.theme) {
					applyTheme(state.theme);
				}
			},
		}
	)
);

// Listen for system theme changes when using "system" preference
if (typeof window !== "undefined") {
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", () => {
			const { theme } = useThemeStore.getState();
			if (theme === "system") {
				applyTheme("system");
			}
		});
}
