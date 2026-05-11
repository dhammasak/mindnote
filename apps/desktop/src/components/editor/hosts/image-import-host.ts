import { isPathEqualOrDescendant } from "@mdit/utils/path-utils"
import { exists, mkdir } from "@tauri-apps/plugin-fs"
import { join } from "pathe"
import { useStore } from "@/store"
import { buildImageLinkData, type ImageLinkData } from "../utils/image-link"

// All pasted/dropped attachments land here, mirroring TETY's Obsidian setup
// where every media file lives in `<vault>/Attached File/`.
const ATTACHMENTS_SUBFOLDER = "Attached File"

export type PreparedEditorImageLink = ImageLinkData & {
	absolutePath: string
}

export type PrepareImageForEditorInsertDeps = {
	getWorkspacePath: () => string | null
	copyEntry: (
		sourcePath: string,
		destinationPath: string,
	) => Promise<string | null>
	buildImageLink: (path: string) => ImageLinkData
	ensureDirectory?: (path: string) => Promise<void>
}

export class EditorImageImportError extends Error {
	readonly path: string

	constructor(path: string) {
		super("Failed to import image into workspace.")
		this.name = "EditorImageImportError"
		this.path = path
	}
}

const defaultEnsureDirectory = async (path: string): Promise<void> => {
	if (!(await exists(path))) {
		await mkdir(path, { recursive: true })
	}
}

const defaultRuntimeDeps: PrepareImageForEditorInsertDeps = {
	getWorkspacePath: () => useStore.getState().workspacePath,
	copyEntry: (sourcePath, destinationPath) =>
		useStore.getState().copyEntry(sourcePath, destinationPath),
	buildImageLink: buildImageLinkData,
	ensureDirectory: defaultEnsureDirectory,
}

export async function prepareImageForEditorInsert(
	path: string,
	runtimeDeps: PrepareImageForEditorInsertDeps = defaultRuntimeDeps,
): Promise<PreparedEditorImageLink> {
	const trimmedPath = path.trim()
	const workspacePath = runtimeDeps.getWorkspacePath()

	if (
		!trimmedPath ||
		!workspacePath ||
		isPathEqualOrDescendant(trimmedPath, workspacePath)
	) {
		return {
			absolutePath: trimmedPath,
			...runtimeDeps.buildImageLink(trimmedPath),
		}
	}

	// Route every imported attachment to <workspace>/Attached File/.
	const attachmentsDir = join(workspacePath, ATTACHMENTS_SUBFOLDER)
	const ensureDirectory = runtimeDeps.ensureDirectory ?? defaultEnsureDirectory
	await ensureDirectory(attachmentsDir)

	const copiedPath = await runtimeDeps.copyEntry(trimmedPath, attachmentsDir)
	if (!copiedPath) {
		throw new EditorImageImportError(trimmedPath)
	}

	return {
		absolutePath: copiedPath,
		...runtimeDeps.buildImageLink(copiedPath),
	}
}
