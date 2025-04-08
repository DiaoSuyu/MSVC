"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.Activation = void 0;
/* eslint-disable prefer-const */
const promises_1 = require("fs/promises");
const path_1 = require("path");
const yaml_1 = require("yaml");
const constants_1 = require("../constants");
const i18n_1 = require("../i18n");
const checks_1 = require("../util/checks");
const curly_replacements_1 = require("../util/curly-replacements");
const linq_1 = require("../util/linq");
const promise_1 = require("../util/promise");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const XMLWriterImpl = require('xml-writer');
function findCaseInsensitiveOnWindows(map, key) {
    return process.platform === 'win32' ? linq_1.linq.find(map, key) : map.get(key);
}
function displayNoPostScriptError(channels) {
    channels.error((0, i18n_1.i) `no postscript file: run vcpkg-shell with the same arguments`);
}
class Activation {
    allowStacking;
    channels;
    environment;
    postscriptFile;
    undoFile;
    nextUndoEnvironmentFile;
    #defines = new Map();
    #aliases = new Map();
    #environmentChanges = new Map();
    #properties = new Map();
    #msbuild_properties = new Array();
    // Relative to the artifact install
    #locations = new Map();
    #paths = new Map();
    #tools = new Map();
    constructor(allowStacking, channels, environment, postscriptFile, undoFile, nextUndoEnvironmentFile) {
        this.allowStacking = allowStacking;
        this.channels = channels;
        this.environment = environment;
        this.postscriptFile = postscriptFile;
        this.undoFile = undoFile;
        this.nextUndoEnvironmentFile = nextUndoEnvironmentFile;
    }
    static async start(session, allowStacking) {
        const environment = process.env;
        const postscriptFileName = environment[constants_1.postscriptVariable];
        const postscriptFile = postscriptFileName ? session.fileSystem.file(postscriptFileName) : undefined;
        const undoVariableValue = environment[constants_1.undoVariableName];
        const undoFileUri = undoVariableValue ? session.fileSystem.file(undoVariableValue) : undefined;
        const undoFileRaw = undoFileUri ? await undoFileUri.tryReadUTF8() : undefined;
        const undoFile = undoFileRaw ? JSON.parse(undoFileRaw) : undefined;
        const undoStack = undoFile?.stack;
        if (undoFile && !allowStacking) {
            if (undoStack) {
                printDeactivatingMessage(session.channels, undoStack);
                undoStack.length = 0;
            }
            if (undoFile.environment) {
                // form what the environment "would have been" had we deactivated first for figuring out
                // what the new environment should be
                undoActivation(environment, undoFile.environment);
            }
        }
        const nextUndoEnvironmentFile = session.nextPreviousEnvironment;
        return new Activation(allowStacking, session.channels, environment, postscriptFile, undoFile, nextUndoEnvironmentFile);
    }
    addExports(exports, targetFolder) {
        for (let [define, defineValue] of exports.defines) {
            if (!define) {
                continue;
            }
            if (defineValue === 'true') {
                defineValue = '1';
            }
            this.addDefine(define, defineValue);
        }
        // **** paths ****
        for (const [pathName, values] of exports.paths) {
            if (!pathName || !values || values.length === 0) {
                continue;
            }
            // the folder is relative to the artifact install
            for (const folder of values) {
                this.addPath(pathName, targetFolder.join(folder).fsPath);
            }
        }
        // **** tools ****
        for (let [toolName, toolPath] of exports.tools) {
            if (!toolName || !toolPath) {
                continue;
            }
            this.addTool(toolName, targetFolder.join(toolPath).fsPath);
        }
        // **** locations ****
        for (const [name, location] of exports.locations) {
            if (!name || !location) {
                continue;
            }
            this.addLocation(name, targetFolder.join(location).fsPath);
        }
        // **** variables ****
        for (const [name, environmentVariableValues] of exports.environment) {
            if (!name || environmentVariableValues.length === 0) {
                continue;
            }
            this.addEnvironmentVariable(name, environmentVariableValues);
        }
        // **** properties ****
        for (const [name, propertyValues] of exports.properties) {
            if (!name || propertyValues.length === 0) {
                continue;
            }
            this.addProperty(name, propertyValues);
        }
        // **** aliases ****
        for (const [name, alias] of exports.aliases) {
            if (!name || !alias) {
                continue;
            }
            this.addAlias(name, alias);
        }
        // **** msbuild-properties ****
        for (const [name, propertyValue] of exports.msbuild_properties) {
            this.addMSBuildProperty(name, propertyValue, targetFolder);
        }
    }
    /** a collection of #define declarations that would assumably be applied to all compiler calls. */
    addDefine(name, value) {
        const v = findCaseInsensitiveOnWindows(this.#defines, name);
        if (v === undefined) {
            this.#defines.set(name, value);
        }
        else if (v !== value) {
            // conflict. todo: what do we want to do?
            this.channels.warning((0, i18n_1.i) `Duplicate define ${name} during activation. New value will replace old.`);
            this.#defines.set(name, value);
        }
    }
    get defines() {
        return linq_1.linq.entries(this.#defines).selectAsync(async ([key, value]) => [key, await this.resolveAndVerify(value)]);
    }
    async getDefine(name) {
        const v = this.#defines.get(name);
        return v ? await this.resolveAndVerify(v) : undefined;
    }
    /** a collection of tool locations from artifacts */
    addTool(name, value) {
        const t = findCaseInsensitiveOnWindows(this.#tools, name);
        if (t === undefined) {
            this.#tools.set(name, value);
        }
        else if (t !== value) {
            this.channels.warning((0, i18n_1.i) `Duplicate tool declared ${name} during activation.  New value will replace old.`);
            this.#tools.set(name, value);
        }
    }
    get tools() {
        return linq_1.linq.entries(this.#tools).selectAsync(async ([key, value]) => [key, await this.resolveAndVerify(value)]);
    }
    async getTool(name) {
        const t = findCaseInsensitiveOnWindows(this.#tools, name);
        if (t) {
            const path = await this.resolveAndVerify(t);
            return await this.validatePath(path) ? path : undefined;
        }
        return undefined;
    }
    /** Aliases are tools that get exposed to the user as shell aliases */
    addAlias(name, value) {
        const a = findCaseInsensitiveOnWindows(this.#aliases, name);
        if (a === undefined) {
            this.#aliases.set(name, value);
        }
        else if (a !== value) {
            this.channels.warning((0, i18n_1.i) `Duplicate alias declared ${name} during activation.  New value will replace old.`);
            this.#aliases.set(name, value);
        }
    }
    async getAlias(name, refcheck = new Set()) {
        const v = findCaseInsensitiveOnWindows(this.#aliases, name);
        if (v !== undefined) {
            return this.resolveAndVerify(v, [], refcheck);
        }
        return undefined;
    }
    get aliases() {
        return linq_1.linq.entries(this.#aliases).selectAsync(async ([key, value]) => [key, await this.resolveAndVerify(value)]);
    }
    get aliasCount() {
        return this.#aliases.size;
    }
    /** a collection of 'published locations' from artifacts */
    addLocation(name, location) {
        if (!name || !location) {
            return;
        }
        location = typeof location === 'string' ? location : location.fsPath;
        const l = this.#locations.get(name);
        if (l === undefined) {
            this.#locations.set(name, location);
        }
        else if (l !== location) {
            this.channels.warning((0, i18n_1.i) `Duplicate location declared ${name} during activation. New value will replace old.`);
            this.#locations.set(name, location);
        }
    }
    get locations() {
        return linq_1.linq.entries(this.#locations).selectAsync(async ([key, value]) => [key, await this.resolveAndVerify(value)]);
    }
    getLocation(name) {
        const l = this.#locations.get(name);
        return l ? this.resolveAndVerify(l) : undefined;
    }
    /** a collection of environment variables from artifacts that are intended to be combinined into variables that have PATH delimiters */
    addPath(name, location) {
        if (!name || !location) {
            return;
        }
        let set = findCaseInsensitiveOnWindows(this.#paths, name);
        if (!set) {
            set = new Set();
            this.#paths.set(name, set);
        }
        if ((0, checks_1.isIterable)(location)) {
            for (const l of location) {
                set.add(typeof l === 'string' ? l : l.fsPath);
            }
        }
        else {
            set.add(typeof location === 'string' ? location : location.fsPath);
        }
    }
    get paths() {
        return linq_1.linq.entries(this.#paths).selectAsync(async ([key, value]) => [key, await this.resolveAndVerify(value)]);
    }
    async getPath(name) {
        const set = this.#paths.get(name);
        if (!set) {
            return undefined;
        }
        return this.resolveAndVerify(set);
    }
    /** environment variables from artifacts */
    addEnvironmentVariable(name, value) {
        if (!name) {
            return;
        }
        let v = findCaseInsensitiveOnWindows(this.#environmentChanges, name);
        if (!v) {
            v = new Set();
            this.#environmentChanges.set(name, v);
        }
        if (typeof value === 'string') {
            v.add(value);
        }
        else {
            for (const each of value) {
                v.add(each);
            }
        }
    }
    /** a collection of arbitrary properties from artifacts */
    addProperty(name, value) {
        if (!name) {
            return;
        }
        let v = this.#properties.get(name);
        if (v === undefined) {
            v = new Set();
            this.#properties.set(name, v);
        }
        if (typeof value === 'string') {
            v.add(value);
        }
        else {
            for (const each of value) {
                v.add(each);
            }
        }
    }
    get properties() {
        return linq_1.linq.entries(this.#properties).selectAsync(async ([key, value]) => [key, await this.resolveAndVerify(value)]);
    }
    async getProperty(name) {
        const v = this.#properties.get(name);
        return v ? await this.resolveAndVerify(v) : undefined;
    }
    msBuildProcessPropertyValue(value, targetFolder) {
        // note that this is intended to be consistent with vcpkg's handling:
        // include/vcpkg/base/api_stable_format.h
        const initialLocal = targetFolder.fsPath;
        const endsWithSlash = initialLocal.endsWith('\\') || initialLocal.endsWith('/');
        const root = endsWithSlash ? initialLocal.substring(0, initialLocal.length - 1) : initialLocal;
        const replacements = new Map([['root', root]]);
        return (0, curly_replacements_1.replaceCurlyBraces)(value, replacements);
    }
    addMSBuildProperty(name, value, targetFolder) {
        this.#msbuild_properties.push([name, this.msBuildProcessPropertyValue(value, targetFolder)]);
    }
    async resolveAndVerify(value, locals = [], refcheck = new Set()) {
        if (typeof value === 'string') {
            value = this.resolveVariables(value, locals, refcheck);
            if (value.indexOf('{') === -1) {
                return value;
            }
            const parts = value.split(/\{+(.+?)\}+/g);
            const result = [];
            for (let index = 0; index < parts.length; index += 2) {
                result.push(parts[index]);
                result.push(await this.validatePath(parts[index + 1]));
            }
            return result.join('');
        }
        // for sets
        const result = new Set();
        await new promise_1.Queue().enqueueMany(value, async (v) => result.add(await this.resolveAndVerify(v, locals))).done;
        return result;
    }
    resolveVariables(text, locals = [], refcheck = new Set()) {
        if ((0, yaml_1.isScalar)(text)) {
            this.channels.debug(`internal warning: scalar value being used directly : ${text.value}`);
            text = text.value; // spews a --debug warning if a scalar makes its way thru for some reason
        }
        // short-circuiting
        if (!text || text.indexOf('$') === -1) {
            return text;
        }
        // prevent circular resolution
        if (refcheck.has(text)) {
            this.channels.warning((0, i18n_1.i) `Circular variable reference detected: ${text}`);
            this.channels.debug((0, i18n_1.i) `Circular variable reference detected: ${text} - ${linq_1.linq.join(refcheck, ' -> ')}`);
            return text;
        }
        return text.replace(/(\$\$)|(\$)([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)|(\$)([a-zA-Z_][a-zA-Z0-9_]*)/g, (wholeMatch, isDoubleDollar, isObjectMember, obj, member, isSimple, variable) => {
            return isDoubleDollar ? '$' : isObjectMember ? this.getValueForVariableSubstitution(obj, member, locals, refcheck) : this.resolveVariables(locals[variable], locals, refcheck);
        });
    }
    getValueForVariableSubstitution(obj, member, locals, refcheck) {
        switch (obj) {
            case 'environment': {
                // lookup environment variable value
                const v = findCaseInsensitiveOnWindows(this.#environmentChanges, member);
                if (v) {
                    return this.resolveVariables(linq_1.linq.join(v, ' '), [], refcheck);
                }
                // lookup the environment variable in the original environment
                const orig = this.environment[member];
                if (orig) {
                    return orig;
                }
                break;
            }
            case 'defines': {
                const v = findCaseInsensitiveOnWindows(this.#defines, member);
                if (v !== undefined) {
                    return this.resolveVariables(v, locals, refcheck);
                }
                break;
            }
            case 'aliases': {
                const v = findCaseInsensitiveOnWindows(this.#aliases, member);
                if (v !== undefined) {
                    return this.resolveVariables(v, locals, refcheck);
                }
                break;
            }
            case 'locations': {
                const v = findCaseInsensitiveOnWindows(this.#locations, member);
                if (v !== undefined) {
                    return this.resolveVariables(v, locals, refcheck);
                }
                break;
            }
            case 'paths': {
                const v = findCaseInsensitiveOnWindows(this.#paths, member);
                if (v !== undefined) {
                    return this.resolveVariables(linq_1.linq.join(v, path_1.delimiter), locals, refcheck);
                }
                break;
            }
            case 'properties': {
                const v = findCaseInsensitiveOnWindows(this.#properties, member);
                if (v !== undefined) {
                    return this.resolveVariables(linq_1.linq.join(v, ';'), locals, refcheck);
                }
                break;
            }
            case 'tools': {
                const v = findCaseInsensitiveOnWindows(this.#tools, member);
                if (v !== undefined) {
                    return this.resolveVariables(v, locals, refcheck);
                }
                break;
            }
            default:
                this.channels.warning((0, i18n_1.i) `Variable reference found '$${obj}.${member}' that is referencing an unknown base object.`);
                return `$${obj}.${member}`;
        }
        this.channels.debug((0, i18n_1.i) `Unresolved variable reference found ($${obj}.${member}) during variable substitution.`);
        return `$${obj}.${member}`;
    }
    async validatePath(path) {
        if (path) {
            try {
                if (path[0] === '"') {
                    path = path.substr(1, path.length - 2);
                }
                path = (0, path_1.resolve)(path);
                await (0, promises_1.lstat)(path);
                // if the path has spaces, we need to quote it
                if (path.indexOf(' ') !== -1) {
                    path = `"${path}"`;
                }
                return path;
            }
            catch {
                // does not exist
                this.channels.error((0, i18n_1.i) `Invalid path - does not exist: ${path}`);
            }
        }
        return '';
    }
    expandPathLikeVariableExpressions(value) {
        let n = undefined;
        const parts = value.split(/(\$[a-zA-Z0-9_.]+)/g).filter(each => each).map((part, i) => {
            const value = this.resolveVariables(part).replace(/\{(.*?)\}/g, (match, expression) => expression);
            if (value.indexOf(path_1.delimiter) !== -1) {
                n = i;
            }
            return value;
        });
        if (n === undefined) {
            // if the value didn't have a path separator, then just return the value
            return [parts.join('')];
        }
        const front = parts.slice(0, n).join('');
        const back = parts.slice(n + 1).join('');
        return parts[n].split(path_1.delimiter).filter(each => each).map(each => `${front}${each}${back}`);
    }
    generateMSBuild() {
        const result = new XMLWriterImpl('  ');
        result.startDocument('1.0', 'utf-8');
        result.startElement('Project');
        result.writeAttribute('xmlns', 'http://schemas.microsoft.com/developer/msbuild/2003');
        if (this.#msbuild_properties.length) {
            result.startElement('PropertyGroup');
            for (const [key, value] of this.#msbuild_properties) {
                result.writeElement(key, value);
            }
            result.endElement(); // PropertyGroup
        }
        result.endElement(); // Project
        return result.toString();
    }
    async generateEnvironmentVariables() {
        const undo = {};
        const env = {};
        for await (const [pathVariable, locations] of this.paths) {
            if (locations.size) {
                const originalVariable = linq_1.linq.find(this.environment, pathVariable) || '';
                if (originalVariable) {
                    for (const p of originalVariable.split(path_1.delimiter)) {
                        if (p) {
                            locations.add(p);
                        }
                    }
                }
                // compose the final value
                env[pathVariable] = linq_1.linq.join(locations, path_1.delimiter);
                // set the undo data
                undo[pathVariable] = originalVariable || '';
            }
        }
        // combine environment variables with multiple values with spaces (uses: CFLAGS, etc)
        const environmentVariables = linq_1.linq.entries(this.#environmentChanges)
            .selectAsync(async ([key, value]) => [key, await this.resolveAndVerify(value)]);
        for await (const [variable, values] of environmentVariables) {
            env[variable] = linq_1.linq.join(values, ' ');
            undo[variable] = this.environment[variable] || '';
        }
        // .tools get defined as environment variables too.
        for await (const [variable, value] of this.tools) {
            env[variable] = value;
            undo[variable] = this.environment[variable] || '';
        }
        // .defines get compiled into a single environment variable.
        let defines = '';
        for await (const [name, value] of this.defines) {
            defines += value ? `-D${name}=${value} ` : `-D${name} `;
        }
        if (defines) {
            env['DEFINES'] = defines;
            undo['DEFINES'] = this.environment['DEFINES'] || '';
        }
        return [env, undo];
    }
    async activate(thisStackEntries, msbuildFile, json) {
        const postscriptFile = this.postscriptFile;
        if (!postscriptFile && !msbuildFile && !json) {
            displayNoPostScriptError(this.channels);
            return false;
        }
        async function transformtoRecord(orig, 
        // this type cast to U isn't *technically* correct but since it's locally scoped for this next block of code it shouldn't cause problems
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        func = (x => x)) {
            return linq_1.linq.values((await toArrayAsync(orig))).toObject(tuple => [tuple[0], func(tuple[1])]);
        }
        const defines = await transformtoRecord(this.defines);
        const aliases = await transformtoRecord(this.aliases);
        const locations = await transformtoRecord(this.locations);
        const tools = await transformtoRecord(this.tools);
        const properties = await transformtoRecord(this.properties, (set) => Array.from(set));
        const paths = await transformtoRecord(this.paths, (set) => Array.from(set));
        const [variables, undo] = await this.generateEnvironmentVariables();
        // msbuildFile and json are always generated as if deactivation happend first so that their
        // content does not depend on the stacked environment.
        if (msbuildFile) {
            const contents = await this.generateMSBuild();
            this.channels.debug(`--------[START MSBUILD FILE]--------\n${contents}\n--------[END MSBUILD FILE]---------`);
            await msbuildFile.writeUTF8(contents);
        }
        if (json) {
            const contents = generateJson(variables, defines, aliases, properties, locations, paths, tools);
            this.channels.debug(`--------[START ENV VAR FILE]--------\n${contents}\n--------[END ENV VAR FILE]---------`);
            await json.writeUTF8(contents);
        }
        const newUndoStack = this.undoFile?.stack ?? [];
        Array.prototype.push.apply(newUndoStack, thisStackEntries);
        this.channels.message((0, i18n_1.i) `Activating: ${newUndoStack.join(' + ')}`);
        if (postscriptFile) {
            // preserve undo environment variables for anything this particular activation did not touch
            const oldEnvironment = this.undoFile?.environment;
            if (oldEnvironment) {
                for (const oldUndoKey in oldEnvironment) {
                    undo[oldUndoKey] = oldEnvironment[oldUndoKey] ?? '';
                    if (!this.allowStacking && variables[oldUndoKey] === undefined) {
                        variables[oldUndoKey] = '';
                    }
                }
            }
            if (!variables[constants_1.undoVariableName]) {
                variables[constants_1.undoVariableName] = this.nextUndoEnvironmentFile.fsPath;
            }
            // if any aliases were undone, remove them
            const oldAliases = this.undoFile?.aliases;
            if (oldAliases) {
                for (const oldAlias in oldAliases) {
                    if (aliases[oldAlias] === undefined) {
                        aliases[oldAlias] = '';
                    }
                }
            }
            // generate shell script
            await writePostscript(this.channels, postscriptFile, variables, aliases);
            const nonEmptyAliases = [];
            for (const alias in aliases) {
                if (aliases[alias]) {
                    nonEmptyAliases.push(alias);
                }
            }
            const undoContents = {
                environment: undo,
                aliases: nonEmptyAliases,
                stack: newUndoStack
            };
            const undoStringified = JSON.stringify(undoContents);
            this.channels.debug(`--------[START UNDO FILE]--------\n${undoStringified}\n--------[END UNDO FILE]---------`);
            await this.nextUndoEnvironmentFile.writeUTF8(undoStringified);
        }
        return true;
    }
}
exports.Activation = Activation;
function generateCmdScript(variables, aliases) {
    return linq_1.linq.entries(variables).select(([k, v]) => { return v ? `set ${k}=${v}` : `set ${k}=`; }).join('\r\n') +
        '\r\n' +
        linq_1.linq.entries(aliases).select(([k, v]) => { return v ? `doskey ${k}=${v} $*` : `doskey ${k}=`; }).join('\r\n') +
        '\r\n';
}
function generatePowerShellScript(variables, aliases) {
    return linq_1.linq.entries(variables).select(([k, v]) => { return v ? `$\{ENV:${k}}="${v}"` : `$\{ENV:${k}}=$null`; }).join('\n') +
        '\n' +
        linq_1.linq.entries(aliases).select(([k, v]) => { return v ? `function global:${k} { & ${v} @args }` : `remove-item -ea 0 "function:${k}"`; }).join('\n') +
        '\n';
}
function generatePosixScript(variables, aliases) {
    return linq_1.linq.entries(variables).select(([k, v]) => { return v ? `export ${k}="${v}"` : `unset ${k}`; }).join('\n') +
        '\n' +
        linq_1.linq.entries(aliases).select(([k, v]) => { return v ? `${k}() {\n  ${v} $* \n}` : `unset -f ${v} > /dev/null 2>&1`; }).join('\n') +
        '\n';
}
function generateScriptContent(kind, variables, aliases) {
    switch (kind) {
        case '.ps1':
            return generatePowerShellScript(variables, aliases);
        case '.cmd':
            return generateCmdScript(variables, aliases);
        case '.sh':
            return generatePosixScript(variables, aliases);
    }
    return '';
}
async function writePostscript(channels, postscriptFile, variables, aliases) {
    const contents = generateScriptContent((0, path_1.extname)(postscriptFile.fsPath), variables, aliases);
    channels.debug(`--------[START SHELL SCRIPT FILE]--------\n${contents}\n--------[END SHELL SCRIPT FILE]---------`);
    channels.debug(`Postscript file ${postscriptFile}`);
    await postscriptFile.writeUTF8(contents);
}
function generateJson(variables, defines, aliases, properties, locations, paths, tools) {
    let contents = {
        'version': 1,
        variables,
        defines,
        aliases,
        properties,
        locations,
        paths,
        tools
    };
    return JSON.stringify(contents);
}
function printDeactivatingMessage(channels, stack) {
    channels.message((0, i18n_1.i) `Deactivating: ${stack.join(' + ')}`);
}
async function deactivate(session, warnIfNoActivation) {
    const undoVariableValue = process.env[constants_1.undoVariableName];
    if (!undoVariableValue) {
        if (warnIfNoActivation) {
            session.channels.warning((0, i18n_1.i) `nothing is activated, no changes have been made`);
        }
        return true;
    }
    const postscriptFileName = process.env[constants_1.postscriptVariable];
    if (!postscriptFileName) {
        displayNoPostScriptError(session.channels);
        return false;
    }
    const postscriptFile = session.fileSystem.file(postscriptFileName);
    const undoFileUri = session.fileSystem.file(undoVariableValue);
    const undoFileRaw = await undoFileUri.tryReadUTF8();
    if (undoFileRaw) {
        const undoFile = JSON.parse(undoFileRaw);
        const deactivationStack = undoFile.stack;
        if (deactivationStack) {
            printDeactivatingMessage(session.channels, deactivationStack);
        }
        const deactivationEnvironment = { ...undoFile.environment };
        deactivationEnvironment[constants_1.undoVariableName] = '';
        const deactivateAliases = {};
        const aliases = undoFile.aliases;
        if (aliases) {
            for (const alias of aliases) {
                deactivateAliases[alias] = '';
            }
        }
        await writePostscript(session.channels, postscriptFile, deactivationEnvironment, deactivateAliases);
        await undoFileUri.delete();
    }
    return true;
}
exports.deactivate = deactivate;
// replace all values in target with those in source
function undoActivation(target, source) {
    for (const key in source) {
        const value = source[key];
        if (value) {
            target[key] = value;
        }
        else {
            delete target[key];
        }
    }
}
async function toArrayAsync(iterable) {
    const result = [];
    for await (const item of iterable) {
        result.push(item);
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJhcnRpZmFjdHMvYWN0aXZhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdUNBQXVDO0FBQ3ZDLGtDQUFrQzs7O0FBRWxDLGlDQUFpQztBQUVqQywwQ0FBb0M7QUFDcEMsK0JBQW1EO0FBQ25ELCtCQUFnQztBQUNoQyw0Q0FBb0U7QUFDcEUsa0NBQTRCO0FBSTVCLDJDQUE0QztBQUM1QyxtRUFBZ0U7QUFDaEUsdUNBQW9DO0FBQ3BDLDZDQUF3QztBQUV4Qyw4REFBOEQ7QUFDOUQsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBZ0I1QyxTQUFTLDRCQUE0QixDQUFJLEdBQW1CLEVBQUUsR0FBVztJQUN2RSxPQUFPLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxXQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzRSxDQUFDO0FBR0QsU0FBUyx3QkFBd0IsQ0FBQyxRQUFrQjtJQUNsRCxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUEsUUFBQyxFQUFBLDZEQUE2RCxDQUFDLENBQUM7QUFDakYsQ0FBQztBQUVELE1BQWEsVUFBVTtJQWFGO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQWpCbkIsUUFBUSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0lBQ3JDLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztJQUNyQyxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztJQUNyRCxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7SUFDN0MsbUJB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
// SIG // Begin signature block
// SIG // MIIoOgYJKoZIhvcNAQcCoIIoKzCCKCcCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // L5HI/WlYRP4kY1y1y35t+yOwL1VzD85yR8p4SggbeLyg
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
// SIG // ghoNMIIaCQIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCCaDQP2p6XZKlZI
// SIG // 3wVwiKueSKgKIF1Egp1aABRFkOzIhzBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAAD2pbrkI2Dr33TbOFqUHeXyynkYkq2A
// SIG // UCS8S8cvuMH0bloYpIHOx8lKpN7Snd8Rvs+sY1T218SS
// SIG // nFhr3Lk8EEt+EbpJtq4EgE4DWOKAlx3GFOE9YpQgmn6n
// SIG // g5+p19jFg7oljaX2otBtphqMQYuai1dnaUC4VMewVyG8
// SIG // BCttwZc2FbEVxLgufQrlLhojetzTqWevqfqLzPMkX01k
// SIG // SWT0uwtyZ4VyVLSu/Dl3kSAubYdo9X56+u7254Pq84Ac
// SIG // axp+g6FrmVXium0RvBqAyeTT9TDAUELYhPbbN57nFRBI
// SIG // B0FRXEtAzhxZECrC1e8UW58hgHM7AxmD0XOtST62vGk3
// SIG // kWuhgheXMIIXkwYKKwYBBAGCNwMDATGCF4Mwghd/Bgkq
// SIG // hkiG9w0BBwKgghdwMIIXbAIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // 5zqxR0wWEB2JGRTLkBgEzUYHPICDWHggF7Y/91a1OzsC
// SIG // Bmc/WarYqhgTMjAyNDEyMDkyMTAzMzQuNzA4WjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOkUwMDIt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR7TCCByAwggUIoAMCAQIC
// SIG // EzMAAAHuBdMCMLKanacAAQAAAe4wDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTQ0WhcNMjUwMzA1MTg0NTQ0WjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOkUwMDItMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEAvvG8pdeihImvMSkuL1S+0RDjkey82Ai1xLVoHqsj
// SIG // lZa87hM/gKAmuLQRhEo2x01xAnjDsD/Uz3imimpX01OV
// SIG // 0ho6SYaRsefX8TCaE2Fj88w9DtkQJcgZjgQZoiw10Q0C
// SIG // S9UbbgI7woi7pVUHojyPFe/h4U0d/dU2wtW3kscF33Si
// SIG // amNaJ4w2sKgyQJrcLAP4Jql4B8BfX2VnMCkrl4mQU21O
// SIG // X3Jt24YZUTcOXdOC3deWVs1Zf1Q6f4kXqxqNiLP9FsJ/
// SIG // 2t3hjnR6738CG35OpVasGzUBNdTnnZ9rr0YylhMHq1y+
// SIG // 9Drg2fLy88a8tMhHb0PJMvlX6vJnxF0vdO2O6zfx2F+n
// SIG // ArAtrKMlxtzsArSwO6NP/pCiWbjqw+R1K0s95H6oA5Zl
// SIG // suu8/GWT45IgwtXWFtYze+7eYkpeVqdRygaeyVPEYkSP
// SIG // r2NotXG+V9kRJMN1qzVv426H1xLPbeG4HfslPLICp/TL
// SIG // VZ0OubOkBu9jP8mlGRthzCN9bZvZqKB9vbzwTvYwzDiL
// SIG // tC8M1E5CFn5YHf7xFn0zXD1hEI+37FrkqFbid7gasDZk
// SIG // UqZkA80nzGiM7srNKb1dYxVqrasMAnGmP1l7G/2sZMQf
// SIG // 8wk3R0gVCfE5t4uDzPbJIrp12PnEqh+fI1pKR22ywNzn
// SIG // 7LO3viWzIypk3XI5kpG+aDfKlNcCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBQQiM0/GtncIJ69+8Xftr9f3HamCDAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAd2cgL2thCjlklaQZ2JM1/H/B
// SIG // mY2jrOe+xfaNeAJ4fZSsurUt+MF6D1xMkKdb9YiO6yc2
// SIG // VRu66VM52stp/XLH596esu5GJB6rUroAhpk4ogZMIRX0
// SIG // gcijyNPDJJYLybyk2W+u98hn6RcD40MGXiOhD4/zgLaW
// SIG // JE+yFF6jJItQkTCSoHmOMFEQnHCLo3VkZKFb+Cd6v/Oy
// SIG // hNKj0JgEfX6jDcYyN2QpVcQOMIjN7TVZUWxfUoKTp41a
// SIG // Nz/yOafCXeNYTUlQsf/I96jO2i0irQ8zhFDbPmbY4c55
// SIG // mYFHe/wFhw4cAR3S+e0yPYe54mZHzmTl53GLCsRuIK8k
// SIG // 7IVOhurAGKW6nTBP/v4Nbnq+1RiB1LS6t1tAJ5vJQH0v
// SIG // T6rYbJGbeeCRdvAh3bBav+11QbRZcS/yoHEMpSTZ4mvm
// SIG // p4sVButMlA7dxTBkiSN+MRvTR7M9waaklrnhrSYUOWTd
// SIG // CvI7tLzVYBfg79ObIqz4NH7Uin/RVRAqfd6PKIBePI4f
// SIG // Ak/wd9pc9Q+k67pOBM3MOxNTobTjH+wx4DzFn+ljnWJ3
// SIG // /h2kice2U1wibFuaDpDNLC4rcQaUqRnI9mI5zc5wqbBD
// SIG // 2WrdIfune7pUWlkeURwFMhRUPY0WuylmjRnRC07Ppx0p
// SIG // WI2HkKSuUEl44oHSpS0DwZV/vczqBgCYaGX66Y6uJ0Aw
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
// SIG // 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDUDCC
// SIG // AjgCAQEwgfmhgdGkgc4wgcsxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVyaWNhIE9w
// SIG // ZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // TjpFMDAyLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUAiKOm1Tb35RcW1Fgg0N2GCsujvpOggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOsBkeUwIhgPMjAyNDEyMDkxNTU3
// SIG // MjVaGA8yMDI0MTIxMDE1NTcyNVowdzA9BgorBgEEAYRZ
// SIG // CgQBMS8wLTAKAgUA6wGR5QIBADAKAgEAAgIIJAIB/zAH
// SIG // AgEAAgISVTAKAgUA6wLjZQIBADA2BgorBgEEAYRZCgQC
// SIG // MSgwJjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQow
// SIG // CAIBAAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQCdldky
// SIG // QhcukzhkQDUjU7GJYov5MkNYoLxx16LVmSsFvVTrqMFU
// SIG // HpvLGByxRUuX6K67YiQCvIcguzRKm5GDkn/gdz4T0wDq
// SIG // tgEL6U9si0IJTgslfd6GqrsZcpbyTLyLlmJsYz2YN56J
// SIG // SPXCwcya1UADMjoeQ4kBVZXqvlzxHF/p1tWrs0NcvXmu
// SIG // bFNXAJyreiG2+FYVpeDiic1NLmaMgoziRZBFoCha7Tne
// SIG // EgfSnb41pckB6swr5pkA26YtmTIXtoSvtsMAHlbcZKsX
// SIG // w6pvKiZmFz4mKAsZYHlVgSbuURnjcOpvrVwXbM9beoCa
// SIG // osyuWYT7a/U9qw5zV7h/m0gRMAgyMYIEDTCCBAkCAQEw
// SIG // gZMwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMA
// SIG // AAHuBdMCMLKanacAAQAAAe4wDQYJYIZIAWUDBAIBBQCg
// SIG // ggFKMBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAv
// SIG // BgkqhkiG9w0BCQQxIgQgxFd6AvluKzpNg4uARxi4YTMk
// SIG // /TRHwlZC7Xty8e26LIowgfoGCyqGSIb3DQEJEAIvMYHq
// SIG // MIHnMIHkMIG9BCBPUHcUlYX6vlXX/gz7PuRCJAc/aAkv
// SIG // zkH5R5FUYX4wITCBmDCBgKR+MHwxCzAJBgNVBAYTAlVT
// SIG // MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
// SIG // ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFBDQSAyMDEwAhMzAAAB7gXTAjCymp2nAAEAAAHu
// SIG // MCIEIGH5J6XyKQH7YPzUK5yWo4RcCFpjQguEkN9uk/P9
// SIG // UaioMA0GCSqGSIb3DQEBCwUABIICABl6LtJCGbXx5ycm
// SIG // QGv9J2jeUaky1vAFWiuNGK0UiaW/qRcolAfuK0daQZl3
// SIG // /m0z6VO9qRyOl/zlQt+ZeY9yO732n8mF3QxQ+1hnrYTx
// SIG // C9OU+cdJ07MdhCdSAcGEhK0WeOuMvlBFx9c4PE259zWa
// SIG // +pEEzspAV4gFIpjHfJCJwR9YKMz9uuNGVOip7HKnU050
// SIG // h8ZDX+1dpzaRnmGAP9iYpu77/8RmQb4Tnf+w80h0B+Jx
// SIG // cUpROKLngubKj3KfzVp+s6K81+xUbmK/Qw9J9vO4wS4s
// SIG // 5BNC3U38XrWVsc2z5zKMENgz5n2ExfJ7KKNRrsL09GTs
// SIG // D3dQ4txNcMkymQdoG3gGdGPmy6DcMm/+V+YMiNogHBpB
// SIG // mdEi6CPUb8Sgjpr8DlwJJ//f7Dx2bWJAfcahvWXxiWiF
// SIG // nCIXlZe2X6832EQRuSv4kuwVBS5a8lzrP4j2yDewoTmg
// SIG // 8NWhfJI8ni2bGp5bG/+Q3+exXbkB63QQ/0PjVaj5H5QA
// SIG // txnL+pha6clGNgrJXiQ6xi0B7V42/vszbP620nCad02f
// SIG // 8qBZhlGkAoCR8v8NXh9lXzz9uhOz/zMtq2EgwaJOsp9P
// SIG // AcrX434dlVo0YR5yulu81rjL6yyw6GJ8FKJosgdg4sm4
// SIG // mz977B0wJFBHpCrI9dWL+53TzAJ2EIOD5YPUBVUkrgRp
// SIG // UBClH8a/
// SIG // End signature block
