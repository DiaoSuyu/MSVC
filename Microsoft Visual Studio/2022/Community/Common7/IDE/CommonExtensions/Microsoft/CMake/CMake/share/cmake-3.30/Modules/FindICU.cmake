# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

#[=======================================================================[.rst:
FindICU
-------

.. versionadded:: 3.7

Find the International Components for Unicode (ICU) libraries and
programs.

This module supports multiple components.
Components can include any of: ``data``, ``i18n``, ``io``, ``le``,
``lx``, ``test``, ``tu`` and ``uc``.

Note that on Windows ``data`` is named ``dt`` and ``i18n`` is named
``in``; any of the names may be used, and the appropriate
platform-specific library name will be automatically selected.

.. versionadded:: 3.11
  Added support for static libraries on Windows.

This module reports information about the ICU installation in
several variables.  General variables::

  ICU_FOUND - true if the main programs and libraries were found
  ICU_INCLUDE_DIRS - the directories containing the ICU headers
  ICU_LIBRARIES - component libraries to be linked
  ICU_VERSION - ICU release version

Imported targets::

  ICU::<C>

Where ``<C>`` is the name of an ICU component, for example
``ICU::i18n``; ``<C>`` is lower-case.

ICU programs are reported in::

  ICU_GENCNVAL_EXECUTABLE - path to gencnval executable
  ICU_ICUINFO_EXECUTABLE - path to icuinfo executable
  ICU_GENBRK_EXECUTABLE - path to genbrk executable
  ICU_ICU-CONFIG_EXECUTABLE - path to icu-config executable
  ICU_GENRB_EXECUTABLE - path to genrb executable
  ICU_GENDICT_EXECUTABLE - path to gendict executable
  ICU_DERB_EXECUTABLE - path to derb executable
  ICU_PKGDATA_EXECUTABLE - path to pkgdata executable
  ICU_UCONV_EXECUTABLE - path to uconv executable
  ICU_GENCFU_EXECUTABLE - path to gencfu executable
  ICU_MAKECONV_EXECUTABLE - path to makeconv executable
  ICU_GENNORM2_EXECUTABLE - path to gennorm2 executable
  ICU_GENCCODE_EXECUTABLE - path to genccode executable
  ICU_GENSPREP_EXECUTABLE - path to gensprep executable
  ICU_ICUPKG_EXECUTABLE - path to icupkg executable
  ICU_GENCMN_EXECUTABLE - path to gencmn executable

ICU component libraries are reported in::

  ICU_<C>_FOUND - ON if component was found; ``<C>`` is upper-case.
  ICU_<C>_LIBRARIES - libraries for component; ``<C>`` is upper-case.

ICU datafiles are reported in::

  ICU_MAKEFILE_INC - Makefile.inc
  ICU_PKGDATA_INC - pkgdata.inc

This module reads hints about search results from::

  ICU_ROOT - the root of the ICU installation

The environment variable ``ICU_ROOT`` may also be used; the
ICU_ROOT variable takes precedence.

The following cache variables may also be set::

  ICU_<P>_EXECUTABLE - the path to executable <P>; ``<P>`` is upper-case.
  ICU_INCLUDE_DIR - the directory containing the ICU headers
  ICU_<C>_LIBRARY - the library for component <C>; ``<C>`` is upper-case.

.. note::

  In most cases none of the above variables will require setting,
  unless multiple ICU versions are available and a specific version
  is required.
#]=======================================================================]

cmake_policy(PUSH)
cmake_policy(SET CMP0159 NEW) # file(STRINGS) with REGEX updates CMAKE_MATCH_<n>
# Written by Roger Leigh <rleigh@codelibre.net>

set(icu_programs
  gencnval
  icuinfo
  genbrk
  icu-config
  genrb
  gendict
  derb
  pkgdata
  uconv
  gencfu
  makeconv
  gennorm2
  genccode
  gensprep
  icupkg
  gencmn)

set(icu_data
  Makefile.inc
  pkgdata.inc)

