#makeserver

Server to compile C/C++ files at each modification

All paths are relative to the config file (make.json) :

port :  port number of the server
cxx : c++ compiler (defait is "gcc")
cxxflags: c++ flags (default is "")
ldflags : linker flags (default is ("")
target : path to the executable (default is "a.out")
srcFiles : array of paths of all files to compile (default is [])
srcDirs : array of paths, all source files in this directories are compiled (default is [])
autorun: if true, automatically run after each compilation (default is false)
