﻿
//
// remove all materials from selected object
//

function UndoableMaterialChange(child) {
    this._currentChild = child

    this.getName = function () {
        var IDS_MreUndoTriangulateRemoveMaterials = 154;
        return services.strings.getStringFromId(IDS_MreUndoTriangulateRemoveMaterials);
    }

    this.onDo = function () {

        this._oldMaterials = new Array();
        this._oldMaterialIndices = new Array();

        this._materialList = this._currentChild.behavior.materials;

        if (this._materialList != null && this._materialList.elementCount > 0) {
            // loop over all materials
            for (var j = 0; j < this._materialList.elementCount; j++) {

                var currentMaterial = this._materialList.getElement(j);
                this._oldMaterials.push(currentMaterial);
            }
            this._materialList.removeAll();

            var material = services.effects.createEffectInstance("Lambert");
            material.name = "Default - Lambert";

            var enableInPropWindow = 0x8;

            // set up the color traits
            var diffuseColorTrait = material.getOrCreateTrait("MaterialDiffuse", "float4", enableInPropWindow);
            diffuseColorTrait.value = [1, 1, 1, 1];

            var ambientColorTrait = material.getOrCreateTrait("MaterialAmbient", "float4", enableInPropWindow);
            ambientColorTrait.value = [1, 1, 1, 1]

            this._materialList.append(material);
        }

        // if the current child is a mesh get it's geometry and reset the polygon material indices
        if (this._currentChild.typeId == "Microsoft.VisualStudio.3D.Mesh") {
            var geom = this._currentChild.getTrait("Geometry").value;

            for (var k = 0; k < geom.polygonCount; k++) {
                var currentMaterialIndex = geom.getPolygonMaterialIndex(k);
                this._oldMaterialIndices.push(currentMaterialIndex);
                this._materialIndex = geom.setPolygonMaterialIndex(k, 0);
            }

            this._currentChild.behavior.recomputeCachedGeometry();
        }
    }

    this.onUndo = function () {

        this._materialList = this._currentChild.behavior.materials;
        this._materialList.removeAll();

        if (this._materialList != null && this._oldMaterials.length > 0) {
            // restore the materials
            for (var j = 0; j < this._oldMaterials.length; j++) {
                var prevMaterial = this._oldMaterials[j];
                this._materialList.append(prevMaterial);
            }
        }

        // restore the indices
        if (this._currentChild.typeId == "Microsoft.VisualStudio.3D.Mesh") {
            var geom = this._currentChild.getTrait("Geometry").value;
            for (var k = 0; k < this._oldMaterialIndices.length; k++) {
                var previousIndex = this._oldMaterialIndices[k];
                this._materialIndex = geom.setPolygonMaterialIndex(k, previousIndex);
            }

            this._currentChild.behavior.recomputeCachedGeometry();
        }
    }
}

function UndoableMultipleMaterialChange(targets) {
    this.getName = function () {
        var IDS_MreUndoTriangulateRemoveMaterials = 154;
        return services.strings.getStringFromId(IDS_MreUndoTriangulateRemoveMaterials);
    }
    this._undoableActions = [];
    this._counter = 0;
    this._targets = targets;

    for (var i = 0; i < this._targets.length; i++) {
        var element = this._targets[i];
        // loop over all children of selected element, looking
        // for children that have behaviors with valid list of materials
        for (var j = 0; j < element.childCount; j++) {
            // get child and its materials
            var child = element.getChild(j);
            this._undoableActions[this._counter] = new UndoableMaterialChange(child);
            this._counter++;
        }
    }

    this.onDo = function () {
        
        for (var i = 0; i < this._counter; i++) {
            this._undoableActions[i].onDo();
        }

        document.refreshPropertyWindow();
    }

    this.onUndo = function () {
        for (var i = 0; i < this._counter; i++) {
                this._undoableActions[i].onUndo();
            }

        document.refreshPropertyWindow();
    }
}

var targets = [];

// we might not have command args
try{
    if (commandArgs != null) {
        targets.push(commandArgs);
    }
}
catch (err) {}

var selectedElementCount = services.selection.count;
for (var i = 0; i < selectedElementCount; i++) {

    var selectedElement = services.selection.getElement(i);
    targets.push(selectedElement);
}

undoableItem = new UndoableMultipleMaterialChange(targets);
undoableItem.onDo();
services.undoService.addUndoableItem(undoableItem);

