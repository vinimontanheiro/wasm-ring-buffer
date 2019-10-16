/**
 * Copyright 2019
 * 
 * * Ring Buffer can handles the input buffer from specific size and give you  
  * an output buffer with any sizes that you want
 * 
 * @author Vinícius Montanheiro
 * @email vinicius.amontanheiro@gmail.com
 * @since 09/2019 FLORIPA - SC
 * @license Apache License 2.0 
 */

#include <emscripten/emscripten.h>
#include "queue.h"

extern "C" {
    Queue<float> queue;
     
     EMSCRIPTEN_KEEPALIVE
     void enqueue (float *buffer_ptr, int size) {
          for (int i = 0; i < size; i++) {
               queue.enqueue(buffer_ptr[i]);
          }
     }

     EMSCRIPTEN_KEEPALIVE
     float* dequeue (int size) {
          float *buffer;
          for (int i = 0; i < size; i++) {
               buffer[i] = queue.dequeue();
          }
          return buffer;
     }

     EMSCRIPTEN_KEEPALIVE
     int size(){
          return queue.size();   
     }

     EMSCRIPTEN_KEEPALIVE
     bool isEmpty(){
          return queue.isEmpty();   
     }

     EMSCRIPTEN_KEEPALIVE
     void setCapacity(int capacity){
          queue.setCapacity(capacity);
     }

     EMSCRIPTEN_KEEPALIVE
     void show(){
          queue.show();
     }
}
