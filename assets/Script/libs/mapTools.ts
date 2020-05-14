
const Offset = [
  { i: -1, j: 0 }, // up
  { i: 1, j: 0 },  // down
  { i: 0, j: -1 },  // left
  { i: 0, j: 1 }  // right
]

export interface Idx {
  i: number,
  j: number
}

export type MapData = Array<Array<string>>

class MapTool {

  private _mapRows: number = 4
  private _mapCols: number = 4
  private _mapPieces: number = 8

  private _mapArr: Array<Array<number>> = []
  private _mapNameArr: Array<Array<string>> = []

  private _initMapArr(): void {
    const ma = this._mapArr = []
    this._mapNameArr = []
    for (let i = 0; i < this._mapRows; i++) {
      ma[i] = []
      this._mapNameArr[i] = []
      for (let j = 0; j < this._mapCols; j++) {
        ma[i][j] = 0
        this._mapNameArr[i][j] = '00000'
      }
    }

    // get start idx
    const i: number = Math.floor(Math.random() * this._mapRows);
    const j: number = Math.floor(Math.random() * this._mapCols);
    ma[i][j] = 1
    this._mapPieces--

    let nearMaps: Array<Idx> = []
    let startIdx: Idx = { i, j }
    do {
      // get random idx from near maps
      nearMaps = this._getNearMaps(startIdx)
      if (!nearMaps.length) break

      const idx: Idx = nearMaps[Math.floor(Math.random() * nearMaps.length)]
      startIdx = idx
      ma[idx.i][idx.j] = 1
      this._mapPieces--
    } while (this._mapPieces)

    if (this._mapPieces) {
      for (let i = 0; i < this._mapRows; i++) {
        for (let j = 0; j < this._mapCols; j++) {
          if (ma[i][j]) continue
          if (!this._mapPieces) break
  
          const nearMaps:Array<Idx> = this._getNearMaps({ i, j}, false)
          if (nearMaps.length) {
            ma[i][j] = 1
            this._mapPieces--
          }
        }
      }
    }
  }

  /**
   * get nearby map idx
   * @param startIdx the center map idx
   * @param reverse return empty map idx or not, true for empty.
   * @returns Array<Idx> map idx array
   */
  private _getNearMaps(startIdx: Idx, reverse: boolean = true): Array<Idx> {
    const maps: Array<Idx> = []
    for (let idx of Offset) {
      const i: number = startIdx.i + idx.i
      const j: number = startIdx.j + idx.j
      if (i < 0 || i >= this._mapRows || j < 0 || j >= this._mapCols) continue
      if ((!this._mapArr[i][j]) === reverse) maps.push({ i, j })
    }

    return maps
  }

  public getMaps(): Array<Array<string>> {
    this._initMapArr()

    const ma = this._mapArr
    const na = this._mapNameArr
    const isDir = dir => (pos, i, j) => (pos.i - i === Offset[dir].i) && (pos.j - j === Offset[dir].j)
    for (let i = 0; i < this._mapRows; i++) {
      for (let j = 0; j < this._mapCols; j++) {
        const idx: number = ma[i][j]
        if (idx) {
          // calculate map name
          let up = '0', down = '0', left = '0', right = '0'
          const nearMaps: Array<Idx> = this._getNearMaps({ i, j }, false)

          // check map connect point
          for (let pos of nearMaps) {
            // up
            if (isDir(0)(pos, i, j)) up = '1'
            // down
            if (isDir(1)(pos, i, j)) down = '1'
            // left
            if (isDir(2)(pos, i, j)) left = '1'
            // right
            if (isDir(3)(pos, i, j)) right = '1'
          }

          na[i][j] = up + down + left + right + '0'
        }
      }
    }
    return na
  }
}

export default new MapTool()
