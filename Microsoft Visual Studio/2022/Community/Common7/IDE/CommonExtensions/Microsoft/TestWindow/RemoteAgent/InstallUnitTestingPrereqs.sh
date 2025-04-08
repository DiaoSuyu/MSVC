#!/bin/bash
# Copyright (c) Microsoft Corporation.  All rights reserved.
# Script to install pre-requirements to running tests on a remote environment.
# This script needs admin privileges!

# Update this whenever there is an update to this script.
VERSION=1.0

# Stop script on NZEC 
set -e
# Stop script if unbound variable found (use ${var:-} if intentional)
set -u
# By default cmd1 | cmd2 returns exit code of cmd2 regardless of cmd1 success
# This is causing it to fail
set -o pipefail

# standard output may be used as a return value in the functions
# we need a way to write text on the screen in the functions so that
# it won't interfere with the return value.
# Exposing stream 3 as a pipe to standard output of the script itself
exec 3>&1

# Added to get OS details. 
if [ -f "/etc/os-release" ]; then
    . /etc/os-release
elif [ -f "/usr/lib/os-release" ]; then
    . /usr/lib/os-release
fi

# Use in the the functions: eval $invocation
invocation='report_verbose "Calling: ${yellow:-}${FUNCNAME[0]} ${green:-}$*${normal:-}"'

# Setup some colors to use. These need to work in fairly limited shells, like the Ubuntu Docker container where there are only 8 colors.
# See if stdout is a terminal
if [ -t 1 ] && command -v tput > /dev/null; then
    # see if it supports colors
    ncolors=$(tput colors)
    if [ -n "$ncolors" ] && [ $ncolors -ge 8 ]; then
        bold="$(tput bold       || echo)"
        normal="$(tput sgr0     || echo)"
        black="$(tput setaf 0   || echo)"
        red="$(tput setaf 1     || echo)"
        green="$(tput setaf 2   || echo)"
        yellow="$(tput setaf 3  || echo)"
        blue="$(tput setaf 4    || echo)"
        magenta="$(tput setaf 5 || echo)"
        cyan="$(tput setaf 6    || echo)"
        white="$(tput setaf 7   || echo)"
    fi
fi

# Constants
readonly default_install_dir="$HOME/.unittestingprereqs"
# Exit codes
readonly unsupported_distro=91
readonly script_installed_dotnet_retcode=71
readonly script_installed_debugger_retcode=72
readonly script_failed_install_dotnet_deps_retcode=73

report_info() {
    # using stream 3 (defined in the beginning) to not interfere with stdout of functions
    # which may be used as return value
    printf "%b\n" "${white:-}: Information: $1${normal:-}" >&3
}

report_warning() {
    printf "%b\n" "${yellow:-}${script_name}: Warning: $1${normal:-}" >&3
}

report_error() {
    printf "%b\n" "${red:-}${script_name}: Error: $1${normal:-}" >&2
}

report() {
    # using stream 3 (defined in the beginning) to not interfere with stdout of functions
    # which may be used as return value
    printf "%b\n" "${cyan:-}InstallUnitTestingPrereqs:${normal:-} $1" >&3
}

report_verbose() {
    if [[ "$verbose" == true ]]; then
        report "$1"
    fi
}

machine_has() {
    eval $invocation

    hash "$1" > /dev/null 2>&1
    return $?
}

has_dotnet() {
    eval $invocation

    local path=$1

    # TODO: Check if it has the right runtime installed. Determine what the required runtime to install is
    if machine_has "dotnet"; then
       report_info "dotnet installed globally"
       return 0
    fi

    # Check if we already installed dotnet to the $HOME directory
    if [ -f "$path/dotnet" ]; then
        report_info "dotnet installed to $path"
        return $script_installed_dotnet_retcode
    fi

    report_info "dotnet not installed"
    return 1
}

