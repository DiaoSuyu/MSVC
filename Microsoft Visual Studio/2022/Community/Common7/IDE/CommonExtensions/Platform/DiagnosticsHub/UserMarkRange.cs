// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// -----------------------------------------------------------------------------

namespace Microsoft.DiagnosticsHub
{
    using System;

    public sealed class UserMarkRange : IDisposable
    {
        private readonly string rangeGuid;
        private readonly int startId;
        private readonly int endId;

        private bool disposed = false;

        /// <summary>
        /// Creates a range for usermarks
        /// </summary>
        /// <param name="name">Optional name for range</param>
        /// <param name="message">Optional message to emit</param>
        public UserMarkRange(string name = "", string message = "")
        {
            this.startId = UserMarks.GetNewId();
            this.endId = UserMarks.GetNewId();
            this.rangeGuid = Guid.NewGuid().ToString();

            // Correlate ids to range
            UserMarkSource.Log.FireRangeEvent(this.rangeGuid, this.startId, this.endId);

            // Add range name
            UserMarkSource.Log.FireRangeIdToName(this.rangeGuid, name);

            // Fire start event
            UserMarkSource.Log.FireEmitEvent(this.startId, message);
        }

        /// <summary>
        /// Gets the range id
        /// </summary>
        public string RangeId => this.rangeGuid;

        /// <summary>
        /// Gets the start usermark id for the range
        /// </summary>
        public int StartId => this.startId;

        /// <summary>
        /// Gets the end usermark id for the range
        /// </summary>
        public int EndId => this.endId;

        /// <summary>
        /// Disposes the range.This also will automatically fire EndRange.
        /// </summary>
        public void Dispose()
        {
            if (!this.disposed)
            {
                UserMarkSource.Log.FireEmitEvent(this.endId);
                this.disposed = true;
            }
        }
    }
}
