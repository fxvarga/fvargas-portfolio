using FV.Application.Queries;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType("Query")]
public class GenerativeQueries
{

    [UseIpRateLimit(limit: 5, seconds: 60)]
    public async Task<string> GenerateHeroImage(
        [Service] GenerateHeroImageQuery generateHeroImageQuery,
        string prompt)
    {
        return await generateHeroImageQuery.ExecuteAsync(prompt);
    }
    // public async Task<string> GenerateChat(
    //     [Service] Kernel kernel,
    //     string prompt)
    // {
    //     var executionSettings = new OpenAIPromptExecutionSettings
    //     {
    //         Temperature = 0.6
    //     };
    //     var chatCompletion = kernel.GetRequiredService<IChatCompletionService>(serviceKey: "AzureOpenAIText");
    //     var chatHistory = new ChatHistory();

    //     chatHistory.AddSystemMessage("Take the following prompt and skill name and generate args for the skill to be used in automated workkflow. The args should be in JSON format. Here is the prompt: {{prompt}}, Here is the skill name: {{skillName}}");

    //     chatHistory.AddUserMessage("Give the following schema in JSON give me a bulleted point summarization of what it will do. Schema: {{schema}}");

    //     var response = await chatCompletion.GetChatMessageContentAsync(chatHistory, executionSettings);

    //     return response.ToString();

    // }


}