# The ICU checks are contained in a function due to the large number
# of temporary variables needed.
function(_ICU_FIND)
  # Set up search paths, taking compiler into account.  Search ICU_ROOT,
  # with ICU_ROOT in the environment as a fallback if unset.
  if(ICU_ROOT)
    list(APPEND icu_roots "${ICU_ROOT}")
  else()
    if(NOT "$ENV{ICU_ROOT}" STREQUAL "")
      file(TO_CMAKE_PATH "$ENV{ICU_ROOT}" NATIVE_PATH)
      list(APPEND icu_roots "${NATIVE_PATH}")
      set(ICU_ROOT "${NATIVE_PATH}"
          CACHE PATH "Location of the ICU installation" FORCE)
    endif()
  endif()

  # Find include directory
  list(APPEND icu_include_suffixes "include")
  find_path(ICU_INCLUDE_DIR
            NAMES "unicode/utypes.h"
            HINTS ${icu_roots}
            PATH_SUFFIXES ${icu_include_suffixes}
            DOC "ICU include directory")
  mark_as_advanced(ICU_INCLUDE_DIR)
  set(ICU_INCLUDE_DIR "${ICU_INCLUDE_DIR}" PARENT_SCOPE)

  # Get version
  if(ICU_INCLUDE_DIR AND EXISTS "${ICU_INCLUDE_DIR}/unicode/uvernum.h")
    file(STRINGS "${ICU_INCLUDE_DIR}/unicode/uvernum.h" icu_header_str
      REGEX "^#define[\t ]+U_ICU_VERSION[\t ]+\".*\".*")

    string(REGEX REPLACE "^#define[\t ]+U_ICU_VERSION[\t ]+\"([^ \\n]*)\".*"
      "\\1" icu_version_string "${icu_header_str}")
    set(ICU_VERSION "${icu_version_string}")
    set(ICU_VERSION "${icu_version_string}" PARENT_SCOPE)
    unset(icu_header_str)
    unset(icu_version_string)
  endif()

  if(CMAKE_SIZEOF_VOID_P EQUAL 8)
    # 64-bit binary directory
    set(_bin64 "bin64")
    # 64-bit library directory
    set(_lib64 "lib64")
  endif()


  # Find all ICU programs
  list(APPEND icu_binary_suffixes "${_bin64}" "bin" "sbin")
  foreach(program ${icu_programs})
    string(TOUPPER "${program}" program_upcase)
    set(cache_var "ICU_${program_upcase}_EXECUTABLE")
    set(program_var "ICU_${program_upcase}_EXECUTABLE")
    find_program("${cache_var}"
      NAMES "${program}"
      HINTS ${icu_roots}
      PATH_SUFFIXES ${icu_binary_suffixes}
      DOC "ICU ${program} executable"
      NO_PACKAGE_ROOT_PATH
      )
    mark_as_advanced("${cache_var}")
    set("${program_var}" "${${cache_var}}" PARENT_SCOPE)
  endforeach()

  # Find all ICU libraries
  list(APPEND icu_library_suffixes "${_lib64}" "lib")
  set(static_prefix )
  # static icu libraries compiled with MSVC have the prefix 's'
  if(MSVC)
    set(static_prefix "s")
  endif()
  foreach(component ${ICU_FIND_COMPONENTS})
    string(TOUPPER "${component}" component_upcase)
    set(component_cache "ICU_${component_upcase}_LIBRARY")
    set(component_cache_release "${component_cache}_RELEASE")
    set(component_cache_debug "${component_cache}_DEBUG")
    set(component_found "ICU_${component}_FOUND")
    set(component_found_compat "${component_upcase}_FOUND")
    set(component_found_compat2 "ICU_${component_upcase}_FOUND")
    set(component_libnames "icu${component}")
    set(component_debug_libnames "icu${component}d")

    # Special case deliberate library naming mismatches between Unix
    # and Windows builds
    unset(component_libnames)
    unset(component_debug_libnames)
    list(APPEND component_libnames "icu${component}")
    list(APPEND component_debug_libnames "icu${component}d")
    if(component STREQUAL "data")
      list(APPEND component_libnames "icudt")
      # Note there is no debug variant at present
      list(APPEND component_debug_libnames "icudtd")
    endif()
    if(component STREQUAL "dt")
      list(APPEND component_libnames "icudata")
      # Note there is no debug variant at present
      list(APPEND component_debug_libnames "icudatad")
    endif()
    if(component STREQUAL "i18n")
      list(APPEND component_libnames "icuin")
      list(APPEND component_debug_libnames "icuind")
    endif()
    if(component STREQUAL "in")
      list(APPEND component_libnames "icui18n")
      list(APPEND component_debug_libnames "icui18nd")
    endif()

    if(static_prefix)
      unset(static_component_libnames)
      unset(static_component_debug_libnames)
      foreach(component_libname ${component_libnames})
        list(APPEND static_component_libnames
          ${static_prefix}${component_libname})
      endforeach()
      foreach(component_libname ${component_debug_libnames})
        list(APPEND static_component_debug_libnames
          ${static_prefix}${component_libname})
      endforeach()
      list(APPEND component_libnames ${static_component_libnames})
      list(APPEND component_debug_libnames ${static_component_debug_libnames})
    endif()
    find_library("${component_cache_release}"
      NAMES ${component_libnames}
      HINTS ${icu_roots}
      PATH_SUFFIXES ${icu_library_suffixes}
      DOC "ICU ${component} library (release)"
      NO_PACKAGE_ROOT_PATH
      )
    find_library("${component_cache_debug}"
      NAMES ${component_debug_libnames}
      HINTS ${icu_roots}
      PATH_SUFFIXES ${icu_library_suffixes}
      DOC "ICU ${component} library (debug)"
      NO_PACKAGE_ROOT_PATH
      )
    include(${CMAKE_CURRENT_LIST_DIR}/SelectLibraryConfigurations.cmake)
    select_library_configurations(ICU_${component_upcase})
    mark_as_advanced("${component_cache_release}" "${component_cache_debug}")
    if(${component_cache})
      set("${component_found}" ON)
      set("${component_found_compat}" ON)
      set("${component_found_compat2}" ON)
      list(APPEND ICU_LIBRARY "${${component_cache}}")
    endif()
    mark_as_advanced("${component_found}")
    mark_as_advanced("${component_found_compat}")
    mark_as_advanced("${component_found_compat2}")
    set("${component_cache}" "${${component_cache}}" PARENT_SCOPE)
    set("${component_found}" "${${component_found}}" PARENT_SCOPE)
    set("${component_found_compat}" "${${component_found_compat}}" PARENT_SCOPE)
    set("${component_found_compat2}" "${${component_found_compat2}}" PARENT_SCOPE)
  endforeach()
  set(ICU_LIBRARY "${ICU_LIBRARY}" PARENT_SCOPE)

  # Find all ICU data files
  if(CMAKE_LIBRARY_ARCHITECTURE)
    list(APPEND icu_data_suffixes
      "${_lib64}/${CMAKE_LIBRARY_ARCHITECTURE}/icu/${ICU_VERSION}"
      "lib/${CMAKE_LIBRARY_ARCHITECTURE}/icu/${ICU_VERSION}"
      "${_lib64}/${CMAKE_LIBRARY_ARCHITECTURE}/icu"
      "lib/${CMAKE_LIBRARY_ARCHITECTURE}/icu")
  endif()
  list(APPEND icu_data_suffixes
    "${_lib64}/icu/${ICU_VERSION}"
    "lib/icu/${ICU_VERSION}"
    "${_lib64}/icu"
    "lib/icu")
  foreach(data ${icu_data})
    string(TOUPPER "${data}" data_upcase)
    string(REPLACE "." "_" data_upcase "${data_upcase}")
    set(cache_var "ICU_${data_upcase}")
    set(data_var "ICU_${data_upcase}")
    find_file("${cache_var}"
      NAMES "${data}"
      HINTS ${icu_roots}
      PATH_SUFFIXES ${icu_data_suffixes}
      DOC "ICU ${data} data file")
    mark_as_advanced("${cache_var}")
    set("${data_var}" "${${cache_var}}" PARENT_SCOPE)
  endforeach()
