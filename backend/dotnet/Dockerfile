# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files first for better layer caching
COPY Portfolio.sln .
COPY FV.Api/FV.Api.csproj FV.Api/
COPY FV.Application/FV.Application.csproj FV.Application/
COPY FV.Domain/FV.Domain.csproj FV.Domain/
COPY FV.Infrastructure/FV.Infrastructure.csproj FV.Infrastructure/
COPY FV.Patterns/FV.Patterns.csproj FV.Patterns/

# Restore dependencies
RUN dotnet restore Portfolio.sln

# Copy remaining source code
COPY . .

# Build and publish
RUN dotnet publish FV.Api/FV.Api.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser

# Copy published app
COPY --from=build /app/publish .

# Create data directory for SQLite and set permissions
RUN mkdir -p /app/data && chown -R appuser:appuser /app

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
