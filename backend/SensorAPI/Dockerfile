# Giai đoạn 1: Build mã nguồn
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy file project và khôi phục thư viện
COPY ["SensorApi.csproj", "./"]
RUN dotnet restore "SensorApi.csproj"

# Copy toàn bộ code và xuất bản ứng dụng
COPY . .
RUN dotnet publish "SensorApi.csproj" -c Release -o /app/publish

# Giai đoạn 2: Chạy ứng dụng
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Render yêu cầu ứng dụng chạy trên port 80
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "SensorApi.dll"]