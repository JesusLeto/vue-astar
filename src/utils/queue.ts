export const QueueState = <T>() => {
	const data: T[] = []

	const get = () => data.shift()
	const add = (el: T) => data.push(el)
	const empty = () => !data.length

	return {
		get,
		add,
		empty
	}
}
