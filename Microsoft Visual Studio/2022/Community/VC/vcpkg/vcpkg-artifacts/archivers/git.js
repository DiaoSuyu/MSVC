"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Git = void 0;
const exec_cmd_1 = require("../util/exec-cmd");
const uri_1 = require("../util/uri");
/** @internal */
class Git {
    #toolPath;
    #targetFolder;
    constructor(toolPath, targetFolder) {
        this.#toolPath = toolPath;
        this.#targetFolder = targetFolder;
    }
    /**
     * Method that clones a git repo into a desired location and with various options.
     * @param repo The Uri of the remote repository that is desired to be cloned.
     * @param events The events that may need to be updated in order to track progress.
     * @param options The options that will modify how the clone will be called.
     * @returns Boolean representing whether the execution was completed without error, this is not necessarily
     *  a guarantee that the clone did what we expected.
     */
    async clone(repo, events, options = {}) {
        const remote = await (0, uri_1.isFilePath)(repo) ? repo.fsPath : repo.toString();
        const result = await (0, exec_cmd_1.execute)(this.#toolPath, [
            'clone',
            remote,
            this.#targetFolder.fsPath,
            options.recursive ? '--recursive' : '',
            options.depth ? `--depth=${options.depth}` : '',
            '--progress'
        ], {
            onStdErrData: chunkToHeartbeat(events),
            onStdOutData: chunkToHeartbeat(events)
        });
        return result.code === 0 ? true : false;
    }
    /**
     * Fetches a 'tag', this could theoretically be a commit, a tag, or a branch.
     * @param remoteName Remote name to fetch from. Typically will be 'origin'.
     * @param events Events that may be called in order to present progress.
     * @param options Options to modify how fetch is called.
     * @returns Boolean representing whether the execution was completed without error, this is not necessarily
     *  a guarantee that the fetch did what we expected.
     */
    async fetch(remoteName, events, options = {}) {
        const result = await (0, exec_cmd_1.execute)(this.#toolPath, [
            '-C',
            this.#targetFolder.fsPath,
            'fetch',
            remoteName,
            options.commit ? options.commit : '',
            options.depth ? `--depth=${options.depth}` : ''
        ], {
            cwd: this.#targetFolder.fsPath
        });
        return result.code === 0 ? true : false;
    }
    /**
     * Checks out a specific commit. If no commit is given, the default behavior of a checkout will be
     * used. (Checking out the current branch)
     * @param events Events to possibly track progress.
     * @param options Passing along a commit or branch to checkout, optionally.
     * @returns Boolean representing whether the execution was completed without error, this is not necessarily
     *  a guarantee that the checkout did what we expected.
     */
    async checkout(events, options = {}) {
        const result = await (0, exec_cmd_1.execute)(this.#toolPath, [
            '-C',
            this.#targetFolder.fsPath,
            'checkout',
            options.commit ? options.commit : ''
        ], {
            cwd: this.#targetFolder.fsPath,
            onStdErrData: chunkToHeartbeat(events),
            onStdOutData: chunkToHeartbeat(events)
        });
        return result.code === 0 ? true : false;
    }
    /**
     * Performs a reset on the git repo.
     * @param events Events to possibly track progress.
     * @param options Options to control how the reset is called.
     * @returns Boolean representing whether the execution was completed without error, this is not necessarily
     *  a guarantee that the reset did what we expected.
     */
    async reset(events, options = {}) {
        const result = await (0, exec_cmd_1.execute)(this.#toolPath, [
            '-C',
            this.#targetFolder.fsPath,
            'reset',
            options.commit ? options.commit : '',
            options.recurse ? '--recurse-submodules' : '',
            options.hard ? '--hard' : ''
        ], {
            cwd: this.#targetFolder.fsPath,
            onStdErrData: chunkToHeartbeat(events),
            onStdOutData: chunkToHeartbeat(events)
        });
        return result.code === 0 ? true : false;
    }
    /**
     * Initializes a folder on disk to be a git repository
     * @returns true if the initialization was successful, false otherwise.
     */
    async init() {
        if (!await this.#targetFolder.exists()) {
            await this.#targetFolder.createDirectory();
        }
        if (!await this.#targetFolder.isDirectory()) {
            throw new Error(`${this.#targetFolder.fsPath} is not a directory.`);
        }
        const result = await (0, exec_cmd_1.execute)(this.#toolPath, ['init'], {
            cwd: this.#targetFolder.fsPath
        });
        return result.code === 0 ? true : false;
    }
    /**
     * Adds a remote location to the git repo.
     * @param name the name of the remote to add.
     * @param location the location of the remote to add.
     * @returns true if the addition was successful, false otherwise.
     */
    async addRemote(name, location) {
        const result = await (0, exec_cmd_1.execute)(this.#toolPath, [
            '-C',
            this.#targetFolder.fsPath,
            'remote',
            'add',
            name,
            location.toString()
        ], {
            cwd: this.#targetFolder.fsPath
        });
        return result.code === 0;
    }
    /**
     * updates submodules in a git repository
     * @param events Events to possibly track progress.
     * @param options Options to control how the submodule update is called.
     * @returns true if the update was successful, false otherwise.
     */
    async updateSubmodules(events, options = {}) {
        const result = await (0, exec_cmd_1.execute)(this.#toolPath, [
            '-C',
            this.#targetFolder.fsPath,
            'submodule',
            'update',
            '--progress',
            options.init ? '--init' : '',
            options.depth ? `--depth=${options.depth}` : '',
            options.recursive ? '--recursive' : '',
        ], {
            cwd: this.#targetFolder.fsPath,
            onStdErrData: chunkToHeartbeat(events),
            onStdOutData: chunkToHeartbeat(events)
        });
        return result.code === 0;
    }
    /**
     * sets a git configuration value in the repo.
     * @param configFile the relative path to the config file inside the repo on disk
     * @param key the key to set in the config file
     * @param value the value to set in the config file
     * @returns true if the config file was updated, false otherwise
     */
    async config(configFile, key, value) {
        const result = await (0, exec_cmd_1.execute)(this.#toolPath, [
            'config',
            '-f',
            this.#targetFolder.join(configFile).fsPath,
            key,
            value
        ], {
            cwd: this.#targetFolder.fsPath
        });
        return result.code === 0;
    }
}
exports.Git = Git;
function chunkToHeartbeat(events) {
    return (chunk) => {
        const regex = /\s([0-9]*?)%/;
        chunk.toString().split(/^/gim).map((x) => x.trim()).filter((each) => each).forEach((line) => {
            const match_array = line.match(regex);
            if (match_array !== null) {
                events.unpackArchiveHeartbeat?.(line.trim());
            }
        });
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6Imh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9taWNyb3NvZnQvdmNwa2ctdG9vbC9tYWluL3ZjcGtnLWFydGlmYWN0cy8iLCJzb3VyY2VzIjpbImFyY2hpdmVycy9naXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVDQUF1QztBQUN2QyxrQ0FBa0M7OztBQUdsQywrQ0FBMkM7QUFDM0MscUNBQThDO0FBTTlDLGdCQUFnQjtBQUNoQixNQUFhLEdBQUc7SUFDZCxTQUFTLENBQVM7SUFDbEIsYUFBYSxDQUFNO0lBRW5CLFlBQVksUUFBZ0IsRUFBRSxZQUFpQjtRQUM3QyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztJQUNwQyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBUyxFQUFFLE1BQTZCLEVBQUUsVUFBbUQsRUFBRTtRQUN6RyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZ0JBQVUsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRXRFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxrQkFBTyxFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDM0MsT0FBTztZQUNQLE1BQU07WUFDTixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU07WUFDekIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQy9DLFlBQVk7U0FDYixFQUFFO1lBQ0QsWUFBWSxFQUFFLGdCQUFnQixDQUFDLE1B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
// SIG // Begin signature block
// SIG // MIIoKAYJKoZIhvcNAQcCoIIoGTCCKBUCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // Kv9xrD1WYPeNDTPUTh8LSmwh8IULZ/3uPahwLB2XgCag
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
// SIG // DQEJBDEiBCCTKGeFUYhT/pQ0VZ6d+3uGAZYsvfZHXhUo
// SIG // IkCNL+RGHjBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAF7HGehV
// SIG // nBJhU1pezFFo7EZUFosfYUUuCcgJpgYeXKSb7vsitbon
// SIG // 7NxD1n9jmKd9y2W1swZwxqLgZa2WFQlEmgm+XTdEI8jf
// SIG // GJyVZujYIniEncDFe42Benjp8jPZ7fhi1CLjoEtS7jXg
// SIG // dnZB4+Cj99dVzXSaYYi8QrGCOyuvoLTIEI4OwLK9B72w
// SIG // WizaB0og8VQUD8y4JEtZQycr20wJWXJSzhxRbFuE8+JA
// SIG // l9wzdK6BrbhNjN2FTVERPNjAbBIfESFoNyzvTjFppP/4
// SIG // cPvsP2ggwv/BJlg5GOeNs7cyqT4WOk0+yu9900OqmU03
// SIG // p4opnv0Fz2W8ezPynHY+mE3yinOhgheUMIIXkAYKKwYB
// SIG // BAGCNwMDATGCF4Awghd8BgkqhkiG9w0BBwKgghdtMIIX
// SIG // aQIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZIhvcN
// SIG // AQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgI1JKCZX40BiSN/5KwK7m
// SIG // n3c6rT7ce0oWa4flYXac/UICBmdSJ+XakBgTMjAyNDEy
// SIG // MDkyMTAzMzMuMzY3WjAEgAIB9KCB0aSBzjCByzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0
// SIG // IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNo
// SIG // aWVsZCBUU1MgRVNOOjMzMDMtMDVFMC1EOTQ3MSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oIIR6jCCByAwggUIoAMCAQICEzMAAAHm2UKe6gD4feEA
// SIG // AQAAAeYwDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTAwHhcNMjMxMjA2MTg0NTE1WhcN
// SIG // MjUwMzA1MTg0NTE1WjCByzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3Bl
// SIG // cmF0aW9uczEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNO
// SIG // OjMzMDMtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAg8AMIICCgKCAgEAvb6YfOLYJbhM5v8K
// SIG // TSpQI3BJRs35bygA2dQ/tnf4nmGBLRdhyjKyhhQzi6S1
// SIG // lhuQxMoim5WCqxNp7eeNDhrt+WcdIFyQRNM1mp2RAIwo
// SIG // 7eHhgYvrmpGbJO9Mx00Bx8nz/gd5tgUkjRT4YLFSD6er
// SIG // 6P/bejnjXsyMF+ROflcBBt+52YBHsUBdn0GWG8UNQGrq
// SIG // g70XV7EqStXYdVAbfRGjLM7rnGkeZzMEDerA4xvfRc3S
// SIG // vQLc25+EppbKC1LUQIf++vLCndGNYTJilR8CF/P+CblE
// SIG // VAUWdCVrtDWEAafJIZLtfEPAgEOdNLRQe1R96Q/M6AOJ
// SIG // XAOyZMUxqDyq7n5vpUWQAOIjIG3C2dj/8UnZyhcVPLy9
// SIG // 9UaDZWSYhi+TKk1778gS8/jET+BJ/TcntTfMf5SQ9bLX
// SIG // TaOcCRvpoF7BP8384NhmlakHMxR4NDZfG6SKpzRVEXkE
// SIG // atwtY1WDAknHoDcx3mLcOTpmf+3lZ0Zo15QrC73bMTs3
// SIG // NWFZ+p2S5EA+ct9R2KwfYiB7rMIWjL9oSTTY1Z3ZKVsv
// SIG // d+DyGblkzJN+tJI1zxcJdlr9U85vbTqwqvPpeNPCiC+i
// SIG // fnn6BjZEfGAdzPrtbWHlQzv03Dmxh8WhhQekGcQFKZ3w
// SIG // eTfzJgTcTDqsxtTfEIsFvILY4zCYhQX+omGKwo7UcBey
// SIG // D3UCxbUCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBTlBDF5
// SIG // 7TeePtdWTPkLu0Oa4NxXPTAfBgNVHSMEGDAWgBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQ
// SIG // hk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
// SIG // JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwG
// SIG // CCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUt
// SIG // U3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMB
// SIG // Af8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4G
// SIG // A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // YW7qIE2qUbLsEpGhTEOncrvGQmFKVkPIiK24uNLVNoSu
// SIG // qR4LtIY9M//cxUUceQ34bpI724wP3UuVWH8c9RCGz5bf
// SIG // PezCdrARjtmC2MGHpXyaQ8GwdF0vWZK6qc6ul/5Zg0A5
// SIG // 9xub3GKWEAieeSy78hZSdfeQFaOFsvFF+ae4PVtzIDR0
// SIG // DKTPhFeuPnLM4+B6OWkJnihrSsu8O9nkWP71g7qba786
// SIG // 7hTZigiLddlHAOQTrF6dT7ZI8dskbAo++w0ppdM1WI6l
// SIG // vyElpKxo8nlSfpIc3LcWi5JJVcAsYoKJA+n5Fm8tIQhC
// SIG // kzkzzM4boDyAHMXB7EdrMdNWEWvaR9s73XbLgRH0hRug
// SIG // o9EErxGfzPZifoeJomkEkewBG1Rg28kSpGJ/NEvtwJkZ
// SIG // Yd2TnvgRaieezl3XiA0h27x8ye6E6hvPepd3lIT7GYOv
// SIG // XzYMU8Zb0TZkRP/utWI+2dbgdF2ED+tK7DC3U5VWBMmV
// SIG // JeTC0y+S76haM2ZUtl6I4uARD+nXVU85hyeKHTmTFk03
// SIG // kNCMJ1hvfL1r/66D3oAq9RutRVa3VyxNwFyH7eGTeGZA
// SIG // 056AIT8Ow2TT0ZUluE21Y/y8NF75y2DcDFAPaLmP8Mfb
// SIG // Xk2ifL05G4GMmjmChc+qzUV2eGn+ntyF8DAn3wmrKSlF
// SIG // wu9mDLuVvC/88k8bDVBIAW0wggdxMIIFWaADAgECAhMz
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
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjozMzAzLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUA4ljQXhSfY72h
// SIG // KzeuA9RvOni9JruggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOsB
// SIG // Q3QwIhgPMjAyNDEyMDkxMDIyNDRaGA8yMDI0MTIxMDEw
// SIG // MjI0NFowdDA6BgorBgEEAYRZCgQBMSwwKjAKAgUA6wFD
// SIG // dAIBADAHAgEAAgIa4zAHAgEAAgITuzAKAgUA6wKU9AIB
// SIG // ADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMC
// SIG // oAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3
// SIG // DQEBCwUAA4IBAQBZW2Npk+6if0C5KDC7a2uzwTvE84tP
// SIG // POKghw0bneQCa2yail1uprdfZhyPWPC9DAwquTomqLh9
// SIG // mAgO4mtqCyCyKIDKS8d1r9Sf5Vmw9dhc/Rr4yv9WarMI
// SIG // C64DnHCumELskZIyEl/GRsvMz8Way3VozhHU4GYzs5NC
// SIG // T3Fmpx62n4JnKdnENioBzSafAK1seWuKQa5Wv1hYsqLR
// SIG // V0rWusy+vncExjc5XRqE/llz2NYMzIZjWvq657KItnwK
// SIG // h5ezODa/0sa5qIsM0RfqJnGLlnob+JrUkfkAR9c32jwI
// SIG // /nWRy01Kf5hHT0OBQdcwpDo3/wURSdjRK4MDHCBHyrcL
// SIG // mT2qMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTACEzMAAAHm2UKe6gD4feEAAQAAAeYw
// SIG // DQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzEN
// SIG // BgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQgU8Ob
// SIG // wvcPg5SrDFIUVHraguMXbsjrBHwv0bZDPq2/dHIwgfoG
// SIG // CyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCDPu6OGqB6z
// SIG // CWhvIJyztateoSGHEZ6MuhZzgm50g9LGWTCBmDCBgKR+
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB
// SIG // 5tlCnuoA+H3hAAEAAAHmMCIEIFFv+wDR99uzAoeP9pm5
// SIG // pTOZmSHJri0Bs7aP1rjwG88yMA0GCSqGSIb3DQEBCwUA
// SIG // BIICAEaXlEk8A+OHzqu+Jvn/49SzdAjfXmK/toUgtyNx
// SIG // 82YPZK0joFs4SiGsR86Ek3oHVePMXqMt5ZyYY+e5Y0fW
// SIG // ad+v9UiKHBu1YBcWhvgrOaABQKBkBH2e2ED68mnSJzRO
// SIG // JEStThlJuTnh5JmTihigu+dJh/Q7LX+r0zvFg8Mvem5I
// SIG // Az7baORY+E5U4i2za5El13IOMbdPi0vgsIoeJDZSqouO
// SIG // mZ9dHZF7pQ12L7Ebj4gUnBnXxOc3UIiPDyuy8bMVvB4G
// SIG // i1cZp2tGJARsF2yCkz/6TCWwZ0BaBdEl6mez/Ka0lrvA
// SIG // KgF8x5mK68nQHq+EFdnMj9JYjTdFrhFp/m01DakjFE/e
// SIG // kUGLqTSBdCO1elr4KAk1/jxK+qB84dj6BYqBttj4Njzg
// SIG // 0s+u/sa+vcz2owOXRPcilnl/1hw0xSUvtDI9czckxSqc
// SIG // 82uknsaEEGI3SDOajX5lu6AZH21gbXFI/EnsZt976Ok2
// SIG // 0YFSta7V0MIb55Jh17w/LOOAtVTx6K9oc6Xk7oVwzaK0
// SIG // C+uAHcgwsk2kb3CP7diDkZE3YIpHbIWeq8X+pKB8DmCB
// SIG // suPWK5DXjqd2KnygHey2Ke99yqExV4wHZMlKg++vvvWc
// SIG // tawIc7xvRYgdp/CzAGNuJ5Ta21gbRCi3LEdMFPyP/eXD
// SIG // w0USqo/aYO1abEejNU3SnrG3sjmu
// SIG // End signature block
