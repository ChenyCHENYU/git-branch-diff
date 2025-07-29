# git-branch-check-diff-commits

🚀 **智能 Git 分支对比分析工具** - 提供清晰的可视化输出、自动化流程检测和精准的代码差异分析。

## ✨ 核心特性

- 🎯 **智能代码状态分析** - 一眼看懂代码是否一致（高亮显示）
- 🌊 **自动化流程检测** - 自动识别 `feature → dev → main` 发布流程
- 📊 **真实差异计算** - 排除合并提交，只关注实际功能代码差异
- 🔀 **合并历史追溯** - 显示具体的合并链路和操作历史
- 🎨 **精美可视化输出** - 彩色图标和清晰的层级结构
- 💡 **智能操作建议** - 基于分析结果提供精准的下一步操作

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
bun add -d git-branch-check-diff-commits
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
gbd main --json        # JSON格式输出
gbd main --no-fetch    # 跳过自动fetch
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

### 场景1：自动化发布流程完成
```
╭─ 🔍 Git 分支智能对比分析 ─╮
├─ 🧹 工作区状态
✅ 工作区干净，可以安全进行分支操作

├─ 🌊 自动化流程分析
🔀 检测到自动化发布流程
  │ 1️⃣ feature/user-login → dev (f8299de)
  │ 2️⃣ dev → main (d7fdf79)

├─ 🌿 分支信息
  │ 当前分支: main
  │ 最新提交: d7fdf79 Merge branch 'dev' (2 minutes ago)
  ├──────────────────────────────────────────────────
  │ 对比分支: feature/user-login
  │ 最新提交: abc1234 feat: add user login (5 minutes ago)

├─ 📊 代码状态
 🎯 代码已一致 - 分支已合并 
  │ ✨ 通过自动化流程合并

├─ 🎯 智能建议
✅ 无需操作 - 代码已同步
ℹ️ 可删除已合并的本地分支
  │ git branch -d feature/user-login
╰────────────────────────────────────────────────────╯
```

### 场景2：代码有真实差异
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
 ⚠️  有新代码未同步 - 实际领先 3 个提交 

├─ 📄 实际代码差异
  │ 领先的功能提交: 3
  │ 有文件变更差异
  │ 共同基础: abc1234

├─ 🎯 智能建议
ℹ️ 推送新代码
  │ git push origin feature/awesome
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
✅ 无需操作 - 代码已同步
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
    "sync-status": "gbd origin/main --json"
  }
}
```

### CI/CD 集成
```yaml
# GitHub Actions 示例
- name: 检查分支状态
  run: |
    npm install -g git-branch-check-diff-commits
    gbd main --json > branch-status.json
    
- name: 分析结果
  run: |
    if gbd main --json | jq -r '.relationship.type' | grep -q "ahead"; then
      echo "分支领先，可以合并"
    fi
```

## 📚 API 使用

```javascript
import { analyzeBranches } from "git-branch-check-diff-commits";

// 基本分析
const result = await analyzeBranches("main");

// 带选项的分析
const result = await analyzeBranches("develop", { 
  json: true,
  noFetch: false 
});

// 获取分析结果
console.log(result.relationship.type);    // "merged" | "ahead" | "behind" | "synchronized" | "diverged"
console.log(result.realCodeDiff.realDiff); // true/false - 是否有真实代码差异
console.log(result.mergeHistory.hasAutomatedFlow); // 是否检测到自动化流程
console.log(result.mergeHistory.flowChain); // 合并链路详情
```

### 返回数据结构
```typescript
interface AnalysisResult {
  currentBranch: string;
  targetBranch: string;
  relationship: {
    type: "synchronized" | "merged" | "ahead" | "behind" | "diverged";
    confidence: "high" | "medium" | "low";
  };
  realCodeDiff: {
    realDiff: boolean;
    behindCommits: number;
    aheadCommits: number;
    hasFileDiff: boolean;
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
    changedFiles: Array<{file: string, status: string}>;
  };
}
```

## 🎯 智能分析功能

### 代码状态识别
- **🎯 代码完全一致** - 分支指向同一提交
- **🎯 代码已一致 - 分支已合并** - 功能分支已完全合并  
- **🎯 代码一致 - 只有合并提交差异** - 代码相同，历史不同
- **⚠️ 有新代码未同步** - 存在真实的功能差异
- **⚠️ 代码落后** - 需要同步功能提交

### 自动化流程检测
- 自动识别 `feature → dev → main` 发布流程
- 显示具体的合并链路和提交哈希
- 区分自动化合并和手动操作

### 智能建议系统
- 基于真实代码差异提供精准建议
- 区分"需要推送"和"无需操作"
- 自动识别可删除的已合并分支

## 🔍 常见使用模式

```bash
# 开发流程检查
gbd main              # 检查是否可以合并到主分支
gbd develop           # 检查开发分支状态

# 发布后验证  
gbd feature/xxx       # 验证功能分支是否已完全合并

# 同步状态检查
gbd origin/main       # 检查远程主分支状态
gbd upstream/develop  # 检查上游开发分支

# 批量检查（结合其他工具）
git branch | grep feature | xargs -I {} gbd {}
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

**让分支对比变得简单而智能！** 🚀