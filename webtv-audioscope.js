function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

class WebTVAudioscope extends HTMLElement {


    constructor() {
        super();
    }
    connectedCallback() {
        const shadow = this.attachShadow({mode: "open"});
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.getAttribute("width") || "100";
        this.canvas.height = this.getAttribute("height") || "80";
        shadow.append(this.canvas);
        this.bgcolor = this.getAttribute("bgcolor") || "#868686";
        this.paintBackground();
        this.leftcolor = this.getAttribute("leftcolor") || "#8ece10";
        this.rightcolor = this.getAttribute("rightcolor") || "#ce8e10";
        this.leftoffset = parseInt(this.getAttribute("leftoffset") ?? "0");
        let bound = Math.floor(this.canvas.height/2.0);
        this.leftoffset = clamp(this.leftoffset, -bound, bound);
        this.rightoffset = parseInt(this.getAttribute("rightoffset") ?? "1");
        this.rightoffset = clamp(this.rightoffset, -bound, bound);
        this.gain = parseInt(this.getAttribute("gain") ?? "1");
        this.canvas.style.borderWidth = this.getAttribute("border") ?? "0";
        this.canvas.style.borderStyle = "inset";
        //this.drawLine(this.leftoffset, this.leftcolor);
        //this.drawLine(this.rightoffset, this.rightcolor);

        if(!WebTVAudioscope.audioContext) { // There should only be one audioContext that all <webtv-audioscope>s draw from
            WebTVAudioscope.audioContext = new AudioContext();
            let audioTags = document.querySelectorAll("audio[data-webtv-audioscope-source]");
            if(audioTags.length !== 1) {
                console.error("Expected to find one <audio data-webtv-audioscope-source>, found", audioTags);
                return;
            }
            let audioTag = audioTags[0];
            WebTVAudioscope.leftAnalyser = WebTVAudioscope.audioContext.createAnalyser();
            WebTVAudioscope.rightAnalyser = WebTVAudioscope.audioContext.createAnalyser();
            let source = WebTVAudioscope.audioContext.createMediaElementSource(audioTag);
            let splitter = WebTVAudioscope.audioContext.createChannelSplitter(2);
            source.connect(splitter);
            splitter.connect(WebTVAudioscope.leftAnalyser, 0);
            splitter.connect(WebTVAudioscope.rightAnalyser, 1);
            let merger = WebTVAudioscope.audioContext.createChannelMerger(2);
            WebTVAudioscope.leftAnalyser.connect(merger, 0, 0);
            WebTVAudioscope.rightAnalyser.connect(merger, 0, 1);
            merger.connect(WebTVAudioscope.audioContext.destination);
        }

        this.dataArray = new Uint8Array(WebTVAudioscope.leftAnalyser.frequencyBinCount);
        requestAnimationFrame(this.draw.bind(this));
    }

    paintBackground() {
        this.ctx.fillStyle = this.bgcolor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLine(offset, color) {
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height/2 + offset);
        this.ctx.lineTo(this.canvas.width, this.canvas.height/2 + offset);
        this.ctx.stroke();
    }

    draw() {
        // Oscilloscope code stolen from https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
        requestAnimationFrame(this.draw.bind(this));
        this.paintBackground();
        //this.drawLine(this.leftoffset, this.leftcolor);
        //this.drawLine(this.rightoffset, this.rightcolor); // TODO: Remove when right implemented
        this.drawAudioLine(WebTVAudioscope.leftAnalyser, this.leftoffset, this.leftcolor);
        this.drawAudioLine(WebTVAudioscope.rightAnalyser, this.rightoffset, this.rightcolor);

    }

    drawAudioLine(analyser, offset, color) {
        analyser.getByteTimeDomainData(this.dataArray);
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        let sliceWidth = this.canvas.width * 1.0 /  this.dataArray.length;
        let x = 0;
        for(let i = 0; i < this.dataArray.length; i++) {
            let v = this.dataArray[i] / 256.0;
            v = v * this.gain - this.gain / 2.0 + 1.0/2.0;
            let y = v * this.canvas.height + offset;

            if(i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        //this.ctx.lineTo(this.canvas.width, this.canvas.height/2); // WHy this default at the end?
        this.ctx.stroke();
    }


}

customElements.define("webtv-audioscope", WebTVAudioscope);