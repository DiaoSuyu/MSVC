'' -----------------------------------------------------------------------------
'' Copyright (c) Microsoft Corporation.  All rights reserved.
'' -----------------------------------------------------------------------------

Imports System.Runtime.InteropServices

Namespace ____DiagHubTrace

    Friend NotInheritable Class DiagHubTrace : Implements IDisposable

        Public Shared DiagHubProviderId As Guid = New Guid("F9189F8A-0753-4A70-AD66-D622D88DB986")
        Public Shared FirstValidId As UShort = 1
        Public Shared MaxValidId As UShort = &H7FFF

        Private Const SuccessErrorCode As Integer = 0

        ' The max size limit of an ETW payload is 64k, but that includes the header.
        ' We take off a bit for ourselves.
        Private Const MaxMsgSizeInBytes As Integer = 63 * 1024

        Private regHandle As Long
        Private started As Boolean = False

        ''' <summary>
        ''' Initializes a new instance of the <see cref="DiagHubTrace"/> class.
        ''' </summary>
        Public Sub New()
            Me.Initialize()
        End Sub

        ''' <summary>
        ''' Insert mapping from ID to name
        ''' </summary>
        ''' <param name="id">ID to name</param>
        ''' <param name="name">Name of ID</param>
        <Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")>
        Public Sub DefineIdName(id As UShort, name As String)
            If (Me.started) Then
                Debug.Assert(id <= MaxValidId, "Invalid ID")
                Me.FireUserEventIdNameMap(id, name)
            End If
        End Sub

        ''' <summary>
        ''' Insert mark into the collection stream
        ''' </summary>
        ''' <param name="id">ID of mark</param>
        <Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")>
        Public Sub InsertMark(id As UShort)
            If (Me.started) Then
                Debug.Assert(FirstValidId <= id And id <= MaxValidId, "Invalid ID")
                Me.FireUserEventWithString(id, Nothing)
            End If
        End Sub

        ''' <summary>
        ''' Insert mark with message into the collection stream
        ''' </summary>
        ''' <param name="id">ID of mark</param>
        ''' <param name="message">Message of mark</param>
        <Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")>
        Public Sub InsertMarkWithMessage(id As UShort, message As String)
            If (Me.started) Then
                Debug.Assert(FirstValidId <= id And id <= MaxValidId, "Invalid ID")
                Me.FireUserEventWithString(id, message)
            End If
        End Sub

        ''' <summary>
        ''' Insert message into the collection stream
        ''' </summary>
        ''' <param name="message">Message to insert</param>
        <Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")>
        Public Sub InsertMessage(message As String)
            If (Me.started) Then
                Me.FireUserEventWithString(0, message)
            End If
        End Sub

        ''' <inheritdoc />
        Public Sub Dispose() Implements IDisposable.Dispose
            Me.Shutdown()
        End Sub

        <Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")>
        Private Sub Initialize()
            Dim localId As Guid = DiagHubTrace.DiagHubProviderId
            If (SuccessErrorCode = NativeMethods.EventRegister(localId, IntPtr.Zero, IntPtr.Zero, Me.regHandle)) Then
                Me.started = True
            End If
        End Sub

        <Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")>
        Private Sub Shutdown()
            If (Me.started) Then
                Me.started = False
                NativeMethods.EventUnregister(Me.regHandle)
            End If
        End Sub

        Private Sub FireUserEventIdNameMap(id As UShort, name As String)
            Debug.Assert(id <= MaxValidId, "Invalid ID")
            Debug.Assert(name Is Nothing And (2 * name.Length) < MaxMsgSizeInBytes, "Invalid string argument")

            Dim evtDesc As NativeMethods.EVENT_DESCRIPTOR = New NativeMethods.EVENT_DESCRIPTOR With
            {
                .Id = &HFFFF,
                .Version = 1,
                .Channel = 0,
                .Level = 4, ' TRACE_LEVEL_INFORMATION
                .Opcode = 0,
                .Task = 0,
                .Keyword = 1
            }

            Dim idPinned As GCHandle = GCHandle.Alloc(id, GCHandleType.Pinned)

            Dim nameLenInBytes = 2 * (name.Length + 1)
            Dim namePinned = GCHandle.Alloc(name, GCHandleType.Pinned)

            Dim userData(2) As NativeMethods.EVENT_DATA_DESCRIPTOR
            userData(0).DataPointer = idPinned.AddrOfPinnedObject().ToInt64()
            userData(0).Size = Len(id)
            userData(1).DataPointer = namePinned.AddrOfPinnedObject().ToInt64()
            userData(1).Size = nameLenInBytes

            Dim userDataPinned = GCHandle.Alloc(userData, GCHandleType.Pinned)
            NativeMethods.EventWrite(Me.regHandle, evtDesc, userData.Length, userDataPinned.AddrOfPinnedObject().ToInt64())

            userDataPinned.Free()
            namePinned.Free()
            idPinned.Free()
        End Sub

        Private Sub FireUserEventWithString(id As UShort, message As String)
            Debug.Assert(id <= MaxValidId, "Invalid ID")

            Dim evtDesc As NativeMethods.EVENT_DESCRIPTOR = New NativeMethods.EVENT_DESCRIPTOR With
            {
                .Id = id,
                .Version = 1,
                .Channel = 0,
                .Level = 4, ' TRACE_LEVEL_INFORMATION
                .Opcode = 0,
                .Task = 0,
                .Keyword = 1
            }

            Dim nameLenInBytes = If(message Is Nothing, 0, 2 * (message.Length + 1))
            Debug.Assert(nameLenInBytes < MaxMsgSizeInBytes, "Invalid DiagHub mark")
            Dim msgPinned = GCHandle.Alloc(message, GCHandleType.Pinned)

            Dim userData As NativeMethods.EVENT_DATA_DESCRIPTOR = New NativeMethods.EVENT_DATA_DESCRIPTOR With
            {
                .DataPointer = msgPinned.AddrOfPinnedObject().ToInt64(),
                .Size = nameLenInBytes
            }

            Dim userDataPinned = GCHandle.Alloc(userData, GCHandleType.Pinned)
            NativeMethods.EventWrite(Me.regHandle, evtDesc, 1, userDataPinned.AddrOfPinnedObject().ToInt64())

            userDataPinned.Free()
            msgPinned.Free()
        End Sub

        Private Class NativeMethods

            <DllImport("Advapi32.dll", SetLastError:=True)>
            Public Shared Function EventRegister(
                ByRef guid As Guid,
                enableCallback As IntPtr,
                callbackContext As IntPtr,
                <[In]> <Out> ByRef regHandle As Long) As Integer
            End Function

            <DllImport("Advapi32.dll", SetLastError:=True)>
            Public Shared Function EventWrite(
                <[In]> regHandle As Long,
                <[In]> ByRef evtDesc As EVENT_DESCRIPTOR,
                <[In]> userDataCount As Int32,
                <[In]> userData As IntPtr) As Integer
            End Function

            <DllImport("Advapi32.dll", SetLastError:=True)>
            Public Shared Function EventUnregister(<[In]> regHandle As Long) As Integer
            End Function

            <StructLayout(LayoutKind.Explicit, Size:=16)>
            Public Structure EVENT_DESCRIPTOR
                <FieldOffset(0)> Public Id As UShort
                <FieldOffset(2)> Public Version As Byte
                <FieldOffset(3)> Public Channel As Byte
                <FieldOffset(4)> Public Level As Byte
                <FieldOffset(5)> Public Opcode As Byte
                <FieldOffset(6)> Public Task As UShort
                <FieldOffset(8)> Public Keyword As ULong
            End Structure

            <StructLayout(LayoutKind.Explicit, Size:=16)>
            Public Structure EVENT_DATA_DESCRIPTOR
                <FieldOffset(0)> Public DataPointer As Int64
                <FieldOffset(8)> Public Size As Int32
                <FieldOffset(12)> Public Reserved As Int32
            End Structure

        End Class

    End Class

End Namespace
