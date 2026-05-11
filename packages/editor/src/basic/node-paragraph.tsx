import { cn } from "@mdit/ui/lib/utils"
import type { PlateElementProps } from "platejs/react"
import { PlateElement } from "platejs/react"
import { FoldChevron, useBlockHasChildren } from "./fold"

export function ParagraphElement(props: PlateElementProps) {
	const indent = ((props.element as { indent?: number }).indent ?? 0) as number
	const elementId =
		typeof props.element.id === "string" ? props.element.id : undefined
	const hasChildren = useBlockHasChildren(props.path, indent)

	return (
		// TODO: Styling issue - className is not being applied correctly
		// Temporary workaround: styles defined in globals.css as .slate-p
		<PlateElement {...props} className={cn("my-0.5 px-0 py-1 group")}>
			{elementId && hasChildren && <FoldChevron elementId={elementId} />}
			{props.children}
		</PlateElement>
	)
}
