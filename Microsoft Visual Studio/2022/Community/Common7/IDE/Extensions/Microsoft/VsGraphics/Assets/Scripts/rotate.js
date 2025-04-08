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

// services.debug.trace("Rotate");


///////////////////////////////////////////////////////////////////////////////
//
// Global data
//
///////////////////////////////////////////////////////////////////////////////

var useStep = false;
var state = command.getTrait("state");
var stepAmount = 5.0;
var enablePropertyWindow = 8;
var toolProps;

// establish tool options and deal with tool option changes
var manipulatorTraitXYZTraitChangedCookie;

// get manipulator
var manipulatorData = services.manipulators.getManipulatorData("RotationManipulator");
var manipulator = services.manipulators.getManipulator("RotationManipulator");
var undoableItem;

var mxyz = manipulatorData.getTrait("RotationManipulatorTraitXYZ");

var accumDx;
var accumDy;
var accumDz;

var tool = new Object();

var onBeginManipulationHandler;


///////////////////////////////////////////////////////////////////////////////
// designer props bool access
///////////////////////////////////////////////////////////////////////////////
function getDesignerPropAsBool(tname) {
    if (document.designerProps.hasTrait(tname))
        return document.designerProps.getTrait(tname).value;
    return false;
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

function getShouldUsePivot() {
    return getDesignerPropAsBool("usePivot");
}

function getSelectionMode() {
    if (getShouldUsePivot())
        return 0; // default to object mode when using pivot
    if (document.designerProps.hasTrait("SelectionMode"))
        return document.designerProps.getTrait("SelectionMode").value;
    return 0;
}

// setup tool options
function UseStepChanged(sender, args) {
    useStep = document.toolProps.getTrait("UseStep").value;
}

function StepAmountChanged(sender, args) {
    stepAmount = document.toolProps.getTrait("StepAmount").value;
}

var snapCookie;
var toolPropCookie;
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
//
// Helper functions
//
///////////////////////////////////////////////////////////////////////////////

function getWorldMatrix(element) {
    return element.getTrait("WorldTransform").value;
}

function getCameraElement() {
    var camera = document.elements.findElementByTypeId("Microsoft.VisualStudio.3D.PerspectiveCamera");
    return camera;
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

function getRotationTraitId() {
    return "Rotation";
}

///////////////////////////////////////////////////////////////////////////////
//
// helper that given an angle/axis in world space, returns the matrix for
// the rotation in local space of a node
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
// rotate logic
//
///////////////////////////////////////////////////////////////////////////////
function coreRotate(axis) {

    var selectionMode = getSelectionMode();

    var selectedElement = getFirstSelectedWithoutAncestorInSelection();
    if (selectedElement == null) {
        return;
    }

    // get the angle and axis
    var angle = math.getLength(axis);
    axis = math.getNormalized(axis);

    if (selectionMode == 0) {

        //
        // object mode
        //

        // get the selected as node
        var selectedNode = selectedElement.behavior;

        // determine local to world transform
        var localToWorld = selectedElement.getTrait("WorldTransform").value;
        
        // remove scale
        var scale = selectedElement.getTrait("Scale").value;
        var scaleMatrix = math.createScale(scale);
        var scaleInverse = math.getInverse(scaleMatrix);
        localToWorld = math.multiplyMatrix(localToWorld, scaleInverse);

        // get world to local as inverse
        var worldToLocal = math.getInverse(localToWorld);

        // transform the axis into local space
        axis = math.transformNormal(worldToLocal, axis);
        axis = math.getNormalized(axis);

        // compute the rotation matrix in local space
        var rotationDeltaInLocal = math.createRotationAngleAxis(angle, axis);

        // determine the trait name to modify
        var rotationTraitId = getRotationTraitId();

        // get the current rotation value as euler xyz
        var currentRotation = selectedElement.getTrait(rotationTraitId).value;

        // convert to radians
        var factor = 3.14 / 180.0;
        currentRotation[0] *= factor;
        currentRotation[1] *= factor;
        currentRotation[2] *= factor;

        // get the current rotation matrix
        var currentRotationMatrixInLocal = math.createEulerXYZ(
            currentRotation[0],
            currentRotation[1],
            currentRotation[2]
            );

        // compute the new rotation matrix
        var newRotationInLocal = math.multiplyMatrix(currentRotationMatrixInLocal, rotationDeltaInLocal);

        // extract euler angles
        var newXYZ = math.getEulerXYZ(newRotationInLocal);

        // convert to degrees
        var invFactor = 1.0 / factor;
        newXYZ[0] *= invFactor;
        newXYZ[1] *= invFactor;
        newXYZ[2] *= invFactor;

        // check for grid snap
        var isSnapMode = getDesignerPropAsBool("snap");
        if (isSnapMode && stepAmount != 0) {

            //
            // snap to grid is ON
            //

            var targetX = newXYZ[0] + accumDx;
            var targetY = newXYZ[1] + accumDy;
            var targetZ = newXYZ[2] + accumDz;

            var roundedX = Math.round(targetX / stepAmount) * stepAmount;
            var roundedY = Math.round(targetY / stepAmount) * stepAmount;
            var roundedZ = Math.round(targetZ / stepAmount) * stepAmount;

            var halfStep = stepAmount * 0.5;
            var stepPct = halfStep * 0.9;

            var finalXYZ = selectedElement.getTrait(rotationTraitId).value;
            if (Math.abs(roundedX - targetX) < stepPct) {
                finalXYZ[0] = roundedX;
            }

            if (Math.abs(roundedY - targetY) < stepPct) {
                finalXYZ[1] = roundedY;
            }

            if (Math.abs(roundedZ - targetZ) < stepPct) {
                finalXYZ[2] = roundedZ;
            }

            accumDx = targetX - finalXYZ[0];
            accumDy = targetY - finalXYZ[1];
            accumDz = targetZ - finalXYZ[2];

            newXYZ = finalXYZ;
        }

        undoableItem._lastValue = newXYZ;
        undoableItem.onDo();
    }
    else if (selectionMode == 1 || selectionMode == 2 || selectionMode == 3) {
        //
        // polygon or edge selection mode
        //

        localToWorld = selectedElement.getTrait("WorldTransform").value;
        
        // normalize the local to world matrix to remove scale
        var scale = selectedElement.getTrait("Scale").value;
        var scaleMatrix = math.createScale(scale);
        var scaleInverse = math.getInverse(scaleMatrix);
        localToWorld = math.multiplyMatrix(localToWorld, scaleInverse);

        // get world to local as inverse
        var worldToLocal = math.getInverse(localToWorld);

        // transform the axis into local space
        axis = math.transformNormal(worldToLocal, axis);
        axis = math.getNormalized(axis);

        // compute the rotation matrix in local space
        var rotationDeltaInLocal = math.createRotationAngleAxis(angle, axis);
        
        undoableItem._currentDelta = rotationDeltaInLocal;

        undoableItem.onDo();
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// Listens to manipulator position changes
//
///////////////////////////////////////////////////////////////////////////////
function onManipulatorXYZChangedHandler(sender, args) {
    var axis = manipulatorData.getTrait("RotationManipulatorTraitXYZ").value;
    coreRotate(axis);
}

//
// create an object that can be used to do/undo subobject rotation
//
function UndoableSubobjectRotation(elem) {
    
    this._totalDelta = math.createIdentity();
    this._currentDelta = math.createIdentity();

    // find the mesh child
    this._meshElem = findFirstChildMesh(elem);
    if (this._meshElem == null) {
        return;
    }

    // get the manipulator position. we will use this as our rotation origin
    var rotationOrigin = manipulator.getWorldPosition();

    // get the transform into mesh local space
    var localToWorldMatrix = getWorldMatrix(this._meshElem);
    var worldToLocal = math.getInverse(localToWorldMatrix);

    // transform the manipulator position into mesh space
    this._rotationOrigin = math.transformPoint(worldToLocal, rotationOrigin);

    // get the mesh behavior to use later
    this._mesh = this._meshElem.behavior;

    // get the collection element
    var collElem = this._mesh.selectedObjects;
    if (collElem == null) {
        return;
    }

    // clone the collection element
    this._collectionElement = collElem.clone();

    // get the actual collection we can operate on
    this._collection = this._collectionElement.behavior;
    
    // get the geometry we will operate on
    this._geom = this._meshElem.getTrait("Geometry").value
}

//
// called whenever a manipulation is started
//
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

        var traitId = getRotationTraitId();

        function UndoableRotation(trait, traitValues, initialValue, rotationOffset, urrGeom, restoreGeom, meshes, shouldUsePivot) {
            this._traitArray = traitArray;
            this._traitValues = traitValues;
            this._initialValues = initialValue;
            this._restoreGeom = restoreGeom;
            this._currGeom = currGeom;
            this._rotationOffset = rotationOffset;
            this._meshes = meshes;
            this._shouldUsePivot = shouldUsePivot;
        }

        var traitArray = new Array();
        var traitValues = new Array();
        var initialValues = new Array();
        var restoreGeom = new Array();
        var currGeom = new Array();
        var rotationOffset = new Array();
        var meshes = new Array();

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

                var currTrait = currSelected.getTrait(traitId);

                // get the transform to object space
                var localToWorldMatrix = getWorldMatrix(currSelected);
                var worldToLocal = math.getInverse(localToWorldMatrix);

                // get the manipulators position
                var rotationOriginInWorld = manipulator.getWorldPosition(currSelected);

                // get the manip position in object space
                var rotationPivotInObject = math.transformPoint(worldToLocal, rotationOriginInWorld);

                var meshElem = findFirstChildMesh(currSelected);
                if (meshElem != null) {
                    // save the geometry pointer and a copy of the geometry to restore on undo
                    meshes.push(meshElem.behavior);

                    var geom;
                    geom = meshElem.getTrait("Geometry").value;
                    currGeom.push(geom);
                    restoreGeom.push(geom.clone());
                }
                else {
                    meshes.push(null);
                    currGeom.push(null);
                    restoreGeom.push(null);
                }

                traitArray.push(currTrait);
                traitValues.push(currTrait.value);
                initialValues.push(currTrait.value);
                rotationOffset.push(rotationPivotInObject);
            }
        }

        // create the undoable item
        undoableItem = new UndoableRotation(traitArray, traitValues, initialValues, rotationOffset, currGeom, restoreGeom, meshes, getShouldUsePivot());
        undoableItem.onDo = function () {

            var count = this._traitArray.length;

            // movement delta of all the selected is determined by delta of the first selected
            var delta = [0, 0, 0];
            if (count > 0) {
                delta[0] = this._lastValue[0] - this._initialValues[0][0];
                delta[1] = this._lastValue[1] - this._initialValues[0][1];
                delta[2] = this._lastValue[2] - this._initialValues[0][2];
            }

            var factor = 3.14 / 180.0;
            for (i = 0; i < count; i++) {
                var currTrait = this._traitArray[i];
                this._traitValues[i][0] = this._initialValues[i][0] + delta[0];
                this._traitValues[i][1] = this._initialValues[i][1] + delta[1];
                this._traitValues[i][2] = this._initialValues[i][2] + delta[2];

                var theVal = [0, 0, 0];
                theVal[0] = this._traitValues[i][0];
                theVal[1] = this._traitValues[i][1];
                theVal[2] = this._traitValues[i][2];

                // get the current rotation matrix
                if (this._shouldUsePivot) {
                    var theOldVal = this._traitArray[i].value;
                    var currentRotationMatrixInLocal = math.createEulerXYZ(factor * theOldVal[0], factor * theOldVal[1], factor * theOldVal[2]);

                    // get the new rotation matrix
                    var newRotationInLocal = math.createEulerXYZ(factor * theVal[0], factor * theVal[1], factor * theVal[2]);

                    // get the inverse rotation of the old rotation
                    var toOldRotation = math.getInverse(currentRotationMatrixInLocal);

                    // compute the rotation delta as matrix
                    var rotationDelta = math.multiplyMatrix(toOldRotation, newRotationInLocal);
                    rotationDelta = math.getInverse(rotationDelta);

                    // we want to rotate relative to the manipulator position
                    if (this._meshes[i] != null) {
                        var translationMatrix = math.createTranslation(this._rotationOffset[i][0], this._rotationOffset[i][1], this._rotationOffset[i][2]);
                        var invTranslationMatrix = math.getInverse(translationMatrix);
                        var transform = math.multiplyMatrix(rotationDelta, invTranslationMatrix);
                        transform = math.multiplyMatrix(translationMatrix, transform);

                        // apply inverse delta to geometry
                        this._currGeom[i].transform(transform);
                        this._meshes[i].recomputeCachedGeometry();
                    }
                }

                // set the rotation trait value
                this._traitArray[i].value = theVal;
            }
        }

        undoableItem.onUndo = function () {
            var count = this._traitArray.length;
            for (i = 0; i < count; i++) {
                this._traitArray[i].value = this._initialValues[i];
                if (this._shouldUsePivot) {
                    if (this._meshes[i] != null) {
                        this._currGeom[i].copyFrom(this._restoreGeom[i]);
                        this._meshes[i].recomputeCachedGeometry();
                    }
                }
            }
        }
    }
    else {

        // create the undoable item
        undoableItem = new UndoableSubobjectRotation(document.selectedElement);

        if (selectionMode == 1) {
            // polygon selection mode
            undoableItem.getPoints = function () {

                // use map/hash in object to eliminate dups in collection 
                var points = new Object();

                // loop over the point indices in the poly collection
                var polyCount = this._collection.getPolygonCount();
                for (var i = 0; i < polyCount; i++) {
                    var polyIndex = this._collection.getPolygon(i);

                    // get the point count and loop over polygon points
                    var polygonPointCount = this._geom.getPolygonPointCount(polyIndex);
                    for (var j = 0; j < polygonPointCount; j++) {

                        // get the point index
                        var pointIndex = this._geom.getPolygonPoint(polyIndex, j);
                        points[pointIndex] = pointIndex;
                    }
                }
                return points;
            }
        }
        else if (selectionMode == 2) {
            // edge selection mode
            undoableItem.getPoints = function () {

                // use map/hash in object to eliminate dups in collection 
                var points = new Object();

                // loop over the edges
                var edgeCount = this._collection.getEdgeCount();
                for (var i = 0; i < edgeCount; i++) {
                    var edge = this._collection.getEdge(i);

                    points[edge[0]] = edge[0];
                    points[edge[1]] = edge[1];
                }
                return points;
            }
        }
        else if (selectionMode == 3) {
            // edge selection mode
            undoableItem.getPoints = function () {

                // use map/hash in object to eliminate dups in collection
                var points = new Object();

                // loop over the points
                var ptCount = this._collection.getPointCount();
                for (var i = 0; i < ptCount; i++) {
                    var pt = this._collection.getPoint(i);

                    points[pt] = pt;
                }
                return points;
            }
        }

        // do
        undoableItem.onDo = function () {

            // we want to rotate relative to the manipulator position
            var polygonPoints = this.getPoints()

            var translationMatrix = math.createTranslation(this._rotationOrigin[0], this._rotationOrigin[1], this._rotationOrigin[2]);
            var invTranslationMatrix = math.getInverse(translationMatrix);
            var transform = math.multiplyMatrix(this._currentDelta, invTranslationMatrix);
            transform = math.multiplyMatrix(translationMatrix, transform);

            // loop over the unique set of indices and transform the associated point
            for (var key in polygonPoints) {
                var ptIdx = polygonPoints[key];
                var pt = this._geom.getPointAt(ptIdx);

                pt = math.transformPoint(transform, pt);

                this._geom.setPointAt(ptIdx, pt);
            }

            this._totalDelta = math.multiplyMatrix(this._currentDelta, this._totalDelta);

            // invalidate the mesh collision
            this._mesh.recomputeCachedGeometry();
        }

        //
        // undo
        //
        undoableItem.onUndo = function () {

            // we want to rotate relative to the manipulator position
            var polygonPoints = this.getPoints()

            var invTotal = math.getInverse(this._totalDelta);

            // we want to rotate relative to the manipulator position
            var translationMatrix = math.createTranslation(this._rotationOrigin[0], this._rotationOrigin[1], this._rotationOrigin[2]);
            var invTranslationMatrix = math.getInverse(translationMatrix);
            var transform = math.multiplyMatrix(invTotal, invTranslationMatrix);
            transform = math.multiplyMatrix(translationMatrix, transform);

            // loop over the unique set of indices and transform the associated point
            for (var key in polygonPoints) {
                var ptIdx = polygonPoints[key];
                var pt = this._geom.getPointAt(ptIdx);

                pt = math.transformPoint(transform, pt);

                this._geom.setPointAt(ptIdx, pt);
            }

            this._currentDelta = this._totalDelta;
            this._totalDelta = math.createIdentity();

            this._mesh.recomputeCachedGeometry();
        }
    }

    if (undoableItem != null) {
        //
        // getName()
        //
        undoableItem.getName = function () {
            var IDS_MreUndoRotate = 144;
            return services.strings.getStringFromId(IDS_MreUndoRotate);
        }

        services.undoService.addUndoableItem(undoableItem);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// tool method implementations
//
///////////////////////////////////////////////////////////////////////////////

tool.activate = function () {
    state.value = 2;

    createOptions();

    services.manipulators.activate("RotationManipulator");

    onBeginManipulationHandler = manipulator.addHandler("OnBeginManipulation", onBeginManipulation);

    manipulatorTraitXYZTraitChangedCookie = mxyz.addHandler("OnDataChanged", onManipulatorXYZChangedHandler);
}

tool.deactivate = function () {
    state.value = 0;

    toolProps.getTrait("StepAmount").removeHandler("OnDataChanged", toolPropCookie);

    var snapTrait = document.designerProps.getOrCreateTrait("snap", "bool", 0);
    snapTrait.removeHandler("OnDataChanged", snapCookie);

    mxyz.removeHandler("OnDataChanged", manipulatorTraitXYZTraitChangedCookie);
    services.manipulators.deactivate("RotationManipulator");

    manipulator.removeHandler("OnBeginManipulation", onBeginManipulationHandler);
}

// If we're already running, do nothing
if (state.value != 2) {
    document.setTool(tool);
}

// SIG // Begin signature block
// SIG // MIIoNwYJKoZIhvcNAQcCoIIoKDCCKCQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // ExknoqtH+sUrBFmA6SevC9vPXY7sKeLpyqrvkPzsOWCg
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
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCC9pXqIAaWxU5da
// SIG // +TZKM3NR8xboTCtLoQj4WR2kvguCMjBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAHX9bLNmSs+CkjLMhA69+gwmHlOxGTTP
// SIG // TDC1/KbrUSM67jNHEYpmrcffth1U1THUWIEEmozaXejW
// SIG // Bswr5fKQKlRxKjczfv8bx/RRlDZVUQlbq7k7dy2fBNom
// SIG // VMc+3d2yWM96D9Se5SsCzZokWfMu4+lKzyioPlhl9Bir
// SIG // j/z//9deypph1cTefL5BpiEN84ooOPJZxq/xt9ByQeJA
// SIG // KjkEKY9BYVjm3xUhURmVgEYnABcgj7xg9i0EnF8apzLC
// SIG // bJu/qzTZdQt03+NDOSO2d0qIs2ZNmGnxo4b9SsABHLLN
// SIG // epclZ+yDfofoINiNZH/3phVmq39rLg9pYMwD1EA41ftR
// SIG // EL+hgheUMIIXkAYKKwYBBAGCNwMDATGCF4Awghd8Bgkq
// SIG // hkiG9w0BBwKgghdtMIIXaQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // dgAhsmWUjUEN7uuKfhPA/o1DwSmDTjUA9pFMwV46c8IC
// SIG // Bmda3pBHsRgTMjAyNTAxMTYxODIxMTguOTQ1WjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjhEMDAt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR6jCCByAwggUIoAMCAQIC
// SIG // EzMAAAHzxQpDrgPMHTEAAQAAAfMwDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NjAyWhcNMjUwMzA1MTg0NjAyWjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOjhEMDAtMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEA/p+m2uErgfYkjuVjIW54KmAG/s9yH8zaWSFkv7IH
// SIG // 14ZS2Jhp7FLaxl9zlXIPvJKyXYsbjVDDu2QDqgmbF1Iz
// SIG // s/M3J9WlA+Q9q9j4c1Sox7Yr1hoBo+MecKlntUKL97zM
// SIG // /Fh7CrH2nSJVo3wTJ1SlaJjsm0O/to3OGn849lyUEEph
// SIG // PY0EaAaIA8JqmWpHmJyMdBJjrrnD6+u+E+v2Gkz4iGJR
// SIG // n/l1druqEBwJDBuesWD0IpIrUI4zVhwA3wamwRGqqaWr
// SIG // LcaUTXOIndktcVUMXEBl45wIHnlW2z2wKBC4W8Ps91Xr
// SIG // UcLhBSUc0+oW1hIL8/SzGD0m4qBy/MPmYlqN8bsN0e3y
// SIG // bKnu6arJ48L54j+7HxNbrX4u5NDUGTKb4jrP/9t/R+ng
// SIG // OiDlbRfMOuoqRO9RGK3EjazhpU5ubqqvrMjtbnWTnijN
// SIG // MWO9vDXBgxap47hT2xBJuvnrWSn7VPY8Swks6lzlTs3a
// SIG // gPDuV2txONY97OzJUxeEOwWK0Jm6caoU737iJWMCNgM3
// SIG // jtzor3HsycAY9hUIE4lR2nLzEA4EgOxOb8rWpNPjCwZt
// SIG // AHFuCD3q/AOIDhg/aEqa5sgLtSesBZAa39ko5/onjauh
// SIG // cdLVo/CKYN7kL3LoN+40mnReqta1BGqDyGo2QhlZPqOc
// SIG // J+q7fnMHSd/URFON2lgsJ9Avl8cCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBTDZBX2pRFRDIwNwKaFMfag6w0KJDAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEA38Qcj/zR/u/b3N5YjuHO51zP
// SIG // 1ChXAJucOtRcUcT8Ql0V5YjY2e7A6jT9A81EwVPbUuQ6
// SIG // pKkUoiFdeY+6vHunpYPP3A9279LFuBqPQDC+JYQOTAYN
// SIG // 8MynYoXydBPxyKnB19dZsLW6U4gtrIAFIe/jmZ2/U8CR
// SIG // O6WxATyUFMcbgokuf69LNkFYqQZov/DBFtniIuJifrxy
// SIG // OQwmgBqKE+ANef+6DY/c8s0QAU1CAjTa0tfSn68hDeXY
// SIG // eZKjhuEIHGvcOi+wi/krrk2YtEmfGauuYitoUPCDADlc
// SIG // XsAqQ+JWS+jQ7FTUsATVzlJbMTgDtxtMDU/nAboPxw+N
// SIG // wexNqHVX7Oh9hGAmcVEta4EXhndrqkMYENsKzLk2+cpD
// SIG // vqnfuJ4Wn//Ujd4HraJrUJ+SM4XwpK2k9Sp2RfEyN8nt
// SIG // Wd6Z3q9Ap/6deR+8DcA5AQImftos/TVBHmC3zBpvbxKw
// SIG // 1QQ0TIxrBPx6qmO0E0k7Q71O/s2cETxo4mGFBV0/lYJH
// SIG // 3R4haSsONl7JtDHy+Wjmt9RcgjNe/6T0yCk0YirAxd+9
// SIG // EsCMGQI1c4g//UIRBQbvaaIxVCzmb87i+YkhCSHKqKVQ
// SIG // MHWzXa6GYthzfJ3w48yWvAjE5EHkn0LEKSq/NzoQZhNz
// SIG // BdrM/IKnt5aHNOQ1vCTb2d9vCabNyyQgC7dK0DyWJzsw
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
// SIG // Tjo4RDAwLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUAbvoGLNi0YWuaRTu/YNy5H8CkZyiggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOszf00wIhgPMjAyNTAxMTYxMjUx
// SIG // MjVaGA8yMDI1MDExNzEyNTEyNVowdDA6BgorBgEEAYRZ
// SIG // CgQBMSwwKjAKAgUA6zN/TQIBADAHAgEAAgInyDAHAgEA
// SIG // AgISbDAKAgUA6zTQzQIBADA2BgorBgEEAYRZCgQCMSgw
// SIG // JjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIB
// SIG // AAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQAZcFW4c+MX
// SIG // DIM0cRc2gMXbgIzM+fdyCDHscmDk7uXOhe3Rc5SLhZ8h
// SIG // 4pg6MQWWQn0f9oyy9xMFjtJUF+FYmdfn3wcwJ2EDyozp
// SIG // aKrP75pr4Ac9UfVs6rs0skKC/YR0vrLm8CFUicLjXdgb
// SIG // oBxPXLbOKycZa1ptvZF5asoQQVJ2CcPjKZ9G31jyvU3H
// SIG // 050CvDGfOua56gw1Q2miqKTf7srnS7v2w1bR4MKWL0TI
// SIG // jhdGisDvsCTCqXgJLSWgUEdg97OiesY26qHCQzt3Jnuq
// SIG // JXxsT0M+NHyXAmimRwcrW/u+8WrtMav3ErQONiACcoXj
// SIG // 689oFB+louMH4If7CM7H4NKBMYIEDTCCBAkCAQEwgZMw
// SIG // fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAHz
// SIG // xQpDrgPMHTEAAQAAAfMwDQYJYIZIAWUDBAIBBQCgggFK
// SIG // MBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkq
// SIG // hkiG9w0BCQQxIgQgGCGxGA1KB0p7hFa4Y84BY4p+GaUj
// SIG // S6BSoJa681MnAMQwgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCAYvNk0i7bhuFZKfMAZiZP0/kQIfONbBv2g
// SIG // zsMYOjti6DCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAAB88UKQ64DzB0xAAEAAAHzMCIE
// SIG // ILeCFIlUoPKNJWTyz/lqn5nKgLQieBGiq1Xt1RARQEaj
// SIG // MA0GCSqGSIb3DQEBCwUABIICAFeRYmJ2Rupf3Q5c1Uay
// SIG // nKnUDwEctZj3bqSFuv2U8zfnjs8kdigvuWVM0h//nCnK
// SIG // 6dmOU3qveK80nIWmGhJbX0UBq8sVmmOL84OrOMkfqOXb
// SIG // LQeGZ0cQGggMNU9Jvzcb0TH9QlQ7jtr/Zh8VeAPIWj9V
// SIG // Isanv91nkuod9l2ymOCDd8tS6eNWXjsCCl71q1ZLFdnE
// SIG // Hmdx/CNf7Lqz7CYiE2h4ldhsAvUm2GW6yE6sZ/wA92Ry
// SIG // irycYFPKqlWSoIfjPpIj84EPGmpulrNy3U2VNgKpI7Qm
// SIG // +jsmXNsqMaGFSGLb2YEbtctHEdKZoRakivaSQA7VfoYe
// SIG // IpiqBLoihA9eD5T2oaqEBjWEEN2DRRmaHXml2PEQoAAu
// SIG // 4/zxr/j4n32K11Ws8AhYLca/sNsxtdP3+sapFkWMhgMO
// SIG // k4h2rqfgUilHr5ntWpC2oAsq3JPeqKsYJy/zOs9tKWYE
// SIG // 0MokizHFL9Y+tm0G5CAxvuyj1ZeAxMFrZXVus8fbEZ/7
// SIG // 73aZrXCq/Wg8mqYfkH8pKdEqBUJMw+sgptSM1b9GsoCw
// SIG // Z+6TNRjNDYvFflky0FFEej4ifbVySBJy9oz/MZlaITHZ
// SIG // FGL14lR1JaSakCxJ7K8igkqcp/2oZMF3rseZLfYTiGYX
// SIG // 65iRPAx1tfGFQ5I8IEkPgQYRHonGSnpYa6ce0pVB8GjE
// SIG // uLnZ
// SIG // End signature block
