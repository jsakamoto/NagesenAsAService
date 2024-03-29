# NaaS (投げ銭BOX as a Service)

## これは何?

IT系勉強会などにおいて、投げ銭というカタチでリアルタイムで発表者を評価するWebアプリ「投げ銭BOX」の SaaS、すなわち「投げ銭BOX as a Service」(略して **"NaaS"**) です。

URL はこちら:  
**[https://naas.azurewebsites.net/](https://naas.azurewebsites.net/)**

スマートフォンやタブレット、PC など各種デバイスの Web ブラウザからアクセス、表示される「投げ銭コントローラ」で「銭」のアイコンをタップすると、発表者の「投げ銭BOX」ページにチャリンチャリンとたまる Web アプリです。

## 使い方

1. 発表者は、Web ブラウザで [「投げ銭BOX as a Service」 のトップページ](https://naas.azurewebsites.net/)を開き、「または**新しい部屋を作る**」をクリックします。
2. 新しい部屋番号が発行され (※1)、その部屋番号の投げ銭BOXページに移動します。
3. ページ右上のメニューアイコンをタップし、以下の設定を行います。
 - 部屋のタイトル
 - Twitter でつぶやく機能に付加されるハッシュタグ
 - "Dis" 銭 (煽り銭) の使用有無
4. 続けてその**部屋番号を参加者に知らせます**。  
投げ銭BOXページ上部には、部屋番号が表示されているほか、直接アクセスのための短縮 URL も表示されています。  
また、ページ上部の QR コード風のアイコンをクリックすれば、先の短縮 URL を示す QR コードが拡大表示されます。  
この QR コード拡大表示の画面には Twitter ボタンが用意してあり、これをクリックすることで先の短縮 URL とハッシュタグを含むメッセージをツイートできます。
5. 参加者は、**知らされた部屋番号で「投げ銭BOX as a Service」トップページから入場**するか、あるいは直接アクセスの短縮 URL を開くことで、当該部屋番号の「投げ銭」コントローラが開きます。
6. セッションを開始します。  
参加者は **「これはいい！」** と思ったら「投げ銭コントローラ」上の「銭」アイコンをタップして**投げ銭**します。
7. セッションが終了したら、お好みで、発表者・参加者はページ上部の Twitter アイコンをクリックして Twitter 上で**結果をツイート**できます。  
このときのツイートメッセージには、既定で、投げ銭BOXのスクリーンキャプチャ (※2) の URL が含まれています。
8. 引き続き、同じ部屋番号のまま、別のセッションについても改めて投げ銭を集めたい場合は、ページ右上のメニューアイコンをタップし、開いたメニューから「**リセット**」ボタンをクリックしてリセットしてください。

> ※1...作成した部屋は、作成から7日後に期限切れになり、削除されます。  
> ※2...投げ銭BOXのスクリーンキャプチャは、アイドル時に自動で撮影されます。

## 生い立ち

こちらの slideshare のスライドが詳しいです。

**聞くだけじゃもったいない！観客と発表者の双方向通信を実現する「投げ銭box」**  
[https://www.slideshare.net/tututen/osc2014-box](https://www.slideshare.net/tututen/osc2014-box)

MacOS 用アプリ + iPhone アプリとして実装されたのを始まりとし、その後いくつかの実装形態を経て、Node.js 実装で Socket.io 利用によるリアルタイム Web アプリとして結実しました。

上記スライドで紹介されている「投げ銭BOX」Web版を、さらに SaaS 化したのが本プログラムです。

## 実装形態について

- サーバー側実装については、SaaS 化するにあたりデータベースを読み書きする実装が必要になりましたが、作者(自分)は Node.js は不勉強でしたので、慣れていた C# ([ASP.NET Core](https://asp.net/mvc)) で新規に書き起こしました。

- そのため、リアルタイム Web 通信には、Socket.io ではなく、"[SignalR](https://www.asp.net/signalr)" を使用しています。

- 投げ銭落下の物理演算には、元祖「投げ銭BOX」Web 版と同じく、JavaScript ライブラリ "[Box2DWeb](https://github.com/hecht-software/box2dweb)" を使用し、canvas 要素に描画しています。

- 投げ銭BOXのスクリーンショット取得には、JavaScript ライブラリ "[html2canvas](https://html2canvas.hertzen.com/)" を使用しています。

- クライアント側実装のコーディングにあたり、生の JavaScript で直接記述するのではなく、AltJS 言語の一派である "[TypeScript](https://www.typescriptlang.org/)"を使用しました。

### ビルドするには

- OS にあわせた [.NET SDK 6.0.x 以降](https://dotnet.microsoft.com/download/dotnet/6.0) と、[Node.js v.14 以降](https://nodejs.org/) が必要です。
- この Git リポジトリを clone したら、ターミナルにて `./NagesenAsAService` サブフォルダに移動し、`dotnet watch` コマンドを実行することで、ビルドと実行が行なわれ、ブラウザが起動して動作を試すことができます。
- その状態でソースファイル (.cs, .cshtml, .ts, .scss) を編集するとビルドが再実行され、ブラウザで再読み込みが行なわれます。

Windows OS 上で Visual Studio を用いて開発・実行する場合は、[こちらの注意事項](FOR-VISUALSTUDIO-USER.md)を参照下さい。

## ライセンス

[GNU General Public License Ver.2](LICENSE)

サードパーティー製品のライセンスについては[こちら](THIRD-PARTY-NOTICES.txt)