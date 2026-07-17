# Auth Service (.NET 8)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/AuthService.Api/AuthService.Api.csproj", "AuthService.Api/"]
COPY ["src/AuthService.Application/AuthService.Application.csproj", "AuthService.Application/"]
COPY ["src/AuthService.Domain/AuthService.Domain.csproj", "AuthService.Domain/"]
COPY ["src/AuthService.Persistence/AuthService.Persistence.csproj", "AuthService.Persistence/"]

RUN dotnet restore "AuthService.Api/AuthService.Api.csproj"

COPY src/AuthService.Api ./AuthService.Api
COPY src/AuthService.Application ./AuthService.Application
COPY src/AuthService.Domain ./AuthService.Domain
COPY src/AuthService.Persistence ./AuthService.Persistence

RUN dotnet build "AuthService.Api/AuthService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AuthService.Api/AuthService.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 5156
ENV ASPNETCORE_URLS=http://+:5156

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:5156/health || exit 1

ENTRYPOINT ["dotnet", "AuthService.Api.dll"]
