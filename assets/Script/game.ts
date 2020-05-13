const { ccclass, property } = cc._decorator

type MapData = Array<Array<string>>

@ccclass
export default class Game extends cc.Component {
  @property(cc.Node)
  mapNode: cc.Node = null

  onLoad() {
    const physicsManager = cc.director.getPhysicsManager()
    physicsManager.enabled = true
    physicsManager.debugDrawFlags = 0
    physicsManager.gravity = cc.v2(0, 0)

    const collistionManager = cc.director.getCollisionManager()
    collistionManager.enabled = true

    const map: MapData = [
      [ '00000', '01000', '00000' ],
      [ '00010', '11110', '00100' ],
      [ '00000', '10000', '00000' ]
    ]

    this._loadMap(map)
  }

  private _initMap(): void {
    for (let node of this.mapNode.children) {
      const map: cc.TiledMap = node.getComponent(cc.TiledMap)
      const tileSize: cc.Size = map.getTileSize()
      const wallLayer: cc.TiledLayer = map.getLayer('wall')
      const smogLayer: cc.TiledLayer = map.getLayer('smog')
      smogLayer.node.active = true

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

          const smogTile: cc.TiledTile = smogLayer.getTiledTileAt(i, j, true)
          smogTile.node.group = 'smog'
          const collider: cc.BoxCollider = smogTile.node.addComponent(cc.BoxCollider)
          collider.offset = cc.v2(tileSize.width / 2, tileSize.height / 2)
          collider.size = tileSize
        }
      }
    }
  }

  private _loadMap(map: MapData): void {
    let cnt: number = 0
    let starPoint: { i: number, j: number  } = null
    for (let i = 0, rowLen = map.length; i < rowLen; i++) {
      for (let j = 0, colLen = map[i].length; i < colLen; j++) {
        const mapName: string = map[i][j]
        if (!mapName || mapName === '00000') continue

        // load map
        cnt++
        cc.loader.loadRes(`map/${mapName}`, cc.TiledMapAsset, (err, assets: cc.TiledMapAsset) => {
          if (err) {
            console.error(`load map ${mapName} error: `, err)
            throw err
          }

          if (!starPoint) {
            starPoint = { i, j }
          }

          const node: cc.Node = new cc.Node(`map${i}${j}`)
          node.x = (j - starPoint.j) * 384
          node.y = -(i - starPoint.i) * 384

          const map: cc.TiledMap = node.addComponent(cc.TiledMap)
          map.tmxAsset = assets
          node.anchorX = node.anchorY = 0
          this.mapNode.addChild(node)

          if (--cnt <= 0) {
            this._initMap()
          }
        })
      }
    }
  }
}
