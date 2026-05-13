import { useCallback, useEffect } from "react"
import { useShallow } from "zustand/shallow"
import { closeTabOrHideWindow } from "@/lib/close-tab-or-hide-window"
import { createNoteInDefaultFolder } from "@/lib/note-creation"
import { useStore } from "@/store"
import { installWindowMenu } from "./menu"

export function WindowMenu() {
	const {
		openFolderPicker,
		activatePreviousTab,
		activateNextTab,
		workspacePath,
		toggleCollectionView,
		goBack,
		goForward,
	} = useStore(
		useShallow((s) => ({
			openFolderPicker: s.openFolderPicker,
			activatePreviousTab: s.activatePreviousTab,
			activateNextTab: s.activateNextTab,
			workspacePath: s.workspacePath,
			toggleCollectionView: s.toggleCollectionView,
			goBack: s.goBack,
			goForward: s.goForward,
		})),
	)

	// Read isEditMode + activeTabId from the store at call time rather than
	// from props captured here, so the macOS menu accelerator (⌘W) always
	// sees the current value. Otherwise the first menu install can happen
	// before EditNote sets isEditMode=true, leaving the first ⌘W press
	// closing the tab instead of the window.
	const handleCloseTab = useCallback(() => {
		const state = useStore.getState()
		void closeTabOrHideWindow({
			isEditMode: state.isEditMode,
			hasActiveTab: state.activeTabId !== null,
			closeActiveTab: state.closeActiveTab,
		})
	}, [])

	const {
		toggleFileExplorer,
		openCommandMenu,
		isGraphViewDialogOpen,
		toggleGraphViewDialogOpen,
		chatPanelBetaEnabled,
		toggleChatPanelOpen,
		toggleSettingsDialogOpen,
		zoomIn,
		zoomOut,
		resetZoom,
		hotkeys,
	} = useStore(
		useShallow((s) => ({
			toggleFileExplorer: s.toggleFileExplorerOpen,
			openCommandMenu: s.openCommandMenu,
			isGraphViewDialogOpen: s.isGraphViewDialogOpen,
			toggleGraphViewDialogOpen: s.toggleGraphViewDialogOpen,
			chatPanelBetaEnabled: s.chatPanelBetaEnabled,
			toggleChatPanelOpen: s.toggleChatPanelOpen,
			toggleSettingsDialogOpen: s.toggleSettingsDialogOpen,
			zoomIn: s.increaseFontScale,
			zoomOut: s.decreaseFontScale,
			resetZoom: s.resetFontScale,
			hotkeys: s.hotkeys,
		})),
	)

	useEffect(() => {
		installWindowMenu({
			createNote: () => {
				void createNoteInDefaultFolder()
			},
			closeTabOrHideWindow: handleCloseTab,
			openWorkspace: () => openFolderPicker(),
			activatePreviousTab,
			activateNextTab,
			toggleFileExplorer,
			toggleCollectionView,
			toggleChatPanel: toggleChatPanelOpen,
			zoomIn,
			zoomOut,
			resetZoom,
			openCommandMenu,
			openGraphView: () => {
				if (!workspacePath && !isGraphViewDialogOpen) {
					return
				}
				toggleGraphViewDialogOpen()
			},
			chatPanelBetaEnabled,
			goBack,
			goForward,
			toggleSettings: toggleSettingsDialogOpen,
			hotkeys,
		})
	}, [
		handleCloseTab,
		openFolderPicker,
		activatePreviousTab,
		activateNextTab,
		workspacePath,
		toggleFileExplorer,
		toggleCollectionView,
		zoomIn,
		zoomOut,
		resetZoom,
		openCommandMenu,
		isGraphViewDialogOpen,
		toggleGraphViewDialogOpen,
		chatPanelBetaEnabled,
		toggleChatPanelOpen,
		goBack,
		goForward,
		toggleSettingsDialogOpen,
		hotkeys,
	])

	return null
}
