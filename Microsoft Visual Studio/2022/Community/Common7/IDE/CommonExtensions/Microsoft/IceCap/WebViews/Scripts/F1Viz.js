(function () {
    const previousRequire = typeof window.require === "function" && window.require;
    const registry = {};
    const aliasMap = new Map();
    const loaded = {
        require: function (moduleName) {
            if (loaded[moduleName]) {
                return loaded[moduleName];
            }
            const pluginModule = moduleName.split("!");
            if (pluginModule.length === 2) {
                const plugin = window.require(pluginModule[0]);
                plugin.load(pluginModule[1], window.require, (module) => {
                    loaded[moduleName] = module;
                }, {});
                return loaded[moduleName];
            }
            else if (pluginModule.length !== 1) {
                throw new Error(`Invalid module specifier {${moduleName}}`);
            }
            if (!registry[moduleName]) {
                if (previousRequire) {
                    return previousRequire(moduleName, true);
                }
                throw new Error(`Module {${moduleName}} not registered or there is a circular dependency`);
            }
            const registration = registry[moduleName];
            delete registry[moduleName];
            let usingExports = false;
            const resolvedDependencies = registration.dependencies.map((dependency) => {
                if (dependency === "exports") {
                    usingExports = true;
                    const moduleExports = loaded[moduleName];
                    if (typeof moduleExports !== "undefined") {
                        return moduleExports;
                    }
                    loaded[moduleName] = {};
                    return loaded[moduleName];
                }
                if (dependency === "require") {
                    return window.require;
                }
                return window.require(dependency);
            });
            const result = registration.callback.apply(loaded[moduleName], resolvedDependencies);
            loaded[moduleName] = usingExports ? loaded[moduleName] : result;
            return loaded[moduleName];
        }
    };
    window.require = Object.assign(loaded["require"], {
        config: function (configuration) {
            for (const moduleShim in configuration.shim) {
                const exported = configuration.shim[moduleShim].exports;
                loaded[moduleShim] = exported.split(".").reduce((acc, i) => acc[i], window);
            }
            for (const name in configuration.paths) {
                aliasMap.set(configuration.paths[name], name);
            }
        }
    });
    window.requirejs = window.require;
    window.define = Object.assign(function (id, deps, callback) {
        var _a, _b;
        if (typeof id !== "string") {
            const script = document.currentScript;
            const scriptFile = script.src.split(/[\s\/\\]+/).pop();
            callback = deps;
            deps = id;
            id = (_b = (_a = script.dataset.moduleId) !== null && _a !== void 0 ? _a : aliasMap.get(scriptFile)) !== null && _b !== void 0 ? _b : scriptFile.replace(/.js$/, "");
        }
        const dependencies = deps;
        registry[id] = {
            dependencies,
            callback
        };
    }, {
        amd: {}
    });
})();
define("template", [], function () {
    "use strict";
    return {
        load: function (name, req, onLoad, config) {
            var template = req(name);
            var decodedTemplate = atob(template);
            var templateElement = document.createElement("script");
            templateElement.id = name;
            templateElement.innerHTML = decodedTemplate;
            templateElement.type = "text/html";
            document.head.appendChild(templateElement);
            onLoad(decodedTemplate);
        }
    };
});
define("Misc/Logger", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLogger = exports.Logger = void 0;
    class Logger {
        info(message) {
            console.info(message);
        }
        debug(message) {
            console.debug(message);
        }
        warning(message) {
            console.warn(message);
        }
        error(message) {
            console.error(message);
        }
    }
    exports.Logger = Logger;
    var _logger;
    function getLogger() {
        if (!_logger) {
            _logger = new Logger();
        }
        return _logger;
    }
    exports.getLogger = getLogger;
});
define("Swimlane/JsonTimespan", ["require", "exports", "plugin-vs-v2", "Misc/Logger"], function (require, exports, plugin, Logger_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JsonTimespan = exports.BigNumber = void 0;
    class BigNumber {
        constructor(high, low) {
            this._isHighNegative = false;
            this._isLowNegative = false;
            if (!(typeof high === "number" && high < 0x100000000 && high >= -1 * 0x80000000) ||
                !(typeof low === "number" && low < 0x100000000 && low >= -1 * 0x80000000)) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000"));
            }
            if (high < 0) {
                high = (high >>> 0);
                this._isHighNegative = true;
            }
            if (low < 0) {
                low = (low >>> 0);
                this._isLowNegative = true;
            }
            this._value = {
                h: high,
                l: low
            };
        }
        static get oldest() {
            return BigNumber.OldestTimestampFormat;
        }
        static get latest() {
            return BigNumber.LatestTimestampFormat;
        }
        static get zero() {
            if (!BigNumber.Zero) {
                BigNumber.Zero = new BigNumber(0, 0);
            }
            return BigNumber.Zero;
        }
        static get one() {
            if (!BigNumber.One) {
                BigNumber.One = new BigNumber(0, 1);
            }
            return BigNumber.One;
        }
        get jsonValue() {
            if (!this._jsonValue) {
                var high = this._value.h;
                if (this._isHighNegative || high > 0x7fffffff) {
                    high = high << 0;
                }
                var low = this._value.l;
                if (this._isLowNegative || low > 0x7fffffff) {
                    low = low << 0;
                }
                this._jsonValue = {
                    h: high,
                    l: low
                };
            }
            return this._jsonValue;
        }
        get value() {
            if (!this._stringValue) {
                if (this._value.h > 0) {
                    this._stringValue = "0x" +
                        this._value.h.toString(16) +
                        BigNumber.padLeadingZeros(this._value.l.toString(16), 8);
                }
                else {
                    this._stringValue = "0x" + this._value.l.toString(16);
                }
            }
            return this._stringValue;
        }
        static max(first, second) {
            return first.greaterOrEqual(second) ? first : second;
        }
        static min(first, second) {
            return first.greaterOrEqual(second) ? second : first;
        }
        static add(first, second) {
            return BigNumber.addition(first, second);
        }
        static subtract(first, second) {
            if (second.greater(first)) {
                return BigNumber.zero;
            }
            var otherTime = BigNumber.convertToManagedTimeFormat(second.jsonValue);
            var negateHigh = ~(otherTime.h);
            var negateLow = ~(otherTime.l);
            var twosComplement = BigNumber.addition(new BigNumber(negateHigh, negateLow), BigNumber.one, true);
            return BigNumber.addition(first, twosComplement, true);
        }
        static multiply(first, second) {
            return BigNumber.multiplication(first, second);
        }
        static divide(first, second) {
            return BigNumber.division(first, second, false);
        }
        static modulo(first, second) {
            return BigNumber.division(first, second, true);
        }
        static addNumber(first, second) {
            if (second < 0) {
                return BigNumber.subtract(first, BigNumber.convertFromNumber(-second));
            }
            else {
                return BigNumber.addition(first, BigNumber.convertFromNumber(second));
            }
        }
        static subtractNumber(first, second) {
            if (second < 0) {
                return BigNumber.addition(first, BigNumber.convertFromNumber(-second));
            }
            else {
                return BigNumber.subtract(first, BigNumber.convertFromNumber(second));
            }
        }
        static multiplyNumber(first, second) {
            if (second < 0) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000"));
            }
            return BigNumber.multiply(first, BigNumber.convertFromNumber(second));
        }
        static divideNumber(first, second) {
            if (second < 0) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000"));
            }
            return BigNumber.divide(first, BigNumber.convertFromNumber(second));
        }
        static moduloNumber(first, second) {
            if (second < 0) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000"));
            }
            return BigNumber.modulo(first, BigNumber.convertFromNumber(second));
        }
        static convertFromNumber(num) {
            if ((num < 0) || !(num < 0x20000000000000)) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000"));
            }
            num = Math.floor(num);
            var low = num & 0xFFFFFFFF;
            if (num <= 0xFFFFFFFF) {
                return new BigNumber(0, low);
            }
            var highStr = num.toString(16);
            highStr = highStr.substring(0, highStr.length - 8);
            var high = parseInt(highStr, 16);
            return new BigNumber(high, low);
        }
        static convertFromBinaryString(bits) {
            if (!bits || bits.match("[^10]") || bits.length > 64) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000" + " " + bits));
            }
            var high = 0;
            var low = 0;
            if (bits.length <= 32) {
                low = parseInt(bits, 2);
            }
            else {
                low = parseInt(bits.slice(bits.length - 32), 2);
                high = parseInt(bits.slice(0, bits.length - 32), 2);
            }
            return new BigNumber(high, low);
        }
        static getBinaryString(timestamp) {
            var lowPart = timestamp._value.l.toString(2);
            if (timestamp._value.h > 0) {
                return timestamp._value.h.toString(2) + BigNumber.padLeadingZeros(lowPart, 32);
            }
            else {
                return lowPart;
            }
        }
        static padLeadingZeros(value, totalLength) {
            var padded = value;
            var zeros = "00000000";
            if (padded && totalLength && totalLength > 0) {
                while (totalLength - padded.length >= 8) {
                    padded = zeros + padded;
                }
                padded = zeros.substr(0, totalLength - padded.length) + padded;
            }
            return padded;
        }
        equals(other) {
            var isEqual = false;
            var otherTime = BigNumber.convertToManagedTimeFormat(other.jsonValue);
            isEqual = (this._value.h === otherTime.h && this._value.l === otherTime.l);
            return isEqual;
        }
        greater(other) {
            var isGreater = false;
            var otherTime = BigNumber.convertToManagedTimeFormat(other.jsonValue);
            if (this._value.h > otherTime.h) {
                isGreater = true;
            }
            else if (this._value.h === otherTime.h) {
                if (this._value.l > otherTime.l) {
                    isGreater = true;
                }
            }
            return isGreater;
        }
        greaterOrEqual(other) {
            var isGreaterOrEqual = false;
            var otherTime = BigNumber.convertToManagedTimeFormat(other.jsonValue);
            if (this._value.h > otherTime.h) {
                isGreaterOrEqual = true;
            }
            else if (this._value.h === otherTime.h) {
                if (this._value.l >= otherTime.l) {
                    isGreaterOrEqual = true;
                }
            }
            return isGreaterOrEqual;
        }
        compareTo(other) {
            if (this.greater(other)) {
                return 1;
            }
            else if (this.equals(other)) {
                return 0;
            }
            else {
                return -1;
            }
        }
        static convertToManagedTimeFormat(time) {
            var high = time.h < 0 ? time.h >>> 0 : time.h;
            var low = time.l < 0 ? time.l >>> 0 : time.l;
            return {
                h: high,
                l: low
            };
        }
        static addition(first, second, ignoreOverflow = false) {
            var firstTime = BigNumber.convertToManagedTimeFormat(first.jsonValue);
            var secondTime = BigNumber.convertToManagedTimeFormat(second.jsonValue);
            var low = 0;
            var high = 0;
            var low0 = (firstTime.l & 0xff) + (secondTime.l & 0xff);
            var low8 = (low0 >>> 8) + ((firstTime.l >>> 8) & 0xff) + ((secondTime.l >>> 8) & 0xff);
            low0 = low0 & 0xff;
            var low16 = (low8 >>> 8) + ((firstTime.l >>> 16) & 0xff) + ((secondTime.l >>> 16) & 0xff);
            low8 = low8 & 0xff;
            var low24 = (low16 >>> 8) + ((firstTime.l >>> 24) & 0xff) + ((secondTime.l >>> 24) & 0xff);
            low16 = low16 & 0xff;
            var high0 = (low24 >>> 8) + (firstTime.h & 0xff) + (secondTime.h & 0xff);
            low24 = low24 & 0xff;
            var high8 = (high0 >>> 8) + ((firstTime.h >>> 8) & 0xff) + ((secondTime.h >>> 8) & 0xff);
            high0 = high0 & 0xff;
            var high16 = (high8 >>> 8) + ((firstTime.h >>> 16) & 0xff) + ((secondTime.h >>> 16) & 0xff);
            high8 = high8 & 0xff;
            var high24 = (high16 >>> 8) + ((firstTime.h >>> 24) & 0xff) + ((secondTime.h >>> 24) & 0xff);
            high16 = high16 & 0xff;
            if (!ignoreOverflow && (high24 >>> 8) > 0) {
                Logger_1.getLogger().error("Addition overflow. Lost upper bits from: 0x" + high24.toString(16));
                return new BigNumber(0xffffffff, 0xffffffff);
            }
            high24 = high24 & 0xff;
            var finalLow16 = low24 << 8 | low16;
            var finalLow0 = low8 << 8 | low0;
            var finalHigh16 = high24 << 8 | high16;
            var finalHigh0 = high8 << 8 | high0;
            low = (finalLow16 << 16) | finalLow0;
            high = (finalHigh16 << 16) | finalHigh0;
            return new BigNumber(high, low);
        }
        static multiplication(first, second) {
            var firstTime = BigNumber.convertToManagedTimeFormat(first.jsonValue);
            var secondTime = BigNumber.convertToManagedTimeFormat(second.jsonValue);
            if (firstTime.h === 0 && secondTime.h === 0 &&
                0 < firstTime.l && firstTime.l <= 0x4000000 &&
                0 < secondTime.l && secondTime.l <= 0x4000000) {
                var product = firstTime.l * secondTime.l;
                return BigNumber.convertFromNumber(product);
            }
            var a1 = firstTime.l & 0xFFFF;
            var a2 = firstTime.l >>> 0x10;
            var a3 = firstTime.h & 0xFFFF;
            var a4 = firstTime.h >>> 0x10;
            var b1 = secondTime.l & 0xFFFF;
            var b2 = secondTime.l >>> 0x10;
            var b3 = secondTime.h & 0xFFFF;
            var b4 = secondTime.h >>> 0x10;
            var c1 = a1 * b1;
            var c2 = c1 >>> 0x10;
            c1 &= 0xFFFF;
            c2 += a2 * b1;
            var c3 = c2 >>> 0x10;
            c2 &= 0xFFFF;
            c2 += a1 * b2;
            c3 += c2 >>> 0x10;
            c2 &= 0xFFFF;
            c3 += a3 * b1;
            var c4 = c3 >>> 0x10;
            c3 &= 0xFFFF;
            c3 += a2 * b2;
            c4 += c3 >>> 0x10;
            c3 &= 0xFFFF;
            c3 += a1 * b3;
            c4 += c3 >>> 0x10;
            c3 &= 0xFFFF;
            c4 += a4 * b1 + a3 * b2 + a2 * b3 + a1 * b4;
            if (c4 > 0xFFFF) {
                Logger_1.getLogger().error("Multiplication overflow. Lost upper 16-bits from: 0x" + c4.toString(16));
            }
            c4 &= 0xFFFF;
            var productHigh = (c4 << 0x10) | c3;
            var productLow = (c2 << 0x10) | c1;
            return new BigNumber(productHigh, productLow);
        }
        static division(dividend, divisor, wantRemainder) {
            if (divisor.greater(dividend)) {
                return wantRemainder ? dividend : BigNumber.zero;
            }
            if (divisor.equals(BigNumber.zero)) {
                if (wantRemainder) {
                    return dividend;
                }
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000"));
            }
            var dividendBits = BigNumber.getBinaryString(dividend);
            var divisorBits = BigNumber.getBinaryString(divisor);
            var divisorLength = divisorBits.length;
            var dividendLength = dividendBits.length;
            var timeStamp2toThe53 = new BigNumber(0x200000, 0);
            if (timeStamp2toThe53.greater(dividend)) {
                var dividendNum = parseInt(dividend.value);
                var divisorNum = parseInt(divisor.value);
                return wantRemainder ? BigNumber.convertFromNumber(dividendNum % divisorNum) : BigNumber.convertFromNumber(dividendNum / divisorNum);
            }
            var quotientString = "";
            var nextIndex = divisorLength;
            var currDividend = BigNumber.convertFromBinaryString(dividendBits.substr(0, divisorLength));
            while (nextIndex <= dividendLength) {
                if (currDividend.greater(divisor) || currDividend.equals(divisor)) {
                    quotientString += "1";
                    currDividend = BigNumber.subtract(currDividend, divisor);
                }
                else {
                    quotientString += "0";
                }
                if (nextIndex !== dividendLength) {
                    currDividend = BigNumber.convertFromBinaryString(BigNumber.getBinaryString(currDividend) + dividendBits[nextIndex]);
                }
                nextIndex++;
            }
            return wantRemainder ? currDividend : BigNumber.convertFromBinaryString(quotientString);
        }
    }
    exports.BigNumber = BigNumber;
    BigNumber.OldestTimestampFormat = {
        h: 0,
        l: 0
    };
    BigNumber.LatestTimestampFormat = {
        h: 0xffffffff,
        l: 0xffffffff
    };
    class JsonTimespan {
        constructor(begin, end) {
            if (begin.greater(end)) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000"));
            }
            this._begin = begin;
            this._end = end;
        }
        get begin() {
            return this._begin;
        }
        get end() {
            return this._end;
        }
        get elapsed() {
            if (!this._elapsed) {
                this._elapsed = BigNumber.subtract(this.end, this.begin);
            }
            return this._elapsed;
        }
        equals(other) {
            return this.begin.equals(other.begin) && this.end.equals(other.end);
        }
        contains(time) {
            return time.greaterOrEqual(this.begin) && this.end.greaterOrEqual(time);
        }
    }
    exports.JsonTimespan = JsonTimespan;
});
define("Swimlane/Controls.Interfaces", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PointToFind = exports.TickMarkType = exports.ScaleType = void 0;
    var ScaleType;
    (function (ScaleType) {
        ScaleType[ScaleType["Left"] = 0] = "Left";
        ScaleType[ScaleType["Right"] = 1] = "Right";
    })(ScaleType = exports.ScaleType || (exports.ScaleType = {}));
    var TickMarkType;
    (function (TickMarkType) {
        TickMarkType[TickMarkType["Big"] = 0] = "Big";
        TickMarkType[TickMarkType["Medium"] = 1] = "Medium";
        TickMarkType[TickMarkType["Small"] = 2] = "Small";
    })(TickMarkType = exports.TickMarkType || (exports.TickMarkType = {}));
    var PointToFind;
    (function (PointToFind) {
        PointToFind[PointToFind["LessThanOrEqual"] = 0] = "LessThanOrEqual";
        PointToFind[PointToFind["Nearest"] = 1] = "Nearest";
        PointToFind[PointToFind["GreaterThanOrEqual"] = 2] = "GreaterThanOrEqual";
    })(PointToFind = exports.PointToFind || (exports.PointToFind = {}));
});
define("Swimlane/AggregatedEvent", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AggregatedEvent = void 0;
    class AggregatedEvent {
        constructor() {
            this._eventListeners = [];
        }
        invokeEvent(args) {
            const listeners = this._eventListeners.slice();
            listeners.forEach((func) => func(args));
        }
        addEventListener(func, options) {
            let callback = func;
            if (options && options.once) {
                const handler = (args) => {
                    this.removeEventListener(handler);
                    func(args);
                };
                callback = handler;
            }
            this._eventListeners.push(callback);
        }
        removeEventListener(func) {
            var location = this._eventListeners.indexOf(func);
            if (location > -1) {
                this._eventListeners.splice(location, 1);
            }
        }
        dispose() {
            this._eventListeners = null;
        }
    }
    exports.AggregatedEvent = AggregatedEvent;
});
define("Misc/Cancellation", ["require", "exports", "Swimlane/AggregatedEvent"], function (require, exports, AggregatedEvent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CancellationTokenSource = exports.MutableToken = exports.CancellationToken = exports.CanceledError = void 0;
    class CanceledError extends Error {
        constructor(message = "The operation was canceled.") {
            super(message);
            this.name = "Canceled";
        }
    }
    exports.CanceledError = CanceledError;
    const shortcutCallbacks = new WeakMap();
    const shortcutEvent = Object.freeze({
        addEventListener: (callback) => {
            const timeout = window.setTimeout(() => {
                shortcutCallbacks.delete(callback);
                callback();
            }, 0);
            shortcutCallbacks.set(callback, timeout);
        },
        removeEventListener: (callback) => {
            window.clearTimeout(shortcutCallbacks.get(callback));
            shortcutCallbacks.delete(callback);
        }
    });
    var CancellationToken;
    (function (CancellationToken) {
        CancellationToken.None = Object.freeze({
            isCancellationRequested: false,
            onCancellationRequested: {
                addEventListener: () => { },
                removeEventListener: () => { }
            },
            throwIfCancellationRequested: () => { }
        });
        CancellationToken.Cancelled = Object.freeze({
            isCancellationRequested: true,
            onCancellationRequested: shortcutEvent,
            throwIfCancellationRequested: () => {
                throw new CanceledError();
            }
        });
    })(CancellationToken = exports.CancellationToken || (exports.CancellationToken = {}));
    class MutableToken {
        constructor() {
            this._isCancelled = false;
        }
        cancel() {
            if (!this._isCancelled) {
                this._isCancelled = true;
                if (this._cancellationEvent) {
                    this._cancellationEvent.invokeEvent();
                    this.dispose();
                }
            }
        }
        throwIfCancellationRequested() {
            if (this._isCancelled) {
                throw new CanceledError();
            }
        }
        dispose() {
            if (this._cancellationEvent) {
                this._cancellationEvent.dispose();
                this._cancellationEvent = null;
            }
        }
        get isCancellationRequested() {
            return this._isCancelled;
        }
        get onCancellationRequested() {
            if (this._isCancelled) {
                return shortcutEvent;
            }
            if (!this._cancellationEvent) {
                this._cancellationEvent = new AggregatedEvent_1.AggregatedEvent();
            }
            return this._cancellationEvent;
        }
    }
    exports.MutableToken = MutableToken;
    class CancellationTokenSource {
        get token() {
            if (!this._token) {
                this._token = new MutableToken();
            }
            return this._token;
        }
        cancel() {
            if (!this._token) {
                this._token = CancellationToken.Cancelled;
            }
            else if (this._token instanceof MutableToken) {
                this._token.cancel();
            }
        }
        dispose() {
            if (!this._token) {
                this._token = CancellationToken.None;
            }
            else if (this._token instanceof MutableToken) {
                this._token.dispose();
            }
        }
    }
    exports.CancellationTokenSource = CancellationTokenSource;
});
define("CpuUsage.Interfaces", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColumnType = exports.ColumnDisplayType = exports.ColumnJustification = exports.JmcState = exports.AggregateType = exports.SortDirection = exports.DataLoadEvent = void 0;
    var DataLoadEvent;
    (function (DataLoadEvent) {
        DataLoadEvent[DataLoadEvent["DataLoadStart"] = 0] = "DataLoadStart";
        DataLoadEvent[DataLoadEvent["DataLoadCompleted"] = 1] = "DataLoadCompleted";
        DataLoadEvent[DataLoadEvent["DataLoadFailed"] = 2] = "DataLoadFailed";
        DataLoadEvent[DataLoadEvent["DataLoadCanceled"] = 3] = "DataLoadCanceled";
    })(DataLoadEvent = exports.DataLoadEvent || (exports.DataLoadEvent = {}));
    var SortDirection;
    (function (SortDirection) {
        SortDirection[SortDirection["Asc"] = 1] = "Asc";
        SortDirection[SortDirection["Desc"] = 2] = "Desc";
    })(SortDirection = exports.SortDirection || (exports.SortDirection = {}));
    var AggregateType;
    (function (AggregateType) {
        AggregateType[AggregateType["Unknown"] = 0] = "Unknown";
        AggregateType[AggregateType["SystemCode"] = 1] = "SystemCode";
        AggregateType[AggregateType["JmcRejected"] = 2] = "JmcRejected";
        AggregateType[AggregateType["ResumingAsyncMethod"] = 3] = "ResumingAsyncMethod";
    })(AggregateType = exports.AggregateType || (exports.AggregateType = {}));
    var JmcState;
    (function (JmcState) {
        JmcState[JmcState["UnknownCode"] = 0] = "UnknownCode";
        JmcState[JmcState["SystemCode"] = 1] = "SystemCode";
        JmcState[JmcState["LibraryCode"] = 2] = "LibraryCode";
        JmcState[JmcState["UserCode"] = 3] = "UserCode";
        JmcState[JmcState["MarkedHiddenCode"] = 4] = "MarkedHiddenCode";
    })(JmcState = exports.JmcState || (exports.JmcState = {}));
    var ColumnJustification;
    (function (ColumnJustification) {
        ColumnJustification[ColumnJustification["Unknown"] = 0] = "Unknown";
        ColumnJustification[ColumnJustification["Left"] = 1] = "Left";
        ColumnJustification[ColumnJustification["Right"] = 2] = "Right";
        ColumnJustification[ColumnJustification["Center"] = 3] = "Center";
    })(ColumnJustification = exports.ColumnJustification || (exports.ColumnJustification = {}));
    var ColumnDisplayType;
    (function (ColumnDisplayType) {
        ColumnDisplayType[ColumnDisplayType["Unknown"] = 0] = "Unknown";
        ColumnDisplayType[ColumnDisplayType["Counter"] = 1] = "Counter";
        ColumnDisplayType[ColumnDisplayType["Time"] = 2] = "Time";
        ColumnDisplayType[ColumnDisplayType["Hex"] = 3] = "Hex";
        ColumnDisplayType[ColumnDisplayType["ID"] = 4] = "ID";
    })(ColumnDisplayType = exports.ColumnDisplayType || (exports.ColumnDisplayType = {}));
    var ColumnType;
    (function (ColumnType) {
        ColumnType[ColumnType["Unknown"] = 0] = "Unknown";
        ColumnType[ColumnType["Counter"] = 1] = "Counter";
        ColumnType[ColumnType["Percent"] = 2] = "Percent";
        ColumnType[ColumnType["String"] = 3] = "String";
        ColumnType[ColumnType["SignedCounter"] = 4] = "SignedCounter";
    })(ColumnType = exports.ColumnType || (exports.ColumnType = {}));
});
define("DAO/ReportDAO", ["require", "exports", "plugin-vs-v2", "Swimlane/JsonTimespan"], function (require, exports, plugin, JsonTimespan_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReportDAO = exports.AdditionalReportData = exports.TimeType = void 0;
    var TimeType;
    (function (TimeType) {
        TimeType[TimeType["CpuTicks"] = 0] = "CpuTicks";
        TimeType[TimeType["Milliseconds"] = 1] = "Milliseconds";
    })(TimeType = exports.TimeType || (exports.TimeType = {}));
    var AdditionalReportData;
    (function (AdditionalReportData) {
        AdditionalReportData[AdditionalReportData["Counters"] = 0] = "Counters";
        AdditionalReportData[AdditionalReportData["ObjectLifetime"] = 1] = "ObjectLifetime";
        AdditionalReportData[AdditionalReportData["TierInteractions"] = 2] = "TierInteractions";
    })(AdditionalReportData = exports.AdditionalReportData || (exports.AdditionalReportData = {}));
    var _reportMarshalerProxy = null;
    class ReportDAO {
        constructor() {
            if (_reportMarshalerProxy === null) {
                _reportMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.ReportMarshaler", {}, true);
            }
        }
        getReportSummary() {
            return _reportMarshalerProxy._call("reportSummary")
                .then(dto => {
                return {
                    totalTime: new JsonTimespan_1.JsonTimespan(new JsonTimespan_1.BigNumber(dto.totalTime.begin.h, dto.totalTime.begin.l), new JsonTimespan_1.BigNumber(dto.totalTime.end.h, dto.totalTime.end.l)),
                    displayTimeType: dto.displayTimeType,
                    isSerialized: dto.isSerialized,
                    additionalReportData: dto.additionalReportData
                };
            });
        }
        saveReport() {
            return _reportMarshalerProxy._call("saveReport");
        }
        exportReport() {
            return _reportMarshalerProxy._call("exportReport");
        }
        viewActivated(view) {
            return _reportMarshalerProxy._call("viewActivated", view);
        }
        showSourceBrowser(show) {
            return _reportMarshalerProxy._call("showSourceBrowser", show);
        }
    }
    exports.ReportDAO = ReportDAO;
});
define("Misc/CpuSamplingUtilities", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CpuSamplingUtilities = void 0;
    class CpuSamplingUtilities {
        static numberComparator(left, right) {
            return left - right;
        }
        static asyncComputed(asyncFunc, hasChanged) {
            var observedResult = ko.observable();
            var dataLoadPromise;
            var asyncComputed = observedResult;
            var reevaluateTrigger = ko.observable().extend({ notify: "always" });
            asyncComputed.reevaluate = () => reevaluateTrigger.valueHasMutated();
            asyncComputed["_asyncRunner"] = ko.computed(() => {
                reevaluateTrigger();
                dataLoadPromise = asyncFunc();
                dataLoadPromise.then((result) => {
                    dataLoadPromise = null;
                    observedResult(result);
                }, () => {
                    dataLoadPromise = null;
                });
            });
            if (hasChanged) {
                hasChanged.addEventListener(() => asyncComputed.reevaluate());
            }
            return asyncComputed;
        }
        static areBigNumbersEqual(left, right) {
            return (!left && !right) ||
                (left && right && left.h === right.h && left.l === right.l);
        }
        static areTimespansEqual(left, right) {
            return (!left && !right) ||
                (left && right && left.equals(right));
        }
        static localizeNumber(value, options) {
            var formatKey = JSON.stringify(options || {});
            var numberFormatter = CpuSamplingUtilities.NumberFormatterMap[formatKey];
            if (!numberFormatter) {
                let formatRegion = plugin.Culture.formatRegion;
                var cachedFormat = (new Intl.NumberFormat(formatRegion, options));
                numberFormatter = (value) => cachedFormat.format(value);
                CpuSamplingUtilities.NumberFormatterMap[formatKey] = numberFormatter;
            }
            return numberFormatter(value);
        }
    }
    exports.CpuSamplingUtilities = CpuSamplingUtilities;
    CpuSamplingUtilities.NumberFormatterMap = {};
    CpuSamplingUtilities.Initialize = (() => {
        plugin.Culture.addEventListener("culturechanged", () => CpuSamplingUtilities.NumberFormatterMap = {});
    })();
});
define("ViewModels/DynamicTreeRowViewModel", ["require", "exports", "CpuUsage.Interfaces", "DAO/ReportDAO", "Misc/CpuSamplingUtilities", "ViewModels/MainViewModel", "template!DynamicTreeRowView"], function (require, exports, CpuUsage_Interfaces_1, ReportDAO_1, CpuSamplingUtilities_1, MainViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicTreeRowViewModel = void 0;
    class DynamicTreeRowViewModel {
        constructor(parent, dto, columnConfig, depth, onInvoke) {
            this._selected = ko.observable(false);
            this._expanded = null;
            this._isHotPath = ko.observable(false);
            this._isHotItem = ko.observable(false);
            this._parent = parent;
            this._dto = dto;
            this._columnConfig = columnConfig;
            this._depth = depth;
            this._onInvoke = onInvoke;
            if (dto.c !== null && typeof dto.c !== "undefined") {
                this._expanded = ko.observable(false);
                this._children = ko.observableArray(dto.c.map((childDto) => new DynamicTreeRowViewModel(this, childDto, columnConfig, this._depth + 1)));
            }
        }
        get parent() {
            return this._parent;
        }
        get templateName() {
            return "DynamicTreeRowView";
        }
        get id() {
            return this._dto.id;
        }
        get depth() {
            return this._depth;
        }
        get dto() {
            return this._dto;
        }
        get columns() {
            var frag = document.createDocumentFragment();
            for (var i = 0; i < this._dto.d.length; ++i) {
                var colData = this._dto.d[i];
                var colConfig = this._columnConfig[i];
                var col = document.createElement("td");
                col.setAttribute("role", "gridcell");
                col.setAttribute("data-columnid", colData.i);
                switch (colConfig.justification) {
                    case CpuUsage_Interfaces_1.ColumnJustification.Center:
                        col.style.textAlign = "center";
                        break;
                    case CpuUsage_Interfaces_1.ColumnJustification.Right:
                        col.style.textAlign = "right";
                        break;
                    case CpuUsage_Interfaces_1.ColumnJustification.Left:
                    default:
                        col.style.textAlign = "left";
                        break;
                }
                if (i === 0) {
                    var indent = document.createElement("span");
                    indent.innerHTML = "&nbsp;";
                    indent.setAttribute("data-bind", "rowIndent: depth");
                    col.appendChild(indent);
                    var expander = document.createElement("div");
                    expander.setAttribute("data-bind", "treeGridExpander: expanded");
                    col.appendChild(expander);
                    var hot = document.createElement("div");
                    hot.className = "hotHighlight";
                    hot.setAttribute("data-bind", "css: { hotPath: isHotPath() && $parent.showHotPathHighlighting(), hotItem: isHotItem() && $parent.showHotPathHighlighting() }");
                    col.appendChild(hot);
                    var text = document.createElement("span");
                    text.innerText = this.formatValue(colData.v, colConfig.displayType, colConfig.type);
                    col.appendChild(text);
                }
                else {
                    col.innerText = this.formatValue(colData.v, colConfig.displayType, colConfig.type);
                }
                frag.appendChild(col);
            }
            return frag;
        }
        get isHotPath() {
            return this._isHotPath;
        }
        get isHotItem() {
            return this._isHotItem;
        }
        get functionLineNumber() {
            for (var i = 0; i < this._dto.d.length; ++i) {
                if (this._dto.d[i].i === "LineNumber") {
                    return this._dto.d[i].v;
                }
            }
            return null;
        }
        get name() {
            for (var i = 0; i < this._dto.d.length; ++i) {
                if (this._dto.d[i].i === "Name"
                    || this._dto.d[i].i === "FunctionName"
                    || this._dto.d[i].i === "TypeFunctionName"
                    || this._dto.d[i].i === "ProcThreadName") {
                    return this._dto.d[i].v;
                }
            }
            return null;
        }
        get commandText() {
            for (var i = 0; i < this._dto.d.length; ++i) {
                if (this._dto.d[i].i === "CommandText") {
                    return this._dto.d[i].v;
                }
            }
            return null;
        }
        get selected() {
            return this._selected;
        }
        get expanded() {
            return this._expanded;
        }
        get children() {
            return this._children;
        }
        invoke() {
            if (!this._onInvoke) {
                return;
            }
            this._onInvoke(this._dto);
        }
        formatValue(value, displayType, columnType) {
            if (displayType === CpuUsage_Interfaces_1.ColumnDisplayType.Hex) {
                return value.toString(16);
            }
            else if (displayType === CpuUsage_Interfaces_1.ColumnDisplayType.Time) {
                if (MainViewModel_1.getTimeDisplay() === ReportDAO_1.TimeType.Milliseconds) {
                    return CpuSamplingUtilities_1.CpuSamplingUtilities.localizeNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                else {
                    return CpuSamplingUtilities_1.CpuSamplingUtilities.localizeNumber(value);
                }
            }
            else if (columnType === CpuUsage_Interfaces_1.ColumnType.Percent) {
                return CpuSamplingUtilities_1.CpuSamplingUtilities.localizeNumber(value, { style: 'percent', minimumFractionDigits: 2 });
            }
            else if (displayType === CpuUsage_Interfaces_1.ColumnDisplayType.Counter && (columnType === CpuUsage_Interfaces_1.ColumnType.Counter || columnType === CpuUsage_Interfaces_1.ColumnType.SignedCounter)) {
                return CpuSamplingUtilities_1.CpuSamplingUtilities.localizeNumber(value);
            }
            else {
                return value;
            }
        }
    }
    exports.DynamicTreeRowViewModel = DynamicTreeRowViewModel;
});
define("DAO/FunctionDetailsDAO", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FunctionDetailsDAO = exports.PerfMetricType = void 0;
    var PerfMetricType;
    (function (PerfMetricType) {
        PerfMetricType[PerfMetricType["Text"] = 0] = "Text";
        PerfMetricType[PerfMetricType["Number"] = 1] = "Number";
        PerfMetricType[PerfMetricType["Percent"] = 2] = "Percent";
        PerfMetricType[PerfMetricType["Time"] = 3] = "Time";
    })(PerfMetricType = exports.PerfMetricType || (exports.PerfMetricType = {}));
    var _functionDetailsMarshalerProxy = null;
    class FunctionDetailsDAO {
        constructor() {
            if (_functionDetailsMarshalerProxy === null) {
                _functionDetailsMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.FunctionDetailsMarshaler", {}, true);
            }
        }
        getData(metricIndex, context) {
            return _functionDetailsMarshalerProxy._call("callerCallee", metricIndex, context);
        }
        updateSourceBrowser(contextId, metricIndex) {
            return _functionDetailsMarshalerProxy._call("updateSourceBrowser", contextId, metricIndex);
        }
    }
    exports.FunctionDetailsDAO = FunctionDetailsDAO;
});
define("globals", ["require", "exports", "CpuUsage.Interfaces", "DAO/FunctionDetailsDAO", "Misc/CpuSamplingUtilities"], function (require, exports, CpuUsage_Interfaces_2, FunctionDetailsDAO_1, CpuSamplingUtilities) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    window.DataLoadEvent = CpuUsage_Interfaces_2.DataLoadEvent;
    window.PerfMetricType = FunctionDetailsDAO_1.PerfMetricType;
    window.CpuSamplingUtilities = CpuSamplingUtilities.CpuSamplingUtilities;
});
define("Misc/KeyCodes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MouseCodes = exports.KeyCodes = void 0;
    var KeyCodes;
    (function (KeyCodes) {
        KeyCodes[KeyCodes["Tab"] = 9] = "Tab";
        KeyCodes[KeyCodes["Enter"] = 13] = "Enter";
        KeyCodes[KeyCodes["Shift"] = 16] = "Shift";
        KeyCodes[KeyCodes["Ctrl"] = 17] = "Ctrl";
        KeyCodes[KeyCodes["Escape"] = 27] = "Escape";
        KeyCodes[KeyCodes["Space"] = 32] = "Space";
        KeyCodes[KeyCodes["PageUp"] = 33] = "PageUp";
        KeyCodes[KeyCodes["PageDown"] = 34] = "PageDown";
        KeyCodes[KeyCodes["End"] = 35] = "End";
        KeyCodes[KeyCodes["Home"] = 36] = "Home";
        KeyCodes[KeyCodes["ArrowLeft"] = 37] = "ArrowLeft";
        KeyCodes[KeyCodes["ArrowFirst"] = 37] = "ArrowFirst";
        KeyCodes[KeyCodes["ArrowUp"] = 38] = "ArrowUp";
        KeyCodes[KeyCodes["ArrowRight"] = 39] = "ArrowRight";
        KeyCodes[KeyCodes["ArrowDown"] = 40] = "ArrowDown";
        KeyCodes[KeyCodes["ArrowLast"] = 40] = "ArrowLast";
        KeyCodes[KeyCodes["Delete"] = 46] = "Delete";
        KeyCodes[KeyCodes["B"] = 66] = "B";
        KeyCodes[KeyCodes["C"] = 67] = "C";
        KeyCodes[KeyCodes["Plus"] = 107] = "Plus";
        KeyCodes[KeyCodes["Minus"] = 109] = "Minus";
        KeyCodes[KeyCodes["F1"] = 112] = "F1";
        KeyCodes[KeyCodes["F2"] = 113] = "F2";
        KeyCodes[KeyCodes["F3"] = 114] = "F3";
        KeyCodes[KeyCodes["F4"] = 115] = "F4";
        KeyCodes[KeyCodes["F5"] = 116] = "F5";
        KeyCodes[KeyCodes["F6"] = 117] = "F6";
        KeyCodes[KeyCodes["F7"] = 118] = "F7";
        KeyCodes[KeyCodes["F8"] = 119] = "F8";
        KeyCodes[KeyCodes["F9"] = 120] = "F9";
        KeyCodes[KeyCodes["F10"] = 121] = "F10";
        KeyCodes[KeyCodes["F11"] = 122] = "F11";
        KeyCodes[KeyCodes["F12"] = 123] = "F12";
    })(KeyCodes = exports.KeyCodes || (exports.KeyCodes = {}));
    var MouseCodes;
    (function (MouseCodes) {
        MouseCodes[MouseCodes["Left"] = 1] = "Left";
        MouseCodes[MouseCodes["Right"] = 3] = "Right";
        MouseCodes[MouseCodes["Middle"] = 2] = "Middle";
    })(MouseCodes = exports.MouseCodes || (exports.MouseCodes = {}));
});
define("Misc/Utilities", ["require", "exports", "plugin-vs-v2", "Swimlane/JsonTimespan", "Misc/Logger"], function (require, exports, plugin, JsonTimespan_2, Logger_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Utilities = void 0;
    class Utilities {
        static findChildById(element, id) {
            var queue = [];
            var currentElement = element;
            while (currentElement) {
                if (currentElement.id === id) {
                    return currentElement;
                }
                for (var child = 0; child < currentElement.children.length; ++child) {
                    queue.push(currentElement.children[child]);
                }
                currentElement = queue.shift();
            }
            return null;
        }
        static findLessThan(list, value, comp, minIndex = 0, maxIndex = list.length - 1) {
            if (maxIndex === minIndex) {
                return minIndex;
            }
            else if (maxIndex - minIndex <= 1) {
                return comp(list[maxIndex], value) ? maxIndex : minIndex;
            }
            var index = Math.floor((maxIndex + minIndex) / 2);
            return comp(value, list[index]) ?
                Utilities.findLessThan(list, value, comp, minIndex, index) :
                Utilities.findLessThan(list, value, comp, index, maxIndex);
        }
        static findGreaterThan(list, value, comp, minIndex = 0, maxIndex = list.length - 1) {
            if (maxIndex === minIndex) {
                return maxIndex;
            }
            else if (maxIndex - minIndex <= 1) {
                return comp(value, list[minIndex]) ? minIndex : maxIndex;
            }
            var index = Math.floor((maxIndex + minIndex) / 2);
            return comp(value, list[index]) ?
                Utilities.findGreaterThan(list, value, comp, minIndex, index) :
                Utilities.findGreaterThan(list, value, comp, index, maxIndex);
        }
        static scaleToRange(value, valueMin, valueMax, newMin, newMax) {
            if (valueMax === valueMin) {
                return 0;
            }
            return ((newMax - newMin) * (value - valueMin)) / (valueMax - valueMin) + newMin;
        }
        static linearInterpolate(x, x0, y0, x1, y1) {
            if (x0.equals(x1)) {
                return y0;
            }
            var xDelta = parseInt(JsonTimespan_2.BigNumber.subtract(x, x0).value);
            var xRange = parseInt(JsonTimespan_2.BigNumber.subtract(x1, x0).value);
            return y0 + (y1 - y0) * xDelta / xRange;
        }
        static convertToPixel(time, timeRange, pixelRange, validateInput = true) {
            if (validateInput && (timeRange.elapsed.equals(JsonTimespan_2.BigNumber.zero) || pixelRange <= 0)) {
                return 0;
            }
            var sign = 1;
            var timeFromRangeStart;
            if (timeRange.begin.greater(time)) {
                sign = -1;
                timeFromRangeStart = parseInt(JsonTimespan_2.BigNumber.subtract(timeRange.begin, time).value);
            }
            else {
                timeFromRangeStart = parseInt(JsonTimespan_2.BigNumber.subtract(time, timeRange.begin).value);
            }
            return sign * (timeFromRangeStart / parseInt(timeRange.elapsed.value)) * pixelRange;
        }
        static getTimestampAtPixel(numPixelsFromLeft, pixelRange, timeRange) {
            if (pixelRange > 0) {
                return JsonTimespan_2.BigNumber.addNumber(timeRange.begin, (parseInt(timeRange.elapsed.value) / pixelRange) * numPixelsFromLeft);
            }
            return JsonTimespan_2.BigNumber.zero;
        }
        static translateNumPixelToDuration(pixels, pixelRange, timeRange) {
            if (pixelRange > 0) {
                return (parseInt(timeRange.elapsed.value) / pixelRange) * pixels;
            }
            return 0;
        }
        static formatNumber(value, decimalPlaces) {
            var valueToFormat;
            if (decimalPlaces === null || typeof (decimalPlaces) === "undefined") {
                valueToFormat = value.toString();
            }
            else {
                valueToFormat = value.toFixed(decimalPlaces);
            }
            var numberFormat = Utilities.getNumberFormat();
            return valueToFormat.replace(".", numberFormat.numberDecimalSeparator);
        }
        static formatString(stringToFormat, ...values) {
            var formatted = stringToFormat;
            values.forEach((value, i) => {
                formatted = formatted.replace("{" + i + "}", value);
            });
            return formatted;
        }
        static getNumberFormat() {
            let nf = plugin.Culture.numberFormat;
            if (!nf) {
                nf = { numberDecimalSeparator: "." };
            }
            return nf;
        }
        static containsPoint(boundingRect, x, y) {
            return boundingRect.left <= x &&
                boundingRect.right >= x &&
                boundingRect.top <= y &&
                boundingRect.bottom >= y;
        }
        static getSVGPlaceHolder(token) {
            var svg = document.createElement("div");
            svg.setAttribute("data-plugin-svg", token);
            return svg;
        }
        static setCapture(element) {
            if (!element) {
                return;
            }
            try {
                if (element.setPointerCapture) {
                    element.setPointerCapture(Utilities.MousePointerId);
                    return;
                }
            }
            catch (e) {
                Logger_2.getLogger().error(e.message);
            }
        }
        static releaseCapture(element) {
            if (!element) {
                return;
            }
            try {
                if (element.releasePointerCapture) {
                    element.releasePointerCapture(Utilities.MousePointerId);
                    return;
                }
            }
            catch (e) {
                Logger_2.getLogger().error(e.message);
            }
        }
    }
    exports.Utilities = Utilities;
    Utilities.MousePointerId = 1;
});
define("Misc/InformationBarControl", ["require", "exports", "plugin-vs-v2", "Misc/KeyCodes", "Misc/Utilities"], function (require, exports, plugin, KeyCodes_1, Utilities_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InformationBarControl = void 0;
    class InformationBarControl {
        constructor(messageToken, onClose, linkTextToken, linkOnClick) {
            this._container = document.createElement("div");
            this._container.classList.add("infoBarContainer");
            this._messageToken = messageToken;
            var icon = document.createElement("div");
            icon.classList.add("icon");
            icon.appendChild(Utilities_1.Utilities.getSVGPlaceHolder("infoIcon"));
            plugin.Theme.processInjectedSvg(icon);
            icon.setAttribute("role", "img");
            this._container.appendChild(icon);
            var message = document.createElement("span");
            message.classList.add("message");
            message.innerHTML = plugin.Resources.getString(messageToken);
            this._container.appendChild(message);
            if (linkTextToken) {
                var link = document.createElement("a");
                link.text = plugin.Resources.getString(linkTextToken);
                link.setAttribute("aria-label", plugin.Resources.getString(linkTextToken));
                link.tabIndex = 0;
                link.onclick = linkOnClick;
                link.onkeydown = (evt) => {
                    if (KeyCodes_1.KeyCodes.Enter === evt.keyCode && linkOnClick) {
                        linkOnClick();
                    }
                };
                this._container.appendChild(link);
            }
            var close = document.createElement("div");
            close.classList.add("closeButton");
            close.innerHTML = "r";
            close.tabIndex = 0;
            close.setAttribute("role", "button");
            close.setAttribute("aria-label", plugin.Resources.getString("InfoBar_Close"));
            close.onclick = onClose;
            close.onkeydown = (evt) => {
                if (KeyCodes_1.KeyCodes.Enter === evt.keyCode) {
                    onClose();
                }
            };
            this._container.appendChild(close);
        }
        get container() {
            return this._container;
        }
        get messageToken() {
            return this._messageToken;
        }
    }
    exports.InformationBarControl = InformationBarControl;
});
define("PluginComponentLoader", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerPluginComponentLoader = void 0;
    var pluginComponentLoader = {
        loadTemplate(componentName, templateConfig, callback) {
            if (!ko.components.defaultLoader) {
                return;
            }
            var template = require("template!" + templateConfig);
            ko.components.defaultLoader.loadTemplate(componentName, template, callback);
        }
    };
    function registerPluginComponentLoader() {
        ko.components.loaders.unshift(pluginComponentLoader);
    }
    exports.registerPluginComponentLoader = registerPluginComponentLoader;
});
define("ErrorReporting", ["require", "exports", "plugin-vs-v2", "Misc/Logger"], function (require, exports, plugin, Logger_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InitializeErrorReporting = void 0;
    function InitializeErrorReporting() {
        window.onerror = (message, filename, lineno, colno, error) => {
            var logger = Logger_3.getLogger();
            var errorMessage = "F1Viz script error caught in: " + (filename || "unknown script file") + " at " + lineno + "\n" + message;
            logger.error(errorMessage);
            plugin.Diagnostics.reportError(message, filename, lineno, message, colno);
            plugin.Diagnostics.terminate();
        };
    }
    exports.InitializeErrorReporting = InitializeErrorReporting;
});
define("KnockoutDeferredTaskScheduler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnableScriptedSandboxDeferredTaskScheduler = void 0;
    var knockoutDeferredTaskScheduler;
    function EnableScriptedSandboxDeferredTaskScheduler() {
        if (!knockoutDeferredTaskScheduler) {
            knockoutDeferredTaskScheduler = ko.tasks.scheduler;
        }
        var forceScheduleTask = null;
        ko.tasks.scheduler = (callback) => {
            knockoutDeferredTaskScheduler(callback);
            if (forceScheduleTask === null) {
                forceScheduleTask = setTimeout(() => {
                    forceScheduleTask = null;
                    ko.tasks.runEarly();
                }, 0);
                ko.tasks.schedule(() => {
                    if (forceScheduleTask === null) {
                        return;
                    }
                    clearTimeout(forceScheduleTask);
                    forceScheduleTask = null;
                });
            }
        };
    }
    exports.EnableScriptedSandboxDeferredTaskScheduler = EnableScriptedSandboxDeferredTaskScheduler;
});
define("Grid/ColumnResizer", ["require", "exports", "Misc/Utilities", "Swimlane/AggregatedEvent"], function (require, exports, Utilities_2, AggregatedEvent_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColumnResizer = void 0;
    class ColumnResizer {
        constructor(headerColumn, header, tableColumn, table, columnConfig, columnProvider) {
            this._resizedEvent = new AggregatedEvent_2.AggregatedEvent();
            this._leftOffset = null;
            this._columnWidth = null;
            this._initialX = null;
            this._initialHeaderWidth = null;
            this._minWidth = null;
            this._hidden = false;
            this._headerColumn = headerColumn;
            this._header = header;
            this._tableColumn = tableColumn;
            this._table = table;
            this._minWidth = 40;
            this._columnWidth = columnConfig.width;
            this._id = columnConfig.columnId;
            this._hidden = false;
            this._columnProvider = columnProvider;
            this._resizer = document.createElement("div");
            this._resizer.classList.add("columnResizer");
            this._resizer.style.width = this.width + "px";
            this._resizer.onmousedown = this.onMouseDown.bind(this);
            this._resizer.onmousemove = this.onMouseMove.bind(this);
            this._resizer.onmouseup = this.onMouseUp.bind(this);
            this._headerColumn.style.width = this._columnWidth + "px";
            this._tableColumn.style.width = this._columnWidth + "px";
            this._header.parentElement.insertAdjacentElement("afterbegin", this._resizer);
        }
        get width() {
            return 8;
        }
        get columnConfig() {
            return {
                columnId: this._id,
                isHidden: this._hidden,
                width: this._columnWidth,
            };
        }
        get resizedEvent() {
            return this._resizedEvent;
        }
        dispose() {
            this._resizedEvent.dispose();
        }
        onColumnVisiblityChanged(visible) {
            if (this._hidden !== visible) {
                return;
            }
            this._hidden = !visible;
            var delta = this._hidden ? -this._columnWidth : this._columnWidth;
            var headerWidth = parseInt(this._header.style.width.slice(0, -2));
            this._header.style.width = (headerWidth + delta) + "px";
            this._table.style.width = (headerWidth + delta) + "px";
            this._resizer.style.display = this._hidden ? "none" : "";
            if (this._hidden && document.activeElement === this._headerColumn) {
                this._headerColumn.parentElement.focus();
            }
            this._resizedEvent.invokeEvent(this);
        }
        resetLocation() {
            this._leftOffset = this._headerColumn.offsetLeft + this._headerColumn.offsetWidth - Math.floor(this.width / 2);
            this._resizer.style.left = this._leftOffset + "px";
        }
        changeWidth(delta, isIntermittent) {
            var width = Math.max(this._columnWidth + delta, this._minWidth);
            var clampedDelta = width - this._columnWidth;
            this._header.style.width = (this._initialHeaderWidth + clampedDelta) + "px";
            this._headerColumn.style.width = (this._columnWidth + clampedDelta) + "px";
            this._resizer.style.left = (this._leftOffset + clampedDelta) + "px";
            this._resizedEvent.invokeEvent(this);
            if (!isIntermittent) {
                this._table.style.width = (this._initialHeaderWidth + clampedDelta) + "px";
                this._tableColumn.style.width = (this._columnWidth + clampedDelta) + "px";
                this._columnWidth += clampedDelta;
                this._leftOffset += clampedDelta;
                this._columnProvider.onColumnChanged(this.columnConfig);
            }
        }
        onMouseDown(event) {
            if (this._initialX !== null) {
                this.onMouseUp(event);
                return;
            }
            this._initialX = event.clientX;
            this._initialHeaderWidth = parseInt(this._header.style.width.slice(0, -2));
            Utilities_2.Utilities.setCapture(this._resizer);
        }
        onMouseMove(event) {
            if (this._initialX === null) {
                return;
            }
            this.changeWidth(event.clientX - this._initialX, true);
        }
        onMouseUp(event) {
            if (this._initialX === null) {
                return;
            }
            Utilities_2.Utilities.releaseCapture(this._resizer);
            this.changeWidth(event.clientX - this._initialX, false);
            this._initialX = null;
            this._initialHeaderWidth = null;
        }
    }
    exports.ColumnResizer = ColumnResizer;
});
define("Grid/CustomBindings/VisibilityContextMenu", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["visibilityContextMenu"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var hiddenColumnArray = value.hiddenColumns;
            var contextConfig = value.columns.map((binding) => {
                var isChecked = () => {
                    return hiddenColumnArray.indexOf(binding.id) === -1;
                };
                var callback = () => {
                    if (isChecked()) {
                        hiddenColumnArray.push(binding.id);
                    }
                    else {
                        hiddenColumnArray.remove(binding.id);
                    }
                };
                return {
                    type: plugin.ContextMenu.MenuItemType.checkbox,
                    label: binding.text,
                    callback: callback,
                    checked: isChecked
                };
            });
            var contextMenu = plugin.ContextMenu.create(contextConfig);
            contextMenu.attach(element);
            var styleSheet = document.createElement("style");
            document.body.appendChild(styleSheet);
            ko.utils.domData.set(element, "visibilitySheet", styleSheet);
            ko.utils.domNodeDisposal.addDisposeCallback(element, () => document.body.removeChild(styleSheet));
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var style = ko.utils.domData.get(element, "visibilitySheet");
            var styleSheet = style.sheet;
            var hiddenColumnArray = ko.unwrap(valueAccessor().hiddenColumns);
            for (var i = 0; i < styleSheet.cssRules.length; ++i) {
                styleSheet.deleteRule(0);
            }
            if (hiddenColumnArray.length === 0) {
                return;
            }
            var selector = hiddenColumnArray.map((id) => "td[data-columnid='" + id + "'],th[data-columnid='" + id + "']");
            var rule = selector.join(",") + "{ display: none; }";
            styleSheet.insertRule(rule, 0);
        }
    };
});
define("Grid/TreeGridHeaderViewModel", ["require", "exports", "CpuUsage.Interfaces", "Misc/KeyCodes", "Grid/ColumnResizer"], function (require, exports, CpuUsage_Interfaces_3, KeyCodes_2, ColumnResizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeGridHeaderViewModel = void 0;
    class TreeGridHeaderViewModel {
        constructor(columns, columnSettingsProvider, initialSortColumnId) {
            this._hiddenColumns = ko.observableArray([]);
            this._resizers = {};
            this._syncScrollBoundFunction = this.syncScroll.bind(this);
            this._sortDirection = ko.observable(CpuUsage_Interfaces_3.SortDirection.Desc);
            this._columnOrder = ko.observableArray([]);
            this._isResizing = false;
            this._delta = 0;
            this._columnConfigLoadStatus = ko.observable(CpuUsage_Interfaces_3.DataLoadEvent.DataLoadStart);
            this._sortInfo = ko.pureComputed(() => {
                return {
                    columnId: this._sortColumnId(),
                    direction: this._sortDirection()
                };
            });
            this._columns = columns;
            this._columnSettingsProvider = columnSettingsProvider;
            this._sortColumnId = ko.observable(initialSortColumnId);
            this._columnOrder(columns.map(column => column.id));
        }
        get visibilityContextMenuBinding() {
            return {
                hiddenColumns: this._hiddenColumns,
                columns: this._columns
                    .filter(column => column.hideable)
                    .map(column => ({
                    id: column.id,
                    text: column.text
                }))
            };
        }
        get columns() {
            return this._columns;
        }
        get hiddenColumns() {
            return this._hiddenColumns;
        }
        get columnOrder() {
            return this._columnOrder;
        }
        get sortInfo() {
            return this._sortInfo;
        }
        get sortColumnId() {
            return this._sortColumnId;
        }
        get sortDirection() {
            return this._sortDirection;
        }
        get columnConfigLoadStatus() {
            return this._columnConfigLoadStatus;
        }
        onAfterDomInsert(headerContainer, bodyContainer) {
            this._headerContainer = headerContainer;
            this._bodyContainer = bodyContainer;
            this._header = this._headerContainer.querySelector("table");
            this._body = this._bodyContainer.querySelector("table");
            var headerRow = this._headerContainer.querySelector("tr");
            headerRow.tabIndex = 0;
            headerRow.onkeydown = this.onKeyDownHeader.bind(this, headerRow);
            headerRow.onkeyup = this.onKeyUpHeader.bind(this, headerRow);
            var tableWidth = 0;
            this._resizers = {};
            var columnsToHide = [];
            this._columnSettingsProvider.getColumnSettings()
                .then((columnSettings) => {
                columnSettings.forEach(column => {
                    var headerColumn = this._header.querySelector("th[data-columnid='" + column.columnId + "']");
                    headerColumn.tabIndex = -1;
                    var tableColumn = this._body.querySelector("th[data-columnid='" + column.columnId + "']");
                    var resizer = new ColumnResizer_1.ColumnResizer(headerColumn, this._header, tableColumn, this._body, column, this._columnSettingsProvider);
                    this._resizers[column.columnId] = resizer;
                    tableWidth += column.width;
                    if (column.isHidden) {
                        columnsToHide.push(column.columnId);
                    }
                    resizer.resizedEvent.addEventListener(() => this.adjustResizerLocation());
                });
                this._header.style.width = tableWidth + "px";
                this._body.style.width = tableWidth + "px";
                this.adjustResizerLocation();
                window.addEventListener("resize", this._syncScrollBoundFunction);
                this._bodyContainer.addEventListener("scroll", this._syncScrollBoundFunction);
                var headerOnScroll = () => {
                    this._bodyContainer.scrollLeft = this._headerContainer.scrollLeft;
                };
                this._headerContainer.addEventListener("scroll", headerOnScroll);
                var subscriptions = [
                    this._hiddenColumns.subscribe(this.onHiddenColumnsChanged.bind(this), null, "arrayChange"),
                    this._columnOrder.subscribe(() => this.adjustResizerLocation())
                ];
                ko.utils.domNodeDisposal.addDisposeCallback(this._bodyContainer, () => {
                    window.removeEventListener("resize", this._syncScrollBoundFunction);
                    this._bodyContainer.removeEventListener("scroll", this._syncScrollBoundFunction);
                    this._headerContainer.removeEventListener("scroll", headerOnScroll);
                    subscriptions.forEach(s => s.dispose());
                    this._hiddenColumns.removeAll();
                    for (var id in this._resizers) {
                        this._resizers[id].dispose();
                    }
                });
                this._hiddenColumns(columnsToHide);
                this._columnConfigLoadStatus(CpuUsage_Interfaces_3.DataLoadEvent.DataLoadCompleted);
            });
        }
        syncScroll() {
            var width = this._bodyContainer.clientWidth;
            var scroll = this._bodyContainer.scrollLeft;
            this._headerContainer.style.width = width + "px";
            this._headerContainer.scrollLeft = scroll;
        }
        onHiddenColumnsChanged(changes) {
            changes.forEach((change) => {
                if (change.status === "added") {
                    var resizer = this._resizers[change.value];
                    resizer.onColumnVisiblityChanged(false);
                    this._columnSettingsProvider.onColumnChanged(resizer.columnConfig);
                }
                else if (change.status === "deleted") {
                    var resizer = this._resizers[change.value];
                    resizer.onColumnVisiblityChanged(true);
                    this._columnSettingsProvider.onColumnChanged(resizer.columnConfig);
                }
            });
        }
        onKeyDownHeader(header, event) {
            this._isResizing = false;
            if (event.ctrlKey && !event.shiftKey && event.keyCode === KeyCodes_2.KeyCodes.Ctrl) {
                this._isResizing = true;
                return;
            }
            if (event.keyCode !== KeyCodes_2.KeyCodes.ArrowLeft && event.keyCode !== KeyCodes_2.KeyCodes.ArrowRight) {
                return;
            }
            else if (event.shiftKey || event.ctrlKey) {
                return;
            }
            else if (document.activeElement !== header && !header.contains(document.activeElement)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (this._isResizing) {
                if (document.activeElement !== header) {
                    this._delta += event.keyCode === KeyCodes_2.KeyCodes.ArrowRight ? 4 : -4;
                    this.resizeActiveColumnHeader(true);
                }
                return;
            }
            var isColumnHidden = (element) => element.offsetHeight === 0;
            var nextElement;
            if (event.keyCode === KeyCodes_2.KeyCodes.ArrowRight) {
                nextElement = document.activeElement === header || document.activeElement.nextElementSibling === null ?
                    header.firstElementChild :
                    document.activeElement.nextElementSibling;
                for (var i = 0; isColumnHidden(nextElement) && i < this._columns.length; ++i) {
                    nextElement = nextElement.nextElementSibling !== null ?
                        nextElement.nextElementSibling :
                        header.firstElementChild;
                }
            }
            else {
                nextElement = document.activeElement === header || document.activeElement.previousElementSibling === null ?
                    header.lastElementChild :
                    document.activeElement.previousElementSibling;
                for (var i = 0; isColumnHidden(nextElement) && i < this._columns.length; ++i) {
                    nextElement = nextElement.previousElementSibling !== null ?
                        nextElement.previousElementSibling :
                        header.lastElementChild;
                }
            }
            nextElement.focus();
        }
        onKeyUpHeader(header, event) {
            if (!this._isResizing) {
                return;
            }
            this._isResizing = event.ctrlKey;
            event.preventDefault();
            event.stopPropagation();
            this.resizeActiveColumnHeader(false);
            this._delta = 0;
        }
        resizeActiveColumnHeader(isIntermittent) {
            var colId = document.activeElement.getAttribute("data-columnid");
            if (!colId) {
                return;
            }
            this._resizers[colId].changeWidth(this._delta, isIntermittent);
        }
        adjustResizerLocation() {
            ko.tasks.runEarly();
            ko.tasks.schedule(() => {
                for (var id in this._resizers) {
                    this._resizers[id].resetLocation();
                }
            });
        }
    }
    exports.TreeGridHeaderViewModel = TreeGridHeaderViewModel;
});
define("Misc/SortFunctions", ["require", "exports", "CpuUsage.Interfaces"], function (require, exports, CpuUsage_Interfaces_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SortFunctions = void 0;
    class SortFunctions {
        static getSortFunc(columnId, columnConfig, sortDirection) {
            for (var index = 0; index < columnConfig.length; ++index) {
                if (columnConfig[index].id === columnId) {
                    if (columnConfig[index].type === CpuUsage_Interfaces_4.ColumnType.String) {
                        return SortFunctions.stringSortDto(index, sortDirection);
                    }
                    else {
                        return SortFunctions.numericSortDto(index, sortDirection);
                    }
                }
            }
            var direction = sortDirection === CpuUsage_Interfaces_4.SortDirection.Asc ? -1 : 1;
            return (left, right) => {
                return direction;
            };
        }
        static numericSortDto(columnIndex, sortDirection) {
            var direction = sortDirection === CpuUsage_Interfaces_4.SortDirection.Asc ? 1 : -1;
            return (left, right) => {
                var leftValue = left.dto.d[columnIndex].v;
                var rightValue = right.dto.d[columnIndex].v;
                if (leftValue === rightValue) {
                    return 0;
                }
                return leftValue < rightValue ? -direction : direction;
            };
        }
        static stringSortDto(columnIndex, sortDirection) {
            var direction = sortDirection === CpuUsage_Interfaces_4.SortDirection.Asc ? 1 : -1;
            return (left, right) => {
                var leftValue = left.dto.d[columnIndex].v;
                var rightValue = right.dto.d[columnIndex].v;
                leftValue = leftValue.toUpperCase();
                rightValue = rightValue.toUpperCase();
                if (leftValue === rightValue) {
                    return 0;
                }
                return leftValue < rightValue ? -direction : direction;
            };
        }
        static numberComparator(left, right) {
            return left - right;
        }
    }
    exports.SortFunctions = SortFunctions;
});
define("Misc/EventThrottler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.eventThrottler = void 0;
    function eventThrottler(callback, timeout) {
        var shouldDrop = false;
        var droppedEvent = false;
        var latestArgs = null;
        var throttle = (...args) => {
            latestArgs = args;
            if (!shouldDrop) {
                callback.apply(null, args);
                shouldDrop = true;
                window.setTimeout(() => {
                    shouldDrop = false;
                    if (droppedEvent) {
                        window.setTimeout(throttle, 0, latestArgs);
                    }
                    droppedEvent = false;
                }, timeout);
            }
            else {
                droppedEvent = true;
            }
        };
        return throttle;
    }
    exports.eventThrottler = eventThrottler;
});
define("Misc/Constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Constants = exports.SwimlaneViewConstants = void 0;
    class SwimlaneViewConstants {
        static get MinSelectionInPixels() {
            return 20;
        }
    }
    exports.SwimlaneViewConstants = SwimlaneViewConstants;
    class Constants {
        static get WindowResizeThrottle() {
            return 200;
        }
        static get GridLineZIndex() {
            return 2;
        }
        static get SelectionOverlayZIndex() {
            return 130;
        }
        static get GraphContainerZIndex() {
            return 5;
        }
        static get TimeoutImmediate() {
            return 0;
        }
        static get TooltipTimeoutMs() {
            return 750;
        }
        static get errorNameCanceled() {
            return "Canceled";
        }
        static get samplesPerSecond() {
            return 1000;
        }
    }
    exports.Constants = Constants;
});
define("Grid/CustomBindings/ArrangeableColumns", ["require", "exports", "Misc/KeyCodes", "Misc/Utilities"], function (require, exports, KeyCodes_3, Utilities_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ArrangeMovementDelta = 10;
    ko.bindingHandlers["arrangeableColumns"] = {
        after: ['foreach'],
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var addEventListeners = (cell) => {
                var hoverElement;
                var dropLocation;
                var cursorOffset;
                var initialX;
                var dropCol;
                var updateDropPosition = (x, y) => {
                    var cells = element.querySelectorAll("th");
                    for (var i = 0; i < cells.length; ++i) {
                        var rect = cells[i].getBoundingClientRect();
                        if (rect.left <= x && x <= rect.right) {
                            dropCol = cells[i];
                            var boundingLeftOffset = Math.round((x - rect.left) / rect.width) * rect.width;
                            dropLocation.style.left = (rect.left + boundingLeftOffset - 4) + "px";
                            return;
                        }
                    }
                };
                var mouseUp = (event) => {
                    cell.onmousemove = null;
                    cell.onmouseup = null;
                    Utilities_3.Utilities.releaseCapture(cell);
                    if (hoverElement) {
                        updateDropPosition(event.clientX, event.clientY);
                        document.body.removeChild(hoverElement);
                        document.body.removeChild(dropLocation);
                        hoverElement = null;
                        dropLocation = null;
                        var colIdToMove = cell.getAttribute("data-columnid");
                        var colIdToDropOnto = dropCol.getAttribute("data-columnid");
                        if (colIdToMove === colIdToDropOnto) {
                            return;
                        }
                        var observableCols = valueAccessor();
                        var cols = observableCols();
                        cols = cols.filter(value => value !== colIdToMove);
                        var rect = dropCol.getBoundingClientRect();
                        var boundingLeftOffset = Math.round((event.clientX - rect.left) / rect.width) * rect.width;
                        var index = cols.indexOf(dropCol.getAttribute("data-columnid"));
                        if (boundingLeftOffset !== 0) {
                            index++;
                        }
                        cols.splice(index, 0, colIdToMove);
                        observableCols(cols);
                    }
                };
                var mouseMove = (event) => {
                    if (event.which !== KeyCodes_3.MouseCodes.Left) {
                        mouseUp(event);
                        return;
                    }
                    var x = event.clientX;
                    var y = event.clientY;
                    if (!hoverElement && Math.abs(x - initialX) < ArrangeMovementDelta) {
                        return;
                    }
                    else if (!hoverElement) {
                        hoverElement = document.createElement("div");
                        hoverElement.id = "arrangeColumn";
                        var rect = cell.getBoundingClientRect();
                        dropCol = cell;
                        cursorOffset = Math.min(rect.width, rect.height) / 2;
                        hoverElement.style.width = rect.width + "px";
                        hoverElement.style.height = rect.height + "px";
                        hoverElement.style.padding = "4px";
                        hoverElement.style.borderWidth = "1px";
                        hoverElement.innerText = cell.innerText;
                        dropLocation = document.createElement("div");
                        dropLocation.id = "arrangeDropLocation";
                        dropLocation.style.top = (rect.top - 4) + "px";
                        dropLocation.style.height = (Math.round(rect.height) * 2 + 4) + "px";
                        document.body.appendChild(hoverElement);
                        document.body.appendChild(dropLocation);
                    }
                    hoverElement.style.left = (x - cursorOffset) + "px";
                    hoverElement.style.top = (y - cursorOffset) + "px";
                    updateDropPosition(x, y);
                };
                cell.onmousedown = (event) => {
                    if (hoverElement) {
                        mouseUp(event);
                        return;
                    }
                    if (event.which === KeyCodes_3.MouseCodes.Left) {
                        cell.onmousemove = mouseMove;
                        cell.onmouseup = mouseUp;
                        Utilities_3.Utilities.setCapture(cell);
                        initialX = event.clientX;
                    }
                };
                cell.onkeydown = (event) => {
                    if (!event.ctrlKey || !event.shiftKey) {
                        return;
                    }
                    var isColumnHidden = (element) => element.offsetHeight === 0;
                    if (event.keyCode === KeyCodes_3.KeyCodes.ArrowLeft) {
                        var moveTo = cell.previousElementSibling;
                        while (moveTo !== null && isColumnHidden(moveTo))
                            ;
                        if (!moveTo) {
                            return;
                        }
                        var observableCols = valueAccessor();
                        var cols = observableCols();
                        var colIdToMove = cell.getAttribute("data-columnid");
                        var moveToId = moveTo.getAttribute("data-columnid");
                        cols = cols.filter(columnId => columnId !== colIdToMove);
                        cols.splice(cols.indexOf(moveToId), 0, colIdToMove);
                        observableCols(cols);
                    }
                    else if (event.keyCode === KeyCodes_3.KeyCodes.ArrowRight) {
                        var moveTo = cell.nextElementSibling;
                        while (moveTo !== null && isColumnHidden(moveTo))
                            ;
                        if (!moveTo) {
                            return;
                        }
                        var observableCols = valueAccessor();
                        var cols = observableCols();
                        var colIdToMove = cell.getAttribute("data-columnid");
                        var moveToId = moveTo.getAttribute("data-columnid");
                        cols = cols.filter(columnId => columnId !== colIdToMove);
                        cols.splice(cols.indexOf(moveToId) + 1, 0, colIdToMove);
                        observableCols(cols);
                    }
                };
            };
            var headerCells = element.querySelectorAll("th");
            for (var i = 0; i < headerCells.length; i++) {
                addEventListeners(headerCells[i]);
            }
        }
    };
});
define("Grid/CustomBindings/DynamicRowCells", ["require", "exports", "Misc/CpuSamplingUtilities"], function (require, exports, CpuSamplingUtilities_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["dynamicRowCells"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { controlsDescendantBindings: true };
        },
        update: (element, valueAccessor) => {
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);
            ko.virtualElements.emptyNode(element);
            var previousNode = null;
            valueUnwrapped.forEach((n) => {
                var td = document.createElement("td");
                td.setAttribute("role", "gridcell");
                ko.utils.setHtml(td, CpuSamplingUtilities_2.CpuSamplingUtilities.localizeNumber(n));
                if (!previousNode) {
                    ko.virtualElements.prepend(element, td);
                }
                else {
                    ko.virtualElements.insertAfter(element, td, previousNode);
                }
                previousNode = td;
            });
        }
    };
    ko.virtualElements.allowedBindings["dynamicRowCells"] = true;
});
define("Grid/CustomBindings/FocusedRow", ["require", "exports", "Misc/KeyCodes", "Misc/Logger"], function (require, exports, KeyCodes_4, Logger_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["focusedRow"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var logger = Logger_4.getLogger();
            var multiSelectStart = -1;
            element.addEventListener("keydown", (event) => {
                if (KeyCodes_4.KeyCodes.Shift === event.keyCode) {
                    var bindingConfig = valueAccessor();
                    multiSelectStart = ko.unwrap(bindingConfig.focused);
                    return;
                }
                if (KeyCodes_4.KeyCodes.ArrowUp !== event.keyCode &&
                    KeyCodes_4.KeyCodes.ArrowDown !== event.keyCode) {
                    return;
                }
                var bindingConfig = valueAccessor();
                var rows = ko.unwrap(bindingConfig.rows);
                if (rows.length === 0) {
                    return;
                }
                var focusedIndex = ko.unwrap(bindingConfig.focused);
                var selectedIndex = 0;
                if (KeyCodes_4.KeyCodes.ArrowUp === event.keyCode && focusedIndex !== -1) {
                    selectedIndex = Math.max(focusedIndex - 1, 0);
                }
                else if (KeyCodes_4.KeyCodes.ArrowDown === event.keyCode && focusedIndex !== -1) {
                    selectedIndex = Math.min(focusedIndex + 1, rows.length - 1);
                }
                if (!event.shiftKey) {
                    bindingConfig.selected([selectedIndex]);
                }
                else {
                    var start = Math.max(Math.min(selectedIndex, multiSelectStart), 0);
                    var end = Math.max(selectedIndex, multiSelectStart);
                    var selection = [];
                    for (var indexToSelect = start; indexToSelect <= end; ++indexToSelect) {
                        selection.push(indexToSelect);
                    }
                    if (multiSelectStart > selectedIndex) {
                        selection.reverse();
                    }
                    bindingConfig.selected(selection);
                }
                event.preventDefault();
            });
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var bindingConfig = valueAccessor();
            var focusedIndex = ko.unwrap(bindingConfig.focused);
            if (focusedIndex === -1) {
                return;
            }
            var rows = ko.unwrap(bindingConfig.rows);
            var scrollTop = element.scrollTop;
            var totalHeight = element.scrollHeight;
            var rowHeight = totalHeight / (rows.length + 1);
            var visibleHeight = element.clientHeight - rowHeight;
            var topPosition = focusedIndex * rowHeight;
            if (topPosition < (scrollTop + rowHeight)) {
                element.scrollTop = Math.max(topPosition - rowHeight, 0);
            }
            else if (topPosition + rowHeight > (scrollTop + (visibleHeight))) {
                element.scrollTop = topPosition + rowHeight - visibleHeight;
            }
        }
    };
});
define("Grid/CustomBindings/Justification", ["require", "exports", "CpuUsage.Interfaces"], function (require, exports, CpuUsage_Interfaces_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["justification"] = {
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var justification = ko.unwrap(valueAccessor());
            switch (justification) {
                case CpuUsage_Interfaces_5.ColumnJustification.Center:
                    element.style.textAlign = "center";
                    break;
                case CpuUsage_Interfaces_5.ColumnJustification.Right:
                    element.style.textAlign = "right";
                    break;
                case CpuUsage_Interfaces_5.ColumnJustification.Left:
                default:
                    element.style.textAlign = "left";
                    break;
            }
        }
    };
});
define("Grid/CustomBindings/Sortable", ["require", "exports", "CpuUsage.Interfaces", "Misc/KeyCodes"], function (require, exports, CpuUsage_Interfaces_6, KeyCodes_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["sortable"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            if (!value) {
                return;
            }
            var eventHandler = () => {
                var value = valueAccessor();
                var elementColumnId = value.sortColumnId;
                var currentColumnId = value.currentColumn;
                var currentSortDirection = value.currentDirection;
                if (currentColumnId() === elementColumnId) {
                    currentSortDirection(currentSortDirection() === CpuUsage_Interfaces_6.SortDirection.Asc ?
                        CpuUsage_Interfaces_6.SortDirection.Desc :
                        CpuUsage_Interfaces_6.SortDirection.Asc);
                }
                else {
                    var defaultDirection = value.defaultDirection || CpuUsage_Interfaces_6.SortDirection.Desc;
                    currentColumnId(elementColumnId);
                    currentSortDirection(defaultDirection);
                }
            };
            element.addEventListener("click", eventHandler);
            element.addEventListener("keydown", (e) => {
                if (KeyCodes_5.KeyCodes.Enter === e.keyCode) {
                    eventHandler();
                }
            });
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            if (!value) {
                return;
            }
            var elementColumnId = value.sortColumnId;
            element.classList.remove("sortAsc");
            element.classList.remove("sortDesc");
            if (elementColumnId === value.currentColumn()) {
                var sortedClass = value.currentDirection() === CpuUsage_Interfaces_6.SortDirection.Asc ?
                    "sortAsc" : "sortDesc";
                element.classList.add(sortedClass);
            }
        }
    };
});
define("Grid/CustomBindings/VirtualizedForEach", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function calculateNeededChanges(newArray, oldArray) {
        var intermediateArray = oldArray.slice(0);
        var arrayChanges = {
            removedElements: [],
            addedElements: [],
            movedElements: []
        };
        for (var i = oldArray.length - 1; i >= 0; --i) {
            if (newArray.indexOf(oldArray[i]) === -1) {
                arrayChanges.removedElements.push({ value: oldArray[i], index: i });
                intermediateArray.splice(i, 1);
            }
        }
        for (var i = 0; i < newArray.length; i++) {
            if (oldArray.indexOf(newArray[i]) === -1) {
                arrayChanges.addedElements.push({ value: newArray[i], index: i });
                intermediateArray.splice(i, 0, newArray[i]);
            }
        }
        for (var i = 0; i < intermediateArray.length; i++) {
            if (intermediateArray[i] === newArray[i]) {
                continue;
            }
            var fromIndex = intermediateArray.indexOf(newArray[i]);
            arrayChanges.movedElements.push({ fromIndex: fromIndex, toIndex: i });
            var movedElement = intermediateArray.splice(fromIndex, 1)[0];
            intermediateArray.splice(i, 0, movedElement);
        }
        return arrayChanges;
    }
    function measureRowHeight(element, viewModel, dataOrBindingContext) {
        var renderedTemplate = document.createDocumentFragment();
        ko.renderTemplate(viewModel.templateName, dataOrBindingContext, {}, renderedTemplate, "replaceChildren");
        var measuringRow = renderedTemplate.firstChild;
        element.appendChild(measuringRow);
        var dimensions = measuringRow.getBoundingClientRect();
        element.removeChild(measuringRow);
        return dimensions.height;
    }
    ko.bindingHandlers["virtualizedForEach"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var hiddenTop = document.createElement("div");
            var hiddenBottom = document.createElement("div");
            hiddenTop.innerHTML = "&nbsp;";
            hiddenTop.style.height = "0px";
            hiddenBottom.innerHTML = "&nbsp;";
            hiddenBottom.style.height = "0px";
            element.parentElement.insertAdjacentElement("beforebegin", hiddenTop);
            element.parentElement.insertAdjacentElement("afterend", hiddenBottom);
            ko.utils.domData.set(element, "previousRows", []);
            ko.utils.domData.set(element, "rowHeight", 0);
            ko.utils.domData.set(element, "hiddenTop", hiddenTop);
            ko.utils.domData.set(element, "hiddenBottom", hiddenBottom);
            ko.utils.domData.set(element, "previousOrder", ko.unwrap(valueAccessor().columnOrder).slice(0));
            plugin.Theme.addEventListener("themechanged", () => {
                ko.utils.domData.set(element, "rowHeight", 0);
            });
            return { controlsDescendantBindings: true };
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var config = valueAccessor();
            var allRows = ko.unwrap(config.rows);
            var scrollTop = ko.unwrap(config.scrollTop);
            var clientHeight = ko.unwrap(config.clientHeight);
            var columnOrder = ko.unwrap(config.columnOrder);
            var hiddenTop = ko.utils.domData.get(element, "hiddenTop");
            var hiddenBottom = ko.utils.domData.get(element, "hiddenBottom");
            var previousRows = ko.utils.domData.get(element, "previousRows");
            var rowHeight = ko.utils.domData.get(element, "rowHeight");
            var previousOrder = ko.utils.domData.get(element, "previousOrder");
            if (rowHeight === 0) {
                if (allRows.length === 0) {
                    return;
                }
                var rowBindingContext = bindingContext.createChildContext(allRows[0]);
                rowHeight = measureRowHeight(element, allRows[0], rowBindingContext);
                ko.utils.domData.set(element, "rowHeight", rowHeight);
            }
            var rowsToRemoveAtTop = Math.floor(scrollTop / rowHeight);
            var maxVisibleRows = Math.floor(clientHeight / rowHeight) + 2;
            var bufferSize = Math.floor(maxVisibleRows / 2);
            var endSlice = Math.min(allRows.length, rowsToRemoveAtTop + maxVisibleRows + bufferSize);
            rowsToRemoveAtTop = Math.max(rowsToRemoveAtTop - bufferSize, 0);
            hiddenTop.style.height = (rowsToRemoveAtTop * rowHeight) + "px";
            var visibleRows = allRows.slice(rowsToRemoveAtTop, endSlice);
            hiddenBottom.style.height = ((allRows.length - endSlice) * rowHeight) + "px";
            var rowDifferences = calculateNeededChanges(visibleRows, previousRows);
            rowDifferences.removedElements.forEach((change) => {
                var rowElement = element.children[change.index];
                element.removeChild(rowElement);
            });
            var columnDifferences = calculateNeededChanges(columnOrder, previousOrder);
            var rows = element.querySelectorAll("tr");
            columnDifferences.movedElements.forEach((change) => {
                for (var i = 0; i < rows.length; ++i) {
                    var row = rows[i];
                    var columns = row.querySelectorAll("td");
                    if (columns.length !== columnOrder.length) {
                        continue;
                    }
                    row.insertBefore(columns[change.fromIndex], columns[change.toIndex]);
                }
            });
            rowDifferences.addedElements.forEach((change) => {
                var renderedRow = document.createDocumentFragment();
                var rowBindingContext = bindingContext.createChildContext(change.value);
                ko.renderTemplate(change.value.templateName, rowBindingContext, {}, renderedRow, "replaceChildren");
                var rowElement = renderedRow.querySelector("tr");
                var columns = rowElement.querySelectorAll("td");
                for (var i = 0; i < columns.length && columns.length === columnOrder.length; ++i) {
                    if (columns[i].getAttribute("data-columnid") !== columnOrder[i]) {
                        rowElement.insertBefore(rowElement.querySelector("td[data-columnid='" + columnOrder[i] + "']"), columns[i]);
                    }
                    columns = rowElement.querySelectorAll("td");
                }
                element.insertBefore(renderedRow, element.children[change.index] || null);
            });
            rowDifferences.movedElements.forEach((change) => {
                element.insertBefore(element.children[change.fromIndex], element.children[change.toIndex]);
            });
            ko.utils.domData.set(element, "previousRows", visibleRows);
            ko.utils.domData.set(element, "previousOrder", columnOrder.slice());
        }
    };
});
define("Grid/TreeGridViewModel", ["require", "exports", "plugin-vs-v2", "knockout", "CpuUsage.Interfaces", "Misc/EventThrottler", "Misc/Constants", "Misc/KeyCodes", "Misc/Logger", "Misc/Cancellation", "template!TreeGridView", "template!CopyTreeGridView", "Grid/CustomBindings/ArrangeableColumns", "Grid/CustomBindings/DynamicRowCells", "Grid/CustomBindings/FocusedRow", "Grid/CustomBindings/Justification", "Grid/CustomBindings/Sortable", "Grid/CustomBindings/VirtualizedForEach", "Grid/CustomBindings/VisibilityContextMenu"], function (require, exports, plugin, ko, CpuUsage_Interfaces_7, EventThrottler_1, Constants_1, KeyCodes_6, Logger_5, Cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeGridViewModel = void 0;
    class TreeGridViewModel {
        constructor(dao, header, ariaLabelToken) {
            this._roots = ko.observableArray([]);
            this._treeAsArrayProjection = ko.pureComputed(() => this.computeTreeAsArrayProjection());
            this._selectedRows = ko.observableArray([]);
            this._focusedRowIndex = ko.pureComputed(() => this.computedFocusedRowIndex());
            this._focusedRow = ko.pureComputed(() => this.computeFocusedRow());
            this._scrollTop = ko.observable(0);
            this._clientHeight = ko.observable(0);
            this._logger = Logger_5.getLogger();
            this._dataLoadStatus = ko.observable(CpuUsage_Interfaces_7.DataLoadEvent.DataLoadCompleted);
            this._dao = dao;
            this._header = header;
            this._ariaLabelToken = ariaLabelToken;
            this._header.sortInfo.subscribe(this.onSortChanged.bind(this));
            this._selectedRows.subscribe(this.onSelectionChanged.bind(this), null, "arrayChange");
            this.loadDataOperation((cancellationToken) => this._dao.getRoots(0, this._header.sortInfo(), cancellationToken));
        }
        get dataLoadPromise() {
            return !this._dataLoadPromise ?
                Promise.resolve() : this._dataLoadPromise;
        }
        get roots() {
            return this._roots;
        }
        get treeAsArray() {
            return this._treeAsArrayProjection;
        }
        get selectedRows() {
            return this._selectedRows;
        }
        get header() {
            return this._header;
        }
        get ariaLabelToken() {
            return this._ariaLabelToken;
        }
        get scrollTop() {
            return this._scrollTop;
        }
        get clientHeight() {
            return this._clientHeight;
        }
        get dataLoadStatus() {
            return this._dataLoadStatus;
        }
        get focusedRowIndex() {
            return this._focusedRowIndex;
        }
        get focusedRow() {
            return this._focusedRow;
        }
        reloadData() {
            this.loadDataOperation((cancellationToken) => this._dao.getRoots(0, this._header.sortInfo(), cancellationToken));
        }
        onAfterDomInsert(elements, viewModel) {
            var element = elements[0];
            var header = element.querySelector(".treeGridHeader");
            var body = element.querySelector(".treeGridBody");
            viewModel._header.onAfterDomInsert(header, body);
            var updateCachedSizes = () => {
                viewModel._scrollTop(body.scrollTop);
                viewModel._clientHeight(body.clientHeight);
            };
            updateCachedSizes();
            var onResizeBoundFunction = EventThrottler_1.eventThrottler(updateCachedSizes, Constants_1.Constants.WindowResizeThrottle);
            body.addEventListener("scroll", updateCachedSizes);
            window.addEventListener("resize", onResizeBoundFunction);
            ko.utils.domNodeDisposal.addDisposeCallback(body, () => {
                body.removeEventListener("scroll", updateCachedSizes);
                window.removeEventListener("resize", onResizeBoundFunction);
            });
        }
        onSortChanged(sortInfo) {
            this.loadDataOperation((cancellationToken) => this._dao.sort(this._roots(), sortInfo, cancellationToken));
        }
        search(query, isCaseSensitive, isRegex, cancellationToken) {
            if (this._dataLoadPromise) {
                this._logger.error("Trying to search while loading data, this should not happen");
                return Promise.resolve(false);
            }
            if (!query) {
                return Promise.resolve(false);
            }
            var currentNode = null;
            var currentChildren = this._roots();
            var expandSearch = (result) => {
                var nodeToExpand = result.shift();
                for (var nodeIndex = 0; nodeIndex < currentChildren.length; ++nodeIndex) {
                    currentNode = currentChildren[nodeIndex];
                    if (currentNode.id === nodeToExpand.nodeId) {
                        currentChildren = currentNode.children ? currentNode.children() : [];
                        break;
                    }
                }
                if (result.length > 0) {
                    if (!currentNode.expanded()) {
                        return this._dao.expand(currentNode, this._header.sortInfo(), cancellationToken)
                            .then(() => currentChildren = currentNode.children())
                            .then(() => expandSearch(result));
                    }
                    else {
                        return expandSearch(result);
                    }
                }
                else {
                    ko.tasks.schedule(() => {
                        var indexToSelect = this._treeAsArrayProjection().indexOf(currentNode);
                        this._selectedRows([indexToSelect]);
                    });
                    return Promise.resolve(true);
                }
            };
            var processSearchResult = (result) => {
                if (result.length > 0) {
                    return expandSearch(result);
                }
                if (this._selectedRows().length === 0) {
                    window.alert(plugin.Resources.getString("Message_SearchNoMatches"));
                    return Promise.resolve(false);
                }
                return Promise.resolve(window.confirm(plugin.Resources.getString("Message_SearchStartFromTop")))
                    .then((startFromTop) => {
                    if (!startFromTop) {
                        return Promise.resolve(false);
                    }
                    this._selectedRows([]);
                    return this._dao.search(query, isCaseSensitive, isRegex, null, this._header.sortInfo(), cancellationToken)
                        .then(processSearchResult);
                });
            };
            this._dataLoadPromise = this._dao.search(query, isCaseSensitive, isRegex, this.focusedRow(), this._header.sortInfo(), cancellationToken)
                .then(processSearchResult);
            this._dataLoadPromise.then(() => this._dataLoadPromise = null, (error) => {
                this._dataLoadPromise = null;
                if (error.name !== Constants_1.Constants.errorNameCanceled) {
                    this._logger.error("Tree grid search failed");
                    if (isRegex) {
                        window.alert(plugin.Resources.getString("Message_InvalidRegularExpression"));
                    }
                }
            });
            return this._dataLoadPromise;
        }
        onClick(viewModel, event) {
            if (event.which !== KeyCodes_6.MouseCodes.Left) {
                return;
            }
            var context = ko.contextFor(event.target);
            if (!context || context.$data === this) {
                return;
            }
            var row = context.$data;
            var rowIndex = this._treeAsArrayProjection().indexOf(row);
            if (event.target.classList && event.target.classList.contains("treeGridRow-expander")) {
                this._selectedRows([rowIndex]);
                ko.tasks.runEarly();
                this._dao.expand(row, this._header.sortInfo(), Cancellation_1.CancellationToken.None);
            }
            else if (event.ctrlKey) {
                var selectedIndex = this._selectedRows().indexOf(rowIndex);
                if (selectedIndex === -1) {
                    this._selectedRows.push(rowIndex);
                }
                else {
                    this._selectedRows.splice(selectedIndex, 1);
                }
            }
            else if (event.shiftKey) {
                var start = Math.max(Math.min(this.focusedRowIndex(), rowIndex), 0);
                var end = Math.max(this.focusedRowIndex(), rowIndex);
                var initialSelection = this._selectedRows();
                var selectionToAdd = [];
                for (var indexToSelect = start; indexToSelect <= end; ++indexToSelect) {
                    if (initialSelection.indexOf(indexToSelect) === -1) {
                        selectionToAdd.push(indexToSelect);
                    }
                }
                if (this.focusedRowIndex() > rowIndex) {
                    selectionToAdd.reverse();
                }
                selectionToAdd.forEach((selection) => this._selectedRows.push(selection));
            }
            else {
                this._selectedRows([rowIndex]);
            }
        }
        onDblClick(viewModel, event) {
            if (event.which !== KeyCodes_6.MouseCodes.Left) {
                return;
            }
            var context = ko.contextFor(event.target);
            if (event.target.classList && event.target.classList.contains("treeGridRow-expander")) {
                var rowIndex = this._treeAsArrayProjection().indexOf(context.$data);
                this._selectedRows([rowIndex]);
                ko.tasks.runEarly();
                this._dao.expand(context.$data, this._header.sortInfo(), Cancellation_1.CancellationToken.None);
            }
            else if (context && context.$data !== this && this._selectedRows().length > 0) {
                if (this.focusedRow() === context.$data) {
                    this.focusedRow().invoke();
                }
                else {
                    this.onClick(viewModel, event);
                }
            }
        }
        onKeyDown(viewModel, event) {
            var focusedRow = this.focusedRow();
            if (!focusedRow) {
                return true;
            }
            if (KeyCodes_6.KeyCodes.Enter === event.keyCode) {
                focusedRow.invoke();
                return false;
            }
            if (KeyCodes_6.KeyCodes.Space !== event.keyCode && KeyCodes_6.KeyCodes.ArrowRight !== event.keyCode && KeyCodes_6.KeyCodes.ArrowLeft !== event.keyCode) {
                return true;
            }
            this._selectedRows([this.focusedRowIndex()]);
            ko.tasks.runEarly();
            if (KeyCodes_6.KeyCodes.Space === event.keyCode) {
                this._dao.expand(focusedRow, this._header.sortInfo(), Cancellation_1.CancellationToken.None);
            }
            else if (KeyCodes_6.KeyCodes.ArrowLeft === event.keyCode && focusedRow.expanded) {
                focusedRow.expanded(false);
            }
            else if (KeyCodes_6.KeyCodes.ArrowRight === event.keyCode && focusedRow.expanded && !focusedRow.expanded()) {
                this._dao.expand(focusedRow, this._header.sortInfo(), Cancellation_1.CancellationToken.None);
            }
            return false;
        }
        loadDataOperation(operation) {
            if (this._dataLoadCancellationTokenSource) {
                this._dataLoadCancellationTokenSource.cancel();
            }
            this._dataLoadCancellationTokenSource = new Cancellation_1.CancellationTokenSource();
            this._dataLoadCancellationTokenSource.token.onCancellationRequested.addEventListener(() => {
                this._dataLoadStatus(CpuUsage_Interfaces_7.DataLoadEvent.DataLoadCanceled);
            }, { once: true });
            this._selectedRows([]);
            ko.tasks.runEarly();
            this._dataLoadStatus(CpuUsage_Interfaces_7.DataLoadEvent.DataLoadStart);
            this._dataLoadPromise = operation(this._dataLoadCancellationTokenSource.token).then((roots) => this._roots(roots));
            this._dataLoadPromise.then(() => {
                this._dataLoadPromise = null;
                this._dataLoadStatus(CpuUsage_Interfaces_7.DataLoadEvent.DataLoadCompleted);
            }, (error) => {
                if (error.name !== Constants_1.Constants.errorNameCanceled) {
                    this._dataLoadStatus(CpuUsage_Interfaces_7.DataLoadEvent.DataLoadFailed);
                }
                this._dataLoadPromise = null;
            });
        }
        computeTreeAsArrayProjection() {
            var projection = [];
            var getProjection = (element) => {
                projection.push(element);
                if (element.expanded && element.expanded()) {
                    element.children().forEach(getProjection);
                }
            };
            this._roots().forEach(getProjection);
            return projection;
        }
        computedFocusedRowIndex() {
            var selectedRows = this._selectedRows();
            return selectedRows.length > 0 ? selectedRows[selectedRows.length - 1] : -1;
        }
        computeFocusedRow() {
            var focusedIndex = this.computedFocusedRowIndex();
            return focusedIndex !== -1 ? this._treeAsArrayProjection()[focusedIndex] : null;
        }
        onSelectionChanged(changes) {
            changes.forEach((change) => {
                if (typeof change.moved !== "undefined") {
                    return;
                }
                if (change.status === "added") {
                    this._treeAsArrayProjection()[change.value].selected(true);
                }
                else if (change.status === "deleted") {
                    this._treeAsArrayProjection()[change.value].selected(false);
                }
            });
        }
    }
    exports.TreeGridViewModel = TreeGridViewModel;
});
define("Grid/TreeGridUtils", ["require", "exports", "Misc/SortFunctions"], function (require, exports, SortFunctions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeGridUtils = void 0;
    class TreeGridUtils {
        static expandAll(treeGrid, dao, cancellationToken) {
            var expandAll = (element) => {
                if (element.expanded === null) {
                    return;
                }
                var expandPromise = element.expanded()
                    ? Promise.resolve(void 0)
                    : dao.expand(element, treeGrid.header.sortInfo(), cancellationToken);
                expandPromise.then(() => {
                    element.children().forEach(expandAll);
                });
            };
            treeGrid.selectedRows([]);
            ko.tasks.runEarly();
            treeGrid.roots().forEach(expandAll);
        }
        static expandSelection(treeGrid, dao, cancellationToken) {
            var expandAll = (element) => {
                if (element.expanded === null) {
                    return;
                }
                var expandPromise = element.expanded()
                    ? Promise.resolve()
                    : dao.expand(element, treeGrid.header.sortInfo(), cancellationToken);
                expandPromise.then(() => {
                    element.children().forEach(expandAll);
                });
            };
            var selectedElements = treeGrid.selectedRows().map(index => treeGrid.treeAsArray()[index]);
            treeGrid.selectedRows([]);
            ko.tasks.runEarly();
            selectedElements.forEach(expandAll);
        }
        static collapseAll(treeGrid) {
            var collapseAll = (element) => {
                if (element.expanded !== null) {
                    element.expanded(false);
                    element.children().forEach(collapseAll);
                }
            };
            treeGrid.selectedRows([]);
            ko.tasks.runEarly();
            treeGrid.roots().forEach(collapseAll);
        }
        static collapseSelected(treeGrid) {
            var collapseAll = (element) => {
                if (element.expanded !== null) {
                    element.expanded(false);
                    element.children().forEach(collapseAll);
                }
            };
            var selectedElements = treeGrid.selectedRows().map(index => treeGrid.treeAsArray()[index]);
            treeGrid.selectedRows([]);
            ko.tasks.runEarly();
            selectedElements.forEach(collapseAll);
        }
        static selectParentsOfFocusedRow(treeGrid) {
            var currentRowIndex = treeGrid.focusedRowIndex();
            if (currentRowIndex === -1) {
                return;
            }
            var currentRow = treeGrid.treeAsArray()[currentRowIndex];
            while (currentRow.parent) {
                currentRowIndex = treeGrid.treeAsArray().lastIndexOf(currentRow.parent, currentRowIndex);
                if (currentRowIndex === -1) {
                    break;
                }
                treeGrid.selectedRows.push(currentRowIndex);
                currentRow = treeGrid.treeAsArray()[currentRowIndex];
            }
        }
        static formatTreeGridSelectedToText(treeGrid, showDiscontiguousBreaks = true) {
            var selectedIndexes = treeGrid.selectedRows().sort(SortFunctions_1.SortFunctions.numberComparator);
            var isColumnHidden = {};
            treeGrid.header.hiddenColumns().forEach(columnId => isColumnHidden[columnId] = true);
            var formattedSelection = "";
            var renderedTreeGridCopy = document.createDocumentFragment();
            ko.renderTemplate("CopyTreeGridView", treeGrid, {}, renderedTreeGridCopy, "replaceChildren");
            var headerColumns = renderedTreeGridCopy.querySelectorAll("th");
            var delimiter = "";
            for (var column = 0; column < headerColumns.length; ++column) {
                var columnElement = headerColumns[column];
                var columnId = columnElement.getAttribute("data-columnid");
                if (isColumnHidden[columnId]) {
                    continue;
                }
                formattedSelection += delimiter;
                formattedSelection += columnElement.innerText;
                delimiter = "\t";
            }
            var previousIndex = -1;
            var metadata = renderedTreeGridCopy.querySelectorAll("tbody > tr.copy-metadata");
            var rows = renderedTreeGridCopy.querySelectorAll("tbody > tr:not(.copy-metadata)");
            for (var rowIndex = 0; rowIndex < rows.length; ++rowIndex) {
                var row = rows[rowIndex];
                formattedSelection += TreeGridUtils.NewLine;
                var index = treeGrid.selectedRows()[rowIndex];
                if (showDiscontiguousBreaks && previousIndex !== -1 && previousIndex + 1 !== index) {
                    formattedSelection += "[...]" + TreeGridUtils.NewLine;
                }
                var metadataCells = metadata[rowIndex].querySelectorAll("td");
                for (var i = 0; i < metadataCells.length; ++i) {
                    formattedSelection += metadataCells[i].innerText;
                }
                var cells = row.querySelectorAll("td");
                var cellDelimiter = "";
                for (var columnIndex = 0; columnIndex < cells.length; ++columnIndex) {
                    var columnElement = cells[columnIndex];
                    var columnId = columnElement.getAttribute("data-columnid");
                    if (isColumnHidden[columnId]) {
                        continue;
                    }
                    formattedSelection += cellDelimiter;
                    formattedSelection += columnElement.innerText.replace(/^\s+|\s+$/g, '');
                    cellDelimiter = "\t";
                }
                previousIndex = index;
            }
            return formattedSelection;
        }
    }
    exports.TreeGridUtils = TreeGridUtils;
    TreeGridUtils.NewLine = "\r\n";
});
define("DAO/CallerCalleeDAO", ["require", "exports", "plugin-vs-v2", "Misc/Logger", "Misc/SortFunctions", "ViewModels/DynamicTreeRowViewModel"], function (require, exports, plugin, Logger_6, SortFunctions_2, DynamicTreeRowViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallerCalleeDAO = void 0;
    var _callerCalleeMarshalerProxy = null;
    class CallerCalleeDAO {
        constructor(config) {
            this._logger = Logger_6.getLogger();
            this._config = config;
        }
        static create() {
            if (_callerCalleeMarshalerProxy === null) {
                _callerCalleeMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.CallerCalleeMarshaler", {}, true);
            }
            return _callerCalleeMarshalerProxy._call("config")
                .then((config) => new CallerCalleeDAO(config));
        }
        get defaultSortColumn() {
            return this._config.defaultSortColumn;
        }
        getHeader() {
            return _callerCalleeMarshalerProxy._call("header");
        }
        getData(sortInfo, context) {
            var sortFunc = SortFunctions_2.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            return _callerCalleeMarshalerProxy._call("getCallerCallee", context).then((data) => {
                var callers = data.callers.map((callerRow) => new DynamicTreeRowViewModel_1.DynamicTreeRowViewModel(null, callerRow, this._config.columns, 0));
                var callees = data.callees.map((calleeRow) => new DynamicTreeRowViewModel_1.DynamicTreeRowViewModel(null, calleeRow, this._config.columns, 0));
                return {
                    current: new DynamicTreeRowViewModel_1.DynamicTreeRowViewModel(null, data.current, this._config.columns, 0),
                    callers: callers.sort(sortFunc),
                    callees: callees.sort(sortFunc)
                };
            });
        }
        viewSource(filePath, lineNumber) {
            _callerCalleeMarshalerProxy._call("viewSource", filePath, lineNumber);
        }
        sort(roots, sortInfo) {
            var sortFunc = SortFunctions_2.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            roots.sort(sortFunc);
            return Promise.resolve(roots);
        }
        getColumnSettings() {
            return _callerCalleeMarshalerProxy._call("columnSettings");
        }
        onColumnChanged(column) {
            _callerCalleeMarshalerProxy._call("columnSettingsChanged", column);
        }
    }
    exports.CallerCalleeDAO = CallerCalleeDAO;
});
define("Misc/CallerCalleeColumnProvider", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallerCalleeColumnProvider = void 0;
    class CallerCalleeColumnProvider {
        constructor(dao, callerHeader, currentHeader, calleeHeader) {
            this._dao = dao;
            this._callerHeader = callerHeader;
            this._currentHeader = currentHeader;
            this._calleeHeader = calleeHeader;
            this._header = document.querySelector(".callerCallee .header table");
            this._innerScrollBar = document.querySelector(".callerCallee .scrollBarInner");
            var scrollBar = document.querySelector(".callerCallee .horizontalScroll");
            var elementsToScroll = document.querySelectorAll(".callerCallee .linkedHorizontalScroll");
            scrollBar.onscroll = () => {
                var left = scrollBar.scrollLeft;
                for (var i = 0; i < elementsToScroll.length; ++i) {
                    elementsToScroll[i].scrollLeft = left;
                }
            };
            var headerScrollable = document.querySelector(".callerCallee .header");
            headerScrollable.onscroll = () => {
                scrollBar.scrollLeft = headerScrollable.scrollLeft;
            };
        }
        getColumnSettings() {
            return this._dao.getColumnSettings();
        }
        onColumnChanged(column) {
            var caller = this._callerHeader.querySelector("th[data-columnid='" + column.columnId + "']");
            var current = this._currentHeader.querySelector("th[data-columnid='" + column.columnId + "']");
            var callee = this._calleeHeader.querySelector("th[data-columnid='" + column.columnId + "']");
            caller.style.width = column.width + "px";
            current.style.width = column.width + "px";
            callee.style.width = column.width + "px";
            this.updateLinkedScrollBarWidth();
            this._dao.onColumnChanged(column);
        }
        updateLinkedScrollBarWidth() {
            this._innerScrollBar.style.width = this._header.clientWidth + "px";
        }
    }
    exports.CallerCalleeColumnProvider = CallerCalleeColumnProvider;
});
define("ViewModels/CallerCalleeHeaderViewModel", ["require", "exports", "CpuUsage.Interfaces", "Grid/ColumnResizer", "Misc/CallerCalleeColumnProvider", "Misc/Logger"], function (require, exports, CpuUsage_Interfaces_8, ColumnResizer_2, CallerCalleeColumnProvider_1, Logger_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallerCalleeHeaderViewModel = void 0;
    class CallerCalleeHeaderViewModel {
        constructor(columns, dao, defaultSortColumn) {
            this._resizers = {};
            this._hiddenColumns = ko.observableArray([]);
            this._sortDirection = ko.observable(CpuUsage_Interfaces_8.SortDirection.Desc);
            this._sortInfo = ko.pureComputed(() => {
                return {
                    columnId: this._sortColumnId(),
                    direction: this._sortDirection()
                };
            });
            this._columnOrder = ko.observableArray([]);
            this._columnConfigLoadStatus = ko.observable(CpuUsage_Interfaces_8.DataLoadEvent.DataLoadStart);
            this._logger = Logger_7.getLogger();
            this._subscriptions = [];
            this._columns = columns;
            this._dao = dao;
            this._sortColumnId = ko.observable(defaultSortColumn);
            this._columnOrder(columns.map(column => column.id));
        }
        get visibilityContextMenuBinding() {
            return {
                hiddenColumns: this._hiddenColumns,
                columns: this._columns
                    .filter(column => column.hideable)
                    .map(column => ({
                    id: column.id,
                    text: column.text
                }))
            };
        }
        get columns() {
            return this._columns;
        }
        get hiddenColumns() {
            return this._hiddenColumns;
        }
        get columnOrder() {
            return this._columnOrder;
        }
        get sortInfo() {
            return this._sortInfo;
        }
        get sortColumnId() {
            return this._sortColumnId;
        }
        get sortDirection() {
            return this._sortDirection;
        }
        get columnConfigLoadStatus() {
            return this._columnConfigLoadStatus;
        }
        onAfterDomInsert(callerCalleeContainer, callerRow, currentRow, calleeRow) {
            this._callerCalleeContainer = callerCalleeContainer;
            this._columnProvider = new CallerCalleeColumnProvider_1.CallerCalleeColumnProvider(this._dao, callerRow, currentRow, calleeRow);
            this._resizers = {};
            var columnsToHide = [];
            this._columnProvider.getColumnSettings()
                .then((columnSettings) => {
                var header = this._callerCalleeContainer.querySelector(".callerCallee .header table");
                header.querySelector("tr").tabIndex = 0;
                var headerColumns = header.querySelectorAll("th");
                var rightSibling = null;
                columnSettings.forEach(column => {
                    var headerColumn = header.querySelector("th[data-columnid='" + column.columnId + "']");
                    var caller = callerRow.querySelector("th[data-columnid='" + column.columnId + "']");
                    var current = currentRow.querySelector("th[data-columnid='" + column.columnId + "']");
                    var callee = calleeRow.querySelector("th[data-columnid='" + column.columnId + "']");
                    headerColumn.tabIndex = -1;
                    caller.style.width = column.width + "px";
                    current.style.width = column.width + "px";
                    callee.style.width = column.width + "px";
                    var resizer = new ColumnResizer_2.ColumnResizer(headerColumn, header, document.createElement("div"), document.createElement("div"), column, this._columnProvider);
                    this._resizers[column.columnId] = resizer;
                    if (column.isHidden) {
                        columnsToHide.push(column.columnId);
                    }
                    resizer.resizedEvent.addEventListener(() => this.adjustResizerLocation());
                });
                this.adjustResizerLocation();
                this._subscriptions.push(this._hiddenColumns.subscribe(this.onHiddenColumnsChanged.bind(this), null, "arrayChange"));
                this._columnProvider.updateLinkedScrollBarWidth();
                this._hiddenColumns(columnsToHide);
                this._columnConfigLoadStatus(CpuUsage_Interfaces_8.DataLoadEvent.DataLoadCompleted);
            });
        }
        onHiddenColumnsChanged(changes) {
            changes.forEach((change) => {
                if (change.status === "added") {
                    var resizer = this._resizers[change.value];
                    resizer.onColumnVisiblityChanged(false);
                    this._columnProvider.onColumnChanged(resizer.columnConfig);
                }
                else if (change.status === "deleted") {
                    this._callerCalleeContainer.classList.remove("hide" + change.value);
                    this._resizers[change.value].onColumnVisiblityChanged(true);
                    this._columnProvider.onColumnChanged(this._resizers[change.value].columnConfig);
                }
            });
        }
        dispose() {
            this._subscriptions.forEach((s) => s.dispose());
        }
        adjustResizerLocation() {
            ko.tasks.runEarly();
            ko.tasks.schedule(() => {
                for (var id in this._resizers) {
                    this._resizers[id].resetLocation();
                }
            });
        }
    }
    exports.CallerCalleeHeaderViewModel = CallerCalleeHeaderViewModel;
});
define("ViewModels/CallerCalleeViewModel", ["require", "exports", "plugin-vs-v2", "CpuUsage.Interfaces", "Grid/TreeGridUtils", "DAO/CallerCalleeDAO", "ViewModels/CallerCalleeHeaderViewModel", "Misc/SortFunctions", "Misc/KeyCodes", "ViewModels/MainViewModel", "Misc/Constants", "Misc/EventThrottler", "Misc/Cancellation", "template!CallerCalleeView", "template!CopyCallerCalleeView"], function (require, exports, plugin, CpuUsage_Interfaces_9, TreeGridUtils_1, CallerCalleeDAO_1, CallerCalleeHeaderViewModel_1, SortFunctions_3, KeyCodes_7, MainViewModel_2, Constants_2, EventThrottler_2, Cancellation_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallerCalleeViewModel = exports.CallerCallee = void 0;
    class CallerCallee {
        constructor(header) {
            this._data = ko.observableArray([]);
            this._selectedRows = ko.observableArray([]);
            this._focusedRowIndex = ko.pureComputed(() => this.computedFocusedRowIndex());
            this._focusedRow = ko.pureComputed(() => this.computeFocusedRow());
            this._scrollTop = ko.observable(0);
            this._clientHeight = ko.observable(0);
            this._selectionSubscription = this._selectedRows.subscribe(this.onSelectionChanged.bind(this), null, "arrayChange");
            this._sharedHeader = header;
        }
        get data() {
            return this._data;
        }
        get selectedRows() {
            return this._selectedRows;
        }
        get focusedRowIndex() {
            return this._focusedRowIndex;
        }
        get focusedRow() {
            return this._focusedRow;
        }
        get header() {
            return this._sharedHeader;
        }
        get scrollTop() {
            return this._scrollTop;
        }
        get clientHeight() {
            return this._clientHeight;
        }
        dispose() {
            this._selectionSubscription.dispose();
        }
        onAfterDomInsert(container) {
            var updateCachedSizes = () => {
                this._scrollTop(container.scrollTop);
                this._clientHeight(container.clientHeight);
            };
            updateCachedSizes();
            var onResizeBoundFunction = EventThrottler_2.eventThrottler(updateCachedSizes, Constants_2.Constants.WindowResizeThrottle);
            container.addEventListener("scroll", updateCachedSizes);
            window.addEventListener("resize", onResizeBoundFunction);
            ko.utils.domNodeDisposal.addDisposeCallback(container, () => {
                container.removeEventListener("scroll", updateCachedSizes);
                window.removeEventListener("resize", onResizeBoundFunction);
            });
        }
        formatSelectedToText() {
            var selectedIndexes = this.selectedRows().sort(SortFunctions_3.SortFunctions.numberComparator);
            var isColumnHidden = {};
            this.header.hiddenColumns().forEach(columnId => isColumnHidden[columnId] = true);
            var formattedSelection = "";
            var renderedCallerCalleeCopy = document.createDocumentFragment();
            ko.renderTemplate("CopyCallerCalleeView", this, {}, renderedCallerCalleeCopy, "replaceChildren");
            var headerColumns = renderedCallerCalleeCopy.querySelectorAll("th");
            var delimiter = "";
            for (var column = 0; column < headerColumns.length; ++column) {
                var columnId = headerColumns[column].getAttribute("data-columnid");
                if (isColumnHidden[columnId]) {
                    continue;
                }
                formattedSelection += delimiter;
                formattedSelection += headerColumns[column].innerText;
                delimiter = "\t";
            }
            var previousIndex = -1;
            var rows = renderedCallerCalleeCopy.querySelectorAll("tbody > tr");
            for (var rowIndex = 0; rowIndex < rows.length; ++rowIndex) {
                var row = rows[rowIndex];
                formattedSelection += TreeGridUtils_1.TreeGridUtils.NewLine;
                var index = this.selectedRows()[rowIndex];
                var cells = row.querySelectorAll("td");
                var cellDelimiter = "";
                for (var columnIndex = 0; columnIndex < cells.length; ++columnIndex) {
                    var columnId = cells[column].getAttribute("data-columnid");
                    if (isColumnHidden[columnId]) {
                        continue;
                    }
                    formattedSelection += cellDelimiter;
                    formattedSelection += cells[columnIndex].innerText.replace(/^\s+|\s+$/g, '');
                    cellDelimiter = "\t";
                }
                previousIndex = index;
            }
            return formattedSelection;
        }
        computedFocusedRowIndex() {
            var selectedRows = this._selectedRows();
            return selectedRows.length > 0 ? selectedRows[selectedRows.length - 1] : -1;
        }
        computeFocusedRow() {
            var focusedIndex = this.computedFocusedRowIndex();
            return focusedIndex !== -1 ? this.data()[focusedIndex] : null;
        }
        onSelectionChanged(changes) {
            changes.forEach((change) => {
                if (typeof change.moved !== "undefined") {
                    return;
                }
                if (change.status === "added") {
                    this._data()[change.value].selected(true);
                }
                else if (change.status === "deleted") {
                    this._data()[change.value].selected(false);
                }
            });
        }
    }
    exports.CallerCallee = CallerCallee;
    class CallerCalleeViewModel {
        constructor(context) {
            this._current = ko.observable(null);
            this._currentFunction = ko.observable("");
            this._header = ko.observable();
            this._focusedRow = ko.pureComputed(() => this.computeFocusedRow());
            this._subscriptions = [];
            this._dataLoadStatus = ko.observable(CpuUsage_Interfaces_9.DataLoadEvent.DataLoadCompleted);
            CallerCalleeDAO_1.CallerCalleeDAO.create()
                .then((dao) => this._dao = dao)
                .then(() => this._dao.getHeader())
                .then((config) => {
                this._header(new CallerCalleeHeaderViewModel_1.CallerCalleeHeaderViewModel(config, this._dao, this._dao.defaultSortColumn));
                this._caller = new CallerCallee(this._header());
                this._callee = new CallerCallee(this._header());
                this._dataLoadStatus(CpuUsage_Interfaces_9.DataLoadEvent.DataLoadStart);
                this._dataLoadPromise = this._dao.getData(this._header().sortInfo(), context).then((data) => {
                    this._caller.data(data.callers);
                    this._callee.data(data.callees);
                    this.current(data.current);
                    this._currentFunction(data.current.name);
                    this._dataLoadStatus(CpuUsage_Interfaces_9.DataLoadEvent.DataLoadCompleted);
                });
                this._dataLoadPromise.then(() => {
                    this._dataLoadPromise = null;
                }, (error) => {
                    this._dataLoadPromise = null;
                });
                this._subscriptions.push(this._header().sortInfo.subscribe(() => {
                    this._caller.selectedRows([]);
                    this._callee.selectedRows([]);
                    this._current().selected(false);
                    ko.tasks.runEarly();
                    this._dao.sort(this._caller.data(), this._header().sortInfo())
                        .then((sortedRoots) => this._caller.data(sortedRoots));
                    this._dao.sort(this._callee.data(), this._header().sortInfo())
                        .then((sortedRoots) => this._callee.data(sortedRoots));
                }));
                this._subscriptions.push(this._callee.selectedRows.subscribe((newSelection) => {
                    if (newSelection.length > 0) {
                        this._caller.selectedRows([]);
                        this._current().selected(false);
                    }
                }));
                this._subscriptions.push(this._caller.selectedRows.subscribe((newSelection) => {
                    if (newSelection.length > 0) {
                        this._callee.selectedRows([]);
                        this._current().selected(false);
                    }
                }));
            });
        }
        get header() {
            return this._header;
        }
        get caller() {
            return this._caller;
        }
        get current() {
            return this._current;
        }
        get callee() {
            return this._callee;
        }
        get currentFunctionName() {
            return this._currentFunction;
        }
        get focusedRow() {
            return this._focusedRow;
        }
        get dataLoadStatus() {
            return this._dataLoadStatus;
        }
        contextMenu(viewModel, event) {
            var row = viewModel;
            if (!row.dto) {
                return null;
            }
            this.onClick(viewModel, event);
            var navigator = MainViewModel_2.getMainViewNavigator();
            return plugin.ContextMenu.create([{
                    label: plugin.Resources.getString("CallerCalleeView_ContextMenuSetFunction"),
                    callback: () => this.setFunction(row).then(() => this._current().selected(true)),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ViewSource"),
                    disabled: () => !row.dto.rsf,
                    callback: () => this._dao.viewSource(row.dto.rsf, row.functionLineNumber),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowInModulesView"),
                    callback: () => navigator.navigateToView(MainViewModel_2.MainViews.Modules, row.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowInFunctionsView"),
                    callback: () => navigator.navigateToView(MainViewModel_2.MainViews.Functions, row.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowFunctionDetails"),
                    callback: () => navigator.navigateToView(MainViewModel_2.MainViews.FunctionDetails, row.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_Copy"),
                    callback: this.onCopy.bind(this),
                    type: plugin.ContextMenu.MenuItemType.command
                }]);
        }
        onKeyDownCaller(viewModel, event) {
            if (event.ctrlKey && event.keyCode === KeyCodes_7.KeyCodes.C) {
                var formatted = this._caller.formatSelectedToText();
                void navigator.clipboard.writeText(formatted);
                return false;
            }
            else if (event.keyCode === KeyCodes_7.KeyCodes.Enter) {
                if (this._caller.focusedRow()) {
                    this.setFunction(this._caller.focusedRow())
                        .then(() => this._current().selected(true));
                }
                return false;
            }
            return true;
        }
        onKeyDownCallee(viewModel, event) {
            if (event.ctrlKey && event.keyCode === KeyCodes_7.KeyCodes.C) {
                var formatted = this._callee.formatSelectedToText();
                void navigator.clipboard.writeText(formatted);
                return false;
            }
            else if (event.keyCode === KeyCodes_7.KeyCodes.Enter) {
                if (this._callee.focusedRow()) {
                    this.setFunction(this._callee.focusedRow())
                        .then(() => this._current().selected(true));
                }
                return false;
            }
            return true;
        }
        onKeyDownCurrent(viewModel, event) {
            if (event.ctrlKey && event.keyCode === KeyCodes_7.KeyCodes.C) {
                var tempCurrent = new CallerCallee(this.header());
                tempCurrent.data([this._current()]);
                tempCurrent.selectedRows(this._current().selected() ? [0] : []);
                var formatted = tempCurrent.formatSelectedToText();
                void navigator.clipboard.writeText(formatted);
                return false;
            }
            else if (event.keyCode === KeyCodes_7.KeyCodes.ArrowUp || event.keyCode === KeyCodes_7.KeyCodes.ArrowDown) {
                this._current().selected(true);
                this._caller.selectedRows([]);
                this._callee.selectedRows([]);
                return false;
            }
            return true;
        }
        onCopy() {
            if (this._caller.selectedRows().length > 0) {
                var formatted = this._caller.formatSelectedToText();
                void navigator.clipboard.writeText(formatted);
            }
            else if (this._callee.selectedRows().length > 0) {
                var formatted = this._callee.formatSelectedToText();
                void navigator.clipboard.writeText(formatted);
            }
            else if (this._current().selected()) {
                var tempCurrent = new CallerCallee(this.header());
                tempCurrent.data([this._current()]);
                tempCurrent.selectedRows(this._current().selected() ? [0] : []);
                var formatted = tempCurrent.formatSelectedToText();
                void navigator.clipboard.writeText(formatted);
            }
        }
        onClick(viewModel, event) {
            var context = ko.contextFor(event.target);
            if (!context || !context.$data.dto) {
                return;
            }
            if (context.$parent === this) {
                this._current().selected(true);
                this._caller.selectedRows([]);
                this._callee.selectedRows([]);
                return;
            }
            var callerCallee = context.$parent;
            var rowIndex = callerCallee.data().indexOf(context.$data);
            if (event.ctrlKey) {
                var selectedIndex = callerCallee.selectedRows.indexOf(rowIndex);
                if (selectedIndex === -1) {
                    callerCallee.selectedRows.push(rowIndex);
                }
                else {
                    callerCallee.selectedRows.splice(selectedIndex, 1);
                }
            }
            else if (event.shiftKey) {
                var start = Math.max(Math.min(callerCallee.focusedRowIndex(), rowIndex), 0);
                var end = Math.max(callerCallee.focusedRowIndex(), rowIndex);
                var initialSelection = callerCallee.selectedRows();
                var selectionToAdd = [];
                for (var indexToSelect = start; indexToSelect <= end; ++indexToSelect) {
                    if (initialSelection.indexOf(indexToSelect) === -1) {
                        selectionToAdd.push(indexToSelect);
                    }
                }
                if (callerCallee.focusedRowIndex() > rowIndex) {
                    selectionToAdd.reverse();
                }
                selectionToAdd.forEach((selection) => callerCallee.selectedRows.push(selection));
            }
            else {
                callerCallee.selectedRows([rowIndex]);
            }
        }
        onDblClick(viewModel, event) {
            if (event.which !== KeyCodes_7.MouseCodes.Left) {
                return;
            }
            var context = ko.contextFor(event.target);
            if (!context && !context.$data.dto) {
                return;
            }
            if (context.$parent instanceof CallerCallee && context.$parent.focusedRow() === context.$data) {
                viewModel.setFunction(context.$data);
            }
            else {
                this.onClick(viewModel, event);
            }
        }
        onAfterDomInsert(elements, viewModel) {
            var container = document.querySelector(".callerCallee");
            var callerRow = container.querySelector(".callerCallee .callers thead");
            var current = container.querySelector(".callerCallee .current thead");
            var calleeRow = container.querySelector(".callerCallee .callees thead");
            viewModel._callee.onAfterDomInsert(container.querySelector(".callerCallee .callees"));
            viewModel._caller.onAfterDomInsert(container.querySelector(".callerCallee .callers"));
            viewModel._header().onAfterDomInsert(container, callerRow, current, calleeRow);
        }
        computeFocusedRow() {
            return this._current() && this._current().selected() ?
                this._current() : null;
        }
        setFunction(rowViewModel) {
            if (this._dataLoadCancellationTokenSource) {
                this._dataLoadCancellationTokenSource.cancel();
            }
            this._dataLoadCancellationTokenSource = new Cancellation_2.CancellationTokenSource();
            this._dataLoadCancellationTokenSource.token.onCancellationRequested.addEventListener(() => {
                this._dataLoadStatus(CpuUsage_Interfaces_9.DataLoadEvent.DataLoadCanceled);
            }, { once: true });
            this._current().selected(false);
            this._caller.selectedRows([]);
            this._callee.selectedRows([]);
            ko.tasks.runEarly();
            this._dataLoadStatus(CpuUsage_Interfaces_9.DataLoadEvent.DataLoadStart);
            this._dataLoadPromise = this._dao.getData(this._header().sortInfo(), rowViewModel.dto.k)
                .then((data) => {
                this._caller.data(data.callers);
                this._callee.data(data.callees);
                this.current(data.current);
                this._currentFunction(data.current.name);
                this._dataLoadStatus(CpuUsage_Interfaces_9.DataLoadEvent.DataLoadCompleted);
            });
            this._dataLoadPromise.then(() => {
                this._dataLoadPromise = null;
            }, (error) => {
                this._dataLoadPromise = null;
            });
            return this._dataLoadPromise;
        }
        dispose() {
            this._header().dispose();
            this._subscriptions.forEach((s) => s.dispose());
            this._caller.dispose();
            this._callee.dispose();
        }
    }
    exports.CallerCalleeViewModel = CallerCalleeViewModel;
});
define("DAO/ProcessesDAO", ["require", "exports", "plugin-vs-v2", "Misc/SortFunctions", "ViewModels/DynamicTreeRowViewModel"], function (require, exports, plugin, SortFunctions_4, DynamicTreeRowViewModel_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProcessesDAO = void 0;
    var _processesMarshalerProxy = null;
    class ProcessesDAO {
        constructor(config) {
            this._config = config;
        }
        static create() {
            if (_processesMarshalerProxy === null) {
                _processesMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.ProcessesMarshaler", {}, true);
            }
            return _processesMarshalerProxy._call("config")
                .then((config) => new ProcessesDAO(config));
        }
        get defaultSortColumn() {
            return this._config.defaultSortColumn;
        }
        getHeader() {
            return _processesMarshalerProxy._call("header");
        }
        getRoots(resultId, sortInfo, cancellationToken) {
            var processes = _processesMarshalerProxy._call("getProcesses");
            return processes
                .then((dtos) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return dtos.map((dto) => new DynamicTreeRowViewModel_2.DynamicTreeRowViewModel(null, dto, this._config.columns, 0));
            })
                .then((roots) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                var expands = roots.map((row) => this.expand(row, sortInfo, cancellationToken));
                return Promise.all(expands).then(() => roots);
            })
                .then((rows) => this.sort(rows, sortInfo, cancellationToken));
        }
        expand(row, sortInfo, cancellationToken) {
            var dataLoadPromise = Promise.resolve();
            var treeRow = row;
            if (treeRow.expanded === null) {
                return dataLoadPromise;
            }
            if (treeRow.children().length === 0) {
                var children = treeRow.dto.c.map((dto) => new DynamicTreeRowViewModel_2.DynamicTreeRowViewModel(treeRow, dto, this._config.columns, treeRow.depth + 1));
                row.children(children);
            }
            treeRow.expanded(!treeRow.expanded());
            cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
            return dataLoadPromise;
        }
        search(query, isCaseSensitive, isRegex, startingRow, sortInfo, cancellationToken) {
            var row = startingRow;
            return _processesMarshalerProxy._call("search", query, isCaseSensitive, isRegex, row ? row.dto.id : null, row ? !row.parent : null)
                .then(ids => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return ids.map((id) => ({ nodeId: id }));
            });
        }
        sort(roots, sortInfo, cancellationToken) {
            var sortFunc = SortFunctions_4.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            var sortChildren = (element) => {
                if (element.children) {
                    element.children.sort(sortFunc);
                    element.children().forEach(sortChildren);
                }
            };
            return _processesMarshalerProxy._call("sort", sortInfo.columnId, sortInfo.direction)
                .then(() => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                roots.sort(sortFunc);
                roots.forEach(sortChildren);
                return roots;
            });
        }
        getColumnSettings() {
            return _processesMarshalerProxy._call("columnSettings");
        }
        onColumnChanged(column) {
            _processesMarshalerProxy._call("columnSettingsChanged", column);
        }
    }
    exports.ProcessesDAO = ProcessesDAO;
});
define("ViewModels/SearchControlViewModel", ["require", "exports", "Misc/KeyCodes", "Misc/Cancellation", "template!SearchControlView"], function (require, exports, KeyCodes_8, Cancellation_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchControlViewModel = void 0;
    class SearchControlViewModel {
        constructor(model, isEnabled, ariaLabelToken) {
            this._showSettings = ko.observable(false);
            this._searchInputHasFocus = ko.observable(false);
            this._searchSubmitHasFocus = ko.observable(false);
            this._isRegularExpression = ko.observable(false);
            this._isRegularExpressionHasFocus = ko.observable(false);
            this._isCaseSensitive = ko.observable(false);
            this._isCaseSensitiveHasFocus = ko.observable(false);
            this._searchTerm = ko.observable("");
            this._autoCollapseTimeoutMs = null;
            this._isDisabled = ko.observable(false);
            this._model = model;
            this._ariaLabelToken = ariaLabelToken;
            this._isRegularExpression.subscribe((newValue) => {
                window.clearTimeout(this._autoCollapseTimeoutMs);
                this._autoCollapseTimeoutMs = window.setTimeout(() => this.showSettings(false), SearchControlViewModel.autoCollapseTimeMs);
            });
            this._isCaseSensitive.subscribe((newValue) => {
                window.clearTimeout(this._autoCollapseTimeoutMs);
                this._autoCollapseTimeoutMs = window.setTimeout(() => this.showSettings(false), SearchControlViewModel.autoCollapseTimeMs);
            });
            this._showSettings.subscribe((visible) => {
                window.clearTimeout(this._autoCollapseTimeoutMs);
                this._autoCollapseTimeoutMs = null;
            });
            this._hasFocus = ko.pureComputed(() => {
                return !this._isDisabled() && (this._searchInputHasFocus() || this._searchSubmitHasFocus());
            });
            this._isDisabled(!isEnabled);
        }
        get ariaLabelToken() {
            return this._ariaLabelToken;
        }
        get showSettings() {
            return this._showSettings;
        }
        get isDisabled() {
            return this._isDisabled;
        }
        get hasFocus() {
            return this._hasFocus;
        }
        get searchInputHasFocus() {
            return this._searchInputHasFocus;
        }
        get searchSubmitHasFocus() {
            return this._searchSubmitHasFocus;
        }
        get isCaseSensitive() {
            return this._isCaseSensitive;
        }
        get isCaseSensitiveHasFocus() {
            return this._isCaseSensitiveHasFocus;
        }
        get isRegularExpression() {
            return this._isRegularExpression;
        }
        get isRegularExpressionHasFocus() {
            return this._isRegularExpressionHasFocus;
        }
        get searchTerm() {
            return this._searchTerm;
        }
        static get autoCollapseTimeMs() {
            return 2000;
        }
        onAfterDomInsert(elements, viewModel) {
            var element = elements[0].parentNode;
            var onMouseDown = (event) => {
                if (!viewModel.showSettings() || viewModel.isDisabled()) {
                    return;
                }
                if (!element.contains(event.target)) {
                    viewModel.showSettings(false);
                }
            };
            var onKeyDown = (event) => {
                if (event.keyCode === KeyCodes_8.KeyCodes.F3) {
                    viewModel.search();
                    event.preventDefault();
                }
            };
            var onBlur = (event) => {
                if (viewModel.showSettings() && !element.contains(event.target)) {
                    viewModel.showSettings(false);
                }
            };
            element.addEventListener("blur", onBlur, true);
            window.addEventListener("keydown", onKeyDown);
            window.addEventListener("mousedown", onMouseDown);
            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                window.removeEventListener("keydown", onKeyDown);
                window.removeEventListener("mousedown", onMouseDown);
                element.removeEventListener("blur", onBlur);
            });
        }
        search() {
            if (this.isDisabled()) {
                return;
            }
            this._model.search(this._searchTerm(), this._isCaseSensitive(), this._isRegularExpression(), Cancellation_3.CancellationToken.None);
        }
        onDropDownClick(viewModel, event) {
            if (this.isDisabled()) {
                return false;
            }
            this._showSettings(!this._showSettings());
            return false;
        }
        onSearchBoxKeyDown(viewModel, event) {
            if (this.isDisabled()) {
                return true;
            }
            if (KeyCodes_8.KeyCodes.Enter === event.keyCode) {
                this.search();
                return false;
            }
            else if (KeyCodes_8.KeyCodes.Escape === event.keyCode) {
                this._searchTerm("");
                return false;
            }
            else if (KeyCodes_8.KeyCodes.ArrowDown === event.keyCode) {
                this._showSettings(true);
                this.isRegularExpressionHasFocus(true);
                return false;
            }
            return true;
        }
        onFlyoutKeyDown(viewModel, event) {
            if (KeyCodes_8.KeyCodes.ArrowUp === event.keyCode || KeyCodes_8.KeyCodes.ArrowDown === event.keyCode) {
                var toggleFocus = this.isRegularExpressionHasFocus();
                this.isRegularExpressionHasFocus(!toggleFocus);
                this.isCaseSensitiveHasFocus(toggleFocus);
                return false;
            }
            else if (KeyCodes_8.KeyCodes.Escape === event.keyCode) {
                this._showSettings(false);
                return false;
            }
            return true;
        }
    }
    exports.SearchControlViewModel = SearchControlViewModel;
});
define("ViewModels/ProcessesViewModel", ["require", "exports", "plugin-vs-v2", "CpuUsage.Interfaces", "Grid/TreeGridViewModel", "Grid/TreeGridHeaderViewModel", "Grid/TreeGridUtils", "DAO/ProcessesDAO", "Misc/KeyCodes", "ViewModels/MainViewModel", "ViewModels/SearchControlViewModel"], function (require, exports, plugin, CpuUsage_Interfaces_10, TreeGridViewModel_1, TreeGridHeaderViewModel_1, TreeGridUtils_2, ProcessesDAO_1, KeyCodes_9, MainViewModel_3, SearchControlViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProcessesViewModel = void 0;
    class ProcessesViewModel {
        constructor(additionalActions, context) {
            this._treeGrid = ko.observable();
            ProcessesDAO_1.ProcessesDAO.create()
                .then((dao) => this._dao = dao)
                .then(() => this._dao.getHeader())
                .then((config) => {
                var header = new TreeGridHeaderViewModel_1.TreeGridHeaderViewModel(config, this._dao, this._dao.defaultSortColumn);
                header.sortDirection(CpuUsage_Interfaces_10.SortDirection.Asc);
                this._treeGrid(new TreeGridViewModel_1.TreeGridViewModel(this._dao, header, "ProcessesView_TableAriaLabel"));
                if (context && context.ctype === MainViewModel_3.ContextType.Thread) {
                    this._treeGrid().dataLoadPromise.then(() => {
                        var allRows = this._treeGrid().treeAsArray();
                        for (var rowIndex = 0; rowIndex < allRows.length; ++rowIndex) {
                            var row = allRows[rowIndex];
                            if (row.dto.k && row.dto.k.cid === context.cid) {
                                this._treeGrid().selectedRows.push(rowIndex);
                                break;
                            }
                        }
                    });
                }
                additionalActions([
                    { template: 'SearchControlView', viewModel: new SearchControlViewModel_1.SearchControlViewModel(this._treeGrid(), true, 'Processes_SearchAriaLabel') }
                ]);
            });
        }
        get processesList() {
            return this._treeGrid;
        }
        contextMenu(viewModel, event) {
            var row = viewModel;
            if (!row.dto) {
                return null;
            }
            this._treeGrid().onClick(this._treeGrid(), event);
            return plugin.ContextMenu.create([{
                    label: plugin.Resources.getString("ContextMenu_Copy"),
                    callback: this.onCopy.bind(this),
                    type: plugin.ContextMenu.MenuItemType.command
                }]);
        }
        onKeyDown(viewModel, event) {
            if (!(event.ctrlKey && event.keyCode === KeyCodes_9.KeyCodes.C)) {
                return true;
            }
            this.onCopy();
            return false;
        }
        onCopy() {
            var formatted = TreeGridUtils_2.TreeGridUtils.formatTreeGridSelectedToText(this._treeGrid());
            void navigator.clipboard.writeText(formatted);
        }
    }
    exports.ProcessesViewModel = ProcessesViewModel;
});
define("DAO/ModulesDAO", ["require", "exports", "plugin-vs-v2", "Misc/SortFunctions", "ViewModels/DynamicTreeRowViewModel"], function (require, exports, plugin, SortFunctions_5, DynamicTreeRowViewModel_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModulesDAO = void 0;
    var _modulesMarshalerProxy = null;
    class ModulesDAO {
        constructor(config, context) {
            this._context = null;
            this._context = context;
            this._config = config;
        }
        static create(context) {
            if (_modulesMarshalerProxy === null) {
                _modulesMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.ModulesMarshaler", {}, true);
            }
            return _modulesMarshalerProxy._call("config")
                .then((config) => new ModulesDAO(config, context));
        }
        get defaultSortColumn() {
            return this._config.defaultSortColumn;
        }
        getHeader() {
            return _modulesMarshalerProxy._call("header");
        }
        getRoots(resultId, sortInfo, cancellationToken) {
            var expandContext = rows => rows;
            if (this._context) {
                expandContext = rows => {
                    rows.forEach(row => {
                        if (row.children && row.children().length) {
                            row.expanded(true);
                            expandContext(row.children());
                        }
                    });
                    return rows;
                };
            }
            return _modulesMarshalerProxy._call("roots", this._context)
                .then((dtos) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return dtos.map(dto => new DynamicTreeRowViewModel_3.DynamicTreeRowViewModel(null, dto, this._config.columns, 0));
            })
                .then(roots => expandContext(roots))
                .then(roots => this.sort(roots, sortInfo, cancellationToken));
        }
        expand(row, sortInfo, cancellationToken) {
            var dataLoadPromise = Promise.resolve();
            var treeRow = row;
            if (treeRow.expanded === null) {
                return dataLoadPromise;
            }
            if (treeRow.children().length === 0) {
                var idPath = [];
                var currentNode = treeRow;
                while (currentNode) {
                    idPath.push(currentNode.id);
                    currentNode = currentNode.parent;
                }
                idPath.reverse();
                dataLoadPromise = _modulesMarshalerProxy._call("children", idPath)
                    .then((dtos) => {
                    cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                    return dtos.map(dto => new DynamicTreeRowViewModel_3.DynamicTreeRowViewModel(treeRow, dto, this._config.columns, treeRow.depth + 1));
                })
                    .then(children => this.sort(children, sortInfo, cancellationToken))
                    .then(sortedChildren => {
                    cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                    return treeRow.children(sortedChildren);
                });
            }
            return dataLoadPromise.then(() => treeRow.expanded(!treeRow.expanded()));
        }
        search(query, isCaseSensitive, isRegex, startingRow, sortInfo, cancellationToken) {
            var startingContext = startingRow ? startingRow.dto.k : null;
            return _modulesMarshalerProxy._call("search", query, isCaseSensitive, isRegex, startingContext)
                .then(ids => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return ids.map((id) => ({ nodeId: id }));
            });
        }
        sort(roots, sortInfo, cancellationToken) {
            var sortFunc = SortFunctions_5.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            var sortChildren = (element) => {
                if (element.children) {
                    element.children.sort(sortFunc);
                    element.children().forEach(sortChildren);
                }
            };
            return _modulesMarshalerProxy._call("sort", sortInfo.columnId, sortInfo.direction)
                .then(() => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                roots.forEach(sortChildren);
                return roots.sort(sortFunc);
            });
        }
        getColumnSettings() {
            return _modulesMarshalerProxy._call("columnSettings");
        }
        onColumnChanged(column) {
            _modulesMarshalerProxy._call("columnSettingsChanged", column);
        }
    }
    exports.ModulesDAO = ModulesDAO;
});
define("ViewModels/ModulesViewModel", ["require", "exports", "plugin-vs-v2", "Grid/TreeGridViewModel", "Grid/TreeGridHeaderViewModel", "Grid/TreeGridUtils", "DAO/ModulesDAO", "Misc/KeyCodes", "ViewModels/MainViewModel", "ViewModels/SearchControlViewModel", "Misc/Cancellation"], function (require, exports, plugin, TreeGridViewModel_2, TreeGridHeaderViewModel_2, TreeGridUtils_3, ModulesDAO_1, KeyCodes_10, MainViewModel_4, SearchControlViewModel_2, Cancellation_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModulesViewModel = void 0;
    class ModulesViewModel {
        constructor(additionalActions, context) {
            this._treeGrid = ko.observable();
            this._navigator = MainViewModel_4.getMainViewNavigator();
            ModulesDAO_1.ModulesDAO.create(context)
                .then((dao) => this._dao = dao)
                .then(() => this._dao.getHeader())
                .then((config) => {
                var header = new TreeGridHeaderViewModel_2.TreeGridHeaderViewModel(config, this._dao, this._dao.defaultSortColumn);
                this._treeGrid(new TreeGridViewModel_2.TreeGridViewModel(this._dao, header, "Modules_TreeGridAriaLabel"));
                additionalActions([
                    { template: 'SearchControlView', viewModel: new SearchControlViewModel_2.SearchControlViewModel(this._treeGrid(), true, 'Modules_SearchAriaLabel') }
                ]);
                if (!context) {
                    return;
                }
                this._treeGrid().dataLoadPromise.then(() => {
                    var allRows = this._treeGrid().treeAsArray();
                    for (var rowIndex = 0; rowIndex < allRows.length; ++rowIndex) {
                        var row = allRows[rowIndex];
                        if (row.dto.k.ctype === context.ctype && row.dto.k.cid === context.cid) {
                            this._treeGrid().selectedRows.push(rowIndex);
                            break;
                        }
                    }
                });
            });
        }
        get treeGrid() {
            return this._treeGrid;
        }
        contextMenu(viewModel, event) {
            var treeRow = viewModel;
            if (!treeRow.dto) {
                return null;
            }
            this._treeGrid().onClick(this._treeGrid(), event);
            var config = [{
                    label: plugin.Resources.getString("ContextMenu_ExpandAll"),
                    callback: () => TreeGridUtils_3.TreeGridUtils.expandAll(this._treeGrid(), this._dao, Cancellation_4.CancellationToken.None),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_CollapseAll"),
                    callback: () => TreeGridUtils_3.TreeGridUtils.collapseAll(this._treeGrid()),
                    type: plugin.ContextMenu.MenuItemType.command
                }];
            if (treeRow.dto.k && treeRow.dto.k.ctype == MainViewModel_4.ContextType.Function) {
                config.push({
                    type: plugin.ContextMenu.MenuItemType.separator
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowInFunctionsView"),
                    callback: () => this._navigator.navigateToView(MainViewModel_4.MainViews.Functions, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowFunctionDetails"),
                    callback: () => this._navigator.navigateToView(MainViewModel_4.MainViews.FunctionDetails, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowCallingFunctions", treeRow.name),
                    callback: () => this._navigator.navigateToView(MainViewModel_4.MainViews.CallerCallee, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowCalledFunctions", treeRow.name),
                    callback: () => this._navigator.navigateToView(MainViewModel_4.MainViews.CallerCallee, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                });
            }
            config.push({
                type: plugin.ContextMenu.MenuItemType.separator
            }, {
                label: plugin.Resources.getString("ContextMenu_Copy"),
                callback: this.onCopy.bind(this),
                type: plugin.ContextMenu.MenuItemType.command
            });
            return plugin.ContextMenu.create(config);
        }
        onKeyDown(viewModel, event) {
            if (!(event.ctrlKey && event.keyCode === KeyCodes_10.KeyCodes.C)) {
                return true;
            }
            this.onCopy();
            return false;
        }
        onCopy() {
            var formatted = TreeGridUtils_3.TreeGridUtils.formatTreeGridSelectedToText(this._treeGrid());
            void navigator.clipboard.writeText(formatted);
        }
    }
    exports.ModulesViewModel = ModulesViewModel;
});
define("ViewModels/FunctionDetailsFunctionViewModel", ["require", "exports", "plugin-vs-v2", "DAO/FunctionDetailsDAO", "Misc/CpuSamplingUtilities"], function (require, exports, plugin, FunctionDetailsDAO_2, CpuSamplingUtilities_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FunctionDetailsFunctionViewModel = void 0;
    class FunctionDetailsFunctionViewModel {
        constructor(dto, metricTooltip) {
            this._dto = dto;
            this._inclusive = this.dto.metric.inclusive;
            this._exclusive = this.dto.metric.exclusive;
            this._inclusiveTooltip = metricTooltip.inclusive;
            this._exclusiveTooltip = metricTooltip.exclusive;
            this._localizedInclusive = CpuSamplingUtilities_3.CpuSamplingUtilities.localizeNumber(this.dto.metric.type === FunctionDetailsDAO_2.PerfMetricType.Percent ? this.inclusive * 100 : this.inclusive, { maximumFractionDigits: 2 });
            this._localizedExclusive = CpuSamplingUtilities_3.CpuSamplingUtilities.localizeNumber(this.dto.metric.type === FunctionDetailsDAO_2.PerfMetricType.Percent ? this.exclusive * 100 : this.exclusive, { maximumFractionDigits: 2 });
        }
        get dto() {
            return this._dto;
        }
        get name() {
            return this._dto.name;
        }
        get canNavigateTo() {
            return true;
        }
        get moduleName() {
            return this._dto.moduleName;
        }
        get inclusive() {
            return this._inclusive;
        }
        get exclusive() {
            return this._exclusive;
        }
        get localizedInclusive() {
            return this._localizedInclusive;
        }
        get localizedExclusive() {
            return this._localizedExclusive;
        }
        get inclusiveTooltip() {
            return this._inclusiveTooltip;
        }
        get exclusiveTooltip() {
            return this._exclusiveTooltip;
        }
        get ariaLabel() {
            return plugin.Resources.getString(this._inclusiveTooltip, this.name, this._localizedInclusive);
        }
        get ariaLabelFunctionBody() {
            return plugin.Resources.getString(this._exclusiveTooltip, this.name, this._localizedExclusive);
        }
    }
    exports.FunctionDetailsFunctionViewModel = FunctionDetailsFunctionViewModel;
});
define("ViewModels/FunctionDetailsViewModel", ["require", "exports", "plugin-vs-v2", "DAO/FunctionDetailsDAO", "Misc/KeyCodes", "ViewModels/MainViewModel", "ViewModels/FunctionDetailsFunctionViewModel", "Misc/Cancellation", "template!FunctionDetailsInclusivePerfMetricView", "template!FunctionDetailsExclusivePerfMetricView"], function (require, exports, plugin, FunctionDetailsDAO_3, KeyCodes_11, MainViewModel_5, FunctionDetailsFunctionViewModel_1, Cancellation_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FunctionDetailsViewModel = void 0;
    class FunctionDetailsViewModel {
        constructor(context) {
            this._dao = new FunctionDetailsDAO_3.FunctionDetailsDAO();
            this._callers = ko.observableArray([]);
            this._currentFunction = ko.observable(null);
            this._callees = ko.observableArray([]);
            this._currentFunctionHasFocus = ko.observable(false);
            this._currentFunctionName = ko.pureComputed(() => this.computeCurrentFunctionName());
            this._currentModuleName = ko.pureComputed(() => this.computeCurrentModuleName());
            this._atTopOfStack = ko.pureComputed(() => this._callers().length === 0);
            this._atBottomOfStack = ko.pureComputed(() => this._callees().length === 0);
            this._currentPerformanceMetric = ko.observable(FunctionDetailsViewModel.currentMetric);
            this._performanceMetrics = [];
            this._performanceMetricTooltips = [];
            this._functionLimit = 5;
            this._subscriptions = [];
            this._navigator = MainViewModel_5.getMainViewNavigator();
            this._performanceMetrics.push({ metricIndex: 0, localizedName: plugin.Resources.getString("FunctionDetails_PerformanceMetricElapsedInclusiveTime") });
            this._performanceMetrics.push({ metricIndex: 1, localizedName: plugin.Resources.getString("FunctionDetails_PerformanceMetricAverageElapsedTime") });
            this._performanceMetricTooltips.push({
                inclusive: "FunctionDetails_ElapsedInclusiveTimePercentTooltip",
                exclusive: "FunctionDetails_ElapsedExclusiveTimePercentTooltip"
            });
            this._performanceMetricTooltips.push({
                inclusive: "FunctionDetails_AverageElapsedInclusiveTimeTooltip",
                exclusive: "FunctionDetails_AverageElapsedExclusiveTimeTooltip"
            });
            this._subscriptions.push(this._currentFunction.subscribe(() => this._dao.updateSourceBrowser(this._currentFunction().dto.context.cid, FunctionDetailsViewModel.currentMetric)));
            if (context) {
                this._subscriptions.push(this._currentFunction.subscribe(() => this._currentFunctionHasFocus(true)));
            }
            this.loadData(context);
            this._subscriptions.push(this._currentPerformanceMetric.subscribe(() => {
                FunctionDetailsViewModel.currentMetric = this._currentPerformanceMetric();
                this.loadData(this._currentFunction().dto.context);
            }));
        }
        get callers() {
            return this._callers;
        }
        get currentFunction() {
            return this._currentFunction;
        }
        get currentFunctionHasFocus() {
            return this._currentFunctionHasFocus;
        }
        get currentFunctionName() {
            return this._currentFunctionName;
        }
        get currentModuleName() {
            return this._currentModuleName;
        }
        get callees() {
            return this._callees;
        }
        get atTopOfStack() {
            return this._atTopOfStack;
        }
        get atBottomOfStack() {
            return this._atBottomOfStack;
        }
        get performanceMetrics() {
            return this._performanceMetrics;
        }
        get currentPerformanceMetric() {
            return this._currentPerformanceMetric;
        }
        dispose() {
            this._subscriptions.forEach((s) => s.dispose());
            if (this._dataLoadCancellationTokenSource) {
                this._dataLoadCancellationTokenSource.cancel();
            }
        }
        navigateTo(viewModel, event) {
            var context = ko.contextFor(event.target);
            if (context && context.$data && context.$data.dto) {
                var dto = context.$data.dto;
                this._navigator.navigateToView(MainViewModel_5.MainViews.FunctionDetails, dto.context);
                return false;
            }
            return true;
        }
        moveToNextFunction(viewModel, event) {
            var focusTarget;
            var targetElement = event.target;
            if (event.keyCode === KeyCodes_11.KeyCodes.ArrowDown) {
                if (targetElement.classList.contains("functions")) {
                    focusTarget = targetElement.firstElementChild;
                }
                else if (targetElement.classList.contains("function")) {
                    focusTarget = targetElement.nextElementSibling;
                }
            }
            else if (event.keyCode === KeyCodes_11.KeyCodes.ArrowUp) {
                if (targetElement.classList.contains("functions")) {
                    focusTarget = targetElement.lastElementChild;
                }
                else if (targetElement.classList.contains("function")) {
                    focusTarget = targetElement.previousElementSibling;
                }
            }
            else {
                return true;
            }
            if (focusTarget) {
                focusTarget.focus();
            }
            return false;
        }
        navigateToCallerCallee(viewModel, event) {
            var cxt = viewModel.currentFunction().dto.context;
            this._navigator.navigateToView(MainViewModel_5.MainViews.CallerCallee, cxt);
        }
        navigateToFunctions(viewModel, event) {
            var cxt = viewModel.currentFunction().dto.context;
            this._navigator.navigateToView(MainViewModel_5.MainViews.Functions, cxt);
        }
        computeCurrentFunctionName() {
            var currentFunction = this.currentFunction();
            return currentFunction ? currentFunction.name : "";
        }
        computeCurrentModuleName() {
            var currentFunction = this.currentFunction();
            return currentFunction ? currentFunction.moduleName : "";
        }
        loadData(context) {
            if (this._dataLoadCancellationTokenSource) {
                this._dataLoadCancellationTokenSource.cancel();
            }
            this._dataLoadCancellationTokenSource = new Cancellation_5.CancellationTokenSource();
            this._dataLoadCancellationTokenSource.token.onCancellationRequested.addEventListener(() => {
                this._dataLoadCancellationTokenSource = null;
            }, { once: true });
            const cancellationToken = this._dataLoadCancellationTokenSource.token;
            this._dataLoadPromise = this._dao.getData(FunctionDetailsViewModel.currentMetric, context)
                .then((result) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                if (result === null) {
                    this._currentFunction(null);
                    this._callers([]);
                    this._callees([]);
                    return;
                }
                var metricTooltip = this._performanceMetricTooltips[FunctionDetailsViewModel.currentMetric];
                var callers = result.callers
                    .map((caller) => new FunctionDetailsFunctionViewModel_1.FunctionDetailsFunctionViewModel(caller, metricTooltip));
                var callees = result.callees
                    .map((callee) => new FunctionDetailsFunctionViewModel_1.FunctionDetailsFunctionViewModel(callee, metricTooltip));
                this._currentFunction(new FunctionDetailsFunctionViewModel_1.FunctionDetailsFunctionViewModel(result.current, metricTooltip));
                this._callers(callers);
                this._callees(callees);
            });
            this._dataLoadPromise.then(() => {
                this._dataLoadPromise = null;
            }, (error) => {
                this._dataLoadPromise = null;
            });
        }
    }
    exports.FunctionDetailsViewModel = FunctionDetailsViewModel;
    FunctionDetailsViewModel.currentMetric = 0;
});
define("DAO/CallTreeDAO", ["require", "exports", "plugin-vs-v2", "Misc/SortFunctions", "ViewModels/DynamicTreeRowViewModel"], function (require, exports, plugin, SortFunctions_6, DynamicTreeRowViewModel_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallTreeDAO = void 0;
    var _callTreeMarshalerProxy = null;
    class CallTreeDAO {
        constructor(config) {
            this._root = ko.observable(null);
            this._config = config;
        }
        static create() {
            if (_callTreeMarshalerProxy === null) {
                _callTreeMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.CallTreeMarshaler", {}, true);
            }
            return _callTreeMarshalerProxy._call("config")
                .then((config) => new CallTreeDAO(config));
        }
        get defaultSortColumn() {
            return this._config.defaultSortColumn;
        }
        getHeader() {
            return _callTreeMarshalerProxy._call("header");
        }
        get root() {
            return this._root;
        }
        clearCache() {
            _callTreeMarshalerProxy._post("clearCache");
        }
        shouldShowInfoBar() {
            return _callTreeMarshalerProxy._call("shouldShowInfoBar");
        }
        showNoiseReduction() {
            return _callTreeMarshalerProxy._call("showNoiseReduction");
        }
        trimCallTree() {
            return _callTreeMarshalerProxy._call("trimCallTree");
        }
        viewSource(filePath, lineNumber) {
            _callTreeMarshalerProxy._call("viewSource", filePath, lineNumber);
        }
        expandHotPath(startingRow) {
            if (startingRow) {
                return _callTreeMarshalerProxy._call("expandHotPath", startingRow.dto.uid);
            }
            else {
                return _callTreeMarshalerProxy._call("expandHotPath");
            }
        }
        getRoots(resultId, sortInfo, cancellationToken) {
            if (this.root()) {
                return Promise.resolve([new DynamicTreeRowViewModel_4.DynamicTreeRowViewModel(null, this.root(), this._config.columns, 0)]);
            }
            return _callTreeMarshalerProxy._call("roots")
                .then((dtos) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return dtos.map((dto) => new DynamicTreeRowViewModel_4.DynamicTreeRowViewModel(null, dto, this._config.columns, 0));
            })
                .then((roots) => this.sort(roots, sortInfo, cancellationToken));
        }
        expand(row, sortInfo, cancellationToken) {
            var dataLoadPromise = Promise.resolve();
            var treeRow = row;
            if (treeRow.expanded === null) {
                return dataLoadPromise;
            }
            if (treeRow.children().length === 0) {
                dataLoadPromise = _callTreeMarshalerProxy._call("children", treeRow.dto.uid)
                    .then((dtos) => {
                    cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                    return dtos.map((dto) => new DynamicTreeRowViewModel_4.DynamicTreeRowViewModel(treeRow, dto, this._config.columns, row.depth + 1));
                })
                    .then((children) => this.sort(children, sortInfo, cancellationToken))
                    .then((sortedChildren) => {
                    cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                    return row.children(sortedChildren);
                });
            }
            return dataLoadPromise.then(() => treeRow.expanded(!treeRow.expanded()));
        }
        search(query, isCaseSensitive, isRegex, startingRow, sortInfo, cancellationToken) {
            return _callTreeMarshalerProxy._call("search", query, isCaseSensitive, isRegex, startingRow ? startingRow.dto.uid : null)
                .then(ids => ids.map((id) => ({ nodeId: id })));
        }
        sort(roots, sortInfo, cancellationToken) {
            var sortFunc = SortFunctions_6.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            var sortChildren = (element) => {
                if (element.children) {
                    element.children.sort(sortFunc);
                    element.children().forEach(sortChildren);
                }
            };
            return _callTreeMarshalerProxy._call("sort", sortInfo.columnId, sortInfo.direction)
                .then(() => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                roots.sort(sortFunc);
                roots.forEach(sortChildren);
                return roots;
            });
        }
        getColumnSettings() {
            return _callTreeMarshalerProxy._call("columnSettings");
        }
        onColumnChanged(column) {
            _callTreeMarshalerProxy._call("columnSettingsChanged", column);
        }
    }
    exports.CallTreeDAO = CallTreeDAO;
});
define("ViewModels/ToggleButtonViewModel", ["require", "exports", "template!ToggleButtonView"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleButtonViewModel = void 0;
    class ToggleButtonViewModel {
        constructor(svgIcon, svgDisabledIcon, ariaLabel) {
            this._isEnabled = ko.observable(false);
            this._isChecked = ko.observable(false);
            this._svgIcon = ko.pureComputed(() => this._isEnabled() ? svgIcon : svgDisabledIcon);
            this._ariaLabel = ariaLabel;
        }
        get svgIcon() {
            return this._svgIcon;
        }
        get ariaLabel() {
            return this._ariaLabel;
        }
        get isEnabled() {
            return this._isEnabled;
        }
        get isChecked() {
            return this._isChecked;
        }
        onClick(viewModel, event) {
            if (this._isEnabled()) {
                this.isChecked(!this.isChecked());
                return false;
            }
            return true;
        }
    }
    exports.ToggleButtonViewModel = ToggleButtonViewModel;
});
define("ViewModels/ToolbarItemViewModel", ["require", "exports", "template!ToolbarItemView"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToolbarItemViewModel = void 0;
    class ToolbarItemViewModel {
        constructor(svgIcon, ariaLabel, callback) {
            this._svgIcon = svgIcon;
            this._ariaLabel = ariaLabel;
            this._callback = callback;
        }
        get svgIcon() {
            return this._svgIcon;
        }
        get ariaLabel() {
            return this._ariaLabel;
        }
        get callback() {
            return this._callback;
        }
    }
    exports.ToolbarItemViewModel = ToolbarItemViewModel;
});
define("ViewModels/CallTreeViewModel", ["require", "exports", "plugin-vs-v2", "CpuUsage.Interfaces", "Grid/TreeGridViewModel", "Grid/TreeGridHeaderViewModel", "DAO/CallTreeDAO", "Grid/TreeGridUtils", "Misc/InformationBarControl", "Misc/KeyCodes", "ViewModels/MainViewModel", "ViewModels/SearchControlViewModel", "ViewModels/ToggleButtonViewModel", "ViewModels/ToolbarItemViewModel", "Misc/Cancellation"], function (require, exports, plugin, CpuUsage_Interfaces_11, TreeGridViewModel_3, TreeGridHeaderViewModel_3, CallTreeDAO_1, TreeGridUtils_4, InformationBarControl_1, KeyCodes_12, MainViewModel_6, SearchControlViewModel_3, ToggleButtonViewModel_1, ToolbarItemViewModel_1, Cancellation_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallTreeViewModel = void 0;
    class CallTreeViewModel {
        constructor(additionalActions) {
            this._treeGrid = ko.observable();
            this._subscriptions = [];
            CallTreeDAO_1.CallTreeDAO.create()
                .then((dao) => this._dao = dao)
                .then(() => this._dao.getHeader())
                .then((config) => {
                var header = new TreeGridHeaderViewModel_3.TreeGridHeaderViewModel(config, this._dao, this._dao.defaultSortColumn);
                header.sortDirection(CpuUsage_Interfaces_11.SortDirection.Desc);
                this._treeGrid(new TreeGridViewModel_3.TreeGridViewModel(this._dao, header, "CallTree_TreeGridAriaLabel"));
                this._hotPathToggleButton = new ToggleButtonViewModel_1.ToggleButtonViewModel('hotPathIcon', 'hotPathDisabledIcon', 'CallTree_ShowHighlighting');
                this._treeGrid().showHotPathHighlighting = this._hotPathToggleButton.isChecked;
                additionalActions([
                    { template: 'ToolbarItemView', viewModel: new ToolbarItemViewModel_1.ToolbarItemViewModel('hotItemIcon', 'CallTree_ExpandHotPath', () => this.onExpandHotPath()) },
                    { template: 'ToggleButtonView', viewModel: this._hotPathToggleButton },
                    { template: 'ToolbarItemView', viewModel: new ToolbarItemViewModel_1.ToolbarItemViewModel('noiseReductionIcon', 'CallTree_NoiseReduction', () => this.onShowNoiseReduction()) },
                    { template: 'SearchControlView', viewModel: new SearchControlViewModel_3.SearchControlViewModel(this._treeGrid(), true, 'CallTree_SearchAriaLabel') }
                ]);
                this.queryForInfoBar();
                this._subscriptions.push(this._dao.root.subscribe(() => {
                    this._treeGrid().reloadData();
                    this._treeGrid().dataLoadPromise.then(() => this.onExpandHotPath());
                }));
                this._treeGrid().dataLoadPromise.then(() => this.onExpandHotPath());
            });
        }
        get treeGrid() {
            return this._treeGrid;
        }
        dispose() {
            this._dao.clearCache();
            this._subscriptions.forEach((s) => s.dispose());
        }
        contextMenu(viewModel, event) {
            var treeRow = viewModel;
            if (!treeRow.dto) {
                return null;
            }
            this._treeGrid().onClick(this._treeGrid(), event);
            var navigator = MainViewModel_6.getMainViewNavigator();
            var config = [{
                    label: plugin.Resources.getString("CallTree_ContextMenuSetRoot"),
                    callback: () => this._dao.root(treeRow.dto),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("CallTree_ContextMenuResetRoot"),
                    callback: () => this._dao.root(null),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    type: plugin.ContextMenu.MenuItemType.separator
                }, {
                    label: plugin.Resources.getString("ContextMenu_ExpandAll"),
                    callback: () => TreeGridUtils_4.TreeGridUtils.expandAll(this._treeGrid(), this._dao, Cancellation_6.CancellationToken.None),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_CollapseAll"),
                    callback: () => TreeGridUtils_4.TreeGridUtils.collapseAll(this._treeGrid()),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ExpandSelection"),
                    callback: () => TreeGridUtils_4.TreeGridUtils.expandSelection(this._treeGrid(), this._dao, Cancellation_6.CancellationToken.None),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_CollapseSelection"),
                    callback: () => TreeGridUtils_4.TreeGridUtils.collapseSelected(this._treeGrid()),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ExpandHotPath"),
                    callback: this.onExpandHotPath.bind(this),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    type: plugin.ContextMenu.MenuItemType.separator
                }, {
                    label: plugin.Resources.getString("ContextMenu_ViewSource"),
                    disabled: () => !treeRow.dto.rsf,
                    callback: () => this._dao.viewSource(treeRow.dto.rsf, treeRow.functionLineNumber),
                    type: plugin.ContextMenu.MenuItemType.command
                }];
            if (treeRow.dto.k && treeRow.dto.k.ctype === MainViewModel_6.ContextType.Function) {
                config.push({
                    label: plugin.Resources.getString("ContextMenu_ShowInModulesView"),
                    callback: () => navigator.navigateToView(MainViewModel_6.MainViews.Modules, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowInFunctionsView"),
                    callback: () => navigator.navigateToView(MainViewModel_6.MainViews.Functions, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowFunctionDetails"),
                    callback: () => navigator.navigateToView(MainViewModel_6.MainViews.FunctionDetails, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowCallingFunctions", treeRow.name),
                    callback: () => navigator.navigateToView(MainViewModel_6.MainViews.CallerCallee, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowCalledFunctions", treeRow.name),
                    callback: () => navigator.navigateToView(MainViewModel_6.MainViews.CallerCallee, treeRow.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                });
            }
            config.push({
                type: plugin.ContextMenu.MenuItemType.separator
            }, {
                label: plugin.Resources.getString("ContextMenu_Copy"),
                callback: this.onCopy.bind(this),
                type: plugin.ContextMenu.MenuItemType.command
            }, {
                label: plugin.Resources.getString("ContextMenu_SelectStack"),
                callback: () => TreeGridUtils_4.TreeGridUtils.selectParentsOfFocusedRow(this._treeGrid()),
                type: plugin.ContextMenu.MenuItemType.command,
                disabled: () => { return this._treeGrid().focusedRowIndex() === -1; }
            });
            return plugin.ContextMenu.create(config);
        }
        onKeyDown(viewModel, event) {
            if (!(event.ctrlKey && event.keyCode === KeyCodes_12.KeyCodes.C)) {
                return true;
            }
            this.onCopy();
            return false;
        }
        onExpandFoldedNodes() {
        }
        onExpandHotPath() {
            this._treeGrid().treeAsArray().forEach((row) => {
                row.isHotPath(false);
                row.isHotItem(false);
            });
            var currentNode = this._treeGrid().focusedRow() || (this._dao.root() ? this._treeGrid().roots()[0] : null);
            var currentChildren = currentNode ? [currentNode] : this._treeGrid().roots();
            var expandPath = (result) => {
                var nodeToHighlight = result.shift();
                for (var nodeIndex = 0; nodeIndex < currentChildren.length; ++nodeIndex) {
                    currentNode = currentChildren[nodeIndex];
                    if (currentNode.id === nodeToHighlight.id) {
                        currentNode.isHotItem(nodeToHighlight.hi);
                        currentNode.isHotPath(nodeToHighlight.hp);
                        break;
                    }
                }
                if (result.length > 0) {
                    if (!nodeToHighlight.f) {
                        return expandPath(result);
                    }
                    else if (!currentNode.expanded()) {
                        return this._dao.expand(currentNode, this._treeGrid().header.sortInfo(), Cancellation_6.CancellationToken.None)
                            .then(() => currentChildren = currentNode.children())
                            .then(() => expandPath(result));
                    }
                    else {
                        currentChildren = currentNode.children();
                        return expandPath(result);
                    }
                }
                ko.tasks.schedule(() => {
                    var indexToSelect = this._treeGrid().treeAsArray().indexOf(currentNode);
                    if (-1 !== indexToSelect) {
                        this._treeGrid().selectedRows([indexToSelect]);
                    }
                });
                return;
            };
            this._dao.expandHotPath(currentNode)
                .then((path) => {
                if (!currentNode) {
                    path.shift();
                }
                return expandPath(path);
            }).then(() => {
                this._hotPathToggleButton.isEnabled(true);
                this._hotPathToggleButton.isChecked(true);
            });
        }
        onShowNoiseReduction() {
            this._dao.showNoiseReduction()
                .then((applied) => {
                if (!applied) {
                    return;
                }
                this._treeGrid().reloadData();
                this._treeGrid().dataLoadPromise
                    .then(() => this.onExpandHotPath());
                return this.queryForInfoBar();
            });
        }
        onCopy() {
            var formatted = TreeGridUtils_4.TreeGridUtils.formatTreeGridSelectedToText(this._treeGrid());
            void navigator.clipboard.writeText(formatted);
        }
        queryForInfoBar() {
            return this._dao.shouldShowInfoBar().then((showInfoBar) => {
                var infoBarProvider = MainViewModel_6.getInfoBarProvider();
                infoBarProvider.clearInfoBars();
                if (showInfoBar) {
                    var infoBar = new InformationBarControl_1.InformationBarControl("CallTree_InfoNoiseReductionEnabled", () => infoBarProvider.clearInfoBars(), "CallTree_InfoNoiseReductionConfigureLink", () => this.onShowNoiseReduction());
                    infoBarProvider.showInfoBar(infoBar);
                }
            });
        }
    }
    exports.CallTreeViewModel = CallTreeViewModel;
});
define("DAO/FunctionsDAO", ["require", "exports", "plugin-vs-v2", "Misc/SortFunctions", "ViewModels/DynamicTreeRowViewModel", "ViewModels/MainViewModel"], function (require, exports, plugin, SortFunctions_7, DynamicTreeRowViewModel_5, MainViewModel_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FunctionsDAO = void 0;
    var _functionsMarshalerProxy = null;
    class FunctionsDAO {
        constructor(config) {
            this._config = config;
        }
        static create() {
            if (_functionsMarshalerProxy === null) {
                _functionsMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.FunctionsMarshaler", {}, true);
            }
            return _functionsMarshalerProxy._call("config")
                .then((config) => new FunctionsDAO(config));
        }
        get defaultSortColumn() {
            return this._config.defaultSortColumn;
        }
        getHeader() {
            return _functionsMarshalerProxy._call("header");
        }
        getRoots(resultId, sortInfo, cancellationToken) {
            var navigator = MainViewModel_7.getMainViewNavigator();
            var crossReference = (dto) => navigator.navigateToView(MainViewModel_7.MainViews.FunctionDetails, dto.k);
            return _functionsMarshalerProxy._call("getFunctions")
                .then((dtos) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return dtos.map((dto) => new DynamicTreeRowViewModel_5.DynamicTreeRowViewModel(null, dto, this._config.columns, 0, crossReference));
            })
                .then((rows) => this.sort(rows, sortInfo, cancellationToken));
        }
        expand(row, sortInfo, cancellationToken) {
            return null;
        }
        search(query, isCaseSensitive, isRegex, startingRow, sortInfo, cancellationToken) {
            var startId = startingRow ? startingRow.id : null;
            return _functionsMarshalerProxy._call("search", query, isCaseSensitive, isRegex, startId)
                .then(ids => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return ids.map((id) => ({ nodeId: id }));
            });
        }
        sort(roots, sortInfo, cancellationToken) {
            var sortFunc = SortFunctions_7.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            return _functionsMarshalerProxy._call("sort", sortInfo.columnId, sortInfo.direction)
                .then(() => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return roots.sort(sortFunc);
            });
        }
        viewSource(filePath, lineNumber) {
            _functionsMarshalerProxy._call("viewSource", filePath, lineNumber);
        }
        getColumnSettings() {
            return _functionsMarshalerProxy._call("columnSettings");
        }
        onColumnChanged(column) {
            _functionsMarshalerProxy._call("columnSettingsChanged", column);
        }
    }
    exports.FunctionsDAO = FunctionsDAO;
});
define("ViewModels/FunctionsViewModel", ["require", "exports", "plugin-vs-v2", "CpuUsage.Interfaces", "Grid/TreeGridViewModel", "Grid/TreeGridHeaderViewModel", "Grid/TreeGridUtils", "DAO/FunctionsDAO", "Misc/KeyCodes", "ViewModels/MainViewModel", "ViewModels/SearchControlViewModel"], function (require, exports, plugin, CpuUsage_Interfaces_12, TreeGridViewModel_4, TreeGridHeaderViewModel_4, TreeGridUtils_5, FunctionsDAO_1, KeyCodes_13, MainViewModel_8, SearchControlViewModel_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FunctionsViewModel = void 0;
    class FunctionsViewModel {
        constructor(additionalActions, context) {
            this._treeGrid = ko.observable();
            FunctionsDAO_1.FunctionsDAO.create()
                .then((dao) => this._dao = dao)
                .then(() => this._dao.getHeader())
                .then((config) => {
                var header = new TreeGridHeaderViewModel_4.TreeGridHeaderViewModel(config, this._dao, this._dao.defaultSortColumn);
                header.sortDirection(CpuUsage_Interfaces_12.SortDirection.Desc);
                this._treeGrid(new TreeGridViewModel_4.TreeGridViewModel(this._dao, header, "FunctionsView_TableAriaLabel"));
                additionalActions([
                    { template: 'SearchControlView', viewModel: new SearchControlViewModel_4.SearchControlViewModel(this._treeGrid(), true, 'FunctionsView_SearchAriaLabel') }
                ]);
                if (!context) {
                    return;
                }
                this._treeGrid().dataLoadPromise.then(() => {
                    var allRows = this._treeGrid().treeAsArray();
                    for (var rowIndex = 0; rowIndex < allRows.length; ++rowIndex) {
                        var row = allRows[rowIndex];
                        if (row.dto.k.cid === context.cid) {
                            this._treeGrid().selectedRows.push(rowIndex);
                            break;
                        }
                    }
                });
            });
        }
        get functionsList() {
            return this._treeGrid;
        }
        contextMenu(viewModel, event) {
            var row = viewModel;
            if (!row.dto) {
                return null;
            }
            this._treeGrid().onClick(this._treeGrid(), event);
            var navigator = MainViewModel_8.getMainViewNavigator();
            return plugin.ContextMenu.create([{
                    label: plugin.Resources.getString("ContextMenu_ViewSource"),
                    disabled: () => !row.dto.rsf,
                    callback: () => this._dao.viewSource(row.dto.rsf, row.functionLineNumber),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowInModulesView"),
                    callback: () => navigator.navigateToView(MainViewModel_8.MainViews.Modules, row.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowFunctionDetails"),
                    callback: () => navigator.navigateToView(MainViewModel_8.MainViews.FunctionDetails, row.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowCallingFunctions", row.name),
                    callback: () => navigator.navigateToView(MainViewModel_8.MainViews.CallerCallee, row.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowCalledFunctions", row.name),
                    callback: () => navigator.navigateToView(MainViewModel_8.MainViews.CallerCallee, row.dto.k),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_Copy"),
                    callback: this.onCopy.bind(this),
                    type: plugin.ContextMenu.MenuItemType.command
                }]);
        }
        onKeyDown(viewModel, event) {
            if (!(event.ctrlKey && event.keyCode === KeyCodes_13.KeyCodes.C)) {
                return true;
            }
            this.onCopy();
            return false;
        }
        onCopy() {
            var formatted = TreeGridUtils_5.TreeGridUtils.formatTreeGridSelectedToText(this._treeGrid(), false);
            void navigator.clipboard.writeText(formatted);
        }
    }
    exports.FunctionsViewModel = FunctionsViewModel;
});
define("DAO/MarksDAO", ["require", "exports", "plugin-vs-v2", "Misc/SortFunctions", "ViewModels/DynamicTreeRowViewModel"], function (require, exports, plugin, SortFunctions_8, DynamicTreeRowViewModel_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarksDAO = void 0;
    var _marksMarshalerProxy = null;
    class MarksDAO {
        constructor(config) {
            this._config = config;
        }
        static create() {
            if (_marksMarshalerProxy === null) {
                _marksMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.MarksMarshaler", {}, true);
            }
            return _marksMarshalerProxy._call("config")
                .then((config) => new MarksDAO(config));
        }
        get defaultSortColumn() {
            return this._config.defaultSortColumn;
        }
        getHeader() {
            return _marksMarshalerProxy._call("header");
        }
        getRoots(resultId, sortInfo, cancellationToken) {
            return _marksMarshalerProxy._call("getMarks")
                .then((dtos) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return dtos.map((dto) => new DynamicTreeRowViewModel_6.DynamicTreeRowViewModel(null, dto, this._config.columns, 0));
            })
                .then((rows) => this.sort(rows, sortInfo, cancellationToken));
        }
        expand(row, sortInfo, cancellationToken) {
            return null;
        }
        search(query, isCaseSensitive, isRegex, startingRow, sortInfo, cancellationToken) {
            return _marksMarshalerProxy._call("search", query, isCaseSensitive, isRegex, startingRow ? startingRow.id : null)
                .then(ids => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return ids.map((id) => ({ nodeId: id }));
            });
        }
        sort(roots, sortInfo, cancellationToken) {
            var sortFunc = SortFunctions_8.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            return _marksMarshalerProxy._call("sort", sortInfo.columnId, sortInfo.direction)
                .then(() => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return roots.sort(sortFunc);
            });
        }
        getColumnSettings() {
            return _marksMarshalerProxy._call("columnSettings");
        }
        onColumnChanged(column) {
            _marksMarshalerProxy._call("columnSettingsChanged", column);
        }
    }
    exports.MarksDAO = MarksDAO;
});
define("ViewModels/MarksViewModel", ["require", "exports", "plugin-vs-v2", "CpuUsage.Interfaces", "Grid/TreeGridViewModel", "Grid/TreeGridHeaderViewModel", "Grid/TreeGridUtils", "DAO/MarksDAO", "Misc/KeyCodes", "ViewModels/MainViewModel", "ViewModels/SearchControlViewModel"], function (require, exports, plugin, CpuUsage_Interfaces_13, TreeGridViewModel_5, TreeGridHeaderViewModel_5, TreeGridUtils_6, MarksDAO_1, KeyCodes_14, MainViewModel_9, SearchControlViewModel_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarksViewModel = void 0;
    class MarksViewModel {
        constructor(additionalActions) {
            this._treeGrid = ko.observable();
            MarksDAO_1.MarksDAO.create()
                .then((dao) => this._dao = dao)
                .then(() => this._dao.getHeader())
                .then((config) => {
                var header = new TreeGridHeaderViewModel_5.TreeGridHeaderViewModel(config, this._dao, this._dao.defaultSortColumn);
                header.sortDirection(CpuUsage_Interfaces_13.SortDirection.Asc);
                this._treeGrid(new TreeGridViewModel_5.TreeGridViewModel(this._dao, header, "MarksView_TableAriaLabel"));
                additionalActions([
                    { template: 'SearchControlView', viewModel: new SearchControlViewModel_5.SearchControlViewModel(this._treeGrid(), true, 'MarksView_SearchAriaLabel') }
                ]);
            });
        }
        get treeGrid() {
            return this._treeGrid;
        }
        onAfterDomInsert(elements, viewModel) {
            viewModel.onAfterDomInsert(elements, viewModel);
        }
        contextMenu(viewModel, event) {
            var row = viewModel;
            if (!row.dto) {
                return null;
            }
            this._treeGrid().onClick(this._treeGrid(), event);
            var navigator = MainViewModel_9.getMainViewNavigator();
            return plugin.ContextMenu.create([{
                    label: plugin.Resources.getString("ContextMenu_Copy"),
                    callback: () => this.onCopy(),
                    type: plugin.ContextMenu.MenuItemType.command
                }]);
        }
        onKeyDown(viewModel, event) {
            if (!(event.ctrlKey && event.keyCode === KeyCodes_14.KeyCodes.C)) {
                return true;
            }
            this.onCopy();
            return false;
        }
        onCopy() {
            var formatted = TreeGridUtils_6.TreeGridUtils.formatTreeGridSelectedToText(this.treeGrid(), false);
            void navigator.clipboard.writeText(formatted);
        }
    }
    exports.MarksViewModel = MarksViewModel;
});
define("DAO/TierInteractionsDAO", ["require", "exports", "plugin-vs-v2", "Misc/SortFunctions", "ViewModels/DynamicTreeRowViewModel"], function (require, exports, plugin, SortFunctions_9, DynamicTreeRowViewModel_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatabaseCommandsDAO = exports.TierInteractionsDAO = void 0;
    var _tierInteractionsMarshalerProxy = null;
    class TierInteractionsDAO {
        constructor(config) {
            this._config = config;
        }
        static create() {
            if (_tierInteractionsMarshalerProxy === null) {
                _tierInteractionsMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.TierInteractionsMarshaler", {}, true);
            }
            return _tierInteractionsMarshalerProxy._call("configInteraction")
                .then((config) => new TierInteractionsDAO(config));
        }
        get defaultSortColumn() {
            return this._config.defaultSortColumn;
        }
        getHeader() {
            return _tierInteractionsMarshalerProxy._call("headerInteraction");
        }
        getRoots(resultId, sortInfo, cancellationToken) {
            return _tierInteractionsMarshalerProxy._call("getRoots")
                .then((dtos) => dtos.map((dto) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return new DynamicTreeRowViewModel_7.DynamicTreeRowViewModel(null, dto, this._config.columns, 0);
            }))
                .then((roots) => this.sort(roots, sortInfo, cancellationToken));
        }
        expand(row, sortInfo, cancellationToken) {
            var dataLoadPromise = Promise.resolve();
            if (row.expanded === null) {
                return dataLoadPromise;
            }
            var treeRow = row;
            if (treeRow.children().length === 0) {
                dataLoadPromise = _tierInteractionsMarshalerProxy._call("getChildren", treeRow.id)
                    .then((dtos) => {
                    cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                    return dtos.map((dto) => new DynamicTreeRowViewModel_7.DynamicTreeRowViewModel(treeRow, dto, this._config.columns, treeRow.depth + 1));
                })
                    .then((children) => this.sort(children, sortInfo, cancellationToken))
                    .then((sortedChildren) => {
                    cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                    return treeRow.children(sortedChildren);
                });
            }
            return dataLoadPromise.then(() => treeRow.expanded(!treeRow.expanded()));
        }
        search(query, isCaseSensitive, isRegex, startingRow, sortInfo, cancellationToken) {
            return null;
        }
        sort(roots, sortInfo, cancellationToken) {
            var sortFunc = SortFunctions_9.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            var sortChildren = (element) => {
                if (element.children) {
                    element.children.sort(sortFunc);
                    element.children().forEach(sortChildren);
                }
            };
            roots.sort(sortFunc);
            roots.forEach(sortChildren);
            return Promise.resolve(roots);
        }
        showHelp() {
            return _tierInteractionsMarshalerProxy._call("showHelp");
        }
        getColumnSettings() {
            return _tierInteractionsMarshalerProxy._call("columnSettingsInteraction");
        }
        onColumnChanged(column) {
            _tierInteractionsMarshalerProxy._call("columnSettingsChangedInteraction", column);
        }
    }
    exports.TierInteractionsDAO = TierInteractionsDAO;
    class DatabaseCommandsDAO {
        constructor(config) {
            this._config = config;
        }
        static create() {
            if (_tierInteractionsMarshalerProxy === null) {
                _tierInteractionsMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.TierInteractionsMarshaler", {}, true);
            }
            return _tierInteractionsMarshalerProxy._call("configDatabase")
                .then((config) => new DatabaseCommandsDAO(config));
        }
        get defaultSortColumn() {
            return this._config.defaultSortColumn;
        }
        getHeader() {
            return _tierInteractionsMarshalerProxy._call("headerDatabase");
        }
        getRoots(resultId, sortInfo, cancellationToken) {
            if (!this._tierInteraction || !this._tierInteraction.parent) {
                return Promise.resolve([]);
            }
            return _tierInteractionsMarshalerProxy._call("getConnectionDetails", this._tierInteraction.id)
                .then((dtos) => {
                cancellationToken === null || cancellationToken === void 0 ? void 0 : cancellationToken.throwIfCancellationRequested();
                return dtos.map((dto) => new DynamicTreeRowViewModel_7.DynamicTreeRowViewModel(null, dto, this._config.columns, 0));
            })
                .then((roots) => this.sort(roots, sortInfo, cancellationToken));
        }
        expand(row, sortInfo, cancellationToken) {
            return null;
        }
        search(query, isCaseSensitive, isRegex, startingRow, sortInfo, cancellationToken) {
            return null;
        }
        sort(roots, sortInfo, cancellationToken) {
            var sortFunc = SortFunctions_9.SortFunctions.getSortFunc(sortInfo.columnId, this._config.columns, sortInfo.direction);
            roots.sort(sortFunc);
            return Promise.resolve(roots);
        }
        getColumnSettings() {
            return _tierInteractionsMarshalerProxy._call("columnSettingsDatabase");
        }
        onColumnChanged(column) {
            _tierInteractionsMarshalerProxy._call("columnSettingsChangedDatabase", column);
        }
        set tierInteraction(value) {
            this._tierInteraction = value;
        }
        viewCommandText(commandText) {
            return _tierInteractionsMarshalerProxy._call("viewCommandText", commandText);
        }
    }
    exports.DatabaseCommandsDAO = DatabaseCommandsDAO;
});
define("ViewModels/TierInteractionsViewModel", ["require", "exports", "plugin-vs-v2", "Grid/TreeGridViewModel", "Grid/TreeGridHeaderViewModel", "DAO/TierInteractionsDAO", "Grid/TreeGridUtils", "Misc/KeyCodes"], function (require, exports, plugin, TreeGridViewModel_6, TreeGridHeaderViewModel_6, TierInteractionsDAO_1, TreeGridUtils_7, KeyCodes_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TierInteractionsViewModel = void 0;
    class TierInteractionsViewModel {
        constructor() {
            this._mainTreeGrid = ko.observable();
            this._detailsTreeGrid = ko.observable();
            this._subscriptions = [];
            var mainPromise = TierInteractionsDAO_1.TierInteractionsDAO.create()
                .then((dao) => this._mainDAO = dao)
                .then(() => this._mainDAO.getHeader());
            var detailsPromise = TierInteractionsDAO_1.DatabaseCommandsDAO.create()
                .then((dao) => this._detailsDAO = dao)
                .then(() => this._detailsDAO.getHeader());
            Promise.all([mainPromise, detailsPromise])
                .then((results) => {
                this._showOverlay = ko.pureComputed(() => this.computeShowOverlay());
                var mainHeader = new TreeGridHeaderViewModel_6.TreeGridHeaderViewModel(results[0], this._mainDAO, this._mainDAO.defaultSortColumn);
                this._mainTreeGrid(new TreeGridViewModel_6.TreeGridViewModel(this._mainDAO, mainHeader, "TierInteractions_TreeGridAriaLabel"));
                var detailsHeader = new TreeGridHeaderViewModel_6.TreeGridHeaderViewModel(results[1], this._detailsDAO, this._detailsDAO.defaultSortColumn);
                this._detailsTreeGrid(new TreeGridViewModel_6.TreeGridViewModel(this._detailsDAO, detailsHeader, "TierInteractions_DatabaseCommandsTableAriaLabel"));
                this._subscriptions.push(this._mainTreeGrid().focusedRow.subscribe((selection) => {
                    if (!selection) {
                        return;
                    }
                    var row = selection;
                    this._detailsDAO.tierInteraction = row;
                    this._detailsTreeGrid().reloadData();
                }));
            });
        }
        get databaseCommands() {
            return this._detailsTreeGrid;
        }
        get tierInteractions() {
            return this._mainTreeGrid;
        }
        get showOverlay() {
            return this._showOverlay;
        }
        showHelp() {
            this._mainDAO.showHelp();
        }
        contextMenuMain(viewModel, event) {
            var row = viewModel;
            if (!row.dto) {
                return null;
            }
            this._mainTreeGrid().onClick(this._mainTreeGrid(), event);
            return plugin.ContextMenu.create([{
                    label: plugin.Resources.getString("ContextMenu_Copy"),
                    callback: () => this.onCopy(this._mainTreeGrid()),
                    type: plugin.ContextMenu.MenuItemType.command
                }]);
        }
        contextMenuDetails(viewModel, event) {
            var row = viewModel;
            if (!row.dto) {
                return null;
            }
            this._detailsTreeGrid().onClick(this._detailsTreeGrid(), event);
            return plugin.ContextMenu.create([{
                    label: plugin.Resources.getString("TierInteractions_ContextMenuViewCommand"),
                    callback: () => this._detailsDAO.viewCommandText(row.commandText),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    type: plugin.ContextMenu.MenuItemType.separator
                }, {
                    label: plugin.Resources.getString("ContextMenu_Copy"),
                    callback: () => this.onCopy(this._detailsTreeGrid()),
                    type: plugin.ContextMenu.MenuItemType.command
                }]);
        }
        onKeyDownMain(viewModel, event) {
            return this.onKeyDown(this._mainTreeGrid(), event);
        }
        onKeyDownDetails(viewModel, event) {
            return this.onKeyDown(this._detailsTreeGrid(), event);
        }
        onKeyDown(treeGrid, event) {
            if (!(event.ctrlKey && event.keyCode === KeyCodes_15.KeyCodes.C)) {
                return true;
            }
            this.onCopy(treeGrid);
            return false;
        }
        onCopy(treeGrid) {
            var formatted = TreeGridUtils_7.TreeGridUtils.formatTreeGridSelectedToText(treeGrid);
            void navigator.clipboard.writeText(formatted);
        }
        computeShowOverlay() {
            if (!this._mainTreeGrid() || !this._detailsTreeGrid()) {
                return true;
            }
            var focusedRow = this._mainTreeGrid().focusedRow();
            var row = focusedRow;
            return !focusedRow || !row.parent;
        }
        dispose() {
            this._subscriptions.forEach((s) => s.dispose());
        }
    }
    exports.TierInteractionsViewModel = TierInteractionsViewModel;
});
define("Misc/LocalizedUnitConverter", ["require", "exports", "plugin-vs-v2", "Misc/Logger", "Misc/Utilities"], function (require, exports, plugin, Logger_8, Utilities_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalizedUnitConverter = void 0;
    class LocalizedUnitConverter {
        constructor(config, resources) {
            this._localizedUnits = [];
            var logger = Logger_8.getLogger();
            if (!config) {
                return;
            }
            config.forEach((unit) => {
                if (resources && resources[unit.Unit]) {
                    this._localizedUnits.push({
                        Decimals: unit.Decimals,
                        Divider: unit.Divider,
                        LowerBound: unit.LowerBound,
                        Unit: resources[unit.Unit]
                    });
                }
                else {
                    this._localizedUnits.push({
                        Decimals: unit.Decimals,
                        Divider: unit.Divider,
                        LowerBound: unit.LowerBound,
                        Unit: unit.Unit
                    });
                    logger.error("Missing resource string for: " + unit.Unit);
                }
            });
            config.sort((left, right) => {
                if (left.LowerBound < right.LowerBound) {
                    return -1;
                }
                else if (left.LowerBound > right.LowerBound) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        }
        formatNumber(value, decimalPlaces) {
            var scaledNumber = this.scaleValue(value);
            var decimals = typeof (decimalPlaces) === "number" ? decimalPlaces : scaledNumber.decimals;
            var formattedNumber = Utilities_4.Utilities.formatNumber(scaledNumber.value, decimals);
            if (scaledNumber.unit) {
                return plugin.Resources.getString("FormattedNumberWithUnits", formattedNumber, scaledNumber.unit);
            }
            else {
                return formattedNumber;
            }
        }
        scaleValue(value) {
            var scaledValue = value;
            var unit;
            var unitDecimals = 0;
            for (var unitNumber = 0; unitNumber < this._localizedUnits.length; ++unitNumber) {
                var units = this._localizedUnits[unitNumber];
                if (units.LowerBound <= value) {
                    scaledValue = value;
                    unitDecimals = units.Decimals;
                    if (units.Divider) {
                        scaledValue = scaledValue / units.Divider;
                    }
                    var decimals = Math.pow(10, units.Decimals);
                    scaledValue = Math.round(scaledValue * decimals) / (decimals);
                    unit = units.Unit;
                }
                else {
                    break;
                }
            }
            return {
                value: scaledValue,
                unit: unit,
                decimals: unitDecimals
            };
        }
    }
    exports.LocalizedUnitConverter = LocalizedUnitConverter;
});
define("Swimlane/ChartColorScheme", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChartColorScheme = void 0;
    class ChartColorScheme {
        constructor(lineColorString, lineFillColorString) {
            this._lineColorString = "#FF0000";
            this._lineFillColorString = "#FF0000";
            this._lineColorString = lineColorString;
            this._lineFillColorString = lineFillColorString;
        }
        get lineColor() {
            return this._lineColorString;
        }
        get lineFillColor() {
            return this._lineFillColorString;
        }
    }
    exports.ChartColorScheme = ChartColorScheme;
});
define("Swimlane/SummaryDataSeries", ["require", "exports", "Misc/Logger", "Misc/Utilities", "Swimlane/AggregatedEvent", "Swimlane/ChartColorScheme", "Swimlane/Controls.Interfaces", "Swimlane/JsonTimespan"], function (require, exports, Logger_9, Utilities_5, AggregatedEvent_3, ChartColorScheme_1, Controls_Interfaces_1, JsonTimespan_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SummaryDataSeries = void 0;
    class SummaryDataSeries {
        constructor(viewport, title, formattableTooltipText, unitConverter, marshaler) {
            this._logger = Logger_9.getLogger();
            this._minValue = Number.MAX_VALUE;
            this._maxValue = Number.MIN_VALUE;
            this._data = [];
            this._width = 250;
            this._color = new ChartColorScheme_1.ChartColorScheme("rgb(118, 174, 200)", "");
            this._newDataEvent = new AggregatedEvent_3.AggregatedEvent();
            this._viewport = viewport;
            this._title = title;
            this._formattableTooltipText = formattableTooltipText;
            this._unitConverter = unitConverter;
            this._marker = document.createElement("div");
            this._marker.classList.add("countersDataSeries-marker");
            this._marker.style.backgroundColor = this._color.lineColor;
            this._marker.style.width = "7px";
            this._marker.style.height = "7px";
            marshaler.getSummaryGraphData().then((dto) => {
                this._data = this.convertDtoToIPointArray(dto);
                this._newDataEvent.invokeEvent(this);
            });
        }
        get minValue() {
            return this._minValue;
        }
        get maxValue() {
            return this._maxValue;
        }
        get marker() {
            return this._marker;
        }
        get title() {
            return this._title;
        }
        get newDataEvent() {
            return this._newDataEvent;
        }
        dispose() {
            this._newDataEvent.dispose();
        }
        onDataUpdate(timestamp) {
        }
        onViewportChanged(viewport) {
            this._viewport = viewport;
        }
        draw(context, info) {
            if (this._data.length === 0) {
                return;
            }
            if (info.chartRect.width !== this._width) {
                this._width = info.chartRect.width;
            }
            var getXCoordinate = (point) => Utilities_5.Utilities.convertToPixel(point.Timestamp, info.gridX, info.chartRect.width, false);
            var getYCoordinate = (point) => info.chartRect.height - Utilities_5.Utilities.scaleToRange(point.Value, info.gridY.min, info.gridY.max, 0, info.chartRect.height);
            context.save();
            context.lineWidth = (info.chartRect.height < 100 ? 1 : 2);
            context.fillStyle = this._color.lineFillColor;
            context.strokeStyle = this._color.lineColor;
            var initialxPx = getXCoordinate(this._data[0]);
            context.beginPath();
            context.moveTo(initialxPx, getYCoordinate(this._data[0]));
            this._data.forEach((point) => context.lineTo(getXCoordinate(point), getYCoordinate(point)));
            context.stroke();
            context.restore();
        }
        getPointAtTimestamp(timestamp, pointToFind = Controls_Interfaces_1.PointToFind.Nearest) {
            if (this._data.length === 0) {
                return null;
            }
            var point = { Timestamp: timestamp, Value: 0 };
            var pointCompare = (left, right) => {
                return right.Timestamp.greater(left.Timestamp);
            };
            switch (pointToFind) {
                case Controls_Interfaces_1.PointToFind.LessThanOrEqual:
                    var index = Utilities_5.Utilities.findLessThan(this._data, point, pointCompare);
                    point = this._data[index];
                    break;
                case Controls_Interfaces_1.PointToFind.GreaterThanOrEqual:
                    var index = Utilities_5.Utilities.findGreaterThan(this._data, point, pointCompare);
                    point = this._data[index];
                    break;
                case Controls_Interfaces_1.PointToFind.Nearest:
                    var lowIndex = Utilities_5.Utilities.findLessThan(this._data, point, pointCompare);
                    var lowPoint = this._data[lowIndex];
                    if (lowIndex === this._data.length - 1 || this._data[0].Timestamp.greater(timestamp)) {
                        point.Value = lowPoint.Value;
                        point.Timestamp = lowPoint.Timestamp;
                    }
                    else {
                        var highPoint = this._data[Math.min(lowIndex + 1, this._data.length - 1)];
                        point.Value = Utilities_5.Utilities.linearInterpolate(timestamp, lowPoint.Timestamp, lowPoint.Value, highPoint.Timestamp, highPoint.Value);
                    }
                    break;
            }
            return {
                timestamp: point.Timestamp,
                tooltip: Utilities_5.Utilities.formatString(this._formattableTooltipText, this._unitConverter.formatNumber(point.Value)),
                color: this._color,
                value: point.Value
            };
        }
        convertDtoToIPointArray(dto) {
            return dto.map((dtoPoint) => {
                this._minValue = Math.min(this._minValue, dtoPoint.v);
                this._maxValue = Math.max(this._maxValue, dtoPoint.v);
                return {
                    Timestamp: new JsonTimespan_3.BigNumber(dtoPoint.t.h, dtoPoint.t.l),
                    Value: dtoPoint.v,
                };
            });
        }
    }
    exports.SummaryDataSeries = SummaryDataSeries;
});
define("DAO/SummaryDAO", ["require", "exports", "plugin-vs-v2", "Swimlane/JsonTimespan"], function (require, exports, plugin, JsonTimespan_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SummaryDAO = void 0;
    var _summaryMarshalerProxy = null;
    class SummaryDAO {
        constructor() {
            if (_summaryMarshalerProxy === null) {
                _summaryMarshalerProxy = plugin.JSONMarshaler.attachToMarshaledObject("Microsoft.VisualStudio.PerformanceTools.SummaryMarshaler", {}, true);
            }
        }
        isJmcEnabled() {
            return _summaryMarshalerProxy._call("isJmcEnabled");
        }
        toggleJmc() {
            return _summaryMarshalerProxy._call("toggleJmc");
        }
        timeFilter() {
            return _summaryMarshalerProxy._call("timeFilter")
                .then((dto) => {
                if (!dto) {
                    return null;
                }
                return new JsonTimespan_4.JsonTimespan(new JsonTimespan_4.BigNumber(dto.begin.h, dto.begin.l), new JsonTimespan_4.BigNumber(dto.end.h, dto.end.l));
            });
        }
        getMetricTotal() {
            return _summaryMarshalerProxy._call("metricTotal");
        }
        getHotPathData() {
            return _summaryMarshalerProxy._call("hotPathData");
        }
        getFunctionsListData() {
            return _summaryMarshalerProxy._call("functionsListData");
        }
        getResourcesListData() {
            return _summaryMarshalerProxy._call("resourcesListData");
        }
        getThreadsListData() {
            return _summaryMarshalerProxy._call("threadsListData");
        }
        getTypesMemoryListData() {
            return _summaryMarshalerProxy._call("typesMemoryListData");
        }
        getTypesInstancesListData() {
            return _summaryMarshalerProxy._call("typesInstancesListData");
        }
        getSummaryGraphData() {
            return _summaryMarshalerProxy._call("summaryGraphData");
        }
        containsData() {
            return _summaryMarshalerProxy._call("containsData");
        }
        haveViewGuidance() {
            return _summaryMarshalerProxy._call("haveViewGuidance");
        }
        haveMarks() {
            return _summaryMarshalerProxy._call("haveMarks");
        }
        showGuidance() {
            _summaryMarshalerProxy._call("showGuidance");
        }
        compareReports() {
            _summaryMarshalerProxy._call("compareReports");
        }
        toggleFullscreen() {
            _summaryMarshalerProxy._call("toggleFullscreen");
        }
        showSymbolsOptions() {
            _summaryMarshalerProxy._call("showSymbolsOptions");
        }
        saveAnalyzedReport() {
            _summaryMarshalerProxy._call("saveAnalyzedReport");
        }
        viewSource(filePath, lineNumber) {
            _summaryMarshalerProxy._call("viewSource", filePath, lineNumber);
        }
        setTimeFilter(selection) {
            if (selection) {
                return _summaryMarshalerProxy._call("setTimeFilter", selection.begin.jsonValue, selection.end.jsonValue);
            }
            else {
                return _summaryMarshalerProxy._call("setTimeFilter", null, null);
            }
        }
    }
    exports.SummaryDAO = SummaryDAO;
});
define("Misc/CommonStructs", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinMaxNumber = exports.RectangleDimension = exports.Padding = exports.UnitFormat = void 0;
    var UnitFormat;
    (function (UnitFormat) {
        UnitFormat[UnitFormat["italicizedAbbreviations"] = 0] = "italicizedAbbreviations";
        UnitFormat[UnitFormat["fullName"] = 1] = "fullName";
    })(UnitFormat = exports.UnitFormat || (exports.UnitFormat = {}));
    class Padding {
        constructor(left, top, right, bottom) {
            this.left = left;
            this.top = top;
            this.right = right;
            this.bottom = bottom;
        }
    }
    exports.Padding = Padding;
    class RectangleDimension extends Padding {
        constructor(left, top, right, bottom) {
            super(left, top, right, bottom);
            if (this.left > this.right || this.top > this.bottom) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1000"));
            }
        }
        get width() {
            return this.right - this.left;
        }
        get height() {
            return this.bottom - this.top;
        }
    }
    exports.RectangleDimension = RectangleDimension;
    class MinMaxNumber {
        constructor(min, max) {
            this.min = min;
            this.max = max;
        }
        get range() {
            if ((this.min || this.min === 0) && (this.max || this.max === 0)) {
                return this.max - this.min;
            }
            return null;
        }
    }
    exports.MinMaxNumber = MinMaxNumber;
});
define("Misc/RulerUtilities", ["require", "exports", "plugin-vs-v2", "Swimlane/Controls.Interfaces", "Swimlane/JsonTimespan", "Misc/CommonStructs", "Misc/Utilities"], function (require, exports, plugin, Controls_Interfaces_2, JsonTimespan_5, CommonStructs_1, Utilities_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RulerUtilities = void 0;
    class RulerUtilities {
        static getUniqueId() {
            return RulerUtilities.Counter++;
        }
        static getTickMarksPosition(timeRange, width, showZero = false) {
            var range = timeRange.elapsed;
            var rangeNum = parseInt(range.value);
            var begin = timeRange.begin;
            var tickMarkList = [];
            var intervalDuration = Math.pow(10, Math.floor(Math.log(rangeNum) / Math.LN10));
            var intervalWidth = (width / rangeNum) * intervalDuration;
            if (intervalWidth < 100) {
                if (intervalWidth < 25) {
                    intervalDuration *= 8;
                }
                else if (intervalWidth < 50) {
                    intervalDuration *= 4;
                }
                else if (intervalWidth < 100) {
                    intervalDuration *= 2;
                }
            }
            else if (intervalWidth > 250) {
                if (intervalWidth < 400) {
                    intervalDuration /= 2;
                }
                else if (intervalWidth < 800) {
                    intervalDuration /= 4;
                }
                else if (intervalWidth < 1600) {
                    intervalDuration /= 8;
                }
                else {
                    intervalDuration /= 10;
                }
            }
            if (intervalDuration > 0) {
                var smallTickDuration = intervalDuration / 10;
                var mediumTickDuration = intervalDuration / 2;
                intervalWidth = (width / rangeNum) * intervalDuration;
                if (intervalWidth < 130) {
                    smallTickDuration = intervalDuration / 5;
                }
                tickMarkList = RulerUtilities.generateTickMarks(timeRange, JsonTimespan_5.BigNumber.subtract(begin, JsonTimespan_5.BigNumber.moduloNumber(begin, intervalDuration)), JsonTimespan_5.BigNumber.convertFromNumber(intervalDuration), JsonTimespan_5.BigNumber.convertFromNumber(mediumTickDuration), JsonTimespan_5.BigNumber.convertFromNumber(smallTickDuration), showZero);
            }
            return tickMarkList;
        }
        static getVerticalLinePositions(timeRange, width) {
            var positions = [];
            var marks = RulerUtilities.getTickMarksPosition(timeRange, width);
            for (var i = 0; i < marks.length; ++i) {
                var mark = marks[i];
                if (mark.type === Controls_Interfaces_2.TickMarkType.Big) {
                    var position = parseInt(JsonTimespan_5.BigNumber.subtract(mark.value, timeRange.begin).value) / parseInt(timeRange.elapsed.value) * 100;
                    positions.push(position);
                }
            }
            return positions;
        }
        static formatTime(value, unitFormat = CommonStructs_1.UnitFormat.italicizedAbbreviations) {
            var time = "0";
            var nf = Utilities_6.Utilities.getNumberFormat();
            if (value.greaterOrEqual(JsonTimespan_5.BigNumber.convertFromNumber(RulerUtilities.OneSecond - RulerUtilities.NanosecondsSignificanceThreshold))) {
                var splitTime = RulerUtilities.getSplittedTime(value, (RulerUtilities.OneMillisecond / 2));
                var hasMinutes = parseInt(splitTime.minString) ? true : false;
                var hasSeconds = parseInt(splitTime.secString) ? true : false;
                var hasMillis = parseInt(splitTime.msString) ? true : false;
                time = hasMinutes ? (splitTime.minString + ":") : "";
                time += hasSeconds ? splitTime.secString : (hasMinutes ? "00" : "0");
                if (hasMillis) {
                    time += nf.numberDecimalSeparator + this.removeTrailingZeros(splitTime.msString);
                }
            }
            else {
                var splitTime = RulerUtilities.getSplittedTime(value);
                var hasMillis = parseInt(splitTime.msString) ? true : false;
                var hasNanos = parseInt(splitTime.nsString) ? true : false;
                time = hasMillis ? splitTime.msString : "0";
                if (hasNanos) {
                    time += nf.numberDecimalSeparator + this.removeTrailingZeros(splitTime.nsString);
                }
            }
            var unit = RulerUtilities.getUnit(parseInt(value.value), unitFormat);
            return time + unit;
        }
        static formatTitleTime(value, unitFormat = CommonStructs_1.UnitFormat.fullName, isLive = false, truncateNs = false) {
            var threshold = truncateNs ? RulerUtilities.OneMillisecond : RulerUtilities.NanosecondsSignificanceThreshold;
            var splitTime = RulerUtilities.getSplittedTime(value, threshold);
            var time = "0";
            var nf = Utilities_6.Utilities.getNumberFormat();
            var hasMinutes = parseInt(splitTime.minString) ? true : false;
            var hasSeconds = parseInt(splitTime.secString) ? true : false;
            var hasMillis = isLive ? false : (parseInt(splitTime.msString) ? true : false);
            var hasNanos = isLive ? false : (parseInt(splitTime.nsString) ? true : false);
            if (hasMinutes) {
                var secondsPart = hasSeconds ? splitTime.secString : "00";
                time = splitTime.minString + ":" + secondsPart;
            }
            else if (hasSeconds) {
                time = splitTime.secString;
                if (hasMillis) {
                    time += nf.numberDecimalSeparator + this.removeTrailingZeros(splitTime.msString);
                }
            }
            else if (hasMillis || hasNanos) {
                time = hasMillis ? splitTime.msString : hasNanos ? "0" : "";
                if (hasNanos) {
                    time += nf.numberDecimalSeparator + this.removeTrailingZeros(splitTime.nsString);
                }
            }
            return time;
        }
        static formatTotalTime(value, unitFormat = CommonStructs_1.UnitFormat.fullName, isLive = false) {
            var time = RulerUtilities.formatTitleTime(value, unitFormat, isLive);
            var unit = RulerUtilities.getUnit(parseInt(value.value), unitFormat, isLive);
            return time + unit;
        }
        static generateTickMarks(timeRange, start, bigTick, mediumTick, step, showZero) {
            var tickMarkList = [];
            var beginNsec = timeRange.begin;
            var endNsec = timeRange.end;
            if (showZero) {
                tickMarkList.push({ type: Controls_Interfaces_2.TickMarkType.Big, value: new JsonTimespan_5.BigNumber(0, 0), label: "0" });
            }
            if (step.equals(JsonTimespan_5.BigNumber.zero)) {
                step = new JsonTimespan_5.BigNumber(0, 1);
            }
            for (var i = start; endNsec.greater(i); i = JsonTimespan_5.BigNumber.add(i, step)) {
                if (i.greater(beginNsec)) {
                    var tickMarkTime = i;
                    if (JsonTimespan_5.BigNumber.modulo(i, bigTick).equals(JsonTimespan_5.BigNumber.zero)) {
                        tickMarkList.push({ type: Controls_Interfaces_2.TickMarkType.Big, value: tickMarkTime });
                    }
                    else if (JsonTimespan_5.BigNumber.modulo(i, mediumTick).equals(JsonTimespan_5.BigNumber.zero)) {
                        tickMarkList.push({ type: Controls_Interfaces_2.TickMarkType.Medium, value: tickMarkTime });
                    }
                    else {
                        tickMarkList.push({ type: Controls_Interfaces_2.TickMarkType.Small, value: tickMarkTime });
                    }
                }
            }
            return tickMarkList;
        }
        static getUnit(valueNs, unitFormat, isLive = false) {
            var units = RulerUtilities.getUnits(unitFormat);
            var unit;
            if (valueNs < RulerUtilities.OneSecond - RulerUtilities.NanosecondsSignificanceThreshold && !isLive) {
                unit = units.milliseconds;
            }
            else if (valueNs < RulerUtilities.OneMinute - RulerUtilities.NanosecondsSignificanceThreshold) {
                unit = units.seconds;
            }
            else {
                unit = units.minutes;
            }
            return unit;
        }
        static getUnits(unitFormat) {
            var unitLabelFormat;
            if (unitFormat === CommonStructs_1.UnitFormat.fullName) {
                unitLabelFormat = {
                    milliseconds: " " + plugin.Resources.getString("MillisecondsLabel"),
                    seconds: " " + plugin.Resources.getString("SecondsLabel"),
                    minutes: " " + plugin.Resources.getString("MinutesLabel")
                };
            }
            else {
                unitLabelFormat = {
                    milliseconds: plugin.Resources.getString("MillisecondsAbbreviation"),
                    seconds: plugin.Resources.getString("SecondsAbbreviation"),
                    minutes: plugin.Resources.getString("MinutesAbbreviation")
                };
            }
            return unitLabelFormat;
        }
        static getSplittedTime(value, nanosecondsSignificance = RulerUtilities.NanosecondsSignificanceThreshold) {
            var nanoseconds = JsonTimespan_5.BigNumber.moduloNumber(value, RulerUtilities.OneMillisecond);
            var valueUnaccountedFor = JsonTimespan_5.BigNumber.subtract(value, nanoseconds);
            var nanosecondsNum = parseInt(nanoseconds.value);
            var ns = "";
            if (nanosecondsNum < RulerUtilities.OneMillisecond - nanosecondsSignificance) {
                ns = Math.round(nanosecondsNum / 1000).toString();
                ns = this.padLeadingZeros(ns, 3);
            }
            else {
                valueUnaccountedFor = JsonTimespan_5.BigNumber.addNumber(valueUnaccountedFor, RulerUtilities.OneMillisecond);
            }
            var milliseconds = JsonTimespan_5.BigNumber.moduloNumber(valueUnaccountedFor, RulerUtilities.OneSecond);
            valueUnaccountedFor = JsonTimespan_5.BigNumber.subtract(valueUnaccountedFor, milliseconds);
            var millisecondsNum = parseInt(milliseconds.value) / RulerUtilities.OneMillisecond;
            var seconds = JsonTimespan_5.BigNumber.moduloNumber(valueUnaccountedFor, RulerUtilities.OneMinute);
            valueUnaccountedFor = JsonTimespan_5.BigNumber.subtract(valueUnaccountedFor, seconds);
            var secondsNum = parseInt(seconds.value) / RulerUtilities.OneSecond;
            var minutes = valueUnaccountedFor;
            var minutesNum = parseInt(minutes.value) / RulerUtilities.OneMinute;
            var ms = "";
            if (ns || millisecondsNum) {
                ms = millisecondsNum.toString();
                if (secondsNum || minutesNum) {
                    ms = this.padLeadingZeros(ms, 3);
                }
            }
            var sec = "";
            if (ns || ms || secondsNum) {
                sec = secondsNum.toString();
                if (minutesNum) {
                    sec = this.padLeadingZeros(sec, 2);
                }
            }
            var min = "";
            if (minutesNum) {
                min = minutesNum.toString();
            }
            return {
                nsString: ns,
                msString: ms,
                secString: sec,
                minString: min
            };
        }
        static removeTrailingZeros(numericString) {
            return numericString.replace(/0*$/, "");
        }
        static padLeadingZeros(value, totalLength) {
            var padded = value;
            var zeros = "00000000";
            if (padded && totalLength && totalLength > 0) {
                while (totalLength - padded.length >= 8) {
                    padded = zeros + padded;
                }
                padded = zeros.substr(0, totalLength - padded.length) + padded;
            }
            return padded;
        }
    }
    exports.RulerUtilities = RulerUtilities;
    RulerUtilities.OneMillisecond = 1000000;
    RulerUtilities.OneSecond = 1000 * 1000000;
    RulerUtilities.OneMinute = 60 * 1000 * 1000000;
    RulerUtilities.Counter = 0;
    RulerUtilities.NanosecondsSignificanceThreshold = 500;
});
define("Swimlane/GraphTimeAxis", ["require", "exports", "plugin-vs-v2", "Misc/RulerUtilities", "Misc/Utilities", "Swimlane/Controls.Interfaces", "Swimlane/JsonTimespan"], function (require, exports, plugin, RulerUtilities_1, Utilities_7, Controls_Interfaces_3, JsonTimespan_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GraphTimeAxis = void 0;
    class GraphTimeAxis {
        constructor(currentTimespan) {
            this._clientWidth = 0;
            this._clientHeight = 0;
            this._currentTimespan = currentTimespan;
            this._canvas = document.createElement("canvas");
            this._canvas.classList.add("graphTimeAxis");
            this._canvas.style.height = "1.3em";
            this._canvas.style.width = "100%";
            this._canvas.style.position = "absolute";
            this._canvas.style.bottom = "-1.3em";
            this._context = this._canvas.getContext("2d");
            this._context.lineWidth = 1;
            this._strokeStyle = plugin.Theme.getValue("DiagnosticsHub-GraphLine-Background");
            this._fontSize = plugin.Theme.getValue("plugin-font-size");
            this._fontColor = plugin.Theme.getValue("plugin-color");
            this._fontFamily = plugin.Theme.getValue("plugin-font-family");
            this._onThemeChangedBoundFunction = this.onThemeChanged.bind(this);
            plugin.Theme.addEventListener("themechanged", this._onThemeChangedBoundFunction);
        }
        get container() {
            return this._canvas;
        }
        onViewportChanged(viewportArgs) {
            if (this._currentTimespan.equals(viewportArgs.currentTimespan)) {
                return;
            }
            this._currentTimespan = viewportArgs.currentTimespan;
            this.draw();
        }
        dispose() {
            plugin.Theme.removeEventListener("themechanged", this._onThemeChangedBoundFunction);
        }
        resize(evt) {
            var width = this.container.clientWidth;
            if (this._clientWidth === width) {
                return;
            }
            this._clientWidth = width;
            this._clientHeight = this.container.clientHeight;
            this._canvas.width = this._clientWidth;
            this._canvas.height = this._clientHeight;
            this.draw();
        }
        draw() {
            if (this._currentTimespan.elapsed.equals(JsonTimespan_6.BigNumber.zero)) {
                return;
            }
            this._context.clearRect(0, 0, this._clientWidth, this._clientHeight);
            this._context.strokeStyle = this._strokeStyle;
            this._context.fillStyle = this._fontColor;
            this._context.font = this._fontSize + " " + this._fontFamily;
            this._context.textBaseline = "top";
            var bigHeight = this._clientHeight;
            var mediumHeight = this._clientHeight * .4;
            var smallHeight = this._clientHeight * .2;
            RulerUtilities_1.RulerUtilities.getTickMarksPosition(this._currentTimespan, this._clientWidth)
                .forEach((tick) => {
                var position = Utilities_7.Utilities.convertToPixel(tick.value, this._currentTimespan, this._clientWidth, false);
                var height = 0;
                switch (tick.type) {
                    case Controls_Interfaces_3.TickMarkType.Big:
                        this._context.fillText(RulerUtilities_1.RulerUtilities.formatTime(tick.value), position + 2.5, 0);
                        height = bigHeight;
                        break;
                    case Controls_Interfaces_3.TickMarkType.Medium:
                        height = mediumHeight;
                        break;
                    case Controls_Interfaces_3.TickMarkType.Small:
                        height = smallHeight;
                        break;
                }
                this._context.beginPath();
                this._context.moveTo(position + .5, 0);
                this._context.lineTo(position + .5, height);
                this._context.stroke();
            });
        }
        onThemeChanged() {
            this._strokeStyle = plugin.Theme.getValue("DiagnosticsHub-GraphLine-Background");
            this._fontSize = plugin.Theme.getValue("plugin-font-size");
            this._fontColor = plugin.Theme.getValue("plugin-color");
            this._fontFamily = plugin.Theme.getValue("plugin-font-family");
        }
    }
    exports.GraphTimeAxis = GraphTimeAxis;
});
define("Swimlane/GridLineRenderer", ["require", "exports", "plugin-vs-v2", "Misc/Constants", "Misc/RulerUtilities", "Swimlane/Controls.Interfaces", "Swimlane/JsonTimespan"], function (require, exports, plugin, Constants_3, RulerUtilities_2, Controls_Interfaces_4, JsonTimespan_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GridLineRenderer = void 0;
    class GridLineRenderer {
        constructor(currentTimespan, horizontalLineCount) {
            this._clientWidth = 0;
            this._clientHeight = 0;
            this._container = document.createElement("canvas");
            this._container.className = "gridLines";
            this._container.style.zIndex = Constants_3.Constants.GridLineZIndex.toString();
            this._context = this._container.getContext("2d");
            this._context.lineWidth = 1;
            this._strokeStyle = plugin.Theme.getValue("DiagnosticsHub-GraphLine-Background");
            this._currentTimespan = currentTimespan;
            this._horizontalLineCount = horizontalLineCount;
            this._onThemeChangeBoundFunction = this.onThemeChange.bind(this);
            plugin.Theme.addEventListener("themechanged", this._onThemeChangeBoundFunction);
        }
        get horizontalLineCount() {
            return this._horizontalLineCount;
        }
        get container() {
            return this._container;
        }
        dispose() {
            plugin.Theme.removeEventListener("themechanged", this._onThemeChangeBoundFunction);
        }
        resize(evt) {
            this._clientWidth = this._container.clientWidth;
            this._clientHeight = this._container.clientHeight;
            this._container.width = this._clientWidth;
            this._container.height = this._clientHeight;
            this.render();
        }
        onViewportChanged(viewportArgs) {
            if (this._currentTimespan.equals(viewportArgs.currentTimespan)) {
                return;
            }
            this._currentTimespan = viewportArgs.currentTimespan;
            this.render();
        }
        onThemeChange() {
            this._strokeStyle = plugin.Theme.getValue("DiagnosticsHub-GraphLine-Background");
            this.render();
        }
        render() {
            var tickMarks = RulerUtilities_2.RulerUtilities.getTickMarksPosition(this._currentTimespan, this._clientWidth);
            var elapsedTime = parseInt(this._currentTimespan.elapsed.value);
            this._context.clearRect(0, 0, this._clientWidth, this._clientHeight);
            this._context.strokeStyle = this._strokeStyle;
            tickMarks.forEach((tickMark) => {
                if (tickMark.type === Controls_Interfaces_4.TickMarkType.Big) {
                    var position = Math.round((this._clientWidth * parseInt(JsonTimespan_7.BigNumber.subtract(tickMark.value, this._currentTimespan.begin).value) / elapsedTime));
                    this._context.beginPath();
                    this._context.moveTo(position + .5, 0);
                    this._context.lineTo(position + .5, this._clientHeight);
                    this._context.stroke();
                }
            });
            for (var line = 0; line < this._horizontalLineCount && this._horizontalLineCount > 1; ++line) {
                var y = (this._clientHeight / (this._horizontalLineCount - 1)) * line;
                this._context.beginPath();
                this._context.moveTo(0, y);
                this._context.lineTo(this._clientWidth, y);
                this._context.stroke();
            }
        }
    }
    exports.GridLineRenderer = GridLineRenderer;
});
define("Swimlane/ViewEventManager", ["require", "exports", "Swimlane/AggregatedEvent"], function (require, exports, AggregatedEvent_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getViewEventManager = void 0;
    class ViewEventManager {
        constructor() {
            this._selectionChangedEvent = new AggregatedEvent_4.AggregatedEvent();
        }
        get selectionChanged() {
            return this._selectionChangedEvent;
        }
    }
    var _viewEventManager = null;
    function getViewEventManager() {
        if (_viewEventManager === null) {
            _viewEventManager = new ViewEventManager();
        }
        return _viewEventManager;
    }
    exports.getViewEventManager = getViewEventManager;
});
define("Swimlane/DataCursor", ["require", "exports", "plugin-vs-v2", "Misc/CommonStructs", "Misc/Constants", "Misc/KeyCodes", "Misc/RulerUtilities", "Misc/Utilities", "Swimlane/Controls.Interfaces", "Swimlane/JsonTimespan", "Swimlane/ViewEventManager"], function (require, exports, plugin, CommonStructs_2, Constants_4, KeyCodes_16, RulerUtilities_3, Utilities_8, Controls_Interfaces_5, JsonTimespan_8, ViewEventManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataCursor = void 0;
    class DataCursor {
        constructor(parent, series, viewport, swimlaneId, scaleMin, scaleMax) {
            this._parentClientWidth = 0;
            this._parentClientHeight = 0;
            this._timePerPixel = JsonTimespan_8.BigNumber.one;
            this._cursors = [];
            this._showingTooltip = false;
            this._tooltipTimer = null;
            this._viewEventManager = ViewEventManager_1.getViewEventManager();
            this._parent = parent;
            this._series = series;
            this._viewport = viewport;
            this._previousTime = this._viewport.begin;
            this._selectionTimeAnchor = this._previousTime;
            this._scaleMin = scaleMin;
            this._scaleMax = scaleMax;
            this._container = document.createElement("div");
            this._container.classList.add("dataCursor");
            this._container.classList.add("hidden");
            this._cursors = series.map((dataSeries) => {
                var cursorDomElement = dataSeries.marker.cloneNode(true);
                cursorDomElement.classList.add("dataCursorPoint");
                document.body.appendChild(cursorDomElement);
                var width = cursorDomElement.clientWidth + 2;
                var height = cursorDomElement.clientHeight + 2;
                document.body.removeChild(cursorDomElement);
                cursorDomElement.style.left = (-width / 2) + "px";
                cursorDomElement.style.width = width + "px";
                cursorDomElement.style.height = height + "px";
                this._container.appendChild(cursorDomElement);
                return {
                    domElement: cursorDomElement,
                    width: width,
                    height: height
                };
            });
            this._onMouseEnterBoundFunction = this.onMouseEnter.bind(this);
            this._onMouseMoveBoundFunction = this.onMouseMove.bind(this);
            this._onMouseLeaveBoundFunction = this.onMouseLeave.bind(this);
            this._onKeyDownBoundFunction = this.onKeyDown.bind(this);
            this._onKeyUpBoundFunction = this.onKeyUp.bind(this);
            this._parent.setAttribute("role", "slider");
            this._parent.setAttribute("aria-live", "polite");
            this._parent.addEventListener("mouseenter", this._onMouseEnterBoundFunction);
            this._parent.addEventListener("mousemove", this._onMouseMoveBoundFunction);
            this._parent.addEventListener("mouseleave", this._onMouseLeaveBoundFunction);
            this._parent.addEventListener("keydown", this._onKeyDownBoundFunction);
            this._parent.addEventListener("keyup", this._onKeyUpBoundFunction);
        }
        get container() {
            return this._container;
        }
        dispose() {
            this._parent.removeEventListener("mouseenter", this._onMouseEnterBoundFunction);
            this._parent.removeEventListener("mousemove", this._onMouseMoveBoundFunction);
            this._parent.removeEventListener("mouseleave", this._onMouseLeaveBoundFunction);
            this._parent.removeEventListener("keydown", this._onKeyDownBoundFunction);
            this._parent.removeEventListener("keyup", this._onKeyUpBoundFunction);
        }
        resize(evt) {
            this._parentClientWidth = this._parent.clientWidth;
            this._parentClientHeight = this._parent.clientHeight;
            this._timePerPixel = this._parentClientWidth !== 0 ? JsonTimespan_8.BigNumber.divideNumber(this._viewport.elapsed, this._parentClientWidth) : JsonTimespan_8.BigNumber.one;
        }
        onViewportChanged(viewportArgs) {
            if (this._viewport.equals(viewportArgs.currentTimespan)) {
                return;
            }
            this._viewport = viewportArgs.currentTimespan;
            this._previousTime = this._viewport.begin;
            this._selectionTimeAnchor = this._previousTime;
            this._timePerPixel = this._parentClientWidth !== 0 ? JsonTimespan_8.BigNumber.divideNumber(this._viewport.elapsed, this._parentClientWidth) : JsonTimespan_8.BigNumber.one;
            this.dismissTooltip();
            this._container.classList.add("hidden");
        }
        onScaleChanged(scaleArgs) {
            this._scaleMin = scaleArgs.minimum;
            this._scaleMax = scaleArgs.maximum;
        }
        onKeyDown(event) {
            if (event.ctrlKey && event.keyCode === KeyCodes_16.KeyCodes.Ctrl) {
                this._selectionTimeAnchor = this._previousTime;
                return;
            }
            if (event.keyCode !== KeyCodes_16.KeyCodes.ArrowLeft &&
                event.keyCode !== KeyCodes_16.KeyCodes.ArrowRight) {
                return;
            }
            event.preventDefault();
            var boundingRect = event.currentTarget.getBoundingClientRect();
            var previousTimestamp = this._previousTime;
            var pointToFind;
            if (event.keyCode === KeyCodes_16.KeyCodes.ArrowRight) {
                this._previousTime = JsonTimespan_8.BigNumber.add(this._previousTime, this._timePerPixel);
                pointToFind = Controls_Interfaces_5.PointToFind.GreaterThanOrEqual;
            }
            else {
                this._previousTime = this._previousTime.greater(this._timePerPixel) ? JsonTimespan_8.BigNumber.subtract(this._previousTime, this._timePerPixel) : JsonTimespan_8.BigNumber.zero;
                pointToFind = Controls_Interfaces_5.PointToFind.LessThanOrEqual;
            }
            var currentPoints = this.getPointsAt(this._previousTime, pointToFind);
            if (currentPoints.length === 0) {
                return;
            }
            var nearestTimestamp = currentPoints[0].seriesElement.timestamp;
            if (nearestTimestamp.equals(previousTimestamp) ||
                nearestTimestamp.greater(this._viewport.end) ||
                this._viewport.begin.greater(nearestTimestamp)) {
                this._previousTime = event.keyCode === KeyCodes_16.KeyCodes.ArrowRight ? this._viewport.begin : this._viewport.end;
                currentPoints = this.getPointsAt(this._previousTime, pointToFind);
                nearestTimestamp = currentPoints[0].seriesElement.timestamp;
            }
            this._previousTime = nearestTimestamp;
            this.updateCursorLocation(nearestTimestamp, currentPoints);
            this.dismissTooltip();
            this.displayTooltip(boundingRect, nearestTimestamp, currentPoints);
            if (event.ctrlKey) {
                this._viewEventManager.selectionChanged.invokeEvent({
                    position: new JsonTimespan_8.JsonTimespan(JsonTimespan_8.BigNumber.min(this._selectionTimeAnchor, this._previousTime), JsonTimespan_8.BigNumber.max(this._selectionTimeAnchor, this._previousTime)),
                    isIntermittent: true
                });
            }
        }
        onKeyUp(event) {
            if (event.keyCode !== KeyCodes_16.KeyCodes.Ctrl) {
                return;
            }
            this._viewEventManager.selectionChanged.invokeEvent({
                position: new JsonTimespan_8.JsonTimespan(JsonTimespan_8.BigNumber.min(this._selectionTimeAnchor, this._previousTime), JsonTimespan_8.BigNumber.max(this._selectionTimeAnchor, this._previousTime)),
                isIntermittent: false
            });
        }
        onMouseEnter(event) {
            this._container.classList.remove("hidden");
        }
        onMouseMove(event) {
            var boundingRect = event.currentTarget.getBoundingClientRect();
            var mouseTimestamp = Utilities_8.Utilities.getTimestampAtPixel(event.clientX - boundingRect.left, this._parentClientWidth, this._viewport);
            if (mouseTimestamp.equals(this._previousTime)) {
                return;
            }
            this._previousTime = mouseTimestamp;
            var boundingRect = event.currentTarget.getBoundingClientRect();
            var points = this.getPointsAt(mouseTimestamp);
            if (points.length === 0) {
                this._container.classList.add("hidden");
                return;
            }
            var nearestTimestamp = points[0].seriesElement.timestamp;
            var delta = JsonTimespan_8.BigNumber.subtract(JsonTimespan_8.BigNumber.max(nearestTimestamp, mouseTimestamp), JsonTimespan_8.BigNumber.min(nearestTimestamp, mouseTimestamp));
            var threshold = JsonTimespan_8.BigNumber.multiplyNumber(this._timePerPixel, DataCursor.SnapThresholdInPixels);
            var isInterpolating = delta.greater(threshold);
            if (isInterpolating) {
                this._container.classList.add("interpolating");
                this.updateCursorLocation(mouseTimestamp, points);
            }
            else {
                this._container.classList.remove("interpolating");
                this.updateCursorLocation(nearestTimestamp, points);
            }
            this.dismissTooltip();
            this.displayTooltip(boundingRect, mouseTimestamp, points, isInterpolating);
        }
        onMouseLeave(event) {
            var mouseTimestamp = Utilities_8.Utilities.getTimestampAtPixel(event.x, this._parentClientWidth, this._viewport);
            if (this._showingTooltip && mouseTimestamp.equals(this._previousTime)) {
                return;
            }
            this.dismissTooltip();
            this._container.classList.add("hidden");
            this._previousTime = this._viewport.begin;
        }
        getPointsAt(timestamp, pointToFind = Controls_Interfaces_5.PointToFind.Nearest) {
            return this._series.map((series, seriesNumber) => {
                return {
                    seriesElement: series.getPointAtTimestamp(timestamp, pointToFind),
                    cursor: this._cursors[seriesNumber]
                };
            }).filter((point) => {
                return point.seriesElement !== null;
            }).sort((point1, point2) => {
                switch (pointToFind) {
                    case Controls_Interfaces_5.PointToFind.GreaterThanOrEqual:
                        var p1Greater = point1.seriesElement.timestamp.greaterOrEqual(timestamp);
                        var p2Greater = point2.seriesElement.timestamp.greaterOrEqual(timestamp);
                        if (p1Greater === p2Greater) {
                            break;
                        }
                        return p1Greater ? -1 : 1;
                    case Controls_Interfaces_5.PointToFind.LessThanOrEqual:
                        var p1Less = timestamp.greaterOrEqual(point1.seriesElement.timestamp);
                        var p2Less = timestamp.greaterOrEqual(point2.seriesElement.timestamp);
                        if (p1Less === p2Less) {
                            break;
                        }
                        return p1Less ? -1 : 1;
                    default:
                        break;
                }
                var delta1 = JsonTimespan_8.BigNumber.subtract(JsonTimespan_8.BigNumber.max(timestamp, point1.seriesElement.timestamp), JsonTimespan_8.BigNumber.min(timestamp, point1.seriesElement.timestamp));
                var delta2 = JsonTimespan_8.BigNumber.subtract(JsonTimespan_8.BigNumber.max(timestamp, point2.seriesElement.timestamp), JsonTimespan_8.BigNumber.min(timestamp, point2.seriesElement.timestamp));
                return delta1.compareTo(delta2);
            }).filter((element, index, sortedElements) => {
                var delta = JsonTimespan_8.BigNumber.subtract(JsonTimespan_8.BigNumber.max(sortedElements[0].seriesElement.timestamp, element.seriesElement.timestamp), JsonTimespan_8.BigNumber.min(sortedElements[0].seriesElement.timestamp, element.seriesElement.timestamp));
                return this._timePerPixel.greater(delta);
            });
        }
        updateCursorLocation(timestamp, elements) {
            var x = Utilities_8.Utilities.convertToPixel(timestamp, this._viewport, this._parentClientWidth);
            this._container.style.left = Math.floor(x) + "px";
            this._cursors.forEach((cursor) => cursor.domElement.style.visibility = "hidden");
            elements.forEach((element) => {
                if (typeof (element.seriesElement.value) === "number") {
                    var y = Utilities_8.Utilities.scaleToRange(element.seriesElement.value, this._scaleMin, this._scaleMax, 0, this._parentClientHeight);
                    element.cursor.domElement.style.bottom = (y - element.cursor.height / 2) + "px";
                    element.cursor.domElement.style.visibility = "visible";
                }
                else {
                    element.cursor.domElement.style.visibility = "visible";
                }
            });
            this._container.classList.remove("hidden");
        }
        displayTooltip(boundingRect, timestamp, elements, isInterpolating = false) {
            this._tooltipTimer = null;
            this._showingTooltip = true;
            var x = Utilities_8.Utilities.convertToPixel(timestamp, this._viewport, this._parentClientWidth);
            var toolTips = elements.map((element) => element.seriesElement.tooltip);
            if (isInterpolating) {
                toolTips.unshift(plugin.Resources.getString("DataCursorInterpolatingTooltip"));
            }
            if (toolTips.length > 0) {
                var tooltip = toolTips.join("\n");
                var ariaLabel = plugin.Resources.getString("ChartSeriesFormattableTimeLabel", RulerUtilities_3.RulerUtilities.formatTime(timestamp, CommonStructs_2.UnitFormat.fullName)) + "\n" + tooltip;
                this._parent.setAttribute("aria-valuenow", ariaLabel);
                this._parent.setAttribute("aria-valuetext", ariaLabel);
                this._tooltipTimer = setTimeout(() => {
                    var message = plugin.Resources.getString("ChartSeriesFormattableTimeLabel", RulerUtilities_3.RulerUtilities.formatTime(timestamp)) + "\n" + tooltip;
                    var config = {
                        content: message,
                        delay: 0,
                        x: x + boundingRect.left + 10,
                        y: boundingRect.top
                    };
                    plugin.Tooltip.show(config);
                }, Constants_4.Constants.TooltipTimeoutMs);
            }
        }
        dismissTooltip() {
            clearTimeout(this._tooltipTimer);
            this._tooltipTimer = null;
            this._showingTooltip = false;
            plugin.Tooltip.dismiss();
        }
    }
    exports.DataCursor = DataCursor;
    DataCursor.SnapThresholdInPixels = 10;
});
define("Swimlane/MultiSeriesGraph", ["require", "exports", "Misc/CommonStructs", "Misc/Constants", "Misc/LocalizedUnitConverter", "Misc/Logger", "Swimlane/AggregatedEvent", "Swimlane/ChartColorScheme", "Swimlane/DataCursor", "Swimlane/JsonTimespan"], function (require, exports, CommonStructs_3, Constants_5, LocalizedUnitConverter_1, Logger_10, AggregatedEvent_5, ChartColorScheme_2, DataCursor_1, JsonTimespan_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiSeriesGraph = void 0;
    class MultiSeriesGraph {
        constructor(config, additionalGraphSeries) {
            this._logger = Logger_10.getLogger();
            this._defaultColorScheme = new ChartColorScheme_2.ChartColorScheme("rgb(118, 174, 200)", "rgba(118, 174, 200, 0.65)");
            this._currentTimespan = new JsonTimespan_9.JsonTimespan(JsonTimespan_9.BigNumber.zero, JsonTimespan_9.BigNumber.zero);
            this._dataSeries = [];
            this._clientWidth = 0;
            this._clientHeight = 0;
            this._scaleIncreaseRatio = 1.1;
            this._scaleChangedEvent = new AggregatedEvent_5.AggregatedEvent();
            this._container = document.createElement("div");
            this._container.classList.add("graphContainer");
            this._container.tabIndex = 0;
            this._container.style.zIndex = Constants_5.Constants.GraphContainerZIndex.toString();
            this._canvas = document.createElement("canvas");
            this._canvas.classList.add("graph-canvas");
            this._context = this._canvas.getContext("2d");
            this._unitConverter = new LocalizedUnitConverter_1.LocalizedUnitConverter(config.jsonConfig.Units, config.resources);
            this._currentTimespan = config.timeRange;
            this._scaleMin = config.scale.minimum;
            this._scaleMax = config.scale.maximum;
            this._isScaleFixed = config.scale.isFixed;
            this._onNewSeriesDataBoundFunction = this.onNewSeriesData.bind(this);
            if (config.jsonConfig.Unit) {
                config.unit = config.resources[config.jsonConfig.Unit];
            }
            this._container.appendChild(this._canvas);
            if (additionalGraphSeries) {
                additionalGraphSeries.forEach((additionalSeries) => {
                    additionalSeries.newDataEvent.addEventListener(this._onNewSeriesDataBoundFunction);
                    this._dataSeries.push(additionalSeries);
                });
            }
            this._dataCursor = new DataCursor_1.DataCursor(this._container, this._dataSeries, this._currentTimespan, config.swimlaneId, this._scaleMin, this._scaleMax);
            this._scaleChangedEvent.addEventListener(this._dataCursor.onScaleChanged.bind(this._dataCursor));
            this._container.appendChild(this._dataCursor.container);
        }
        get container() {
            return this._container;
        }
        get scaleChangedEvent() {
            return this._scaleChangedEvent;
        }
        dispose() {
            this._dataCursor.dispose();
            this._dataSeries.forEach((series) => {
                series.newDataEvent.removeEventListener(this._onNewSeriesDataBoundFunction);
                if (series.dispose) {
                    series.dispose();
                }
            });
            this._scaleChangedEvent.dispose();
        }
        resize(evt) {
            var width = this._container.clientWidth;
            var height = this._container.clientHeight;
            if (this._clientWidth === width && this._clientHeight === height) {
                return;
            }
            this._clientWidth = width;
            this._clientHeight = height;
            this._canvas.width = this._clientWidth;
            this._canvas.height = this._clientHeight;
            this._dataCursor.resize(evt);
            this.draw();
        }
        onDataUpdate(timestampNs) {
            this._dataSeries.forEach((series) => {
                if (series.onDataUpdate) {
                    series.onDataUpdate(timestampNs);
                }
            });
        }
        addSeriesData(counterId, points, fullRender, dropOldData) {
        }
        removeInvalidPoints(base) {
        }
        render(fullRender, refresh) {
        }
        onViewportChanged(viewportArgs) {
            if (viewportArgs.isIntermittent || this._currentTimespan.equals(viewportArgs.currentTimespan)) {
                return;
            }
            this._currentTimespan = viewportArgs.currentTimespan;
            this._dataCursor.onViewportChanged(viewportArgs);
            this._dataSeries.forEach((series) => {
                series.onViewportChanged(this._currentTimespan);
            });
            this.draw();
        }
        onNewSeriesData(series) {
            var scaleChanged = false;
            if (!this._isScaleFixed && !isNaN(series.minValue) && series.minValue < this._scaleMin) {
                this._scaleMin = series.minValue;
                scaleChanged = true;
            }
            if (!this._isScaleFixed && !isNaN(series.maxValue) && series.maxValue * this._scaleIncreaseRatio > this._scaleMax) {
                this._scaleMax = series.maxValue * this._scaleIncreaseRatio;
                scaleChanged = true;
            }
            this.draw();
            if (scaleChanged) {
                var scaledMax = this._unitConverter.scaleValue(this._scaleMax);
                this._scaleChangedEvent.invokeEvent({
                    minimum: this._scaleMin,
                    maximum: this._scaleMax,
                    unit: scaledMax.unit
                });
            }
        }
        draw() {
            this._context.clearRect(0, 0, this._clientWidth, this._clientHeight);
            this._context.save();
            var graphInfo = {
                gridX: this._currentTimespan,
                gridY: new CommonStructs_3.MinMaxNumber(this._scaleMin, this._scaleMax),
                chartRect: new CommonStructs_3.RectangleDimension(0, 0, this._clientWidth, this._clientHeight)
            };
            this._dataSeries.forEach((series) => {
                series.draw(this._context, graphInfo);
            });
            this._context.restore();
        }
    }
    exports.MultiSeriesGraph = MultiSeriesGraph;
});
define("Swimlane/Scale", ["require", "exports", "plugin-vs-v2", "Misc/Utilities", "Swimlane/Controls.Interfaces"], function (require, exports, plugin, Utilities_9, Controls_Interfaces_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Scale = void 0;
    class Scale {
        constructor(config, scaleType, unitConverter, gridLineRenderer) {
            if (!config) {
                throw new Error(plugin.Resources.getErrorString("JSProfiler.1002"));
            }
            this._minimum = config.minimum;
            this._maximum = config.maximum;
            this._axes = config.axes;
            this._axesCount = this._axes ? this._axes.length : gridLineRenderer.horizontalLineCount;
            this._unitConverter = unitConverter;
            this._scaleType = scaleType;
            this._container = document.createElement("div");
            this._container.className = this._scaleType === Controls_Interfaces_6.ScaleType.Left ? "graph-scale-left" : "graph-scale-right";
        }
        get container() {
            return this._container;
        }
        resize(evt) {
            var height = this._container.clientHeight;
            if (this._clientHeight === height) {
                return;
            }
            this._clientHeight = height;
            this.render();
        }
        onScaleChanged(args) {
            this._minimum = args.minimum;
            this._maximum = args.maximum;
            this.render();
        }
        render() {
            while (this._container.childNodes.length > 0) {
                this._container.removeChild(this._container.firstChild);
            }
            if (this._axes && this._axes.length > 0) {
                for (var i = 0; i < this._axes.length; i++) {
                    var axis = this._axes[i];
                    this.drawAxisValue(axis.value);
                }
            }
            else {
                var step = (this._maximum - this._minimum) / (this._axesCount - 1);
                for (var v = this._minimum; v < this._maximum; v += step) {
                    this.drawAxisValue(v);
                }
                this.drawAxisValue(this._maximum);
            }
        }
        drawAxisValue(value) {
            if (value > this._maximum || value < this._minimum) {
                return;
            }
            var axisDiv = document.createElement("div");
            axisDiv.className = this._scaleType === Controls_Interfaces_6.ScaleType.Left ? "graph-axis-left" : "graph-axis-right";
            var scaledValue = this._unitConverter.scaleValue(value);
            axisDiv.innerHTML = Utilities_9.Utilities.formatNumber(scaledValue.value, 0);
            this._container.appendChild(axisDiv);
            var top = 0;
            var y = Math.floor(((this._maximum - value) / (this._maximum - this._minimum)) * this._clientHeight) - (axisDiv.offsetHeight / 2);
            y = Math.max(0, y);
            y = Math.min(y, this._clientHeight - axisDiv.offsetHeight);
            axisDiv.style.top = y + "px";
        }
    }
    exports.Scale = Scale;
});
define("Swimlane/ControlDecorator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ControlDecorator = void 0;
    class ControlDecorator {
        constructor(decorated) {
            this._decoratedControl = decorated;
        }
        get container() {
            return this._decoratedControl.container;
        }
        onDataUpdate(timestampNs) {
            if (this._decoratedControl.onDataUpdate) {
                this._decoratedControl.onDataUpdate(timestampNs);
            }
        }
        resize(evt) {
            if (this._decoratedControl.resize) {
                this._decoratedControl.resize(evt);
            }
        }
        onViewportChanged(viewportArgs) {
            if (this._decoratedControl.onViewportChanged) {
                this._decoratedControl.onViewportChanged(viewportArgs);
            }
        }
        dispose() {
            if (this._decoratedControl.dispose) {
                this._decoratedControl.dispose();
            }
        }
    }
    exports.ControlDecorator = ControlDecorator;
});
define("Swimlane/SelectionOverlay", ["require", "exports", "Misc/Constants", "Misc/KeyCodes", "Misc/Utilities", "Swimlane/ControlDecorator", "Swimlane/JsonTimespan", "Swimlane/ViewEventManager"], function (require, exports, Constants_6, KeyCodes_17, Utilities_10, ControlDecorator_1, JsonTimespan_10, ViewEventManager_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionOverlay = void 0;
    class SelectionOverlay extends ControlDecorator_1.ControlDecorator {
        constructor(controlToOverlay, currentTimespan, currentSelection, sourceId) {
            super(controlToOverlay);
            this._selectionTimeAnchor = null;
            this._animationFrameHandle = null;
            this._currentTimespan = currentTimespan;
            this._currentSelection = currentSelection;
            this._sourceId = sourceId;
            this._container = document.createElement("div");
            this._container.className = "selectionOverlay";
            this._container.style.zIndex = Constants_6.Constants.SelectionOverlayZIndex.toString();
            this._leftUnselectedRegion = document.createElement("div");
            this._rightUnselectedRegion = document.createElement("div");
            this._leftUnselectedRegion.className = "unselected";
            this._leftUnselectedRegion.style.top = "0px";
            this._rightUnselectedRegion.className = "unselected";
            this._rightUnselectedRegion.style.top = "0px";
            this._container.appendChild(this._leftUnselectedRegion);
            this._container.appendChild(controlToOverlay.container);
            this._container.appendChild(this._rightUnselectedRegion);
            this._container.onmousedown = this.onStartSelection.bind(this);
            this._container.onmousemove = this.onDragSelection.bind(this);
            this._container.onmouseup = this.onStopSelection.bind(this);
            this._viewEventManager = ViewEventManager_2.getViewEventManager();
        }
        get container() {
            return this._container;
        }
        dispose() {
            this._container.onmousedown = null;
            this._container.onmousemove = null;
            this._container.onmouseup = null;
            super.dispose();
        }
        resize(evt) {
            this._clientWidth = this._container.clientWidth;
            this._clientRect = this._container.getBoundingClientRect();
            this.updateDom();
            super.resize(evt);
        }
        onViewportChanged(viewportArgs) {
            this._currentTimespan = viewportArgs.currentTimespan;
            this._currentSelection = viewportArgs.selectionTimespan;
            this.updateDom();
            super.onViewportChanged(viewportArgs);
        }
        onStartSelection(event) {
            if (event.which !== KeyCodes_17.MouseCodes.Left) {
                return;
            }
            if (this._animationFrameHandle) {
                this.onStopSelection(event);
                return;
            }
            this._selectionTimeAnchor = Utilities_10.Utilities.getTimestampAtPixel(event.clientX - this._clientRect.left, this._clientWidth, this._currentTimespan);
            this._currentSelection = new JsonTimespan_10.JsonTimespan(this._selectionTimeAnchor, JsonTimespan_10.BigNumber.addNumber(this._selectionTimeAnchor, Utilities_10.Utilities.translateNumPixelToDuration(Constants_6.SwimlaneViewConstants.MinSelectionInPixels, this._clientWidth, this._currentTimespan)));
            Utilities_10.Utilities.setCapture(this._container);
            this.container.classList.add("selectionActive");
            this._animationFrameHandle = window.requestAnimationFrame(this.onSelectionAnimation.bind(this));
            event.stopPropagation();
        }
        onDragSelection(event) {
            if (event.target !== this._container || event.which !== KeyCodes_17.MouseCodes.Left) {
                return;
            }
            else if (!this._animationFrameHandle) {
                return;
            }
            var left = Math.max(event.clientX - this._clientRect.left, 0);
            left = Math.min(left, this._clientWidth);
            var xTime = Utilities_10.Utilities.getTimestampAtPixel(left, this._clientWidth, this._currentTimespan);
            if (this._selectionTimeAnchor.greater(xTime)) {
                this._currentSelection = new JsonTimespan_10.JsonTimespan(xTime, this._selectionTimeAnchor);
            }
            else {
                this._currentSelection = new JsonTimespan_10.JsonTimespan(this._selectionTimeAnchor, xTime);
            }
            event.stopPropagation();
        }
        onStopSelection(event) {
            if (event.which !== KeyCodes_17.MouseCodes.Left) {
                return;
            }
            else if (!this._animationFrameHandle) {
                return;
            }
            Utilities_10.Utilities.releaseCapture(this._container);
            window.cancelAnimationFrame(this._animationFrameHandle);
            this._animationFrameHandle = null;
            this.container.classList.remove("selectionActive");
            this.raiseSelectionChanged(false);
            var isMinSelection = false;
            if (this._currentSelection) {
                isMinSelection = Utilities_10.Utilities.getTimestampAtPixel(Constants_6.SwimlaneViewConstants.MinSelectionInPixels, this._clientWidth, this._currentTimespan)
                    .greaterOrEqual(this._currentSelection.elapsed);
            }
        }
        onSelectionAnimation() {
            this.raiseSelectionChanged(true);
            this._animationFrameHandle = window.requestAnimationFrame(this.onSelectionAnimation.bind(this));
        }
        raiseSelectionChanged(isIntermittent = false) {
            this._viewEventManager.selectionChanged.invokeEvent({
                position: this._currentSelection,
                isIntermittent: isIntermittent
            });
        }
        updateDom() {
            if (this._currentSelection) {
                var left = Utilities_10.Utilities.convertToPixel(this._currentSelection.begin, this._currentTimespan, this._clientWidth);
                left = Math.max(left, 0);
                var right = Utilities_10.Utilities.convertToPixel(this._currentSelection.end, this._currentTimespan, this._clientWidth);
                var rightWidth = (this._clientWidth - right);
                rightWidth = Math.max(rightWidth, 0);
                this._leftUnselectedRegion.style.width = left + "px";
                this._rightUnselectedRegion.style.left = right + "px";
                this._rightUnselectedRegion.style.width = rightWidth + "px";
            }
            else {
                this._leftUnselectedRegion.style.width = "0px";
                this._rightUnselectedRegion.style.left = this._clientWidth + "px";
                this._rightUnselectedRegion.style.width = "0px";
            }
        }
        removeSelection() {
            this._currentSelection = null;
            this.updateDom();
        }
    }
    exports.SelectionOverlay = SelectionOverlay;
});
define("Swimlane/SwimlaneBase", ["require", "exports", "plugin-vs-v2", "Misc/KeyCodes", "Misc/RulerUtilities", "Misc/Utilities", "Swimlane/AggregatedEvent"], function (require, exports, plugin, KeyCodes_18, RulerUtilities_4, Utilities_11, AggregatedEvent_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwimlaneBase = void 0;
    class SwimlaneBase {
        constructor(titleConfig, contentHeight, currentTimespan, timeFilter = null, selectionTimespan = null) {
            this._clientWidth = 0;
            this._clientHeight = 0;
            this._isVisible = true;
            this._controls = [];
            this._swimlaneVisibilityChangedEvent = new AggregatedEvent_6.AggregatedEvent();
            this._container = document.createElement("div");
            this._container.classList.add("swimlaneBase");
            this._currentTimespan = currentTimespan;
            this._timeFilter = timeFilter;
            this._selectionTimespan = selectionTimespan;
            this._isVisible = titleConfig.isBodyExpanded;
            this._titleRegion = document.createElement("div");
            this._contentRegion = document.createElement("div");
            this._leftRegion = document.createElement("div");
            this._mainRegion = document.createElement("div");
            this._rightRegion = document.createElement("div");
            this._titleRegion.classList.add("titleRegion");
            this._contentRegion.classList.add("contentRegion");
            this._leftRegion.classList.add("leftRegion");
            this._mainRegion.classList.add("mainRegion");
            this._rightRegion.classList.add("rightRegion");
            this._contentRegion.style.height = contentHeight + "px";
            this._contentRegion.appendChild(this._leftRegion);
            this._contentRegion.appendChild(this._mainRegion);
            this._contentRegion.appendChild(this._rightRegion);
            this._titleText = titleConfig.titleText;
            this._unit = titleConfig.unit;
            this._titleContainer = document.createElement("div");
            this._titleContainer.className = "title-container";
            this._titleCollapseExpandButton = document.createElement("div");
            this._titleCollapseExpandButton.setAttribute("role", "button");
            this._titleCollapseExpandButton.setAttribute("aria-label", this._titleText);
            this._titleCollapseExpandButton.tabIndex = 0;
            this._titleCollapseExpandButton.onclick = this.toggleVisibility.bind(this);
            this._titleCollapseExpandButton.onkeydown = this.onKeyDown.bind(this);
            this._titleContainer.appendChild(this._titleCollapseExpandButton);
            this._titleTextElement = document.createElement("div");
            this._titleTextElement.className = "title-text";
            this._titleContainer.appendChild(this._titleTextElement);
            this._container.appendChild(this._titleContainer);
            this._container.appendChild(this._titleRegion);
            this._container.appendChild(this._contentRegion);
            this.updateTitle();
            this.updateContentVisibility();
            this._collapseCallback = (e) => {
                if (e.matches) {
                    this._titleRegion.classList.add("limitedSpace");
                }
                else {
                    this._titleRegion.classList.remove("limitedSpace");
                }
            };
            this.updateCollapsingWidth();
        }
        get container() {
            return this._container;
        }
        get swimlaneVisibilityChangedEvent() {
            return this._swimlaneVisibilityChangedEvent;
        }
        dispose() {
            this._swimlaneVisibilityChangedEvent.dispose();
            this._titleCollapseExpandButton.onclick = null;
            this._titleCollapseExpandButton.onkeydown = null;
            this._controls.forEach((control) => {
                if (control.dispose) {
                    control.dispose();
                }
            });
        }
        resize(evt) {
            if (!this._clientWidth && !this._clientHeight) {
                this.updateCollapsingWidth();
            }
            if (this._clientWidth === this._container.clientWidth && this._clientHeight === this._container.clientHeight) {
                return;
            }
            this._clientHeight = this._container.clientHeight;
            this._clientWidth = this._container.clientWidth;
            if (!this._isVisible) {
                return;
            }
            this._controls.forEach((control) => {
                if (control.resize) {
                    control.resize(evt);
                }
            });
        }
        onViewportChanged(viewportArgs) {
            this._currentTimespan = viewportArgs.currentTimespan;
            this._selectionTimespan = viewportArgs.selectionTimespan;
            if (this._isVisible) {
                this._controls.forEach((control) => {
                    if (control.onViewportChanged) {
                        control.onViewportChanged(viewportArgs);
                    }
                });
            }
        }
        onDataUpdate(timestampNs) {
            this._controls.forEach((control) => {
                if (control.onDataUpdate) {
                    control.onDataUpdate(timestampNs);
                }
            });
        }
        onScaleChanged(args) {
            this._unit = args.unit || this._unit;
            this.updateTitle();
        }
        addTitleControl(control) {
            this._titleRegion.appendChild(control.container);
            this._controls.push(control);
            this.updateCollapsingWidth();
        }
        addLeftRegionControl(control) {
            this._leftRegion.appendChild(control.container);
            this._controls.push(control);
        }
        addRightRegionControl(control) {
            this._rightRegion.appendChild(control.container);
            this._controls.push(control);
        }
        addMainRegionControl(control) {
            this._mainRegion.appendChild(control.container);
            this._controls.push(control);
        }
        setTimeFilter(timeFilter) {
            this._timeFilter = timeFilter;
            this.updateTitle();
        }
        onKeyDown(e) {
            if (KeyCodes_18.KeyCodes.Enter === e.keyCode) {
                this.toggleVisibility();
            }
        }
        toggleVisibility() {
            this._isVisible = !this._isVisible;
            this.updateContentVisibility();
            if (this._isVisible) {
                this.resize(null);
                this.onViewportChanged({
                    currentTimespan: this._currentTimespan,
                    selectionTimespan: this._selectionTimespan,
                    isIntermittent: false
                });
            }
            this._swimlaneVisibilityChangedEvent.invokeEvent(this._isVisible);
        }
        updateTitle() {
            var text = this._titleText;
            if (this._unit) {
                text += " (" + this._unit + ")";
            }
            if (this._timeFilter) {
                var text = plugin.Resources.getString("SummaryView_GraphTitleFormattedWithTime", text, RulerUtilities_4.RulerUtilities.formatTime(this._timeFilter.begin), RulerUtilities_4.RulerUtilities.formatTime(this._timeFilter.end));
            }
            this._titleTextElement.innerHTML = text;
        }
        updateContentVisibility() {
            if (this._isVisible) {
                this._titleCollapseExpandButton.className = "title-expanded-button";
                this._contentRegion.style.display = "grid";
                this._titleRegion.classList.remove("collapsed");
            }
            else {
                this._titleCollapseExpandButton.className = "title-collapsed-button";
                this._contentRegion.style.display = "none";
                this._titleRegion.classList.add("collapsed");
            }
            this._titleCollapseExpandButton.setAttribute("aria-expanded", String(this._isVisible));
        }
        updateCollapsingWidth() {
            if (this._collapseMediaQuery) {
                this._collapseMediaQuery.removeListener(this._collapseCallback);
            }
            var preferredWidth = this._titleContainer.offsetWidth + this._titleRegion.offsetWidth;
            this._collapseMediaQuery = window.matchMedia(Utilities_11.Utilities.formatString("(max-width: {0}px)", preferredWidth.toString()));
            this._collapseMediaQuery.addListener(this._collapseCallback);
        }
    }
    exports.SwimlaneBase = SwimlaneBase;
});
define("Swimlane/TimeFilterOverlay", ["require", "exports", "Misc/Constants", "Misc/Utilities", "Swimlane/ControlDecorator"], function (require, exports, Constants_7, Utilities_12, ControlDecorator_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimeFilterOverlay = void 0;
    class TimeFilterOverlay extends ControlDecorator_2.ControlDecorator {
        constructor(controlToOverlay, currentTimespan, timeFilter) {
            super(controlToOverlay);
            this._currentTimespan = currentTimespan;
            this._timeFilter = timeFilter;
            this._container = document.createElement("div");
            this._container.className = "timeFilterOverlay";
            this._container.style.zIndex = (Constants_7.Constants.SelectionOverlayZIndex - 1).toString();
            this._timeFilterOverlay = document.createElement("div");
            this._timeFilterOverlay.className = "timeFilter";
            if (this._timeFilter === null) {
                this._timeFilterOverlay.classList.add("hidden");
            }
            this._container.appendChild(this._timeFilterOverlay);
            this._container.appendChild(controlToOverlay.container);
        }
        get container() {
            return this._container;
        }
        dispose() {
            super.dispose();
        }
        resize(evt) {
            this._clientWidth = this._container.clientWidth;
            this.updateDom();
            super.resize(evt);
        }
        onViewportChanged(viewportArgs) {
            this._currentTimespan = viewportArgs.currentTimespan;
            this.updateDom();
            super.onViewportChanged(viewportArgs);
        }
        updateDom() {
            if (this._timeFilter === null) {
                return;
            }
            var left = Utilities_12.Utilities.convertToPixel(this._timeFilter.begin, this._currentTimespan, this._clientWidth);
            left = Math.max(left, 0);
            var right = Utilities_12.Utilities.convertToPixel(this._timeFilter.end, this._currentTimespan, this._clientWidth);
            right = Math.max(right, 0);
            this._timeFilterOverlay.style.left = left + "px";
            this._timeFilterOverlay.style.width = (right - left) + "px";
        }
        updateTimespan(newTimespan) {
            if (newTimespan) {
                this._timeFilterOverlay.classList.remove("hidden");
            }
            else {
                this._timeFilterOverlay.classList.add("hidden");
            }
            this._timeFilter = newTimespan;
            this.updateDom();
        }
    }
    exports.TimeFilterOverlay = TimeFilterOverlay;
});
define("ViewModels/SummaryViewModel", ["require", "exports", "plugin-vs-v2", "DAO/CallTreeDAO", "DAO/ReportDAO", "DAO/SummaryDAO", "Misc/Constants", "Misc/EventThrottler", "Misc/InformationBarControl", "Misc/LocalizedUnitConverter", "Misc/RulerUtilities", "Swimlane/Controls.Interfaces", "Swimlane/GraphTimeAxis", "Swimlane/GridLineRenderer", "Swimlane/JsonTimespan", "Swimlane/MultiSeriesGraph", "Swimlane/Scale", "Swimlane/SelectionOverlay", "Swimlane/SummaryDataSeries", "Swimlane/SwimlaneBase", "Swimlane/TimeFilterOverlay", "Swimlane/ViewEventManager", "ViewModels/MainViewModel"], function (require, exports, plugin, CallTreeDAO_2, ReportDAO_2, SummaryDAO_1, Constants_8, EventThrottler_3, InformationBarControl_2, LocalizedUnitConverter_2, RulerUtilities_5, Controls_Interfaces_7, GraphTimeAxis_1, GridLineRenderer_1, JsonTimespan_11, MultiSeriesGraph_1, Scale_1, SelectionOverlay_1, SummaryDataSeries_1, SwimlaneBase_1, TimeFilterOverlay_1, ViewEventManager_3, MainViewModel_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SummaryViewModel = void 0;
    class SummaryViewModel {
        constructor(reportSummary) {
            this._navigator = MainViewModel_10.getMainViewNavigator();
            this._dao = new SummaryDAO_1.SummaryDAO();
            this._hotPath = ko.observableArray([]);
            this._functionsList = ko.observableArray([]);
            this._haveFilter = ko.observable(false);
            this._isJmcEnabled = ko.observable(true);
            this._haveViewGuidance = ko.observable(false);
            this._haveMarks = ko.observable(false);
            this._reportMetricTotal = ko.observable(0);
            this._resourcesList = ko.observableArray([]);
            this._threadsList = ko.observableArray([]);
            this._typesMemoryList = ko.observableArray([]);
            this._typesInstancesList = ko.observableArray([]);
            this._summaryGraph = ko.observable(null);
            this._graphConfig = {
                height: 180,
                loadCss: () => { },
                jsonConfig: {},
                scale: {},
                timeRange: new JsonTimespan_11.JsonTimespan(JsonTimespan_11.BigNumber.zero, JsonTimespan_11.BigNumber.zero),
                legend: [],
                unit: ""
            };
            this._graphTitleConfig = {
                isBodyExpanded: true
            };
            this._graphConfig.timeRange = reportSummary.totalTime;
            this._showGraph = reportSummary.additionalReportData.indexOf(ReportDAO_2.AdditionalReportData.Counters) !== -1;
            this._hasLifetimeData = reportSummary.additionalReportData.indexOf(ReportDAO_2.AdditionalReportData.ObjectLifetime) !== -1;
            this._dao.isJmcEnabled().then((isJmcEnabled) => this._isJmcEnabled(isJmcEnabled));
            this._dao.haveViewGuidance().then((haveViewGuidance) => this._haveViewGuidance(haveViewGuidance));
            this._dao.haveMarks().then((haveMarks) => this._haveMarks(haveMarks));
            if (this._showGraph) {
                this.createSummaryGraph(reportSummary.isSerialized);
            }
            this.loadData();
            this.queryForInfoBar();
        }
        get reportMetricTotal() {
            return this._reportMetricTotal;
        }
        get showGraph() {
            return this._showGraph;
        }
        get haveFilter() {
            return this._haveFilter;
        }
        get isJmcEnabled() {
            return this._isJmcEnabled;
        }
        get haveViewGuidance() {
            return this._haveViewGuidance;
        }
        get haveMarks() {
            return this._haveMarks;
        }
        get hotPath() {
            return this._hotPath;
        }
        get functionsList() {
            return this._functionsList;
        }
        get resourcesList() {
            return this._resourcesList;
        }
        get threadsList() {
            return this._threadsList;
        }
        get typesMemoryList() {
            return this._typesMemoryList;
        }
        get typesInstancesList() {
            return this._typesInstancesList;
        }
        get summaryGraph() {
            return this._summaryGraph;
        }
        dispose() {
            ViewEventManager_3.getViewEventManager().selectionChanged.removeEventListener(this._viewportChangedBoundFunction);
            window.removeEventListener("resize", this._onResizeBoundFunction);
            var graph = this._summaryGraph();
            if (graph) {
                graph.dispose();
            }
        }
        contextMenu(viewModel, event) {
            if (!viewModel.name) {
                return;
            }
            var config = [];
            if (viewModel.context && viewModel.context.ctype === MainViewModel_10.ContextType.Function) {
                config.push({
                    label: plugin.Resources.getString("ContextMenu_ViewSource"),
                    disabled: () => !viewModel.rsf,
                    callback: () => this._dao.viewSource(viewModel.rsf, typeof viewModel.functionLineNumber === "number" ? viewModel.functionLineNumber : 1),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    type: plugin.ContextMenu.MenuItemType.separator
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowInModulesView"),
                    callback: () => this._navigator.navigateToView(MainViewModel_10.MainViews.Modules, viewModel.context),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowInFunctionsView"),
                    callback: () => this._navigator.navigateToView(MainViewModel_10.MainViews.Functions, viewModel.context),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowFunctionDetails"),
                    callback: () => this._navigator.navigateToView(MainViewModel_10.MainViews.FunctionDetails, viewModel.context),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowCallingFunctions", viewModel.name),
                    callback: () => this._navigator.navigateToView(MainViewModel_10.MainViews.CallerCallee, viewModel.context),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowCalledFunctions", viewModel.name),
                    callback: () => this._navigator.navigateToView(MainViewModel_10.MainViews.CallerCallee, viewModel.context),
                    type: plugin.ContextMenu.MenuItemType.command
                });
            }
            else if (viewModel.context && viewModel.context.ctype === MainViewModel_10.ContextType.Thread) {
                config.push({
                    label: plugin.Resources.getString("ContextMenu_ShowInProcessesView"),
                    callback: () => this._navigator.navigateToView(MainViewModel_10.MainViews.Processes, viewModel.context),
                    type: plugin.ContextMenu.MenuItemType.command
                }, {
                    label: plugin.Resources.getString("ContextMenu_ShowInThreadDetailsView"),
                    callback: () => this._navigator.navigateToView(MainViewModel_10.MainViews.ThreadDetails, viewModel.context),
                    type: plugin.ContextMenu.MenuItemType.command
                });
            }
            if (config.length !== 0) {
                config.push({
                    type: plugin.ContextMenu.MenuItemType.separator
                });
            }
            config.push({
                label: plugin.Resources.getString("ContextMenu_Copy"),
                callback: () => this.onCopy(viewModel),
                type: plugin.ContextMenu.MenuItemType.command
            });
            return plugin.ContextMenu.create(config);
        }
        onSelectionChanged(selectionArgs) {
            this._currentSelection = selectionArgs.position;
            if (!this._summaryGraph()) {
                return;
            }
            this._summaryGraph().onViewportChanged({
                currentTimespan: this._graphConfig.timeRange,
                selectionTimespan: selectionArgs.position,
                isIntermittent: selectionArgs.isIntermittent
            });
        }
        onHotPathItemClicked(viewModel, event) {
            this._navigator.navigateToView(MainViewModel_10.MainViews.FunctionDetails, viewModel.context);
        }
        onFunctionClicked(viewModel, event) {
            this._navigator.navigateToView(MainViewModel_10.MainViews.FunctionDetails, viewModel.context);
        }
        onResourceClicked(viewModel, event) {
            this._navigator.navigateToView(MainViewModel_10.MainViews.ResourceDetails, viewModel.context);
        }
        onThreadClicked(viewModel, event) {
            this._navigator.navigateToView(MainViewModel_10.MainViews.ThreadDetails, viewModel.context);
        }
        onNavigateToCallTree(viewModel, event) {
            this._navigator.navigateToView(MainViewModel_10.MainViews.CallTree);
        }
        onNavigateToFunctions(viewModel, event) {
            this._navigator.navigateToView(MainViewModel_10.MainViews.Functions);
        }
        toggleJmc(viewModel, event) {
            this._isJmcEnabled(!this._isJmcEnabled());
            this._dao.toggleJmc()
                .then(() => this.loadData())
                .then(() => this._navigator.resetNavigationStack());
        }
        onSetTimeFilter() {
            this._dao.setTimeFilter(this._currentSelection)
                .then(() => this.loadData())
                .then(() => {
                this._timeFilterOverlay.updateTimespan(this._currentSelection);
                this._timeSelectionOverlay.removeSelection();
                this._haveFilter(true);
                if (this._summaryGraph()) {
                    this.updateGraphLabel(this._currentSelection);
                    this._summaryGraph().setTimeFilter(this._currentSelection);
                }
                this._currentSelection = null;
                this.queryForInfoBar();
            });
        }
        onClearFilter(viewModel, event) {
            viewModel._dao.setTimeFilter(null)
                .then(() => this.loadData())
                .then(() => {
                this._timeFilterOverlay.updateTimespan(null);
                this._haveFilter(false);
                if (this._summaryGraph()) {
                    this.updateGraphLabel(null);
                    this._summaryGraph().setTimeFilter(null);
                }
                this._currentSelection = null;
                this.queryForInfoBar();
            });
        }
        onViewGuidance(viewModel, event) {
            this._dao.showGuidance();
        }
        onShowMarks(viewModel, event) {
            this._navigator.navigateToView(MainViewModel_10.MainViews.Marks);
        }
        onShowTrimmedCallTree(viewModel, event) {
            CallTreeDAO_2.CallTreeDAO.create()
                .then((dao) => dao.trimCallTree())
                .then(() => this._navigator.navigateToView(MainViewModel_10.MainViews.CallTree));
        }
        onCompareReports(viewModel, event) {
            this._dao.compareReports();
        }
        onExportReportData(viewModel, event) {
            (new ReportDAO_2.ReportDAO()).exportReport();
        }
        onSaveAnalyzedReport(viewModel, event) {
            this._dao.saveAnalyzedReport();
        }
        onToggleFullscreen(viewModel, event) {
            this._dao.toggleFullscreen();
        }
        onSetSymbolPath(viewModel, event) {
            this._dao.showSymbolsOptions();
        }
        onCopy(viewModel) {
            var header;
            var data;
            if (viewModel.isHotItem !== undefined) {
                header =
                    [
                        plugin.Resources.getString("SummaryView_HotPathNameHeader"),
                        plugin.Resources.getString("SummaryView_HotPathElapsedInclusivePercentHeader"),
                        plugin.Resources.getString("SummaryView_HotPathElapsedExclusivePercentHeader")
                    ];
                data =
                    [
                        viewModel.name,
                        viewModel.inclusivePercent,
                        viewModel.exclusivePercent
                    ];
            }
            else if (viewModel.percent !== undefined) {
                header =
                    [
                        plugin.Resources.getString("SummaryView_NameHeader"),
                        plugin.Resources.getString("SummaryView_FunctionsExclusiveTimePercentHeader")
                    ];
                data =
                    [
                        viewModel.name,
                        viewModel.percent
                    ];
            }
            else {
                return;
            }
            void navigator.clipboard.writeText(header.join("\t") + "\n" + data.join("\t"));
        }
        loadData() {
            this._dao.getMetricTotal().then((metricTotal) => this._reportMetricTotal(metricTotal));
            this._dao.getFunctionsListData().then((dto) => this._functionsList(dto));
            this._dao.getHotPathData().then((hotPathDto) => this._hotPath(hotPathDto));
        }
        createSummaryGraph(isSerialized) {
            var seriesTitle;
            var seriesTooltip;
            var graphAriaLabel;
            this._graphConfig.scale = {
                isFixed: true,
                minimum: 0,
                maximum: 100,
                axes: [{ value: 0 }, { value: 20 }, { value: 40 }, { value: 60 }, { value: 80 }, { value: 100 }]
            };
            this._graphTitleConfig.titleText = plugin.Resources.getString("SummaryView_CpuGraphTitle");
            this._graphTitleConfig.unit = plugin.Resources.getString("SummaryView_CpuGraphUnit");
            this._graphTitleConfig.description = plugin.Resources.getString("SummaryView_CpuGraphTitle");
            seriesTitle = plugin.Resources.getString("SummaryView_CpuSeriesTitle");
            seriesTooltip = plugin.Resources.getString("SummaryView_CpuSeriesTooltip");
            this._dao.timeFilter().then((timeFilter) => {
                this._haveFilter(timeFilter !== null);
                var unitConverter = new LocalizedUnitConverter_2.LocalizedUnitConverter();
                var dataSeries = new SummaryDataSeries_1.SummaryDataSeries(this._graphConfig.timeRange, seriesTitle, seriesTooltip, unitConverter, this._dao);
                this._graph = new MultiSeriesGraph_1.MultiSeriesGraph(this._graphConfig, [dataSeries]);
                this.updateGraphLabel(timeFilter);
                var summaryGraphBase = new SwimlaneBase_1.SwimlaneBase(this._graphTitleConfig, this._graphConfig.height, this._graphConfig.timeRange, timeFilter);
                if (!isSerialized) {
                    this._timeFilterOverlay = new TimeFilterOverlay_1.TimeFilterOverlay(this._graph, this._graphConfig.timeRange, timeFilter);
                    this._timeSelectionOverlay = new SelectionOverlay_1.SelectionOverlay(this._timeFilterOverlay, this._graphConfig.timeRange, null);
                    summaryGraphBase.addMainRegionControl(this._timeSelectionOverlay);
                }
                else {
                    summaryGraphBase.addMainRegionControl(this._graph);
                }
                summaryGraphBase.addMainRegionControl(new GraphTimeAxis_1.GraphTimeAxis(this._graphConfig.timeRange));
                var gridLineControl = new GridLineRenderer_1.GridLineRenderer(this._graphConfig.timeRange, 6);
                summaryGraphBase.addMainRegionControl(gridLineControl);
                var dataScale = new Scale_1.Scale(this._graphConfig.scale, Controls_Interfaces_7.ScaleType.Left, unitConverter, gridLineControl);
                this._graph.scaleChangedEvent.addEventListener(dataScale.onScaleChanged.bind(dataScale));
                summaryGraphBase.addLeftRegionControl(dataScale);
                this._viewportChangedBoundFunction = this.onSelectionChanged.bind(this);
                this._onResizeBoundFunction = EventThrottler_3.eventThrottler((evt) => summaryGraphBase.resize(evt), Constants_8.Constants.WindowResizeThrottle);
                if (!isSerialized) {
                    var graphContextMenu = plugin.ContextMenu.create([{
                            label: plugin.Resources.getString("SummaryView_ContextMenuFilterBySelection"),
                            disabled: () => !this._currentSelection,
                            callback: this.onSetTimeFilter.bind(this),
                            type: plugin.ContextMenu.MenuItemType.command,
                            iconEnabled: "filter",
                            iconDisabled: "filter"
                        }]);
                    summaryGraphBase.container.addEventListener("contextmenu", (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        graphContextMenu.show(event.clientX, event.clientY);
                    });
                    ko.utils.domNodeDisposal.addDisposeCallback(summaryGraphBase.container, () => graphContextMenu.dispose());
                }
                this._summaryGraph(summaryGraphBase);
                ViewEventManager_3.getViewEventManager().selectionChanged.addEventListener(this._viewportChangedBoundFunction);
                window.addEventListener("resize", this._onResizeBoundFunction);
            });
        }
        updateGraphLabel(timeFilter) {
            var graphAriaLabel = plugin.Resources.getString("SummaryView_CpuGraphAriaLabel");
            if (timeFilter) {
                graphAriaLabel += "\n" + plugin.Resources.getString("SummaryView_CpuGraphTimeFilter", RulerUtilities_5.RulerUtilities.formatTime(timeFilter.begin), RulerUtilities_5.RulerUtilities.formatTime(timeFilter.end));
            }
            this._graph.container.setAttribute("aria-label", graphAriaLabel);
        }
        queryForInfoBar() {
            var dataQueryPromise = this._dao.containsData();
            var jmcQueryPromise = this._dao.isJmcEnabled();
            return Promise.all([dataQueryPromise, jmcQueryPromise]).then((results) => {
                if (results.length != 2) {
                    return;
                }
                var containsData = results[0];
                var jmcEnabled = results[1];
                var infoBarProvider = MainViewModel_10.getInfoBarProvider();
                infoBarProvider.clearInfoBars();
                if (!containsData) {
                    if (jmcEnabled) {
                        var infoBar = new InformationBarControl_2.InformationBarControl("SummaryView_NoDataJmcMessage", () => infoBarProvider.removeInfoBar("SummaryView_NoDataJmcMessage"), "SummaryView_ShowAllCodeButtonLabel", () => this.toggleJmc(this, null));
                        infoBarProvider.showInfoBar(infoBar);
                    }
                    if (this._haveFilter()) {
                        var infoBar = new InformationBarControl_2.InformationBarControl("SummaryView_NoDataTimeFilterMessage", () => infoBarProvider.removeInfoBar("SummaryView_NoDataTimeFilterMessage"), "SummaryView_ClearFilterButtonLabel", () => this.onClearFilter(this, null));
                        infoBarProvider.showInfoBar(infoBar);
                    }
                }
            });
        }
    }
    exports.SummaryViewModel = SummaryViewModel;
});
define("CustomBindings/CircularFocus", ["require", "exports", "Misc/KeyCodes"], function (require, exports, KeyCodes_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["circularFocus"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var bindingValue = valueAccessor();
            var selector = bindingValue.selector;
            var isVertical = bindingValue.vertical;
            var arrowKeyNext = bindingValue.vertical ?
                KeyCodes_19.KeyCodes.ArrowDown :
                KeyCodes_19.KeyCodes.ArrowRight;
            var arrowKeyPrevious = bindingValue.vertical ?
                KeyCodes_19.KeyCodes.ArrowUp :
                KeyCodes_19.KeyCodes.ArrowLeft;
            element.addEventListener("keydown", (e) => {
                if (e.keyCode !== arrowKeyPrevious && e.keyCode !== arrowKeyNext) {
                    return;
                }
                var elements = element.querySelectorAll(selector);
                if (elements.length === 0) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                var isDisabled = (element) => element.disabled;
                var isHidden = (element) => element.offsetHeight === 0;
                var start = e.keyCode === arrowKeyNext ? 0 : elements.length - 1;
                var end = e.keyCode === arrowKeyNext ? elements.length - 1 : 0;
                var increment = e.keyCode === arrowKeyNext ? 1 : -1;
                for (var i = 0; i < elements.length; ++i) {
                    if (elements[i] !== document.activeElement) {
                        continue;
                    }
                    for (var next = 1; next < elements.length; ++next) {
                        var nextIndex = (i + (next * increment) + elements.length) % elements.length;
                        var maybeFocusable = elements[nextIndex];
                        if (!isHidden(maybeFocusable) && !isDisabled(maybeFocusable)) {
                            maybeFocusable.focus();
                            return;
                        }
                    }
                    return;
                }
                for (var i = 0; i < elements.length; ++i) {
                    var index = (i * increment) + start;
                    var maybeFocusable = elements[index];
                    if (!isHidden(maybeFocusable) && !isDisabled(maybeFocusable)) {
                        maybeFocusable.focus();
                        return;
                    }
                }
            });
        }
    };
});
define("CustomBindings/DynamicContextMenu", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _dynamicContextMenu;
    ko.bindingHandlers["dynamicContextMenu"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var factoryFunction = valueAccessor();
            var domElement = element;
            domElement.addEventListener("contextmenu", (event) => {
                var context = ko.contextFor(event.target);
                if (!context && context.$data) {
                    return;
                }
                if (_dynamicContextMenu) {
                    _dynamicContextMenu.dispose();
                }
                _dynamicContextMenu = factoryFunction.call(viewModel, context.$data, event);
                if (_dynamicContextMenu) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.pointerType === "mouse") {
                        _dynamicContextMenu.show(event.clientX, event.clientY);
                    }
                    else {
                        var target = event.target;
                        var rect = target.getBoundingClientRect();
                        _dynamicContextMenu.show(rect.left, rect.top + rect.height);
                    }
                }
            });
        }
    };
});
define("CustomBindings/FormatInteger", ["require", "exports", "Misc/CpuSamplingUtilities"], function (require, exports, CpuSamplingUtilities_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["formatInteger"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { controlsDescendantBindings: true };
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.unwrap(valueAccessor());
            ko.utils.setHtml(element, CpuSamplingUtilities_4.CpuSamplingUtilities.localizeNumber(value));
        }
    };
});
define("CustomBindings/FormatPercent", ["require", "exports", "Misc/CpuSamplingUtilities"], function (require, exports, CpuSamplingUtilities_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["formatPercent"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { controlsDescendantBindings: true };
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.unwrap(valueAccessor());
            ko.utils.setHtml(element, CpuSamplingUtilities_5.CpuSamplingUtilities.localizeNumber(value, { style: 'percent', minimumFractionDigits: 2 }));
        }
    };
});
define("CustomBindings/FormatTime", ["require", "exports", "DAO/ReportDAO", "Misc/CpuSamplingUtilities"], function (require, exports, ReportDAO_3, CpuSamplingUtilities_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["formatTime"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { controlsDescendantBindings: true };
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var format = valueAccessor();
            var value = ko.unwrap(format.value);
            if (value === null) {
                return;
            }
            var timeType = ko.unwrap(format.timeType);
            var valueText;
            if (timeType === ReportDAO_3.TimeType.Milliseconds) {
                valueText = CpuSamplingUtilities_6.CpuSamplingUtilities.localizeNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            else {
                valueText = CpuSamplingUtilities_6.CpuSamplingUtilities.localizeNumber(value);
            }
            ko.utils.setHtml(element, valueText);
        }
    };
});
define("CustomBindings/LocalizedAriaLabel", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["localizedAriaLabel"] = {
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var keyWithArgs = valueAccessor();
            if (!Array.isArray(keyWithArgs)) {
                keyWithArgs = [keyWithArgs];
            }
            var unwrappedArgs = keyWithArgs.map((value) => ko.unwrap(value));
            var localizedText = plugin.Resources.getString.apply(null, unwrappedArgs);
            element.setAttribute("aria-label", localizedText);
        }
    };
});
define("CustomBindings/LocalizedPlaceholderText", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["localizedPlaceholderText"] = {
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var keyWithArgs = valueAccessor();
            if (!Array.isArray(keyWithArgs)) {
                keyWithArgs = [keyWithArgs];
            }
            var unwrappedArgs = keyWithArgs.map((value) => ko.unwrap(value));
            var localizedText = plugin.Resources.getString.apply(null, unwrappedArgs);
            element.setAttribute("placeholder", localizedText);
        }
    };
});
define("CustomBindings/LocalizedText", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["localizedText"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { controlsDescendantBindings: true };
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var keyWithArgs = valueAccessor();
            if (!Array.isArray(keyWithArgs)) {
                keyWithArgs = [keyWithArgs];
            }
            var unwrappedArgs = keyWithArgs.map((value) => ko.unwrap(value));
            var localizedText = plugin.Resources.getString.apply(null, unwrappedArgs);
            ko.utils.setHtml(element, localizedText);
        }
    };
});
define("CustomBindings/LocalizedTooltip", ["require", "exports", "plugin-vs-v2", "Misc/Constants"], function (require, exports, plugin, Constants_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["localizedTooltip"] = {
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var keyWithArgs = valueAccessor();
            if (!Array.isArray(keyWithArgs)) {
                keyWithArgs = [keyWithArgs];
            }
            var unwrappedArgs = keyWithArgs.map((value) => ko.unwrap(value));
            element.setAttribute("data-plugin-vs-tooltip", JSON.stringify({
                content: plugin.Resources.getString.apply(null, unwrappedArgs),
                delay: Constants_9.Constants.TooltipTimeoutMs
            }));
        }
    };
});
define("CustomBindings/OnEnter", ["require", "exports", "Misc/KeyCodes"], function (require, exports, KeyCodes_20) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["onEnter"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            element.addEventListener("keydown", (e) => {
                if (KeyCodes_20.KeyCodes.Enter !== e.keyCode) {
                    return;
                }
                var eventHandler = valueAccessor();
                var allowPropagation = eventHandler.apply(viewModel, [viewModel, e]);
                if (!allowPropagation) {
                    e.preventDefault();
                }
            });
        }
    };
});
define("CustomBindings/SvgImage", ["require", "exports", "plugin-vs-v2", "Misc/Utilities"], function (require, exports, plugin, Utilities_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["svgImage"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { controlsDescendantBindings: true };
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var svgKey = ko.unwrap(valueAccessor());
            if (!svgKey) {
                return;
            }
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            element.appendChild(Utilities_13.Utilities.getSVGPlaceHolder(svgKey));
            plugin.Theme.processInjectedSvg(element);
            element.setAttribute("role", "img");
        }
    };
});
define("CustomBindings/Tooltip", ["require", "exports", "Misc/Constants"], function (require, exports, Constants_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["tooltip"] = {
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var tooltipText = valueAccessor();
            if (!tooltipText) {
                element.removeAttribute("data-plugin-vs-tooltip");
            }
            else {
                element.setAttribute("data-plugin-vs-tooltip", JSON.stringify({
                    content: tooltipText,
                    delay: Constants_10.Constants.TooltipTimeoutMs
                }));
            }
        }
    };
});
define("CustomBindings/iControl", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ko.bindingHandlers["iControl"] = {
        init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { controlsDescendantBindings: true };
        },
        update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.virtualElements.emptyNode(element);
            var control = ko.unwrap(valueAccessor());
            if (!control) {
                return;
            }
            ko.virtualElements.insertAfter(element, control.container, null);
            if (control.resize) {
                control.resize(null);
            }
        }
    };
    ko.virtualElements.allowedBindings["iControl"] = true;
});
define("ViewModels/MainViewModel", ["require", "exports", "plugin-vs-v2", "knockout", "DAO/ReportDAO", "PluginComponentLoader", "ErrorReporting", "KnockoutDeferredTaskScheduler", "ViewModels/CallerCalleeViewModel", "ViewModels/ProcessesViewModel", "ViewModels/ModulesViewModel", "ViewModels/FunctionDetailsViewModel", "ViewModels/CallTreeViewModel", "ViewModels/FunctionsViewModel", "ViewModels/MarksViewModel", "ViewModels/TierInteractionsViewModel", "ViewModels/SummaryViewModel", "globals", "template!Loading", "CustomBindings/CircularFocus", "CustomBindings/DynamicContextMenu", "CustomBindings/FormatInteger", "CustomBindings/FormatPercent", "CustomBindings/FormatTime", "CustomBindings/LocalizedAriaLabel", "CustomBindings/LocalizedPlaceholderText", "CustomBindings/LocalizedText", "CustomBindings/LocalizedTooltip", "CustomBindings/OnEnter", "CustomBindings/SvgImage", "CustomBindings/Tooltip", "CustomBindings/iControl"], function (require, exports, plugin, ko, ReportDAO_4, PluginComponentLoader_1, ErrorReporting_1, KnockoutDeferredTaskScheduler_1, CallerCalleeViewModel_1, ProcessesViewModel_1, ModulesViewModel_1, FunctionDetailsViewModel_1, CallTreeViewModel_1, FunctionsViewModel_1, MarksViewModel_1, TierInteractionsViewModel_1, SummaryViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTimeDisplay = exports.getInfoBarProvider = exports.getMainViewNavigator = exports.MainViewModel = exports.ContextType = exports.MainViews = void 0;
    class MainViews {
        static get Summary() { return "Summary"; }
        static get FunctionDetails() { return "FunctionDetails"; }
        static get Functions() { return "Functions"; }
        static get CallTree() { return "CallTree"; }
        static get Modules() { return "Modules"; }
        static get Marks() { return "Marks"; }
        static get Processes() { return "Processes"; }
        static get TierInteractions() { return "TierInteractions"; }
        static get CallerCallee() { return "CallerCallee"; }
        static get ResourceDetails() { return "ResourceDetails"; }
        static get ThreadDetails() { return "ThreadDetails"; }
    }
    exports.MainViews = MainViews;
    var ContextType;
    (function (ContextType) {
        ContextType[ContextType["Function"] = 0] = "Function";
        ContextType[ContextType["Line"] = 1] = "Line";
        ContextType[ContextType["Ip"] = 2] = "Ip";
        ContextType[ContextType["Module"] = 3] = "Module";
        ContextType[ContextType["Thread"] = 4] = "Thread";
        ContextType[ContextType["Type"] = 5] = "Type";
        ContextType[ContextType["Resource"] = 6] = "Resource";
    })(ContextType = exports.ContextType || (exports.ContextType = {}));
    class MainViewModel {
        constructor(reportSummary) {
            this._navigationStack = [];
            this._currentStackIndex = ko.observable(0);
            this._infoBars = ko.observableArray([]);
            this._subscriptions = [];
            this._additionalToolbarItems = ko.observableArray([]);
            this._dao = new ReportDAO_4.ReportDAO();
            this._isSerialized = ko.observable(false);
            this._displayTimeType = reportSummary.displayTimeType;
            this._isSerialized(reportSummary.isSerialized);
            this._availableViews = ko.observableArray([
                { localizedName: plugin.Resources.getString("SummaryViewName"), component: MainViews.Summary },
                { localizedName: plugin.Resources.getString("CallTreeViewName"), component: MainViews.CallTree },
                { localizedName: plugin.Resources.getString("ModulesViewName"), component: MainViews.Modules },
                { localizedName: plugin.Resources.getString("CallerCalleeViewName"), component: MainViews.CallerCallee },
                { localizedName: plugin.Resources.getString("FunctionsViewName"), component: MainViews.Functions }
            ]);
            if (reportSummary.additionalReportData.indexOf(ReportDAO_4.AdditionalReportData.TierInteractions) !== -1) {
                this._availableViews.push({ localizedName: plugin.Resources.getString("TierInteractionsViewName"), component: MainViews.TierInteractions });
            }
            this._availableViews.push({ localizedName: plugin.Resources.getString("MarksViewName"), component: MainViews.Marks });
            this._availableViews.push({ localizedName: plugin.Resources.getString("ProcessesViewName"), component: MainViews.Processes });
            this._availableViews.push({ localizedName: plugin.Resources.getString("FunctionDetailsViewName"), component: MainViews.FunctionDetails });
            this._currentView = ko.computed({
                read: () => this._navigationStack[this._currentStackIndex()],
                write: (value) => {
                    var convertedValue = typeof value === "string" ?
                        { name: value } : value;
                    if (this._currentStackIndex() !== this._navigationStack.length - 1) {
                        this._navigationStack.splice(this._currentStackIndex() + 1);
                    }
                    if (this._navigationStack.length === 512) {
                        this._navigationStack.shift();
                        this._currentStackIndex(this._currentStackIndex() - 1);
                    }
                    this._navigationStack.push(convertedValue);
                    this._currentStackIndex(this._currentStackIndex() + 1);
                    if (this._navigationStack.length === 1 ||
                        (this._navigationStack[this._navigationStack.length - 2].name !== convertedValue.name)) {
                        this._dao.viewActivated(convertedValue.name);
                    }
                }
            });
            this._currentViewName = ko.pureComputed({
                read: () => this._currentView().name,
                write: (value) => this._currentView({ name: value })
            });
            this._canNavigateBackward = ko.pureComputed(() => this._currentStackIndex() > 0);
            this._canNavigateForward = ko.pureComputed(() => this._currentStackIndex() < (this._navigationStack.length - 1));
            this.resetNavigationStack();
            this._subscriptions.push(this._currentView.subscribe(() => this._additionalToolbarItems([]), null, "beforeChange"));
            this._subscriptions.push(this._currentView.subscribe((currentView) => {
                this._dao.showSourceBrowser(currentView.name === MainViews.FunctionDetails);
                this.clearInfoBars();
            }));
        }
        get displayTimeType() {
            return this._displayTimeType;
        }
        get isSerialized() {
            return this._isSerialized;
        }
        get availableViews() {
            return this._availableViews;
        }
        get currentViewName() {
            return this._currentViewName;
        }
        get currentView() {
            return this._currentView;
        }
        get canNavigateBackward() {
            return this._canNavigateBackward;
        }
        get canNavigateForward() {
            return this._canNavigateForward;
        }
        get toolbarItems() {
            return this._additionalToolbarItems;
        }
        get infoBars() {
            return this._infoBars;
        }
        clearInfoBars() {
            this._infoBars([]);
        }
        removeInfoBar(messageToken) {
            this._infoBars.remove((infoBar) => messageToken === infoBar.messageToken);
        }
        showInfoBar(infoBar) {
            this._infoBars.push(infoBar);
        }
        navigateToView(componentName, componentParams) {
            var avaiableViews = this._availableViews();
            for (var index = 0; index < avaiableViews.length; ++index) {
                if (avaiableViews[index].component === componentName) {
                    this._currentView({ name: componentName, params: componentParams });
                    return;
                }
            }
            throw new Error("Unknown view: " + componentName);
        }
        resetNavigationStack() {
            this._navigationStack = [];
            this._currentStackIndex(-1);
            this._currentViewName(MainViews.Summary);
        }
        onNavigateBackward(viewModel, event) {
            if (this.canNavigateBackward()) {
                this._currentStackIndex(this._currentStackIndex() - 1);
            }
        }
        onNavigateForward(viewModel, event) {
            if (this.canNavigateForward()) {
                this._currentStackIndex(this._currentStackIndex() + 1);
            }
        }
        onSaveReport(viewModel, event) {
            this._dao.saveReport();
        }
        onExportReport(viewModel, event) {
            this._dao.exportReport();
        }
        dispose() {
            this._subscriptions.forEach(subscription => subscription.dispose());
        }
    }
    exports.MainViewModel = MainViewModel;
    function getMainViewNavigator() {
        return _mainViewModel;
    }
    exports.getMainViewNavigator = getMainViewNavigator;
    function getInfoBarProvider() {
        return _mainViewModel;
    }
    exports.getInfoBarProvider = getInfoBarProvider;
    function getTimeDisplay() {
        return _mainViewModel.displayTimeType;
    }
    exports.getTimeDisplay = getTimeDisplay;
    var _mainViewModel;
    (function () {
        ErrorReporting_1.InitializeErrorReporting();
        KnockoutDeferredTaskScheduler_1.EnableScriptedSandboxDeferredTaskScheduler();
        PluginComponentLoader_1.registerPluginComponentLoader();
        var dao = new ReportDAO_4.ReportDAO();
        dao.getReportSummary()
            .then((reportSummary) => {
            _mainViewModel = new MainViewModel(reportSummary);
            ko.components.register(MainViews.Summary, {
                template: "SummaryView",
                viewModel: function () { return new SummaryViewModel_1.SummaryViewModel(reportSummary); }
            });
            ko.components.register(MainViews.Functions, {
                viewModel: function (context) { return new FunctionsViewModel_1.FunctionsViewModel(_mainViewModel.toolbarItems, context); },
                template: "FunctionsView"
            });
            ko.components.register(MainViews.CallTree, {
                viewModel: function () { return new CallTreeViewModel_1.CallTreeViewModel(_mainViewModel.toolbarItems); },
                template: "CallTreeView"
            });
            ko.components.register(MainViews.FunctionDetails, {
                viewModel: function (context) { return new FunctionDetailsViewModel_1.FunctionDetailsViewModel(context); },
                template: "FunctionDetailsView"
            });
            ko.components.register(MainViews.Modules, {
                viewModel: function (context) { return new ModulesViewModel_1.ModulesViewModel(_mainViewModel.toolbarItems, context); },
                template: "ModulesView"
            });
            ko.components.register(MainViews.Marks, {
                viewModel: function () { return new MarksViewModel_1.MarksViewModel(_mainViewModel.toolbarItems); },
                template: "MarksView"
            });
            ko.components.register(MainViews.Processes, {
                viewModel: function (context) { return new ProcessesViewModel_1.ProcessesViewModel(_mainViewModel.toolbarItems, context); },
                template: "ProcessesView"
            });
            ko.components.register(MainViews.CallerCallee, {
                viewModel: function (context) { return new CallerCalleeViewModel_1.CallerCalleeViewModel(context); },
                template: "CallerCalleeView"
            });
            var includeTierInteractions = reportSummary.additionalReportData.indexOf(ReportDAO_4.AdditionalReportData.TierInteractions) !== -1;
            if (includeTierInteractions) {
                ko.components.register(MainViews.TierInteractions, {
                    viewModel: function () { return new TierInteractionsViewModel_1.TierInteractionsViewModel(); },
                    template: "TierInteractionsView"
                });
            }
        }).then(() => {
            ko.applyBindings(_mainViewModel);
        });
    })();
});
ko.bindingHandlers["ariaExpanded"] = {
    update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = ko.unwrap(valueAccessor());
        if (typeof value === "boolean") {
            element.setAttribute("aria-expanded", value);
            return;
        }
        if (ko.unwrap(value.expandable)) {
            element.setAttribute("aria-expanded", ko.unwrap(value.expanded));
        }
        else {
            element.removeAttribute("aria-expanded");
        }
    }
};
ko.bindingHandlers["documentFragment"] = {
    update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        var value = ko.unwrap(valueAccessor());
        element.appendChild(value);
    }
};
ko.bindingHandlers["focus"] = {
    previousElement: null,
    init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var onFocus = () => {
            if (ko.bindingHandlers["focus"].previousElement && ko.bindingHandlers["focus"].previousElement !== element) {
                var e = document.createEvent("Event");
                e.initEvent("blur", false, false);
                ko.bindingHandlers["focus"].previousElement.dispatchEvent(e);
            }
            var hasFocusObservable = valueAccessor();
            if (ko.isWriteableObservable(hasFocusObservable) && !hasFocusObservable()) {
                hasFocusObservable(true);
            }
            ko.bindingHandlers["focus"].previousElement = element;
        };
        var onBlur = () => {
            var hasFocusObservable = valueAccessor();
            if (ko.isWriteableObservable(hasFocusObservable) && !!hasFocusObservable()) {
                hasFocusObservable(false);
            }
        };
        element.addEventListener("focus", onFocus);
        element.addEventListener("blur", onBlur);
    },
    update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (!ko.unwrap(valueAccessor())) {
            element.blur();
        }
        else {
            element.focus();
        }
    }
};
ko.bindingHandlers["multiClick"] = {
    init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var events = valueAccessor();
        var doubleClickTimeMs = 500;
        var doubleClickTimer = null;
        var clickHandler = (event) => {
            if (doubleClickTimer !== null) {
                clearTimeout(doubleClickTimer);
                doubleClickTimer = null;
                events.dblclick.apply(viewModel, [viewModel, event]);
            }
            else {
                events.click.apply(viewModel, [viewModel, event]);
                doubleClickTimer = setTimeout(() => {
                    doubleClickTimer = null;
                }, doubleClickTimeMs);
            }
            event.preventDefault();
        };
        element.addEventListener("click", clickHandler, false);
    }
};
ko.bindingHandlers["reorderHeaderColumns"] = {
    after: ['foreach'],
    update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var columnOrder = ko.unwrap(valueAccessor());
        var row = element;
        var columns = element.querySelectorAll("th");
        for (var i = 0; i < columns.length; ++i) {
            if (columns[i].getAttribute("data-columnid") !== columnOrder[i]) {
                var col = row.querySelector("th[data-columnid='" + columnOrder[i] + "']");
                var isFocused = col === document.activeElement;
                row.insertBefore(col, columns[i]);
                if (isFocused) {
                    col.focus();
                }
            }
            columns = row.querySelectorAll("th");
        }
    }
};
ko.bindingHandlers["rowIndent"] = {
    init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        element.style.display = "inline-block";
        element.style.textOverflow = "ellipsis";
        element.style.width = "calc(100% - 1em)";
        return { controlsDescendantBindings: true };
    },
    update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var indent = ko.unwrap(valueAccessor());
        element.style.maxWidth = indent + "em";
    }
};
ko.bindingHandlers["rowIndentButton"] = {
    init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    },
    update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var indent = ko.unwrap(valueAccessor());
        element.style.maxWidth = `calc(100% - ${indent}em)`;
    }
};
ko.bindingHandlers["treeGridExpander"] = {
    init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        element.className = "treeGridRow-expander";
        return { controlsDescendantBindings: true };
    },
    update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var expandable = valueAccessor();
        if (expandable === null) {
            element.style.visibility = 'hidden';
        }
        var expanded = ko.unwrap(expandable);
        if (expanded) {
            element.classList.add("expanded");
        }
        else {
            element.classList.remove("expanded");
        }
    }
};
ko.virtualElements.allowedBindings["treeGridExpander"] = false;
ko.bindingHandlers["treeGridRowFocus"] = {
    previousElement: null,
    init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var onFocus = () => {
            if (ko.bindingHandlers["treeGridRowFocus"].previousElement && ko.bindingHandlers["treeGridRowFocus"].previousElement !== element) {
                var e = document.createEvent("Event");
                e.initEvent("blur", false, false);
                ko.bindingHandlers["treeGridRowFocus"].previousElement.dispatchEvent(e);
            }
            var hasFocusObservable = valueAccessor();
            if (ko.isWriteableObservable(hasFocusObservable) && !hasFocusObservable()) {
                hasFocusObservable(true);
            }
            ko.bindingHandlers["treeGridRowFocus"].previousElement = element;
        };
        var onBlur = () => {
            var hasFocusObservable = valueAccessor();
            if (ko.isWriteableObservable(hasFocusObservable) && !!hasFocusObservable()) {
                hasFocusObservable(false);
            }
        };
        element.addEventListener("focus", onFocus);
        element.addEventListener("blur", onBlur);
    },
    update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (!ko.unwrap(valueAccessor())) {
            element.blur();
        }
        else {
            var body = element.parentElement;
            while (body && !body.classList.contains("treeGridBody")) {
                body = body.parentElement;
            }
            if (body) {
                var x = body.scrollLeft;
                element.focus();
                body.scrollLeft = x;
            }
            else {
                ko.tasks.runEarly();
                ko.tasks.schedule(() => {
                    var body = element.parentElement;
                    while (body && !body.classList.contains("treeGridBody")) {
                        body = body.parentElement;
                    }
                    if (body) {
                        var x = body.scrollLeft;
                        element.focus();
                        body.scrollLeft = x;
                    }
                    else {
                        element.focus();
                    }
                });
            }
        }
    }
};
define("CallerCalleeView", [], function () { return "PCEtLSBrbyBpZm5vdDogaGVhZGVyIC0tPjwhLS0ga28gdGVtcGxhdGU6IHsgbmFtZTogJ0xvYWRpbmcnIH0gLS0+PCEtLSAva28gLS0+PCEtLSAva28gLS0+PCEtLSBrbyBpZjogaGVhZGVyIC0tPjxkaXYgY2xhc3M9ImNhbGxlckNhbGxlZSBjdXJyZW50VmlldyIgZGF0YS1iaW5kPSJ0ZW1wbGF0ZTogeyBhZnRlclJlbmRlcjogb25BZnRlckRvbUluc2VydCB9LG11bHRpQ2xpY2s6IHsgY2xpY2s6IG9uQ2xpY2ssIGRibGNsaWNrOiBvbkRibENsaWNrIH0sZHluYW1pY0NvbnRleHRNZW51OiBjb250ZXh0TWVudSIgPjxkaXYgY2xhc3M9ImxpbmtlZEhvcml6b250YWxTY3JvbGwgaGVhZGVyIj48ZGl2IGNsYXNzPSJ3cmFwcGVyIj48dGFibGUgZGF0YS1iaW5kPSJ3aXRoOiBoZWFkZXIiPjx0aGVhZCBjbGFzcz0ic2hhcmVkSGVhZGVyIiBkYXRhLWJpbmQ9InZpc2liaWxpdHlDb250ZXh0TWVudTogdmlzaWJpbGl0eUNvbnRleHRNZW51QmluZGluZywgY2lyY3VsYXJGb2N1czogeyBzZWxlY3RvcjogJ3RoJywgdmVydGljYWw6IGZhbHNlIH0iPjx0ciByb2w9InJvdyIgZGF0YS1iaW5kPSJmb3JlYWNoOiBjb2x1bW5zIj48dGggcm9sZT0iY29sdW1uaGVhZGVyIiBkYXRhLWJpbmQ9InRleHQ6IHRleHQsY3NzOiBpZCxhdHRyOiB7ICdkYXRhLWNvbHVtbmlkJzogaWQgfSxzb3J0YWJsZTogdHlwZW9mIHNvcnRhYmxlICE9PSAndW5kZWZpbmVkJyA/IHsgc29ydENvbHVtbklkOiBpZCwgY3VycmVudENvbHVtbjogJHBhcmVudC5zb3J0Q29sdW1uSWQsIGN1cnJlbnREaXJlY3Rpb246ICRwYXJlbnQuc29ydERpcmVjdGlvbiwgZGVmYXVsdERpcmVjdGlvbjogc29ydGFibGUgfSA6IG51bGwiPjwvdGg+PC90cj48L3RoZWFkPjwvdGFibGU+PC9kaXY+PC9kaXY+PGRpdiBpZD0iY2FsbGVyQ2FwdGlvbiIgY2xhc3M9ImNhcHRpb24iIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogWydDYWxsZXJDYWxsZWVWaWV3X0NhbGxlclRhYmxlVGl0bGUnLCBjdXJyZW50RnVuY3Rpb25OYW1lXSI+PC9kaXY+PGRpdiBjbGFzcz0ibGlua2VkSG9yaXpvbnRhbFNjcm9sbCB2ZXJ0aWNhbFNjcm9sbCBjYWxsZXJzIj48ZGl2IGNsYXNzPSJ3cmFwcGVyIj48dGFibGUgZGF0YS1iaW5kPSJldmVudDogeyBrZXlkb3duOiBvbktleURvd25DYWxsZXIuYmluZCgkZGF0YSkgfSI+PHRoZWFkIGFyaWEtaGlkZGVuPSJ0cnVlIiBkYXRhLWJpbmQ9IndpdGg6IGhlYWRlciI+PHRyIHJvbD0icm93IiBkYXRhLWJpbmQ9ImZvcmVhY2g6IGNvbHVtbnMiPjx0aCByb2xlPSJjb2x1bW5oZWFkZXIiIGRhdGEtYmluZD0idGV4dDogdGV4dCxjc3M6IGlkLGF0dHI6IHsgJ2RhdGEtY29sdW1uaWQnOiBpZCB9LHNvcnRhYmxlOiB0eXBlb2Ygc29ydGFibGUgIT09ICd1bmRlZmluZWQnID8geyBzb3J0Q29sdW1uSWQ6IGlkLCBjdXJyZW50Q29sdW1uOiAkcGFyZW50LnNvcnRDb2x1bW5JZCwgY3VycmVudERpcmVjdGlvbjogJHBhcmVudC5zb3J0RGlyZWN0aW9uLCBkZWZhdWx0RGlyZWN0aW9uOiBzb3J0YWJsZSB9IDogbnVsbCI+PC90aD48L3RyPjwvdGhlYWQ+PCEtLSBrbyB3aXRoOiBjYWxsZXIgLS0+PHRib2R5IHRhYmluZGV4PSIwIiBhcmlhLWxhYmVsbGVkYnk9ImNhbGxlckNhcHRpb24iIGFyaWEtcmVhZG9ubHk9InRydWUiIGFyaWEtbXVsdGlzZWxlY3RhYmxlPSJ0cnVlIiBkYXRhLWJpbmQ9InZpcnR1YWxpemVkRm9yRWFjaDogeyByb3dzOiBkYXRhLCBzY3JvbGxUb3A6IHNjcm9sbFRvcCwgY2xpZW50SGVpZ2h0OiBjbGllbnRIZWlnaHQsIGNvbHVtbk9yZGVyOiBoZWFkZXIuY29sdW1uT3JkZXIgfSxmb2N1c2VkUm93OiB7IHJvd3M6IGRhdGEsIHNlbGVjdGVkOiBzZWxlY3RlZFJvd3MsIGZvY3VzZWQ6IGZvY3VzZWRSb3dJbmRleCB9LGxvY2FsaXplZEFyaWFMYWJlbDogWydDYWxsZXJDYWxsZWVWaWV3X0NhbGxlclRhYmxlVGl0bGUnLCAkcGFyZW50LmN1cnJlbnRGdW5jdGlvbk5hbWVdLGF0dHI6IHsgdGFiaW5kZXg6IGRhdGEoKS5sZW5ndGggPiAwID8gMCA6IC0xIH0iPjwvdGJvZHk+PCEtLSAva28gLS0+PC90YWJsZT48IS0tIGtvIGlmOiBjYWxsZXIuZGF0YSgpLmxlbmd0aCA9PT0gMCAtLT48ZGl2IHRhYmluZGV4PSIwIiBhcmlhLWxhYmVsbGVkYnk9ImNhbGxlckNhcHRpb24iIGRhdGEtYmluZD0ibG9jYWxpemVkQXJpYUxhYmVsOiBbJ0NhbGxlckNhbGxlZVZpZXdfVG9wT2ZTdGFja0FyaWFMYWJlbCcsIGN1cnJlbnRGdW5jdGlvbk5hbWVdLCBsb2NhbGl6ZWRUZXh0OiAnQ2FsbGVyQ2FsbGVlVmlld19Ub3BPZkNhbGxTdGFja01lc3NhZ2UnIj48L2Rpdj48IS0tIC9rbyAtLT48L2Rpdj48L2Rpdj48ZGl2IGlkPSJjdXJyZW50Q2FwdGlvbiIgY2xhc3M9ImNhcHRpb24iIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ0NhbGxlckNhbGxlZVZpZXdfQ3VycmVudEZ1bmN0aW9uJyI+PC9kaXY+PGRpdiBjbGFzcz0ibGlua2VkSG9yaXpvbnRhbFNjcm9sbCBjdXJyZW50Ij48ZGl2IGNsYXNzPSJ3cmFwcGVyIj48dGFibGU+PHRoZWFkIGFyaWEtaGlkZGVuPSJ0cnVlIiBkYXRhLWJpbmQ9IndpdGg6IGhlYWRlciI+PHRyIHJvbD0icm93IiBkYXRhLWJpbmQ9ImZvcmVhY2g6IGNvbHVtbnMiPjx0aCByb2xlPSJjb2x1bW5oZWFkZXIiIGRhdGEtYmluZD0idGV4dDogdGV4dCxjc3M6IGlkLGF0dHI6IHsgJ2RhdGEtY29sdW1uaWQnOiBpZCB9LHNvcnRhYmxlOiB0eXBlb2Ygc29ydGFibGUgIT09ICd1bmRlZmluZWQnID8geyBzb3J0Q29sdW1uSWQ6IGlkLCBjdXJyZW50Q29sdW1uOiAkcGFyZW50LnNvcnRDb2x1bW5JZCwgY3VycmVudERpcmVjdGlvbjogJHBhcmVudC5zb3J0RGlyZWN0aW9uLCBkZWZhdWx0RGlyZWN0aW9uOiBzb3J0YWJsZSB9IDogbnVsbCI+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5IHRhYmluZGV4PSIwIiBhcmlhLWxhYmVsbGVkYnk9ImN1cnJlbnRDYXB0aW9uIiBhcmlhLXJlYWRvbmx5PSJ0cnVlIiBkYXRhLWJpbmQ9IndpdGg6IGN1cnJlbnQsIGV2ZW50OiB7IGtleWRvd246IG9uS2V5RG93bkN1cnJlbnQuYmluZCgkZGF0YSkgfSwgbG9jYWxpemVkQXJpYUxhYmVsOiAnQ2FsbGVyQ2FsbGVlVmlld19DdXJyZW50RnVuY3Rpb24nIj48IS0tIGtvIHRlbXBsYXRlOiB0ZW1wbGF0ZU5hbWUgLS0+PCEtLSAva28gLS0+PC90Ym9keT48L3RhYmxlPjwvZGl2PjwvZGl2PjxkaXYgaWQ9ImNhbGxlZUNhcHRpb24iIGNsYXNzPSJjYXB0aW9uIiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6IFsnQ2FsbGVyQ2FsbGVlVmlld19DYWxsZWVUYWJsZVRpdGxlJywgY3VycmVudEZ1bmN0aW9uTmFtZV0iPjwvZGl2PjxkaXYgY2xhc3M9ImxpbmtlZEhvcml6b250YWxTY3JvbGwgdmVydGljYWxTY3JvbGwgY2FsbGVlcyI+PGRpdiBjbGFzcz0id3JhcHBlciI+PHRhYmxlIGRhdGEtYmluZD0iZXZlbnQ6IHsga2V5ZG93bjogb25LZXlEb3duQ2FsbGVlLmJpbmQoJGRhdGEpIH0iPjx0aGVhZCBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1iaW5kPSJ3aXRoOiBoZWFkZXIiPjx0ciByb2w9InJvdyIgZGF0YS1iaW5kPSJmb3JlYWNoOiBjb2x1bW5zIj48dGggcm9sZT0iY29sdW1uaGVhZGVyIiBkYXRhLWJpbmQ9InRleHQ6IHRleHQsY3NzOiBpZCxhdHRyOiB7ICdkYXRhLWNvbHVtbmlkJzogaWQgfSxzb3J0YWJsZTogdHlwZW9mIHNvcnRhYmxlICE9PSAndW5kZWZpbmVkJyA/IHsgc29ydENvbHVtbklkOiBpZCwgY3VycmVudENvbHVtbjogJHBhcmVudC5zb3J0Q29sdW1uSWQsIGN1cnJlbnREaXJlY3Rpb246ICRwYXJlbnQuc29ydERpcmVjdGlvbiwgZGVmYXVsdERpcmVjdGlvbjogc29ydGFibGUgfSA6IG51bGwiPjwvdGg+PC90cj48L3RoZWFkPjwhLS0ga28gd2l0aDogY2FsbGVlIC0tPjx0Ym9keSBhcmlhLWxhYmVsbGVkYnk9ImNhbGxlZUNhcHRpb24iIGFyaWEtcmVhZG9ubHk9InRydWUiIGFyaWEtbXVsdGlzZWxlY3RhYmxlPSJ0cnVlIiBkYXRhLWJpbmQ9InZpcnR1YWxpemVkRm9yRWFjaDogeyByb3dzOiBkYXRhLCBzY3JvbGxUb3A6IHNjcm9sbFRvcCwgY2xpZW50SGVpZ2h0OiBjbGllbnRIZWlnaHQsIGNvbHVtbk9yZGVyOiBoZWFkZXIuY29sdW1uT3JkZXIgfSxmb2N1c2VkUm93OiB7IHJvd3M6IGRhdGEsIHNlbGVjdGVkOiBzZWxlY3RlZFJvd3MsIGZvY3VzZWQ6IGZvY3VzZWRSb3dJbmRleCB9LGxvY2FsaXplZEFyaWFMYWJlbDogWydDYWxsZXJDYWxsZWVWaWV3X0NhbGxlZVRhYmxlVGl0bGUnLCAkcGFyZW50LmN1cnJlbnRGdW5jdGlvbk5hbWVdLGF0dHI6IHsgdGFiaW5kZXg6IGRhdGEoKS5sZW5ndGggPiAwID8gMCA6IC0xIH0iPjwvdGJvZHk+PCEtLSAva28gLS0+PC90YWJsZT48IS0tIGtvIGlmOiBjYWxsZWUuZGF0YSgpLmxlbmd0aCA9PT0gMCAtLT48ZGl2IHRhYmluZGV4PSIwIiBhcmlhLWxhYmVsbGVkYnk9ImNhbGxlZUNhcHRpb24iIGRhdGEtYmluZD0ibG9jYWxpemVkQXJpYUxhYmVsOiBbJ0NhbGxlckNhbGxlZVZpZXdfQm90dG9tT2ZTdGFja0FyaWFMYWJlbCcsIGN1cnJlbnRGdW5jdGlvbk5hbWVdLCBsb2NhbGl6ZWRUZXh0OiAnQ2FsbGVyQ2FsbGVlVmlld19Cb3R0b21PZkNhbGxTdGFja01lc3NhZ2UnIj48L2Rpdj48IS0tIC9rbyAtLT48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPSJob3Jpem9udGFsU2Nyb2xsIj48ZGl2IGNsYXNzPSJzY3JvbGxCYXJJbm5lciI+Jm5ic3A7PC9kaXY+PC9kaXY+PC9kaXY+PCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiAnTG9hZGluZycsIGlmOiBoZWFkZXIoKS5jb2x1bW5Db25maWdMb2FkU3RhdHVzKCkgIT09IERhdGFMb2FkRXZlbnQuRGF0YUxvYWRDb21wbGV0ZWQgfSAtLT48IS0tIC9rbyAtLT48IS0tIC9rbyAtLT4="; });
define("CallTreeView", [], function () { return "PCEtLSBrbyBpZm5vdDogdHJlZUdyaWQgLS0+PCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiAnTG9hZGluZycgfSAtLT48IS0tIC9rbyAtLT48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiB0cmVlR3JpZCAtLT48ZGl2IGNsYXNzPSJjYWxsVHJlZSBjdXJyZW50VmlldyIgZGF0YS1iaW5kPSJ0ZW1wbGF0ZTogeyBuYW1lOiAnVHJlZUdyaWRWaWV3JywgZGF0YTogdHJlZUdyaWQsIGFmdGVyUmVuZGVyOiB0cmVlR3JpZCgpLm9uQWZ0ZXJEb21JbnNlcnQuYmluZCgkZGF0YSkgfSxldmVudDogeyBrZXlkb3duOiBvbktleURvd24gfSxkeW5hbWljQ29udGV4dE1lbnU6IGNvbnRleHRNZW51Ij48L2Rpdj48IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6ICdMb2FkaW5nJywgaWY6IHRyZWVHcmlkKCkuZGF0YUxvYWRTdGF0dXMoKSAhPT0gRGF0YUxvYWRFdmVudC5EYXRhTG9hZENvbXBsZXRlZCB8fCB0cmVlR3JpZCgpLmhlYWRlci5jb2x1bW5Db25maWdMb2FkU3RhdHVzKCkgIT09IERhdGFMb2FkRXZlbnQuRGF0YUxvYWRDb21wbGV0ZWQgfSAtLT48IS0tIC9rbyAtLT48IS0tIC9rbyAtLT4="; });
define("CopyCallerCalleeView", [], function () { return "PHRhYmxlPjx0aGVhZCBjbGFzcz0ic2hhcmVkSGVhZGVyIiBkYXRhLWJpbmQ9InRlbXBsYXRlOiB7IG5hbWU6IGhlYWRlci50ZW1wbGF0ZSwgZGF0YTogaGVhZGVyIH0iPjwvdGhlYWQ+PHRib2R5IGRhdGEtYmluZD0iZm9yZWFjaDogc2VsZWN0ZWRSb3dzKCkubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIGRhdGEoKVtyXTsgfSkiPjwhLS0ga28gdGVtcGxhdGU6IHRlbXBsYXRlTmFtZSAtLT48IS0tIC9rbyAtLT48L3Rib2R5PjwvdGFibGU+"; });
define("CopyTreeGridView", [], function () { return "PGRpdiBjbGFzcz0idHJlZUdyaWRDb250YWluZXIiPjxkaXYgY2xhc3M9InRyZWVHcmlkQm9keSI+PHRhYmxlPjx0aGVhZCBkYXRhLWJpbmQ9IndpdGg6IGhlYWRlciI+PHRyIHJvbGU9InJvdyIgZGF0YS1iaW5kPSJmb3JlYWNoOiBjb2x1bW5zIj48dGggcm9sZT0iY29sdW1uaGVhZGVyIiBkYXRhLWJpbmQ9InRleHQ6IHRleHQsIGF0dHI6IHsgJ2RhdGEtY29sdW1uaWQnOiBpZCB9Ij48L3RoPjwvdHI+PC90aGVhZD48dGJvZHkgZGF0YS1iaW5kPSJmb3JlYWNoOiBzZWxlY3RlZFJvd3MoKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gdHJlZUFzQXJyYXkoKVtyXTsgfSkiPjx0ciBjbGFzcz0iY29weS1tZXRhZGF0YSI+PHRkPjwhLS0ga28gZm9yZWFjaDogbmV3IEFycmF5KGRlcHRoKSAtLT58PCEtLS9rby0tPjwvdGQ+PCEtLSBrbyBpZjogZXhwYW5kZWQgPT09IG51bGwtLT48dGQ+Jm5ic3A7Jm5ic3A7Jm5ic3A7PC90ZD48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiBleHBhbmRlZCAhPT0gbnVsbC0tPjwhLS0ga28gaWY6IGV4cGFuZGVkIC0tPjx0ZD4mbmJzcDsrJm5ic3A7PC90ZD48IS0tIC9rbyAtLT48IS0tIGtvIGlmbm90OiBleHBhbmRlZCAtLT48dGQ+Jm5ic3A7LSZuYnNwOzwvdGQ+PCEtLSAva28gLS0+PCEtLSAva28gLS0+PC90cj48IS0tIGtvIHRlbXBsYXRlOiB0ZW1wbGF0ZU5hbWUgLS0+PCEtLSAva28gLS0+PC90Ym9keT48L3RhYmxlPjwvZGl2PjwvZGl2Pg=="; });
define("DynamicTreeRowView", [], function () { return "PHRyIGNsYXNzPSJ0cmVlR3JpZFJvdyBhbGxvY2F0aW9uUm93InRhYmluZGV4PSItMSIgcm9sZT0icm93IiBkYXRhLWJpbmQ9InRyZWVHcmlkUm93Rm9jdXM6ICRwYXJlbnQuZm9jdXNlZFJvdygpID09PSAkZGF0YSxhcmlhRXhwYW5kZWQ6IHsgZXhwYW5kYWJsZTogZXhwYW5kZWQgIT09IG51bGwsIGV4cGFuZGVkOiBleHBhbmRlZCB9LGNzczogeyBzZWxlY3RlZDogc2VsZWN0ZWQoKSB9LGF0dHI6IHsgJ2FyaWEtbGV2ZWwnOiBkZXB0aCArIDEgfSxzdHlsZTogeyAnZm9udC13ZWlnaHQnOiBkZXB0aCA9PT0gMCA/ICdib2xkJyA6ICdub3JtYWwnIH0sZG9jdW1lbnRGcmFnbWVudDogY29sdW1ucyI+PC90cj4="; });
define("FunctionDetailsExclusivePerfMetricView", [], function () { return "PCEtLSBrbyBpZjogZHRvLm1ldHJpYy50eXBlID09PSBQZXJmTWV0cmljVHlwZS5UZXh0IC0tPjxzcGFuIGNsYXNzPSJtZXRyaWMiIGRhdGEtYmluZD0idGV4dDogZXhjbHVzaXZlIj48L3NwYW4+PCEtLSAva28gLS0+PCEtLSBrbyBpZjogZHRvLm1ldHJpYy50eXBlID09PSBQZXJmTWV0cmljVHlwZS5OdW1iZXIgLS0+PHNwYW4gY2xhc3M9Im1ldHJpYyIgZGF0YS1iaW5kPSJmb3JtYXRJbnRlZ2VyOiBleGNsdXNpdmUiPjwvc3Bhbj48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiBkdG8ubWV0cmljLnR5cGUgPT09IFBlcmZNZXRyaWNUeXBlLlBlcmNlbnQgLS0+PHNwYW4gY2xhc3M9Im1ldHJpYyIgZGF0YS1iaW5kPSJmb3JtYXRQZXJjZW50OiBleGNsdXNpdmUiPjwvc3Bhbj48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiBkdG8ubWV0cmljLnR5cGUgPT09IFBlcmZNZXRyaWNUeXBlLlRpbWUgLS0+PHNwYW4gY2xhc3M9Im1ldHJpYyIgZGF0YS1iaW5kPSJmb3JtYXRUaW1lOiB7IHZhbHVlOiBleGNsdXNpdmUsIHRpbWVUeXBlOiAkcm9vdC5kaXNwbGF5VGltZVR5cGUgfSI+PC9zcGFuPjwhLS0gL2tvIC0tPg=="; });
define("FunctionDetailsInclusivePerfMetricView", [], function () { return "PCEtLSBrbyBpZjogZHRvLm1ldHJpYy50eXBlID09PSBQZXJmTWV0cmljVHlwZS5UZXh0IC0tPjxzcGFuIGNsYXNzPSJtZXRyaWMiIGRhdGEtYmluZD0idGV4dDogaW5jbHVzaXZlIj48L3NwYW4+PCEtLSAva28gLS0+PCEtLSBrbyBpZjogZHRvLm1ldHJpYy50eXBlID09PSBQZXJmTWV0cmljVHlwZS5OdW1iZXIgLS0+PHNwYW4gY2xhc3M9Im1ldHJpYyIgZGF0YS1iaW5kPSJmb3JtYXRJbnRlZ2VyOiBpbmNsdXNpdmUiPjwvc3Bhbj48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiBkdG8ubWV0cmljLnR5cGUgPT09IFBlcmZNZXRyaWNUeXBlLlBlcmNlbnQgLS0+PHNwYW4gY2xhc3M9Im1ldHJpYyIgZGF0YS1iaW5kPSJmb3JtYXRQZXJjZW50OiBpbmNsdXNpdmUiPjwvc3Bhbj48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiBkdG8ubWV0cmljLnR5cGUgPT09IFBlcmZNZXRyaWNUeXBlLlRpbWUgLS0+PHNwYW4gY2xhc3M9Im1ldHJpYyIgZGF0YS1iaW5kPSJmb3JtYXRUaW1lOiB7IHZhbHVlOiBpbmNsdXNpdmUsIHRpbWVUeXBlOiAkcm9vdC5kaXNwbGF5VGltZVR5cGUgfSI+PC9zcGFuPjwhLS0gL2tvIC0tPg=="; });
define("FunctionDetailsView", [], function () { return "PCEtLSBrbyBpZjogY3VycmVudEZ1bmN0aW9uIC0tPjxkaXYgY2xhc3M9ImZ1bmN0aW9uRGV0YWlsc1ZpZXcgY3VycmVudFZpZXciPjxzcGFuIGNsYXNzPSJjdXJyZW50RnVuY3Rpb25OYW1lIiBkYXRhLWJpbmQ9InRleHQ6IGN1cnJlbnRGdW5jdGlvbk5hbWUiPjwvc3Bhbj48c3BhbiBjbGFzcz0iY3VycmVudE1vZHVsZU5hbWUiIGRhdGEtYmluZD0idGV4dDogY3VycmVudE1vZHVsZU5hbWUiPjwvc3Bhbj48ZGl2IGNsYXNzPSJmdW5jdGlvbkRldGFpbHNWaWV3SXRlbSBjaGFydCI+PGRpdiBjbGFzcz0iZnVuY3Rpb25EZXRhaWxzVmlld0l0ZW0gY2FsbGVycyBmdW5jdGlvbkdyb3VwIiBkYXRhLWJpbmQ9ImNsaWNrOiBuYXZpZ2F0ZVRvLCBvbkVudGVyOiBuYXZpZ2F0ZVRvIj48c3BhbiBjbGFzcz0iZnVuY3Rpb25EZXRhaWxzVmlld0l0ZW0gZnVuY3Rpb25Hcm91cC10aXRsZSIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnRnVuY3Rpb25EZXRhaWxzX0NhbGxpbmdGdW5jdGlvbnNUaXRsZSciPjwvc3Bhbj48IS0tIGtvIGlmOiBhdFRvcE9mU3RhY2sgLS0+PGRpdiB0YWJJbmRleD0iMCIgY2xhc3M9ImZ1bmN0aW9uRGV0YWlsc1ZpZXdJdGVtIGZ1bmN0aW9ucyIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRBcmlhTGFiZWw6ICdGdW5jdGlvbkRldGFpbHNfVG9wT2ZDYWxsU3RhY2tNZXNzYWdlJyI+PGRpdiBjbGFzcz0iZnVuY3Rpb25EZXRhaWxzVmlld0l0ZW0gZnVuY3Rpb24iPjxzcGFuIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ0Z1bmN0aW9uRGV0YWlsc19Ub3BPZkNhbGxTdGFja01lc3NhZ2UnIj48L3NwYW4+PC9kaXY+PC9kaXY+PCEtLSAva28gLS0+PCEtLSBrbyBpZm5vdDogYXRUb3BPZlN0YWNrIC0tPjxkaXYgdGFiSW5kZXg9IjAiIGNsYXNzPSJmdW5jdGlvbkRldGFpbHNWaWV3SXRlbSBmdW5jdGlvbnMiIGRhdGEtYmluZD0iZXZlbnQ6IHsga2V5ZG93bjogbW92ZVRvTmV4dEZ1bmN0aW9uIH0sbG9jYWxpemVkQXJpYUxhYmVsOiAnRnVuY3Rpb25EZXRhaWxzX0NhbGxpbmdGdW5jdGlvbnNBcmlhTGFiZWwnLGZvcmVhY2g6IGNhbGxlcnMiPjxkaXYgdGFiSW5kZXg9Ii0xIiBjbGFzcz0iZnVuY3Rpb25EZXRhaWxzVmlld0l0ZW0gZnVuY3Rpb24iIGRhdGEtYmluZD0ic3R5bGU6IHsgZmxleDogaW5jbHVzaXZlIH0sY3NzOiB7ICdpbnZva2FibGUnOiBjYW5OYXZpZ2F0ZVRvIH0sYXR0cjogeyAnYXJpYS1sYWJlbCc6IGFyaWFMYWJlbCB9LGxvY2FsaXplZFRvb2x0aXA6IFsgaW5jbHVzaXZlVG9vbHRpcCwgbmFtZSwgbG9jYWxpemVkSW5jbHVzaXZlIF0iPjxzcGFuIGNsYXNzPSJmdW5jdGlvbi1uYW1lIiBkYXRhLWJpbmQ9InRleHQ6IG5hbWUiPjwvc3Bhbj48ZGl2IGRhdGEtYmluZD0idGVtcGxhdGU6IHsgbmFtZTogJ0Z1bmN0aW9uRGV0YWlsc0luY2x1c2l2ZVBlcmZNZXRyaWNWaWV3JyB9Ij48L2Rpdj48L2Rpdj48L2Rpdj48IS0tIC9rbyAtLT48L2Rpdj48ZGl2IGNsYXNzPSJhcnJvd0ljb24iIGRhdGEtYmluZD0ic3ZnSW1hZ2U6ICdjb2RlRGlyZWN0aW9uQXJyb3dJY29uJyI+PC9kaXY+PGRpdiBjbGFzcz0iZnVuY3Rpb25EZXRhaWxzVmlld0l0ZW0gY3VycmVudEZ1bmN0aW9uIGZ1bmN0aW9uR3JvdXAiPjxzcGFuIGNsYXNzPSJmdW5jdGlvbkRldGFpbHNWaWV3SXRlbSBmdW5jdGlvbkdyb3VwLXRpdGxlIiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdGdW5jdGlvbkRldGFpbHNfQ3VycmVudEZ1bmN0aW9uVGl0bGUnIj48L3NwYW4+PGRpdiB0YWJJbmRleD0iMCIgY2xhc3M9ImZ1bmN0aW9uRGV0YWlsc1ZpZXdJdGVtIGZ1bmN0aW9ucyIgZGF0YS1iaW5kPSJmb2N1czogY3VycmVudEZ1bmN0aW9uSGFzRm9jdXMsZXZlbnQ6IHsga2V5ZG93bjogbW92ZVRvTmV4dEZ1bmN0aW9uIH0sbG9jYWxpemVkQXJpYUxhYmVsOiAnRnVuY3Rpb25EZXRhaWxzX0N1cnJlbnRGdW5jdGlvbkFyaWFMYWJlbCcsIHdpdGg6IGN1cnJlbnRGdW5jdGlvbiI+PGRpdiB0YWJJbmRleD0iLTEiIGNsYXNzPSJmdW5jdGlvbkRldGFpbHNWaWV3SXRlbSBmdW5jdGlvbiIgZGF0YS1iaW5kPSJhdHRyOiB7ICdhcmlhLWxhYmVsJzogYXJpYUxhYmVsIH0sbG9jYWxpemVkVG9vbHRpcDogWyBpbmNsdXNpdmVUb29sdGlwLCBuYW1lLCBsb2NhbGl6ZWRJbmNsdXNpdmUgXSI+PHNwYW4gY2xhc3M9ImZ1bmN0aW9uLW5hbWUiIGRhdGEtYmluZD0idGV4dDogbmFtZSI+PC9zcGFuPjxkaXYgZGF0YS1iaW5kPSJ0ZW1wbGF0ZTogeyBuYW1lOiAnRnVuY3Rpb25EZXRhaWxzSW5jbHVzaXZlUGVyZk1ldHJpY1ZpZXcnIH0iPjwvZGl2PjwvZGl2PjxkaXYgdGFiSW5kZXg9Ii0xIiBjbGFzcz0iZnVuY3Rpb25EZXRhaWxzVmlld0l0ZW0gZnVuY3Rpb24gZnVuY3Rpb25Cb2R5IiBkYXRhLWJpbmQ9ImF0dHI6IHsgJ2FyaWEtbGFiZWwnOiBhcmlhTGFiZWxGdW5jdGlvbkJvZHkgfSxsb2NhbGl6ZWRUb29sdGlwOiBbIGV4Y2x1c2l2ZVRvb2x0aXAsIG5hbWUsIGxvY2FsaXplZEV4Y2x1c2l2ZSBdIj48c3BhbiBjbGFzcz0iZnVuY3Rpb24tbmFtZSIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnRnVuY3Rpb25EZXRhaWxzX1ZpZXdGdW5jdGlvbkJvZHknIj48L3NwYW4+PGRpdiBkYXRhLWJpbmQ9InRlbXBsYXRlOiB7IG5hbWU6ICdGdW5jdGlvbkRldGFpbHNFeGNsdXNpdmVQZXJmTWV0cmljVmlldycgfSI+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz0iYXJyb3dJY29uIiBkYXRhLWJpbmQ9InN2Z0ltYWdlOiAnY29kZURpcmVjdGlvbkFycm93SWNvbiciPjwvZGl2PjxkaXYgY2xhc3M9ImZ1bmN0aW9uRGV0YWlsc1ZpZXdJdGVtIGNhbGxlZXMgZnVuY3Rpb25Hcm91cCIgZGF0YS1iaW5kPSJjbGljazogbmF2aWdhdGVUbywgb25FbnRlcjogbmF2aWdhdGVUbyI+PHNwYW4gY2xhc3M9ImZ1bmN0aW9uRGV0YWlsc1ZpZXdJdGVtIGZ1bmN0aW9uR3JvdXAtdGl0bGUiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ0Z1bmN0aW9uRGV0YWlsc19DYWxsZWRGdW5jdGlvbnNUaXRsZSciPjwvc3Bhbj48IS0tIGtvIGlmOiBhdEJvdHRvbU9mU3RhY2sgLS0+PGRpdiB0YWJJbmRleD0iMCIgY2xhc3M9ImZ1bmN0aW9uRGV0YWlsc1ZpZXdJdGVtIGZ1bmN0aW9ucyIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRBcmlhTGFiZWw6ICdGdW5jdGlvbkRldGFpbHNfQm90dG9tT2ZDYWxsU3RhY2tNZXNzYWdlJyI+PGRpdiBjbGFzcz0iZnVuY3Rpb25EZXRhaWxzVmlld0l0ZW0gZnVuY3Rpb24iPjxzcGFuIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ0Z1bmN0aW9uRGV0YWlsc19Cb3R0b21PZkNhbGxTdGFja01lc3NhZ2UnIj48L3NwYW4+PC9kaXY+PC9kaXY+PCEtLSAva28gLS0+PCEtLSBrbyBpZm5vdDogYXRCb3R0b21PZlN0YWNrIC0tPjxkaXYgdGFiSW5kZXg9IjAiIGNsYXNzPSJmdW5jdGlvbkRldGFpbHNWaWV3SXRlbSBmdW5jdGlvbnMiIGRhdGEtYmluZD0iZXZlbnQ6IHsga2V5ZG93bjogbW92ZVRvTmV4dEZ1bmN0aW9uIH0sbG9jYWxpemVkQXJpYUxhYmVsOiAnRnVuY3Rpb25EZXRhaWxzX0NhbGxlZEZ1bmN0aW9uc0FyaWFMYWJlbCcsZm9yZWFjaDogY2FsbGVlcyI+PGRpdiB0YWJJbmRleD0iLTEiIGNsYXNzPSJmdW5jdGlvbkRldGFpbHNWaWV3SXRlbSBmdW5jdGlvbiIgZGF0YS1iaW5kPSJzdHlsZTogeyBmbGV4OiBpbmNsdXNpdmUgfSxhdHRyOiB7ICdhcmlhLWxhYmVsJzogYXJpYUxhYmVsIH0sY3NzOiB7ICdob3RwYXRoJzogICRwYXJlbnQuY2FsbGVlcygpWzBdID09PSAkZGF0YSwgJ2ludm9rYWJsZSc6IGNhbk5hdmlnYXRlVG8gfSxsb2NhbGl6ZWRUb29sdGlwOiBbIGluY2x1c2l2ZVRvb2x0aXAsIG5hbWUsIGxvY2FsaXplZEluY2x1c2l2ZSBdIj48c3BhbiBjbGFzcz0iZnVuY3Rpb24tbmFtZSIgZGF0YS1iaW5kPSJ0ZXh0OiBuYW1lIj48L3NwYW4+PGRpdiBkYXRhLWJpbmQ9InRlbXBsYXRlOiB7IG5hbWU6ICdGdW5jdGlvbkRldGFpbHNJbmNsdXNpdmVQZXJmTWV0cmljVmlldycgfSI+PC9kaXY+PC9kaXY+PC9kaXY+PCEtLSAva28gLS0+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz0iZnVuY3Rpb25EZXRhaWxzRm9vdGVyIj48ZGl2IGNsYXNzPSJyZWxhdGVkVmlld3MiPjxzcGFuIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ0Z1bmN0aW9uRGV0YWlsc19SZWxhdGVkVmlld3MnIj48L3NwYW4+PGJ1dHRvbiBjbGFzcz0iaHlwZXJsaW5rLWJ1dHRvbiIgcm9sZT0ibGluayIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnRnVuY3Rpb25EZXRhaWxzX1ZpZXdCdXR0b25MYWJlbCcsIGxvY2FsaXplZEFyaWFMYWJlbDogJ0Z1bmN0aW9uRGV0YWlsc19WaWV3QnV0dG9uQXJpYUxhYmVsJywgY2xpY2s6IG5hdmlnYXRlVG9DYWxsZXJDYWxsZWUsIG9uRW50ZXI6IG5hdmlnYXRlVG9DYWxsZXJDYWxsZWUiPjwvYnV0dG9uPjxidXR0b24gY2xhc3M9Imh5cGVybGluay1idXR0b24iIHJvbGU9ImxpbmsiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ0Z1bmN0aW9uRGV0YWlsc19GdW5jdGlvbnNWaWV3QnV0dG9uTGFiZWwnLCBsb2NhbGl6ZWRBcmlhTGFiZWw6ICdGdW5jdGlvbkRldGFpbHNfRnVuY3Rpb25zVmlld0J1dHRvbkFyaWFMYWJlbCcsIGNsaWNrOiBuYXZpZ2F0ZVRvRnVuY3Rpb25zLCBvbkVudGVyOiBuYXZpZ2F0ZVRvRnVuY3Rpb25zIj48L2J1dHRvbj48L2Rpdj48ZGl2IGNsYXNzPSJwZXJmb3JtYW5jZU1ldHJpYyI+PHNwYW4gZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnRnVuY3Rpb25EZXRhaWxzX1BlcmZvcm1hbmNlTWV0cmljTGFiZWwnIj48L3NwYW4+PHNlbGVjdCBkYXRhLWJpbmQ9Im9wdGlvbnM6IHBlcmZvcm1hbmNlTWV0cmljcyxvcHRpb25zVGV4dDogJ2xvY2FsaXplZE5hbWUnLHZhbHVlOiBjdXJyZW50UGVyZm9ybWFuY2VNZXRyaWMsb3B0aW9uc1ZhbHVlOiAnbWV0cmljSW5kZXgnLGxvY2FsaXplZEFyaWFMYWJlbDogJ0Z1bmN0aW9uRGV0YWlsc19QZXJmb3JtYW5jZU1ldHJpY0xhYmVsJyI+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PC9kaXY+PCEtLSAva28gLS0+"; });
define("FunctionsView", [], function () { return "PCEtLSBrbyBpZm5vdDogZnVuY3Rpb25zTGlzdCAtLT48IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6ICdMb2FkaW5nJyB9IC0tPjwhLS0gL2tvIC0tPjwhLS0gL2tvIC0tPjwhLS0ga28gaWY6IGZ1bmN0aW9uc0xpc3QgLS0+PGRpdiBjbGFzcz0iZnVuY3Rpb25zIGN1cnJlbnRWaWV3IiBkYXRhLWJpbmQ9InRlbXBsYXRlOiB7IG5hbWU6ICdUcmVlR3JpZFZpZXcnLCBkYXRhOiBmdW5jdGlvbnNMaXN0LCBhZnRlclJlbmRlcjogZnVuY3Rpb25zTGlzdCgpLm9uQWZ0ZXJEb21JbnNlcnQuYmluZCgkZGF0YSkgfSxldmVudDogeyBrZXlkb3duOiBvbktleURvd24gfSxkeW5hbWljQ29udGV4dE1lbnU6IGNvbnRleHRNZW51Ij48L2Rpdj48IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6ICdMb2FkaW5nJywgaWY6IGZ1bmN0aW9uc0xpc3QoKS5kYXRhTG9hZFN0YXR1cygpICE9PSBEYXRhTG9hZEV2ZW50LkRhdGFMb2FkQ29tcGxldGVkIHx8IGZ1bmN0aW9uc0xpc3QoKS5oZWFkZXIuY29sdW1uQ29uZmlnTG9hZFN0YXR1cygpICE9PSBEYXRhTG9hZEV2ZW50LkRhdGFMb2FkQ29tcGxldGVkIH0gLS0+PCEtLSAva28gLS0+PCEtLSAva28gLS0+"; });
define("Loading", [], function () { return "PGRpdiBjbGFzcz0ibG9hZGluZyI+PHNwYW4gZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiBbJ0xvYWRpbmdWaWV3TWVzc2FnZScsICRyb290LmN1cnJlbnRWaWV3TmFtZV0iPjwvc3Bhbj48L2Rpdj4="; });
define("MarksView", [], function () { return "PCEtLSBrbyBpZm5vdDogdHJlZUdyaWQgLS0+PCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiAnTG9hZGluZycgfSAtLT48IS0tIC9rbyAtLT48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiB0cmVlR3JpZCAtLT48ZGl2IGNsYXNzPSJtYXJrcyBjdXJyZW50VmlldyIgZGF0YS1iaW5kPSJ0ZW1wbGF0ZTogeyBuYW1lOiAnVHJlZUdyaWRWaWV3JywgZGF0YTogdHJlZUdyaWQsIGFmdGVyUmVuZGVyOiBvbkFmdGVyRG9tSW5zZXJ0IH0sZXZlbnQ6IHsga2V5ZG93bjogb25LZXlEb3duIH0sZHluYW1pY0NvbnRleHRNZW51OiBjb250ZXh0TWVudSI+PC9kaXY+PCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiAnTG9hZGluZycsIGlmOiB0cmVlR3JpZCgpLmRhdGFMb2FkU3RhdHVzKCkgIT09IERhdGFMb2FkRXZlbnQuRGF0YUxvYWRDb21wbGV0ZWQgfHwgdHJlZUdyaWQoKS5oZWFkZXIuY29sdW1uQ29uZmlnTG9hZFN0YXR1cygpICE9PSBEYXRhTG9hZEV2ZW50LkRhdGFMb2FkQ29tcGxldGVkIH0gLS0+PCEtLSAva28gLS0+PCEtLSAva28gLS0+"; });
define("ModulesView", [], function () { return "PCEtLSBrbyBpZm5vdDogdHJlZUdyaWQgLS0+PCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiAnTG9hZGluZycgfSAtLT48IS0tIC9rbyAtLT48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiB0cmVlR3JpZCAtLT48ZGl2IGNsYXNzPSJtb2R1bGVzIGN1cnJlbnRWaWV3IiBkYXRhLWJpbmQ9InRlbXBsYXRlOiB7IG5hbWU6ICdUcmVlR3JpZFZpZXcnLCBkYXRhOiB0cmVlR3JpZCwgYWZ0ZXJSZW5kZXI6IHRyZWVHcmlkKCkub25BZnRlckRvbUluc2VydC5iaW5kKCRkYXRhKSB9LGV2ZW50OiB7IGtleWRvd246IG9uS2V5RG93biB9LGR5bmFtaWNDb250ZXh0TWVudTogY29udGV4dE1lbnUiPjwvZGl2PjwhLS0ga28gdGVtcGxhdGU6IHsgbmFtZTogJ0xvYWRpbmcnLCBpZjogdHJlZUdyaWQoKS5kYXRhTG9hZFN0YXR1cygpICE9PSBEYXRhTG9hZEV2ZW50LkRhdGFMb2FkQ29tcGxldGVkIHx8IHRyZWVHcmlkKCkuaGVhZGVyLmNvbHVtbkNvbmZpZ0xvYWRTdGF0dXMoKSAhPT0gRGF0YUxvYWRFdmVudC5EYXRhTG9hZENvbXBsZXRlZCB9IC0tPjwhLS0gL2tvIC0tPjwhLS0gL2tvIC0tPg=="; });
define("ProcessesView", [], function () { return "PCEtLSBrbyBpZm5vdDogcHJvY2Vzc2VzTGlzdCAtLT48IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6ICdMb2FkaW5nJyB9IC0tPjwhLS0gL2tvIC0tPjwhLS0gL2tvIC0tPjwhLS0ga28gaWY6IHByb2Nlc3Nlc0xpc3QgLS0+PGRpdiBjbGFzcz0icHJvY2Vzc2VzIGN1cnJlbnRWaWV3IiBkYXRhLWJpbmQ9InRlbXBsYXRlOiB7IG5hbWU6ICdUcmVlR3JpZFZpZXcnLCBkYXRhOiBwcm9jZXNzZXNMaXN0LCBhZnRlclJlbmRlcjogcHJvY2Vzc2VzTGlzdCgpLm9uQWZ0ZXJEb21JbnNlcnQuYmluZCgkZGF0YSkgfSxldmVudDogeyBrZXlkb3duOiBvbktleURvd24gfSxkeW5hbWljQ29udGV4dE1lbnU6IGNvbnRleHRNZW51Ij48L2Rpdj48IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6ICdMb2FkaW5nJywgaWY6IHByb2Nlc3Nlc0xpc3QoKS5kYXRhTG9hZFN0YXR1cygpICE9PSBEYXRhTG9hZEV2ZW50LkRhdGFMb2FkQ29tcGxldGVkIHx8IHByb2Nlc3Nlc0xpc3QoKS5oZWFkZXIuY29sdW1uQ29uZmlnTG9hZFN0YXR1cygpICE9PSBEYXRhTG9hZEV2ZW50LkRhdGFMb2FkQ29tcGxldGVkIH0gLS0+PCEtLSAva28gLS0+PCEtLSAva28gLS0+"; });
define("SearchControlView", [], function () { return "PGRpdiBjbGFzcz0iY29udGFpbmVyIHNlYXJjaC1jb250YWluZXIgdG9vbGJhci1idXR0b24iIGRhdGEtYmluZD0iY3NzOiB7IGNvbnRyb2xEaXNhYmxlZDogaXNEaXNhYmxlZCgpLCBjb250cm9sRW5hYmxlZDogIWlzRGlzYWJsZWQoKSB9LCBhdHRyOiB7ICdhcmlhLWRpc2FibGVkJzogaXNEaXNhYmxlZCB9LCB0ZW1wbGF0ZTogeyBhZnRlclJlbmRlcjogb25BZnRlckRvbUluc2VydCB9Ij48ZGl2IGNsYXNzPSJzZWFyY2gtY29udHJvbCIgZGF0YS1iaW5kPSJjc3M6IHsgaGFzRm9jdXM6IGhhc0ZvY3VzKCkgfSI+PGlucHV0IHR5cGU9InNlYXJjaCIgZGF0YS1iaW5kPSJkaXNhYmxlOiBpc0Rpc2FibGVkLHRleHRJbnB1dDogc2VhcmNoVGVybSxmb2N1czogc2VhcmNoSW5wdXRIYXNGb2N1cyx2YWx1ZVVwZGF0ZTogJ2FmdGVya2V5ZG93bicsbG9jYWxpemVkUGxhY2Vob2xkZXJUZXh0OiAnU2VhcmNoQ29udHJvbF9XYXRlcm1hcmsnLGxvY2FsaXplZEFyaWFMYWJlbDogYXJpYUxhYmVsVG9rZW4sZXZlbnQ6IHsga2V5ZG93bjogb25TZWFyY2hCb3hLZXlEb3duIH0iIC8+PGRpdiBjbGFzcz0ic2VhcmNoLXN1Ym1pdC1idXR0b24iIGRhdGEtYmluZD0iY2xpY2s6IHNlYXJjaCwgZm9jdXM6IHNlYXJjaFN1Ym1pdEhhc0ZvY3VzLCBsb2NhbGl6ZWRBcmlhTGFiZWw6ICdTZWFyY2hDb250cm9sX1NlYXJjaEljb25BcmlhTGFiZWwnLCBzdmdJbWFnZTogJ3NlYXJjaEljb24nIj48L2Rpdj48ZGl2IGlkPSJzZWFyY2gtb3B0aW9ucy1idXR0b24iIGNsYXNzPSJkcm9wZG93bi1idXR0b24iIGRhdGEtYmluZD0iY2xpY2s6IG9uRHJvcERvd25DbGljayI+PC9kaXY+PC9kaXY+PGRpdiBpZD0ic2VhcmNoT3B0aW9uc0ZseW91dCIgZGF0YS1iaW5kPSJjc3M6IHsgZmx5b3V0QWN0aXZlOiBzaG93U2V0dGluZ3MoKSB9LCBldmVudDogeyBrZXlkb3duOiBvbkZseW91dEtleURvd24gfSI+PHNwYW4gY2xhc3M9ImZseW91dEhlYWRlciIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnU2VhcmNoQ29udHJvbF9TZWFyY2hPcHRpb25zVGl0bGUnIj48L3NwYW4+PGxhYmVsIGNsYXNzPSJyZWdFeFNldHRpbmciIGRhdGEtYmluZD0iY3NzOiB7IGhhc0ZvY3VzOiBpc1JlZ3VsYXJFeHByZXNzaW9uSGFzRm9jdXMoKSB9LGV2ZW50OiB7IG1vdXNlZW50ZXI6IGZ1bmN0aW9uKHZpZXdNb2RlbCkgeyB2aWV3TW9kZWwuaXNSZWd1bGFyRXhwcmVzc2lvbkhhc0ZvY3VzKHRydWUpOyB9IH0iPjxpbnB1dCB0eXBlPSJjaGVja2JveCJkYXRhLWJpbmQ9ImNoZWNrZWQ6IGlzUmVndWxhckV4cHJlc3Npb24sIGZvY3VzOiBpc1JlZ3VsYXJFeHByZXNzaW9uSGFzRm9jdXMsbG9jYWxpemVkQXJpYUxhYmVsOiAnU2VhcmNoQ29udHJvbF9SZWdFeExhYmVsJyxhdHRyOiB7ICdhcmlhLWNoZWNrZWQnOiBpc1JlZ3VsYXJFeHByZXNzaW9uKCkgfSIgLz48c3BhbiBjbGFzcz0iY2hlY2tib3hMYWJlbCIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnU2VhcmNoQ29udHJvbF9SZWdFeExhYmVsJyI+PC9zcGFuPjwvbGFiZWw+PGxhYmVsIGNsYXNzPSJjYXNlU2Vuc2l0aXZlU2V0dGluZyIgZGF0YS1iaW5kPSJjc3M6IHsgaGFzRm9jdXM6IGlzQ2FzZVNlbnNpdGl2ZUhhc0ZvY3VzKCkgfSxldmVudDogeyBtb3VzZWVudGVyOiBmdW5jdGlvbih2aWV3TW9kZWwpIHsgdmlld01vZGVsLmlzQ2FzZVNlbnNpdGl2ZUhhc0ZvY3VzKHRydWUpOyB9IH0iPjxpbnB1dCB0eXBlPSJjaGVja2JveCJkYXRhLWJpbmQ9ImNoZWNrZWQ6IGlzQ2FzZVNlbnNpdGl2ZSwgZm9jdXM6IGlzQ2FzZVNlbnNpdGl2ZUhhc0ZvY3VzLGxvY2FsaXplZEFyaWFMYWJlbDogJ1NlYXJjaENvbnRyb2xfQ2FzZVNlbnNpdGl2ZUxhYmVsJyxhdHRyOiB7ICdhcmlhLWNoZWNrZWQnOiBpc0Nhc2VTZW5zaXRpdmUoKSB9IiAvPjxzcGFuIGNsYXNzPSJjaGVja2JveExhYmVsIiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTZWFyY2hDb250cm9sX0Nhc2VTZW5zaXRpdmVMYWJlbCciPjwvc3Bhbj48L2xhYmVsPjwvZGl2PjwvZGl2Pg=="; });
define("SummaryView", [], function () { return "PGRpdiBjbGFzcz0ic3VtbWFyeVZpZXcgY3VycmVudFZpZXciPjxkaXYgY2xhc3M9InN1bW1hcnlUaXRsZSI+PHNwYW4gY2xhc3M9InRpdGxlIiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTdW1tYXJ5Vmlld19JbnN0cnVtZW50YXRpb25SZXBvcnRUaXRsZSciPjwvc3Bhbj48c3BhbiBjbGFzcz0ic3ViVGl0bGUiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogWydTdW1tYXJ5Vmlld19JbnN0cnVtZW50YXRpb25SZXBvcnRTdWJ0aXRsZScsIENwdVNhbXBsaW5nVXRpbGl0aWVzLmxvY2FsaXplTnVtYmVyKHJlcG9ydE1ldHJpY1RvdGFsKCkpXSI+PC9zcGFuPjwvZGl2PjxkaXYgY2xhc3M9InN1bW1hcnlSZXBvcnQiPjxkaXYgY2xhc3M9Im1haW5SZXBvcnQiPjwhLS0ga28gaWY6IHNob3dHcmFwaCAtLT48ZGl2IGNsYXNzPSJwYW5lbCIgZGF0YS1iaW5kPSJpQ29udHJvbDogc3VtbWFyeUdyYXBoIj48L2Rpdj48IS0tIC9rbyAtLT48ZGl2IGNsYXNzPSJwYW5lbCI+PHNwYW4gY2xhc3M9InBhbmVsVGl0bGUiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X0hvdFBhdGhQYW5lbFRpdGxlJyI+PC9zcGFuPjx0YWJsZSBjbGFzcz0icGFuZWxCb2R5IGhvdFBhdGhUYWJsZSIgcm9sZT0idHJlZWdyaWQiIGRhdGEtYmluZD0ibG9jYWxpemVkQXJpYUxhYmVsOiAnU3VtbWFyeVZpZXdfSG90UGF0aEFyaWFMYWJlbCciPjx0aGVhZCByb2xlPSJyb3dncm91cCIgdGFiSW5kZXg9IjAiIGRhdGEtYmluZD0iY2lyY3VsYXJGb2N1czogeyBzZWxlY3RvcjogJ3RoJywgdmVydGljYWw6IGZhbHNlIH0iPjx0ciByb2xlPSJyb3ciPjx0aCByb2xlPSJjb2x1bW5oZWFkZXIiIHRhYkluZGV4PSItMSIgY2xhc3M9Im5hbWUiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X0hvdFBhdGhOYW1lSGVhZGVyJyI+PC90aD48dGggcm9sZT0iY29sdW1uaGVhZGVyIiB0YWJJbmRleD0iLTEiIGNsYXNzPSJpbmNsdXNpdmVQZXJjZW50IiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTdW1tYXJ5Vmlld19Ib3RQYXRoRWxhcHNlZEluY2x1c2l2ZVBlcmNlbnRIZWFkZXInIj48L3RoPjx0aCByb2xlPSJjb2x1bW5oZWFkZXIiIHRhYkluZGV4PSItMSIgY2xhc3M9ImV4Y2x1c2l2ZVBlcmNlbnQiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X0hvdFBhdGhFbGFwc2VkRXhjbHVzaXZlUGVyY2VudEhlYWRlciciPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keSByb2xlPSJyb3dncm91cCIgdGFiSW5kZXg9IjAiIGRhdGEtYmluZD0iZm9yZWFjaDogaG90UGF0aCwgbG9jYWxpemVkQXJpYUxhYmVsOiAnU3VtbWFyeVZpZXdfSG90UGF0aEFyaWFMYWJlbCcsIGNpcmN1bGFyRm9jdXM6IHsgc2VsZWN0b3I6ICd0cicsIHZlcnRpY2FsOiB0cnVlIH0sIGR5bmFtaWNDb250ZXh0TWVudTogY29udGV4dE1lbnUiPjx0ciBjbGFzcz0iaG90UGF0aFJvdyIgcm9sZT0icm93IiB0YWJJbmRleD0iLTEiIGRhdGEtYmluZD0iYXR0cjogeyAnYXJpYS1sZXZlbCc6IGRlcHRoICsgMSB9LCBvbkVudGVyOiAkcGFyZW50Lm9uSG90UGF0aEl0ZW1DbGlja2VkLmJpbmQoJHBhcmVudCksIGNsaWNrOiBmdW5jdGlvbigpIHsgZm9jdXModHJ1ZSk7IH0iPjx0ZCBjbGFzcz0ibmFtZSBjb250YWluZXIiIHJvbGU9ImdyaWRjZWxsIj48c3BhbiBkYXRhLWJpbmQ9InJvd0luZGVudDogZGVwdGgiPiZuYnNwOzwvc3Bhbj48YnV0dG9uIGNsYXNzPSJoeXBlcmxpbmstYnV0dG9uIiByb2xlPSJsaW5rIiB0YWJJbmRleD0iLTEiIGRhdGEtYmluZD0icm93SW5kZW50QnV0dG9uOiBkZXB0aCwgY2xpY2s6ICRwYXJlbnQub25Ib3RQYXRoSXRlbUNsaWNrZWQuYmluZCgkcGFyZW50KSwgb25FbnRlcjogJHBhcmVudC5vbkhvdFBhdGhJdGVtQ2xpY2tlZC5iaW5kKCRwYXJlbnQpIj48IS0tIGtvIGlmbm90OiBpc0hvdEl0ZW0gLS0+PGRpdiBjbGFzcz0iaWNvbiIgZGF0YS1iaW5kPSJzdmdJbWFnZTogJ2hvdFBhdGhJY29uJyI+PC9kaXY+PCEtLSAva28gLS0+PCEtLSBrbyBpZjogaXNIb3RJdGVtIC0tPjxkaXYgY2xhc3M9Imljb24iIGRhdGEtYmluZD0ic3ZnSW1hZ2U6ICdob3RJdGVtSWNvbiciPjwvZGl2PjwhLS0gL2tvIC0tPjxzcGFuIGRhdGEtYmluZD0idGV4dDogbmFtZSI+PC9zcGFuPjwvYnV0dG9uPjwvdGQ+PHRkIGNsYXNzPSJpbmNsdXNpdmVQZXJjZW50IiByb2xlPSJncmlkY2VsbCIgZGF0YS1iaW5kPSJ0ZXh0OiBpbmNsdXNpdmVQZXJjZW50LnRvRml4ZWQoMikiPjwvdGQ+PHRkIGNsYXNzPSJleGNsdXNpdmVQZXJjZW50IiByb2xlPSJncmlkY2VsbCIgZGF0YS1iaW5kPSJ0ZXh0OiBleGNsdXNpdmVQZXJjZW50LnRvRml4ZWQoMikiPjwvdGQ+PC90cj48L3Rib2R5PjwvdGFibGU+PC9kaXY+PGRpdiBjbGFzcz0icGFuZWwgcmVsYXRlZFZpZXdzIj48c3BhbiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTdW1tYXJ5Vmlld19SZWxhdGVkVmlld3MnIj48L3NwYW4+PGJ1dHRvbiBjbGFzcz0iaHlwZXJsaW5rLWJ1dHRvbiIgcm9sZT0ibGluayIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnU3VtbWFyeVZpZXdfQ2FsbFRyZWVIeXBlcmxpbmsnLCBjbGljazogb25OYXZpZ2F0ZVRvQ2FsbFRyZWUsIG9uRW50ZXI6IG9uTmF2aWdhdGVUb0NhbGxUcmVlIj48L2J1dHRvbj48YnV0dG9uIGNsYXNzPSJoeXBlcmxpbmstYnV0dG9uIiByb2xlPSJsaW5rIiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTdW1tYXJ5Vmlld19GdW5jdGlvbnNIeXBlcmxpbmsnLCBjbGljazogb25OYXZpZ2F0ZVRvRnVuY3Rpb25zLCBvbkVudGVyOiBvbk5hdmlnYXRlVG9GdW5jdGlvbnMiPjwvYnV0dG9uPjwvZGl2PjxkaXYgY2xhc3M9InBhbmVsIj48c3BhbiBjbGFzcz0icGFuZWxUaXRsZSIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnU3VtbWFyeVZpZXdfRnVuY3Rpb25zUGFuZWxUaXRsZSciPjwvc3Bhbj48dGFibGUgY2xhc3M9InBhbmVsQm9keSBzdW1tYXJ5VGFibGUiIGRhdGEtYmluZD0ibG9jYWxpemVkQXJpYUxhYmVsOiAnU3VtbWFyeVZpZXdfRnVuY3Rpb25zQXJpYUxhYmVsJyI+PHRoZWFkIHJvbGU9InJvd2dyb3VwIiB0YWJJbmRleD0iMCIgZGF0YS1iaW5kPSJjaXJjdWxhckZvY3VzOiB7IHNlbGVjdG9yOiAndGgnLCB2ZXJ0aWNhbDogZmFsc2UgfSI+PHRyIHJvbGU9InJvdyI+PHRoIHJvbGU9ImNvbHVtbmhlYWRlciIgdGFiSW5kZXg9Ii0xIiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTdW1tYXJ5Vmlld19OYW1lSGVhZGVyJyI+PC90aD48dGggcm9sZT0iY29sdW1uaGVhZGVyIiBjbGFzcz0icGVyY2VudCIgY29sc3Bhbj0iMiIgdGFiSW5kZXg9Ii0xIiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTdW1tYXJ5Vmlld19GdW5jdGlvbnNFeGNsdXNpdmVUaW1lUGVyY2VudEhlYWRlciciPjwvdGg+PC90cj48L3RoZWFkPjx0Ym9keSByb2xlPSJyb3dncm91cCIgdGFiSW5kZXg9IjAiIGRhdGEtYmluZD0iZm9yZWFjaDogZnVuY3Rpb25zTGlzdCwgbG9jYWxpemVkQXJpYUxhYmVsOiAnU3VtbWFyeVZpZXdfRnVuY3Rpb25zQXJpYUxhYmVsJywgY2lyY3VsYXJGb2N1czogeyBzZWxlY3RvcjogJ3RyJywgdmVydGljYWw6IHRydWUgfSwgZHluYW1pY0NvbnRleHRNZW51OiBjb250ZXh0TWVudSI+PHRyIHJvbGU9InJvdyIgY2xhc3M9InN1bW1hcnlMaXN0SXRlbSIgdGFiSW5kZXg9Ii0xIiBkYXRhLWJpbmQ9Im9uRW50ZXI6ICRwYXJlbnQub25GdW5jdGlvbkNsaWNrZWQuYmluZCgkcGFyZW50KSI+PHRkIGNsYXNzPSJuYW1lIj48c3BhbiBjbGFzcz0iaHlwZXJsaW5rLWJ1dHRvbiIgcm9sZT0ibGluayIgZGF0YS1iaW5kPSJ0ZXh0OiBuYW1lLCBjbGljazogJHBhcmVudC5vbkZ1bmN0aW9uQ2xpY2tlZC5iaW5kKCRwYXJlbnQpLCBvbkVudGVyOiAkcGFyZW50Lm9uRnVuY3Rpb25DbGlja2VkLmJpbmQoJHBhcmVudCkiPjwvc3Bhbj48L3RkPjx0ZCBjbGFzcz0idXNhZ2VDb250YWluZXIiPjxkaXYgY2xhc3M9InVzYWdlQmFyIiBkYXRhLWJpbmQ9InN0eWxlOiB7IHdpZHRoOiBzY2FsZWRQZXJjZW50ICsgJyUnIH0iPiZuYnNwOzwvZGl2PjwvdGQ+PHRkIGNsYXNzPSJwZXJjZW50Ij48c3BhbiBkYXRhLWJpbmQ9InRleHQ6IHBlcmNlbnQudG9GaXhlZCgyKSI+PC9zcGFuPjwvdGQ+PC90cj48L3Rib2R5PjwvdGFibGU+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz0ic2lkZUJhciI+PCEtLSBrbyBpZjogaGF2ZUZpbHRlcigpIHx8IGhhdmVWaWV3R3VpZGFuY2UoKSAtLT48ZGl2IGNsYXNzPSJwYW5lbCI+PHNwYW4gY2xhc3M9InBhbmVsVGl0bGUiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X05vdGlmaWNhdGlvbnNQYW5lbFRpdGxlJyI+PC9zcGFuPjx1bCBjbGFzcz0icGFuZWxCb2R5Ij48IS0tIGtvIGlmOiBoYXZlRmlsdGVyIC0tPjxsaT48YnV0dG9uIGNsYXNzPSJoeXBlcmxpbmstYnV0dG9uIiByb2xlPSJsaW5rIiBkYXRhLWJpbmQ9ImNsaWNrOiBvbkNsZWFyRmlsdGVyLCBvbkVudGVyOiBvbkNsZWFyRmlsdGVyIj48ZGl2IGNsYXNzPSJpY29uIiBkYXRhLWJpbmQ9InN2Z0ltYWdlOiAnZGVsZXRlRmlsdGVySWNvbiciPjwvZGl2PjxzcGFuIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X0NsZWFyRmlsdGVyQnV0dG9uTGFiZWwnIj48L3NwYW4+PC9idXR0b24+PC9saT48IS0tIC9rbyAtLT48IS0tIGtvIGlmOiBoYXZlVmlld0d1aWRhbmNlIC0tPjxsaT48YnV0dG9uIGNsYXNzPSJoeXBlcmxpbmstYnV0dG9uIiByb2xlPSJsaW5rIiBkYXRhLWJpbmQ9ImNsaWNrOiBvblZpZXdHdWlkYW5jZSwgb25FbnRlcjogb25WaWV3R3VpZGFuY2UiPjxkaXYgY2xhc3M9Imljb24iIGRhdGEtYmluZD0ic3ZnSW1hZ2U6ICdpbmZvSWNvbiciPjwvZGl2PjxzcGFuIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X1ZpZXdHdWlkYW5jZUJ1dHRvbkxhYmVsJyI+PC9zcGFuPjwvYnV0dG9uPjwvbGk+PCEtLSAva28gLS0+PC91bD48L2Rpdj48IS0tIC9rbyAtLT48ZGl2IGNsYXNzPSJwYW5lbCI+PHNwYW4gY2xhc3M9InBhbmVsVGl0bGUiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X1JlcG9ydFBhbmVsVGl0bGUnIj48L3NwYW4+PHVsIGNsYXNzPSJwYW5lbEJvZHkiPjwhLS0ga28gaWY6IGhhdmVNYXJrcyAtLT48bGk+PGJ1dHRvbiBjbGFzcz0iaHlwZXJsaW5rLWJ1dHRvbiIgcm9sZT0ibGluayIgZGF0YS1iaW5kPSJjbGljazogb25TaG93TWFya3MsIG9uRW50ZXI6IG9uU2hvd01hcmtzIj48ZGl2IGNsYXNzPSJpY29uIiBkYXRhLWJpbmQ9InN2Z0ltYWdlOiAnc2hvd1VzZXJNYXJrc0ljb24nIj48L2Rpdj48c3BhbiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTdW1tYXJ5Vmlld19TaG93TWFya3NCdXR0b25MYWJlbCciPjwvc3Bhbj48L2J1dHRvbj48L2xpPjwhLS0gL2tvIC0tPjxsaT48YnV0dG9uIGNsYXNzPSJoeXBlcmxpbmstYnV0dG9uIiByb2xlPSJsaW5rIiBkYXRhLWJpbmQ9ImNsaWNrOiBvblNob3dUcmltbWVkQ2FsbFRyZWUsIG9uRW50ZXI6IG9uU2hvd1RyaW1tZWRDYWxsVHJlZSI+PGRpdiBjbGFzcz0iaWNvbiIgZGF0YS1iaW5kPSJzdmdJbWFnZTogJ3Nob3dUcmltbWVkQ2FsbFRyZWVJY29uJyI+PC9kaXY+PHNwYW4gZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnU3VtbWFyeVZpZXdfVHJpbW1lZENhbGxUcmVlQnV0dG9uTGFiZWwnIj48L3NwYW4+PC9idXR0b24+PC9saT48bGk+PGJ1dHRvbiBjbGFzcz0iaHlwZXJsaW5rLWJ1dHRvbiIgcm9sZT0ibGluayIgZGF0YS1iaW5kPSJjbGljazogb25Db21wYXJlUmVwb3J0cywgb25FbnRlcjogb25Db21wYXJlUmVwb3J0cyI+PGRpdiBjbGFzcz0iaWNvbiIgZGF0YS1iaW5kPSJzdmdJbWFnZTogJ2NvbXBhcmVSZXBvcnRzSWNvbiciPjwvZGl2PjxzcGFuIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X0NvbXBhcmVSZXBvcnRzQnV0dG9uTGFiZWwnIj48L3NwYW4+PC9idXR0b24+PC9saT48bGk+PGJ1dHRvbiBjbGFzcz0iaHlwZXJsaW5rLWJ1dHRvbiIgcm9sZT0ibGluayIgZGF0YS1iaW5kPSJjbGljazogb25FeHBvcnRSZXBvcnREYXRhLCBvbkVudGVyOiBvbkV4cG9ydFJlcG9ydERhdGEiPjxkaXYgY2xhc3M9Imljb24iIGRhdGEtYmluZD0ic3ZnSW1hZ2U6ICdleHBvcnREYXRhSWNvbiciPjwvZGl2PjxzcGFuIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X0V4cG9ydFJlcG9ydEJ1dHRvbkxhYmVsJyI+PC9zcGFuPjwvYnV0dG9uPjwvbGk+PGxpPjxidXR0b24gY2xhc3M9Imh5cGVybGluay1idXR0b24iIHJvbGU9ImxpbmsiIGRhdGEtYmluZD0iY2xpY2s6IG9uU2F2ZUFuYWx5emVkUmVwb3J0LCBvbkVudGVyOiBvblNhdmVBbmFseXplZFJlcG9ydCI+PGRpdiBjbGFzcz0iaWNvbiIgZGF0YS1iaW5kPSJzdmdJbWFnZTogJ3NhdmVJY29uJyI+PC9kaXY+PHNwYW4gZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnU3VtbWFyeVZpZXdfU2F2ZVJlcG9ydEJ1dHRvbkxhYmVsJyI+PC9zcGFuPjwvYnV0dG9uPjwvbGk+PGxpPjxidXR0b24gY2xhc3M9Imh5cGVybGluay1idXR0b24iIHJvbGU9ImxpbmsiIGRhdGEtYmluZD0iY2xpY2s6IG9uVG9nZ2xlRnVsbHNjcmVlbiwgb25FbnRlcjogb25Ub2dnbGVGdWxsc2NyZWVuIj48ZGl2IGNsYXNzPSJpY29uIiBkYXRhLWJpbmQ9InN2Z0ltYWdlOiAndG9nZ2xlRnVsbHNjcmVlbkljb24nIj48L2Rpdj48c3BhbiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdTdW1tYXJ5Vmlld19Ub2dnbGVGdWxsU2NyZWVuQnV0dG9uTGFiZWwnIj48L3NwYW4+PC9idXR0b24+PC9saT48bGk+PGJ1dHRvbiBjbGFzcz0iaHlwZXJsaW5rLWJ1dHRvbiIgcm9sZT0ibGluayIgZGF0YS1iaW5kPSJjbGljazogb25TZXRTeW1ib2xQYXRoLCBvbkVudGVyOiBvblNldFN5bWJvbFBhdGgiPjxkaXYgY2xhc3M9Imljb24iIGRhdGEtYmluZD0ic3ZnSW1hZ2U6ICdzZXRTeW1ib2xQYXRoSWNvbiciPjwvZGl2PjxzcGFuIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ1N1bW1hcnlWaWV3X1NldFN5bWJvbFBhdGhCdXR0b25MYWJlbCciPjwvc3Bhbj48L2J1dHRvbj48L2xpPjwvdWw+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+"; });
define("TierInteractionsView", [], function () { return "PCEtLSBrbyBpZm5vdDogdGllckludGVyYWN0aW9ucyAtLT48IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6ICdMb2FkaW5nJyB9IC0tPjwhLS0gL2tvIC0tPjwhLS0gL2tvIC0tPjwhLS0ga28gaWY6IHRpZXJJbnRlcmFjdGlvbnMgLS0+PGRpdiBjbGFzcz0idGllckludGVyYWN0aW9uc1ZpZXcgY3VycmVudFZpZXciPjxkaXYgY2xhc3M9InRpZXJJbnRlcmFjdGlvbnMiIGRhdGEtYmluZD0idGVtcGxhdGU6IHsgbmFtZTogJ1RyZWVHcmlkVmlldycsIGRhdGE6IHRpZXJJbnRlcmFjdGlvbnMsIGFmdGVyUmVuZGVyOiB0aWVySW50ZXJhY3Rpb25zKCkub25BZnRlckRvbUluc2VydC5iaW5kKCRkYXRhKSB9LGV2ZW50OiB7IGtleWRvd246IG9uS2V5RG93bk1haW4gfSxkeW5hbWljQ29udGV4dE1lbnU6IGNvbnRleHRNZW51TWFpbiI+PC9kaXY+PCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiAnTG9hZGluZycsIGlmOiB0aWVySW50ZXJhY3Rpb25zKCkuZGF0YUxvYWRTdGF0dXMoKSAhPT0gRGF0YUxvYWRFdmVudC5EYXRhTG9hZENvbXBsZXRlZCB8fCB0aWVySW50ZXJhY3Rpb25zKCkuaGVhZGVyLmNvbHVtbkNvbmZpZ0xvYWRTdGF0dXMoKSAhPT0gRGF0YUxvYWRFdmVudC5EYXRhTG9hZENvbXBsZXRlZCB9IC0tPjwhLS0gL2tvIC0tPjxkaXYgY2xhc3M9ImRhdGFiYXNlQ29tbWFuZHNUaXRsZSIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnVGllckludGVyYWN0aW9uc19EYXRhYmFzZUNvbW1hbmRzVGFibGVUaXRsZSciPjwvZGl2PjxkaXYgY2xhc3M9ImRldGFpbHNQYW5lbCI+PCEtLSBrbyBpZjogc2hvd092ZXJsYXktLT48ZGl2IGNsYXNzPSJvdmVybGF5Ij48c3BhbiBkYXRhLWJpbmQ9ImxvY2FsaXplZFRleHQ6ICdUaWVySW50ZXJhY3Rpb25zX1NlbGVjdERhdGFiYXNlQ29ubmVjdGlvbiciPjwvc3Bhbj48YSByb2xlPSJsaW5rIiB0YWJpbmRleD0iMCIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRUZXh0OiAnVGllckludGVyYWN0aW9uc19MZWFybkFib3V0VGllckludGVyYWN0aW9uc1ZpZXcnLGNsaWNrOiBzaG93SGVscCxvbkVudGVyOiBzaG93SGVscCI+PC9hPjwvZGl2PjwhLS0gL2tvIC0tPjwhLS0ga28gaWZub3Q6IHNob3dPdmVybGF5IC0tPjxkaXYgY2xhc3M9ImRhdGFiYXNlQ29tbWFuZHMiIGRhdGEtYmluZD0idGVtcGxhdGU6IHsgbmFtZTogJ1RyZWVHcmlkVmlldycsIGRhdGE6IGRhdGFiYXNlQ29tbWFuZHMsIGFmdGVyUmVuZGVyOiBkYXRhYmFzZUNvbW1hbmRzKCkub25BZnRlckRvbUluc2VydC5iaW5kKCRkYXRhKSB9LGV2ZW50OiB7IGtleWRvd246IG9uS2V5RG93bkRldGFpbHMgfSxkeW5hbWljQ29udGV4dE1lbnU6IGNvbnRleHRNZW51RGV0YWlscyI+PC9kaXY+PCEtLSAva28gLS0+PC9kaXY+PC9kaXY+PCEtLSAva28gLS0+"; });
define("ToggleButtonView", [], function () { return "PGJ1dHRvbiBjbGFzcz0idG9nZ2xlQnV0dG9uIiBkYXRhLWJpbmQ9ImxvY2FsaXplZEFyaWFMYWJlbDogYXJpYUxhYmVsLGxvY2FsaXplZFRvb2x0aXA6IGFyaWFMYWJlbCxjbGljazogb25DbGljayxvbkVudGVyOiBvbkNsaWNrLGNzczogeyBjaGVja2VkOiBpc0NoZWNrZWQsIGVuYWJsZWQ6IGlzRW5hYmxlZCB9LGF0dHI6IHsgJ2FyaWEtcHJlc3NlZCc6IGlzQ2hlY2tlZCwgJ2FyaWEtZGlzYWJsZWQnOiAhaXNFbmFibGVkKCkgfSI+PGRpdiBjbGFzcz0iaWNvbiIgZGF0YS1iaW5kPSJzdmdJbWFnZTogc3ZnSWNvbiI+PC9kaXY+PC9idXR0b24+"; });
define("ToolbarItemView", [], function () { return "PGJ1dHRvbiBkYXRhLWJpbmQ9ImxvY2FsaXplZEFyaWFMYWJlbDogYXJpYUxhYmVsLCBsb2NhbGl6ZWRUb29sdGlwOiBhcmlhTGFiZWwsIGNsaWNrOiBjYWxsYmFjaywgb25FbnRlcjogY2FsbGJhY2siPjxkaXYgY2xhc3M9Imljb24iIGRhdGEtYmluZD0ic3ZnSW1hZ2U6IHN2Z0ljb24iPjwvZGl2PjwvYnV0dG9uPg=="; });
define("TreeGridView", [], function () { return "PGRpdiBjbGFzcz0idHJlZUdyaWRDb250YWluZXIiPjxkaXYgY2xhc3M9InRyZWVHcmlkSGVhZGVyIj48dGFibGUgcm9sZT0idHJlZWdyaWQiIGRhdGEtYmluZD0id2l0aDogaGVhZGVyIj48dGhlYWQgcm9sZT0icm93Z3JvdXAiIGRhdGEtYmluZD0idmlzaWJpbGl0eUNvbnRleHRNZW51OiB2aXNpYmlsaXR5Q29udGV4dE1lbnVCaW5kaW5nIj48dHIgcm9sZT0icm93IiBkYXRhLWJpbmQ9ImFycmFuZ2VhYmxlQ29sdW1uczogY29sdW1uT3JkZXIsIGZvcmVhY2g6IGNvbHVtbnMsIHJlb3JkZXJIZWFkZXJDb2x1bW5zOiBjb2x1bW5PcmRlciI+PHRoIHJvbGU9ImNvbHVtbmhlYWRlciIgZGF0YS1iaW5kPSJ0ZXh0OiB0ZXh0LGNzczogaWQsdG9vbHRpcDogdG9vbHRpcCxhdHRyOiB7ICdkYXRhLWNvbHVtbmlkJzogaWQgfSxqdXN0aWZpY2F0aW9uOiBqdXN0aWZpY2F0aW9uLHNvcnRhYmxlOiB0eXBlb2Ygc29ydGFibGUgIT09ICd1bmRlZmluZWQnID8geyBzb3J0Q29sdW1uSWQ6IGlkLCBjdXJyZW50Q29sdW1uOiAkcGFyZW50LnNvcnRDb2x1bW5JZCwgY3VycmVudERpcmVjdGlvbjogJHBhcmVudC5zb3J0RGlyZWN0aW9uLCBkZWZhdWx0RGlyZWN0aW9uOiBzb3J0YWJsZSB9IDogbnVsbCI+PC90aD48L3RyPjwvdGhlYWQ+PC90YWJsZT48L2Rpdj48ZGl2IGNsYXNzPSJ0cmVlR3JpZEJvZHkiIGRhdGEtYmluZD0iZm9jdXNlZFJvdzogeyByb3dzOiB0cmVlQXNBcnJheSwgc2VsZWN0ZWQ6IHNlbGVjdGVkUm93cywgZm9jdXNlZDogZm9jdXNlZFJvd0luZGV4IH0iPjx0YWJsZSByb2xlPSJ0cmVlZ3JpZCIgZGF0YS1iaW5kPSJsb2NhbGl6ZWRBcmlhTGFiZWw6IGFyaWFMYWJlbFRva2VuIj48dGhlYWQgcm9sZT0icm93Z3JvdXAiIGRhdGEtYmluZD0id2l0aDogaGVhZGVyIj48dHIgcm9sZT0icm93IiBkYXRhLWJpbmQ9ImZvcmVhY2g6IGNvbHVtbnMsIHJlb3JkZXJIZWFkZXJDb2x1bW5zOiBjb2x1bW5PcmRlciI+PHRoIHJvbGU9ImNvbHVtbmhlYWRlciIgZGF0YS1iaW5kPSJ0ZXh0OiB0ZXh0LGF0dHI6IHsgJ2RhdGEtY29sdW1uaWQnOiBpZCB9LHNvcnRhYmxlOiB0eXBlb2Ygc29ydGFibGUgIT09ICd1bmRlZmluZWQnID8geyBzb3J0Q29sdW1uSWQ6IGlkLCBjdXJyZW50Q29sdW1uOiAkcGFyZW50LnNvcnRDb2x1bW5JZCwgY3VycmVudERpcmVjdGlvbjogJHBhcmVudC5zb3J0RGlyZWN0aW9uLCBkZWZhdWx0RGlyZWN0aW9uOiBzb3J0YWJsZSB9IDogbnVsbCI+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5IHJvbGU9InJvd2dyb3VwIiB0YWJpbmRleD0iMCIgYXJpYS1yZWFkb25seT0idHJ1ZSIgYXJpYS1tdWx0aXNlbGVjdGFibGU9InRydWUiIGRhdGEtYmluZD0ibG9jYWxpemVkQXJpYUxhYmVsOiBhcmlhTGFiZWxUb2tlbixtdWx0aUNsaWNrOiB7IGNsaWNrOiBvbkNsaWNrLCBkYmxjbGljazogb25EYmxDbGljayB9LGV2ZW50OiB7IGtleWRvd246IG9uS2V5RG93biB9LHZpcnR1YWxpemVkRm9yRWFjaDogeyByb3dzOiB0cmVlQXNBcnJheSwgc2Nyb2xsVG9wOiBzY3JvbGxUb3AsIGNsaWVudEhlaWdodDogY2xpZW50SGVpZ2h0LCBjb2x1bW5PcmRlcjogaGVhZGVyLmNvbHVtbk9yZGVyIH0iPjwvdGJvZHk+PC90YWJsZT48L2Rpdj48L2Rpdj4="; });

// SIG // Begin signature block
// SIG // MIIoQQYJKoZIhvcNAQcCoIIoMjCCKC4CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // ZLQF1uOAvrQKm9k7c97JmuE41XVKcrdleDVq9EZ3Bheg
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
// SIG // a/15n8G9bW1qyVJzEw16UM0xghojMIIaHwIBATCBlTB+
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAE
// SIG // BGx0Bv9XKydyAAAAAAQEMA0GCWCGSAFlAwQCAQUAoIGu
// SIG // MBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwGCisG
// SIG // AQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3
// SIG // DQEJBDEiBCDdjRf5Fjyf9E/VhnrSVyXyoxvHcnU8m4pL
// SIG // EaZW9q9rbzBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAGXWeIXa
// SIG // ZSc6/4m9GiHpCZ+Hr5kk5abPqYOzMDXI94HgWPCv5pxV
// SIG // qcxcnYBm8Yqm4MtZQHG/sf0LFI/msWYVUlw1+26LMA0p
// SIG // I9R4rG0CfBD5uEU2xHM2BqlRy36t+aWKyBmjdJ/+mfd8
// SIG // iaf0JzhyVEzPedR9zINKDP2oQENMFbUii2VjqABsvo8w
// SIG // Zy48iEa57Zo/tjBAp+eBDe8bsZtTCL6F0TJstqeRx+WI
// SIG // uPmfrkf1VkELGU3iAdmTL+HZQyNrIvJGOi99YX4vL3ju
// SIG // ZurED6l+RP2h5JMaXUAUDkJtF4gAK7NvQebYuUiPRzq6
// SIG // /2sfb2dSBJAmHwyU2g4zN4Kw5JehghetMIIXqQYKKwYB
// SIG // BAGCNwMDATGCF5kwgheVBgkqhkiG9w0BBwKggheGMIIX
// SIG // ggIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBWgYLKoZIhvcN
// SIG // AQkQAQSgggFJBIIBRTCCAUECAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgiDBF3+/OQ9myvg7Si6Mq
// SIG // 82pwf+GSuXZ6LTLDMjdvV5kCBmditL4rHBgTMjAyNTAx
// SIG // MTYxODE1MDUuMDY0WjAEgAIB9KCB2aSB1jCB0zELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWljcm9zb2Z0
// SIG // IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVkMScwJQYD
// SIG // VQQLEx5uU2hpZWxkIFRTUyBFU046MzYwNS0wNUUwLUQ5
// SIG // NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFNlcnZpY2WgghH7MIIHKDCCBRCgAwIBAgITMwAAAfdY
// SIG // IHUEyvvC9AABAAAB9zANBgkqhkiG9w0BAQsFADB8MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0yNDA3MjUx
// SIG // ODMxMDZaFw0yNTEwMjIxODMxMDZaMIHTMQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMS0wKwYDVQQLEyRNaWNyb3NvZnQgSXJl
// SIG // bGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNVBAsT
// SIG // Hm5TaGllbGQgVFNTIEVTTjozNjA1LTA1RTAtRDk0NzEl
// SIG // MCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vy
// SIG // dmljZTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBANDnR0wTaJuv7lymhCj/azyE5E+kMRddbY8wdDZN
// SIG // W8g6T6xUx4Wt4ccEnU3K/GNGt5OhEJcKsukTs+NntEeX
// SIG // g1vnQqEGqYqQyBVDmKd6DbqsF/8XqQExJGNezMlxceq0
// SIG // FtjXFlCVt0KNgLidBzrW5UqSLUGTxph5xqpLfwweORcM
// SIG // ZOlaEr8TXECoShE5Ls67fFOg0XHEJtRXYZjyoA84HHwz
// SIG // zOaPhp824jLustOvQOBB5izJpHnEpFbwZnGfFZ8xR0w5
// SIG // Bi3aZw1eRV41TmwIG0jNHJ6mEhn0ae1RhwUasqLHL0eG
// SIG // 3EPglfaQ42yekua2Z9bgPIUYY9PR7N9x0Xr7eKFgFWBi
// SIG // LYBLBvgawmG6YFjAxCFZwID2RIjwGiPMARnphOH3hJLs
// SIG // +0wMIJEQXFMy4EOLrz6kQ9QPiZLduvqQ6lmEp9DAPI9M
// SIG // 2nEJPavwL3Ij1w/SLdns/pqhM4BUUbCRi7XH/R5LLyvC
// SIG // bHeiOcxUoZaouW6c39WODTojToeUMFtaSLwOYq5Wpe6h
// SIG // YZAHnnmapqKfPrjcWV8RQkBt0d7OaV1vPRYgofa5l61a
// SIG // jgsIHFxSCUAEJJZSrCPlCahqva5kQASc+ZRykxWJhcHD
// SIG // Odillozcd8+qHcM9ofrMWsXsE6HvRqrQ8d/2lPsqjUXA
// SIG // fMNLUl1H/spTeLpOcRxKS6cfmTTbAgMBAAGjggFJMIIB
// SIG // RTAdBgNVHQ4EFgQU30akMz95vT2Vri39afP5nhX5Jpgw
// SIG // HwYDVR0jBBgwFoAUn6cVXQBeYl2D9OXSZacbUzUZ6XIw
// SIG // XwYDVR0fBFgwVjBUoFKgUIZOaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tL3BraW9wcy9jcmwvTWljcm9zb2Z0JTIw
// SIG // VGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3JsMGwG
// SIG // CCsGAQUFBwEBBGAwXjBcBggrBgEFBQcwAoZQaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jZXJ0cy9N
// SIG // aWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIwMjAx
// SIG // MCgxKS5jcnQwDAYDVR0TAQH/BAIwADAWBgNVHSUBAf8E
// SIG // DDAKBggrBgEFBQcDCDAOBgNVHQ8BAf8EBAMCB4AwDQYJ
// SIG // KoZIhvcNAQELBQADggIBADdGo2nyC3i+kkCDCDAFzNUH
// SIG // esWqHItpjq6UfLylssk7C92/NwO1xi4gG0MU66p171Vl
// SIG // njbLeWEA/LGjvlE4DiyXU3X1AA4S16CvkZcI353YpiCU
// SIG // /TB/bVGFy8yVyoWTNPaLj8DbK5/GDiyKXQIuUz8jfApd
// SIG // dThmUpT/a/CZ76JltNAKCeD5fa5YNBuZXEJJwF6h2vZ0
// SIG // HVqdWcV6jXftCbCppUfLXADV99wpTPTZ2gpSRMS0B4in
// SIG // h1FFrasizJeuU1usETO15Re2Pj05wvHbjVp+Li54Pjjf
// SIG // 2d/RjuqgY+yBGcaKuKN2rxIfW2uN1FOk4M1WWgZvFWgN
// SIG // MEsFHv6aqUzmBVjetly94JfyQtqc3yD8T+ul30SyMWn4
// SIG // wVV5vClQ59nDC/SL0StNrPeNWOfkUeIEgDoS4kEOgNN1
// SIG // TUbqfrKTGtJPl0zwIvtmjB+cWtWY2/yvLvX/TNOVNP21
// SIG // DCVyQz/vsrFqSW1UQ4hxu7M2nGvq9x4lD40CckJdjYjn
// SIG // GExlfw3C6ywgStsxudNxRm9ODeSn9dF4AMBWl5aHeQfX
// SIG // iofeT51ysdizQYC8BvOWp5YYRscQUOZhbCRpAZ9D2T7Q
// SIG // M2cn6/eqsc6adqR/QySXIygg6zJmc4l2s6WuVVTd+gjt
// SIG // ZA1OAAZEmE1zjPEZiV7kJu5lBd21po/oYwCW+Kc+oU+V
// SIG // MIIHcTCCBVmgAwIBAgITMwAAABXF52ueAptJmQAAAAAA
// SIG // FTANBgkqhkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEyMDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2Vy
// SIG // dGlmaWNhdGUgQXV0aG9yaXR5IDIwMTAwHhcNMjEwOTMw
// SIG // MTgyMjI1WhcNMzAwOTMwMTgzMjI1WjB8MQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBQQ0EgMjAxMDCCAiIwDQYJKoZIhvcNAQEB
// SIG // BQADggIPADCCAgoCggIBAOThpkzntHIhC3miy9ckeb0O
// SIG // 1YLT/e6cBwfSqWxOdcjKNVf2AX9sSuDivbk+F2Az/1xP
// SIG // x2b3lVNxWuJ+Slr+uDZnhUYjDLWNE893MsAQGOhgfWpS
// SIG // g0S3po5GawcU88V29YZQ3MFEyHFcUTE3oAo4bo3t1w/Y
// SIG // JlN8OWECesSq/XJprx2rrPY2vjUmZNqYO7oaezOtgFt+
// SIG // jBAcnVL+tuhiJdxqD89d9P6OU8/W7IVWTe/dvI2k45GP
// SIG // sjksUZzpcGkNyjYtcI4xyDUoveO0hyTD4MmPfrVUj9z6
// SIG // BVWYbWg7mka97aSueik3rMvrg0XnRm7KMtXAhjBcTyzi
// SIG // YrLNueKNiOSWrAFKu75xqRdbZ2De+JKRHh09/SDPc31B
// SIG // mkZ1zcRfNN0Sidb9pSB9fvzZnkXftnIv231fgLrbqn42
// SIG // 7DZM9ituqBJR6L8FA6PRc6ZNN3SUHDSCD/AQ8rdHGO2n
// SIG // 6Jl8P0zbr17C89XYcz1DTsEzOUyOArxCaC4Q6oRRRuLR
// SIG // vWoYWmEBc8pnol7XKHYC4jMYctenIPDC+hIK12NvDMk2
// SIG // ZItboKaDIV1fMHSRlJTYuVD5C4lh8zYGNRiER9vcG9H9
// SIG // stQcxWv2XFJRXRLbJbqvUAV6bMURHXLvjflSxIUXk8A8
// SIG // FdsaN8cIFRg/eKtFtvUeh17aj54WcmnGrnu3tz5q4i6t
// SIG // AgMBAAGjggHdMIIB2TASBgkrBgEEAYI3FQEEBQIDAQAB
// SIG // MCMGCSsGAQQBgjcVAgQWBBQqp1L+ZMSavoKRPEY1Kc8Q
// SIG // /y8E7jAdBgNVHQ4EFgQUn6cVXQBeYl2D9OXSZacbUzUZ
// SIG // 6XIwXAYDVR0gBFUwUzBRBgwrBgEEAYI3TIN9AQEwQTA/
// SIG // BggrBgEFBQcCARYzaHR0cDovL3d3dy5taWNyb3NvZnQu
// SIG // Y29tL3BraW9wcy9Eb2NzL1JlcG9zaXRvcnkuaHRtMBMG
// SIG // A1UdJQQMMAoGCCsGAQUFBwMIMBkGCSsGAQQBgjcUAgQM
// SIG // HgoAUwB1AGIAQwBBMAsGA1UdDwQEAwIBhjAPBgNVHRMB
// SIG // Af8EBTADAQH/MB8GA1UdIwQYMBaAFNX2VsuP6KJcYmjR
// SIG // PZSQW9fOmhjEMFYGA1UdHwRPME0wS6BJoEeGRWh0dHA6
// SIG // Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1
// SIG // Y3RzL01pY1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNybDBa
// SIG // BggrBgEFBQcBAQROMEwwSgYIKwYBBQUHMAKGPmh0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWlj
// SIG // Um9vQ2VyQXV0XzIwMTAtMDYtMjMuY3J0MA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQCdVX38Kq3hLB9nATEkW+Geckv8qW/q
// SIG // XBS2Pk5HZHixBpOXPTEztTnXwnE2P9pkbHzQdTltuw8x
// SIG // 5MKP+2zRoZQYIu7pZmc6U03dmLq2HnjYNi6cqYJWAAOw
// SIG // Bb6J6Gngugnue99qb74py27YP0h1AdkY3m2CDPVtI1Tk
// SIG // eFN1JFe53Z/zjj3G82jfZfakVqr3lbYoVSfQJL1AoL8Z
// SIG // thISEV09J+BAljis9/kpicO8F7BUhUKz/AyeixmJ5/AL
// SIG // aoHCgRlCGVJ1ijbCHcNhcy4sa3tuPywJeBTpkbKpW99J
// SIG // o3QMvOyRgNI95ko+ZjtPu4b6MhrZlvSP9pEB9s7GdP32
// SIG // THJvEKt1MMU0sHrYUP4KWN1APMdUbZ1jdEgssU5HLcEU
// SIG // BHG/ZPkkvnNtyo4JvbMBV0lUZNlz138eW0QBjloZkWsN
// SIG // n6Qo3GcZKCS6OEuabvshVGtqRRFHqfG3rsjoiV5PndLQ
// SIG // THa1V1QJsWkBRH58oWFsc/4Ku+xBZj1p/cvBQUl+fpO+
// SIG // y/g75LcVv7TOPqUxUYS8vwLBgqJ7Fx0ViY1w/ue10Cga
// SIG // iQuPNtq6TPmb/wrpNPgkNWcr4A245oyZ1uEi6vAnQj0l
// SIG // lOZ0dFtq0Z4+7X6gMTN9vMvpe784cETRkPHIqzqKOghi
// SIG // f9lwY1NNje6CbaUFEMFxBmoQtB1VM1izoXBm8qGCA1Yw
// SIG // ggI+AgEBMIIBAaGB2aSB1jCB0zELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEtMCsGA1UECxMkTWljcm9zb2Z0IElyZWxhbmQg
// SIG // T3BlcmF0aW9ucyBMaW1pdGVkMScwJQYDVQQLEx5uU2hp
// SIG // ZWxkIFRTUyBFU046MzYwNS0wNUUwLUQ5NDcxJTAjBgNV
// SIG // BAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2Wi
// SIG // IwoBATAHBgUrDgMCGgMVAG9vCgxv8V2zQY5jO/56sN24
// SIG // KxDmoIGDMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEm
// SIG // MCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENB
// SIG // IDIwMTAwDQYJKoZIhvcNAQELBQACBQDrM20vMCIYDzIw
// SIG // MjUwMTE2MTEzNDA3WhgPMjAyNTAxMTcxMTM0MDdaMHQw
// SIG // OgYKKwYBBAGEWQoEATEsMCowCgIFAOszbS8CAQAwBwIB
// SIG // AAICJ5UwBwIBAAICEtAwCgIFAOs0vq8CAQAwNgYKKwYB
// SIG // BAGEWQoEAjEoMCYwDAYKKwYBBAGEWQoDAqAKMAgCAQAC
// SIG // AwehIKEKMAgCAQACAwGGoDANBgkqhkiG9w0BAQsFAAOC
// SIG // AQEAJszxwTe+PwMiuPBxhVuzn9cWpdxK0Dtp+obkmM0u
// SIG // h6x16FurjbB9v/T419DU71unWIZEM+b/hYSkVr8yPy/E
// SIG // R2Fi8ZBvhuXbkZWLKmmO0xnnTRh9ekefPswv5tQlrivQ
// SIG // 6O5FpV1N8bQc/ILW8nKnUkczoFH3SjOj3W+Pv13RQ51t
// SIG // GQa4om5U/F1p8+qfW5ioI3GEuPcp2PPmYJK8+BJAjpq4
// SIG // 6hhqlgkymUNUZvlEUBZo5OH2EPT2inqM5GX6NbkcStlP
// SIG // lcUJVjLdlq+g3F5bpp2Xykwd+1+bC8zXQ48f2Cw1K2ng
// SIG // SXWf88TUFb7Q83o1espzutbya9gsBBq69lfMfDGCBA0w
// SIG // ggQJAgEBMIGTMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwAhMzAAAB91ggdQTK+8L0AAEAAAH3MA0GCWCGSAFl
// SIG // AwQCAQUAoIIBSjAaBgkqhkiG9w0BCQMxDQYLKoZIhvcN
// SIG // AQkQAQQwLwYJKoZIhvcNAQkEMSIEIM9PCfByeeVk3TGI
// SIG // a3vewTWqd72LNbBjRUNu1dEXT+TgMIH6BgsqhkiG9w0B
// SIG // CRACLzGB6jCB5zCB5DCBvQQgIdqY2mt3GtHnGLobutLm
// SIG // Bz/yCpz23nW1UCeUqCB+WeIwgZgwgYCkfjB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAfdYIHUEyvvC
// SIG // 9AABAAAB9zAiBCCH/+BLGLc3kC4/KBT2gfF5ia62piIR
// SIG // zFvbdqk+IGySCDANBgkqhkiG9w0BAQsFAASCAgB48gZq
// SIG // SOe6NE7PExca7/vXzXqBEA9qpwHnI4Ix0r225pkqQO+s
// SIG // UGyZwoNb8ex5Bj26b8zGyFLyaNf3X4hQVEGY3pRp/PW/
// SIG // kL4+RnGonZprFQdZXZkEiFZ5V/BVTk0FsP2prFzrCyNF
// SIG // QrdtbUuDAOa3PwhQxJfECHwbS/iHWXiytCjE404K1atx
// SIG // hC/FSL1JxdU7qGkA/q19imSSDjnk9Dqer7vRqrwiFP4D
// SIG // 6ng37UWKZ0aem64pZH/pUDf4xLN6+qVSS5O3W2tjEYVh
// SIG // fLfzeCeQd6KVX1XbFIpPQ8UFrEshxiFmG109BS6jqVCp
// SIG // z2shtfuu1ZA0AuGpB7KGCKeZPFSnBM9CcyPlxzTfs6Ge
// SIG // wONRDWfTeyPTfoyYaJmb2XL7MYaLg+M7n93dD82WNRGw
// SIG // RQHb7wCLf/TUTSzomuZrzX+BdwwdJuZ+Na3EcJKEty+d
// SIG // dafIldggPPgIh/I7DPgTnNobwti8xmCDYn1f/RezUDvj
// SIG // rOpNbqyR2XyAwKoGUQFDSAj0aRUmrKwQ4ctysCQAsT9o
// SIG // kAMXH/V5CJdglELnPUJWg/5M+rTrdhhexfbAIC/16zlD
// SIG // 3UQMyW0CMNQKU7/GrAsUSwQbGGFctoU96Qpy5+moNaEq
// SIG // kHhpmD31eV71PUYtT5MOzgQF3ANresUvnGehPXWwfbr3
// SIG // aZUQ+mF3qcCqU5RBhg==
// SIG // End signature block
