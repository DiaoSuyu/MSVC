// 
// Copyright (C) Microsoft. All rights reserved.
//
define("DataUtilities", ["require", "exports"], function (require, exports) {
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
define("GraphResources", ["require", "exports", "plugin-vs-v2"], function (require, exports, Plugin) {
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
// Expose our AMD swimlane module to the global object
window.define("hubGraphs", ["StackedBarGraph"], (factoryModule) => {
    window.VisualProfiler = {
        Graphs: {
            StackedBarGraph: factoryModule.StackedBarGraph
        }
    };
});
// 
// Copyright (C) Microsoft. All rights reserved.
//
define("StackedBarChart", ["require", "exports", "plugin-vs-v2", "diagnosticsHub-swimlanes", "diagnosticsHub"], function (require, exports, Plugin, DiagnosticsHubSwimlanes, diagnosticsHub_1) {
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
                StackedBarChartPresenter._logger = diagnosticsHub_1.getLogger();
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
define("StackedBarGraph", ["require", "exports", "plugin-vs-v2", "diagnosticsHub", "diagnosticsHub-swimlanes", "StackedBarChart", "GraphResources", "DataUtilities"], function (require, exports, Plugin, DiagnosticsHub, DiagnosticsHubSwimlanes, StackedBarChart_1, GraphResources_1, DataUtilities_1) {
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
                    return DataUtilities_1.DataUtilities.getFilteredResult(dataWarehouse, this._dataSource.AnalyzerId, this._dataSource.CounterId, timeRange, {
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
//# sourceMappingURL=HubGraphs.js.map
// SIG // Begin signature block
// SIG // MIIoNwYJKoZIhvcNAQcCoIIoKDCCKCQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // 641vVHlb4/vY2h5xds9l7atdZrb1y+UXsvsNihCuLsKg
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
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCCJ4E6mqTvJEBjF
// SIG // VsquATlYKqf0io/gbYlKrC8f3JuTYDBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAATNrKX/diEriUMpdPfXYzyCSwQ7aMUK
// SIG // jTsy3VY1YI2mdNWszKOd/rgsf0gMhcn4khOBw9aBmr+b
// SIG // pSeohvbp/tgEbs/v0+l7zcRD4fdq2kl1ehZAkY82DXkl
// SIG // AY6VXjbr4gxlvzH4HffCjHupwIe87V6sLzk/hRnkPqb3
// SIG // 5iUDC0RwdE6s+8UXm4wAfB2ucJj1BTERKRke1oKMxbJE
// SIG // HFrI4fzRZYwbSMv4AVx0RMCBWeiZQe3EKT+vgYHKmbnO
// SIG // 81TLsnzrihUH7/lsHAZwkkA2PMqn8C95EkBnFrz5vWvl
// SIG // kHhHzpZrr6AgCbJEA+8aYwyTKDCxXC5NwyDo52waOSo3
// SIG // qAqhgheUMIIXkAYKKwYBBAGCNwMDATGCF4Awghd8Bgkq
// SIG // hkiG9w0BBwKgghdtMIIXaQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // EjscgbMJ/Zeammbwr8HS9rioC3lq2Id2xZp6qFRRGoUC
// SIG // Bmda3pASVRgTMjAyNTAxMTYxODEzMzIuNTA5WjAEgAIB
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
// SIG // hkiG9w0BCQQxIgQgqDGcCblxO3OEFGCPdz8A8vRfVCQV
// SIG // YoN7Gmn8oE2C70IwgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCAYvNk0i7bhuFZKfMAZiZP0/kQIfONbBv2g
// SIG // zsMYOjti6DCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAAB88UKQ64DzB0xAAEAAAHzMCIE
// SIG // ILeCFIlUoPKNJWTyz/lqn5nKgLQieBGiq1Xt1RARQEaj
// SIG // MA0GCSqGSIb3DQEBCwUABIICAAmAWFHnlpD8LTZr0w40
// SIG // LHCSuBOjmuXBJX41A3hs21mGTrbBiMwyuq/PKrpjdxhS
// SIG // iYacbutoOGCawexzRqgKBr6LWecgKULfRGLfWWVuaz2t
// SIG // x7D5NjW/HneUmw6xtrn3lGLkU15TevD+4v0NmrCDLIaK
// SIG // 5dM/VCo9ic8oudZxk+yjFSHqNDXDHHNm/C4RmmL/cLdl
// SIG // zJWFlp+ekguzgJFG/3EkIavVLKYFAmlpx1c6BnuyaSkh
// SIG // LXATQMXXz5fDz+vRF3r5sBwLZiNAgcW/bktE05JA9qmi
// SIG // KEdM+dgpnl1h0uVHe6KeJgGB/OU4hs1di1D4yb8BoOjN
// SIG // 4btxGsNosnBjgZEbt6Di/+rw6KpBx9rMD6OJh4mAJp/O
// SIG // VMKryhvFlV18w1Bkls3rPYI8ilaFcYXku41cmQEC/+zJ
// SIG // B6n+kCwFPHtQKk+J7AzIVbU+BEMGVKy3nO0sFfXZjFKZ
// SIG // Ptv793tHJiK9YJbiZa4lPY8HPnQPBlnHKuScaldfuB/m
// SIG // iMZOfXjiO41GpK+IzSuuDMdfyKw7lM8cYMDX1mRBtrBE
// SIG // Tg4oGNzmE8Hj8tp7hwWuNvrlMP/oD/aeQylKm4XIHi7f
// SIG // h81pRAoJs395sThgHep2RMrs01POLVxwMPazMTqxXpnG
// SIG // mi9daWnbhazRaZxvCf7qfm9g3VrhjM+EpMyYfrgXYCuF
// SIG // t279
// SIG // End signature block
