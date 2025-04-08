var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/extensions/userSettings", ["require", "exports", "plugin-vs-v2"], function (require, exports, Plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserSettingsHelper = void 0;
    class UserSettingsProxy {
        getUserSettings() {
            return new Promise((completed) => {
                Plugin.Settings.get("JavaScriptPerfTools").then(result => {
                    completed(result);
                }, error => {
                    // In case the collection doesn't exist, return the default settings.
                    completed(Promise.resolve({}));
                });
            });
        }
    }
    exports.UserSettingsHelper = new UserSettingsProxy();
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan", ["require", "exports", "plugin-vs-v2", "diagnosticsHub"], function (require, exports, Plugin, diagnosticsHub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimeSpan = exports.TimeStamp = void 0;
    class TimeStamp {
        constructor(nsec = 0) {
            this._nsec = nsec;
        }
        get nsec() {
            return this._nsec;
        }
        get msec() {
            return this._nsec / TimeStamp.nanoSecInMillSec;
        }
        get sec() {
            return this._nsec / TimeStamp.nanoSecInSec;
        }
        static fromBigNumber(bigNumber) {
            var l = bigNumber.jsonValue.l;
            var h = bigNumber.jsonValue.h;
            if (l < 0) {
                l = l >>> 0;
            }
            if (h < 0) {
                h = h >>> 0;
            }
            var nsec = h * 0x100000000 + l;
            return TimeStamp.fromNanoseconds(nsec);
        }
        static fromNanoseconds(nsec) {
            return new TimeStamp(nsec);
        }
        static fromMilliseconds(msec) {
            return new TimeStamp(msec * TimeStamp.nanoSecInMillSec);
        }
        static fromSeconds(sec) {
            return new TimeStamp(sec * TimeStamp.nanoSecInSec);
        }
        equals(other) {
            return this._nsec === other.nsec;
        }
        toBigNumber() {
            return diagnosticsHub_1.BigNumber.convertFromNumber(this._nsec);
        }
    }
    exports.TimeStamp = TimeStamp;
    TimeStamp.nanoSecInMillSec = 1000 * 1000;
    TimeStamp.nanoSecInSec = 1000 * 1000 * 1000;
    class TimeSpan {
        constructor(begin = new TimeStamp(), end = new TimeStamp()) {
            this._begin = begin;
            this._end = end;
            if (this._begin.nsec > this._end.nsec) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1042"));
            }
        }
        get begin() {
            return this._begin;
        }
        get end() {
            return this._end;
        }
        get elapsed() {
            return new TimeStamp(this._end.nsec - this.begin.nsec);
        }
        static fromJsonTimespan(jsonTimespan) {
            var begin = TimeStamp.fromBigNumber(jsonTimespan.begin);
            var end = TimeStamp.fromBigNumber(jsonTimespan.end);
            return new TimeSpan(begin, end);
        }
        equals(other) {
            return this.begin.equals(other.begin) &&
                this.end.equals(other.end);
        }
        toJsonTimespan() {
            return new diagnosticsHub_1.JsonTimespan(this._begin.toBigNumber(), this._end.toBigNumber());
        }
    }
    exports.TimeSpan = TimeSpan;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VisualProfilerData", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IThreadInfo = void 0;
    class IThreadInfo {
    }
    exports.IThreadInfo = IThreadInfo;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/responsivenessNotifications", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResponsivenessNotifications = void 0;
    class ResponsivenessNotifications {
    }
    exports.ResponsivenessNotifications = ResponsivenessNotifications;
    ResponsivenessNotifications.DetailsPaneLoaded = "ResponsivenessNotifications.DetailsPaneLoaded";
    ResponsivenessNotifications.GraphCollapsed = "ResponsivenessNotifications.GraphCollapsed";
    ResponsivenessNotifications.GraphExpanded = "ResponsivenessNotifications.GraphExpanded";
    ResponsivenessNotifications.GridRowSelected = "ResponsivenessNotifications.GridRowSelected";
    ResponsivenessNotifications.GridScrolled = "ResponsivenessNotifications.GridScrolled";
    ResponsivenessNotifications.GridUpdatedForTimeSelection = "ResponsivenessNotifications.GridUpdatedForTimeSelection";
    ResponsivenessNotifications.ResetZoomFinished = "ResponsivenessNotifications.ResetZoomFinished";
    ResponsivenessNotifications.ResultsLoaded = "ResponsivenessNotifications.ResultsLoaded";
    ResponsivenessNotifications.SaveSessionFinished = "ResponsivenessNotifications.SaveSessionFinished";
    ResponsivenessNotifications.SortFinishedOnGrid = "ResponsivenessNotifications.SortFinishedOnGrid";
    ResponsivenessNotifications.UserSelectedTimeslice = "ResponsivenessNotifications.UserSelectedTimeslice";
    ResponsivenessNotifications.ZoomInFinished = "ResponsivenessNotifications.ZoomInFinished";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/controls/Divider", ["require", "exports", "Bpt.Diagnostics.Common"], function (require, exports, Common) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Divider = void 0;
    class Divider extends Common.TemplateControl {
        constructor(container, initialOffsetX) {
            super("dividerTemplate");
            this._container = container;
            // This DIV intercepts pointer-overs that might otherwise trigger tooltips or CSS hover rules on nearby elements.
            this._backdrop = this.findElement("dividerBackdrop");
            this._divider = this.findElement("divider");
            this._divider.addEventListener("pointerdown", this.onPointerDown.bind(this), true /*useCapture*/);
            this._container.appendChild(this._backdrop);
            this._container.appendChild(this._divider);
            this._minX = 0;
            this.offsetX = initialOffsetX;
            this._onPointerMoveHandler = this.onPointerMove.bind(this);
            this._onPointerUpHandler = this.onPointerUp.bind(this);
        }
        set height(value) {
            this._divider.style.height = value + "px";
            this._backdrop.style.height = value + "px";
        }
        get dividerDivElement() {
            return this._divider;
        }
        get offsetX() {
            // First try to get the offset from the style, otherwise get offsetLeft
            if (this._divider.style.left) {
                var leftValue = parseInt(this._divider.style.left);
                if (!isNaN(leftValue)) {
                    return leftValue;
                }
            }
            return this._divider.offsetLeft;
        }
        set offsetX(value) {
            var xPos = value;
            if (xPos < this._minX) {
                xPos = this._minX;
            }
            else if (xPos > this._maxX) {
                xPos = this._maxX;
            }
            this._divider.style.left = xPos + "px";
        }
        get minX() {
            return this._minX;
        }
        set minX(value) {
            this._minX = value;
            if (this.offsetX < this._minX) {
                this.offsetX = this._minX;
            }
        }
        get maxX() {
            return this._maxX;
        }
        set maxX(value) {
            this._maxX = value;
            if (this.offsetX > this._maxX) {
                this.offsetX = this._maxX;
            }
        }
        moveToOffset(offset, forceMove) {
            if (this.updateOffsetX(offset, forceMove)) {
                if (this.onMoved) {
                    this.onMoved(this._divider.offsetLeft);
                }
            }
        }
        onPointerDown(e) {
            this._backdrop.style.zIndex = "1000";
            this._backdrop.appendChild(this._divider);
            this._backdrop.setPointerCapture(e.pointerId);
            this._backdrop.addEventListener("pointermove", this._onPointerMoveHandler, true /*useCapture*/);
            this._backdrop.addEventListener("pointerup", this._onPointerUpHandler, true /*useCapture*/);
        }
        onPointerMove(e) {
            if (this.updateOffsetX(e.offsetX)) {
                if (this.onMoved) {
                    this.onMoved(this._divider.offsetLeft);
                }
            }
            e.stopImmediatePropagation();
            e.preventDefault();
        }
        onPointerUp(e) {
            if (this._container.firstChild) {
                this._container.insertBefore(this._divider, this._container.firstChild);
            }
            else {
                this._container.appendChild(this._divider);
            }
            this._backdrop.releasePointerCapture(e.pointerId);
            this._backdrop.style.zIndex = "-1";
            this._backdrop.removeEventListener("pointermove", this._onPointerMoveHandler, true /*useCapture*/);
            this._backdrop.removeEventListener("pointerup", this._onPointerUpHandler, true /*useCapture*/);
            if (this.updateOffsetX(e.offsetX)) {
                if (this.onMoved) {
                    this.onMoved(this._divider.offsetLeft);
                }
            }
        }
        updateOffsetX(x, forceUpdate) {
            var isOutsideDivider = x < this._divider.offsetLeft || x > (this._divider.offsetLeft + this._divider.offsetWidth);
            if (isOutsideDivider || forceUpdate) {
                this.offsetX = x;
                return true;
            }
            return false;
        }
    }
    exports.Divider = Divider;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/FormattingHelpers", ["require", "exports", "plugin-vs-v2", "Bpt.Diagnostics.PerfTools.Common"], function (require, exports, Plugin, PerfTools) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FormattingHelpers = void 0;
    class FormattingHelpers {
        /**
         * Converts a Daytona-style format string to a printf-style format string.
         */
        static convertFormatString(originalFormat) {
            var newFormat = originalFormat;
            var i = 0;
            while (true) {
                var placeholder = "{" + i + "}";
                if (newFormat.indexOf(placeholder) === -1) {
                    break;
                }
                while (newFormat.indexOf(placeholder) >= 0) {
                    newFormat = newFormat.replace(placeholder, "%s");
                }
                i++;
            }
            return newFormat;
        }
        static getPrettyPrintPercent(percent) {
            return Plugin.Resources.getString("Percent", PerfTools.FormattingHelpers.getDecimalLocaleString(percent, false, 2));
        }
        static getPrettyPrintTime(time) {
            var value;
            var unitAbbreviation;
            if (time.nsec === 0) {
                value = 0;
                unitAbbreviation = Plugin.Resources.getString("SecondsAbbreviation");
            }
            else if (time.nsec < (1000 * 1000)) { // less than 1 msec
                value = parseFloat(time.msec.toPrecision(2));
                unitAbbreviation = Plugin.Resources.getString("MillisecondsAbbreviation");
            }
            else if (time.nsec < (1000 * 1000 * 1000)) { // less than 1 sec
                value = time.msec;
                value = Math.floor(value * 100) / 100; // Take 2 decimals without rounding
                unitAbbreviation = Plugin.Resources.getString("MillisecondsAbbreviation");
            }
            else {
                value = time.sec;
                value = Math.floor(value * 100) / 100; // Take 2 decimals without rounding
                unitAbbreviation = Plugin.Resources.getString("SecondsAbbreviation");
            }
            return PerfTools.FormattingHelpers.getDecimalLocaleString(value, /*includeGroupSeparators=*/ true, 2) + " " + unitAbbreviation;
        }
        static getPronounceableTime(time) {
            var value;
            var unitAbbreviation;
            if (time.nsec === 0) {
                value = 0;
                unitAbbreviation = Plugin.Resources.getString("Seconds");
            }
            else if (time.nsec < (1000 * 1000)) { // less than 1 msec
                value = parseFloat(time.msec.toPrecision(2));
                unitAbbreviation = Plugin.Resources.getString("Milliseconds");
            }
            else if (time.nsec < (1000 * 1000 * 1000)) { // less than 1 sec
                value = time.msec;
                value = Math.floor(value * 100) / 100; // Take 2 decimals without rounding
                unitAbbreviation = Plugin.Resources.getString("Milliseconds");
            }
            else {
                value = time.sec;
                value = Math.floor(value * 100) / 100; // Take 2 decimals without rounding
                unitAbbreviation = Plugin.Resources.getString("Seconds");
            }
            return PerfTools.FormattingHelpers.getDecimalLocaleString(value, /*includeGroupSeparators=*/ true) + " " + unitAbbreviation;
        }
        static getPrettyPrintBytes(bytes) {
            var size = 0;
            var unitAbbreviation;
            if (Math.abs(bytes) >= (1024 * 1024 * 1024)) {
                size = bytes / (1024 * 1024 * 1024);
                unitAbbreviation = Plugin.Resources.getString("GigabyteUnits");
            }
            else if (Math.abs(bytes) >= (1024 * 1024)) {
                size = bytes / (1024 * 1024);
                unitAbbreviation = Plugin.Resources.getString("MegabyteUnits");
            }
            else if (Math.abs(bytes) >= 1024) {
                size = bytes / 1024;
                unitAbbreviation = Plugin.Resources.getString("KilobyteUnits");
            }
            else {
                size = bytes;
                unitAbbreviation = Plugin.Resources.getString("ByteUnits");
            }
            return PerfTools.FormattingHelpers.getDecimalLocaleString(parseFloat(size.toFixed(2)), true) + " " + unitAbbreviation;
        }
        static getPronounceableBytes(bytes) {
            var size = 0;
            var unit;
            if (Math.abs(bytes) >= (1024 * 1024 * 1024)) {
                size = bytes / (1024 * 1024 * 1024);
                unit = Plugin.Resources.getString("Gigabytes");
            }
            else if (Math.abs(bytes) >= (1024 * 1024)) {
                size = bytes / (1024 * 1024);
                unit = Plugin.Resources.getString("Megabytes");
            }
            else if (Math.abs(bytes) >= 1024) {
                size = bytes / 1024;
                unit = Plugin.Resources.getString("Kilobytes");
            }
            else {
                size = bytes;
                unit = Plugin.Resources.getString("Bytes");
            }
            return PerfTools.FormattingHelpers.getDecimalLocaleString(parseFloat(size.toFixed(2)), true) + " " + unit;
        }
    }
    exports.FormattingHelpers = FormattingHelpers;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/EventsTimelineListControl", ["require", "exports", "plugin-vs-v2", "Bpt.Diagnostics.Common", "Bpt.Diagnostics.PerfTools.Common", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/controls/Divider", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/FormattingHelpers", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/EventsTimelineView", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/responsivenessNotifications", "diagnosticsHub-swimlanes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program.main"], function (require, exports, Plugin, Common, PerfTools, Divider_1, FormattingHelpers_1, TimeSpan_1, EventsTimelineView_1, Program_1, responsivenessNotifications_1, diagnosticsHub_swimlanes_1, Program_main_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventsTimelineListControl = exports.EventDataTemplate = exports.EventDataTooltip = exports.TextFormat = exports.EventCategory = void 0;
    var EventCategory;
    (function (EventCategory) {
        EventCategory[EventCategory["GC"] = 0] = "GC";
        EventCategory[EventCategory["Network"] = 1] = "Network";
        EventCategory[EventCategory["DiskIo"] = 2] = "DiskIo";
        EventCategory[EventCategory["Idle"] = 3] = "Idle";
        EventCategory[EventCategory["WindowResized"] = 4] = "WindowResized";
        EventCategory[EventCategory["AppStartup"] = 5] = "AppStartup";
        EventCategory[EventCategory["VisualStateChanged"] = 6] = "VisualStateChanged";
        EventCategory[EventCategory["XamlFrameNavigation"] = 7] = "XamlFrameNavigation";
        EventCategory[EventCategory["XamlParsing"] = 8] = "XamlParsing";
        EventCategory[EventCategory["XamlLayout"] = 9] = "XamlLayout";
        EventCategory[EventCategory["XamlRender"] = 10] = "XamlRender";
        EventCategory[EventCategory["XamlUIElementCost"] = 11] = "XamlUIElementCost";
        EventCategory[EventCategory["XamlUIThreadFrame"] = 12] = "XamlUIThreadFrame";
        EventCategory[EventCategory["XamlOther"] = 13] = "XamlOther";
        EventCategory[EventCategory["AppCode"] = 14] = "AppCode";
    })(EventCategory = exports.EventCategory || (exports.EventCategory = {}));
    var TextFormat;
    (function (TextFormat) {
        TextFormat[TextFormat["Html"] = 0] = "Html";
        TextFormat[TextFormat["String"] = 1] = "String";
    })(TextFormat = exports.TextFormat || (exports.TextFormat = {}));
    class EventDataTooltip extends Common.TemplateControl {
        constructor(event) {
            super("eventDataTooltip");
            var durationExclusive = this.findElement("durationExc");
            var durationInclusive = this.findElement("durationInc");
            var startTime = this.findElement("startTime");
            durationExclusive.textContent = Plugin.Resources.getString("DurationLabelExclusive", FormattingHelpers_1.FormattingHelpers.getPrettyPrintTime(event.exclusiveDuration));
            durationInclusive.textContent = Plugin.Resources.getString("DurationLabelInclusive", FormattingHelpers_1.FormattingHelpers.getPrettyPrintTime(event.timeSpan.elapsed));
            startTime.textContent = Plugin.Resources.getString("StartTimeLabel", FormattingHelpers_1.FormattingHelpers.getPrettyPrintTime(event.timeSpan.begin));
        }
    }
    exports.EventDataTooltip = EventDataTooltip;
    class EventDataTemplate extends Common.ListControl.TreeItemDataTemplate {
        constructor() {
            super("eventDataTemplate");
            this._bar = this.findElement("bar");
            this._durationText = this.findElement("durationText");
            this._hintText = this.findElement("hintText");
            this._eventName = this.findElement("eventName");
            this._threadIndicator = this.findElement("threadIndicator");
            this._bar.addEventListener("mouseover", e => this.showBarTooltip());
            this._bar.addEventListener("mouseout", e => Plugin.Tooltip.dismiss());
            this._durationText.addEventListener("mouseover", e => this.showDurationTooltip());
            this._durationText.addEventListener("mouseout", e => Plugin.Tooltip.dismiss());
            this._threadIndicator.addEventListener("mouseover", e => this.showThreadIndicatorTooltip(e));
            this._threadIndicator.addEventListener("mouseout", e => Plugin.Tooltip.dismiss());
            this._eventName.addEventListener("mouseover", e => this.showEventNameTooltip(e));
            this._eventName.addEventListener("mouseout", e => Plugin.Tooltip.dismiss());
            this._hintText.addEventListener("mouseover", e => this.showEventDetailsHintTooltip(e));
            this._hintText.addEventListener("mouseout", e => Plugin.Tooltip.dismiss());
        }
        get eventNameDiv() {
            return this._eventName;
        }
        get canViewSource() {
            var sourceInfo = this._event.context ? this._event.context.sourceInfo : null;
            return EventDataTemplate.hasViewSourceInfo(sourceInfo);
        }
        static addTokens(text, div, textFormat) {
            var tokens;
            switch (textFormat) {
                case TextFormat.Html:
                    tokens = PerfTools.TokenExtractor.getHtmlTokens(text);
                    break;
                case TextFormat.String:
                    tokens = PerfTools.TokenExtractor.getStringTokens(text);
                    break;
            }
            if (tokens && tokens.length > 0) {
                for (var i = 0; i < tokens.length; i++) {
                    var token = tokens[i];
                    var tokenSpan = document.createElement("span");
                    tokenSpan.className = PerfTools.TokenExtractor.getCssClass(token.type);
                    tokenSpan.textContent = token.value;
                    div.appendChild(tokenSpan);
                }
            }
            else {
                div.textContent = text;
            }
        }
        static hasViewSourceInfo(sourceInfo) {
            // <DOM> is a default source script that the Datawarehouse returns whenever it cannot resolve the document. In this case we don't want to add a source link
            // as it won't navigate anywhere. This string needs to be kept in sync w/ edev\DiagnosticsHub\sources\Core\DiagnosticsHub.DataWarehouse\ActiveScriptSymbols.cpp.
            return sourceInfo && sourceInfo.source !== "<DOM>";
        }
        static setViewSourceHandler(element, sourceInfo, keyboardNavigable, event) {
            element.addEventListener("mouseover", e => EventDataTemplate.showSourceInfoTooltip(e, sourceInfo, event));
            element.addEventListener("mouseout", e => Plugin.Tooltip.dismiss());
            element.onclick = EventDataTemplate.contextMouseHandler.bind(this, sourceInfo);
            if (keyboardNavigable) {
                element.tabIndex = 0;
                element.onkeydown = EventDataTemplate.contextKeyHandler.bind(this, sourceInfo);
            }
        }
        static showSourceInfoTooltip(mouseEvent, sourceInfo, event) {
            if (sourceInfo) {
                var tooltip = new PerfTools.Controls.SourceInfoTooltip(sourceInfo, event, "SourceInfoEventLabel");
                var config = {
                    content: tooltip.html,
                    contentContainsHTML: true
                };
                Plugin.Tooltip.show(config);
                mouseEvent.stopImmediatePropagation();
            }
        }
        tryViewSource() {
            if (this.canViewSource) {
                var sourceInfo = this._event.context.sourceInfo;
                EventDataTemplate.viewSource(sourceInfo.source, sourceInfo.line, sourceInfo.column);
            }
        }
        updateEvent(event, parentTimeSpan, viewSettings) {
            if (this._event !== event || !this._parentTimeSpan || !this._parentTimeSpan.equals(parentTimeSpan) || this._viewSettings !== viewSettings) {
                this._event = event;
                this.rootElement.setAttribute("aria-label", this._event.getAriaLabel());
                this._parentTimeSpan = parentTimeSpan;
                this._viewSettings = viewSettings;
                this.updateData(event);
            }
        }
        updateUiOverride(event) {
            super.updateUiOverride(event);
            if (event.isEventOnUIThread && this._viewSettings.showThreadIndicator) {
                this._threadIndicator.classList.remove("hidden");
            }
            else {
                this._threadIndicator.classList.add("hidden");
            }
            if (event.context) {
                this._eventName.textContent = "";
                var appendSpan = (text, parent) => {
                    if (text) {
                        var span = document.createElement("span");
                        span.textContent = text;
                        parent.appendChild(span);
                    }
                };
                appendSpan(event.fullName.substring(0, event.context.span.startIndex), this._eventName);
                var text = event.fullName.substring(event.context.span.startIndex, event.context.span.endIndex);
                var span = this.getContextSpan(event.name, text, event.context.sourceInfo);
                this._eventName.appendChild(span);
                appendSpan(event.fullName.substring(event.context.span.endIndex), this._eventName);
            }
            else if (event instanceof EventsTimelineView_1.ProfilerEvent && PerfTools.TokenExtractor.isHtmlExpression(event.fullName)) {
                this._eventName.textContent = "";
                EventDataTemplate.addTokens(event.fullName, this._eventName, TextFormat.Html);
            }
            else if (event instanceof EventsTimelineView_1.ProfilerEvent && PerfTools.TokenExtractor.isStringExpression(event.fullName)) {
                this._eventName.textContent = "";
                EventDataTemplate.addTokens(event.fullName, this._eventName, TextFormat.String);
            }
            else {
                if (this._viewSettings.showQualifiersInEventNames) {
                    this._eventName.textContent = event.fullName;
                }
                else {
                    this._eventName.textContent = event.name;
                }
            }
            var left = (event.timeSpan.begin.nsec - this._parentTimeSpan.begin.nsec) / this._parentTimeSpan.elapsed.nsec * 100;
            var width = event.timeSpan.elapsed.nsec / this._parentTimeSpan.elapsed.nsec * 100;
            this._bar.style.marginLeft = left + "%";
            this._bar.style.width = width + "%";
            EventDataTemplate.setBarCss(this._bar, event);
            var durationText = FormattingHelpers_1.FormattingHelpers.getPrettyPrintTime(event.timeSpan.elapsed);
            if (!event.exclusiveDuration.equals(event.timeSpan.elapsed) && (this._viewSettings.showDurationSelfInTimeline)) {
                durationText += " (" + FormattingHelpers_1.FormattingHelpers.getPrettyPrintTime(event.exclusiveDuration) + ")";
            }
            this._durationText.textContent = durationText;
            var hintData = event.detailsHintData;
            if (hintData && this._viewSettings.showHintTextInTimeline) {
                this._hintText.textContent = hintData.text;
            }
            else {
                this._hintText.textContent = "";
            }
        }
        static contextKeyHandler(sourceInfo, evt) {
            if ((evt.keyCode === Common.KeyCodes.Enter || evt.keyCode === Common.KeyCodes.Space) && !evt.ctrlKey && !evt.altKey && !evt.shiftKey) {
                EventDataTemplate.viewSource(sourceInfo.source, sourceInfo.line, sourceInfo.column);
            }
        }
        static contextMouseHandler(sourceInfo) {
            // When the mouse click occurs on a source hyperlink in the timeline grid,
            // the click event will bubble up through link's onclick event handler to
            // the parent ItemContainer's element, which will select the row.
            // We need the view source navigation below to occur after row selection
            // so that the row selection doesn't resteal focus from the debugger
            // after view source navigation.
            window.setTimeout(() => {
                EventDataTemplate.viewSource(sourceInfo.source, sourceInfo.line, sourceInfo.column);
            });
        }
        static setBarCss(bar, event) {
            bar.className = "eventBar " + event.getCssClass();
            var barCssClass = event.getBarCssClass();
            if (barCssClass) {
                bar.classList.add(barCssClass);
            }
        }
        static viewSource(unshortenedUrl, line, column) {
            Plugin.Host.showDocument(unshortenedUrl, line, column).then(() => { }, (err) => {
                Program_main_1.Program.hostShell.setStatusBarText(Plugin.Resources.getString("UnableToNavigateToSource"), true /*highlight*/);
            });
        }
        getContextSpan(eventName, linkText, sourceInfo) {
            var contextLink = document.createElement("span");
            contextLink.textContent = linkText;
            var sourceInfo = this._event.context ? this._event.context.sourceInfo : null;
            if (EventDataTemplate.hasViewSourceInfo(sourceInfo)) {
                contextLink.className = "BPT-FileLink";
                EventDataTemplate.setViewSourceHandler(contextLink, sourceInfo, false /*keyboardNavigable*/, eventName);
            }
            return contextLink;
        }
        showBarTooltip() {
            if (this._event) {
                var toolTipControl = new EventDataTooltip(this._event);
                var config = {
                    content: toolTipControl.rootElement.innerHTML,
                    contentContainsHTML: true
                };
                Plugin.Tooltip.show(config);
            }
        }
        showDurationTooltip() {
            if (this._event) {
                var config = {
                    content: this._event.getStartAndDurationText(),
                };
                Plugin.Tooltip.show(config);
            }
        }
        showEventNameTooltip(mouseEvent) {
            if (this._event) {
                var eventDiv = mouseEvent.currentTarget;
                var tooltip = this._event.getTitleTooltipText();
                var config = {
                    content: tooltip
                };
                Plugin.Tooltip.show(config);
            }
        }
        showThreadIndicatorTooltip(mouseEvent) {
            if (this._event) {
                var tooltip = Plugin.Resources.getString("UIThreadIndicatorTooltip");
                var config = {
                    content: tooltip
                };
                Plugin.Tooltip.show(config);
            }
        }
        showEventDetailsHintTooltip(mouseEvent) {
            if (this._event) {
                var eventDiv = mouseEvent.currentTarget;
                var tooltip = this._event.detailsHintData.tooltip;
                var config = {
                    content: tooltip
                };
                Plugin.Tooltip.show(config);
            }
        }
    }
    exports.EventDataTemplate = EventDataTemplate;
    class EventsTimelineListControl extends Common.ListControl.TreeListControl {
        constructor(rootElement) {
            super(rootElement);
            this._columnsCssRule = this.getColumnsCssRule();
            this.ariaLabel = Plugin.Resources.getString("EventsTimelineAriaLabel");
            this.dataItemTemplateType = EventDataTemplate;
            this.onScrolled = (e) => {
                PerfTools.Notifications.notify(responsivenessNotifications_1.ResponsivenessNotifications.GridScrolled);
            };
            this.onItemContextMenuTriggered = (itemContainer) => {
                this._contextMenuSourceEvent = itemContainer.item;
            };
            // Changing to/from a high contrast theme invalidates the reference to the css rule
            // The theme change also fires the resize event.  This will update the css rule reference in that scenario
            Program_main_1.Program.addEventListener(Program_1.ProgramEvents.Resize, () => {
                this._columnsCssRule = this.getColumnsCssRule();
                this.invalidateSizeCache();
                if (this._viewModel) {
                    this.setDividerBounds();
                    this.resizeColumns(this._divider.offsetX);
                }
                this.onWindowResize();
            });
            Plugin.Theme.addEventListener("themechanged", () => {
                // When the theme changes the styles are reset back to the values in the CSS file, but this event fires before that
                // happens. We use a setTimeout callback so we reset the divider location after the styles have been reset.
                setTimeout(() => {
                    this._columnsCssRule = this.getColumnsCssRule();
                    // Moving the left divider (event name divider) will trigger a reset of the gantt chart as well as the right divider (details pane)
                    this._divider.moveToOffset(this.eventNameColumnWidth, true);
                }, 100);
            });
            this._divider = new Divider_1.Divider(this.panel.rootElement, this.eventNameColumnWidth);
            this._divider.minX = 90;
            this._divider.onMoved = (offsetX) => {
                this.resizeColumns(offsetX);
                Program_main_1.Program.triggerResize();
            };
            this._divider.dividerDivElement.ondblclick = () => {
                // Figure out the minimun width that will make all the event names visible and move the divider by that ammount
                var eventNameCellRequiredWidth = 0;
                for (var i = this.panel.firstVisibleItemIndex; i <= this.panel.lastVisibleItemIndex; i++) {
                    var itemContainer = this.itemContainerGenerator.getItemContainerFromIndex(i);
                    if (itemContainer) {
                        var eventNameDiv = itemContainer.template.eventNameDiv;
                        if (eventNameDiv) {
                            eventNameCellRequiredWidth = Math.max(eventNameDiv.offsetLeft + eventNameDiv.scrollWidth + 10, eventNameCellRequiredWidth);
                        }
                    }
                }
                this._divider.moveToOffset(eventNameCellRequiredWidth);
            };
            this.setDividerBounds();
            this._verticalRulerLineElementsFactory = diagnosticsHub_swimlanes_1.ElementRecyclerFactory.forDivWithClass(this.rootElement, "verticalRulerLine");
            this.invalidateSizeCache();
        }
        get dataColumnLeft() {
            var columns = this._columnsCssRule.style.gridTemplateColumns.split(" ");
            return parseInt(columns[0]) + parseInt(columns[1]);
        }
        get dataColumnWidth() {
            if (this._dataColumnWidth === null) {
                var panelScrollBarWidth = this.panel.rootElement.offsetWidth - this.panel.rootElement.clientWidth;
                this._dataColumnWidth = this.rootElement.offsetWidth - this.dataColumnLeft - panelScrollBarWidth;
            }
            return this._dataColumnWidth;
        }
        get eventNameColumnWidth() {
            var columns = this._columnsCssRule.style.gridTemplateColumns.split(" ");
            return parseInt(columns[0]);
        }
        get rulerScale() {
            return this._rulerScale;
        }
        set rulerScale(rulerScale) {
            if (this._rulerScale !== rulerScale) {
                this._rulerScale = rulerScale;
            }
        }
        set timeSpan(value) {
            this._timeSpan = value;
        }
        set viewModel(value) {
            this._viewModel = value;
        }
        invalidateSizeCache() {
            this._dataColumnWidth = null;
            super.invalidateSizeCache();
        }
        /**
         * Called when the list control gets invalidated
         */
        onInvalidated() {
            this.updateDividerHeight();
        }
        /**
         * Overridable. Gives the derived a class a chance to intercept key events.
         * @params event the keyboard event
         * @returns true if handled
         */
        onKeyDownOverride(event) {
            switch (event.keyCode) {
                case Common.KeyCodes.Enter:
                    this.onViewSource();
                    return Promise.resolve(true);
            }
            return super.onKeyDownOverride(event);
        }
        onShowContextMenu() {
            this.getSelectedItemContainer()
                .then((selectedItemContainer) => {
                if (selectedItemContainer && this._contextMenu) {
                    var rect = selectedItemContainer.template.rootElement.getBoundingClientRect();
                    this._contextMenu.show(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width);
                }
            });
        }
        renderVerticalRulerLines() {
            var positions = this._viewModel.getVerticalRulerLinePositions(this._timeSpan, this.dataColumnWidth);
            this._verticalRulerLineElementsFactory.start();
            for (var i = 0; i < positions.length; ++i) {
                var line = this._verticalRulerLineElementsFactory.getNext();
                var x = this.dataColumnWidth * positions[i] / 100 + this.dataColumnLeft;
                this.positionVerticalRulerLine(line, x, this.panel.viewportHeight);
            }
            this._verticalRulerLineElementsFactory.stop();
        }
        /**
         * Updates the data inside the template
         */
        updateTemplateData(template, data) {
            template.updateEvent(data, this._timeSpan, this._viewModel.viewSettings);
            // Setup the context menu
            if (!template.rootElement.getAttributeNode("data-plugin-contextmenu")) {
                this.setupEventContextMenu(template.rootElement);
            }
        }
        positionVerticalRulerLine(line, x, height) {
            line.style.left = x + "px";
            line.style.height = height + "px";
            line.style.top = "0px";
        }
        getColumnsCssRule() {
            return EventsTimelineView_1.EventsTimelineView.getCssRule("VisualProfiler.css", ".eventDataTemplate");
        }
        resizeColumns(offsetX) {
            this._dataColumnWidth = null;
            this.updateColumnWidth(offsetX);
            if (this.dataColumnWidthChanged) {
                this.dataColumnWidthChanged();
            }
            this.renderVerticalRulerLines();
        }
        /**
         * @param elements The elements to attach the selection context menu to
         */
        setupEventContextMenu(...elements) {
            if (!this._contextMenu) {
                var iconNames = this.getSelectionContextMenuIconNames();
                var filterToEventItem = {
                    callback: () => { this.filterToEvent(); },
                    label: Plugin.Resources.getString("FilterToEventContextMenu"),
                    type: Plugin.ContextMenu.MenuItemType.command,
                    disabled: () => { return false; }
                };
                var filterToEventTypeItem = {
                    callback: () => { this.filterToEventType(); },
                    label: Plugin.Resources.getString("FilterToEventTypeContextMenu"),
                    type: Plugin.ContextMenu.MenuItemType.command,
                    disabled: () => { return this.isFilterToEventTypeDisabled(); }
                };
                var clearFilterItem = {
                    callback: () => { this.clearFilter(); },
                    label: Plugin.Resources.getString("ClearFilterContextMenu"),
                    type: Plugin.ContextMenu.MenuItemType.command,
                    disabled: () => { return this.isClearFilterDisabled(); }
                };
                this._contextMenu = Plugin.ContextMenu.create([filterToEventItem, filterToEventTypeItem, clearFilterItem]);
            }
            for (var index = 0; index < elements.length; index++) {
                this._contextMenu.attach(elements[index]);
            }
        }
        getSelectionContextMenuIconNames() {
            if (Program_main_1.Program.hostType === Program_1.HostType.VS) {
                return {
                    zoomin: {
                        enabled: "vs-image-contextmenu-chartzoom-in",
                        disabled: "vs-image-contextmenu-chartzoom-in-disabled"
                    },
                    resetZoom: {
                        enabled: "vs-image-contextmenu-chartzoom-reset",
                        disabled: "vs-image-contextmenu-chartzoom-reset-disabled"
                    },
                    clearSelection: {
                        enabled: "vs-image-contextmenu-chartselection-clear",
                        disabled: "vs-image-contextmenu-chartselection-clear-disabled"
                    }
                };
            }
        }
        isClearFilterDisabled() {
            return this._viewModel.hasDefaultFilter === true;
        }
        getFilterTimeSpan(event) {
            // Time padding calculated based on an event's timespan
            // Pad 10% to the left and 90% to the right of an event in gantt chart.
            var eventTimeSpan = event.timeSpan;
            var sessionTimeSpan = this._viewModel.globalRuler.totalRange;
            var begin = Math.max(eventTimeSpan.begin.nsec, sessionTimeSpan.begin.nsec);
            var end = Math.min(eventTimeSpan.end.nsec, sessionTimeSpan.end.nsec);
            return new TimeSpan_1.TimeSpan(new TimeSpan_1.TimeStamp(begin), new TimeSpan_1.TimeStamp(end));
        }
        clearFilter() {
            // Reset all filters
            this._viewModel.resetFilter();
            // And reset view to entire session time range (even if zoomed in)
            this._viewModel.globalRuler.setSelection(this._viewModel.globalRuler.totalRange);
            Program_main_1.Program.reportTelemetry("TimelineFilter/ClearFilter", null);
        }
        filterToEvent() {
            this.getSelectedItemContainer()
                .then((selectedItemContainer) => {
                if (selectedItemContainer) {
                    selectedItemContainer.template.expand()
                        .then(() => {
                        var event = this.selectedItem;
                        var filterTimeSpan = this.getFilterTimeSpan(event);
                        var activeRange = this._viewModel.globalRuler.activeRange;
                        if (!activeRange.equals(this._viewModel.globalRuler.totalRange)) {
                            var begin = (filterTimeSpan.begin.nsec < activeRange.begin.nsec) ? filterTimeSpan.begin : activeRange.begin;
                            var end = (filterTimeSpan.end.nsec > activeRange.end.nsec) ? filterTimeSpan.end : activeRange.end;
                            this._viewModel.globalRuler.setActiveRange(new TimeSpan_1.TimeSpan(begin, end));
                        }
                        this._viewModel.timeSpan = filterTimeSpan;
                        this._viewModel.globalRuler.setSelection(filterTimeSpan);
                        Program_main_1.Program.reportTelemetry("TimelineFilter/FilterToEvent", { "EventName": event.name });
                    });
                }
            });
        }
        isFilterToEventTypeDisabled() {
            var enabled = this.contextMenuSourceEvent && this.contextMenuSourceEvent.level == 0;
            return !enabled;
        }
        filterToEventType() {
            this.getSelectedItemContainer()
                .then((selectedItemContainer) => {
                if (selectedItemContainer) {
                    selectedItemContainer.template.expand()
                        .then(() => {
                        var event = this.selectedItem;
                        this._viewModel.eventTypeFilter = event.intervalName;
                        Program_main_1.Program.reportTelemetry("TimelineFilter/FilterToEventType", { "EventName": event.name });
                    });
                }
            });
        }
        onViewSource() {
            this.getSelectedItemContainer()
                .then((selectedItemContainer) => {
                if (selectedItemContainer) {
                    var dataTemplate = selectedItemContainer.template;
                    if (dataTemplate) {
                        dataTemplate.tryViewSource();
                    }
                }
            });
        }
        setDividerBounds() {
            var containerWidth = this.panel.rootElement.offsetWidth;
            if (containerWidth > 0) {
                this._divider.maxX = containerWidth / 2;
            }
        }
        updateColumnWidth(offsetX) {
            if (offsetX === null || typeof offsetX === "undefined") {
                offsetX = this._divider.offsetX;
            }
            var columns = this._columnsCssRule.style.gridTemplateColumns.split(" ");
            columns[0] = offsetX + "px";
            this._columnsCssRule.style.gridTemplateColumns = columns.join(" ");
        }
        updateDividerHeight() {
            var height = Math.max(this.panel.virtualHeight, this.panel.actualHeight);
            this._divider.height = height;
        }
        get contextMenuSourceEvent() {
            return this._contextMenuSourceEvent;
        }
    }
    exports.EventsTimelineListControl = EventsTimelineListControl;
});
/// <reference path="TimeSpan.ts" />
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimestampConvertor", ["require", "exports", "diagnosticsHub", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan"], function (require, exports, diagnosticsHub_2, TimeSpan_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimestampConvertor = void 0;
    // Diagnostics Hub supports using BigNumber from now on. We still use our timestamp type for now.
    // Javascript supports 53 bits of precision & not 64 bits.(max value: 9007199254740992) Though we can never cross this duration.
    // ref: http://ecma262-5.com/ELS5_HTML.htm#Section_8.5
    class TimestampConvertor {
        static jsonToTimeStamp(bigNumber) {
            var l = bigNumber.l;
            var h = bigNumber.h;
            if (l < 0) {
                l = l >>> 0;
            }
            if (h < 0) {
                h = h >>> 0;
            }
            var nsec = h * 0x100000000 + l;
            return TimeSpan_2.TimeStamp.fromNanoseconds(nsec);
        }
        static timestampToJson(timeStamp) {
            return diagnosticsHub_2.BigNumber.convertFromNumber(timeStamp.nsec);
        }
    }
    exports.TimestampConvertor = TimestampConvertor;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/ImageUrlValidationHelpers", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImageUrlValidationHelpers = void 0;
    class ImageUrlValidationHelpers {
        static isValidImageUrl(url) {
            return ImageUrlValidationHelpers.IMG_DATA_URI_REGEX.test(url) ||
                ImageUrlValidationHelpers.MS_APP_IMG_REGEX.test(url) ||
                ImageUrlValidationHelpers.IMG_DISK_REGEX.test(url);
        }
    }
    exports.ImageUrlValidationHelpers = ImageUrlValidationHelpers;
    ImageUrlValidationHelpers.IMG_URL_REGEX = /^(http|https).*([.jpg]|[.jpeg]|[.gif]|[.png])$/i;
    ImageUrlValidationHelpers.HTTP_URL_REGEX = /^(http|https).*$/i;
    ImageUrlValidationHelpers.IMG_URL_CONTENTTYPE_REGEX = /^(image)/i;
    ImageUrlValidationHelpers.IMG_DATA_URI_REGEX = /^(data:image\/).*$/i;
    ImageUrlValidationHelpers.MS_APP_IMG_REGEX = /^(ms-appx(-web)?:\/\/).*$/i;
    ImageUrlValidationHelpers.IMG_DISK_REGEX = /\.(gif|jpg|jpeg|tiff|png|bmp|tile)$/i;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/GlobalRuler", ["require", "exports", "plugin-vs-v2", "diagnosticsHub", "Bpt.Diagnostics.PerfTools.Common", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/responsivenessNotifications", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan"], function (require, exports, Plugin, DiagnosticsHub, PerfTools, responsivenessNotifications_2, TimeSpan_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalRuler = void 0;
    class GlobalRuler {
        constructor(totalRange) {
            this._totalRange = totalRange;
            this._activeRange = this._selection = this._totalRange;
            this._selectionWasFinal = false;
            this._onViewSelectionChangedHandler = this.onViewSelectionChanged.bind(this);
            this._publisher = new Plugin.EventManager(null);
            this._viewEventManager = DiagnosticsHub.getViewEventManager();
            this._viewEventManager.selectionChanged.addEventListener(this._onViewSelectionChangedHandler);
        }
        get totalRange() {
            return this._totalRange;
        }
        get selection() {
            return this._selection;
        }
        get activeRange() {
            return this._activeRange;
        }
        deinitialize() {
            this._viewEventManager.selectionChanged.removeEventListener(this._onViewSelectionChangedHandler);
        }
        setSelection(newSelection, isIntermittent = false) {
            this.setSelectionInternal(newSelection, isIntermittent, /* viaHubSelection= */ false);
        }
        setActiveRange(newRange) {
            if (!this._activeRange.equals(newRange)) {
                this._activeRange = newRange;
                this._publisher.dispatchEvent(GlobalRuler.ActiveRangeChangedEventType);
            }
        }
        addEventListener(eventType, func) {
            this._publisher.addEventListener(eventType, func);
        }
        removeEventListener(eventType, func) {
            this._publisher.removeEventListener(eventType, func);
        }
        setSelectionInternal(newSelection, isIntermittent = false, viaHubSelection = false) {
            var selectionChanged = !this._selection.equals(newSelection);
            var selectionFinalChanged = this._selectionWasFinal !== !isIntermittent;
            this._selectionWasFinal = !isIntermittent;
            if (selectionChanged || (selectionFinalChanged && !isIntermittent)) {
                var begin = TimeSpan_3.TimeStamp.fromNanoseconds(Math.max(newSelection.begin.nsec, this._activeRange.begin.nsec));
                var end = TimeSpan_3.TimeStamp.fromNanoseconds(Math.min(newSelection.end.nsec, this._activeRange.end.nsec));
                this._selection = new TimeSpan_3.TimeSpan(begin, end);
                if (!viaHubSelection) {
                    this._viewEventManager.selectionChanged.raiseEvent({
                        position: this._selection.toJsonTimespan(),
                        isIntermittent: isIntermittent
                    });
                }
                this._publisher.dispatchEvent(GlobalRuler.SelectionChangedEventType, {
                    data: {
                        isIntermittent: isIntermittent,
                        newSelection: newSelection
                    }
                });
                PerfTools.Notifications.notify(responsivenessNotifications_2.ResponsivenessNotifications.UserSelectedTimeslice);
            }
        }
        onViewSelectionChanged(args) {
            var newSelection = TimeSpan_3.TimeSpan.fromJsonTimespan(args.position);
            this.setSelectionInternal(newSelection, args.isIntermittent, true);
        }
    }
    exports.GlobalRuler = GlobalRuler;
    GlobalRuler.SelectionChangedEventType = "selectionChanged";
    GlobalRuler.ActiveRangeChangedEventType = "activeRangeChanged";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/MarkEventModel", ["require", "exports", "plugin-vs-v2", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/FormattingHelpers", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan"], function (require, exports, Plugin, FormattingHelpers_2, TimeSpan_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkEventModel = void 0;
    class MarkEventModel {
        constructor(session) {
            this._session = session;
        }
        getMarkEvents(timeRange, category) {
            return this._session.queryMarkEvents(timeRange.begin.nsec, timeRange.end.nsec, category);
        }
        getMarkTooltip(mark) {
            var tooltip = mark.toolTip;
            var time = parseInt(mark.timestamp.value);
            tooltip += Plugin.Resources.getString("RulerMarkTooltipLabel", FormattingHelpers_2.FormattingHelpers.getPrettyPrintTime(TimeSpan_4.TimeStamp.fromNanoseconds(time)));
            return tooltip;
        }
    }
    exports.MarkEventModel = MarkEventModel;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/controls/DonutChart", ["require", "exports", "plugin-vs-v2", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/FormattingHelpers", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan"], function (require, exports, Plugin, FormattingHelpers_3, TimeSpan_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DonutChart = void 0;
    class DonutChart {
        constructor(container, tooltipCallback, addSectorAriaLabelCallback, donutViewConfig) {
            this._totalValue = 0;
            this._container = container;
            this._sectBaseData = [];
            // Label Offset is the distance between the donut arc and its label
            this._labelOffset = 8;
            this._renderTooltipCallback = tooltipCallback;
            this._addSectorAriaLabelCallback = addSectorAriaLabelCallback;
            var svgTextFontSize = Plugin.Theme.getValue("plugin-font-size");
            if (svgTextFontSize.indexOf("px") !== -1) {
                this._textFontPx = parseInt(svgTextFontSize.substring(0, svgTextFontSize.indexOf("px")));
            }
            else if (svgTextFontSize.indexOf("pt") !== -1) {
                // 0.75 is the approximate factor for converting font from 'pt' to 'px'
                this._textFontPx = Math.round(parseInt(svgTextFontSize.substring(0, svgTextFontSize.indexOf("pt"))) / 0.75);
            }
            else {
                this._textFontPx = 0;
            }
            this._config = donutViewConfig || { explosionFactor: 2, radius: 55, strokeWidth: 25, minDonutArcAngle: 10, containerWidth: 200, containerHeight: 200, clockwiseRotation: true };
            this._centerX = this._config.containerWidth / 2;
            this._centerY = this._config.containerHeight / 2;
            this._div = this.createDivContainer();
            this._container.appendChild(this._div);
            this._container.appendChild(this.createSeparator());
            this._listDiv = this.createList();
            this._container.appendChild(this._listDiv);
        }
        get centerX() {
            return this._centerX;
        }
        get centerY() {
            return this._centerY;
        }
        get containerHeight() {
            return this._config.containerHeight;
        }
        get containerWidth() {
            return this._config.containerWidth;
        }
        get clockwiseRotation() {
            return this._config.clockwiseRotation;
        }
        get explosionFactor() {
            return this._config.explosionFactor;
        }
        get radius() {
            return this._config.radius;
        }
        get strokeWidth() {
            return this._config.strokeWidth;
        }
        get sectors() {
            return this._sectBaseData;
        }
        addSector(sectorInfo) {
            this.addSectorToBaseSeries(sectorInfo);
        }
        addSectors(sectors) {
            for (var i = 0; i < sectors.length; i++) {
                this.addSector(sectors[i]);
            }
        }
        removeSector(sectorInfo) {
            var index = this.getSectorIndex(sectorInfo);
            if (index === -1) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1061"));
            }
            else {
                this._totalValue -= sectorInfo.value;
                this._sectBaseData.splice(index, 1);
            }
        }
        removeSectors(sectors) {
            for (var i = 0; i < sectors.length; i++) {
                this.removeSector(sectors[i]);
            }
        }
        render() {
            var donutSectorInfo = this.buildChartData(this._sectBaseData);
            var donutSectorPoints = this.calculatePoints(donutSectorInfo);
            this.draw(donutSectorPoints);
        }
        resetDonutChart() {
            this._totalValue = 0;
            this._sectBaseData = [];
            while (this._listDiv.hasChildNodes()) {
                this._listDiv.removeChild(this._listDiv.lastChild);
            }
            this._container.removeChild(this._svg);
            this._svg = this.createSVG();
            this._container.appendChild(this._svg);
        }
        addSectorToBaseSeries(sector) {
            this._totalValue += sector.value;
            this._sectBaseData.push(sector);
        }
        buildChartData(sectBaseData) {
            var sectDonutData = [];
            if (sectBaseData.length === 1) {
                sectDonutData.push({
                    startAngle: 0, endAngle: 360, percentValue: 100,
                    info: { name: sectBaseData[0].name, cssClass: sectBaseData[0].cssClass, value: sectBaseData[0].value }
                });
            }
            else {
                var currAngle = 0;
                var currValue = 0;
                var i = 0;
                var angleReductionFactor = this.getReductionFactor(sectBaseData);
                for (i = 0; i < sectBaseData.length - 1; i++) {
                    currValue = sectBaseData[i].value;
                    var arcAngle = Math.round(360 * currValue / this._totalValue);
                    var percentValue = parseFloat((100 * currValue / this._totalValue).toFixed(2));
                    arcAngle = (arcAngle < this._config.minDonutArcAngle) ? this._config.minDonutArcAngle : Math.round(angleReductionFactor * arcAngle);
                    sectDonutData.push({
                        startAngle: currAngle, endAngle: currAngle + arcAngle - this._config.explosionFactor, percentValue: percentValue,
                        info: { name: sectBaseData[i].name, cssClass: sectBaseData[i].cssClass, value: sectBaseData[i].value }
                    });
                    currAngle += arcAngle;
                    if (currAngle >= 360) {
                        break;
                    }
                }
                if (i === sectBaseData.length - 1 && currAngle < 360) {
                    currValue = sectBaseData[i].value;
                    var arcAngle = 360 - currAngle;
                    var percentValue = parseFloat((100 * currValue / this._totalValue).toFixed(2));
                    sectDonutData.push({
                        startAngle: currAngle, endAngle: currAngle + arcAngle - this._config.explosionFactor, percentValue: percentValue,
                        info: { name: sectBaseData[i].name, cssClass: sectBaseData[i].cssClass, value: sectBaseData[i].value }
                    });
                    currAngle += arcAngle;
                }
            }
            return sectDonutData;
        }
        calculatePoints(sectDonutData) {
            var radius = this._config.radius;
            var labelRadius = this._config.radius + (this._config.strokeWidth / 2) + this._labelOffset;
            var sectDonutPoints = [];
            var anchor;
            for (var i = 0; i < sectDonutData.length; i++) {
                var sAngle = sectDonutData[i].startAngle;
                var eAngle = sectDonutData[i].endAngle;
                var midAngle = (sectDonutData.length === 1) ? 0 : (sAngle + eAngle) / 2;
                var sx = radius * Math.sin(sAngle * Math.PI / 180);
                var sy = radius * Math.cos(sAngle * Math.PI / 180) * -1;
                var ex = radius * Math.sin(eAngle * Math.PI / 180);
                var ey = radius * Math.cos(eAngle * Math.PI / 180) * -1;
                if (midAngle < 180 && midAngle > 0) {
                    labelRadius = (sectDonutData[i].percentValue > 9) ? labelRadius + (this._textFontPx / 2) : labelRadius;
                    anchor = "start";
                }
                else if (midAngle > 180) {
                    anchor = "end";
                }
                else {
                    anchor = "middle";
                }
                var tx = labelRadius * Math.sin(midAngle * Math.PI / 180);
                var ty = labelRadius * Math.cos(midAngle * Math.PI / 180) * -1;
                var largeArcFlag = (eAngle - sAngle) > 180 ? 1 : 0;
                var sweepFlag = (this._config.clockwiseRotation) ? 1 : 0;
                sectDonutPoints.push({ startPoint: { x: sx, y: sy }, endPoint: { x: ex, y: ey }, label: { point: { x: tx, y: ty }, anchor: anchor }, percentValue: sectDonutData[i].percentValue, largeArc: largeArcFlag, sweepFlag: sweepFlag, info: sectDonutData[i].info });
            }
            return sectDonutPoints;
        }
        createDivContainer() {
            var div = document.createElement("div");
            div.style.width = "100%";
            div.style.height = "100%";
            return div;
        }
        createSeparator() {
            var div = document.createElement("div");
            div.className = "detailSeparator";
            return div;
        }
        createList() {
            var div = document.createElement("div");
            div.setAttribute("role", "rowgroup");
            div.className = "eventDetailsTable";
            return div;
        }
        createRow(sector) {
            var div = document.createElement("div");
            div.setAttribute("role", "row");
            div.className = "eventRow";
            div.appendChild(this.createCell(sector.info.name, "left"));
            var time = FormattingHelpers_3.FormattingHelpers.getPrettyPrintTime(new TimeSpan_5.TimeStamp(sector.info.value));
            div.appendChild(this.createCell(time, "right"));
            var percent = FormattingHelpers_3.FormattingHelpers.getPrettyPrintPercent(sector.percentValue);
            div.appendChild(this.createCell(percent, "right"));
            return div;
        }
        createCell(value, alignContent) {
            var div = document.createElement("div");
            div.setAttribute("role", "gridcell");
            div.className = "eventCell";
            div.style.textAlign = alignContent;
            div.textContent = value;
            return div;
        }
        createSVG() {
            var svg = document.createElementNS(DonutChart.SvgNS, "svg");
            svg.setAttribute("version", "1.1");
            svg.setAttribute("width", this._config.containerWidth + "px");
            svg.setAttribute("height", this._config.containerHeight + "px");
            svg.setAttribute("focusable", "false");
            return svg;
        }
        createSVGPath(cssClass, dAttribute, strokeWidth, sectorDonutPoint) {
            var path = document.createElementNS(DonutChart.SvgNS, "path");
            path.setAttribute("class", cssClass);
            path.setAttribute("d", dAttribute);
            path.setAttribute("stroke-width", strokeWidth.toString());
            if (this._renderTooltipCallback) {
                path.onmouseover = () => this.showToolTip(sectorDonutPoint.info, sectorDonutPoint.percentValue);
                path.onmouseout = (mouseEvent) => Plugin.Tooltip.dismiss();
            }
            this._listDiv.appendChild(this.createRow(sectorDonutPoint));
            if (this._addSectorAriaLabelCallback) {
                this._addSectorAriaLabelCallback(sectorDonutPoint.info, sectorDonutPoint.percentValue);
            }
            return path;
        }
        createSVGText(xPosition, yPosition, anchor, percentValue) {
            var text = document.createElementNS(DonutChart.SvgNS, "text");
            text.setAttribute("x", xPosition.toString());
            text.setAttribute("y", yPosition.toString());
            text.setAttribute("text-anchor", anchor);
            text.setAttribute("class", "BPT-donutChartText");
            text.textContent = Plugin.Resources.getString("Percent", Math.floor(percentValue));
            return text;
        }
        draw(sectDonutPoints) {
            // If needed store the previous svg element as buffer for increasing performance.
            if (typeof this._svg !== "undefined") {
                this._div.removeChild(this._svg);
            }
            this._svg = this.createSVG();
            if (sectDonutPoints.length === 1) {
                var i = 0;
                var dPath = "M " + this._centerX + "," + this._centerY +
                    " M " + (this._centerX + sectDonutPoints[i].startPoint.x) + ", " + (this._centerY + sectDonutPoints[i].startPoint.y) +
                    " A " + this._config.radius + "," + this._config.radius + " 1 " + sectDonutPoints[i].largeArc + ", " + sectDonutPoints[i].sweepFlag +
                    " " + (this._centerX + sectDonutPoints[i].startPoint.x) + "," + (this._centerY + sectDonutPoints[i].startPoint.y + this._config.radius * 2) +
                    " A " + this._config.radius + "," + this._config.radius + " 1 " + sectDonutPoints[i].largeArc + ", " + sectDonutPoints[i].sweepFlag +
                    " " + (this._centerX + sectDonutPoints[i].endPoint.x) + "," + (this._centerY + sectDonutPoints[i].endPoint.y);
                var arc = this.createSVGPath(sectDonutPoints[i].info.cssClass, dPath, this._config.strokeWidth, sectDonutPoints[i]);
                this._svg.appendChild(arc);
                var text = this.createSVGText(this._centerX + sectDonutPoints[i].label.point.x, this._centerY + sectDonutPoints[i].label.point.y, sectDonutPoints[i].label.anchor, sectDonutPoints[i].percentValue);
                this._svg.appendChild(text);
            }
            else if (sectDonutPoints.length > 1) {
                for (var i = 0; i < sectDonutPoints.length; i++) {
                    var dPath = "M " + this._centerX + "," + this._centerY +
                        " M " + (this._centerX + sectDonutPoints[i].startPoint.x) + ", " + (this._centerY + sectDonutPoints[i].startPoint.y) +
                        " A " + this._config.radius + "," + this._config.radius + " 1 " + sectDonutPoints[i].largeArc + ", " + sectDonutPoints[i].sweepFlag +
                        " " + (this._centerX + sectDonutPoints[i].endPoint.x) + "," + (this._centerY + sectDonutPoints[i].endPoint.y);
                    var arc = this.createSVGPath(sectDonutPoints[i].info.cssClass, dPath, this._config.strokeWidth, sectDonutPoints[i]);
                    this._svg.appendChild(arc);
                    if (sectDonutPoints[i].percentValue > Math.round(this._config.minDonutArcAngle * 100 / 360)) {
                        var text = this.createSVGText(this._centerX + sectDonutPoints[i].label.point.x, this._centerY + sectDonutPoints[i].label.point.y, sectDonutPoints[i].label.anchor, sectDonutPoints[i].percentValue);
                        this._svg.appendChild(text);
                    }
                }
            }
            this._div.appendChild(this._svg);
        }
        /*
         *  The getReductionFactor calculates the factor by which to reduce the size
         *  of all other arc angles to compensate for setting the minimum angle for
         *  the arc with the sector angle lesser than that of the minDonutArcAngle.
         *  Subsequently we set the minimum angle for the arc to be atleast minDonutArcAngle.
         *  and reduce the arc angle of all other arcs by this factor.
         */
        getReductionFactor(sectBaseData) {
            var currAngle = 0;
            var i = 0;
            var angleDifference = 0;
            for (i = 0; i < sectBaseData.length; i++) {
                currAngle = Math.round(360 * sectBaseData[i].value / this._totalValue);
                angleDifference += (currAngle < this._config.minDonutArcAngle) ? this._config.minDonutArcAngle - currAngle : 0;
            }
            return (1 - angleDifference / 360);
        }
        getSectorIndex(sector) {
            for (var i = 0; i < this._sectBaseData.length; i++) {
                if (this._sectBaseData[i] === sector || (this._sectBaseData[i].name === sector.name && this._sectBaseData[i].cssClass === sector.cssClass && this._sectBaseData[i].value === sector.value)) {
                    return i;
                }
            }
            return -1;
        }
        showToolTip(sector, percentValue) {
            var toolTipContent = this._renderTooltipCallback(sector, percentValue);
            if (toolTipContent !== "" && toolTipContent !== null && typeof toolTipContent !== "undefined") {
                var config = {
                    content: toolTipContent,
                };
                Plugin.Tooltip.show(config);
            }
        }
    }
    exports.DonutChart = DonutChart;
    DonutChart.SvgNS = "http://www.w3.org/2000/svg";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/DonutChartView", ["require", "exports", "Bpt.Diagnostics.Common", "Bpt.Diagnostics.PerfTools.Common", "plugin-vs-v2", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/controls/DonutChart", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/FormattingHelpers", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan"], function (require, exports, Common, PerfTools, Plugin, DonutChart_1, FormattingHelpers_4, TimeSpan_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DonutChartView = exports.DonutChartViewModel = exports.DonutChartModel = void 0;
    class DonutChartModel {
        constructor() {
            this._sectors = [];
        }
        get headerText() {
            return this._headerText;
        }
        set headerText(value) {
            this._headerText = value;
        }
        get sectors() {
            return this._sectors;
        }
        addSector(sector) {
            this._sectors.push(sector);
        }
    }
    exports.DonutChartModel = DonutChartModel;
    class DonutChartViewModel {
        constructor(container) {
            this._model = new DonutChartModel();
            this._view = new DonutChartView(container, this);
        }
        get model() {
            return this._model;
        }
        get view() {
            return this._view;
        }
    }
    exports.DonutChartViewModel = DonutChartViewModel;
    class DonutChartView extends Common.Control {
        constructor(container, controller) {
            super(container);
            this._controller = controller;
            this.rootElement.tabIndex = 0;
            var config = {
                explosionFactor: 2, radius: 55, strokeWidth: 25, minDonutArcAngle: 10, containerWidth: 230, containerHeight: 200, clockwiseRotation: true
            };
            this._donutChart = new DonutChart_1.DonutChart(this.rootElement, this.onRenderSectorTooltip.bind(this), this.onAddSectorAriaLabel.bind(this), config);
            this.rootElement.setAttribute("aria-label", Plugin.Resources.getString("InclusiveTimeAriaLabel"));
        }
        render() {
            this.addHeaderElement();
            DonutChartView.sortEventsByValue(this._controller.model.sectors);
            this._donutChart.addSectors(this._controller.model.sectors);
            this._donutChart.render();
        }
        static sortEventsByValue(sectors) {
            sectors.sort((sector1, sector2) => {
                return sector2.value - sector1.value;
            });
        }
        addHeaderElement() {
            var div = document.createElement("div");
            var span = document.createElement("span");
            span.style.marginLeft = "10px";
            span.innerText = this._controller.model.headerText;
            div.appendChild(span);
            this.rootElement.insertBefore(div, this.rootElement.firstChild);
        }
        onAddSectorAriaLabel(sector, percent) {
            if (this.addSectorAriaLabel) {
                var label = this.addSectorAriaLabel(sector, percent);
                if (label) {
                    var onAddSectorAriaLabel = this.rootElement.getAttribute("aria-label") + " " + label;
                    this.rootElement.setAttribute("aria-label", onAddSectorAriaLabel);
                }
            }
        }
        onRenderSectorTooltip(sectorInfo, percent) {
            var timeStamp = FormattingHelpers_4.FormattingHelpers.getPrettyPrintTime(new TimeSpan_6.TimeStamp(sectorInfo.value));
            return Plugin.Resources.getString("SectorTooltipFormat", sectorInfo.name, PerfTools.FormattingHelpers.getDecimalLocaleString(percent, /*includeGroupSeparators=*/ false), timeStamp);
        }
    }
    exports.DonutChartView = DonutChartView;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/EventsTimelineView", ["require", "exports", "plugin-vs-v2", "Bpt.Diagnostics.Common", "Bpt.Diagnostics.PerfTools.Common", "diagnosticsHub-swimlanes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/responsivenessNotifications", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/EventsTimelineListControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimestampConvertor", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/ImageUrlValidationHelpers", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/GlobalRuler", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/DonutChartView", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/controls/Divider", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program.main", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/FormattingHelpers"], function (require, exports, Plugin, Common, PerfTools, diagnosticsHub_swimlanes_2, Program_2, responsivenessNotifications_3, EventsTimelineListControl_1, TimeSpan_7, TimestampConvertor_1, ImageUrlValidationHelpers_1, GlobalRuler_1, DonutChartView_1, Divider_2, Program_main_2, FormattingHelpers_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventsTimelineView = exports.EventDetailsView = exports.EventsTimelineViewModel = exports.EventsTimelineModel = exports.EventsTimelineDataSource = exports.EventFactory = exports.PlaceholderEvent = exports.UIThreadFrameEvent = exports.ParsingEvent = exports.XamlOtherEvent = exports.AppCodeEvent = exports.FrameNavigationEvent = exports.VisualStateChangedEvent = exports.AppStartupEvent = exports.WindowResizedEvent = exports.RenderEvent = exports.UIElementCostEvent = exports.DiskIOEvent = exports.NetworkEvent = exports.LayoutEvent = exports.IdleEvent = exports.GarbageCollectionEvent = exports.ProfilerEvent = exports.EventIntervalsSort = void 0;
    // This enum needs to match the values assigned to the SortOptions combobox items
    var EventIntervalsSort;
    (function (EventIntervalsSort) {
        EventIntervalsSort[EventIntervalsSort["ChronographicalSort"] = 0] = "ChronographicalSort";
        EventIntervalsSort[EventIntervalsSort["DurationSort"] = 1] = "DurationSort";
    })(EventIntervalsSort = exports.EventIntervalsSort || (exports.EventIntervalsSort = {}));
    class ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            this.details = [];
            this._interval = interval;
            this._category = category;
            this._contextThreadId = ProfilerEvent.getContextThreadId(interval, uiThreadId);
            this._timeSpan = new TimeSpan_7.TimeSpan(TimestampConvertor_1.TimestampConvertor.jsonToTimeStamp(interval.begin), TimestampConvertor_1.TimestampConvertor.jsonToTimeStamp(interval.end));
            this._exclusiveTimeSpan = TimeSpan_7.TimeStamp.fromNanoseconds(interval.exclusiveDuration);
            this.supportsImagePreview = false;
            this.detailsHintData = {
                text: "",
                tooltip: "",
                ariaLabel: "",
            };
        }
        get category() {
            return this._category;
        }
        get childrenCount() {
            return this._interval.childrenCount;
        }
        get context() {
            return this._interval.context;
        }
        get contextThreadId() {
            return this._contextThreadId;
        }
        get exclusiveDuration() {
            return this._exclusiveTimeSpan;
        }
        get fullName() {
            return this._interval.fullName;
        }
        get intervalName() {
            return this._interval.name;
        }
        get hasChildren() {
            return this.interval.hasChildren;
        }
        get id() {
            return this._interval.id;
        }
        get interval() {
            return this._interval;
        }
        get isExpanded() {
            return this._interval.isExpanded;
        }
        get level() {
            return this._interval.level;
        }
        get name() {
            if (typeof this._name === "undefined") {
                this._name = this.createName();
            }
            return this._name;
        }
        get timeSpan() {
            return this._timeSpan;
        }
        get title() {
            return this.name;
        }
        get isEventOnUIThread() {
            return this.contextThreadId === null;
        }
        static convertBooleanToYesNoLabel(value) {
            return value ? "YesLabel" : "NoLabel";
        }
        static convertPropagationStatus(propagationStatus) {
            // Propagation status is a bitmap indicating whether preventDefault, stopPropagation or stopImmediatePropagation has been called
            var result = {
                preventDefaultCalled: (propagationStatus & 1) != 0,
                stopImmediatePropagationCalled: (propagationStatus & 2) != 0,
                stopPropagationCalled: (propagationStatus & 4) != 0,
            };
            return result;
        }
        static createElementString(tag, id, cssClass) {
            var elementValue = "";
            var hasAnyElementInfo = false;
            if (tag !== "") {
                hasAnyElementInfo = true;
                elementValue += "<" + tag;
            }
            else {
                elementValue += "<" + Plugin.Resources.getString("UnknownElement");
            }
            if (id !== "") {
                hasAnyElementInfo = true;
                elementValue += " id=\"" + id + "\"";
            }
            if (cssClass !== "") {
                hasAnyElementInfo = true;
                elementValue += " class=\"" + cssClass + "\"";
            }
            elementValue += ">";
            if (hasAnyElementInfo === false) {
                elementValue = "";
            }
            return elementValue;
        }
        static createShortenedUrlTextWithQueryString(url) {
            if (!url || url.indexOf("data:image") === 0) {
                return url;
            }
            var urlParts = url.split("/");
            // for a file returning the last element is correct
            // no query string is expected
            if (ProfilerEvent.isFile(url)) {
                return urlParts[urlParts.length - 1];
            }
            // for a resource in the format: http://www.domain.com/dir/resource?id=5
            // the path begins at the 4th element in the array split by "/"
            if (ProfilerEvent.isUrl(url) && urlParts.length > 3) {
                return "/" + urlParts.slice(3, urlParts.length).join("/");
            }
            return url;
        }
        createDetailInfo(name, value, nameLocalizationKey, valueLocalizationKey, sourceInfo) {
            var localizedValue;
            if (valueLocalizationKey) {
                localizedValue = Plugin.Resources.getString(valueLocalizationKey);
            }
            else {
                localizedValue = value;
            }
            var localizedName;
            if (nameLocalizationKey) {
                localizedName = Plugin.Resources.getString(nameLocalizationKey);
            }
            else {
                localizedName = name;
            }
            var additionalInfo = {
                propertyName: name,
                propertyValue: value,
                localizedName: localizedName,
                localizedValue: localizedValue
            };
            if (sourceInfo) {
                additionalInfo.sourceInfo = sourceInfo;
            }
            return additionalInfo;
        }
        createName() {
            return Plugin.Resources.getString(this._interval.name);
        }
        getBarCssClass() {
            switch (this._category) {
                case EventsTimelineListControl_1.EventCategory.XamlFrameNavigation:
                case EventsTimelineListControl_1.EventCategory.AppStartup:
                case EventsTimelineListControl_1.EventCategory.WindowResized:
                    return "bracket";
                default:
                    return null;
            }
        }
        getCssClass() {
            switch (this._category) {
                case EventsTimelineListControl_1.EventCategory.GC:
                    return "dataGC";
                case EventsTimelineListControl_1.EventCategory.Network:
                    return "dataNetwork";
                case EventsTimelineListControl_1.EventCategory.DiskIo:
                    return "dataDiskIO";
                case EventsTimelineListControl_1.EventCategory.XamlFrameNavigation:
                    return "dataFrameNavigation";
                case EventsTimelineListControl_1.EventCategory.XamlParsing:
                    return "dataParsing";
                case EventsTimelineListControl_1.EventCategory.XamlLayout:
                    return "dataLayout";
                case EventsTimelineListControl_1.EventCategory.XamlUIElementCost:
                    return "dataUIElementCost";
                case EventsTimelineListControl_1.EventCategory.XamlUIThreadFrame:
                    return "dataUIThreadFrame";
                case EventsTimelineListControl_1.EventCategory.XamlRender:
                    return "dataRendering";
                case EventsTimelineListControl_1.EventCategory.WindowResized:
                    return "dataWindowResized";
                case EventsTimelineListControl_1.EventCategory.AppStartup:
                    return "dataAppStartup";
                case EventsTimelineListControl_1.EventCategory.VisualStateChanged:
                    return "dataVisualStateChanged";
                case EventsTimelineListControl_1.EventCategory.XamlOther:
                    return "dataXamlOther";
                case EventsTimelineListControl_1.EventCategory.AppCode:
                    return "dataAppCode";
                case EventsTimelineListControl_1.EventCategory.Idle:
                    return "dataIdle";
                default:
                    return "dataPlaceholder";
                //throw new Error(Plugin.Resources.getErrorString("JSPerf.1033"));
            }
        }
        getDescription() {
            return "";
        }
        get detailsHintData() {
            return this._detailsHintData;
        }
        set detailsHintData(detailsHintData) {
            this._detailsHintData = detailsHintData;
        }
        getTitleTooltipText() {
            return this.fullName;
        }
        getAriaLabel() {
            var startTime = FormattingHelpers_5.FormattingHelpers.getPronounceableTime(this.timeSpan.begin);
            var duration = FormattingHelpers_5.FormattingHelpers.getPronounceableTime(this.exclusiveDuration);
            return Plugin.Resources.getString("ProfilerEventAriaLabel", this.getTitleTooltipText(), startTime, duration, this.detailsHintData.ariaLabel);
        }
        getStartAndDurationText() {
            var startTime = FormattingHelpers_5.FormattingHelpers.getPrettyPrintTime(this.timeSpan.begin);
            var duration = FormattingHelpers_5.FormattingHelpers.getPrettyPrintTime(this.exclusiveDuration);
            return Plugin.Resources.getString("ProfilerEventStartAndDuration", duration, startTime);
        }
        getPreviewImagePath() {
            return "";
        }
        getDetails(sourceInfo) {
            return [];
        }
        getEventDetailsRequestInformation() {
            return [];
        }
        getThreadContext() {
            return this.isEventOnUIThread ? "" : " [" + this._contextThreadId + "]";
        }
        setSourceDetails(sourceInfo, additionalInfos) {
            var additionalInfo = {
                propertyName: "CallbackFunction",
                propertyValue: sourceInfo.name,
                localizedName: Plugin.Resources.getString("CallbackFunction"),
                localizedValue: sourceInfo.name,
                sourceInfo: sourceInfo
            };
            additionalInfos.push(additionalInfo);
        }
        static getContextThreadId(interval, uiThreadId) {
            if (interval.beginThreadId !== uiThreadId) {
                return interval.beginThreadId;
            }
            if (interval.endThreadId !== uiThreadId) {
                return interval.endThreadId;
            }
            return null;
        }
        static isFile(url) {
            return url.match(/^(file|res|ms-appx):/i) ? true : false;
        }
        static isUrl(url) {
            return url.match(/^(https?|file|res|ms-appx):/i) ? true : false;
        }
    }
    exports.ProfilerEvent = ProfilerEvent;
    class GarbageCollectionEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var gcInterval = this.interval;
            this._tooltipText = Plugin.Resources.getString("GCEventTooltip", this.getGCReasonString(gcInterval.reason));
        }
        getDescription() {
            return Plugin.Resources.getString("GarbageCollectionEventDescription");
        }
        getDetails() {
            var result = super.getDetails();
            var gcInterval = this.interval;
            result.push(this.createDetailInfo("Reason", this.getGCReasonString(gcInterval.reason), "GarbageCollectionIntervalReason", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("Count", gcInterval.count, "GarbageCollectionIntervalCount", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("Type", this.getGCTypeString(gcInterval.type), "GarbageCollectionIntervalType", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("Generation", gcInterval.generation, "GarbageCollectionIntervalGeneration", null /*valueLocalizationKey*/));
            return result;
        }
        getGCReasonString(reason) {
            try {
                return Plugin.Resources.getString("GarbageCollectionReason" + reason);
            }
            catch (e) {
                // Reason string not found. Default to unknown reason.
                return Plugin.Resources.getString("GarbageCollectionReasonUnknown");
            }
        }
        getGCTypeString(type) {
            try {
                return Plugin.Resources.getString("GarbageCollectionType" + type);
            }
            catch (e) {
                // Type string not found. Default to unknown type.
                return Plugin.Resources.getString("GarbageCollectionTypeUnknown");
            }
        }
        getTitleTooltipText() {
            return this._tooltipText;
        }
    }
    exports.GarbageCollectionEvent = GarbageCollectionEvent;
    // Not a real event.  This exists purely for donut chart categorization.
    class IdleEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
        }
    }
    exports.IdleEvent = IdleEvent;
    class LayoutEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var layoutInterval = this.interval;
            this._tooltipText = Plugin.Resources.getString("LayoutEventTooltip", layoutInterval.elementCount);
        }
        getDescription() {
            return Plugin.Resources.getString("LayoutEventDescription");
        }
        getDetails() {
            var result = super.getDetails();
            var layoutInterval = this.interval;
            result.push(this.createDetailInfo("ElementCount", layoutInterval.elementCount, "LayoutIntervalElementCount", null /*valueLocalizationKey*/));
            return result;
        }
        getTitleTooltipText() {
            return this._tooltipText;
        }
    }
    exports.LayoutEvent = LayoutEvent;
    class NetworkEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var networkInterval = this.interval;
            var totalBytes = networkInterval.sentBytes + networkInterval.receivedBytes;
            if (totalBytes > 0) {
                var formattedTotalBytes = FormattingHelpers_5.FormattingHelpers.getPrettyPrintBytes(totalBytes);
                var pronounceableTotalBytes = FormattingHelpers_5.FormattingHelpers.getPronounceableBytes(totalBytes);
                this.detailsHintData = {
                    text: Plugin.Resources.getString("IntervalDetailsHintText", formattedTotalBytes),
                    tooltip: Plugin.Resources.getString("NetworkIntervalDetailsHintTooltip", formattedTotalBytes),
                    ariaLabel: pronounceableTotalBytes,
                };
            }
            this._tooltipText = Plugin.Resources.getString("NetworkEventTooltip", networkInterval.url);
            var url = this.getPreviewImagePath();
            this.supportsImagePreview = this.isValidImageUrl(url) || ImageUrlValidationHelpers_1.ImageUrlValidationHelpers.isValidImageUrl(url);
        }
        isValidImageUrl(url) {
            if (!navigator.onLine) {
                return false;
            }
            var networkInterval = this.interval;
            return ImageUrlValidationHelpers_1.ImageUrlValidationHelpers.IMG_URL_REGEX.test(url) ||
                (ImageUrlValidationHelpers_1.ImageUrlValidationHelpers.HTTP_URL_REGEX.test(url) &&
                    (networkInterval.mimeType === "" || ImageUrlValidationHelpers_1.ImageUrlValidationHelpers.IMG_URL_CONTENTTYPE_REGEX.test(networkInterval.mimeType)));
        }
        getDescription() {
            return Plugin.Resources.getString("NetworkEventDescription");
        }
        getDetails() {
            var result = super.getDetails();
            var networkInterval = this.interval;
            result.push(this.createDetailInfo("Url", networkInterval.url, "NetworkIntervalUrl", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("Method", networkInterval.method, "NetworkIntervalMethod", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("StatusCode", Plugin.Resources.getString("NetworkIntervalStatusCodeValue", networkInterval.statusCode, networkInterval.statusText), "NetworkIntervalStatusCode", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("SentBytes", FormattingHelpers_5.FormattingHelpers.getPrettyPrintBytes(networkInterval.sentBytes), "NetworkIntervalSentBytes", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("ReceivedBytes", FormattingHelpers_5.FormattingHelpers.getPrettyPrintBytes(networkInterval.receivedBytes), "NetworkIntervalReceivedBytes", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("ContentType", networkInterval.mimeType, "NetworkIntervalContentType", null /*valueLocalizationKey*/));
            return result;
        }
        getTitleTooltipText() {
            return this._tooltipText;
        }
        getPreviewImagePath() {
            var networkInterval = this.interval;
            return networkInterval.url;
        }
    }
    exports.NetworkEvent = NetworkEvent;
    class DiskIOEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var diskIoInterval = this.interval;
            if (diskIoInterval.size > 0) {
                this._formattedTotalBytes = FormattingHelpers_5.FormattingHelpers.getPrettyPrintBytes(diskIoInterval.size);
                var pronounceableTotalBytes = FormattingHelpers_5.FormattingHelpers.getPronounceableBytes(diskIoInterval.size);
                this.detailsHintData = {
                    text: Plugin.Resources.getString("IntervalDetailsHintText", this._formattedTotalBytes),
                    tooltip: Plugin.Resources.getString("DiskIOIntervalDetailsHintTooltip", this._formattedTotalBytes),
                    ariaLabel: pronounceableTotalBytes,
                };
            }
            this._operation = this.getDiskIOTypeString(diskIoInterval.ioType);
            this._tooltipText = Plugin.Resources.getString("DiskIOTooltip", this._operation, diskIoInterval.path);
            this.supportsImagePreview = ImageUrlValidationHelpers_1.ImageUrlValidationHelpers.isValidImageUrl(this.getPreviewImagePath());
        }
        getDescription() {
            return Plugin.Resources.getString("DiskIODescription");
        }
        getDetails() {
            var result = super.getDetails();
            var diskIoInterval = this.interval;
            result.push(this.createDetailInfo("Operation", this._operation, "DiskIOIntervalOperation", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("FileName", diskIoInterval.fileName, "DiskIOIntervalFileName", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("Path", diskIoInterval.path, "DiskIOIntervalPath", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("Size", this._formattedTotalBytes, "DiskIOIntervalSize", null /*valueLocalizationKey*/));
            return result;
        }
        getTitleTooltipText() {
            return this._tooltipText;
        }
        getDiskIOTypeString(operation) {
            try {
                return Plugin.Resources.getString("DiskIOType" + operation);
            }
            catch (e) {
                // Mode string not found. Default to unknown mode.
                return Plugin.Resources.getString("DiskIOTypeUnknown");
            }
        }
        getPreviewImagePath() {
            var diskIoInterval = this.interval;
            return diskIoInterval.path;
        }
    }
    exports.DiskIOEvent = DiskIOEvent;
    class UIElementCostEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var elementInterval = this.interval;
            this._tooltipText = Plugin.Resources.getString("UIElementCostEventTooltip", elementInterval.fullName, elementInterval.elementsInclusive);
        }
        getDescription() {
            return Plugin.Resources.getString("UIElementCostEventDescription");
        }
        getDetails() {
            var result = super.getDetails();
            var elementInterval = this.interval;
            result.push(this.createDetailInfo("Class", elementInterval.className, "UIElementCostClass", null /*valueLocalizationKey*/));
            if (elementInterval.elementName) {
                result.push(this.createDetailInfo("Name", elementInterval.elementName, "UIElementCostName", null /*valueLocalizationKey*/));
            }
            if (elementInterval.templateName || elementInterval.templateType) {
                result.push(this.createDetailInfo("TemplateName", this.getTemplateName(elementInterval), "UIElementCostTemplateName", null /*valueLocalizationKey*/));
            }
            result.push(this.createDetailInfo("Count", elementInterval.childrenCount, "UIElementCostCount", null /*valueLocalizationKey*/));
            return result;
        }
        getTemplateName(elementCostEvent) {
            if (elementCostEvent.templateType === "Key" && elementCostEvent.templateName) {
                return elementCostEvent.templateName;
            }
            else if (elementCostEvent.templateType === "Style" && elementCostEvent.templateName) {
                return elementCostEvent.templateName;
            }
            else if (elementCostEvent.templateType === "Inline") {
                return Plugin.Resources.getString("UIElementCostTemplateName_Inline");
            }
            else if (elementCostEvent.templateType === "Implicit") {
                return Plugin.Resources.getString("UIElementCostTemplateName_Implicit");
            }
            else if (!elementCostEvent.templateType || elementCostEvent.templateType === "Unknown") {
                return Plugin.Resources.getString("UIElementCostTemplateName_Unknown");
            }
            else {
                return Plugin.Resources.getString("UIElementCostTemplateName_Unknown");
            }
        }
        getTitleTooltipText() {
            return this._tooltipText;
        }
    }
    exports.UIElementCostEvent = UIElementCostEvent;
    class RenderEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var renderInterval = this.interval;
        }
        getDescription() {
            return Plugin.Resources.getString("XamlRenderDescription");
        }
        getTitleTooltipText() {
            return Plugin.Resources.getString("XamlRenderTooltip");
        }
    }
    exports.RenderEvent = RenderEvent;
    class WindowResizedEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
        }
        getDescription() {
            return Plugin.Resources.getString("WindowResizedDescription");
        }
        getTitleTooltipText() {
            return Plugin.Resources.getString("WindowResizedTooltip");
            ;
        }
    }
    exports.WindowResizedEvent = WindowResizedEvent;
    class AppStartupEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
        }
        getDescription() {
            return Plugin.Resources.getString("AppStartupDescription");
        }
        getTitleTooltipText() {
            return Plugin.Resources.getString("AppStartupTooltip");
        }
    }
    exports.AppStartupEvent = AppStartupEvent;
    class VisualStateChangedEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var visualStateChangedInterval = this.interval;
            this._tooltipText = Plugin.Resources.getString("VisualStateChangedTooltip", visualStateChangedInterval.state);
        }
        getDescription() {
            return Plugin.Resources.getString("VisualStateChangedDescription");
        }
        getDetails() {
            var result = super.getDetails();
            var visualStateChangedInterval = this.interval;
            if (visualStateChangedInterval.elementName) {
                result.push(this.createDetailInfo("Element", visualStateChangedInterval.elementName, "VisualStateChangedElementLabel", null /*valueLocalizationKey*/));
            }
            result.push(this.createDetailInfo("Type", visualStateChangedInterval.className, "VisualStateChangedTypeLabel", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("State", visualStateChangedInterval.state, "VisualStateChangedStateLabel", null /*valueLocalizationKey*/));
            return result;
        }
        getTitleTooltipText() {
            return this._tooltipText;
        }
    }
    exports.VisualStateChangedEvent = VisualStateChangedEvent;
    class FrameNavigationEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var frameNavigationInterval = this.interval;
            this._tooltipText = Plugin.Resources.getString("FrameNavigationEventTooltip", frameNavigationInterval.className);
        }
        getDescription() {
            return Plugin.Resources.getString("FrameNavigationEventDescription");
        }
        getDetails() {
            var result = super.getDetails();
            var frameNavigationInterval = this.interval;
            result.push(this.createDetailInfo("Class", frameNavigationInterval.className, "FrameNavigationEventClass", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("NavigationMode", this.getNavigationModeString(frameNavigationInterval.navigationMode), "FrameNavigationEventNavigationModeLabel", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("FromCache", frameNavigationInterval.fromCache, "FrameNavigationEventFromCache", frameNavigationInterval.fromCache ? "YesLabel" : "NoLabel"));
            return result;
        }
        getNavigationModeString(navigationMode) {
            try {
                return Plugin.Resources.getString("FrameNavigationEventNavigationMode" + navigationMode);
            }
            catch (e) {
                // Mode string not found. Default to unknown mode.
                return Plugin.Resources.getString("FrameNavigationEventNavigationModeUnknown");
            }
        }
        getTitleTooltipText() {
            return this._tooltipText;
        }
    }
    exports.FrameNavigationEvent = FrameNavigationEvent;
    class AppCodeEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
        }
        getDescription() {
            return "TODO: AppCode desc string";
        }
    }
    exports.AppCodeEvent = AppCodeEvent;
    class XamlOtherEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
        }
        getDescription() {
            return "TODO: XamlOther desc string";
        }
    }
    exports.XamlOtherEvent = XamlOtherEvent;
    class ParsingEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
            var parsingInterval = this.interval;
            if (parsingInterval.inclusiveElements > 0) {
                var formattedElementCount = PerfTools.FormattingHelpers.getDecimalLocaleString(parsingInterval.inclusiveElements, true);
                var tooltip = Plugin.Resources.getString("ParsingIntervalDetailsHintTooltip", formattedElementCount);
                this.detailsHintData = {
                    text: Plugin.Resources.getString("IntervalDetailsHintText", formattedElementCount),
                    tooltip: tooltip,
                    ariaLabel: tooltip,
                };
            }
            if (parsingInterval.parsingFromString) {
                this._tooltipText = Plugin.Resources.getString("ParsingFromStringEventTooltip");
            }
            else {
                this._tooltipText = Plugin.Resources.getString("ParsingEventTooltip", parsingInterval.path);
            }
        }
        getDescription() {
            return Plugin.Resources.getString("ParsingEventDescription");
        }
        getDetails() {
            var result = super.getDetails();
            var parsingInterval = this.interval;
            if (parsingInterval.parsingFromString) {
                result.push(this.createDetailInfo("FileName", "FromString", "ParsingIntervalFileName", "ParsingFromStringValue"));
            }
            else {
                result.push(this.createDetailInfo("FileName", parsingInterval.fileName, "ParsingIntervalFileName", null /*valueLocalizationKey*/));
                result.push(this.createDetailInfo("Path", parsingInterval.path, "ParsingIntervalPath", null /*valueLocalizationKey*/));
            }
            result.push(this.createDetailInfo("InclusiveCount", parsingInterval.inclusiveElements, "ParsingIntervalInclusiveCount", null /*valueLocalizationKey*/));
            result.push(this.createDetailInfo("ExclusiveCount", parsingInterval.exclusiveElements, "ParsingIntervalExclusiveCount", null /*valueLocalizationKey*/));
            return result;
        }
        getTitleTooltipText() {
            return this._tooltipText;
        }
    }
    exports.ParsingEvent = ParsingEvent;
    class UIThreadFrameEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
        }
        getDescription() {
            return Plugin.Resources.getString("UIThreadFrameDescription");
        }
        getTitleTooltipText() {
            return Plugin.Resources.getString("UIThreadFrameTooltip");
        }
    }
    exports.UIThreadFrameEvent = UIThreadFrameEvent;
    class PlaceholderEvent extends ProfilerEvent {
        constructor(interval, category, uiThreadId) {
            super(interval, category, uiThreadId);
        }
        getDescription() {
            return "Placeholder event description";
        }
        createName() {
            return this.interval.name;
        }
    }
    exports.PlaceholderEvent = PlaceholderEvent;
    class EventFactory {
        constructor() {
            this._nameToEventMap = {};
            this._nameToEventMap["GC"] = GarbageCollectionEvent;
            this._nameToEventMap["Idle"] = IdleEvent;
            this._nameToEventMap["Network"] = NetworkEvent;
            this._nameToEventMap["DiskIo"] = DiskIOEvent;
            this._nameToEventMap["XamlParsing"] = ParsingEvent;
            this._nameToEventMap["XamlLayout"] = LayoutEvent;
            this._nameToEventMap["XamlUIElementCost"] = UIElementCostEvent;
            this._nameToEventMap["XamlUIThreadFrame"] = UIThreadFrameEvent;
            this._nameToEventMap["XamlRender"] = RenderEvent;
            this._nameToEventMap["XamlFrameNavigation"] = FrameNavigationEvent;
            this._nameToEventMap["XamlOther"] = XamlOtherEvent;
            this._nameToEventMap["AppCode"] = AppCodeEvent;
            this._nameToEventMap["WindowResized"] = WindowResizedEvent;
            this._nameToEventMap["AppStartup"] = AppStartupEvent;
            this._nameToEventMap["VisualStateChanged"] = VisualStateChangedEvent;
        }
        createEvent(interval, uiThreadId) {
            var category = (EventsTimelineListControl_1.EventCategory[interval.category]);
            if (category === undefined) {
                return new PlaceholderEvent(interval, category, uiThreadId);
            }
            var eventType = this._nameToEventMap[interval.name];
            if (eventType) {
                return new eventType(interval, category, uiThreadId);
            }
            else {
                return new PlaceholderEvent(interval, category, uiThreadId);
                //throw new Error(Plugin.Resources.getErrorString("JSPerf.1040"));
            }
        }
    }
    exports.EventFactory = EventFactory;
    class EventsTimelineDataSource {
        constructor(uiThreadId, timeSpan, eventsFactory) {
            this._uiThreadId = uiThreadId;
            this._data = [];
            this._dataPrevious = [];
            this._eventsFactory = eventsFactory;
            this._currentIndex = null;
            this._timeSpan = timeSpan;
        }
        initialize(queryResult) {
            if (this._initializePromise) {
                // TODO: Implement promise cancellation.
                // this._initializePromise.cancel();
            }
            if (this._queryResult) { //Dispose old query result object
                this._queryResult.dispose();
            }
            this._queryResult = queryResult;
            this._initializePromise = this._queryResult.getIntervalsCount()
                .then((eventsCount) => {
                this._count = eventsCount;
                this._initializePromise = null;
            });
            return this._initializePromise;
        }
        get count() {
            return this._count;
        }
        get timeSpan() {
            return this._timeSpan;
        }
        collapseBranch(index) {
            return this._queryResult.collapseIntervalBranch(index)
                .then(() => {
                return this.resetData();
            });
        }
        expandBranch(index) {
            return this._queryResult.expandIntervalBranch(index)
                .then(() => {
                return this.resetData();
            });
        }
        ensureDataAvailable(startIndex, endIndex) {
            if (!(this._data[startIndex] && this._data[endIndex])) {
                this.fetchFromPrevious(startIndex, (endIndex - startIndex) + 1);
                if (!(this._data[startIndex] && this._data[endIndex])) {
                    //Data is to be fetched from native
                    return this.fetchData(startIndex, Math.max((endIndex - startIndex) + 1, EventsTimelineDataSource.PrefetchSize));
                }
            }
            //If reached here, then data is availabble. We dont have to fetch from native.
            return Common.PromiseHelper.getPromiseSuccess();
        }
        expandFrameForEvent(eventId) {
            return this._queryResult.expandFrameForEvent(eventId)
                .then(() => {
                return this.resetData();
            });
        }
        getNext(skip) {
            if (this._currentIndex === null) {
                return null;
            }
            if (this._currentIndex >= this.count) {
                return null;
            }
            var event = this._data[this._currentIndex];
            this._currentIndex++;
            if (!isNaN(skip)) {
                this._currentIndex += skip;
            }
            return event;
        }
        indexOfItem(eventId) {
            return this._queryResult.indexOfInterval(eventId);
        }
        indexOfParent(id) {
            return this._queryResult.indexOfParentInterval(id);
        }
        getAggregatedDescendantsForEvent(eventId) {
            return this._queryResult.getAggregatedDescendantsForEvent(eventId);
        }
        getSelectionSummary() {
            return this._queryResult.getSelectionSummary();
        }
        startAt(index) {
            if (this._currentIndex !== null) {
                //throw new Error(Plugin.Resources.getErrorString("JSPerf.1058"));
                // If we have an error fetching an interval of data, we don't currently call stop().
                // Ignore the fact that we have unbalanced calls - we'll just show the new interval.
            }
            if (isNaN(index) || index < 0 || index >= this.count) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1036"));
            }
            this._currentIndex = index;
            this._data = [];
        }
        stop() {
            this._currentIndex = null;
            this._dataPrevious = this._data;
            this._data = [];
        }
        fetchData(index, max) {
            var fromIndex = Math.max(0, index - max);
            var toIndex = Math.min(this._count, index + max) - 1;
            return this._queryResult.getIntervals(fromIndex, toIndex)
                .then((intervals) => {
                var dataIndex = fromIndex;
                for (var i = 0; i < intervals.length; i++, dataIndex++) {
                    if (!this._data[dataIndex]) {
                        var interval = intervals[i];
                        this._data[dataIndex] = this._eventsFactory.createEvent(interval, this._uiThreadId);
                    }
                }
            });
        }
        fetchFromPrevious(index, max) {
            if (this._dataPrevious[index]) {
                var fromIndex = Math.max(0, index - max);
                var toIndex = Math.min(this._dataPrevious.length, index + max) - 1;
                for (var i = fromIndex; i <= toIndex; i++) {
                    var item = this._dataPrevious[i];
                    if (item) {
                        this._data[i] = item;
                    }
                }
                return true;
            }
            return false;
        }
        resetData() {
            this._dataPrevious = [];
            this._data = [];
            return this._queryResult.getIntervalsCount()
                .then((count) => {
                this._count = count;
            });
        }
    }
    exports.EventsTimelineDataSource = EventsTimelineDataSource;
    EventsTimelineDataSource.PrefetchSize = 30;
    class EventsTimelineModel {
        constructor(session) {
            this._eventFactory = new EventFactory();
            this._session = session;
        }
        getEvents(timeSpan, filter) {
            return this._session.queryAppIntervals(timeSpan, filter)
                .then((intervalsQuery) => {
                var uiThreadId = this._session.getUIThreadId();
                if (this._currentQueryResult) {
                    this._currentQueryResult.dispose();
                }
                this._currentQueryResult = intervalsQuery;
                var dataSource = new EventsTimelineDataSource(uiThreadId, timeSpan, this._eventFactory);
                return dataSource.initialize(intervalsQuery)
                    .then(() => {
                    return dataSource;
                });
            });
        }
        getTelemetryStatsAndFormatForReporting() {
            return this._session.getTelemetryStats()
                .then((telemetryStats) => {
                var durations = {};
                for (var i = 0; i < telemetryStats.scenarios.length; i++) {
                    var scenario = telemetryStats.scenarios[i];
                    if (scenario.type === "AppStartup") {
                        durations[EventsTimelineModel.TelemetryApplicationStartUp] = scenario.duration;
                    }
                    else if (scenario.type === "XamlFrameNavigation") {
                        durations[EventsTimelineModel.TelemetryPageLoadDuration + EventsTimelineModel.TelemetryHashedPageName + i] = scenario.name;
                        durations[EventsTimelineModel.TelemetryPageLoadDuration + ".LoadTime." + i] = scenario.duration;
                    }
                }
                return durations;
            });
        }
        getUIThreadSummary(timeRange) {
            return this._session.getUIThreadSummary(timeRange);
        }
    }
    exports.EventsTimelineModel = EventsTimelineModel;
    // Should match with AppResponsiveness.Constants.TelemetryHashedPageName in edev\ClientDiagnostics\Source\AppResponsiveness\AppRespTool\Package\Constants.cs
    EventsTimelineModel.TelemetryHashedPageName = ".HashedPageName.";
    EventsTimelineModel.TelemetryApplicationStartUp = "ApplicationStartUpDuration";
    EventsTimelineModel.TelemetryPageLoadDuration = "PageLoadDuration";
    class EventsTimelineViewModel extends Common.Framework.Observable {
        constructor(model, globalRuler, markEventModel) {
            super();
            this._model = model;
            this._globalRuler = globalRuler;
            this._markEventModel = markEventModel;
            this._globalRuler.addEventListener(GlobalRuler_1.GlobalRuler.SelectionChangedEventType, e => this.onRulerSelectionChanged(e));
            this.timeSpan = this._globalRuler.totalRange;
            this.sort = EventIntervalsSort.ChronographicalSort;
            var msAbbreviation = Plugin.Resources.getString("MillisecondsAbbreviation");
            this.durationFilterOptions = [
                { value: "0", text: Plugin.Resources.getString("DurationFilterAll"), tooltip: Plugin.Resources.getString("DurationFilterTooltip") },
                { value: EventsTimelineViewModel.ONE_MS_IN_NS.toString(), text: Plugin.Resources.getString("DurationFilterTimed", EventsTimelineViewModel.ONE_MS_IN_NS / 1000 / 1000 + msAbbreviation), tooltip: Plugin.Resources.getString("DurationFilterTooltip") }
            ];
            this.sortOptions = [
                { value: "0", text: Plugin.Resources.getString("TimelineSortStartTime"), tooltip: Plugin.Resources.getString("TimelineSortTooltip") },
                { value: "1", text: Plugin.Resources.getString("TimelineSortDuration"), tooltip: Plugin.Resources.getString("TimelineSortTooltip") }
            ];
        }
        get globalRuler() {
            return this._globalRuler;
        }
        get selectedEvent() {
            return this._selectedEvent;
        }
        setSelectedEvent(event) {
            //Ignoring future requests if still processing
            if (this._setSelectionEventProcessing) {
                return Common.PromiseHelper.getPromiseSuccess();
            }
            if (this._selectedEvent !== event) {
                this._selectedEvent = event;
                if (this.selectedEventChanged) {
                    this._setSelectionEventProcessing = true;
                    return this.selectedEventChanged(this._selectedEvent)
                        .then(() => {
                        this._setSelectionEventProcessing = false;
                    }, () => {
                        this._setSelectionEventProcessing = false;
                    });
                }
                PerfTools.Notifications.notify(responsivenessNotifications_3.ResponsivenessNotifications.GridRowSelected);
            }
            return Common.PromiseHelper.getPromiseSuccess();
        }
        get viewSettings() {
            var viewSettings = {
                showDurationSelfInTimeline: this.showDurationSelfInTimeline,
                showHintTextInTimeline: this.showHintTextInTimeline,
                showQualifiersInEventNames: this.showQualifiersInEventNames,
                showThreadIndicator: this.showThreadIndicator
            };
            return viewSettings;
        }
        get timeSpan() {
            return this._timeSpan;
        }
        set timeSpan(value) {
            if ((value === undefined && this._timeSpan !== undefined) ||
                (value !== undefined && this._timeSpan === undefined) ||
                (value !== undefined && this._timeSpan !== undefined && !value.equals(this._timeSpan))) {
                this._timeSpan = value;
                this._isDataSourceInvalid = true;
                if (this.timeSpanChanged) {
                    this.timeSpanChanged();
                }
            }
        }
        static initialize() {
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.DisplayBackgroundActivitiesPropertyName, /*defaultValue=*/ false, (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.DisplayFramesPropertyName, /*defaultValue=*/ false, (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.DisplayScenariosPropertyName, /*defaultValue=*/ true, (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.DisplayIOActivitiesPropertyName, /*defaultValue=*/ true, (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.DisplayUIActivitiesPropertyName, /*defaultValue=*/ true, (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.DurationFilterPropertyName, /*defaultValue=*/ 0, (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.EventNameFilterPropertyName, /*defaultValue=*/ "", (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.EventTypeFilterPropertyName, /*defaultValue=*/ "", (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.HasFilterSettingsChangedPropertyName, /*defaultValue=*/ true, /*onChanged=*/ null, /*onChanging=*/ null);
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.HasViewSettingsChangedPropertyName, /*defaultValue=*/ true, /*onChanged=*/ null, /*onChanging=*/ null);
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.ShowDurationSelfInTimelinePropertyName, /*defaultValue=*/ true, (obj) => obj.onViewSettingsChange(), /*onChanging=*/ null);
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.ShowHintTextInTimelinePropertyName, /*defaultValue=*/ true, (obj) => obj.onViewSettingsChange(), /*onChanging=*/ null);
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.ShowQualifiersInEventNamesPropertyName, /*defaultValue=*/ true, (obj) => obj.onViewSettingsChange(), /*onChanging=*/ null);
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.ShowThreadIndicatorPropertyName, /*defaultValue=*/ true, (obj) => obj.onViewSettingsChange(), /*onChanging=*/ null);
            Common.Framework.ObservableHelpers.defineProperty(EventsTimelineViewModel, EventsTimelineViewModel.SortPropertyName, /*defaultValue=*/ 0, (obj) => obj.onFilterChange(), (obj) => obj.onFilterChanging());
        }
        getEventDetails(event) {
            var detailsRequests = event.getEventDetailsRequestInformation();
            if (!detailsRequests || detailsRequests.length === 0) {
                return event.getDetails();
            }
            var result = [];
            for (var i = 0; i < detailsRequests.length; i++) {
                var detailRequest = detailsRequests[i];
                if (detailRequest.isSourceRequest) {
                    var sourceRequest = detailRequest;
                    try {
                        var sourceDetails = sourceRequest.sourceInfo;
                        result = result.concat(event.getDetails(sourceDetails));
                    }
                    catch (e) {
                        // Symbol not found.
                    }
                }
                else {
                    result = result.concat(event.getDetails());
                }
            }
            return result;
        }
        getEvents() {
            if (this._gettingEventsPromise) {
                // TODO: Implement promise cancellation. This is quick workaround while working on it.
                // this._gettingEventsPromise.cancel();
                return this._gettingEventsPromise; // = null;
            }
            if (this._isDataSourceInvalid) {
                var filter = {
                    eventNameFilter: this.eventNameFilter,
                    eventTypeFilter: this.eventTypeFilter,
                    filterKeepBackgroundActivities: this.displayBackgroundActivities,
                    filterKeepFrames: this.displayFrames,
                    filterKeepScenarios: this.displayScenarios,
                    filterDurationThreshold: this.durationFilter,
                    filterKeepIOActivities: this.displayIOActivities,
                    filterKeepUIActivities: this.displayUIActivities,
                    sortByTime: this.sort === EventIntervalsSort.ChronographicalSort,
                };
                this._gettingEventsPromise = this._model.getEvents(this._timeSpan, filter).
                    then((dataSource) => {
                    this._dataSource = dataSource;
                    this._isDataSourceInvalid = false;
                    this._gettingEventsPromise = null;
                    if (this.displayFrames && this._selectedEvent) {
                        this._dataSource.expandFrameForEvent(this._selectedEvent.id)
                            .then(() => {
                            return this._dataSource;
                        });
                    }
                    return this._dataSource;
                });
                return this._gettingEventsPromise;
            }
            return Promise.resolve(this._dataSource);
        }
        getUIThreadSummary(timeRange) {
            return this._model.getUIThreadSummary(timeRange);
        }
        getMarks(category) {
            return this._markEventModel.getMarkEvents(this._globalRuler.totalRange, category);
        }
        getTelemetryStatsAndFormatForReporting() {
            return this._model.getTelemetryStatsAndFormatForReporting();
        }
        getMarkTooltip(mark) {
            return this._markEventModel.getMarkTooltip(mark);
        }
        getVerticalRulerLinePositions(timeSpan, viewWidth) {
            return diagnosticsHub_swimlanes_2.RulerUtilities.getVerticalLinePositions(timeSpan.toJsonTimespan(), viewWidth);
        }
        // Resets filter/display settings to defaults ('unfiltered')
        resetFilter() {
            this.displayBackgroundActivities = true;
            this.displayScenarios = true;
            this.displayIOActivities = true;
            this.displayUIActivities = true;
            this.durationFilter = undefined;
            this.eventNameFilter = undefined;
            this.eventTypeFilter = undefined;
            this.hasFilterSettingsChanged = false;
            this.hasDefaultFilter = true;
        }
        resetViewSettings() {
            this.hasViewSettingsChanged = false;
            this.showDurationSelfInTimeline = undefined;
            this.showHintTextInTimeline = undefined;
            this.showQualifiersInEventNames = undefined;
            this.showThreadIndicator = undefined;
        }
        onFilterChange() {
            this.hasDefaultFilter = this.displayBackgroundActivities === true &&
                this.displayScenarios === true &&
                this.displayIOActivities === true &&
                this.displayUIActivities === true &&
                (!this.durationFilter || this.durationFilter === 0) &&
                (!this.eventNameFilter || this.eventNameFilter.length === 0) &&
                (!this.eventTypeFilter || this.eventTypeFilter.length === 0);
            this.hasFilterSettingsChanged = !this.hasDefaultFilter;
        }
        onFilterChanging() {
            this._isDataSourceInvalid = true;
        }
        onViewSettingsChange() {
            this.hasViewSettingsChanged = !this.showDurationSelfInTimeline ||
                !this.showHintTextInTimeline ||
                !this.showQualifiersInEventNames ||
                !this.showThreadIndicator;
        }
        onRulerSelectionChanged(args) {
            if (!args.data.isIntermittent) {
                /*update only on selection complete*/
                this.timeSpan = new TimeSpan_7.TimeSpan(this._globalRuler.selection.begin, this._globalRuler.selection.end);
            }
        }
    }
    exports.EventsTimelineViewModel = EventsTimelineViewModel;
    EventsTimelineViewModel.ONE_MS_IN_NS = 1 * 1000 * 1000; /* 1ms */
    EventsTimelineViewModel.DisplayBackgroundActivitiesPropertyName = "displayBackgroundActivities";
    EventsTimelineViewModel.DisplayFramesPropertyName = "displayFrames";
    EventsTimelineViewModel.DisplayScenariosPropertyName = "displayScenarios";
    EventsTimelineViewModel.DisplayIOActivitiesPropertyName = "displayIOActivities";
    EventsTimelineViewModel.DisplayUIActivitiesPropertyName = "displayUIActivities";
    EventsTimelineViewModel.DurationFilterPropertyName = "durationFilter";
    EventsTimelineViewModel.EventNameFilterPropertyName = "eventNameFilter";
    EventsTimelineViewModel.EventTypeFilterPropertyName = "eventTypeFilter";
    EventsTimelineViewModel.HasFilterSettingsChangedPropertyName = "hasFilterSettingsChanged";
    EventsTimelineViewModel.SortPropertyName = "sort";
    EventsTimelineViewModel.HasViewSettingsChangedPropertyName = "hasViewSettingsChanged";
    EventsTimelineViewModel.ShowDurationSelfInTimelinePropertyName = "showDurationSelfInTimeline";
    EventsTimelineViewModel.ShowQualifiersInEventNamesPropertyName = "showQualifiersInEventNames";
    EventsTimelineViewModel.ShowHintTextInTimelinePropertyName = "showHintTextInTimeline";
    EventsTimelineViewModel.ShowThreadIndicatorPropertyName = "showThreadIndicator";
    EventsTimelineViewModel.initialize();
    class EventDetailsView extends Common.TemplateControl {
        constructor(event, details, descendants, timeSpan) {
            super("eventDetailsTemplate");
            this.initializeEventGroup();
            this._imagePreviewSeparator = this.findElement("imagePreviewSeparator");
            this._imagePreviewContainer = this.findElement("imagePreviewContainer");
            if (event === null) {
                this._aggregatedDescendants = descendants;
                if (this._aggregatedDescendants) {
                    this.displaySelectionSummaryFields(timeSpan.elapsed, timeSpan.begin);
                    this.displayInclusiveTimeSummary(/*isEventSelected=*/ false);
                }
            }
            else {
                this._details = details;
                this._event = event;
                this._aggregatedDescendants = descendants;
                this.displayCommonFields();
                this.displayEventSpecificFields();
                this.displayInclusiveTimeSummary(/*isEventSelected=*/ true);
                this.displayImagePreview();
                var cells = this.findElementsByClassName("eventCell");
                for (var cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                    var cell = cells[cellIndex];
                    ((value) => {
                        if (cell.classList.contains("BPT-FileLink")) {
                            cell.addEventListener("mouseover", e => EventsTimelineListControl_1.EventDataTemplate.showSourceInfoTooltip(e, this._event.context.sourceInfo));
                        }
                        else {
                            cell.addEventListener("mouseover", e => EventDetailsView.showCellTooltip(e, value));
                        }
                        cell.addEventListener("mouseout", e => Plugin.Tooltip.dismiss());
                    })(cell.textContent);
                }
            }
        }
        static getCssClass(category) {
            switch (category) {
                case "Idle":
                    return "dataIdle";
                case "XamlParsing":
                    return "dataParsing";
                case "XamlLayout":
                    return "dataLayout";
                case "XamlOther":
                    return "dataXamlOther";
                case "AppCode":
                    return "dataAppCode";
                case "XamlRender":
                    return "dataRendering";
                case "IO":
                    return "dataIO";
                default:
                    //throw new Error(Plugin.Resources.getErrorString("JSPerf.1033"));
                    return "dataPlaceholder";
            }
        }
        static showCellTooltip(mouseEvent, text) {
            var div = mouseEvent.currentTarget;
            // Only show the tooltip if the text exceeds the width of the container (and therefore contains an ellipsis)
            if (div.offsetWidth < div.scrollWidth) {
                var config = {
                    content: text
                };
                Plugin.Tooltip.show(config);
            }
        }
        createDiv(value, ...classNames) {
            var div = document.createElement("div");
            if (PerfTools.TokenExtractor.isHtmlExpression(value)) {
                EventsTimelineListControl_1.EventDataTemplate.addTokens(value, div, EventsTimelineListControl_1.TextFormat.Html);
            }
            else if (PerfTools.TokenExtractor.isStringExpression(value)) {
                EventsTimelineListControl_1.EventDataTemplate.addTokens(value, div, EventsTimelineListControl_1.TextFormat.String);
            }
            else {
                div.textContent = value;
            }
            if (classNames) {
                for (var index = 0; index < classNames.length; index++) {
                    div.classList.add(classNames[index]);
                }
            }
            return div;
        }
        displayCommonFields() {
            var durationLabelExc = this.findElement("durationLabelExc");
            var durationValueExc = this.findElement("durationValueExc");
            var durationIncRow = this.findElement("durationIncRow");
            var durationLabelInc = this.findElement("durationLabelInc");
            var durationValueInc = this.findElement("durationValueInc");
            var startTimeLabel = this.findElement("startTimeLabel");
            var startTimeValue = this.findElement("startTimeValue");
            var threadContextRow = this.findElement("threadContextRow");
            var threadContextLabel = this.findElement("threadContextLabel");
            var threadContextValue = this.findElement("threadContextValue");
            var description = this.findElement("eventDetailsDescription");
            durationIncRow.classList.remove("BPT-hidden");
            durationLabelExc.textContent = Plugin.Resources.getString("DurationLabelExclusive", "");
            durationValueExc.textContent = FormattingHelpers_5.FormattingHelpers.getPrettyPrintTime(this._event.exclusiveDuration);
            durationLabelInc.textContent = Plugin.Resources.getString("DurationLabelInclusive", "");
            durationValueInc.textContent = FormattingHelpers_5.FormattingHelpers.getPrettyPrintTime(this._event.timeSpan.elapsed);
            startTimeLabel.textContent = Plugin.Resources.getString("StartTimeLabel", "");
            startTimeValue.textContent = FormattingHelpers_5.FormattingHelpers.getPrettyPrintTime(this._event.timeSpan.begin);
            var threadContext = this.getThreadContext();
            if (threadContext !== "0") {
                threadContextRow.classList.remove("BPT-hidden");
                threadContextLabel.textContent = Plugin.Resources.getString("ThreadContextLabel", "");
                threadContextValue.textContent = threadContext;
            }
            description.classList.remove("BPT-hidden");
            description.textContent = this._event.getDescription();
        }
        displayImagePreview() {
            if (!this._event.supportsImagePreview) {
                return;
            }
            var url = this._event.getPreviewImagePath();
            if (url) {
                var img = this.findElement("imagePreview");
                img.onload = (e) => {
                    if (img.width > 1 && img.height > 1) {
                        var div = this.findElement("imagePreviewHeader");
                        div.textContent = Plugin.Resources.getString("ImagePreviewHeader", img.width, img.height);
                        this._imagePreviewSeparator.classList.remove("BPT-hidden");
                        this._imagePreviewContainer.classList.remove("BPT-hidden");
                    }
                };
                if (ImageUrlValidationHelpers_1.ImageUrlValidationHelpers.MS_APP_IMG_REGEX.test(url)) {
                    Plugin.Host.getDocumentLocation(url).then((imgPath) => {
                        img.src = imgPath;
                    });
                }
                else {
                    img.src = url;
                }
            }
        }
        displayInclusiveTimeSummary(isEventSelected) {
            var donutContainer = this.findElement("inclusiveTimeBreakDownDetails");
            if ((isEventSelected && this._aggregatedDescendants.length <= 1) ||
                (!isEventSelected && this._aggregatedDescendants.length === 0)) {
                return;
            }
            if (typeof this._donutChartViewModel === "undefined") {
                this._donutChartViewModel = new DonutChartView_1.DonutChartViewModel(donutContainer);
                this._donutChartViewModel.view.addSectorAriaLabel = (sector, percent) => {
                    var timeStamp = FormattingHelpers_5.FormattingHelpers.getPronounceableTime(new TimeSpan_7.TimeStamp(sector.value));
                    return Plugin.Resources.getString("DonutSectorAriaLabel", sector.name, percent, timeStamp);
                };
            }
            if (this._event) {
                this._donutChartViewModel.model.headerText = Plugin.Resources.getString("InclusiveTimeDetailsHeader");
            }
            else {
                this._donutChartViewModel.model.headerText = Plugin.Resources.getString("UIThreadSummaryHeader");
            }
            var sectors = this.createSectors(this._aggregatedDescendants);
            sectors.forEach((sector) => {
                this._donutChartViewModel.model.addSector(sector);
            });
            var sectorCount = this._donutChartViewModel.model.sectors.length;
            if ((isEventSelected && sectorCount > 1) || (!isEventSelected && sectorCount > 0)) {
                donutContainer.classList.remove("BPT-hidden");
                // If no event is selected, don't show the separator (there is no event description so the separator above it is already doing the job)
                if (isEventSelected) {
                    var inclusiveSeparator = this.findElement("inclusiveTimeDetailSeparator");
                    inclusiveSeparator.classList.remove("BPT-hidden");
                }
                this._donutChartViewModel.view.render();
            }
        }
        createSectors(eventDatas) {
            var eventFactory = new EventFactory();
            var sectors = [];
            for (var i = 0; i < eventDatas.length; i++) {
                var eventData = eventDatas[i];
                var interval = {
                    begin: { h: 0, l: 0 },
                    beginThreadId: 0,
                    category: eventData.category,
                    childrenCount: 0,
                    end: { h: 0, l: 0 },
                    endThreadId: 0,
                    exclusiveDuration: 0,
                    fullName: undefined,
                    id: -1,
                    isExpanded: false,
                    hasChildren: false,
                    level: -1,
                    name: eventData.name
                };
                var event = eventFactory.createEvent(interval, 0);
                sectors.push({ name: event.name, cssClass: EventDetailsView.getCssClass(eventData.category), value: eventData.value });
            }
            return this.groupEventTypes(sectors);
        }
        initializeEventGroup() {
            this._eventGroupsMap = {};
        }
        groupEventTypes(sectors) {
            var group;
            // groupMap is mapping of the groupEventName to the value i.e. sector information.
            var groupMap = {};
            // Iterate over the sectors and find the group name from the eventGroupsMap
            for (var i = 0; i < sectors.length; i++) {
                var sector = sectors[i];
                var groupEventName = this._eventGroupsMap[sector.name];
                if (typeof groupEventName !== "undefined") {
                    group = groupMap[groupEventName];
                    if (typeof group === "undefined") {
                        // Add the map entry to groupMap if one not already present in the groupMap
                        groupMap[groupEventName] = sector;
                        groupMap[groupEventName].name = groupEventName;
                    }
                    else {
                        if (sector.name === groupEventName) {
                            // If groupMap contains an entry check if the new entry is same as the groupEventName
                            // If yes replace the entry with the new sector and add the value to merge the two sectors
                            groupMap[groupEventName] = sector;
                            sector.value += group.value;
                        }
                        else {
                            // If the new entry is not same as the group event name just add value to merge the two sectors.
                            group.value += sector.value;
                        }
                    }
                }
                else {
                    groupMap[sector.name] = sector;
                }
            }
            // Get the values from the groupMap. These will be the new merged sectors array.
            var groupedSectors = [];
            for (var key in groupMap) {
                groupedSectors.push(groupMap[key]);
            }
            return groupedSectors;
        }
        displayEventSpecificFields() {
            if (!this._details) {
                return;
            }
            var additionalDetailsContainer = this.findElement("additionalDetails");
            for (var i = 0; i < this._details.length; i++) {
                var detail = this._details[i];
                // <DOM> is a default source script that the Datawarehouse returns whenever it cannot resolve the document. In this case we don't want to add a source link
                // as it won't navigate anywhere. This string needs to be kept in sync w/ edev\DiagnosticsHub\sources\Core\DataWarehouse\ActiveScriptSymbols.cpp.
                if (detail.sourceInfo && detail.sourceInfo.source === "<DOM>") {
                    continue;
                }
                var nameDiv = this.createDiv(detail.localizedName + ":", "eventCell", "name");
                var valueDiv = this.createDiv(detail.localizedValue, "eventCell", "value");
                if (detail.sourceInfo) {
                    valueDiv.className += " BPT-FileLink";
                    valueDiv.setAttribute("role", "link");
                    EventsTimelineListControl_1.EventDataTemplate.setViewSourceHandler(valueDiv, detail.sourceInfo, true /*keyboardNavigable*/);
                }
                var additionalDetailsLabelValuePair = this.createDiv("", "eventRow");
                additionalDetailsLabelValuePair.appendChild(nameDiv);
                additionalDetailsLabelValuePair.appendChild(valueDiv);
                additionalDetailsContainer.appendChild(additionalDetailsLabelValuePair);
            }
        }
        displaySelectionSummaryFields(duration, start) {
            var durationLabelExc = this.findElement("durationLabelExc");
            var durationValueExc = this.findElement("durationValueExc");
            var startTimeLabel = this.findElement("startTimeLabel");
            var startTimeValue = this.findElement("startTimeValue");
            durationLabelExc.textContent = Plugin.Resources.getString("SelectionDurationLabel", "");
            durationValueExc.textContent = FormattingHelpers_5.FormattingHelpers.getPrettyPrintTime(duration);
            startTimeLabel.textContent = Plugin.Resources.getString("StartTimeLabel", "");
            startTimeValue.textContent = FormattingHelpers_5.FormattingHelpers.getPrettyPrintTime(start);
        }
        getThreadContext() {
            var threadId = this._event.contextThreadId;
            if (threadId !== null) {
                return threadId.toString();
            }
            return Plugin.Resources.getString("UIThreadContext");
        }
    }
    exports.EventDetailsView = EventDetailsView;
    class EventsTimelineView extends Common.TemplateControl {
        constructor(parentContainerId) {
            super("timelineViewTemplate");
            this._timeSpanPadding = 0.2;
            this._parentContainer = document.getElementById(parentContainerId);
            if (!this._parentContainer) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1034"));
            }
            this._eventDetailsHeaderClass = "emptyHeader";
            this._eventDetailsTitle = this.findElement("eventDetailsTitle");
            this._timelineDetailsHeaderIndicator = this.findElement("eventDetailsIndicator");
            this._timelineDetailsPaneContainer = this.findElement("timelineDetailsPaneContainer");
            this._timelineViewAndDetailsContainer = this.findElement("timelineViewAndDetails");
            this._timelineLabel = this.findElement("timelineLabel");
            this._timelineView = this.findElement("timelineView");
            this._progressDiv = this.findElement("dataProcessingProgressDiv");
            this._timelineLabel.textContent = Plugin.Resources.getString("TimelineLabel");
            var sortFilterSection = this.findElement("sortFilterSection");
            this._filteringBar = new Common.Framework.TemplateControl("VisualProfiler.filteringBarTemplate");
            sortFilterSection.appendChild(this._filteringBar.rootElement);
            this._listControl = new EventsTimelineListControl_1.EventsTimelineListControl(this._timelineView);
            this._listControl.dataColumnWidthChanged = this.onListControlDataColumnWidthChanged.bind(this);
            this._parentContainer.appendChild(this.rootElement);
            this._onResizeHandler = () => {
                this._columnsCssRule = this.getColumnsCssRule();
                this._listControl.invalidateSizeCache();
                this.updateDetailsDivider();
                this.render();
            };
            this.registerResizeEvent();
            this._eventHeaderDivider = this.findElement("timelineEventHeaderDivider");
            this._eventHeaderDivider.style.left = this._listControl.eventNameColumnWidth + "px";
            this._eventHeaderLabel = this.findElement("timelineEventHeaderLabel");
            this._eventHeaderLabel.textContent = Plugin.Resources.getString("EventHeaderLabel");
            this._eventHeaderLabel.style.width = this._listControl.eventNameColumnWidth + "px";
            // Add the ruler
            this._rulerContainer = this.findElement("timelineRuler");
            this._columnsCssRule = this.getColumnsCssRule();
            this._eventDetailsDivider = new Divider_2.Divider(this._timelineViewAndDetailsContainer, 0);
            this._eventDetailsDivider.onMoved = this.onResizeDetails.bind(this);
            this.createFilteringMenu();
            this.createViewSettingsMenu();
            this.updateTabIndex();
        }
        get detailsView() {
            return this._detailsView;
        }
        get listControl() {
            return this._listControl;
        }
        get viewModel() {
            return this._viewModel;
        }
        set viewModel(value) {
            this.unregisterViewModelEvents();
            this._listControl.setDataSource(null);
            this._viewModel = value;
            this._filteringBar.model = this._viewModel;
            this._filteringMenu.model = this._viewModel;
            this._viewSettingsMenu.model = this._viewModel;
            this.createRuler();
            // Show an empty details pane if there is no selection
            this.updateDetailsPane(/*event=*/ null);
            this.updateDetailsDivider();
            this.registerViewModelEvents();
        }
        static getCssRule(styleSheetName, selectorName) {
            if (!EventsTimelineView.sheets.has(styleSheetName)) {
                const sheet = document.createElement("style");
                document.head.appendChild(sheet);
                this.sheets.set(styleSheetName, sheet.sheet);
                let content = "";
                if (styleSheetName === "VisualProfiler.css") {
                    content = `
                    grid-template-columns: 185px 3px 1fr;
                    grid-template-rows: 1fr;
                    display: grid;
                `;
                }
                else if (styleSheetName === "css") {
                    content = `
                    grid-column: span 2;
                    grid-template-columns: 1fr 3px 250px;
                    grid-row: 3;
                    grid-template-rows: auto 1fr;
                    border-top: 1px solid grey; /*[1px solid {plugin-responsiveness-graph-border}]*/
                    display: grid;
                    height: 100%;
                    position: relative;
                    width: 100%;
                `;
                }
                const style = `${selectorName} { ${content} }`;
                sheet.sheet.insertRule(style);
            }
            const styleSheet = EventsTimelineView.sheets.get(styleSheetName);
            return styleSheet.rules[0];
        }
        render() {
            //Cancelling past render request
            if (this._renderPromise) {
                // TODO: Implement promise cancellation.
                // this._renderPromise.cancel();
                // this._renderPromise = null;
                this.toggleProcessingUI(false);
            }
            if (this._viewModel) {
                this.toggleProcessingUI(true);
                this.unregisterResizeEvent();
                this._renderPromise = this._viewModel.getEvents()
                    .then((dataSource) => {
                    return this._listControl.setDataSource(dataSource);
                }, (err) => {
                    this._renderPromise = null;
                    this.registerResizeEvent();
                    this.raiseRenderFinished();
                    this.toggleProcessingUI(false);
                    throw err;
                })
                    .then(() => {
                    // Extend the timeSpan to act as padding so the text to the right of the event bars are always visible.
                    var timeSpan = new TimeSpan_7.TimeSpan(this._viewModel.timeSpan.begin, new TimeSpan_7.TimeStamp(this._viewModel.timeSpan.end.nsec + this._viewModel.timeSpan.elapsed.nsec * this._timeSpanPadding));
                    // Render list control
                    this._listControl.timeSpan = timeSpan;
                    this._listControl.viewModel = this._viewModel;
                    this._listControl.rulerScale = this._rulerScale;
                    // Render ruler
                    this.setRulerRect();
                    this._rulerScale.onViewportChanged({
                        currentTimespan: timeSpan.toJsonTimespan(),
                        selectionTimespan: null,
                        isIntermittent: false
                    });
                    // This must be called after this.setRulerRect() because the ruler's width is affected by this.listControl.render(...).
                    // Also, the ruler height, which affects vertical ruler line placement, is set by this.setRulerRect().
                    this._listControl.renderVerticalRulerLines();
                    if (!this._listControl.selectedItem) {
                        this.updateDetailsPane(/*event=*/ null);
                    }
                    this._listControl.selectedItemChanged = this.onSelectedEventChanged.bind(this);
                    return this._listControl.render();
                })
                    .then(() => {
                    this._renderPromise = null;
                    this.registerResizeEvent();
                    this.raiseRenderFinished();
                    this.toggleProcessingUI(false);
                }, (err) => {
                    this._renderPromise = null;
                    this.registerResizeEvent();
                    this.raiseRenderFinished();
                    this.toggleProcessingUI(false);
                    throw err;
                });
                return this._renderPromise;
            }
            else {
                return Common.PromiseHelper.getPromiseSuccess();
            }
        }
        raiseRenderFinished() {
            if (this.onRenderFinished) {
                this.onRenderFinished();
            }
        }
        toggleProcessingUI(showProgress) {
            clearTimeout(this._progressUIDelayHandler);
            if (showProgress) {
                // Delay the display of the progress UI in case the operation finishes quickly.
                this._progressUIDelayHandler = setTimeout(() => {
                    this._progressDiv.style.display = "block";
                }, 350);
            }
            else {
                this._progressDiv.style.display = "none";
            }
        }
        static showTooltip(resourceId) {
            var config = {
                content: Plugin.Resources.getString(resourceId)
            };
            Plugin.Tooltip.show(config);
        }
        createFilteringMenu() {
            var filteringMenuButton = this._filteringBar.getNamedControl("filteringMenuButton");
            filteringMenuButton.rootElement.setAttribute("tabindex", "0");
            this._filteringMenu = new Common.Controls.MenuControl();
            this._filteringMenu.rootElement.setAttribute("aria-label", Plugin.Resources.getString("FilteringMenuButtonTooltipText"));
            this._filteringMenu.menuItemsTemplateId = "VisualProfiler.filteringMenuDropDown";
            this._filteringMenu.targetButtonElement = filteringMenuButton.rootElement;
            this._filteringMenu.dismissOnMenuItemClick = true;
            this._filteringMenu.dismissOnTargetButtonClick = true;
            this.rootElement.appendChild(this._filteringMenu.rootElement);
        }
        createViewSettingsMenu() {
            var viewSettingsMenuButton = this._filteringBar.getNamedControl("viewSettingsMenuButton");
            viewSettingsMenuButton.rootElement.setAttribute("tabindex", "0");
            this._viewSettingsMenu = new Common.Controls.MenuControl();
            this._viewSettingsMenu.rootElement.setAttribute("aria-label", Plugin.Resources.getString("ViewSettingsMenuButtonTooltipText"));
            this._viewSettingsMenu.menuItemsTemplateId = "VisualProfiler.viewSettingsMenuDropDown";
            this._viewSettingsMenu.targetButtonElement = viewSettingsMenuButton.rootElement;
            this._viewSettingsMenu.dismissOnMenuItemClick = true;
            this._viewSettingsMenu.dismissOnTargetButtonClick = true;
            this.rootElement.appendChild(this._viewSettingsMenu.rootElement);
        }
        updateTabIndex() {
            var sortByComboBox = this._filteringBar.getNamedControl("timelineSortSelector");
            sortByComboBox.rootElement.setAttribute("tabindex", "0");
            var frameGroupingButton = this._filteringBar.getNamedControl("frameGroupingButton");
            frameGroupingButton.rootElement.setAttribute("tabindex", "0");
        }
        createRuler() {
            if (this._gettingMarksPromise) {
                // TODO: Implement promise cancellation.
                // this._gettingMarksPromise.cancel();
                // this._gettingMarksPromise = null;
            }
            var lifecycleData = [];
            var userMarkData = [];
            if (this._rulerScale) {
                this._rulerContainer.removeChild(this._rulerScale.container);
                this._rulerScale.dispose();
            }
            // Setup a ruler without data as a starting point
            this._rulerScale = new diagnosticsHub_swimlanes_2.RulerScale(
            /*timeRange*/ this._viewModel.timeSpan.toJsonTimespan());
            var lifecycleMarksPromise = this._viewModel.getMarks(0).then((lifecycleMarks) => {
                lifecycleData = lifecycleMarks;
            });
            var userMarksPromise = this._viewModel.getMarks(1).then((userMarks) => {
                userMarkData = userMarks;
            });
            this._gettingMarksPromise = Promise.all([lifecycleMarksPromise, userMarksPromise]).then(() => {
                this._rulerScale.dispose();
                // Extend the timeSpan to act as padding so the text to the right of the event bars are always visible.
                var timeSpan = new TimeSpan_7.TimeSpan(this._viewModel.timeSpan.begin, new TimeSpan_7.TimeStamp(this._viewModel.timeSpan.end.nsec + this._viewModel.timeSpan.elapsed.nsec * this._timeSpanPadding));
                this._rulerScale = new diagnosticsHub_swimlanes_2.RulerScale(
                /*timeRange*/ timeSpan.toJsonTimespan(), 
                /*markSeries*/ [
                    { index: 0, id: diagnosticsHub_swimlanes_2.MarkType.UserMark, label: Plugin.Resources.getString("RulerUserMarkLabel"), data: userMarkData },
                    { index: 1, id: diagnosticsHub_swimlanes_2.MarkType.LifeCycleEvent, label: Plugin.Resources.getString("RulerLifecycleMarkLabel"), data: lifecycleData }
                ], 
                /*imageTokenList*/ ["vs-image-graph-app-event", "vs-image-graph-user-mark"], 
                /*aggregatedMarkImageToken*/ "vs-image-graph-aggregated-event");
                this._rulerContainer.appendChild(this._rulerScale.container);
            });
            this._gettingMarksPromise.then(() => {
                this._gettingMarksPromise = null;
            });
        }
        getColumnsCssRule() {
            return EventsTimelineView.getCssRule("css", ".mainView .dataViewContainer .detailedViewsContainer .timelineViewContainer .timelineViewGroup .timelineViewAndDetails");
        }
        onResizeDetails(offsetX) {
            this.updateColumnWidth(offsetX);
            Program_main_2.Program.triggerResize();
        }
        onSelectedEventChanged(event) {
            return this._viewModel.setSelectedEvent(event);
        }
        onListControlDataColumnWidthChanged() {
            this._eventHeaderDivider.style.left = this._listControl.eventNameColumnWidth + "px";
            this._eventHeaderLabel.style.width = this._listControl.eventNameColumnWidth + "px";
            this.setRulerRect();
        }
        onSortChanged() {
            this.render().then(() => {
                PerfTools.Notifications.notify(responsivenessNotifications_3.ResponsivenessNotifications.SortFinishedOnGrid);
            });
        }
        onTimeSpanChanged() {
            this.render().then(() => {
                PerfTools.Notifications.notify(responsivenessNotifications_3.ResponsivenessNotifications.GridUpdatedForTimeSelection);
            });
        }
        onToggleFilter() {
            this.render().then(() => {
            });
        }
        onEventNameFilterChange() {
            clearTimeout(this._eventNameFilterResponseTimeoutHandle);
            this._eventNameFilterResponseTimeoutHandle = setTimeout(() => {
                this.render().then(() => {
                });
            }, 200); // 60 WPM @ 5 letters per word
        }
        onViewSettingsChange() {
            this._listControl.keepCurrentScrollPositionWhenDataSourceChanges = true;
            this.render()
                .then(() => {
                this._listControl.keepCurrentScrollPositionWhenDataSourceChanges = false;
            }, (err) => {
                this._listControl.keepCurrentScrollPositionWhenDataSourceChanges = false;
                throw err;
            })
                .then(() => {
            });
        }
        onViewModelPropertyChanged(propName) {
            switch (propName) {
                case EventsTimelineViewModel.ShowDurationSelfInTimelinePropertyName:
                    {
                        this.onViewSettingsChange();
                        Program_main_2.Program.reportTelemetry("ViewModelPropertyChange", { "Property.Name": "ShowDurationSelfInTimeline", "Property.Value": this._viewModel.showDurationSelfInTimeline });
                        break;
                    }
                case EventsTimelineViewModel.ShowHintTextInTimelinePropertyName:
                    {
                        this.onViewSettingsChange();
                        Program_main_2.Program.reportTelemetry("ViewModelPropertyChange", { "Property.Name": "ShowHintTextInTimeline", "Property.Value": this._viewModel.showHintTextInTimeline });
                        break;
                    }
                case EventsTimelineViewModel.ShowQualifiersInEventNamesPropertyName:
                    {
                        this.onViewSettingsChange();
                        Program_main_2.Program.reportTelemetry("ViewModelPropertyChange", { "Property.Name": "ShowQualifiersInEventNames", "Property.Value": this._viewModel.showQualifiersInEventNames });
                        break;
                    }
                case EventsTimelineViewModel.ShowThreadIndicatorPropertyName:
                    {
                        this.onViewSettingsChange();
                        Program_main_2.Program.reportTelemetry("ViewModelPropertyChange", { "Property.Name": "ShowThreadIndicator", "Property.Value": this._viewModel.showThreadIndicator });
                        break;
                    }
                case EventsTimelineViewModel.DisplayBackgroundActivitiesPropertyName:
                    {
                        this.onToggleFilter();
                        Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "DisplayBackgroundActivities", "Filter.Value": this._viewModel.displayBackgroundActivities });
                        break;
                    }
                case EventsTimelineViewModel.DisplayFramesPropertyName:
                    {
                        this.onToggleFilter();
                        Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "DisplayFrames", "Filter.Value": this._viewModel.displayFrames });
                        break;
                    }
                case EventsTimelineViewModel.DisplayScenariosPropertyName:
                    {
                        this.onToggleFilter();
                        Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "DisplayScenarios", "Filter.Value": this._viewModel.displayScenarios });
                        break;
                    }
                case EventsTimelineViewModel.DisplayIOActivitiesPropertyName:
                    {
                        this.onToggleFilter();
                        Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "DisplayIOActivities", "Filter.Value": this._viewModel.displayIOActivities });
                        break;
                    }
                case EventsTimelineViewModel.DisplayUIActivitiesPropertyName:
                    {
                        this.onToggleFilter();
                        Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "DisplayUIActivities", "Filter.Value": this._viewModel.displayUIActivities });
                        break;
                    }
                case EventsTimelineViewModel.DurationFilterPropertyName:
                    {
                        this.onToggleFilter();
                        Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "DurationFilter", "Filter.Value": this._viewModel.durationFilter });
                        break;
                    }
                case EventsTimelineViewModel.EventNameFilterPropertyName:
                    {
                        this.onEventNameFilterChange();
                        var filterUsed = false;
                        if (this._viewModel.eventNameFilter) {
                            filterUsed = true;
                        }
                        Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "EventNameFilter", "Filter.Value": filterUsed });
                        break;
                    }
                case EventsTimelineViewModel.EventTypeFilterPropertyName:
                    {
                        this.onToggleFilter();
                        Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "EventTypeFilter", "Filter.Value": this._viewModel.eventTypeFilter });
                        break;
                    }
                case EventsTimelineViewModel.SortPropertyName:
                    {
                        this.onSortChanged();
                        if (this._viewModel.sort === 0) {
                            Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "Sort", "Filter.Value": "Start time" });
                        }
                        else if (this._viewModel.sort === 1) {
                            Program_main_2.Program.reportTelemetry("FilterChange", { "Filter.Name": "Sort", "Filter.Value": "Duration (Total)" });
                        }
                        break;
                    }
                default:
                    // Consider adding a telemetry for the current filter
                    break;
            }
        }
        onViewModelSelectionChanged(event) {
            if (this._viewModelSelectionChangedPromise) {
                // TODO: Implement promise cancellation.
                // this._viewModelSelectionChangedPromise.cancel();
            }
            this._viewModelSelectionChangedPromise = this._listControl.setSelectedItem(event)
                .then(() => {
                this.updateDetailsPane(event);
                this._viewModelSelectionChangedPromise = null;
            });
            return this._viewModelSelectionChangedPromise;
        }
        registerResizeEvent() {
            Program_main_2.Program.addEventListener(Program_2.ProgramEvents.Resize, this._onResizeHandler);
        }
        registerViewModelEvents() {
            if (this._viewModel) {
                this._viewModelPropertyChangeEvtReg = this._viewModel.propertyChanged.addHandler(this.onViewModelPropertyChanged.bind(this));
                this._viewModel.timeSpanChanged = this.onTimeSpanChanged.bind(this);
                this._viewModel.selectedEventChanged = this.onViewModelSelectionChanged.bind(this);
            }
        }
        setDetailsDividerBounds() {
            var containerWidth = this._timelineViewAndDetailsContainer.offsetWidth;
            this._eventDetailsDivider.minX = containerWidth / 2;
            this._eventDetailsDivider.maxX = containerWidth;
        }
        setRulerRect() {
            var rulerMarginLeft = this._listControl.dataColumnLeft + "px";
            var rulerWidth = this._listControl.dataColumnWidth + "px";
            if (this._rulerContainer.style.marginLeft !== rulerMarginLeft ||
                this._rulerContainer.style.width !== rulerWidth) {
                this._rulerContainer.style.marginLeft = rulerMarginLeft;
                this._rulerContainer.style.width = rulerWidth;
                if (this._rulerScale) {
                    this._rulerScale.resize(null);
                }
            }
        }
        updateDetailsPane(event) {
            var currentDataSource = this._listControl.dataSource;
            if (!currentDataSource) {
                return;
            }
            this._timelineDetailsHeaderIndicator.classList.remove(this._eventDetailsHeaderClass);
            var sectorDataPromise;
            var timeSpan;
            var details; // This will be a promise
            if (event === null) {
                if (currentDataSource) {
                    this._eventDetailsTitle.textContent = "";
                    this._eventDetailsHeaderClass = "emptyHeader";
                    sectorDataPromise = this._viewModel.getUIThreadSummary(this._viewModel.timeSpan);
                    details = null;
                    timeSpan = currentDataSource.timeSpan;
                }
            }
            else {
                this._eventDetailsTitle.textContent = event.title;
                this._eventDetailsHeaderClass = event.getCssClass();
                details = this._viewModel.getEventDetails(event);
                sectorDataPromise = currentDataSource.getAggregatedDescendantsForEvent(event.id);
            }
            sectorDataPromise
                .then((sectorData) => {
                this._detailsView = new EventDetailsView(event, details, sectorData, timeSpan);
                this._timelineDetailsHeaderIndicator.classList.add(this._eventDetailsHeaderClass);
                this._timelineDetailsPaneContainer.innerHTML = "";
                this._timelineDetailsPaneContainer.appendChild(this._detailsView.rootElement);
                PerfTools.Notifications.notify(responsivenessNotifications_3.ResponsivenessNotifications.DetailsPaneLoaded);
            });
        }
        updateColumnWidth(offsetX) {
            if (offsetX === null || typeof offsetX === "undefined") {
                offsetX = this._eventDetailsDivider.offsetX;
            }
            var columns = this._columnsCssRule.style.gridTemplateColumns.split(" ");
            columns[2] = (this._timelineViewAndDetailsContainer.clientWidth - offsetX) + "px";
            this._columnsCssRule.style.gridTemplateColumns = columns.join(" ");
        }
        updateDetailsDivider() {
            this.setDetailsDividerBounds();
            this._eventDetailsDivider.offsetX = this._timelineView.offsetWidth;
            // The +3 is the width of the divider
            this.updateColumnWidth(this._eventDetailsDivider.offsetX + 3);
        }
        unregisterResizeEvent() {
            Program_main_2.Program.removeEventListener(Program_2.ProgramEvents.Resize, this._onResizeHandler);
        }
        unregisterViewModelEvents() {
            if (this._viewModel) {
                this._viewModel.timeSpanChanged = null;
                this._viewModel.selectedEventChanged = null;
            }
            if (this._viewModelPropertyChangeEvtReg) {
                this._viewModelPropertyChangeEvtReg.unregister();
            }
        }
    }
    exports.EventsTimelineView = EventsTimelineView;
    EventsTimelineView.sheets = new Map();
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/hubGraphs/DataUtilities", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataUtilities = void 0;
    /* A helper class to get graph data from the analyzer.
     */
    class DataUtilities {
        static getFilteredResult(dataWarehouse, analyzerId, counterId, timespan, customData) {
            var contextData = {
                timeDomain: timespan,
                customDomain: {
                    CounterId: counterId
                }
            };
            if (customData) {
                for (var key in customData) {
                    if (customData.hasOwnProperty(key)) {
                        contextData.customDomain[key] = customData[key];
                    }
                }
            }
            return dataWarehouse.getFilteredData(contextData, analyzerId);
        }
    }
    exports.DataUtilities = DataUtilities;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/AnalyzerDataSession", ["require", "exports", "plugin-vs-v2", "diagnosticsHub", "Bpt.Diagnostics.Common", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/hubGraphs/DataUtilities", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimestampConvertor"], function (require, exports, Plugin, DiagnosticsHub, Common, DataUtilities_1, TimestampConvertor_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventIntevalsQueryResult = exports.TreeViewQueryResultTaskType = exports.AnalyzerDataSession = exports.AppResponsivenessAnalyzerTasks = void 0;
    var AppResponsivenessAnalyzerTasks;
    (function (AppResponsivenessAnalyzerTasks) {
        AppResponsivenessAnalyzerTasks[AppResponsivenessAnalyzerTasks["GetUIThreadActivityData"] = 1] = "GetUIThreadActivityData";
        AppResponsivenessAnalyzerTasks[AppResponsivenessAnalyzerTasks["GetFrameRateData"] = 2] = "GetFrameRateData";
        AppResponsivenessAnalyzerTasks[AppResponsivenessAnalyzerTasks["GetXAMLParsingDataProvider"] = 3] = "GetXAMLParsingDataProvider";
        AppResponsivenessAnalyzerTasks[AppResponsivenessAnalyzerTasks["GetHotElementsDataProvider"] = 4] = "GetHotElementsDataProvider";
        AppResponsivenessAnalyzerTasks[AppResponsivenessAnalyzerTasks["GetSessionDuration"] = 5] = "GetSessionDuration";
        AppResponsivenessAnalyzerTasks[AppResponsivenessAnalyzerTasks["GetAppIntervals"] = 6] = "GetAppIntervals";
        AppResponsivenessAnalyzerTasks[AppResponsivenessAnalyzerTasks["GetThreadInfo"] = 7] = "GetThreadInfo";
        AppResponsivenessAnalyzerTasks[AppResponsivenessAnalyzerTasks["GetTelemetryStats"] = 8] = "GetTelemetryStats";
    })(AppResponsivenessAnalyzerTasks = exports.AppResponsivenessAnalyzerTasks || (exports.AppResponsivenessAnalyzerTasks = {}));
    class AnalyzerDataSession {
        constructor(dataWarehouse) {
            this._dataWarehouse = dataWarehouse;
            this._threadId = 0;
        }
        initialize() {
            return this._dataWarehouse.getContextService().getGlobalContext()
                .then((context) => {
                // Get the duration
                return context.getTimeDomain();
            }).then((timespan) => {
                this._totalDuration = {
                    begin: parseInt(timespan.begin.value),
                    end: parseInt(timespan.end.value)
                };
                // Get the UIThread Id
                return this.getThreadInfo()
                    .then((result) => {
                    this._threadId = result.uiThreadId;
                });
            });
        }
        closeAsync() {
            return this._dataWarehouse.close();
        }
        getTotalDuration() {
            return this._totalDuration;
        }
        queryAppIntervals(timeRange, filter) {
            if (this._dataWarehouse) {
                var jsonTimeRange = new DiagnosticsHub.JsonTimespan(TimestampConvertor_2.TimestampConvertor.timestampToJson(timeRange.begin), TimestampConvertor_2.TimestampConvertor.timestampToJson(timeRange.end));
                var customData = {
                    task: AppResponsivenessAnalyzerTasks.GetAppIntervals.toString(),
                    filters: JSON.stringify(filter)
                };
                var contextData = {
                    customDomain: customData,
                    timeDomain: jsonTimeRange
                };
                return this._dataWarehouse.getFilteredData(contextData, AnalyzerDataSession.TIMELINE_ANALYZER_CLASSID)
                    .then((result) => {
                    var queryResult = new EventIntevalsQueryResult(result);
                    return queryResult;
                }, (error) => {
                    throw error;
                });
            }
            return Common.PromiseHelper.getPromiseError(null);
        }
        // fromTime: The start time in nano-seconds
        // toTime: The end time in nano-seconds
        // Returns frame rate data that belong to the range [fromTime, toTime] inclusive.
        queryFrameRate(fromTime, toTime) {
            var duration = new DiagnosticsHub.JsonTimespan(DiagnosticsHub.BigNumber.convertFromNumber(fromTime), DiagnosticsHub.BigNumber.convertFromNumber(toTime));
            return DataUtilities_1.DataUtilities.getFilteredResult(this._dataWarehouse, AnalyzerDataSession.TIMELINE_ANALYZER_CLASSID, AnalyzerDataSession.FRAME_RATE_COUNTERID, duration).then((data) => {
                var frameRate;
                if (data && data.p) {
                    frameRate = data.p.map((fpsPoint) => {
                        var time = new DiagnosticsHub.BigNumber(fpsPoint.t.h, fpsPoint.t.l);
                        return {
                            fps: fpsPoint.v,
                            time: parseInt(time.value)
                        };
                    });
                }
                return frameRate;
            });
        }
        // fromTime: The start time in nano-seconds
        // toTime: The end time in nano-seconds
        // category: The category of the requested data (0: App life-cycle marks, 1: User marks)
        // Returns the app life-cycle or user provided marks that belong to the range [fromTime, toTime] inclusive.
        queryMarkEvents(fromTime, toTime, category) {
            var duration = new DiagnosticsHub.JsonTimespan(DiagnosticsHub.BigNumber.convertFromNumber(fromTime), DiagnosticsHub.BigNumber.convertFromNumber(toTime));
            var counterId;
            if (category === 0) {
                counterId = AnalyzerDataSession.LIFE_CYCLE_MARKS_COUNTERID;
            }
            else {
                counterId = AnalyzerDataSession.USER_MARKS_COUNTERID;
            }
            return DataUtilities_1.DataUtilities.getFilteredResult(this._dataWarehouse, AnalyzerDataSession.MARKERS_ANALYZER_CLASSID, counterId, duration).then((graphResult) => {
                var markResult;
                if (graphResult && graphResult.p) {
                    markResult = [];
                    for (var i = 0; i < graphResult.p.length; i++) {
                        var graphPoint = graphResult.p[i];
                        markResult.push({
                            time: new DiagnosticsHub.BigNumber(graphPoint.t.h, graphPoint.t.l),
                            tooltip: graphPoint.tt
                        });
                    }
                }
                return markResult;
            });
        }
        getThreadInfo() {
            if (this._dataWarehouse) {
                var customData = {
                    task: AppResponsivenessAnalyzerTasks.GetThreadInfo.toString()
                };
                var contextData = {
                    customDomain: customData
                };
                return this._dataWarehouse.getFilteredData(contextData, AnalyzerDataSession.TIMELINE_ANALYZER_CLASSID)
                    .then((threadInfo) => {
                    return threadInfo;
                }, (error) => {
                    throw error;
                });
            }
            return Common.PromiseHelper.getPromiseError(null);
        }
        getTelemetryStats() {
            if (this._dataWarehouse) {
                var customData = {
                    task: AppResponsivenessAnalyzerTasks.GetTelemetryStats.toString()
                };
                var contextData = {
                    customDomain: customData
                };
                return this._dataWarehouse.getFilteredData(contextData, AnalyzerDataSession.TIMELINE_ANALYZER_CLASSID)
                    .then((telemetryStats) => {
                    return telemetryStats;
                }, (error) => {
                    throw error;
                });
            }
            return Common.PromiseHelper.getPromiseError(null);
        }
        // Returns the UI thread ID
        getUIThreadId() {
            return this._threadId;
        }
        getUIThreadSummary(timeRange) {
            if (this._dataWarehouse) {
                var jsonTimeRange = new DiagnosticsHub.JsonTimespan(TimestampConvertor_2.TimestampConvertor.timestampToJson(timeRange.begin), TimestampConvertor_2.TimestampConvertor.timestampToJson(timeRange.end));
                var customData = {
                    task: AppResponsivenessAnalyzerTasks.GetUIThreadActivityData.toString(),
                    granularity: (timeRange.end.nsec - timeRange.begin.nsec).toString()
                };
                var contextData = {
                    customDomain: customData,
                    timeDomain: jsonTimeRange
                };
                return this._dataWarehouse.getFilteredData(contextData, AnalyzerDataSession.TIMELINE_ANALYZER_CLASSID)
                    .then((result) => {
                    var data = [];
                    if (result.length === 1) {
                        var parsingTime = TimestampConvertor_2.TimestampConvertor.jsonToTimeStamp(result[0].ParsingTime).nsec;
                        if (parsingTime > 0) {
                            data.push({ category: "XamlParsing", name: "XamlParsing", value: parsingTime });
                        }
                        var xamlOtherTime = TimestampConvertor_2.TimestampConvertor.jsonToTimeStamp(result[0].XamlOther).nsec;
                        if (xamlOtherTime > 0) {
                            data.push({ category: "XamlOther", name: "XamlOther", value: xamlOtherTime });
                        }
                        var xamlLayoutTime = TimestampConvertor_2.TimestampConvertor.jsonToTimeStamp(result[0].LayoutTime).nsec;
                        if (xamlLayoutTime > 0) {
                            data.push({ category: "XamlLayout", name: "XamlLayout", value: xamlLayoutTime });
                        }
                        var appCodeTime = TimestampConvertor_2.TimestampConvertor.jsonToTimeStamp(result[0].AppCodeTime).nsec;
                        if (appCodeTime > 0) {
                            data.push({ category: "AppCode", name: "AppCode", value: appCodeTime });
                        }
                        var renderTime = TimestampConvertor_2.TimestampConvertor.jsonToTimeStamp(result[0].RenderTime).nsec;
                        if (renderTime > 0) {
                            data.push({ category: "XamlRender", name: "XamlRender", value: renderTime });
                        }
                        var ioTime = TimestampConvertor_2.TimestampConvertor.jsonToTimeStamp(result[0].IOTime).nsec;
                        if (ioTime > 0) {
                            data.push({ category: "IO", name: Plugin.Resources.getString("IO"), value: ioTime });
                        }
                        var unknownTime = TimestampConvertor_2.TimestampConvertor.jsonToTimeStamp(result[0].Unknown).nsec;
                        if (unknownTime > 0) {
                            data.push({ category: "Idle", name: "Idle", value: unknownTime });
                        }
                    }
                    return data;
                }, (error) => {
                    throw error;
                });
            }
            return Common.PromiseHelper.getPromiseError(null);
        }
    }
    exports.AnalyzerDataSession = AnalyzerDataSession;
    /*
     * Analyzer CLSID
     */
    AnalyzerDataSession.TIMELINE_ANALYZER_CLASSID = "161C8B44-77BF-49AA-A60C-44603940034B";
    AnalyzerDataSession.MARKERS_ANALYZER_CLASSID = "B821D548-5BA4-4C0E-8D23-CD46CE0C8E23";
    /*
     * Graph CounterIds
     */
    AnalyzerDataSession.CPU_USAGE_COUNTERID = "CPUUsage";
    AnalyzerDataSession.FRAME_RATE_COUNTERID = "frameRate";
    AnalyzerDataSession.LIFE_CYCLE_MARKS_COUNTERID = "LifeCycleEventMarks";
    AnalyzerDataSession.USER_MARKS_COUNTERID = "UserMarks";
    //This must match native enum defined in TreeQueryViewProcessor.h
    var TreeViewQueryResultTaskType;
    (function (TreeViewQueryResultTaskType) {
        TreeViewQueryResultTaskType[TreeViewQueryResultTaskType["GET_EVENTS_COUNT"] = 1] = "GET_EVENTS_COUNT";
        TreeViewQueryResultTaskType[TreeViewQueryResultTaskType["GET_EVENTS"] = 2] = "GET_EVENTS";
        TreeViewQueryResultTaskType[TreeViewQueryResultTaskType["INDEX_OF_EVENT"] = 3] = "INDEX_OF_EVENT";
        TreeViewQueryResultTaskType[TreeViewQueryResultTaskType["COLLAPSE_EVENT_BRANCH"] = 4] = "COLLAPSE_EVENT_BRANCH";
        TreeViewQueryResultTaskType[TreeViewQueryResultTaskType["EXPAND_EVENT_BRANCH"] = 5] = "EXPAND_EVENT_BRANCH";
        TreeViewQueryResultTaskType[TreeViewQueryResultTaskType["GET_EXPANDED_EVENT_IDS"] = 6] = "GET_EXPANDED_EVENT_IDS";
        TreeViewQueryResultTaskType[TreeViewQueryResultTaskType["INDEX_OF_PARENT_EVENT"] = 7] = "INDEX_OF_PARENT_EVENT";
        TreeViewQueryResultTaskType[TreeViewQueryResultTaskType["MAX"] = 8] = "MAX";
    })(TreeViewQueryResultTaskType = exports.TreeViewQueryResultTaskType || (exports.TreeViewQueryResultTaskType = {}));
    class EventIntevalsQueryResult {
        constructor(resultObject) {
            this._resultObj = resultObject;
            this._requests = [];
        }
        collapseIntervalBranch(index) {
            var requestObject = {
                task: TreeViewQueryResultTaskType.COLLAPSE_EVENT_BRANCH,
                index: index
            };
            return this.submitRequest(requestObject);
        }
        expandIntervalBranch(index) {
            var requestObject = {
                task: TreeViewQueryResultTaskType.EXPAND_EVENT_BRANCH,
                index: index
            };
            return this.submitRequest(requestObject);
        }
        //Returns events count
        getIntervalsCount() {
            var requestObject = {
                task: TreeViewQueryResultTaskType.GET_EVENTS_COUNT,
            };
            return this.submitRequest(requestObject)
                .then((response) => {
                return response;
            });
        }
        getIntervals(startIndex, endIndex) {
            var requestObject = {
                task: TreeViewQueryResultTaskType.GET_EVENTS,
                startIndex: startIndex,
                endIndex: endIndex
            };
            return this.submitRequest(requestObject);
        }
        // Returns -1 if the interval's id is not part of the current result
        indexOfInterval(id) {
            var requestObject = {
                task: TreeViewQueryResultTaskType.INDEX_OF_EVENT,
                id: id
            };
            return this.submitRequest(requestObject)
                .then((response) => {
                return response;
            });
        }
        indexOfParentInterval(id) {
            var requestObject = {
                task: TreeViewQueryResultTaskType.INDEX_OF_PARENT_EVENT,
                id: id
            };
            return this.submitRequest(requestObject)
                .then((response) => {
                return response;
            });
        }
        expandFrameForEvent(eventId) {
            return Promise.resolve(null);
        }
        getAggregatedDescendantsForEvent(id) {
            return Promise.resolve([]);
        }
        getSelectionSummary() {
            return Promise.resolve([]);
        }
        dispose() {
            return this.submitRequest(null, true);
        }
        submitRequest(request, isDisposeRequest) {
            var queryRequest = {
                requestData: request,
                promise: Common.PromiseHelper.promiseWrapper,
                isDispose: isDisposeRequest
            };
            if (!this._disposed) {
                this._requests.push(queryRequest);
                if (this._requests.length === 1) {
                    this.processRequest();
                }
            }
            return queryRequest.promise.promise; //Promise won't be triggered if already disposed
        }
        processRequest() {
            if (this._requests.length > 0) {
                var request = this._requests[0];
                if (request.isDispose) {
                    this._requests = []; //Not triggering error handler
                    this._disposed = true;
                    this._resultObj.dispose()
                        .then(() => {
                        Common.PromiseHelper.safeInvokePromise(request.promise.completeHandler, null);
                    }, (error) => {
                        Common.PromiseHelper.safeInvokePromise(request.promise.errorHandler, error);
                    });
                }
                else {
                    this._resultObj.getResult(request.requestData)
                        .then((data) => {
                        Common.PromiseHelper.safeInvokePromise(request.promise.completeHandler, data);
                        this._requests.shift();
                        this.processRequest();
                    }, (error) => {
                        Common.PromiseHelper.safeInvokePromise(request.promise.errorHandler, error);
                        this._requests.shift();
                        this.processRequest();
                    });
                }
            }
        }
    }
    exports.EventIntevalsQueryResult = EventIntevalsQueryResult;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/ProfilingSource", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/AnalyzerDataSession"], function (require, exports, AnalyzerDataSession_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataWarehouseProfilerSource = void 0;
    /* A data warehouse profiling source
     */
    class DataWarehouseProfilerSource {
        constructor(dataWarehouse) {
            this._dataWarehouse = dataWarehouse;
        }
        clean() {
        }
        getDataSession() {
            var analyzerDataSession = new AnalyzerDataSession_1.AnalyzerDataSession(this._dataWarehouse);
            return analyzerDataSession.initialize().then(() => {
                return analyzerDataSession;
            });
        }
    }
    exports.DataWarehouseProfilerSource = DataWarehouseProfilerSource;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/ToolbarViewModel", ["require", "exports", "Bpt.Diagnostics.Common", "Bpt.Diagnostics.PerfTools.Common", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/responsivenessNotifications", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/GlobalRuler"], function (require, exports, Common, PerfTools, responsivenessNotifications_4, GlobalRuler_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToolbarViewModel = void 0;
    class ToolbarViewModel extends Common.Framework.Observable {
        constructor(controller) {
            super();
        }
        static initialize() {
            Common.Framework.ObservableHelpers.defineProperty(ToolbarViewModel, ToolbarViewModel.ClearSelectionEnabledPropertyName, /*defaultValue=*/ false);
            Common.Framework.ObservableHelpers.defineProperty(ToolbarViewModel, ToolbarViewModel.ResetZoomEnabledPropertyName, /*defaultValue=*/ false);
            Common.Framework.ObservableHelpers.defineProperty(ToolbarViewModel, ToolbarViewModel.ZoomInEnabledPropertyName, /*defaultValue=*/ false);
        }
        clearSelection() {
            if (this._globalRuler) {
                this._globalRuler.setSelection(this._globalRuler.activeRange);
            }
        }
        resetZoom() {
            if (this._globalRuler) {
                this._globalRuler.setActiveRange(this._globalRuler.totalRange);
                this._globalRuler.setSelection(this._lastZoomSelection);
                this.zoomInEnabled = true;
                this.clearSelectionEnabled = true;
            }
            PerfTools.Notifications.notify(responsivenessNotifications_4.ResponsivenessNotifications.ResetZoomFinished);
        }
        setGlobalRuler(globalRuler) {
            if (this._globalRuler) {
                this._globalRuler.removeEventListener(GlobalRuler_2.GlobalRuler.ActiveRangeChangedEventType, this.onActiveRangeChanged.bind(this));
                this._globalRuler.removeEventListener(GlobalRuler_2.GlobalRuler.SelectionChangedEventType, this.onSelectionChanged.bind(this));
            }
            this._globalRuler = globalRuler;
            if (this._globalRuler) {
                this._globalRuler.addEventListener(GlobalRuler_2.GlobalRuler.ActiveRangeChangedEventType, this.onActiveRangeChanged.bind(this));
                this._globalRuler.addEventListener(GlobalRuler_2.GlobalRuler.SelectionChangedEventType, this.onSelectionChanged.bind(this));
            }
        }
        zoomIn() {
            if (this._globalRuler) {
                this._lastZoomSelection = this._globalRuler.selection;
                this._globalRuler.setActiveRange(this._globalRuler.selection);
                this.clearSelection();
                this.zoomInEnabled = false;
                this.clearSelectionEnabled = false;
            }
            PerfTools.Notifications.notify(responsivenessNotifications_4.ResponsivenessNotifications.ZoomInFinished);
        }
        onActiveRangeChanged(args) {
            this.resetZoomEnabled = !this._globalRuler.activeRange.equals(this._globalRuler.totalRange);
        }
        onSelectionChanged(args) {
            var clearSelectionAllowed = !args.data.newSelection.equals(this._globalRuler.activeRange);
            this.clearSelectionEnabled = clearSelectionAllowed;
            this.zoomInEnabled = clearSelectionAllowed && (args.data.newSelection.elapsed.nsec > ToolbarViewModel.MinimumZoomLevelInNs);
        }
    }
    exports.ToolbarViewModel = ToolbarViewModel;
    ToolbarViewModel.MinimumZoomLevelInNs = 100000;
    ToolbarViewModel.ClearSelectionEnabledPropertyName = "clearSelectionEnabled";
    ToolbarViewModel.ResetZoomEnabledPropertyName = "resetZoomEnabled";
    ToolbarViewModel.ZoomInEnabledPropertyName = "zoomInEnabled";
    ToolbarViewModel.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VisualProfilerView", ["require", "exports", "plugin-vs-v2", "Bpt.Diagnostics.Common", "Bpt.Diagnostics.PerfTools.Common", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/EventsTimelineView", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program.main", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/responsivenessNotifications"], function (require, exports, Plugin, Common, PerfTools, EventsTimelineView_2, Program_main_3, responsivenessNotifications_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VisualProfilerView = void 0;
    class VisualProfilerView {
        constructor(mainViewTemplate, controller) {
            this.controller = controller;
            var container = document.getElementById("mainContainer");
            var mainContainer = new Common.Control(container);
            this.mainView = new Common.TemplateControl(mainViewTemplate);
            mainContainer.appendChild(this.mainView);
            this.dataViewContainer = this.mainView.findElement("dataViewContainer");
            this.detailedViewsContainer = this.mainView.findElement("detailedViewsContainer");
            this.eventsTimelineView = new EventsTimelineView_2.EventsTimelineView(this.mainView.findElement("timelineViewContainer").id);
            this._warningView = this.mainView.findElement("warningView");
            this._warningView.style.display = "none";
            this._warningMessage = this.mainView.findElement("warningMessage");
        }
        onProcessingStarting() {
            // Implemented by the derived class
        }
        onProcessingCompleted() {
            // Implemented by the derived class
        }
        onProcessingFailed(error) {
            // Implemented by the derived class
        }
        onProfilingStarted() {
            // Implemented by the derived class
        }
        onProfilingStartFailed(err) {
            // Implemented by the derived class
        }
        onProfilingStopping() {
            // Implemented by the derived class
        }
        onProfilingStopFailed(err) {
            // Implemented by the derived class
        }
        setSource(source) {
            this.onProcessingStarting();
            this._warningView.style.display = "none";
            this.eventsTimelineView.toggleProcessingUI(true);
            return this.controller.initializeSession(source).then((result) => {
                this.onProcessingCompleted();
                // Show detailedViewsContainer
                this.detailedViewsContainer.style.display = "";
                this.setupAnalysisView(result);
                this.eventsTimelineView.toggleProcessingUI(false);
            }, (error) => {
                this.eventsTimelineView.toggleProcessingUI(false);
                this.onProcessingFailed(error);
                this.showError(new Error(Plugin.Resources.getString("GenericDataProcessingError", error.message)));
                Program_main_3.Program.reportError(error, Plugin.Resources.getString("GenericDataProcessingError"));
            });
        }
        setupAnalysisView(result) {
            this.setupAnalysisViewOverride(result);
            this.eventsTimelineView.viewModel = result.eventsTimelineViewModel;
            this.eventsTimelineView.viewModel.resetFilter();
            this.eventsTimelineView.viewModel.resetViewSettings();
            this.renderTimeLineView();
            this.eventsTimelineView.viewModel.getTelemetryStatsAndFormatForReporting().then(function (values) { Program_main_3.Program.reportTelemetry("AnalysisTarget", values); });
        }
        renderTimeLineView() {
            this.eventsTimelineView.render()
                .then(() => {
                PerfTools.Notifications.notify(responsivenessNotifications_5.ResponsivenessNotifications.ResultsLoaded);
            });
        }
        setupAnalysisViewOverride(result) {
            // Implemented by the derived class
        }
        showError(error, helpUrl) {
            // Implemented by the derived class
        }
    }
    exports.VisualProfilerView = VisualProfilerView;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VsVisualProfilerView", ["require", "exports", "Bpt.Diagnostics.Common", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program.main", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VisualProfilerView"], function (require, exports, Common, Program_main_4, VisualProfilerView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VsVisualProfilerView = void 0;
    class VsVisualProfilerView extends VisualProfilerView_1.VisualProfilerView {
        constructor(controller) {
            super("mainViewTemplateVS", controller);
        }
        setupAnalysisViewOverride(result) {
            Program_main_4.Program.triggerResize();
        }
        showError(error, helpUrl) {
            var errorView = new Common.TemplateControl("errorViewTemplate");
            var errorMessageDiv = errorView.findElement("errorMessage");
            errorMessageDiv.innerText = error.message;
            this.mainView.rootElement.innerHTML = "";
            this.mainView.rootElement.appendChild(errorView.rootElement);
        }
    }
    exports.VsVisualProfilerView = VsVisualProfilerView;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VisualProfiler", ["require", "exports", "diagnosticsHub", "Bpt.Diagnostics.Common", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/EventsTimelineView", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/GlobalRuler", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/MarkEventModel", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/ProfilingSource", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/ToolbarViewModel", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VsVisualProfilerView"], function (require, exports, DiagnosticsHub, Common, EventsTimelineView_3, GlobalRuler_3, MarkEventModel_1, ProfilingSource_1, TimeSpan_8, ToolbarViewModel_1, VsVisualProfilerView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VisualProfilerController = void 0;
    class VisualProfilerController {
        constructor() {
            this._toolbarViewModel = new ToolbarViewModel_1.ToolbarViewModel(this);
            this._view = new VsVisualProfilerView_1.VsVisualProfilerView(this);
            DiagnosticsHub.loadDataWarehouse().then((dataWarehouse) => {
                return this._view.setSource(new ProfilingSource_1.DataWarehouseProfilerSource(dataWarehouse));
            })
                .then(() => {
                DiagnosticsHub.getViewEventManager().detailsViewReady.raiseEvent({ Id: "9C74B558-F949-4513-8D3D-117C221923CC" });
            });
        }
        get globalRuler() {
            return this._globalRuler;
        }
        get toolbarViewModel() {
            return this._toolbarViewModel;
        }
        get view() {
            return this._view;
        }
        initializeSession(source) {
            this._profilingSource = source;
            var promise;
            return new Promise(
            // init
            (completed, error, progress) => {
                promise = this._profilingSource.getDataSession()
                    .then((session) => {
                    this._session = session;
                    return Common.PromiseHelper.getPromiseSuccess();
                }, error)
                    .then(() => {
                    if (this._globalRuler) {
                        this._globalRuler.deinitialize();
                    }
                    var totalDuration = this._session.getTotalDuration();
                    this._globalRuler = new GlobalRuler_3.GlobalRuler(new TimeSpan_8.TimeSpan(TimeSpan_8.TimeStamp.fromNanoseconds(totalDuration.begin), TimeSpan_8.TimeStamp.fromNanoseconds(totalDuration.end)));
                    this._toolbarViewModel.setGlobalRuler(this._globalRuler);
                    var markEventModel = new MarkEventModel_1.MarkEventModel(this._session);
                    var eventTimelineModel = new EventsTimelineView_3.EventsTimelineModel(this._session);
                    var eventTimelineViewModel = new EventsTimelineView_3.EventsTimelineViewModel(eventTimelineModel, this._globalRuler, markEventModel);
                    if (completed) {
                        completed(Promise.resolve({
                            eventsTimelineViewModel: eventTimelineViewModel,
                            globalRuler: this._globalRuler
                        }));
                    }
                }, error);
            }
            //,
            // oncancel
            //() => {
            // TODO: Implement promise cancellation.
            // promise.cancel();
            //}
            );
        }
    }
    exports.VisualProfilerController = VisualProfilerController;
    VisualProfilerController.LEFT_RIGHT_PADDING = 34;
    VisualProfilerController.ETL_RESOURCE_TYPE = "DiagnosticsHub.Resource.EtlFile";
    VisualProfilerController.ETL_SAVE_NAME = "Trace";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgramEvents = exports.HostType = void 0;
    var HostType;
    (function (HostType) {
        HostType[HostType["VS"] = 0] = "VS";
        HostType[HostType["Test"] = 1] = "Test";
    })(HostType = exports.HostType || (exports.HostType = {}));
    class ProgramEvents {
    }
    exports.ProgramEvents = ProgramEvents;
    ProgramEvents.Resize = "resize";
    ProgramEvents.Initialized = "initialized";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program.main", ["require", "exports", "plugin-vs-v2", "Bpt.Diagnostics.PerfTools.Common", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/extensions/userSettings", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VisualProfiler"], function (require, exports, Plugin, PerfTools, userSettings_1, Program_3, VisualProfiler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Program = exports.ProgramMain = void 0;
    class ProgramMain {
        constructor() {
            this._eventManager = new Plugin.EventManager(null);
        }
        get controller() { return this._visualProfilerController; }
        get hostType() { return this._hostType; }
        get hostShell() { return this._hostShell; }
        get userSettings() { return this._userSettings; }
        addEventListener(eventType, func) {
            if (eventType === Program_3.ProgramEvents.Initialized && this._visualProfilerController) {
                var event = new Event(eventType);
                event.controller = this._visualProfilerController;
                func(event);
            }
            else {
                this._eventManager.addEventListener(eventType, func);
            }
        }
        getHostSpecificString(resourceId, ...args) {
            var _resourceId = resourceId + PerfTools.Enum.GetName(Program_3.HostType, this._hostType);
            return Plugin.Resources.getString(_resourceId, args);
        }
        main() {
            this._hostType = Program_3.HostType.VS;
            Plugin.Messaging.addEventListener("pluginready", () => {
                this._telemetryProxy = Plugin.JSONMarshaler.attachToMarshaledObject("Timeline.Telemetry", {}, true);
                Plugin.Tooltip.defaultTooltipContentToHTML = false;
                Plugin.HotKeys.setZoomState(false);
                switch (this.hostType) {
                    case Program_3.HostType.VS:
                        this._hostShell = new PerfTools.HostShellProxy();
                        break;
                    default:
                        throw new Error(Plugin.Resources.getErrorString("JSPerf.1056"));
                }
                userSettings_1.UserSettingsHelper.getUserSettings().then((userSettings) => {
                    this._userSettings = userSettings;
                    this.initializeErrorReporting();
                    window.addEventListener("resize", this.triggerResize.bind(this));
                    // Start the main controller
                    this._visualProfilerController = new VisualProfiler_1.VisualProfilerController();
                    this._eventManager.dispatchEvent(Program_3.ProgramEvents.Initialized);
                });
            });
        }
        initializeErrorReporting() {
            // Stop reporting errors to the WER service
            window.onerror = (e, url, line, column, error) => {
                // There is actually a 4th argument, for column - but the Typescript stubs aren't updated
                var additionalInfo;
                if (error && error instanceof Error) {
                    additionalInfo = "Error number: " + error.number;
                    additionalInfo += "\r\nStack: " + error.stack;
                }
                else {
                    additionalInfo = "Unhandled Error";
                }
                this.reportError(new Error(e), additionalInfo, url, line, column);
                return true;
            };
        }
        removeEventListener(eventType, func) {
            this._eventManager.removeEventListener(eventType, func);
        }
        reportError(error, additionalInfo, source, line, column) {
            if (!this.userSettings.disableWER) {
                // Depending on the source, the error object will be different
                var message = (error.message || error.description);
                var url = source || "XAML Timeline";
                var lineNumber = line || 0;
                var columnNumber = column || 0;
                var errorInfo = "Error description:  " + message;
                if (error.number) {
                    errorInfo += "\r\nError number:  " + error.number;
                }
                if (source) {
                    errorInfo += "\r\nSource:  " + source;
                }
                if (error.stack) {
                    var stack = error.stack;
                    errorInfo += "\r\nError stack:  " + stack;
                    // Find message if we dont have one already
                    if (!message) {
                        var index = stack.indexOf("\n");
                        if (index > 0) {
                            index = Math.min(index, 50);
                            message = stack.substring(0, index);
                        }
                    }
                    // Find url
                    if (typeof source === "undefined") {
                        var matchInfo = stack.match(/(file|res):?([^)]+)\)/);
                        if (matchInfo && matchInfo.length > 2) {
                            url = matchInfo[2];
                        }
                    }
                    // Find line number
                    if (typeof line === "undefined") {
                        matchInfo = stack.match(/line ?(\d+)/);
                        if (!matchInfo || matchInfo.length <= 1) {
                            matchInfo = stack.match(/js:?(\d+):/);
                        }
                        if (matchInfo && matchInfo.length > 1) {
                            lineNumber = parseInt(matchInfo[1]);
                        }
                    }
                }
                if (additionalInfo) {
                    errorInfo += "\r\nAdditional Info:  " + additionalInfo;
                }
                Plugin.Diagnostics.reportError(message, url, lineNumber, errorInfo, columnNumber);
            }
        }
        triggerResize() {
            this._eventManager.dispatchEvent(Program_3.ProgramEvents.Resize);
        }
        reportTelemetry(eventName, data) {
            this._telemetryProxy._call("reportTelemetryEvent", eventName, data);
        }
    }
    exports.ProgramMain = ProgramMain;
    exports.Program = new ProgramMain();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
