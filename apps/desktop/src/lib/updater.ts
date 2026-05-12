import { getVersion } from "@tauri-apps/api/app"
import { homeDir } from "@tauri-apps/api/path"
import { exists, readTextFile } from "@tauri-apps/plugin-fs"
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener"
import { join } from "pathe"

/**
 * MindNote auto-updater built on top of an iCloud Drive "drop box".
 *
 * Flow: dev machine builds a `.dmg`, copies it into the iCloud Releases
 * folder, and writes `latest.json`. iCloud syncs both files to every other
 * Mac. The app reads `latest.json` from the local mount path, compares
 * versions, and prompts the user to install if a newer version exists.
 *
 * No HTTP server, no signing keys, no notarization required.
 * The user has to manually drag the new `.app` from the mounted DMG to
 * `/Applications` (one-click confirmation per release).
 */

const ICLOUD_RELEASES_REL =
	"Library/Mobile Documents/com~apple~CloudDocs/MindNote/Releases"

const MANIFEST_FILENAME = "latest.json"

export type UpdateManifest = {
	version: string
	released?: string
	dmg: string
	notes?: string
}

export type UpdateCheckResult =
	| {
			status: "available"
			current: string
			manifest: UpdateManifest
			dmgPath: string
	  }
	| { status: "current"; current: string; latest: string }
	| { status: "no-manifest"; releasesDir: string }
	| { status: "error"; error: string }

async function getReleasesDir(): Promise<string> {
	return join(await homeDir(), ICLOUD_RELEASES_REL)
}

async function loadManifest(): Promise<UpdateManifest | null> {
	const releasesDir = await getReleasesDir()
	const manifestPath = join(releasesDir, MANIFEST_FILENAME)
	if (!(await exists(manifestPath))) {
		return null
	}
	const content = await readTextFile(manifestPath)
	return JSON.parse(content) as UpdateManifest
}

/**
 * Compare two semver-ish version strings (`"0.8.4"` vs `"0.8.3"`).
 * Returns positive if `a` is newer than `b`, negative if older, 0 if equal.
 * Pre-release suffixes ("0.8.4-rc1") are ignored — only the numeric core
 * is compared.
 */
function compareSemver(a: string, b: string): number {
	const parse = (v: string): [number, number, number] => {
		const core = v.split("-")[0] ?? v
		const [maj = 0, min = 0, patch = 0] = core
			.split(".")
			.map((n) => Number(n) || 0)
		return [maj, min, patch]
	}
	const [aMaj, aMin, aPatch] = parse(a)
	const [bMaj, bMin, bPatch] = parse(b)
	if (aMaj !== bMaj) return aMaj - bMaj
	if (aMin !== bMin) return aMin - bMin
	return aPatch - bPatch
}

/**
 * Read `latest.json` from iCloud and report whether an update is available.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
	try {
		const current = await getVersion()
		const manifest = await loadManifest()
		if (!manifest) {
			return { status: "no-manifest", releasesDir: await getReleasesDir() }
		}

		const cmp = compareSemver(manifest.version, current)
		if (cmp > 0) {
			const dmgPath = join(await getReleasesDir(), manifest.dmg)
			return { status: "available", current, manifest, dmgPath }
		}
		return { status: "current", current, latest: manifest.version }
	} catch (error) {
		return { status: "error", error: String(error) }
	}
}

/** Mount the DMG (opens DiskImageMounter → Finder shows the mounted volume). */
export async function openUpdateDmg(dmgPath: string): Promise<void> {
	await openPath(dmgPath)
}

/** Show the DMG file in Finder without mounting it. */
export async function revealUpdateDmg(dmgPath: string): Promise<void> {
	await revealItemInDir(dmgPath)
}
