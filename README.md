# git-branch-check-diff-commits

🌿 精美的 Git 分支对比工具，提供清晰的可视化输出和智能分析。

## 安装

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

## 使用

### 命令行

```bash
# 基本使用
git-branch-check-diff-commits main
git-branch-check-diff-commits origin/develop

# 短别名
gbd main

# 选项
git-branch-check-diff-commits main --verbose     # 详细输出
git-branch-check-diff-commits main --json        # JSON格式输出
git-branch-check-diff-commits main --no-fetch    # 跳过自动fetch
```

### package.json scripts

```json
{
  "scripts": {
    "check-main": "git-branch-check-diff-commits main",
    "check-dev": "git-branch-check-diff-commits develop --verbose"
  }
}
```

## 输出示例

```
╭─ 🔍 Git 分支对比分析 ─╮
├─ 🧹 工作区状态
✅ 工作区干净，可以安全进行分支操作
├─ 🌿 分支信息
  │ 当前分支: feature/awesome
  │ 最新提交: abc1234 Add awesome feature (2 hours ago)
  │ 提交作者: ChenYu
  ├──────────────────────────────────────────────────
  │ 目标分支: main
  │ 最新提交: def5678 Update docs (1 day ago)
  │ 提交作者: TeamMate
├─ 📊 分支关系分析
✅ 当前分支领先，可以推送到 main
├─ 📄 变更统计
  │ 领先提交: 3
  │ 落后提交: 0
  │ 变更文件: 5
  │ 新增行数: +127
  │ 删除行数: -23
├─ 🎯 建议操作
ℹ️ 可以推送: git push origin feature/awesome
╰────────────────────────────────────────────────────╯
```

## API

```javascript
import { analyzeBranches } from "git-branch-check-diff-commits";

const result = await analyzeBranches("main", { json: true });
console.log(result.stats); // { ahead: 2, behind: 1, ... }
```

## License

MIT
