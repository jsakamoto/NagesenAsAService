# Windows OS 上で Visual Studio を使ってビルドする際の注意

2021年4月現在、Visual Studio 2019 上でビルドと実行ができることを確認済みです。

なお、下記の Visual Studio 拡張がインストールされていると、.ts ファイルないしは .scss ファイルを Visual Studio 上で保存した時点で、コンパイルとバンドルおよびミニファイが実行されるようになります。

- [Web Compiler](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.WebCompiler)
- [Bundle & Minifier](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.BundlerMinifier)

コマンドプロンプトから `dotnet watch` を実行しておくことでも同様の動作となりますが、Visual Studio 上での開発・実行と干渉するのと、上記拡張のほうが処理速度が速いです。

ただし、**上記で案内している [Bundle & Minifier](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.BundlerMinifier)** は、「投げ銭BOX as a Service」に含まれるクライアント側スクリプト実装のバンドル処理で**エラー**を起こします。

これは上記リンク先で配付されている公式リリース版が、JavaScript の async/await 構文に未対応であるためです。

この不具合を回避するには、**本リポジトリに収録してある、[パッチ適用版の Bundle & Minifier 拡張](assets/Bundler%20%26%20Minifier%20v3.2.0.1.vsix)をインストール**してください。