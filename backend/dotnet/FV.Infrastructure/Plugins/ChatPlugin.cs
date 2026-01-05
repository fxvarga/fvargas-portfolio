using System.ComponentModel;
using System.Globalization;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using FV.Infrastructure.Plugins.Utils;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.KernelMemory;
using FV.Infrastructure.Plugins.Chat;
using FV.Infrastructure.Options;
using FV.Infrastructure.Interfaces;
using FV.Infrastructure.Persistence.ChatMemoryStorage;
using FV.Infrastructure.Models;

public class ChatPlugin
{
    private readonly Kernel _kernel;
    private readonly PromptsOptions _promptOptions;
    private readonly ILogger _logger;
    private readonly IMessageService _messageService;
    private readonly ChatMessageRepository _chatMessageRepository;
    private readonly KernelMemoryRetriever _kernelMemoryRetriever;
    private readonly IKernelMemory _memoryClient;


    public ChatPlugin(
        Kernel kernel,
        IKernelMemory memoryClient,
        IOptions<PromptsOptions> promptOptions,
        ILogger logger,
        IMessageService messageService,
        ChatMessageRepository chatMessageRepository,
        ChatSessionRepository chatSessionRepository
    )
    {
        _kernel = kernel;
        this._promptOptions = promptOptions.Value;
        this._logger = logger;
        this._messageService = messageService;
        this._chatMessageRepository = chatMessageRepository;
        this._kernelMemoryRetriever = new KernelMemoryRetriever(promptOptions, chatSessionRepository, memoryClient, logger);
        this._memoryClient = memoryClient;

    }

    [KernelFunction, Description("Extract chat history")]
    public Task<string> ExtractChatHistory(
        [Description("Chat ID to extract history from")]
        string chatId,
        [Description("Maximum number of tokens")]
        int tokenLimit,
        CancellationToken cancellationToken = default)
    {
        return this.GetAllowedChatHistoryAsync(chatId, tokenLimit, cancellationToken: cancellationToken);
    }
    [KernelFunction, Description("Get chat response")]
    public async Task<string> ChatAsync(
        [Description("The new message")] string message,
        [Description("Unique and persistent identifier for the user")]
        string userId,
        [Description("Name of the user")] string userName,
        [Description("Unique and persistent identifier for the chat")]
        string chatId,
        [Description("Type of the message")] string messageType,
        KernelArguments context,
        CancellationToken cancellationToken = default)
    {
        // Save this new message to memory such that subsequent chat responses can use it
        // TODO: Need to implement storage
        var newUserMessage = await this.SaveNewMessageAsync(message, userId, userName, chatId, messageType, cancellationToken);

        // Clone the context to avoid modifying the original context variables.
        KernelArguments chatContext = new(context);
        chatContext["knowledgeCutoff"] = this._promptOptions.KnowledgeCutoffDate;


        CopilotChatMessage chatMessage = await this.GetChatResponseAsync(chatId, userId, chatContext, newUserMessage, cancellationToken);
        context["input"] = chatMessage.Content;

        // if (chatMessage.TokenUsage != null)
        // {
        //     context["tokenUsage"] = JsonSerializer.Serialize(chatMessage.TokenUsage);
        // }
        // else
        // {
        //     this._logger.LogWarning("ChatPlugin.ChatAsync token usage unknown. Ensure token management has been implemented correctly.");
        // }

        return chatMessage.Content;
    }

