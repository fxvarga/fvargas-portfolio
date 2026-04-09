FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["TinyToes.Api/TinyToes.Api.csproj", "TinyToes.Api/"]
COPY ["TinyToes.Infrastructure/TinyToes.Infrastructure.csproj", "TinyToes.Infrastructure/"]
RUN dotnet restore "TinyToes.Api/TinyToes.Api.csproj"
COPY TinyToes.Api/ TinyToes.Api/
COPY TinyToes.Infrastructure/ TinyToes.Infrastructure/
WORKDIR "/src/TinyToes.Api"
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

RUN adduser --disabled-password --gecos "" appuser
USER appuser

ENTRYPOINT ["dotnet", "TinyToes.Api.dll"]
