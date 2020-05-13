
const { ccclass, property } = cc._decorator

@ccclass
export default class Hero extends cc.Component {

  @property(cc.Node)
  heroNode: cc.Node = null

  update(dt: number) {
    if (!this.heroNode) return
    const pos: cc.Vec2 = this.heroNode.convertToWorldSpaceAR(cc.v2(0, 0))
    this.node.setPosition(this.node.parent.convertToNodeSpaceAR(pos))
  }
}
