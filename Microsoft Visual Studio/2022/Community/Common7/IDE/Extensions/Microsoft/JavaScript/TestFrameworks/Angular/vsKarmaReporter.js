﻿// @ts-check

const http = require('http');
const path = require('path');

const jasmineReporterPath = path.resolve(process.env.VSTESTADAPTERPATH, 'jasmineReporter.js');
const isDiscovery = process.env.ISDISCOVERY === 'true';
const project = JSON.parse(process.env.PROJECT);

const vsKarmaReporter = function (baseReporterDecorator, config, logger, emitter) {
    baseReporterDecorator(this);
    const log = logger.create('vsKarmaReporter');
    let testCaseCount = 0;

    process.on('message', () => {
        // We have recieved an indication that the test case has been processed. Decrement the amount
        testCaseCount--;
    });

    config.files.push({
        included: true,
        pattern: jasmineReporterPath,
        served: true,
        watched: false
    });

    this.onBrowserError = (browser, error) => {
        // TODO: Report error to user
        log.debug(`onBrowserError: ${JSON.stringify(error)}`);

        // If there's an error we want to clear the test cases so that we can finish the process.
        testCaseCount = 0;
    }

    // TODO: Is there a better option than onBrowserLog?
    // So far, since this is run by multiple out of proc, the only way I have found to communicate
    // is through the console, thus, the need for capturing the browser log. JasmineReporter uses 
    // console.log for this purpose.
    this.onBrowserLog = (browser, browserLog, type) => {
        const cleaned = browserLog.substring(1, browserLog.length - 1); // Remove extra quote at start and end
        const result = JSON.parse(cleaned);

        // If not discovering, ignore all excluded tests. Jasmine reports the test as excluded if it was not marked for execution.
        if (!isDiscovery && result.status === "excluded") {
            return;
        }

        // Increment the amount of test cases found.
        testCaseCount++;

        // rootPath will be the directory of angular.json plus the "root" configuration defined in it.
        const fullFilePath = path.join(project.rootPath, result.fileLocation.relativeFilePath);
        const suite = result.fullName.substring(0, result.fullName.length - result.description.length - 1);

        let errorLog = "";
        for (const failedExpectation of result.failedExpectations) {
            errorLog += `${failedExpectation.stack}\n`;
        }

        // Handles both scenarios, discovery and execution.
        process.send({
            // Discovery properties
            name: result.description,
            suite,
            filepath: fullFilePath,
            line: result.fileLocation.line,
            column: result.fileLocation.column,
            configDirPath: project.angularConfigDirPath,

            // Execution properties
            passed: result.status === "passed",
            pending: result.status === "disabled" || result.status === "pending",
            fullName: result.fullName,
            stderr: errorLog
        });

        log.debug(`onBrowserLog: ${JSON.stringify(result)}`);
    }

    this.onRunComplete = async (browsers, results) => {
        log.debug(`onRunComplete: ${JSON.stringify(results)}`);

        // Wait until we have processed all of the test cases.
        while (testCaseCount > 0) {
            await sleep(1000);
        }

        // We need to exit the process as angular keeps it running and to emit the 'exit' event.
        process.exit();
    }

    // Override specFailure to avoid crashing the process as Karma sends a string output that cannot be parsed as JSON.
    this.specFailure = () => {
        // no-op
    }

    let hasStarted = false;

    // Check when browser is ready to request a run.
    emitter.on("browsers_ready", () => {
        // There's a scenario that I'm not sure how to repro where the browser do something (refresh? crashes?)
        // and we get the event again. We only want to executed it once.
        if (!hasStarted) {
            hasStarted = true;

            // At least one test case should exists.
            runTestCase();
        }
    });

    function runTestCase(testCase) {
        const options = {
            hostname: 'localhost',
            path: '/run',
            port: 9876, // Default karma port.
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        };

        const request = http.request(options);
        request.end();
    }

    async function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}

vsKarmaReporter.$inject = ['baseReporterDecorator', 'config', 'logger', 'emitter'];

