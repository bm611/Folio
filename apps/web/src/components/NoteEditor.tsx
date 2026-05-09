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

// ─── Material palette (locked — matches HomeScreen/landing page) ─────────────

const GS_SCOPE: CSSProperties = {
	['--bg-primary' as string]:     '#ffffff',
	['--bg-surface' as string]:     '#f8f9fa',
	['--bg-elevated' as string]:    '#ffffff',
	['--bg-hover' as string]:       '#f1f3f4',
	['--bg-deep' as string]:        '#e8eaed',
	['--ink' as string]:            '#202124',
	['--ink-soft' as string]:       '#3c4043',
	['--text-primary' as string]:   '#202124',
	['--text-secondary' as string]: '#3c4043',
	['--text-muted' as string]:     '#5f6368',
	['--text-inverse' as string]:   '#ffffff',
	['--border-subtle' as string]:  '#e8eaed',
	['--border-default' as string]: '#dadce0',
	['--accent' as string]:         '#1a73e8',
	['--accent-hover' as string]:   '#1765cc',
	['--accent-text' as string]:    '#ffffff',
	['--accent-soft' as string]:    '#e8f0fe',
	['--success' as string]:        '#1e8e3e',
	['--warning' as string]:        '#f29900',
	['--danger' as string]:         '#d93025',
	background: '#ffffff',
	color: '#202124',
	fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
};

