﻿

//
// extrude.js
//

//
// distance and repeat tool properties
//
var extrudeDistance = 0;
var extrudeRepeat = 1;

//
// we store the tool properties on our command data element
//
var commandData = services.commands.getCommandData("Extrude");
var toolProps;

var hadDistance = commandData.hasTrait("ExtrudeDistance");
var distanceTrait = commandData.getOrCreateTrait("ExtrudeDistance", "float", 0);
if (!hadDistance) {
    // we need to set a default for distance
    distanceTrait.value = 1;
}

//
// special handling for first time access.. we init with default values
//
var hadRepeat = commandData.hasTrait("ExtrudeRepeat");
var repeatTrait = commandData.getOrCreateTrait("ExtrudeRepeat", "float", 0);
if (!hadRepeat) {
    // we didn't have the repeat trait, so set to default value of 1
    repeatTrait.value = 1;
}

//
// store the values from traits into locals
//
extrudeDistance = distanceTrait.value;
extrudeRepeat = repeatTrait.value;

// set the tool props
document.toolProps = commandData;
document.refreshToolPropertyWindow();

function extrude(distance, repeat, geom, polyIndex) {

    var polygonPointCount = geom.getPolygonPointCount(polyIndex);
    if (polygonPointCount < 3) {
        return;
    }

    if (repeat == 0) {
        return;
    }

    var extrudeDir = geom.computePolygonNormal(polyIndex);

    var materialIndex = geom.getPolygonMaterialIndex(polyIndex);

    // this is our starting index for new points
    var newPointStart = geom.pointCount;
    var currentPoint = newPointStart;

    // we gather all the point indices for use when creating polygons
    var pointIndices = new Array();
    for (var i = 0; i < polygonPointCount; i++) {
        var idx = geom.getPolygonPoint(polyIndex, i);
        pointIndices.push(idx);
    }

    // first duplicate the points in the geometry (without adding polygon)
    for (var j = 0; j < repeat; j++) {
        for (var i = 0; i < polygonPointCount; i++) {

            var point = geom.getPointOnPolygon(polyIndex, i);
            point[0] += distance * (j+1) * extrudeDir[0];
            point[1] += distance * (j+1) * extrudeDir[1];
            point[2] += distance * (j+1) * extrudeDir[2];

            geom.addPoints(point, 1);

            pointIndices.push(currentPoint);
            currentPoint++;
        }
    }

    // now create a new polygon
    var newPolyIndex = geom.polygonCount;
    geom.addPolygon(materialIndex);

    var IndexingModePerPointOnPolygon = 3;
    var addTextureCoords = false;

    if (geom.textureCoordinateIndexingMode == IndexingModePerPointOnPolygon)
    {
        addTextureCoords = true;
    }

    // add points to new polygon.
    var newPolyPointStart = newPointStart + (repeat - 1) * polygonPointCount;
    for (var i = 0; i < polygonPointCount; i++) {
        geom.addPolygonPoint(newPolyIndex, newPolyPointStart + i);

        if (addTextureCoords) {
            var texCoord = geom.getTextureCoordinateOnPolygon(polyIndex, i);
            geom.addTextureCoordinates(texCoord, 1);
        }
    }

    // for each segement (we repeat)
    for (var j = 0; j < repeat; j++) {

        // for each edge
        for (var i = 0; i < polygonPointCount; i++) {

            var p0 = i;
            var p1 = i + 1;
            if (p1 >= polygonPointCount) {
                p1 = 0;
            }

            // points i and i + 1 form an edge

            // add a poly containing this edge, edges from each point to the
            // newly duplicted points, and the new edge between the 2 associated duped points
            var thisPolyIndex = geom.polygonCount;
            geom.addPolygon(materialIndex);

            var poly0PointStart = j * polygonPointCount;
            var poly1PointStart = (j + 1) * polygonPointCount;

            var i0 = pointIndices[poly0PointStart + p0];
            var i1 = pointIndices[poly0PointStart + p1];
            var i2 = pointIndices[poly1PointStart + p1];
            var i3 = pointIndices[poly1PointStart + p0];

            geom.addPolygonPoint(thisPolyIndex, i0);
            geom.addPolygonPoint(thisPolyIndex, i1);
            geom.addPolygonPoint(thisPolyIndex, i2);
            geom.addPolygonPoint(thisPolyIndex, i3);

            if (addTextureCoords) {
                var texCoord0 = [0, 0, 1, 0, 1, 1, 0, 1];
                geom.addTextureCoordinates(texCoord0, 4);
            }
        }
    }

    return newPolyIndex;
}

