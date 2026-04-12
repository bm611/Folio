import type { IconSvgElement } from '@hugeicons/react';

import {
	AlertCircleIcon,
	CloudSavingDone01Icon,
	CloudOffIcon,
	CloudUploadIcon,
	Loading01Icon
} from '@hugeicons/core-free-icons';

import type { NoteFile } from '../types';
import { getNoteDisplayTitle } from '../utils/noteMeta';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaveStatus {
	state: 'syncing' | 'saved' | 'offline' | 'error' | 'demo';
	label: string;
	detail: string;
	error: string | null;
	canRetry: boolean;
}

export interface SyncStatus {
	state: string;
	message?: string;
	error?: string | null;
}

export interface SaveBadgeMeta {
	icon: IconSvgElement;
	toneClassName: string;
	spin: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const POPOVER_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatRelativeTime(date: Date): string {
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

export function getComparableTimestamp(value: string | undefined | null): number {
	const parsed = Date.parse(value || '');
	return Number.isNaN(parsed) ? 0 : parsed;
}

export function compareRecentNotes(a: NoteFile, b: NoteFile): number {
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

export function getContentPreview(content: string, maxLength = 90): string {
	const stripped = content
		.replace(/^#+\s.*$/gm, '')
		.replace(/\[.*?\]\(.*?\)/g, '')
		.replace(/!\[.*?\]\(.*?\)/g, '')
		.replace(/```[\s\S]*?```/g, '')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/[*_~]+/g, '')
		.replace(/^[-*+]\s/gm, '')
		.replace(/^\d+\.\s/gm, '')
		.replace(/^>\s?.*/gm, '')
		.replace(/\n+/g, ' ')
		.trim();
	const preview = stripped.length > maxLength ? stripped.slice(0, maxLength).replace(/\s+\S*$/, '') + '…' : stripped;
	return preview;
}

export function formatRelativeSaveTime(timestamp: string | null | undefined): string | null {
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

export function getSaveBadgeMeta(saveStatus: SaveStatus): SaveBadgeMeta {
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

export function getSaveTextClass(state: string): string {
	if (state === 'syncing' || state === 'saved') return 'text-[var(--success)]';
	if (state === 'error') return 'text-[var(--danger)]';
	return 'text-[var(--warning)]';
}

export function getTimeGreeting(): string {
	const h = new Date().getHours()
	if (h < 5) return 'Burning the midnight oil?'
	if (h < 8) return 'Early bird catches the thought.'
	if (h < 12) return 'Good morning.'
	if (h < 14) return 'Good afternoon.'
	if (h < 17) return 'Afternoon focus mode.'
	if (h < 20) return 'Good evening.'
	return 'Night thoughts welcome.'
}

export function getMotivationalMessage(streak: number): string {
	if (streak === 0) return 'Your thoughts are waiting.';
	if (streak === 1) return 'Day one. Something begins.';
	if (streak === 3) return '3 days — a habit is forming.';
	if (streak === 7) return '🔥 One whole week. You\'re on fire.';
	if (streak < 7) return `${streak} days in. Keep going.`;
	if (streak === 14) return '2 weeks strong. This is who you are now.';
	if (streak === 30) return '🎯 30 days. You\'re a force of nature.';
	if (streak < 30) return `${streak}-day streak. Consistency is your superpower.`;
	if (streak === 100) return '💯 One hundred days. Legendary.';
	return `${streak} days strong. Unstoppable.`;
}

export function formatDailyTitle(rawTitle: string): string {
	const parts = rawTitle.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (parts) {
		const [, dd, mm, yyyy] = parts;
		const d = new Date(`${yyyy}-${mm}-${dd}`);
		const readable = d.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
		return `Daily \u2014 ${readable}`;
	}
	return `Daily \u2014 ${rawTitle}`;
}
