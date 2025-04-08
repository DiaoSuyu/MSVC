[!if DLL_APP]
// $projectname$.cpp: DLL 导出的实现。
[!else]
// $projectname$.cpp: WinMain 的实现
[!endif]

[!if SUPPORT_COMPLUS]
//
// 注意:  COM+ 1.0 信息: 
//      请记住运行 Microsoft Transaction Explorer 以安装组件。
//      默认情况下不进行注册。
[!endif]

#include "pch.h"
#include "framework.h"
#include "resource.h"
#include "$safeidlprojectname$_i.h"
[!if DLL_APP]
#include "dllmain.h"
[!endif]
[!if SUPPORT_COMPONENT_REGISTRAR]
#include "compreg.h"
[!endif]
[!if MERGE_PROXY_STUB]
#include "xdlldata.h"
[!endif]

[!if PREVIEW_HANDLER]
#include "PreviewHandler.h"
[!endif]
[!if THUMBNAIL_HANDLER]
#include "ThumbnailHandler.h"
[!endif]
[!if SEARCH_HANDLER]
#include "FilterHandler.h"
[!endif]

using namespace ATL;

[!if EXE_APP]

class $safeatlmodulename$ : public ATL::CAtlExeModuleT< $safeatlmodulename$ >
[!endif]
[!if SERVICE_APP]
#include <stdio.h>

class $safeatlmodulename$ : public ATL::CAtlServiceModuleT< $safeatlmodulename$, IDS_SERVICENAME >
[!endif]
[!if !DLL_APP]
{
public :
	DECLARE_LIBID(LIBID_$safeprojectname$Lib)
	DECLARE_REGISTRY_APPID_RESOURCEID(IDR_$safercprojectname$, "{$guid_libid$}")
	[!if SERVICE_APP]
	HRESULT InitializeSecurity() throw()
	{
		// TODO : 调用 CoInitializeSecurity 并为服务提供适当的安全设置
		// 建议 - PKT 级别的身份验证、
		// RPC_C_IMP_LEVEL_IDENTIFY 的模拟级别
		//以及适当的非 NULL 安全描述符。

		return S_OK;
	}
	[!endif]
};

$safeatlmodulename$ _AtlModule;

[!endif]
[!if DLL_APP]
// 用于确定 DLL 是否可由 OLE 卸载。
_Use_decl_annotations_
STDAPI DllCanUnloadNow(void)
{
	[!if MERGE_PROXY_STUB]
#ifdef _MERGE_PROXYSTUB
	HRESULT hr = PrxDllCanUnloadNow();
	if (hr != S_OK)
		return hr;
#endif
	[!endif]
	[!if SUPPORT_MFC]
	AFX_MANAGE_STATE(AfxGetStaticModuleState());
	return (AfxDllCanUnloadNow()==S_OK && _AtlModule.GetLockCount()==0) ? S_OK : S_FALSE;
	[!else]
	return _AtlModule.DllCanUnloadNow();
	[!endif]
}

// 返回一个类工厂以创建所请求类型的对象。
_Use_decl_annotations_
STDAPI DllGetClassObject(_In_ REFCLSID rclsid, _In_ REFIID riid, _Outptr_ LPVOID* ppv)
{
	[!if MERGE_PROXY_STUB]
#ifdef _MERGE_PROXYSTUB
	HRESULT hr = PrxDllGetClassObject(rclsid, riid, ppv);
	if (hr != CLASS_E_CLASSNOTAVAILABLE)
		return hr;
#endif
	[!endif]
	return _AtlModule.DllGetClassObject(rclsid, riid, ppv);
}

// DllRegisterServer - 向系统注册表中添加项。
_Use_decl_annotations_
STDAPI DllRegisterServer(void)
{
	// 注册对象、类型库和类型库中的所有接口
	HRESULT hr = _AtlModule.DllRegisterServer();
	[!if MERGE_PROXY_STUB]
#ifdef _MERGE_PROXYSTUB
	if (FAILED(hr))
		return hr;
	hr = PrxDllRegisterServer();
#endif
	[!endif]
	return hr;
}

// DllUnregisterServer - 移除系统注册表中的项。
_Use_decl_annotations_
STDAPI DllUnregisterServer(void)
{
	HRESULT hr = _AtlModule.DllUnregisterServer();
	[!if MERGE_PROXY_STUB]
#ifdef _MERGE_PROXYSTUB
	if (FAILED(hr))
		return hr;
	hr = PrxDllRegisterServer();
	if (FAILED(hr))
		return hr;
	hr = PrxDllUnregisterServer();
#endif
	[!endif]
	return hr;
}

// DllInstall - 按用户和计算机在系统注册表中逐一添加/移除项。
STDAPI DllInstall(BOOL bInstall, _In_opt_  LPCWSTR pszCmdLine)
{
	HRESULT hr = E_FAIL;
	static const wchar_t szUserSwitch[] = L"user";

	if (pszCmdLine != nullptr)
	{
		if (_wcsnicmp(pszCmdLine, szUserSwitch, _countof(szUserSwitch)) == 0)
		{
			ATL::AtlSetPerUserRegistration(true);
		}
	}

	if (bInstall)
	{
		hr = DllRegisterServer();
		if (FAILED(hr))
		{
			DllUnregisterServer();
		}
	}
	else
	{
		hr = DllUnregisterServer();
	}

	return hr;
}

[!endif]

[!if EXE_APP]

//
extern "C" int WINAPI _tWinMain(HINSTANCE /*hInstance*/, HINSTANCE /*hPrevInstance*/,
								LPTSTR /*lpCmdLine*/, int nShowCmd)
{
	return _AtlModule.WinMain(nShowCmd);
}

[!endif]
[!if SERVICE_APP]

//
extern "C" int WINAPI _tWinMain(HINSTANCE /*hInstance*/, HINSTANCE /*hPrevInstance*/,
								LPTSTR /*lpCmdLine*/, int nShowCmd)
{
	return _AtlModule.WinMain(nShowCmd);
}

[!endif]
