define("formattingHelpers", ["require", "exports", "plugin-vs-v2"], function (require, exports, Plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDecimalLocaleString = exports.forceNumberSign = exports.getNativeDigitLocaleString = exports.trimLongString = exports.forceHtmlRendering = exports.forceNonBreakingSpaces = exports.zeroPad = void 0;
    function zeroPad(stringToPad, newLength, padLeft) {
        for (var i = stringToPad.length; i < newLength; i++) {
            stringToPad = (padLeft ? ("0" + stringToPad) : (stringToPad + "0"));
        }
        return stringToPad;
    }
    exports.zeroPad = zeroPad;
    function forceNonBreakingSpaces(stringToConvert) {
        var substitutedString = stringToConvert.replace(/\s/g, function ($0, $1, $2) {
            return "\u00a0";
        });
        return substitutedString;
    }
    exports.forceNonBreakingSpaces = forceNonBreakingSpaces;
    function forceHtmlRendering(stringToConvert) {
        return stringToConvert.replace(/[<>]/g, function ($0, $1, $2) {
            return ($0 === "<") ? "&lt;" : "&gt;";
        });
    }
    exports.forceHtmlRendering = forceHtmlRendering;
    function trimLongString(stringToConvert) {
        var substitutedString = stringToConvert;
        var maxStringLength = 38;
        if (stringToConvert.length > maxStringLength) {
            var substrLength = (maxStringLength / 2) - 2;
            substitutedString = stringToConvert.substr(0, substrLength) + "\u2026" + stringToConvert.substr(-(substrLength));
        }
        return substitutedString;
    }
    exports.trimLongString = trimLongString;
    function getNativeDigitLocaleString(stringToConvert) {
        var nf = Plugin.Culture.numberFormat;
        if (!nf) {
            nf.nativeDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        }
        var substitutedString = stringToConvert.replace(/\d/g, function ($0, $1, $2) {
            return (nf.nativeDigits[parseInt($0)]);
        });
        return substitutedString;
    }
    exports.getNativeDigitLocaleString = getNativeDigitLocaleString;
    function forceNumberSign(numberToConvert, positive) {
        var nf = Plugin.Culture.numberFormat;
        if (!nf) {
            nf.positiveSign = "+";
            nf.negativeSign = "-";
        }
        if (positive === true) {
            return nf.positiveSign + numberToConvert;
        }
        return nf.negativeSign + numberToConvert;
    }
    exports.forceNumberSign = forceNumberSign;
    function getDecimalLocaleString(numberToConvert, includeGroupSeparators, includeSign) {
        var positive = true;
        if (numberToConvert == 0)
            includeSign = false;
        if (numberToConvert < 0) {
            positive = false;
            numberToConvert = numberToConvert * -1;
        }
        var numberString = numberToConvert.toString();
        var nf = Plugin.Culture.numberFormat;
        if (!nf) {
            nf.numberDecimalSeparator = ".";
            nf.numberGroupSizes = [3];
            nf.numberGroupSeparator = ",";
        }
        numberString = getNativeDigitLocaleString(numberString);
        var split = numberString.split(/e/i);
        numberString = split[0];
        var exponent = (split.length > 1 ? parseInt(split[1], 10) : 0);
        split = numberString.split('.');
        numberString = split[0];
        var right = split.length > 1 ? split[1] : "";
        if (exponent > 0) {
            right = zeroPad(right, exponent, false);
            numberString += right.slice(0, exponent);
            right = right.substr(exponent);
        }
        else {
            if (exponent < 0) {
                exponent = -exponent;
                numberString = zeroPad(numberString, exponent + 1, true);
                right = numberString.slice(-exponent, numberString.length) + right;
                numberString = numberString.slice(0, -exponent);
            }
        }
        if (right.length > 0) {
            right = nf.numberDecimalSeparator + right;
        }
        if (includeGroupSeparators === true) {
            var groupSizes = nf.numberGroupSizes;
            var sep = nf.numberGroupSeparator;
            var curSize = groupSizes[0];
            var curGroupIndex = 1;
            var stringIndex = numberString.length - 1;
            var ret = "";
            while (stringIndex >= 0) {
                if (curSize === 0 || curSize > stringIndex) {
                    if (ret.length > 0) {
                        numberString = numberString.slice(0, stringIndex + 1) + sep + ret + right;
                    }
                    else {
                        numberString = numberString.slice(0, stringIndex + 1) + right;
                    }
                    if (includeSign === true)
                        return forceNumberSign(numberString, positive);
                    return numberString;
                }
                if (ret.length > 0) {
                    ret = numberString.slice(stringIndex - curSize + 1, stringIndex + 1) + sep + ret;
                }
                else {
                    ret = numberString.slice(stringIndex - curSize + 1, stringIndex + 1);
                }
                stringIndex -= curSize;
                if (curGroupIndex < groupSizes.length) {
                    curSize = groupSizes[curGroupIndex];
                    curGroupIndex++;
                }
            }
            if (includeSign === true)
                return forceNumberSign(numberString.slice(0, stringIndex + 1) + sep + ret + right, positive);
            return numberString.slice(0, stringIndex + 1) + sep + ret + right;
        }
        else {
            if (includeSign === true)
                return forceNumberSign(numberString + right, positive);
            return numberString + right;
        }
    }
    exports.getDecimalLocaleString = getDecimalLocaleString;
});
define("GCDataSeries", ["require", "exports", "diagnosticsHub", "diagnosticsHub-swimlanes", "plugin-vs-v2"], function (require, exports, DiagHub, DiagHubSwimlanes, Plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GCDataSeries = void 0;
    class GCDataSeries {
        constructor(resources) {
            this._logger = DiagHub.getLogger();
            this._gcEvents = [];
            this._newDataEvent = new DiagHub.AggregatedEvent();
            this._dataWarehouseRequestHandle = 1;
            this._droppedRequest = false;
            this._currentTimespan = new DiagHub.JsonTimespan(DiagHub.BigNumber.zero, DiagHub.BigNumber.zero);
            this._samples = 250;
            this._gcMarker = document.createElement("img");
            this._gcMarker.src = Plugin.Theme.getValue("vs-mma-gc-glyph");
            this._gcMarker.style.width = GCDataSeries._gcMarkerSize + "px";
            this._gcMarker.style.height = GCDataSeries._gcMarkerSize + "px";
            this._title = resources["GcLegendText"];
            this._tooltip = resources["GcLegendTooltipText"];
            DiagHub.loadDataWarehouse()
                .then((dw) => {
                var countersContextData = {
                    customDomain: {
                        CounterId: GCDataSeries.counterId
                    }
                };
                return dw.getFilteredData(countersContextData, GCDataSeries.analyzerId);
            }).then((responseData) => {
                this._countersResult = responseData;
            }).then(() => {
                this._dataWarehouseRequestHandle = null;
                this._droppedRequest = false;
                this.requestUpdate();
            });
        }
        static get counterId() {
            return "ManagedMemoryAnalyzer.Counters.GC";
        }
        static get analyzerId() {
            return "66EDDDF1-2277-40F3-983A-6FF57A433ECB";
        }
        get minValue() {
            return Number.NaN;
        }
        get maxValue() {
            return Number.NaN;
        }
        get marker() {
            return this._gcMarker;
        }
        get title() {
            return this._title;
        }
        get tooltip() {
            return this._tooltip;
        }
        get newDataEvent() {
            return this._newDataEvent;
        }
        dispose() {
            this._countersResult.dispose();
            this._newDataEvent.dispose();
        }
        onViewportChanged(viewport) {
            this._currentTimespan = viewport;
            this.requestUpdate();
        }
        onDataUpdate(timestamp) {
            if (this._currentTimespan.contains(timestamp)) {
                this.requestUpdate();
            }
        }
        draw(context, graphInformation) {
            if (this._gcEvents.length === 0) {
                return;
            }
            this._gcEvents.forEach((point) => {
                var x = DiagHubSwimlanes.Utilities.convertToPixel(point.Timestamp, graphInformation.gridX, graphInformation.chartRect.width) - (GCDataSeries._gcMarkerSize / 2);
                context.drawImage(this._gcMarker, x, 0, GCDataSeries._gcMarkerSize, GCDataSeries._gcMarkerSize);
            });
        }
        getPointAtTimestamp(timestamp, pointToFind) {
            if (this._gcEvents.length === 0) {
                return null;
            }
            var point = { Timestamp: timestamp, Value: 0 };
            var pointCompare = (left, right) => {
                return right.Timestamp.greater(left.Timestamp);
            };
            switch (pointToFind) {
                case DiagHubSwimlanes.PointToFind.LessThanOrEqual:
                    var index = DiagHubSwimlanes.Utilities.findLessThan(this._gcEvents, point, pointCompare);
                    point = this._gcEvents[index];
                    break;
                case DiagHubSwimlanes.PointToFind.GreaterThanOrEqual:
                    var index = DiagHubSwimlanes.Utilities.findGreaterThan(this._gcEvents, point, pointCompare);
                    point = this._gcEvents[index];
                    break;
                case DiagHubSwimlanes.PointToFind.Nearest:
                default:
                    var minIndex = DiagHubSwimlanes.Utilities.findLessThan(this._gcEvents, point, pointCompare);
                    var maxIndex = Math.min(minIndex + 1, this._gcEvents.length - 1);
                    var minDelta = DiagHub.BigNumber.subtract(timestamp, this._gcEvents[minIndex].Timestamp);
                    var maxDelta = DiagHub.BigNumber.subtract(this._gcEvents[maxIndex].Timestamp, timestamp);
                    index = minDelta.greater(maxDelta) ? maxIndex : minIndex;
                    point = this._gcEvents[index];
                    break;
            }
            return {
                timestamp: point.Timestamp,
                tooltip: point.ToolTip
            };
        }
        requestUpdate() {
            if (this._dataWarehouseRequestHandle) {
                this._droppedRequest = true;
                return;
            }
            this._dataWarehouseRequestHandle = window.setTimeout(() => {
                var requestData = {
                    type: "SamplePoints",
                    begin: this._currentTimespan.begin.jsonValue,
                    end: this._currentTimespan.end.jsonValue,
                    samples: Math.max(this._samples, 2)
                };
                this._countersResult.getResult(requestData)
                    .then((result) => this.cachePoints(result))
                    .then(() => {
                    this._dataWarehouseRequestHandle = null;
                    if (this._droppedRequest) {
                        window.setTimeout(this.requestUpdate.bind(this), DiagHubSwimlanes.Constants.TimeoutImmediate);
                        this._droppedRequest = false;
                    }
                }, (error) => {
                    this._logger.error("Error occurred while communicating with the DataWarehouse: " + JSON.stringify(error));
                });
            }, DiagHubSwimlanes.Constants.TimeoutImmediate);
        }
        cachePoints(result) {
            if (result.p.length === 0) {
                this._gcEvents = [];
                return;
            }
            this._gcEvents = result.p.map((point) => {
                var customData = JSON.parse(point.d);
                var duration = DiagHubSwimlanes.RulerUtilities.formatTime(new DiagHub.BigNumber(customData.duration.h, customData.duration.l));
                var forcedTooltipString = customData.forced ? "GcTooltipForced" : "GcTooltipUnforced";
                var tooltipSegments = [];
                tooltipSegments.push(Plugin.Resources.getString("GcTooltipGenerationNumber", customData.generation));
                tooltipSegments.push(Plugin.Resources.getString("GcTooltipDuration", duration));
                tooltipSegments.push(Plugin.Resources.getString(forcedTooltipString));
                return {
                    Timestamp: new DiagHub.BigNumber(point.t.h, point.t.l),
                    CustomData: point.d,
                    ToolTip: tooltipSegments.join('\n')
                };
            });
            this._newDataEvent.invokeEvent(this);
        }
    }
    exports.GCDataSeries = GCDataSeries;
    GCDataSeries._gcMarkerSize = 10;
});
define("MemoryAnalysisHelpers", ["require", "exports", "plugin-vs-v2", "formattingHelpers"], function (require, exports, Plugin, FormattingHelpers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MemoryAnalysisHelpers = exports.DebuggerModeChangedEventArgs = exports.KeyContextConversionRequestType = exports.ViewType = exports.RefGraphDirection = exports.HeapViewBroadcastEventType = exports.SnapshotType = exports.Mouse_Buttons = exports.Key_Presses = exports.FeatureState = exports.DiffResult = exports.DebuggerMode = exports.ContextMenuItem = exports.ContextMenuType = exports.CodeTokenCategory = void 0;
    var CodeTokenCategory;
    (function (CodeTokenCategory) {
        CodeTokenCategory[CodeTokenCategory["Type"] = 0] = "Type";
        CodeTokenCategory[CodeTokenCategory["Field"] = 1] = "Field";
    })(CodeTokenCategory = exports.CodeTokenCategory || (exports.CodeTokenCategory = {}));
    var ContextMenuType;
    (function (ContextMenuType) {
        ContextMenuType[ContextMenuType["First"] = 0] = "First";
        ContextMenuType[ContextMenuType["Types"] = 0] = "Types";
        ContextMenuType[ContextMenuType["Objects"] = 1] = "Objects";
        ContextMenuType[ContextMenuType["BackwardRefGraph"] = 2] = "BackwardRefGraph";
        ContextMenuType[ContextMenuType["ForwardRefGraph"] = 3] = "ForwardRefGraph";
        ContextMenuType[ContextMenuType["BackwardTypesRefGraph"] = 4] = "BackwardTypesRefGraph";
        ContextMenuType[ContextMenuType["ForwardTypesRefGraph"] = 5] = "ForwardTypesRefGraph";
        ContextMenuType[ContextMenuType["AllocationCallStack"] = 6] = "AllocationCallStack";
        ContextMenuType[ContextMenuType["AggregatedCallStacks"] = 7] = "AggregatedCallStacks";
        ContextMenuType[ContextMenuType["AllocationList"] = 8] = "AllocationList";
        ContextMenuType[ContextMenuType["Last"] = 8] = "Last";
    })(ContextMenuType = exports.ContextMenuType || (exports.ContextMenuType = {}));
    var ContextMenuItem;
    (function (ContextMenuItem) {
        ContextMenuItem[ContextMenuItem["Copy"] = 0] = "Copy";
        ContextMenuItem[ContextMenuItem["Separator1"] = 1] = "Separator1";
        ContextMenuItem[ContextMenuItem["AddWatch"] = 2] = "AddWatch";
        ContextMenuItem[ContextMenuItem["QuickWatch"] = 3] = "QuickWatch";
        ContextMenuItem[ContextMenuItem["ViewInstances"] = 4] = "ViewInstances";
        ContextMenuItem[ContextMenuItem["Separator2"] = 5] = "Separator2";
        ContextMenuItem[ContextMenuItem["GoToDefinition"] = 6] = "GoToDefinition";
        ContextMenuItem[ContextMenuItem["FindAllReferences"] = 7] = "FindAllReferences";
        ContextMenuItem[ContextMenuItem["GotoSource"] = 8] = "GotoSource";
    })(ContextMenuItem = exports.ContextMenuItem || (exports.ContextMenuItem = {}));
    var DebuggerMode;
    (function (DebuggerMode) {
        DebuggerMode[DebuggerMode["Attached"] = 0] = "Attached";
        DebuggerMode[DebuggerMode["Running"] = 1] = "Running";
        DebuggerMode[DebuggerMode["Broken"] = 2] = "Broken";
        DebuggerMode[DebuggerMode["Detached"] = 3] = "Detached";
    })(DebuggerMode = exports.DebuggerMode || (exports.DebuggerMode = {}));
    var DiffResult;
    (function (DiffResult) {
        DiffResult[DiffResult["SUCCESS"] = 0] = "SUCCESS";
        DiffResult[DiffResult["FAILURE"] = 1] = "FAILURE";
    })(DiffResult = exports.DiffResult || (exports.DiffResult = {}));
    var FeatureState;
    (function (FeatureState) {
        FeatureState[FeatureState["NotAvailable"] = 0] = "NotAvailable";
        FeatureState[FeatureState["Disabled"] = 1] = "Disabled";
        FeatureState[FeatureState["Enabled"] = 2] = "Enabled";
    })(FeatureState = exports.FeatureState || (exports.FeatureState = {}));
    var Key_Presses;
    (function (Key_Presses) {
        Key_Presses[Key_Presses["ENTER"] = 13] = "ENTER";
        Key_Presses[Key_Presses["SPACE"] = 32] = "SPACE";
        Key_Presses[Key_Presses["DOWNARROW"] = 40] = "DOWNARROW";
    })(Key_Presses = exports.Key_Presses || (exports.Key_Presses = {}));
    var Mouse_Buttons;
    (function (Mouse_Buttons) {
        Mouse_Buttons[Mouse_Buttons["LEFT_BUTTON"] = 1] = "LEFT_BUTTON";
        Mouse_Buttons[Mouse_Buttons["MIDDLE_BUTTON"] = 2] = "MIDDLE_BUTTON";
        Mouse_Buttons[Mouse_Buttons["RIGHT_BUTTON"] = 3] = "RIGHT_BUTTON";
    })(Mouse_Buttons = exports.Mouse_Buttons || (exports.Mouse_Buttons = {}));
    var SnapshotType;
    (function (SnapshotType) {
        SnapshotType[SnapshotType["GC_DUMP"] = 1] = "GC_DUMP";
        SnapshotType[SnapshotType["LIVE_MANAGED"] = 2] = "LIVE_MANAGED";
        SnapshotType[SnapshotType["LIVE_NATIVE"] = 3] = "LIVE_NATIVE";
        SnapshotType[SnapshotType["X86_DUMP"] = 4] = "X86_DUMP";
        SnapshotType[SnapshotType["X64_DUMP"] = 5] = "X64_DUMP";
        SnapshotType[SnapshotType["ARM_DUMP"] = 6] = "ARM_DUMP";
        SnapshotType[SnapshotType["PROFILER_MANAGED"] = 7] = "PROFILER_MANAGED";
        SnapshotType[SnapshotType["PROFILER_NATIVE"] = 8] = "PROFILER_NATIVE";
        SnapshotType[SnapshotType["ARM64_DUMP"] = 9] = "ARM64_DUMP";
    })(SnapshotType = exports.SnapshotType || (exports.SnapshotType = {}));
    var HeapViewBroadcastEventType;
    (function (HeapViewBroadcastEventType) {
        HeapViewBroadcastEventType[HeapViewBroadcastEventType["ANALYSIS_COMPLETE_SUCCESS"] = 0] = "ANALYSIS_COMPLETE_SUCCESS";
        HeapViewBroadcastEventType[HeapViewBroadcastEventType["VIEW_FILTER_CHANGED"] = 1] = "VIEW_FILTER_CHANGED";
        HeapViewBroadcastEventType[HeapViewBroadcastEventType["ANALYSIS_ERROR"] = 2] = "ANALYSIS_ERROR";
    })(HeapViewBroadcastEventType = exports.HeapViewBroadcastEventType || (exports.HeapViewBroadcastEventType = {}));
    var RefGraphDirection;
    (function (RefGraphDirection) {
        RefGraphDirection[RefGraphDirection["Forward"] = 0] = "Forward";
        RefGraphDirection[RefGraphDirection["Backward"] = 1] = "Backward";
    })(RefGraphDirection = exports.RefGraphDirection || (exports.RefGraphDirection = {}));
    var ViewType;
    (function (ViewType) {
        ViewType[ViewType["TypesView"] = 0] = "TypesView";
        ViewType[ViewType["ObjectsView"] = 1] = "ObjectsView";
        ViewType[ViewType["AggregatedStacksView"] = 2] = "AggregatedStacksView";
    })(ViewType = exports.ViewType || (exports.ViewType = {}));
    var KeyContextConversionRequestType;
    (function (KeyContextConversionRequestType) {
        KeyContextConversionRequestType[KeyContextConversionRequestType["AggregateStackByCaller"] = 0] = "AggregateStackByCaller";
        KeyContextConversionRequestType[KeyContextConversionRequestType["AllocationListByCaller"] = 1] = "AllocationListByCaller";
    })(KeyContextConversionRequestType = exports.KeyContextConversionRequestType || (exports.KeyContextConversionRequestType = {}));
    class DebuggerModeChangedEventArgs {
    }
    exports.DebuggerModeChangedEventArgs = DebuggerModeChangedEventArgs;
    class MemoryAnalysisHelpers {
        static getChildById(id, root) {
            if (root.getAttribute("data-id") === id)
                return root;
            if (!root.children)
                return null;
            for (var i = 0; i < root.children.length; i++) {
                var element = MemoryAnalysisHelpers.getChildById(id, root.children[i]);
                if (element)
                    return element;
            }
            return null;
        }
        static getPosition(element, fromCenter = true) {
            var position = new Array();
            var rect = element.getBoundingClientRect();
            position["x"] = rect.left;
            position["y"] = rect.top;
            if (fromCenter) {
                position["x"] += element.offsetWidth / 2;
                position["y"] += element.offsetHeight / 2;
            }
            return position;
        }
        static formatResource(resourceString, ...values) {
            var formatted = Plugin.Resources.getString(resourceString);
            values.forEach((value, i) => {
                formatted = formatted.replace("{" + i + "}", value);
            });
            return formatted;
        }
        static getFormattedDigitLocaleString(source) {
            return FormattingHelpers.getNativeDigitLocaleString(source);
        }
        static getNumberString(value, decimalDigits) {
            return MemoryAnalysisHelpers.getDecimalLocaleString(value, false, decimalDigits);
        }
        static getSignedNumberString(value, decimalDigits) {
            return MemoryAnalysisHelpers.getDecimalLocaleString(value, true, decimalDigits);
        }
        static getDecimalLocaleString(value, forceSign, decimalDigits) {
            return (decimalDigits !== undefined && decimalDigits >= 0) ?
                FormattingHelpers.getDecimalLocaleString(value.toFixed(decimalDigits), true, forceSign) :
                FormattingHelpers.getDecimalLocaleString(value, true, forceSign);
        }
    }
    exports.MemoryAnalysisHelpers = MemoryAnalysisHelpers;
});
window.define("memoryAnalyzerSwimlaneFactory", ["SwimlaneGraphFactory"], (factoryModule) => {
    window.SwimlaneGraphFactory = {
        ManagedMemorySwimlaneFactory: factoryModule.ManagedMemorySwimlaneFactory
    };
});
define("SnapshotDataSeries", ["require", "exports", "diagnosticsHub-swimlanes", "diagnosticsHub", "MemoryAnalysisHelpers", "plugin-vs-v2"], function (require, exports, DiagHubSwimlanes, DiagHub, MemoryAnalysisHelpers_1, Plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnapshotDataSeries = exports.SnapshotDataSeriesElement = void 0;
    class SnapshotDataSeriesElement {
        constructor(data, unitConverter) {
            this._timestamp = new DiagHub.BigNumber(data.TimeInNs.h, data.TimeInNs.l);
            var tooltipList = [data.Name];
            data.Heaps.forEach((heap) => {
                if (heap.Type === MemoryAnalysisHelpers_1.SnapshotType.LIVE_MANAGED || heap.Type === MemoryAnalysisHelpers_1.SnapshotType.PROFILER_MANAGED) {
                    tooltipList.push(Plugin.Resources.getString("SnapshotTooltipManagedCount", heap.Count));
                    tooltipList.push(Plugin.Resources.getString("SnapshotTooltipManagedSize", unitConverter.formatNumber(heap.Size)));
                }
                else if (heap.Type === MemoryAnalysisHelpers_1.SnapshotType.LIVE_NATIVE || heap.Type === MemoryAnalysisHelpers_1.SnapshotType.PROFILER_NATIVE) {
                    tooltipList.push(Plugin.Resources.getString("SnapshotTooltipNativeCount", heap.Count));
                    tooltipList.push(Plugin.Resources.getString("SnapshotTooltipNativeSize", unitConverter.formatNumber(heap.Size)));
                }
            });
            this._tooltip = tooltipList.join("\n");
        }
        get timestamp() {
            return this._timestamp;
        }
        get tooltip() {
            return this._tooltip;
        }
    }
    exports.SnapshotDataSeriesElement = SnapshotDataSeriesElement;
    class SnapshotDataSeries {
        constructor(unitConverter, resources) {
            this._snapshots = [];
            this._newDataEvent = new DiagHub.AggregatedEvent();
            this._unitConverter = unitConverter;
            this._snapshotMarker = document.createElement("img");
            this._snapshotMarker.setAttribute("aria-label", resources["SnapshotLegendText"]);
            this._snapshotMarker.src = Plugin.Theme.getValue("vs-mma-snapshot-glyph");
            this._snapshotMarker.style.width = SnapshotDataSeries._snapshotMarkerSize + "px";
            this._snapshotMarker.style.height = SnapshotDataSeries._snapshotMarkerSize + "px";
            this._title = resources["SnapshotLegendText"];
            this._tooltip = resources["SnapshotLegendTooltipText"];
            this._onNewSnapshotDataBoundFunction = this.onNewSnapshotData.bind(this);
            this._summaryViewModelMarshaler = Plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.Debugger.LiveMemorySummaryViewModelMarshaler", {}, false);
            this._summaryViewModelMarshaler.addEventListener("SummaryViewUpdatedEvent", this._onNewSnapshotDataBoundFunction);
            this._summaryViewModelMarshaler._call("GetCurrentProcessSnapshots")
                .then((snapshots) => { this.onNewSnapshotData({ Snapshots: snapshots }); });
        }
        get minValue() {
            return Number.NaN;
        }
        get maxValue() {
            return Number.NaN;
        }
        get marker() {
            return this._snapshotMarker;
        }
        get title() {
            return this._title;
        }
        get tooltip() {
            return this._tooltip;
        }
        get newDataEvent() {
            return this._newDataEvent;
        }
        dispose() {
            this._summaryViewModelMarshaler.removeEventListener("SummaryViewUpdatedEvent", this._onNewSnapshotDataBoundFunction);
            this._newDataEvent.dispose();
        }
        onViewportChanged(viewport) {
        }
        getPointAtTimestamp(timestamp, pointToFind) {
            if (this._snapshots.length === 0) {
                return null;
            }
            var point = { timestamp: timestamp };
            var snapshotDataSeriesElementLessThan = (left, right) => {
                return right.timestamp.greater(left.timestamp);
            };
            switch (pointToFind) {
                case DiagHubSwimlanes.PointToFind.LessThanOrEqual:
                    var index = DiagHubSwimlanes.Utilities.findLessThan(this._snapshots, point, snapshotDataSeriesElementLessThan);
                    return this._snapshots[index];
                case DiagHubSwimlanes.PointToFind.GreaterThanOrEqual:
                    var index = DiagHubSwimlanes.Utilities.findGreaterThan(this._snapshots, point, snapshotDataSeriesElementLessThan);
                    return this._snapshots[index];
                case DiagHubSwimlanes.PointToFind.Nearest:
                default:
                    var minIndex = DiagHubSwimlanes.Utilities.findLessThan(this._snapshots, point, snapshotDataSeriesElementLessThan);
                    var maxIndex = Math.min(minIndex + 1, this._snapshots.length - 1);
                    var minDelta = DiagHub.BigNumber.subtract(timestamp, this._snapshots[minIndex].timestamp);
                    var maxDelta = DiagHub.BigNumber.subtract(this._snapshots[maxIndex].timestamp, timestamp);
                    index = minDelta.greater(maxDelta) ? maxIndex : minIndex;
                    return this._snapshots[index];
            }
        }
        draw(context, graphInformation) {
            if (this._snapshots.length === 0) {
                return;
            }
            var markerHalfWidth = (SnapshotDataSeries._snapshotMarkerSize / 2);
            this._snapshots.forEach((snapshot) => {
                var x = DiagHubSwimlanes.Utilities.convertToPixel(snapshot.timestamp, graphInformation.gridX, graphInformation.chartRect.width) - markerHalfWidth;
                if (x >= -markerHalfWidth && x < (graphInformation.chartRect.width + markerHalfWidth)) {
                    context.drawImage(this._snapshotMarker, x, 0, SnapshotDataSeries._snapshotMarkerSize, SnapshotDataSeries._snapshotMarkerSize);
                }
            });
        }
        onNewSnapshotData(eventArgs) {
            this._snapshots = eventArgs.Snapshots.map((snapshot) => new SnapshotDataSeriesElement(snapshot, this._unitConverter));
            this._newDataEvent.invokeEvent(this);
        }
    }
    exports.SnapshotDataSeries = SnapshotDataSeries;
    SnapshotDataSeries._snapshotMarkerSize = 10;
});
define("SwimlaneGraphFactory", ["require", "exports", "SnapshotDataSeries", "diagnosticsHub-swimlanes", "GCDataSeries"], function (require, exports, SnapshotDataSeries_1, DiagHubSwimlanes, GCDataSeries_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManagedMemorySwimlaneFactory = void 0;
    function ManagedMemorySwimlaneFactory(componentConfig, isVisible, selectionEnabled, graphBehaviour, currentTimespan, selectionTimespan) {
        var swimlaneConfig = new DiagHubSwimlanes.SwimlaneConfiguration(componentConfig, currentTimespan, graphBehaviour);
        swimlaneConfig.header.isBodyExpanded = isVisible;
        var unitConverter = new DiagHubSwimlanes.LocalizedUnitConverter(swimlaneConfig.graph.jsonConfig.Units, swimlaneConfig.graph.resources);
        var additionalSeries = [];
        if (componentConfig.JsonObject.ShowGcData) {
            var gcSeries = new GCDataSeries_1.GCDataSeries(swimlaneConfig.graph.resources);
            additionalSeries.push(gcSeries);
            swimlaneConfig.graph.legend.push({
                legendText: gcSeries.title,
                legendTooltip: gcSeries.tooltip,
                marker: gcSeries.marker
            });
        }
        var snapshotSeries = new SnapshotDataSeries_1.SnapshotDataSeries(unitConverter, swimlaneConfig.graph.resources);
        additionalSeries.push(snapshotSeries);
        swimlaneConfig.graph.legend.push({
            legendText: snapshotSeries.title,
            legendTooltip: snapshotSeries.tooltip,
            marker: snapshotSeries.marker
        });
        var graph = new DiagHubSwimlanes.MultiSeriesGraph(swimlaneConfig.graph, additionalSeries);
        graph.container.setAttribute("aria-label", componentConfig.Title);
        var leftScale = new DiagHubSwimlanes.Scale(swimlaneConfig.graph.scale, DiagHubSwimlanes.ScaleType.Left, unitConverter);
        var rightScale = new DiagHubSwimlanes.Scale(swimlaneConfig.graph.scale, DiagHubSwimlanes.ScaleType.Right, unitConverter);
        graph.scaleChangedEvent.addEventListener(leftScale.onScaleChanged.bind(leftScale));
        graph.scaleChangedEvent.addEventListener(rightScale.onScaleChanged.bind(rightScale));
        var swimlane = new DiagHubSwimlanes.SwimlaneBase(swimlaneConfig.header, swimlaneConfig.graph.height, currentTimespan, selectionTimespan);
        graph.scaleChangedEvent.addEventListener(swimlane.onScaleChanged.bind(swimlane));
        swimlane.addTitleControl(new DiagHubSwimlanes.Legend(swimlaneConfig.graph.legend));
        swimlane.addMainRegionControl(new DiagHubSwimlanes.SelectionOverlay(graph, currentTimespan, selectionTimespan));
        swimlane.addMainRegionControl(new DiagHubSwimlanes.GridLineRenderer(currentTimespan));
        swimlane.addLeftRegionControl(leftScale);
        swimlane.addRightRegionControl(rightScale);
        return swimlane;
    }
    exports.ManagedMemorySwimlaneFactory = ManagedMemorySwimlaneFactory;
});
