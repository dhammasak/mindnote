import { createSlateEditor, KEYS } from "platejs"
import { describe, expect, it } from "vitest"
import { BasicBlocksKit, IndentKit, ListKit } from "../basic"
import { AutoformatKit } from "./autoformat-kit"

/**
 * Types `input` one character at a time into an empty paragraph so the
 * insertText input rules fire the same way they do for a real keystroke.
 */
const type = (input: string) => {
	const editor = createSlateEditor({
		plugins: [...BasicBlocksKit, ...IndentKit, ...ListKit, ...AutoformatKit],
		value: [{ type: KEYS.p, children: [{ text: "" }] }],
	})
	editor.tf.select({ path: [0, 0], offset: 0 })
	for (const char of input) {
		editor.tf.insertText(char)
	}
	return editor
}

const blocks = (input: string) => type(input).children as any[]
const leaves = (input: string) => (blocks(input)[0] as any).children as any[]

describe("autoformat block rules", () => {
	it.each([
		["# ", KEYS.h1],
		["## ", KEYS.h2],
		["### ", KEYS.h3],
		["#### ", KEYS.h4],
		["##### ", KEYS.h5],
		["###### ", KEYS.h6],
	])("turns %j into %s", (prefix, expectedType) => {
		const [block] = blocks(`${prefix}title`)
		expect(block.type).toBe(expectedType)
		expect(block.children[0].text).toBe("title")
	})

	it("wraps > in a blockquote", () => {
		const [block] = blocks("> quoted")
		expect(block.type).toBe(KEYS.blockquote)
		expect(block.children[0].children[0].text).toBe("quoted")
	})

	it("turns --- into a horizontal rule", () => {
		const [block] = blocks("--- ")
		expect(block.type).toBe(KEYS.hr)
	})
})

describe("autoformat list rules", () => {
	it("turns - into a disc list", () => {
		const [block] = blocks("- item")
		expect(block.listStyleType).toBe("disc")
		expect(block.indent).toBe(1)
		expect(block.children[0].text).toBe("item")
	})

	it("turns 1. into a decimal list", () => {
		const [block] = blocks("1. item")
		expect(block.listStyleType).toBe("decimal")
		expect(block.indent).toBe(1)
	})

	it("turns [] into an unchecked todo", () => {
		const [block] = blocks("[] task")
		expect(block.listStyleType).toBe("todo")
		expect(block.checked).toBe(false)
	})
})

describe("autoformat mark rules", () => {
	// Regression guard for the Plate v53 migration: `start` is the whole opening
	// delimiter and `end` is the closing one minus the trigger char. Splitting
	// *** into start "**" / end "*" made it identical to the bold rule, so **x**
	// came out bold+italic and ***x*** matched nothing at all.
	it("applies bold only for **", () => {
		expect(leaves("**bold** x")[0]).toMatchObject({
			text: "bold",
			bold: true,
		})
		expect(leaves("**bold** x")[0].italic).toBeUndefined()
	})

	it("applies bold and italic for ***", () => {
		expect(leaves("***bi*** x")[0]).toMatchObject({
			text: "bi",
			bold: true,
			italic: true,
		})
	})

	it.each([
		["*it* x", "it", "italic"],
		["_it_ x", "it", "italic"],
		["__u__ x", "u", "underline"],
		["~~s~~ x", "s", "strikethrough"],
		["==h== x", "h", "highlight"],
		["`c` x", "c", "code"],
	])("applies %s -> %s", (input, text, mark) => {
		expect(leaves(input)[0]).toMatchObject({ text, [mark]: true })
	})

	it("applies underline and italic for __*", () => {
		expect(leaves("__*ui__* x")[0]).toMatchObject({
			text: "ui",
			underline: true,
			italic: true,
		})
	})

	it("applies underline, bold and italic for ___***", () => {
		expect(leaves("___***ubi___*** x")[0]).toMatchObject({
			text: "ubi",
			underline: true,
			bold: true,
			italic: true,
		})
	})

	// Regression guard for the crash Plate's own `apply` throws when a mark rule
	// closes inside its own leaf. The first mark ends the leaf, so the second
	// rule's closing delimiter lands in a fresh one; deleting it empties that
	// leaf, normalization removes it, and the match points `apply` captured
	// before the delete now point at a path that no longer exists — Slate's
	// set-nodes then reads `.offset` off undefined. `createMarkRule` defers
	// normalization until `apply` returns. Every pair below crashed the editor
	// on plain typing before that wrapper existed.
	it.each([
		["__**x__**", ["underline", "bold"]],
		["~~**x~~**", ["strikethrough", "bold"]],
		["==**x==**", ["highlight", "bold"]],
		["`**x`**", ["code", "bold"]],
		["__~~x__~~", ["underline", "strikethrough"]],
		["**__x**__", ["bold", "underline"]],
		["*__x*__", ["italic", "underline"]],
	])("applies %j without crashing", (input, marks) => {
		const [leaf] = leaves(input)
		expect(leaf.text).toBe("x")
		for (const mark of marks) expect(leaf[mark]).toBe(true)
	})
})

describe("autoformat text substitutions", () => {
	it.each([
		["-> x", "→ x"],
		["<- x", "← x"],
		["=> x", "⇒ x"],
		["... x", "… x"],
		["(c) x", "© x"],
		["1/2 x", "½ x"],
	])("substitutes %j", (input, expected) => {
		expect(leaves(input)[0].text).toBe(expected)
	})
})
