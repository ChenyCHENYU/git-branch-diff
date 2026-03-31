# git-branch-check-diff-commits

🚀 **智能 Git 分支对比分析工具** - 提供清晰的可视化输出、自动化流程检测和精准的代码差异分析。

## ✨ 核心特性

- 🎯 **智能代码状态分析** - 准确识别代码差异状态（高亮显示）
- 🌊 **自动化流程检测** - 自动识别 `feature → dev → main` 发布流程（experimental）
- 📊 **真实差异计算** - 排除合并提交，只关注实际功能代码差异
- 🔀 **合并历史追溯** - 显示具体的合并链路和操作历史
- 🎨 **精美可视化输出** - 彩色图标和清晰的层级结构
- 💡 **智能操作建议** - 基于分析结果提供精准的下一步操作
- 🔌 **数据/展示分离** - API 返回纯净数据，方便程序化集成

## 🚀 快速开始

### 安装

```bash
# 全局安装
npm install -g git-branch-check-diff-commits
# 或
bun add -g git-branch-check-diff-commits

# 项目内安装
npm install -D git-branch-check-diff-commits
# 或
bun add -D git-branch-check-diff-commits
```

### 基本使用

```bash
# 对比当前分支与目标分支
gbd main
gbd develop  
gbd origin/feature/user-auth

# 完整命令
git-branch-check-diff-commits main

# 选项
gbd main --json        # JSON 格式输出（纯净数据，无 ANSI 码）
gbd main --no-fetch    # 跳过自动 fetch（纯本地对比）
gbd main --no-color    # 禁用颜色输出（适合 CI/管道）
gbd main --silent      # 静默模式，仅返回数据不输出
gbd main --verbose     # 显示详细调试信息
gbd -v                 # 显示版本号
```

## 📋 使用场景

### 1. **功能分支开发完成后**
```bash
# 检查是否可以合并到主分支
gbd main
```

### 2. **自动化发布流程后**
```bash
# 检查发布流程是否成功
gbd feature/user-login
```

### 3. **代码同步检查**
```bash
# 检查本地分支是否落后
gbd origin/develop
```

## 🎨 输出示例

### 场景1：有新代码需要推送
```
╭─ 🔍 Git 分支智能对比分析 ─╮
├─ 🧹 工作区状态
✅ 工作区干净，可以安全进行分支操作

├─ 🌿 分支信息
  │ 当前分支: feature/awesome
  │ 最新提交: abc1234 Add awesome feature (2 hours ago)
  ├──────────────────────────────────────────────────
  │ 对比分支: main
  │ 最新提交: def5678 Update docs (1 day ago)

├─ 📊 代码状态
 ⚠️  有新代码未同步 - 领先 3 个提交 
  │ 实际功能提交: 3 个
  │ 变更文件: 8 个

├─ 📄 详细代码差异
  │ 当前分支的新功能: 3 个提交
  │ 有文件变更差异
  │ 共同基础: def5678

├─ 🎯 智能建议
ℹ️ 推送新代码到远程
  │ git push origin feature/awesome
  │ 或者创建合并请求/PR
╰────────────────────────────────────────────────────╯
```

### 场景2：自动化流程检测
```
╭─ 🔍 Git 分支智能对比分析 ─╮
├─ 🧹 工作区状态
✅ 工作区干净，可以安全进行分支操作

├─ 🌊 自动化流程分析
🔀 检测到可能的自动化发布流程
  │ 1️⃣ feature/user-login → dev (f8299de)
  │ 2️⃣ dev → main (d7fdf79)

├─ 🌿 分支信息
  │ 当前分支: main
  │ 最新提交: d7fdf79 Merge pull request #12 from dev (2 minutes ago)
  ├──────────────────────────────────────────────────
  │ 对比分支: dev
  │ 最新提交: abc1234 chore(robot-admin-env-manager): version update (5 minutes ago)

├─ 📊 代码状态
 🎯 代码基本一致 - 主要是合并提交差异 
  │ 合并相关提交: 2 个

├─ 🎯 智能建议
✅ 代码内容一致 - 只是提交历史不同
  │ 可以选择性推送或保持现状
╰────────────────────────────────────────────────────╯
```

