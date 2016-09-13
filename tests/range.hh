#ifndef RANGE_HH_
# define RANGE_HH_

class Range
{



public:
   Range(int min, int max);

   bool accept(int n) const;

private:
   int _min;
   int _max;;

};

#endif //!RANGE_HH_
