import type { WorkspaceEntry } from "@mdit/store/core"
import { useMemo } from "react"
import { useShallow } from "zustand/shallow"
import { useStore } from "@/store"

const MAX_RECENT = 20

function collectMarkdownFiles(
	items: WorkspaceEntry[],
	bucket: WorkspaceEntry[],
): void {
	for (const item of items) {
		if (item.isDirectory) {
			if (item.children) collectMarkdownFiles(item.children, bucket)
			continue
		}
		if (item.name.toLowerCase().endsWith(".md")) {
			bucket.push(item)
		}
	}
}

function formatRelative(date: Date | undefined): string {
	if (!date) return ""
	const now = Date.now()
	const diffMs = now - date.getTime()
	const diffMin = Math.floor(diffMs / 60_000)
	if (diffMin < 1) return "just now"
	if (diffMin < 60) return `${diffMin}m ago`
	const diffHr = Math.floor(diffMin / 60)
	if (diffHr < 24) return `${diffHr}h ago`
	const diffDay = Math.floor(diffHr / 24)
	if (diffDay < 7) return `${diffDay}d ago`
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	})
}

function stripMdExtension(name: string): string {
	return name.replace(/\.mdx?$/i, "")
}

/**
 * Empty-state view for the editor pane: shows the most recently modified
 * markdown notes in the workspace (including notes created via Quick Note
 * that land in the same vault). Clicking a row opens the note in a new tab.
 */
export function RecentNotes() {
	const { entries, openTab } = useStore(
		useShallow((s) => ({
			entries: s.entries,
			openTab: s.openTab,
		})),
	)

	const recent = useMemo<WorkspaceEntry[]>(() => {
		const bucket: WorkspaceEntry[] = []
		collectMarkdownFiles(entries, bucket)
		bucket.sort((a, b) => {
			const aTime = a.modifiedAt?.getTime() ?? 0
			const bTime = b.modifiedAt?.getTime() ?? 0
			return bTime - aTime
		})
		return bucket.slice(0, MAX_RECENT)
	}, [entries])

	if (recent.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center text-muted-foreground/70 text-sm">
				No notes yet. Create one to get started.
			</div>
		)
	}

	return (
		<div className="h-full w-full overflow-y-auto">
			<div className="mx-auto max-w-2xl px-8 pt-16 pb-24">
				<h1 className="mb-1 text-2xl font-semibold tracking-tight">
					Recent notes
				</h1>
				<p className="mb-8 text-sm text-muted-foreground">
					Most recently modified notes in this workspace.
				</p>
				<ul className="space-y-1">
					{recent.map((file) => (
						<li key={file.path}>
							<button
								type="button"
								onClick={() => void openTab(file.path)}
								className="group flex w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
							>
								<span className="truncate text-sm font-medium group-hover:text-foreground">
									{stripMdExtension(file.name)}
								</span>
								<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
									{formatRelative(file.modifiedAt)}
								</span>
							</button>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
