import { cn } from "@mdit/ui/lib/utils"
import {
	type PlateElementProps,
	useEditorSelector,
	usePluginOption,
} from "platejs/react"
import { useMemo } from "react"
import { FoldPlugin } from "./fold-kit"
import { computeHidden } from "./fold-utils"

type BlockSummary = { id?: string; type?: string; indent?: number }

function summariseBlocks(
	children: readonly { id?: unknown; type?: unknown; indent?: unknown }[],
): BlockSummary[] {
	return children.map((c) => ({
		id: typeof c.id === "string" ? c.id : undefined,
		type: typeof c.type === "string" ? c.type : undefined,
		indent: typeof c.indent === "number" ? c.indent : undefined,
	}))
}

function blockSummariesEqual(a: BlockSummary[], b: BlockSummary[]): boolean {
	if (a === b) return true
	if (a.length !== b.length) return false
	for (let i = 0; i < a.length; i++) {
		const x = a[i]!
		const y = b[i]!
		if (x.id !== y.id || x.type !== y.type || x.indent !== y.indent) {
			return false
		}
	}
	return true
}

export function FoldWrapper(props: PlateElementProps) {
	const foldedIds = usePluginOption(FoldPlugin, "foldedIds")

	const blocks = useEditorSelector(
		(editor) =>
			summariseBlocks(
				editor.children as Array<{
					id?: unknown
					type?: unknown
					indent?: unknown
				}>,
			),
		[],
		{ equalityFn: blockSummariesEqual },
	)

	const hiddenIds = useMemo(
		() => computeHidden(blocks, new Set(foldedIds)),
		[blocks, foldedIds],
	)

	const elementId =
		typeof props.element.id === "string" ? props.element.id : undefined
	const isHidden = elementId !== undefined && hiddenIds.has(elementId)

	return (
		<div className={cn("mn-fold-block", isHidden && "mn-fold-hidden")}>
			{props.children}
		</div>
	)
}
