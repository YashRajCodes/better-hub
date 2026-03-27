import type { ThemeColors, ThemeDefinition, ThemeVariant } from "./themes/types";
import { getTheme, registerStoreTheme, unregisterStoreTheme } from "./themes";
import type { CustomThemeVariant } from "./theme-store-types";

const STORAGE_KEY = "custom-themes";
const ID_PREFIX = "custom:";

export interface LocalCustomTheme {
	id: string;
	name: string;
	description: string;
	baseThemeId: string;
	dark: CustomThemeVariant;
	light: CustomThemeVariant;
	autoDeriveAdvanced: boolean;
	createdAt: number;
	updatedAt: number;
}

export const SIMPLIFIED_COLOR_KEYS: (keyof ThemeColors)[] = [
	"--background",
	"--foreground",
	"--card",
	"--card-foreground",
	"--primary",
	"--primary-foreground",
	"--secondary",
	"--secondary-foreground",
	"--muted",
	"--muted-foreground",
	"--accent",
	"--accent-foreground",
	"--border",
	"--input",
	"--ring",
	"--destructive",
	"--success",
	"--warning",
	"--link",
	"--info",
	"--code-bg",
	"--code-block-bg",
	"--inline-code-bg",
	"--diff-add-bar",
	"--diff-del-bar",
	"--diff-mod-bar",
];

export const ADVANCED_COLOR_KEYS: (keyof ThemeColors)[] = [
	"--scrollbar-thumb",
	"--scrollbar-thumb-hover",
	"--shader-bg",
	"--shader-filter",
	"--hero-border",
	"--line-gutter",
	"--line-highlight",
	"--search-highlight",
	"--search-highlight-active",
	"--selection-bg",
	"--table-row-alt",
	"--diff-add-bg",
	"--diff-del-bg",
	"--diff-add-text",
	"--diff-del-text",
	"--diff-add-gutter",
	"--diff-del-gutter",
	"--diff-word-add",
	"--diff-word-del",
	"--alert-note",
	"--alert-tip",
	"--alert-important",
	"--alert-warning",
	"--alert-caution",
	"--contrib-0",
	"--contrib-1",
	"--contrib-2",
	"--contrib-3",
	"--contrib-4",
];

export interface ColorGroup {
	label: string;
	keys: (keyof ThemeColors)[];
}

export const SIMPLIFIED_GROUPS: ColorGroup[] = [
	{
		label: "Core",
		keys: [
			"--background",
			"--foreground",
			"--card",
			"--card-foreground",
			"--border",
			"--input",
			"--ring",
		],
	},
	{
		label: "Primary",
		keys: ["--primary", "--primary-foreground"],
	},
	{
		label: "Secondary",
		keys: ["--secondary", "--secondary-foreground"],
	},
	{
		label: "Muted",
		keys: ["--muted", "--muted-foreground"],
	},
	{
		label: "Accent",
		keys: ["--accent", "--accent-foreground"],
	},
	{
		label: "Status",
		keys: ["--destructive", "--success", "--warning"],
	},
	{
		label: "Links & Info",
		keys: ["--link", "--info"],
	},
	{
		label: "Code",
		keys: ["--code-bg", "--code-block-bg", "--inline-code-bg"],
	},
	{
		label: "Diff Bars",
		keys: ["--diff-add-bar", "--diff-del-bar", "--diff-mod-bar"],
	},
];