### 场景3：代码完全一致
```
╭─ 🔍 Git 分支智能对比分析 ─╮
├─ 🧹 工作区状态
✅ 工作区干净，可以安全进行分支操作

├─ 🌿 分支信息
  │ 当前分支: main
  │ 最新提交: d7fdf79 Latest updates (1 hour ago)
  ├──────────────────────────────────────────────────
  │ 对比分支: develop
  │ 最新提交: d7fdf79 Latest updates (1 hour ago)

├─ 📊 代码状态
 🎯 代码完全一致 

├─ 🎯 智能建议
✅ 无需操作 - 代码完全同步
╰────────────────────────────────────────────────────╯
```

### 场景4：代码分叉需要合并
```
╭─ 🔍 Git 分支智能对比分析 ─╮
├─ 🧹 工作区状态
⚠️ 有 2 个文件待处理
  │ 修改 src/index.js
  │ 新增 README.md

├─ 🌿 分支信息
  │ 当前分支: feature/conflict
  │ 最新提交: abc1234 Add conflicting changes (1 hour ago)
  ├──────────────────────────────────────────────────
  │ 对比分支: main
  │ 最新提交: def5678 Update same files (2 hours ago)

├─ 📊 代码状态
🔀 代码有分歧 - 领先 2 个，落后 3 个提交
  │ 实际代码差异: 领先 2 个，落后 3 个功能提交
  │ 文件冲突风险: 5 个文件有差异

├─ 📄 详细代码差异
  │ 目标分支的新功能: 3 个提交
  │ 当前分支的新功能: 2 个提交
  │ 有文件变更差异
  │ 共同基础: xyz9876

├─ 🎯 智能建议
⚠️ 需要合并分支
  │ ⚠️ 文件冲突风险较高，建议:
  │ 1. 先备份当前工作
  │ 2. git merge main # 合并并解决冲突
  │ 3. 或使用: git rebase main # 变基方式
╰────────────────────────────────────────────────────╯
```

## 🔧 项目集成

### package.json scripts
```json
{
  "scripts": {
    "check-main": "gbd main",
    "check-dev": "gbd develop", 
    "check-branch": "gbd",
    "sync-status": "gbd origin/main --json",
    "check-verbose": "gbd main --verbose"
  }
}
```

### CI/CD 集成
```yaml
# GitHub Actions 示例
- name: 检查分支状态
  run: |
    npm install -g git-branch-check-diff-commits
    gbd main --json --no-fetch > branch-status.json
    
- name: 分析结果
  run: |
    RELATION_TYPE=$(gbd main --json | jq -r '.relationship.type')
    HAS_REAL_DIFF=$(gbd main --json | jq -r '.realCodeDiff.realDiff')
    
    if [ "$RELATION_TYPE" = "ahead" ] && [ "$HAS_REAL_DIFF" = "true" ]; then
      echo "分支有新代码，可以合并"
    elif [ "$RELATION_TYPE" = "synchronized" ]; then
      echo "代码已同步"
    else
      echo "需要检查分支状态: $RELATION_TYPE"
    fi
```

## 📚 API 使用

```javascript
import { analyzeBranches, analyze, printReport, setColor } from "git-branch-check-diff-commits";

// 基本分析（带终端输出，向后兼容）
const result = await analyzeBranches("main");

// 带选项的分析
const result = await analyzeBranches("develop", { 
  json: true,       // JSON 输出
  noFetch: true,     // 跳过 fetch
  noColor: true,     // 禁用颜色
  verbose: true,     // 调试信息
  silent: true,      // 静默模式（不输出，只返回数据）
});

// 🆕 纯数据分析（无任何终端输出，适合程序化集成）
const data = await analyze("main", { noFetch: true });
console.log(data.relationship.type);    // "ahead" | "behind" | "synchronized" | "diverged"
console.log(data.realCodeDiff.realDiff); // true/false
console.log(data.workingDirectory.changedFiles); // [{file: "src/index.js", status: "modified"}]

// 🆕 手动输出报告（数据/展示完全分离）
const data = await analyze("main");
printReport(data, { verbose: true });

// 🆕 控制颜色输出
setColor(false); // 全局禁用颜色
```

### 返回数据结构

> JSON 输出和 `analyze()` 返回的数据结构完全一致，**不含 ANSI 转义码**，可安全用于下游解析。

