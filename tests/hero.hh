#ifndef HERO_HH_
# define HERO_HH_

# include "defs.hh"

class Team;

class Hero
{
public:
   Hero(Team* team, const String& name);

   void present() const;

private:
   Team* _team;
   String _name;

};

#endif //!HER_HH_
