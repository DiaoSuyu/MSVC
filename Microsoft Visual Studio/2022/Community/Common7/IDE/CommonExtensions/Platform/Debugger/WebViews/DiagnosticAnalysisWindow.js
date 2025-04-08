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
define("CustomBindings", ["require", "exports", "knockout"], function (require, exports, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckedState = void 0;
    class CheckedState {
    }
    exports.CheckedState = CheckedState;
    CheckedState.Unchecked = false;
    CheckedState.Checked = true;
    CheckedState.Indeterminate = null;
    ko.bindingHandlers["checkedState"] = {
        init(element, valueAccessor, allBindingsAccessor) {
            if (element.type !== "checkbox") {
                return;
            }
            element.indeterminate = false;
            var onCheckBoxClicked = () => {
                let modelValue = valueAccessor();
                modelValue(element.checked);
                return false;
            };
            var updateCheckboxView = () => {
                let modelValue = valueAccessor();
                let value = modelValue();
                if (value !== element.checked) {
                    element.checked = modelValue();
                }
                element.indeterminate = (value === CheckedState.Indeterminate);
            };
            ko.utils.registerEventHandler(element, "click", onCheckBoxClicked);
            ko.computed(updateCheckboxView, null, { disposeWhenNodeIsRemoved: element });
        }
    };
    ko.bindingHandlers["ariaCheckedState"] = {
        update(element, valueAccessor) {
            let value = ko.utils.unwrapObservable(valueAccessor());
            let ariaChecked = "false";
            if (value) {
                ariaChecked = "true";
            }
            else if (value === CheckedState.Indeterminate) {
                ariaChecked = "mixed";
            }
            element.setAttribute("aria-checked", ariaChecked);
        }
    };
    ko.bindingHandlers["data-columnid"] = {
        update(element, valueAccessor) {
            const value = ko.utils.unwrapObservable(valueAccessor());
            element.setAttribute("data-columnid", value);
        }
    };
    ko.bindingHandlers["id"] = {
        update(element, valueAccessor) {
            const value = ko.utils.unwrapObservable(valueAccessor());
            element.setAttribute("id", value);
        }
    };
});
define("Constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Constants = void 0;
    class Constants {
    }
    exports.Constants = Constants;
    Constants.EnterKeyCode = 13;
    Constants.SpaceKeyCode = 32;
    Constants.LeftClickCode = 1;
    Constants.RightClickCode = 3;
    Constants.CtrlKeyCode = 17;
    Constants.CKeyCode = 67;
    Constants.RoslynAnalyzerId = "2F9CD6E6-C93F-4020-ACFD-C85AE0C551B9";
    Constants.GridColumnIdPrefix = "col_";
});
define("AnalysisResult", ["require", "exports", "Analysis", "plugin-vs-v2"], function (require, exports, Analysis_1, plugin) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createAnalysisResult = exports.AnalysisResult = exports.AnalysisDescriptor = void 0;
    class AnalysisDescriptor {
    }
    exports.AnalysisDescriptor = AnalysisDescriptor;
    class AnalysisResult {
        constructor(results, analyzerId, analyzerName, window, uniqueProcessId) {
            this.uniqueProcessId = uniqueProcessId;
            this.detailedResult = results;
            this.analyzerId = analyzerId;
            this.analyzerName = analyzerName;
            this.diagnosticAnalysisWindow = window;
        }
        get errorCode() { return this.detailedResult.errorCode; }
        get errorName() {
            if (this.detailedResult.shortDescription) {
                return this.detailedResult.shortDescription;
            }
            return plugin.Resources.getString("UnnamedError");
        }
        get severity() {
            return this.detailedResult.severity;
        }
        get sortWeight() {
            return Analysis_1.WeightedSeverities[this.severity];
        }
    }
    exports.AnalysisResult = AnalysisResult;
    function createAnalysisResult(resultJson, DiagnosticAnalysisWindow) {
        let translatedResults = JSON.parse(resultJson.DetailedTranslatedResult);
        let analyzerId = resultJson.AnalyzerId;
        let analyzerName = resultJson.AnalyzerName;
        let uniqueProcessId = resultJson.UniqueProcessId;
        return new AnalysisResult(translatedResults, analyzerId, analyzerName, DiagnosticAnalysisWindow, uniqueProcessId);
    }
    exports.createAnalysisResult = createAnalysisResult;
});
define("AnalyzerRowViewModel", ["require", "exports", "CustomBindings", "Constants", "knockout"], function (require, exports, CustomBindings_1, Constants_1, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnalyzerRowViewModel = void 0;
    class AnalyzerRowViewModel {
        constructor(parentVM, rowId, name, expandable, uniqueId, showDecompilationWarning, diagnosticAnalysisViewer) {
            this._selected = ko.observable(false);
            this._expanded = ko.observable(false);
            this._children = ko.observableArray([]);
            this._hasFocus = ko.observable(false);
            this._arrowVisibility = ko.observable("visible");
            this._checkedState = ko.observable(CustomBindings_1.CheckedState.Checked);
            this._rowId = rowId;
            this._name = name;
            this._showDecompilationWarning = showDecompilationWarning;
            this._expandable = expandable;
            this._uniqueId = uniqueId;
            this._parentVM = parentVM;
            this._adaptor = diagnosticAnalysisViewer.adaptor;
            if (!expandable) {
                this._arrowVisibility("hidden");
            }
        }
        get expandable() { return this._expandable; }
        get checkedState() { return this._checkedState; }
        get arrowVisibility() { return this._arrowVisibility; }
        get uniqueId() { return this._uniqueId; }
        onCheckboxClick(viewModel, event) {
            if (event.which !== Constants_1.Constants.LeftClickCode) {
                return true;
            }
            let checkbox = event.currentTarget;
            event.stopPropagation();
            this._parentVM.onClick(this._parentVM, event);
            if (this._showDecompilationWarning && checkbox.checked) {
                this._adaptor._call("ShowDecompilationWarningAsync").then(function (result) {
                    if (!result) {
                        checkbox.checked = false;
                    }
                });
            }
            return true;
        }
        get name() {
            return this._name;
        }
        expand() {
            var dataLoadPromise = Promise.resolve().then(() => {
                this._expanded(!this._expanded());
                let e = document.createEvent('Event');
                e.initEvent("resize", true, true);
                document.getElementById("analyzerList").dispatchEvent(e);
            });
            return dataLoadPromise;
        }
        toggleCheckedState() {
            if (this.checkedState() === CustomBindings_1.CheckedState.Unchecked) {
                this.checkedState(CustomBindings_1.CheckedState.Checked);
            }
            else {
                this.checkedState(CustomBindings_1.CheckedState.Unchecked);
            }
        }
        get depth() {
            if (this.expandable) {
                return 0;
            }
            return 1;
        }
        get selected() {
            return this._selected;
        }
        get hasFocus() {
            return this._hasFocus;
        }
        get expanded() {
            return this._expanded;
        }
        get templateName() {
            return "AnalyzerListRowTemplate";
        }
        get id() {
            return this._rowId;
        }
        get children() {
            return this._children;
        }
        invoke() {
        }
    }
    exports.AnalyzerRowViewModel = AnalyzerRowViewModel;
});
define("AnalyzerTreeGridDAO", ["require", "exports", "CustomBindings", "Constants", "AnalyzerRowViewModel"], function (require, exports, CustomBindings_2, Constants_2, arvm) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnalyzerTreeGridDAO = void 0;
    class AnalyzerTreeGridDAO {
        constructor(analyzerListVM, diagnosticAnalysisViewer) {
            this._analyses = null;
            this._updating = false;
            this._analyzerListVM = analyzerListVM;
            this._diagnosticAnalysisViewer = diagnosticAnalysisViewer;
        }
        updateTreeRows(analysisList) {
            this._analyses = analysisList;
        }
        get defaultSortColumnId() {
            return "name";
        }
        get analyses() {
            return this._analyses;
        }
        get analyzerListVM() { return this._analyzerListVM; }
        getRoots(resultId, sortInfo) {
            let continuation = (analysisList) => {
                let rows = [];
                let analysisSet = {};
                let rowId = 0;
                for (let analysis of analysisList) {
                    if (!analysis.AnalyzerId) {
                        continue;
                    }
                    let id = analysis.AnalyzerId.toUpperCase();
                    if (!analysisSet[id]) {
                        analysisSet[id] = true;
                        let showDecompilationWarning = (id === Constants_2.Constants.RoslynAnalyzerId);
                        let vm = new arvm.AnalyzerRowViewModel(this._analyzerListVM.analyzerList, rowId++, analysis.AnalyzerName, true, id, showDecompilationWarning, this._diagnosticAnalysisViewer);
                        vm.checkedState.subscribe((newValue) => { this.updateCheckedState(newValue, vm, null); });
                        rows.push(vm);
                    }
                }
                return rows;
            };
            return Promise.resolve(this._analyses).then(continuation);
        }
        expand(row, sortInfo) {
            let vmr = row;
            return this.loadChildren(vmr).then(() => vmr.expand());
        }
        search(query, isCaseSensitive, isRegex, isForward, startingRow, sortInfo) {
            throw new Error("Method not implemented.");
        }
        sort(roots, sortInfo) {
            return Promise.resolve(roots);
        }
        loadChildren(vmr) {
            return Promise.resolve().then(() => {
                if (vmr.children().length == 0) {
                    let rows = [];
                    let rowId = 0;
                    for (let analysis of this._analyses) {
                        if (!analysis.AnalyzerId) {
                            continue;
                        }
                        let id = analysis.AnalyzerId.toUpperCase();
                        if (id === vmr.uniqueId) {
                            let showDecompilationWarning = (id === Constants_2.Constants.RoslynAnalyzerId);
                            let vm = new arvm.AnalyzerRowViewModel(this._analyzerListVM.analyzerList, rowId++, analysis.AnalysisName, false, analysis.AnalysisId, showDecompilationWarning, this._diagnosticAnalysisViewer);
                            vm.checkedState.subscribe(async (newValue) => { await this.updateCheckedState(newValue, vm, vmr); });
                            rows.push(vm);
                        }
                    }
                    vmr.children(rows);
                }
            });
        }
        async updateCheckedState(newValue, viewModel, parentViewModel) {
            if (this._updating) {
                return;
            }
            this._updating = true;
            if (!parentViewModel) {
                await this.loadChildren(viewModel);
                if (newValue !== CustomBindings_2.CheckedState.Indeterminate) {
                    for (let child of viewModel.children()) {
                        let childVm = child;
                        childVm.checkedState(newValue);
                    }
                }
            }
            else {
                let children = parentViewModel.children();
                if (children.length > 0) {
                    let child = children[0];
                    let state = child.checkedState();
                    for (let i = 1; i < children.length; ++i) {
                        child = children[i];
                        if (child.checkedState() !== state) {
                            state = CustomBindings_2.CheckedState.Indeterminate;
                            break;
                        }
                    }
                    parentViewModel.checkedState(state);
                }
            }
            this._updating = false;
        }
    }
    exports.AnalyzerTreeGridDAO = AnalyzerTreeGridDAO;
});
define("AnalyzerListColumnSettingsProvider", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnalyzerListColumnSettingsProvider = void 0;
    class AnalyzerListColumnSettingsProvider {
        getColumnSettings() {
            return Promise.resolve([
                { columnId: "name", isHidden: false, width: 250 }
            ]);
        }
        onColumnChanged(column) {
        }
    }
    exports.AnalyzerListColumnSettingsProvider = AnalyzerListColumnSettingsProvider;
});
define("AnalyzerListViewModel", ["require", "exports", "diagnosticsHub-ui", "AnalyzerTreeGridDAO", "AnalyzerListColumnSettingsProvider", "CustomBindings", "plugin-vs-v2", "knockout"], function (require, exports, diagnosticsHub_ui_1, AnalyzerTreeGridDAO_1, AnalyzerListColumnSettingsProvider_1, CustomBindings_3, plugin, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnalyzerListViewModel = exports.CheckBoxTreeGridViewModel = void 0;
    class CheckBoxTreeGridViewModel extends diagnosticsHub_ui_1.TreeGridViewModel {
        constructor(dao, header, ariaLabel) {
            super(dao, header, ariaLabel);
            this._atgDao = dao;
        }
        onKeyDown(viewModel, event) {
            let row = this.focusedRow();
            if (row) {
                let expandState = row.expanded();
                switch (event.key) {
                    case " ":
                        row.toggleCheckedState();
                        return false;
                    case "ArrowRight":
                        expandState = !expandState;
                    case "ArrowLeft":
                        if (row.expandable && expandState) {
                            this._atgDao.expand(row, null);
                            return false;
                        }
                        break;
                }
            }
            return super.onKeyDown(viewModel, event);
        }
        onClick(viewModel, event) {
            return super.onClick(viewModel, event);
        }
        get dataAccessObject() { return this._atgDao; }
    }
    exports.CheckBoxTreeGridViewModel = CheckBoxTreeGridViewModel;
    class AnalyzerListViewModel {
        constructor(diagnosticAnalysisViewer) {
            this._canRunAnalysis = ko.observable(true);
            this._areAnalysesVisible = ko.observable(false);
            this._analyzerListDAO = new AnalyzerTreeGridDAO_1.AnalyzerTreeGridDAO(this, diagnosticAnalysisViewer);
            this._header = new diagnosticsHub_ui_1.TreeGridHeaderViewModel([{ id: "name", text: plugin.Resources.getString("AvailableAnalyses"), hideable: false }], new AnalyzerListColumnSettingsProvider_1.AnalyzerListColumnSettingsProvider(), this._analyzerListDAO.defaultSortColumnId);
            this._analyzerList = new CheckBoxTreeGridViewModel(this._analyzerListDAO, this._header, "AnalyzerListAriaLabel");
        }
        get analyzeButtonLabel() { return plugin.Resources.getString("AnalyzeButtonLabel"); }
        get canRunAnalysis() { return this._canRunAnalysis; }
        get areAnalysesVisible() { return this._areAnalysesVisible; }
        get analyzerList() { return this._analyzerList; }
        getSelectedAnalyses() {
            let selected = {};
            this._analyzerListDAO.analyses.forEach((a) => { selected[a.AnalysisId] = a; });
            for (let root of this._analyzerList.roots()) {
                for (let child of root.children()) {
                    let vmr = child;
                    if (vmr.checkedState() === CustomBindings_3.CheckedState.Unchecked) {
                        if (selected[vmr.uniqueId]) {
                            delete selected[vmr.uniqueId];
                        }
                    }
                }
            }
            return Object.keys(selected).map(k => selected[k]);
        }
        onAfterRender(elements, viewModel) {
            let this_ = viewModel.dataAccessObject.analyzerListVM;
            if (this_.areAnalysesVisible()) {
                viewModel.onAfterDomInsert(elements, viewModel);
            }
            else {
                let subscribed = this_.areAnalysesVisible.subscribe((visible) => {
                    if (visible) {
                        viewModel.onAfterDomInsert(elements, viewModel);
                        subscribed.dispose();
                    }
                });
            }
        }
        updateTreeGrid(analysisList) {
            this._analyzerListDAO.updateTreeRows(analysisList);
            this._analyzerList.onResultChanged(0);
        }
    }
    exports.AnalyzerListViewModel = AnalyzerListViewModel;
});
define("WindowViewModel", ["require", "exports", "ResultsAreaViewModel", "AnalyzerListViewModel", "plugin-vs-v2", "knockout"], function (require, exports, rv, al, plugin, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModelCache = exports.ProcessViewModel = exports.OverallViewModel = void 0;
    class OverallViewModel {
        constructor() {
            this._currentProcess = ko.observable(null);
            this._error = ko.observable(null);
            this._currentProcess.subscribe(this.onProcessChanged.bind(this));
            this._error.subscribe(this.onErrorChanged.bind(this));
            this._error(plugin.Resources.getString("NoProcessSelected"));
        }
        get currentProcess() { return this._currentProcess; }
        get error() { return this._error; }
        onProcessChanged(process) {
            if (process) {
                if (this.error()) {
                    this._error(null);
                }
            }
        }
        onErrorChanged(error) {
            if (error) {
                if (this.currentProcess()) {
                    this._currentProcess(null);
                }
            }
        }
    }
    exports.OverallViewModel = OverallViewModel;
    class ProcessViewModel {
        constructor(viewer, processId) {
            this.processId = null;
            this._processName = ko.observable("");
            this._processHeader = ko.pureComputed(() => this.processHeaderString());
            this.AnalyzerListViewModel = ko.observable(null);
            this.ResultsAreaViewModel = ko.observable(null);
            this.processId = processId;
            this.AnalyzerListViewModel(new al.AnalyzerListViewModel(viewer));
            this.ResultsAreaViewModel(new rv.ResultsAreaViewModel(viewer));
        }
        get processName() { return this._processName; }
        get processHeader() { return this._processHeader; }
        processHeaderString() {
            if (this.processName) {
                return plugin.Resources.getString("DiagnosticAnalysisHeader", this.processName());
            }
            return plugin.Resources.getString("NoProcessSelected");
        }
    }
    exports.ProcessViewModel = ProcessViewModel;
    class ViewModelCache {
        constructor() {
            this._cache = {};
        }
        cacheView(process) {
            if (process) {
                this._cache[process.processId] = process;
            }
        }
        getcache(processGuid) {
            if (processGuid) {
                return this._cache[processGuid];
            }
            return null;
        }
    }
    exports.ViewModelCache = ViewModelCache;
});
define("DiagnosticAnalysisWindow", ["require", "exports", "Constants", "AnalysisResult", "WindowViewModel", "plugin-vs-v2", "knockout"], function (require, exports, Constants_3, ar, WindowViewModel_1, plugin, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagnosticAnalysisViewer = void 0;
    class AnalysesUpdatedEventArgs {
    }
    class DiagnosticAnalysisViewer {
        constructor(adaptor) {
            this._linkClickedListener = null;
            this._adaptor = adaptor;
            this._linkClickedListener = this.onLinkClicked.bind(this);
            this._isInitialized = false;
            this._isUpdatingAnalyses = false;
            this._onInitWasCalled = false;
            this._cache = null;
            this._overallViewModel = new WindowViewModel_1.OverallViewModel();
            this._adaptor.addEventListener("AnalysesUpdated", this.onAnalysesUpdated.bind(this));
            this._adaptor.addEventListener("RunAnalyses", this.onRunAnalyses.bind(this));
            this.applyBindings();
        }
        get adaptor() { return this._adaptor; }
        removeHighlighting() {
            let highlightedSections = document.getElementsByClassName("highlightedText");
            for (let i = 0; i < highlightedSections.length; i++) {
                let section = highlightedSections[i];
                section.classList.remove("highlightedText");
            }
        }
        analyzeButtonClicked() {
            let currentProcess = this._overallViewModel.currentProcess();
            currentProcess.AnalyzerListViewModel().canRunAnalysis(false);
            let selected = currentProcess.AnalyzerListViewModel().getSelectedAnalyses();
            if (selected.length === 0) {
                currentProcess.ResultsAreaViewModel().setError(plugin.Resources.getString("NoAnalyzerSelectedError"));
                currentProcess.AnalyzerListViewModel().canRunAnalysis(true);
                return;
            }
            this.runAnalysis(selected);
        }
        applyBindings() {
            if (!this._isInitialized) {
                ko.applyBindings(this._overallViewModel);
                this._isInitialized = true;
            }
        }
        clearView() {
            let currentProcess = this._overallViewModel.currentProcess();
            if (currentProcess) {
                if (currentProcess.ResultsAreaViewModel()) {
                    currentProcess.ResultsAreaViewModel().unsubscribeLinkClicked(this._linkClickedListener);
                }
            }
            this._overallViewModel.currentProcess(null);
        }
        setView(processModel) {
            this.cacheView();
            this.clearView();
            processModel.ResultsAreaViewModel().subscribeLinkClicked(this._linkClickedListener);
            this._overallViewModel.currentProcess(processModel);
        }
        resetView(processGuid) {
            this.cacheView();
            let cachedView = this._cache.getcache(processGuid);
            if (cachedView) {
                this.clearView();
                cachedView.ResultsAreaViewModel().subscribeLinkClicked(this._linkClickedListener);
                this._overallViewModel.currentProcess(cachedView);
                return true;
            }
            return false;
        }
        cacheView() {
            if (!this._cache) {
                this._cache = new WindowViewModel_1.ViewModelCache();
            }
            this._cache.cacheView(this._overallViewModel.currentProcess());
        }
        onAnalysesUpdated(args) {
            if (args.Reason === "DEBUGGERSTOPPED") {
                this._cache = null;
            }
            else if (this.resetView(args.ProcessGuid)) {
                this._isUpdatingAnalyses = false;
                return;
            }
            this.refreshAnalysisModel();
        }
        onRunAnalyses(runAll) {
            this.analyzeButtonClicked();
        }
        refreshAnalysisModel() {
            let refreshAnalysisModelCompleted = (result) => {
                if (!this._isUpdatingAnalyses) {
                    return;
                }
                this._isUpdatingAnalyses = false;
                let status = result.Status;
                let canRunAnalysis = Boolean(result.CanRunAnalysis);
                if (status === "RUNNING") {
                    this._overallViewModel.error(plugin.Resources.getString("NotInBreakModeError"));
                    return;
                }
                else if (!result.ProcessName || (status === "NOPROCESS")) {
                    this._overallViewModel.error(plugin.Resources.getString("NoProcessError"));
                    return;
                }
                else if (!canRunAnalysis) {
                    this._overallViewModel.error(plugin.Resources.getString("UnableToRunAnalysis"));
                    return;
                }
                let currentProcess = new WindowViewModel_1.ProcessViewModel(this, result.processId);
                currentProcess.processName(result.ProcessName);
                currentProcess.processId = result.ProcessGuid;
                this.setView(currentProcess);
                currentProcess.AnalyzerListViewModel().canRunAnalysis(canRunAnalysis);
                currentProcess.ResultsAreaViewModel().setError(null);
                currentProcess.AnalyzerListViewModel().areAnalysesVisible(true);
                currentProcess.AnalyzerListViewModel().updateTreeGrid(result.Analyses);
                if (result.length === 0) {
                    currentProcess.ResultsAreaViewModel().setError(plugin.Resources.getString("NoAnalyzerDetectedError"));
                }
                if (!this._onInitWasCalled) {
                    this._onInitWasCalled = true;
                    this._adaptor._call("OnInitCompleted");
                }
            };
            this.cacheView();
            this._isUpdatingAnalyses = true;
            this._adaptor._call("RefreshAnalysisModelAsync").then(refreshAnalysisModelCompleted.bind(this));
        }
        runAnalysis(selected) {
            let analysisCompleted = (completedResults, exception) => {
                let currentProcess = this._overallViewModel.currentProcess();
                if (!currentProcess) {
                    return;
                }
                let results = [];
                if (completedResults) {
                    for (let analysisResult of completedResults) {
                        let resultObject = ar.createAnalysisResult(analysisResult, this);
                        results.push(resultObject);
                    }
                    if (results.length === 0) {
                        currentProcess.ResultsAreaViewModel().setError(plugin.Resources.getString("NoAnalysisResultsAvailable"));
                    }
                    else {
                        currentProcess.ResultsAreaViewModel().results = results.sort((a, b) => { return b.sortWeight - a.sortWeight; });
                    }
                }
                else {
                    currentProcess.ResultsAreaViewModel().setError(plugin.Resources.getString("AnalysisCanceled"));
                }
                if (currentProcess.AnalyzerListViewModel()) {
                    currentProcess.AnalyzerListViewModel().canRunAnalysis(true);
                }
            };
            this._adaptor._call("RunAnalysesAsync", selected).then(analysisCompleted.bind(this));
        }
        onLinkClicked(uri, result) {
            this._adaptor._call("OnUriClickedAsync", uri.toString(), result.uniqueProcessId, result.analyzerId, result.errorCode);
        }
        onResultSelected(result) {
            this._adaptor._call("OnSelectResultTelemetry", result.analyzerId, result.errorCode);
        }
        onKeydownTextBox(data, event) {
            if (event.ctrlKey && (event.keyCode === Constants_3.Constants.CKeyCode)) {
                var currentTarget = event.currentTarget;
                this.CopyText(currentTarget);
                return false;
            }
            return true;
        }
        onContextMenuTextBox(data, event) {
            let targetDivSection = event.currentTarget;
            var xPos = event.clientX;
            var yPos = event.clientY;
            this.removeHighlighting();
            targetDivSection.classList.add("highlightedText");
            event.cancelBubble = true;
            window.event.returnValue = false;
            var config = [
                {
                    label: plugin.Resources.getString("CopyLabel"),
                    iconEnabled: "vs-image-menu-copy-enabled",
                    callback: () => this.CopyText(targetDivSection),
                    disabled: () => false,
                    type: plugin.ContextMenu.MenuItemType.command
                }
            ];
            var contextMenu = plugin.ContextMenu.create(config);
            contextMenu.addEventListener("dismiss", () => this.removeHighlighting());
            contextMenu.show(xPos, yPos);
            return false;
        }
        CopyText(textDiv) {
            if (textDiv.childNodes.length > 0) {
                navigator.clipboard.writeText(textDiv.innerText);
            }
        }
    }
    exports.DiagnosticAnalysisViewer = DiagnosticAnalysisViewer;
});
define("DetailedResultViews/MarkdownFragmentViewModel", ["require", "exports", "MarkdownParser", "template!MdTextFragment", "template!MdLinkFragment"], function (require, exports, md) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownFragmentViewModel = void 0;
    class MarkdownFragmentViewModel {
        constructor(fragment) {
            if (fragment.type != md.MarkdownFragmentType.Link) {
                this._fragment = fragment;
                return;
            }
            const linkFragment = fragment;
            switch (linkFragment.link.protocol) {
                case "https:":
                case "thread:":
                case "none:":
                case "clrobject:":
                case "clrmodule:":
                case "memorytool:":
                    break;
                default:
                    this._fragment = new md.MarkdownTextFragment(linkFragment.value);
                    return;
            }
            this._fragment = fragment;
        }
        get templateName() {
            switch (this._fragment.type) {
                case md.MarkdownFragmentType.Text:
                    return "MdTextFragment";
                case md.MarkdownFragmentType.Link:
                    return "MdLinkFragment";
                default:
                    throw new Error("Unknown item type!");
            }
        }
        get text() {
            return this._fragment.value;
        }
        get link() {
            if (this._fragment.type != md.MarkdownFragmentType.Link) {
                return null;
            }
            return this._fragment.link.toString();
        }
    }
    exports.MarkdownFragmentViewModel = MarkdownFragmentViewModel;
});
define("DetailedResultViews/TreeItemViewModel", ["require", "exports", "diagnosticsHub-ui", "Constants", "knockout", "MarkdownParser", "DetailedResultViews/MarkdownFragmentViewModel", "DetailedResultViews/DetailItemViewModel", "template!TreeItemView", "template!TreeItemRowView"], function (require, exports, diagnosticsHub_ui_2, Constants_4, ko, MarkdownParser_1, MarkdownFragmentViewModel_1, DetailItemViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeItemViewModel = void 0;
    class TreeItemViewModel extends diagnosticsHub_ui_2.TreeGridViewModel {
        constructor(treeView) {
            const treeItem = treeView.tree;
            const header = [];
            const columnSettings = [];
            for (let idx = 0; idx < treeItem.columnModel.columns.length; idx++) {
                const column = treeItem.columnModel.columns[idx];
                const columnId = Constants_4.Constants.GridColumnIdPrefix + idx;
                const defaultSortDirection = column.defaultSortDirection === "desc" ? diagnosticsHub_ui_2.SortDirection.Desc : diagnosticsHub_ui_2.SortDirection.Asc;
                header.push({ id: columnId, text: column.localizedName, hideable: false, tooltip: column.localizedName, sortable: column.sortable ? defaultSortDirection : null });
                let width = 750 / treeItem.columnModel.columns.length;
                if (column.widthRatio > 0 && column.widthRatio <= 1) {
                    width = 750 * column.widthRatio;
                }
                columnSettings.push({ columnId, isHidden: false, width });
            }
            const initialSortColumnId = Constants_4.Constants.GridColumnIdPrefix + ((treeItem.columnModel.defaultSortedColumnId != null) ? treeItem.columnModel.defaultSortedColumnId : 0);
            const gridId = TreeItemViewModel.generateUniqueGridId();
            super(new TreeItemDAO(treeItem, gridId), new diagnosticsHub_ui_2.TreeGridHeaderViewModel(header, new TreeItemColumnSettingsProvider(columnSettings), initialSortColumnId), "TreeItemViewAriaLabel");
            this._modelId = DetailItemViewModel_1.DetailItemViewModelBase.CreateId(this);
            this._gridId = gridId;
        }
        get templateName() { return "TreeItemView"; }
        get id() { return this._modelId; }
        onAfterRender(elements, viewModel) {
            viewModel.onResultChanged(0);
            viewModel.dataLoadPromise.then(() => viewModel.onAfterDomInsert(elements, viewModel));
        }
        get gridId() {
            return this._gridId;
        }
        static generateUniqueGridId() {
            TreeItemViewModel._uniqueIdCounter++;
            return "TreeItemView_" + TreeItemViewModel._uniqueIdCounter;
        }
    }
    exports.TreeItemViewModel = TreeItemViewModel;
    TreeItemViewModel._uniqueIdCounter = 0;
    class TreeItemColumnSettingsProvider {
        constructor(columnSettings) {
            this._columnSettings = columnSettings;
        }
        getColumnSettings() {
            return Promise.resolve(this._columnSettings);
        }
        onColumnChanged(column) {
        }
    }
    class TreeItemDAO {
        constructor(treeItem, gridId) {
            this._treeItem = treeItem;
            this._gridId = gridId;
        }
        getRoots(resultId, sortInfo) {
            return Promise.resolve(this._treeItem.roots).then((roots) => {
                var _a, _b;
                const rows = [];
                for (let idx = 0; idx < roots.length; idx++) {
                    const vm = new TreeItemRowViewModel(idx, roots[idx], 0, this._gridId);
                    rows.push(vm);
                }
                const columnIndex = (_a = this._treeItem.columnModel.defaultSortedColumnId) !== null && _a !== void 0 ? _a : 0;
                if (columnIndex < 0 || columnIndex >= this._treeItem.columnModel.columns.length || !this._treeItem.columnModel.columns[columnIndex].sortable) {
                    return rows;
                }
                return TreeItemDAO.sortRowCollection(rows, (_b = this._treeItem.columnModel.defaultSortedColumnId) !== null && _b !== void 0 ? _b : 0, sortInfo);
            });
        }
        expand(row, sortInfo) {
            const rowViewModel = row;
            return Promise.resolve(rowViewModel).then((row) => row.loadChildren()).then(() => rowViewModel.expand());
        }
        search(query, isCaseSensitive, isRegex, isForward, startingRow, sortInfo) {
            throw new Error("Method not implemented.");
        }
        sort(roots, sortInfo) {
            const columnIndex = parseInt(sortInfo.columnId.substr(Constants_4.Constants.GridColumnIdPrefix.length));
            if (columnIndex < 0 || columnIndex >= this._treeItem.columnModel.columns.length || !this._treeItem.columnModel.columns[columnIndex].sortable) {
                return Promise.resolve(roots);
            }
            return Promise.resolve(columnIndex).then((columnIndex) => {
                return TreeItemDAO.sortRowCollection(roots, columnIndex, sortInfo);
            });
        }
        static sortRowCollection(rows, columnIndex, sortInfo) {
            let sortedRows = rows.sort((first, second) => TreeItemDAO._sortFunc(first, second, columnIndex, sortInfo));
            sortedRows.forEach(row => {
                TreeItemDAO.sortObservableRowCollections(row.children, columnIndex, sortInfo);
            });
            return sortedRows;
        }
        static sortObservableRowCollections(rows, columnIndex, sortInfo) {
            rows.sort((first, second) => TreeItemDAO._sortFunc(first, second, columnIndex, sortInfo));
            for (var idx = 0; idx < rows.length; idx++) {
                TreeItemDAO.sortObservableRowCollections(rows[idx].children, columnIndex, sortInfo);
            }
        }
    }
    TreeItemDAO._sortFunc = (first, second, columnIndex, sortInfo) => {
        if (!first || !second) {
            return 0;
        }
        const x = first.getValueAtIndex(columnIndex, false);
        const y = second.getValueAtIndex(columnIndex, false);
        let n1 = Number(x);
        let n2 = Number(y);
        if (isNaN(n1) || isNaN(n2)) {
            if (x.startsWith("0x") && y.startsWith("0x")) {
                n1 = parseInt(x, 16);
                n2 = parseInt(y, 16);
            }
            else if (x.endsWith("B") && y.endsWith("B")) {
                n1 = TreeItemDAO.parseBytes(x);
                n2 = TreeItemDAO.parseBytes(y);
            }
        }
        if (!isNaN(n1) && !isNaN(n2)) {
            if (n1 === n2) {
                return 0;
            }
            if (n1 < n2) {
                return sortInfo.direction === diagnosticsHub_ui_2.SortDirection.Asc ? -1 : 1;
            }
            else {
                return sortInfo.direction === diagnosticsHub_ui_2.SortDirection.Asc ? 1 : -1;
            }
        }
        const xStr = x.toLowerCase();
        const yStr = y.toLowerCase();
        const compareResult = xStr.localeCompare(yStr);
        if (compareResult === 0) {
            return 0;
        }
        if (sortInfo.direction === diagnosticsHub_ui_2.SortDirection.Asc) {
            return compareResult > 0 ? 1 : -1;
        }
        else {
            return compareResult > 0 ? -1 : 1;
        }
    };
    TreeItemDAO.parseBytes = (text) => {
        if (!text || text.length < 3) {
            return NaN;
        }
        let prefix = text.charAt(text.length - 2);
        let multiplier = 1;
        switch (prefix) {
            case 'K': {
                multiplier = 1024;
                break;
            }
            case 'M': {
                multiplier = 1024 * 1024;
                break;
            }
            case 'G': {
                multiplier = 1024 * 1024 * 1024;
                break;
            }
            default: {
                break;
            }
        }
        return Number(text.substring(0, text.length - 2)) * multiplier;
    };
    class TreeItemRowViewModel {
        constructor(id, row, depth, gridId) {
            this._selected = ko.observable(false);
            this._expanded = ko.observable(false);
            this._arrowVisibility = ko.observable("visible");
            this._children = ko.observableArray([]);
            this._hasFocus = ko.observable(false);
            this._row = row;
            this._id = id;
            this._values = row.values.map((v) => { return (typeof v === "string") ? new MarkdownParser_1.MarkdownText(v) : v; });
            this._depth = depth;
            this._expandable = row.children && (row.children.length > 0);
            this._gridId = gridId;
            if (!this._expandable) {
                this._arrowVisibility("hidden");
            }
        }
        get arrowVisibility() { return this._arrowVisibility; }
        get hasFocus() {
            return this._hasFocus;
        }
        get expandable() {
            return this._expandable;
        }
        isMarkdownAtIndex(idx) {
            const item = this._values[idx];
            const valueAsMarkdown = item;
            return !!(typeof item === "object" && (valueAsMarkdown === null || valueAsMarkdown === void 0 ? void 0 : valueAsMarkdown.originalText));
        }
        getValueAtIndex(idx, localizeNumbers = true) {
            const item = this._values[idx];
            const valueAsMarkdown = item;
            if (valueAsMarkdown === null || valueAsMarkdown === void 0 ? void 0 : valueAsMarkdown.visibleText) {
                return valueAsMarkdown.visibleText;
            }
            else if (localizeNumbers && Number(item)) {
                return Number(item).toLocaleString();
            }
            else {
                return item;
            }
        }
        getFragmentsAtIndex(idx, localizeNumbers = true) {
            const item = this._values[idx];
            const valueAsMarkdown = item;
            return valueAsMarkdown.fragments.map((f) => { return new MarkdownFragmentViewModel_1.MarkdownFragmentViewModel(f); });
        }
        getValueAtIndexForToolTip(idx, isValidJson = false) {
            let val = this.getValueAtIndex(idx);
            if (!isValidJson && val && val.length > 0 && val[0] === '{') {
                return JSON.stringify({ content: val });
            }
            return val;
        }
        get values() {
            return this._values.map((item, index) => {
                return this.getValueAtIndex(index);
            });
        }
        loadChildren() {
            if (!this._expandable) {
                return;
            }
            const rows = [];
            for (let idx = 0; idx < this._row.children.length; idx++) {
                const vm = new TreeItemRowViewModel(idx, this._row.children[idx], this._depth + 1, this._gridId);
                rows.push(vm);
            }
            this.children(rows);
        }
        expand() {
            this._expanded(!this._expanded());
            const e = document.createEvent("Event");
            e.initEvent("resize", true, true);
            document.getElementById(this._gridId).dispatchEvent(e);
            return Promise.resolve(undefined);
        }
        get depth() {
            return this._depth;
        }
        get selected() {
            return this._selected;
        }
        get expanded() {
            return this._expanded;
        }
        get templateName() {
            return "TreeItemRowView";
        }
        get id() {
            return this._id;
        }
        get children() {
            return this._children;
        }
        invoke() {
        }
    }
});
define("DetailedResultViews/DetailItemViewModel", ["require", "exports", "DetailViewTypes", "MarkdownParser", "DetailedResultViews/MarkdownFragmentViewModel", "DetailedResultViews/TreeItemViewModel", "knockout", "template!DetailItemView", "template!TextItemView", "template!RegionItemView"], function (require, exports, details, MarkdownParser_2, MarkdownFragmentViewModel_2, TreeItemViewModel_1, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RegionItemViewModel = exports.TextItemViewModel = exports.DetailItemViewModelBase = exports.loadDetailItemViewModels = void 0;
    function loadDetailItemViewModels(items) {
        return items.map((x) => {
            if (details.isTextViewItem(x))
                return new TextItemViewModel(x);
            if (details.isRegionViewItem(x))
                return new RegionItemViewModel(x);
            if (details.isTreeViewItem)
                return new TreeItemViewModel_1.TreeItemViewModel(x);
            throw new Error("Unknown item type!");
        });
    }
    exports.loadDetailItemViewModels = loadDetailItemViewModels;
    class DetailItemViewModelBase {
        constructor() {
            this._id = null;
        }
        get id() {
            if (!this._id) {
                this._id = DetailItemViewModelBase.CreateId(this);
            }
            return this._id;
        }
        static CreateId(viewModel) {
            return `${viewModel.templateName}_${(DetailItemViewModelBase._idCounter++).toString()}`;
        }
    }
    exports.DetailItemViewModelBase = DetailItemViewModelBase;
    DetailItemViewModelBase._idCounter = 0;
    class TextItemViewModel extends DetailItemViewModelBase {
        constructor(item) {
            super();
            this._item = item;
            this._fragments = MarkdownParser_2.parseMarkdown(item.text).map((f) => { return new MarkdownFragmentViewModel_2.MarkdownFragmentViewModel(f); });
        }
        get templateName() { return "TextItemView"; }
        get fragments() { return this._fragments; }
    }
    exports.TextItemViewModel = TextItemViewModel;
    class RegionItemViewModel extends DetailItemViewModelBase {
        constructor(item) {
            super();
            this._containingItems = ko.observableArray([]);
            this._region = item;
            this._containingItems(loadDetailItemViewModels(item.region.items));
        }
        get templateName() { return "RegionItemView"; }
        get header() { return this._region.region.header; }
        get items() { return this._containingItems; }
    }
    exports.RegionItemViewModel = RegionItemViewModel;
});
define("ResultsAreaViewModel", ["require", "exports", "ResultListViewModel", "DetailedResultViews/DetailItemViewModel", "plugin-vs-v2", "knockout"], function (require, exports, rlvm, DetailItemViewModel_2, plugin, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResultsAreaViewModel = void 0;
    class ResultsAreaViewModel {
        constructor(viewer) {
            this._isErrorVisible = ko.observable(false);
            this._errorString = ko.observable(null);
            this._isResultsVisible = ko.observable(false);
            this._isResultDetailsVisible = ko.observable(false);
            this._detailedResults = ko.observableArray();
            this._linkClickedListener = [];
            this._rlvm = new rlvm.ResultListViewModel(this);
            this._rlvm.selectedResult.subscribe(this.onResultSelected.bind(this));
            let onVisibleChanged = this.isResultsVisible.subscribe(() => {
                if (this.initialize()) {
                    onVisibleChanged.dispose();
                }
            });
            this._viewer = viewer;
            this._isInitialized = false;
        }
        get isErrorVisible() { return this._isErrorVisible; }
        get errorString() { return this._errorString; }
        get isResultsVisible() { return this._isResultsVisible; }
        get resultListViewModel() { return this._rlvm; }
        get isDetailsVisible() { return this._isResultDetailsVisible; }
        get detailedResults() { return this._detailedResults; }
        get resultHeader() { return plugin.Resources.getString("AnalysisResultsHeader"); }
        get selectedResult() { return this._rlvm.selectedResult(); }
        set results(results) {
            if (!results || results.length <= 0) {
                this.isResultsVisible(false);
                return;
            }
            this.isErrorVisible(false);
            this.isResultsVisible(true);
            this._rlvm.results = results;
            this._isInitialized = false;
            this._rlvm.dataGrid.dataLoadPromise.then(() => this.initialize());
        }
        linkClicked(uri) {
            if (this._rlvm.selectedResult) {
                let result = this._rlvm.selectedResult();
                this._linkClickedListener.forEach(func => {
                    func(uri, result);
                });
            }
        }
        onKeyDown(data, event, uri) {
            switch (event.key) {
                case " ":
                case "Enter":
                    this.linkClicked(uri);
                    break;
            }
        }
        subscribeLinkClicked(func) {
            for (let i = 0; i < this._linkClickedListener.length; ++i) {
                if (this._linkClickedListener[i] === func) {
                    return;
                }
            }
            this._linkClickedListener.push(func);
        }
        unsubscribeLinkClicked(func) {
            let index = -1;
            for (let i = 0; i < this._linkClickedListener.length; ++i) {
                if (this._linkClickedListener[i] === func) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                this._linkClickedListener.splice(index, 1);
            }
        }
        setError(error) {
            this.isResultsVisible(false);
            this.isDetailsVisible(false);
            if (error) {
                this.errorString(error);
                this.isErrorVisible(true);
                this._isInitialized = false;
            }
            else {
                this.isErrorVisible(false);
            }
        }
        onResultSelected(result) {
            this.detailedResults(DetailItemViewModel_2.loadDetailItemViewModels(result.detailedResult.details));
            this.isDetailsVisible(true);
            this._viewer.onResultSelected(result);
        }
        onAfterRender(elements, viewModel) {
            let this_ = viewModel.dataAccessObject.viewModel.resultsArea;
            this_._isInitialized = false;
            this_.initialize();
        }
        initialize() {
            if (this._isInitialized ||
                !this.isResultsVisible() ||
                !this._rlvm.gridViewModel.rows() ||
                !this._rlvm.gridViewModel.rows().length) {
                return this._isInitialized;
            }
            this._isInitialized = true;
            let resultListElement = document.getElementById("resultList");
            this._rlvm.dataGrid.onAfterDomInsert([resultListElement], this._rlvm.dataGrid);
            let header = this._rlvm.dataGrid._header;
            if (header && header._resizers) {
                let resizer = header._resizers["resultSeverity"];
                if (resizer && ("_minWidth" in resizer)) {
                    resizer._minWidth = 10;
                }
            }
            const e = document.createEvent("Event");
            e.initEvent("resize", true, true);
            resultListElement.dispatchEvent(e);
            return this._isInitialized;
        }
    }
    exports.ResultsAreaViewModel = ResultsAreaViewModel;
});
define("ResultListViewModel", ["require", "exports", "diagnosticsHub-ui", "plugin-vs-v2", "knockout"], function (require, exports, diagnosticsHub_ui_3, plugin, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResultListViewModel = exports.ResultListGridViewModel = exports.ResultListColumnSettingsProvider = exports.ResultListDAO = exports.ResultListRow = void 0;
    class ResultListRow {
        constructor(analysisResult, id) {
            this._id = id;
            this._analysisResult = analysisResult;
            this._selected = ko.observable(false);
        }
        invoke() {
        }
        get resultCode() {
            return this._analysisResult.errorCode;
        }
        get resultName() {
            return this._analysisResult.errorName;
        }
        get resultSeverity() {
            switch (this._analysisResult.severity) {
                case "info":
                case "warning":
                case "error":
                case "none":
                    return this._analysisResult.severity;
            }
            return "unknown";
        }
        get iconStatusClassName() {
            switch (this.resultSeverity) {
                case "info":
                    return "icon-info";
                case "warning":
                    return "icon-warning";
                case "error":
                    return "icon-error";
            }
            return "icon-unknown";
        }
        get severityLabel() {
            let resourceKey = "UnknownLabel";
            switch (this.resultSeverity) {
                case "info":
                    resourceKey = "InfoLabel";
                    break;
                case "warning":
                    resourceKey = "WarningLabel";
                    break;
                case "error":
                    resourceKey = "ErrorLabel";
                    break;
                case "none":
                    resourceKey = "NoneLabel";
                    break;
            }
            return plugin.Resources.getString(resourceKey);
        }
        get templateName() {
            return "ResultListRowTemplate";
        }
        get selected() {
            return this._selected;
        }
        get id() {
            return this._id;
        }
    }
    exports.ResultListRow = ResultListRow;
    class ResultListDAO {
        constructor(viewModel) {
            this._rows = [];
            this._viewModel = null;
            this._viewModel = viewModel;
        }
        get viewModel() { return this._viewModel; }
        getCount(resultId) {
            return Promise.resolve(this._rows.length);
        }
        getRows(resultId, sortInfo) {
            return Promise.resolve(this._rows);
        }
        search(query, isCaseSensitive, isRegex, isForward, startingRow, sortInfo) {
            return null;
        }
        sort(rows, sortInfo) {
            let sortFunc = null;
            if (sortInfo.columnId === "resultSeverity") {
                sortFunc = diagnosticsHub_ui_3.SortFunctions.numericSort(sortInfo.columnId, sortInfo.direction);
            }
            else {
                sortFunc = diagnosticsHub_ui_3.SortFunctions.stringSort(sortInfo.columnId, sortInfo.direction);
            }
            rows.sort(sortFunc);
            return Promise.resolve(rows);
        }
        setResults(results) {
            this._rows = results.map((result, i) => new ResultListRow(result, i));
        }
    }
    exports.ResultListDAO = ResultListDAO;
    class ResultListColumnSettingsProvider {
        getColumnSettings() {
            return Promise.resolve([
                { columnId: "resultSeverity", isHidden: false, width: 20 },
                { columnId: "resultCode", isHidden: false, width: 50 },
                { columnId: "resultName", isHidden: false, width: 650 }
            ]);
        }
        onColumnChanged(column) {
        }
    }
    exports.ResultListColumnSettingsProvider = ResultListColumnSettingsProvider;
    class ResultListGridViewModel extends diagnosticsHub_ui_3.DataGridViewModel {
        constructor(dao, header, ariaLabeltoken) {
            super(dao, header, ariaLabeltoken);
        }
        get dataAccessObject() { return this._dao; }
    }
    exports.ResultListGridViewModel = ResultListGridViewModel;
    class ResultListViewModel {
        constructor(ravm) {
            let headerColumns = [
                { id: "resultSeverity", text: " ", hideable: false, sortable: diagnosticsHub_ui_3.SortDirection.Desc, tooltip: plugin.Resources.getString("ResultHeaderSeverityLabel"), ariaLabel: plugin.Resources.getString("ResultHeaderSeverityLabel") },
                { id: "resultCode", text: plugin.Resources.getString("ResultHeaderCodeLabel"), hideable: false, sortable: diagnosticsHub_ui_3.SortDirection.Desc },
                { id: "resultName", text: plugin.Resources.getString("ResultHeaderResultLabel"), hideable: false, sortable: null }
            ];
            let headerViewModel = new diagnosticsHub_ui_3.DataGridHeaderViewModel(headerColumns, new ResultListColumnSettingsProvider(), "code");
            this._resultListAccess = new ResultListDAO(this);
            this._selectedResult = ko.observable(null);
            this._resultList = new ResultListGridViewModel(this._resultListAccess, headerViewModel, "ResultsGridAriaLabel");
            this._resultList.selectedRows.subscribe(this.selectionChanged.bind(this));
            this._resultsArea = ravm;
        }
        set results(value) {
            this._resultListAccess.setResults(value);
            this._resultList.onResultChanged(0);
        }
        get gridViewModel() {
            return this._resultList;
        }
        get resultsArea() {
            return this._resultsArea;
        }
        get dataGrid() {
            return this._resultList;
        }
        get selectedResult() {
            return this._selectedResult;
        }
        selectionChanged(selection) {
            if (selection.length != 1) {
                return;
            }
            let row = this._resultList.rows()[selection[selection.length - 1]];
            this._selectedResult(row._analysisResult);
        }
    }
    exports.ResultListViewModel = ResultListViewModel;
});
define("LocalizedAriaLabel", ["require", "exports", "knockout", "plugin-vs-v2"], function (require, exports, ko, plugin) {
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
define("DetailItemView", [], function () { return "PGRpdiBkYXRhLWJpbmQ9InRlbXBsYXRlOiB7bmFtZTogdGVtcGxhdGVOYW1lLCBkYXRhOiAkZGF0YX0iPjwvZGl2Pg=="; });
define("TextItemView", [], function () { return "PCEtLSBrbyBmb3JlYWNoOiBmcmFnbWVudHMgLS0+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lOyIgZGF0YS1iaW5kPSJ0ZW1wbGF0ZToge25hbWU6IHRlbXBsYXRlTmFtZSwgZGF0YTogJGRhdGF9Ij48L2Rpdj48IS0tIC9rbyAtLT4="; });
define("RegionItemView", [], function () { return "PHNwYW4gY2xhc3M9ImJvbGR0ZXh0IiBkYXRhLWJpbmQ9InRleHQ6IGhlYWRlciwgYXR0cjp7aWQ6aWR9IiB0YWJpbmRleD0iMCIgcm9sZT0iaGVhZGluZyI+PC9zcGFuPjxkaXYgY2xhc3M9InRleHRib3giPjxkaXYgY2xhc3M9ImNvcHl0ZXh0IiB0YWJpbmRleD0iMCIgZGF0YS1iaW5kPSJldmVudDogeyBrZXlkb3duOiB3aW5kb3cuRGlhZ25vc3RpY0FuYWx5c2lzVmlld2VyLm9uS2V5ZG93blRleHRCb3guYmluZCh3aW5kb3cuRGlhZ25vc3RpY0FuYWx5c2lzVmlld2VyKSwgY29udGV4dG1lbnU6IHdpbmRvdy5EaWFnbm9zdGljQW5hbHlzaXNWaWV3ZXIub25Db250ZXh0TWVudVRleHRCb3guYmluZCh3aW5kb3cuRGlhZ25vc3RpY0FuYWx5c2lzVmlld2VyKSB9Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmU7IiBkYXRhLWJpbmQ9InRlbXBsYXRlOiB7bmFtZTogJ0RldGFpbEl0ZW1WaWV3JywgZm9yZWFjaDogaXRlbXN9LCBhdHRyOnsnYXJpYS1sYWJlbGxlZGJ5JzppZH0iPjwvZGl2PjwvZGl2PjwvZGl2Pg=="; });
define("TreeItemView", [], function () { return "PGRpdiBjbGFzcz0icmVzdWx0VHJlZUdyaWQiIGRhdGEtYmluZD0iaWQ6ICRkYXRhLmdyaWRJZCx0ZW1wbGF0ZToge25hbWU6ICdUcmVlR3JpZFZpZXcnLGRhdGE6ICRkYXRhLGFmdGVyUmVuZGVyOiAkZGF0YS5vbkFmdGVyUmVuZGVyIH0iPjwvZGl2Pg=="; });
define("TreeItemRowView", [], function () { return "PHRyIGNsYXNzPSJ0cmVlR3JpZFJvdyIgcm9sZT0idHJlZWl0ZW0iIHRhYmluZGV4PSItMSIgZGF0YS1iaW5kPSJ0cmVlR3JpZFJvd0ZvY3VzOiAkcGFyZW50LmZvY3VzZWRSb3coKT09PSRkYXRhLGFyaWFFeHBhbmRlZDogeyBleHBhbmRhYmxlOiBleHBhbmRhYmxlLCBleHBhbmRlZDogZXhwYW5kZWQgfSxhdHRyOiB7ICdhcmlhLWxldmVsJzogZGVwdGggKyAxIH0sY3NzOiB7c2VsZWN0ZWQ6IHNlbGVjdGVkKCl9LGZvcmVhY2g6IHZhbHVlcyI+PCEtLSBrbyB3aXRoOiAkcGFyZW50IC0tPjwhLS0ga28gaWY6ICRpbmRleCgpID09IDAgLS0+PHRkIHJvbGU9ImdyaWRjZWxsIiBkYXRhLWJpbmQ9ImRhdGEtY29sdW1uaWQ6ICdjb2xfMCcsIGF0dHI6eydkYXRhLXBsdWdpbi12cy10b29sdGlwJzogZ2V0VmFsdWVBdEluZGV4Rm9yVG9vbFRpcCgkaW5kZXgoKSl9Ij48c3BhbiBkYXRhLWJpbmQ9InJvd0luZGVudDogZGVwdGgiPiZuYnNwOzwvc3Bhbj48ZGl2IGRhdGEtYmluZD0idHJlZUdyaWRFeHBhbmRlcjogZXhwYW5kZWQsIHN0eWxlOiB7dmlzaWJpbGl0eTogYXJyb3dWaXNpYmlsaXR5fSI+PC9kaXY+PCEtLSBrbyBpZjogaXNNYXJrZG93bkF0SW5kZXgoJGluZGV4KCkpIC0tPjwhLS0ga28gZm9yZWFjaDogZ2V0RnJhZ21lbnRzQXRJbmRleCgkaW5kZXgoKSkgLS0+PHNwYW4gZGF0YS1iaW5kPSJ0ZW1wbGF0ZToge25hbWU6IHRlbXBsYXRlTmFtZSwgZGF0YTogJGRhdGF9Ij48L3NwYW4+PCEtLSAva28gLS0+PCEtLSAva28gLS0+PCEtLSBrbyBpZm5vdDogaXNNYXJrZG93bkF0SW5kZXgoJGluZGV4KCkpIC0tPjxzcGFuIGRhdGEtYmluZD0idGV4dDogZ2V0VmFsdWVBdEluZGV4KCRpbmRleCgpKSI+PC9zcGFuPjwhLS0gL2tvIC0tPjwvdGQ+PCEtLSAva28gLS0+PCEtLSBrbyBpZjogJGluZGV4KCkgPiAwIC0tPjx0ZCByb2xlPSJncmlkY2VsbCIgZGF0YS1iaW5kPSJkYXRhLWNvbHVtbmlkOiAnY29sXycgKyAkaW5kZXgoKSwgYXR0cjp7J2RhdGEtcGx1Z2luLXZzLXRvb2x0aXAnOiBnZXRWYWx1ZUF0SW5kZXhGb3JUb29sVGlwKCRpbmRleCgpKX0iPjwhLS0ga28gaWY6IGlzTWFya2Rvd25BdEluZGV4KCRpbmRleCgpKSAtLT48IS0tIGtvIGZvcmVhY2g6IGdldEZyYWdtZW50c0F0SW5kZXgoJGluZGV4KCkpIC0tPjxzcGFuIGRhdGEtYmluZD0idGVtcGxhdGU6IHtuYW1lOiB0ZW1wbGF0ZU5hbWUsIGRhdGE6ICRkYXRhfSI+PC9zcGFuPjwhLS0gL2tvIC0tPjwhLS0gL2tvIC0tPjwhLS0ga28gaWZub3Q6IGlzTWFya2Rvd25BdEluZGV4KCRpbmRleCgpKSAtLT48c3BhbiBkYXRhLWJpbmQ9InRleHQ6IGdldFZhbHVlQXRJbmRleCgkaW5kZXgoKSkiPjwvc3Bhbj48IS0tIC9rbyAtLT48L3RkPjwhLS0gL2tvIC0tPjwhLS0gL2tvIC0tPjwvdHI+"; });
define("MdLinkFragment", [], function () { return "PCEtLSBUaGUgUmVzdWx0c0FyZWFWaWV3TW9kZWwgaXMgdGhlIHBlbnVsdGltYXRlIG1vZGVsIGluIHRoZSBwYXJlbnRzIHRyZWUtLT48c3BhbiBjbGFzcz0iZmxvYXRpbmdsaW5rIiB0YWJpbmRleD0iLTEiPjxhIGhyZWY9IiMiIGNsYXNzPSJtZExpbmsiIGRhdGEtYmluZD0idGV4dDogJGRhdGEudGV4dCxjbGljazogZnVuY3Rpb24oKSB7ICRwYXJlbnRzWyRwYXJlbnRzLmxlbmd0aCAtIDNdLmxpbmtDbGlja2VkKCRkYXRhLmxpbmspIH0sY2xpY2tCdWJibGU6IGZhbHNlLGV2ZW50OiB7a2V5ZG93bjogZnVuY3Rpb24oZGF0YSwgZXZlbnQpIHskcGFyZW50c1skcGFyZW50cy5sZW5ndGggLSAzXS5vbktleURvd24oZGF0YSwgZXZlbnQsICRkYXRhLmxpbmspfX0gIiByb2xlPSJidXR0b24iIHRhYkluZGV4PSIwIj48L2E+PC9zcGFuPg=="; });
define("MdTextFragment", [], function () { return "PHNwYW4gZGF0YS1iaW5kPSJ0ZXh0OiAkZGF0YS50ZXh0LGNsaWNrOiBmdW5jdGlvbigpIHsgfSxjbGlja0J1YmJsZTogZmFsc2UiPjwvc3Bhbj4="; });
