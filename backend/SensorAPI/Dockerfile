# Giai đoạn 1: Build mã nguồn
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy file project và khôi phục thư viện
COPY ["SensorApi.csproj", "./"]
RUN dotnet restore "SensorApi.csproj"

# Copy toàn bộ code và xuất bản ứng dụng
COPY . . 
RUN dotnet publish "SensorApi.csproj" -c Release -o /app/publish

# Giai đoạn 2: Chạy ứng dụng
FROM mcr.microsoft.com/dotnet/aspnet:10.0
# Cài đặt thư viện hỗ trợ PostgreSQL trên Linux
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .

# Cấu hình cổng 8080 cho Render
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SensorApi.dll"]