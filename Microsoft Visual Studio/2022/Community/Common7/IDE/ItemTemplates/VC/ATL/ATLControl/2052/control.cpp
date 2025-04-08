// $source_file$: $class_name$ µÄÊµÏÖ
#include "pch.h"
#include "$header_file$"

[!if !HTML_CONTROL && !COMPOSITE_CONTROL]
[!if USE_COMMON_CONTROLS || USE_COMMON_CONTROLS_EX]
#ifndef _WIN32_WCE
#pragma comment(lib, "comctl32.lib")
#else
#pragma comment(lib, "commctrl.lib")
#endif
[!endif]
[!endif]

// $class_name$
