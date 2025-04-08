"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexSchema = exports.SemverKey = exports.IdentityKey = exports.StringKey = exports.Index = void 0;
const semver_1 = require("semver");
const sorted_btree_1 = require("sorted-btree");
const i18n_1 = require("../i18n");
const checks_1 = require("../util/checks");
const linq_1 = require("../util/linq");
/**
 * An Index is the means to search a registry
 *
 * @param TGraph The type of object to create an index for
 * @param TIndexSchema the custom index schema (layout).
 */
class Index {
    indexConstructor;
    /** @internal */
    indexSchema;
    /** @internal */
    indexOfTargets = new Array();
    /**
     * Creates an index for fast searching.
     *
     * @param indexConstructor the class for the custom index.
     */
    constructor(indexConstructor) {
        this.indexConstructor = indexConstructor;
        this.indexSchema = new indexConstructor(this);
    }
    reset() {
        this.indexSchema = new this.indexConstructor(this);
    }
    /**
     * Serializes the index to a javascript object graph that can be persisted.
     */
    serialize() {
        return {
            items: this.indexOfTargets,
            indexes: this.indexSchema.serialize()
        };
    }
    /**
     * Deserializes an object graph to the expected indexes.
     *
     * @param content the object graph to deserialize.
     */
    deserialize(content) {
        this.indexOfTargets = content.items;
        this.indexSchema.deserialize(content.indexes);
    }
    /**
     * Returns a clone of the index that can be searched, which narrows the list of
     */
    get where() {
        // clone the index so that the consumer can filter on it.
        const index = new Index(this.indexConstructor);
        index.indexOfTargets = this.indexOfTargets;
        for (const [key, impl] of this.indexSchema.mapOfKeyObjects.entries()) {
            index.indexSchema.mapOfKeyObjects.get(key).cloneKey(impl);
        }
        return index.indexSchema;
    }
    /** inserts an object into the index */
    insert(content, target) {
        const n = this.indexOfTargets.push(target) - 1;
        const start = process.uptime() * 1000;
        for (const indexKey of this.indexSchema.mapOfKeyObjects.values()) {
            indexKey.insert(content, n);
        }
    }
    doneInsertion() {
        for (const indexKey of this.indexSchema.mapOfKeyObjects.values()) {
            indexKey.doneInsertion();
        }
    }
}
exports.Index = Index;
/**
 * A Key is a means to creating a searchable, sortable index
 */
