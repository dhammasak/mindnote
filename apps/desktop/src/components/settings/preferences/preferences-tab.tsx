import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@mdit/ui/components/field"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mdit/ui/components/select"
import { Switch } from "@mdit/ui/components/switch"
import { Monitor, Moon, Sun } from "lucide-react"
import { useMemo } from "react"
import { useShallow } from "zustand/shallow"
import { HotkeyKbd } from "@/components/hotkeys/hotkey-kbd"
import { useTheme } from "@/contexts/theme-context"
import { useAutostart } from "@/hooks/use-autostart"
import {
	FONT_SCALE_STEP,
	MAX_FONT_SCALE,
	MIN_FONT_SCALE,
} from "@/repositories/user-settings-repository"
import { useStore } from "@/store"

function buildFontScaleOptions(): Array<{ value: number; label: string }> {
	const options: Array<{ value: number; label: string }> = []
	// Walk in integer steps to avoid floating-point drift.
	const minInt = Math.round(MIN_FONT_SCALE * 100)
	const maxInt = Math.round(MAX_FONT_SCALE * 100)
	const stepInt = Math.round(FONT_SCALE_STEP * 100)
	for (let v = minInt; v <= maxInt; v += stepInt) {
		const value = v / 100
		const label = v === 100 ? "100% (Default)" : `${v}%`
		options.push({ value, label })
	}
	return options
}

export function PreferencesTab() {
	const { theme, setTheme } = useTheme()
	const {
		chatPanelBetaEnabled,
		setChatPanelBetaEnabled,
		toggleChatPanelHotkey,
		fontScale,
		setFontScale,
		zoomInHotkey,
		zoomOutHotkey,
		resetZoomHotkey,
	} = useStore(
		useShallow((state) => ({
			chatPanelBetaEnabled: state.chatPanelBetaEnabled,
			setChatPanelBetaEnabled: state.setChatPanelBetaEnabled,
			toggleChatPanelHotkey: state.hotkeys["toggle-chat-panel"],
			fontScale: state.fontScale,
			setFontScale: state.setFontScale,
			zoomInHotkey: state.hotkeys["zoom-in"],
			zoomOutHotkey: state.hotkeys["zoom-out"],
			resetZoomHotkey: state.hotkeys["reset-zoom"],
		})),
	)

	const fontScaleOptions = useMemo(() => buildFontScaleOptions(), [])
	// Snap the stored value to the nearest available option so the Select
	// always shows a label even after the max changes between releases.
	const fontScaleValue = useMemo(() => {
		const exact = fontScaleOptions.find(
			(o) => Math.round(o.value * 100) === Math.round(fontScale * 100),
		)
		return exact ? exact.value : 1
	}, [fontScale, fontScaleOptions])

	const {
		enabled: autostartEnabled,
		isLoading: autostartLoading,
		setEnabled: setAutostartEnabled,
	} = useAutostart()

	const themeOptions: Array<{
		value: "light" | "dark" | "system"
		label: string
		icon?: React.ReactNode
	}> = [
		{ value: "light", label: "Light", icon: <Sun /> },
		{ value: "dark", label: "Dark", icon: <Moon /> },
		{ value: "system", label: "System", icon: <Monitor /> },
	]

	return (
		<div className="flex-1 overflow-y-auto p-12">
			<FieldSet>
				<FieldLegend>Preferences</FieldLegend>
				<FieldDescription>Customize your MindNote experience</FieldDescription>
				<FieldGroup>
					<Field orientation="horizontal">
						<FieldContent>
							<FieldLabel>Appearance</FieldLabel>
							<FieldDescription>
								Choose how you want MindNote to look
							</FieldDescription>
						</FieldContent>
						<Select
							value={theme}
							onValueChange={(value) =>
								setTheme(value as "light" | "dark" | "system")
							}
						>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								{themeOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.icon}
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					<Field orientation="horizontal">
						<FieldContent>
							<FieldLabel>Open at Login</FieldLabel>
							<FieldDescription>
								Launch MindNote automatically when you sign in to your Mac.
								Enabled by default on first install.
							</FieldDescription>
						</FieldContent>
						<Switch
							checked={autostartEnabled}
							disabled={autostartLoading}
							onCheckedChange={(next) => {
								void setAutostartEnabled(next)
							}}
						/>
					</Field>

					<Field orientation="horizontal">
						<FieldContent>
							<FieldLabel>Font size</FieldLabel>
							<FieldDescription>
								Scales the editor font and line height. Default is 100%.{" "}
								{zoomInHotkey.length > 0 && zoomOutHotkey.length > 0 && (
									<>
										<span>Adjust on the fly with</span>
										<HotkeyKbd className="mx-1" binding={zoomInHotkey} />
										<span>/</span>
										<HotkeyKbd className="mx-1" binding={zoomOutHotkey} />
										{resetZoomHotkey.length > 0 && (
											<>
												<span>or reset with</span>
												<HotkeyKbd className="mx-1" binding={resetZoomHotkey} />
											</>
										)}
										<span>.</span>
									</>
								)}
							</FieldDescription>
						</FieldContent>
						<Select
							value={String(fontScaleValue)}
							onValueChange={(value) => setFontScale(Number(value))}
						>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								{fontScaleOptions.map((option) => (
									<SelectItem key={option.value} value={String(option.value)}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				</FieldGroup>
			</FieldSet>

			<FieldSet className="mt-8">
				<FieldLegend>Beta</FieldLegend>
				<FieldDescription>
					Experimental features with agent-powered workflows.
				</FieldDescription>
				<FieldGroup>
					<Field orientation="horizontal">
						<FieldContent>
							<FieldLabel>Agent Chat Panel</FieldLabel>
							<FieldDescription>
								Enable a right-side chat panel that can request editor edit and
								file explorer access permissions.
								{toggleChatPanelHotkey.length > 0 ? (
									<>
										<span>Show or hide the panel with</span>
										<HotkeyKbd
											className="mx-1"
											binding={toggleChatPanelHotkey}
										/>
										<span>Customize under Hotkeys.</span>
									</>
								) : (
									<span>
										Assign a shortcut under Hotkeys to show or hide the panel.
									</span>
								)}
							</FieldDescription>
						</FieldContent>
						<Switch
							checked={chatPanelBetaEnabled}
							onCheckedChange={setChatPanelBetaEnabled}
						/>
					</Field>
				</FieldGroup>
			</FieldSet>
		</div>
	)
}
