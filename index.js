let AudioContext = window.AudioContext || window.webkitAudioContext || false;
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
let audioInputSelect = document.getElementById("audioInputSelect");

let ctx, mic, analyser;

let zoom = 10;
let bufferLength;
let sampleRate;
let drawnData;
let dataArray;
let stopped = false;


async function setup() {
    let audioSource = audioInputSelect.value;
    let constraints = { video: false, audio: true }
    if (audioSource != "auto") constraints = { audio: { deviceId: audioSource ? { exact: audioSource } : undefined } };

    let stream = await navigator.mediaDevices.getUserMedia(constraints);

    ctx = new AudioContext();
    console.log(ctx.baseLatency)
    mic = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();

    sampleRate = mic.context.sampleRate;
    calculateMinimumDelay();

    mic.connect(analyser);

    audioZoom.addEventListener("change", function () { setupBuffers(analyser); });
    audioZoom.addEventListener("input", function () { audioZoomLabel.innerText = audioZoom.value; })
    audioZoomLabel.innerText = audioZoom.value;
    setupBuffers(analyser)


    requestAnimationFrame(analyze);
}



function analyze() {
    analyser.getByteTimeDomainData(dataArray);
    if (gainSlider.value != 1) {
        for (let i = 0; i < dataArray.length; i++) {
            dataArray[i] = (dataArray[i] - 128) * gainSlider.value + 128;
        }
    }
    let offset = getNewBufferOffset(dataArray, drawnData.subarray(bufferLength * (zoom - 1)));
    drawnData.set(drawnData.subarray(offset), 0)
    drawnData.set(dataArray, bufferLength * (zoom - 1));

    if (!stopped) {
        stopped = checkTriggers(drawnData, dataArray, offset);
        draw2(drawnData);
        // draw(drawnData, offset);
        let a = 0;
    } else {
        let totalTime = (trigger2Index - trigger1Index) / sampleRate;
        let velocity = calculateVelocity();
        results.innerText = Math.round(velocity) + " ft/s, " + Math.round(velocity * 0.3048) + " m/s, time measured: " + totalTime + "s" + '\n' + results.innerText;
        showStartButton();
        return;
    }
    requestAnimationFrame(analyze);
    //setTimeout(analyze, 1000 / 60);
}

resumeButton.onclick = function () {
    if (stopped) {
        resume();
        analyze();
    } else {
        //initial start
        setup();
        resumeButton.style.display = "none";
        resumeButton.innerText = "Resume";
    }
}
function showStartButton() {
    resumeButton.style.display = "inline-block";
}
showStartButton();

function resume() {
    trigger1Index = null;
    trigger2Index = null;
    stopped = false;
    resumeButton.style.display = "none";
}
function setupBuffers(analyser) {
    bufferLength = analyser.fftSize;
    zoom = audioZoom.value;
    drawnData = new Uint8Array(bufferLength * zoom);
    for (let i = 0; i < drawnData.length; i++) { drawnData[i] = 128; }
    dataArray = new Uint8Array(bufferLength);
};


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
    let offset = newData.length;
    for (let i = 0; i < oldData.length; i += 128) {
        let remainingDataLength = newData.length - i - 1;
        for (let j = 0; j < newData.length - i; j++) {
            if (newData[j] != oldData[j + i]) break;
            if (j == remainingDataLength) offset = i;
        }
    }
    return offset;
}


//console.log("Expected Total time: " + (1 / (231 / 60)))
