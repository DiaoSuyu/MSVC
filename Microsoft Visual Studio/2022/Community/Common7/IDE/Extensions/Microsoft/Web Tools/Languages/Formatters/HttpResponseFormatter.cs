// Copyright (c) Microsoft Corporation. All rights reserved.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Html;
using Microsoft.DotNet.Interactive.Formatting;
using Microsoft.DotNet.Interactive.Http;
using static Microsoft.DotNet.Interactive.Formatting.PocketViewTags;

#nullable enable

public class HttpResponseFormatter : ITypeFormatter<EmptyHttpResponse>
{
    private const string HttpResponseMessageContainerClass = "http-response-message-container";

    private static string GetNewRandom => Guid.NewGuid().ToString("N");

    private static HtmlString GetScripts(string random, bool enableHighlighting) =>
        new($$"""
            await onLoadTabs{{random}}();

            async function onLoadTabs{{random}}() {
                try {
                    // register click handlers for the tab headers
                    const tabHeaders = document.querySelectorAll('div[id = "{{random}}"] .navLink');
                    tabHeaders.forEach((th) => {
                        th.addEventListener('click', handleOnClick{{random}}, false);
                    });
                    if({{(enableHighlighting ? "true" : "false")}}) {
                        var hljs = (await import('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/es/highlight.min.js')).default;

                        var code = document.querySelectorAll('.code code');
                        code.forEach((c) => {
                            hljs.highlightElement(c);
                        });
                    }
                }
                finally {
                    // this prevents a flicker on the content after styles are applied
                    document.querySelector('div[id = "{{random}}"] .content')?.removeAttribute('hidden');
                }
            }

            function handleOnClick{{random}}(event) {
                // hide all the content and then show the selected one
                const contentElements = document.querySelectorAll('div[id = "{{random}}"] .tabContent');
                contentElements.forEach((element) => {
                    element.setAttribute('hidden', '');
                });

                const tabHeaderElements = document.querySelectorAll('div[id = "{{random}}"] .navLink');
                tabHeaderElements.forEach( (element) => {
                    element.removeAttribute('current');
                });
    
                document.querySelector(event.currentTarget.getAttribute('href')).removeAttribute('hidden');

                event.currentTarget.setAttribute('current', '');
                event.preventDefault();
            }
            """);

