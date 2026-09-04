import { KEYS } from "platejs"
import { createPlatePlugin } from "platejs/react"

/**
 * Cmd+L cycles the block at the cursor through todo states:
 *   1. Not a todo  → unchecked todo
 *   2. Unchecked   → checked
 *   3. Checked     → unchecked (loops with state 2)
 *
 * Backspace at the start of a top-level todo still converts it back to a
 * plain paragraph (handled by indent-kit), so the user has a way out of
 * the toggle loop.
 */
export const TodoCyclePlugin = createPlatePlugin({
	key: "mindnoteTodoCycle",
	shortcuts: {
		todoCycle: {
			keys: "mod+l",
			handler: ({ editor, event }) => {
				const entry = editor.api.above({
					match: editor.api.isBlock,
					mode: "highest",
				})
				if (!entry) return false

				const [node, path] = entry

				// Don't transform structural blocks where a todo doesn't make sense.
				if (
					node.type === editor.getType(KEYS.codeBlock) ||
					node.type === editor.getType(KEYS.table) ||
					node.type === editor.getType(KEYS.tr) ||
					node.type === editor.getType(KEYS.td)
				) {
					return false
				}

				const listStyleType = (node as { listStyleType?: string }).listStyleType
				const checked = (node as { checked?: boolean }).checked
				const currentIndent = (node as { indent?: number }).indent ?? 0

				event?.preventDefault?.()

				if (listStyleType !== KEYS.listTodo) {
					// Not a todo yet — convert. Preserve existing indent if present,
					// otherwise default to indent=1 so the block renders as a list.
					editor.tf.setNodes(
						{
							listStyleType: KEYS.listTodo,
							checked: false,
							indent: currentIndent > 0 ? currentIndent : 1,
						},
						{ at: path },
					)
					return true
				}

				// Already a todo — toggle the checkbox.
				editor.tf.setNodes({ checked: checked !== true }, { at: path })
				return true
			},
		},
	},
})

export const TodoCycleKit = [TodoCyclePlugin]
