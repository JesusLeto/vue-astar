export const QueueState = <T>() => {
	let data: T[] = []

	const get = () => data.shift()
	const add = (el: T) => data.push(el)
	const empty = () => !data.length

	const clean = () => data = []

	return {
		get,
		add,
		empty,
		clean
	}
}
