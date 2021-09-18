let canvas = document.getElementById("canvas");
let context2d = canvas.getContext("2d");
let audioZoom = document.getElementById("audioZoom");
let audioZoomLabel = document.getElementById("audioZoomLabel");
let trigger1Slider = document.getElementById("trigger1Slider");
let trigger2Slider = document.getElementById("trigger2Slider");
let results = document.getElementById("results");
let resumeButton = document.getElementById("resumeButton");
let distanceInput = document.getElementById("distanceInput");
let temperatureInput = document.getElementById("temperatureInput");
let maxSpeedInput = document.getElementById("maxSpeedInput");
let gainSlider = document.getElementById("gainSlider");

// navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// navigator.getUserMedia({ video: false, audio: true }, callback, console.log);
let ctx, mic, analyser;

let zoom = 10;
let bufferLength;
let sampleRate;
let drawnData;
let dataArray;
let stopped = false;

startInput();
let minimumDelay;
async function startInput() {
    let stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx = new AudioContext();
    mic = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();

    sampleRate = mic.context.sampleRate;
    calculateMinimumDelay();
    mic.connect(analyser);

    audioZoom.addEventListener("change", function () { setupBuffers(analyser); });
    audioZoom.addEventListener("input", function () { audioZoomLabel.innerText = audioZoom.value; })
    setupBuffers(analyser)

    function analyze() {
        analyser.getByteTimeDomainData(dataArray);
        if (gainSlider.value != 1) {
            for (let i = 0; i < dataArray.length; i++) {
                dataArray[i] = (dataArray[i] - 128) * gainSlider.value + 128;
            }
        }
        let offset = getNewBufferOffset(dataArray, drawnData.subarray(bufferLength * (zoom - 1)));
        drawnData.set(drawnData.subarray(offset), 0)
        // drawnData.set(dataArray, bufferLength * (zoom - 1));
        drawnData.set(dataArray, bufferLength * (zoom - 1));

        if (!stopped) {
            stopped = checkTriggers(drawnData, dataArray, offset);
            draw(drawnData);
        } else {
            let velocity = calculateVelocity();
            results.innerText += Math.round(velocity) + " ft/s, " + Math.round(velocity * 0.3048) + " m/s" + '\n';
            resumeButton.onclick = function () { resumeButton.onclick = null; resume(); analyze(); }
            return;
        }
        requestAnimationFrame(analyze);
    }
    analyze();
}

function resume() {
    trigger1Index = null;
    trigger2Index = null;
    stopped = false;
}
function setupBuffers(analyser) {
    bufferLength = analyser.fftSize;
    zoom = audioZoom.value;
    drawnData = new Uint8Array(bufferLength * zoom);
    for (let i = 0; i < drawnData.length; i++) { drawnData[i] = 128; }
    dataArray = new Uint8Array(bufferLength);
};

function draw(drawnData) {
    context2d.fillStyle = 'rgb(200, 200, 200)';
    context2d.strokeStyle = 'rgb(0, 0, 0)';


    context2d.fillRect(0, 0, canvas.width, canvas.height);
    context2d.lineWidth = 2;

    let datapointsPerPixel = drawnData.length / canvas.width;
    let x = 0;
    context2d.beginPath();
    for (let iGenau = 0; iGenau < drawnData.length; iGenau += datapointsPerPixel) {
        let i = Math.round(iGenau);

        let v = 0;
        for (let j = 0; j < datapointsPerPixel; j++) {
            let volume = Math.abs(drawnData[i + j] - 128);
            if (volume > v) v = volume;
        }
        v = v / 128.0;
        const y = canvas.height - v * canvas.height;

        if (i === 0) context2d.moveTo(x, y);
        else context2d.lineTo(x, y);
        x++;
    }

    context2d.lineTo(canvas.width, canvas.height);
    context2d.stroke();

    context2d.beginPath();
    context2d.strokeStyle = 'rgb(0, 255, 0)';
    context2d.moveTo(0, canvas.height * (1 - trigger1Slider.value));
    context2d.lineTo(canvas.width, canvas.height * (1 - trigger1Slider.value));
    if (trigger1Index != null) { drawTriggerAtIndex(trigger1Index, datapointsPerPixel); }
    context2d.stroke();

    context2d.beginPath();
    context2d.strokeStyle = 'rgb(255, 0, 0)';
    context2d.moveTo(0, canvas.height * (1 - trigger2Slider.value));
    context2d.lineTo(canvas.width, canvas.height * (1 - trigger2Slider.value));
    if (trigger2Index != null) { drawTriggerAtIndex(trigger2Index, datapointsPerPixel); }
    context2d.stroke();
}
function drawTriggerAtIndex(index, datapointsPerPixel) {
    context2d.moveTo(index / datapointsPerPixel, 0);
    context2d.lineTo(index / datapointsPerPixel, canvas.height);
}
let trigger1Index = null;
let trigger2Index = null;
function checkTriggers(drawndata, sample, offset) {
    if (trigger1Index != null) {
        trigger1Index -= offset;
        if (trigger1Index < 0) { trigger1Index = null }
    }
    if (trigger2Index != null) {
        trigger2Index -= offset;
        if (trigger1Index < drawndata.length / 4) { return true }
    }
    if (trigger1Index == null) {
        for (let i = sample.length - offset - 1; i < sample.length; i++) {
            let volume = Math.abs(sample[i] - 128);
            if (volume > trigger1Slider.value * 128) {
                trigger1Index = i + drawndata.length - sample.length;
                break;
            }
        }
    } else if (trigger2Index == null) {
        for (let i = 0; i < sample.length; i++) {
            let volume = Math.abs(sample[i] - 128);
            if (volume > trigger2Slider.value * 128) {
                let newTrigger = i + drawndata.length - sample.length;
                if ((newTrigger - trigger1Index) > minimumDelay) {
                    trigger2Index = newTrigger;
                    break;
                }
            }
        }
    }
    return false;
}

function getNewBufferOffset(newData, oldData) {
    let offset = 0;
    for (let i = 0; i < oldData.length; i += 128) {
        for (let j = 0; j < newData.length - i; j++) {
            if (newData[j] != oldData[j + i]) break;
            if (j == newData.length - i - 1) offset = i;
        }
    }
    return offset;
}

function calculateMinimumDelay() {
    let speedOfSound = 20.05 * Math.sqrt(273.15 + parseFloat(temperatureInput.value));
    let soundDelay = distanceInput.value / speedOfSound;
    let totalTime = soundDelay + distanceInput.value / (maxSpeedInput.value * 0.3048);
    minimumDelay = totalTime * sampleRate;
}
maxSpeedInput.addEventListener("change", calculateMinimumDelay)

function calculateVelocity() {
    let speedOfSound = 20.05 * Math.sqrt(273.15 + parseFloat(temperatureInput.value));
    let soundDelay = distanceInput.value / speedOfSound;
    let totalTime = (trigger2Index - trigger1Index) / sampleRate;
    let arrowVelocity = distanceInput.value / (totalTime - soundDelay);
    let arrowVelocityImperial = arrowVelocity * 3.28084;

    console.log("Total time: " + totalTime);
    return arrowVelocityImperial;
}
console.log("Expected Total time: " + (1 / (231 / 60)))