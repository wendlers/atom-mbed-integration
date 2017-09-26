'use babel';

import fs from 'fs';
import path from 'path';
import {Emitter} from 'atom';


export default class MbedInstallerView {

  constructor(serializedState) {
    // Create root element
    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('mbed-integration-installer');

    this.element.innerHTML = fs.readFileSync(path.join(__dirname, './mbed-installer-view.html'));

    this.notePanel = this.element.querySelector('#mbed-installer-note-panel');
    this.notePanel.style.display = 'block';

    this.progressPanel = this.element.querySelector('#mbed-installer-progress-panel');
    this.progressPanel.style.display = 'none';

    this.note = this.element.querySelector('#mbed-installer-note');
    this.message = this.element.querySelector('#mbed-installer-message');

    this.buttonPanel1 = this.element.querySelector('#mbed-installer-buttons1');
    this.buttonPanel1.style.display = 'block';

    this.buttonPanel2 = this.element.querySelector('#mbed-installer-buttons2');
    this.buttonPanel2.style.display = 'none';

    this.installButton = this.element.querySelector('#mbed-installer-install');
    this.installButton.addEventListener('click', () => {
        this.emitter.emit('install');
    });

    this.closeButton = this.element.querySelector('#mbed-installer-close');
    this.closeButton.addEventListener('click', () => {
        this.emitter.emit('close');
    });

    this.restartButton = this.element.querySelector('#mbed-installer-restart');
    this.restartButton.addEventListener('click', () => {
        this.emitter.emit('restart');
    });
  }

  serialize() {}

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

  onRestart(callback) {
    this.emitter.on('restart', callback);
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

  setDone() {
    this.buttonPanel1.style.display = 'none';
    this.buttonPanel2.style.display = 'block';
  }

  setInstallMode(installing) {

    this.buttonPanel1.style.display = 'block';
    this.buttonPanel2.style.display = 'none';

    if(installing) {
      this.installButton.disabled = true;
      this.closeButton.innerHTML = 'cancel';
    }
    else {
      this.installButton.disabled = false;
      this.closeButton.innerHTML = 'close';
    }
  }
}
