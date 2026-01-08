FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY AgentChat.Shared/AgentChat.Shared.csproj AgentChat.Shared/
COPY AgentChat.FinanceApi/AgentChat.FinanceApi.csproj AgentChat.FinanceApi/
RUN dotnet restore AgentChat.FinanceApi/AgentChat.FinanceApi.csproj

# Copy source and build
COPY AgentChat.Shared/ AgentChat.Shared/
COPY AgentChat.FinanceApi/ AgentChat.FinanceApi/
WORKDIR /src/AgentChat.FinanceApi
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dotnet", "AgentChat.FinanceApi.dll"]
