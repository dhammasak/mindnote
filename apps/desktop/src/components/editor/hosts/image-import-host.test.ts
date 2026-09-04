import { describe, expect, it, vi } from "vitest"

vi.mock("@/store", () => ({
	useStore: {
		getState: () => ({
			copyEntry: vi.fn(),
			workspacePath: null,
		}),
	},
}))

import { prepareImageForEditorInsert } from "./image-import-host"

describe("image-import-host", () => {
	it("throws when an external image cannot be copied into the workspace", async () => {
		await expect(
			prepareImageForEditorInsert("/external/a.png", {
				getWorkspacePath: () => "/workspace",
				copyEntry: vi.fn().mockResolvedValueOnce(null),
				buildImageLink: vi.fn(),
				ensureDirectory: vi.fn().mockResolvedValue(undefined),
			}),
		).rejects.toMatchObject({
			name: "EditorImageImportError",
			message: "Failed to import image into workspace.",
			path: "/external/a.png",
		})
	})

	it("returns copied image data when the workspace import succeeds", async () => {
		const buildImageLink = vi.fn().mockReturnValue({
			url: "assets/a.png",
			embedTarget: "assets/a.png",
		})

		const result = await prepareImageForEditorInsert("/external/a.png", {
			getWorkspacePath: () => "/workspace",
			copyEntry: vi.fn().mockResolvedValueOnce("/workspace/assets/a.png"),
			buildImageLink,
			ensureDirectory: vi.fn().mockResolvedValue(undefined),
		})

		expect(result).toEqual({
			absolutePath: "/workspace/assets/a.png",
			url: "assets/a.png",
			embedTarget: "assets/a.png",
		})
		expect(buildImageLink).toHaveBeenCalledWith("/workspace/assets/a.png")
	})

	it("routes external images into <workspace>/Attached File/", async () => {
		const copyEntry = vi
			.fn()
			.mockResolvedValueOnce("/workspace/Attached File/a.png")
		const ensureDirectory = vi.fn().mockResolvedValue(undefined)

		await prepareImageForEditorInsert("/external/a.png", {
			getWorkspacePath: () => "/workspace",
			copyEntry,
			buildImageLink: vi.fn().mockReturnValue({
				url: "Attached File/a.png",
				embedTarget: "Attached File/a.png",
			}),
			ensureDirectory,
		})

		expect(ensureDirectory).toHaveBeenCalledWith("/workspace/Attached File")
		expect(copyEntry).toHaveBeenCalledWith(
			"/external/a.png",
			"/workspace/Attached File",
		)
	})

	it("leaves images already inside the workspace in place", async () => {
		const copyEntry = vi.fn()
		const ensureDirectory = vi.fn()

		const result = await prepareImageForEditorInsert("/workspace/sub/a.png", {
			getWorkspacePath: () => "/workspace",
			copyEntry,
			buildImageLink: vi.fn().mockReturnValue({
				url: "sub/a.png",
				embedTarget: "sub/a.png",
			}),
			ensureDirectory,
		})

		expect(result.absolutePath).toBe("/workspace/sub/a.png")
		expect(copyEntry).not.toHaveBeenCalled()
		expect(ensureDirectory).not.toHaveBeenCalled()
	})
})
