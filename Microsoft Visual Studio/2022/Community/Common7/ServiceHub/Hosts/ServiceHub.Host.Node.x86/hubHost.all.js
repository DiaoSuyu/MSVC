(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineTokens = exports.parseFileAsJson = exports.formatPipeName = exports.maxPipeNameLength = exports.setLocationServicePipeName = exports.getLocationServicePipeName = exports.getDefaultLogFilesDir = exports.getOverridenLogFilesDir = exports.ServiceHubLogDisableDefaultLogLocationEnvVarName = exports.ServiceHubLogDirectoryOverrideEnvironmentVariable = exports.getLogSessionKey = exports.getPropertiesArray = exports.getPropertyNoCase = exports.deleteUnixSocketDir = exports.getServerPipePath = exports.unixOwnerOnlyAccessMode = exports.getUnixSocketDir = exports.getPipeName = exports.serverManager = exports.Constants = exports.ServiceHubError = exports.ErrorKind = exports.setOsLocale = exports.UniqueLogSessionKeyEnvVarName = void 0;
const net = require("net");
const path = require("path");
const os = require("os");
const fs = require("fs");
const q = require("q");
const ec = require('errno-codes');
const mkdirp = require('mkdir-parents');
const rmdirRecursive = require('rmdir-recursive');
const sha256 = require('js-sha256').sha256;
const randomHexString_1 = require("./randomHexString");
const libraryResourceStrings_1 = require("./libraryResourceStrings");
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
const CurrentOsLocaleEnvVarName = 'ServiceHubCurrentOsLocale';
// Keep in sync with the env var under src\clr\utility\Microsoft.ServiceHub.Utility.Isolated\ConfigurableEnvironmentVariables.cs
exports.UniqueLogSessionKeyEnvVarName = 'ServiceHubLogSessionKey';
/**
 * Sets OS locale to Hub host.
 */
function setOsLocale(localeConfigs) {
    // Default to English US if an older version of the controller that does not set the locale env var was used
    let locale = 'en-US';
    if (process.env[CurrentOsLocaleEnvVarName]) {
        locale = process.env[CurrentOsLocaleEnvVarName];
    }
    localeConfigs.forEach((config) => {
        config(locale, /* cache */ true);
    });
}
exports.setOsLocale = setOsLocale;
;
/* ServiceHub error classes */
var ErrorKind;
(function (ErrorKind) {
    ErrorKind[ErrorKind["Error"] = 0] = "Error";
    ErrorKind[ErrorKind["InvalidArgument"] = 1] = "InvalidArgument";
    ErrorKind[ErrorKind["InvalidOperation"] = 2] = "InvalidOperation";
    ErrorKind[ErrorKind["ConfigurationError"] = 3] = "ConfigurationError";
    ErrorKind[ErrorKind["ServiceModuleInfoNotFound"] = 4] = "ServiceModuleInfoNotFound";
    ErrorKind[ErrorKind["ServiceModuleInfoLoadError"] = 5] = "ServiceModuleInfoLoadError";
    ErrorKind[ErrorKind["ServiceModuleInfoInvalidPropertyError"] = 6] = "ServiceModuleInfoInvalidPropertyError";
    ErrorKind[ErrorKind["HubHostInfoLoadError"] = 7] = "HubHostInfoLoadError";
    ErrorKind[ErrorKind["JsonParseError"] = 8] = "JsonParseError";
    ErrorKind[ErrorKind["HostGroupsNotSupported"] = 9] = "HostGroupsNotSupported";
    ErrorKind[ErrorKind["ObjectDisposed"] = 10] = "ObjectDisposed";
})(ErrorKind || (exports.ErrorKind = ErrorKind = {}));
// Default error messages for the cases where caller can pass only error kind to ServiceHubError ctor.
const defaultErrorMessages = [];
class ServiceHubError {
    constructor(kind, message) {
        this.name = 'ServiceHubError';
        this.kind = kind || ErrorKind.Error;
        if (!message) {
            ServiceHubError.initDefaultErrorMessages();
            this.message = defaultErrorMessages[this.kind] || ErrorKind[this.kind];
        }
        else {
            this.message = message;
        }
        this.stack = (new Error).stack;
    }
    static initDefaultErrorMessages() {
        if (!ServiceHubError.areDefaultErrorMessagesInitialized) {
            defaultErrorMessages[ErrorKind.ObjectDisposed] = libraryResourceStrings_1.LibraryResourceStrings.objectDisposed;
            ServiceHubError.areDefaultErrorMessagesInitialized = true;
        }
    }
}
exports.ServiceHubError = ServiceHubError;
class Constants {
}
exports.Constants = Constants;
Constants.HostInfoFolderName = 'host';
Constants.HubHostScript = 'HubHost.js';
Constants.PipeScheme = 'net.pipe://';
class Server {
}
class ServerManager {
    constructor() {
        this.isClosed = false;
        this.activeStreams = [];
        this.activeServers = [];
    }
    // Returns the endpoint that people connect to in order to have an instance of 'name' created and hooked up to the proper callback stream
    startService(options, connectionCallback) {
        if (!options) {
            throw new ServiceHubError(ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variablesAreNotDefined('options'));
        }
        if (!options.logger) {
            throw new ServiceHubError(ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('options.logger'));
        }
        let server = new Server();
        let serverOnConnectionCallback = null;
        serverOnConnectionCallback = (stream) => {
            server.server.close();
            this.activeStreams.push(stream);
            connectionCallback(stream, options.logger);
        };
        let netServer = net.createServer(serverOnConnectionCallback);
        server.server = netServer;
        this.activeServers.push(server);
        // Start the pipe listener
        return q.resolve(options.pipeName || (0, randomHexString_1.default)())
            .then((pipeName) => {
            pipeName = formatPipeName(pipeName);
            return getServerPipePath(pipeName)
                .then(serverPath => {
                const url = Constants.PipeScheme + pipeName;
                options.logger.info(libraryResourceStrings_1.LibraryResourceStrings.startingServer(options.name, url, serverPath));
                server.url = url;
                if (options.onErrorCb) {
                    server.server.on('error', options.onErrorCb);
                }
                q.ninvoke(server.server, 'once', 'close').done(() => {
                    options.logger.info(libraryResourceStrings_1.LibraryResourceStrings.stoppedServer(options.name, url));
                    this.activeServers.splice(this.activeServers.indexOf(server), 1);
                });
                server.server.listen(serverPath);
                if (os.platform() === 'win32') {
                    return url;
                }
                // Return the actual server path on unix since the client is equipped to handle that scenario.
                return serverPath;
            });
        });
    }
    cancelServiceRequest(url) {
        for (var i = 0; i < this.activeServers.length; i++) {
            if (this.activeServers[i].url == url) {
                this.activeServers[i].server.close();
                break;
            }
        }
    }
    stop() {
        if (!this.isClosed) {
            this.isClosed = true;
            let promises = [];
            this.activeServers.forEach(server => {
                let defer = q.defer();
                server.server.close(() => this.resolveDeferred(defer));
                promises.push(defer.promise);
            });
            return q.all(promises);
        }
        // The server has already been stopped, so no-op
        return q.resolve(() => { });
    }
    resolveDeferred(deferred) {
        deferred.resolve();
    }
}
exports.serverManager = new ServerManager();
function getPipeName(url) {
    if (!url) {
        throw new ServiceHubError(ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('url'));
    }
    if (url.indexOf(Constants.PipeScheme) !== 0) {
        throw new ServiceHubError(ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.urlShouldStartWith(Constants.PipeScheme));
    }
    let pipeName = url.slice(Constants.PipeScheme.length).trim();
    if (!pipeName) {
        throw new ServiceHubError(ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.urlHasNoPipeName(Constants.PipeScheme));
    }
    return pipeName;
}
exports.getPipeName = getPipeName;
let unixSocketDir = null;
// For *nix platforms we create a socket dir that looks like this: '~/.ServiceHub/<controllerPipeName>'
// ~ avoids pipe name collisions between different users who are running apps with the same ServiceHub config file.
// <controllerPipeName> sub dir ensures each ServiceHub session gets its own dir for socket files.
function getUnixSocketDir(controllerPipeName) {
    if (unixSocketDir) {
        return q.resolve(unixSocketDir);
    }
    return q.resolve(path.join(getServiceHubBaseDirForUnix(), controllerPipeName));
}
exports.getUnixSocketDir = getUnixSocketDir;
let unixSocketDirCreated = false;
exports.unixOwnerOnlyAccessMode = parseInt('0700', 8); // 'rwx------'
function getServerPipePath(pipeNameOrUrl, isFullSocketPath = false) {
    if (!pipeNameOrUrl) {
        throw new Error(libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('pipeName'));
    }
    if (pipeNameOrUrl.indexOf(Constants.PipeScheme) === 0) {
        pipeNameOrUrl = pipeNameOrUrl.slice(Constants.PipeScheme.length).trim();
        if (!pipeNameOrUrl) {
            throw new ServiceHubError(ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.noPipeName(Constants.PipeScheme));
        }
    }
    if (os.platform() === 'win32') {
        return q.resolve(path.join('\\\\?\\pipe', pipeNameOrUrl));
    }
    if (isFullSocketPath) {
        return q.resolve(pipeNameOrUrl);
    }
    // Since the location service pipe is the first one opened and as soon as its opened this environment variable is set,
    // if the variable isn't set it means we're trying to get the socket dir for that pipe.
    let controllerPipeName = getLocationServicePipeName();
    if (!controllerPipeName) {
        controllerPipeName = pipeNameOrUrl;
    }
    return getUnixSocketDir(controllerPipeName)
        .then(socketDir => {
        let serverPipePath = path.join(socketDir, pipeNameOrUrl);
        if (unixSocketDirCreated) {
            return q.resolve(serverPipePath);
        }
        let dirCheck = q.defer();
        fs.exists(socketDir, exists => dirCheck.resolve(exists));
        return dirCheck.promise
            .then((exists) => {
            if (exists) {
                unixSocketDirCreated = true;
                return serverPipePath;
            }
            else {
                return q.nfcall(mkdirp, socketDir, exports.unixOwnerOnlyAccessMode)
                    .then(() => {
                    unixSocketDirCreated = true;
                    return serverPipePath;
                })
                    .catch(e => {
                    if (e.code !== ec.EEXIST.code) {
                        throw e;
                    }
                    unixSocketDirCreated = true;
                    return serverPipePath;
                });
            }
        });
    });
}
exports.getServerPipePath = getServerPipePath;
function deleteUnixSocketDir(url) {
    if (process.platform === 'win32') {
        return q.resolve({});
    }
    // Since the location service pipe is the first one opened and as soon as its opened this environment variable is set,
    // if the variable isn't set it means we're trying to get the socket dir for that pipe.
    let controllerPipeName = getLocationServicePipeName();
    if (!controllerPipeName) {
        controllerPipeName = url;
    }
    return getUnixSocketDir(url)
        .then(socketDir => {
        let dirCheck = q.defer();
        fs.access(socketDir, err => dirCheck.resolve(err ? false : true));
        return dirCheck.promise
            .then((exists) => {
            if (exists) {
                // delete socket dir
                unixSocketDirCreated = false;
                return q.nfcall(rmdirRecursive, socketDir);
            }
        });
    });
}
exports.deleteUnixSocketDir = deleteUnixSocketDir;
function getPropertyNoCase(obj, propertyName) {
    if (!obj || !propertyName) {
        return null;
    }
    if (obj.hasOwnProperty(propertyName)) {
        return obj[propertyName];
    }
    propertyName = propertyName.toLowerCase();
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop) && prop.toLowerCase() === propertyName) {
            return obj[prop];
        }
    }
}
exports.getPropertyNoCase = getPropertyNoCase;
function getPropertiesArray(obj) {
    let result = [];
    if (obj !== null && typeof obj === 'object') {
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                result.push(obj[prop]);
            }
        }
    }
    return result;
}
exports.getPropertiesArray = getPropertiesArray;
function getLogSessionKey() {
    let sessionKey = process.env[exports.UniqueLogSessionKeyEnvVarName];
    if (!sessionKey) {
        sessionKey = sha256(process.cwd().toLowerCase() + process.pid).toLowerCase().substring(0, 8);
        process.env[exports.UniqueLogSessionKeyEnvVarName] = sessionKey;
    }
    return sessionKey;
}
exports.getLogSessionKey = getLogSessionKey;
exports.ServiceHubLogDirectoryOverrideEnvironmentVariable = 'SERVICEHUBLOGDIRECTORYOVERRIDE';
exports.ServiceHubLogDisableDefaultLogLocationEnvVarName = 'DISABLEDEFAULTLOGLOCATION';
function getOverridenLogFilesDir() {
    // Check if there is an environment variable set to override the default log directory
    let logDirectoryOverride = process.env[exports.ServiceHubLogDirectoryOverrideEnvironmentVariable];
    // Ensure that the path is rooted and is not a file
    if (logDirectoryOverride && path.isAbsolute(logDirectoryOverride) && path.extname(logDirectoryOverride) == '') {
        return logDirectoryOverride;
    }
    return null;
}
exports.getOverridenLogFilesDir = getOverridenLogFilesDir;
function getDefaultLogFilesDir() {
    let disableDefaultLog = process.env[exports.ServiceHubLogDisableDefaultLogLocationEnvVarName];
    if (disableDefaultLog && disableDefaultLog.toUpperCase() == 'TRUE') {
        return null;
    }
    if (process.platform == 'win32') {
        return path.join(os.tmpdir(), 'servicehub', 'logs');
    }
    return path.join(getServiceHubBaseDirForUnix(), 'logs');
}
exports.getDefaultLogFilesDir = getDefaultLogFilesDir;
const locationServicePipeNameEnvironmentVariable = 'ServiceHubLocationServicePipeName';
function getLocationServicePipeName() {
    return process.env[locationServicePipeNameEnvironmentVariable];
}
exports.getLocationServicePipeName = getLocationServicePipeName;
function setLocationServicePipeName(pipeName) {
    process.env[locationServicePipeNameEnvironmentVariable] = pipeName || ''; // Process environment variables are always strings.
}
exports.setLocationServicePipeName = setLocationServicePipeName;
exports.maxPipeNameLength = 10;
function formatPipeName(pipeName) {
    if (process.platform === 'win32' || pipeName.length <= exports.maxPipeNameLength) {
        return pipeName;
    }
    else {
        return pipeName.substring(0, exports.maxPipeNameLength);
    }
}
exports.formatPipeName = formatPipeName;
function parseFileAsJson(filePath, encoding) {
    if (!filePath) {
        throw new ServiceHubError(ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('filePath'));
    }
    encoding = encoding || 'utf8';
    return q.ninvoke(fs, 'readFile', filePath, encoding)
        .then(json => {
        try {
            // BOM is not a valid JSON token, remove it.
            // Node doesn't do that automatically, see https://github.com/nodejs/node-v0.x-archive/issues/1918
            return JSON.parse(json.replace(/^\uFEFF/, ''));
        }
        catch (err) {
            throw new ServiceHubError(ErrorKind.JsonParseError, libraryResourceStrings_1.LibraryResourceStrings.errorParsingJson(filePath, err.message));
        }
    });
}
exports.parseFileAsJson = parseFileAsJson;
function combineTokens(ct1, ct2) {
    var combined = new vscode_jsonrpc_1.CancellationTokenSource();
    ct1.onCancellationRequested(() => combined.cancel());
    ct2.onCancellationRequested(() => combined.cancel());
    return combined.token;
}
exports.combineTokens = combineTokens;
// Private (non-exported) helper methods
let serviceHubBaseDirForUnix;
function getServiceHubBaseDirForUnix() {
    if (!serviceHubBaseDirForUnix) {
        serviceHubBaseDirForUnix = path.join(os.homedir(), '.ServiceHub');
    }
    return serviceHubBaseDirForUnix;
}

},{"./libraryResourceStrings":8,"./randomHexString":10,"errno-codes":13,"fs":undefined,"js-sha256":14,"mkdir-parents":15,"net":undefined,"os":undefined,"path":undefined,"q":16,"rmdir-recursive":17,"vscode-jsonrpc":32}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = exports.connectWithRetries = exports.ChannelConnectionFlags = void 0;
const net = require("net");
const q_1 = require("q");
const common_1 = require("./common");
const libraryResourceStrings_1 = require("./libraryResourceStrings");
const ec = require('errno-codes');
const defaultTimeoutMs = 5000;
const defaultRetryIntervalMs = 100;
// Keep in sync with the C# version at src\clr\utility\Microsoft.ServiceHub.Utility.Isolated\Server\ChannelConnectionFlags.cs
var ChannelConnectionFlags;
(function (ChannelConnectionFlags) {
    /// <summary>
    /// No modifier flags.
    /// </summary>
    ChannelConnectionFlags[ChannelConnectionFlags["None"] = 0] = "None";
    /// <summary>
    /// Continuously retry or wait for the server to listen for and respond to connection requests
    /// until it is canceled.
    /// This will ignore the value used for IConnectOptions.timeoutMs.
    /// </summary>
    ChannelConnectionFlags[ChannelConnectionFlags["WaitForServerToConnect"] = 1] = "WaitForServerToConnect";
})(ChannelConnectionFlags || (exports.ChannelConnectionFlags = ChannelConnectionFlags = {}));
function connectWithRetries(options) {
    if (!options) {
        throw new common_1.ServiceHubError(common_1.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variablesAreNotDefined('options'));
    }
    if (!options.url) {
        throw new common_1.ServiceHubError(common_1.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variablesAreNotDefined('options.url'));
    }
    const noRetryAfterDateTime = options.flags == ChannelConnectionFlags.WaitForServerToConnect ? undefined : new Date().getTime() + (options.timeoutMs || defaultTimeoutMs);
    const retryIntervalMs = options.retryIntervalMs || defaultRetryIntervalMs;
    return (0, common_1.getServerPipePath)(options.url)
        .then(serverPath => netConnectWithTimeout(serverPath, retryIntervalMs, noRetryAfterDateTime, options.cancellationToken));
}
exports.connectWithRetries = connectWithRetries;
function connect(url, isFullSocketPath = false) {
    if (!url) {
        throw new common_1.ServiceHubError(common_1.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variablesAreNotDefined('url'));
    }
    return (0, common_1.getServerPipePath)(url, isFullSocketPath)
        .then(serverPath => netConnect(serverPath));
}
exports.connect = connect;
function netConnect(pipePath) {
    const result = (0, q_1.defer)();
    const stream = net.connect(pipePath);
    stream.once('connect', () => {
        result.resolve(stream);
    });
    stream.once('error', (err) => {
        result.reject(err);
    });
    return result.promise;
}
function netConnectWithTimeout(pipePath, retryIntervalMs, noRetryAfterDateTime, cancellationToken) {
    return netConnect(pipePath)
        .catch(err => {
        // We check for ec.ENOENT for the case where there is no controller running yet. We also need to check for ec.ECONNREFUSED for the case where
        // stale unix domain sockets files prevent clients from connecting. In both cases the controller will eventually come online and so we keep
        // trying to connect in both cases until timeout.
        const retryErrorCode = (err && (err.code === ec.ENOENT.code || err.code === ec.ECONNREFUSED.code));
        const cancellationNotRequested = (!cancellationToken || !cancellationToken.isCancellationRequested);
        if (retryErrorCode && cancellationNotRequested && (!noRetryAfterDateTime || new Date().getTime() < noRetryAfterDateTime)) {
            return (0, q_1.delay)(retryIntervalMs)
                .then(() => netConnectWithTimeout(pipePath, retryIntervalMs, noRetryAfterDateTime, cancellationToken));
        }
        throw err;
    });
}

},{"./common":1,"./libraryResourceStrings":8,"errno-codes":13,"net":undefined,"q":16}],3:[function(require,module,exports){
"use strict";
// Keep in sync with ..\clr\src\Microsoft.ServiceHub.Client\ExitCode.cs
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Exit code from a Node ServiceHub process.
 * Range 1-19 and 128+ is used by Node itself.
 * Range 20 - 127 is used by ServiceHub.
 * Non-node ServiceHub hosts are supposed to use the same ServiceHub exit codes in ServiceHub range 20-127.
 * */
var ExitCode;
(function (ExitCode) {
    /** Successful termination, no error */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    // Node error codes
    /** There was an uncaught exception, and it was not handled by a domain or an 'uncaughtException' event handler. */
    ExitCode[ExitCode["NodeUncaughtFatalException"] = 1] = "NodeUncaughtFatalException";
    /** The JavaScript source code internal in Node.js's bootstrapping process caused a parse error.
     * This is extremely rare, and generally can only happen during development of Node.js itself. */
    ExitCode[ExitCode["NodeInternalJavaScriptParseError"] = 3] = "NodeInternalJavaScriptParseError";
    /** The JavaScript source code internal in Node.js's bootstrapping process failed to return a function value when evaluated.
     * This is extremely rare, and generally can only happen during development of Node.js itself. */
    ExitCode[ExitCode["NodeInternalJavaScriptEvaluationFailure"] = 4] = "NodeInternalJavaScriptEvaluationFailure";
    /** There was a fatal unrecoverable error in V8. Typically a message will be printed to stderr with the prefix FATAL ERROR */
    ExitCode[ExitCode["NodeFatalError"] = 5] = "NodeFatalError";
    /** There was an uncaught exception, but the internal fatal exception handler function was somehow set to a non-function, and could not be called. */
    ExitCode[ExitCode["NodeNonFunctionInternalExceptionHandler"] = 6] = "NodeNonFunctionInternalExceptionHandler";
    /** There was an uncaught exception, and the internal fatal exception handler function itself threw an error while attempting to handle it.
     * This can happen, for example, if a process.on('uncaughtException') or domain.on('error') handler throws an error. */
    ExitCode[ExitCode["NodeInternalExceptionHandlerRunTimeFailure"] = 7] = "NodeInternalExceptionHandlerRunTimeFailure";
    /** Either an unknown option was specified, or an option requiring a value was provided without a value. */
    ExitCode[ExitCode["NodeInvalidArgument"] = 9] = "NodeInvalidArgument";
    /** The JavaScript source code internal in Node.js's bootstrapping process threw an error when the bootstrapping function was called.
     * This is extremely rare, and generally can only happen during development of Node.js itself. */
    ExitCode[ExitCode["NodeInternalJavaScriptRunTimeFailure"] = 10] = "NodeInternalJavaScriptRunTimeFailure";
    /** The --debug and/or --debug-brk options were set, but an invalid port number was chosen. */
    ExitCode[ExitCode["NodeInvalidDebugArgument"] = 12] = "NodeInvalidDebugArgument";
    // ServiceHub exit codes
    // -------------------------------------------------------------------------------------------------------
    /** Invalid command line argument for servicehub process */
    ExitCode[ExitCode["InvalidArgument"] = 20] = "InvalidArgument";
    /** Cannot start a new pipe server because the supplied pipe address is already in use.
     * This may happen when starting a controller where there is already a controller running */
    ExitCode[ExitCode["ErrorStartingServerPipeInUse"] = 21] = "ErrorStartingServerPipeInUse";
    /** Cannot start a new pipe server due to some error */
    ExitCode[ExitCode["ErrorStartingServer"] = 22] = "ErrorStartingServer";
    /** Uncaught exception */
    ExitCode[ExitCode["UncaughtException"] = 23] = "UncaughtException";
    /** Error shutting down */
    ExitCode[ExitCode["ShutdownError"] = 24] = "ShutdownError";
    /** Configuration error in servicehub.config.json */
    ExitCode[ExitCode["ConfigurationError"] = 25] = "ConfigurationError";
    /** Cannot start a new controller process because one is already running */
    ExitCode[ExitCode["ControllerAlreadyRunning"] = 26] = "ControllerAlreadyRunning";
    /** Cannot start a new controller process because the dotnet runtime is not installed */
    ExitCode[ExitCode["DotnetRuntimeNotInstalled"] = -2147450749] = "DotnetRuntimeNotInstalled";
    // Signals
    // -------------------------------------------------------------------------------------------------------
    /** Node process was terminated by SIGHUP signal (when the console window is closed)*/
    ExitCode[ExitCode["SigHup"] = 129] = "SigHup";
    /** Node process was terminated by SIGINT signal (by pressing Ctrl-C in the console) */
    ExitCode[ExitCode["SigInt"] = 130] = "SigInt";
    /** Node process was terminated by SIGKILL signal */
    ExitCode[ExitCode["SigKill"] = 137] = "SigKill";
    /** Node  process was terminated by SIGTERM signal */
    ExitCode[ExitCode["SigTerm"] = 143] = "SigTerm";
    /** Node  process was terminated by SIGBREAK signal (by pressing Ctrl-Break in the console) */
    ExitCode[ExitCode["SigBreak"] = 149] = "SigBreak";
})(ExitCode || (ExitCode = {}));
exports.default = ExitCode;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Host = exports.HostConfiguration = void 0;
const q = require("q");
const e = require("events");
const sm = require("./serviceManager");
const c = require("./common");
const jsonRpc_1 = require("./jsonRpc");
const log = require("./logger");
const exitCode_1 = require("./exitCode");
const serviceModuleInfo_1 = require("./serviceModuleInfo");
const libraryResourceStrings_1 = require("./libraryResourceStrings");
const connect_1 = require("./connect");
const hostLogPrefix = 'hubHostNode';
class HostConfiguration {
}
exports.HostConfiguration = HostConfiguration;
class Host extends e.EventEmitter {
    constructor(settings) {
        super();
        this.pid = process.pid;
        if (!settings) {
            throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variablesAreNotDefined('hostSettings'));
        }
        this.settings = settings;
        this.logger = settings.logger || new log.Logger(hostLogPrefix);
        this.logger.info(libraryResourceStrings_1.LibraryResourceStrings.startingHubHost(settings.hostId, settings.controllerPipeName));
        let rpcMethodMappings = [
            { targetMethod: 'initializeHost', remoteMethod: 'InitializeHostAsync' },
            { targetMethod: 'startService', remoteMethod: 'StartServiceAsync' },
            { targetMethod: 'cancelServiceRequest', remoteMethod: 'CancelServiceRequestAsync' },
            { targetMethod: 'exit', remoteMethod: 'ExitAsync' }
        ];
        this.endPoint = (0, connect_1.connect)(settings.controllerPipeName)
            .then(stream => new jsonRpc_1.JsonRpcConnection(stream, this.logger))
            .then(connection => {
            rpcMethodMappings.forEach(methodMapping => {
                let targetMethod = this[methodMapping.targetMethod];
                if (!targetMethod)
                    throw new Error(`Method not found ${methodMapping.targetMethod}.`);
                connection.onRequest(methodMapping.remoteMethod, targetMethod.bind(this));
            });
            connection.listen();
            return connection;
        });
        this.serviceManager = new sm.ServiceManager(this.logger);
        this.serviceManager.on(sm.ServiceManager.ServicesStartedEvent, this.onServiceManagerServicesStarted.bind(this));
        this.serviceManager.on(sm.ServiceManager.ServicesEndedEvent, this.onServiceManagerServicesEnded.bind(this));
    }
    getHostId() {
        return this.settings.hostId;
    }
    initializeHost(hostConfiguration, cancellationToken) {
        this.hostConfiguration = hostConfiguration;
        return this.getHostId();
    }
    startService(info, serializedServiceActivationOptions, cancellationToken) {
        if (this.shutdown) {
            const message = libraryResourceStrings_1.LibraryResourceStrings.startServiceRequestRejected(info.name);
            this.logger.error(message);
            return q.reject(new Error(message));
        }
        this.logger.info(libraryResourceStrings_1.LibraryResourceStrings.startServiceRequestReceived(info.name));
        let smi = new serviceModuleInfo_1.ServiceModuleInfo(info);
        return this.serviceManager.startService(smi)
            .then((serviceEndPoint) => {
            this.logger.info(libraryResourceStrings_1.LibraryResourceStrings.serviceStarted(smi.name, process.pid.toString(), serviceEndPoint));
            return serviceEndPoint;
        });
    }
    cancelServiceRequest(pipeName) {
        c.serverManager.cancelServiceRequest(pipeName);
    }
    exit() {
        if (this.shutdown) {
            this.logger.error(libraryResourceStrings_1.LibraryResourceStrings.ignoringDuplicateExit);
            return;
        }
        this.shutdown = true;
        this.logger.info(libraryResourceStrings_1.LibraryResourceStrings.exitCommandReceived);
        this.endPoint
            .then(e => {
            e.dispose();
            return c.serverManager.stop();
        })
            .done(() => this.emitExit(exitCode_1.default.Success), (reason) => {
            this.logger.error(libraryResourceStrings_1.LibraryResourceStrings.closeHubStreamFailed(reason.message || reason));
            this.emitExit(exitCode_1.default.ShutdownError);
        });
    }
    emitExit(exitCode) {
        this.emit('exit', exitCode);
    }
    onServiceManagerServicesStarted(name, stream) {
        this.endPoint
            .then(e => {
            if (this.shutdown) {
                this.logger.error(libraryResourceStrings_1.LibraryResourceStrings.serviceStartedAfterHostShutDown(name));
                stream.end();
            }
            else {
                e.sendNotification('HostServicesStartedAsync', [this.settings.hostId]);
            }
        })
            .catch(reason => this.logger.error(libraryResourceStrings_1.LibraryResourceStrings.notifyHubControllerForServicesStartedFailed(reason.message || reason)))
            .done();
    }
    onServiceManagerServicesEnded() {
        this.endPoint
            .then(e => {
            if (!this.shutdown) {
                e.sendNotification('HostServicesEndedAsync', [this.settings.hostId]);
            }
        })
            .catch(reason => this.logger.error(libraryResourceStrings_1.LibraryResourceStrings.notifyHubControllerForServicesStartedFailed(reason.message || reason)))
            .done();
    }
}
exports.Host = Host;

},{"./common":1,"./connect":2,"./exitCode":3,"./jsonRpc":7,"./libraryResourceStrings":8,"./logger":9,"./serviceManager":11,"./serviceModuleInfo":12,"events":undefined,"q":16}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const h = require("../host");
const c = require("../common");
const exitCode_1 = require("../exitCode");
const hostResourceStrings_1 = require("./hostResourceStrings");
c.setOsLocale([hostResourceStrings_1.HostResourceStrings.config]);
if (process.argv.length < 4) {
    console.log(hostResourceStrings_1.HostResourceStrings.usage('node HubHost.js <HostId> <Controller Pipe Name>'));
    process.exit(exitCode_1.default.InvalidArgument);
}
const hostId = process.argv[2];
const controllerPipeName = process.argv[3];
const host = new h.Host({ hostId, controllerPipeName });
host.once('exit', (code) => process.exit(code));

},{"../common":1,"../exitCode":3,"../host":4,"./hostResourceStrings":6}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostResourceStrings = void 0;
const path = require("path");
const defaultLocale = 'en';
// nls.config(...)() call below will be rewritten to nls.config(...)(__filename) in build time where __filename is supposed to '*ResourceStrings.js'
// so that nls can find *ResourceStrings.nls.json.
// Redefining __filename here because when using browserify, otherwise the __filename will point to browserified file instead of this file.
// TODO: Localization is broken in the Node sources right now. Tracked by Task 1327915.
// let localize = nls.config({locale: defaultLocale, cacheLanguageResolution: false})();
let localize = (metadata, value, ...args) => {
    for (let index = 0; index < args.length; index++) {
        value = value.replace(`{${index}}`, args[index]);
    }
    return value;
};
class HostResourceStrings {
    static config(locale, cache = false) {
        // nls.config(...)() call below will be rewritten to nls.config(...)(__filename) in build time where __filename is supposed to '*ResourceStrings.js'
        // so that nls can find *ResourceStrings.nls.json.
        // Redefining __filename here because when using browserify, otherwise the __filename will point to browserified file instead of this file.
        var __filename = path.join(__dirname, 'hostResourceStrings.js');
        // TODO: Localization is broken in the Node sources right now. Tracked by Task 1327915.
        // localize = nls.config({locale: locale, cacheLanguageResolution: cache})();
    }
    static usage(explaination) {
        return localize({
            key: 'Usage',
            comment: [
                'Help message for usage of a console command',
                '{0}: explanation of usage',
                'E.g. usage: node HubHost.js <HostId>',
                'Everything after colon in above example is explaining how to use a console command'
            ]
        }, 'usage: {0}', explaination);
    }
}
exports.HostResourceStrings = HostResourceStrings;

},{"path":undefined}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRpcConnection = exports.Trace = exports.CancellationTokenSource = exports.CancellationToken = void 0;
const q = require("q");
const vscode = require("vscode-jsonrpc");
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
Object.defineProperty(exports, "Trace", { enumerable: true, get: function () { return vscode_jsonrpc_1.Trace; } });
Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function () { return vscode_jsonrpc_1.CancellationToken; } });
Object.defineProperty(exports, "CancellationTokenSource", { enumerable: true, get: function () { return vscode_jsonrpc_1.CancellationTokenSource; } });
const logger_1 = require("./logger");
const ec = require('errno-codes');
class JsonRpcConnection {
    constructor(stream, logger) {
        this.stream = stream;
        this.logger = logger;
        this.requests = {};
        this.requestCount = 0;
        const readable = new vscode.ReadableStreamMessageReader(new ReadableStreamWrapper(stream));
        const writable = new vscode.WriteableStreamMessageWriter(new WritableStreamWrapper(stream));
        this.connection = vscode.createMessageConnection(readable, writable, logger, {});
        this.onClose = this.connection.onClose;
        this.connection.onClose(this.onConnectionClosed, this);
        this.onError = this.connection.onError;
        if (logger && logger.isEnabled(logger_1.LogLevel.Verbose)) {
            this.connection.trace(vscode_jsonrpc_1.Trace.Verbose, logger);
        }
    }
    static attach(stream, logger, target, methodNames) {
        let connection = new JsonRpcConnection(stream, logger);
        if (target) {
            connection.onRequestInvokeTarget(target, ...methodNames);
        }
        connection.listen();
        return connection;
    }
    listen() {
        this.throwIfClosed();
        this.throwIfListening();
        this.connection.listen();
        this.listening = true;
    }
    sendRequest(method, params, token) {
        this.throwIfNotListening();
        if (this.closed) {
            return q.reject(JsonRpcConnection.createStreamClosedError(method));
        }
        const deferred = q.defer();
        const requestIndex = this.requestCount++;
        this.requests[requestIndex] = { method, deferred };
        this.connection
            .sendRequest(method, vscode_jsonrpc_1.ParameterStructures.byPosition, ...this.ensureArray(params), token !== null && token !== void 0 ? token : vscode.CancellationToken.None)
            .then(value => {
            deferred.resolve(value);
            delete this.requests[requestIndex];
        }, error => {
            deferred.reject(error);
            delete this.requests[requestIndex];
        });
        return deferred.promise;
    }
    sendNotification(method, params) {
        if (this.closed) {
            return q.reject(JsonRpcConnection.createStreamClosedError(method));
        }
        this.connection.sendNotification(method, ...this.ensureArray(params));
        // Eventually we'll want to return a promise that is fulfilled after transmission has completed.
        return q(undefined);
    }
    onRequest(method, handler) {
        this.throwIfListening();
        this.throwIfClosed();
        this.connection.onRequest(method, (...args) => handler(...args));
        this.connection.onNotification(method, (...args) => handler(...args));
    }
    onRequestInvokeTarget(target, ...methodNames) {
        this.throwIfListening();
        this.throwIfClosed();
        if (!methodNames || methodNames.length === 0) {
            methodNames = getMethodNamesOf(target);
        }
        methodNames.forEach(methodName => {
            let method = target[methodName];
            if (!method)
                throw new Error(`Method not found ${methodName}.`);
            this.onRequest(methodName, method.bind(target));
        });
    }
    dispose() {
        // Reject any pending outbound requests that haven't resolved already, since we won't get responses here on out.
        // TODO: code here, or get fix for https://github.com/Microsoft/vscode-languageserver-node/issues/65
        this.stream.end();
        this.connection.dispose();
    }
    ensureArray(args) {
        if (!args) {
            return [];
        }
        else if (!Array.isArray(args)) {
            return [args];
        }
        return args;
    }
    cancelPendingRequests(reason) {
        for (let propName in this.requests) {
            if (this.requests.hasOwnProperty(propName)) {
                const request = this.requests[propName];
                request.deferred.reject(reason || JsonRpcConnection.createStreamClosedError(request.method));
            }
        }
        this.requests = {};
    }
    throwIfNotListening() {
        if (!this.listening) {
            throw new Error('Call listen() first.');
        }
    }
    throwIfListening() {
        if (this.listening) {
            throw new Error('listen() has already been called.');
        }
    }
    throwIfClosed(method) {
        if (this.closed) {
            throw JsonRpcConnection.createStreamClosedError(method);
        }
    }
    onConnectionClosed() {
        this.closed = true;
        this.cancelPendingRequests();
    }
    static createStreamClosedError(method) {
        const message = (method ? `Cannot execute '${method}'. ` : '') + 'The underlying stream has closed.';
        const result = new Error(message);
        result.code = ec.ENOENT.code;
        return result;
    }
}
exports.JsonRpcConnection = JsonRpcConnection;
function getMethodNamesOf(target) {
    let methods = [];
    for (let propertyName in target) {
        let propertyValue = target[propertyName];
        if (typeof propertyValue === 'function') {
            methods.push(propertyName);
        }
    }
    return methods;
}
class ReadableStreamWrapper {
    constructor(stream) {
        this.stream = stream;
    }
    onData(listener) {
        this.stream.on('data', listener);
        return vscode.Disposable.create(() => this.stream.off('data', listener));
    }
    onClose(listener) {
        this.stream.on('close', listener);
        return vscode.Disposable.create(() => this.stream.off('close', listener));
    }
    onError(listener) {
        this.stream.on('error', listener);
        return vscode.Disposable.create(() => this.stream.off('error', listener));
    }
    onEnd(listener) {
        this.stream.on('end', listener);
        return vscode.Disposable.create(() => this.stream.off('end', listener));
    }
}
class WritableStreamWrapper {
    constructor(stream) {
        this.stream = stream;
    }
    onClose(listener) {
        this.stream.on('close', listener);
        return vscode.Disposable.create(() => this.stream.off('close', listener));
    }
    onError(listener) {
        this.stream.on('error', listener);
        return vscode.Disposable.create(() => this.stream.off('error', listener));
    }
    onEnd(listener) {
        this.stream.on('end', listener);
        return vscode.Disposable.create(() => this.stream.off('end', listener));
    }
    write(data, encoding) {
        return new Promise((resolve, reject) => {
            const callback = (error) => {
                if (error === undefined || error === null) {
                    resolve();
                }
                else {
                    reject(error);
                }
            };
            if (typeof data === 'string') {
                this.stream.write(data, encoding, callback);
            }
            else {
                this.stream.write(data, callback);
            }
        });
    }
    end() {
        this.stream.end();
    }
}

},{"./logger":9,"errno-codes":13,"q":16,"vscode-jsonrpc":32}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryResourceStrings = void 0;
const c = require("./common");
const path = require("path");
const defaultLocale = 'en';
// nls.config(...)() call below will be rewritten to nls.config(...)(__filename) in build time where __filename is supposed to '*ResourceStrings.js'
// so that nls can find *ResourceStrings.nls.json.
// Redefining __filename here because when using browserify, otherwise the __filename will point to browserified file instead of this file.
var __filename = path.join(__dirname, 'libraryResourceStrings.js');
// TODO: Localization is broken in the Node sources right now. Tracked by Task 1327915.
// let localize = nls.config({locale: defaultLocale, cacheLanguageResolution: false})();
let localize = (metadata, value, ...args) => {
    for (let index = 0; index < args.length; index++) {
        value = value.replace(`{${index}}`, args[index]);
    }
    return value;
};
class LibraryResourceStrings {
    static init() {
        if (!LibraryResourceStrings.isOsLocaleSet) {
            c.setOsLocale([LibraryResourceStrings.config]);
            LibraryResourceStrings.isOsLocaleSet = true;
        }
    }
    static config(locale, cache = false) {
        // nls.config(...)() call below will be rewritten to nls.config(...)(__filename) in build time where __filename is supposed to '*ResourceStrings.js'
        // so that nls can find *ResourceStrings.nls.json.
        // Redefining __filename here because when using browserify, otherwise the __filename will point to browserified file instead of this file.
        let __filename = path.join(__dirname, 'libraryResourceStrings.js');
        // TODO: Localization is broken in the Node sources right now. Tracked by Task 1327915.
        // localize = nls.config({locale: locale, cacheLanguageResolution: cache})();
    }
    static variablesAreNotDefined(variable) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Variables.are.Not.Defined',
            comment: [
                'Error message for variables not defined.'
            ]
        }, '{0} are not defined', variable);
    }
    static variableIsNotDefined(variable) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Variable.Is.Not.Defined',
            comment: [
                'Error message for a variable not defined.'
            ]
        }, '{0} is not defined', variable);
    }
    static startingServer(name, url, serverPath) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Starting.Server',
            comment: [
                'Logging message for starting a server.',
                '{0}: server name.',
                '{1}: server url. E.g. http://foo.',
                '{2}: server local path. E.g. c:\foo\bar.'
            ]
        }, 'Starting server \'{0}\' at \'{1}\' (at \'{2}\').', name, url, serverPath);
    }
    static stoppedServer(name, url) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Stopped.Server',
            comment: [
                'Logging message for stopped a server.',
                '{0}: server name.',
                '{1}: server url. E.g. http://foo.'
            ]
        }, 'Stopped server  \'{0}\' at \'{1}\'.', name, url);
    }
    static urlShouldStartWith(scheme) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Url.Should.Start.With',
            comment: [
                'Error message for url invalid in prefix.',
                '\'url\' here is a argument, don\'t translate it.',
                '{0}: scheme of a valid url.'
            ]
        }, 'url should start with \'{0}\'', scheme);
    }
    static urlHasNoPipeName(scheme) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Url.Has.No.Pipe.Name',
            comment: [
                'Error message for url invalid (not containing a pipe name).',
                '\'url\' here is a argument, don\'t translate it.',
                '{0}: scheme of a valid url.'
            ]
        }, 'url has no pipe name after \'{0}\'', scheme);
    }
    static noPipeName(scheme) {
        LibraryResourceStrings.init();
        return localize({
            key: 'No.Pipe.Name',
            comment: [
                'Error message for a string not containing a pipe name.',
                '{0}: scheme of a valid pipe.'
            ]
        }, 'There is no pipe name after \'{0}\'', scheme);
    }
    static errorParsingJson(filePath, err) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Error.Parsing.Json',
            comment: [
                'Error message for parsing JSON from file failed.',
                'JSON is a file format, don\'t translate it.',
                '{0}: file path.',
                '{1}: error message.'
            ]
        }, 'Error parsing JSON from file {0}: {1}', filePath, err);
    }
    static serviceHubConfigJsonNotFound(fileName, dir) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Service.Hub.Config.Json.Not.Found',
            comment: [
                'Error message for not finding servicehub.config.json.',
                'Don\'t translate servicehub.config.json.',
                '{0}: config file name.',
                '{1}: directories.'
            ]
        }, 'Could not find {0} in {1} and in any of its parent directories', fileName, dir);
    }
    static loading(path) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Loading',
            comment: [
                'Logging message for loading a config file from specific path.',
                '{0}: path of config file.'
            ]
        }, 'Loading \'{0}\'', path);
    }
    static noValueForProperty(fileName, dir, property) {
        LibraryResourceStrings.init();
        return localize({
            key: 'No.Value.For.Property',
            comment: [
                'Error message for a specific property doesn\'t have a value in a config file.',
                '{0}: config file name',
                '{1}: path of config file.',
                '{2}: property name that has error.'
            ]
        }, '{0} in {1} does not have a value for {2} property', fileName, dir, property);
    }
    static get failedGetSaltString() {
        LibraryResourceStrings.init();
        return localize({
            key: 'Failed.Get.Salt.String',
            comment: [
                'Error message for getting a user specific salt string failed.',
            ]
        }, 'Failed to get user specific salt string.');
    }
    static get noLocalAppDataFolder() {
        LibraryResourceStrings.init();
        return localize({
            key: 'No.LocalAppData.Folder',
            comment: [
                'Error message for the LocalAppData environment variable not being set.'
            ]
        }, 'The LocalAppData environment variable does not exist and is needed to initialize ServiceHub.');
    }
    static multipleFileFound(dir, files) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Multiple.File.Found',
            comment: [
                'Error message for more than one files found when only one expected.',
                '{0}: Directory where files are found.',
                '{1}: foud files.'
            ]
        }, 'Only one file is expected. Actually more were found in \'{0}\': {1}', dir, files);
    }
    static startingHubHost(hostId, pipeName) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Starting.Hub.Host',
            comment: [
                'Logging message for starting a hub host.',
                '{0}: hub host ID that is starting.',
                '{1}: pipe name that host uses for communication.'
            ]
        }, 'Starting hub host \'{0}\'. Host callback pipe: \'{1}\'', hostId, pipeName);
    }
    static startServiceRequestRejected(serviceName) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Start.Service.Request.Rejected',
            comment: [
                'Logging message for request of starting a service been rejected.',
                '{0}: service name.'
            ]
        }, 'startService() request for service \'{0}\' rejected because it was received after shutdown', serviceName);
    }
    static startServiceRequestReceived(serviceName) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Start.Service.Request.Received',
            comment: [
                'Logging message for request of starting a service been received.',
                '{0}: service name.'
            ]
        }, 'Node host received start request for service \'{0}\'', serviceName);
    }
    static serviceStarted(serviceName, pid, endPoint) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Service.Started',
            comment: [
                'Logging message for starting a service succeeded.',
                '{0}: service name.',
                '{1}: service process Id.',
                '{2}: service end point.'
            ]
        }, 'Successfully started service \'{0}\'. PID: \'{1}\'. Service Endpoint: \'{2}\'', serviceName, pid, endPoint);
    }
    static get ignoringDuplicateExit() {
        LibraryResourceStrings.init();
        return localize('Ignoring.Duplicate.Exit', 'Ignoring duplicate exit command.');
    }
    static get exitCommandReceived() {
        LibraryResourceStrings.init();
        return localize('Exit.Command.Received', 'Hub host recieved exit command.');
    }
    static closeHubStreamFailed(error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Close.Hub.Stream.Failed',
            comment: [
                'Logging message for closing a hub stream failed with error.',
                '{0}: error message.'
            ]
        }, 'Error closing hub stream: {0}', error);
    }
    static serviceStartedAfterHostShutDown(serviceName) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Service.Started.After.Host.Shut.Down',
            comment: [
                '{0}: service name.'
            ]
        }, 'Service \'{0}\' has started after host shutdown initiated. The service will shut down.', serviceName);
    }
    static notifyHubControllerForServicesStartedFailed(error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Notify.Hub.Controller.For.Services.Started.Failed',
            comment: [
                'Logging message for notifying hub controller that hub services started failed with error.',
                '{0}: error message.'
            ]
        }, 'Error notifying hub controller that host services started: {0}', error);
    }
    static notifyHubControllerForServicesEndedFailed(error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Notify.Hub.Controller.For.Services.Ended.Failed',
            comment: [
                'Logging message for notifying hub controller that hub services ended failed with error.',
                '{0}: error message.'
            ]
        }, 'Error notifying hub controller that host services ended: {0}', error);
    }
    static get serviceNameNotSpecified() {
        LibraryResourceStrings.init();
        return localize('Service.Name.Not.Specified', 'Service name is not specified');
    }
    static locatingService(serviceName, clientId) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Locating.Service',
            comment: [
                'Logging message for locating a service.',
                '{0}: service name.',
                '{1}: client Id who is requesting the locating action.'
            ]
        }, 'Locating service \'{0}\' requested by {1}', serviceName, clientId);
    }
    static serviceLocated(serviceId, serviceLocation, clientId) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Service.Located',
            comment: [
                'Logging message for service locating completed.',
                '{0}: service Id.',
                '{1}: service location.',
                '{2}: client Id who is requesting the locating action.'
            ]
        }, 'Located service \'{0}\' at \'{1}\' requested by {2}', serviceId, serviceLocation, clientId);
    }
    static startingServiceFailed(serviceId, clientId, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Starting.Service.Failed',
            comment: [
                'Logging message for service starting request failed.',
                '{0}: service Id.',
                '{1}: client Id who is requesting the service.',
                '{2}: error message.'
            ]
        }, 'Error starting service \'{0}\' requested by {1}: {2}', serviceId, clientId, error);
    }
    static get forceControllerShutDown() {
        LibraryResourceStrings.init();
        return localize('Force.Controller.Shut.Down', 'Forced hub controller shutdown.');
    }
    static locatingServcieError(discoveryService, service, error, callStack) {
        LibraryResourceStrings.init();
        return localize({
            key: 'locating.Servcie.Error',
            comment: [
                'Logging message for error when discovery service is locating a service.',
                '{0}: discovery service who is locating services.',
                '{1}: the service that discovery service is locating.',
                '{2}: error message.',
                '{3}: error call stack'
            ]
        }, 'Discovery service \'{0}\' error locating service \'{1}\': {2} at {3}', discoveryService, service, error, callStack);
    }
    static disconnectingDiscoveryServiceFailed(discoveryService, error, callStack) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Disconnecting.Discovery.Service.Failed',
            comment: [
                'Logging message for error when disconnecting from discovery service.',
                '{0}: discovery service who is locating services.',
                '{1}: error message.',
                '{2}: error call stack'
            ]
        }, 'Error disconnecting from \'{0}\' discovery service: {1} {2}', discoveryService, error, callStack);
    }
    static hostTypeNotFoundInLocation(hostType, location, additionalLocation) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Type.Not.Found.In.Location',
            comment: [
                'Logging message for can\'t find specific host type in locations provided.',
                '{0}: host type.',
                '{1}: location to find host type.',
                '{2}: additional location to find host type.'
            ]
        }, 'Cannot find host type \'{0}\' in \'{1}\', or in \'{2}\'', hostType, location, additionalLocation);
    }
    static hostTypeNotFound(hostType, location) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Type.Not.Found',
            comment: [
                'Logging message for can\'t find specific host type in locations provided.',
                '{0}: host type.',
                '{1}: location to find host type.'
            ]
        }, 'Cannot find host type \'{0}\' in \'{1}\'', hostType, location);
    }
    static loadingHostInfo(host, filePath) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Loading.Host.Info',
            comment: [
                '{0}: host name.',
                '{1}: path to load host from.',
            ]
        }, 'Loading host info for \'{0}\' from \'{1}\'', host, filePath);
    }
    static cannotResolveHost(host, filePath, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Cannot.Resolve.Host',
            comment: [
                'Logging message for can\'t resolve and load host info.',
                '{0}: host name.',
                '{1}: path to load host from.',
                '{2}: error message.'
            ]
        }, 'Cannot resolve and load host info for \'{0}\' from \'{1}\': {2}', host, filePath, error);
    }
    static hostInfoNotDefined(path) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Info.Not.Defined',
            comment: [
                'Error message for parameter a variable not defined.',
                '{0}: path where host is supposed to be found.'
            ]
        }, 'Host info in \'{0}\' is not defined', path);
    }
    static hostInfoInvalid(path) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Info.Invalid',
            comment: [
                'Error message for host info is invalid.',
                '{0}: path of host file.'
            ]
        }, 'Host info at \'{0}\' does not have hostExecutable:string and hostArgs:string[] members', path);
    }
    static hostInfoContainsReservedProperty(path) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Info.Contains.Reserved.Property',
            comment: [
                'Error message for host info contains a reserved property.',
                '{0}: path of host file.'
            ]
        }, 'Host info at \'{0}\' contains reserved \'filePath\' property', path);
    }
    static firstTimeLoadingService(serviceName) {
        LibraryResourceStrings.init();
        return localize({
            key: 'First.Time.Loading.Service',
            comment: [
                'Logging message for loading service for the first time.',
                '{0}: service name.'
            ]
        }, 'Service \'{0}\' has not been loaded before. Loading now.', serviceName);
    }
    static launchingHostWithCmd(host, cmd) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Launching.Host.With.Cmd',
            comment: [
                'Logging message for launching host with command line.',
                '{0}: host name.',
                '{1}: command that is used to launch hub host.'
            ]
        }, 'Launching \'{0}\' hub host with command line: \'{1}\'', host, cmd);
    }
    static hostLaunched(host, pid) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Launched',
            comment: [
                'Logging message for host launched.',
                '{0}: host name.',
                '{1}: host process Id.'
            ]
        }, 'Launched \'{0}\' hub host. PID: {1}', host, pid);
    }
    static hostExited(host, pid) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Exited',
            comment: [
                'Logging message for host exited. this can be combined with \'Host.Exited.With.Code\' or \'Host.Exited.With.Signal\'',
                '{0}: host name.',
                '{1}: host process Id.'
            ]
        }, 'Hub host \'{0}\', PID: {1} exited.', host, pid);
    }
    static hostExitedWithCode(code, exitCode) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Exited.With.Code',
            comment: [
                'Logging message for host exited with code. this MUST be used with \'Host.Exited\'',
                '{0}: code.',
                '{1}: exit code.'
            ]
        }, ' code: \'{0}\'{1}.', code, exitCode);
    }
    static hostExitedWithSignal(signal) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Exited.With.Signal',
            comment: [
                'Logging message for host exited with code. this MUST be used with \'Host.Exited\'',
                '{0}: signal.',
            ]
        }, ' signal: \'{0}\'.', signal);
    }
    static startingHostError(executable, hostId, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Starting.Host.Error',
            comment: [
                'Logging message for error when starting hub host.',
                '{0}: executable.',
                '{1}: host Id.',
                '{2}: error message.'
            ]
        }, 'Error starting hub host {0}\'{1}\': \'{2}\'.', executable, hostId, error);
    }
    static hostInfoNotFound(id) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Info.Not.Found',
            comment: [
                'Logging message for failed to find a HostInfo object. Don\'t translate \'HostInfo\'',
                '{0}: HostInfo object id.',
            ]
        }, 'Failed to find a HostInfo object for \'{0}\' when some host connected', id);
    }
    static getHostIdFailed(error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Get.Host.Id.Failed',
            comment: [
                'Logging message for failed to get a host id.',
                '{0}: error message.',
            ]
        }, 'Could not get host id of a newly created host: {0}', error);
    }
    static get moreThanOneHostPending() {
        LibraryResourceStrings.init();
        return localize({
            key: 'More.Than.One.Host.Pending',
            comment: [
                'Logging message for more than one host is pending.',
            ]
        }, 'More than one host is pending when one of the hosts failed to provide host id');
    }
    static unknownHost(hostId) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Unknown.Host',
            comment: [
                '{0}: host Id.'
            ]
        }, 'Unknown host \'{0}\'', hostId);
    }
    static stoppingHost(hostId, pid, reason) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Stopping.Host',
            comment: [
                '{0}: host Id.',
                '{1}: host process Id.',
                '{2}: reason to stop.'
            ]
        }, 'Stopping host \'{0}\' PID: {1} due to {2}', hostId, pid, reason);
    }
    static get cannotStopLocationService() {
        LibraryResourceStrings.init();
        return localize('Cannot.Stop.Location.Service', 'Cannot stop location service from a proxy');
    }
    static errorDecoding(error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Error.Decoding',
            comment: [
                '{0}: error message.'
            ]
        }, 'Error decoding string: {0}', error);
    }
    static logConfig(config) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Log.Config',
            comment: [
                '{Locked}' // Suppress translation
            ]
        }, 'Log configuration: {0}', config);
    }
    static get messageAt() {
        LibraryResourceStrings.init();
        return localize({
            key: 'Message.At',
            comment: [
                'Used as connection between a message body and where it appears.',
                'E.g. \'hub controller is closed\' at \'hubController.close();\''
            ]
        }, 'at');
    }
    static get lengthCannotBeNegative() {
        LibraryResourceStrings.init();
        return localize({
            key: 'Length.Cannot.Be.Negative',
            comment: [
                'Length is a variable name, don\'t translate it.',
            ]
        }, 'Length must not be negative');
    }
    static get noFolderSpecified() {
        LibraryResourceStrings.init();
        return localize({
            key: 'No.Folder.Specified',
            comment: [
                'Service Hub is our product name',
            ]
        }, 'Service Hub config has no services folder specified');
    }
    static cannotFindServiceModuleFile(filePattern, folder) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Cannot.Find.Service.Module.File',
            comment: [
                'Error message for not finding service module info file for a specific file pattern in a folder.',
                '{0}: file pattern.',
                '{1}: folder patrh.'
            ]
        }, 'Cannot find service module info file \'{0}\' in \'{1}\'', filePattern, folder);
    }
    static cannotFindServiceModuleFileWithReason(filePattern, folder, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Cannot.Find.Service.Module.File.With.Reason',
            comment: [
                'Error message for using discovery services to find a service module failed.',
                '{0}: file pattern.',
                '{1}: folder patrh.',
                '{2}: error message'
            ]
        }, 'Cannot find service module info file \'{0}\' in \'{1}\', using discovery services failed: {2}', filePattern, folder, error);
    }
    static loadingServiceModule(filePath, service) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Loading.Service.Module',
            comment: [
                'Logging message for loading a service module info from a path.',
                '{0}: file path.',
                '{1}: service name.'
            ]
        }, 'Loading service module info \'{0}\' for service \'{1}\'', filePath, service);
    }
    static serviceInfoInvalid(filePath, service, property) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Service.Info.Invalid',
            comment: [
                'Error message for a service module info contains reserved property.',
                '{0}: file path.',
                '{1}: service name.',
                '{2}: property name.'
            ]
        }, 'Service module info \'{0}\' for service \'{1}\' contains reserved \'{2}\' property', filePath, service, property);
    }
    static serviceInfoInvalidSpaceInHostId(filePath, service, hostId) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Service.Info.SpaceInHostId',
            comment: [
                'Error message for a service module info containing space in the host id.',
                '{0}: file path.',
                '{1}: service name.',
                '{2}: host id.'
            ]
        }, 'Service module info \'{0}\' for service \'{1}\' contains space in the host id \'{2}\'', filePath, service, hostId);
    }
    static cannotResolveServiceModuleInfo(filePath, service, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Cannot.Resolve.Service.Module.Info',
            comment: [
                'Error message for service module info load error.',
                '{0}: service name.',
                '{1}: file path.',
                '{2}: error message.'
            ]
        }, 'Cannot resolve and load service module info for \'{0}\' from \'{1}\': {2}', service, filePath, error);
    }
    static startingService(service) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Starting.Service',
            comment: [
                'Logging message for starting a Node service.',
                'Don\'t translate Node. Node is a host type',
                '{0}: service name.'
            ]
        }, 'Node host starting service \'{0}\'', service);
    }
    static variableMustBeFunction(variable, moduleName, actualType) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Variable.Must.Be.Function',
            comment: [
                'Error message for a variable must be a function.',
                '{0}: variable name.',
                '{1}: module name.',
                '{2}: actual type of variable'
            ]
        }, '{0} must be a function in \'{1}\'. Actually it is {2}.', variable, moduleName, actualType);
    }
    static serviceEntryPointFileNameNotFound(name) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Service.Entry.Point.File.Name.Not.Found',
            comment: [
                'Error message for cannot find entry point file name for a service.',
                '{0}: service name.'
            ]
        }, 'Failed to find a service entry point file name for \'{0}\'. Check your service module authoring to ensure it includes a service entryPoint.scriptPath property.', name);
    }
    static serviceEntryPointConstructorNotFound(name) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Service.Entry.Point.Constructor.Not.Found',
            comment: [
                'Error message for cannot find entry point construstor for a service.',
                '{0}: service name.'
            ]
        }, 'Failed to find a service entry point constructor function for \'{0}\'. Check your service module authoring to ensure it includes a service entryPoint.constructorFunction property.', name);
    }
    static loadServiceModuleError(moduleName, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Load.Service.Module.Error',
            comment: [
                'Error message when loading a service module.',
                '{0}: module name.',
                '{1}: error message'
            ]
        }, 'Error loading service module \'{0}\': {1}', moduleName, error);
    }
    static connectedToService(name) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Connected.To.Service',
            comment: [
                '{0}: service name.'
            ]
        }, 'A client connected to {0}', name);
    }
    static disposeServiceError(instanceName, name, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Dispose.Service.Error',
            comment: [
                'Error message when disposing a service module instance.',
                '{0}: Service module instance name.',
                '{1}: service name.',
                '{2}: error message'
            ]
        }, 'Error disposing {0}instance of \'{1}\' service: {2}', instanceName, name, error);
    }
    static createServiceInstanceError(name, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Create.Service.Instance.Error',
            comment: [
                'Error message when creating a service module instance.',
                '{0}: service name.',
                '{1}: error message.'
            ]
        }, 'Error creating service module instance for \'{0}\', closing the stream to the client: \'{1}\'.', name, error);
    }
    static failedToDeleteFile(path, errCode, errMessage) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Failed.To.Delete.File',
            comment: [
                'Error message when failed to delete a file.'
            ]
        }, 'Failed to delete file \'{0}\'. Error code={1}, Error message={2}', path, errCode, errMessage);
    }
    static failedToGetFileStats(path, errCode, errMessage) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Failed.To.Get.File.Stats',
            comment: [
                'Error message when failed to get file statistics.'
            ]
        }, 'Failed to get statistics for file \'{0}\'. Error code={1}, Error message={2}', path, errCode, errMessage);
    }
    static failedToEnumerateFilesInDir(path, errCode, errMessage) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Failed.To.Enumerate.Files.In.Dir',
            comment: [
                'Error message when failed to enumerate files in a directory.'
            ]
        }, 'Failed to enumerate files in directory \'{0}\'. Error code={1}, Error message={2}', path, errCode, errMessage);
    }
    static serviceHubConfigFilePathIsNotAbsolute(serviceHubConfigFilePath) {
        LibraryResourceStrings.init();
        return localize({
            key: 'serviceHub.Config.FilePath.Is.Not.Absolute',
            comment: [
                'ServiceHub config file path is not an absolute path'
            ]
        }, 'ServiceHub config file path \'{0}\' is not an absolute path', serviceHubConfigFilePath);
    }
    static serviceHubConfigFileNameIsIncorrect(serviceHubConfigFilePath) {
        LibraryResourceStrings.init();
        return localize({
            key: 'serviceHub.Config.FileName.Is.Incorrect',
            comment: [
                'ServiceHub config file name is not equal to \'servicehub.config.json\''
            ]
        }, 'ServiceHub config file name in \'{0}\' is not equal to\'servicehub.config.json\'', serviceHubConfigFilePath);
    }
    static serviceHubConfigFileDoesNotExist(serviceHubConfigFilePath) {
        LibraryResourceStrings.init();
        return localize({
            key: 'serviceHub.Config.File.Does.Not.Exist',
            comment: [
                'ServiceHub config file does not exist'
            ]
        }, 'ServiceHub config file \'{0}\' does not exist', serviceHubConfigFilePath);
    }
    static HostGroupNotSupported(serviceName, hostGroup, propertyName) {
        LibraryResourceStrings.init();
        return localize({
            key: 'Host.Group.Not.Supported',
            comment: [
                'This string is an error message in exception thrown when a client tries to use a host group if it is not supported',
                '{0}: The name of the service.',
                '{1}: The name of the host group.',
                '{2}: The name of the property in service config file to enable host groups for the service.',
            ]
        }, 'Service \'{0}\' does not support host groups and cannot run in host group \'{1}\'. Set \'{2}\' property to \'true\' in the service config file to enable host groups for the service.', serviceName, hostGroup, propertyName);
    }
    static get objectDisposed() {
        LibraryResourceStrings.init();
        return localize({
            key: 'object.Disposed',
            comment: [
                'Object cannot be used because it has been disposed',
            ]
        }, 'Object is disposed');
    }
    static couldNotKillHost(host, error) {
        LibraryResourceStrings.init();
        return localize({
            key: 'could.Not.Kill.Host',
            comment: [
                'Logging message for failed to kill a host process.',
                '{0}: error message.',
            ]
        }, 'Could not kill the host process: {0}', error);
    }
}
exports.LibraryResourceStrings = LibraryResourceStrings;

},{"./common":1,"path":undefined}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LoggingDirectory = exports.SourceLevelEnvironmentVariable = exports.traceProcessOutput = exports.LogLevel = void 0;
const fs = require("fs");
const path = require("path");
const os = require("os");
const util = require("util");
const c = require("./common");
const mkdirp = require('mkdir-parents');
const ec = require('errno-codes');
const exitCode_1 = require("./exitCode");
const libraryResourceStrings_1 = require("./libraryResourceStrings");
/**
 * Log levels
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Critical"] = 1] = "Critical";
    LogLevel[LogLevel["Error"] = 2] = "Error";
    LogLevel[LogLevel["Warning"] = 4] = "Warning";
    LogLevel[LogLevel["Information"] = 8] = "Information";
    LogLevel[LogLevel["Verbose"] = 16] = "Verbose";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
function traceProcessOutput(logger, process, processName) {
    if (!logger) {
        throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, 'logger is not defined');
    }
    if (!process) {
        throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, 'process is not defined');
    }
    if (!processName) {
        throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, 'processName is not defined');
    }
    process.once('exit', (code, signal) => {
        let codeOrSignal = '';
        if (typeof code === 'number') {
            codeOrSignal = ` with code ${code}`;
            if (exitCode_1.default[code]) {
                codeOrSignal += ` (${exitCode_1.default[code]})`;
            }
        }
        if (signal) {
            codeOrSignal += ` with signal '${signal}''`;
        }
        logger.info(`${processName}${getPid(process)} exited${codeOrSignal}.`);
    });
    process.once('error', err => {
        logger.error(`${processName}${getPid(process)} error ${err.message}.`);
    });
    process.stderr.on('data', data => {
        logger.error(`${processName}${getPid(process)} stderr: ${data.toString()}`);
    });
    if (logger.isEnabled(LogLevel.Verbose)) {
        process.stdout.on('data', data => {
            logger.verbose(`${processName}${getPid(process)} stdout: ${data.toString()}`);
        });
    }
}
exports.traceProcessOutput = traceProcessOutput;
function getPid(process) {
    return process.pid ? ' PID ' + process.pid : '';
}
/** Trace level, must be in sync with System.Diagnostic.SourceLevels */
var SourceLevels;
(function (SourceLevels) {
    /** Allows all events through. */
    SourceLevels[SourceLevels["All"] = -1] = "All";
    /** Does not allow any events through. */
    SourceLevels[SourceLevels["Off"] = 0] = "Off";
    /** Allows only Critical events through. */
    SourceLevels[SourceLevels["Critical"] = LogLevel.Critical] = "Critical";
    /** Allows Critical and Error events through. */
    SourceLevels[SourceLevels["Error"] = 3] = "Error";
    /** Allows Critical, Error, and Warning events through. */
    SourceLevels[SourceLevels["Warning"] = 7] = "Warning";
    /** Allows Critical, Error, Warning, and Information events through. */
    SourceLevels[SourceLevels["Information"] = 15] = "Information";
    /** Allows Critical, Error, Warning, Information, and Verbose events through. */
    SourceLevels[SourceLevels["Verbose"] = 31] = "Verbose";
})(SourceLevels || (SourceLevels = {}));
/** Trace level. Must be in sync with EnvUtils.TraceLevelEnvVarName in src\clr\utility\Microsoft.ServiceHub.Utility.Shared\EnvUtils.cs */
exports.SourceLevelEnvironmentVariable = 'SERVICEHUBTRACELEVEL';
class LoggingDirectory {
    constructor(logFileDirectory, logFilePrefix) {
        this.nextLogFileNumber = 1;
        this.currentFileSizeInBytes = 0;
        this.logFileDirectory = logFileDirectory;
        this.logFilePrefix = logFilePrefix;
        this.logFilePath = this.getLogFilePath();
    }
    getLogFilePath() {
        let sessionKey = c.getLogSessionKey();
        return path.join(this.logFileDirectory, `${sessionKey}-${this.logFilePrefix}-${process.pid}-${this.nextLogFileNumber++}.log`);
    }
}
exports.LoggingDirectory = LoggingDirectory;
class Logger {
    constructor(logFilePrefix, options) {
        this.maxFileSizeInBytes = 500 * 1024; // 500 KB
        this.encoding = 'utf8';
        this.defaultLogFileDirectory = c.getDefaultLogFilesDir();
        this.overridenFileDirectory = c.getOverridenLogFilesDir();
        if (!logFilePrefix) {
            throw new Error(libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('LogFilePrefix'));
        }
        options = options || {};
        this.defaultLevel = options.defaultLevel || LogLevel.Verbose;
        const sourceLevelsEnvironment = options.logSourceLevel || process.env[exports.SourceLevelEnvironmentVariable];
        this.sourceLevels = parseInt(sourceLevelsEnvironment);
        if (isNaN(this.sourceLevels)) {
            const enumValue = c.getPropertyNoCase(SourceLevels, sourceLevelsEnvironment);
            this.sourceLevels = typeof enumValue === 'number' ? enumValue : SourceLevels.Error;
        }
        this.logFilePrefix = logFilePrefix;
        this.logFilePaths = this.getLogFilePaths(options);
        this.rollingEnabled = !this.isEnabled(LogLevel.Verbose);
    }
    critical(message) {
        this.LogInternal(LogLevel.Critical, message);
    }
    error(message) {
        this.LogInternal(LogLevel.Error, message);
    }
    warn(message) {
        this.LogInternal(LogLevel.Warning, message);
    }
    info(message) {
        this.LogInternal(LogLevel.Information, message);
    }
    verbose(message) {
        this.LogInternal(LogLevel.Verbose, message);
    }
    log(message) {
        this.LogInternal(this.defaultLevel, message);
    }
    isEnabled(level) {
        return (this.sourceLevels & level) != 0;
    }
    LogInternal(level, message) {
        try {
            if (this.isEnabled(level)) {
                if (!this.started) {
                    this.started = true;
                    this.startLogging();
                }
                this.logMessage(level, message);
            }
        }
        catch (e) {
            // this means logging is failed
        }
    }
    startLogging() {
        this.logFilePaths.forEach(logFilePath => {
            const logDirectory = path.dirname(logFilePath.logFilePath);
            if (!fs.existsSync(logDirectory)) {
                try {
                    mkdirp.sync(logDirectory, c.unixOwnerOnlyAccessMode);
                }
                catch (e) {
                    if (e.code !== ec.EEXIST.code) {
                        throw e;
                    }
                }
            }
        });
        this.logMessage(LogLevel.Information, libraryResourceStrings_1.LibraryResourceStrings.logConfig(`$${exports.SourceLevelEnvironmentVariable}="${process.env[exports.SourceLevelEnvironmentVariable] || ''}"`));
        // don't count this message for our roll over file size calculation
        this.logFilePaths.forEach(logFilePath => {
            logFilePath.currentFileSizeInBytes = 0;
        });
    }
    logMessage(level, message) {
        if (!message) {
            return;
        }
        let text;
        if (typeof message === 'string') {
            text = message;
        }
        else if (message.message) {
            text = message;
            if (message.stack) {
                text += os.EOL + libraryResourceStrings_1.LibraryResourceStrings.messageAt + `${os.EOL}${message.stack}`;
            }
        }
        else {
            text = util.inspect(message);
        }
        const finalMessage = formatMessage(text, level);
        // Since message header and footer are short and of constant length managed ServiceHub logger ignores them to simplify file size calculation.
        // To be consistent we do the same here for JS logger. This is ok because we don't need an accurate file size for rolling over to a new file.
        // This also helps in keeping the tests simple.
        const buffer = Buffer.from(text, this.encoding);
        this.logFilePaths.forEach(logFilePath => {
            if (this.rollingEnabled && logFilePath.currentFileSizeInBytes > 0 && (logFilePath.currentFileSizeInBytes + buffer.length > this.maxFileSizeInBytes)) {
                // delete lastLogFilePath
                if (logFilePath.lastLogFilePath) {
                    fs.unlink(logFilePath.lastLogFilePath, (err) => { });
                }
                logFilePath.lastLogFilePath = logFilePath.logFilePath;
                logFilePath.logFilePath = logFilePath.getLogFilePath();
                fs.appendFileSync(logFilePath.logFilePath, formatMessage(libraryResourceStrings_1.LibraryResourceStrings.logConfig(`$${exports.SourceLevelEnvironmentVariable}="${process.env[exports.SourceLevelEnvironmentVariable] || ''}"`), LogLevel.Information), { encoding: this.encoding });
                logFilePath.currentFileSizeInBytes = 0;
            }
            fs.appendFileSync(logFilePath.logFilePath, finalMessage, { encoding: this.encoding });
            logFilePath.currentFileSizeInBytes += buffer.length;
        });
    }
    getLogFilePaths(options) {
        let logFilePaths = [];
        if (options.logFileDirectory) {
            logFilePaths.push(new LoggingDirectory(options.logFileDirectory, this.logFilePrefix));
        }
        if (this.defaultLogFileDirectory) {
            logFilePaths.push(new LoggingDirectory(this.defaultLogFileDirectory, this.logFilePrefix));
        }
        if (this.overridenFileDirectory) {
            logFilePaths.push(new LoggingDirectory(this.overridenFileDirectory, this.logFilePrefix));
        }
        return logFilePaths;
    }
}
exports.Logger = Logger;
function formatMessage(message, level) {
    return `${formatDateTime()} : ${LogLevel[level]} : ${message}${os.EOL}`;
}
function twoDigits(v) {
    return `${v < 10 ? '0' : ''}${v}`;
}
function formatTime(date) {
    return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`;
}
function formatDateTime() {
    const now = new Date();
    return `${twoDigits(now.getMonth() + 1)}/${twoDigits(now.getDate())}/${now.getFullYear()} ${formatTime(now)}`;
}

},{"./common":1,"./exitCode":3,"./libraryResourceStrings":8,"errno-codes":13,"fs":undefined,"mkdir-parents":15,"os":undefined,"path":undefined,"util":undefined}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomHexStringSync = exports.defaultRandomHexStringLength = void 0;
const crypto_1 = require("crypto");
const q_1 = require("q");
const libraryResourceStrings_1 = require("./libraryResourceStrings");
exports.defaultRandomHexStringLength = 32;
function randomHexString(length, useCrypto) {
    if (length < 0) {
        throw new Error(libraryResourceStrings_1.LibraryResourceStrings.lengthCannotBeNegative);
    }
    length = length || exports.defaultRandomHexStringLength;
    if (useCrypto) {
        return (0, q_1.nfcall)(crypto_1.randomBytes, Math.round(length / 2))
            .then(buffer => buffer.toString('hex').substr(0, length));
    }
    else {
        return (0, q_1.resolve)(getRandomHexString(length));
    }
}
exports.default = randomHexString;
function randomHexStringSync(length, useCrypto) {
    if (length < 0) {
        throw new Error(libraryResourceStrings_1.LibraryResourceStrings.lengthCannotBeNegative);
    }
    length = length || exports.defaultRandomHexStringLength;
    if (useCrypto) {
        return (0, crypto_1.randomBytes)(Math.round(length / 2)).toString('hex').substr(0, length);
    }
    else {
        return getRandomHexString(length);
    }
}
exports.randomHexStringSync = randomHexStringSync;
function getRandomHexString(length) {
    let random = ((1 + Math.random()) * 0x10000000000000).toString(16);
    while (random.length < length) {
        random = `${random}${((1 + Math.random()) * 0x10000000000000).toString(16)}`;
    }
    return (random.substr(0, length));
}

},{"./libraryResourceStrings":8,"crypto":undefined,"q":16}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceManager = void 0;
const path = require("path");
const e = require("events");
const q = require("q");
const c = require("./common");
const libraryResourceStrings_1 = require("./libraryResourceStrings");
const fs = require('fs');
/**
 * Service Manager
 *
 * Events:
 *     servicesStarted(serviceName, stream) - at least one client has open connection to a service running by this service manager.
 *     servicesEnded - there are no more open connections to any service running by this service manager.
 */
class ServiceManager extends e.EventEmitter {
    constructor(logger) {
        super();
        this.endPoints = [];
        this.streams = [];
        this.logger = logger;
    }
    startService(serviceModuleInfo) {
        if (serviceModuleInfo == null) {
            throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('serviceModuleInfo'));
        }
        this.logger.info(libraryResourceStrings_1.LibraryResourceStrings.startingService(serviceModuleInfo.name));
        return this.startServiceObject(serviceModuleInfo);
    }
    static loadFunction(moduleName, constructor) {
        if (!moduleName) {
            throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('moduleName'));
        }
        if (!constructor) {
            throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('constructor'));
        }
        let checkFile = path.isAbsolute(moduleName) ? q.ninvoke(fs, 'access', moduleName, fs.F_OK | fs.R_OK) : q.resolve(null);
        return checkFile.then(() => {
            const nodeModule = require(moduleName);
            const nodeModuleExport = nodeModule[constructor];
            if (typeof nodeModuleExport !== 'function') {
                const message = libraryResourceStrings_1.LibraryResourceStrings.variableMustBeFunction(constructor, moduleName, typeof nodeModuleExport);
                throw new c.ServiceHubError(c.ErrorKind.InvalidOperation, message);
            }
            return (...params) => {
                let result = Object.create(nodeModuleExport.prototype);
                return new result.constructor(...params);
            };
        });
    }
    startServiceObject(serviceModuleInfo) {
        const name = serviceModuleInfo.name;
        const serviceEntryPoint = (serviceModuleInfo.entryPoint);
        if (!serviceEntryPoint.scriptPath) {
            let message = libraryResourceStrings_1.LibraryResourceStrings.serviceEntryPointFileNameNotFound(name);
            this.logger.error(message);
            throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, message);
        }
        if (!serviceEntryPoint.constructorFunction) {
            let message = libraryResourceStrings_1.LibraryResourceStrings.serviceEntryPointConstructorNotFound(name);
            this.logger.error(message);
            throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, message);
        }
        const moduleName = ServiceManager.getFullPath(serviceModuleInfo, serviceEntryPoint.scriptPath);
        const constructor = serviceEntryPoint.constructorFunction;
        const serviceOptions = {
            name,
            logger: this.logger,
            noStreamTrace: true, // We're going to trace the service module stream into a separate log file.
        };
        return ServiceManager.loadFunction(moduleName, constructor)
            .catch(err => {
            const message = libraryResourceStrings_1.LibraryResourceStrings.loadServiceModuleError(name, err.message);
            this.logger.error(message);
            return q.reject(new Error(message));
        })
            .then(serviceModuleFactory => c.serverManager.startService(serviceOptions, (stream, logger) => {
            logger.info(libraryResourceStrings_1.LibraryResourceStrings.connectedToService(name));
            // Keep a reference to the service stream so it is not garbage collected.
            if (this.streams.push(stream) === 1) {
                this.emit(ServiceManager.ServicesStartedEvent, name, stream);
            }
            let serviceModuleInstance = null;
            stream.once('end', () => {
                logger.info(`A stream to ${name} ended.`);
                let disposal = q.resolve(null);
                if (serviceModuleInstance && typeof serviceModuleInstance.disposeAsync === 'function') {
                    const instanceName = serviceModuleInstance.constructor.name ? serviceModuleInstance.constructor.name + ' ' : '';
                    disposal = disposal
                        .then(() => serviceModuleInstance.disposeAsync())
                        .catch(reason => {
                        logger.error(libraryResourceStrings_1.LibraryResourceStrings.disposeServiceError(instanceName, name, reason.stack || reason.message || reason));
                        return null;
                    });
                }
                disposal.finally(() => {
                    const index = this.streams.indexOf(stream);
                    if (index >= 0) {
                        this.streams.splice(index, 1);
                    }
                    if (this.streams.length === 0) {
                        this.emit(ServiceManager.ServicesEndedEvent);
                    }
                }).done();
            });
            try {
                let svcs = {
                    logger: this.logger,
                };
                serviceModuleInstance = serviceModuleFactory.call(this, stream, svcs);
            }
            catch (err) {
                logger.error(libraryResourceStrings_1.LibraryResourceStrings.createServiceInstanceError(name, err.stack || err.message || err));
                stream.end();
                return;
            }
        }));
    }
    static getFullPath(smi, fileNameOrPath) {
        if (!fileNameOrPath) {
            throw new c.ServiceHubError(c.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('fileNameOrPath'));
        }
        let result;
        if (path.isAbsolute(fileNameOrPath)) {
            result = fileNameOrPath;
        }
        else {
            result = smi.serviceBaseDirectory ? path.join(smi.serviceBaseDirectory, fileNameOrPath) : fileNameOrPath;
        }
        return result.replace(/\\/g, '/');
    }
}
exports.ServiceManager = ServiceManager;
ServiceManager.ServicesStartedEvent = 'servicesStarted';
ServiceManager.ServicesEndedEvent = 'servicesEnded';

},{"./common":1,"./libraryResourceStrings":8,"events":undefined,"fs":undefined,"path":undefined,"q":16}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceModuleInfo = void 0;
const common_1 = require("./common");
const libraryResourceStrings_1 = require("./libraryResourceStrings");
// set the default host ID to be some guid to prevent name collisions with user specified host IDs
const defaultHostId = 'C94B8CFE-E3FD-4BAF-A941-2866DBB566FE';
class ServiceModuleInfo {
    constructor(source) {
        if (!source) {
            throw new common_1.ServiceHubError(common_1.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('source'));
        }
        this.name = source.name;
        this.host = source.host;
        this.hostId = source.hostId;
        if (!this.hostId) {
            this.hostId = defaultHostId;
        }
        this.hostGroupAllowed = source.hostGroupAllowed;
        this.serviceBaseDirectory = source.serviceBaseDirectory;
        this.entryPoint = source.entryPoint;
        if (!source.host) {
            throw new common_1.ServiceHubError(common_1.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('host'));
        }
        if (!this.entryPoint) {
            throw new common_1.ServiceHubError(common_1.ErrorKind.InvalidArgument, libraryResourceStrings_1.LibraryResourceStrings.variableIsNotDefined('entryPoint'));
        }
    }
}
exports.ServiceModuleInfo = ServiceModuleInfo;

},{"./common":1,"./libraryResourceStrings":8}],13:[function(require,module,exports){
"use strict";var errors={UNKNOWN:{errno:-1,code:"UNKNOWN",description:"unknown error"},OK:{errno:0,code:"OK",description:"success"},EOF:{errno:1,code:"EOF",description:"end of file"},EADDRINFO:{errno:2,code:"EADDRINFO",description:"getaddrinfo error"},EACCES:{errno:3,code:"EACCES",description:"permission denied"},EAGAIN:{errno:4,code:"EAGAIN",description:"no more processes"},EADDRINUSE:{errno:5,code:"EADDRINUSE",description:"address already in use"},EADDRNOTAVAIL:{errno:6,code:"EADDRNOTAVAIL",description:""},EAFNOSUPPORT:{errno:7,code:"EAFNOSUPPORT",description:""},EALREADY:{errno:8,code:"EALREADY",description:""},EBADF:{errno:9,code:"EBADF",description:"bad file descriptor"},EBUSY:{errno:10,code:"EBUSY",description:"resource busy or locked"},ECONNABORTED:{errno:11,code:"ECONNABORTED",description:"software caused connection abort"},ECONNREFUSED:{errno:12,code:"ECONNREFUSED",description:"connection refused"},ECONNRESET:{errno:13,code:"ECONNRESET",description:"connection reset by peer"},EDESTADDRREQ:{errno:14,code:"EDESTADDRREQ",description:"destination address required"},EFAULT:{errno:15,code:"EFAULT",description:"bad address in system call argument"},EHOSTUNREACH:{errno:16,code:"EHOSTUNREACH",description:"host is unreachable"},EINTR:{errno:17,code:"EINTR",description:"interrupted system call"},EINVAL:{errno:18,code:"EINVAL",description:"invalid argument"},EISCONN:{errno:19,code:"EISCONN",description:"socket is already connected"},EMFILE:{errno:20,code:"EMFILE",description:"too many open files"},EMSGSIZE:{errno:21,code:"EMSGSIZE",description:"message too long"},ENETDOWN:{errno:22,code:"ENETDOWN",description:"network is down"},ENETUNREACH:{errno:23,code:"ENETUNREACH",description:"network is unreachable"},ENFILE:{errno:24,code:"ENFILE",description:"file table overflow"},ENOBUFS:{errno:25,code:"ENOBUFS",description:"no buffer space available"},ENOMEM:{errno:26,code:"ENOMEM",description:"not enough memory"},ENOTDIR:{errno:27,code:"ENOTDIR",description:"not a directory"},EISDIR:{errno:28,code:"EISDIR",description:"illegal operation on a directory"},ENONET:{errno:29,code:"ENONET",description:"machine is not on the network"},ENOTCONN:{errno:31,code:"ENOTCONN",description:"socket is not connected"},ENOTSOCK:{errno:32,code:"ENOTSOCK",description:"socket operation on non-socket"},ENOTSUP:{errno:33,code:"ENOTSUP",description:"operation not supported on socket"},ENOENT:{errno:34,code:"ENOENT",description:"no such file or directory"},ENOSYS:{errno:35,code:"ENOSYS",description:"function not implemented"},EPIPE:{errno:36,code:"EPIPE",description:"broken pipe"},EPROTO:{errno:37,code:"EPROTO",description:"protocol error"},EPROTONOSUPPORT:{errno:38,code:"EPROTONOSUPPORT",description:"protocol not supported"},EPROTOTYPE:{errno:39,code:"EPROTOTYPE",description:"protocol wrong type for socket"},ETIMEDOUT:{errno:40,code:"ETIMEDOUT",description:"connection timed out"},ECHARSET:{errno:41,code:"ECHARSET",description:""},EAIFAMNOSUPPORT:{errno:42,code:"EAIFAMNOSUPPORT",description:""},EAISERVICE:{errno:44,code:"EAISERVICE",description:""},EAISOCKTYPE:{errno:45,code:"EAISOCKTYPE",description:""},ESHUTDOWN:{errno:46,code:"ESHUTDOWN",description:""},EEXIST:{errno:47,code:"EEXIST",description:"file already exists"},ESRCH:{errno:48,code:"ESRCH",description:"no such process"},ENAMETOOLONG:{errno:49,code:"ENAMETOOLONG",description:"name too long"},EPERM:{errno:50,code:"EPERM",description:"operation not permitted"},ELOOP:{errno:51,code:"ELOOP",description:"too many symbolic links encountered"},EXDEV:{errno:52,code:"EXDEV",description:"cross-device link not permitted"},ENOTEMPTY:{errno:53,code:"ENOTEMPTY",description:"directory not empty"},ENOSPC:{errno:54,code:"ENOSPC",description:"no space left on device"},EIO:{errno:55,code:"EIO",description:"i/o error"},EROFS:{errno:56,code:"EROFS",description:"read-only file system"},ENODEV:{errno:57,code:"ENODEV",description:"no such device"},ESPIPE:{errno:58,code:"ESPIPE",description:"invalid seek"},ECANCELED:{errno:59,code:"ECANCELED",description:"operation canceled"}},codes={"-1":"UNKNOWN",0:"OK",1:"EOF",2:"EADDRINFO",3:"EACCES",4:"EAGAIN",5:"EADDRINUSE",6:"EADDRNOTAVAIL",7:"EAFNOSUPPORT",8:"EALREADY",9:"EBADF",10:"EBUSY",11:"ECONNABORTED",12:"ECONNREFUSED",13:"ECONNRESET",14:"EDESTADDRREQ",15:"EFAULT",16:"EHOSTUNREACH",17:"EINTR",18:"EINVAL",19:"EISCONN",20:"EMFILE",21:"EMSGSIZE",22:"ENETDOWN",23:"ENETUNREACH",24:"ENFILE",25:"ENOBUFS",26:"ENOMEM",27:"ENOTDIR",28:"EISDIR",29:"ENONET",31:"ENOTCONN",32:"ENOTSOCK",33:"ENOTSUP",34:"ENOENT",35:"ENOSYS",36:"EPIPE",37:"EPROTO",38:"EPROTONOSUPPORT",39:"EPROTOTYPE",40:"ETIMEDOUT",41:"ECHARSET",42:"EAIFAMNOSUPPORT",44:"EAISERVICE",45:"EAISOCKTYPE",46:"ESHUTDOWN",47:"EEXIST",48:"ESRCH",49:"ENAMETOOLONG",50:"EPERM",51:"ELOOP",52:"EXDEV",53:"ENOTEMPTY",54:"ENOSPC",55:"EIO",56:"EROFS",57:"ENODEV",58:"ESPIPE",59:"ECANCELED"},nextAvailableErrno=100;errors.create=function(a,b,c){var d={errno:a,code:b,description:c};errors[b]=d,codes[a]=b},errors.get=function(a,b){var c,d=typeof a;d==="number"?c=errors[codes[a]]:d==="string"?c=errors[a]:c=a;var e=new Error(c.code);e.errno=c.errno,e.code=c.code;var f=c.description;if(b)for(var g in b)f=f.replace(new RegExp("\\{"+g+"\\}","g"),b[g]);return e.description=f,e},errors.getNextAvailableErrno=function(){var a=nextAvailableErrno;return nextAvailableErrno++,a},module.exports=errors;
},{}],14:[function(require,module,exports){
/**
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 0.11.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2024
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
  'use strict';

  var ERROR = 'input is invalid type';
  var WINDOW = typeof window === 'object';
  var root = WINDOW ? window : {};
  if (root.JS_SHA256_NO_WINDOW) {
    WINDOW = false;
  }
  var WEB_WORKER = !WINDOW && typeof self === 'object';
  var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = global;
  } else if (WEB_WORKER) {
    root = self;
  }
  var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && typeof module === 'object' && module.exports;
  var AMD = typeof define === 'function' && define.amd;
  var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];

  var blocks = [];

  if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
    Array.isArray = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
  }

  if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
    ArrayBuffer.isView = function (obj) {
      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
    };
  }

  var createOutputMethod = function (outputType, is224) {
    return function (message) {
      return new Sha256(is224, true).update(message)[outputType]();
    };
  };

  var createMethod = function (is224) {
    var method = createOutputMethod('hex', is224);
    if (NODE_JS) {
      method = nodeWrap(method, is224);
    }
    method.create = function () {
      return new Sha256(is224);
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type, is224);
    }
    return method;
  };

  var nodeWrap = function (method, is224) {
    var crypto = require('crypto')
    var Buffer = require('buffer').Buffer;
    var algorithm = is224 ? 'sha224' : 'sha256';
    var bufferFrom;
    if (Buffer.from && !root.JS_SHA256_NO_BUFFER_FROM) {
      bufferFrom = Buffer.from;
    } else {
      bufferFrom = function (message) {
        return new Buffer(message);
      };
    }
    var nodeMethod = function (message) {
      if (typeof message === 'string') {
        return crypto.createHash(algorithm).update(message, 'utf8').digest('hex');
      } else {
        if (message === null || message === undefined) {
          throw new Error(ERROR);
        } else if (message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        }
      }
      if (Array.isArray(message) || ArrayBuffer.isView(message) ||
        message.constructor === Buffer) {
        return crypto.createHash(algorithm).update(bufferFrom(message)).digest('hex');
      } else {
        return method(message);
      }
    };
    return nodeMethod;
  };

  var createHmacOutputMethod = function (outputType, is224) {
    return function (key, message) {
      return new HmacSha256(key, is224, true).update(message)[outputType]();
    };
  };

  var createHmacMethod = function (is224) {
    var method = createHmacOutputMethod('hex', is224);
    method.create = function (key) {
      return new HmacSha256(key, is224);
    };
    method.update = function (key, message) {
      return method.create(key).update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createHmacOutputMethod(type, is224);
    }
    return method;
  };

  function Sha256(is224, sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
    } else {
      this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    if (is224) {
      this.h0 = 0xc1059ed8;
      this.h1 = 0x367cd507;
      this.h2 = 0x3070dd17;
      this.h3 = 0xf70e5939;
      this.h4 = 0xffc00b31;
      this.h5 = 0x68581511;
      this.h6 = 0x64f98fa7;
      this.h7 = 0xbefa4fa4;
    } else { // 256
      this.h0 = 0x6a09e667;
      this.h1 = 0xbb67ae85;
      this.h2 = 0x3c6ef372;
      this.h3 = 0xa54ff53a;
      this.h4 = 0x510e527f;
      this.h5 = 0x9b05688c;
      this.h6 = 0x1f83d9ab;
      this.h7 = 0x5be0cd19;
    }

    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
    this.is224 = is224;
  }

  Sha256.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }
    var notString, type = typeof message;
    if (type !== 'string') {
      if (type === 'object') {
        if (message === null) {
          throw new Error(ERROR);
        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        } else if (!Array.isArray(message)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
            throw new Error(ERROR);
          }
        }
      } else {
        throw new Error(ERROR);
      }
      notString = true;
    }
    var code, index = 0, i, length = message.length, blocks = this.blocks;
    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        this.block = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
          blocks[4] = blocks[5] = blocks[6] = blocks[7] =
          blocks[8] = blocks[9] = blocks[10] = blocks[11] =
          blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }

      if (notString) {
        for (i = this.start; index < length && i < 64; ++index) {
          blocks[i >>> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < 64; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >>> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >>> 2] |= (0xc0 | (code >>> 6)) << SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >>> 2] |= (0xe0 | (code >>> 12)) << SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >>> 2] |= (0xf0 | (code >>> 18)) << SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | ((code >>> 12) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          }
        }
      }

      this.lastByteIndex = i;
      this.bytes += i - this.start;
      if (i >= 64) {
        this.block = blocks[16];
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };

  Sha256.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks, i = this.lastByteIndex;
    blocks[16] = this.block;
    blocks[i >>> 2] |= EXTRA[i & 3];
    this.block = blocks[16];
    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }
      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    blocks[15] = this.bytes << 3;
    this.hash();
  };

  Sha256.prototype.hash = function () {
    var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4, f = this.h5, g = this.h6,
      h = this.h7, blocks = this.blocks, j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;

    for (j = 16; j < 64; ++j) {
      // rightrotate
      t1 = blocks[j - 15];
      s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
      t1 = blocks[j - 2];
      s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
      blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
    }

    bc = b & c;
    for (j = 0; j < 64; j += 4) {
      if (this.first) {
        if (this.is224) {
          ab = 300032;
          t1 = blocks[0] - 1413257819;
          h = t1 - 150054599 << 0;
          d = t1 + 24177077 << 0;
        } else {
          ab = 704751109;
          t1 = blocks[0] - 210244248;
          h = t1 - 1521486534 << 0;
          d = t1 + 143694565 << 0;
        }
        this.first = false;
      } else {
        s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        ab = a & b;
        maj = ab ^ (a & c) ^ bc;
        ch = (e & f) ^ (~e & g);
        t1 = h + s1 + ch + K[j] + blocks[j];
        t2 = s0 + maj;
        h = d + t1 << 0;
        d = t1 + t2 << 0;
      }
      s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
      s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
      da = d & a;
      maj = da ^ (d & b) ^ ab;
      ch = (h & e) ^ (~h & f);
      t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
      t2 = s0 + maj;
      g = c + t1 << 0;
      c = t1 + t2 << 0;
      s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
      s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
      cd = c & d;
      maj = cd ^ (c & a) ^ da;
      ch = (g & h) ^ (~g & e);
      t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
      t2 = s0 + maj;
      f = b + t1 << 0;
      b = t1 + t2 << 0;
      s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
      s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
      bc = b & c;
      maj = bc ^ (b & d) ^ cd;
      ch = (f & g) ^ (~f & h);
      t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
      t2 = s0 + maj;
      e = a + t1 << 0;
      a = t1 + t2 << 0;
      this.chromeBugWorkAround = true;
    }

    this.h0 = this.h0 + a << 0;
    this.h1 = this.h1 + b << 0;
    this.h2 = this.h2 + c << 0;
    this.h3 = this.h3 + d << 0;
    this.h4 = this.h4 + e << 0;
    this.h5 = this.h5 + f << 0;
    this.h6 = this.h6 + g << 0;
    this.h7 = this.h7 + h << 0;
  };

  Sha256.prototype.hex = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
      h6 = this.h6, h7 = this.h7;

    var hex = HEX_CHARS[(h0 >>> 28) & 0x0F] + HEX_CHARS[(h0 >>> 24) & 0x0F] +
      HEX_CHARS[(h0 >>> 20) & 0x0F] + HEX_CHARS[(h0 >>> 16) & 0x0F] +
      HEX_CHARS[(h0 >>> 12) & 0x0F] + HEX_CHARS[(h0 >>> 8) & 0x0F] +
      HEX_CHARS[(h0 >>> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
      HEX_CHARS[(h1 >>> 28) & 0x0F] + HEX_CHARS[(h1 >>> 24) & 0x0F] +
      HEX_CHARS[(h1 >>> 20) & 0x0F] + HEX_CHARS[(h1 >>> 16) & 0x0F] +
      HEX_CHARS[(h1 >>> 12) & 0x0F] + HEX_CHARS[(h1 >>> 8) & 0x0F] +
      HEX_CHARS[(h1 >>> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
      HEX_CHARS[(h2 >>> 28) & 0x0F] + HEX_CHARS[(h2 >>> 24) & 0x0F] +
      HEX_CHARS[(h2 >>> 20) & 0x0F] + HEX_CHARS[(h2 >>> 16) & 0x0F] +
      HEX_CHARS[(h2 >>> 12) & 0x0F] + HEX_CHARS[(h2 >>> 8) & 0x0F] +
      HEX_CHARS[(h2 >>> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
      HEX_CHARS[(h3 >>> 28) & 0x0F] + HEX_CHARS[(h3 >>> 24) & 0x0F] +
      HEX_CHARS[(h3 >>> 20) & 0x0F] + HEX_CHARS[(h3 >>> 16) & 0x0F] +
      HEX_CHARS[(h3 >>> 12) & 0x0F] + HEX_CHARS[(h3 >>> 8) & 0x0F] +
      HEX_CHARS[(h3 >>> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
      HEX_CHARS[(h4 >>> 28) & 0x0F] + HEX_CHARS[(h4 >>> 24) & 0x0F] +
      HEX_CHARS[(h4 >>> 20) & 0x0F] + HEX_CHARS[(h4 >>> 16) & 0x0F] +
      HEX_CHARS[(h4 >>> 12) & 0x0F] + HEX_CHARS[(h4 >>> 8) & 0x0F] +
      HEX_CHARS[(h4 >>> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
      HEX_CHARS[(h5 >>> 28) & 0x0F] + HEX_CHARS[(h5 >>> 24) & 0x0F] +
      HEX_CHARS[(h5 >>> 20) & 0x0F] + HEX_CHARS[(h5 >>> 16) & 0x0F] +
      HEX_CHARS[(h5 >>> 12) & 0x0F] + HEX_CHARS[(h5 >>> 8) & 0x0F] +
      HEX_CHARS[(h5 >>> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
      HEX_CHARS[(h6 >>> 28) & 0x0F] + HEX_CHARS[(h6 >>> 24) & 0x0F] +
      HEX_CHARS[(h6 >>> 20) & 0x0F] + HEX_CHARS[(h6 >>> 16) & 0x0F] +
      HEX_CHARS[(h6 >>> 12) & 0x0F] + HEX_CHARS[(h6 >>> 8) & 0x0F] +
      HEX_CHARS[(h6 >>> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
    if (!this.is224) {
      hex += HEX_CHARS[(h7 >>> 28) & 0x0F] + HEX_CHARS[(h7 >>> 24) & 0x0F] +
        HEX_CHARS[(h7 >>> 20) & 0x0F] + HEX_CHARS[(h7 >>> 16) & 0x0F] +
        HEX_CHARS[(h7 >>> 12) & 0x0F] + HEX_CHARS[(h7 >>> 8) & 0x0F] +
        HEX_CHARS[(h7 >>> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
    }
    return hex;
  };

  Sha256.prototype.toString = Sha256.prototype.hex;

  Sha256.prototype.digest = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
      h6 = this.h6, h7 = this.h7;

    var arr = [
      (h0 >>> 24) & 0xFF, (h0 >>> 16) & 0xFF, (h0 >>> 8) & 0xFF, h0 & 0xFF,
      (h1 >>> 24) & 0xFF, (h1 >>> 16) & 0xFF, (h1 >>> 8) & 0xFF, h1 & 0xFF,
      (h2 >>> 24) & 0xFF, (h2 >>> 16) & 0xFF, (h2 >>> 8) & 0xFF, h2 & 0xFF,
      (h3 >>> 24) & 0xFF, (h3 >>> 16) & 0xFF, (h3 >>> 8) & 0xFF, h3 & 0xFF,
      (h4 >>> 24) & 0xFF, (h4 >>> 16) & 0xFF, (h4 >>> 8) & 0xFF, h4 & 0xFF,
      (h5 >>> 24) & 0xFF, (h5 >>> 16) & 0xFF, (h5 >>> 8) & 0xFF, h5 & 0xFF,
      (h6 >>> 24) & 0xFF, (h6 >>> 16) & 0xFF, (h6 >>> 8) & 0xFF, h6 & 0xFF
    ];
    if (!this.is224) {
      arr.push((h7 >>> 24) & 0xFF, (h7 >>> 16) & 0xFF, (h7 >>> 8) & 0xFF, h7 & 0xFF);
    }
    return arr;
  };

  Sha256.prototype.array = Sha256.prototype.digest;

  Sha256.prototype.arrayBuffer = function () {
    this.finalize();

    var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
    var dataView = new DataView(buffer);
    dataView.setUint32(0, this.h0);
    dataView.setUint32(4, this.h1);
    dataView.setUint32(8, this.h2);
    dataView.setUint32(12, this.h3);
    dataView.setUint32(16, this.h4);
    dataView.setUint32(20, this.h5);
    dataView.setUint32(24, this.h6);
    if (!this.is224) {
      dataView.setUint32(28, this.h7);
    }
    return buffer;
  };

  function HmacSha256(key, is224, sharedMemory) {
    var i, type = typeof key;
    if (type === 'string') {
      var bytes = [], length = key.length, index = 0, code;
      for (i = 0; i < length; ++i) {
        code = key.charCodeAt(i);
        if (code < 0x80) {
          bytes[index++] = code;
        } else if (code < 0x800) {
          bytes[index++] = (0xc0 | (code >>> 6));
          bytes[index++] = (0x80 | (code & 0x3f));
        } else if (code < 0xd800 || code >= 0xe000) {
          bytes[index++] = (0xe0 | (code >>> 12));
          bytes[index++] = (0x80 | ((code >>> 6) & 0x3f));
          bytes[index++] = (0x80 | (code & 0x3f));
        } else {
          code = 0x10000 + (((code & 0x3ff) << 10) | (key.charCodeAt(++i) & 0x3ff));
          bytes[index++] = (0xf0 | (code >>> 18));
          bytes[index++] = (0x80 | ((code >>> 12) & 0x3f));
          bytes[index++] = (0x80 | ((code >>> 6) & 0x3f));
          bytes[index++] = (0x80 | (code & 0x3f));
        }
      }
      key = bytes;
    } else {
      if (type === 'object') {
        if (key === null) {
          throw new Error(ERROR);
        } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
          key = new Uint8Array(key);
        } else if (!Array.isArray(key)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
            throw new Error(ERROR);
          }
        }
      } else {
        throw new Error(ERROR);
      }
    }

    if (key.length > 64) {
      key = (new Sha256(is224, true)).update(key).array();
    }

    var oKeyPad = [], iKeyPad = [];
    for (i = 0; i < 64; ++i) {
      var b = key[i] || 0;
      oKeyPad[i] = 0x5c ^ b;
      iKeyPad[i] = 0x36 ^ b;
    }

    Sha256.call(this, is224, sharedMemory);

    this.update(iKeyPad);
    this.oKeyPad = oKeyPad;
    this.inner = true;
    this.sharedMemory = sharedMemory;
  }
  HmacSha256.prototype = new Sha256();

  HmacSha256.prototype.finalize = function () {
    Sha256.prototype.finalize.call(this);
    if (this.inner) {
      this.inner = false;
      var innerHash = this.array();
      Sha256.call(this, this.is224, this.sharedMemory);
      this.update(this.oKeyPad);
      this.update(innerHash);
      Sha256.prototype.finalize.call(this);
    }
  };

  var exports = createMethod();
  exports.sha256 = exports;
  exports.sha224 = createMethod(true);
  exports.sha256.hmac = createHmacMethod();
  exports.sha224.hmac = createHmacMethod(true);

  if (COMMON_JS) {
    module.exports = exports;
  } else {
    root.sha256 = exports.sha256;
    root.sha224 = exports.sha224;
    if (AMD) {
      define(function () {
        return exports;
      });
    }
  }
})();

},{"buffer":undefined,"crypto":undefined}],15:[function(require,module,exports){
// mkdir-parents.js

'use strict';

var fs = require('fs');
var path = require('path');


//######################################################################
/**
 * Function: make directory with parents recursively (async)
 * Param   : dir: path to make directory
 *           [mode]: {optional} file mode to make directory
 *           [cb]: {optional} callback(err) function
 */
function mkdirParents(dir, mode, cb) {
  // check arguments
  if (typeof dir !== 'string')
    throw new Error('mkdirParents: directory path required');

  if (typeof mode === 'function') {
    cb = mode;
    mode = undefined;
  }

  if (mode !== undefined && typeof mode !== 'number')
    throw new Error('mkdirParents: mode must be a number');

  if (cb !== undefined && typeof cb !== 'function')
    throw new Error('mkdirParents: callback must be function');

  dir = path.resolve(dir);

  var ctx = this, called, results;

  // local variables
  var dirList = []; // directories that we have to make directory

  fs.exists(dir, existsCallback);

  // fs.exists callback...
  function existsCallback(exists) {
    if (exists) {
      return mkdirCallback(null);
    }

    // if dir does not exist, then we have to make directory
    dirList.push(dir);
    dir = path.resolve(dir, '..');

    return fs.exists(dir, existsCallback);
  } // existsCallback

  // fs.mkdir callback...
  function mkdirCallback(err) {
    if (err && err.code !== 'EEXIST') {
      return mkdirParentsCallback(err);
    }

    dir = dirList.pop();
    if (!dir) {
      return mkdirParentsCallback(null);
    }

    return fs.mkdir(dir, mode, mkdirCallback);
  } // mkdirCallback

  // mkdirParentsCallback(err)
  function mkdirParentsCallback(err) {
    if (err && err.code === 'EEXIST') err = arguments[0] = null;
    if (!results) results = arguments;
    if (!cb || called) return;
    called = true;
    cb.apply(ctx, results);
  } // mkdirParentsCallback

  // return mkdirParentsYieldable
  return function mkdirParentsYieldable(fn) {
    if (!cb) cb = fn;
    if (!results || called) return;
    called = true;
    cb.apply(ctx, results);
  }; // mkdirParentsYieldable

} // mkdirParents


//######################################################################
/**
 * Function: make directory with parents recursively (sync)
 * Param   : dir: path to make directory
 *           mode: file mode to make directory
 */
function mkdirParentsSync(dir, mode) {
  // check arguments
  if (typeof dir !== 'string')
    throw new Error('mkdirParentsSync: directory path required');

  if (mode !== undefined && typeof mode !== 'number')
    throw new Error('mkdirParents: mode must be a number');

  dir = path.resolve(dir);

  var dirList = [];
  while (!fs.existsSync(dir)) {
    dirList.push(dir);
    dir = path.resolve(dir, '..');
  }

  while (dir = dirList.pop()) {
    try {
      fs.mkdirSync(dir, mode);
    } catch (err) {
      if (err && err.code !== 'EEXIST') throw err;
    }
  }

} // mkdirParentsSync


exports = module.exports = mkdirParents;
exports.mkdirParents     = mkdirParents;
exports.mkdirParentsSync = mkdirParentsSync;
exports.sync             = mkdirParentsSync;

},{"fs":undefined,"path":undefined}],16:[function(require,module,exports){
(function (setImmediate){(function (){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2017 Kris Kowal under the terms of the MIT
 * license found at https://github.com/kriskowal/q/blob/v1/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();

        // Add a noConflict function so Q can be removed from the
        // global namespace.
        global.Q.noConflict = function () {
            global.Q = previousQ;
            return this;
        };

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.toString()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_defineProperty = Object.defineProperty || function (obj, prop, descriptor) {
    obj[prop] = descriptor.value;
    return obj;
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack && (!error.__minimumStackCounter__ || error.__minimumStackCounter__ > p.stackCounter)) {
                object_defineProperty(error, "__minimumStackCounter__", {value: p.stackCounter, configurable: true});
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        var stack = filterStackString(concatedStacks);
        object_defineProperty(error, "stack", {value: stack, configurable: true});
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * The counter is used to determine the stopping point for building
 * long stack traces. In makeStackTraceLong we walk backwards through
 * the linked list of promises, only stacks which were created before
 * the rejection are concatenated.
 */
var longStackCounter = 1;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
            promise.stackCounter = longStackCounter++;
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;

        if (Q.longStackSupport && hasStacks) {
            // Only hold a reference to the new promise if long stacks
            // are enabled to reduce memory usage
            promise.source = newPromise;
        }

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Q can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected(err) {
            pendingCount--;
            if (pendingCount === 0) {
                var rejection = err || new Error("" + err);

                rejection.message = ("Q can't get fulfillment value from any promise, all " +
                    "promises were rejected. Last error message: " + rejection.message);

                deferred.reject(rejection);
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    if (!callback || typeof callback.apply !== "function") {
        throw new Error("Q can't apply finally callback");
    }
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    if (callback === undefined) {
        throw new Error("Q can't wrap an undefined function");
    }
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this)}).call(this,require("timers").setImmediate)
},{"timers":undefined}],17:[function(require,module,exports){
// rmdir-recursive.js

'use strict';

var fs = require('fs');
var path = require('path');


//######################################################################
/**
 * Function: remove directory recursively (async)
 * Param   : dir: path to make directory
 *           [cb]: {optional} callback(err) function
 */
function rmdirRecursive(dir, cb) {
  // check arguments
  if (typeof dir !== 'string') {
    throw new Error('rmdirRecursive: directory path required');
  }

  if (cb !== undefined && typeof cb !== 'function') {
    throw new Error('rmdirRecursive: callback must be function');
  }

  var ctx = this, called, results;

  fs.exists(dir, function existsCallback(exists) {

    // already removed? then nothing to do
    if (!exists) return rmdirRecursiveCallback(null);

    fs.stat(dir, function statCallback(err, stat) {

      if (err) return rmdirRecursiveCallback(err);

      if (!stat.isDirectory())
        return fs.unlink(dir, rmdirRecursiveCallback);

      var files = fs.readdir(dir, readdirCallback);

    }); // fs.stat callback...

    // fs.readdir callback...
    function readdirCallback(err, files) {

      if (err) return rmdirRecursiveCallback(err);

      var n = files.length;
      if (n === 0) return fs.rmdir(dir, rmdirRecursiveCallback);

      files.forEach(function (name) {

        rmdirRecursive(path.resolve(dir, name), function (err) {

          if (err) return rmdirRecursiveCallback(err);

          if (--n === 0)
            return fs.rmdir(dir, rmdirRecursiveCallback);

        }); // rmdirRecursive

      }); // files.forEach

    } // readdirCallback

  }); // fs.exists

  // rmdirRecursiveCallback(err)
  function rmdirRecursiveCallback(err) {
    if (err && err.code === 'ENOENT') err = arguments[0] = null;

    if (!results) results = arguments;
    if (!cb || called) return;
    called = true;
    cb.apply(ctx, results);
  } // rmdirRecursiveCallback

  // return rmdirRecursiveYieldable
  return function rmdirRecursiveYieldable(fn) {
    if (!cb) cb = fn;
    if (!results || called) return;
    called = true;
    cb.apply(ctx, results);
  }; // rmdirRecursiveYieldable

} // rmdirRecursive


//######################################################################
/**
 * Function: remove directory recursively (sync)
 * Param   : dir: path to remove directory
 */
function rmdirRecursiveSync(dir) {
  // check arguments
  if (typeof dir !== 'string')
    throw new Error('rmdirRecursiveSync: directory path required');

  // already removed? then nothing to do
  if (!fs.existsSync(dir)) return;

  // is file? is not directory? then remove file
  try {
    var stat = fs.statSync(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  if (!stat.isDirectory()) {
    try {
      return fs.unlinkSync(dir);
    } catch (err) {
      if (err.code === 'ENOENT') return;
      throw err;
    }
  }

  // remove all contents in it
  fs.readdirSync(dir).forEach(function (name) {
    rmdirRecursiveSync(path.resolve(dir, name));
  });

  try {
    return fs.rmdirSync(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
}


exports = module.exports   = rmdirRecursive;
exports.rmdirRecursive     = rmdirRecursive;
exports.rmdirRecursiveSync = rmdirRecursiveSync;
exports.sync               = rmdirRecursiveSync;

},{"fs":undefined,"path":undefined}],18:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/thenable.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressType = exports.ProgressToken = exports.createMessageConnection = exports.NullLogger = exports.ConnectionOptions = exports.ConnectionStrategy = exports.AbstractMessageBuffer = exports.WriteableStreamMessageWriter = exports.AbstractMessageWriter = exports.MessageWriter = exports.ReadableStreamMessageReader = exports.AbstractMessageReader = exports.MessageReader = exports.SharedArrayReceiverStrategy = exports.SharedArraySenderStrategy = exports.CancellationToken = exports.CancellationTokenSource = exports.Emitter = exports.Event = exports.Disposable = exports.LRUCache = exports.Touch = exports.LinkedMap = exports.ParameterStructures = exports.NotificationType9 = exports.NotificationType8 = exports.NotificationType7 = exports.NotificationType6 = exports.NotificationType5 = exports.NotificationType4 = exports.NotificationType3 = exports.NotificationType2 = exports.NotificationType1 = exports.NotificationType0 = exports.NotificationType = exports.ErrorCodes = exports.ResponseError = exports.RequestType9 = exports.RequestType8 = exports.RequestType7 = exports.RequestType6 = exports.RequestType5 = exports.RequestType4 = exports.RequestType3 = exports.RequestType2 = exports.RequestType1 = exports.RequestType0 = exports.RequestType = exports.Message = exports.RAL = void 0;
exports.MessageStrategy = exports.CancellationStrategy = exports.CancellationSenderStrategy = exports.CancellationReceiverStrategy = exports.ConnectionError = exports.ConnectionErrors = exports.LogTraceNotification = exports.SetTraceNotification = exports.TraceFormat = exports.TraceValues = exports.Trace = void 0;
const messages_1 = require("./messages");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return messages_1.Message; } });
Object.defineProperty(exports, "RequestType", { enumerable: true, get: function () { return messages_1.RequestType; } });
Object.defineProperty(exports, "RequestType0", { enumerable: true, get: function () { return messages_1.RequestType0; } });
Object.defineProperty(exports, "RequestType1", { enumerable: true, get: function () { return messages_1.RequestType1; } });
Object.defineProperty(exports, "RequestType2", { enumerable: true, get: function () { return messages_1.RequestType2; } });
Object.defineProperty(exports, "RequestType3", { enumerable: true, get: function () { return messages_1.RequestType3; } });
Object.defineProperty(exports, "RequestType4", { enumerable: true, get: function () { return messages_1.RequestType4; } });
Object.defineProperty(exports, "RequestType5", { enumerable: true, get: function () { return messages_1.RequestType5; } });
Object.defineProperty(exports, "RequestType6", { enumerable: true, get: function () { return messages_1.RequestType6; } });
Object.defineProperty(exports, "RequestType7", { enumerable: true, get: function () { return messages_1.RequestType7; } });
Object.defineProperty(exports, "RequestType8", { enumerable: true, get: function () { return messages_1.RequestType8; } });
Object.defineProperty(exports, "RequestType9", { enumerable: true, get: function () { return messages_1.RequestType9; } });
Object.defineProperty(exports, "ResponseError", { enumerable: true, get: function () { return messages_1.ResponseError; } });
Object.defineProperty(exports, "ErrorCodes", { enumerable: true, get: function () { return messages_1.ErrorCodes; } });
Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return messages_1.NotificationType; } });
Object.defineProperty(exports, "NotificationType0", { enumerable: true, get: function () { return messages_1.NotificationType0; } });
Object.defineProperty(exports, "NotificationType1", { enumerable: true, get: function () { return messages_1.NotificationType1; } });
Object.defineProperty(exports, "NotificationType2", { enumerable: true, get: function () { return messages_1.NotificationType2; } });
Object.defineProperty(exports, "NotificationType3", { enumerable: true, get: function () { return messages_1.NotificationType3; } });
Object.defineProperty(exports, "NotificationType4", { enumerable: true, get: function () { return messages_1.NotificationType4; } });
Object.defineProperty(exports, "NotificationType5", { enumerable: true, get: function () { return messages_1.NotificationType5; } });
Object.defineProperty(exports, "NotificationType6", { enumerable: true, get: function () { return messages_1.NotificationType6; } });
Object.defineProperty(exports, "NotificationType7", { enumerable: true, get: function () { return messages_1.NotificationType7; } });
Object.defineProperty(exports, "NotificationType8", { enumerable: true, get: function () { return messages_1.NotificationType8; } });
Object.defineProperty(exports, "NotificationType9", { enumerable: true, get: function () { return messages_1.NotificationType9; } });
Object.defineProperty(exports, "ParameterStructures", { enumerable: true, get: function () { return messages_1.ParameterStructures; } });
const linkedMap_1 = require("./linkedMap");
Object.defineProperty(exports, "LinkedMap", { enumerable: true, get: function () { return linkedMap_1.LinkedMap; } });
Object.defineProperty(exports, "LRUCache", { enumerable: true, get: function () { return linkedMap_1.LRUCache; } });
Object.defineProperty(exports, "Touch", { enumerable: true, get: function () { return linkedMap_1.Touch; } });
const disposable_1 = require("./disposable");
Object.defineProperty(exports, "Disposable", { enumerable: true, get: function () { return disposable_1.Disposable; } });
const events_1 = require("./events");
Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return events_1.Event; } });
Object.defineProperty(exports, "Emitter", { enumerable: true, get: function () { return events_1.Emitter; } });
const cancellation_1 = require("./cancellation");
Object.defineProperty(exports, "CancellationTokenSource", { enumerable: true, get: function () { return cancellation_1.CancellationTokenSource; } });
Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function () { return cancellation_1.CancellationToken; } });
const sharedArrayCancellation_1 = require("./sharedArrayCancellation");
Object.defineProperty(exports, "SharedArraySenderStrategy", { enumerable: true, get: function () { return sharedArrayCancellation_1.SharedArraySenderStrategy; } });
Object.defineProperty(exports, "SharedArrayReceiverStrategy", { enumerable: true, get: function () { return sharedArrayCancellation_1.SharedArrayReceiverStrategy; } });
const messageReader_1 = require("./messageReader");
Object.defineProperty(exports, "MessageReader", { enumerable: true, get: function () { return messageReader_1.MessageReader; } });
Object.defineProperty(exports, "AbstractMessageReader", { enumerable: true, get: function () { return messageReader_1.AbstractMessageReader; } });
Object.defineProperty(exports, "ReadableStreamMessageReader", { enumerable: true, get: function () { return messageReader_1.ReadableStreamMessageReader; } });
const messageWriter_1 = require("./messageWriter");
Object.defineProperty(exports, "MessageWriter", { enumerable: true, get: function () { return messageWriter_1.MessageWriter; } });
Object.defineProperty(exports, "AbstractMessageWriter", { enumerable: true, get: function () { return messageWriter_1.AbstractMessageWriter; } });
Object.defineProperty(exports, "WriteableStreamMessageWriter", { enumerable: true, get: function () { return messageWriter_1.WriteableStreamMessageWriter; } });
const messageBuffer_1 = require("./messageBuffer");
Object.defineProperty(exports, "AbstractMessageBuffer", { enumerable: true, get: function () { return messageBuffer_1.AbstractMessageBuffer; } });
const connection_1 = require("./connection");
Object.defineProperty(exports, "ConnectionStrategy", { enumerable: true, get: function () { return connection_1.ConnectionStrategy; } });
Object.defineProperty(exports, "ConnectionOptions", { enumerable: true, get: function () { return connection_1.ConnectionOptions; } });
Object.defineProperty(exports, "NullLogger", { enumerable: true, get: function () { return connection_1.NullLogger; } });
Object.defineProperty(exports, "createMessageConnection", { enumerable: true, get: function () { return connection_1.createMessageConnection; } });
Object.defineProperty(exports, "ProgressToken", { enumerable: true, get: function () { return connection_1.ProgressToken; } });
Object.defineProperty(exports, "ProgressType", { enumerable: true, get: function () { return connection_1.ProgressType; } });
Object.defineProperty(exports, "Trace", { enumerable: true, get: function () { return connection_1.Trace; } });
Object.defineProperty(exports, "TraceValues", { enumerable: true, get: function () { return connection_1.TraceValues; } });
Object.defineProperty(exports, "TraceFormat", { enumerable: true, get: function () { return connection_1.TraceFormat; } });
Object.defineProperty(exports, "SetTraceNotification", { enumerable: true, get: function () { return connection_1.SetTraceNotification; } });
Object.defineProperty(exports, "LogTraceNotification", { enumerable: true, get: function () { return connection_1.LogTraceNotification; } });
Object.defineProperty(exports, "ConnectionErrors", { enumerable: true, get: function () { return connection_1.ConnectionErrors; } });
Object.defineProperty(exports, "ConnectionError", { enumerable: true, get: function () { return connection_1.ConnectionError; } });
Object.defineProperty(exports, "CancellationReceiverStrategy", { enumerable: true, get: function () { return connection_1.CancellationReceiverStrategy; } });
Object.defineProperty(exports, "CancellationSenderStrategy", { enumerable: true, get: function () { return connection_1.CancellationSenderStrategy; } });
Object.defineProperty(exports, "CancellationStrategy", { enumerable: true, get: function () { return connection_1.CancellationStrategy; } });
Object.defineProperty(exports, "MessageStrategy", { enumerable: true, get: function () { return connection_1.MessageStrategy; } });
const ral_1 = require("./ral");
exports.RAL = ral_1.default;

},{"./cancellation":19,"./connection":20,"./disposable":21,"./events":22,"./linkedMap":24,"./messageBuffer":25,"./messageReader":26,"./messageWriter":27,"./messages":28,"./ral":29,"./sharedArrayCancellation":31}],19:[function(require,module,exports){
"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationTokenSource = exports.CancellationToken = void 0;
const ral_1 = require("./ral");
const Is = require("./is");
const events_1 = require("./events");
var CancellationToken;
(function (CancellationToken) {
    CancellationToken.None = Object.freeze({
        isCancellationRequested: false,
        onCancellationRequested: events_1.Event.None
    });
    CancellationToken.Cancelled = Object.freeze({
        isCancellationRequested: true,
        onCancellationRequested: events_1.Event.None
    });
    function is(value) {
        const candidate = value;
        return candidate && (candidate === CancellationToken.None
            || candidate === CancellationToken.Cancelled
            || (Is.boolean(candidate.isCancellationRequested) && !!candidate.onCancellationRequested));
    }
    CancellationToken.is = is;
})(CancellationToken || (exports.CancellationToken = CancellationToken = {}));
const shortcutEvent = Object.freeze(function (callback, context) {
    const handle = (0, ral_1.default)().timer.setTimeout(callback.bind(context), 0);
    return { dispose() { handle.dispose(); } };
});
class MutableToken {
    constructor() {
        this._isCancelled = false;
    }
    cancel() {
        if (!this._isCancelled) {
            this._isCancelled = true;
            if (this._emitter) {
                this._emitter.fire(undefined);
                this.dispose();
            }
        }
    }
    get isCancellationRequested() {
        return this._isCancelled;
    }
    get onCancellationRequested() {
        if (this._isCancelled) {
            return shortcutEvent;
        }
        if (!this._emitter) {
            this._emitter = new events_1.Emitter();
        }
        return this._emitter.event;
    }
    dispose() {
        if (this._emitter) {
            this._emitter.dispose();
            this._emitter = undefined;
        }
    }
}
class CancellationTokenSource {
    get token() {
        if (!this._token) {
            // be lazy and create the token only when
            // actually needed
            this._token = new MutableToken();
        }
        return this._token;
    }
    cancel() {
        if (!this._token) {
            // save an object by returning the default
            // cancelled token when cancellation happens
            // before someone asks for the token
            this._token = CancellationToken.Cancelled;
        }
        else {
            this._token.cancel();
        }
    }
    dispose() {
        if (!this._token) {
            // ensure to initialize with an empty token if we had none
            this._token = CancellationToken.None;
        }
        else if (this._token instanceof MutableToken) {
            // actually dispose
            this._token.dispose();
        }
    }
}
exports.CancellationTokenSource = CancellationTokenSource;

},{"./events":22,"./is":23,"./ral":29}],20:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageConnection = exports.ConnectionOptions = exports.MessageStrategy = exports.CancellationStrategy = exports.CancellationSenderStrategy = exports.CancellationReceiverStrategy = exports.RequestCancellationReceiverStrategy = exports.IdCancellationReceiverStrategy = exports.ConnectionStrategy = exports.ConnectionError = exports.ConnectionErrors = exports.LogTraceNotification = exports.SetTraceNotification = exports.TraceFormat = exports.TraceValues = exports.Trace = exports.NullLogger = exports.ProgressType = exports.ProgressToken = void 0;
const ral_1 = require("./ral");
const Is = require("./is");
const messages_1 = require("./messages");
const linkedMap_1 = require("./linkedMap");
const events_1 = require("./events");
const cancellation_1 = require("./cancellation");
var CancelNotification;
(function (CancelNotification) {
    CancelNotification.type = new messages_1.NotificationType('$/cancelRequest');
})(CancelNotification || (CancelNotification = {}));
var ProgressToken;
(function (ProgressToken) {
    function is(value) {
        return typeof value === 'string' || typeof value === 'number';
    }
    ProgressToken.is = is;
})(ProgressToken || (exports.ProgressToken = ProgressToken = {}));
var ProgressNotification;
(function (ProgressNotification) {
    ProgressNotification.type = new messages_1.NotificationType('$/progress');
})(ProgressNotification || (ProgressNotification = {}));
class ProgressType {
    constructor() {
    }
}
exports.ProgressType = ProgressType;
var StarRequestHandler;
(function (StarRequestHandler) {
    function is(value) {
        return Is.func(value);
    }
    StarRequestHandler.is = is;
})(StarRequestHandler || (StarRequestHandler = {}));
exports.NullLogger = Object.freeze({
    error: () => { },
    warn: () => { },
    info: () => { },
    log: () => { }
});
var Trace;
(function (Trace) {
    Trace[Trace["Off"] = 0] = "Off";
    Trace[Trace["Messages"] = 1] = "Messages";
    Trace[Trace["Compact"] = 2] = "Compact";
    Trace[Trace["Verbose"] = 3] = "Verbose";
})(Trace || (exports.Trace = Trace = {}));
var TraceValues;
(function (TraceValues) {
    /**
     * Turn tracing off.
     */
    TraceValues.Off = 'off';
    /**
     * Trace messages only.
     */
    TraceValues.Messages = 'messages';
    /**
     * Compact message tracing.
     */
    TraceValues.Compact = 'compact';
    /**
     * Verbose message tracing.
     */
    TraceValues.Verbose = 'verbose';
})(TraceValues || (exports.TraceValues = TraceValues = {}));
(function (Trace) {
    function fromString(value) {
        if (!Is.string(value)) {
            return Trace.Off;
        }
        value = value.toLowerCase();
        switch (value) {
            case 'off':
                return Trace.Off;
            case 'messages':
                return Trace.Messages;
            case 'compact':
                return Trace.Compact;
            case 'verbose':
                return Trace.Verbose;
            default:
                return Trace.Off;
        }
    }
    Trace.fromString = fromString;
    function toString(value) {
        switch (value) {
            case Trace.Off:
                return 'off';
            case Trace.Messages:
                return 'messages';
            case Trace.Compact:
                return 'compact';
            case Trace.Verbose:
                return 'verbose';
            default:
                return 'off';
        }
    }
    Trace.toString = toString;
})(Trace || (exports.Trace = Trace = {}));
var TraceFormat;
(function (TraceFormat) {
    TraceFormat["Text"] = "text";
    TraceFormat["JSON"] = "json";
})(TraceFormat || (exports.TraceFormat = TraceFormat = {}));
(function (TraceFormat) {
    function fromString(value) {
        if (!Is.string(value)) {
            return TraceFormat.Text;
        }
        value = value.toLowerCase();
        if (value === 'json') {
            return TraceFormat.JSON;
        }
        else {
            return TraceFormat.Text;
        }
    }
    TraceFormat.fromString = fromString;
})(TraceFormat || (exports.TraceFormat = TraceFormat = {}));
var SetTraceNotification;
(function (SetTraceNotification) {
    SetTraceNotification.type = new messages_1.NotificationType('$/setTrace');
})(SetTraceNotification || (exports.SetTraceNotification = SetTraceNotification = {}));
var LogTraceNotification;
(function (LogTraceNotification) {
    LogTraceNotification.type = new messages_1.NotificationType('$/logTrace');
})(LogTraceNotification || (exports.LogTraceNotification = LogTraceNotification = {}));
var ConnectionErrors;
(function (ConnectionErrors) {
    /**
     * The connection is closed.
     */
    ConnectionErrors[ConnectionErrors["Closed"] = 1] = "Closed";
    /**
     * The connection got disposed.
     */
    ConnectionErrors[ConnectionErrors["Disposed"] = 2] = "Disposed";
    /**
     * The connection is already in listening mode.
     */
    ConnectionErrors[ConnectionErrors["AlreadyListening"] = 3] = "AlreadyListening";
})(ConnectionErrors || (exports.ConnectionErrors = ConnectionErrors = {}));
class ConnectionError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        Object.setPrototypeOf(this, ConnectionError.prototype);
    }
}
exports.ConnectionError = ConnectionError;
var ConnectionStrategy;
(function (ConnectionStrategy) {
    function is(value) {
        const candidate = value;
        return candidate && Is.func(candidate.cancelUndispatched);
    }
    ConnectionStrategy.is = is;
})(ConnectionStrategy || (exports.ConnectionStrategy = ConnectionStrategy = {}));
var IdCancellationReceiverStrategy;
(function (IdCancellationReceiverStrategy) {
    function is(value) {
        const candidate = value;
        return candidate && (candidate.kind === undefined || candidate.kind === 'id') && Is.func(candidate.createCancellationTokenSource) && (candidate.dispose === undefined || Is.func(candidate.dispose));
    }
    IdCancellationReceiverStrategy.is = is;
})(IdCancellationReceiverStrategy || (exports.IdCancellationReceiverStrategy = IdCancellationReceiverStrategy = {}));
var RequestCancellationReceiverStrategy;
(function (RequestCancellationReceiverStrategy) {
    function is(value) {
        const candidate = value;
        return candidate && candidate.kind === 'request' && Is.func(candidate.createCancellationTokenSource) && (candidate.dispose === undefined || Is.func(candidate.dispose));
    }
    RequestCancellationReceiverStrategy.is = is;
})(RequestCancellationReceiverStrategy || (exports.RequestCancellationReceiverStrategy = RequestCancellationReceiverStrategy = {}));
var CancellationReceiverStrategy;
(function (CancellationReceiverStrategy) {
    CancellationReceiverStrategy.Message = Object.freeze({
        createCancellationTokenSource(_) {
            return new cancellation_1.CancellationTokenSource();
        }
    });
    function is(value) {
        return IdCancellationReceiverStrategy.is(value) || RequestCancellationReceiverStrategy.is(value);
    }
    CancellationReceiverStrategy.is = is;
})(CancellationReceiverStrategy || (exports.CancellationReceiverStrategy = CancellationReceiverStrategy = {}));
var CancellationSenderStrategy;
(function (CancellationSenderStrategy) {
    CancellationSenderStrategy.Message = Object.freeze({
        sendCancellation(conn, id) {
            return conn.sendNotification(CancelNotification.type, { id });
        },
        cleanup(_) { }
    });
    function is(value) {
        const candidate = value;
        return candidate && Is.func(candidate.sendCancellation) && Is.func(candidate.cleanup);
    }
    CancellationSenderStrategy.is = is;
})(CancellationSenderStrategy || (exports.CancellationSenderStrategy = CancellationSenderStrategy = {}));
var CancellationStrategy;
(function (CancellationStrategy) {
    CancellationStrategy.Message = Object.freeze({
        receiver: CancellationReceiverStrategy.Message,
        sender: CancellationSenderStrategy.Message
    });
    function is(value) {
        const candidate = value;
        return candidate && CancellationReceiverStrategy.is(candidate.receiver) && CancellationSenderStrategy.is(candidate.sender);
    }
    CancellationStrategy.is = is;
})(CancellationStrategy || (exports.CancellationStrategy = CancellationStrategy = {}));
var MessageStrategy;
(function (MessageStrategy) {
    function is(value) {
        const candidate = value;
        return candidate && Is.func(candidate.handleMessage);
    }
    MessageStrategy.is = is;
})(MessageStrategy || (exports.MessageStrategy = MessageStrategy = {}));
var ConnectionOptions;
(function (ConnectionOptions) {
    function is(value) {
        const candidate = value;
        return candidate && (CancellationStrategy.is(candidate.cancellationStrategy) || ConnectionStrategy.is(candidate.connectionStrategy) || MessageStrategy.is(candidate.messageStrategy));
    }
    ConnectionOptions.is = is;
})(ConnectionOptions || (exports.ConnectionOptions = ConnectionOptions = {}));
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["New"] = 1] = "New";
    ConnectionState[ConnectionState["Listening"] = 2] = "Listening";
    ConnectionState[ConnectionState["Closed"] = 3] = "Closed";
    ConnectionState[ConnectionState["Disposed"] = 4] = "Disposed";
})(ConnectionState || (ConnectionState = {}));
function createMessageConnection(messageReader, messageWriter, _logger, options) {
    const logger = _logger !== undefined ? _logger : exports.NullLogger;
    let sequenceNumber = 0;
    let notificationSequenceNumber = 0;
    let unknownResponseSequenceNumber = 0;
    const version = '2.0';
    let starRequestHandler = undefined;
    const requestHandlers = new Map();
    let starNotificationHandler = undefined;
    const notificationHandlers = new Map();
    const progressHandlers = new Map();
    let timer;
    let messageQueue = new linkedMap_1.LinkedMap();
    let responsePromises = new Map();
    let knownCanceledRequests = new Set();
    let requestTokens = new Map();
    let trace = Trace.Off;
    let traceFormat = TraceFormat.Text;
    let tracer;
    let state = ConnectionState.New;
    const errorEmitter = new events_1.Emitter();
    const closeEmitter = new events_1.Emitter();
    const unhandledNotificationEmitter = new events_1.Emitter();
    const unhandledProgressEmitter = new events_1.Emitter();
    const disposeEmitter = new events_1.Emitter();
    const cancellationStrategy = (options && options.cancellationStrategy) ? options.cancellationStrategy : CancellationStrategy.Message;
    function createRequestQueueKey(id) {
        if (id === null) {
            throw new Error(`Can't send requests with id null since the response can't be correlated.`);
        }
        return 'req-' + id.toString();
    }
    function createResponseQueueKey(id) {
        if (id === null) {
            return 'res-unknown-' + (++unknownResponseSequenceNumber).toString();
        }
        else {
            return 'res-' + id.toString();
        }
    }
    function createNotificationQueueKey() {
        return 'not-' + (++notificationSequenceNumber).toString();
    }
    function addMessageToQueue(queue, message) {
        if (messages_1.Message.isRequest(message)) {
            queue.set(createRequestQueueKey(message.id), message);
        }
        else if (messages_1.Message.isResponse(message)) {
            queue.set(createResponseQueueKey(message.id), message);
        }
        else {
            queue.set(createNotificationQueueKey(), message);
        }
    }
    function cancelUndispatched(_message) {
        return undefined;
    }
    function isListening() {
        return state === ConnectionState.Listening;
    }
    function isClosed() {
        return state === ConnectionState.Closed;
    }
    function isDisposed() {
        return state === ConnectionState.Disposed;
    }
    function closeHandler() {
        if (state === ConnectionState.New || state === ConnectionState.Listening) {
            state = ConnectionState.Closed;
            closeEmitter.fire(undefined);
        }
        // If the connection is disposed don't sent close events.
    }
    function readErrorHandler(error) {
        errorEmitter.fire([error, undefined, undefined]);
    }
    function writeErrorHandler(data) {
        errorEmitter.fire(data);
    }
    messageReader.onClose(closeHandler);
    messageReader.onError(readErrorHandler);
    messageWriter.onClose(closeHandler);
    messageWriter.onError(writeErrorHandler);
    function triggerMessageQueue() {
        if (timer || messageQueue.size === 0) {
            return;
        }
        timer = (0, ral_1.default)().timer.setImmediate(() => {
            timer = undefined;
            processMessageQueue();
        });
    }
    function handleMessage(message) {
        if (messages_1.Message.isRequest(message)) {
            handleRequest(message);
        }
        else if (messages_1.Message.isNotification(message)) {
            handleNotification(message);
        }
        else if (messages_1.Message.isResponse(message)) {
            handleResponse(message);
        }
        else {
            handleInvalidMessage(message);
        }
    }
    function processMessageQueue() {
        if (messageQueue.size === 0) {
            return;
        }
        const message = messageQueue.shift();
        try {
            const messageStrategy = options?.messageStrategy;
            if (MessageStrategy.is(messageStrategy)) {
                messageStrategy.handleMessage(message, handleMessage);
            }
            else {
                handleMessage(message);
            }
        }
        finally {
            triggerMessageQueue();
        }
    }
    const callback = (message) => {
        try {
            // We have received a cancellation message. Check if the message is still in the queue
            // and cancel it if allowed to do so.
            if (messages_1.Message.isNotification(message) && message.method === CancelNotification.type.method) {
                const cancelId = message.params.id;
                const key = createRequestQueueKey(cancelId);
                const toCancel = messageQueue.get(key);
                if (messages_1.Message.isRequest(toCancel)) {
                    const strategy = options?.connectionStrategy;
                    const response = (strategy && strategy.cancelUndispatched) ? strategy.cancelUndispatched(toCancel, cancelUndispatched) : cancelUndispatched(toCancel);
                    if (response && (response.error !== undefined || response.result !== undefined)) {
                        messageQueue.delete(key);
                        requestTokens.delete(cancelId);
                        response.id = toCancel.id;
                        traceSendingResponse(response, message.method, Date.now());
                        messageWriter.write(response).catch(() => logger.error(`Sending response for canceled message failed.`));
                        return;
                    }
                }
                const cancellationToken = requestTokens.get(cancelId);
                // The request is already running. Cancel the token
                if (cancellationToken !== undefined) {
                    cancellationToken.cancel();
                    traceReceivedNotification(message);
                    return;
                }
                else {
                    // Remember the cancel but still queue the message to
                    // clean up state in process message.
                    knownCanceledRequests.add(cancelId);
                }
            }
            addMessageToQueue(messageQueue, message);
        }
        finally {
            triggerMessageQueue();
        }
    };
    function handleRequest(requestMessage) {
        if (isDisposed()) {
            // we return here silently since we fired an event when the
            // connection got disposed.
            return;
        }
        function reply(resultOrError, method, startTime) {
            const message = {
                jsonrpc: version,
                id: requestMessage.id
            };
            if (resultOrError instanceof messages_1.ResponseError) {
                message.error = resultOrError.toJson();
            }
            else {
                message.result = resultOrError === undefined ? null : resultOrError;
            }
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message).catch(() => logger.error(`Sending response failed.`));
        }
        function replyError(error, method, startTime) {
            const message = {
                jsonrpc: version,
                id: requestMessage.id,
                error: error.toJson()
            };
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message).catch(() => logger.error(`Sending response failed.`));
        }
        function replySuccess(result, method, startTime) {
            // The JSON RPC defines that a response must either have a result or an error
            // So we can't treat undefined as a valid response result.
            if (result === undefined) {
                result = null;
            }
            const message = {
                jsonrpc: version,
                id: requestMessage.id,
                result: result
            };
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message).catch(() => logger.error(`Sending response failed.`));
        }
        traceReceivedRequest(requestMessage);
        const element = requestHandlers.get(requestMessage.method);
        let type;
        let requestHandler;
        if (element) {
            type = element.type;
            requestHandler = element.handler;
        }
        const startTime = Date.now();
        if (requestHandler || starRequestHandler) {
            const tokenKey = requestMessage.id ?? String(Date.now()); //
            const cancellationSource = IdCancellationReceiverStrategy.is(cancellationStrategy.receiver)
                ? cancellationStrategy.receiver.createCancellationTokenSource(tokenKey)
                : cancellationStrategy.receiver.createCancellationTokenSource(requestMessage);
            if (requestMessage.id !== null && knownCanceledRequests.has(requestMessage.id)) {
                cancellationSource.cancel();
            }
            if (requestMessage.id !== null) {
                requestTokens.set(tokenKey, cancellationSource);
            }
            try {
                let handlerResult;
                if (requestHandler) {
                    if (requestMessage.params === undefined) {
                        if (type !== undefined && type.numberOfParams !== 0) {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines ${type.numberOfParams} params but received none.`), requestMessage.method, startTime);
                            return;
                        }
                        handlerResult = requestHandler(cancellationSource.token);
                    }
                    else if (Array.isArray(requestMessage.params)) {
                        if (type !== undefined && type.parameterStructures === messages_1.ParameterStructures.byName) {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by name but received parameters by position`), requestMessage.method, startTime);
                            return;
                        }
                        handlerResult = requestHandler(...requestMessage.params, cancellationSource.token);
                    }
                    else {
                        if (type !== undefined && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by position but received parameters by name`), requestMessage.method, startTime);
                            return;
                        }
                        handlerResult = requestHandler(requestMessage.params, cancellationSource.token);
                    }
                }
                else if (starRequestHandler) {
                    handlerResult = starRequestHandler(requestMessage.method, requestMessage.params, cancellationSource.token);
                }
                const promise = handlerResult;
                if (!handlerResult) {
                    requestTokens.delete(tokenKey);
                    replySuccess(handlerResult, requestMessage.method, startTime);
                }
                else if (promise.then) {
                    promise.then((resultOrError) => {
                        requestTokens.delete(tokenKey);
                        reply(resultOrError, requestMessage.method, startTime);
                    }, error => {
                        requestTokens.delete(tokenKey);
                        if (error instanceof messages_1.ResponseError) {
                            replyError(error, requestMessage.method, startTime);
                        }
                        else if (error && Is.string(error.message)) {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
                        }
                        else {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
                        }
                    });
                }
                else {
                    requestTokens.delete(tokenKey);
                    reply(handlerResult, requestMessage.method, startTime);
                }
            }
            catch (error) {
                requestTokens.delete(tokenKey);
                if (error instanceof messages_1.ResponseError) {
                    reply(error, requestMessage.method, startTime);
                }
                else if (error && Is.string(error.message)) {
                    replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
                }
                else {
                    replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
                }
            }
        }
        else {
            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.MethodNotFound, `Unhandled method ${requestMessage.method}`), requestMessage.method, startTime);
        }
    }
    function handleResponse(responseMessage) {
        if (isDisposed()) {
            // See handle request.
            return;
        }
        if (responseMessage.id === null) {
            if (responseMessage.error) {
                logger.error(`Received response message without id: Error is: \n${JSON.stringify(responseMessage.error, undefined, 4)}`);
            }
            else {
                logger.error(`Received response message without id. No further error information provided.`);
            }
        }
        else {
            const key = responseMessage.id;
            const responsePromise = responsePromises.get(key);
            traceReceivedResponse(responseMessage, responsePromise);
            if (responsePromise !== undefined) {
                responsePromises.delete(key);
                try {
                    if (responseMessage.error) {
                        const error = responseMessage.error;
                        responsePromise.reject(new messages_1.ResponseError(error.code, error.message, error.data));
                    }
                    else if (responseMessage.result !== undefined) {
                        responsePromise.resolve(responseMessage.result);
                    }
                    else {
                        throw new Error('Should never happen.');
                    }
                }
                catch (error) {
                    if (error.message) {
                        logger.error(`Response handler '${responsePromise.method}' failed with message: ${error.message}`);
                    }
                    else {
                        logger.error(`Response handler '${responsePromise.method}' failed unexpectedly.`);
                    }
                }
            }
        }
    }
    function handleNotification(message) {
        if (isDisposed()) {
            // See handle request.
            return;
        }
        let type = undefined;
        let notificationHandler;
        if (message.method === CancelNotification.type.method) {
            const cancelId = message.params.id;
            knownCanceledRequests.delete(cancelId);
            traceReceivedNotification(message);
            return;
        }
        else {
            const element = notificationHandlers.get(message.method);
            if (element) {
                notificationHandler = element.handler;
                type = element.type;
            }
        }
        if (notificationHandler || starNotificationHandler) {
            try {
                traceReceivedNotification(message);
                if (notificationHandler) {
                    if (message.params === undefined) {
                        if (type !== undefined) {
                            if (type.numberOfParams !== 0 && type.parameterStructures !== messages_1.ParameterStructures.byName) {
                                logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received none.`);
                            }
                        }
                        notificationHandler();
                    }
                    else if (Array.isArray(message.params)) {
                        // There are JSON-RPC libraries that send progress message as positional params although
                        // specified as named. So convert them if this is the case.
                        const params = message.params;
                        if (message.method === ProgressNotification.type.method && params.length === 2 && ProgressToken.is(params[0])) {
                            notificationHandler({ token: params[0], value: params[1] });
                        }
                        else {
                            if (type !== undefined) {
                                if (type.parameterStructures === messages_1.ParameterStructures.byName) {
                                    logger.error(`Notification ${message.method} defines parameters by name but received parameters by position`);
                                }
                                if (type.numberOfParams !== message.params.length) {
                                    logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received ${params.length} arguments`);
                                }
                            }
                            notificationHandler(...params);
                        }
                    }
                    else {
                        if (type !== undefined && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
                            logger.error(`Notification ${message.method} defines parameters by position but received parameters by name`);
                        }
                        notificationHandler(message.params);
                    }
                }
                else if (starNotificationHandler) {
                    starNotificationHandler(message.method, message.params);
                }
            }
            catch (error) {
                if (error.message) {
                    logger.error(`Notification handler '${message.method}' failed with message: ${error.message}`);
                }
                else {
                    logger.error(`Notification handler '${message.method}' failed unexpectedly.`);
                }
            }
        }
        else {
            unhandledNotificationEmitter.fire(message);
        }
    }
    function handleInvalidMessage(message) {
        if (!message) {
            logger.error('Received empty message.');
            return;
        }
        logger.error(`Received message which is neither a response nor a notification message:\n${JSON.stringify(message, null, 4)}`);
        // Test whether we find an id to reject the promise
        const responseMessage = message;
        if (Is.string(responseMessage.id) || Is.number(responseMessage.id)) {
            const key = responseMessage.id;
            const responseHandler = responsePromises.get(key);
            if (responseHandler) {
                responseHandler.reject(new Error('The received response has neither a result nor an error property.'));
            }
        }
    }
    function stringifyTrace(params) {
        if (params === undefined || params === null) {
            return undefined;
        }
        switch (trace) {
            case Trace.Verbose:
                return JSON.stringify(params, null, 4);
            case Trace.Compact:
                return JSON.stringify(params);
            default:
                return undefined;
        }
    }
    function traceSendingRequest(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if ((trace === Trace.Verbose || trace === Trace.Compact) && message.params) {
                data = `Params: ${stringifyTrace(message.params)}\n\n`;
            }
            tracer.log(`Sending request '${message.method} - (${message.id})'.`, data);
        }
        else {
            logLSPMessage('send-request', message);
        }
    }
    function traceSendingNotification(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose || trace === Trace.Compact) {
                if (message.params) {
                    data = `Params: ${stringifyTrace(message.params)}\n\n`;
                }
                else {
                    data = 'No parameters provided.\n\n';
                }
            }
            tracer.log(`Sending notification '${message.method}'.`, data);
        }
        else {
            logLSPMessage('send-notification', message);
        }
    }
    function traceSendingResponse(message, method, startTime) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose || trace === Trace.Compact) {
                if (message.error && message.error.data) {
                    data = `Error data: ${stringifyTrace(message.error.data)}\n\n`;
                }
                else {
                    if (message.result) {
                        data = `Result: ${stringifyTrace(message.result)}\n\n`;
                    }
                    else if (message.error === undefined) {
                        data = 'No result returned.\n\n';
                    }
                }
            }
            tracer.log(`Sending response '${method} - (${message.id})'. Processing request took ${Date.now() - startTime}ms`, data);
        }
        else {
            logLSPMessage('send-response', message);
        }
    }
    function traceReceivedRequest(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if ((trace === Trace.Verbose || trace === Trace.Compact) && message.params) {
                data = `Params: ${stringifyTrace(message.params)}\n\n`;
            }
            tracer.log(`Received request '${message.method} - (${message.id})'.`, data);
        }
        else {
            logLSPMessage('receive-request', message);
        }
    }
    function traceReceivedNotification(message) {
        if (trace === Trace.Off || !tracer || message.method === LogTraceNotification.type.method) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose || trace === Trace.Compact) {
                if (message.params) {
                    data = `Params: ${stringifyTrace(message.params)}\n\n`;
                }
                else {
                    data = 'No parameters provided.\n\n';
                }
            }
            tracer.log(`Received notification '${message.method}'.`, data);
        }
        else {
            logLSPMessage('receive-notification', message);
        }
    }
    function traceReceivedResponse(message, responsePromise) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose || trace === Trace.Compact) {
                if (message.error && message.error.data) {
                    data = `Error data: ${stringifyTrace(message.error.data)}\n\n`;
                }
                else {
                    if (message.result) {
                        data = `Result: ${stringifyTrace(message.result)}\n\n`;
                    }
                    else if (message.error === undefined) {
                        data = 'No result returned.\n\n';
                    }
                }
            }
            if (responsePromise) {
                const error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : '';
                tracer.log(`Received response '${responsePromise.method} - (${message.id})' in ${Date.now() - responsePromise.timerStart}ms.${error}`, data);
            }
            else {
                tracer.log(`Received response ${message.id} without active response promise.`, data);
            }
        }
        else {
            logLSPMessage('receive-response', message);
        }
    }
    function logLSPMessage(type, message) {
        if (!tracer || trace === Trace.Off) {
            return;
        }
        const lspMessage = {
            isLSPMessage: true,
            type,
            message,
            timestamp: Date.now()
        };
        tracer.log(lspMessage);
    }
    function throwIfClosedOrDisposed() {
        if (isClosed()) {
            throw new ConnectionError(ConnectionErrors.Closed, 'Connection is closed.');
        }
        if (isDisposed()) {
            throw new ConnectionError(ConnectionErrors.Disposed, 'Connection is disposed.');
        }
    }
    function throwIfListening() {
        if (isListening()) {
            throw new ConnectionError(ConnectionErrors.AlreadyListening, 'Connection is already listening');
        }
    }
    function throwIfNotListening() {
        if (!isListening()) {
            throw new Error('Call listen() first.');
        }
    }
    function undefinedToNull(param) {
        if (param === undefined) {
            return null;
        }
        else {
            return param;
        }
    }
    function nullToUndefined(param) {
        if (param === null) {
            return undefined;
        }
        else {
            return param;
        }
    }
    function isNamedParam(param) {
        return param !== undefined && param !== null && !Array.isArray(param) && typeof param === 'object';
    }
    function computeSingleParam(parameterStructures, param) {
        switch (parameterStructures) {
            case messages_1.ParameterStructures.auto:
                if (isNamedParam(param)) {
                    return nullToUndefined(param);
                }
                else {
                    return [undefinedToNull(param)];
                }
            case messages_1.ParameterStructures.byName:
                if (!isNamedParam(param)) {
                    throw new Error(`Received parameters by name but param is not an object literal.`);
                }
                return nullToUndefined(param);
            case messages_1.ParameterStructures.byPosition:
                return [undefinedToNull(param)];
            default:
                throw new Error(`Unknown parameter structure ${parameterStructures.toString()}`);
        }
    }
    function computeMessageParams(type, params) {
        let result;
        const numberOfParams = type.numberOfParams;
        switch (numberOfParams) {
            case 0:
                result = undefined;
                break;
            case 1:
                result = computeSingleParam(type.parameterStructures, params[0]);
                break;
            default:
                result = [];
                for (let i = 0; i < params.length && i < numberOfParams; i++) {
                    result.push(undefinedToNull(params[i]));
                }
                if (params.length < numberOfParams) {
                    for (let i = params.length; i < numberOfParams; i++) {
                        result.push(null);
                    }
                }
                break;
        }
        return result;
    }
    const connection = {
        sendNotification: (type, ...args) => {
            throwIfClosedOrDisposed();
            let method;
            let messageParams;
            if (Is.string(type)) {
                method = type;
                const first = args[0];
                let paramStart = 0;
                let parameterStructures = messages_1.ParameterStructures.auto;
                if (messages_1.ParameterStructures.is(first)) {
                    paramStart = 1;
                    parameterStructures = first;
                }
                let paramEnd = args.length;
                const numberOfParams = paramEnd - paramStart;
                switch (numberOfParams) {
                    case 0:
                        messageParams = undefined;
                        break;
                    case 1:
                        messageParams = computeSingleParam(parameterStructures, args[paramStart]);
                        break;
                    default:
                        if (parameterStructures === messages_1.ParameterStructures.byName) {
                            throw new Error(`Received ${numberOfParams} parameters for 'by Name' notification parameter structure.`);
                        }
                        messageParams = args.slice(paramStart, paramEnd).map(value => undefinedToNull(value));
                        break;
                }
            }
            else {
                const params = args;
                method = type.method;
                messageParams = computeMessageParams(type, params);
            }
            const notificationMessage = {
                jsonrpc: version,
                method: method,
                params: messageParams
            };
            traceSendingNotification(notificationMessage);
            return messageWriter.write(notificationMessage).catch((error) => {
                logger.error(`Sending notification failed.`);
                throw error;
            });
        },
        onNotification: (type, handler) => {
            throwIfClosedOrDisposed();
            let method;
            if (Is.func(type)) {
                starNotificationHandler = type;
            }
            else if (handler) {
                if (Is.string(type)) {
                    method = type;
                    notificationHandlers.set(type, { type: undefined, handler });
                }
                else {
                    method = type.method;
                    notificationHandlers.set(type.method, { type, handler });
                }
            }
            return {
                dispose: () => {
                    if (method !== undefined) {
                        notificationHandlers.delete(method);
                    }
                    else {
                        starNotificationHandler = undefined;
                    }
                }
            };
        },
        onProgress: (_type, token, handler) => {
            if (progressHandlers.has(token)) {
                throw new Error(`Progress handler for token ${token} already registered`);
            }
            progressHandlers.set(token, handler);
            return {
                dispose: () => {
                    progressHandlers.delete(token);
                }
            };
        },
        sendProgress: (_type, token, value) => {
            // This should not await but simple return to ensure that we don't have another
            // async scheduling. Otherwise one send could overtake another send.
            return connection.sendNotification(ProgressNotification.type, { token, value });
        },
        onUnhandledProgress: unhandledProgressEmitter.event,
        sendRequest: (type, ...args) => {
            throwIfClosedOrDisposed();
            throwIfNotListening();
            let method;
            let messageParams;
            let token = undefined;
            if (Is.string(type)) {
                method = type;
                const first = args[0];
                const last = args[args.length - 1];
                let paramStart = 0;
                let parameterStructures = messages_1.ParameterStructures.auto;
                if (messages_1.ParameterStructures.is(first)) {
                    paramStart = 1;
                    parameterStructures = first;
                }
                let paramEnd = args.length;
                if (cancellation_1.CancellationToken.is(last)) {
                    paramEnd = paramEnd - 1;
                    token = last;
                }
                const numberOfParams = paramEnd - paramStart;
                switch (numberOfParams) {
                    case 0:
                        messageParams = undefined;
                        break;
                    case 1:
                        messageParams = computeSingleParam(parameterStructures, args[paramStart]);
                        break;
                    default:
                        if (parameterStructures === messages_1.ParameterStructures.byName) {
                            throw new Error(`Received ${numberOfParams} parameters for 'by Name' request parameter structure.`);
                        }
                        messageParams = args.slice(paramStart, paramEnd).map(value => undefinedToNull(value));
                        break;
                }
            }
            else {
                const params = args;
                method = type.method;
                messageParams = computeMessageParams(type, params);
                const numberOfParams = type.numberOfParams;
                token = cancellation_1.CancellationToken.is(params[numberOfParams]) ? params[numberOfParams] : undefined;
            }
            const id = sequenceNumber++;
            let disposable;
            if (token) {
                disposable = token.onCancellationRequested(() => {
                    const p = cancellationStrategy.sender.sendCancellation(connection, id);
                    if (p === undefined) {
                        logger.log(`Received no promise from cancellation strategy when cancelling id ${id}`);
                        return Promise.resolve();
                    }
                    else {
                        return p.catch(() => {
                            logger.log(`Sending cancellation messages for id ${id} failed`);
                        });
                    }
                });
            }
            const requestMessage = {
                jsonrpc: version,
                id: id,
                method: method,
                params: messageParams
            };
            traceSendingRequest(requestMessage);
            if (typeof cancellationStrategy.sender.enableCancellation === 'function') {
                cancellationStrategy.sender.enableCancellation(requestMessage);
            }
            return new Promise(async (resolve, reject) => {
                const resolveWithCleanup = (r) => {
                    resolve(r);
                    cancellationStrategy.sender.cleanup(id);
                    disposable?.dispose();
                };
                const rejectWithCleanup = (r) => {
                    reject(r);
                    cancellationStrategy.sender.cleanup(id);
                    disposable?.dispose();
                };
                const responsePromise = { method: method, timerStart: Date.now(), resolve: resolveWithCleanup, reject: rejectWithCleanup };
                try {
                    responsePromises.set(id, responsePromise);
                    await messageWriter.write(requestMessage);
                }
                catch (error) {
                    // Writing the message failed. So we need to delete it from the response promises and
                    // reject it.
                    responsePromises.delete(id);
                    responsePromise.reject(new messages_1.ResponseError(messages_1.ErrorCodes.MessageWriteError, error.message ? error.message : 'Unknown reason'));
                    logger.error(`Sending request failed.`);
                    throw error;
                }
            });
        },
        onRequest: (type, handler) => {
            throwIfClosedOrDisposed();
            let method = null;
            if (StarRequestHandler.is(type)) {
                method = undefined;
                starRequestHandler = type;
            }
            else if (Is.string(type)) {
                method = null;
                if (handler !== undefined) {
                    method = type;
                    requestHandlers.set(type, { handler: handler, type: undefined });
                }
            }
            else {
                if (handler !== undefined) {
                    method = type.method;
                    requestHandlers.set(type.method, { type, handler });
                }
            }
            return {
                dispose: () => {
                    if (method === null) {
                        return;
                    }
                    if (method !== undefined) {
                        requestHandlers.delete(method);
                    }
                    else {
                        starRequestHandler = undefined;
                    }
                }
            };
        },
        hasPendingResponse: () => {
            return responsePromises.size > 0;
        },
        trace: async (_value, _tracer, sendNotificationOrTraceOptions) => {
            let _sendNotification = false;
            let _traceFormat = TraceFormat.Text;
            if (sendNotificationOrTraceOptions !== undefined) {
                if (Is.boolean(sendNotificationOrTraceOptions)) {
                    _sendNotification = sendNotificationOrTraceOptions;
                }
                else {
                    _sendNotification = sendNotificationOrTraceOptions.sendNotification || false;
                    _traceFormat = sendNotificationOrTraceOptions.traceFormat || TraceFormat.Text;
                }
            }
            trace = _value;
            traceFormat = _traceFormat;
            if (trace === Trace.Off) {
                tracer = undefined;
            }
            else {
                tracer = _tracer;
            }
            if (_sendNotification && !isClosed() && !isDisposed()) {
                await connection.sendNotification(SetTraceNotification.type, { value: Trace.toString(_value) });
            }
        },
        onError: errorEmitter.event,
        onClose: closeEmitter.event,
        onUnhandledNotification: unhandledNotificationEmitter.event,
        onDispose: disposeEmitter.event,
        end: () => {
            messageWriter.end();
        },
        dispose: () => {
            if (isDisposed()) {
                return;
            }
            state = ConnectionState.Disposed;
            disposeEmitter.fire(undefined);
            const error = new messages_1.ResponseError(messages_1.ErrorCodes.PendingResponseRejected, 'Pending response rejected since connection got disposed');
            for (const promise of responsePromises.values()) {
                promise.reject(error);
            }
            responsePromises = new Map();
            requestTokens = new Map();
            knownCanceledRequests = new Set();
            messageQueue = new linkedMap_1.LinkedMap();
            // Test for backwards compatibility
            if (Is.func(messageWriter.dispose)) {
                messageWriter.dispose();
            }
            if (Is.func(messageReader.dispose)) {
                messageReader.dispose();
            }
        },
        listen: () => {
            throwIfClosedOrDisposed();
            throwIfListening();
            state = ConnectionState.Listening;
            messageReader.listen(callback);
        },
        inspect: () => {
            // eslint-disable-next-line no-console
            (0, ral_1.default)().console.log('inspect');
        }
    };
    connection.onNotification(LogTraceNotification.type, (params) => {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        const verbose = trace === Trace.Verbose || trace === Trace.Compact;
        tracer.log(params.message, verbose ? params.verbose : undefined);
    });
    connection.onNotification(ProgressNotification.type, (params) => {
        const handler = progressHandlers.get(params.token);
        if (handler) {
            handler(params.value);
        }
        else {
            unhandledProgressEmitter.fire(params);
        }
    });
    return connection;
}
exports.createMessageConnection = createMessageConnection;

},{"./cancellation":19,"./events":22,"./is":23,"./linkedMap":24,"./messages":28,"./ral":29}],21:[function(require,module,exports){
"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Disposable = void 0;
var Disposable;
(function (Disposable) {
    function create(func) {
        return {
            dispose: func
        };
    }
    Disposable.create = create;
})(Disposable || (exports.Disposable = Disposable = {}));

},{}],22:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emitter = exports.Event = void 0;
const ral_1 = require("./ral");
var Event;
(function (Event) {
    const _disposable = { dispose() { } };
    Event.None = function () { return _disposable; };
})(Event || (exports.Event = Event = {}));
class CallbackList {
    add(callback, context = null, bucket) {
        if (!this._callbacks) {
            this._callbacks = [];
            this._contexts = [];
        }
        this._callbacks.push(callback);
        this._contexts.push(context);
        if (Array.isArray(bucket)) {
            bucket.push({ dispose: () => this.remove(callback, context) });
        }
    }
    remove(callback, context = null) {
        if (!this._callbacks) {
            return;
        }
        let foundCallbackWithDifferentContext = false;
        for (let i = 0, len = this._callbacks.length; i < len; i++) {
            if (this._callbacks[i] === callback) {
                if (this._contexts[i] === context) {
                    // callback & context match => remove it
                    this._callbacks.splice(i, 1);
                    this._contexts.splice(i, 1);
                    return;
                }
                else {
                    foundCallbackWithDifferentContext = true;
                }
            }
        }
        if (foundCallbackWithDifferentContext) {
            throw new Error('When adding a listener with a context, you should remove it with the same context');
        }
    }
    invoke(...args) {
        if (!this._callbacks) {
            return [];
        }
        const ret = [], callbacks = this._callbacks.slice(0), contexts = this._contexts.slice(0);
        for (let i = 0, len = callbacks.length; i < len; i++) {
            try {
                ret.push(callbacks[i].apply(contexts[i], args));
            }
            catch (e) {
                // eslint-disable-next-line no-console
                (0, ral_1.default)().console.error(e);
            }
        }
        return ret;
    }
    isEmpty() {
        return !this._callbacks || this._callbacks.length === 0;
    }
    dispose() {
        this._callbacks = undefined;
        this._contexts = undefined;
    }
}
class Emitter {
    constructor(_options) {
        this._options = _options;
    }
    /**
     * For the public to allow to subscribe
     * to events from this Emitter
     */
    get event() {
        if (!this._event) {
            this._event = (listener, thisArgs, disposables) => {
                if (!this._callbacks) {
                    this._callbacks = new CallbackList();
                }
                if (this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty()) {
                    this._options.onFirstListenerAdd(this);
                }
                this._callbacks.add(listener, thisArgs);
                const result = {
                    dispose: () => {
                        if (!this._callbacks) {
                            // disposable is disposed after emitter is disposed.
                            return;
                        }
                        this._callbacks.remove(listener, thisArgs);
                        result.dispose = Emitter._noop;
                        if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) {
                            this._options.onLastListenerRemove(this);
                        }
                    }
                };
                if (Array.isArray(disposables)) {
                    disposables.push(result);
                }
                return result;
            };
        }
        return this._event;
    }
    /**
     * To be kept private to fire an event to
     * subscribers
     */
    fire(event) {
        if (this._callbacks) {
            this._callbacks.invoke.call(this._callbacks, event);
        }
    }
    dispose() {
        if (this._callbacks) {
            this._callbacks.dispose();
            this._callbacks = undefined;
        }
    }
}
exports.Emitter = Emitter;
Emitter._noop = function () { };

},{"./ral":29}],23:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringArray = exports.array = exports.func = exports.error = exports.number = exports.string = exports.boolean = void 0;
function boolean(value) {
    return value === true || value === false;
}
exports.boolean = boolean;
function string(value) {
    return typeof value === 'string' || value instanceof String;
}
exports.string = string;
function number(value) {
    return typeof value === 'number' || value instanceof Number;
}
exports.number = number;
function error(value) {
    return value instanceof Error;
}
exports.error = error;
function func(value) {
    return typeof value === 'function';
}
exports.func = func;
function array(value) {
    return Array.isArray(value);
}
exports.array = array;
function stringArray(value) {
    return array(value) && value.every(elem => string(elem));
}
exports.stringArray = stringArray;

},{}],24:[function(require,module,exports){
"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = exports.LinkedMap = exports.Touch = void 0;
var Touch;
(function (Touch) {
    Touch.None = 0;
    Touch.First = 1;
    Touch.AsOld = Touch.First;
    Touch.Last = 2;
    Touch.AsNew = Touch.Last;
})(Touch || (exports.Touch = Touch = {}));
class LinkedMap {
    constructor() {
        this[_a] = 'LinkedMap';
        this._map = new Map();
        this._head = undefined;
        this._tail = undefined;
        this._size = 0;
        this._state = 0;
    }
    clear() {
        this._map.clear();
        this._head = undefined;
        this._tail = undefined;
        this._size = 0;
        this._state++;
    }
    isEmpty() {
        return !this._head && !this._tail;
    }
    get size() {
        return this._size;
    }
    get first() {
        return this._head?.value;
    }
    get last() {
        return this._tail?.value;
    }
    has(key) {
        return this._map.has(key);
    }
    get(key, touch = Touch.None) {
        const item = this._map.get(key);
        if (!item) {
            return undefined;
        }
        if (touch !== Touch.None) {
            this.touch(item, touch);
        }
        return item.value;
    }
    set(key, value, touch = Touch.None) {
        let item = this._map.get(key);
        if (item) {
            item.value = value;
            if (touch !== Touch.None) {
                this.touch(item, touch);
            }
        }
        else {
            item = { key, value, next: undefined, previous: undefined };
            switch (touch) {
                case Touch.None:
                    this.addItemLast(item);
                    break;
                case Touch.First:
                    this.addItemFirst(item);
                    break;
                case Touch.Last:
                    this.addItemLast(item);
                    break;
                default:
                    this.addItemLast(item);
                    break;
            }
            this._map.set(key, item);
            this._size++;
        }
        return this;
    }
    delete(key) {
        return !!this.remove(key);
    }
    remove(key) {
        const item = this._map.get(key);
        if (!item) {
            return undefined;
        }
        this._map.delete(key);
        this.removeItem(item);
        this._size--;
        return item.value;
    }
    shift() {
        if (!this._head && !this._tail) {
            return undefined;
        }
        if (!this._head || !this._tail) {
            throw new Error('Invalid list');
        }
        const item = this._head;
        this._map.delete(item.key);
        this.removeItem(item);
        this._size--;
        return item.value;
    }
    forEach(callbackfn, thisArg) {
        const state = this._state;
        let current = this._head;
        while (current) {
            if (thisArg) {
                callbackfn.bind(thisArg)(current.value, current.key, this);
            }
            else {
                callbackfn(current.value, current.key, this);
            }
            if (this._state !== state) {
                throw new Error(`LinkedMap got modified during iteration.`);
            }
            current = current.next;
        }
    }
    keys() {
        const state = this._state;
        let current = this._head;
        const iterator = {
            [Symbol.iterator]: () => {
                return iterator;
            },
            next: () => {
                if (this._state !== state) {
                    throw new Error(`LinkedMap got modified during iteration.`);
                }
                if (current) {
                    const result = { value: current.key, done: false };
                    current = current.next;
                    return result;
                }
                else {
                    return { value: undefined, done: true };
                }
            }
        };
        return iterator;
    }
    values() {
        const state = this._state;
        let current = this._head;
        const iterator = {
            [Symbol.iterator]: () => {
                return iterator;
            },
            next: () => {
                if (this._state !== state) {
                    throw new Error(`LinkedMap got modified during iteration.`);
                }
                if (current) {
                    const result = { value: current.value, done: false };
                    current = current.next;
                    return result;
                }
                else {
                    return { value: undefined, done: true };
                }
            }
        };
        return iterator;
    }
    entries() {
        const state = this._state;
        let current = this._head;
        const iterator = {
            [Symbol.iterator]: () => {
                return iterator;
            },
            next: () => {
                if (this._state !== state) {
                    throw new Error(`LinkedMap got modified during iteration.`);
                }
                if (current) {
                    const result = { value: [current.key, current.value], done: false };
                    current = current.next;
                    return result;
                }
                else {
                    return { value: undefined, done: true };
                }
            }
        };
        return iterator;
    }
    [(_a = Symbol.toStringTag, Symbol.iterator)]() {
        return this.entries();
    }
    trimOld(newSize) {
        if (newSize >= this.size) {
            return;
        }
        if (newSize === 0) {
            this.clear();
            return;
        }
        let current = this._head;
        let currentSize = this.size;
        while (current && currentSize > newSize) {
            this._map.delete(current.key);
            current = current.next;
            currentSize--;
        }
        this._head = current;
        this._size = currentSize;
        if (current) {
            current.previous = undefined;
        }
        this._state++;
    }
    addItemFirst(item) {
        // First time Insert
        if (!this._head && !this._tail) {
            this._tail = item;
        }
        else if (!this._head) {
            throw new Error('Invalid list');
        }
        else {
            item.next = this._head;
            this._head.previous = item;
        }
        this._head = item;
        this._state++;
    }
    addItemLast(item) {
        // First time Insert
        if (!this._head && !this._tail) {
            this._head = item;
        }
        else if (!this._tail) {
            throw new Error('Invalid list');
        }
        else {
            item.previous = this._tail;
            this._tail.next = item;
        }
        this._tail = item;
        this._state++;
    }
    removeItem(item) {
        if (item === this._head && item === this._tail) {
            this._head = undefined;
            this._tail = undefined;
        }
        else if (item === this._head) {
            // This can only happened if size === 1 which is handle
            // by the case above.
            if (!item.next) {
                throw new Error('Invalid list');
            }
            item.next.previous = undefined;
            this._head = item.next;
        }
        else if (item === this._tail) {
            // This can only happened if size === 1 which is handle
            // by the case above.
            if (!item.previous) {
                throw new Error('Invalid list');
            }
            item.previous.next = undefined;
            this._tail = item.previous;
        }
        else {
            const next = item.next;
            const previous = item.previous;
            if (!next || !previous) {
                throw new Error('Invalid list');
            }
            next.previous = previous;
            previous.next = next;
        }
        item.next = undefined;
        item.previous = undefined;
        this._state++;
    }
    touch(item, touch) {
        if (!this._head || !this._tail) {
            throw new Error('Invalid list');
        }
        if ((touch !== Touch.First && touch !== Touch.Last)) {
            return;
        }
        if (touch === Touch.First) {
            if (item === this._head) {
                return;
            }
            const next = item.next;
            const previous = item.previous;
            // Unlink the item
            if (item === this._tail) {
                // previous must be defined since item was not head but is tail
                // So there are more than on item in the map
                previous.next = undefined;
                this._tail = previous;
            }
            else {
                // Both next and previous are not undefined since item was neither head nor tail.
                next.previous = previous;
                previous.next = next;
            }
            // Insert the node at head
            item.previous = undefined;
            item.next = this._head;
            this._head.previous = item;
            this._head = item;
            this._state++;
        }
        else if (touch === Touch.Last) {
            if (item === this._tail) {
                return;
            }
            const next = item.next;
            const previous = item.previous;
            // Unlink the item.
            if (item === this._head) {
                // next must be defined since item was not tail but is head
                // So there are more than on item in the map
                next.previous = undefined;
                this._head = next;
            }
            else {
                // Both next and previous are not undefined since item was neither head nor tail.
                next.previous = previous;
                previous.next = next;
            }
            item.next = undefined;
            item.previous = this._tail;
            this._tail.next = item;
            this._tail = item;
            this._state++;
        }
    }
    toJSON() {
        const data = [];
        this.forEach((value, key) => {
            data.push([key, value]);
        });
        return data;
    }
    fromJSON(data) {
        this.clear();
        for (const [key, value] of data) {
            this.set(key, value);
        }
    }
}
exports.LinkedMap = LinkedMap;
class LRUCache extends LinkedMap {
    constructor(limit, ratio = 1) {
        super();
        this._limit = limit;
        this._ratio = Math.min(Math.max(0, ratio), 1);
    }
    get limit() {
        return this._limit;
    }
    set limit(limit) {
        this._limit = limit;
        this.checkTrim();
    }
    get ratio() {
        return this._ratio;
    }
    set ratio(ratio) {
        this._ratio = Math.min(Math.max(0, ratio), 1);
        this.checkTrim();
    }
    get(key, touch = Touch.AsNew) {
        return super.get(key, touch);
    }
    peek(key) {
        return super.get(key, Touch.None);
    }
    set(key, value) {
        super.set(key, value, Touch.Last);
        this.checkTrim();
        return this;
    }
    checkTrim() {
        if (this.size > this._limit) {
            this.trimOld(Math.round(this._limit * this._ratio));
        }
    }
}
exports.LRUCache = LRUCache;

},{}],25:[function(require,module,exports){
"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractMessageBuffer = void 0;
const CR = 13;
const LF = 10;
const CRLF = '\r\n';
class AbstractMessageBuffer {
    constructor(encoding = 'utf-8') {
        this._encoding = encoding;
        this._chunks = [];
        this._totalLength = 0;
    }
    get encoding() {
        return this._encoding;
    }
    append(chunk) {
        const toAppend = typeof chunk === 'string' ? this.fromString(chunk, this._encoding) : chunk;
        this._chunks.push(toAppend);
        this._totalLength += toAppend.byteLength;
    }
    tryReadHeaders(lowerCaseKeys = false) {
        if (this._chunks.length === 0) {
            return undefined;
        }
        let state = 0;
        let chunkIndex = 0;
        let offset = 0;
        let chunkBytesRead = 0;
        row: while (chunkIndex < this._chunks.length) {
            const chunk = this._chunks[chunkIndex];
            offset = 0;
            column: while (offset < chunk.length) {
                const value = chunk[offset];
                switch (value) {
                    case CR:
                        switch (state) {
                            case 0:
                                state = 1;
                                break;
                            case 2:
                                state = 3;
                                break;
                            default:
                                state = 0;
                        }
                        break;
                    case LF:
                        switch (state) {
                            case 1:
                                state = 2;
                                break;
                            case 3:
                                state = 4;
                                offset++;
                                break row;
                            default:
                                state = 0;
                        }
                        break;
                    default:
                        state = 0;
                }
                offset++;
            }
            chunkBytesRead += chunk.byteLength;
            chunkIndex++;
        }
        if (state !== 4) {
            return undefined;
        }
        // The buffer contains the two CRLF at the end. So we will
        // have two empty lines after the split at the end as well.
        const buffer = this._read(chunkBytesRead + offset);
        const result = new Map();
        const headers = this.toString(buffer, 'ascii').split(CRLF);
        if (headers.length < 2) {
            return result;
        }
        for (let i = 0; i < headers.length - 2; i++) {
            const header = headers[i];
            const index = header.indexOf(':');
            if (index === -1) {
                throw new Error(`Message header must separate key and value using ':'\n${header}`);
            }
            const key = header.substr(0, index);
            const value = header.substr(index + 1).trim();
            result.set(lowerCaseKeys ? key.toLowerCase() : key, value);
        }
        return result;
    }
    tryReadBody(length) {
        if (this._totalLength < length) {
            return undefined;
        }
        return this._read(length);
    }
    get numberOfBytes() {
        return this._totalLength;
    }
    _read(byteCount) {
        if (byteCount === 0) {
            return this.emptyBuffer();
        }
        if (byteCount > this._totalLength) {
            throw new Error(`Cannot read so many bytes!`);
        }
        if (this._chunks[0].byteLength === byteCount) {
            // super fast path, precisely first chunk must be returned
            const chunk = this._chunks[0];
            this._chunks.shift();
            this._totalLength -= byteCount;
            return this.asNative(chunk);
        }
        if (this._chunks[0].byteLength > byteCount) {
            // fast path, the reading is entirely within the first chunk
            const chunk = this._chunks[0];
            const result = this.asNative(chunk, byteCount);
            this._chunks[0] = chunk.slice(byteCount);
            this._totalLength -= byteCount;
            return result;
        }
        const result = this.allocNative(byteCount);
        let resultOffset = 0;
        let chunkIndex = 0;
        while (byteCount > 0) {
            const chunk = this._chunks[chunkIndex];
            if (chunk.byteLength > byteCount) {
                // this chunk will survive
                const chunkPart = chunk.slice(0, byteCount);
                result.set(chunkPart, resultOffset);
                resultOffset += byteCount;
                this._chunks[chunkIndex] = chunk.slice(byteCount);
                this._totalLength -= byteCount;
                byteCount -= byteCount;
            }
            else {
                // this chunk will be entirely read
                result.set(chunk, resultOffset);
                resultOffset += chunk.byteLength;
                this._chunks.shift();
                this._totalLength -= chunk.byteLength;
                byteCount -= chunk.byteLength;
            }
        }
        return result;
    }
}
exports.AbstractMessageBuffer = AbstractMessageBuffer;

},{}],26:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadableStreamMessageReader = exports.AbstractMessageReader = exports.MessageReader = void 0;
const ral_1 = require("./ral");
const Is = require("./is");
const events_1 = require("./events");
const semaphore_1 = require("./semaphore");
var MessageReader;
(function (MessageReader) {
    function is(value) {
        let candidate = value;
        return candidate && Is.func(candidate.listen) && Is.func(candidate.dispose) &&
            Is.func(candidate.onError) && Is.func(candidate.onClose) && Is.func(candidate.onPartialMessage);
    }
    MessageReader.is = is;
})(MessageReader || (exports.MessageReader = MessageReader = {}));
class AbstractMessageReader {
    constructor() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
        this.partialMessageEmitter = new events_1.Emitter();
    }
    dispose() {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
    }
    get onError() {
        return this.errorEmitter.event;
    }
    fireError(error) {
        this.errorEmitter.fire(this.asError(error));
    }
    get onClose() {
        return this.closeEmitter.event;
    }
    fireClose() {
        this.closeEmitter.fire(undefined);
    }
    get onPartialMessage() {
        return this.partialMessageEmitter.event;
    }
    firePartialMessage(info) {
        this.partialMessageEmitter.fire(info);
    }
    asError(error) {
        if (error instanceof Error) {
            return error;
        }
        else {
            return new Error(`Reader received error. Reason: ${Is.string(error.message) ? error.message : 'unknown'}`);
        }
    }
}
exports.AbstractMessageReader = AbstractMessageReader;
var ResolvedMessageReaderOptions;
(function (ResolvedMessageReaderOptions) {
    function fromOptions(options) {
        let charset;
        let result;
        let contentDecoder;
        const contentDecoders = new Map();
        let contentTypeDecoder;
        const contentTypeDecoders = new Map();
        if (options === undefined || typeof options === 'string') {
            charset = options ?? 'utf-8';
        }
        else {
            charset = options.charset ?? 'utf-8';
            if (options.contentDecoder !== undefined) {
                contentDecoder = options.contentDecoder;
                contentDecoders.set(contentDecoder.name, contentDecoder);
            }
            if (options.contentDecoders !== undefined) {
                for (const decoder of options.contentDecoders) {
                    contentDecoders.set(decoder.name, decoder);
                }
            }
            if (options.contentTypeDecoder !== undefined) {
                contentTypeDecoder = options.contentTypeDecoder;
                contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
            }
            if (options.contentTypeDecoders !== undefined) {
                for (const decoder of options.contentTypeDecoders) {
                    contentTypeDecoders.set(decoder.name, decoder);
                }
            }
        }
        if (contentTypeDecoder === undefined) {
            contentTypeDecoder = (0, ral_1.default)().applicationJson.decoder;
            contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
        }
        return { charset, contentDecoder, contentDecoders, contentTypeDecoder, contentTypeDecoders };
    }
    ResolvedMessageReaderOptions.fromOptions = fromOptions;
})(ResolvedMessageReaderOptions || (ResolvedMessageReaderOptions = {}));
class ReadableStreamMessageReader extends AbstractMessageReader {
    constructor(readable, options) {
        super();
        this.readable = readable;
        this.options = ResolvedMessageReaderOptions.fromOptions(options);
        this.buffer = (0, ral_1.default)().messageBuffer.create(this.options.charset);
        this._partialMessageTimeout = 10000;
        this.nextMessageLength = -1;
        this.messageToken = 0;
        this.readSemaphore = new semaphore_1.Semaphore(1);
    }
    set partialMessageTimeout(timeout) {
        this._partialMessageTimeout = timeout;
    }
    get partialMessageTimeout() {
        return this._partialMessageTimeout;
    }
    listen(callback) {
        this.nextMessageLength = -1;
        this.messageToken = 0;
        this.partialMessageTimer = undefined;
        this.callback = callback;
        const result = this.readable.onData((data) => {
            this.onData(data);
        });
        this.readable.onError((error) => this.fireError(error));
        this.readable.onClose(() => this.fireClose());
        return result;
    }
    onData(data) {
        try {
            this.buffer.append(data);
            while (true) {
                if (this.nextMessageLength === -1) {
                    const headers = this.buffer.tryReadHeaders(true);
                    if (!headers) {
                        return;
                    }
                    const contentLength = headers.get('content-length');
                    if (!contentLength) {
                        this.fireError(new Error(`Header must provide a Content-Length property.\n${JSON.stringify(Object.fromEntries(headers))}`));
                        return;
                    }
                    const length = parseInt(contentLength);
                    if (isNaN(length)) {
                        this.fireError(new Error(`Content-Length value must be a number. Got ${contentLength}`));
                        return;
                    }
                    this.nextMessageLength = length;
                }
                const body = this.buffer.tryReadBody(this.nextMessageLength);
                if (body === undefined) {
                    /** We haven't received the full message yet. */
                    this.setPartialMessageTimer();
                    return;
                }
                this.clearPartialMessageTimer();
                this.nextMessageLength = -1;
                // Make sure that we convert one received message after the
                // other. Otherwise it could happen that a decoding of a second
                // smaller message finished before the decoding of a first larger
                // message and then we would deliver the second message first.
                this.readSemaphore.lock(async () => {
                    const bytes = this.options.contentDecoder !== undefined
                        ? await this.options.contentDecoder.decode(body)
                        : body;
                    const message = await this.options.contentTypeDecoder.decode(bytes, this.options);
                    this.callback(message);
                }).catch((error) => {
                    this.fireError(error);
                });
            }
        }
        catch (error) {
            this.fireError(error);
        }
    }
    clearPartialMessageTimer() {
        if (this.partialMessageTimer) {
            this.partialMessageTimer.dispose();
            this.partialMessageTimer = undefined;
        }
    }
    setPartialMessageTimer() {
        this.clearPartialMessageTimer();
        if (this._partialMessageTimeout <= 0) {
            return;
        }
        this.partialMessageTimer = (0, ral_1.default)().timer.setTimeout((token, timeout) => {
            this.partialMessageTimer = undefined;
            if (token === this.messageToken) {
                this.firePartialMessage({ messageToken: token, waitingTime: timeout });
                this.setPartialMessageTimer();
            }
        }, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout);
    }
}
exports.ReadableStreamMessageReader = ReadableStreamMessageReader;

},{"./events":22,"./is":23,"./ral":29,"./semaphore":30}],27:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteableStreamMessageWriter = exports.AbstractMessageWriter = exports.MessageWriter = void 0;
const ral_1 = require("./ral");
const Is = require("./is");
const semaphore_1 = require("./semaphore");
const events_1 = require("./events");
const ContentLength = 'Content-Length: ';
const CRLF = '\r\n';
var MessageWriter;
(function (MessageWriter) {
    function is(value) {
        let candidate = value;
        return candidate && Is.func(candidate.dispose) && Is.func(candidate.onClose) &&
            Is.func(candidate.onError) && Is.func(candidate.write);
    }
    MessageWriter.is = is;
})(MessageWriter || (exports.MessageWriter = MessageWriter = {}));
class AbstractMessageWriter {
    constructor() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
    }
    dispose() {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
    }
    get onError() {
        return this.errorEmitter.event;
    }
    fireError(error, message, count) {
        this.errorEmitter.fire([this.asError(error), message, count]);
    }
    get onClose() {
        return this.closeEmitter.event;
    }
    fireClose() {
        this.closeEmitter.fire(undefined);
    }
    asError(error) {
        if (error instanceof Error) {
            return error;
        }
        else {
            return new Error(`Writer received error. Reason: ${Is.string(error.message) ? error.message : 'unknown'}`);
        }
    }
}
exports.AbstractMessageWriter = AbstractMessageWriter;
var ResolvedMessageWriterOptions;
(function (ResolvedMessageWriterOptions) {
    function fromOptions(options) {
        if (options === undefined || typeof options === 'string') {
            return { charset: options ?? 'utf-8', contentTypeEncoder: (0, ral_1.default)().applicationJson.encoder };
        }
        else {
            return { charset: options.charset ?? 'utf-8', contentEncoder: options.contentEncoder, contentTypeEncoder: options.contentTypeEncoder ?? (0, ral_1.default)().applicationJson.encoder };
        }
    }
    ResolvedMessageWriterOptions.fromOptions = fromOptions;
})(ResolvedMessageWriterOptions || (ResolvedMessageWriterOptions = {}));
class WriteableStreamMessageWriter extends AbstractMessageWriter {
    constructor(writable, options) {
        super();
        this.writable = writable;
        this.options = ResolvedMessageWriterOptions.fromOptions(options);
        this.errorCount = 0;
        this.writeSemaphore = new semaphore_1.Semaphore(1);
        this.writable.onError((error) => this.fireError(error));
        this.writable.onClose(() => this.fireClose());
    }
    async write(msg) {
        return this.writeSemaphore.lock(async () => {
            const payload = this.options.contentTypeEncoder.encode(msg, this.options).then((buffer) => {
                if (this.options.contentEncoder !== undefined) {
                    return this.options.contentEncoder.encode(buffer);
                }
                else {
                    return buffer;
                }
            });
            return payload.then((buffer) => {
                const headers = [];
                headers.push(ContentLength, buffer.byteLength.toString(), CRLF);
                headers.push(CRLF);
                return this.doWrite(msg, headers, buffer);
            }, (error) => {
                this.fireError(error);
                throw error;
            });
        });
    }
    async doWrite(msg, headers, data) {
        try {
            await this.writable.write(headers.join(''), 'ascii');
            return this.writable.write(data);
        }
        catch (error) {
            this.handleError(error, msg);
            return Promise.reject(error);
        }
    }
    handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
    }
    end() {
        this.writable.end();
    }
}
exports.WriteableStreamMessageWriter = WriteableStreamMessageWriter;

},{"./events":22,"./is":23,"./ral":29,"./semaphore":30}],28:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.NotificationType9 = exports.NotificationType8 = exports.NotificationType7 = exports.NotificationType6 = exports.NotificationType5 = exports.NotificationType4 = exports.NotificationType3 = exports.NotificationType2 = exports.NotificationType1 = exports.NotificationType0 = exports.NotificationType = exports.RequestType9 = exports.RequestType8 = exports.RequestType7 = exports.RequestType6 = exports.RequestType5 = exports.RequestType4 = exports.RequestType3 = exports.RequestType2 = exports.RequestType1 = exports.RequestType = exports.RequestType0 = exports.AbstractMessageSignature = exports.ParameterStructures = exports.ResponseError = exports.ErrorCodes = void 0;
const is = require("./is");
/**
 * Predefined error codes.
 */
