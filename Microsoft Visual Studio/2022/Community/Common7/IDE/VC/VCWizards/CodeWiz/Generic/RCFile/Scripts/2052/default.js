// Copyright (c) Microsoft Corporation. All rights reserved.

function OnPrep(selProj, selObj)
{
	var L_WizardDialogTitle_Text = "��Դ�ļ���";
	return PrepCodeWizard(selProj, L_WizardDialogTitle_Text);
}

function OnFinish(selProj, selObj)
{
	var oCM;
    try
    {
		oCM	= selProj.CodeModel;

		var strFileName = wizard.FindSymbol("ITEM_NAME");
		if (!ValidateFileExtension(strFileName))
		{
			wizard.ReportError();
			return VS_E_WIZARDBACKBUTTONPRESS;
		}

        var L_TRANSACTION_Text = "�����Դ�ļ�";
        oCM.StartTransaction(L_TRANSACTION_Text);
        var strTemplatePath = wizard.FindSymbol("TEMPLATES_PATH");
        var strProjectPath = wizard.FindSymbol("PROJECT_PATH");
        var strFileName = wizard.FindSymbol("ITEM_NAME");
        
        var strParamList = strFileName.split("\\");
        wizard.AddSymbol("FILE_ONLY_NAME", strParamList[strParamList.length - 1]);

        var strFile = strProjectPath + "\\" + "resource.h";
        var strTemplate = strTemplatePath + "\\" + "resource.h";
        var rcfile;

        var InfFile = CreateInfFile();
        var strTextStream = InfFile.OpenAsTextStream(1, -2);
        while (!strTextStream.AtEndOfStream)
        {
            strTpl = strTextStream.ReadLine();
            if (strTpl != "")
            {
                strName = strTpl;
                if(strName == "resource.h")
                {
                    var res_file_count = 1;
                    if (IsFileInProject(selProj, "resource.h"))
                    {
                        var res_file_name = "resource" + res_file_count + ".h";

                        while (IsFileInProject(selProj, res_file_name))
                        {
                            res_file_count++;
                            res_file_name = "resource" + res_file_count + ".h";
                        }
	                    strName = res_file_name;
                    }
                    wizard.AddSymbol("RESOURCE_INCLUDE", strName);
                }
                var strTarget = GetTargetName(strName);
                var strTemplate = strTemplatePath + "\\" + strTpl;
                var strFile = strTarget;


                wizard.RenderTemplate(strTemplate, strFile);

                var projfile = selProj.ProjectItems.AddFromFile(strFile);
                if( strName == "rcfile.rc" )
                {
                    rcfile = projfile;
                }
            
            }
        }
        
        if( rcfile )
        {
            var window = rcfile.Open(vsViewKindPrimary);
            if(window)
                window.visible = true;
        }

        strTextStream.Close();
        oCM.CommitTransaction();    
        InfFile.Delete();
    }
    catch(e)
    {
		if (oCM)
			oCM.AbortTransaction();

		if (e.description.length != 0)
			SetErrorInfo(e);
		return e.number
    }
}

function GetTargetName(strName)
{
	try
	{
		var strFileName = wizard.FindSymbol("ITEM_NAME");

		if(strName.substring(0,8) == "resource")
		{
			// The resource file needs to be in the same directory as the rc file, not the project path.
			strName = strFileName.substr(0, strFileName.lastIndexOf("\\") + 1) + strName;
			return strName;
		}
		else
		{
			return strFileName;
		}
	}
	catch(e)
	{
		throw e;
	}
}

function ValidateFileExtension(strFileName)
{
	if(!wizard.dte.VCLanguageManager.ValidateFileName(strFileName, vsCMValidateFileExtNone))
	{
		return false;
	}

	var rgstrSplitPathName = strFileName.split(".");
	if((rgstrSplitPathName.length != 1) && (rgstrSplitPathName[rgstrSplitPathName.length - 1] != "rc"))
	{
		var L_Err2_Text = "�ļ���չ�������� \".rc\"��";
		oErrObj = new Error(L_Err2_Text);
		SetErrorInfo(oErrObj);
		return false;
	}
	return true;
}

