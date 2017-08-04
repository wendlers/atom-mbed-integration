'use babel';

import fs from 'fs';
import path from 'path';
import {Emitter} from 'atom';


export default class MbedInstallerView {

  constructor(serializedState) {
    // Create root element
    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('mbed-integration');

    this.element.innerHTML = fs.readFileSync(path.join(__dirname, './mbed-installer-view.html'));

    this.notePanel = this.element.querySelector('#mbed-installer-note-panel');
    this.notePanel.style.display = 'block';

    this.progressPanel = this.element.querySelector('#mbed-installer-progress-panel');
    this.progressPanel.style.display = 'none';

    this.note = this.element.querySelector('#mbed-installer-note');
    this.message = this.element.querySelector('#mbed-installer-message');

    this.element.querySelector('#mbed-installer-install').addEventListener('click', () => {
        this.emitter.emit('install');
    });

    this.element.querySelector('#mbed-installer-close').addEventListener('click', () => {
        this.emitter.emit('close');
    });
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  onInstall(callback) {
    this.emitter.on('install', callback);
  }

  onClose(callback) {
    this.emitter.on('close', callback);
  }

  updateNote(note) {
    this.note.innerHTML = '<div>' + note + '</div>';
    this.notePanel.style.display = 'block';
    this.progressPanel.style.display = 'none';
  }

  updateMessage(message) {
    this.message.innerHTML = '<div>' + message + '</div>';
    this.notePanel.style.display = 'none';
    this.progressPanel.style.display = 'block';
  }
}
