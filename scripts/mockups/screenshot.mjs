import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_VIEWPORT = {
  width: 1920,
  height: 1080,
};

function usage() {
  console.error(`Usage:
  npm run screenshot -- <html-file> [output-file] [--width 1920] [--height 1080] [--full-page]

Examples:
  npm run screenshot -- apps/pyxis/components/gui/pages/index/index.html
  npm run screenshot -- apps/pyxis/components/gui/pages/projects/initialize/index.html tmp/init.png --width 2048 --height 1058`);
}

function parseArgs(argv) {
  const positional = [];
  const options = {
    width: DEFAULT_VIEWPORT.width,
    height: DEFAULT_VIEWPORT.height,
    fullPage: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--width") {
      options.width = Number(argv[++index]);
    } else if (arg === "--height") {
      options.height = Number(argv[++index]);
    } else if (arg === "--full-page") {
      options.fullPage = true;
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (!positional[0]) {
    throw new Error("Missing HTML file path.");
  }

  if (!Number.isInteger(options.width) || options.width <= 0) {
    throw new Error("--width must be a positive integer.");
  }

  if (!Number.isInteger(options.height) || options.height <= 0) {
    throw new Error("--height must be a positive integer.");
  }

  const inputPath = path.resolve(positional[0]);
  const outputPath = positional[1]
    ? path.resolve(positional[1])
    : path.resolve(
        "tmp/mockup-screenshots",
        `${path.basename(inputPath, path.extname(inputPath))}.png`,
      );

  return {
    inputPath,
    outputPath,
    ...options,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: {
        width: options.width,
        height: options.height,
      },
      deviceScaleFactor: 1,
    });

    await page.goto(pathToFileURL(options.inputPath).href, {
      waitUntil: "networkidle",
    });

    await mkdir(path.dirname(options.outputPath), { recursive: true });
    await page.screenshot({
      path: options.outputPath,
      fullPage: options.fullPage,
    });

    console.log(options.outputPath);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  usage();
  process.exit(1);
});
