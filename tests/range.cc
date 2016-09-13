#include "range.hh"

Range::Range(int min, int max)
   : _min(min), _max(max)
{

}

bool Range::accept(int n) const
{
   return n >= _min && n <= _max;
}
