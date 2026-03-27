"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
	type LocalCustomTheme,
	getCustomThemes,
	loadAndRegisterAllCustomThemes,
} from "@/lib/custom-themes";
import { ThemeEditorPanel } from "@/components/theme/theme-editor-panel";

interface ThemeEditorContext {
	isOpen: boolean;
	openEditor: () => void;
	closeEditor: () => void;
	customThemes: LocalCustomTheme[];
	refreshThemes: () => void;
}

const Ctx = createContext<ThemeEditorContext | null>(null);

export function useThemeEditor(): ThemeEditorContext {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error("useThemeEditor must be used within ThemeEditorProvider");
	return ctx;
}

export function ThemeEditorProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [customThemes, setCustomThemes] = useState<LocalCustomTheme[]>([]);

	const refreshThemes = useCallback(() => {
		setCustomThemes(getCustomThemes());
	}, []);

	// Load custom themes on mount
	useEffect(() => {
		const themes = loadAndRegisterAllCustomThemes();
		setCustomThemes(themes);
	}, []);

	// Listen for global open event
	useEffect(() => {
		const handler = () => setIsOpen(true);
		window.addEventListener("open-theme-editor", handler);
		return () => window.removeEventListener("open-theme-editor", handler);
	}, []);

	const openEditor = useCallback(() => setIsOpen(true), []);
	const closeEditor = useCallback(() => setIsOpen(false), []);

	const handleThemesChanged = useCallback(() => {
		refreshThemes();
		// Also notify any listeners that themes changed
		window.dispatchEvent(new CustomEvent("custom-themes-changed"));
	}, [refreshThemes]);

	return (
		<Ctx.Provider
			value={{
				isOpen,
				openEditor,
				closeEditor,
				customThemes,
				refreshThemes,
			}}
		>
			{children}
			<ThemeEditorPanel
				open={isOpen}
				onOpenChange={setIsOpen}
				onThemesChanged={handleThemesChanged}
			/>
		</Ctx.Provider>
	);
}
