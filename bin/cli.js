#!/usr/bin/env node

import { analyzeBranches } from "../index.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 解析参数
const args = process.argv.slice(2);
const targetBranch = args.find(a => !a.startsWith("--") && !a.startsWith("-"));

// 解析选项
const options = {
  verbose: args.includes("--verbose"),
  noFetch: args.includes("--no-fetch"),
  json: args.includes("--json"),
  noColor: args.includes("--no-color"),
  silent: args.includes("--silent"),
  help: args.includes("--help") || args.includes("-h"),
  version: args.includes("--version") || args.includes("-v"),
};

// 显示版本
if (options.version) {
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
  console.log(pkg.version);
  process.exit(0);
}

// 显示帮助
if (options.help || !targetBranch) {
  console.log(`
git-branch-check-diff-commits - 精美的 Git 分支对比工具

用法:
  git-branch-check-diff-commits <target-branch> [选项]
  gbd <target-branch> [选项]

选项:
  --verbose     详细输出（含调试信息）
  --no-fetch    跳过自动 fetch
  --json        JSON 格式输出（纯净数据，无 ANSI 码）
  --no-color    禁用颜色输出（适合 CI/管道）
  --silent      静默模式，仅返回数据不输出
  -v, --version 显示版本号
  -h, --help    显示帮助

示例:
  gbd main                    # 对比当前分支与 main
  gbd origin/develop          # 对比远程 develop 分支
  gbd main --json             # JSON 输出，适合程序化处理
  gbd main --no-color         # 无颜色输出，适合 CI
  gbd main --no-fetch         # 跳过 fetch，纯本地对比
`);
  process.exit(targetBranch ? 0 : 1);
}

// 运行分析
try {
  await analyzeBranches(targetBranch, options);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
