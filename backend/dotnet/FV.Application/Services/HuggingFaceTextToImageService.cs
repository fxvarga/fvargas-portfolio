using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FV.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FV.Application.Services;

public class HuggingFaceTextToImageService : ITextToImageGenService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HuggingFaceTextToImageService> _logger;

    public HuggingFaceTextToImageService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<HuggingFaceTextToImageService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GenerateImageAsync(string systemPrompt, string userRequest)
    {
        try
        {
            // Create HTTP client with timeout
            var client = _httpClientFactory.CreateClient("HuggingFaceClient");
            client.Timeout = TimeSpan.FromMinutes(3); // Set a reasonable timeout

            // Get configuration values
            string apiKey = _configuration["HuggingFace:ApiKey"]
                ?? throw new InvalidOperationException("HuggingFace API key not configured");
            string modelId = _configuration["HuggingFace:ModelId"]
                ?? "black-forest-labs/flux-dev"; // Default to model in your JS example

            // Combine prompts
            string combinedPrompt = $"{systemPrompt} {userRequest}";

            // Set API endpoint to match your working JavaScript version
            var url = $"https://router.huggingface.co/replicate/v1/models/{modelId}/predictions";

            // Create request exactly matching your JavaScript implementation
            var requestData = new
            {
                input = new
                {
                    prompt = combinedPrompt  // Changed from 'input' to 'inputs'
                }
            };
            // Log the request for debugging
            _logger.LogInformation("Sending request to {Url} with prompt: {Prompt}", url, combinedPrompt);

            // Set up request message
            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(requestData),
                    Encoding.UTF8,
                    "application/json")
            };

            // Add authorization header
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            // Step 1: Start the prediction
            _logger.LogInformation("Starting prediction...");
            var response = await client.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("API error: {StatusCode}, Content: {ErrorContent}",
                    response.StatusCode, errorContent);
                throw new Exception($"API returned {response.StatusCode}: {errorContent}");
            }

            // Deserialize the prediction response
            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogDebug("Prediction response: {Response}", responseContent);

            var predictionResponse = JsonSerializer.Deserialize<ReplicatePrediction>(
                responseContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (predictionResponse == null)
            {
                throw new Exception("Failed to parse prediction response");
            }

            // Step 2: Poll the prediction status until it completes
            // Step 2: Poll the prediction status until it completes
            string getUrl = predictionResponse.Urls.Stream;
            _logger.LogInformation("Polling prediction status at: {Url}", getUrl);

            int delayMs = 2000;  // Start with 2-second delay


            await Task.Delay(delayMs);  // Wait before polling

            // Increase delay for next attempt, but cap at 10 seconds
            delayMs = Math.Min(delayMs * 2, 10000);

            var statusRequest = new HttpRequestMessage(HttpMethod.Get, getUrl);
            statusRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var imageResponse = await client.SendAsync(statusRequest);

            var imageBytes = await imageResponse.Content.ReadAsByteArrayAsync();
            _logger.LogInformation("Successfully downloaded image: {ByteCount} bytes", imageBytes.Length);

            // Convert to base64
            string base64String = Convert.ToBase64String(imageBytes);

            // Determine image type (assuming PNG, but could be made more dynamic)
            string contentType = "image/png";

            // Return as a data URL that can be directly assigned to an img src attribute
            return $"data:{contentType};base64,{base64String}";

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

    // Helper classes for deserializing Replicate API responses
    private class ReplicatePrediction
    {
        public string Id { get; set; }
        public string Model { get; set; }
        public string Version { get; set; }
        public ReplicateInput Input { get; set; }
        public string Logs { get; set; }
        public string Output { get; set; }
        public bool DataRemoved { get; set; }
        public string Error { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public ReplicateUrls Urls { get; set; }
    }

    private class ReplicateInput
    {
        public string Prompt { get; set; }
    }

    private class ReplicateUrls
    {
        public string Cancel { get; set; }
        public string Get { get; set; }
        public string Stream { get; set; }
    }
}