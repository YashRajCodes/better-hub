"use client";

import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { listThemes, listStoreThemes } from "@/lib/themes";

function hsl(v: string): string {
	if (v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl(")) return v;
	return `hsl(${v})`;
}

interface BaseThemePickerProps {
	onSelect: (themeId: string) => void;
	onCancel: () => void;
}

export function BaseThemePicker({ onSelect, onCancel }: BaseThemePickerProps) {
	const [search, setSearch] = useState("");

	const allThemes = useMemo(() => {
		const builtIn = listThemes();
		const store = listStoreThemes();
		return [...builtIn, ...store];
	}, []);

	const filtered = useMemo(() => {
		if (!search.trim()) return allThemes;
		const s = search.toLowerCase();
		return allThemes.filter(
			(t) =>
				t.name.toLowerCase().includes(s) ||
				t.description.toLowerCase().includes(s),
		);
	}, [allThemes, search]);

	return (
		<div className="flex flex-col h-full">
			<div className="px-4 py-3 border-b border-border">
				<h3 className="text-sm font-medium text-foreground mb-2">
					Choose a Base Theme
				</h3>
				<p className="text-[11px] text-muted-foreground mb-3">
					Your custom theme will start from this base. You can modify
					colors after.
				</p>
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search themes..."
						autoFocus
						className="w-full bg-transparent border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30"
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				<div className="grid grid-cols-1 gap-2">
					{filtered.map((theme) => (
						<button
							key={theme.id}
							onClick={() => onSelect(theme.id)}
							className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border hover:border-foreground/20 hover:bg-muted/30 transition-colors text-left cursor-pointer group"
						>
							<div className="flex items-center gap-1 shrink-0">
								<span
									className="size-5 rounded-full border border-border/40"
									style={{
										backgroundColor:
											hsl(
												theme
													.dark
													.bgPreview,
											),
									}}
								/>
								<span
									className="size-5 rounded-full border border-border/40 -ml-2"
									style={{
										backgroundColor:
											hsl(
												theme
													.dark
													.accentPreview,
											),
									}}
								/>
							</div>
							<div className="flex-1 min-w-0">
								<span className="text-[13px] font-medium text-foreground">
									{theme.name}
								</span>
								<span className="text-[11px] text-muted-foreground ml-2 hidden sm:inline">
									{theme.description}
								</span>
							</div>
							<Check className="size-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 shrink-0 transition-colors" />
						</button>
					))}
				</div>
				{filtered.length === 0 && (
					<div className="py-8 text-center text-sm text-muted-foreground/70">
						No themes match &ldquo;{search}&rdquo;
					</div>
				)}
			</div>

			<div className="px-4 py-3 border-t border-border">
				<button
					onClick={onCancel}
					className="text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
				>
					← Back to theme list
				</button>
			</div>
		</div>
	);
}
