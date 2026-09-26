import {
	disable as autostartDisable,
	enable as autostartEnable,
	isEnabled as autostartIsEnabled,
} from "@tauri-apps/plugin-autostart"
import { useEffect, useState } from "react"

// localStorage flag that records whether we've already applied the "default ON"
// behaviour for autostart. Once set, we never touch the OS state on launch —
// we only reflect/update it through the Preferences toggle. This way the user
// can disable autostart and have the choice stick across restarts.
const FIRST_LAUNCH_KEY = "mindnote.autostartDefaultApplied"

type UseAutostart = {
	enabled: boolean
	isLoading: boolean
	setEnabled: (next: boolean) => Promise<void>
}

/**
 * "Open at Login" backing hook.
 *
 * On the very first launch we enable autostart so MindNote opens with the
 * system out of the box. Every subsequent mount just mirrors whatever
 * `tauri-plugin-autostart` reports — toggling calls into the plugin and
 * updates local state.
 */
export function useAutostart(): UseAutostart {
	const [enabled, setEnabledState] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		const init = async () => {
			const flagApplied =
				typeof window !== "undefined" &&
				window.localStorage.getItem(FIRST_LAUNCH_KEY) === "true"

			if (!flagApplied) {
				try {
					await autostartEnable()
					window.localStorage.setItem(FIRST_LAUNCH_KEY, "true")
				} catch (error) {
					console.error(
						"Failed to enable autostart on first launch (continuing)",
						error,
					)
				}
			}

			try {
				const current = await autostartIsEnabled()
				if (!cancelled) setEnabledState(current)
			} catch (error) {
				console.error("Failed to read autostart state", error)
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		void init()
		return () => {
			cancelled = true
		}
	}, [])

	const updateEnabled = async (next: boolean): Promise<void> => {
		try {
			if (next) {
				await autostartEnable()
			} else {
				await autostartDisable()
			}
			setEnabledState(next)
		} catch (error) {
			console.error("Failed to update autostart state", error)
		}
	}

	return { enabled, isLoading, setEnabled: updateEnabled }
}
