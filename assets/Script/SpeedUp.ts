
import Pickable from './libs/Pickable'

export default class SpeedUp extends Pickable {

  public name: string = 'speedUp'
  public offset: cc.Vec2 = cc.v2(7, 8)

  public init(texture: cc.Texture2D): void {
    super.init(texture)
  }

}
