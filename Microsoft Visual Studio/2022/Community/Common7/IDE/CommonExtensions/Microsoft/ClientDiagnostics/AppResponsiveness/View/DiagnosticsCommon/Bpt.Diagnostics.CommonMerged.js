// 
// Copyright (C) Microsoft. All rights reserved.
//
// THIS IS ONLY HERE FOR UNIT TESTS. UNIT TESTS CURRENTLY BUILD IN SINGLE FILE MODE,
// FOLLOWING <reference> TAGS. THESE EXPECT THIS FILE TO BE IN THE SOURCE TREE IN THE COMMON
// DIRECTORY, WHEREAS IN REALITY IT'S ONLY IN THE COMMON DIRECTORY AFTER BUILDING.
var isDebugBuild = true;
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/errorHandling", ["require", "exports", "plugin-vs-v2"], function (require, exports, Plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ErrorHandling = void 0;
    class ErrorHandling {
        /**
         * Reports to Watson given a textual stack, parsing out relevant information so it can be bucketed.
         * @param error The Error object.
         */
        static reportErrorGivenStack(error) {
            // Example of error.stack:
            //
            // "Error: failure pretty printing
            //    at Anonymous function (res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/debugger/DebuggerMerged.js:11993:25)
            //    at notifySuccess(res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/pluginhost/plugin.f12.js:6739:21)
            //    at enter(res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/pluginhost/plugin.f12.js:6426:21)
            //    at _run(res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/pluginhost/plugin.f12.js:6642:17)
            //    at _completed(res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/pluginhost/plugin.f12.js:6610:13)
            //    at Anonymous function (res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/debugger/DebuggerMerged.js:11450:33)
            //    at notifySuccess(res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/pluginhost/plugin.f12.js:6739:21)
            //    at enter(res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/pluginhost/plugin.f12.js:6426:21)
            //    at _run(res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/pluginhost/plugin.f12.js:6642:17)
            //    at _completed(res://C:\Program Files\Internet Explorer\iexplore.exe.local\F12Resources.dll/23/pluginhost/plugin.f12.js:6610:13)"
            //
            // In this case we want "debugger/debuggermerged.js", 11993 and 25.
            //
            var message = error.message;
            var stack = error.stack;
            // Remove all but the top function
            var firstCloseParen = stack.indexOf(")");
            if (firstCloseParen > 0) {
                stack = stack.substr(0, firstCloseParen + 1);
            }
            var result = ErrorHandling.StackRegex.exec(stack);
            if (result) {
                // result[1] is the function name
                var file = result[3];
                var line = parseInt(result[4], 10);
                var column = parseInt(result[5], 10);
                window.reportError(message, file, line, error.stack /* full stack */, column);
            }
        }
    }
    exports.ErrorHandling = ErrorHandling;
    ErrorHandling.StackRegex = new RegExp(".* at ([^(]+) \(.*/23/([^:]+):([0-9]+):([0-9]+)\)", "gim");
    // window is undefined in web workers
    if (typeof window !== "undefined") {
        // Overrides the implementation from bptoob\ScriptedHost\Scripts\diagnostics.ts (typescriptapis\bptoob\inc\diagnostics.ts)
        // to add the ability to report the error to the window.errorDisplayHandler before doing "reportError"
        // It also does not call Plugin.Diagnostics.terminate() at the end of onerror.
        /**
         * Handles JavaScript errors in the toolwindows by reporting them as non-fatal errors
         * @param message The error message
         * @param file The file in which the error occurred
         * @param line The line on which the error occurred
         * @param additionalInfo Any additional information about the error such as callstack
         * @param column The column on which the error occurred
         */
        window.reportError = function (message, file, line, additionalInfo, column) {
            // Microsoft.Plugin error reporting causes an error if any of these values are null
            message = message || "";
            file = file || "";
            line = line || 0;
            additionalInfo = additionalInfo || "";
            column = column || 0;
            if (isDebugBuild) {
                // Report to the "UI" in some way
                var externalObj;
                if (window.parent.getExternalObj) {
                    // Hosted in an IFRAME, so get the external object from there
                    externalObj = window.parent.getExternalObj();
                }
                else if (window.external) {
                    // Hosted in Visual Studio
                    externalObj = window.external;
                }
                if (externalObj) {
                    var component = (window.errorComponent ? window.errorComponent : "Common");
                    console.error([component, message, file, line, column].join("\r\n"));
                    // Display a warning message to the user
                    if (window.errorDisplayHandler) {
                        window.errorDisplayHandler(message, file, line, additionalInfo, column);
                    }
                }
            }
            // Report the NFE to the watson server
            if (Plugin.Diagnostics && Plugin.Diagnostics.reportError) {
                Plugin.Diagnostics.reportError(message, file, line, additionalInfo, column);
            }
        };
        /**
         * Handles JavaScript errors in the toolwindows by reporting them as non-fatal errors
         * Some hosts then terminate, F12 does not.
         * @param message The error message
         * @param file The file in which the error occurred
         * @param line The line on which the error occurred
         * @param columnNumber Optional column number on which the error occurred
         * @return Returns true to mark the error as handled, False to display the default error dialog
         */
        window.onerror = function (message, file, line, columnNumber) {
            // In IE11 GDR onwards, there is actually a 5th argument, for error - but the Typescript stubs aren't updated
            var column = 0;
            var additionalInfo = "";
            if (arguments) {
                if (arguments[3] && typeof arguments[3] === "number") {
                    column = arguments[3];
                }
                if (arguments[4] && arguments[4] instanceof Error) {
                    additionalInfo = "Error number: " + arguments[4].number;
                    additionalInfo += "\r\nStack: " + arguments[4].stack;
                }
            }
            window.reportError(message, file, line, additionalInfo, column);
            return true;
        };
    }
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", ["require", "exports", "diagnosticsHub", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/errorHandling"], function (require, exports, DiagnosticsHub, errorHandling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Assert = void 0;
    /**
     * Utility functions for verifying internal state.
     * These assertions always be true unless there is a programming error or installation error.
     * User error should be tested with "if" and fail with a localized string.
     * Not intended to be used in unit test code, only product code.
     */
    class Assert {
        // Possible other asserts:
        //
        // isInstanceOfType(value: any, comparand: any)
        // succeeded(message: string, (any)=>any)
        // isMatch(value: string, pattern: string)
        // isNumber/Array/Function/String
        //
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
                // This cannot happen in the Chakra engine.
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
                // This cannot happen in the Chakra engine.
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
            // Could probe for an equals() method?
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
            // Uncomment next line if you wish
            // debugger;
            var error = new Error((message || "Assert failed.") + "\n");
            try {
                // The error must be thrown in order to have a call stack for us to report
                throw error;
            }
            catch (ex) {
                if (errorHandling_1.ErrorHandling) { // If we are not in remote code
                    // The error now has a call stack so we can report it
                    // If we simply let this throw, we would instead report it in windows.onerror, and would not have the callstack at that point
                    errorHandling_1.ErrorHandling.reportErrorGivenStack(ex);
                }
                // We could choose to comment out this line to ship (or in release) so that we plow on.
                // However, plowing on in an unknown state is rarely doing the user a favor.
                // Instead, we should catch the exception at a sufficiently high level in the stack that we can recover.
                // This will generally get trapped in the global exception handler, which Daytona will translate into a WER report (unless WER is disabled)
                throw ex;
            }
        }
        static failDebugOnly(message) {
            // Fail if it is a debug build
            if (DiagnosticsHub.Assert.isDebugBuild()) {
                Assert.fail(message);
            }
        }
    }
    exports.Assert = Assert;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Control = void 0;
    // Create a new control with the given root HTMLElement. If the root is not
    // provided, a default <div> root is used.
    class Control {
        constructor(root) {
            this._rootElement = root;
            if (typeof this._rootElement === "undefined") {
                // We must have a root element to start with, default to a div.
                // This can change at any time by setting the property rootElement.
                this._rootElement = document.createElement("div");
                this._rootElement.style.width = this._rootElement.style.height = "100%";
            }
            else if (this._rootElement === null) {
                throw new Error("Invalid root element for Control.");
            }
        }
        get rootElement() { return this._rootElement; }
        set rootElement(newRoot) {
            if (!newRoot) {
                throw new Error("Invalid root");
            }
            var oldRoot = this._rootElement;
            this._rootElement = newRoot;
            if (oldRoot && oldRoot.parentNode) {
                oldRoot.parentNode.replaceChild(newRoot, oldRoot);
            }
        }
        get parent() { return this._parent; }
        set parent(newParent) {
            if (this._parent !== newParent) {
                this._parent = newParent;
                if (this._parent && !this._parent.rootElement.contains(this._rootElement)) {
                    this._parent.appendChild(this);
                }
                this.onParentChanged();
            }
        }
        appendChild(child) {
            this._rootElement.appendChild(child.rootElement);
            child.parent = this;
        }
        removeChild(child) {
            if (child.rootElement.parentElement) {
                this._rootElement.removeChild(child.rootElement);
                child.parent = null;
            }
        }
        // overridable
        onParentChanged() {
        }
    }
    exports.Control = Control;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.preventIEKeys = exports.HasOnlyCtrlKeyFlags = exports.HasAnyOfAltCtrlShiftKeyFlags = exports.blockBrowserAccelerators = exports.KeyFlags = exports.MouseButtons = exports.KeyCodes = exports.Keys = void 0;
    /**
     * Use the Keys members to test against KeyboardEvent.key.
     * This is preferred over testing KeyboardEvent.keyCode, which is deprecated.
     */
    class Keys {
    }
    exports.Keys = Keys;
    Keys.C = "c";
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
    /**
     * Use the KeyCodes enumeration to test against KeyboardEvent.keyCode.
     * This is deprecated in favor of testing KeyboardEvent.key.
     */
    var KeyCodes;
    (function (KeyCodes) {
        KeyCodes[KeyCodes["Backspace"] = 8] = "Backspace";
        KeyCodes[KeyCodes["Tab"] = 9] = "Tab";
        KeyCodes[KeyCodes["Enter"] = 13] = "Enter";
        KeyCodes[KeyCodes["Shift"] = 16] = "Shift";
        KeyCodes[KeyCodes["Control"] = 17] = "Control";
        KeyCodes[KeyCodes["Alt"] = 18] = "Alt";
        KeyCodes[KeyCodes["CapsLock"] = 20] = "CapsLock";
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
        KeyCodes[KeyCodes["Insert"] = 45] = "Insert";
        KeyCodes[KeyCodes["Delete"] = 46] = "Delete";
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
        KeyCodes[KeyCodes["ContextMenu"] = 93] = "ContextMenu";
        KeyCodes[KeyCodes["Multiply"] = 106] = "Multiply";
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
        KeyCodes[KeyCodes["Comma"] = 188] = "Comma";
        KeyCodes[KeyCodes["Period"] = 190] = "Period";
    })(KeyCodes = exports.KeyCodes || (exports.KeyCodes = {}));
    var MouseButtons;
    (function (MouseButtons) {
        MouseButtons[MouseButtons["LeftButton"] = 0] = "LeftButton";
        MouseButtons[MouseButtons["MiddleButton"] = 1] = "MiddleButton";
        MouseButtons[MouseButtons["RightButton"] = 2] = "RightButton";
    })(MouseButtons = exports.MouseButtons || (exports.MouseButtons = {}));
    // This maps to KeyFlags enum defined in 
    // $/devdiv/feature/VSClient_1/src/bpt/diagnostics/Host/Common/common.h
    var KeyFlags;
    (function (KeyFlags) {
        KeyFlags[KeyFlags["None"] = 0] = "None";
        KeyFlags[KeyFlags["Shift"] = 1] = "Shift";
        KeyFlags[KeyFlags["Ctrl"] = 2] = "Ctrl";
        KeyFlags[KeyFlags["Alt"] = 4] = "Alt";
    })(KeyFlags = exports.KeyFlags || (exports.KeyFlags = {}));
    /**
     * Add listeners to the document to prevent certain IE browser accelerator keys from
     * triggering their default action in IE
     */
    function blockBrowserAccelerators() {
        // Prevent the default F5 refresh, default F6 address bar focus, and default SHIFT + F10 context menu
        document.addEventListener("keydown", (e) => {
            return preventIEKeys(e);
        });
        // Prevent the default context menu
        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        // Prevent mouse wheel zoom
        window.addEventListener("mousewheel", (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    }
    exports.blockBrowserAccelerators = blockBrowserAccelerators;
    /**
     * Checks to see if any of the ALT, SHIFT, or CTRL keys are pressed
     * @param e The keyboard event to check
     * @return true if the event has any of the key flags toggled on
     */
    function HasAnyOfAltCtrlShiftKeyFlags(e) {
        return e.shiftKey || e.ctrlKey || e.altKey;
    }
    exports.HasAnyOfAltCtrlShiftKeyFlags = HasAnyOfAltCtrlShiftKeyFlags;
    /**
     * Checks to see if only CTRL keys are pressed, not ALT or SHIFT
     * @param e The keyboard event to check
     * @return true if the event has any of the key flags toggled on
     */
    function HasOnlyCtrlKeyFlags(e) {
        return e.ctrlKey && !e.shiftKey && !e.altKey;
    }
    exports.HasOnlyCtrlKeyFlags = HasOnlyCtrlKeyFlags;
    /**
     * Prevents IE from executing default behavior for certain shortcut keys
     * This should be called from keydown handlers that do not already call preventDefault().
     * Some shortcuts cannot be blocked via javascript (such as CTRL + P print dialog) so these
     * are already blocked by the native hosting code and will not get sent to the key event handlers.
     * @param e The keyboard event to check and prevent the action on
     * @return false to stop the default action- which matches the keydown/keyup handlers
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
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/button", ["require", "exports", "plugin-vs-v2", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes"], function (require, exports, Plugin, control_1, KeyCodes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Button = void 0;
    class Button extends control_1.Control {
        constructor(element) {
            super(element);
            this.rootElement.addEventListener("click", (e) => this.onClick(e));
            this.rootElement.addEventListener("keydown", (e) => this.onKeydown(e));
            this.rootElement.addEventListener("mousedown", (e) => this.onMouseDown(e));
            this.rootElement.addEventListener("mouseup", (e) => this.onMouseUpLeave(e));
            this.rootElement.addEventListener("mouseleave", (e) => this.onMouseUpLeave(e));
        }
        get click() { return this._onClick; }
        set click(value) {
            this._onClick = value;
        }
        get content() { return this.rootElement.innerHTML; }
        set content(value) {
            this.rootElement.innerHTML = value;
        }
        get tooltip() { return this._tooltip; }
        set tooltip(value) {
            this._tooltip = value;
            this.rootElement.onmouseover = () => {
                Plugin.Tooltip.show({ content: this._tooltip });
                return true;
            };
        }
        get disabled() { return (this.rootElement).disabled; }
        set disabled(value) { (this.rootElement).disabled = value; }
        // overridable
        onClick(ev) {
            this.rootElement.focus();
            if (this._onClick) {
                this._onClick();
            }
        }
        // overridable
        onKeydown(ev) {
            if (ev.keyCode === KeyCodes_1.KeyCodes.Space || ev.keyCode === KeyCodes_1.KeyCodes.Enter) {
                if (this._onClick) {
                    this._onClick();
                }
                ev.preventDefault();
            }
        }
        onMouseDown(ev) {
            if (!this.disabled) {
                this.rootElement.classList.add("BPT-ToolbarButton-MouseDown");
            }
        }
        onMouseUpLeave(ev) {
            this.rootElement.classList.remove("BPT-ToolbarButton-MouseDown");
        }
    }
    exports.Button = Button;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ButtonHelpers", ["require", "exports", "plugin-vs-v2", "diagnosticsHub-swimlanes"], function (require, exports, Plugin, DiagnosticsHubSwimlanes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ButtonHelpers = void 0;
    class ButtonHelpers {
        static changeButtonStatus(buttonDiv, enabled, pressed) {
            var wasEnabled = ButtonHelpers.isEnabled(buttonDiv);
            if (enabled && !wasEnabled) {
                buttonDiv.classList.remove("toolbarButtonStateDisabled");
                buttonDiv.setAttribute("aria-disabled", "false");
            }
            else if (!enabled && wasEnabled) {
                buttonDiv.classList.add("toolbarButtonStateDisabled");
                buttonDiv.setAttribute("aria-disabled", "true");
            }
            if (typeof pressed === "boolean") {
                ButtonHelpers.IsChangingAriaPressed = true;
                if (pressed) {
                    buttonDiv.setAttribute("aria-pressed", "true");
                    buttonDiv.classList.add("toolbarButtonStateActive");
                }
                else {
                    buttonDiv.setAttribute("aria-pressed", "false");
                    buttonDiv.classList.remove("toolbarButtonStateActive");
                }
                ButtonHelpers.IsChangingAriaPressed = false;
            }
        }
        static isEnabled(buttonDiv) {
            return !buttonDiv.classList.contains("toolbarButtonStateDisabled");
        }
        static isValidEvent(event) {
            return (event.type === "click" || event.keyCode === DiagnosticsHubSwimlanes.KeyCodes.Enter || event.keyCode === DiagnosticsHubSwimlanes.KeyCodes.Space) && ButtonHelpers.isEnabled(event.currentTarget);
        }
        static setButtonTooltip(buttonDiv, tooltipResourceName) {
            var tooltip = Plugin.Resources.getString(tooltipResourceName);
            buttonDiv.setAttribute("data-plugin-vs-tooltip", tooltip);
            buttonDiv.setAttribute("aria-label", tooltip);
        }
        static setupButton(buttonDiv, tooltipResourceName, clickHandler, isEnabled = true) {
            if (typeof tooltipResourceName === "string") {
                ButtonHelpers.setButtonTooltip(buttonDiv, tooltipResourceName);
                buttonDiv.setAttribute("role", "button");
            }
            if (clickHandler) {
                buttonDiv.addEventListener("click", (event) => ButtonHelpers.onButtonPress(event, clickHandler));
                buttonDiv.addEventListener("keydown", (event) => ButtonHelpers.onButtonPress(event, clickHandler));
                buttonDiv.addEventListener("DOMAttrModified", (event) => {
                    if (!ButtonHelpers.IsChangingAriaPressed && ButtonHelpers.isEnabled(buttonDiv) && event.attrName === "aria-pressed" && event.attrChange === event.MODIFICATION) {
                        clickHandler(event);
                    }
                });
            }
            buttonDiv.addEventListener("mousedown", ButtonHelpers.onButtonMouseDown);
            buttonDiv.addEventListener("mouseenter", ButtonHelpers.onButtonMouseEnter);
            buttonDiv.addEventListener("mouseleave", ButtonHelpers.onButtonMouseLeave);
            buttonDiv.addEventListener("mouseup", ButtonHelpers.onButtonMouseUp);
            if (!isEnabled) {
                ButtonHelpers.changeButtonStatus(buttonDiv, /* enabled = */ false);
            }
        }
        static onButtonMouseDown(event) {
            var buttonDiv = event.currentTarget;
            if (ButtonHelpers.isEnabled(buttonDiv)) {
                buttonDiv.classList.add("toolbarButtonMouseDown");
            }
            else {
                event.stopImmediatePropagation();
            }
        }
        static onButtonMouseEnter(event) {
            var buttonDiv = event.currentTarget;
            if (ButtonHelpers.isEnabled(buttonDiv)) {
                buttonDiv.classList.add("toolbarButtonMouseHover");
            }
            else {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }
        static onButtonMouseLeave(event) {
            var buttonDiv = event.currentTarget;
            buttonDiv.classList.remove("toolbarButtonMouseHover");
            buttonDiv.classList.remove("toolbarButtonMouseDown");
        }
        static onButtonMouseUp(event) {
            var buttonDiv = event.currentTarget;
            buttonDiv.classList.remove("toolbarButtonMouseDown");
        }
        // Used for disabled handling
        static onButtonPress(event, clickHandler) {
            if (ButtonHelpers.isValidEvent(event)) {
                clickHandler(event);
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }
    }
    exports.ButtonHelpers = ButtonHelpers;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/contentControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control"], function (require, exports, control_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentControl = void 0;
    // This ContentControl is a control that only allows a single child (content).
    class ContentControl extends control_2.Control {
        constructor() {
            super();
        }
        get content() { return this._content; }
        set content(newContent) {
            if (this._content !== newContent) {
                if (this._content) {
                    this.removeChild(this._content);
                }
                this._content = newContent;
                this.appendChild(this._content);
                this.onContentChanged();
            }
        }
        appendChild(child) {
            if (this.rootElement.children.length !== 0) {
                throw new Error("Only one child is allowed in a content control.");
            }
            super.appendChild(child);
        }
        // overridable
        onContentChanged() {
        }
    }
    exports.ContentControl = ContentControl;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/CssUtilities", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CssUtilities = void 0;
    class CssUtilities {
        /**
         * Adds classes (and doesn't add duplicates)
         * @param originalClasses the original classes (space seperated) to add to
         * @param addClasses the classes (space seperated) to add
         * @return the original classes with the added additional classes
         */
        static addClasses(originalClasses, addClasses) {
            var newClasses = originalClasses ? originalClasses.split(" ") : [];
            var addList = addClasses ? addClasses.split(" ") : [];
            for (var i = 0; i < addList.length; i++) {
                if (newClasses.indexOf(addList[i]) === -1) {
                    newClasses.push(addList[i]);
                }
            }
            return newClasses.join(" ");
        }
        /**
         * Removes classes (does nothing if the class wasn't there)
         * @param originalClasses the original classes (space seperated) to remove from
         * @param removeClasses the classes (space seperated)  to remove
         * @return the original classes without the spcified classes to remove
         */
        static removeClasses(originalClasses, removeClasses) {
            var classes = originalClasses ? originalClasses.split(" ") : [];
            var removeList = removeClasses ? removeClasses.split(" ") : [];
            var newClasses = [];
            for (var i = 0; i < classes.length; i++) {
                if (removeList.indexOf(classes[i]) === -1) {
                    newClasses.push(classes[i]);
                }
            }
            return newClasses.join(" ");
        }
    }
    exports.CssUtilities = CssUtilities;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/dataListTextBox", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes"], function (require, exports, control_3, KeyCodes_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataListTextBox = void 0;
    class DataListTextBox extends control_3.Control {
        constructor(root) {
            super(root);
            this._idPostfix = DataListTextBox.GlobalIdPostfix++;
            var dataListId = "textBoxDataList" + this._idPostfix;
            this._inputElement = document.createElement("input");
            this._inputElement.type = "text";
            this._inputElement.setAttribute("list", dataListId);
            this._inputElement.addEventListener("input", (ev) => this.onInput(ev));
            this._inputElement.addEventListener("keydown", (ev) => this.onKeydown(ev));
            this._inputElement.addEventListener("change", (ev) => this.onChange(ev));
            this._dataListElement = document.createElement("datalist");
            this._dataListElement.id = dataListId;
            this._optionElements = null;
            this.rootElement.appendChild(this._inputElement);
            this.rootElement.appendChild(this._dataListElement);
        }
        get items() {
            return this._items;
        }
        set items(value) {
            this.clearItems();
            this._optionElements = [];
            for (var i = 0; i < value.length; ++i) {
                var option = document.createElement("option");
                option.text = value[i].text;
                this._optionElements.push(option);
                this._dataListElement.appendChild(option);
            }
        }
        set text(value) { this._inputElement.value = value; }
        get text() { return this._inputElement.value; }
        set textChanged(handler) { this._valueChanged = handler; }
        get textChanged() { return this._valueChanged; }
        set textCommitted(handler) { this._valueCommitted = handler; }
        get textCommitted() { return this._valueCommitted; }
        get focusableElement() { return this._inputElement; }
        clearItems() {
            if (this._optionElements) {
                for (var i = 0; i < this._optionElements.length; ++i) {
                    this._dataListElement.removeChild(this._optionElements[i]);
                }
                this._optionElements = null;
            }
        }
        onInput(ev) {
            if (this.textChanged) {
                this.textChanged(this.text);
            }
        }
        onKeydown(ev) {
            if (ev.keyCode === KeyCodes_2.KeyCodes.Enter) {
                // We want the commit to happen after all UI events have resolved
                // (eg. datalist selection, etc)
                window.setTimeout(() => {
                    if (this.textCommitted) {
                        this.textCommitted(this.text);
                    }
                });
            }
        }
        onChange(ev) {
            if (this.textCommitted) {
                this.textCommitted(this.text);
            }
        }
    }
    exports.DataListTextBox = DataListTextBox;
    DataListTextBox.GlobalIdPostfix = 1;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ElementRecyclerFactory", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert"], function (require, exports, assert_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElementRecyclerFactory = void 0;
    // This class allows fast access to get new HTML elements. When elements are not used they get
    // recycled and removed from the HTML tree. Also, only new elements are added to the container,
    // thus reducing the number of times an element is added to the HTML tree.
    class ElementRecyclerFactory {
        constructor(container, elementCreator) {
            this._container = container;
            this._elementCreator = elementCreator;
            this._index = null;
            this._elements = [];
            this._recycledElements = [];
        }
        // A convenient helper method to create an instance of ElementRecyclerFactory that creates
        // div elements with the given className.
        static forDivWithClass(container, className) {
            return new ElementRecyclerFactory(container, () => {
                var element = document.createElement("div");
                element.className = className;
                return element;
            });
        }
        // Must be called before calling getNext
        start() {
            this._index = 0;
        }
        // Gets a new element. The returned element is already added to the parent container.
        // NOTE: start must be called first. When you are doing, call stop to recycle any unused elements.
        getNext() {
            assert_1.Assert.isTrue(this._index !== null, "Invalid operation. Method 'start' must be called before calling getNext.");
            var element = this._elements[this._index];
            if (!element) {
                if (this._recycledElements.length > 0) {
                    element = this._recycledElements.pop();
                }
                else {
                    element = this._elementCreator();
                }
                this._elements.push(element);
                this._container.appendChild(element);
            }
            this._index++;
            return element;
        }
        // Call this method when you finish getting all the needed elements. This ensures that any
        // unused element gets recycled.
        stop() {
            if (this._index === null) {
                return;
            }
            for (var i = this._elements.length - 1; i >= this._index; --i) {
                var element = this._elements.pop();
                this._recycledElements.push(element);
                this._container.removeChild(element);
            }
            this._index = null;
        }
        recycleAll() {
            for (var i = this._elements.length - 1; i >= 0; --i) {
                var element = this._elements.pop();
                this._recycledElements.push(element);
                this._container.removeChild(element);
            }
        }
        removeAll() {
            for (var i = this._elements.length - 1; i >= 0; --i) {
                var element = this._elements.pop();
                this._container.removeChild(element);
            }
            this._elements = [];
            this._recycledElements = [];
        }
    }
    exports.ElementRecyclerFactory = ElementRecyclerFactory;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/encodingUtilities", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncodingUtilities = void 0;
    /**
     *  Class used to provide help with escaping user input
     */
    class EncodingUtilities {
        /**
         *  Escapes a string for use in a regular expression by prepending all regex special characters with a backslash
         *  A string input such as:
         *  bing.com/page.html?index=10#anchor
         *  Would become:
         *  bing\.com/page\.html\?index\=10#anchor
         *  @param value the string to escape
         *  @returns the escaped string
         */
        static escapeRegExp(value) {
            return String.prototype.replace.call(value, EncodingUtilities.ESCAPE_USER_INPUT_REGEX, "\\$&");
        }
        /**
         *  Escapes a string for use in a regular expression by prepending all regex special characters with a backslash
         *  except * which is prepended with '.'
         *  A string input such as:
         *  bing.com/*.html?index=10#anchor
         *  Would become:
         *  bing\.com/.*\.html\?index\=10#anchor
         *  @param value the string to escape
         *  @returns the escaped string
         */
        static escapeRegExpWithWildCard(value) {
            return String.prototype.replace.call(value, EncodingUtilities.ESCAPE_USER_INPUT_REGEX, function (match) {
                var newValue;
                if (match === "\*") {
                    newValue = ".*";
                }
                else {
                    newValue = "\\" + match;
                }
                return newValue;
            });
        }
        /**
         * Escapes a string so that it is wrapped in double quotes.
         * @param stringToWrap The javascript string that is to be escaped and wrapped in quotes
         * @return The escaped string
         */
        static wrapInQuotes(stringToWrap) {
            return "\"" + String.prototype.replace.call(stringToWrap, /\\"/g, "\"") + "\"";
        }
        /**
         * Restores an html escaped a string back to its default text values.
         * This only unescapes:
         *                    & " ' < >"
         * So any more complex unescape such as &#<value>; to invisible characters would need another function
         * @param htmlString The HTML escaped string that is to be restored
         * @return The restored text string
         */
        static unescapeHtml(htmlString) {
            // Ensure we have a string to escape
            if ((typeof htmlString) !== "string") {
                if (htmlString === null || htmlString === undefined) {
                    return "";
                }
                htmlString = "" + htmlString;
            }
            // Speed up the html escape by using chained regular expressions to decode html characters
            // Uses String.prototype to prevent a possible redefinition of "replace
            return (String.prototype.replace.call(String.prototype.replace.call(String.prototype.replace.call(String.prototype.replace.call(String.prototype.replace.call(htmlString, /&gt;/g, ">"), /&lt;/g, "<"), /&apos;/g, "'"), /&quot;/g, "\""), /&amp;/g, "&"));
        }
        /**
         * Escapes a string so that it can be safely displayed in html.
         * This only escapes:
         *                    & " ' < >"
         * So any more complex escape such as invisible character to &#<value>; would need another function
         * @param htmlString The javascript string that is to be HTML escaped
         * @return The escaped string
         */
        static escapeHtml(htmlString) {
            // Ensure we have a string to escape
            if ((typeof htmlString) !== "string") {
                if (htmlString === null || htmlString === undefined) {
                    return "";
                }
                htmlString = "" + htmlString;
            }
            // Speed up the html escape by using chained regular expressions to decode html characters
            // Uses String.prototype to prevent a possible redefinition of "replace
            return (String.prototype.replace.call(String.prototype.replace.call(String.prototype.replace.call(String.prototype.replace.call(String.prototype.replace.call(htmlString, /&/g, "&amp;"), /"/g, "&quot;"), /'/g, "&apos;"), /</g, "&lt;"), />/g, "&gt;"));
        }
    }
    exports.EncodingUtilities = EncodingUtilities;
    /**
     * RegEx used to escape special regex characters so that user input can be used in a regex match.
     */
    EncodingUtilities.ESCAPE_USER_INPUT_REGEX = /([.+?^=!:${}()|\[\]\/\\])|(\*)/g;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/ITemplateRepository", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/templateControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control"], function (require, exports, control_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateControl = void 0;
    // This TemplateControl initializes the control from a template.
    class TemplateControl extends control_4.Control {
        /**
         * Constructor
         * @param templateName The template name to load
         * @param templateRepository The template repository to use to find the template, if not specified, the template will be loaded from the page
         */
        constructor(templateName, templateRepository) {
            super();
            // Assign the id postfix to use when fixing id's in the template
            this._idPostfix = TemplateControl.GlobalIdPostfix++;
            if (templateName) {
                this.setTemplateFromName(templateName, templateRepository);
            }
        }
        setTemplateFromName(templateName, templateRepository) {
            if (templateRepository) {
                var htmlContent = templateRepository.getTemplateString(templateName);
                this.setTemplateFromHTML(htmlContent);
            }
            else {
                var root = this.getTemplateElementCopy(templateName);
                this.adjustElementIds(root);
                this.rootElement = root;
            }
        }
        setTemplateFromHTML(htmlContent) {
            var root = this.getTemplateElementFromHTML(htmlContent);
            this.adjustElementIds(root);
            this.rootElement = root;
        }
        findElement(id) {
            var fullId = id + this._idPostfix;
            return this.forAllSelfAndDescendants(this.rootElement, function (elem) {
                if (elem.id && elem.id === fullId) {
                    return false;
                }
                return true;
            });
        }
        findElementsByClassName(className) {
            var elements = [];
            this.forAllSelfAndDescendants(this.rootElement, (elem) => {
                if (elem.classList && elem.classList.contains(className)) {
                    elements.push(elem);
                }
                return true;
            });
            return elements;
        }
        getTemplateElementCopy(templateName) {
            var templateElement = document.getElementById(templateName);
            if (!templateElement) {
                throw new Error("Couldn't find the template with name: " + templateName);
            }
            if (templateElement.tagName.toLowerCase() !== "script") {
                throw new Error("Expecting the template container to be a script element.");
            }
            return this.getTemplateElementFromHTML(templateElement.innerHTML);
        }
        getTemplateElementFromHTML(htmlContent) {
            var root = this.getTemplateRootElement();
            root.innerHTML = htmlContent;
            // If the template contains one child, use that as the root instead
            if (root.childElementCount === 1) {
                root = root.firstElementChild;
            }
            return root;
        }
        getTemplateRootElement() {
            var div = document.createElement("div");
            div.style.width = div.style.height = "100%";
            return div;
        }
        adjustElementIds(root) {
            // Postfix all id's with the new id
            var idPostfix = this._idPostfix;
            this.forAllSelfAndDescendants(root, function (elem) {
                if (elem.id) {
                    elem.id = elem.id + idPostfix;
                }
                return true;
            });
        }
        forAllSelfAndDescendants(root, func) {
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
        }
    }
    exports.TemplateControl = TemplateControl;
    TemplateControl.GlobalIdPostfix = 1;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/listBox", ["require", "exports", "plugin-vs-v2", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/templateControl"], function (require, exports, Plugin, control_5, KeyCodes_3, templateControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListBoxItemContainer = exports.ListBox = exports.ListBoxItem = void 0;
    // Data model for a list box item
    class ListBoxItem {
        constructor(value, text, info, itemClass) {
            this.index = -1;
            this.value = value;
            this.text = text;
            this.info = info || "";
            this.itemClass = itemClass || "";
        }
    }
    exports.ListBoxItem = ListBoxItem;
    // ListBox control -- displays selectable, simple text based items in a
    // keyboard-navigable way.  Items themselves should be thought of as strings,
    // not having any complex embedded or additional behavior at all.
    class ListBox extends templateControl_1.TemplateControl {
        constructor(templateName, listItemElementType, listItemElementClass) {
            super(templateName);
            if (!templateName) {
                this.setTemplateFromHTML("<ul class=\"listBox\"></ul>");
            }
            this.rootElement.setAttribute("tabindex", "0");
            this.rootElement.setAttribute("role", "listbox");
            this.rootElement.onkeydown = (e) => this.onKeyDown(e);
            this._listItemElementType = listItemElementType || "li";
            this._listItemElementClass = listItemElementClass || "";
            this._listItemContainers = [];
            this._selectedIndex = -1;
            // Ensure we have an id that can be referenced by aria-owns, etc.
            if (!this.rootElement.id) {
                this.rootElement.id = ListBox.getUniqueID();
            }
        }
        get selectedItemChanged() { return this._onSelectedItemChanged; }
        set selectedItemChanged(value) {
            this._onSelectedItemChanged = value;
        }
        get selectedIndexChanged() { return this._onSelectedIndexChanged; }
        set selectedIndexChanged(value) {
            this._onSelectedIndexChanged = value;
        }
        get itemDoubleClicked() { return this._onItemDoubleClicked; }
        set itemDoubleClicked(value) {
            this._onItemDoubleClicked = value;
        }
        get listItems() { return this._listItems; }
        set listItems(value) {
            this.fireBuildListBoxStartEvent();
            this.selectedIndex = -1;
            this._listItems = [];
            var itemIdx = 0;
            if (value) {
                for (; itemIdx < value.length; ++itemIdx) {
                    var item = value[itemIdx];
                    item.index = itemIdx; // it's useful if an item also knows its index
                    this._listItems.push(item);
                    if (itemIdx < this._listItemContainers.length) {
                        this._listItemContainers[itemIdx].item = item;
                        this._listItemContainers[itemIdx].rootElement.style.display = "list-item";
                        this._listItemContainers[itemIdx].rootElement.removeAttribute("aria-hidden");
                    }
                    else {
                        var itemContainer = this.createListItemContainer(item);
                        this._listItemContainers.push(itemContainer);
                        this.appendChild(itemContainer);
                    }
                }
            }
            this.resetUnusedItems(itemIdx);
            this.fireBuildListBoxEndEvent();
        }
        get listItemHeight() {
            if (typeof this._listItemHeight === "undefined") {
                if (this.listItems.length > 0) {
                    this._listItemHeight = this._listItemContainers[0].rootElement.offsetHeight;
                }
                else {
                    return ListBox.DEFAULT_LIST_ITEM_HEIGHT;
                }
            }
            return this._listItemHeight;
        }
        // useful for unit tests and accessibility logic
        get itemContainers() { return this._listItemContainers; }
        get selectedIndex() { return this._selectedIndex; }
        set selectedIndex(value) {
            if (this._selectedIndex !== value) {
                var oldIdx = this._selectedIndex;
                this._selectedIndex = value;
                if (oldIdx >= 0) {
                    var oldItem = this._listItemContainers[oldIdx];
                    oldItem.selected = false;
                }
                if (value >= 0 && value < this._listItemContainers.length) {
                    var newItem = this._listItemContainers[value];
                    newItem.selected = true;
                    if (value !== oldIdx) {
                        if (this._onSelectedIndexChanged) {
                            this._onSelectedIndexChanged(value);
                        }
                        if (this._onSelectedItemChanged) {
                            this._onSelectedItemChanged(this._listItems[value]);
                        }
                    }
                }
            }
        }
        get selectedItem() {
            var i = this.selectedIndex;
            if (i >= 0) {
                return this._listItems[i];
            }
            return null;
        }
        set selectedItem(value) {
            var oldIdx = this.selectedIndex;
            var newIdx = this._listItems.indexOf(value);
            this.selectedIndex = newIdx;
            // selectedIndex calls our event handler for us
        }
        scrollIntoView(item, alignToTop) {
            var index = this._listItems.indexOf(item);
            if (index >= 0) {
                // Find out if the element is already visible by testing its client rect on the document
                var itemElement = this._listItemContainers[index].rootElement;
                var rect = itemElement.getBoundingClientRect();
                var topLeftCornerElement = document.elementFromPoint(rect.left + 1, rect.top + 1);
                var bottomRightCornerElement = document.elementFromPoint(rect.right - 1, rect.bottom - 1);
                // If both of these corner test elements are not our item element, it is either hidden or partially hidden
                if (topLeftCornerElement !== itemElement || bottomRightCornerElement !== itemElement) {
                    this._listItemContainers[index].rootElement.scrollIntoView(alignToTop);
                }
            }
        }
        // Public for access by derived classes
        createListItemContainer(item) {
            return new ListBoxItemContainer(this, item, this._listItemElementType, this._listItemElementClass);
        }
        /** ETW helper -- override in derived classes */
        fireBuildListBoxStartEvent() {
            // NOOP
        }
        /** ETW helper -- override in derived classes */
        fireBuildListBoxEndEvent() {
            // NOOP
        }
        /** ETW helper -- override in derived classes */
        fireResetListBoxStartEvent() {
            // NOOP
        }
        /** ETW helper -- override in derived classes */
        fireResetListBoxEndEvent() {
            // NOOP
        }
        static getUniqueID() {
            return "Common-Controls-Legacy-ListBox-" + ListBox.CurrentUniqueID++;
        }
        resetUnusedItems(startingIndex) {
            this.fireResetListBoxStartEvent();
            for (var i = startingIndex; i < this._listItemContainers.length; ++i) {
                this._listItemContainers[i].rootElement.style.display = "none";
                this._listItemContainers[i].rootElement.setAttribute("aria-hidden", "true");
                this._listItemContainers[i].item = null;
            }
            this.fireResetListBoxEndEvent();
        }
        onKeyDown(e) {
            var noKeys = !e.shiftKey && !e.ctrlKey && !e.altKey;
            if (e.keyCode === KeyCodes_3.KeyCodes.ArrowUp && noKeys) {
                if (this.selectedIndex > 0) {
                    this.selectedIndex--;
                    this.scrollIntoView(this.selectedItem, true);
                }
            }
            else if (e.keyCode === KeyCodes_3.KeyCodes.ArrowDown && noKeys) {
                if (this.selectedIndex < (this._listItemContainers.length - 1)) {
                    this.selectedIndex++;
                    this.scrollIntoView(this.selectedItem, false);
                }
            }
        }
    }
    exports.ListBox = ListBox;
    ListBox.DEFAULT_LIST_ITEM_HEIGHT = 10;
    ListBox.CurrentUniqueID = 0;
    // View container for a list box item
    class ListBoxItemContainer extends control_5.Control {
        constructor(owner, item, elementType, elementClass) {
            super(document.createElement(elementType));
            this._owner = owner;
            this._item = item;
            this.rootElement.innerText = item.text;
            this.rootElement.value = item.value;
            if (item.itemClass && item.itemClass.length > 0) {
                this.rootElement.classList.add(item.itemClass);
            }
            if (elementClass !== "") {
                this.rootElement.classList.add(elementClass);
            }
            this.rootElement.onmouseover = () => {
                if (this._item && this._item.info) {
                    Plugin.Tooltip.show({ content: this._item.info });
                }
                return true;
            };
            this.rootElement.setAttribute("role", "option");
            this.rootElement.onmousedown = (e) => this.onMouseDown(e);
            this.rootElement.onclick = (e) => this.onMouseDown(e);
            this.rootElement.ondblclick = (e) => this.onDoubleClicked(e);
            // Ensure there is an id that can be referenced by aria-activeDescendant.
            if (!this.rootElement.getAttribute("id")) {
                this.rootElement.setAttribute("id", ListBoxItemContainer.getUniqueID());
            }
        }
        get selectedChanged() { return this._onSelectChanged; }
        set selectedChanged(value) {
            this._onSelectChanged = value;
        }
        get selected() { return this._selected; }
        set selected(value) {
            var selectedChanged = value !== this._selected;
            this._selected = value;
            if (selectedChanged) {
                if (value) {
                    this.rootElement.setAttribute("selected", "selected");
                    this.rootElement.setAttribute("aria-selected", "true");
                    this._owner.selectedItem = this._item;
                }
                else {
                    this.rootElement.removeAttribute("selected");
                    this.rootElement.removeAttribute("aria-selected");
                }
            }
            if (this._onSelectChanged && selectedChanged) {
                this._onSelectChanged(value);
            }
        }
        get item() { return this._item; }
        set item(value) {
            if (value) {
                this._item = value;
                this.rootElement.firstChild.nodeValue = this._item.text;
                this.rootElement.setAttribute("aria-label", this._item.text);
            }
            else {
                this._item = null;
                this.rootElement.firstChild.nodeValue = "";
                this.rootElement.removeAttribute("aria-label");
            }
        }
        static getUniqueID() {
            return "Common-Controls-Legacy-ListBoxItemContainer-" + ListBoxItemContainer.CurrentUniqueID++;
        }
        onMouseDown(e) {
            this.selected = true;
            this._owner.rootElement.focus();
        }
        onDoubleClicked(e) {
            this.selected = true;
            this._owner.rootElement.focus();
            if (this._owner.itemDoubleClicked) {
                this._owner.itemDoubleClicked(this._item);
            }
        }
    }
    exports.ListBoxItemContainer = ListBoxItemContainer;
    ListBoxItemContainer.CurrentUniqueID = 0;
    ListBoxItemContainer.CONTENT_ELEMENT_ID = "content";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/PromiseHelper", ["require", "exports", "diagnosticsHub"], function (require, exports, diagnosticsHub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PromiseHelper = void 0;
    class PromiseHelper {
        static get promiseWrapper() {
            var promiseWrapper = {
                completeHandler: null,
                errorHandler: null,
                promise: null
            };
            var promiseInitialization = (completed, error) => {
                promiseWrapper.completeHandler = completed;
                promiseWrapper.errorHandler = error;
            };
            promiseWrapper.promise = new Promise(promiseInitialization);
            return promiseWrapper;
        }
        static getPromiseSuccess(result) {
            var promiseWrapper = PromiseHelper.promiseWrapper;
            PromiseHelper.safeInvokePromise(promiseWrapper.completeHandler, result);
            return promiseWrapper.promise;
        }
        static getPromiseError(result) {
            var promiseWrapper = PromiseHelper.promiseWrapper;
            PromiseHelper.safeInvokePromise(promiseWrapper.errorHandler, result);
            return promiseWrapper.promise;
        }
        static safeInvokePromise(callback, response) {
            try {
                callback(response);
            }
            catch (e) {
                this.logError(e.toString());
            }
        }
        static get logger() {
            if (!PromiseHelper._logger) {
                PromiseHelper._logger = diagnosticsHub_1.getLogger();
            }
            return PromiseHelper._logger;
        }
        static logError(error) {
            PromiseHelper.logger.error(PromiseHelper.LoggerPrefixText + error);
        }
    }
    exports.PromiseHelper = PromiseHelper;
    PromiseHelper.LoggerPrefixText = "R2LControl: ";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/radioButton", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control"], function (require, exports, control_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RadioButton = void 0;
    class RadioButton extends control_6.Control {
        constructor(element) {
            super(element);
            this._radioButtonElement = this.rootElement;
            // Maintain a list of radio buttons in order to
            // support an un-checked aria state for each of them
            RadioButton.RadioButtons.push(this);
            this.rootElement.addEventListener("click", (e) => this.onCheck(e));
            this.updateAriaProperties();
        }
        get check() { return this._onCheck; }
        set check(value) {
            this._onCheck = value;
        }
        get checked() { return this._radioButtonElement.checked; }
        set checked(value) {
            this._radioButtonElement.checked = value;
            this.updateAriaProperties();
        }
        get disabled() { return this.rootElement.disabled; }
        set disabled(value) { this.rootElement.disabled = value; }
        get groupName() { return this._radioButtonElement.name; }
        get focusableElement() { return this._radioButtonElement; }
        // overridable
        onCheck(ev) {
            if (this.checked) {
                // only fire events, etc, if we are the checked control
                this.rootElement.focus();
                if (this._onCheck) {
                    this._onCheck();
                }
                for (var i = 0; i < RadioButton.RadioButtons.length; ++i) {
                    var otherButton = RadioButton.RadioButtons[i];
                    if (otherButton !== this && otherButton.groupName === this.groupName) {
                        otherButton.updateAriaProperties();
                    }
                }
            }
            this.updateAriaProperties();
        }
        updateAriaProperties() {
            this.rootElement.setAttribute("aria-checked", "" + this.checked);
        }
    }
    exports.RadioButton = RadioButton;
    RadioButton.RadioButtons = [];
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/TabItem", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/contentControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes"], function (require, exports, contentControl_1, control_7, KeyCodes_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabItem = void 0;
    class TabItem extends contentControl_1.ContentControl {
        constructor() {
            super();
            var elem = document.createElement("li");
            elem.setAttribute("role", "tab");
            elem.setAttribute("aria-selected", "false");
            this.header = new control_7.Control(elem);
            this.header.rootElement.onclick = this.onHeaderClicked.bind(this);
            this.header.rootElement.setAttribute("tabindex", "0");
            this.header.rootElement.addEventListener("keydown", this.onKeyDown.bind(this));
            this.rootElement.className = "tabItemContent";
        }
        get ownerTabControl() { return this._ownerTabControl; }
        set ownerTabControl(v) {
            if (this._ownerTabControl !== v) {
                this._ownerTabControl = v;
            }
        }
        get active() { return this._active; }
        set active(v) {
            if (this._active !== v) {
                this._active = v;
                this.header.rootElement.classList.toggle("active");
                this.rootElement.classList.toggle("active");
                this.header.rootElement.setAttribute("aria-selected", this._active ? "true" : "false");
                this.onActiveChanged();
            }
        }
        get title() { return this.header.rootElement.innerText; }
        set title(v) {
            this.header.rootElement.innerText = v;
        }
        get tooltipString() { return this.header.rootElement.getAttribute("data-plugin-vs-tooltip"); }
        set tooltipString(v) {
            var tooltip = { content: v };
            this.header.rootElement.setAttribute("data-plugin-vs-tooltip", JSON.stringify(tooltip));
        }
        /* overridable */
        onActiveChanged() {
        }
        onHeaderClicked() {
            if (this.ownerTabControl) {
                this.ownerTabControl.selectedItem = this;
            }
        }
        onKeyDown(e) {
            if (e.keyCode === KeyCodes_4.KeyCodes.Enter || e.keyCode === KeyCodes_4.KeyCodes.Space) {
                this.onHeaderClicked();
            }
        }
    }
    exports.TabItem = TabItem;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/TabControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/templateControl"], function (require, exports, control_8, templateControl_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabControl = void 0;
    class TabControl extends templateControl_2.TemplateControl {
        constructor() {
            super();
            this._items = [];
            this.setTemplateFromHTML('<div class="tabControl">' +
                '   <div class="tabHeader">' +
                '       <div id="beforeBarContainer" class="beforeBarContainer"></div>' +
                '       <nav id="tabBarContainer" class="tabBarContainer">' +
                '        <ul class="tabBar" role="tablist"></ul>' +
                '       </nav>' +
                '       <div id="afterBarContainer" class="afterBarContainer"></div>' +
                '       <div id="tabHeaderFooter" class="tabHeaderFooter"></div>' +
                '   </div>' +
                '   <div class="tabContentPane"></div>' +
                '</div>');
            this._barPanel = new control_8.Control(this.rootElement.getElementsByClassName("tabBar")[0]);
            this._contentPane = new control_8.Control(this.rootElement.getElementsByClassName("tabContentPane")[0]);
            this.beforeBarContainer = new control_8.Control(this.rootElement.getElementsByClassName("beforeBarContainer")[0]);
            this.afterBarContainer = new control_8.Control(this.rootElement.getElementsByClassName("afterBarContainer")[0]);
            this._tabBarContainer = this.findElement("tabBarContainer");
        }
        get tabsLeftAligned() {
            return this._tabBarContainer.classList.contains("tabBarContainerLeftAlign");
        }
        set tabsLeftAligned(v) {
            if (v) {
                this._tabBarContainer.classList.add("tabBarContainerLeftAlign");
            }
            else {
                this._tabBarContainer.classList.remove("tabBarContainerLeftAlign");
            }
        }
        addTab(tabItem) {
            this._items.push(tabItem);
            tabItem.ownerTabControl = this;
            this._barPanel.appendChild(tabItem.header);
            this._contentPane.appendChild(tabItem);
            if (!this._selectedItem) {
                this.selectedItem = tabItem;
            }
        }
        removeTab(tabItem) {
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
        }
        containsTab(tabItem) {
            return this._items.indexOf(tabItem) >= 0;
        }
        getTab(index) {
            return this._items[index];
        }
        length() {
            return this._items.length;
        }
        get selectedItem() { return this._selectedItem; }
        set selectedItem(tabItem) {
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
        }
        onTabItemSelected(item) {
            this.selectedItem = item;
        }
    }
    exports.TabControl = TabControl;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/toggleButton", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/button", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes"], function (require, exports, assert_2, button_1, KeyCodes_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleButton = void 0;
    // NOTE: ToggleButton is intended to have a lifespan of the process.  If you plan on
    // creating/destroying ToggleButtons, you will need to add a dispose to remove the event listener.
    class ToggleButton extends button_1.Button {
        constructor(element) {
            super(element);
            assert_2.Assert.areEqual(this.rootElement.getAttribute("role"), "button", "Missing button role");
            this.rootElement.addEventListener("DOMAttrModified", (evt) => {
                if (evt.attrName === "aria-pressed") {
                    var isSelected = evt.newValue === "true";
                    this.rootElement.setAttribute("selected", "" + isSelected);
                    if (this._onSelectChanged && evt.newValue !== evt.prevValue) {
                        this._onSelectChanged(isSelected);
                    }
                }
            });
            // Trigger downstream "DOMAttrModified" listeners side-effect by setting selected.
            this.selected = this.selected;
        }
        get selectedChanged() { return this._onSelectChanged; }
        set selectedChanged(value) {
            this._onSelectChanged = value;
        }
        get selected() { return this.rootElement.getAttribute("aria-pressed") === "true"; }
        set selected(value) {
            this.rootElement.setAttribute("aria-pressed", "" + value);
        }
        // overridable
        onClick(ev) {
            super.onClick(ev);
            this.selected = !this.selected;
        }
        // overridable
        onKeydown(ev) {
            if (ev.keyCode === KeyCodes_5.KeyCodes.Space || ev.keyCode === KeyCodes_5.KeyCodes.Enter) {
                super.onKeydown(ev);
                this.selected = !this.selected;
                ev.preventDefault();
            }
        }
    }
    exports.ToggleButton = ToggleButton;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/toolwindow", ["require", "exports", "plugin-vs-v2", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes"], function (require, exports, Plugin, KeyCodes_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToolWindowHelpers = void 0;
    class ToolWindowHelpers {
        /**
         * Initializes common functionality of the tool windows
         * This includes adding event handlers and styling for buttons and togglebuttons, and
         * adding common keyboard navigation functionality
         */
        static initializeToolWindow() {
            // Add the handler that will activate our tool window in VS
            document.addEventListener("mousedown", function () {
                $m(document.body).removeClass("showFocus");
            }, true);
            // Prevent the default context menu
            $m(document).bind("contextmenu", function () {
                return false;
            });
            // Prevent the default F5 refresh and shift F10 WPF context menu (the jquery 'contextmenu' event will fire when desired)
            $m(document).bind("keydown", function (event) {
                if (event.keyCode === KeyCodes_6.KeyCodes.F5 ||
                    (event.keyCode === KeyCodes_6.KeyCodes.F10 && event.shiftKey)) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
                else if (event.keyCode === KeyCodes_6.KeyCodes.Tab) {
                    $m(document.body).addClass("showFocus");
                }
            });
            // Setup the buttons and toggle buttons
            $m(".BPT-ToolbarButton").bind("mousedown", function (event) {
                var element = $m(this);
                if (!element.hasClass("BPT-ToolbarButton-StateDisabled")) {
                    element.addClass("BPT-ToolbarButton-MouseDown");
                }
                else {
                    event.stopImmediatePropagation();
                }
            });
            $m(".BPT-ToolbarButton").bind("mouseup", function () {
                $m(this).removeClass("BPT-ToolbarButton-MouseDown");
            });
            $m(".BPT-ToolbarButton").bind("mouseleave", function () {
                $m(this).removeClass("BPT-ToolbarButton-MouseDown BPT-ToolbarButton-MouseHover");
            });
            $m(".BPT-ToolbarButton").bind("mouseenter", function (event) {
                var element = $m(this);
                if (!element.hasClass("BPT-ToolbarButton-StateDisabled")) {
                    element.addClass("BPT-ToolbarButton-MouseHover");
                }
                else {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            });
            $m(".BPT-ToolbarButton").bind("click keydown", function (event) {
                if (event.type === "click" || event.keyCode === KeyCodes_6.KeyCodes.Enter || event.keyCode === KeyCodes_6.KeyCodes.Space) {
                    var element = $m(this);
                    if (!element.hasClass("BPT-ToolbarButton-StateDisabled")) {
                        var thisElement = element.get(0);
                        if (document.activeElement !== thisElement) {
                            thisElement.focus();
                        }
                    }
                    else {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                }
            });
            $m(".BPT-ToolbarToggleButton").bind("click keydown", function (event) {
                if (event.type === "click" || event.keyCode === KeyCodes_6.KeyCodes.Enter || event.keyCode === KeyCodes_6.KeyCodes.Space) {
                    var element = $m(this);
                    if (!element.hasClass("BPT-ToolbarButton-StateDisabled")) {
                        var thisElement = element.get(0);
                        if (document.activeElement !== thisElement) {
                            thisElement.focus();
                        }
                        if (element.hasClass("BPT-ToolbarToggleButton-StateOn")) {
                            element.removeClass("BPT-ToolbarToggleButton-StateOn");
                            element.attr("aria-pressed", false);
                        }
                        else {
                            element.addClass("BPT-ToolbarToggleButton-StateOn");
                            element.attr("aria-pressed", true);
                        }
                    }
                    else {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                }
            });
            // Setup keyboard navigation
            $m(".BPT-TabCycle-Horizontal, .BPT-TabCycle-Vertical").children(".BPT-TabCycle-Item").bind("keydown", function (event) {
                if (($m(this).parent().hasClass("BPT-TabCycle-Horizontal") && (event.keyCode === KeyCodes_6.KeyCodes.ArrowLeft || event.keyCode === KeyCodes_6.KeyCodes.ArrowRight)) ||
                    ($m(this).parent().hasClass("BPT-TabCycle-Vertical") && (event.keyCode === KeyCodes_6.KeyCodes.ArrowUp || event.keyCode === KeyCodes_6.KeyCodes.ArrowDown))) {
                    var currentElement = $m(this);
                    var newElement = ((event.keyCode === KeyCodes_6.KeyCodes.ArrowLeft || event.keyCode === KeyCodes_6.KeyCodes.ArrowUp) ?
                        currentElement.prev(".BPT-TabCycle-Item").first() :
                        currentElement.next(".BPT-TabCycle-Item").first());
                    // Ensure we are moving to a new element
                    if (newElement.length > 0) {
                        newElement.attr("tabindex", "1");
                        newElement.trigger("focus");
                        newElement.trigger("click");
                        currentElement.removeAttr("tabindex");
                    }
                }
            });
            $m(".BPT-TabCycle-Horizontal, .BPT-TabCycle-Vertical").children(".BPT-TabCycle-Item").bind("mousedown", function (event) {
                var oldElement = $m(this).siblings(".BPT-TabCycle-Item").matchAttr("tabindex", "1");
                var newElement = $m(this);
                // Replace the tab index from the old element, to the new one
                if (newElement.length > 0) {
                    newElement.attr("tabindex", "1");
                    newElement.trigger("focus");
                    oldElement.removeAttr("tabindex");
                }
            });
        }
        /**
         * Stores the component name and error handler function for non-fatal
         * error reporting
         * @param component The identifying name of the component
         * @param errorDisplayHandler The function that should be called to display an error message to the
         *                            user
         */
        static registerErrorComponent(component, errorDisplayHandler) {
            window.errorComponent = component;
            window.errorDisplayHandler = errorDisplayHandler;
        }
        static loadString(resourceId, ...params) {
            // Need to use apply because getString expects the formatter values to be passed as individual args
            // but loadString is expecting them as an array.
            if (params.length === 1 && Array.isArray(params[0])) {
                params = params[0];
            }
            return Plugin.Resources.getString.apply(this, ["/Common/" + resourceId].concat(params));
        }
        /**
         * Scrolls an element into view in a scroll container if it is currently outside of the view.
         * Ignores horizontal position - but presumably the container is wrapping anyway.
         * @param element The DOM element that should be scrolled into the view
         * @param scrollContainer The DOM element that has scrollbars and has the element being scrolled as a decendant
         * @return True if the view was scrolled, False if the element was already in the view and did not need scrolling
         */
        static scrollIntoView(element, scrollContainer) {
            // Ensure we have a valid element to scroll
            if (element && element.getBoundingClientRect) {
                // Choice: if even the closing tag is off the bottom, scroll the tag to the top of the viewport, which will fit as much of the children as possible.
                // There are various alternatives: scroll only if the opening tag is off the bottom (Chrome does this - but tricky to get the height of just the opening tag)
                // Or, we could scroll to the middle, so the user can see context.
                // Using recommendations from https://msdn.microsoft.com/en-us/library/ms530302(v=vs.85)
                var elementRect = element.getBoundingClientRect();
                var containerRect = scrollContainer.getBoundingClientRect();
                var elementTopIsAboveViewport = elementRect.top < containerRect.top;
                var elementBottomIsBelowViewport = elementRect.bottom > containerRect.bottom;
                if (elementTopIsAboveViewport || elementBottomIsBelowViewport) {
                    element.scrollIntoView(/*top=*/ true);
                    return true;
                }
            }
            return false;
        }
        /**
         * Sorts an object's property names alphabetically and returns an array of the sorted names
         * @param objectToSort The javascript object that contains the properties that need to be sorted
         * @return An array of the sorted property names that can be used as a list of sorted keys into the real object
         */
        static getSortedObjectProperties(objectToSort) {
            // Sort the property names for display
            var sortedPropNames = [];
            for (var propName in objectToSort) {
                sortedPropNames.push(propName);
            }
            sortedPropNames.sort(ToolWindowHelpers.naturalSort);
            return sortedPropNames;
        }
        /**
         * Sorts an array of objects on a key property names alphabetically and respecting locale and returns an array of the sorted indicies
         * @param arrayToSort The javascript array that contains the objects that need to be sorted
         * @param key The name of the property to sort the array by
         * @param highPriorityValue Optional parameter to specify a value that should be treated with highest priority in the sort
         * @return An array of the sorted indicies that can be used as a list of sorted keys into the real array
         */
        static getSortedArrayProperties(arrayToSort, key, highPriorityValue) {
            // Sort the property names for display
            var i;
            var sortedProps = [];
            for (i = 0; i < arrayToSort.length; i++) {
                sortedProps.push({ property: arrayToSort[i][key], realIndex: i });
            }
            sortedProps.sort(function (a, b) {
                if (highPriorityValue) {
                    if (a.property === highPriorityValue && b.property === highPriorityValue) {
                        return 0;
                    }
                    else if (a.property === highPriorityValue) {
                        return -1;
                    }
                    else if (b.property === highPriorityValue) {
                        return 1;
                    }
                }
                return ToolWindowHelpers.naturalSort(a.property, b.property);
            });
            var sortedList = [];
            for (i = 0; i < sortedProps.length; i++) {
                sortedList.push(sortedProps[i].realIndex);
            }
            return sortedList;
        }
        /**
         * Sorts two objects as strings alphabetically and returns a number representing the order
         * @param a The first string object to compare
         * @param b The second string object to compare
         * @return A number representing the sort order
         *          a > b = 1
         *          a < b = -1
         *          a == b = 0
         */
        static naturalSort(a, b) {
            // Regular Expression to pick groups of either digits or non digits (eg. 11bc34 - will return [11, bc, 34])
            var regexSortGroup = /(\d+)|(\D+)/g;
            // Convert to case insensitive strings and identify the sort groups
            var aGroups = String(a).toLocaleLowerCase().match(regexSortGroup);
            var bGroups = String(b).toLocaleLowerCase().match(regexSortGroup);
            if (!aGroups && bGroups) {
                return -1;
            }
            else if (aGroups && !bGroups) {
                return 1;
            }
            else if (!aGroups && !bGroups) {
                return 0;
            }
            // Loop through each group
            while (aGroups.length > 0 && bGroups.length > 0) {
                // Take the first group of each string
                var aFront = aGroups.shift();
                var bFront = bGroups.shift();
                // Check for digits
                var aAsDigit = parseInt(aFront, 10);
                var bAsDigit = parseInt(bFront, 10);
                if (isNaN(aAsDigit) && isNaN(bAsDigit)) {
                    // Compare as string characters
                    if (aFront !== bFront) {
                        // Chars not the same, so just return the sort value
                        return aFront.localeCompare(bFront);
                    }
                }
                else if (isNaN(aAsDigit)) {
                    // Letters come after numbers
                    return 1;
                }
                else if (isNaN(bAsDigit)) {
                    // Numbers come before letters
                    return -1;
                }
                else {
                    // Compare as numbers
                    if (aAsDigit !== bAsDigit) {
                        // Numbers not the same, so just return the sort value
                        return (aAsDigit - bAsDigit);
                    }
                }
            }
            // If we get here, we know all the groups checked were identical,
            // So we can return the length difference as the sort value.
            return aGroups.length - bGroups.length;
        }
        /**
         * Returns a short form of the URL for use in displaying file links to the user.  Adapted
         * from F12 toolbar code, this method removes any trailing query string or anchor location
         * and attempts to get the last file or directory following a '/' or '\'.
         * Assumes the url is normalized.
         * @param url The url to shorten.
         * @return A shortened version of the string
         */
        static createShortenedUrlText(url) {
            if (!url) {
                return url;
            }
            var shortenedText = url;
            // Special case: it is legal to use "javascript:" as a protocol,
            // followed by an arbitrarily long javascript stream. We don't want an arbitrarily
            // long URL shown where we want a short one. Use a fixed string; users can typically
            // use the tooltip to see the long URL to disambiguate.
            var javascriptPrefix = "javascript:";
            if (shortenedText.toLowerCase().substr(0, javascriptPrefix.length) === javascriptPrefix) {
                return "javascript:<URI>";
            }
            // Remove a query string if any
            var indexOfHash = shortenedText.indexOf("#");
            var indexOfQuestionMark = shortenedText.indexOf("?");
            var index = -1;
            if (indexOfHash > -1 && indexOfQuestionMark > -1) {
                index = Math.min(indexOfHash, indexOfQuestionMark);
            }
            else if (indexOfHash > -1) {
                index = indexOfHash;
            }
            else if (indexOfQuestionMark > -1) {
                index = indexOfQuestionMark;
            }
            if (index > -1) {
                shortenedText = shortenedText.substring(0, index);
            }
            index = Math.max(shortenedText.lastIndexOf("/"), shortenedText.lastIndexOf("\\"));
            // While the last character is '/' or '\', truncate it and find the next '\' or '/' or the start of the string
            while (index !== -1 && index === (shortenedText.length - 1)) {
                // Remove last '/' or '\'
                shortenedText = shortenedText.substring(0, shortenedText.length - 1);
                index = Math.max(shortenedText.lastIndexOf("/"), shortenedText.lastIndexOf("\\"));
            }
            if (index > -1) {
                shortenedText = shortenedText.substring(index + 1);
            }
            return shortenedText;
        }
        static getTruncatedFileName(filePath, maxLength = 20) {
            if (!filePath) {
                return filePath;
            }
            // We currently do not special case these:
            // "Function code (2)"
            // "about:blank"
            // "eval code (1)"
            // "script block (10)"
            // If a URL, shorten to the filename only
            var fileName = ToolWindowHelpers.createShortenedUrlText(filePath);
            if (fileName.length > maxLength) {
                var index = maxLength / 2 - 2;
                fileName = fileName.substr(0, index) + this.loadString("Ellipsis") + fileName.substr(fileName.length - index);
            }
            return fileName;
        }
        /**
         * Create a file link for display.
         * @param fileUrl Optional file pathname or URL.
         * @param line Optional line number.
         * @param column Optional column number (ignored if line number not supplied as well).
         * @param maxLength Optional maximum length to represent fileUrl.
         * @return String in format depending on arguments:
         *    fileUrl
         *    fileUrl (line)
         *    fileUrl (line, column)
         *    (line)
         *    (line, column)
         *    <empty string>
         */
        static createFileLinkText(fileUrl, line, column, maxLength) {
            var linkText = fileUrl ? this.getTruncatedFileName(fileUrl, maxLength) : "";
            if (line) {
                if (fileUrl) {
                    linkText += " ";
                }
                linkText += "(" + line;
                if (column) {
                    linkText += ", " + column;
                }
                linkText += ")";
            }
            return linkText;
        }
        /**
         * A simple path combination method that adds necessary separators but
         * does not collapse any '..\' instances
         */
        static pathCombine(firstPart, secondPart) {
            var separators = /[\/\\]/; // Match '/' or '\'
            if (!secondPart) {
                return firstPart;
            }
            else if (this.isAbsoluteUrl(secondPart) || !firstPart) {
                return secondPart;
            }
            else if (secondPart.charAt(0) === "/" && this.isAbsoluteUrl(firstPart)) {
                return this.getRoot(firstPart) + secondPart;
            }
            else if (firstPart.charAt(firstPart.length - 1).match(separators) || secondPart.charAt(0).match(separators)) {
                return firstPart + secondPart;
            }
            else {
                var separator = ((firstPart + secondPart).lastIndexOf("\\") >= 0 ? "\\" : "/");
                return firstPart + separator + secondPart;
            }
        }
        static getRoot(url) {
            return url.substring(0, url.indexOf("/", url.indexOf("://") + 3));
        }
        /**
         * Determines if a url is absolute by checking for http://, https://,  file://, etc.
         * A url is also considered to be relative in case of urls like: file://..\js\default.js, http[s]://..\js\default.js etc,
         * but not in case of file://foo/../bar or http[s]://foo/../bar.
         */
        static isAbsoluteUrl(url) {
            // 1. A UNC like "\\server\share" is considered absolute
            // 2. A path like "c:\foo\bar" is considered absolute, even though it should have a "file://" prefix.
            if (this.isUncPath(url) || this.pathStartsWithDriveLetter(url)) {
                return true;
            }
            // A path like "file://.\foo\bar" or "file://..\foo\bar"
            // or "file:///..\foo\bar" is considered NOT absolute
            if (!!url.match(/^file:\/{2,3}\./i)) {
                return false;
            }
            // After that we follow the RFC
            return !!url.match(/^[a-zA-Z][\w\+\-\.]*:/) || this.isDataURI(url); // scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ) from RFC 3986, but exclude scheme://../
        }
        /**
         * Determines whether the given url is a unc path or not
         * It simply checks whether the url is starting with \\. For example, "\\server\share"
         */
        static isUncPath(url) {
            return !!url.match(/^\\\\/);
        }
        /**
         * Determines whether the given url starts with a drive letter. A letter followed by a colon (:)
         */
        static pathStartsWithDriveLetter(url) {
            return !!url.match(/^[A-Za-z]:/);
        }
        static isFileURI(url) {
            return url.length > 5 && url.substr(0, 5).toLocaleLowerCase() === "file:";
        }
        static isDataURI(url) {
            return url.length > 5 && url.substr(0, 5).toLocaleLowerCase() === "data:";
        }
        /**
         * Clip the protocol from the given value.
         * For example,
         * 1. file://../js/default.js => ../js/default.js
         * 2. https://../foo.html => ../foo.html
         * 3. ../bar.ts => ../bar.ts
         */
        static truncateProtocolFromUrl(url) {
            return url.replace(/^[a-zAZ][\w\+\-\.]*:(\/\/)?/g, "");
        }
        static parseBase64DataUriContent(url) {
            // Terminate quickly if the url is not a data URI
            if (!ToolWindowHelpers.isDataURI(url) || url.indexOf("base64,") === -1) {
                return null;
            }
            try {
                return window.atob(url.substr(url.indexOf("base64,") + 7));
            }
            catch (ex) {
                // atob can throw an InvalidCharacterError
                return null;
            }
        }
        static parseDataUriMimeType(url) {
            // Terminate quickly if the url is not a data URI
            if (!ToolWindowHelpers.isDataURI(url) || url.indexOf(";") === -1) {
                return null;
            }
            return url.substring(5, url.indexOf(";"));
        }
        static hasSelectedText() {
            var selectedText = window.getSelection().toString();
            return !!selectedText;
        }
        static getSelectedText() {
            var selectedText = window.getSelection().toString();
            return selectedText;
        }
        /**
         * Gets the highlighted text in the document, compacts multiline text by converting multiple \r\n's to a single one, and then copies the text to the clipboard.
         * @return true if any text was copied; false otherwise.
         */
        static copySelectedTextToClipboard() {
            var selectedText = window.getSelection().toString();
            if (selectedText) {
                // Replace multiple white space lines with a single one
                var compactText = selectedText.replace(/[\r\n]+/g, "\r\n");
                // Copy to the clipboard
                window.clipboardData.setData("Text", compactText);
                return true;
            }
            return false;
        }
        /**
         * Checks the element's background color to see if it is being displayed in the dark theme
         * @param element The JQuery element to check the background for
         * @return True if the background color indicates the dark theme, False if it is light
         */
        static isDarkThemeBackground(element) {
            if (element) {
                var backgroundColor;
                while ((!backgroundColor || backgroundColor === "transparent") && element && element.length > 0) {
                    backgroundColor = element.css("background-color");
                    element = element.parent();
                }
                if (backgroundColor) {
                    var rgbParts = backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                    if (rgbParts && rgbParts.length === 4) {
                        // Brightness determined by W3C formula
                        var brightness = ((parseInt(rgbParts[1], 10) * 299) + (parseInt(rgbParts[2], 10) * 587) + (parseInt(rgbParts[3], 10) * 114)) / 1000;
                        return (brightness < 127);
                    }
                }
            }
            // Default to using light theme
            return false;
        }
        static isContextMenuUp() {
            return ToolWindowHelpers.ContextMenuIsUp;
        }
        static contextMenuUp(flag) {
            ToolWindowHelpers.ContextMenuIsUp = flag;
        }
        static nodeInDocument(node) {
            if (node) {
                while (node = node.parentNode) {
                    if (node === document) {
                        return true;
                    }
                }
            }
            return false;
        }
        // Focus is "good" if it is on something other than the BODY element, which is the fallback location.  BODY is not a useful element to have focus.
        static isFocusGood() {
            var nowFocus = document.querySelector(":focus");
            return nowFocus && nowFocus.tagName !== "BODY";
        }
        static fireCustomEvent(element, eventName) {
            // Create the event and attach custom data
            var customEvent = document.createEvent("CustomEvent");
            customEvent.initEvent(eventName, /* canBubbleArg = */ true, /* cancelableArg = */ true);
            // Fire the event via DOM
            element.dispatchEvent(customEvent);
        }
        /**
         * Returns the file extension from the supplied url
         */
        static getExtension(url) {
            if (!url) {
                return "";
            }
            // Strip off the path and querystring
            url = this.createShortenedUrlText(url);
            var indexOfDot = url.lastIndexOf(".");
            var extension;
            if (indexOfDot < 0) {
                return "";
            }
            else {
                return url.substr(indexOfDot).toLowerCase();
            }
        }
        /**
         * Guesses the best mime type for the file extension of the given url
         */
        static guessMimeTypeFromUrlExtension(url) {
            switch (this.getExtension(url)) {
                case ".html":
                case ".htm":
                    return "text/html";
                case ".xml":
                case ".svg":
                    return "text/xml";
                case ".ts":
                    return "text/typescript";
                case ".js":
                    return "text/javascript";
                case ".css":
                    return "text/css";
                case ".coffee":
                    return "text/coffeescript";
                case ".cs":
                    return "text/x-csharp";
                default:
                    return "text/plain";
            }
        }
    }
    exports.ToolWindowHelpers = ToolWindowHelpers;
    ToolWindowHelpers.ContextMenuIsUp = false;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/IEventHandler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/IEventRegistration", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/EventSource", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert"], function (require, exports, assert_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventSource = void 0;
    /**
     * An event object which can have multiple listeners which are called when the event is invoked
     */
    class EventSource {
        constructor() {
            this._handlers = null;
            this._eventsRunning = 0;
        }
        /**
         * Adds a handler to the event.  The handler can be removed by calling dispose on the returned object, or by calling removeHandler
         * @param handler - The function to be called when the event is invoked
         * @return A disposable object which removes the handler when it's disposed
         */
        addHandler(handler) {
            assert_3.Assert.isTrue(typeof handler === "function", "handler must be function");
            if (!this._handlers) {
                this._handlers = [];
            }
            this._handlers.push(handler);
            return { unregister: () => this.removeHandler(handler) };
        }
        /**
         * Adds a handler which is called on the next invokation of the event, and then the handler is removed
         * @param handler - The handler to be called on the next invokation of the the event
         * @return A disposable object which removes the handler when it's disposed
         */
        addOne(handler) {
            var registration = this.addHandler((args) => {
                registration.unregister();
                handler(args);
            });
            return registration;
        }
        /**
         * Removes a handler from the list of handlers.  This can also be called by disposing the object returned from an
         * add call
         * @param handler - The event handler to remove
         */
        removeHandler(handler) {
            assert_3.Assert.hasValue(this._handlers && this._handlers.length, "Shouldn't call remove before add");
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
            assert_3.Assert.fail("Called remove on a handler which wasn't added");
        }
        /**
         * Invokes the event with the specified args
         * @param args - The event args to pass to each handler
         */
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
        /**
         * Invokes the event with the sepecified args and waits for the
         * returns a promise that completes when all the async handlers complete
         * @param args - The event args to pass to each handler
         */
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
                return Promise.all(promises).then(null);
            }
            return Promise.resolve(null);
        }
        /**
         * Event handlers that get removed while an invoke() is still iterating are set to null instead of
         * being removed from this._handlers. This method executes after all invocations finish.
         */
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
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/IObservable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/EventSource"], function (require, exports, EventSource_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObservableHelpers = exports.Observable = void 0;
    /** An object which fires propertyChanged events when its properties are updated */
    class Observable {
        constructor() {
            this.propertyChanged = new EventSource_1.EventSource();
        }
        /**
         * Generates an ObservableObject from a given plain object.  The returned object
         * matches the shape of the supplied object, but with an additional propertyChanged
         * event source that can be subscribed to.
         */
        static fromObject(obj) {
            // Prevent re-wrapping objects that statisfy IObservable already
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
    /** Helper methods for the ObservableObject class */
    class ObservableHelpers {
        /**
         * Defines an observable property on a class' prototype
         * @param classToExtend The class which should be extended
         * @param propertyName The name of the property to add
         * @param onChanged Callback to handle value changes
         * @param onChanging Callback gets called before changing the value
         * @param defaultValue The initial value of the property
         */
        static defineProperty /*<T>*/(classToExtend, propertyName, defaultValue /*T*/, onChanged, onChanging) {
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
        /**
         * Creates a PropertyDescriptor for a given property on a given object and stores backing data in a supplied dictionary object
         * for the purpose of generating a property that invokes a propertyChanged event when it is updated.
         * @param propertyName The property to generate a descriptor for
         * @param objectShape The plain object which contains the property in question
         * @param backingDataStore The object which will contain the backing data for the property that is generated
         * @param invokableObserver The observer which will receive the propertyChanged event when the property is changed
         */
        static describePropertyForObjectShape(propertyName, objectShape, backingDataStore, invokableObserver) {
            var returnValue = {
                get: () => backingDataStore[propertyName],
                enumerable: true
            };
            var propertyValue = objectShape[propertyName];
            if (typeof propertyValue === "object") {
                // Wrap objects in observers of their own
                backingDataStore[propertyName] = Observable.fromObject(propertyValue);
                returnValue.set = (value) => {
                    if (value !== backingDataStore[propertyName]) {
                        // Additionally, ensure that objects which replace this value are wrapped again
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
        /**
         * Creates a PropertyDescriptorMap of all the enumerated properties on a given object and stores backing data
         * for each property in a supplied dictionary object for the purpose of generating equivalent properties,
         * matching the shape of the supplied object, which fire propertyChanged events when they are updated.
         * @param objectShape The plain object which we want to obtain properties for
         * @param backingDataStore The object which will contain the backing data for the properties that are generated
         * @param invokableObserver The observer which will receive the propertyChanged events when the properties are changed
         */
        static expandProperties(objectShape, backingDataStore, invokableObserver) {
            var properties = {};
            // Traverse prototype chain for all properties
            for (var propertyName in objectShape) {
                properties[propertyName] = ObservableHelpers.describePropertyForObjectShape(propertyName, objectShape, backingDataStore, invokableObserver);
            }
            return properties;
        }
    }
    exports.ObservableHelpers = ObservableHelpers;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/IConverter", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/ITargetAccess", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/Binding", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert"], function (require, exports, assert_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Binding = exports.targetAccessViaAttribute = exports.targetAccessViaProperty = void 0;
    /**
     * Access the target using properties, ex: obj[prop]
     */
    exports.targetAccessViaProperty = {
        getValue: (target, prop) => target[prop],
        isValueSupported: (value, isConverter) => {
            // - undefined is always not allowed
            // - null is allowed only if returned from a converter
            return value !== undefined && (isConverter || value !== null);
        },
        setValue: (target, prop, value) => { target[prop] = value; }
    };
    /**
     * Access the target by calling getAttribute/setAttribute. This is used with HTMLElements in some scenarios.
     */
    exports.targetAccessViaAttribute = {
        getValue: (target, prop) => target.getAttribute(prop),
        isValueSupported: (value, isConverter) => {
            // All values are allowed. Undefined and null have special treatment in setValue.
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
    /**
     * A binding class which keeps the property value in sync between to objects.  It listens to the .changed event or the dom "onchange" event.
     * The binding is released by calling unbind
     */
    class Binding {
        /**
         * @constructor
         * @param source - The object to get the value from
         * @param sourceExpression - A property or property chain of the named property to retrieve from source can contain . but not []
         * @param destination - The object to assign the value to
         * @param destinationProperty - The property on destination which will receive the value.  Cannot contain . or []
         * @param converter - The function to convert from the value on source to the value on destination, default is no conversion
         * @param mode - The binding mode 'oneway' (default) or 'twoway'.  TwoWay binding will copy the value from destination to source when destination changes
         * @param targetAccess - An accessor object which provides us options between accessing the members of the target via attribute or property. Default is
         * targetAccessViaProperty. Other option is targetAccessViaAttribute
         */
        constructor(source, sourceExpression, destination, destinationProperty, converter, mode, targetAccess) {
            // Validation
            assert_4.Assert.hasValue(sourceExpression, "sourceExpression");
            assert_4.Assert.hasValue(destination, "destination");
            assert_4.Assert.hasValue(destinationProperty, "destinationProperty");
            // Default the mode to OneWay
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
            // If there is more than one property in the sourceExpression, we have to create a child binding
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
        /**
         * Determines if the current binding is for the given destination and property
         */
        isForDestination(destination, destinationProperty) {
            return destination === this._destination && destinationProperty === this._destinationProperty;
        }
        /**
         * Unbinds the binding to clean up any object references and prevent any further updates from happening
         */
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
        /**
         * Updates the source value when the destination value changes
         */
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
        /**
         * Updates the destination or childBinding with the value from source
         */
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
                // If the source is not set, we don't want to call the converter
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
        /**
         * Sets the source of the binding.  In the case of a child binding, this updates as the parent binding's value changes
         * @param source - The source object that the binding is listening to
         */
        setSource(source) {
            // Dispose the previous source change handler first
            if (this._sourceChangedRegistration) {
                this._sourceChangedRegistration.unregister();
                this._sourceChangedRegistration = null;
            }
            this._source = source;
            // Listen to change event on the new source
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
        /**
         * Attaches a change handler to obj and returns an object that can be disposed to remove the handler
         * Prefers obj.propertyChanged, but will use the dom onchange event if that doesn't exist
         * @param obj - The object to listen for changes on
         * @param handler - The function to be called when a change occurs
         * @return An object that can be disposed to remove the change handler
         */
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
        /**
         * Gets the current value from the source object
         * @return The current value from the source object
         */
        getValue() {
            return this._source && this._source[this._sourceProperty];
        }
    }
    exports.Binding = Binding;
    /** The string used to signify one way binding */
    Binding.ONE_WAY_MODE = "oneway";
    /** The string used to signify two way binding */
    Binding.TWO_WAY_MODE = "twoway";
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/IControl", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataAttributes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateDataAttributes = void 0;
    /**
     * Defines constants used with the template control and data binding
     */
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
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataBinding", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/Binding", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataAttributes"], function (require, exports, assert_5, Binding_1, TemplateDataAttributes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateDataBinding = void 0;
    /**
     * Holds all the binding relationships for the control.
     */
    class TemplateDataBinding {
        /**
         * @param control The template control to create the binding relationships for
         */
        constructor(control) {
            this._bindings = TemplateDataBinding.bind(control);
        }
        /**
         * Find the binding that represents the given destination and destination property
         * @param destination The destination object
         * @param destinationProperty The name of the destination property
         * @returns The binding object which represents the given destination
         */
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
        /**
         * Unbind all the binding relationships
         */
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
                // 1- if the target name begins with 'style.', change the target to be the style object and remove the 'style.' prefix.
                // 2- if the target name begins with 'attr-', use the attribute access method on the target and remove the 'attr-' prefix.
                // 3- if the target name begins with 'control.', change the target to be the control object and remove the 'control.' prefix.
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
        /**
         * The syntax for the binding statement:
         *   binding statement =    binding[, <binding statement>]
         *   binding           =    targetName:sourceName[; mode=(oneway|twoway); converter=<converter id>]
         */
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
                // For data binding, assume it's a control binding and add the model accessor at the front
                if (!isControlBinding) {
                    bindingSource.name = TemplateDataBinding.MODEL_PREFIX + bindingSource.name;
                }
                var bindingCommand = TemplateDataBinding.buildBindingCommand(target, element, targetName, bindingSource, /*value=*/ null);
                assert_5.Assert.isTrue(!!bindingCommand.targetName, "Invalid binding syntax. Target name is missing '" + binding + "'.");
                commands.push(bindingCommand);
            }
        }
        /**
         * The syntax for the option statement:
         *   option statement =    option[, <option statement>]
         *   option           =    targetName:value[; converter=<converter id>]
         */
        static extractBindingCommandsForOptions(commands, target, element, allOptions) {
            var options = allOptions.split(",");
            var optionsCount = options.length;
            for (var i = 0; i < optionsCount; i++) {
                var option = options[i];
                var keyValue = option.split(":", 2);
                assert_5.Assert.areEqual(keyValue.length, 2, "Invalid options syntax, the keyvalue pair should have the syntax target:source '" + option + "'.");
                var targetName = keyValue[0].trim();
                var valueSyntax = keyValue[1].trim();
                // Get the converter and convert the value if it is present
                var valueSource = TemplateDataBinding.parseSourceSyntax(valueSyntax);
                var value = valueSource.name;
                if (valueSource.converter && valueSource.converter.convertTo) {
                    value = valueSource.converter.convertTo(value);
                }
                var bindingCommand = TemplateDataBinding.buildBindingCommand(target, element, targetName, /*bindingSource=*/ null, value);
                assert_5.Assert.isTrue(!!bindingCommand.targetName, "Invalid option syntax. Target name is missing '" + option + "'.");
                commands.push(bindingCommand);
            }
        }
        /**
         * Gets all the binding commands which will be used to create the
         * binding relationships
         * @param control The control to work on
         * @return An array of all the binding commands extracted from the control
         */
        static getBindingCommands(control) {
            var bindingCommands;
            var elements = [];
            elements.push(control.rootElement);
            while (elements.length > 0) {
                var element = elements.pop();
                var childControl = element.control;
                // The target for the binding is always the element except for a child control in this case the target becomes the child control.
                var target = element;
                if (childControl && childControl !== control) {
                    target = childControl;
                }
                if (target) {
                    var attr;
                    attr = element.getAttributeNode(TemplateDataAttributes_1.TemplateDataAttributes.BINDING);
                    if (attr) {
                        bindingCommands = bindingCommands || [];
                        TemplateDataBinding.extractBindingCommandsForBinding(bindingCommands, target, element, attr.value, false /* isControlBinding */);
                        element.removeAttributeNode(attr);
                    }
                    attr = element.getAttributeNode(TemplateDataAttributes_1.TemplateDataAttributes.CONTROL_BINDING);
                    if (attr) {
                        bindingCommands = bindingCommands || [];
                        TemplateDataBinding.extractBindingCommandsForBinding(bindingCommands, target, element, attr.value, true /* isControlBinding */);
                        element.removeAttributeNode(attr);
                    }
                    attr = element.getAttributeNode(TemplateDataAttributes_1.TemplateDataAttributes.OPTIONS);
                    if (attr) {
                        bindingCommands = bindingCommands || [];
                        // The target for options is always the control except if it's an element
                        var optionsTarget = childControl || element;
                        TemplateDataBinding.extractBindingCommandsForOptions(bindingCommands, optionsTarget, element, attr.value);
                        element.removeAttributeNode(attr);
                    }
                }
                // Don't traverse through control children elements
                if (element.children && (!element.hasAttribute(TemplateDataAttributes_1.TemplateDataAttributes.CONTROL) || element === control.rootElement)) {
                    var childrenCount = element.children.length;
                    for (var i = 0; i < childrenCount; i++) {
                        elements.push(element.children[i]);
                    }
                }
            }
            return bindingCommands;
        }
        /**
         * Gets all the binding relationships from the given control
         * @param control The control to work on
         * @return An array of all the binding relationships extracted from the control
         */
        static bind(control) {
            var bindings;
            var bindingCommands = TemplateDataBinding.getBindingCommands(control);
            if (bindingCommands) {
                bindings = [];
                var bindingCommandsCount = bindingCommands.length;
                for (var i = 0; i < bindingCommandsCount; i++) {
                    var bindingCommand = bindingCommands[i];
                    if (bindingCommand.source) {
                        // Create a binding to the control target
                        var binding = new Binding_1.Binding(control, // source
                        bindingCommand.source.name, bindingCommand.target, bindingCommand.targetName, bindingCommand.source.converter, bindingCommand.source.mode, bindingCommand.targetAccess);
                        bindings.push(binding);
                    }
                    else if (bindingCommand.value !== undefined) {
                        // Assign the value
                        bindingCommand.targetAccess.setValue(bindingCommand.target, bindingCommand.targetName, bindingCommand.value);
                    }
                }
            }
            return bindings && bindings.length > 0 ? bindings : null;
        }
        /**
         * Get the converter instance for the given identifier
         * @param identifier The full id for the converter
         * @return The converter instance
         */
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
        /**
         * Parse the source syntax extracting the source id, mode and converter
         * @param syntax The binding syntax
         * @return The binding source object
         */
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
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/ScriptTemplateRepository", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert"], function (require, exports, assert_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.templateRepository = exports.ScriptTemplateRepository = void 0;
    /**
     * Implements a template repository used to access the templates
     * hosted in script.
     */
    class ScriptTemplateRepository {
        /**
         * Constructor
         * @param container The root object of where all script repository belongs
         */
        constructor(container) {
            assert_6.Assert.hasValue(container, "Invalid template container.");
            this._container = container;
            this._registeredTemplates = {};
        }
        /**
         * Gets the template string using the template Id.
         * @param templateId The template ID
         * @return The template string
         */
        getTemplateString(templateId) {
            assert_6.Assert.isTrue(!!templateId, "Invalid template ID.");
            var template;
            // First lookup in the registry, otherwise use the container
            template = this._registeredTemplates[templateId];
            if (!template) {
                var container = this._container;
                var templateParts = templateId.split(".");
                for (var i = 0; i < templateParts.length; i++) {
                    var part = templateParts[i];
                    container = container[part];
                    assert_6.Assert.isTrue(!!container, "Couldn't find the template with the given ID '" + templateId + "'.");
                }
                template = container;
            }
            assert_6.Assert.areEqual(typeof template, "string", "The given template name doesn't point to a template.");
            return template;
        }
        /**
         * Register the given html with the repository
         * @param templateId The template ID. Must be unique.
         * @param html The html content of the template
         */
        registerTemplateString(templateId, html) {
            assert_6.Assert.isTrue(!!templateId, "Invalid template ID.");
            assert_6.Assert.isUndefined(this._registeredTemplates[templateId], "Template with id '" + templateId + "' already registered.");
            this._registeredTemplates[templateId] = html;
        }
    }
    exports.ScriptTemplateRepository = ScriptTemplateRepository;
    /**
     * The global templateRepository member is an instance of ScriptTemplateRepository
     */
    exports.templateRepository = new ScriptTemplateRepository(ControlTemplates);
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateLoader", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/ScriptTemplateRepository", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataAttributes"], function (require, exports, assert_7, ScriptTemplateRepository_1, TemplateControl_1, TemplateDataAttributes_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.templateLoader = exports.TemplateLoader = void 0;
    /**
     * Defines the template loader used to load templates, resolve template placeholders and then generate
     * HTML root element from the template.
     */
    class TemplateLoader {
        /**
         * Constructor
         * @param repository The repository used to find template strings
         */
        constructor(repository) {
            assert_7.Assert.hasValue(repository, "Invalid template repository.");
            this._parsingNode = document.createElement("div");
            this._repository = repository;
            this._templateCache = {};
            this._visitedControls = {};
            this._visitedTemplates = {};
        }
        /**
         * Gets the repository used to host html contents with this loader
         */
        get repository() {
            return this._repository;
        }
        /**
         * Gets the control type from the given control full name
         * @param controlName The fully qualified name of the control
         * @return The control type
         */
        static getControlType(controlName) {
            assert_7.Assert.isTrue(!!controlName, "Invalid control name.");
            var controlType = window;
            var nameParts = controlName.split(".");
            for (var i = 0; i < nameParts.length; i++) {
                var part = nameParts[i];
                controlType = controlType[part];
                assert_7.Assert.hasValue(controlType, "Couldn't find the control with the given name '" + controlName + "'.");
            }
            assert_7.Assert.areEqual(typeof controlType, "function", "The given control '" + controlName + "' doesn't represent a control type which implements IControl.");
            return controlType;
        }
        /**
         * Loads the template providing its templateId. Caches the loaded templates by their templateId.
         * @param templateId The template ID to get the HTML for
         * @return The HTML element root for the template
         */
        loadTemplate(templateId) {
            var cachedElement = this._templateCache[templateId];
            if (!cachedElement) {
                var template = this._repository.getTemplateString(templateId);
                assert_7.Assert.isFalse(this._visitedTemplates[templateId], "Detected a recursive template. TemplateId '" + templateId + "' is part of the parents hierarchy.");
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
        /**
         * Loads the template providing the HTML string for the template.
         * @param templateHtml An HTML string for the template
         * @return The HTML element root for the template
         */
        loadTemplateUsingHtml(templateHtml) {
            this._parsingNode.innerHTML = templateHtml;
            assert_7.Assert.areEqual(this._parsingNode.childElementCount, 1, "Template should have only one root element.");
            var rootElement = this._parsingNode.children[0];
            // No use for the parsing node anymore. So, disconnect the rootElement from it.
            this._parsingNode.removeChild(rootElement);
            return rootElement;
        }
        getControlInstance(controlName, templateId) {
            assert_7.Assert.isTrue(!!controlName, "Invalid control name.");
            var controlType = TemplateLoader.getControlType(controlName);
            var control;
            // For template controls, pass the templateId to the constructor
            if (TemplateControl_1.TemplateControl.prototype.isPrototypeOf(controlType.prototype) ||
                TemplateControl_1.TemplateControl.prototype === controlType.prototype) {
                control = new controlType(templateId);
            }
            else {
                control = new controlType();
            }
            assert_7.Assert.hasValue(control.rootElement, "The given control '" + controlName + "' doesn't represent a control type which implements IControl.");
            // Attach the control to the root element if it's not yet attached
            if (control.rootElement.control !== control) {
                control.rootElement.control = control;
            }
            return control;
        }
        resolvePlaceholders(root) {
            // Test the node itself, otherwise test its children
            if (root.hasAttribute(TemplateDataAttributes_2.TemplateDataAttributes.CONTROL)) {
                root = this.resolvePlaceholder(root);
            }
            else {
                // Resolve all children
                var placeholders = root.querySelectorAll("div[" + TemplateDataAttributes_2.TemplateDataAttributes.CONTROL + "]");
                var placeholdersCount = placeholders.length;
                for (var i = 0; i < placeholdersCount; i++) {
                    var node = placeholders[i];
                    this.resolvePlaceholder(node);
                }
            }
            return root;
        }
        resolvePlaceholder(node) {
            assert_7.Assert.isFalse(node.hasChildNodes(), "Control placeholders cannot have children.");
            var controlName = node.getAttribute(TemplateDataAttributes_2.TemplateDataAttributes.CONTROL);
            var templateId = node.getAttribute(TemplateDataAttributes_2.TemplateDataAttributes.CONTROL_TEMPLATE_ID);
            var controlVisistedKey = controlName + (templateId ? "," + templateId : "");
            assert_7.Assert.isFalse(this._visitedControls[controlVisistedKey], "Detected a recursive control. Control '" + controlVisistedKey + "' is part of the parents hierarchy.");
            this._visitedControls[controlVisistedKey] = true;
            try {
                var controlInstance = this.getControlInstance(controlName, templateId);
            }
            finally {
                this._visitedControls[controlVisistedKey] = false;
            }
            var controlNode = controlInstance.rootElement;
            // Copy all properties from original node to the new node
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
    /**
     * The global templateLoader member
     */
    exports.templateLoader = new TemplateLoader(ScriptTemplateRepository_1.templateRepository);
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataAttributes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataBinding", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateLoader"], function (require, exports, Observable_1, TemplateDataAttributes_3, TemplateDataBinding_1, TemplateLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateControl = void 0;
    /**
     * A template control used to create controls from templates and uses data binding
     */
    class TemplateControl extends Observable_1.Observable {
        /**
         * Constructor
         * @param templateId The templateId to use with this control. If not provided the template root will be a <div> element.
         */
        constructor(templateId) {
            super();
            // Call onInitialize before we set the rootElement
            this.onInitializeOverride();
            this._templateId = templateId;
            this.setRootElementFromTemplate();
        }
        /**
         * Gets the data model assigned to the control
         */
        get model() {
            return this._model;
        }
        /**
         * Sets the data model on the control
         */
        set model(value) {
            if (this._model !== value) {
                this._model = value;
                this.propertyChanged.invoke(TemplateControl.ModelPropertyName);
                this.onModelChanged();
            }
        }
        /**
         * Gets the tabIndex value for the control.
         */
        get tabIndex() {
            if (this._tabIndex) {
                return this._tabIndex;
            }
            return 0;
        }
        /**
         * Sets the tabIndex value for the control.
         */
        set tabIndex(value) {
            if (this._tabIndex !== value) {
                var oldValue = this._tabIndex;
                this._tabIndex = value >> 0; // Making sure the passed value is a number
                this.propertyChanged.invoke(TemplateControl.TabIndexPropertyName);
                this.onTabIndexChanged(oldValue, this._tabIndex);
            }
        }
        /**
         * Gets the templateId used on the control
         */
        get templateId() {
            return this._templateId;
        }
        /**
         * Sets a new templateId on the control
         */
        set templateId(value) {
            if (this._templateId !== value) {
                this._templateId = value;
                this._binding.unbind();
                this.setRootElementFromTemplate();
                this.propertyChanged.invoke(TemplateControl.TemplateIdPropertyName);
            }
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_1.ObservableHelpers.defineProperty(TemplateControl, TemplateControl.ClassNamePropertyName, /*defaultValue=*/ null, (obj, oldValue, newValue) => obj.onClassNameChanged(oldValue, newValue));
            Observable_1.ObservableHelpers.defineProperty(TemplateControl, TemplateControl.IsEnabledPropertyName, /*defaultValue=*/ true, (obj) => obj.onIsEnabledChanged());
            Observable_1.ObservableHelpers.defineProperty(TemplateControl, TemplateControl.IsVisiblePropertyName, /*defaultValue=*/ true, (obj) => obj.onIsVisibleChanged());
            Observable_1.ObservableHelpers.defineProperty(TemplateControl, TemplateControl.TooltipPropertyName, /*defaultValue=*/ null, (obj) => obj.onTooltipChanged());
        }
        /**
         * Gets the binding that represents the given destination and destination property
         * @param destination The destination object
         * @param destinationProperty The name of the destination property
         * @returns the binding object that is associated with the given destination
         */
        getBinding(destination, destinationProperty) {
            var binding;
            if (this._binding) {
                binding = this._binding.findBinding(destination, destinationProperty);
            }
            return binding;
        }
        /**
         * Protected virtual function used to notify subclasses that the template has changed
         */
        onApplyTemplate() {
            this.onClassNameChanged(null, this.className);
            this.onIsVisibleChanged();
            this.onTabIndexChanged(null, this._tabIndex);
            this.onTooltipChanged();
        }
        /**
         * Protected virtual function called when initializing the control instance
         */
        onInitializeOverride() {
        }
        /**
         * Protected virtual function used to notify subclasses that the model has changed
         */
        onModelChanged() {
        }
        /**
         * Protected virtual function used to notify subclasses that the template is about to change.
         * Can used to perform cleanup on the previous root element
         */
        onTemplateChanging() {
        }
        /**
         * Helper method to get a named control direct child from the subtree of the control, ignoring nested controls
         */
        getNamedControl(name) {
            var element = this.getNamedElement(name);
            if (!element) {
                return null;
            }
            return element.control;
        }
        /**
         * Helper method to get a named element from the subtree of the control, ignoring nested controls
         */
        getNamedElement(name) {
            var elements = [];
            elements.push(this.rootElement);
            while (elements.length > 0) {
                var element = elements.pop();
                if (element.getAttribute(TemplateDataAttributes_3.TemplateDataAttributes.NAME) === name) {
                    return element;
                }
                // Don't traverse through control children elements
                if (element.children && (!element.hasAttribute(TemplateDataAttributes_3.TemplateDataAttributes.CONTROL) || element === this.rootElement)) {
                    var childrenCount = element.children.length;
                    for (var i = 0; i < childrenCount; i++) {
                        elements.push(element.children[i]);
                    }
                }
            }
            return null;
        }
        /**
         * Protected overridable method. Gets called when isEnabled value changes
         */
        onIsEnabledChangedOverride() {
        }
        /**
         * Protected overridable method. Gets called when isVisible value changes
         */
        onIsVisibleChangedOverride() {
        }
        /**
         * Protected override method. Gets called when the tabIndex value changes
         */
        onTabIndexChangedOverride() {
        }
        /**
         * Protected overridable method. Gets called when tooltip value changes
         */
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
        /**
         * Handles a change to the isEnabled property
         */
        onIsEnabledChanged() {
            if (this.rootElement) {
                if (this.isEnabled) {
                    this.rootElement.classList.remove(TemplateControl.CLASS_DISABLED);
                    this.rootElement.removeAttribute("aria-disabled");
                    this.onTabIndexChanged(this._tabIndex, this._tabIndex);
                }
                else {
                    this.rootElement.classList.add(TemplateControl.CLASS_DISABLED);
                    this.rootElement.setAttribute("aria-disabled", true);
                    this.rootElement.tabIndex = -1;
                }
                this.onIsEnabledChangedOverride();
            }
        }
        /**
         * Handles a change to the isVisible property
         */
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
        /**
         * Handles a change to the tabIndex property
         */
        onTabIndexChanged(oldValue, newValue) {
            if (this.rootElement) {
                // Only set tabIndex on the root when the control is enabled and visible. Otherwise the isEnabled
                // and isVisible change handlers will call this method to update the tabIndex on the element.
                if (this.isEnabled && this.isVisible) {
                    // Only set it on the rootElement if either we had a value or we got assigned a new value
                    // This way we don't set a 0 tabIndex on all elements at initialization
                    if (oldValue || newValue || newValue === 0) {
                        this.rootElement.tabIndex = newValue;
                    }
                }
                // Do the check here because the isEnabled handler will call us without really changing the tabIndex value
                if (oldValue !== newValue) {
                    this.onTabIndexChangedOverride();
                }
            }
        }
        /**
         * Handles a change to the tooltip property
         */
        onTooltipChanged() {
            if (this.rootElement) {
                this.onTooltipChangedOverride();
            }
        }
        /**
         * Sets the rootElement from the current templateId and initialize
         * bindings relationships
         */
        setRootElementFromTemplate() {
            var previousRoot;
            // Notify subclasses that the template is about to change
            this.onTemplateChanging();
            // Unattach ourselves from the previous rootElement before we
            // create a new rootElement
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
            // Copy only the original name to the new root
            if (previousRoot) {
                var attr = previousRoot.attributes.getNamedItem(TemplateDataAttributes_3.TemplateDataAttributes.NAME);
                if (attr) {
                    this.rootElement.setAttribute(attr.name, attr.value);
                }
            }
            this.rootElement.control = this;
            this._binding = new TemplateDataBinding_1.TemplateDataBinding(this);
            // If the previous root has a parentElement then replace it with the new root
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
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ContentControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl"], function (require, exports, Observable_2, TemplateControl_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentControl = void 0;
    /**
     * A base class for controls which have content
     */
    class ContentControl extends TemplateControl_2.TemplateControl {
        /**
         * Constructor
         * @param templateId The id of the template to apply to the control
         */
        constructor(templateId) {
            super(templateId);
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_2.ObservableHelpers.defineProperty(ContentControl, "content", null);
        }
    }
    exports.ContentControl = ContentControl;
    ContentControl.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/CommonConverters", ["require", "exports", "plugin-vs-v2"], function (require, exports, Plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommonConverters = void 0;
    /**
     * Common converters used by the templating engine.
     */
    class CommonConverters {
        /**
         * Static constructor for the class
         */
        static initialize() {
            CommonConverters.AriaConverterElement = document.createElement("span");
            CommonConverters.HtmlTooltipFromResourceConverter = CommonConverters.getHtmlTooltipFromResourceConverter();
            CommonConverters.IntToStringConverter = CommonConverters.getIntToStringConverter();
            CommonConverters.InvertBool = CommonConverters.invertBoolConverter();
            CommonConverters.JsonHtmlTooltipToInnerTextConverter = CommonConverters.getJsonHtmlTooltipToInnerTextConverter();
            CommonConverters.ResourceConverter = CommonConverters.getResourceConverter();
            CommonConverters.StringToBooleanConverter = CommonConverters.getStringToBooleanConverter();
            CommonConverters.StringToIntConverter = CommonConverters.getStringToIntConverter();
            CommonConverters.ThemedImageConverter = CommonConverters.getThemedImageConverter();
        }
        static getResourceConverter() {
            return {
                convertTo: (from) => {
                    return Plugin.Resources.getString(from);
                },
                convertFrom: null
            };
        }
        static getThemedImageConverter() {
            return {
                convertTo: (from) => {
                    return Plugin.Theme.getValue(from);
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
        /**
         * Converts a resource name into a value for a daytona tooltip that contains HTML to be rendered
         */
        static getHtmlTooltipFromResourceConverter() {
            return {
                convertTo: (from) => {
                    return JSON.stringify({ content: Plugin.Resources.getString(from), contentContainsHTML: true });
                },
                convertFrom: null
            };
        }
        /**
         * Converts a JSON tooltip string with HTML into a text-only string of the tooltip content
         */
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
    }
    exports.CommonConverters = CommonConverters;
    CommonConverters.JSONRegex = /^\{.*\}$/; // Matches strings that start with '{' and end with '}', which could be JSON
    CommonConverters.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/Button", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ContentControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/EventSource", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/CommonConverters", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes"], function (require, exports, ContentControl_1, EventSource_2, Observable_3, CommonConverters_1, assert_8, KeyCodes_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Button = void 0;
    /**
     * A Button class which is templatable and provides basic button functionality
     */
    class Button extends ContentControl_1.ContentControl {
        /**
         * Constructor
         * @param templateId The id of the template to apply to the control
         */
        constructor(templateId) {
            super(templateId || "Common.defaultButtonTemplate");
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_3.ObservableHelpers.defineProperty(Button, Button.IsPressedPropertyName, false, (obj, oldValue, newValue) => obj.onIsPressedChanged(oldValue, newValue));
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._mouseHandler = (e) => this.onMouseEvent(e);
            this._keyHandler = (e) => this.onKeyboardEvent(e);
            this.click = new EventSource_2.EventSource();
        }
        /**
         * Updates the control when the template has changed
         */
        onApplyTemplate() {
            super.onApplyTemplate();
            if (this.rootElement) {
                if (!this.rootElement.hasAttribute("role")) {
                    // Consumers of this control are free to override this
                    // ie. A "link" is technically a button, but would override
                    // this attribute for accessibility reasons.
                    this.rootElement.setAttribute("role", "button");
                }
                this.rootElement.addEventListener("click", this._mouseHandler);
                this.rootElement.addEventListener("mousedown", this._mouseHandler);
                this.rootElement.addEventListener("mouseup", this._mouseHandler);
                this.rootElement.addEventListener("mouseleave", this._mouseHandler);
                this.rootElement.addEventListener("keydown", this._keyHandler);
                this.rootElement.addEventListener("keyup", this._keyHandler);
                // Ensure the control is in the correct state
                this.onIsPressedChanged(null, this.isPressed);
            }
        }
        /**
         * Updates the control when the template is about to change. Removes event handlers from previous root element.
         */
        onTemplateChanging() {
            super.onTemplateChanging();
            if (this.rootElement) {
                this.rootElement.removeEventListener("click", this._mouseHandler);
                this.rootElement.removeEventListener("mousedown", this._mouseHandler);
                this.rootElement.removeEventListener("mouseup", this._mouseHandler);
                this.rootElement.removeEventListener("mouseleave", this._mouseHandler);
                this.rootElement.removeEventListener("keydown", this._keyHandler);
                this.rootElement.removeEventListener("keyup", this._keyHandler);
            }
        }
        /**
         * Protected override. Handles a change to the tooltip property
         */
        onTooltipChangedOverride() {
            super.onTooltipChangedOverride();
            if (this.tooltip) {
                this.rootElement.setAttribute("data-plugin-vs-tooltip", this.tooltip);
                this.rootElement.setAttribute("aria-label", CommonConverters_1.CommonConverters.JsonHtmlTooltipToInnerTextConverter.convertTo(this.tooltip));
            }
            else {
                this.rootElement.removeAttribute("data-plugin-vs-tooltip");
                this.rootElement.removeAttribute("aria-label");
            }
        }
        /**
         * Dispatches a click event only if the button is enabled
         * @param e An optional event object.
         */
        press(e) {
            if (this.isEnabled) {
                this.click.invoke(e);
            }
        }
        /**
         * Handles a change to the isPressed property
         * @param oldValue The old value for the property
         * @param newValue The new value for the property
         */
        onIsPressedChanged(oldValue, newValue) {
            if (this.rootElement) {
                if (newValue) {
                    this.rootElement.classList.add(Button.CLASS_PRESSED);
                }
                else {
                    this.rootElement.classList.remove(Button.CLASS_PRESSED);
                }
            }
        }
        /**
         * Handles mouse events to allow the button to be interacted with via the mouse
         * @param e The mouse event
         */
        onMouseEvent(e) {
            if (this.isEnabled) {
                var stopPropagation = false;
                switch (e.type) {
                    case "click":
                        this.rootElement.focus();
                        this.click.invoke(e);
                        stopPropagation = true;
                        break;
                    case "mousedown":
                        this.isPressed = true;
                        break;
                    case "mouseup":
                    case "mouseleave":
                        this.isPressed = false;
                        break;
                    default:
                        assert_8.Assert.fail("Unexpected");
                }
                if (stopPropagation) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            }
        }
        /**
         * Handles keyboard events to allow the button to be interacted with via the keyboard
         * @param e The keyboard event
         */
        onKeyboardEvent(e) {
            if (this.isEnabled && (e.keyCode === KeyCodes_7.KeyCodes.Enter || e.keyCode === KeyCodes_7.KeyCodes.Space)) {
                switch (e.type) {
                    case "keydown":
                        this.isPressed = true;
                        break;
                    case "keyup":
                        // Narrator bypasses normal keydown/up events and clicks
                        // directly.  Make sure we only perform a click here when
                        // the button has really been pressed.  (ie. via regular
                        // keyboard interaction)
                        if (this.isPressed) {
                            this.isPressed = false;
                            this.click.invoke(e);
                        }
                        break;
                    default:
                        assert_8.Assert.fail("Unexpected");
                }
            }
        }
    }
    exports.Button = Button;
    /** CSS class to apply to the button's root element when it's pressed */
    Button.CLASS_PRESSED = "pressed";
    Button.IsPressedPropertyName = "isPressed";
    Button.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/MenuItem", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ContentControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/EventSource", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes"], function (require, exports, Observable_4, ContentControl_2, EventSource_3, assert_9, KeyCodes_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuItem = void 0;
    /**
     * A MenuItem class which is templatable and is a single menu item in the menu control
     */
    class MenuItem extends ContentControl_2.ContentControl {
        /**
         * @constructor
         * As part of initialization, caches references to event handler instances and loads the template content.
         * @param templateId: Optional template id for the control. Default is Common.menuItemTemplate. Other option can
         * be Common.menuItemCheckMarkTemplate
         */
        constructor(templateId) {
            super(templateId || "Common.menuItemTemplate");
        }
        /**
         * Initializes the observable properties which should be performed once per each class.
         */
        static initialize() {
            Observable_4.ObservableHelpers.defineProperty(MenuItem, MenuItem.GroupNamePropertyName, /*defaultValue=*/ null);
            Observable_4.ObservableHelpers.defineProperty(MenuItem, MenuItem.IsChecked, /*defaultValue=*/ false, (obj, oldValue, newValue) => obj.onIsCheckedChanged(oldValue, newValue));
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._mouseHandler = (e) => this.onMouseEvent(e);
            this._keyUpHandler = (e) => this.onKeyUp(e);
            this._domEventHanlder = (e) => this.onDomAttributeModified(e);
            this.click = new EventSource_3.EventSource();
        }
        /**
         * Updates the control when the template has changed. Adds event handlers to the current root element.
         */
        onApplyTemplate() {
            super.onApplyTemplate();
            if (this.rootElement) {
                this.rootElement.addEventListener("click", this._mouseHandler);
                this.rootElement.addEventListener("mousedown", this._mouseHandler);
                this.rootElement.addEventListener("mouseup", this._mouseHandler);
                this.rootElement.addEventListener("mouseleave", this._mouseHandler);
                this.rootElement.addEventListener("keyup", this._keyUpHandler);
                this.rootElement.addEventListener("DOMAttrModified", this._domEventHanlder);
            }
            // Ensure the control is in the correct state
            this.onIsCheckedChanged(null, this.isChecked);
        }
        /**
         * Handles a change to the isEnabled property
         */
        onIsEnabledChangedOverride() {
            super.onIsEnabledChangedOverride();
            if (this.isEnabled) {
                this.rootElement.removeAttribute("disabled");
            }
            else {
                this.rootElement.setAttribute("disabled", "disabled");
            }
        }
        /**
         * Overridable protected to allow the derived class to intercept handling key-up event.
         * @param e The keyboard event
         */
        onKeyUpOverride(e) {
            return false;
        }
        /**
         * Overridable protected to allow the derived class to intercept handling mouse click evnet
         * @param e The mouse event
         */
        onMouseClickOverride(e) {
            return false;
        }
        /**
         * Updates the control when the template is about to change. Removes event handlers from previous root element.
         */
        onTemplateChanging() {
            super.onTemplateChanging();
            if (this.rootElement) {
                this.rootElement.removeEventListener("click", this._mouseHandler);
                this.rootElement.removeEventListener("mousedown", this._mouseHandler);
                this.rootElement.removeEventListener("mouseup", this._mouseHandler);
                this.rootElement.removeEventListener("mouseleave", this._mouseHandler);
                this.rootElement.removeEventListener("keyup", this._keyUpHandler);
                this.rootElement.removeEventListener("DOMAttrModified", this._domEventHanlder);
            }
        }
        /**
         * Dispatches a click event on the menu item only if the menu item is enabled
         * @param e An optional event object.
         */
        press(e) {
            if (this.isEnabled) {
                this.click.invoke(e);
            }
        }
        /**
         * Handles mutation events to allow the menu item to be interacted with via the accessibility tool.
         * @param e The DOM mutation event
         */
        onDomAttributeModified(e) {
            if (e.attrName === "aria-checked") {
                var checked = e.newValue === "true";
                if (this.isChecked !== checked) {
                    this.isChecked = checked;
                }
            }
        }
        /**
         * Handles changes to isChecked by displaying a check mark on the DOM element and unchecking any other items in the radio group
         * @param oldValue The old value for the property
         * @param newValue The new value for the property
         */
        onIsCheckedChanged(oldValue, newValue) {
            if (this.rootElement) {
                if (newValue) {
                    this.rootElement.classList.remove(MenuItem.CLASS_HIDDEN_CHECK_MARK);
                }
                else {
                    this.rootElement.classList.add(MenuItem.CLASS_HIDDEN_CHECK_MARK);
                }
                this.rootElement.setAttribute("aria-checked", "" + newValue);
                this.rootElement.focus();
            }
        }
        /**
         * Handles keyboard events to allow the menu item to be interacted with via the keyboard
         * @param e The keyboard event
         */
        onKeyUp(e) {
            if (this.isEnabled) {
                var handled = this.onKeyUpOverride(e);
                if (!handled) {
                    if (e.keyCode === KeyCodes_8.KeyCodes.Enter || e.keyCode === KeyCodes_8.KeyCodes.Space) {
                        this.press(e);
                        handled = true;
                    }
                }
                if (handled) {
                    e.stopImmediatePropagation();
                }
            }
        }
        /**
         * Handles mouse events to allow the menu item to be interacted with via the mouse
         * @param e The mouse event
         */
        onMouseEvent(e) {
            if (this.isEnabled) {
                switch (e.type) {
                    case "click":
                        var handled = this.onMouseClickOverride(e);
                        if (!handled) {
                            this.press(e);
                        }
                        break;
                    case "mousedown":
                    case "mouseup":
                    case "mouseleave":
                        break;
                    default:
                        assert_9.Assert.fail("Unexpected");
                }
                e.stopImmediatePropagation();
            }
        }
    }
    exports.MenuItem = MenuItem;
    /** CSS class to apply to the menu item root element when it's checked */
    MenuItem.CLASS_HIDDEN_CHECK_MARK = "hiddenCheckMark";
    MenuItem.GroupNamePropertyName = "groupName";
    MenuItem.IsChecked = "isChecked";
    MenuItem.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/CheckBoxMenuItem", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/MenuItem"], function (require, exports, KeyCodes_9, MenuItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckBoxMenuItem = void 0;
    /**
     * A menu item with a checkbox input.
     */
    class CheckBoxMenuItem extends MenuItem_1.MenuItem {
        constructor(templateId) {
            super(templateId || "Common.menuItemCheckBoxTemplate");
        }
        /**
         * Overridable protected to allow the derived class to intercept handling key-up event.
         * @param e The keyboard event
         */
        onKeyUpOverride(e) {
            var handled = false;
            if (e.key === KeyCodes_9.Keys.SPACEBAR) {
                this.isChecked = !this.isChecked;
                handled = true;
            }
            if (!handled) {
                handled = super.onKeyUpOverride(e);
            }
            return handled;
        }
        /**
         * Handles checking the menuitem when clicked
         * @param e An optional event object.
         */
        press(e) {
            // If the source element was the checkbox, then we don't want to flip isChecked (because it is taken care of by the control binding)
            // and we don't want to raise the click event
            var checkBox = this.getNamedElement("BPT-menuItemCheckBox");
            if (!e || e.srcElement !== checkBox) {
                this.isChecked = !this.isChecked;
                super.press(e);
            }
        }
    }
    exports.CheckBoxMenuItem = CheckBoxMenuItem;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/CollectionChangedAction", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollectionChangedAction = void 0;
    /** Types of change events that can occur on Common.Framework.IObservableCollection objects */
    var CollectionChangedAction;
    (function (CollectionChangedAction) {
        CollectionChangedAction[CollectionChangedAction["Add"] = 0] = "Add";
        CollectionChangedAction[CollectionChangedAction["Remove"] = 1] = "Remove";
        CollectionChangedAction[CollectionChangedAction["Reset"] = 2] = "Reset";
        CollectionChangedAction[CollectionChangedAction["Clear"] = 3] = "Clear";
    })(CollectionChangedAction = exports.CollectionChangedAction || (exports.CollectionChangedAction = {}));
    ;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/ICollectionChangedEventArgs", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/IObservableCollection", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/ObservableCollection", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/CollectionChangedAction", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/EventSource"], function (require, exports, CollectionChangedAction_1, EventSource_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObservableCollection = void 0;
    /**
     * An collection (array) which fires events when items are added and removed
     * NB: This does not fully implement Array<T>, but may incorporate more functionality
     *     in the future if it is needed.
     */
    class ObservableCollection {
        /**
         * @constructor
         * @param list An optional list containing data to populate into the ObservableCollection
         */
        constructor(list = []) {
            this._list = list.slice(0);
            this.propertyChanged = new EventSource_4.EventSource();
            this.collectionChanged = new EventSource_4.EventSource();
        }
        /**
         * Gets the current length of the collection
         */
        get length() {
            return this._list.length;
        }
        /**
         * Adds an item or items to the end of the collection
         * @param items New item(s) to add to the collection
         * @return The new length of the collection
         */
        push(...items) {
            var insertionIndex = this._list.length;
            var newLength = Array.prototype.push.apply(this._list, items);
            this.propertyChanged.invoke(ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Add, items, insertionIndex);
            return newLength;
        }
        /**
         * Removes an item from the end of the collection
         * @return The item that was removed from the collection
         */
        pop() {
            var oldItem = this._list.pop();
            this.propertyChanged.invoke(ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Remove, null, null, [oldItem], this._list.length);
            return oldItem;
        }
        /**
         * Remove items from the collection and add to the collection at the given index
         * @param index The location of where to remove and add items
         * @param removeCount The number of items to rmeove
         * @param items New item(s) to add to the collection
         * @return The removed items
         */
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
        /**
         * Returns the first occurrence of an item in the collection
         * @param searchElement The item to search for
         * @param fromIndex The starting index to search from (defaults to collection start)
         * @return The index of the first occurrence of the item, or -1 if it was not found
         */
        indexOf(searchElement, fromIndex) {
            return this._list.indexOf(searchElement, fromIndex);
        }
        /**
         * Returns the last occurrence of an item in the collection
         * @param searchElement The item to search for
         * @param fromIndex The starting index to search from (defaults to collection end)
         * @return The index of the last occurrence of the item, or -1 if it was not found
         */
        lastIndexOf(searchElement, fromIndex = -1) {
            return this._list.lastIndexOf(searchElement, fromIndex);
        }
        /**
         * Clears the contents of the collection to an empty collection
         */
        clear() {
            this._list = [];
            this.propertyChanged.invoke(ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Clear);
        }
        /**
         * Returns the elements of the collection that meet the condition specified in a callback function.
         * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the collection.
         * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
         */
        filter(callbackfn, thisArg) {
            return this._list.filter(callbackfn, thisArg);
        }
        /**
         * Calls a defined callback function on each element of the collection, and returns an array that contains the results.
         * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
         * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
         */
        map(callbackfn, thisArg) {
            return this._list.map(callbackfn, thisArg);
        }
        /**
         * Retrieves an item from the collection
         * @param index The index of the item to retrieve
         * @return The requested item, or undefined if the item does not exist
         */
        getItem(index) {
            return this._list[index];
        }
        /**
         * Replaces the contents of the collection with the supplied items
         * @return The new length of the collection
         */
        resetItems(items) {
            this._list = [];
            var newLength = Array.prototype.push.apply(this._list, items);
            this.propertyChanged.invoke(ObservableCollection.LengthProperty);
            this.invokeCollectionChanged(CollectionChangedAction_1.CollectionChangedAction.Reset);
            return newLength;
        }
        /**
         * Helper method to invoke a CollectionChangedEvent
         * @param action The action which provoked the event (Add, Remove, Reset or Clear)
         * @param newItems The new items which were involved in an Add event
         * @param newStartingIndex The index at which the Add occurred
         * @param oldItems The old items which were involved in a Remove event
         * @param oldStartingIndex The index at which the Remove occurred
         */
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
    /** Represents the name of the length property on the ObservableCollection */
    ObservableCollection.LengthProperty = "length";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ItemsControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/CollectionChangedAction", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/ObservableCollection", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateLoader"], function (require, exports, assert_10, CollectionChangedAction_2, Observable_5, ObservableCollection_1, TemplateControl_3, TemplateLoader_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemsControl = void 0;
    /**
     * A control which binds to an array or ObservableCollection and generates an item container for each
     */
    class ItemsControl extends TemplateControl_3.TemplateControl {
        /**
         * Constructor
         * @param templateId The id of the template to apply to the control.
         */
        constructor(templateId) {
            super(templateId);
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_5.ObservableHelpers.defineProperty(ItemsControl, "items", "", (obj, oldValue, newValue) => obj.onItemsChange(oldValue, newValue));
            Observable_5.ObservableHelpers.defineProperty(ItemsControl, "itemContainerControl", "", (obj, oldValue, newValue) => obj.onItemContainerControlChange(oldValue, newValue));
        }
        /**
         * Retrieves an item from the current items collection
         * @param index The index of the item to retrieve
         * @return The requested item, or undefined if the item does not exist
         */
        getItem(index) {
            assert_10.Assert.isTrue(!!this._collection, "Expecting a non-null collection in the ItemsControl");
            return this._collection.getItem(index);
        }
        /**
         * Retrieves the number of items in the current items collection
         * @return The number of items currently in the ItemsControl's collection
         */
        getItemCount() {
            if (!this._collection) {
                return 0;
            }
            return this._collection.length;
        }
        /**
         * Implemented by the derived class to dispose any events or resources created for the container
         */
        disposeItemContainerOverride(control) {
            // Implemented by the derived class
        }
        /**
         * Implemented by the derived class to allow it to customize the container control
         */
        prepareItemContainerOverride(control, item) {
            // Implemented by the derived class
        }
        /**
         * Updates the control when the template has changed.
         */
        onApplyTemplate() {
            super.onApplyTemplate();
            this._panelRootElement = this.getNamedElement(ItemsControl.PanelRootElementName) || this.rootElement;
            assert_10.Assert.isTrue(!!this._panelRootElement, "Expecting a root element for the panel in ItemsControl.");
            this.regenerateItemControls();
        }
        /**
         * Updates the control when the template is about to change.
         */
        onTemplateChanging() {
            this.removeAllItemControls();
            super.onTemplateChanging();
        }
        /**
         * Overridable and allows sub-classes to update when the items property changes
         */
        onItemsChangedOverride() {
        }
        /**
         * Overridable and allows sub-classes to update when the items container control
         * changes (which results in a full rebuild of the child controls).
         */
        onItemContainerControlChangedOverride() {
        }
        /**
         * Overridable and allows sub-classes to update when the container collection is changed
         */
        onCollectionChangedOverride(args) {
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
                    // items is just an array, wrap it with a collection
                    this._collection = new ObservableCollection_1.ObservableCollection(this.items);
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
                    // Retrieve the classname and verify it's a valid string.
                    var className = parts[0];
                    if (className) {
                        className = className.trim();
                    }
                    assert_10.Assert.isTrue(!!className, "Invalid itemContainerControl value. The control class name is required.");
                    // templateId can be null or empty. So, no checks for it.
                    var templateId = parts[1];
                    if (templateId) {
                        templateId = templateId.trim();
                    }
                    this._itemContainerClassType = TemplateLoader_2.TemplateLoader.getControlType(className);
                    this._itemContainerTemplateId = templateId;
                    this._itemContainerIsTemplateControl = this._itemContainerClassType === TemplateControl_3.TemplateControl || this._itemContainerClassType.prototype instanceof TemplateControl_3.TemplateControl;
                }
            }
            this.regenerateItemControls();
            this.onItemContainerControlChangedOverride();
        }
        onCollectionChanged(args) {
            switch (args.action) {
                case CollectionChangedAction_2.CollectionChangedAction.Add:
                    this.insertItemControls(args.newStartingIndex, args.newItems.length);
                    break;
                case CollectionChangedAction_2.CollectionChangedAction.Clear:
                    this.removeAllItemControls();
                    break;
                case CollectionChangedAction_2.CollectionChangedAction.Remove:
                    this.removeItemControls(args.oldStartingIndex, args.oldItems.length);
                    break;
                case CollectionChangedAction_2.CollectionChangedAction.Reset:
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
            assert_10.Assert.isTrue(end <= this._collection.length, "Unexpected range after inserting into items.");
            assert_10.Assert.isTrue(itemIndex <= this._panelRootElement.childElementCount, "Collection and child elements mismatch.");
            if (itemIndex === this._panelRootElement.childElementCount) {
                // We are adding items at the end, use appendChild
                for (var i = itemIndex; i < end; i++) {
                    var item = this._collection.getItem(i);
                    var control = this.createItemControl(item);
                    this._panelRootElement.appendChild(control.rootElement);
                }
            }
            else {
                // We are adding items in the middle, use insertBefore.
                // Find the node we would want to insert before.
                var endNode = this._panelRootElement.childNodes.item(itemIndex);
                for (var i = itemIndex; i < end; i++) {
                    var item = this._collection.getItem(i);
                    var control = this.createItemControl(item);
                    this._panelRootElement.insertBefore(control.rootElement, endNode);
                }
            }
        }
        removeAllItemControls() {
            if (this._panelRootElement) {
                var children = this._panelRootElement.children;
                var childrenLength = children.length;
                for (var i = 0; i < childrenLength; i++) {
                    var control = children[i].control;
                    this.disposeItemContainer(control);
                }
                this._panelRootElement.innerHTML = "";
            }
        }
        removeItemControls(itemIndex, count) {
            for (var i = itemIndex + count - 1; i >= itemIndex; i--) {
                var element = this._panelRootElement.children[i];
                if (element) {
                    var control = element.control;
                    this.disposeItemContainer(control);
                    this._panelRootElement.removeChild(element);
                }
            }
        }
    }
    exports.ItemsControl = ItemsControl;
    /** The root element which will be used to contain all items. If no element was found with this name, the control rootElement is used. */
    ItemsControl.PanelRootElementName = "_panel";
    ItemsControl.initialize();
});
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ComboBox", ["require", "exports", "plugin-vs-v2", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ItemsControl"], function (require, exports, Plugin, assert_11, Observable_6, ItemsControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ComboBox = void 0;
    class ComboBox extends ItemsControl_1.ItemsControl {
        /**
         * Constructor
         * @param templateId The id of the template to apply to the control
         */
        constructor(templateId) {
            super(templateId || "Common.defaultComboBoxTemplate");
        }
        get focusableElement() { return this.rootElement; }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_6.ObservableHelpers.defineProperty(ComboBox, ComboBox.SelectedValuePropertyName, "");
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._mouseHandler = (e) => this.onMouseEvent(e);
            this.itemContainerControl = "Common.TemplateControl(Common.defaultComboBoxItemTemplate)";
        }
        /**
         * Updates the control when the template has changed
         */
        onApplyTemplate() {
            super.onApplyTemplate();
            if (this.rootElement) {
                this.rootElement.addEventListener("mouseover", this._mouseHandler);
            }
        }
        /**
         * Updates the control when the template is about to change. Removes event handlers from previous root element.
         */
        onTemplateChanging() {
            super.onTemplateChanging();
            if (this.rootElement) {
                this.rootElement.removeEventListener("mouseover", this._mouseHandler);
            }
        }
        /**
         * Overridable and allows sub-classes to update when the items property changes
         */
        onItemsChangedOverride() {
            // Ensure the view is notified so that the selection can be properly reflected
            this.propertyChanged.invoke(ComboBox.SelectedValuePropertyName);
        }
        /**
         * Overridable and allows sub-classes to update when the items container control
         * changes (which results in a full rebuild of the child controls).
         */
        onItemContainerControlChangedOverride() {
            // Ensure the view is notified so that the selection can be properly reflected
            this.propertyChanged.invoke(ComboBox.SelectedValuePropertyName);
        }
        /**
         * Overridable and allows sub-classes to update when the container collection is changed
         */
        onCollectionChangedOverride(args) {
            // Ensure the view is notified so that the selection can be properly reflected
            this.propertyChanged.invoke(ComboBox.SelectedValuePropertyName);
        }
        /**
         * Protected overridable method. Gets called when isEnabled value changes
         */
        onIsEnabledChangedOverride() {
            super.onIsEnabledChangedOverride();
            if (this.isEnabled) {
                this.rootElement.removeAttribute("disabled");
            }
            else {
                this.rootElement.setAttribute("disabled", "disabled");
            }
        }
        /**
         * Handles mouse events to allow the button to be interacted with via the mouse
         * @param e The mouse event
         */
        onMouseEvent(e) {
            if (this.isEnabled) {
                switch (e.type) {
                    case "mouseover":
                        var currentValue = this.selectedValue;
                        var itemCount = this.getItemCount();
                        for (var i = 0; i < itemCount; i++) {
                            var item = this.getItem(i);
                            if (item.value === currentValue) {
                                if (item.tooltip) {
                                    Plugin.Tooltip.show({ content: item.tooltip });
                                }
                            }
                        }
                        break;
                    default:
                        assert_11.Assert.fail("Unexpected");
                }
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }
    }
    exports.ComboBox = ComboBox;
    ComboBox.SelectedValuePropertyName = "selectedValue";
    ComboBox.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ComboBoxMenuItem", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/MenuItem"], function (require, exports, assert_12, Observable_7, KeyCodes_10, MenuItem_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ComboBoxMenuItem = void 0;
    /**
     * A menu item with a combobox input.
     */
    class ComboBoxMenuItem extends MenuItem_2.MenuItem {
        constructor(templateId) {
            super(templateId || "Common.menuItemComboBoxTemplate");
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_7.ObservableHelpers.defineProperty(ComboBoxMenuItem, "items", null);
            Observable_7.ObservableHelpers.defineProperty(ComboBoxMenuItem, "selectedValue", null);
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._focusInHandler = (e) => this.onFocusIn(e);
        }
        onApplyTemplate() {
            super.onApplyTemplate();
            this._selectElement = this.getNamedElement("BPT-menuItemComboBox");
            assert_12.Assert.isTrue(!!this._selectElement, "Expecting a combobox with the name BPT-menuItemComboBox");
            this.rootElement.addEventListener("focusin", this._focusInHandler);
        }
        /**
         * Overridable protected to allow the derived class to intercept handling key-up event.
         * @param e The keyboard event
         */
        onKeyUpOverride(e) {
            var handled = false;
            // The combobox needs to handle the following keys in order to function as expected.
            if (e.srcElement === this._selectElement &&
                e.key === KeyCodes_10.Keys.SPACEBAR || e.key === KeyCodes_10.Keys.ENTER || e.key === KeyCodes_10.Keys.DOWN || e.key === KeyCodes_10.Keys.UP) {
                handled = true;
            }
            if (!handled) {
                handled = super.onKeyUpOverride(e);
            }
            return handled;
        }
        onTemplateChanging() {
            super.onTemplateChanging();
            if (this.rootElement) {
                this.rootElement.removeEventListener("focusin", this._focusInHandler);
            }
        }
        /**
         * Handles checking the menuitem when clicked
         * @param e An optional event object.
         */
        press(e) {
            // The combobox menu item has no pressing logic
        }
        onFocusIn(e) {
            // Transfer focus to the combobox when the menu item gets focus
            this._selectElement.focus();
        }
    }
    exports.ComboBoxMenuItem = ComboBoxMenuItem;
    ComboBoxMenuItem.initialize();
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ControlUtilities", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NavigationDirection = void 0;
    var NavigationDirection;
    (function (NavigationDirection) {
        NavigationDirection[NavigationDirection["Next"] = 0] = "Next";
        NavigationDirection[NavigationDirection["Previous"] = 1] = "Previous";
    })(NavigationDirection = exports.NavigationDirection || (exports.NavigationDirection = {}));
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/PopupControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/Button"], function (require, exports, Observable_8, TemplateControl_4, KeyCodes_11, Button_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PopupControl = exports.TabPressKind = void 0;
    /**
     * An enumeration that specifies the kind of the tab press
     */
    var TabPressKind;
    (function (TabPressKind) {
        TabPressKind[TabPressKind["None"] = 0] = "None";
        TabPressKind[TabPressKind["Tab"] = 1] = "Tab";
        TabPressKind[TabPressKind["ShiftTab"] = 2] = "ShiftTab";
    })(TabPressKind = exports.TabPressKind || (exports.TabPressKind = {}));
    /**
     * A PopupControl class which provides the popup behaviour to its given HTML template
     */
    class PopupControl extends TemplateControl_4.TemplateControl {
        /**
         * @constructor
         * As part of initialization, caches references to event handler instances and loads the template content.
         * @param templateId: Optional template id for the control.
         */
        constructor(templateId) {
            super(templateId);
        }
        /**
         * Initializes the observable properties which should be performed once per each class.
         */
        static initialize() {
            Observable_8.ObservableHelpers.defineProperty(PopupControl, "targetButtonElement", /*defaultValue=*/ null, (obj, oldValue, newValue) => obj.onTargetButtonElementChanged(oldValue, newValue));
        }
        /**
         * Updates the control when the template has changed
         */
        onApplyTemplate() {
            super.onApplyTemplate();
            if (this.rootElement) {
                this.rootElement.classList.add(PopupControl.CLASS_POPUP);
            }
            this.onTargetButtonElementChanged(null, this.targetButtonElement);
        }
        /**
         * Protected virtual function called when initializing the control instance
         */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._blurHandler = (e) => this.onBlur(e);
            this._focusOutHandler = (e) => this.onFocusOut(e);
            this._keyHandler = (e) => this.onKeyEvent(e);
            this._mouseHandler = (e) => this.onDocumentMouseHandler(e);
            this._targetButtonClickHandler = () => this.onTargetButtonClick();
            this._targetButtonKeyHandler = (e) => this.onTargetButtonKeyUp(e);
            this._windowResizeHandler = (e) => this.onWindowResize(e);
            // By default the popup control is not visible
            this.isVisible = false;
        }
        /**
         * Protected virtual function used to notify subclasses that the template is about to change.
         * Can used to perform cleanup on the previous root element
         */
        onTemplateChanging() {
            if (this.rootElement) {
                this.rootElement.classList.remove(PopupControl.CLASS_POPUP);
            }
        }
        /**
         * Protected overridable method. Gets called when the isVisible value changes
         */
        onIsVisibleChangedOverride() {
            super.onIsVisibleChangedOverride();
            if (this.isVisible) {
                window.setTimeout(() => {
                    this.rootElement.focus();
                });
                this._tabLastPressed = TabPressKind.None;
                if (this.targetButtonElement && !this.disablePopupActiveIndicator) {
                    this.targetButtonElement.classList.add(PopupControl.CLASS_POPUP_ACTIVE_ONTARGET);
                }
                this.setPopupPosition();
                // Add event handlers for popup navigation and dismissal
                window.addEventListener("resize", this._windowResizeHandler);
                document.addEventListener("focusout", this._focusOutHandler, /*useCapture=*/ true);
                document.addEventListener("mousedown", this._mouseHandler, /*useCapture=*/ true);
                document.addEventListener("mouseup", this._mouseHandler, /*useCapture=*/ true);
                document.addEventListener("mousewheel", this._mouseHandler, /*useCapture=*/ true);
                document.addEventListener("click", this._mouseHandler, /*useCapture=*/ true);
                this.rootElement.addEventListener("blur", this._blurHandler, /*useCapture=*/ true);
                this.rootElement.addEventListener("keydown", this._keyHandler);
                this.rootElement.addEventListener("keyup", this._keyHandler);
            }
            else {
                if (this.targetButtonElement) {
                    this.targetButtonElement.classList.remove(PopupControl.CLASS_POPUP_ACTIVE_ONTARGET);
                    if (!this._skipTargetButtonFocus) {
                        window.setTimeout(() => {
                            if (this.targetButtonElement) {
                                this.targetButtonElement.focus();
                            }
                        });
                    }
                }
                // Remove event handlers for popup navigation and dismissal
                window.removeEventListener("resize", this._windowResizeHandler);
                document.removeEventListener("focusout", this._focusOutHandler, /*useCapture=*/ true);
                document.removeEventListener("mousedown", this._mouseHandler, /*useCapture=*/ true);
                document.removeEventListener("mouseup", this._mouseHandler, /*useCapture=*/ true);
                document.removeEventListener("mousewheel", this._mouseHandler, /*useCapture=*/ true);
                document.removeEventListener("click", this._mouseHandler, /*useCapture=*/ true);
                this.rootElement.removeEventListener("blur", this._blurHandler, /*useCapture=*/ true);
                this.rootElement.removeEventListener("keydown", this._keyHandler);
                this.rootElement.removeEventListener("keyup", this._keyHandler);
            }
        }
        /**
         * Protected overridable method. Gets called on the keydown event.
         * @param e the keyboard event object
         * @returns true if the event was handled and no need for extra processing
         */
        onKeyDownOverride(e) {
            return false;
        }
        /**
         * Protected overridable method. Gets called on the keyup event.
         * @param e the keyboard event object
         * @returns true if the event was handled and no need for extra processing
         */
        onKeyUpOverride(e) {
            return false;
        }
        /**
         * Displays the popup control at the given absolute co-ordinates
         * @param x x-coordinate of the right end of the popup control
         * @param y y-coordinate of the top of the popup control
         */
        show(x, y) {
            this.isVisible = true;
            if (x !== undefined && y !== undefined) {
                this.rootElement.style.left = (x - this.rootElement.offsetWidth) + "px";
                this.rootElement.style.top = y + "px";
            }
        }
        updatePopupPosition() {
            this.setPopupPosition();
        }
        static totalOffsetLeft(elem) {
            var offsetLeft = 0;
            do {
                if (!isNaN(elem.offsetLeft)) {
                    offsetLeft += elem.offsetLeft;
                }
            } while (elem = elem.offsetParent);
            return offsetLeft;
        }
        static totalOffsetTop(elem) {
            var offsetTop = 0;
            do {
                if (!isNaN(elem.offsetTop)) {
                    offsetTop += elem.offsetTop;
                }
            } while (elem = elem.offsetParent);
            return offsetTop;
        }
        setPopupPosition() {
            this.rootElement.style.left = "0px";
            this.rootElement.style.top = "0px";
            if (!this.targetButtonElement) {
                // Cannot determine the position if there is no targetButtonElement
                return;
            }
            var viewportTop = this.viewportMargin ? (this.viewportMargin.top || 0) : 0;
            var viewportBottom = window.innerHeight - (this.viewportMargin ? (this.viewportMargin.bottom || 0) : 0);
            var viewportLeft = this.viewportMargin ? (this.viewportMargin.left || 0) : 0;
            var viewportRight = window.innerWidth - (this.viewportMargin ? (this.viewportMargin.right || 0) : 0);
            // The positioning logic works by getting the viewport position of the target element then
            // mapping that position to the popup coordinates.
            // The mapping logic use the following arithmatic:
            //   pos = popup_scrollPos + targetElem_viewPortPos - popup_zeroOffsetToDocumnet
            //
            // Get the coordinates of target based on the viewport
            var targetRect = this.targetButtonElement.getBoundingClientRect();
            var targetViewportLeft = Math.round(targetRect.left);
            var targetViewportTop = Math.round(targetRect.top);
            // Get the total scroll position of the popup, so we can map the viewport coordinates to it
            var scrollTopTotal = 0;
            var scrollLeftTotal = 0;
            var elem = this.rootElement.offsetParent;
            while (elem) {
                scrollLeftTotal += elem.scrollLeft;
                scrollTopTotal += elem.scrollTop;
                elem = elem.offsetParent;
            }
            // Gets the offset position when the popup control is at 0,0 to adjust later on this value.
            // because 0,0 doesn't necessarily land on document 0,0 if there is a parent with absolute position.
            var zeroOffsetLeft = PopupControl.totalOffsetLeft(this.rootElement);
            var zeroOffsetTop = PopupControl.totalOffsetTop(this.rootElement);
            // Calculate the left position
            var left = targetViewportLeft;
            var right = left + this.rootElement.offsetWidth;
            if (right > viewportRight) {
                var newRight = targetViewportLeft + this.targetButtonElement.offsetWidth;
                var newLeft = newRight - this.rootElement.offsetWidth;
                if (newLeft >= viewportLeft) {
                    left = newLeft;
                    right = newRight;
                }
            }
            this.rootElement.style.left = scrollLeftTotal + left - zeroOffsetLeft + "px";
            // Calculate the top position
            var top = targetViewportTop + this.targetButtonElement.offsetHeight;
            var bottom = top + this.rootElement.offsetHeight;
            if (bottom > viewportBottom) {
                var newBottom = targetViewportTop;
                var newTop = newBottom - this.rootElement.offsetHeight;
                if (newTop >= viewportTop) {
                    top = newTop;
                    bottom = newBottom;
                }
            }
            // Move the menu up 1 pixel if both the menu and the target button have borders
            if (parseInt(window.getComputedStyle(this.rootElement).borderTopWidth) > 0 &&
                parseInt(window.getComputedStyle(this.targetButtonElement).borderBottomWidth) > 0) {
                top--;
            }
            this.rootElement.style.top = scrollTopTotal + top - zeroOffsetTop + "px";
        }
        onBlur(e) {
            if (!this.keepVisibleOnBlur && !document.hasFocus() && !this._tabLastPressed &&
                !(this.targetButtonElement && this.targetButtonElement.contains(e.relatedTarget))) {
                this.isVisible = false;
            }
        }
        /**
         * Handles a change to the targetButtonElement property. Updates the aria properties of the popup item
         * @param oldValue The old value for the property
         * @param newValue The new value for the property
         */
        onTargetButtonElementChanged(oldValue, newValue) {
            if (oldValue) {
                oldValue.removeAttribute("aria-haspopup");
                oldValue.removeAttribute("aria-owns");
                if (this._targetButtonClickEvtReg) {
                    this._targetButtonClickEvtReg.unregister();
                    this._targetButtonClickEvtReg = null;
                }
                oldValue.removeEventListener("click", this._targetButtonClickHandler);
                oldValue.removeEventListener("keyup", this._targetButtonKeyHandler);
            }
            if (newValue) {
                newValue.setAttribute("aria-haspopup", "true");
                newValue.setAttribute("aria-owns", this.rootElement.id);
                var targetControl = newValue.control;
                if (targetControl && targetControl instanceof Button_1.Button) {
                    var targetButton = targetControl;
                    this._targetButtonClickEvtReg = targetButton.click.addHandler(this._targetButtonClickHandler);
                }
                else {
                    newValue.addEventListener("click", this._targetButtonClickHandler);
                    newValue.addEventListener("keyup", this._targetButtonKeyHandler);
                }
            }
        }
        onTargetButtonClick() {
            this.show();
        }
        onTargetButtonKeyUp(e) {
            if (e.keyCode === KeyCodes_11.KeyCodes.Space || e.keyCode === KeyCodes_11.KeyCodes.Enter) {
                this.show();
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }
        onWindowResize(e) {
            this.isVisible = false;
        }
        /**
         * Focus out listener for the popup control when it is visible.
         */
        onFocusOut(e) {
            if (e.relatedTarget && e.relatedTarget !== this.rootElement && !this.rootElement.contains(e.relatedTarget)) {
                // If focus out was due to tabbing out, then we need to set focus on either the first or the last tabbable element
                if (this._tabLastPressed !== TabPressKind.None) {
                    var tabbableChildren = this.rootElement.querySelectorAll("[tabindex]");
                    var tabbableElement = this.rootElement;
                    if (this._tabLastPressed === TabPressKind.Tab) {
                        // Find the first tabbable element
                        for (var i = 0; i < tabbableChildren.length; i++) {
                            var element = tabbableChildren.item(i);
                            // Check that it is both visible and tabbable
                            if (element.tabIndex >= 0 && element.offsetParent) {
                                tabbableElement = element;
                                break;
                            }
                        }
                    }
                    else {
                        // Find the last tabbable element
                        for (var i = tabbableChildren.length - 1; i >= 0; i--) {
                            var element = tabbableChildren.item(i);
                            // Check that it is both visible and tabbable
                            if (element.tabIndex >= 0 && element.offsetParent) {
                                tabbableElement = element;
                                break;
                            }
                        }
                    }
                    window.setTimeout(() => {
                        tabbableElement.focus();
                    });
                }
                else if (!(this.targetButtonElement && this.targetButtonElement.contains(e.relatedTarget))) {
                    this.isVisible = false;
                    // Dismiss the popup control and set focus on the requesting element
                    window.setTimeout(() => {
                        if (e.target) {
                            e.target.focus();
                        }
                    });
                }
            }
            return false;
        }
        /**
         * Document click listener for the popup control when it is visible. Ignores click in the control itself.
         */
        onDocumentMouseHandler(e) {
            var withinPopup = this.rootElement.contains(e.target);
            if (!withinPopup) {
                var withinTargetButton = this.targetButtonElement && this.targetButtonElement.contains(e.target);
                if (!withinTargetButton) {
                    // Still check the element under the mouse click. Using a scrollbar inside the popup causes and event to be raised with the document as the target
                    var elementUnderPoint = document.elementFromPoint(e.x, e.y);
                    withinPopup = this.rootElement.contains(elementUnderPoint);
                    if (!withinPopup) {
                        // Not within the target button, just hide the popup and not set focus on the target button
                        // Because the normal mouse handler will move focus to the target element
                        this._skipTargetButtonFocus = true;
                        try {
                            this.isVisible = false;
                        }
                        finally {
                            this._skipTargetButtonFocus = false;
                        }
                    }
                }
                else {
                    // Within the target button
                    // Only hide the popup on the click event since it's the last event fired (mousedown -> mouseup -> click)
                    if (e.type === "click" && this.dismissOnTargetButtonClick) {
                        this.isVisible = false;
                    }
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            }
        }
        /**
         * Document key listener for the popup control when it is visible.
         */
        onKeyEvent(e) {
            // Prevent all key strokes from propagating up.
            e.stopImmediatePropagation();
            KeyCodes_11.preventIEKeys(e);
            this._tabLastPressed = e.keyCode === KeyCodes_11.KeyCodes.Tab ? (e.shiftKey ? TabPressKind.ShiftTab : TabPressKind.Tab) : TabPressKind.None;
            if (e.type === "keyup") {
                var handled = this.onKeyUpOverride(e);
                if (!handled) {
                    switch (e.keyCode) {
                        case KeyCodes_11.KeyCodes.Escape:
                            this.isVisible = false;
                            break;
                    }
                }
            }
            else if (e.type === "keydown") {
                this.onKeyDownOverride(e);
            }
            return false;
        }
    }
    exports.PopupControl = PopupControl;
    /** CSS class to apply on the root element */
    PopupControl.CLASS_POPUP = "BPT-popup";
    /** CSS class to apply to the target element when the popup is visible */
    PopupControl.CLASS_POPUP_ACTIVE_ONTARGET = "BPT-popupActive";
    PopupControl.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/MenuControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataAttributes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ControlUtilities", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/PopupControl"], function (require, exports, assert_13, Observable_9, TemplateDataAttributes_4, KeyCodes_12, ControlUtilities_1, PopupControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuControl = void 0;
    /**
     * A MenuControl class which is templatable and provide menu functionality
     */
    class MenuControl extends PopupControl_1.PopupControl {
        /**
         * @constructor
         * As part of initialization, caches references to event handler instances and loads the template content.
         * @param templateId: Optional template id for the control. Default template is Common.menuControlTemplate.
         */
        constructor(templateId) {
            super(templateId || "Common.menuControlTemplate");
        }
        /**
         * Initializes the observable properties which should be performed once per each class.
         */
        static initialize() {
            Observable_9.ObservableHelpers.defineProperty(MenuControl, MenuControl.MenuItemsTemplateIdPropertyName, /*defaultValue=*/ null, (obj, oldValue, newValue) => obj.onMenuTemplateIdChanged(oldValue, newValue));
            Observable_9.ObservableHelpers.defineProperty(MenuControl, MenuControl.SelectedItemPropertyName, /*defaultValue=*/ null, (obj) => obj.onSelectedItemChanged());
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._focusInHandler = (e) => this.onFocusIn(e);
            this._selectedIndex = -1;
            this._menuItemsClickRegistration = [];
            this._menuItemsPropChangedRegistration = [];
            this.menuItems = [];
        }
        /**
         * Attach a handler to the given menu item
         * @param menu item name of the control as provided in data-name attribute
         * @param clickHandler Click handler to be added to the menu item
         */
        addClickHandlerToMenuItem(menuItemName, clickHandler) {
            var element = this.getNamedElement(menuItemName);
            if (element && element.control) {
                element.control.click.addHandler(clickHandler);
            }
        }
        /**
         * Protected overridable. Handles a change to the isVisible property. Updates the menu controls display properties and event handlers.
         */
        onIsVisibleChangedOverride() {
            super.onIsVisibleChangedOverride();
            if (this.isVisible) {
                this.rootElement.addEventListener("focusin", this._focusInHandler);
                // Always reset the selected index when the menu opens
                this.selectedItem = null;
                for (var i = 0; i < this.menuItems.length; i++) {
                    this.menuItems[i].rootElement.classList.remove(MenuControl.CLASS_SELECTED);
                }
            }
            else {
                this.rootElement.removeEventListener("focusin", this._focusInHandler);
            }
        }
        /**
         * Protected overridable method. Gets called on the keyup event.
         * @param e the keyboard event object
         * @returns true if the event was handled and no need for extra processing
         */
        onKeyUpOverride(e) {
            var handled = false;
            switch (e.keyCode) {
                case KeyCodes_12.KeyCodes.ArrowDown:
                    this.changeSelection(ControlUtilities_1.NavigationDirection.Next);
                    handled = true;
                    break;
                case KeyCodes_12.KeyCodes.ArrowUp:
                    this.changeSelection(ControlUtilities_1.NavigationDirection.Previous);
                    handled = true;
                    break;
                case KeyCodes_12.KeyCodes.Space:
                case KeyCodes_12.KeyCodes.Enter:
                    this.pressSelectedItem();
                    handled = true;
                    break;
            }
            if (!handled) {
                handled = super.onKeyUpOverride(e);
            }
            return handled;
        }
        onMenuItemClick() {
            if (this.dismissOnMenuItemClick) {
                this.isVisible = false;
            }
        }
        /**
         * Handles update of the menu items in the same group when one of the menu items in that group is changed.
         * @param menuItem A menu item which is changed.
         * @param propertyName Name of the observable property which was changed on the menu item.
         */
        onMenuItemPropertyChanged(menuItem, propertyName) {
            if (propertyName === "isChecked" || propertyName === "groupName") {
                if (menuItem.groupName && menuItem.isChecked) {
                    // If a menu item is checked, then it unchecks other menu items in the same group. If a menu item is added to the
                    // group and is checked, then it unchecks menu items of the same group.
                    for (var index = 0; index < this.menuItems.length; index++) {
                        var item = this.menuItems[index];
                        if (item !== menuItem && item.groupName === menuItem.groupName && item.isChecked) {
                            item.isChecked = false;
                        }
                    }
                }
            }
        }
        /**
         * Handles a change to menuTemplateId. Resets the menuItems arrays with new menuItems
         * @param oldValue The old value for the property
         * @param newValue The new value for the property
         */
        onMenuTemplateIdChanged(oldValue, newValue) {
            // Unregister the event handlers of the previous menu items if they exist
            while (this._menuItemsPropChangedRegistration.length > 0) {
                this._menuItemsPropChangedRegistration.pop().unregister();
            }
            while (this._menuItemsClickRegistration.length > 0) {
                this._menuItemsClickRegistration.pop().unregister();
            }
            if (newValue) {
                this.menuItems = [];
                this.selectedItem = null;
                this._menuItemsPropChangedRegistration = [];
                this._menuItemsClickRegistration = [];
                var menuItemElements = this.rootElement.querySelectorAll("li[" + TemplateDataAttributes_4.TemplateDataAttributes.CONTROL + "]");
                for (var index = 0; index < menuItemElements.length; index++) {
                    var menuItemElement = menuItemElements[index];
                    assert_13.Assert.isTrue(!!menuItemElement.control, "All menuItemElements must have a control");
                    var menuItem = menuItemElement.control;
                    this.menuItems.push(menuItem);
                    this._menuItemsPropChangedRegistration.push(menuItem.propertyChanged.addHandler(this.onMenuItemPropertyChanged.bind(this, menuItem)));
                    this._menuItemsClickRegistration.push(menuItem.click.addHandler(this.onMenuItemClick.bind(this)));
                }
            }
        }
        /**
         * Handles a change to selectedItem.
         */
        onSelectedItemChanged() {
            if (!this.selectedItem) {
                this.setSelectedIndex(-1, false);
            }
            else {
                var itemIndex = this.menuItems.indexOf(this.selectedItem);
                if (itemIndex !== this._selectedIndex) {
                    this.setSelectedIndex(itemIndex, /*setFocus =*/ false);
                }
            }
        }
        onFocusIn(e) {
            // Find the menu item which contains the target and set it as the selected index
            var menuItemIndex = 0;
            for (; menuItemIndex < this.menuItems.length; menuItemIndex++) {
                var menuItem = this.menuItems[menuItemIndex];
                if (menuItem.rootElement.contains(e.target)) {
                    break;
                }
            }
            if (menuItemIndex < this.menuItems.length) {
                this.setSelectedIndex(menuItemIndex, /*setFocus=*/ false);
            }
        }
        /**
         * Changes the selection to the next or the previous menu item
         * @param direction A direction to move selection in (Next/Previous)
         */
        changeSelection(direction) {
            if (this.menuItems.length === 0) {
                return;
            }
            var step = (direction === ControlUtilities_1.NavigationDirection.Next) ? 1 : -1;
            var startingMenuItem = this.menuItems[this._selectedIndex];
            var newMenuItem;
            var newIndex = this._selectedIndex;
            // Find the first next/previous menu item that is visibile and enabled
            do {
                newIndex = (newIndex + step) % this.menuItems.length;
                if (newIndex < 0) {
                    newIndex = this.menuItems.length - 1;
                }
                newMenuItem = this.menuItems[newIndex];
                if (!startingMenuItem) {
                    startingMenuItem = newMenuItem;
                }
                else if (newMenuItem === startingMenuItem) {
                    break; // looped over to reach the same starting item
                }
            } while (!(newMenuItem.isVisible && newMenuItem.isEnabled));
            if (newMenuItem.isVisible && newMenuItem.isEnabled) {
                this.setSelectedIndex(newIndex, /*setFocus=*/ true);
            }
        }
        /**
         * Call press method on the selected menu item
         */
        pressSelectedItem() {
            var selectedItem = this.menuItems[this._selectedIndex];
            if (selectedItem) {
                selectedItem.press();
            }
        }
        /**
         * Sets the selected index to the given index
         * @param newIndex the index to set to
         * @param setFocus, if true the method will set focus on the menu item
         */
        setSelectedIndex(newIndex, setFocus) {
            if (this._selectedIndex >= 0 && this._selectedIndex < this.menuItems.length) {
                this.menuItems[this._selectedIndex].rootElement.classList.remove(MenuControl.CLASS_SELECTED);
            }
            this._selectedIndex = newIndex;
            var menuItem = this.menuItems[this._selectedIndex];
            if (menuItem) {
                menuItem.rootElement.classList.add(MenuControl.CLASS_SELECTED);
                if (setFocus) {
                    menuItem.rootElement.focus();
                }
                this.selectedItem = menuItem;
            }
        }
    }
    exports.MenuControl = MenuControl;
    /** CSS class to apply to the menu item root element when it's selected */
    MenuControl.CLASS_SELECTED = "selected";
    MenuControl.MenuItemsTemplateIdPropertyName = "menuItemsTemplateId";
    MenuControl.SelectedItemPropertyName = "selectedItem";
    MenuControl.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/Panel", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl"], function (require, exports, TemplateControl_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Panel = void 0;
    /**
     * A panel class which is templatable and provides easy access to controls
     * for the purpose of event handler subscription, etc
     */
    class Panel extends TemplateControl_5.TemplateControl {
        /**
         * Constructor
         * @constructor
         * @param templateId The templateId to use with this panel. If not provided the template root will be a <div> element.
         */
        constructor(templateId) {
            super(templateId);
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
        }
        /**
         * Updates the button with the given name with a click handler
         * @param buttonName Name of the button as provided in data-name attribute
         * @param clickHandler Click handler to be added to the button
         */
        addClickHandlerToButton(buttonName, clickHandler) {
            var element = this.getNamedElement(buttonName);
            if (element && element.control) {
                element.control.click.addHandler(clickHandler);
            }
        }
    }
    exports.Panel = Panel;
    Panel.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/TextBox", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes"], function (require, exports, assert_14, Observable_10, TemplateControl_6, KeyCodes_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextBox = void 0;
    class TextBox extends TemplateControl_6.TemplateControl {
        /**
         * Constructor
         * @param templateId The id of the template to apply to the control
         */
        constructor(templateId) {
            super(templateId || "Common.defaultTextBoxTemplate");
        }
        get focusableElement() { return this.rootElement; }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_10.ObservableHelpers.defineProperty(TextBox, TextBox.PlaceholderPropertyName, "");
            Observable_10.ObservableHelpers.defineProperty(TextBox, TextBox.TextPropertyName, "");
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._keyboardHandler = (e) => this.onKeyboardEvent(e);
        }
        /**
         * Updates the control when the template has changed
         */
        onApplyTemplate() {
            super.onApplyTemplate();
            this._inputRootElement = (this.getNamedElement(TextBox.InputElementName) || this.rootElement);
            assert_14.Assert.isTrue(!!this._inputRootElement, "Expecting a root element for the input element in TextBox.");
            this._textBinding = this.getBinding(this._inputRootElement, "value");
            this._inputRootElement.addEventListener("keydown", this._keyboardHandler);
            this._inputRootElement.addEventListener("keypress", this._keyboardHandler);
            this._inputRootElement.addEventListener("input", this._keyboardHandler);
        }
        /**
         * Handles a change to the isEnabled property
         */
        onIsEnabledChangedOverride() {
            super.onIsEnabledChangedOverride();
            if (this.isEnabled) {
                this.rootElement.removeAttribute("disabled");
            }
            else {
                this.rootElement.setAttribute("disabled", "disabled");
            }
        }
        /**
         * Updates the control when the template is about to change. Removes event handlers from previous root element.
         */
        onTemplateChanging() {
            super.onTemplateChanging();
            if (this._inputRootElement) {
                this._inputRootElement.removeEventListener("keypress", this._keyboardHandler);
                this._inputRootElement.removeEventListener("keydown", this._keyboardHandler);
                this._inputRootElement.removeEventListener("input", this._keyboardHandler);
            }
        }
        /**
         * Handles keyboard events to allow the button to be interacted with via the keyboard
         * @param e The mouse event
         */
        onKeyboardEvent(e) {
            if (this.isEnabled) {
                switch (e.type) {
                    case "keydown":
                        if (e.key === KeyCodes_13.Keys.ENTER) {
                            if (this._textBinding) {
                                this._textBinding.updateSourceFromDest();
                            }
                        }
                        break;
                    case "keypress":
                        if (this.clearOnEscape && e.keyCode === KeyCodes_13.KeyCodes.Escape) {
                            this._inputRootElement.value = "";
                            if (this._textBinding) {
                                this._textBinding.updateSourceFromDest();
                            }
                            // We don't want the textbox to handle escape
                            e.stopImmediatePropagation();
                            e.preventDefault();
                        }
                        break;
                    case "input":
                        if (this.updateOnInput) {
                            if (this._textBinding) {
                                this._textBinding.updateSourceFromDest();
                            }
                        }
                        break;
                    default:
                        assert_14.Assert.fail("Unexpected");
                }
            }
        }
    }
    exports.TextBox = TextBox;
    TextBox.PlaceholderPropertyName = "placeholder";
    TextBox.TextPropertyName = "text";
    /** The root element which will be used to contain all items. If no element was found with this name, the control rootElement is used. */
    TextBox.InputElementName = "_textBoxRoot";
    TextBox.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/TextBoxMenuItem", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/MenuItem"], function (require, exports, assert_15, Observable_11, KeyCodes_14, MenuItem_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextBoxMenuItem = void 0;
    /**
     * A menu item with a textbox input.
     */
    class TextBoxMenuItem extends MenuItem_3.MenuItem {
        constructor(templateId) {
            super(templateId || "Common.menuItemTextBoxTemplate");
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_11.ObservableHelpers.defineProperty(TextBoxMenuItem, TextBoxMenuItem.PlaceholderPropertyName, null);
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._focusInHandler = (e) => this.onFocusIn(e);
        }
        onApplyTemplate() {
            super.onApplyTemplate();
            this._textBox = this.getNamedElement("BPT-menuItemTextBox");
            assert_15.Assert.isTrue(!!this._textBox, "Expecting a textbox with the name BPT-menuItemTextBox");
            this.rootElement.addEventListener("focusin", this._focusInHandler);
        }
        /**
         * Overridable protected to allow the derived class to intercept handling key-up event.
         * @param e The keyboard event
         */
        onKeyUpOverride(e) {
            var handled = false;
            if (e.srcElement === this._textBox && e.keyCode === KeyCodes_14.KeyCodes.Escape) {
                // We don't want the key to reach the menu control
                e.stopImmediatePropagation();
                handled = true;
            }
            if (!handled) {
                handled = super.onKeyUpOverride(e);
            }
            return handled;
        }
        onTemplateChanging() {
            super.onTemplateChanging();
            if (this.rootElement) {
                this.rootElement.removeEventListener("focusin", this._focusInHandler);
            }
        }
        /**
         * Handles checking the menuitem when clicked
         * @param e An optional event object.
         */
        press(e) {
            // The textbox menu item cannot be pressed.
        }
        onFocusIn(e) {
            // Transfer focus to the textbox when the menu item gets focus
            this._textBox.focus();
            // Don't stop the event from bubbling, we still want the event to reach the menu control to update the current selectedIndex
        }
    }
    exports.TextBoxMenuItem = TextBoxMenuItem;
    TextBoxMenuItem.PlaceholderPropertyName = "placeholder";
    TextBoxMenuItem.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ToggleButton", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/Button"], function (require, exports, Observable_12, Button_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleButton = void 0;
    /**
     * A Button class which is templatable and provides basic button functionality
     */
    class ToggleButton extends Button_2.Button {
        /**
         * Constructor
         * @param templateId The id of the template to apply to the control
         */
        constructor(templateId) {
            super(templateId);
            this.toggleIsCheckedOnClick = true;
            this.click.addHandler((e) => {
                if (this.toggleIsCheckedOnClick) {
                    this.isChecked = !this.isChecked;
                }
            });
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_12.ObservableHelpers.defineProperty(Button_2.Button, "isChecked", false, (obj, oldValue, newValue) => obj.onIsCheckedChanged(oldValue, newValue));
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._modificationHandler = (e) => this.onModificationEvent(e);
        }
        /**
         * Updates the control when the template has changed
         */
        onApplyTemplate() {
            super.onApplyTemplate();
            if (this.rootElement) {
                this.rootElement.addEventListener("DOMAttrModified", this._modificationHandler);
                // Ensure the control is in the correct state
                this.onIsCheckedChanged(null, this.isChecked);
            }
        }
        /**
         * Updates the control when the template is about to change. Removes event handlers from previous root element.
         */
        onTemplateChanging() {
            super.onTemplateChanging();
            if (this.rootElement) {
                this.rootElement.removeEventListener("DOMAttrModified", this._modificationHandler);
            }
        }
        /**
         * Handles a change to the isChecked property
         * @param oldValue The old value for the property
         * @param newValue The new value for the property
         */
        onIsCheckedChanged(oldValue, newValue) {
            if (this.rootElement) {
                if (!this._isChangingAriaPressed) {
                    this._isChangingAriaPressed = true;
                    this.rootElement.setAttribute("aria-pressed", newValue + "");
                    this._isChangingAriaPressed = false;
                }
                if (newValue) {
                    this.rootElement.classList.add(ToggleButton.CLASS_CHECKED);
                }
                else {
                    this.rootElement.classList.remove(ToggleButton.CLASS_CHECKED);
                }
            }
        }
        /**
         * Handles DOM modification events to determine if an accessibility tool has changed aria-pressed
         * @param e The keyboard event
         */
        onModificationEvent(e) {
            if (!this._isChangingAriaPressed && this.isEnabled && e.attrName === "aria-pressed" && e.attrChange === e.MODIFICATION) {
                this._isChangingAriaPressed = true;
                this.isChecked = e.newValue === "true";
                this._isChangingAriaPressed = false;
            }
        }
    }
    exports.ToggleButton = ToggleButton;
    /** CSS class to apply to the button's root element when it's checked */
    ToggleButton.CLASS_CHECKED = "checked";
    ToggleButton.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ToolbarControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ControlUtilities", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/Panel"], function (require, exports, assert_16, Observable_13, TemplateControl_7, KeyCodes_15, ControlUtilities_2, Panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToolbarControl = void 0;
    /**
     * A toolbar class which is templatable and provides toolbar functionality
     */
    class ToolbarControl extends Panel_1.Panel {
        /**
         * Constructor
         * @constructor
         * @param templateId The id of the template to apply to the control, for example: toolbarTemplateWithSearchBox.
         *        Default is defaultToolbarTemplate.
         */
        constructor(templateId) {
            super(templateId || "defaultToolbarTemplate");
        }
        /**
         * Static constructor used to initialize observable properties
         */
        static initialize() {
            Observable_13.ObservableHelpers.defineProperty(ToolbarControl, ToolbarControl.PanelTemplateIdPropertyName, /*defaultValue=*/ "", (obj, oldValue, newValue) => obj.onPanelTemplateIdChanged(oldValue, newValue));
            Observable_13.ObservableHelpers.defineProperty(ToolbarControl, ToolbarControl.TitlePropertyName, /*defaultValue=*/ "");
        }
        /** @inheritdoc */
        onInitializeOverride() {
            super.onInitializeOverride();
            this._activeIndex = -1;
            this._controls = [];
            this._controlsPropChangedRegistration = [];
            this._focusInHandler = (e) => this.onFocusIn(e);
            this._toolbarKeyHandler = (e) => this.onToolbarKeyboardEvent(e);
            this._toolbarPanel = null;
        }
        /**
         * Gets the active element that should have focus when tapping into the toolbar
         * @return The active element (or null if none if there isn't an active element)
         */
        getActiveElement() {
            if (this._activeIndex >= 0 && this._activeIndex < this._controls.length) {
                return this._controls[this._activeIndex].rootElement;
            }
            return null;
        }
        /**
         * Moves focus to the next/previous control
         * @param direction A direction to move selection in (Next/Previous)
         */
        moveToControl(direction) {
            var step = (direction === ControlUtilities_2.NavigationDirection.Next) ? 1 : this._controls.length - 1;
            var focusedElement = document.activeElement;
            if (this._controls.length === 0 || this._activeIndex === -1 || !focusedElement) {
                return;
            }
            var startIndex = this._activeIndex;
            // We need to find the startIndex form the document's activeElement if it's inside the toolbar
            // Because we can have a button that still has focus when it got disabled. So, in this case
            // while _activeIndex already moved, we still want to start from that index.
            for (var i = 0; i < this._controls.length; i++) {
                if (this._controls[i].rootElement === focusedElement) {
                    startIndex = i;
                    break;
                }
            }
            var currentIndex = startIndex;
            // Find the next visible and enabled control to focus (wrapping around the end/start if needed)
            while (startIndex !== (currentIndex = (currentIndex + step) % this._controls.length)) {
                var control = this._controls[currentIndex];
                if (control.isVisible && control.isEnabled) {
                    this.setActiveIndex(currentIndex, /*setFocus=*/ true);
                    break;
                }
            }
        }
        onFocusIn(e) {
            // Find the control which contains the target and set it as the active index
            var controlIndex = 0;
            for (; controlIndex < this._controls.length; controlIndex++) {
                var control = this._controls[controlIndex];
                if (control.rootElement.contains(e.target)) {
                    break;
                }
            }
            if (controlIndex < this._controls.length) {
                this.setActiveIndex(controlIndex);
            }
        }
        /**
         * Handles a change to panelTemplateId. Resets the controls arrays with new controls
         * @param oldValue The old value for the property
         * @param newValue The new value for the property
         */
        onPanelTemplateIdChanged(oldValue, newValue) {
            if (this._toolbarPanel) {
                this._toolbarPanel.removeEventListener("focusin", this._focusInHandler);
                this._toolbarPanel.removeEventListener("keydown", this._toolbarKeyHandler);
                this._toolbarPanel = null;
            }
            while (this._controlsPropChangedRegistration.length > 0) {
                this._controlsPropChangedRegistration.pop().unregister();
            }
            if (newValue) {
                this._controls = [];
                this.setActiveIndex(-1);
                this._toolbarPanel = this.getNamedElement(ToolbarControl.TOOLBAR_PANEL_ELEMENT_NAME);
                assert_16.Assert.hasValue(this._toolbarPanel, "Expecting a toolbar panel with the name: " + ToolbarControl.TOOLBAR_PANEL_ELEMENT_NAME);
                this._toolbarPanel.addEventListener("focusin", this._focusInHandler);
                this._toolbarPanel.addEventListener("keydown", this._toolbarKeyHandler);
                for (var elementIndex = 0; elementIndex < this._toolbarPanel.children.length; elementIndex++) {
                    var element = this._toolbarPanel.children[elementIndex];
                    if (element.control) {
                        assert_16.Assert.isTrue(element.control instanceof TemplateControl_7.TemplateControl, "We only support controls of type TemplateControl in the Toolbar");
                        var control = element.control;
                        this._controls.push(control);
                        this._controlsPropChangedRegistration.push(control.propertyChanged.addHandler(this.onChildControlPropertyChanged.bind(this, control)));
                    }
                }
            }
            this.setTabStop();
        }
        /**
         * Handles keyboard events to allow arrow key navigation for selecting the next/previous controls
         * @param e The keyboard event
         */
        onToolbarKeyboardEvent(e) {
            if (e.keyCode === KeyCodes_15.KeyCodes.ArrowLeft) {
                this.moveToControl(ControlUtilities_2.NavigationDirection.Previous);
                e.stopPropagation();
            }
            else if (e.keyCode === KeyCodes_15.KeyCodes.ArrowRight) {
                this.moveToControl(ControlUtilities_2.NavigationDirection.Next);
                e.stopPropagation();
            }
        }
        /**
         * Handles update of the tab index when child-controls have their enabled and visible settings toggled
         * @param button The button who's property has changed
         * @param propertyName Name of the observable property which changed on the button
         */
        onChildControlPropertyChanged(childControl, propertyName) {
            if (propertyName === TemplateControl_7.TemplateControl.IsEnabledPropertyName || propertyName === TemplateControl_7.TemplateControl.IsVisiblePropertyName) {
                if (this._activeIndex === -1) {
                    this.setTabStop();
                }
                else {
                    var currentActiveControl = this._controls[this._activeIndex];
                    if (childControl === currentActiveControl) {
                        if (!(childControl.isEnabled && childControl.isVisible)) {
                            this.setTabStop(/*startAt=*/ this._activeIndex);
                        }
                    }
                }
            }
        }
        /**
         * Ensures that if there is a visible and enabled control it will get a tab stop (1) and all the others will be disabled (-1)
         */
        setTabStop(startAt) {
            this.setActiveIndex(-1);
            startAt = startAt || 0;
            if (startAt < 0 || startAt >= this._controls.length) {
                return;
            }
            var currentIndex = startAt;
            var foundTabStop = false;
            do {
                var control = this._controls[currentIndex];
                if (!foundTabStop && control.isVisible && control.isEnabled) {
                    this.setActiveIndex(currentIndex);
                    foundTabStop = true;
                }
                else {
                    control.tabIndex = -1;
                }
            } while (startAt !== (currentIndex = (currentIndex + 1) % this._controls.length));
        }
        setActiveIndex(newIndex, setFocus) {
            if (this._activeIndex >= 0 && this._activeIndex < this._controls.length) {
                this._controls[this._activeIndex].tabIndex = -1;
            }
            this._activeIndex = newIndex;
            var control = this._controls[this._activeIndex];
            if (control) {
                control.tabIndex = 1;
                if (setFocus) {
                    control.rootElement.focus();
                }
            }
        }
    }
    exports.ToolbarControl = ToolbarControl;
    ToolbarControl.TOOLBAR_PANEL_ELEMENT_NAME = "_toolbarPanel";
    ToolbarControl.PanelTemplateIdPropertyName = "panelTemplateId";
    ToolbarControl.TitlePropertyName = "title";
    ToolbarControl.initialize();
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/API", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/Button", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/CheckBoxMenuItem", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ComboBox", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ComboBoxMenuItem", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ContentControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ControlUtilities", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ItemsControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/MenuControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/MenuItem", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/Panel", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/PopupControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/PopupControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/TextBox", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/TextBoxMenuItem", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ToggleButton", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/ToolbarControl"], function (require, exports, Button_3, CheckBoxMenuItem_1, ComboBox_1, ComboBoxMenuItem_1, ContentControl_3, ControlUtilities_3, ItemsControl_2, MenuControl_1, MenuItem_4, Panel_2, PopupControl_2, PopupControl_3, TextBox_1, TextBoxMenuItem_1, ToggleButton_1, ToolbarControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToolbarControl = exports.ToggleButton = exports.TextBoxMenuItem = exports.TextBox = exports.PopupControl = exports.TabPressKind = exports.Panel = exports.MenuItem = exports.MenuControl = exports.ItemsControl = exports.NavigationDirection = exports.ContentControl = exports.ComboBoxMenuItem = exports.ComboBox = exports.CheckBoxMenuItem = exports.Button = void 0;
    Object.defineProperty(exports, "Button", { enumerable: true, get: function () { return Button_3.Button; } });
    Object.defineProperty(exports, "CheckBoxMenuItem", { enumerable: true, get: function () { return CheckBoxMenuItem_1.CheckBoxMenuItem; } });
    Object.defineProperty(exports, "ComboBox", { enumerable: true, get: function () { return ComboBox_1.ComboBox; } });
    Object.defineProperty(exports, "ComboBoxMenuItem", { enumerable: true, get: function () { return ComboBoxMenuItem_1.ComboBoxMenuItem; } });
    Object.defineProperty(exports, "ContentControl", { enumerable: true, get: function () { return ContentControl_3.ContentControl; } });
    Object.defineProperty(exports, "NavigationDirection", { enumerable: true, get: function () { return ControlUtilities_3.NavigationDirection; } });
    Object.defineProperty(exports, "ItemsControl", { enumerable: true, get: function () { return ItemsControl_2.ItemsControl; } });
    Object.defineProperty(exports, "MenuControl", { enumerable: true, get: function () { return MenuControl_1.MenuControl; } });
    Object.defineProperty(exports, "MenuItem", { enumerable: true, get: function () { return MenuItem_4.MenuItem; } });
    Object.defineProperty(exports, "Panel", { enumerable: true, get: function () { return Panel_2.Panel; } });
    Object.defineProperty(exports, "TabPressKind", { enumerable: true, get: function () { return PopupControl_2.TabPressKind; } });
    Object.defineProperty(exports, "PopupControl", { enumerable: true, get: function () { return PopupControl_3.PopupControl; } });
    Object.defineProperty(exports, "TextBox", { enumerable: true, get: function () { return TextBox_1.TextBox; } });
    Object.defineProperty(exports, "TextBoxMenuItem", { enumerable: true, get: function () { return TextBoxMenuItem_1.TextBoxMenuItem; } });
    Object.defineProperty(exports, "ToggleButton", { enumerable: true, get: function () { return ToggleButton_1.ToggleButton; } });
    Object.defineProperty(exports, "ToolbarControl", { enumerable: true, get: function () { return ToolbarControl_1.ToolbarControl; } });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/API", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/EventSource", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/Binding", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/Binding", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/Binding", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Binding/CommonConverters", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/CollectionChangedAction", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/Observable", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Model/ObservableCollection", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/ScriptTemplateRepository", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/ScriptTemplateRepository", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataAttributes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateDataBinding", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateLoader", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/TemplateLoader"], function (require, exports, EventSource_5, Binding_2, Binding_3, Binding_4, CommonConverters_2, CollectionChangedAction_3, Observable_14, Observable_15, ObservableCollection_2, ScriptTemplateRepository_2, ScriptTemplateRepository_3, TemplateControl_8, TemplateDataAttributes_5, TemplateDataBinding_2, TemplateLoader_3, TemplateLoader_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.templateLoader = exports.TemplateLoader = exports.TemplateDataBinding = exports.TemplateDataAttributes = exports.TemplateControl = exports.templateRepository = exports.ScriptTemplateRepository = exports.ObservableCollection = exports.ObservableHelpers = exports.Observable = exports.CollectionChangedAction = exports.CommonConverters = exports.Binding = exports.targetAccessViaAttribute = exports.targetAccessViaProperty = exports.EventSource = void 0;
    Object.defineProperty(exports, "EventSource", { enumerable: true, get: function () { return EventSource_5.EventSource; } });
    Object.defineProperty(exports, "targetAccessViaProperty", { enumerable: true, get: function () { return Binding_2.targetAccessViaProperty; } });
    Object.defineProperty(exports, "targetAccessViaAttribute", { enumerable: true, get: function () { return Binding_3.targetAccessViaAttribute; } });
    Object.defineProperty(exports, "Binding", { enumerable: true, get: function () { return Binding_4.Binding; } });
    Object.defineProperty(exports, "CommonConverters", { enumerable: true, get: function () { return CommonConverters_2.CommonConverters; } });
    Object.defineProperty(exports, "CollectionChangedAction", { enumerable: true, get: function () { return CollectionChangedAction_3.CollectionChangedAction; } });
    Object.defineProperty(exports, "Observable", { enumerable: true, get: function () { return Observable_14.Observable; } });
    Object.defineProperty(exports, "ObservableHelpers", { enumerable: true, get: function () { return Observable_15.ObservableHelpers; } });
    Object.defineProperty(exports, "ObservableCollection", { enumerable: true, get: function () { return ObservableCollection_2.ObservableCollection; } });
    Object.defineProperty(exports, "ScriptTemplateRepository", { enumerable: true, get: function () { return ScriptTemplateRepository_2.ScriptTemplateRepository; } });
    Object.defineProperty(exports, "templateRepository", { enumerable: true, get: function () { return ScriptTemplateRepository_3.templateRepository; } });
    Object.defineProperty(exports, "TemplateControl", { enumerable: true, get: function () { return TemplateControl_8.TemplateControl; } });
    Object.defineProperty(exports, "TemplateDataAttributes", { enumerable: true, get: function () { return TemplateDataAttributes_5.TemplateDataAttributes; } });
    Object.defineProperty(exports, "TemplateDataBinding", { enumerable: true, get: function () { return TemplateDataBinding_2.TemplateDataBinding; } });
    Object.defineProperty(exports, "TemplateLoader", { enumerable: true, get: function () { return TemplateLoader_3.TemplateLoader; } });
    Object.defineProperty(exports, "templateLoader", { enumerable: true, get: function () { return TemplateLoader_4.templateLoader; } });
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/DataSource", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ItemContainer", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control"], function (require, exports, control_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemContainer = void 0;
    class ItemContainer extends control_9.Control {
        constructor() {
            super(document.createElement("div"));
            this.rootElement.id = "listItemContainer" + (ItemContainer.IdCount++);
            this.rootElement.className = ItemContainer.BASE_CSS_CLASSNAME;
            this.rootElement.tabIndex = -1;
            this.rootElement.addEventListener("focus", this.onFocus.bind(this));
            this.rootElement.addEventListener("blur", this.onBlur.bind(this));
            this.rootElement.addEventListener("click", this.onClick.bind(this));
            this.rootElement.addEventListener("contextmenu", this.onContextMenu.bind(this));
            this.rootElement.addEventListener("mouseover", () => {
                this.rootElement.classList.add(ItemContainer.HOVER_CSS_CLASSNAME);
            });
            this.rootElement.addEventListener("mouseleave", () => {
                this.rootElement.classList.remove(ItemContainer.HOVER_CSS_CLASSNAME);
            });
        }
        get id() {
            if (this.item) {
                return this.item.id;
            }
            else {
                return null;
            }
        }
        get isSelected() {
            return this._isSelected;
        }
        set isSelected(value) {
            if (this._isSelected !== value) {
                this._isSelected = value;
                this.updateStyle();
            }
        }
        get item() {
            return this._item;
        }
        set item(value) {
            this._item = value;
        }
        get template() {
            return this._template;
        }
        set template(value) {
            this._template = value;
        }
        get hasFocus() {
            return this.id !== null && this.id === ItemContainer.FocusedContainerId;
        }
        set hasFocus(value) {
            if (value) {
                ItemContainer.FocusedContainerId = this.id;
            }
            else {
                ItemContainer.FocusedContainerId = null;
            }
        }
        clearHoverState() {
            this.rootElement.classList.remove(ItemContainer.HOVER_CSS_CLASSNAME);
        }
        empty() {
            this.item = null;
            // Set to null as appose to false so the next time
            // isSelected is called it gets through into updateStyle
            // regardless whether the new value is true or false.
            this._isSelected = null;
            this.rootElement.classList.remove("itemContainerHover");
        }
        focus() {
            this.isSelected = true;
            this.hasFocus = true;
            this.updateStyle();
            this.rootElement.focus();
        }
        updateStyle() {
            if (this._isSelected) {
                if (this.hasFocus) {
                    this.rootElement.classList.add(ItemContainer.SELECTED_ACTIVE_CSS_CLASSNAME);
                }
                else {
                    this.rootElement.classList.add(ItemContainer.SELECTED_CSS_CLASSNAME);
                    this.rootElement.classList.remove(ItemContainer.SELECTED_ACTIVE_CSS_CLASSNAME);
                }
            }
            else {
                this.rootElement.classList.remove(ItemContainer.SELECTED_CSS_CLASSNAME);
                this.rootElement.classList.remove(ItemContainer.SELECTED_ACTIVE_CSS_CLASSNAME);
            }
        }
        onBlur() {
            this.hasFocus = false;
            this.updateStyle();
        }
        onClick(e) {
            if (this.clicked) {
                this.clicked(e);
                e.stopImmediatePropagation();
            }
        }
        onContextMenu(e) {
            if (this.contextMenu) {
                this.contextMenu();
            }
        }
        onFocus() {
            this.hasFocus = true;
            this.updateStyle();
        }
    }
    exports.ItemContainer = ItemContainer;
    ItemContainer.BASE_CSS_CLASSNAME = "BPT-listItemContainer";
    ItemContainer.HOVER_CSS_CLASSNAME = "BPT-listItemContainerHover";
    ItemContainer.SELECTED_CSS_CLASSNAME = "BPT-listItemSelected";
    ItemContainer.SELECTED_ACTIVE_CSS_CLASSNAME = "BPT-listItemSelectedActive";
    ItemContainer.IdCount = 0;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/IItemContainerGenerator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/IItemContainerTemplateBinder", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ItemContainerGenerator", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/PromiseHelper", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ItemContainer"], function (require, exports, assert_17, PromiseHelper_1, ItemContainer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemContainerGenerator = void 0;
    class ItemContainerGenerator {
        constructor() {
            this._itemContainers = {};
            this._unusedItemContainers = [];
        }
        get count() {
            if (!this._dataSource) {
                return 0;
            }
            return this._dataSource.count;
        }
        setDataSource(dataSource) {
            if (this._dataSource !== dataSource) {
                this._dataSource = dataSource;
                this._currentIndex = null;
                this.recycleAll();
            }
        }
        startAt(index) {
            if (!this._dataSource) {
                return;
            }
            assert_17.Assert.isTrue(index >= 0 && index < this._dataSource.count, "Index out of range.");
            this._currentIndex = index;
            this._dataSource.startAt(this._currentIndex);
        }
        stop() {
            if (!this._dataSource) {
                return;
            }
            this._currentIndex = null;
            this._dataSource.stop();
        }
        ensureDataAvailable(startIndex, endIndex) {
            var promise;
            if (!this._dataSource) {
                promise = PromiseHelper_1.PromiseHelper.getPromiseSuccess();
            }
            else {
                promise = this._dataSource.ensureDataAvailable(startIndex, endIndex);
            }
            return promise;
        }
        getNext() {
            if (!this._dataSource) {
                return null;
            }
            assert_17.Assert.isTrue(this._currentIndex !== null, "Invalid operation. startAt must be called before calling getNext.");
            var itemContainer = null;
            if (this._currentIndex < this._dataSource.count) {
                var item = this._dataSource.getNext();
                if (item) {
                    itemContainer = this._itemContainers[this._currentIndex];
                    if (!itemContainer) {
                        itemContainer = this.getItemContainer(this._currentIndex, item);
                        this._itemContainers[this._currentIndex] = itemContainer;
                    }
                    this._currentIndex += 1;
                }
            }
            return itemContainer;
        }
        getItemContainerFromItemId(itemId) {
            for (var key in this._itemContainers) {
                var itemContainer = this._itemContainers[key];
                if (itemContainer.id === itemId) {
                    return itemContainer;
                }
            }
            // Item wasn't realized
            return null;
        }
        getItemContainerFromIndex(index) {
            return this._itemContainers[index];
        }
        recycle(index) {
            var itemContainer = this._itemContainers[index];
            if (itemContainer) {
                delete this._itemContainers[index];
                itemContainer.empty();
                this._unusedItemContainers.push(itemContainer);
            }
        }
        recycleAll() {
            for (var key in this._itemContainers) {
                var itemContainer = this._itemContainers[key];
                if (itemContainer) {
                    itemContainer.empty();
                    this._unusedItemContainers.push(itemContainer);
                }
            }
            this._itemContainers = {};
        }
        getItemContainer(itemIndex, item) {
            var itemContainer;
            if (this._unusedItemContainers.length > 0) {
                itemContainer = this._unusedItemContainers.pop();
            }
            else {
                itemContainer = new ItemContainer_1.ItemContainer();
            }
            itemContainer.item = item;
            return itemContainer;
        }
    }
    exports.ItemContainerGenerator = ItemContainerGenerator;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/StackPanel", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/Templating/ScriptTemplateRepository", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/PromiseHelper", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/templateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ItemContainer"], function (require, exports, ScriptTemplateRepository_4, PromiseHelper_2, templateControl_3, ItemContainer_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StackPanel = void 0;
    class StackPanel extends templateControl_3.TemplateControl {
        constructor(parentContainer) {
            super("Common.stackPanelTemplate", ScriptTemplateRepository_4.templateRepository);
            this._parentContainer = parentContainer;
            this._parentContainer.appendChild(this.rootElement);
            this._content = this.findElement("content");
            this.children = {};
            this._requestScrollToOffset = null;
            this.rootElement.addEventListener("scroll", this.onScroll.bind(this), true /*capture*/);
            this._scrollTopCached = null;
        }
        get content() {
            return this._content;
        }
        get parentContainer() {
            return this._parentContainer;
        }
        get rowHeight() {
            if (!this._rowHeight) {
                var itemContainer = new ItemContainer_2.ItemContainer();
                this.content.appendChild(itemContainer.rootElement);
                this._rowHeight = itemContainer.rootElement.offsetHeight;
                try {
                    this.content.removeChild(itemContainer.rootElement);
                }
                catch (e) {
                    // removeOrphanElements in VirtualizingStackPanel can have the effect of removing the element added above
                    // when appeendChild is called. That will cause an error in the removeChild call because the element doesn't exist anymore.
                }
            }
            return this._rowHeight;
        }
        get viewportHeight() {
            if (!this._viewportHeight) {
                this._viewportHeight = Math.floor(this._parentContainer.getBoundingClientRect().height);
            }
            return this._viewportHeight;
        }
        get viewportItemsCount() {
            if (this.rowHeight === 0 || isNaN(this.rowHeight)) {
                return 0;
            }
            return Math.floor(this.viewportHeight / this.rowHeight);
        }
        get scrollHeight() {
            return this.rootElement.scrollHeight;
        }
        get scrollTop() {
            // Use the requested scrollToOffset value if there is one, otherwise use the element's scrollTop value.
            if (this._requestScrollToOffset !== null) {
                // Cap offset to this range [0, this.rootElement.scrollHeight - this.viewportHeight].
                // This simulates what the element's scrollTop does
                var offset = Math.min(this._requestScrollToOffset, this.scrollHeight - this.viewportHeight);
                offset = Math.max(0, offset);
                return offset;
            }
            return this.scrollTopCached;
        }
        // Represents a cached access to the rootElement's scrollTop value
        get scrollTopCached() {
            if (this._scrollTopCached === null) {
                this._scrollTopCached = this.rootElement.scrollTop;
            }
            return this._scrollTopCached;
        }
        // Ensures that the given index is visible in the current scroll page
        // If not scrolls to it.
        ensureVisible(visibleIndex) {
            // Get the top and bottom coordinates of the item
            var itemTop = visibleIndex * this.rowHeight;
            var itemBottom = itemTop + this.rowHeight;
            // Get the top and bottom coordinates of the current visible page
            var viewportTop = this.scrollTop;
            var viewportBottom = viewportTop + this.viewportHeight;
            if (itemTop < viewportTop || itemBottom > viewportBottom) {
                // The item is outside the page (either completely or partially)
                var scrollToPos;
                if (itemTop < viewportTop) {
                    // Set the position at the top
                    scrollToPos = itemTop;
                }
                else {
                    // Set the position at the bottom
                    scrollToPos = itemBottom - this.viewportHeight;
                }
                return this.scrollToOffset(scrollToPos);
            }
            return PromiseHelper_2.PromiseHelper.getPromiseSuccess();
        }
        getItemContainerFromItem(item) {
            return this.itemContainerGenerator.getItemContainerFromItemId(item.id);
        }
        getItemContainerFromIndex(index) {
            return this.itemContainerGenerator.getItemContainerFromIndex(index);
        }
        recycleItem(index) {
            this.itemContainerGenerator.recycle(index);
        }
        setDataSource(datasource) {
            this.itemContainerGenerator.setDataSource(datasource);
        }
        get itemsCount() {
            return this.itemContainerGenerator.count;
        }
        // Returns the viewport offset of the given container. In other words, it's the offset
        // between the item and the beginning of the viewport.
        // If the container doesn't belong to the current viewport the method return 0.
        getScrollViewportOffset(itemContainer) {
            var top = parseInt(itemContainer.rootElement.style.top);
            var scrollTop = this.scrollTop;
            var viewportHeight = this.viewportHeight;
            var viewportOffset = top - scrollTop;
            if (viewportOffset > 0 && viewportOffset <= viewportHeight - this.rowHeight) {
                return viewportOffset;
            }
            return 0;
        }
        invalidate() {
            for (var key in this.children) {
                var itemContainer = this.children[key];
                if (itemContainer) {
                    this.templateBinder.unbind(itemContainer);
                }
            }
            this.itemContainerGenerator.recycleAll();
            this.children = {};
        }
        invalidateSizeCache() {
            this._viewportHeight = null;
            this._rowHeight = 0;
        }
        render(detachBeforeRender = false) {
            var promise;
            if (this._isRendering) {
                // Mark that we have skipped a render request so we can trigger a new pass when we are done with the current render cycle
                this._renderCallsSkipped = true;
                promise = PromiseHelper_2.PromiseHelper.getPromiseSuccess();
            }
            else if (!this.templateBinder) {
                // Cannot render without the template binder
                promise = PromiseHelper_2.PromiseHelper.getPromiseSuccess();
            }
            else {
                this._isRendering = true;
                try {
                    promise = this.renderCoreOverride(detachBeforeRender)
                        .then(() => {
                        // Scroll if there is a request to scroll on render
                        if (this._requestScrollToOffset !== null) {
                            if (this.scrollTopCached !== this._requestScrollToOffset) {
                                this._scrollTopCached = null;
                                this.rootElement.scrollTop = this._requestScrollToOffset;
                            }
                        }
                        this._requestScrollToOffset = null;
                        this._isRendering = false;
                        if (this._renderCallsSkipped) {
                            // We skipped one or more render requests while we were busy doing this render cycle, so
                            // we need to recurse and trigger another render to make sure the view
                            // remains in sync with the user actions that triggered the render requests that we skipped.
                            // The classic case is when the user uses the mouse wheel or scroll bar to continuously scroll
                            // the view, which will cause (particularly on slow machines) for the view to get out of sync
                            // with the scroll position and display a set of empty rows at the top or bottom.
                            this._renderCallsSkipped = false;
                            return this.render(detachBeforeRender);
                        }
                    }, (error) => /*error*/ {
                        this._isRendering = false;
                        this._renderCallsSkipped = false;
                        throw error;
                    });
                }
                catch (e) {
                    this._isRendering = false;
                    this._renderCallsSkipped = false;
                    throw e;
                }
            }
            return promise;
        }
        renderCoreOverride(detachBeforeRender = false) {
            var index = 0;
            this.itemContainerGenerator.startAt(0);
            return this.itemContainerGenerator.ensureDataAvailable(0, this.itemContainerGenerator.count)
                .then(() => {
                var itemContainer = this.itemContainerGenerator.getNext();
                while (itemContainer) {
                    this.templateBinder.bind(itemContainer, index++);
                    this.rootElement.appendChild(itemContainer.rootElement);
                    itemContainer = this.itemContainerGenerator.getNext();
                }
                this.itemContainerGenerator.stop();
            });
        }
        scrollToIndex(visibleIndex, scrollOffset = 0, postponeUntilRender) {
            var position = visibleIndex * this.rowHeight + scrollOffset;
            return this.scrollToOffset(position, postponeUntilRender);
        }
        // When postponeUntilRender is set, we don't do the actual scrolling until the next render is called.
        // This allows us to prevent scrolling into a non-realized area which results in showing an empty space for
        // a small period of time (flickering).
        scrollToOffset(offset, postponeUntilRender) {
            if (postponeUntilRender) {
                this._requestScrollToOffset = offset;
            }
            else {
                this._requestScrollToOffset = null;
                this._scrollTopCached = null;
                this.rootElement.scrollTop = offset;
                // Force render to happen
                this._skipNextOnScroll = true;
                return this.render();
            }
            return PromiseHelper_2.PromiseHelper.getPromiseSuccess();
        }
        onScroll(e) {
            this._scrollTopCached = null;
            // We need to skip rendering when we already performed explicit rendering in the scrollToOffset call
            if (this._skipNextOnScroll) {
                this._skipNextOnScroll = false;
                return;
            }
            this.render();
            if (this.onScrolled) {
                this.onScrolled(e);
            }
        }
    }
    exports.StackPanel = StackPanel;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/VirtualizingStackPanel", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/PromiseHelper", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/StackPanel"], function (require, exports, PromiseHelper_3, StackPanel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VirtualizingStackPanel = void 0;
    class VirtualizingStackPanel extends StackPanel_1.StackPanel {
        constructor(parentContainer) {
            super(parentContainer);
            this._contentSizer = this.findElement("contentSizer");
            this._firstVisibleItemIndex = 0;
        }
        get actualHeight() {
            return this.viewportHeight;
        }
        get scrollHeight() {
            return this.virtualHeight;
        }
        get virtualHeight() {
            return this.rowHeight * this.itemContainerGenerator.count;
        }
        get firstVisibleItemIndex() {
            return this._firstVisibleItemIndex;
        }
        get lastVisibleItemIndex() {
            return this._lastVisibleItemIndex;
        }
        renderCoreOverride(detachBeforeRender = false) {
            var promise;
            this.updateVirtualHeight();
            var visibleItemsCount = Math.ceil(this.getVisibleItemsScrollFraction());
            var firstVisibleItemIndexFractional = this.getFirstVisibleItemScrollFraction();
            //if (detachBeforeRender) {
            //    var tempContentParent: HTMLElement = this.content.parentElement;
            //    tempContentParent.removeChild(this.content);
            //}
            if (firstVisibleItemIndexFractional < this.itemContainerGenerator.count) {
                var overflowItemsCount = Math.ceil(visibleItemsCount / 4); // Consider 1/4 of a page before and after the visible page
                var newFirstVisibleItemIndexFloor = Math.max(0, Math.floor(firstVisibleItemIndexFractional) - overflowItemsCount);
                var newFirstVisibleItemIndexCeiling = Math.max(0, Math.ceil(firstVisibleItemIndexFractional) - overflowItemsCount);
                var newLastVisibleItemIndex = Math.min(this.itemContainerGenerator.count - 1, Math.ceil(this.getFirstVisibleItemScrollFraction()) + visibleItemsCount + overflowItemsCount);
                // Remove items from the top if scrolling down.
                for (var i = this._firstVisibleItemIndex; i < newFirstVisibleItemIndexFloor; ++i) {
                    this.removeItemContainerByIndex(i);
                }
                // Remove items from the bottom if scrolling up.
                for (var i = newLastVisibleItemIndex + 1; i <= this._lastVisibleItemIndex; ++i) {
                    this.removeItemContainerByIndex(i);
                }
                this.itemContainerGenerator.startAt(newFirstVisibleItemIndexFloor);
                var firstChild = this.content.firstChild;
                promise = this.itemContainerGenerator.ensureDataAvailable(newFirstVisibleItemIndexFloor, newLastVisibleItemIndex)
                    .then(() => {
                    for (var i = newFirstVisibleItemIndexFloor; i <= newLastVisibleItemIndex; ++i) {
                        var itemContainer = this.itemContainerGenerator.getNext();
                        if (!itemContainer) {
                            break;
                        }
                        // We need to clear the hover state. This is important when scrolling using the mouse wheel.
                        itemContainer.clearHoverState();
                        this.templateBinder.bind(itemContainer, i);
                        itemContainer.rootElement.style.top = (i * this.rowHeight) + "px";
                        if (this.children[i.toString()] !== itemContainer) {
                            if (!this.content.contains(itemContainer.rootElement)) {
                                this.content.appendChild(itemContainer.rootElement);
                            }
                            this.children[i.toString()] = itemContainer;
                        }
                    }
                    this.itemContainerGenerator.stop();
                    this._firstVisibleItemIndex = newFirstVisibleItemIndexFloor;
                    this._lastVisibleItemIndex = newLastVisibleItemIndex;
                    this.removeOrphanElements();
                });
            }
            else {
                this.removeOrphanElements();
                promise = PromiseHelper_3.PromiseHelper.getPromiseSuccess();
                //if (detachBeforeRender) {
                //    tempContentParent.appendChild(this.content);
                //}
            }
            return promise;
        }
        getFirstVisibleItemScrollFraction() {
            return this.scrollTop / this.rowHeight;
        }
        getVisibleItemsScrollFraction() {
            return this.viewportHeight / this.rowHeight;
        }
        removeItemContainerByIndex(index) {
            var itemContainer = this.children[index.toString()];
            delete this.children[index.toString()];
            if (itemContainer) {
                this.templateBinder.unbind(itemContainer);
            }
            this.itemContainerGenerator.recycle(index);
        }
        removeOrphanElements() {
            var map = {};
            for (var key in this.children) {
                var child = this.children[key];
                map[child.rootElement.id] = true;
            }
            for (var elementIndex = this.content.children.length - 1; elementIndex >= 0; --elementIndex) {
                var element = this.content.children[elementIndex];
                if (!map[element.id]) {
                    this.content.removeChild(element);
                }
            }
        }
        updateVirtualHeight() {
            this._contentSizer.style.top = this.virtualHeight + "px";
        }
    }
    exports.VirtualizingStackPanel = VirtualizingStackPanel;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ListControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/PromiseHelper", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/templateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ItemContainerGenerator", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/VirtualizingStackPanel"], function (require, exports, control_10, KeyCodes_16, PromiseHelper_4, templateControl_4, ItemContainerGenerator_1, VirtualizingStackPanel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListControl = exports.ListItemDataTemplate = void 0;
    /**
     * The item data template used with the list control. Any customized template should override from this class
     */
    class ListItemDataTemplate extends templateControl_4.TemplateControl {
        constructor(templateId, templateRepository) {
            super(templateId, templateRepository);
        }
        updateData(dataItem) {
            if (this.item !== dataItem) {
                this.item = dataItem;
                this.updateUiOverride(dataItem);
            }
        }
        updateUiOverride(item) {
            // Implemented by the override class
        }
    }
    exports.ListItemDataTemplate = ListItemDataTemplate;
    /**
     * The list control.
     */
    class ListControl extends control_10.Control {
        constructor(rootElement) {
            super(rootElement);
            /*
             * To customize the UI of the data template, set a type that extends TreeItemDataTemplate.
             */
            this.dataItemTemplateType = ListItemDataTemplate;
            this._selectedItemVisibleIndex = -1;
            this.rootElement.tabIndex = 0;
            this.rootElement.addEventListener("keydown", this.onKeyDown.bind(this));
            this.panel = new VirtualizingStackPanel_1.VirtualizingStackPanel(this.rootElement);
            this.panel.templateBinder = this;
            this.panel.onScrolled = (e) => {
                if (this.onScrolled) {
                    this.onScrolled(e);
                }
            };
            this._itemContainerGenerator = new ItemContainerGenerator_1.ItemContainerGenerator();
            this.panel.itemContainerGenerator = this._itemContainerGenerator;
            this.invalidateSizeCache();
            this.keepCurrentScrollPositionWhenDataSourceChanges = false;
        }
        get ariaLabel() { return this.rootElement.getAttribute("aria-label"); }
        set ariaLabel(value) {
            this.rootElement.setAttribute("aria-label", value);
        }
        get dataSource() { return this._dataSource; }
        setDataSource(value) {
            this.cancelPromise(this._setDatasourcePromise);
            if (this._dataSource !== value) {
                var selectionViewportOffset = 0;
                // Before setting the new datasource, get the viewport offset of the current selected item.
                // This is used to maintain the offset of the selected item in the current viewport after changing the
                // data source.
                if (this._selectedItem && this._itemContainerGenerator) {
                    var selectedItemContainer = this._itemContainerGenerator.getItemContainerFromItemId(this._selectedItem.id);
                    if (selectedItemContainer) {
                        selectionViewportOffset = this.panel.getScrollViewportOffset(selectedItemContainer);
                    }
                }
                // Set the new datasource with all the related helper objects (item container generator and branch state provider)
                this._dataSource = value;
                // After setting the new datasource, see if we need to keep the current scroll view position.
                // If we need to keep the current scroll view position we just set the data source and return,
                // otherwise we get the visible index of the selectedItem and scroll to it.
                // The visible index might be different (after changing sort order) or it might not even exist.
                // In case we had a viewport offset, apply it to maintain the position of the selected item
                // within the viewport.
                if (this.keepCurrentScrollPositionWhenDataSourceChanges) {
                    this._setDatasourcePromise = PromiseHelper_4.PromiseHelper.getPromiseSuccess()
                        .then(() => {
                        this.panel.setDataSource(value);
                        this.panel.invalidate();
                    });
                }
                else if (this._selectedItem && this._dataSource) {
                    //Scrolling to selected event is handled through promise
                    this._setDatasourcePromise = this.getVisibleIndexOfItem(this._selectedItem).
                        then((selectedItemVisibleIndex) => {
                        this._selectedItemVisibleIndex = selectedItemVisibleIndex;
                        if (this._selectedItemVisibleIndex < 0) {
                            // The selected item doesn't belong in the new dataset, reset the selection
                            return this.setSelectedItem(null);
                        }
                        return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
                    })
                        .then(() => {
                        if (!this.selectedItem) /*item is outside selection region*/ {
                            return this.panel.scrollToOffset(0, /*postponeUntilRender=*/ true);
                        }
                        else {
                            // Pass true to postpone scrolling until after render is called to avoid flickering
                            return this.panel.scrollToIndex(this._selectedItemVisibleIndex, -selectionViewportOffset, true);
                        }
                    })
                        .then(() => {
                        this.panel.setDataSource(value);
                        this.panel.invalidate();
                    });
                }
                else {
                    this._setDatasourcePromise = this.panel.scrollToOffset(0, /*postponeUntilRender=*/ true)
                        .then(() => {
                        this.panel.setDataSource(value);
                        this.panel.invalidate();
                    });
                }
            }
            else {
                this._setDatasourcePromise = PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            return this._setDatasourcePromise;
        }
        get itemContainerGenerator() {
            return this._itemContainerGenerator;
        }
        get selectedItem() { return this._selectedItem; }
        setSelectedItem(value) {
            //Ignoring future events until past request is processed.
            if (this._setSelectedItemProcessing) {
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            if (this._selectedItem !== value || (this._selectedItem && value && this._selectedItem.id !== value.id)) {
                this._setSelectedItemProcessing = true;
                // Unselect the previous selected container
                return this.getSelectedItemContainer()
                    .then((itemContainer) => {
                    if (itemContainer) {
                        itemContainer.isSelected = false;
                    }
                    this._selectedItem = value;
                    // Get the selected item visible index of the selected item
                    if (this._selectedItem) {
                        return this.getVisibleIndexOfItem(this._selectedItem);
                    }
                    else {
                        this._selectedItemVisibleIndex = -1;
                        return Promise.resolve(-1);
                    }
                })
                    .then((selectedItemVisibleIndex) => /*Get newly selected Item*/ {
                    this._selectedItemVisibleIndex = selectedItemVisibleIndex;
                    // Select the new container
                    return this.getSelectedItemContainer(true);
                })
                    .then((itemContainer) => /*ensure visiblity of the slected item*/ {
                    if (itemContainer) {
                        itemContainer.focus();
                    }
                    // Ensure the selectedItem is visible
                    if (this._selectedItemVisibleIndex >= 0) {
                        return this.panel.ensureVisible(this._selectedItemVisibleIndex);
                    }
                    return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
                })
                    .then(() => {
                    if (this.selectedItemChanged) {
                        this.selectedItemChanged(this._selectedItem);
                    }
                    this._setSelectedItemProcessing = false;
                }, (error) => {
                    this._setSelectedItemProcessing = false;
                    throw error;
                });
            }
            return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
        }
        get offsetLeft() {
            if (this._offsetLeft === null) {
                this._offsetLeft = this.rootElement.offsetLeft;
            }
            return this._offsetLeft;
        }
        get offsetTop() {
            if (this._offsetTop === null) {
                this._offsetTop = this.rootElement.offsetTop;
            }
            return this._offsetTop;
        }
        bind(itemContainer, itemIndex) {
            var dataItem = itemContainer.item;
            if (!itemContainer.template) {
                if (!this.dataItemTemplateType) {
                    throw new Error("Expecting a data item template type.");
                }
                // For first time using this container, create the template and attach its
                // root element to the item container.
                itemContainer.template = new this.dataItemTemplateType();
                itemContainer.rootElement.tabIndex = -1;
                itemContainer.rootElement.appendChild(itemContainer.template.rootElement);
            }
            itemContainer.rootElement.setAttribute("data-id", itemContainer.id.toString());
            this.updateContainerOverride(itemContainer, itemIndex);
            itemContainer.clicked = this.onItemSelected.bind(this, itemContainer);
            itemContainer.contextMenu = this.onItemContextMenu.bind(this, itemContainer);
            // Set the selection state on the the container
            itemContainer.isSelected = this._selectedItem && itemContainer.id === this._selectedItem.id;
        }
        /**
         * Overridable. Cleanup any events setup on the container
         */
        cleanupContainerOverride(container) {
        }
        cancelPromise(promise) {
            if (promise) {
                // TODO: Implement promise cancellation.
                // promise.cancel();
            }
        }
        getItemContainerFromItem(item, scrollIfNeeded) {
            var itemContainer = this.panel.getItemContainerFromItem(item);
            var promise;
            if (!itemContainer && scrollIfNeeded) {
                // item wasn't realized, we need to scroll in order for it to realize
                promise = this.scrollToItem(item)
                    .then(() => {
                    // try to get the container again after scrolling
                    itemContainer = this.panel.getItemContainerFromItem(item);
                    if (itemContainer) {
                        return itemContainer;
                    }
                    else { //It is possible that we may not get this item if another request was processed between in the wait period.
                        return null;
                    }
                });
            }
            else {
                promise = PromiseHelper_4.PromiseHelper.getPromiseSuccess(itemContainer);
            }
            return promise;
        }
        getSelectedItemContainer(scrollIfNeeded) {
            var promise;
            if (this.selectedItem) {
                promise = this.getItemContainerFromItem(this.selectedItem, scrollIfNeeded);
            }
            else {
                promise = PromiseHelper_4.PromiseHelper.getPromiseSuccess(null);
            }
            return promise;
        }
        invalidate() {
            this.panel.invalidate();
            return this.panel.render(/* detachBeforeRender = */ true)
                .then(() => {
                // Invalidate the size cache whenever the panel scrollbar state changes
                var panelScrollBarShown = this.panel.virtualHeight > this.panel.viewportHeight;
                if (panelScrollBarShown !== this._panelScrollBarShown) {
                    this._panelScrollBarShown = panelScrollBarShown;
                    this.invalidateSizeCache();
                }
                this.onInvalidated();
            });
        }
        invalidateSizeCache() {
            this._offsetLeft = null;
            this._offsetTop = null;
            this.panel.invalidateSizeCache();
        }
        /**
         * Called when the list control gets invalidated
         */
        onInvalidated() {
        }
        /**
         * Overridable. Gives the derived a class a chance to intercept key events
         * @returns true if handled
         */
        onKeyDownOverride(event) {
            return Promise.resolve(false);
        }
        /**
         * Called when the user invoked the context menu on the list control
         */
        onShowContextMenu() {
        }
        onWindowResize() {
            this.invalidateSizeCache();
            this.invalidate();
        }
        render() {
            return this.invalidate();
        }
        scrollToItem(item) {
            return this.getVisibleIndexOfItem(item)
                .then((visibleIndex) => {
                if (visibleIndex >= 0) {
                    return this.panel.ensureVisible(visibleIndex);
                }
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            });
        }
        selectEnd() {
            if (this._selectedItemVisibleIndex < 0) {
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            return this.setSelectedItemVisibleIndex(this._itemContainerGenerator.count - 1);
        }
        selectHome() {
            if (this._selectedItemVisibleIndex < 0) {
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            return this.setSelectedItemVisibleIndex(0);
        }
        selectPreviousItem() {
            if (this._selectedItemVisibleIndex < 0) {
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            return this.setSelectedItemVisibleIndex(this._selectedItemVisibleIndex - 1);
        }
        selectPageDown() {
            if (this._selectedItemVisibleIndex < 0) {
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            return this.setSelectedItemVisibleIndex(this._selectedItemVisibleIndex + this.panel.viewportItemsCount);
        }
        selectPageUp() {
            if (this._selectedItemVisibleIndex < 0) {
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            return this.setSelectedItemVisibleIndex(this._selectedItemVisibleIndex - this.panel.viewportItemsCount);
        }
        selectNextItem() {
            if (this._selectedItemVisibleIndex < 0) {
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            return this.setSelectedItemVisibleIndex(this._selectedItemVisibleIndex + 1);
        }
        selectItem(itemIndex) {
            return this.setSelectedItemVisibleIndex(itemIndex);
        }
        unbind(itemContainer) {
            itemContainer.clicked = null;
            itemContainer.rootElement.removeAttribute("aria-label");
            this.cleanupContainerOverride(itemContainer);
        }
        /**
         * Overridable. Sets the data on the template and execute all the bindings
         */
        updateContainerOverride(container, itemIndex) {
            var data = container.item;
            var template = container.template;
            this.updateTemplateData(template, data);
        }
        /**
         * Updates the data inside the template
         */
        updateTemplateData(template, data) {
            template.updateData(data);
        }
        getVisibleIndexOfItem(item) {
            return this._dataSource.indexOfItem(item.id);
        }
        onKeyDown(event) {
            var toBeHandled = false;
            switch (event.keyCode) {
                case KeyCodes_16.KeyCodes.ArrowUp:
                case KeyCodes_16.KeyCodes.ArrowDown:
                case KeyCodes_16.KeyCodes.PageUp:
                case KeyCodes_16.KeyCodes.PageDown:
                case KeyCodes_16.KeyCodes.Home:
                case KeyCodes_16.KeyCodes.End:
                case KeyCodes_16.KeyCodes.ArrowRight:
                case KeyCodes_16.KeyCodes.ArrowLeft:
                case KeyCodes_16.KeyCodes.Plus:
                case KeyCodes_16.KeyCodes.Minus:
                case KeyCodes_16.KeyCodes.ContextMenu:
                    {
                        toBeHandled = true;
                        event.preventDefault();
                        event.stopPropagation();
                    }
            }
            if (this._keyDownEventProcessing || !toBeHandled) {
                return;
            }
            this._keyDownEventProcessing = true;
            //We handle the events even if past requests fail
            this.onKeyDownHandler(event)
                .then(() => {
                this._keyDownEventProcessing = false;
            }),
                (() => /*on error we reset _keyDownPromise so that we can handle future requests*/ {
                    this._keyDownEventProcessing = false;
                });
        }
        onKeyDownHandler(event) {
            // Allow the derived claass to handle the keydown event first
            this.onKeyDownOverride(event)
                .then((handled) => {
                if (!handled) {
                    handled = true; // Will get set to false in the default block below if not handled
                    switch (event.keyCode) {
                        case KeyCodes_16.KeyCodes.ArrowUp:
                            if (this._selectedItemVisibleIndex < 0) {
                                return this.setSelectedItemVisibleIndex(0);
                            }
                            else {
                                return this.selectPreviousItem();
                            }
                        case KeyCodes_16.KeyCodes.ArrowDown:
                            if (this._selectedItemVisibleIndex < 0) {
                                return this.setSelectedItemVisibleIndex(0);
                            }
                            else {
                                return this.selectNextItem();
                            }
                        case KeyCodes_16.KeyCodes.PageUp:
                            return this.selectPageUp();
                        case KeyCodes_16.KeyCodes.PageDown:
                            return this.selectPageDown();
                        case KeyCodes_16.KeyCodes.Home:
                            return this.selectHome();
                        case KeyCodes_16.KeyCodes.End:
                            return this.selectEnd();
                        case KeyCodes_16.KeyCodes.ContextMenu:
                            this.onShowContextMenu();
                            return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
                        case KeyCodes_16.KeyCodes.F10:
                            if (event.shiftKey && !event.ctrlKey && !event.altKey) {
                                this.onShowContextMenu();
                                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
                            }
                            break;
                    }
                    return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
                }
            });
            return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
        }
        onItemContextMenu(itemContainer, e) {
            if (this.onItemContextMenuTriggered) {
                this.onItemContextMenuTriggered(itemContainer);
            }
            this.onItemSelected(itemContainer, e);
        }
        onItemSelected(itemContainer, e) {
            var select;
            if (e && !e.altKey && e.ctrlKey && !e.shiftKey) {
                select = !itemContainer.isSelected;
            }
            else {
                select = true;
            }
            if (select) {
                this.setSelectedItem(itemContainer.item)
                    .then(() => {
                    itemContainer.focus();
                });
            }
            else {
                this.setSelectedItem(null);
            }
        }
        setSelectedItemVisibleIndex(newVisibleIndex) {
            //Ignoring future requests
            if (this._setSelectedItemVisibleIndexProcessing) {
                return PromiseHelper_4.PromiseHelper.getPromiseSuccess();
            }
            var totalVisibleCount;
            var itemContainer;
            this._setSelectedItemVisibleIndexProcessing = true;
            totalVisibleCount = this.panel.itemsCount;
            if (newVisibleIndex < 0) {
                newVisibleIndex = 0;
            }
            if (newVisibleIndex >= totalVisibleCount) {
                newVisibleIndex = totalVisibleCount - 1;
            }
            if (this._selectedItemVisibleIndex >= 0 && this._selectedItemVisibleIndex === newVisibleIndex) {
                // no selection changes necessary
                return this.getSelectedItemContainer()
                    .then((itemContainer) => {
                    this._setSelectedItemVisibleIndexProcessing = false;
                }, (error) => {
                    this._setSelectedItemVisibleIndexProcessing = false;
                    throw error;
                });
            }
            else {
                itemContainer = this.panel.getItemContainerFromIndex(newVisibleIndex);
                //To avoid flickering we should check if the itemContainer is already available before selecting. Else, the item will be scrolled and then selected
                if (itemContainer) {
                    if (!itemContainer.rootElement.parentElement) {
                        // If not part of the ui, recycle
                        this.panel.recycleItem(newVisibleIndex);
                    }
                    return this.setSelectedItem(itemContainer.item)
                        .then(() => {
                        this._setSelectedItemVisibleIndexProcessing = false;
                    }, (error) => {
                        this._setSelectedItemVisibleIndexProcessing = false;
                    });
                }
                else {
                    return this.panel.ensureVisible(newVisibleIndex)
                        .then(() => {
                        var promise;
                        itemContainer = this.panel.getItemContainerFromIndex(newVisibleIndex);
                        if (itemContainer) {
                            var item = itemContainer.item;
                            if (!itemContainer.rootElement.parentElement) {
                                // If not part of the ui, recycle
                                this.panel.recycleItem(newVisibleIndex);
                            }
                            promise = this.setSelectedItem(item);
                            // setting the selectedItem will update _selectedItemVisibleIndex
                        }
                        else {
                            //Item is not in the dataset anymore or someother request was processed by js in the wait time
                            promise = PromiseHelper_4.PromiseHelper.getPromiseSuccess();
                        }
                        return promise;
                    })
                        .then(() => {
                        this._setSelectedItemVisibleIndexProcessing = false;
                    }, (error) => {
                        this._setSelectedItemVisibleIndexProcessing = false;
                        throw error;
                    });
                }
            }
        }
    }
    exports.ListControl = ListControl;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/TreeListControl", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/PromiseHelper", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ListControl"], function (require, exports, assert_18, KeyCodes_17, PromiseHelper_5, ListControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeListControl = exports.TreeItemDataTemplate = void 0;
    /**
     * The item data template used with the tree-list control. It provides the UI and functionality for the
     * expander. The template provided should has an element with an id 'expander'.
     */
    class TreeItemDataTemplate extends ListControl_1.ListItemDataTemplate {
        /**
         * Constructor
         * @param templateId The template to use to represent the data for the tree item and any derived templates, it should contain an expander element, ex:
         *  <div>
         *      <div id="expander"></div>
         *      <!-- extra HTML to hold the data -->
         *  </div>
         * @param templateRepository The template repository to use to find the template, if not specified, the template will be loaded from the page
         */
        constructor(templateId, templateRepository) {
            super(templateId, templateRepository);
            this.indentationInPixels = TreeItemDataTemplate.INDENTATION_IN_PIXELS_DEFAULT;
            this._expander = this.findElement("expander");
            assert_18.Assert.isTrue(!!this._expander, "Expecting an expander element");
            this._expander.addEventListener("click", this.onExpansionClicked.bind(this));
            this.rootElement.addEventListener("dblclick", this.onRootElementDblClicked.bind(this));
        }
        collapse() {
            if (this.item && this.item.hasChildren) {
                if (!this._expander.classList.contains(TreeItemDataTemplate.COLLAPSED_CSS_CLASS)) {
                    return this.onExpansionClicked(null)
                        .then(() => {
                        return true;
                    });
                }
            }
            return Promise.resolve(false);
        }
        expand() {
            if (this.item && this.item.hasChildren) {
                if (!this._expander.classList.contains(TreeItemDataTemplate.EXPANDED_CSS_CLASS)) {
                    return this.onExpansionClicked(null)
                        .then(() => {
                        return true;
                    });
                }
            }
            return Promise.resolve(false);
        }
        updateUiOverride(dataItem) {
            super.updateUiOverride(dataItem);
            if (dataItem) {
                this._expander.style.marginLeft = (dataItem.level * this.indentationInPixels) + "px";
                this.setExpanderCss(dataItem);
            }
        }
        onExpansionClicked(e) {
            if (e) {
                e.stopImmediatePropagation();
            }
            if (this.expansionToggledCallback) {
                return this.expansionToggledCallback();
            }
            return PromiseHelper_5.PromiseHelper.getPromiseSuccess();
        }
        onRootElementDblClicked(e) {
            if (e) {
                // Ignore dbl-click if it originated from the expander element
                if (e.srcElement && e.srcElement === this._expander) {
                    e.stopImmediatePropagation();
                    return;
                }
            }
            this.onExpansionClicked(e);
        }
        setExpanderCss(dataItem) {
            if (dataItem.hasChildren) {
                this._expander.classList.remove(TreeItemDataTemplate.NO_EXPANDER_CSS_CLASS);
                if (!dataItem.isExpanded) {
                    this._expander.classList.remove(TreeItemDataTemplate.EXPANDED_CSS_CLASS);
                    this._expander.classList.add(TreeItemDataTemplate.COLLAPSED_CSS_CLASS);
                }
                else {
                    this._expander.classList.remove(TreeItemDataTemplate.COLLAPSED_CSS_CLASS);
                    this._expander.classList.add(TreeItemDataTemplate.EXPANDED_CSS_CLASS);
                }
            }
            else {
                this._expander.classList.remove(TreeItemDataTemplate.EXPANDED_CSS_CLASS);
                this._expander.classList.remove(TreeItemDataTemplate.COLLAPSED_CSS_CLASS);
                this._expander.classList.add(TreeItemDataTemplate.NO_EXPANDER_CSS_CLASS);
            }
        }
    }
    exports.TreeItemDataTemplate = TreeItemDataTemplate;
    TreeItemDataTemplate.INDENTATION_IN_PIXELS_DEFAULT = 13;
    TreeItemDataTemplate.COLLAPSED_CSS_CLASS = "BPT-itemCollapsed";
    TreeItemDataTemplate.EXPANDED_CSS_CLASS = "BPT-itemExpanded";
    TreeItemDataTemplate.NO_EXPANDER_CSS_CLASS = "BPT-noExpander";
    /**
     * The tree-list control.
     */
    class TreeListControl extends ListControl_1.ListControl {
        constructor(rootElement) {
            super(rootElement);
            this.dataItemTemplateType = TreeItemDataTemplate;
            this._onAriaExpandedModifiedHandler = this.onAriaExpandedModified.bind(this);
        }
        updateContainerOverride(itemContainer, itemIndex) {
            super.updateContainerOverride(itemContainer, itemIndex);
            var dataItem = itemContainer.item;
            var template = itemContainer.template;
            if (dataItem) {
                itemContainer.rootElement.removeEventListener("DOMAttrModified", this._onAriaExpandedModifiedHandler);
                if (dataItem.hasChildren) {
                    itemContainer.rootElement.setAttribute("aria-expanded", dataItem.isExpanded ? "true" : "false");
                    template.expansionToggledCallback = this.onExpansionToggled.bind(this, itemContainer, itemIndex);
                    itemContainer.rootElement.addEventListener("DOMAttrModified", this._onAriaExpandedModifiedHandler);
                }
                else {
                    itemContainer.rootElement.removeAttribute("aria-expanded");
                }
            }
        }
        /**
         * Overridable. Gives the derived a class a chance to intercept key events
         * @returns true if handled
         */
        onKeyDownOverride(event) {
            switch (event.keyCode) {
                case KeyCodes_17.KeyCodes.ArrowRight:
                    return this.getSelectedItemContainer()
                        .then((selectedItemContainer) => {
                        if (selectedItemContainer) {
                            selectedItemContainer.template.expand()
                                .then((expanded) => {
                                if (!expanded && selectedItemContainer.item.hasChildren) {
                                    // If already expanded and has children go down to the first child
                                    this.selectNextItem()
                                        .then(() => {
                                        return true;
                                    });
                                }
                            });
                        }
                        return true;
                    });
                case KeyCodes_17.KeyCodes.ArrowLeft:
                    return this.getSelectedItemContainer()
                        .then((selectedItemContainer) => {
                        if (selectedItemContainer) {
                            selectedItemContainer.template.collapse()
                                .then((collapsed) => {
                                if (!collapsed && selectedItemContainer.item.level > 0) {
                                    // If already collapsed and not root go up to the parent
                                    this.dataSource.indexOfParent(selectedItemContainer.id)
                                        .then((parentIndex) => {
                                        if (parentIndex >= 0) {
                                            this.selectItem(parentIndex)
                                                .then(() => {
                                                return true;
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        return true;
                    });
                case KeyCodes_17.KeyCodes.Plus:
                    return this.getSelectedItemContainer()
                        .then((selectedItemContainer) => {
                        if (selectedItemContainer) {
                            selectedItemContainer.template.expand()
                                .then((expanded) => {
                                return true;
                            });
                        }
                        return true;
                    });
                case KeyCodes_17.KeyCodes.Minus:
                    return this.getSelectedItemContainer()
                        .then((selectedItemContainer) => {
                        if (selectedItemContainer) {
                            selectedItemContainer.template.collapse()
                                .then((collapsed) => {
                                return true;
                            });
                        }
                        return true;
                    });
            }
            return Promise.resolve(false);
        }
        cleanupContainerOverride(itemContainer) {
            var template = itemContainer.template;
            if (template) {
                template.expansionToggledCallback = null;
            }
            itemContainer.rootElement.removeEventListener("DOMAttrModified", this._onAriaExpandedModifiedHandler);
        }
        // The only way to detect the Expand/Collapse control pattern for accessiblity is to watch for dom mutations
        onAriaExpandedModified(event) {
            if (event.attrName === "aria-expanded") {
                var element = event.target;
                var itemId = parseInt(element.getAttribute("data-id"));
                var itemContainer = this.itemContainerGenerator.getItemContainerFromItemId(itemId);
                if (itemContainer) {
                    var itemTemplate = itemContainer.template;
                    if (event.newValue === "true") {
                        itemTemplate.expand();
                    }
                    else {
                        itemTemplate.collapse();
                    }
                }
            }
        }
        onExpansionToggled(itemContainer, itemIndex) {
            if (this._onExpansionToggledProcessing) {
                return PromiseHelper_5.PromiseHelper.getPromiseSuccess();
            }
            var dataItem = itemContainer.item;
            var expansionToggledHandler;
            this._onExpansionToggledProcessing = true;
            if (dataItem.isExpanded) {
                expansionToggledHandler = this.dataSource.collapseBranch(itemIndex);
            }
            else {
                expansionToggledHandler = this.dataSource.expandBranch(itemIndex);
            }
            return expansionToggledHandler
                .then(() => {
                return this.setSelectedItem(dataItem);
            })
                .then(() => {
                return this.invalidate();
            })
                .then(() => {
                //The item container will be different after calling invalidate. We set the previously selected item
                return this.getSelectedItemContainer();
            })
                .then((selectedItemContainer) => {
                if (selectedItemContainer) {
                    selectedItemContainer.focus();
                }
                this._onExpansionToggledProcessing = false;
            }, (error) => {
                this._onExpansionToggledProcessing = false;
                throw error;
            });
        }
    }
    exports.TreeListControl = TreeListControl;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/API", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ItemContainer", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ItemContainerGenerator", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ListControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/ListControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/StackPanel", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/TreeListControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/TreeListControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/VirtualizingStackPanel"], function (require, exports, ItemContainer_3, ItemContainerGenerator_2, ListControl_2, ListControl_3, StackPanel_2, TreeListControl_1, TreeListControl_2, VirtualizingStackPanel_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VirtualizingStackPanel = exports.TreeListControl = exports.TreeItemDataTemplate = exports.StackPanel = exports.ListControl = exports.ListItemDataTemplate = exports.ItemContainerGenerator = exports.ItemContainer = void 0;
    Object.defineProperty(exports, "ItemContainer", { enumerable: true, get: function () { return ItemContainer_3.ItemContainer; } });
    Object.defineProperty(exports, "ItemContainerGenerator", { enumerable: true, get: function () { return ItemContainerGenerator_2.ItemContainerGenerator; } });
    Object.defineProperty(exports, "ListItemDataTemplate", { enumerable: true, get: function () { return ListControl_2.ListItemDataTemplate; } });
    Object.defineProperty(exports, "ListControl", { enumerable: true, get: function () { return ListControl_3.ListControl; } });
    Object.defineProperty(exports, "StackPanel", { enumerable: true, get: function () { return StackPanel_2.StackPanel; } });
    Object.defineProperty(exports, "TreeItemDataTemplate", { enumerable: true, get: function () { return TreeListControl_1.TreeItemDataTemplate; } });
    Object.defineProperty(exports, "TreeListControl", { enumerable: true, get: function () { return TreeListControl_2.TreeListControl; } });
    Object.defineProperty(exports, "VirtualizingStackPanel", { enumerable: true, get: function () { return VirtualizingStackPanel_2.VirtualizingStackPanel; } });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/listModel", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListModel = void 0;
    class ListModel {
        constructor(listSource) {
            this.listSource = listSource;
        }
        get length() {
            if (!this.cache) {
                return;
            }
            return this.cache.length;
        }
        load(loadCompleteCallback) {
            this.listSource((results) => {
                this.cache = results;
                loadCompleteCallback();
            }, this._loadArgs);
        }
        setLoadArgs(loadArgs) {
            this._loadArgs = loadArgs;
        }
        item(index) {
            if (!this.cache) {
                return;
            }
            return this.cache[index];
        }
    }
    exports.ListModel = ListModel;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/listReconciler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListReconciler = void 0;
    class ListReconciler {
        constructor(idPropertyName, sortPropertyName, insertBeforeCallback, updateCallback, deleteCallback, isChanged, clearDirtyFlag) {
            this._idPropertyName = idPropertyName;
            this._sortPropertyName = sortPropertyName;
            this._insertBeforeCallback = insertBeforeCallback;
            this._updateCallback = updateCallback;
            this._deleteCallback = deleteCallback;
            this._isChanged = isChanged;
            this._clearDirtyFlag = clearDirtyFlag;
            if (!this._isChanged) {
                this._isChanged = (newThing, oldThing) => {
                    return newThing !== oldThing;
                };
            }
        }
        // Find all of the new, updated and deleted items by comparing the old version of the list with the new one.
        // For each new, updated or deleted item, call the appropriate callback method configured when the reconciler was created.
        reconcile(oldList, newList) {
            if (oldList === null || oldList === undefined) {
                oldList = [];
            }
            if (newList === null || newList === undefined) {
                newList = [];
            }
            // Sort the new list.  Old list should already be started.  The while loop below assumes that both lists are sorted.
            if (this._sortPropertyName) {
                newList.sort((a, b) => {
                    var aValue = a[this._sortPropertyName];
                    var bValue = b[this._sortPropertyName];
                    if (aValue === bValue) {
                        return 0;
                    }
                    else if (aValue < bValue) {
                        return -1;
                    }
                    else {
                        return 1;
                    }
                });
            }
            var oldIndex = 0;
            var newIndex = 0;
            while (oldIndex < oldList.length || newIndex < newList.length) {
                if (newIndex >= newList.length) {
                    this._deleteCallback(oldList[oldIndex++]);
                }
                else if (oldIndex >= oldList.length) {
                    this._insertBeforeCallback(newList[newIndex++], oldIndex < oldList.length ? oldList[oldIndex] : null);
                }
                else if (newList[newIndex][this._idPropertyName] === oldList[oldIndex][this._idPropertyName]) {
                    if (this._isChanged(newList[newIndex], oldList[oldIndex])) {
                        this._updateCallback(newList[newIndex], oldList[oldIndex]);
                        if (this._clearDirtyFlag) {
                            this._clearDirtyFlag(newList[newIndex]);
                        }
                    }
                    newIndex++;
                    oldIndex++;
                }
                else if (newList[newIndex][this._sortPropertyName] > oldList[oldIndex][this._sortPropertyName]) {
                    this._deleteCallback(oldList[oldIndex++]);
                }
                else {
                    this._insertBeforeCallback(newList[newIndex++], oldList[oldIndex]);
                }
            }
        }
    }
    exports.ListReconciler = ListReconciler;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/block", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Block = void 0;
    class Block {
        constructor() {
            this.blocks = [];
        }
        addBlock(block) {
            this.blocks.push(block);
        }
        process(obj) {
            return "";
        }
    }
    exports.Block = Block;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/range", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Range = void 0;
    class Range {
        constructor(firstIndex, lastIndex, content, isFromComplexBlock, isStart, rangeType) {
            this.firstIndex = firstIndex;
            this.lastIndex = lastIndex;
            this.content = content;
            this.isFromComplexBlock = isFromComplexBlock;
            this.isStart = isStart;
            this.rangeType = rangeType;
        }
    }
    exports.Range = Range;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/forEachBlock", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/block"], function (require, exports, block_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ForEachBlock = void 0;
    class ForEachBlock extends block_1.Block {
        constructor(range, text) {
            super();
            this._iterationVariable = range.content;
            this.containerType = "forEach";
        }
        process(obj) {
            var result = "";
            var collection = obj[this._iterationVariable];
            var i, j;
            for (i = 0; i < collection.length; i++) {
                var item = collection[i];
                for (j = 0; j < this.blocks.length; j++) {
                    result = result + this.blocks[j].process(item);
                }
            }
            return result;
        }
    }
    exports.ForEachBlock = ForEachBlock;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/ifBlock", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/block"], function (require, exports, block_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IfBlock = void 0;
    class IfBlock extends block_2.Block {
        constructor(range, text) {
            super();
            this._negate = false;
            this._decisionVariable = range.content;
            if (this._decisionVariable[0] === "!") {
                this._negate = true;
                this._decisionVariable = this._decisionVariable.substr(1);
            }
            this.containerType = "if";
        }
        process(obj) {
            var result = "";
            var decisionValue = obj[this._decisionVariable];
            if (typeof decisionValue === "function") {
                var decisionFunction = decisionValue;
                decisionValue = decisionFunction.call(obj);
            }
            if (this._negate) {
                decisionValue = !decisionValue;
            }
            if (decisionValue) {
                for (var i = 0; i < this.blocks.length; i++) {
                    result = result + this.blocks[i].process(obj);
                }
            }
            return result;
        }
    }
    exports.IfBlock = IfBlock;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/includeBlock", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/block", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/template"], function (require, exports, block_3, template_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IncludeBlock = void 0;
    class IncludeBlock extends block_3.Block {
        constructor(range) {
            super();
            this._template = range.content;
            this.containerType = "include";
        }
        process(obj) {
            var template = new template_1.Template({ htmlElementSource: document, templateId: this._template });
            return template.createTemplateText(obj);
        }
    }
    exports.IncludeBlock = IncludeBlock;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/rangeFinder", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/range"], function (require, exports, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeFinder = void 0;
    class RangeFinder {
        findRanges(text) {
            var result = [];
            if (!text || text.length === 0) {
                return result;
            }
            result = result.concat(this.internalFindRanges("##forEach(", ")##", text, "forEach", true));
            result = result.concat(this.internalFindRanges("##endForEach##", null, text, "forEach", false));
            result = result.concat(this.internalFindRanges("##if(", ")##", text, "if", true));
            result = result.concat(this.internalFindRanges("##endIf##", null, text, "if", false));
            result = result.concat(this.internalFindRanges("##include(", ")##", text, "include", false));
            result.sort(this.compareRanges);
            result = result.concat(this.findRemainingRanges(text, result));
            result.sort(this.compareRanges);
            return result;
        }
        compareRanges(a, b) {
            if (a.firstIndex === b.firstIndex) {
                return 0;
            }
            return a.firstIndex < b.firstIndex ? -1 : 1;
        }
        internalFindRanges(startsWith, endsWith, textToSearch, rangeType, isStart) {
            var indexStartsWith;
            var minimumIndex = 0;
            var indexEndsWith;
            var results = [];
            var content;
            var lastIndex;
            while (minimumIndex < textToSearch.length) {
                indexStartsWith = textToSearch.indexOf(startsWith, minimumIndex);
                indexEndsWith = null;
                content = null;
                lastIndex = null;
                // verify found
                if (indexStartsWith === -1) {
                    return results;
                }
                if (endsWith) {
                    // verify there's enough space for an end
                    minimumIndex = indexStartsWith + startsWith.length + 1;
                    if (minimumIndex >= textToSearch.length) {
                        return results;
                    }
                    indexEndsWith = textToSearch.indexOf(endsWith, minimumIndex);
                    // verify found
                    if (indexEndsWith === -1) {
                        return results;
                    }
                    content = textToSearch.substring(indexStartsWith + startsWith.length, indexEndsWith);
                    lastIndex = indexEndsWith + endsWith.length - 1;
                }
                else {
                    lastIndex = indexStartsWith + startsWith.length - 1;
                }
                results.push(new range_1.Range(indexStartsWith, lastIndex, content, true, isStart, rangeType));
                minimumIndex = results[results.length - 1].lastIndex + 1;
            }
            return results;
        }
        findRemainingRanges(text, rangesFound) {
            var result = [];
            // it is one big text block
            if (rangesFound.length === 0) {
                result.push(new range_1.Range(0, text.length - 1, text, false, false, "text"));
                return result;
            }
            var startIndex = 0;
            var precedingGapLength;
            for (var i = 0; i < rangesFound.length; i++) {
                precedingGapLength = rangesFound[i].firstIndex - startIndex;
                if (precedingGapLength > 0) {
                    result.push(new range_1.Range(startIndex, startIndex + precedingGapLength - 1, text.substring(startIndex, startIndex + precedingGapLength), false, false, "text"));
                }
                startIndex = rangesFound[i].lastIndex + 1;
            }
            if (startIndex < text.length - 1) {
                result.push(new range_1.Range(startIndex, text.length - 1, text.substring(startIndex, text.length), false, false, "text"));
            }
            return result;
        }
    }
    exports.RangeFinder = RangeFinder;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/textBlock", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/block"], function (require, exports, block_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextBlock = void 0;
    class TextBlock extends block_4.Block {
        constructor(range) {
            super();
            this._text = range.content;
            this.containerType = "text";
        }
        process(model) {
            var replaceWhat;
            var text = this._text;
            while (replaceWhat = this.findNextDelimitedString(text)) {
                var propertyPath = replaceWhat.substring(TextBlock.DelimiterLength, replaceWhat.length - TextBlock.DelimiterLength);
                var replaceWith = "";
                var subModel = model;
                propertyPath.split(".").forEach((value, index, array) => {
                    if (!subModel) {
                        return;
                    }
                    subModel = subModel[value];
                });
                if (typeof subModel !== "undefined" && subModel !== null) {
                    if (typeof subModel === "string") {
                        replaceWith = subModel;
                    }
                    else {
                        replaceWith = subModel.toString();
                    }
                }
                replaceWith = replaceWith
                    .replace(TextBlock.GTRegex, "&gt;")
                    .replace(TextBlock.LTRegex, "&lt;")
                    .replace(TextBlock.DoubleQuoteRegex, "&quot;")
                    .replace(TextBlock.SingleQuoteRegex, "&apos;")
                    .replace(TextBlock.DollarRegex, "$$$$");
                text = text.replace(replaceWhat, replaceWith);
            }
            return text;
        }
        findNextDelimitedString(s) {
            var allResults = TextBlock.DelimiterRegex.exec(s);
            if (!allResults) {
                return null;
            }
            return allResults[0];
        }
    }
    exports.TextBlock = TextBlock;
    // The following regex matches valid javascript identifiers (excluding valid Unicode characters greater than U+007F) separated by dots.
    TextBlock.DelimiterRegex = /%%[$a-zA-Z_][$a-zA-Z0-9_]*(\.[$a-zA-Z_][$a-zA-Z0-9_]*)*%%/;
    TextBlock.GTRegex = />/g;
    TextBlock.LTRegex = /</g;
    TextBlock.DoubleQuoteRegex = /"/g;
    TextBlock.SingleQuoteRegex = /'/g;
    TextBlock.DollarRegex = /[$]/g;
    TextBlock.DelimiterLength = 2;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/blockFactory", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/forEachBlock", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/ifBlock", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/includeBlock", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/rangeFinder", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/textBlock"], function (require, exports, forEachBlock_1, ifBlock_1, includeBlock_1, rangeFinder_1, textBlock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BlockFactory = void 0;
    class BlockFactory {
        loadBlocks(container, text) {
            var rangeFinder = new rangeFinder_1.RangeFinder();
            var ranges = rangeFinder.findRanges(text);
            var stack = [container];
            var range;
            var complexBlock;
            var containerType;
            var rangeType;
            for (var i = 0; i < ranges.length; i++) {
                range = ranges[i];
                if (range.rangeType === "text") {
                    stack[stack.length - 1].addBlock(new textBlock_1.TextBlock(range));
                }
                else if (range.rangeType === "include") {
                    stack[stack.length - 1].addBlock(new includeBlock_1.IncludeBlock(range));
                }
                else if (range.isStart) {
                    if (range.rangeType === "if") {
                        complexBlock = new ifBlock_1.IfBlock(range, text);
                    }
                    else if (range.rangeType === "forEach") {
                        complexBlock = new forEachBlock_1.ForEachBlock(range, text);
                    }
                    if (!complexBlock) {
                        throw new Error("unrecognized block type " + range.rangeType);
                    }
                    stack[stack.length - 1].addBlock(complexBlock);
                    stack.push(complexBlock);
                    complexBlock = null;
                }
                else {
                    // must be an ending range
                    rangeType = range.rangeType;
                    containerType = stack[stack.length - 1].containerType;
                    if (rangeType !== containerType) {
                        throw new Error("the current container (" + containerType + ") is missing an end tag. Found a (" + rangeType + ") end tag instead");
                    }
                    stack.pop();
                }
            }
        }
    }
    exports.BlockFactory = BlockFactory;
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/template", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/blockFactory"], function (require, exports, blockFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Template = void 0;
    ;
    class Template {
        constructor(documentSource, htmlText, localizer) {
            this._templateId = "";
            this._blocks = [];
            this.containerType = "template";
            if (documentSource) {
                this._htmlElementSource = documentSource.htmlElementSource;
                this._templateId = documentSource.templateId;
                var templateContainerElement = this._htmlElementSource.getElementById(this._templateId);
                if (!templateContainerElement) {
                    throw new Error("Template with id " + this._templateId + " is not valid.");
                }
                var templateText = templateContainerElement.innerHTML;
                var localizedTemplateText = this.localize(templateText, localizer);
                this.initialize(localizedTemplateText);
            }
            else {
                this.initialize(htmlText);
            }
        }
        addBlock(block) {
            this._blocks.push(block);
        }
        createTemplateText(obj) {
            return this.processBlocks(obj);
        }
        createTemplateElement(obj) {
            var templateInstance = this._htmlElementSource.createElement("div");
            templateInstance.innerHTML = this.createTemplateText(obj);
            var elementNode;
            for (var i = 0; i < templateInstance.childNodes.length; i++) {
                if (templateInstance.childNodes[i].nodeType === Node.TEXT_NODE) {
                    if (!templateInstance.childNodes[i].textContent.match(/^\s+$/)) {
                        return templateInstance;
                    }
                }
                if (templateInstance.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                    if (elementNode) {
                        return templateInstance;
                    }
                    elementNode = templateInstance.childNodes[i];
                }
            }
            return elementNode;
        }
        appendChild(parent, obj, className) {
            var child = this.createTemplateElement(obj);
            if (className) {
                child.classList.add(className);
            }
            parent.appendChild(child);
        }
        replaceChildren(parent, obj, className) {
            parent.innerHTML = "";
            this.appendChild(parent, obj, className);
        }
        localize(text, localizer) {
            if (!localizer) {
                return text;
            }
            var replaceWhat;
            var thingsToReplace = Template.LocalizationRegex.exec(text);
            if (!thingsToReplace || thingsToReplace.length === 0) {
                return text;
            }
            for (var i = 0; i < thingsToReplace.length; i++) {
                replaceWhat = thingsToReplace[i];
                var localizationKey = replaceWhat.substring(Template.DelimiterLength, replaceWhat.length - Template.DelimiterLength);
                var replaceWith = localizer.getString(localizationKey);
                text = text.replace(replaceWhat, replaceWith);
            }
            return text;
        }
        initialize(text) {
            var blockFactory = new blockFactory_1.BlockFactory();
            blockFactory.loadBlocks(this, text);
        }
        processBlocks(model) {
            var result = "";
            for (var i = 0; i < this._blocks.length; i++) {
                result = result + this._blocks[i].process(model);
            }
            return result;
        }
    }
    exports.Template = Template;
    Template.LocalizationRegex = /%L%[a-zA-Z]+%L%/;
    Template.DelimiterLength = 3;
});
//
// Copyright (C) Microsof All rights reserved.
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/listView", ["require", "exports", "plugin-vs-v2", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/template", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/toolwindow"], function (require, exports, Plugin, template_2, toolwindow_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListView = void 0;
    ;
    class ListView {
        constructor(htmlElementSource, listViewDivId, defaultItemTemplateId, model, alternateTemplates, localizer) {
            this._alternateTemplates = [];
            this._handlersAdded = [];
            this.htmlElementSource = htmlElementSource;
            this.listViewDivId = listViewDivId;
            this.listRoot = htmlElementSource.getElementById(listViewDivId);
            if (!this.listRoot) {
                throw new Error("Can't find list root element with id '" + listViewDivId + "'.");
            }
            this._defaultTemplate = this.createTemplate(defaultItemTemplateId, localizer);
            if (!this.listRoot) {
                throw new Error("Can't find default template element with id '" + defaultItemTemplateId + "'.");
            }
            this.model = model;
            if (alternateTemplates) {
                alternateTemplates.forEach((value, index, array) => {
                    var template = this.createTemplate(value.templateId);
                    this._alternateTemplates.push({ selectionFunction: value.templateMatchFunction, template: template });
                });
            }
        }
        createTemplate(id, localizer) {
            return new template_2.Template({ htmlElementSource: this.htmlElementSource, templateId: id }, null, localizer);
        }
        addAutoRemoveHandlers(baseElement, event, classes, func) {
            // Find the elements for each class and add an event listener.
            var handler = (evt) => this.eventHandler(func, evt);
            classes.forEach((className) => {
                var elements = [];
                var childElements = baseElement.querySelectorAll("." + className);
                for (var i = 0; i < childElements.length; i++) {
                    elements.push(childElements[i]);
                }
                if (baseElement.classList.contains(className)) {
                    elements.push(baseElement);
                }
                elements.forEach(element => {
                    element.addEventListener(event, handler);
                    this._handlersAdded.push({ element: element, event: event, handler: handler });
                });
            });
        }
        addHandler(element, event, classes, func) {
            element.addEventListener(event, (evt) => this.eventHandler(func, evt, classes));
        }
        updateView() {
            this.model.load(() => {
                this.renderView();
            });
        }
        renderView() {
            this.clearView();
            this.preViewProcessing();
            for (var i = 0; i < this.model.length; i++) {
                this.preItemViewProcessing(i);
                this.listRoot.appendChild(this.renderItem(this.model.item(i), "BPT-List-Item"));
                this.postItemViewProcessing(i);
            }
            this.postViewProcessing();
            if (this.renderViewCallback) {
                this.renderViewCallback();
            }
        }
        renderItem(item, className) {
            var selectedTemplate = this.chooseTemplate(item);
            var element = selectedTemplate.createTemplateElement(item);
            if (className) {
                element.classList.add(className);
            }
            return element;
        }
        renderItemText(item) {
            var selectedTemplate = this.chooseTemplate(item);
            return selectedTemplate.createTemplateText(item);
        }
        clearView() {
            this.removeAllHandlers();
            $m(this.listRoot).children().remove();
        }
        removeAllHandlers() {
            this._handlersAdded.forEach((handler) => {
                handler.element.removeEventListener(handler.event, handler.handler);
            });
            this._handlersAdded = [];
        }
        setFocus(element) {
            this.setTabIndex(element);
            element.focus();
        }
        setTabIndex(element) {
            // Clear other tabIndexes under our root, because we only want one.
            var tabElements = this.listRoot.querySelectorAll("[tabIndex='1']");
            for (var i = 0; i < tabElements.length; i++) {
                tabElements[i].removeAttribute("tabIndex");
            }
            element.setAttribute("tabIndex", "1");
        }
        // The following method provides a way for subclasses to do processing after the view is rendered. It is called from renderView()
        postViewProcessing() {
            this.addAutoRemoveHandlers(this.listRoot, "mouseenter", [ListView.TOOLTIP_ITEM], (evt) => {
                var tip = evt.target.getAttribute("data-tooltip");
                if (tip) {
                    Plugin.Tooltip.show({ content: tip });
                }
                return true;
            });
            this.addAutoRemoveHandlers(this.listRoot, "mouseleave", [ListView.TOOLTIP_ITEM], (evt) => {
                Plugin.Tooltip.dismiss();
                return true;
            });
        }
        // The following method provides a way for subclasses to do processing before the view is rendered. It is called from renderView()
        preViewProcessing() {
        }
        // The following method provides a way for subclasses to do processing before each item is rendered. It is called from renderView()
        preItemViewProcessing(index) {
        }
        // The following method provides a way for subclasses to do processing before each item is rendered. It is called from renderView()
        postItemViewProcessing(index) {
        }
        chooseTemplate(item) {
            var selectedTemplate = null;
            this._alternateTemplates.forEach((value, index, array) => {
                if (value.selectionFunction(item)) {
                    selectedTemplate = value.template;
                    return;
                }
            });
            if (!selectedTemplate) {
                selectedTemplate = this._defaultTemplate;
            }
            return selectedTemplate;
        }
        eventHandler(func, evt, classes) {
            if (toolwindow_1.ToolWindowHelpers.isContextMenuUp()) {
                return;
            }
            var element = evt.target;
            if (!element) {
                return;
            }
            var classMatches;
            if (classes && classes.length && element.classList) {
                classMatches = false;
                for (var i = 0; i < classes.length; i++) {
                    if (element.classList.contains(classes[i])) {
                        classMatches = true;
                        break;
                    }
                }
            }
            else {
                classMatches = true;
            }
            if (classMatches && !func(evt)) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        }
    }
    exports.ListView = ListView;
    ListView.TOOLTIP_ITEM = "BPT-Tooltip-Item";
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/reconcilingListView", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/listReconciler", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/listView"], function (require, exports, listReconciler_1, listView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReconcilingListView = void 0;
    class ReconcilingListView extends listView_1.ListView {
        constructor(htmlElementSource, listViewDivId, defaultItemTemplateId, model, alternateTemplates, localizer, idPropertyName, sortPropertyName, isChanged, clearDirtyFlag) {
            super(htmlElementSource, listViewDivId, defaultItemTemplateId, model, alternateTemplates, localizer);
            this.objectsPreviouslyRendered = [];
            this.htmlElementSource = htmlElementSource;
            this.listViewDivId = listViewDivId;
            this.idPropertyName = idPropertyName;
            this._sortPropertyName = sortPropertyName;
            if (this.idPropertyName && this._sortPropertyName) {
                this.listReconciler = new listReconciler_1.ListReconciler(idPropertyName, sortPropertyName, this.insertBefore.bind(this), this.update.bind(this), this.deleteItem.bind(this), isChanged, clearDirtyFlag);
            }
        }
        renderView() {
            if (!this.listReconciler) {
                super.renderView();
                return;
            }
            this.preViewProcessing();
            this.listReconciler.reconcile(this.objectsPreviouslyRendered, this.model.cache);
            this.objectsPreviouslyRendered = this.model.cache.slice(0);
            this.postViewProcessing();
            if (this.renderViewCallback) {
                this.renderViewCallback();
            }
        }
        // The following method provides a way for subclasses to do processing before the item is updated. It is called from update()
        beforeUpdate(newThing, oldThing, updatedElement) {
        }
        // The following method provides a way for subclasses to do processing after the item is updated. It is called from update()
        afterUpdate(newThing, oldThing, updatedElement) {
        }
        // The following method provides a way for subclasses to do processing before the item is deleted. It is called from deleteItem()
        beforeDelete(oldThing, deletedElement) {
        }
        // The following method provides a way for subclasses to do processing after the item is deleted. It is called from deleteItem()
        afterDelete() {
        }
        clearView() {
            super.clearView();
            this.objectsPreviouslyRendered = [];
        }
        insertBefore(newThing, insertBefore) {
            var newElement = this.renderItem(newThing, ReconcilingListView.ListItemClassName);
            if (!insertBefore) {
                this.listRoot.appendChild(newElement);
                return;
            }
            var insertBeforeElement = this.listRoot.querySelector("[data-listid='" + insertBefore[this.idPropertyName] + "']");
            if (insertBeforeElement) {
                this.listRoot.insertBefore(newElement, insertBeforeElement);
            }
            else {
                this.listRoot.appendChild(newElement);
            }
        }
        update(newThing, oldThing) {
            var oldElement = this.listRoot.querySelector("[data-listid='" + oldThing[this.idPropertyName] + "']");
            if (oldElement) {
                this.beforeUpdate(newThing, oldThing, oldElement);
                var newElementText = this.renderItemText(newThing);
                oldElement.outerHTML = newElementText;
                oldElement.classList.add(ReconcilingListView.ListItemClassName);
                this.afterUpdate(newThing, oldThing, oldElement);
            }
        }
        deleteItem(thingToDelete) {
            var oldElement = this.listRoot.querySelector("[data-listid='" + thingToDelete[this.idPropertyName] + "']");
            if (oldElement) {
                this.beforeDelete(thingToDelete, oldElement);
                //oldElement.removeNode(true); -- dshoots: not needed for AppResponsiveness.
                this.afterDelete();
            }
        }
    }
    exports.ReconcilingListView = ReconcilingListView;
    ReconcilingListView.ListItemClassName = "BPT-List-Item";
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/API", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/listModel", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/listReconciler", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/listView", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/reconcilingListView"], function (require, exports, listModel_1, listReconciler_2, listView_2, reconcilingListView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReconcilingListView = exports.ListView = exports.ListReconciler = exports.ListModel = void 0;
    Object.defineProperty(exports, "ListModel", { enumerable: true, get: function () { return listModel_1.ListModel; } });
    Object.defineProperty(exports, "ListReconciler", { enumerable: true, get: function () { return listReconciler_2.ListReconciler; } });
    Object.defineProperty(exports, "ListView", { enumerable: true, get: function () { return listView_2.ListView; } });
    Object.defineProperty(exports, "ReconcilingListView", { enumerable: true, get: function () { return reconcilingListView_1.ReconcilingListView; } });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/API", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/block", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/blockFactory", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/forEachBlock", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/ifBlock", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/includeBlock", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/range", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/rangeFinder", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/template", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/textBlock"], function (require, exports, block_5, blockFactory_2, forEachBlock_2, ifBlock_2, includeBlock_2, range_2, rangeFinder_2, template_3, textBlock_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextBlock = exports.Template = exports.RangeFinder = exports.Range = exports.IncludeBlock = exports.IfBlock = exports.ForEachBlock = exports.BlockFactory = exports.Block = void 0;
    Object.defineProperty(exports, "Block", { enumerable: true, get: function () { return block_5.Block; } });
    Object.defineProperty(exports, "BlockFactory", { enumerable: true, get: function () { return blockFactory_2.BlockFactory; } });
    Object.defineProperty(exports, "ForEachBlock", { enumerable: true, get: function () { return forEachBlock_2.ForEachBlock; } });
    Object.defineProperty(exports, "IfBlock", { enumerable: true, get: function () { return ifBlock_2.IfBlock; } });
    Object.defineProperty(exports, "IncludeBlock", { enumerable: true, get: function () { return includeBlock_2.IncludeBlock; } });
    Object.defineProperty(exports, "Range", { enumerable: true, get: function () { return range_2.Range; } });
    Object.defineProperty(exports, "RangeFinder", { enumerable: true, get: function () { return rangeFinder_2.RangeFinder; } });
    Object.defineProperty(exports, "Template", { enumerable: true, get: function () { return template_3.Template; } });
    Object.defineProperty(exports, "TextBlock", { enumerable: true, get: function () { return textBlock_2.TextBlock; } });
});
//
// Copyright (C) Microsoft. All rights reserved.
//
define("Bpt.Diagnostics.Common", ["require", "exports", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/assert", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/button", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ButtonHelpers", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/contentControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/control", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/CssUtilities", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/dataListTextBox", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ElementRecyclerFactory", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/encodingUtilities", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/errorHandling", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/KeyCodes", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/listBox", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/listBox", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/listBox", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/PromiseHelper", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/radioButton", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/TabControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/TabItem", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/templateControl", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/toggleButton", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/toolwindow", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Controls/API", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Framework/API", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ListControl/API", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/ModelView/API", "src/edev/ClientDiagnostics/Source/AppResponsiveness/View/bpt.diagnostics.common/Templating/API"], function (require, exports, assert_19, button_2, ButtonHelpers_1, contentControl_2, control_11, CssUtilities_1, dataListTextBox_1, ElementRecyclerFactory_1, encodingUtilities_1, errorHandling_2, KeyCodes_18, KeyCodes_19, KeyCodes_20, KeyCodes_21, KeyCodes_22, KeyCodes_23, KeyCodes_24, KeyCodes_25, listBox_1, listBox_2, listBox_3, PromiseHelper_6, radioButton_1, TabControl_1, TabItem_1, templateControl_5, toggleButton_1, toolwindow_2, Controls, Framework, ListControl, ModelView, Templating) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Templating = exports.ModelView = exports.ListControl = exports.Framework = exports.Controls = exports.ToolWindowHelpers = exports.ToggleButton = exports.TemplateControl = exports.TabItem = exports.TabControl = exports.RadioButton = exports.PromiseHelper = exports.ListBoxItemContainer = exports.ListBox = exports.ListBoxItem = exports.preventIEKeys = exports.HasOnlyCtrlKeyFlags = exports.HasAnyOfAltCtrlShiftKeyFlags = exports.blockBrowserAccelerators = exports.KeyFlags = exports.MouseButtons = exports.KeyCodes = exports.Keys = exports.ErrorHandling = exports.EncodingUtilities = exports.ElementRecyclerFactory = exports.DataListTextBox = exports.CssUtilities = exports.Control = exports.ContentControl = exports.ButtonHelpers = exports.Button = exports.Assert = void 0;
    Object.defineProperty(exports, "Assert", { enumerable: true, get: function () { return assert_19.Assert; } });
    Object.defineProperty(exports, "Button", { enumerable: true, get: function () { return button_2.Button; } });
    Object.defineProperty(exports, "ButtonHelpers", { enumerable: true, get: function () { return ButtonHelpers_1.ButtonHelpers; } });
    Object.defineProperty(exports, "ContentControl", { enumerable: true, get: function () { return contentControl_2.ContentControl; } });
    Object.defineProperty(exports, "Control", { enumerable: true, get: function () { return control_11.Control; } });
    Object.defineProperty(exports, "CssUtilities", { enumerable: true, get: function () { return CssUtilities_1.CssUtilities; } });
    Object.defineProperty(exports, "DataListTextBox", { enumerable: true, get: function () { return dataListTextBox_1.DataListTextBox; } });
    Object.defineProperty(exports, "ElementRecyclerFactory", { enumerable: true, get: function () { return ElementRecyclerFactory_1.ElementRecyclerFactory; } });
    Object.defineProperty(exports, "EncodingUtilities", { enumerable: true, get: function () { return encodingUtilities_1.EncodingUtilities; } });
    Object.defineProperty(exports, "ErrorHandling", { enumerable: true, get: function () { return errorHandling_2.ErrorHandling; } });
    Object.defineProperty(exports, "Keys", { enumerable: true, get: function () { return KeyCodes_18.Keys; } });
    Object.defineProperty(exports, "KeyCodes", { enumerable: true, get: function () { return KeyCodes_19.KeyCodes; } });
    Object.defineProperty(exports, "MouseButtons", { enumerable: true, get: function () { return KeyCodes_20.MouseButtons; } });
    Object.defineProperty(exports, "KeyFlags", { enumerable: true, get: function () { return KeyCodes_21.KeyFlags; } });
    Object.defineProperty(exports, "blockBrowserAccelerators", { enumerable: true, get: function () { return KeyCodes_22.blockBrowserAccelerators; } });
    Object.defineProperty(exports, "HasAnyOfAltCtrlShiftKeyFlags", { enumerable: true, get: function () { return KeyCodes_23.HasAnyOfAltCtrlShiftKeyFlags; } });
    Object.defineProperty(exports, "HasOnlyCtrlKeyFlags", { enumerable: true, get: function () { return KeyCodes_24.HasOnlyCtrlKeyFlags; } });
    Object.defineProperty(exports, "preventIEKeys", { enumerable: true, get: function () { return KeyCodes_25.preventIEKeys; } });
    Object.defineProperty(exports, "ListBoxItem", { enumerable: true, get: function () { return listBox_1.ListBoxItem; } });
    Object.defineProperty(exports, "ListBox", { enumerable: true, get: function () { return listBox_2.ListBox; } });
    Object.defineProperty(exports, "ListBoxItemContainer", { enumerable: true, get: function () { return listBox_3.ListBoxItemContainer; } });
    Object.defineProperty(exports, "PromiseHelper", { enumerable: true, get: function () { return PromiseHelper_6.PromiseHelper; } });
    Object.defineProperty(exports, "RadioButton", { enumerable: true, get: function () { return radioButton_1.RadioButton; } });
    Object.defineProperty(exports, "TabControl", { enumerable: true, get: function () { return TabControl_1.TabControl; } });
    Object.defineProperty(exports, "TabItem", { enumerable: true, get: function () { return TabItem_1.TabItem; } });
    Object.defineProperty(exports, "TemplateControl", { enumerable: true, get: function () { return templateControl_5.TemplateControl; } });
    Object.defineProperty(exports, "ToggleButton", { enumerable: true, get: function () { return toggleButton_1.ToggleButton; } });
    Object.defineProperty(exports, "ToolWindowHelpers", { enumerable: true, get: function () { return toolwindow_2.ToolWindowHelpers; } });
    exports.Controls = Controls;
    exports.Framework = Framework;
    exports.ListControl = ListControl;
    exports.ModelView = ModelView;
    exports.Templating = Templating;
});
//
// Copyright (C) Microsoft. All rights reserved.
//
// 
// Copyright (C) Microsoft. All rights reserved.
//
function $m(arg) {
    if (typeof arg === "string") {
        var matches = arg.match(/<(\w+?)>/);
        if (matches) {
            return new $mList("", document.createElement(matches[1]));
        }
        else {
            var list;
            list = document.querySelectorAll(arg);
            return new $mList(arg, list);
        }
    }
    // Assuming the arg is either a NodeList or an Element.
    return new $mList("", arg);
}
// 
// Copyright (C) Microsoft. All rights reserved.
//
// 
// Copyright (C) Microsoft. All rights reserved.
//
// A private class intended for use by the $m() factory function.
/// <disable code="SA1300" />
class $mList {
    constructor(selector, nodeListOrNode) {
        this.selector = selector;
        if (nodeListOrNode === null) {
            this._array = [];
        }
        else if (nodeListOrNode.length !== undefined) {
            this._array = [];
            var nodeList = nodeListOrNode;
            var len = nodeList.length;
            for (var i = 0; i < len; i++) {
                this._array.push(new $mNode(nodeList[i]));
            }
        }
        else {
            this._array = [new $mNode(nodeListOrNode)];
        }
    }
    get length() {
        return this._array.length;
    }
    is(s) {
        if (s === ":hidden") {
            // It is hidden if display is set to none on all things in the list
            for (var i = 0; i < this.length; i++) {
                if (!this._array[i].is(":hidden")) {
                    return false;
                }
            }
            return true;
        }
        if (s === ":visible") {
            return !this.is(":hidden");
        }
        throw "$mNode.is(s: string) : boolean - can only be called with :hidden or :visible";
    }
    scrollTop(value) {
        if (this.length === 0) {
            return;
        }
        return this._array[0].scrollTop();
    }
    scrollLeft(value) {
        if (this.length === 0) {
            return;
        }
        return this._array[0].scrollLeft();
    }
    data(key, value) {
        if (this.length === 0) {
            return;
        }
        return this._array[0].data(key, value);
    }
    attr(attributeName, setValue) {
        if (this.length === 0) {
            return;
        }
        if (setValue !== undefined) {
            for (var i = 0; i < this.length; i++) {
                this._array[i].setAttr(attributeName, setValue);
            }
            return this;
        }
        else {
            return this._array[0].attr(attributeName);
        }
    }
    removeAttr(attributeName) {
        for (var i = 0; i < this.length; i++) {
            this._array[i].removeAttr(attributeName);
        }
        return this;
    }
    matchAttr(attributeName, value) {
        // Non-mutating.  Returns a new $mList.
        var result = new $mList(this.selector + " → matchAttr", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var node = this._array[i];
            if (node.matchAttr(attributeName, value)) {
                result.push(node);
            }
        }
        return result;
    }
    addClass(className) {
        for (var i = 0; i < this.length; i++) {
            this._array[i].addClass(className);
        }
        return this;
    }
    removeClass(s) {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].removeClass(s);
        }
        return this;
    }
    hasClass(className) {
        for (var i = 0; i < this.length; i++) {
            if (this._array[i].hasClass(className)) {
                return true;
            }
        }
        return false;
    }
    hide() {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].hide();
        }
        return this;
    }
    show() {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].show();
        }
        return this;
    }
    placeholder(s) {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].placeholder(s);
        }
        return this;
    }
    focus() {
        if (this.length >= 1) {
            this._array[0].focus();
        }
        return this;
    }
    text(s) {
        if (s === undefined) {
            if (this.length > 0) {
                return this._array[0].text();
            }
            return;
        }
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].text(s);
        }
        return this;
    }
    html(htmlString) {
        if (htmlString === undefined) {
            if (this.length > 0) {
                return this._array[0].html();
            }
            return;
        }
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].html(htmlString);
        }
        return this;
    }
    each(fn) {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            fn.call(this._array[i].get(), i, this._array[i].get());
        }
    }
    parent(s) {
        // Non-mutating.  Returns a new $mList.
        if (s !== undefined) {
            if (!$mList.isClassSelector(s)) {
                return;
            }
            s = s.substr(1);
        }
        var result = new $mList(this.selector + " → parent", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var parent = this._array[i].parent(s);
            if (parent) {
                result.push(parent);
            }
        }
        return result;
    }
    parents(s) {
        // Non-mutating.  Returns a new $mList.
        if (!$mList.isClassSelector(s)) {
            return;
        }
        s = s.substr(1);
        var result = new $mList(this.selector + " → parents", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var subResult = this._array[i].parents(s);
            if (subResult && subResult.length) {
                for (var j = 0; j < subResult.length; j++) {
                    result.push(subResult[j]);
                }
            }
        }
        return result;
    }
    children(s) {
        // Non-mutating.  Returns a new $mList.
        if (s !== undefined) {
            if (!$mList.isClassSelector(s)) {
                return;
            }
            s = s.substr(1);
        }
        var result = new $mList(this.selector + " → children", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var element = this._array[i].get();
            var sibling = element.firstChild;
            while (sibling) {
                if (sibling.nodeType === 1) {
                    var node = new $mNode(sibling);
                    if (s === undefined || node.hasClass(s)) {
                        result.push(node);
                    }
                }
                sibling = sibling.nextSibling;
            }
        }
        return result;
    }
    siblings(s) {
        // Non-mutating.  Returns a new $mList.
        if (s !== undefined) {
            if (!$mList.isClassSelector(s)) {
                return;
            }
            s = s.substr(1);
        }
        var result = new $mList(this.selector + " → siblings", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var thisChild = this._array[i].get();
            var element = this._array[i].get().parentNode;
            var sibling = element.firstChild;
            while (sibling) {
                if (sibling.nodeType === 1 && sibling !== thisChild) {
                    var node = new $mNode(sibling);
                    if (s === undefined || node.hasClass(s)) {
                        result.push(node);
                    }
                }
                sibling = sibling.nextSibling;
            }
        }
        return result;
    }
    next(s) {
        // Non-mutating.  Returns a new $mList.
        if (s !== undefined) {
            if (!$mList.isClassSelector(s)) {
                return;
            }
            s = s.substr(1);
        }
        var result = new $mList(this.selector + " → next", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var child = this._array[i].get().nextSibling;
            while (child) {
                var node = new $mNode(child);
                if (s === undefined || node.hasClass(s)) {
                    result.push(node);
                    return result;
                }
                child = child.nextSibling;
            }
        }
        return result;
    }
    prev(s) {
        // Non-mutating.  Returns a new $mList.
        if (s !== undefined) {
            if (!$mList.isClassSelector(s)) {
                return;
            }
            s = s.substr(1);
        }
        var result = new $mList(this.selector + " → prev", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var child = this._array[i].get().previousSibling;
            while (child) {
                var node = new $mNode(child);
                if (s === undefined || node.hasClass(s)) {
                    result.push(node);
                    return result;
                }
                child = child.previousSibling;
            }
        }
        return result;
    }
    appendTo(item) {
        if (item.length === 1) {
            var len = this.length;
            var parent = item.get(0);
            for (var i = 0; i < len; i++) {
                parent.appendChild(this.get(i));
            }
        }
        return this;
    }
    after(item) {
        if (item.length > 0) {
            var len = this.length;
            for (var i = 0; i < len; i++) {
                var child = this.get(i);
                var parent = child.parentNode;
                if (child.nextSibling) {
                    for (var j = 0; j < item.length; j++) {
                        parent.insertBefore(item.get(j), child.nextSibling);
                    }
                }
                else {
                    for (var j = 0; j < item.length; j++) {
                        parent.appendChild(item.get(j));
                    }
                }
            }
        }
        return this;
    }
    not(s) {
        // Non-mutating.  Returns a new $mList.
        if (!$mList.isClassSelector(s)) {
            return;
        }
        s = s.substr(1);
        var result = new $mList(this.selector + " → not", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var node = this._array[i];
            if (!node.hasClass(s)) {
                result.push(node);
            }
        }
        return result;
    }
    slice(start, end) {
        // Non-mutating.  Returns a new $mList.
        var result = new $mList(this.selector + " → slice", null);
        var len = this.length;
        if (typeof end === "undefined" || end > len) {
            end = len;
        }
        for (var i = start; i < end; i++) {
            var node = this._array[i];
            result.push(node);
        }
        return result;
    }
    closest(s) {
        // Currently only supports looking for a class.
        var classes = s.split(/[ ,]+/);
        for (var classIndex = 0; classIndex < classes.length; classIndex++) {
            if (!$mList.isClassSelector(classes[classIndex])) {
                return;
            }
            classes[classIndex] = classes[classIndex].substr(1);
        }
        // Non-mutating.  Returns a new $mList.
        var result = new $mList(this.selector + " → closest", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var element = this._array[i].closest(classes);
            if (element) {
                result.push(element);
            }
        }
        return result;
    }
    find(subselector) {
        // The jQuery immediate children subselector is not supported...
        //   find("> div")
        // ... to find the immediate children that are <div> nodes.
        // If/when there is a use case for it, then it will need to be implemented.
        //
        // Non-mutating.  Returns a new $mList.
        var result = new $mList(this.selector + " → find", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var element = this._array[i].get();
            var nodeList = element.querySelectorAll(subselector);
            if (nodeList) {
                for (var j = 0, nodeListLen = nodeList.length; j < nodeListLen; j++) {
                    result.push(new $mNode(nodeList[j]));
                }
            }
        }
        return result;
    }
    remove() {
        // Non-mutating.  Returns an empty new $mList.
        var result = new $mList(this.selector + " → remove", null);
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].remove();
        }
        return result;
    }
    prepend(item) {
        if (item.length > 0) {
            var len = this.length;
            for (var i = 0; i < len; i++) {
                for (var j = item.length - 1; j >= 0; j--) {
                    this._array[i].prepend(item._array[j].get());
                }
            }
        }
        return this;
    }
    append(item) {
        if (item.length > 0) {
            var len = this.length;
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < item.length; j++) {
                    this._array[i].append(item._array[j].get());
                }
            }
        }
        return this;
    }
    appendText(s) {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            var child = this._array[i];
            child.append(document.createTextNode(s));
        }
        return this;
    }
    replaceWith(item) {
        var len = this.length;
        if (len > 0 && item.length === 1) {
            for (var i = 0; i < len; i++) {
                this._array[i].replaceWith(item._array[0]);
            }
        }
        return this;
    }
    select() {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].select();
        }
        return this;
    }
    val(s) {
        var len = this.length;
        if (s !== undefined) {
            for (var i = 0; i < len; i++) {
                this._array[i].val(s);
            }
            return this;
        }
        if (len === 0) {
            return;
        }
        return this._array[0].val(s);
    }
    css(keyOrMap, value) {
        var len = this.length;
        if (value !== undefined) {
            for (var i = 0; i < len; i++) {
                this._array[i].css(keyOrMap, value);
            }
            return this;
        }
        if (len === 0) {
            return;
        }
        return this._array[0].css(keyOrMap);
    }
    click() {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].click();
        }
        return this;
    }
    dblclick() {
        var len = this.length;
        for (var i = 0; i < len; i++) {
            this._array[i].dblclick();
        }
        return this;
    }
    bindTarget(target, events, fn, arg) {
        return this.changeBinding(target, true, events, fn, arg);
    }
    bind(events, fn, arg) {
        return this.changeBinding(undefined, true, events, fn, arg);
    }
    unbind(events, fn) {
        return this.changeBinding(undefined, false, events, fn);
    }
    trigger(events, extra) {
        var eventList = events.split(" ");
        var len = this.length;
        for (var i = 0; i < len; i++) {
            for (var j = 0; j < eventList.length; j++) {
                var event = eventList[j];
                if ($mList.DomEvents.indexOf(event) >= 0) {
                    this._array[i].triggerEvent(event, extra);
                }
                else {
                    this._array[i].triggerSpecial(event, extra);
                }
            }
        }
        return this;
    }
    get(n) {
        if (n < 0) {
            n = n + this.length;
        }
        if (n >= this.length || n < 0) {
            return null;
        }
        return this._array[n].get();
    }
    first() {
        // Non-mutating.  Returns a new $mList.
        var result = new $mList(this.selector + " → first", null);
        if (this.length > 0) {
            result.push(this._array[0]);
        }
        return result;
    }
    last() {
        // Non-mutating.  Returns a new $mList.
        var result = new $mList(this.selector + " → last", null);
        if (this.length > 0) {
            result.push(this._array[this.length - 1]);
        }
        return result;
    }
    position() {
        var len = this.length;
        if (len > 0) {
            return this._array[0].position();
        }
        return;
    }
    height() {
        var len = this.length;
        if (len > 0) {
            return this._array[0].height();
        }
        return;
    }
    outerHeight(includeMargin) {
        var len = this.length;
        if (len > 0) {
            return this._array[0].outerHeight(includeMargin);
        }
        return;
    }
    width() {
        var len = this.length;
        if (len > 0) {
            return this._array[0].width();
        }
        return;
    }
    outerWidth(includeMargin) {
        var len = this.length;
        if (len > 0) {
            return this._array[0].outerWidth(includeMargin);
        }
        return;
    }
    static isClassSelector(selector) {
        if (selector[0] !== ".") {
            // Only supports class names right now.
            return false;
        }
        if (selector.indexOf(",") !== -1) {
            // Only supports a single class names right now.
            return false;
        }
        if (selector.indexOf("#") !== -1) {
            // Does not support an id.
            return false;
        }
        if (selector.indexOf(">") !== -1) {
            // Does not support fancy selectors.
            return false;
        }
        if (selector.indexOf(" ") !== -1) {
            // Does not support fancy selectors.
            return false;
        }
        if (selector.indexOf("[") !== -1) {
            // Does not support fancy selectors.
            return false;
        }
        return true;
    }
    // For use by non-mutating methods that return a new $mList.
    push(mNode) {
        this._array.push(mNode);
    }
    changeBinding(target, isBind, events, fn, arg) {
        var eventList = events.split(" ");
        var len = this.length;
        for (var i = 0; i < len; i++) {
            for (var j = 0; j < eventList.length; j++) {
                var event = eventList[j];
                if ($mList.DomEvents.indexOf(event) >= 0) {
                    this._array[i].changeEventBinding(isBind, target, event, fn, arg);
                }
                else {
                    this._array[i].changeSpecialBinding(isBind, target, event, fn, arg);
                }
            }
        }
        return this;
    }
}
$mList.DomEvents = [
    // mouse events
    "click", "dblclick", "mousedown", "mouseup", "mousemove", "mouseover", "mouseout", "contextmenu",
    // focus events
    "focus", "blur", "focusin", "focusout",
    // keyboard events
    "keydown", "keyup", "keypress",
    // form events
    "change", "reset", "select", "submit"
];
// 
// Copyright (C) Microsoft. All rights reserved.
//
// A private class intended for use by the $m() factory function.  Albeit indirectly used by $m().
/// <disable code="SA1300" />
class $mNode {
    constructor(node) {
        this.length = 1;
        this._node = node;
    }
    get() {
        return this._node;
    }
    is(s) {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.is(s: string) : boolean - can only be called on HTML elements";
        }
        var element = this._node;
        if (s === ":hidden") {
            return element.style.display === "none";
        }
        else if (s === ":visible") {
            return element.style.display !== "none";
        }
        throw "$mNode.is(s: string) : boolean - can only be called with :hidden or :visible";
    }
    hide() {
        if (!(this._node instanceof HTMLElement) && !(this._node instanceof SVGElement)) {
            throw "$mNode.hide(): IQueryNode - can only be called on HTML or SVG elements";
        }
        var element = this._node;
        element.style.display = "none";
        return this;
    }
    show() {
        if (!(this._node instanceof HTMLElement) && !(this._node instanceof SVGElement)) {
            throw "$mNode.show(): IQueryNode - can only be called on HTML or SVG elements";
        }
        var element = this._node;
        element.style.display = "";
        var style = (element.ownerDocument).parentWindow.getComputedStyle(element);
        var display = style.display;
        if (display === "none") {
            element.style.display = "block";
        }
        return this;
    }
    placeholder(s) {
        if (!(this._node instanceof HTMLInputElement)) {
            throw "$mNode.placeholder(s: string): IQueryNode - can only be called on HTMLInput elements";
        }
        var element = this._node;
        element.placeholder = s;
        return this;
    }
    focus() {
        var element = this._node;
        element.focus();
        return this;
    }
    scrollTop(value) {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.scrollTop(value?: number): number - can only be called on HTML elements";
        }
        var element = this._node;
        if (value !== undefined) {
            return element.scrollTop;
        }
        element.scrollTop = value;
        return value;
    }
    addClass(className) {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.addClass(className: string) - can only be called on HTML elements";
        }
        var element = this._node;
        if (!element.classList.contains(className)) {
            element.classList.add(className);
        }
    }
    removeClass(className) {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.removeClass(className: string) - can only be called on HTML elements";
        }
        var element = this._node;
        if (element.classList.contains(className)) {
            element.classList.remove(className);
        }
    }
    hasClass(className) {
        if (!(this._node instanceof HTMLElement)) {
            return false;
        }
        var element = this._node;
        return element.classList && element.classList.contains(className);
    }
    scrollLeft(value) {
        if (!(this._node instanceof Element)) {
            throw "$mNode.scrollLeft(value?: number): number - can only be called on Elements";
        }
        var element = this._node;
        if (value !== undefined) {
            return element.scrollLeft;
        }
        element.scrollLeft = value;
        return value;
    }
    data(key, value) {
        var data = this._node[$mNode.DATA_KEY];
        if (!data) {
            this._node[$mNode.DATA_KEY] = data = {};
        }
        if (key === undefined) {
            return data;
        }
        if (value !== undefined) {
            data[key] = value;
        }
        else {
            return data[key];
        }
        return data;
    }
    attr(attributeName) {
        if (!(this._node instanceof Element)) {
            throw "$mNode.attr(attributeName: string): string - can only be called on Elements";
        }
        var element = this._node;
        var result = element[attributeName];
        if (result === undefined) {
            result = element.getAttribute(attributeName);
        }
        return result === null ? undefined : result;
    }
    removeAttr(attributeName) {
        if (!(this._node instanceof Element)) {
            throw "$mNode.removeAttr(attributeName: string): string - can only be called on Elements";
        }
        var element = this._node;
        element.removeAttribute(attributeName);
    }
    matchAttr(attributeName, value) {
        if (!(this._node instanceof Element)) {
            throw "$mNode.matchAttr(attributeName: string, value: string) - can only be called on Elements";
        }
        var element = this._node;
        return element.getAttribute(attributeName) === value;
    }
    setAttr(attributeName, setValue) {
        if (!(this._node instanceof Element)) {
            throw "$mNode.setAttr(attributeName: string, setValue: any): void - can only be called on Elements";
        }
        var element = this._node;
        element.setAttribute(attributeName, setValue);
    }
    parent(s) {
        if (!(this._node instanceof HTMLElement)) {
            return;
        }
        var parentNode = this._node.parentNode;
        return s === undefined || parentNode.classList.contains(s) ? new $mNode(parentNode) : undefined;
    }
    parents(s) {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.parents(s: string): IQueryNode - can only be called on HTML elements";
        }
        var node = this._node;
        var results = [];
        while (node.parentNode instanceof HTMLElement) {
            var node = node.parentNode;
            if (node.classList.contains(s)) {
                results.push(new $mNode(node));
            }
        }
        return results;
    }
    text(s) {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.text(s?: string): string - can only be called on HTML elements";
        }
        var element = this._node;
        if (s === undefined) {
            return element.innerText;
        }
        element.innerText = s;
        return s;
    }
    html(htmlString) {
        // CAUTION: no validation of the htmlString is performed.  Malformed html can cause issues.
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.html(htmlString?: string): string - can only be called on HTML elements";
        }
        var element = this._node;
        if (htmlString === undefined) {
            return element.innerHTML;
        }
        element.innerHTML = htmlString;
        return htmlString;
    }
    remove() {
        if (this._node.parentNode) {
            this._node.parentNode.removeChild(this._node);
        }
    }
    prepend(node) {
        this._node.insertBefore(node, this._node.firstChild);
    }
    append(node) {
        this._node.appendChild(node);
    }
    replaceWith(node) {
        var parent = this._node.parentNode;
        if (parent) {
            var nextSibling = this._node.nextSibling;
            parent.removeChild(this._node);
            var replacement = node._node;
            if (nextSibling) {
                parent.insertBefore(replacement, nextSibling);
            }
            else {
                parent.appendChild(replacement);
            }
        }
    }
    select() {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.select() - can only be called on HTML elements";
        }
        var element = this._node;
        element.select();
    }
    val(s) {
        if (!(this._node instanceof HTMLInputElement)) {
            throw "$mNode.val(): string - can only be called on HTMLInput elements";
        }
        var element = this._node;
        if (s === undefined) {
            var value = element.value;
            if (typeof value === "string") {
                return value.replace(/\r/g, "");
            }
            if (value === undefined || value === null) {
                return "";
            }
            return value;
        }
        element.value = s;
    }
    closest(classes) {
        var element = this._node;
        while (element) {
            if (element.classList) {
                for (var i = 0; i < classes.length; i++) {
                    if (element.classList.contains(classes[i])) {
                        return new $mNode(element);
                    }
                }
            }
            element = element.parentNode;
        }
    }
    css(keyOrMap, value) {
        if (keyOrMap && typeof keyOrMap === "object") {
            var map = keyOrMap;
            for (var key in map) {
                this.css(key, map[key]);
            }
        }
        else {
            var styleKey = keyOrMap;
            var element = this._node;
            if (value !== undefined) {
                element.style[styleKey] = value;
            }
            return element.style ? element.style[styleKey] : undefined;
        }
    }
    click() {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.click(): IQueryNode - can only be called on HTML elements";
        }
        var element = this._node;
        element.click();
        return this;
    }
    dblclick() {
        if (!(this._node instanceof HTMLElement)) {
            throw "$mNode.dblclick(): IQueryNode - can only be called on HTML elements";
        }
        var element = this._node;
        element.fireEvent("ondblclick");
    }
    changeEventBinding(isBind, target, event, fn, arg) {
        var element = this._node;
        var name = "on" + event;
        var oldBinding = element[name];
        var newBinding;
        var currentFuncs = oldBinding && oldBinding.boundFuncList ? oldBinding.boundFuncList : [];
        var index;
        if (isBind) {
            currentFuncs.push(fn);
        }
        else if (fn) {
            index = currentFuncs.indexOf(fn);
            if (index >= 0) {
                currentFuncs.splice(index, 1);
            }
        }
        else {
            currentFuncs = [];
        }
        if (currentFuncs.length) {
            if (target === undefined) {
                target = element;
            }
            newBinding = (e) => {
                var i;
                var bubble = true;
                e.target = target;
                for (i = 0; i < currentFuncs.length; i++) {
                    var result = currentFuncs[i].call(target, e, arg);
                    if (!result && typeof result === "boolean") {
                        e.preventDefault();
                        e.stopPropagation();
                        bubble = false;
                    }
                }
                return bubble;
            };
            newBinding.boundFuncList = currentFuncs;
        }
        element[name] = newBinding;
        return this;
    }
    triggerEvent(event, extra) {
        var element = this._node;
        var trigger = element[event];
        if (trigger) {
            trigger.call(element, {}, extra);
        }
        return this;
    }
    changeSpecialBinding(isBind, target, event, fn, arg) {
        var element = this._node;
        var key = $mNode.BINDING_KEY + event;
        element[key] = isBind ? fn : undefined;
        return this;
    }
    triggerSpecial(event, extra) {
        var element = this._node;
        var key = $mNode.BINDING_KEY + event;
        var trigger = element[key];
        if (trigger) {
            trigger.call(element, {}, extra);
        }
        return this;
    }
    position() {
        var element = this._node;
        var position = {
            top: element.offsetTop,
            left: element.offsetLeft
        };
        return position;
    }
    height() {
        var element = this._node;
        // bounding client rect includes padding and border, but not margin
        var height = element.getBoundingClientRect().height;
        var compStyle = window.getComputedStyle(element, null);
        height -= parseInt(compStyle.paddingTop, 10);
        height -= parseInt(compStyle.paddingBottom, 10);
        height -= parseInt(compStyle.borderTopWidth, 10);
        height -= parseInt(compStyle.borderBottomWidth, 10);
        return height;
    }
    outerHeight(includeMargin) {
        var element = this._node;
        // bounding client rect includes padding and border, but not margin
        var outerHeight = element.getBoundingClientRect().height;
        if (includeMargin) {
            var compStyle = window.getComputedStyle(element, null);
            outerHeight += parseInt(compStyle.marginTop, 10);
            outerHeight += parseInt(compStyle.marginBottom, 10);
        }
        return outerHeight;
    }
    width() {
        var element = this._node;
        // bounding client rect includes padding and border, but not margin
        var width = element.getBoundingClientRect().width;
        var compStyle = window.getComputedStyle(element, null);
        width -= parseInt(compStyle.paddingLeft, 10);
        width -= parseInt(compStyle.paddingRight, 10);
        width -= parseInt(compStyle.borderLeftWidth, 10);
        width -= parseInt(compStyle.borderRightWidth, 10);
        return width;
    }
    outerWidth(includeMargin) {
        var element = this._node;
        // bounding client rect includes padding and border, but not margin
        var outerWidth = element.getBoundingClientRect().width;
        if (includeMargin) {
            var compStyle = window.getComputedStyle(element, null);
            outerWidth += parseInt(compStyle.marginLeft, 10);
            outerWidth += parseInt(compStyle.marginRight, 10);
        }
        return outerWidth;
    }
}
/// <enable code="SA1300" />
$mNode.BINDING_KEY = "$BPT$Binding$";
$mNode.DATA_KEY = "$BPT$QueryData$";
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
    class Common {
    }
    Common.defaultButtonTemplate = "\
<div class=\"BPT-button\" tabindex=\"1\"></div>\
";
    Common.iconButton24x24 = "\
<div class=\"BPT-button iconButton24x24\" tabindex=\"1\"><span class=\"buttonIcon\"></span></div>\
";
    Common.menuButton33x24 = "\
<div class=\"BPT-button menuButton33x24\" tabindex=\"1\"><span class=\"buttonIcon\"></span></div>\
";
    Common.menuButton33x24x5 = "\
<div class=\"BPT-button menuButton33x24 imageStates5\" tabindex=\"1\"><span class=\"buttonIcon\"></span></div>\
";
    Common.iconButton = "\
<div class=\"BPT-button iconButton\" tabindex=\"1\"><span class=\"buttonIcon\"></span></div>\
";
    Common.labeledIconButton = "\
<div class=\"BPT-button labeledIconButton\" tabindex=\"1\">\
            <span class=\"buttonIcon\"></span>\
            <span class=\"buttonText\" data-controlbinding=\"innerText:content\"></span>\
        </div>\
";
    Common.defaultToolbarTemplate = "\
<div class=\"BPT-Toolbar\" role=\"toolbar\">\
            <div class=\"BPT-ToolbarContents\">\
                <span class=\"BPT-ToolTitle\" data-controlbinding=\"innerText:title,                                            attr-aria-label:title\"></span>\
                <div data-name=\"_toolbarPanel\" data-control=\"Common.TemplateControl\" data-controlbinding=\"model:model,                                           templateId:panelTemplateId\" data-options=\"className:buttons\"></div>\
            </div>\
        </div>\
";
    Common.toolbarTemplateWithSearchBox = "\
<div class=\"BPT-Toolbar\" role=\"toolbar\">\
            <div class=\"BPT-ToolbarContents\">\
                <span class=\"BPT-ToolTitle\" data-controlbinding=\"innerText:title,                                            attr-aria-label:title\"></span>\
                <div data-name=\"_toolbarPanel\" data-control=\"Common.TemplateControl\" data-controlbinding=\"model:model,                                           templateId:panelTemplateId\" data-options=\"className:buttons\"></div>\
                <div id=\"searchBoxBorder\" class=\"BPT-SearchBox-Border\">\
                    <input type=\"text\" id=\"searchbox\" class=\"BPT-SearchBox\" tabindex=\"1\" role=\"search\" />\
                    <div id=\"searchPreviousResult\" class=\"BPT-Search-Button\" role=\"button\" tabindex=\"1\">\
                        <div class=\"BPT-Search-Previous\"></div>\
                    </div>\
                    <div id=\"searchNextResult\" class=\"BPT-Search-Button\" role=\"button\" tabindex=\"1\">\
                        <div class=\"BPT-Search-Next\"></div>\
                    </div>\
                </div>\
            </div>\
        </div>\
";
    Common.menuControlTemplate = "\
<div class=\"BPT-menuControl\" role=\"menu\">\
            <div data-control=\"Common.TemplateControl\" data-controlbinding=\"model:model,                                       templateId:menuItemsTemplateId\" data-options=\"className:BPT-menuContent\"></div>\
        </div>\
";
    Common.menuItemTemplate = "\
<li class=\"menuItem\" role=\"menuitem\" tabindex=\"0\" data-controlbinding=\"attr-aria-label:tooltip,                                   attr-data-plugin-vs-tooltip:tooltip\">\
            <div class=\"gutter\"></div>\
            <span data-controlbinding=\"innerText:content,                                        attr-aria-label:content\"></span>\
        </li>\
";
    Common.menuItemCheckMarkTemplate = "\
<li class=\"menuItem\" role=\"menuitemcheckbox\" tabindex=\"0\" data-controlbinding=\"attr-aria-label:tooltip,                                   attr-data-plugin-vs-tooltip:tooltip\">\
            <img class=\"menuToggleItem gutter\" data-options=\"src:plugin-menu-item-checkmark; converter=Common.CommonConverters.ThemedImageConverter\" />\
            <span data-controlbinding=\"innerText:content,                                        attr-aria-label:content\"></span>\
        </li>\
";
    Common.menuItemCheckBoxTemplate = "\
<li class=\"menuItem\" role=\"menuitemcheckbox\" tabindex=\"0\" data-controlbinding=\"attr-aria-label:tooltip,                                   attr-data-plugin-vs-tooltip:tooltip\">\
            <input type=\"checkbox\" tabindex=\"-1\" data-name=\"BPT-menuItemCheckBox\" data-controlbinding=\"checked:isChecked; mode=twoway\" />\
            <span data-controlbinding=\"innerText:content,                                        attr-aria-label:content\"></span>\
        </li>\
";
    Common.menuItemComboBoxTemplate = "\
<li class=\"menuItem comboBoxMenuItem\" role=\"menuitem\" tabindex=\"-1\">\
            <div data-control=\"Common.Controls.ComboBox\" data-name=\"BPT-menuItemComboBox\" data-controlbinding=\"items:items,                                      selectedValue:selectedValue; mode=twoway,                                      tooltip:tooltip\" data-options=\"tabIndex:0\"></div>\
        </li>\
";
    Common.menuItemTextBoxTemplate = "\
<li class=\"menuItem textBoxMenuItem\" role=\"menuitem\" tabindex=\"-1\">\
            <div data-control=\"Common.Controls.TextBox\" data-name=\"BPT-menuItemTextBox\" data-controlbinding=\"isEnabled:isEnabled,                                      placeholder:placeholder,                                      text:content; mode=twoway,                                      tooltip:tooltip\" data-options=\"clearOnEscape:1,                               tabIndex:0,                               updateOnInput:1\"></div>\
        </li>\
";
    Common.defaultComboBoxTemplate = "\
<select data-controlbinding=\"value:selectedValue; mode=twoway\"></select>\
";
    Common.defaultComboBoxItemTemplate = "\
<option data-binding=\"attr-aria-label:label,                               attr-data-plugin-vs-tooltip:tooltip,                               title:tooltip,                               text:text,                               value:value\"></option>\
";
    Common.defaultTextBoxTemplate = "\
<input type=\"text\" class=\"BPT-TextBox\" data-controlbinding=\"attr-data-plugin-vs-tooltip:tooltip,                                     value:text; mode=twoway,                                     placeholder:placeholder\" />\
";
    Common.stackPanelTemplate = "\
<div class=\"BPT-stackPanel\">\
            <div id=\"contentSizer\" class=\"BPT-contentSizer\"></div>\
            <div id=\"content\"></div>\
        </div>\
";
    ControlTemplates.Common = Common;
})(ControlTemplates || (ControlTemplates = {}));
//# sourceMappingURL=Bpt.Diagnostics.CommonMerged.js.map
// SIG // Begin signature block
// SIG // MIIoQQYJKoZIhvcNAQcCoIIoMjCCKC4CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // FjYYoNyC0gHiQE4qNT8xxeO1smUDlz0u8LzUpo6ApTqg
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
// SIG // DQEJBDEiBCCu5L2a52ViitRC7OxpfpthIKe2ntp/5WXH
// SIG // z2eGTMr/UTBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAA0p1Vu2
// SIG // y+LuldXFnvsFgI5xg4aQhjnBYvMu5PpvmfvcDK6AH9Ag
// SIG // oUtqZt5J73mlR6YfUc+0weyjtf7dIfIYtblXap+w+wCE
// SIG // 4rxrNHHj+VhVN9zN0GH7O97HwkqcAgX2wfHP42d4nvEH
// SIG // UV3SeB6ZUfcT1w+d06Z81rsO7EsUh2ehZeEbRvbSXm/p
// SIG // e+kmuJZNaOiDiZhecudLV5Qx4puzeCI34XxJRChxdIIQ
// SIG // +tJum3GVvG2sXcxgTrvQk5wHbPFZsr012NuwB/292sky
// SIG // RQow+cH+TqFpkyYzeLKECGdm9yQNsZ/ENaPusKHb2IjA
// SIG // MMPrm1JsZw/PV0QGc3vwT4CmDqehghetMIIXqQYKKwYB
// SIG // BAGCNwMDATGCF5kwgheVBgkqhkiG9w0BBwKggheGMIIX
// SIG // ggIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBWgYLKoZIhvcN
// SIG // AQkQAQSgggFJBIIBRTCCAUECAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQg1xR1JfMRPd3gX0l1epoa
// SIG // w9E1hDxtMGyo9xZg5H9RaBkCBmditL4fYBgTMjAyNTAx
// SIG // MTYxODEzMzEuNzAxWjAEgAIB9KCB2aSB1jCB0zELMAkG
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
// SIG // AQkQAQQwLwYJKoZIhvcNAQkEMSIEIJ/jkK2XCJXSSjO3
// SIG // /jsgU3epJhmU6XGxGtRvm5jplPk6MIH6BgsqhkiG9w0B
// SIG // CRACLzGB6jCB5zCB5DCBvQQgIdqY2mt3GtHnGLobutLm
// SIG // Bz/yCpz23nW1UCeUqCB+WeIwgZgwgYCkfjB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAfdYIHUEyvvC
// SIG // 9AABAAAB9zAiBCCH/+BLGLc3kC4/KBT2gfF5ia62piIR
// SIG // zFvbdqk+IGySCDANBgkqhkiG9w0BAQsFAASCAgBp5KDk
// SIG // G9fqFrzH09Ac0YFTrfOXnvemCw/+vFx0oB1H+P+6rpyd
// SIG // qvMv3P5GiTmW48PzIa3ZGynzjhwCEP0OAX653YeyMM2A
// SIG // 9gXiePayK3C/xpguaoayKnBPuFH+In8eEmr4cZV/E/ax
// SIG // QTODb7xzP4sOZf5Y4ahbTADT4NCuTD2Vvn8rQT05aGnQ
// SIG // kMqaKNT8l2GGY2QjiKewKY5K41lo4dqin7zdpoVrStE6
// SIG // xsw2HGVTUDvCkexBeeWttls/ctFZg0K5V9Ioep07qLAm
// SIG // EHZF3bgs1mXZwhglinrbv6iesFBtPXtvihCi88x9UvKu
// SIG // tvQPXjvCY7p9w7rgxW/etog4SIJdxulJhLkyB4RxrH/d
// SIG // JMGdZoKKsiqJfu3tA5T4S4soURCHbmJ216nTRkSlEFy9
// SIG // Swz0xNPpQT07dMdsxHQh7eY/f2dYOapEVWZitZiJs1IJ
// SIG // l3dlcuFvvHFs8T1SoJvo14m4ahPuG9+SFwxzBKBVlRMU
// SIG // fmT2Z+F5F5rACdAEAGJKELxS+FTkZ50CYuzsr1QSq0Oe
// SIG // LWFIU7LyomPzUxdyoH+bAo9G01jFgO32+FK87gObLZ5z
// SIG // /80LS1qdmMgBF4HN9XbEAtMS8IxemjLp6RivGiAsyLEc
// SIG // 0Fz0sijv2iHuAew5wKbv31h5M3STuYUEUgfqxoJL4r4r
// SIG // DwybaKlC7v8spii/Sg==
// SIG // End signature block
