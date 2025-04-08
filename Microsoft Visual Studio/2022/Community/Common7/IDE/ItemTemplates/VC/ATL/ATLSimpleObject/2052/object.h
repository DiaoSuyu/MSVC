// $header_file$: $class_name$ 的声明

#pragma once
[!if !DEVICE]
#include "resource.h"       // 主符号
[!else]
#ifdef STANDARDSHELL_UI_MODEL
#include "resource.h"
#endif
#ifdef POCKETPC2003_UI_MODEL
#include "resourceppc.h"
#endif
#ifdef SMARTPHONE2003_UI_MODEL
#include "resourcesp.h"
#endif
#ifdef AYGSHELL_UI_MODEL
#include "resourceayg.h"
#endif
[!endif]

[!if ADD_HANDLER_SUPPORT]
[!if PREVIEW_HANDLER && !HANDLER_DOCUMENT_NAME_SPECIFIED || PREVIEW_HANDLER && !HANDLER_VIEW_NAME_SPECIFIED || !MFC_SUPPORT]
#define AFX_PREVIEW_STANDALONE
[!endif]
#include <atlhandler.h>
#include <atlhandlerimpl.h>
[!if PREVIEW_HANDLER && HANDLER_VIEW_NAME_SPECIFIED && HANDLER_DOCUMENT_NAME_SPECIFIED]
#include <afxext.h>
[!endif]
[!if HANDLER_DOCUMENT_HEADER_SPECIFIED && !HANDLER_ATL_DOC_HEADER_FILE_SPECIFIED]
#include "$handler_document_filename$"
[!endif]
[!if HANDLER_VIEW_HEADER_SPECIFIED && !HANDLER_ATL_DOC_HEADER_FILE_SPECIFIED]
#include "$handler_view_filename$"
[!endif]
[!endif]

[!if HANDLER_ATL_DOC_HEADER_FILE_SPECIFIED && !HANDLER_DOCUMENT_HEADER_SPECIFIED]
#include "$handler_atl_doc_header_file$"
[!endif]

[!if !ATTRIBUTED]
#include "$midl_h_filename$"
[!if CONNECTION_POINTS]
#include "_$interface_name$Events_CP.h"
[!endif]
[!endif]

[!if ADD_HANDLER_SUPPORT && PREVIEW_HANDLER && !HANDLER_VIEW_NAME_SPECIFIED && !MFC_SUPPORT]
#include <atlpreviewctrlimpl.h>
[!endif]

[!if THREADING_SINGLE || THREADING_APARTMENT || THREADING_BOTH]

#if defined(_WIN32_WCE) && !defined(_CE_DCOM) && !defined(_CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA)
#error "Windows CE 平台(如不提供完全 DCOM 支持的 Windows Mobile 平台)上无法正确支持单线程 COM 对象。定义 _CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA 可强制 ATL 支持创建单线程 COM 对象实现并允许使用其单线程 COM 对象实现。rgs 文件中的线程模型已被设置为“Free”，原因是该模型是非 DCOM Windows CE 平台支持的唯一线程模型。"
#endif
[!endif]
[!if THREADING_NEUTRAL]
#ifdef _WIN32_WCE
#error "Windows CE 上不支持非特定语言线程的 COM 对象。"
#endif
[!endif]

using namespace ATL;
[!if ATTRIBUTED]

// $interface_name$
[
	object,
	uuid("$guid_interface_iid$]"),
[!if INTERFACE_DUAL]
	dual,
[!endif]
[!if AUTOMATION]
	oleautomation,
[!endif]
[!if INTERFACE_DUAL]
[!if AUTOMATION]
	nonextensible,
[!endif]
[!endif]
	pointer_default(unique)
]
__interface $interface_name$ : [!if INTERFACE_DUAL]IDispatch[!else]IUnknown[!endif]

{
};

[!if CONNECTION_POINTS]

// _$interface_name$事件
[
	dispinterface,
	uuid("$guid_connection_point_iid$")
]
__interface _$interface_name$Events
{
};
[!endif]
[!endif]

