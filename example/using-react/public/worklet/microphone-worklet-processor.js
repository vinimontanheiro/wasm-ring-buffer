

import WasmRingBuffer from './wasm-ring-buffer/index.js';
import { LOG_TABLE } from './constants.js';


class MicrophoneWorkletProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._bufferSize = options.processorOptions.bufferSize;
    this._capacity = options.processorOptions.capacity;
    this._ringBuffer = new WasmRingBuffer(this._capacity, this._bufferSize);
    this._ready = true;
    this.port.onmessage = this.onmessage.bind(this);
  }

  onmessage({ data }){
    this._ready = data.ready;

    if(!this._ready){
      this._ringBuffer.clear();
    }
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
    if(this._ready){
      const input = inputs[0];
      const output = new Float32Array(this._bufferSize);
      this._ringBuffer.enqueue(input[0]);
  
      while (this._ringBuffer.size() >= this._bufferSize) {
        this._ringBuffer.dequeue(output);
        const int16array = this.float32ToInt16(output);
        const payload = this.linearToAlaw(int16array);
        const sharedPayload = new Uint8Array(new SharedArrayBuffer(payload.length));
        sharedPayload.set(payload, 0);
        this.port.postMessage(sharedPayload);
      }
    }
   
    return true;
  }
}

registerProcessor(`microphone-worklet-processor`, MicrophoneWorkletProcessor);
