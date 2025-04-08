// $source_file$: $class_name$ µÄÊµÏÖ

#include "pch.h"
#include "$header_file$"


// $class_name$

[!if !ATTRIBUTED]
[!if SUPPORT_ERROR_INFO]
STDMETHODIMP $class_name$::InterfaceSupportsErrorInfo(REFIID riid)
{
	static const IID* const arr[] = 
	{
		&IID_$interface_name$
	};

	for (int i=0; i < sizeof(arr) / sizeof(arr[0]); i++)
	{
		if (InlineIsEqualGUID(*arr[i],riid))
			return S_OK;
	}
	return S_FALSE;
}
[!endif]
[!endif]
