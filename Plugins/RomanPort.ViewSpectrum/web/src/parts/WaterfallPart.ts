import BasePart from "./BasePart";
import SpectrumWindow from "../SpectrumWindow";

export default class WaterfallPart extends BasePart {

    constructor(container: HTMLElement) {
        super(container);

        //Precompute colors for faster lookup
        this.precomputedColors = [];
        for (var i = 0; i < 256; i++) {
            this.precomputedColors.push(WaterfallPart.CalculateColor(i / 256));
        }
    }

    private static WATERFALL_COLORS: number[][] = [
        [0, 0, 32],
        [0, 0, 48],
        [0, 0, 80],
        [0, 0, 145],
        [30, 144, 255],
        [255, 255, 255],
        [255, 255, 0],
        [254, 109, 22],
        [255, 0, 0],
        [198, 0, 0],
        [159, 0, 0],
        [117, 0, 0],
        [74, 0, 0]
    ];

    private precomputedColors: number[][];

    SettingsChanged(freq: number, sampleRate: number, offsetDb: number, rangeDb: number): void {
        
    }

    Update(width: number, height: number, offset: number, range: number): void {
        //Check if a resize is possible
        if (width == 0 || height == 0 || this.mainCanvas.width == 0 || this.mainCanvas.height == 0) {
            //Apply normally
            super.Update(width, height, offset, range);
        } else {
            //Save current pixel data
            var oldData = this.mainCanvasContext.getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            var oldWidth = this.mainCanvas.width;
            var oldHeight = this.mainCanvas.height;

            //Resize
            super.Update(width, height, offset, range);

            //Now, create new image data and scale from the old data
            var newHeight = Math.min(height, oldHeight);
            var newWidth = width - SpectrumWindow.PADDING_WIDTH;
            var scale = oldWidth / newWidth;

            //Check if we can do a quick resize
            if (scale == 1) {
                //Simply copy
                this.mainCanvasContext.putImageData(oldData, 0, 0);
            } else {
                //Slow resize
                var newData = this.mainCanvasContext.createImageData(newWidth, newHeight);

                //Scale
                for (var i = 0; i < newHeight; i++) {
                    for (var x = 0; x < newWidth; x++) {
                        var src = ((i * oldWidth) + Math.floor(x * scale)) * 4;
                        var dst = ((i * newWidth) + x) * 4;
                        newData.data[dst + 0] = oldData.data[src + 0];
                        newData.data[dst + 1] = oldData.data[src + 1];
                        newData.data[dst + 2] = oldData.data[src + 2];
                        newData.data[dst + 3] = oldData.data[src + 3];
                    }
                }

                //Apply back
                this.mainCanvasContext.putImageData(newData, 0, 0);
            }
        }
    }

    protected DrawFrame(frame: Float32Array): void {
        //Move entire spectrum down one pixel
        this.mainCanvasContext.drawImage(this.mainCanvas, 0, 1);

        //Get pixels on first line
        var line = this.mainCanvasContext.createImageData(this.mainCanvas.width, 1);

        //Write frame to line
        var color: number[];
        var offset = 0;
        for (var i = 0; i < frame.length; i++) {
            //Get color
            color = this.precomputedColors[Math.floor(frame[i] * 255)];

            //Write
            line.data[offset++] = color[0];
            line.data[offset++] = color[1];
            line.data[offset++] = color[2];
            line.data[offset++] = 255;
        }

        //Apply updated pixels to line
        this.mainCanvasContext.putImageData(line, 0, 0);
    }

    private static CalculateColor(percent: number) {
        //Make sure percent is within range
        percent = 1 - percent;
        percent = Math.max(0, percent);
        percent = Math.min(1, percent);

        //Calculate
        var scale = WaterfallPart.WATERFALL_COLORS.length - 1;

        //Get the two colors to mix
        var mix2 = this.WATERFALL_COLORS[Math.floor(percent * scale)];
        var mix1 = this.WATERFALL_COLORS[Math.ceil(percent * scale)];

        //Get ratio
        var ratio = (percent * scale) - Math.floor(percent * scale);

        //Mix
        return [
            (Math.ceil((mix1[0] * ratio) + (mix2[0] * (1 - ratio)))),
            (Math.ceil((mix1[1] * ratio) + (mix2[1] * (1 - ratio)))),
            (Math.ceil((mix1[2] * ratio) + (mix2[2] * (1 - ratio))))
        ];
    }

}