export class WasmRingBuffer{
  bufferSize:number;
  enqueue(float32Array: Float32Array):void;
  dequeue(outputFloat32Array: Float32Array):void;
  size():number;
  isEmpty():boolean;

   /**
  * Ring Buffer can handles the input buffer from specific size and give you  
  * an output buffer with any sizes that you want
  *
  * @param capacity The capacity of circular linked list the default is 1024 bytes
  * @param bufferSize The size of output buffer
  */
  constructor (capacity: number, bufferSize:number);
}