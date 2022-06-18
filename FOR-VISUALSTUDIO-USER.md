# Windows OS 上で Visual Studio を使ってビルドする際の注意

2022年6月現在、Visual Studio 2022 上でビルドと実行ができることを確認済みです。

なお、下記の Visual Studio 拡張がインストールされていると、.ts ファイルないしは .scss ファイルを Visual Studio 上で保存した時点で、コンパイルとバンドルおよびミニファイが実行されるようになります。

- [Web Compiler 2022+](https://marketplace.visualstudio.com/items?itemName=Failwyn.WebCompiler64)
- [Bundle & Minifier 2022+](https://marketplace.visualstudio.com/items?itemName=Failwyn.BundlerMinifier64)

コマンドプロンプトから `dotnet watch` を実行しておくことでも同様の動作となりますが、Visual Studio 上での開発・実行と干渉するのと、上記拡張のほうが処理速度が速いです。
