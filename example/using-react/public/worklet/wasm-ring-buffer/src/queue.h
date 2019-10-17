/**
 * @author Vinícius Montanheiro
 * @email vinicius.amontanheiro@gmail.com
 * @since 08/2012 PUC-GO
 */

#ifndef QUEUE_H
#define QUEUE_H

#include <iostream>
#include"node.h"

using namespace std;

template <class T>
class Queue{
private:
    Node<T> *head;
    Node<T> *tail;
    int counter;
    int capacity;
public:
    Queue();
    ~Queue();
    void enqueue(T item);
    T dequeue();
    int size();
    bool isEmpty();
    void setCapacity(int capacity);
    void clear();
    void show();
};

#endif // QUEUE_H

template <class T>
Queue<T>::Queue(){
    this->head = NULL;
    this->tail = NULL;
    this->counter = 0;
    this->capacity = 1024;
}

template <class T>
Queue<T>::~Queue(){
    this->clear();
}

template <class T>
void Queue<T>::enqueue(T item){
    Node<T> *node = new Node<T>;
    if(!node){
       return;
    }
    if(this->counter >= this->capacity){
        this->dequeue();
    }
    if(!tail){
        head = node;
    }
    else{
        tail->next = node;
    }
    node->item = item;
    tail = node;
    this->counter++;
}

template <class T>
T Queue<T>::dequeue(){
    T item;
    if(!this->head){
       counter = 0; 
       return 0;
    }
    Node<T> *node = this->head;
    this->head = this->head->next;

    if(!this->head){
       tail = this->head;
    }
    item = node->item;
    delete node;
    this->counter--;
    return item;
};

template <class T>
int Queue<T>::size() {
    return this->counter;
}

template <class T>
bool Queue<T>::isEmpty(){
    Node<T> *node = new Node<T>;
    node = this->head;
    return node->item ? false : true;
}

template <class T>
void Queue<T>::setCapacity(int capacity){
    this->capacity = capacity;
}

template <class T>
void Queue<T>::clear(){
    delete this->head;
    delete this->tail;
}

template <class T>
void Queue<T>::show(){
    Node<T> *node = new Node<T>;
    node = this->head;
    while(node){
        cout<<node->item<<" ";
        node = node->next;
     }
     cout<<endl;
     delete node;
}