class Key {
    accessor;
    nestedKeys = new Array();
    values = new sorted_btree_1.default(undefined, this.compare);
    words = new sorted_btree_1.default();
    indexSchema;
    identity;
    alternativeIdentities;
    /** persists the key to an object graph */
    serialize() {
        const result = {
            keys: {},
            words: {},
        };
        for (const each of this.values.entries()) {
            result.keys[each[0]] = [...each[1]];
        }
        for (const each of this.words.entries()) {
            result.words[each[0]] = [...each[1]];
        }
        return result;
    }
    /** deserializes an object graph back into this key */
    deserialize(content) {
        for (const [key, ids] of (0, linq_1.entries)(content.keys)) {
            this.values.set(this.coerce(key), new Set(ids));
        }
        for (const [key, ids] of (0, linq_1.entries)(content.words)) {
            this.words.set(key, new Set(ids));
        }
    }
    /** @internal */
    cloneKey(from) {
        this.values = from.values.greedyClone();
        this.words = from.words.greedyClone();
    }
    /** adds key value to this Key */
    addKey(each, n) {
        let set = this.values.get(each);
        if (!set) {
            set = new Set();
            this.values.set(each, set);
        }
        set.add(n);
    }
    /** adds a 'word' value to this key  */
    addWord(each, n) {
        const words = each.toString().split(/(\W+)/g);
        for (let word = 0; word < words.length; word += 2) {
            for (let i = word; i < words.length; i += 2) {
                const s = words.slice(word, i + 1).join('');
                if (s && s.indexOf(' ') === -1) {
                    let set = this.words.get(s);
                    if (!set) {
                        set = new Set();
                        this.words.set(s, set);
                    }
                    set.add(n);
                }
            }
        }
    }
    /** processes an object to generate key/word values for it. */
    insert(graph, n) {
        let value = this.accessor(graph);
        if (value) {
            value = (Array.isArray(value) ? value
                : typeof value === 'string' ? [value]
                    : (0, checks_1.isIterable)(value) ? [...value] : [value]);
            this.insertKey(graph, n, value);
        }
    }
    /** insert the key/word values and process any children */
    insertKey(graph, n, value) {
        if ((0, checks_1.isIterable)(value)) {
            for (const each of value) {
                this.addKey(each, n);
                this.addWord(each, n);
                if (this.nestedKeys) {
                    for (const child of this.nestedKeys) {
                        const v = child.accessor(graph, each.toString());
                        if (v) {
                            child.insertKey(graph, n, v);
                        }
                    }
                }
            }
        }
        else {
            this.addKey(value, n);
            this.addWord(value, n);
        }
    }
    /** construct a Key */
    constructor(indexSchema, accessor, protoIdentity) {
        this.accessor = accessor;
        this.indexSchema = indexSchema;
        if (typeof protoIdentity === 'string') {
            this.identity = protoIdentity;
            this.alternativeIdentities = [protoIdentity];
        }
        else {
            this.identity = protoIdentity[0];
            this.alternativeIdentities = protoIdentity;
        }
        this.indexSchema.mapOfKeyObjects.set(this.identity, this);
    }
    /** word search */
    contains(value) {
        if (value !== undefined && value !== '') {
            const matches = this.words.get(value.toString());
            this.indexSchema.filter(matches || []);
        }
        return this.indexSchema;
    }
    /** exact match search */
    equals(value) {
        if (value !== undefined && value !== '') {
            const matches = this.values.get(this.coerce(value));
            this.indexSchema.filter(matches || []);
        }
        return this.indexSchema;
    }
    /** metadata value is greater than search */
    greaterThan(value) {
        const max = this.values.maxKey();
        const set = new Set();
        if (max && value !== undefined && value !== '') {
            this.values.forRange(this.coerce(value), max, true, (k, v) => {
                for (const n of v) {
                    set.add(n);
                }
            });
        }
        this.indexSchema.filter(set.values());
        return this.indexSchema;
    }
    /** metadata value is less than search */
    lessThan(value) {
        const min = this.values.minKey();
        const set = new Set();
        if (min && value !== undefined && value !== '') {
            value = this.coerce(value);
            this.values.forRange(min, this.coerce(value), false, (k, v) => {
                for (const n of v) {
                    set.add(n);
                }
            });
        }
        this.indexSchema.filter(set.values());
        return this.indexSchema;
    }
    /** regex search -- WARNING: slower */
    match(regex) {
        // This could be faster if we stored a reverse lookup
        // array that had the id for each key, but .. I don't
        // think the perf will suffer much doing it this way.
        const set = new Set();
        for (const node of this.values.entries()) {
            for (const id of node[1]) {
                if (!this.indexSchema.selectedElements || this.indexSchema.selectedElements.has(id)) {
                    // it's currently in the keep list.
                    if (regex.match(node.toString())) {
                        set.add(id);
                    }
                }
            }
        }
        this.indexSchema.filter(set.values());
        return this.indexSchema;
    }
    /** substring match -- slower */
    startsWith(value) {
        // ok, I'm being lazy here. I can add a check to see if we're past
        // the point where this could be a match, but I don't know if I'll
        // even need this enough to keep it.
        const set = new Set();
        for (const node of this.values.entries()) {
            for (const id of node[1]) {
                if (!this.indexSchema.selectedElements || this.indexSchema.selectedElements.has(id)) {
                    // it's currently in the keep list.
                    if (node[0].toString().startsWith(value.toString())) {
                        set.add(id);
                    }
                }
            }
        }
        this.indexSchema.filter(set.values());
        return this.indexSchema;
    }
    /** substring match -- slower */
    endsWith(value) {
        // Same thing here, but I'd have to do a reversal of all the strings.
        const set = new Set();
        for (const node of this.values.entries()) {
            for (const id of node[1]) {
                if (!this.indexSchema.selectedElements || this.indexSchema.selectedElements.has(id)) {
                    // it's currently in the keep list.
                    if (node[0].toString().endsWith(value.toString())) {
                        set.add(id);
                    }
                }
            }
        }
        this.indexSchema.filter(set.values());
        return this.indexSchema;
    }
    doneInsertion() {
        // nothing normally
    }
}
/** An  key for string values. */
class StringKey extends Key {
    compare(a, b) {
        if (a && b) {
            return a.localeCompare(b);
        }
        if (a) {
            return 1;
        }
        if (b) {
            return -1;
        }
        return 0;
    }
    /** impl: transform value into comparable key */
    coerce(value) {
        return value;
    }
}
exports.StringKey = StringKey;
function shortName(value, n) {
    const v = value.split('/');
    let p = v.length - n;
    if (p < 0) {
        p = 0;
    }
    return v.slice(p).join('/');
}
class IdentityKey extends StringKey {
    identities = new sorted_btree_1.default(undefined, this.compare);
    idShortName = new Map();
    doneInsertion() {
        // go thru each of the values, find short name for each.
        const ids = new linq_1.ManyMap();
        for (const idAndIndexNumber of this.values.entries()) {
            ids.push(shortName(idAndIndexNumber[0], 1), idAndIndexNumber);
        }
        let n = 1;
        while (ids.size > 0) {
            n++;
            for (const [snKey, artifacts] of [...ids.entries()]) {
                // remove it from the list.
                ids.delete(snKey);
                if (artifacts.length === 1) {
                    // keep this one, it's unique
                    this.identities.set(snKey, artifacts[0][1]);
                    this.idShortName.set(artifacts[0][0], snKey);
                }
                else {
                    for (const each of artifacts) {
                        ids.push(shortName(each[0], n), each);
                    }
                }
            }
        }
    }
    /** @internal */
    cloneKey(from) {
        super.cloneKey(from);
        this.identities = from.identities.greedyClone();
        this.idShortName = new Map(from.idShortName);
    }
    getShortNameOf(id) {
        return this.idShortName.get(id);
    }
    nameOrShortNameIs(value) {
        if (value !== undefined && value !== '') {
            const matches = this.identities.get(value);
            if (matches) {
                this.indexSchema.filter(matches);
            }
            else {
                return this.equals(value);
            }
        }
        return this.indexSchema;
    }
    /** deserializes an object graph back into this key */
    deserialize(content) {
        super.deserialize(content);
        this.doneInsertion();
    }
}
exports.IdentityKey = IdentityKey;
/** An key for string values. Does not support 'word' searches */
class SemverKey extends Key {
    compare(a, b) {
        return a.compare(b);
    }
    coerce(value) {
        if (typeof value === 'string') {
            return new semver_1.SemVer(value);
        }
        return value;
    }
    addWord(each, n) {
        // no parts
    }
    rangeMatch(value) {
        // This could be faster if we stored a reverse lookup
        // array that had the id for each key, but .. I don't
        // think the perf will suffer much doing it this way.
        const set = new Set();
        const range = new semver_1.Range(value);
        for (const node of this.values.entries()) {
            for (const id of node[1]) {
                if (!this.indexSchema.selectedElements || this.indexSchema.selectedElements.has(id)) {
                    // it's currently in the keep list.
                    if (range.test(node[0])) {
                        set.add(id);
                    }
                }
            }
        }
        this.indexSchema.filter(set.values());
        return this.indexSchema;
    }
    serialize() {
        const result = super.serialize();
        result.words = undefined;
        return result;
    }
}
exports.SemverKey = SemverKey;
/**
 * Base class for a custom IndexSchema
 *
 * @param TGraph - the object kind to be indexing
 * @param TSelf - the child class that is being constructed.
 */
