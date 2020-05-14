
import { Direction } from './libs/consts'
import Game from './Game'

const { ccclass, property } = cc._decorator

@ccclass
export default class Hero extends cc.Component {

  @property(Game)
  private game: Game = null

  private _amin: cc.Animation = null
  private _speed: number = 15000
  private _dir: Direction = Direction.Down
  private _bias: cc.Vec2 = cc.v2(0, 0)
  private _lv: cc.Vec2 = null
  private _rigidBody: cc.RigidBody = null
  private _speedUp: number = 1

  onLoad() {
    this._rigidBody = this.getComponent(cc.RigidBody)
    this._amin = this.getComponent(cc.Animation)
    cc.systemEvent.on('keydown', this._onKeyDown, this)
    cc.systemEvent.on('keyup', this._onKeyUp, this)
  }

  onDestroy() {
    cc.systemEvent.off('keydown', this._onKeyDown, this)
    cc.systemEvent.off('keyup', this._onKeyUp, this)
  }

  private _onKeyUp() {
    this._dir = null
    this._amin.stop()
  }

  private _onKeyDown(evt: cc.Event.EventKeyboard) {
    switch(evt.keyCode) {
      case cc.macro.KEY.w:
      case cc.macro.KEY.up:
        this._dir = Direction.Up
        this._bias = cc.v2(0, 1)
        break
      case cc.macro.KEY.s:
      case cc.macro.KEY.down:
        this._dir = Direction.Down
        this._bias = cc.v2(0, -1)
        break
      case cc.macro.KEY.a:
      case cc.macro.KEY.left:
        this._dir = Direction.Left
        this._bias = cc.v2(-1, 0)
        break
      case cc.macro.KEY.d:
      case cc.macro.KEY.right:
        this._dir = Direction.Right
        this._bias = cc.v2(1, 0)
        break
    }

    this._playAnimation()
  }

  private _playAnimation(): void {
    switch(this._dir) {
      case Direction.Up:
        this._amin.play('move_up')
        break
      case Direction.Down:
        this._amin.play('move_down')
        break
      case Direction.Left:
        this._amin.play('move_left')
        break
      case Direction.Right:
        this._amin.play('move_right')
        break
    }
  }

  update(dt: number) {
    if (!this._dir) {
      this._rigidBody.linearVelocity = cc.Vec2.ZERO
      return
    }

    this._rigidBody.linearVelocity = cc.v2(
      this._bias.x * this._speed * dt * this._speedUp,
      this._bias.y * this._speed * dt * this._speedUp
    )
  }

  public setSpeedUp(ratio: number): void {
    this._speedUp = ratio
  }

  onCollisionEnter(other: cc.BoxCollider, self: cc.CircleCollider): void {
    if (other.node.group === 'smog') {
      other.node.getComponent(cc.TiledTile).gid = 0
    }
  }

  onCollisionExit(other: cc.BoxCollider, self: cc.CircleCollider): void {
    if (other.node.group === 'smog') {
      other.node.getComponent(cc.TiledTile).gid = 79
    }
  }

  onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsBoxCollider, other: cc.PhysicsBoxCollider) {
    if (other.node.group === 'pickable') {
      if (other.node.name === 'coin') {
        this.game.incCoin()
      } else if (other.node.name === 'speedUp') {
        this.game.speedUp()
      }
      other.node.active = false
      other.node.destroy()
    }
  }
}
