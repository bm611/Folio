import { lazy, Suspense, useRef, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';

import type { Editor } from '@tiptap/react';
import {
	CloudUploadIcon,
	ArrowLeft01Icon,
	FireIcon,
	File01Icon,
	Home01Icon,
	Folder01Icon,
	ArrowRight01Icon,
	SidebarLeftIcon,
	Share01Icon,
	Copy01Icon,
} from '@hugeicons/core-free-icons';

import Icon from './Icon';
import SettingsMenu from './SettingsMenu';
import ProfilePanel from './ProfilePanel';
import {
	countBodyWords,
	estimateReadTime,
	formatCreatedAt,
} from '../utils/noteMeta';

import { exportNoteAsMarkdown } from '../utils/exportNote';
import TagInput from './TagInput';
import DailyHeader from './DailyHeader';
import type { EditorApi } from './LiveMarkdownEditor';
import MobileEditorToolbar from './MobileEditorToolbar';
import NoteBanner from './NoteBanner';

import type { NoteFile, TreeNode } from '../types';
import { getBreadcrumbPath } from '../utils/tree';
import { createSharedNote, generateSharedNoteUrl } from '../lib/sharedNotes';
import { useAuth } from '../contexts/AuthContext';
import HomeScreen from './HomeScreen';
import type { SaveStatus, SyncStatus } from './noteEditorUtils';
import { formatRelativeSaveTime, getSaveBadgeMeta, getSaveTextClass } from './noteEditorUtils';

const LiveMarkdownEditor = lazy(() =>
	import('./LiveMarkdownEditor').catch(() => {
		window.location.reload();
		return import('./LiveMarkdownEditor');
	})
);

// ─── Material 3 palette — tonal surfaces, expressive typography ──────────────

const GS_SCOPE: CSSProperties = {
	// M3 neutral surface tonal hierarchy (lowest → highest container)
	['--bg-primary' as string]:           '#fdfcfb',  // surface (neutral)
	['--bg-surface' as string]:           '#f6f5f3',  // surface-container-low
	['--bg-elevated' as string]:          '#f1f0ee',  // surface-container
	['--bg-hover' as string]:             '#ebeae8',  // surface-container-high
	['--bg-deep' as string]:              '#e5e4e2',  // surface-container-highest
	// M3 on-surface ink (neutral)
	['--ink' as string]:                  '#1c1b1a',
	['--ink-soft' as string]:             '#48464a',
	['--text-primary' as string]:         '#1c1b1a',  // on-surface
	['--text-secondary' as string]:       '#48464a',  // on-surface-variant
	['--text-muted' as string]:           '#7a7779',  // outline
	['--text-inverse' as string]:         '#f4f1ef',
	['--border-subtle' as string]:        '#cbc7c5',  // outline-variant
	['--border-default' as string]:       '#7a7779',  // outline
	// M3 primary tonal
	['--accent' as string]:               '#6750a4',  // primary
	['--accent-hover' as string]:         '#5b46a0',
	['--accent-text' as string]:          '#ffffff',  // on-primary
	['--accent-soft' as string]:          '#eaddff',  // primary-container
	// M3 secondary / tertiary signals
	['--success' as string]:              '#386a20',
	['--warning' as string]:              '#7d5800',
	['--danger' as string]:               '#b3261e',  // error
	// M3 shape system
	['--m3-shape-xs' as string]:          '4px',
	['--m3-shape-sm' as string]:          '8px',
	['--m3-shape-md' as string]:          '12px',
	['--m3-shape-lg' as string]:          '16px',
	['--m3-shape-xl' as string]:          '28px',
	['--m3-shape-full' as string]:        '9999px',
	background: '#fdfcfb',
	color: '#1c1b1a',
	fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
};

const FONT = '"Poppins", system-ui, -apple-system, sans-serif';
const MUTED = '#48464a';
const DIVIDER = '#cbc7c5';
// M3 neutral surface-container with translucency for top app bar
const M3_SURFACE_CONTAINER = 'rgba(241, 240, 238, 0.78)';
const M3_OUTLINE_VARIANT = 'rgba(203, 199, 197, 0.6)';
// Strong ease-out — starts fast, feels instantly responsive (Emil Kowalski)
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

// ─── Animated Word Count ─────────────────────────────────────────────────────

interface SpringNumberProps {
	value: number;
	className?: string;
}

function SpringNumber({ value, className }: SpringNumberProps) {
	const springVal = useSpring(value, { stiffness: 300, damping: 25 });
	const display = useMotionValue('');
	const formatted = new Intl.NumberFormat().format(value);

	useEffect(() => {
		springVal.set(value);
	}, [value, springVal]);

	useEffect(() => {
		const unsubscribe = springVal.on('change', (v) => {
			display.set(new Intl.NumberFormat().format(Math.round(v)));
		});
		return unsubscribe;
	}, [springVal, display]);

	return (
		<motion.span
			className={className}
			style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}
			aria-label={formatted}
		>
			{formatted}
		</motion.span>
	);
}

