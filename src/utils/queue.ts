class Queue<T> {
    private data: T[] = [];

    get() {
        return this.data.shift()
    }

    add(el: T) {
        this.data.push(el)
    }

    empty() {
        return !this.data.length
    }

    clear() {
        this.data = []
    }

}

export default new Queue()