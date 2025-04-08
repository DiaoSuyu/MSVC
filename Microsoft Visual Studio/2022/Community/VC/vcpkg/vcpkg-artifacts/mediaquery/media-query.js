"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeWhitespace = exports.parseQuery = void 0;
const i18n_1 = require("../i18n");
const scanner_1 = require("./scanner");
function parseQuery(text) {
    const cursor = new scanner_1.Scanner(text);
    return QueryList.parse(cursor);
}
exports.parseQuery = parseQuery;
function takeWhitespace(cursor) {
    while (!cursor.eof && isWhiteSpace(cursor)) {
        cursor.take();
    }
}
exports.takeWhitespace = takeWhitespace;
function isWhiteSpace(cursor) {
    return cursor.kind === scanner_1.Kind.Whitespace;
}
class QueryList {
    queries = new Array();
    get isValid() {
        return !this.error;
    }
    error;
    constructor() {
        //
    }
    get length() {
        return this.queries.length;
    }
    static parse(cursor) {
        const result = new QueryList();
        try {
            cursor.scan(); // start the scanner
            for (const statement of QueryList.parseQuery(cursor)) {
                result.queries.push(statement);
            }
        }
        catch (error) {
            result.error = error;
        }
        return result;
    }
    static *parseQuery(cursor) {
        takeWhitespace(cursor);
        if (cursor.eof) {
            return;
        }
        yield Query.parse(cursor);
        takeWhitespace(cursor);
        if (cursor.eof) {
            return;
        }
        switch (cursor.kind) {
            case scanner_1.Kind.Comma:
                cursor.take();
                return yield* QueryList.parseQuery(cursor);
            case scanner_1.Kind.EndOfFile:
                return;
        }
        throw new scanner_1.MediaQueryError((0, i18n_1.i) `Expected comma, found ${JSON.stringify(cursor.text)}`, cursor.position.line, cursor.position.column);
    }
    get features() {
        const result = new Set();
        for (const query of this.queries) {
            for (const expression of query.expressions) {
                if (expression.feature) {
                    result.add(expression.feature);
                }
            }
        }
        return result;
    }
    match(properties) {
        if (this.isValid) {
            queries: for (const query of this.queries) {
                for (const { feature, constant, not } of query.expressions) {
                    // get the value from the context
                    const contextValue = stringValue(properties[feature]);
                    if (not) {
                        // negative/not present query
                        if (contextValue) {
                            // we have a value
                            if (constant && contextValue !== constant) {
                                continue; // the values are NOT a match.
                            }
                            if (!constant && contextValue === 'false') {
                                continue;
                            }
                        }
                        else {
                            // no value
                            if (!constant || contextValue === 'false') {
                                continue;
                            }
                        }
                    }
                    else {
                        // positive/present query
                        if (contextValue) {
                            if (contextValue === constant || contextValue !== 'false' && !constant) {
                                continue;
                            }
                        }
                        else {
                            if (constant === 'false') {
                                continue;
                            }
                        }
                    }
                    continue queries; // no match
                }
                // we matched a whole query, we're good
                return true;
            }
        }
        // no query matched.
        return false;
    }
}
function stringValue(value) {
    switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
            return value.toString();
        case 'object':
            return value === null ? 'true' : Array.isArray(value) ? stringValue(value[0]) || 'true' : 'true';
    }
    return undefined;
}
class Query {
    expressions;
    constructor(expressions) {
        this.expressions = expressions;
    }
    static parse(cursor) {
        const result = new Array();
        takeWhitespace(cursor);
        // eslint-disable-next-line no-constant-condition
        while (true) {
            result.push(Expression.parse(cursor));
            takeWhitespace(cursor);
            if (cursor.kind === scanner_1.Kind.AndKeyword) {
                cursor.take(); // consume and
                continue;
            }
            // the next token is not an 'and', so we bail now.
            return new Query(result);
        }
    }
}
class Expression {
    featureToken;
    constantToken;
    not;
    constructor(featureToken, constantToken, not) {
        this.featureToken = featureToken;
        this.constantToken = constantToken;
        this.not = not;
    }
    get feature() {
        return this.featureToken.text;
    }
    get constant() {
        return this.constantToken?.stringValue || this.constantToken?.text || undefined;
    }
    /** @internal */
    static parse(cursor, isNotted = false, inParen = false) {
        takeWhitespace(cursor);
        switch (cursor.kind) {
            case scanner_1.Kind.Identifier: {
                // start of an expression
                const feature = cursor.take();
                takeWhitespace(cursor);
                if (cursor.kind === scanner_1.Kind.Colon) {
                    cursor.take(); // consume colon;
                    // we have a constant for the
                    takeWhitespace(cursor);
                    switch (cursor.kind) {
                        case scanner_1.Kind.NumericLiteral:
                        case scanner_1.Kind.BooleanLiteral:
                        case scanner_1.Kind.Identifier:
                        case scanner_1.Kind.StringLiteral: {
                            // we have a good const value.
                            const constant = cursor.take();
                            return new Expression(feature, constant, isNotted);
                        }
                    }
                    throw new scanner_1.MediaQueryError((0, i18n_1.i) `Expected one of {Number, Boolean, Identifier, String}, found token ${JSON.stringify(cursor.text)}`, cursor.position.line, cursor.position.column);
                }
                return new Expression(feature, undefined, isNotted);
            }
            case scanner_1.Kind.NotKeyword:
                if (isNotted) {
                    throw new scanner_1.MediaQueryError((0, i18n_1.i) `Expression specified NOT twice`, cursor.position.line, cursor.position.column);
                }
                cursor.take(); // suck up the not token
                return Expression.parse(cursor, true, inParen);
            case scanner_1.Kind.OpenParen: {
                cursor.take();
                const result = Expression.parse(cursor, isNotted, inParen);
                takeWhitespace(cursor);
                if (cursor.kind !== scanner_1.Kind.CloseParen) {
                    throw new scanner_1.MediaQueryError((0, i18n_1.i) `Expected close parenthesis for expression, found ${JSON.stringify(cursor.text)}`, cursor.position.line, cursor.position.column);
                }
                cursor.take();
                return result;
            }
            default:
                throw new scanner_1.MediaQueryError((0, i18n_1.i) `Expected expression, found ${JSON.stringify(cursor.text)}`, cursor.position.line, cursor.position.column);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtcXVlcnkuanMiLCJzb3VyY2VSb290IjoiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL21pY3Jvc29mdC92Y3BrZy10b29sL21haW4vdmNwa2ctYXJ0aWZhY3RzLyIsInNvdXJjZXMiOlsibWVkaWFxdWVyeS9tZWRpYS1xdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdUNBQXVDO0FBQ3ZDLGtDQUFrQzs7O0FBRWxDLGtDQUE0QjtBQUM1Qix1Q0FBa0U7QUFFbEUsU0FBZ0IsVUFBVSxDQUFDLElBQVk7SUFDckMsTUFBTSxNQUFNLEdBQUcsSUFBSSxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRWpDLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBSkQsZ0NBSUM7QUFFRCxTQUFnQixjQUFjLENBQUMsTUFBZTtJQUM1QyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDMUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ2Y7QUFDSCxDQUFDO0FBSkQsd0NBSUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxNQUFlO0lBQ25DLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxjQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3pDLENBQUM7QUFFRCxNQUFNLFNBQVM7SUFDYixPQUFPLEdBQUcsSUFBSSxLQUFLLEVBQVMsQ0FBQztJQUM3QixJQUFJLE9BQU87UUFDVCxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBQ0QsS0FBSyxDQUFtQjtJQUV4QjtRQUNFLEVBQUU7SUFDSixDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUM3QixDQUFDO0lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFlO1FBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUks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
// SIG // Begin signature block
// SIG // MIIoKAYJKoZIhvcNAQcCoIIoGTCCKBUCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // 7RIMqzBtVDBEEi9YmLtEo56ksmObt6DU0kuRGINTtyGg
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
// SIG // DQEJBDEiBCDmh8BJmRSWuXmzyvLv+UzVmm8FqDEZX4VN
// SIG // /rL8EAFfczBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAGEvJx0a
// SIG // rd/tLmC9blcnSO6+GtzwkoS8j8PMtGR1UjCXZpdHydKO
// SIG // aD6d/IoqKt0r/iKGp0cjmRLeWAbE3sr6Bf8MPlPjdKkG
// SIG // J0wGnk1Y0c2Qndwc+OUdZOzAR5k9JvjyUFq+eOx8T10N
// SIG // VO5v8m5CRN2kcJO+1OyVaxfh7v225Qvxk8BvIOm8xbU4
// SIG // JRzqztt8XLRF6kYiAz7GwkoCrw5ML9EgqbX4RfwGxZmj
// SIG // FRitPH4ZJVlkB7hbQdOBLdkUzbGGJk+qgTetkNrx56J8
// SIG // Q/MSvO1WJ3X7SLfQVuglwQDZy3rmHOWO4uxX3qZKCnlG
// SIG // f/LEMdZZAmv7dWpy9Ns2FaQyjwahgheUMIIXkAYKKwYB
// SIG // BAGCNwMDATGCF4Awghd8BgkqhkiG9w0BBwKgghdtMIIX
// SIG // aQIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZIhvcN
// SIG // AQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgIGZ+6oC/7PyU/vVXTxvT
// SIG // gBMDs44X/ksG06FAevkAjHECBmc/F3RkOhgTMjAyNDEy
// SIG // MDkyMTAzMzEuOTAyWjAEgAIB9KCB0aSBzjCByzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0
// SIG // IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNo
// SIG // aWVsZCBUU1MgRVNOOkE0MDAtMDVFMC1EOTQ3MSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oIIR6jCCByAwggUIoAMCAQICEzMAAAHs4CukgtCRUoAA
// SIG // AQAAAewwDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTAwHhcNMjMxMjA2MTg0NTM4WhcN
// SIG // MjUwMzA1MTg0NTM4WjCByzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3Bl
// SIG // cmF0aW9uczEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNO
// SIG // OkE0MDAtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAg8AMIICCgKCAgEAsEf0bgk24MVFlZv1
// SIG // XbpdtrsHRGZtCKABbOqCK9/VSvyLT/NHJ/vE5rT+u4mm
// SIG // weA5gCifRh+nSRoRDyaWOL0ykUjsK0TcVSCqDz3lBd3+
// SIG // FchxHKP7tUFGnZcA9d9jbmQsW54ejItpSxu6Q77M2ajB
// SIG // u0tzAotm5Np77RinXgCC/h++4C+K9NU0lm+67BNiW9T/
// SIG // zemP1tQqg4tfyG9/80all7eM8b3SBnD40uGSskBBd0hG
// SIG // QKuFyI4sqMDx2qjW2cXX9pFjv2o3X01PObfd+AlwIp29
// SIG // KPrkPSrWijS1VXDX+UKUuH+vzLFzryBbgmDEXSg46Zr6
// SIG // MAHi/tY9u2wsQgaQ0B61pHz82af1/m7fQuxOYTz+h1Ua
// SIG // KgWEe7tYFH+RhKvua9RwNI2o59EOjr32HJBNB3Tr+ilm
// SIG // vrAJiRuzw702Wnu+4aJs8eiD6oIFaTWbgpO/Un1Zpyrv
// SIG // RefFAJ1OfE6gxxMxrEJzFECrLUt845+klNDSxBTQnrZb
// SIG // mipKlg0VSxFm7t9vSBId7alz138ukYf8Am8HvUgiSKKr
// SIG // QXsQaz8kGANl2s9XyvcrE7MdJAPVdScFVeOCGvXPjMLQ
// SIG // EerKinQIEaP27P17vILmvCw3uilsrve+HvZhlu2TvJ2q
// SIG // wxawE9RFxhw7nsoEir79iu8AfJQIDBiY+9wkL6/o6qFs
// SIG // Mel3cnkCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBT0WtBH
// SIG // ZP4r9cIWELFfFIBH+EyFhjAfBgNVHSMEGDAWgBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQ
// SIG // hk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
// SIG // JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwG
// SIG // CCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUt
// SIG // U3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMB
// SIG // Af8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4G
// SIG // A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // krzEpDEq745Qz2oPAEW9DhawELUizA6TdFGNxY7z4cBi
// SIG // g664sZp7jH465lY0atbvCIZA7xhf2332xU6/iAJw0noP
// SIG // Ewfc3xv+Mm5J7qKZJW3ho27ezC8aX4aJQhEchHNtDzGS
// SIG // ic/Ur837jtZ+ca6yzi/JtJ5r+ZAXL/stQFyeUHC4nJoX
// SIG // tiKd/w+uxHeqD6kCNN5g42GktTUIQTbbue8Dyl2dRKDU
// SIG // 6AZPGwOvN/cNdfW/mvVk6KiLJHURqD+cYwyL/pnNLwR4
// SIG // WRpCVb3yIZuAKfM6bQu8VQJctI3jr+XVBjAmIGY76E5o
// SIG // HeOW6gMLp3Zj5Rrq+3pXlmHnS0H+7Ny+fqn2mP8RIf/b
// SIG // qNe0pzP4B1UhgM7563hoTqwdi7XSqFUnuS22KYoV3LQ3
// SIG // u+omLS/pocVzxKc3Wt2yZYT0zkNyjhGQKVREQaOcpbVo
// SIG // zwlpV8cgqZeY4/Z2NJ33dO9W3pp6LvAN61Ga3YCiGrrb
// SIG // B+0hzojnm2RqjbvuttrybWt3gGLAgGsQHAfQYiT5Wu12
// SIG // nfaq02HU+OVZQmE7QUmOKFUbHnUgA7/fY7/4mCABstWw
// SIG // srbmtKP0Kr/Xqyps0Ak1TF2g3NuQ0y3DBia0bmtytMYr
// SIG // 3bZ6AXsc1Sa+sl6jPgWtsISFUbxnK4gZCl9BSRXlu69v
// SIG // V1/pNHuA5xuogRykI3nOlTcwggdxMIIFWaADAgECAhMz
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
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjpBNDAwLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAjhz7YFXc/RFt
// SIG // IjzS/wV6iaKlTH+ggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOsB
// SIG // T6cwIhgPMjAyNDEyMDkxMTE0NDdaGA8yMDI0MTIxMDEx
// SIG // MTQ0N1owdDA6BgorBgEEAYRZCgQBMSwwKjAKAgUA6wFP
// SIG // pwIBADAHAgEAAgIG9zAHAgEAAgISWTAKAgUA6wKhJwIB
// SIG // ADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMC
// SIG // oAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3
// SIG // DQEBCwUAA4IBAQBOlFS2AB5qaGZvV0WYQngzxwIJwofk
// SIG // oNpu3mgdnEne6liA/lGS94+7WfZo31o4SlKtJRmv/bhs
// SIG // CB7S6jLZovzxvBM6g0TfU5IfjmVl9p+yYDWoY8xQs7G2
// SIG // HfQKxOesYtuhpy4z15motGOxj9nuA3vpPdgOmOrL4f/y
// SIG // cDYHRA/g4sNdWgAXXSqDpMaNVijuZLkw3be8CXpv0c9T
// SIG // ICeYqE0/hkVeIC6UV2CnrkK6t3EXa19P7P+/wuHhV64F
// SIG // dYYH8o9noSXXZTzPOSm2daYkYdCUESGerGyEeLQGuH8E
// SIG // Vq7x8PT/xDSNx8hsNaLKTDenOd6tWp75Q2Zq0xbBBkWK
// SIG // CvllMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTACEzMAAAHs4CukgtCRUoAAAQAAAeww
// SIG // DQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzEN
// SIG // BgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQgkcHa
// SIG // /nPzOv1fESljhgqeIqDNGbZ5um2VSLtccZRuXUEwgfoG
// SIG // CyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCAnCeb1an03
// SIG // yIcdtUAQWysqP8XIkCF2qDFlC3owBNUKgzCBmDCBgKR+
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB
// SIG // 7OArpILQkVKAAAEAAAHsMCIEIIKmL3NSpf7k0h45+nSS
// SIG // g1q2IHM7dDbpxffZgkrZLDkjMA0GCSqGSIb3DQEBCwUA
// SIG // BIICAKXC2HudKXTaYS8Og9eaFkgn6nZycl+b4ywahGh4
// SIG // Jd7CBr3JLTZpQar/3JtD+M3sD4uniqHnyHxH3i/oOW6/
// SIG // LKFRg2rFlSvxETzvYdWrmRdUFL0CbQdqW+2HEi0FpRnA
// SIG // 8WHi2VzpbWl3VFBvZfzmbavGCiIKIyiHG5IYBfiqGt6K
// SIG // Tbjeh1y5oJmAxr43Slqp4L3zKmvoOVnNMGmJlns2Cum0
// SIG // 3ckJ4yEk/RTyRmbhiYAe45OcQiIuNv3f4ddKZH8Sx6hr
// SIG // v+VYHHVkIeAiD1hTqQoA1b9fY+V0IQvi5fo0q2H09Yk+
// SIG // oeCLMhg7wE5ibwDmZe4DSPt9RgyVm1cwFqupRUA23lg1
// SIG // 8aBQeOEp22b1moT1vB8qrrkW/IBjBe54hYtFx286jo2J
// SIG // JDWSurPo37NhYZkqsWAgDMQM+9j8By1mMDs8zHKiOrZz
// SIG // J/VRnH5kLj4pxdgIDtVLocJUENKR2T6uBlGVVesGcYrU
// SIG // nANndUQGT0nkb69rY6XHPafNP8/fwHhf1sBii/LLVVYQ
// SIG // UBtxAaSS1qgSr/5VJhRd94kh0hIvnpz6A0MUxNi2foTu
// SIG // zou7kXAvrpFH2X2DzroGLMwLgTAMch80Ex8NbED0PtFp
// SIG // VpHBPAYxLTfG94mZhigfK0NGwXsccvQwne44VYsX/zeD
// SIG // ebkRl1wIStfbk8QIG5HxVdfzFiBP
// SIG // End signature block
