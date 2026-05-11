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
	const indent = block.indent ?? 0
	if (indent > 0) {
		return { kind: "indent", indent }
	}
	return null
}

type ActiveFold = { id: string } & FoldableInfo

// A block "exits" an active fold when:
//  - active fold is a heading at level L, current block is a heading at level <= L
//  - active fold is an indent at level I, current block has indent <= I AND is not
//    a strictly deeper continuation. We also exit on any heading regardless of
//    indent (headings reset the indent fold scope).
function exits(active: ActiveFold, block: { type?: string; indent?: number }): boolean {
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

// Find the closest foldable ancestor of a block at index `idx`.
// "Ancestor" here means: a heading above that contains this block in its fold scope,
// or an indented block above with smaller indent than this block.
// Returns the index of the foldable block, or null if none.
export function findFoldableAncestor(
	blocks: Array<{ id?: string; type?: string; indent?: number }>,
	idx: number,
): number | null {
	if (idx < 0 || idx >= blocks.length) return null
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
			// A heading is an ancestor of self if self is not also a heading
			// of same/lower level. (Otherwise self is a sibling/parent.)
			if (selfHeading !== null && selfHeading <= candidateInfo.level) {
				continue
			}
			return i
		}

		// candidateInfo.kind === "indent"
		// If we cross a heading above us, the indent ancestor is invalidated.
		// (handled by continuing past)
		if (candidateInfo.indent < selfIndent) {
			return i
		}
	}
	return null
}