///////////////////////////////////////////////////////////////////////////////
//
// helper to get a designer property as a bool
//
///////////////////////////////////////////////////////////////////////////////
function getDesignerPropAsBool(tname) {
    if (document.designerProps.hasTrait(tname))
        return document.designerProps.getTrait(tname).value;

    return false;
}

function getSelectionMode() {
    if (getDesignerPropAsBool("usePivot"))
        return 0; // default to object mode when using pivot
    if (document.designerProps.hasTrait("SelectionMode"))
        return document.designerProps.getTrait("SelectionMode").value;
    return 0;
}


// find the mesh child
function findFirstChildMeshElement(parent)
{
    // find the mesh child
    for (var i = 0; i < parent.childCount; i++) {

        // get child and its materials
        var child = parent.getChild(i);
        if (child.typeId == "Microsoft.VisualStudio.3D.Mesh") {
            return child;
        }
    }
    return null;
}

function UndoableItem(dist, repeat, collElem, meshElem) {
    this._extrudeDistance = dist;
    this._extrudeRepeat = repeat;

    var clonedColl = collElem.clone();
    this._collectionElem = clonedColl;
    this._polyCollection = clonedColl.behavior;
    this._meshElem = meshElem;
    this._mesh = meshElem.behavior;

    var geom = this._meshElem.getTrait("Geometry").value;
    this._restoreGeom = geom.clone();

    this.getName = function () {
        var IDS_MreUndoExtrude = 146;
        return services.strings.getStringFromId(IDS_MreUndoExtrude);
    }

    this.onDo = function () {

        var geom = this._meshElem.getTrait("Geometry").value;

        var polysToDelete = new Array();
        var polysToSelect = new Array();

        // extrude
        var polyCount = this._polyCollection.getPolygonCount();
        for (var i = 0; i < polyCount; i++) {
            var polyIndex = this._polyCollection.getPolygon(i);
            var newPoly = extrude(this._extrudeDistance, this._extrudeRepeat, geom, polyIndex);

            // services.debug.trace("[Extrude] extruding poly index " + polyIndex);
            // services.debug.trace("[Extrude] adding poly index " + newPoly);

            polysToSelect.push(newPoly);
            polysToDelete.push(polyIndex);
        }

        function sortNumberDescending(a, b) {
            return b - a;
        }

        // delete the old selection
        polysToDelete.sort(sortNumberDescending);

        var numDeletedPolys = polysToDelete.length;

        for (var p = 0; p < polysToDelete.length; p++) {

            // services.debug.trace("[Extrude] removing poly index " + polyIndex);

            geom.removePolygon(polysToDelete[p]);
        }

        var newCollection = this._collectionElem.clone();
        var newPolyCollBeh = newCollection.behavior;

        newPolyCollBeh.clear();

        // shift polygon indices
        for (var p = 0; p < polysToSelect.length; p++) {
            var indexToSelect = polysToSelect[p] - numDeletedPolys;

            // services.debug.trace("[Extrude] selecting poly index " + indexToSelect);

            newPolyCollBeh.addPolygon(indexToSelect);
        }

        this._mesh.selectedObjects = newCollection;
        this._mesh.recomputeCachedGeometry();
    }

    this.onUndo = function () {
        var geom = this._meshElem.getTrait("Geometry").value;
        geom.copyFrom(this._restoreGeom);

        this._mesh.selectedObjects = this._collectionElem;

        this._mesh.recomputeCachedGeometry();
    }
}


if (extrudeRepeat != 0) {

    var selectedElement = document.selectedElement;
    var selectionMode = getSelectionMode();

    // get the poly collection
    var polyCollection = null;
    var mesh = null;
    var meshElem = null;
    var collElem = null;
    if (selectedElement != null) {
        if (selectionMode == 1) {
            meshElem = findFirstChildMeshElement(selectedElement);
            if (meshElem != null) {
                mesh = meshElem.behavior;

                // polygon selection mode
                collElem = mesh.selectedObjects;
                if (collElem != null) {
                    polyCollection = collElem.behavior;
                }
            }
        }
    }

    if (polyCollection != null && collElem.typeId == "PolygonCollection") {
        var undoableItem = new UndoableItem(extrudeDistance, extrudeRepeat, collElem, meshElem);
        undoableItem.onDo();
        services.undoService.addUndoableItem(undoableItem);
    }
}

