// Copyright (c) Microsoft. All rights reserved.

using FV.Infrastructure.Interfaces;
using FV.Infrastructure.Models;

namespace FV.Infrastructure.Persistence.ChatMemoryStorage;

/// <summary>
/// A repository for chat sessions.
/// </summary>
public class ChatSessionRepository : ChatRepository<ChatSession>
{
    /// <summary>
    /// Initializes a new instance of the ChatSessionRepository class.
    /// </summary>
    /// <param name="storageContext">The storage context.</param>
    public ChatSessionRepository(IChatStorageContext<ChatSession> storageContext)
        : base(storageContext)
    {
    }

    /// <summary>
    /// Retrieves all chat sessions.
    /// </summary>
    /// <returns>A list of ChatMessages.</returns>
    public Task<IEnumerable<ChatSession>> GetAllChatsAsync()
    {
        return base.StorageContext.QueryEntitiesAsync(e => true);
    }
}
