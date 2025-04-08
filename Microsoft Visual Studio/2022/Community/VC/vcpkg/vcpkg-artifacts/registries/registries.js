"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryResolver = exports.RegistryDatabase = exports.getArtifact = void 0;
const assert_1 = require("assert");
const artifact_1 = require("../artifacts/artifact");
const format_1 = require("../cli/format");
const i18n_1 = require("../i18n");
const LocalRegistry_1 = require("./LocalRegistry");
const RemoteRegistry_1 = require("./RemoteRegistry");
/**
  * returns an artifact for the strongly-named artifact id/version.
  */
async function getArtifact(registry, idOrShortName, version) {
    const artifactRecords = await registry.search({ idOrShortName, version });
    if (artifactRecords.length === 0) {
        return undefined; // nothing matched.
    }
    if (artifactRecords.length === 1) {
        // found 1 matching artifact identity
        const artifactRecord = artifactRecords[0];
        const artifactDisplay = artifactRecord[0];
        const artifactVersions = artifactRecord[1];
        if (artifactVersions.length === 0) {
            throw new Error('Internal search error: id matched but no versions present');
        }
        return [artifactDisplay, artifactVersions[0]];
    }
    // multiple matches.
    // we can't return a single artifact, we're going to have to throw.
    (0, assert_1.fail)((0, i18n_1.i) `'${idOrShortName}' matched more than one result (${[...artifactRecords.map(each => each[0])].join(',')}).`);
}
exports.getArtifact = getArtifact;
class RegistryDatabase {
    #uriToRegistry = new Map();
    getRegistryByUri(registryUri) {
        return this.#uriToRegistry.get(registryUri);
    }
    has(registryUri) { return this.#uriToRegistry.has(registryUri); }
    // Exposed for testing
    add(uri, registry) {
        const stringized = uri.toString();
        if (this.#uriToRegistry.has(stringized)) {
            throw new Error(`Duplicate registry add ${stringized}`);
        }
        this.#uriToRegistry.set(stringized, registry);
    }
    async loadRegistry(session, locationUri) {
        const locationUriStr = locationUri.toString();
        const existingRegistry = this.#uriToRegistry.get(locationUriStr);
        if (existingRegistry) {
            return existingRegistry;
        }
        // not already loaded
        let loaded;
        switch (locationUri.scheme) {
            case 'https':
                loaded = new RemoteRegistry_1.RemoteRegistry(session, locationUri);
                break;
            case 'file':
                loaded = new LocalRegistry_1.LocalRegistry(session, locationUri);
                break;
            default:
                throw new Error((0, i18n_1.i) `Unsupported registry scheme '${locationUri.scheme}'`);
        }
        this.#uriToRegistry.set(locationUriStr, loaded);
        await loaded.load();
        return loaded;
    }
    getAllUris() {
        return Array.from(this.#uriToRegistry.keys());
    }
}
exports.RegistryDatabase = RegistryDatabase;
class RegistryResolver {
    #database;
    #knownUris;
    #uriToName;
    #nameToUri;
    addMapping(name, uri) {
        this.#uriToName.set(uri, name);
        this.#nameToUri.set(name, uri);
    }
    constructor(parent) {
        if (parent instanceof RegistryResolver) {
            this.#database = parent.#database;
            this.#knownUris = new Set(parent.#knownUris);
            this.#uriToName = new Map(parent.#uriToName);
            this.#nameToUri = new Map(parent.#nameToUri);
        }
        else {
            this.#database = parent;
            this.#knownUris = new Set();
            this.#uriToName = new Map();
            this.#nameToUri = new Map();
        }
    }
    getRegistryName(registry) {
        const stringized = registry.toString();
        return this.#uriToName.get(stringized);
    }
    getRegistryDisplayName(registry) {
        const stringized = registry.toString();
        const prettyName = this.#uriToName.get(stringized);
        if (prettyName) {
            return prettyName;
        }
        return `[${stringized}]`;
    }
    getRegistryByUri(registryUri) {
        const stringized = registryUri.toString();
        if (this.#knownUris.has(stringized)) {
            return this.#database.getRegistryByUri(stringized);
        }
        return undefined;
    }
    getRegistryByName(name) {
        const asUri = this.#nameToUri.get(name);
        if (asUri) {
            return this.#database.getRegistryByUri(asUri);
        }
        return undefined;
    }
    // Adds `registry` to this context with name `name`. If `name` is already set to a different URI, throws.
    add(registryUri, name) {
        const stringized = registryUri.toString();
        if (!this.#database.has(stringized)) {
            throw new Error('Attempted to add unloaded registry to a RegistryContext');
        }
        const oldLocation = this.#nameToUri.get(name);
        if (oldLocation && oldLocation !== stringized) {
            throw new Error((0, i18n_1.i) `Tried to add ${stringized} as ${name}, but ${name} is already ${oldLocation}.`);
        }
        this.#knownUris.add(stringized);
        this.addMapping(name, stringized);
    }
    async search(criteria) {
        const idOrShortName = criteria?.idOrShortName || '';
        const [source, name] = (0, artifact_1.parseArtifactDependency)(idOrShortName);
        if (source === undefined) {
            // search them all
            const results = [];
            for (const location of this.#knownUris) {
                const registry = this.#database.getRegistryByUri(location);
                if (registry === undefined) {
                    throw new Error('RegistryContext tried to search an unloaded registry.');
                }
                const displayName = this.getRegistryDisplayName(registry.location);
                for (const [artifactId, artifacts] of await registry.search(criteria)) {
                    results.push([(0, format_1.artifactIdentity)(displayName, artifactId, artifacts[0].shortName), artifacts]);
                }
            }
            return results;
        }
        else {
            const registry = this.getRegistryByName(source);
            if (registry) {
                return (await registry.search({ ...criteria, idOrShortName: name }))
                    .map((artifactRecord) => [(0, format_1.artifactIdentity)(source, artifactRecord[0], artifactRecord[1][0].shortName), artifactRecord[1]]);
            }
            throw new Error((0, i18n_1.i) `Unknown registry ${source} (in ${idOrShortName}). The following are known: ${Array.from(this.#nameToUri.keys()).join(', ')}`);
        }
    }
    // Combines resolvers together. Any registries that match exactly will take their names from `otherResolver`. Any
    // registries whose names match but which resolve to different URIs will have the name from `otherResolver`, and the
    // other registry will become known but nameless.
    with(otherResolver) {
        if (this.#database !== otherResolver.#database) {
            throw new Error('Tried to combine registry resolvers with different databases.');
        }
        const result = new RegistryResolver(otherResolver);
        for (const uri of this.#knownUris) {
            result.#knownUris.add(uri);
        }
        for (const [name, location] of this.#nameToUri) {
            if (!result.#nameToUri.has(name) && !result.#uriToName.has(location)) {
                result.addMapping(name, location);
            }
        }
        return result;
    }
}
exports.RegistryResolver = RegistryResolver;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0cmllcy5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJyZWdpc3RyaWVzL3JlZ2lzdHJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVDQUF1QztBQUN2QyxrQ0FBa0M7OztBQUVsQyxtQ0FBOEI7QUFDOUIsb0RBQTBFO0FBQzFFLDBDQUFpRDtBQUNqRCxrQ0FBNEI7QUFHNUIsbURBQWdEO0FBQ2hELHFEQUFrRDtBQXdCbEQ7O0lBRUk7QUFDRyxLQUFLLFVBQVUsV0FBVyxDQUFDLFFBQTRCLEVBQUUsYUFBcUIsRUFBRSxPQUEyQjtJQUNoSCxNQUFNLGVBQWUsR0FBRyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUMxRSxJQUFJLGVBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sU0FBUyxDQUFDLENBQUMsbUJBQW1CO0tBQ3RDO0lBRUQsSUFBSSxlQUFlLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNoQyxxQ0FBcUM7UUFDckMsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFDLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQyxNQUFNLGdCQUFnQixHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQywyREFBMkQsQ0FBQyxDQUFDO1NBQzlFO1FBRUQsT0FBTyxDQUFDLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9DO0lBRUQsb0JBQW9CO0lBQ3BCLG1FQUFtRTtJQUNu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
// SIG // Begin signature block
// SIG // MIIoOgYJKoZIhvcNAQcCoIIoKzCCKCcCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // H2AhjPPo5n+RwXCSLBrO2FXIHByom2MTdh+Gd5LI2M2g
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
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCD3ym3FtdNxzWPJ
// SIG // i2XPidk7b5R8gZufy+QPdneFfq0NPzBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAEhkVn21Jpu9awaorBKzxPFACawDkWA0
// SIG // gmr2+CT7aWOgKLK3ZlbDiElArzIwbpby7cUldWV2P0n6
// SIG // mhlJpwp3pEJ54qTEc/m3mK0q6KwdTzmCD6ApZizbDR1z
// SIG // qjm7tDh8wQR+ljktih5EiedJtiK5Ej2AgegwUw63KnTo
// SIG // a4YgSbGNrEGpcJUsdfCulnOYvwcsB5pJ48Xi0JxPHY5c
// SIG // 05dsfe9kgK2OFMoO2CSyf3TvdiRt1zACvUVv09KtNPpc
// SIG // fxHvO2unBm1lvjX05lxA+D6kRPFlF/uCvvqazESootES
// SIG // CgvfPK9gt/k2bWXAhNrNHJH2b38G1oVHKLFCkPxqXQht
// SIG // 8dahgheXMIIXkwYKKwYBBAGCNwMDATGCF4Mwghd/Bgkq
// SIG // hkiG9w0BBwKgghdwMIIXbAIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // 16bfUDxqUyHGKdIxoXJAiIHErs4qkAAGBVUr0ojQQdkC
// SIG // BmdSJ9wOjBgTMjAyNDEyMDkyMTAzMzMuNDM5WjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOkYwMDIt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR7TCCByAwggUIoAMCAQIC
// SIG // EzMAAAHyPjLXZKxwkZQAAQAAAfIwDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTU4WhcNMjUwMzA1MTg0NTU4WjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOkYwMDItMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEAvOXzyxcKaWIMcGMZEhHmL0AbZ2CU7Sio9hSscx8d
// SIG // H4Fel4CCK5glpqSpfSDs7znyf5Ooj9EZ6EaORfPQHdvX
// SIG // ncxnZVmwo9UMseR1BzWPMrvRJSTpnYHrjb0yuEVuMLvY
// SIG // gef89kngrmKsl/7/M+j6b9vYdbbTVrEnPyjznroc0gF6
// SIG // pANuuQUhU+ZMpMb8wdC8aMUuqFqF1iusMde9jUSUWHCD
// SIG // X1w4VEb1Hw+9I4qBPdq1vzoI3DisWZH0MS5cGhUq0pxr
// SIG // O14TK6fU7FIJsLMnExDgXRlZn9Rwg+1jms+RBHEMiEtg
// SIG // aUWGMLDzGwet7h4idefKjYdUiV7qC+cBg7v22VMzfgc3
// SIG // C4/eosQu8CRkDAYsVh/XfvlfG5ddEWHVw2ZZY0QL0uoh
// SIG // cDc62obuA62G+2/DO778IRC9MQjr2+1hTLLLbHF35HRO
// SIG // YPjUmnKYYBX3KH7UOajw9jzVZqxt/A5hw6GIYI/bqjyz
// SIG // +756F3+4+vi1vFaJ9efA9Fq5pOwrprnEE4h0cnqRGlQ5
// SIG // 5wNhpIiaHof6930oS+gh4D6Ewe6GFP3eiTp3EYqA2Kqk
// SIG // X1dsJaSlTvG/lWBy/IZ9dSURceqevZi/AUbUmenRvxhR
// SIG // FRPn1ZoMWHyAlK6YIckJREyTyExAUteSLGlLltBr15S0
// SIG // qHxn9reQwKA5Ligmwvt1XT5pWFUCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBSVW4cAJurQMQTOXB/AYNPmOuKGeTAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAPUunjuB7HwdNF6ToD2m3Dd0G
// SIG // XsoqYIpXEEg2fIOlQr/RVR83UqvV6QLJY2UijVkgpYSR
// SIG // M+TqN1Jv7Wj56GxfvApAHZHC0IS3ZEoX6/dZM8vbwz6z
// SIG // ppQgNhUPY1YRWmrdkDN989afhgj+bbr4qxWlFs1FlQxT
// SIG // qaPzucw6c6D2LU69HBYN7l2kS0+eFEN2OLj2F6p+sLp2
// SIG // bVEETIiTM8aVJb3X1hlLQr51t3gwYpA5IsdVxPfFXGCM
// SIG // 9vuX3XL6x1XlGqxl8uC0bcM5sKbArVIe7UesIQq1WJG+
// SIG // hbnQXVjO01b44u6RoH43rIJwEmg/woS7seujxsGiGhfs
// SIG // S85NGzcbAI9LoXekHVq+k09/Zv0jWdf1F1O5MxKHdLwG
// SIG // N5iJ/F+QOCPvf3tZwTaVESemIgykHeWFYMbLmQlr+EMG
// SIG // 9Jl4RyHvQrm30qmY7w2sH9iNtvTdy7LQyVEq9bxhQfIk
// SIG // OVvGSzOT8E/L7bChAcBxGJsLLlprMZIpiBeQUG0s4PcM
// SIG // 9Tuo3Vk8RhtDlLdXF1jjCVCc8hB+FkimRzsed6nALw/Y
// SIG // dFOoxBdn7gY7Sf0A61m2+Lq7wH676jZ/ZR+4FT6ZajTw
// SIG // yL0PA5Gd5b20LGKpc+te3u+oGu0mNMO9fkD9euQj3c1G
// SIG // N+nrdkpuKb7KRCvIZZatyGHMl9L/Pe/l/WHnnDNT29Yw
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
// SIG // TjpGMDAyLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUAa4veN3BSx9k30BHwdOUiyAoO+AiggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOsBQ2kwIhgPMjAyNDEyMDkxMDIy
// SIG // MzNaGA8yMDI0MTIxMDEwMjIzM1owdzA9BgorBgEEAYRZ
// SIG // CgQBMS8wLTAKAgUA6wFDaQIBADAKAgEAAgIb5wIB/zAH
// SIG // AgEAAgITcDAKAgUA6wKU6QIBADA2BgorBgEEAYRZCgQC
// SIG // MSgwJjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQow
// SIG // CAIBAAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQB1xgkX
// SIG // 78dOSWLF54XVGrBAzE449hzqs0TFQ3Lf/QeY7jCwkVM1
// SIG // J4AhxyO0x7hqaOFHkXfzAEccwPIKhYJ1xE7/J+QXj/Cn
// SIG // jQYEDZDMnT5otappHcCbRR5MPNshYP1DZtxNOOKAfEps
// SIG // pCQ7HPR3OShiH715wLrRhraBBrFpOWNAnGPkF+8nzxyg
// SIG // gs5Zeeofw7+ieNaoXarUAYJADBVkj5ol4sTsn7QbJlOv
// SIG // BR6YxIYqczZ2XeOx7K+BTHkHtPoNj53jTe71X63Rc64z
// SIG // jQNj4+sHbMzFcydcJPWIB/BoZIzj11z2juKK2LgabKpZ
// SIG // 9Xj7zU6Fw3mr6hNIJWhgmcL3JCtzMYIEDTCCBAkCAQEw
// SIG // gZMwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMA
// SIG // AAHyPjLXZKxwkZQAAQAAAfIwDQYJYIZIAWUDBAIBBQCg
// SIG // ggFKMBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAv
// SIG // BgkqhkiG9w0BCQQxIgQgnyXnXdQOWpfQna8SzSNdWgVa
// SIG // i7jOUMldAwKUDCF0ez8wgfoGCyqGSIb3DQEJEAIvMYHq
// SIG // MIHnMIHkMIG9BCD42j4dLjFSXNOPmOEbuQVFGxxOLLme
// SIG // p0R0lLtF10pDRDCBmDCBgKR+MHwxCzAJBgNVBAYTAlVT
// SIG // MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
// SIG // ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFBDQSAyMDEwAhMzAAAB8j4y12SscJGUAAEAAAHy
// SIG // MCIEIIRgj9ogKiylvCGzASPmuKTVCmNh/KEWFfOCsleX
// SIG // bREvMA0GCSqGSIb3DQEBCwUABIICAKCUKdx+WfLAu9vA
// SIG // uPC6ehB2hXVWJBzBqCV5lZb5Uix8lbhlJXOH9O/vpDji
// SIG // zVtMQe86p98LN2kJOxXz/xwIic6cBf8NIzWoZsoeEchN
// SIG // rS/2+2fk6Yr9sGHkansyi+4gw1X+U2+8OPfaRhaOEsGq
// SIG // ZGvW4+zm0g+3Qx/q1zY7o7wTBngmaRxy6xefDimn479s
// SIG // LQuiWQven1QZ6GNbKoadAFRfkud8RKA1cQOngR2Ed+Ip
// SIG // szsv0mPHqrrhcOD176qwOi7mrSEQSO0dH723JCGGMgcd
// SIG // cu59X2sxQhiYvcxCumE+d2cCVXYIOKBatwOqtgl7Hlin
// SIG // Ltrlyr2vPIMavMkpiQWTvOJq+4PZitTXAnhGIv+AIHE6
// SIG // qNpVC6QzSXzgO5qvZvQ27TwYjhSb2B2IdjucGRrog1SX
// SIG // IKYIDIOM0OplSM7UeRAP0UiXbKJY1YNP5jp3M0Lk1OY9
// SIG // SJIlrgItwz5PvuwBvTlFv7uEbAVy091SeZVg91Ljxf1F
// SIG // PxG0gSmCk+ow3q5+OB34ZiMxzskuHS4jpS4LHVbNzwTo
// SIG // MQRIHMcJN+eP4gyAuMmGAdthHE4KhzxL2Fjj41PcvzZt
// SIG // 6g8DPxVdq058bxL8qDvcr9bsfIpCf0XybYG/slz2vbnV
// SIG // 1+WUuTanxw4dLESS8rF/OZK5ZUhjOac11TdQedAbhgBc
// SIG // lh51njAY
// SIG // End signature block
