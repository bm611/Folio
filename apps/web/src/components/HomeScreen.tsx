import { useMemo, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
	Calendar01Icon,
	Moon02Icon,
	Sun01Icon,
	SunCloud02Icon,
	SidebarLeftIcon,
	CommandIcon,
	Add01Icon,
	Logout01Icon,
	CloudUploadIcon,
	StarIcon,
	FireIcon,
	Cancel01Icon,
	File01Icon,
	Clock01Icon,
	File01Icon as FileText01Icon,
} from '@hugeicons/core-free-icons';

import Icon from './Icon';
import SettingsMenu from './SettingsMenu';
import AccentPicker from './AccentPicker';
import { countBodyWords, getNoteDisplayTitle } from '../utils/noteMeta';
import { useAuth } from '../contexts/AuthContext';
import type { NoteFile, TreeNode } from '../types';
import type { SyncStatus } from './noteEditorUtils';
import {
	POPOVER_TRANSITION,
	formatRelativeTime,
	compareRecentNotes,
	getTimeGreeting,
	getMotivationalMessage,
	formatDailyTitle,
} from './noteEditorUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HomeScreenProps {
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
					className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight leading-[1.15]"
					style={{ fontFamily: 'var(--font-display)' }}
				>
					No favorites yet.
				</p>
				<p className="text-[15px] text-[var(--text-muted)] max-w-[240px] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
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
					className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight leading-[1.15]"
					style={{ fontFamily: 'var(--font-display)' }}
				>
					Your canvas is empty.
				</p>
				<p className="text-[15px] text-[var(--text-muted)] max-w-[240px] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
					Every great idea starts somewhere. Write your first note.
				</p>
			</motion.div>
		</motion.div>
	);
}

// ─── HomeScreen Component ─────────────────────────────────────────────────────

