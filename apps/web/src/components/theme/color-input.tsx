"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function parseColorToHex(value: string): string | null {
	if (!value) return null;
	if (value.startsWith("#")) {
		const h = value.slice(1);
		if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
		if (h.length === 6) return `#${h}`;
		return null;
	}

	const hsl = value.match(
		/^(?:hsla?\(\s*)?([+-]?\d+(?:\.\d+)?(?:deg|rad|turn|grad)?)\s*[ ,/]\s*([+-]?\d+(?:\.\d+)?)%\s*[ ,/]\s*([+-]?\d+(?:\.\d+)?)%\s*\)?$/i,
	);
	if (hsl) {
		const hueMatch = hsl[1].match(/^([+-]?\d+(?:\.\d+)?)(deg|rad|turn|grad)?$/i);
		if (!hueMatch) return null;

		let hue = parseFloat(hueMatch[1]);
		const unit = hueMatch[2]?.toLowerCase();
		if (unit === "rad") hue = (hue * 180) / Math.PI;
		if (unit === "turn") hue *= 360;
		if (unit === "grad") hue *= 0.9;

		const saturation = parseFloat(hsl[2]);
		const lightness = parseFloat(hsl[3]);
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
		const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, "0");
		const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, "0");
		const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, "0");
		return `#${r}${g}${b}`;
	}
	return null;
}

function formatLabel(key: string): string {
	return key
		.replace(/^--/, "")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ColorInputProps {
	cssVar: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export function ColorInput({ cssVar, value, onChange, disabled }: ColorInputProps) {
	const colorRef = useRef<HTMLInputElement>(null);
	const [textValue, setTextValue] = useState(value);
	const hex = parseColorToHex(value);

	useEffect(() => {
		setTextValue(value);
	}, [value]);

	const handleColorChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newHex = e.target.value;
			setTextValue(newHex);
			onChange(newHex);
		},
		[onChange],
	);

	const handleTextChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value;
			setTextValue(raw);
			const parsed = parseColorToHex(raw);
			if (parsed) {
				onChange(parsed);
			}
		},
		[onChange],
	);

	const handleTextBlur = useCallback(() => {
		// Reset to last valid value if text is invalid
		const parsed = parseColorToHex(textValue);
		if (!parsed) {
			setTextValue(value);
		}
	}, [textValue, value]);

	return (
		<div className="flex items-center gap-2 group">
			<button
				type="button"
				disabled={disabled}
				onClick={() => colorRef.current?.click()}
				className={cn(
					"size-7 rounded border border-border/60 shrink-0 cursor-pointer transition-opacity",
					disabled && "opacity-40 cursor-not-allowed",
				)}
				style={{ backgroundColor: hex ?? value }}
				aria-label={`Pick color for ${cssVar}`}
			/>
			<input
				ref={colorRef}
				type="color"
				value={hex ?? "#000000"}
				onChange={handleColorChange}
				disabled={disabled}
				className="sr-only"
				tabIndex={-1}
			/>
			<span className="text-[11px] text-muted-foreground w-[120px] shrink-0 truncate">
				{formatLabel(cssVar)}
			</span>
			<input
				type="text"
				value={textValue}
				onChange={handleTextChange}
				onBlur={handleTextBlur}
				disabled={disabled}
				spellCheck={false}
				className={cn(
					"flex-1 min-w-0 bg-transparent border border-transparent text-[11px] font-mono text-foreground/80 px-1.5 py-0.5 rounded",
					"hover:border-border/40 focus:border-border focus:outline-none",
					disabled && "opacity-40 cursor-not-allowed",
				)}
			/>
		</div>
	);
}
