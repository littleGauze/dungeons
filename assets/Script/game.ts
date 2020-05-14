import mapTools, { MapData, Idx } from './libs/mapTools'
import Coin from './Coin'
import SpeedUp from './SpeedUp'

const { ccclass, property } = cc._decorator

@ccclass
export default class Game extends cc.Component {
  @property(cc.Node)
  mapNode: cc.Node = null

  @property(cc.Node)
  loadNode: cc.Node = null

  @property(cc.Label)
  smogBtnLabel: cc.Label = null

  texture: cc.Texture2D = null
  private _turnSmogOn: boolean = false

  private _coinBaseCount: number = 10
  private _speedUpBaseCount: number = 3

  onLoad() {
    const physicsManager = cc.director.getPhysicsManager()
    physicsManager.enabled = true
    // physicsManager.debugDrawFlags = 1
    physicsManager.gravity = cc.v2(0, 0)

    const collistionManager = cc.director.getCollisionManager()
    collistionManager.enabled = true
    // collistionManager.enabledDebugDraw = true

    this._loadMap()

    cc.loader.loadRes('map/Dungeon_Tileset.png', cc.Texture2D, (err: Error, texture: cc.Texture2D) => {
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
    let starPoint: { i: number, j: number  } = null
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

      this._createCoin(map)
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

  private _createCoin(map: cc.TiledMap): void {
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

    // create coins
    const cnt: number = this._coinBaseCount + Math.floor(Math.random() * 5)
    for(let i = 0; i < cnt; i++) {
      const pos: cc.Vec2 = positions.splice(Math.floor(Math.random() * positions.length), 1)[0]
      const coin: Coin = new Coin()
      coin.init(this.texture)
      coin.node.group = 'pickable'
      coin.node.anchorX = coin.node.anchorY = 0
      coin.node.setPosition(pos)
      const rgd: cc.RigidBody = coin.node.addComponent(cc.RigidBody)
      rgd.type = cc.RigidBodyType.Static
      const collider: cc.PhysicsBoxCollider = coin.node.addComponent(cc.PhysicsBoxCollider)
      collider.size = coin.size
      collider.offset = cc.v2(coin.size.width / 2, coin.size.height / 2)
      collider.apply()
      map.node.addChild(coin.node)
    }

  }

  public toggleSmog(): void {
    this._turnSmogOn = !this._turnSmogOn
    this.smogBtnLabel.string = this._turnSmogOn ? 'On' : 'Off'
    this._loadMap()
  }
}
