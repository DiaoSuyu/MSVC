#pragma once

#ifndef STRICT
#define STRICT
#endif

#include "targetver.h"

[!if SERVICE_APP]
#define _ATL_FREE_THREADED
[!else]
#define _ATL_APARTMENT_THREADED
[!endif]

#define _ATL_NO_AUTOMATIC_NAMESPACE

#define _ATL_CSTRING_EXPLICIT_CONSTRUCTORS	// 某些 CString 构造函数将是显式的

[!if PREVIEW_HANDLER || THUMBNAIL_HANDLER || SEARCH_HANDLER]
#ifdef _MANAGED
#error 不能作为托管程序集生成文件类型处理程序。  请在项目属性中将“公共语言运行时”选项设置为“没有 CLR 支持”。
#endif

#ifndef _UNICODE
#error 文件类型处理程序必须以 Unicode 的形式生成。  请在项目属性中将“字符集”选项设置为“Unicode”。
#endif

#define SHARED_HANDLERS

[!endif]
[!if SUPPORT_MFC]
#include <afxwin.h>
#include <afxext.h>
#include <afxole.h>
#include <afxodlgs.h>
#include <afxrich.h>
#include <afxhtml.h>
#include <afxcview.h>
#include <afxwinappex.h>
#include <afxframewndex.h>
#include <afxmdiframewndex.h>

#ifndef _AFX_NO_OLE_SUPPORT
#include <afxdisp.h>        // MFC 自动化类
#endif // _AFX_NO_OLE_SUPPORT
[!endif]
[!if SUPPORT_COMPLUS]

#include <comsvcs.h>
[!endif]

#define ATL_NO_ASSERT_ON_DESTROY_NONEXISTENT_WINDOW

#include "resource.h"
#include <atlbase.h>
#include <atlcom.h>
#include <atlctl.h>
