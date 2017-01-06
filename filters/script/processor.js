//HTML5 Example: Chroma Key Filter
//(c) 2011-13
// Jürgen Lohr, lohr@beuth-hochschule.de
// Oliver Lietz, lietz@nanocosmos.de
//v1.4, May.2013

var isFirefox = /Firefox/.test(navigator.userAgent);
var isChrome = /Chrome/.test(navigator.userAgent);

var processor = {

    // Returns an [r,g,b] array for a given coordinate out of a frame
    // if x or y is outside the image, it returns [0,0,0]
    getPixelRGB: function(frame, x, y) {
        if (x < 0 || x > frame.width || y < 0 || y > frame.height) {
            return [0,0,0];
        }
        i = y * frame.width + x;
        var r = frame.data[i * 4 + 0];
        var g = frame.data[i * 4 + 1];
        var b = frame.data[i * 4 + 2];
        return [r,g,b];
    },

    // applies weights to values and returns a sum scalar
    // values = [2,5,7], weights = [1,2,0] => 12
    applyFilter: function(values, weights) {
        sum = 0;
        for (var i = 0; i < values.length; i++) {
            sum += values[i] * weights[i];
        }
        return sum;
    },

    // computeFrame
    // do the image processing for one frame
    // reads frame data from rgb picture ctx
    // writes chroma key pictures to ctx1..3
    computeFrame: function () {

        // get the context of the canvas 1
        var ctx = this.ctx1;

        // draw current video frame to ctx
        ctx.drawImage(this.video, 0, 0, this.width - 1, this.height);

        // get frame RGB data bytes from context ctx
        var frame = {};
        var length = 0;
        try {
            frame = ctx.getImageData(0, 0, this.width, this.height);
            frame_blur = ctx.getImageData(0, 0, this.width, this.height);
            frame_gauss = ctx.getImageData(0, 0, this.width, this.height);
            frame_prewitt = ctx.getImageData(0, 0, this.width, this.height);
            length = (frame.data.length) / 4;
        } catch (e) {
            // catch and display error of getImageData fails
            this.browserError(e);
        }

        // do the image processing
        // read in pixel data to r,g,b, key, write back
        // the current pixel is x_i
        // x_1 x_2 x_3
        // x_4 x_i x_6
        // x_7 x_8 x_9
        //
        for (var i = 0; i < length; i++) {
            x = i % frame.width;
            y = Math.floor(i / frame.width);
            r_1 = this.getPixelRGB(frame, x - 1, y - 1)[0];
            r_2 = this.getPixelRGB(frame, x    , y - 1)[0];
            r_3 = this.getPixelRGB(frame, x + 1, y - 1)[0];
            r_4 = this.getPixelRGB(frame, x - 1, y    )[0];
            r_i = this.getPixelRGB(frame, x    , y    )[0];
            r_6 = this.getPixelRGB(frame, x + 1, y    )[0];
            r_7 = this.getPixelRGB(frame, x - 1, y + 1)[0];
            r_8 = this.getPixelRGB(frame, x    , y + 1)[0];
            r_9 = this.getPixelRGB(frame, x + 1, y + 1)[0];
            g_1 = this.getPixelRGB(frame, x - 1, y - 1)[1];
            g_2 = this.getPixelRGB(frame, x    , y - 1)[1];
            g_3 = this.getPixelRGB(frame, x + 1, y - 1)[1];
            g_4 = this.getPixelRGB(frame, x - 1, y    )[1];
            g_i = this.getPixelRGB(frame, x    , y    )[1];
            g_6 = this.getPixelRGB(frame, x + 1, y    )[1];
            g_7 = this.getPixelRGB(frame, x - 1, y + 1)[1];
            g_8 = this.getPixelRGB(frame, x    , y + 1)[1];
            g_9 = this.getPixelRGB(frame, x + 1, y + 1)[1];
            b_1 = this.getPixelRGB(frame, x - 1, y - 1)[2];
            b_2 = this.getPixelRGB(frame, x    , y - 1)[2];
            b_3 = this.getPixelRGB(frame, x + 1, y - 1)[2];
            b_4 = this.getPixelRGB(frame, x - 1, y    )[2];
            b_i = this.getPixelRGB(frame, x    , y    )[2];
            b_6 = this.getPixelRGB(frame, x + 1, y    )[2];
            b_7 = this.getPixelRGB(frame, x - 1, y + 1)[2];
            b_8 = this.getPixelRGB(frame, x    , y + 1)[2];
            b_9 = this.getPixelRGB(frame, x + 1, y + 1)[2];

            red_matrix = [
                r_1, r_2, r_3,
                r_4, r_i, r_6,
                r_7, r_8, r_9
            ];
            green_matrix = [
                g_1, g_2, g_3,
                g_4, g_i, g_6,
                g_7, g_8, g_9
            ];
            blue_matrix = [
                b_1, b_2, b_3,
                b_4, b_i, b_6,
                b_7, b_8, b_9
            ];
            median_filter = [
                1/9, 1/9, 1/9,
                1/9, 1/9, 1/9,
                1/9, 1/9, 1/9
            ];

            gauss_filter = [  // http://dev.theomader.com/gaussian-kernel-calculator/
                0.077847,	0.123317,	0.077847,
                0.123317,	0.195346,	0.123317,
                0.077847,	0.123317,	0.077847,
            ];

            frame_blur.data[i*4+0] = this.applyFilter(red_matrix, median_filter);
            frame_blur.data[i*4+1] = this.applyFilter(green_matrix, median_filter);
            frame_blur.data[i*4+2] = this.applyFilter(blue_matrix, median_filter);
            frame_gauss.data[i*4+0] = this.applyFilter(red_matrix, gauss_filter);
            frame_gauss.data[i*4+1] = this.applyFilter(green_matrix, gauss_filter);
            frame_gauss.data[i*4+2] = this.applyFilter(blue_matrix, gauss_filter);

        }
        // write back to 3 canvas objects
        this.ctx1.putImageData(frame_blur, 0, 0);
        this.ctx2.putImageData(frame_gauss, 0, 0);
        this.ctx3.putImageData(frame_prewitt, 0, 0);
        return;
    },

    timerCallback: function () {
        if (this.error) {
            alert("Error happened - processor stopped.");
            return;
        }

        // call the computeFrame function to do the image processing
        this.computeFrame();

        // call this function again after a certain time
        // (40 ms = 1/25 s)
        var timeoutMilliseconds = 40;
        var self = this;
        setTimeout(function () {
            self.timerCallback();
        }, timeoutMilliseconds);
    },


    // doLoad: needs to be called on load
    doLoad: function () {

        this.error = 0;

        // check for a compatible browser
        if (!this.browserChecked)
            this.browserCheck();

        try {

            // get the html <video> and <canvas> elements
            this.video = document.getElementById("video");

            this.c1 = document.getElementById("c1");
            // get the 2d drawing context of the canvas
            this.ctx1 = this.c1.getContext("2d");
            this.c2 = document.getElementById("c2");
            this.ctx2 = this.c2.getContext("2d");
            this.c3 = document.getElementById("c3");
            this.ctx3 = this.c3.getContext("2d");

            // show video width and height to log
            this.log("Found video: size " + this.video.videoWidth + "x" + this.video.videoHeight);

            // scale the video display
            this.video.width = this.video.videoWidth / 2;
            this.video.height = this.video.videoWidth / 2;

            // scaling factor for resulting canvas
            var factor = 2;
            w = this.video.videoWidth / factor;
            h = this.video.videoHeight / factor;

            if (!w || !this.video) {
                alert("No Video Object Found?");
            }
            this.ctx1.width = w;
            this.ctx1.height = h;
            this.c1.width = w + 1;
            this.c1.height = h;
            this.c2.width = w;
            this.c2.height = h;
            this.c3.width = w;
            this.c3.height = h;
            this.width = w;
            this.height = h;

        } catch (e) {
            // catch and display error
            alert("Erro: " + e);
            return;
        }

        // start the timer callback to draw frames
        this.timerCallback();

    },

    // helper function: isCanvasSupported()
    // check if HTML5 canvas is available
    isCanvasSupported: function () {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    },

    // log(text)
    // display text in log area or console
    log: function (text) {
        var logArea = document.getElementById("log");
        if (logArea) {
            logArea.innerHTML += text + "<br>";
        }
        if (typeof console != "undefined") {
            console.log(text);
        }
    },

    // helper function: browserError()
    // displays an error message for incorrect browser settings
    browserError: function (e) {

        this.error = 1;

        //chrome security for local file operations
        if (isChrome)
            alert("Security Error\r\n - Call chrome with --allow-file-access-from-files\r\n\r\n" + e);
        else if (isFirefox)
            alert("Security Error\r\n - Open Firefox config (about: config) and set the value\r\nsecurity.fileuri.strict_origin_policy = false ");
        else
            alert("Error in getImageData " + e);
    },

    //helper function to check for browser compatibility
    browserCheck: function () {
        if (!this.isCanvasSupported()) {
            alert("No HTML5 canvas - use a newer browser please.");
            return false;
        }
        // check for local file access
        //if(location.host.length>1)
        //    return;
        this.browserChecked = true;
        return true;
    },
    browserChecked: false,
    error: 0
};
