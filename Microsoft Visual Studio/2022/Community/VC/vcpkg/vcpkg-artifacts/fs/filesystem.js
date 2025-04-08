"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystem = exports.ReadHandle = exports.FileType = void 0;
/* eslint-disable @typescript-eslint/ban-types */
const node_events_1 = require("node:events");
const stream_1 = require("stream");
const uri_1 = require("../util/uri");
const size64K = 1 << 16;
const size32K = 1 << 15;
/**
* Enumeration of file types. The types `File` and `Directory` can also be
* a symbolic links, in that case use `FileType.File | FileType.SymbolicLink` and
* `FileType.Directory | FileType.SymbolicLink`.
*/
var FileType;
(function (FileType) {
    /**
     * The file type is unknown.
     */
    FileType[FileType["Unknown"] = 0] = "Unknown";
    /**
     * A regular file.
     */
    FileType[FileType["File"] = 1] = "File";
    /**
     * A directory.
     */
    FileType[FileType["Directory"] = 2] = "Directory";
    /**
     * A symbolic link to a file.
     */
    FileType[FileType["SymbolicLink"] = 64] = "SymbolicLink";
})(FileType = exports.FileType || (exports.FileType = {}));
/**
 * A random-access reading interface to access a file in a FileSystem.
 *
 * Ideally, we keep reads in a file to a forward order, so that this can be implemented on filesystems
 * that do not support random access (ie, please do your best to order reads so that they go forward only as much as possible)
 *
 * Underneath on FSes that do not support random access, this would likely require multiple 'open' operation for the same
 * target file.
 */
class ReadHandle {
    async readComplete(buffr, offset = 0, length = buffr.byteLength, position = null, totalRead = 0) {
        const { bytesRead, buffer } = await this.read(buffr, offset, length, position);
        if (length) {
            if (bytesRead && bytesRead < length) {
                return await this.readComplete(buffr, offset + bytesRead, length - bytesRead, position ? position + bytesRead : null, bytesRead + totalRead);
            }
        }
        return { bytesRead: bytesRead + totalRead, buffer };
    }
    /**
     * Returns a Readable for consuming an opened ReadHandle
     * @param start the first byte to read of the target
     * @param end the last byte to read of the target (inclusive!)
     */
    readStream(start = 0, end = Infinity) {
        return stream_1.Readable.from(asyncIterableOverHandle(start, end, this), {});
    }
    range(start, length) {
        return new RangeReadHandle(this, start, length);
    }
}
exports.ReadHandle = ReadHandle;
class RangeReadHandle extends ReadHandle {
    start;
    length;
    pos = 0;
    readHandle;
    constructor(readHandle, start, length) {
        super();
        this.start = start;
        this.length = length;
        this.readHandle = readHandle;
    }
    async read(buffer, offset, length, position) {
        if (this.readHandle) {
            position = position !== undefined && position !== null ? (position + this.start) : (this.pos + this.start);
            length = length === null ? this.length : length;
            const result = await this.readHandle.read(buffer, offset, length, position);
            this.pos += result.bytesRead;
            return result;
        }
        return {
            bytesRead: 0, buffer
        };
    }
    async size() {
        return this.length;
    }
    async close() {
        this.readHandle = undefined;
    }
}
/**
 * Picks a reasonable buffer size. Not more than 64k
 *
 * @param length
 */
function reasonableBuffer(length) {
    return Buffer.alloc(length > size64K ? size32K : length);
}
/**
 * Creates an AsyncIterable<Buffer> over a ReadHandle
 * @param start the first byte in the target read from
 * @param end the last byte in the target to read from
 * @param handle the ReadHandle
 */
