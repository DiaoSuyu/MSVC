// $handler_atl_doc_source_file$: $handler_atl_doc_class_name$ 的实现

#include "pch.h"
#include <propkey.h>
#include "$handler_atl_doc_header_file$"

HRESULT $handler_atl_doc_class_name$::LoadFromStream(IStream* pStream, DWORD grfMode)
{
	// 从流加载文档数据
	UNREFERENCED_PARAMETER(pStream);
	UNREFERENCED_PARAMETER(grfMode);
	return S_OK;
}

void $handler_atl_doc_class_name$::InitializeSearchContent()
{
	// 根据文档数据将搜索内容初始化为以下值
	CString value = _T("test;content;");
	SetSearchContent(value);
}

void $handler_atl_doc_class_name$::SetSearchContent(CString& value)
{
	// 将搜索内容分配给 PKEY_Search_Contents 键
	if (value.IsEmpty())
	{
		RemoveChunk(PKEY_Search_Contents.fmtid, PKEY_Search_Contents.pid);
	}
	else
	{
		CFilterChunkValueImpl *pChunk = nullptr;
		ATLTRY(pChunk = new CFilterChunkValueImpl);
		if (pChunk != nullptr)
		{
			pChunk->SetTextValue(PKEY_Search_Contents, value, CHUNK_TEXT);
			SetChunkValue(pChunk);
		}
	}
}

void $handler_atl_doc_class_name$::OnDrawThumbnail(HDC hDrawDC, LPRECT lprcBounds)
{
	HBRUSH hDrawBrush = CreateSolidBrush(RGB(255, 255, 255));
	FillRect(hDrawDC, lprcBounds, hDrawBrush);

	HFONT hStockFont = (HFONT) GetStockObject(DEFAULT_GUI_FONT);
	LOGFONT lf;

	GetObject(hStockFont, sizeof(LOGFONT), &lf);
	lf.lfHeight = 34;

	HFONT hDrawFont = CreateFontIndirect(&lf);
	HFONT hOldFont = (HFONT) SelectObject(hDrawDC, hDrawFont);

	CString strText = _T("TODO: implement thumbnail drawing here");
	DrawText(hDrawDC, strText, strText.GetLength(), lprcBounds, DT_CENTER | DT_WORDBREAK);

	SelectObject(hDrawDC, hDrawFont);
	SelectObject(hDrawDC, hOldFont);

	DeleteObject(hDrawBrush);
	DeleteObject(hDrawFont);
}
