using FV.Api.GraphQL.Types;
namespace FV.Api.ApiEndpoints.GraphQl.Subscriptions;
public class SessionSubscriptions
{
    [Subscribe]
    [Topic]
    public SessionInfo OnMessageReceived([EventMessage] SessionInfo message)
    {
        return message;
    }
}