#include <iostream>
#include <format>

int main()
{
    int iteration = 0;

    while (true)
    {
        iteration++;
        std::string name;

        std::cout << "Welcome to Visual Studio! Please enter your name:\n";
        std::getline(std::cin, name);
        if (name.empty())
        {
            std::cout << "You did not enter a name. Please try again.\n";
            continue;
        }
        std::cout << std::format("Hello, {}! This is iteration {} of the loop.\n", name, iteration);
    }
}