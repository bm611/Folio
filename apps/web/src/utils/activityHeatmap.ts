export const HEATMAP_MIN_WEEKS = 26;
export const HEATMAP_MAX_WEEKS = 52;
export const HEATMAP_CELL_SIZE = 11;
export const HEATMAP_CELL_GAP = 3;
export const HEATMAP_DAY_LABEL_WIDTH = 22;
export const HEATMAP_SECTION_GAP = 8;
export const HEATMAP_MONTH_LABEL_MIN_SPACING = 28;

const HEATMAP_MONTH_LABEL_ESTIMATED_WIDTH = 24;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function getMonthLabel(date: Date): string {
	return MONTH_LABELS[date.getMonth()] ?? 'Jan';
}

export interface HeatmapEntry {
	date: Date;
	words: number;
}

export interface HeatmapCell {
	date: Date;
	words: number;
	isFuture: boolean;
}

export interface MonthMarker {
	label: string;
	left: number;
	weekIndex: number;
}

export function clampHeatmapWeeks(weeks: number): number {
	return Math.min(HEATMAP_MAX_WEEKS, Math.max(HEATMAP_MIN_WEEKS, weeks));
}

export function getHeatmapGridWidth(weeks: number): number {
	return weeks * HEATMAP_CELL_SIZE + Math.max(0, weeks - 1) * HEATMAP_CELL_GAP;
}

export function getHeatmapWeekCount(availableWidth: number): number {
	if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
		return HEATMAP_MIN_WEEKS;
	}

	const usableWidth = Math.max(
		0,
		availableWidth - HEATMAP_DAY_LABEL_WIDTH - HEATMAP_SECTION_GAP
	);
	const weeks = Math.floor((usableWidth + HEATMAP_CELL_GAP) / (HEATMAP_CELL_SIZE + HEATMAP_CELL_GAP));

	return clampHeatmapWeeks(weeks);
}

export function buildHeatmapCells(
	entries: HeatmapEntry[],
	heatmapWeeks: number,
	todayInput: Date = new Date()
): HeatmapCell[] {
	const today = new Date(todayInput);
	today.setHours(0, 0, 0, 0);

	const dayOfWeek = today.getDay();
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - dayOfWeek - (heatmapWeeks - 1) * 7);

	const wordsByDay = new Map<string, number>();

	for (const entry of entries) {
		const date = new Date(entry.date);
		date.setHours(0, 0, 0, 0);

		if (date < startDate || date > today) {
			continue;
		}

		const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
		wordsByDay.set(key, (wordsByDay.get(key) ?? 0) + entry.words);
	}

	const cells: HeatmapCell[] = [];

	for (let w = 0; w < heatmapWeeks; w++) {
		for (let d = 0; d < 7; d++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + w * 7 + d);

			const isFuture = date > today;
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

			cells.push({
				date,
				words: isFuture ? 0 : (wordsByDay.get(key) ?? 0),
				isFuture
			});
		}
	}

	return cells;
}

export function getMonthMarkers(
	cells: HeatmapCell[],
	minLabelSpacingPx: number = HEATMAP_MONTH_LABEL_MIN_SPACING
): MonthMarker[] {
	if (cells.length === 0) {
		return [];
	}

	const rawMarkers: Array<MonthMarker & { rawLeft: number }> = [];
	let previousMonthKey = '';

	for (let index = 0; index < cells.length; index++) {
		const cell = cells[index];
		if (!cell) {
			continue;
		}

		const monthKey = `${cell.date.getFullYear()}-${cell.date.getMonth()}`;

		if (index === 0 || monthKey !== previousMonthKey) {
			const weekIndex = Math.floor(index / 7);
			rawMarkers.push({
				label: getMonthLabel(cell.date),
				left: 0,
				rawLeft: weekIndex * (HEATMAP_CELL_SIZE + HEATMAP_CELL_GAP),
				weekIndex
			});
		}

		previousMonthKey = monthKey;
	}

	const maxLeft = Math.max(
		0,
		getHeatmapGridWidth(Math.ceil(cells.length / 7)) - HEATMAP_MONTH_LABEL_ESTIMATED_WIDTH
	);
	let previousLeft = -Infinity;

	return rawMarkers.map(({ rawLeft, ...marker }) => {
		const left = Math.min(
			maxLeft,
			Math.max(rawLeft, previousLeft + minLabelSpacingPx)
		);
		previousLeft = left;

		return {
			...marker,
			left
		};
	});
}

export interface Last30DaysEntry {
	date: string;
	words: number;
	fullDate: string;
}

export function getLast30DaysData(
	entries: HeatmapEntry[],
	todayInput: Date = new Date()
): Last30DaysEntry[] {
	const today = new Date(todayInput);
	today.setHours(0, 0, 0, 0);

	const wordsByDay = new Map<string, number>();

	for (const entry of entries) {
		const date = new Date(entry.date);
		date.setHours(0, 0, 0, 0);

		if (date < today && date.getTime() >= today.getTime() - 29 * 24 * 60 * 60 * 1000) {
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
			wordsByDay.set(key, (wordsByDay.get(key) ?? 0) + entry.words);
		}
	}

	const result: Last30DaysEntry[] = [];

	for (let i = 29; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(today.getDate() - i);

		const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
		const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

		result.push({
			date: `${dayLabels[date.getDay()]} ${date.getDate()}`,
			words: wordsByDay.get(key) ?? 0,
			fullDate: date.toLocaleDateString('en-US', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		});
	}

	return result;
}
