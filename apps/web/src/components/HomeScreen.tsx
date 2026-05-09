import { useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
	SidebarLeftIcon,
	Add01Icon,
	CloudUploadIcon,
	Calendar01Icon,
	ArrowRight01Icon,
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

function compactNumber(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
	return String(n);
}

function isPinned(note: NoteFile): boolean {
	return Array.isArray(note.tags) && note.tags.some((t) => t === 'favorite' || t === 'pinned');
}

function CompactHeroPanel({
	dayOfWeek,
	dateLabel,
	isGettingStarted,
	noteCount,
	streak,
	totalWords,
	onNewNote,
	onCreateDailyNote,
	greeting,
	displayName,
}: {
	dayOfWeek: string;
	dateLabel: string;
	isGettingStarted: boolean;
	noteCount: number;
	streak: number;
	totalWords: number;
	onNewNote: () => void;
	onCreateDailyNote: () => void;
	greeting: string;
	displayName: string;
}) {
	return (
		<section className="home-section-in border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 sm:px-6 pt-7 pb-8">
			{/* Eyebrow date with live dot */}
			<div className="flex items-center gap-2 mb-3">
				<span
					aria-hidden
					className="home-pulse-dot inline-block w-1.5 h-1.5 rounded-full"
					style={{ background: 'var(--accent)' }}
				/>
				<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
					{dayOfWeek} <span className="opacity-50 mx-0.5">·</span> {dateLabel}
				</p>
			</div>

			{/* Greeting */}
			<h1 className="font-[var(--font-prose)] font-extralight text-[26px] min-[400px]:text-[28px] sm:text-[32px] leading-[1.1] tracking-[-0.025em] text-[var(--ink)]">
				{greeting}
				{displayName && (
					<>
						<span className="text-[var(--text-muted)]">,</span>{' '}
						<span className="font-normal italic" style={{ color: 'var(--accent)' }}>
							{displayName}
						</span>
					</>
				)}
				<span className="text-[var(--accent)] font-light">.</span>
			</h1>

			{/* Stats row OR getting-started */}
			{isGettingStarted ? (
				<p className="mt-5 font-[var(--font-prose)] text-[14px] leading-relaxed text-[var(--text-secondary)] max-w-[42ch]">
					Start with a fresh note or capture today&apos;s entry. Your writing stats appear once you have notes of your own.
				</p>
			) : (
				<div className="mt-6 flex items-end gap-5 sm:gap-7">
					<MobileStat label="Notes" value={compactNumber(noteCount)} />
					<span className="h-7 w-px bg-[var(--border-subtle)]" aria-hidden />
					<MobileStat label="Streak" value={String(streak)} />
					<span className="h-7 w-px bg-[var(--border-subtle)]" aria-hidden />
					<MobileStat label="Words" value={compactNumber(totalWords)} />
				</div>
			)}

			{/* Action pills */}
			<div className="mt-6 flex flex-wrap items-center gap-2.5">
				<button
					type="button"
					onClick={onCreateDailyNote}
					className="home-tactile inline-flex items-center justify-center gap-2 h-10 px-4 sm:px-5 rounded-full bg-[var(--ink)] text-[var(--bg-primary)] font-[var(--font-prose)] text-[13px] font-medium tracking-[0.01em] hover:bg-[var(--ink-soft)]"
				>
					<Icon icon={Calendar01Icon} size={13} strokeWidth={2} />
					Today&apos;s entry
				</button>
				<button
					type="button"
					onClick={onNewNote}
					className="home-tactile inline-flex items-center justify-center gap-2 h-10 px-4 sm:px-5 rounded-full border border-[var(--border-subtle)] bg-transparent text-[var(--ink)] font-[var(--font-prose)] text-[13px] font-medium tracking-[0.01em] hover:bg-[var(--bg-surface)] hover:border-[var(--ink-soft)]"
				>
					<Icon icon={Add01Icon} size={13} strokeWidth={2} />
					New note
				</button>
			</div>
		</section>
	);
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="font-mono font-light text-[32px] leading-none tracking-[-0.04em] text-[var(--ink)] tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {label}
      </span>
    </div>
  );
}


