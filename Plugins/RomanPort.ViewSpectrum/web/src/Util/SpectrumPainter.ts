export default class SpectrumPainter {

    static MakeGradient(context: CanvasRenderingContext2D, height: number, startColor: string, endColor: string): CanvasGradient {
        var e = context.createLinearGradient(0, 0, 0, height);
        e.addColorStop(0, startColor);
        e.addColorStop(1, endColor);
        return e;
	}

    static PaintSpectrum(context: CanvasRenderingContext2D, width: number, height: number, frame: Float32Array, foreground: string | CanvasGradient | CanvasPattern, background: string | CanvasGradient | CanvasPattern) {
        //Clear canvas
        context.fillStyle = foreground;
        context.fillRect(0, 0, width, height);

        //Paint
        context.beginPath();
        context.moveTo(0, frame[0] * height);
        context.strokeStyle = "white";
        context.fillStyle = background;
        var value: number;
        for (var i = 1; i < frame.length; i++) {
            value = Math.floor(frame[i] * height);
            context.lineTo(i, value);
            context.fillRect(i, 0, 1, value);
        }
        context.stroke();
	}

}