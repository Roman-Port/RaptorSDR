import IRaptorWindowInfo from "../../sdk/ui/core/IRaptorWindowInfo";
import ISpectrumInfo from "../config/SpectrumInfo";
import SpectrumPart from "../parts/SpectrumPart";
import SpectrumPainter from "../Util/SpectrumPainter";

export default class SpectrumDummyGenerator {

    static GenerateDummy(data: IRaptorWindowInfo): HTMLElement {
        //Get the dummy spectrum and unpack from Base64
        var spectrum = atob((data.info as ISpectrumInfo).dummySpectrum);

        //Unpack data into floats
        var unpackedSpectrum = new Float32Array(spectrum.length);
        for (var i = 0; i < unpackedSpectrum.length; i++)
            unpackedSpectrum[i] = spectrum.charCodeAt(i) / 255;

        //Create the canvas to be painted on
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext('2d');
        canvas.width = unpackedSpectrum.length;
        canvas.height = 200;

        //Make gradients
        var foregroundGradient = SpectrumPainter.MakeGradient(ctx, canvas.height, SpectrumPart.COLOR_FOREGROUND_TOP, SpectrumPart.COLOR_FOREGROUND_BOTTOM);
        var backgroundGradient = SpectrumPainter.MakeGradient(ctx, canvas.height, SpectrumPart.COLOR_BACKGROUND_TOP, SpectrumPart.COLOR_BACKGROUND_BOTTOM);

        //Paint
        SpectrumPainter.PaintSpectrum(ctx, canvas.width, canvas.height, unpackedSpectrum, foregroundGradient, backgroundGradient);

        //Create container and configure
        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.margin = "auto";
        container.style.position = "relative";
        container.style.flexGrow = "1";
        container.style.minHeight = "200px";

        //Add canvas to container and configure
        container.appendChild(canvas);
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.right = "0";
        canvas.style.bottom = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        return container;
    }

}