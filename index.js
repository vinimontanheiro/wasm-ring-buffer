import Module from './src/ring-buffer.wasmmodule.js';

const BYTES_PER_ELEMENT = Float32Array.BYTES_PER_ELEMENT;

class WasmRingBuffer {
  /**
  * Ring Buffer can handles the input buffer from specific size and give you  
  * an output buffer with any sizes that you want
  *
  * @param capacity The capacity of circular linked list the default is 1024 bytes
  * @param bufferSize The size of output buffer
  */
  constructor(capacity, bufferSize = 160) {
    this._module = Module;
    this._bufferSize = bufferSize;
    if(capacity){ // default is 1024 bytes already defined in source/queue.h
      this._module._setCapacity(capacity);
    }
  }

  /**
  * Allocates a new buffer containing the given {pcmData} and pushing to list
  *
  * @param float32Array Float32Array to store in circular linked list.
  */
  enqueue(float32Array) {
    const input = float32Array;
    const buffer = this._module._malloc(input.length * BYTES_PER_ELEMENT);
    this._module.HEAPF32.set(input, buffer >> 2);
    this._module.ccall(`enqueue`, null, [`number`, `number`], [buffer, input.length]);
    this._module._free(buffer);
  }

  /**
  * Retrieve the data from circular linked list with the right size you do want
  *
  * @param outputFloat32Array Float32Array reference to pop the data
  */
  dequeue(outputFloat32Array) {
    const result = this._module.ccall(`dequeue`, [`number`], [`number`], [this._bufferSize]);
    for (let pointer = 0; pointer < this._bufferSize; pointer++) {
      outputFloat32Array[pointer] = this._module.HEAPF32[result / BYTES_PER_ELEMENT + pointer];
    }
  }

  /**
  * Retrieve the size of circular linked list
  *
  * @return integer
  */
  size() {
    return this._module._size();
  }

  /**
  * You can check if the list is empty
  *
  * @return boolean
  */
  isEmpty() {
    return this._module._isEmpty();
  }

  /**
  * Umount the object
  *
  */
  clear() {
    this._module._clear();
  }
}

export default WasmRingBuffer;
