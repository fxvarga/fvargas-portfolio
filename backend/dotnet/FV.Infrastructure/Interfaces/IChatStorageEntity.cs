// Copyright (c) Microsoft. All rights reserved.
namespace FV.Infrastructure.Interfaces;
public interface IChatStorageEntity
{
    /// <summary>
    /// Unique ID of the entity.
    /// </summary>
    string Id { get; set; }

    /// <summary>
    /// Partition key value.
    /// </summary>
    string Partition { get; }
}
