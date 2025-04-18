"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFileSystem = void 0;
const assert_1 = require("assert");
const constants_1 = require("constants");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const i18n_1 = require("../i18n");
const exceptions_1 = require("../util/exceptions");
const promise_1 = require("../util/promise");
const filesystem_1 = require("./filesystem");
function getFileType(stats) {
    return filesystem_1.FileType.Unknown |
        (stats.isDirectory() ? filesystem_1.FileType.Directory : 0) |
        (stats.isFile() ? filesystem_1.FileType.File : 0) |
        (stats.isSymbolicLink() ? filesystem_1.FileType.SymbolicLink : 0);
}
class LocalFileStats {
    stats;
    constructor(stats) {
        this.stats = stats;
        assert_1.strict.ok(stats, (0, i18n_1.i) `stats may not be undefined`);
    }
    get type() {
        return getFileType(this.stats);
    }
    get ctime() {
        return this.stats.ctimeMs;
    }
    get mtime() {
        return this.stats.mtimeMs;
    }
    get size() {
        return this.stats.size;
    }
    get mode() {
        return this.stats.mode;
    }
}
/**
 * Implementation of the Local File System
 *
 * This is used to handle the access to the local disks.
 */
class LocalFileSystem extends filesystem_1.FileSystem {
    async stat(uri) {
        const path = uri.fsPath;
        const s = await (0, promises_1.stat)(path);
        return new LocalFileStats(s);
    }
    async readDirectory(uri, options) {
        let retval;
        try {
            const folder = uri.fsPath;
            const retval = new Array();
            // use forEachAsync instead so we can throttle this appropriately.
            await (await (0, promises_1.readdir)(folder)).forEachAsync(async (each) => {
                const path = uri.fileSystem.file((0, path_1.join)(folder, each));
                const type = getFileType(await (0, promises_1.stat)(uri.join(each).fsPath));
                retval.push([path, type]);
                if (options?.recursive && type === filesystem_1.FileType.Directory) {
                    retval.push(...await this.readDirectory(path, options));
                }
            }).done;
            return retval;
        }
        finally {
            // log that.
            this.directoryRead(uri, retval);
        }
    }
    async createDirectory(uri) {
        await (0, promises_1.mkdir)(uri.fsPath, { recursive: true });
        this.directoryCreated(uri);
    }
    createSymlink(original, slink) {
        return (0, promises_1.symlink)(original.fsPath, slink.fsPath, 'file');
    }
    async readFile(uri) {
        let contents;
        try {
            contents = (0, promises_1.readFile)(uri.fsPath);
            return await contents;
        }
        finally {
            this.read(uri, contents);
        }
    }
    async writeFile(uri, content) {
        try {
            await uri.parent.createDirectory();
            return (0, promises_1.writeFile)(uri.fsPath, content);
        }
        finally {
            this.write(uri, content);
        }
    }
    async delete(uri, options) {
        try {
            options = options || { recursive: false };
            await (0, promises_1.rm)(uri.fsPath, { recursive: options.recursive, force: true, maxRetries: 3, retryDelay: 20 });
            // todo: Hack -- on windows, when something is used and then deleted, the delete might not actually finish
            // before the Promise is resolved. Adding a delay fixes this (but probably is an underlying node bug)
            await new Promise(res => setTimeout(res, 50));
            return;
        }
        finally {
            this.deleted(uri);
        }
    }
    rename(source, target, options) {
        try {
            assert_1.strict.equal(source.fileSystem, target.fileSystem, (0, i18n_1.i) `Cannot rename files across filesystems`);
            return (0, promises_1.rename)(source.fsPath, target.fsPath);
        }
        finally {
            this.renamed(source, { target, options });
        }
    }
    async copy(source, target, options) {
        const { type } = await source.stat();
        const opts = (options || {});
        const overwrite = opts.overwrite ? 0 : constants_1.COPYFILE_EXCL;
        if (type & filesystem_1.FileType.File) {
            // make sure the target folder is there
            await target.parent.createDirectory();
            await (0, promises_1.copyFile)(source.fsPath, target.fsPath, overwrite);
            return 1;
        }
        assert_1.strict.ok(type & filesystem_1.FileType.Directory, 'Unknown file type should never happen during copy');
        let targetIsFile = false;
        try {
            targetIsFile = !!((await target.stat()).type & filesystem_1.FileType.File);
        }
        catch {
            // not a file
        }
        // if it's a folder, then the target has to be a folder, or not exist
        if (targetIsFile) {
            throw new exceptions_1.TargetFileCollision(target, (0, i18n_1.i) `Copy failed: source (${source.fsPath}) is a folder, target (${target.fsPath}) is a file`);
        }
        // make sure the target folder exists
        await target.createDirectory();
        // only the initial call gets to wait for everybody to finish.
        let queue;
        // track the count, starting at the base folder.
        if (opts.queue === undefined) {
            queue = opts.queue = new promise_1.Queue();
        }
        // loop thru the contents of this folder
        for (const [sourceUri, fileType] of await source.readDirectory()) {
            const targetUri = target.join((0, path_1.basename)(sourceUri.path));
            if (fileType & filesystem_1.FileType.Directory) {
                await this.copy(sourceUri, targetUri, opts);
                continue;
            }
            // queue up the copy file
            void opts.queue.enqueue(() => (0, promises_1.copyFile)(sourceUri.fsPath, targetUri.fsPath, overwrite));
        }
        return queue ? queue.done : -1 /* innerloop */;
    }
    async readStream(uri, options) {
        this.read(uri);
        return (0, fs_1.createReadStream)(uri.fsPath, options);
    }
    async writeStream(uri, options) {
        this.write(uri);
        const flags = options?.append ? 'a' : 'w';
        const createWriteOptions = { flags, mode: options?.mode, autoClose: true, emitClose: true };
        if (options?.mtime) {
            const mtime = options.mtime;
            // inject futimes call as part of close
            createWriteOptions.fs = {
                open: fs_1.open,
                write: fs_1.write,
                writev: fs_1.writev,
                close: (fd, callback) => {
                    (0, fs_1.futimes)(fd, new Date(), mtime, (futimesErr) => {
                        (0, fs_1.close)(fd, (closeErr) => {
                            callback(futimesErr || closeErr);
                        });
                    });
                }
            };
        }
        return (0, fs_1.createWriteStream)(uri.fsPath, createWriteOptions);
    }
    async openFile(uri) {
        return new LocalReadHandle(await (0, promises_1.open)(uri.fsPath, 'r'));
    }
}
exports.LocalFileSystem = LocalFileSystem;
class LocalReadHandle extends filesystem_1.ReadHandle {
    handle;
    constructor(handle) {
        super();
        this.handle = handle;
    }
    read(buffer, offset = 0, length = buffer.byteLength, position = null) {
        return this.handle.read(buffer, offset, length, position);
    }
    async size() {
        const stat = await this.handle.stat();
        return stat.size;
    }
    async close() {
        return this.handle.close();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWwtZmlsZXN5c3RlbS5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJmcy9sb2NhbC1maWxlc3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1Q0FBdUM7QUFDdkMsa0NBQWtDOzs7QUFFbEMsbUNBQWdDO0FBQ2hDLHlDQUEwQztBQUMxQywyQkFBdUo7QUFDdkosMENBQXlIO0FBQ3pILCtCQUFzQztBQUV0QyxrQ0FBNEI7QUFDNUIsbURBQXlEO0FBQ3pELDZDQUF3QztBQUV4Qyw2Q0FBOEY7QUFFOUYsU0FBUyxXQUFXLENBQUMsS0FBWTtJQUMvQixPQUFPLHFCQUFRLENBQUMsT0FBTztRQUNyQixDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFFRCxNQUFNLGNBQWM7SUFDRTtJQUFwQixZQUFvQixLQUFZO1FBQVosVUFBSyxHQUFMLEtBQUssQ0FBTztRQUM5QixlQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFBLFFBQUMsRUFBQSw0QkFBNEIsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFDRCxJQUFJLElBQUk7UUFDTixPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUNELElBQUksS0FBSztRQUNQ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
// SIG // Begin signature block
// SIG // MIIoKwYJKoZIhvcNAQcCoIIoHDCCKBgCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // +qKEgQEMw58kplKE5qSbWhXYSj/xUSc++bPJxE2T7Hyg
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
// SIG // DQEJBDEiBCAo2/kEUuteNeq4v9MYTTOdHpXAzIL2ilMY
// SIG // 8Puz8PkMbTBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAB+c+oKN
// SIG // Kmpw1f+Fcii+NfPehxGH1vxHCLoPGOvcC55JbO5CoHMO
// SIG // FG9zlS7+HyxGvKhtdYR5+ubLDnE17qyikAGa0pdmeWwd
// SIG // lYosICsxmJkrh5LyDSgAG7fnGPH2368EvcKGSUVE+HlZ
// SIG // FO91plqhS1vpXfIVa2XEwo6ZvG4AsVkl9v8qrBoWneUn
// SIG // PEJkuhc6B5HaJVdOQn9TlCalU7WTz+P/DEjkGkeImA+t
// SIG // QqeDm0LFPL1n8pKFcKCBvOb/IpfeoAGe96SHkERM1AAo
// SIG // e4UbntAQs9r6tNmUorxf9fu/UDnh6mgoZf0HOdMzAecJ
// SIG // ByijhVfWyWl5Tr7PqqYKs8o9P3yhgheXMIIXkwYKKwYB
// SIG // BAGCNwMDATGCF4Mwghd/BgkqhkiG9w0BBwKgghdwMIIX
// SIG // bAIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZIhvcN
// SIG // AQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgvdMdwsP90TNUixMQJGeU
// SIG // MDbvrS+P4vYzznNGnNvt/vgCBmdSJ9wOqxgTMjAyNDEy
// SIG // MDkyMTAzMzQuNTkzWjAEgAIB9KCB0aSBzjCByzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0
// SIG // IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNo
// SIG // aWVsZCBUU1MgRVNOOkYwMDItMDVFMC1EOTQ3MSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oIIR7TCCByAwggUIoAMCAQICEzMAAAHyPjLXZKxwkZQA
// SIG // AQAAAfIwDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTAwHhcNMjMxMjA2MTg0NTU4WhcN
// SIG // MjUwMzA1MTg0NTU4WjCByzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3Bl
// SIG // cmF0aW9uczEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNO
// SIG // OkYwMDItMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAg8AMIICCgKCAgEAvOXzyxcKaWIMcGMZ
// SIG // EhHmL0AbZ2CU7Sio9hSscx8dH4Fel4CCK5glpqSpfSDs
// SIG // 7znyf5Ooj9EZ6EaORfPQHdvXncxnZVmwo9UMseR1BzWP
// SIG // MrvRJSTpnYHrjb0yuEVuMLvYgef89kngrmKsl/7/M+j6
// SIG // b9vYdbbTVrEnPyjznroc0gF6pANuuQUhU+ZMpMb8wdC8
// SIG // aMUuqFqF1iusMde9jUSUWHCDX1w4VEb1Hw+9I4qBPdq1
// SIG // vzoI3DisWZH0MS5cGhUq0pxrO14TK6fU7FIJsLMnExDg
// SIG // XRlZn9Rwg+1jms+RBHEMiEtgaUWGMLDzGwet7h4idefK
// SIG // jYdUiV7qC+cBg7v22VMzfgc3C4/eosQu8CRkDAYsVh/X
// SIG // fvlfG5ddEWHVw2ZZY0QL0uohcDc62obuA62G+2/DO778
// SIG // IRC9MQjr2+1hTLLLbHF35HROYPjUmnKYYBX3KH7UOajw
// SIG // 9jzVZqxt/A5hw6GIYI/bqjyz+756F3+4+vi1vFaJ9efA
// SIG // 9Fq5pOwrprnEE4h0cnqRGlQ55wNhpIiaHof6930oS+gh
// SIG // 4D6Ewe6GFP3eiTp3EYqA2KqkX1dsJaSlTvG/lWBy/IZ9
// SIG // dSURceqevZi/AUbUmenRvxhRFRPn1ZoMWHyAlK6YIckJ
// SIG // REyTyExAUteSLGlLltBr15S0qHxn9reQwKA5Ligmwvt1
// SIG // XT5pWFUCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBSVW4cA
// SIG // JurQMQTOXB/AYNPmOuKGeTAfBgNVHSMEGDAWgBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQ
// SIG // hk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
// SIG // JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwG
// SIG // CCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUt
// SIG // U3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMB
// SIG // Af8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4G
// SIG // A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // PUunjuB7HwdNF6ToD2m3Dd0GXsoqYIpXEEg2fIOlQr/R
// SIG // VR83UqvV6QLJY2UijVkgpYSRM+TqN1Jv7Wj56GxfvApA
// SIG // HZHC0IS3ZEoX6/dZM8vbwz6zppQgNhUPY1YRWmrdkDN9
// SIG // 89afhgj+bbr4qxWlFs1FlQxTqaPzucw6c6D2LU69HBYN
// SIG // 7l2kS0+eFEN2OLj2F6p+sLp2bVEETIiTM8aVJb3X1hlL
// SIG // Qr51t3gwYpA5IsdVxPfFXGCM9vuX3XL6x1XlGqxl8uC0
// SIG // bcM5sKbArVIe7UesIQq1WJG+hbnQXVjO01b44u6RoH43
// SIG // rIJwEmg/woS7seujxsGiGhfsS85NGzcbAI9LoXekHVq+
// SIG // k09/Zv0jWdf1F1O5MxKHdLwGN5iJ/F+QOCPvf3tZwTaV
// SIG // ESemIgykHeWFYMbLmQlr+EMG9Jl4RyHvQrm30qmY7w2s
// SIG // H9iNtvTdy7LQyVEq9bxhQfIkOVvGSzOT8E/L7bChAcBx
// SIG // GJsLLlprMZIpiBeQUG0s4PcM9Tuo3Vk8RhtDlLdXF1jj
// SIG // CVCc8hB+FkimRzsed6nALw/YdFOoxBdn7gY7Sf0A61m2
// SIG // +Lq7wH676jZ/ZR+4FT6ZajTwyL0PA5Gd5b20LGKpc+te
// SIG // 3u+oGu0mNMO9fkD9euQj3c1GN+nrdkpuKb7KRCvIZZat
// SIG // yGHMl9L/Pe/l/WHnnDNT29YwggdxMIIFWaADAgECAhMz
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
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjpGMDAyLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAa4veN3BSx9k3
// SIG // 0BHwdOUiyAoO+AiggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOsB
// SIG // Q2kwIhgPMjAyNDEyMDkxMDIyMzNaGA8yMDI0MTIxMDEw
// SIG // MjIzM1owdzA9BgorBgEEAYRZCgQBMS8wLTAKAgUA6wFD
// SIG // aQIBADAKAgEAAgIb5wIB/zAHAgEAAgITcDAKAgUA6wKU
// SIG // 6QIBADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZ
// SIG // CgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqG
// SIG // SIb3DQEBCwUAA4IBAQB1xgkX78dOSWLF54XVGrBAzE44
// SIG // 9hzqs0TFQ3Lf/QeY7jCwkVM1J4AhxyO0x7hqaOFHkXfz
// SIG // AEccwPIKhYJ1xE7/J+QXj/CnjQYEDZDMnT5otappHcCb
// SIG // RR5MPNshYP1DZtxNOOKAfEpspCQ7HPR3OShiH715wLrR
// SIG // hraBBrFpOWNAnGPkF+8nzxyggs5Zeeofw7+ieNaoXarU
// SIG // AYJADBVkj5ol4sTsn7QbJlOvBR6YxIYqczZ2XeOx7K+B
// SIG // THkHtPoNj53jTe71X63Rc64zjQNj4+sHbMzFcydcJPWI
// SIG // B/BoZIzj11z2juKK2LgabKpZ9Xj7zU6Fw3mr6hNIJWhg
// SIG // mcL3JCtzMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTACEzMAAAHyPjLXZKxwkZQAAQAA
// SIG // AfIwDQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJ
// SIG // AzENBgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQg
// SIG // OojBiHqsYhCEQzm6bNs1Yr8qv606Cbsdh5CXQPH/rNEw
// SIG // gfoGCyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCD42j4d
// SIG // LjFSXNOPmOEbuQVFGxxOLLmep0R0lLtF10pDRDCBmDCB
// SIG // gKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMT
// SIG // HU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMz
// SIG // AAAB8j4y12SscJGUAAEAAAHyMCIEIIRgj9ogKiylvCGz
// SIG // ASPmuKTVCmNh/KEWFfOCsleXbREvMA0GCSqGSIb3DQEB
// SIG // CwUABIICAKOA8swqGC6m0NxtuMLJZsipbuAKwCo8G2p/
// SIG // EFwJhuXqUm1DdoWDKEJO/QvGqhS3r4mpJ5xMPf0RZqQO
// SIG // TpPzwwTWaxPKV18lXMIvJyqweMai0Of6Dn5uaSJ+7i+A
// SIG // WsuMq1C6e9fIaWtcnhHBrGeQNcdhQiN6dU4u8LcKWpzN
// SIG // /8T12dGO319meRSTyI/ipVj/XSQUoWAyR3D12QjLnixS
// SIG // 9wLy5eZo3MfH5lEc2/kkXwlIr5K59JOHmV0ePrtD5Fvh
// SIG // 71gD0UPqQFdaHjIBjUyhUdNRuXjMX63gnd1ThaPJ+DXr
// SIG // yIegvauO9R0RNj/JOZGazHQxAKDAFwd1jH0D2dE7/ymt
// SIG // uYSxAJXDF6fq+LarIh7YIstbXWv+/qD7Man9Z886E+0l
// SIG // OnCn58y41y+D08A2v4V7yqAyzBPozeE3Z3XXc1x2yzNg
// SIG // halsqXv+ZBuZvb5/4EDLYztWV+AutUQhIgghF9yGENiA
// SIG // +2wRYRcg0E70+6i9/g4jJU4HHOiF1tCyf3XGVEyXF7EI
// SIG // Yl7wCHpL91snOkaseqWk8FxL/L3SrEK06AcOORzj65iq
// SIG // W2y1suSFAUOK/0dIyYREqptkILiVwiRRSF2f/2pHzKhg
// SIG // KKW59N7ZlAU7kFDY41RaXBrRtaAUEwTg+Ki4HgTRCERc
// SIG // qoQe4AWY7LYhsRkqEXknNAb4TlwePMZY
// SIG // End signature block
