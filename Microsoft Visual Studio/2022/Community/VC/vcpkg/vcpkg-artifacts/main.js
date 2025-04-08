#!/usr/bin/env node
"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.session = void 0;
const child_process_1 = require("child_process");
const process_1 = require("process");
const command_line_1 = require("./cli/command-line");
const acquire_1 = require("./cli/commands/acquire");
const acquire_project_1 = require("./cli/commands/acquire-project");
const activate_1 = require("./cli/commands/activate");
const add_1 = require("./cli/commands/add");
const cache_1 = require("./cli/commands/cache");
const clean_1 = require("./cli/commands/clean");
const deactivate_1 = require("./cli/commands/deactivate");
const delete_1 = require("./cli/commands/delete");
const find_1 = require("./cli/commands/find");
const generate_msbuild_props_1 = require("./cli/commands/generate-msbuild-props");
const list_1 = require("./cli/commands/list");
const regenerate_index_1 = require("./cli/commands/regenerate-index");
const remove_1 = require("./cli/commands/remove");
const update_1 = require("./cli/commands/update");
const use_1 = require("./cli/commands/use");
const styling_1 = require("./cli/styling");
const i18n_1 = require("./i18n");
const session_1 = require("./session");
// parse the command line
const commandline = new command_line_1.CommandLine(process_1.argv.slice(2));
(0, i18n_1.setLocale)(commandline.language);
require('./exports');
async function main() {
    // ensure we can execute commands from this process.
    // this works around an odd bug in the way that node handles
    // executing child processes where the target is a windows store symlink
    (0, child_process_1.spawn)(process.argv0, ['--version']);
    // create our session for this process.
    exports.session = new session_1.Session(process.cwd(), commandline.context, commandline);
    (0, styling_1.initStyling)(commandline, exports.session);
    // start up the session and init the channel listeners.
    await exports.session.init();
    const find = new find_1.FindCommand(commandline);
    const list = new list_1.ListCommand(commandline);
    const add = new add_1.AddCommand(commandline);
    const acquire_project = new acquire_project_1.AcquireProjectCommand(commandline);
    const acquire = new acquire_1.AcquireCommand(commandline);
    const use = new use_1.UseCommand(commandline);
    const remove = new remove_1.RemoveCommand(commandline);
    const del = new delete_1.DeleteCommand(commandline);
    const activate = new activate_1.ActivateCommand(commandline);
    const activate_msbuildprops = new generate_msbuild_props_1.GenerateMSBuildPropsCommand(commandline);
    const deactivate = new deactivate_1.DeactivateCommand(commandline);
    const regenerate = new regenerate_index_1.RegenerateCommand(commandline);
    const update = new update_1.UpdateCommand(commandline);
    const cache = new cache_1.CacheCommand(commandline);
    const clean = new clean_1.CleanCommand(commandline);
    const command = commandline.command;
    if (!command) {
        // no command recognized.
        // did they specify inputs?
        if (commandline.inputs.length > 0) {
            // unrecognized command
            (0, styling_1.error)(`Unrecognized command '${commandline.inputs[0]}'`);
            return process.exitCode = 1;
        }
        return process.exitCode = 0;
    }
    let result = true;
    try {
        result = await command.run();
    }
    catch (e) {
        // in --debug mode we want to see the stack trace(s).
        if (commandline.debug && e instanceof Error) {
            (0, styling_1.log)(e.stack);
            if (e instanceof AggregateError) {
                e.errors.forEach(each => (0, styling_1.log)(each.stack));
            }
        }
        (0, styling_1.error)(e);
        await exports.session.writeTelemetry();
        return process.exit(1);
    }
    finally {
        await exports.session.writeTelemetry();
    }
    return process.exit(result ? 0 : 1);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJtYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsdUNBQXVDO0FBQ3ZDLGtDQUFrQzs7O0FBRWxDLGlEQUFzQztBQUN0QyxxQ0FBK0I7QUFDL0IscURBQWlEO0FBQ2pELG9EQUF3RDtBQUN4RCxvRUFBdUU7QUFDdkUsc0RBQTBEO0FBQzFELDRDQUFnRDtBQUNoRCxnREFBb0Q7QUFDcEQsZ0RBQW9EO0FBQ3BELDBEQUE4RDtBQUM5RCxrREFBc0Q7QUFDdEQsOENBQWtEO0FBQ2xELGtGQUFvRjtBQUNwRiw4Q0FBa0Q7QUFDbEQsc0VBQW9FO0FBQ3BFLGtEQUFzRDtBQUN0RCxrREFBc0Q7QUFDdEQsNENBQWdEO0FBQ2hELDJDQUF3RDtBQUN4RCxpQ0FBbUM7QUFDbkMsdUNBQW9DO0FBRXBDLHlCQUF5QjtBQUN6QixNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBR25ELElBQUEsZ0JBQVMsRUFBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7QUFHaEMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBRXJCLEtBQUssVUFBVSxJQUFJO0lBRWpCLG9EQUFvRDtJQUNwRCw0REFBNEQ7SUFDNUQsd0VBQXdFO0lBQ3hFLElBQUEscUJBQUssRUFBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUVwQyx1Q0FBdUM7SUFDdkMsZUFBTyxHQUFHLElBQUksaUJBQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsV0FBVyxDQUFDLE9BQU8sRUFBTyxXQUFXLENBQUMsQ0FBQztJQUU1RSxJQUFBLHFCQUFXLEVBQUMsV0FBVyxFQUFF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
// SIG // Begin signature block
// SIG // MIIoKAYJKoZIhvcNAQcCoIIoGTCCKBUCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // 5O4bWcoTEDJNXlW+myfgJDfXeCYVMEo4SYU64xi0iUWg
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
// SIG // DQEJBDEiBCCTWiiv93w09HDxB/db+rPm5ltDlRlVw99E
// SIG // Ho+ZEeojEzBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBADyxWFri
// SIG // bH/KCNE9pS+en+L5/vJHJvqaQG5heHdemTSN8Tp/Nn1I
// SIG // hrFF0RULpIuoyfMhlbTTkeiBrJ8jn3UV+9zFn8VBsA7+
// SIG // EwfR4/tW8G2zvSqCD84EVtBRJ7im6zlUj5o8hB/guPYS
// SIG // PN9XDRPvfZGQViKq5tpgwKJZbdtrrXMLENW29LfwRXNP
// SIG // 78n4oTw3TKuQTMCxrBX4Vi9kLnCtnPG0rf08zpKsjvlM
// SIG // J7l/hCGXwCgBbZ9seqikJtwH8bDTXYXYOe00ACSxcee+
// SIG // YBxMiS+Sxb0+hwhJHq80jBcLfHjCZSoCJydCOZqBLK7c
// SIG // otQ5X/FoQFn2208kmWgOfgqDUSahgheUMIIXkAYKKwYB
// SIG // BAGCNwMDATGCF4Awghd8BgkqhkiG9w0BBwKgghdtMIIX
// SIG // aQIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZIhvcN
// SIG // AQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgi+G8UWKVUxqqmxe4XWTA
// SIG // gePfdSvpwHbS40zDBPiw3LUCBmc/SeObNBgTMjAyNDEy
// SIG // MDkyMTAzMzMuMjMyWjAEgAIB9KCB0aSBzjCByzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0
// SIG // IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMeblNo
// SIG // aWVsZCBUU1MgRVNOOjk2MDAtMDVFMC1EOTQ3MSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oIIR6jCCByAwggUIoAMCAQICEzMAAAHviT9WoVjMqNoA
// SIG // AQAAAe8wDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTAwHhcNMjMxMjA2MTg0NTQ4WhcN
// SIG // MjUwMzA1MTg0NTQ4WjCByzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3Bl
// SIG // cmF0aW9uczEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNO
// SIG // Ojk2MDAtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAg8AMIICCgKCAgEAowtY4p8M4B8ITmpG
// SIG // aste6BOASASrJuZF+A1JggViNJRVaRIiuZmdioefbKC+
// SIG // J7OdqYRTEGBhuZMqQoqbp4MD/TaG+FRlROmqDKOYWfTc
// SIG // rV0eWUYG/WfDUehJiyiAkYQ+LKIzzIP0ZxkU3HX+/02L
// SIG // 8jNdIy45i8ihHoDB37yMD5jPgD+4c0C3xMQ3agidruuB
// SIG // neV5Z6xTpLuVPYyzipNcu9HPk8LdOP0S6q7r9Xxj/C5m
// SIG // JrR76weE3AbAA10pnBY4dFYEJF+M1xcKpyBvK4GPsw6i
// SIG // WEDWT/DtWKOJEnJB0+N1wtKDONMntvvZf602IgxTN55W
// SIG // Xto4bTpBgjuhqok6edMSPSE6SV4tLxHpPAHo0+DyjBDt
// SIG // mz8VOt6et7mW43TeS/pYCHAjTAjSNEiKKUuIGlUeEsvy
// SIG // KA79bw1qXviNvPysvI1k3nndDtx8TyTGal+EAdyOg58G
// SIG // ax4ip+qBN/LYAUwggCrxKGDk4O69pRdCLm7f9/lT7yrU
// SIG // wlG2TxThvI2bfaugBaHZb0J7YqJWCGLakqy8lwECJVxo
// SIG // WeIDXL+Hb9WAIpZ21gPQrJ2IfjihBa/+MODOvZSPsmqG
// SIG // dy/7f1H16U//snO4UvxaJXJqxhSUwWJUuJxNXLim5cGf
// SIG // 1Dhtuki4QzjVlxmQyjCSjed6Di0kpOJXUdB5bG0+IXi5
// SIG // VpThJSUCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBTtTFqi
// SIG // hcKwm7a8PT/AOt2wFUicyzAfBgNVHSMEGDAWgBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQ
// SIG // hk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
// SIG // JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwG
// SIG // CCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUt
// SIG // U3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMB
// SIG // Af8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4G
// SIG // A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // GBmWt2gg7nW5PRFXZD/MXEBmbiACD0cfStQgO7kcwbfN
// SIG // HwtGlpLmGIUDLxxyUR1KG0jOFMN8ze3xxDfIYWgQ2/TU
// SIG // WhpxVnbR8ZifXjM+iaZ+ioiMovVOToO0Ak2TJde59sOH
// SIG // nXaub7ZOK0Vjlb6YgwRiQESol1gfbtosdFh9hDBRh6oy
// SIG // IY1lF4T4EeAujShTVx71r13nCdll6yZ770BlwHzSRhEy
// SIG // WRqUeNZ1Dd4o34gkoxQ8Wphj7MuYmLvdOB7/brkl2HeZ
// SIG // tCcX9ljSUl5DxpTYaztu6T8YE9ddZsgEetUt0toXOe9s
// SIG // zfcqCRDmxPfFcuShDN2V+d3C3nzfNRdQvaf3ACpBOrvV
// SIG // eq8spf6koMbtVKnjmQrRv4mh0ijKMTOzKuEjBbD0//In
// SIG // jncApWKXMNAo2XuSgcdsS2uAdZ3hYm/CfP4EqLIzHRd5
// SIG // x4sh8dWHnWQ7cUkoHoHibItH21IHc7FTCWL6lcOdlqkD
// SIG // btBkQu/Wbla3lFSnQiZlDARwaU6elRaKS9CX+Eq4IPs0
// SIG // Q/YsG3Pbma5/vPaHaSJ2852K5zyh4jtuqntXpDcJf3e6
// SIG // 6NiLT/5YIc9A6A+5BBnopCiVh3baO3lSaCYZK1HGp07l
// SIG // B9PIPjWMBukvj4wUgfzcjRemx2v8UfnHgGIXI8dIgYr/
// SIG // dDJ9CYhn5wNv4S4+Xr4U3AIwggdxMIIFWaADAgECAhMz
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
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjo5NjAwLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAS3CPNYMW3mtR
// SIG // MdphW18e3JPtIP+ggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOsB
// SIG // ghowIhgPMjAyNDEyMDkxNDUwMDJaGA8yMDI0MTIxMDE0
// SIG // NTAwMlowdDA6BgorBgEEAYRZCgQBMSwwKjAKAgUA6wGC
// SIG // GgIBADAHAgEAAgIEaTAHAgEAAgIUJjAKAgUA6wLTmgIB
// SIG // ADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMC
// SIG // oAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3
// SIG // DQEBCwUAA4IBAQCJQyHgREFKif712Jzv4DEUaZPqqCbV
// SIG // UiXiSZGz7mAnXDFmrpBBx8U/v+Kt4Ei/HX1PvqKiBF8v
// SIG // hzPdV+xdZVOE4nAc0cS4eoxl+e/R7ByE1kMFM2MBhqfC
// SIG // 87qyM9Tcj1ACCTXbqPfER15wgDB7ThQ1mx8ZXZw4D3a/
// SIG // yB/9+FxSeHnP7v3U7gqI8e+YeYFjMlFD1w+ngfq0czLm
// SIG // y+25j+akxQzj57ME4wKL7mwib4JNJVFa7+IqtmXhh+FB
// SIG // g/k60/6oHiwiNC+0QTs0Teq5kmku5Dm19QqKeaQE61id
// SIG // oDdQcB/EAoBZYOLdnymQq9rJ30Sum6ZTajTSje41QZpF
// SIG // ZuIbMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTACEzMAAAHviT9WoVjMqNoAAQAAAe8w
// SIG // DQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzEN
// SIG // BgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQgW2by
// SIG // /RkMMFZGpcVNPqCNhiC+pS+LeOOmVCsVi3hrt8QwgfoG
// SIG // CyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCDwYShFuBaN
// SIG // 8FM9PTUMdmtA23HbF/I6LzOS4sx5p8l/ozCBmDCBgKR+
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB
// SIG // 74k/VqFYzKjaAAEAAAHvMCIEII26ROYqlFkRuM4u5npm
// SIG // c3dr198vW1+kNncFe3CZQYIzMA0GCSqGSIb3DQEBCwUA
// SIG // BIICABjBXATwQ4rblyqPMXCk4vkcyTCvpC6BrUHSDugv
// SIG // bJgnJDG+/aFYNt1LG3L4ffxyx78YPCC3cvghY9j/WnQD
// SIG // DAS20UKAz5Zow4nG3wNjHyxMwvHVtiZ8nhl7nXkcIhzl
// SIG // ME9w0E8J+GB926TqzMh/XSi56qhgr2LA5PlnzWGKMGyE
// SIG // IflwvyTLHb9s3bi4DwFlvFEFvNg4QI4PQPidOJqeRdmn
// SIG // iwcZPyTT2YsZpRGAjUTCcyuWJt1n0rtYiQ3DZcWu7/G+
// SIG // J/V3S44N5Lu3o3g7QkjKaeGifJqd2lnmqb6A4BiquJVD
// SIG // acV7ovxPWeS+sSOcgUncWDO9iR2H0BgUzhCNQhobSfpe
// SIG // DxZgHBle/V1tpH8zS8j+2gmmSzbjdOaN8vFq3BVwIpWM
// SIG // vr249lsMqoCWfb2C1jKkMEWKo6PElyhrG5N9y+nIzk1a
// SIG // j5BNdqlzLGtkElH/dSn62sAkFeINGrkwBucMZe5+Dr5K
// SIG // Xb2pzRTS/OHoTizBZHbGQHBFYtZi8+I9KuvWa7tB8WFD
// SIG // leuP2SVHcs96NwNLMgmq+N7DEYStXwCap/4Zx3Z9UVNl
// SIG // /hPgbIgHFIzy26wBQ4IkZU5xEFyYrz1s8tGJZuLoQkED
// SIG // EjGXBOB42K8os3pnTTEmGIWGuIpKytosyYBfKZV6EoQH
// SIG // GGMJq5Rk5eYUCmnPzF1zYSMJ8i65
// SIG // End signature block
