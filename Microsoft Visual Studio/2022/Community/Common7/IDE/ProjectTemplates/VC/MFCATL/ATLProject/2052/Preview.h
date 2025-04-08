// PreviewHandler.h: Ԥ��������������

#pragma once
#include "resource.h"       // ������

[!if !SUPPORT_MFC || GENERATE_ATL_DOCUMENT]
#define AFX_PREVIEW_STANDALONE
[!endif]
#include <atlhandler.h>
#include <atlhandlerimpl.h>
[!if SUPPORT_MFC && !GENERATE_ATL_DOCUMENT]
#include <afxext.h>
[!endif]
#include "$documentclassheaderfilename$"
[!if PREVIEW_HANDLER && VIEW_HEADER_FILENAME_SPECIFIED]
#include "$viewclassheaderfilename$"
[!endif]
[!if !SUPPORT_MFC || GENERATE_ATL_DOCUMENT]
#include <atlpreviewctrlimpl.h>
[!endif]

#include "$safeidlprojectname$_i.h"

using namespace ATL;

[!if PREVIEW_HANDLER && !VIEW_CLASS_NAME_SPECIFIED]
// CPreviewCtrl ʵ��
[!if SUPPORT_MFC && !GENERATE_ATL_DOCUMENT]
class CPreviewCtrl : public IPreviewCtrl
{
protected:
	virtual void DoPaint(CPaintDC* pDC)
	{
		// ��� CMyDoc ������ CDocument������Ի�ȡָ�� IDocument ��ָ�룬������ʾ
		// CMyDoc* pDoc = (CMyDoc*)m_pDocument->GetContainer();

		CRect rectClient;
		GetClientRect(rectClient);
		pDC->FillSolidRect(rectClient, m_clrBackColor);

		CString strData = _T("�ڴ˴����Ʒḻ��Ԥ�����ݡ�");
		pDC->TextOut(10, 20, strData, strData.GetLength());
	}
};
[!else]
class CPreviewCtrl : public CAtlPreviewCtrlImpl
{
protected:
	virtual void DoPaint(HDC hdc)
	{
		// ���Ի�ȡָ�� IDocument ��ָ�룬������ʾ
		// CMyDoc* pDoc = (CMyDoc*)m_pDocument;
		CString strData = _T("�ڴ˴����Ʒḻ��Ԥ�����ݡ�");
		TextOut(hdc, 10, 20, strData, strData.GetLength());
	}
};
[!endif]
[!endif]

// CPreviewHandler

class ATL_NO_VTABLE CPreviewHandler :
	public CComObjectRootEx<CComSingleThreadModel>,
	public CComCoClass<CPreviewHandler, &CLSID_Preview>,
	public CPreviewHandlerImpl <CPreviewHandler>
{
public:
	CPreviewHandler()
	{
	}

DECLARE_REGISTRY_RESOURCEID(IDR_PREVIEW_HANDLER)
DECLARE_NOT_AGGREGATABLE(CPreviewHandler)

BEGIN_COM_MAP(CPreviewHandler)
	COM_INTERFACE_ENTRY(IObjectWithSite)
	COM_INTERFACE_ENTRY(IOleWindow)
	COM_INTERFACE_ENTRY(IInitializeWithStream)
	COM_INTERFACE_ENTRY(IPreviewHandler)
	COM_INTERFACE_ENTRY(IPreviewHandlerVisuals)
END_COM_MAP()

	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
		CPreviewHandlerImpl<CPreviewHandler>::FinalRelease();
	}

protected:
[!if !VIEW_CLASS_NAME_SPECIFIED]
	virtual IPreviewCtrl* CreatePreviewControl()
	{
		// �����ڴ˱�ͷ�Ŀ�ʼλ�ö���
		CPreviewCtrl *pPreviewCtrl = nullptr;
		ATLTRY(pPreviewCtrl = new CPreviewCtrl());
		return pPreviewCtrl;
	}
[!else]
[!if SUPPORT_MFC]
	virtual IPreviewCtrl* CreatePreviewControl()
	{
		// �ڴ˴�����Ԥ���ؼ�
		CMFCPreviewCtrlImpl *pPreviewCtrl = nullptr;
		ATLTRY(pPreviewCtrl = new CMFCPreviewCtrlImpl());
		return pPreviewCtrl;
	}
[!else]
	virtual IPreviewCtrl* CreatePreviewControl()
	{
		// �� IPreviewCtrl ����һ���ಢ�ڴ˶������ʵ����
		return nullptr;
	}
[!endif]
[!endif]

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

[!if PREVIEW_HANDLER && VIEW_CLASS_NAME_SPECIFIED && DOCUMENT_CLASS_NAME_SPECIFIED && SUPPORT_MFC]
public:
	virtual HRESULT InitializeDocumentPreview(HWND hWndParent, RECT* prc)
	{
		m_pPreviewCtrl = CreatePreviewControl();
		CMFCPreviewCtrlImpl* pCtrl = DYNAMIC_DOWNCAST(CMFCPreviewCtrlImpl, (CObject*) m_pPreviewCtrl);
		if (pCtrl == nullptr)
		{
			ATLTRACE2(atlTraceGeneral, 4, L"InitializeDocumentPreview: ָ��Ԥ���ؼ���ָ��Ϊ NULL��\n");
			return E_POINTER;
		}

		ASSERT_VALID(pCtrl);

		CCreateContext ctx;
		ctx.m_pNewViewClass = RUNTIME_CLASS($viewclassname$);

		m_pDocument = CreateDocument();

		if (m_pDocument == nullptr)
		{
			ATLTRACE2(atlTraceGeneral, 4, L"InitializeDocumentPreview: ָ���ĵ���ָ��Ϊ NULL��\n");
			return E_POINTER;
		}

		m_pDocument->AddRef();
		ctx.m_pCurrentDoc = DYNAMIC_DOWNCAST($documentclassname$, (CObject*) m_pDocument->GetContainer());

		if (!pCtrl->Create(hWndParent, prc, &ctx))
		{
			ATLTRACE2(atlTraceGeneral, 4, L"InitializeDocumentPreview: Ԥ���ؼ�����ʧ�ܡ��������: %d\n", GetLastError());
			return E_FAIL;
		}
		return S_OK;
	}
[!endif]
};

OBJECT_ENTRY_AUTO(__uuidof(Preview), CPreviewHandler)
