import { createPlatePlugin } from "platejs/react"
import { moveBlockDown, moveBlockUp } from "./shortcuts-kit"

/**
 * Extra block-move bindings for users who prefer ⌘⇧↑ / ⌘⇧↓ over the
 * upstream default of ⌥↑ / ⌥↓ (which still works — these are additive).
 *
 * Lives in its own kit so the diff against upstream's shortcuts-kit
 * stays empty and future merges don't conflict.
 */
export const MoveBlockShortcutsPlugin = createPlatePlugin({
	key: "mindnoteMoveBlockShortcuts",
	shortcuts: {
		moveBlockUpCmdShift: {
			keys: "mod+shift+arrowup",
			handler: ({ editor, event }) => {
				event?.preventDefault?.()
				moveBlockUp(editor)
				return true
			},
		},
		moveBlockDownCmdShift: {
			keys: "mod+shift+arrowdown",
			handler: ({ editor, event }) => {
				event?.preventDefault?.()
				moveBlockDown(editor)
				return true
			},
		},
	},
})

export const MoveBlockShortcutsKit = [MoveBlockShortcutsPlugin]
