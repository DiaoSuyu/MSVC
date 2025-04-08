// ThumbnailHandler.h : 缩略图处理程序的声明

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

// CThumbnailHandler

class ATL_NO_VTABLE CThumbnailHandler :
	public CComObjectRootEx<CComSingleThreadModel>,
	public CComCoClass<CThumbnailHandler, &CLSID_Thumbnail>,
	public CThumbnailProviderImpl
{
public:
	CThumbnailHandler()
	{
	}

DECLARE_REGISTRY_RESOURCEID(IDR_THUMBNAIL_HANDLER)
DECLARE_NOT_AGGREGATABLE(CThumbnailHandler)

BEGIN_COM_MAP(CThumbnailHandler)
	COM_INTERFACE_ENTRY(IInitializeWithStream)
	COM_INTERFACE_ENTRY(IThumbnailProvider)
END_COM_MAP()

	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
		CThumbnailProviderImpl::FinalRelease();
	}

protected:
	virtual HRESULT GetBitmap(UINT cx, HBITMAP *phbmp, WTS_ALPHATYPE *pdwAlpha)
	{
[!if DOCUMENT_CLASS_NAME_SPECIFIED]
		if (m_pDocument == nullptr)
		{
			return E_NOTIMPL;
		}

		// 实现 IDocument 派生类中的 OnDrawThumbnail
		static int const nDocDimensions = 256;
		if (!m_pDocument->GetThumbnail(nDocDimensions, phbmp, pdwAlpha))
		{
			return E_FAIL;
		}
[!else]
		// 修改此代码并根据文档数据创建位图
		static int const nDocDimensions = 256;
[!if SUPPORT_MFC]
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

OBJECT_ENTRY_AUTO(__uuidof(Thumbnail), CThumbnailHandler)
