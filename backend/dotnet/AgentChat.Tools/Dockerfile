FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files for restore (ordered by dependency hierarchy)
# AgentChat core projects
COPY AgentChat.Shared/AgentChat.Shared.csproj AgentChat.Shared/
COPY AgentChat.Infrastructure/AgentChat.Infrastructure.csproj AgentChat.Infrastructure/
COPY AgentChat.FinanceKnowledge/AgentChat.FinanceKnowledge.csproj AgentChat.FinanceKnowledge/
COPY AgentChat.FinanceDataLake/AgentChat.FinanceDataLake.csproj AgentChat.FinanceDataLake/

# FV domain projects (required by AgentChat.PortfolioAgent and FV.Infrastructure)
COPY FV.Domain/FV.Domain.csproj FV.Domain/
COPY FV.Infrastructure/FV.Infrastructure.csproj FV.Infrastructure/

# Portfolio Agent project
COPY AgentChat.PortfolioAgent/AgentChat.PortfolioAgent.csproj AgentChat.PortfolioAgent/

# Tools project
COPY AgentChat.Tools/AgentChat.Tools.csproj AgentChat.Tools/

# Restore
RUN dotnet restore AgentChat.Tools/AgentChat.Tools.csproj

# Copy source
COPY AgentChat.Shared/ AgentChat.Shared/
COPY AgentChat.Infrastructure/ AgentChat.Infrastructure/
COPY AgentChat.FinanceKnowledge/ AgentChat.FinanceKnowledge/
COPY AgentChat.FinanceDataLake/ AgentChat.FinanceDataLake/
COPY FV.Domain/ FV.Domain/
COPY FV.Infrastructure/ FV.Infrastructure/
COPY AgentChat.PortfolioAgent/ AgentChat.PortfolioAgent/
COPY AgentChat.Tools/ AgentChat.Tools/

# Build
WORKDIR /src/AgentChat.Tools
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AgentChat.Tools.dll"]
