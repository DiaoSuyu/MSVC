//
// Copyright (c) Microsoft Corporation.  All rights reserved.
//
//
// Use of this source code is subject to the terms of the Microsoft shared
// source or premium shared source license agreement under which you licensed
// this source code. If you did not accept the terms of the license agreement,
// you are not authorized to use this source code. For the terms of the license,
// please see the license agreement between you and Microsoft or, if applicable,
// see the SOURCE.RTF on your install media or the root of your tools installation.
// THE SOURCE CODE IS PROVIDED "AS IS", WITH NO WARRANTIES OR INDEMNITIES.
//

///////////////////////////////////////////////////////////////////////////////
// heper to get a designer property as a bool
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

function getCommandState(commandName) {
    var commandData = services.commands.getCommandData(commandName);
    if (commandData != null) {
        var trait = commandData.getTrait("state");
        if (trait != null) {
            return trait.value;
        }
    }
    return -1;
}

///////////////////////////////////////////////////////////////////////////////
// Button state trait
///////////////////////////////////////////////////////////////////////////////
var state = command.getTrait("state");

///////////////////////////////////////////////////////////////////////////////
// Property window and tool option settings 
///////////////////////////////////////////////////////////////////////////////

var enablePropertyWindow = 8;

var stepAmount = 1.0;

function StepAmountChanged(sender, args) {
    stepAmount = document.toolProps.getTrait("StepAmount").value;
}

var toolProps;
var toolPropCookie;
var snapCookie;
function createOptions() {
    toolProps = document.createElement("toolProps", "type", "toolProps");
    toolProps.getOrCreateTrait("StepAmount", "float", enablePropertyWindow);
    document.toolProps = toolProps;

    var snapTrait = document.designerProps.getOrCreateTrait("snap", "bool", 0);
    snapCookie = snapTrait.addHandler("OnDataChanged", OnSnapEnabledTraitChanged);

    toolProps.getTrait("StepAmount").value = stepAmount;

    // Set up the callback when the option traits are changed
    toolPropCookie = toolProps.getTrait("StepAmount").addHandler("OnDataChanged", StepAmountChanged);

    OnSnapEnabledTraitChanged(null, null);
}

function OnSnapEnabledTraitChanged(sender, args) {
    var snapTrait = document.designerProps.getOrCreateTrait("snap", "bool", 0);
    if (toolProps != null) {
        var stepAmountTrait = toolProps.getTrait("StepAmount");
        if (stepAmountTrait != null) {
            var newFlags = stepAmountTrait.flags;
            if (snapTrait.value) {
                newFlags |= enablePropertyWindow;
            }
            else {
                newFlags &= ~enablePropertyWindow;
            }
            stepAmountTrait.flags = newFlags;

            document.refreshPropertyWindow();
        }
    }
}

function getCameraElement()
{
    var camera = document.elements.findElementByTypeId("Microsoft.VisualStudio.3D.PerspectiveCamera");
    return camera;
}

function getWorldMatrix(element) {
    return element.getTrait("WorldTransform").value;
}

