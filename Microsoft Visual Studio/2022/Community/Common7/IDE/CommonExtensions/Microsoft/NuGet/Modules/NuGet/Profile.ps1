#
# PowerConsole profile
#

<#
.SYNOPSIS
    Clear the host content.
    
.DESCRIPTION
    This function replaces the standard Clear-Host and is aliased by "cls".
#>
function Clear-Host
{
    $host.PrivateData.ClearHost()
}

<#
.SYNOPSIS
    Simple path completion function for PowerConsole.
#>
function _TabExpansionPath($line)
{
    function UnquoteString($s) {
        if ($s.StartsWith('"') -or $s.StartsWith("'")) {
            $s = $s.Substring(1)
        }
        if ($s.EndsWith('"') -or $s.EndsWith("'")) {
            $s = $s.Substring(0, $s.Length - 1)
        }
        return $s
    }
    
    $e = $null
    $tokens = @([System.Management.Automation.PSParser]::Tokenize($line, [ref]$e))
    $lastToken = $tokens | Select-Object -Last 1
    
    $replaceStart = -1
    $lastWord = $null
    
    if ($lastToken -and ($lastToken.EndColumn -gt $line.Length)) {
        #Last token is terminated
                        
        if ($tokens.Length -gt 1) {
            $prevToken = $tokens[$tokens.Length - 2]
            if ($prevToken.EndColumn -eq $lastToken.StartColumn) {
                $replaceStart = $prevToken.StartColumn - 1
                $lastWord = (UnquoteString $prevToken.Content) + (UnquoteString $lastToken.Content)
            }
        }
                                
        if ($replaceStart -lt 0) {
            $replaceStart = $lastToken.StartColumn - 1
            $lastWord = UnquoteString $lastToken.Content
        }
    } else {
        #There is unrecognized/unterminated words
    
        if(!$lastToken) {
            $lastWord = $line
        } else {
            $lastWord = $line.Substring($lastToken.EndColumn - 1).TrimStart()
        }
        $replaceStart = $line.Length - $lastWord.Length
        $lastWord = UnquoteString $lastWord
    }

    # If previously unquoted, put back quote in results
    $unquoted = ($replaceStart -lt ($line.Length - $lastWord.Length))    
    $relative = !(($lastWord.IndexOf(':') -ge 0) -or $lastWord.StartsWith('/') -or $lastWord.StartsWith('\'))    

    $result = "" | select ReplaceStart, Paths
    $result.ReplaceStart = $replaceStart
    $result.Paths = @(Resolve-Path ${lastWord}* -ErrorAction SilentlyContinue -Relative:$relative | %{
    
        # Resolve-Path may return PathInfo or String (e.g. when passing different -Relative)
        $path = $_.ToString()
        
        if ($unquoted -or ($path.IndexOf(' ') -ge 0)) {
            "'$path'"
        } else {
            $path
        }
    })
    
    $result
}

<#
.SYNOPSIS
    Get an explicit interface on an object so that you can invoke the interface members.
    
.DESCRIPTION
    PowerShell object adapter does not provide explicit interface members. For COM objects
    it only makes IDispatch members available.
    
    This function helps access interface members on an object through reflection. A new
    object is returned with the interface members as ScriptProperties and ScriptMethods.
    
.EXAMPLE
    $dte2 = Get-Interface $dte ([EnvDTE80.DTE2])
#>
function Get-Interface
{
    Param(
        $Object,
        [type]$InterfaceType
    )
    
    [NuGetConsole.Host.PowerShell.Implementation.PSTypeWrapper]::GetInterface($Object, $InterfaceType)
}

<#
.SYNOPSIS
    Get a VS service.

.EXAMPLE
    Get-VSService ([Microsoft.VisualStudio.Shell.Interop.SVsShell]) ([Microsoft.VisualStudio.Shell.Interop.IVsShell])
#>
function Get-VSService
{
    Param(
        [type]$ServiceType,
        [type]$InterfaceType
    )

    $service = [Microsoft.VisualStudio.Shell.Package]::GetGlobalService($ServiceType)
    if ($service -and $InterfaceType) {
        $service = Get-Interface $service $InterfaceType
    }

    $service
}

<#
.SYNOPSIS
    Get VS IComponentModel service to access VS MEF hosting.
#>
function Get-VSComponentModel
{
    Get-VSService ([Microsoft.VisualStudio.ComponentModelHost.SComponentModel]) ([Microsoft.VisualStudio.ComponentModelHost.IComponentModel])
}

# Set initial directory
Set-Location "$env:USERPROFILE"

# For PowerShell v2, we need to create a reference to the default TabExpansion function
# so we can delegate back to it in our custom function. This isn't needed in PowerShell v3, 
# as omitting output in a custom TabExpansion function signals to TabExpansion2 that it 
# should use its own completion list.
if ((Test-Path Function:\DefaultTabExpansion) -eq $false -and (Test-Path Function:\TabExpansion)) {
    Rename-Item Function:\TabExpansion DefaultTabExpansion
}

function TabExpansion([string]$line, [string]$lastWord) {
       $nugetSuggestions = & (Get-Module NuGet) NuGetTabExpansion $line $lastWord
       
       if ($nugetSuggestions.NoResult) {
              # We only want to delegate back to the default tab completion in PowerShell v2.
              # PowerShell v3's TabExpansion2 will use its own command completion list if the
              # custom TabExpansion doesn't return anything.
              if (Test-Path Function:\DefaultTabExpansion) {
                     $line = $line.ToUpperInvariant()
                     $lastWord = $lastWord.ToUpperInvariant()
                     return DefaultTabExpansion $line $lastWord
              }
       }
       else {
              return $nugetSuggestions
       }
}

# default prompt
function prompt {
    "PM>"
}

# SIG # Begin signature block
# MIIoUgYJKoZIhvcNAQcCoIIoQzCCKD8CAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCARzTlS/QQtfl27
# Gi/PIpVaGHwa/jmFZ4p61M4kNqYLaqCCDYUwggYDMIID66ADAgECAhMzAAAEA73V
# lV0POxitAAAAAAQDMA0GCSqGSIb3DQEBCwUAMH4xCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNpZ25p
# bmcgUENBIDIwMTEwHhcNMjQwOTEyMjAxMTEzWhcNMjUwOTExMjAxMTEzWjB0MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMR4wHAYDVQQDExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
# AQCfdGddwIOnbRYUyg03O3iz19XXZPmuhEmW/5uyEN+8mgxl+HJGeLGBR8YButGV
# LVK38RxcVcPYyFGQXcKcxgih4w4y4zJi3GvawLYHlsNExQwz+v0jgY/aejBS2EJY
# oUhLVE+UzRihV8ooxoftsmKLb2xb7BoFS6UAo3Zz4afnOdqI7FGoi7g4vx/0MIdi
# kwTn5N56TdIv3mwfkZCFmrsKpN0zR8HD8WYsvH3xKkG7u/xdqmhPPqMmnI2jOFw/
# /n2aL8W7i1Pasja8PnRXH/QaVH0M1nanL+LI9TsMb/enWfXOW65Gne5cqMN9Uofv
# ENtdwwEmJ3bZrcI9u4LZAkujAgMBAAGjggGCMIIBfjAfBgNVHSUEGDAWBgorBgEE
# AYI3TAgBBggrBgEFBQcDAzAdBgNVHQ4EFgQU6m4qAkpz4641iK2irF8eWsSBcBkw
# VAYDVR0RBE0wS6RJMEcxLTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJh
# dGlvbnMgTGltaXRlZDEWMBQGA1UEBRMNMjMwMDEyKzUwMjkyNjAfBgNVHSMEGDAW
# gBRIbmTlUAXTgqoXNzcitW2oynUClTBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8v
# d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNDb2RTaWdQQ0EyMDExXzIw
# MTEtMDctMDguY3JsMGEGCCsGAQUFBwEBBFUwUzBRBggrBgEFBQcwAoZFaHR0cDov
# L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jZXJ0cy9NaWNDb2RTaWdQQ0EyMDEx
# XzIwMTEtMDctMDguY3J0MAwGA1UdEwEB/wQCMAAwDQYJKoZIhvcNAQELBQADggIB
# AFFo/6E4LX51IqFuoKvUsi80QytGI5ASQ9zsPpBa0z78hutiJd6w154JkcIx/f7r
# EBK4NhD4DIFNfRiVdI7EacEs7OAS6QHF7Nt+eFRNOTtgHb9PExRy4EI/jnMwzQJV
# NokTxu2WgHr/fBsWs6G9AcIgvHjWNN3qRSrhsgEdqHc0bRDUf8UILAdEZOMBvKLC
# rmf+kJPEvPldgK7hFO/L9kmcVe67BnKejDKO73Sa56AJOhM7CkeATrJFxO9GLXos
# oKvrwBvynxAg18W+pagTAkJefzneuWSmniTurPCUE2JnvW7DalvONDOtG01sIVAB
# +ahO2wcUPa2Zm9AiDVBWTMz9XUoKMcvngi2oqbsDLhbK+pYrRUgRpNt0y1sxZsXO
# raGRF8lM2cWvtEkV5UL+TQM1ppv5unDHkW8JS+QnfPbB8dZVRyRmMQ4aY/tx5x5+
# sX6semJ//FbiclSMxSI+zINu1jYerdUwuCi+P6p7SmQmClhDM+6Q+btE2FtpsU0W
# +r6RdYFf/P+nK6j2otl9Nvr3tWLu+WXmz8MGM+18ynJ+lYbSmFWcAj7SYziAfT0s
# IwlQRFkyC71tsIZUhBHtxPliGUu362lIO0Lpe0DOrg8lspnEWOkHnCT5JEnWCbzu
# iVt8RX1IV07uIveNZuOBWLVCzWJjEGa+HhaEtavjy6i7MIIHejCCBWKgAwIBAgIK
# YQ6Q0gAAAAAAAzANBgkqhkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMxEzARBgNV
# BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
# c29mdCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2VydGlm
# aWNhdGUgQXV0aG9yaXR5IDIwMTEwHhcNMTEwNzA4MjA1OTA5WhcNMjYwNzA4MjEw
# OTA5WjB+MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
# BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYD
# VQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExMIICIjANBgkqhkiG
# 9w0BAQEFAAOCAg8AMIICCgKCAgEAq/D6chAcLq3YbqqCEE00uvK2WCGfQhsqa+la
# UKq4BjgaBEm6f8MMHt03a8YS2AvwOMKZBrDIOdUBFDFC04kNeWSHfpRgJGyvnkmc
# 6Whe0t+bU7IKLMOv2akrrnoJr9eWWcpgGgXpZnboMlImEi/nqwhQz7NEt13YxC4D
# dato88tt8zpcoRb0RrrgOGSsbmQ1eKagYw8t00CT+OPeBw3VXHmlSSnnDb6gE3e+
# lD3v++MrWhAfTVYoonpy4BI6t0le2O3tQ5GD2Xuye4Yb2T6xjF3oiU+EGvKhL1nk
# kDstrjNYxbc+/jLTswM9sbKvkjh+0p2ALPVOVpEhNSXDOW5kf1O6nA+tGSOEy/S6
# A4aN91/w0FK/jJSHvMAhdCVfGCi2zCcoOCWYOUo2z3yxkq4cI6epZuxhH2rhKEmd
# X4jiJV3TIUs+UsS1Vz8kA/DRelsv1SPjcF0PUUZ3s/gA4bysAoJf28AVs70b1FVL
# 5zmhD+kjSbwYuER8ReTBw3J64HLnJN+/RpnF78IcV9uDjexNSTCnq47f7Fufr/zd
# sGbiwZeBe+3W7UvnSSmnEyimp31ngOaKYnhfsi+E11ecXL93KCjx7W3DKI8sj0A3
# T8HhhUSJxAlMxdSlQy90lfdu+HggWCwTXWCVmj5PM4TasIgX3p5O9JawvEagbJjS
# 4NaIjAsCAwEAAaOCAe0wggHpMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQWBBRI
# bmTlUAXTgqoXNzcitW2oynUClTAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTAL
# BgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBRyLToCMZBD
# uRQFTuHqp8cx0SOJNDBaBgNVHR8EUzBRME+gTaBLhklodHRwOi8vY3JsLm1pY3Jv
# c29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFf
# MDNfMjIuY3JsMF4GCCsGAQUFBwEBBFIwUDBOBggrBgEFBQcwAoZCaHR0cDovL3d3
# dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFf
# MDNfMjIuY3J0MIGfBgNVHSAEgZcwgZQwgZEGCSsGAQQBgjcuAzCBgzA/BggrBgEF
# BQcCARYzaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9kb2NzL3ByaW1h
# cnljcHMuaHRtMEAGCCsGAQUFBwICMDQeMiAdAEwAZQBnAGEAbABfAHAAbwBsAGkA
# YwB5AF8AcwB0AGEAdABlAG0AZQBuAHQALiAdMA0GCSqGSIb3DQEBCwUAA4ICAQBn
# 8oalmOBUeRou09h0ZyKbC5YR4WOSmUKWfdJ5DJDBZV8uLD74w3LRbYP+vj/oCso7
# v0epo/Np22O/IjWll11lhJB9i0ZQVdgMknzSGksc8zxCi1LQsP1r4z4HLimb5j0b
# pdS1HXeUOeLpZMlEPXh6I/MTfaaQdION9MsmAkYqwooQu6SpBQyb7Wj6aC6VoCo/
# KmtYSWMfCWluWpiW5IP0wI/zRive/DvQvTXvbiWu5a8n7dDd8w6vmSiXmE0OPQvy
# CInWH8MyGOLwxS3OW560STkKxgrCxq2u5bLZ2xWIUUVYODJxJxp/sfQn+N4sOiBp
# mLJZiWhub6e3dMNABQamASooPoI/E01mC8CzTfXhj38cbxV9Rad25UAqZaPDXVJi
# hsMdYzaXht/a8/jyFqGaJ+HNpZfQ7l1jQeNbB5yHPgZ3BtEGsXUfFL5hYbXw3MYb
# BL7fQccOKO7eZS/sl/ahXJbYANahRr1Z85elCUtIEJmAH9AAKcWxm6U/RXceNcbS
# oqKfenoi+kiVH6v7RyOA9Z74v2u3S5fi63V4GuzqN5l5GEv/1rMjaHXmr/r8i+sL
# gOppO6/8MO0ETI7f33VtY5E90Z1WTk+/gFcioXgRMiF670EKsT/7qMykXcGhiJtX
# cVZOSEXAQsmbdlsKgEhr/Xmfwb1tbWrJUnMTDXpQzTGCGiMwghofAgEBMIGVMH4x
# CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
# b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01p
# Y3Jvc29mdCBDb2RlIFNpZ25pbmcgUENBIDIwMTECEzMAAAQDvdWVXQ87GK0AAAAA
# BAMwDQYJYIZIAWUDBAIBBQCgga4wGQYJKoZIhvcNAQkDMQwGCisGAQQBgjcCAQQw
# HAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwLwYJKoZIhvcNAQkEMSIEIIfZ
# fxr49tE5KPcC5C+/J9D7oTA/FMWgstbX4pcMJPEBMEIGCisGAQQBgjcCAQwxNDAy
# oBSAEgBNAGkAYwByAG8AcwBvAGYAdKEagBhodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
# b20wDQYJKoZIhvcNAQEBBQAEggEAH2nHi8GhJQnMbZqdzTuO06WUdAs5d0D5TrTn
# uRo0svz+dua+EM630s9bPmOgZy7hqsGb1bMt5CBx4K5Norr1lB88HTvcq2afBO6D
# XR10ONHeh72Dl3rPste8bXq+sbmn60AxcO8bD2Yx3yzZM5s6tckGx/0UfE1MkIJN
# 9KNMAjRUyQSGcqbTd5FdsiiMSkhEI4L38Y7S+o5BAbg2o0xq0ypJFxS5NI14jbf4
# 9HRdCxlLGqHXjRf7U8Y4KuCEBnvmm5Zx4yD/mcTEp0NRg8EN6g017kpC/rr4ugoX
# MpWWtiaR/FX/BvHvDUCpQbP8zXFCopQkEyP64uf7UzXmchqjzKGCF60wghepBgor
# BgEEAYI3AwMBMYIXmTCCF5UGCSqGSIb3DQEHAqCCF4YwgheCAgEDMQ8wDQYJYIZI
# AWUDBAIBBQAwggFaBgsqhkiG9w0BCRABBKCCAUkEggFFMIIBQQIBAQYKKwYBBAGE
# WQoDATAxMA0GCWCGSAFlAwQCAQUABCD/W7/xfm9CvfLkkmtzmKCxZ5TOMoWR50Gc
# xDLC3loI1gIGZ5rOH+XBGBMyMDI1MDIxNDA0NDExMi45MzVaMASAAgH0oIHZpIHW
# MIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
# UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
# EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNVBAsT
# Hm5TaGllbGQgVFNTIEVTTjo1NzFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
# b2Z0IFRpbWUtU3RhbXAgU2VydmljZaCCEfswggcoMIIFEKADAgECAhMzAAAB+8vL
# bDdn5TCVAAEAAAH7MA0GCSqGSIb3DQEBCwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
# IFBDQSAyMDEwMB4XDTI0MDcyNTE4MzExM1oXDTI1MTAyMjE4MzExM1owgdMxCzAJ
# BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
# MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsTJE1pY3Jv
# c29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGltaXRlZDEnMCUGA1UECxMeblNoaWVs
# ZCBUU1MgRVNOOjU3MUEtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
# ZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA
# qMJWQeWAq4LwvSjYsjP0Uvhvm0j0aAOJiMLg0sLfxKoTXAdKD6oMuq5rF5oEiOxV
# +9ox0H95Q8fhoZq3x9lxguZyTOK4l2xtcgtJCtjXRllM2bTpjOg35RUrBy0cAloB
# U9GJBs7LBNrcbH6rBiOvqDQNicPRZwq16xyjMidU1J1AJuat9yLn7taifoD58blY
# EcBvkj5dH1la9zU846QDeOoRO6NcqHLsDx8/zVKZxP30mW6Y7RMsqtB8cGCgGwVV
# urOnaNLXs31qTRTyVHX8ppOdoSihCXeqebgJCRzG8zG/e/k0oaBjFFGl+8uFELwC
# yh4wK9Z5+azTzfa2GD4p6ihtskXs3lnW05UKfDJhAADt6viOc0Rk/c8zOiqzh0lK
# pf/eWUY2o/hvcDPZNgLaHvyfDqb8AWaKvO36iRZSXqhSw8SxJo0TCpsbCjmtx0Lp
# Hnqbb1UF7cq09kCcfWTDPcN12pbYLqck0bIIfPKbc7HnrkNQks/mSbVZTnDyT3O8
# zF9q4DCfWesSr1akycDduGxCdKBvgtJh1YxDq1skTweYx5iAWXnB7KMyls3WQZbT
# ubTCLLt8Xn8t+slcKm5DkvobubmHSriuTA3wTyIy4FxamTKm0VDu9mWds8MtjUSJ
# VwNVVlBXaQ3ZMcVjijyVoUNVuBY9McwYcIQK62wQ20ECAwEAAaOCAUkwggFFMB0G
# A1UdDgQWBBRHVSGYUNQ3RwOl71zIAuUjIKg1KjAfBgNVHSMEGDAWgBSfpxVdAF5i
# XYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
# c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
# JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRw
# Oi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRp
# bWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1Ud
# JQEB/wQMMAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsF
# AAOCAgEAwzoIKOY2dnUjfWuMiGoz/ovoc1e86VwWaZNFdgRmOoQuRe4nLdtZONtT
# HNk3Sj3nkyBszzxSbZEQ0DduyKHHI5P8V87jFttGnlR0wPP22FAebbvAbutkMMVQ
# MFzhVBWiWD0VAnu9x0fjifLKDAVXLwoun5rCFqwbasXFc7H/0DPiC+DBn3tUxefv
# cxUCys4+DC3s8CYp7WWXpZ8Wb/vdBhDliHmB7pWcmsB83uc4/P2GmAI3HMkOEu7f
# CaSYoQhouWOr07l/KM4TndylIirm8f2WwXQcFEzmUvISM6ludUwGlVNfTTJUq2bT
# DEd3tlDKtV9AUY3rrnFwHTwJryLtT4IFhvgBfND3mL1eeSakKf7xTII4Jyt15SXh
# Hd5oI/XGjSgykgJrWA57rGnAC7ru3/ZbFNCMK/Jj6X8X4L6mBOYa2NGKwH4A37YG
# DrecJ/qXXWUYvfLYqHGf8ThYl12Yg1rwSKpWLolA/B1eqBw4TRcvVY0IvNNi5sm+
# //HJ9Aw6NJuR/uDR7X7vDXicpXMlRNgFMyADb8AFIvQPdHqcRpRorY+YUGlvzeJx
# /2gNYyezAokbrFhACsJ2BfyeLyCEo6AuwEHn511PKE8dK4JvlmLSoHj7VFR3NHDk
# 3zRkx0ExkmF8aOdpvoKhuwBCxoZ/JhbzSzrvZ74GVjKKIyt5FA0wggdxMIIFWaAD
# AgECAhMzAAAAFcXna54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUAMIGIMQswCQYD
# VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
# MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3Nv
# ZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAeFw0yMTA5MzAxODIy
# MjVaFw0zMDA5MzAxODMyMjVaMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
# aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
# cG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEw
# MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5OGmTOe0ciELeaLL1yR5
# vQ7VgtP97pwHB9KpbE51yMo1V/YBf2xK4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64
# NmeFRiMMtY0Tz3cywBAY6GB9alKDRLemjkZrBxTzxXb1hlDcwUTIcVxRMTegCjhu
# je3XD9gmU3w5YQJ6xKr9cmmvHaus9ja+NSZk2pg7uhp7M62AW36MEBydUv626GIl
# 3GoPz130/o5Tz9bshVZN7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHINSi947SHJMPg
# yY9+tVSP3PoFVZhtaDuaRr3tpK56KTesy+uDRedGbsoy1cCGMFxPLOJiss254o2I
# 5JasAUq7vnGpF1tnYN74kpEeHT39IM9zfUGaRnXNxF803RKJ1v2lIH1+/NmeRd+2
# ci/bfV+AutuqfjbsNkz2K26oElHovwUDo9Fzpk03dJQcNIIP8BDyt0cY7afomXw/
# TNuvXsLz1dhzPUNOwTM5TI4CvEJoLhDqhFFG4tG9ahhaYQFzymeiXtcodgLiMxhy
# 16cg8ML6EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5UPkLiWHzNgY1GIRH29wb0f2y
# 1BzFa/ZcUlFdEtsluq9QBXpsxREdcu+N+VLEhReTwDwV2xo3xwgVGD94q0W29R6H
# XtqPnhZyacaue7e3PmriLq0CAwEAAaOCAd0wggHZMBIGCSsGAQQBgjcVAQQFAgMB
# AAEwIwYJKwYBBAGCNxUCBBYEFCqnUv5kxJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQW
# BBSfpxVdAF5iXYP05dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEGDCsGAQQBgjdMg30B
# ATBBMD8GCCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
# L0RvY3MvUmVwb3NpdG9yeS5odG0wEwYDVR0lBAwwCgYIKwYBBQUHAwgwGQYJKwYB
# BAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMB
# Af8wHwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8wTTBL
# oEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMv
# TWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggr
# BgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNS
# b29DZXJBdXRfMjAxMC0wNi0yMy5jcnQwDQYJKoZIhvcNAQELBQADggIBAJ1Vffwq
# reEsH2cBMSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1OdfCcTY/2mRsfNB1OW27
# DzHkwo/7bNGhlBgi7ulmZzpTTd2YurYeeNg2LpypglYAA7AFvonoaeC6Ce5732pv
# vinLbtg/SHUB2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l9qRWqveVtihVJ9Ak
# vUCgvxm2EhIRXT0n4ECWOKz3+SmJw7wXsFSFQrP8DJ6LGYnn8AtqgcKBGUIZUnWK
# NsIdw2FzLixre24/LAl4FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7hvoyGtmW9I/2
# kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY3UA8x1RtnWN0SCyxTkctwRQEcb9k+SS+
# c23Kjgm9swFXSVRk2XPXfx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFUa2pFEUep
# 8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz/gq77EFmPWn9y8FBSX5+k77L+Dvk
# txW/tM4+pTFRhLy/AsGConsXHRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1Zyvg
# DbjmjJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328y+l7vzhwRNGQ8cirOoo6CGJ/
# 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDVjCCAj4CAQEwggEBoYHZpIHW
# MIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
# UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
# EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNVBAsT
# Hm5TaGllbGQgVFNTIEVTTjo1NzFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
# b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsOAwIaAxUABHHn7NCGusZz
# 2RfVbyuwYwPykBWggYMwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
# aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
# cnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAx
# MDANBgkqhkiG9w0BAQsFAAIFAOtZEeAwIhgPMjAyNTAyMTQwMDUwNDBaGA8yMDI1
# MDIxNTAwNTA0MFowdDA6BgorBgEEAYRZCgQBMSwwKjAKAgUA61kR4AIBADAHAgEA
# AgIDvzAHAgEAAgIR+zAKAgUA61pjYAIBADA2BgorBgEEAYRZCgQCMSgwJjAMBgor
# BgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3DQEBCwUA
# A4IBAQDkxEht+2vX6tIJhPHYIZ1FvZ87MUaN8+VML9uk61d43CNR0MBeAITKW+eS
# xSxdexoWVL4xzdebFQwhgJDg87RlpHppHANNK+IdDZ8IwC5/7TUv3LZCswBDvUDT
# i7jKTdZQ9Llbpb8JIEWT6IIrFbqmn1tWCggLBk5uYeA9REmdTUoQ2gIB8dv28osZ
# AAbtLrWhyTdool6AjOpeeFUaPuHrNMrMydHHs4aiHUNbipZsnvUX2/YTx1tRFpyA
# DqEMQW+mNxs4T1FbWK6UrdQ+tqd8mIsuJWWCKHBUPZ92g0f8GyPuHS5APMSjIFcO
# 0z909REpYZ8LqM6IP9ZdfGJJxh9XMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMC
# VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
# BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRp
# bWUtU3RhbXAgUENBIDIwMTACEzMAAAH7y8tsN2flMJUAAQAAAfswDQYJYIZIAWUD
# BAIBBQCgggFKMBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkqhkiG9w0B
# CQQxIgQgYc3u3OijW7FzBgL7cuoqH6NLf6aNeR0e6ST4Wfzx+/0wgfoGCyqGSIb3
# DQEJEAIvMYHqMIHnMIHkMIG9BCA52wKr/KCFlVNYiWsCLsB4qhjEYEP3xHqYqDu1
# SSTlGDCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
# MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
# b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB
# +8vLbDdn5TCVAAEAAAH7MCIEIM+ha1eZ6eB+bV7gz+aYJMs9rqNrniulepQ3Lly3
# kjcEMA0GCSqGSIb3DQEBCwUABIICAC+ZK7BLxpBT0iEIBJREzraPIUhrFt2uoL7f
# 1IX9HFB948fGQGHcLrGjFe1RY4j6sc6L2robCr7yk8YFjxJmYfxT+c2x/d3/WMb0
# pJNIS5YnNK2FyLr6fvaJTniIKy1qyA5kn3rlFiMzTsP3n8oC5ZkiihBB2Or6Tm56
# 5MkmMyi6E8VAcy48nXzy5BcvjZOKEz5NZyXPNZDac7afg3ydESfhR+fbRtmq9cY6
# 3xRVnOjX8c7QlnXcFluSJo0cRhK8HDG+dzRwSFqU4pVEniU9vLh/9T4pdLxbbL9d
# HBFe+x4dBzlQScp6bVXrcxQfTvY/XaI3TDK3YIPvFPwFoKQ2H7xjLTe0BZsHKLJu
# IWb84p42h18iiSdFaFpNhxuPN5mlw5s1h6TJ4L2U0padwg7OYWnLiL1KAH5hCdKg
# QL8ZBjyarj1V2cmBewISZY4DvLhxqncxTuOGrAS6RxRKasoTZWqhJDgpaOCy9X0O
# a7/LhJdqp3b4UIQ/ALQCDzxlG1EAEDJ1F4w873vMCiODWfjSXOHZmLz2yN7tXuUh
# eDXQJqIOxc2oDVXGpf0KGL7XfFCYe9BMhFTWnFSukFTbdi83AxkC7PTBbEtBZnzf
# ++ZQFHuGpkZ0tAPn2t0dz0DIFd8uLbmgl6owSauAjbHUqHN1F6Y7bO0hf2qLKU3b
# Y6kTVvT+
# SIG # End signature block
