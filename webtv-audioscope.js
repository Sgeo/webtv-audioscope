(function() {

    function clamp(number, min, max) {
        return Math.max(min, Math.min(number, max));
    }

    function fixColor(colorstr) {
        return colorstr.replace(/^[^#][0-9a-fA-F]+$/, "#$&");
    }

    function drawWithAlpha(ctx, callback) {
        callback(0);
        ctx.globalAlpha = 0.5;
        callback(-1);
        callback(1);
        ctx.globalApha = 1.0;
    }

    class WebTVAudioscope extends HTMLElement {

        static audioscopes = new Set();

        constructor() {
            super();
        }
        connectedCallback() {
            const shadow = this.attachShadow({mode: "open"});
            this.canvas = document.createElement("canvas");
            this.ctx = this.canvas.getContext("2d");
            this.ctx.imageSmoothingEnabled = false;
            this.canvas.width = this.getAttribute("width") || "100";
            this.canvas.height = this.getAttribute("height") || "80";
            shadow.append(this.canvas);
            this.bgcolor = fixColor(this.getAttribute("bgcolor") || "#7B7B7B");
            this.paintBackground();
            this.leftcolor = fixColor(this.getAttribute("leftcolor") || "#8ece10");
            this.rightcolor = fixColor(this.getAttribute("rightcolor") || "#ce8e10");
            this.leftoffset = parseInt(this.getAttribute("leftoffset") ?? "0");
            let bound = Math.floor(this.canvas.height/2.0);
            this.rightoffset = parseInt(this.getAttribute("rightoffset") ?? "1");
            this.gain = parseInt(this.getAttribute("gain") ?? "1");
            this.canvas.style.borderWidth = this.getAttribute("border") ?? "0";
            this.canvas.style.borderStyle = "solid";
            this.canvas.style.borderColor = "#1C1C1C94 #C9C9C99C #C9C9C99C #1C1C1C94";
            //this.drawLine(this.leftoffset, this.leftcolor);
            //this.drawLine(this.rightoffset, this.rightcolor);

            //this.dataArray = new Uint8Array(WebTVAudioscope.leftAnalyser.frequencyBinCount);
            //requestAnimationFrame(this.draw.bind(this));

            WebTVAudioscope.audioscopes.add(this);
        }

        disconnectedCallback() {
            WebTVAudioscope.audioscopes.delete(this);
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

        draw(leftData, rightData) {
            
            this.paintBackground();
            this.drawAudioLine(leftData, this.leftoffset, this.leftcolor);
            this.drawAudioLine(rightData, this.rightoffset, this.rightcolor);

        }

        drawAudioLine(data, offset, color) {
            // Oscilloscope code stolen from https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
            this.ctx.fillStyle = color;
            let sliceWidth = data.length / this.canvas.width;
            for(let x = 0; x < this.canvas.width; x++) {
                let slice = data.subarray(x * sliceWidth, (x+1) * sliceWidth);
                let v = this.gain * slice.reduce((prev, cur) => prev+cur, 0.0)/slice.length;
                let y = -v * this.canvas.height /2 + Math.floor(this.canvas.height/2) + offset; // Rounding causes stirrer to disappear unless lineWidth>1. -v because y=0 is top
                y = clamp(y, 0, this.canvas.height - 1);
                this.ctx.fillRect(x, y, 1, 1);
                this.ctx.globalAlpha = 0.5;
                this.ctx.fillRect(x, y-1, 1, 1);
                this.ctx.fillRect(x, y+1, 1, 1);
                this.ctx.globalAlpha = 1.0;
            }
            //this.ctx.lineTo(this.canvas.width, this.canvas.height/2); // WHy this default at the end?
            
        }


    }

    window.addEventListener("DOMContentLoaded", function() {
        WebTVAudioscope.audioContext = new AudioContext();
        WebTVAudioscope.leftAnalyser = WebTVAudioscope.audioContext.createAnalyser();
        WebTVAudioscope.rightAnalyser = WebTVAudioscope.audioContext.createAnalyser();
        [WebTVAudioscope.leftAnalyser, WebTVAudioscope.rightAnalyser].forEach(analyser => {
            //analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.0;
        });
        let splitter = WebTVAudioscope.audioContext.createChannelSplitter(2);
        splitter.connect(WebTVAudioscope.leftAnalyser, 0);
        splitter.connect(WebTVAudioscope.rightAnalyser, 1);
        let merger = WebTVAudioscope.audioContext.createChannelMerger(2);
        WebTVAudioscope.leftAnalyser.connect(merger, 0, 0);
        WebTVAudioscope.rightAnalyser.connect(merger, 0, 1);
        merger.connect(WebTVAudioscope.audioContext.destination);
        
        let audioTags = document.querySelectorAll("audio");
        for(let audioTag of audioTags) {
            let source = WebTVAudioscope.audioContext.createMediaElementSource(audioTag);
            source.connect(splitter);
            audioTag.addEventListener("play", function() {
                // Hopefully work around autoplay problems
                WebTVAudioscope.audioContext.resume();
            });
        }

        WebTVAudioscope.leftData = new Float32Array(WebTVAudioscope.leftAnalyser.fftSize);
        WebTVAudioscope.rightData = new Float32Array(WebTVAudioscope.rightAnalyser.fftSize);

        function drawAll() {
            requestAnimationFrame(drawAll);
            WebTVAudioscope.leftAnalyser.getFloatTimeDomainData(WebTVAudioscope.leftData);
            WebTVAudioscope.rightAnalyser.getFloatTimeDomainData(WebTVAudioscope.rightData);
            for(let audioscope of WebTVAudioscope.audioscopes) {
                audioscope.draw(WebTVAudioscope.leftData, WebTVAudioscope.rightData);
            }
        }
        drawAll();
    });

    customElements.define("webtv-audioscope", WebTVAudioscope);

})();