module.exports = {
    'reporter:vsKarmaReporter': ['type', vsKarmaReporter]
}
// SIG // Begin signature block
// SIG // MIIoKgYJKoZIhvcNAQcCoIIoGzCCKBcCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // JQSkYbPiHDPo80R3q/pgt1LrYELtTtXCGvGaYANfd+ag
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
// SIG // a/15n8G9bW1qyVJzEw16UM0xghoMMIIaCAIBATCBlTB+
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAE
// SIG // BGx0Bv9XKydyAAAAAAQEMA0GCWCGSAFlAwQCAQUAoIGu
// SIG // MBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwGCisG
// SIG // AQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3
// SIG // DQEJBDEiBCBgr3ceKYWJ+AO/AWbF5R7yhUv9b23hKwwR
// SIG // zt+J7MfnJDBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAJdySzNa
// SIG // 0Vhawk6+6UfKdMHKt7VTeimwMQajCmhikUbi3gC8yW5L
// SIG // EIbtt3xooAbryFcwc9m6pE+k6OZAbAIjBp68nLS9WbRQ
// SIG // 9RALeD9coUjqYI2T3vEOiiALg4K1QeWJNgf6+DEL3uEb
// SIG // gg1TST5B8zNF3aSQEgrcSRsUS2fsVKkpaGmRMBECd/iu
// SIG // dLjYvlOhfqMrOaUBGUUbmzHsgakxl0m4S3U/hVXKRc2J
// SIG // +UPRrwPjuJTh7Ktp0CVBrKpbRfHesX8v0HGhJKWZYTWy
// SIG // f14XYF1EGXyUB6uy0V6E+2byCGGvD69ryF7dxqQV8p5M
// SIG // lPrF6UcuPrp2uTmESZlZeHu8+f6hgheWMIIXkgYKKwYB
// SIG // BAGCNwMDATGCF4Iwghd+BgkqhkiG9w0BBwKgghdvMIIX
// SIG // awIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUQYLKoZIhvcN
// SIG // AQkQAQSgggFABIIBPDCCATgCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgllFQoATCR5e2hT3n+sjt
// SIG // pgzi/fHJ7s8OUdr0kJu37DwCBmdbDEjg+BgSMjAyNDEy
// SIG // MjQwOTE0MzIuOTdaMASAAgH0oIHRpIHOMIHLMQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQg
// SIG // QW1lcmljYSBPcGVyYXRpb25zMScwJQYDVQQLEx5uU2hp
// SIG // ZWxkIFRTUyBFU046MzMwMy0wNUUwLUQ5NDcxJTAjBgNV
// SIG // BAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2Wg
// SIG // ghHtMIIHIDCCBQigAwIBAgITMwAAAebZQp7qAPh94QAB
// SIG // AAAB5jANBgkqhkiG9w0BAQsFADB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDAeFw0yMzEyMDYxODQ1MTVaFw0y
// SIG // NTAzMDUxODQ1MTVaMIHLMQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSUwIwYDVQQLExxNaWNyb3NvZnQgQW1lcmljYSBPcGVy
// SIG // YXRpb25zMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046
// SIG // MzMwMy0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFNlcnZpY2UwggIiMA0GCSqGSIb3
// SIG // DQEBAQUAA4ICDwAwggIKAoICAQC9vph84tgluEzm/wpN
// SIG // KlAjcElGzflvKADZ1D+2d/ieYYEtF2HKMrKGFDOLpLWW
// SIG // G5DEyiKblYKrE2nt540OGu35Zx0gXJBE0zWanZEAjCjt
// SIG // 4eGBi+uakZsk70zHTQHHyfP+B3m2BSSNFPhgsVIPp6vo
// SIG // /9t6OeNezIwX5E5+VwEG37nZgEexQF2fQZYbxQ1AauqD
// SIG // vRdXsSpK1dh1UBt9EaMszuucaR5nMwQN6sDjG99FzdK9
// SIG // Atzbn4SmlsoLUtRAh/768sKd0Y1hMmKVHwIX8/4JuURU
// SIG // BRZ0JWu0NYQBp8khku18Q8CAQ500tFB7VH3pD8zoA4lc
// SIG // A7JkxTGoPKrufm+lRZAA4iMgbcLZ2P/xSdnKFxU8vL31
// SIG // RoNlZJiGL5MqTXvvyBLz+MRP4En9Nye1N8x/lJD1stdN
// SIG // o5wJG+mgXsE/zfzg2GaVqQczFHg0Nl8bpIqnNFUReQRq
// SIG // 3C1jVYMCScegNzHeYtw5OmZ/7eVnRmjXlCsLvdsxOzc1
// SIG // YVn6nZLkQD5y31HYrB9iIHuswhaMv2hJNNjVndkpWy93
// SIG // 4PIZuWTMk360kjXPFwl2Wv1Tzm9tOrCq8+l408KIL6J+
// SIG // efoGNkR8YB3M+u1tYeVDO/TcObGHxaGFB6QZxAUpnfB5
// SIG // N/MmBNxMOqzG1N8QiwW8gtjjMJiFBf6iYYrCjtRwF7IP
// SIG // dQLFtQIDAQABo4IBSTCCAUUwHQYDVR0OBBYEFOUEMXnt
// SIG // N54+11ZM+Qu7Q5rg3Fc9MB8GA1UdIwQYMBaAFJ+nFV0A
// SIG // XmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRYMFYwVKBSoFCG
// SIG // Tmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMv
// SIG // Y3JsL01pY3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0El
// SIG // MjAyMDEwKDEpLmNybDBsBggrBgEFBQcBAQRgMF4wXAYI
// SIG // KwYBBQUHMAKGUGh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0JTIwVGltZS1T
// SIG // dGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0MAwGA1UdEwEB
// SIG // /wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYD
// SIG // VR0PAQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4ICAQBh
// SIG // buogTapRsuwSkaFMQ6dyu8ZCYUpWQ8iIrbi40tU2hK6p
// SIG // Hgu0hj0z/9zFRRx5DfhukjvbjA/dS5VYfxz1EIbPlt89
// SIG // 7MJ2sBGO2YLYwYelfJpDwbB0XS9Zkrqpzq6X/lmDQDn3
// SIG // G5vcYpYQCJ55LLvyFlJ195AVo4Wy8UX5p7g9W3MgNHQM
// SIG // pM+EV64+cszj4Ho5aQmeKGtKy7w72eRY/vWDuptrvzru
// SIG // FNmKCIt12UcA5BOsXp1Ptkjx2yRsCj77DSml0zVYjqW/
// SIG // ISWkrGjyeVJ+khzctxaLkklVwCxigokD6fkWby0hCEKT
// SIG // OTPMzhugPIAcxcHsR2sx01YRa9pH2zvddsuBEfSFG6Cj
// SIG // 0QSvEZ/M9mJ+h4miaQSR7AEbVGDbyRKkYn80S+3AmRlh
// SIG // 3ZOe+BFqJ57OXdeIDSHbvHzJ7oTqG896l3eUhPsZg69f
// SIG // NgxTxlvRNmRE/+61Yj7Z1uB0XYQP60rsMLdTlVYEyZUl
// SIG // 5MLTL5LvqFozZlS2Xoji4BEP6ddVTzmHJ4odOZMWTTeQ
// SIG // 0IwnWG98vWv/roPegCr1G61FVrdXLE3AXIft4ZN4ZkDT
// SIG // noAhPw7DZNPRlSW4TbVj/Lw0XvnLYNwMUA9ouY/wx9te
// SIG // TaJ8vTkbgYyaOYKFz6rNRXZ4af6e3IXwMCffCaspKUXC
// SIG // 72YMu5W8L/zyTxsNUEgBbTCCB3EwggVZoAMCAQICEzMA
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
// SIG // ELQdVTNYs6FwZvKhggNQMIICOAIBATCB+aGB0aSBzjCB
// SIG // yzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWlj
// SIG // cm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UE
// SIG // CxMeblNoaWVsZCBUU1MgRVNOOjMzMDMtMDVFMC1EOTQ3
// SIG // MSUwIwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBT
// SIG // ZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQDiWNBeFJ9jvaEr
// SIG // N64D1G86eL0mu6CBgzCBgKR+MHwxCzAJBgNVBAYTAlVT
// SIG // MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
// SIG // ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEBCwUAAgUA6xSz
// SIG // SzAiGA8yMDI0MTIyNDA0MTI1OVoYDzIwMjQxMjI1MDQx
// SIG // MjU5WjB3MD0GCisGAQQBhFkKBAExLzAtMAoCBQDrFLNL
// SIG // AgEAMAoCAQACAhwqAgH/MAcCAQACAhKtMAoCBQDrFgTL
// SIG // AgEAMDYGCisGAQQBhFkKBAIxKDAmMAwGCisGAQQBhFkK
// SIG // AwKgCjAIAgEAAgMHoSChCjAIAgEAAgMBhqAwDQYJKoZI
// SIG // hvcNAQELBQADggEBAFViu1ZYfBDS3XpWR9yv57M7Aw5k
// SIG // jPt+5jq6nMYt0UV6GkOnczkGu3t/wgIy6cbgZ47vOsQL
// SIG // QWHqG+2JEdJ2gMWwyb51WPjKdDKRJIsmvCR2AjEI8DZY
// SIG // 5o1cS2/htVkxIMvxBdTMNh4uVnqXz131k9i0FKf0K3aj
// SIG // mMOSZ2pdQEG581M8c/EBGD4IJuOpMVSE5QHCg+eu8iAh
// SIG // Y0MwOhIzBHMQEJ9WMgo+5/S5xdodT+6q+lscLAtaOp4D
// SIG // oD/hI+WaTRDd474kAbLFjCvR1wJHOCf851fzb0lrXiDo
// SIG // W0HXly3QYWuThNJEwvqrUYIpJyGEDdjL+GgjwdBTWz0c
// SIG // iKeMW/QxggQNMIIECQIBATCBkzB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMAITMwAAAebZQp7qAPh94QABAAAB
// SIG // 5jANBglghkgBZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkD
// SIG // MQ0GCyqGSIb3DQEJEAEEMC8GCSqGSIb3DQEJBDEiBCB+
// SIG // n5l42W/Ml1QzPHk2CuDf8UkjbXlFb6TvjrK23PE+VjCB
// SIG // +gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0EIM+7o4ao
// SIG // HrMJaG8gnLO1q16hIYcRnoy6FnOCbnSD0sZZMIGYMIGA
// SIG // pH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMA
// SIG // AAHm2UKe6gD4feEAAQAAAeYwIgQgpxjdUUHlWTUs89E7
// SIG // mF2pPSfPsnOaGXOaKNw4cVY8ljgwDQYJKoZIhvcNAQEL
// SIG // BQAEggIAla7Hd3hahxMIRM3jI1a3vuRXwMN5glQhzdj+
// SIG // Pz9ZeqeoKheJmF4M+k8k6JQczuDoxsBGqrjCOXO5N3g0
// SIG // ffnDnD+S1gQceMit3/4ez3f2INlmPyX5VyzeDjTzDmWI
// SIG // cVGA3+r+VvvIqkj6oO2dcUx5bGOCtdXlgYTyiprYcYN/
// SIG // 3bxarHbx4kifhTl74kNrURrg+xAWWRlK/Cle5S14ytUG
// SIG // 2zLXx0Wps8uHDOhHp0+2v7LQTBIpz3j286gu+BQn9zpb
// SIG // Sn//vZRNgPU083MhG6FpWAbbCzGhfi7tyRYom5bVTq23
// SIG // OOsj+n7SW1gegh+fqq6EJZNCwZBjg8htarJ4cxHXgMAG
// SIG // WXdpJLV237D00TPD73vlzCh3O1bYlwM4qn8l+q27Bt1d
// SIG // x7DPd2AwTy+vMyFdeOgEQ/ZRfmupY4eCtumM6SD87Rgv
// SIG // CgyJQkKa1UWAVaO5vJdJEp+8EM4hlqsVLN8Yk84Yympg
// SIG // s5fx3KZypW7Ag9agWTqzJntoWRq9tCoMX/XGYEDD5DV+
// SIG // 5mWrC5EkTxaEMjs2nl8veMpX7btH9n/OW7Rkn2Kq5ycu
// SIG // 9c5cf3J8iCybvzmQ+DDO9nrrUsJf7EAmqy1Xwl1t8Cit
// SIG // Pp5BRIK1/mCeLxerN+9SJyF6I+eS9JPWWK+EoFmOApnb
// SIG // VCT/ALC5w3A3JpQNfLF31REi2XmoA/I=
// SIG // End signature block