export const ADVANCED_GROUPS: ColorGroup[] = [
	{
		label: "Scrollbar",
		keys: ["--scrollbar-thumb", "--scrollbar-thumb-hover"],
	},
	{
		label: "Shader & Hero",
		keys: ["--shader-bg", "--shader-filter", "--hero-border"],
	},
	{
		label: "Editor Lines",
		keys: ["--line-gutter", "--line-highlight", "--selection-bg"],
	},
	{
		label: "Search Highlights",
		keys: ["--search-highlight", "--search-highlight-active"],
	},
	{
		label: "Table",
		keys: ["--table-row-alt"],
	},
	{
		label: "Diff Backgrounds",
		keys: [
			"--diff-add-bg",
			"--diff-del-bg",
			"--diff-add-text",
			"--diff-del-text",
			"--diff-add-gutter",
			"--diff-del-gutter",
			"--diff-word-add",
			"--diff-word-del",
		],
	},
	{
		label: "Alerts",
		keys: [
			"--alert-note",
			"--alert-tip",
			"--alert-important",
			"--alert-warning",
			"--alert-caution",
		],
	},
	{
		label: "Contributions Graph",
		keys: ["--contrib-0", "--contrib-1", "--contrib-2", "--contrib-3", "--contrib-4"],
	},
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const h = hex.replace("#", "");
	if (h.length === 3) {
		const r = parseInt(h[0] + h[0], 16);
		const g = parseInt(h[1] + h[1], 16);
		const b = parseInt(h[2] + h[2], 16);
		return { r, g, b };
	}
	if (h.length === 6) {
		const r = parseInt(h.slice(0, 2), 16);
		const g = parseInt(h.slice(2, 4), 16);
		const b = parseInt(h.slice(4, 6), 16);
		return { r, g, b };
	}
	return null;
}

function rgbToHex(r: number, g: number, b: number): string {
	const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
	return `#${cl(r).toString(16).padStart(2, "0")}${cl(g).toString(16).padStart(2, "0")}${cl(b).toString(16).padStart(2, "0")}`;
}

function rgbaStr(hex: string, alpha: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;
	return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function lighten(hex: string, amount: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;
	return rgbToHex(
		rgb.r + (255 - rgb.r) * amount,
		rgb.g + (255 - rgb.g) * amount,
		rgb.b + (255 - rgb.b) * amount,
	);
}

function darken(hex: string, amount: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;
	return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount));
}

function blendHex(a: string, b: string, t: number): string {
	const ra = hexToRgb(a);
	const rb = hexToRgb(b);
	if (!ra || !rb) return a;
	return rgbToHex(
		ra.r + (rb.r - ra.r) * t,
		ra.g + (rb.g - ra.g) * t,
		ra.b + (rb.b - ra.b) * t,
	);
}

function parseColorToHex(value: string): string | null {
	if (value.startsWith("#")) {
		const h = value.replace("#", "");
		if (h.length === 3 || h.length === 6) return `#${h}`;
		return null;
	}

	const hslMatch = value.match(
		/^(?:hsla?\(\s*)?([+-]?\d+(?:\.\d+)?(?:deg|rad|turn|grad)?)\s*[ ,/]\s*([+-]?\d+(?:\.\d+)?)%\s*[ ,/]\s*([+-]?\d+(?:\.\d+)?)%\s*\)?$/i,
	);
	if (hslMatch && hslMatch[1] !== undefined) {
		const hueMatch = hslMatch[1].match(/^([+-]?\d+(?:\.\d+)?)(deg|rad|turn|grad)?$/i);
		if (!hueMatch) return null;

		let hue = parseFloat(hueMatch[1]);
		const unit = hueMatch[2]?.toLowerCase();
		if (unit === "rad") hue = (hue * 180) / Math.PI;
		if (unit === "turn") hue *= 360;
		if (unit === "grad") hue *= 0.9;

		const saturation = parseFloat(hslMatch[2]);
		const lightness = parseFloat(hslMatch[3]);
		if ([hue, saturation, lightness].some((n) => Number.isNaN(n))) return null;

		const s = saturation / 100;
		const l = lightness / 100;
		const c = (1 - Math.abs(2 * l - 1)) * s;
		const hp = (((hue % 360) + 360) % 360) / 60;
		const x = c * (1 - Math.abs((hp % 2) - 1));
		let r1 = 0;
		let g1 = 0;
		let b1 = 0;

		if (hp >= 0 && hp < 1) {
			r1 = c;
			g1 = x;
		} else if (hp < 2) {
			r1 = x;
			g1 = c;
		} else if (hp < 3) {
			g1 = c;
			b1 = x;
		} else if (hp < 4) {
			g1 = x;
			b1 = c;
		} else if (hp < 5) {
			r1 = x;
			b1 = c;
		} else {
			r1 = c;
			b1 = x;
		}

		const m = l - c / 2;
		return `#${[r1 + m, g1 + m, b1 + m]
			.map((n) =>
				Math.round(n * 255)
					.toString(16)
					.padStart(2, "0"),
			)
			.join("")}`;
	}

	const rgbaMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
	if (rgbaMatch) {
		return rgbToHex(+rgbaMatch[1], +rgbaMatch[2], +rgbaMatch[3]);
	}

	return null;
}

