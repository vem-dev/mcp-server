import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const pkg = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	clean: true,
	// Bundle workspace packages (not published to npm separately)
	noExternal: ["@vem/core", "@vem/schemas"],
	// Keep CJS transitive deps of @vem/core external (installed by npm)
	external: ["fs-extra", "pino", "nanoid", "find-up-simple", "graceful-fs"],
	minify: false,
	sourcemap: true,
	target: "node20",
	shims: true,
	define: {
		__VERSION__: JSON.stringify(pkg.version),
	},
});
