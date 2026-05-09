import { useMemo, useRef, useState, memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

import {
	SidebarLeftIcon,
	Add01Icon,
	CloudUploadIcon,
	Calendar01Icon,
	PinIcon,
	ArrowUp01Icon,
	ArrowDown01Icon,
	Search01Icon,
	CommandIcon,
	NoteIcon,
	Tag01Icon,
	FileExportIcon,
	BookOpen01Icon,
} from '@hugeicons/core-free-icons';

import Icon from './Icon';
import SettingsMenu from './SettingsMenu';
import ProfilePanel from './ProfilePanel';
import { countBodyWords, getNoteDisplayTitle } from '../utils/noteMeta';
import { isStarterNote } from '../utils/starterNotes';
import { useAuth } from '../contexts/AuthContext';
import type { NoteFile, TreeNode } from '../types';
import type { SyncStatus } from './noteEditorUtils';
import {
	formatRelativeTime,
	compareRecentNotes,
} from './noteEditorUtils';

interface HomeScreenProps {
	notes: TreeNode[];
	onNewNote: () => void;
	onCreateDailyNote: () => void;
	onUpdateNote: (id: string, updates: Record<string, unknown>, options?: Record<string, unknown>) => void;
	onSelectNote: (id: string | null) => void;
	theme: string;
	onSetTheme: (theme: string) => void;
	onCycleTheme: () => void;
	accentId: string;
	onAccentChange: (id: string) => void;
	sidebarCollapsed: boolean;
	onToggleSidebar: () => void;
	onOpenCommandPalette?: () => void;
	onOpenAuthModal: () => void;
	syncing: boolean;
	syncStatus: SyncStatus;
	onSync: () => void;
	fontId: string;
	onFontChange: (id: string) => void;
}

// ─── Google Store palette (locked, dashboard-tuned) ──────────────────────────
//
// Re-binds host theme variables so this surface ignores the user's theme
// palette and matches the landing page exactly. Sans for prose, mono for
// every numeric (per high-density dashboard convention).
//
const GS_SCOPE: React.CSSProperties = {
	['--bg-primary' as string]:   '#ffffff',
	['--bg-surface' as string]:   '#f8f9fa',
	['--bg-elevated' as string]:  '#ffffff',
	['--bg-hover' as string]:     '#f1f3f4',
	['--bg-deep' as string]:      '#e8eaed',
	['--ink' as string]:          '#202124',
	['--ink-soft' as string]:     '#3c4043',
	['--text-primary' as string]: '#202124',
	['--text-secondary' as string]: '#3c4043',
	['--text-muted' as string]:   '#5f6368',
	['--text-inverse' as string]: '#ffffff',
	['--border-subtle' as string]: '#e8eaed',
	['--border-default' as string]: '#dadce0',
	['--accent' as string]:       '#1a73e8',
	['--accent-hover' as string]: '#1765cc',
	['--accent-text' as string]:  '#ffffff',
	['--accent-soft' as string]:  '#e8f0fe',
	['--success' as string]:      '#1e8e3e',
	['--warning' as string]:      '#f29900',
	['--danger' as string]:       '#d93025',
	background: '#ffffff',
	color: '#202124',
	fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
};

const FONT      = '"Poppins", system-ui, -apple-system, sans-serif';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';
const INK       = '#202124';
const INK_SOFT  = '#3c4043';
const MUTED     = '#5f6368';
const SUBTLE    = '#80868b';
const DIVIDER   = '#e8eaed';
const SURFACE   = '#f8f9fa';
const HOVER     = '#f1f3f4';
const BLUE      = '#1a73e8';
const BLUE_TINT = '#e8f0fe';
const GREEN     = '#1e8e3e';
const AMBER     = '#f29900';

function compactNumber(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
	return String(n);
}
function isPinned(note: NoteFile): boolean {
	return Array.isArray(note.tags) && note.tags.some((t) => t === 'favorite' || t === 'pinned');
}
function startOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
	return (
		<span
			className="text-[10.5px] font-medium uppercase tracking-[0.16em]"
			style={{ color: MUTED, fontFamily: FONT }}
		>
			{children}
		</span>
	);
}

function Mono({
	children,
	size = 14,
	weight = 500,
	color = INK,
	className = '',
}: {
	children: React.ReactNode;
	size?: number;
	weight?: 400 | 500 | 600;
	color?: string;
	className?: string;
}) {
	return (
		<span
			className={`tabular-nums ${className}`}
			style={{ fontFamily: FONT_MONO, fontSize: size, fontWeight: weight, color, letterSpacing: '-0.01em' }}
		>
			{children}
		</span>
	);
}

