namespace AgentChat.Orchestrator;

/// <summary>
/// Configuration options for the orchestrator
/// </summary>
public class OrchestratorOptions
{
    /// <summary>
    /// The type of assistant to use. Options: Finance, PortfolioVisitor, PortfolioAutonomous, PortfolioOwner
    /// </summary>
    public string AssistantType { get; set; } = "Finance";

    /// <summary>
    /// Portfolio owner name (for portfolio assistant modes)
    /// </summary>
    public string OwnerName { get; set; } = "Portfolio Owner";

    /// <summary>
    /// Portfolio name (for portfolio assistant modes)
    /// </summary>
    public string PortfolioName { get; set; } = "Portfolio";
}
