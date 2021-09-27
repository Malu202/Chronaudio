function draw2(drawnData, float) {
    context2d.fillStyle = 'rgb(200, 200, 200)';
    context2d.strokeStyle = 'rgb(0, 0, 0)';


    context2d.fillRect(0, 0, canvas.width, canvas.height);
    context2d.lineWidth = 2;

    let datapointsPerPixel = drawnData.length / canvas.width;

    let x = 0;
    context2d.beginPath();

    for (let iGenau = 0; iGenau < drawnData.length; iGenau += datapointsPerPixel) {
        let i = Math.round(iGenau);

        let v = getMaxValueInRange(drawnData, i, datapointsPerPixel, float)
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
    // if (trigger1Index != null) { drawTriggerAtIndex(trigger1Index + 0.01 * sampleRate, datapointsPerPixel); }
    context2d.stroke();

    context2d.beginPath();
    context2d.strokeStyle = 'rgb(255, 0, 0)';
    context2d.moveTo(0, canvas.height * (1 - trigger2Slider.value));
    context2d.lineTo(canvas.width, canvas.height * (1 - trigger2Slider.value));
    if (trigger2Index != null) { drawTriggerAtIndex(trigger2Index, datapointsPerPixel); }
    context2d.stroke();
}

function getMaxValueInRange(buffer, start, end, float) {
    let v = 0;
    if (float) {
        for (let j = 0; j < end; j++) {
            let volume = Math.abs(buffer[start + j]);
            if (volume > v) v = volume;
        }
    } else {
        for (let j = 0; j < end; j++) {
            let volume = Math.abs(buffer[start + j] - 128);
            if (volume > v) v = volume;
        }
        v = v / 128.0;
    }
    return v;
}

function draw(drawnData, offset) {
    context2d.fillStyle = 'rgb(200, 200, 200)';
    context2d.strokeStyle = 'rgb(0, 0, 0)';
    context2d.lineWidth = 2;

    //context2d.fillRect(0, 0, canvas.width, canvas.height);

    let datapointsPerPixel = drawnData.length / canvas.width;
    let pixelShift = Math.round(offset / datapointsPerPixel);

    if (pixelShift < canvas.width) {
        let imageData = context2d.getImageData(pixelShift, 0, canvas.width - pixelShift, canvas.height);
        context2d.putImageData(imageData, 0, 0);
        context2d.clearRect(canvas.width - pixelShift, 0, pixelShift, canvas.height);
    } else context2d.fillRect(0, 0, canvas.width, canvas.height);

    let x = canvas.width - pixelShift - 1;
    context2d.beginPath();
    for (let iGenau = drawnData.length - offset; iGenau < drawnData.length; iGenau += datapointsPerPixel) {
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
    //context2d.lineTo(canvas.width, canvas.height);
    context2d.stroke();
}
function drawTriggerAtIndex(index, datapointsPerPixel) {
    context2d.moveTo(index / datapointsPerPixel, 0);
    context2d.lineTo(index / datapointsPerPixel, canvas.height);
}