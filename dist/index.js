'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug2.default)('docker-events');

class DockerEventEmitter extends _events.EventEmitter {
  constructor() {
    super();

    this.cmd = null;
    this.data = '';
  }

  emit(type, ...args) {
    super.emit('*', ...args);
    return super.emit(type, ...args) || super.emit('', ...args);
  }

  listen() {
    log('spawning docker events');

    this.cmd = (0, _child_process.spawn)('script -F | docker events --format \'{{json .}}\'', { shell: true });

    this.cmd.stdout.setEncoding('utf8');

    this.cmd.on('error', err => {
      log(`failed to start command, error: ${err}`);
      this.emit('error', err);
    });

    this.cmd.stdout.on('data', data => this._tryParseStdoutData(data));
  }

  _tryParseStdoutData(data) {
    if (!data) return;
    /* If there is a newline, assume this is multiple JSON lines,
    separate them, and try to parse them individually
    */
    const strings = data.split(/\n/);
    if (strings.length > 1) {
      strings.forEach(str => {
        this._tryParseStdoutData(str);
      });
    } else {
      this.data = `${this.data}${data.toString()}`;
      try {
        const json = JSON.parse(this.data);
        this.data = '';
        const eventType = json.Action;

        log('emitting docker-event %j', json);
        this.emit(eventType, json);
      } catch (err) {
        log(err, data);
        /* no op */
      }
    }
  }
}

exports.default = new DockerEventEmitter();