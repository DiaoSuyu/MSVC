// FilterHandler.h : 筛选器处理程序的声明

#pragma once
#include "resource.h"       // 主符号

[!if !SUPPORT_MFC]
#define AFX_PREVIEW_STANDALONE
[!endif]
#include <atlhandler.h>
#include <atlhandlerimpl.h>
#include "$documentclassheaderfilename$"

#include "$safeidlprojectname$_i.h"

using namespace ATL;

// CFilterHandler

class ATL_NO_VTABLE CFilterHandler :
	public CComObjectRootEx<CComMultiThreadModel>,
	public CComCoClass<CFilterHandler, &CLSID_Search>,
	public CSearchFilterImpl
{
public:
	CFilterHandler()
	{
	}

DECLARE_REGISTRY_RESOURCEID(IDR_FILTER_HANDLER)
DECLARE_NOT_AGGREGATABLE(CFilterHandler)

BEGIN_COM_MAP(CFilterHandler)
	COM_INTERFACE_ENTRY(IPersistStream)
	COM_INTERFACE_ENTRY(IPersistFile)
	COM_INTERFACE_ENTRY(IFilter)
END_COM_MAP()

	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
		CSearchFilterImpl::FinalRelease();
	}

public:
	// IPersistStream 实现
	IFACEMETHODIMP GetClassID(CLSID* pClassID)
	{
		*pClassID = CLSID_Search;
		return S_OK;
	}

protected:
[!if SUPPORT_MFC && !GENERATE_ATL_DOCUMENT]
	DECLARE_DOCUMENT($documentclassname$)
[!else]
	virtual IDocument* CreateDocument()
	{
		$documentclassname$ *pDocument = nullptr;
		ATLTRY(pDocument = new $documentclassname$());
		return pDocument;
	}
[!endif]
};

OBJECT_ENTRY_AUTO(__uuidof(Search), CFilterHandler)