// ─── Stat Divider — thin vertical hairline (more refined than bullet dot) ─────

function StatDivider() {
	return <span aria-hidden className="inline-block w-px h-3 bg-[#cbc7c5]" />;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteEditorProps {
	note: NoteFile | null;
	notes: TreeNode[];
	tree?: TreeNode[];
	onNewNote: () => void;
	onCreateDailyNote: () => void;
	onUpdateNote: (
		id: string,
		updates: Record<string, unknown>,
		options?: Record<string, unknown>
	) => void;
	onSelectNote: (id: string | null) => void;
	onRegisterEditorApi?: (api: EditorApi | null) => void;
	theme: string;
	onSetTheme: (theme: string) => void;
	onCycleTheme: () => void;
	accentId: string;
	onAccentChange: (id: string) => void;
	sidebarCollapsed: boolean;
	onToggleSidebar: () => void;
	onOpenCommandPalette?: () => void;
	onOpenAuthModal: () => void;
	saveStatus: SaveStatus;
	lastSavedAt: string | null;
	onRetrySync?: () => void;
	syncing: boolean;
	syncStatus: SyncStatus;
	onSync: () => void;
	fontId: string;
	onFontChange: (id: string) => void;
	wideMode: boolean;
	onWideModeChange: (wide: boolean) => void;
}

// ─── Breadcrumbs Component ──────────────────────────────────────────────────────

interface BreadcrumbsProps {
	note: NoteFile;
	notes: TreeNode[];
	tree?: TreeNode[];
	onSelectNote: (id: string | null) => void;
}

function Breadcrumbs({ note, notes, tree, onSelectNote }: BreadcrumbsProps) {
	const source = tree && tree.length > 0 ? tree : notes;
	const folderPath = useMemo(() => getBreadcrumbPath(source, note.id), [source, note.id]);

	if (folderPath.length === 0) return null;

	const noteName = note.title || note.name || 'Untitled';

	return (
		<motion.div
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
			className="inline-flex items-center gap-1 mb-2 md:mb-4"
			style={{ fontFamily: '"Poppins", system-ui, -apple-system, sans-serif' }}
		>
			{/* Folder path — each item staggers in 40ms apart */}
			{folderPath.map((folder, index) => (
				<motion.span
					key={folder.id}
					className="flex items-center gap-1"
					initial={{ opacity: 0, x: -6 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.18, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }}
				>
					{index > 0 && (
						<Icon
							icon={ArrowRight01Icon}
							size={12}
							strokeWidth={1.5}
							style={{ color: '#7a7779' }}
						/>
					)}
					<motion.button
						type="button"
						onClick={() => onSelectNote(folder.id)}
						whileTap={{ scale: 0.95 }}
						className="group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5"
						style={{
							fontSize: 12,
							color: '#48464a',
							fontWeight: 500,
							transition: `background-color 140ms ${EASE_OUT}`,
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = '#ebeae8')}
						onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
					>
						<Icon
							icon={Folder01Icon}
							size={12}
							strokeWidth={1.5}
							style={{ color: '#7a7779' }}
						/>
						<span className="max-w-[72px] md:max-w-[120px] truncate">{folder.name}</span>
					</motion.button>
				</motion.span>
			))}

			{/* Separator before note name — staggered after folders */}
			<motion.span
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.15, delay: folderPath.length * 0.04, ease: [0.23, 1, 0.32, 1] }}
			>
				<Icon
					icon={ArrowRight01Icon}
					size={12}
					strokeWidth={1.5}
					style={{ color: '#7a7779' }}
				/>
			</motion.span>

			{/* Current note name */}
			<motion.span
				className="inline-flex items-center gap-1"
				style={{ fontSize: 12, color: '#1c1b1a', fontWeight: 500 }}
				initial={{ opacity: 0, x: -4 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.18, delay: (folderPath.length + 1) * 0.04, ease: [0.23, 1, 0.32, 1] }}
			>
				<Icon
					icon={File01Icon}
					size={12}
					strokeWidth={1.5}
					style={{ color: '#7a7779' }}
				/>
				<span className="max-w-[120px] md:max-w-[200px] truncate">{noteName}</span>
			</motion.span>
		</motion.div>
	);
}