[!if ADD_HANDLER_SUPPORT && PREVIEW_HANDLER && !HANDLER_VIEW_NAME_SPECIFIED]
// $class_name$Ctrl 实现
[!if MFC_SUPPORT]
class $class_name$Ctrl : public IPreviewCtrl
{
protected:
	virtual void DoPaint(CPaintDC* pDC)
	{
		// 如果 CMyDoc 派生自 CDocument，则可以获取指向 IDocument 的指针，如下所示
		// CMyDoc* pDoc = (CMyDoc*)m_pDocument->GetContainer();

		CRect rectClient;
		GetClientRect(rectClient);
		pDC->FillSolidRect(rectClient, m_clrBackColor);

		CString strData = _T("在此处绘制丰富的预览内容。");
		pDC->TextOut(10, 20, strData, strData.GetLength());
	}
};
[!else]
class $class_name$Ctrl : public CAtlPreviewCtrlImpl
{
protected:
	virtual void DoPaint(HDC hdc)
	{
		// 可以获取指向 IDocument 的指针，如下所示
		// CMyDoc* pDoc = (CMyDoc*)m_pDocument;
		CString strData = _T("在此处绘制丰富的预览内容。");
		TextOut(hdc, 10, 20, strData, strData.GetLength());
	}
};
[!endif]
[!endif]

// $class_name$

[!if ATTRIBUTED]
[
	coclass,
	default($interface_name$[!if CONNECTION_POINTS], _$interface_name$Events[!endif]),
[!if THREADING_SINGLE]
	threading(single),
[!endif]
[!if THREADING_APARTMENT]
	threading(apartment),
[!endif]
[!if THREADING_BOTH]
	threading(both),
[!endif]
[!if THREADING_FREE]
	threading(free),
[!endif]
[!if THREADING_NEUTRAL]
	threading(neutral),
[!endif]
[!if SUPPORT_ERROR_INFO]
	support_error_info("$interface_name$"),
[!endif]
[!if CONNECTION_POINTS]
	event_source(com),
[!endif]
[!if AGGREGATION_NO]
	aggregatable(never),
[!endif]
[!if AGGREGATION_ONLY]
	aggregatable(always),
[!endif]
[!if PROGID_VALID]
	vi_progid("$version_independent_progid$"),
	progid("$progid$"),
[!endif]
	version(1.0),
	uuid("$guid_clsid$")
]
[!endif]
class ATL_NO_VTABLE $class_name$ :
[!if ATTRIBUTED]
[!if OBJECT_WITH_SITE]
	public IObjectWithSiteImpl<$class_name$>,
[!endif]
	public $interface_name$
[!else]
[!if THREADING_SINGLE]
	public CComObjectRootEx<CComSingleThreadModel>,
[!endif]
[!if THREADING_APARTMENT]
	public CComObjectRootEx<CComSingleThreadModel>,
[!endif]
[!if THREADING_FREE]
	public CComObjectRootEx<CComMultiThreadModel>,
[!endif]
[!if THREADING_BOTH]
	public CComObjectRootEx<CComMultiThreadModel>,
[!endif]
[!if THREADING_NEUTRAL]
	public CComObjectRootEx<CComMultiThreadModel>,
[!endif]
	public CComCoClass<$class_name$, &CLSID_$coclass$>,
[!if SUPPORT_ERROR_INFO]
	public ISupportErrorInfo,
[!endif]
[!if CONNECTION_POINTS]
	public IConnectionPointContainerImpl<$class_name$>,
	public CProxy_$interface_name$Events<$class_name$>,
[!endif]
[!if OBJECT_WITH_SITE]
	public IObjectWithSiteImpl<$class_name$>,
[!endif]
[!if !ADD_HANDLER_SUPPORT]
[!if INTERFACE_DUAL]
	public IDispatchImpl<$interface_name$, &IID_$interface_name$, &LIBID_$lib_name$, /*wMajor =*/ $typelib_version_major$, /*wMinor =*/ $typelib_version_minor$>
[!else]
	public $interface_name$
[!endif]
[!else]
[!if ADD_HANDLER_SUPPORT && PREVIEW_HANDLER]
	public CPreviewHandlerImpl <$class_name$>
[!endif]
[!if ADD_HANDLER_SUPPORT && SEARCH_HANDLER]
	public CSearchFilterImpl
[!endif]
[!if ADD_HANDLER_SUPPORT && THUMBNAIL_PROVIDER_HANDLER]
	public CThumbnailProviderImpl
