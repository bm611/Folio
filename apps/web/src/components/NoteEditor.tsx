import { lazy, Suspense, useRef, useCallback, useEffect, useMemo, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import type { Editor } from '@tiptap/react';
import type { IconSvgElement } from '@hugeicons/react';
import { useAuth } from '../contexts/AuthContext';
import {
	AlertCircleIcon,
	Calendar01Icon,
	CloudSavingDone01Icon,
	CloudOffIcon,
	Loading01Icon,
	Moon02Icon,
	Sun01Icon,
	SunCloud02Icon,
	SidebarLeftIcon,
	CommandIcon,
	Add01Icon,
	Logout01Icon,
	CloudUploadIcon,
	ArrowLeft01Icon,
	StarIcon,
	FireIcon,
	File01Icon,
	Clock01Icon,
	File01Icon as FileText01Icon,
	Download01Icon,
	Home01Icon,
	Folder01Icon,
	ArrowRight01Icon
} from '@hugeicons/core-free-icons';

import Icon from './Icon';
import { CATEGORY_ICON_MAP } from '../config/categoryIcons';
import SettingsMenu from './SettingsMenu';
import {
	countBodyWords,
	estimateReadTime,
	formatCreatedAt,
	getNoteDisplayTitle
} from '../utils/noteMeta';

import { exportNoteAsMarkdown } from '../utils/exportNote';
import TagInput from './TagInput';
import DailyHeader from './DailyHeader';
import AccentPicker from './AccentPicker';
import type { EditorApi } from './LiveMarkdownEditor';
import MobileEditorToolbar from './MobileEditorToolbar';
import NoteBanner from './NoteBanner';
import type { NoteFile, TreeNode } from '../types';
import { getBreadcrumbPath } from '../utils/tree';

const LiveMarkdownEditor = lazy(() => import('./LiveMarkdownEditor'));

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaveStatus {
	state: 'syncing' | 'saved' | 'offline' | 'error' | 'demo';
	label: string;
	detail: string;
	error: string | null;
	canRetry: boolean;
}

interface SyncStatus {
	state: string;
	message?: string;
	error?: string | null;
}

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

interface SaveBadgeMeta {
	icon: IconSvgElement;
	toneClassName: string;
	spin: boolean;
}

const POPOVER_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const;

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
	
	// Generate sparkle positions
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
		
		// Trigger animation when favoriting (not unfavoriting)
		if (!wasFavorite) {
			setIsAnimating(true);
			setTimeout(() => setIsAnimating(false), 600);
		}
	};

	return (
		<motion.button
			type="button"
			onClick={handleClick}
			className="hidden md:relative md:flex h-10 w-10 items-center justify-center rounded-lg border border-transparent transition-colors duration-150 ease-out hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2"
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
	// Use tree if available (has nested structure), otherwise fall back to notes
	const source = tree && tree.length > 0 ? tree : notes;
	const folderPath = useMemo(() => getBreadcrumbPath(source, note.id), [source, note.id]);

	// Only show breadcrumbs if the note has parent folders
	if (folderPath.length === 0) return null;

	const noteName = note.title || note.name || 'Untitled';

	return (
		<motion.div
			initial={{ opacity: 0, y: -4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
			className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] mb-3"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
	const now = Date.now();
	const diff = now - date.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30);

	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes} min ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	if (weeks < 5) return `${weeks}w ago`;
	return `${months}mo ago`;
}

function getComparableTimestamp(value: string | undefined | null): number {
	const parsed = Date.parse(value || '');
	return Number.isNaN(parsed) ? 0 : parsed;
}

function compareRecentNotes(a: NoteFile, b: NoteFile): number {
	const updatedDiff =
		getComparableTimestamp(b.updatedAt || b.createdAt) -
		getComparableTimestamp(a.updatedAt || a.createdAt);

	if (updatedDiff !== 0) {
		return updatedDiff;
	}

	const createdDiff = getComparableTimestamp(b.createdAt) - getComparableTimestamp(a.createdAt);
	if (createdDiff !== 0) {
		return createdDiff;
	}

	const titleDiff = getNoteDisplayTitle(a).localeCompare(getNoteDisplayTitle(b));
	if (titleDiff !== 0) {
		return titleDiff;
	}

	return a.id.localeCompare(b.id);
}

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