// SIG // Begin signature block
// SIG // MIIoKgYJKoZIhvcNAQcCoIIoGzCCKBcCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // kz9XY8lqiFVbcL5uZ5PFVCKKJ4t4jMlzh48n5M8YHxqg
// SIG // gg12MIIF9DCCA9ygAwIBAgITMwAABARsdAb/VysncgAA
// SIG // AAAEBDANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExNFoX
// SIG // DTI1MDkxMTIwMTExNFowdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // tCg32mOdDA6rBBnZSMwxwXegqiDEUFlvQH9Sxww07hY3
// SIG // w7L52tJxLg0mCZjcszQddI6W4NJYb5E9QM319kyyE0l8
// SIG // EvA/pgcxgljDP8E6XIlgVf6W40ms286Cr0azaA1f7vaJ
// SIG // jjNhGsMqOSSSXTZDNnfKs5ENG0bkXeB2q5hrp0qLsm/T
// SIG // WO3oFjeROZVHN2tgETswHR3WKTm6QjnXgGNj+V6rSZJO
// SIG // /WkTqc8NesAo3Up/KjMwgc0e67x9llZLxRyyMWUBE9co
// SIG // T2+pUZqYAUDZ84nR1djnMY3PMDYiA84Gw5JpceeED38O
// SIG // 0cEIvKdX8uG8oQa047+evMfDRr94MG9EWwIDAQABo4IB
// SIG // czCCAW8wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFPIboTWxEw1PmVpZS+AzTDwo
// SIG // oxFOMEUGA1UdEQQ+MDykOjA4MR4wHAYDVQQLExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xFjAUBgNVBAUTDTIzMDAx
// SIG // Mis1MDI5MjMwHwYDVR0jBBgwFoAUSG5k5VAF04KqFzc3
// SIG // IrVtqMp1ApUwVAYDVR0fBE0wSzBJoEegRYZDaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jcmwvTWlj
// SIG // Q29kU2lnUENBMjAxMV8yMDExLTA3LTA4LmNybDBhBggr
// SIG // BgEFBQcBAQRVMFMwUQYIKwYBBQUHMAKGRWh0dHA6Ly93
// SIG // d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWlj
// SIG // Q29kU2lnUENBMjAxMV8yMDExLTA3LTA4LmNydDAMBgNV
// SIG // HRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4ICAQCI5g/S
// SIG // KUFb3wdUHob6Qhnu0Hk0JCkO4925gzI8EqhS+K4umnvS
// SIG // BU3acsJ+bJprUiMimA59/5x7WhJ9F9TQYy+aD9AYwMtb
// SIG // KsQ/rst+QflfML+Rq8YTAyT/JdkIy7R/1IJUkyIS6srf
// SIG // G1AKlX8n6YeAjjEb8MI07wobQp1F1wArgl2B1mpTqHND
// SIG // lNqBjfpjySCScWjUHNbIwbDGxiFr93JoEh5AhJqzL+8m
// SIG // onaXj7elfsjzIpPnl8NyH2eXjTojYC9a2c4EiX0571Ko
// SIG // mhENF3RtR25A7/X7+gk6upuE8tyMy4sBkl2MUSF08U+E
// SIG // 2LOVcR8trhYxV1lUi9CdgEU2CxODspdcFwxdT1+G8YNc
// SIG // gzHyjx3BNSI4nOZcdSnStUpGhCXbaOIXfvtOSfQX/UwJ
// SIG // oruhCugvTnub0Wna6CQiturglCOMyIy/6hu5rMFvqk9A
// SIG // ltIJ0fSR5FwljW6PHHDJNbCWrZkaEgIn24M2mG1M/Ppb
// SIG // /iF8uRhbgJi5zWxo2nAdyDBqWvpWxYIoee/3yIWpquVY
// SIG // cYGhJp/1I1sq/nD4gBVrk1SKX7Do2xAMMO+cFETTNSJq
// SIG // fTSSsntTtuBLKRB5mw5qglHKuzapDiiBuD1Zt4QwxA/1
// SIG // kKcyQ5L7uBayG78kxlVNNbyrIOFH3HYmdH0Pv1dIX/Mq
// SIG // 7avQpAfIiLpOWwcbjzCCB3owggVioAMCAQICCmEOkNIA
// SIG // AAAAAAMwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290
// SIG // IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDExMB4XDTEx
// SIG // MDcwODIwNTkwOVoXDTI2MDcwODIxMDkwOVowfjELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEoMCYGA1UEAxMfTWljcm9zb2Z0
// SIG // IENvZGUgU2lnbmluZyBQQ0EgMjAxMTCCAiIwDQYJKoZI
// SIG // hvcNAQEBBQADggIPADCCAgoCggIBAKvw+nIQHC6t2G6q
// SIG // ghBNNLrytlghn0IbKmvpWlCquAY4GgRJun/DDB7dN2vG
// SIG // EtgL8DjCmQawyDnVARQxQtOJDXlkh36UYCRsr55JnOlo
// SIG // XtLfm1OyCizDr9mpK656Ca/XllnKYBoF6WZ26DJSJhIv
// SIG // 56sIUM+zRLdd2MQuA3WraPPLbfM6XKEW9Ea64DhkrG5k
// SIG // NXimoGMPLdNAk/jj3gcN1Vx5pUkp5w2+oBN3vpQ97/vj
// SIG // K1oQH01WKKJ6cuASOrdJXtjt7UORg9l7snuGG9k+sYxd
// SIG // 6IlPhBryoS9Z5JA7La4zWMW3Pv4y07MDPbGyr5I4ftKd
// SIG // gCz1TlaRITUlwzluZH9TupwPrRkjhMv0ugOGjfdf8NBS
// SIG // v4yUh7zAIXQlXxgotswnKDglmDlKNs98sZKuHCOnqWbs
// SIG // YR9q4ShJnV+I4iVd0yFLPlLEtVc/JAPw0XpbL9Uj43Bd
// SIG // D1FGd7P4AOG8rAKCX9vAFbO9G9RVS+c5oQ/pI0m8GLhE
// SIG // fEXkwcNyeuBy5yTfv0aZxe/CHFfbg43sTUkwp6uO3+xb
// SIG // n6/83bBm4sGXgXvt1u1L50kppxMopqd9Z4DmimJ4X7Iv
// SIG // hNdXnFy/dygo8e1twyiPLI9AN0/B4YVEicQJTMXUpUMv
// SIG // dJX3bvh4IFgsE11glZo+TzOE2rCIF96eTvSWsLxGoGyY
// SIG // 0uDWiIwLAgMBAAGjggHtMIIB6TAQBgkrBgEEAYI3FQEE
// SIG // AwIBADAdBgNVHQ4EFgQUSG5k5VAF04KqFzc3IrVtqMp1
// SIG // ApUwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYD
// SIG // VR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0j
// SIG // BBgwFoAUci06AjGQQ7kUBU7h6qfHMdEjiTQwWgYDVR0f
// SIG // BFMwUTBPoE2gS4ZJaHR0cDovL2NybC5taWNyb3NvZnQu
// SIG // Y29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0
// SIG // MjAxMV8yMDExXzAzXzIyLmNybDBeBggrBgEFBQcBAQRS
// SIG // MFAwTgYIKwYBBQUHMAKGQmh0dHA6Ly93d3cubWljcm9z
// SIG // b2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0MjAx
// SIG // MV8yMDExXzAzXzIyLmNydDCBnwYDVR0gBIGXMIGUMIGR
// SIG // BgkrBgEEAYI3LgMwgYMwPwYIKwYBBQUHAgEWM2h0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvZG9jcy9w
// SIG // cmltYXJ5Y3BzLmh0bTBABggrBgEFBQcCAjA0HjIgHQBM
// SIG // AGUAZwBhAGwAXwBwAG8AbABpAGMAeQBfAHMAdABhAHQA
// SIG // ZQBtAGUAbgB0AC4gHTANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // Z/KGpZjgVHkaLtPYdGcimwuWEeFjkplCln3SeQyQwWVf
// SIG // Liw++MNy0W2D/r4/6ArKO79HqaPzadtjvyI1pZddZYSQ
// SIG // fYtGUFXYDJJ80hpLHPM8QotS0LD9a+M+By4pm+Y9G6XU
// SIG // tR13lDni6WTJRD14eiPzE32mkHSDjfTLJgJGKsKKELuk
// SIG // qQUMm+1o+mgulaAqPyprWEljHwlpblqYluSD9MCP80Yr
// SIG // 3vw70L01724lruWvJ+3Q3fMOr5kol5hNDj0L8giJ1h/D
// SIG // Mhji8MUtzluetEk5CsYKwsatruWy2dsViFFFWDgycSca
// SIG // f7H0J/jeLDogaZiyWYlobm+nt3TDQAUGpgEqKD6CPxNN
// SIG // ZgvAs0314Y9/HG8VfUWnduVAKmWjw11SYobDHWM2l4bf
// SIG // 2vP48hahmifhzaWX0O5dY0HjWwechz4GdwbRBrF1HxS+
// SIG // YWG18NzGGwS+30HHDiju3mUv7Jf2oVyW2ADWoUa9WfOX
// SIG // pQlLSBCZgB/QACnFsZulP0V3HjXG0qKin3p6IvpIlR+r
// SIG // +0cjgPWe+L9rt0uX4ut1eBrs6jeZeRhL/9azI2h15q/6
// SIG // /IvrC4DqaTuv/DDtBEyO3991bWORPdGdVk5Pv4BXIqF4
// SIG // ETIheu9BCrE/+6jMpF3BoYibV3FWTkhFwELJm3ZbCoBI
// SIG // a/15n8G9bW1qyVJzEw16UM0xghoMMIIaCAIBATCBlTB+
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAE
// SIG // BGx0Bv9XKydyAAAAAAQEMA0GCWCGSAFlAwQCAQUAoIGu
// SIG // MBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwGCisG
// SIG // AQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3
// SIG // DQEJBDEiBCBZTEg7jdDs/bdc1CevgeJqTz7/iB5xFHkt
// SIG // 9D1BcppOmjBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBACldVKs5
// SIG // epnRsSrMLqMouL9SEmPrIeCdcLLcu7/CCuvyV7ZSIBiP
// SIG // mXw9P4LAAgESi1aYdoB8GnjW7no9ZyTQw+fjn1SZrAtc
// SIG // eE967HAbhyb8ZHF0FtuwjtHbMewobLfvkq/W4KBl5gSF
// SIG // wLArSbcCOpM4QqZXiDFl3J7icgB0a+fqppJeEYCcz6WA
// SIG // yu61fX00oPuK8juh0JolIDcXlaZMo/y3sZsHLOXwh091
// SIG // UjKUX6yr/962DGf6EcjSIkUD5kPWZ0Sc7TJSyF4oDF5l
// SIG // wupjAtv04U1RaSV13bTlOfDddCX7zoCno78iOJM0+W+K
// SIG // 8Q+j2lvZLBYwBNpsUMKyNxjT68ShgheWMIIXkgYKKwYB
// SIG // BAGCNwMDATGCF4Iwghd+BgkqhkiG9w0BBwKgghdvMIIX
// SIG // awIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZIhvcN
// SIG // AQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgyNIWfJTfKDA2edKqGUVx
// SIG // w4Ywft1rNMz3/E9vKgV5DdECBmeJAz7h4hgTMjAyNTAx
// SIG // MTYxODIxMTcuMjMzWjAEgAIB9KCB0aSBzjCByzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0
// SIG // IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNo
// SIG // aWVsZCBUU1MgRVNOOkEwMDAtMDVFMC1EOTQ3MSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oIIR7DCCByAwggUIoAMCAQICEzMAAAHr4BhstbbvOO0A
// SIG // AQAAAeswDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTAwHhcNMjMxMjA2MTg0NTM0WhcN
// SIG // MjUwMzA1MTg0NTM0WjCByzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3Bl
// SIG // cmF0aW9uczEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNO
// SIG // OkEwMDAtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAg8AMIICCgKCAgEAwRVoIdpW4Fd3iadN
// SIG // aKomhQbmGzXO4UippLbydeTawfwwW6FKMPFjzkz8W5+4
// SIG // HJiDhpsCZHfk8hceyjp868Z6Ad4br7/dX2blLoCLCk5w
// SIG // L4NgVP53ze2c5/SpNZqbidu0usVAx+KHRYl+dSAnCpeh
// SIG // BuHMSoHAwIp4oU/Ma6CVlQEy+6fG2358LHNaYoWZnLyL
// SIG // mBp29U2PbZ6XQoVq/RAEbgqN04kRozNi6eKYk9pQ+YZ3
// SIG // d1Whk3qTasmpKZAhldPnCvFbvx5CGXb8vs+RC96I03RS
// SIG // y+byfSAKIFn91wLt3e0qRWmqHosdHtaueQA/eGcAz/os
// SIG // 6i2nbAUd7c46tkX6wjS/k5ov42pUbaPyem4eHz4RxE5w
// SIG // wu/E9cn11EHRrZif7rSPwDcYux1fIAD84nfU2IzD22Kh
// SIG // vMucc/oCP0hco/mirRx1pisxFz7bV8wHHsSdRB+8G7ol
// SIG // ZN7BKzyvTC4NV2+oTORyFgNIxAGYShMneYR9lzIm82pG
// SIG // 6drNhCUFmrEHOAzGhdRLENQs4ApQ2CGBuq1IbnXyO5PC
// SIG // /SighLn0WyuZXUWDQKnXa/8kiX7mb9z0t/r7Q+l+qtR+
// SIG // FDpowynY6Ft6rOyUTGZh/X5BZDM2+mEs6+nl9S6GJtz6
// SIG // ztSXmuN0mM5Qd08/ODr7lUlezXInVbTaomXllqVY32r0
// SIG // fiY/yTkCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBR0ngWs
// SIG // 1lXMbuKk/TuY09gfqgHq4TAfBgNVHSMEGDAWgBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQ
// SIG // hk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
// SIG // JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwG
// SIG // CCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUt
// SIG // U3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMB
// SIG // Af8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4G
// SIG // A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // g3TfL6D3fAvlVmT9/lvO3P0G3W1itLDrfWeJBDlp4Oyp
// SIG // oflg9i5zyUySiBGsZ4jnLfcDICfMkMsEfFh4Azr28Kna
// SIG // rC1GjODa3q7SOhSPa4Y4XmisTTZwWcx2Sw8JZC/bwhA3
// SIG // vUXNHRklXeQYNwlpJ1d7r1WrteBeeREk1iATWkEvQqaN
// SIG // jqc93EYAGFX2ixRmwKzXEb0lr0lG3iNiA6kcQuMQW0Yj
// SIG // UPtah1wwj59IRrF3y/spw2Z3An7Mza5YGU9uF4Ib082D
// SIG // B3F4qC1WKP9h5MqMOnSO7lCyWysS1/MB4bIsK4lyAwp4
// SIG // y1bBtBOW0fNkIHLHhIcW1NndUVR3ELZFBO1vc8Wamev4
// SIG // z5mqI2YF0Dt9148Th2GFWvwV3CLrvEjMz44wAG7o8E2s
// SIG // KWsywb/fey0QdGTmzXJCWMkEKRE0n5Td+o1vs+0f5xsi
// SIG // akWdx7WdZV1tX+sxAgHj/vXcup5nAq1XDqm0B1+2a/Fj
// SIG // 3IIRyQAA5ZuRMT4ecYtbTUZPouhdmvUqU3kJ2Vz+dMPi
// SIG // aE8SEkKu7wYo9p4rQLEi2lXjKqD4vjV5U1DWdjXbWxa+
// SIG // iIq/WSvbn2s9xcX7w2aN+ubyzqM5kDnv2fqbuL2Ocz5r
// SIG // TYlSHEJxcuyWTomVQyOWyHcEEWotqrhyiepbVHbItx4z
// SIG // Z4nrhO9n0+HlocbZpzeR2AgwggdxMIIFWaADAgECAhMz
// SIG // AAAAFcXna54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUA
// SIG // MIGIMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylN
// SIG // aWNyb3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3Jp
// SIG // dHkgMjAxMDAeFw0yMTA5MzAxODIyMjVaFw0zMDA5MzAx
// SIG // ODMyMjVaMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpX
// SIG // YXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
// SIG // VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNV
// SIG // BAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEw
// SIG // MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA
// SIG // 5OGmTOe0ciELeaLL1yR5vQ7VgtP97pwHB9KpbE51yMo1
// SIG // V/YBf2xK4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64NmeF
// SIG // RiMMtY0Tz3cywBAY6GB9alKDRLemjkZrBxTzxXb1hlDc
// SIG // wUTIcVxRMTegCjhuje3XD9gmU3w5YQJ6xKr9cmmvHaus
// SIG // 9ja+NSZk2pg7uhp7M62AW36MEBydUv626GIl3GoPz130
// SIG // /o5Tz9bshVZN7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHI
// SIG // NSi947SHJMPgyY9+tVSP3PoFVZhtaDuaRr3tpK56KTes
// SIG // y+uDRedGbsoy1cCGMFxPLOJiss254o2I5JasAUq7vnGp
// SIG // F1tnYN74kpEeHT39IM9zfUGaRnXNxF803RKJ1v2lIH1+
// SIG // /NmeRd+2ci/bfV+AutuqfjbsNkz2K26oElHovwUDo9Fz
// SIG // pk03dJQcNIIP8BDyt0cY7afomXw/TNuvXsLz1dhzPUNO
// SIG // wTM5TI4CvEJoLhDqhFFG4tG9ahhaYQFzymeiXtcodgLi
// SIG // Mxhy16cg8ML6EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5
// SIG // UPkLiWHzNgY1GIRH29wb0f2y1BzFa/ZcUlFdEtsluq9Q
// SIG // BXpsxREdcu+N+VLEhReTwDwV2xo3xwgVGD94q0W29R6H
// SIG // XtqPnhZyacaue7e3PmriLq0CAwEAAaOCAd0wggHZMBIG
// SIG // CSsGAQQBgjcVAQQFAgMBAAEwIwYJKwYBBAGCNxUCBBYE
// SIG // FCqnUv5kxJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQWBBSf
// SIG // pxVdAF5iXYP05dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEG
// SIG // DCsGAQQBgjdMg30BATBBMD8GCCsGAQUFBwIBFjNodHRw
// SIG // Oi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL0RvY3Mv
// SIG // UmVwb3NpdG9yeS5odG0wEwYDVR0lBAwwCgYIKwYBBQUH
// SIG // AwgwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYD
// SIG // VR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0j
// SIG // BBgwFoAU1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0f
// SIG // BE8wTTBLoEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQu
// SIG // Y29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0
// SIG // XzIwMTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBK
// SIG // BggrBgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQu
// SIG // Y29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0w
// SIG // Ni0yMy5jcnQwDQYJKoZIhvcNAQELBQADggIBAJ1Vffwq
// SIG // reEsH2cBMSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1
// SIG // OdfCcTY/2mRsfNB1OW27DzHkwo/7bNGhlBgi7ulmZzpT
// SIG // Td2YurYeeNg2LpypglYAA7AFvonoaeC6Ce5732pvvinL
// SIG // btg/SHUB2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l
// SIG // 9qRWqveVtihVJ9AkvUCgvxm2EhIRXT0n4ECWOKz3+SmJ
// SIG // w7wXsFSFQrP8DJ6LGYnn8AtqgcKBGUIZUnWKNsIdw2Fz
// SIG // Lixre24/LAl4FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7
// SIG // hvoyGtmW9I/2kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY
// SIG // 3UA8x1RtnWN0SCyxTkctwRQEcb9k+SS+c23Kjgm9swFX
// SIG // SVRk2XPXfx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFU
// SIG // a2pFEUep8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz
// SIG // /gq77EFmPWn9y8FBSX5+k77L+DvktxW/tM4+pTFRhLy/
// SIG // AsGConsXHRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1
// SIG // ZyvgDbjmjJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328
// SIG // y+l7vzhwRNGQ8cirOoo6CGJ/2XBjU02N7oJtpQUQwXEG
// SIG // ahC0HVUzWLOhcGbyoYIDTzCCAjcCAQEwgfmhgdGkgc4w
// SIG // gcsxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJTAjBgNVBAsTHE1p
// SIG // Y3Jvc29mdCBBbWVyaWNhIE9wZXJhdGlvbnMxJzAlBgNV
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjpBMDAwLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAgAaJdbtcMMGI
// SIG // FLVKMDJ6mL27pd6ggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOsz
// SIG // gbowIhgPMjAyNTAxMTYxMzAxNDZaGA8yMDI1MDExNzEz
// SIG // MDE0NlowdjA8BgorBgEEAYRZCgQBMS4wLDAKAgUA6zOB
// SIG // ugIBADAJAgEAAgEQAgH/MAcCAQACAhBzMAoCBQDrNNM6
// SIG // AgEAMDYGCisGAQQBhFkKBAIxKDAmMAwGCisGAQQBhFkK
// SIG // AwKgCjAIAgEAAgMHoSChCjAIAgEAAgMBhqAwDQYJKoZI
// SIG // hvcNAQELBQADggEBALjbI9eF23Eidy81MI+oE0E94/kx
// SIG // zvxTVax/RIEuYwtGXnbBY2hldQyXd0E/dHBAVWkrmbzK
// SIG // sRl1qgFmGrvFB0voJPeagQbWLKJgMnpd6FcW+IfFdciQ
// SIG // iuiuQ+/xN54TAWpG6TRhAvKfdImCpXnp728JSvQGEzka
// SIG // 4DAyzXQ4m9AJJMwR3ek43icuzDsavOjHPAblZeve/F0y
// SIG // iEhQ4p/B8X4Bik1GAvJfNqCuLQ9gS1wUaMdYfh1slZYo
// SIG // Huce3x71Ab0lRzN/+gWn4wUwsDx41sGTLd9yAfAxMhQy
// SIG // GgAzqt2sPGwnqjRHZWGEyzQDK+J5NWJGj2PROKi9lB5v
// SIG // 1Yrq/6MxggQNMIIECQIBATCBkzB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMAITMwAAAevgGGy1tu847QABAAAB
// SIG // 6zANBglghkgBZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkD
// SIG // MQ0GCyqGSIb3DQEJEAEEMC8GCSqGSIb3DQEJBDEiBCBR
// SIG // CJu1zkhNlPuRq2rvtoqjeXg+0kYRQALKKIzqiGeEXDCB
// SIG // +gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0EIM63a75f
// SIG // aQPhf8SBDTtk2DSUgIbdizXsz76h1JdhLCz4MIGYMIGA
// SIG // pH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMA
// SIG // AAHr4BhstbbvOO0AAQAAAeswIgQgh3/Gb8iIPfMAmrDh
// SIG // UouxRDpYD8T7wwwOeOHzAiquyaAwDQYJKoZIhvcNAQEL
// SIG // BQAEggIARCrtEk/qDeYyHG5dBjD6AQSRGHPywNaZ/WG7
// SIG // xOh5SZJ3dN0Xey5sfDEOArrM4559Xn9epGkYAkoqrVkS
// SIG // 8I9yC+Gg7TUoYAQ77VjdNuezdnkgcLzBQsNpCtgiH1CP
// SIG // dSV/jBud5i7KtGtcu29ZK6DexM5GSRmsSxV2HDCSj9m9
// SIG // YXOH69/4DG4jvr8Bfe0GpCJ/7/eV7flzEy3iLGAoar8I
// SIG // PcN3A4mGzLyr3UUSu+H22JZwrPA4IWeJi7liQ566TvzP
// SIG // VWS2FaEYu3ZRt+hMgLV1QP6kP3/4yVKzyvSXv46MDUj4
// SIG // S6MlBZEQFdL9NK0BEoEe7dLD2hjBfmfSWCW8wLDyf3ly
// SIG // Zal5KGODnsmt4iBwnPFXjnLpQ+tJIt+Ct4XB6O2tARWs
// SIG // /ebgHiiBAghFl0HMW3UM8dsaMaufatt+1f+GexUUbKJ9
// SIG // cg4GFoJXg4RpS+i6U/s+IXC/Ifu8BocPVZpnp0UrjnOh
// SIG // aF5UkcfdzWR75FGLlvS8mGnmmW8J74w+s0HMlJ6/l4wC
// SIG // 5KM+dqlS11Ozcgvm4U+1QJkyK44aNkfbY+/xEoQYTszf
// SIG // FWYWQWK8pMX4U4krHGX8w785FJnwndXuTReGc90bMMMh
// SIG // 8fXNRlZYDh4c/73DBfHe/I+kY0xHG50YKn7LbfiDF9DW
// SIG // t3CLKyZwj72tfpTugriwGOWZ+1jGKTA=
// SIG // End signature block
