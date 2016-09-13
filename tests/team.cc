#include "team.hh"
#include "hero.hh"

Team::Team(const String& name)
   : _name(name)
{

}

void Team::addHero(const String& name)
{
   _heroes[name] = new Hero(this, name);
}

Hero* Team::getHero(const String& name)
{
   return _heroes[name];
}

const String& Team::getName() const
{
   return _name;
}
