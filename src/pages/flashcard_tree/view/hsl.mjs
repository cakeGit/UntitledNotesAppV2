
export class HSL {//Helper of a HSL color to get better looking gradients than simple RGB lerping

    constructor(h, s, l) {
        this.h = h;
        this.s = s;
        this.l = l;
    }

    lerp(other, t) {
        //Lerp the hue in the shortest direction around the color wheel
        let dh = other.h - this.h;
        if (dh > 180) dh -= 360;
        else if (dh < -180) dh += 360;
        return new HSL(
            (this.h + dh * t + 360) % 360,
            this.s + (other.s - this.s) * t,
            this.l + (other.l - this.l) * t,
        );
    }

    getCode() {
        return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;
    }

}

HSL.fromCode = (code) => { //Use a regex to get from the color picker's format
    const result = /hsl\((\d+), ([\d.]+)%, ([\d.]+)%\)/.exec(code);
    return new HSL(parseInt(result[1]), parseFloat(result[2]), parseFloat(result[3]));
}