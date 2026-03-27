"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, ChevronDown, ChevronRight, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getTheme, applyTheme } from "@/lib/themes";
import { useColorTheme } from "@/components/theme/theme-provider";
import { ColorInput } from "@/components/theme/color-input";
import { BaseThemePicker } from "@/components/theme/base-theme-picker";
import type { ThemeColors } from "@/lib/themes/types";
import {
	type LocalCustomTheme,
	getCustomThemes,
	saveCustomTheme,
	deleteCustomTheme,
	createCustomThemeFromBase,
	registerCustomTheme,
	unregisterCustomThemeFromRegistry,
	rebuildThemeColors,
	SIMPLIFIED_GROUPS,
	ADVANCED_GROUPS,
} from "@/lib/custom-themes";

type EditorView = "list" | "picker" | "editor";

interface ThemeEditorPanelProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onThemesChanged: () => void;
}

export function ThemeEditorPanel({ open, onOpenChange, onThemesChanged }: ThemeEditorPanelProps) {
	const [view, setView] = useState<EditorView>("list");
	const [themes, setThemes] = useState<LocalCustomTheme[]>([]);
	const [editingTheme, setEditingTheme] = useState<LocalCustomTheme | null>(null);
	const [editMode, setEditMode] = useState<"dark" | "light">("dark");
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [isNewTheme, setIsNewTheme] = useState(false);
	const { themeId: currentThemeId, mode: appMode, setTheme: setColorTheme } = useColorTheme();

	const refreshThemes = useCallback(() => {
		setThemes(getCustomThemes());
	}, []);

	useEffect(() => {
		if (open) {
			refreshThemes();
			setView("list");
			setEditingTheme(null);
		}
	}, [open, refreshThemes]);

	const handleCreateNew = useCallback(() => {
		setView("picker");
	}, []);

	const handleSelectBase = useCallback((baseThemeId: string) => {
		const theme = createCustomThemeFromBase(
			"Untitled Theme",
			"Custom theme",
			baseThemeId,
		);
		if (theme) {
			setEditingTheme(theme);
			setEditMode("dark");
			setAdvancedOpen(false);
			setIsNewTheme(true);
			setView("editor");
		}
	}, []);

	const handleEdit = useCallback((theme: LocalCustomTheme) => {
		setEditingTheme({ ...theme });
		setEditMode("dark");
		setAdvancedOpen(false);
		setIsNewTheme(false);
		setView("editor");
	}, []);

	const handleDelete = useCallback(
		(id: string) => {
			unregisterCustomThemeFromRegistry(id);
			deleteCustomTheme(id);
			refreshThemes();
			onThemesChanged();
			if (currentThemeId === id) {
				setColorTheme("better-auth");
			}
		},
		[refreshThemes, onThemesChanged, currentThemeId, setColorTheme],
	);

	const handleCreate = useCallback(() => {
		if (!editingTheme) return;
		const theme = { ...editingTheme, updatedAt: Date.now() };

		if (theme.autoDeriveAdvanced) {
			const base = getTheme(theme.baseThemeId);
			if (base) {
				theme.dark = rebuildThemeColors(theme, "dark");
				theme.light = rebuildThemeColors(theme, "light");
			}
		}

		saveCustomTheme(theme);
		registerCustomTheme(theme);
		refreshThemes();
		onThemesChanged();
		setColorTheme(theme.id);

		setView("list");
		setEditingTheme(null);
		setIsNewTheme(false);
	}, [editingTheme, refreshThemes, onThemesChanged, setColorTheme]);

	const handleColorChange = useCallback(
		(mode: "dark" | "light", key: keyof ThemeColors, value: string) => {
			if (!editingTheme) return;
			setEditingTheme((prev) => {
				if (!prev) return prev;
				const updated = {
					...prev,
					[mode]: {
						...prev[mode],
						colors: {
							...prev[mode].colors,
							[key]: value,
						},
					},
					updatedAt: Date.now(),
				};

				if (!isNewTheme) {
					saveCustomTheme(updated);
					registerCustomTheme(updated);
					if (currentThemeId === updated.id) {
						applyTheme(updated.id, appMode);
					}
					refreshThemes();
					onThemesChanged();
				}

				return updated;
			});
		},
		[editingTheme, isNewTheme, currentThemeId, appMode, refreshThemes, onThemesChanged],
	);

	const handleApplyTheme = useCallback(
		(id: string) => {
			setColorTheme(id);
		},
		[setColorTheme],
	);

	const handlePickerCancel = useCallback(() => {
		setView("list");
	}, []);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				showCloseButton
				title="Theme Editor"
				className="w-full sm:max-w-md p-0 gap-0"
			>
				{view === "list" && (
					<ThemeListView
						themes={themes}
						currentThemeId={currentThemeId}
						onCreateNew={handleCreateNew}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onApply={handleApplyTheme}
					/>
				)}
				{view === "picker" && (
					<BaseThemePicker
						onSelect={handleSelectBase}
						onCancel={handlePickerCancel}
					/>
				)}
				{view === "editor" && editingTheme && (
					<ThemeEditorView
						theme={editingTheme}
						editMode={editMode}
						advancedOpen={advancedOpen}
						isNewTheme={isNewTheme}
						onModeChange={setEditMode}
						onAdvancedToggle={() => setAdvancedOpen((o) => !o)}
						onColorChange={handleColorChange}
						onNameChange={(name) => {
							setEditingTheme((prev) => {
								if (!prev) return prev;
								const updated = {
									...prev,
									name,
									updatedAt: Date.now(),
								};
								if (!isNewTheme) {
									saveCustomTheme(updated);
									refreshThemes();
									onThemesChanged();
								}
								return updated;
							});
						}}
						onDescriptionChange={(description) => {
							setEditingTheme((prev) => {
								if (!prev) return prev;
								const updated = {
									...prev,
									description,
									updatedAt: Date.now(),
								};
								if (!isNewTheme) {
									saveCustomTheme(updated);
									refreshThemes();
									onThemesChanged();
								}
								return updated;
							});
						}}
						onAutoDeriveChange={(autoDeriveAdvanced) => {
							setEditingTheme((prev) => {
								if (!prev) return prev;
								let updated = {
									...prev,
									autoDeriveAdvanced,
									updatedAt: Date.now(),
								};
								if (autoDeriveAdvanced) {
									updated = {
										...updated,
										dark: rebuildThemeColors(
											updated,
											"dark",
										),
										light: rebuildThemeColors(
											updated,
											"light",
										),
									};
								}
								if (!isNewTheme) {
									saveCustomTheme(updated);
									registerCustomTheme(
										updated,
									);
									if (
										currentThemeId ===
										updated.id
									) {
										applyTheme(
											updated.id,
											appMode,
										);
									}
									refreshThemes();
									onThemesChanged();
								}
								return updated;
							});
						}}
						onCreate={isNewTheme ? handleCreate : undefined}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}

// List View

function ThemeListView({
	themes,
	currentThemeId,
	onCreateNew,
	onEdit,
	onDelete,
	onApply,
}: {
	themes: LocalCustomTheme[];
	currentThemeId: string;
	onCreateNew: () => void;
	onEdit: (theme: LocalCustomTheme) => void;
	onDelete: (id: string) => void;
	onApply: (id: string) => void;
}) {
	return (
		<div className="flex flex-col h-full">
			<div className="px-5 py-4 border-b border-border">
				<h2 className="text-base font-semibold text-foreground">
					Custom Themes
				</h2>
				<p className="text-[11px] text-muted-foreground mt-0.5">
					Create and manage your personal themes
				</p>
			</div>

			<div className="flex-1 overflow-y-auto">
				{/* Create new */}
				<div className="p-3">
					<button
						onClick={onCreateNew}
						className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-dashed border-border hover:border-foreground/25 hover:bg-muted/30 transition-colors cursor-pointer group"
					>
						<div className="size-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
							<Plus className="size-4 text-primary" />
						</div>
						<div className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left">
							<span className="text-[13px] font-medium text-foreground truncate">
								Create Custom Theme
							</span>
							<span className="text-[11px] text-muted-foreground hidden sm:block shrink-0">
								Start from a base theme
							</span>
						</div>
					</button>
				</div>

				{/* Theme list */}
				{themes.length > 0 ? (
					<div className="px-3 pb-3">
						<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">
							Your Themes ({themes.length})
						</div>
						<div className="flex flex-col gap-1.5">
							{themes.map((theme) => {
								const isActive =
									currentThemeId === theme.id;
								return (
									<div
										key={theme.id}
										className={cn(
											"group flex items-center gap-3 px-3 py-2.5 rounded-md border transition-colors",
											isActive
												? "border-primary/30 bg-primary/[0.04]"
												: "border-border hover:border-foreground/15 hover:bg-muted/20",
										)}
									>
										<div className="flex items-center gap-0.5 shrink-0">
											<span
												className="size-4 rounded-full border border-border/40"
												style={{
													backgroundColor:
														theme
															.dark
															.bgPreview,
												}}
											/>
											<span
												className="size-4 rounded-full border border-border/40 -ml-1.5"
												style={{
													backgroundColor:
														theme
															.dark
															.accentPreview,
												}}
											/>
										</div>
										<div
											className="flex-1 min-w-0 cursor-pointer"
											onClick={() =>
												onApply(
													theme.id,
												)
											}
										>
											<span className="text-[13px] font-medium text-foreground block truncate">
												{
													theme.name
												}
											</span>
											<span className="text-[10px] text-muted-foreground">
												Based
												on{" "}
												{getTheme(
													theme.baseThemeId,
												)
													?.name ??
													theme.baseThemeId}
											</span>
										</div>
										<div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
											{isActive && (
												<Check className="size-3.5 text-success mr-1" />
											)}
											<button
												onClick={() =>
													onEdit(
														theme,
													)
												}
												className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
												title="Edit"
											>
												<Pencil className="size-3" />
											</button>
											<button
												onClick={() =>
													onDelete(
														theme.id,
													)
												}
												className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
												title="Delete"
											>
												<Trash2 className="size-3" />
											</button>
										</div>
										{isActive &&
											themes.length >
												0 && (
												<div className="group-hover:hidden">
													<Check className="size-3.5 text-success" />
												</div>
											)}
									</div>
								);
							})}
						</div>
					</div>
				) : (
					<div className="px-3 pb-3">
						<div className="py-8 text-center text-[11px] text-muted-foreground/60">
							No custom themes yet.
							<br />
							Create one to get started.
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// Editor View

function ThemeEditorView({
	theme,
	editMode,
	advancedOpen,
	isNewTheme,
	onModeChange,
	onAdvancedToggle,
	onColorChange,
	onNameChange,
	onDescriptionChange,
	onAutoDeriveChange,
	onCreate,
}: {
	theme: LocalCustomTheme;
	editMode: "dark" | "light";
	advancedOpen: boolean;
	isNewTheme: boolean;
	onModeChange: (mode: "dark" | "light") => void;
	onAdvancedToggle: () => void;
	onColorChange: (mode: "dark" | "light", key: keyof ThemeColors, value: string) => void;
	onNameChange: (name: string) => void;
	onDescriptionChange: (description: string) => void;
	onAutoDeriveChange: (auto: boolean) => void;
	onCreate?: () => void;
}) {
	const colors = theme.autoDeriveAdvanced
		? rebuildThemeColors(theme, editMode).colors
		: theme[editMode].colors;

	return (
		<div className="flex flex-col h-full mt-10">
			{/* Header */}
			<div className="px-5 py-3 border-b border-border space-y-2.5">
				<div>
					<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
						Name
					</label>
					<input
						type="text"
						value={theme.name}
						onChange={(e) => onNameChange(e.target.value)}
						className="w-full bg-transparent border border-border rounded px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-foreground/30"
						placeholder="Theme name"
					/>
				</div>
				<div>
					<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
						Description
					</label>
					<input
						type="text"
						value={theme.description}
						onChange={(e) =>
							onDescriptionChange(e.target.value)
						}
						className="w-full bg-transparent border border-border rounded px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-foreground/30"
						placeholder="Short description"
					/>
				</div>

				{/* Dark / Light toggle */}
				<div className="flex gap-0 rounded-md overflow-hidden border border-border">
					<button
						onClick={() => onModeChange("dark")}
						className={cn(
							"flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium transition-colors cursor-pointer",
							editMode === "dark"
								? "bg-foreground text-background"
								: "bg-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						<Moon className="size-3" />
						Dark
					</button>
					<button
						onClick={() => onModeChange("light")}
						className={cn(
							"flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium transition-colors cursor-pointer",
							editMode === "light"
								? "bg-foreground text-background"
								: "bg-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						<Sun className="size-3" />
						Light
					</button>
				</div>
			</div>

			{/* Colors */}
			<div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
				{SIMPLIFIED_GROUPS.map((group) => (
					<div key={group.label}>
						<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-0.5">
							{group.label}
						</div>
						<div className="space-y-1">
							{group.keys.map((key) => (
								<ColorInput
									key={key}
									cssVar={key}
									value={colors[key]}
									onChange={(v) =>
										onColorChange(
											editMode,
											key,
											v,
										)
									}
								/>
							))}
						</div>
					</div>
				))}

				{/* Advanced Colors (collapsible) */}
				<div>
					<button
						onClick={onAdvancedToggle}
						className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-0.5 cursor-pointer hover:text-foreground transition-colors w-full"
					>
						{advancedOpen ? (
							<ChevronDown className="size-3" />
						) : (
							<ChevronRight className="size-3" />
						)}
						Advanced Colors
					</button>

					{advancedOpen && (
						<div className="space-y-3">
							{/* Auto-derive toggle */}
							<div className="flex items-center gap-2 px-0.5 py-1">
								<button
									onClick={() =>
										onAutoDeriveChange(
											!theme.autoDeriveAdvanced,
										)
									}
									className={cn(
										"relative inline-flex h-4.5 w-8 shrink-0 rounded-full transition-colors cursor-pointer",
										theme.autoDeriveAdvanced
											? "bg-primary"
											: "bg-muted",
									)}
								>
									<span
										className={cn(
											"inline-block size-3.5 rounded-full bg-white shadow transition-transform mt-0.5",
											theme.autoDeriveAdvanced
												? "translate-x-3.5 ml-0.5"
												: "translate-x-0.5",
										)}
									/>
								</button>
								<span className="text-[11px] text-foreground">
									Auto-derive from simplified
									colors
								</span>
							</div>

							{ADVANCED_GROUPS.map((group) => (
								<div key={group.label}>
									<div className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-1.5 px-0.5">
										{group.label}
									</div>
									<div className="space-y-1">
										{group.keys.map(
											(key) => (
												<ColorInput
													key={
														key
													}
													cssVar={
														key
													}
													value={
														colors[
															key
														]
													}
													onChange={(
														v,
													) =>
														onColorChange(
															editMode,
															key,
															v,
														)
													}
													disabled={
														theme.autoDeriveAdvanced
													}
												/>
											),
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{isNewTheme && onCreate && (
				<div className="px-4 py-3 border-t border-border">
					<button
						onClick={onCreate}
						className="w-full py-2.5 text-[12px] font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors cursor-pointer"
					>
						Create Theme
					</button>
				</div>
			)}
		</div>
	);
}
