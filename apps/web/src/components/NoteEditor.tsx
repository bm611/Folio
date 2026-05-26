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
	Calendar03Icon,
	Clock01Icon,
	Tag01Icon,
	BookOpen01Icon,
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

// Editor scope: matches HomeScreen's Google-Store palette so transitioning
// between Home and an open note feels like a single continuous surface.
const GS_SCOPE: CSSProperties = {
	['--bg-primary' as string]:           '#ffffff',
	['--bg-surface' as string]:           '#f8f9fa',
	['--bg-elevated' as string]:          '#ffffff',
	['--bg-hover' as string]:             '#f1f3f4',
	['--bg-deep' as string]:              '#e8eaed',
	['--ink' as string]:                  '#202124',
	['--ink-soft' as string]:             '#3c4043',
	['--text-primary' as string]:         '#202124',
	['--text-secondary' as string]:       '#3c4043',
	['--text-muted' as string]:           '#5f6368',
	['--text-inverse' as string]:         '#ffffff',
	['--border-subtle' as string]:        '#e8eaed',
	['--border-default' as string]:       '#dadce0',
	['--accent' as string]:               '#1a73e8',
	['--accent-hover' as string]:         '#1765cc',
	['--accent-text' as string]:          '#ffffff',
	['--accent-soft' as string]:          '#e8f0fe',
	['--success' as string]:              '#1e8e3e',
	['--warning' as string]:              '#f29900',
	['--danger' as string]:               '#d93025',
	background: '#ffffff',
	color: '#202124',
	fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
};

const FONT = '"Poppins", system-ui, -apple-system, sans-serif';
const MUTED = '#5f6368';
const DIVIDER = '#e8eaed';
// Top app bar — translucent white to match HomeScreen's sticky header
const M3_SURFACE_CONTAINER = 'rgba(255, 255, 255, 0.85)';
const M3_OUTLINE_VARIANT = 'rgba(232, 234, 237, 0.9)';
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
	return <span aria-hidden className="inline-block w-px h-3" style={{ background: DIVIDER }} />;
}

// ─── Hero Art — procedural SVG block that fills the space below the title ────
//
// The right metadata column leaves a wide empty area below the title. This
// component renders a tasteful, deterministic SVG illustration (selected from
// note.id) inside a rounded warm-tone container — visually similar to an
// editorial article banner. If the note has an emoji icon, it's used as the
// focal element; otherwise an abstract geometric pattern is drawn.

const HERO_PALETTES = [
	{ bg: '#c8694b', ink: '#2a1810', soft: '#f4dcd1' }, // terracotta
	{ bg: '#5b7c63', ink: '#1f2a23', soft: '#dfe9d8' }, // sage
	{ bg: '#d4a574', ink: '#3a2812', soft: '#f5e8d3' }, // ochre
	{ bg: '#7a6b8a', ink: '#221b2c', soft: '#e6dff0' }, // mauve
	{ bg: '#3d5a6c', ink: '#0e1a25', soft: '#d8e2ea' }, // slate-blue
	{ bg: '#a85a47', ink: '#2a1208', soft: '#f0d4cb' }, // rust
] as const;

function hashString(s: string): number {
	let h = 5381;
	for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
	return Math.abs(h);
}

interface HeroArtProps {
	noteId: string;
	icon?: string | null;
}

