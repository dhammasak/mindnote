import { useEditorSelector } from "platejs/react"

/**
 * Returns true when the block at `path` has subsequent content that would be
 * hidden if this block were folded. The rule mirrors the indent-fold visibility
 * model: a block has children when the next top-level block has a strictly
 * greater indent (so it's structurally "inside" this one).
 *
 * Headings have a different children rule and use their own logic in
 * fold-utils:blockHasChildren — that variant is not exposed here yet because
 * heading elements decide chevron visibility on their own.
 */
export function useBlockHasChildren(
	path: readonly number[],
	indent: number,
): boolean {
	const topLevelIdx = path[0]
	return useEditorSelector(
		(editor) => {
			if (typeof topLevelIdx !== "number") return false
			const next = editor.children[topLevelIdx + 1] as
				| { indent?: number }
				| undefined
			if (!next) return false
			return (next.indent ?? 0) > indent
		},
		[topLevelIdx, indent],
	)
}
