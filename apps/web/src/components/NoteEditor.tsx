import { lazy, Suspense, useRef, useCallback, useEffect, useMemo, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import type { Editor } from '@tiptap/react';
import {
	Calendar01Icon,
	CloudUploadIcon,
	ArrowLeft01Icon,
	StarIcon,
	FireIcon,
	File01Icon,
	Download01Icon,
	Home01Icon,
	Folder01Icon,
	ArrowRight01Icon,
	SidebarLeftIcon,
	Logout01Icon,
} from '@hugeicons/core-free-icons';

import Icon from './Icon';
import SettingsMenu from './SettingsMenu';
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
import { useAuth } from '../contexts/AuthContext';
import HomeScreen from './HomeScreen';
import type { SaveStatus, SyncStatus } from './noteEditorUtils';
import { formatRelativeSaveTime, getSaveBadgeMeta, getSaveTextClass } from './noteEditorUtils';

const LiveMarkdownEditor = lazy(() => import('./LiveMarkdownEditor'));

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

// ─── Favorite Button Component ────────────────────────────────────────────────

interface FavoriteButtonProps {
	note: NoteFile;
	onUpdateNote: (
		id: string,
		updates: Record<string, unknown>,
		options?: { skipTimestamp?: boolean }
	) => void;
}

function FavoriteButton({ note, onUpdateNote }: FavoriteButtonProps) {
	const [isAnimating, setIsAnimating] = useState(false);
	const isFavorite = (note.tags || []).includes('favorite');
	
	const sparkles = useMemo(() => {
		return Array.from({ length: 6 }, (_, i) => ({
			id: i,
			angle: (i * 60) + Math.random() * 20 - 10,
			distance: 24 + Math.random() * 8,
			size: 2 + Math.random() * 2,
			delay: i * 0.02,
		}));
	}, []);

	const handleClick = () => {
		const currentTags = note.tags || [];
		const wasFavorite = currentTags.includes('favorite');
		const newTags = wasFavorite
			? currentTags.filter((t) => t !== 'favorite')
			: [...currentTags, 'favorite'];
		
		onUpdateNote(note.id, { tags: newTags }, { skipTimestamp: true });
		
		if (!wasFavorite) {
			setIsAnimating(true);
			setTimeout(() => setIsAnimating(false), 600);
		}
	};

	return (
		<motion.button
			type="button"
			onClick={handleClick}
			className="glass-icon hidden md:relative md:flex h-10 w-10 items-center justify-center rounded-lg transition-[background-color,color,border-color,box-shadow] duration-150 ease-out after:absolute after:-inset-2"
			style={{ color: isFavorite ? 'var(--warning)' : 'var(--text-muted)' }}
			title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
			whileTap={{ scale: 0.85 }}
			animate={isAnimating ? {
				scale: [1, 1.35, 0.95, 1.08, 1],
				rotate: [0, -15, 12, -8, 4, 0],
			} : {}}
			transition={{
				duration: 0.5,
				ease: [0.25, 1, 0.5, 1],
			}}
		>
			{/* Sparkle burst effect */}
			<AnimatePresence>
				{isAnimating && sparkles.map((sparkle) => (
					<motion.span
						key={sparkle.id}
						className="absolute pointer-events-none rounded-full"
						style={{
							width: sparkle.size,
							height: sparkle.size,
							backgroundColor: 'var(--warning)',
							boxShadow: '0 0 4px var(--warning), 0 0 8px var(--warning)',
						}}
						initial={{ 
							opacity: 1, 
							scale: 0,
							x: 0, 
							y: 0 
						}}
						animate={{ 
							opacity: 0, 
							scale: [0, 1.5, 0],
							x: Math.cos((sparkle.angle * Math.PI) / 180) * sparkle.distance,
							y: Math.sin((sparkle.angle * Math.PI) / 180) * sparkle.distance,
						}}
						exit={{ opacity: 0 }}
						transition={{
							duration: 0.5,
							delay: sparkle.delay,
							ease: [0.25, 1, 0.5, 1],
						}}
					/>
				))}
			</AnimatePresence>
			
			{/* Star icon with fill animation */}
			<motion.span
				className="relative"
				animate={isAnimating ? {
					filter: [
						'drop-shadow(0 0 0px var(--warning))',
						'drop-shadow(0 0 8px var(--warning))',
						'drop-shadow(0 0 4px var(--warning))',
						'drop-shadow(0 0 0px var(--warning))'
					]
				} : {}}
				transition={{ duration: 0.5 }}
			>
				<Icon
					icon={StarIcon}
					size={21}
					strokeWidth={1.5}
					className={isFavorite ? 'fill-current' : ''}
				/>
			</motion.span>
		</motion.button>
	);
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
			transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
			className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] mb-3 px-2 py-1 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-sm"
		>
			{/* Folder path */}
			{folderPath.map((folder, index) => (
				<span key={folder.id} className="flex items-center gap-1.5">
					{index > 0 && (
						<Icon
							icon={ArrowRight01Icon}
							size={12}
							strokeWidth={1.5}
							className="opacity-40"
						/>
					)}
					<motion.button
						type="button"
						onClick={() => onSelectNote(folder.id)}
						className="group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						<Icon
							icon={Folder01Icon}
							size={12}
							strokeWidth={1.5}
							className="opacity-60 group-hover:opacity-100 transition-opacity"
						/>
						<span className="max-w-[120px] truncate">{folder.name}</span>
					</motion.button>
				</span>
			))}

			{/* Separator before note name */}
			<Icon
				icon={ArrowRight01Icon}
				size={12}
				strokeWidth={1.5}
				className="opacity-40"
			/>

			{/* Current note name */}
			<span className="inline-flex items-center gap-1 text-[var(--text-primary)] font-medium">
				<Icon
					icon={File01Icon}
					size={12}
					strokeWidth={1.5}
					className="opacity-60"
				/>
				<span className="max-w-[200px] truncate">{noteName}</span>
			</span>
		</motion.div>
	);
}

