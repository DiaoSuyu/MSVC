//@ts-check
var framework;
var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', async function (line) {
    rl.close();

    RunTestsOnFrameworks(line);
});

function createContext(line) {
    function setFullTitle(testCases) {
        // FullyQualifiedName looks like `<filepath>::<suite><subSuite>::<testName>`.
        // <suite> will be `global` for all tests on the "global" scope.
        // The result would be something like `<suite> <subSuite> <testName>`. Removes `global` as well.
        const cleanRegex = /.*?::(global::)?/;

        for (let testCase of testCases) {
            testCase.fullTitle = testCase.fullyQualifiedName.replace(cleanRegex, "").replace("::", " ");
        }
    }

    function getFullyQualifiedName(testCases, fullTitle) {
        // TODO: Don't do linear search, instead use a property or cache the fullTitle, fullyQualifiedName.
        for (let testCase of testCases) {
            if (testCase.fullTitle === fullTitle) {
                return testCase.fullyQualifiedName;
            }
        }
    }

    function post(event) {
        if (event) {
            if (event.result) {
                // Some test frameworks report the result on the stdout/stderr so the event will be empty. Set only stdout and stderr if that's the case.
                event.result.stdout = event.result.stdout || newOutputs.stdout;
                event.result.stderr = event.result.stderr || newOutputs.stderr;
            }

            // We need to unhook the outputs as we want to post the event to the test explorer.
            // Then hook again to continue capturing the stdout
            unhookOutputs();
            console.log(JSON.stringify(event));
            hookOutputs();
        }
    }

    function clearOutputs() {
        newOutputs = {
            stdout: '',
            stderr: ''
        };
    }

    let testCases = JSON.parse(line);
    setFullTitle(testCases);

    return {
        testCases: testCases,
        getFullyQualifiedName: (fullTitle) => getFullyQualifiedName(testCases, fullTitle),
        post,
        clearOutputs
    };
}

function hookOutputs() {
    oldOutputs = {
        stdout: process.stdout.write,
        stderr: process.stderr.write
    };

    process.stdout.write = (str, encoding, callback) => {
        newOutputs.stdout += str;
        return true;
    };
    process.stderr.write = (str, encoding, callback) => {
        newOutputs.stderr += str;
        return true;
    };
}

function unhookOutputs() {
    process.stdout.write = oldOutputs.stdout;
    process.stderr.write = oldOutputs.stderr;
}

