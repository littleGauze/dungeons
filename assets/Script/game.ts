import mapTools, { MapData, Idx } from './libs/mapTools'
import Coin from './Coin'
import SpeedUp from './SpeedUp'
import Hero from './Hero'

const { ccclass, property } = cc._decorator

@ccclass
export default class Game extends cc.Component {
  @property(cc.Node)
  mapNode: cc.Node = null

  @property(cc.Node)
  loadNode: cc.Node = null

  @property(cc.Label)
  smogBtnLabel: cc.Label = null

  @property(cc.Label)
  coinLabel: cc.Label = null

  @property(cc.Label)
  speedLabel: cc.Label = null

  @property(Hero)
  hero: Hero = null

  texture: cc.Texture2D = null
  private _turnSmogOn: boolean = false

  private _coin: number = 0
  private _speedCounter: number = 0
  private _coinBaseCount: number = 10
  private _speedUpBaseCount: number = 1
  private _timer: number = 0

  onLoad() {
    const physicsManager = cc.director.getPhysicsManager()
    physicsManager.enabled = true
    physicsManager.gravity = cc.v2(0, 0)

    const collistionManager = cc.director.getCollisionManager()
    collistionManager.enabled = true

    this._loadMap()

    cc.loader.loadRes('map/Dungeon_Tileset', cc.Texture2D, (err: Error, texture: cc.Texture2D) => {
      if (err) {
        console.error('load texture error', err)
        throw err
      }
      this.texture = texture
    })
  }

  private _loadMap(): void {
    this.loadNode.active = true
    this.mapNode.removeAllChildren()

    // get random map data
    const map: MapData = mapTools.getMaps()

    let cnt: number = 0
    let starPoint: { i: number, j: number } = null
    for (let i = 0, rowLen = map.length; i < rowLen; i++) {
      for (let j = 0, colLen = map[i].length; j < colLen; j++) {
        const mapName: string = map[i][j]
        if (!mapName || mapName === '00000') continue
        if (!starPoint) {
          starPoint = { i, j }
        }

        // load map
        cnt++
        const self = this
        cc.loader.loadRes(`map/${mapName}`, cc.TiledMapAsset, function (i, j) {
          return (err, assets: cc.TiledMapAsset) => {
            if (err) {
              console.error(`load map ${mapName} error: `, err)
              throw err
            }
            const node: cc.Node = new cc.Node(`map${i}${j}`)
            const map: cc.TiledMap = node.addComponent(cc.TiledMap)
            map.tmxAsset = assets
            self.mapNode.addChild(node)

            // active smog layer then change the anchor
            self._turnSmogOn && (map.getLayer('smog').node.active = true)

            node.anchorX = node.anchorY = 0
            node.x = (j - starPoint.j) * 384
            node.y = -(i - starPoint.i) * 384

            if (--cnt <= 0) {
              self._initMap()
            }
          }
        }(i, j))
      }
    }
  }

  private _initMap(): void {
    for (let node of this.mapNode.children) {
      const map: cc.TiledMap = node.getComponent(cc.TiledMap)
      const tileSize: cc.Size = map.getTileSize()
      const wallLayer: cc.TiledLayer = map.getLayer('wall')

      const size: cc.Size = wallLayer.getLayerSize()
      for (let i = 0; i < size.width; i++) {
        for (let j = 0; j < size.height; j++) {
          const tile: cc.TiledTile = wallLayer.getTiledTileAt(i, j, true)
          tile.node.group = 'wall'
          if (tile.gid) {
            const rgd: cc.RigidBody = tile.node.addComponent(cc.RigidBody)
            rgd.type = cc.RigidBodyType.Static
            const collider: cc.PhysicsBoxCollider = tile.node.addComponent(cc.PhysicsBoxCollider)
            collider.offset = cc.v2(tileSize.width / 2, tileSize.height / 2)
            collider.size = tileSize
            collider.apply()
          }

          // smog
          this._createSmog(map, { i, j })
        }
      }

      // create item
      const fatory = this._createItem(map)
      fatory(this._coinBaseCount, Coin)
      fatory(this._speedUpBaseCount, SpeedUp)
    }

    // loading done
    this.loadNode.active = false
  }

  private _createSmog(map: cc.TiledMap, idx: Idx): void {
    if (this._turnSmogOn) {
      const tileSize: cc.Size = map.getTileSize()
      const smogLayer: cc.TiledLayer = map.getLayer('smog')
      const smogTile: cc.TiledTile = smogLayer.getTiledTileAt(idx.i, idx.j, true)
      smogTile.node.group = 'smog'
      const collider: cc.BoxCollider = smogTile.node.addComponent(cc.BoxCollider)
      collider.offset = cc.v2(tileSize.width / 2, tileSize.height / 2)
      collider.size = tileSize
    }
  }

  private _createItem(map: cc.TiledMap): Function {
    const pickareaLayer: cc.TiledLayer = map.getLayer('pickarea')
    const size: cc.Size = pickareaLayer.getLayerSize()

    const positions: Array<cc.Vec2> = []
    for (let i = 0; i < size.width; i++) {
      for (let j = 0; j < size.height; j++) {
        const tile: cc.TiledTile = pickareaLayer.getTiledTileAt(i, j, true)
        if (tile.gid) {
          positions.push(tile.node.getPosition())
          tile.node.destroy()
        }
      }
    }

    const sefl = this
    return function (baseCount: number, Claz: any): void {
      const cnt: number = baseCount + Math.floor(Math.random() * 2)
      for (let i = 0; i < cnt; i++) {
        const pos: cc.Vec2 = positions.splice(Math.floor(Math.random() * positions.length), 1)[0]
        const ins: Coin | SpeedUp = new Claz()
        ins.init(sefl.texture)
        ins.node.group = 'pickable'
        ins.node.anchorX = ins.node.anchorY = 0
        ins.node.setPosition(pos)
        const rgd: cc.RigidBody = ins.node.addComponent(cc.RigidBody)
        rgd.type = cc.RigidBodyType.Static
        const collider: cc.PhysicsBoxCollider = ins.node.addComponent(cc.PhysicsBoxCollider)
        collider.sensor = true
        collider.size = ins.size
        collider.offset = cc.v2(ins.size.width / 2, ins.size.height / 2)
        collider.apply()
        map.node.addChild(ins.node)
      }
    }
  }

  public toggleSmog(): void {
    this._turnSmogOn = !this._turnSmogOn
    this.smogBtnLabel.string = this._turnSmogOn ? 'On' : 'Off'
    this._loadMap()
  }

  public incCoin(): void {
    this._coin++
    this.coinLabel.string = `Coin: ${this._coin}`
  }

  public speedUp(): void {
    this._speedCounter = 5 // 5 seconds speed up
    this.hero.setSpeedUp(1.5)
    this.node.once('speedUpEnd', () => {
      this.hero.setSpeedUp(1)
    })
  }

  update(dt: number) {
    this._speedCounter -= dt
    if (this._speedCounter >= 0) {
       this.speedLabel.string = `SpeedUp: ${parseInt(this._speedCounter + '')}s`
    } else {
      this.node.emit('speedUpEnd')
    }
  }
}
