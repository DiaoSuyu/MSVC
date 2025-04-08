// $header_file$: $class_name$ 的声明
#pragma once
[!if !DEVICE]
#include "resource.h"       // 主符号
[!else]

[!if STANDARDSHELL_UI_MODEL]
#ifdef STANDARDSHELL_UI_MODEL
#include "resource.h"
#endif
[!endif]

[!if POCKETPC2003_UI_MODEL]
#ifdef POCKETPC2003_UI_MODEL
#include "resourceppc.h"
#endif
[!endif]

[!if SMARTPHONE2003_UI_MODEL]
#ifdef SMARTPHONE2003_UI_MODEL
#include "resourcesp.h"
#endif
[!endif]

[!if AYGSHELL_UI_MODEL]
#ifdef AYGSHELL_UI_MODEL
#include "resourceayg.h"
#endif
[!endif]

[!endif]
#include <atlctl.h>
[!if !ATTRIBUTED]
#include "$midl_h_filename$"
[!if CONNECTION_POINTS]
#include "_$interface_name$Events_CP.h"
[!endif]
[!endif]
[!if !HTML_CONTROL && !COMPOSITE_CONTROL]
[!if USE_COMMON_CONTROLS || USE_COMMON_CONTROLS_EX]
#include <commctrl.h>
[!endif]
[!if SUBCLASS_RICHEDIT]
#ifndef _WIN32_WCE
#include <richedit.h>
#endif
[!endif]
[!endif]

[!if !HTML_CONTROL]
#if defined(_WIN32_WCE) && !defined(_CE_DCOM) && !defined(_CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA)
#error "Windows CE 平台(如不提供完全 DCOM 支持的 Windows Mobile 平台)上无法正确支持单线程 COM 对象。定义 _CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA 可强制 ATL 支持创建单线程 COM 对象实现并允许使用其单线程 COM 对象实现。rgs 文件中的线程模型已被设置为“Free”，原因是该模型是非 DCOM Windows CE 平台支持的唯一线程模型。"
#endif
[!else]
#ifdef _WIN32_WCE
#error "ATL 不支持 Windows CE 的 HTML 控件。"
#endif
[!endif]

using namespace ATL;

[!if HTML_CONTROL]
[!if ATTRIBUTED]
[
	object,
	dual,
	uuid($guid_interfaceui_iid$),
	pointer_default(unique)
]
__interface $interface_name$UI : IDispatch
{
	// 将由 HTML 调用的示例方法
	[id(1)] HRESULT OnClick([in]IDispatch* pdispBody, [in]VARIANT varColor);
};
[
	coclass,
	threading(single),
	version(1.0),
	uuid("$guid_object_ui$"),
	noncreatable
]
[!endif]
class ATL_NO_VTABLE $class_name$UI :
[!if ATTRIBUTED]
	public $interface_name$UI
{
[!else]
	public IDispatchImpl<$interface_name$UI, &IID_$interface_name$UI, &LIBID_$lib_name$, /*wMajor =*/ $typelib_version_major$, /*wMinor =*/ $typelib_version_minor$>,
	public CComObjectRootEx<CComSingleThreadModel>
{
BEGIN_COM_MAP($class_name$UI)
	COM_INTERFACE_ENTRY($interface_name$UI)
	COM_INTERFACE_ENTRY(IDispatch)
END_COM_MAP()
// $interface_name$
[!endif]
public:
	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
	}

	// 由 HTML 调用以更改 <BODY> 背景色的示例方法
	STDMETHOD(OnClick)(IDispatch* pdispBody, VARIANT varColor)
	{
		CComQIPtr<IHTMLBodyElement> spBody(pdispBody);
		if (spBody != nullptr)
			spBody->put_bgColor(varColor);
		return S_OK;
	}
};

[!endif]
[!if LICENSED]

class $class_name$Lic
{
protected:
	static BOOL VerifyLicenseKey(BSTR bstr)
	{
		return !lstrcmpW(bstr, L"$short_name$ 许可证");
	}

	static BOOL GetLicenseKey(DWORD dwReserved, BSTR* pBstr)
	{
		if( pBstr == nullptr )
 		return FALSE;
		*pBstr = SysAllocString(L"$short_name$ 许可证");
		return TRUE;
	}

	static BOOL IsLicenseValid()
	{
		return TRUE;
	}
};
[!endif]

[!if ATTRIBUTED]

