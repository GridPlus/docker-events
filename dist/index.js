"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }// src/index.ts
var _fs = require('fs');
var _events = require('events');
var _child_process = require('child_process');
var _debug = require('debug'); var _debug2 = _interopRequireDefault(_debug);
var log = _debug2.default.call(void 0, "docker-events");
var DockerEventEmitter = class extends _events.EventEmitter {
  constructor() {
    super();
    this.cmd = null;
    this.data = "";
  }
  emit(type, ...args) {
    super.emit("*", ...args);
    return super.emit(type, ...args) || super.emit("", ...args);
  }
  cleanup() {
    if (this.cmd) {
      if (this.cmd.killed)
        return;
      this.cmd.kill();
    }
  }
  listen() {
    this.cleanup();
    if (!this.watcher) {
      this.watcher = _fs.watch.call(void 0, "/var/run", (event, filename) => {
        if (event !== "rename")
          return;
        if (filename !== "docker.sock" && filename !== "dockerd.pid")
          return;
        if (this.lastSeen === "docker.sock" && filename === "dockerd.pid") {
          this.cleanup();
        }
        if (this.lastSeen === "dockerd.pid" && filename === "docker.sock") {
          this.listen();
        }
        this.lastSeen = filename;
      });
    }
    log("spawning docker events");
    this.cmd = _child_process.spawn.call(void 0, "docker events --format '{{json .}}'", { shell: true });
    process.on("exit", () => {
      this.cmd.kill();
    });
    this.cmd.stdout.setEncoding("utf8");
    this.cmd.on("error", (error) => {
      log("failed to start command, error: %s", error);
      this.emit("error", error);
    });
    this.cmd.stdout.on("data", (data) => this._tryParseStdoutData(data));
  }
  _tryParseStdoutData(data) {
    if (!data)
      return;
    const strings = data.split(/\n/);
    if (strings.length > 1) {
      strings.forEach((str) => {
        this._tryParseStdoutData(str);
      });
    } else {
      this.data = `${this.data}${data.toString()}`;
      try {
        const json = JSON.parse(this.data);
        this.data = "";
        const eventType = json.Action;
        log("emitting docker-event %j", json);
        this.emit(eventType, json);
      } catch (err) {
        log(err, data);
      }
    }
  }
};
var src_default = new DockerEventEmitter();


exports.default = src_default;