// Auto-derive advanced colors based on simplified inputs and base theme colors
export function deriveAdvancedColors(
	simplified: Partial<Record<keyof ThemeColors, string>>,
	baseColors: ThemeColors,
): ThemeColors {
	const get = (key: keyof ThemeColors): string => simplified[key] ?? baseColors[key];

	const bg = get("--background");
	const card = get("--card");
	const primary = get("--primary");
	const mutedFg = get("--muted-foreground");
	const border = get("--border");
	const ring = get("--ring");
	const destructive = get("--destructive");
	const success = get("--success");
	const warning = get("--warning");
	const info = get("--info");

	// Determine if dark mode by checking background luminance
	const bgRgb = hexToRgb(bg);
	const isDark = bgRgb ? bgRgb.r * 0.299 + bgRgb.g * 0.587 + bgRgb.b * 0.114 < 128 : true;

	const alpha = (baseHex: string, a: number) => {
		const h = parseColorToHex(baseHex);
		if (!h) return rgbaStr(bg, a);
		return rgbaStr(h, a);
	};

	// Helper for contribution graph gradients
	const contribGradient = (level: number): string => {
		if (level === 0) {
			return isDark ? darken(bg, 0.05) : darken(bg, 0.03);
		}
		const successHex = parseColorToHex(success) || (isDark ? "#006d32" : "#16a34a");
		const t = level / 4;
		return blendHex(isDark ? darken(bg, 0.05) : darken(bg, 0.03), successHex, t * 0.8);
	};

	const result: ThemeColors = {
		...baseColors,
		// Override simplified keys
		...(Object.fromEntries(
			Object.entries(simplified).filter(([, v]) => v !== undefined),
		) as Record<keyof ThemeColors, string>),

		// Auto-derived advanced colors
		"--scrollbar-thumb": border,
		"--scrollbar-thumb-hover": ring,
		"--shader-bg": bg,
		"--shader-filter": isDark ? "none" : "invert(1) contrast(1.4)",
		"--hero-border": alpha(border, isDark ? 0.6 : 0.08),
		"--line-gutter": alpha(mutedFg, 0.4),
		"--line-highlight": alpha(primary, isDark ? 0.12 : 0.07),
		"--search-highlight": alpha(warning, isDark ? 0.1 : 0.12),
		"--search-highlight-active": alpha(warning, isDark ? 0.22 : 0.25),
		"--selection-bg": alpha(primary, isDark ? 0.2 : 0.18),
		"--table-row-alt": card,
		"--diff-add-bg": alpha(success, isDark ? 0.09 : 0.07),
		"--diff-del-bg": alpha(destructive, isDark ? 0.11 : 0.07),
		"--diff-add-text": isDark ? lighten(success, 0.15) : darken(success, 0.1),
		"--diff-del-text": isDark ? lighten(destructive, 0.15) : destructive,
		"--diff-add-gutter": alpha(success, isDark ? 0.08 : 0.05),
		"--diff-del-gutter": alpha(destructive, isDark ? 0.1 : 0.05),
		"--diff-word-add": alpha(success, 0.2),
		"--diff-word-del": alpha(destructive, 0.2),
		"--alert-note": info,
		"--alert-tip": success,
		"--alert-important": primary,
		"--alert-warning": warning,
		"--alert-caution": destructive,
		"--contrib-0": contribGradient(0),
		"--contrib-1": contribGradient(1),
		"--contrib-2": contribGradient(2),
		"--contrib-3": contribGradient(3),
		"--contrib-4": contribGradient(4),
	};

	return result;
}