function HeroArt({ noteId, icon }: HeroArtProps) {
	const seed = hashString(noteId);
	const palette = HERO_PALETTES[seed % HERO_PALETTES.length] ?? HERO_PALETTES[0];
	const variant = seed % 4;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.08 }}
			aria-hidden
			className="relative overflow-hidden select-none"
			style={{
				width: 140,
				height: 140,
				borderRadius: 20,
				background: palette.bg,
				marginTop: 24,
				boxShadow: `
					0 1px 2px 0 rgba(60, 50, 35, 0.10),
					0 8px 24px -8px rgba(60, 50, 35, 0.18),
					inset 0 0 0 1px rgba(255, 255, 255, 0.06)
				`,
			}}
		>
			{/* Soft inner highlight — adds a tactile, premium feel */}
			<div
				aria-hidden
				className="absolute inset-0 pointer-events-none"
				style={{
					background: `radial-gradient(120% 90% at 20% 0%, ${palette.soft}22 0%, transparent 55%)`,
				}}
			/>

			{icon ? (
				// User-set emoji icon centered in the box
				<div
					className="absolute inset-0 flex items-center justify-center"
					style={{ fontSize: 72, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' }}
				>
					{icon}
				</div>
			) : (
				// Procedural SVG art — varies by note hash for variety across notes
				<svg
					viewBox="0 0 220 220"
					width="140"
					height="140"
					className="absolute inset-0"
					style={{ display: 'block' }}
				>
					{variant === 0 && (
						// Stacked editorial blocks (echo of the screenshot's brick motif)
						<g stroke={palette.ink} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
							<rect x="62" y="120" width="44" height="34" rx="3" />
							<rect x="114" y="120" width="44" height="34" rx="3" />
							<rect x="88" y="80" width="44" height="34" rx="3" />
							<path d="M 82 78 L 102 64 L 118 70" />
							<circle cx="118" cy="70" r="3" fill={palette.ink} />
						</g>
					)}
					{variant === 1 && (
						// Open page / document with folded corner
						<g stroke={palette.ink} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
							<path d="M 70 60 L 130 60 L 150 80 L 150 160 L 70 160 Z" />
							<path d="M 130 60 L 130 80 L 150 80" />
							<line x1="84" y1="100" x2="138" y2="100" />
							<line x1="84" y1="115" x2="138" y2="115" />
							<line x1="84" y1="130" x2="120" y2="130" />
							<line x1="84" y1="145" x2="128" y2="145" />
						</g>
					)}
					{variant === 2 && (
						// Concentric arcs / sun rising — abstract hopeful motif
						<g stroke={palette.ink} strokeWidth={2.5} fill="none" strokeLinecap="round">
							<path d="M 50 150 Q 110 70, 170 150" />
							<path d="M 65 150 Q 110 90, 155 150" />
							<path d="M 80 150 Q 110 110, 140 150" />
							<line x1="40" y1="160" x2="180" y2="160" />
							<circle cx="110" cy="65" r="6" fill={palette.ink} />
						</g>
					)}
					{variant === 3 && (
						// Folded paper / origami feather
						<g stroke={palette.ink} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
							<path d="M 60 150 L 100 60 L 160 90 L 130 160 Z" />
							<path d="M 100 60 L 130 160" />
							<path d="M 60 150 L 160 90" />
							<circle cx="160" cy="90" r="3" fill={palette.ink} />
						</g>
					)}
				</svg>
			)}
		</motion.div>
	);
}

// ─── Editorial metadata row — icon + label + value (Anthropic-style) ─────────

interface MetaRowProps {
	icon: Parameters<typeof Icon>[0]['icon'];
	label: string;
	children: React.ReactNode;
}