has_debugger() {
    eval $invocation

    local path=$1
    # Check if we already installed vsdbg to the $HOME directory
    if [ -f "$path/vsdbg" ]; then
        report_info "Visual Studio debugger bits installed to $path"
        return 0
    fi
    
    report_info "Visual Studio debugger bits not installed"
    return 1
}

verify_root_user() {
  if ! [ $(id -u) -eq 0 ]; then
     report_error "The provided arguments to this script needs root permission"
     exit 1
  fi
}

# Todo - should we always install curl? Check if wget is already installed first.
install_curl() {
    eval $invocation

    if ! machine_has "curl"; then
        report_info "Installing curl"
        apt-get update -y
        apt-get install -y curl
    fi
}

install_dotnet() {
    eval $invocation

    local path=$1

    if has_dotnet path ; then
       return 0
    fi

    # We only support auto-installing dotnet for Ubuntu and Debian at the moment. Throw for other distros asking the user to Install
    # the latest version themselves.
    # $ID is defined in the os-release script imported at the beginning of this script.
    if [[ ! ( $ID == *"ubuntu"* || $ID == *"debian"* ) ]]; then
       return $unsupported_distro
    fi

    install_curl

    report_info "Installing the latest stable .NET to $path"
    mkdir -p "$path"
    pushd "$path"
    curl -H 'Cache-Control: no-cache' -L https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
    # The dotnet install script needs bash.
    /bin/bash dotnet-install.sh -Runtime dotnet -installDir "$path"
    popd

    # install dotnet dependencies required for this OS as well. For instance the dependencies for Ubuntu are documented here: https://docs.microsoft.com/en-us/dotnet/core/install/linux-ubuntu#dependencies
    if try_install_dotnet_dependencies; then
       return $script_installed_dotnet_retcode
    else
       return $script_failed_install_dotnet_deps_retcode
    fi
}

try_install_dotnet_dependencies()
{
    report_info "***************************************************************************************"
    report_info "Attempting to install dependencies required by dotnet as detailed here: https://docs.microsoft.com/en-us/dotnet/core/install/linux-scripted-manual#dependencies"
    report_info "***************************************************************************************"

    local additionalPackages=""
    if [[ $ID == *"ubuntu"* ]]; then
       # The following dependency list has been curated using these docs: https://docs.microsoft.com/en-us/dotnet/core/install/linux-ubuntu#dependencies
       if [[ $VERSION_ID  == "14."* ]]; then
         additionalPackages="libicu52 libssl1.0.0"
       elif [[ $VERSION_ID  == "16."* ]]; then
         additionalPackages="libicu55 libssl1.0.0"
       elif [[ $VERSION_ID  == "18."* ]]; then
         additionalPackages="libicu60 libssl1.1"
       elif [[ $VERSION_ID  == "20."* ]]; then
         additionalPackages="libicu66 libssl1.1"
       elif [[ $VERSION_ID  == "22."* ]]; then
         additionalPackages="libicu70"
       else
         # Always install a version of the ICU package so we are atleast able to start up the dotnet process.
         additionalPackages="libicu70"
       fi
       apt-get update -y
       set_timezone
       apt-get install libc6 libgcc1 libgssapi-krb5-2 libstdc++6 zlib1g ${additionalPackages} -y

       return $?
    fi

    if [[ $ID == *"debian"* ]]; then
    # The following dependency list has been curated using these docs: https://docs.microsoft.com/en-us/dotnet/core/install/linux-debian#dependencies
        if [[ $VERSION_ID == "8."* ]]; then
          additionalPackages="libicu52 libssl1.0.0"
        elif [[ $VERSION_ID == "9."* ]]; then
          additionalPackages="libicu57 libssl1.1"
        elif [[ $VERSION_ID == "10."* ]]; then
          additionalPackages="libicu63 libssl1.1"
        elif [[ $VERSION_ID == "11."* ]]; then
          additionalPackages="libicu67 libssl1.1"
        else
          # Always install a version of the ICU package so we are atleast able to start up the dotnet process.
          additionalPackages="libicu67"
        fi
        apt-get update -y 
        set_timezone
        apt-get install libc6 libgcc-s1 libgssapi-krb5-2 libstdc++6 zlib1g ${additionalPackages} -y

        return $?
    fi
}

