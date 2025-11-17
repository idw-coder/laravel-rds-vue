# laravel-rds-vue

## personal_memo

### fetch → fetchWithAuth

- API
src\lib\fetchWithAuth.ts
src\api\auth.ts

- VIEW

vue-routerをインストール
tsconfig.jsonに追記
```json
    "moduleResolution": "node",
```
編集したらTS サーバーを再起動
src\views\Login.vue
router/index.ts

This template should help get you started developing with Vue 3 in Vite.

### 環境変数の設定

#### VITE_ プレフィックス

環境変数を クライアント側（ブラウザ） に公開する際、VITE_ で始まる変数 のみ を公開します。

#### Vite の環境変数の仕組み

- npm run dev → .env を使用
- npm run build → .env.production を使用

#### 環境変数の型定義

src/vite-env.d.ts
.d.ts = Declaration File（宣言ファイル） の略


### CI/CD GitHub Actions

Lightsail で新しい SSH キーを作成
Lightsail のブラウザターミナルで以下を実行、確認
```bash
ubuntu@ip-172-26-6-105:~$ ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key -N ""
ubuntu@ip-172-26-6-105:~$ cat ~/.ssh/github_actions_key
```
信頼する公開鍵のリストに追加

```bash
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys
```

GitHub で Vue リポジトリを開く
Settings → Secrets and variables → Actions
「New repository secret」をクリック
以下を入力

Name: SSH_PRIVATE_KEY
Secret: コピーした秘密鍵を貼り付け
「Add secret」をクリック

同様に

| Name | Value |
|------|-------|
| SSH_HOST | 54.178.81.51 |
| SSH_USER | ubuntu |

.github\workflows\deploy.ymlを作成

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
