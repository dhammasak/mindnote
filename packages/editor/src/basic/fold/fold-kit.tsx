import type { PlateEditor } from "platejs/react"
import { createPlatePlugin, type RenderNodeWrapper } from "platejs/react"
import { findFoldableAncestor, getFoldableInfo } from "./fold-utils"
import { FoldWrapper } from "./fold-wrapper"

export type FoldPluginOptions = {
	foldedIds: string[]
}

type BlockLike = { id?: unknown; type?: unknown; indent?: unknown }

function readBlocks(editor: PlateEditor): BlockLike[] {
	return editor.children as BlockLike[]
}

function resolveFoldTargetId(
	blocks: BlockLike[],
	path: readonly number[],
): string | null {
	if (path.length === 0) return null
	const idx = path[0] as number
	if (idx < 0 || idx >= blocks.length) return null

	const self = blocks[idx]!
	const summary = {
		type: typeof self.type === "string" ? self.type : undefined,
		indent: typeof self.indent === "number" ? self.indent : undefined,
	}

	if (getFoldableInfo(summary)) {
		return typeof self.id === "string" ? self.id : null
	}

	const summaries = blocks.map((b) => ({
		id: typeof b.id === "string" ? b.id : undefined,
		type: typeof b.type === "string" ? b.type : undefined,
		indent: typeof b.indent === "number" ? b.indent : undefined,
	}))
	const ancestorIdx = findFoldableAncestor(summaries, idx)
	if (ancestorIdx === null) return null
	return summaries[ancestorIdx]?.id ?? null
}

const foldAboveNodes: RenderNodeWrapper = (props) => {
	if (props.path.length !== 1) return
	return (innerProps) => <FoldWrapper {...innerProps} />
}

export const FoldPlugin = createPlatePlugin({
	key: "fold",
	options: {
		foldedIds: [] as string[],
	} satisfies FoldPluginOptions,
}).configure({
	render: {
		aboveNodes: foldAboveNodes,
	},
	shortcuts: {
		foldMore: {
			keys: "mod+arrowdown",
			handler: ({ editor, event }) => {
				const selection = editor.selection
				if (!selection) return false
				const blocks = readBlocks(editor)
				const target = resolveFoldTargetId(blocks, selection.anchor.path)
				if (!target) return false
				const current = editor.getOption(FoldPlugin, "foldedIds")
				if (current.includes(target)) return false
				event?.preventDefault?.()
				editor.setOption(FoldPlugin, "foldedIds", [...current, target])
				return true
			},
		},
		foldLess: {
			keys: "mod+arrowup",
			handler: ({ editor, event }) => {
				const selection = editor.selection
				if (!selection) return false
				const blocks = readBlocks(editor)
				const target = resolveFoldTargetId(blocks, selection.anchor.path)
				if (!target) return false
				const current = editor.getOption(FoldPlugin, "foldedIds")
				if (!current.includes(target)) return false
				event?.preventDefault?.()
				editor.setOption(
					FoldPlugin,
					"foldedIds",
					current.filter((x) => x !== target),
				)
				return true
			},
		},
	},
})

export function foldBlock(editor: PlateEditor, id: string): void {
	const current = editor.getOption(FoldPlugin, "foldedIds")
	if (current.includes(id)) return
	editor.setOption(FoldPlugin, "foldedIds", [...current, id])
}

export function unfoldBlock(editor: PlateEditor, id: string): void {
	const current = editor.getOption(FoldPlugin, "foldedIds")
	if (!current.includes(id)) return
	editor.setOption(
		FoldPlugin,
		"foldedIds",
		current.filter((x) => x !== id),
	)
}

export function toggleFoldBlock(editor: PlateEditor, id: string): void {
	const current = editor.getOption(FoldPlugin, "foldedIds")
	if (current.includes(id)) {
		editor.setOption(
			FoldPlugin,
			"foldedIds",
			current.filter((x) => x !== id),
		)
	} else {
		editor.setOption(FoldPlugin, "foldedIds", [...current, id])
	}
}

export const FoldKit = [FoldPlugin]
