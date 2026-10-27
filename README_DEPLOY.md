# 项目主页维护与部署

线上地址：https://vid-gen.github.io/seeing_the_unseen/

这是纯静态网站，无需构建。根目录的 `.nojekyll` 使 GitHub Pages 原样发布资源。

- `index.html`：页面内容、五组模型视频对比、运动信号示范和消融对比。
- `static/js/config.js`：Paper、Code、Model 的外部链接。
- `static/js/main.js`：标签页、视频播放控制和结果表格。
- `static/css/style.css`：桌面和手机布局。
- `static/videos/`：网页实际引用的视频及封面。

修改视频时，同时更新 `index.html` 中的 source、下载链接和 poster。使用 H.264 MP4（yuv420p），并保持相对路径。提示词也直接在 `index.html` 修改。已删除旧的 Generated videos 区域；无需配置 videos 数组。

本地预览：

```sh
python3 -m http.server 8000
```

打开 http://localhost:8000/ 。将更改提交并推送到 main，由仓库的 GitHub Pages 发布配置部署。