// ── Favorites empty state ────────────────────────────────────────────────────
function FavoritesEmptyPrompt() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
			className="flex flex-col items-center justify-center py-12 px-4 gap-6 select-none h-full"
		>
			{/* Animated illustration */}
			<div className="relative w-48 h-44">
				<svg
					viewBox="0 0 192 176"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full"
					aria-hidden="true"
				>
					{/* Glow backdrop */}
					<motion.ellipse
						cx="96"
						cy="110"
						rx="64"
						ry="18"
						fill="var(--accent)"
						initial={{ opacity: 0, scaleX: 0.4 }}
						animate={{ opacity: [0.06, 0.12, 0.06], scaleX: [0.8, 1, 0.8] }}
						transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
					/>

					{/* Back star — tilted left */}
					<motion.g
						initial={{ opacity: 0, y: 14, rotate: -10 }}
						animate={{ opacity: 1, y: 0, rotate: -6 }}
						transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
						style={{ transformOrigin: '96px 95px' }}
					>
						<motion.path
							d="M 96 34 L 108.9 63.8 L 140 66.2 L 116.3 87 L 123.6 117.4 L 96 100.8 L 68.4 117.4 L 75.6 87 L 52 66.2 L 83 63.8 Z"
							fill="var(--bg-elevated)"
							stroke="var(--border-subtle)"
							strokeWidth="1.2"
							animate={{ y: [0, -3, 0] }}
							transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
						/>
					</motion.g>

					{/* Front star — slight right tilt */}
					<motion.g
						initial={{ opacity: 0, y: 20, rotate: 8 }}
						animate={{ opacity: 1, y: 0, rotate: 4 }}
						transition={{ duration: 0.65, delay: 0.55, ease: [0.25, 1, 0.5, 1] }}
						style={{ transformOrigin: '96px 95px' }}
					>
						<motion.path
							d="M 96 34 L 108.9 63.8 L 140 66.2 L 116.3 87 L 123.6 117.4 L 96 100.8 L 68.4 117.4 L 75.6 87 L 52 66.2 L 83 63.8 Z"
							fill="var(--bg-surface)"
							stroke="var(--border-default)"
							strokeWidth="1.2"
							strokeLinejoin="round"
							animate={{ y: [0, -5, 0], rotate: [4, 5.5, 4] }}
							transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
							style={{ transformOrigin: '96px 78px' }}
						/>
						{/* Accent inner shape */}
						<motion.path
							d="M 96 34 L 108.9 63.8 L 140 66.2 L 116.3 87 L 123.6 117.4 L 96 100.8 L 68.4 117.4 L 75.6 87 L 52 66.2 L 83 63.8 Z"
							fill="var(--accent)"
							opacity="0.18"
							animate={{ opacity: [0.18, 0.28, 0.18], scale: [0.95, 1, 0.95] }}
							transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
							style={{ transformOrigin: '96px 78px' }}
						/>
					</motion.g>

					{/* Orbiting sparkle ring */}
					<motion.g
						animate={{ rotate: 360 }}
						transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
						style={{ transformOrigin: '96px 78px' }}
					>
						{[0, 72, 144, 216, 288].map((deg, i) => {
							const rad = (deg * Math.PI) / 180;
							const r = 66;
							const cx = 96 + r * Math.cos(rad);
							const cy = 78 + r * Math.sin(rad);
							return (
								<motion.circle
									key={deg}
									cx={cx}
									cy={cy}
									r={i % 2 === 0 ? 2.5 : 1.5}
									fill={i % 2 === 0 ? 'var(--accent)' : 'var(--color-h2)'}
									animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.2, 0.8] }}
									transition={{
										duration: 2.5,
										repeat: Infinity,
										ease: 'easeInOut',
										delay: i * 0.4
									}}
									style={{ transformOrigin: `${cx}px ${cy}px` }}
								/>
							);
						})}
					</motion.g>

					{/* Floating ink drops */}
					{[
						{ x: 32, y: 44, delay: 0.8, color: 'var(--accent)' },
						{ x: 158, y: 58, delay: 1.4, color: 'var(--color-h2)' },
						{ x: 148, y: 128, delay: 2.1, color: 'var(--success)' }
					].map(({ x, y, delay, color }, i) => (
						<motion.circle
							key={i}
							cx={x}
							cy={y}
							r="3.5"
							fill={color}
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: [0, 0.6, 0], scale: [0, 1, 0], y: [0, -12, -20] }}
							transition={{
								duration: 2.8,
								delay,
								repeat: Infinity,
								repeatDelay: 2,
								ease: 'easeOut'
							}}
						/>
					))}
				</svg>
			</div>

			{/* Text */}
			<motion.div
				className="flex flex-col items-center gap-2 text-center"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.8 }}
			>
				<p
					className="text-[22px] font-medium text-[var(--text-primary)] tracking-tight"
					style={{ fontFamily: 'var(--font-display)' }}
				>
					No favorites yet.
				</p>
				<p className="text-[14px] text-[var(--text-muted)] max-w-[240px] leading-relaxed">
					Star your most important notes to keep them handy here.
				</p>
			</motion.div>
		</motion.div>
	);
}

