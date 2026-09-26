import { exists } from "@tauri-apps/plugin-fs"
import { dirname, join } from "pathe"
import { useEffect } from "react"
import { useFontScale } from "@/hooks/use-font-scale"
import { useStore } from "@/store"
import { Editor } from "../editor/editor"
import { SettingsDialog } from "../settings"

// Walk up from the file's directory looking for a vault marker
// (`.obsidian/` for Obsidian vaults, `.mindnote/` for our own workspace state
// dir). Returns the directory that contains the marker, i.e. the vault root.
async function detectVaultRoot(filePath: string): Promise<string | null> {
	if (!filePath) return null
	let dir = dirname(filePath)
	let lastDir = ""
	while (dir && dir !== lastDir && dir !== "/" && dir !== ".") {
		if (
			(await exists(join(dir, ".obsidian"))) ||
			(await exists(join(dir, ".mindnote")))
		) {
			return dir
		}
		lastDir = dir
		dir = dirname(dir)
	}
	return null
}

export function EditNote({ filePath }: { filePath: string }) {
	useFontScale()
	const setIsEditMode = useStore((s) => s.setIsEditMode)
	const openTab = useStore((s) => s.openTab)

	useEffect(() => {
		setIsEditMode(true)
		let cancelled = false

		const openWithWorkspace = async () => {
			// Edit windows are fresh webviews with no workspace context, so
			// wikilinks have no vault root to resolve against. If the file lives
			// under an Obsidian or MindNote vault, hydrate the workspace from
			// that root so [[wiki]] links can navigate.
			const currentWorkspace = useStore.getState().workspacePath
			if (!currentWorkspace) {
				const vaultRoot = await detectVaultRoot(filePath)
				if (cancelled) return
				if (vaultRoot) {
					try {
						await useStore.getState().setWorkspace(vaultRoot)
					} catch (error) {
						console.error("Failed to hydrate workspace for edit window", error)
					}
				}
			}
			if (cancelled) return
			openTab(filePath)
		}

		openWithWorkspace().catch(console.error)
		return () => {
			cancelled = true
		}
	}, [setIsEditMode, filePath, openTab])

	return (
		<>
			<div className="h-screen flex flex-col bg-muted">
				<div className="flex-1 flex overflow-hidden">
					<Editor destroyOnClose />
				</div>
			</div>
			<SettingsDialog />
		</>
	)
}
