// Copyright (c) Microsoft Corporation. All rights reserved.

function OnPrep(selProj, selObj) 
{
    var L_WizardDialogTitle_Text = "��ӵ�Ԫ�����ļ�";
    return PrepCodeWizard(selProj, L_WizardDialogTitle_Text);
}

function OnFinish(selProj, selObj)
{
    var oCM;
    try
    {
        oCM = selProj.CodeModel;
        var L_TRANSACTION_Text = "��ӵ�Ԫ�����ļ�";
        oCM.StartTransaction(L_TRANSACTION_Text);
        var strTemplatePath = wizard.FindSymbol("TEMPLATES_PATH");
        var strProjectPath = wizard.FindSymbol("PROJECT_PATH");
        var strProjectName = wizard.FindSymbol("PROJECT_NAME");
        var strItemName = wizard.FindSymbol("ITEM_NAME");

        // don't allow adding the template if not dll project.
        if (!IsDllProject(selProj))
        {
            var L_NonDllProjectsNotAllowed_Text = "C++ ��Ԫ�����ļ�ֻ����ӵ� Dll ��Ŀ���͡�";
            wizard.ReportError(L_NonDllProjectsNotAllowed_Text);
            return VS_E_WIZCANCEL;
        } 

        var safeProjectName = CreateCPPName(CreateIdentifierSafeName(strProjectName));
        var safeItemName = strItemName;
        var itemNameParts = strItemName.split(".");
        if (itemNameParts.length > 0) 
        {
            safeItemName = itemNameParts[0];
        }
        var safeItemName = CreateCPPName(CreateIdentifierSafeName(safeItemName));
        wizard.AddSymbol("SAFE_PROJECT_NAME", safeProjectName);
        wizard.AddSymbol("SAFE_ITEM_NAME", safeItemName);

        if (!ValidateFileExtension(strItemName)) 
        {
            strItemName += ".cpp";
        }
        var strItemPath = wizard.FindSymbol("ITEM_PATH") + "\\" + strItemName;
        
        // check for project item existance
        if (IsFileInProject(selProj, strItemName)) 
        {
            var L_fileProjExists_Text = " �Ѵ����ڸ���Ŀ�С�";
            wizard.ReportError(strItemPath + L_fileProjExists_Text);
            return VS_E_WIZCANCEL;
        }

        // use the filesystem object to check for file existance
        var oFSO = new ActiveXObject("Scripting.FileSystemObject");
        if (oFSO.FileExists(strItemPath)) 
        {
            var L_fileDiskExists_Text = " �Ѵ����ڴ����ϡ�";
            wizard.ReportError(strItemPath + L_fileDiskExists_Text);
            return VS_E_WIZCANCEL;
        }

        wizard.RenderTemplate(strTemplatePath + "\\unittest.cpp", strItemName, false, true);
        selProj.ProjectItems.AddFromFile(strItemName);
        oCM.CommitTransaction();
    }
    catch(e)
    {
        if (oCM)
            oCM.AbortTransaction();

        if (e.description.length != 0)
            SetErrorInfo(e);
        return e.number;
    }
}

function ValidateFileExtension(strFileName) 
{
    return wizard.dte.VCLanguageManager.ValidateFileName(strFileName, vsCMValidateFileExtCppSource);
}