    private async Task<CopilotChatMessage> GetChatResponseAsync(string chatId, string userId, KernelArguments chatContext, CopilotChatMessage userMessage, CancellationToken cancellationToken)
    {
        // Render system instruction components and create the meta-prompt template
        var systemInstructions = await AsyncUtils.SafeInvokeAsync(
            () => this.RenderSystemInstructionsAsync(chatId, chatContext, cancellationToken), nameof(this.RenderSystemInstructionsAsync));
        ChatHistory metaPrompt = new(systemInstructions);

        // Bypass audience extraction if Auth is disabled
        var audience = string.Empty;
        // if (!PassThroughAuthenticationHandler.IsDefaultUser(userId))
        // {
        //     // Get the audience
        //     await this.UpdateBotResponseStatusOnClientAsync(chatId, "Extracting audience", cancellationToken);
        //     audience = await AsyncUtils.SafeInvokeAsync(
        //         () => this.GetAudienceAsync(chatContext, cancellationToken), nameof(this.GetAudienceAsync));
        //     metaPrompt.AddSystemMessage(audience);
        // }

        // Extract user intent from the conversation history.
        // await this.UpdateBotResponseStatusOnClientAsync(chatId, "Extracting user intent", cancellationToken);
        var userIntent = await AsyncUtils.SafeInvokeAsync(
            () => this.GetUserIntentAsync(chatContext, cancellationToken), nameof(this.GetUserIntentAsync));
        metaPrompt.AddSystemMessage(userIntent);

        // Calculate max amount of tokens to use for memories
        int maxRequestTokenBudget = this.GetMaxRequestTokenBudget();
        // Calculate tokens used so far: system instructions, audience extraction and user intent
        int tokensUsed = TokenUtils.GetContextMessagesTokenCount(metaPrompt);
        int chatMemoryTokenBudget = maxRequestTokenBudget
                                    - tokensUsed
                                    - TokenUtils.GetContextMessageTokenCount(AuthorRole.User, userMessage.ToFormattedString());
        chatMemoryTokenBudget = (int)(chatMemoryTokenBudget * this._promptOptions.MemoriesResponseContextWeight);

        // Query relevant semantic and document memories
        // await this.UpdateBotResponseStatusOnClientAsync(chatId, "Extracting semantic and document memories", cancellationToken);
        (var memoryText, var citationMap) = await this._kernelMemoryRetriever.QueryMemoriesAsync(userIntent, chatId, chatMemoryTokenBudget);
        if (!string.IsNullOrWhiteSpace(memoryText))
        {
            metaPrompt.AddSystemMessage(memoryText);
            tokensUsed += TokenUtils.GetContextMessageTokenCount(AuthorRole.System, memoryText);
        }

        // Add as many chat history messages to meta-prompt as the token budget will allow
        // await this.UpdateBotResponseStatusOnClientAsync(chatId, "Extracting chat history", cancellationToken);
        // string allowedChatHistory = await this.GetAllowedChatHistoryAsync(chatId, maxRequestTokenBudget - tokensUsed, metaPrompt, cancellationToken);

        // Store token usage of prompt template
        chatContext[TokenUtils.GetFunctionKey("SystemMetaPrompt")] = TokenUtils.GetContextMessagesTokenCount(metaPrompt).ToString(CultureInfo.CurrentCulture);

        // Stream the response to the client
        var promptView = new BotResponsePrompt(systemInstructions, audience, userIntent, "", "", metaPrompt);

        return await this.HandleBotResponseAsync(chatId, userId, chatContext, promptView, citationMap.Values.AsEnumerable(), cancellationToken);
    }

    private async Task<string> GetUserIntentAsync(KernelArguments context, CancellationToken cancellationToken)
    {
        // Clone the context to avoid modifying the original context variables
        KernelArguments intentContext = new(context);

        int tokenBudget =
            this._promptOptions.CompletionTokenLimit -
            this._promptOptions.ResponseTokenLimit -
            TokenUtils.TokenCount(string.Join("\n", new string[]
                {
                    this._promptOptions.SystemPersona,
                    this._promptOptions.SystemIntent,
                    this._promptOptions.SystemIntentContinuation
                })
            );

        intentContext["tokenLimit"] = tokenBudget.ToString(new NumberFormatInfo());
        intentContext["knowledgeCutoff"] = this._promptOptions.KnowledgeCutoffDate;

        var completionFunction = this._kernel.CreateFunctionFromPrompt(
            this._promptOptions.SystemIntentExtraction,
            this.CreateIntentCompletionSettings(),
            functionName: "UserIntentExtraction",
            description: "Extract user intent");

        var result = await completionFunction.InvokeAsync(this._kernel, intentContext, cancellationToken);

        // Get token usage from ChatCompletion result and add to original context
        string? tokenUsage = TokenUtils.GetFunctionTokenUsage(result, this._logger);
        // TODO: Why am i not getting usage
        if (tokenUsage is not null)
        {
            context[TokenUtils.GetFunctionKey("SystemIntentExtraction")] = tokenUsage;
        }
        else
        {
            this._logger.LogError("Unable to determine token usage for userIntentExtraction");
        }

        return $"User intent: {result}";

    }
    private OpenAIPromptExecutionSettings CreateIntentCompletionSettings()
    {
        return new OpenAIPromptExecutionSettings
        {
            MaxTokens = this._promptOptions.ResponseTokenLimit,
            Temperature = this._promptOptions.IntentTemperature,
            TopP = this._promptOptions.IntentTopP,
            FrequencyPenalty = this._promptOptions.IntentFrequencyPenalty,
            PresencePenalty = this._promptOptions.IntentPresencePenalty,
            StopSequences = new string[] { "] bot:" }
        };
    }


