#include <iostream>
#include "team.hh"
#include "hero.hh"

int main()
{
   Team team("gears");
   team.addHero("soldier");

   std::cout << "it's fun\n";

   while(false)
      ;





   team.getHero("soldier")->present();
}