function CompactEmptyState({ onNewNote }: { onNewNote: () => void }) {
	return (
		<section className="home-section-in px-5 sm:px-6 py-14 flex flex-col items-start">
			<div className="flex items-center gap-2 mb-4">
				<span aria-hidden className="inline-block w-1 h-1 rounded-full bg-[var(--accent)]" />
				<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
					Empty
				</span>
			</div>
			<h2 className="font-[var(--font-prose)] font-extralight text-[28px] leading-[1.1] tracking-[-0.02em] text-[var(--ink)]">
				Start here<span className="text-[var(--accent)]">.</span>
			</h2>
			<p className="mt-4 max-w-[36ch] font-[var(--font-prose)] text-[14px] leading-relaxed text-[var(--text-secondary)]">
				Create your first note. It&apos;ll show up in your queue.
			</p>
			<button
				type="button"
				onClick={onNewNote}
				className="home-tactile mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[var(--ink)] text-[var(--bg-primary)] font-[var(--font-prose)] text-[13px] font-medium tracking-[0.01em] hover:bg-[var(--ink-soft)]"
			>
				<Icon icon={Add01Icon} size={14} strokeWidth={2} />
				New note
			</button>
		</section>
	);
}

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

	const fileNotes = useMemo(
		() => notes.filter((n): n is NoteFile => n.type === 'file' && !n.deletedAt),
		[notes],
	);
	const userNotes = useMemo(
		() => fileNotes.filter((note) => !isStarterNote(note)),
		[fileNotes],
	);
	const isGettingStarted = userNotes.length === 0;

	const { streak, totalWords } = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const sortedNotes = [...userNotes].sort(
			(a, b) =>
				new Date(b.updatedAt || b.createdAt).getTime() -
				new Date(a.updatedAt || a.createdAt).getTime(),
		);

		let streakCount = 0;
		const currentDate = new Date(today);

		for (let i = 0; i < 365; i++) {
			const dayStart = new Date(currentDate);
			const dayEnd = new Date(currentDate);
			dayEnd.setHours(23, 59, 59, 999);

			const hasActivity = sortedNotes.some((note) => {
				const nd = new Date(note.updatedAt || note.createdAt);
				return nd >= dayStart && nd <= dayEnd;
			});

			if (hasActivity) {
				streakCount++;
				currentDate.setDate(currentDate.getDate() - 1);
			} else {
				break;
			}
		}

		const total = sortedNotes.reduce((sum, n) => sum + countBodyWords(n.content), 0);
		return { streak: streakCount, totalWords: total };
	}, [userNotes]);

	const recentAndPinned = useMemo(() => {
		const sorted = [...fileNotes].sort(compareRecentNotes);
		const pinned = sorted.filter((n) => isPinned(n));
		const others = sorted.filter((n) => !isPinned(n));
		return [...pinned, ...others].slice(0, 8);
	}, [fileNotes]);
	const pinnedNotes = useMemo(
		() => recentAndPinned.filter(isPinned),
		[recentAndPinned],
	);
	const recentNotes = useMemo(
		() => recentAndPinned.filter((note) => !isPinned(note)),
		[recentAndPinned],
	);

	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const previewNote = useMemo(() => {
		if (hoveredId) return fileNotes.find((n) => n.id === hoveredId) ?? null;
		return (
			recentNotes.find((note) => !isStarterNote(note)) ??
			pinnedNotes.find((note) => !isStarterNote(note)) ??
			recentNotes[0] ??
			pinnedNotes[0] ??
			null
		);
	}, [hoveredId, fileNotes, recentNotes, pinnedNotes]);

	const today = new Date();
	const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
	const dayNumber = String(today.getDate()).padStart(2, '0');
	const monthYear = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
	const dateLabel = today.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

	const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
	const greeting = (() => {
		const hour = today.getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	})();

	return (
		<div className="flex flex-1 min-w-0 flex-col bg-[var(--bg-primary)] overflow-hidden">
			{/* ── Top utility bar ── */}
			<div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
				{sidebarCollapsed ? (
					<button
						type="button"
						onClick={onToggleSidebar}
						className="btn-cell"
						title="Toggle sidebar"
						aria-label="Toggle sidebar"
					>
						<Icon icon={SidebarLeftIcon} size={16} strokeWidth={1.5} />
					</button>
				) : (
					<div className="w-9" />
				)}

				<div className="ml-auto flex items-center gap-2 pr-1">
					{/* Settings pill */}
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

					{/* User pill / Sign in pill */}
					{user ? (
						<div ref={profileAnchorRef} className="relative">
							<button
								type="button"
								onClick={() => setProfileOpen((v) => !v)}
								className="btn-pill gap-2"
								title="Profile"
								aria-expanded={profileOpen}
							>
								<div className="flex items-center justify-center w-5 h-5 bg-[var(--accent)] text-[var(--accent-text)] text-[10px] font-bold flex-shrink-0 overflow-hidden" style={{ borderRadius: '50%' }}>
									{user.user_metadata?.avatar_url ? (
										<img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
									) : (
										user.email?.[0]?.toUpperCase() || '?'
									)}
								</div>
								<span className="hidden max-w-[96px] truncate min-[400px]:inline">
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
							className="btn-pill btn-pill-accent"
							title="Sign in to sync your notes"
						>
							<Icon icon={CloudUploadIcon} size={14} strokeWidth={1.5} />
							<span className="hidden min-[400px]:inline">Sign in</span>
						</button>
					)}
				</div>
			</div>

			<div className="lg:hidden flex-1 overflow-y-auto">
				<CompactHeroPanel
					dayOfWeek={dayOfWeek}
					dateLabel={dateLabel}
					isGettingStarted={isGettingStarted}
					noteCount={userNotes.length}
					streak={streak}
					totalWords={totalWords}
					onNewNote={onNewNote}
					onCreateDailyNote={onCreateDailyNote}
					greeting={greeting}
					displayName={displayName}
				/>

				{recentAndPinned.length > 0 ? (
					<div className="px-7 sm:px-8 py-7">
						{pinnedNotes.length > 0 && (
							<PinnedGridSection
								notes={pinnedNotes}
								onSelectNote={onSelectNote}
								onHoverNote={() => {}}
								onLeaveNote={() => {}}
							/>
						)}
						{recentNotes.length > 0 && (
							<NoteListSection
								label="Recent"
								notes={recentNotes}
								onSelectNote={onSelectNote}
								onHoverNote={() => {}}
								onLeaveNote={() => {}}
								withTopBorder={pinnedNotes.length > 0}
							/>
						)}
					</div>
				) : (
					<CompactEmptyState onNewNote={onNewNote} />
				)}
			</div>

			<div className="hidden lg:flex lg:flex-1 lg:min-h-0 lg:flex-col overflow-y-auto">
				{/* ── Editorial hero: eyebrow → greeting → stats → actions ── */}
				<div className="home-section-in border-b-[1.5px] border-[var(--ink)]">
					<div className="mx-auto w-full max-w-[1180px] px-10 xl:px-14 pt-14 pb-12">
						<div className="grid grid-cols-12 gap-10 items-end">
							{/* Greeting block — left 7 cols */}
							<div className="col-span-12 lg:col-span-7 min-w-0">
								<div className="flex items-center gap-2.5 mb-5">
									<span
										aria-hidden
										className="home-pulse-dot inline-block w-1.5 h-1.5 rounded-full"
										style={{ background: 'var(--accent)' }}
									/>
									<p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
										{dayOfWeek} <span className="text-[var(--text-muted)] opacity-50 mx-0.5">·</span> {dayNumber} {monthYear}
									</p>
								</div>
								<h1 className="font-[var(--font-prose)] font-extralight text-[48px] sm:text-[56px] xl:text-[64px] leading-[1.0] tracking-[-0.03em] text-[var(--ink)]">
									{greeting}
									{displayName && (
										<>
											<span className="text-[var(--text-muted)]">,</span>{' '}
											<span className="font-normal italic" style={{ color: 'var(--accent)' }}>
												{displayName}
											</span>
										</>
									)}
									<span className="text-[var(--accent)] font-light">.</span>
								</h1>
							</div>

							{/* Stats — right 5 cols, airy */}
							{!isGettingStarted && (
								<div className="col-span-12 lg:col-span-5 flex items-end justify-end gap-9">
									<AiryStat label="Notes" value={compactNumber(userNotes.length)} />
									<span className="h-9 w-px bg-[var(--border-subtle)]" aria-hidden />
									<AiryStat label="Streak" value={String(streak)} />
									<span className="h-9 w-px bg-[var(--border-subtle)]" aria-hidden />
									<AiryStat label="Words" value={compactNumber(totalWords)} />
								</div>
							)}
						</div>

						{/* Getting started copy */}
						{isGettingStarted && (
							<p className="mt-6 max-w-[52ch] font-[var(--font-prose)] text-[15px] leading-relaxed text-[var(--text-secondary)]">
								Start with a fresh note or capture today&apos;s entry. Your writing
								stats appear once you have notes of your own.
							</p>
						)}

						{/* Actions — calm pill row */}
						<div className="mt-9 flex items-center gap-3">
							<button
								type="button"
								onClick={onCreateDailyNote}
								className="home-tactile inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[var(--ink)] text-[var(--bg-primary)] font-[var(--font-prose)] text-[13px] font-medium tracking-[0.01em] hover:bg-[var(--ink-soft)]"
							>
								<Icon icon={Calendar01Icon} size={14} strokeWidth={2} />
								Today&apos;s entry
							</button>
							<button
								type="button"
								onClick={onNewNote}
								className="home-tactile inline-flex items-center gap-2 h-10 px-5 rounded-full border border-[var(--border-subtle)] bg-transparent text-[var(--ink)] font-[var(--font-prose)] text-[13px] font-medium tracking-[0.01em] hover:bg-[var(--bg-surface)] hover:border-[var(--ink-soft)]"
							>
								<Icon icon={Add01Icon} size={14} strokeWidth={2} />
								New note
							</button>
						</div>
					</div>
				</div>

				{/* ── Lists / Preview ── */}
				<div className="flex-1 mx-auto w-full max-w-[1180px] px-10 xl:px-14 py-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 xl:gap-14 min-h-0">
					{/* Pinned + Recent list */}
					<div className="flex flex-col min-h-0">
						{recentAndPinned.length === 0 ? (
							<EmptyRecent onNewNote={onNewNote} />
						) : (
							<>
								{pinnedNotes.length > 0 && (
									<PinnedGridSection
										notes={pinnedNotes}
										onSelectNote={onSelectNote}
										onHoverNote={setHoveredId}
										onLeaveNote={() => setHoveredId(null)}
									/>
								)}
								{recentNotes.length > 0 && (
									<NoteListSection
										label="Recent"
										notes={recentNotes}
										onSelectNote={onSelectNote}
										onHoverNote={setHoveredId}
										onLeaveNote={() => setHoveredId(null)}
										withTopBorder={pinnedNotes.length > 0}
									/>
								)}
							</>
						)}
					</div>

					{/* Preview pane */}
					<div className="flex flex-col border-[1.5px] border-[var(--ink)] bg-[var(--bg-surface)] overflow-hidden min-h-0 self-start sticky top-10"> 
						<div className="flex items-center justify-between px-7 py-4 border-b-[1.5px] border-[var(--ink)]">
							<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink)] font-semibold">Preview</span>
							{previewNote && (
								<button
									type="button"
									onClick={() => onSelectNote(previewNote.id)}
									className="home-link-arrow home-tactile font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]"
								>
									Open <Icon icon={ArrowRight01Icon} size={11} strokeWidth={2} />
								</button>
							)}
						</div>

						{previewNote ? (
							<PreviewPane note={previewNote} onOpen={() => onSelectNote(previewNote.id)} />
						) : (
							<EmptyPreview />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function AiryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="font-mono font-light text-[40px] leading-none tracking-[-0.04em] text-[var(--ink)] tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {label}
      </span>
    </div>
  );
}

