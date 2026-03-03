/**
 * react-native node 테스트 환경에서 누락된 API 폴리필.
 * jest.config.js의 setupFiles에서 로드되어 모듈 초기화 전에 실행됩니다.
 */
const RN = require('react-native');

// useColorScheme이 없으면 추가
if (!RN.useColorScheme) {
  RN.useColorScheme = () => 'light';
}

// Animated가 불완전하면 최소 구현 제공
if (!RN.Animated || !RN.Animated.Value) {
  const AnimatedValue = function (val) {
    this._value = val;
    this.setValue = (v) => { this._value = v; };
    this.interpolate = (config) => this;
    this._startListening = () => {};
    this._stopListening = () => {};
    this.__attach = () => {};
    this.__detach = () => {};
    this.__getValue = () => this._value;
    this.__makeNative = () => {};
    this.__getNativeTag = () => 0;
    this.addListener = () => ({ remove: () => {} });
    this.removeAllListeners = () => {};
    this.stopAnimation = (cb) => cb && cb(this._value);
    this.resetAnimation = (cb) => cb && cb(this._value);
  };

  if (!RN.Animated) {
    RN.Animated = {};
  }

  if (!RN.Animated.Value) {
    RN.Animated.Value = AnimatedValue;
  }

  if (!RN.Animated.View) {
    RN.Animated.View = RN.View || 'View';
  }

  if (!RN.Animated.Text) {
    RN.Animated.Text = RN.Text || 'Text';
  }

  if (!RN.Animated.timing) {
    RN.Animated.timing = (value, config) => ({
      start: (cb) => {
        if (config && config.toValue !== undefined) {
          value.setValue(config.toValue);
        }
        cb && cb({ finished: true });
      },
      stop: () => {},
    });
  }

  if (!RN.Animated.spring) {
    RN.Animated.spring = (value, config) => ({
      start: (cb) => {
        if (config && config.toValue !== undefined) {
          value.setValue(config.toValue);
        }
        cb && cb({ finished: true });
      },
      stop: () => {},
    });
  }

  if (!RN.Animated.sequence) {
    RN.Animated.sequence = (anims) => ({
      start: (cb) => {
        anims.forEach((a) => a.start && a.start());
        cb && cb({ finished: true });
      },
      stop: () => {},
    });
  }

  if (!RN.Animated.parallel) {
    RN.Animated.parallel = (anims) => ({
      start: (cb) => {
        anims.forEach((a) => a.start && a.start());
        cb && cb({ finished: true });
      },
      stop: () => {},
    });
  }

  if (!RN.Animated.loop) {
    RN.Animated.loop = (anim) => ({
      start: (cb) => { cb && cb({ finished: true }); },
      stop: () => {},
    });
  }

  if (!RN.Animated.multiply) {
    RN.Animated.multiply = (a, b) => a;
  }
}