[!endif]
[!endif]
[!endif]
{
public:
	$class_name$()
	{
[!if FREE_THREADED_MARSHALER]
		m_pUnkMarshaler = nullptr;
[!endif]
	}

[!if !ATTRIBUTED]
[!if !DEVICE]
DECLARE_REGISTRY_RESOURCEID($rgs_id$)
[!else]
[!if SUPPORT_NON_DCOM]
#ifndef _CE_DCOM
DECLARE_REGISTRY_RESOURCEID($rgs_id$)
#endif
[!endif]
[!endif]

[!if AGGREGATION_NO]
DECLARE_NOT_AGGREGATABLE($class_name$)
[!endif]
[!if AGGREGATION_ONLY]
DECLARE_ONLY_AGGREGATABLE($class_name$)
[!endif]

BEGIN_COM_MAP($class_name$)
[!if !ADD_HANDLER_SUPPORT]
	COM_INTERFACE_ENTRY($interface_name$)
[!endif]
[!if INTERFACE_DUAL]
	COM_INTERFACE_ENTRY(IDispatch)
[!endif]
[!if SUPPORT_ERROR_INFO]
	COM_INTERFACE_ENTRY(ISupportErrorInfo)
[!endif]
[!if CONNECTION_POINTS]
	COM_INTERFACE_ENTRY(IConnectionPointContainer)
[!endif]
[!if OBJECT_WITH_SITE]
	COM_INTERFACE_ENTRY(IObjectWithSite)
[!endif]
[!if FREE_THREADED_MARSHALER]
	COM_INTERFACE_ENTRY_AGGREGATE(IID_IMarshal, m_pUnkMarshaler.p)
[!endif]
[!if ADD_HANDLER_SUPPORT && PREVIEW_HANDLER]
[!if !OBJECT_WITH_SITE]
	COM_INTERFACE_ENTRY(IObjectWithSite)
[!endif]
	COM_INTERFACE_ENTRY(IOleWindow)
	COM_INTERFACE_ENTRY(IInitializeWithStream)
	COM_INTERFACE_ENTRY(IPreviewHandler)
	COM_INTERFACE_ENTRY(IPreviewHandlerVisuals)
[!endif]
[!if ADD_HANDLER_SUPPORT && SEARCH_HANDLER]
	COM_INTERFACE_ENTRY(IPersistStream)
	COM_INTERFACE_ENTRY(IPersistFile)
	COM_INTERFACE_ENTRY(IFilter)
[!endif]
[!if ADD_HANDLER_SUPPORT && THUMBNAIL_PROVIDER_HANDLER]
	COM_INTERFACE_ENTRY(IInitializeWithStream)
	COM_INTERFACE_ENTRY(IThumbnailProvider)
[!endif]
END_COM_MAP()

[!if CONNECTION_POINTS]
BEGIN_CONNECTION_POINT_MAP($class_name$)
	CONNECTION_POINT_ENTRY(__uuidof(_$interface_name$Events))
END_CONNECTION_POINT_MAP()
[!endif]
[!if SUPPORT_ERROR_INFO]
// ISupportsErrorInfo
	STDMETHOD(InterfaceSupportsErrorInfo)(REFIID riid);
[!endif]
[!else]
[!if CONNECTION_POINTS]
	__event __interface _$interface_name$Events;
[!endif]
[!endif]

[!if FREE_THREADED_MARSHALER]

	DECLARE_PROTECT_FINAL_CONSTRUCT()
	DECLARE_GET_CONTROLLING_UNKNOWN()

	HRESULT FinalConstruct()
	{
		return CoCreateFreeThreadedMarshaler(
			GetControllingUnknown(), &m_pUnkMarshaler.p);
	}

	void FinalRelease()
	{
[!if ADD_HANDLER_SUPPORT && PREVIEW_HANDLER]
		CPreviewHandlerImpl<$class_name$>::FinalRelease();
[!endif]
[!if ADD_HANDLER_SUPPORT && SEARCH_HANDLER]
		CSearchFilterImpl::FinalRelease();
[!endif]
[!if ADD_HANDLER_SUPPORT && THUMBNAIL_PROVIDER_HANDLER]
		CThumbnailProviderImpl::FinalRelease();
[!endif]
		m_pUnkMarshaler.Release();
	}

	CComPtr<IUnknown> m_pUnkMarshaler;
[!else]

	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
[!if ADD_HANDLER_SUPPORT && PREVIEW_HANDLER]
		CPreviewHandlerImpl<$class_name$>::FinalRelease();
[!endif]
[!if ADD_HANDLER_SUPPORT && SEARCH_HANDLER]
		CSearchFilterImpl::FinalRelease();
[!endif]
[!if ADD_HANDLER_SUPPORT && THUMBNAIL_PROVIDER_HANDLER]
		CThumbnailProviderImpl::FinalRelease();
[!endif]
	}
[!endif]

