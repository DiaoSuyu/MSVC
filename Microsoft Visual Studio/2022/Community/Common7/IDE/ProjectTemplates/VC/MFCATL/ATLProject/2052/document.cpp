// $documentimplementationfilename$: $documentclassname$ ���ʵ��

#include "pch.h"
#include "framework.h"
#include <propkey.h>
#include "$documentclassheaderfilename$"

HRESULT $documentclassname$::LoadFromStream(IStream* pStream, DWORD grfMode)
{
	// ���������ĵ�����
	UNREFERENCED_PARAMETER(pStream);
	UNREFERENCED_PARAMETER(grfMode);
	return S_OK;
}

void $documentclassname$::InitializeSearchContent()
{
	// �����ĵ����ݽ��������ݳ�ʼ��Ϊ����ֵ
	CString value = _T("test;content;");
	SetSearchContent(value);
}

void $documentclassname$::SetSearchContent(CString& value)
{
	// ���������ݷ���� PKEY_Search_Contents ��
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

void $documentclassname$::OnDrawThumbnail(HDC hDrawDC, LPRECT lprcBounds)
{
	HBRUSH hDrawBrush = CreateSolidBrush(RGB(255, 255, 255));
	FillRect(hDrawDC, lprcBounds, hDrawBrush);

	HFONT hStockFont = (HFONT) GetStockObject(DEFAULT_GUI_FONT);
	LOGFONT lf;

	GetObject(hStockFont, sizeof(LOGFONT), &lf);
	lf.lfHeight = 34;

	HFONT hDrawFont = CreateFontIndirect(&lf);
	HFONT hOldFont = (HFONT) SelectObject(hDrawDC, hDrawFont);

	CString strText = _T("TODO:  �ڴ˴�ʵ������ͼ����");
	DrawText(hDrawDC, strText, strText.GetLength(), lprcBounds, DT_CENTER | DT_WORDBREAK);

	SelectObject(hDrawDC, hDrawFont);
	SelectObject(hDrawDC, hOldFont);

	DeleteObject(hDrawBrush);
	DeleteObject(hDrawFont);
}
