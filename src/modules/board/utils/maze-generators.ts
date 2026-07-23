import type { CoordsData } from '../types'

export type PatternCellType = 'barrier' | 'weight'
export type MazePattern =
    | 'randomWalls'
    | 'randomWeights'
    | 'recursiveDivision'
    | 'verticalDivision'
    | 'horizontalDivision'
    | 'stair'

export interface PatternCell {
    coords: CoordsData
    type: PatternCellType
}

type Orientation = 'horizontal' | 'vertical'

const toIndex = (coords: CoordsData, cols: number): number => coords.y * cols + coords.x

const randomItem = (items: readonly number[]): number | undefined => items[Math.floor(Math.random() * items.length)]

const addPatternCell = (
    cells: PatternCell[],
    seen: Set<number>,
    protectedIndexes: ReadonlySet<number>,
    cols: number,
    coords: CoordsData,
    type: PatternCellType
) => {
    const index = toIndex(coords, cols)
    if (protectedIndexes.has(index) || seen.has(index)) return
    seen.add(index)
    cells.push({ coords, type })
}

const rangeByTwo = (start: number, end: number): number[] => {
    const values: number[] = []
    for (let value = start; value <= end; value += 2) values.push(value)
    return values
}

function recursiveDivision(
    rows: number,
    cols: number,
    protectedIndexes: ReadonlySet<number>,
    rowStart: number,
    rowEnd: number,
    colStart: number,
    colEnd: number,
    orientation: Orientation,
    seen: Set<number>,
    output: PatternCell[],
    type: PatternCellType,
    variant: MazePattern,
    surroundingWalls: boolean
) {
    if (rowEnd < rowStart || colEnd < colStart) return

    if (!surroundingWalls) {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (y === 0 || x === 0 || y === rows - 1 || x === cols - 1) {
                    addPatternCell(output, seen, protectedIndexes, cols, { x, y }, type)
                }
            }
        }
    }

    if (orientation === 'horizontal') {
        const possibleRows = rangeByTwo(rowStart, rowEnd)
        const possibleCols = rangeByTwo(colStart - 1, colEnd + 1)
        const currentRow = randomItem(possibleRows)
        const passageCol = randomItem(possibleCols)
        if (currentRow === undefined || passageCol === undefined) return

        for (let x = colStart - 1; x <= colEnd + 1; x++) {
            if (x !== passageCol) addPatternCell(output, seen, protectedIndexes, cols, { x, y: currentRow }, type)
        }

        const nextTopOrientation: Orientation =
            currentRow - 2 - rowStart > colEnd - colStart
                ? orientation
                : variant === 'horizontalDivision'
                  ? 'horizontal'
                  : 'vertical'
        const nextBottomOrientation: Orientation =
            rowEnd - (currentRow + 2) > colEnd - colStart
                ? variant === 'verticalDivision'
                    ? 'vertical'
                    : orientation
                : 'vertical'

        recursiveDivision(
            rows,
            cols,
            protectedIndexes,
            rowStart,
            currentRow - 2,
            colStart,
            colEnd,
            nextTopOrientation,
            seen,
            output,
            type,
            variant,
            true
        )
        recursiveDivision(
            rows,
            cols,
            protectedIndexes,
            currentRow + 2,
            rowEnd,
            colStart,
            colEnd,
            nextBottomOrientation,
            seen,
            output,
            type,
            variant,
            true
        )
        return
    }

    const possibleCols = rangeByTwo(colStart, colEnd)
    const possibleRows = rangeByTwo(rowStart - 1, rowEnd + 1)
    const currentCol = randomItem(possibleCols)
    const passageRow = randomItem(possibleRows)
    if (currentCol === undefined || passageRow === undefined) return

    for (let y = rowStart - 1; y <= rowEnd + 1; y++) {
        if (y !== passageRow) addPatternCell(output, seen, protectedIndexes, cols, { x: currentCol, y }, type)
    }

    const nextLeftOrientation: Orientation =
        rowEnd - rowStart > currentCol - 2 - colStart
            ? variant === 'verticalDivision'
                ? 'vertical'
                : 'horizontal'
            : variant === 'horizontalDivision'
              ? 'horizontal'
              : orientation
    const nextRightOrientation: Orientation =
        rowEnd - rowStart > colEnd - (currentCol + 2)
            ? 'horizontal'
            : variant === 'horizontalDivision'
              ? 'horizontal'
              : orientation

    recursiveDivision(
        rows,
        cols,
        protectedIndexes,
        rowStart,
        rowEnd,
        colStart,
        currentCol - 2,
        nextLeftOrientation,
        seen,
        output,
        type,
        variant,
        true
    )
    recursiveDivision(
        rows,
        cols,
        protectedIndexes,
        rowStart,
        rowEnd,
        currentCol + 2,
        colEnd,
        nextRightOrientation,
        seen,
        output,
        type,
        variant,
        true
    )
}

function generateRandomPattern(
    rows: number,
    cols: number,
    protectedIndexes: ReadonlySet<number>,
    type: PatternCellType,
    probability: number
): PatternCell[] {
    const output: PatternCell[] = []
    const seen = new Set<number>()

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (Math.random() < probability) addPatternCell(output, seen, protectedIndexes, cols, { x, y }, type)
        }
    }

    return output
}

function generateStairPattern(rows: number, cols: number, protectedIndexes: ReadonlySet<number>): PatternCell[] {
    const output: PatternCell[] = []
    const seen = new Set<number>()
    let y = rows - 1
    let x = 0

    while (y > 0 && x < cols) {
        addPatternCell(output, seen, protectedIndexes, cols, { x, y }, 'barrier')
        y--
        x++
    }
    while (y < rows - 2 && x < cols) {
        addPatternCell(output, seen, protectedIndexes, cols, { x, y }, 'barrier')
        y++
        x++
    }
    while (y > 0 && x < cols - 1) {
        addPatternCell(output, seen, protectedIndexes, cols, { x, y }, 'barrier')
        y--
        x++
    }

    return output
}

export function generateMazePattern(
    rows: number,
    cols: number,
    protectedIndexes: ReadonlySet<number>,
    pattern: MazePattern
): PatternCell[] {
    if (pattern === 'randomWalls') return generateRandomPattern(rows, cols, protectedIndexes, 'barrier', 0.25)
    if (pattern === 'randomWeights') return generateRandomPattern(rows, cols, protectedIndexes, 'weight', 0.35)
    if (pattern === 'stair') return generateStairPattern(rows, cols, protectedIndexes)

    const output: PatternCell[] = []
    const seen = new Set<number>()
    const orientation: Orientation = pattern === 'verticalDivision' ? 'vertical' : 'horizontal'
    recursiveDivision(
        rows,
        cols,
        protectedIndexes,
        2,
        rows - 3,
        2,
        cols - 3,
        orientation,
        seen,
        output,
        'barrier',
        pattern,
        false
    )
    return output
}
