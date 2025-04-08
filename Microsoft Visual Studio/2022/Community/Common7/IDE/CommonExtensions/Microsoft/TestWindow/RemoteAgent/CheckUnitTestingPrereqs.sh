#!/bin/sh
# Copyright (c) Microsoft Corporation.  All rights reserved.
# Script to determine whether prerequisites are installed on the environment.

# Update this whenever there is an update to this script.
VERSION=1.0

# Stop script on NZEC 
set -e
# Stop script if unbound variable found (use ${var:-} if intentional)
set -u

# standard output may be used as a return value in the functions
# we need a way to write text on the screen in the functions so that
# it won't interfere with the return value.
# Exposing stream 3 as a pipe to standard output of the script itself
exec 3>&1

# Setup some colors to use. These need to work in fairly limited shells, like the Ubuntu Docker container where there are only 8 colors.
# See if stdout is a terminal
if [ -t 1 ] && command -v tput > /dev/null; then
    # see if it supports colors
    ncolors=$(tput colors)
    if [ -n "$ncolors" ] && [ $ncolors -ge 8 ]; then
        normal="$(tput sgr0     || echo)"
        white="$(tput setaf 7   || echo)"
    fi
fi

readonly default_install_dir="$HOME/.unittestingprereqs"
# Exit Codes
readonly script_installed_dotnet_retcode=71

report_info() {
    # using stream 3 (defined in the beginning) to not interfere with stdout of functions
    # which may be used as return value
    printf "%b\n" "${white:-}: Information: $1${normal:-}" >&3
}

machine_has() {
    hash "$1" > /dev/null 2>&1
    return $?
}

has_dotnet() {
    local path=$1

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
    local path=$1
    # Check if we already installed vsdbg to the $HOME directory
    if [ -f "$path/vsdbg" ]; then
        report_info "Visual Studio debugger bits installed to $path"
        return 0
    fi
    
    report_info "Visual Studio debugger bits not installed"
    return 1
}

report_info "Check Unit Testing Prerequisites script"

## Global variables
check_dotnet_install=false
check_vsdbg_install=false
location=$default_install_dir
script_name=$(basename "$0")

while [ $# -gt 0 ]
do
    name="$1"
    case "$name" in
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
        -?|--?|-h|--help|-[Hh]elp)
            script_name="$(basename "$0")"
            echo "VS Unit Testing Remote Environment check prerequisites script"
            echo "Usage: $script_name [-hdot|-hdeb] [-l]"
            echo "       $script_name -h|-?|--help"
            echo ""
            echo "Options:"
            echo "  -hdot,--has-dotnet                 Checks if dotnet is already installed."
            echo "  -hdeb,--has-debugger               Checks if vsdbg is already installed."
            echo "  -l,--location                      Location where a tool is to be installed or verified for install."
            exit 0
            ;;
        *)
            report_error "Unknown argument \`$name\`"
            exit 1
            ;;
    esac
    shift
done

# Verify if dotnet is installed
if [ "$check_dotnet_install" = true ]; then
    has_dotnet $location
    exit $#
fi

# Verify if vsdbg is installed here
if [ "$check_vsdbg_install" = true ]; then
    has_debugger $location
    exit $#
fi