// $interface_name$
[
	object,
	uuid($guid_interface_iid$),
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
__interface $interface_name$ : public [!if INTERFACE_DUAL]IDispatch[!else]IUnknown[!endif]

{
[!if AUTOSIZE]
	[propput, bindable, requestedit, id(DISPID_AUTOSIZE)]
	HRESULT AutoSize([in]VARIANT_BOOL vbool);
	[propget, bindable, requestedit, id(DISPID_AUTOSIZE)]
	HRESULT AutoSize([out,retval]VARIANT_BOOL* pbool);
[!endif]
[!if BACKCOLOR]
#ifndef _WIN32_WCE
	[propput, bindable, requestedit, id(DISPID_BACKCOLOR)]
	HRESULT BackColor([in]OLE_COLOR clr);
	[propget, bindable, requestedit, id(DISPID_BACKCOLOR)]
	HRESULT BackColor([out,retval]OLE_COLOR* pclr);
#endif
[!endif]
[!if BACKSTYLE]
	[propput, bindable, requestedit, id(DISPID_BACKSTYLE)]
	HRESULT BackStyle([in]long style);
	[propget, bindable, requestedit, id(DISPID_BACKSTYLE)]
	HRESULT BackStyle([out,retval]long* pstyle);
[!endif]
[!if BORDERCOLOR]
#ifndef _WIN32_WCE
	[propput, bindable, requestedit, id(DISPID_BORDERCOLOR)]
	HRESULT BorderColor([in]OLE_COLOR clr);
	[propget, bindable, requestedit, id(DISPID_BORDERCOLOR)]
	HRESULT BorderColor([out, retval]OLE_COLOR* pclr);
#endif
[!endif]
[!if BORDERSTYLE]
	[propput, bindable, requestedit, id(DISPID_BORDERSTYLE)]
	HRESULT BorderStyle([in]long style);
	[propget, bindable, requestedit, id(DISPID_BORDERSTYLE)]
	HRESULT BorderStyle([out, retval]long* pstyle);
[!endif]
[!if BORDERWIDTH]
	[propput, bindable, requestedit, id(DISPID_BORDERWIDTH)]
	HRESULT BorderWidth([in]long width);
	[propget, bindable, requestedit, id(DISPID_BORDERWIDTH)]
	HRESULT BorderWidth([out, retval]long* width);
[!endif]
[!if DRAWMODE]
	[propput, bindable, requestedit, id(DISPID_DRAWMODE)]
	HRESULT DrawMode([in]long mode);
	[propget, bindable, requestedit, id(DISPID_DRAWMODE)]
	HRESULT DrawMode([out, retval]long* pmode);
[!endif]
[!if DRAWSTYLE]
	[propput, bindable, requestedit, id(DISPID_DRAWSTYLE)]
	HRESULT DrawStyle([in]long style);
	[propget, bindable, requestedit, id(DISPID_DRAWSTYLE)]
	HRESULT DrawStyle([out, retval]long* pstyle);
[!endif]
[!if DRAWWIDTH]
	[propput, bindable, requestedit, id(DISPID_DRAWWIDTH)]
	HRESULT DrawWidth([in]long width);
	[propget, bindable, requestedit, id(DISPID_DRAWWIDTH)]
	HRESULT DrawWidth([out, retval]long* pwidth);
[!endif]
[!if FILLCOLOR]
#ifndef _WIN32_WCE
	[propput, bindable, requestedit, id(DISPID_FILLCOLOR)]
	HRESULT FillColor([in]OLE_COLOR clr);
	[propget, bindable, requestedit, id(DISPID_FILLCOLOR)]
	HRESULT FillColor([out, retval]OLE_COLOR* pclr);
#endif
[!endif]
[!if FILLSTYLE]
	[propput, bindable, requestedit, id(DISPID_FILLSTYLE)]
	HRESULT FillStyle([in]long style);
	[propget, bindable, requestedit, id(DISPID_FILLSTYLE)]
	HRESULT FillStyle([out, retval]long* pstyle);
[!endif]
[!if FONT]
#ifndef _WIN32_WCE
	[propputref, bindable, requestedit, id(DISPID_FONT)]
	HRESULT Font([in]IFontDisp* pFont);
	[propput, bindable, requestedit, id(DISPID_FONT)]
	HRESULT Font([in]IFontDisp* pFont);
	[propget, bindable, requestedit, id(DISPID_FONT)]
	HRESULT Font([out, retval]IFontDisp** ppFont);
#endif
[!endif]
[!if FORECOLOR]
#ifndef _WIN32_WCE
	[propput, bindable, requestedit, id(DISPID_FORECOLOR)]
	HRESULT ForeColor([in]OLE_COLOR clr);
	[propget, bindable, requestedit, id(DISPID_FORECOLOR)]
	HRESULT ForeColor([out,retval]OLE_COLOR* pclr);
#endif
[!endif]
[!if ENABLED]
	[propput, bindable, requestedit, id(DISPID_ENABLED)]
	HRESULT Enabled([in]VARIANT_BOOL vbool);
	[propget, bindable, requestedit, id(DISPID_ENABLED)]
	HRESULT Enabled([out,retval]VARIANT_BOOL* pbool);
[!endif]
[!if HWND]
	[propget, bindable, requestedit, id(DISPID_HWND)]
	HRESULT HWND([out, retval]long* pHWND);
[!endif]
[!if TABSTOP]
	[propput, bindable, requestedit, id(DISPID_TABSTOP)]
	HRESULT TabStop([in]VARIANT_BOOL vbool);
	[propget, bindable, requestedit, id(DISPID_TABSTOP)]
	HRESULT TabStop([out, retval]VARIANT_BOOL* pbool);
[!endif]
[!if TEXT]
	[propput, bindable, requestedit, id(DISPID_TEXT)]
	HRESULT Text([in]BSTR strText);
	[propget, bindable, requestedit, id(DISPID_TEXT)]
	HRESULT Text([out, retval]BSTR* pstrText);
[!endif]
[!if CAPTION]
	[propput, bindable, requestedit, id(DISPID_CAPTION)]
	HRESULT Caption([in]BSTR strCaption);
	[propget, bindable, requestedit, id(DISPID_CAPTION)]
	HRESULT Caption([out,retval]BSTR* pstrCaption);
[!endif]
[!if BORDERVISIBLE]
	[propput, bindable, requestedit, id(DISPID_BORDERVISIBLE)]
	HRESULT BorderVisible([in]VARIANT_BOOL vbool);
	[propget, bindable, requestedit, id(DISPID_BORDERVISIBLE)]
	HRESULT BorderVisible([out, retval]VARIANT_BOOL* pbool);
[!endif]
[!if APPEARANCE]
	[propput, bindable, requestedit, id(DISPID_APPEARANCE)]
	HRESULT Appearance([in]short nAppearance);
	[propget, bindable, requestedit, id(DISPID_APPEARANCE)]
	HRESULT Appearance([out, retval]short* pnAppearance);
[!endif]
[!if MOUSEPOINTER]
	[propput, bindable, requestedit, id(DISPID_MOUSEPOINTER)]
	HRESULT MousePointer([in]long pointer);
	[propget, bindable, requestedit, id(DISPID_MOUSEPOINTER)]
	HRESULT MousePointer([out, retval]long* ppointer);
[!endif]
[!if MOUSEICON]
#ifndef _WIN32_WCE
	[propputref, bindable, requestedit, id(DISPID_MOUSEICON)]
	HRESULT MouseIcon([in]IPictureDisp* pMouseIcon);
	[propput, bindable, requestedit, id(DISPID_MOUSEICON)]
	HRESULT MouseIcon([in]IPictureDisp* pMouseIcon);
	[propget, id(DISPID_MOUSEICON)]
	HRESULT MouseIcon([out, retval]IPictureDisp** ppMouseIcon);
#endif
[!endif]
[!if PICTURE]
#ifndef _WIN32_WCE
	[propputref, bindable, requestedit, id(DISPID_PICTURE)]
	HRESULT Picture([in]IPictureDisp* pPicture);
	[propput, bindable, requestedit, id(DISPID_PICTURE)]
	HRESULT Picture([in]IPictureDisp* pPicture);
	[propget, bindable, requestedit, id(DISPID_PICTURE)]
	HRESULT Picture([out, retval]IPictureDisp** ppPicture);
#endif
[!endif]
[!if VALID]
	[propput, bindable, requestedit, id(DISPID_VALID)]
	HRESULT Valid([in]VARIANT_BOOL vbool);
	[propget, bindable, requestedit, id(DISPID_VALID)]
	HRESULT Valid([out, retval]VARIANT_BOOL* pbool);
[!endif]
[!if READYSTATE]
	[propput, bindable, requestedit, id(DISPID_READYSTATE)]
	HRESULT ReadyState([in]long state);
	[propget, bindable, requestedit, id(DISPID_READYSTATE)]
	HRESULT ReadyState([out, retval]long* pstate);
[!endif]
};

[!if CONNECTION_POINTS]

// _$interface_name$事件
[
	uuid("$guid_connection_point_iid$"),
	dispinterface
]
__interface _$interface_name$Events
{
};
[!endif]
[!endif]

// $class_name$
[!if ATTRIBUTED]
[
	coclass,
	control,
	default($interface_name$[!if CONNECTION_POINTS], _$interface_name$Events[!endif]),
	threading(single),
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
	uuid("$guid_clsid$"),
[!if CONNECTION_POINTS]
	event_source(com),
[!endif]
[!if SUPPORT_ERROR_INFO]
	support_error_info($interface_name$),
[!endif]
	registration_script("control.rgs")
]
[!endif]
class ATL_NO_VTABLE $class_name$ :
[!if !ATTRIBUTED]
	public CComObjectRootEx<CComSingleThreadModel>,
[!endif]
[!if STOCK_PROPERTIES]
	public CStockPropImpl<$class_name$, $interface_name$>,
[!else]
[!if ATTRIBUTED]
	public $interface_name$,
[!else]
[!if INTERFACE_DUAL]
	public IDispatchImpl<$interface_name$, &IID_$interface_name$, &LIBID_$lib_name$, /*wMajor =*/ $typelib_version_major$, /*wMinor =*/ $typelib_version_minor$>,
[!else]
	public $interface_name$,
[!endif]
[!endif]
[!endif]
[!if PERSIST_STREAM_INIT]
	public IPersistStreamInitImpl<$class_name$>,
[!endif]
	public IOleControlImpl<$class_name$>,
	public IOleObjectImpl<$class_name$>,
	public IOleInPlaceActiveObjectImpl<$class_name$>,
	public IViewObjectExImpl<$class_name$>,
	public IOleInPlaceObjectWindowlessImpl<$class_name$>,
[!if !ATTRIBUTED]
[!if SUPPORT_ERROR_INFO]
	public ISupportErrorInfo,
[!endif]
[!if CONNECTION_POINTS]
	public IConnectionPointContainerImpl<$class_name$>,
	public CProxy_$interface_name$Events<$class_name$>,
[!endif]
[!endif]
[!if OBJECT_WITH_SITE]
	public IObjectWithSiteImpl<$class_name$>,
[!endif]
[!if SERVICE_PROVIDER]
	public IServiceProviderImpl<$class_name$>,
[!endif]
[!if PERSIST_STORAGE]
	public IPersistStorageImpl<$class_name$>,
[!endif]
[!if SPECIFY_PROPERTY_PAGES]
	public ISpecifyPropertyPagesImpl<$class_name$>,
[!endif]
[!if QUICK_ACTIVATE]
	public IQuickActivateImpl<$class_name$>,
[!endif]
[!if DATA_OBJECT]
#ifndef _WIN32_WCE
	public IDataObjectImpl<$class_name$>,
#endif
[!endif]
[!if CONNECTION_POINTS]
[!if PROVIDE_CLASS_INFO2]
[!if !ATTRIBUTED]
	public IProvideClassInfo2Impl<&CLSID_$coclass$, &__uuidof(_$interface_name$Events), &LIBID_$lib_name$>,
[!endif]
[!endif]
[!if PROPERTY_NOTIFY_SINK]
[!if !ATTRIBUTED]
	public IPropertyNotifySinkCP<$class_name$>,
[!endif]
[!if ATTRIBUTED && !CONNECTION_POINTS]
	public IPropertyNotifySinkCP<$class_name$>,
[!endif]
[!endif]
[!else]
[!if PROVIDE_CLASS_INFO2]
[!if ATTRIBUTED]
	public IProvideClassInfo2Impl<&__uuidof($class_name$), nullptr>,
[!else]
	public IProvideClassInfo2Impl<&CLSID_$coclass$, nullptr, &LIBID_$lib_name$>,
[!endif]
[!endif]
[!endif]
[!if OBJECT_SAFETY]
	public IObjectSafetyImpl<$class_name$, INTERFACESAFE_FOR_UNTRUSTED_CALLER>,
[!endif]
[!if !ATTRIBUTED]
	public CComCoClass<$class_name$, &CLSID_$coclass$>,
[!endif]
[!if COMPOSITE_CONTROL]
	public CComCompositeControl<$class_name$>
[!else]
	public CComControl<$class_name$>
[!endif]
{
public:
[!if SUBCLASS_WINDOW && !HTML_CONTROL && !COMPOSITE_CONTROL]
	CContainedWindow m_ctl$subclass_name$;
[!endif]
[!if SUBCLASS_WINDOW && !HTML_CONTROL && !COMPOSITE_CONTROL]

#pragma warning(push)
#pragma warning(disable: 4355) // “this”: 用于基成员初始值设定项列表
[!endif]

[!if SUBCLASS_COMBOBOXEX32 || SUBCLASS_SysAnimate32 || SUBCLASS_SysIPAddress32]
#ifdef _WIN32_WCE
#error "Windows CE 上不支持公共控件 $subclass_name$!"
#endif
[!endif]

	$class_name$()
[!if SUBCLASS_WINDOW && !HTML_CONTROL && !COMPOSITE_CONTROL]
		: m_ctl$subclass_name$(_T("$subclass_name$"), this, 1)
[!endif]
	{
[!if SUBCLASS_WINDOW && !HTML_CONTROL && !COMPOSITE_CONTROL]
		m_bWindowOnly = TRUE;
[!endif]
[!if COMPOSITE_CONTROL]
		m_bWindowOnly = TRUE;
		CalcExtent(m_sizeExtent);
[!endif]
[!if HTML_CONTROL]
		m_bWindowOnly = TRUE;
[!endif]
	}
[!if SUBCLASS_WINDOW && !HTML_CONTROL && !COMPOSITE_CONTROL]

#pragma warning(pop)
[!endif]
[!if LICENSED]

DECLARE_CLASSFACTORY2($class_name$Lic)
[!endif]

DECLARE_OLEMISC_STATUS(OLEMISC_RECOMPOSEONRESIZE |
[!if !HTML_CONTROL && !COMPOSITE_CONTROL]
[!if ACTS_LIKE_BUTTON]
	OLEMISC_ACTSLIKEBUTTON |
[!endif]
[!if ACTS_LIKE_LABEL]
	OLEMISC_ACTSLIKELABEL |
[!endif]
[!if INVISIBLE_AT_RUNTIME]
	OLEMISC_INVISIBLEATRUNTIME |
[!endif]
[!endif]
	OLEMISC_CANTLINKINSIDE |
	OLEMISC_INSIDEOUT |
	OLEMISC_ACTIVATEWHENVISIBLE |
	OLEMISC_SETCLIENTSITEFIRST
)

[!if !ATTRIBUTED]
[!if !DEVICE]
DECLARE_REGISTRY_RESOURCEID($rgs_token$)
[!else]
[!if SUPPORT_NON_DCOM]
#ifndef _CE_DCOM
DECLARE_REGISTRY_RESOURCEID($rgs_token$)
#endif
[!endif]
[!if SUPPORT_DCOM]
#ifdef _CE_DCOM
DECLARE_REGISTRY_RESOURCEID($rgsdcom_id$)
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
	COM_INTERFACE_ENTRY($interface_name$)
[!if INTERFACE_DUAL]
	COM_INTERFACE_ENTRY(IDispatch)
[!endif]
	COM_INTERFACE_ENTRY(IViewObjectEx)
	COM_INTERFACE_ENTRY(IViewObject2)
	COM_INTERFACE_ENTRY(IViewObject)
	COM_INTERFACE_ENTRY(IOleInPlaceObjectWindowless)
	COM_INTERFACE_ENTRY(IOleInPlaceObject)
	COM_INTERFACE_ENTRY2(IOleWindow, IOleInPlaceObjectWindowless)
	COM_INTERFACE_ENTRY(IOleInPlaceActiveObject)
	COM_INTERFACE_ENTRY(IOleControl)
	COM_INTERFACE_ENTRY(IOleObject)
[!if PERSIST_STREAM_INIT]
	COM_INTERFACE_ENTRY(IPersistStreamInit)
	COM_INTERFACE_ENTRY2(IPersist, IPersistStreamInit)
[!endif]
[!if SUPPORT_ERROR_INFO]
	COM_INTERFACE_ENTRY(ISupportErrorInfo)
[!endif]
[!if CONNECTION_POINTS]
	COM_INTERFACE_ENTRY(IConnectionPointContainer)
[!endif]
[!if SPECIFY_PROPERTY_PAGES]
	COM_INTERFACE_ENTRY(ISpecifyPropertyPages)
[!endif]
[!if QUICK_ACTIVATE]
	COM_INTERFACE_ENTRY(IQuickActivate)
[!endif]
[!if PERSIST_STORAGE]
	COM_INTERFACE_ENTRY(IPersistStorage)
[!endif]
[!if DATA_OBJECT]
#ifndef _WIN32_WCE
	COM_INTERFACE_ENTRY(IDataObject)
#endif
[!endif]
[!if PROVIDE_CLASS_INFO2]
	COM_INTERFACE_ENTRY(IProvideClassInfo)
	COM_INTERFACE_ENTRY(IProvideClassInfo2)
[!endif]
[!if OBJECT_WITH_SITE]
	COM_INTERFACE_ENTRY(IObjectWithSite)
[!endif]
[!if SERVICE_PROVIDER]
	COM_INTERFACE_ENTRY(IServiceProvider)
[!endif]
[!if OBJECT_SAFETY]
	COM_INTERFACE_ENTRY_IID(IID_IObjectSafety, IObjectSafety)
[!endif]
END_COM_MAP()
[!endif]

BEGIN_PROP_MAP($class_name$)
	PROP_DATA_ENTRY("_cx", m_sizeExtent.cx, VT_UI4)
	PROP_DATA_ENTRY("_cy", m_sizeExtent.cy, VT_UI4)
[!if APPEARANCE]
	PROP_ENTRY_TYPE("Appearance", DISPID_APPEARANCE, CLSID_NULL, VT_I2)
[!endif]
[!if AUTOSIZE]
	PROP_ENTRY_TYPE("AutoSize", DISPID_AUTOSIZE, CLSID_NULL, VT_BOOL)
[!endif]
[!if BACKCOLOR]
#ifndef _WIN32_WCE
	PROP_ENTRY_TYPE("BackColor", DISPID_BACKCOLOR, CLSID_StockColorPage, VT_UI4)
#endif
[!endif]
[!if BACKSTYLE]
	PROP_ENTRY_TYPE("BackStyle", DISPID_BACKSTYLE, CLSID_NULL, VT_I4)
[!endif]
[!if BORDERCOLOR]
#ifndef _WIN32_WCE
	PROP_ENTRY_TYPE("BorderColor", DISPID_BORDERCOLOR, CLSID_StockColorPage, VT_UI4)
#endif
[!endif]
[!if BORDERSTYLE]
	PROP_ENTRY_TYPE("BorderStyle", DISPID_BORDERSTYLE, CLSID_NULL, VT_I4)
[!endif]
[!if BORDERVISIBLE]
	PROP_ENTRY_TYPE("BorderVisible", DISPID_BORDERVISIBLE, CLSID_NULL, VT_BOOL)
[!endif]
[!if BORDERWIDTH]
	PROP_ENTRY_TYPE("BorderWidth", DISPID_BORDERWIDTH, CLSID_NULL, VT_I4)
[!endif]
[!if CAPTION]
	PROP_ENTRY_TYPE("Caption", DISPID_CAPTION, CLSID_NULL, VT_BSTR)
[!endif]
[!if DRAWMODE]
	PROP_ENTRY_TYPE("DrawMode", DISPID_DRAWMODE, CLSID_NULL, VT_I4)
[!endif]
[!if DRAWSTYLE]
	PROP_ENTRY_TYPE("DrawStyle", DISPID_DRAWSTYLE, CLSID_NULL, VT_I4)
[!endif]
[!if DRAWWIDTH]
	PROP_ENTRY_TYPE("DrawWidth", DISPID_DRAWWIDTH, CLSID_NULL, VT_I4)
[!endif]
[!if ENABLED]
	PROP_ENTRY_TYPE("Enabled", DISPID_ENABLED, CLSID_NULL, VT_BOOL)
[!endif]
[!if FILLCOLOR]
#ifndef _WIN32_WCE
	PROP_ENTRY_TYPE("FillColor", DISPID_FILLCOLOR, CLSID_StockColorPage, VT_UI4)
#endif
[!endif]
[!if FILLSTYLE]
	PROP_ENTRY_TYPE("FillStyle", DISPID_FILLSTYLE, CLSID_NULL, VT_I4)
[!endif]
[!if FONT]
#ifndef _WIN32_WCE
	PROP_ENTRY_TYPE("Font", DISPID_FONT, CLSID_StockFontPage, VT_DISPATCH)
#endif
[!endif]
[!if FORECOLOR]
#ifndef _WIN32_WCE
	PROP_ENTRY_TYPE("ForeColor", DISPID_FORECOLOR, CLSID_StockColorPage, VT_UI4)
#endif
[!endif]
[!if MOUSEICON]
#ifndef _WIN32_WCE
	PROP_ENTRY_TYPE("MouseIcon", DISPID_MOUSEICON, CLSID_StockPicturePage, VT_DISPATCH)
#endif
[!endif]
[!if MOUSEPOINTER]
	PROP_ENTRY_TYPE("MousePointer", DISPID_MOUSEPOINTER, CLSID_NULL, VT_I4)
[!endif]
[!if PICTURE]
#ifndef _WIN32_WCE
	PROP_ENTRY_TYPE("Picture", DISPID_PICTURE, CLSID_StockPicturePage, VT_DISPATCH)
#endif
[!endif]
[!if READYSTATE]
	PROP_ENTRY_TYPE("ReadyState", DISPID_READYSTATE, CLSID_NULL, VT_I4)
[!endif]
[!if TABSTOP]
	PROP_ENTRY_TYPE("TabStop", DISPID_TABSTOP, CLSID_NULL, VT_BOOL)
[!endif]
[!if TEXT]
	PROP_ENTRY_TYPE("Text", DISPID_TEXT, CLSID_NULL, VT_BSTR)
[!endif]
[!if VALID]
	PROP_ENTRY_TYPE("Valid", DISPID_VALID, CLSID_NULL, VT_BOOL)
[!endif]
	// 示例项
	// PROP_ENTRY_TYPE("属性名", dispid, clsid, vtType)
	// PROP_PAGE(CLSID_StockColorPage)
END_PROP_MAP()

[!if !ATTRIBUTED]
[!if CONNECTION_POINTS]
BEGIN_CONNECTION_POINT_MAP($class_name$)
[!if PROPERTY_NOTIFY_SINK]
	CONNECTION_POINT_ENTRY(IID_IPropertyNotifySink)
[!endif]
	CONNECTION_POINT_ENTRY(__uuidof(_$interface_name$Events))
END_CONNECTION_POINT_MAP()
[!endif]
[!endif]

BEGIN_MSG_MAP($class_name$)
[!if HTML_CONTROL]
	MESSAGE_HANDLER(WM_CREATE, OnCreate)
[!endif]
[!if SUBCLASS_WINDOW && !HTML_CONTROL && !COMPOSITE_CONTROL]
	MESSAGE_HANDLER(WM_CREATE, OnCreate)
	MESSAGE_HANDLER(WM_SETFOCUS, OnSetFocus)
[!if SUBCLASS_BUTTON]
	COMMAND_CODE_HANDLER(BN_CLICKED, OnBNClicked)
[!endif]
[!if SUBCLASS_RICHEDIT]
	MESSAGE_HANDLER(WM_DESTROY, OnDestroy)
[!endif]
[!endif]
[!if COMPOSITE_CONTROL]
	CHAIN_MSG_MAP(CComCompositeControl<$class_name$>)
[!else]
	CHAIN_MSG_MAP(CComControl<$class_name$>)
[!endif]
[!if SUBCLASS_WINDOW && !HTML_CONTROL && !COMPOSITE_CONTROL]
ALT_MSG_MAP(1)
	// 将此项替换为超类 $subclass_name$ 的消息映射项
[!endif]
[!if !SUBCLASS_WINDOW]
[!if !COMPOSITE_CONTROL]
	DEFAULT_REFLECTION_HANDLER()
[!endif]
[!endif]
END_MSG_MAP()
// 处理程序原型: 
//  LRESULT MessageHandler(UINT uMsg, WPARAM wParam, LPARAM lParam, BOOL& bHandled);
//  LRESULT CommandHandler(WORD wNotifyCode, WORD wID, HWND hWndCtl, BOOL& bHandled);
//  LRESULT NotifyHandler(int idCtrl, LPNMHDR pnmh, BOOL& bHandled);

[!if !ATTRIBUTED]
[!if COMPOSITE_CONTROL]
BEGIN_SINK_MAP($class_name$)
	//请确保事件处理程序含有 __stdcall 调用约定
END_SINK_MAP()

	STDMETHOD(OnAmbientPropertyChange)(DISPID dispid)
	{
		if (dispid == DISPID_AMBIENT_BACKCOLOR)
		{
			SetBackgroundColorFromAmbient();
			FireViewChange();
		}
		return IOleControlImpl<$class_name$>::OnAmbientPropertyChange(dispid);
	}
[!endif]
[!endif]
[!if !HTML_CONTROL && !COMPOSITE_CONTROL]
[!if SUBCLASS_BUTTON]
	LRESULT OnBNClicked(WORD /*wNotifyCode*/, WORD /*wID*/, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
	{
		// TODO: 在此添加代码。
		return 0;
	}

[!endif]
[!if USE_ARROW_KEYS]
	BOOL PreTranslateAccelerator(LPMSG pMsg, HRESULT& hRet)
	{
		if(pMsg->message == WM_KEYDOWN)
		{
			switch(pMsg->wParam)
			{
			case VK_LEFT:
			case VK_RIGHT:
			case VK_UP:
			case VK_DOWN:
			case VK_HOME:
			case VK_END:
			case VK_NEXT:
			case VK_PRIOR:
				hRet = S_FALSE;
				return TRUE;
			}
		}
		//TODO:  在此添加其他快捷键处理代码
		return FALSE;
	}

[!endif]
[!if SUBCLASS_WINDOW]
	LRESULT OnSetFocus(UINT uMsg, WPARAM wParam, LPARAM lParam, BOOL& bHandled)
	{
		LRESULT lRes = CComControl<$class_name$>::OnSetFocus(uMsg, wParam, lParam, bHandled);
		if (m_bInPlaceActive)
		{
			if(!IsChild(::GetFocus()))
				m_ctl$subclass_name$.SetFocus();
		}
		return lRes;
	}

[!if SUBCLASS_RICHEDIT]
	HINSTANCE m_hLibRichEdit;

[!endif]
	LRESULT OnCreate(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM /*lParam*/, BOOL& /*bHandled*/)
	{
		RECT rc;
		GetWindowRect(&rc);
		rc.right -= rc.left;
		rc.bottom -= rc.top;
		rc.top = rc.left = 0;
[!if USE_COMMON_CONTROLS]
		InitCommonControls();
[!endif]
[!if USE_COMMON_CONTROLS_EX]
		INITCOMMONCONTROLSEX initcommoncontrolsex;
		initcommoncontrolsex.dwSize = sizeof(INITCOMMONCONTROLSEX);
	[!if SUBCLASS_COMBOBOXEX32]
		initcommoncontrolsex.dwICC = ICC_USEREX_CLASSES;
	[!endif]
	[!if SUBCLASS_SysDateTimePick32]
		initcommoncontrolsex.dwICC = ICC_DATE_CLASSES;
	[!endif]
	[!if SUBCLASS_SysIPAddress32]
		initcommoncontrolsex.dwICC = ICC_INTERNET_CLASSES;
	[!endif]
	[!if SUBCLASS_SysMonthCal32]
		initcommoncontrolsex.dwICC = ICC_DATE_CLASSES;
	[!endif]
		if (!InitCommonControlsEx(&initcommoncontrolsex))
			return -1;
[!endif]
[!if SUBCLASS_RICHEDIT]
		m_hLibRichEdit = LoadLibrary(_T("RICHED32.DLL"));
[!endif]
		m_ctl$subclass_name$.Create(m_hWnd, rc);
		return 0;
	}

[!if SUBCLASS_RICHEDIT]
	LRESULT OnDestroy(UINT, WPARAM, LPARAM, BOOL&)
	{
		m_ctl$subclass_name$.DestroyWindow();
		FreeLibrary(m_hLibRichEdit);
		return 0;
	}

[!endif]
	STDMETHOD(SetObjectRects)(LPCRECT prcPos,LPCRECT prcClip)
	{
		IOleInPlaceObjectWindowlessImpl<$class_name$>::SetObjectRects(prcPos, prcClip);
		int cx, cy;
		cx = prcPos->right - prcPos->left;
		cy = prcPos->bottom - prcPos->top;
		::SetWindowPos(m_ctl$subclass_name$.m_hWnd, nullptr, 0,
			0, cx, cy, SWP_NOZORDER | SWP_NOACTIVATE);
		return S_OK;
	}

[!endif]
[!endif]
[!if !ATTRIBUTED]
[!if SUPPORT_ERROR_INFO]
// ISupportsErrorInfo
	STDMETHOD(InterfaceSupportsErrorInfo)(REFIID riid)
	{
		static const IID* const arr[] =
		{
			&IID_$interface_name$,
		};

		for (int i=0; i<sizeof(arr)/sizeof(arr[0]); i++)
		{
			if (InlineIsEqualGUID(*arr[i], riid))
				return S_OK;
		}
		return S_FALSE;
	}

[!endif]
[!else]
[!if CONNECTION_POINTS]
	__event __interface _$interface_name$Events;
[!endif]
[!endif]
// IViewObjectEx
[!if OPAQUE]
[!if SOLID_BACKGROUND]
	DECLARE_VIEW_STATUS(VIEWSTATUS_SOLIDBKGND | VIEWSTATUS_OPAQUE)
[!else]
	DECLARE_VIEW_STATUS(VIEWSTATUS_OPAQUE)
[!endif]
[!else]
	DECLARE_VIEW_STATUS(0)
[!endif]

// $interface_name$
[!if !HTML_CONTROL]
[!if !COMPOSITE_CONTROL]
[!if !SUBCLASS_WINDOW]
public:
[!if NORMALIZED_DC]
	HRESULT OnDraw(ATL_DRAWINFO& di)
[!else]
	HRESULT OnDrawAdvanced(ATL_DRAWINFO& di)
[!endif]
	{
		RECT& rc = *(RECT*)di.prcBounds;
		// 将剪辑区域设置为 di.prcBounds 指定的矩形
		HRGN hRgnOld = nullptr;
		if (GetClipRgn(di.hdcDraw, hRgnOld) != 1)
			hRgnOld = nullptr;
		bool bSelectOldRgn = false;

		HRGN hRgnNew = CreateRectRgn(rc.left, rc.top, rc.right, rc.bottom);

		if (hRgnNew != nullptr)
		{
			bSelectOldRgn = (SelectClipRgn(di.hdcDraw, hRgnNew) != ERROR);
		}

		Rectangle(di.hdcDraw, rc.left, rc.top, rc.right, rc.bottom);
		SetTextAlign(di.hdcDraw, TA_CENTER|TA_BASELINE);
		LPCTSTR pszText = _T("$short_name$");
#ifndef _WIN32_WCE
		TextOut(di.hdcDraw,
			(rc.left + rc.right) / 2,
			(rc.top + rc.bottom) / 2,
			pszText,
			lstrlen(pszText));
#else
		ExtTextOut(di.hdcDraw,
			(rc.left + rc.right) / 2,
			(rc.top + rc.bottom) / 2,
			ETO_OPAQUE,
			nullptr,
			pszText,
			ATL::lstrlen(pszText),
			nullptr);
#endif

		if (bSelectOldRgn)
			SelectClipRgn(di.hdcDraw, hRgnOld);

		DeleteObject(hRgnNew);

		return S_OK;
	}

[!endif]
[!endif]
[!else]
public:
[!if NORMALIZED_DC]
	HRESULT OnDraw(ATL_DRAWINFO& di)
[!else]
	HRESULT OnDrawAdvanced(ATL_DRAWINFO& di)
[!endif]
	{
		// 不绘制任何内容，因为 WebBrowser 控件将执行绘制任务。
		return S_OK;
	}

[!endif]
[!if AUTOSIZE]
	void OnAutoSizeChanged()
	{
		ATLTRACE(_T("OnAutoSizeChanged\n"));
	}
[!endif]
[!if APPEARANCE]
	SHORT m_nAppearance;
	void OnAppearanceChanged()
	{
		ATLTRACE(_T("OnAppearanceChanged\n"));
	}
[!endif]
[!if BACKCOLOR]
	OLE_COLOR m_clrBackColor;
	void OnBackColorChanged()
	{
		ATLTRACE(_T("OnBackColorChanged\n"));
	}
[!endif]
[!if BACKSTYLE]
	LONG m_nBackStyle;
	void OnBackStyleChanged()
	{
		ATLTRACE(_T("OnBackStyleChanged\n"));
	}
[!endif]
[!if BORDERCOLOR]
	OLE_COLOR m_clrBorderColor;
	void OnBorderColorChanged()
	{
		ATLTRACE(_T("OnBorderColorChanged\n"));
	}
[!endif]
[!if BORDERSTYLE]
	LONG m_nBorderStyle;
	void OnBorderStyleChanged()
	{
		ATLTRACE(_T("OnBorderStyleChanged\n"));
	}
[!endif]
[!if BORDERVISIBLE]
	BOOL m_bBorderVisible;
	void OnBorderVisibleChanged()
	{
		ATLTRACE(_T("OnBorderVisibleChanged\n"));
	}
[!endif]
[!if BORDERWIDTH]
	LONG m_nBorderWidth;
	void OnBorderWidthChanged()
	{
		ATLTRACE(_T("OnBorderWidthChanged\n"));
	}
[!endif]
[!if CAPTION]
	CComBSTR m_bstrCaption;
	void OnCaptionChanged()
	{
		ATLTRACE(_T("OnCaptionChanged\n"));
	}
[!endif]
[!if DRAWMODE]
	LONG m_nDrawMode;
	void OnDrawModeChanged()
	{
		ATLTRACE(_T("OnDrawModeChanged\n"));
	}
[!endif]
[!if DRAWSTYLE]
	LONG m_nDrawStyle;
	void OnDrawStyleChanged()
	{
		ATLTRACE(_T("OnDrawStyleChanged\n"));
	}
[!endif]
[!if DRAWWIDTH]
	LONG m_nDrawWidth;
	void OnDrawWidthChanged()
	{
		ATLTRACE(_T("OnDrawWidthChanged\n"));
	}
[!endif]
[!if ENABLED]
	BOOL m_bEnabled;
	void OnEnabledChanged()
	{
		ATLTRACE(_T("OnEnabledChanged\n"));
	}
[!endif]
[!if FILLCOLOR]
	OLE_COLOR m_clrFillColor;
	void OnFillColorChanged()
	{
		ATLTRACE(_T("OnFillColorChanged\n"));
	}
[!endif]
[!if FILLSTYLE]
	LONG m_nFillStyle;
	void OnFillStyleChanged()
	{
		ATLTRACE(_T("OnFillStyleChanged\n"));
	}
[!endif]
[!if FONT]
	CComPtr<IFontDisp> m_pFont;
	void OnFontChanged()
	{
		ATLTRACE(_T("OnFontChanged\n"));
	}
[!endif]
[!if FORECOLOR]
	OLE_COLOR m_clrForeColor;
	void OnForeColorChanged()
	{
		ATLTRACE(_T("OnForeColorChanged\n"));
	}
[!endif]
[!if MOUSEICON]
	CComPtr<IPictureDisp> m_pMouseIcon;
	void OnMouseIconChanged()
	{
		ATLTRACE(_T("OnMouseIconChanged\n"));
	}
[!endif]
[!if MOUSEPOINTER]
	LONG m_nMousePointer;
	void OnMousePointerChanged()
	{
		ATLTRACE(_T("OnMousePointerChanged\n"));
	}
[!endif]
[!if PICTURE]
	CComPtr<IPictureDisp> m_pPicture;
	void OnPictureChanged()
	{
		ATLTRACE(_T("OnPictureChanged\n"));
	}
[!endif]
[!if READYSTATE]
	LONG m_nReadyState;
	void OnReadyStateChanged()
	{
		ATLTRACE(_T("OnReadyStateChanged\n"));
	}
[!endif]
[!if TABSTOP]
	BOOL m_bTabStop;
	void OnTabStopChanged()
	{
		ATLTRACE(_T("OnTabStopChanged\n"));
	}
[!endif]
[!if TEXT]
	CComBSTR m_bstrText;
	void OnTextChanged()
	{
		ATLTRACE(_T("OnTextChanged\n"));
	}
[!endif]
[!if VALID]
	BOOL m_bValid;
	void OnValidChanged()
	{
		ATLTRACE(_T("OnValidChanged\n"));
	}
[!endif]
[!if COMPOSITE_CONTROL]

	enum { IDD = $idd_dialogtoken$ };
[!endif]
[!if HTML_CONTROL]

	LRESULT OnCreate(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM /*lParam*/, BOOL& /*bHandled*/)
	{
		CAxWindow wnd(m_hWnd);
		wnd.ModifyStyle(0, WS_HSCROLL | WS_VSCROLL);
		HRESULT hr = wnd.CreateControl($idh_htmlToken$);
		if (SUCCEEDED(hr))
		{
			CComObject<$class_name$UI> *pObject = nullptr;
			hr = CComObject<$class_name$UI>::CreateInstance(&pObject);
			if (SUCCEEDED(hr) && pObject != nullptr)
				hr = wnd.SetExternalDispatch(static_cast<$interface_name$UI*>(pObject));
		}
		if (SUCCEEDED(hr))
			hr = wnd.QueryControl(IID_IWebBrowser2, (void**)&m_spBrowser);
		return SUCCEEDED(hr) ? 0 : -1;
	}

	STDMETHOD(TranslateAccelerator)(LPMSG pMsg)
	{
		CComPtr<IOleInPlaceActiveObject> spIOleInPlaceActiveObject;

		HRESULT hr = m_spBrowser->QueryInterface(&spIOleInPlaceActiveObject);
		if (SUCCEEDED(hr))
			hr = spIOleInPlaceActiveObject->TranslateAccelerator(pMsg);
		if (hr != S_OK)
			hr = IOleInPlaceActiveObjectImpl<$class_name$>::TranslateAccelerator(pMsg);

		return hr;
	}
	CComPtr<IWebBrowser2> m_spBrowser;
[!endif]
[!if SERVICE_PROVIDER]
	STDMETHOD(_InternalQueryService)(REFGUID /*guidService*/, REFIID /*riid*/, void** /*ppvObject*/)
	{
		return E_NOTIMPL;
	}
[!endif]

	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
	}
};

[!if !ATTRIBUTED]
OBJECT_ENTRY_AUTO(__uuidof($coclass$), $class_name$)
[!endif]
