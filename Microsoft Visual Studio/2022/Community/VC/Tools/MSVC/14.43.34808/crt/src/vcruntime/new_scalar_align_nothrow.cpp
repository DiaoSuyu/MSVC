//
// new_scalar_align_nothrow.cpp
//
//      Copyright (c) Microsoft Corporation. All rights reserved.
//
// Defines the scalar operator new, align_val_t and nothrow overload.
//
#include <vcruntime_internal.h>
#include <vcruntime_new.h>

////////////////////////////////////////////////
// Aligned new() Fallback Ordering
//
// +----------------+
// |new_scalar_align<--------------+
// +----^-----------+              |
//      |                          |
// +----+-------------------+  +---+-----------+
// |new_scalar_align_nothrow|  |new_array_align|
// +------------------------+  +---^-----------+
//                                 |
//                     +-----------+-----------+
//                     |new_array_align_nothrow|
//                     +-----------------------+
//

_NODISCARD _Ret_maybenull_ _Success_(return != NULL) _Post_writable_byte_size_(size) _VCRT_ALLOCATOR
void* __CRTDECL operator new(size_t const size, std::align_val_t const al, std::nothrow_t const&) noexcept
{
    try
    {
        return operator new(size, al);
    }
    catch (...)
    {
        return nullptr;
    }
}
