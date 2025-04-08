iteration = 0

while True:

    iteration += 1
    name = input('Welcome to Visual Studio! Please enter your name:\n')
    if (name == str()):
        print('You did not enter a name. Please try again.')
        continue
    
    print('Hello, {}! This is iteration {} of the loop.'.format(name, iteration))


