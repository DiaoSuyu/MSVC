# $loctext_projectcmakelistscomment01$
# $loctext_projectcmakelistscomment02$
#

# $loctext_projectcmakelistscomment03$
add_executable ($cmaketargetname$ "$projectname$.cpp" "$projectname$.h")

if (CMAKE_VERSION VERSION_GREATER 3.12)
  set_property(TARGET $cmaketargetname$ PROPERTY CXX_STANDARD 20)
endif()

# TODO: $loctext_projectcmakelistscomment04$
