// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// -----------------------------------------------------------------------------

#ifndef __CPUSAMPLINGCONTROL_H__
#define __CPUSAMPLINGCONTROL_H__

#include "DiagHubControl.h"

#ifdef DIAGHUB_ENABLE_CONTROL
#include <Windows.h>
#include <wchar.h>

// {4EA90761-2248-496C-B854-3C0399A591A4}
#define DIAGHUB_CPUSAMPLING_AGENT { 0x4ea90761, 0x2248, 0x496c,{ 0xb8, 0x54, 0x3c, 0x03, 0x99, 0xa5, 0x91, 0xa4 } }
#define DIAGHUB_CPUSAMPLING_MSG L"{\"command\":\"%s\",\"pid\":%u}"

DIAGHUB_PFORCEINLINE
void STDMETHODCALLTYPE CpuSamplingStart()
{
    const GUID agentId = DIAGHUB_CPUSAMPLING_AGENT;
    const wchar_t enableCommand[] = L"enableAgent";
    wchar_t message[_countof(DIAGHUB_CPUSAMPLING_MSG) + _countof(enableCommand) + _countof(L"4294967295")];
    swprintf_s(message, _countof(message), DIAGHUB_CPUSAMPLING_MSG, enableCommand, GetCurrentProcessId());
    DiagHubPostMessageToListener(agentId, message);
}

DIAGHUB_PFORCEINLINE
void STDMETHODCALLTYPE CpuSamplingStop()
{
    const GUID agentId = DIAGHUB_CPUSAMPLING_AGENT;
    const wchar_t disableCommand[] = L"disableAgent";
    wchar_t message[_countof(DIAGHUB_CPUSAMPLING_MSG) + _countof(disableCommand) + _countof(L"4294967295")];
    swprintf_s(message, _countof(message), DIAGHUB_CPUSAMPLING_MSG, disableCommand, GetCurrentProcessId());
    DiagHubPostMessageToListener(agentId, message);
}

#define DIAGHUB_CPUSAMPLING_START() CpuSamplingStart();
#define DIAGHUB_CPUSAMPLING_STOP() CpuSamplingStop();

#else

#define DIAGHUB_CPUSAMPLING_START() do {} while(0);
#define DIAGHUB_CPUSAMPLING_STOP() do {} while(0);

#endif /* DIAGHUB_ENABLE_CONTROL */

#endif /* __CPUSAMPLINGCONTROL_H__ */