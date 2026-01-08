FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY AgentChat.Shared/AgentChat.Shared.csproj AgentChat.Shared/
COPY AgentChat.Infrastructure/AgentChat.Infrastructure.csproj AgentChat.Infrastructure/
COPY AgentChat.ModelGateway/AgentChat.ModelGateway.csproj AgentChat.ModelGateway/

# Restore
RUN dotnet restore AgentChat.ModelGateway/AgentChat.ModelGateway.csproj

# Copy source
COPY AgentChat.Shared/ AgentChat.Shared/
COPY AgentChat.Infrastructure/ AgentChat.Infrastructure/
COPY AgentChat.ModelGateway/ AgentChat.ModelGateway/

# Build
WORKDIR /src/AgentChat.ModelGateway
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AgentChat.ModelGateway.dll"]