```typescript
interface AnalysisResult {
  currentBranch: string;
  targetBranch: string;
  relationship: {
    type: "synchronized" | "ahead" | "behind" | "diverged";
    confidence: "high" | "medium" | "low";
  };
  realCodeDiff: {
    realDiff: boolean;
    behindCommits: number;
    aheadCommits: number;
    hasFileDiff: boolean;
    fileDiffCount: number;
    mergeBase: string;
  };
  mergeHistory: {
    hasAutomatedFlow: boolean;
    flowDescription: string | null;
    flowChain: Array<{
      step: number;
      from: string;
      to: string;
      hash: string;
      message: string;
    }>;
  };
  workingDirectory: {
    isClean: boolean;
    changedFiles: Array<{
      file: string;
      status: "modified" | "added" | "deleted" | "untracked" | "unknown";
    }>;
  };
  basicStats: {
    ahead: number;
    behind: number;
  };
}
```

## 🎯 智能分析功能

### 代码状态识别（修复版）
- **🎯 代码完全一致** - 分支指向同一提交
- **🎯 代码基本一致 - 主要是合并提交差异** - 代码内容相同，只是提交历史不同
- **⚠️ 有新代码未同步** - 存在真实的功能差异，需要推送
- **⚠️ 代码落后** - 需要同步功能提交  
- **🔀 代码有分歧** - 两个分支都有对方没有的提交

### 自动化流程检测（experimental）
- 自动识别 `feature → dev → main` 发布流程
- 显示具体的合并链路和提交哈希
- 区分自动化合并和手动操作
- 基于 merge commit message 的启发式检测，结果仅供参考

### 智能建议系统
- 基于真实代码差异提供精准建议
- 区分"需要推送"、"需要合并"和"无需操作"
- 自动识别高风险操作并提供安全建议
- 支持远程分支和本地分支的不同处理策略

## 🔍 高级功能

### 详细模式
```bash
gbd main --verbose
```
显示额外的调试信息：
- 提交数量统计
- 文件差异详情
- 合并基础点信息
- Git 命令执行状态

### 无颜色模式
```bash
gbd main --no-color
```
适合 CI/CD 管道或不支持 ANSI 的终端，输出纯文本格式。

### 静默模式
```bash
# 在脚本中只获取退出码和数据
result=$(gbd main --json --silent 2>/dev/null)
```

### 错误处理和边界情况
- **网络错误**: 自动降级到本地分支检查
- **分支不存在**: 清晰的错误提示和建议
- **权限问题**: 友好的错误信息
- **空仓库**: 适当的处理和提示

### 安全特性
- 高风险操作预警（如直接推送到主分支）
- 文件冲突风险评估
- 工作区状态检查
- 操作建议的安全等级划分

## 🔧 常见使用模式

```bash
# 开发流程检查
gbd main              # 检查是否可以合并到主分支
gbd develop           # 检查开发分支状态
gbd main --verbose    # 详细模式检查

# 发布后验证  
gbd feature/xxx       # 验证功能分支状态
gbd origin/main       # 检查与远程主分支的关系

# 同步状态检查
gbd origin/main       # 检查远程主分支状态
gbd upstream/develop  # 检查上游开发分支

# 批量检查（结合其他工具）
git branch | grep feature | xargs -I {} gbd {}

# CI/CD 中使用
gbd main --json --no-fetch --no-color  # 适合CI环境的检查
```

## 🐛 故障排除

### 常见问题

**Q: 提示 "分支不存在" 但分支确实存在**
```bash
# 先手动fetch然后重试
git fetch --all
gbd target-branch
```

**Q: 网络问题导致检查失败**
```bash
# 使用 --no-fetch 跳过网络操作
gbd main --no-fetch
```

**Q: 输出显示与实际不符**
```bash
# 使用详细模式查看调试信息
gbd main --verbose
```

**Q: 无法确定代码状态**
```bash
# 检查Git仓库状态
git status
git log --oneline --graph -10
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发设置
```bash
git clone https://github.com/your-repo/git-branch-check-diff-commits
cd git-branch-check-diff-commits
npm install
npm run dev
```

### 测试
```bash
npm test
npm run test:integration
```

## 📄 License

MIT

---

**让分支对比变得简单而智能！** 🚀