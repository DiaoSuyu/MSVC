// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// -----------------------------------------------------------------------------

#ifndef __DIAGHUBTRACE_H__
#define __DIAGHUBTRACE_H__

/* The Diagnostic Hub reserves event IDs of 0 and in the range [0x8000, 0xffff] */
#define DIAGHUB_FIRST_VALID_ID 1
#define DIAGHUB_MAX_VALID_ID 0x7fff

#ifdef DIAGHUB_ENABLE_TRACE_SYSTEM

typedef struct ____DiagHubTraceRegistration
{
    REGHANDLE RegHandle;
    int Flags;
} ___DiagHubTraceRegistration;

#define DIAGHUB_DECLARE_TRACE \
/* F9189F8A-0753-4A70-AD66-D622D88DB986 */ \
GUID ____diagHubProviderId = { 0xF9189F8A, 0x0753, 0x4A70, { 0xAD, 0x66, 0xD6, 0x22, 0xD8, 0x8D, 0xB9, 0x86 } }; \
___DiagHubTraceRegistration ____diagHubTraceReg;

extern ___DiagHubTraceRegistration ____diagHubTraceReg;

#define DIAGHUB_TRACE_FLAG_STARTED 0x1
#define DIAGHUB_TRACE_STARTED ((____diagHubTraceReg.Flags & DIAGHUB_TRACE_FLAG_STARTED) != 0)

#define DIAGHUB_START_TRACE_SYSTEM() \
    if (ERROR_SUCCESS == EventRegister(&____diagHubProviderId, NULL, NULL, &____diagHubTraceReg.RegHandle)) \
    { ____diagHubTraceReg.Flags |= DIAGHUB_TRACE_FLAG_STARTED; }

#define DIAGHUB_STOP_TRACE_SYSTEM() \
    if (DIAGHUB_TRACE_STARTED) \
    { EventUnregister(____diagHubTraceReg.RegHandle); \
      ____diagHubTraceReg.Flags &= ~(DIAGHUB_TRACE_FLAG_STARTED); }

#ifndef DIAGHUB_PFORCEINLINE
#if defined(PFORCEINLINE)
#define DIAGHUB_PFORCEINLINE PFORCEINLINE
#elif defined(FORCEINLINE)
#define DIAGHUB_PFORCEINLINE FORCEINLINE
#else
#define DIAGHUB_PFORCEINLINE __forceinline
#endif
#endif

/* The max size limit of an ETW payload is 64k, but that includes the header.
   We take off a bit for ourselves. */
#define MAX_MSG_SIZE_IN_BYTES (63 * 1024)

DIAGHUB_PFORCEINLINE
void
DiagHubFireUserEventIdNameMap(
    USHORT id,
    _In_z_ LPCWSTR nameWideString
)
{
    assert(id <= DIAGHUB_MAX_VALID_ID && "Invalid ID");
    assert(NULL != nameWideString && (2 * wcslen(nameWideString)) < MAX_MSG_SIZE_IN_BYTES && "Invalid string argument");

    EVENT_DESCRIPTOR evtDesc;
    EVENT_DATA_DESCRIPTOR evtDataDesc[2];
    /* Include the null in the length */
    size_t nameLenInBytes = 2 * (wcslen(nameWideString) + 1);

    /* Event ID to name mapping event is max USHORT */
    EventDescCreate(&evtDesc, (USHORT)0xffff, 1, 0, 4, 0, 0, 0x1); /* 4 = TRACE_LEVEL_INFORMATION */

    EventDataDescCreate(&evtDataDesc[0], &id, sizeof(id));
    EventDataDescCreate(&evtDataDesc[1], nameWideString, (ULONG)nameLenInBytes);

    EventWrite(____diagHubTraceReg.RegHandle, &evtDesc, ARRAYSIZE(evtDataDesc), evtDataDesc);
}

DIAGHUB_PFORCEINLINE
void
DiagHubFireUserEventWithString(
    USHORT id,
    _In_opt_z_ LPCWSTR markWideString
)
{
    assert(id <= DIAGHUB_MAX_VALID_ID && "Invalid ID");

    EVENT_DESCRIPTOR evtDesc;
    EVENT_DATA_DESCRIPTOR evtDataDesc;
    /* Include the null in the length if the string is not null */
    size_t strLenInBytes = NULL == markWideString ? 0 : (2 * (wcslen(markWideString) + 1));
    assert(strLenInBytes < MAX_MSG_SIZE_IN_BYTES && "Invalid string argument");

    EventDescCreate(&evtDesc, id, 1, 0, 4, 0, 0, 0x1); /* 4 = TRACE_LEVEL_INFORMATION */
    EventDataDescCreate(&evtDataDesc, markWideString, (ULONG)strLenInBytes);
    EventWrite(____diagHubTraceReg.RegHandle, &evtDesc, 1, &evtDataDesc);
}

#define DIAGHUB_DEFINE_ID_NAME(id, nameWideString) \
    if (DIAGHUB_TRACE_STARTED) \
    { assert(id <= DIAGHUB_MAX_VALID_ID && "Invalid ID"); \
      DiagHubFireUserEventIdNameMap((USHORT)id, nameWideString); }

#define DIAGHUB_INSERT_MARK(id) \
    if (DIAGHUB_TRACE_STARTED) \
    { assert(DIAGHUB_FIRST_VALID_ID <= id && id <= DIAGHUB_MAX_VALID_ID && "Invalid ID"); \
      DiagHubFireUserEventWithString((USHORT)id, NULL); }

#define DIAGHUB_INSERT_MARK_WITH_MESSAGE(id, markWideString) \
    if (DIAGHUB_TRACE_STARTED) \
    { assert(DIAGHUB_FIRST_VALID_ID <= id && id <= DIAGHUB_MAX_VALID_ID && "Invalid ID"); \
      DiagHubFireUserEventWithString((USHORT)id, markWideString); }

#define DIAGHUB_INSERT_MESSAGE(markWideString) \
    if (DIAGHUB_TRACE_STARTED) \
    { DiagHubFireUserEventWithString((USHORT)0, markWideString); }

#else

#define DIAGHUB_DECLARE_TRACE ;
#define DIAGHUB_TRACE_STARTED (0)

#define DIAGHUB_START_TRACE_SYSTEM() do {} while(0);
#define DIAGHUB_STOP_TRACE_SYSTEM() do {} while(0);

#define DIAGHUB_DEFINE_ID_NAME(i, n) do {} while(0);
#define DIAGHUB_INSERT_MARK(i) do {} while(0);
#define DIAGHUB_INSERT_MARK_WITH_MESSAGE(i, m) do {} while(0);
#define DIAGHUB_INSERT_MESSAGE(m) do {} while(0);

#endif

#endif /* __DIAGHUBTRACE_H__ */
