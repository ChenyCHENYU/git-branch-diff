import { execSync } from "child_process";

// 精致的颜色和样式工具
const styles = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  purple: "\x1b[35m",
  bgGreen: "\x1b[42m\x1b[30m",
  bgRed: "\x1b[41m\x1b[37m",
};

// 精致的图标
const icons = {
  success: "✅",
  warning: "⚠️",
  error: "❌",
  info: "ℹ️",
  branch: "🌿",
  compare: "🔍",
  file: "📄",
  chart: "📊",
  target: "🎯",
  clean: "🧹",
  dirty: "💭",
  merged: "🔀",
  sync: "🔄",
  rocket: "🚀",
  history: "📜",
  flow: "🌊",
};

// 精致的日志工具
const log = {
  title: (msg) =>
    console.log(`\n${styles.bold}${styles.cyan}╭─ ${msg} ─╮${styles.reset}`),
  subtitle: (msg) =>
    console.log(`${styles.bold}${styles.blue}├─ ${msg}${styles.reset}`),
  success: (msg) =>
    console.log(`${styles.green}${icons.success} ${msg}${styles.reset}`),
  warning: (msg) =>
    console.log(`${styles.yellow}${icons.warning} ${msg}${styles.reset}`),
  error: (msg) =>
    console.log(`${styles.red}${icons.error} ${msg}${styles.reset}`),
  info: (msg) =>
    console.log(`${styles.blue}${icons.info} ${msg}${styles.reset}`),
  merged: (msg) =>
    console.log(`${styles.purple}${icons.merged} ${msg}${styles.reset}`),
  highlight: (msg) =>
    console.log(`${styles.bgGreen} ${msg} ${styles.reset}`),
  alert: (msg) =>
    console.log(`${styles.bgRed} ${msg} ${styles.reset}`),
  detail: (msg) => console.log(`${styles.gray}  │ ${msg}${styles.reset}`),
  separator: () =>
    console.log(`${styles.gray}  ├${"─".repeat(50)}${styles.reset}`),
  end: () => console.log(`${styles.cyan}╰${"─".repeat(52)}╯${styles.reset}\n`),
};

/**
 * 安全执行 Git 命令
 */
function execGit(command, silent = false) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
      timeout: 10000,
    });
  } catch (error) {
    if (!silent) {
      log.error(`命令执行失败: ${command}`);
      log.detail(error.message);
    }
    return null;
  }
}

/**
 * 检查是否在 Git 仓库中
 */
function checkGitRepo() {
  if (!execGit("git rev-parse --git-dir", true)) {
    throw new Error("当前目录不是 Git 仓库");
  }
}

/**
 * 验证分支名
 */
function validateBranch(branch) {
  if (!branch || !/^[a-zA-Z0-9._/-]+$/.test(branch)) {
    throw new Error("分支名无效");
  }
}

/**
 * 检查分支是否存在
 */
function checkBranchExists(branch, autoFetch = true) {
  if (branch.includes("/") && autoFetch) {
    execGit("git fetch --all", true);
  }

  const checks = [
    `git show-ref --verify --quiet refs/heads/${branch}`,
    `git show-ref --verify --quiet refs/remotes/${branch}`,
    `git show-ref --verify --quiet refs/remotes/origin/${branch.replace(
      "origin/",
      ""
    )}`,
  ];

  return checks.some((cmd) => execGit(cmd, true) !== null);
}

/**
 * 获取分支信息
 */
function getBranchInfo(branch) {
  try {
    const lastCommit = execGit(
      `git log -1 --format="%h %s" ${branch}`,
      true
    )?.trim();
    const commitDate = execGit(
      `git log -1 --format="%ar" ${branch}`,
      true
    )?.trim();
    const author = execGit(`git log -1 --format="%an" ${branch}`, true)?.trim();
    const commitHash = execGit(`git rev-parse ${branch}`, true)?.trim();
    return { lastCommit, commitDate, author, commitHash };
  } catch {
    return { 
      lastCommit: "unknown", 
      commitDate: "unknown", 
      author: "unknown", 
      commitHash: null 
    };
  }
}

/**
 * 检查工作区状态
 */