    private static HtmlString GetCSS() =>
        new("""
            :root {
                --table-header-color: #009879;
                --json-background-color: #ffffff;
                --json-comment-color: #008000;
                --json-keyword-color: #007c8f;
                --json-section-color: #e02921;
                --json-literal-color: #0050c2;
                --json-string-color: #a31515;
                --json-attribute-color: #2b91af;
                --json-link-color:#0000FF;
            }
            
            /* I had to declare this as light theme specific becuase otherwise the
               media query from .net interactive will override these values. */
            @media (prefers-color-scheme: light) {
                :root {
                    --table-header-color: #009879;
                    --json-background-color: #ffffff;
                    --json-comment-color: #008000;
                    --json-keyword-color: #007c8f;
                    --json-section-color: #e02921;
                    --json-literal-color: #0050c2;
                    --json-string-color: #a31515;
                    --json-attribute-color: #2b91af;
                    --json-link-color:#0000FF;
                }
            }

            @media (prefers-color-scheme: dark) {
                :root {
                    --table-header-color: #009879;
                    --json-background-color: #1e1e1e;
                    --json-comment-color: #538930;
                    --json-keyword-color: #c678dd;
                    --json-section-color: #e06c75;
                    --json-literal-color: #56b6c2;
                    --json-string-color: #d69d85;
                    --json-attribute-color: #4ec9b0;
                    --json-link-color:#438ddd;
                }
            }

            #raw code {
                text-wrap: wrap;
                overflow-wrap: anywhere;
            }

            .mainContent{
                height: 100%;
                width: 100%;
            }
            #navList{
                list-style-type : none;
                padding-left: 0;
                white-space: nowrap;
            }
            #navList li{
                display: inline;
                padding-right: 1em;
            }
            .navLink{
                font-weight:bold;
                color: #dcdcdc;
                text-align: center;
                text-decoration: none;
                font-size: 2em;
            }
            .navLink[current]{
                border-bottom: 0.5rem solid #403582;
            }
            .content{
                height: 100%;
            }
            .table{
                border-collapse: collapse;
                margin: 25px 0;
                min-width: 600px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
                font-family: 'Cascadia Code','Courier New', Courier, monospace;
                font-size: large;
            }
            .table thead tr{
                background-color: var(--table-header-color); /* #009879; */
                color: #ffffff;
                text-align: center;
            }
            .table tbody tr td{
                padding-right: 2em;
            }
            .tableNameField{
                text-align: right;
            }
            #headers, #request{
                padding: 1em;
            }
            #statsBar{
                list-style-type: none;
                padding-left: 0;
                white-space: nowrap;
            }
            #statsBar li{
                display: inline-block;
            }
            #statsBar a{
                text-decoration: none;
            }
            .statName{
                font-family: 'Cascadia Code','Courier New', Courier, monospace;
                padding-right: 0.2em;
            }
            .statName.download{
                cursor: pointer;
            }
            .statValue{
                padding-right: 1em;
            }
            .statValue.statusSucceeded{
                color: green;
            }
            .statValue.statusFailed{
                color: red;
            }

            #formatted>pre> code.hljs {
                display: block;
                overflow-x: auto;
                padding: .5em;
            }

            #formatted>pre>code .hljs-comment,
            #formatted>pre>code .hljs-quote {
                color: var(--json-comment-color);
                font-style: italic
            }

            #formatted>pre>code .hljs-doctag,
            #formatted>pre>code .hljs-formula,
            #formatted>pre>code .hljs-keyword {
                color: var(--json-keyword-color);
            }

            #formatted>pre>code .hljs-deletion,
            #formatted>pre>code .hljs-name,
            #formatted>pre>code .hljs-section,
            #formatted>pre>code .hljs-selector-tag,
            #formatted>pre>code .hljs-subst {
                color: var(--json-section-color);
            }

            #formatted>pre>code .hljs-literal {
                color: var(--json-literal-color);
            }

            #formatted>pre>code .hljs-addition,
            #formatted>pre>code .hljs-attribute,
            #formatted>pre>code .hljs-meta-string,
            #formatted>pre>code .hljs-regexp,
            #formatted>pre>code .hljs-string {
                color: var(--json-string-color);
            }

            #formatted>pre>code .hljs-built_in,
            #formatted>pre>code .hljs-class .hljs-title {
                color: #e6c07b
             }

            #formatted>pre>code .hljs-attr,
            #formatted>pre>code .hljs-number,
            #formatted>pre>code .hljs-selector-attr,
            #formatted>pre>code .hljs-selector-class,
            #formatted>pre>code .hljs-selector-pseudo,
            #formatted>pre>code .hljs-template-variable,
            #formatted>pre>code .hljs-type,
            #formatted>pre>code .hljs-variable {
                color: var(--json-attribute-color);
            }

            #formatted>pre>code .hljs-bullet,
            #formatted>pre>code .hljs-link,
            #formatted>pre>code .hljs-meta,
            #formatted>pre>code .hljs-selector-id,
            #formatted>pre>code .hljs-symbol,
            #formatted>pre>code .hljs-title {
                color: var(--json-link-color);
            }

            #formatted>pre>code .hljs-emphasis {
                font-style: italic
            }

            #formatted>pre>code .hljs-strong {
                font-weight: 700
            }

            #formatted>pre>code .hljs-link {
                text-decoration: underline
            }

            @keyframes blink {
                0% {
                  opacity: .2;
                }
                20% {
                  opacity: 1;
                }
                100% {
                  opacity: .2;
                }
            }

            .ellipsis span {
                animation-name: blink;
                animation-duration: 1.4s;
                animation-iteration-count: infinite;
                animation-fill-mode: both;
            }

            .ellipsis span:nth-child(2) {
                animation-delay: .2s;
            }

            .ellipsis span:nth-child(3) {
                animation-delay: .4s;
            }
            """);

