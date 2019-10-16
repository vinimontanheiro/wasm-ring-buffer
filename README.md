## This Web Assembly Ring Buffer can handles the input buffer from specific size and give you an output buffer with any sizes that you want

# Features

- Manipulate Input and Output PCM Data
- Dynamic buffer sizes
- Wasm Ring Buffer implemented in C++
- Processement very fast

# Install
```
npm install wasm-ring-buffer
```

# Usage
```
import WasmRingBuffer from 'wasm-ring-buffer';
```

# How does it work?

The current AudioWorklet only process 128 bytes for each; so if you need a buffer with you own size, you need to use a "Ring Buffer" to manipulate it. So this library does it for you. We enqueue the AudioWorkletProccess buffer into a Circular Linked list(FIFO), and dequeue with your own size.

# Requeriments
For browser definitions a WebAssembly implementation can not run in the Main Thread, you can use inside of WebWorkers or AudioWorkletNode

# Scaffold
```
- wasm-ring-buffer
  - example
    - using-react
  - src
     node.h
     queue.h
     ring-buffer.wasmmodule.js
     ring-buffer.wasmmodule.wasm
     wasm-ring-buffer.cpp
  index.js
  index.d.ts
```

# Example

## AudioContext + AudioWorket
```
const inputAudioContext = new AudioContext({ sampleRate: 8000 });
      inputAudioContext.audioWorklet
      .addModule('your-worklet-processor.js')
      .then(() => {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(stream => {
            const microphone = inputAudioContext.createMediaStreamSource(stream);
            const audioWorkletNode = new AudioWorkletNode(
              inputAudioContext,
              'your-worklet-processor',
              {
                channelCount : 1,
                processorOptions: { //Passing the arguments to processor
                  bufferSize: 160, //output buffer size
                  capacity:2046 // max fifo capacity
                },
              },
            );
            audioWorkletNode.port.onmessage = ({ data }) => {
                console.log('Your own buffer >> ', data); //Receiving data from worklet thread
            };
            microphone.connect(audioWorkletNode).connect(inputAudioContext.destination);
          });
      });
```

## your-worklet-processor.js

```
import RingBuffer from 'wasm-ring-buffer/index.js';
import { LOG_TABLE } from './constants.js';


class YourWorkletProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._bufferSize = options.processorOptions.bufferSize;
    this._capacity = options.processorOptions.capacity;
    this._ringBuffer = new RingBuffer(this._capacity, this._bufferSize);
  }

  float32ToInt16(float32array) {
    let l = float32array.length;
    const buffer = new Int16Array(l);
    while (l--) {
      buffer[l] = Math.min(1, float32array[l]) * 0x7fff;
    }
    return buffer;
  }

  alawEncode(sample) {
    let compandedValue;
    sample = sample === -32768 ? -32767 : sample;
    const sign = (~sample >> 8) & 0x80;
    if (!sign) {
      sample *= -1;
    }
    if (sample > 32635) {
      sample = 32635;
    }
    if (sample >= 256) {
      const exponent = LOG_TABLE[(sample >> 8) & 0x7f];
      const mantissa = (sample >> (exponent + 3)) & 0x0f;
      compandedValue = (exponent << 4) | mantissa;
    } else {
      compandedValue = sample >> 4;
    }
    return compandedValue ^ (sign ^ 0x55);
  }

  linearToAlaw(int16array) {
    const aLawSamples = new Uint8Array(int16array.length);
    for (let i = 0; i < int16array.length; i++) {
      aLawSamples[i] = this.alawEncode(int16array[i]);
    }
    return aLawSamples;
  }

  process(inputs) {
    const input = inputs[0];
    const output = new Float32Array(this._bufferSize);
    this._ringBuffer.enqueue(input[0]);

    while (this._ringBuffer.size() >= this._bufferSize) {
      this._ringBuffer.dequeue(output);
      const int16array = this.float32ToInt16(output);
      const payload = this.linearToAlaw(int16array);
      const sharedPayload = new Uint8Array(new SharedArrayBuffer(payload.length)); // sharing buffer memory
      sharedPayload.set(payload, 0);
      this.port.postMessage(sharedPayload); //Sending data to main thread
    }

    return true;
  }
}

registerProcessor(`your-worklet-processor`, YourWorkletProcessor);

```

## Full implementation is avalaible in project-folder > example > using-react