function PinnedRow({
	note,
	index,
	onSelect,
	onHover,
	onLeave,
}: {
	note: NoteFile;
	index: number;
	onSelect: () => void;
	onHover: () => void;
	onLeave: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			onMouseEnter={onHover}
			onMouseLeave={onLeave}
			style={{ ['--row-index' as string]: index }}
			className="home-row-stagger home-row-tactile group relative flex items-center w-full gap-5 pl-5 pr-4 py-3 -mx-3 text-left rounded-md hover:bg-[var(--bg-hover)] cursor-pointer"
		>
			<span
				aria-hidden
				className="absolute left-1.5 top-2 bottom-2 w-[2px] rounded-full bg-[var(--accent)] opacity-0 scale-y-50 group-hover:opacity-100 group-hover:scale-y-100 transition-all duration-200 origin-center"
			/>
			<span className="font-mono text-[10px] tabular-nums text-[var(--text-muted)] group-hover:text-[var(--accent)] w-6 flex-shrink-0 transition-colors">
				{index.toString().padStart(2, '0')}
			</span>
			<span className="flex-1 font-[var(--font-prose)] text-[15px] leading-snug text-[var(--ink)] group-hover:font-medium truncate transition-all duration-200">
				{getNoteDisplayTitle(note)}
			</span>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] group-hover:text-[var(--ink)] flex-shrink-0 tabular-nums transition-colors">
				{formatRelativeTime(new Date(note.updatedAt || note.createdAt))}
			</span>
		</button>
	);
}

