export const isEqual = (first: unknown, second: unknown): boolean => {
    if (first === second) {
        return true
    }
    if ((first === undefined || second === undefined || first === null || second === null) && (first || second)) {
        return false
    }
    const firstType = (first as object)?.constructor?.name
    const secondType = (second as object)?.constructor?.name
    if (firstType !== secondType) {
        return false
    }
    if (firstType === 'Array') {
        const firstArr = first as unknown[]
        const secondArr = second as unknown[]
        if (firstArr.length !== secondArr.length) {
            return false
        }
        for (let i = 0; i < firstArr.length; i++) {
            if (!isEqual(firstArr[i], secondArr[i])) {
                return false
            }
        }
        return true
    }
    if (firstType === 'Object') {
        const firstObj = first as Record<string, unknown>
        const secondObj = second as Record<string, unknown>
        const fKeys = Object.keys(firstObj)
        const sKeys = Object.keys(secondObj)
        if (fKeys.length !== sKeys.length) {
            return false
        }
        for (const key of fKeys) {
            const fVal = firstObj[key]
            const sVal = secondObj[key]
            if (fVal && sVal) {
                if (fVal === sVal) continue
                const fValType = (fVal as object).constructor?.name
                if (fValType === 'Array' || fValType === 'Object') {
                    if (!isEqual(fVal, sVal)) return false
                } else if (fVal !== sVal) {
                    return false
                }
            } else if ((fVal && !sVal) || (!fVal && sVal)) {
                return false
            }
        }
        return true
    }
    return first === second
}