async function RunTestsOnFrameworks(line) {
    // strip the BOM in case of UTF-8
    if (line.charCodeAt(0) === 0xFEFF) {
        line = line.slice(1);
    }

    const context = createContext(line);

    // get rid of leftover quotations from C# (necessary?)
    for (var test in context.testCases) {
        for (var value in context.testCases[test]) {
            context.testCases[test][value] = context.testCases[test][value] && context.testCases[test][value].replace(/["]+/g, '');
        }
    }

    try {
        framework = require('./' + context.testCases[0].framework + '/' + context.testCases[0].framework + '.js');
        await framework.run_tests(context);
    } catch (exception) {
        console.log("TESTADAPTER_ERROR:Failed to load TestFramework (" + context.testCases[0].framework + "), " + exception);
        process.exit(1);
    }
}

let oldOutputs = {};
let newOutputs = {
    stdout: '',
    stderr: ''
};

module.exports.RunTests = RunTestsOnFrameworks;

hookOutputs();
// SIG // Begin signature block
// SIG // MIIoKwYJKoZIhvcNAQcCoIIoHDCCKBgCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // cgHzHmQMyd/6r4znxFuSBn58aTMNJdFvRdeRysIl/Dyg
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
// SIG // DQEJBDEiBCBjIL9b0jaEn5OJuEcBKhmmXowIoKaaipuF
// SIG // ohJFTlMptjBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAJvFSZha
// SIG // fulK4TMnKHkSjvsEZqjVctw147UW1Jtgla482HPMRZ+k
// SIG // Z6g3QbfGL382YD5dFlvlIPeaVuuErS5YwJF9J84jg2y5
// SIG // zNoJ4UC4dfdgRZGu9INPU5uRT16zp0wI1WUUsGLqoVWV
// SIG // QS18YjgfTW5xWmskyAwysbKnRO/TkPpMPmVK/GuhNvt7
// SIG // /TjOwNVdC64AuQueqo6X+mRMk5CcYqWpgrmgU9h+OnhX
// SIG // 2KZcJjoQQnNZosu92mt2AOBXb2mbGl9H+BmfwWX61LQy
// SIG // AnTYqBCG3ZfRTdT4v/cyrs8FhI8js3Pxs03NQhL1gNWK
// SIG // BSBoCTP0k+GpOuScDquU0CeWN3KhgheXMIIXkwYKKwYB
// SIG // BAGCNwMDATGCF4Mwghd/BgkqhkiG9w0BBwKgghdwMIIX
// SIG // bAIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZIhvcN
// SIG // AQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgMP5XZLURvu4+wXDyLwOt
// SIG // dT9KSt5OZlI5TZi/6CEbUqQCBmdovmOWGBgTMjAyNDEy
// SIG // MjQwOTE0MzIuNjE4WjAEgAIB9KCB0aSBzjCByzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0
// SIG // IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNo
// SIG // aWVsZCBUU1MgRVNOOkE0MDAtMDVFMC1EOTQ3MSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oIIR7TCCByAwggUIoAMCAQICEzMAAAHs4CukgtCRUoAA
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
// SIG // ahC0HVUzWLOhcGbyoYIDUDCCAjgCAQEwgfmhgdGkgc4w
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
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOsU
// SIG // jlUwIhgPMjAyNDEyMjQwMTM1MTdaGA8yMDI0MTIyNTAx
// SIG // MzUxN1owdzA9BgorBgEEAYRZCgQBMS8wLTAKAgUA6xSO
// SIG // VQIBADAKAgEAAgIJtwIB/zAHAgEAAgITTDAKAgUA6xXf
// SIG // 1QIBADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZ
// SIG // CgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqG
// SIG // SIb3DQEBCwUAA4IBAQCNi5HLw67ciNc8vXPDyJMj0i2m
// SIG // C9Fhd9o4g8YsqMrV6y9ffXKaNtYXLCRUce6wYJ3k6ZJp
// SIG // YGh36zlGBHCL1xPOpkFONhAxtzQ4FcpX4aRZjMLK6nba
// SIG // dLjfOeXFUDNFw1B8Uo5bhfJ+OHn/ctzjL4m39dmolmtN
// SIG // mVu1pm8Bkw1a03JPJ0PMCCxpmemdV/3W4HJjFSYAaDCb
// SIG // BtR35DaiLvJaJ8wKmAhvJcDNRxuD0Wp/lGTYt/tWrnjN
// SIG // dxEpjWzz54mUyWuG4crN92g0wk82WAqAp7EJXhExTsUP
// SIG // /eCMB146pn5EqQCwBOQTmZR5Ng1Wmv3FUUmiMchP2HLi
// SIG // w5lNHTrXMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTACEzMAAAHs4CukgtCRUoAAAQAA
// SIG // AewwDQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJ
// SIG // AzENBgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQg
// SIG // eCx3e9OuZIBDGH/JfghKhipXjBYIY5XBVhNObli0pE0w
// SIG // gfoGCyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCAnCeb1
// SIG // an03yIcdtUAQWysqP8XIkCF2qDFlC3owBNUKgzCBmDCB
// SIG // gKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMT
// SIG // HU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMz
// SIG // AAAB7OArpILQkVKAAAEAAAHsMCIEIHz1BHdJuGL8yXYt
// SIG // FymMpExCI4NhOAwPAMJkM36AWGssMA0GCSqGSIb3DQEB
// SIG // CwUABIICAI49DGTx3lywAuQCbodWjqqkVEglVZPkpt48
// SIG // Wgx/Q/pXUsWPAEpOSl/Y9Yg0tWEQeFEwXVyEErKF90UE
// SIG // gnv3eB/sxwCNYCw5FE8fU/jIzyN7XgQZv3OnRvQ/Nxeu
// SIG // fT0C4Ob0T/s+jjXBE58fnLxvj4pAfzpy0U2PXeScroUU
// SIG // vhyHf/D63ciGSJtFiVcfxCapnDmFqAi6oSmBVqJ4YP2k
// SIG // ruW9aeYWFjcChftUwdEYR1aayGg/FZ5SvxcxZuEoNnmI
// SIG // xpd94+EgluQTU2+HwcSn2FRD4S+cW7KjTaUc5X5R1inf
// SIG // 9h52Kyfq5vTfYqIIIJaAGQ2lfZonxVdROHlgE2EACYz1
// SIG // AbhKOgz5h5+T/2iwo2nkOifNm1puIkcgXCmGM7jj6x71
// SIG // C/JgJ78QJW7SRk1n2yoFfGHs7j8DDmlQ53zPq05LWWbF
// SIG // qVvWY6Gk0HFsKLkw/sUMS2A3Uw+bnW+gzZ8vbfSRCaw7
// SIG // fM8EAiBAwVBcGZatq3yzLkPIXAeJ2YUsQibRZqGMHmIc
// SIG // Ff7aAxvNP6w+2BTpTAN2zWqYXDnfFEYdl1VqlXDTBCrT
// SIG // AyXmkQklrHGSaDdYk7ZwUSSC3zOcVwocdO57Q4F2H/GD
// SIG // +1bjofzJrK/0gzbqDIl8M1HrC70hFB9iw6SJylfqk/eu
// SIG // lKiE7shqDa7ur6Mne6z70t3o2rlfXk4t
// SIG // End signature block
