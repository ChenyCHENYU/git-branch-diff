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
 * 检查分支是否存在 - 修复版本
 */
function checkBranchExists(branch, autoFetch = true) {
  // 🎯 修复：远程分支自动fetch，但要处理网络错误
  if (branch.includes("/") && autoFetch) {
    try {
      execGit("git fetch --all", true);
    } catch (error) {
      // 网络错误时不应该阻止检查本地分支
      log.warning("无法连接远程仓库，将只检查本地分支");
    }
  }

  // 🎯 修复：更准确的分支检查逻辑
  const branchName = branch.replace(/^origin\//, '');
  
  const checks = [
    // 检查本地分支
    `git show-ref --verify --quiet refs/heads/${branchName}`,
    `git show-ref --verify --quiet refs/heads/${branch}`,
    // 检查远程分支
    `git show-ref --verify --quiet refs/remotes/${branch}`,
    `git show-ref --verify --quiet refs/remotes/origin/${branchName}`,
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
 * 🎯 检测自动化发布流程 - 修复版本
 */
function detectAutomatedFlow(merges) {
  if (merges.length < 1) {
    return { detected: false, description: null, chain: [] };
  }

  // 🎯 修复：更宽松的模式检测，避免误判
  const recentMerges = merges.slice(0, 5); // 增加检查范围到5次合并
  
  // 模式1：feature -> dev -> main 流程
  const featureMerges = recentMerges.filter(m => 
    m.sourceBranch.includes('feature') || 
    m.sourceBranch.includes('dev_') ||
    m.sourceBranch.match(/^[a-zA-Z0-9_-]+_\d+/) ||
    m.message.toLowerCase().includes('feature')
  );
  
  const devMerges = recentMerges.filter(m => 
    m.sourceBranch === 'dev' || 
    m.sourceBranch === 'develop' ||
    m.message.toLowerCase().includes('dev')
  );

  // 🎯 修复：只有明确的模式才算自动化流程
  if (featureMerges.length >= 1 && devMerges.length >= 1 && recentMerges.length >= 2) {
    const chain = [];
    
    // 构建合并链 - 按时间顺序
    if (devMerges[0]) {
      chain.push({
        step: 1,
        from: devMerges[0].sourceBranch,
        to: 'main',
        hash: devMerges[0].hash,
        message: devMerges[0].message.substring(0, 50) + '...'
      });
    }
    
    if (featureMerges[0]) {
      chain.push({
        step: 2,
        from: featureMerges[0].sourceBranch,
        to: 'dev',
        hash: featureMerges[0].hash,
        message: featureMerges[0].message.substring(0, 50) + '...'
      });
    }

    return {
      detected: true,
      description: `检测到可能的自动化发布流程`,
      chain: chain.reverse() // 反转显示顺序
    };
  }

  // 🎯 修复：降低连续合并的判断标准
  if (recentMerges.length >= 2) {
    // 检查是否真的是有意义的连续合并
    const hasDistinctSources = new Set(recentMerges.slice(0, 2).map(m => m.sourceBranch)).size > 1;
    
    if (hasDistinctSources) {
      return {
        detected: true,
        description: `检测到连续合并操作`,
        chain: recentMerges.slice(0, 2).reverse().map((merge, index) => ({
          step: index + 1,
          from: merge.sourceBranch,
          to: index === 0 ? 'current branch' : 'previous target',
          hash: merge.hash,
          message: merge.message.substring(0, 50) + '...'
        }))
      };
    }
  }

  return { detected: false, description: null, chain: [] };
}

/**
 * 🎯 计算真实代码差异（排除合并提交）- 修复版本
 */
function calculateRealCodeDiff(targetBranch) {
  try {
    // 获取两个分支的合并基础点
    const mergeBase = execGit(`git merge-base HEAD ${targetBranch}`, true)?.trim();
    
    if (!mergeBase) {
      return { realDiff: true, behindCommits: 0, aheadCommits: 0, hasFileDiff: true };
    }

    // 🎯 修复：计算相对于合并基础点的提交数
    const targetNonMergeCommits = execGit(
      `git rev-list --no-merges --count ${mergeBase}..${targetBranch}`,
      true
    )?.trim();
    
    const currentNonMergeCommits = execGit(
      `git rev-list --no-merges --count ${mergeBase}..HEAD`,
      true
    )?.trim();

    const behindCommits = parseInt(targetNonMergeCommits || '0');
    const aheadCommits = parseInt(currentNonMergeCommits || '0');
    
    // 🎯 修复：检查实际的文件差异
    const fileDiff = execGit(`git diff --name-only ${targetBranch}...HEAD`, true)?.trim();
    const hasFileDiff = !!fileDiff;

    // 🎯 修复：更准确的差异判断
    // 如果有文件差异，或者有非合并提交差异，就认为有实际差异
    const realDiff = hasFileDiff || behindCommits > 0 || aheadCommits > 0;

    return {
      realDiff,
      behindCommits,
      aheadCommits,
      hasFileDiff,
      mergeBase: mergeBase.substring(0, 7),
      fileDiffCount: fileDiff ? fileDiff.split('\n').length : 0
    };
  } catch (error) {
    // 🎯 修复：错误处理时应该假设有差异，避免误判
    return { 
      realDiff: true, 
      behindCommits: 0, 
      aheadCommits: 0, 
      hasFileDiff: true,
      error: error.message 
    };
  }
}

/**
 * 🎯 智能分析分支关系 (修复版本)
 */
function analyzeBranchRelation(target) {
  try {
    const currentHead = execGit("git rev-parse HEAD", true)?.trim();
    const targetHead = execGit(`git rev-parse ${target}`, true)?.trim();

    // 检查是否指向同一个commit
    if (currentHead === targetHead) {
      return { type: "synchronized", confidence: "high" };
    }

    // 🎯 修复：更准确的合并检查
    // 检查目标分支的所有提交是否都在当前分支中
    const targetUniqueCommits = execGit(
      `git rev-list ${target} --not HEAD`,
      true
    )?.trim();
    
    const currentUniqueCommits = execGit(
      `git rev-list HEAD --not ${target}`,
      true
    )?.trim();

    // 🎯 真正的合并状态：目标分支没有独有的提交
    const isTargetFullyMerged = !targetUniqueCommits;
    const hasCurrentUniqueCommits = !!currentUniqueCommits;

    if (isTargetFullyMerged && hasCurrentUniqueCommits) {
      return { type: "ahead", confidence: "high" };
    } else if (isTargetFullyMerged && !hasCurrentUniqueCommits) {
      return { type: "synchronized", confidence: "high" };
    }

    // 检查常规的前后关系
    const mergeBase = execGit(`git merge-base HEAD ${target}`, true)?.trim();

    if (mergeBase === currentHead) {
      return { type: "behind", confidence: "high" };
    } else if (mergeBase === targetHead) {
      return { type: "ahead", confidence: "high" };
    } else {
      // 🎯 更准确的分叉判断
      if (targetUniqueCommits && currentUniqueCommits) {
        return { type: "diverged", confidence: "high" };
      } else if (targetUniqueCommits && !currentUniqueCommits) {
        return { type: "behind", confidence: "high" };
      } else if (!targetUniqueCommits && currentUniqueCommits) {
        return { type: "ahead", confidence: "high" };
      } else {
        return { type: "synchronized", confidence: "medium" };
      }
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
    log.warning(` 有 ${workingDir.changedFiles.length} 个文件待处理`);
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

  // 🎯 代码状态分析（修复版本 - 更准确的判断）
  log.subtitle(`${icons.chart} 代码状态`);
  
  // 🎯 修复：添加调试信息（可选）
  if (options.verbose) {
    log.detail(`调试信息: ahead=${basicStats.ahead}, behind=${basicStats.behind}`);
    log.detail(`实际差异: aheadCommits=${realCodeDiff.aheadCommits}, behindCommits=${realCodeDiff.behindCommits}`);
    log.detail(`文件差异: ${realCodeDiff.hasFileDiff ? '有' : '无'} (${realCodeDiff.fileDiffCount || 0} 个文件)`);
  }
  
  switch (relationship.type) {
    case "synchronized":
      log.highlight("🎯 代码完全一致");
      break;
      
    case "ahead":
      if (realCodeDiff.realDiff && realCodeDiff.aheadCommits > 0) {
        log.alert(`⚠️  有新代码未同步 - 领先 ${basicStats.ahead} 个提交`);
        log.detail(`实际功能提交: ${realCodeDiff.aheadCommits} 个`);
        if (realCodeDiff.hasFileDiff) {
          log.detail(`变更文件: ${realCodeDiff.fileDiffCount} 个`);
        }
      } else if (basicStats.ahead > 0) {
        log.highlight("🎯 代码基本一致 - 主要是合并提交差异");
        log.detail(`合并相关提交: ${basicStats.ahead} 个`);
      } else {
        log.highlight("🎯 代码完全一致");
      }
      break;
      
    case "behind":
      if (realCodeDiff.realDiff && realCodeDiff.behindCommits > 0) {
        log.alert(`⚠️  代码落后 - 需要同步 ${basicStats.behind} 个提交`);
        log.detail(`需要同步的功能提交: ${realCodeDiff.behindCommits} 个`);
        if (realCodeDiff.hasFileDiff) {
          log.detail(`对方新增文件: ${realCodeDiff.fileDiffCount} 个`);
        }
      } else if (basicStats.behind > 0) {
        log.info("代码基本一致，主要是提交历史差异");
        log.detail(`历史提交差异: ${basicStats.behind} 个`);
      } else {
        log.highlight("🎯 代码完全一致");
      }
      break;
      
    case "diverged":
      log.warning(`🔀 代码有分歧 - 领先 ${basicStats.ahead} 个，落后 ${basicStats.behind} 个提交`);
      if (realCodeDiff.realDiff) {
        if (realCodeDiff.aheadCommits > 0 || realCodeDiff.behindCommits > 0) {
          log.detail(`实际代码差异: 领先 ${realCodeDiff.aheadCommits} 个，落后 ${realCodeDiff.behindCommits} 个功能提交`);
        }
        if (realCodeDiff.hasFileDiff) {
          log.detail(`文件冲突风险: ${realCodeDiff.fileDiffCount} 个文件有差异`);
        }
      }
      break;
      
    default:
      log.warning("无法确定代码状态");
      if (realCodeDiff.error) {
        log.detail(`错误信息: ${realCodeDiff.error}`);
      }
  }

  // 🎯 详细差异（仅在需要时显示）
  if (realCodeDiff.realDiff && (relationship.type === "behind" || relationship.type === "diverged" || relationship.type === "ahead")) {
    log.subtitle(`${icons.file} 详细代码差异`);
    if (realCodeDiff.behindCommits > 0) {
      log.detail(`目标分支的新功能: ${styles.red}${realCodeDiff.behindCommits}${styles.reset} 个提交`);
    }
    if (realCodeDiff.aheadCommits > 0) {
      log.detail(`当前分支的新功能: ${styles.green}${realCodeDiff.aheadCommits}${styles.reset} 个提交`);
    }
    if (realCodeDiff.hasFileDiff) {
      log.detail(`${styles.yellow}有文件变更差异${styles.reset}`);
    }
    log.detail(`共同基础: ${realCodeDiff.mergeBase}`);
  }

  // 🎯 操作建议（修复版本 - 更智能的建议）
  log.subtitle(`${icons.target} 智能建议`);
  
  switch (relationship.type) {
    case "synchronized":
      log.success("无需操作 - 代码完全同步");
      break;
      
    case "ahead":
      if (realCodeDiff.realDiff && realCodeDiff.aheadCommits > 0) {
        log.info(" 推送新代码到远程");
        
        // 🎯 修复：更智能的推送建议
        if (targetBranch.startsWith('origin/')) {
          const remoteBranch = targetBranch.replace('origin/', '');
          log.detail(`git push origin ${currentBranch}:${remoteBranch}`);
          log.detail("或者创建合并请求/PR");
        } else {
          log.detail(`git push origin ${currentBranch}`);
          if (targetBranch === 'main' || targetBranch === 'master') {
            log.detail("建议: 先创建PR而不是直接推送到主分支");
          }
        }
      } else if (basicStats.ahead > 0) {
        log.success("代码内容一致 - 只是提交历史不同");
        log.detail("可以选择性推送或保持现状");
      } else {
        log.success("无需操作");
      }
      break;
      
    case "behind":
      log.warning("需要更新代码");
      
      // 🎯 修复：更准确的更新建议
      if (targetBranch.includes('/')) {
        const parts = targetBranch.split('/');
        if (parts[0] === 'origin') {
          log.detail(`git pull origin ${parts[1]}`);
        } else {
          log.detail(`git fetch && git merge ${targetBranch}`);
        }
      } else {
        log.detail(`git merge ${targetBranch}`);
        log.detail(`或使用: git pull origin ${targetBranch}`);
      }
      
      if (realCodeDiff.behindCommits > 3) {
        log.detail("提示: 变更较多，建议review后再合并");
      }
      break;
      
    case "diverged":
      log.warning("需要合并分支");
      
      // 🎯 修复：分叉情况的智能建议
      if (realCodeDiff.hasFileDiff && realCodeDiff.fileDiffCount > 5) {
        log.detail("⚠️ 文件冲突风险较高，建议:");
        log.detail("1. 先备份当前工作");
        log.detail(`2. git merge ${targetBranch} # 合并并解决冲突`);
        log.detail("3. 或使用: git rebase " + targetBranch + " # 变基方式");
      } else {
        log.detail(`git merge ${targetBranch}`);
        log.detail("或使用 rebase: git rebase " + targetBranch);
      }
      
      if (basicStats.ahead > 10 || basicStats.behind > 10) {
        log.detail("提示: 分叉较严重，建议寻求团队协助");
      }
      break;
      
    default:
      log.warning("建议手动检查分支状态");
      log.detail(`git log --oneline --graph ${targetBranch}..HEAD`);
      log.detail(`git log --oneline --graph HEAD..${targetBranch}`);
  }

  log.end();
  return result;
}