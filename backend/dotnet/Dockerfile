# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0@sha256:0d2d99c1f384a6b9c8f37aaea952937b2ffff20aa150c7eb4fdeb0a968797d31 AS build
WORKDIR /src

# Copy solution and project files first for better layer caching
COPY Portfolio.sln .
COPY FV.Api/FV.Api.csproj FV.Api/
COPY FV.Application/FV.Application.csproj FV.Application/
COPY FV.Domain/FV.Domain.csproj FV.Domain/
COPY FV.Infrastructure/FV.Infrastructure.csproj FV.Infrastructure/
COPY AgentChat.Shared/AgentChat.Shared.csproj AgentChat.Shared/
COPY AgentChat.Infrastructure/AgentChat.Infrastructure.csproj AgentChat.Infrastructure/
COPY AgentChat.ApiBff/AgentChat.ApiBff.csproj AgentChat.ApiBff/
COPY AgentChat.Orchestrator/AgentChat.Orchestrator.csproj AgentChat.Orchestrator/
COPY AgentChat.ModelGateway/AgentChat.ModelGateway.csproj AgentChat.ModelGateway/
COPY AgentChat.Tools/AgentChat.Tools.csproj AgentChat.Tools/
COPY AgentChat.FinanceKnowledge/AgentChat.FinanceKnowledge.csproj AgentChat.FinanceKnowledge/
COPY AgentChat.FinanceDataLake/AgentChat.FinanceDataLake.csproj AgentChat.FinanceDataLake/
COPY AgentChat.FinanceApi/AgentChat.FinanceApi.csproj AgentChat.FinanceApi/
COPY AgentChat.PortfolioAgent/AgentChat.PortfolioAgent.csproj AgentChat.PortfolioAgent/
COPY TinyToes.Infrastructure/TinyToes.Infrastructure.csproj TinyToes.Infrastructure/
COPY TinyToes.Api/TinyToes.Api.csproj TinyToes.Api/

# Restore dependencies
RUN dotnet restore Portfolio.sln

# Copy remaining source code
COPY . .

# Build and publish
RUN dotnet publish FV.Api/FV.Api.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0@sha256:906fe6afa26ebfb013a769a659a5bc1eb30424152bcec3c6cd8b0bd88dd69d1c AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser

# Copy published app
COPY --from=build /app/publish .

# Create data and uploads directories and set permissions
RUN mkdir -p /app/data /app/wwwroot/uploads && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/graphql?query=%7B__typename%7D || exit 1

# Entry point
ENTRYPOINT ["dotnet", "FV.Api.dll"]
