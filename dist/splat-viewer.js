import { jsx as t, jsxs as i, Fragment as qt } from "react/jsx-runtime";
import { useRef as C, useCallback as K, useEffect as I, useState as N } from "react";
import * as P from "three";
import { Controls as Qt, Vector3 as q, MOUSE as be, TOUCH as ue, Quaternion as Tt, Spherical as Mt, Vector2 as Y, Ray as Jt, Plane as es, MathUtils as ts } from "three";
import { SparkRenderer as ss, SplatMesh as as } from "@sparkjsdev/spark";
const Ct = { type: "change" }, at = { type: "start" }, At = { type: "end" }, ze = new Jt(), Pt = new es(), rs = Math.cos(70 * ts.DEG2RAD), A = new q(), O = 2 * Math.PI, _ = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, Je = 1e-6;
class os extends Qt {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLDOMElement} domElement - The HTML element used for event listeners.
   */
  constructor(e, s = null) {
    super(e, s), this.state = _.NONE, this.target = new q(), this.cursor = new q(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: be.ROTATE, MIDDLE: be.DOLLY, RIGHT: be.PAN }, this.touches = { ONE: ue.ROTATE, TWO: ue.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new q(), this._lastQuaternion = new Tt(), this._lastTargetPosition = new q(), this._quat = new Tt().setFromUnitVectors(e.up, new q(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new Mt(), this._sphericalDelta = new Mt(), this._scale = 1, this._panOffset = new q(), this._rotateStart = new Y(), this._rotateEnd = new Y(), this._rotateDelta = new Y(), this._panStart = new Y(), this._panEnd = new Y(), this._panDelta = new Y(), this._dollyStart = new Y(), this._dollyEnd = new Y(), this._dollyDelta = new Y(), this._dollyDirection = new q(), this._mouse = new Y(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = is.bind(this), this._onPointerDown = ns.bind(this), this._onPointerUp = ls.bind(this), this._onContextMenu = bs.bind(this), this._onMouseWheel = hs.bind(this), this._onKeyDown = ms.bind(this), this._onTouchStart = ps.bind(this), this._onTouchMove = us.bind(this), this._onMouseDown = ds.bind(this), this._onMouseMove = cs.bind(this), this._interceptControlDown = fs.bind(this), this._interceptControlUp = xs.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
  }
  connect(e) {
    super.connect(e), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, { passive: !0, capture: !0 }), this.domElement.style.touchAction = "none";
  }
  disconnect() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.style.touchAction = "auto";
  }
  dispose() {
    this.disconnect();
  }
  /**
   * Get the current vertical rotation, in radians.
   *
   * @return {number} The current vertical rotation, in radians.
   */
  getPolarAngle() {
    return this._spherical.phi;
  }
  /**
   * Get the current horizontal rotation, in radians.
   *
   * @return {number} The current horizontal rotation, in radians.
   */
  getAzimuthalAngle() {
    return this._spherical.theta;
  }
  /**
   * Returns the distance from the camera to the target.
   *
   * @return {number} The distance from the camera to the target.
   */
  getDistance() {
    return this.object.position.distanceTo(this.target);
  }
  /**
   * Adds key event listeners to the given DOM element.
   * `window` is a recommended argument for using this method.
   *
   * @param {HTMLDOMElement} domElement - The DOM element
   */
  listenToKeyEvents(e) {
    e.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = e;
  }
  /**
   * Removes the key event listener previously defined with `listenToKeyEvents()`.
   */
  stopListenToKeyEvents() {
    this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
  }
  /**
   * Save the current state of the controls. This can later be recovered with `reset()`.
   */
  saveState() {
    this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
  }
  /**
   * Reset the controls to their state from either the last time the `saveState()`
   * was called, or the initial state.
   */
  reset() {
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(Ct), this.update(), this.state = _.NONE;
  }
  update(e = null) {
    const s = this.object.position;
    A.copy(s).sub(this.target), A.applyQuaternion(this._quat), this._spherical.setFromVector3(A), this.autoRotate && this.state === _.NONE && this._rotateLeft(this._getAutoRotationAngle(e)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let r = this.minAzimuthAngle, n = this.maxAzimuthAngle;
    isFinite(r) && isFinite(n) && (r < -Math.PI ? r += O : r > Math.PI && (r -= O), n < -Math.PI ? n += O : n > Math.PI && (n -= O), r <= n ? this._spherical.theta = Math.max(r, Math.min(n, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (r + n) / 2 ? Math.max(r, this._spherical.theta) : Math.min(n, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let h = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const c = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), h = c != this._spherical.radius;
    }
    if (A.setFromSpherical(this._spherical), A.applyQuaternion(this._quatInverse), s.copy(this.target).add(A), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let c = null;
      if (this.object.isPerspectiveCamera) {
        const y = A.length();
        c = this._clampDistance(y * this._scale);
        const u = y - c;
        this.object.position.addScaledVector(this._dollyDirection, u), this.object.updateMatrixWorld(), h = !!u;
      } else if (this.object.isOrthographicCamera) {
        const y = new q(this._mouse.x, this._mouse.y, 0);
        y.unproject(this.object);
        const u = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), h = u !== this.object.zoom;
        const m = new q(this._mouse.x, this._mouse.y, 0);
        m.unproject(this.object), this.object.position.sub(m).add(y), this.object.updateMatrixWorld(), c = A.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      c !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(c).add(this.object.position) : (ze.origin.copy(this.object.position), ze.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(ze.direction)) < rs ? this.object.lookAt(this.target) : (Pt.setFromNormalAndCoplanarPoint(this.object.up, this.target), ze.intersectPlane(Pt, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const c = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), c !== this.object.zoom && (this.object.updateProjectionMatrix(), h = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, h || this._lastPosition.distanceToSquared(this.object.position) > Je || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > Je || this._lastTargetPosition.distanceToSquared(this.target) > Je ? (this.dispatchEvent(Ct), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(e) {
    return e !== null ? O / 60 * this.autoRotateSpeed * e : O / 60 / 60 * this.autoRotateSpeed;
  }
  _getZoomScale(e) {
    const s = Math.abs(e * 0.01);
    return Math.pow(0.95, this.zoomSpeed * s);
  }
  _rotateLeft(e) {
    this._sphericalDelta.theta -= e;
  }
  _rotateUp(e) {
    this._sphericalDelta.phi -= e;
  }
  _panLeft(e, s) {
    A.setFromMatrixColumn(s, 0), A.multiplyScalar(-e), this._panOffset.add(A);
  }
  _panUp(e, s) {
    this.screenSpacePanning === !0 ? A.setFromMatrixColumn(s, 1) : (A.setFromMatrixColumn(s, 0), A.crossVectors(this.object.up, A)), A.multiplyScalar(e), this._panOffset.add(A);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(e, s) {
    const r = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const n = this.object.position;
      A.copy(n).sub(this.target);
      let h = A.length();
      h *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * e * h / r.clientHeight, this.object.matrix), this._panUp(2 * s * h / r.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(e * (this.object.right - this.object.left) / this.object.zoom / r.clientWidth, this.object.matrix), this._panUp(s * (this.object.top - this.object.bottom) / this.object.zoom / r.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
  }
  _dollyOut(e) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _dollyIn(e) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _updateZoomParameters(e, s) {
    if (!this.zoomToCursor)
      return;
    this._performCursorZoom = !0;
    const r = this.domElement.getBoundingClientRect(), n = e - r.left, h = s - r.top, c = r.width, y = r.height;
    this._mouse.x = n / c * 2 - 1, this._mouse.y = -(h / y) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
  }
  _clampDistance(e) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, e));
  }
  //
  // event callbacks - update the object state
  //
  _handleMouseDownRotate(e) {
    this._rotateStart.set(e.clientX, e.clientY);
  }
  _handleMouseDownDolly(e) {
    this._updateZoomParameters(e.clientX, e.clientX), this._dollyStart.set(e.clientX, e.clientY);
  }
  _handleMouseDownPan(e) {
    this._panStart.set(e.clientX, e.clientY);
  }
  _handleMouseMoveRotate(e) {
    this._rotateEnd.set(e.clientX, e.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const s = this.domElement;
    this._rotateLeft(O * this._rotateDelta.x / s.clientHeight), this._rotateUp(O * this._rotateDelta.y / s.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
  }
  _handleMouseMoveDolly(e) {
    this._dollyEnd.set(e.clientX, e.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.update();
  }
  _handleMouseMovePan(e) {
    this._panEnd.set(e.clientX, e.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
  }
  _handleMouseWheel(e) {
    this._updateZoomParameters(e.clientX, e.clientY), e.deltaY < 0 ? this._dollyIn(this._getZoomScale(e.deltaY)) : e.deltaY > 0 && this._dollyOut(this._getZoomScale(e.deltaY)), this.update();
  }
  _handleKeyDown(e) {
    let s = !1;
    switch (e.code) {
      case this.keys.UP:
        e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateUp(O * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), s = !0;
        break;
      case this.keys.BOTTOM:
        e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateUp(-O * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), s = !0;
        break;
      case this.keys.LEFT:
        e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateLeft(O * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), s = !0;
        break;
      case this.keys.RIGHT:
        e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateLeft(-O * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), s = !0;
        break;
    }
    s && (e.preventDefault(), this.update());
  }
  _handleTouchStartRotate(e) {
    if (this._pointers.length === 1)
      this._rotateStart.set(e.pageX, e.pageY);
    else {
      const s = this._getSecondPointerPosition(e), r = 0.5 * (e.pageX + s.x), n = 0.5 * (e.pageY + s.y);
      this._rotateStart.set(r, n);
    }
  }
  _handleTouchStartPan(e) {
    if (this._pointers.length === 1)
      this._panStart.set(e.pageX, e.pageY);
    else {
      const s = this._getSecondPointerPosition(e), r = 0.5 * (e.pageX + s.x), n = 0.5 * (e.pageY + s.y);
      this._panStart.set(r, n);
    }
  }
  _handleTouchStartDolly(e) {
    const s = this._getSecondPointerPosition(e), r = e.pageX - s.x, n = e.pageY - s.y, h = Math.sqrt(r * r + n * n);
    this._dollyStart.set(0, h);
  }
  _handleTouchStartDollyPan(e) {
    this.enableZoom && this._handleTouchStartDolly(e), this.enablePan && this._handleTouchStartPan(e);
  }
  _handleTouchStartDollyRotate(e) {
    this.enableZoom && this._handleTouchStartDolly(e), this.enableRotate && this._handleTouchStartRotate(e);
  }
  _handleTouchMoveRotate(e) {
    if (this._pointers.length == 1)
      this._rotateEnd.set(e.pageX, e.pageY);
    else {
      const r = this._getSecondPointerPosition(e), n = 0.5 * (e.pageX + r.x), h = 0.5 * (e.pageY + r.y);
      this._rotateEnd.set(n, h);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const s = this.domElement;
    this._rotateLeft(O * this._rotateDelta.x / s.clientHeight), this._rotateUp(O * this._rotateDelta.y / s.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(e) {
    if (this._pointers.length === 1)
      this._panEnd.set(e.pageX, e.pageY);
    else {
      const s = this._getSecondPointerPosition(e), r = 0.5 * (e.pageX + s.x), n = 0.5 * (e.pageY + s.y);
      this._panEnd.set(r, n);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(e) {
    const s = this._getSecondPointerPosition(e), r = e.pageX - s.x, n = e.pageY - s.y, h = Math.sqrt(r * r + n * n);
    this._dollyEnd.set(0, h), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const c = (e.pageX + s.x) * 0.5, y = (e.pageY + s.y) * 0.5;
    this._updateZoomParameters(c, y);
  }
  _handleTouchMoveDollyPan(e) {
    this.enableZoom && this._handleTouchMoveDolly(e), this.enablePan && this._handleTouchMovePan(e);
  }
  _handleTouchMoveDollyRotate(e) {
    this.enableZoom && this._handleTouchMoveDolly(e), this.enableRotate && this._handleTouchMoveRotate(e);
  }
  // pointers
  _addPointer(e) {
    this._pointers.push(e.pointerId);
  }
  _removePointer(e) {
    delete this._pointerPositions[e.pointerId];
    for (let s = 0; s < this._pointers.length; s++)
      if (this._pointers[s] == e.pointerId) {
        this._pointers.splice(s, 1);
        return;
      }
  }
  _isTrackingPointer(e) {
    for (let s = 0; s < this._pointers.length; s++)
      if (this._pointers[s] == e.pointerId) return !0;
    return !1;
  }
  _trackPointer(e) {
    let s = this._pointerPositions[e.pointerId];
    s === void 0 && (s = new Y(), this._pointerPositions[e.pointerId] = s), s.set(e.pageX, e.pageY);
  }
  _getSecondPointerPosition(e) {
    const s = e.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[s];
  }
  //
  _customWheelEvent(e) {
    const s = e.deltaMode, r = {
      clientX: e.clientX,
      clientY: e.clientY,
      deltaY: e.deltaY
    };
    switch (s) {
      case 1:
        r.deltaY *= 16;
        break;
      case 2:
        r.deltaY *= 100;
        break;
    }
    return e.ctrlKey && !this._controlActive && (r.deltaY *= 10), r;
  }
}
function ns(a) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(a.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(a) && (this._addPointer(a), a.pointerType === "touch" ? this._onTouchStart(a) : this._onMouseDown(a)));
}
function is(a) {
  this.enabled !== !1 && (a.pointerType === "touch" ? this._onTouchMove(a) : this._onMouseMove(a));
}
function ls(a) {
  switch (this._removePointer(a), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(a.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(At), this.state = _.NONE;
      break;
    case 1:
      const e = this._pointers[0], s = this._pointerPositions[e];
      this._onTouchStart({ pointerId: e, pageX: s.x, pageY: s.y });
      break;
  }
}
function ds(a) {
  let e;
  switch (a.button) {
    case 0:
      e = this.mouseButtons.LEFT;
      break;
    case 1:
      e = this.mouseButtons.MIDDLE;
      break;
    case 2:
      e = this.mouseButtons.RIGHT;
      break;
    default:
      e = -1;
  }
  switch (e) {
    case be.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(a), this.state = _.DOLLY;
      break;
    case be.ROTATE:
      if (a.ctrlKey || a.metaKey || a.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(a), this.state = _.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(a), this.state = _.ROTATE;
      }
      break;
    case be.PAN:
      if (a.ctrlKey || a.metaKey || a.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(a), this.state = _.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(a), this.state = _.PAN;
      }
      break;
    default:
      this.state = _.NONE;
  }
  this.state !== _.NONE && this.dispatchEvent(at);
}
function cs(a) {
  switch (this.state) {
    case _.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(a);
      break;
    case _.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(a);
      break;
    case _.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(a);
      break;
  }
}
function hs(a) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== _.NONE || (a.preventDefault(), this.dispatchEvent(at), this._handleMouseWheel(this._customWheelEvent(a)), this.dispatchEvent(At));
}
function ms(a) {
  this.enabled !== !1 && this._handleKeyDown(a);
}
function ps(a) {
  switch (this._trackPointer(a), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case ue.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(a), this.state = _.TOUCH_ROTATE;
          break;
        case ue.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(a), this.state = _.TOUCH_PAN;
          break;
        default:
          this.state = _.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case ue.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(a), this.state = _.TOUCH_DOLLY_PAN;
          break;
        case ue.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(a), this.state = _.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = _.NONE;
      }
      break;
    default:
      this.state = _.NONE;
  }
  this.state !== _.NONE && this.dispatchEvent(at);
}
function us(a) {
  switch (this._trackPointer(a), this.state) {
    case _.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(a), this.update();
      break;
    case _.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(a), this.update();
      break;
    case _.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(a), this.update();
      break;
    case _.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(a), this.update();
      break;
    default:
      this.state = _.NONE;
  }
}
function bs(a) {
  this.enabled !== !1 && a.preventDefault();
}
function fs(a) {
  a.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function xs(a) {
  a.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function gs(a, e = {}) {
  return new ss({
    renderer: a,
    ...e
  });
}
async function ys({
  url: a,
  file: e = null,
  parentGroup: s,
  paged: r,
  maxSh: n = 3,
  opacity: h = 1,
  flipY: c = !0,
  isCancelled: y = () => !1
}) {
  const u = e ? !1 : typeof r == "boolean" ? r : /\.rad(\?|$)/i.test(a), m = new as(
    e ? { fileBytes: await e.arrayBuffer(), fileName: e.name } : { url: a, paged: u }
  );
  if (c && m.quaternion.set(1, 0, 0, 0), m.opacity = h, typeof m.maxSh == "number" && (m.maxSh = n), s.add(m), m.initialized && typeof m.initialized.then == "function" && await m.initialized, y())
    return s.remove(m), typeof m.dispose == "function" && m.dispose(), null;
  const w = new P.Box3();
  if (typeof m.getBoundingBox == "function")
    try {
      const k = m.getBoundingBox(!1);
      k && !k.isEmpty() && (m.updateWorldMatrix(!0, !1), w.copy(k).applyMatrix4(m.matrixWorld));
    } catch {
    }
  if (w.isEmpty() && w.setFromObject(m), !u && typeof m.forEachSplat == "function" && m.numSplats > 0)
    try {
      const F = Math.max(1, Math.floor(m.numSplats / 2e5)), b = [], z = [], Q = [];
      if (m.forEachSplat((j, J, Z, W, G) => {
        j % F !== 0 || G < 0.3 || (b.push(J.x), z.push(J.y), Q.push(J.z));
      }), b.length > 100) {
        const j = (G, fe) => {
          const U = Float32Array.from(G).sort();
          return U[Math.min(U.length - 1, Math.floor(U.length * fe))];
        }, W = new P.Box3(
          new P.Vector3(j(b, 3e-3), j(z, 3e-3), j(Q, 3e-3)),
          new P.Vector3(j(b, 0.997), j(z, 0.997), j(Q, 0.997))
        );
        W.expandByVector(W.getSize(new P.Vector3()).multiplyScalar(0.02)), m.updateWorldMatrix(!0, !1), W.applyMatrix4(m.matrixWorld), W.isEmpty() || w.copy(W);
      }
    } catch {
    }
  const x = new P.Vector3(), o = new P.Vector3();
  w.isEmpty() || (w.getSize(x), w.getCenter(o));
  const p = {
    splatCount: typeof m.numSplats == "number" ? m.numSplats : 0,
    paged: u,
    box: w,
    center: o,
    size: x
  };
  return { splatMesh: m, stats: p, dispose: () => {
    s.remove(m), typeof m.dispose == "function" && m.dispose();
  } };
}
function Rt(a) {
  if (!Number.isFinite(a) || a <= 0) return null;
  const e = ["B", "KB", "MB", "GB"], s = Math.min(Math.floor(Math.log(a) / Math.log(1024)), e.length - 1);
  return `${(a / 1024 ** s).toFixed(s === 0 ? 0 : 1)} ${e[s]}`;
}
function ks(a, e) {
  const s = URL.createObjectURL(a), r = document.createElement("a");
  r.href = s, r.download = e, document.body.appendChild(r), r.click(), document.body.removeChild(r), setTimeout(() => URL.revokeObjectURL(s), 1e3);
}
function Be(a) {
  var e, s;
  a && (a.geometry && a.geometry.dispose(), Array.isArray(a.material) ? a.material.forEach((r) => {
    var n;
    return (n = r == null ? void 0 : r.dispose) == null ? void 0 : n.call(r);
  }) : a.material && ((s = (e = a.material).dispose) == null || s.call(e)));
}
function _s({ center: a, size: e, minY: s }) {
  const r = Math.max(e.x, e.y, e.z, 0.1), n = Math.pow(10, Math.ceil(Math.log10(Math.max(r * 2, 0.1)))), h = new P.GridHelper(n, 20, 16096779, 3359061);
  h.position.set(a.x, Number.isFinite(s) ? s : a.y - e.y * 0.5, a.z), h.visible = !1;
  const c = new P.Box3(
    a.clone().sub(e.clone().multiplyScalar(0.5)),
    a.clone().add(e.clone().multiplyScalar(0.5))
  ), y = new P.Box3Helper(c, 16096779);
  return y.visible = !1, { grid: h, bbox: y };
}
function ws(a, e, s = {}) {
  const r = {
    p: a.position.toArray().map((n) => Number(n.toFixed(4))),
    t: e.target.toArray().map((n) => Number(n.toFixed(4))),
    ...s
  };
  return btoa(encodeURIComponent(JSON.stringify(r)));
}
const Ns = /^#[0-9a-f]{6}$/i;
function Dt(a) {
  return typeof a == "string" && Ns.test(a);
}
const Lt = "splat-viewer:bgColor";
function vs() {
  try {
    const a = window.localStorage.getItem(Lt);
    return Dt(a) ? a : null;
  } catch {
    return null;
  }
}
function Ss(a) {
  try {
    window.localStorage.setItem(Lt, a);
  } catch {
  }
}
function Es(a = "") {
  const e = String(a).match(/view=([A-Za-z0-9+/=]+)/);
  if (!e) return null;
  try {
    const s = JSON.parse(decodeURIComponent(atob(e[1]))), r = (n) => Array.isArray(n) && n.length === 3 && n.every((h) => typeof h == "number" && Number.isFinite(h));
    return !s || !r(s.p) || !r(s.t) || s.opacity !== void 0 && (typeof s.opacity != "number" || !Number.isFinite(s.opacity) || s.opacity < 0.05 || s.opacity > 1) || s.maxSh !== void 0 && (!Number.isInteger(s.maxSh) || s.maxSh < 0 || s.maxSh > 3) || s.bg !== void 0 && !Dt(s.bg) ? null : s;
  } catch {
    return null;
  }
}
function Ts({ theme: a, onToggleTheme: e }) {
  const s = a === "dark";
  return /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      onClick: e,
      "aria-label": s ? "Switch viewer UI to light mode" : "Switch viewer UI to dark mode",
      title: s ? "Switch to Light Mode" : "Switch to Dark Mode",
      className: "flex items-center justify-center p-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl bg-white/90 text-slate-700 border-slate-200/90 hover:bg-slate-100 dark:bg-slate-900/85 dark:text-slate-200 dark:border-slate-800/80 dark:hover:bg-slate-800",
      children: s ? /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4 text-amber-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" }) }) : /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4 text-slate-700", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" }) })
    }
  );
}
function Ms({
  title: a,
  subtitle: e,
  badge: s,
  backUrl: r,
  paradata: n,
  paradataOpen: h,
  showParadata: c = !0,
  enableDeepLink: y = !0,
  enableExport: u = !0,
  showThemeToggle: m = !0,
  enableFullscreen: w = !0,
  downloadMenuOpen: x,
  setDownloadMenuOpen: o,
  loading: p,
  error: L,
  isFullscreen: k,
  theme: F,
  onToggleTheme: b,
  onCopyShareLink: z,
  onDownloadOriginal: Q,
  onScreenshot: j,
  enableLocalFiles: J = !1,
  onOpenLocalFile: Z,
  showTelemetry: W = !0,
  telemetryOpen: G = !1,
  onToggleTelemetry: fe,
  onToggleParadata: U,
  onToggleFullscreen: Te,
  children: he
}) {
  const de = C(null), xe = C(null), re = !!(n && c), me = K(() => {
    o == null || o(!1);
  }, [o]), B = "bg-white/90 text-slate-700 border-slate-200/90 hover:bg-slate-100 dark:bg-slate-900/85 dark:text-slate-200 dark:border-slate-800/80 dark:hover:bg-slate-800";
  return /* @__PURE__ */ i("div", { className: "pointer-events-none absolute inset-x-0 top-3 z-20 px-3 sm:px-4 flex flex-wrap items-start justify-between gap-2", children: [
    /* @__PURE__ */ i("header", { className: "pointer-events-auto flex items-center gap-3 bg-white/90 text-slate-800 border-slate-200/90 dark:bg-slate-900/85 dark:text-slate-100 dark:border-slate-800/80 backdrop-blur-md border rounded-xl px-3.5 py-2 shadow-2xl max-w-full sm:max-w-md lg:max-w-lg", children: [
      r && /* @__PURE__ */ t(
        "a",
        {
          href: r,
          "aria-label": "Go back",
          className: "p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 border dark:border-slate-700/70 transition shrink-0",
          children: /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) })
        }
      ),
      /* @__PURE__ */ i("div", { className: "min-w-0", children: [
        /* @__PURE__ */ i("h1", { className: "text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ t("span", { className: "truncate", children: a }),
          s && /* @__PURE__ */ t("span", { className: "text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 border dark:border-amber-500/20 shrink-0", children: s })
        ] }),
        e && /* @__PURE__ */ t("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate", children: e })
      ] })
    ] }),
    /* @__PURE__ */ i("div", { className: "pointer-events-auto flex items-center gap-1.5 flex-wrap justify-end ml-auto", children: [
      J && /* @__PURE__ */ i(
        "button",
        {
          type: "button",
          onClick: Z,
          "aria-label": "Open local splat file",
          title: "Open a local splat file (or drag and drop)",
          className: `flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${B}`,
          children: [
            /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" }) }),
            /* @__PURE__ */ t("span", { className: "hidden sm:inline", children: "Open" })
          ]
        }
      ),
      y && /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          onClick: z,
          "aria-label": "Copy shareable link to current view",
          title: "Copy direct link to current camera angle",
          className: `flex items-center justify-center p-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${B}`,
          children: /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4 text-slate-500 dark:text-slate-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" }) })
        }
      ),
      u && /* @__PURE__ */ i(
        "div",
        {
          ref: de,
          className: "relative",
          onKeyDown: ($) => {
            var X;
            $.key === "Escape" && x && ($.stopPropagation(), me(), (X = xe.current) == null || X.focus());
          },
          children: [
            /* @__PURE__ */ i(
              "button",
              {
                ref: xe,
                type: "button",
                "aria-expanded": !!x,
                disabled: p || !!L,
                onClick: () => o == null ? void 0 : o(($) => !$),
                className: `flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border disabled:opacity-50 backdrop-blur-md transition-all shadow-xl ${B}`,
                children: [
                  /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4 text-amber-500 dark:text-amber-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }) }),
                  /* @__PURE__ */ t("span", { children: "Export" })
                ]
              }
            ),
            x && /* @__PURE__ */ i(
              "div",
              {
                role: "group",
                "aria-label": "Export options",
                className: "absolute right-0 mt-2 w-56 bg-white/95 text-slate-800 border-slate-200 dark:bg-slate-900/95 dark:text-slate-200 dark:border-slate-800 backdrop-blur-xl border rounded-xl shadow-2xl py-1.5 z-30 text-xs",
                children: [
                  /* @__PURE__ */ i(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        me(), j == null || j();
                      },
                      className: "w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between",
                      children: [
                        /* @__PURE__ */ t("span", { children: "Viewport Snapshot" }),
                        /* @__PURE__ */ t("span", { className: "text-[10px] font-mono text-emerald-600 dark:text-emerald-400", children: ".PNG" })
                      ]
                    }
                  ),
                  Q && /* @__PURE__ */ i(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        me(), Q();
                      },
                      className: "w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between",
                      children: [
                        /* @__PURE__ */ t("span", { children: "Source Splat Asset" }),
                        /* @__PURE__ */ t("span", { className: "text-[10px] font-mono text-amber-600 dark:text-amber-400", children: "RAW" })
                      ]
                    }
                  )
                ]
              }
            )
          ]
        }
      ),
      re && /* @__PURE__ */ i(
        "button",
        {
          type: "button",
          "aria-pressed": h,
          "aria-expanded": h,
          onClick: U,
          className: `flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${h ? "bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20" : B}`,
          children: [
            /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }),
            /* @__PURE__ */ t("span", { className: "hidden sm:inline", children: "Paradata" })
          ]
        }
      ),
      W && /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          "aria-pressed": G,
          "aria-expanded": G,
          "aria-label": "Toggle splat telemetry",
          title: "Splat telemetry (I)",
          onClick: fe,
          className: `flex items-center justify-center p-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${G ? "bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20" : B}`,
          children: /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) })
        }
      ),
      he,
      m && /* @__PURE__ */ t(Ts, { theme: F, onToggleTheme: b }),
      w && /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          onClick: Te,
          "aria-label": k ? "Exit fullscreen" : "Enter fullscreen",
          title: k ? "Exit Fullscreen" : "Enter Fullscreen",
          className: `flex items-center justify-center p-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${B}`,
          children: k ? /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4 text-amber-500 dark:text-amber-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 9L4 4m0 0l5 0m-5 0l0 5m6 6l5 5m0 0l-5 0m5 0l0-5M15 9l5-5m0 0l-5 0m5 0l0 5m-6 6l-5 5m0 0l5 0m-5 0l0-5" }) }) : /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" }) })
        }
      )
    ] })
  ] });
}
const Cs = [
  { id: "iso", label: "Iso" },
  { id: "front", label: "Front" },
  { id: "top", label: "Top" },
  { id: "side", label: "Side" }
], Ps = [
  { name: "Dark Slate", hex: "#090d16" },
  { name: "Obsidian", hex: "#020617" },
  { name: "Light Slate", hex: "#f1f5f9" },
  { name: "Warm Stone", hex: "#e7e5e4" }
];
function Rs({
  splatCount: a = 0,
  paged: e = !1,
  showGrid: s,
  setShowGrid: r,
  showBounds: n,
  setShowBounds: h,
  autoRotate: c,
  setAutoRotate: y,
  opacity: u,
  setOpacity: m,
  maxSh: w,
  setMaxSh: x,
  bgColor: o,
  setBgColor: p,
  setCameraView: L
}) {
  const k = "flex items-center gap-1 bg-slate-100/80 border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800/60 p-1 rounded-xl border", F = (b) => `px-2 py-1 rounded-lg font-medium border transition ${b ? "bg-amber-500/20 text-amber-800 border-amber-500/50 dark:text-amber-300 dark:border-amber-500/40" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60"}`;
  return /* @__PURE__ */ i(
    "nav",
    {
      "aria-label": "Gaussian splat camera and rendering controls",
      className: "pointer-events-auto max-w-6xl w-full mx-auto bg-white/90 text-slate-800 border-slate-200/90 dark:bg-slate-900/90 dark:text-slate-300 dark:border-slate-800/80 backdrop-blur-xl border rounded-xl px-3 py-2 shadow-2xl flex flex-wrap items-center justify-between gap-2 text-xs",
      children: [
        /* @__PURE__ */ i("div", { className: "flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400", children: [
          /* @__PURE__ */ i("span", { children: [
            a.toLocaleString(),
            " splats"
          ] }),
          e && /* @__PURE__ */ t("span", { className: "px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-[10px] uppercase", children: "Paged LoD" })
        ] }),
        /* @__PURE__ */ i("div", { role: "group", "aria-label": "Viewport helpers", className: "flex items-center gap-1", children: [
          /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              "aria-pressed": s,
              onClick: () => r((b) => !b),
              title: "Toggle Reference Grid (G)",
              className: F(s),
              children: "Grid"
            }
          ),
          /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              "aria-pressed": n,
              onClick: () => h((b) => !b),
              title: "Toggle Bounding Box (B)",
              className: F(n),
              children: "Bounds"
            }
          ),
          /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              "aria-pressed": c,
              onClick: () => y((b) => !b),
              title: "Toggle Auto-Rotate (R)",
              className: F(c),
              children: "Rotate"
            }
          )
        ] }),
        /* @__PURE__ */ t("div", { role: "group", "aria-label": "Camera preset angles", className: k, children: Cs.map((b) => /* @__PURE__ */ t(
          "button",
          {
            type: "button",
            onClick: () => L(b.id),
            className: "px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition",
            children: b.label
          },
          b.id
        )) }),
        /* @__PURE__ */ i("div", { className: "flex items-center gap-2.5 bg-slate-100/80 border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800/60 px-2.5 py-1.5 rounded-xl border", children: [
          /* @__PURE__ */ i("label", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ t("span", { className: "text-[10px] font-mono text-slate-500 dark:text-slate-400", children: "Opacity" }),
            /* @__PURE__ */ t(
              "input",
              {
                type: "range",
                min: "0.05",
                max: "1",
                step: "0.05",
                value: u,
                onChange: (b) => m(parseFloat(b.target.value)),
                className: "w-14 accent-amber-500 cursor-pointer h-1 bg-slate-300 dark:bg-slate-800 rounded"
              }
            )
          ] }),
          /* @__PURE__ */ i("label", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ t("span", { className: "text-[10px] font-mono text-slate-500 dark:text-slate-400", children: "SH" }),
            /* @__PURE__ */ i(
              "select",
              {
                "aria-label": "Spherical harmonics bands",
                value: w,
                onChange: (b) => x(Number(b.target.value)),
                className: "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono text-[10px]",
                children: [
                  /* @__PURE__ */ t("option", { value: 0, children: "0" }),
                  /* @__PURE__ */ t("option", { value: 1, children: "1" }),
                  /* @__PURE__ */ t("option", { value: 2, children: "2" }),
                  /* @__PURE__ */ t("option", { value: 3, children: "3" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ i("div", { role: "group", "aria-label": "Background color", className: "flex items-center gap-1", children: [
            Ps.map((b) => /* @__PURE__ */ t(
              "button",
              {
                type: "button",
                "aria-label": `Background ${b.name}`,
                "aria-pressed": o === b.hex,
                onClick: () => p(b.hex),
                style: { backgroundColor: b.hex },
                className: `w-3.5 h-3.5 rounded-full border transition ${o === b.hex ? "border-amber-500 scale-110" : "border-slate-400 dark:border-slate-600"}`
              },
              b.hex
            )),
            /* @__PURE__ */ t(
              "input",
              {
                type: "color",
                "aria-label": "Custom background color",
                title: "Custom background color",
                value: /^#[0-9a-f]{6}$/i.test(o) ? o : "#090d16",
                onChange: (b) => p(b.target.value),
                className: "w-4 h-4 p-0 rounded-full border border-slate-400 dark:border-slate-600 bg-transparent cursor-pointer"
              }
            )
          ] })
        ] })
      ]
    }
  );
}
function As({
  viewpoints: a = [],
  activeIndex: e = -1,
  onSelectViewpoint: s,
  onStepViewpoint: r
}) {
  if (!Array.isArray(a) || a.length === 0) return null;
  const n = e >= 0 ? a[e] : null;
  return /* @__PURE__ */ i(
    "div",
    {
      role: "region",
      "aria-label": "Curated camera viewpoints and tour stops",
      className: "pointer-events-auto max-w-xl w-full mx-auto bg-white/90 text-slate-800 border-slate-200/90 dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-800/80 backdrop-blur-xl border rounded-full px-2.5 py-1.5 shadow-2xl flex items-center justify-between gap-2 text-xs",
      children: [
        /* @__PURE__ */ t(
          "button",
          {
            type: "button",
            "aria-label": "Previous viewpoint",
            onClick: () => r(-1),
            className: "p-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 transition shrink-0",
            children: /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 19l-7-7 7-7" }) })
          }
        ),
        /* @__PURE__ */ i("div", { className: "min-w-0 flex-1 flex flex-col items-center text-center px-1", children: [
          /* @__PURE__ */ i("div", { className: "flex items-center gap-1.5 max-w-full", children: [
            /* @__PURE__ */ t("span", { className: "font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0", children: n ? `${e + 1}/${a.length}` : `0/${a.length}` }),
            /* @__PURE__ */ t("span", { className: "font-medium truncate", children: n ? n.title || `Viewpoint ${e + 1}` : `Viewpoints (${a.length})` })
          ] }),
          (n == null ? void 0 : n.description) && /* @__PURE__ */ t("p", { className: "text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full", children: n.description })
        ] }),
        a.length <= 8 && /* @__PURE__ */ t("div", { className: "hidden sm:flex items-center gap-1 shrink-0", children: a.map((h, c) => /* @__PURE__ */ t(
          "button",
          {
            type: "button",
            "aria-label": `Go to viewpoint ${c + 1}: ${h.title || `Stop ${c + 1}`}`,
            "aria-pressed": e === c,
            onClick: () => s(c),
            className: `w-5 h-5 rounded-full font-mono text-[10px] font-bold transition ${e === c ? "bg-amber-500 text-slate-950" : "bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`,
            children: c + 1
          },
          h.id ?? c
        )) }),
        /* @__PURE__ */ t(
          "button",
          {
            type: "button",
            "aria-label": "Next viewpoint",
            onClick: () => r(1),
            className: "p-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 transition shrink-0",
            children: /* @__PURE__ */ t("svg", { "aria-hidden": "true", className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5l7 7-7 7" }) })
          }
        )
      ]
    }
  );
}
const Ds = {
  MEASURED: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/30",
  ESTIMATED: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/30",
  PATCHED: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:bg-orange-400/15 dark:text-orange-300 dark:border-orange-400/30",
  SYNTHETIC: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 dark:bg-indigo-400/15 dark:text-indigo-300 dark:border-indigo-400/30",
  "NOT CREATED": "bg-slate-500/15 text-slate-600 border-slate-500/25 dark:bg-slate-400/10 dark:text-slate-400 dark:border-slate-400/20"
}, Ls = "bg-slate-500/15 text-slate-600 border-slate-500/25 dark:bg-slate-400/10 dark:text-slate-400 dark:border-slate-400/20";
function le({ children: a }) {
  return /* @__PURE__ */ t("h3", { className: "text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-3", children: a });
}
function st(a) {
  return typeof a == "boolean" ? a ? "Yes" : "No" : String(a);
}
function Ee({ fields: a }) {
  return !a || !a.length ? null : /* @__PURE__ */ t("dl", { className: "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs", children: a.map((e, s) => /* @__PURE__ */ i(
    "div",
    {
      className: "grid grid-cols-[150px_1fr] gap-3 items-baseline",
      children: [
        /* @__PURE__ */ t("dt", { className: "font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400", children: e.label }),
        /* @__PURE__ */ t("dd", { className: "text-slate-800 dark:text-slate-100 leading-relaxed break-words", children: st(e.value) })
      ]
    },
    `${e.label}-${s}`
  )) });
}
function js({ isOpen: a, onClose: e, paradata: s }) {
  var m, w, x;
  const r = C(null), n = C(null);
  if (I(() => {
    var p;
    if (!a || !s) return;
    const o = document.activeElement;
    return (p = n.current) == null || p.focus(), () => {
      o != null && o.isConnected && o.focus();
    };
  }, [a, !!s]), !a || !s) return null;
  const h = s.title || `FULL METADATA & PARADATA RECORD${s.recordId ? ` — ${s.recordId}` : ""}`, c = s.splatComponents || s.textureMaps || [], y = !!s.processingSummary && (s.processingSummary.fields && s.processingSummary.fields.length > 0 || s.processingSummary.ratings && s.processingSummary.ratings.length > 0), u = !!s.derivedAssets && (!!s.derivedAssets.software || s.derivedAssets.assets && s.derivedAssets.assets.length > 0);
  return /* @__PURE__ */ t(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      "aria-label": h,
      ref: r,
      className: "absolute inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm",
      onClick: e,
      onKeyDown: (o) => {
        if (o.key === "Escape")
          o.stopPropagation(), e();
        else if (o.key === "Tab") {
          const p = r.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
          if (!p.length) return;
          const L = p[0], k = p[p.length - 1];
          o.shiftKey && document.activeElement === L ? (o.preventDefault(), k.focus()) : !o.shiftKey && document.activeElement === k && (o.preventDefault(), L.focus());
        }
      },
      children: /* @__PURE__ */ i(
        "div",
        {
          className: "relative w-full max-w-5xl max-h-full flex flex-col rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden",
          onClick: (o) => o.stopPropagation(),
          children: [
            /* @__PURE__ */ i("div", { className: "flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60", children: [
              /* @__PURE__ */ t("h2", { className: "text-xs font-mono font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300 truncate", children: h }),
              /* @__PURE__ */ t(
                "button",
                {
                  ref: n,
                  type: "button",
                  onClick: e,
                  "aria-label": "Close paradata record",
                  className: "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors",
                  children: "Close"
                }
              )
            ] }),
            /* @__PURE__ */ i("div", { className: "overflow-y-auto px-5 py-5 space-y-6 divide-y divide-slate-200/80 dark:divide-slate-800", children: [
              s.objectMetadata && s.objectMetadata.length > 0 && /* @__PURE__ */ t("section", { children: /* @__PURE__ */ t(Ee, { fields: s.objectMetadata }) }),
              y && /* @__PURE__ */ i("section", { className: "pt-5", children: [
                /* @__PURE__ */ t(le, { children: "Capture & Reconstruction" }),
                /* @__PURE__ */ i("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs", children: [
                  /* @__PURE__ */ t("div", { className: "space-y-2.5", children: (m = s.processingSummary.fields) == null ? void 0 : m.map((o, p) => /* @__PURE__ */ i(
                    "div",
                    {
                      className: "grid grid-cols-[150px_1fr] gap-3 items-baseline",
                      children: [
                        /* @__PURE__ */ t("span", { className: "font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400", children: o.label }),
                        /* @__PURE__ */ t("span", { className: "text-slate-800 dark:text-slate-100", children: st(o.value) })
                      ]
                    },
                    `${o.label}-${p}`
                  )) }),
                  /* @__PURE__ */ t("div", { className: "space-y-2.5", children: (w = s.processingSummary.ratings) == null ? void 0 : w.map((o, p) => /* @__PURE__ */ i(
                    "div",
                    {
                      className: "grid grid-cols-[150px_1fr] gap-3 items-baseline",
                      children: [
                        /* @__PURE__ */ t("span", { className: "font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400", children: o.label }),
                        /* @__PURE__ */ t("span", { className: "text-slate-800 dark:text-slate-100", children: st(o.value) })
                      ]
                    },
                    `${o.label}-${p}`
                  )) })
                ] })
              ] }),
              c.length > 0 && /* @__PURE__ */ i("section", { className: "pt-5", children: [
                /* @__PURE__ */ t(le, { children: "Splat Data Provenance" }),
                /* @__PURE__ */ t("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: c.map((o) => /* @__PURE__ */ i(
                  "div",
                  {
                    className: "rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5",
                    children: [
                      /* @__PURE__ */ t("div", { className: "text-xs font-semibold text-slate-900 dark:text-white mb-2", children: o.name }),
                      /* @__PURE__ */ t("div", { className: "flex flex-wrap gap-1.5 mb-2", children: (o.statuses || []).map((p) => /* @__PURE__ */ t(
                        "span",
                        {
                          className: `inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider ${Ds[p] || Ls}`,
                          children: p
                        },
                        p
                      )) }),
                      o.notes && /* @__PURE__ */ t("p", { className: "text-xs text-slate-600 dark:text-slate-300 leading-relaxed", children: o.notes })
                    ]
                  },
                  o.name
                )) })
              ] }),
              s.assessment && s.assessment.length > 0 && /* @__PURE__ */ i("section", { className: "pt-5", children: [
                /* @__PURE__ */ t(le, { children: "Assessment" }),
                /* @__PURE__ */ t(Ee, { fields: s.assessment })
              ] }),
              s.labNotes && /* @__PURE__ */ i("section", { className: "pt-5", children: [
                /* @__PURE__ */ t(le, { children: "Post-Processing Lab Notes" }),
                /* @__PURE__ */ t("p", { className: "text-xs text-slate-700 dark:text-slate-200 leading-relaxed", children: s.labNotes })
              ] }),
              s.captureTolerances && s.captureTolerances.length > 0 && /* @__PURE__ */ i("section", { className: "pt-5", children: [
                /* @__PURE__ */ t(le, { children: "Capture Tolerances & Equipment" }),
                /* @__PURE__ */ t(Ee, { fields: s.captureTolerances })
              ] }),
              s.acquisitionChunks && s.acquisitionChunks.length > 0 && /* @__PURE__ */ i("section", { className: "pt-5", children: [
                /* @__PURE__ */ t(le, { children: "Acquisition, By Chunk" }),
                /* @__PURE__ */ t("div", { className: "overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800", children: /* @__PURE__ */ i("table", { className: "w-full text-left text-xs", children: [
                  /* @__PURE__ */ t("thead", { className: "bg-slate-100/80 dark:bg-slate-800/70 font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400", children: /* @__PURE__ */ i("tr", { children: [
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Chunk" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Exposure" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Optics & Focus" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Rotational Steps" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2 text-right", children: "Images" })
                  ] }) }),
                  /* @__PURE__ */ t("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: s.acquisitionChunks.map((o, p) => /* @__PURE__ */ i(
                    "tr",
                    {
                      className: "hover:bg-slate-50 dark:hover:bg-slate-800/30",
                      children: [
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 font-medium text-slate-900 dark:text-slate-100", children: o.chunk }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-slate-700 dark:text-slate-300", children: o.exposure ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-slate-700 dark:text-slate-300", children: o.opticsAndFocus ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-slate-700 dark:text-slate-300", children: o.rotationalSteps ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300", children: o.images ?? "—" })
                      ]
                    },
                    `${o.chunk}-${p}`
                  )) })
                ] }) })
              ] }),
              u && /* @__PURE__ */ i("section", { className: "pt-5", children: [
                /* @__PURE__ */ t(le, { children: "Processing & Derived Assets" }),
                s.derivedAssets.software && /* @__PURE__ */ t("div", { className: "mb-3", children: /* @__PURE__ */ t(
                  Ee,
                  {
                    fields: [
                      {
                        label: "Software",
                        value: s.derivedAssets.software
                      }
                    ]
                  }
                ) }),
                s.derivedAssets.assets && s.derivedAssets.assets.length > 0 && /* @__PURE__ */ t("div", { className: "overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800", children: /* @__PURE__ */ i("table", { className: "w-full text-left text-xs", children: [
                  /* @__PURE__ */ t("thead", { className: "bg-slate-100/80 dark:bg-slate-800/70 font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400", children: /* @__PURE__ */ i("tr", { children: [
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Asset" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2 text-right", children: "Splats" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "SH Bands" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Training" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Alignment" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2 text-right", children: "Tie Points" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Filename" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2", children: "Format" }),
                    /* @__PURE__ */ t("th", { className: "px-3 py-2 text-right", children: "Size" })
                  ] }) }),
                  /* @__PURE__ */ t("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: s.derivedAssets.assets.map((o, p) => /* @__PURE__ */ i(
                    "tr",
                    {
                      className: "hover:bg-slate-50 dark:hover:bg-slate-800/30",
                      children: [
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 font-medium text-slate-900 dark:text-slate-100", children: o.asset }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300", children: o.splats ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-slate-700 dark:text-slate-300", children: o.shBands ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-slate-700 dark:text-slate-300", children: o.training ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-slate-700 dark:text-slate-300", children: o.alignment ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300", children: o.tiePoints ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 font-mono text-indigo-600 dark:text-indigo-400", children: o.downloadUrl && o.filename ? /* @__PURE__ */ t(
                          "a",
                          {
                            href: o.downloadUrl,
                            className: "underline hover:no-underline",
                            children: o.filename
                          }
                        ) : o.filename ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-slate-700 dark:text-slate-300", children: o.format ?? "—" }),
                        /* @__PURE__ */ t("td", { className: "px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300", children: o.size ?? "—" })
                      ]
                    },
                    `${o.asset}-${p}`
                  )) })
                ] }) })
              ] }),
              (x = s.extraSections) == null ? void 0 : x.map((o, p) => /* @__PURE__ */ i("section", { className: "pt-5", children: [
                /* @__PURE__ */ t(le, { children: o.title }),
                o.fields && o.fields.length > 0 && /* @__PURE__ */ t(Ee, { fields: o.fields }),
                o.notes && /* @__PURE__ */ t("p", { className: "mt-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed", children: o.notes })
              ] }, `${o.title}-${p}`))
            ] })
          ]
        }
      )
    }
  );
}
const Os = { mm: 1, cm: 10, in: 25.4 };
function et(a, e, s) {
  if (!(e > 0)) return `${a.toFixed(3)} u`;
  const r = a * e;
  return s === "in" ? `${(r / 25.4).toFixed(2)} in` : s === "cm" ? `${(r / 10).toFixed(2)} cm` : r >= 1e3 ? `${(r / 1e3).toFixed(3)} m` : `${r.toFixed(1)} mm`;
}
function H({ label: a, children: e }) {
  return /* @__PURE__ */ i("div", { className: "flex justify-between gap-3", children: [
    /* @__PURE__ */ t("dt", { className: "text-slate-500 shrink-0", children: a }),
    /* @__PURE__ */ t("dd", { className: "font-mono text-slate-900 dark:text-slate-200 text-right truncate", children: e })
  ] });
}
function pe({ keys: a, children: e }) {
  return /* @__PURE__ */ i("div", { children: [
    /* @__PURE__ */ t("kbd", { className: "px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-transparent rounded font-mono", children: a }),
    " ",
    e
  ] });
}
function zs({
  isOpen: a,
  onClose: e,
  stats: s,
  fileBytes: r,
  mmPerUnit: n,
  measureUnit: h = "mm",
  fileName: c,
  splatUrl: y,
  opacity: u,
  maxSh: m
}) {
  var z;
  if (!a) return null;
  const w = n > 0, x = s == null ? void 0 : s.size, o = !!x && x.x + x.y + x.z > 0, p = (z = (y || "").split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)) == null ? void 0 : z[1], L = o ? x.x * x.y * x.z : 0, k = L > 0 && (s != null && s.splatCount) ? s.splatCount / L : 0, F = w ? n / (Os[h] || 1) : 1, b = k / F ** 3;
  return /* @__PURE__ */ i(
    "aside",
    {
      "aria-label": "Splat telemetry",
      className: "absolute top-28 sm:top-16 right-3 sm:right-4 z-30 w-80 max-w-[calc(100vw-1.5rem)] bg-white/95 text-slate-700 border-slate-200/90 dark:bg-slate-900/95 dark:text-slate-300 dark:border-slate-800/90 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl space-y-4",
      children: [
        /* @__PURE__ */ i("div", { className: "flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ t("h2", { className: "text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100", children: "Splat Telemetry" }),
          /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              "aria-label": "Close telemetry drawer",
              onClick: e,
              className: "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 text-sm p-1",
              children: /* @__PURE__ */ t("span", { "aria-hidden": "true", children: "✕" })
            }
          )
        ] }),
        /* @__PURE__ */ i("dl", { className: "space-y-2 text-xs", children: [
          /* @__PURE__ */ t(H, { label: "Splats", children: ((s == null ? void 0 : s.splatCount) ?? 0).toLocaleString() }),
          /* @__PURE__ */ t(H, { label: "Streaming", children: s != null && s.paged ? "Paged LoD" : "Fully loaded" }),
          p && /* @__PURE__ */ i(H, { label: "Format", children: [
            ".",
            p.toLowerCase()
          ] }),
          c && /* @__PURE__ */ t(H, { label: "Source File", children: c }),
          Rt(r) && /* @__PURE__ */ t(H, { label: "File Size", children: Rt(r) }),
          /* @__PURE__ */ t(H, { label: "Scale Status", children: w ? "Calibrated" : "Unscaled (scene units)" }),
          o && /* @__PURE__ */ i(qt, { children: [
            /* @__PURE__ */ t(H, { label: "Width (X)", children: et(x.x, n, h) }),
            /* @__PURE__ */ t(H, { label: "Height (Y)", children: et(x.y, n, h) }),
            /* @__PURE__ */ t(H, { label: "Depth (Z)", children: et(x.z, n, h) })
          ] }),
          k > 0 && /* @__PURE__ */ i(H, { label: "Density", children: [
            Math.round(b).toLocaleString(),
            " / ",
            w ? `${h}³` : "u³"
          ] }),
          /* @__PURE__ */ t(H, { label: "SH Bands", children: m }),
          /* @__PURE__ */ i(H, { label: "Opacity", children: [
            Math.round(u * 100),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ i("div", { className: "pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 grid grid-cols-2 gap-1.5", children: [
          /* @__PURE__ */ t(pe, { keys: "F", children: "Iso View" }),
          /* @__PURE__ */ t(pe, { keys: "G", children: "Grid" }),
          /* @__PURE__ */ t(pe, { keys: "B", children: "Bounds" }),
          /* @__PURE__ */ t(pe, { keys: "R", children: "Rotate" }),
          /* @__PURE__ */ t(pe, { keys: "[ / ]", children: "Viewpoints" }),
          /* @__PURE__ */ t(pe, { keys: "I", children: "Telemetry" })
        ] })
      ]
    }
  );
}
const Bs = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1e3, 2e3, 5e3], Is = [0.05, 0.1, 0.25, 0.5, 1, 2, 4, 6, 12, 24, 36, 60];
function Fs(a, e) {
  return a === 0 || Math.abs(e - a) > e * 1e-3;
}
function $s(a, e = "mm") {
  if (!Number.isFinite(a) || a <= 0) return null;
  const s = e === "in", r = s ? a * 25.4 : a, n = 116 / r, h = s ? Is : Bs, c = n >= h[h.length - 1] ? h[h.length - 1] : h.reduce(
    (m, w) => Math.abs(w - n) < Math.abs(m - n) ? w : m
  ), y = c * r;
  let u;
  return s ? u = c >= 12 && c % 12 === 0 ? `${c / 12} ft` : `${c} in` : c >= 1e3 ? u = `${c / 1e3} m` : e === "cm" && c >= 1 ? u = `${c / 10} cm` : u = `${c} mm`, { widthPx: y, label: u };
}
const tt = [
  { id: "battery", label: "AA Cell", widthMm: 50.5, heightMm: 14.5, detail: "50.5 × 14.5 mm" },
  { id: "ball", label: "Tennis Ball", widthMm: 67, heightMm: 67, detail: "Ø 67 mm" },
  { id: "can", label: "330ml Can", widthMm: 66, heightMm: 115, detail: "66 × 115 mm" },
  { id: "a4", label: "A4 Sheet", widthMm: 210, heightMm: 297, detail: "210 × 297 mm" }
];
function Hs({
  pixelsPerMm: a,
  isUnscaled: e,
  measureUnit: s = "mm",
  allowReferenceToggle: r = !0
}) {
  const [n, h] = N(!1), [c, y] = N("battery"), u = $s(a, s);
  if (e || !u)
    return null;
  const { widthPx: m, label: w } = u, x = tt.find((k) => k.id === c) || tt[0], o = x.widthMm * a, p = x.heightMm * a, L = o >= 14 && o <= 260 && p <= 220;
  return /* @__PURE__ */ i(
    "div",
    {
      role: "region",
      "aria-label": "Physical scale and reference object overlay",
      className: "pointer-events-auto inline-flex flex-col gap-2 bg-white/90 text-slate-800 border-slate-200/90 dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-800/80 backdrop-blur-md border rounded-xl px-3 py-2 shadow-2xl select-none transition-all",
      children: [
        r && n && /* @__PURE__ */ i("div", { className: "flex flex-col gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/80", children: [
          /* @__PURE__ */ t(
            "div",
            {
              role: "group",
              "aria-label": "Select physical reference object",
              className: "flex items-center gap-1 bg-slate-100/90 border-slate-200/80 dark:bg-slate-950/70 dark:border-slate-800/70 p-0.5 rounded-lg border",
              children: tt.map((k) => /* @__PURE__ */ t(
                "button",
                {
                  type: "button",
                  "aria-pressed": c === k.id,
                  onClick: () => y(k.id),
                  className: `px-1.5 py-0.5 rounded-md text-[10px] font-mono transition ${c === k.id ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}`,
                  children: k.label
                },
                k.id
              ))
            }
          ),
          /* @__PURE__ */ i("div", { className: "flex items-center justify-between gap-3 text-[10px] font-mono", children: [
            /* @__PURE__ */ t("span", { className: "font-semibold text-slate-700 dark:text-slate-200", children: x.label }),
            /* @__PURE__ */ t("span", { className: "text-amber-600 dark:text-amber-400 font-bold", children: x.detail })
          ] }),
          L ? /* @__PURE__ */ i("div", { className: "flex items-center justify-start py-0.5", children: [
            c === "battery" && /* @__PURE__ */ i(
              "svg",
              {
                width: o,
                height: p,
                viewBox: "0 0 101 29",
                "aria-hidden": "true",
                className: "shrink-0 drop-shadow-xs",
                children: [
                  /* @__PURE__ */ t(
                    "rect",
                    {
                      x: "1",
                      y: "2",
                      width: "93",
                      height: "25",
                      rx: "3",
                      className: "fill-amber-500/20 stroke-amber-600 dark:stroke-amber-400",
                      strokeWidth: "2"
                    }
                  ),
                  /* @__PURE__ */ t(
                    "rect",
                    {
                      x: "94",
                      y: "9",
                      width: "6",
                      height: "11",
                      rx: "1.5",
                      className: "fill-amber-600 dark:fill-amber-400"
                    }
                  ),
                  /* @__PURE__ */ t(
                    "line",
                    {
                      x1: "24",
                      y1: "2",
                      x2: "24",
                      y2: "27",
                      className: "stroke-amber-600/60 dark:stroke-amber-400/60",
                      strokeWidth: "1.5"
                    }
                  ),
                  /* @__PURE__ */ t(
                    "text",
                    {
                      x: "58",
                      y: "19",
                      textAnchor: "middle",
                      fontSize: "13",
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      className: "fill-slate-800 dark:fill-amber-300",
                      children: "AA"
                    }
                  )
                ]
              }
            ),
            c === "ball" && /* @__PURE__ */ i(
              "svg",
              {
                width: o,
                height: p,
                viewBox: "0 0 100 100",
                "aria-hidden": "true",
                className: "shrink-0 drop-shadow-xs",
                children: [
                  /* @__PURE__ */ t(
                    "circle",
                    {
                      cx: "50",
                      cy: "50",
                      r: "47",
                      className: "fill-amber-500/20 stroke-amber-600 dark:stroke-amber-400",
                      strokeWidth: "3"
                    }
                  ),
                  /* @__PURE__ */ t(
                    "path",
                    {
                      d: "M 18 16 C 42 40, 42 60, 18 84 M 82 16 C 58 40, 58 60, 82 84",
                      fill: "none",
                      className: "stroke-amber-600/70 dark:stroke-amber-300/70",
                      strokeWidth: "2.5"
                    }
                  )
                ]
              }
            ),
            c === "can" && /* @__PURE__ */ i(
              "svg",
              {
                width: o,
                height: p,
                viewBox: "0 0 66 115",
                "aria-hidden": "true",
                className: "shrink-0 drop-shadow-xs",
                children: [
                  /* @__PURE__ */ t(
                    "path",
                    {
                      d: "M 6 2 L 60 2 L 64 11 L 64 104 L 58 113 L 8 113 L 2 104 L 2 11 Z",
                      className: "fill-amber-500/20 stroke-amber-600 dark:stroke-amber-400",
                      strokeWidth: "2"
                    }
                  ),
                  /* @__PURE__ */ t(
                    "line",
                    {
                      x1: "2",
                      y1: "11",
                      x2: "64",
                      y2: "11",
                      className: "stroke-amber-600/60 dark:stroke-amber-400/60",
                      strokeWidth: "1.5"
                    }
                  ),
                  /* @__PURE__ */ t(
                    "line",
                    {
                      x1: "2",
                      y1: "104",
                      x2: "64",
                      y2: "104",
                      className: "stroke-amber-600/60 dark:stroke-amber-400/60",
                      strokeWidth: "1.5"
                    }
                  )
                ]
              }
            ),
            c === "a4" && /* @__PURE__ */ i(
              "svg",
              {
                width: o,
                height: p,
                viewBox: "0 0 210 297",
                "aria-hidden": "true",
                className: "shrink-0 drop-shadow-xs",
                children: [
                  /* @__PURE__ */ t(
                    "polygon",
                    {
                      points: "2,2 168,2 208,42 208,295 2,295",
                      className: "fill-amber-500/15 stroke-amber-600 dark:stroke-amber-400",
                      strokeWidth: "3"
                    }
                  ),
                  /* @__PURE__ */ t(
                    "polyline",
                    {
                      points: "168,2 168,42 208,42",
                      fill: "none",
                      className: "stroke-amber-600 dark:stroke-amber-400",
                      strokeWidth: "3"
                    }
                  ),
                  /* @__PURE__ */ t(
                    "text",
                    {
                      x: "105",
                      y: "165",
                      textAnchor: "middle",
                      fontSize: "44",
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      className: "fill-slate-800 dark:fill-amber-300",
                      children: "A4"
                    }
                  )
                ]
              }
            )
          ] }) : /* @__PURE__ */ t("span", { className: "text-[10px] font-mono text-slate-500 dark:text-slate-400 py-1", children: o > 260 || p > 220 ? "Zoom out or pick a smaller object" : "Zoom in or pick a larger object" })
        ] }),
        /* @__PURE__ */ i("div", { className: "flex items-center gap-2.5", children: [
          m >= 32 && m <= 260 ? /* @__PURE__ */ i("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ i(
              "div",
              {
                style: { width: `${m}px` },
                className: "flex items-center justify-between text-[10px] font-mono font-semibold leading-none",
                children: [
                  /* @__PURE__ */ t("span", { className: "text-slate-400 dark:text-slate-500", children: "0" }),
                  /* @__PURE__ */ t("span", { className: "text-amber-600 dark:text-amber-400 font-bold", children: w })
                ]
              }
            ),
            /* @__PURE__ */ i(
              "div",
              {
                style: { width: `${m}px` },
                className: "h-2.5 w-full grid grid-cols-4 rounded-[2px] overflow-hidden border border-slate-900/80 dark:border-slate-300/80 shadow-inner",
                children: [
                  /* @__PURE__ */ t("div", { className: "bg-slate-900 dark:bg-amber-400" }),
                  /* @__PURE__ */ t("div", { className: "bg-white dark:bg-slate-950" }),
                  /* @__PURE__ */ t("div", { className: "bg-slate-900 dark:bg-amber-400" }),
                  /* @__PURE__ */ t("div", { className: "bg-white dark:bg-slate-950" })
                ]
              }
            )
          ] }) : /* @__PURE__ */ t("span", { className: "text-[10px] font-mono text-slate-500 dark:text-slate-400", children: "Zoom for scale" }),
          r && /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              onClick: () => h((k) => !k),
              "aria-expanded": n,
              "aria-label": n ? "Hide reference object comparison" : "Compare against real-world reference objects",
              title: n ? "Hide Reference Objects" : "Compare Size (AA Cell, Tennis Ball, Can, A4)",
              className: `p-1 rounded-lg border transition shrink-0 ${n ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700/70"}`,
              children: /* @__PURE__ */ t(
                "svg",
                {
                  "aria-hidden": "true",
                  className: `w-3.5 h-3.5 transition-transform duration-150 ${n ? "rotate-180" : ""}`,
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ t("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 15l7-7 7 7" })
                }
              )
            }
          )
        ] })
      ]
    }
  );
}
function Gs({
  splatUrl: a,
  fileName: e = "splat",
  title: s = "Gaussian Splat",
  subtitle: r = "",
  badge: n = "SPLAT",
  backUrl: h = null,
  paged: c = void 0,
  flipY: y = !0,
  viewpoints: u = [],
  enableDeepLink: m = !0,
  enableExport: w = !0,
  paradata: x = null,
  showParadata: o = !0,
  showThemeToggle: p = !0,
  enableFullscreen: L = !0,
  initialTheme: k = "dark",
  initialBackground: F = "#090d16",
  persistBackground: b = !0,
  mmPerUnit: z = null,
  measureUnit: Q = "mm",
  showScaleBar: j = !0,
  showTelemetry: J = !0,
  enableLocalFiles: Z = !0,
  onLoad: W = null,
  onError: G = null,
  children: fe = null
}) {
  const U = C(null), Te = C(null), he = C(null), de = C(null), xe = C(null), re = C(null), me = C(new P.Group()), B = C(null), $ = C(null), X = C(null), oe = C(null), ge = C(null), rt = C({ center: new P.Vector3(), size: new P.Vector3(1, 1, 1) }), ye = C({ onLoad: W, onError: G, enableDeepLink: m });
  ye.current = { onLoad: W, onError: G, enableDeepLink: m };
  const [ot, jt] = N(k), [ce, Ie] = N(
    () => (b ? vs() : null) || (k === "light" && F === "#090d16" ? "#f1f5f9" : F)
  ), [ke, nt] = N(!1), [_e, it] = N(!1), [Fe, lt] = N(!1), [ee, dt] = N(1), [te, ct] = N(3), [Me, $e] = N(-1), [Ot, ht] = N(!1), [zt, Bt] = N(!1), [R, It] = N(null), [Ft, He] = N(!1), mt = C(null), [We, Ce] = N(null), [Pe, Ve] = N(!1), [pt, Re] = N(!1), [ut, bt] = N(null), [we, Ae] = N(!0), [Ye, ft] = N(null), [Ne, Ke] = N(!1), [$t, xt] = N(0), [Ze, Ht] = N({ splatCount: 0, paged: !1, size: null }), [Wt, Vt] = N(0), Ge = C(0), gt = C(z);
  gt.current = z;
  const yt = C({ opacity: ee, maxSh: te, showGrid: ke, showBounds: _e });
  yt.current = { opacity: ee, maxSh: te, showGrid: ke, showBounds: _e };
  const ve = K((l) => {
    bt(l), ge.current && clearTimeout(ge.current), ge.current = setTimeout(() => {
      bt((d) => d === l ? null : d);
    }, 2600);
  }, []);
  I(() => {
    if (Ce(null), R) {
      Ce(R.size);
      return;
    }
    if (!a) return;
    const l = new AbortController();
    return fetch(a, { method: "HEAD", signal: l.signal }).then((d) => {
      const f = Number(d.headers.get("content-length"));
      d.ok && f > 0 && Ce(f);
    }).catch(() => {
    }), () => l.abort();
  }, [a, R]), I(() => {
    if (!(we || We || !a || R))
      try {
        const l = new URL(a, window.location.href).href, d = performance.getEntriesByName(l).pop(), f = (d == null ? void 0 : d.decodedBodySize) || (d == null ? void 0 : d.encodedBodySize) || 0;
        f > 0 && Ce(f);
      } catch {
      }
  }, [we, We, a, R]);
  const kt = K((l) => {
    l && (It(l), window.history.replaceState(null, "", window.location.pathname + window.location.search));
  }, []);
  I(() => () => {
    ge.current && clearTimeout(ge.current);
  }, []);
  const Yt = K(() => {
    jt((l) => {
      const d = l === "dark" ? "light" : "dark";
      return Ie((f) => d === "light" && f === "#090d16" ? "#f1f5f9" : d === "dark" && f === "#f1f5f9" ? "#090d16" : f), d;
    });
  }, []), Se = K((l = "iso") => {
    const d = de.current, f = re.current;
    if (!d || !f) return;
    oe.current = null, $e(-1);
    const { center: v, size: S } = rt.current, E = Math.max(S.x, S.y, S.z, 0.1), T = P.MathUtils.degToRad(d.fov), se = Math.abs(E / 2 / Math.tan(T / 2)) * 1.45, ae = v.clone();
    switch (l) {
      case "front":
        ae.z += se;
        break;
      case "top":
        ae.y += se, ae.z += 1e-3;
        break;
      case "side":
        ae.x += se;
        break;
      case "iso":
      default:
        ae.set(v.x + se * 0.45, v.y + se * 0.3, v.z + se * 0.85);
        break;
    }
    d.position.copy(ae), f.target.copy(v), f.update();
  }, []), Ue = K(
    (l) => {
      if (!Array.isArray(u) || !u[l]) return;
      const d = de.current, f = re.current, v = u[l];
      if ($e(l), d && f && Array.isArray(v.position) && v.position.length === 3) {
        const S = Array.isArray(v.target) && v.target.length === 3 ? new P.Vector3(...v.target) : f.target.clone();
        oe.current = {
          targetPos: new P.Vector3(...v.position),
          targetLook: S,
          alpha: 0
        };
      }
    },
    [u]
  ), De = K(
    (l) => {
      if (!Array.isArray(u) || u.length === 0) return;
      const d = Me < 0 ? l < 0 ? u.length - 1 : 0 : (Me + l + u.length) % u.length;
      Ue(d);
    },
    [u, Me, Ue]
  ), Kt = K(async () => {
    var S;
    const l = de.current, d = re.current;
    if (!l || !d) return;
    const f = ws(l, d, { opacity: ee, maxSh: te, bg: ce }), v = `${window.location.origin}${window.location.pathname}${window.location.search}#view=${f}`;
    window.history.replaceState(null, "", `#view=${f}`);
    try {
      if (!((S = navigator.clipboard) != null && S.writeText))
        throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(v), ve("View link copied");
    } catch (E) {
      console.error("Failed to copy view link:", E), ve("Could not copy link; view link is in the address bar");
    }
  }, [ee, te, ce, ve]), Zt = K(() => {
    const l = xe.current, d = he.current, f = de.current;
    !l || !d || !f || Ne || (l.render(d, f), l.domElement.toBlob((v) => {
      if (!v) return;
      const S = String((R == null ? void 0 : R.name) || e || "splat").replace(/\.[^/.]+$/, "");
      ks(v, `${S}_splat.png`), ve("Snapshot saved");
    }));
  }, [e, R, Ne, ve]), Gt = K(() => {
    if (!a || R) return;
    const l = document.createElement("a");
    l.href = a;
    const d = String(e || "splat").split("/").pop() || "splat.ply";
    l.download = d, document.body.appendChild(l), l.click(), l.remove();
  }, [a, R, e]), Ut = K(() => {
    U.current && (document.fullscreenElement ? document.exitFullscreen().catch((l) => console.error(l)) : U.current.requestFullscreen().catch((l) => console.error(l)));
  }, []);
  return I(() => {
    const l = () => Bt(!!document.fullscreenElement);
    return document.addEventListener("fullscreenchange", l), () => document.removeEventListener("fullscreenchange", l);
  }, []), I(() => {
    const l = (d) => {
      var v, S;
      if (Pe) return;
      const f = (v = d.target) == null ? void 0 : v.tagName;
      f === "INPUT" || f === "TEXTAREA" || f === "SELECT" || (S = d.target) != null && S.isContentEditable || d.metaKey || d.ctrlKey || d.altKey || (d.key === "f" || d.key === "F" ? Se("iso") : d.key === "g" || d.key === "G" ? nt((E) => !E) : d.key === "b" || d.key === "B" ? it((E) => !E) : d.key === "r" || d.key === "R" ? lt((E) => !E) : d.key === "i" || d.key === "I" ? Re((E) => !E) : d.key === "Escape" ? Re(!1) : d.key === "[" ? De(-1) : d.key === "]" && De(1));
    };
    return window.addEventListener("keydown", l), () => window.removeEventListener("keydown", l);
  }, [Pe, Se, De]), I(() => {
    const l = Te.current, d = U.current || l;
    if (!l || !d) return;
    l.innerHTML = "";
    const f = d.clientWidth || 800, v = d.clientHeight || 600, S = new P.Scene();
    S.background = new P.Color(ce), he.current = S;
    const E = new P.PerspectiveCamera(45, f / v, 0.01, 2e3);
    E.position.set(0, 0.6, 2.5), de.current = E;
    const T = new P.WebGLRenderer({
      antialias: !1,
      alpha: !1,
      preserveDrawingBuffer: !0,
      powerPreference: "high-performance"
    });
    T.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)), T.setSize(f, v, !1), xe.current = T, T.domElement.style.width = "100%", T.domElement.style.height = "100%", T.domElement.style.display = "block", l.appendChild(T.domElement);
    const se = (g) => {
      g.preventDefault(), oe.current = null, Ke(!0);
    }, ae = () => {
      Ke(!1), xt((g) => g + 1);
    };
    T.domElement.addEventListener("webglcontextlost", se, !1), T.domElement.addEventListener("webglcontextrestored", ae, !1);
    const Xe = gs(T);
    S.add(Xe), S.add(me.current);
    const V = new os(E, T.domElement);
    V.enableDamping = !0, V.dampingFactor = 0.06, re.current = V;
    const _t = () => {
      oe.current = null;
    };
    V.addEventListener("start", _t);
    let Le = !1, je = null;
    Ae(!0), ft(null), Ke(!1), $e(-1), Ve(!1), ht(!1), oe.current = null;
    const wt = !!(a || R);
    wt || Ae(!1), (wt ? ys({
      url: a,
      file: R,
      parentGroup: me.current,
      paged: c,
      maxSh: te,
      opacity: ee,
      flipY: y,
      isCancelled: () => Le
    }) : Promise.resolve(null)).then((g) => {
      var ne, ie, qe, Oe;
      if (Le || !g) return;
      je = g.dispose, B.current = g.splatMesh;
      const M = yt.current;
      if (g.splatMesh.opacity = M.opacity, typeof g.splatMesh.maxSh == "number" && (g.splatMesh.maxSh = M.maxSh), Be($.current), Be(X.current), $.current && S.remove($.current), X.current && S.remove(X.current), !g.stats.box.isEmpty()) {
        rt.current = {
          center: g.stats.center,
          size: g.stats.size
        };
        const { grid: D, bbox: Qe } = _s({
          center: g.stats.center,
          size: g.stats.size,
          minY: g.stats.box.min.y
        });
        D.visible = M.showGrid, Qe.visible = M.showBounds, S.add(D), S.add(Qe), $.current = D, X.current = Qe;
      }
      if (Ht({
        splatCount: g.stats.splatCount,
        paged: g.stats.paged,
        size: g.stats.size.clone()
      }), Ae(!1), ye.current.enableDeepLink) {
        const D = Es(window.location.hash);
        if (D != null && D.p && (D != null && D.t)) {
          E.position.fromArray(D.p), V.target.fromArray(D.t), V.update(), typeof D.opacity == "number" && dt(D.opacity), typeof D.maxSh == "number" && ct(D.maxSh), D.bg && Ie(D.bg), (ie = (ne = ye.current).onLoad) == null || ie.call(ne, g.stats);
          return;
        }
      }
      Se("iso"), (Oe = (qe = ye.current).onLoad) == null || Oe.call(qe, g.stats);
    }).catch((g) => {
      var M, ne;
      Le || (console.error("Failed to load Gaussian splat asset:", g), ft("Failed to load Gaussian splat asset. Check file path, format, or CORS headers."), Ae(!1), (ne = (M = ye.current).onError) == null || ne.call(M, g));
    });
    let Nt = 0, vt = 0;
    const St = (g = 0) => {
      if (Nt = requestAnimationFrame(St), g - vt > 65) {
        vt = g;
        const M = gt.current, ne = d.clientHeight;
        let ie = 0;
        if (M > 0 && ne > 0) {
          const Oe = 2 * E.position.distanceTo(V.target) * Math.tan(P.MathUtils.degToRad(E.fov) / 2);
          ie = ne / (Oe * M);
        }
        (ie === 0 ? Ge.current !== 0 : Fs(Ge.current, ie)) && (Ge.current = ie, Vt(ie));
      }
      if (oe.current) {
        const M = oe.current;
        M.alpha = Math.min(M.alpha + 0.08, 1), E.position.lerp(M.targetPos, M.alpha), V.target.lerp(M.targetLook, M.alpha), M.alpha >= 1 && (oe.current = null);
      }
      V.update(), T.render(S, E);
    };
    St();
    const Xt = () => {
      const g = d.clientWidth, M = d.clientHeight;
      g > 0 && M > 0 && (E.aspect = g / M, E.updateProjectionMatrix(), T.setSize(g, M, !1));
    }, Et = new ResizeObserver(Xt);
    return Et.observe(d), () => {
      Le = !0, cancelAnimationFrame(Nt), Et.disconnect(), V.removeEventListener("start", _t), V.dispose(), je == null || je(), Be($.current), Be(X.current), typeof Xe.dispose == "function" && Xe.dispose(), T.domElement.removeEventListener("webglcontextlost", se, !1), T.domElement.removeEventListener("webglcontextrestored", ae, !1), T.domElement.parentNode && T.domElement.parentNode.removeChild(T.domElement), T.dispose(), T.forceContextLoss();
    };
  }, [a, R, c, y, $t, Se]), I(() => {
    $.current && ($.current.visible = ke);
  }, [ke]), I(() => {
    X.current && (X.current.visible = _e);
  }, [_e]), I(() => {
    re.current && (re.current.autoRotate = Fe);
  }, [Fe]), I(() => {
    B.current && (B.current.opacity = ee);
  }, [ee]), I(() => {
    B.current && typeof B.current.maxSh == "number" && (B.current.maxSh = te);
  }, [te]), I(() => {
    he.current && (he.current.background = new P.Color(ce)), b && Ss(ce);
  }, [ce, b]), /* @__PURE__ */ i(
    "div",
    {
      ref: U,
      onDragOver: Z ? (l) => {
        var d, f;
        (f = (d = l.dataTransfer) == null ? void 0 : d.types) != null && f.includes("Files") && (l.preventDefault(), He(!0));
      } : void 0,
      onDragLeave: Z ? (l) => {
        l.currentTarget.contains(l.relatedTarget) || He(!1);
      } : void 0,
      onDrop: Z ? (l) => {
        var d, f;
        (f = (d = l.dataTransfer) == null ? void 0 : d.files) != null && f.length && (l.preventDefault(), He(!1), kt(l.dataTransfer.files[0]));
      } : void 0,
      className: `sv-root gmv-root relative w-full h-full font-sans select-none overflow-hidden bg-slate-100 dark:bg-slate-950 ${ot === "dark" ? "dark" : ""}`,
      children: [
        /* @__PURE__ */ t(
          "div",
          {
            ref: Te,
            role: "application",
            tabIndex: 0,
            "aria-label": "Interactive 3D Gaussian splat viewport",
            className: "w-full h-full focus:outline-hidden cursor-grab active:cursor-grabbing"
          }
        ),
        Z && /* @__PURE__ */ t(
          "input",
          {
            ref: mt,
            type: "file",
            accept: ".ply,.spz,.splat,.ksplat,.sog,.zip",
            "aria-label": "Open local splat file",
            className: "hidden",
            onChange: (l) => {
              var d;
              kt((d = l.target.files) == null ? void 0 : d[0]), l.target.value = "";
            }
          }
        ),
        Ft && /* @__PURE__ */ t("div", { className: "pointer-events-none absolute inset-3 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-amber-500 bg-amber-500/10 text-sm font-semibold text-amber-700 dark:text-amber-300", children: "Drop a splat file to open it" }),
        !a && !R && !we && /* @__PURE__ */ t("div", { className: "pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400", children: Z ? "Drop a .ply, .spz, .splat, .ksplat or .sog file here, or use the Open button." : "No splat source provided." }),
        ut && /* @__PURE__ */ t(
          "div",
          {
            role: "status",
            "aria-live": "polite",
            className: "pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-white/95 border-amber-500/50 text-amber-700 dark:bg-slate-800/95 dark:border-amber-500/40 dark:text-amber-300 border text-xs font-medium shadow-2xl",
            children: ut
          }
        ),
        Ne && /* @__PURE__ */ t(
          "div",
          {
            role: "alert",
            className: "absolute inset-0 z-40 flex items-center justify-center bg-slate-100/95 dark:bg-slate-950/95 p-6",
            children: /* @__PURE__ */ i("div", { className: "max-w-md bg-white border-amber-500/40 dark:bg-slate-900 dark:border-amber-500/40 border rounded-2xl p-5 text-center shadow-2xl space-y-3", children: [
              /* @__PURE__ */ t("p", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: "WebGL Graphics Context Lost" }),
              /* @__PURE__ */ t("p", { className: "text-xs text-slate-600 dark:text-slate-300", children: "The browser GPU context was interrupted (often due to splat memory pressure or display sleep)." }),
              /* @__PURE__ */ t(
                "button",
                {
                  type: "button",
                  onClick: () => xt((l) => l + 1),
                  className: "px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition",
                  children: "Reload Splat"
                }
              )
            ] })
          }
        ),
        we && !Ne && /* @__PURE__ */ i(
          "div",
          {
            role: "status",
            "aria-live": "polite",
            className: "absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-sm",
            children: [
              /* @__PURE__ */ t("div", { className: "w-40 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden mb-3", children: /* @__PURE__ */ t("div", { className: "h-full w-1/2 bg-amber-500 animate-pulse" }) }),
              /* @__PURE__ */ t("p", { className: "text-xs font-mono text-slate-700 dark:text-slate-300", children: "Loading Gaussian Splat..." })
            ]
          }
        ),
        Ye && !Ne && /* @__PURE__ */ t(
          "div",
          {
            role: "alert",
            className: "absolute inset-0 z-40 flex items-center justify-center bg-slate-100/95 dark:bg-slate-950/95 p-6",
            children: /* @__PURE__ */ i("div", { className: "max-w-md bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-500/40 border rounded-2xl p-5 text-center", children: [
              /* @__PURE__ */ t("p", { className: "text-sm font-semibold text-red-700 dark:text-red-300 mb-1", children: "Splat Load Error" }),
              /* @__PURE__ */ t("p", { className: "text-xs text-red-600 dark:text-red-200/80", children: Ye })
            ] })
          }
        ),
        /* @__PURE__ */ t(
          Ms,
          {
            title: s,
            subtitle: r,
            badge: n,
            backUrl: h,
            paradata: x,
            paradataOpen: Pe,
            showParadata: o,
            enableDeepLink: m,
            enableExport: w,
            showThemeToggle: p,
            enableFullscreen: L,
            downloadMenuOpen: Ot,
            setDownloadMenuOpen: ht,
            loading: we,
            error: Ye,
            isFullscreen: zt,
            theme: ot,
            onToggleTheme: Yt,
            onCopyShareLink: Kt,
            onDownloadOriginal: a && !R ? Gt : void 0,
            enableLocalFiles: Z,
            onOpenLocalFile: () => {
              var l;
              return (l = mt.current) == null ? void 0 : l.click();
            },
            onScreenshot: Zt,
            showTelemetry: J,
            telemetryOpen: pt,
            onToggleTelemetry: () => Re((l) => !l),
            onToggleParadata: () => Ve((l) => !l),
            onToggleFullscreen: Ut,
            children: fe
          }
        ),
        /* @__PURE__ */ i("div", { className: "pointer-events-none absolute inset-x-0 bottom-3 z-20 px-3 sm:px-4 flex flex-col gap-2", children: [
          /* @__PURE__ */ t(
            As,
            {
              viewpoints: u,
              activeIndex: Me,
              onSelectViewpoint: Ue,
              onStepViewpoint: De
            }
          ),
          j && /* @__PURE__ */ t("div", { className: "flex justify-start", children: /* @__PURE__ */ t(
            Hs,
            {
              pixelsPerMm: Wt,
              isUnscaled: !(z > 0),
              measureUnit: Q
            }
          ) }),
          /* @__PURE__ */ t(
            Rs,
            {
              splatCount: Ze.splatCount,
              paged: Ze.paged,
              showGrid: ke,
              setShowGrid: nt,
              showBounds: _e,
              setShowBounds: it,
              autoRotate: Fe,
              setAutoRotate: lt,
              opacity: ee,
              setOpacity: dt,
              maxSh: te,
              setMaxSh: ct,
              bgColor: ce,
              setBgColor: Ie,
              setCameraView: Se
            }
          )
        ] }),
        /* @__PURE__ */ t(
          zs,
          {
            isOpen: pt && J,
            onClose: () => Re(!1),
            stats: Ze,
            fileBytes: We,
            mmPerUnit: z,
            measureUnit: Q,
            fileName: (R == null ? void 0 : R.name) || (e !== "splat" ? e : null),
            splatUrl: R ? R.name : a,
            opacity: ee,
            maxSh: te
          }
        ),
        /* @__PURE__ */ t(
          js,
          {
            isOpen: Pe && !!x && o,
            onClose: () => Ve(!1),
            paradata: x
          }
        )
      ]
    }
  );
}
export {
  js as ParadataDrawer,
  Hs as ScaleBarOverlay,
  Gs as SplatViewer,
  gs as createSparkRenderer,
  Gs as default,
  ys as loadSplatAsset
};
