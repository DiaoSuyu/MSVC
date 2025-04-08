// dllmain.cpp: DllMain 的实现。

#include "pch.h"
#include "framework.h"
#include "resource.h"
#include "$safeidlprojectname$_i.h"
#include "dllmain.h"
[!if SUPPORT_COMPONENT_REGISTRAR]
#include "compreg.h"
[!endif]
[!if MERGE_PROXY_STUB]
#include "xdlldata.h"
[!endif]

$safeatlmodulename$ _AtlModule;

[!if SUPPORT_MFC]
class $safemfcappname$ : public CWinApp
{
public:

// 重写
	virtual BOOL InitInstance();
	virtual int ExitInstance();

	DECLARE_MESSAGE_MAP()
};

BEGIN_MESSAGE_MAP($safemfcappname$, CWinApp)
END_MESSAGE_MAP()

$safemfcappname$ theApp;

BOOL $safemfcappname$::InitInstance()
{
[!if MERGE_PROXY_STUB]
#ifdef _MERGE_PROXYSTUB
	if (!PrxDllMain(m_hInstance, DLL_PROCESS_ATTACH, nullptr))
		return FALSE;
#endif
[!endif]
	return CWinApp::InitInstance();
}

int $safemfcappname$::ExitInstance()
{
	return CWinApp::ExitInstance();
}
[!else]
// DLL 入口点
extern "C" BOOL WINAPI DllMain(HINSTANCE hInstance, DWORD dwReason, LPVOID lpReserved)
{
[!if MERGE_PROXY_STUB]
#ifdef _MERGE_PROXYSTUB
	if (!PrxDllMain(hInstance, dwReason, lpReserved))
		return FALSE;
#endif
[!endif]
	hInstance;
	return _AtlModule.DllMain(dwReason, lpReserved);
}
[!endif]
