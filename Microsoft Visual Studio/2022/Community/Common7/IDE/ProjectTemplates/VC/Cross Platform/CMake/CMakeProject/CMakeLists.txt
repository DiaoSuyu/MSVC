# $loctext_rootcmakelistscomment01$
# $loctext_rootcmakelistscomment02$
#
cmake_minimum_required (VERSION 3.8)

# $loctext_rootcmakelistscomment04$
if (POLICY CMP0141)
  cmake_policy(SET CMP0141 NEW)
  set(CMAKE_MSVC_DEBUG_INFORMATION_FORMAT "$<IF:$<AND:$<C_COMPILER_ID:MSVC>,$<CXX_COMPILER_ID:MSVC>>,$<$<CONFIG:Debug,RelWithDebInfo>:EditAndContinue>,$<$<CONFIG:Debug,RelWithDebInfo>:ProgramDatabase>>")
endif()

project ("$specifiedsolutionname$")

# $loctext_rootcmakelistscomment03$
add_subdirectory ("$projectname$")
