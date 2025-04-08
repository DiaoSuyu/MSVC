using System;

class Account
{
    public Decimal Balance { get; private set; }

    public void Deposit(Decimal amount)
    {
        Balance += amount;
    }

    public void Withdraw(Decimal amount)
    {
        if (Balance < amount)
        {
            throw new Exception("Unsufficient funds.");
        }

        Balance -= amount;
    }
}

static class AccountProgram
{
    public static void Run()
    {
        var account = new Account();
        account.Deposit(100);
        account.Withdraw(20);
        Console.WriteLine($"Balance is {account.Balance}");
    }
}
