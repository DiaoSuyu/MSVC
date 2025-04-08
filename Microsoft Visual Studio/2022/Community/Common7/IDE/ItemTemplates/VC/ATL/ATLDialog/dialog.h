#pragma once

#include "resource.h"
#include <atlhost.h>

using namespace ATL;

// $classname$

class $classname$ :
	public CAxDialogImpl<$classname$>
{
public:
	$classname$()
	{
	}

	~$classname$()
	{
	}

	enum { IDD = $idd_dialogid$ };

BEGIN_MSG_MAP($classname$)
	MESSAGE_HANDLER(WM_INITDIALOG, OnInitDialog)
[!if DEVICE]
#if defined(_DEVICE_RESOLUTION_AWARE) && !defined(WIN32_PLATFORM_WFSP)
	MESSAGE_HANDLER(WM_SIZE, OnSize)
#endif
#ifndef SHELL_AYGSHELL
[!endif]
	COMMAND_HANDLER(IDOK, BN_CLICKED, OnClickedOK)
	COMMAND_HANDLER(IDCANCEL, BN_CLICKED, OnClickedCancel)
[!if DEVICE]
#else
	COMMAND_ID_HANDLER(IDOK, OnClickedOK)
#endif
[!endif]
	CHAIN_MSG_MAP(CAxDialogImpl<$classname$>)
END_MSG_MAP()

// $loctext_handlerprototypes$:
//  LRESULT MessageHandler(UINT uMsg, WPARAM wParam, LPARAM lParam, BOOL& bHandled);
//  LRESULT CommandHandler(WORD wNotifyCode, WORD wID, HWND hWndCtl, BOOL& bHandled);
//  LRESULT NotifyHandler(int idCtrl, LPNMHDR pnmh, BOOL& bHandled);

	LRESULT OnInitDialog(UINT uMsg, WPARAM wParam, LPARAM lParam, BOOL& bHandled)
	{
		CAxDialogImpl<$classname$>::OnInitDialog(uMsg, wParam, lParam, bHandled);
		bHandled = TRUE;
		return 1;  // $loctext_systemfocus$
	}

	LRESULT OnClickedOK(WORD wNotifyCode, WORD wID, HWND hWndCtl, BOOL& bHandled)
	{
		EndDialog(wID);
		return 0;
	}

	LRESULT OnClickedCancel(WORD wNotifyCode, WORD wID, HWND hWndCtl, BOOL& bHandled)
	{
		EndDialog(wID);
		return 0;
	}
};
