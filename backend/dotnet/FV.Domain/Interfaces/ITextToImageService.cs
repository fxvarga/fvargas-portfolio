using System.Threading.Tasks;

namespace FV.Domain.Interfaces;

public interface ITextToImageGenService
{
    Task<string> GenerateImageAsync(string systemPrompt, string userRequest);
}