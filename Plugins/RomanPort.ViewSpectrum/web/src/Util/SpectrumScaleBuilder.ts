export default class SpectrumScaleBuilder {

    constructor(canvas: HTMLCanvasElement, width: number, height: number) {
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");

        //Get scale
        this.width = width;
        this.height = height;

        //Make pixels
        this.pixels = this.context.createImageData(this.width, this.height);
    }

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private pixels: ImageData;
    private width: number;
    private height: number;

    DrawYAxis(offset: number, range: number, increment: number): SpectrumScaleBuilder {
        //Get points
        var points = SpectrumScaleBuilder.FindPixelPoints(offset, offset + range, increment, this.height);

        //Plot points
        for (var i = 0; i < points.length; i++) {
            var value = points[i][0];
            var index = points[i][1] * this.width * 4;
            for (var x = 0; x < this.width; x++) {
                this.pixels.data[index++] = 255;
                this.pixels.data[index++] = 255;
                this.pixels.data[index++] = 255;
                this.pixels.data[index++] = 128;
            }
        }

        return this;
    }

    Apply() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context.putImageData(this.pixels, 0, 0);
    }

    //Returns the pixels (and their respective data points) for all pixels between start and end, with the pixel being advanced by increment
    //Returns array of [value, pixel]
    private static FindPixelPoints(start: number, end: number, increment: number, width: number): number[][] {
        //Get first visible
        var first = start + (start % increment);

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