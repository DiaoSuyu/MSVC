"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Yaml = exports.YAMLScalar = exports.YAMLSequence = exports.YAMLDictionary = void 0;
const yaml_1 = require("yaml");
const error_kind_1 = require("../interfaces/error-kind");
const checks_1 = require("../util/checks");
class YAMLDictionary extends yaml_1.YAMLMap {
}
exports.YAMLDictionary = YAMLDictionary;
class YAMLSequence extends yaml_1.YAMLSeq {
}
exports.YAMLSequence = YAMLSequence;
class YAMLScalar extends yaml_1.Scalar {
}
exports.YAMLScalar = YAMLScalar;
class Yaml {
    parent;
    key;
    constructor(/** @internal */ node, parent, key) {
        this.parent = parent;
        this.key = key;
        this.node = node;
        if (!(this.constructor).create) {
            throw new Error(`class ${this.constructor.name} is missing implementation for create`);
        }
    }
    get fullName() {
        return !this.node ? '' : this.parent ? this.key ? `${this.parent.fullName}.${this.key}` : this.parent.fullName : this.key || '$';
    }
    /** returns the current node as a JSON string */
    toString() {
        return this.node?.toJSON() ?? '';
    }
    get keys() {
        return this.exists() && (0, yaml_1.isMap)(this.node) ? this.node.items.map(each => this.asString(each.key)) : [];
    }
    /**
     * Coercion function to string
     *
     * This will pass the coercion up to the parent if it exists
     * (or otherwise overridden in the subclass)
     *
     * Which allows for value overriding
     */
    asString(value) {
        if (this.parent) {
            return this.parent.asString(value);
        }
        return value === undefined ? undefined : ((0, yaml_1.isScalar)(value) ? value.value : value).toString();
    }
    /**
     * Coercion function to number
     *
     * This will pass the coercion up to the parent if it exists
     * (or otherwise overridden in the subclass)
     *
     * Which allows for value overriding
     */
    asNumber(value) {
        if (this.parent) {
            return this.parent.asNumber(value);
        }
        if ((0, yaml_1.isScalar)(value)) {
            value = value.value;
        }
        return typeof value === 'number' ? value : undefined;
    }
    /**
     * Coercion function to boolean
     *
     * This will pass the coercion up to the parent if it exists
     * (or otherwise overridden in the subclass)
     *
     * Which allows for value overriding
     */
    asBoolean(value) {
        if (this.parent) {
            return this.parent.asBoolean(value);
        }
        if ((0, yaml_1.isScalar)(value)) {
            value = value.value;
        }
        return typeof value === 'boolean' ? value : undefined;
    }
    /**
     * Coercion function to any primitive
     *
     * This will pass the coercion up to the parent if it exists
     * (or otherwise overridden in the subclass)
     *
     * Which allows for value overriding
     */
    asPrimitive(value) {
        if (this.parent) {
            return this.parent.asPrimitive(value);
        }
        if ((0, yaml_1.isScalar)(value)) {
            value = value.value;
        }
        switch (typeof value) {
            case 'boolean':
            case 'number':
            case 'string':
                return value;
        }
        return undefined;
    }
    get root() {
        return this.parent ? this.parent.root : this;
    }
    createNode() {
        return this.constructor.create();
    }
    /**@internal*/ static create() {
        throw new Error('creator not Not implemented on base class.');
    }
    _node;
    get node() {
        if (this._node) {
            return this._node;
        }
        if (this.key && this.parent && (0, yaml_1.isMap)(this.parent?.node)) {
            this._node = this.parent.node.get(this.key, true);
        }
        return this._node;
    }
    set node(n) {
        this._node = n;
    }
    sourcePosition(key) {
        if (!this.node) {
            return undefined;
        }
        if (key !== undefined) {
            if (((0, yaml_1.isMap)(this.node) || (0, yaml_1.isSeq)(this.node))) {
                const node = this.node.get(key, true);
                if (node) {
                    return node.range || undefined;
                }
                return undefined;
            }
            if ((0, yaml_1.isScalar)(this.node)) {
                throw new Error('Scalar does not have a key to get a source position');
            }
        }
        return this.node?.range || undefined;
    }
    /** will dispose of this object if it is empty (or forced) */
    dispose(force = false, deleteFromParent = true) {
        if ((this.empty || force) && this.node) {
            if (deleteFromParent) {
                this.parent?.deleteChild(this);
            }
            this.node = undefined;
        }
    }
    /** if this node has any data, this should return false */
    get empty() {
        if ((0, yaml_1.isCollection)(this.node)) {
            return !(this.node?.items.length);
        }
        else if ((0, yaml_1.isScalar)(this.node)) {
            return !(0, checks_1.isNullish)(this.node.value);
        }
        return false;
    }
    /** @internal */ exists() {
        if (this.node) {
            return true;
        }
        // well, if we're lazy and haven't instantiated it yet, check if it's created.
        if (this.key && this.parent && (0, yaml_1.isMap)(this.parent.node)) {
            this.node = this.parent.node.get(this.key);
            if (this.node) {
                return true;
            }
        }
        return false;
    }
    /** @internal */ assert(recreateIfDisposed = false, node = this.node) {
        if (this.node && this.node === node) {
            return; // quick and fast
        }
        if (recreateIfDisposed) {
            // ensure that this node is the node we're supposed to be.
            this.node = node;
            if (this.parent) {
                // ensure that the parent is not disposed
                this.parent.assert(true);
                if ((0, yaml_1.isMap)(this.parent.node)) {
                    if (this.key) {
                        // we have a parent, and the key, we can add the node.
                        // let's just check if there is one first
                        this.node = this.node || this.parent.node.get(this.key) || this.createNode();
                        this.parent.node.set(this.key, this.node);
                        return;
                    }
                    // the parent is a map, but we don't have a key, so we can't add the node.
                    throw new Error('Parent is a map, but we don\'t have a key');
                }
                if ((0, yaml_1.isSeq)(this.parent.node)) {
                    this.node = this.node || this.parent.node.get(this.key) || this.createNode();
                    this.parent.node.add(this.node);
                    return;
                }
                throw new Error('YAML parent is not a container.');
            }
        }
        throw new Error('YAML node is undefined');
    }
    deleteChild(child) {
        if (!child.node) {
            // this child is already disposed
            return;
        }
        this.assert();
        const node = this.node;
        if ((0, yaml_1.isMap)(node)) {
            if (child.key) {
                node.delete(child.key);
                child.dispose(true, false);
                this.dispose(); // clean up if this is empty
                return;
            }
        }
        if ((0, yaml_1.isSeq)(node)) {
            // child is in some kind of collection.
            // we should be able to find the child's index and remove it.
            const items = node.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i] === child.node) {
                    node.delete(i);
                    child.dispose(true, false);
                    this.dispose(); // clean up if this is empty
                    return;
                }
            }
            // if we get here, we didn't find the child.
            // but, it's not in the object, so we're good I guess
            throw new Error('Child Node not found trying to delete');
            // return;
        }
        throw new Error('this node does not have children.');
    }
    *validate() {
        // shh.
    }
    *validateChildKeys(keys) {
        if ((0, yaml_1.isMap)(this.node)) {
            for (const key of this.keys) {
                if (keys.indexOf(key) === -1) {
                    yield {
                        message: `Unexpected '${key}' found in ${this.fullName}`,
                        range: this.sourcePosition(key),
                        category: error_kind_1.ErrorKind.InvalidChild,
                    };
                }
            }
        }
    }
    *validateIsObject() {
        if (this.node && !(0, yaml_1.isMap)(this.node)) {
            yield {
                message: `'${this.fullName}' is not an object`,
                range: this,
                category: error_kind_1.ErrorKind.IncorrectType
            };
        }
    }
    *validateIsSequence() {
        if (this.node && !(0, yaml_1.isSeq)(this.node)) {
            yield {
                message: `'${this.fullName}' is not an object`,
                range: this,
                category: error_kind_1.ErrorKind.IncorrectType
            };
        }
    }
    *validateIsSequenceOrPrimitive() {
        if (this.node && (!(0, yaml_1.isSeq)(this.node) && !(0, yaml_1.isScalar)(this.node))) {
            yield {
                message: `'${this.fullName}' is not a sequence or value`,
                range: this,
                category: error_kind_1.ErrorKind.IncorrectType
            };
        }
    }
    *validateIsObjectOrPrimitive() {
        if (this.node && (!(0, yaml_1.isMap)(this.node) && !(0, yaml_1.isScalar)(this.node))) {
            yield {
                message: `'${this.fullName}' is not an object or value`,
                range: this,
                category: error_kind_1.ErrorKind.IncorrectType
            };
        }
    }
    *validateChild(child, kind) {
        if (this.node && (0, yaml_1.isMap)(this.node)) {
            if (this.node.has(child)) {
                const c = this.node.get(child, true);
                if (!(0, yaml_1.isScalar)(c) || typeof c.value !== kind) {
                    yield {
                        message: `'${this.fullName}.${child}' is not a ${kind} value`,
                        range: c.range,
                        category: error_kind_1.ErrorKind.IncorrectType
                    };
                }
            }
        }
    }
}
exports.Yaml = Yaml;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieWFtbC10eXBlcy5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJ5YW1sL3lhbWwtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVDQUF1QztBQUN2QyxrQ0FBa0M7OztBQUVsQywrQkFBc0Y7QUFDdEYseURBQXFEO0FBRXJELDJDQUEyQztBQUUzQyxNQUFhLGNBQWUsU0FBUSxjQUFvQjtDQUFJO0FBQTVELHdDQUE0RDtBQUM1RCxNQUFhLFlBQWEsU0FBUSxjQUFZO0NBQUk7QUFBbEQsb0NBQWtEO0FBQ2xELE1BQWEsVUFBVyxTQUFRLGFBQVc7Q0FBSTtBQUEvQyxnQ0FBK0M7QUFLL0MsTUFBdUMsSUFBSTtJQUNlO0lBQStCO0lBQXZGLFlBQVksZ0JBQWdCLENBQUMsSUFBZSxFQUFZLE1BQW1CLEVBQVksR0FBWTtRQUEzQyxXQUFNLEdBQU4sTUFBTSxDQUFhO1FBQVksUUFBRyxHQUFILEdBQUcsQ0FBUztRQUNqRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQXlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLE1BQU0sRUFBRTtZQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLHVDQUF1QyxDQUFDLENBQUM7U0FDeEY7SUFDSCxDQUFDO0lBRUQsSUFBSSxRQUFRO1FBQ1YsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxD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
// SIG // Begin signature block
// SIG // MIIoKAYJKoZIhvcNAQcCoIIoGTCCKBUCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // h8bWcruBEJhlu6+dUorHMSn/LRCR8uRNHwmgx+r+iDOg
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
// SIG // a/15n8G9bW1qyVJzEw16UM0xghoKMIIaBgIBATCBlTB+
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAE
// SIG // BGx0Bv9XKydyAAAAAAQEMA0GCWCGSAFlAwQCAQUAoIGu
// SIG // MBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwGCisG
// SIG // AQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3
// SIG // DQEJBDEiBCCEQEUMoy9gEVBAf7TbNVuhFRnBkHO4UERE
// SIG // NKJuN4flSTBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAGi3c1dq
// SIG // oTUgsdJpMhu2+i0hYXCFLaAOO8WAwFuv0HqCmdzpg1DP
// SIG // 5vCJCNj3RaC2Vv56JnNG1Rb2I9EeJ5UvvbslZrLappE7
// SIG // QyjZrqJyI3+YlxDRoacdjKYOPRtUMaDLs0WsO/HqP9ga
// SIG // PMNI+TOhY5wxIIWgejLuTAVe7stxA4iXUuP2ybHvfW7p
// SIG // eAC0q23NlrBcUBvfGqJvslbLloEgK6TTUcumQotr0Eqh
// SIG // IXP/FvV5p89oYuQnRD1HPyw+pKYAdPcsNwy0Q+y8uT+s
// SIG // CmAs2QKOMeMQrRAtlVqmgg45bgp/aQe44V7TOOHPb0Px
// SIG // ooV6PENTAF3Ct3FRP8XUtLrvPqehgheUMIIXkAYKKwYB
// SIG // BAGCNwMDATGCF4Awghd8BgkqhkiG9w0BBwKgghdtMIIX
// SIG // aQIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZIhvcN
// SIG // AQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgol2Fbq/Jx55uJ3Q9R1Jt
// SIG // iSrpDgjNmg+tfkoNCv/YIaECBmc/IxeYkxgTMjAyNDEy
// SIG // MDkyMTAzMzMuMDY4WjAEgAIB9KCB0aSBzjCByzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0
// SIG // IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNo
// SIG // aWVsZCBUU1MgRVNOOkEwMDAtMDVFMC1EOTQ3MSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oIIR6jCCByAwggUIoAMCAQICEzMAAAHr4BhstbbvOO0A
// SIG // AQAAAeswDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTAwHhcNMjMxMjA2MTg0NTM0WhcN
// SIG // MjUwMzA1MTg0NTM0WjCByzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3Bl
// SIG // cmF0aW9uczEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNO
// SIG // OkEwMDAtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAg8AMIICCgKCAgEAwRVoIdpW4Fd3iadN
// SIG // aKomhQbmGzXO4UippLbydeTawfwwW6FKMPFjzkz8W5+4
// SIG // HJiDhpsCZHfk8hceyjp868Z6Ad4br7/dX2blLoCLCk5w
// SIG // L4NgVP53ze2c5/SpNZqbidu0usVAx+KHRYl+dSAnCpeh
// SIG // BuHMSoHAwIp4oU/Ma6CVlQEy+6fG2358LHNaYoWZnLyL
// SIG // mBp29U2PbZ6XQoVq/RAEbgqN04kRozNi6eKYk9pQ+YZ3
// SIG // d1Whk3qTasmpKZAhldPnCvFbvx5CGXb8vs+RC96I03RS
// SIG // y+byfSAKIFn91wLt3e0qRWmqHosdHtaueQA/eGcAz/os
// SIG // 6i2nbAUd7c46tkX6wjS/k5ov42pUbaPyem4eHz4RxE5w
// SIG // wu/E9cn11EHRrZif7rSPwDcYux1fIAD84nfU2IzD22Kh
// SIG // vMucc/oCP0hco/mirRx1pisxFz7bV8wHHsSdRB+8G7ol
// SIG // ZN7BKzyvTC4NV2+oTORyFgNIxAGYShMneYR9lzIm82pG
// SIG // 6drNhCUFmrEHOAzGhdRLENQs4ApQ2CGBuq1IbnXyO5PC
// SIG // /SighLn0WyuZXUWDQKnXa/8kiX7mb9z0t/r7Q+l+qtR+
// SIG // FDpowynY6Ft6rOyUTGZh/X5BZDM2+mEs6+nl9S6GJtz6
// SIG // ztSXmuN0mM5Qd08/ODr7lUlezXInVbTaomXllqVY32r0
// SIG // fiY/yTkCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBR0ngWs
// SIG // 1lXMbuKk/TuY09gfqgHq4TAfBgNVHSMEGDAWgBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQ
// SIG // hk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
// SIG // JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwG
// SIG // CCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUt
// SIG // U3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMB
// SIG // Af8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4G
// SIG // A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // g3TfL6D3fAvlVmT9/lvO3P0G3W1itLDrfWeJBDlp4Oyp
// SIG // oflg9i5zyUySiBGsZ4jnLfcDICfMkMsEfFh4Azr28Kna
// SIG // rC1GjODa3q7SOhSPa4Y4XmisTTZwWcx2Sw8JZC/bwhA3
// SIG // vUXNHRklXeQYNwlpJ1d7r1WrteBeeREk1iATWkEvQqaN
// SIG // jqc93EYAGFX2ixRmwKzXEb0lr0lG3iNiA6kcQuMQW0Yj
// SIG // UPtah1wwj59IRrF3y/spw2Z3An7Mza5YGU9uF4Ib082D
// SIG // B3F4qC1WKP9h5MqMOnSO7lCyWysS1/MB4bIsK4lyAwp4
// SIG // y1bBtBOW0fNkIHLHhIcW1NndUVR3ELZFBO1vc8Wamev4
// SIG // z5mqI2YF0Dt9148Th2GFWvwV3CLrvEjMz44wAG7o8E2s
// SIG // KWsywb/fey0QdGTmzXJCWMkEKRE0n5Td+o1vs+0f5xsi
// SIG // akWdx7WdZV1tX+sxAgHj/vXcup5nAq1XDqm0B1+2a/Fj
// SIG // 3IIRyQAA5ZuRMT4ecYtbTUZPouhdmvUqU3kJ2Vz+dMPi
// SIG // aE8SEkKu7wYo9p4rQLEi2lXjKqD4vjV5U1DWdjXbWxa+
// SIG // iIq/WSvbn2s9xcX7w2aN+ubyzqM5kDnv2fqbuL2Ocz5r
// SIG // TYlSHEJxcuyWTomVQyOWyHcEEWotqrhyiepbVHbItx4z
// SIG // Z4nrhO9n0+HlocbZpzeR2AgwggdxMIIFWaADAgECAhMz
// SIG // AAAAFcXna54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUA
// SIG // MIGIMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylN
// SIG // aWNyb3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3Jp
// SIG // dHkgMjAxMDAeFw0yMTA5MzAxODIyMjVaFw0zMDA5MzAx
// SIG // ODMyMjVaMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpX
// SIG // YXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
// SIG // VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNV
// SIG // BAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEw
// SIG // MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA
// SIG // 5OGmTOe0ciELeaLL1yR5vQ7VgtP97pwHB9KpbE51yMo1
// SIG // V/YBf2xK4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64NmeF
// SIG // RiMMtY0Tz3cywBAY6GB9alKDRLemjkZrBxTzxXb1hlDc
// SIG // wUTIcVxRMTegCjhuje3XD9gmU3w5YQJ6xKr9cmmvHaus
// SIG // 9ja+NSZk2pg7uhp7M62AW36MEBydUv626GIl3GoPz130
// SIG // /o5Tz9bshVZN7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHI
// SIG // NSi947SHJMPgyY9+tVSP3PoFVZhtaDuaRr3tpK56KTes
// SIG // y+uDRedGbsoy1cCGMFxPLOJiss254o2I5JasAUq7vnGp
// SIG // F1tnYN74kpEeHT39IM9zfUGaRnXNxF803RKJ1v2lIH1+
// SIG // /NmeRd+2ci/bfV+AutuqfjbsNkz2K26oElHovwUDo9Fz
// SIG // pk03dJQcNIIP8BDyt0cY7afomXw/TNuvXsLz1dhzPUNO
// SIG // wTM5TI4CvEJoLhDqhFFG4tG9ahhaYQFzymeiXtcodgLi
// SIG // Mxhy16cg8ML6EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5
// SIG // UPkLiWHzNgY1GIRH29wb0f2y1BzFa/ZcUlFdEtsluq9Q
// SIG // BXpsxREdcu+N+VLEhReTwDwV2xo3xwgVGD94q0W29R6H
// SIG // XtqPnhZyacaue7e3PmriLq0CAwEAAaOCAd0wggHZMBIG
// SIG // CSsGAQQBgjcVAQQFAgMBAAEwIwYJKwYBBAGCNxUCBBYE
// SIG // FCqnUv5kxJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQWBBSf
// SIG // pxVdAF5iXYP05dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEG
// SIG // DCsGAQQBgjdMg30BATBBMD8GCCsGAQUFBwIBFjNodHRw
// SIG // Oi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL0RvY3Mv
// SIG // UmVwb3NpdG9yeS5odG0wEwYDVR0lBAwwCgYIKwYBBQUH
// SIG // AwgwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYD
// SIG // VR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0j
// SIG // BBgwFoAU1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0f
// SIG // BE8wTTBLoEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQu
// SIG // Y29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0
// SIG // XzIwMTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBK
// SIG // BggrBgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQu
// SIG // Y29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0w
// SIG // Ni0yMy5jcnQwDQYJKoZIhvcNAQELBQADggIBAJ1Vffwq
// SIG // reEsH2cBMSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1
// SIG // OdfCcTY/2mRsfNB1OW27DzHkwo/7bNGhlBgi7ulmZzpT
// SIG // Td2YurYeeNg2LpypglYAA7AFvonoaeC6Ce5732pvvinL
// SIG // btg/SHUB2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l
// SIG // 9qRWqveVtihVJ9AkvUCgvxm2EhIRXT0n4ECWOKz3+SmJ
// SIG // w7wXsFSFQrP8DJ6LGYnn8AtqgcKBGUIZUnWKNsIdw2Fz
// SIG // Lixre24/LAl4FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7
// SIG // hvoyGtmW9I/2kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY
// SIG // 3UA8x1RtnWN0SCyxTkctwRQEcb9k+SS+c23Kjgm9swFX
// SIG // SVRk2XPXfx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFU
// SIG // a2pFEUep8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz
// SIG // /gq77EFmPWn9y8FBSX5+k77L+DvktxW/tM4+pTFRhLy/
// SIG // AsGConsXHRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1
// SIG // ZyvgDbjmjJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328
// SIG // y+l7vzhwRNGQ8cirOoo6CGJ/2XBjU02N7oJtpQUQwXEG
// SIG // ahC0HVUzWLOhcGbyoYIDTTCCAjUCAQEwgfmhgdGkgc4w
// SIG // gcsxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJTAjBgNVBAsTHE1p
// SIG // Y3Jvc29mdCBBbWVyaWNhIE9wZXJhdGlvbnMxJzAlBgNV
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjpBMDAwLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAgAaJdbtcMMGI
// SIG // FLVKMDJ6mL27pd6ggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOsB
// SIG // W0swIhgPMjAyNDEyMDkxMjA0MjdaGA8yMDI0MTIxMDEy
// SIG // MDQyN1owdDA6BgorBgEEAYRZCgQBMSwwKjAKAgUA6wFb
// SIG // SwIBADAHAgEAAgItujAHAgEAAgITbjAKAgUA6wKsywIB
// SIG // ADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMC
// SIG // oAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3
// SIG // DQEBCwUAA4IBAQB/nr1tTIzcPt5Mh2+rNzhOb7AfLS9B
// SIG // CIFE2tm0Er8s15cU7+LnQf1ZW/XEfqQRQGus4qnbyNgH
// SIG // lOqzi+3D4Ea+4CmOl4Kya0f+PDE77Boyuce56HgfeCqz
// SIG // 7PChwqptxdq0fajQtiLFrn+2Ss3F31Ds1CI0lcJtVTNe
// SIG // qJXnstEPlZPBs7o/4xr/07h1nFYqFqExa6YHjRKhEysS
// SIG // gGj358/0nbyRtg/aPb19lWgM//DWrKBJqaamlFW8aKhS
// SIG // aO6uwrBVhWihd5g0hTFmlf7d8JkBnXR4cA8VIR51CmcO
// SIG // 7VfyhMRc7PAvgaE27Kw6eIEAoyG9oze8CcAZbFGvKsCr
// SIG // Xb3XMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTACEzMAAAHr4BhstbbvOO0AAQAAAesw
// SIG // DQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzEN
// SIG // BgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQgRw6L
// SIG // wSgZ3h2ffkGbO0bb+DyjENbOQcF2uQEuthyaoxowgfoG
// SIG // CyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCDOt2u+X2kD
// SIG // 4X/EgQ07ZNg0lICG3Ys17M++odSXYSws+DCBmDCBgKR+
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB
// SIG // 6+AYbLW27zjtAAEAAAHrMCIEIFXE/uSAIn5BLhIcGUMJ
// SIG // AMA69DsOZZr+vX3WLgStPu1EMA0GCSqGSIb3DQEBCwUA
// SIG // BIICAIo84nh1SLYYPnSzrA8ABmF+/1nSkJpkb1D3tiat
// SIG // Ji689gGhSsBrKE+RCMq4JlF2+K8B5fhKhKV+SSZHssg8
// SIG // jtUoN5VEisj1VxP8zgLRtm3B9nneu7beDTZ+5hW/XJ4i
// SIG // mD2octMHRJdrBxZYfYw1AyBLSvDxBwZVSBumwEpb+JAB
// SIG // 25wvqsMqrvbTRudwtOj1siJu3cstde6L9W/W685WNwhk
// SIG // YhnVA2+yxC1kvb9tyyNWaI0y50nnvPz9o14s2U9xFOGX
// SIG // wyCZhfCJQVttv4KvYBa05ZdtUp017O8sC428XxBn94ff
// SIG // 4yY6/q5EAYBG37R3xl/gSsa3BADKHCkxyqiqwkZ2hOdr
// SIG // rZQ+5RGLowGWqpQkkI2x5iDIBRuOt4+wZyyLeYOLY515
// SIG // FBp8aigghol/34PuOnerq4ijx0n+PrCH2GSUpBqMGuUx
// SIG // 8MVcTGHMsMl1/3EEJMl+lj1Pu9BZHCPKG76KhYzLKG43
// SIG // 1aYwfFNEJZXiW1aF2FuESFSIKTGA20NQQ8V4JUWc0Yto
// SIG // ft/6z86Kd2YQibUkBlROBm7nX5c9OobEyX7RNjJ/NIQH
// SIG // LP/+YitCyvFyhflI4YjsRpClV0DtbkkwkxKI5Kg8ZtCZ
// SIG // wG8bAKygeBwyKUtgCqUTp/nUm1ZZd5jYWtyCRBt53nGp
// SIG // a6GvGxPrMSjocy48gvq8C+KBFTPV
// SIG // End signature block