// Expose our AMD swimlane module to the global object
window.define("visualProfiler", ["require",
    "exports",
    "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program.main",
    "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VisualProfilerGlobals"], (require, exports, programMainModule) => {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Program = programMainModule.Program;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/VisualProfilerGlobals", ["require", "exports", "Bpt.Diagnostics.Common", "Bpt.Diagnostics.Common"], function (require, exports, Bpt_Diagnostics_Common_1, Bpt_Diagnostics_Common_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    window.Common = {
        Controls: {
            Button: Bpt_Diagnostics_Common_1.Controls.Button,
            CheckBoxMenuItem: Bpt_Diagnostics_Common_1.Controls.CheckBoxMenuItem,
            ComboBox: Bpt_Diagnostics_Common_1.Controls.ComboBox,
            ComboBoxMenuItem: Bpt_Diagnostics_Common_1.Controls.ComboBoxMenuItem,
            ContentControl: Bpt_Diagnostics_Common_1.Controls.ContentControl,
            ItemsControl: Bpt_Diagnostics_Common_1.Controls.ItemsControl,
            MenuControl: Bpt_Diagnostics_Common_1.Controls.MenuControl,
            MenuItem: Bpt_Diagnostics_Common_1.Controls.MenuItem,
            Panel: Bpt_Diagnostics_Common_1.Controls.Panel,
            PopupControl: Bpt_Diagnostics_Common_1.Controls.PopupControl,
            TextBox: Bpt_Diagnostics_Common_1.Controls.TextBox,
            TextBoxMenuItem: Bpt_Diagnostics_Common_1.Controls.TextBoxMenuItem,
            ToolbarControl: Bpt_Diagnostics_Common_1.Controls.ToolbarControl,
            ToggleButton: Bpt_Diagnostics_Common_1.Controls.ToggleButton,
        },
        CommonConverters: Bpt_Diagnostics_Common_2.Framework.CommonConverters,
        TemplateControl: Bpt_Diagnostics_Common_2.Framework.TemplateControl
    };
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("BPT.Diagnostics.PerfTools.VisualProfiler", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/EventsTimelineView", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/EventsTimelineListControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/Program.main", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/TimeSpan"], function (require, exports, EventsTimelineView_4, EventsTimelineListControl_2, Program_main_5, TimeSpan_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name="BPT.Diagnostics.PerfTools.VisualProfiler"/>
    __exportStar(EventsTimelineView_4, exports);
    __exportStar(EventsTimelineListControl_2, exports);
    __exportStar(Program_main_5, exports);
    __exportStar(TimeSpan_9, exports);
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/DragDirection", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragDirection = void 0;
    var DragDirection;
    (function (DragDirection) {
        DragDirection[DragDirection["none"] = 0] = "none";
        DragDirection[DragDirection["left"] = 1] = "left";
        DragDirection[DragDirection["right"] = 2] = "right";
    })(DragDirection = exports.DragDirection || (exports.DragDirection = {}));
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/hubGraphs/GraphResources", ["require", "exports", "plugin-vs-v2"], function (require, exports, Plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GraphResources = void 0;
    /* A helper class to get the resource string either from the hub resource dictionary or from Plugin.
     */
    class GraphResources {
        constructor(resources) {
            this._graphResources = resources;
        }
        getString(resourceId, ...args) {
            // First try to get the resource from the dictionary
            if (this._graphResources) {
                var resourceString = this._graphResources[resourceId];
                if (resourceString !== undefined) {
                    resourceString = GraphResources.format(resourceId, resourceString, args);
                    return resourceString;
                }
            }
            // Fallback to the Microsoft.Plugin resources
            try {
                return Plugin.Resources.getString.apply(Plugin.Resources, arguments);
            }
            catch (e) { }
            return resourceId;
        }
        static format(resourceId, format, args) {
            return format.replace(GraphResources.FORMAT_REG_EXP, (match, index) => {
                var replacer;
                switch (match) {
                    case "{{":
                        replacer = "{";
                        break;
                    case "}}":
                        replacer = "}";
                        break;
                    case "{":
                    case "}":
                        throw new Error(Plugin.Resources.getErrorString("JSPlugin.3002"));
                    default:
                        var argsIndex = parseInt(index);
                        if (args && argsIndex < args.length) {
                            replacer = args[argsIndex].toString();
                        }
                        else {
                            throw new Error(Plugin.Resources.getErrorString("JSPlugin.3003") + " (resourceId = " + resourceId + ")");
                        }
                        break;
                }
                if (replacer === undefined || replacer === null) {
                    replacer = "";
                }
                return replacer;
            });
        }
    }
    exports.GraphResources = GraphResources;
    GraphResources.FORMAT_REG_EXP = /\{{2}|\{(\d+)\}|\}{2}|\{|\}/g;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/hubGraphs/StackedBarChart", ["require", "exports", "plugin-vs-v2", "diagnosticsHub-swimlanes", "diagnosticsHub"], function (require, exports, Plugin, DiagnosticsHubSwimlanes, diagnosticsHub_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StackedBarChartView = exports.StackedBarChartPresenter = exports.DataSeriesInfo = void 0;
    class DataSeriesInfo {
        constructor(name, cssClass, sortOrder) {
            if (!name || sortOrder === undefined || sortOrder === null) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1044"));
            }
            this._name = name;
            this._cssClass = cssClass;
            this._sortOrder = sortOrder;
        }
        get cssClass() {
            return this._cssClass;
        }
        get name() {
            return this._name;
        }
        get sortOrder() {
            return this._sortOrder;
        }
    }
    exports.DataSeriesInfo = DataSeriesInfo;
    class StackedBarChartPresenter {
        constructor(options) {
            this._data = [];
            this._dataSeriesInfo = {};
            this._maximumYValue = Number.NEGATIVE_INFINITY;
            this.viewModel = [];
            this._options = options;
            this.validateOptions();
            this._pixelHorizontalValue = this.xWidth / this._options.width;
        }
        get maximumYValue() {
            return this._maximumYValue;
        }
        get xWidth() {
            return this._options.maxX - this._options.minX;
        }
        addData(chartData) {
            chartData.forEach((dataItem) => {
                if (this._dataSeriesInfo.hasOwnProperty(dataItem.series)) {
                    this._data.push(dataItem);
                }
                else {
                    throw new Error(Plugin.Resources.getErrorString("JSPerf.1043"));
                }
            });
            this.generateViewModel();
        }
        addSeries(seriesInfo) {
            for (var i = 0; i < seriesInfo.length; i++) {
                var info = seriesInfo[i];
                if (this._dataSeriesInfo.hasOwnProperty(info.name)) {
                    throw new Error(Plugin.Resources.getErrorString("JSPerf.1045"));
                }
                this._dataSeriesInfo[info.name] = info;
            }
        }
        getViewOptions() {
            var viewOptions = {
                ariaDescription: this._options.ariaDescription,
                ariaLabelCallback: this._options.ariaLabelCallback,
                height: this._options.height,
                width: this._options.width,
                tooltipCallback: this._options.tooltipCallback,
                legendData: this._dataSeriesInfo
            };
            return viewOptions;
        }
        determineYAxisScale(allBars) {
            this.log("_maximumYValue (164) = " + this._maximumYValue);
            for (var i = 0; i < allBars.length; i++) {
                var totalStackHeight = 0;
                var currentBar = allBars[i];
                for (var j = 0; j < currentBar.length; j++) {
                    var stackComponent = currentBar[j];
                    if (stackComponent.height > 0) {
                        totalStackHeight += stackComponent.height;
                    }
                }
                this.log("\t" + i + " = " + totalStackHeight);
                this._maximumYValue = Math.max(this._maximumYValue, totalStackHeight);
            }
            this.log("_maximumYValue (179) = " + this._maximumYValue);
            this._maximumYValue = Math.max(this._options.minYHeight, this._maximumYValue);
            this.log("_maximumYValue (184) = " + this._maximumYValue);
            // Round the max value to the next 100, taking into account real precision (to avoid scaling up by 100 to cater
            // for the 100.0000000001 case)
            this._maximumYValue = Math.ceil(Math.floor(this._maximumYValue) / 100) * 100;
            this.log("_maximumYValue (190) = " + this._maximumYValue);
            var availableAxisHight = this._options.height - StackedBarChartPresenter.YAXIS_PIXEL_PADDING;
            this.log("availableAxisHight   = " + availableAxisHight);
            if (availableAxisHight <= 0) {
                availableAxisHight = this._options.height;
            }
            this._pixelVerticalValue = this._maximumYValue / availableAxisHight;
            this.log("_maximumYValue (199) = " + this._maximumYValue);
            this.log("availableAxisHight   = " + availableAxisHight);
            this.log("_pixelVerticalValue  = " + this._pixelVerticalValue);
            this._maximumYValue = this._options.height * this._pixelVerticalValue;
            this.log("_maximumYValue (205) = " + this._maximumYValue);
        }
        generateViewModel() {
            var allBars = [[]];
            var singleBar = [];
            var barWidthAndMargin = this._options.barWidth + this._options.barGap;
            var currentXValue = this._options.minX;
            var prevValue = Number.NEGATIVE_INFINITY;
            var x = 0;
            var i = 0;
            while (i < this._data.length) {
                var dataItem = this._data[i];
                if (dataItem.x < prevValue) {
                    throw new Error(Plugin.Resources.getErrorString("JSPerf.1046"));
                }
                if (dataItem.x > this._options.maxX) {
                    break;
                }
                prevValue = dataItem.x;
                var currentXValue = Math.floor(x * this._pixelHorizontalValue + this._options.minX);
                var currentBarMinValue = currentXValue;
                var currentBarMaxValue = currentXValue + Math.floor((this._options.barWidth + this._options.barGap) * this._pixelHorizontalValue);
                if (dataItem.x < currentBarMinValue) {
                    i++;
                    continue;
                }
                if (dataItem.x < currentBarMaxValue) {
                    dataItem.x = x;
                    singleBar.push(dataItem);
                    i++;
                }
                else {
                    allBars.push(singleBar);
                    singleBar = [];
                    x += barWidthAndMargin;
                }
            }
            allBars.push(singleBar);
            this.determineYAxisScale(allBars);
            this.log("Generating view models for single stacks.");
            this.log("");
            for (var i = 0; i < allBars.length; i++) {
                this.log("Bar # " + i);
                this.generateViewModelForSingleStack(allBars[i]);
                this.log("");
            }
        }
        generateViewModelForSingleStack(dataItems) {
            if (!dataItems || dataItems.length === 0) {
                return;
            }
            dataItems.sort(this.sortBySeries.bind(this));
            var accumulatedHeight = 2 * StackedBarChartPresenter.EDGE_LINE_THICKNESS;
            var maxHeightExceeded = false;
            for (var i = dataItems.length - 1; i >= 0; i--) {
                var dataItem = dataItems[i];
                this.log("\t" + i + ": " + dataItem.series + " = " + dataItem.height + "(" + dataItem.x + ")");
                if (dataItem.height <= 0) {
                    continue;
                }
                var barHeight = Math.round(dataItem.height / this._pixelVerticalValue);
                this.log("\t\tbarHeight = " + barHeight);
                if (barHeight < StackedBarChartPresenter.MIN_BAR_HEIGHT) {
                    this.log("\t\t\t- barHeigh too small. Resetting to " + StackedBarChartPresenter.MIN_BAR_HEIGHT);
                    barHeight = StackedBarChartPresenter.MIN_BAR_HEIGHT;
                }
                var startY = this._options.height - (barHeight + accumulatedHeight);
                this.log("\t\t\t- startY = " + startY);
                if (startY < StackedBarChartPresenter.YAXIS_PIXEL_PADDING) {
                    barHeight = Math.max(100 * this._pixelVerticalValue - accumulatedHeight, StackedBarChartPresenter.MIN_BAR_HEIGHT);
                    startY = StackedBarChartPresenter.YAXIS_PIXEL_PADDING;
                    this.log("\t\t\t- startY is too small. Resetting to " + startY + " and barHeight to " + barHeight);
                    maxHeightExceeded = true;
                }
                accumulatedHeight += barHeight;
                if (this._options.showStackGap) {
                    accumulatedHeight += this._options.barGap;
                }
                var rectangle = {
                    x: dataItem.x,
                    y: startY,
                    height: barHeight,
                    width: this._options.barWidth,
                    className: this._dataSeriesInfo[dataItem.series].cssClass,
                    chartItem: dataItem
                };
                this.viewModel.push(rectangle);
                if (maxHeightExceeded) {
                    break;
                }
            }
        }
        sortBySeries(chartItem1, chartItem2) {
            return this._dataSeriesInfo[chartItem2.series].sortOrder - this._dataSeriesInfo[chartItem1.series].sortOrder;
        }
        validateOptions() {
            if (!this._options) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1047"));
            }
            if ((this._options.minX === undefined || this._options.minX === null) ||
                (this._options.maxX === undefined || this._options.maxX === null) ||
                (this._options.minY === undefined || this._options.minY === null) ||
                (this._options.minX > this._options.maxX) ||
                (!this._options.height || !this._options.width || this._options.height < 0 || this._options.width < 0) ||
                (!this._options.barWidth || this._options.barWidth < 0)) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1048"));
            }
            this._options.barGap = this._options.barGap || 1;
            this._options.showStackGap = this._options.showStackGap || true;
            this._options.minYHeight = this._options.minYHeight || this._options.minY;
        }
        static get logger() {
            if (!StackedBarChartPresenter._logger) {
                StackedBarChartPresenter._logger = diagnosticsHub_3.getLogger();
            }
            return StackedBarChartPresenter._logger;
        }
        log(message) {
            StackedBarChartPresenter.logger.debug(StackedBarChartPresenter.LoggerPrefixText + message);
        }
    }
    exports.StackedBarChartPresenter = StackedBarChartPresenter;
    StackedBarChartPresenter.LoggerPrefixText = "StackedBarChartPresenter: ";
    StackedBarChartPresenter.EDGE_LINE_THICKNESS = 1;
    StackedBarChartPresenter.YAXIS_PIXEL_PADDING = 10 + 2 * StackedBarChartPresenter.EDGE_LINE_THICKNESS;
    StackedBarChartPresenter.MIN_BAR_HEIGHT = 2;
    class StackedBarChartView {
        constructor() {
            this._idCount = 0;
            this._selectedId = -1;
            this.rootElement = document.createElement("div");
            this.rootElement.style.width = this.rootElement.style.height = "100%";
        }
        set presenter(value) {
            this._presenter = value;
            this._viewData = this._presenter.viewModel;
            this._options = value.getViewOptions();
            this._barGraphWidth = this._options.width;
            this.drawChart();
        }
        createContainer() {
            if (!this._chartAreaContainer) {
                this._chartAreaContainer = document.createElement("div");
                this.rootElement.appendChild(this._chartAreaContainer);
            }
            else {
                this._chartAreaContainer.innerHTML = "";
            }
            this._chartAreaContainer.style.width = this._options.width + "px";
            this._chartAreaContainer.style.height = this._options.height + "px";
            this._chartAreaContainer.classList.add("stackedBarChart");
            this._chartAreaContainer.style.display = "-ms-grid";
        }
        createRect(x, y, height, width, className) {
            var rect = document.createElement("div");
            rect.id = StackedBarChartView._barIdPrefix + this._idCount;
            rect.tabIndex = -1;
            this._idCount++;
            rect.classList.add("bar");
            rect.classList.add(className);
            rect.style.left = x + "px";
            rect.style.bottom = (this._options.height - y - height) + "px";
            rect.style.height = height + "px";
            rect.style.width = width + "px";
            return rect;
        }
        drawChart() {
            if (!this._viewData) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1049"));
            }
            this.createContainer();
            this.initializeBarGraph();
            this.renderViewData(this._barGraph, this._viewData);
            this._chartAreaContainer.appendChild(this._barGraph);
        }
        initializeBarGraph() {
            this._selectedId = -1;
            this._idCount = 0;
            this._barGraph = document.createElement("div");
            this._barGraph.classList.add("barGraph");
            this._barGraph.tabIndex = 0;
            this._barGraph.style.height = this._options.height + "px";
            this._barGraph.style.width = this._barGraphWidth + "px";
            this._barGraph.addEventListener("keydown", this.onBarGraphKeydown.bind(this));
            this._barGraph.addEventListener("focus", () => { this._selectedId = -1; });
            if (this._options.ariaDescription) {
                this._barGraph.setAttribute("aria-label", this._options.ariaDescription);
            }
        }
        onBarBlur(event) {
            var bar = event.currentTarget;
            bar.classList.remove("focused");
            Plugin.Tooltip.dismiss();
        }
        onBarFocus(chartItem, event) {
            var bar = event.currentTarget;
            bar.classList.add("focused");
            if (this._options.ariaLabelCallback) {
                var ariaLabel = this._options.ariaLabelCallback(chartItem);
                bar.setAttribute("aria-label", ariaLabel);
            }
            var element = event.currentTarget;
            var offsetX = window.screenLeft + element.offsetLeft + element.clientWidth;
            var offsetY = window.screenTop + element.offsetTop + element.clientHeight;
            this.showTooltip(chartItem, offsetX, offsetY);
        }
        onBarGraphKeydown(event) {
            if (event.keyCode === DiagnosticsHubSwimlanes.KeyCodes.ArrowLeft || event.keyCode === DiagnosticsHubSwimlanes.KeyCodes.ArrowRight) {
                if (event.keyCode === DiagnosticsHubSwimlanes.KeyCodes.ArrowLeft) {
                    if ((this._selectedId === 0) || (this._selectedId === -1)) {
                        this._selectedId = this._idCount;
                    }
                    this._selectedId--;
                }
                else if (event.keyCode === DiagnosticsHubSwimlanes.KeyCodes.ArrowRight) {
                    this._selectedId++;
                    if (this._selectedId === this._idCount) {
                        this._selectedId = 0;
                    }
                }
                var bar = document.getElementById(StackedBarChartView._barIdPrefix + this._selectedId);
                bar.focus();
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
            return true;
        }
        renderViewData(container, viewData) {
            for (var i = 0; i < viewData.length; i++) {
                var barInfo = viewData[i];
                var rectangle = this.createRect(barInfo.x, barInfo.y, barInfo.height, barInfo.width, barInfo.className);
                rectangle.addEventListener("mouseover", this.showTooltip.bind(this, barInfo.chartItem));
                rectangle.addEventListener("mouseout", () => Plugin.Tooltip.dismiss());
                rectangle.addEventListener("focus", this.onBarFocus.bind(this, barInfo.chartItem));
                rectangle.addEventListener("blur", this.onBarBlur.bind(this));
                container.appendChild(rectangle);
            }
        }
        showTooltip(chartItem, x, y) {
            if (this._options.tooltipCallback) {
                var toolTipContent = this._options.tooltipCallback(chartItem);
                var config = { content: toolTipContent, delay: 0, x: x, y: y, contentContainsHTML: true };
                Plugin.Tooltip.show(config);
            }
        }
    }
    exports.StackedBarChartView = StackedBarChartView;
    StackedBarChartView._barIdPrefix = "bar";
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/hubGraphs/StackedBarGraph", ["require", "exports", "plugin-vs-v2", "diagnosticsHub", "diagnosticsHub-swimlanes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/hubGraphs/StackedBarChart", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/hubGraphs/GraphResources", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/VisualProfiler/js/hubGraphs/DataUtilities"], function (require, exports, Plugin, DiagnosticsHub, DiagnosticsHubSwimlanes, StackedBarChart_1, GraphResources_1, DataUtilities_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StackedBarGraph = exports.Category = void 0;
    class Category {
    }
    exports.Category = Category;
    Category.parsingCategory = "Parsing_Category";
    Category.layoutCategory = "Layout_Category";
    Category.appCodeCategory = "AppCode_Category";
    Category.xamlOtherCategory = "XamlOther_Category";
    Category.renderCategory = "Render_Category";
    Category.ioCategory = "IO_Category";
    class StackedBarGraph {
        constructor(config) {
            this._scaleChangedEvent = new DiagnosticsHub.AggregatedEvent();
            this._config = config;
            this._graphResources = new GraphResources_1.GraphResources(this._config.resources);
            this._timeRange = this._config.timeRange || new DiagnosticsHub.JsonTimespan(new DiagnosticsHub.BigNumber(0, 0), new DiagnosticsHub.BigNumber(0, 0));
            this._container = document.createElement("div");
            StackedBarGraph.validateConfiguration(this._config);
            this._dataSource = this._config.jsonConfig.Series[0].DataSource;
            if (config.pathToScriptFolder && config.loadCss) {
                config.loadCss(config.pathToScriptFolder + "/CSS/hubGraphs/StackedBarChart.css");
                config.loadCss(config.pathToScriptFolder + "/DataCategoryStyles.css");
            }
            // Setup scale
            this._config.scale = this._config.scale || {};
            this._config.scale.minimum = 0;
            this._config.scale.maximum = 120;
            this._config.scale.axes = [];
            this._config.scale.axes.push({
                value: 100
            });
            // add series and legend to config
            this._config.legend = this._config.legend || [];
            var seriesCollection = this._config.jsonConfig.Series;
            for (var i = 0; i < seriesCollection.length; i++) {
                var series = seriesCollection[i];
                this._config.legend.push({
                    color: series.Color,
                    legendText: this._graphResources.getString(series.Legend),
                    legendTooltip: (series.LegendTooltip ? this._graphResources.getString(series.LegendTooltip) : null)
                });
            }
        }
        get container() {
            return this._container;
        }
        get scaleChangedEvent() {
            return this._scaleChangedEvent;
        }
        get containerOffsetWidth() {
            if (this._containerOffsetWidth === undefined) {
                this._containerOffsetWidth = this._container.offsetWidth;
            }
            return this._containerOffsetWidth;
        }
        onDataUpdate(timestampNs) {
            // Not implemented
        }
        addSeriesData(counterId, points, fullRender, dropOldData) {
            // Not implemented
        }
        getDataPresenter() {
            var presenterOptions = {
                ariaDescription: this._graphResources.getString("UiThreadActivityAriaLabel"),
                height: this._config.height,
                width: this.containerOffsetWidth,
                minX: parseInt(this._timeRange.begin.value),
                maxX: parseInt(this._timeRange.end.value),
                minY: 0,
                minYHeight: 100,
                barWidth: this._config.jsonConfig.BarWidth,
                barGap: this._config.jsonConfig.BarGap,
                showStackGap: this._config.jsonConfig.ShowStackGap,
                tooltipCallback: this.createTooltip.bind(this),
                ariaLabelCallback: this.createAriaLabel.bind(this)
            };
            var presenter = new StackedBarChart_1.StackedBarChartPresenter(presenterOptions);
            //
            // Add series information to the presenter
            //
            var dataSeriesInfo = [];
            var stackedDataSeries = this._config.jsonConfig.Series;
            for (var i = 0; i < stackedDataSeries.length; i++) {
                var seriesItem = stackedDataSeries[i];
                dataSeriesInfo.push({
                    cssClass: seriesItem.CssClass,
                    name: seriesItem.Category,
                    sortOrder: i + 1
                });
            }
            presenter.addSeries(dataSeriesInfo);
            return presenter;
        }
        getGranularity() {
            var bucketWidth = this._config.jsonConfig.BarGap + this._config.jsonConfig.BarWidth;
            var graphDuration = parseInt(this._timeRange.elapsed.value);
            if (graphDuration <= 0 || this.containerOffsetWidth <= 0) {
                return 0;
            }
            return Math.floor(bucketWidth / this.containerOffsetWidth * graphDuration);
        }
        removeInvalidPoints(base) {
            // Not implemented
        }
        render(fullRender) {
            if (this._config.jsonConfig.GraphBehaviour == DiagnosticsHubSwimlanes.GraphBehaviourType.PostMortem) {
                this.setData(this._timeRange);
            }
        }
        resize(evt) {
            this._containerOffsetWidth = undefined;
            this.render();
        }
        onViewportChanged(viewportArgs) {
            if (this._timeRange.equals(viewportArgs.currentTimespan)) {
                // Only selection changed, ignore this event
                return;
            }
            this._timeRange = viewportArgs.currentTimespan;
            this.render();
        }
        static validateConfiguration(config) {
            if (!config) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1070"));
            }
            var jsonObject = config.jsonConfig;
            if (!jsonObject) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1071"));
            }
            if (!jsonObject.Series || jsonObject.Series.length === 0) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1072"));
            }
            jsonObject.BarWidth = jsonObject.BarWidth || 16;
            jsonObject.BarGap = jsonObject.BarGap || 1;
            jsonObject.ShowStackGap = jsonObject.ShowStackGap || true;
            if ((!config.height || config.height < 0) ||
                jsonObject.BarWidth < 0) {
                throw new Error(Plugin.Resources.getErrorString("JSPerf.1048"));
            }
        }
        createTooltip(cpuUsage) {
            var tooltip = this._graphResources.getString(cpuUsage.series) + ": " + (Math.round(cpuUsage.height * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) + "%";
            return tooltip;
        }
        createAriaLabel(cpuUsage) {
            var percentageUtilization = (Math.round(cpuUsage.height * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
            var formattedTime = DiagnosticsHubSwimlanes.RulerUtilities.formatTime(DiagnosticsHub.BigNumber.convertFromNumber(cpuUsage.x), DiagnosticsHubSwimlanes.UnitFormat.fullName);
            return this._graphResources.getString("UiThreadActivityBarAriaLabel", this._graphResources.getString(cpuUsage.series), percentageUtilization, formattedTime);
        }
        static jsonTimeToNanoseconds(bigNumber) {
            var l = bigNumber.l;
            var h = bigNumber.h;
            if (l < 0) {
                l = l >>> 0;
            }
            if (h < 0) {
                h = h >>> 0;
            }
            var nsec = h * 0x100000000 + l;
            return nsec;
        }
        setData(timeRange) {
            if (this._settingDataPromise) {
                // TODO: Implement promise cancellation.
                // this._settingDataPromise.cancel();
                // this._settingDataPromise = null;
            }
            if (!this._dataSource || !this._dataSource.CounterId || !this._dataSource.AnalyzerId) {
                // No data to set if there is no data source
                return;
            }
            this._settingDataPromise = this.getDataWarehouse().then((dataWarehouse) => {
                var granuality = this.getGranularity();
                if (granuality > 0) {
                    return DataUtilities_2.DataUtilities.getFilteredResult(dataWarehouse, this._dataSource.AnalyzerId, this._dataSource.CounterId, timeRange, {
                        granularity: granuality.toString(),
                        task: "1" // AnalysisTaskType::GetUIThreadActivityData in XamlProfiler\DataModel\XamlAnalyzer.h
                    });
                }
                else {
                    return Promise.resolve([]);
                }
            }).then((cpuUsageResult) => {
                if (this._chart) {
                    this._container.removeChild(this._chart.rootElement);
                    this._chart = null;
                }
                if (cpuUsageResult) {
                    var chartItems = [];
                    for (var i = 0; i < cpuUsageResult.length; i++) {
                        var cpuUsagePoint = cpuUsageResult[i];
                        var parsingTime = StackedBarGraph.jsonTimeToNanoseconds(cpuUsagePoint.ParsingTime);
                        var layoutTime = StackedBarGraph.jsonTimeToNanoseconds(cpuUsagePoint.LayoutTime);
                        var appCodeTime = StackedBarGraph.jsonTimeToNanoseconds(cpuUsagePoint.AppCodeTime);
                        var xamlOtherTime = StackedBarGraph.jsonTimeToNanoseconds(cpuUsagePoint.XamlOther);
                        var renderTime = StackedBarGraph.jsonTimeToNanoseconds(cpuUsagePoint.RenderTime);
                        var ioTime = StackedBarGraph.jsonTimeToNanoseconds(cpuUsagePoint.IOTime);
                        var startTime = StackedBarGraph.jsonTimeToNanoseconds(cpuUsagePoint.StartTime);
                        var endTime = StackedBarGraph.jsonTimeToNanoseconds(cpuUsagePoint.EndTime);
                        var totalTime = endTime - startTime;
                        if (parsingTime > 0) {
                            chartItems.push({
                                series: Category.parsingCategory,
                                x: startTime,
                                height: parsingTime * 100.0 / totalTime
                            });
                        }
                        if (layoutTime > 0) {
                            chartItems.push({
                                series: Category.layoutCategory,
                                x: startTime,
                                height: layoutTime * 100.0 / totalTime
                            });
                        }
                        if (appCodeTime > 0) {
                            chartItems.push({
                                series: Category.appCodeCategory,
                                x: startTime,
                                height: appCodeTime * 100.0 / totalTime
                            });
                        }
                        if (xamlOtherTime > 0) {
                            chartItems.push({
                                series: Category.xamlOtherCategory,
                                x: startTime,
                                height: xamlOtherTime * 100.0 / totalTime
                            });
                        }
                        if (renderTime > 0) {
                            chartItems.push({
                                series: Category.renderCategory,
                                x: startTime,
                                height: renderTime * 100.0 / totalTime
                            });
                        }
                        if (ioTime > 0) {
                            chartItems.push({
                                series: Category.ioCategory,
                                x: startTime,
                                height: ioTime * 100.0 / totalTime
                            });
                        }
                    }
                    var dataPresenter = this.getDataPresenter();
                    dataPresenter.addData(chartItems);
                    this._chart = new StackedBarChart_1.StackedBarChartView();
                    this._chart.presenter = dataPresenter;
                    // Update the y-axis scale maximum
                    this._scaleChangedEvent.invokeEvent({
                        minimum: 0,
                        maximum: dataPresenter.maximumYValue
                    });
                    this._container.appendChild(this._chart.rootElement);
                }
            }).then(() => {
                this._settingDataPromise = null;
            });
        }
        getDataWarehouse() {
            if (this._dataWarehouse) {
                return Promise.resolve(this._dataWarehouse);
            }
            else {
                return DiagnosticsHub.loadDataWarehouse().then((dataWarehouse) => {
                    this._dataWarehouse = dataWarehouse;
                    return this._dataWarehouse;
                });
            }
        }
    }
    exports.StackedBarGraph = StackedBarGraph;
});
//
//  Copyright (C) Microsoft. All rights reserved.
//
//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------
var ControlTemplates;
(function (ControlTemplates) {
    class VisualProfiler {
    }
    VisualProfiler.toolbarButtonsPanel = "\
<div>\
            <div data-name=\"startToolbarButton\" data-control=\"Common.Controls.Button\" data-control-templateid=\"Common.iconButton24x24\" data-options=\"className:startToolbarButton,                                tooltip:F12StartButtonTooltip; converter=Common.CommonConverters.ResourceConverter\" data-binding=\"isEnabled:startProfilingEnabled\"></div>\
            <div data-name=\"stopToolbarButton\" data-control=\"Common.Controls.Button\" data-control-templateid=\"Common.iconButton24x24\" data-options=\"className:stopToolbarButton,                                tooltip:F12StopButtonTooltip; converter=Common.CommonConverters.ResourceConverter\" data-binding=\"isEnabled:stopProfilingEnabled\"></div>\
            <div data-name=\"openSessionButton\" data-control=\"Common.Controls.Button\" data-control-templateid=\"Common.iconButton24x24\" data-options=\"className:openSessionButton,                                tooltip:F12OpenSessionButtonTooltip; converter=Common.CommonConverters.ResourceConverter\" data-binding=\"isEnabled:openSessionEnabled\"></div>\
            <div data-name=\"saveSessionButton\" data-control=\"Common.Controls.Button\" data-control-templateid=\"Common.iconButton24x24\" data-options=\"className:saveSessionButton,                                tooltip:F12SaveSessionButtonTooltip; converter=Common.CommonConverters.ResourceConverter\" data-binding=\"isEnabled:saveSessionEnabled\"></div>\
            <div data-name=\"zoomInButton\" data-control=\"Common.Controls.Button\" data-control-templateid=\"Common.iconButton24x24\" data-options=\"className:zoomInButton,                                tooltip:ToolbarButtonZoomIn; converter=Common.CommonConverters.ResourceConverter\" data-binding=\"isEnabled:zoomInEnabled\"></div>\
            <div data-name=\"resetZoomButton\" data-control=\"Common.Controls.Button\" data-control-templateid=\"Common.iconButton24x24\" data-options=\"className:resetZoomButton,                                tooltip:ToolbarButtonResetZoom; converter=Common.CommonConverters.ResourceConverter\" data-binding=\"isEnabled:resetZoomEnabled\"></div>\
            <div data-name=\"clearSelectionButton\" data-control=\"Common.Controls.Button\" data-control-templateid=\"Common.iconButton24x24\" data-options=\"className:clearSelectionButton,                                tooltip:ToolbarButtonClearSelection; converter=Common.CommonConverters.ResourceConverter\" data-binding=\"isEnabled:clearSelectionEnabled\"></div>\
        </div>\
";
    VisualProfiler.filteringBarTemplate = "\
<div class=\"filteringBar\">\
            <div id=\"timelineSort\" class=\"timelineSort\">\
                <label class=\"timelineSortLabel\" for=\"timelineSortSelector\" data-options=\"textContent:TimelineSortLabel; converter=Common.CommonConverters.ResourceConverter\">\
                </label>\
                <div id=\"timelineSortSelector\" data-name=\"timelineSortSelector\" data-control=\"Common.Controls.ComboBox\" data-binding=\"items:sortOptions,                                    selectedValue:sort; mode=twoway; converter=Common.CommonConverters.IntToStringConverter\" data-options=\"className:timelineSortSelector\"></div>\
            </div>\
            <div data-name=\"frameGroupingButton\" data-control=\"Common.Controls.ToggleButton\" data-control-templateid=\"Common.iconButton24x24\" data-binding=\"isChecked:displayFrames; mode=twoway\" data-options=\"className:frameGroupingButton,                                tooltip:FrameGroupingTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <div data-name=\"filteringMenuButton\" role=\"menu\" data-control=\"Common.Controls.ToggleButton\" data-control-templateid=\"Common.menuButton33x24\" data-binding=\"isChecked:hasFilterSettingsChanged\" data-options=\"className:filteringMenuButton,                                toggleIsCheckedOnClick:false; converter=Common.CommonConverters.StringToBooleanConverter,                                tooltip:FilteringMenuButtonTooltipText; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <div data-name=\"viewSettingsMenuButton\" role=\"menu\" data-control=\"Common.Controls.ToggleButton\" data-control-templateid=\"Common.menuButton33x24\" data-binding=\"isChecked:hasViewSettingsChanged\" data-options=\"className:viewSettingsMenuButton,                                toggleIsCheckedOnClick:false; converter=Common.CommonConverters.StringToBooleanConverter,                                tooltip:ViewSettingsMenuButtonTooltipText; converter=Common.CommonConverters.ResourceConverter\"></div>\
        </div>\
";
    VisualProfiler.filteringMenuDropDown = "\
<ul>\
            <div data-name=\"eventNameFilter\" data-control=\"Common.Controls.TextBoxMenuItem\" data-binding=\"content:eventNameFilter; mode=twoway\" data-options=\"className:eventNameFilter,                                placeholder:EventNameFilterPlaceholder; converter=Common.CommonConverters.ResourceConverter,                                tooltip:EventNameFilterTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <hr />\
            <div data-name=\"displayBackgroundActivities\" data-control=\"Common.Controls.CheckBoxMenuItem\" data-binding=\"isChecked:displayBackgroundActivities; mode=twoway\" data-options=\"content:FilterBackgroundActivities; converter=Common.CommonConverters.ResourceConverter,                                tooltip:BackgroundActivityFilterTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <div data-name=\"displayIOActivities\" data-control=\"Common.Controls.CheckBoxMenuItem\" data-binding=\"isChecked:displayIOActivities; mode=twoway\" data-options=\"content:FilterIOActivities; converter=Common.CommonConverters.ResourceConverter,                                tooltip:IOFilterTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <div data-name=\"displayUIActivities\" data-control=\"Common.Controls.CheckBoxMenuItem\" data-binding=\"isChecked:displayUIActivities; mode=twoway\" data-options=\"content:FilterUIActivities; converter=Common.CommonConverters.ResourceConverter,                                tooltip:UIActivityFilterTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <div data-name=\"displayScenarios\" data-control=\"Common.Controls.CheckBoxMenuItem\" data-binding=\"isChecked:displayScenarios; mode=twoway\" data-options=\"content:FilterScenarios; converter=Common.CommonConverters.ResourceConverter,                                tooltip:ScenariosFilterTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <hr />\
            <div data-name=\"durationFilter\" data-control=\"Common.Controls.ComboBoxMenuItem\" data-binding=\"items:durationFilterOptions,                                selectedValue:durationFilter; mode=twoway; converter=Common.CommonConverters.IntToStringConverter\" data-options=\"tooltip:DurationFilterTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
        </ul>\
";
    VisualProfiler.viewSettingsMenuDropDown = "\
<ul>\
            <div data-name=\"showThreadIndicator\" data-control=\"Common.Controls.CheckBoxMenuItem\" data-binding=\"isChecked:showThreadIndicator; mode=twoway\" data-options=\"content:ShowThreadIndicator; converter=Common.CommonConverters.ResourceConverter,                                tooltip:ShowThreadIndicatorTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <div data-name=\"showQualifiersInEventNames\" data-control=\"Common.Controls.CheckBoxMenuItem\" data-binding=\"isChecked:showQualifiersInEventNames; mode=twoway\" data-options=\"content:ShowQualifiersInEventNames; converter=Common.CommonConverters.ResourceConverter,                                tooltip:ShowQualifiersInEventNamesTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <div data-name=\"showDurationSelfInTimeline\" data-control=\"Common.Controls.CheckBoxMenuItem\" data-binding=\"isChecked:showDurationSelfInTimeline; mode=twoway\" data-options=\"content:ShowDurationSelfInTimeline; converter=Common.CommonConverters.ResourceConverter,                                tooltip:ShowDurationSelfInTimelineTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
            <div data-name=\"showHintTextInTimeline\" data-control=\"Common.Controls.CheckBoxMenuItem\" data-binding=\"isChecked:showHintTextInTimeline; mode=twoway\" data-options=\"content:ShowHintTextInTimeline; converter=Common.CommonConverters.ResourceConverter,                                tooltip:ShowHintTextInTimelineTooltip; converter=Common.CommonConverters.ResourceConverter\"></div>\
        </ul>\
";
    ControlTemplates.VisualProfiler = VisualProfiler;
})(ControlTemplates || (ControlTemplates = {}));
//# sourceMappingURL=VisualProfilerMerged.js.map
// SIG // Begin signature block
// SIG // MIIoOQYJKoZIhvcNAQcCoIIoKjCCKCYCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // QxD+qf0vu6o2fQSCbjwjVSwsHI/bFE++SpxxDR9+zR6g
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
// SIG // ghoMMIIaCAIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCC4e7lazAnL/qF8
// SIG // 2MGEIfucVfi27Gze0izdgQnN2991vjBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAJJa+XZ2Tv5+hW1RrkNFLqkYsiujfW7Q
// SIG // DvT9XRfepgEtr8dp1WNNWtVtZkLpKyrC/DU15/6K/CTn
// SIG // DANx+gEQsvNaUva9T5tfuIwZ+uTPrnr7jt4P+RcUtBxl
// SIG // lIOhsLOJNeo0zlCxHS8m9/lNCZR8xhcYm96s0aG94XNY
// SIG // 9agv6U5JVLfBEM/sRyFBES9A9d+Sxd+nDDqlVmpIbI7w
// SIG // wylF6SUfYJNsiY3skIxrMF1SKlcvgRY1vr1BrpK+q4w7
// SIG // pqI9udhO9cHgMEIbxK7CibvqxR8FBD4SI98w4gPfIXfe
// SIG // 6J/6bMrVPtbKGwqtrB9/m82JMvPqwUXS99brOGuSAeIo
// SIG // uZKhgheWMIIXkgYKKwYBBAGCNwMDATGCF4Iwghd+Bgkq
// SIG // hkiG9w0BBwKgghdvMIIXawIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // K+JteyQ43vY/Fpd8L8ER+W96am0HuKdLjUq91hrz4dMC
// SIG // BmeJAwmZ2hgTMjAyNTAxMTYxODE0NDQuNTI3WjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjk2MDAt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR7DCCByAwggUIoAMCAQIC
// SIG // EzMAAAHviT9WoVjMqNoAAQAAAe8wDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTQ4WhcNMjUwMzA1MTg0NTQ4WjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOjk2MDAtMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEAowtY4p8M4B8ITmpGaste6BOASASrJuZF+A1JggVi
// SIG // NJRVaRIiuZmdioefbKC+J7OdqYRTEGBhuZMqQoqbp4MD
// SIG // /TaG+FRlROmqDKOYWfTcrV0eWUYG/WfDUehJiyiAkYQ+
// SIG // LKIzzIP0ZxkU3HX+/02L8jNdIy45i8ihHoDB37yMD5jP
// SIG // gD+4c0C3xMQ3agidruuBneV5Z6xTpLuVPYyzipNcu9HP
// SIG // k8LdOP0S6q7r9Xxj/C5mJrR76weE3AbAA10pnBY4dFYE
// SIG // JF+M1xcKpyBvK4GPsw6iWEDWT/DtWKOJEnJB0+N1wtKD
// SIG // ONMntvvZf602IgxTN55WXto4bTpBgjuhqok6edMSPSE6
// SIG // SV4tLxHpPAHo0+DyjBDtmz8VOt6et7mW43TeS/pYCHAj
// SIG // TAjSNEiKKUuIGlUeEsvyKA79bw1qXviNvPysvI1k3nnd
// SIG // Dtx8TyTGal+EAdyOg58Gax4ip+qBN/LYAUwggCrxKGDk
// SIG // 4O69pRdCLm7f9/lT7yrUwlG2TxThvI2bfaugBaHZb0J7
// SIG // YqJWCGLakqy8lwECJVxoWeIDXL+Hb9WAIpZ21gPQrJ2I
// SIG // fjihBa/+MODOvZSPsmqGdy/7f1H16U//snO4UvxaJXJq
// SIG // xhSUwWJUuJxNXLim5cGf1Dhtuki4QzjVlxmQyjCSjed6
// SIG // Di0kpOJXUdB5bG0+IXi5VpThJSUCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBTtTFqihcKwm7a8PT/AOt2wFUicyzAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAGBmWt2gg7nW5PRFXZD/MXEBm
// SIG // biACD0cfStQgO7kcwbfNHwtGlpLmGIUDLxxyUR1KG0jO
// SIG // FMN8ze3xxDfIYWgQ2/TUWhpxVnbR8ZifXjM+iaZ+ioiM
// SIG // ovVOToO0Ak2TJde59sOHnXaub7ZOK0Vjlb6YgwRiQESo
// SIG // l1gfbtosdFh9hDBRh6oyIY1lF4T4EeAujShTVx71r13n
// SIG // Cdll6yZ770BlwHzSRhEyWRqUeNZ1Dd4o34gkoxQ8Wphj
// SIG // 7MuYmLvdOB7/brkl2HeZtCcX9ljSUl5DxpTYaztu6T8Y
// SIG // E9ddZsgEetUt0toXOe9szfcqCRDmxPfFcuShDN2V+d3C
// SIG // 3nzfNRdQvaf3ACpBOrvVeq8spf6koMbtVKnjmQrRv4mh
// SIG // 0ijKMTOzKuEjBbD0//InjncApWKXMNAo2XuSgcdsS2uA
// SIG // dZ3hYm/CfP4EqLIzHRd5x4sh8dWHnWQ7cUkoHoHibItH
// SIG // 21IHc7FTCWL6lcOdlqkDbtBkQu/Wbla3lFSnQiZlDARw
// SIG // aU6elRaKS9CX+Eq4IPs0Q/YsG3Pbma5/vPaHaSJ2852K
// SIG // 5zyh4jtuqntXpDcJf3e66NiLT/5YIc9A6A+5BBnopCiV
// SIG // h3baO3lSaCYZK1HGp07lB9PIPjWMBukvj4wUgfzcjRem
// SIG // x2v8UfnHgGIXI8dIgYr/dDJ9CYhn5wNv4S4+Xr4U3AIw
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
// SIG // 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDTzCC
// SIG // AjcCAQEwgfmhgdGkgc4wgcsxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVyaWNhIE9w
// SIG // ZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // Tjo5NjAwLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUAS3CPNYMW3mtRMdphW18e3JPtIP+ggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOszgYYwIhgPMjAyNTAxMTYxMzAw
// SIG // NTRaGA8yMDI1MDExNzEzMDA1NFowdjA8BgorBgEEAYRZ
// SIG // CgQBMS4wLDAKAgUA6zOBhgIBADAJAgEAAgEUAgH/MAcC
// SIG // AQACAhNTMAoCBQDrNNMGAgEAMDYGCisGAQQBhFkKBAIx
// SIG // KDAmMAwGCisGAQQBhFkKAwKgCjAIAgEAAgMHoSChCjAI
// SIG // AgEAAgMBhqAwDQYJKoZIhvcNAQELBQADggEBAB3DxXYq
// SIG // 8a/uZ3AWLv1dq9ZjubVpEwmds/n5BdUE3uTmetWgihqp
// SIG // K2/mSr2+PMeHEdDyNAsZCH9hnDsPmdvr/c2MbLHnRQcs
// SIG // OWyssWkGDt8UNFmPOOKOjjSOM2dIm90UCeWOdNO9sS/F
// SIG // fWz18FNvvgidlSPop31ZxuKIAYwK/xN5ldAOn8A4G831
// SIG // wMiV9TBgO592o0DxLMlCZ5LoiLfX5a2xTSNRzB/eaHoy
// SIG // BXDJ26vHa9o4Tm24pAmLh9ChRbMGjLFD6gC4XnLwvb72
// SIG // yuFPqOl69btNyKkPkyyLMiMtqA7qLGJ+orVdJLMscha3
// SIG // iv0PHJ2zI+05RIOVEr43YMjKXA4xggQNMIIECQIBATCB
// SIG // kzB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAA
// SIG // Ae+JP1ahWMyo2gABAAAB7zANBglghkgBZQMEAgEFAKCC
// SIG // AUowGgYJKoZIhvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8G
// SIG // CSqGSIb3DQEJBDEiBCDRkl1FCHMrBeCja08hPZ7EQUZb
// SIG // tASRrjWAfzllLNGGkTCB+gYLKoZIhvcNAQkQAi8xgeow
// SIG // gecwgeQwgb0EIPBhKEW4Fo3wUz09NQx2a0DbcdsX8jov
// SIG // M5LizHmnyX+jMIGYMIGApH4wfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTACEzMAAAHviT9WoVjMqNoAAQAAAe8w
// SIG // IgQgzJKQHFbEY/y95J+IlXNRNj7I4h2j53eYv2ly9aWx
// SIG // 9kEwDQYJKoZIhvcNAQELBQAEggIAjyW/9c5oX9SP3T9d
// SIG // Hv7V3qh3Xba4k8C8Yw9rIymXHmZrmFhyNPaj/T4H5QO6
// SIG // 66qQekHTPJyYn3MIo0nUUREV4ms74sTyTy3XLSEo8f3w
// SIG // PNlOZA02CLhl5rrPAw2anSbrvWC6+v7cXNktiVQ8HSio
// SIG // Fp2yu5kKkj8jMNLQAvR2+U3/K6wEV+oHN8BRNC7GlpCf
// SIG // 6qJ5UaWMfzMntgZe1zWKj7DeypaPSc5qqtkKcFBJlOYD
// SIG // GfdzoGbhCkgvOgefSftwvU0yDdOeUJGQ86ahmzGR7u8d
// SIG // j34zsXEdSjN4FNi6vwqneP2oKJ1hsv70JNMZwS/MjcyT
// SIG // t5inpfiorc1LDgxHyW/5G41la+jQePq2MT8vZ1wFEOaN
// SIG // PYPQpGKayBNST60FUNZ5hjGaTVChERZ4BY+4pH1T7FmL
// SIG // yptQQZm+v5iCRJBJN5SRO0z+Rz+NuNeCxogwlidy0Di1
// SIG // O3k74p+39cBk6olJd43rVK9CUyuk+Bjxy2JuGpF5/U60
// SIG // CztgocpAeZ5FGpyelNvBA4Kyk6+62MpDw4yue6GRnkKe
// SIG // gvz0p25xQoBhuxfj8VwGnXIh1CceUvXl+GXQeXB+ma34
// SIG // yOyxbhcSt1+zOxEljBIXiwi+wBAPBtrD9SXwXTLlWyyb
// SIG // Tz86s5EfjlVJqgdyF9OlknvZcLv7vnJgPICtl79LYD0H
// SIG // lWJ1ucc=
// SIG // End signature block