    string ITypeFormatter.MimeType => HtmlFormatter.MimeType;

    Type ITypeFormatter.Type => typeof(EmptyHttpResponse);

    bool ITypeFormatter<EmptyHttpResponse>.Format(EmptyHttpResponse instance, FormatContext context)
        => this.Format(instance, context);

    bool ITypeFormatter.Format(object instance, FormatContext context)
    {
        if (instance is EmptyHttpResponse response)
        {
            return this.Format(response, context);
        }

        return false;
    }

    private bool Format(EmptyHttpResponse response, FormatContext context)
    {
        var random = GetNewRandom;
        var css = GetCSS();

        PocketView? output = null;

        if (response is HttpResponse fullResponse)
        {
            output = FormatFullResponse(fullResponse, random, css);
        }
        else if (response is PartialHttpResponse partialResponse)
        {
            output = FormatPartialResponse(partialResponse, random, css);
        }
        else
        {
            output = FormatEmptyResponse(response, random, css);
        }

        output?.WriteTo(context);

        return true;
    }

    private static PocketView FormatEmptyResponse(EmptyHttpResponse response, string random, HtmlString css)
    {
        var ellipsis =
            h3[@class: "ellipsis"](
                "Awaiting response ",
                span("."),
                span("."),
                span("."));

        return div[@class: HttpResponseMessageContainerClass, id: random](
            style[type: "text/css"](css),
            ellipsis);
    }

    private static PocketView FormatPartialResponse(PartialHttpResponse response, string random, HtmlString css)
    {
        var ellipsis =
            h3[@class: "ellipsis"](
                "Loading content ",
                span("."),
                span("."),
                span("."));

        dynamic statsBar = GetStatsBar(response);

        return div[@class: HttpResponseMessageContainerClass, id: random](
            style[type: "text/css"](css),
            statsBar,
            ellipsis);
    }