function checkWorkingDir() {
  const status = execGit("git status --porcelain", true);
  const isClean = !status || !status.trim();

  let changedFiles = [];
  if (!isClean) {
    changedFiles = status
      .trim()
      .split("\n")
      .map((line) => {
        const statusCode = line.substring(0, 2);
        const file = line.substring(3);
        let statusText = "";

        if (statusCode.includes("M"))
          statusText = `${styles.yellow}修改${styles.reset}`;
        else if (statusCode.includes("A"))
          statusText = `${styles.green}新增${styles.reset}`;
        else if (statusCode.includes("D"))
          statusText = `${styles.red}删除${styles.reset}`;
        else if (statusCode.includes("??"))
          statusText = `${styles.gray}未跟踪${styles.reset}`;

        return { file, status: statusText };
      });
  }

  return { isClean, changedFiles };
}

/**
 * 🎯 核心功能：分析合并历史和链路
 */
function analyzeMergeHistory(targetBranch, limit = 10) {
  try {
    // 获取最近的合并提交
    const mergeCommits = execGit(
      `git log --merges --format="%h|%s|%ar|%P" HEAD -${limit}`,
      true
    )?.trim();

    if (!mergeCommits) {
      return { merges: [], hasAutomatedFlow: false, flowDescription: null };
    }

    const merges = mergeCommits.split('\n').map(line => {
      const [hash, message, date, parents] = line.split('|');
      
      // 解析合并信息
      let sourceBranch = 'unknown';
      let targetBranchName = 'unknown';
      
      // 尝试从提交信息中提取分支名
      const branchMatch = message.match(/Merge.*?(?:branch\s+['"]?([^'"'\s]+)['"]?|(?:from\s+)?([^'\s]+))/i);
      if (branchMatch) {
        sourceBranch = branchMatch[1] || branchMatch[2];
      }
      
      // 尝试从 git show 获取更详细信息
      const detailInfo = execGit(`git show --format="" --name-only ${hash}`, true);
      
      return {
        hash: hash.substring(0, 7),
        message,
        date,
        sourceBranch: sourceBranch.replace(/^origin\//, ''),
        parents: parents.split(' '),
        isRecent: true
      };
    });

    // 🎯 检测自动化流程模式
    const flowPattern = detectAutomatedFlow(merges);
    
    return {
      merges,
      hasAutomatedFlow: flowPattern.detected,
      flowDescription: flowPattern.description,
      flowChain: flowPattern.chain
    };
  } catch {
    return { merges: [], hasAutomatedFlow: false, flowDescription: null };
  }
}

/**
 * 🎯 检测自动化发布流程
 */
function detectAutomatedFlow(merges) {
  if (merges.length < 2) {
    return { detected: false, description: null, chain: [] };
  }

  // 检查是否有连续的合并操作
  const recentMerges = merges.slice(0, 3); // 最近3次合并
  
  // 模式1：feature -> dev -> main 流程
  const hasFeatureToDev = recentMerges.some(m => 
    m.sourceBranch.includes('feature') || 
    m.sourceBranch.includes('dev_') ||
    m.sourceBranch.match(/^[a-zA-Z0-9_-]+_\d+/)
  );
  
  const hasDevToMain = recentMerges.some(m => 
    m.sourceBranch === 'dev' || m.message.includes('dev')
  );

  if (hasFeatureToDev && hasDevToMain && recentMerges.length >= 2) {
    const chain = [];
    
    // 构建合并链
    recentMerges.forEach((merge, index) => {
      if (index < 2) { // 只分析最近两次
        chain.push({
          step: index + 1,
          from: merge.sourceBranch,
          to: index === 0 ? 'main' : 'dev',
          hash: merge.hash,
          message: merge.message
        });
      }
    });

    return {
      detected: true,
      description: `检测到自动化发布流程`,
      chain: chain.reverse() // 反转显示顺序：先feature->dev，后dev->main
    };
  }

  // 模式2：简单的双重合并
  if (recentMerges.length >= 2) {
    return {
      detected: true,
      description: `检测到连续合并操作`,
      chain: recentMerges.slice(0, 2).reverse().map((merge, index) => ({
        step: index + 1,
        from: merge.sourceBranch,
        to: index === 0 ? 'current' : 'previous',
        hash: merge.hash,
        message: merge.message
      }))
    };
  }

  return { detected: false, description: null, chain: [] };
}

/**
 * 🎯 计算真实代码差异（排除合并提交）
 */
function calculateRealCodeDiff(targetBranch) {
  try {
    // 获取两个分支的合并基础点
    const mergeBase = execGit(`git merge-base HEAD ${targetBranch}`, true)?.trim();
    
    if (!mergeBase) {
      return { realDiff: false, behindCommits: 0, aheadCommits: 0 };
    }

    // 计算目标分支相对于合并基础点的非合并提交
    const targetNonMergeCommits = execGit(
      `git rev-list --no-merges --count ${mergeBase}..${targetBranch}`,
      true
    )?.trim();
    
    // 计算当前分支相对于合并基础点的非合并提交
    const currentNonMergeCommits = execGit(
      `git rev-list --no-merges --count ${mergeBase}..HEAD`,
      true
    )?.trim();

    const behindCommits = parseInt(targetNonMergeCommits || '0');
    const aheadCommits = parseInt(currentNonMergeCommits || '0');
    
    // 检查是否有实际的文件差异
    const fileDiff = execGit(`git diff --name-only ${targetBranch}..HEAD`, true)?.trim();
    const hasFileDiff = !!fileDiff;

    return {
      realDiff: behindCommits > 0 || hasFileDiff,
      behindCommits,
      aheadCommits,
      hasFileDiff,
      mergeBase: mergeBase.substring(0, 7)
    };
  } catch {
    return { realDiff: false, behindCommits: 0, aheadCommits: 0 };
  }
}

/**
 * 🎯 智能分析分支关系
 */
function analyzeBranchRelation(target) {
  try {
    const currentHead = execGit("git rev-parse HEAD", true)?.trim();
    const targetHead = execGit(`git rev-parse ${target}`, true)?.trim();

    // 检查是否指向同一个commit
    if (currentHead === targetHead) {
      return { type: "synchronized", confidence: "high" };
    }

    // 检查是否为已合并状态
    const targetCommits = execGit(
      `git rev-list ${target} --not HEAD`,
      true
    )?.trim();
    
    const isFullyMerged = !targetCommits;
    
    if (isFullyMerged) {
      return { type: "merged", confidence: "high" };
    }

    // 检查常规的前后关系
    const mergeBase = execGit(`git merge-base HEAD ${target}`, true)?.trim();

    if (mergeBase === currentHead) {
      return { type: "behind", confidence: "high" };
    } else if (mergeBase === targetHead) {
      return { type: "ahead", confidence: "high" };
    } else {
      return { type: "diverged", confidence: "medium" };
    }
  } catch {
    return { type: "unknown", confidence: "low" };
  }
}

/**
 * 获取基础统计信息
 */
function getBasicStats(target) {
  try {
    const ahead = parseInt(
      execGit(`git rev-list --count ${target}..HEAD`, true)?.trim() || "0"
    );
    const behind = parseInt(
      execGit(`git rev-list --count HEAD..${target}`, true)?.trim() || "0"
    );

    return { ahead, behind };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}

/**
 * 主分析函数
 */
export async function analyzeBranches(targetBranch, options = {}) {
  // 检查环境
  checkGitRepo();
  validateBranch(targetBranch);

  const currentBranch =
    execGit("git branch --show-current", true)?.trim() || "HEAD";

  // 检查目标分支是否存在
  if (!checkBranchExists(targetBranch, !options.noFetch)) {
    throw new Error(`分支 "${targetBranch}" 不存在`);
  }

  // 🎯 收集所有分析数据
  const workingDir = checkWorkingDir();
  const currentInfo = getBranchInfo("HEAD");
  const targetInfo = getBranchInfo(targetBranch);
  const relationship = analyzeBranchRelation(targetBranch);
  const basicStats = getBasicStats(targetBranch);
  const mergeHistory = analyzeMergeHistory(targetBranch);
  const realCodeDiff = calculateRealCodeDiff(targetBranch);

  // 构建结果对象
  const result = {
    currentBranch,
    targetBranch,
    relationship,
    basicStats,
    realCodeDiff,
    mergeHistory,
    workingDirectory: workingDir,
    currentInfo,
    targetInfo,
  };

  // JSON 输出
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  // 🎯 智能美化输出
  log.title(`${icons.compare} Git 分支智能对比分析`);

  // 工作区状态
  log.subtitle(`${workingDir.isClean ? icons.clean : icons.dirty} 工作区状态`);
  if (workingDir.isClean) {
    log.success("工作区干净，可以安全进行分支操作");
  } else {
    log.warning(`有 ${workingDir.changedFiles.length} 个文件待处理`);
    workingDir.changedFiles.slice(0, 3).forEach(({ file, status }) => {
      log.detail(`${status} ${file}`);
    });
    if (workingDir.changedFiles.length > 3) {
      log.detail(`... 还有 ${workingDir.changedFiles.length - 3} 个文件`);
    }
  }

  // 🎯 合并历史分析
  if (mergeHistory.hasAutomatedFlow) {
    log.subtitle(`${icons.flow} 自动化流程分析`);
    log.merged(mergeHistory.flowDescription);
    
    mergeHistory.flowChain.forEach((step, index) => {
      const stepIcon = index === 0 ? "1️⃣" : "2️⃣";
      log.detail(`${stepIcon} ${step.from} → ${step.to} (${step.hash})`);
    });
  }

  // 分支信息
  log.subtitle(`${icons.branch} 分支信息`);
  log.detail(`当前分支: ${styles.green}${currentBranch}${styles.reset}`);
  log.detail(`最新提交: ${currentInfo.lastCommit} (${currentInfo.commitDate})`);
  log.separator();
  log.detail(`对比分支: ${styles.blue}${targetBranch}${styles.reset}`);
  log.detail(`最新提交: ${targetInfo.lastCommit} (${targetInfo.commitDate})`);

  // 🎯 代码状态分析（高亮显示）
  log.subtitle(`${icons.chart} 代码状态`);
  
  switch (relationship.type) {
    case "synchronized":
      log.highlight("🎯 代码完全一致");
      break;
      
    case "merged":
      log.highlight("🎯 代码已一致 - 分支已合并");
      if (mergeHistory.hasAutomatedFlow) {
        log.detail("✨ 通过自动化流程合并");
      }
      break;
      
    case "ahead":
      if (realCodeDiff.realDiff) {
        log.alert(`⚠️  有新代码未同步 - 实际领先 ${realCodeDiff.aheadCommits} 个提交`);
      } else {
        log.highlight("🎯 代码一致 - 只有合并提交差异");
      }
      break;
      
    case "behind":
      if (realCodeDiff.realDiff) {
        log.alert(`⚠️  代码落后 - 需要同步 ${realCodeDiff.behindCommits} 个实际提交`);
      } else {
        log.info("代码基本一致，有少量提交差异");
      }
      break;
      
    case "diverged":
      log.warning("代码有分歧，需要合并处理");
      break;
      
    default:
      log.warning("无法确定代码状态");
  }

  // 🎯 详细差异（仅在需要时显示）
  if (realCodeDiff.realDiff && (relationship.type === "behind" || relationship.type === "diverged")) {
    log.subtitle(`${icons.file} 实际代码差异`);
    if (realCodeDiff.behindCommits > 0) {
      log.detail(`落后的功能提交: ${styles.red}${realCodeDiff.behindCommits}${styles.reset}`);
    }
    if (realCodeDiff.hasFileDiff) {
      log.detail(`${styles.yellow}有文件变更差异${styles.reset}`);
    }
    log.detail(`共同基础: ${realCodeDiff.mergeBase}`);
  }

  // 🎯 操作建议
  log.subtitle(`${icons.target} 智能建议`);
  
  switch (relationship.type) {
    case "synchronized":
    case "merged":
      log.success("无需操作 - 代码已同步");
      if (relationship.type === "merged" && !targetBranch.includes("/")) {
        log.info("可删除已合并的本地分支");
        log.detail(`git branch -d ${targetBranch}`);
      }
      break;
      
    case "ahead":
      if (realCodeDiff.realDiff) {
        log.info("推送新代码");
        log.detail(`git push origin ${currentBranch}`);
      } else {
        log.success("无需操作 - 只是合并历史不同");
      }
      break;
      
    case "behind":
      log.warning("需要更新代码");
      log.detail(`git pull origin ${targetBranch}`);
      break;
      
    case "diverged":
      log.warning("需要合并分支");
      log.detail(`git merge ${targetBranch}`);
      break;
  }

  log.end();
  return result;
}