async function* asyncIterableOverHandle(start, end, handle) {
    while (start < end) {
        // buffer alloc must be inside the loop; zlib will hold the buffers until it can deal with a whole stream.
        const buffer = reasonableBuffer(1 + end - start);
        const count = Math.min(1 + end - start, buffer.byteLength);
        const b = await handle.read(buffer, 0, count, start);
        if (b.bytesRead === 0) {
            return;
        }
        start += b.bytesRead;
        // return only what was actually read. (just a view)
        if (b.bytesRead === buffer.byteLength) {
            yield buffer;
        }
        else {
            yield buffer.slice(0, b.bytesRead);
        }
    }
}
class FileSystem extends node_events_1.EventEmitter {
    session;
    baseUri;
    /**
   * Creates a new URI from a file system path, e.g. `c:\my\files`,
   * `/usr/home`, or `\\server\share\some\path`.
   *
   * associates this FileSystem with the Uri
   *
   * @param path A file system path (see `URI#fsPath`)
   */
    file(path) {
        return uri_1.Uri.file(this, path);
    }
    /** construct an Uri from the various parts */
    from(components) {
        return uri_1.Uri.from(this, components);
    }
    /**
   * Creates a new URI from a string, e.g. `https://www.msft.com/some/path`,
   * `file:///usr/home`, or `scheme:with/path`.
   *
   * @param value A string which represents an URI (see `URI#toString`).
   */
    parseUri(value, _strict) {
        return uri_1.Uri.parse(this, value, _strict);
    }
    /** checks to see if the target exists */
    async exists(uri) {
        try {
            return !!(await this.stat(uri));
        }
        catch (e) {
            // if this fails, we're assuming false
        }
        return false;
    }
    /** checks to see if the target is a directory/folder */
    async isDirectory(uri) {
        try {
            return !!((await this.stat(uri)).type & FileType.Directory);
        }
        catch {
            // if this fails, we're assuming false
        }
        return false;
    }
    /** checks to see if the target is a file */
    async isFile(uri) {
        try {
            const s = await this.stat(uri);
            return !!(s.type & FileType.File);
        }
        catch {
            // if this fails, we're assuming false
        }
        return false;
    }
    /** checks to see if the target is a symbolic link */
    async isSymlink(uri) {
        try {
            return !!((await this.stat(uri)) && FileType.SymbolicLink);
        }
        catch {
            // if this fails, we're assuming false
        }
        return false;
    }
    constructor(session) {
        super();
        this.session = session;
    }
    /** EventEmitter for when files are read */
    read(path, context) {
        this.emit('read', path, context, this.session.stopwatch.total);
    }
    /** EventEmitter for when files are written */
    write(path, context) {
        this.emit('write', path, context, this.session.stopwatch.total);
    }
    /** EventEmitter for when files are deleted */
    deleted(path, context) {
        this.emit('deleted', path, context, this.session.stopwatch.total);
    }
    /** EventEmitter for when files are renamed */
    renamed(path, context) {
        this.emit('renamed', path, context, this.session.stopwatch.total);
    }
    /** EventEmitter for when directories are read */
    directoryRead(path, contents) {
        this.emit('directoryRead', path, contents, this.session.stopwatch.total);
    }
    /** EventEmitter for when direcotries are created */
    directoryCreated(path, context) {
        this.emit('directoryCreated', path, context, this.session.stopwatch.total);
    }
}
exports.FileSystem = FileSystem;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXN5c3RlbS5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJmcy9maWxlc3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1Q0FBdUM7QUFDdkMsa0NBQWtDOzs7QUFFbEMsaURBQWlEO0FBRWpELDZDQUEyQztBQUMzQyxtQ0FBNEM7QUFFNUMscUNBQWtDO0FBRWxDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDeEIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQXVDeEI7Ozs7RUFJRTtBQUNGLElBQVksUUFpQlg7QUFqQkQsV0FBWSxRQUFRO0lBQ2xCOztPQUVHO0lBQ0gsNkNBQVcsQ0FBQTtJQUNYOztPQUVHO0lBQ0gsdUNBQVEsQ0FBQTtJQUNSOztPQUVHO0lBQ0gsaURBQWEsQ0FBQTtJQUNiOztPQUVHO0lBQ0gsd0RBQWlCLENBQUE7QUFDbkIsQ0FBQyxFQWpCVyxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQWlCbkI7QUFRRDs7Ozs7Ozs7R0FRRztBQUNILE1BQXNCLFVBQVU7SUFXOUIsS0FBSyxDQUFDLFlBQVksQ0FBNkIsS0FBYyxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLEtBQUssQ0FBQyxVQUFVLEVBQUUsV0FBMEIsSUFBSSxFQUFFLFNBQVMsR0FBRyxDQUFDO1FBQ2pKLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQy9FLElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBSSxTQUFTLElBQUksU0FBUyxHQUFHLE1BQU0sRUFBRTtnQkFDbkMsT0FBTyxNQUFNLElBQUksQ0FB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
// SIG // Begin signature block
// SIG // MIIoNwYJKoZIhvcNAQcCoIIoKDCCKCQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // nLkG9ta88s7AMrRh67jTSV5nCt9M+PUfGPBYuaVkQOmg
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
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCAH/Il6185HQp3x
// SIG // u/1GtVe4W1brTrdzv99Kmj0acxEDRDBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBADZ8yl9pDkyJgC/t7p8493PzJBicwon4
// SIG // abOzM/47hJeAMglmJOKswmzg2qOkLEZYTg4x35FBX0Wy
// SIG // DUgqDv/SNFFkL976UM0fzTVDqs+DoTEqq3acjOjCWv5m
// SIG // HYnXwpH3WpqFCMGlhzVeGF+li83sFAF64XaL/SKmASNv
// SIG // Clu5IEOH8rYonCG18AoBOXY7bKL1ppcDHVzBrXPbNpDo
// SIG // xzHVV49Vc6g8v5gUdXIw6D2N97TlJz+RfovfwglBo848
// SIG // i4n3caNDwJTptbs81buW1K+T6Nb/FREGxSI6PYMGIc1L
// SIG // zUlSbYGIczVicw1LCl+vW7bAF2yuGHRrG4pGEolziyf6
// SIG // 6WihgheUMIIXkAYKKwYBBAGCNwMDATGCF4Awghd8Bgkq
// SIG // hkiG9w0BBwKgghdtMIIXaQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // aitAwgcNvBKCaUfT6jqO1BD1pQ5FrlmjguIbWV0TDIkC
// SIG // Bmc/Oj3QXBgTMjAyNDEyMDkyMTAzMzQuNjY2WjAEgAIB
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
// SIG // hkiG9w0BCQQxIgQgDdKncQZC1gsFjiRWc7KLSFORLUWT
// SIG // /FglVFq1BBLDi6MwgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCCNLg1oNAhbHisStwNepdcKyMK7Eg612esU
// SIG // n9BeMWzKOTCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAAB7eFfy9X3pV1zAAEAAAHtMCIE
// SIG // IHxZjqZER+Oeak6Rhh+s7e6CTJGEuKzT+rLG1zxtHZdd
// SIG // MA0GCSqGSIb3DQEBCwUABIICAEeQDcZwFeqlIqRb5ra2
// SIG // 1kQ8aWu/vtP6hTq/zfbPxC0SWEoBo6eQrSrWBWSkSyf3
// SIG // bJ3hFnQkNMpiEyGOPMXqiKZQrLmvvD8XBsCC/BdDEy+f
// SIG // lzaHdMJSOujq+jmEibyGfZE2g46bXGiApI9TMMyLgJvB
// SIG // r/qAZJd6mk1s8huBrXClz2DY/nAjUqFHgB9WnRoE8IBE
// SIG // 6WiXwcVbsedhghPlIYb7mIFUN0bmgkSwxLJVZ1GAWT9e
// SIG // OfzBeabful+i9shzrXtIaaBa7TtMUajOZWKwcN7nFIKa
// SIG // Ys76/dETPbnd+p/48GLIF6P6eI4TlQdAG2hIhcwTLQuI
// SIG // NpujM1g5RBrYJE4kMmthhmhxfVXA2bOvBJWhFQ4VWk2A
// SIG // AaEeIasBlq8HVI8Sut/1syGRORlbJPxXyV+8socP6ydo
// SIG // txlfloxP6sgM/UnqsFr1b4s+JmYAM/Ik+eC6xcZUD9LS
// SIG // wBlaB/OvXAVclhAYO8GL4vX/pb3R/1gjApEWAnaMERcz
// SIG // hCsscoKNPCp8YhoBXZ9xo22zJ5Zl8E0+iX4kajmNY+h0
// SIG // XYCanLE7FMSWqvmU6c7xtYEgR9BMJ5bGOuUlQZ7PXLJ0
// SIG // OJN2Gof0SpF+g9hXoEyxKeR5aOBGlNdf7MkVXVMlx4Ry
// SIG // 7vfZlfnsLERmOQdFhbmXCC7ZI/viyIf4ekUSU8DXoptW
// SIG // 3Tqo
// SIG // End signature block
