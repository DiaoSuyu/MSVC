"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.acquireArtifacts = exports.selectArtifacts = exports.showArtifacts = void 0;
const cli_progress_1 = require("cli-progress");
const artifact_1 = require("../artifacts/artifact");
const i18n_1 = require("../i18n");
const registries_1 = require("../registries/registries");
const console_table_1 = require("./console-table");
const format_1 = require("./format");
const styling_1 = require("./styling");
async function showArtifacts(artifacts, registries, options) {
    let failing = false;
    const table = new console_table_1.Table((0, i18n_1.i) `Artifact`, (0, i18n_1.i) `Version`, (0, i18n_1.i) `Status`, (0, i18n_1.i) `Dependency`, (0, i18n_1.i) `Summary`);
    for (const resolved of artifacts) {
        const artifact = resolved.artifact;
        if (artifact instanceof artifact_1.Artifact) {
            const name = (0, format_1.artifactIdentity)(registries.getRegistryDisplayName(artifact.registryUri), artifact.id, artifact.shortName);
            for (const err of artifact.metadata.validate()) {
                failing = true;
                (0, styling_1.error)(artifact.metadata.formatVMessage(err));
            }
            table.push(name, artifact.version, options?.force || await artifact.isInstalled ? 'installed' : 'will install', resolved.initialSelection ? ' ' : '*', artifact.metadata.summary || '');
        }
    }
    (0, styling_1.log)(table.toString());
    (0, styling_1.log)();
    return !failing;
}
exports.showArtifacts = showArtifacts;
async function selectArtifacts(session, selections, registries, dependencyDepth) {
    const userSelectedArtifacts = new Map();
    const userSelectedVersions = new Map();
    for (const [idOrShortName, version] of selections) {
        const [, artifact] = await (0, registries_1.getArtifact)(registries, idOrShortName, version) || [];
        if (!artifact) {
            (0, styling_1.error)(`Unable to resolve artifact: ${(0, format_1.addVersionToArtifactIdentity)(idOrShortName, version)}`);
            const results = await registries.search({ keyword: idOrShortName, version: version });
            if (results.length) {
                (0, styling_1.log)('Possible matches:');
                for (const [artifactDisplay, artifactVersions] of results) {
                    for (const artifactVersion of artifactVersions) {
                        (0, styling_1.log)(`  ${(0, format_1.addVersionToArtifactIdentity)(artifactDisplay, artifactVersion.version)}`);
                    }
                }
            }
            return false;
        }
        userSelectedArtifacts.set(artifact.uniqueId, artifact);
        userSelectedVersions.set(artifact.uniqueId, version);
    }
    const allResolved = await (0, artifact_1.resolveDependencies)(session, registries, Array.from(userSelectedArtifacts.values()), dependencyDepth);
    const results = new Array();
    for (const resolved of allResolved) {
        results.push({ ...resolved, 'requestedVersion': userSelectedVersions.get(resolved.uniqueId) });
    }
    return results;
}
exports.selectArtifacts = selectArtifacts;
var TaggedProgressKind;
(function (TaggedProgressKind) {
    TaggedProgressKind[TaggedProgressKind["Unset"] = 0] = "Unset";
    TaggedProgressKind[TaggedProgressKind["Verifying"] = 1] = "Verifying";
    TaggedProgressKind[TaggedProgressKind["Downloading"] = 2] = "Downloading";
    TaggedProgressKind[TaggedProgressKind["GenericProgress"] = 3] = "GenericProgress";
    TaggedProgressKind[TaggedProgressKind["Heartbeat"] = 4] = "Heartbeat";
})(TaggedProgressKind || (TaggedProgressKind = {}));
class TaggedProgressBar {
    multiBar;
    bar;
    kind = TaggedProgressKind.Unset;
    lastCurrentValue = 0;
    constructor(multiBar) {
        this.multiBar = multiBar;
    }
    checkChangeKind(currentValue, kind) {
        this.lastCurrentValue = currentValue;
        if (this.kind !== kind) {
            if (this.bar) {
                this.multiBar.remove(this.bar);
                this.bar = undefined;
            }
            this.kind = kind;
        }
    }
    startOrUpdate(kind, total, currentValue, suffix) {
        this.checkChangeKind(currentValue, kind);
        const payload = { suffix: suffix };
        if (this.bar) {
            this.bar.update(currentValue, payload);
        }
        else {
            this.kind = kind;
            this.bar = this.multiBar.create(total, currentValue, payload, { format: '{bar} {percentage}% {suffix}' });
        }
    }
    heartbeat(suffix) {
        this.checkChangeKind(0, TaggedProgressKind.Heartbeat);
        const payload = { suffix: suffix };
        if (this.bar) {
            this.bar.update(0, payload);
        }
        else {
            const progressUnknown = (0, i18n_1.i) `(progress unknown)`;
            const totalSpaces = 41 - progressUnknown.length;
            const prefixSpaces = Math.floor(totalSpaces / 2);
            const suffixSpaces = totalSpaces - prefixSpaces;
            const prettyProgressUnknown = Array(prefixSpaces).join(' ') + progressUnknown + Array(suffixSpaces).join(' ');
            this.bar = this.multiBar.create(0, 0, payload, { format: '*' + prettyProgressUnknown + '* {suffix}' });
        }
    }
}
class TtyProgressRenderer {
    #bar = new cli_progress_1.MultiBar({
        clearOnComplete: true,
        hideCursor: true,
        barCompleteChar: '*',
        barIncompleteChar: ' ',
        etaBuffer: 40
    });
    #overallProgress;
    #individualProgress;
    constructor(totalArtifactCount) {
        this.#overallProgress = this.#bar.create(totalArtifactCount, 0, { name: '' }, { format: `{bar} [{value}/${totalArtifactCount - 1}] {name}`, emptyOnZero: true });
        this.#individualProgress = new TaggedProgressBar(this.#bar);
    }
    setArtifactIndex(index, displayName) {
        this.#overallProgress.update(index, { name: displayName });
    }
    hashVerifyProgress(file, percent) {
        this.#individualProgress.startOrUpdate(TaggedProgressKind.Verifying, 100, percent, (0, i18n_1.i) `verifying` + ' ' + file);
    }
    downloadProgress(uri, destination, percent) {
        this.#individualProgress.startOrUpdate(TaggedProgressKind.Downloading, 100, percent, (0, i18n_1.i) `downloading ${uri.toString()} -> ${destination}`);
    }
    unpackArchiveStart(archiveUri) {
        this.#individualProgress.heartbeat((0, i18n_1.i) `unpacking ${archiveUri.fsPath}`);
    }
    unpackArchiveHeartbeat(text) {
        this.#individualProgress.heartbeat(text);
    }
    stop() {
        this.#bar.stop();
    }
}
const downloadUpdateRateMs = 10 * 1000;
class NoTtyProgressRenderer {
    channels;
    totalArtifactCount;
    #currentIndex = 0;
    #downloadPrecent = 0;
    #downloadTimeoutId;
    constructor(channels, totalArtifactCount) {
        this.channels = channels;
        this.totalArtifactCount = totalArtifactCount;
    }
    setArtifactIndex(index) {
        this.#currentIndex = index;
    }
    startInstallArtifact(displayName) {
        this.channels.message(`[${this.#currentIndex + 1}/${this.totalArtifactCount - 1}] ` + (0, i18n_1.i) `Installing ${displayName}...`);
    }
    alreadyInstalledArtifact(displayName) {
        this.channels.message(`[${this.#currentIndex + 1}/${this.totalArtifactCount - 1}] ` + (0, i18n_1.i) `${displayName} already installed.`);
    }
    downloadStart(uris, destination) {
        let displayUri;
        if (uris.length === 1) {
            displayUri = uris[0].toString();
        }
        else {
            displayUri = JSON.stringify(uris.map(uri => uri.toString()));
        }
        this.channels.message((0, i18n_1.i) `Downloading ${displayUri}...`);
        this.#downloadTimeoutId = setTimeout(this.downloadProgressDisplay.bind(this), downloadUpdateRateMs);
    }
    downloadProgress(uri, destination, percent) {
        this.#downloadPrecent = percent;
    }
    downloadProgressDisplay() {
        this.channels.message(`${this.#downloadPrecent}%`);
        this.#downloadTimeoutId = setTimeout(this.downloadProgressDisplay.bind(this), downloadUpdateRateMs);
    }
    downloadComplete() {
        if (this.#downloadTimeoutId) {
            clearTimeout(this.#downloadTimeoutId);
        }
    }
    stop() {
        if (this.#downloadTimeoutId) {
            clearTimeout(this.#downloadTimeoutId);
        }
    }
    unpackArchiveStart(archiveUri) {
        this.channels.message((0, i18n_1.i) `Unpacking ${archiveUri.fsPath}...`);
    }
}
async function acquireArtifacts(session, resolved, registries, options) {
    // resolve the full set of artifacts to install.
    const isTty = process.stdout.isTTY === true;
    const progressRenderer = isTty ? new TtyProgressRenderer(resolved.length) : new NoTtyProgressRenderer(session.channels, resolved.length);
    for (let idx = 0; idx < resolved.length; ++idx) {
        const artifact = resolved[idx].artifact;
        if (artifact instanceof artifact_1.Artifact) {
            const id = artifact.id;
            const registryName = registries.getRegistryDisplayName(artifact.registryUri);
            const artifactDisplayName = (0, format_1.artifactIdentity)(registryName, id, artifact.shortName);
            progressRenderer.setArtifactIndex?.(idx, artifactDisplayName);
            try {
                const installStatus = await artifact.install(artifactDisplayName, progressRenderer, options || {});
                switch (installStatus) {
                    case artifact_1.InstallStatus.Installed:
                        session.trackAcquire(artifact.registryUri.toString(), id, artifact.version);
                        break;
                    case artifact_1.InstallStatus.AlreadyInstalled:
                        break;
                    case artifact_1.InstallStatus.Failed:
                        progressRenderer.stop?.();
                        return false;
                }
            }
            catch (e) {
                progressRenderer.stop?.();
                (0, styling_1.debug)(e);
                (0, styling_1.debug)(e.stack);
                (0, styling_1.error)((0, i18n_1.i) `Error installing ${artifactDisplayName} - ${e}`);
                return false;
            }
        }
    }
    progressRenderer.stop?.();
    return true;
}
exports.acquireArtifacts = acquireArtifacts;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0aWZhY3RzLmpzIiwic291cmNlUm9vdCI6Imh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9taWNyb3NvZnQvdmNwa2ctdG9vbC9tYWluL3ZjcGtnLWFydGlmYWN0cy8iLCJzb3VyY2VzIjpbImNsaS9hcnRpZmFjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVDQUF1QztBQUN2QyxrQ0FBa0M7OztBQUVsQywrQ0FBbUQ7QUFDbkQsb0RBQWlJO0FBQ2pJLGtDQUE0QjtBQUU1Qix5REFBaUc7QUFJakcsbURBQXdDO0FBQ3hDLHFDQUEwRTtBQUMxRSx1Q0FBOEM7QUFFdkMsS0FBSyxVQUFVLGFBQWEsQ0FBQyxTQUFxQyxFQUFFLFVBQWtDLEVBQUUsT0FBNkI7SUFDMUksSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ3BCLE1BQU0sS0FBSyxHQUFHLElBQUkscUJBQUssQ0FBQyxJQUFBLFFBQUMsRUFBQSxVQUFVLEVBQUUsSUFBQSxRQUFDLEVBQUEsU0FBUyxFQUFFLElBQUEsUUFBQyxFQUFBLFFBQVEsRUFBRSxJQUFBLFFBQUMsRUFBQSxZQUFZLEVBQUUsSUFBQSxRQUFDLEVBQUEsU0FBUyxDQUFDLENBQUM7SUFDdkYsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7UUFDaEMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUNuQyxJQUFJLFFBQVEsWUFBWSxtQkFBUSxFQUFFO1lBQ2hDLE1BQU0sSUFBSSxHQUFHLElBQUEseUJBQWdCLEVBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4SCxLQUFLLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBQzlDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ2YsSUFBQSxlQUFLLEVBQUMs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
// SIG // Begin signature block
// SIG // MIIoKwYJKoZIhvcNAQcCoIIoHDCCKBgCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // jexLa/xbS7GZkSj0ofTjTuvF2YREB32UVIFXqwUzDJ+g
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
// SIG // a/15n8G9bW1qyVJzEw16UM0xghoNMIIaCQIBATCBlTB+
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAE
// SIG // BGx0Bv9XKydyAAAAAAQEMA0GCWCGSAFlAwQCAQUAoIGu
// SIG // MBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwGCisG
// SIG // AQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3
// SIG // DQEJBDEiBCAMYRRIXHu78fBZfc14H6VTQsFQgYGKIWET
// SIG // TNhbT4LiRTBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAAt4uena
// SIG // lO5t9fUBdY3Y4X3asYN9Q1rX5EmPYTyGU0oXTKI8TU9X
// SIG // 91u06bqzwAjsl0IeaJnrM/L/9h30S2o/pQATbtlAyIFW
// SIG // OcWDVAohYl2YITEhgq+4tltrh7PXWuY4JyFWzO7MYqIe
// SIG // hfu/oZIlWbX7hEj/V8spjSxTLz/h0WLA5V4LgIwOufUw
// SIG // ERGBNb5WyLO9YtIv+blg/pXuKPO+i4hDTsiPtWNLRvsZ
// SIG // ENarF2RUqD/u9SgzDPiy7lfWPyWnbERovSunsgptUKMo
// SIG // 0JeAuhWbS2/S5WjQrDF+v65LcViNpjaivVcc8+NswYiD
// SIG // Msk3gbZf3hXXkfJSdviBSjFw/1ahgheXMIIXkwYKKwYB
// SIG // BAGCNwMDATGCF4Mwghd/BgkqhkiG9w0BBwKgghdwMIIX
// SIG // bAIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZIhvcN
// SIG // AQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQg1jN3lCylcECLmDbY7BBQ
// SIG // asmhqMY+a0gjfyTcf5EInGECBmc/WarYlRgTMjAyNDEy
// SIG // MDkyMTAzMzQuMDc1WjAEgAIB9KCB0aSBzjCByzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0
// SIG // IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNo
// SIG // aWVsZCBUU1MgRVNOOkUwMDItMDVFMC1EOTQ3MSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oIIR7TCCByAwggUIoAMCAQICEzMAAAHuBdMCMLKanacA
// SIG // AQAAAe4wDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTAwHhcNMjMxMjA2MTg0NTQ0WhcN
// SIG // MjUwMzA1MTg0NTQ0WjCByzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3Bl
// SIG // cmF0aW9uczEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNO
// SIG // OkUwMDItMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAg8AMIICCgKCAgEAvvG8pdeihImvMSku
// SIG // L1S+0RDjkey82Ai1xLVoHqsjlZa87hM/gKAmuLQRhEo2
// SIG // x01xAnjDsD/Uz3imimpX01OV0ho6SYaRsefX8TCaE2Fj
// SIG // 88w9DtkQJcgZjgQZoiw10Q0CS9UbbgI7woi7pVUHojyP
// SIG // Fe/h4U0d/dU2wtW3kscF33SiamNaJ4w2sKgyQJrcLAP4
// SIG // Jql4B8BfX2VnMCkrl4mQU21OX3Jt24YZUTcOXdOC3deW
// SIG // Vs1Zf1Q6f4kXqxqNiLP9FsJ/2t3hjnR6738CG35OpVas
// SIG // GzUBNdTnnZ9rr0YylhMHq1y+9Drg2fLy88a8tMhHb0PJ
// SIG // MvlX6vJnxF0vdO2O6zfx2F+nArAtrKMlxtzsArSwO6NP
// SIG // /pCiWbjqw+R1K0s95H6oA5Zlsuu8/GWT45IgwtXWFtYz
// SIG // e+7eYkpeVqdRygaeyVPEYkSPr2NotXG+V9kRJMN1qzVv
// SIG // 426H1xLPbeG4HfslPLICp/TLVZ0OubOkBu9jP8mlGRth
// SIG // zCN9bZvZqKB9vbzwTvYwzDiLtC8M1E5CFn5YHf7xFn0z
// SIG // XD1hEI+37FrkqFbid7gasDZkUqZkA80nzGiM7srNKb1d
// SIG // YxVqrasMAnGmP1l7G/2sZMQf8wk3R0gVCfE5t4uDzPbJ
// SIG // Irp12PnEqh+fI1pKR22ywNzn7LO3viWzIypk3XI5kpG+
// SIG // aDfKlNcCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBQQiM0/
// SIG // GtncIJ69+8Xftr9f3HamCDAfBgNVHSMEGDAWgBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQ
// SIG // hk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
// SIG // JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwG
// SIG // CCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUt
// SIG // U3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMB
// SIG // Af8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4G
// SIG // A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // d2cgL2thCjlklaQZ2JM1/H/BmY2jrOe+xfaNeAJ4fZSs
// SIG // urUt+MF6D1xMkKdb9YiO6yc2VRu66VM52stp/XLH596e
// SIG // su5GJB6rUroAhpk4ogZMIRX0gcijyNPDJJYLybyk2W+u
// SIG // 98hn6RcD40MGXiOhD4/zgLaWJE+yFF6jJItQkTCSoHmO
// SIG // MFEQnHCLo3VkZKFb+Cd6v/OyhNKj0JgEfX6jDcYyN2Qp
// SIG // VcQOMIjN7TVZUWxfUoKTp41aNz/yOafCXeNYTUlQsf/I
// SIG // 96jO2i0irQ8zhFDbPmbY4c55mYFHe/wFhw4cAR3S+e0y
// SIG // PYe54mZHzmTl53GLCsRuIK8k7IVOhurAGKW6nTBP/v4N
// SIG // bnq+1RiB1LS6t1tAJ5vJQH0vT6rYbJGbeeCRdvAh3bBa
// SIG // v+11QbRZcS/yoHEMpSTZ4mvmp4sVButMlA7dxTBkiSN+
// SIG // MRvTR7M9waaklrnhrSYUOWTdCvI7tLzVYBfg79ObIqz4
// SIG // NH7Uin/RVRAqfd6PKIBePI4fAk/wd9pc9Q+k67pOBM3M
// SIG // OxNTobTjH+wx4DzFn+ljnWJ3/h2kice2U1wibFuaDpDN
// SIG // LC4rcQaUqRnI9mI5zc5wqbBD2WrdIfune7pUWlkeURwF
// SIG // MhRUPY0WuylmjRnRC07Ppx0pWI2HkKSuUEl44oHSpS0D
// SIG // wZV/vczqBgCYaGX66Y6uJ0AwggdxMIIFWaADAgECAhMz
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
// SIG // ahC0HVUzWLOhcGbyoYIDUDCCAjgCAQEwgfmhgdGkgc4w
// SIG // gcsxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJTAjBgNVBAsTHE1p
// SIG // Y3Jvc29mdCBBbWVyaWNhIE9wZXJhdGlvbnMxJzAlBgNV
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjpFMDAyLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAiKOm1Tb35RcW
// SIG // 1Fgg0N2GCsujvpOggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOsB
// SIG // keUwIhgPMjAyNDEyMDkxNTU3MjVaGA8yMDI0MTIxMDE1
// SIG // NTcyNVowdzA9BgorBgEEAYRZCgQBMS8wLTAKAgUA6wGR
// SIG // 5QIBADAKAgEAAgIIJAIB/zAHAgEAAgISVTAKAgUA6wLj
// SIG // ZQIBADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZ
// SIG // CgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqG
// SIG // SIb3DQEBCwUAA4IBAQCdldkyQhcukzhkQDUjU7GJYov5
// SIG // MkNYoLxx16LVmSsFvVTrqMFUHpvLGByxRUuX6K67YiQC
// SIG // vIcguzRKm5GDkn/gdz4T0wDqtgEL6U9si0IJTgslfd6G
// SIG // qrsZcpbyTLyLlmJsYz2YN56JSPXCwcya1UADMjoeQ4kB
// SIG // VZXqvlzxHF/p1tWrs0NcvXmubFNXAJyreiG2+FYVpeDi
// SIG // ic1NLmaMgoziRZBFoCha7TneEgfSnb41pckB6swr5pkA
// SIG // 26YtmTIXtoSvtsMAHlbcZKsXw6pvKiZmFz4mKAsZYHlV
// SIG // gSbuURnjcOpvrVwXbM9beoCaosyuWYT7a/U9qw5zV7h/
// SIG // m0gRMAgyMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTACEzMAAAHuBdMCMLKanacAAQAA
// SIG // Ae4wDQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJ
// SIG // AzENBgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQg
// SIG // CTrAxkqIv5e8nJtUipp8o2/AGyRYcs0l6l2mluRRe5gw
// SIG // gfoGCyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCBPUHcU
// SIG // lYX6vlXX/gz7PuRCJAc/aAkvzkH5R5FUYX4wITCBmDCB
// SIG // gKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMT
// SIG // HU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMz
// SIG // AAAB7gXTAjCymp2nAAEAAAHuMCIEIGH5J6XyKQH7YPzU
// SIG // K5yWo4RcCFpjQguEkN9uk/P9UaioMA0GCSqGSIb3DQEB
// SIG // CwUABIICAChSEQ/hn111CyvdN7LNuwAE5IqZRQYxjdPY
// SIG // OygFwdXOlXqkeb5TT3397Ey7OkgKilyU0YprIpe2tbL8
// SIG // w6ejGGtS0iDs8VecQ8LXmyYHoQ16fMZy6jxVu7Tl9rho
// SIG // jY8vUMOyncPyeOcgVGVuPxWPhGQZQawrGTvOAoqJqbb4
// SIG // b6La6HrdqbpbhvxoeT+dYC/PyzCrTxLHq0YJJ1Xs+NxP
// SIG // HBCidnXOfqRO7JLDQvKcrgDOQc4/Srs8rIUwx2QOir1V
// SIG // Flb3SrTvbttMmYyH3NvY1tGb+JF+Lj8bNeXbjGjYK1Tz
// SIG // kmIDNC7D6//drxf2tEiE1g71528sTaT4DFnOtKg35Cgi
// SIG // c6dQlFqMiI2bT6HuC6kRLQ5buxpQYqyiGUsqTVBkKwgL
// SIG // FoEQu7A9n2NoWAysiBRxw7EYPraUzq+/soRVpFjJ/sAz
// SIG // DaSvLosniX6y+3aEfkVlV+tkvyPEyNkaCHWmHkKL9vby
// SIG // zBrUdb7EyiXVjDSonhaa5oCkFHanVxGD5eJTQyajq6es
// SIG // eScXmEMuc45x440JEBNT4Ys9vbvXL1M5Uaq0KXKENyqm
// SIG // TwW8FTlbYhQE++dqiMyemlq2ZBCURMrGqIibImykQjD2
// SIG // HNrJslxn8W/ob00G+ayMMy2tEZdcCzSaxAisyxZxoZLH
// SIG // NoAOJdFQff9/XVwuEudqyaXkYuR87UUS
// SIG // End signature block
