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
        this.leftoffset = parseInt(this.getAttribute("leftoffset") ?? 0);
        this.rightoffset = parseInt(this.getAttribute("rightoffset") ?? 1);
        this.drawLine(this.leftoffset, this.leftcolor);
        this.drawLine(this.rightoffset, this.rightcolor);
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
}

customElements.define("webtv-audioscope", WebTVAudioscope);