function SectionHeader({
	label,
	count,
}: {
	label: string;
	count: number;
}) {
	return (
		<div className="flex items-baseline gap-3 mb-5">
			<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink)] font-medium">
				{label}
			</span>
			<span className="flex-1 h-px bg-[var(--border-subtle)]" aria-hidden />
			<span className="font-mono text-[10px] tracking-[0.1em] text-[var(--text-muted)] tabular-nums">
				{String(count).padStart(2, '0')}
			</span>
		</div>
	);
}

function PinnedGridSection({
	notes,
	onSelectNote,
	onHoverNote,
	onLeaveNote,
}: {
	notes: NoteFile[];
	onSelectNote: (noteId: string) => void;
	onHoverNote: (noteId: string) => void;
	onLeaveNote: () => void;
	withTopBorder?: boolean;
}) {
	return (
		<section className="home-section-in">
			<SectionHeader label="Pinned" count={notes.length} />
			<div className="flex flex-col">
				{notes.map((note, index) => (
					<PinnedRow
						key={note.id}
						note={note}
						index={index + 1}
						onSelect={() => onSelectNote(note.id)}
						onHover={() => onHoverNote(note.id)}
						onLeave={onLeaveNote}
					/>
				))}
			</div>
		</section>
	);
}

function RecentRow({
	note,
	index,
	onSelect,
	onHover,
	onLeave,
}: {
	note: NoteFile;
	index: number;
	onSelect: () => void;
	onHover: () => void;
	onLeave: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			onMouseEnter={onHover}
			onMouseLeave={onLeave}
			style={{ ['--row-index' as string]: index }}
			className="home-row-stagger home-row-tactile group relative flex items-center w-full gap-4 pl-5 pr-4 py-2.5 -mx-3 text-left rounded-md hover:bg-[var(--bg-hover)]"
		>
			<span
				aria-hidden
				className="absolute left-1.5 top-2 bottom-2 w-[2px] rounded-full bg-[var(--accent)] opacity-0 scale-y-50 group-hover:opacity-100 group-hover:scale-y-100 transition-all duration-200 origin-center"
			/>
			<span className="flex-1 font-[var(--font-prose)] text-[14px] truncate text-[var(--text-secondary)] group-hover:text-[var(--ink)] group-hover:font-medium transition-all duration-200">
				{getNoteDisplayTitle(note)}
			</span>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] group-hover:text-[var(--ink)] flex-shrink-0 tabular-nums transition-colors">
				{formatRelativeTime(new Date(note.updatedAt || note.createdAt))}
			</span>
		</button>
	);
}