    private OpenAIPromptExecutionSettings CreateChatRequestSettings()
    {
        return new OpenAIPromptExecutionSettings
        {
            MaxTokens = this._promptOptions.ResponseTokenLimit,
            Temperature = this._promptOptions.ResponseTemperature,
            TopP = this._promptOptions.ResponseTopP,
            FrequencyPenalty = this._promptOptions.ResponseFrequencyPenalty,
            PresencePenalty = this._promptOptions.ResponsePresencePenalty,
            ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
        };
    }
    private async Task<CopilotChatMessage> SaveNewMessageAsync(string message, string userId, string userName, string chatId, string type, CancellationToken cancellationToken)
    {
        // // Make sure the chat exists.
        // if (!await this._chatSessionRepository.TryFindByIdAsync(chatId))
        // {
        //     throw new ArgumentException("Chat session does not exist.");
        // }

        var chatMessage = new CopilotChatMessage(
            userId,
            userName,
            chatId,
            message,
            string.Empty,
            null,
            CopilotChatMessage.AuthorRoles.User,
            // Default to a standard message if the `type` is not recognized
            Enum.TryParse(type, out CopilotChatMessage.ChatMessageType typeAsEnum) && Enum.IsDefined(typeof(CopilotChatMessage.ChatMessageType), typeAsEnum)
                ? typeAsEnum
                : CopilotChatMessage.ChatMessageType.Message);

        await this._chatMessageRepository.CreateAsync(chatMessage);
        return chatMessage;
    }
    private async Task<string> RenderSystemInstructionsAsync(string chatId, KernelArguments context, CancellationToken cancellationToken)
    {
        // Render system instruction components
        // await this.UpdateBotResponseStatusOnClientAsync(chatId, "Initializing prompt", cancellationToken);

        var promptTemplateFactory = new KernelPromptTemplateFactory();
        var promptTemplate = promptTemplateFactory.Create(new PromptTemplateConfig(this._promptOptions.SystemPersona));
        return await promptTemplate.RenderAsync(this._kernel, context, cancellationToken);
    }
    private int GetMaxRequestTokenBudget()
    {
        // OpenAI inserts a message under the hood:
        // "content": "Assistant is a large language model.","role": "system"
        // This burns just under 20 tokens which need to be accounted for.
        const int ExtraOpenAiMessageTokens = 20;
        return this._promptOptions.CompletionTokenLimit // Total token limit
               - ExtraOpenAiMessageTokens
               // Token count reserved for model to generate a response
               - this._promptOptions.ResponseTokenLimit
               // Buffer for Tool Calls
               - this._promptOptions.FunctionCallingTokenLimit;
    }
    private async Task<CopilotChatMessage> HandleBotResponseAsync(
        string chatId,
        string userId,
        KernelArguments chatContext,
        BotResponsePrompt promptView,
        IEnumerable<CitationSource>? citations,
        CancellationToken cancellationToken)
    {
        // Get bot response and stream to client
        // await this.UpdateBotResponseStatusOnClientAsync(chatId, "Generating bot response", cancellationToken);
        CopilotChatMessage chatMessage = await AsyncUtils.SafeInvokeAsync(
            () => this.StreamResponseToClientAsync(chatId, userId, promptView, cancellationToken, citations), nameof(this.StreamResponseToClientAsync));

        // Save the message into chat history
        // await this.UpdateBotResponseStatusOnClientAsync(chatId, "Saving message to chat history", cancellationToken);
        await this._chatMessageRepository.UpsertAsync(chatMessage);

        // Extract semantic chat memory
        // await this.UpdateBotResponseStatusOnClientAsync(chatId, "Generating semantic chat memory", cancellationToken);
        await AsyncUtils.SafeInvokeAsync(
            () => SemanticChatMemoryExtractor.ExtractSemanticChatMemoryAsync(
                chatId,
                this._memoryClient,
                this._kernel,
                chatContext,
                this._promptOptions,
                this._logger,
                cancellationToken), nameof(SemanticChatMemoryExtractor.ExtractSemanticChatMemoryAsync));

        // Calculate total token usage for dependency functions and prompt template
        // await this.UpdateBotResponseStatusOnClientAsync(chatId, "Saving token usage", cancellationToken);
        // chatMessage.TokenUsage = this.GetTokenUsages(chatContext, chatMessage.Content);

        // Update the message on client and in chat history with final completion token usage
        // await this.UpdateMessageOnClient(chatMessage, cancellationToken);
        // await this._chatMessageRepository.UpsertAsync(chatMessage);

        return chatMessage;
    }
    private async Task<CopilotChatMessage> StreamResponseToClientAsync(
        string chatId,
        string userId,
        BotResponsePrompt prompt,
        CancellationToken cancellationToken,
        IEnumerable<CitationSource>? citations = null)
    {
        // Create the stream
        var chatCompletion = this._kernel.GetRequiredService<IChatCompletionService>();
        var stream =
            chatCompletion.GetStreamingChatMessageContentsAsync(
                prompt.MetaPromptTemplate,
                this.CreateChatRequestSettings(),
                this._kernel,
                cancellationToken);

        // Create message on client
        var chatMessage = this.CreateBotMessageOnClient(
            chatId,
            userId,
            JsonSerializer.Serialize(prompt),
            string.Empty,
            cancellationToken,
            citations
        );

        // Stream the message to the client
        await foreach (var contentPiece in stream)
        {
            chatMessage.Content += contentPiece;
            await this._messageService.SendChatCompletionStream(chatMessage.Content);
        }

        return chatMessage;
    }