function IsFileInProject(oProj, strFileIn)
{
    try
    {
        var fileItems = oProj.Object.Files;
        var count = fileItems.count;
        for (var nPos = 0; nPos < count; nPos++)
        {
            var fileItem = fileItems.Item(nPos+1);
            var strFileName = fileItem.Name;
                if (strFileName.toLowerCase() == strFileIn.toLowerCase())
                return true;
        }
        return false;
    }
    catch(e)
    {   
		throw e;
    }
}

// SIG // Begin signature block
// SIG // MIIoNwYJKoZIhvcNAQcCoIIoKDCCKCQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // As+UAPpng9Q4oLAycZmB7QUmqBmcT/BCR1jy44Ugqpmg
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
// SIG // ghoKMIIaBgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCBmgPXiCZosbu9n
// SIG // zWxvPNP6taoR74CBM3XHgii7Ts8NzTBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAE8mqoJ7K06T1oqeITWmKQ3SNc+aHxiP
// SIG // dBcV0nihvhGMIPTdBiHQuL8qFletyGx1zbajFxN6Jwwz
// SIG // NImjvaO/jcnq0apghT+nb+2pS3SfitZT+sNh8+xWZCl7
// SIG // AtlpM4ZF9M6ydqB+HM98yDcxXv23QygmOiHtn9tGHcZ+
// SIG // HDoIAjpD5Nnc6EUEj5agCsUd1kBnvPQ4f2F1gW/7eOc+
// SIG // BMT2/2SDQ9lgqeGzeDz0Fc1qKsyyE6BQ1p88L0kOFT7R
// SIG // NnQ1tyFtI39Z0SQSKR1XEvKfyObRH1BWkrJBUeWGBY1m
// SIG // IPp2Yg4vprtJA3a2uVvkKHxumeBHLUDAXsKS7EMfMdUS
// SIG // jaOhgheUMIIXkAYKKwYBBAGCNwMDATGCF4Awghd8Bgkq
// SIG // hkiG9w0BBwKgghdtMIIXaQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // plVM1YFFExjBFcgN39rHZRZWW6iVA7E/0uFDgC3y/q4C
// SIG // Bmda6WeobhgTMjAyNTAxMTYxODE0NDguMDA1WjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOkRDMDAt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR6jCCByAwggUIoAMCAQIC
// SIG // EzMAAAHoULCAzytymU0AAQAAAegwDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTIyWhcNMjUwMzA1MTg0NTIyWjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOkRDMDAtMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEA4UF3RNFs1xu8M3gvUhnR+nlcHRpRemIKVO8HjhQZ
// SIG // KVvcrhJiUgxNQAwcf9A07kQWqZUg/AkdUKskJsUQw/wn
// SIG // bw8nmRQHGepdvp5TLLJmcgvEz7dRk1gFLdxl1FOoNBdL
// SIG // SKxTS4KHwozr5txtI+PNlbrSkuMGU+mzVZwVbAoa9gI5
// SIG // lWxgzf+kLPxKmpC+XMKRnpdbXu1Dtd3VMGj4zstFotam
// SIG // DZkfIu09Zbo9iXRXX2YTD8qsqvzQ52bjjUm4/BTOcSga
// SIG // Gq9dq2oAvP9Ql2i9TjFwcBmkaCU2LZLIvZ47quMA5HAM
// SIG // IrQmeQbUNjaj2dJS4kAeztdAZvc6R1p/cdfx5nQJ+JKD
// SIG // FilA8B+bHf8w7uL4vPOxVsZueJJFjb5PBXkO2WdEOYKh
// SIG // iluIOq3r1diHQMQaG1naK6sL86i+9FnbIA1Pz+XNC/L2
// SIG // CLJFCWXnQhhzNoRyLDUcsPRBaEqJQzPsgnnZM+ve/O7P
// SIG // JyKeeYnC3w6CsOYWpORujFhene9bXDc1ffr/UUCjGulM
// SIG // H8qrq3nXebKl1gl7/voXpOANeVsmyHOrn09IpWsymGbw
// SIG // 76GrMIIz9Eni1u5r5nMNBRC8xdf7lmlxJSxzlyJYnihd
// SIG // ov2M0OlOdCvXW4ZzGg3CUrBtIVy0U8vy0G7Dg9IcOxbi
// SIG // tJ5s6LUsf+X6PYO3ws6BY5N7QxMCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBT6OVvKPfNJDH0VUG2uk9+B8HpS2jAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAln3CZtq8F7T4u+JJujygJJ4v
// SIG // fgVqLavkLQxoHk+Rd66Oz7CFDSkZFMrbhqiPLYS9yXK2
// SIG // 9N8egzqaWCRAPqW+qNqj4xXXTtUy6r0l62JvjoAiy/u/
// SIG // txZkZn5EbvKx76a2m9DtfcA27pIDvCOTotUXoDCZfLeZ
// SIG // P1LRNFm98wJTh5woyxksz/w6N6bcIV6JJNNiLw+0mRAW
// SIG // z26Bm7cOCwh7E9qRWpKRjgYfiElDFwX/N+QrlTX3XcMZ
// SIG // shrzUs8hMhJOYdVYe7acD+8+6yfh7Ij+LHagY4+gL6Kb
// SIG // n+K8VAH6xG1emo/LcBbO1lRzYiIKxzZ2v+eZMqwBvWLd
// SIG // fQj75FMMWCtLmbz5dlgt/Z33NIzk44rwu7PyFKMxOLX8
// SIG // tyTZMkNXDbb2X7Yl94+Q7fniznrhg474Sb2DCBJKZFev
// SIG // FyzR+/mQX2Gvj5n0WGqBRRwiShKEUmdz2wyTwYhIWfcr
// SIG // sTHXaDDENfU5Mn7aLehM9F4UpsI2Aat/Q7wRVoZcgxgY
// SIG // a1NxrXg1olXfWBkgdlp8bhTMuX2wCuqPD1s/EETIqbVx
// SIG // ytxwwa9sFlhHK64HE7h2SCU6nqTaGJcfVURb4/7wl2gB
// SIG // XJpFtZ5O1RPqMGl6+USY68g6vbm5Mg6tZnaxf4HmkQC1
// SIG // 3DWW3zVyJIV81wOmvAompnEFvw4JiyaYlUDa4mWAhyAw
// SIG // ggdxMIIFWaADAgECAhMzAAAAFcXna54Cm0mZAAAAAAAV
// SIG // MA0GCSqGSIb3DQEBCwUAMIGIMQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQgUm9vdCBDZXJ0
// SIG // aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAeFw0yMTA5MzAx
// SIG // ODIyMjVaFw0zMDA5MzAxODMyMjVaMHwxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFBDQSAyMDEwMIICIjANBgkqhkiG9w0BAQEF
// SIG // AAOCAg8AMIICCgKCAgEA5OGmTOe0ciELeaLL1yR5vQ7V
// SIG // gtP97pwHB9KpbE51yMo1V/YBf2xK4OK9uT4XYDP/XE/H
// SIG // ZveVU3Fa4n5KWv64NmeFRiMMtY0Tz3cywBAY6GB9alKD
// SIG // RLemjkZrBxTzxXb1hlDcwUTIcVxRMTegCjhuje3XD9gm
// SIG // U3w5YQJ6xKr9cmmvHaus9ja+NSZk2pg7uhp7M62AW36M
// SIG // EBydUv626GIl3GoPz130/o5Tz9bshVZN7928jaTjkY+y
// SIG // OSxRnOlwaQ3KNi1wjjHINSi947SHJMPgyY9+tVSP3PoF
// SIG // VZhtaDuaRr3tpK56KTesy+uDRedGbsoy1cCGMFxPLOJi
// SIG // ss254o2I5JasAUq7vnGpF1tnYN74kpEeHT39IM9zfUGa
// SIG // RnXNxF803RKJ1v2lIH1+/NmeRd+2ci/bfV+Autuqfjbs
// SIG // Nkz2K26oElHovwUDo9Fzpk03dJQcNIIP8BDyt0cY7afo
// SIG // mXw/TNuvXsLz1dhzPUNOwTM5TI4CvEJoLhDqhFFG4tG9
// SIG // ahhaYQFzymeiXtcodgLiMxhy16cg8ML6EgrXY28MyTZk
// SIG // i1ugpoMhXV8wdJGUlNi5UPkLiWHzNgY1GIRH29wb0f2y
// SIG // 1BzFa/ZcUlFdEtsluq9QBXpsxREdcu+N+VLEhReTwDwV
// SIG // 2xo3xwgVGD94q0W29R6HXtqPnhZyacaue7e3PmriLq0C
// SIG // AwEAAaOCAd0wggHZMBIGCSsGAQQBgjcVAQQFAgMBAAEw
// SIG // IwYJKwYBBAGCNxUCBBYEFCqnUv5kxJq+gpE8RjUpzxD/
// SIG // LwTuMB0GA1UdDgQWBBSfpxVdAF5iXYP05dJlpxtTNRnp
// SIG // cjBcBgNVHSAEVTBTMFEGDCsGAQQBgjdMg30BATBBMD8G
// SIG // CCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL0RvY3MvUmVwb3NpdG9yeS5odG0wEwYD
// SIG // VR0lBAwwCgYIKwYBBQUHAwgwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9
// SIG // lJBb186aGMQwVgYDVR0fBE8wTTBLoEmgR4ZFaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoG
// SIG // CCsGAQUFBwEBBE4wTDBKBggrBgEFBQcwAoY+aHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNS
// SIG // b29DZXJBdXRfMjAxMC0wNi0yMy5jcnQwDQYJKoZIhvcN
// SIG // AQELBQADggIBAJ1VffwqreEsH2cBMSRb4Z5yS/ypb+pc
// SIG // FLY+TkdkeLEGk5c9MTO1OdfCcTY/2mRsfNB1OW27DzHk
// SIG // wo/7bNGhlBgi7ulmZzpTTd2YurYeeNg2LpypglYAA7AF
// SIG // vonoaeC6Ce5732pvvinLbtg/SHUB2RjebYIM9W0jVOR4
// SIG // U3UkV7ndn/OOPcbzaN9l9qRWqveVtihVJ9AkvUCgvxm2
// SIG // EhIRXT0n4ECWOKz3+SmJw7wXsFSFQrP8DJ6LGYnn8Atq
// SIG // gcKBGUIZUnWKNsIdw2FzLixre24/LAl4FOmRsqlb30mj
// SIG // dAy87JGA0j3mSj5mO0+7hvoyGtmW9I/2kQH2zsZ0/fZM
// SIG // cm8Qq3UwxTSwethQ/gpY3UA8x1RtnWN0SCyxTkctwRQE
// SIG // cb9k+SS+c23Kjgm9swFXSVRk2XPXfx5bRAGOWhmRaw2f
// SIG // pCjcZxkoJLo4S5pu+yFUa2pFEUep8beuyOiJXk+d0tBM
// SIG // drVXVAmxaQFEfnyhYWxz/gq77EFmPWn9y8FBSX5+k77L
// SIG // +DvktxW/tM4+pTFRhLy/AsGConsXHRWJjXD+57XQKBqJ
// SIG // C4822rpM+Zv/Cuk0+CQ1ZyvgDbjmjJnW4SLq8CdCPSWU
// SIG // 5nR0W2rRnj7tfqAxM328y+l7vzhwRNGQ8cirOoo6CGJ/
// SIG // 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDTTCC
// SIG // AjUCAQEwgfmhgdGkgc4wgcsxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVyaWNhIE9w
// SIG // ZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // TjpEQzAwLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUAjCRuL4NI7jDlZ9gbigAlLz/NBbqggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOsziiUwIhgPMjAyNTAxMTYxMzM3
// SIG // NDFaGA8yMDI1MDExNzEzMzc0MVowdDA6BgorBgEEAYRZ
// SIG // CgQBMSwwKjAKAgUA6zOKJQIBADAHAgEAAgIb6jAHAgEA
// SIG // AgITXjAKAgUA6zTbpQIBADA2BgorBgEEAYRZCgQCMSgw
// SIG // JjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIB
// SIG // AAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQBM6w30xxQG
// SIG // UpkmHmOeZ53H48N9CxMnDgeQ2FIbtKMBXabWcDHhBgko
// SIG // cmUqM60gwMd/PQQqbMyieZ5n+lqCW3/ZytZ8ssPjrfdf
// SIG // 77oVt+amIHexo3QuMUdHwwEix+CQtoRkzS4dDeCA8THg
// SIG // rUsXCQCphX49ZD/39ueOQdxl7QzFKuaQOeqETKxfnQEh
// SIG // 9OLshEyfYucp/kDon00TkwwR0cOL9d0vnXBqRHESU8Ox
// SIG // 4wnZkbaxwhuPX4DooM0WawFWeGbCWwLhed9U76FmpAo/
// SIG // Y75rN7nU1ZI52Y2w4lOnHnCuaAfCw5b7N3/HrW9eAlLj
// SIG // DPWrvRvZFSQ6EVdLZyChJTeZMYIEDTCCBAkCAQEwgZMw
// SIG // fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAHo
// SIG // ULCAzytymU0AAQAAAegwDQYJYIZIAWUDBAIBBQCgggFK
// SIG // MBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkq
// SIG // hkiG9w0BCQQxIgQgZ3P9Lozk8fNLpc//Vl1VPH102MkT
// SIG // H1pX/tVPx1xFPMowgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCAq0trE1QKEIIJB0efaTaooHtMXyU9id1PF
// SIG // tUnPB/jrHTCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAAB6FCwgM8rcplNAAEAAAHoMCIE
// SIG // IGOdIROlKKl4eOvsn5MCpZ561Wp+EIX7RNn8lLLaSYj+
// SIG // MA0GCSqGSIb3DQEBCwUABIICABTICgYmR8v19rR8/RWx
// SIG // JhCD9MIjz0fX9To8kgbdX3+XtPdWfUStDP8loy7KBHB2
// SIG // 6q/+v4zBPiu/Of2tbf6TJ0eal2jKlI5ZC6xodGmeN78R
// SIG // EAl4eWOSMOw4ajf5/QUNTNhcCn8Zx7Y8N1M67nEIL5KW
// SIG // KHTkZWfycOuZQFd8yt4syrsP4u2OLfY8u/W3d8sRgIlR
// SIG // 2i5mHfocKD3bT0uBqwvv3TObNB6HWxai4VRBvU96eKrR
// SIG // lW4b0ihGMTz/hpq8AktXv0kkl8/0+nzzNjNrPMCRfSwN
// SIG // w0ngUmBgsMfiKP96RPtbALjqM5Fuog7BIREy5PUsjpHj
// SIG // MKmf0IvINxlEvULXMUQTGDsWibHczBPQ2Tshp060Qzr8
// SIG // LtvON2qdbxFijkO4c8ubm0U7vKCn7/knvSfFoAqO1HAn
// SIG // 02m/hils3cpgHUd++zAjkDjxpi6x852Y1eeyskYhKd5W
// SIG // IU/TDhPx0d+cj0OR5Q3nEc1YmASY5I8rXUANQwcO+Pyk
// SIG // yHT/QngTe8XDEfGeBCBpj9OuqUVFtG1YEc3dvi3W2ZPl
// SIG // Auwmfwg5RtsnFms9T3KQ/tvNgKoNl4AIQT4HyZCrlCad
// SIG // Fimpx7j/ZUWpAkyk/DUf6B/lclX5f1y8fmtxMp91Yhnh
// SIG // c8Q6OlGLiWXirxRODjaYqbNYfQlDasqhQWe8yQ8kFOOm
// SIG // QIJa
// SIG // End signature block
