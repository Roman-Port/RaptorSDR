dotnet build .\RaptorSDR.Server\RaptorSDR.Server\ -c Release
dotnet build .\RaptorSDR.Server\RaptorPluginUtil\ -c Release
cd RaptorSDR.Web
call npm update
call npx webpack --env RAPTORSDR_USER=%RAPTORSDR_USER%
cd ..