function MetaRow({ icon, label, children }: MetaRowProps) {
	return (
		<div className="flex items-start gap-2.5">
			<Icon
				icon={icon}
				size={14}
				strokeWidth={1.6}
				style={{ color: '#5f6368', marginTop: 4, flexShrink: 0 }}
			/>
			<div className="flex flex-col gap-0.5 min-w-0">
				<span
					style={{
						fontSize: 11,
						color: '#5f6368',
						fontWeight: 500,
						letterSpacing: '0.01em',
						lineHeight: 1.3,
					}}
				>
					{label}
				</span>
				<div
					style={{
						fontSize: 13.5,
						color: '#202124',
						fontWeight: 450,
						lineHeight: 1.45,
						letterSpacing: '-0.005em',
					}}
				>
					{children}
				</div>
			</div>
		</div>
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
							style={{ color: '#5f6368' }}
						/>
					)}
					<motion.button
						type="button"
						onClick={() => onSelectNote(folder.id)}
						whileTap={{ scale: 0.95 }}
						className="group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5"
						style={{
							fontSize: 12,
							color: '#3c4043',
							fontWeight: 500,
							transition: `background-color 140ms ${EASE_OUT}`,
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f3f4')}
						onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
					>
						<Icon
							icon={Folder01Icon}
							size={12}
							strokeWidth={1.5}
							style={{ color: '#5f6368' }}
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
					style={{ color: '#5f6368' }}
				/>
			</motion.span>

			{/* Current note name */}
			<motion.span
				className="inline-flex items-center gap-1"
				style={{ fontSize: 12, color: '#202124', fontWeight: 500 }}
				initial={{ opacity: 0, x: -4 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.18, delay: (folderPath.length + 1) * 0.04, ease: [0.23, 1, 0.32, 1] }}
			>
				<Icon
					icon={File01Icon}
					size={12}
					strokeWidth={1.5}
					style={{ color: '#5f6368' }}
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
						onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f3f4')}
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
									? '#1e8e3e'
									: shareStatus === 'error'
										? '#d93025'
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

				<div className={wideMode ? 'w-full px-4 pb-28 pt-6 sm:px-8 md:px-16 md:pb-40 md:pt-20' : 'mx-auto max-w-[1180px] px-4 pb-28 pt-6 sm:px-8 md:px-16 md:pb-40 md:pt-20'}>
					{/* ── Editorial two-column header: main content + right metadata column ── */}
					<div className="md:grid md:grid-cols-[minmax(0,1fr)_220px] md:gap-x-16">
						{/* ── Main column: breadcrumbs + title + tags ── */}
						<div className="min-w-0">
							<div className="editor-stagger-1">
								<Breadcrumbs note={note} notes={notes} tree={tree} onSelectNote={onSelectNote} />
							</div>

							{note.tags?.includes('daily') ? (
								<DailyHeader note={note} />
							) : (
								<div className="editor-stagger-2">
									{/* Flat editorial title — no card, no rail. Just the serif headline. */}
									<div style={{ marginTop: 4, marginBottom: 0 }}>
										<NoteBanner
											noteId={note.id}
											title={note.title}
											icon={note.icon}
											onTitleChange={(title) => onUpdateNote(note.id, { title })}
											onTitleKeyDown={handleTitleKeyDown}
										/>
									</div>
									{/* Hero art — fills the negative space below the title (desktop only,
									       since on mobile the metadata sits directly under the title) */}
									<div className="hidden md:block">
										<HeroArt noteId={note.id} icon={note.icon} />
									</div>
								</div>
							)}
						</div>

						{/* ── Right metadata column (desktop only) ── */}
						<aside className="hidden md:block editor-stagger-2">
							<div className="flex flex-col gap-5" style={{ paddingTop: 6 }}>
								{!note.tags?.includes('daily') && (
									<MetaRow icon={Calendar03Icon} label="Created">
										{createdAtLabel}
									</MetaRow>
								)}
								<MetaRow icon={Clock01Icon} label="Reading time">
									{readTime || '—'}
								</MetaRow>
								<MetaRow icon={BookOpen01Icon} label="Word count">
									<span style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>
										<SpringNumber value={wordCount} /> words
									</span>
									{sessionDelta > 0 && (
										<motion.span
											key="meta-session-delta"
											initial={{ scale: 0.7, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											transition={{ type: 'spring', stiffness: 500, damping: 22 }}
											className="ml-2 inline-flex items-center gap-0.5 font-semibold tabular-nums"
											style={{ color: '#1e8e3e', fontSize: 12 }}
										>
											<Icon icon={FireIcon} size={10} strokeWidth={2.2} />
											+{sessionDelta.toLocaleString()}
										</motion.span>
									)}
								</MetaRow>
								<MetaRow icon={Tag01Icon} label="Tags">
									<TagInput
										tags={note.tags || []}
										onChange={(tags) => onUpdateNote(note.id, { tags }, { skipTimestamp: true })}
									/>
								</MetaRow>
								<MetaRow icon={Share01Icon} label="Share">
									<button
										type="button"
										onClick={handleShareNote}
										disabled={shareStatus === 'sharing'}
										className="text-left underline-offset-4 hover:underline transition-colors"
										style={{
											color:
												shareStatus === 'copied'
													? '#1e8e3e'
													: shareStatus === 'error'
														? '#d93025'
														: '#202124',
											background: 'transparent',
											padding: 0,
											fontSize: 13.5,
											fontWeight: 450,
											textDecoration: 'underline',
											textDecorationColor: '#5f6368',
										}}
									>
										{shareStatus === 'sharing'
											? 'Creating link…'
											: shareStatus === 'copied'
												? 'Link copied'
												: shareStatus === 'error'
													? 'Try again'
													: 'Copy link'}
									</button>
								</MetaRow>
							</div>
						</aside>
					</div>

					{/* ── Mobile-only inline tags + meta row (compact, since no sidebar) ── */}
					{!note.tags?.includes('daily') && (
						<div className="md:hidden editor-stagger-2 mt-3">
							<div className="flex flex-nowrap items-center gap-2 min-w-0 overflow-x-auto">
								<span
									className="whitespace-nowrap shrink-0"
									style={{
										fontSize: 11,
										color: '#5f6368',
										fontWeight: 500,
										letterSpacing: '0.01em',
									}}
								>
									{createdAtLabel}
								</span>
								<StatDivider />
								<div className="min-w-0 flex-1">
									<TagInput
										tags={note.tags || []}
										onChange={(tags) => onUpdateNote(note.id, { tags }, { skipTimestamp: true })}
									/>
								</div>
							</div>
						</div>
					)}

					{/* ── Hairline divider — separates header from body (Anthropic-style) ── */}
					<div
						className="editor-stagger-3"
						style={{
							marginTop: '2.5rem',
							marginBottom: '2.5rem',
							height: 1,
							background: DIVIDER,
							opacity: 0.7,
						}}
					/>

					{/* ── Body: editor (constrained to main column width on desktop) ── */}
					<div className="editor-stagger-3">
						<div className={wideMode ? '' : 'md:max-w-[calc(100%-220px-4rem)]'}>
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

			{/* ── Stats bar — bottom strip (desktop): only save status + retry, since
			       word count / read time / share now live in the right metadata column ── */}
			<div
				className="stats-bar-desktop hidden md:flex items-center justify-end gap-3 px-6 py-2 select-none"
				style={{
					background: 'transparent',
					fontFamily: FONT,
					color: MUTED,
					fontSize: 11.5,
					letterSpacing: '0.005em',
					borderTop: `1px solid ${M3_OUTLINE_VARIANT}`,
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
								color: '#1a73e8',
								background: '#e8f0fe',
								transition: `background-color 140ms ${EASE_OUT}, transform 120ms ${EASE_OUT}`,
							}}
							onMouseEnter={(e) => (e.currentTarget.style.background = '#d2e3fc')}
							onMouseLeave={(e) => (e.currentTarget.style.background = '#e8f0fe')}
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
					// Translucent white surface — matches HomeScreen palette
					background: 'rgba(255, 255, 255, 0.92)',
					backdropFilter: 'saturate(180%) blur(18px)',
					WebkitBackdropFilter: 'saturate(180%) blur(18px)',
					// Neutral elevation
					boxShadow: `
						0 1px 2px 0 rgba(60, 64, 67, 0.20),
						0 2px 8px 2px rgba(60, 64, 67, 0.12)
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
							style={{ color: '#1e8e3e' }}
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
