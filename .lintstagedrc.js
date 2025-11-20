export default {
  "**/*.{js,jsx,ts,tsx,json,yml,yaml}": (files) => {
    // Filter out external plugin directories
    const filteredFiles = files.filter(
      (file) =>
        !file.includes("tools/figma-plugin-ts/") &&
        !file.includes("tools/figma-plugin-react/"),
    );
    if (filteredFiles.length === 0) return [];
    return `prettier --write ${filteredFiles.join(" ")}`;
  },
  "**/*.md": (files) => {
    // Filter out changeset files and external plugin directories
    const nonChangesetFiles = files.filter(
      (file) =>
        !file.includes(".changeset/") &&
        !file.includes("tools/figma-plugin-ts/") &&
        !file.includes("tools/figma-plugin-react/"),
    );
    if (nonChangesetFiles.length === 0) return [];
    // Use -o flag (no path) to write back to same file
    return nonChangesetFiles.map(
      (file) => `remark ${file} --use remark-gfm --use remark-github -o`,
    );
  },
  "!**/pnpm-lock.yaml": [],
  "!**/package-lock.json": [],
  "!**/yarn.lock": [],
  ".changeset/*.md": (files) => {
    // Only run changeset linter on changeset files
    return files.map((file) => `pnpm changeset-lint check-file ${file}`);
  },
};
