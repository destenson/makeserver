#include "hero.hh"
#include "utils.hh"
#include "team.hh"

Hero::Hero(Team* team, const String& name)
   : _team(team), _name(name)
{





}

void Hero::present() const
{
   println("Hello, I am " + _name);
   println("I belong to the team" + _team->getName());
}
