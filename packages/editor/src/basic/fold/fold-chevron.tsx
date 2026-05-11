import { cn } from "@mdit/ui/lib/utils"
import { ChevronRight } from "lucide-react"
import { useEditorRef, usePluginOption } from "platejs/react"
import { useCallback } from "react"
import { FoldPlugin, toggleFoldBlock } from "./fold-kit"

type FoldChevronProps = {
	elementId: string
	className?: string
	ariaLabel?: string
}

/**
 * Chevron button rendered alongside foldable blocks (headings and list items
 * with children). Click toggles the fold state of the given element.
 *
 * The chevron rotates 90° clockwise (▼) when open and points right (▶) when
 * folded, mirroring Obsidian's heading fold control.
 */
export function FoldChevron({
	elementId,
	className,
	ariaLabel = "Toggle fold",
}: FoldChevronProps) {
	const editor = useEditorRef()
	const foldedIds = usePluginOption(FoldPlugin, "foldedIds")
	const isFolded = foldedIds.includes(elementId)

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()
			toggleFoldBlock(editor, elementId)
		},
		[editor, elementId],
	)

	return (
		<button
			type="button"
			contentEditable={false}
			aria-label={ariaLabel}
			aria-expanded={!isFolded}
			onMouseDown={(e) => e.preventDefault()}
			onClick={handleClick}
			className={cn(
				"mn-fold-chevron text-muted-foreground hover:text-foreground",
				"absolute top-1/2 -translate-y-1/2 grid place-items-center",
				"size-5 -left-6 rounded select-none",
				"opacity-0 group-hover:opacity-100 transition-opacity",
				isFolded && "opacity-100",
				className,
			)}
		>
			<ChevronRight
				className={cn(
					"size-3.5 transition-transform",
					!isFolded && "rotate-90",
				)}
			/>
		</button>
	)
}
