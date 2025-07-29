#!/usr/bin/env node

import { analyzeBranches } from "../index.js";

// 解析参数
const args = process.argv.slice(2);
const targetBranch = args[0];

// 解析选项
const options = {
  verbose: args.includes("--verbose"),
  noFetch: args.includes("--no-fetch"),
  json: args.includes("--json"),
  help: args.includes("--help") || args.includes("-h"),
};

// 显示帮助
if (options.help || !targetBranch) {
  console.log(`
git-branch-check-diff-commits - 精美的 Git 分支对比工具

用法:
  git-branch-check-diff-commits <target-branch> [选项]
  gbd <target-branch> [选项]

选项:
  --verbose     详细输出
  --no-fetch    跳过自动 fetch
  --json        JSON 格式输出
  -h, --help    显示帮助

示例:
  git-branch-check-diff-commits main
  git-branch-check-diff-commits origin/develop --verbose
  gbd main --json
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
