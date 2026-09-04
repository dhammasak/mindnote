import type { PlateEditor } from "platejs/react"
import { createPlatePlugin, type RenderNodeWrapper } from "platejs/react"
import { findFoldTarget } from "./fold-utils"
import { FoldWrapper } from "./fold-wrapper"

export type FoldPluginOptions = {
	foldedIds: string[]
}

type BlockLike = { id?: unknown; type?: unknown; indent?: unknown }

function readBlockSummaries(editor: PlateEditor): Array<{
	id?: string
	type?: string
	indent?: number
}> {
	return (editor.children as BlockLike[]).map((b) => ({
		id: typeof b.id === "string" ? b.id : undefined,
		type: typeof b.type === "string" ? b.type : undefined,
		indent: typeof b.indent === "number" ? b.indent : undefined,
	}))
}

function resolveFoldTargetId(
	editor: PlateEditor,
	path: readonly number[],
): string | null {
	if (path.length === 0) return null
	const idx = path[0] as number
	const summaries = readBlockSummaries(editor)
	const targetIdx = findFoldTarget(summaries, idx)
	if (targetIdx === null) return null
	return summaries[targetIdx]?.id ?? null
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
		foldToggleDown: {
			keys: "mod+arrowdown",
			handler: ({ editor, event }) => {
				const selection = editor.selection
				if (!selection) return false
				const target = resolveFoldTargetId(editor, selection.anchor.path)
				if (!target) return false
				event?.preventDefault?.()
				const current = editor.getOption(FoldPlugin, "foldedIds")
				const next = current.includes(target)
					? current.filter((x) => x !== target)
					: [...current, target]
				editor.setOption(FoldPlugin, "foldedIds", next)
				return true
			},
		},
		foldToggleUp: {
			keys: "mod+arrowup",
			handler: ({ editor, event }) => {
				const selection = editor.selection
				if (!selection) return false
				const target = resolveFoldTargetId(editor, selection.anchor.path)
				if (!target) return false
				event?.preventDefault?.()
				const current = editor.getOption(FoldPlugin, "foldedIds")
				const next = current.includes(target)
					? current.filter((x) => x !== target)
					: [...current, target]
				editor.setOption(FoldPlugin, "foldedIds", next)
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
