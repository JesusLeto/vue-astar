export default class Queue<T> {
    private data: T[];

    constructor(start: T) {
        this.data = [start]
    }

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