var ErrorCodes;
(function (ErrorCodes) {
    // Defined by JSON RPC
    ErrorCodes.ParseError = -32700;
    ErrorCodes.InvalidRequest = -32600;
    ErrorCodes.MethodNotFound = -32601;
    ErrorCodes.InvalidParams = -32602;
    ErrorCodes.InternalError = -32603;
    /**
     * This is the start range of JSON RPC reserved error codes.
     * It doesn't denote a real error code. No application error codes should
     * be defined between the start and end range. For backwards
     * compatibility the `ServerNotInitialized` and the `UnknownErrorCode`
     * are left in the range.
     *
     * @since 3.16.0
    */
    ErrorCodes.jsonrpcReservedErrorRangeStart = -32099;
    /** @deprecated use  jsonrpcReservedErrorRangeStart */
    ErrorCodes.serverErrorStart = -32099;
    /**
     * An error occurred when write a message to the transport layer.
     */
    ErrorCodes.MessageWriteError = -32099;
    /**
     * An error occurred when reading a message from the transport layer.
     */
    ErrorCodes.MessageReadError = -32098;
    /**
     * The connection got disposed or lost and all pending responses got
     * rejected.
     */
    ErrorCodes.PendingResponseRejected = -32097;
    /**
     * The connection is inactive and a use of it failed.
     */
    ErrorCodes.ConnectionInactive = -32096;
    /**
     * Error code indicating that a server received a notification or
     * request before the server has received the `initialize` request.
     */
    ErrorCodes.ServerNotInitialized = -32002;
    ErrorCodes.UnknownErrorCode = -32001;
    /**
     * This is the end range of JSON RPC reserved error codes.
     * It doesn't denote a real error code.
     *
     * @since 3.16.0
    */
    ErrorCodes.jsonrpcReservedErrorRangeEnd = -32000;
    /** @deprecated use  jsonrpcReservedErrorRangeEnd */
    ErrorCodes.serverErrorEnd = -32000;
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
/**
 * An error object return in a response in case a request
 * has failed.
 */
class ResponseError extends Error {
    constructor(code, message, data) {
        super(message);
        this.code = is.number(code) ? code : ErrorCodes.UnknownErrorCode;
        this.data = data;
        Object.setPrototypeOf(this, ResponseError.prototype);
    }
    toJson() {
        const result = {
            code: this.code,
            message: this.message
        };
        if (this.data !== undefined) {
            result.data = this.data;
        }
        return result;
    }
}
exports.ResponseError = ResponseError;
class ParameterStructures {
    constructor(kind) {
        this.kind = kind;
    }
    static is(value) {
        return value === ParameterStructures.auto || value === ParameterStructures.byName || value === ParameterStructures.byPosition;
    }
    toString() {
        return this.kind;
    }
}
exports.ParameterStructures = ParameterStructures;
/**
 * The parameter structure is automatically inferred on the number of parameters
 * and the parameter type in case of a single param.
 */
ParameterStructures.auto = new ParameterStructures('auto');
/**
 * Forces `byPosition` parameter structure. This is useful if you have a single
 * parameter which has a literal type.
 */
ParameterStructures.byPosition = new ParameterStructures('byPosition');
/**
 * Forces `byName` parameter structure. This is only useful when having a single
 * parameter. The library will report errors if used with a different number of
 * parameters.
 */
ParameterStructures.byName = new ParameterStructures('byName');
/**
 * An abstract implementation of a MessageType.
 */
class AbstractMessageSignature {
    constructor(method, numberOfParams) {
        this.method = method;
        this.numberOfParams = numberOfParams;
    }
    get parameterStructures() {
        return ParameterStructures.auto;
    }
}
exports.AbstractMessageSignature = AbstractMessageSignature;
/**
 * Classes to type request response pairs
 */
class RequestType0 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 0);
    }
}
exports.RequestType0 = RequestType0;
class RequestType extends AbstractMessageSignature {
    constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
    }
    get parameterStructures() {
        return this._parameterStructures;
    }
}
exports.RequestType = RequestType;
class RequestType1 extends AbstractMessageSignature {
    constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
    }
    get parameterStructures() {
        return this._parameterStructures;
    }
}
exports.RequestType1 = RequestType1;
class RequestType2 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 2);
    }
}
exports.RequestType2 = RequestType2;
class RequestType3 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 3);
    }
}
exports.RequestType3 = RequestType3;
class RequestType4 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 4);
    }
}
exports.RequestType4 = RequestType4;
class RequestType5 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 5);
    }
}
exports.RequestType5 = RequestType5;
class RequestType6 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 6);
    }
}
exports.RequestType6 = RequestType6;
class RequestType7 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 7);
    }
}
exports.RequestType7 = RequestType7;
class RequestType8 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 8);
    }
}
exports.RequestType8 = RequestType8;
class RequestType9 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 9);
    }
}
exports.RequestType9 = RequestType9;
class NotificationType extends AbstractMessageSignature {
    constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
    }
    get parameterStructures() {
        return this._parameterStructures;
    }
}
exports.NotificationType = NotificationType;
class NotificationType0 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 0);
    }
}
exports.NotificationType0 = NotificationType0;
class NotificationType1 extends AbstractMessageSignature {
    constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
    }
    get parameterStructures() {
        return this._parameterStructures;
    }
}
exports.NotificationType1 = NotificationType1;
class NotificationType2 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 2);
    }
}
exports.NotificationType2 = NotificationType2;
class NotificationType3 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 3);
    }
}
exports.NotificationType3 = NotificationType3;
class NotificationType4 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 4);
    }
}
exports.NotificationType4 = NotificationType4;
class NotificationType5 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 5);
    }
}
exports.NotificationType5 = NotificationType5;
class NotificationType6 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 6);
    }
}
exports.NotificationType6 = NotificationType6;
class NotificationType7 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 7);
    }
}
exports.NotificationType7 = NotificationType7;
class NotificationType8 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 8);
    }
}
exports.NotificationType8 = NotificationType8;
class NotificationType9 extends AbstractMessageSignature {
    constructor(method) {
        super(method, 9);
    }
}
exports.NotificationType9 = NotificationType9;
var Message;
(function (Message) {
    /**
     * Tests if the given message is a request message
     */
    function isRequest(message) {
        const candidate = message;
        return candidate && is.string(candidate.method) && (is.string(candidate.id) || is.number(candidate.id));
    }
    Message.isRequest = isRequest;
    /**
     * Tests if the given message is a notification message
     */
    function isNotification(message) {
        const candidate = message;
        return candidate && is.string(candidate.method) && message.id === void 0;
    }
    Message.isNotification = isNotification;
    /**
     * Tests if the given message is a response message
     */
    function isResponse(message) {
        const candidate = message;
        return candidate && (candidate.result !== void 0 || !!candidate.error) && (is.string(candidate.id) || is.number(candidate.id) || candidate.id === null);
    }
    Message.isResponse = isResponse;
})(Message || (exports.Message = Message = {}));

},{"./is":23}],29:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
let _ral;
function RAL() {
    if (_ral === undefined) {
        throw new Error(`No runtime abstraction layer installed`);
    }
    return _ral;
}
(function (RAL) {
    function install(ral) {
        if (ral === undefined) {
            throw new Error(`No runtime abstraction layer provided`);
        }
        _ral = ral;
    }
    RAL.install = install;
})(RAL || (RAL = {}));
exports.default = RAL;

},{}],30:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Semaphore = void 0;
const ral_1 = require("./ral");
class Semaphore {
    constructor(capacity = 1) {
        if (capacity <= 0) {
            throw new Error('Capacity must be greater than 0');
        }
        this._capacity = capacity;
        this._active = 0;
        this._waiting = [];
    }
    lock(thunk) {
        return new Promise((resolve, reject) => {
            this._waiting.push({ thunk, resolve, reject });
            this.runNext();
        });
    }
    get active() {
        return this._active;
    }
    runNext() {
        if (this._waiting.length === 0 || this._active === this._capacity) {
            return;
        }
        (0, ral_1.default)().timer.setImmediate(() => this.doRunNext());
    }
    doRunNext() {
        if (this._waiting.length === 0 || this._active === this._capacity) {
            return;
        }
        const next = this._waiting.shift();
        this._active++;
        if (this._active > this._capacity) {
            throw new Error(`To many thunks active`);
        }
        try {
            const result = next.thunk();
            if (result instanceof Promise) {
                result.then((value) => {
                    this._active--;
                    next.resolve(value);
                    this.runNext();
                }, (err) => {
                    this._active--;
                    next.reject(err);
                    this.runNext();
                });
            }
            else {
                this._active--;
                next.resolve(result);
                this.runNext();
            }
        }
        catch (err) {
            this._active--;
            next.reject(err);
            this.runNext();
        }
    }
}
exports.Semaphore = Semaphore;

},{"./ral":29}],31:[function(require,module,exports){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedArrayReceiverStrategy = exports.SharedArraySenderStrategy = void 0;
const cancellation_1 = require("./cancellation");
var CancellationState;
(function (CancellationState) {
    CancellationState.Continue = 0;
    CancellationState.Cancelled = 1;
})(CancellationState || (CancellationState = {}));
class SharedArraySenderStrategy {
    constructor() {
        this.buffers = new Map();
    }
    enableCancellation(request) {
        if (request.id === null) {
            return;
        }
        const buffer = new SharedArrayBuffer(4);
        const data = new Int32Array(buffer, 0, 1);
        data[0] = CancellationState.Continue;
        this.buffers.set(request.id, buffer);
        request.$cancellationData = buffer;
    }
    async sendCancellation(_conn, id) {
        const buffer = this.buffers.get(id);
        if (buffer === undefined) {
            return;
        }
        const data = new Int32Array(buffer, 0, 1);
        Atomics.store(data, 0, CancellationState.Cancelled);
    }
    cleanup(id) {
        this.buffers.delete(id);
    }
    dispose() {
        this.buffers.clear();
    }
}
exports.SharedArraySenderStrategy = SharedArraySenderStrategy;
class SharedArrayBufferCancellationToken {
    constructor(buffer) {
        this.data = new Int32Array(buffer, 0, 1);
    }
    get isCancellationRequested() {
        return Atomics.load(this.data, 0) === CancellationState.Cancelled;
    }
    get onCancellationRequested() {
        throw new Error(`Cancellation over SharedArrayBuffer doesn't support cancellation events`);
    }
}
class SharedArrayBufferCancellationTokenSource {
    constructor(buffer) {
        this.token = new SharedArrayBufferCancellationToken(buffer);
    }
    cancel() {
    }
    dispose() {
    }
}
class SharedArrayReceiverStrategy {
    constructor() {
        this.kind = 'request';
    }
    createCancellationTokenSource(request) {
        const buffer = request.$cancellationData;
        if (buffer === undefined) {
            return new cancellation_1.CancellationTokenSource();
        }
        return new SharedArrayBufferCancellationTokenSource(buffer);
    }
}
exports.SharedArrayReceiverStrategy = SharedArrayReceiverStrategy;

},{"./cancellation":19}],32:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageConnection = exports.createServerSocketTransport = exports.createClientSocketTransport = exports.createServerPipeTransport = exports.createClientPipeTransport = exports.generateRandomPipeName = exports.StreamMessageWriter = exports.StreamMessageReader = exports.SocketMessageWriter = exports.SocketMessageReader = exports.PortMessageWriter = exports.PortMessageReader = exports.IPCMessageWriter = exports.IPCMessageReader = void 0;
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ----------------------------------------------------------------------------------------- */
const ril_1 = require("./ril");
// Install the node runtime abstract.
ril_1.default.install();
const path = require("path");
const os = require("os");
const crypto_1 = require("crypto");
const net_1 = require("net");
const api_1 = require("../common/api");
__exportStar(require("../common/api"), exports);
class IPCMessageReader extends api_1.AbstractMessageReader {
    constructor(process) {
        super();
        this.process = process;
        let eventEmitter = this.process;
        eventEmitter.on('error', (error) => this.fireError(error));
        eventEmitter.on('close', () => this.fireClose());
    }
    listen(callback) {
        this.process.on('message', callback);
        return api_1.Disposable.create(() => this.process.off('message', callback));
    }
}
exports.IPCMessageReader = IPCMessageReader;
class IPCMessageWriter extends api_1.AbstractMessageWriter {
    constructor(process) {
        super();
        this.process = process;
        this.errorCount = 0;
        const eventEmitter = this.process;
        eventEmitter.on('error', (error) => this.fireError(error));
        eventEmitter.on('close', () => this.fireClose);
    }
    write(msg) {
        try {
            if (typeof this.process.send === 'function') {
                this.process.send(msg, undefined, undefined, (error) => {
                    if (error) {
                        this.errorCount++;
                        this.handleError(error, msg);
                    }
                    else {
                        this.errorCount = 0;
                    }
                });
            }
            return Promise.resolve();
        }
        catch (error) {
            this.handleError(error, msg);
            return Promise.reject(error);
        }
    }
    handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
    }
    end() {
    }
}
exports.IPCMessageWriter = IPCMessageWriter;
class PortMessageReader extends api_1.AbstractMessageReader {
    constructor(port) {
        super();
        this.onData = new api_1.Emitter;
        port.on('close', () => this.fireClose);
        port.on('error', (error) => this.fireError(error));
        port.on('message', (message) => {
            this.onData.fire(message);
        });
    }
    listen(callback) {
        return this.onData.event(callback);
    }
}
exports.PortMessageReader = PortMessageReader;
class PortMessageWriter extends api_1.AbstractMessageWriter {
    constructor(port) {
        super();
        this.port = port;
        this.errorCount = 0;
        port.on('close', () => this.fireClose());
        port.on('error', (error) => this.fireError(error));
    }
    write(msg) {
        try {
            this.port.postMessage(msg);
            return Promise.resolve();
        }
        catch (error) {
            this.handleError(error, msg);
            return Promise.reject(error);
        }
    }
    handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
    }
    end() {
    }
}
exports.PortMessageWriter = PortMessageWriter;
class SocketMessageReader extends api_1.ReadableStreamMessageReader {
    constructor(socket, encoding = 'utf-8') {
        super((0, ril_1.default)().stream.asReadableStream(socket), encoding);
    }
}
exports.SocketMessageReader = SocketMessageReader;
class SocketMessageWriter extends api_1.WriteableStreamMessageWriter {
    constructor(socket, options) {
        super((0, ril_1.default)().stream.asWritableStream(socket), options);
        this.socket = socket;
    }
    dispose() {
        super.dispose();
        this.socket.destroy();
    }
}
exports.SocketMessageWriter = SocketMessageWriter;
class StreamMessageReader extends api_1.ReadableStreamMessageReader {
    constructor(readable, encoding) {
        super((0, ril_1.default)().stream.asReadableStream(readable), encoding);
    }
}
exports.StreamMessageReader = StreamMessageReader;
class StreamMessageWriter extends api_1.WriteableStreamMessageWriter {
    constructor(writable, options) {
        super((0, ril_1.default)().stream.asWritableStream(writable), options);
    }
}
exports.StreamMessageWriter = StreamMessageWriter;
const XDG_RUNTIME_DIR = process.env['XDG_RUNTIME_DIR'];
const safeIpcPathLengths = new Map([
    ['linux', 107],
    ['darwin', 103]
]);
function generateRandomPipeName() {
    const randomSuffix = (0, crypto_1.randomBytes)(21).toString('hex');
    if (process.platform === 'win32') {
        return `\\\\.\\pipe\\vscode-jsonrpc-${randomSuffix}-sock`;
    }
    let result;
    if (XDG_RUNTIME_DIR) {
        result = path.join(XDG_RUNTIME_DIR, `vscode-ipc-${randomSuffix}.sock`);
    }
    else {
        result = path.join(os.tmpdir(), `vscode-${randomSuffix}.sock`);
    }
    const limit = safeIpcPathLengths.get(process.platform);
    if (limit !== undefined && result.length > limit) {
        (0, ril_1.default)().console.warn(`WARNING: IPC handle "${result}" is longer than ${limit} characters.`);
    }
    return result;
}
exports.generateRandomPipeName = generateRandomPipeName;
function createClientPipeTransport(pipeName, encoding = 'utf-8') {
    let connectResolve;
    const connected = new Promise((resolve, _reject) => {
        connectResolve = resolve;
    });
    return new Promise((resolve, reject) => {
        let server = (0, net_1.createServer)((socket) => {
            server.close();
            connectResolve([
                new SocketMessageReader(socket, encoding),
                new SocketMessageWriter(socket, encoding)
            ]);
        });
        server.on('error', reject);
        server.listen(pipeName, () => {
            server.removeListener('error', reject);
            resolve({
                onConnected: () => { return connected; }
            });
        });
    });
}
exports.createClientPipeTransport = createClientPipeTransport;
function createServerPipeTransport(pipeName, encoding = 'utf-8') {
    const socket = (0, net_1.createConnection)(pipeName);
    return [
        new SocketMessageReader(socket, encoding),
        new SocketMessageWriter(socket, encoding)
    ];
}
exports.createServerPipeTransport = createServerPipeTransport;
function createClientSocketTransport(port, encoding = 'utf-8') {
    let connectResolve;
    const connected = new Promise((resolve, _reject) => {
        connectResolve = resolve;
    });
    return new Promise((resolve, reject) => {
        const server = (0, net_1.createServer)((socket) => {
            server.close();
            connectResolve([
                new SocketMessageReader(socket, encoding),
                new SocketMessageWriter(socket, encoding)
            ]);
        });
        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => {
            server.removeListener('error', reject);
            resolve({
                onConnected: () => { return connected; }
            });
        });
    });
}
exports.createClientSocketTransport = createClientSocketTransport;
function createServerSocketTransport(port, encoding = 'utf-8') {
    const socket = (0, net_1.createConnection)(port, '127.0.0.1');
    return [
        new SocketMessageReader(socket, encoding),
        new SocketMessageWriter(socket, encoding)
    ];
}
exports.createServerSocketTransport = createServerSocketTransport;
function isReadableStream(value) {
    const candidate = value;
    return candidate.read !== undefined && candidate.addListener !== undefined;
}
function isWritableStream(value) {
    const candidate = value;
    return candidate.write !== undefined && candidate.addListener !== undefined;
}
function createMessageConnection(input, output, logger, options) {
    if (!logger) {
        logger = api_1.NullLogger;
    }
    const reader = isReadableStream(input) ? new StreamMessageReader(input) : input;
    const writer = isWritableStream(output) ? new StreamMessageWriter(output) : output;
    if (api_1.ConnectionStrategy.is(options)) {
        options = { connectionStrategy: options };
    }
    return (0, api_1.createMessageConnection)(reader, writer, logger, options);
}
exports.createMessageConnection = createMessageConnection;

},{"../common/api":18,"./ril":33,"crypto":undefined,"net":undefined,"os":undefined,"path":undefined}],33:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const api_1 = require("../common/api");
class MessageBuffer extends api_1.AbstractMessageBuffer {
    constructor(encoding = 'utf-8') {
        super(encoding);
    }
    emptyBuffer() {
        return MessageBuffer.emptyBuffer;
    }
    fromString(value, encoding) {
        return Buffer.from(value, encoding);
    }
    toString(value, encoding) {
        if (value instanceof Buffer) {
            return value.toString(encoding);
        }
        else {
            return new util_1.TextDecoder(encoding).decode(value);
        }
    }
    asNative(buffer, length) {
        if (length === undefined) {
            return buffer instanceof Buffer ? buffer : Buffer.from(buffer);
        }
        else {
            return buffer instanceof Buffer ? buffer.slice(0, length) : Buffer.from(buffer, 0, length);
        }
    }
    allocNative(length) {
        return Buffer.allocUnsafe(length);
    }
}
MessageBuffer.emptyBuffer = Buffer.allocUnsafe(0);
class ReadableStreamWrapper {
    constructor(stream) {
        this.stream = stream;
    }
    onClose(listener) {
        this.stream.on('close', listener);
        return api_1.Disposable.create(() => this.stream.off('close', listener));
    }
    onError(listener) {
        this.stream.on('error', listener);
        return api_1.Disposable.create(() => this.stream.off('error', listener));
    }
    onEnd(listener) {
        this.stream.on('end', listener);
        return api_1.Disposable.create(() => this.stream.off('end', listener));
    }
    onData(listener) {
        this.stream.on('data', listener);
        return api_1.Disposable.create(() => this.stream.off('data', listener));
    }
}
class WritableStreamWrapper {
    constructor(stream) {
        this.stream = stream;
    }
    onClose(listener) {
        this.stream.on('close', listener);
        return api_1.Disposable.create(() => this.stream.off('close', listener));
    }
    onError(listener) {
        this.stream.on('error', listener);
        return api_1.Disposable.create(() => this.stream.off('error', listener));
    }
    onEnd(listener) {
        this.stream.on('end', listener);
        return api_1.Disposable.create(() => this.stream.off('end', listener));
    }
    write(data, encoding) {
        return new Promise((resolve, reject) => {
            const callback = (error) => {
                if (error === undefined || error === null) {
                    resolve();
                }
                else {
                    reject(error);
                }
            };
            if (typeof data === 'string') {
                this.stream.write(data, encoding, callback);
            }
            else {
                this.stream.write(data, callback);
            }
        });
    }
    end() {
        this.stream.end();
    }
}
const _ril = Object.freeze({
    messageBuffer: Object.freeze({
        create: (encoding) => new MessageBuffer(encoding)
    }),
    applicationJson: Object.freeze({
        encoder: Object.freeze({
            name: 'application/json',
            encode: (msg, options) => {
                try {
                    return Promise.resolve(Buffer.from(JSON.stringify(msg, undefined, 0), options.charset));
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
        }),
        decoder: Object.freeze({
            name: 'application/json',
            decode: (buffer, options) => {
                try {
                    if (buffer instanceof Buffer) {
                        return Promise.resolve(JSON.parse(buffer.toString(options.charset)));
                    }
                    else {
                        return Promise.resolve(JSON.parse(new util_1.TextDecoder(options.charset).decode(buffer)));
                    }
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
        })
    }),
    stream: Object.freeze({
        asReadableStream: (stream) => new ReadableStreamWrapper(stream),
        asWritableStream: (stream) => new WritableStreamWrapper(stream)
    }),
    console: console,
    timer: Object.freeze({
        setTimeout(callback, ms, ...args) {
            const handle = setTimeout(callback, ms, ...args);
            return { dispose: () => clearTimeout(handle) };
        },
        setImmediate(callback, ...args) {
            const handle = setImmediate(callback, ...args);
            return { dispose: () => clearImmediate(handle) };
        },
        setInterval(callback, ms, ...args) {
            const handle = setInterval(callback, ms, ...args);
            return { dispose: () => clearInterval(handle) };
        }
    })
});
function RIL() {
    return _ril;
}
(function (RIL) {
    function install() {
        api_1.RAL.install(_ril);
    }
    RIL.install = install;
})(RIL || (RIL = {}));
exports.default = RIL;

}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"../common/api":18,"timers":undefined,"util":undefined}]},{},[5]);

