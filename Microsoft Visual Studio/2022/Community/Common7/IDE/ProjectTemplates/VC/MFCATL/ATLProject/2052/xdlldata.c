// dlldata.c �İ�װ��

#ifdef _MERGE_PROXYSTUB // �ϲ�������(stub) DLL

#define REGISTER_PROXY_DLL //DllRegisterServer ��

#define USE_STUBLESS_PROXY	//����ʹ�� MIDL ���� /Oicf ʱ����

#pragma comment(lib, "rpcns4.lib")
#pragma comment(lib, "rpcrt4.lib")

#define ENTRY_PREFIX	Prx

#include "dlldata.c"
#include "$projectname$_p.c"

#endif //_MERGE_PROXYSTUB
