// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// -----------------------------------------------------------------------------

#ifndef __DIAGHUBCONTROL_H__
#define __DIAGHUBCONTROL_H__

#ifdef DIAGHUB_ENABLE_CONTROL
#include <Windows.h>
#include <assert.h>

#ifndef __IStandardCollectorHost2_FWD_DEFINED__
#define __IStandardCollectorHost2_FWD_DEFINED__
typedef interface IStandardCollectorHost2 IStandardCollectorHost2;
#endif 	/* __IStandardCollectorHost2_FWD_DEFINED__ */

typedef struct IStandardCollectorHost2Vtbl
{
    BEGIN_INTERFACE

    HRESULT(STDMETHODCALLTYPE *QueryInterface)(
        __RPC__in IStandardCollectorHost2 * This,
        /* [in] */ __RPC__in const IID * riid,
        /* [annotation][iid_is][out] */
        _COM_Outptr_  void **ppvObject);

    ULONG(STDMETHODCALLTYPE *AddRef)(
        __RPC__in IStandardCollectorHost2 * This);

    ULONG(STDMETHODCALLTYPE *Release)(
        __RPC__in IStandardCollectorHost2 * This);

    HRESULT(STDMETHODCALLTYPE *PostMessageToListener)(
        __RPC__in IStandardCollectorHost2 * This,
        /* [in] */ __RPC__in const GUID * sessionId,
        /* [in] */ __RPC__in const GUID * listenerId,
        /* [max_is][string][in] */ __RPC__in_ecount_full_string((1024 * 1024 / sizeof(wchar_t))) LPCOLESTR message);

    END_INTERFACE
} IStandardCollectorHost2Vtbl;

interface IStandardCollectorHost2
{
    CONST_VTBL struct IStandardCollectorHost2Vtbl *lpVtbl;
};

extern GUID __diagHubSessionId;
extern IStandardCollectorHost2 *__host;
extern BOOL __comInitialized;

#ifndef DIAGHUB_PFORCEINLINE
#if defined(PFORCEINLINE)
#define DIAGHUB_PFORCEINLINE PFORCEINLINE
#elif defined(FORCEINLINE)
#define DIAGHUB_PFORCEINLINE FORCEINLINE
#else
#define DIAGHUB_PFORCEINLINE __forceinline
#endif
#endif

DIAGHUB_PFORCEINLINE
void STDMETHODCALLTYPE DiagHubInitializeProfilingControl()
{
    if (__host != NULL || memcmp(&__diagHubSessionId, &GUID_NULL, sizeof(GUID)) != 0)
        return;

    const unsigned int guidCount = _countof(L"{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}");
    wchar_t sessionIdBuffer[_countof(L"{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}")];
    DWORD numChar = GetEnvironmentVariableW(L"DIAGHUB_SESSION_ID", sessionIdBuffer, _countof(sessionIdBuffer));
    if (numChar != guidCount - 1)
        return;

    HRESULT hr;
    hr = IIDFromString(sessionIdBuffer, &__diagHubSessionId);
    if (FAILED(hr))
        return;

    hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
    __comInitialized = SUCCEEDED(hr) ? TRUE : FALSE;
    if (FAILED(hr) && hr != RPC_E_CHANGED_MODE)
        return;

    const CLSID CLSID_StandardCollectorHost = { 0xF2DC0F57, 0x0B99, 0x49E3,{ 0xBE, 0x80, 0x93, 0x6D, 0xBA, 0xA5, 0x4E, 0xE0 } };
    const IID IID_IStandardCollectorHost2 = { 0x565FE060, 0xED72, 0x4E8E,{ 0xA0, 0x00, 0xC1, 0x21, 0x5E, 0x09, 0x18, 0xEA } };
#ifdef __cplusplus
    REFCLSID REFCLSID_StandardCollectorHost = CLSID_StandardCollectorHost;
    REFIID REFIID_IStandardCollectorHost2 = IID_IStandardCollectorHost2;
#else
    REFCLSID REFCLSID_StandardCollectorHost = &CLSID_StandardCollectorHost;
    REFIID REFIID_IStandardCollectorHost2 = &IID_IStandardCollectorHost2;
#endif

    hr = CoCreateInstance(
        REFCLSID_StandardCollectorHost,
        NULL,
        CLSCTX_LOCAL_SERVER,
        REFIID_IStandardCollectorHost2,
        (void**)&__host);

    assert(SUCCEEDED(hr) && "Failed to create Standard Collector host");
}

DIAGHUB_PFORCEINLINE
void STDMETHODCALLTYPE DiagHubShutDownProfilingControl()
{
    __diagHubSessionId = GUID_NULL;
    if (__host != NULL)
    {
        __host->lpVtbl->Release(__host);
        __host = NULL;
    }

    if (__comInitialized == TRUE)
    {
        CoUninitialize();
        __comInitialized = FALSE;
    }
}

DIAGHUB_PFORCEINLINE
void STDMETHODCALLTYPE DiagHubPostMessageToListener(_In_ GUID listenerId, _In_z_ LPOLESTR payload)
{
    if (__host == NULL)
        return;

    HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
    BOOL comInitialized = SUCCEEDED(hr) ? TRUE : FALSE;
    if (FAILED(hr) && hr != RPC_E_CHANGED_MODE)
        return;

    hr = __host->lpVtbl->PostMessageToListener(__host, &__diagHubSessionId, &listenerId, payload);
    if (comInitialized == TRUE)
        CoUninitialize();
}

#define DIAGHUB_DECLARE_CONTROL \
    GUID __diagHubSessionId; \
    IStandardCollectorHost2 *__host; \
    BOOL __comInitialized = FALSE;

#define DIAGHUB_INITIALIZE_PROFILING() DiagHubInitializeProfilingControl();
#define DIAGHUB_SHUTDOWN_PROFILING() DiagHubShutDownProfilingControl();

#else

#define DIAGHUB_DECLARE_CONTROL ;

#define DIAGHUB_INITIALIZE_PROFILING() do {} while(0);
#define DIAGHUB_SHUTDOWN_PROFILING() do {} while(0);

#endif /* DIAGHUB_ENABLE_CONTROL */

#endif /* __DIAGHUBCONTROL_H__ */