export function getCustomThemes(): LocalCustomTheme[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed as LocalCustomTheme[];
	} catch {
		return [];
	}
}

export function saveCustomTheme(theme: LocalCustomTheme): void {
	const themes = getCustomThemes();
	const idx = themes.findIndex((t) => t.id === theme.id);
	if (idx >= 0) {
		themes[idx] = theme;
	} else {
		themes.push(theme);
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export function deleteCustomTheme(id: string): void {
	const themes = getCustomThemes().filter((t) => t.id !== id);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export function generateCustomThemeId(): string {
	const rand = Math.random().toString(36).slice(2, 8);
	return `${ID_PREFIX}${Date.now().toString(36)}-${rand}`;
}

export function isCustomThemeId(id: string): boolean {
	return id.startsWith(ID_PREFIX);
}

export function localCustomThemeToThemeDefinition(theme: LocalCustomTheme): ThemeDefinition {
	return {
		id: theme.id,
		name: theme.name,
		description: theme.description,
		dark: theme.dark,
		light: theme.light,
	};
}

export function registerCustomTheme(theme: LocalCustomTheme): void {
	registerStoreTheme(localCustomThemeToThemeDefinition(theme));
}

export function unregisterCustomThemeFromRegistry(id: string): void {
	unregisterStoreTheme(id);
}

export function loadAndRegisterAllCustomThemes(): LocalCustomTheme[] {
	const themes = getCustomThemes();
	for (const theme of themes) {
		registerCustomTheme(theme);
	}
	return themes;
}

export function createCustomThemeFromBase(
	name: string,
	description: string,
	baseThemeId: string,
): LocalCustomTheme | null {
	const base = getTheme(baseThemeId);
	if (!base) return null;

	const id = generateCustomThemeId();
	const now = Date.now();

	return {
		id,
		name,
		description,
		baseThemeId,
		dark: {
			accentPreview: base.dark.accentPreview,
			bgPreview: base.dark.bgPreview,
			colors: { ...base.dark.colors },
		},
		light: {
			accentPreview: base.light.accentPreview,
			bgPreview: base.light.bgPreview,
			colors: { ...base.light.colors },
		},
		autoDeriveAdvanced: true,
		createdAt: now,
		updatedAt: now,
	};
}

export function rebuildThemeColors(theme: LocalCustomTheme, mode: "dark" | "light"): ThemeVariant {
	const base = getTheme(theme.baseThemeId);
	if (!base) return theme[mode];

	const simplified: Partial<Record<keyof ThemeColors, string>> = {};
	for (const key of SIMPLIFIED_COLOR_KEYS) {
		simplified[key] = theme[mode].colors[key];
	}

	let colors: ThemeColors;
	if (theme.autoDeriveAdvanced) {
		colors = deriveAdvancedColors(simplified, base[mode].colors);
		// Keep user's simplified overrides
		for (const key of SIMPLIFIED_COLOR_KEYS) {
			if (theme[mode].colors[key]) {
				colors[key] = theme[mode].colors[key];
			}
		}
	} else {
		colors = { ...base[mode].colors, ...theme[mode].colors };
	}

	return {
		accentPreview: theme[mode].accentPreview || base[mode].accentPreview,
		bgPreview: theme[mode].bgPreview || base[mode].bgPreview,
		colors,
	};
}
