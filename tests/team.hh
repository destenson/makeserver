#ifndef TEAM_HH_
# define TEAM_HH_

# include <map>
# include "utils.hh"

class Hero;

class Team
{
public:
   Team(const String& name);
   void addHero(const String& name);
   Hero* getHero(const String& name);
   const String& getName() const;

private:
   String _name;
   std::map<std::string, Hero*> _heroes;
};

#endif //!TEAM_HH_
