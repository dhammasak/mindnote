import { exists, mkdir } from "@tauri-apps/plugin-fs"
import { join } from "pathe"
import { useStore } from "@/store"

/**
 * Default subfolder under the workspace where new notes are placed when the
 * user hasn't explicitly chosen a target directory (e.g. via right-click in
 * the file explorer).
 *
 * Right-click-driven note creation in the file explorer bypasses this helper
 * and uses the directly-clicked folder instead.
 */
export const DEFAULT_NEW_NOTE_SUBFOLDER = "MindNote"

/**
 * Resolve the default folder where new notes should land:
 * `<workspacePath>/MindNote/`, ensuring the directory exists.
 *
 * Returns `null` when no workspace is set so callers can fall back gracefully.
 */
export async function ensureDefaultNoteFolder(): Promise<string | null> {
	const workspacePath = useStore.getState().workspacePath
	if (!workspacePath) {
		return null
	}

	const targetDir = join(workspacePath, DEFAULT_NEW_NOTE_SUBFOLDER)
	if (!(await exists(targetDir))) {
		await mkdir(targetDir, { recursive: true })
	}
	return targetDir
}

/**
 * Create + open a new note inside the default MindNote subfolder.
 * Used by the macOS File menu and the create-note hotkey (e.g. ⌘N).
 *
 * No-op when no workspace is set.
 */
export async function createNoteInDefaultFolder(): Promise<void> {
	const targetDir = await ensureDefaultNoteFolder()
	if (!targetDir) return
	await useStore.getState().createNote(targetDir, { openTab: true })
}