// ─── Editor Fallback ──────────────────────────────────────────────────────────

function EditorFallback() {
	return (
		<div className="flex min-h-[40vh] w-full items-center justify-center">
			<svg
				width="100%"
				height="100%"
				viewBox="0 0 800 800"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				style={{ maxWidth: '600px', maxHeight: '600px' }}
			>
				<g filter="url(#editor-fallback-glow)">
					<path
						d="M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z"
						fill="none"
						stroke="var(--success)"
						strokeWidth="2"
						strokeOpacity="0.5"
					>
						<animate
							attributeName="d"
							values="M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z;
                      M 400 250 C 650 150, 750 450, 550 650 C 350 850, 150 650, 250 450 C 350 250, 150 350, 400 250 Z;
                      M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z"
							dur="20s"
							repeatCount="indefinite"
						/>
					</path>
					<path
						d="M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z"
						fill="none"
						stroke="var(--accent)"
						strokeWidth="1.5"
						strokeOpacity="0.6"
					>
						<animate
							attributeName="d"
							values="M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z;
                      M 400 200 C 500 150, 700 350, 600 550 C 500 750, 200 600, 200 450 C 200 300, 300 250, 400 200 Z;
                      M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z"
							dur="15s"
							repeatCount="indefinite"
						/>
					</path>
					<path
						d="M 400 300 C 500 300, 600 400, 500 500 C 400 600, 300 550, 300 450 C 300 350, 300 300, 400 300 Z"
						fill="none"
						stroke="var(--color-h2)"
						strokeWidth="1"
						strokeOpacity="0.7"
					>
						<animate
							attributeName="d"
							values="M 400 300 C 500 300, 600 400, 500 500 C 400 600, 300 550, 300 450 C 300 350, 300 300, 400 300 Z;
                      M 400 350 C 550 250, 550 450, 450 550 C 350 650, 250 500, 350 400 C 450 300, 250 400, 400 350 Z;
                      M 400 300 C 500 300, 600 400, 500 500 C 400 600, 300 550, 300 450 C 300 350, 300 300, 400 300 Z"
							dur="10s"
							repeatCount="indefinite"
						/>
					</path>
				</g>
				<defs>
					<filter id="editor-fallback-glow" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="15" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
				</defs>
			</svg>
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
	const { user, signOut } = useAuth();

	const fileNotes = useMemo(() => notes.filter((n): n is NoteFile => n.type === 'file'), [notes]);

	// Session word count: capture baseline when a note is first opened
	const prevNoteIdRef = useRef<string | null>(null);
	const [sessionBase, setSessionBase] = useState<number | null>(null);
	const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

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
			className="relative flex flex-1 min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-2xl bg-[var(--bg-primary)] transition-[border-radius] duration-300 max-md:rounded-none"
		>

			<div className="relative z-20 flex items-center justify-between px-4 py-2 md:px-6">
				<div className="flex items-center gap-2">
					{/* Back button — Mobile only */}
						<button
							type="button"
							onClick={() => onSelectNote(null)}
							className="glass-icon md:hidden relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out hover:text-[var(--text-primary)] after:absolute after:-inset-2 active:scale-[0.96]"
							title="Back to Home"
						>
						<Icon icon={ArrowLeft01Icon} size={22} strokeWidth={2} />
					</button>

					{sidebarCollapsed ? (
						<button
							type="button"
							onClick={onToggleSidebar}
							className="glass-icon hidden md:relative md:flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out hover:text-[var(--text-primary)] after:absolute after:-inset-2 active:scale-[0.96]"
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
						<div className="hidden md:block w-10" />
					)}
				</div>
				<div className="flex items-center gap-1.5 md:gap-2">
					{/* Home button — desktop only */}
					<button
						type="button"
						onClick={() => onSelectNote(null)}
						className="glass-icon hidden md:relative md:flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out hover:text-[var(--text-primary)] after:absolute after:-inset-2 active:scale-[0.96]"
						title="Home"
					>
						<Icon icon={Home01Icon} size={20} strokeWidth={1.5} />
					</button>

					{note && (
						<>
							<FavoriteButton note={note} onUpdateNote={onUpdateNote} />
							<div className="hidden md:block h-5 w-px bg-[var(--border-subtle)]/50" />
						</>
					)}

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
					/>

					{/* Export — direct top-bar button (desktop only) */}
					{note && (
						<button
							type="button"
							onClick={() => exportNoteAsMarkdown(note)}
							className="glass-icon hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] after:absolute after:-inset-2 active:scale-[0.96]"
							title="Export as Markdown"
							aria-label="Export note as Markdown"
						>
							<Icon icon={Download01Icon} size={19} strokeWidth={1.8} />
						</button>
					)}

					{/* Auth: show sign-in or user menu */}
					{user ? (
						<div className="auth-group">
							<div
								className="auth-pill auth-pill--signed-in"
								title={`Signed in as ${user.email}`}
							>
								<span className="auth-pill__avatar">{user.email?.[0]?.toUpperCase() || '?'}</span>
								<span className="auth-pill__dot" />
							</div>
							<button
								type="button"
								onClick={signOut}
								className="auth-signout-btn"
								title="Sign out"
							>
								<Icon icon={Logout01Icon} size={19} strokeWidth={2} />
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={onOpenAuthModal}
							className="relative flex h-10 px-4 auth-pill auth-pill--signed-out transition-transform duration-150 ease-out active:scale-[0.96]"
							title="Sign in to sync your notes"
						>
							<Icon icon={CloudUploadIcon} size={18} strokeWidth={2} />
							<span>Sign in</span>
						</button>
					)}
				</div>
			</div>

			{/* Scrollable content */}
			<div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10">
				<div className={wideMode ? 'w-full px-4 pb-24 pt-6 sm:px-6 md:px-10 md:pb-32 md:pt-0' : 'mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 md:px-10 md:pb-32 md:pt-0'}>
					<Breadcrumbs note={note} notes={notes} tree={tree} onSelectNote={onSelectNote} />

					{note.tags?.includes('daily') ? (
						<DailyHeader note={note} />
					) : (
						<>
							<NoteBanner
								noteId={note.id}
								title={note.title}
								onTitleChange={(title) => onUpdateNote(note.id, { title })}
								onTitleKeyDown={handleTitleKeyDown}
							/>

							<div className="text-[12px] text-[var(--text-muted)]">
								<span className="inline-flex items-center gap-1.5">
									<Icon icon={Calendar01Icon} size={14} strokeWidth={1.5} className="opacity-70" />
									{createdAtLabel}
								</span>
							</div>

							<div className="mt-3">
								<TagInput
									tags={note.tags || []}
									onChange={(tags) => onUpdateNote(note.id, { tags }, { skipTimestamp: true })}
								/>
							</div>
						</>
					)}

					<div className="mt-4 md:mt-8">
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

			{/* Stats bar — bottom right (minimal pill) */}
			<div className="hidden md:flex absolute bottom-4 right-4 z-20 items-center gap-2 rounded-full border border-[var(--border-subtle)]/50 bg-[var(--bg-surface)]/90 px-3.5 py-1.5 backdrop-blur-lg text-[11px] tabular-nums select-none transition-[border-color] duration-300" style={{ fontFamily: '"Outfit", sans-serif' }}>
				{/* Save status */}
				<motion.span
					key={saveStatus.state}
					initial={saveStatus.state === 'syncing' ? { scale: 0.9 } : undefined}
					animate={saveStatus.state === 'syncing' ? { scale: [0.9, 1.08, 1] } : undefined}
					transition={saveStatus.state === 'syncing' ? { duration: 0.4, ease: [0.25, 1, 0.5, 1] } : undefined}
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

				<span className="text-[var(--text-muted)] opacity-30">·</span>

				{/* Session delta */}
				{sessionDelta > 0 && (
					<>
						<motion.span
							key={sessionDelta}
							initial={{ scale: 0.85, opacity: 0, y: 4 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							transition={{ type: 'spring', stiffness: 400, damping: 18 }}
							className="inline-flex items-center gap-0.5 font-semibold text-[var(--success)]"
						>
							<Icon icon={FireIcon} size={10} strokeWidth={2.2} />
							+{sessionDelta.toLocaleString()}
						</motion.span>
						<span className="text-[var(--text-muted)] opacity-30">·</span>
					</>
				)}

				{/* Word count */}
				<span className="text-[var(--text-muted)]">
					{new Intl.NumberFormat().format(wordCount)} words
				</span>

				{readTime && (
					<>
						<span className="text-[var(--text-muted)] opacity-30">·</span>
						<span className="text-[var(--text-muted)]">{readTime}</span>
					</>
				)}

				{/* Retry button */}
				{saveStatus.canRetry && onRetrySync && (
					<>
						<span className="text-[var(--text-muted)] opacity-30">·</span>
						<button
							type="button"
							onClick={onRetrySync}
							className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
						>
							Retry
						</button>
					</>
				)}
			</div>

			{/* Mobile stats — minimal pill (hidden on desktop) */}
			<div className="flex md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-20 items-center gap-2 rounded-full border border-[var(--border-subtle)]/50 bg-[var(--bg-surface)]/90 px-3 py-1 backdrop-blur-lg text-[10px] tabular-nums select-none" style={{ fontFamily: '"Outfit", sans-serif' }}>
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
				<span className="text-[var(--text-muted)] opacity-30">·</span>
				<span className="text-[var(--text-muted)]">
					{new Intl.NumberFormat().format(wordCount)} words
				</span>
				{sessionDelta > 0 && (
					<>
						<span className="text-[var(--text-muted)] opacity-30">·</span>
						<span className="inline-flex items-center gap-0.5 font-semibold text-[var(--success)]">
							<Icon icon={FireIcon} size={8} strokeWidth={2.2} />
							+{sessionDelta.toLocaleString()}
						</span>
					</>
				)}
			</div>

			{/* Mobile editor toolbar — floating formatting pill */}
			<MobileEditorToolbar editor={editorInstance} />
		</motion.div>
	);
}
