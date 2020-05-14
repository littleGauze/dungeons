
export default class Pickable extends cc.Component {

  protected offset: cc.Vec2 = null
  public node: cc.Node = null
  public size: cc.Size = cc.size(16, 16)

  protected init(texture: cc.Texture2D): void {
    this.node = new cc.Node(this.name)
    const sp: cc.Sprite = this.node.addComponent(cc.Sprite)
    const spf: cc.SpriteFrame = new cc.SpriteFrame(
      texture,
      cc.rect(this.offset.x * this.size.width, this.offset.y * this.size.height, this.size.width, this.size.height)
    )
    sp.spriteFrame = spf
  }
}