    private CopilotChatMessage CreateBotMessageOnClient(
          string chatId,
          string userId,
          string prompt,
          string content,
          CancellationToken cancellationToken,
          IEnumerable<CitationSource>? citations = null,
          Dictionary<string, int>? tokenUsage = null)
    {
        var chatMessage = CopilotChatMessage.CreateBotResponseMessage(chatId, content, prompt, citations, tokenUsage);
        return chatMessage;
    }
    private async Task<string> GetAllowedChatHistoryAsync(
          string chatId,
          int tokenLimit,
          ChatHistory? chatHistory = null,
          CancellationToken cancellationToken = default)
    {
        await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
        var sortedMessages = await this._chatMessageRepository.FindByChatIdAsync(chatId, 0, 100);

        ChatHistory allottedChatHistory = new();
        var remainingToken = tokenLimit;
        string historyText = string.Empty;

        foreach (var chatMessage in sortedMessages)
        {
            var formattedMessage = chatMessage.ToFormattedString();

            if (chatMessage.Type == CopilotChatMessage.ChatMessageType.Document)
            {
                continue;
            }

            var promptRole = chatMessage.AuthorRole == CopilotChatMessage.AuthorRoles.Bot ? AuthorRole.System : AuthorRole.User;
            int tokenCount = chatHistory is not null ? TokenUtils.GetContextMessageTokenCount(promptRole, formattedMessage) : TokenUtils.TokenCount(formattedMessage);

            if (remainingToken - tokenCount >= 0)
            {
                historyText = $"{formattedMessage}\n{historyText}";
                if (chatMessage.AuthorRole == CopilotChatMessage.AuthorRoles.Bot)
                {
                    // Message doesn't have to be formatted for bot. This helps with asserting a natural language response from the LLM (no date or author preamble).
                    allottedChatHistory.AddAssistantMessage(chatMessage.Content.Trim());
                }
                else
                {
                    // Omit user name if Auth is disabled.
                    // var userMessage = PassThroughAuthenticationHandler.IsDefaultUser(chatMessage.UserId)
                    //     ? $"[{chatMessage.Timestamp.ToString("G", CultureInfo.CurrentCulture)}] {chatMessage.Content}"
                    //     : formattedMessage;
                    var userMessage = formattedMessage;
                    allottedChatHistory.AddUserMessage(userMessage.Trim());
                }

                remainingToken -= tokenCount;
            }
            else
            {
                break;
            }
        }

        chatHistory?.AddRange(allottedChatHistory.Reverse());

        return $"Chat history:\n{historyText.Trim()}";
    }

}