export default function HomeScreen({
	notes,
	onNewNote,
	onCreateDailyNote,
	onSelectNote,
	theme,
	onSetTheme,
	onCycleTheme,
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
	const { user, signOut } = useAuth();

	const fileNotes = useMemo(() => notes.filter((n): n is NoteFile => n.type === 'file'), [notes]);

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

		for (let i = 0; i < 365; i++) {
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

	const last7DaysActivity = useMemo(() => {
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date()
			d.setDate(d.getDate() - (6 - i))
			d.setHours(0, 0, 0, 0)
			const end = new Date(d)
			end.setHours(23, 59, 59, 999)
			const wordsOnDay = fileNotes.reduce((sum, n) => {
				const nd = new Date(n.updatedAt || n.createdAt)
				return nd >= d && nd <= end ? sum + countBodyWords(n.content) : sum
			}, 0)
			return { active: wordsOnDay > 0, intensity: Math.min(wordsOnDay / 200, 1) }
		})
	}, [fileNotes])

	const [homeTab, setHomeTab] = useState<'recent' | 'favorites'>('recent');
	const [favExpanded, setFavExpanded] = useState(false);

	const recentNotes = useMemo(() => [...fileNotes].sort(compareRecentNotes).slice(0, 5), [fileNotes]);

	const favoriteNotes = useMemo(() => {
		return [...fileNotes]
			.filter(
				(n) => n.tags?.includes('favorite') || (n as NoteFile & { isFavorite?: boolean }).isFavorite
			)
			.sort(compareRecentNotes)
			.slice(0, 6);
	}, [fileNotes]);

	return (
		<motion.div
			key="home"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className="flex flex-1 min-w-0 flex-col max-md:rounded-none rounded-2xl bg-[var(--bg-primary)]"
		>
			{/* Top bar */}
			<div className="flex items-center justify-between px-4 py-2 md:px-6">
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
							style={{ fontFamily: 'var(--font-body)' }}
						>
							<Icon icon={CloudUploadIcon} size={18} strokeWidth={2} />
							<span>Sign in</span>
						</button>
					)}
				</div>
			</div>

			{/* Welcome content */}
			<div className="flex flex-1 flex-col items-center px-6 pt-[6vh] md:pt-[8vh] pb-36 md:pb-6 overflow-y-auto">
				<div className="flex flex-col items-center text-center">
					<motion.h1
						className="text-[28px] sm:text-[34px] font-bold tracking-tight leading-[1.1] mb-2"
						style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
					>
						{getTimeGreeting()}
					</motion.h1>
					<motion.p
						className="text-[15px] mb-7 max-w-[280px] leading-relaxed"
						style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
					>
						{getMotivationalMessage(streak)}
					</motion.p>

					{/* Stat badges */}
					<motion.div
						className="flex items-center gap-2.5 mb-7 flex-wrap justify-center"
						style={{ fontFamily: 'var(--font-body)' }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3, delay: 0.25 }}
					>
						<motion.span
							className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px]"
							style={{
								background: 'color-mix(in srgb, var(--success) 14%, transparent)',
								borderColor: 'color-mix(in srgb, var(--success) 25%, transparent)',
								color: 'var(--success)',
							}}
							initial={{ opacity: 0, y: 6, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ duration: 0.35, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
						>
							<Icon icon={File01Icon} size={13} strokeWidth={2.2} />
							<span className="font-semibold tabular-nums">{fileNotes.length}</span>
							<span className="font-medium opacity-70">{fileNotes.length === 1 ? 'note' : 'notes'}</span>
						</motion.span>
						<motion.span
							className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px]"
							style={{
								background: 'color-mix(in srgb, var(--warning) 14%, transparent)',
								borderColor: 'color-mix(in srgb, var(--warning) 25%, transparent)',
								color: 'var(--warning)',
							}}
							initial={{ opacity: 0, y: 6, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ duration: 0.35, delay: 0.38, ease: [0.25, 1, 0.5, 1] }}
						>
							<Icon icon={FireIcon} size={13} strokeWidth={2.2} />
							<span className="font-semibold tabular-nums">{streak}</span>
							<span className="font-medium opacity-70">day streak</span>
						</motion.span>
						<motion.span
							className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px]"
							style={{
								background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
								borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)',
								color: 'var(--accent)',
							}}
							initial={{ opacity: 0, y: 6, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ duration: 0.35, delay: 0.46, ease: [0.25, 1, 0.5, 1] }}
						>
							<Icon icon={FileText01Icon} size={13} strokeWidth={2.2} />
							<span className="font-semibold tabular-nums">{totalWords.toLocaleString()}</span>
							<span className="font-medium opacity-70">words</span>
						</motion.span>
					</motion.div>

					{/* 7-day activity strip */}
					<motion.div
						className="flex items-end gap-[6px] mb-1"
						title="Writing activity — last 7 days"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3, delay: 0.45 }}
					>
						{last7DaysActivity.map(({ active, intensity }, i) => {
							const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
							const todayDow = new Date().getDay()
							const label = DAY_LABELS[((todayDow - 6 + i) % 7 + 7) % 7]
							const isToday = i === 6
							const accentPct = active ? Math.round(15 + intensity * 30) : 0
							const borderPct = active ? Math.round(25 + intensity * 25) : 0
							return (
								<div key={i} className="flex flex-col items-center gap-[5px]">
									<motion.div
										className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
										style={{
											background: active
												? `color-mix(in srgb, var(--accent) ${accentPct}%, transparent)`
												: 'var(--glass-bg)',
											border: `1.5px solid ${active
												? `color-mix(in srgb, var(--accent) ${borderPct}%, transparent)`
												: isToday
													? 'color-mix(in srgb, var(--accent) 30%, var(--glass-border))'
													: 'var(--glass-border)'}`,
											backdropFilter: 'blur(var(--glass-blur))',
											WebkitBackdropFilter: 'blur(var(--glass-blur))',
										}}
										initial={{ scale: 0.85, opacity: 0 }}
										animate={isToday && !active 
											? { scale: [1, 1.06, 1], opacity: 1 }
											: { scale: 1, opacity: 1 }
										}
										transition={isToday && !active
											? { scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.35 } }
											: { delay: i * 0.06, duration: 0.35, ease: [0.25, 1, 0.5, 1] }
										}
									>
										{active ? (
											<motion.span
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												transition={{ delay: i * 0.06 + 0.15, type: 'spring', stiffness: 420, damping: 18 }}
											>
												<Icon icon={FireIcon} size={13} strokeWidth={2} style={{ color: 'var(--accent)', opacity: 0.6 + intensity * 0.4 }} />
											</motion.span>
										) : (
											<motion.span
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												transition={{ delay: i * 0.06 + 0.15, type: 'spring', stiffness: 420, damping: 18 }}
											>
												<Icon icon={Cancel01Icon} size={13} strokeWidth={2} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
											</motion.span>
										)}
									</motion.div>
									<span
										className="text-[10px] font-semibold uppercase tracking-wider"
										style={{
											fontFamily: 'var(--font-body)',
											color: isToday ? 'var(--accent)' : 'var(--text-muted)',
											opacity: isToday ? 1 : 0.5,
										}}
									>
										{label}
									</span>
								</div>
							)
						})}
					</motion.div>
				</div>

				<div className="animate-fade-in-up-delay-2 mt-8 mb-2 flex items-center justify-center w-full max-w-md">
					<div className="flex items-center gap-3 w-full justify-center px-4 sm:px-0">
						<motion.button
							onClick={() => onNewNote?.()}
							whileHover={{ scale: 1.03, y: -1 }}
							whileTap={{ scale: 0.95, y: 1 }}
							className="glass-accent group relative inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-3 py-4 text-[14px] font-medium text-white transition-[transform,filter,box-shadow] duration-300 hover:brightness-110 active:scale-[0.96] sm:px-6 sm:text-[15px]"
							style={{ fontFamily: 'var(--font-body)' }}
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
							whileHover={{ scale: 1.03, y: -1 }}
							whileTap={{ scale: 0.95, y: 1 }}
							className="glass-ghost group relative inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-4 text-[14px] font-medium text-[var(--accent)] transition-[transform,background-color,border-color,box-shadow] duration-300 hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/30 active:scale-[0.96] sm:px-6 sm:text-[15px]"
							style={{ fontFamily: 'var(--font-body)' }}
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
					style={{ fontFamily: 'var(--font-body)' }}
				>
					{/* Tab bar — editorial treatment */}
					<div className="relative mb-8 flex">
						<button
							type="button"
							onClick={() => setHomeTab('recent')}
							className="relative flex flex-1 items-center justify-center gap-2 pb-3 text-[14px] font-semibold tracking-wide transition-colors duration-150"
							style={{
								color: homeTab === 'recent' ? 'var(--text-primary)' : 'var(--text-muted)',
								fontFamily: 'var(--font-display)',
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
									className="absolute bottom-0 left-[10%] right-[10%] h-[2px] rounded-full bg-[var(--accent)]"
									transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
								/>
							)}
						</button>
						<button
							type="button"
							onClick={() => setHomeTab('favorites')}
							className="relative flex flex-1 items-center justify-center gap-2 pb-3 text-[14px] font-semibold tracking-wide transition-colors duration-150"
							style={{
								color: homeTab === 'favorites' ? 'var(--text-primary)' : 'var(--text-muted)',
								fontFamily: 'var(--font-display)',
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
									className="absolute bottom-0 left-[10%] right-[10%] h-[2px] rounded-full bg-[var(--accent)]"
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
										<div className="flex flex-col gap-3">
											{recentNotes.map((n, i) => {
												const isDaily = n.tags?.includes('daily');
												const rawTitle = getNoteDisplayTitle(n);
												const date = new Date(n.updatedAt || n.createdAt);
												const displayTitle = isDaily ? formatDailyTitle(rawTitle) : rawTitle;
												return (
													<motion.button
														key={n.id}
														type="button"
														onClick={() => onSelectNote(n.id)}
														className="group relative w-full text-left rounded-2xl px-4 py-4 transition-[transform,background-color,box-shadow,border-color] duration-[180ms] hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_8px_30px_-6px_color-mix(in_srgb,var(--accent)_25%,transparent)] hover:border-[color-mix(in_srgb,var(--accent)_60%,var(--glass-border))] hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--glass-bg))] active:scale-[0.97] active:shadow-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{
															duration: 0.35,
															delay: i * 0.06,
															ease: [0.23, 1, 0.32, 1]
														}}
														style={{
															WebkitTapHighlightColor: 'transparent',
															background: 'var(--glass-bg)',
															border: '1px solid var(--glass-border)',
															transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
														}}
													>
														{/* Accent dot for first item */}
														{i === 0 && (
															<div
																className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full transition-[height] duration-[180ms] group-hover:h-full"
																style={{ background: 'var(--accent)', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
															/>
														)}
														<div className="flex min-w-0 flex-col gap-1.5">
															<div className="flex items-baseline justify-between gap-3">
																<span className="truncate text-[15px] font-semibold tracking-tight text-[var(--text-primary)] transition-colors duration-[180ms] group-hover:text-[var(--accent)]" style={{ fontFamily: 'var(--font-body)' }}>
																	{displayTitle}
																</span>
																<span className="shrink-0 text-[11px] font-medium text-[var(--text-muted)] tabular-nums transition-colors duration-[180ms] group-hover:text-[var(--text-secondary)]">
																	{formatRelativeTime(date)}
																</span>
															</div>
														</div>
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
										<div className="flex flex-col gap-3">
											{(favExpanded ? favoriteNotes : favoriteNotes.slice(0, 4)).map((n, i) => {
												const isDaily = n.tags?.includes('daily');
												const rawTitle = getNoteDisplayTitle(n);
												const date = new Date(n.updatedAt || n.createdAt);
												const displayTitle = isDaily ? formatDailyTitle(rawTitle) : rawTitle;
												return (
													<motion.button
														key={n.id}
														type="button"
														onClick={() => onSelectNote(n.id)}
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{
															duration: 0.35,
															delay: i * 0.06,
															ease: [0.23, 1, 0.32, 1]
														}}
														className="group relative w-full text-left rounded-2xl px-4 py-4 transition-[transform,background-color,box-shadow,border-color] duration-[180ms] hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_8px_30px_-6px_color-mix(in_srgb,var(--accent)_25%,transparent)] hover:border-[color-mix(in_srgb,var(--accent)_60%,var(--glass-border))] hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--glass-bg))] active:scale-[0.97] active:shadow-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
														style={{
															WebkitTapHighlightColor: 'transparent',
															background: 'var(--glass-bg)',
															border: '1px solid var(--glass-border)',
															transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
														}}
													>
														<div className="flex min-w-0 flex-col gap-1.5">
															<div className="flex items-center gap-2">
																<Icon
																	icon={StarIcon}
																	size={12}
																	strokeWidth={2.5}
																	className="transition-[opacity,transform] duration-[180ms] group-hover:opacity-100 group-hover:scale-110"
																	style={{ color: 'var(--warning)', opacity: 0.5 }}
																/>
																<span className="truncate text-[15px] font-semibold tracking-tight text-[var(--text-primary)] transition-colors duration-[180ms] group-hover:text-[var(--accent)]" style={{ fontFamily: 'var(--font-body)' }}>
																	{displayTitle}
																</span>
															</div>
															<div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
																<span className="tabular-nums font-medium transition-colors duration-[180ms] group-hover:text-[var(--text-secondary)]">{formatRelativeTime(date)}</span>
															</div>
														</div>
													</motion.button>
												);
											})}
											{favoriteNotes.length > 4 && (
												<button
													type="button"
													onClick={() => setFavExpanded((v) => !v)}
													className="mt-1 w-full rounded-xl py-2.5 text-[12px] font-semibold tracking-wide text-[var(--text-muted)] transition-[color,background-color] duration-150 hover:text-[var(--text-primary)] active:scale-[0.97]"
													style={{
														WebkitTapHighlightColor: 'transparent',
														fontFamily: '"Outfit", sans-serif',
													}}
												>
													{favExpanded ? 'Show less' : `Show more (${favoriteNotes.length - 4})`}
												</button>
											)}
										</div>
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

				{/* ── Desktop Two-Column View — Bolder layout ───────────────── */}
				<div
					className="animate-fade-in-up-delay-2 mt-12 w-full max-w-[1200px] hidden md:grid md:grid-cols-[3fr_5fr] lg:grid-cols-[3fr_5fr] gap-8 lg:gap-12 px-8"
					style={{ fontFamily: 'var(--font-body)' }}
				>
					{/* ── Recent Column — Editorial timeline ────────────────── */}
					<div className="flex flex-col">
						{/* Section header — bold display type with accent line */}
						<div className="mb-6 flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--border-subtle) 60%, transparent)' }}>
							<Icon icon={Clock01Icon} size={18} strokeWidth={2} style={{ color: 'var(--accent)', opacity: 0.8 }} />
							<h2
								className="text-[18px] font-bold tracking-tight text-[var(--text-primary)]"
								style={{ fontFamily: 'var(--font-display)' }}
							>
								Recent
							</h2>
						</div>

						{recentNotes.length > 0 ? (
							<div className="flex flex-col">
								{recentNotes.map((n, i) => {
									const isDaily = n.tags?.includes('daily');
									const rawTitle = getNoteDisplayTitle(n);
									const date = new Date(n.updatedAt || n.createdAt);
									const displayTitle = isDaily ? formatDailyTitle(rawTitle) : rawTitle;

									return (
										<motion.button
											key={n.id}
											type="button"
											onClick={() => onSelectNote(n.id)}
											initial={{ opacity: 0, x: -12 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.4, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
											className="group relative flex items-start gap-4 py-4 text-left transition-[background-color,transform,box-shadow] duration-[180ms] hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--glass-bg))] hover:-translate-y-1 hover:shadow-[0_6px_24px_-6px_color-mix(in_srgb,var(--accent)_20%,transparent)] active:scale-[0.97] rounded-xl px-3 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
											style={{ WebkitTapHighlightColor: 'transparent', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
										>
											{/* Timeline dot + line */}
											<div className="relative flex flex-col items-center shrink-0 pt-1.5">
												{i === 0 ? (
													<motion.div
														className="w-2 h-2 rounded-full ring-2 ring-[var(--bg-primary)] shrink-0"
														style={{ background: 'var(--accent)' }}
														animate={{ scale: [1, 1.5, 1], opacity: [1, 0.7, 1] }}
														transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
													/>
												) : (
													<div
														className="w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-primary)] shrink-0 transition-[background-color,opacity,box-shadow,transform] duration-[180ms] group-hover:scale-125 group-hover:opacity-100 group-hover:shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
														style={{
															background: 'var(--text-muted)',
															opacity: 0.4,
															transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
														}}
													/>
												)}
												{i < recentNotes.length - 1 && (
													<div
														className="w-px flex-1 mt-1.5 rounded-full"
														style={{
															background: 'var(--border-subtle)',
															minHeight: '32px',
														}}
													/>
												)}
											</div>

											{/* Content */}
											<div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
												<span
													className="truncate text-[15px] font-semibold tracking-tight transition-colors duration-[180ms] group-hover:text-[var(--accent)]"
													style={{
														color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
													}}
												>
													{displayTitle}
												</span>
												<div className="flex items-center gap-2 mt-0.5">
													<span className="text-[10px] font-semibold uppercase tracking-wider tabular-nums transition-opacity duration-[180ms] group-hover:opacity-100" style={{ color: 'var(--accent)', opacity: 0.55 }}>
														{formatRelativeTime(date)}
													</span>
												</div>
											</div>

											{/* Arrow hint */}
											<div className="shrink-0 self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-[180ms]" style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
												<svg
													width="18"
													height="18"
													viewBox="0 0 16 16"
													fill="none"
													aria-hidden="true"
													style={{ color: 'var(--accent)' }}
												>
													<path
														d="M6 4l4 4-4 4"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											</div>
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

					{/* ── Favorites Column — Statement cards ───────────────── */}
					<div className="flex flex-col">
						{/* Section header — bold with star accent */}
						<div className="mb-6 flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--warning) 25%, var(--border-subtle))' }}>
							<Icon icon={StarIcon} size={18} strokeWidth={2.5} style={{ color: 'var(--warning)', opacity: 0.85 }} />
							<h2
								className="text-[18px] font-bold tracking-tight text-[var(--text-primary)]"
								style={{ fontFamily: 'var(--font-display)' }}
							>
								Favorites
							</h2>
						</div>

						{favoriteNotes.length > 0 ? (
							<div className="grid grid-cols-2 gap-4">
								{favoriteNotes.map((n, i) => {
									const isDaily = n.tags?.includes('daily');
									const rawTitle = getNoteDisplayTitle(n);
									const date = new Date(n.updatedAt || n.createdAt);
									const displayTitle = isDaily ? formatDailyTitle(rawTitle) : rawTitle;

									return (
										<motion.button
											key={n.id}
											type="button"
											onClick={() => onSelectNote(n.id)}
											initial={{ opacity: 0, scale: 0.96, y: 8 }}
											animate={{ opacity: 1, scale: 1, y: 0 }}
											transition={{ duration: 0.4, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
											className="group relative flex flex-col justify-between overflow-hidden rounded-2xl px-5 py-5 text-left shadow-md transition-[transform,box-shadow,border-color,background-color] duration-[180ms] hover:shadow-[0_12px_36px_-8px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:border-[color-mix(in_srgb,var(--accent)_60%,var(--glass-border))] hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--glass-bg))] active:scale-[0.97] active:shadow-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
											style={{
												WebkitTapHighlightColor: 'transparent',
												minHeight: '130px',
												background: 'var(--glass-bg)',
												border: '1px solid var(--glass-border)',
												backdropFilter: 'blur(var(--glass-blur))',
												WebkitBackdropFilter: 'blur(var(--glass-blur))',
												transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
											}}
											whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
										>
											{/* Top row: star + time */}
											<div className="flex w-full items-center justify-between mb-3">
												<Icon
													icon={StarIcon}
													size={14}
													strokeWidth={2.5}
													className="transition-[opacity,transform] duration-[180ms] group-hover:opacity-100 group-hover:scale-125"
													style={{ color: 'var(--warning)', opacity: 0.45 }}
												/>
												<span className="text-[11px] font-semibold tabular-nums transition-[color,opacity] duration-[180ms] group-hover:opacity-100 group-hover:text-[var(--text-secondary)]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
													{formatRelativeTime(date)}
												</span>
											</div>

											{/* Title — larger, bolder */}
											<span
												className="relative z-10 block truncate text-[17px] font-bold tracking-tight transition-colors duration-[180ms] group-hover:text-[var(--accent)]"
												style={{
													fontFamily: 'var(--font-display)',
													color: 'var(--text-secondary)',
													lineHeight: 1.3,
												}}
											>
												{displayTitle}
											</span>

											{/* Bottom: daily badge */}
											<div className="relative z-10 flex items-center gap-2 mt-3">
												{isDaily && (
													<span
														className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-[background-color] duration-[180ms] group-hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
														style={{
															background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
															color: 'var(--accent)',
														}}
													>
														Daily
													</span>
												)}
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
		</motion.div>
	);
}
