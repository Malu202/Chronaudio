

let zoom = parseInt(audioZoom.value);
let stopped = false;
let dataHistory = new Float32Array();
let drawnData = new Float32Array();
let gainNode;

async function setup() {
    let audioSource = audioInputSelect.value;
    let constraints = { video: false, audio: true }
    if (audioSource != "auto") constraints = { audio: { deviceId: audioSource ? { exact: audioSource } : undefined } };

    let stream = await navigator.mediaDevices.getUserMedia(constraints);
    let context = new AudioContext();
    gainNode = context.createGain();
    let source = context.createMediaStreamSource(stream);

    let scriptNode;
    if (!context.createScriptProcessor) {
        scriptNode = context.createJavaScriptNode(4096, 2, 2);
    } else {
        scriptNode = context.createScriptProcessor(4096, 2, 2);
    }
    sampleRate = context.sampleRate;
    calculateMinimumDelay();
    setupBuffers(scriptNode.bufferSize);

    scriptNode.onaudioprocess = function (e) {
        onNewData(e.inputBuffer.getChannelData(0));
    }

    source.connect(gainNode);
    gainNode.connect(scriptNode);
    scriptNode.connect(context.destination);
    drawLoop();
}

function setupBuffers(bufferSize) {
    zoom = parseInt(audioZoom.value);
    dataHistory = new Float32Array(bufferSize * zoom);
    drawnData = new Float32Array(canvas.width);
    for (let i = 0; i < dataHistory.length; i++) { dataHistory[i] = 0; }
};
function onNewData(newData) {
    if (stopped) return;
    let bufferLength = newData.length;
    let offset = bufferLength;

    dataHistory.set(dataHistory.subarray(offset), 0)
    dataHistory.set(newData, bufferLength * (zoom - 1));

    let datapointsPerPixel = dataHistory.length / canvas.width;
    let v = new Float32Array(newData.length / datapointsPerPixel);
    for (let iGenau = 0; iGenau < newData.length; iGenau += datapointsPerPixel) {
        let i = Math.round(iGenau);
        v[Math.round(iGenau / datapointsPerPixel)] = getMaxValueInRange(newData, i, datapointsPerPixel, true)
    }
    drawnData.set(drawnData.subarray(v.length), 0);
    drawnData.set(v, drawnData.length - v.length - 1);

    if (checkTriggers(dataHistory, newData, offset)) {
        stopped = true;
        showStartButton();

        let velocity = calculateVelocity();
        let totalTime = (trigger2Index - trigger1Index) / sampleRate;

        let error = (totalTime - 60 / 240) * 1000;

        let resultString = Math.round(velocity) + " ft/s, " + Math.round(velocity * 0.3048) + " m/s";
        if (!minimalOutputCheckbox.checked) resultString += ", time measured: " + totalTime * 1000 + "ms, error: " + error + "ms";
        results.innerText = resultString + '\n' + results.innerText;
    }
}
function resume() {
    drawLoop();
};

gainSlider.addEventListener("change", function () {
    gainNode.gain.value = gainSlider.value;
})

let trigger1Index = null;
let trigger2Index = null;
function checkTriggers(dataHistory, sample, offset) {
    if (trigger1Index != null) {
        trigger1Index -= offset;
        if (trigger1Index < 0) { trigger1Index = null }
    }
    if (trigger2Index != null) {
        trigger2Index -= offset;
        if (trigger1Index < dataHistory.length / 4) { return true }
    }
    if (trigger1Index == null) {
        for (let i = sample.length - offset - 1; i < sample.length; i++) {
            let volume = Math.abs(sample[i]);
            if (volume > trigger1Slider.value) {
                trigger1Index = i + dataHistory.length - sample.length;
                break;
            }
        }
    } else if (trigger2Index == null) {
        for (let i = 0; i < sample.length; i++) {
            let volume = Math.abs(sample[i]);
            if (volume > trigger2Slider.value) {
                let newTrigger = i + dataHistory.length - sample.length;
                if ((newTrigger - trigger1Index) > minimumDelay) {
                    trigger2Index = newTrigger;
                    break;
                }
            }
        }
    }
    return false;
}


function drawLoop() {
    //if (stopped) return;
    // draw2(dataHistory, true);
    draw2(drawnData, true);

    requestAnimationFrame(drawLoop);
}

