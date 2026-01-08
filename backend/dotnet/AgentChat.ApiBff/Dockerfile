FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY AgentChat.Shared/AgentChat.Shared.csproj AgentChat.Shared/
COPY AgentChat.Infrastructure/AgentChat.Infrastructure.csproj AgentChat.Infrastructure/
COPY AgentChat.FinanceKnowledge/AgentChat.FinanceKnowledge.csproj AgentChat.FinanceKnowledge/
COPY AgentChat.ApiBff/AgentChat.ApiBff.csproj AgentChat.ApiBff/

# Restore
RUN dotnet restore AgentChat.ApiBff/AgentChat.ApiBff.csproj

# Copy source
COPY AgentChat.Shared/ AgentChat.Shared/
COPY AgentChat.Infrastructure/ AgentChat.Infrastructure/
COPY AgentChat.FinanceKnowledge/ AgentChat.FinanceKnowledge/
COPY AgentChat.ApiBff/ AgentChat.ApiBff/

# Build
WORKDIR /src/AgentChat.ApiBff
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AgentChat.ApiBff.dll"]