function IsFileInProject(oProj, strFileIn) 
{
    try 
    {
        var fileItems = oProj.Object.Files;
        var count = fileItems.count;
        for (var nPos = 0; nPos < count; nPos++) 
        {
            var fileItem = fileItems.Item(nPos + 1);
            var strFileName = fileItem.Name;
            if (strFileName.toLowerCase() == strFileIn.toLowerCase())
                return true;
        }
        return false;
    }
    catch (e)
    {
        throw e;
    }
}
// SIG // Begin signature block
// SIG // MIIoTwYJKoZIhvcNAQcCoIIoQDCCKDwCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // /pOTlqGqTi22MgoqYB+sTiaxotuOOVJYy8k3sxBt7eOg
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAABAO91ZVdDzsYrQAA
// SIG // AAAEAzANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExM1oX
// SIG // DTI1MDkxMTIwMTExM1owdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // n3RnXcCDp20WFMoNNzt4s9fV12T5roRJlv+bshDfvJoM
// SIG // ZfhyRnixgUfGAbrRlS1St/EcXFXD2MhRkF3CnMYIoeMO
// SIG // MuMyYtxr2sC2B5bDRMUMM/r9I4GP2nowUthCWKFIS1RP
// SIG // lM0YoVfKKMaH7bJii29sW+waBUulAKN2c+Gn5znaiOxR
// SIG // qIu4OL8f9DCHYpME5+Teek3SL95sH5GQhZq7CqTdM0fB
// SIG // w/FmLLx98SpBu7v8XapoTz6jJpyNozhcP/59mi/Fu4tT
// SIG // 2rI2vD50Vx/0GlR9DNZ2py/iyPU7DG/3p1n1zluuRp3u
// SIG // XKjDfVKH7xDbXcMBJid22a3CPbuC2QJLowIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFOpuKgJKc+OuNYitoqxfHlrE
// SIG // gXAZMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis1MDI5MjYwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBRaP+hOC1+dSKhbqCr1LIvNEMrRiOQ
// SIG // EkPc7D6QWtM+/IbrYiXesNeeCZHCMf3+6xASuDYQ+AyB
// SIG // TX0YlXSOxGnBLOzgEukBxezbfnhUTTk7YB2/TxMUcuBC
// SIG // P45zMM0CVTaJE8btloB6/3wbFrOhvQHCILx41jTd6kUq
// SIG // 4bIBHah3NG0Q1H/FCCwHRGTjAbyiwq5n/pCTxLz5XYCu
// SIG // 4RTvy/ZJnFXuuwZynowyju90muegCToTOwpHgE6yRcTv
// SIG // Ri16LKCr68Ab8p8QINfFvqWoEwJCXn853rlkpp4k7qzw
// SIG // lBNiZ71uw2pbzjQzrRtNbCFQAfmoTtsHFD2tmZvQIg1Q
// SIG // VkzM/V1KCjHL54ItqKm7Ay4WyvqWK0VIEaTbdMtbMWbF
// SIG // zq2hkRfJTNnFr7RJFeVC/k0DNaab+bpwx5FvCUvkJ3z2
// SIG // wfHWVUckZjEOGmP7cecefrF+rHpif/xW4nJUjMUiPsyD
// SIG // btY2Hq3VMLgovj+qe0pkJgpYQzPukPm7RNhbabFNFvq+
// SIG // kXWBX/z/pyuo9qLZfTb697Vi7vll5s/DBjPtfMpyfpWG
// SIG // 0phVnAI+0mM4gH09LCMJUERZMgu9bbCGVIQR7cT5YhlL
// SIG // t+tpSDtC6XtAzq4PJbKZxFjpB5wk+SRJ1gm87olbfEV9
// SIG // SFdO7iL3jWbjgVi1Qs1iYxBmvh4WhLWr48uouzCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghoiMIIaHgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCAriPpC41okvaBj
// SIG // KiSkUDAK+TJBClucptYx4RNBdB4y+TBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAIWreN0+2V5V3EzOETCXKs0o3YOQlOOK
// SIG // kPM42Opr4spv3aHX+Pwbes/F/7gbC4vaOhUZvQbXk4in
// SIG // hCWGVN4JLXClFqtC0QNGfsazv/22FXYAJMcKrlQmTQKt
// SIG // r/pqi3+0A4FVH14IbTZk9vNAXr+0h1z0OtczFls/JePG
// SIG // bBFJx2vxlC/mmKxq3BN0nexUwy1QURm2gwo/ZsxAOlJW
// SIG // Y90UlbMEQLBfINEIqZ7j1Hr1t2YvUzEgBHdfjge6a9rZ
// SIG // es7IOA3NXTPx2drlSkFxZigo07Cqz6n4lPmFNfKB1EKR
// SIG // 7YYrefS7RRDKyf66/aQiUZYbgCi4hZoBQUlCo2qk/UPQ
// SIG // ++ShghesMIIXqAYKKwYBBAGCNwMDATGCF5gwgheUBgkq
// SIG // hkiG9w0BBwKggheFMIIXgQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBWQYLKoZIhvcNAQkQAQSgggFIBIIBRDCCAUAC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // m0P4vt5GmBj1bT7p/B1dTUItGTtrVsUfKCP/KfRBZ0IC
// SIG // Bmdi0FtEgxgSMjAyNTAxMTYxODE0NDIuMDJaMASAAgH0
// SIG // oIHZpIHWMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYD
// SIG // VQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25z
// SIG // IExpbWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // Tjo0MDFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaCCEfswggcoMIIF
// SIG // EKADAgECAhMzAAAB/tCowns0IQsBAAEAAAH+MA0GCSqG
// SIG // SIb3DQEBCwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwMB4XDTI0MDcyNTE4MzExOFoXDTI1MTAyMjE4MzEx
// SIG // OFowgdMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsT
// SIG // JE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGlt
// SIG // aXRlZDEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjQw
// SIG // MUEtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG9w0B
// SIG // AQEFAAOCAg8AMIICCgKCAgEAvLwhFxWlqA43olsE4PCe
// SIG // gZ4mSfsH2YTSKEYv8Gn3362Bmaycdf5T3tQxpP3NWm62
// SIG // YHUieIQXw+0u4qlay4AN3IonI+47Npi9fo52xdAXMX0p
// SIG // Grc0eqW8RWN3bfzXPKv07O18i2HjDyLuywYyKA9FmWbe
// SIG // Pjahf9Mwd8QgygkPtwDrVQGLyOkyM3VTiHKqhGu9BCGV
// SIG // RdHW9lmPMrrUlPWiYV9LVCB5VYd+AEUtdfqAdqlzVxA5
// SIG // 3EgxSqhp6JbfEKnTdcfP6T8Mir0HrwTTtV2h2yDBtjXb
// SIG // QIaqycKOb633GfRkn216LODBg37P/xwhodXT81ZC2aHN
// SIG // 7exEDmmbiWssjGvFJkli2g6dt01eShOiGmhbonr0qXXc
// SIG // BeqNb6QoF8jX/uDVtY9pvL4j8aEWS49hKUH0mzsCucIr
// SIG // wUS+x8MuT0uf7VXCFNFbiCUNRTofxJ3B454eGJhL0fwU
// SIG // TRbgyCbpLgKMKDiCRub65DhaeDvUAAJT93KSCoeFCokl
// SIG // PavbgQyahGZDL/vWAVjX5b8Jzhly9gGCdK/qi6i+cxZ0
// SIG // S8x6B2yjPbZfdBVfH/NBp/1Ln7xbeOETAOn7OT9D3UGt
// SIG // 0q+KiWgY42HnLjyhl1bAu5HfgryAO3DCaIdV2tjvkJay
// SIG // 2qOnF7Dgj8a60KQT9QgfJfwXnr3ZKibYMjaUbCNIDnxz
// SIG // 2ykCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBRvznuJ9SU2
// SIG // g5l/5/b+5CBibbHF3TAfBgNVHSMEGDAWgBSfpxVdAF5i
// SIG // XYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQhk5o
// SIG // dHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2Ny
// SIG // bC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIw
// SIG // MjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwGCCsG
// SIG // AQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
// SIG // cGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUtU3Rh
// SIG // bXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMBAf8E
// SIG // AjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4GA1Ud
// SIG // DwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEAiT4N
// SIG // UvO2lw+0dDMtsBuxmX2o3lVQqnQkuITAGIGCgI+sl7Zq
// SIG // ZOTDd8LqxsH4GWCPTztc3tr8AgBvsYIzWjFwioCjCQOD
// SIG // q1oBMWNzEsKzckHxAzYo5Sze7OPkMA3DAxVq4SSR8y+T
// SIG // RC2GcOd0JReZ1lPlhlPl9XI+z8OgtOPmQnLLiP9qzpTH
// SIG // wFze+sbqSn8cekduMZdLyHJk3Niw3AnglU/WTzGsQAdc
// SIG // h9SVV4LHifUnmwTf0i07iKtTlNkq3bx1iyWg7N7jGZAB
// SIG // RWT2mX+YAVHlK27t9n+WtYbn6cOJNX6LsH8xPVBRYAIR
// SIG // VkWsMyEAdoP9dqfaZzwXGmjuVQ931NhzHjjG+Efw118D
// SIG // Xjk3Vq3qUI1re34zMMTRzZZEw82FupF3viXNR3DVOlS9
// SIG // JH4x5emfINa1uuSac6F4CeJCD1GakfS7D5ayNsaZ2e+s
// SIG // BUh62KVTlhEsQRHZRwCTxbix1Y4iJw+PDNLc0Hf19qX2
// SIG // XiX0u2SM9CWTTjsz9SvCjIKSxCZFCNv/zpKIlsHx7hQN
// SIG // QHSMbKh0/wwn86uiIALEjazUszE0+X6rcObDfU4h/O/0
// SIG // vmbF3BMR+45rAZMAETJsRDPxHJCo/5XGhWdg/LoJ5XWB
// SIG // rODL44YNrN7FRnHEAAr06sflqZ8eeV3FuDKdP5h19WUn
// SIG // GWwO1H/ZjUzOoVGiV3gwggdxMIIFWaADAgECAhMzAAAA
// SIG // FcXna54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUAMIGI
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNy
// SIG // b3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkg
// SIG // MjAxMDAeFw0yMTA5MzAxODIyMjVaFw0zMDA5MzAxODMy
// SIG // MjVaMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMT
// SIG // HU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMIIC
// SIG // IjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5OGm
// SIG // TOe0ciELeaLL1yR5vQ7VgtP97pwHB9KpbE51yMo1V/YB
// SIG // f2xK4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64NmeFRiMM
// SIG // tY0Tz3cywBAY6GB9alKDRLemjkZrBxTzxXb1hlDcwUTI
// SIG // cVxRMTegCjhuje3XD9gmU3w5YQJ6xKr9cmmvHaus9ja+
// SIG // NSZk2pg7uhp7M62AW36MEBydUv626GIl3GoPz130/o5T
// SIG // z9bshVZN7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHINSi9
// SIG // 47SHJMPgyY9+tVSP3PoFVZhtaDuaRr3tpK56KTesy+uD
// SIG // RedGbsoy1cCGMFxPLOJiss254o2I5JasAUq7vnGpF1tn
// SIG // YN74kpEeHT39IM9zfUGaRnXNxF803RKJ1v2lIH1+/Nme
// SIG // Rd+2ci/bfV+AutuqfjbsNkz2K26oElHovwUDo9Fzpk03
// SIG // dJQcNIIP8BDyt0cY7afomXw/TNuvXsLz1dhzPUNOwTM5
// SIG // TI4CvEJoLhDqhFFG4tG9ahhaYQFzymeiXtcodgLiMxhy
// SIG // 16cg8ML6EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5UPkL
// SIG // iWHzNgY1GIRH29wb0f2y1BzFa/ZcUlFdEtsluq9QBXps
// SIG // xREdcu+N+VLEhReTwDwV2xo3xwgVGD94q0W29R6HXtqP
// SIG // nhZyacaue7e3PmriLq0CAwEAAaOCAd0wggHZMBIGCSsG
// SIG // AQQBgjcVAQQFAgMBAAEwIwYJKwYBBAGCNxUCBBYEFCqn
// SIG // Uv5kxJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQWBBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEGDCsG
// SIG // AQQBgjdMg30BATBBMD8GCCsGAQUFBwIBFjNodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL0RvY3MvUmVw
// SIG // b3NpdG9yeS5odG0wEwYDVR0lBAwwCgYIKwYBBQUHAwgw
// SIG // GQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0P
// SIG // BAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgw
// SIG // FoAU1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8w
// SIG // TTBLoEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29t
// SIG // L3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0XzIw
// SIG // MTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggr
// SIG // BgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraS9jZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0y
// SIG // My5jcnQwDQYJKoZIhvcNAQELBQADggIBAJ1VffwqreEs
// SIG // H2cBMSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1OdfC
// SIG // cTY/2mRsfNB1OW27DzHkwo/7bNGhlBgi7ulmZzpTTd2Y
// SIG // urYeeNg2LpypglYAA7AFvonoaeC6Ce5732pvvinLbtg/
// SIG // SHUB2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l9qRW
// SIG // qveVtihVJ9AkvUCgvxm2EhIRXT0n4ECWOKz3+SmJw7wX
// SIG // sFSFQrP8DJ6LGYnn8AtqgcKBGUIZUnWKNsIdw2FzLixr
// SIG // e24/LAl4FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7hvoy
// SIG // GtmW9I/2kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY3UA8
// SIG // x1RtnWN0SCyxTkctwRQEcb9k+SS+c23Kjgm9swFXSVRk
// SIG // 2XPXfx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFUa2pF
// SIG // EUep8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz/gq7
// SIG // 7EFmPWn9y8FBSX5+k77L+DvktxW/tM4+pTFRhLy/AsGC
// SIG // onsXHRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1Zyvg
// SIG // DbjmjJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328y+l7
// SIG // vzhwRNGQ8cirOoo6CGJ/2XBjU02N7oJtpQUQwXEGahC0
// SIG // HVUzWLOhcGbyoYIDVjCCAj4CAQEwggEBoYHZpIHWMIHT
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // JzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo0MDFBLTA1
// SIG // RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgU2VydmljZaIjCgEBMAcGBSsOAwIaAxUAhGNH
// SIG // D/a7Q0bQLWVG9JuGxgLRXseggYMwgYCkfjB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsF
// SIG // AAIFAOsziM0wIhgPMjAyNTAxMTYxMzMxNTdaGA8yMDI1
// SIG // MDExNzEzMzE1N1owdDA6BgorBgEEAYRZCgQBMSwwKjAK
// SIG // AgUA6zOIzQIBADAHAgEAAgIICDAHAgEAAgITJzAKAgUA
// SIG // 6zTaTQIBADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEE
// SIG // AYRZCgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0G
// SIG // CSqGSIb3DQEBCwUAA4IBAQBTgMr7NBXOa3FuPn3e7/08
// SIG // hI6R07Bf5sYFErGo9r4N1ji5PoEWhPchhoCN6JcXZ7Zs
// SIG // 5XfeMWvOb85kOLb0r/+zxsF7bBxYQpxAjySZSu4aX8wM
// SIG // jH14fA2pun8lJXTq4VIMtsVv5jCRhqi6VIqS1WvT0ynv
// SIG // 7iBlrtoiobPaVI7woEduFJSN82rl7KKYfpIb61XHMMxD
// SIG // CXFML6cdjiyIzRPDHrN0EodhtJgKfxrA8lG5+gvoaShG
// SIG // QgD06laUeq299Uixj4sH2vZuGLXJdd3WNv56cd/9TzmC
// SIG // ph9J3I6Z6Danvo0Nbsspn/b6r8q9/rt6qM+qJFeSCCXW
// SIG // +nB0HCdrfiKtMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgUENBIDIwMTACEzMAAAH+0KjCezQhCwEA
// SIG // AQAAAf4wDQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3
// SIG // DQEJAzENBgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQx
// SIG // IgQgPZnN6aEtNaITSB8MTPvlWCHiGbkQjndpfCUZPQJV
// SIG // KTUwgfoGCyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCAR
// SIG // hczd/FPInxjR92m2hPWqc+vGOG1+/I0WtkCstyh0eTCB
// SIG // mDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpX
// SIG // YXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
// SIG // VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNV
// SIG // BAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEw
// SIG // AhMzAAAB/tCowns0IQsBAAEAAAH+MCIEIPdNr/NhGLVH
// SIG // tGSpGvDhuJdwiEqhsEg0ENzs7nTA37FfMA0GCSqGSIb3
// SIG // DQEBCwUABIICAKAbN0PK3S8+Rff7jrbSsBUfyTk8UNIE
// SIG // HoAQaubVWOpMV1m35QmgGyDmm2TSqXA/RVmu2HF1I6iC
// SIG // dFh4+YAc9M2q035MTf0Ijgv1GT8Cxh+9siaVTXQR3Q8G
// SIG // JpLOUHdyBvSfHKli2cYS0ovfPdtRbEzPbd/n7W7ws4QE
// SIG // xBNJ8FE2wd1O+iSQbrDj71U7D+VRhjTtF7lwR7RTacPa
// SIG // tl39422kSBQfaHdB6hN/6uuTfwDYRlxL1HsGnww1IfZd
// SIG // U/NIkR+a7lVFCpXNFbHBnButT+JoxjudDRJzEf0YczW/
// SIG // jvmZt/jADaKyduil9fr1xWhFdop2y48o3yBytvt6+xA4
// SIG // 3mMzWTCqTTHIsSiVs3WBZG3QnEaQoeQykbnQ3a3WBTNO
// SIG // e/ILflHOhtSoI6wAeqfQqsq3MiugM5Bogop4CPKqsT/d
// SIG // kswRkaJi2h6FhR8q8AxNwa5Bs9HpmIVL+UxpPEMZThRl
// SIG // lkBjVaueC0AnT19inJ+DsgR1u/0sda7E6t4Qbv6L/HN6
// SIG // CpslM5a6diT2gOELhOTXcTdR4c1MyeehOsIPWaMfbkPl
// SIG // jkzVJ22UQwIAiPIA8gYZISeLgruzPI7zV55TgmNZgdbf
// SIG // 33UsY0jzDibO23XO5cuXFh/os+uzgn84K8ucMjDL0Ipy
// SIG // N46jHQWcT4T736AF8TOJya8+y3sku52gW7ch
// SIG // End signature block
