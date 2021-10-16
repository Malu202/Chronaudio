

let zoom = parseInt(audioZoom.value);
let stopped = false;
let dataHistory = new Float32Array();
let gainNode;
let stream;
let context;

async function setup() {
    await getAudio();
    context = new AudioContext();
    gainNode = context.createGain();
    let source = context.createMediaStreamSource(stream);

    let scriptNode;
    if (!context.createScriptProcessor) {
        scriptNode = context.createJavaScriptNode(0, 2, 2);
    } else {
        scriptNode = context.createScriptProcessor(0, 2, 2);
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

async function getAudio() {
    let audioSource = audioInputSelect.value;
    let constraints = { video: false, audio: true }
    if (audioSource != "auto") constraints = { audio: { deviceId: audioSource ? { exact: audioSource } : undefined } };

    stream = null;
    stream = await navigator.mediaDevices.getUserMedia(constraints);
}

function setupBuffers(bufferSize) {
    zoom = parseInt(audioZoom.value);
    dataHistory = new Float32Array(bufferSize * zoom);
    for (let i = 0; i < dataHistory.length; i++) { dataHistory[i] = 0; }
};
function onNewData(newData) {
    if (stopped) return;
    let bufferLength = newData.length;
    let offset = bufferLength;

    dataHistory.set(dataHistory.subarray(offset), 0)
    dataHistory.set(newData, bufferLength * (zoom - 1));

    if (checkTriggers(dataHistory, newData, offset)) {
        stopped = true;
        // stream.getTracks().forEach(function (track) {
        //     track.stop();
        // });
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
    //getAudio();
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
    if (stopped) return;
    draw2(dataHistory, true);
    requestAnimationFrame(drawLoop);
}

