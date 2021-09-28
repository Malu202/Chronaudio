

let zoom = parseInt(audioZoom.value);
let stopped = false;
let drawnData = new Float32Array();


async function setup() {
    let audioSource = audioInputSelect.value;
    let constraints = { video: false, audio: true }
    if (audioSource != "auto") constraints = { audio: { deviceId: audioSource ? { exact: audioSource } : undefined } };

    let stream = await navigator.mediaDevices.getUserMedia(constraints);
    let context = new AudioContext();
    let source = context.createMediaStreamSource(stream);

    if (!context.createScriptProcessor) {
        node = context.createJavaScriptNode(4096, 2, 2);
    } else {
        node = context.createScriptProcessor(4096, 2, 2);
    }
    sampleRate = context.sampleRate;
    calculateMinimumDelay();
    setupBuffers(node.bufferSize);

    node.onaudioprocess = function (e) {
        onNewData(e.inputBuffer.getChannelData(0));
    }

    source.connect(node);
    node.connect(context.destination);
    drawLoop();
}

function setupBuffers(bufferSize) {
    zoom = parseInt(audioZoom.value);
    drawnData = new Float32Array(bufferSize * zoom);
    for (let i = 0; i < drawnData.length; i++) { drawnData[i] = 0; }
};
function onNewData(newData) {
    if (stopped) return;
    let bufferLength = newData.length;
    let offset = bufferLength;

    drawnData.set(drawnData.subarray(offset), 0)
    drawnData.set(newData, bufferLength * (zoom - 1));

    if (checkTriggers(drawnData, newData, offset)) {
        stopped = true;
        showStartButton();

        let velocity = calculateVelocity();
        let totalTime = (trigger2Index - trigger1Index) / sampleRate;

        let error = (totalTime - 60 / 240) * 1000;

        let resultString = Math.round(velocity) + " ft/s, " + Math.round(velocity * 0.3048) + " m/s, time measured: " + totalTime * 1000 + "ms";
        resultString += ", error: " + error + "ms";
        results.innerText = resultString + '\n' + results.innerText;
    }
}
function resume() {
    drawLoop();
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
            let volume = Math.abs(sample[i]);
            if (volume > trigger1Slider.value) {
                trigger1Index = i + drawndata.length - sample.length;
                break;
            }
        }
    } else if (trigger2Index == null) {
        for (let i = 0; i < sample.length; i++) {
            let volume = Math.abs(sample[i]);
            if (volume > trigger2Slider.value) {
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


function drawLoop() {
    //if (stopped) return;
    draw2(drawnData, true);
    requestAnimationFrame(drawLoop);
}