// ── First-note empty state ───────────────────────────────────────────────────
function FirstNotePrompt() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
			className="flex flex-col items-center justify-center py-12 px-4 gap-6 select-none h-full"
		>
			{/* Animated illustration */}
			<div className="relative w-48 h-44">
				<svg
					viewBox="0 0 192 176"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full"
					aria-hidden="true"
				>
					{/* Glow backdrop */}
					<motion.ellipse
						cx="96"
						cy="110"
						rx="64"
						ry="18"
						fill="var(--accent)"
						initial={{ opacity: 0, scaleX: 0.4 }}
						animate={{ opacity: [0.06, 0.12, 0.06], scaleX: [0.8, 1, 0.8] }}
						transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
					/>

					{/* Back paper — tilted left */}
					<motion.g
						initial={{ opacity: 0, y: 14, rotate: -10 }}
						animate={{ opacity: 1, y: 0, rotate: -6 }}
						transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
						style={{ transformOrigin: '96px 95px' }}
					>
						<motion.rect
							x="44"
							y="30"
							width="88"
							height="112"
							rx="10"
							fill="var(--bg-elevated)"
							stroke="var(--border-subtle)"
							strokeWidth="1.2"
							animate={{ y: [0, -3, 0] }}
							transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
						/>
						{/* Lines on back paper */}
						{[55, 68, 81, 94].map((y, i) => (
							<motion.line
								key={y}
								x1="58"
								y1={y}
								x2="118"
								y2={y}
								stroke="var(--border-subtle)"
								strokeWidth="1.5"
								strokeLinecap="round"
								initial={{ pathLength: 0, opacity: 0 }}
								animate={{ pathLength: 1, opacity: 1 }}
								transition={{ duration: 0.5, delay: 0.7 + i * 0.08 }}
							/>
						))}
					</motion.g>

					{/* Front paper — slight right tilt */}
					<motion.g
						initial={{ opacity: 0, y: 20, rotate: 8 }}
						animate={{ opacity: 1, y: 0, rotate: 4 }}
						transition={{ duration: 0.65, delay: 0.55, ease: [0.25, 1, 0.5, 1] }}
						style={{ transformOrigin: '96px 95px' }}
					>
						<motion.rect
							x="52"
							y="22"
							width="88"
							height="112"
							rx="10"
							fill="var(--bg-surface)"
							stroke="var(--border-default)"
							strokeWidth="1.2"
							animate={{ y: [0, -5, 0], rotate: [4, 5.5, 4] }}
							transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
							style={{ transformOrigin: '96px 78px' }}
						/>
						{/* Accent top bar */}
						<motion.rect
							x="52"
							y="22"
							width="88"
							height="22"
							rx="10"
							fill="var(--accent)"
							opacity="0.18"
							animate={{ opacity: [0.18, 0.28, 0.18] }}
							transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
						/>
						{/* Pen/cursor icon on front paper */}
						<motion.g
							animate={{ y: [0, -2, 0], rotate: [0, 3, 0] }}
							transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
							style={{ transformOrigin: '96px 70px' }}
						>
							{/* Pen body */}
							<motion.path
								d="M89 62 L103 48 L111 56 L97 70 Z"
								fill="var(--accent)"
								opacity="0.9"
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 0.9 }}
								transition={{ duration: 0.4, delay: 1 }}
								style={{ transformOrigin: '100px 59px' }}
							/>
							{/* Pen tip */}
							<motion.path
								d="M97 70 L93 74 L96 71 Z"
								fill="var(--accent)"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1.2 }}
							/>
							{/* Pen highlight */}
							<motion.line
								x1="92"
								y1="66"
								x2="100"
								y2="58"
								stroke="white"
								strokeWidth="1"
								strokeLinecap="round"
								opacity="0.3"
								initial={{ pathLength: 0 }}
								animate={{ pathLength: 1 }}
								transition={{ duration: 0.3, delay: 1.1 }}
							/>
						</motion.g>
						{/* Placeholder lines */}
						{[90, 103, 116].map((y, i) => (
							<motion.line
								key={y}
								x1="66"
								y1={y}
								x2={i === 2 ? '110' : '126'}
								y2={y}
								stroke="var(--border-subtle)"
								strokeWidth="1.5"
								strokeLinecap="round"
								initial={{ pathLength: 0, opacity: 0 }}
								animate={{ pathLength: 1, opacity: 1 }}
								transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
							/>
						))}
					</motion.g>

					{/* Orbiting sparkle ring */}
					<motion.g
						animate={{ rotate: 360 }}
						transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
						style={{ transformOrigin: '96px 78px' }}
					>
						{[0, 72, 144, 216, 288].map((deg, i) => {
							const rad = (deg * Math.PI) / 180;
							const r = 66;
							const cx = 96 + r * Math.cos(rad);
							const cy = 78 + r * Math.sin(rad);
							return (
								<motion.circle
									key={deg}
									cx={cx}
									cy={cy}
									r={i % 2 === 0 ? 2.5 : 1.5}
									fill={i % 2 === 0 ? 'var(--accent)' : 'var(--color-h2)'}
									animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.2, 0.8] }}
									transition={{
										duration: 2.5,
										repeat: Infinity,
										ease: 'easeInOut',
										delay: i * 0.4
									}}
									style={{ transformOrigin: `${cx}px ${cy}px` }}
								/>
							);
						})}
					</motion.g>

					{/* Floating ink drops */}
					{[
						{ x: 32, y: 44, delay: 0.8, color: 'var(--accent)' },
						{ x: 158, y: 58, delay: 1.4, color: 'var(--color-h2)' },
						{ x: 148, y: 128, delay: 2.1, color: 'var(--success)' }
					].map(({ x, y, delay, color }, i) => (
						<motion.circle
							key={i}
							cx={x}
							cy={y}
							r="3.5"
							fill={color}
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: [0, 0.6, 0], scale: [0, 1, 0], y: [0, -12, -20] }}
							transition={{
								duration: 2.8,
								delay,
								repeat: Infinity,
								repeatDelay: 2,
								ease: 'easeOut'
							}}
						/>
					))}
				</svg>
			</div>

			{/* Text */}
			<motion.div
				className="flex flex-col items-center gap-2 text-center"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.8 }}
			>
				<p
					className="text-[22px] font-medium text-[var(--text-primary)] tracking-tight"
					style={{ fontFamily: 'var(--font-display)' }}
				>
					Your canvas is empty.
				</p>
				<p className="text-[14px] text-[var(--text-muted)] max-w-[240px] leading-relaxed">
					Every great idea starts somewhere. Write your first note.
				</p>
			</motion.div>
		</motion.div>
	);
}

function formatRelativeSaveTime(timestamp: string | null | undefined): string | null {
	if (!timestamp) {
		return null;
	}

	const parsed = new Date(timestamp);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	const diffSeconds = Math.max(0, Math.round((Date.now() - parsed.getTime()) / 1000));

	if (diffSeconds < 5) {
		return 'just now';
	}

	if (diffSeconds < 60) {
		return `${diffSeconds}s ago`;
	}

	const diffMinutes = Math.round(diffSeconds / 60);
	if (diffMinutes < 60) {
		return `${diffMinutes}m ago`;
	}

	const diffHours = Math.round(diffMinutes / 60);
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}

	const diffDays = Math.round(diffHours / 24);
	return `${diffDays}d ago`;
}

function getSaveBadgeMeta(saveStatus: SaveStatus): SaveBadgeMeta {
	switch (saveStatus.state) {
		case 'syncing':
			return {
				icon: Loading01Icon,
				toneClassName:
					'text-[var(--success)] border-[color-mix(in_srgb,var(--success)_26%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)]',
				spin: true
			};
		case 'saved':
			return {
				icon: CloudSavingDone01Icon,
				toneClassName:
					'text-[var(--success)] border-[color-mix(in_srgb,var(--success)_26%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)]',
				spin: false
			};
		case 'offline':
			return {
				icon: CloudOffIcon,
				toneClassName:
					'text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]',
				spin: false
			};
		case 'error':
			return {
				icon: AlertCircleIcon,
				toneClassName:
					'text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]',
				spin: false
			};
		case 'demo':
		default:
			return {
				icon: CloudUploadIcon,
				toneClassName:
					'text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]',
				spin: false
			};
	}
}