// SIG // Begin signature block
// SIG // MIImQQYJKoZIhvcNAQcCoIImMjCCJi4CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // pRi+jvkqVHE+dWxM4eOFhgAvWixaOAu6Vz4i7kGDxmeg
// SIG // ggt2MIIE/jCCA+agAwIBAgITMwAABaZYEGdLPWx89gAA
// SIG // AAAFpjANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDEwMB4XDTI0MDgyMjE5MjU1N1oX
// SIG // DTI1MDcwNTE5MjU1N1owdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // umNGOR6LgZFk1THk2vW3NrXGKPwTj9NWpe4hKbCXtraY
// SIG // afofK2h67UZgcaUTBp5DnWodrzw5nhwZPG9glhUmMj/e
// SIG // sHENG8/ya59HX9Nv6jQY2MLVPB+Mr/DwlcBtSyXzUbeV
// SIG // nmdmIPF+pxkGFEQLl8KY0bnMmJT5S+s6uuJ12SiACfdu
// SIG // OwvE0JOP44cvTsNjy8PCHNnWo3ejNQVmGUz5Nzn31Li3
// SIG // W8OWY5J7BKMU2c/lf34/VMjJdrPq7qYeDo2IJsYMkSPN
// SIG // ysvnyvokbaWA4oy8ANC7j4m+Ou1WL9JlpDFWr5gN7jfF
// SIG // pbUyqsrSK9rfiwNsdmEAA8yXpII+qEzHEwIDAQABo4IB
// SIG // fTCCAXkwHwYDVR0lBBgwFgYKKwYBBAGCNz0GAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFE6cI++DFsHzFTkxX8wNFC39
// SIG // UpYtMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDg2NSs1MDI3MTIwHwYDVR0jBBgw
// SIG // FoAU5vxfe7siAFjkck619CF0IzLm76wwVgYDVR0fBE8w
// SIG // TTBLoEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29t
// SIG // L3BraS9jcmwvcHJvZHVjdHMvTWljQ29kU2lnUENBXzIw
// SIG // MTAtMDctMDYuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggr
// SIG // BgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraS9jZXJ0cy9NaWNDb2RTaWdQQ0FfMjAxMC0wNy0w
// SIG // Ni5jcnQwDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsF
// SIG // AAOCAQEAtf5mqFjLeh0YfVmslPmBu6sVN3x8lLTdH2eY
// SIG // 1PWbITjY6IEh5YtAf6y2pmPjRij7ebZeJB1lLjdzDh7/
// SIG // 0Y/XG9vQUNyuczRPjMwAk1FNW+w1n8NG2XHMLy+YDqlF
// SIG // UjcuvxVSQXDqLO374g51sl75wnuPb+uoQyMC6s7BdfNm
// SIG // 376xWV+7cVq0PfJltFIciJPp8bxp6zjZ6od39acS/QWe
// SIG // 8710FpYi9ENiV845KUKBFTq4MX6f84Rtz8CDCa5/Yonk
// SIG // NVUerDLKo1b0s6m8b8zMaiu/2s3tj97VP5SvAGz6uhwF
// SIG // nnLZXUJR47uy7tNI6dzWNz9XBgm0DSVjkf1nvdX0QDCC
// SIG // BnAwggRYoAMCAQICCmEMUkwAAAAAAAMwDQYJKoZIhvcN
// SIG // AQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpX
// SIG // YXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
// SIG // VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNV
// SIG // BAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1
// SIG // dGhvcml0eSAyMDEwMB4XDTEwMDcwNjIwNDAxN1oXDTI1
// SIG // MDcwNjIwNTAxN1owfjELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEo
// SIG // MCYGA1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQ
// SIG // Q0EgMjAxMDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC
// SIG // AQoCggEBAOkOZFB5Z7XE4/0JAEyelKz3VmjqRNjPxVhP
// SIG // qaV2fG1FutM5krSkHvn5ZYLkF9KP/UScCOhlk84sVYS/
// SIG // fQjjLiuoQSsYt6JLbklMaxUH3tHSwokecZTNtX9LtK8I
// SIG // 2MyI1msXlDqTziY/7Ob+NJhX1R1dSfayKi7VhbtZP/iQ
// SIG // tCuDdMorsztG4/BGScEXZlTJHL0dxFViV3L4Z7klIDTe
// SIG // XaallV6rKIDN1bKe5QO1Y9OyFMjByIomCll/B+z/Du2A
// SIG // EjVMEqa+Ulv1ptrgiwtId9aFR9UQucboqu6Lai0FXGDG
// SIG // tCpbnCMcX0XjGhQebzfLGTOAaolNo2pmY3iT1TDPlR8C
// SIG // AwEAAaOCAeMwggHfMBAGCSsGAQQBgjcVAQQDAgEAMB0G
// SIG // A1UdDgQWBBTm/F97uyIAWORyTrX0IXQjMubvrDAZBgkr
// SIG // BgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMC
// SIG // AYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBTV
// SIG // 9lbLj+iiXGJo0T2UkFvXzpoYxDBWBgNVHR8ETzBNMEug
// SIG // SaBHhkVodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtp
// SIG // L2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXRfMjAxMC0w
// SIG // Ni0yMy5jcmwwWgYIKwYBBQUHAQEETjBMMEoGCCsGAQUF
// SIG // BzAChj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtp
// SIG // L2NlcnRzL01pY1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNy
// SIG // dDCBnQYDVR0gBIGVMIGSMIGPBgkrBgEEAYI3LgMwgYEw
// SIG // PQYIKwYBBQUHAgEWMWh0dHA6Ly93d3cubWljcm9zb2Z0
// SIG // LmNvbS9QS0kvZG9jcy9DUFMvZGVmYXVsdC5odG0wQAYI
// SIG // KwYBBQUHAgIwNB4yIB0ATABlAGcAYQBsAF8AUABvAGwA
// SIG // aQBjAHkAXwBTAHQAYQB0AGUAbQBlAG4AdAAuIB0wDQYJ
// SIG // KoZIhvcNAQELBQADggIBABp071dPKXvEFoV4uFDTIvwJ
// SIG // nayCl/g0/yosl5US5eS/z7+TyOM0qduBuNweAL7SNW+v
// SIG // 5X95lXflAtTx69jNTh4bYaLCWiMa8IyoYlFFZwjjPzwe
// SIG // k/gwhRfIOUCm1w6zISnlpaFpjCKTzHSY56FHQ/JTrMAP
// SIG // MGl//tIlIG1vYdPfB9XZcgAsaYZ2PVHbpjlIyTdhbQfd
// SIG // UxnLp9Zhwr/ig6sP4GubldZ9KFGwiUpRpJpsyLcfShoO
// SIG // aanX3MF+0Ulwqratu3JHYxf6ptaipobsqBBEm2O2smmJ
// SIG // BsdGhnoYP+jFHSHVe/kCIy3FQcu/HUzIFu+xnH/8IktJ
// SIG // im4V46Z/dlvRU3mRhZ3V0ts9czXzPK5UslJHasCqE5XS
// SIG // jhHamWdeMoz7N4XR3HWFnIfGWleFwr/dDY+Mmy3rtO7P
// SIG // J9O1Xmn6pBYEAackZ3PPTU+23gVWl3r36VJN9HcFT4XG
// SIG // 2Avxju1CCdENduMjVngiJja+yrGMbqod5IXaRzNij6TJ
// SIG // kTNfcR5Ar5hlySLoQiElihwtYNk3iUGJKhYP12E8lGhg
// SIG // Uu/WR5mggEDuFYF3PpzgUxgaUB04lZseZjMTJzkXeIc2
// SIG // zk7DX7L1PUdTtuDl2wthPSrXkizON1o+QEIxpB8QCMJW
// SIG // nL8kXVECnWp50hfT2sGUjgd7JXFEqwZq5tTG3yOalnXF
// SIG // MYIaIzCCGh8CAQEwgZUwfjELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEoMCYGA1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmlu
// SIG // ZyBQQ0EgMjAxMAITMwAABaZYEGdLPWx89gAAAAAFpjAN
// SIG // BglghkgBZQMEAgEFAKCBrjAZBgkqhkiG9w0BCQMxDAYK
// SIG // KwYBBAGCNwIBBDAcBgorBgEEAYI3AgELMQ4wDAYKKwYB
// SIG // BAGCNwIBFTAvBgkqhkiG9w0BCQQxIgQg/ToqTlKU6nGB
// SIG // Fpjqxz5I6CEchnSyU5wPr60r4/Mb69cwQgYKKwYBBAGC
// SIG // NwIBDDE0MDKgFIASAE0AaQBjAHIAbwBzAG8AZgB0oRqA
// SIG // GGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbTANBgkqhkiG
// SIG // 9w0BAQEFAASCAQBz1YLHMIT5v5BpeGd/akEwa3qGtxUz
// SIG // BjX+JaYEoJROTXL/2J9wHj/V8wdrR+oENGI6S9ooHIqt
// SIG // xRe0q3NQxBDTAVR1dqJpD3UHzjIkY11XjggEZ6RhyWLU
// SIG // JIgdr3ghtUy2+e7sprMwDmP7+QFjeJ56/DHZNxBT2sAQ
// SIG // 1TMAwJ9kdDng/1W1vK1kb9Gk3XBK+s1a1/cALIQ2wWXQ
// SIG // fE1DaC+nUcaScBdRe8Dy+tGVuaLRqKlInFsyan4cMA8h
// SIG // DpBIzRJ5+R20B7plu+HiK84D8uZxq7+K4uFv90eccv1O
// SIG // rjqtB5hjDJ1fHaBKjchVQ4WugmrqMeVRscHpsuZ2kLat
// SIG // GGoroYIXrTCCF6kGCisGAQQBgjcDAwExgheZMIIXlQYJ
// SIG // KoZIhvcNAQcCoIIXhjCCF4ICAQMxDzANBglghkgBZQME
// SIG // AgEFADCCAVoGCyqGSIb3DQEJEAEEoIIBSQSCAUUwggFB
// SIG // AgEBBgorBgEEAYRZCgMBMDEwDQYJYIZIAWUDBAIBBQAE
// SIG // INKqYZXFCOy/0tRrgr9o0kLCjYyVQVo7GR7LnN1FItVS
// SIG // AgZnYrRhvlsYEzIwMjUwMTA3MTcyNzE2LjY4NFowBIAC
// SIG // AfSggdmkgdYwgdMxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xLTAr
// SIG // BgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJhdGlv
// SIG // bnMgTGltaXRlZDEnMCUGA1UECxMeblNoaWVsZCBUU1Mg
// SIG // RVNOOjZGMUEtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloIIR+zCCBygw
// SIG // ggUQoAMCAQICEzMAAAH8GKCvzGlahzoAAQAAAfwwDQYJ
// SIG // KoZIhvcNAQELBQAwfDELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEm
// SIG // MCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENB
// SIG // IDIwMTAwHhcNMjQwNzI1MTgzMTE0WhcNMjUxMDIyMTgz
// SIG // MTE0WjCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsGA1UE
// SIG // CxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9ucyBM
// SIG // aW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046
// SIG // NkYxQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFNlcnZpY2UwggIiMA0GCSqGSIb3
// SIG // DQEBAQUAA4ICDwAwggIKAoICAQCnUMAovGltBw9Vg8eU
// SIG // kfJbtbmUFmMlZYOMx+XlbKG4DKU/8sObaFvjKZSZLKZX
// SIG // QQVFByYzwHKnCOFY/wXvHiI7zx370Zn0xCY2HeNIOiGF
// SIG // deB/ys40QDJ8I9WYnMzvK2y6tn3Ghxu4Qvv4/sSQjCg6
// SIG // 4wWVMXYb/O6rHUT7AA2yWk+o+lvw8LnoFDGAkIjUs4Xm
// SIG // WTcB48nvw4vdrD812WS91WXdWAFI9fg1rC3dSBSh+4+f
// SIG // 9yn2/AooHC4hZAQVnzfsZdchOyF3Yx+zqhh/FcS2aPZI
// SIG // EYSHFWzvERG5YZvRwrpp/LudoqRtkja/VSqzG5m33iuf
// SIG // 97LbKe+6eXHRHr9vqc2QLWs5MB9aWmwCP9CXPIzq5hNL
// SIG // FhkLZhbMtttGXSVG1LP7hN2lRT+gBlIH5j6zXZGqaDOL
// SIG // tFXE1wjaWb/+wISboDrecIkKBi0z4st72lOyGX9Z/w46
// SIG // 49BGID6y1OyDz0E4b21uVrPaR946Rh/mF0fymEBu464N
// SIG // B+vqzlhrpb69nPoTRmx6fOLQ60x/lEJraEANhWBTEP6C
// SIG // sLwSm19Z5UBaBgJpAWF4039kY1AySTvxXrfKg8F98kQC
// SIG // 74HnGVM9iiKNR2j01ei8magZePpHxOCyj5A9oAYcrEJs
// SIG // drVAv0BIwXc6zWOuiAIcaLKR+nV0oaeYDnAlPo3HsF52
// SIG // VIOwCQIDAQABo4IBSTCCAUUwHQYDVR0OBBYEFJjxpSux
// SIG // RrOHEHIfv12GJAIv/tB2MB8GA1UdIwQYMBaAFJ+nFV0A
// SIG // XmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRYMFYwVKBSoFCG
// SIG // Tmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMv
// SIG // Y3JsL01pY3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0El
// SIG // MjAyMDEwKDEpLmNybDBsBggrBgEFBQcBAQRgMF4wXAYI
// SIG // KwYBBQUHMAKGUGh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0JTIwVGltZS1T
// SIG // dGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0MAwGA1UdEwEB
// SIG // /wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYD
// SIG // VR0PAQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4ICAQBP
// SIG // uyz9kBnRtNoWyuyIlh3/8tDoiYpv0llIqJHD3GzyHCTl
// SIG // j/vOKCf2Aa3B5EKELaUnwZVEeCsWQHEAKO64+mtLP9Rh
// SIG // fufnbYkpy52da4h4TWnfQFmuo9M6exwP3wNmLpY1MDKa
// SIG // dpLuK3moCA0iet4AltNTZwCiwmh5cAevnRiBIaWYkz5w
// SIG // 3qZgsAvpNMUy0Vgmukr1MzlHKHl5mabpRMmcaDSO3WkX
// SIG // /a7w9J3Pd0PLsMXsoMlp3aofFk5G8zeT1Xxifckjlgs+
// SIG // 4uyjYnmzd+lfIJWBH+GrzqDnON31tFHLKILyIsib833m
// SIG // rodZWwJ7JJ62up+wPJhZK3Av3qHLsMjIsvmKHxgUx3QB
// SIG // 2a9NGjKWYAO4rATZNAJO8+eOcuTvKklbb23XtjJrhX4m
// SIG // XPniwGc9TuQh5hmy9RP5gqDKQ/VAH6n65R1Efp7v1VqL
// SIG // P6J7Basglni1eQMyYvbWeHSP7nwTV5wBgO9PoHjIUh6i
// SIG // fED/oaX1ezsktyI8IgLqEZ2WKIQGnJh5QXSiFkWfs0pC
// SIG // 7zQhnSN3nXVYDZurrH1pSr/MXJ/wSDD526dSPUq02ham
// SIG // rtW4mpqlyRiya+aZgdlcKMrUS6ztXUj5peOsFi6rIz1C
// SIG // l4VlThTTVgbXm5bBQJqPS5mVqH9EZJgx3zjL0MKo6l94
// SIG // oTo8syTuEueG9w5CufE/qTCCB3EwggVZoAMCAQICEzMA
// SIG // AAAVxedrngKbSZkAAAAAABUwDQYJKoZIhvcNAQELBQAw
// SIG // gYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1p
// SIG // Y3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0
// SIG // eSAyMDEwMB4XDTIxMDkzMDE4MjIyNVoXDTMwMDkzMDE4
// SIG // MzIyNVowfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UE
// SIG // AxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAw
// SIG // ggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDk
// SIG // 4aZM57RyIQt5osvXJHm9DtWC0/3unAcH0qlsTnXIyjVX
// SIG // 9gF/bErg4r25PhdgM/9cT8dm95VTcVrifkpa/rg2Z4VG
// SIG // Iwy1jRPPdzLAEBjoYH1qUoNEt6aORmsHFPPFdvWGUNzB
// SIG // RMhxXFExN6AKOG6N7dcP2CZTfDlhAnrEqv1yaa8dq6z2
// SIG // Nr41JmTamDu6GnszrYBbfowQHJ1S/rboYiXcag/PXfT+
// SIG // jlPP1uyFVk3v3byNpOORj7I5LFGc6XBpDco2LXCOMcg1
// SIG // KL3jtIckw+DJj361VI/c+gVVmG1oO5pGve2krnopN6zL
// SIG // 64NF50ZuyjLVwIYwXE8s4mKyzbnijYjklqwBSru+cakX
// SIG // W2dg3viSkR4dPf0gz3N9QZpGdc3EXzTdEonW/aUgfX78
// SIG // 2Z5F37ZyL9t9X4C626p+Nuw2TPYrbqgSUei/BQOj0XOm
// SIG // TTd0lBw0gg/wEPK3Rxjtp+iZfD9M269ewvPV2HM9Q07B
// SIG // MzlMjgK8QmguEOqEUUbi0b1qGFphAXPKZ6Je1yh2AuIz
// SIG // GHLXpyDwwvoSCtdjbwzJNmSLW6CmgyFdXzB0kZSU2LlQ
// SIG // +QuJYfM2BjUYhEfb3BvR/bLUHMVr9lxSUV0S2yW6r1AF
// SIG // emzFER1y7435UsSFF5PAPBXbGjfHCBUYP3irRbb1Hode
// SIG // 2o+eFnJpxq57t7c+auIurQIDAQABo4IB3TCCAdkwEgYJ
// SIG // KwYBBAGCNxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQU
// SIG // KqdS/mTEmr6CkTxGNSnPEP8vBO4wHQYDVR0OBBYEFJ+n
// SIG // FV0AXmJdg/Tl0mWnG1M1GelyMFwGA1UdIARVMFMwUQYM
// SIG // KwYBBAGCN0yDfQEBMEEwPwYIKwYBBQUHAgEWM2h0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvRG9jcy9S
// SIG // ZXBvc2l0b3J5Lmh0bTATBgNVHSUEDDAKBggrBgEFBQcD
// SIG // CDAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNV
// SIG // HQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSME
// SIG // GDAWgBTV9lbLj+iiXGJo0T2UkFvXzpoYxDBWBgNVHR8E
// SIG // TzBNMEugSaBHhkVodHRwOi8vY3JsLm1pY3Jvc29mdC5j
// SIG // b20vcGtpL2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXRf
// SIG // MjAxMC0wNi0yMy5jcmwwWgYIKwYBBQUHAQEETjBMMEoG
// SIG // CCsGAQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpL2NlcnRzL01pY1Jvb0NlckF1dF8yMDEwLTA2
// SIG // LTIzLmNydDANBgkqhkiG9w0BAQsFAAOCAgEAnVV9/Cqt
// SIG // 4SwfZwExJFvhnnJL/Klv6lwUtj5OR2R4sQaTlz0xM7U5
// SIG // 18JxNj/aZGx80HU5bbsPMeTCj/ts0aGUGCLu6WZnOlNN
// SIG // 3Zi6th542DYunKmCVgADsAW+iehp4LoJ7nvfam++Kctu
// SIG // 2D9IdQHZGN5tggz1bSNU5HhTdSRXud2f8449xvNo32X2
// SIG // pFaq95W2KFUn0CS9QKC/GbYSEhFdPSfgQJY4rPf5KYnD
// SIG // vBewVIVCs/wMnosZiefwC2qBwoEZQhlSdYo2wh3DYXMu
// SIG // LGt7bj8sCXgU6ZGyqVvfSaN0DLzskYDSPeZKPmY7T7uG
// SIG // +jIa2Zb0j/aRAfbOxnT99kxybxCrdTDFNLB62FD+Cljd
// SIG // QDzHVG2dY3RILLFORy3BFARxv2T5JL5zbcqOCb2zAVdJ
// SIG // VGTZc9d/HltEAY5aGZFrDZ+kKNxnGSgkujhLmm77IVRr
// SIG // akURR6nxt67I6IleT53S0Ex2tVdUCbFpAUR+fKFhbHP+
// SIG // CrvsQWY9af3LwUFJfn6Tvsv4O+S3Fb+0zj6lMVGEvL8C
// SIG // wYKiexcdFYmNcP7ntdAoGokLjzbaukz5m/8K6TT4JDVn
// SIG // K+ANuOaMmdbhIurwJ0I9JZTmdHRbatGePu1+oDEzfbzL
// SIG // 6Xu/OHBE0ZDxyKs6ijoIYn/ZcGNTTY3ugm2lBRDBcQZq
// SIG // ELQdVTNYs6FwZvKhggNWMIICPgIBATCCAQGhgdmkgdYw
// SIG // gdMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsTJE1p
// SIG // Y3Jvc29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGltaXRl
// SIG // ZDEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjZGMUEt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQBO
// SIG // QSklc5qojbB+oGzDg0tXCpiqqqCBgzCBgKR+MHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEB
// SIG // CwUAAgUA6yeQBTAiGA8yMDI1MDEwNzExMzUzM1oYDzIw
// SIG // MjUwMTA4MTEzNTMzWjB0MDoGCisGAQQBhFkKBAExLDAq
// SIG // MAoCBQDrJ5AFAgEAMAcCAQACAggiMAcCAQACAhLCMAoC
// SIG // BQDrKOGFAgEAMDYGCisGAQQBhFkKBAIxKDAmMAwGCisG
// SIG // AQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMBhqAw
// SIG // DQYJKoZIhvcNAQELBQADggEBAAFnU4zoHvSNuSZITAk+
// SIG // fRjYgyIA3ZQkJg+IQbKB3miF24Ixdra5pKDLDD1+VliF
// SIG // vbZ8ac3PbUkvkMtTPdfh14YNoafSnPzlSE1dvcWy/rrl
// SIG // BQs94YPBmwhVofqDBCe7cmbgiRcLu5/wVGBnHwFnPhTj
// SIG // tzMJDZLI9zqGCaBU6ZM7xvx57Xw5rozjtq60Ulv3ZQkG
// SIG // KJenbiK1ZGPPWV6HtO5TAQQGIYHZzZGQxCrHnr7tK5BH
// SIG // y3XwzltPImwE5IuopVh6fnVWv0zUjqeLUD1YgbHv8MCc
// SIG // jYtviLuk0UZpN+zgtEhUTzw01U01oe2on7bc7haSf73I
// SIG // 4OOjaAC9ABXFIawxggQNMIIECQIBATCBkzB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAfwYoK/MaVqH
// SIG // OgABAAAB/DANBglghkgBZQMEAgEFAKCCAUowGgYJKoZI
// SIG // hvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8GCSqGSIb3DQEJ
// SIG // BDEiBCD2do23+AO5kRbnNmvWcgqovlRDITWytnmZfXqQ
// SIG // KbxSsDCB+gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0E
// SIG // IJVCr5C77+H8E5U/jDB5TBse4JSGH5PuGrd3kwJo0S1i
// SIG // MIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQG
// SIG // A1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIw
// SIG // MTACEzMAAAH8GKCvzGlahzoAAQAAAfwwIgQgGzlhjg7I
// SIG // ToFy9pSlNhypc90n17yAkt7wP32Be04cWeswDQYJKoZI
// SIG // hvcNAQELBQAEggIAK/vrD8l2MIvPTirLyCq4pVRL5V4C
// SIG // H9nPophK5ZuIG90szirL9MqsLEG+cAorBaRJmsb0vrVU
// SIG // XFqrkLw1/vYAMUeKYvJReqQBHSUlejEgDpCvssKqhE5b
// SIG // VYu22QZZP+GvxWymHBIGmU/suTcaAYthIA8vVrL+pGJ7
// SIG // eEebNVjyJgpvdmgw7Rn25o8ZRF4RPW18EgTEXWZhoKgN
// SIG // DwLIqbQsXt08wFq962N/HaPx9+ZZZsJ13qzh0JuIW3+K
// SIG // N1uDwyG6t1YNmjeuDVMpGMg3k2TlyXecmmqC78uNypi+
// SIG // /5qGUQB+ZEO/d0JFN53K9+S0VK5lb++lzHl/DdzBp1Ra
// SIG // TxI+RhUUgnxaA9Po/Sy8FbWRL3T8921kY3gj5URW1ICg
// SIG // lVomTD465eJoB2huLNxfPtko2ognTsOjKuqKCynIfXfn
// SIG // wZO6Bz1ewG3jF1T3dEKHmOwB4I4xv+GJ9qK3tcG5z4h5
// SIG // pFOCbGriaRayfQJ1llLhtaiIjuPfZ6cS6mWvg2iRYac8
// SIG // GnDmrCJAHsb37SGIFAS8taQKSj2JCfK1ymKM9wxxldv+
// SIG // HFxGqaBEhAMFeARjlOJF/lF2zmhFCQrV34qaaGtc4TqA
// SIG // 9Mp4d/XDZpIwMvjEK4WHt0zGOicGmJn+R3Ul5cUAz06F
// SIG // MNARnA/we0b+kEnk3Xxn+5s77P+y9ileu9fS2Qk=
// SIG // End signature block
