# VOICEVOX Discord TTS Bot

## What's this?

[VOICEVOX ENGINE](https://github.com/Hiroshiba/voicevox_engine) の
[Node.js版](https://github.com/y-chan/node-voicevox-engine) を利用したDiscord向けTTS Botです。
[discord.pyを用いたバージョン](https://github.com/y-chan/voicevox_discord_tts_sample) の後継です。
discord.pyがメンテナンス終了したことを受け、discord.jsへ移行したものになります。
VOICEVOX ENGINE自体が、同時に大量に音声合成を行うことは向いていないため、利用したい人がセルフホストして利用してください。  
また、本READMEはBot構築に関してある程度知識がある前提で書かれています。ご了承ください。

## 貢献者の方へ

Issue を解決するプルリクエストを作成される際は、別の方と同じ Issue に取り組むことを避けるため、
Issue 側で取り組み始めたことを伝えるか、最初に Draft プルリクエストを作成してください。

## 実行方法

Discord.js v13を利用する関係上、Node.js v16を必要とします。
ここではNode.jsのインストール方法は省略します。

### 必要なライブラリのインストール

- yarnの場合
```bash
yarn install
```

- npmの場合
```
npm install
```

### libtorch のインストール
- サーバーでの利用想定でCPU版をインストールします。
```bash
# libtorch を最上層にインストールする
# わかる人は適宜好きな場所にダウンロード・解凍してください。
cd /
wget https://download.pytorch.org/libtorch/cpu/libtorch-cxx11-abi-shared-with-deps-1.9.1%2Bcpu.zip
unzip libtorch-cxx11-abi-shared-with-deps-1.9.1+cpu.zip
```

- libtorchをライブラリとして読み込むように設定します。
  `.bashrc`などに記載しておくと、次回から自動的に実行されるので良いかもしれません。
```bash
export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/libtorch/lib"
```

### VOICEVOX Core のインストール

```bash
# VOICEVOX Core (0.9.4)を最上層にインストールする
# わかる人は適宜好きな場所にダウンロード・解凍してください。
cd /
wget https://github.com/Hiroshiba/voicevox_core/releases/download/0.9.4/core.zip
unzip core.zip
mv core voicevox_core

# cpu版を使うので、gpu版を消してcpu版をリネームする
rm voicevox_core/libcore.so
mv voicevox_core/libcore_cpu.so voicevox_core/libcore.so
```

- VOICEVOX Core のパスを環境変数に登録します。
  `.bashrc`などに記載しておくと、次回から自動的に実行されるので良いかもしれません。
  ここで設定した`VOICEVOX_CORE`変数がBotの起動時に自動的に読み込まれます。
```bash
export VOICEVOX_CORE="/voicevox_core/libcore.so"
```

### Bot用Oauthトークンの取得と設定

- トークンをDiscord Developer Portalから取得してください。ここでは取得方法は省略します。
- 取得したトークンを`BOT_TOKEN`環境変数に登録します。
  `.bashrc`などに記載しておくと、次回から自動的に実行されるので良いかもしれません。
```bash
export BOT_TOKEN="<Discord Developer Portalで取得したトークン>"
```

### 実行

- yarnの場合
```bash
yarn start 
```

- npmの場合
```
npm start
```

## ライセンス

本Botは[LGPL-3.0](LICENSE)で公開されています。
