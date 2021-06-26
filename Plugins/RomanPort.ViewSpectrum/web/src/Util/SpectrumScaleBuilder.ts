import { SpectrumFreqDisplayMode } from "../config/SpectrumFreqDisplayMode";
import SpectrumPart from "../parts/SpectrumPart";
import SpectrumWindow from "../SpectrumWindow";

export default class SpectrumScaleBuilder {

    constructor(canvas: HTMLCanvasElement, width: number, height: number) {
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");

        //Get scale
        this.width = width;
        this.height = height;

        //Apply
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    private static readonly FREQ_FORMATS: string[] = ["", "k", "M", "G", "T"];
    private static readonly FREQ_ROUNDING: number = 100;

    DrawYAxis(offset: number, range: number): SpectrumScaleBuilder {
        //Calculate the number of points we can nicely display on screen
        var maxPoints = (this.height - SpectrumPart.PADDING_HEIGHT) / 12;

        //Get the actual increment
        var increment = 5;
        while ((range / increment) > maxPoints)
            increment *= 2;

        //Get points
        var points = SpectrumScaleBuilder.FindPixelPoints(offset, offset + range, increment, this.height - SpectrumPart.PADDING_HEIGHT);

        //Get a row of pixels
        var row = this.CreateFilledImageData(this.width - SpectrumWindow.PADDING_WIDTH, 1);

        //Prepare text
        this.context.font = "10px Roboto";
        this.context.fillStyle = "white";
        this.context.textAlign = "right";

        //Plot points
        for (var i = 0; i < points.length; i++) {
            //Render scale text
            this.context.fillText(points[i][0].toString(), SpectrumWindow.PADDING_LEFT - 3, points[i][1] + 5 + SpectrumPart.PADDING_TOP, SpectrumWindow.PADDING_LEFT - 3);

            //Draw line
            this.context.putImageData(row, SpectrumWindow.PADDING_LEFT, points[i][1] + SpectrumPart.PADDING_TOP);
        }

        return this;
    }

    DrawXAxis(sampleRate: number, centerFreq: number, fixedIncrement?: number): SpectrumScaleBuilder {
        //Determine start and ending frequencies, assuming center freq
        var startFreq = centerFreq - (sampleRate / 2);
        var endFreq = centerFreq + (sampleRate / 2);

        //Calculate the number of points we can nicely display on screen
        var maxPoints = (this.width - SpectrumWindow.PADDING_WIDTH) / 50;

        //Get the actual increment
        var increment: number;
        if (fixedIncrement == null || fixedIncrement == 0) {
            //Automatically figure it out
            //(There's gotta be a better way of doing this)
            increment = 1;
            while (true) {
                var original = increment;
                increment = original * 5;
                if (((endFreq - startFreq) / increment) <= maxPoints)
                    break;
                increment = original * 10;
                if (((endFreq - startFreq) / increment) <= maxPoints)
                    break;
            }
        } else {
            //Use the requested fixed increment
            increment = fixedIncrement;
        }

        //Get points
        var points = SpectrumScaleBuilder.FindPixelPoints(startFreq, endFreq, increment, this.width - SpectrumWindow.PADDING_WIDTH);

        //Get a column of pixels
        var column = this.CreateFilledImageData(1, this.height - SpectrumPart.PADDING_HEIGHT);

        //Prepare text
        this.context.font = "10px Roboto";
        this.context.fillStyle = "white";
        this.context.textAlign = "center";

        //Plot points
        for (var i = 0; i < points.length; i++) {
            //Render scale text
            this.context.fillText(this.FormatFreq(points[i][0]), points[i][1] + SpectrumWindow.PADDING_LEFT, this.height - (SpectrumPart.PADDING_TOP / 2) - 5 - 2);

            //Draw line
            this.context.putImageData(column, points[i][1] + SpectrumWindow.PADDING_LEFT, SpectrumPart.PADDING_TOP);
        }

        return this;
    }

    private FormatFreq(freq: number): string {
        //Handle special cases
        if (freq == 0)
            return "DC";

        //Find the smallest value to represent it with
        var label = 0;
        while (Math.abs(freq) >= 1000) {
            freq /= 1000;
            label++;
        }

        //Round to desired amount
        freq = Math.round(freq * SpectrumScaleBuilder.FREQ_ROUNDING);

        //Format all
        return Math.floor(freq / SpectrumScaleBuilder.FREQ_ROUNDING).toString() + "." + (freq % SpectrumScaleBuilder.FREQ_ROUNDING).toString().padEnd(3, '0') + " " + SpectrumScaleBuilder.FREQ_FORMATS[label];
    }

    private CreateFilledImageData(width: number, height: number): ImageData {
        var data = this.context.createImageData(width, height);
        var len = height * width * 4;
        var index = 0;
        while(index < len) {
            data.data[index++] = 255;
            data.data[index++] = 255;
            data.data[index++] = 255;
            data.data[index++] = 60;
        }
        return data;
    }

    //Returns the pixels (and their respective data points) for all pixels between start and end, with the pixel being advanced by increment
    //Returns array of [value, pixel]
    private static FindPixelPoints(start: number, end: number, increment: number, width: number): number[][] {
        //Get first visible
        var first = Math.ceil(start / increment) * increment;

        //Calculate numbers per pixel
        var scale = width / (end - start);

        //Begin calculating pixels
        var output = [];
        for (var i = first; i <= end; i += increment) {
            output.push([i, Math.floor((i - start) * scale)]);
        }

        return output;
    }

}