// ─── Editor Fallback ──────────────────────────────────────────────────────────

function EditorFallback() {
  return (
    <div className="flex min-h-[40vh] w-full flex-col gap-3 px-4 animate-[skeleton-in_0.3s_ease-out]">
      <div className="skeleton skeleton-heading" style={{ width: '45%' }} />
      <div className="skeleton skeleton-text" style={{ width: '100%' }} />
      <div className="skeleton skeleton-text" style={{ width: '92%' }} />
      <div className="skeleton skeleton-text" style={{ width: '78%' }} />
      <div className="skeleton skeleton-text" style={{ width: '85%' }} />
      <div className="mt-6 skeleton skeleton-heading" style={{ width: '32%' }} />
      <div className="skeleton skeleton-text" style={{ width: '95%' }} />
      <div className="skeleton skeleton-text" style={{ width: '88%' }} />
      <div className="skeleton skeleton-text" style={{ width: '62%' }} />
      <div className="skeleton skeleton-text" style={{ width: '70%' }} />
      <div className="mt-4 skeleton skeleton-block" style={{ width: '100%', height: '120px' }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NoteEditor({
	note,
	notes,
	tree,
	onNewNote,
	onCreateDailyNote,
	onUpdateNote,
	onSelectNote,
	onRegisterEditorApi,
	theme,
	onSetTheme,
	onCycleTheme,
	accentId,
	onAccentChange,
	sidebarCollapsed,
	onToggleSidebar,
	onOpenCommandPalette,
	onOpenAuthModal,
	saveStatus,
	lastSavedAt,
	onRetrySync,
	syncing,
	syncStatus,
	onSync,
	fontId,
	onFontChange,
	wideMode,
	onWideModeChange,
}: NoteEditorProps) {
	const { user } = useAuth();
	const [profileOpen, setProfileOpen] = useState(false);
	const profileAnchorRef = useRef<HTMLDivElement>(null);
	const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'error'>('idle');
	const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fileNotes = useMemo(() => notes.filter((n): n is NoteFile => n.type === 'file'), [notes]);

	// Session word count: capture baseline when a note is first opened
	const prevNoteIdRef = useRef<string | null>(null);
	const [sessionBase, setSessionBase] = useState<number | null>(null);
	const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

	// Hide mobile stats pill when the virtual keyboard is open (viewport shrinks)
	const [keyboardOpen, setKeyboardOpen] = useState(false);
	useEffect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const check = () => {
			setKeyboardOpen(window.innerHeight - (vv.offsetTop + vv.height) > 80);
		};
		vv.addEventListener('resize', check);
		vv.addEventListener('scroll', check);
		return () => {
			vv.removeEventListener('resize', check);
			vv.removeEventListener('scroll', check);
		};
	}, []);

	useEffect(() => {
		if (!note) return;
		if (note.id !== prevNoteIdRef.current) {
			prevNoteIdRef.current = note.id;
			setSessionBase(countBodyWords(note.content));
		}
	}, [note]);

	const editorApiRef = useRef<EditorApi | null>(null);

	const handleRegisterEditorApi = useCallback(
		(api: EditorApi | null) => {
			editorApiRef.current = api;
			setEditorInstance(api?.getEditor() ?? null);
			onRegisterEditorApi?.(api);
		},
		[onRegisterEditorApi]
	);

	const handleTitleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === 'Tab') {
			e.preventDefault();
			editorApiRef.current?.focus();
		}
	};

	const handleShareNote = useCallback(async () => {
		if (!note) return;

		if (!user) {
			onOpenAuthModal();
			return;
		}

		clearTimeout(shareTimerRef.current ?? undefined);
		setShareStatus('sharing');

		try {
			const token = await createSharedNote(note, user.id);
			const url = generateSharedNoteUrl(token);
			await navigator.clipboard.writeText(url);
			setShareStatus('copied');
			shareTimerRef.current = setTimeout(() => {
				setShareStatus('idle');
				shareTimerRef.current = null;
			}, 2000);
		} catch (error) {
			console.error(error);
			setShareStatus('error');
			shareTimerRef.current = setTimeout(() => {
				setShareStatus('idle');
				shareTimerRef.current = null;
			}, 3000);
		}
	}, [note, onOpenAuthModal, user]);

	useEffect(() => {
		return () => {
			clearTimeout(shareTimerRef.current ?? undefined);
		};
	}, []);

	const shareLabel = shareStatus === 'sharing'
		? 'Sharing…'
		: shareStatus === 'copied'
			? 'Copied'
			: shareStatus === 'error'
				? 'Retry'
				: 'Share';
	const shareTitle = !user
		? 'Sign in to share this note'
		: shareStatus === 'sharing'
			? 'Creating a share link'
			: 'Copy shareable link';

	// ── Home screen (no note selected) ─────────────────────────────────────────

	if (!note) {
		return (
			<HomeScreen
				notes={notes}
				onNewNote={onNewNote}
				onCreateDailyNote={onCreateDailyNote}
				onUpdateNote={onUpdateNote}
				onSelectNote={onSelectNote}
				theme={theme}
				onSetTheme={onSetTheme}
				onCycleTheme={onCycleTheme}
				accentId={accentId}
				onAccentChange={onAccentChange}
				sidebarCollapsed={sidebarCollapsed}
				onToggleSidebar={onToggleSidebar}
				onOpenCommandPalette={onOpenCommandPalette}
				onOpenAuthModal={onOpenAuthModal}
				syncing={syncing}
				syncStatus={syncStatus}
				onSync={onSync}
				fontId={fontId}
				onFontChange={onFontChange}
			/>
		);
	}

	// ── Derived state ───────────────────────────────────────────────────────────

	const createdAtLabel = formatCreatedAt(note.createdAt);
	const wordCount = countBodyWords(note.content);
	const readTime = estimateReadTime(note.content);
	const sessionDelta = wordCount - (sessionBase ?? wordCount);
	const saveBadgeMeta = getSaveBadgeMeta(saveStatus);
	const saveLabel = saveStatus.label || 'Not saved';
	const saveDetail = saveStatus.detail || 'Sign in to save your notes';
	const saveError = saveStatus.error;

	// Shared button base transition — exact properties only, custom easing (Emil)
	const btnTransition = `background-color 140ms ${EASE_OUT}, transform 120ms ${EASE_OUT}`;

	// ── Render ───────────────────────────────────────────────────────────────────

	return (
		<motion.div
			key="editor"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
			className="relative flex flex-1 min-h-0 min-w-0 w-full flex-col overflow-hidden"
			style={GS_SCOPE}
		>

			{/* ── M3 Top App Bar — surface-container tonal elevation with translucency ── */}
			<div
				className="relative z-30 flex items-center justify-between px-3 py-2.5 md:px-4"
				style={{
					background: M3_SURFACE_CONTAINER,
					backdropFilter: 'saturate(180%) blur(20px)',
					WebkitBackdropFilter: 'saturate(180%) blur(20px)',
					borderBottom: `1px solid ${M3_OUTLINE_VARIANT}`,
				}}
			>
				<div className="flex items-center gap-2.5">
					{/* Back button — Mobile only */}
					<motion.button
						type="button"
						onClick={() => onSelectNote(null)}
						whileTap={{ scale: 0.93 }}
						className="md:hidden relative flex h-9 w-9 items-center justify-center rounded-full"
						style={{
							background: 'transparent',
							color: MUTED,
							transition: btnTransition,
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = '#ebeae8')}
						onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
						title="Back to Home"
					>
						<Icon icon={ArrowLeft01Icon} size={22} strokeWidth={2} />
					</motion.button>

					{sidebarCollapsed ? (
						<motion.button
							type="button"
							onClick={onToggleSidebar}
							whileTap={{ scale: 0.93 }}
							className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-full"
							style={{
								background: 'transparent',
								color: MUTED,
								transition: btnTransition,
							}}
							onMouseEnter={(e) => (e.currentTarget.style.background = '#ebeae8')}
							onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
							title="Open sidebar (Cmd+B)"
						>
							<Icon
								icon={SidebarLeftIcon}
								size={22}
								strokeWidth={1.5}
								style={{ transform: 'scaleX(-1)' }}
							/>
						</motion.button>
					) : (
						<div className="hidden md:block w-9" />
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Home button — desktop only */}
					<motion.button
						type="button"
						onClick={() => onSelectNote(null)}
						whileTap={{ scale: 0.95 }}
						className="btn-pill hidden md:inline-flex"
						style={{ padding: '0 10px', transition: btnTransition }}
						title="Home"
					>
						<Icon icon={Home01Icon} size={14} strokeWidth={1.5} />
					</motion.button>

					{/* Share button — blur transition on label swap (Emil: blur masks imperfect crossfades) */}
					<motion.button
						type="button"
						onClick={handleShareNote}
						disabled={shareStatus === 'sharing'}
						whileTap={{ scale: 0.95 }}
						className="btn-pill"
						style={{
							transition: btnTransition,
							color:
								shareStatus === 'copied'
									? '#386a20'
									: shareStatus === 'error'
										? '#b3261e'
										: undefined,
						}}
						title={shareTitle}
					>
						<AnimatePresence mode="popLayout" initial={false}>
							<motion.span
								key={shareStatus}
								initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
								animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
								exit={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
								transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
								className="flex items-center gap-1"
							>
								<Icon
									icon={shareStatus === 'copied' ? Copy01Icon : Share01Icon}
									size={14}
									strokeWidth={1.5}
								/>
								<span className="hidden md:inline">{shareLabel}</span>
							</motion.span>
						</AnimatePresence>
					</motion.button>

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
						wideMode={wideMode}
						onWideModeChange={onWideModeChange}
						onExport={note ? () => exportNoteAsMarkdown(note) : undefined}
					/>

					{/* Auth: sign-in pill or user pill with ProfilePanel */}
					{user ? (
						<div ref={profileAnchorRef} className="relative">
							<motion.button
								type="button"
								onClick={() => setProfileOpen((v) => !v)}
								whileTap={{ scale: 0.95 }}
								className="btn-pill gap-2"
								style={{ transition: btnTransition }}
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
								<span className="max-w-[96px] truncate hidden md:inline">
									{user.user_metadata?.display_name || user.email?.split('@')[0]}
								</span>
							</motion.button>
							<AnimatePresence>
								{profileOpen && (
									<ProfilePanel onClose={() => setProfileOpen(false)} />
								)}
							</AnimatePresence>
						</div>
					) : (
						<motion.button
							type="button"
							onClick={onOpenAuthModal}
							whileTap={{ scale: 0.95 }}
							className="btn-pill btn-pill-accent"
							style={{ transition: btnTransition }}
							title="Sign in to sync your notes"
						>
							<Icon icon={CloudUploadIcon} size={14} strokeWidth={1.5} />
							Sign in
						</motion.button>
					)}
				</div>
			</div>

			{/* Editor formatting toolbar — sticky below header on desktop, floating above keyboard on mobile */}
			<MobileEditorToolbar editor={editorInstance} />

			{/* Scrollable content */}
			<div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10">

				<div className={wideMode ? 'w-full px-3 pb-28 pt-3 sm:px-6 md:px-10 md:pb-40 md:pt-12' : 'mx-auto max-w-4xl px-3 pb-28 pt-3 sm:px-6 md:px-10 md:pb-40 md:pt-12'}>
					<div className="editor-stagger-1">
						<Breadcrumbs note={note} notes={notes} tree={tree} onSelectNote={onSelectNote} />
					</div>

					{note.tags?.includes('daily') ? (
						<DailyHeader note={note} />
					) : (
						<>
							<div className="editor-stagger-2">
								<div className="note-title-block">
									<NoteBanner
										noteId={note.id}
										title={note.title}
										icon={note.icon}
										onTitleChange={(title) => onUpdateNote(note.id, { title })}
										onTitleKeyDown={handleTitleKeyDown}
									/>
									<div className="flex flex-nowrap items-center gap-2 mt-1 md:gap-3 md:mt-2 min-w-0 overflow-x-auto">
										<span className="label-mono text-[10px] md:text-xs whitespace-nowrap shrink-0">{createdAtLabel}</span>
										<StatDivider />
										<div className="min-w-0 flex-1">
											<TagInput
												tags={note.tags || []}
												onChange={(tags) => onUpdateNote(note.id, { tags }, { skipTimestamp: true })}
											/>
										</div>
									</div>
								</div>
							</div>
						</>
					)}

					<div className="editor-stagger-3">
						<div className="mt-6 md:mt-10">
							<Suspense fallback={<EditorFallback />}>
								<LiveMarkdownEditor
									key={note.id}
									value={note.content}
									contentDoc={note.contentDoc}
									notes={fileNotes}
									currentNoteId={note.id}
									currentNoteTitle={note.title}
									wideMode={wideMode}
									onChange={(updates) => onUpdateNote(note.id, { ...updates })}
									onRegisterEditorApi={handleRegisterEditorApi}
								/>
							</Suspense>
						</div>
					</div>
				</div>
			</div>

			{/* ── Stats bar — bottom strip (desktop) ── */}
			<div
				className="stats-bar-desktop hidden md:flex items-center justify-end gap-3 px-5 py-2.5 select-none"
				style={{
					background: 'transparent',
					fontFamily: FONT,
					color: MUTED,
					fontSize: 12,
					letterSpacing: '0.005em',
				}}
			>
				{/* Save status — spring entrance on state change (Emil: scale(0.95) not scale(0)) */}
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span
						key={saveStatus.state}
						initial={{ opacity: 0, scale: 0.88, y: 4 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.88, y: -4 }}
						transition={{ type: 'spring', stiffness: 420, damping: 26 }}
						className={`inline-flex items-center gap-1 font-medium tabular-nums ${getSaveTextClass(saveStatus.state)}`}
						title={saveError || (lastSavedAt ? `Last saved ${formatRelativeSaveTime(lastSavedAt)}` : saveDetail)}
					>
						<Icon
							icon={saveBadgeMeta.icon}
							size={11}
							strokeWidth={1.8}
							className={saveBadgeMeta.spin ? 'sync-spin' : undefined}
						/>
						{saveLabel}
					</motion.span>
				</AnimatePresence>

				<StatDivider />

				{/* Session delta — spring pop-in */}
				<AnimatePresence mode="popLayout">
					{sessionDelta > 0 && (
						<motion.span
							key="session-delta"
							initial={{ scale: 0.7, opacity: 0, y: 6 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.7, opacity: 0, y: -6 }}
							transition={{ type: 'spring', stiffness: 500, damping: 22 }}
							className="inline-flex items-center gap-0.5 font-semibold tabular-nums"
							style={{ color: '#386a20' }}
						>
							<Icon icon={FireIcon} size={10} strokeWidth={2.2} />
							+{sessionDelta.toLocaleString()}
						</motion.span>
					)}
				</AnimatePresence>
				{sessionDelta > 0 && (
					<StatDivider />
				)}

				{/* Word count — monospace numerals (design-taste: tabular-nums for data density) */}
				<span style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>
					<SpringNumber value={wordCount} />
				</span>
				<span>words</span>

				{readTime && (
					<>
						<StatDivider />
						<span>{readTime}</span>
					</>
				)}

				{/* Retry button */}
				{saveStatus.canRetry && onRetrySync && (
					<>
						<StatDivider />
						<motion.button
							type="button"
							onClick={onRetrySync}
							whileTap={{ scale: 0.95 }}
							className="rounded-full px-3 py-1 text-[11px] font-medium"
							style={{
								border: `1px solid ${DIVIDER}`,
								color: '#6750a4',
								background: '#eaddff',
								transition: `background-color 140ms ${EASE_OUT}, transform 120ms ${EASE_OUT}`,
							}}
							onMouseEnter={(e) => (e.currentTarget.style.background = '#d0bcff')}
							onMouseLeave={(e) => (e.currentTarget.style.background = '#eaddff')}
						>
							Retry
						</motion.button>
					</>
				)}
			</div>

			{/* ── M3 Mobile stats — surface-container floating pill (elevation 2) ── */}
			<motion.div
				className={`stats-bar-mobile flex md:hidden fixed z-20 items-center gap-2 rounded-full px-3.5 py-2 text-[11px] tabular-nums select-none`}
				animate={{ opacity: keyboardOpen ? 0 : 1 }}
				transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
				style={{
					bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)',
					left: '50%',
					transform: 'translateX(-50%)',
					fontFamily: FONT,
					color: MUTED,
					pointerEvents: keyboardOpen ? 'none' : 'auto',
					// M3 surface-container with translucency, no border (M3 prefers tonal layers over outlines)
					background: 'rgba(241, 240, 238, 0.86)',
					backdropFilter: 'saturate(180%) blur(18px)',
					WebkitBackdropFilter: 'saturate(180%) blur(18px)',
					// M3 elevation level 2 shadow
					boxShadow: `
						0 1px 2px 0 rgba(28, 27, 26, 0.30),
						0 2px 6px 2px rgba(28, 27, 26, 0.15)
					`,
				}}
			>
				{/* Save status */}
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span
						key={saveStatus.state}
						initial={{ opacity: 0, scale: 0.88 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.88 }}
						transition={{ type: 'spring', stiffness: 420, damping: 26 }}
						className={`inline-flex items-center gap-1 font-medium ${getSaveTextClass(saveStatus.state)}`}
					>
						<Icon
							icon={saveBadgeMeta.icon}
							size={10}
							strokeWidth={1.8}
							className={saveBadgeMeta.spin ? 'sync-spin' : undefined}
						/>
						{saveLabel}
					</motion.span>
				</AnimatePresence>

				<StatDivider />

				<span style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>
					<SpringNumber value={wordCount} />
					{' '}words
				</span>

				{sessionDelta > 0 && (
					<>
						<StatDivider />
						<motion.span
							initial={{ scale: 0.7, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: 'spring', stiffness: 500, damping: 22 }}
							className="inline-flex items-center gap-0.5 font-semibold tabular-nums"
							style={{ color: '#386a20' }}
						>
							<Icon icon={FireIcon} size={8} strokeWidth={2.2} />
							+{sessionDelta.toLocaleString()}
						</motion.span>
					</>
				)}
			</motion.div>

		</motion.div>
	);
}
