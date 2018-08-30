import { EventEmitter } from 'events';
import debug from 'debug';
import { spawn } from 'child_process';

const log = debug('docker-events');

class DockerEventEmitter extends EventEmitter {
  constructor() {
    super();

    this.cmd = null;
    this.data = '';
  }

  listen() {
    log('spawning docker events');

    this.cmd = spawn(
      'script -F | docker events --format \'{{json .}}\'',
      { shell: true },
    );

    this.cmd.stdout.setEncoding('utf8');

    this.cmd.on('error', (err) => {
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
      strings.forEach((str) => {
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
        log.error(err, data);
        /* no op */
      }
    }
  }
}

export default new DockerEventEmitter();
