int iteration = 0;

while (true)
{
    iteration++;
    Console.WriteLine("Welcome to Visual Studio! Please enter your name:");
    string name = Console.ReadLine() ?? string.Empty;
    if (name == string.Empty)
    {
        Console.WriteLine("You did not enter a name. Please try again.");
        continue;
    }
    Console.WriteLine($"Hello, {name}! This is iteration {iteration} of the loop.");
}
