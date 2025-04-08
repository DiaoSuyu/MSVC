// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// -----------------------------------------------------------------------------

namespace Microsoft.DiagnosticsHub
{
    using System;
    using System.Diagnostics;
    using System.Diagnostics.Tracing;
    using System.Threading;

    /// <summary>
    /// Types of user mark events
    /// </summary>
 #pragma warning disable CA1008 // We can never have a value of 0 for MarkEvent because it is an invalid event ID
    public enum MarkEvent
    {
        MapIdToName = 1,
        Emit = 2,
        Range = 3,
        MapRangeToName = 4
    }
#pragma warning restore CA1008

    /// <summary>
    /// Class used for firing UserMarks via EventSource
    /// </summary>
    [EventSource(Guid = "F9189F8A-0753-4A70-AD66-D622D88DB986", Name = "UserMarks")]
    internal class UserMarkSource : EventSource
    {
        private static readonly Lazy<UserMarkSource> lazy = new Lazy<UserMarkSource>(() => new UserMarkSource());
        public static UserMarkSource Log => lazy.Value;

        /// <summary>
        /// Constructor to create a usermark
        /// </summary>
        /// <param name="name">Optional name of the usermark</param>
        private UserMarkSource() : base()
        {
        }

        /// <summary>
        /// Fires an event to add the user mark with an optional message
        /// </summary>
        /// <param name="id">Id of the user mark</param>
        /// <param name="message">Optional message</param>
        [Event((int)MarkEvent.Emit, Version = 2)]
        [Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")]
        public void FireEmitEvent(int id, string message = "")
        {
            this.WriteEvent((int)MarkEvent.Emit, id, message);
        }

        /// <summary>
        /// Fires an event to correlate te user mark with a name
        /// </summary>
        /// <param name="id">Id of the user mark</param>
        /// <param name="name">Name of the user mark</param>
        [Event((int)MarkEvent.MapIdToName, Version = 2)]
        [Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")]
        public void FireIdToNameEvent(int id, string name)
        {
            this.WriteEvent((int)MarkEvent.MapIdToName, id, name);
        }

        /// <summary>
        /// Fires an event to correlate an id with its range
        /// </summary>
        /// <param name="rangeGuid">Range guid</param>
        /// <param name="startId">User mark range start id</param>
        /// <param name="endId">User mark range end id</param>
        [Event((int)MarkEvent.Range, Version = 2)]
        [Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")]
        public void FireRangeEvent(string rangeGuid, int startId, int endId)
        {
            this.WriteEvent((int)MarkEvent.Range, rangeGuid, startId, endId);
        }

        /// <summary>
        /// Fires an event to correlate the range with a name
        /// </summary>
        /// <param name="rangeGuid">Unique guid identifying the range</param>
        /// <param name="name">Name of the range</param>
        [Event((int)MarkEvent.MapRangeToName, Version = 2)]
        [Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")]
        public void FireRangeIdToName(string rangeGuid, string name)
        {
            this.WriteEvent((int)MarkEvent.MapRangeToName, rangeGuid, name);
        }
    }

    public sealed class UserMarks
    {
        private const int DefaultId = int.MaxValue;
        private static int NewId = int.MinValue;
        private readonly int id;

        internal static int GetNewId()
        {
            var newId = Interlocked.Increment(ref NewId);
            if (newId == DefaultId)
            {
                throw new InvalidOperationException("Unable to create new UserMark identifier due to reaching max limit.");
            }

            return newId;
        }

        /// <summary>
        /// Get the id of the usermark
        /// </summary>
        public int Id => this.id;

        /// <summary>
        /// Create a usermark
        /// </summary>
        /// <param name="name">Optional name of the usermark</param>
        /// <returns>>A new usermark</returns>
        public UserMarks(string name = "")
        {
            this.id = GetNewId();

            if (!string.IsNullOrEmpty(name))
            {
                UserMarkSource.Log.FireIdToNameEvent(this.id, name);
            }
        }

        /// <summary>
        /// Emits a usermark with the default id and the specified message
        /// </summary>
        /// <param name="message">Message to add</param>
        [Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")]
        public static void EmitMessage(string message)
        {
            UserMarkSource.Log.FireEmitEvent(DefaultId, message);
        }

        /// <summary>
        /// Emits the usermark
        /// </summary>
        [Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")]
        public void Emit()
        {
            UserMarkSource.Log.FireEmitEvent(this.id);
        }

        /// <summary>
        /// Emits the usermark with a message
        /// </summary>
        /// <param name="message">Message to emit</param>
        [Conditional("DIAGHUB_ENABLE_TRACE_SYSTEM")]
        public void Emit(string message)
        {
            UserMarkSource.Log.FireEmitEvent(this.id, message);
        }
    }
}