const FONT = '"Poppins", system-ui, -apple-system, sans-serif';
const MUTED = '#5f6368';
const DIVIDER = '#e8eaed';

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
		<motion.span className={className} aria-label={formatted}>
			{formatted}
		</motion.span>
	);
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
			initial={{ opacity: 0, y: -4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
			className="inline-flex items-center gap-1 mb-4"
			style={{ fontFamily: '"Poppins", system-ui, -apple-system, sans-serif' }}
		>
			{/* Folder path */}
			{folderPath.map((folder, index) => (
				<span key={folder.id} className="flex items-center gap-1">
					{index > 0 && (
						<Icon
							icon={ArrowRight01Icon}
							size={12}
							strokeWidth={1.5}
							style={{ color: '#9aa0a6' }}
						/>
					)}
					<motion.button
						type="button"
						onClick={() => onSelectNote(folder.id)}
						className="group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-[background-color,transform] duration-[150ms] active:scale-[0.97]"
						style={{ fontSize: 12, color: '#5f6368', fontWeight: 500 }}
						onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f3f4')}
						onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
					>
						<Icon
							icon={Folder01Icon}
							size={12}
							strokeWidth={1.5}
							style={{ color: '#9aa0a6' }}
						/>
						<span className="max-w-[72px] md:max-w-[120px] truncate">{folder.name}</span>
					</motion.button>
				</span>
			))}

			{/* Separator before note name */}
			<Icon
				icon={ArrowRight01Icon}
				size={12}
				strokeWidth={1.5}
				style={{ color: '#9aa0a6' }}
			/>

			{/* Current note name */}
			<span className="inline-flex items-center gap-1" style={{ fontSize: 12, color: '#202124', fontWeight: 500 }}>
				<Icon
					icon={File01Icon}
					size={12}
					strokeWidth={1.5}
					style={{ color: '#9aa0a6' }}
				/>
				<span className="max-w-[120px] md:max-w-[200px] truncate">{noteName}</span>
			</span>
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
	// Stagger animations apply when switching notes (CSS animation classes handle timing)

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
	}, [note, onOpenAuthModal, user])

	useEffect(() => {
		return () => {
			clearTimeout(shareTimerRef.current ?? undefined)
		}
	}, [])

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

	// ── Render ───────────────────────────────────────────────────────────────────

	return (
		<motion.div
			key="editor"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className="relative flex flex-1 min-h-0 min-w-0 w-full flex-col overflow-hidden"
			style={GS_SCOPE}
		>

			<div className="relative z-30 flex items-center justify-between px-4 py-2 md:px-5" style={{ background: '#ffffff', borderBottom: `1px solid ${DIVIDER}` }}>
				<div className="flex items-center gap-2.5">
					{/* Back button — Mobile only */}
					<button
						type="button"
						onClick={() => onSelectNote(null)}
						className="md:hidden relative flex h-9 w-9 items-center justify-center rounded-full active:scale-[0.97]"
						style={{ background: 'transparent', color: MUTED, transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1)' }}
						onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f3f4')}
						onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
						title="Back to Home"
					>
						<Icon icon={ArrowLeft01Icon} size={22} strokeWidth={2} />
					</button>

					{sidebarCollapsed ? (
						<button
							type="button"
							onClick={onToggleSidebar}
							className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-full active:scale-[0.97]"
							style={{ background: 'transparent', color: MUTED, transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1)' }}
							onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f3f4')}
							onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
							title="Open sidebar (Cmd+B)"
						>
							<Icon
								icon={SidebarLeftIcon}
								size={22}
								strokeWidth={1.5}
								style={{ transform: 'scaleX(-1)' }}
							/>
						</button>
					) : (
						<div className="hidden md:block w-9" />
					)}
				</div>
				<div className="flex items-center gap-2">
					{/* Home button — desktop only */}
					<button
						type="button"
						onClick={() => onSelectNote(null)}
						className="btn-pill hidden md:inline-flex"
						style={{ padding: '0 10px' }}
						title="Home"
					>
						<Icon icon={Home01Icon} size={14} strokeWidth={1.5} />
					</button>

					{/* Share button */}
					<button
						type="button"
						onClick={handleShareNote}
						disabled={shareStatus === 'sharing'}
						className="btn-pill"
						title={shareTitle}
					>
						<Icon icon={shareStatus === 'copied' ? Copy01Icon : Share01Icon} size={14} strokeWidth={1.5} />
						<span className="hidden md:inline ml-1">{shareLabel}</span>
					</button>

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
								<span className="max-w-[96px] truncate hidden md:inline">
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
							Sign in
						</button>
					)}
				</div>
			</div>

			{/* Editor formatting toolbar — sticky below header on desktop, floating above keyboard on mobile */}
			<MobileEditorToolbar editor={editorInstance} />

			{/* Scrollable content */}
			<div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10">
				

			<div className={wideMode ? 'w-full px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-40 md:pt-12' : 'mx-auto max-w-4xl px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-40 md:pt-12'}> 
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
									<div className="flex flex-wrap items-center gap-3 mt-2">
										<span className="label-mono">{createdAtLabel}</span>
										<span className="text-[var(--text-muted)] opacity-40">·</span>
										<TagInput
											tags={note.tags || []}
											onChange={(tags) => onUpdateNote(note.id, { tags }, { skipTimestamp: true })}
										/>
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

			{/* Stats bar — bottom strip */}
			<div className="stats-bar-desktop hidden md:flex items-center justify-end gap-3 px-5 py-2 text-[11.5px] tabular-nums select-none" style={{ background: 'transparent', fontFamily: FONT, color: MUTED }}>
				{/* Save status */}
				<motion.span
					key={saveStatus.state}
					initial={saveStatus.state === 'syncing' ? { scale: 0.92 } : undefined}
					animate={saveStatus.state === 'syncing' ? { scale: [0.92, 1.05, 1] } : undefined}
					transition={saveStatus.state === 'syncing' ? { duration: 0.25, ease: [0.23, 1, 0.32, 1] } : undefined}
					className={`inline-flex items-center gap-1 font-medium ${getSaveTextClass(saveStatus.state)}`}
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

				<span style={{ color: '#dadce0' }}>·</span>

				{/* Session delta */}
				<AnimatePresence mode="popLayout">
					{sessionDelta > 0 && (
						<motion.span
							key="session-delta"
							initial={{ scale: 0.7, opacity: 0, y: 6 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.7, opacity: 0, y: -6 }}
							transition={{ type: 'spring', stiffness: 500, damping: 22 }}
							className="inline-flex items-center gap-0.5 font-semibold"
							style={{ color: '#1e8e3e' }}
						>
							<Icon icon={FireIcon} size={10} strokeWidth={2.2} />
							+{sessionDelta.toLocaleString()}
						</motion.span>
					)}
				</AnimatePresence>
				{sessionDelta > 0 && (
					<span style={{ color: '#dadce0' }}>·</span>
				)}

				{/* Word count */}
				<SpringNumber value={wordCount} />
				<span> words</span>

				{readTime && (
					<>
						<span style={{ color: '#dadce0' }}>·</span>
						<span>{readTime}</span>
					</>
				)}

				{/* Retry button */}
				{saveStatus.canRetry && onRetrySync && (
					<>
						<span style={{ color: '#dadce0' }}>·</span>
						<button
							type="button"
							onClick={onRetrySync}
							className="rounded-full px-2.5 py-0.5 text-[11px] font-medium active:scale-[0.97]"
							style={{ border: `1px solid ${DIVIDER}`, color: MUTED, background: '#ffffff', transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1)' }}
							onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f3f4')}
							onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
						>
							Retry
						</button>
					</>
				)}
			</div>

			{/* Mobile stats — floating pill (hidden on desktop) */}
			<div
				className={`stats-bar-mobile flex md:hidden fixed z-20 items-center gap-2 rounded-full px-3 py-1.5 text-[11px] tabular-nums select-none transition-opacity duration-200 ${keyboardOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
				style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)', left: '50%', transform: 'translateX(-50%)', fontFamily: FONT, color: MUTED, background: '#ffffff', border: `1px solid ${DIVIDER}`, boxShadow: '0 1px 6px -1px rgba(32,33,36,0.10), 0 2px 8px -2px rgba(32,33,36,0.08)' }}
			>
				<span
					className={`inline-flex items-center gap-1 font-medium ${getSaveTextClass(saveStatus.state)}`}
				>
					<Icon
						icon={saveBadgeMeta.icon}
						size={10}
						strokeWidth={1.8}
						className={saveBadgeMeta.spin ? 'sync-spin' : undefined}
					/>
					{saveLabel}
				</span>
				<span style={{ color: '#dadce0' }}>·</span>
				<span>
					<SpringNumber value={wordCount} />
					{' '}words
				</span>
				{sessionDelta > 0 && (
					<>
						<span style={{ color: '#dadce0' }}>·</span>
						<motion.span
							initial={{ scale: 0.7, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: 'spring', stiffness: 500, damping: 22 }}
							className="inline-flex items-center gap-0.5 font-semibold"
							style={{ color: '#1e8e3e' }}
						>
							<Icon icon={FireIcon} size={8} strokeWidth={2.2} />
							+{sessionDelta.toLocaleString()}
						</motion.span>
					</>
				)}
			</div>

		</motion.div>
	);
}
