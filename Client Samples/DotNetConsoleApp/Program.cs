using Microsoft.AspNetCore.SignalR.Client;
using static System.Console;

WriteLine("投げ銭BOX as a Service に接続中...");
var connection = new HubConnectionBuilder()
    .WithUrl("https://naas.azurewebsites.net/naashub")
    .WithAutomaticReconnect()
    .Build();
await connection.StartAsync();
WriteLine("接続しました。");

Write("4桁の「部屋番号」を入力: ");
var roomNumber = int.Parse(ReadLine() ?? "");
var roomContext = await connection.InvokeAsync<RoomContext>("EnterRoomAsBoxAsync", roomNumber);
WriteLine($"部屋番号 {roomNumber} に入室しました。");
WriteLine($"- Like 銭: {roomContext.CountOfLike}");
WriteLine($"- Dis 銭 : {roomContext.CountOfDis}");

WriteLine("投げ銭投入の通知を受信します。");
connection.On("Throw", async (ThrowCoinEventArgs args) =>
{
    WriteLine($"{args.TypeOfCoin} 銭が投入されました。");
    WriteLine($"- Like 銭: {args.CountOfLike}");
    WriteLine($"- Dis 銭 : {args.CountOfDis}");
    await Task.CompletedTask;
});

WriteLine("投げ銭を待機中。止めるには Ctrl + C を押して下さい。");
var canceller = new CancellationTokenSource();
CancelKeyPress += (_, args) => { args.Cancel = true; canceller.Cancel(); };
canceller.Token.WaitHandle.WaitOne();

WriteLine("切断中...");
await connection.StopAsync();
WriteLine("切断しました。");

// 以下は型宣言
record RoomContext(int CountOfLike, int CountOfDis);
enum CoinType { Like, Dis }
record ThrowCoinEventArgs(double ThrowPoint, CoinType TypeOfCoin, int CountOfLike, int CountOfDis);
