# 小小数学花园

一个给 3-7 岁儿童练习逻辑和数学的零依赖网页小游戏。

## 玩法

- 数数：看花园里的物品，选择正确数量。
- 加法：看两组物品，选择总数。
- 双倍数：看两组一样多的物品，快速说出双倍后的总数。
- 规律：观察图形序列，选择下一个图形。
- 逻辑：练习找一样、找不同、配对补空格、比较多少、数字规律、镜像规律、大小排序。
- 动态讲解：加法、减法、缺数加法和双倍数答对后，会用物品动态演示答案是怎么来的。
- 小动物反馈：每次答对或答错，主画面上的小动物都会立刻说话并做动作，不只是静态弹字。
- 年龄分级：3、4、5、6、7 岁五档，题目池明确分层：
  - 3 岁：数到 4，4 以内加法，AB 规律，只找一样。
  - 4 岁：主要是 5-7 的数量和答案，找不同、配对补空格、比较多少。
  - 5 岁：主要是 8-12 的数量和答案，开始做减法、数字规律和大小排序。
  - 6 岁：主要是 13-16 的数量和答案，缺数加法、双倍数、2/3/4 跳数规律。
  - 7 岁：主要是 17-20 的数量和答案，双倍数、缺数加法、2/3/4/5 跳数规律、镜像规律和大小排序。
- 中英文切换：界面、题目、答案标签可切换中文或英文；答对/答错反馈固定显示中英文。
- 小兔子闯关：每关约 6-8 道题，闯关成功后找到一个小动物伙伴。
- 小动物伙伴：兔兔会逐关找到熊猫、小狐狸、小鸡和小猫；反复点击小动物会随机出现跳、挥手、跳舞、转圈、躲猫猫、送爱心等不同表现。
- 伙伴小游戏：闯关成功后会随机显示荡秋千、跳舞、攀岩或玩球的奖励画面，然后进入下一关。
- 触屏互动：点画面会出现星星特效，摸小动物会让它跳起来。
- 柔和声音：答对、答错、摸动物都有更轻的木琴/风铃感反馈，题目朗读优先播放内置中文提示音频，失败时再使用系统中文 voice。
- 漫画质感：画面使用原创卡通小动物、圆润图形、纸张纹理、描边和高光。

答对后花园会长出新的花，答错会给温和提示，可以继续尝试。

## 运行

直接打开 `index.html` 即可；也可以在项目目录里启动静态服务器：

```bash
python3 -m http.server 8012 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:8012`。

## 手机和 iPad 打开

手机或 iPad 与电脑连接同一个 Wi-Fi 后，在项目目录运行：

```bash
bash serve-mobile.sh
```

终端会显示一个类似 `http://192.168.x.x:8012` 的地址。用手机或 iPad 的 Safari 打开这个地址即可。打开后可以通过 Safari 的分享按钮添加到主屏幕，之后会像一个小应用一样启动。

## 公开链接部署

### GitHub Pages

如果要让全家人都能直接通过一个长期链接打开，推荐发布到 GitHub Pages。

先登录 GitHub CLI：

```bash
gh auth login -h github.com -w
```

然后在项目目录运行：

```bash
bash publish-github-pages.sh
```

脚本会创建公开仓库、启用 GitHub Pages Actions 部署，并输出类似下面的家庭访问链接：

```text
https://你的GitHub用户名.github.io/kids-logic-math-game/
```

也可以指定仓库名：

```bash
bash publish-github-pages.sh my-kids-math-game
```

如果 `gh auth login` 交互登录卡住，可以用 GitHub Personal Access Token。创建 classic token，勾选这些 scopes：

- `repo`
- `workflow`
- `read:org`
- `gist`

```text
https://github.com/settings/tokens
```

然后运行：

```bash
bash publish-github-pages-token.sh
```

脚本会隐藏输入 token，不会把 token 写入项目文件。

### Vercel

如果 `vercel login` 因网络问题失败，可以用 Vercel Personal Token 部署。先在 Vercel 创建 token：

```text
https://vercel.com/account/tokens
```

然后在项目目录运行预览部署：

```bash
bash deploy-vercel-token.sh
```

如果要给家人长期使用，运行正式部署：

```bash
bash deploy-vercel-prod-token.sh
```

脚本会隐藏输入 token，不会把 token 写入文件。

## 设计边界

- 目标年龄：3-7 岁。
- 数字范围：按年龄分级，从 1-4 逐步提高到 1-20。
- 交互：触屏优先、大按钮、短回合、小动物反馈、正反馈、无惩罚。
- 技术：Canvas 渲染游戏画面，DOM 渲染按钮和辅助文本。
- 移动端：提供 PWA manifest 和 service worker，便于添加到主屏幕并缓存基础资源。
- 朗读：题目音频由 `generate-prompt-audio.sh` 生成，默认使用 macOS `Flo (中文（中国大陆）)` voice，并输出到 `audio/prompts/`。
- 手机端：主画面优先显示，答案按钮压缩为一行，降低答案区占屏比例。
