// $documentclassheaderfilename$ : $documentclassname$ 类的实现

#pragma once

#include <atlhandlerimpl.h>

using namespace ATL;

class $documentclassname$ : public CAtlDocumentImpl
{
public:
	$documentclassname$(void)
	{
	}

	virtual ~$documentclassname$(void)
	{
	}

	virtual HRESULT LoadFromStream(IStream* pStream, DWORD grfMode);
	virtual void InitializeSearchContent();

protected:
	void SetSearchContent(CString& value);
	virtual void OnDrawThumbnail(HDC hDrawDC, LPRECT lprcBounds);
};