function PrimaryAction({
	children,
	onClick,
	icon,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	icon?: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium tracking-[-0.005em] active:scale-[0.96]"
			style={{ background: BLUE, color: '#ffffff', fontFamily: FONT, transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease' }}
			onMouseEnter={(e) => (e.currentTarget.style.background = '#1765cc')}
			onMouseLeave={(e) => (e.currentTarget.style.background = BLUE)}
		>
			{icon}
			{children}
		</button>
	);
}

function GhostAction({
	children,
	onClick,
	icon,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	icon?: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-[13px] font-medium tracking-[-0.005em] active:scale-[0.96]"
			style={{ borderColor: DIVIDER, background: '#ffffff', color: INK, fontFamily: FONT, transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease' }}
			onMouseEnter={(e) => (e.currentTarget.style.background = HOVER)}
			onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
		>
			{icon}
			{children}
		</button>
	);
}

function StatusDot({ color, label }: { color: string; label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<span className="relative inline-flex h-1.5 w-1.5">
				<span
					className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
					style={{ background: color }}
				/>
				<span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }} />
			</span>
			<span className="text-[11px] font-medium" style={{ color: MUTED, fontFamily: FONT }}>
				{label}
			</span>
		</span>
	);
}

// ─── Dashboard header (compact) ──────────────────────────────────────────────

function DashboardHeader({
	greeting,
	displayName,
	dateLabel,
	clockLabel,
	syncing,
	syncStatus,
	onCreateDailyNote,
	onNewNote,
	onOpenCommandPalette,
}: {
	greeting: string;
	displayName: string;
	dateLabel: string;
	clockLabel: string;
	syncing: boolean;
	syncStatus: SyncStatus;
	onCreateDailyNote: () => void;
	onNewNote: () => void;
	onOpenCommandPalette?: () => void;
}) {
	const syncMeta = (() => {
		if (syncing) return { color: AMBER, label: 'Syncing' };
		if (syncStatus.state === 'error') return { color: '#d93025', label: 'Sync error' };
		if (syncStatus.state === 'offline') return { color: SUBTLE, label: 'Offline' };
		return { color: GREEN, label: 'Synced' };
	})();

	return (
		<header
			className="sticky top-0 z-10 w-full"
			style={{ background: '#ffffff', borderBottom: `1px solid ${DIVIDER}` }}
		>
			<div className="mx-auto flex w-full max-w-[1320px] flex-col gap-3 px-6 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
				<div className="min-w-0">
					<div className="flex items-center gap-3">
						<h1
							className="truncate text-[22px] leading-none tracking-[-0.02em]"
							style={{ fontFamily: FONT, fontWeight: 500, color: INK }}
						>
							{greeting}
							{displayName && (
								<>
									<span style={{ color: MUTED }}>,</span>{' '}
									<span style={{ color: BLUE, fontWeight: 500 }}>{displayName}</span>
								</>
							)}
						</h1>
					</div>
					<div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
						<span
							className="text-[12px] font-medium uppercase tracking-[0.14em]"
							style={{ color: MUTED, fontFamily: FONT }}
						>
							{dateLabel}
						</span>
						<span className="hidden h-3 w-px sm:block" style={{ background: DIVIDER }} />
						<Mono size={12} weight={500} color={MUTED}>{clockLabel}</Mono>
						<span className="hidden h-3 w-px sm:block" style={{ background: DIVIDER }} />
						<StatusDot color={syncMeta.color} label={syncMeta.label} />
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{onOpenCommandPalette && (
						<button
							type="button"
							onClick={onOpenCommandPalette}
							className="hidden h-9 items-center gap-2 rounded-full border px-3 text-[12.5px] font-medium tracking-[-0.005em] sm:inline-flex active:scale-[0.96]"
							style={{ borderColor: DIVIDER, background: '#ffffff', color: MUTED, fontFamily: FONT, transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease' }}
							onMouseEnter={(e) => (e.currentTarget.style.background = HOVER)}
							onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
						>
							<Icon icon={Search01Icon} size={13} stroke={1.6} />
							Search
							<span className="ml-1 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5" style={{ background: SURFACE }}>
								<Icon icon={CommandIcon} size={10} stroke={1.6} color={MUTED} />
								<Mono size={10} weight={500} color={MUTED}>K</Mono>
							</span>
						</button>
					)}
					<GhostAction
						onClick={onNewNote}
						icon={<Icon icon={Add01Icon} size={14} stroke={1.7} />}
					>
						New
					</GhostAction>
					<PrimaryAction
						onClick={onCreateDailyNote}
						icon={<Icon icon={Calendar01Icon} size={14} stroke={1.7} />}
					>
						Today
					</PrimaryAction>
				</div>
			</div>
		</header>
	);
}

// ─── KPI strip — hairline-divided, no card chrome ────────────────────────────

function KPIStrip({
	noteCount,
	streak,
	totalWords,
	wordsThisWeek,
	notesThisWeek,
	lastEdited,
	onLastEdited,
}: {
	noteCount: number;
	streak: number;
	totalWords: number;
	wordsThisWeek: number;
	notesThisWeek: number;
	lastEdited: NoteFile | null;
	onLastEdited?: () => void;
}) {
	const cells = [
		{
			label: 'Notes total',
			value: compactNumber(noteCount),
			delta: notesThisWeek,
			deltaLabel: 'this week',
		},
		{
			label: 'Streak',
			value: String(streak),
			suffix: streak === 1 ? 'day' : 'days',
		},
		{
			label: 'Words written',
			value: compactNumber(totalWords),
			delta: wordsThisWeek,
			deltaLabel: 'this week',
			deltaFormat: compactNumber,
		},
		{
			label: 'Last edited',
			value: lastEdited ? formatRelativeTime(new Date(lastEdited.updatedAt || lastEdited.createdAt)) : '—',
			meta: lastEdited ? getNoteDisplayTitle(lastEdited) : 'No notes yet',
			onClick: lastEdited ? onLastEdited : undefined,
		},
	] as const;

	return (
		<section
			className="w-full"
			style={{ background: '#ffffff', borderBottom: `1px solid ${DIVIDER}` }}
		>
			<div
				className="mx-auto grid w-full max-w-[1320px] grid-cols-2 lg:grid-cols-4"
				style={{ borderLeft: `1px solid ${DIVIDER}` }}
			>
				{cells.map((c, i) => {
					const isClickable = 'onClick' in c && typeof c.onClick === 'function';
					const inner = (
						<div className="px-6 py-5 sm:px-8">
							<Eyebrow>{c.label}</Eyebrow>
							<div className="mt-2.5 flex items-baseline gap-2">
								<span
									className="text-[28px] leading-none tracking-[-0.025em] tabular-nums sm:text-[32px]"
									style={{ fontFamily: FONT_MONO, fontWeight: 400, color: INK }}
								>
									{c.value}
								</span>
								{'suffix' in c && c.suffix && (
									<span className="text-[12px] font-medium" style={{ color: MUTED, fontFamily: FONT }}>
										{c.suffix}
									</span>
								)}
							</div>
							{'delta' in c && typeof c.delta === 'number' && c.delta > 0 && (
								<div className="mt-2 flex items-center gap-1">
									<span
										className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
										style={{ background: 'rgba(30,142,62,0.10)', color: GREEN }}
									>
										<Icon icon={ArrowUp01Icon} size={10} stroke={2} />
										<Mono size={10.5} weight={600} color={GREEN}>
											{('deltaFormat' in c ? c.deltaFormat!(c.delta) : String(c.delta))}
										</Mono>
									</span>
									<span className="text-[11px]" style={{ color: MUTED, fontFamily: FONT }}>
										{c.deltaLabel}
									</span>
								</div>
							)}
							{'delta' in c && typeof c.delta === 'number' && c.delta === 0 && (
								<div className="mt-2 flex items-center gap-1">
									<span
										className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
										style={{ background: SURFACE, color: MUTED }}
									>
										<Icon icon={ArrowDown01Icon} size={10} stroke={2} />
										<Mono size={10.5} weight={600} color={MUTED}>0</Mono>
									</span>
									<span className="text-[11px]" style={{ color: MUTED, fontFamily: FONT }}>
										{c.deltaLabel}
									</span>
								</div>
							)}
							{'meta' in c && c.meta && (
								<p
									className="mt-2 truncate text-[12px]"
									style={{ color: MUTED, fontFamily: FONT }}
								>
									{c.meta}
								</p>
							)}
						</div>
					);
					return (
						<div
							key={c.label}
							style={{
								borderRight: `1px solid ${DIVIDER}`,
								borderBottom: i < 2 ? `1px solid ${DIVIDER}` : undefined,
							}}
							className={`relative ${i >= 2 ? 'lg:border-b-0' : 'lg:border-b-0'}`}
						>
							{isClickable ? (
								<button
									type="button"
									onClick={c.onClick}
									className="block w-full text-left active:scale-[0.99]"
									style={{ transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1)' }}
									onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
									onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
								>
									{inner}
								</button>
							) : (
								inner
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
}

// ─── Activity sparkline ──────────────────────────────────────────────────────

const ActivityChart = memo(function ActivityChart({
	data,
	avg,
	totalWords,
}: {
	data: { day: string; words: number }[];
	avg: number;
	totalWords: number;
}) {
	const max = Math.max(...data.map((d) => d.words), 1);
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-end justify-between gap-4">
				<div>
					<Eyebrow>Activity · 14 days</Eyebrow>
					<div className="mt-2 flex items-baseline gap-3">
						<Mono size={28} weight={400} color={INK}>{compactNumber(totalWords)}</Mono>
						<span className="text-[12px]" style={{ color: MUTED, fontFamily: FONT }}>words</span>
					</div>
				</div>
				<div className="text-right">
					<Eyebrow>Avg/day</Eyebrow>
					<div className="mt-2">
						<Mono size={18} weight={500} color={INK_SOFT}>{compactNumber(avg)}</Mono>
					</div>
				</div>
			</div>

			<div className="mt-5 h-[120px] flex-1">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
						<defs>
							<linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
								<stop offset="100%" stopColor={BLUE} stopOpacity={0} />
							</linearGradient>
						</defs>
						<Tooltip
							cursor={{ stroke: DIVIDER, strokeWidth: 1 }}
							contentStyle={{
								background: '#ffffff',
								border: `1px solid ${DIVIDER}`,
								borderRadius: 8,
								boxShadow: '0 8px 20px -10px rgba(0,0,0,0.1)',
								fontFamily: FONT,
								fontSize: 12,
								padding: '6px 10px',
							}}
							labelStyle={{ color: MUTED, fontWeight: 500, fontSize: 11 }}
							itemStyle={{ color: INK, fontFamily: FONT_MONO, fontSize: 12 }}
							formatter={(v) => [`${v ?? 0} words`, ''] as [string, string]}
						/>
						<Line
							type="monotone"
							dataKey="words"
							stroke={BLUE}
							strokeWidth={1.75}
							dot={false}
							activeDot={{ r: 3, fill: BLUE, stroke: '#fff', strokeWidth: 2 }}
							fill="url(#activityFill)"
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>

			{/* Bar legend below */}
			<div className="mt-3 flex h-2 w-full overflow-hidden rounded-full" style={{ background: SURFACE }}>
				{data.map((d, i) => (
					<div
						key={i}
						className="h-full"
						style={{
							flex: 1,
							background: d.words > 0 ? BLUE : 'transparent',
							opacity: d.words > 0 ? 0.25 + (d.words / max) * 0.65 : 0,
							marginRight: i < data.length - 1 ? 1 : 0,
						}}
					/>
				))}
			</div>
		</div>
	);
});

// ─── Continue panel — last edited prominent ──────────────────────────────────

function ContinuePanel({
	note,
	onOpen,
}: {
	note: NoteFile | null;
	onOpen: (id: string) => void;
}) {
	if (!note) {
		return (
			<div className="flex h-full flex-col">
				<Eyebrow>Continue</Eyebrow>
				<div className="mt-4 flex flex-1 flex-col items-start justify-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: BLUE_TINT, color: BLUE }}>
						<Icon icon={NoteIcon} size={16} stroke={1.6} />
					</div>
					<p
						className="text-[16px] leading-[1.3] tracking-[-0.01em]"
						style={{ fontFamily: FONT, fontWeight: 500, color: INK }}
					>
						Nothing pending.
					</p>
					<p className="text-[13px]" style={{ color: MUTED, fontFamily: FONT }}>
						Start a note and we&apos;ll pick it up here next time.
					</p>
				</div>
			</div>
		);
	}

	const updated = formatRelativeTime(new Date(note.updatedAt || note.createdAt));
	const wordCount = countBodyWords(note.content);
	const preview = (note.content ?? '')
		.replace(/```[\s\S]*?```/g, '')
		.replace(/[#*_>`~]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 240);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between gap-3">
				<Eyebrow>Continue writing</Eyebrow>
				<Mono size={11} weight={500} color={MUTED}>{wordCount} w</Mono>
			</div>
			<button
				type="button"
				onClick={() => onOpen(note.id)}
				className="mt-3 flex flex-1 flex-col text-left group active:scale-[0.99]"
				style={{ transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)' }}
			>
				<p
					className="text-[22px] leading-[1.18] tracking-[-0.018em] sm:text-[26px]"
					style={{ fontFamily: FONT, fontWeight: 500, color: INK }}
				>
					{getNoteDisplayTitle(note)}
				</p>
				<p
					className="mt-3 line-clamp-3 text-[13.5px] leading-[1.55]"
					style={{ color: INK_SOFT, fontFamily: FONT }}
				>
					{preview || 'Empty page — start typing where you left off.'}
				</p>
				<div
					className="mt-auto flex items-center justify-between pt-5"
				>
					<div className="flex items-center gap-3">
						<Mono size={11} weight={500} color={MUTED}>{updated}</Mono>
						{isPinned(note) && (
							<span className="inline-flex items-center gap-1" style={{ color: BLUE }}>
								<Icon icon={PinIcon} size={10} stroke={2} />
								<Mono size={10.5} weight={600} color={BLUE}>PINNED</Mono>
							</span>
						)}
					</div>
					<span
						className="inline-flex items-center gap-1.5 text-[13px] font-medium"
						style={{ color: BLUE, fontFamily: FONT }}
					>
						Resume
						<svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="transition-transform duration-200 group-hover:translate-x-0.5" style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
							<path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</span>
				</div>
			</button>
		</div>
	);
}

// ─── Pinned column ───────────────────────────────────────────────────────────

function PinnedColumn({
	notes,
	onSelect,
}: {
	notes: NoteFile[];
	onSelect: (id: string) => void;
}) {
	if (notes.length === 0) {
		return (
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between">
					<Eyebrow>Pinned</Eyebrow>
					<Mono size={11} weight={500} color={MUTED}>00</Mono>
				</div>
				<div className="mt-4 flex flex-1 items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: SURFACE, color: SUBTLE }}>
							<Icon icon={PinIcon} size={14} stroke={1.6} />
						</div>
						<p className="text-[13px]" style={{ color: MUTED, fontFamily: FONT }}>
							Pin a note to keep it here.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between">
				<Eyebrow>Pinned</Eyebrow>
				<Mono size={11} weight={500} color={MUTED}>{String(notes.length).padStart(2, '0')}</Mono>
			</div>
			<ul className="mt-3 flex-1">
				{notes.map((note, i) => (
					<li key={note.id}>
						<button
							type="button"
							onClick={() => onSelect(note.id)}
							className="group flex w-full items-center gap-3 py-2.5 text-left active:opacity-70"
							style={{ borderTop: i === 0 ? 'none' : `1px solid ${DIVIDER}`, transition: 'background-color 120ms ease, opacity 100ms ease' }}
							onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
							onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
						>
							<span
								className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
								style={{ background: BLUE_TINT, color: BLUE }}
							>
								<Icon icon={PinIcon} size={11} stroke={2} />
							</span>
							<span
								className="flex-1 truncate text-[13.5px] transition-colors duration-150 group-hover:text-[#1a73e8]"
								style={{ color: INK, fontFamily: FONT, fontWeight: 500 }}
							>
								{getNoteDisplayTitle(note)}
							</span>
							<Mono size={11} weight={500} color={MUTED}>
								{formatRelativeTime(new Date(note.updatedAt || note.createdAt))}
							</Mono>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

// ─── Recent table ────────────────────────────────────────────────────────────

function RecentTable({
	notes,
	onSelect,
	hoveredId,
	onHover,
	onLeave,
}: {
	notes: NoteFile[];
	onSelect: (id: string) => void;
	hoveredId: string | null;
	onHover: (id: string) => void;
	onLeave: () => void;
}) {
	const [filter, setFilter] = useState<'all' | 'pinned' | 'untagged'>('all');

	const filtered = useMemo(() => {
		if (filter === 'pinned') return notes.filter(isPinned);
		if (filter === 'untagged') return notes.filter((n) => !n.tags || n.tags.length === 0);
		return notes;
	}, [notes, filter]);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Eyebrow>Recent</Eyebrow>
					<Mono size={11} weight={500} color={MUTED}>{String(filtered.length).padStart(2, '0')}</Mono>
				</div>
				{/* Segmented filter */}
				<div
					className="inline-flex h-7 items-center rounded-full p-0.5"
					style={{ background: SURFACE }}
				>
					{(['all', 'pinned', 'untagged'] as const).map((f) => (
						<button
							key={f}
							type="button"
							onClick={() => setFilter(f)}
							className="inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors duration-150"
							style={{
								background: filter === f ? '#ffffff' : 'transparent',
								color: filter === f ? INK : MUTED,
								boxShadow: filter === f ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
								fontFamily: FONT,
							}}
						>
							{f}
						</button>
					))}
				</div>
			</div>

			{/* Column header */}
			<div
				className="mt-4 grid grid-cols-[2.5rem_minmax(0,1fr)_5rem_4.5rem] items-center gap-3 pb-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_6rem_5rem_4rem]"
				style={{ borderBottom: `1px solid ${DIVIDER}` }}
			>
				<Eyebrow>#</Eyebrow>
				<Eyebrow>Title</Eyebrow>
				<span className="hidden sm:block"><Eyebrow>Words</Eyebrow></span>
				<Eyebrow>Updated</Eyebrow>
				<Eyebrow>&nbsp;</Eyebrow>
			</div>

			{/* Rows */}
			{filtered.length === 0 ? (
				<div className="flex flex-1 items-center justify-center py-10">
					<p className="text-[13px]" style={{ color: MUTED, fontFamily: FONT }}>No notes match this filter.</p>
				</div>
			) : (
				<ul className="flex-1">
					{filtered.map((note, i) => {
						const wordCount = countBodyWords(note.content);
						const updated = formatRelativeTime(new Date(note.updatedAt || note.createdAt));
						const isHover = hoveredId === note.id;
						const pinned = isPinned(note);
						return (
							<li key={note.id}>
								<button
									type="button"
									onClick={() => onSelect(note.id)}
									onMouseEnter={() => onHover(note.id)}
									onMouseLeave={onLeave}
									className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_5rem_4.5rem] items-center gap-3 py-3 text-left sm:grid-cols-[2.5rem_minmax(0,1fr)_6rem_5rem_4rem] active:opacity-70"
									style={{
										borderBottom: `1px solid ${DIVIDER}`,
										background: isHover ? SURFACE : 'transparent',
										transition: 'background-color 120ms ease, opacity 100ms ease',
									}}
								>
									<Mono size={11} weight={500} color={SUBTLE}>{String(i + 1).padStart(2, '0')}</Mono>
									<span className="flex min-w-0 items-center gap-2.5">
										{pinned && (
											<span style={{ color: BLUE }} className="shrink-0">
												<Icon icon={PinIcon} size={10} stroke={2} />
											</span>
										)}
										<span
											className="truncate text-[14px] tracking-[-0.005em]"
											style={{ color: INK, fontFamily: FONT, fontWeight: 500 }}
										>
											{getNoteDisplayTitle(note)}
										</span>
										{note.tags && note.tags.length > 0 && (
											<span
												className="hidden items-center gap-1 rounded-full px-1.5 py-0.5 sm:inline-flex"
												style={{ background: SURFACE, color: MUTED }}
											>
												<Icon icon={Tag01Icon} size={9} stroke={1.6} />
												<Mono size={10} weight={500} color={MUTED}>{note.tags.length}</Mono>
											</span>
										)}
									</span>
									<span className="hidden sm:block">
										<Mono size={12} weight={500} color={INK_SOFT}>{wordCount}</Mono>
									</span>
									<Mono size={11.5} weight={500} color={MUTED}>{updated}</Mono>
									<span className="flex justify-end">
										<svg
											width="13"
											height="13"
											viewBox="0 0 14 14"
											fill="none"
											className="transition-transform duration-150"
											style={{
												color: isHover ? BLUE : SUBTLE,
												transform: isHover ? 'translateX(2px)' : 'translateX(0)',
											}}
										>
											<path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

// ─── Quick actions / shortcuts column ────────────────────────────────────────

function ShortcutsColumn({
	onNewNote,
	onCreateDailyNote,
	onOpenCommandPalette,
}: {
	onNewNote: () => void;
	onCreateDailyNote: () => void;
	onOpenCommandPalette?: () => void;
}) {
	const items = [
		{ label: 'New note',       hint: 'N',   onClick: onNewNote,           icon: Add01Icon },
		{ label: "Today's entry",  hint: 'D',   onClick: onCreateDailyNote,   icon: Calendar01Icon },
		{ label: 'Command palette', hint: '⌘K', onClick: onOpenCommandPalette, icon: CommandIcon, disabled: !onOpenCommandPalette },
		{ label: 'Export markdown', hint: 'E',   icon: FileExportIcon, disabled: true },
	];
	return (
		<div className="flex h-full flex-col">
			<Eyebrow>Shortcuts</Eyebrow>
			<ul className="mt-3 flex-1">
				{items.map((it, i) => (
					<li key={it.label}>
						<button
							type="button"
							onClick={it.onClick}
							disabled={it.disabled}
							className="group flex w-full items-center gap-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50 active:opacity-70"
							style={{ borderTop: i === 0 ? 'none' : `1px solid ${DIVIDER}`, transition: 'background-color 120ms ease, opacity 100ms ease' }}
							onMouseEnter={(e) => !it.disabled && (e.currentTarget.style.background = SURFACE)}
							onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
						>
							<span
								className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150 group-hover:bg-[var(--accent-soft)]"
								style={{ background: SURFACE, color: INK }}
							>
								<Icon icon={it.icon} size={13} stroke={1.7} />
							</span>
							<span
								className="flex-1 text-[13px] tracking-[-0.005em] transition-colors duration-150 group-hover:text-[#1a73e8]"
								style={{ color: INK, fontFamily: FONT, fontWeight: 500 }}
							>
								{it.label}
							</span>
							<span
								className="rounded px-1.5 py-0.5"
								style={{ background: SURFACE }}
							>
								<Mono size={10.5} weight={600} color={MUTED}>{it.hint}</Mono>
							</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

// ─── Bento panel wrapper — hairline-bordered, consistent padding ─────────────

function BentoPanel({
	children,
	className = '',
	span = '',
}: {
	children: React.ReactNode;
	className?: string;
	span?: string;
}) {
	return (
		<div
			className={`flex flex-col rounded-[14px] p-5 sm:p-6 ${span} ${className}`}
			style={{
				background: '#ffffff',
				border: `1px solid ${DIVIDER}`,
			}}
		>
			{children}
		</div>
	);
}

// ─── Empty state inline ──────────────────────────────────────────────────────

function EmptyDashboard({ onNewNote }: { onNewNote: () => void }) {
	return (
		<div
			className="mx-6 my-8 flex flex-col items-start gap-4 rounded-[14px] p-8 sm:mx-8"
			style={{ background: SURFACE, border: `1px solid ${DIVIDER}` }}
		>
			<div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: BLUE_TINT, color: BLUE }}>
				<Icon icon={BookOpen01Icon} size={18} stroke={1.6} />
			</div>
			<div>
				<Eyebrow>Get started</Eyebrow>
				<h2
					className="mt-2 text-[24px] leading-[1.2] tracking-[-0.018em]"
					style={{ fontFamily: FONT, fontWeight: 500, color: INK }}
				>
					Your dashboard is empty.
				</h2>
				<p className="mt-2 max-w-[440px] text-[13.5px] leading-[1.55]" style={{ color: MUTED, fontFamily: FONT }}>
					Create a note to start tracking your writing. Stats, activity, and recent files will populate here as you go.
				</p>
			</div>
			<PrimaryAction
				onClick={onNewNote}
				icon={<Icon icon={Add01Icon} size={14} stroke={1.7} />}
			>
				New note
			</PrimaryAction>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomeScreen({
	notes,
	onNewNote,
	onCreateDailyNote,
	onSelectNote,
	theme,
	onSetTheme,
	accentId,
	onAccentChange,
	sidebarCollapsed,
	onToggleSidebar,
	onOpenCommandPalette,
	onOpenAuthModal,
	syncing,
	syncStatus,
	onSync,
	fontId,
	onFontChange,
}: HomeScreenProps) {
	const { user } = useAuth();
	const [profileOpen, setProfileOpen] = useState(false);
	const profileAnchorRef = useRef<HTMLDivElement>(null);
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	const fileNotes = useMemo(
		() => notes.filter((n): n is NoteFile => n.type === 'file' && !n.deletedAt),
		[notes],
	);
	const userNotes = useMemo(
		() => fileNotes.filter((note) => !isStarterNote(note)),
		[fileNotes],
	);
	const isGettingStarted = userNotes.length === 0;

	const sortedRecent = useMemo(() => [...fileNotes].sort(compareRecentNotes), [fileNotes]);
	const pinnedNotes = useMemo(() => sortedRecent.filter(isPinned).slice(0, 5), [sortedRecent]);
	const recentNotes = useMemo(() => sortedRecent.slice(0, 12), [sortedRecent]);
	const lastEdited = sortedRecent[0] ?? null;

	// Stats
	const { streak, totalWords, wordsThisWeek, notesThisWeek, sparklineData } = useMemo(() => {
		const today = startOfDay(new Date());
		const sortedNotes = [...userNotes].sort(
			(a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
		);

		// Streak
		let streakCount = 0;
		const cur = new Date(today);
		for (let i = 0; i < 365; i++) {
			const dayStart = new Date(cur);
			const dayEnd = new Date(cur);
			dayEnd.setHours(23, 59, 59, 999);
			const has = sortedNotes.some((n) => {
				const d = new Date(n.updatedAt || n.createdAt);
				return d >= dayStart && d <= dayEnd;
			});
			if (has) {
				streakCount++;
				cur.setDate(cur.getDate() - 1);
			} else break;
		}

		const total = sortedNotes.reduce((s, n) => s + countBodyWords(n.content), 0);

		// 14-day sparkline + weekly deltas
		const sparkline: { day: string; words: number }[] = [];
		let weekWords = 0;
		let weekNotes = 0;
		for (let i = 13; i >= 0; i--) {
			const day = new Date(today);
			day.setDate(today.getDate() - i);
			const dayEnd = new Date(day);
			dayEnd.setHours(23, 59, 59, 999);
			const dayNotes = sortedNotes.filter((n) => {
				const d = new Date(n.updatedAt || n.createdAt);
				return d >= day && d <= dayEnd;
			});
			const dayWords = dayNotes.reduce((s, n) => s + countBodyWords(n.content), 0);
			const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			sparkline.push({ day: label, words: dayWords });
			if (i < 7) {
				weekWords += dayWords;
				weekNotes += dayNotes.length;
			}
		}

		return {
			streak: streakCount,
			totalWords: total,
			wordsThisWeek: weekWords,
			notesThisWeek: weekNotes,
			sparklineData: sparkline,
		};
	}, [userNotes]);

	const previewNote = useMemo(() => {
		if (hoveredId) return fileNotes.find((n) => n.id === hoveredId) ?? null;
		return lastEdited;
	}, [hoveredId, fileNotes, lastEdited]);

	const today = new Date();
	const dateLabel = today.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	});
	const clockLabel = today.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});

	const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
	const greeting = (() => {
		const hour = today.getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	})();

	const sparklineAvg = sparklineData.length
		? Math.round(sparklineData.reduce((s, d) => s + d.words, 0) / sparklineData.length)
		: 0;
	const sparklineTotal = sparklineData.reduce((s, d) => s + d.words, 0);

	return (
		<div className="flex flex-1 min-w-0 flex-col overflow-hidden" style={GS_SCOPE}>
			{/* Top utility bar — sidebar/settings/profile only */}
			<div
				className="flex items-center justify-between px-4 py-2"
				style={{ borderBottom: `1px solid ${DIVIDER}`, background: '#ffffff' }}
			>
				{sidebarCollapsed ? (
					<button
						type="button"
						onClick={onToggleSidebar}
						className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f1f3f4] active:scale-[0.90]"
						style={{ color: MUTED, transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease' }}
						title="Toggle sidebar"
						aria-label="Toggle sidebar"
					>
						<Icon icon={SidebarLeftIcon} size={18} strokeWidth={1.6} />
					</button>
				) : (
					<div className="w-9" />
				)}

				<div className="ml-auto flex items-center gap-1.5 pr-1">
					<SettingsMenu
						theme={theme}
						onSetTheme={onSetTheme}
						accentId={accentId}
						onAccentChange={onAccentChange}
						syncing={syncing}
						syncStatus={syncStatus}
						onSync={onSync}
						fontId={fontId}
						onFontChange={onFontChange}
						className="!block"
					/>
					{user ? (
						<div ref={profileAnchorRef} className="relative">
							<button
								type="button"
								onClick={() => setProfileOpen((v) => !v)}
								className="inline-flex h-9 items-center gap-2 rounded-full px-2 hover:bg-[#f1f3f4] active:scale-[0.96]"
								style={{ color: INK, fontFamily: FONT, transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease' }}
								title="Profile"
								aria-expanded={profileOpen}
							>
								<div
									className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold"
									style={{ background: BLUE, color: '#ffffff' }}
								>
									{user.user_metadata?.avatar_url ? (
										<img src={user.user_metadata.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
									) : (
										user.email?.[0]?.toUpperCase() || '?'
									)}
								</div>
								<span className="hidden max-w-[120px] truncate text-[12.5px] font-medium min-[400px]:inline">
									{user.user_metadata?.display_name || user.email?.split('@')[0]}
								</span>
							</button>
							<AnimatePresence>
								{profileOpen && (
									<ProfilePanel onClose={() => setProfileOpen(false)} />
								)}
							</AnimatePresence>
						</div>
					) : (
						<button
							type="button"
							onClick={onOpenAuthModal}
							className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium active:scale-[0.96]"
							style={{ background: BLUE, color: '#ffffff', fontFamily: FONT, transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease' }}
							onMouseEnter={(e) => (e.currentTarget.style.background = '#1765cc')}
							onMouseLeave={(e) => (e.currentTarget.style.background = BLUE)}
						>
							<Icon icon={CloudUploadIcon} size={13} strokeWidth={1.6} />
							<span className="hidden min-[400px]:inline">Sign in</span>
						</button>
					)}
				</div>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto" style={{ background: '#ffffff' }}>
				<DashboardHeader
					greeting={greeting}
					displayName={displayName}
					dateLabel={dateLabel}
					clockLabel={clockLabel}
					syncing={syncing}
					syncStatus={syncStatus}
					onCreateDailyNote={onCreateDailyNote}
					onNewNote={onNewNote}
					onOpenCommandPalette={onOpenCommandPalette}
				/>

				<KPIStrip
					noteCount={userNotes.length}
					streak={streak}
					totalWords={totalWords}
					wordsThisWeek={wordsThisWeek}
					notesThisWeek={notesThisWeek}
					lastEdited={lastEdited}
					onLastEdited={lastEdited ? () => onSelectNote(lastEdited.id) : undefined}
				/>

				{isGettingStarted ? (
					<EmptyDashboard onNewNote={onNewNote} />
				) : (
					<div className="mx-auto w-full max-w-[1320px] px-6 pb-12 pt-6 sm:px-8">
						{/* Bento Row 1 — Continue (7) + Activity (5) */}
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
							<BentoPanel span="lg:col-span-7 min-h-[260px]">
								<ContinuePanel note={previewNote ?? lastEdited} onOpen={onSelectNote} />
							</BentoPanel>
							<BentoPanel span="lg:col-span-5 min-h-[260px]">
								<ActivityChart
									data={sparklineData}
									avg={sparklineAvg}
									totalWords={sparklineTotal}
								/>
							</BentoPanel>
						</div>

						{/* Bento Row 2 — Pinned (4) + Recent (5) + Shortcuts (3) */}
						<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
							<BentoPanel span="lg:col-span-4 min-h-[320px]">
								<PinnedColumn notes={pinnedNotes} onSelect={onSelectNote} />
							</BentoPanel>
							<BentoPanel span="lg:col-span-5 min-h-[320px]">
								<RecentTable
									notes={recentNotes}
									onSelect={onSelectNote}
									hoveredId={hoveredId}
									onHover={setHoveredId}
									onLeave={() => setHoveredId(null)}
								/>
							</BentoPanel>
							<BentoPanel span="lg:col-span-3 min-h-[320px]">
								<ShortcutsColumn
									onNewNote={onNewNote}
									onCreateDailyNote={onCreateDailyNote}
									onOpenCommandPalette={onOpenCommandPalette}
								/>
							</BentoPanel>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
