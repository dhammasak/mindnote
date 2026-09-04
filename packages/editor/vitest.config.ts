import path from "node:path"
import { fileURLToPath } from "node:url"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

const packageDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	test: {
		projects: [
			{
				resolve: {
					alias: [
						// Node can't load the stylesheet node-equation.tsx lazily
						// imports; unit tests never render KaTeX, so stub it out.
						{
							find: /^katex\/dist\/katex\.min\.css$/,
							replacement: path.join(packageDir, "test/css-stub.ts"),
						},
					],
				},
				test: {
					environment: "node",
					exclude: ["stories/**", "e2e/**"],
					include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
					name: "unit",
					server: {
						// Force Vite to transform these so the CSS alias above applies.
						// Left externalised, Node's ESM loader chokes on katex's
						// stylesheet import (@platejs/math -> katex -> katex.min.css).
						deps: { inline: [/katex/, /@platejs\/math/] },
					},
				},
			},
			{
				plugins: [
					storybookTest({
						configDir: path.join(packageDir, ".storybook"),
						storybookScript: "pnpm storybook",
						storybookUrl: "http://127.0.0.1:4310",
					}),
				],
				test: {
					browser: {
						api: {
							host: "127.0.0.1",
						},
						enabled: true,
						headless: true,
						instances: [{ browser: "chromium" }],
						provider: playwright(),
					},
					name: "storybook",
				},
			},
		],
	},
})
