
namespace FV.Infrastructure.Interfaces;
public interface IMessageService
{
    Task SendTypedMessageAsync<T>(T message);
    Task SendChatCompletionStream(string message);
}