    private static PocketView FormatFullResponse(HttpResponse response, string random, HtmlString css)
    {
        var statsBar = GetStatsBar(response);

        var navList =
            ul[@id: "navList"](
                li[@class: "navHeader"](
                    a[@class: "navLink", current: "", href: "#formatted"]("Formatted")),
                li[@class: "navHeader"](
                    a[@class: "navLink", href: "#raw"]("Raw")),
                li[@class: "navHeader"](
                    a[@class: "navLink", href: "#headers"]("Headers")),
                li[@class: "navHeader"](
                    a[@class: "navLink", href: "#request"]("Request")));

        dynamic? requestDiv;
        if (response.Request is { } request)
        {
            var requestUriString = request.Uri?.ToString();
            var requestHyperLink =
                string.IsNullOrWhiteSpace(requestUriString)
                    ? "[Unknown]"
                    : a[href: requestUriString](requestUriString);

            var requestLine = h3($"{request.Method} ", requestHyperLink, $" HTTP/{request.Version}");

            var requestHeaders =
                HeaderTable(request.Headers, request.Content?.Headers);

            var requestBodyString = request.Content?.Raw ?? string.Empty;
            var requestBodyLength = request.Content?.ByteLength ?? 0;
            var requestContentType = request.Content?.ContentType;
            var requestContentTypePrefix = requestContentType is null ? null : $"{requestContentType}, ";
            var requestBodyLine = h3($"{requestContentTypePrefix}{requestBodyLength} bytes");
            var requestBody = pre(requestBodyString);

            requestDiv =
                div[id: "request", @class: "tabContent", hidden: ""](
                    h2("Request"),
                    requestLine,
                    h2("Headers"),
                    requestHeaders,
                    h2($"Body"),
                    requestBodyLine,
                    requestBody);
        }
        else
        {
            requestDiv = div[id: "request", @class: "tabContent"]();
        }

        var responseLine =
            h3($"HTTP/{response.Version} {response.StatusCode} {response.ReasonPhrase} ({response.ElapsedMilliseconds:0.##} ms)");

        var responseHeaders = HeaderTable(response.Headers, response.Content?.Headers);
        var responseRawString = response.Content?.Raw ?? string.Empty;
        var responseBodyLength = response.Content?.ByteLength ?? 0;
        var responseContentType = response.Content?.ContentType;
        var responseContentTypePrefix = responseContentType is null ? null : $"{responseContentType}, ";
        var responseBodyLine = h3($"{responseContentTypePrefix}{responseBodyLength} bytes");

        string responseFormattedString;
        // TODO: Handle other content types like images, html and xml.
        try
        {
            var parsedResponseRawString = JsonDocument.Parse(responseRawString);

            responseFormattedString =
                JsonSerializer.Serialize(
                    parsedResponseRawString,
                    // NOTE: We use the UnsafeRelaxedJsonEscaping encoder here to ensure that unicode characters and
                    // other special characters (such as <, >, & etc.) are preserved verbatim (and not escaped to
                    // /u003C, /u003E, /u0026 etc.). This should be safe in the current context since we are merely
                    // formatting the json for display and since the resulting formatted string is sanitized (html
                    // encoded) by the PocketView API (i.e. the calls to code() and pre() that surrround this string
                    // below) before it is included in the displayed html.
                    new JsonSerializerOptions { WriteIndented = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
        }
        catch (JsonException)
        {
            responseFormattedString = responseRawString;
        }

        var responseRawBody = pre(code(responseRawString));
        var responseFormattedBody = pre(code(responseFormattedString));

        var responseRawDiv =
            div[id: "raw", @class: "tabContent code", hidden: ""](
                h2($"Body"),
                responseBodyLine,
                responseRawBody);

        var responseFormattedDiv =
            div[id: "formatted", @class: "tabContent code", current: ""](
                h2($"Body"),
                responseBodyLine,
                responseFormattedBody);

        var responseHeadersDiv =
            div[id: "headers", @class: "tabContent", hidden: ""](
                h2("Response"),
                responseLine,
                h2("Headers"),
                responseHeaders);

        var contentDiv =
            div[@class: "content", hidden: ""](
                responseFormattedDiv,
                responseRawDiv,
                responseHeadersDiv,
                requestDiv);

        var scripts = GetScripts(random, (response.Content?.ByteLength ?? 0) < 500000);

        return div[@class: HttpResponseMessageContainerClass, id: random](
            style[type: "text/css"](css),
            statsBar,
            navList,
            contentDiv,
            script[type: "module"](scripts));

        static dynamic HeaderTable(Dictionary<string, string[]> headers, Dictionary<string, string[]>? contentHeaders = null)
        {
            var allHeaders = contentHeaders is null ? headers : headers.Concat(contentHeaders);

            var headerTable =
                table[@class: "table"](
                    thead(
                        tr(
                            th("Name"), th("Value"))),
                    tbody(
                        allHeaders.Select(header =>
                            tr(
                                td[@class: "tableNameField"](header.Key), td(string.Join(", ", header.Value))))));

            return headerTable;
        }
    }

    private static dynamic GetStatsBar(PartialHttpResponse response)
    {
        var statusClass = response.StatusCode == 200 ? "statusSucceeded" : "statusFailed";

        return ul[id: "statsBar"](
            li(
                span[@class: $"statName"]("Status: "),
                span[@class: $"statValue {statusClass}"]($"{response.StatusCode} {response.ReasonPhrase}")),
            li(
                span[@class: "statName"]("Time: "),
                span[@class: "statValue"]($"{response.ElapsedMilliseconds:0.##} ms")),
            li(
                span[@class: "statName"]("Size: "),
                span[@class: "statValue"]($"{response.ContentByteLength ?? 0} bytes")));
    }
}
