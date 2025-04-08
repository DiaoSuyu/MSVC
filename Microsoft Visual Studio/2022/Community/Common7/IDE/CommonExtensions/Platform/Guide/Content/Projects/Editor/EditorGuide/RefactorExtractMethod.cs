using System;

class CircleProgram
{
    void Run()
    {
        PrintArea();
    }

    void PrintArea()
    {
        double radius = 1.23;
        double area = Math.PI * radius * radius;
        Console.Write($"Area for radius {radius} is {area}");
    }
}
