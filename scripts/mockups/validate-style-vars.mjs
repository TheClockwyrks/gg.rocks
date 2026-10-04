import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "../..");

const sourceExtensions = new Set([
  ".css",
  ".scss",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
]);

const ignoredDirectories = new Set([
  "dist",
  "node_modules",
  "test-results",
  "tmp",
]);

const readText = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

const sharedWebRoot = "shared/web";
const appSourceRoot = "app/src";

const allowedSpacingVariables = new Set([
  "--s-0-5",
  "--s-1",
  "--s-1-5",
  "--s-2",
  "--s-3",
  "--s-4",
  "--s-6",
  "--s-8",
  "--s-10",
  "--s-12",
  "--s-16",
  "--s-24",
  "--layout-sidebar-width",
  "--layout-page-narrow",
  "--layout-page-wide",
]);

const allowedTypographyVariables = new Set([
  "--font-display",
  "--font-sans",
  "--font-mono",
  "--text-8",
  "--text-10",
  "--text-12",
  "--text-14",
  "--text-16",
  "--text-20",
  "--text-24",
  "--text-32",
  "--text-40",
  "--text-48",
  "--text-56",
  "--text-64",
]);

const allowedRadiusVariables = new Set([
  "--rounded-sm",
  "--rounded",
  "--rounded-md",
  "--rounded-lg",
  "--rounded-full",
]);

const sharedStyleVariableDefinitions = new Map([
  ["base.scss", new Set()],
  ["grayscale.scss", new Set()],
  ["radius.scss", allowedRadiusVariables],
  ["spacing.scss", allowedSpacingVariables],
  ["typography.scss", allowedTypographyVariables],
]);

const approvedSharedColorStyleFiles = new Set([
  `${sharedWebRoot}/styles/clockwyrks.scss`,
  `${sharedWebRoot}/styles/colors.scss`,
  `${sharedWebRoot}/styles/ionic-colors.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/agent-roles.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/alerts.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/completion-statuses.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/health.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/issue-types.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/notifications.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/status-badges.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/validation.scss`,
  `${sharedWebRoot}/styles/colors/color-sets/workflow-statuses.scss`,
  `${sharedWebRoot}/styles/colors/ionic.scss`,
  `${sharedWebRoot}/styles/colors/palettes/agent-roles.scss`,
  `${sharedWebRoot}/styles/colors/palettes/app.scss`,
  `${sharedWebRoot}/styles/colors/palettes/completion-statuses.scss`,
  `${sharedWebRoot}/styles/colors/palettes/developer-overlay.scss`,
  `${sharedWebRoot}/styles/colors/palettes/health.scss`,
  `${sharedWebRoot}/styles/colors/palettes/issue-types.scss`,
  `${sharedWebRoot}/styles/colors/palettes/notifications.scss`,
  `${sharedWebRoot}/styles/colors/palettes/status-badges.scss`,
  `${sharedWebRoot}/styles/colors/palettes/validation.scss`,
  `${sharedWebRoot}/styles/colors/palettes/workflow-statuses.scss`,
  `${sharedWebRoot}/styles/colors/semantic.scss`,
  `${sharedWebRoot}/styles/colors/themes/clockwyrks.scss`,
  `${sharedWebRoot}/styles/colors/themes/encom.scss`,
  `${sharedWebRoot}/styles/colors/themes/genyume.scss`,
  `${sharedWebRoot}/styles/colors/themes/nvidia.scss`,
]);

const approvedSharedUtilityStyleFiles = new Set([
  `${sharedWebRoot}/styles/animations.scss`,
]);

const collectDefinedVariables = (relativePath, prefixes) => {
  const content = readText(relativePath);
  const variables = new Set();
  const declarationPattern = /(--[a-z0-9-]+)\s*:/gi;
  let match;

  while ((match = declarationPattern.exec(content)) !== null) {
    const variableName = match[1];

    if (prefixes.some((prefix) => variableName.startsWith(prefix))) {
      variables.add(variableName);
    }
  }

  return variables;
};

const pushSetDifferences = ({ actual, expected, filePath, label, issues }) => {
  for (const variableName of actual) {
    if (!expected.has(variableName)) {
      issues.push({
        type: "unexpected-definition",
        filePath,
        variableName,
        label,
      });
    }
  }

  for (const variableName of expected) {
    if (!actual.has(variableName)) {
      issues.push({
        type: "missing-definition",
        filePath,
        variableName,
        label,
      });
    }
  }
};

const allowedVariables = new Set([
  ...allowedSpacingVariables,
  ...allowedTypographyVariables,
  ...allowedRadiusVariables,
]);

const walkFiles = (relativeDirectory) => {
  const absoluteDirectory = path.join(repoRoot, relativeDirectory);

  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }

  return fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        return [];
      }

      return walkFiles(relativePath);
    }

    if (!entry.isFile() || !sourceExtensions.has(path.extname(entry.name))) {
      return [];
    }

    return [relativePath];
  });
};

const styleRoots = [
  sharedWebRoot,
  appSourceRoot,
];

const getLineColumn = (content, index) => {
  const beforeMatch = content.slice(0, index);
  const lines = beforeMatch.split("\n");

  return {
    line: lines.length,
    column: lines.at(-1).length + 1,
  };
};

const candidatePattern = /var\(\s*(--(?:s|layout|text|font|rounded)-[a-z0-9-]+)\b/gi;
const issues = [];

const sharedStyleVariableFiles = walkFiles(`${sharedWebRoot}/styles`)
  .filter((filePath) => path.extname(filePath) === ".scss");

for (const filePath of sharedStyleVariableFiles) {
  if (approvedSharedColorStyleFiles.has(filePath) || approvedSharedUtilityStyleFiles.has(filePath)) {
    continue;
  }

  const fileName = path.basename(filePath);
  const expected = sharedStyleVariableDefinitions.get(fileName);

  if (!expected) {
    issues.push({
      type: "unexpected-shared-style-file",
      filePath,
    });
    continue;
  }

  pushSetDifferences({
    actual: collectDefinedVariables(filePath, ["--"]),
    expected,
    filePath,
    label: "shared style variable",
    issues,
  });
}

for (const filePath of styleRoots.flatMap(walkFiles)) {
  const content = readText(filePath);
  let match;

  while ((match = candidatePattern.exec(content)) !== null) {
    const variableName = match[1];

    if (!allowedVariables.has(variableName)) {
      issues.push({
        type: "undefined-use",
        filePath,
        variableName,
        ...getLineColumn(content, match.index),
      });
    }
  }
}

if (issues.length > 0) {
  for (const issue of issues) {
    if (issue.type === "unexpected-shared-style-file") {
      console.error(`${issue.filePath} is not approved for shared style variables`);
      continue;
    }

    if (issue.type === "unexpected-definition") {
      console.error(`${issue.filePath} defines unexpected ${issue.label} ${issue.variableName}`);
      continue;
    }

    if (issue.type === "missing-definition") {
      console.error(`${issue.filePath} is missing ${issue.label} ${issue.variableName}`);
      continue;
    }

    console.error(`${issue.filePath}:${issue.line}:${issue.column} uses undefined ${issue.variableName}`);
  }

  console.error(`\n${issues.length} invalid shared style variable definition/use(s) found.`);
  process.exit(1);
}

console.log(
  [
    "Shared style variable definitions and usage are valid.",
    `Checked ${styleRoots.length} roots against ${allowedVariables.size} shared variables.`,
  ].join("\n"),
);
