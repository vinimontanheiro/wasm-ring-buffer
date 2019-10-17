/**
 * @author Vinícius Montanheiro
 * @email vinicius.amontanheiro@gmail.com
 * @since 08/2012 PUC-GO
 */

#ifndef NODE_H_
#define NODE_H_

template <class T>
class Node {
public:
	T item;
	Node<T> *next;
	Node();
	~Node();
};

#endif /* NODE_H_ */

template <class T>
Node<T>::Node() {}

template <class T>
Node<T>::~Node() {}

