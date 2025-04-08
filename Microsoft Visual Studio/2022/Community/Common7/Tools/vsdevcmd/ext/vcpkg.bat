if "%VSCMD_TEST%" NEQ "" goto :test
if "%VSCMD_ARG_CLEAN_ENV%" NEQ "" goto :clean_env

call "%VSINSTALLDIR%VC\vcpkg\vcpkg-init.cmd" >nul 2>&1
set PATH=%PATH%;%VSINSTALLDIR%VC\vcpkg

goto :end

:test

set __VSCMD_TEST_VCPKG_STATUS=pass

@REM ******************************************************************
@REM basic environment validation cases go here
@REM ******************************************************************

DOSKEY /MACROS | FINDSTR vcpkg > nul
if "%ERRORLEVEL%" NEQ "0" (
    @echo [ERROR:%~nx0] Unable to find vcpkg console macro.
    set __VSCMD_TEST_VCPKG_STATUS=fail
)

@REM return value other than 0 if tests failed.
if "%__VSCMD_TEST_VCPKG_STATUS%" NEQ "pass" (
    set __VSCMD_TEST_VCPKG_STATUS=
    exit /B 1
)

set __VSCMD_TEST_VCPKG_STATUS=
exit /B 0

:clean_env

set VCPKG_ROOT=
set VCPKG_EXITCODE=
DOSKEY vcpkg=

goto :end
:end

exit /B 0