endfunction()

_ICU_FIND()

include(${CMAKE_CURRENT_LIST_DIR}/FindPackageHandleStandardArgs.cmake)
find_package_handle_standard_args(ICU
  REQUIRED_VARS
    ICU_INCLUDE_DIR
    ICU_LIBRARY
  VERSION_VAR
    ICU_VERSION
  HANDLE_COMPONENTS
  FAIL_MESSAGE
    "Failed to find all ICU components"
)

if(ICU_FOUND)
  set(ICU_INCLUDE_DIRS "${ICU_INCLUDE_DIR}")
  set(ICU_LIBRARIES "${ICU_LIBRARY}")
  foreach(_ICU_component ${ICU_FIND_COMPONENTS})
    string(TOUPPER "${_ICU_component}" _ICU_component_upcase)
    set(_ICU_component_cache "ICU_${_ICU_component_upcase}_LIBRARY")
    set(_ICU_component_cache_release "ICU_${_ICU_component_upcase}_LIBRARY_RELEASE")
    set(_ICU_component_cache_debug "ICU_${_ICU_component_upcase}_LIBRARY_DEBUG")
    set(_ICU_component_lib "ICU_${_ICU_component_upcase}_LIBRARIES")
    set(_ICU_component_found "ICU_${_ICU_component_upcase}_FOUND")
    set(_ICU_imported_target "ICU::${_ICU_component}")
    if(${_ICU_component_found})
      set("${_ICU_component_lib}" "${${_ICU_component_cache}}")
      if(NOT TARGET ${_ICU_imported_target})
        add_library(${_ICU_imported_target} UNKNOWN IMPORTED)
        if(ICU_INCLUDE_DIR)
          set_target_properties(${_ICU_imported_target} PROPERTIES
            INTERFACE_INCLUDE_DIRECTORIES "${ICU_INCLUDE_DIR}")
        endif()
        if(EXISTS "${${_ICU_component_cache}}")
          set_target_properties(${_ICU_imported_target} PROPERTIES
            IMPORTED_LINK_INTERFACE_LANGUAGES "CXX"
            IMPORTED_LOCATION "${${_ICU_component_cache}}")
        endif()
        if(EXISTS "${${_ICU_component_cache_release}}")
          set_property(TARGET ${_ICU_imported_target} APPEND PROPERTY
            IMPORTED_CONFIGURATIONS RELEASE)
          set_target_properties(${_ICU_imported_target} PROPERTIES
            IMPORTED_LINK_INTERFACE_LANGUAGES_RELEASE "CXX"
            IMPORTED_LOCATION_RELEASE "${${_ICU_component_cache_release}}")
        endif()
        if(EXISTS "${${_ICU_component_cache_debug}}")
          set_property(TARGET ${_ICU_imported_target} APPEND PROPERTY
            IMPORTED_CONFIGURATIONS DEBUG)
          set_target_properties(${_ICU_imported_target} PROPERTIES
            IMPORTED_LINK_INTERFACE_LANGUAGES_DEBUG "CXX"
            IMPORTED_LOCATION_DEBUG "${${_ICU_component_cache_debug}}")
        endif()
        if(CMAKE_DL_LIBS AND _ICU_component STREQUAL "uc")
          set_target_properties(${_ICU_imported_target} PROPERTIES
            INTERFACE_LINK_LIBRARIES "${CMAKE_DL_LIBS}")
        endif()
      endif()
    endif()
    unset(_ICU_component_upcase)
    unset(_ICU_component_cache)
    unset(_ICU_component_lib)
    unset(_ICU_component_found)
    unset(_ICU_imported_target)
  endforeach()
endif()

unset(icu_programs)
cmake_policy(POP)
