namespace NagesenAsAService.Models;

public class ThrowCoinEventArgs
{
    public double ThrowPoint { get; }
    public CoinType TypeOfCoin { get; }
    public int CountOfLike { get; }
    public int CountOfDis { get; }

    public ThrowCoinEventArgs(double throwPoint, CoinType typeOfCoin, int countOfLike, int countOfDis)
    {
        this.ThrowPoint = throwPoint;
        this.TypeOfCoin = typeOfCoin;
        this.CountOfLike = countOfLike;
        this.CountOfDis = countOfDis;
    }
}