function NoteListSection({
	label,
	notes,
	onSelectNote,
	onHoverNote,
	onLeaveNote,
	withTopBorder = false,
}: {
	label: string;
	notes: NoteFile[];
	onSelectNote: (noteId: string) => void;
	onHoverNote: (noteId: string) => void;
	onLeaveNote: () => void;
	withTopBorder?: boolean;
}) {
	return (
		<section
			className={`home-section-in ${
				withTopBorder ? 'mt-10 pt-10 border-t border-[var(--border-subtle)]' : ''
			}`}
		>
			<SectionHeader label={label} count={notes.length} />
			<div className="flex flex-col">
				{notes.map((note, idx) => (
					<RecentRow
						key={note.id}
						note={note}
						index={idx}
						onSelect={() => onSelectNote(note.id)}
						onHover={() => onHoverNote(note.id)}
						onLeave={onLeaveNote}
					/>
				))}
			</div>
		</section>
	);
}

function PreviewPane({ note, onOpen }: { note: NoteFile; onOpen: () => void }) {
	const updated = formatRelativeTime(new Date(note.updatedAt || note.createdAt));
	return (
		<div className="flex-1 overflow-y-auto">
			<button
				type="button"
				onClick={onOpen}
				className="home-section-in block w-full text-left px-7 pt-7 pb-5 transition-colors hover:bg-[var(--bg-hover)]/30"
			>
				<div className="flex items-center gap-2 mb-3">
					<span aria-hidden className="inline-block w-1 h-1 rounded-full bg-[var(--accent)]" />
					<span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
						Updated {updated} ago
					</span>
				</div>
				<div className="font-[var(--font-prose)] font-light text-[24px] leading-[1.2] tracking-[-0.02em] text-[var(--ink)]">
					{getNoteDisplayTitle(note)}
				</div>
			</button>

			<div className="px-7 pb-8">
				{note.content ? (
					<div className="preview-markdown font-[var(--font-prose)] text-[14px] leading-relaxed text-[var(--text-secondary)] space-y-3">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								h1: ({ children }) => <h1 className="mb-3 mt-4 text-[15px] font-semibold text-[var(--ink)]">{children}</h1>,
								h2: ({ children }) => <h2 className="mb-2 mt-3 text-[14px] font-semibold text-[var(--ink)]">{children}</h2>,
								h3: ({ children }) => <h3 className="mb-2 mt-3 text-[13px] font-semibold text-[var(--ink)]">{children}</h3>,
								p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
								ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0 space-y-1">{children}</ul>,
								ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0 space-y-1">{children}</ol>,
								li: ({ children }) => <li className="pl-1">{children}</li>,
								blockquote: ({ children }) => <blockquote className="border-l-2 border-[var(--accent)] pl-3 italic my-2 text-[var(--text-muted)]">{children}</blockquote>,
								a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{children}</a>,
								code: ({ className, children }) =>
									className ? (
										<code className="block bg-[var(--bg-hover)] rounded p-3 overflow-x-auto text-[13px]">{children}</code>
									) : (
										<code className="px-1 py-0.5 bg-[var(--bg-hover)] rounded text-[var(--ink)] text-[13px]">{children}</code>
									),
								pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
							}}
						>
							{note.content}
						</ReactMarkdown>
					</div>
				) : (
					<p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">No content yet.</p>
				)}
			</div>
		</div>
	);
}

function EmptyRecent({ onNewNote }: { onNewNote: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center h-full py-16 px-6 gap-5">
			<p className="font-[var(--font-prose)] text-[15px] text-[var(--text-muted)] text-center max-w-xs leading-relaxed">
				Start a note and it shows up here. Pin one to keep it on top.
			</p>
			<button
				type="button"
				onClick={onNewNote}
				className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[var(--accent)] text-[var(--accent-text)] font-[var(--font-prose)] text-[13px] font-medium tracking-[0.01em] transition-opacity hover:opacity-90"
			>
				<Icon icon={Add01Icon} size={14} strokeWidth={2} />
				New note
			</button>
		</div>
	);
}

function EmptyPreview() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center px-6 gap-2">
			<p className="font-[var(--font-prose)] text-[15px] text-[var(--text-muted)]">No preview</p>
			<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Hover a note to peek inside</p>
		</div>
	);
}
