var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Controls/ComponentModel", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObservableCollection = exports.NotifyCollectionChangedEventArgs = exports.NotifyCollectionChangedAction = exports.ObservableViewModel = void 0;
    var ObservableViewModel = /** @class */ (function () {
        function ObservableViewModel() {
            this._propertyChangedObservers = [];
        }
        ObservableViewModel.prototype.registerPropertyChanged = function (observer) {
            this._propertyChangedObservers.push(observer);
        };
        ObservableViewModel.prototype.removePropertyChanged = function (observer) {
            var index = this._propertyChangedObservers.indexOf(observer);
            if (index >= 0) {
                this._propertyChangedObservers = this._propertyChangedObservers.splice(index, 1);
            }
        };
        ObservableViewModel.prototype.raisePropertyChanged = function (propertyName) {
            /// <summary>
            ///     NOTE: To be used only by the derived class. 
            ///     Raise the propertyChanged event on the given property name.
            /// </summary>
            for (var i = 0; i < this._propertyChangedObservers.length; i++) {
                this._propertyChangedObservers[i].onPropertyChanged(propertyName);
            }
        };
        return ObservableViewModel;
    }());
    exports.ObservableViewModel = ObservableViewModel;
    var NotifyCollectionChangedAction;
    (function (NotifyCollectionChangedAction) {
        NotifyCollectionChangedAction[NotifyCollectionChangedAction["Add"] = 0] = "Add";
        NotifyCollectionChangedAction[NotifyCollectionChangedAction["Reset"] = 1] = "Reset";
        NotifyCollectionChangedAction[NotifyCollectionChangedAction["Replace"] = 2] = "Replace";
    })(NotifyCollectionChangedAction = exports.NotifyCollectionChangedAction || (exports.NotifyCollectionChangedAction = {}));
    var NotifyCollectionChangedEventArgs = /** @class */ (function () {
        function NotifyCollectionChangedEventArgs(action, newItems, newStartingIndex, oldItems, oldStartingIndex) {
            this._action = action;
            this._newItems = newItems;
            this._newStartingIndex = newStartingIndex;
            this._oldItems = oldItems;
            this._oldStartingIndex = oldStartingIndex;
        }
        Object.defineProperty(NotifyCollectionChangedEventArgs.prototype, "action", {
            get: function () { return this._action; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(NotifyCollectionChangedEventArgs.prototype, "newItems", {
            get: function () { return this._newItems; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(NotifyCollectionChangedEventArgs.prototype, "newStartingIndex", {
            get: function () { return this._newStartingIndex; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(NotifyCollectionChangedEventArgs.prototype, "oldItems", {
            get: function () { return this._oldItems; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(NotifyCollectionChangedEventArgs.prototype, "oldStartingIndex", {
            get: function () { return this._oldStartingIndex; },
            enumerable: false,
            configurable: true
        });
        return NotifyCollectionChangedEventArgs;
    }());
    exports.NotifyCollectionChangedEventArgs = NotifyCollectionChangedEventArgs;
    var ObservableCollection = /** @class */ (function () {
        function ObservableCollection() {
            this._items = [];
            this._collectionChangedObservers = [];
        }
        ObservableCollection.prototype.registerCollectionChanged = function (observer) {
            this._collectionChangedObservers.push(observer);
        };
        ObservableCollection.prototype.removeCollectionChanged = function (observer) {
            var index = this._collectionChangedObservers.indexOf(observer);
            if (index >= 0) {
                this._collectionChangedObservers = this._collectionChangedObservers.splice(index, 1);
            }
        };
        ObservableCollection.prototype.add = function (item) {
            this._items.push(item);
            var args = new NotifyCollectionChangedEventArgs(NotifyCollectionChangedAction.Add, [item], this._items.length - 1, [], 0);
            this.onCollectionChanged(args);
        };
        ObservableCollection.prototype.replace = function (index, newItem) {
            if (index >= 0 && index < this._items.length) {
                var oldItem = this._items[index];
                this._items[index] = newItem;
                var args = new NotifyCollectionChangedEventArgs(NotifyCollectionChangedAction.Replace, [newItem], index, [oldItem], index);
                this.onCollectionChanged(args);
            }
        };
        ObservableCollection.prototype.clear = function () {
            var oldItems = this._items;
            this._items = [];
            var args = new NotifyCollectionChangedEventArgs(NotifyCollectionChangedAction.Reset, [], 0, oldItems, oldItems.length - 1);
            this.onCollectionChanged(args);
        };
        ObservableCollection.prototype.getItem = function (index) {
            return this._items[index];
        };
        Object.defineProperty(ObservableCollection.prototype, "length", {
            get: function () {
                return this._items.length;
            },
            enumerable: false,
            configurable: true
        });
        ObservableCollection.prototype.onCollectionChanged = function (eventArgs) {
            for (var i = 0; i < this._collectionChangedObservers.length; i++) {
                this._collectionChangedObservers[i].onCollectionChanged(eventArgs);
            }
        };
        return ObservableCollection;
    }());
    exports.ObservableCollection = ObservableCollection;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Controls/Control", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Control = void 0;
    // Create a new control with the given root HTMLElement. If the root is not
    // provided, a default <div> root is used.
    var Control = /** @class */ (function () {
        function Control(root) {
            this._rootElement = root;
            if (typeof this._rootElement === "undefined") {
                // We must have a root element to start with, default to a div. 
                // This can change at any time by setting the property rootElement.
                this._rootElement = document.createElement("div");
                this._rootElement.style.width = this._rootElement.style.height = "100%";
            }
            else if (this._rootElement === null) {
                throw new Error(plugin.Resources.getErrorString("JSPerf.1017"));
            }
        }
        Control.prototype.appendChild = function (child) {
            this._rootElement.appendChild(child.rootElement);
            child.parent = this;
        };
        Control.prototype.removeChild = function (child) {
            this._rootElement.removeChild(child.rootElement);
            child.parent = null;
        };
        Object.defineProperty(Control.prototype, "rootElement", {
            get: function () { return this._rootElement; },
            set: function (newRoot) {
                if (!newRoot) {
                    throw new Error(plugin.Resources.getErrorString("JSPerf.1018"));
                }
                var oldRoot = this._rootElement;
                this._rootElement = newRoot;
                if (oldRoot && oldRoot.parentNode) {
                    oldRoot.parentNode.replaceChild(newRoot, oldRoot);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "parent", {
            get: function () { return this._parent; },
            set: function (newParent) {
                if (this._parent !== newParent) {
                    this._parent = newParent;
                    if (this._parent && !this._parent.rootElement.contains(this._rootElement)) {
                        this._parent.appendChild(this);
                    }
                    this.onParentChanged();
                }
            },
            enumerable: false,
            configurable: true
        });
        // overridable
        Control.prototype.onParentChanged = function () {
        };
        return Control;
    }());
    exports.Control = Control;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Controls/TemplateControl", ["require", "exports", "plugin-vs-v2", "Common/Controls/Control"], function (require, exports, plugin, Control_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateControl = void 0;
    // This TemplateControl initializes the control from a template.
    var TemplateControl = /** @class */ (function (_super) {
        __extends(TemplateControl, _super);
        function TemplateControl(templateName) {
            var _this = _super.call(this) || this;
            // Assign the id postfix to use when fixing id's in the template
            _this._idPostfix = TemplateControl._globalIdPostfix++;
            if (templateName) {
                _this.setTemplateFromName(templateName);
            }
            return _this;
        }
        TemplateControl.prototype.setTemplateFromName = function (templateName) {
            var root = this.getTemplateElementCopy(templateName);
            this.adjustElementIds(root);
            this.rootElement = root;
        };
        TemplateControl.prototype.setTemplateFromHTML = function (htmlContent) {
            var root = this.getTemplateElementFromHTML(htmlContent);
            this.adjustElementIds(root);
            this.rootElement = root;
        };
        TemplateControl.prototype.findElement = function (id) {
            var fullId = id + this._idPostfix;
            return this.forAllSelfAndDescendants(this.rootElement, function (elem) {
                if (elem.id && elem.id === fullId) {
                    return false;
                }
                return true;
            });
        };
        TemplateControl.prototype.findElementsByClassName = function (className) {
            var elements = [];
            this.forAllSelfAndDescendants(this.rootElement, function (elem) {
                if (elem.classList && elem.classList.contains(className)) {
                    elements.push(elem);
                }
                return true;
            });
            return elements;
        };
        TemplateControl.prototype.getTemplateElementCopy = function (templateName) {
            var templateElement = document.getElementById(templateName);
            if (!templateElement) {
                throw new Error(plugin.Resources.getErrorString("JSPerf.1023"));
            }
            if (templateElement.tagName.toLowerCase() !== "script") {
                throw new Error(plugin.Resources.getErrorString("JSPerf.1024"));
            }
            return this.getTemplateElementFromHTML(templateElement.innerHTML);
        };
        TemplateControl.prototype.getTemplateElementFromHTML = function (htmlContent) {
            var root = this.getTemplateRootElement();
            root.innerHTML = htmlContent;
            // If the template contains one child, use that as the root instead
            if (root.childElementCount === 1) {
                root = root.firstElementChild;
            }
            return root;
        };
        TemplateControl.prototype.getTemplateRootElement = function () {
            var div = document.createElement("div");
            div.style.width = div.style.height = "100%";
            return div;
        };
        TemplateControl.prototype.adjustElementIds = function (root) {
            // Postfix all id's with the new id
            var idPostfix = this._idPostfix;
            this.forAllSelfAndDescendants(root, function (elem) {
                if (elem.id) {
                    elem.id = elem.id + idPostfix;
                }
                return true;
            });
        };
        TemplateControl.prototype.forAllSelfAndDescendants = function (root, func) {
            // <summary>Executes the given delegate on all the node and all its decendant elements. The callback function needs to return false to break the loop.</summary>
            // <returns>The element at which the loop exit at, or null otherwise.</returns>
            var brokeAtElement = null;
            if (!func(root)) {
                brokeAtElement = root;
            }
            else {
                if (root.children) {
                    var children = root.children;
                    var childrenLength = children.length;
                    for (var i = 0; i < childrenLength; i++) {
                        brokeAtElement = this.forAllSelfAndDescendants(children[i], func);
                        if (brokeAtElement) {
                            break;
                        }
                    }
                }
            }
            return brokeAtElement;
        };
        TemplateControl._globalIdPostfix = 1;
        return TemplateControl;
    }(Control_1.Control));
    exports.TemplateControl = TemplateControl;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/Frame", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Frame = void 0;
    var Frame = /** @class */ (function () {
        function Frame(id) {
            this._id = id;
        }
        Object.defineProperty(Frame.prototype, "id", {
            get: function () {
                return this._id;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Frame.prototype, "timestamp", {
            get: function () {
                return this._timestamp;
            },
            set: function (time) {
                this._timestamp = time;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Frame.prototype, "startTime", {
            get: function () {
                return this._startTime;
            },
            set: function (time) {
                this._startTime = time;
                if (time > this._endTime) {
                    this._endTime = time;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Frame.prototype, "endTime", {
            get: function () {
                return this._endTime;
            },
            set: function (time) {
                this._endTime = time;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Frame.prototype, "screenshotFile", {
            get: function () {
                return this._screenshotFile;
            },
            set: function (filename) {
                this._screenshotFile = filename;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Frame.prototype, "hasScreenshot", {
            get: function () {
                return this._hasScreenshot;
            },
            enumerable: false,
            configurable: true
        });
        return Frame;
    }());
    exports.Frame = Frame;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/FrameTileView", ["require", "exports", "plugin-vs-v2", "Common/Controls/ComponentModel", "Common/Controls/TemplateControl"], function (require, exports, plugin, ComponentModel_1, TemplateControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FrameTileView = exports.FrameTileViewModel = void 0;
    var FrameTileViewModel = /** @class */ (function (_super) {
        __extends(FrameTileViewModel, _super);
        function FrameTileViewModel(summary) {
            var _this = _super.call(this) || this;
            _this._summary = summary;
            return _this;
        }
        Object.defineProperty(FrameTileViewModel.prototype, "summaryData", {
            get: function () {
                return this._summary;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(FrameTileViewModel.prototype, "timeTaken", {
            get: function () {
                var date = new Date(this._summary.timestamp);
                return "(" + date.toLocaleTimeString() + ")";
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(FrameTileViewModel.prototype, "enabled", {
            get: function () { return this._enabled; },
            set: function (v) {
                this._enabled = v;
                this.raisePropertyChanged("enabled");
            },
            enumerable: false,
            configurable: true
        });
        return FrameTileViewModel;
    }(ComponentModel_1.ObservableViewModel));
    exports.FrameTileViewModel = FrameTileViewModel;
    var FrameTileView = /** @class */ (function (_super) {
        __extends(FrameTileView, _super);
        function FrameTileView(controller, model) {
            var _this = _super.call(this, "FrameTileTemplate") || this;
            _this._controller = controller;
            _this._model = model;
            _this._frameTile = _this.findElement("frameTile");
            _this._onDetailsClickHandler = _this.onDetailsClick.bind(_this);
            _this._model.registerPropertyChanged(_this);
            _this._tileHeader = _this.findElement("frameTileHeader");
            _this.findElement("seeFrameDetailsButton").innerText = plugin.Resources.getString("FrameNumberFormat", _this._model.summaryData.id);
            var frameImageNotAvailable = _this.findElement("frameImageNotAvailable");
            if (_this._model.summaryData.screenshotFile && _this._model.summaryData.hasScreenshot) {
                var imgHolder = _this.findElement("frameTileImage");
                imgHolder.addEventListener("dblclick", _this._onDetailsClickHandler);
                imgHolder.src = _this._model.summaryData.screenshotFile;
                frameImageNotAvailable.hidden = true;
            }
            else {
                frameImageNotAvailable.hidden = false;
                frameImageNotAvailable.innerText = plugin.Resources.getString("ScreenshotNotAvailable");
                frameImageNotAvailable.addEventListener("dblclick", _this._onDetailsClickHandler);
            }
            _this.findElement("frameTakenDate").innerText = _this._model.timeTaken;
            _this._detailsButton = _this.findElement("seeFrameDetailsButton");
            _this._detailsButton.addEventListener("click", _this._onDetailsClickHandler);
            _this._detailsButton.addEventListener("keypress", _this._onDetailsClickHandler);
            _this._detailsDisabled = _this.findElement("frameTileTitleDisabled");
            if (_this._detailsDisabled != null)
                _this._detailsDisabled.innerText = _this._detailsButton.innerText;
            return _this;
        }
        FrameTileView.prototype.onPropertyChanged = function (propertyName) {
            switch (propertyName) {
                case "enabled":
                    this.updateLinkState();
                    break;
            }
        };
        FrameTileView.prototype.setFocus = function () {
            this._tileHeader.focus();
        };
        FrameTileView.prototype.onDetailsClick = function (e) {
            this._controller.selectFrame(this._model.summaryData.id);
        };
        FrameTileView.prototype.updateLinkState = function () {
            this._detailsButton.disabled = !this._model.enabled;
            var remove;
            var add;
            remove = this._detailsButton.disabled ? this._detailsDisabled : this._detailsButton;
            add = this._detailsButton.disabled ? this._detailsButton : this._detailsDisabled;
            // Show/Hide the plain text instead of the html link
            if (remove != null) {
                remove.classList.remove("frameTileHidden");
            }
            if (add != null) {
                add.classList.add("frameTileHidden");
            }
        };
        return FrameTileView;
    }(TemplateControl_1.TemplateControl));
    exports.FrameTileView = FrameTileView;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/Session", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HostSessionProxy = void 0;
    //
    // HostSessionProxy provides access to the Session which is implemented in the host
    //
    var HostSessionProxy = /** @class */ (function () {
        function HostSessionProxy() {
            this._sessionProxy = plugin.JSONMarshaler.attachToMarshaledObject("GpuCapture.GpuCaptureSession", {}, true);
        }
        HostSessionProxy.prototype.addViewTypeEventListener = function (callback) {
            this._sessionProxy.addEventListener("viewtypechange", callback);
        };
        HostSessionProxy.prototype.getSessionInfo = function () {
            return this._sessionProxy._call("getSessionInfo");
        };
        HostSessionProxy.prototype.openFrameDetails = function (frameIndex, targetView) {
            return this._sessionProxy._call("openFrameDetails", frameIndex, targetView);
        };
        HostSessionProxy.prototype.getTempFilename = function (baseName) {
            return this._sessionProxy._call("getTempFilename", baseName);
        };
        HostSessionProxy.prototype.save = function () {
            return this._sessionProxy._call("save");
        };
        HostSessionProxy.prototype.addFrameProcessingEventListener = function (callback) {
            this._sessionProxy.addEventListener("frameProcessingComplete", callback);
        };
        HostSessionProxy.prototype.getFrameProcessingResults = function () {
            return this._sessionProxy._call("getFrameProcessingResults");
        };
        HostSessionProxy.prototype.getSessionStartupTime = function () {
            return this._sessionProxy._call("getSessionStartupTime");
        };
        HostSessionProxy.prototype.logCommandUsage = function (commandName, invokeMethod, source) {
            return this._sessionProxy._call("logCommandUsage", commandName, invokeMethod, source);
        };
        HostSessionProxy.prototype.logBeginLoadFrames = function () {
            return this._sessionProxy._call("logBeginLoadFrames");
        };
        HostSessionProxy.prototype.logEndLoadFrames = function () {
            return this._sessionProxy._call("logEndLoadFrames");
        };
        HostSessionProxy.prototype.setScriptedContextId = function (scriptedContextId) {
            return this._sessionProxy._call("setScriptedContextId", scriptedContextId);
        };
        HostSessionProxy.prototype.updateDetailsViewSetting = function (settingName, newValue) {
            return this._sessionProxy._call("updateDetailsViewSetting", settingName, newValue);
        };
        HostSessionProxy.prototype.getMaxFramesToCapture = function () {
            return this._sessionProxy._call("getMaxFramesToCapture");
        };
        HostSessionProxy.prototype.setNumFramesToCapture = function (numFramesToCapture) {
            return this._sessionProxy._call("setNumFramesToCapture", numFramesToCapture);
        };
        HostSessionProxy.prototype.addNumFramesToCaptureChangedEventListener = function (callback) {
            this._sessionProxy.addEventListener("numFramesToCaptureChanged", callback);
        };
        HostSessionProxy.prototype.startCapture = function () {
            return this._sessionProxy._call("startCapture");
        };
        HostSessionProxy.prototype.scriptedSandboxReadyToCapture = function () {
            return this._sessionProxy._call("scriptedSandboxReadyToCapture");
        };
        HostSessionProxy.prototype.selectFrame = function (frame) {
            return this._sessionProxy._call("selectFrame", frame);
        };
        HostSessionProxy.prototype.getFrames = function () {
            return this._sessionProxy._call("getFrames");
        };
        HostSessionProxy.prototype.addFrameCaptureBeginEventListener = function (callback) {
            this._sessionProxy.addEventListener("frameCaptureBegin", callback);
        };
        HostSessionProxy.prototype.addReadyToCaptureEventListener = function (callback) {
            this._sessionProxy.addEventListener("readyToCapture", callback);
        };
        return HostSessionProxy;
    }());
    exports.HostSessionProxy = HostSessionProxy;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/ViewHostBase", ["require", "exports", "plugin-vs-v2", "Capture/Script/Session"], function (require, exports, plugin, Session_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.s_ViewHost = exports.ViewHostBase = void 0;
    var ViewHostBase = /** @class */ (function () {
        function ViewHostBase() {
            this._openCodeMarkers = {};
            exports.s_ViewHost = this;
        }
        Object.defineProperty(ViewHostBase.prototype, "session", {
            get: function () { return this._session; },
            enumerable: false,
            configurable: true
        });
        ViewHostBase.prototype.loadView = function () {
            var _this = this;
            plugin.Messaging.addEventListener("pluginready", function () {
                var session;
                plugin.Tooltip.defaultTooltipContentToHTML = false;
                session = new Session_1.HostSessionProxy();
                _this._session = session;
                _this.initializeErrorReporting();
                plugin.Messaging.addEventListener("close", _this.onClose);
                session.getSessionInfo().then(function (sessionInfo) {
                    _this.initializeView(sessionInfo);
                    _this.onIdle();
                });
            });
        };
        ViewHostBase.prototype.initializeErrorReporting = function () {
            var _this = this;
            // Stop reporting errors to the WER service
            window.onerror = function (message, url, line, column, error) {
                _this.reportError(new Error(message), "Unhandled Error", url, line, column);
                return true;
            };
        };
        ViewHostBase.prototype.onIdle = function () {
            //Plugin.VS.Internal.CodeMarkers.fire(CodeMarkerValues.perfBrowserTools_MemoryProfilerIdle);
        };
        ViewHostBase.prototype.reportError = function (error, additionalInfo, source, line, column) {
            // Depending on the source, the error object will be different
            var message = (error.message || error.description);
            var url = source || "VsGraphics.Capture";
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
            plugin.Diagnostics.reportError(message, url, lineNumber, errorInfo, columnNumber);
        };
        ViewHostBase.prototype.onClose = function () {
            //Plugin.VS.Internal.CodeMarkers.fire(CodeMarkerValues.perfBrowserTools_MemoryProfilerWindowClose);
        };
        ViewHostBase.prototype.initializeView = function (sessionInfo) {
            // Nothing here. The subclasses override it.
        };
        return ViewHostBase;
    }());
    exports.ViewHostBase = ViewHostBase;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/ViewBase", ["require", "exports", "diagnosticsHub", "Common/Controls/ComponentModel", "Common/Controls/TemplateControl", "Capture/Script/FrameTileView", "Capture/Script/ViewHostBase", "Capture/Script/ViewTasks"], function (require, exports, diagnosticsHub_1, ComponentModel_2, TemplateControl_2, FrameTileView_1, ViewHostBase_1, ViewTasks_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = exports.ViewModel = exports.ViewBaseController = void 0;
    var ViewBaseController = /** @class */ (function () {
        function ViewBaseController(session, initializeView) {
            var _this = this;
            if (initializeView === void 0) { initializeView = true; }
            this._screenshotHeight = 150;
            this._screenshotKeepAspectRatio = true;
            this._screenshotWidth = 200;
            // This is the guid of GpuProfilingAgent
            this._agentGuid = new diagnosticsHub_1.Guid("9e5de5fb-d655-401a-86a8-5764c252744d");
            this._activeCollectionAgentTasks = [];
            this.model = new ViewModel();
            // Note: it's up to derived classes to initialize the view.
            var receiver = function (args) {
                _this.onMessageReceived(args);
            };
            this._standardCollector = diagnosticsHub_1.getStandardTransportService();
            if (this._standardCollector) {
                this._standardCollector.addMessageListener(this._agentGuid, receiver);
            }
            this._selectFrameTask = new ViewTasks_1.SelectFrameTask(this, session);
        }
        Object.defineProperty(ViewBaseController.prototype, "isCollectionAgentTaskActive", {
            get: function () {
                return this._activeCollectionAgentTasks.length > 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ViewBaseController.prototype, "isViewBusy", {
            get: function () {
                return this.model.isViewBusy;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ViewBaseController.prototype, "isCapturingFrame", {
            get: function () {
                return this.model.isCapturingFrame;
            },
            set: function (val) {
                this.model.isCapturingFrame = val;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ViewBaseController.prototype, "pendingCaptureCount", {
            get: function () {
                return this.model.pendingCaptureCount;
            },
            set: function (val) {
                this.model.pendingCaptureCount = val;
            },
            enumerable: false,
            configurable: true
        });
        ViewBaseController.prototype.addTask = function (task) {
            this._activeCollectionAgentTasks.push(task);
        };
        ViewBaseController.prototype.selectFrame = function (frame) {
            this._activeCollectionAgentTasks.push(this._selectFrameTask);
            this._selectFrameTask.frame = frame;
            return this._selectFrameTask.start();
        };
        ViewBaseController.prototype.addFrame = function (frame) {
            ViewBaseController._nextIdentifier++;
            this.model.frameSummaryCollection.add(frame);
        };
        ViewBaseController.prototype.reset = function () {
            ViewBaseController._nextIdentifier = 1;
            this.model.frameSummaryCollection.clear();
            ViewHostBase_1.s_ViewHost.onIdle();
        };
        ViewBaseController.prototype.sendStringToCollectionAgent = function (request) {
            return this._standardCollector.sendStringToCollectionAgent(this._agentGuid.toString(), request);
        };
        ViewBaseController.prototype.downloadFile = function (targetFilePath, localFilePath) {
            var transportService = diagnosticsHub_1.getStandardTransportService();
            return transportService.downloadFile(targetFilePath, localFilePath);
        };
        ViewBaseController.prototype.onMessageReceived = function (message) {
            if (message) {
                try {
                    var obj = JSON.parse(message);
                }
                catch (e) {
                    // If we get a non-JSON message here just ignore it
                    return;
                }
                if (obj.eventName) {
                    switch (obj.eventName) {
                        default:
                            break;
                    }
                }
            }
            for (var i = this._activeCollectionAgentTasks.length - 1; i >= 0; i--) {
                if (this._activeCollectionAgentTasks[i].isCompleted(message)) {
                    this._activeCollectionAgentTasks.splice(i, 1);
                }
            }
        };
        ViewBaseController.prototype.completedTask = function (task) {
            var i = this._activeCollectionAgentTasks.indexOf(task);
            if (i >= 0)
                this._activeCollectionAgentTasks.splice(i, 1);
        };
        ViewBaseController.prototype.sendMessage = function (message) {
            this._standardCollector.sendStringToCollectionAgent(this._agentGuid.toString(), message).then(function (response) {
                if (response) {
                    var obj = JSON.parse(response);
                    if (!obj.succeeded) {
                        throw new Error(obj.errorMessage);
                    }
                }
            });
        };
        ViewBaseController.prototype.appIsReadyToCapture = function () {
            this.view.appIsReadyToCapture();
        };
        ViewBaseController._frameChunkSize = 32768;
        ViewBaseController._nextIdentifier = 1;
        return ViewBaseController;
    }());
    exports.ViewBaseController = ViewBaseController;
    var ViewModel = /** @class */ (function (_super) {
        __extends(ViewModel, _super);
        function ViewModel() {
            var _this = _super.call(this) || this;
            _this._warningMessage = "";
            _this._latestFrameError = null;
            _this._isCapturingFrame = false;
            _this._pendingCaptureCount = 0;
            _this._frameSummaryCollection = new ComponentModel_2.ObservableCollection();
            return _this;
        }
        Object.defineProperty(ViewModel.prototype, "frameSummaryCollection", {
            get: function () { return this._frameSummaryCollection; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ViewModel.prototype, "warningMessage", {
            get: function () { return this._warningMessage; },
            set: function (v) {
                if (this._warningMessage !== v) {
                    this._warningMessage = v;
                    this.raisePropertyChanged("warningMessage");
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ViewModel.prototype, "latestFrameError", {
            get: function () { return this._latestFrameError; },
            set: function (v) {
                if (this._latestFrameError !== v) {
                    this._latestFrameError = v;
                    this.raisePropertyChanged("latestFrameError");
                    // Create the WER
                    ViewHostBase_1.s_ViewHost.reportError(v, "FrameCapturingFailure");
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ViewModel.prototype, "isCapturingFrame", {
            get: function () { return this._isCapturingFrame; },
            set: function (v) {
                if (this._isCapturingFrame !== v) {
                    this._isCapturingFrame = v;
                    this.raisePropertyChanged("isCapturingFrame");
                    this.raisePropertyChanged("isViewBusy");
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ViewModel.prototype, "pendingCaptureCount", {
            get: function () {
                return this._pendingCaptureCount;
            },
            set: function (val) {
                if (this._pendingCaptureCount !== val) {
                    this._pendingCaptureCount = val;
                    this.raisePropertyChanged("pendingCaptureCount");
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ViewModel.prototype, "isViewBusy", {
            get: function () { return this._isCapturingFrame; },
            enumerable: false,
            configurable: true
        });
        return ViewModel;
    }(ComponentModel_2.ObservableViewModel));
    exports.ViewModel = ViewModel;
    var View = /** @class */ (function (_super) {
        __extends(View, _super);
        function View(controller, model, template) {
            var _this = _super.call(this, template) || this;
            _this.controller = controller;
            _this.model = model;
            _this.model.registerPropertyChanged(_this);
            _this.model.frameSummaryCollection.registerCollectionChanged(_this);
            _this._frameTileViewModelCollection = [];
            _this.tilesContainer = _this.findElement("tilesContainer");
            _this._warningSection = _this.findElement("warningSection");
            return _this;
        }
        Object.defineProperty(View.prototype, "frameTileViewModelCollection", {
            get: function () {
                return this._frameTileViewModelCollection;
            },
            enumerable: false,
            configurable: true
        });
        View.prototype.onPropertyChanged = function (propertyName) {
            switch (propertyName) {
                case "warningMessage":
                    this.showWarningMessage(this.model.warningMessage);
                    break;
            }
        };
        View.prototype.onCollectionChanged = function (eventArgs) {
            switch (eventArgs.action) {
                case ComponentModel_2.NotifyCollectionChangedAction.Add:
                    this.createTile(eventArgs.newItems[0]);
                    break;
                case ComponentModel_2.NotifyCollectionChangedAction.Reset:
                    this.removeFrameTiles();
                    break;
            }
        };
        View.prototype.removeFrameTiles = function () {
            this._frameTileViewModelCollection = [];
        };
        View.prototype.insertFrameTile = function (tile) {
            // Default is to just append
            this.tilesContainer.appendChild(tile.rootElement);
        };
        View.prototype.createTile = function (frameSummary) {
            // Create the model and the view
            var model = new FrameTileView_1.FrameTileViewModel(frameSummary);
            var newTile = new FrameTileView_1.FrameTileView(this.controller, model);
            this._frameTileViewModelCollection.push(model);
            // Turn off links if we are busy right now
            model.enabled = !this.model.isViewBusy;
            // Call our overload to insert the tile
            this.insertFrameTile(newTile);
        };
        View.prototype.showWarningMessage = function (warning) {
            if (!this._warningSection) {
                return;
            }
            if (warning) {
                this._warningSection.innerHTML = warning;
                this._warningSection.style.display = "inline";
            }
            else {
                this._warningSection.innerHTML = "";
                this._warningSection.style.display = "none";
            }
        };
        View.prototype.appIsReadyToCapture = function () {
            // Implemented by the derived class.
        };
        return View;
    }(TemplateControl_2.TemplateControl));
    exports.View = View;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/CollectionView", ["require", "exports", "plugin-vs-v2", "Capture/Script/ViewBase", "Capture/Script/ViewTasks"], function (require, exports, plugin, ViewBase_1, ViewTasks_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollectionView = exports.CollectionViewController = void 0;
    var CollectionViewController = /** @class */ (function (_super) {
        __extends(CollectionViewController, _super);
        function CollectionViewController(session, initializeView) {
            if (initializeView === void 0) { initializeView = true; }
            var _this = _super.call(this, session, initializeView) || this;
            _this._session = session;
            if (initializeView) {
                _this.view = new CollectionView(_this, _this.model);
            }
            _this._captureFrameTask = new ViewTasks_2.CaptureFrameTask(_this, session);
            return _this;
        }
        CollectionViewController.prototype.captureFrame = function () {
            _super.prototype.addTask.call(this, this._captureFrameTask);
            return this._captureFrameTask.start();
        };
        CollectionViewController.prototype.readyToCapture = function () {
            this._captureFrameTask.setReady();
        };
        CollectionViewController.prototype.getMaxFramesToCapture = function () {
            return this._session.getMaxFramesToCapture();
        };
        CollectionViewController.prototype.setNumFramestoCapture = function (numFramesToCapture) {
            this._session.setNumFramesToCapture(numFramesToCapture);
        };
        return CollectionViewController;
    }(ViewBase_1.ViewBaseController));
    exports.CollectionViewController = CollectionViewController;
    var CollectionView = /** @class */ (function (_super) {
        __extends(CollectionView, _super);
        function CollectionView(controller, model) {
            var _this = _super.call(this, controller, model, "CollectionViewTemplate") || this;
            _this._controller = controller;
            _this._onNumFramesToCaptureChangeHandler = _this.onNumFramesToCaptureChange.bind(_this);
            _this._onFrameClickHandler = _this.onFrameClick.bind(_this);
            var numFramesToCaptureLabel = _this.findElement("numFramesToCaptureLabel");
            numFramesToCaptureLabel.innerText = plugin.Resources.getString("NumFramesToCaptureLabel");
            _this._numFramesToCaptureCombo = _this.findElement("framesToCaptureCombo");
            _this._numFramesToCaptureCombo.setAttribute("aria-label", plugin.Resources.getString("NumFramesToCaptureComboAutomationName"));
            _this._captureFrameTile = _this.findElement("captureFrameTile");
            _this._toolbarCaptureButton = _this.findElement("toolbarCaptureFrameButton");
            _this._toolbarCaptureLabel = _this.findElement("toolbarCaptureFrameLabel");
            _this._toolbarCaptureLabel.innerText = plugin.Resources.getString("CaptureFrame");
            _this._frameProgress = _this.findElement("captureFrameProgress");
            _this._frameButton = _this.findElement("captureFrameButton");
            _this._frameLabel = _this.findElement("captureFrameLabel");
            _this._frameIcon = _this.findElement("captureFrameIcon");
            _this._frameLabel.innerText = plugin.Resources.getString("CaptureFrame");
            _this._frameProgress.innerText = plugin.Resources.getString("Loading");
            _this.toggleProgress(controller.isViewBusy);
            _this.updateCaptureFrameButton();
            _this._controller.getMaxFramesToCapture().then(function (maxFramesToCapture) {
                for (var i = 1; i <= maxFramesToCapture; i++) {
                    var optionElement = document.createElement("option");
                    optionElement.innerText = i.toString();
                    _this._numFramesToCaptureCombo.appendChild(optionElement);
                }
            });
            _this._numFramesToCaptureCombo.addEventListener("change", _this._onNumFramesToCaptureChangeHandler);
            _this._toolbarCaptureButton.addEventListener("click", _this._onFrameClickHandler);
            _this._toolbarCaptureButton.addEventListener("keypress", _this._onFrameClickHandler);
            _this._captureFrameTile.addEventListener("click", _this._onFrameClickHandler);
            _this._captureFrameTile.addEventListener("keypress", _this._onFrameClickHandler);
            _this._captureFrameTile.hidden = true; // Hide until capture is ready, usable; otherwise, clicking it has no effect.
            // Support the "active" state. We can't use the :active pseudostate because it only works
            // on buttons
            _this._captureFrameTile.onmousedown = function () {
                this._captureFrameTile.classList.add("active");
            }.bind(_this);
            _this._captureFrameTile.onmouseup = function () {
                this._captureFrameTile.classList.remove("active");
            }.bind(_this);
            _this._captureFrameTile.onmouseleave = function () {
                this._captureFrameTile.classList.remove("active");
            }.bind(_this);
            return _this;
        }
        CollectionView.prototype.UpdateNumFramesToCaptureSelection = function (numFramesToCapture) {
            if (this._numFramesToCaptureCombo != null) {
                for (var i = 0; i < this._numFramesToCaptureCombo.length; i++) {
                    if (this._numFramesToCaptureCombo[i].innerText == numFramesToCapture.toString()) {
                        this._numFramesToCaptureCombo.selectedIndex = i;
                    }
                }
            }
        };
        CollectionView.prototype.appIsReadyToCapture = function () {
            this._captureFrameTile.hidden = false;
        };
        CollectionView.prototype.onPropertyChanged = function (propertyName) {
            _super.prototype.onPropertyChanged.call(this, propertyName);
            switch (propertyName) {
                case "isCapturingFrame":
                    this.toggleProgress(this.controller.isViewBusy);
                    this.updateCaptureFrameButton();
                    this.updateFrameAnalyzeButtons();
                    break;
            }
        };
        CollectionView.prototype.removeFrameTiles = function () {
            while (this.tilesContainer.hasChildNodes()) {
                this.tilesContainer.removeChild(this.tilesContainer.firstChild);
            }
            this.tilesContainer.appendChild(this._captureFrameTile);
            _super.prototype.removeFrameTiles.call(this);
        };
        CollectionView.prototype.insertFrameTile = function (tile) {
            // For collection, we want to insert tiles before the capture frame tile
            this.tilesContainer.insertBefore(tile.rootElement, this._captureFrameTile);
            // Then make sure the capture frame tile stays visible
            this._captureFrameTile.scrollIntoView(true);
            // Give focus to the new tile so it leaves the capture frame tile
            tile.setFocus();
        };
        CollectionView.prototype.toggleProgress = function (show) {
            if (this._frameProgress) {
                if (show) {
                    this._frameLabel.style.display = "none";
                    this._frameIcon.style.display = "none";
                    this._frameProgress.style.display = "block";
                    this._frameButton.style.display = "none";
                    this._frameButton.setAttribute("aria-label", plugin.Resources.getString("Loading"));
                }
                else {
                    this._frameLabel.style.display = "";
                    this._frameIcon.style.display = "";
                    this._frameProgress.style.display = "none";
                    this._frameButton.style.display = "block";
                    this._frameButton.setAttribute("aria-label", plugin.Resources.getString("CaptureFrame"));
                }
            }
        };
        CollectionView.prototype.onNumFramesToCaptureChange = function (e) {
            var selectElement = e.srcElement;
            var numFramesToCapture = selectElement.options.item(selectElement.selectedIndex).innerText;
            this._controller.setNumFramestoCapture(parseInt(numFramesToCapture));
        };
        CollectionView.prototype.onFrameClick = function (e) {
            this._controller.captureFrame();
        };
        CollectionView.prototype.updateCaptureFrameButton = function () {
            if (this._frameButton) {
                if (!this.model.isViewBusy) {
                    this._frameButton.classList.remove("disabled");
                    this._frameButton.disabled = false;
                }
                else {
                    this._frameButton.disabled = true;
                }
            }
        };
        CollectionView.prototype.updateFrameAnalyzeButtons = function () {
            var _this = this;
            this.frameTileViewModelCollection.forEach(function (m) {
                m.enabled = !_this.model.isViewBusy; // Should fire a property changed event that will cause the link to disable itself
            });
        };
        return CollectionView;
    }(ViewBase_1.View));
    exports.CollectionView = CollectionView;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/ViewTasks", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectFrameTask = exports.GetFramesTask = exports.CaptureFrameTask = void 0;
    var CaptureFrameTask = /** @class */ (function () {
        function CaptureFrameTask(controller, session) {
            this._controller = controller;
            this._session = session;
            this._startedCapture = false;
            this._canCapture = false;
            this._session.addFrameProcessingEventListener(this.onFrameResult.bind(this));
        }
        CaptureFrameTask.prototype.start = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this._canCapture) {
                    if (!_this.captureFrameInternal()) {
                        if (reject) {
                            reject(new Error("Frame Not Currently Enabled"));
                        }
                    }
                    else {
                        _this._frameCompleted = resolve;
                        _this._frameError = reject;
                    }
                }
            });
        };
        CaptureFrameTask.prototype.setReady = function () {
            this._canCapture = true;
            this._controller.appIsReadyToCapture();
        };
        CaptureFrameTask.prototype.isCompleted = function (message) {
            if (message) {
                var obj = JSON.parse(message);
                if (obj.eventName) {
                    if (obj.eventName === "frameData") {
                        if (this._controller.isViewBusy) {
                        }
                    }
                }
                else {
                    if (this._controller.isViewBusy) {
                        if (obj.frameResults) {
                            this.onFrameResult(obj);
                        }
                        else {
                            var response = obj;
                        }
                        return true;
                    }
                }
            }
            return false;
        };
        CaptureFrameTask.prototype.captureFrameInternal = function () {
            if (this._controller.isViewBusy) {
                return false;
            }
            this._startedCapture = true;
            this._controller.isCapturingFrame = true;
            this._session.startCapture();
            return true;
        };
        CaptureFrameTask.prototype.onFrameResult = function (result) {
            var _this = this;
            if (!result) {
                throw new Error("<move to resources>: frameAsync ended with no response");
            }
            if (result.succeeded) {
                result.frames.forEach(function (frame) {
                    _this._controller.addFrame(frame);
                    _this._controller.pendingCaptureCount = _this._controller.pendingCaptureCount == 0 ? 0 : _this._controller.pendingCaptureCount - 1;
                });
            }
            // Turn off the progress bar
            if (this._controller.pendingCaptureCount == 0) {
                this._controller.isCapturingFrame = false;
                if (this._startedCapture) {
                    this._startedCapture = false;
                    this._controller.completedTask(this);
                }
            }
        };
        return CaptureFrameTask;
    }());
    exports.CaptureFrameTask = CaptureFrameTask;
    var GetFramesTask = /** @class */ (function () {
        function GetFramesTask(controller, session) {
            this._controller = controller;
            this._session = session;
            this._session.addFrameProcessingEventListener(this.onFrameResult.bind(this));
        }
        GetFramesTask.prototype.start = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (!_this.getFramesInternal()) {
                    if (reject) {
                        reject(new Error("Frame Not Currently Enabled"));
                    }
                }
                else {
                    _this._frameCompleted = resolve;
                    _this._frameError = reject;
                }
            });
        };
        GetFramesTask.prototype.isCompleted = function (message) {
            if (message) {
                var obj = JSON.parse(message);
                if (obj.eventName) {
                    if (obj.eventName === "frameData") {
                        if (this._controller.isViewBusy) {
                        }
                    }
                }
                else {
                    if (this._controller.isViewBusy) {
                        if (obj.frameResults) {
                            this.onFrameResult(obj);
                        }
                        else {
                            var response = obj;
                        }
                        return true;
                    }
                }
            }
            return false;
        };
        GetFramesTask.prototype.getFramesInternal = function () {
            if (this._controller.isViewBusy) {
                return false;
            }
            this._session.getFrames();
            return true;
        };
        GetFramesTask.prototype.onFrameResult = function (result) {
            var _this = this;
            if (!result) {
                throw new Error("<move to resources>: frameAsync ended with no response");
            }
            if (result.succeeded) {
                result.frames.forEach(function (frame) {
                    _this._controller.addFrame(frame);
                });
            }
        };
        return GetFramesTask;
    }());
    exports.GetFramesTask = GetFramesTask;
    var SelectFrameTask = /** @class */ (function () {
        function SelectFrameTask(controller, session) {
            this._frame = 0;
            this._controller = controller;
            this._session = session;
        }
        Object.defineProperty(SelectFrameTask.prototype, "frame", {
            get: function () {
                return this._frame;
            },
            set: function (theFrame) {
                this._frame = theFrame;
            },
            enumerable: false,
            configurable: true
        });
        SelectFrameTask.prototype.start = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.selectFrameInternal();
                _this._controller.completedTask(_this);
            });
        };
        SelectFrameTask.prototype.isCompleted = function (message) {
            if (message) {
                var obj = JSON.parse(message);
                if (obj.eventName) {
                    if (obj.eventName === "frameData") {
                        if (this._controller.isViewBusy) {
                        }
                    }
                }
                else {
                    if (this._controller.isViewBusy) {
                        return true;
                    }
                }
            }
            return false;
        };
        SelectFrameTask.prototype.selectFrameInternal = function () {
            if (this._controller.isViewBusy) {
                return false;
            }
            this._session.selectFrame(this._frame);
            return true;
        };
        return SelectFrameTask;
    }());
    exports.SelectFrameTask = SelectFrameTask;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/AnalysisView", ["require", "exports", "Capture/Script/ViewBase", "Capture/Script/ViewTasks"], function (require, exports, ViewBase_2, ViewTasks_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnalysisView = exports.AnalysisViewController = void 0;
    var AnalysisViewController = /** @class */ (function (_super) {
        __extends(AnalysisViewController, _super);
        function AnalysisViewController(session, initializeView) {
            if (initializeView === void 0) { initializeView = true; }
            var _this = _super.call(this, session, initializeView) || this;
            if (initializeView) {
                _this.view = new AnalysisView(_this, _this.model);
            }
            // Kick off a task to gather the current list of frames
            var task = new ViewTasks_3.GetFramesTask(_this, session);
            _super.prototype.addTask.call(_this, task);
            task.start();
            return _this;
        }
        return AnalysisViewController;
    }(ViewBase_2.ViewBaseController));
    exports.AnalysisViewController = AnalysisViewController;
    var AnalysisView = /** @class */ (function (_super) {
        __extends(AnalysisView, _super);
        function AnalysisView(controller, model) {
            return _super.call(this, controller, model, "AnalysisViewTemplate") || this;
        }
        return AnalysisView;
    }(ViewBase_2.View));
    exports.AnalysisView = AnalysisView;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/AnalysisViewHost", ["require", "exports", "Capture/Script/AnalysisView", "Capture/Script/ViewHostBase"], function (require, exports, AnalysisView_1, ViewHostBase_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnalysisViewHostInstance = exports.AnalysisViewHost = void 0;
    var AnalysisViewHost = /** @class */ (function (_super) {
        __extends(AnalysisViewHost, _super);
        function AnalysisViewHost() {
            return _super.call(this) || this;
        }
        AnalysisViewHost.prototype.onPropertyChanged = function (propertyName) {
        };
        AnalysisViewHost.prototype.initializeView = function (sessionInfo) {
            this.viewController = new AnalysisView_1.AnalysisViewController(this.session);
            var mainContainer = document.getElementById('mainContainer');
            mainContainer.appendChild(this.viewController.view.rootElement);
            this.viewController.model.registerPropertyChanged(this);
            this.initCommands();
        };
        AnalysisViewHost.prototype.initCommands = function () {
        };
        return AnalysisViewHost;
    }(ViewHostBase_2.ViewHostBase));
    exports.AnalysisViewHost = AnalysisViewHost;
    exports.AnalysisViewHostInstance = new AnalysisViewHost();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/CollectionViewHost", ["require", "exports", "diagnosticsHub", "Capture/Script/CollectionView", "Capture/Script/ViewHostBase"], function (require, exports, diagnosticsHub_2, CollectionView_1, ViewHostBase_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollectionViewHostInstance = exports.CollectionViewHost = void 0;
    var CollectionViewHost = /** @class */ (function (_super) {
        __extends(CollectionViewHost, _super);
        function CollectionViewHost() {
            return _super.call(this) || this;
        }
        CollectionViewHost.prototype.sessionStateChanged = function (eventArgs) {
            var currentState = eventArgs.currentState;
            switch (currentState) {
                case 400 /* CollectionFinishing */:
                    //CollectionViewHost.CommandChain.onCollectionFinishing();
                    break;
                case 500 /* CollectionFinished */:
                    diagnosticsHub_2.getCurrentSession().removeStateChangedEventListener(this.sessionStateChanged);
                    // Have session persist our session metadata now
                    var eventCompleteDeferral = eventArgs.getDeferral();
                    var onSaveCompleted = function (value) {
                        eventCompleteDeferral.complete();
                    };
                    this.session.save().then(onSaveCompleted);
                    break;
            }
        };
        CollectionViewHost.prototype.onPropertyChanged = function (propertyName) {
            //CollectionViewHost.CommandChain.onPropertyChanged(propertyName);
        };
        CollectionViewHost.prototype.initializeView = function (sessionInfo) {
            this.collectionViewController = new CollectionView_1.CollectionViewController(this.session);
            var mainContainer = document.getElementById('mainContainer');
            mainContainer.appendChild(this.collectionViewController.view.rootElement);
            this.collectionViewController.model.registerPropertyChanged(this);
            diagnosticsHub_2.getCurrentSession().addStateChangedEventListener(this.sessionStateChanged.bind(this));
            //Microsoft.Plugin.addEventListener("close", () => {
            //    CollectionViewHost.CommandChain.onClose();
            //});
            this.session.addNumFramesToCaptureChangedEventListener(this.onNumFramesToCaptureChanged.bind(this));
            this.session.addFrameCaptureBeginEventListener(this.onCaptureBegin.bind(this));
            // Add this message box to simulate a scripted sandbox being slower to initialize than the experiment/app.
            // window.alert("wait");
            this.session.addReadyToCaptureEventListener(this.onReadyToCapture.bind(this));
            this.session.scriptedSandboxReadyToCapture();
            this.appReadyToCapture = false;
            this.initCommands();
        };
        CollectionViewHost.prototype.initCommands = function () {
            //if (Microsoft.Plugin.VS && Microsoft.Plugin.VS.Commands) {
            //    var captureFrameCommand = new CaptureFrameCommand(this);
            //    CollectionViewHost.CommandChain = captureFrameCommand;
            //    var toolbar = new Microsoft.VisualStudio.DiagnosticsHub.Toolbar();
            //    toolbar.addToolbarItem(captureFrameCommand);
            //    var toolbarSection = document.getElementsByClassName('toolbarSection')[0];
            //    toolbarSection.appendChild(toolbar.container);
            //}
        };
        CollectionViewHost.prototype.onNumFramesToCaptureChanged = function (result) {
            if (!result) {
                throw new Error("<move to resources>: onNumFramesToCaptureChanged ended with no response");
            }
            this.collectionViewController.view.UpdateNumFramesToCaptureSelection(result.numFramesToCapture);
        };
        CollectionViewHost.prototype.onCaptureBegin = function (result) {
            if (!result) {
                throw new Error("<move to resources>: frameAsync ended with no response");
            }
            // Indicate we are capturing
            if (this.appReadyToCapture) { // Prevent capturing from occuring before it's ready; otherwise, it gives an endless progress indicator.
                this.collectionViewController.isCapturingFrame = true;
                this.collectionViewController.pendingCaptureCount = result.numberOfFrames;
            }
        };
        CollectionViewHost.prototype.onReadyToCapture = function (result) {
            if (!result) {
                throw new Error("<move to resources>: frameAsync ended with no response");
            }
            // Indicate we are ready to capture
            this.appReadyToCapture = true;
            this.collectionViewController.readyToCapture();
        };
        return CollectionViewHost;
    }(ViewHostBase_3.ViewHostBase));
    exports.CollectionViewHost = CollectionViewHost;
    exports.CollectionViewHostInstance = new CollectionViewHost();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Capture/Script/VsPluginCommandHelper", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//export class CommandBase extends Microsoft.VisualStudio.DiagnosticsHub.ToolbarButton implements ICommand {
//    public _host: CollectionViewHost;
//    /*protected*/ public _nextCommand: ICommand;
//    constructor(host: CollectionViewHost, commandBinding: Microsoft.VisualStudio.DiagnosticsHub.IMenuCommand) {
//        super(commandBinding);
//        this._host = host;
//    }
//    public setNext(nextCommand: ICommand): void {
//        this._nextCommand = nextCommand;
//    }
//    public onCollectionFinishing(): void {
//        this.setEnabled(false);
//        if (this._nextCommand) {
//            this._nextCommand.onCollectionFinishing();
//        }
//    }
//    public onTargetIsManaged(): void {
//        if (this._nextCommand) {
//            this._nextCommand.onTargetIsManaged();
//        }
//    }
//    public onPropertyChanged(propertyName: string): void {
//        if (propertyName === "isViewBusy") {
//            this.setEnabled(!this._host.collectionViewController.model.isViewBusy);
//        }
//        if (this._nextCommand) {
//            this._nextCommand.onPropertyChanged(propertyName);
//        }
//    }
//    public onClose(): void {
//        this.setEnabled(false);
//        if (this._nextCommand) {
//            this._nextCommand.onClose();
//        }
//    }
//}
//export class CaptureFrameCommand extends CommandBase {
//    constructor(host: CollectionViewHost) {
//        super(host, <Microsoft.VisualStudio.DiagnosticsHub.IMenuCommand>{
//            callback: () => host.collectionViewController.captureFrame(),
//            label: Microsoft.Plugin.Resources.getString("CaptureFrame"),
//            //iconEnabled: "image-snapshot",
//            //iconDisabled: "image-snapshot-disabled",
//            disabled: () => host.collectionViewController.model.isViewBusy,
//            displayOnToolbar: true
//        });
//    }
//}
define("Profiling/GpuProfilingAnalysisViewScripted", ["require", "exports", "plugin-vs-v2", "diagnosticsHub"], function (require, exports, plugin, diagnosticsHub_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GpuProfilingDetailsControl = void 0;
    var GpuProfilingDetailsControl = /** @class */ (function () {
        function GpuProfilingDetailsControl(config) {
            // View activation
            this._isActive = false;
            // Data warehouse
            this._dataWarehouse = null;
            // Local fields
            this._loadingDetails = false;
            this._E_ACCESSDENIED = 0x80070005;
            this._E_OUTOFMEMORY = 0x8007000E;
            if (config && config.viewId) {
                this._config = config;
                this._viewId = config.viewId;
            }
            else {
                throw new Error("Invalid Config.");
            }
            this._vsSession = plugin.JSONMarshaler.attachToMarshaledObject("GpuProfiler.GpuProfilingSession", {}, true);
            this.setInitialControls();
            // Register our callback function for when VS has finished loading details data
            this._vsSession.addEventListener("gpudetailsloaded", this.onGpuDetailsLoaded.bind(this));
            // Register our callback function to handle test automation
            this._vsSession.addEventListener("testopendetails", this.onGpuDetailsOpenTest.bind(this));
            this._viewEventManager = diagnosticsHub_3.getViewEventManager();
            this._viewEventManager.selectionChanged.addEventListener(this.onRulerSelectionChanged.bind(this));
            // Set our timespan to zero to begin with
            this._timeSpan = new diagnosticsHub_3.JsonTimespan(new diagnosticsHub_3.BigNumber(0, 0), new diagnosticsHub_3.BigNumber(0, 0));
            // Load the DataWarehouse
            diagnosticsHub_3.loadDataWarehouse()
                .then(function (dw) {
                this._dataWarehouse = dw;
                // Notify the hub that we have loaded our view
                this._viewEventManager.detailsViewReady.raiseEvent({
                    Id: this._viewId
                });
                // When we first load up, query the analyzer to see if there were any errors during analysis
                this.checkAnalysisErrors();
            }.bind(this));
        }
        GpuProfilingDetailsControl.prototype.onGpuDetailsLoaded = function (args) {
            this._loadingDetails = false;
            this.showLink();
        };
        GpuProfilingDetailsControl.prototype.onGpuDetailsOpenTest = function (args) {
            this.loadGpuDetailsDataFromTime(args.startTime, args.endTime);
        };
        GpuProfilingDetailsControl.prototype.checkAnalysisErrors = function () {
            // Request Error check data from our analyzer
            var customData = {
                task: "ERRORCHECK"
            };
            var contextData = {
                customDomain: customData,
            };
            var dataPromise = this._dataWarehouse.getFilteredData(contextData, "9187AE0A-6018-4ADA-BA36-43D4E9BE0834");
            dataPromise.then(function (result) {
                var myResult = result.getResult("");
                myResult.then(function (realResult) {
                    // Since JS Number values are unsigned do a quick convert here if needed
                    if (realResult.HRESULT < 0) {
                        this._analysisHResult = 0x100000000 + realResult.HRESULT;
                    }
                    else {
                        this._analysisHResult = realResult.HRESULT;
                    }
                    // Hide / Show the main controls or warnings based on analysis results from the infosource
                    // Good Result
                    if (this._analysisHResult == 0x0) {
                        var linkDiv = document.getElementById("Gpu-Details-Main");
                        linkDiv.style.visibility = "visible";
                    }
                    // Memory issue
                    else if ((this._analysisHResult == this._E_ACCESSDENIED) || (this._analysisHResult == this._E_OUTOFMEMORY)) {
                        var warningDiv = document.getElementById("Analysis-Warnings-Container");
                        warningDiv.style.visibility = "visible";
                        var warningSpan = document.getElementById("Analysis-Warnings-Span");
                        warningSpan.innerText = plugin.Resources.getString("ProfilingAnalysisMemoryError");
                    }
                    // Unknown
                    else {
                        var warningDiv = document.getElementById("Analysis-Warnings-Container");
                        warningDiv.style.visibility = "visible";
                        var warningSpan = document.getElementById("Analysis-Warnings-Span");
                        warningSpan.innerText = plugin.Resources.getString("ProfilingAnalysisOtherError", this._analysisHResult.toString(16));
                        //warningSpan.innerText = plugin.Resources.getString("ProfilingAnalysisOtherError");
                        //this.findElement("seeFrameDetailsButton").innerText = plugin.Resources.getString("FrameNumberFormat", this._model.summaryData.id);
                    }
                }.bind(this));
            }.bind(this));
        };
        // Grab data from our infosource and load it into shared memory
        // pass back to VS the location and details of that memory
        GpuProfilingDetailsControl.prototype.loadGpuDetailsData = function () {
            var startString = this._timeSpan.begin.value;
            var endString = this._timeSpan.end.value;
            this.loadGpuDetailsDataFromTime(startString, endString);
        };
        GpuProfilingDetailsControl.prototype.loadGpuDetailsDataFromTime = function (startTime, endTime) {
            // Prevent the user from loading another chunk until the first is loaded
            if (!this._loadingDetails) {
                this._loadingDetails = true;
                this.hideLink();
                this._dataWarehouse.getContextService().getGlobalContext()
                    .then(function (context) {
                    this._context = context;
                    // After we have grabbed the global context, call into the data warehouse to get data
                    var dataPromise = this._dataWarehouse.getData(context.getContextId(), "9187AE0A-6018-4ADA-BA36-43D4E9BE0834");
                    dataPromise.then(function (result) {
                        var timespanString = startTime + ":" + endTime;
                        var myResult = result.getResult(timespanString);
                        myResult.then(function (realResult) {
                            this._vsSession._call("asyncOpenGpuDetails", realResult);
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            }
        };
        GpuProfilingDetailsControl.prototype.setInitialControls = function () {
            var prefix1 = document.getElementById("detailsPrefix1");
            prefix1.innerText = plugin.Resources.getString("ProfilingSelectMessagePrefix1");
            var prefix2 = document.getElementById("detailsPrefix2");
            prefix2.innerText = plugin.Resources.getString("ProfilingSelectMessagePrefix2");
            var suffix = document.getElementById("detailsSuffix");
            suffix.innerText = plugin.Resources.getString("ProfilingSelectMessageSuffix");
            this._detailsLink = document.getElementById("detailsLink");
            this._detailsLink.href = "javascript:void(null);";
            this._detailsLink.innerText = plugin.Resources.getString("ProfilingSelectMessageLink");
            this._detailsLink.addEventListener("click", this.openDetailsPage.bind(this));
            // External Tools Controls
            var wpaLink = document.getElementById("wpaLink");
            wpaLink.href = "javascript:void(null);";
            wpaLink.addEventListener("click", this.openWpaLink.bind(this));
            wpaLink.style.visibility = "hidden";
            wpaLink.innerText = plugin.Resources.getString("WpaLinkText");
            wpaLink.title = plugin.Resources.getString("WpaLinkTitle");
            var gpuViewLink = document.getElementById("gpuViewLink");
            gpuViewLink.href = "javascript:void(null);";
            gpuViewLink.addEventListener("click", this.openGpuViewLink.bind(this));
            gpuViewLink.style.visibility = "hidden";
            gpuViewLink.innerText = plugin.Resources.getString("GpuViewLinkText");
            gpuViewLink.title = plugin.Resources.getString("GpuViewLinkTitle");
            this.checkWpaAvailable();
            this.checkGpuViewAvailable();
            var progressSpan = document.getElementById("inProgressSpan");
            progressSpan.innerText = plugin.Resources.getString("ProfilingInProgressMessage");
            // Initially hide all controls (don't enable until we know our analysis was correct)
            var linkDiv = document.getElementById("Gpu-Details-Main");
            linkDiv.style.visibility = "hidden";
            var progressDiv = document.getElementById("Gpu-Details-Progress");
            progressDiv.style.visibility = "hidden";
            var warningDiv = document.getElementById("Analysis-Warnings-Container");
            warningDiv.style.visibility = "hidden";
        };
        // Show the open document link and hide the in progress link
        GpuProfilingDetailsControl.prototype.showLink = function () {
            var open = document.getElementById("Gpu-Details-Main");
            open.style.visibility = "visible";
            var progress = document.getElementById("Gpu-Details-Progress");
            progress.style.visibility = "hidden";
        };
        // Hide the open document link and show the in progress link
        GpuProfilingDetailsControl.prototype.hideLink = function () {
            var open = document.getElementById("Gpu-Details-Main");
            open.style.visibility = "hidden";
            var progress = document.getElementById("Gpu-Details-Progress");
            progress.style.visibility = "visible";
        };
        GpuProfilingDetailsControl.prototype.onRulerSelectionChanged = function (args) {
            // Only update when selection is complete, not during the selection event
            if (!args.isIntermittent) {
                this._timeSpan = args.position;
            }
        };
        GpuProfilingDetailsControl.prototype.openWpaLink = function () {
            this.openWpa();
        };
        GpuProfilingDetailsControl.prototype.checkWpaAvailable = function () {
            this._vsSession._call("WPAIsAvailable").then(function (result) {
                if (result) {
                    var wpaLink = document.getElementById("wpaLink");
                    wpaLink.style.visibility = "visible";
                }
            });
        };
        GpuProfilingDetailsControl.prototype.openWpa = function () {
            this._vsSession._call("launchInWPA").then(function (result) {
            });
        };
        GpuProfilingDetailsControl.prototype.openGpuViewLink = function () {
            this.openGpuView();
        };
        GpuProfilingDetailsControl.prototype.checkGpuViewAvailable = function () {
            this._vsSession._call("GpuViewIsAvailable").then(function (result) {
                if (result) {
                    var gpuViewLink = document.getElementById("gpuViewLink");
                    gpuViewLink.style.visibility = "visible";
                }
            });
        };
        GpuProfilingDetailsControl.prototype.openGpuView = function () {
            this._vsSession._call("launchInGpuView").then(function (result) {
            });
        };
        GpuProfilingDetailsControl.prototype.openDetailsPage = function () {
            this.loadGpuDetailsData();
        };
        return GpuProfilingDetailsControl;
    }());
    exports.GpuProfilingDetailsControl = GpuProfilingDetailsControl;
});
define("Profiling/GpuProfilingRuntimeViewScripted", ["require", "exports", "diagnosticsHub", "plugin-vs-v2"], function (require, exports, diagnosticsHub_4, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GpuProfilingRuntimeControl = void 0;
    var GpuProfilingRuntimeControl = /** @class */ (function () {
        // Pass in a view configuration block from the control
        function GpuProfilingRuntimeControl(config) {
            this._agentGuid = new diagnosticsHub_4.Guid("9e5de5fb-d655-401a-86a8-5764c252744d");
            if (config && config.viewId) {
                this._config = config;
                this._viewId = config.viewId;
            }
            else {
                throw new Error("Invalid Config.");
            }
            this.setInitialControls();
            this._vsSession = plugin.JSONMarshaler.attachToMarshaledObject("GpuProfiler.GpuProfilingSession", {}, true);
            this._standardCollector = diagnosticsHub_4.getStandardTransportService();
            this._standardCollector.addMessageListener(this._agentGuid, this.onMessageReceived.bind(this));
        }
        // Messaged from the collector come in here to be handled
        GpuProfilingRuntimeControl.prototype.onMessageReceived = function (message) {
            if (message) {
                if (message == "Started") {
                    this.setControls(true);
                }
                else if (message == "NotStarted") {
                    this.setControls(false);
                }
                // For a message not intended for us, forward it on to the main vs session in devenv to be handled there
                else {
                    this._vsSession._call("sendStringMessage", message);
                }
            }
        };
        // The initial set of controls will be all hidden until the collector tells us if we need the "start profiling" link or not
        GpuProfilingRuntimeControl.prototype.setInitialControls = function () {
            this._startLink = document.getElementById("startLink");
            this._startSpan = document.getElementById("startSpan");
            this._stopLink = document.getElementById("stopLink");
            this._stopSpan = document.getElementById("stopSpan");
            this._stopLink.style.visibility = "hidden";
            this._stopSpan.style.visibility = "hidden";
            this._startLink.style.visibility = "hidden";
            this._startSpan.style.visibility = "hidden";
        };
        // Set up our various HTML controls
        GpuProfilingRuntimeControl.prototype.setControls = function (started) {
            this._startLink.innerText = plugin.Resources.getString("ProfilingStartProfilingLink");
            this._startLink.href = "javascript:void(null);";
            this._startLink.addEventListener("click", this.startProfiling.bind(this));
            this._startLink.style.visibility = "visible";
            this._startSpan.innerText = plugin.Resources.getString("ProfilingStartProfilingSpan");
            this._startSpan.style.visibility = "visible";
            this._stopLink.innerText = plugin.Resources.getString("ProfilingStopProfilingLink");
            this._stopLink.href = "javascript:void(null);";
            this._stopLink.addEventListener("click", this.stopProfiling.bind(this));
            this._stopLink.style.visibility = "visible";
            this._stopSpan.innerText = plugin.Resources.getString("ProfilingStopProfilingSpan");
            this._stopSpan.style.visibility = "visible";
            if (started) {
                this._startLink.style.visibility = "hidden";
                this._startSpan.style.visibility = "hidden";
            }
        };
        GpuProfilingRuntimeControl.prototype.stopProfiling = function () {
            // Hide the links to prevent an accidental second press
            // were closing down now, so we don't want a command to start or
            // a second stop command
            this._stopLink.style.visibility = "hidden";
            this._stopSpan.style.visibility = "hidden";
            this._startLink.style.visibility = "hidden";
            this._startSpan.style.visibility = "hidden";
            this._vsSession._call("closeSession");
        };
        GpuProfilingRuntimeControl.prototype.startProfiling = function () {
            // Hide the start link when we begin
            this._startLink.style.visibility = "hidden";
            this._startSpan.style.visibility = "hidden";
            var startString = "StartProfiling:" + plugin.Resources.getString("ProfilingUserMark");
            // Send our message to start profiling to the collection agent
            this._standardCollector.sendStringToCollectionAgent(this._agentGuid.toString(), startString).then(function (response) {
                if (response) {
                    var str = response;
                }
            });
        };
        return GpuProfilingRuntimeControl;
    }());
    exports.GpuProfilingRuntimeControl = GpuProfilingRuntimeControl;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Controls/ContentControl", ["require", "exports", "plugin-vs-v2", "Common/Controls/Control"], function (require, exports, plugin, Control_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentControl = void 0;
    // This ContentControl is  a control that only allows a single child (content).
    var ContentControl = /** @class */ (function (_super) {
        __extends(ContentControl, _super);
        function ContentControl() {
            return _super.call(this) || this;
        }
        Object.defineProperty(ContentControl.prototype, "content", {
            get: function () { return this._content; },
            set: function (newContent) {
                if (this._content !== newContent) {
                    if (this._content) {
                        this.removeChild(this._content);
                    }
                    this._content = newContent;
                    this.appendChild(this._content);
                    this.onContentChanged();
                }
            },
            enumerable: false,
            configurable: true
        });
        ContentControl.prototype.appendChild = function (child) {
            if (this.rootElement.children.length != 0) {
                throw new Error(plugin.Resources.getErrorString("MemProf.1016"));
            }
            _super.prototype.appendChild.call(this, child);
        };
        // overridable
        ContentControl.prototype.onContentChanged = function () {
        };
        return ContentControl;
    }(Control_2.Control));
    exports.ContentControl = ContentControl;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Util/KeyCodes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.preventIEKeys = exports.HasAnyOfAltCtrlShiftKeyFlags = exports.blockBrowserAccelerators = exports.KeyFlags = exports.MouseButtons = exports.KeyCodes = exports.Keys = void 0;
    /**
    Use the Keys members to test against KeyboardEvent.key.
    This is preferred over testing KeyboardEvent.keyCode, which is deprecated.
    */
    var Keys = /** @class */ (function () {
        function Keys() {
        }
        Keys.c = "c";
        Keys.DEL = "Del";
        Keys.DOWN = "Down";
        Keys.END = "End";
        Keys.ENTER = "Enter";
        Keys.F10 = "F10";
        Keys.HOME = "Home";
        Keys.LEFT = "Left";
        Keys.RIGHT = "Right";
        Keys.SPACEBAR = "Spacebar";
        Keys.UP = "Up";
        return Keys;
    }());
    exports.Keys = Keys;
    /**
    Use the KeyCodes enumeration to test against KeyboardEvent.keyCode.
    This is deprecated in favor of testing KeyboardEvent.key.
    */
    var KeyCodes;
    (function (KeyCodes) {
        KeyCodes[KeyCodes["BACKSPACE"] = 8] = "BACKSPACE";
        KeyCodes[KeyCodes["TAB"] = 9] = "TAB";
        KeyCodes[KeyCodes["ENTER"] = 13] = "ENTER";
        KeyCodes[KeyCodes["SHIFT"] = 16] = "SHIFT";
        KeyCodes[KeyCodes["CONTROL"] = 17] = "CONTROL";
        KeyCodes[KeyCodes["ALT"] = 18] = "ALT";
        KeyCodes[KeyCodes["CAPS_LOCK"] = 20] = "CAPS_LOCK";
        KeyCodes[KeyCodes["ESCAPE"] = 27] = "ESCAPE";
        KeyCodes[KeyCodes["SPACE"] = 32] = "SPACE";
        KeyCodes[KeyCodes["PAGE_UP"] = 33] = "PAGE_UP";
        KeyCodes[KeyCodes["PAGE_DOWN"] = 34] = "PAGE_DOWN";
        KeyCodes[KeyCodes["END"] = 35] = "END";
        KeyCodes[KeyCodes["HOME"] = 36] = "HOME";
        KeyCodes[KeyCodes["ARROW_LEFT"] = 37] = "ARROW_LEFT";
        KeyCodes[KeyCodes["ARROW_FIRST"] = 37] = "ARROW_FIRST";
        KeyCodes[KeyCodes["ARROW_UP"] = 38] = "ARROW_UP";
        KeyCodes[KeyCodes["ARROW_RIGHT"] = 39] = "ARROW_RIGHT";
        KeyCodes[KeyCodes["ARROW_DOWN"] = 40] = "ARROW_DOWN";
        KeyCodes[KeyCodes["ARROW_LAST"] = 40] = "ARROW_LAST";
        KeyCodes[KeyCodes["INSERT"] = 45] = "INSERT";
        KeyCodes[KeyCodes["DELETE"] = 46] = "DELETE";
        KeyCodes[KeyCodes["A"] = 65] = "A";
        KeyCodes[KeyCodes["B"] = 66] = "B";
        KeyCodes[KeyCodes["C"] = 67] = "C";
        KeyCodes[KeyCodes["D"] = 68] = "D";
        KeyCodes[KeyCodes["E"] = 69] = "E";
        KeyCodes[KeyCodes["F"] = 70] = "F";
        KeyCodes[KeyCodes["G"] = 71] = "G";
        KeyCodes[KeyCodes["H"] = 72] = "H";
        KeyCodes[KeyCodes["I"] = 73] = "I";
        KeyCodes[KeyCodes["J"] = 74] = "J";
        KeyCodes[KeyCodes["K"] = 75] = "K";
        KeyCodes[KeyCodes["L"] = 76] = "L";
        KeyCodes[KeyCodes["M"] = 77] = "M";
        KeyCodes[KeyCodes["N"] = 78] = "N";
        KeyCodes[KeyCodes["O"] = 79] = "O";
        KeyCodes[KeyCodes["P"] = 80] = "P";
        KeyCodes[KeyCodes["Q"] = 81] = "Q";
        KeyCodes[KeyCodes["R"] = 82] = "R";
        KeyCodes[KeyCodes["S"] = 83] = "S";
        KeyCodes[KeyCodes["T"] = 84] = "T";
        KeyCodes[KeyCodes["U"] = 85] = "U";
        KeyCodes[KeyCodes["V"] = 86] = "V";
        KeyCodes[KeyCodes["W"] = 87] = "W";
        KeyCodes[KeyCodes["X"] = 88] = "X";
        KeyCodes[KeyCodes["Y"] = 89] = "Y";
        KeyCodes[KeyCodes["Z"] = 90] = "Z";
        KeyCodes[KeyCodes["CONTEXTMENU"] = 93] = "CONTEXTMENU";
        KeyCodes[KeyCodes["MULTIPLY"] = 106] = "MULTIPLY";
        KeyCodes[KeyCodes["PLUS"] = 107] = "PLUS";
        KeyCodes[KeyCodes["MINUS"] = 109] = "MINUS";
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
        KeyCodes[KeyCodes["COMMA"] = 188] = "COMMA";
        KeyCodes[KeyCodes["PERIOD"] = 190] = "PERIOD";
    })(KeyCodes = exports.KeyCodes || (exports.KeyCodes = {}));
    var MouseButtons;
    (function (MouseButtons) {
        MouseButtons[MouseButtons["LEFT_BUTTON"] = 0] = "LEFT_BUTTON";
        MouseButtons[MouseButtons["MIDDLE_BUTTON"] = 1] = "MIDDLE_BUTTON";
        MouseButtons[MouseButtons["RIGHT_BUTTON"] = 2] = "RIGHT_BUTTON";
    })(MouseButtons = exports.MouseButtons || (exports.MouseButtons = {}));
    // This maps to KeyFlags enum defined in 
    // $/devdiv/feature/VSClient_1/src/bpt/diagnostics/Host/Common/common.h
    var KeyFlags;
    (function (KeyFlags) {
        KeyFlags[KeyFlags["KeyFlags_None"] = 0] = "KeyFlags_None";
        KeyFlags[KeyFlags["KeyFlags_Shift"] = 1] = "KeyFlags_Shift";
        KeyFlags[KeyFlags["KeyFlags_Ctrl"] = 2] = "KeyFlags_Ctrl";
        KeyFlags[KeyFlags["KeyFlags_Alt"] = 4] = "KeyFlags_Alt";
    })(KeyFlags = exports.KeyFlags || (exports.KeyFlags = {}));
    /**
         Add listeners to the document to prevent certain IE browser accelerator keys from
        triggering their default action in IE
        */
    function blockBrowserAccelerators() {
        // Prevent the default F5 refresh, default F6 address bar focus, and default SHIFT + F10 context menu
        document.addEventListener("keydown", function (e) {
            return preventIEKeys(e);
        });
        // Prevent the default context menu
        document.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        // Prevent mouse wheel zoom
        window.addEventListener("mousewheel", function (e) {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    }
    exports.blockBrowserAccelerators = blockBrowserAccelerators;
    /**
         Checks to see if any of the ALT, SHIFT, or CTRL keys are pressed
        @param e The keyboard event to check
        @returns true if the event has any of the key flags toggled on
        */
    function HasAnyOfAltCtrlShiftKeyFlags(e) {
        return e.shiftKey || e.ctrlKey || e.altKey;
    }
    exports.HasAnyOfAltCtrlShiftKeyFlags = HasAnyOfAltCtrlShiftKeyFlags;
    /**
         Prevents IE from executing default behavior for certain shortcut keys
        This should be called from keydown handlers that do not already call preventDefault().
        Some shortcuts cannot be blocked via javascript (such as CTRL + P print dialog) so these
        are already blocked by the native hosting code and will not get sent to the key event handlers.
        @param e The keyboard event to check and prevent the action on
        @returns false to stop the default action- which matches the keydown/keyup handlers
        */
    function preventIEKeys(e) {
        // Check if a known key combo is pressed
        if (e.keyCode === KeyCodes.F5 || // F5 Refresh
            e.keyCode === KeyCodes.F6 || // F6 Address bar focus
            (e.keyCode === KeyCodes.F10 && e.shiftKey) || // SHIFT + F10 Context menu
            (e.keyCode === KeyCodes.F && e.ctrlKey)) { // CTRL + F Find dialog
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        return true;
    }
    exports.preventIEKeys = preventIEKeys;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Controls/menuControl", ["require", "exports", "plugin-vs-v2", "Common/Util/KeyCodes", "Common/Controls/TemplateControl"], function (require, exports, plugin, KeyCodes_1, TemplateControl_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuControl = exports.MenuItem = void 0;
    var MenuItem = /** @class */ (function () {
        function MenuItem(itemText, ownerControl, canToggle, initialState) {
            if (canToggle === void 0) { canToggle = false; }
            if (initialState === void 0) { initialState = false; }
            this.element = document.createElement("li");
            if (canToggle) {
                this._toggleIcon = document.createElement("img");
                this.element.appendChild(this._toggleIcon);
                this._toggleIcon.className = "menuToggleIcon";
                this._toggleIcon.src = plugin.Theme.getValue("image-checkmark");
                this.toggled = initialState;
                this.element.addEventListener("DOMAttrModified", this.onAriaCheckedModified.bind(this));
            }
            var span = document.createElement("span");
            this.element.appendChild(span);
            span.innerText = itemText;
        }
        Object.defineProperty(MenuItem.prototype, "toggled", {
            get: function () { return this._toggled; },
            set: function (v) {
                this._toggled = v;
                if (this._toggled) {
                    this._toggleIcon.classList.remove("hiddenCheckMark");
                    this.element.setAttribute("aria-checked", "true");
                }
                else {
                    this._toggleIcon.classList.add("hiddenCheckMark");
                    this.element.setAttribute("aria-checked", "false");
                }
            },
            enumerable: false,
            configurable: true
        });
        MenuItem.prototype.onAriaCheckedModified = function (event) {
            if (event.attrName === "aria-checked") {
                var checked = event.newValue === "true";
                if (this.toggled !== checked)
                    this.toggled = checked;
            }
        };
        return MenuItem;
    }());
    exports.MenuItem = MenuItem;
    var MenuControl = /** @class */ (function (_super) {
        __extends(MenuControl, _super);
        function MenuControl(target) {
            var _this = _super.call(this) || this;
            _this._target = target;
            _this._isVisible = false;
            _this.setTemplateFromHTML("<ul id=\"menuControl\" class=\"menuControl\" role=\"menu\"></ul>");
            _this._listElement = _this.findElement("menuControl");
            _this._listElement.setAttribute("aria-hidden", "true");
            _this._closeMenuFunction = _this.closeMenu.bind(_this);
            document.body.addEventListener("keydown", function (e) {
                if (e.keyCode === KeyCodes_1.KeyCodes.ESCAPE) {
                    _this.closeMenu();
                }
            });
            target.onclick = _this.showMenu.bind(_this);
            target.onkeydown = function (e) {
                if (e.keyCode === KeyCodes_1.KeyCodes.ENTER || e.keyCode === KeyCodes_1.KeyCodes.SPACE) {
                    if (!_this._isVisible)
                        _this.showMenu();
                    else
                        _this.closeMenu();
                }
            };
            target.appendChild(_this._listElement);
            target.setAttribute("role", "button");
            target.setAttribute("aria-haspopup", "true");
            target.setAttribute("aria-owns", _this._listElement.id.toString());
            target.addEventListener("keydown", function (e) {
                if ((e.keyCode === KeyCodes_1.KeyCodes.ARROW_DOWN) && (_this._isVisible)) {
                    _this._listElement.firstElementChild.focus();
                }
            });
            return _this;
        }
        MenuControl.prototype.getMenuItem = function (index) {
            if (index >= 0 && index < this._listElement.children.length) {
                return this._listElement.children[index];
            }
            return null;
        };
        MenuControl.prototype.addToggleItem = function (itemText, itemCallback, initialState, tabIndex) {
            if (initialState === void 0) { initialState = false; }
            if (tabIndex === void 0) { tabIndex = 0; }
            var menuItem = new MenuItem(itemText, this, true, initialState);
            this._listElement.appendChild(menuItem.element);
            menuItem.element.tabIndex = tabIndex;
            menuItem.element.setAttribute("role", "menuitemcheckbox");
            menuItem.element.onclick = (function (e) {
                menuItem.toggled = itemCallback(e);
                e.stopImmediatePropagation();
            });
            menuItem.element.onkeydown = function (e) {
                if (e.keyCode === KeyCodes_1.KeyCodes.ENTER || e.keyCode === KeyCodes_1.KeyCodes.SPACE) {
                    menuItem.toggled = itemCallback(e);
                    e.stopImmediatePropagation();
                }
                else if (e.keyCode === KeyCodes_1.KeyCodes.ARROW_UP) {
                    if (menuItem.element.previousElementSibling) {
                        menuItem.element.previousElementSibling.focus();
                    }
                    e.stopImmediatePropagation();
                }
                else if (e.keyCode === KeyCodes_1.KeyCodes.ARROW_DOWN) {
                    if (menuItem.element.nextElementSibling) {
                        menuItem.element.nextElementSibling.focus();
                    }
                    e.stopImmediatePropagation();
                }
            };
            this._target.disabled = false;
        };
        MenuControl.totalOffsetLeft = function (elem) {
            var offsetLeft = 0;
            do {
                if (!isNaN(elem.offsetLeft)) {
                    offsetLeft += elem.offsetLeft;
                }
            } while (elem = elem.offsetParent);
            return offsetLeft;
        };
        MenuControl.totalOffsetTop = function (elem) {
            var offsetTop = 0;
            do {
                if (!isNaN(elem.offsetTop)) {
                    offsetTop += elem.offsetTop;
                }
            } while (elem = elem.offsetParent);
            return offsetTop;
        };
        MenuControl.prototype.showMenu = function (e) {
            var _this = this;
            if (!this._isVisible) {
                this._listElement.style.display = "block";
                this._listElement.setAttribute("aria-hidden", "false");
                this.setMenuPosition();
                this._target.classList.add("menuControlActive");
                window.setTimeout(function () {
                    document.body.addEventListener("click", _this._closeMenuFunction);
                    window.addEventListener("resize", _this._closeMenuFunction);
                }, 0);
                this._isVisible = true;
            }
        };
        MenuControl.prototype.closeMenu = function () {
            if (this._isVisible) {
                this._listElement.style.display = "none";
                this._listElement.setAttribute("aria-hidden", "true");
                this._target.classList.remove("menuControlActive");
                document.body.removeEventListener("click", this._closeMenuFunction);
                window.removeEventListener("resize", this._closeMenuFunction);
                this._isVisible = false;
            }
        };
        MenuControl.prototype.setMenuPosition = function () {
            this._listElement.style.left = "0px";
            this._listElement.style.top = "0px";
            // Get the coordinates of target based on the document
            var targetTotalOffsetLeft = MenuControl.totalOffsetLeft(this._target);
            var targetTotalOffsetTop = MenuControl.totalOffsetTop(this._target);
            // Gets the offset position when listElement is at 0,0 to adjust later on this value.
            // because 0,0 doesn't necessarly land on document 0,0 if there is a parent with absolute position.
            var listElementZeroOffsetLeft = MenuControl.totalOffsetLeft(this._listElement);
            var listElementZeroOffsetTop = MenuControl.totalOffsetTop(this._listElement);
            // Calculate the left position 
            var left = targetTotalOffsetLeft;
            var right = left + this._listElement.offsetWidth;
            if (right > window.innerWidth) {
                var newRight = targetTotalOffsetLeft + this._target.offsetWidth;
                var newLeft = newRight - this._listElement.offsetWidth;
                if (newLeft >= 0) {
                    left = newLeft;
                    right = newRight;
                }
            }
            this._listElement.style.left = left - listElementZeroOffsetLeft + "px";
            // Calculate the top position
            var top = targetTotalOffsetTop + this._target.offsetHeight;
            var bottom = top + this._listElement.offsetHeight;
            if (bottom > window.innerHeight) {
                var newBottom = targetTotalOffsetTop;
                var newTop = bottom - this._listElement.offsetHeight;
                if (newTop >= 0) {
                    top = newTop;
                    bottom = newBottom;
                }
            }
            this._listElement.style.top = top - listElementZeroOffsetTop + "px";
        };
        return MenuControl;
    }(TemplateControl_3.TemplateControl));
    exports.MenuControl = MenuControl;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Controls/tabItem", ["require", "exports", "plugin-vs-v2", "Common/Util/KeyCodes", "Common/Controls/ContentControl", "Common/Controls/Control"], function (require, exports, plugin, KeyCodes_2, ContentControl_1, Control_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabItem = void 0;
    var TabItem = /** @class */ (function (_super) {
        __extends(TabItem, _super);
        function TabItem() {
            var _this = _super.call(this) || this;
            var elem = document.createElement("li");
            elem.setAttribute("role", "tab");
            elem.setAttribute("aria-selected", "false");
            _this.header = new Control_3.Control(elem);
            _this.header.rootElement.onclick = _this.onHeaderClicked.bind(_this);
            _this.header.rootElement.setAttribute("tabindex", "2");
            _this.header.rootElement.addEventListener("keydown", _this.onKeyDown.bind(_this));
            _this.rootElement.className = "tabItemContent";
            return _this;
        }
        Object.defineProperty(TabItem.prototype, "ownerTabControl", {
            get: function () { return this._ownerTabControl; },
            set: function (v) {
                if (this._ownerTabControl !== v) {
                    if (this._ownerTabControl && v) {
                        throw new Error(plugin.Resources.getErrorString("MemProf.1022"));
                    }
                    this._ownerTabControl = v;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(TabItem.prototype, "active", {
            get: function () { return this._active; },
            set: function (v) {
                if (this._active !== v) {
                    this._active = v;
                    this.header.rootElement.classList.toggle("active");
                    this.rootElement.classList.toggle("active");
                    this.header.rootElement.setAttribute("aria-selected", this._active ? "true" : "false");
                    this.onActiveChanged();
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(TabItem.prototype, "title", {
            get: function () { return this.header.rootElement.innerText; },
            set: function (v) {
                this.header.rootElement.innerText = v;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(TabItem.prototype, "tooltipString", {
            get: function () { return this.header.rootElement.getAttribute("data-plugin-vs-tooltip"); },
            set: function (v) {
                var tooltip = { content: v };
                this.header.rootElement.setAttribute("data-plugin-vs-tooltip", JSON.stringify(tooltip));
            },
            enumerable: false,
            configurable: true
        });
        /* overridable */
        TabItem.prototype.onActiveChanged = function () {
        };
        TabItem.prototype.onHeaderClicked = function () {
            if (this.ownerTabControl) {
                this.ownerTabControl.selectedItem = this;
            }
            // MemoryProfilerViewHost.onIdle();
        };
        TabItem.prototype.onKeyDown = function (e) {
            if (e.keyCode === KeyCodes_2.KeyCodes.ENTER || e.keyCode === KeyCodes_2.KeyCodes.SPACE) {
                this.onHeaderClicked();
            }
        };
        return TabItem;
    }(ContentControl_1.ContentControl));
    exports.TabItem = TabItem;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Controls/tabControl", ["require", "exports", "Common/Controls/Control", "Common/Controls/TemplateControl"], function (require, exports, Control_4, TemplateControl_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabControl = void 0;
    var TabControl = /** @class */ (function (_super) {
        __extends(TabControl, _super);
        function TabControl() {
            var _this = _super.call(this) || this;
            _this._items = [];
            _this.setTemplateFromHTML('<div class="tabControl">' +
                '   <div class="tabHeader">' +
                '       <div id="beforeBarContainer" class="beforeBarContainer"></div>' +
                '       <nav id="tabBarContainer" class="tabBarContainer">' +
                '        <ul class="tabBar" role="tablist"></ul>' +
                '       </nav>' +
                '       <div id="afterBarContainer" class="afterBarContainer"></div>' +
                '   </div>' +
                '   <div class="tabContentPane"></div>' +
                '</div>');
            _this._barPanel = new Control_4.Control(_this.rootElement.getElementsByClassName("tabBar")[0]);
            _this._contentPane = new Control_4.Control(_this.rootElement.getElementsByClassName("tabContentPane")[0]);
            _this.beforeBarContainer = new Control_4.Control(_this.rootElement.getElementsByClassName("beforeBarContainer")[0]);
            _this.afterBarContainer = new Control_4.Control(_this.rootElement.getElementsByClassName("afterBarContainer")[0]);
            _this._tabBarContainer = _this.findElement("tabBarContainer");
            return _this;
        }
        Object.defineProperty(TabControl.prototype, "tabsLeftAligned", {
            get: function () {
                return this._tabBarContainer.classList.contains("tabBarContainerLeftAlign");
            },
            set: function (v) {
                if (v) {
                    this._tabBarContainer.classList.add("tabBarContainerLeftAlign");
                }
                else {
                    this._tabBarContainer.classList.remove("tabBarContainerLeftAlign");
                }
            },
            enumerable: false,
            configurable: true
        });
        TabControl.prototype.addTab = function (tabItem) {
            this._items.push(tabItem);
            tabItem.ownerTabControl = this;
            this._barPanel.appendChild(tabItem.header);
            this._contentPane.appendChild(tabItem);
            if (!this._selectedItem) {
                this.selectedItem = tabItem;
            }
        };
        TabControl.prototype.removeTab = function (tabItem) {
            var indexOfItem = this._items.indexOf(tabItem);
            if (indexOfItem < 0) {
                return;
            }
            if (this.selectedItem === tabItem) {
                this.selectedItem = null;
            }
            this._items.splice(indexOfItem, 1);
            var newSelectedItemIndex = Math.min(this._items.length - 1, indexOfItem);
            if (newSelectedItemIndex >= 0) {
                this.selectedItem = this._items[newSelectedItemIndex];
            }
            this._barPanel.removeChild(tabItem.header);
            this._contentPane.removeChild(tabItem);
            tabItem.ownerTabControl = null;
        };
        TabControl.prototype.containsTab = function (tabItem) {
            return this._items.indexOf(tabItem) >= 0;
        };
        TabControl.prototype.getTab = function (index) {
            return this._items[index];
        };
        TabControl.prototype.length = function () {
            return this._items.length;
        };
        Object.defineProperty(TabControl.prototype, "selectedItem", {
            get: function () { return this._selectedItem; },
            set: function (tabItem) {
                if (this._selectedItem !== tabItem) {
                    if (!this.containsTab(tabItem)) {
                        return;
                    }
                    if (this._selectedItem) {
                        this._selectedItem.active = false;
                    }
                    this._selectedItem = tabItem;
                    if (this._selectedItem) {
                        this._selectedItem.active = true;
                    }
                    if (this.selectedItemChanged) {
                        this.selectedItemChanged();
                    }
                }
            },
            enumerable: false,
            configurable: true
        });
        TabControl.prototype.onTabItemSelected = function (item) {
            this.selectedItem = item;
        };
        return TabControl;
    }(TemplateControl_4.TemplateControl));
    exports.TabControl = TabControl;
});
define("Common/Controls/View", ["require", "exports", "Common/Controls/TemplateControl"], function (require, exports, TemplateControl_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = void 0;
    var View = /** @class */ (function (_super) {
        __extends(View, _super);
        function View(containerId) {
            return _super.call(this, containerId) || this;
        }
        /*overridable*/
        View.prototype.render = function () {
        };
        /*overridable*/
        View.prototype.onResize = function () {
        };
        return View;
    }(TemplateControl_5.TemplateControl));
    exports.View = View;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Util/Constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Constants = void 0;
    var Constants = /** @class */ (function () {
        function Constants() {
        }
        Constants.MinGranularitySupportedInNs = 1;
        Constants.MEMORY_ANALYZER_CLASS_ID = "B821D548-5BA4-4C0E-8D23-CD46CE0C8E23";
        return Constants;
    }());
    exports.Constants = Constants;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Util/EnumHelper", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Enum = void 0;
    var Enum = /** @class */ (function () {
        function Enum() {
        }
        Enum.GetName = function (enumType, value) {
            var result;
            if (enumType) {
                for (var enumKey in enumType) {
                    if (enumType.hasOwnProperty(enumKey)) {
                        var enumValue = enumType[enumKey];
                        if (enumValue === value) {
                            result = enumKey;
                            break;
                        }
                    }
                }
            }
            if (!result) {
                result = value.toString();
            }
            return result;
        };
        Enum.Parse = function (enumType, name, ignoreCase) {
            if (ignoreCase === void 0) { ignoreCase = true; }
            var result;
            if (enumType) {
                if (ignoreCase) {
                    name = name.toLowerCase();
                }
                for (var enumKey in enumType) {
                    if (enumType.hasOwnProperty(enumKey)) {
                        var compareAginst = enumKey.toString();
                        if (ignoreCase) {
                            compareAginst = compareAginst.toLowerCase();
                        }
                        if (name === compareAginst) {
                            result = enumType[enumKey];
                            break;
                        }
                    }
                }
            }
            return result;
        };
        Enum.GetValues = function (enumType) {
            var result = [];
            if (enumType) {
                for (var enumKey in enumType) {
                    if (enumType.hasOwnProperty(enumKey)) {
                        var enumValue = enumType[enumKey];
                        if (typeof enumValue === "number") {
                            result.push(enumValue);
                        }
                    }
                }
            }
            return result;
        };
        return Enum;
    }());
    exports.Enum = Enum;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Util/ErrorFormatter", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ErrorFormatter = void 0;
    var ErrorFormatter = /** @class */ (function () {
        function ErrorFormatter() {
        }
        ErrorFormatter.format = function (error) {
            // Depending on the source, the error object will be different
            return (error.message || error.description);
        };
        return ErrorFormatter;
    }());
    exports.ErrorFormatter = ErrorFormatter;
});
// Due to this bug:
// https://devdiv.visualstudio.com/DevDiv/_workitems/edit/1365099
//
// We copied this file from here:
// https://devdiv.visualstudio.com/DevDiv/_git/VSDaytona?path=%2Fsrc%2Fproduct%2FScripts%2FWebViewHost%2Fplugin.v2%2FContracts%2FEventManager.ts&version=GBmain
define("Common/Util/EventManager", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventManager = void 0;
    var EventImpl = /** @class */ (function () {
        function EventImpl(type, additionalProperties, target) {
            this.type = type;
            this.timeStamp = Date.now();
            this.target = target;
            // Copy additional properties
            var eventObject = this;
            if (additionalProperties && typeof additionalProperties === "object") {
                Object.getOwnPropertyNames(additionalProperties).forEach(function (name) {
                    var pd = Object.getOwnPropertyDescriptor(additionalProperties, name);
                    Object.defineProperty(eventObject, name, pd);
                });
            }
            this.eventPhase = 0;
            this.detail = null;
        }
        Object.defineProperty(EventImpl.prototype, "defaultPrevented", {
            get: function () { return !!this.preventDefaultsCalled; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "bubbles", {
            get: function () { return false; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "cancelable", {
            get: function () { return false; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "currentTarget", {
            get: function () { return this.target; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "trusted", {
            get: function () { return false; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "isTrusted", {
            get: function () { return false; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "returnValue", {
            get: function () { return false; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "CAPTURING_PHASE", {
            get: function () { return EventImpl.CAPTURING_PHASE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "AT_TARGET", {
            get: function () { return EventImpl.AT_TARGET; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EventImpl.prototype, "BUBBLING_PHASE", {
            get: function () { return EventImpl.BUBBLING_PHASE; },
            enumerable: false,
            configurable: true
        });
        EventImpl.prototype.composedPath = function () {
            throw new Error("Method not implemented.");
        };
        EventImpl.prototype.preventDefault = function () {
            this.preventDefaultsCalled = true;
        };
        EventImpl.prototype.stopImmediatePropagation = function () {
            this.stopImmediatePropagationCalled = true;
        };
        EventImpl.prototype.stopPropagation = function () { };
        EventImpl.prototype.initEvent = function (eventTypeArg, canBubbleArg, cancelableArg) { };
        EventImpl.CAPTURING_PHASE = 1;
        EventImpl.AT_TARGET = 2;
        EventImpl.BUBBLING_PHASE = 3;
        return EventImpl;
    }());
    var EventManager = /** @class */ (function () {
        function EventManager(target) {
            this.target = target;
        }
        EventManager.prototype.addEventListener = function (type, listener) {
            /// <summary>
            /// Adds an event listener.
            /// </summary>
            /// <param name="type" type="String">The type (name) of the event.</param>
            /// <param name="listener" type="Function">The listener to invoke when the event gets raised.</param>
            this.listeners = this.listeners || {};
            var eventListeners = (this.listeners[type] = this.listeners[type] || []);
            for (var i = 0, len = eventListeners.length; i < len; i++) {
                var l = eventListeners[i];
                if (l.listener === listener) {
                    return;
                }
            }
            eventListeners.push({ listener: listener });
        };
        EventManager.prototype.dispatchEvent = function (type, eventArg) {
            /// <summary>
            /// Raises an event of the specified type and with the specified additional properties.
            /// </summary>
            /// <param name="type" type="String">The type (name) of the event.</param>
            /// <param name="eventArg" type="Object">The set of additional properties to be attached to the event object when the event is raised.</param>
            /// <returns type="Boolean">true if preventDefault was called on the event.</returns>
            var listeners = this.listeners && this.listeners[type];
            var oneventAttribute = this.target && this.target["on" + type];
            if (listeners || typeof oneventAttribute === "function") {
                var eventValue = new EventImpl(type, eventArg, this.target);
                if (listeners) {
                    // Need to copy the array to protect against people un-registering while we are dispatching
                    listeners = listeners.slice(0, listeners.length);
                    for (var i = 0, len = listeners.length; i < len && !eventValue.stopImmediatePropagationCalled; i++) {
                        listeners[i].listener(eventValue);
                    }
                }
                if (typeof oneventAttribute === "function") {
                    oneventAttribute(eventValue);
                }
                return eventValue.defaultPrevented || false;
            }
            return false;
        };
        EventManager.prototype.removeEventListener = function (type, listener) {
            /// <summary>
            /// Removes an event listener.
            /// </summary>
            /// <param name="type" type="String">The type (name) of the event.</param>
            /// <param name="listener" type="Function">The listener to invoke when the event gets raised.</param>
            var listeners = this.listeners && this.listeners[type];
            if (listeners) {
                for (var i = 0, len = listeners.length; i < len; i++) {
                    var l = listeners[i];
                    if (l.listener === listener) {
                        listeners.splice(i, 1);
                        if (listeners.length === 0) {
                            delete this.listeners[type];
                        }
                        // Only want to remove one element for each call to removeEventListener
                        break;
                    }
                }
            }
        };
        return EventManager;
    }());
    exports.EventManager = EventManager;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Util/EventHelper", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Publisher = void 0;
    var Publisher = /** @class */ (function () {
        function Publisher(events) {
            /// <summary>
            ///     constructor
            /// </summary>
            /// <param name="events">List of supported events.</param>
            /// <summary>
            /// Event publisher.
            /// </summary>
            /// <summary>
            /// List of supported events.
            /// </summary>
            this._events = {};
            /// <summary>
            /// List of all registered events.
            /// </summary>
            this._listeners = {};
            if (events && events.length > 0) {
                for (var i = 0; i < events.length; i++) {
                    var type = events[i];
                    if (type) {
                        this._events[type] = type;
                    }
                }
            }
            else {
                throw Error("Events are null or empty.");
            }
        }
        Publisher.prototype.addEventListener = function (eventType, func) {
            /// <summary>
            ///     Add event Listener
            /// </summary>
            /// <param name="eventType">Event type.</param>
            /// <param name="func">Callback function.</param>
            if (eventType && func) {
                var type = this._events[eventType];
                if (type) {
                    var callbacks = this._listeners[type] ? this._listeners[type] : this._listeners[type] = [];
                    callbacks.push(func);
                }
            }
        };
        Publisher.prototype.removeEventListener = function (eventType, func) {
            /// <summary>
            ///     Remove event Listener
            /// </summary>
            /// <param name="eventType">Event type.</param>
            /// <param name="func">Callback function.</param>
            if (eventType && func) {
                var callbacks = this._listeners[eventType];
                if (callbacks) {
                    for (var i = 0; i < callbacks.length; i++) {
                        if (func === callbacks[i]) {
                            callbacks.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        };
        Publisher.prototype.invokeListener = function (args) {
            /// <summary>
            ///     Invoke event Listener
            /// </summary>
            /// <param name="args">Event argument.</param>
            if (args.type) {
                var callbacks = this._listeners[args.type];
                if (callbacks) {
                    for (var i = 0; i < callbacks.length; i++) {
                        var func = callbacks[i];
                        if (func) {
                            func(args);
                        }
                    }
                }
            }
        };
        return Publisher;
    }());
    exports.Publisher = Publisher;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Util/FormattingHelpers", ["require", "exports", "plugin-vs-v2"], function (require, exports, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FormattingHelpers = void 0;
    var FormattingHelpers = /** @class */ (function () {
        function FormattingHelpers() {
        }
        FormattingHelpers.getPrettyPrintSize = function (bytes, includeSign) {
            if (includeSign === void 0) { includeSign = false; }
            var size = 0;
            var unitAbbreviation;
            if (Math.abs(bytes) > (1024 * 1024 * 1024)) {
                size = bytes / (1024 * 1024 * 1024);
                unitAbbreviation = plugin.Resources.getString("GigabyteUnits");
            }
            else if (Math.abs(bytes) > (1024 * 1024)) {
                size = bytes / (1024 * 1024);
                unitAbbreviation = plugin.Resources.getString("MegabyteUnits");
            }
            else if (Math.abs(bytes) > 1024) {
                size = bytes / 1024;
                unitAbbreviation = plugin.Resources.getString("KilobyteUnits");
            }
            else {
                size = bytes;
                unitAbbreviation = plugin.Resources.getString("ByteUnits");
            }
            return FormattingHelpers.getDecimalLocaleString(parseFloat(size.toFixed(2)), true, includeSign) + " " + unitAbbreviation;
        };
        FormattingHelpers.zeroPad = function (stringToPad, newLength, padLeft) {
            for (var i = stringToPad.length; i < newLength; i++) {
                stringToPad = (padLeft ? ("0" + stringToPad) : (stringToPad + "0"));
            }
            return stringToPad;
        };
        FormattingHelpers.forceNumberSign = function (numberToConvert, positive) {
            // Due to bug:
            // https://devdiv.visualstudio.com/DevDiv/_workitems/edit/1360270
            // We cast the Culture object to one that has a NumberFormat property, so that the compiler stops warning about it
            // since we know the actual object will be available at runtime, just the static typing file is wrong.
            var nf = plugin.Culture.numberFormat;
            if (!nf) {
                nf = {
                    positiveSign: "+",
                    negativeSign: "-",
                };
            }
            if (positive === true) {
                return nf.positiveSign + numberToConvert;
            }
            return nf.negativeSign + numberToConvert;
        };
        // Trims a long string to the format {1-17}...{last 17} characters - mimicking Visual Studio tabs.
        FormattingHelpers.trimLongString = function (stringToConvert) {
            var substitutedString = stringToConvert;
            var maxStringLength = 38;
            if (stringToConvert.length > maxStringLength) {
                var substrLength = (maxStringLength / 2) - 2;
                substitutedString = stringToConvert.substr(0, substrLength) + "\u2026" + stringToConvert.substr(-(substrLength));
            }
            return substitutedString;
        };
        FormattingHelpers.getDecimalLocaleString = function (numberToConvert, includeGroupSeparators, includeSign) {
            if (includeSign === void 0) { includeSign = false; }
            var wasPositive = true;
            if (numberToConvert < 0) {
                wasPositive = false;
                numberToConvert = numberToConvert * -1;
            }
            var numberString = numberToConvert.toString();
            // Get any exponent
            var split = numberString.split(/e/i);
            numberString = split[0];
            var exponent = (split.length > 1 ? parseInt(split[1], 10) : 0);
            // Get any decimal place
            split = numberString.split('.');
            numberString = split[0];
            // Get whole value
            var right = split.length > 1 ? split[1] : "";
            if (exponent > 0) {
                right = FormattingHelpers.zeroPad(right, exponent, false);
                numberString += right.slice(0, exponent);
                right = right.substr(exponent);
            }
            else if (exponent < 0) {
                exponent = -exponent;
                numberString = FormattingHelpers.zeroPad(numberString, exponent + 1, true);
                right = numberString.slice(-exponent, numberString.length) + right;
                numberString = numberString.slice(0, -exponent);
            }
            // Due to bug:
            // https://devdiv.visualstudio.com/DevDiv/_workitems/edit/1360270
            // We cast the Culture object to one that has a NumberFormat property, so that the compiler stops warning about it
            // since we know the actual object will be available at runtime, just the static typing file is wrong.
            var nf = plugin.Culture.numberFormat;
            if (!nf) {
                nf = { numberDecimalSeparator: ".", numberGroupSizes: [3], numberGroupSeparator: "," };
            }
            if (right.length > 0) {
                right = nf.numberDecimalSeparator + right;
            }
            // Grouping (e.g. 10,000)
            if (includeGroupSeparators === true) {
                var groupSizes = nf.numberGroupSizes, sep = nf.numberGroupSeparator, curSize = groupSizes[0], curGroupIndex = 1, stringIndex = numberString.length - 1, ret = "";
                while (stringIndex >= 0) {
                    if (curSize === 0 || curSize > stringIndex) {
                        if (ret.length > 0) {
                            numberString = numberString.slice(0, stringIndex + 1) + sep + ret + right;
                        }
                        else {
                            numberString = numberString.slice(0, stringIndex + 1) + right;
                        }
                        if (includeSign) {
                            numberString = FormattingHelpers.forceNumberSign(numberString, wasPositive);
                        }
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
                numberString = numberString.slice(0, stringIndex + 1) + sep + ret + right;
                if (includeSign) {
                    numberString = FormattingHelpers.forceNumberSign(numberString, wasPositive);
                }
                return numberString;
            }
            else {
                numberString = numberString + right;
                if (includeSign) {
                    numberString = FormattingHelpers.forceNumberSign(numberString, wasPositive);
                }
                return numberString;
            }
        };
        FormattingHelpers.forceNonBreakingSpaces = function (stringToConvert) {
            var substitutedString = stringToConvert.replace(/\s/g, function (match, pos, originalText) {
                return "\u00a0";
            });
            return substitutedString;
        };
        FormattingHelpers.getNativeDigitLocaleString = function (stringToConvert) {
            // Due to bug:
            // https://devdiv.visualstudio.com/DevDiv/_workitems/edit/1360270
            // We cast the Culture object to one that has a NumberFormat property, so that the compiler stops warning about it
            // since we know the actual object will be available at runtime, just the static typing file is wrong.
            var nf = plugin.Culture.numberFormat;
            if (!nf) {
                nf = {
                    nativeDigits: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
                };
            }
            var substitutedString = stringToConvert.replace(/\d/g, function (match, pos, originalText) {
                return (nf.nativeDigits[parseInt(match)]);
            });
            return substitutedString;
        };
        // Simple string formatter, replacing {0},{1}... tokens with passed strings
        FormattingHelpers.stringFormat = function (formatString, values) {
            var formattedString = formatString;
            for (var i = 0; i < values.length; i++) {
                var formatToken = "{" + i + '}';
                formattedString = formattedString.replace(formatToken, values[i]);
            }
            return formattedString;
        };
        return FormattingHelpers;
    }());
    exports.FormattingHelpers = FormattingHelpers;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("Common/Util/Utilities", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Utilities = void 0;
    var Utilities = /** @class */ (function () {
        function Utilities() {
        }
        Utilities.htmlEncode = function (value) {
            Utilities.HtmlEncodeDiv.innerText = value;
            return Utilities.HtmlEncodeDiv.innerHTML;
        };
        Utilities.HtmlEncodeDiv = document.createElement("div");
        return Utilities;
    }());
    exports.Utilities = Utilities;
});
//# sourceMappingURL=VsGraphics.js.map
// SIG // Begin signature block
// SIG // MIIoQQYJKoZIhvcNAQcCoIIoMjCCKC4CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // jcgHWawOTnZeAj3+EoK4QLmooHButNjB1J6kCY1LkTSg
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
// SIG // DQEJBDEiBCCIB4woIqN6Jzb/P/x17Zpi80cmc5plHU0G
// SIG // qaq/i3UJlDBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAKYjNY2i
// SIG // VjLsoIo5+AcqC+kqqoqft9O/WklwvDXsXLjtm3GugGlf
// SIG // x6CSRQ2fMmP2879KV0xlqak39zO8WBOoXfsKK86Uk1Ry
// SIG // goRYDE4wL8HRcLbJvs6d0Ay7x47APYLHFVmiSJOEVdK1
// SIG // k2OXgrKdYSokz0asek/1Gz+ob67WjjwyowW/OPMos0G1
// SIG // us4lCxWj1LvuRGXfZDxOsV+HsTO9VwYWxpnos9gqrsv+
// SIG // HptYVbL/tm6WUWExlEmF9sX4TwBTwyP569uQWqIRfeRo
// SIG // yeVhfcfV7k9G8MsiAVqfowu2PrRtRF64ZLKDiv9Y8fau
// SIG // 5IxzAYB4MTyOTfZj8NMvc8jn7oqhghetMIIXqQYKKwYB
// SIG // BAGCNwMDATGCF5kwgheVBgkqhkiG9w0BBwKggheGMIIX
// SIG // ggIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBWgYLKoZIhvcN
// SIG // AQkQAQSgggFJBIIBRTCCAUECAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgJNrEI499trSUKkgvSvkd
// SIG // PA84z6jrtkSXI6PSWr2DAxACBmdi7D8QWBgTMjAyNTAx
// SIG // MTYxODQ0NTQuNDU1WjAEgAIB9KCB2aSB1jCB0zELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWljcm9zb2Z0
// SIG // IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVkMScwJQYD
// SIG // VQQLEx5uU2hpZWxkIFRTUyBFU046NTkxQS0wNUUwLUQ5
// SIG // NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFNlcnZpY2WgghH7MIIHKDCCBRCgAwIBAgITMwAAAfQX
// SIG // RoXAyz855QABAAAB9DANBgkqhkiG9w0BAQsFADB8MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0yNDA3MjUx
// SIG // ODMwNTlaFw0yNTEwMjIxODMwNTlaMIHTMQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMS0wKwYDVQQLEyRNaWNyb3NvZnQgSXJl
// SIG // bGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNVBAsT
// SIG // Hm5TaGllbGQgVFNTIEVTTjo1OTFBLTA1RTAtRDk0NzEl
// SIG // MCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vy
// SIG // dmljZTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKcIThOm0IAvaquIyRl9gNcqDm35NKnrUPJJI/uZ
// SIG // t+1gcQ5bGeaCZ438x7Kaj4jhFc2dstsoBoDWd/8XWUDe
// SIG // 3/QNVqdQHYeah12WYd0gV/AAbnOvU293CeSgmXFw7Ln8
// SIG // Jl3go/NRMyRCGarlXVfEk5ULngf29TCGLeUSorN7sM3Z
// SIG // X0pdHJB2xs6DvdWEyoOiBMaimKIxq3gqKZyCsTr5K+VW
// SIG // bI9n/eQW9SxhL7oQSJvwuycrLybwWVjba7Kc8l1Z7qPp
// SIG // AxMmcKZKYbEfGb3YvrP6UIqH5nW1tVKs1pal0FYKGF22
// SIG // mJBMmkof4XgbcI9bbnvi3LjnBwD4G8Gb0C5LCmiuOqJL
// SIG // a3oDkeHtInLBogFkfSC/p8uJpQlDQPOBexhBFjhL4m4o
// SIG // O8LK02umW87jLMk4tgM+Kj1d0EZBYMUm6eEeDhCp4p/C
// SIG // c+FyyNcF4QYSKTBnwNwU/OdJ6mps0og+S+acflbXwotD
// SIG // CU0tiwxdT2lWcJclWSFY1RyvKIdh2BvU9uhY0ffyPOYu
// SIG // RMcZoR6cTNmflISXmQOi8+Odpv/sawOMa3WGrOXJuxVI
// SIG // ctuKzy1R/hcvmcsBwKfXPaFk67Y3yCqiyL2LYCXONUPF
// SIG // sW2T0ewdbn7fARbL89nTki5MTwy3F1stegDcu979IqQs
// SIG // QMFBAvYbLItC3QfE4YjX/+APkWfLAgMBAAGjggFJMIIB
// SIG // RTAdBgNVHQ4EFgQUK3RloQrRLD4ndSyc7E2i0ykG35sw
// SIG // HwYDVR0jBBgwFoAUn6cVXQBeYl2D9OXSZacbUzUZ6XIw
// SIG // XwYDVR0fBFgwVjBUoFKgUIZOaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tL3BraW9wcy9jcmwvTWljcm9zb2Z0JTIw
// SIG // VGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3JsMGwG
// SIG // CCsGAQUFBwEBBGAwXjBcBggrBgEFBQcwAoZQaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jZXJ0cy9N
// SIG // aWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIwMjAx
// SIG // MCgxKS5jcnQwDAYDVR0TAQH/BAIwADAWBgNVHSUBAf8E
// SIG // DDAKBggrBgEFBQcDCDAOBgNVHQ8BAf8EBAMCB4AwDQYJ
// SIG // KoZIhvcNAQELBQADggIBAN3B0g8SSlA7IGnCH0V+tLoD
// SIG // g0obAasLRFEVG1F3g5mGEmuaBY9+Ebo1t4Dngrfzmwzu
// SIG // Ob36Z2BuTkuWKMMLBcNfYIgiOiVfnHBv6qjNPJ8QEm88
// SIG // FraraK80IiYfbqbBOE1WXimF5m8se1jfbXW1SKwnpVY+
// SIG // z+onzB00i7egZsqEtsZQtnH4CjzwNd70t3rqlJes8Hux
// SIG // gIY34zV4ypROEjVib3aoK79BlESo6pmpjb4ZkiWp3uk2
// SIG // M6XQwnoKvGnZRh/OSNRFipnxEW9ZcysuTjDtnvSJAJb8
// SIG // naVLp9At7DRLadHoZYk9Eq2qvI3GFQx+ANgvzGywSMIp
// SIG // I8IhRkOEpRS09k4G+Br76XFlcwccA6PSEQcKc54G8s24
// SIG // YfeVFTq0C9q21h6xw0hN3YHS9srmh0YGOx2GC7OS7bN9
// SIG // MFPTrofDeeEVLWuhhWRceQOLiE4MiXFXVlWjdKo7NHhI
// SIG // 8BMjVL9HES7h1iQXo5DHt6kQIbwo54a6OwxkVmiJXcn8
// SIG // 2apZ+hbJy0N25fmb1SVk2Cbi/iGSyNkotyKyEX43HJ9v
// SIG // V9gV/789inGLmyIyul32L62UDeFym570qgTQMCD2NsSX
// SIG // geKPTwxBSNq3D2i1Ms+SFeyT9yUaYIN8bFKrxR5Uhurj
// SIG // CFo8B9BkCCMKwts0cvpTWbDip67sshzEEz+48uVPdqhB
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
// SIG // ZWxkIFRTUyBFU046NTkxQS0wNUUwLUQ5NDcxJTAjBgNV
// SIG // BAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2Wi
// SIG // IwoBATAHBgUrDgMCGgMVAL/i2f1YNLNe13pOIhvUfXP+
// SIG // /gCOoIGDMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEm
// SIG // MCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENB
// SIG // IDIwMTAwDQYJKoZIhvcNAQELBQACBQDrM6SxMCIYDzIw
// SIG // MjUwMTE2MTUzMDU3WhgPMjAyNTAxMTcxNTMwNTdaMHQw
// SIG // OgYKKwYBBAGEWQoEATEsMCowCgIFAOszpLECAQAwBwIB
// SIG // AAICG0YwBwIBAAICEw0wCgIFAOs09jECAQAwNgYKKwYB
// SIG // BAGEWQoEAjEoMCYwDAYKKwYBBAGEWQoDAqAKMAgCAQAC
// SIG // AwehIKEKMAgCAQACAwGGoDANBgkqhkiG9w0BAQsFAAOC
// SIG // AQEAgODPkPkogHlXFXHgGD+tYSus45bzZT+YtglDHJWQ
// SIG // WWUGl0CWdX1L2j2uGYz0UdlJ8lGLPZS3KEaK4T/uWq9I
// SIG // ZYQjh2v1eJTvE+2fO7aJCxVC7UMBeTiFsX5JnVq7Tr1/
// SIG // 8QAJRQBxmHfqVcle149j8ei+f++4ZWpVhjSIu6k/k1Y3
// SIG // KLBZm+jh5YrnYZddI3wzMzOt2GERLGDcKwLhM60qWOL8
// SIG // k6d+/WjEZcFpX4JGB3emCc3w82cv+lz7av7xt0AORo0a
// SIG // BZTWc5DSIXd7b8vHRV29BuAPARPspBGXdNd32/bp35fJ
// SIG // lvQbNQzdFVOxcPe5qlUIDvCH+leaAoh0MNFv9DGCBA0w
// SIG // ggQJAgEBMIGTMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwAhMzAAAB9BdGhcDLPznlAAEAAAH0MA0GCWCGSAFl
// SIG // AwQCAQUAoIIBSjAaBgkqhkiG9w0BCQMxDQYLKoZIhvcN
// SIG // AQkQAQQwLwYJKoZIhvcNAQkEMSIEIBTWI8eXhil6AwbY
// SIG // evGSEO6e2Df2kw8uXUjql9SNzPyzMIH6BgsqhkiG9w0B
// SIG // CRACLzGB6jCB5zCB5DCBvQQgP1jCfG4mk+p475JJwfEO
// SIG // 4UkCIvMrOryAb2YOtEQY1mswgZgwgYCkfjB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAfQXRoXAyz85
// SIG // 5QABAAAB9DAiBCCmxojQNrpwa6aywXBcnrcBMZy2TLDm
// SIG // idNZ17abKjW9QDANBgkqhkiG9w0BAQsFAASCAgBSKiRP
// SIG // rh6O8/GE5vdQGTP8o0Pdeegi2AnC6dIVhbs3ItkTem3R
// SIG // +PHYTqke0zgxo+xfcB2JK4/vtcMm+yyk3moxwaxocEmY
// SIG // +jjlZs7z8ff92QYOHz5rsZjc05ntw4T+tagWxZaGCXel
// SIG // IflNPBlAhOhvI8khFOwmd2eDP/qkc6dLJ0+ZZDMKx2PP
// SIG // DYwa+uramuFvUgut2Rp8xPTJRHBEWxhSR2o+ftxkspfL
// SIG // UPRbg9ejtpA/z7oGcWBEOwA1cauIPZ/4z9IgKnl5iicg
// SIG // 6PSaX4x6W9xzA+sM8yw+0SV35axTmRqj78eScHdn1s0n
// SIG // W9g+7MH4Q/C78BdDClsDolPmSOqr0VfLioA+W5eV2+TS
// SIG // n23VOujKHD3+nQhNH2uMXPgE24Fb+ecmCpRyDfSwa+gV
// SIG // CVXkepVt6OUjRY4gfEkfVU3/GRpSARuxH30eD9mL0eTb
// SIG // sdNSBVIvxqkWOweBHDwo4QGXTDeR6cPvdAFbHMOpsCiw
// SIG // TioEQKIhgZ8Lr1cHQYQx35vEmbIqJJZSnPYdaX/SfGHT
// SIG // fwiXNGzgf9Bc+X+xIVJqQobk/jcnhzG9dMdvSQvD7P0s
// SIG // BYQYF27ch36jDH2d59VPaaKk3jGJ4rO0qGYdg2bfe7C6
// SIG // ksrmrbKT+Mfd+CRQtbAEC5EP/hXoPcw+jdQ5wsnfEJ/T
// SIG // Xvf2o2vy1+0hvB7bhQ==
// SIG // End signature block