class IndexSchema {
    index;
    /** the collection of keys in this IndexSchema */
    mapOfKeyObjects = new Map();
    /**
     * the selected element ids.
     *
     * if this is `undefined`, the whole set is currently selected
     */
    selectedElements;
    /**
     * filter the selected elements down to an intersection of the {selectedelements} ∩ {idsToKeep}
     *
     * @param idsToKeep the element ids to intersect with.
     */
    filter(idsToKeep) {
        if (this.selectedElements) {
            const selected = new Set();
            for (const each of idsToKeep) {
                if (this.selectedElements.has(each)) {
                    selected.add(each);
                }
            }
            this.selectedElements = selected;
        }
        else {
            this.selectedElements = new Set(idsToKeep);
        }
    }
    /**
     * Serializes this IndexSchema to a persistable object graph.
     */
    serialize() {
        const result = {};
        for (const [key, impl] of this.mapOfKeyObjects.entries()) {
            result[key] = impl.serialize();
        }
        return result;
    }
    /**
     * Deserializes a persistable object graph into the IndexSchema.
     *
     * replaces any existing data in the IndexSchema.
     * @param content the persistable object graph.
     */
    deserialize(content) {
        for (const [key, impl] of this.mapOfKeyObjects.entries()) {
            let anyMatches = false;
            for (const maybeIdentity of impl.alternativeIdentities) {
                const maybeKey = content[maybeIdentity];
                if (maybeKey) {
                    impl.deserialize(maybeKey);
                    anyMatches = true;
                    break;
                }
            }
            if (!anyMatches) {
                throw new Error((0, i18n_1.i) `Failed to deserialize index ${key}`);
            }
        }
    }
    /**
     * returns the selected
     */
    get items() {
        return this.selectedElements ? [...this.selectedElements].map(each => this.index.indexOfTargets[each]) : this.index.indexOfTargets;
    }
    /** @internal */
    constructor(index) {
        this.index = index;
    }
}
exports.IndexSchema = IndexSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlci5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJyZWdpc3RyaWVzL2luZGV4ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVDQUF1QztBQUN2QyxrQ0FBa0M7OztBQUVsQyxtQ0FBdUM7QUFDdkMsK0NBQWlDO0FBQ2pDLGtDQUE0QjtBQUM1QiwyQ0FBNEM7QUFDNUMsdUNBQWdEO0FBU2hEOzs7OztHQUtHO0FBQ0gsTUFBYSxLQUFLO0lBV007SUFWdEIsZ0JBQWdCO0lBQ2hCLFdBQVcsQ0FBZTtJQUMxQixnQkFBZ0I7SUFDaEIsY0FBYyxHQUFHLElBQUksS0FBSyxFQUFVLENBQUM7SUFFckM7Ozs7T0FJRztJQUNILFlBQXNCLGdCQUEwRTtRQUExRSxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQTBEO1FBQzlGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsS0FBSztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU87WUFDTCxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDMUIsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFO1NBQ3RDLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFdBQVcsQ0FBQyxPQUFZO1FBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUNwQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVEOztPQUVH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
// SIG // Begin signature block
// SIG // MIIoNwYJKoZIhvcNAQcCoIIoKDCCKCQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // rUxTnd0MD8ejc31qhl/mkzqwrzpr66oPDrfFaZv8BjWg
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
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCAlr2pDesqsIwTv
// SIG // NrcCSPfHM0vXIA6fOTL2ZPJ81kU1+TBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAH/7vfn4umCvHsprQ/0Z4mPbkZOwmpdc
// SIG // tptRuyRGrMl6RPh3nkpNpUavSQ1mpxGkUIVUHcbRm1BE
// SIG // 4F8JCytcgnmmM17Ogg+OotdIIovXM9YEUxk9TGZPD02s
// SIG // xF6tL8ZVOO7eDMVo2YleIHdRHtm1ErNkp2syvLsnZI0x
// SIG // KVwZqu71Yy9IqjHlZvTEJIQep854RwUN28ZStzBKx+0A
// SIG // QUMQwkmZR8WuWOt2nMZRMznxuLBtV27OtcD8B37UKuHT
// SIG // L4oOKWLehF2JKkKGe+ewoxNLrZrMGEzzWvPYKaqaXrlQ
// SIG // gdxm5OALVJaeMZ/snCi4g4F3fNpte99LTWLgtg9Q3mVo
// SIG // viihgheUMIIXkAYKKwYBBAGCNwMDATGCF4Awghd8Bgkq
// SIG // hkiG9w0BBwKgghdtMIIXaQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // li6D4CXnT76WM6wi7w9KtQcAK6RRW8Aprn8mzSHUBTkC
// SIG // Bmc/Oj3QWBgTMjAyNDEyMDkyMTAzMzQuNTIzWjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjg5MDAt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR6jCCByAwggUIoAMCAQIC
// SIG // EzMAAAHt4V/L1felXXMAAQAAAe0wDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTQxWhcNMjUwMzA1MTg0NTQxWjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOjg5MDAtMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEAqDDCbJK66mqcnC8TwtR+8w+4PPDaWxGkOko3EyEW
// SIG // 8wlcmEDbM/E2i9aahUxADy9V+6Iy+PxGhFvlIzambP2s
// SIG // jMluGCKRT2T9seBQTFQnXbHhdovmjDIwx4tC3E0GcTNr
// SIG // N5hTKwmQFkny2F2AyIphQc/I9KC1hst1YC5gUyjOMS6r
// SIG // +w2VM/AdkqAJmxLaetp4EpdITqDe90hcBPmNuErxkDFo
// SIG // cpKRvr1w8HKVr8A3vk4J6y0ewE0RVzeSUtunZtssukmB
// SIG // TEWJzBN3TBwkP1ECEEDQvJy5iL3SpAKFhDF7SbBhKN0K
// SIG // zNktkgb+D6R0c0bpM07T/lAHHhsTPScq8FED+TghJlum
// SIG // HIRMkQ0sD+IVPX+wdAModeD8PbyaO43sDY3jDyJJp3si
// SIG // 0otK7r9qMf8URrXCfcgTQuQWkZLY8+7LT2qI0fjwwNn7
// SIG // gbQqPMSpZLed5lG+wGPgmRx6oS5u+qXTBegR79k78JVQ
// SIG // XkETdtl42lVUcAoI4CZzXsLez3o3K6VJ9Khy4C6vtQTd
// SIG // Q82LpFpE6+8E9M5dIl6/jbalJFkjp1kX3vDdtbQerr91
// SIG // ZFvJxXQobW22Wc9uKXi7SRGbjazfF3/T0zzM2VwyQSNR
// SIG // HIkf/dUHBqGRZlWxVW9q1CALNNfmZHsL24ZhlQ3n1/aG
// SIG // RuPyuIBlLE701vq9SWTMVE9jMKkCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBTOG/Ds994QKgRHypQGX9DSoeAiGTAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAndYCtkXfnhi9Hh4vohOv6g2P
// SIG // LG27DuHpmp3KeijzfsauWQGrYgUeI5kUYZvvVYpNBaNA
// SIG // y1ovzdvGxSO3V2MNPad7woqW48uBKIn5tDbne/+FN9Iv
// SIG // fu0b1u1zkN68d+/lO76vZZOsmKRgjadI5SdfPPwrkT4K
// SIG // iZ36uRHXmnx9gKBuOoSlk3gew7l2rBrerKSTnpxnnUq3
// SIG // t+DFmankyENK2jiLWZxbhg8uPsaA9akc9kFvrtoAh2hv
// SIG // AEI4WFDOLk4vbepLbY+nO12pq9s61rnHg4c+7Ci7bS0y
// SIG // e8LOWKwNiPHE5WzAH9iltBlYym2Bnfi2RnbhCu/+37OB
// SIG // lJDKnOdRbDXRtZ/s4HO8x7tqBhnggYOLPGUdGRcse47I
// SIG // JvbEhQikOQrGwL5a/+tDXZOU3jEfCbNpDVInLtgqmdN/
// SIG // N907L04JO4g9Si4H0tehxL4zepuFSiSoIyeziSc2m7Uu
// SIG // CUIFJyayGX8qLJOA9fK2Z4vaVMDdN1oE5nddFk8ImTru
// SIG // IPFJ+oinDzGP4hak7uJ7ZMxVMQQaWxRupNQiDWZqIqxF
// SIG // pgrRt5cmdiHXZo7SHn05CLxlm+Ccc8+5dpvxNpBjosQy
// SIG // R7GoWVZsLKDb4cuZLv4p1PvnVx88PoZb6k0hU/PayBVY
// SIG // XJrFjwyTzUUkqTIaCd91dmWv5ZCnG5FDNEm0IEvarHcw
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
// SIG // Tjo4OTAwLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUA7h2sikwmmLGMSYfqFk8erlTxcPmggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOsBcnMwIhgPMjAyNDEyMDkxMzQz
// SIG // MTVaGA8yMDI0MTIxMDEzNDMxNVowdDA6BgorBgEEAYRZ
// SIG // CgQBMSwwKjAKAgUA6wFycwIBADAHAgEAAgIqFDAHAgEA
// SIG // AgIS8jAKAgUA6wLD8wIBADA2BgorBgEEAYRZCgQCMSgw
// SIG // JjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIB
// SIG // AAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQAAvsYi17fA
// SIG // qNituM8uZwuPXbiTGxeL0qGYKfn0hTT2AuucpD82AlCk
// SIG // z/+XSXnv1KPSJRUfeE/MN/dU4U/s4imep6M5c0aKIIgh
// SIG // GmRp1kH0DHOkE/OfDRpVt8q5gIoqullOCtSxl1tZjf2g
// SIG // ZUkMYDMPwFdLuBSJgZcec68EUBpOQoReyW9KlwLUx/6X
// SIG // gImgNHIRFbu8rVxLh3BPD0fhJgyfxymaI/aTR5c52p++
// SIG // W1IhN5NqLJVbulKBF17MztHeMHGudQvDN0rxcnQfDWdW
// SIG // Kl618H5dB0ErGuWZH5wy2Ek+Ao68KVqHqvYE5q/VUaSY
// SIG // EZ8lOnxEuhe3mycqwnuCSZ2+MYIEDTCCBAkCAQEwgZMw
// SIG // fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAHt
// SIG // 4V/L1felXXMAAQAAAe0wDQYJYIZIAWUDBAIBBQCgggFK
// SIG // MBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkq
// SIG // hkiG9w0BCQQxIgQghNtmOJShi60DoCwCJMyiV5XPtr8N
// SIG // WSTdUkBYUjzA0hMwgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCCNLg1oNAhbHisStwNepdcKyMK7Eg612esU
// SIG // n9BeMWzKOTCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAAB7eFfy9X3pV1zAAEAAAHtMCIE
// SIG // IHxZjqZER+Oeak6Rhh+s7e6CTJGEuKzT+rLG1zxtHZdd
// SIG // MA0GCSqGSIb3DQEBCwUABIICAJYKjtJXJXS28Rx5oBg+
// SIG // mL+qdMd7cjvQveN/c1uGWxJ/nZpxJMU6ImR1aPs4MHzg
// SIG // xQPE1o7C1EdorAVwDfDkXUzB9DKY/8/LhNt7GGi7GMk4
// SIG // zTTd72ZS3KxlXkDy9cuGxMRnCPo10DT+QGLX107EBw/A
// SIG // S/NKvWM585yFM+sV0veQBaj0dd1y9ZviaHIM5cteTEzj
// SIG // VteHxL613DEpqZVqCXeYJi+OSioURrb35NQQiRr7imTl
// SIG // AXlRaZZECEYASs9ScbmlGyBbERwjClYWpK2bfatAHioD
// SIG // 2VlIl5pr3lEl5JPaDL1qrXd8Nq8mlf0GXTqvyziPyZg7
// SIG // Z45KttuEYOG5uRQ04DYSVX9TTNJhfPzYjELDXCDLTi7w
// SIG // XEXxEva/IJhep0NOYBC6mKKlzY4Ea/g9Tp89PBLvjtVT
// SIG // FLrMU+vju/8bKXcR8OJJZIaUGVpqZEYniLjMa/9hiM/I
// SIG // rtCMyw1c9xwleY7qOd+0rDRpfWyEH/Nsn7TW8NoDmizV
// SIG // r9xssZuAvRVQ0C9p2xcslZzvGDYWOY65VS5M+IqonjCt
// SIG // zPrqQv64vyHuEHp9Kd4ERuwZ8y8gHPOkry/oo/x8vUZ4
// SIG // Zhq6FwzZM0t/3Woa5ctFAjgZyep259ql5FLRZeUleSrJ
// SIG // CJ0jb9OBPtg7aNtdxNrgxiT2/ClGYifVPD2A8YiK8FvJ
// SIG // U9o/
// SIG // End signature block
