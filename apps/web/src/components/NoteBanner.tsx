import { useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const W = 800
const H = 280
const HEAD = `<svg viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">`
const TAIL = `</svg>`

const PATTERNS = [
	// 1 — Topographic Contour (gradient bands + weighted strokes)
	(c: string) => {
		const defs = `<defs><linearGradient id="t1g" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="${c}" stop-opacity="0.1"/></linearGradient></defs>`
		const lines = Array.from({ length: 11 }, (_, i) => {
			const y1 = 15 + i * 20
			const y2 = 160 + i * 15
			const c1y = -40 + i * 32
			const c2y = 320 + i * 10
			const op = 0.25 + (i / 10) * 0.55
			const sw = 1 + (i / 10) * 3
			return `<path d="M -100 ${y1} C 150 ${c1y}, 550 ${c2y}, 900 ${y2}" stroke="url(#t1g)" stroke-width="${sw}" opacity="${op.toFixed(2)}" fill="none" />`
		}).join('')
		const bands = Array.from({ length: 10 }, (_, i) => {
			const y1a = 15 + i * 20, y2a = 160 + i * 15
			const c1ya = -40 + i * 32, c2ya = 320 + i * 10
			const y1b = 15 + (i + 1) * 20, y2b = 160 + (i + 1) * 15
			const c1yb = -40 + (i + 1) * 32, c2yb = 320 + (i + 1) * 10
			return `<path d="M -100 ${y1a} C 150 ${c1ya}, 550 ${c2ya}, 900 ${y2a} L 900 ${y2b} C 550 ${c2yb}, 150 ${c1yb}, -100 ${y1b} Z" fill="${c}" opacity="${(0.02 + i * 0.018).toFixed(3)}" />`
		}).join('')
		return `${HEAD}${defs}${bands}${lines}${TAIL}`
	},

	// 2 — Isometric Mesh (gradient diamonds + depth nodes)
	(c: string) => {
		const defs = `<defs><radialGradient id="m2g" gradientUnits="userSpaceOnUse" cx="400" cy="140" r="500"><stop offset="0%" stop-color="${c}" stop-opacity="0.6"/><stop offset="100%" stop-color="${c}" stop-opacity="0.05"/></radialGradient></defs>`
		const lines: string[] = []
		const step = 40
		for (let i = -W; i < W * 2; i += step) {
			const isMajor = i % 120 === 0
			const opacity = isMajor ? 0.5 : 0.15
			const sw = isMajor ? 2.5 : 1
			lines.push(`<line x1="${i}" y1="0" x2="${i + H}" y2="${H}" stroke="url(#m2g)" stroke-width="${sw}" opacity="${opacity}" />`)
			lines.push(`<line x1="${i}" y1="${H}" x2="${i + H}" y2="0" stroke="url(#m2g)" stroke-width="${sw}" opacity="${opacity}" />`)
		}
		const diamonds: string[] = []
		for (let ix = 0; ix <= W; ix += 120) {
			for (let iy = 0; iy <= H; iy += 120) {
				const s = 10
				diamonds.push(`<path d="M${ix},${iy - s} L${ix + s},${iy} L${ix},${iy + s} L${ix - s},${iy} Z" fill="${c}" opacity="0.25" />`)
				diamonds.push(`<circle cx="${ix}" cy="${iy}" r="3" fill="${c}" opacity="0.7" />`)
			}
		}
		return `${HEAD}${defs}${lines.join('')}${diamonds.join('')}${TAIL}`
	},

	// 3 — Radar Sweep (arc fills + dashed rings + scan)
	(c: string) => {
		const origins = [
			{ cx: 650, cy: 40, count: 7, spacing: 35 },
			{ cx: 120, cy: 240, count: 5, spacing: 45 },
			{ cx: 380, cy: -30, count: 4, spacing: 55 },
		]
		const elts: string[] = []
		for (const { cx, cy, count, spacing } of origins) {
			for (let si = 0; si < 2; si++) {
				const startDeg = si * 120 + 30
				const r = (count - 1) * spacing * 0.6
				const x1 = cx + r * Math.cos((startDeg * Math.PI) / 180)
				const y1 = cy + r * Math.sin((startDeg * Math.PI) / 180)
				const x2 = cx + r * Math.cos(((startDeg + 60) * Math.PI) / 180)
				const y2 = cy + r * Math.sin(((startDeg + 60) * Math.PI) / 180)
				elts.push(`<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0,1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${c}" opacity="0.06" />`)
			}
			for (let i = 1; i <= count; i++) {
				const r = i * spacing
				const op = Math.max(0, 0.7 - i * 0.08)
				const dash = i % 2 === 0 ? ' stroke-dasharray="6 4"' : ''
				const sw = i === 1 ? 2.5 : 1.5
				elts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${c}" stroke-width="${sw}" opacity="${op.toFixed(2)}" fill="none"${dash} />`)
			}
			elts.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${c}" opacity="0.9" />`)
		}
		return `${HEAD}${elts.join('')}${TAIL}`
	},

	// 4 — Architectural Blueprint (hatching + dimension lines + nodes)
	(c: string) => {
		const defs = `<defs><pattern id="h4" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${c}" stroke-width="0.8" opacity="0.2"/></pattern></defs>`
		const elts: string[] = []
		for (let x = 0; x <= W; x += 40) {
			const isMajor = x % 160 === 0
			elts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${c}" stroke-width="${isMajor ? 2 : 0.6}" opacity="${isMajor ? 0.5 : 0.15}" />`)
		}
		for (let y = 0; y <= H; y += 40) {
			const isMajor = y % 160 === 0
			elts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${c}" stroke-width="${isMajor ? 2 : 0.6}" opacity="${isMajor ? 0.5 : 0.15}" />`)
		}
		const rects = [
			{ x: 40, y: 40, w: 200, h: 120 },
			{ x: 320, y: 80, w: 160, h: 160 },
			{ x: 560, y: 20, w: 200, h: 100 },
			{ x: 140, y: 180, w: 140, h: 80 },
		]
		for (const r of rects) {
			elts.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#h4)" stroke="${c}" stroke-width="2" opacity="0.5" />`)
		}
		const dims = [
			{ x1: 40, y1: 170, x2: 240, y2: 170 },
			{ x1: 330, y1: 250, x2: 480, y2: 250 },
			{ x1: 560, y1: 130, x2: 760, y2: 130 },
		]
		for (const d of dims) {
			elts.push(`<line x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="${c}" stroke-width="1" opacity="0.6" />`)
			elts.push(`<line x1="${d.x1}" y1="${d.y1 - 4}" x2="${d.x1}" y2="${d.y1 + 4}" stroke="${c}" stroke-width="1" opacity="0.6" />`)
			elts.push(`<line x1="${d.x2}" y1="${d.y2 - 4}" x2="${d.x2}" y2="${d.y2 + 4}" stroke="${c}" stroke-width="1" opacity="0.6" />`)
		}
		const nodes = [[160, 100], [400, 160], [660, 70], [240, 220]]
		for (const [nx, ny] of nodes) {
			elts.push(`<circle cx="${nx}" cy="${ny}" r="6" stroke="${c}" stroke-width="2.5" opacity="0.7" fill="none" />`)
			elts.push(`<circle cx="${nx}" cy="${ny}" r="2" fill="${c}" opacity="0.9" />`)
		}
		return `${HEAD}${defs}${elts.join('')}${TAIL}`
	},

	// 5 — Halftone Ripple (radial size gradient + ring ripples)
	(c: string) => {
		const cx = W / 2, cy = H / 2
		const maxDist = Math.sqrt(cx * cx + cy * cy)
		const dots: string[] = []
		for (let x = 16; x < W; x += 22) {
			for (let y = 16; y < H; y += 22) {
				const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
				const normDist = dist / maxDist
				const wave = Math.sin(x * 0.018 + y * 0.012) + Math.cos((x - cx) * 0.02 + (y - cy) * 0.02)
				const sizeScale = 1 - normDist * 0.6
				const r = Math.max(0.5, (2 + wave * 2.5) * sizeScale)
				const op = Math.max(0.1, (0.35 + wave * 0.25) * sizeScale)
				dots.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${c}" opacity="${op.toFixed(2)}" />`)
			}
		}
		const rings = Array.from({ length: 5 }, (_, i) => {
			const r = 40 + i * 50
			const op = Math.max(0, 0.25 - i * 0.04)
			return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${c}" stroke-width="1" opacity="${op.toFixed(2)}" fill="none" stroke-dasharray="4 6" />`
		}).join('')
		return `${HEAD}${dots.join('')}${rings}${TAIL}`
	},

	// 6 — Circuit Board (IC chips + double traces + via nodes)
	(c: string) => {
		const chip = (x: number, y: number, w: number, h: number, pins: number) => {
			const elts: string[] = []
			elts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" opacity="0.12" stroke="${c}" stroke-width="2" rx="2" />`)
			elts.push(`<circle cx="${x + w / 2}" cy="${y + h / 2}" r="3" fill="${c}" opacity="0.7" />`)
			const pinSpacing = h / (pins + 1)
			for (let p = 1; p <= pins; p++) {
				const py = y + p * pinSpacing
				elts.push(`<line x1="${x - 12}" y1="${py}" x2="${x}" y2="${py}" stroke="${c}" stroke-width="1.5" opacity="0.5" />`)
				elts.push(`<line x1="${x + w}" y1="${py}" x2="${x + w + 12}" y2="${py}" stroke="${c}" stroke-width="1.5" opacity="0.5" />`)
				elts.push(`<circle cx="${x - 12}" cy="${py}" r="1.5" fill="${c}" opacity="0.6" />`)
				elts.push(`<circle cx="${x + w + 12}" cy="${py}" r="1.5" fill="${c}" opacity="0.6" />`)
			}
			return elts.join('')
		}
		const elts: string[] = []
		elts.push(chip(160, 60, 50, 80, 3))
		elts.push(chip(380, 30, 60, 100, 4))
		elts.push(chip(580, 70, 45, 70, 3))
		elts.push(chip(260, 160, 55, 90, 3))
		// Double-trace paths
		elts.push(`<path d="M-20,40 L100,40 L135,75 L215,75" stroke="${c}" stroke-width="3" opacity="0.5" fill="none" />`)
		elts.push(`<path d="M-20,43 L100,43 L135,78 L215,78" stroke="${c}" stroke-width="1" opacity="0.25" fill="none" />`)
		elts.push(`<path d="M-20,190 L140,190 L175,160 L355,160" stroke="${c}" stroke-width="3" opacity="0.4" fill="none" />`)
		elts.push(`<path d="M-20,193 L140,193 L175,163 L355,163" stroke="${c}" stroke-width="1" opacity="0.2" fill="none" />`)
		elts.push(`<path d="M640,95 L670,130 L770,130 L820,150" stroke="${c}" stroke-width="3" opacity="0.5" fill="none" />`)
		elts.push(`<path d="M640,98 L670,133 L770,133 L820,153" stroke="${c}" stroke-width="1" opacity="0.25" fill="none" />`)
		// Capacitor nodes
		const caps = [[350, 80], [215, 75], [640, 95], [460, 160]]
		for (const [cx, cy] of caps) {
			elts.push(`<circle cx="${cx}" cy="${cy}" r="6" fill="${c}" opacity="0.8" />`)
			elts.push(`<circle cx="${cx}" cy="${cy}" r="12" stroke="${c}" stroke-width="1.5" opacity="0.35" fill="none" />`)
		}
		// Via holes
		const vias = [[100, 40], [140, 190], [500, 100], [700, 130]]
		for (const [vx, vy] of vias) {
			elts.push(`<circle cx="${vx}" cy="${vy}" r="3" fill="${c}" opacity="0.6" />`)
			elts.push(`<circle cx="${vx}" cy="${vy}" r="6" stroke="${c}" stroke-width="1" opacity="0.3" fill="none" />`)
		}
		return `${HEAD}${elts.join('')}${TAIL}`
	},

	// 7 — Geometric Shards (SVG gradients + edge lines + accent detail)
	(c: string) => {
		const defs = `<defs><linearGradient id="s7a" x1="0%" y1="100%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${c}" stop-opacity="0.35"/><stop offset="100%" stop-color="${c}" stop-opacity="0.08"/></linearGradient><linearGradient id="s7b" x1="100%" y1="0%" x2="0%" y2="100%" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${c}" stop-opacity="0.28"/><stop offset="100%" stop-color="${c}" stop-opacity="0.05"/></linearGradient></defs>`
		const shards = [
			{ d: 'M0,280 L200,0 L350,0 L150,280 Z', f: 'url(#s7a)' },
			{ d: 'M180,280 L400,0 L420,0 L200,280 Z', f: 'url(#s7b)' },
			{ d: 'M350,280 L500,0 L600,0 L450,280 Z', f: 'url(#s7a)' },
			{ d: 'M500,280 L700,0 L720,0 L520,280 Z', f: 'url(#s7b)' },
			{ d: 'M650,280 L800,0 L850,0 L700,280 Z', f: 'url(#s7a)' },
			{ d: 'M0,150 L800,50 L800,80 L0,180 Z', f: 'url(#s7b)' },
			{ d: 'M0,220 L800,280 L800,310 L0,240 Z', f: 'url(#s7a)' },
		]
		const fills = shards.map(s => `<path d="${s.d}" fill="${s.f}" opacity="0.9" />`).join('')
		const edges = [
			'M200,0 L0,280', 'M400,0 L180,280', 'M500,0 L350,280',
			'M700,0 L500,280', 'M800,0 L650,280',
			'M0,150 L800,50', 'M0,220 L800,280',
		].map((d, i) => `<path d="${d}" stroke="${c}" stroke-width="${i % 2 === 0 ? 2 : 1}" opacity="${(0.3 + i * 0.04).toFixed(2)}" fill="none" />`).join('')
		const accents = Array.from({ length: 4 }, (_, i) => {
			const offset = i * 70 + 30
			return `<path d="M${offset},0 L${offset - 80},${H}" stroke="${c}" stroke-width="0.8" opacity="${(0.12 + i * 0.04).toFixed(2)}" fill="none" />`
		}).join('')
		return `${HEAD}${defs}${fills}${edges}${accents}${TAIL}`
	},

	// 8 — Crosshair Matrix (gradient fade + ring targets + center dots)
	(c: string) => {
		const defs = `<defs><radialGradient id="c8g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="${c}" stop-opacity="0.6"/><stop offset="100%" stop-color="${c}" stop-opacity="0.08"/></radialGradient></defs>`
		const elts: string[] = []
		const cx = W / 2, cy = H / 2
		for (let x = 30; x < W; x += 50) {
			for (let y = 30; y < H; y += 50) {
				const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
				const normDist = dist / Math.sqrt(cx * cx + cy * cy)
				const opBase = 0.15 + (1 - normDist) * 0.45
				const size = 5 + (1 - normDist) * 4
				const arm = size + 2
				elts.push(`<path d="M${x - arm},${y} L${x - size},${y} M${x + size},${y} L${x + arm},${y} M${x},${y - arm} L${x},${y - size} M${x},${y + size} L${x},${y + arm}" stroke="url(#c8g)" stroke-width="1.5" opacity="${opBase.toFixed(2)}" stroke-linecap="round" />`)
				elts.push(`<circle cx="${x}" cy="${y}" r="1.5" fill="${c}" opacity="${(opBase * 1.2).toFixed(2)}" />`)
			}
		}
		const targets = [[400, 140], [200, 70], [600, 210], [700, 60]]
		for (const [tx, ty] of targets) {
			elts.push(`<circle cx="${tx}" cy="${ty}" r="20" stroke="${c}" stroke-width="1.5" opacity="0.35" fill="none" />`)
			elts.push(`<circle cx="${tx}" cy="${ty}" r="14" stroke="${c}" stroke-width="0.8" opacity="0.25" fill="none" stroke-dasharray="3 3" />`)
			elts.push(`<circle cx="${tx}" cy="${ty}" r="4" fill="${c}" opacity="0.6" />`)
		}
		return `${HEAD}${defs}${elts.join('')}${TAIL}`
	},
]

function hashId(id: string): number {
	let h = 0
	for (let i = 0; i < id.length; i++) {
		h = id.charCodeAt(i) + ((h << 5) - h)
	}
	return Math.abs(h)
}

interface NoteBannerProps {
	noteId: string
	title: string
	onTitleChange: (title: string) => void
	onTitleKeyDown: (e: React.KeyboardEvent) => void
}

export default function NoteBanner({ noteId, title, onTitleChange, onTitleKeyDown }: NoteBannerProps) {
	const patternSvg = useMemo(() => {
		const hash = hashId(noteId)
		const patternIdx = hash % PATTERNS.length
		return PATTERNS[patternIdx]!('rgba(255,255,255,0.45)')
	}, [noteId])

	const svgDataUri = useMemo(
		() => `url("data:image/svg+xml,${encodeURIComponent(patternSvg.trim())}")`,
		[patternSvg]
	)

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
		}
	}, [title])

	return (
		<motion.div
			key={`banner-${noteId}`}
			className="banner-draw relative w-full overflow-hidden rounded-lg"
			style={{
				backgroundColor: 'color-mix(in srgb, var(--accent) var(--banner-accent-mix, 100%), var(--bg-deep))',
				minHeight: 160,
			}}
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
		>
			{/* SVG pattern — draws in with sweep animation */}
			<div
				className="absolute inset-0 pointer-events-none banner-pattern"
				style={{
					backgroundImage: svgDataUri,
					backgroundRepeat: 'no-repeat',
					backgroundPosition: 'center center',
					backgroundSize: '100% 100%',
				}}
			/>

			{/* Shimmer sweep highlight */}
			<div className="absolute inset-0 pointer-events-none banner-shimmer" aria-hidden="true" />

			{/* Title overlay */}
			<div className="relative z-10 flex items-end h-full min-h-[160px] p-6 md:p-8">
				<textarea
					ref={textareaRef}
					value={title}
					onChange={(e) => onTitleChange(e.target.value)}
					onKeyDown={onTitleKeyDown}
					rows={1}
					className="w-full max-w-[80%] bg-transparent text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white placeholder:text-white/50 focus:outline-none resize-none overflow-hidden transition-shadow duration-[200ms] focus:shadow-[0_2px_0_0_rgba(255,255,255,0.5)]"
					style={{ fontFamily: '"Fraunces", Georgia, serif', textWrap: 'balance', lineHeight: 1.2 }}
					placeholder="Untitled"
				/>
			</div>
		</motion.div>
	)
}
