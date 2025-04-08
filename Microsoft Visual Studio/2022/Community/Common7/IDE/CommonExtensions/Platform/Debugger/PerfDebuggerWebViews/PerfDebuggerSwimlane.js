define("src/debugger/PerfDebuggerWebViews/PortMarshallerContracts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnapshotStatus = exports.DebugMode = exports.SwimlaneDataChangedAction = exports.EventColor = exports.BreakEventType = exports.PortMarshallerConstants = void 0;
    class PortMarshallerConstants {
    }
    exports.PortMarshallerConstants = PortMarshallerConstants;
    PortMarshallerConstants.PortMarshallerName = "PerformanceDebugger.DiagnosticEventsPortMarshaller";
    PortMarshallerConstants.SwimlaneDataChangedEvent = "SwimlaneDataChangedEvent";
    PortMarshallerConstants.TabularViewSelectionChangedEvent = "TabularViewSelectionChangedEvent";
    PortMarshallerConstants.DebugModeChangedEvent = "DebugModeChangedEvent";
    PortMarshallerConstants.ActivatedDataChangedEvent = "ActivatedDataChangedEvent";
    PortMarshallerConstants.FocusOnLastBreakEvent = "FocusOnLastBreakEvent";
    PortMarshallerConstants.NotifySelectionTimeRangeChanged = "NotifySelectionTimeRangeChanged";
    PortMarshallerConstants.NotifyViewPortChanged = "NotifyViewPortChanged";
    PortMarshallerConstants.NotifyClientSizeChanged = "NotifyClientSizeChanged";
    PortMarshallerConstants.NotifySwimlaneIsVisibleChanged = "NotifySwimlaneIsVisibleChanged";
    PortMarshallerConstants.NotifySwimlaneDataSelectionChanged = "NotifySwimlaneDataSelectionChanged";
    PortMarshallerConstants.NotifyReadyForData = "NotifyReadyForData";
    PortMarshallerConstants.NotifyQueryPreviousBreakEvent = "NotifyQueryPreviousBreakEvent";
    PortMarshallerConstants.NotifyQueryNextBreakEvent = "NotifyQueryNextBreakEvent";
    PortMarshallerConstants.NotifyViewableViewportBase = "NotifyViewableViewportBase";
    PortMarshallerConstants.SwimlaneAcknowledgeData = "SwimlaneAcknowledgeData";
    PortMarshallerConstants.TrackConfigurations = "TrackConfigurations";
    PortMarshallerConstants.EventKinds = "EventKinds";
    PortMarshallerConstants.BreakEventKindName = "Break";
    PortMarshallerConstants.IntelliTraceEventKindName = "IntelliTrace";
    PortMarshallerConstants.InvalidEventKindId = 0;
    PortMarshallerConstants.InvalidTimeValue = -1;
    PortMarshallerConstants.InvalidDiagnosticDataId = 0;
    var BreakEventType;
    (function (BreakEventType) {
        BreakEventType[BreakEventType["None"] = 0] = "None";
        BreakEventType[BreakEventType["AsyncBreak"] = 1] = "AsyncBreak";
        BreakEventType[BreakEventType["Breakpoint"] = 2] = "Breakpoint";
        BreakEventType[BreakEventType["Exception"] = 3] = "Exception";
        BreakEventType[BreakEventType["StepComplete"] = 4] = "StepComplete";
        BreakEventType[BreakEventType["ExceptionIntercepted"] = 5] = "ExceptionIntercepted";
        BreakEventType[BreakEventType["EntryPoint"] = 6] = "EntryPoint";
    })(BreakEventType = exports.BreakEventType || (exports.BreakEventType = {}));
    var EventColor;
    (function (EventColor) {
        EventColor[EventColor["None"] = 0] = "None";
        EventColor[EventColor["ExceptionColor"] = 1] = "ExceptionColor";
        EventColor[EventColor["UnimportantColor"] = 2] = "UnimportantColor";
        EventColor[EventColor["TracepointColor"] = 3] = "TracepointColor";
    })(EventColor = exports.EventColor || (exports.EventColor = {}));
    var SwimlaneDataChangedAction;
    (function (SwimlaneDataChangedAction) {
        SwimlaneDataChangedAction[SwimlaneDataChangedAction["Clear"] = 0] = "Clear";
        SwimlaneDataChangedAction[SwimlaneDataChangedAction["Reset"] = 1] = "Reset";
        SwimlaneDataChangedAction[SwimlaneDataChangedAction["Add"] = 2] = "Add";
    })(SwimlaneDataChangedAction = exports.SwimlaneDataChangedAction || (exports.SwimlaneDataChangedAction = {}));
    var DebugMode;
    (function (DebugMode) {
        DebugMode[DebugMode["None"] = 0] = "None";
        DebugMode[DebugMode["Break"] = 1] = "Break";
        DebugMode[DebugMode["Design"] = 2] = "Design";
        DebugMode[DebugMode["Run"] = 3] = "Run";
    })(DebugMode = exports.DebugMode || (exports.DebugMode = {}));
    var SnapshotStatus;
    (function (SnapshotStatus) {
        SnapshotStatus[SnapshotStatus["Unknown"] = 0] = "Unknown";
        SnapshotStatus[SnapshotStatus["None"] = 1] = "None";
        SnapshotStatus[SnapshotStatus["Removed"] = 2] = "Removed";
        SnapshotStatus[SnapshotStatus["Present"] = 3] = "Present";
    })(SnapshotStatus = exports.SnapshotStatus || (exports.SnapshotStatus = {}));
});
define("src/debugger/PerfDebuggerWebViews/IntelliTraceGraphConfiguration", ["require", "exports", "src/debugger/PerfDebuggerWebViews/PortMarshallerContracts"], function (require, exports, PortMarshallerContracts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntelliTraceGraphConfiguration = void 0;
    class IntelliTraceGraphConfiguration {
        constructor(graphConfig) {
            this._allTrackConfigurations = null;
            this._eventKindNameToId = null;
            this._eventKindIdToName = null;
            if (!graphConfig) {
                return;
            }
            this._allTrackConfigurations = graphConfig[PortMarshallerContracts_1.PortMarshallerConstants.TrackConfigurations];
            var eventKindNameToId = {};
            var eventKindIdToName = {};
            graphConfig[PortMarshallerContracts_1.PortMarshallerConstants.EventKinds].forEach(function (pair) {
                eventKindNameToId[pair.Key] = pair.Value;
                eventKindIdToName[pair.Value] = pair.Key;
            });
            this._eventKindNameToId = eventKindNameToId;
            this._eventKindIdToName = eventKindIdToName;
        }
        get trackConfigurations() {
            return this._allTrackConfigurations;
        }
        get eventKindNameToId() {
            return this._eventKindNameToId;
        }
        get eventKindIdToName() {
            return this._eventKindIdToName;
        }
        get enabledTrackCount() {
            return this._allTrackConfigurations.length;
        }
    }
    exports.IntelliTraceGraphConfiguration = IntelliTraceGraphConfiguration;
});
define("src/debugger/PerfDebuggerWebViews/TelemetryServiceMarshallerContracts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryServiceMarshallerConstants = void 0;
    class TelemetryServiceMarshallerConstants {
    }
    exports.TelemetryServiceMarshallerConstants = TelemetryServiceMarshallerConstants;
    TelemetryServiceMarshallerConstants.PortMarshallerName = "PerformanceDebugger.DebuggerEventsTelemetryPortMarshaller";
    TelemetryServiceMarshallerConstants.SelectDiagnosticEvent = "Telemetry.SelectDiagnosticEvent";
    TelemetryServiceMarshallerConstants.HoverDiagnosticEvent = "Telemetry.HoverDiagnosticEvent";
    TelemetryServiceMarshallerConstants.DefaultHoverEventDelay = 500;
});
define("src/debugger/PerfDebuggerWebViews/TelemetryService", ["require", "exports", "plugin-vs-v2", "src/debugger/PerfDebuggerWebViews/TelemetryServiceMarshallerContracts"], function (require, exports, plugin_vs_v2_1, TelemetryServiceMarshallerContracts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    class TelemetryService {
        static onSelectDiagnosticEvent(telemetryType, isSelected, snapshotStatus) {
            this._adapter._call(TelemetryServiceMarshallerContracts_1.TelemetryServiceMarshallerConstants.SelectDiagnosticEvent, telemetryType, isSelected, snapshotStatus);
        }
        static onHoverDiagnosticEvent(telemetryType) {
            this._adapter._call(TelemetryServiceMarshallerContracts_1.TelemetryServiceMarshallerConstants.HoverDiagnosticEvent, telemetryType);
        }
    }
    exports.TelemetryService = TelemetryService;
    TelemetryService._adapter = plugin_vs_v2_1.JSONMarshaler.attachToMarshaledObject(TelemetryServiceMarshallerContracts_1.TelemetryServiceMarshallerConstants.PortMarshallerName, {}, true);
});
define("src/debugger/PerfDebuggerWebViews/SwimlaneTimeRange", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwimlaneTimeRange = void 0;
    class SwimlaneTimeRange {
        constructor(viewportController) {
            this._viewportController = null;
            this._viewportController = viewportController;
        }
        get beginInHubTime() {
            return this._viewportController.visible.begin;
        }
        get endInHubTime() {
            return this._viewportController.visible.end;
        }
        get durationInHubTime() {
            return this._viewportController.visible.elapsed;
        }
        get begin() {
            return SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this.beginInHubTime);
        }
        get end() {
            return SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this.endInHubTime);
        }
        get duration() {
            return SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this.durationInHubTime);
        }
        contains(time) {
            return (this.begin <= time) && (time <= this.end);
        }
        isOverlap(beginTime, endTime) {
            if (beginTime < endTime) {
                return Math.min(this.end, endTime) - Math.max(this.begin, beginTime) > 0;
            }
            else if (beginTime === endTime) {
                return this.contains(beginTime);
            }
            else {
                return false;
            }
        }
        equals(other) {
            return (this.begin == other.begin) && (this.end == other.end);
        }
        isValid() {
            return (this.begin >= 0) && (this.end > this.begin);
        }
        static unsafeConvertBigNumberToNumber(bigNumber) {
            return parseInt(bigNumber.value);
        }
    }
    exports.SwimlaneTimeRange = SwimlaneTimeRange;
});
define("src/debugger/PerfDebuggerWebViews/SwimlaneViewPort", ["require", "exports", "diagnosticsHub", "src/debugger/PerfDebuggerWebViews/SwimlaneTimeRange"], function (require, exports, DiagHub, SwimlaneTimeRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwimlaneViewport = void 0;
    class SwimlaneViewport {
        constructor(viewportController) {
            this.timeRange = null;
            this.clientWidth = 0;
            this._isVisible = true;
            this._oldViewableBase = DiagHub.BigNumber.zero;
            this._viewEventManager = null;
            this._viewportController = null;
            this._viewEventManager = DiagHub.getViewEventManager();
            this._viewportController = viewportController;
            this.timeRange = new SwimlaneTimeRange_1.SwimlaneTimeRange(this._viewportController);
        }
        get viewableBase() {
            return this._viewportController.viewable.begin;
        }
        get viewableEnd() {
            return this._viewportController.viewable.end;
        }
        get isVisible() {
            return this._isVisible;
        }
        set isVisible(value) {
            this._isVisible = value;
        }
        get pixelsPerNanosecond() {
            if (!this.isVisible) {
                return 0;
            }
            return this.clientWidth / (this.timeRange.duration);
        }
        get nanosecondsPerPixel() {
            if (!this.isVisible) {
                return 0;
            }
            return (this.timeRange.duration) / this.clientWidth;
        }
        get viewEventManager() {
            return this._viewEventManager;
        }
        isViewableBaseChanged() {
            if (this._oldViewableBase !== this.viewableBase) {
                this._oldViewableBase = this.viewableBase;
                return true;
            }
            return false;
        }
        getTimeOffset(time) {
            return time - this.timeRange.begin;
        }
        isInViewport(time) {
            return this.timeRange.contains(time);
        }
        isBeforeViewport(time) {
            return time < this.timeRange.begin;
        }
        isAfterViewport(time) {
            return time > this.timeRange.end;
        }
        isOverlapViewport(beginTime, endTime) {
            return this.timeRange.isOverlap(beginTime, endTime);
        }
        selectTimeRange(beginTimeNanoseconds, endTimeNanoseconds) {
            var beginTime = DiagHub.BigNumber.convertFromNumber(beginTimeNanoseconds);
            var endTime = DiagHub.BigNumber.convertFromNumber(endTimeNanoseconds);
            if (this.viewableBase.greater(beginTime)) {
                beginTime = this.viewableBase;
            }
            var selectedTimespan = new DiagHub.JsonTimespan(beginTime, endTime);
            this.selectTimeSpan(selectedTimespan);
        }
        clearTimeSelection() {
            this.selectTimeSpan(null);
        }
        enableAutoScrolling() {
            var newViewport = new DiagHub.JsonTimespan(DiagHub.BigNumber.zero, DiagHub.BigNumber.zero);
            this.changeViewport(newViewport, this._viewportController.selection);
        }
        disableAutoScrolling() {
            var newViewport = new DiagHub.JsonTimespan(this.timeRange.beginInHubTime, this.timeRange.endInHubTime);
            this.changeViewport(newViewport, this._viewportController.selection);
        }
        changeViewport(newViewport, newSelectedTime) {
            var viewportChangedArgs = {
                currentTimespan: newViewport,
                selectionTimespan: newSelectedTime,
                isIntermittent: false,
            };
            this._viewportController.requestViewportChange(viewportChangedArgs);
        }
        centerViewportTo(beginTimeNanoseconds) {
            this.centerViewportWithSelectedTime(beginTimeNanoseconds, this._viewportController.selection);
        }
        centerViewportWithSelectedTime(beginTimeNanoseconds, newSelectedTime) {
            var targetTime = DiagHub.BigNumber.convertFromNumber(Math.max(beginTimeNanoseconds, 0));
            var duration = this.timeRange.durationInHubTime;
            var halfDuration = DiagHub.BigNumber.divideNumber(duration, 2);
            var beginTime = DiagHub.BigNumber.subtract(targetTime, halfDuration);
            if (this.viewableBase.greater(beginTime)) {
                beginTime = this.viewableBase;
            }
            var endTime = DiagHub.BigNumber.add(beginTime, duration);
            if (endTime.greater(this.viewableEnd)) {
                endTime = this.viewableEnd;
                beginTime = DiagHub.BigNumber.subtract(endTime, duration);
            }
            var newViewport = new DiagHub.JsonTimespan(beginTime, endTime);
            this.changeViewport(newViewport, newSelectedTime);
        }
        alignViewportWithSelectedTime(beginTimeNanoseconds, newSelectedTime) {
            var beginTime = DiagHub.BigNumber.convertFromNumber(Math.max(beginTimeNanoseconds, 0));
            if (this.viewableBase.greater(beginTime)) {
                beginTime = this.viewableBase;
            }
            var endTime = DiagHub.BigNumber.add(beginTime, DiagHub.BigNumber.convertFromNumber(this.timeRange.duration));
            var newViewport = new DiagHub.JsonTimespan(beginTime, endTime);
            this.changeViewport(newViewport, newSelectedTime);
        }
        selectTimeSpan(timeSpan) {
            var selectedTimeChangedArgs = {
                position: timeSpan,
                isIntermittent: false
            };
            this._viewEventManager.selectionChanged.raiseEvent(selectedTimeChangedArgs);
        }
        ensureTimeInsideSelection(time) {
            var currentSelection = this._viewportController.selection;
            if (currentSelection == null) {
                return;
            }
            var selectionTimeRangeBegin = SwimlaneTimeRange_1.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(currentSelection.begin);
            var selectionTimeRangeEnd = SwimlaneTimeRange_1.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(currentSelection.end);
            var newBeginTime = Math.min(time, selectionTimeRangeBegin);
            var newEndTime = Math.max(time, selectionTimeRangeEnd);
            if ((newBeginTime != selectionTimeRangeBegin) || (newEndTime != selectionTimeRangeEnd)) {
                this.selectTimeRange(newBeginTime, newEndTime);
            }
        }
    }
    exports.SwimlaneViewport = SwimlaneViewport;
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Binding/IConverter", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/debugger/PerfDebuggerWebViews/Converters/ItemXOffsetConverter", ["require", "exports", "diagnosticsHub"], function (require, exports, diagnosticsHub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.itemXOffsetConverter = exports.ItemXOffsetConverter = void 0;
    class ItemXOffsetConverter {
        constructor() {
            this._swimlaneViewport = null;
        }
        set swimlaneViewport(value) {
            this._swimlaneViewport = value;
        }
        convertTo(eventTime) {
            return this.calculateXOffset(eventTime) + "px";
        }
        calculateXOffset(eventTime) {
            diagnosticsHub_1.Assert.isTrue(this._swimlaneViewport.isVisible, "view port is not visible.");
            diagnosticsHub_1.Assert.isTrue(eventTime >= 0, "eventTime value is invalid");
            var xoffset = Math.round(this._swimlaneViewport.getTimeOffset(eventTime) / this._swimlaneViewport.nanosecondsPerPixel);
            return xoffset;
        }
        convertFrom(to) {
            diagnosticsHub_1.Assert.fail("convertFrom is not implemented.");
        }
    }
    exports.ItemXOffsetConverter = ItemXOffsetConverter;
    exports.itemXOffsetConverter = new ItemXOffsetConverter();
});
define("src/debugger/PerfDebuggerWebViews/HtmlHelper", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HtmlHelper = void 0;
    class HtmlHelper {
        static createDiv(html) {
            var div = document.createElement("div");
            div.innerHTML = html;
            return div;
        }
    }
    exports.HtmlHelper = HtmlHelper;
});
define("src/debugger/PerfDebuggerWebViews/TimeIndicator", ["require", "exports", "src/debugger/PerfDebuggerWebViews/Converters/ItemXOffsetConverter", "src/debugger/PerfDebuggerWebViews/HtmlHelper"], function (require, exports, ItemXOffsetConverter_1, HtmlHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimeIndicator = void 0;
    class TimeIndicator {
        constructor(rootElement, viewport) {
            this._time = null;
            this._isLiveDebugging = true;
            this._activatedEventIndicator = null;
            this._rootElement = null;
            this._viewport = null;
            this._rootElement = rootElement;
            this._viewport = viewport;
            this._activatedEventIndicator = HtmlHelper_1.HtmlHelper.createDiv("");
            this._activatedEventIndicator.setAttribute("class", "activated-event");
        }
        set time(value) {
            this._time = value;
        }
        get time() {
            return this._time;
        }
        set isLiveDebugging(value) {
            this._isLiveDebugging = value;
        }
        get isLiveDebugging() {
            return this._isLiveDebugging;
        }
        render(fullRender) {
            if (fullRender) {
                this._rootElement.appendChild(this._activatedEventIndicator);
            }
            if (this._viewport.isVisible) {
                if (this._time != null) {
                    this._activatedEventIndicator.style.left = ItemXOffsetConverter_1.itemXOffsetConverter.convertTo(this._time);
                    this._activatedEventIndicator.style.display = "block";
                }
                else {
                    this._activatedEventIndicator.style.display = "none";
                }
            }
        }
    }
    exports.TimeIndicator = TimeIndicator;
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Assert = void 0;
    class Assert {
        static isTrue(condition, message) {
            if (!condition) {
                message = message ? "Internal error. " + message : "Internal error. Unexpectedly false.";
                Assert.fail(message);
            }
        }
        static isFalse(condition, message) {
            if (condition) {
                message = message ? "Internal error. " + message : "Internal error. Unexpectedly true.";
                Assert.fail(message);
            }
        }
        static isNull(value, message) {
            if (value !== null) {
                message = message ? "Internal error. " + message : "Internal error. Unexpectedly not null.";
                message += " '" + value + "'";
                Assert.fail(message);
            }
        }
        static isUndefined(value, message) {
            if (undefined !== void 0) {
                message = "Internal error. Unexpectedly undefined has been redefined.";
                message += " '" + undefined + "'";
                Assert.fail(message);
            }
            if (value !== undefined) {
                message = message ? "Internal error. " + message : "Internal error. Unexpectedly not undefined.";
                message += " '" + value + "'";
                Assert.fail(message);
            }
        }
        static hasValue(value, message) {
            if (undefined !== void 0) {
                message = "Internal error. Unexpectedly undefined has been redefined.";
                message += " '" + undefined + "'";
                Assert.fail(message);
            }
            if (value === null || value === undefined) {
                message = message ? "Internal error. " + message : ("Internal error. Unexpectedly " + (value === null ? "null" : "undefined") + ".");
                Assert.fail(message);
            }
        }
        static areEqual(value1, value2, message) {
            if (value1 !== value2) {
                message = message ? "Internal error. " + message : "Internal error. Unexpectedly not equal.";
                message += " '" + value1 + "' !== '" + value2 + "'.";
                Assert.fail(message);
            }
        }
        static areNotEqual(value1, value2, message) {
            if (value1 === value2) {
                message = message ? "Internal error. " + message : "Internal error. Unexpectedly equal.";
                message += " '" + value1 + "' === '" + value2 + "'.";
                Assert.fail(message);
            }
        }
        static fail(message) {
            var error = new Error((message || "Assert failed.") + "\n");
            try {
                throw error;
            }
            catch (ex) {
                throw ex;
            }
        }
    }
    exports.Assert = Assert;
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/IEventHandler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/IEventRegistration", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/EventSource", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert"], function (require, exports, assert_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventSource = void 0;
    class EventSource {
        constructor() {
            this._handlers = null;
            this._eventsRunning = 0;
        }
        addHandler(handler) {
            assert_1.Assert.isTrue(typeof handler === "function", "handler must be function");
            if (!this._handlers) {
                this._handlers = [];
            }
            this._handlers.push(handler);
            return { unregister: () => this.removeHandler(handler) };
        }
        addOne(handler) {
            var registration = this.addHandler((args) => {
                registration.unregister();
                handler(args);
            });
            return registration;
        }
        removeHandler(handler) {
            assert_1.Assert.hasValue(this._handlers && this._handlers.length, "Shouldn't call remove before add");
            var i = this._handlers.length;
            while (i--) {
                if (this._handlers[i] === handler) {
                    if (this._eventsRunning > 0) {
                        this._handlers[i] = null;
                    }
                    else {
                        this._handlers.splice(i, 1);
                    }
                    return;
                }
            }
            assert_1.Assert.fail("Called remove on a handler which wasn't added");
        }
        invoke(args) {
            if (this._handlers) {
                this._eventsRunning++;
                for (var i = 0; i < this._handlers.length; i++) {
                    this._handlers[i] && this._handlers[i](args);
                }
                this._eventsRunning--;
                if (this._eventsRunning === 0) {
                    this.cleanupNullHandlers();
                }
            }
        }
        invokeAsync(args) {
            if (this._handlers) {
                this._eventsRunning++;
                var promises = [];
                for (var i = 0; i < this._handlers.length; i++) {
                    var promise = this._handlers[i] && this._handlers[i](args);
                    if (promise && promise.then) {
                        promises.push(promise);
                    }
                }
                this._eventsRunning--;
                if (this._eventsRunning === 0) {
                    this.cleanupNullHandlers();
                }
                return Promise.all(promises);
            }
            return Promise.resolve(null);
        }
        cleanupNullHandlers() {
            for (var i = this._handlers.length - 1; i >= 0; i--) {
                if (!this._handlers[i]) {
                    this._handlers.splice(i, 1);
                }
            }
        }
    }
    exports.EventSource = EventSource;
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/IControl", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Binding/Binding", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert"], function (require, exports, assert_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Binding = exports.targetAccessViaAttribute = exports.targetAccessViaProperty = void 0;
    exports.targetAccessViaProperty = {
        getValue: (target, prop) => target[prop],
        isValueSupported: (value, isConverter) => {
            return value !== undefined && (isConverter || value !== null);
        },
        setValue: (target, prop, value) => { target[prop] = value; }
    };
    exports.targetAccessViaAttribute = {
        getValue: (target, prop) => target.getAttribute(prop),
        isValueSupported: (value, isConverter) => {
            return true;
        },
        setValue: (target, prop, value) => {
            if (value === null || value === undefined) {
                target.removeAttribute(prop);
            }
            else {
                target.setAttribute(prop, value);
            }
        }
    };
    class Binding {
        constructor(source, sourceExpression, destination, destinationProperty, converter, mode, targetAccess) {
            assert_2.Assert.hasValue(sourceExpression, "sourceExpression");
            assert_2.Assert.hasValue(destination, "destination");
            assert_2.Assert.hasValue(destinationProperty, "destinationProperty");
            mode = mode || Binding.ONE_WAY_MODE;
            var expressionParts = sourceExpression.split(".");
            this._source = null;
            this._sourceChangedRegistration = null;
            this._destChangedRegistration = null;
            this._sourceProperty = expressionParts[0];
            this._childBinding = null;
            this._paused = false;
            this._twoWay = false;
            this._converter = converter;
            this._destination = destination;
            this._destinationProperty = destinationProperty;
            this._targetAccess = targetAccess || exports.targetAccessViaProperty;
            if (expressionParts.length > 1) {
                expressionParts.splice(0, 1);
                this._childBinding = new Binding(null, expressionParts.join("."), destination, destinationProperty, converter, mode, this._targetAccess);
            }
            else if (mode.toLowerCase() === Binding.TWO_WAY_MODE) {
                this._twoWay = true;
                this._destChangedRegistration = this.attachChangeHandler(destination, (e) => {
                    var propertyName = e;
                    if (typeof propertyName !== "string" || propertyName === null || propertyName === this._destinationProperty) {
                        this.updateSourceFromDest();
                    }
                });
            }
            this.setSource(source);
        }
        isForDestination(destination, destinationProperty) {
            return destination === this._destination && destinationProperty === this._destinationProperty;
        }
        unbind() {
            this._source = null;
            if (this._sourceChangedRegistration) {
                this._sourceChangedRegistration.unregister();
                this._sourceChangedRegistration = null;
            }
            if (this._childBinding) {
                this._childBinding.unbind();
                this._childBinding = null;
            }
            if (this._destChangedRegistration) {
                this._destChangedRegistration.unregister();
                this._destChangedRegistration = null;
            }
        }
        updateSourceFromDest() {
            if (this._source && this._twoWay) {
                this._paused = true;
                var destValue = this._targetAccess.getValue(this._destination, this._destinationProperty);
                if (this._converter) {
                    destValue = this._converter.convertFrom(destValue);
                }
                this._source[this._sourceProperty] = destValue;
                this._paused = false;
            }
        }
        updateDestination() {
            if (this._paused) {
                return;
            }
            this._paused = true;
            var value = this.getValue();
            if (this._childBinding) {
                this._childBinding.setSource(value);
            }
            else {
                var hasConverter = !!this._source && !!this._converter;
                if (hasConverter) {
                    value = this._converter.convertTo(value);
                }
                if (this._targetAccess.isValueSupported(value, !!hasConverter)) {
                    this._targetAccess.setValue(this._destination, this._destinationProperty, value);
                }
            }
            this._paused = false;
        }
        setSource(source) {
            if (this._sourceChangedRegistration) {
                this._sourceChangedRegistration.unregister();
                this._sourceChangedRegistration = null;
            }
            this._source = source;
            if (this._source) {
                this._sourceChangedRegistration = this.attachChangeHandler(this._source, (propertyName) => {
                    if (typeof propertyName !== "string" || propertyName === null || propertyName === this._sourceProperty) {
                        this.updateDestination();
                    }
                });
            }
            this.updateDestination();
            this.updateSourceFromDest();
        }
        attachChangeHandler(obj, handler) {
            if (obj.propertyChanged) {
                return obj.propertyChanged.addHandler(handler);
            }
            else {
                var element = obj;
                if ((element.tagName === "INPUT" || element.tagName === "SELECT") &&
                    element.addEventListener && element.removeEventListener) {
                    element.addEventListener("change", handler);
                    return { unregister: () => element.removeEventListener("change", handler) };
                }
            }
        }
        getValue() {
            return this._source && this._source[this._sourceProperty];
        }
    }
    exports.Binding = Binding;
    Binding.ONE_WAY_MODE = "oneway";
    Binding.TWO_WAY_MODE = "twoway";
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Binding/CommonConverters", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommonConverters = void 0;
    class CommonConverters {
        static initialize() {
            CommonConverters.AriaConverterElement = document.createElement("span");
            CommonConverters.HtmlTooltipFromResourceConverter = CommonConverters.getHtmlTooltipFromResourceConverter();
            CommonConverters.IntToStringConverter = CommonConverters.getIntToStringConverter();
            CommonConverters.InvertBool = CommonConverters.invertBoolConverter();
            CommonConverters.JsonHtmlTooltipToInnerTextConverter = CommonConverters.getJsonHtmlTooltipToInnerTextConverter();
            CommonConverters.NullPermittedConverter = CommonConverters.getNullPermittedConverter();
            CommonConverters.ResourceConverter = CommonConverters.getResourceConverter();
            CommonConverters.StringToBooleanConverter = CommonConverters.getStringToBooleanConverter();
            CommonConverters.StringToIntConverter = CommonConverters.getStringToIntConverter();
            CommonConverters.ThemedImageConverter = CommonConverters.getThemedImageConverter();
        }
        static getResourceConverter() {
            return {
                convertTo: (from) => {
                    return plugin.Resources.getString(from);
                },
                convertFrom: null
            };
        }
        static getThemedImageConverter() {
            return {
                convertTo: (from) => {
                    return plugin.Theme.getValue(from);
                },
                convertFrom: null
            };
        }
        static getStringToBooleanConverter() {
            return {
                convertTo: (from) => {
                    return from === "true" ? true : false;
                },
                convertFrom: (from) => {
                    return from ? "true" : "false";
                }
            };
        }
        static getStringToIntConverter() {
            return {
                convertTo: (from) => {
                    return from >> 0;
                },
                convertFrom: (from) => {
                    return from.toString();
                }
            };
        }
        static getIntToStringConverter() {
            return {
                convertTo: (from) => {
                    return from.toString();
                },
                convertFrom: (from) => {
                    return from >> 0;
                }
            };
        }
        static invertBoolConverter() {
            return {
                convertTo: (from) => {
                    return !from;
                },
                convertFrom: (to) => {
                    return !to;
                }
            };
        }
        static getHtmlTooltipFromResourceConverter() {
            return {
                convertTo: (from) => {
                    return JSON.stringify({ content: plugin.Resources.getString(from), contentContainsHTML: true });
                },
                convertFrom: null
            };
        }
        static getJsonHtmlTooltipToInnerTextConverter() {
            return {
                convertTo: (from) => {
                    if (from.match(CommonConverters.JSONRegex)) {
                        try {
                            var options = JSON.parse(from);
                            if (options.contentContainsHTML) {
                                CommonConverters.AriaConverterElement.innerHTML = options.content;
                                var text = CommonConverters.AriaConverterElement.innerText;
                                CommonConverters.AriaConverterElement.innerHTML = "";
                                return text;
                            }
                            else {
                                return options.content;
                            }
                        }
                        catch (ex) { }
                    }
                    return from;
                },
                convertFrom: null
            };
        }
        static getNullPermittedConverter() {
            return {
                convertTo: (from) => {
                    return from;
                },
                convertFrom: (to) => {
                    return to;
                }
            };
        }
    }
    exports.CommonConverters = CommonConverters;
    CommonConverters.JSONRegex = /^\{.*\}$/;
    CommonConverters.initialize();
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Model/CollectionChangedAction", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollectionChangedAction = void 0;
    var CollectionChangedAction;
    (function (CollectionChangedAction) {
        CollectionChangedAction[CollectionChangedAction["Add"] = 0] = "Add";
        CollectionChangedAction[CollectionChangedAction["Remove"] = 1] = "Remove";
        CollectionChangedAction[CollectionChangedAction["Reset"] = 2] = "Reset";
        CollectionChangedAction[CollectionChangedAction["Clear"] = 3] = "Clear";
    })(CollectionChangedAction = exports.CollectionChangedAction || (exports.CollectionChangedAction = {}));
    ;
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Model/IObservable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/EventSource"], function (require, exports, EventSource_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObservableHelpers = exports.Observable = void 0;
    class Observable {
        constructor() {
            this.propertyChanged = new EventSource_1.EventSource();
        }
        static fromObject(obj) {
            if (typeof obj.propertyChanged !== "undefined") {
                return obj;
            }
            var returnValue = new Observable();
            var backingData = {};
            Object.defineProperties(returnValue, ObservableHelpers.expandProperties(obj, backingData, returnValue));
            returnValue["_backingData"] = backingData;
            return returnValue;
        }
    }
    exports.Observable = Observable;
    class ObservableHelpers {
        static defineProperty(classToExtend, propertyName, defaultValue, onChanged, onChanging) {
            var backingFieldName = "_" + propertyName;
            Object.defineProperty(classToExtend.prototype, propertyName, {
                get: function () {
                    if (typeof this[backingFieldName] === "undefined") {
                        this[backingFieldName] = defaultValue;
                    }
                    return this[backingFieldName];
                },
                set: function (newValue) {
                    var oldValue = this[backingFieldName];
                    if (newValue !== oldValue) {
                        if (onChanging) {
                            onChanging(this, oldValue, newValue);
                        }
                        this[backingFieldName] = newValue;
                        var observable = this;
                        observable.propertyChanged.invoke(propertyName);
                        if (onChanged) {
                            onChanged(this, oldValue, newValue);
                        }
                    }
                }
            });
        }
        static describePropertyForObjectShape(propertyName, objectShape, backingDataStore, invokableObserver) {
            var returnValue = {
                get: () => backingDataStore[propertyName],
                enumerable: true
            };
            var propertyValue = objectShape[propertyName];
            if (typeof propertyValue === "object") {
                backingDataStore[propertyName] = Observable.fromObject(propertyValue);
                returnValue.set = (value) => {
                    if (value !== backingDataStore[propertyName]) {
                        backingDataStore[propertyName] = Observable.fromObject(value);
                        invokableObserver.propertyChanged.invoke(propertyName);
                    }
                };
            }
            else {
                backingDataStore[propertyName] = propertyValue;
                returnValue.set = (value) => {
                    if (value !== backingDataStore[propertyName]) {
                        backingDataStore[propertyName] = value;
                        invokableObserver.propertyChanged.invoke(propertyName);
                    }
                };
            }
            return returnValue;
        }
        static expandProperties(objectShape, backingDataStore, invokableObserver) {
            var properties = {};
            for (var propertyName in objectShape) {
                properties[propertyName] = ObservableHelpers.describePropertyForObjectShape(propertyName, objectShape, backingDataStore, invokableObserver);
            }
            return properties;
        }
    }
    exports.ObservableHelpers = ObservableHelpers;
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Model/ObservableCollection", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/CollectionChangedAction", "src/debugger/PerfDebuggerWebViews/UIFramework/EventSource"], function (require, exports, CollectionChangedAction_1, EventSource_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObservableCollection = void 0;
    class ObservableCollection {
        constructor(list = []) {
            this._list = list.slice(0);
            this.propertyChanged = new EventSource_2.EventSource();
            this.collectionChanged = new EventSource_2.EventSource();
        }
        get length() {
            return this._list.length;
        }
        push(...items) {
            var array = (items);
            return this.pushInternal(array);
        }
        pushAll(items) {
            return this.pushInternal(items);
        }
        pushInternal(items) {
            var list = this._list;
            var insertionIndex = list.length;
            this._list = list.concat(items);
            var newLength = this._list.length;
            this.propertyChanged.invoke(ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Add, items, insertionIndex);
            return newLength;
        }
        pop() {
            var oldItem = this._list.pop();
            this.propertyChanged.invoke(ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Remove, null, null, [oldItem], this._list.length);
            return oldItem;
        }
        splice(index, removeCount, ...items) {
            var args = [index, removeCount];
            if (items) {
                Array.prototype.push.apply(args, items);
            }
            var removedItems = Array.prototype.splice.apply(this._list, args);
            var itemsRemoved = removedItems.length > 0;
            var itemsAdded = items && items.length > 0;
            if (itemsRemoved || itemsAdded) {
                this.propertyChanged.invoke(ObservableCollection.LengthProperty);
                if (itemsRemoved) {
                    this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Remove, null, null, removedItems, index);
                }
                if (itemsAdded) {
                    this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Add, items, index, null, null);
                }
            }
            return removedItems;
        }
        indexOf(searchElement, fromIndex) {
            return this._list.indexOf(searchElement, fromIndex);
        }
        lastIndexOf(searchElement, fromIndex = -1) {
            return this._list.lastIndexOf(searchElement, fromIndex);
        }
        clear() {
            this._list = [];
            this.propertyChanged.invoke(ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Clear);
        }
        filter(callbackfn, thisArg) {
            return this._list.filter(callbackfn, thisArg);
        }
        map(callbackfn, thisArg) {
            return this._list.map(callbackfn, thisArg);
        }
        getItem(index) {
            return this._list[index];
        }
        resetItems(items) {
            this._list = [];
            var newLength = Array.prototype.push.apply(this._list, items);
            this.propertyChanged.invoke(ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Reset);
            return newLength;
        }
        invokeCollectionChanged(action, newItems, newStartingIndex, oldItems, oldStartingIndex) {
            var event = {
                action: action,
                newItems: newItems,
                newStartingIndex: newStartingIndex,
                oldItems: oldItems,
                oldStartingIndex: oldStartingIndex
            };
            this.collectionChanged.invoke(event);
        }
    }
    exports.ObservableCollection = ObservableCollection;
    ObservableCollection.LengthProperty = "length";
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Model/SortedObservableCollection", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/CollectionChangedAction", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/ObservableCollection"], function (require, exports, CollectionChangedAction_2, ObservableCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SortedObservableCollection = void 0;
    class SortedObservableCollection extends ObservableCollection_1.ObservableCollection {
        constructor(comparator) {
            super([]);
            this._sorted = false;
            if (comparator == null) {
                comparator = (a, b) => {
                    if (a < b) {
                        return -1;
                    }
                    else if (a > b) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                };
            }
            this._comparator = comparator;
        }
        push(...items) {
            return this.pushAllSorted(items, false);
        }
        pushAll(items) {
            return this.pushAllSorted(items, false);
        }
        pushAllSorted(items, sorted) {
            if (!items) {
                return this.length;
            }
            var currentLength = this._list.length;
            if (this.length === 0) {
                this._sorted = sorted;
                return super.pushAll(items);
            }
            var lastItem = this.getItem(currentLength - 1);
            var firstItem = items[0];
            var comparison = this._comparator(firstItem, lastItem);
            if (items.length === 1 && comparison >= 0) {
                this.ensureSorted();
                return super.pushAll(items);
            }
            if (sorted) {
                this.ensureSorted();
                if (comparison >= 0) {
                    return super.pushAll(items);
                }
                var thisIndex = 0;
                var newIndex = 0;
                var newLength = items.length;
                var mergedIndex = 0;
                var newItems = [];
                newItems.length = currentLength + newLength;
                while ((thisIndex < currentLength) || (newIndex < newLength)) {
                    if (thisIndex >= currentLength) {
                        newItems[mergedIndex] = items[newIndex];
                        newIndex++;
                    }
                    else if (newIndex >= newLength) {
                        newItems[mergedIndex] = this._list[thisIndex];
                        thisIndex++;
                    }
                    else {
                        var comparison = this._comparator(this._list[thisIndex], items[newIndex]);
                        if (comparison > 0) {
                            newItems[mergedIndex] = items[newIndex];
                            newIndex++;
                        }
                        else {
                            newItems[mergedIndex] = this._list[thisIndex];
                            thisIndex++;
                        }
                    }
                    mergedIndex++;
                }
                return super.resetItems(newItems);
            }
            if (items.length === 1) {
                this.ensureSorted();
                var newItem = items[0];
                var lastEqualItemIndex = -1;
                var i = 0;
                for (i = 0; i < this.length; ++i) {
                    if (this._comparator(this.getItem(i), newItem) <= 0) {
                        lastEqualItemIndex = i;
                    }
                    else {
                        break;
                    }
                }
                this.splice(lastEqualItemIndex + 1, 0, newItem);
                return this.length;
            }
            this._sorted = false;
            this._list = this._list.concat(items);
            this.propertyChanged.invoke(ObservableCollection_1.ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_2.CollectionChangedAction.Reset);
            return this._list.length;
        }
        pop() {
            this.ensureSorted();
            return super.pop();
        }
        splice(index, removeCount, ...items) {
            this.ensureSorted();
            return super.splice.apply(this, arguments);
        }
        indexOf(searchElement, fromIndex) {
            this.ensureSorted();
            return super.indexOf.apply(this, arguments);
        }
        lastIndexOf(searcElement, fromIndex = -1) {
            this.ensureSorted();
            return super.lastIndexOf.apply(this, arguments);
        }
        clear() {
            this._sorted = true;
            super.clear();
        }
        filter(callbackfn, thisArg) {
            this.ensureSorted();
            return super.filter(callbackfn);
        }
        map(callbackfn, thisArg) {
            this.ensureSorted();
            return super.map(callbackfn);
        }
        getItem(index) {
            this.ensureSorted();
            return super.getItem(index);
        }
        resetItems(items) {
            this._sorted = false;
            return super.resetItems(items);
        }
        ensureSorted() {
            if (!this._sorted) {
                this._list.sort(this._comparator);
                this._sorted = true;
            }
        }
    }
    exports.SortedObservableCollection = SortedObservableCollection;
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Templating/ITemplateRepository", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Templating/ScriptTemplateRepository", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert"], function (require, exports, assert_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.templateRepository = exports.ScriptTemplateRepository = void 0;
    class ScriptTemplateRepository {
        constructor(container) {
            assert_3.Assert.hasValue(container, "Invalid template container.");
            this._container = container;
            this._registeredTemplates = {};
        }
        getTemplateString(templateId) {
            assert_3.Assert.isTrue(!!templateId, "Invalid template ID.");
            var template;
            template = this._registeredTemplates[templateId];
            if (!template) {
                var container = this._container;
                var templateParts = templateId.split(".");
                for (var i = 0; i < templateParts.length; i++) {
                    var part = templateParts[i];
                    container = container[part];
                    assert_3.Assert.isTrue(!!container, "Couldn't find the template with the given ID '" + templateId + "'.");
                }
                template = container;
            }
            assert_3.Assert.areEqual(typeof template, "string", "The given template name doesn't point to a template.");
            return template;
        }
        registerTemplateString(templateId, html) {
            assert_3.Assert.isTrue(!!templateId, "Invalid template ID.");
            assert_3.Assert.isUndefined(this._registeredTemplates[templateId], "Template with id '" + templateId + "' already registered.");
            this._registeredTemplates[templateId] = html;
        }
    }
    exports.ScriptTemplateRepository = ScriptTemplateRepository;
    exports.templateRepository = new ScriptTemplateRepository(window.ControlTemplates);
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Templating/HtmlTemplateRepository", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert"], function (require, exports, assert_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HtmlTemplateRepository = void 0;
    class HtmlTemplateRepository {
        constructor() {
            this._registeredTemplates = {};
        }
        getTemplateString(templateId) {
            assert_4.Assert.isTrue(!!templateId, "Invalid template ID.");
            var template;
            template = this._registeredTemplates[templateId];
            if (!template) {
                var templateElement = document.getElementById(templateId);
                template = templateElement.innerHTML;
            }
            assert_4.Assert.areEqual(typeof template, "string", "The given template name doesn't point to a template.");
            return template;
        }
        registerTemplateString(templateId, html) {
            assert_4.Assert.isTrue(!!templateId, "Invalid template ID.");
            assert_4.Assert.isUndefined(this._registeredTemplates[templateId], "Template with id '" + templateId + "' already registered.");
            this._registeredTemplates[templateId] = html;
        }
    }
    exports.HtmlTemplateRepository = HtmlTemplateRepository;
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateDataAttributes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateDataAttributes = void 0;
    class TemplateDataAttributes {
    }
    exports.TemplateDataAttributes = TemplateDataAttributes;
    TemplateDataAttributes.BINDING = "data-binding";
    TemplateDataAttributes.CONTROL = "data-control";
    TemplateDataAttributes.NAME = "data-name";
    TemplateDataAttributes.CONTROL_TEMPLATE_ID = TemplateDataAttributes.CONTROL + "-templateId";
    TemplateDataAttributes.CONTROL_BINDING = "data-controlbinding";
    TemplateDataAttributes.OPTIONS = "data-options";
    TemplateDataAttributes.TEMPLATE_ID_OPTION = TemplateDataAttributes.OPTIONS + "-templateId";
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateDataBinding", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert", "src/debugger/PerfDebuggerWebViews/UIFramework/Binding/Binding", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateDataAttributes"], function (require, exports, assert_5, Binding_1, TemplateDataAttributes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateDataBinding = void 0;
    class TemplateDataBinding {
        constructor(control) {
            this._bindings = TemplateDataBinding.bind(control);
        }
        findBinding(destination, destinationProperty) {
            var binding;
            if (this._bindings) {
                for (var i = 0; i < this._bindings.length; i++) {
                    var currBinding = this._bindings[i];
                    if (currBinding.isForDestination(destination, destinationProperty)) {
                        binding = currBinding;
                        break;
                    }
                }
            }
            return binding;
        }
        unbind() {
            if (this._bindings) {
                for (var i = 0; i < this._bindings.length; i++) {
                    this._bindings[i].unbind();
                }
            }
            this._bindings = null;
        }
        static buildBindingCommand(target, element, targetName, bindingSource, value) {
            var targetAccess = Binding_1.targetAccessViaProperty;
            if (target === element) {
                if (targetName.substr(0, TemplateDataBinding.STYLE_PREFIX.length) === TemplateDataBinding.STYLE_PREFIX) {
                    target = element.style;
                    targetName = targetName.substr(TemplateDataBinding.STYLE_PREFIX.length);
                }
                else if (targetName.substr(0, TemplateDataBinding.ATTRIBUTE_PREFIX.length) === TemplateDataBinding.ATTRIBUTE_PREFIX) {
                    targetName = targetName.substr(TemplateDataBinding.ATTRIBUTE_PREFIX.length);
                    targetAccess = Binding_1.targetAccessViaAttribute;
                }
                else if (targetName.substr(0, TemplateDataBinding.CONTROL_PREFIX.length) === TemplateDataBinding.CONTROL_PREFIX) {
                    var elementControlLink = element;
                    target = elementControlLink.control;
                    targetName = targetName.substr(TemplateDataBinding.CONTROL_PREFIX.length);
                }
            }
            var bindingCommand = {
                target: target,
                targetAccess: targetAccess,
                targetName: targetName,
                source: bindingSource,
                value: value
            };
            return bindingCommand;
        }
        static extractBindingCommandsForBinding(commands, target, element, allBindings, isControlBinding) {
            var bindings = allBindings.split(",");
            var bindingsCount = bindings.length;
            for (var i = 0; i < bindingsCount; i++) {
                var binding = bindings[i];
                var keyValue = binding.split(":", 2);
                assert_5.Assert.areEqual(keyValue.length, 2, "Invalid binding syntax, the keyvalue pair should have the syntax target:source '" + binding + "'.");
                var targetName = keyValue[0].trim();
                var sourceSyntax = keyValue[1].trim();
                var bindingSource = TemplateDataBinding.parseSourceSyntax(sourceSyntax);
                if (!isControlBinding) {
                    bindingSource.name = TemplateDataBinding.MODEL_PREFIX + bindingSource.name;
                }
                var bindingCommand = TemplateDataBinding.buildBindingCommand(target, element, targetName, bindingSource, null);
                assert_5.Assert.isTrue(!!bindingCommand.targetName, "Invalid binding syntax. Target name is missing '" + binding + "'.");
                commands.push(bindingCommand);
            }
        }
        static extractBindingCommandsForOptions(commands, target, element, allOptions) {
            var options = allOptions.split(",");
            var optionsCount = options.length;
            for (var i = 0; i < optionsCount; i++) {
                var option = options[i];
                var keyValue = option.split(":", 2);
                assert_5.Assert.areEqual(keyValue.length, 2, "Invalid options syntax, the keyvalue pair should have the syntax target:source '" + option + "'.");
                var targetName = keyValue[0].trim();
                var valueSyntax = keyValue[1].trim();
                var valueSource = TemplateDataBinding.parseSourceSyntax(valueSyntax);
                var value = valueSource.name;
                if (valueSource.converter && valueSource.converter.convertTo) {
                    value = valueSource.converter.convertTo(value);
                }
                var bindingCommand = TemplateDataBinding.buildBindingCommand(target, element, targetName, null, value);
                assert_5.Assert.isTrue(!!bindingCommand.targetName, "Invalid option syntax. Target name is missing '" + option + "'.");
                commands.push(bindingCommand);
            }
        }
        static getBindingCommands(control) {
            var bindingCommands;
            var elements = [];
            elements.push(control.rootElement);
            while (elements.length > 0) {
                var element = elements.pop();
                var childControl = element.control;
                var target = element;
                if (childControl && childControl !== control) {
                    target = childControl;
                }
                if (target) {
                    var attr;
                    attr = element.getAttributeNode(TemplateDataAttributes_1.TemplateDataAttributes.BINDING);
                    if (attr) {
                        bindingCommands = bindingCommands || [];
                        TemplateDataBinding.extractBindingCommandsForBinding(bindingCommands, target, element, attr.value, false);
                        element.removeAttributeNode(attr);
                    }
                    attr = element.getAttributeNode(TemplateDataAttributes_1.TemplateDataAttributes.CONTROL_BINDING);
                    if (attr) {
                        bindingCommands = bindingCommands || [];
                        TemplateDataBinding.extractBindingCommandsForBinding(bindingCommands, target, element, attr.value, true);
                        element.removeAttributeNode(attr);
                    }
                    attr = element.getAttributeNode(TemplateDataAttributes_1.TemplateDataAttributes.OPTIONS);
                    if (attr) {
                        bindingCommands = bindingCommands || [];
                        var optionsTarget = childControl || element;
                        TemplateDataBinding.extractBindingCommandsForOptions(bindingCommands, optionsTarget, element, attr.value);
                        element.removeAttributeNode(attr);
                    }
                }
                if (element.children && (!element.hasAttribute(TemplateDataAttributes_1.TemplateDataAttributes.CONTROL) || element === control.rootElement)) {
                    var childrenCount = element.children.length;
                    for (var i = 0; i < childrenCount; i++) {
                        elements.push(element.children[i]);
                    }
                }
            }
            return bindingCommands;
        }
        static bind(control) {
            var bindings;
            var bindingCommands = TemplateDataBinding.getBindingCommands(control);
            if (bindingCommands) {
                bindings = [];
                var bindingCommandsCount = bindingCommands.length;
                for (var i = 0; i < bindingCommandsCount; i++) {
                    var bindingCommand = bindingCommands[i];
                    if (bindingCommand.source) {
                        var binding = new Binding_1.Binding(control, bindingCommand.source.name, bindingCommand.target, bindingCommand.targetName, bindingCommand.source.converter, bindingCommand.source.mode, bindingCommand.targetAccess);
                        bindings.push(binding);
                    }
                    else if (bindingCommand.value !== undefined) {
                        bindingCommand.targetAccess.setValue(bindingCommand.target, bindingCommand.targetName, bindingCommand.value);
                    }
                }
            }
            return bindings && bindings.length > 0 ? bindings : null;
        }
        static getConverterInstance(identifier) {
            var obj = window;
            var parts = identifier.split(".");
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                obj = obj[part];
                assert_5.Assert.hasValue(obj, "Couldn't find the converter instance with the given name '" + identifier + "'.");
            }
            assert_5.Assert.hasValue(obj.convertFrom || obj.convertTo, "The converter instance with the given name '" + identifier + "' doesn't point to a valid converter instance.");
            return obj;
        }
        static parseSourceSyntax(syntax) {
            assert_5.Assert.isTrue(!!syntax, "Invalid binding syntax.");
            var parts = syntax.split(";");
            var bindingSource = {
                name: parts[0].trim()
            };
            for (var i = 1; i < parts.length; i++) {
                var keyValue = parts[i].split("=", 2);
                assert_5.Assert.areEqual(keyValue.length, 2, "Invalid binding syntax, the keyvalue pair should have the syntax key=value.");
                switch (keyValue[0].trim().toLowerCase()) {
                    case "mode":
                        bindingSource.mode = keyValue[1].trim().toLowerCase();
                        break;
                    case "converter":
                        bindingSource.converter = TemplateDataBinding.getConverterInstance(keyValue[1].trim());
                        break;
                }
            }
            return bindingSource;
        }
    }
    exports.TemplateDataBinding = TemplateDataBinding;
    TemplateDataBinding.ATTRIBUTE_PREFIX = "attr-";
    TemplateDataBinding.MODEL_PREFIX = "model.";
    TemplateDataBinding.STYLE_PREFIX = "style.";
    TemplateDataBinding.CONTROL_PREFIX = "control.";
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateControl", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateDataAttributes", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateDataBinding", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateLoader"], function (require, exports, Observable_1, TemplateDataAttributes_2, TemplateDataBinding_1, TemplateLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateControl = void 0;
    class TemplateControl extends Observable_1.Observable {
        constructor(templateId) {
            super();
            this.onInitializeOverride();
            this._templateId = templateId;
            this.setRootElementFromTemplate();
        }
        get model() {
            return this._model;
        }
        set model(value) {
            if (this._model !== value) {
                var oldModel = this._model;
                this._model = value;
                this.propertyChanged.invoke(TemplateControl.ModelPropertyName);
                this.onModelChanged(oldModel, value);
            }
        }
        get tabIndex() {
            if (this._tabIndex) {
                return this._tabIndex;
            }
            return 0;
        }
        set tabIndex(value) {
            if (this._tabIndex !== value) {
                var oldValue = this._tabIndex;
                this._tabIndex = value >> 0;
                this.propertyChanged.invoke(TemplateControl.TabIndexPropertyName);
                this.onTabIndexChanged(oldValue, this._tabIndex);
            }
        }
        get templateId() {
            return this._templateId;
        }
        set templateId(value) {
            if (this._templateId !== value) {
                this._templateId = value;
                this._binding.unbind();
                this.setRootElementFromTemplate();
                this.propertyChanged.invoke(TemplateControl.TemplateIdPropertyName);
            }
        }
        static initialize() {
            Observable_1.ObservableHelpers.defineProperty(TemplateControl, TemplateControl.ClassNamePropertyName, null, (obj, oldValue, newValue) => obj.onClassNameChanged(oldValue, newValue));
            Observable_1.ObservableHelpers.defineProperty(TemplateControl, TemplateControl.IsEnabledPropertyName, true, (obj) => obj.onIsEnabledChanged());
            Observable_1.ObservableHelpers.defineProperty(TemplateControl, TemplateControl.IsVisiblePropertyName, true, (obj) => obj.onIsVisibleChanged());
            Observable_1.ObservableHelpers.defineProperty(TemplateControl, TemplateControl.TooltipPropertyName, null, (obj) => obj.onTooltipChanged());
        }
        getBinding(destination, destinationProperty) {
            var binding;
            if (this._binding) {
                binding = this._binding.findBinding(destination, destinationProperty);
            }
            return binding;
        }
        onApplyTemplate() {
            this.onClassNameChanged(null, this.className);
            this.onIsVisibleChanged();
            this.onTabIndexChanged(null, this._tabIndex);
            this.onTooltipChanged();
        }
        onInitializeOverride() {
        }
        onModelChanged(oldModel, newModel) {
        }
        onTemplateChanging() {
        }
        getNamedControl(name) {
            var element = this.getNamedElement(name);
            if (!element) {
                return null;
            }
            return element.control;
        }
        getNamedElement(name) {
            var elements = [];
            elements.push(this.rootElement);
            while (elements.length > 0) {
                var element = elements.pop();
                if (element.getAttribute(TemplateDataAttributes_2.TemplateDataAttributes.NAME) === name) {
                    return element;
                }
                if (element.children && (!element.hasAttribute(TemplateDataAttributes_2.TemplateDataAttributes.CONTROL) || element === this.rootElement)) {
                    var childrenCount = element.children.length;
                    for (var i = 0; i < childrenCount; i++) {
                        elements.push(element.children[i]);
                    }
                }
            }
            return null;
        }
        onIsEnabledChangedOverride() {
        }
        onIsVisibleChangedOverride() {
        }
        onTabIndexChangedOverride() {
        }
        onTooltipChangedOverride() {
        }
        onClassNameChanged(oldValue, newValue) {
            if (this.rootElement) {
                if (oldValue) {
                    var oldClasses = oldValue.split(" ");
                    for (var i = 0; i < oldClasses.length; i++) {
                        this.rootElement.classList.remove(oldClasses[i]);
                    }
                }
                if (newValue) {
                    var newClasses = newValue.split(" ");
                    for (var i = 0; i < newClasses.length; i++) {
                        this.rootElement.classList.add(newClasses[i]);
                    }
                }
            }
        }
        onIsEnabledChanged() {
            if (this.rootElement) {
                if (this.isEnabled) {
                    this.rootElement.classList.remove(TemplateControl.CLASS_DISABLED);
                    this.rootElement.removeAttribute("aria-disabled");
                    this.onTabIndexChanged(this._tabIndex, this._tabIndex);
                }
                else {
                    this.rootElement.classList.add(TemplateControl.CLASS_DISABLED);
                    this.rootElement.setAttribute("aria-disabled", true.toString());
                    this.rootElement.tabIndex = -1;
                }
                this.onIsEnabledChangedOverride();
            }
        }
        onIsVisibleChanged() {
            if (this.rootElement) {
                if (this.isVisible) {
                    this.rootElement.classList.remove(TemplateControl.CLASS_HIDDEN);
                    this.rootElement.removeAttribute("aria-hidden");
                    this.onTabIndexChanged(this._tabIndex, this._tabIndex);
                }
                else {
                    this.rootElement.classList.add(TemplateControl.CLASS_HIDDEN);
                    this.rootElement.setAttribute("aria-hidden", "true");
                    this.rootElement.tabIndex = -1;
                }
                this.onIsVisibleChangedOverride();
            }
        }
        onTabIndexChanged(oldValue, newValue) {
            if (this.rootElement) {
                if (this.isEnabled && this.isVisible) {
                    if (oldValue || newValue || newValue === 0) {
                        this.rootElement.tabIndex = newValue;
                    }
                }
                if (oldValue !== newValue) {
                    this.onTabIndexChangedOverride();
                }
            }
        }
        onTooltipChanged() {
            if (this.rootElement) {
                this.onTooltipChangedOverride();
            }
        }
        setRootElementFromTemplate() {
            var previousRoot;
            this.onTemplateChanging();
            if (this.rootElement) {
                previousRoot = this.rootElement;
                this.rootElement.control = null;
            }
            if (this._templateId) {
                this.rootElement = TemplateLoader_1.templateLoader.loadTemplate(this._templateId);
            }
            else {
                this.rootElement = document.createElement("div");
            }
            if (previousRoot) {
                var attr = previousRoot.attributes.getNamedItem(TemplateDataAttributes_2.TemplateDataAttributes.NAME);
                if (attr) {
                    this.rootElement.setAttribute(attr.name, attr.value);
                }
            }
            this.rootElement.control = this;
            this._binding = new TemplateDataBinding_1.TemplateDataBinding(this);
            if (previousRoot && previousRoot.parentElement) {
                previousRoot.parentElement.replaceChild(this.rootElement, previousRoot);
            }
            this.onApplyTemplate();
        }
    }
    exports.TemplateControl = TemplateControl;
    TemplateControl.CLASS_DISABLED = "disabled";
    TemplateControl.CLASS_HIDDEN = "BPT-hidden";
    TemplateControl.ClassNamePropertyName = "className";
    TemplateControl.IsEnabledPropertyName = "isEnabled";
    TemplateControl.IsVisiblePropertyName = "isVisible";
    TemplateControl.ModelPropertyName = "model";
    TemplateControl.TabIndexPropertyName = "tabIndex";
    TemplateControl.TemplateIdPropertyName = "templateId";
    TemplateControl.TooltipPropertyName = "tooltip";
    TemplateControl.initialize();
});
define("src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateLoader", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/ScriptTemplateRepository", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateControl", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateDataAttributes"], function (require, exports, assert_6, ScriptTemplateRepository_1, TemplateControl_1, TemplateDataAttributes_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.templateLoader = exports.TemplateLoader = void 0;
    class TemplateLoader {
        constructor(repository) {
            assert_6.Assert.hasValue(repository, "Invalid template repository.");
            this._parsingNode = document.createElement("div");
            this._repository = repository;
            this._templateCache = {};
            this._visitedControls = {};
            this._visitedTemplates = {};
        }
        get repository() {
            return this._repository;
        }
        static getControlType(controlName) {
            assert_6.Assert.isTrue(!!controlName, "Invalid control name.");
            var controlType = window;
            var nameParts = controlName.split(".");
            for (var i = 0; i < nameParts.length; i++) {
                var part = nameParts[i];
                controlType = controlType[part];
                assert_6.Assert.hasValue(controlType, "Couldn't find the control with the given name '" + controlName + "'.");
            }
            assert_6.Assert.areEqual(typeof controlType, "function", "The given control '" + controlName + "' doesn't represent a control type which implements IControl.");
            return controlType;
        }
        loadTemplate(templateId) {
            var cachedElement = this._templateCache[templateId];
            if (!cachedElement) {
                var template = this._repository.getTemplateString(templateId);
                assert_6.Assert.isFalse(this._visitedTemplates[templateId], "Detected a recursive template. TemplateId '" + templateId + "' is part of the parents hierarchy.");
                this._visitedTemplates[templateId] = true;
                try {
                    cachedElement = this.loadTemplateUsingHtml(template);
                }
                finally {
                    this._visitedTemplates[templateId] = false;
                }
                this._templateCache[templateId] = cachedElement;
            }
            var rootElement = cachedElement.cloneNode(true);
            rootElement = this.resolvePlaceholders(rootElement);
            return rootElement;
        }
        loadTemplateUsingHtml(templateHtml) {
            this._parsingNode.innerHTML = templateHtml;
            assert_6.Assert.areEqual(this._parsingNode.childElementCount, 1, "Template should have only one root element.");
            var rootElement = this._parsingNode.children[0];
            this._parsingNode.removeChild(rootElement);
            return rootElement;
        }
        getControlInstance(controlName, templateId) {
            assert_6.Assert.isTrue(!!controlName, "Invalid control name.");
            var controlType = TemplateLoader.getControlType(controlName);
            var control;
            if (TemplateControl_1.TemplateControl.prototype.isPrototypeOf(controlType.prototype) ||
                TemplateControl_1.TemplateControl.prototype === controlType.prototype) {
                control = new controlType(templateId);
            }
            else {
                control = new controlType();
            }
            assert_6.Assert.hasValue(control.rootElement, "The given control '" + controlName + "' doesn't represent a control type which implements IControl.");
            if (control.rootElement.control !== control) {
                control.rootElement.control = control;
            }
            return control;
        }
        resolvePlaceholders(root) {
            if (root.hasAttribute(TemplateDataAttributes_3.TemplateDataAttributes.CONTROL)) {
                root = this.resolvePlaceholder(root);
            }
            else {
                var placeholders = root.querySelectorAll("div[" + TemplateDataAttributes_3.TemplateDataAttributes.CONTROL + "]");
                var placeholdersCount = placeholders.length;
                for (var i = 0; i < placeholdersCount; i++) {
                    var node = placeholders[i];
                    this.resolvePlaceholder(node);
                }
            }
            return root;
        }
        resolvePlaceholder(node) {
            assert_6.Assert.isFalse(node.hasChildNodes(), "Control placeholders cannot have children.");
            var controlName = node.getAttribute(TemplateDataAttributes_3.TemplateDataAttributes.CONTROL);
            var templateId = node.getAttribute(TemplateDataAttributes_3.TemplateDataAttributes.CONTROL_TEMPLATE_ID);
            var controlVisistedKey = controlName + (templateId ? "," + templateId : "");
            assert_6.Assert.isFalse(this._visitedControls[controlVisistedKey], "Detected a recursive control. Control '" + controlVisistedKey + "' is part of the parents hierarchy.");
            this._visitedControls[controlVisistedKey] = true;
            try {
                var controlInstance = this.getControlInstance(controlName, templateId);
            }
            finally {
                this._visitedControls[controlVisistedKey] = false;
            }
            var controlNode = controlInstance.rootElement;
            for (var i = 0; i < node.attributes.length; i++) {
                var sourceAttribute = node.attributes[i];
                controlNode.setAttribute(sourceAttribute.name, sourceAttribute.value);
            }
            if (node.parentElement) {
                node.parentElement.replaceChild(controlNode, node);
            }
            return controlNode;
        }
    }
    exports.TemplateLoader = TemplateLoader;
    exports.templateLoader = new TemplateLoader(ScriptTemplateRepository_1.templateRepository);
});
define("src/debugger/PerfDebuggerWebViews/Utilities/StringFormatter", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatTooltip = exports.format = void 0;
    function format(format, ...replacements) {
        return format.replace(/{(\d+)}/g, function (match, n) {
            return typeof replacements[n] != 'undefined'
                ? replacements[n]
                : match;
        });
    }
    exports.format = format;
    function textSplit(str, limit) {
        var NewLine = "\r\n";
        if (str.indexOf(NewLine) >= 0) {
            return str;
        }
        if (str.length <= limit) {
            return str;
        }
        var breakPositon = str.lastIndexOf(" ", limit);
        if (breakPositon !== -1) {
            str = str.substring(0, breakPositon) + NewLine + str.substring(breakPositon + 1);
        }
        else {
            breakPositon = limit;
            str = str.substring(0, breakPositon) + NewLine + str.substring(breakPositon);
        }
        var next = breakPositon + NewLine.length;
        return str.substring(0, next) + textSplit(str.substring(next), limit);
    }
    function formatTooltip(value, height, maxTooltipLength) {
        maxTooltipLength = maxTooltipLength;
        if (maxTooltipLength !== -1) {
            value = textSplit(value, maxTooltipLength);
        }
        if (plugin.Tooltip.defaultTooltipContentToHTML) {
            value = value.replace(/[<>]/g, ($0, $1, $2) => { return ($0 === "<") ? "&lt;" : "&gt;"; });
            value = value.replace("\r\n", "<br/>");
        }
        var tooltip = { content: value, height: height, contentContainsHTML: plugin.Tooltip.defaultTooltipContentToHTML };
        return JSON.stringify(tooltip);
    }
    exports.formatTooltip = formatTooltip;
});
define("src/debugger/PerfDebuggerWebViews/Controls/ItemsControl", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/CollectionChangedAction", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/ObservableCollection", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateControl", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateLoader"], function (require, exports, assert_7, CollectionChangedAction_3, Observable_2, ObservableCollection_2, TemplateControl_2, TemplateLoader_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemsControl = void 0;
    class ItemsControl extends TemplateControl_2.TemplateControl {
        constructor(templateId) {
            super(templateId);
        }
        static initialize() {
            Observable_2.ObservableHelpers.defineProperty(ItemsControl, "items", "", (obj, oldValue, newValue) => obj.onItemsChange(oldValue, newValue));
            Observable_2.ObservableHelpers.defineProperty(ItemsControl, "itemContainerControl", "", (obj, oldValue, newValue) => obj.onItemContainerControlChange(oldValue, newValue));
        }
        getIndex(item) {
            assert_7.Assert.isTrue(!!this._collection, "Expecting a non-null collection in the ItemsControl");
            var index = this._collection.indexOf(item);
            if (index !== -1) {
                return index;
            }
        }
        getItem(index) {
            assert_7.Assert.isTrue(!!this._collection, "Expecting a non-null collection in the ItemsControl");
            return this._collection.getItem(index);
        }
        getItemCount() {
            if (!this._collection) {
                return 0;
            }
            return this._collection.length;
        }
        onTooltipChangedOverride() {
            super.onTooltipChangedOverride();
            this.updateTooltip(this.tooltip);
        }
        disposeItemContainerOverride(control) {
        }
        prepareItemContainerOverride(control, item) {
        }
        onApplyTemplate() {
            super.onApplyTemplate();
            this.panelRootElement = this.getNamedElement(ItemsControl.PanelRootElementName) || this.rootElement;
            assert_7.Assert.isTrue(!!this.panelRootElement, "Expecting a root element for the panel in ItemsControl.");
            this.updateTooltip(this.tooltip);
            this.regenerateItemControls();
        }
        onTemplateChanging() {
            this.updateTooltip(null);
            this.removeAllItemControls();
            super.onTemplateChanging();
        }
        onItemsChangedOverride() {
        }
        onItemContainerControlChangedOverride() {
        }
        onCollectionChangedOverride(args) {
        }
        getAllItemControls() {
            var result = new Array();
            var children = this.panelRootElement.children;
            var childrenLength = children.length;
            for (var i = 0; i < childrenLength; i++) {
                var control = children[i].control;
                result.push(control);
            }
            return result;
        }
        onItemsChange(oldValue, newValue) {
            if (this._collectionChangedRegistration) {
                this._collectionChangedRegistration.unregister();
                this._collectionChangedRegistration = null;
            }
            this._collection = null;
            if (this.items) {
                if (this.items.collectionChanged) {
                    this._collectionChangedRegistration = this.items.collectionChanged.addHandler(this.onCollectionChanged.bind(this));
                    this._collection = this.items;
                }
                else {
                    this._collection = new ObservableCollection_2.ObservableCollection(this.items);
                }
            }
            this.regenerateItemControls();
            this.onItemsChangedOverride();
        }
        onItemContainerControlChange(oldValue, newValue) {
            this._itemContainerClassType = null;
            this._itemContainerTemplateId = null;
            this._itemContainerIsTemplateControl = false;
            if (this.itemContainerControl) {
                var parts = this.itemContainerControl.split(/[()]/, 2);
                if (parts && parts.length > 0) {
                    var className = parts[0];
                    if (className) {
                        className = className.trim();
                    }
                    assert_7.Assert.isTrue(!!className, "Invalid itemContainerControl value. The control class name is required.");
                    var templateId = parts[1];
                    if (templateId) {
                        templateId = templateId.trim();
                    }
                    this._itemContainerClassType = TemplateLoader_2.TemplateLoader.getControlType(className);
                    this._itemContainerTemplateId = templateId;
                    this._itemContainerIsTemplateControl = this._itemContainerClassType === TemplateControl_2.TemplateControl || this._itemContainerClassType.prototype instanceof TemplateControl_2.TemplateControl;
                }
            }
            this.regenerateItemControls();
            this.onItemContainerControlChangedOverride();
        }
        onCollectionChanged(args) {
            switch (args.action) {
                case CollectionChangedAction_3.CollectionChangedAction.Add:
                    this.insertItemControls(args.newStartingIndex, args.newItems.length);
                    break;
                case CollectionChangedAction_3.CollectionChangedAction.Clear:
                    this.removeAllItemControls();
                    break;
                case CollectionChangedAction_3.CollectionChangedAction.Remove:
                    this.removeItemControls(args.oldStartingIndex, args.oldItems.length);
                    break;
                case CollectionChangedAction_3.CollectionChangedAction.Reset:
                    this.regenerateItemControls();
                    break;
            }
            this.onCollectionChangedOverride(args);
        }
        createItemControl(item) {
            var control = new this._itemContainerClassType(this._itemContainerTemplateId);
            this.prepareItemContainer(control, item);
            return control;
        }
        disposeItemContainer(control) {
            this.disposeItemContainerOverride(control);
            if (control && control.model) {
                control.model = null;
            }
        }
        prepareItemContainer(control, item) {
            if (this._itemContainerIsTemplateControl) {
                control.model = item;
            }
            this.prepareItemContainerOverride(control, item);
        }
        regenerateItemControls() {
            this.removeAllItemControls();
            if (!this._collection) {
                return;
            }
            this.insertItemControls(0, this._collection.length);
        }
        insertItemControls(itemIndex, count) {
            if (!this._itemContainerClassType) {
                return;
            }
            var end = itemIndex + count;
            assert_7.Assert.isTrue(end <= this._collection.length, "Unexpected range after inserting into items.");
            assert_7.Assert.isTrue(itemIndex <= this.panelRootElement.childElementCount, "Collection and child elements mismatch.");
            if (itemIndex === this.panelRootElement.childElementCount) {
                for (var i = itemIndex; i < end; i++) {
                    var item = this._collection.getItem(i);
                    var control = this.createItemControl(item);
                    this.panelRootElement.appendChild(control.rootElement);
                }
            }
            else {
                var endNode = this.panelRootElement.childNodes.item(itemIndex);
                for (var i = itemIndex; i < end; i++) {
                    var item = this._collection.getItem(i);
                    var control = this.createItemControl(item);
                    this.panelRootElement.insertBefore(control.rootElement, endNode);
                }
            }
        }
        removeAllItemControls() {
            if (this.panelRootElement) {
                var children = this.panelRootElement.children;
                var childrenLength = children.length;
                for (var i = 0; i < childrenLength; i++) {
                    var control = children[i].control;
                    this.disposeItemContainer(control);
                }
                this.panelRootElement.innerHTML = "";
            }
        }
        removeItemControls(itemIndex, count) {
            for (var i = itemIndex + count - 1; i >= itemIndex; i--) {
                var element = this.panelRootElement.children[i];
                if (element) {
                    var control = element.control;
                    this.disposeItemContainer(control);
                    this.panelRootElement.removeChild(element);
                }
            }
        }
        updateTooltip(tooltip) {
            if (this.rootElement) {
                if (tooltip) {
                    this.rootElement.setAttribute("data-plugin-vs-tooltip", tooltip);
                    this.rootElement.setAttribute("aria-label", tooltip);
                }
                else {
                    this.rootElement.removeAttribute("data-plugin-vs-tooltip");
                    this.rootElement.removeAttribute("aria-label");
                }
            }
        }
    }
    exports.ItemsControl = ItemsControl;
    ItemsControl.PanelRootElementName = "_panel";
    ItemsControl.initialize();
});
define("src/debugger/PerfDebuggerWebViews/Controls/ContentControl", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateControl"], function (require, exports, Observable_3, TemplateControl_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentControl = void 0;
    class ContentControl extends TemplateControl_3.TemplateControl {
        constructor(templateId) {
            super(templateId);
        }
        static initialize() {
            Observable_3.ObservableHelpers.defineProperty(ContentControl, "content", null);
        }
    }
    exports.ContentControl = ContentControl;
    ContentControl.initialize();
});
define("src/debugger/PerfDebuggerWebViews/Controls/SelectableControl", ["require", "exports", "diagnosticsHub", "diagnosticsHub-swimlanes", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert", "src/debugger/PerfDebuggerWebViews/Controls/ContentControl", "src/debugger/PerfDebuggerWebViews/UIFramework/EventSource"], function (require, exports, DiagHub, DiagHubSwimlane, assert_8, ContentControl_1, EventSource_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectableControl = void 0;
    class SelectableControl extends ContentControl_1.ContentControl {
        constructor(templateId) {
            super(templateId || "defaultButtonTemplate");
            this.selectedEvent = new EventSource_3.EventSource();
            this._viewEventManager = DiagHub.getViewEventManager();
            assert_8.Assert.hasValue(this._viewEventManager, "Couldn't find DiagnosticsHub event manager.");
        }
        onMouseClick(e) {
            if (!this.isEnabled) {
                return;
            }
            this.selectEventsTab();
            e.stopImmediatePropagation();
            e.preventDefault();
            this.onMouseClickOverride(e);
        }
        onMouseDown(e) {
            if (!this.isEnabled) {
                return;
            }
            this.selectedEvent.invoke(e);
            e.stopImmediatePropagation();
            e.preventDefault();
            this.onMouseDownOverride(e);
        }
        onMouseUp(e) {
            if (!this.isEnabled) {
                return;
            }
            e.stopImmediatePropagation();
            e.preventDefault();
            this.onMouseUpOverride(e);
        }
        onMouseOut(e) {
            if (!this.isEnabled) {
                return;
            }
            this.onMouseOutOverride(e);
        }
        onMouseOver(e) {
            if (!this.isEnabled) {
                return;
            }
            this.onMouseOverOverride(e);
        }
        onKeyDown(e) {
            if (!this.isEnabled) {
                return;
            }
            if ((e.keyCode === DiagHubSwimlane.KeyCodes.Enter) || (e.keyCode === DiagHubSwimlane.KeyCodes.Space)) {
                this.isPressed = true;
            }
            this.onKeyDownOverride(e);
        }
        onKeyUp(e) {
            if (!this.isEnabled) {
                return;
            }
            if (this.isPressed) {
                this.isPressed = false;
                if (e.keyCode === DiagHubSwimlane.KeyCodes.Enter) {
                    this.selectEventsTab();
                }
                else if (e.keyCode === DiagHubSwimlane.KeyCodes.Space) {
                    this.selectedEvent.invoke(e);
                }
            }
            this.onKeyUpOverride(e);
        }
        onTooltipChangedOverride() {
            super.onTooltipChangedOverride();
            if (this.tooltip) {
                this.rootElement.setAttribute("data-plugin-vs-tooltip", this.tooltip);
            }
            else {
                this.rootElement.removeAttribute("data-plugin-vs-tooltip");
            }
        }
        onMouseClickOverride(e) {
        }
        onMouseDownOverride(e) {
        }
        onMouseUpOverride(e) {
        }
        onMouseOutOverride(e) {
        }
        onMouseOverOverride(e) {
        }
        onKeyDownOverride(e) {
        }
        onKeyUpOverride(e) {
        }
        selectEventsTab() {
            this._viewEventManager.selectDetailsView(SelectableControl.EventsTabGuid);
        }
    }
    exports.SelectableControl = SelectableControl;
    SelectableControl.EventsTabGuid = "{32F335ED-B292-4C8D-B704-E2361CEA03AE}";
});
define("src/debugger/PerfDebuggerWebViews/Controls/TrackItem", ["require", "exports", "src/debugger/PerfDebuggerWebViews/TelemetryService", "src/debugger/PerfDebuggerWebViews/TelemetryServiceMarshallerContracts", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", "src/debugger/PerfDebuggerWebViews/ViewModels/DebugEventViewModel", "src/debugger/PerfDebuggerWebViews/Controls/SelectableControl"], function (require, exports, TelemetryService_1, TelemetryServiceMarshallerContracts_2, Observable_4, DebugEventViewModel_1, SelectableControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TrackItem = void 0;
    class TrackItem extends SelectableControl_1.SelectableControl {
        constructor(templateId) {
            super(templateId);
            this._modelChangedHandlerRegistration = null;
            this._hoverTimeoutId = null;
            this._isFocused = false;
            this._onModelPropertyChangedHandler = null;
            this.rootElement.onfocus = (ev) => { return this.onFocus(ev); };
            this.rootElement.onblur = (ev) => { return this.onBlur(ev); };
            this._onModelPropertyChangedHandler = this.onModelPropertyChanged.bind(this);
        }
        onModelChanged(oldModel, newModel) {
            super.onModelChanged(oldModel, newModel);
            if (oldModel) {
                var oldViewModel = oldModel;
                oldViewModel.propertyChanged.removeHandler(this._onModelPropertyChangedHandler);
            }
            if (this._modelChangedHandlerRegistration !== null) {
                this._modelChangedHandlerRegistration.unregister();
            }
            if (this.model) {
                var viewModel = this.model;
                this.tooltip = viewModel.tooltip;
                viewModel.propertyChanged.addHandler(this._onModelPropertyChangedHandler);
            }
        }
        updateOnInteraction() {
            this.updateOnInteractionOverride();
        }
        updateOnInteractionOverride() {
        }
        onMouseOverOverride(e) {
            this.isHovered = true;
            this._hoverTimeoutId = setTimeout(() => {
                var viewModel = this.model;
                if (viewModel != null) {
                    TelemetryService_1.TelemetryService.onHoverDiagnosticEvent(viewModel.telemetryType);
                }
            }, TelemetryServiceMarshallerContracts_2.TelemetryServiceMarshallerConstants.DefaultHoverEventDelay);
        }
        onMouseOutOverride(e) {
            this.isHovered = false;
            if (this._hoverTimeoutId != null) {
                clearTimeout(this._hoverTimeoutId);
                this._hoverTimeoutId = null;
            }
        }
        isFocused() {
            return this._isFocused;
        }
        focus() {
            this.rootElement.focus();
        }
        blur() {
            this.rootElement.blur();
        }
        static initialize() {
            Observable_4.ObservableHelpers.defineProperty(TrackItem, TrackItem.IsHoveredPropertyName, false, (obj, old, newValue) => obj.updateOnInteraction());
            Observable_4.ObservableHelpers.defineProperty(TrackItem, TrackItem.IsSelectedPropertyName, false, (obj, old, newValue) => obj.updateOnInteraction());
        }
        onFocus(evt) {
            this._isFocused = true;
        }
        onBlur(evt) {
            this._isFocused = false;
        }
        onModelPropertyChanged(property) {
            if (DebugEventViewModel_1.DebugEventViewModel.TooltipPropertyName === property) {
                if (this.model) {
                    var viewModel = this.model;
                    this.tooltip = viewModel.tooltip;
                }
            }
        }
    }
    exports.TrackItem = TrackItem;
    TrackItem.IsHoveredPropertyName = "isHovered";
    TrackItem.IsSelectedPropertyName = "isSelected";
    TrackItem.IsActivePropertyName = "isActive";
    TrackItem.initialize();
});
define("src/debugger/PerfDebuggerWebViews/Controls/TrackControl", ["require", "exports", "diagnosticsHub-swimlanes", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/CollectionChangedAction", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", "src/debugger/PerfDebuggerWebViews/Controls/ItemsControl", "src/debugger/PerfDebuggerWebViews/Controls/TrackItem", "src/debugger/PerfDebuggerWebViews/UIFramework/EventSource"], function (require, exports, DiagHubSwimlane, CollectionChangedAction_4, Observable_5, ItemsControl_1, TrackItem_1, EventSource_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TrackControl = void 0;
    class TrackControl extends ItemsControl_1.ItemsControl {
        constructor(name, templateId, viewport) {
            super(templateId);
            this.isSelectedByUserInput = false;
            this._viewport = null;
            this._name = name;
            this._keyDownEventHandler = evt => this.userInputEventWrapper(evt, this.onKeyDown.bind(this));
            this._keyUpEventHandler = evt => this.userInputEventWrapper(evt, this.onKeyUp.bind(this));
            this._mouseOverEventHandler = evt => this.userInputEventWrapper(evt, this.onMouseOver.bind(this));
            this._mouseOutEventHandler = evt => this.userInputEventWrapper(evt, this.onMouseOut.bind(this));
            this._mouseClickEventHandler = evt => this.userInputEventWrapper(evt, this.onMouseClick.bind(this));
            this._mouseDownEventHandler = evt => this.userInputEventWrapper(evt, this.onMouseDown.bind(this));
            this._mouseUpEventHandler = evt => this.userInputEventWrapper(evt, this.onMouseUp.bind(this));
            this.rootElement.addEventListener("keydown", this._keyDownEventHandler, true);
            this.rootElement.addEventListener("keyup", this._keyUpEventHandler, true);
            this.rootElement.addEventListener("mouseover", this._mouseOverEventHandler);
            this.rootElement.addEventListener("mouseout", this._mouseOutEventHandler);
            this.rootElement.addEventListener("click", this._mouseClickEventHandler);
            this.rootElement.addEventListener("mousedown", this._mouseDownEventHandler);
            this.rootElement.addEventListener("mouseup", this._mouseUpEventHandler);
            this.selectionChangedEvent = new EventSource_4.EventSource();
            this._viewport = viewport;
        }
        static initialize() {
            Observable_5.ObservableHelpers.defineProperty(TrackControl, TrackControl.SelectedItemPropertyName, null, (obj, oldValue, newValue) => obj.onSelectedItemChanged(oldValue, newValue));
            Observable_5.ObservableHelpers.defineProperty(TrackControl, TrackControl.SelectedIndexPropertyName, TrackControl.ClearSelectionIndex, (obj, oldValue, newValue) => obj.onSelectedIndexChanged(oldValue, newValue));
            Observable_5.ObservableHelpers.defineProperty(TrackControl, TrackControl.AriaLabelPropertyName, "");
            Observable_5.ObservableHelpers.defineProperty(TrackControl, TrackControl.PanelClassPropertyName, "display-block");
        }
        onItemsChangedOverride() {
        }
        onCollectionChangedOverride(args) {
            switch (args.action) {
                case CollectionChangedAction_4.CollectionChangedAction.Add:
                case CollectionChangedAction_4.CollectionChangedAction.Remove:
                    var indexOfSelectedItem = this.getIndex(this.selectedItem);
                    if (indexOfSelectedItem != null) {
                        this.selectedIndex = indexOfSelectedItem;
                    }
                    break;
            }
        }
        prepareItemContainerOverride(control, item) {
            super.prepareItemContainerOverride(control, item);
            var itemControl = control;
            itemControl.selectedEvent.addHandler((e) => {
                this.onSelectionChangedByUser();
                if (this.selectedItem === item) {
                    if (!itemControl.isFocused()) {
                        itemControl.focus();
                    }
                    else {
                        this.selectedItem = null;
                    }
                }
                else {
                    this.selectedItem = item;
                }
            });
        }
        findItem(predicate) {
            var count = this.getItemCount();
            for (var i = 0; i < count; ++i) {
                var item = this.getItem(i);
                if (predicate(item)) {
                    return item;
                }
            }
            return null;
        }
        setVisible(isVisible) {
            var className = null;
            if (isVisible) {
                className = "display-block";
            }
            else {
                className = "display-none";
            }
            this.panelClassName = className;
        }
        restoreFocus() {
            var selectedControl = this.getSelectedControl(this.selectedItem);
            if (selectedControl !== null) {
                selectedControl.focus();
            }
        }
        queryNextDataEventOverride(currentItem, isUserInput) {
        }
        queryPreviousDataEventOverride(currentItem, isUserInput) {
        }
        onMouseOverOverride(evt) {
        }
        onMouseOutOverride(evt) {
        }
        getEventTargetControl(targetElement) {
            if (targetElement == null) {
                return null;
            }
            var control = targetElement.control;
            if ((control === this) || (control instanceof TrackItem_1.TrackItem)) {
                return control;
            }
            return this.getEventTargetControl(targetElement.parentElement);
        }
        onSelectedItemChanged(oldValue, newValue) {
            if (this._lastSelectedControl) {
                this._lastSelectedControl.isSelected = false;
            }
            if ((typeof (this.selectedItem) === "undefined") || (this.selectedItem === null)) {
                this.selectedIndex = TrackControl.ClearSelectionIndex;
                this._lastSelectedControl = null;
            }
            else {
                var selectedControl = this.getSelectedControl(this.selectedItem);
                if (selectedControl !== null) {
                    selectedControl.isSelected = true;
                    if (this._viewport.isVisible && this.isSelectedByUserInput) {
                        selectedControl.focus();
                    }
                }
                this.selectedIndex = this.getIndex(this.selectedItem);
                this._lastSelectedControl = selectedControl;
            }
            if (this.selectedItem != null && this.isSelectedByUserInput && this._viewport.isVisible) {
                this._viewport.disableAutoScrolling();
            }
            this.selectionChangedEvent.invoke({
                selectedItem: this.selectedItem,
                previousSelectedItem: oldValue,
                isSelectedByUserInput: this.isSelectedByUserInput
            });
            this.isSelectedByUserInput = false;
        }
        getSelectedControl(item) {
            var controls = this.getAllItemControls();
            for (var i = 0; i < length; ++i) {
                var control = controls[i];
                if (control.model === item) {
                    return control;
                }
            }
            return null;
        }
        onSelectedIndexChanged(oldValue, newValue) {
            if ((typeof (this.selectedIndex) === "undefined") || (this.selectedIndex === TrackControl.ClearSelectionIndex)) {
                this.selectedItem = null;
            }
            else {
                var item = this.getItem(this.selectedIndex);
                this.selectedItem = item;
            }
        }
        selectNextItem() {
            if ((this.selectedIndex === TrackControl.ClearSelectionIndex) && this.getItemCount() > 0) {
                this.onSelectionChangedByUser();
                this.selectedIndex = 0;
            }
            else if (this.selectedIndex < this.getItemCount() - 1) {
                this.onSelectionChangedByUser();
                ++this.selectedIndex;
            }
            else {
                this.queryNextDataEvent(this.selectedItem, true);
            }
        }
        selectPreviousItem() {
            if (this.selectedIndex === 0) {
                this.queryPreviousDataEvent(this.selectedItem, true);
            }
            else if (this.selectedIndex > 0) {
                this.onSelectionChangedByUser();
                --this.selectedIndex;
            }
        }
        queryNextDataEvent(currentItem, isUserInput) {
            this.queryNextDataEventOverride(currentItem, isUserInput);
        }
        queryPreviousDataEvent(currentItem, isUserInput) {
            this.queryPreviousDataEventOverride(currentItem, isUserInput);
        }
        onSelectionChangedByUser() {
            this.isSelectedByUserInput = true;
        }
        userInputEventWrapper(evt, handler) {
            if (evt == null || handler == null) {
                return;
            }
            var control = this.getEventTargetControl(evt.target);
            return handler(evt, control);
        }
        onKeyDown(evt, control) {
            switch (evt.keyCode) {
                case DiagHubSwimlane.KeyCodes.ArrowLeft:
                    this.selectPreviousItem();
                    break;
                case DiagHubSwimlane.KeyCodes.ArrowRight:
                    this.selectNextItem();
                    break;
            }
            if ((control != null) && (control !== this)) {
                var itemControl = control;
                itemControl.onKeyDown(evt);
            }
        }
        onKeyUp(evt, control) {
            if ((control != null) && (control !== this)) {
                var itemControl = control;
                itemControl.onKeyUp(evt);
            }
        }
        onMouseOver(evt, control) {
            if ((control != null) && (control !== this)) {
                var itemControl = control;
                itemControl.onMouseOver(evt);
            }
            this.onMouseOverOverride(evt);
        }
        onMouseOut(evt, control) {
            if ((control != null) && (control !== this)) {
                var itemControl = control;
                itemControl.onMouseOut(evt);
            }
            this.onMouseOutOverride(evt);
        }
        onMouseClick(evt, control) {
            if ((control != null) && (control !== this)) {
                var itemControl = control;
                itemControl.onMouseClick(evt);
            }
        }
        onMouseDown(evt, control) {
            if (control === this) {
            }
            else if (control != null) {
                var itemControl = control;
                itemControl.onMouseDown(evt);
            }
        }
        onMouseUp(evt, control) {
            if (control === this) {
            }
            else if (control != null) {
                var itemControl = control;
                itemControl.onMouseUp(evt);
            }
        }
        navigateNextItem() {
            this.selectNextItem();
        }
        navigatePreviousItem() {
            this.selectPreviousItem();
        }
    }
    exports.TrackControl = TrackControl;
    TrackControl.SelectedItemPropertyName = "selectedItem";
    TrackControl.SelectedIndexPropertyName = "selectedIndex";
    TrackControl.AriaLabelPropertyName = "ariaLabel";
    TrackControl.PanelClassPropertyName = "panelClassName";
    TrackControl.ClearSelectionIndex = -1;
    TrackControl.initialize();
});
define("src/debugger/PerfDebuggerWebViews/EventSelectionManager", ["require", "exports", "diagnosticsHub", "src/debugger/PerfDebuggerWebViews/PortMarshallerContracts", "src/debugger/PerfDebuggerWebViews/UIFramework/EventSource"], function (require, exports, DiagHub, PortMarshallerContracts_2, EventSource_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventSelectionManager = void 0;
    class EventSelectionManager {
        constructor(tracks) {
            this._selectedDiagnosticDataId = null;
            this._selectedTrack = null;
            this._isUserInput = false;
            this._logger = DiagHub.getLogger();
            this._tracks = tracks;
            this.selectionChangedEvent = new EventSource_5.EventSource();
            tracks.forEach((track) => {
                if (track) {
                    track.selectionChangedEvent.addHandler((eventArgs) => {
                        if (eventArgs) {
                            this.setSelectedByTrackAndItem(track, eventArgs.selectedItem, eventArgs.previousSelectedItem, eventArgs.isSelectedByUserInput);
                        }
                    });
                }
            });
        }
        isSelected(item) {
            return this._selectedDiagnosticDataId === item.diagnosticDataId;
        }
        restoreSelectedTrackAndItem() {
            if (this._selectedTrack != null && this._selectedDiagnosticDataId !== null) {
                var selectedItem = this._selectedTrack.findItem((item) => {
                    return item.diagnosticDataId === this._selectedDiagnosticDataId;
                });
                if (selectedItem !== null) {
                    if (this._selectedTrack.selectedItem !== selectedItem) {
                        if (this._isUserInput) {
                            this._selectedTrack.onSelectionChangedByUser();
                            this._isUserInput = false;
                        }
                        this._selectedTrack.selectedItem = selectedItem;
                    }
                }
                else {
                    this._logger.warning("Failed to find selected item.");
                }
            }
        }
        clearSelection() {
            this.setSelectedByTrackAndItem(null, null, null, false);
        }
        storeSelectedTrackAndId(track, diagnosticDataId, isUserInput) {
            this._selectedTrack = track;
            this._selectedDiagnosticDataId = diagnosticDataId;
            this._isUserInput = isUserInput;
        }
        selectByDiagnosticDataId(diagnosticDataId) {
            if (diagnosticDataId !== PortMarshallerContracts_2.PortMarshallerConstants.InvalidDiagnosticDataId) {
                for (var i = 0; i < this._tracks.length; ++i) {
                    var track = this._tracks[i];
                    if (track) {
                        var matchingItem = track.findItem((item) => {
                            return item.diagnosticDataId === diagnosticDataId;
                        });
                        if (matchingItem != null) {
                            track.selectedItem = matchingItem;
                            return;
                        }
                    }
                }
            }
            this.clearSelection();
        }
        setSelectedByTrackAndItem(selectedTrack, selectedItem, previousSelectedItem, isSelectedByUserInput) {
            if (this._selectedTrack !== selectedTrack) {
                if (this._selectedTrack != null) {
                    previousSelectedItem = this._selectedTrack.selectedItem;
                    this._selectedTrack.selectedItem = null;
                }
                this._selectedTrack = selectedTrack;
            }
            if (this._selectedTrack != null) {
                this._selectedTrack.selectedItem = selectedItem;
            }
            if (selectedItem !== null) {
                this._selectedDiagnosticDataId = selectedItem.diagnosticDataId;
            }
            else {
                this._selectedDiagnosticDataId = null;
            }
            this.selectionChangedEvent.invoke({
                selectedItem: selectedItem,
                previousSelectedItem: previousSelectedItem,
                isSelectedByUserInput: isSelectedByUserInput || this._isUserInput
            });
            this._isUserInput = false;
        }
    }
    exports.EventSelectionManager = EventSelectionManager;
});
define("src/debugger/PerfDebuggerWebViews/IntelliTracePortMarshaller", ["require", "exports", "plugin-vs-v2", "src/debugger/PerfDebuggerWebViews/PortMarshallerContracts"], function (require, exports, plugin_vs_v2_2, PortMarshallerContracts_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntelliTracePortMarshaller = void 0;
    class IntelliTracePortMarshaller {
        constructor() {
            this._adapter = plugin_vs_v2_2.JSONMarshaler.attachToMarshaledObject(PortMarshallerContracts_3.PortMarshallerConstants.PortMarshallerName, {}, true);
        }
        addSwimlaneDataChangedEventListener(listener) {
            this._adapter.addEventListener(PortMarshallerContracts_3.PortMarshallerConstants.SwimlaneDataChangedEvent, listener);
        }
        removeSwimlaneDataChangedEventListener(listener) {
            this._adapter.removeEventListener(PortMarshallerContracts_3.PortMarshallerConstants.SwimlaneDataChangedEvent, listener);
        }
        addTabularViewSelectionChangedEventListener(listener) {
            this._adapter.addEventListener(PortMarshallerContracts_3.PortMarshallerConstants.TabularViewSelectionChangedEvent, listener);
        }
        removeTabularViewSelectionChangedEventListener(listener) {
            this._adapter.removeEventListener(PortMarshallerContracts_3.PortMarshallerConstants.TabularViewSelectionChangedEvent, listener);
        }
        addDebugModeChangedEventListener(listener) {
            this._adapter.addEventListener(PortMarshallerContracts_3.PortMarshallerConstants.DebugModeChangedEvent, listener);
        }
        removeDebugModeChangedEventListener(listener) {
            this._adapter.removeEventListener(PortMarshallerContracts_3.PortMarshallerConstants.DebugModeChangedEvent, listener);
        }
        addActivatedDataChangedEventListener(listener) {
            this._adapter.addEventListener(PortMarshallerContracts_3.PortMarshallerConstants.ActivatedDataChangedEvent, listener);
        }
        removeActivatedDataChangedEventListener(listener) {
            this._adapter.removeEventListener(PortMarshallerContracts_3.PortMarshallerConstants.ActivatedDataChangedEvent, listener);
        }
        addFocusOnLastBreakEventListener(listener) {
            this._adapter.addEventListener(PortMarshallerContracts_3.PortMarshallerConstants.FocusOnLastBreakEvent, listener);
        }
        removeFocusOnLastBreakEventListener(listener) {
            this._adapter.removeEventListener(PortMarshallerContracts_3.PortMarshallerConstants.FocusOnLastBreakEvent, listener);
        }
        notifySelectionTimeRangeChanged(timeRangeBeginNanoseconds, timeRangeEndNanoseconds) {
            this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifySelectionTimeRangeChanged, timeRangeBeginNanoseconds, timeRangeEndNanoseconds);
        }
        notifyViewPortChanged(timeRangeBeginNanoseconds, timeRangeEndNanoseconds) {
            this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifyViewPortChanged, timeRangeBeginNanoseconds, timeRangeEndNanoseconds);
        }
        notifyClientSizeChanged(clientWidth) {
            this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifyClientSizeChanged, clientWidth);
        }
        notifySwimlaneIsVisibleChanged(isVisible) {
            this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifySwimlaneIsVisibleChanged, isVisible);
        }
        notifySwimlaneDataSelectionChanged(diagnosticDataId) {
            this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifySwimlaneDataSelectionChanged, diagnosticDataId);
        }
        notifyQueryPreviousBreakEvent(timeInNanoseconds) {
            return this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifyQueryPreviousBreakEvent, timeInNanoseconds);
        }
        notifyQueryNextBreakEvent(timeInNanoseconds) {
            return this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifyQueryNextBreakEvent, timeInNanoseconds);
        }
        notifyReadyForData() {
            this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifyReadyForData);
        }
        notifyViewableViewportBase(base) {
            this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.NotifyViewableViewportBase, base);
        }
        acknowledgeData() {
            this._adapter._call(PortMarshallerContracts_3.PortMarshallerConstants.SwimlaneAcknowledgeData);
        }
    }
    exports.IntelliTracePortMarshaller = IntelliTracePortMarshaller;
});
define("src/debugger/PerfDebuggerWebViews/Controls/BreakEventItem", ["require", "exports", "src/debugger/PerfDebuggerWebViews/Converters/ItemXOffsetConverter", "src/debugger/PerfDebuggerWebViews/PortMarshallerContracts", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", "src/debugger/PerfDebuggerWebViews/Controls/TrackItem"], function (require, exports, ItemXOffsetConverter_2, PortMarshallerContracts_4, Observable_6, TrackItem_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreakEventItem = void 0;
    class BreakEventItem extends TrackItem_2.TrackItem {
        onModelChanged(oldModel, newModel) {
            super.onModelChanged(oldModel, newModel);
            this.update();
        }
        updateOnInteractionOverride() {
            this.update();
        }
        onMouseOverOverride(e) {
            if (this.isMouseEventInsideControl(e)) {
                return;
            }
            super.onMouseOverOverride(e);
        }
        onMouseOutOverride(e) {
            if (this.isMouseEventInsideControl(e)) {
                return;
            }
            super.onMouseOutOverride(e);
        }
        isMouseEventInsideControl(e) {
            if (e == null) {
                return false;
            }
            var target = e.relatedTarget;
            while (target != null) {
                if (target === this.rootElement) {
                    return true;
                }
                target = target.parentElement;
            }
            return false;
        }
        update() {
            if (this.model != null) {
                var debugEventViewModel = this.model;
                var calculatedOffset = ItemXOffsetConverter_2.itemXOffsetConverter.calculateXOffset(debugEventViewModel.timeInNanoseconds);
                var calculatedEndOffset = ItemXOffsetConverter_2.itemXOffsetConverter.calculateXOffset(debugEventViewModel.timeInNanoseconds + debugEventViewModel.duration);
                var calculatedWidth = Math.max(calculatedEndOffset - calculatedOffset - 1, 1);
                if (calculatedOffset < 0) {
                    calculatedWidth = calculatedWidth + calculatedOffset;
                    calculatedOffset = 0;
                }
                this.xOffset = calculatedOffset + "px";
                this.width = calculatedWidth + "px";
                var newBreakEventClass = "break-event ";
                var breakEventType = PortMarshallerContracts_4.BreakEventType[debugEventViewModel.breakType].toLowerCase();
                newBreakEventClass += breakEventType;
                if (this.isHovered || this.isSelected) {
                    newBreakEventClass += " activated";
                    if (this.isSelected) {
                        newBreakEventClass += " selected";
                    }
                }
                this.breakEventClass = newBreakEventClass;
            }
        }
        static initialize() {
            Observable_6.ObservableHelpers.defineProperty(BreakEventItem, BreakEventItem.BreakEventClassPropertyName, "");
            Observable_6.ObservableHelpers.defineProperty(BreakEventItem, BreakEventItem.XOffsetPropertyName, "0px");
            Observable_6.ObservableHelpers.defineProperty(BreakEventItem, BreakEventItem.WidthPropertyName, "0px");
        }
    }
    exports.BreakEventItem = BreakEventItem;
    BreakEventItem.BreakEventClassPropertyName = "breakEventClass";
    BreakEventItem.XOffsetPropertyName = "xOffset";
    BreakEventItem.WidthPropertyName = "width";
    BreakEventItem.initialize();
});
define("src/debugger/PerfDebuggerWebViews/Controls/BreakEventTrackControl", ["require", "exports", "diagnosticsHub", "src/debugger/PerfDebuggerWebViews/Controls/BreakEventItem", "src/debugger/PerfDebuggerWebViews/Controls/TrackControl"], function (require, exports, DiagHub, BreakEventItem_1, TrackControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreakEventTrackControl = void 0;
    class BreakEventTrackControl extends TrackControl_1.TrackControl {
        constructor(trackName, templateId, viewport, portMarshaller, breakEventKindId) {
            super(trackName, templateId, viewport);
            this._logger = null;
            this._selectionManager = null;
            this._selectionChangedRegistration = null;
            this._logger = DiagHub.getLogger();
            this.itemContainerControl = "IntelliTrace.DiagnosticsHub.Controls.BreakEventItem(DiagnosticsHubControlTemplate.breakEventButtonTemplate)";
            this.tabIndex = 0;
            this._portMarshaller = portMarshaller;
            this._lastNonStepBreakEventStartTime = 0;
            this._breakEventKindId = breakEventKindId;
        }
        set selectionManager(value) {
            this._selectionManager = value;
        }
        render(fullRender, refresh) {
            if (fullRender) {
                if (this._selectionChangedRegistration !== null) {
                    this._selectionChangedRegistration.unregister();
                }
                this._selectionChangedRegistration = this.selectionChangedEvent.addHandler(this.onSelectionChanged.bind(this));
            }
        }
        queryNextDataEventOverride(item, isUserInput) {
            if (!item) {
                return;
            }
            this._portMarshaller.notifyQueryNextBreakEvent(item.timeInNanoseconds).then((diagnosticEventData) => {
                if (diagnosticEventData != null) {
                    this.scrollToNextBreakEvent(diagnosticEventData.EventStartTimeNanoseconds, diagnosticEventData.EventEndTimeNanoseconds, diagnosticEventData.DiagnosticDataId, isUserInput);
                }
            });
        }
        scrollToNextBreakEvent(beginTime, endTime, diagnosticDataId, isUserInput) {
            if (this._selectionManager !== null) {
                this._selectionManager.storeSelectedTrackAndId(this, diagnosticDataId, isUserInput);
            }
            if (endTime === beginTime) {
                endTime = beginTime + 1;
            }
            var duration = endTime - beginTime;
            var newViewportBegin = 0;
            var accountForBorder = this._viewport.nanosecondsPerPixel;
            if (duration < this._viewport.timeRange.duration) {
                newViewportBegin = endTime - this._viewport.timeRange.duration;
                newViewportBegin += accountForBorder;
            }
            else {
                newViewportBegin = beginTime - accountForBorder;
            }
            var newSelectedTime = new DiagHub.JsonTimespan(DiagHub.BigNumber.convertFromNumber(beginTime), DiagHub.BigNumber.convertFromNumber(endTime));
            this._viewport.alignViewportWithSelectedTime(newViewportBegin, newSelectedTime);
        }
        queryPreviousDataEventOverride(item, isUserInput) {
            if (!item) {
                return;
            }
            this._portMarshaller.notifyQueryPreviousBreakEvent(item.timeInNanoseconds).then((diagnosticEventData) => {
                if (diagnosticEventData != null) {
                    this.scrollToPreviousBreakEvent(diagnosticEventData.EventStartTimeNanoseconds, diagnosticEventData.EventEndTimeNanoseconds, diagnosticEventData.DiagnosticDataId, isUserInput);
                }
            });
        }
        scrollToPreviousBreakEvent(beginTime, endTime, diagnosticDataId, isUserInput) {
            if (this._selectionManager !== null) {
                this._selectionManager.storeSelectedTrackAndId(this, diagnosticDataId, isUserInput);
            }
            if (beginTime === endTime) {
                endTime = beginTime + 1;
            }
            var duration = endTime - beginTime;
            var accountForBorder = this._viewport.nanosecondsPerPixel;
            var newViewportBegin = 0;
            if (duration > this._viewport.timeRange.duration) {
                newViewportBegin = endTime - this._viewport.timeRange.duration;
                newViewportBegin += accountForBorder;
            }
            else {
                newViewportBegin = beginTime - accountForBorder;
            }
            var newSelectedTime = new DiagHub.JsonTimespan(DiagHub.BigNumber.convertFromNumber(beginTime), DiagHub.BigNumber.convertFromNumber(endTime));
            this._viewport.alignViewportWithSelectedTime(newViewportBegin, newSelectedTime);
        }
        onSelectionChanged(eventArgs) {
            var selectedItem = eventArgs.selectedItem;
            var isSelectedByUserInput = eventArgs.isSelectedByUserInput;
            if (!selectedItem) {
                return;
            }
            if (isSelectedByUserInput && this._selectionManager !== null) {
                var accountForBorder = this._viewport.nanosecondsPerPixel;
                var newViewportBegin = null;
                if (this._viewport.isBeforeViewport(selectedItem.timeInNanoseconds)) {
                    if (selectedItem.duration > this._viewport.timeRange.duration) {
                        newViewportBegin = (selectedItem.timeInNanoseconds + selectedItem.duration) - this._viewport.timeRange.duration;
                        newViewportBegin += accountForBorder;
                    }
                    else {
                        newViewportBegin = selectedItem.timeInNanoseconds - accountForBorder;
                    }
                }
                else if (this._viewport.isAfterViewport(selectedItem.timeInNanoseconds + selectedItem.duration)) {
                    if (selectedItem.duration < this._viewport.timeRange.duration) {
                        newViewportBegin = (selectedItem.timeInNanoseconds + selectedItem.duration) - this._viewport.timeRange.duration;
                        newViewportBegin += accountForBorder;
                    }
                    else {
                        newViewportBegin = selectedItem.timeInNanoseconds - accountForBorder;
                    }
                }
                var duration = Math.max(1, selectedItem.duration);
                if (newViewportBegin !== null) {
                    var newSelectedTime = new DiagHub.JsonTimespan(DiagHub.BigNumber.convertFromNumber(selectedItem.timeInNanoseconds), DiagHub.BigNumber.convertFromNumber(selectedItem.timeInNanoseconds + duration));
                    var willViewportChanged = ((newViewportBegin < 0) ||
                        this._viewport.viewableBase.greaterOrEqual(DiagHub.BigNumber.convertFromNumber(newViewportBegin))) &&
                        this._viewport.viewableBase.equals(this._viewport.timeRange.beginInHubTime);
                    if (willViewportChanged) {
                        this._selectionManager.storeSelectedTrackAndId(this, selectedItem.diagnosticDataId, true);
                    }
                    this._viewport.alignViewportWithSelectedTime(newViewportBegin, newSelectedTime);
                }
                else {
                    this._viewport.selectTimeRange(selectedItem.timeInNanoseconds, selectedItem.timeInNanoseconds + duration);
                }
            }
        }
        onMouseOverOverride(evt) {
            var targetControl = this.getEventTargetControl(evt.target);
            if (targetControl instanceof BreakEventItem_1.BreakEventItem) {
                this.panelClassName = "display-block show-hat";
            }
        }
        onMouseOutOverride(evt) {
            var targetControl = this.getEventTargetControl(evt.target);
            if (targetControl instanceof BreakEventItem_1.BreakEventItem) {
                this.panelClassName = "display-block";
            }
        }
    }
    exports.BreakEventTrackControl = BreakEventTrackControl;
});
define("src/debugger/PerfDebuggerWebViews/ResourceManager", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert"], function (require, exports, assert_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceManager = void 0;
    class ResourceManager {
        constructor(resourceStrings) {
            assert_9.Assert.hasValue(resourceStrings, "Invalid resourceStrings parameter");
            this._resourceStrings = resourceStrings;
        }
        getResource(resourceName) {
            if (this._resourceStrings && this._resourceStrings.hasOwnProperty(resourceName)) {
                return this._resourceStrings[resourceName];
            }
            else {
                return "";
            }
        }
    }
    exports.ResourceManager = ResourceManager;
});
define("src/debugger/PerfDebuggerWebViews/Controls/DiscreteEventTrackControl", ["require", "exports", "src/debugger/PerfDebuggerWebViews/Controls/TrackControl"], function (require, exports, TrackControl_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiscreteEventTrackControl = void 0;
    class DiscreteEventTrackControl extends TrackControl_2.TrackControl {
        constructor(trackName, templateId, viewport) {
            super(trackName, templateId, viewport);
            this._selectionChangedRegistration = null;
        }
        render(fullRender, refresh) {
            if (fullRender) {
                if (this._selectionChangedRegistration !== null) {
                    this._selectionChangedRegistration.unregister();
                }
                this._selectionChangedRegistration = this.selectionChangedEvent.addHandler(this.onSelectionChanged.bind(this));
            }
        }
        onSelectionChanged(eventArgs) {
            var selectedItem = eventArgs.selectedItem;
            var isSelectedByUserInput = eventArgs.isSelectedByUserInput;
            if ((selectedItem != null) && isSelectedByUserInput) {
                this._viewport.ensureTimeInsideSelection(this.selectedItem.timeInNanoseconds);
            }
        }
    }
    exports.DiscreteEventTrackControl = DiscreteEventTrackControl;
});
define("src/debugger/PerfDebuggerWebViews/TrackControlAndData", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/SortedObservableCollection", "src/debugger/PerfDebuggerWebViews/ViewModels/DebugEventViewModel"], function (require, exports, SortedObservableCollection_1, DebugEventViewModel_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TrackControlAndData = void 0;
    class TrackControlAndData {
        constructor(trackControl, localizedName) {
            this._trackControl = null;
            this._trackLocalizedName = null;
            this._visibleEventList = null;
            this._trackControl = trackControl;
            this._visibleEventList = new SortedObservableCollection_1.SortedObservableCollection(DebugEventViewModel_2.DebugEventViewModel.EventOrderComparator);
            this._trackLocalizedName = localizedName;
        }
        get trackControl() {
            return this._trackControl;
        }
        get visibleEventList() {
            return this._visibleEventList;
        }
        get trackLocalizedName() {
            return this._trackLocalizedName;
        }
    }
    exports.TrackControlAndData = TrackControlAndData;
});
define("src/debugger/PerfDebuggerWebViews/EventsSwimlane", ["require", "exports", "diagnosticsHub", "src/debugger/PerfDebuggerWebViews/Controls/BreakEventTrackControl", "src/debugger/PerfDebuggerWebViews/EventSelectionManager", "src/debugger/PerfDebuggerWebViews/PortMarshallerContracts", "src/debugger/PerfDebuggerWebViews/ResourceManager", "src/debugger/PerfDebuggerWebViews/SwimlaneTimeRange", "src/debugger/PerfDebuggerWebViews/SwimlaneViewPort", "src/debugger/PerfDebuggerWebViews/TimeIndicator", "src/debugger/PerfDebuggerWebViews/TrackControlAndData", "src/debugger/PerfDebuggerWebViews/UIFramework/Templating/TemplateControl", "src/debugger/PerfDebuggerWebViews/ViewModels/DebugEventViewModel", "src/debugger/PerfDebuggerWebViews/UIFramework/EventSource", "src/debugger/PerfDebuggerWebViews/Converters/ItemXOffsetConverter", "src/debugger/PerfDebuggerWebViews/Controls/DiscreteEventTrackControl", "diagnosticsHub", "src/debugger/PerfDebuggerWebViews/Utilities/StringFormatter"], function (require, exports, DiagHub, BreakEventTrackControl_1, EventSelectionManager_1, PortMarshallerContracts_5, ResourceManager_1, SwimlaneTimeRange_2, SwimlaneViewPort_1, TimeIndicator_1, TrackControlAndData_1, TemplateControl_4, DebugEventViewModel_3, EventSource_6, ItemXOffsetConverter_3, DiscreteEventTrackControl_1, diagnosticsHub_2, StringFormatter) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventsSwimlane = void 0;
    class EventsSwimlane {
        constructor(graphConfig, resources, portMarshaller, isVisible, viewportController) {
            this._rootElement = null;
            this._hasFocus = false;
            this._activatedEventIndicator = null;
            this._liveEventViewModel = null;
            this._breakTrackControlCache = null;
            this._eventTrackControlAndData = [];
            this._eventKindIdToTrackMap = {};
            this._eventKindIdToName = {};
            this._breakEventKindId = PortMarshallerContracts_5.PortMarshallerConstants.InvalidEventKindId;
            this._viewport = null;
            this._selectionManager = null;
            this._activatedEventViewModel = null;
            this._logger = DiagHub.getLogger();
            this._logger.debug("IntelliTraceSwimlane: constructor()");
            this._resourceManager = new ResourceManager_1.ResourceManager(resources);
            this._portMarshaller = portMarshaller;
            this._graphConfig = graphConfig;
            this._viewport = new SwimlaneViewPort_1.SwimlaneViewport(viewportController);
            this._viewport.isVisible = isVisible;
            this._breakEventKindId = this._graphConfig.eventKindNameToId[PortMarshallerContracts_5.PortMarshallerConstants.BreakEventKindName];
            this._eventKindIdToName = this._graphConfig.eventKindIdToName;
            ItemXOffsetConverter_3.itemXOffsetConverter.swimlaneViewport = this._viewport;
            this.selectionChangedEvent = new EventSource_6.EventSource();
        }
        initializeEventTracks(parentElement) {
            if (parentElement) {
                var swimlaneControl = new TemplateControl_4.TemplateControl("DiagnosticsHubControlTemplate.swimlaneTemplate");
                parentElement.appendChild(swimlaneControl.rootElement);
                this._rootElement = (swimlaneControl.rootElement.getElementsByClassName("graph-canvas")[0]);
                this._focusInEventHandler = this.onFocusIn.bind(this);
                this._focusOutEventHandler = this.onFocusOut.bind(this);
                this._rootElement.addEventListener("focusout", this._focusOutEventHandler);
                this._rootElement.addEventListener("focusin", this._focusInEventHandler);
                var tracks = new Array();
                this._graphConfig.trackConfigurations.forEach(function (config) {
                    var trackControl = null;
                    if (config.Id === PortMarshallerContracts_5.PortMarshallerConstants.BreakEventKindName) {
                        trackControl = new BreakEventTrackControl_1.BreakEventTrackControl(config.Id, "DiagnosticsHubControlTemplate.eventTrackTemplate", this._viewport, this._portMarshaller, this._breakEventKindId);
                        this._breakTrackControlCache = trackControl;
                    }
                    else {
                        trackControl = new DiscreteEventTrackControl_1.DiscreteEventTrackControl(config.Id, "DiagnosticsHubControlTemplate.eventTrackTemplate", this._viewport);
                        trackControl.itemContainerControl = "IntelliTrace.DiagnosticsHub.Controls.DiscreteEventItem(DiagnosticsHubControlTemplate.eventButtonTemplate)";
                    }
                    trackControl.tabIndex = 0;
                    tracks.push(trackControl);
                    var trackControlAndData = new TrackControlAndData_1.TrackControlAndData(trackControl, config.LabelTooltip);
                    this.updateTrackAriaAndTooltip(trackControlAndData);
                    this._eventTrackControlAndData.push(trackControlAndData);
                    config.AcceptedEventKindIds.forEach(function (id) {
                        this._eventKindIdToTrackMap[id] = trackControlAndData;
                    }, this);
                }, this);
                this._selectionManager = new EventSelectionManager_1.EventSelectionManager(tracks);
                this._selectionManager.selectionChangedEvent.addHandler((eventArgs) => {
                    this.selectionChangedEvent.invoke(eventArgs);
                });
                if (this._breakTrackControlCache != null) {
                    this._breakTrackControlCache.selectionManager = this._selectionManager;
                }
                this._activatedEventIndicator = new TimeIndicator_1.TimeIndicator(this._rootElement, this._viewport);
            }
        }
        getResource(key) {
            return this._resourceManager.getResource(key);
        }
        isBreakEventKind(kind) {
            return this._breakEventKindId === kind;
        }
        dispose() {
            if (this._rootElement !== null) {
                this._rootElement.removeEventListener("focusout", this._focusOutEventHandler);
                this._rootElement.removeEventListener("focusin", this._focusInEventHandler);
            }
        }
        onViewportChanged(viewPort) {
            if (!viewPort || !viewPort.begin || !viewPort.end) {
                this._logger.error("EventsSwimlane.onViewportChanged(): invalid viewPort parameter");
                return;
            }
            if (this._activatedEventIndicator != null) {
                this._activatedEventIndicator.render(false);
            }
            if (this._viewport.isViewableBaseChanged()) {
                this._portMarshaller.notifyViewableViewportBase(SwimlaneTimeRange_2.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this._viewport.viewableBase));
            }
        }
        notifyClientSizeChanged() {
            if (!this._rootElement) {
                this._logger.error("EventsSwimlane.notifyClientSizeChanged(): invalid _rootElement");
                return;
            }
            this._viewport.clientWidth = this._rootElement.clientWidth;
            if (this._activatedEventIndicator != null) {
                this._activatedEventIndicator.render(false);
            }
            this._portMarshaller.notifyClientSizeChanged(this._viewport.clientWidth);
        }
        renderTracks(fullRender, refresh) {
            if (!this._rootElement) {
                this._logger.error("EventsSwimlane.renderTracks(): invalid _rootElement");
                return;
            }
            if (fullRender) {
                while (this._rootElement.childNodes.length > 0) {
                    this._rootElement.removeChild(this._rootElement.firstChild);
                }
                this._eventTrackControlAndData.forEach(function (track) {
                    track.trackControl.items = track.visibleEventList;
                    track.trackControl.render(fullRender, refresh);
                    this._rootElement.appendChild(track.trackControl.rootElement);
                }, this);
                this._activatedEventIndicator.render(true);
            }
        }
        notifyActivatedDataChanged(activatedEventArgs) {
            this._activatedEventIndicator.isLiveDebugging = activatedEventArgs.IsLiveDebugging;
            if (activatedEventArgs.DiagnosticData == null) {
                this._activatedEventIndicator.time = null;
                this._viewport.enableAutoScrolling();
            }
            else {
                this._activatedEventIndicator.time = activatedEventArgs.DiagnosticData.EventEndTimeNanoseconds;
                if (!this._viewport.isInViewport(this._activatedEventIndicator.time)) {
                    this._viewport.centerViewportTo(this._activatedEventIndicator.time);
                }
            }
            var oldActivatedEvent = this._activatedEventViewModel;
            var newActivatedEvent = null;
            if (activatedEventArgs.DiagnosticData !== null) {
                var id = activatedEventArgs.DiagnosticData.DiagnosticDataId;
                if (!this._activatedEventViewModel || id !== this._activatedEventViewModel.diagnosticDataId) {
                    for (var trackControlAndData of this._eventTrackControlAndData) {
                        var found = trackControlAndData.trackControl.findItem((item) => {
                            return item.diagnosticDataId === id;
                        });
                        if (found) {
                            newActivatedEvent = found;
                            break;
                        }
                    }
                }
            }
            if (oldActivatedEvent !== newActivatedEvent) {
                if (oldActivatedEvent) {
                    oldActivatedEvent.isActivatedEvent = false;
                }
                this._activatedEventViewModel = newActivatedEvent;
                if (newActivatedEvent) {
                    this._activatedEventViewModel.isActivatedEvent = true;
                }
            }
            this._eventTrackControlAndData.forEach(function (track) {
                this.updateTrackAriaAndTooltip(track);
            }, this);
            this._activatedEventIndicator.render(false);
        }
        onDebugModeChanged(eventArgs) {
            if (eventArgs != null) {
                if (eventArgs.NewMode === PortMarshallerContracts_5.DebugMode.Run) {
                    this.resetView();
                }
                else if (eventArgs.NewMode === PortMarshallerContracts_5.DebugMode.Design) {
                    this.clearActivatedEventIndicator();
                    var newViewport = new DiagHub.JsonTimespan(this._viewport.viewableBase, this._viewport.viewableEnd);
                    this._viewport.changeViewport(newViewport, newViewport);
                }
            }
        }
        focusOnLastBreakEvent(eventArgs) {
            var viewableBase = SwimlaneTimeRange_2.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this._viewport.viewableBase);
            var newViewportEndTime = eventArgs.LastBreakEventEndTime;
            if (newViewportEndTime <= viewableBase) {
                return;
            }
            var newViewportStartTime = eventArgs.LastBreakEventStartTime;
            if (newViewportStartTime < viewableBase) {
                newViewportStartTime = viewableBase;
            }
            if (newViewportStartTime === newViewportEndTime) {
                newViewportEndTime = newViewportStartTime + 1;
            }
            var newSelectedStartTime = eventArgs.LastNonStepBreakEventStartTime;
            var newSelectedEndTime = eventArgs.LastBreakEventEndTime;
            var newSelectedTime = null;
            if (newSelectedStartTime < viewableBase) {
                newSelectedStartTime = viewableBase;
            }
            if (newSelectedStartTime === newSelectedEndTime) {
                newSelectedEndTime = newSelectedStartTime + 1;
            }
            newSelectedTime = new DiagHub.JsonTimespan(DiagHub.BigNumber.convertFromNumber(newSelectedStartTime), DiagHub.BigNumber.convertFromNumber(newSelectedEndTime));
            this.updateViewportWithSelectedTimeRange(newViewportStartTime, newViewportEndTime, newSelectedTime);
        }
        setSelectedEvent(eventSelectionArgs) {
            if (eventSelectionArgs.DiagnosticDataId == PortMarshallerContracts_5.PortMarshallerConstants.InvalidDiagnosticDataId) {
                if (this._viewport.isVisible) {
                    this._selectionManager.clearSelection();
                }
            }
            else if (!this._viewport.isVisible) {
                var track = this.getTrackFromEventKind(eventSelectionArgs.Kind);
                this._selectionManager.storeSelectedTrackAndId(track, eventSelectionArgs.DiagnosticDataId, false);
            }
            else {
                if (this._viewport.isInViewport(eventSelectionArgs.EventStartTimeNanoseconds) ||
                    ((this.isBreakEventKind(eventSelectionArgs.Kind)) &&
                        (this._viewport.isOverlapViewport(eventSelectionArgs.EventStartTimeNanoseconds, eventSelectionArgs.EventStartTimeNanoseconds + eventSelectionArgs.DurationNanoseconds)))) {
                    this._selectionManager.selectByDiagnosticDataId(eventSelectionArgs.DiagnosticDataId);
                    this._viewport.disableAutoScrolling();
                }
                else {
                    var track = this.getTrackFromEventKind(eventSelectionArgs.Kind);
                    this._selectionManager.storeSelectedTrackAndId(track, eventSelectionArgs.DiagnosticDataId, false);
                    if (!this._viewport.viewableBase.greater(DiagHub.BigNumber.convertFromNumber(eventSelectionArgs.EventStartTimeNanoseconds))) {
                        this._viewport.centerViewportTo(eventSelectionArgs.EventStartTimeNanoseconds);
                    }
                    else if ((this.isBreakEventKind(eventSelectionArgs.Kind)) &&
                        !this._viewport.viewableBase.greater(DiagHub.BigNumber.convertFromNumber(eventSelectionArgs.EventStartTimeNanoseconds + eventSelectionArgs.DurationNanoseconds))) {
                        this._viewport.centerViewportTo(eventSelectionArgs.EventStartTimeNanoseconds);
                    }
                }
            }
        }
        onSwimlaneVisibilityChanged(visible) {
            this._viewport.isVisible = visible;
            this._portMarshaller.notifySwimlaneIsVisibleChanged(visible);
            this._activatedEventIndicator.render(false);
        }
        onSwimlaneDataChangedEvent(eventArgs) {
            this._logger.debug("EventsSwimlane.onSwimlaneDataChangedEvent Action = " + eventArgs.Action);
            if (!this._viewport.isVisible) {
                return;
            }
            this.updateVisibleData(eventArgs.Action, eventArgs.Data);
            if (eventArgs.RestoreEventSelection) {
                this.restoreSelection();
            }
            if (this._hasFocus) {
                this._eventTrackControlAndData.forEach(function (track) {
                    track.trackControl.restoreFocus();
                });
            }
        }
        onFocusIn(eventArgs) {
            this._hasFocus = true;
        }
        onFocusOut(eventArgs) {
            this._hasFocus = false;
        }
        resetView() {
            this._viewport.enableAutoScrolling();
            this._viewport.clearTimeSelection();
        }
        clearActivatedEventIndicator() {
            this._activatedEventIndicator.time = null;
            this._activatedEventIndicator.render(false);
        }
        updateVisibleData(action, eventList) {
            if (!this._viewport.isVisible) {
                return;
            }
            this._eventTrackControlAndData.forEach(function (track) {
                track.trackControl.setVisible(false);
            });
            if (action === PortMarshallerContracts_5.SwimlaneDataChangedAction.Reset || action === PortMarshallerContracts_5.SwimlaneDataChangedAction.Clear) {
                this._eventTrackControlAndData.forEach(function (track) {
                    track.visibleEventList.clear();
                });
            }
            if (action === PortMarshallerContracts_5.SwimlaneDataChangedAction.Reset || action === PortMarshallerContracts_5.SwimlaneDataChangedAction.Add) {
                this.addVisibleData(eventList);
            }
            this._eventTrackControlAndData.forEach(function (track) {
                this.updateTrackAriaAndTooltip(track);
                track.trackControl.setVisible(true);
            }, this);
        }
        addVisibleData(eventList) {
            var trackEvents = {};
            var track = null;
            for (var i = 0; i < eventList.length; ++i) {
                var data = eventList[i];
                var eventKind = data.Kind;
                track = this._eventKindIdToTrackMap[eventKind];
                if (track == null) {
                    continue;
                }
                var eventViewModels = trackEvents[eventKind];
                if (!eventViewModels) {
                    eventViewModels = [];
                    trackEvents[eventKind] = eventViewModels;
                }
                var eventViewModel = this.createEventViewModel(eventList[i]);
                if (eventViewModel !== null) {
                    eventViewModels.push(eventViewModel);
                }
            }
            for (var key in trackEvents) {
                var eventViewModels = trackEvents[key];
                track = this._eventKindIdToTrackMap[key];
                if (track != null && eventViewModels.length > 0) {
                    track.visibleEventList.pushAllSorted(eventViewModels, true);
                }
            }
        }
        createEventViewModel(diagnosticEvent) {
            var diagnosticEventTimeNanoseconds = diagnosticEvent.EventEndTimeNanoseconds;
            var diagnosticEventStartTimeNanoseconds = diagnosticEvent.EventStartTimeNanoseconds;
            if (this.isBreakEventKind(diagnosticEvent.Kind)) {
                if (this._viewport.isOverlapViewport(diagnosticEventStartTimeNanoseconds, diagnosticEventTimeNanoseconds)) {
                    var eventTimeNanoseconds = diagnosticEventStartTimeNanoseconds;
                    var durationNanoseconds = diagnosticEventTimeNanoseconds - diagnosticEventStartTimeNanoseconds;
                    diagnosticsHub_2.Assert.isTrue(durationNanoseconds >= 0, "Duration should not be negative.");
                    return this.createEventViewModelHelper(diagnosticEvent, eventTimeNanoseconds, durationNanoseconds);
                }
                return null;
            }
            else if (this._viewport.isInViewport(diagnosticEventTimeNanoseconds)) {
                var eventTimeNanoseconds = diagnosticEventTimeNanoseconds;
                return this.createEventViewModelHelper(diagnosticEvent, eventTimeNanoseconds, durationNanoseconds);
            }
            return null;
        }
        createEventViewModelHelper(diagnosticEvent, eventTimeNanoseconds, durationNanoseconds) {
            var viewModel = new DebugEventViewModel_3.DebugEventViewModel(this, eventTimeNanoseconds, diagnosticEvent.Kind, diagnosticEvent.Color, diagnosticEvent.BreakType, diagnosticEvent.CategoryName, diagnosticEvent.ShortDescription, diagnosticEvent.DiagnosticDataId, durationNanoseconds);
            if (this._activatedEventViewModel && this._activatedEventViewModel.diagnosticDataId === diagnosticEvent.DiagnosticDataId) {
                viewModel.isActivatedEvent = true;
            }
            var telemetryType = diagnosticEvent.TelemetryType;
            if (telemetryType != null) {
                viewModel.telemetryType = telemetryType;
            }
            else {
                viewModel.telemetryType = this._eventKindIdToName[diagnosticEvent.Kind];
            }
            var snapshotStatus = diagnosticEvent.SnapshotStatus;
            if (snapshotStatus != null) {
                viewModel.snapshotStatus = snapshotStatus;
            }
            else {
                viewModel.snapshotStatus = PortMarshallerContracts_5.SnapshotStatus.None;
            }
            return viewModel;
        }
        getTrackFromEventKind(kind) {
            var track = this._eventKindIdToTrackMap[kind];
            return (track != null) ? track.trackControl : null;
        }
        restoreSelection() {
            if (this._selectionManager !== null) {
                this._selectionManager.restoreSelectedTrackAndItem();
            }
        }
        updateViewportWithSelectedTimeRange(eventBeginTime, eventEndTime, newSelectedTime) {
            var lastBreakEventDuration = eventEndTime - eventBeginTime;
            var breakEventDurationRatio = 0.05;
            var rightMarginRatio = 0.02;
            var newViewportBeginTime = null;
            var newViewportEndTime = null;
            if (lastBreakEventDuration < this._viewport.timeRange.duration * breakEventDurationRatio) {
                var newTimeRangeDurationInNanoseconds = lastBreakEventDuration / breakEventDurationRatio;
                var rightMargin = rightMarginRatio * newTimeRangeDurationInNanoseconds;
                var newViewportEndTimeInNanoseconds = eventEndTime + rightMargin;
                var newViewportBeginTimeInNanoseconds = Math.max(newViewportEndTimeInNanoseconds - newTimeRangeDurationInNanoseconds, 0);
                newViewportBeginTime = DiagHub.BigNumber.convertFromNumber(newViewportBeginTimeInNanoseconds);
                if (this._viewport.viewableBase.greaterOrEqual(newViewportBeginTime)) {
                    newViewportBeginTime = this._viewport.viewableBase;
                    newViewportEndTime = DiagHub.BigNumber.add(this._viewport.viewableBase, DiagHub.BigNumber.convertFromNumber(newTimeRangeDurationInNanoseconds));
                }
                else {
                    newViewportEndTime = DiagHub.BigNumber.convertFromNumber(newViewportEndTimeInNanoseconds);
                }
                var newViewport = new DiagHub.JsonTimespan(newViewportBeginTime, newViewportEndTime);
                this._viewport.changeViewport(newViewport, newSelectedTime);
            }
            else if (eventBeginTime < this._viewport.timeRange.begin || eventEndTime > this._viewport.timeRange.end) {
                if (eventEndTime - eventBeginTime > this._viewport.timeRange.duration * (1 - rightMarginRatio) * 2 / 3) {
                    var leftMargin = lastBreakEventDuration / 2;
                    var newViewportBeginTimeInNanoseconds = eventBeginTime - leftMargin;
                    var viewableBaseInNanoseconds = SwimlaneTimeRange_2.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this._viewport.viewableBase);
                    if (newViewportBeginTimeInNanoseconds > viewableBaseInNanoseconds) {
                        newViewportBeginTime = DiagHub.BigNumber.convertFromNumber(newViewportBeginTimeInNanoseconds);
                        var newViewportEndTimeInNanoseconds = newViewportBeginTimeInNanoseconds + ((eventEndTime - newViewportBeginTimeInNanoseconds) / (1 - rightMarginRatio));
                        newViewportEndTime = DiagHub.BigNumber.convertFromNumber(newViewportEndTimeInNanoseconds);
                    }
                    else {
                        newViewportBeginTime = this._viewport.viewableBase;
                        var newViewportEndTimeInNanoseconds = viewableBaseInNanoseconds + ((eventEndTime - viewableBaseInNanoseconds) / (1 - rightMarginRatio));
                        newViewportEndTime = DiagHub.BigNumber.convertFromNumber(newViewportEndTimeInNanoseconds);
                    }
                    var newViewport = new DiagHub.JsonTimespan(newViewportBeginTime, newViewportEndTime);
                    this._viewport.changeViewport(newViewport, newSelectedTime);
                }
                else {
                    var newViewportEndTimeInNanoseconds = eventEndTime + (rightMarginRatio * this._viewport.timeRange.duration);
                    var newViewportBeginTimeInNanoseconds = newViewportEndTimeInNanoseconds - this._viewport.timeRange.duration;
                    this._viewport.centerViewportWithSelectedTime(newViewportBeginTimeInNanoseconds, newSelectedTime);
                }
            }
            else {
                this._viewport.selectTimeSpan(newSelectedTime);
            }
        }
        updateTrackAriaAndTooltip(track) {
            var timeContextString = "";
            if (!this._activatedEventIndicator || this._activatedEventIndicator.isLiveDebugging) {
                timeContextString = this._resourceManager.getResource("LiveDebuggingDescription");
            }
            else {
                if (this._activatedEventIndicator.time === null) {
                    timeContextString = this._resourceManager.getResource("HistoricalDebuggingDescription");
                }
                else {
                    var timeSeconds = EventsSwimlane.getTimeInSeconds(this._activatedEventIndicator.time);
                    timeContextString = StringFormatter.format(this._resourceManager.getResource("HistoricalTimeDescription"), timeSeconds.toLocaleString());
                }
            }
            var description = StringFormatter.format(this._resourceManager.getResource("TrackDescription"), track.trackLocalizedName, track.visibleEventList.length.toLocaleString(), timeContextString);
            track.trackControl.ariaLabel = description;
            track.trackControl.tooltip = description;
        }
        get breakEventTrackControl() {
            return this._breakTrackControlCache;
        }
        get VisibleBreakEventList() {
            var eventKindId = this._graphConfig.eventKindNameToId[PortMarshallerContracts_5.PortMarshallerConstants.BreakEventKindName];
            return this._eventKindIdToTrackMap[eventKindId].visibleEventList;
        }
        get VisibleIntelliTraceEventList() {
            var eventKindId = this._graphConfig.eventKindNameToId[PortMarshallerContracts_5.PortMarshallerConstants.IntelliTraceEventKindName];
            return this._eventKindIdToTrackMap[eventKindId].visibleEventList;
        }
        set ClientWidth(value) {
            this._viewport.clientWidth = value;
        }
        getTimeRange() {
            return this._viewport.timeRange;
        }
        static getTimeInSeconds(timeInNs) {
            return Math.max(0, Math.floor(timeInNs / 10000000)) / 100;
        }
    }
    exports.EventsSwimlane = EventsSwimlane;
    EventsSwimlane.IntelliTraceEventTackName = "IntelliTrace Event Track";
    EventsSwimlane.BreakEventTrackName = "Break Event Track";
    EventsSwimlane.CustomEventTrackName = "Custom Event Track";
});
define("src/debugger/PerfDebuggerWebViews/ViewModels/DebugEventViewModel", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert", "src/debugger/PerfDebuggerWebViews/EventsSwimlane", "src/debugger/PerfDebuggerWebViews/PortMarshallerContracts", "src/debugger/PerfDebuggerWebViews/UIFramework/Binding/CommonConverters", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", "src/debugger/PerfDebuggerWebViews/Utilities/StringFormatter"], function (require, exports, assert_10, EventsSwimlane_1, PortMarshallerContracts_6, CommonConverters_1, Observable_7, StringFormatter) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugEventViewModel = void 0;
    class DebugEventViewModel extends Observable_7.Observable {
        constructor(swimlane, timeInNanoseconds, eventKind, color, breakType, categoryName, shortDescription, diagnosticDataId, duration = 0) {
            super();
            this.swimlane = swimlane;
            this.timeInNanoseconds = timeInNanoseconds;
            this.eventColor = color;
            this.eventKind = eventKind;
            this.breakType = breakType;
            this.shortDescription = shortDescription;
            this.categoryName = categoryName;
            this.diagnosticDataId = diagnosticDataId;
            this.duration = duration;
            this.isActivatedEvent = false;
            this.updateAriaLabelAndTooltip();
        }
        static EventOrderComparator(first, second) {
            return first.timeInNanoseconds - second.timeInNanoseconds;
        }
        static init() {
            Observable_7.ObservableHelpers.defineProperty(DebugEventViewModel, DebugEventViewModel.TimeInNanosecondsPropertyName, "");
            Observable_7.ObservableHelpers.defineProperty(DebugEventViewModel, DebugEventViewModel.BreakTypePropertyName, PortMarshallerContracts_6.BreakEventType.None);
            Observable_7.ObservableHelpers.defineProperty(DebugEventViewModel, DebugEventViewModel.TooltipPropertyName, "");
            Observable_7.ObservableHelpers.defineProperty(DebugEventViewModel, DebugEventViewModel.DurationPropertyName, 0);
            Observable_7.ObservableHelpers.defineProperty(DebugEventViewModel, DebugEventViewModel.AriaLabelPropertyName, "");
            Observable_7.ObservableHelpers.defineProperty(DebugEventViewModel, DebugEventViewModel.IsActivatedEventPropertyName, false, DebugEventViewModel.onActiveEventChanged);
        }
        static onActiveEventChanged(obj, oldValue, newValue) {
            obj.updateAriaLabelAndTooltip();
        }
        updateAriaLabelAndTooltip() {
            var timeSeconds = EventsSwimlane_1.EventsSwimlane.getTimeInSeconds(this.timeInNanoseconds);
            var tooltip = null;
            var activeEventString = "";
            if (this.isActivatedEvent) {
                activeEventString = this.swimlane.getResource("ActivatedHistoricalEvent");
            }
            if (this.swimlane.isBreakEventKind(this.eventKind)) {
                assert_10.Assert.isTrue(this.duration >= 0, "Duration should not be negative.");
                var durationMilliseconds = Math.max(1, Math.ceil(this.duration / 1000000));
                tooltip = StringFormatter.format(this.swimlane.getResource("BreakEventTooltip"), this.categoryName, this.shortDescription, timeSeconds.toLocaleString(), durationMilliseconds.toLocaleString(), activeEventString);
            }
            else {
                tooltip = StringFormatter.format(this.swimlane.getResource("DiscreteEventTooltip"), this.categoryName, this.shortDescription, timeSeconds.toLocaleString(), activeEventString);
            }
            this.tooltip = StringFormatter.formatTooltip(tooltip, 18, 60);
            this.ariaLabel = CommonConverters_1.CommonConverters.JsonHtmlTooltipToInnerTextConverter.convertTo(this.tooltip);
        }
    }
    exports.DebugEventViewModel = DebugEventViewModel;
    DebugEventViewModel.TimeInNanosecondsPropertyName = "timeInNanoseconds";
    DebugEventViewModel.BreakTypePropertyName = "breakType";
    DebugEventViewModel.TooltipPropertyName = "tooltip";
    DebugEventViewModel.DurationPropertyName = "duration";
    DebugEventViewModel.AriaLabelPropertyName = "ariaLabel";
    DebugEventViewModel.IsActivatedEventPropertyName = "isActivatedEvent";
    DebugEventViewModel.init();
});
define("src/debugger/PerfDebuggerWebViews/Controls/DiscreteEventItem", ["require", "exports", "src/debugger/PerfDebuggerWebViews/UIFramework/Diagnostics/assert", "src/debugger/PerfDebuggerWebViews/PortMarshallerContracts", "src/debugger/PerfDebuggerWebViews/UIFramework/Model/Observable", "src/debugger/PerfDebuggerWebViews/Controls/TrackItem", "src/debugger/PerfDebuggerWebViews/Converters/ItemXOffsetConverter"], function (require, exports, assert_11, PortMarshallerContracts_7, Observable_8, TrackItem_3, ItemXOffsetConverter_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiscreteEventItem = void 0;
    class DiscreteEventItem extends TrackItem_3.TrackItem {
        onTooltipChangedOverride() {
            super.onTooltipChangedOverride();
            var clickableArea = this.rootElement.children[0];
            if (typeof (clickableArea) === "undefined" || clickableArea === null) {
                assert_11.Assert.fail("Malformed root element attached to IntelliTrace event track item control.");
            }
            if (this.tooltip) {
                clickableArea.setAttribute("data-plugin-vs-tooltip", this.tooltip);
            }
            else {
                clickableArea.removeAttribute("data-plugin-vs-tooltip");
            }
        }
        onModelChanged(oldModel, newModel) {
            super.onModelChanged(oldModel, newModel);
            this.update();
        }
        updateOnInteractionOverride() {
            this.update();
        }
        update() {
            if (this.model != null) {
                var debugEventViewModel = this.model;
                var calculatedOffset = ItemXOffsetConverter_4.itemXOffsetConverter.calculateXOffset(debugEventViewModel.timeInNanoseconds);
                this.xOffset = calculatedOffset + "px";
                this.iconClass = "discrete-event " + DiscreteEventItem.getEventIcon(debugEventViewModel.eventColor, this.isSelected, this.isHovered);
                if (this.isHovered || this.isSelected) {
                    this.iconClass += " " + "discrete-event-size-activated";
                }
                else {
                    this.iconClass += " " + "discrete-event-size-normal";
                }
            }
        }
        static getEventIcon(color, isSelected, isHovered) {
            var prefix = null;
            switch (color) {
                case PortMarshallerContracts_7.EventColor.TracepointColor:
                    prefix = "-tracepoint";
                    break;
                case PortMarshallerContracts_7.EventColor.UnimportantColor:
                    prefix = "-unimportant";
                    break;
                case PortMarshallerContracts_7.EventColor.ExceptionColor:
                    prefix = "-exception";
                    break;
                default:
                    prefix = "-unimportant";
                    break;
            }
            if (typeof (prefix) === "undefined" || prefix === null) {
                assert_11.Assert.fail("Unrecognized event type in break event item control.");
                return "";
            }
            var location = "timeline";
            var theme = "-light";
            return location + theme + ((isSelected || isHovered) ? "-selected" : "") + prefix;
        }
        static initialize() {
            Observable_8.ObservableHelpers.defineProperty(DiscreteEventItem, DiscreteEventItem.IconClassPropertyName, "");
            Observable_8.ObservableHelpers.defineProperty(DiscreteEventItem, DiscreteEventItem.XOffsetPropertyName, "0px");
        }
    }
    exports.DiscreteEventItem = DiscreteEventItem;
    DiscreteEventItem.IconClassPropertyName = "iconClass";
    DiscreteEventItem.XOffsetPropertyName = "xOffset";
    DiscreteEventItem.initialize();
});
define("src/debugger/PerfDebuggerWebViews/IntelliTraceGraph", ["require", "exports", "src/debugger/PerfDebuggerWebViews/EventsSwimlane", "src/debugger/PerfDebuggerWebViews/IntelliTracePortMarshaller", "src/debugger/PerfDebuggerWebViews/PortMarshallerContracts", "src/debugger/PerfDebuggerWebViews/SwimlaneTimeRange", "src/debugger/PerfDebuggerWebViews/TelemetryService", "diagnosticsHub", "diagnosticsHub-swimlanes", "plugin-vs-v2"], function (require, exports, EventsSwimlane_2, IntelliTracePortMarshaller_1, PortMarshallerContracts_8, SwimlaneTimeRange_3, TelemetryService_2, DiagHub, DiagHubSwimlane, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntelliTraceGraph = void 0;
    class IntelliTraceGraph {
        constructor(config, graphConfig, isVisible) {
            this._logger = DiagHub.getLogger();
            this._logger.debug("IntelliTraceGraph: constructor()");
            if (!config) {
                this._logger.error("configuration to the graph is invalid.");
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1002"));
            }
            this._portMarshaller = new IntelliTracePortMarshaller_1.IntelliTracePortMarshaller();
            this._eventsSwimlane = new EventsSwimlane_2.EventsSwimlane(graphConfig, config.resources, this._portMarshaller, isVisible, DiagHubSwimlane.getViewportController());
            this.registerEventHandlers();
            this._currentTimeRange = config.timeRange;
            this._portMarshaller.notifyViewPortChanged(SwimlaneTimeRange_3.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this._currentTimeRange.begin), SwimlaneTimeRange_3.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this._currentTimeRange.end));
            DiagHubSwimlane.DependencyManager.loadCss(config.pathToScriptFolder + "\\css\\IntelliTraceGraph.css");
            this.appendEventIconStyles(config.pathToScriptFolder);
            this.render();
            this._portMarshaller.notifySwimlaneIsVisibleChanged(isVisible);
            this._portMarshaller.notifyReadyForData();
            this._logger.debug("IntelliTraceGraph: constructor() finished");
        }
        dispose() {
            this._logger.debug("IntelliTraceGraph: dispose()");
            this._portMarshaller.removeSwimlaneDataChangedEventListener(this._swimlaneDataChangedEventHandler);
            this._portMarshaller.removeTabularViewSelectionChangedEventListener(this._tabularViewSelectionChangedEventHandler);
            this._portMarshaller.removeActivatedDataChangedEventListener(this._activatedDataChangedEventHandler);
            this._portMarshaller.removeDebugModeChangedEventListener(this._debugModeChangedEventHandler);
            this._portMarshaller.removeFocusOnLastBreakEventListener(this._focusOnLastBreakEventHandler);
            this._swimlaneSelectionChangedRegistration.unregister();
            this._eventsSwimlane.dispose();
            DiagHub.getViewEventManager().selectionChanged.removeEventListener(this._selectionTimeRangeChangedEventHandler);
        }
        get container() {
            this._logger.debug("IntelliTraceGraph: getContainer()");
            return this._container;
        }
        getPortMarshaller() {
            return this._portMarshaller;
        }
        appendEventIconStyles(webViewRootFolder) {
            webViewRootFolder = webViewRootFolder.replace(/\\/g, "/");
            var pathToNormalIcon = '/icons/timeline/light/normal/';
            var pathToSelectedIcon = '/icons/timeline/light/selected/';
            var tracepointIconName = 'TimelineMarkPurple.png';
            var exceptionIconName = 'TimelineMarkRed.png';
            var unimportantIconName = 'TimelineMarkGray.png';
            IntelliTraceGraph.appendIconStyleHtml('div.discrete-event.timeline-light-tracepoint', webViewRootFolder + pathToNormalIcon + tracepointIconName);
            IntelliTraceGraph.appendIconStyleHtml('div.discrete-event.timeline-light-exception', webViewRootFolder + pathToNormalIcon + exceptionIconName);
            IntelliTraceGraph.appendIconStyleHtml('div.discrete-event.timeline-light-unimportant', webViewRootFolder + pathToNormalIcon + unimportantIconName);
            IntelliTraceGraph.appendIconStyleHtml('div.discrete-event.timeline-light-selected-tracepoint', webViewRootFolder + pathToSelectedIcon + tracepointIconName);
            IntelliTraceGraph.appendIconStyleHtml('div.discrete-event.timeline-light-selected-exception', webViewRootFolder + pathToSelectedIcon + exceptionIconName);
            IntelliTraceGraph.appendIconStyleHtml('div.discrete-event.timeline-light-selected-unimportant', webViewRootFolder + pathToSelectedIcon + unimportantIconName);
        }
        static appendIconStyleHtml(styleName, iconPath) {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = styleName + '{ background: url(\"' + iconPath + '\") no-repeat 0px 0px !important }';
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        render(fullRender = true, refresh = false) {
            this._logger.debug("IntelliTraceGraph: render()");
            if (!this._container) {
                this.initializeGraphStructure();
            }
            this._eventsSwimlane.renderTracks(fullRender, refresh);
        }
        onViewportChanged(viewportArgs) {
            if (!this._currentTimeRange || !this._currentTimeRange.equals(viewportArgs.currentTimespan)) {
                var logSelection = "";
                if (viewportArgs.selectionTimespan) {
                    logSelection = " selectionTimespan: " + viewportArgs.selectionTimespan.begin.value + " - " + viewportArgs.selectionTimespan.end.value;
                }
                this._logger.debug("IntelliTraceGraph: onViewportChanged() currentTimespan:" + viewportArgs.currentTimespan.begin.value + " - " + viewportArgs.currentTimespan.end.value + logSelection + " isIntermittent: " + viewportArgs.isIntermittent);
                this._currentTimeRange = viewportArgs.currentTimespan;
                this._eventsSwimlane.onViewportChanged(this._currentTimeRange);
                this._portMarshaller.notifyViewPortChanged(SwimlaneTimeRange_3.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this._currentTimeRange.begin), SwimlaneTimeRange_3.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(this._currentTimeRange.end));
            }
        }
        resize(evt) {
            this._logger.debug("IntelliTraceGraph: resize()");
            this._eventsSwimlane.notifyClientSizeChanged();
        }
        onSwimlaneVisibilityChanged(visible) {
            this._eventsSwimlane.onSwimlaneVisibilityChanged(visible);
        }
        registerEventHandlers() {
            this._swimlaneDataChangedEventHandler = this.swimlaneDataChangedEventHandler.bind(this);
            this._selectionTimeRangeChangedEventHandler = this.selectionTimeRangeChangedEventHandler.bind(this);
            this._tabularViewSelectionChangedEventHandler = this.tabularViewSelectionChangedEventHandler.bind(this);
            this._activatedDataChangedEventHandler = this.activatedDataChangedEventHandler.bind(this);
            this._debugModeChangedEventHandler = this.debugModeChangedEventHandler.bind(this);
            this._focusOnLastBreakEventHandler = this.focusOnLastBreakEventHandler.bind(this);
            this._portMarshaller.addSwimlaneDataChangedEventListener(this._swimlaneDataChangedEventHandler);
            this._portMarshaller.addTabularViewSelectionChangedEventListener(this._tabularViewSelectionChangedEventHandler);
            this._portMarshaller.addActivatedDataChangedEventListener(this._activatedDataChangedEventHandler);
            this._portMarshaller.addDebugModeChangedEventListener(this._debugModeChangedEventHandler);
            this._portMarshaller.addFocusOnLastBreakEventListener(this._focusOnLastBreakEventHandler);
            this._swimlaneSelectionChangedRegistration = this._eventsSwimlane.selectionChangedEvent.addHandler(this.swimlaneSelectionChangedEventHandler.bind(this));
            DiagHub.getViewEventManager().selectionChanged.addEventListener(this._selectionTimeRangeChangedEventHandler);
        }
        swimlaneDataChangedEventHandler(eventArgs) {
            var dataChangedEventArgs = eventArgs;
            if (dataChangedEventArgs.Action === PortMarshallerContracts_8.SwimlaneDataChangedAction.Add) {
                this._portMarshaller.acknowledgeData();
            }
            this._eventsSwimlane.onSwimlaneDataChangedEvent(eventArgs);
        }
        swimlaneSelectionChangedEventHandler(eventArgs) {
            if (eventArgs && eventArgs.isSelectedByUserInput) {
                this._portMarshaller.notifySwimlaneDataSelectionChanged(eventArgs.selectedItem ? eventArgs.selectedItem.diagnosticDataId : PortMarshallerContracts_8.PortMarshallerConstants.InvalidDiagnosticDataId);
                if (eventArgs.selectedItem != null) {
                    TelemetryService_2.TelemetryService.onSelectDiagnosticEvent(eventArgs.selectedItem.telemetryType, true, eventArgs.selectedItem.snapshotStatus);
                }
                else if (eventArgs.previousSelectedItem != null) {
                    TelemetryService_2.TelemetryService.onSelectDiagnosticEvent(eventArgs.previousSelectedItem.telemetryType, false, eventArgs.previousSelectedItem.snapshotStatus);
                }
            }
        }
        tabularViewSelectionChangedEventHandler(eventArgs) {
            var eventSelectionChangedArgs = eventArgs;
            if (eventSelectionChangedArgs) {
                this._eventsSwimlane.setSelectedEvent(eventSelectionChangedArgs);
            }
        }
        debugModeChangedEventHandler(eventArgs) {
            var newDebugModeEventArgs = eventArgs;
            this._eventsSwimlane.onDebugModeChanged(newDebugModeEventArgs);
        }
        activatedDataChangedEventHandler(eventArgs) {
            var activatedEventArgs = eventArgs;
            if (activatedEventArgs) {
                this._eventsSwimlane.notifyActivatedDataChanged(activatedEventArgs);
            }
        }
        focusOnLastBreakEventHandler(eventArgs) {
            var focusOnLastBreakEventArgs = eventArgs;
            if (focusOnLastBreakEventArgs) {
                this._eventsSwimlane.focusOnLastBreakEvent(focusOnLastBreakEventArgs);
            }
        }
        selectionTimeRangeChangedEventHandler(eventArgs) {
            if (this._portMarshaller && eventArgs && !eventArgs.isIntermittent) {
                var beginTimeNanoseconds;
                var endTimeNanoseconds;
                if (eventArgs.position) {
                    beginTimeNanoseconds = SwimlaneTimeRange_3.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(eventArgs.position.begin);
                    endTimeNanoseconds = SwimlaneTimeRange_3.SwimlaneTimeRange.unsafeConvertBigNumberToNumber(eventArgs.position.end);
                }
                else {
                    beginTimeNanoseconds = PortMarshallerContracts_8.PortMarshallerConstants.InvalidTimeValue;
                    endTimeNanoseconds = PortMarshallerContracts_8.PortMarshallerConstants.InvalidTimeValue;
                }
                this._portMarshaller.notifySelectionTimeRangeChanged(beginTimeNanoseconds, endTimeNanoseconds);
            }
        }
        initializeGraphStructure() {
            this._container = document.createElement("div");
            this._container.classList.add("graphContainer");
            this._container.style.height = "100%";
            var runtimeStyle = this._container.style;
            if (!runtimeStyle.position || runtimeStyle.position === "static") {
                this._container.style.position = "relative";
            }
            this._eventsSwimlane.initializeEventTracks(this._container);
        }
    }
    exports.IntelliTraceGraph = IntelliTraceGraph;
});
define("src/debugger/PerfDebuggerWebViews/IntelliTraceGraphLabels", ["require", "exports", "plugin-vs-v2", "diagnosticsHub"], function (require, exports, plugin, DiagHub) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntelliTraceGraphLabels = void 0;
    class IntelliTraceGraphLabels {
        constructor(graphConfig) {
            this._logger = DiagHub.getLogger();
            this._logger.debug("IntelliTraceLabel: constructor()");
            this._graphLabelsContainer = document.createElement("div");
            this._graphLabelsContainer.className = "graph-scale-left";
            this._graphLabelsContainer.style.width = "100%";
            this._graphLabelsContainer.style.height = "100%";
            this._graphLabelsContainer.style.borderRightWidth = "1px";
            graphConfig.trackConfigurations.forEach(function (config) {
                var label = this.CreateLabel("track-icon-common", config.LabelTooltip, config.LabelName);
                this._graphLabelsContainer.appendChild(label);
            }, this);
        }
        get container() {
            return this._graphLabelsContainer;
        }
        render() {
        }
        CreateLabel(className, tooltip, svgIconToken) {
            var label = document.createElement("div");
            label.className = className;
            label.setAttribute("data-plugin-vs-tooltip", tooltip);
            label.setAttribute("role", "img");
            label.setAttribute("aria-label", tooltip);
            var svgIconDiv = document.createElement("div");
            svgIconDiv.setAttribute("data-plugin-svg", svgIconToken);
            label.appendChild(svgIconDiv);
            plugin.Theme.processInjectedSvg(label);
            return label;
        }
    }
    exports.IntelliTraceGraphLabels = IntelliTraceGraphLabels;
});
define("src/debugger/PerfDebuggerWebViews/IntelliTraceSwimlaneFactory", ["require", "exports", "diagnosticsHub-swimlanes", "src/debugger/PerfDebuggerWebViews/IntelliTraceGraph", "src/debugger/PerfDebuggerWebViews/IntelliTraceGraphConfiguration", "src/debugger/PerfDebuggerWebViews/IntelliTraceGraphLabels"], function (require, exports, DiagHubSwimlane, IntelliTraceGraph_1, IntelliTraceGraphConfiguration_1, IntelliTraceGraphLabels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntelliTraceSwimlaneFactory = void 0;
    function IntelliTraceSwimlaneFactory(componentConfig, isVisible, selectionEnabled, graphBehaviour, currentTimespan, selectionTimespan) {
        var customGraphConfig = new IntelliTraceGraphConfiguration_1.IntelliTraceGraphConfiguration(componentConfig.JsonObject);
        var graphConfig = new DiagHubSwimlane.SwimlaneConfiguration(componentConfig, currentTimespan, graphBehaviour);
        graphConfig.header.isBodyExpanded = isVisible;
        var graphHeight = Math.max((customGraphConfig.enabledTrackCount * 24) - 1, 0);
        var swimlane = new DiagHubSwimlane.SwimlaneBase(graphConfig.header, graphHeight, currentTimespan, selectionTimespan);
        var intelliTraceGraph = new IntelliTraceGraph_1.IntelliTraceGraph(graphConfig.graph, customGraphConfig, isVisible);
        var graph = intelliTraceGraph;
        if (selectionEnabled) {
            graph = new DiagHubSwimlane.SelectionOverlay(graph, currentTimespan, selectionTimespan, componentConfig.Id);
        }
        swimlane.swimlaneVisibilityChangedEvent.addEventListener((visible) => intelliTraceGraph.onSwimlaneVisibilityChanged(visible));
        swimlane.addMainRegionControl(graph);
        swimlane.addMainRegionControl(new DiagHubSwimlane.GridLineRenderer(currentTimespan));
        swimlane.addLeftRegionControl(new IntelliTraceGraphLabels_1.IntelliTraceGraphLabels(customGraphConfig));
        return swimlane;
    }
    exports.IntelliTraceSwimlaneFactory = IntelliTraceSwimlaneFactory;
});
window.define("perfDebuggerSwimlane", ["src/debugger/PerfDebuggerWebViews/IntelliTraceSwimlaneFactory",
    "src/debugger/PerfDebuggerWebViews/Controls/BreakEventTrackControl",
    "src/debugger/PerfDebuggerWebViews/Controls/BreakEventItem",
    "src/debugger/PerfDebuggerWebViews/Controls/DiscreteEventItem"], (factoryModule, breakEventTrackControlModule, breakEventItemModule, discreteEventItemModule) => {
    window.IntelliTrace = {
        DiagnosticsHub: {
            IntelliTraceSwimlaneFactory: factoryModule.IntelliTraceSwimlaneFactory,
            Controls: {
                BreakEventTrackControl: breakEventTrackControlModule.BreakEventTrackControl,
                BreakEventItem: breakEventItemModule.BreakEventItem,
                DiscreteEventItem: discreteEventItemModule.DiscreteEventItem
            }
        }
    };
});
window.ControlTemplates = {};
var ControlTemplates;
(function (ControlTemplates) {
    class DiagnosticsHubControlTemplate {
    }
    DiagnosticsHubControlTemplate.swimlaneTemplate = "\
<div class=\"graph-canvas-div\">\
  <div class=\"graph-canvas\"></div>\
</div>\
";
    DiagnosticsHubControlTemplate.eventTrackTemplate = "\
<div class=\"track-common\" data-controlbinding=\"attr-aria-label:ariaLabel;mode=oneway\">\
  <div data-name=\"_panel\" role=\"group\" data-controlbinding=\"attr-class:panelClassName;mode=oneway\"></div>\
</div>\
";
    DiagnosticsHubControlTemplate.eventButtonTemplate = "\
<div role=\"listitem\" data-binding=\"attr-aria-label:ariaLabel;mode=oneway\" data-controlbinding=\"attr-class:iconClass;mode=oneway,                                   style.left:xOffset;mode=oneway\">\
  <div class=\"discrete-event-clickable-area clickable-area-size\"></div>\
</div>\
";
    DiagnosticsHubControlTemplate.breakEventButtonTemplate = "\
<div role=\"listitem\" data-binding=\"attr-aria-label:ariaLabel;mode=oneway\" data-controlbinding=\"attr-class:breakEventClass;mode=oneway,                                   style.width:width;mode=oneway,                                   style.left:xOffset;mode=oneway\">\
  <div class=\"hat\"></div>\
</div>\
";
    ControlTemplates.DiagnosticsHubControlTemplate = DiagnosticsHubControlTemplate;
})(ControlTemplates || (ControlTemplates = {}));
