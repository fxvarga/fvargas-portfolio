using FV.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.TextToImage;

namespace FV.Api.Services;

public class DalleTextToImageService : ITextToImageGenService
{
    private Kernel _kernel;
    private readonly ILogger<DalleTextToImageService> _logger;
    public DalleTextToImageService(Kernel kernel, ILogger<DalleTextToImageService> logger)
    {
        _logger = logger;
        _kernel = kernel;
    }

    public async Task<string> GenerateImageAsync(string systemPrompt, string userRequest)
    {
        try
        {
            string combinedPrompt = $"{userRequest}, {systemPrompt}";
#pragma warning disable SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
            var textToImageService = _kernel.GetRequiredService<ITextToImageService>(serviceKey: "AzureOpenAITextToImage");
#pragma warning restore SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
            var imageString = await textToImageService.GenerateImageAsync(combinedPrompt, 1024, 1024);
            return imageString;


        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Request timed out after {Timeout} seconds",
                ex.CancellationToken.IsCancellationRequested ? "user cancellation" : "timeout");

            throw new Exception("The image generation request timed out. The model may be busy or unavailable.", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate image: {Message}", ex.Message);
            throw new Exception($"Failed to generate image: {ex.Message}", ex);
        }
    }
}
