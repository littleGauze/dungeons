
import Pickable from './libs/Pickable'

export default class Coin extends Pickable {

  public name: string = 'coin'
  public offset: cc.Vec2 = cc.v2(6, 8)

  public init(texture: cc.Texture2D): void {
    super.init(texture)
  }

}
