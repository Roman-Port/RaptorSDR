import RaptorConnection from "../RaptorConnection";
import RaptorPluginContext from "./RaptorPluginContext";
import RaptorPluginPackage from "./RaptorPluginPackage";

export default class RaptorPluginPackageManager {

    static async LoadPackages(conn: RaptorConnection, plugins: RaptorPluginContext[]) {
        //Loop through plugins and find loadable packages
        var loadableIds = [];
        var loadablePlugins = [];
        var loadableFrontends = [];
        for (var i = 0; i < plugins.length; i++) {
            for (var j = 0; j < plugins[i].info.frontends.length; j++) {
                var frontend = plugins[i].info.frontends[j];
                if (frontend.platform == "WEB") {
                    loadableIds.push(frontend.sha256);
                    loadablePlugins.push(plugins[i]);
                    loadableFrontends.push(frontend);
                }
            }
        }

        //Request all of these packages
        var packages = await conn.GetHttpRequest("/packages", "POST")
            .SetBody(JSON.stringify(loadableIds))
            .AsArrayBuffer();

        //Create packages
        var offset = 0;
        var view = new DataView(packages);
        for (var i = 0; i < loadableIds.length; i++) {
            //Read length
            var len = view.getInt32(offset, true);
            offset += 4;

            //Create view
            var payload = packages.slice(offset, offset + len);
            offset += len;

            //Create and add package
            loadablePlugins[i].AddPackage(new RaptorPluginPackage(loadableFrontends[i], payload));
        }
    }

}