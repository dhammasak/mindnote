import { NodeApi, usePlateEditor, type Value } from "@mdit/editor/plate"
import { EditorSurface } from "@mdit/editor/shared"
import { getEditorTitleText, stripEditorTitleBlock } from "@mdit/editor/title"
import { Button } from "@mdit/ui/components/button"
import { invoke } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { save as saveDialog } from "@tauri-apps/plugin-dialog"
import { exists, writeTextFile } from "@tauri-apps/plugin-fs"
import { join } from "pathe"
import { useCallback, useEffect } from "react"
import { toast } from "sonner"
import { useLocation } from "wouter"
import { isMac } from "@/utils/platform"
import { EditorKit } from "../editor/plugins/editor-kit"
import { WindowPinButton } from "./window-pin-button"

// Strip filesystem-unsafe chars and clamp to a sane length.
function sanitizeFilename(name: string): string {
	return (
		name
			// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional control-char filter for filesystem safety
			.replace(/[/\\:*?"<>|\x00-\x1f]/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 200)
	)
}

// Find a non-conflicting path under `dir`. "Foo.md", "Foo 2.md", "Foo 3.md", …
async function findUniquePath(dir: string, baseName: string): Promise<string> {
	let candidate = join(dir, `${baseName}.md`)
	if (!(await exists(candidate))) return candidate
	let n = 2
	// Cap at 9999 to avoid runaway loops; if we hit it, fall back to a timestamp suffix.
	while (n < 10000) {
		candidate = join(dir, `${baseName} ${n}.md`)
		if (!(await exists(candidate))) return candidate
		n++
	}
	return join(dir, `${baseName} ${Date.now()}.md`)
}

// Read editor → (filename, body markdown). Returns null if both are empty.
function buildNotePayload(
	editorValue: Value,
	serialize: (opts: { value: Value }) => string,
): { fileBase: string; body: string } | null {
	const titleText = getEditorTitleText(editorValue).trim()
	const body = serialize({ value: stripEditorTitleBlock(editorValue) })
	if (!titleText && !body.trim()) {
		return null
	}
	const sanitized = sanitizeFilename(titleText)
	return { fileBase: sanitized || "Untitled", body }
}

// The Quick Note window doesn't bootstrap the full workspace lifecycle, so
// `useStore.getState().workspacePath` is always null in this window. Ask the
// Rust backend directly for the recent workspaces and use the most recent.
async function loadActiveWorkspacePath(): Promise<string | null> {
	try {
		const paths = await invoke<string[]>("list_vault_workspaces_command")
		return paths[0] ?? null
	} catch (error) {
		console.error("Failed to load workspace paths:", error)
		return null
	}
}

export function QuickNote() {
	const [, navigate] = useLocation()
	const editor = usePlateEditor({
		chunking: {
			chunkSize: 500,
			contentVisibilityAuto: true,
			query: NodeApi.isEditor,
		},
		plugins: EditorKit,
	})

	useEffect(() => {
		editor.tf.focus()
	}, [editor])

	// ⌘S: save and switch to the in-app edit view (window stays open).
	const handleSave = useCallback(async () => {
		try {
			const payload = buildNotePayload(
				editor.children as Value,
				editor.api.markdown.serialize,
			)
			if (!payload) return

			const workspacePath = await loadActiveWorkspacePath()
			let savedPath: string
			if (workspacePath) {
				savedPath = await findUniquePath(workspacePath, payload.fileBase)
				await writeTextFile(savedPath, payload.body)
			} else {
				// No workspace yet — fall back to a native dialog.
				const chosenPath = await saveDialog({
					title: "Save Note",
					defaultPath: `${payload.fileBase}.md`,
					filters: [{ name: "Markdown", extensions: ["md"] }],
				})
				if (!chosenPath) return
				await writeTextFile(chosenPath, payload.body)
				savedPath = chosenPath
			}
			navigate(`/edit?path=${encodeURIComponent(savedPath)}`, { replace: true })
		} catch (error) {
			console.error("Failed to save file:", error)
			toast.error("Failed to save file")
		}
	}, [editor, navigate])

	// Save button / ⌘Enter / Esc: save and close the Quick Note window.
	const handleSaveAndClose = useCallback(async () => {
		const appWindow = getCurrentWindow()
		try {
			// Empty note → close immediately without saving anything.
			const payload = buildNotePayload(
				editor.children as Value,
				editor.api.markdown.serialize,
			)
			if (!payload) {
				await appWindow.close()
				return
			}

			const workspacePath = await loadActiveWorkspacePath()
			if (workspacePath) {
				const filePath = await findUniquePath(workspacePath, payload.fileBase)
				await writeTextFile(filePath, payload.body)
				await appWindow.close()
				return
			}

			// No workspace — fall back to native dialog; keep window open if user cancels.
			const chosenPath = await saveDialog({
				title: "Save Note",
				defaultPath: `${payload.fileBase}.md`,
				filters: [{ name: "Markdown", extensions: ["md"] }],
			})
			if (!chosenPath) return
			await writeTextFile(chosenPath, payload.body)
			await appWindow.close()
		} catch (error) {
			console.error("Failed to save file:", error)
			toast.error("Failed to save file")
		}
	}, [editor])

	// Window-level capture-phase keydown handler. EditorSurface only exposes
	// onKeyDown on the outer container, *after* Plate's editable consumes
	// many keys (Esc, ⌘S, ⌘Enter), so we attach at window level with capture
	// phase to catch them before Plate sees them.
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const isMod = e.metaKey || e.ctrlKey
			if (isMod && !e.shiftKey && !e.altKey && e.key === "Enter") {
				e.preventDefault()
				e.stopPropagation()
				void handleSaveAndClose()
			} else if (e.key === "Escape") {
				e.preventDefault()
				e.stopPropagation()
				void handleSaveAndClose()
			} else if (isMod && !e.shiftKey && !e.altKey && e.key === "s") {
				e.preventDefault()
				e.stopPropagation()
				void handleSave()
			}
		}
		window.addEventListener("keydown", handler, true)
		return () => window.removeEventListener("keydown", handler, true)
	}, [handleSave, handleSaveAndClose])

	useEffect(() => {
		const appWindow = getCurrentWindow()
		const closeListener = appWindow.listen("tauri://close-requested", () => {
			appWindow.destroy()
		})

		return () => {
			closeListener.then((unlisten) => unlisten())
		}
	}, [])

	return (
		<div className="h-screen flex flex-col overflow-hidden bg-background">
			<div
				className="relative h-12 shrink-0 flex items-center justify-end px-2"
				{...(isMac() && { "data-tauri-drag-region": "" })}
			>
				<WindowPinButton />
			</div>
			<div className="flex-1 min-h-0 overflow-auto">
				<EditorSurface editor={editor} />
			</div>
			<div className="shrink-0 flex items-center justify-end px-3 py-2 border-t border-border/50">
				<Button
					type="button"
					size="sm"
					onClick={() => {
						void handleSaveAndClose()
					}}
				>
					Save
					<kbd className="ml-2 inline-flex items-center gap-0.5 font-mono text-[0.7rem] opacity-70">
						<span>⌘</span>
						<span>↵</span>
					</kbd>
				</Button>
			</div>
		</div>
	)
}
