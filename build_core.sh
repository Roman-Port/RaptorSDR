dotnet build ./RaptorSDR.Server/RaptorSDR.Server/ -c Release
dotnet build ./RaptorSDR.Server/RaptorPluginUtil/ -c Release
cd RaptorSDR.Web
npm update
npx webpack --env RAPTORSDR_USER=$RAPTORSDR_USER
cd ..