function getSaveTextClass(state: string): string {
	if (state === 'syncing' || state === 'saved') return 'text-[var(--success)]';
	if (state === 'error') return 'text-[var(--danger)]';
	return 'text-[var(--warning)]';
}

// ── Time-aware greeting ───────────────────────────────────────────────────────
function getTimeGreeting(): string {
	const h = new Date().getHours()
	if (h < 12) return 'Good morning.'
	if (h < 17) return 'Good afternoon.'
	return 'Good evening.'
}


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
	onWideModeChange
}: NoteEditorProps) {
	const { user, signOut } = useAuth();

	// Flat file notes for reuse across home screen and editor
	const fileNotes = useMemo(() => notes.filter((n): n is NoteFile => n.type === 'file'), [notes]);

	// Calculate writing streak and total words for personalized greeting
	const { streak, totalWords } = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const sortedNotes = [...fileNotes].sort(
			(a, b) =>
				new Date(b.updatedAt || b.createdAt).getTime() -
				new Date(a.updatedAt || a.createdAt).getTime()
		);

		let streak = 0;
		const currentDate = new Date(today);

		// Check for consecutive days with activity
		for (let i = 0; i < 365; i++) {
			// Check up to a year
			const dayStart = new Date(currentDate);
			const dayEnd = new Date(currentDate);
			dayEnd.setHours(23, 59, 59, 999);

			const hasActivityOnDay = sortedNotes.some((note) => {
				const noteDate = new Date(note.updatedAt || note.createdAt);
				return noteDate >= dayStart && noteDate <= dayEnd;
			});

			if (hasActivityOnDay) {
				streak++;
				currentDate.setDate(currentDate.getDate() - 1);
			} else {
				break;
			}
		}

		const totalWords = sortedNotes.reduce((sum, note) => sum + countBodyWords(note.content), 0);

		return { streak, totalWords };
	}, [fileNotes]);

	// Generate motivational message based on streak and recent activity
	const getMotivationalMessage = (streak: number) => {
		if (streak === 0) return 'What will you write today?';
		if (streak === 1) return 'Day one. The beginning of something.';
		if (streak < 7) return `${streak} days in. You're building something real.`;
		if (streak < 30) return `${streak}-day streak. Consistency is your superpower.`;
		return `${streak} days strong. You're unstoppable.`;
	};

	// Last 7 days activity for streak visualization
	const last7DaysActivity = useMemo(() => {
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date()
			d.setDate(d.getDate() - (6 - i))
			d.setHours(0, 0, 0, 0)
			const end = new Date(d)
			end.setHours(23, 59, 59, 999)
			return fileNotes.some(n => {
				const nd = new Date(n.updatedAt || n.createdAt)
				return nd >= d && nd <= end
			})
		})
	}, [fileNotes])

	// Mobile home tab state (Recent / Favorites)
	const [homeTab, setHomeTab] = useState<'recent' | 'favorites'>('recent');
	const [favExpanded, setFavExpanded] = useState(false);

	// Session word count: capture baseline when a note is first opened
	const prevNoteIdRef = useRef<string | null>(null);
	const [sessionBase, setSessionBase] = useState<number | null>(null);
	const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

	// Reset session baseline whenever the active note changes
	useEffect(() => {
		if (!note) return;
		if (note.id !== prevNoteIdRef.current) {
			prevNoteIdRef.current = note.id;
			setSessionBase(countBodyWords(note.content));
		}
	}, [note]);

	// Keeps a local reference to the editor API so the title input can focus it
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

	if (!note) {
		const recentNotes = [...fileNotes].sort(compareRecentNotes).slice(0, 5);

		// Mobile and desktop home surfaces show a short favorites list — max 6
		const rawFavorites = [...fileNotes]
			.filter(
				(n) => n.tags?.includes('favorite') || (n as NoteFile & { isFavorite?: boolean }).isFavorite
			)
			.sort(compareRecentNotes);
		const favoriteNotes = rawFavorites.slice(0, 6);

		return (
			<div className="flex flex-1 min-w-0 flex-col max-md:rounded-none rounded-2xl bg-[var(--bg-primary)]">
				{/* Top bar */}
				<div className="flex items-center justify-between px-4 py-2 md:px-6">
					{sidebarCollapsed ? (
						<button
							type="button"
							onClick={onToggleSidebar}
							className="hidden md:relative md:flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.96]"
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
					<div className="ml-auto flex items-center gap-1.5 md:gap-2">
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
						/>
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
								className="auth-pill auth-pill--signed-out h-10 px-4"
								title="Sign in to sync your notes"
								style={{ fontFamily: '"Outfit", sans-serif' }}
							>
								<Icon icon={CloudUploadIcon} size={18} strokeWidth={2} />
								<span>Sign in</span>
							</button>
						)}
					</div>
				</div>

				{/* Welcome content */}
				<div className="flex flex-1 flex-col items-center px-6 pt-[5vh] md:pt-[5vh] pb-36 md:pb-6 overflow-y-auto">
					<div className="animate-fade-in-up flex flex-col items-center text-center">
						<h1
							className="text-[28px] sm:text-[32px] font-bold tracking-tight mb-1.5"
							style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
						>
							{getTimeGreeting()}
						</h1>
						<p
							className="text-[14px] mb-5 max-w-xs leading-relaxed"
							style={{ fontFamily: '"Outfit", sans-serif', color: 'var(--text-secondary)' }}
						>
							{getMotivationalMessage(streak)}
						</p>

						{/* Stat badges */}
						<div className="flex items-center gap-2.5 mb-5 flex-wrap justify-center" style={{ fontFamily: '"Outfit", sans-serif' }}>
							<span
								className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
								style={{
									background: 'color-mix(in srgb, var(--success) 14%, transparent)',
									color: 'var(--success)',
								}}
							>
								<Icon icon={File01Icon} size={13} strokeWidth={2.2} />
								{fileNotes.length} {fileNotes.length === 1 ? 'note' : 'notes'}
							</span>
							<span
								className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
								style={{
									background: 'color-mix(in srgb, var(--warning) 14%, transparent)',
									color: 'var(--warning)',
								}}
							>
								<Icon icon={FireIcon} size={13} strokeWidth={2.2} />
								{streak} day streak
							</span>
							<span
								className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
								style={{
									background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
									color: 'var(--accent)',
								}}
							>
								<Icon icon={FileText01Icon} size={13} strokeWidth={2.2} />
								{totalWords.toLocaleString()} words
							</span>
						</div>

						{/* 7-day activity strip */}
						<div className="flex items-end gap-1.5 mb-1" title="Writing activity — last 7 days">
							{last7DaysActivity.map((active, i) => {
								const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
								const todayDow = new Date().getDay()
								const label = DAY_LABELS[((todayDow - 6 + i) % 7 + 7) % 7]
								const isToday = i === 6
								return (
									<div key={i} className="flex flex-col items-center gap-1">
										<motion.div
											className="w-7 h-7 rounded-lg flex items-center justify-center"
											style={{
												background: active
													? 'color-mix(in srgb, var(--accent) 20%, transparent)'
													: 'var(--bg-elevated)',
												border: `1.5px solid ${active
													? 'color-mix(in srgb, var(--accent) 42%, transparent)'
													: isToday
														? 'color-mix(in srgb, var(--accent) 30%, var(--border-subtle))'
														: 'var(--border-subtle)'}`,
											}}
											initial={{ scale: 0.7, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											transition={{ delay: i * 0.06, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
										>
											{active && (
												<motion.span
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													transition={{ delay: i * 0.06 + 0.15, type: 'spring', stiffness: 420, damping: 18 }}
												>
													<Icon icon={FireIcon} size={13} strokeWidth={2} style={{ color: 'var(--accent)' }} />
												</motion.span>
											)}
										</motion.div>
										<span
											className="text-[9px] font-semibold uppercase tracking-wide"
											style={{
												fontFamily: '"Outfit", sans-serif',
												color: isToday ? 'var(--accent)' : 'var(--text-muted)',
												opacity: isToday ? 1 : 0.55,
											}}
										>
											{label}
										</span>
									</div>
								)
							})}
						</div>
					</div>

					<div className="animate-fade-in-up-delay-2 mt-8 mb-2 flex items-center justify-center w-full max-w-md">
						<div className="flex items-center gap-3 w-full justify-center px-4 sm:px-0">
							<motion.button
								onClick={() => onNewNote?.()}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.96 }}
								className="neu-btn-primary group relative inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-transparent bg-[var(--accent)] px-3 py-4 text-[14px] font-medium text-white shadow-[0_4px_20px_var(--accent)]/30 transition-[transform,filter,box-shadow] duration-300 hover:brightness-110 hover:shadow-[0_4px_24px_var(--accent)]/50 active:scale-[0.96] sm:px-6 sm:text-[15px]"
								style={{ fontFamily: '"Outfit", sans-serif' }}
							>
								<Icon
									icon={Add01Icon}
									size={20}
									strokeWidth={2.5}
									className="shrink-0 transition-transform duration-300 group-hover:rotate-90"
									style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))' }}
								/>
								<span className="truncate tracking-wide">New Note</span>
							</motion.button>
							<motion.button
								onClick={() => onCreateDailyNote?.()}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.96 }}
								className="group relative inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-4 text-[14px] font-medium text-[var(--accent)] transition-[transform,background-color,border-color,box-shadow] duration-300 hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/30 hover:shadow-[0_2px_12px_var(--accent)]/20 active:scale-[0.96] sm:px-6 sm:text-[15px]"
								style={{ fontFamily: '"Outfit", sans-serif' }}
							>
								<Icon
									icon={Calendar01Icon}
									size={20}
									strokeWidth={2}
									className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
								/>
								<span className="truncate tracking-wide">Daily Note</span>
							</motion.button>
						</div>
					</div>

					{/* ── Mobile Tab View ─────────────────────────────────── */}
					<div
						className="animate-fade-in-up-delay-2 mt-8 w-full px-4 md:hidden"
						style={{ fontFamily: '"Outfit", sans-serif' }}
					>
						{/* Tab bar */}
						<div className="relative mb-6 flex border-b border-[var(--border-subtle)]">
							<button
								type="button"
								onClick={() => setHomeTab('recent')}
								className="relative flex flex-1 items-center justify-center gap-2 pb-3 pt-1 text-[14px] font-medium tracking-wide transition-colors duration-150"
								style={{
									color: homeTab === 'recent' ? 'var(--text-primary)' : 'var(--text-muted)'
								}}
							>
								<Icon
									icon={Clock01Icon}
									size={17}
									strokeWidth={2}
									style={{
										color: homeTab === 'recent' ? 'var(--accent)' : 'var(--text-muted)',
										transition: 'color 150ms'
									}}
								/>
								Recent
								{homeTab === 'recent' && (
									<motion.div
										layoutId="home-tab-underline"
										className="absolute bottom-0 left-1/2 h-[2px] w-16 -translate-x-1/2 rounded-full bg-[var(--accent)]"
										transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
									/>
								)}
							</button>
							<button
								type="button"
								onClick={() => setHomeTab('favorites')}
								className="relative flex flex-1 items-center justify-center gap-2 pb-3 pt-1 text-[14px] font-medium tracking-wide transition-colors duration-150"
								style={{
									color: homeTab === 'favorites' ? 'var(--text-primary)' : 'var(--text-muted)'
								}}
							>
								<Icon
									icon={StarIcon}
									size={17}
									strokeWidth={2}
									style={{
										color: homeTab === 'favorites' ? 'var(--warning)' : 'var(--text-muted)',
										transition: 'color 150ms'
									}}
								/>
								Favorites
								{homeTab === 'favorites' && (
									<motion.div
										layoutId="home-tab-underline"
										className="absolute bottom-0 left-1/2 h-[2px] w-20 -translate-x-1/2 rounded-full bg-[var(--accent)]"
										transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
									/>
								)}
							</button>
						</div>

						{/* Tab content with AnimatePresence crossfade */}
						<div className="relative overflow-hidden">
							<AnimatePresence mode="wait" initial={false}>
								{homeTab === 'recent' ? (
									<motion.div
										key="recent"
										initial={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
										animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
										exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
										transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
									>
										{recentNotes.length > 0 ? (
											<div className="flex flex-col divide-y divide-[var(--border-subtle)]/50">
												{recentNotes.map((n, i) => {
													const isDaily = n.tags?.includes('daily');
													const rawTitle = getNoteDisplayTitle(n);
													const date = new Date(n.updatedAt || n.createdAt);
													let displayTitle = rawTitle;
													if (isDaily) {
														const parts = rawTitle.match(/^(\d{2})-(\d{2})-(\d{4})$/);
														if (parts) {
															const [, dd, mm, yyyy] = parts;
															const d = new Date(`${yyyy}-${mm}-${dd}`);
															const readable = d.toLocaleDateString('en-GB', {
																day: 'numeric',
																month: 'short',
																year: 'numeric'
															});
															displayTitle = `Daily \u2014 ${readable}`;
														} else {
															displayTitle = `Daily \u2014 ${rawTitle}`;
														}
													}
													return (
														<motion.button
															key={n.id}
															type="button"
															onClick={() => onSelectNote(n.id)}
															className="group flex items-center gap-3 rounded-xl px-1 py-2.5 transition-[background-color,transform] duration-150 ease-out hover:bg-[var(--bg-hover)] active:scale-[0.96]"
															initial={{ opacity: 0, y: 6 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{
																duration: 0.25,
																delay: i * 0.04,
																ease: [0.23, 1, 0.32, 1]
															}}
															style={{ WebkitTapHighlightColor: 'transparent' }}
														>
															<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]/60 text-[var(--text-muted)] transition-colors duration-150 group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent)]">
																<Icon
																	icon={n.icon && CATEGORY_ICON_MAP[n.icon] ? CATEGORY_ICON_MAP[n.icon]! : (isDaily ? Calendar01Icon : File01Icon)}
																	size={15}
																	strokeWidth={1.5}
																/>
															</div>
															<span className="truncate flex-1 text-[15px] font-medium tracking-tight text-[var(--text-primary)] text-left transition-colors duration-150 group-hover:text-[var(--accent)]">
																{displayTitle}
															</span>
															<span className="shrink-0 text-[11px] text-[var(--text-muted)] tabular-nums">
																{formatRelativeTime(date)}
															</span>
														</motion.button>
													);
												})}
											</div>
										) : (
											<div className="flex flex-col justify-center min-h-[260px]">
												<FirstNotePrompt />
											</div>
										)}
									</motion.div>
								) : (
									<motion.div
										key="favorites"
										initial={{ opacity: 0, x: 16, filter: 'blur(4px)' }}
										animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
										exit={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
										transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
									>
										{favoriteNotes.length > 0 ? (
											<>
											<div className="flex flex-col divide-y divide-[var(--border-subtle)]/50">
												{(favExpanded ? favoriteNotes : favoriteNotes.slice(0, 4)).map((n, i) => {
													const isDaily = n.tags?.includes('daily');
													const rawTitle = getNoteDisplayTitle(n);
													const date = new Date(n.updatedAt || n.createdAt);
													let displayTitle = rawTitle;
													if (isDaily) {
														const parts = rawTitle.match(/^(\d{2})-(\d{2})-(\d{4})$/);
														if (parts) {
															const [, dd, mm, yyyy] = parts;
															const d = new Date(`${yyyy}-${mm}-${dd}`);
															const readable = d.toLocaleDateString('en-GB', {
																day: 'numeric',
																month: 'short',
																year: 'numeric'
															});
															displayTitle = `Daily \u2014 ${readable}`;
														} else {
															displayTitle = `Daily \u2014 ${rawTitle}`;
														}
													}
													return (
														<motion.button
															key={n.id}
															type="button"
															onClick={() => onSelectNote(n.id)}
															initial={{ opacity: 0, y: 6 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{
																duration: 0.24,
																delay: i * 0.04,
																ease: [0.23, 1, 0.32, 1]
															}}
															className="group flex items-center gap-3 rounded-xl px-1 py-3 text-left transition-[background-color,transform] duration-150 ease-out hover:bg-[var(--bg-hover)] active:scale-[0.96]"
															style={{ WebkitTapHighlightColor: 'transparent' }}
														>
															<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]/60 text-[var(--text-muted)] transition-colors duration-150 group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent)]">
																<Icon
																	icon={n.icon && CATEGORY_ICON_MAP[n.icon] ? CATEGORY_ICON_MAP[n.icon]! : (isDaily ? Calendar01Icon : File01Icon)}
																	size={15}
																	strokeWidth={1.5}
																/>
															</div>
															<div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
																<span className="truncate text-[15px] font-medium tracking-tight text-[var(--text-primary)] transition-colors duration-150 group-hover:text-[var(--accent)]">
																	{displayTitle}
																</span>
																<span className="text-[11px] text-[var(--text-muted)] tabular-nums">
																	{formatRelativeTime(date)}
																</span>
															</div>
														</motion.button>
													);
												})}
											</div>
											{favoriteNotes.length > 4 && (
												<button
													type="button"
													onClick={() => setFavExpanded((v) => !v)}
													className="mt-2 w-full rounded-xl py-2 text-[12px] font-medium text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.96]"
													style={{ WebkitTapHighlightColor: 'transparent' }}
												>
													{favExpanded ? 'Show less' : `Show more (${favoriteNotes.length - 4})`}
												</button>
											)}
											</>
										) : (
											<div className="flex flex-col justify-center min-h-[260px]">
												<FavoritesEmptyPrompt />
											</div>
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					{/* ── Desktop Two-Column View ──────────────────────────── */}
					<div
						className="animate-fade-in-up-delay-2 mt-10 w-full max-w-[1200px] md:mt-16 hidden md:grid md:grid-cols-[4fr_5fr] lg:grid-cols-[4fr_6fr] gap-10 lg:gap-14 px-8"
						style={{ fontFamily: '"Outfit", sans-serif' }}
					>
						{/* ── Recent Column — Sleek list ────────────────────────── */}
						<div className="flex flex-col">
							<div className="mb-5 flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
									<Icon icon={Clock01Icon} size={17} strokeWidth={2} />
								</div>
								<h2 className="text-[15px] font-semibold tracking-wide text-[var(--text-primary)] letter-spacing-widest opacity-60">
									Recent
								</h2>
							</div>

							{recentNotes.length > 0 ? (
								<div className="flex flex-col divide-y divide-[var(--border-subtle)]/50">
									{recentNotes.map((n, i) => {
										const isDaily = n.tags?.includes('daily');
										const rawTitle = getNoteDisplayTitle(n);
										const date = new Date(n.updatedAt || n.createdAt);

										let displayTitle = rawTitle;
										if (isDaily) {
											const parts = rawTitle.match(/^(\d{2})-(\d{2})-(\d{4})$/);
											if (parts) {
												const [, dd, mm, yyyy] = parts;
												const d = new Date(`${yyyy}-${mm}-${dd}`);
												const readable = d.toLocaleDateString('en-GB', {
													day: 'numeric',
													month: 'short',
													year: 'numeric'
												});
												displayTitle = `Daily \u2014 ${readable}`;
											} else {
												displayTitle = `Daily \u2014 ${rawTitle}`;
											}
										}

										return (
											<motion.button
												key={n.id}
												type="button"
												onClick={() => onSelectNote(n.id)}
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.28, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
												className="group flex items-center gap-4 rounded-xl px-2 py-2.5 transition-[background-color,transform] duration-150 ease-out hover:bg-[var(--bg-hover)] active:scale-[0.96]"
												style={{ WebkitTapHighlightColor: 'transparent' }}
											>
												{/* Icon block */}
												<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]/60 text-[var(--text-muted)] transition-colors duration-150 group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent)]">
													<Icon
														icon={n.icon && CATEGORY_ICON_MAP[n.icon] ? CATEGORY_ICON_MAP[n.icon]! : (isDaily ? Calendar01Icon : File01Icon)}
														size={15}
														strokeWidth={1.5}
													/>
												</div>

												{/* Title inline with timestamp */}
												<span className="truncate flex-1 text-[15px] font-medium tracking-tight text-[var(--text-primary)] text-left transition-colors duration-150 group-hover:text-[var(--accent)]">
													{displayTitle}
												</span>
												<span className="shrink-0 text-[12px] text-[var(--text-muted)] tabular-nums transition-colors duration-150 group-hover:text-[var(--text-secondary)]">
													{formatRelativeTime(date)}
												</span>

												{/* Chevron hint */}
												<svg
													className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity duration-150 -translate-x-1 group-hover:translate-x-0 transition-transform"
													width="14"
													height="14"
													viewBox="0 0 14 14"
													fill="none"
													aria-hidden="true"
												>
													<path
														d="M5 3l4 4-4 4"
														stroke="currentColor"
														strokeWidth="1.5"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											</motion.button>
										);
									})}
								</div>
							) : (
								<div className="flex flex-1 flex-col justify-center min-h-[300px]">
									<FirstNotePrompt />
								</div>
							)}
						</div>

						{/* ── Favorites Column — Bento card grid ───────────────── */}
						<div className="flex flex-col">
							<div className="mb-5 flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--warning)]/10 text-[var(--warning)]">
									<Icon icon={StarIcon} size={17} strokeWidth={2} />
								</div>
								<h2 className="text-[15px] font-semibold tracking-wide text-[var(--text-primary)] letter-spacing-widest opacity-60">
									Favorites
								</h2>
							</div>

							{favoriteNotes.length > 0 ? (
								<div className="grid grid-cols-2 gap-3">
									{favoriteNotes.map((n, i) => {
										const isDaily = n.tags?.includes('daily');
										const rawTitle = getNoteDisplayTitle(n);
										const date = new Date(n.updatedAt || n.createdAt);

										let displayTitle = rawTitle;
										if (isDaily) {
											const parts = rawTitle.match(/^(\d{2})-(\d{2})-(\d{4})$/);
											if (parts) {
												const [, dd, mm, yyyy] = parts;
												const d = new Date(`${yyyy}-${mm}-${dd}`);
												const readable = d.toLocaleDateString('en-GB', {
													day: 'numeric',
													month: 'short',
													year: 'numeric'
												});
												displayTitle = `Daily \u2014 ${readable}`;
											} else {
												displayTitle = `Daily \u2014 ${rawTitle}`;
											}
										}

										return (
											<motion.button
												key={n.id}
												type="button"
												onClick={() => onSelectNote(n.id)}
												initial={{ opacity: 0, scale: 0.95 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ duration: 0.3, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}
												className="group relative flex flex-col items-start justify-between overflow-hidden rounded-xl border border-[var(--border-subtle)] px-4 py-3.5 text-left transition-[transform,box-shadow,border-color] duration-150 ease-out hover:border-[var(--border-muted)] hover:shadow-sm active:scale-[0.98]"
												style={{
													backgroundColor: 'var(--bg-surface)',
													WebkitTapHighlightColor: 'transparent',
													minHeight: '100px'
												}}
											>
												<div className="flex w-full items-start justify-between gap-3 mb-2">
													{/* Star icon */}
													<div className="relative z-10 shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)] transition-colors duration-150 group-hover:bg-[var(--accent)]/15">
														<Icon
															icon={isDaily ? Calendar01Icon : StarIcon}
															size={14}
															strokeWidth={2}
														/>
													</div>
													{/* Date */}
													<span className="relative z-10 shrink-0 text-[11px] text-[var(--text-muted)] font-medium tabular-nums mt-1">
														{formatRelativeTime(date)}
													</span>
												</div>

												{/* Title */}
												<div className="relative z-10 w-full min-w-0">
													<p className="truncate text-[15px] font-medium tracking-tight text-[var(--text-primary)] transition-colors duration-150 group-hover:text-[var(--text-primary)]">
														{displayTitle}
													</p>
												</div>
											</motion.button>
										);
									})}
								</div>
							) : (
								<div className="flex flex-1 flex-col justify-center min-h-[300px]">
									<FavoritesEmptyPrompt />
								</div>
							)}

							</div>
					</div>
				</div>
				{/* Mobile action bar */}
				<div
					className="mobile-action-bar"
					style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
				>
					<div className="mobile-bar-inner">
					<div className="mobile-action-bar-inner">
						<button type="button" onClick={onToggleSidebar}>
							<Icon icon={SidebarLeftIcon} size={18} strokeWidth={1.5} />
						</button>
						<button type="button" onClick={() => onNewNote?.()}>
							<Icon icon={Add01Icon} size={18} strokeWidth={1.5} />
						</button>
						{onOpenCommandPalette && (
							<button type="button" onClick={onOpenCommandPalette}>
								<Icon icon={CommandIcon} size={18} strokeWidth={1.5} />
							</button>
						)}
						<AccentPicker
							accentId={accentId}
							onAccentChange={onAccentChange}
							theme={theme}
							mobile
						/>
						<button
							type="button"
							onClick={onCycleTheme}
							className="transition-transform duration-150 ease-out active:scale-[0.96]"
							aria-label="Cycle theme"
						>
							<span className="relative flex h-[18px] w-[18px] items-center justify-center">
								<motion.span className="absolute inset-0 flex items-center justify-center" initial={false}
									animate={{ opacity: theme === 'dark' ? 1 : 0, scale: theme === 'dark' ? 1 : 0.25 }}
									transition={POPOVER_TRANSITION}>
									<Icon icon={Moon02Icon} size={18} strokeWidth={1.5} />
								</motion.span>
								<motion.span className="absolute inset-0 flex items-center justify-center" initial={false}
									animate={{ opacity: theme === 'light' ? 1 : 0, scale: theme === 'light' ? 1 : 0.25 }}
									transition={POPOVER_TRANSITION}>
									<Icon icon={Sun01Icon} size={18} strokeWidth={1.5} />
								</motion.span>
								<motion.span className="absolute inset-0 flex items-center justify-center" initial={false}
									animate={{ opacity: theme === 'playful' ? 1 : 0, scale: theme === 'playful' ? 1 : 0.25 }}
									transition={POPOVER_TRANSITION}>
									<Icon icon={SunCloud02Icon} size={18} strokeWidth={1.5} style={{ color: '#e8602a' }} />
								</motion.span>
							</span>
						</button>
					</div>
					</div>
				</div>
			</div>
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
		<div className="relative flex flex-1 min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-2xl bg-[var(--bg-primary)] transition-[border-radius] duration-300 max-md:rounded-none">

			<div className="relative z-20 flex items-center justify-between px-4 py-2 md:px-6">
				<div className="flex items-center gap-2">
					{/* Back button — Mobile only */}
						<button
							type="button"
							onClick={() => onSelectNote(null)}
							className="md:hidden relative flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] after:absolute after:-inset-2 active:scale-[0.96]"
							title="Back to Home"
						>
						<Icon icon={ArrowLeft01Icon} size={22} strokeWidth={2} />
					</button>

					{sidebarCollapsed ? (
						<button
							type="button"
							onClick={onToggleSidebar}
							className="hidden md:relative md:flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.96]"
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
				<div className="flex items-center gap-1">
					{/* Home button — desktop only */}
					<button
						type="button"
						onClick={() => onSelectNote(null)}
						className="hidden md:relative md:flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.96]"
						title="Home"
					>
						<Icon icon={Home01Icon} size={20} strokeWidth={1.5} />
					</button>

					{note && (
						<>
							<FavoriteButton note={note} onUpdateNote={onUpdateNote} />
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
							className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.96]"
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
				<span
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
				</span>

				<span className="text-[var(--text-muted)] opacity-30">·</span>

				{/* Session delta */}
				{sessionDelta > 0 && (
					<>
						<motion.span
							key={sessionDelta}
							initial={{ scale: 0.85, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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

			{/* Mobile editor toolbar — floating formatting pill */}
			<MobileEditorToolbar editor={editorInstance} />
		</div>
	);
}
