let pluginUrl = window.chrome.webview.hostObjects.sync.external.GetPluginUrl();
let scripts = [pluginUrl, "Scripts/knockout-3.4.0.js", "Scripts/F1Viz.js"];
let currentScriptElement = document.querySelector("script[src='Scripts/index.js']");

let onLoaded = function() {
    const plugin = require("plugin-vs-v2");
    plugin.Messaging.addEventListener("pluginready", pluginLoaded);
    ko.options.deferUpdates = true;

    function pluginLoaded() {
        plugin.Tooltip.defaultTooltipContentToHTML = false;
        // We disable zooming via the mouse scroll since it is not a standard VS interaction.
        // Zooming also breaks the placement of floating windows such as context menus
        plugin.HotKeys.setZoomState(false);
        
        requirejs.config({
            shim: {
                "knockout": {
                    exports: "ko"
                }
            }
        });
        
        require("ViewModels/MainViewModel");
    }
};

for (let index = 0; index < scripts.length; index++) {
    const element = scripts[index];

    let newScriptElement = document.createElement("script");
    newScriptElement.setAttribute("src", element);
    newScriptElement.setAttribute("type", "text/javascript");
    newScriptElement.async = false;
    
    if (index === scripts.length - 1) {
        newScriptElement.onload = onLoaded;
    }

    currentScriptElement.parentNode.insertBefore(newScriptElement, currentScriptElement.nextSibling);
    currentScriptElement = newScriptElement;
}