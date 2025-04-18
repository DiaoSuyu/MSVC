/***
*wcschr.c - search a wchar_t string for a given wchar_t character
*
*       Copyright (c) Microsoft Corporation. All rights reserved.
*
*Purpose:
*       defines wcschr() - search a wchar_t string for a wchar_t character
*
*******************************************************************************/

#include <vcruntime_internal.h>
#include <intrin.h>

#define XMM_SIZE sizeof(__m128i)
#define XMM_CHARS (XMM_SIZE / sizeof(wchar_t))

#define PAGE_SIZE ((intptr_t)0x1000)
#define PAGE_OFFSET(p) ((PAGE_SIZE-1) & (intptr_t)(p))
#define XMM_PAGE_SAFE(p) (PAGE_OFFSET(p) <= (PAGE_SIZE - XMM_SIZE))

/***
*wchar_t *wcschr(string, c) - search a string for a wchar_t character
*
*Purpose:
*       Searches a wchar_t string for a given wchar_t character,
*       which may be the null character L'\0'.
*
*Entry:
*       wchar_t *str - wchar_t string to search in
*       wchar_t ch - wchar_t character to search for
*
*Exit:
*       returns pointer to the first occurrence of c in string
*       returns NULL if c does not occur in string
*
*Exceptions:
*
*******************************************************************************/

_NODISCARD _Check_return_
_When_(return != NULL, _Ret_range_(str, str + _String_length_(str) - 1))
wchar_t * __cdecl wcschr(
        _In_z_ const wchar_t * str,
        _In_ wchar_t ch
        )
{
    if (__isa_available < __ISA_AVAILABLE_SSE2)
    {
        while (*str && *str != ch)
                str++;

        // If the character is a match return pointer, otherwise
        // it must be the terminating zero and return NULL.
        return (*str == ch) ? (wchar_t *)str : NULL;
    }
    else
    {
        __m128i match, characters, temp;
        unsigned mask;
        unsigned long offset;

        // Build match pattern with target character in every position.

        match = _mm_cvtsi32_si128(ch);
        match = _mm_shufflelo_epi16(match, 0);
        match = _mm_shuffle_epi32(match, 0);

        for (;;)
        {
            // If the next XMMWORD does not overlap a page boundary check
            // it for match of character or zero.

            if (XMM_PAGE_SAFE(str))
            {
                // Check for match with either the search or zero character.
                // There may be more than one match, but only the first is
                // significant.

                characters = _mm_loadu_si128((__m128i*)str);
                temp = _mm_set1_epi32(0);
                temp = _mm_cmpeq_epi16(temp, characters);
                characters = _mm_cmpeq_epi16(characters, match);
                temp = _mm_or_si128(temp, characters);
                mask = _mm_movemask_epi8(temp);

                // If one or more matches was found, get the position of
                // the first one. If that character is the same as the
                // search character return the pointer to it, otherwise
                // it must be the terminating zero so return NULL.

                if (mask != 0)
                {
                    _BitScanForward(&offset, mask);
                    str = (wchar_t *)(offset + (intptr_t)str);
                    return (*str == ch) ? (wchar_t *)str : NULL;
                }

                // No match found in this XMMWORD so skip to next.

                str += XMM_CHARS;
            }
            else
            {
                // If it is not safe to check an entire XMMWORD, check
                // a single character and try again.

                if (*str == ch) return (wchar_t *)str;
                if (*str == 0) return NULL;

                // No match so skip to next characcter.

                ++str;
            }
        }
    }
}