// SIG // Begin signature block
// SIG // MIIoOgYJKoZIhvcNAQcCoIIoKzCCKCcCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // qjwmlhUFvGFZ2675+8OeJm24rLJydeyd+09KhqKXCECg
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
// SIG // ghoNMIIaCQIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCDHMucd+LNYakxm
// SIG // YD9etnVrjvZnA518+4CDVHJ492G9DTBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAA9bi3yLy+65etRo7OABV7erqyI+B6Vm
// SIG // YThA/x535eoy6jUI5Pz6MBu0DiiCnYZt3qnG2NIP/eN0
// SIG // NgbIFgwJgSnj8RCWwD8vjCD/qx2URP32piZmHdGV0YD6
// SIG // /WiO+Vd/Pcc+ZfQ4ObKtebh6Fwxb5warNH2UVQDZJx3v
// SIG // bCcSt2iS649vUa+Zvbgv1odOIA+sUI50pFaJjjyxilVh
// SIG // COxmmNOxq4nKVqwWc55RcgVEgPn9hm+lcnGBk1VHrvnQ
// SIG // KmPzfQVHnB2TbiLqOLmsSxW9oYvra0Ys/wCuFBtc2dak
// SIG // roAaosAsaD/JX952RnhTRB5/WbTETd+WJ7cCrmAUbfam
// SIG // kcyhgheXMIIXkwYKKwYBBAGCNwMDATGCF4Mwghd/Bgkq
// SIG // hkiG9w0BBwKgghdwMIIXbAIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // bS/kMNJt0OgtP1d6lTV67lemGqyewH7U+JUbOjo06WwC
// SIG // BmdpkKm+WBgTMjAyNTAxMTYxODIxMTguOTU4WjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOkUwMDIt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR7TCCByAwggUIoAMCAQIC
// SIG // EzMAAAHuBdMCMLKanacAAQAAAe4wDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTQ0WhcNMjUwMzA1MTg0NTQ0WjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOkUwMDItMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEAvvG8pdeihImvMSkuL1S+0RDjkey82Ai1xLVoHqsj
// SIG // lZa87hM/gKAmuLQRhEo2x01xAnjDsD/Uz3imimpX01OV
// SIG // 0ho6SYaRsefX8TCaE2Fj88w9DtkQJcgZjgQZoiw10Q0C
// SIG // S9UbbgI7woi7pVUHojyPFe/h4U0d/dU2wtW3kscF33Si
// SIG // amNaJ4w2sKgyQJrcLAP4Jql4B8BfX2VnMCkrl4mQU21O
// SIG // X3Jt24YZUTcOXdOC3deWVs1Zf1Q6f4kXqxqNiLP9FsJ/
// SIG // 2t3hjnR6738CG35OpVasGzUBNdTnnZ9rr0YylhMHq1y+
// SIG // 9Drg2fLy88a8tMhHb0PJMvlX6vJnxF0vdO2O6zfx2F+n
// SIG // ArAtrKMlxtzsArSwO6NP/pCiWbjqw+R1K0s95H6oA5Zl
// SIG // suu8/GWT45IgwtXWFtYze+7eYkpeVqdRygaeyVPEYkSP
// SIG // r2NotXG+V9kRJMN1qzVv426H1xLPbeG4HfslPLICp/TL
// SIG // VZ0OubOkBu9jP8mlGRthzCN9bZvZqKB9vbzwTvYwzDiL
// SIG // tC8M1E5CFn5YHf7xFn0zXD1hEI+37FrkqFbid7gasDZk
// SIG // UqZkA80nzGiM7srNKb1dYxVqrasMAnGmP1l7G/2sZMQf
// SIG // 8wk3R0gVCfE5t4uDzPbJIrp12PnEqh+fI1pKR22ywNzn
// SIG // 7LO3viWzIypk3XI5kpG+aDfKlNcCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBQQiM0/GtncIJ69+8Xftr9f3HamCDAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAd2cgL2thCjlklaQZ2JM1/H/B
// SIG // mY2jrOe+xfaNeAJ4fZSsurUt+MF6D1xMkKdb9YiO6yc2
// SIG // VRu66VM52stp/XLH596esu5GJB6rUroAhpk4ogZMIRX0
// SIG // gcijyNPDJJYLybyk2W+u98hn6RcD40MGXiOhD4/zgLaW
// SIG // JE+yFF6jJItQkTCSoHmOMFEQnHCLo3VkZKFb+Cd6v/Oy
// SIG // hNKj0JgEfX6jDcYyN2QpVcQOMIjN7TVZUWxfUoKTp41a
// SIG // Nz/yOafCXeNYTUlQsf/I96jO2i0irQ8zhFDbPmbY4c55
// SIG // mYFHe/wFhw4cAR3S+e0yPYe54mZHzmTl53GLCsRuIK8k
// SIG // 7IVOhurAGKW6nTBP/v4Nbnq+1RiB1LS6t1tAJ5vJQH0v
// SIG // T6rYbJGbeeCRdvAh3bBav+11QbRZcS/yoHEMpSTZ4mvm
// SIG // p4sVButMlA7dxTBkiSN+MRvTR7M9waaklrnhrSYUOWTd
// SIG // CvI7tLzVYBfg79ObIqz4NH7Uin/RVRAqfd6PKIBePI4f
// SIG // Ak/wd9pc9Q+k67pOBM3MOxNTobTjH+wx4DzFn+ljnWJ3
// SIG // /h2kice2U1wibFuaDpDNLC4rcQaUqRnI9mI5zc5wqbBD
// SIG // 2WrdIfune7pUWlkeURwFMhRUPY0WuylmjRnRC07Ppx0p
// SIG // WI2HkKSuUEl44oHSpS0DwZV/vczqBgCYaGX66Y6uJ0Aw
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
// SIG // 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDUDCC
// SIG // AjgCAQEwgfmhgdGkgc4wgcsxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVyaWNhIE9w
// SIG // ZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // TjpFMDAyLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUAiKOm1Tb35RcW1Fgg0N2GCsujvpOggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOszsaUwIhgPMjAyNTAxMTYxNjI2
// SIG // MTNaGA8yMDI1MDExNzE2MjYxM1owdzA9BgorBgEEAYRZ
// SIG // CgQBMS8wLTAKAgUA6zOxpQIBADAKAgEAAgID1wIB/zAH
// SIG // AgEAAgITbDAKAgUA6zUDJQIBADA2BgorBgEEAYRZCgQC
// SIG // MSgwJjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQow
// SIG // CAIBAAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQANZAhO
// SIG // yF1iPVhlmdWunU9QXVC88K5Rau99OliIdoSF/0B0z+9u
// SIG // 1NFGI5uRPnyTXFk2QSW9R7dQayb85ytFL/vITxhX1V5T
// SIG // vftMJVS68ytV0/biiGyHM66p1fjmq2GYvrBybqn/+7CH
// SIG // GzLUY2bi2jRI6A+oynwibyi2/8CuurLJ5cfhv+zEiklU
// SIG // a85bktK9u5dJzGohyx8waAq0IAeN0jAQq+c2YDNN5HMZ
// SIG // grFATxDDJ1EF5VuQc7AfpPcjFDjKwG1uvNBdA5ZHqbZj
// SIG // gRZbWurPi11XKF0eQJCRnXO9b7MWGeZlt+Zkej9mrfhY
// SIG // Zo7stB4jf3R3XwU49pk30LQEHtVYMYIEDTCCBAkCAQEw
// SIG // gZMwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMA
// SIG // AAHuBdMCMLKanacAAQAAAe4wDQYJYIZIAWUDBAIBBQCg
// SIG // ggFKMBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAv
// SIG // BgkqhkiG9w0BCQQxIgQgIsDAAISYQVmwLJLBAwsnDF9V
// SIG // wWeoMvKf9KlgUMYOBwcwgfoGCyqGSIb3DQEJEAIvMYHq
// SIG // MIHnMIHkMIG9BCBPUHcUlYX6vlXX/gz7PuRCJAc/aAkv
// SIG // zkH5R5FUYX4wITCBmDCBgKR+MHwxCzAJBgNVBAYTAlVT
// SIG // MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
// SIG // ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFBDQSAyMDEwAhMzAAAB7gXTAjCymp2nAAEAAAHu
// SIG // MCIEIKxi/y9A6EbwiU5Rva5oVPpFbXhlFWjLlZOAH3eb
// SIG // RmX2MA0GCSqGSIb3DQEBCwUABIICAC925qz/OIW1Ap9/
// SIG // dpj3BgZTNpxDwXK6HjGRfi7NvQP54plZV2iJt6TN6WGA
// SIG // qm4o67Io1fIfknXVlMkQ00RBCzGSabnGI5LvbWperzlA
// SIG // jWv2PTANGknN11qsAOvnAg+lHw80POB+u+n3lH2XenN4
// SIG // m6Srl5uvwDl+n7rWl5/Lnb4uZG+LaLbvya4mbYuF/Ery
// SIG // 9bw3XQ4ROokXLoWss5Tgb5c9z3MV1QzbBKXtRxFXp5y/
// SIG // cIUzIo/YNg5tjrzY5wWa88cChVJAchgl9rZiJJhNb3aZ
// SIG // FkfZJskIeOv1XRBWSJuEcLhO3r6bI22+90heACK9A02x
// SIG // AdjW58I9SdEmA9KkkXMb+ryAB5qjzAw9NCzUODKs3kRL
// SIG // nfkcmMpsWAwIDd1YeiM1JpudYtXQrB7gzs6hddegv41k
// SIG // ybO5OiQrX3ZMiynJ0ez0b/J0IaxQLUIU8u1m3Z3C+O7V
// SIG // HIONAnCN9ol1GQIsiOOKapSFFGLRIgX4xjrjCHH/tVv9
// SIG // nRHUUeTBjAmHZYAhZe5sqP9OPTzTjDvb3uwsGYidOgFo
// SIG // wB205GLLUQuPdrPOxyqIhIuDq5ex3Dq81jX7FVpoQwez
// SIG // DKPk1PcA60efpNM8cstUelvWbSddx1JEjkyTuamBWJlV
// SIG // MorhpL444mr4mhhLZ4ofZUQURPDmIQwl0gvhtQkao0/8
// SIG // Scr6Kt0P
// SIG // End signature block