public:
[!if ADD_HANDLER_SUPPORT && SEARCH_HANDLER]
	// IPersistStream 实现
	IFACEMETHODIMP GetClassID(CLSID* pClassID)
	{
		*pClassID = CLSID_$coclass$;
		return S_OK;
	};
[!endif]

[!if ADD_HANDLER_SUPPORT && PREVIEW_HANDLER]
protected:
[!if !HANDLER_VIEW_NAME_SPECIFIED]
	virtual IPreviewCtrl* CreatePreviewControl()
	{
		// 此类在此标头的开始位置定义
		$class_name$Ctrl *pPreviewCtrl = nullptr;
		ATLTRY(pPreviewCtrl = new $class_name$Ctrl());
		return pPreviewCtrl;
	}
[!else]
[!if MFC_SUPPORT]
	virtual IPreviewCtrl* CreatePreviewControl()
	{
		// 在此处创建预览控件
		CMFCPreviewCtrlImpl *pPreviewCtrl = nullptr;
		ATLTRY(pPreviewCtrl = new CMFCPreviewCtrlImpl());
		return pPreviewCtrl;
	}
[!else]
	virtual IPreviewCtrl* CreatePreviewControl()
	{
		// 从 IPreviewCtrl 派生一个类并在此对其进行实例化
		return nullptr;
	}
[!endif]
[!endif]
[!endif]

[!if ADD_HANDLER_SUPPORT && THUMBNAIL_PROVIDER_HANDLER]
protected:
	virtual HRESULT GetBitmap(UINT cx, HBITMAP *phbmp, WTS_ALPHATYPE *pdwAlpha)
	{
[!if HANDLER_DOCUMENT_NAME_SPECIFIED || HANDLER_ATL_DOC_CLASS_NAME_SPECIFIED]
		if (m_pDocument == nullptr)
		{
			return E_NOTIMPL;
		}

		// 实现 IDocument 派生类中的 OnDrawThumbnail
		static int const nDocDimensions = 256;
		DWORD dwAlpha = 0;
		if (!m_pDocument->GetThumbnail(nDocDimensions, phbmp, pdwAlpha))
		{
			return E_FAIL;
		}
[!else]
		// 修改此代码并根据文档数据创建位图
		static int const nDocDimensions = 256;
[!if MFC_SUPPORT]
		HDC hdc = ::GetDC(nullptr);
		CDC* pDC = CDC::FromHandle(hdc);
		CDC dc;
		CDC* pDrawDC = pDC;
		CBitmap* pOldBitmap = nullptr;
		CBitmap bitmap;

		// 此时您需要计算要在 Live Icon 上显示的文档区域
		CRect rectDocBounds = CRect(0, 0, nDocDimensions, nDocDimensions);

		if (dc.CreateCompatibleDC(pDC))
		{
			if (bitmap.CreateCompatibleBitmap(pDC, rectDocBounds.Width(), rectDocBounds.Height()))
			{
				pDrawDC = &dc;
				pOldBitmap = dc.SelectObject(&bitmap);
			}
		}
		else
		{
			::ReleaseDC(nullptr, hdc);
			return E_FAIL;
		}

		dc.SelectObject(&bitmap);

		// 此时您需要绘制文档的数据
		pDrawDC->FillSolidRect(rectDocBounds, RGB (255, 255, 255));
		CString strText = _T("TODO:  在此处实现缩略图绘制");

		LOGFONT lf;

		CFont* pDefaultGUIFont = CFont::FromHandle((HFONT)GetStockObject(DEFAULT_GUI_FONT));
		pDefaultGUIFont->GetLogFont(&lf);
		lf.lfHeight = 36;

		CFont fontDraw;
		fontDraw.CreateFontIndirect(&lf);

		CFont* pOldFont = pDrawDC->SelectObject(&fontDraw);
		pDrawDC->DrawText(strText, rectDocBounds, DT_CENTER | DT_WORDBREAK);
		pDrawDC->SelectObject(pOldFont);

		if (pDrawDC != pDC)
		{
			dc.SelectObject(pOldBitmap);
		}

		::ReleaseDC (nullptr, hdc);
		*phbmp = (HBITMAP)bitmap.Detach ();
[!else]
		HDC hdc = ::GetDC(nullptr);
		RECT rcBounds;

		SetRect(&rcBounds, 0, 0, nDocDimensions, nDocDimensions);

		HDC hDrawDC = CreateCompatibleDC(hdc);
		if (hDrawDC == nullptr)
		{
			ReleaseDC(nullptr, hdc);
			return E_FAIL;
		}

		HBITMAP hBmp = CreateCompatibleBitmap(hDrawDC, nDocDimensions, nDocDimensions);
		if (hBmp == nullptr)
		{
			ReleaseDC(nullptr, hdc);
			DeleteDC(hDrawDC);
			return E_FAIL;
		}

		HBITMAP hOldBitmap = (HBITMAP) SelectObject(hDrawDC, hBmp);

		// 此时您需要绘制文档的数据
		HBRUSH hDrawBrush = CreateSolidBrush(RGB(255, 255, 255));
		FillRect(hDrawDC, &rcBounds, hDrawBrush);


		HFONT hStockFont = (HFONT) GetStockObject(DEFAULT_GUI_FONT);
		LOGFONT lf;

		GetObject(hStockFont, sizeof(LOGFONT), &lf);
		lf.lfHeight = 34;

		HFONT hDrawFont = CreateFontIndirect(&lf);
		HFONT hOldFont = (HFONT) SelectObject(hDrawDC, hDrawFont);

		CString strText = _T("TODO:  在此处实现缩略图绘制");
		DrawText(hDrawDC, strText, strText.GetLength(), &rcBounds, DT_CENTER | DT_WORDBREAK);

		SelectObject(hDrawDC, hDrawFont);
		SelectObject(hDrawDC, hOldFont);
		SelectObject(hDrawDC, hOldBitmap);

		DeleteObject(hDrawBrush);
		DeleteObject(hDrawFont);
		DeleteDC(hDrawDC);
		ReleaseDC(nullptr, hdc);

		*phbmp = hBmp;
[!endif]
[!endif]
		return S_OK;

	}
