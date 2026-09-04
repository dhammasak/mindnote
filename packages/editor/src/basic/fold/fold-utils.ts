import { KEYS } from "platejs"

export type FoldableInfo =
	| { kind: "heading"; level: number }
	| { kind: "indent"; indent: number }

const HEADING_TYPES: Record<string, number> = {
	[KEYS.h1]: 1,
	[KEYS.h2]: 2,
	[KEYS.h3]: 3,
	[KEYS.h4]: 4,
	[KEYS.h5]: 5,
	[KEYS.h6]: 6,
}

export function getFoldableInfo(block: {
	type?: string
	indent?: number
}): FoldableInfo | null {
	if (block.type && HEADING_TYPES[block.type] !== undefined) {
		return { kind: "heading", level: HEADING_TYPES[block.type] }
	}
	// Any non-heading block is potentially foldable on the indent axis.
	// Whether a *chevron* shows up is decided separately by blockHasChildren —
	// indent=0 blocks fold only when they actually own indented content below.
	return { kind: "indent", indent: block.indent ?? 0 }
}

type ActiveFold = { id: string } & FoldableInfo

// A block "exits" an active fold when:
//  - active fold is a heading at level L, current block is a heading at level <= L
//  - active fold is an indent at level I, current block has indent <= I AND is not
//    a strictly deeper continuation. We also exit on any heading regardless of
//    indent (headings reset the indent fold scope).
function exits(
	active: ActiveFold,
	block: { type?: string; indent?: number },
): boolean {
	const blockIndent = block.indent ?? 0
	const blockHeading =
		block.type && HEADING_TYPES[block.type] !== undefined
			? HEADING_TYPES[block.type]
			: null

	if (active.kind === "heading") {
		return blockHeading !== null && blockHeading <= active.level
	}
	// active.kind === "indent"
	if (blockHeading !== null) {
		return true
	}
	return blockIndent <= active.indent
}

export function computeHidden(
	blocks: Array<{ id?: string; type?: string; indent?: number }>,
	foldedIds: ReadonlySet<string>,
): Set<string> {
	const hidden = new Set<string>()
	const stack: ActiveFold[] = []

	for (const block of blocks) {
		const id = block.id
		if (!id) continue

		// Pop folds that this block exits.
		while (stack.length > 0 && exits(stack[stack.length - 1]!, block)) {
			stack.pop()
		}

		if (stack.length > 0) {
			hidden.add(id)
		}

		if (foldedIds.has(id)) {
			const info = getFoldableInfo(block)
			if (info) {
				stack.push({ id, ...info })
			}
		}
	}

	return hidden
}

// True if `blocks[idx]` has at least one block "under" it in fold semantics:
//  - For a heading at level L, any subsequent block before the next H<=L counts.
//  - For an indented block at indent I, any subsequent block with indent > I
//    (before the next heading or any block with indent <= I) counts.
export function blockHasChildren(
	blocks: Array<{ id?: string; type?: string; indent?: number }>,
	idx: number,
): boolean {
	if (idx < 0 || idx >= blocks.length) return false
	const self = blocks[idx]!
	const info = getFoldableInfo(self)
	if (!info) return false

	const next = blocks[idx + 1]
	if (!next) return false

	if (info.kind === "heading") {
		const nextHeading =
			next.type && HEADING_TYPES[next.type] !== undefined
				? HEADING_TYPES[next.type]
				: null
		return nextHeading === null || nextHeading > info.level
	}
	// info.kind === "indent": children must have greater indent and not be a
	// heading (headings reset the indent scope).
	const nextIndent = next.indent ?? 0
	const isHeading = next.type && HEADING_TYPES[next.type] !== undefined
	if (isHeading) return false
	return nextIndent > info.indent
}

// Find the closest block at or above `idx` that is foldable AND has children
// to fold. Returns its index, or null if no such block exists in scope.
// "In scope" follows the same exit rules as fold visibility.
export function findFoldTarget(
	blocks: Array<{ id?: string; type?: string; indent?: number }>,
	idx: number,
): number | null {
	if (idx < 0 || idx >= blocks.length) return null

	// First, check the block itself.
	if (blockHasChildren(blocks, idx)) {
		return idx
	}

	const self = blocks[idx]!
	const selfIndent = self.indent ?? 0
	const selfHeading =
		self.type && HEADING_TYPES[self.type] !== undefined
			? HEADING_TYPES[self.type]
			: null

	for (let i = idx - 1; i >= 0; i--) {
		const candidate = blocks[i]!
		const candidateInfo = getFoldableInfo(candidate)
		if (!candidateInfo) continue

		if (candidateInfo.kind === "heading") {
			// If self is a heading of same or higher importance, this candidate
			// is not an ancestor.
			if (selfHeading !== null && selfHeading <= candidateInfo.level) {
				continue
			}
			if (blockHasChildren(blocks, i)) return i
			continue
		}

		// indent ancestor: must be strictly less indented than self.
		if (candidateInfo.indent < selfIndent) {
			if (blockHasChildren(blocks, i)) return i
		}
	}
	return null
}
