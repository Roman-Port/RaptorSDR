export default class RaptorUtil {

    constructor() {
        
    }

    static GenerateRandomString(length: number): string {
        const CHARSET = "QWERTYUIOPLKJHGFDSAZXCVBNM1234567890";
        var output = "";
        for (var i = 0; i < length; i++) {
            output += CHARSET[Math.floor(Math.random() * CHARSET.length)];
        }
        return output;
    }

}