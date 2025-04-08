
//
// AddSubdivisions.js
//
function addSubdivisions(geom, polyCollection, polyIndex, splitEdgesMap, polysToSelect) {

    var polygonPointCount = geom.getPolygonPointCount(polyIndex);
    if (polygonPointCount < 3) {
        return;
    }
    // services.debug.trace("splitting poly : " + polyIndex);

    var containingMesh = polyCollection.getContainingMesh();

    // determine if we need to add new texture coordinates
    var IndexingModeUndefined = 0;
    var IndexingModePerPoint = 1;
    var IndexingModePerPointOnPolygon = 3;

    // determine the material index on the pre division polygon
    var materialIndex = geom.getPolygonMaterialIndex(polyIndex);

    // this is our starting index for new points
    var newPointStart = geom.pointCount;

    // we'll compute the center of the triangle
    var avgPos = [0, 0, 0];
    var avgTex = [0, 0];

    // iterate over polypoints and total
    for (var i = 0; i < polygonPointCount; i++) {
        var point = geom.getPointOnPolygon(polyIndex, i);
        avgPos[0] += point[0];
        avgPos[1] += point[1];
        avgPos[2] += point[2];
    }

    // total tex coords if needed
    if (geom.textureCoordinateIndexingMode != IndexingModeUndefined) {
        for (var i = 0; i < polygonPointCount; i++) {
            
            var texCoord = geom.getTextureCoordinateOnPolygon(polyIndex, i);
            avgTex[0] += texCoord[0];
            avgTex[1] += texCoord[1];
        }
    }

    // get the center 
    var div = 1.0 / polygonPointCount;
    avgPos[0] *= div;
    avgPos[1] *= div;
    avgPos[2] *= div;

    avgTex[0] *= div;
    avgTex[1] *= div;

    // add the avg point
    geom.addPoints(avgPos, 1);

    // store tex coords if (if we need to)
    // we'll put these into the geom later
    var texcoords = new Array();
    if (geom.textureCoordinateIndexingMode == IndexingModePerPoint) {
        geom.addTextureCoordinates(avgTex, 1);
    }
    else if (geom.textureCoordinateIndexingMode == IndexingModePerPointOnPolygon) {
        texcoords.push(avgTex);
    }

    // split points for this polygon
    var splitPointIndices = new Array();
    
    // compute the split points
    for (var i = 0; i < polygonPointCount; i++) {
        var i0 = i;
        var i1 = i + 1;
        if (i1 >= polygonPointCount) {
            i1 = 0;
        }
        var p0 = geom.getPointOnPolygon(polyIndex, i0);
        var p1 = geom.getPointOnPolygon(polyIndex, i1);

        // get object level indices
        var oi0 = geom.getPolygonPoint(polyIndex, i0);
        var oi1 = geom.getPolygonPoint(polyIndex, i1);

        // index of the point that splits this edge
        var splitPointIndex = 0;

        // we're splitting the edge between object level points
        // p0 and p1, so see if this is edge has been previously split

        var tmp0 = Math.min(oi0, oi1);
        var tmp1 = Math.max(oi0, oi1);

        // services.debug.trace("splitting edge: " + tmp0 + " " + tmp1);

        var wasNewPointCreated = false;
        if (splitEdgesMap.hasOwnProperty("" + tmp0) && (splitEdgesMap[tmp0].hasOwnProperty("" + tmp1)))
        {
            splitPointIndex = splitEdgesMap[tmp0][tmp1];
            // services.debug.trace("using split point: " + splitPointIndex);
        }
        else
        {
            wasNewPointCreated = true;

            var split = [0, 0, 0];
            split[0] = p0[0] + 0.5 * (p1[0] - p0[0]);
            split[1] = p0[1] + 0.5 * (p1[1] - p0[1]);
            split[2] = p0[2] + 0.5 * (p1[2] - p0[2]);

            if (splitEdgesMap.hasOwnProperty("" + tmp0) == false) {
                splitEdgesMap[tmp0] = new Object();
            }

            splitPointIndex = geom.pointCount;
            geom.addPoints(split, 1);

            // services.debug.trace("created split point: " + splitPointIndex);

            splitEdgesMap[tmp0][tmp1] = splitPointIndex;
        }
        splitPointIndices.push(splitPointIndex);

        if (geom.textureCoordinateIndexingMode != IndexingModeUndefined) {

            var texCoord0 = geom.getTextureCoordinateOnPolygon(polyIndex, i0);
            var texCoord1 = geom.getTextureCoordinateOnPolygon(polyIndex, i1);
            var texCoord = [0, 0];
            texCoord[0] = texCoord0[0] + 0.5 * (texCoord1[0] - texCoord0[0]);
            texCoord[1] = texCoord0[1] + 0.5 * (texCoord1[1] - texCoord0[1]);

            if (geom.textureCoordinateIndexingMode == IndexingModePerPoint) {
                if (wasNewPointCreated) {
                    geom.addTextureCoordinates(texCoord, 1);
                }   
            }
            else if (geom.textureCoordinateIndexingMode == IndexingModePerPointOnPolygon) {
                texcoords.push(texCoord);
            }
        }

        //
        // we need to split edges on polys if the edge is shared
        //
        var polygonsSharingEdge = geom.getPolygonsFromEdge(tmp0, tmp1);
        var sharedPolyCount = polygonsSharingEdge.getPolygonCount();
        for (var j = 0; j < sharedPolyCount; j++) {
            var sharedPolygonIndex = polygonsSharingEdge.getPolygon(j);
            if (polyCollection.hasPolygon(sharedPolygonIndex) == false) {
                // this is a shared poly, and not part of the set we're going to subdivide explicitly
                // so we need to break the edge tmp0, tmp1
                geom.insertPolygonPoint(sharedPolygonIndex, tmp0, tmp1, splitPointIndex);
            }
        }
    }

    // we now create a new polygon (quad) for each point in the old poly
    // i.e oldpoly point count == old poly edge count == number of new polys created after split
    for (var i = 0; i < polygonPointCount; i++) {

        // wrap around
        var prevIndex;
        if (i > 0) {
            prevIndex = i - 1;
        }
        else {
            prevIndex = polygonPointCount - 1;
        }

        // add a polygon
        var thisPolyIndex = geom.polygonCount;
        geom.addPolygon(materialIndex);

        polysToSelect.push(thisPolyIndex);

        // add points
        var i0 = geom.getPolygonPoint(polyIndex, i);
        var i1 = splitPointIndices[i];
        var i2 = newPointStart;
        var i3 = splitPointIndices[prevIndex];

        geom.addPolygonPoint(thisPolyIndex, i0);
        geom.addPolygonPoint(thisPolyIndex, i1);
        geom.addPolygonPoint(thisPolyIndex, i2);
        geom.addPolygonPoint(thisPolyIndex, i3);

        if (geom.textureCoordinateIndexingMode == IndexingModePerPointOnPolygon) {
            geom.addTextureCoordinates(geom.getTextureCoordinateOnPolygon(polyIndex, i), 1);
            geom.addTextureCoordinates(texcoords[i + 1], 1);
            geom.addTextureCoordinates(texcoords[0], 1);
            geom.addTextureCoordinates(texcoords[prevIndex + 1], 1);
        }
    }
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


function UndoableItem(collElem, meshElem) {

    this._clonedColl = collElem.clone();
    this._polyCollection = this._clonedColl.behavior;
    this._meshElem = meshElem;
    this._mesh = meshElem.behavior;

    var geom = this._meshElem.getTrait("Geometry").value;
    this._restoreGeom = geom.clone();

    this.getName = function () {
        var IDS_MreUndoSubdivide = 147;
        return services.strings.getStringFromId(IDS_MreUndoSubdivide);
    }

    this.onDo = function () {

        var newCollection = this._clonedColl.clone();
        var newPolyBeh = newCollection.behavior;
        newPolyBeh.clear();

        // maps split edges to indices of points used to split them
        var splitEdgesMap = new Object();

        var geom = this._meshElem.getTrait("Geometry").value;

        var polysToSelect = new Array();

        // subdivide
        var polysToDelete = new Array();
        var polyCount = this._polyCollection.getPolygonCount();
        for (var i = 0; i < polyCount; i++) {
            var polyIndex = this._polyCollection.getPolygon(i);
            addSubdivisions(geom, this._polyCollection, polyIndex, splitEdgesMap, polysToSelect);

            polysToDelete.push(polyIndex);
        }

        function sortNumberDescending(a, b) {
            return b - a;
        }
 
        // delete the old selection
        polysToDelete.sort(sortNumberDescending);

        var numDeletedPolys = polysToDelete.length;

        for (var p = 0; p < polysToDelete.length; p++) {
            geom.removePolygon(polysToDelete[p]);
        }

        // shift polygon indices
        for (var p = 0; p < polysToSelect.length; p++) {
            var indexToSelect = polysToSelect[p] - numDeletedPolys;

            newPolyBeh.addPolygon(indexToSelect);
        }

        this._mesh.selectedObjects = newCollection;

        this._mesh.recomputeCachedGeometry();
    }

    this.onUndo = function () {
        var geom = this._meshElem.getTrait("Geometry").value;
        geom.copyFrom(this._restoreGeom);

        this._mesh.selectedObjects = this._clonedColl;

        this._mesh.recomputeCachedGeometry();
    }
}

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
    var undoableItem = new UndoableItem(collElem, meshElem);
    undoableItem.onDo();
    services.undoService.addUndoableItem(undoableItem);
}
// SIG // Begin signature block
// SIG // MIIoNgYJKoZIhvcNAQcCoIIoJzCCKCMCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // vVb+u/YO+8d4nxqG8U1pDSpZo+x+WxGf5RzP6XhH35eg
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
// SIG // ghoJMIIaBQIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCCABiziPKjLkgCP
// SIG // TLKfCTG1m/dLTh5/kJvRJoWbo1+pxzBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAIYgvROwI4Aw9EA0sfCOluIIdZbwuIMy
// SIG // Lopdg+muQ97fVf2r2fieRRnYYzLtINumjh7V959E2/aL
// SIG // sHdiFrnihxzEXcbisZYAvs5Qae54uG9mRBRjQtdrIEz3
// SIG // r5LyJ26x3XnNuH6SSKPMChiueRoBMNXrmyHFjOIMdXGm
// SIG // HInXujhKnmxtqRn9GR5RMGrAIPxwBUJmq+agJqxlCaLP
// SIG // NpWNMyTFGv0p15zzqx8prDC1NZTgHv2heFxappYTRLoy
// SIG // pM/pgnViCpx8j2ww2qgBbGB/9tWvdbW9ugIed1GpFvBY
// SIG // J8T48eNuyd25NUFExgYQgmEGdc1ELjZP26TLwkeNiuUU
// SIG // 3AShgheTMIIXjwYKKwYBBAGCNwMDATGCF38wghd7Bgkq
// SIG // hkiG9w0BBwKgghdsMIIXaAIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // aFI98GHL8YCc+hlyHjg5N6dQSzo7cpAJ/rofaMcCvkoC
// SIG // BmeI8RHpCxgTMjAyNTAxMTYxODIxMjAuODQyWjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOkE5MzUt
// SIG // MDNFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR6TCCByAwggUIoAMCAQIC
// SIG // EzMAAAHpD3Ewfl3xEjYAAQAAAekwDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTI2WhcNMjUwMzA1MTg0NTI2WjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOkE5MzUtMDNFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEArJqMMUEVYKeE0nN502usqwDyZ1egO2mWJ08P8sfd
// SIG // LtQ0h/PZ730Dc2/uX5gSvKaR++k5ic4x1HCJnfOOQP6b
// SIG // 2WOTvDwgbuxqvseV3uqZULeMcFVFHECE8ZJTmdUZvXye
// SIG // Z4fIJ8TsWnsxTDONbAyOyzKSsCCkDMFw3LWCrwskMupD
// SIG // trFSwetpBfPdmcHGKYiFcdy09Sz3TLdSHkt+SmOTMcpU
// SIG // XU0uxNSaHJd9DYHAYiX6pzHHtOXhIqSLEzuAyJ//07T9
// SIG // Ucee1V37wjvDUgofXcbMr54NJVFWPrq6vxvEERaDpf+6
// SIG // DiNEX/EIPt4cmGsh7CPcLbwxxp099Da+Ncc06cNiOmVm
// SIG // iIT8DLuQ73ZBBs1e72E97W/bU74mN6bLpdU+Q/d/PwHz
// SIG // S6mp1QibT+Ms9FSQUhlfoeumXGlCTsaW0iIyJmjixdfD
// SIG // To5n9Z8A2rbAaLl1lxSuxOUtFS0cqE6gwsRxuJlt5qTU
// SIG // KKTP1NViZ47LFkJbivHm/jAypZPRP4TgWCrNin3kOBxu
// SIG // 3TnCvsDDmphn8L5CHu3ZMpc5vAXgFEAvC8awEMpIUh8v
// SIG // hWkPdwwJX0GKMGA7cxl6hOsDgE3ihSN9LvWJcQ08wLiw
// SIG // ytO93J3TFeKmg93rlwOsVDQqM4O64oYh1GjONwJm/RBr
// SIG // kZdNtvsj8HJZspLLJN9GuEad7/UCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBSRfjOJxQh2I7iI9Frr/o3I7QfsTjAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAVrEqfq5rMRS3utQBPdCnp9lz
// SIG // 4EByQ4kuEmy4b831Ywzw5jnURO+bkKIWIRTHRsBym1Zi
// SIG // ytJR1dQKc/x3ImaKMnqAL5B0Gh5i4cARpKMgAFcXGmlJ
// SIG // xzSFEvS73i9ND8JnEgy4DdFfxcpNtEKRwxLpMCkfJH2g
// SIG // RF/NwMr0M5X/26AzaFihIKXQLC/Esws1xS5w6M8wiRqt
// SIG // Ec8EIHhAa/BOCtsENllyP2ScWUv/ndxXcBuBKwRc81Ik
// SIG // m1dpt8bDD93KgkRQ7SdQt/yZ41zAoZ5vWyww9cGie0z6
// SIG // ecGHb9DpffmjdLdQZjswo/A5qirlMM4AivU47cOSlI2j
// SIG // ukI3oB853V/7Wa2O/dnX0QF6+XRqypKbLCB6uq61juD5
// SIG // S9zkvuHIi/5fKZvqDSV1hl2CS+R+izZyslyVRMP9RWzu
// SIG // Phs/lOHxRcbNkvFML6wW2HHFUPTvhZY+8UwHiEybB6bQ
// SIG // L0RKgnPv2Mc4SCpAPPEPEISSlA7Ws2rSR+2TnYtCwisI
// SIG // KkDuB/NSmRg0i5LRbzUYYfGQQHp59aVvuVARmM9hqYHM
// SIG // VVyk9QrlGHZR0fQ+ja1YRqnYRk4OzoP3f/KDJTxt2I7q
// SIG // hcYnYiLKAMNvjISNc16yIuereiZCe+SevRfpZIfZsiSa
// SIG // TZMeNbEgdVytoyVoKu1ZQbj9Qbl42d6oMpva9cL9DLUw
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
// SIG // 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDTDCC
// SIG // AjQCAQEwgfmhgdGkgc4wgcsxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVyaWNhIE9w
// SIG // ZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // TjpBOTM1LTAzRTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUAq2mH9cQ5NqzJ1P1SaNhhitZ8aPGggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOszb4swIhgPMjAyNTAxMTYxMTQ0
// SIG // MTFaGA8yMDI1MDExNzExNDQxMVowczA5BgorBgEEAYRZ
// SIG // CgQBMSswKTAKAgUA6zNviwIBADAGAgEAAgEZMAcCAQAC
// SIG // AhJrMAoCBQDrNMELAgEAMDYGCisGAQQBhFkKBAIxKDAm
// SIG // MAwGCisGAQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEA
// SIG // AgMBhqAwDQYJKoZIhvcNAQELBQADggEBAHR/Xc0eyIf2
// SIG // abI86zhhKnKiG+/hiNMduDi9ms8C9jYlNWpcgC/krPME
// SIG // ecRZXoZYSQT4GnGtvpW/vh2FH0hmTWvvBl4gP40TUc5y
// SIG // DoYMlP8nWib1hXBlDREDpkznAebBV/zpxGZEAJFjA1g4
// SIG // Iq8OcGZthKpZrA2SOsEpDG5xGg5DQD2JgSqWwl4NIMmz
// SIG // chlwYhCObER+5lGBG1w4hWZrj34DVK2RgY9FJaAv2+Il
// SIG // Hba96StfhnZWiHqvNbgbr60UAM4N04T2lf2IGDMRcT0f
// SIG // X2yOfERn5JNywBk4ed0Wk0XwdRmd5dOT0ZrEvoMP937L
// SIG // nExiDy9R0mtplA+1E+YIyGcxggQNMIIECQIBATCBkzB8
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAekP
// SIG // cTB+XfESNgABAAAB6TANBglghkgBZQMEAgEFAKCCAUow
// SIG // GgYJKoZIhvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8GCSqG
// SIG // SIb3DQEJBDEiBCArpVycyzX4yhLhYyQ+zia6dlhnjS0+
// SIG // wSqaxNuj5PFanjCB+gYLKoZIhvcNAQkQAi8xgeowgecw
// SIG // geQwgb0EIKSQkniXaTcmj1TKQWF+x2U4riVorGD8Twmg
// SIG // VbN9qsQlMIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // UENBIDIwMTACEzMAAAHpD3Ewfl3xEjYAAQAAAekwIgQg
// SIG // v8AICUUx5gQPdTBqDuTlLUcQ0ualYtsdLhFioTpmVRgw
// SIG // DQYJKoZIhvcNAQELBQAEggIAo4k3zMWeTT/Cg/9V/JN1
// SIG // 2AwsMDS0UlU6X6M6XvQ2mk1I5D8ur40Tv+Pwd37WBI5v
// SIG // Hns4jgBpY814mhcxEE0F4kTtfrj3r0yKWvAeJ0FgRTQF
// SIG // sO3F/D0xmGq61o4/X9fJzs6JR/Ray4xik2kVolV+BT2g
// SIG // XixfNaxDYkVgL8feYvIPPsPzps8iI1c1Wu+WwZHeJvZh
// SIG // lduiDYj8Igm11k4Av0SBknd2uzrNvzovdoLkvbmnMDGZ
// SIG // dGGNMicMvA1CBliHI3fvRaARGV9ZDp90EkV74H2lnpTi
// SIG // X/kBpy9sYTDP4NxZTAPBvSQ/x1GBUIp5nuN8SZObeh3X
// SIG // DQp86V33GJt2OaqVfBicCxlCfr+SMGpSmxdT/sezXRSQ
// SIG // qgddh4SkQP6+fzaMdbNkm2EYPgL7fDqHDvXiTYau0quA
// SIG // tRkgF4xEEW5Vhp1pUYbaKK17+T1oX9exEA4bTnahmiXu
// SIG // P+ACQ4KBUtvycTjGZQOtI0mO3qw+Ce+womrtKm8NJCE4
// SIG // q4OnmjcIMC/RfV2kI78ef6+SApProVa8QlsF+F/QdXgK
// SIG // +CnxL4nD2WAQvJgo+mwhU1yUNPj0MPdbL6WK5TIi59YQ
// SIG // HptMEzu2KZyksEdu7QfGpQiq1x1rhxjlyZOPPqFldq9z
// SIG // hBGk17zNEX2DuIue9vK8xImlN7BqKVQKR5BJqbHFMUIcvyg=
// SIG // End signature block
