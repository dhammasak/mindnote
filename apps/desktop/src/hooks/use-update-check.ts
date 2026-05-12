import { useEffect } from "react"
import { toast } from "sonner"
import {
	checkForUpdate,
	openUpdateDmg,
	type UpdateCheckResult,
} from "@/lib/updater"

const LAST_CHECK_KEY = "mindnote.lastUpdateCheckAt"
const AUTO_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours
const LAUNCH_DELAY_MS = 5_000 // wait 5s after launch so it doesn't compete with workspace bootstrap

function shouldAutoCheck(): boolean {
	const last = localStorage.getItem(LAST_CHECK_KEY)
	if (!last) return true
	const elapsed = Date.now() - Number(last)
	return Number.isNaN(elapsed) || elapsed > AUTO_CHECK_INTERVAL_MS
}

function recordCheckedNow(): void {
	localStorage.setItem(LAST_CHECK_KEY, String(Date.now()))
}

function notifyUpdateAvailable(
	result: Extract<UpdateCheckResult, { status: "available" }>,
): void {
	toast(`MindNote ${result.manifest.version} is available`, {
		description:
			result.manifest.notes ??
			`You're on ${result.current}. Click Install to mount the DMG, then drag MindNote.app into /Applications.`,
		duration: 30_000,
		action: {
			label: "Install",
			onClick: () => {
				void openUpdateDmg(result.dmgPath)
			},
		},
	})
}

/**
 * Run an update check 5 seconds after the app launches, throttled to once
 * per 24 hours. Only used by the main App component — Quick Note windows
 * don't need their own check.
 */
export function useAutoUpdateCheck(): void {
	useEffect(() => {
		if (!shouldAutoCheck()) return
		const handle = setTimeout(async () => {
			const result = await checkForUpdate()
			recordCheckedNow()
			if (result.status === "available") {
				notifyUpdateAvailable(result)
			}
		}, LAUNCH_DELAY_MS)
		return () => clearTimeout(handle)
	}, [])
}

/**
 * Triggered from the macOS "MindNote → Check for Update…" menu item.
 * Always shows feedback (toast) regardless of whether an update is found.
 */
export async function runManualUpdateCheck(): Promise<void> {
	const result = await checkForUpdate()
	recordCheckedNow()

	switch (result.status) {
		case "available":
			notifyUpdateAvailable(result)
			break
		case "current":
			toast.success(`MindNote is up to date (v${result.current})`)
			break
		case "no-manifest":
			toast.error("No update manifest found", {
				description: `Expected at ${result.releasesDir}/latest.json — make sure iCloud Drive has finished syncing.`,
				duration: 10_000,
			})
			break
		case "error":
			toast.error("Update check failed", { description: result.error })
			break
	}
}