[!endif]

[!if ADD_HANDLER_SUPPORT]
[!if !HANDLER_DOCUMENT_NAME_SPECIFIED || HANDLER_GEN_ATL_DOC || HANDLER_ATL_DOC_CLASS_NAME_SPECIFIED]
protected:
	virtual IDocument* CreateDocument()
	{
[!if HANDLER_ATL_DOC_CLASS_NAME_SPECIFIED]
		$handler_atl_doc_class_name$ *pDocument = nullptr;
		ATLTRY(pDocument = new $handler_atl_doc_class_name$());
		return pDocument;
[!else]
		// 在此处修改此代码并创建文档
		return nullptr;
[!endif]
	}
[!else]
[!if MFC_SUPPORT]
	DECLARE_DOCUMENT($handler_document_name$)
[!else]
	virtual IDocument* CreateDocument()
	{
		$handler_document_name$ *pDocument = nullptr;
		ATLTRY(pDocument = new $handler_document_name$());
		return pDocument;
	}
[!endif]
[!endif]

[!if PREVIEW_HANDLER && HANDLER_VIEW_NAME_SPECIFIED && HANDLER_DOCUMENT_NAME_SPECIFIED && MFC_SUPPORT]
public:
	virtual HRESULT InitializeDocumentPreview(HWND hWndParent, RECT* prc)
	{
		m_pPreviewCtrl = CreatePreviewControl();
		CMFCPreviewCtrlImpl* pCtrl = DYNAMIC_DOWNCAST(CMFCPreviewCtrlImpl, (CObject*) m_pPreviewCtrl);
		if (pCtrl == nullptr)
		{
			ATLTRACE2(atlTraceGeneral, 4, L"InitializeDocumentPreview: 指向预览控件的指针为 NULL。\n");
			return E_POINTER;
		}

		ASSERT_VALID(pCtrl);

		CCreateContext ctx;
		ctx.m_pNewViewClass = RUNTIME_CLASS($handler_view_filename$);

		m_pDocument = CreateDocument();

		if (m_pDocument == nullptr)
		{
			ATLTRACE2(atlTraceGeneral, 4, L"InitializeDocumentPreview: pointer to document is null.\n");
			return E_POINTER;
		}

		m_pDocument->AddRef();
		ctx.m_pCurrentDoc = DYNAMIC_DOWNCAST($handler_document_name$, (CObject*) m_pDocument->GetContainer());

		if (!pCtrl->Create(hWndParent, prc, &ctx))
		{
			ATLTRACE2(atlTraceGeneral, 4, L"InitializeDocumentPreview: 预览控件创建失败。错误代码: %d\n", GetLastError());
			return E_FAIL;
		}
		return S_OK;
	}
[!endif]
[!endif]
};

[!if !ATTRIBUTED]
OBJECT_ENTRY_AUTO(__uuidof($coclass$), $class_name$)
[!endif]