// find the mesh child
function findFirstChildMesh(parent) {
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

function getFirstSelectedWithoutAncestorInSelection() {
    var count = services.selection.count;
    for (var i = 0; i < count; i++) {
        var currSelected = services.selection.getElement(i);

        //
        // don't operate on items whose parents (in scene) are ancestors
        // since this will double the amount of translation applied to those
        //
        var hasAncestor = false;
        for (var otherIndex = 0; otherIndex < count; otherIndex++) {
            if (otherIndex != i) {
                var ancestor = services.selection.getElement(otherIndex);
                if (currSelected.behavior.isAncestor(ancestor)) {
                    hasAncestor = true;
                    break;
                }
            }
        }

        if (!hasAncestor) {
            return currSelected;
        }
    }
    return null;
}

///////////////////////////////////////////////////////////////////////////////
// Manipulator registration and event handling
///////////////////////////////////////////////////////////////////////////////
var manipulatorData = services.manipulators.getManipulatorData("ScaleManipulator");
var manipulator = services.manipulators.getManipulator("ScaleManipulator");
var undoableItem;

var manipulatorTraitXYZTraitChangedCookie;
var mxyz;

var accumDx;
var accumDy;
var accumDz;

///////////////////////////////////////////////////////////////////////////////
// Scale logic
///////////////////////////////////////////////////////////////////////////////
function coreScale(dx, dy, dz) {

    var selectionMode = getSelectionMode();

    var selectedElement = getFirstSelectedWithoutAncestorInSelection();

    if (selectedElement == null) {
        return;
    }

    if (selectionMode == 0) {

        //
        // object mode
        //
        var t = selectedElement.getTrait("Scale").value;

        var isSnapMode = getDesignerPropAsBool("snap");
        if (isSnapMode && stepAmount != 0) {

            var targetX = t[0] + dx + accumDx;
            var targetY = t[1] + dy + accumDy;
            var targetZ = t[2] + dz + accumDz;

            var roundedX = Math.round(targetX / stepAmount) * stepAmount;
            var roundedY = Math.round(targetY / stepAmount) * stepAmount;
            var roundedZ = Math.round(targetZ / stepAmount) * stepAmount;

            var halfStep = stepAmount * 0.5;
            var stepPct = halfStep * 0.9;

            if (Math.abs(roundedX - targetX) < stepPct) {
                t[0] = roundedX;
            }

            if (Math.abs(roundedY - targetY) < stepPct) {
                t[1] = roundedY;
            }

            if (Math.abs(roundedZ - targetZ) < stepPct) {
                t[2] = roundedZ;
            }

            accumDx = targetX - t[0];
            accumDy = targetY - t[1];
            accumDz = targetZ - t[2];
        }
        else {
            t[0] = t[0] + dx;
            t[1] = t[1] + dy;
            t[2] = t[2] + dz;
        }

        var minScale = 0.00001;
        if (Math.abs(t[0]) < minScale) {
            t[0] = minScale;
        }
        if (Math.abs(t[1]) < minScale) {
            t[1] = minScale;
        }
        if (Math.abs(t[2]) < minScale) {
            t[2] = minScale;
        }

        undoableItem._lastValue = t;
        undoableItem.onDo();
    }
    else if (selectionMode == 1 || selectionMode == 2 || selectionMode == 3) {

        // subobjects    
        undoableItem._currentDelta[0] = dx;
        undoableItem._currentDelta[1] = dy;
        undoableItem._currentDelta[2] = dz;

        undoableItem.onDo();
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// Listens to manipulator position changes
//
///////////////////////////////////////////////////////////////////////////////
function onManipulatorXYZChangedHandler(sender, args) {
    var xyzDelta = manipulatorData.getTrait("ManipulatorTraitXYZ").value;
    var dx = xyzDelta[0];
    var dy = xyzDelta[1];
    var dz = xyzDelta[2];

    coreScale(dx, dy, dz);
}

function UndoableSubobjectScale(obj, elem) {

    obj._totalDelta = [1, 1, 1];
    obj._currentDelta = [0, 0, 0];
    
    // find the mesh child
    obj._meshElem = findFirstChildMesh(elem);
    if (obj._meshElem == null) {
        return;
    }

    // get the scale origin in local space of node we're manipulating
    var manipulatorToWorld = manipulator.getWorldTransform();
    manipulatorToWorld = math.getNormalizedMatrix(manipulatorToWorld);

    var localToWorldMatrix = getWorldMatrix(obj._meshElem);

    var worldToLocal = math.getInverse(localToWorldMatrix);
    obj._manipulatorToLocal = math.multiplyMatrix(worldToLocal, manipulatorToWorld);
    obj._localToManipulator = math.getInverse(obj._manipulatorToLocal);

    obj._mesh = obj._meshElem.behavior;

    // loop over the elements in the polygon collection
    var collElem = obj._mesh.selectedObjects;
    if (collElem == null) {
        return;
    }

    obj._collectionElem = collElem.clone();

    // get the actual collection we can operate on
    obj._collection = obj._collectionElem.behavior;

    obj._geom = obj._meshElem.getTrait("Geometry").value
}

function SubobjectDoScale(obj)
{
    var polygonPoints = obj.getPoints();
    var lastTotal = [0, 0, 0];

    lastTotal[0] = obj._totalDelta[0];
    lastTotal[1] = obj._totalDelta[1];
    lastTotal[2] = obj._totalDelta[2];

    obj._totalDelta[0] += obj._currentDelta[0];
    obj._totalDelta[1] += obj._currentDelta[1];
    obj._totalDelta[2] += obj._currentDelta[2];

    var scale = [obj._totalDelta[0] / lastTotal[0], obj._totalDelta[1] / lastTotal[1], obj._totalDelta[2] / lastTotal[2]];

    var scaleMatrix = math.createScale(scale);

    var transform = math.multiplyMatrix(scaleMatrix, obj._localToManipulator);
    transform = math.multiplyMatrix(obj._manipulatorToLocal, transform);

    // loop over the unique set of indices and transform the associated point
    for (var key in polygonPoints) {

        var ptIdx = polygonPoints[key];
        var pt = obj._geom.getPointAt(ptIdx);

        pt = math.transformPoint(transform, pt);

        obj._geom.setPointAt(ptIdx, pt);
    }

    // invalidate the mesh collision
    obj._mesh.recomputeCachedGeometry();
}

function SubobjectUndoScale(obj) {
    var polygonPoints = obj.getPoints();

    var scale = [1.0 / obj._totalDelta[0], 1.0 / obj._totalDelta[1], 1.0 / obj._totalDelta[2]];

    var scaleMatrix = math.createScale(scale);

    var transform = math.multiplyMatrix(scaleMatrix, obj._localToManipulator);
    transform = math.multiplyMatrix(obj._manipulatorToLocal, transform);

    // loop over the unique set of indices and transform the associated point
    for (var key in polygonPoints) {

        var ptIdx = polygonPoints[key];
        var pt = obj._geom.getPointAt(ptIdx);

        pt = math.transformPoint(transform, pt);

        obj._geom.setPointAt(ptIdx, pt);
    }

    obj._currentDelta[0] = obj._totalDelta[0] - 1;
    obj._currentDelta[1] = obj._totalDelta[1] - 1;
    obj._currentDelta[2] = obj._totalDelta[2] - 1;

    obj._totalDelta[0] = 1;
    obj._totalDelta[1] = 1;
    obj._totalDelta[2] = 1;

    obj._mesh.recomputeCachedGeometry();
}

function onBeginManipulation() {

    undoableItem = null;

    //
    // Check the selection mode
    //
    var selectionMode = getSelectionMode();
    if (selectionMode == 0) {
        //
        // object selection
        //

        accumDx = 0;
        accumDy = 0;
        accumDz = 0;

        function UndoableScale(trait, traitValues, initialValue) {
            this._traitArray = traitArray;
            this._traitValues = traitValues;
            this._initialValues = initialValue;
        }

        var traitArray = new Array();
        var traitValues = new Array();
        var initialValues = new Array();

        //
        // add the traits of selected items to the collections that we'll be operating on
        //
        var count = services.selection.count;
        for (i = 0; i < count; i++) {
            var currSelected = services.selection.getElement(i);

            //
            // don't operate on items whose parents (in scene) are ancestors
            // since this will double the amount of translation applied to those
            //
            var hasAncestor = false;
            for (var otherIndex = 0; otherIndex < count; otherIndex++) {
                if (otherIndex != i) {
                    var ancestor = services.selection.getElement(otherIndex);
                    if (currSelected.behavior.isAncestor(ancestor)) {
                        hasAncestor = true;
                        break;
                    }
                }
            }

            if (!hasAncestor) {
                var currTrait = currSelected.getTrait("Scale");

                traitArray.push(currTrait);
                traitValues.push(currTrait.value);
                initialValues.push(currTrait.value);
            }
        }


        // create the undoable item
        undoableItem = new UndoableScale(traitArray, traitValues, initialValues);

        undoableItem.onDo = function () {

            var count = this._traitArray.length;

            // movement delta of all the selected is determined by delta of the first selected
            var delta = [0, 0, 0];
            if (count > 0) {
                delta[0] = this._lastValue[0] - this._initialValues[0][0];
                delta[1] = this._lastValue[1] - this._initialValues[0][1];
                delta[2] = this._lastValue[2] - this._initialValues[0][2];
            }

            for (i = 0; i < count; i++) {
                var currTrait = this._traitArray[i];
                this._traitValues[i][0] = this._initialValues[i][0] + delta[0];
                this._traitValues[i][1] = this._initialValues[i][1] + delta[1];
                this._traitValues[i][2] = this._initialValues[i][2] + delta[2];

                var theVal = [this._traitValues[i][0], this._traitValues[i][1], this._traitValues[i][2]];
                this._traitArray[i].value = theVal;
            }
        }

        undoableItem.onUndo = function () {
            var count = this._traitArray.length;
            for (i = 0; i < count; i++) {
                this._traitArray[i].value = this._initialValues[i];
            }
        }
    }
    else {
        
        // create the undoable item
        undoableItem = new Object();
        UndoableSubobjectScale(undoableItem, document.selectedElement);

        if (selectionMode == 1) {
            
            // face selection mode

            // gets the points
            undoableItem.getPoints = function () {

                // map we will store indices in
                // we use the map instead of array to eliminate dups
                var polygonPoints = new Object();

                // loop over the point indices in the poly collection
                var polyCount = this._collection.getPolygonCount();
                for (var i = 0; i < polyCount; i++) {
                    var polyIndex = this._collection.getPolygon(i);

                    // get the point count and loop over polygon points
                    var polygonPointCount = this._geom.getPolygonPointCount(polyIndex);
                    for (var j = 0; j < polygonPointCount; j++) {

                        // get the point index
                        var pointIndex = this._geom.getPolygonPoint(polyIndex, j);
                        polygonPoints[pointIndex] = pointIndex;
                    }
                }

                return polygonPoints;
            }
        }
        else if (selectionMode == 2) {

            // edges selection mode

            // gets the points
            undoableItem.getPoints = function () {

                // we use the map instead of array to eliminate dups
                var polygonPoints = new Object();

                // loop over the edges collection
                var edgeCount = this._collection.getEdgeCount();
                for (var i = 0; i < edgeCount; i++) {
                    var edge = this._collection.getEdge(i);
                    polygonPoints[edge[0]] = edge[0];
                    polygonPoints[edge[1]] = edge[1];
                }

                return polygonPoints;
            }
        }
        else if (selectionMode == 3) {

            // point selection mode

            // gets the points
            undoableItem.getPoints = function () {

                // we use the map instead of array to eliminate dups
                var polygonPoints = new Object();

                // loop over the point indices in the collection
                var ptCount = this._collection.getPointCount();
                for (var i = 0; i < ptCount; i++) {
                    var pt = this._collection.getPoint(i);
                    polygonPoints[pt] = pt;
                }

                return polygonPoints;
            }
        }

        //
        // do
        //
        undoableItem.onDo = function () {
            SubobjectDoScale(this);
        }

        //
        // undo
        //
        undoableItem.onUndo = function () {
            SubobjectUndoScale(this);
        }
    }

    if (undoableItem != null) {
        //
        // getName()
        //
        undoableItem.getName = function () {
            var IDS_MreUndoScale = 145;
            return services.strings.getStringFromId(IDS_MreUndoScale);
        }

        // add to undo stack
        services.undoService.addUndoableItem(undoableItem);
    }
}

//
// the tool
//
var tool = new Object();

var onBeginManipulationHandler;

tool.activate = function () {
    state.value = 2;

    createOptions();

    services.manipulators.activate("ScaleManipulator")

    mxyz = manipulatorData.getTrait("ManipulatorTraitXYZ");

    manipulatorTraitXYZTraitChangedCookie = mxyz.addHandler("OnDataChanged", onManipulatorXYZChangedHandler);

    onBeginManipulationHandler = manipulator.addHandler("OnBeginManipulation", onBeginManipulation);
}

tool.deactivate = function () {
    state.value = 0;

    toolProps.getTrait("StepAmount").removeHandler("OnDataChanged", toolPropCookie);

    var snapTrait = document.designerProps.getOrCreateTrait("snap", "bool", 0);
    snapTrait.removeHandler("OnDataChanged", snapCookie);

    mxyz.removeHandler("OnDataChanged", manipulatorTraitXYZTraitChangedCookie);
    
    manipulator.removeHandler("OnBeginManipulation", onBeginManipulationHandler);

    services.manipulators.deactivate("ScaleManipulator");
}

///////////////////////////////////////////////////////////////////////////////
// Global code
///////////////////////////////////////////////////////////////////////////////
if (state.value != 2) {
    document.setTool(tool);
}
// SIG // Begin signature block
// SIG // MIIoUwYJKoZIhvcNAQcCoIIoRDCCKEACAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // sfppIvAUfmoyDEnMCUyCiCNyBUQJN01CKjbrhRDg+Iqg
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
// SIG // ghomMIIaIgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCANy8WGJO7NaQ/T
// SIG // YFTI8D56WfFGjvAFdw7HpvM/AwO5oTBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAEDVbVhHOWyS750IjMCCE9zNm6X/Dcbs
// SIG // jdiaEHVkJDtkalC2ikgJtblGUA4EZDkBHE3GbkJMk1az
// SIG // HW7WouNaEqN4A3qQ/TgBtdxSQamEAN2byzkXPw+Suh5z
// SIG // tLX0OuM8DBQdz8njYaEqHVL+DzIkEv//mo3UvJbevs3Y
// SIG // OUU/Acf8hu+62KzhXQ3RoTdaiiFHAZZmbki7dhM8QKSv
// SIG // E3NLmMIKxrFAUXvTEiHjPqTDXP5UzAD4UlFIOQD/KZ+u
// SIG // UBSrOQzAo97K1j6BVKnqNVM3GDIBC5IJ9bDmIAQ8Xntb
// SIG // oQ1rmFq9fvBXHG9qKVEUYFskeRODaamW0jVtSb+AX/c2
// SIG // T3ehghewMIIXrAYKKwYBBAGCNwMDATGCF5wwgheYBgkq
// SIG // hkiG9w0BBwKggheJMIIXhQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBWgYLKoZIhvcNAQkQAQSgggFJBIIBRTCCAUEC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // OncO3ARtXZjdp7vkoQhxUUE7g7sp5g+hpvopKtCUGjAC
// SIG // Bmdi1oBilRgTMjAyNTAxMTYxODIxMjcuODg3WjAEgAIB
// SIG // 9KCB2aSB1jCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsG
// SIG // A1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9u
// SIG // cyBMaW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBF
// SIG // U046NEMxQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFNlcnZpY2WgghH+MIIHKDCC
// SIG // BRCgAwIBAgITMwAAAf8SOHz3wWXWoQABAAAB/zANBgkq
// SIG // hkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMDAeFw0yNDA3MjUxODMxMTlaFw0yNTEwMjIxODMx
// SIG // MTlaMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
// SIG // EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExp
// SIG // bWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo0
// SIG // QzFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgU2VydmljZTCCAiIwDQYJKoZIhvcN
// SIG // AQEBBQADggIPADCCAgoCggIBAMnoldKQe24PP6nP5pIg
// SIG // 3SV58yVj2IJPZkxniN6c0KbMq0SURFnCmB3f/XW/oN8+
// SIG // HVOFQpAGRF6r5MT+UDU7QRuSKXsaaYeD4W4iSsL1/lEu
// SIG // CpEhYX9cH5QwGNbbvQkKoYcXxxVe74bZqhywgpg8YWT5
// SIG // ggYff13xSUCFMFWUfEbVJIM5jfW5lomIH19EfmwwJ53F
// SIG // HbadcYxpgqXQTMoJPytId21E1M0B2+JD39spZCj6FhWJ
// SIG // 9hjWIFsPDxgVDtL0zCo2A+qS3gT9IWQ4eT93+MYRi5us
// SIG // ffMbiEKf0RZ8wW4LYcklxpfjU9XGQKhshIU+y9EnUe6k
// SIG // Jb+acAzXq2yt2EhAypN7A4fUutISyTaj+9YhypBte+Rw
// SIG // MoOs5hOad3zja/f3yBKTwJQvGIrMV2hl+EaQwWFSqRo9
// SIG // BQmcIrImbMZtF/cOmUpPDjl3/CcU2FiKn0bls3VIq9Gd
// SIG // 44jjrWg6u13cqQeIGa4a/dCnD0w0cL8utM60HGv9Q9Se
// SIG // z0CQCTm24mm6ItdrrFfGsbZU/3QnjwuJ3XBXGq9b/n5w
// SIG // pYbPbtxZ+i5Bw0WXzc4V4CwxMG+nQOMt7OhvoEN+aPdI
// SIG // 9oumpmmvCbFf3Ahfog0hswMWWNbENZq3TJs8X1s1zerD
// SIG // yTMuPbXbFkyIGVlTkkvblB4UmJG4DMZy3oil3geTAfUD
// SIG // HDknAgMBAAGjggFJMIIBRTAdBgNVHQ4EFgQUw/qV5P60
// SIG // /3exP9EBO4R9MM/ulGEwHwYDVR0jBBgwFoAUn6cVXQBe
// SIG // Yl2D9OXSZacbUzUZ6XIwXwYDVR0fBFgwVjBUoFKgUIZO
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9j
// SIG // cmwvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUy
// SIG // MDIwMTAoMSkuY3JsMGwGCCsGAQUFBwEBBGAwXjBcBggr
// SIG // BgEFBQcwAoZQaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jZXJ0cy9NaWNyb3NvZnQlMjBUaW1lLVN0
// SIG // YW1wJTIwUENBJTIwMjAxMCgxKS5jcnQwDAYDVR0TAQH/
// SIG // BAIwADAWBgNVHSUBAf8EDDAKBggrBgEFBQcDCDAOBgNV
// SIG // HQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQELBQADggIBADkj
// SIG // TeTKS4srp5vOun61iItIXWsyjS4Ead1mT34WIDwtyvwz
// SIG // TMy5YmEFAKelrYKJSK2rYr14zhtZSI2shva+nsOB9Z+V
// SIG // 2XQ3yddgy46KWqeXtYlP2JNHrrT8nzonr327CM05Pxud
// SIG // frolCZO+9p1c2ruoSNihshgSTrwGwFRUdIPKaWcC4IU+
// SIG // M95pBmY6vzuGfz3JlRrYxqbNkwrSOK2YzzVvDuHP+GiU
// SIG // ZmEPzXVvdSUazl0acl60ylD3t5DfDeeo6ZfZKLS4Xb3f
// SIG // PUWzrCTX9l86mwFe141eHGgoJQNm7cw8XMn38F4S7vRz
// SIG // FN3S2EwCPdYEzVBewQPatRL0pQiipTfDddGOIlNJ8iJH
// SIG // 6UcWMgG0cquUD2DyRxgNE8tDw/N2gre/UWtCHQyDErsF
// SIG // 5aVJ8iMscKw8pYHzhssrFgcEP47NuPW6kDmD3acjnYEX
// SIG // vLV3Rq4A6AXrlTivnEQpV6YpjWMK+taGdv5DzM1a80VG
// SIG // DJAV3vVqnUns4fLcrbrpWGHESveaooRdIq0LOv1jkCZb
// SIG // UF+/ZcxVxPRRZZ/TIsdGrPguBz83fktGwTdwN10UTsAL
// SIG // 9NeiArk/IWNSJ8lu48FZjfjpENc3ouui61OUbQM9J08c
// SIG // eTnj8o502iLU0mODhrhlNUl2h+PSUj97fMhmAP76K21u
// SIG // FZ3ng+9tRYMGiU6BxZDiMIIHcTCCBVmgAwIBAgITMwAA
// SIG // ABXF52ueAptJmQAAAAAAFTANBgkqhkiG9w0BAQsFADCB
// SIG // iDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWlj
// SIG // cm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5
// SIG // IDIwMTAwHhcNMjEwOTMwMTgyMjI1WhcNMzAwOTMwMTgz
// SIG // MjI1WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQD
// SIG // Ex1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDCC
// SIG // AiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAOTh
// SIG // pkzntHIhC3miy9ckeb0O1YLT/e6cBwfSqWxOdcjKNVf2
// SIG // AX9sSuDivbk+F2Az/1xPx2b3lVNxWuJ+Slr+uDZnhUYj
// SIG // DLWNE893MsAQGOhgfWpSg0S3po5GawcU88V29YZQ3MFE
// SIG // yHFcUTE3oAo4bo3t1w/YJlN8OWECesSq/XJprx2rrPY2
// SIG // vjUmZNqYO7oaezOtgFt+jBAcnVL+tuhiJdxqD89d9P6O
// SIG // U8/W7IVWTe/dvI2k45GPsjksUZzpcGkNyjYtcI4xyDUo
// SIG // veO0hyTD4MmPfrVUj9z6BVWYbWg7mka97aSueik3rMvr
// SIG // g0XnRm7KMtXAhjBcTyziYrLNueKNiOSWrAFKu75xqRdb
// SIG // Z2De+JKRHh09/SDPc31BmkZ1zcRfNN0Sidb9pSB9fvzZ
// SIG // nkXftnIv231fgLrbqn427DZM9ituqBJR6L8FA6PRc6ZN
// SIG // N3SUHDSCD/AQ8rdHGO2n6Jl8P0zbr17C89XYcz1DTsEz
// SIG // OUyOArxCaC4Q6oRRRuLRvWoYWmEBc8pnol7XKHYC4jMY
// SIG // ctenIPDC+hIK12NvDMk2ZItboKaDIV1fMHSRlJTYuVD5
// SIG // C4lh8zYGNRiER9vcG9H9stQcxWv2XFJRXRLbJbqvUAV6
// SIG // bMURHXLvjflSxIUXk8A8FdsaN8cIFRg/eKtFtvUeh17a
// SIG // j54WcmnGrnu3tz5q4i6tAgMBAAGjggHdMIIB2TASBgkr
// SIG // BgEEAYI3FQEEBQIDAQABMCMGCSsGAQQBgjcVAgQWBBQq
// SIG // p1L+ZMSavoKRPEY1Kc8Q/y8E7jAdBgNVHQ4EFgQUn6cV
// SIG // XQBeYl2D9OXSZacbUzUZ6XIwXAYDVR0gBFUwUzBRBgwr
// SIG // BgEEAYI3TIN9AQEwQTA/BggrBgEFBQcCARYzaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9Eb2NzL1Jl
// SIG // cG9zaXRvcnkuaHRtMBMGA1UdJQQMMAoGCCsGAQUFBwMI
// SIG // MBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1Ud
// SIG // DwQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQY
// SIG // MBaAFNX2VsuP6KJcYmjRPZSQW9fOmhjEMFYGA1UdHwRP
// SIG // ME0wS6BJoEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY3JsL3Byb2R1Y3RzL01pY1Jvb0NlckF1dF8y
// SIG // MDEwLTA2LTIzLmNybDBaBggrBgEFBQcBAQROMEwwSgYI
// SIG // KwYBBQUHMAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYt
// SIG // MjMuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQCdVX38Kq3h
// SIG // LB9nATEkW+Geckv8qW/qXBS2Pk5HZHixBpOXPTEztTnX
// SIG // wnE2P9pkbHzQdTltuw8x5MKP+2zRoZQYIu7pZmc6U03d
// SIG // mLq2HnjYNi6cqYJWAAOwBb6J6Gngugnue99qb74py27Y
// SIG // P0h1AdkY3m2CDPVtI1TkeFN1JFe53Z/zjj3G82jfZfak
// SIG // Vqr3lbYoVSfQJL1AoL8ZthISEV09J+BAljis9/kpicO8
// SIG // F7BUhUKz/AyeixmJ5/ALaoHCgRlCGVJ1ijbCHcNhcy4s
// SIG // a3tuPywJeBTpkbKpW99Jo3QMvOyRgNI95ko+ZjtPu4b6
// SIG // MhrZlvSP9pEB9s7GdP32THJvEKt1MMU0sHrYUP4KWN1A
// SIG // PMdUbZ1jdEgssU5HLcEUBHG/ZPkkvnNtyo4JvbMBV0lU
// SIG // ZNlz138eW0QBjloZkWsNn6Qo3GcZKCS6OEuabvshVGtq
// SIG // RRFHqfG3rsjoiV5PndLQTHa1V1QJsWkBRH58oWFsc/4K
// SIG // u+xBZj1p/cvBQUl+fpO+y/g75LcVv7TOPqUxUYS8vwLB
// SIG // gqJ7Fx0ViY1w/ue10CgaiQuPNtq6TPmb/wrpNPgkNWcr
// SIG // 4A245oyZ1uEi6vAnQj0llOZ0dFtq0Z4+7X6gMTN9vMvp
// SIG // e784cETRkPHIqzqKOghif9lwY1NNje6CbaUFEMFxBmoQ
// SIG // tB1VM1izoXBm8qGCA1kwggJBAgEBMIIBAaGB2aSB1jCB
// SIG // 0zELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWlj
// SIG // cm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVk
// SIG // MScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046NEMxQS0w
// SIG // NUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFNlcnZpY2WiIwoBATAHBgUrDgMCGgMVAKkT
// SIG // jGzEvCXFJXJz5MESxUT1xbKZoIGDMIGApH4wfDELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgUENBIDIwMTAwDQYJKoZIhvcNAQEL
// SIG // BQACBQDrM47zMCIYDzIwMjUwMTE2MTM1ODExWhgPMjAy
// SIG // NTAxMTcxMzU4MTFaMHcwPQYKKwYBBAGEWQoEATEvMC0w
// SIG // CgIFAOszjvMCAQAwCgIBAAICLEgCAf8wBwIBAAICE6Aw
// SIG // CgIFAOs04HMCAQAwNgYKKwYBBAGEWQoEAjEoMCYwDAYK
// SIG // KwYBBAGEWQoDAqAKMAgCAQACAwehIKEKMAgCAQACAwGG
// SIG // oDANBgkqhkiG9w0BAQsFAAOCAQEAfXHd5xTrUh6CCxM9
// SIG // LPtbT3nhZ6csluRvr4fcXFcA2HBE7lBlC4ZJpx7m/d1f
// SIG // os7NlUpJF4r0kAAcqqxc/gRa12TtqmGtC5EUnpyz7Ehs
// SIG // h+UiTYVhj4BgVYbIzlZ8ia8k5X2+vk6ZQCEEvrlMni3d
// SIG // GQvf3Jd4ZaHEXj4k7p/A5g6TIGWELq5tD63sk5qkUZ8g
// SIG // pXR+cDxklkJX29ZJzY7g3S4CFOAa9Zxe66stp/uX6c3A
// SIG // HJx0SWYYAmuCFKxUV5FIvZWgoE/K3lImABCqtZ1x37bI
// SIG // z5pZBO6HhNcFTaunWBgC6V8h85Ju3XRrerCbp1TuehJR
// SIG // HhRkfKP147CkhwgjhzGCBA0wggQJAgEBMIGTMHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB/xI4fPfB
// SIG // ZdahAAEAAAH/MA0GCWCGSAFlAwQCAQUAoIIBSjAaBgkq
// SIG // hkiG9w0BCQMxDQYLKoZIhvcNAQkQAQQwLwYJKoZIhvcN
// SIG // AQkEMSIEIEKWKE7cQq80dofxF2KP3+oXv6KB7ykWILVN
// SIG // y6CsPQPTMIH6BgsqhkiG9w0BCRACLzGB6jCB5zCB5DCB
// SIG // vQQg5DLvvskCd2msnCLjE+rwOyTbjGlTiN6g40hFfLqc
// SIG // p/0wgZgwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMAITMwAAAf8SOHz3wWXWoQABAAAB/zAiBCBEo7J/
// SIG // C7BirKBtf/llvmffcmwXWF0g+R8azcelntvoqTANBgkq
// SIG // hkiG9w0BAQsFAASCAgC26PBvAnvc7eEbcb9/iiflrtEd
// SIG // wS2iFRwNzQjACGIJI6mnlHNRhdJo69Bsl8HSNb86bkNg
// SIG // 14Vbn3QGhcLK/330vsiSvCJ2TcIASFoqCt9PU+XMscDg
// SIG // 9SH44eQRHLHhxc1huioBeqVNjrajZak6KmhDaZ+j1pOI
// SIG // CQ89Chkk+3QthuMO5eJ9KBg1yUYwo5TN3uZrNpU6ZAIz
// SIG // D5i9UQaZb/jsYhq4tjVEYJOD7x6xg74MWEDmNY0G40XQ
// SIG // z2UE/AljeVTxPZ2WXiKqwyene1Ea94B+cwNCJzmsaBVI
// SIG // W6mNHXPEZQCqotjsMtsJPHSqXUHO4lmtNhEpUfjZArje
// SIG // ZMlJMsqLLi0bv5fPhikP2wMU5EALHXqudChVLFYwjQrd
// SIG // jeExo+Q/R0vws5otLDXrwW6ViCdFetktstwt1+tjAZUM
// SIG // extSDRWiweNimEPX2hTK52t/ZAtmoEveV3DK4VbX69Uc
// SIG // l+ZQPR0BWbvTcBIXQMcqPKX7xbIXR1LmnBcc5YLptyCf
// SIG // RAT/KN/cam6Q6vggCMjyliVPRLBSw1lBQWo3HMltTB/F
// SIG // F7LgAosSSdc0Xjd3gLggiPFYiSQyAjhVmX/g4DnGjFCS
// SIG // VGbHd3CNnpr5t7ughtkjXgmDX4ZQ+RgZaRYMcKneG3w5
// SIG // fSEkXRlfqomM3+3/OFmyga4YDoyov4qyuuUKybOVog==
// SIG // End signature block