set_timezone() {
    # Packages like tzdata require that a timezone is already set otherwise it would prompt the user
    # as part of our auto-install steps. Check if the time zone is not set and explicitly set it to the default (Etc/UTC) in that case
    if [ ! -f "/etc/timezone" ]; then
       report_info "Setting time zone to the default UTC since it isn't currently set"
       local TZ="Etc/UTC"
       ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
    fi
}

install_debugger() {
    eval $invocation

    local path=$1

    if has_debugger path ; then
        return 0
    fi

    install_curl

    if machine_has "unzip" -ne 0 ; then
       report_info "Installing Unzip"
       apt-get update -y
       apt-get install unzip -y
    fi
    
    report_info "Installing VS debugger bits to $path"
    
    mkdir -p "$path"
    curl -H 'Cache-Control: no-cache' -L https://aka.ms/getvsdbgsh -o "$path/getvsdbg.sh"
    /bin/sh "$path/getvsdbg.sh" -v latest -l "$path"

    return $script_installed_debugger_retcode
}

report_info "Install Unit Testing Prerequisites script"

## Global variables
should_install_dotnet=false
should_install_debugger=false
check_dotnet_install=false
check_vsdbg_install=false
verbose=false
location=$default_install_dir
script_name=$(basename "$0")

while [[ $# -gt 0 ]]
do
    name="$1"
    case "$name" in
        -idot|--install-dotnet)
            verify_root_user
            should_install_dotnet=true
            ;;
        -ideb|--install-debugger)
            verify_root_user
            should_install_debugger=true
            ;;
        -hdot|--has-dotnet)
            check_dotnet_install=true
            ;;
        -hdeb|--has-debugger)
            check_vsdbg_install=true
            ;;
        -l|--location)
            shift
            location="$1"
            ;;
        -v|--verbose)
            verbose=true
            ;;
        -?|--?|-h|--help|-[Hh]elp)
            script_name="$(basename "$0")"
            echo "VS Unit Testing Remote Environment prerequisites install script"
            echo "Usage: $script_name [-idot|-ideb|-hdot|-hdeb] [-l]"
            echo "       $script_name -h|-?|--help"
            echo ""
            echo "Options:"
            echo "  -idot,--install-dotnet             Installs the latest dotnet runtime to the location specified with -l or $default_install_dir if it doesn't already exist."
            echo "                                     This is required to discover or run tests. This requires admin privileges."
            echo "  -ideb,--install-debugger           Installs vsdbg bits to the location specified with -l or $default_install_dir if it doesn't already exist."
            echo "                                     This is required for remote debugging of unit tests. This requires admin privileges."
            echo "  -hdot,--has-dotnet                 Checks if dotnet is already installed."
            echo "  -hdeb,--has-debugger               Checks if vsdbg is already installed."
            echo "  -l,--location                      Location where a tool is to be installed or verified for install."
            echo "  -v,--verbose                       Display diagnostics information."
            exit 0
            ;;
        *)
            report_error "Unknown argument \`$name\`"
            exit 1
            ;;
    esac
    shift
done

# Set location


 # Verify if dotnet is installed
if [[ "$check_dotnet_install" == true ]]; then
    has_dotnet $location
    exit $#
fi

# Verify if vsdbg is installed here
if [[ "$check_vsdbg_install" == true ]]; then
    has_debugger $location
    exit $#
fi

if [[ "$should_install_dotnet" == true ]]; then
    install_dotnet $location
    exit $#
fi

if [[ "$should_install_debugger" == true ]]; then
   install_debugger $location
   exit $#
fi