'use babel';

import fs from 'fs';
import path from 'path';
import {Emitter} from 'atom';


export default class MbedNewPrjView {

  constructor(serializedState) {
    // Create root element
    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('mbed-integration');

    this.element.innerHTML = fs.readFileSync(path.join(__dirname, './mbed-newprj-view.html'));

    this.settingsPanel = this.element.querySelector('#mbed-newprj-settings-panel');
    this.settingsPanel.style.display = 'block';

    this.progressPanel = this.element.querySelector('#mbed-newprj-progress-panel');
    this.progressPanel.style.display = 'none';
    this.message = this.element.querySelector('#mbed-newprj-message');

    this.errorPanel = this.element.querySelector('#mbed-newprj-error-panel');
    this.errorPanel.style.display = 'none';
    this.error = this.element.querySelector('#mbed-newprj-error');

    this.newPrjDir = this.element.querySelector('#mbed-newprj-dir');
    this.mbedOs = this.element.querySelector('#mbed-newprj-mbed-os');
    this.scm = this.element.querySelector('#mbed-newprj-scm');
    this.mcu = this.element.querySelector('#mbed-newprj-mcu');
    this.toolchain = this.element.querySelector('#mbed-newprj-toolchain');
    this.libraries = this.element.querySelector('#mbed-newprj-libraries');

    this.createButton = this.element.querySelector('#mbed-newprj-create');
    this.createButton.addEventListener('click', () => {
        this.emitter.emit('create');
    });

    this.cancelButton = this.element.querySelector('#mbed-newprj-cancel');
    this.cancelButton.addEventListener('click', () => {
        this.emitter.emit('cancel');
    });
  }

  serialize() {
  }

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  onCreate(callback) {
    this.emitter.on('create', callback);
  }

  onCancel(callback) {
    this.emitter.on('cancel', callback);
  }

  getNewPrjDir() {
    return this.newPrjDir.value;
  }

  setNewPrjDir(dir) {
    this.newPrjDir.value = dir;
  }

  getMbedOs() {
    return this.mbedOs.value;
  }

  setMbedOs(os) {
    this.mbedOs.value = os;
  }

  getScm() {
    return this.scm.value;
  }

  setScm(scm) {
    this.scm.value = scm
  }

  getMcu() {
    return this.mcu.value;
  }

  setMcu(mcu) {
    this.mcu.value = mcu;
  }

  getToolchain() {
    return this.toolchain.value;
  }

  setToolchain(toolchain) {
    this.toolchain.value = toolchain;
  }

  getLibraries() {
    return this.libraries.value.split('\n');
  }

  setLibraries(libraries) {
    this.libraries.value = libraries.join('\n');
  }

  clearForm() {
    this.settingsPanel.style.display = 'block';
    this.progressPanel.style.display = 'none';
    this.errorPanel.style.display = 'none';
    this.newPrjDir.value = '';
    this.mbedOs.value = 'default';
    this.scm.value = 'git';
    this.mcu.value = '';
    this.toolchain.value = 'GCC_ARM';
    this.libraries.value = '';
    this.createButton.disabled = false;
  }

  projectCreationRunning(running) {
    if(running) {
      this.settingsPanel.style.display = 'none';
      this.progressPanel.style.display = 'block';
      this.createButton.disabled = true;
      this.errorPanel.style.display = 'none';
    }
    else {
      this.settingsPanel.style.display = 'block';
      this.progressPanel.style.display = 'none';
      this.createButton.disabled = false;
    }
  }

  updateMessage(message) {
    this.message.innerHTML = '<div>' + message + '</div>';
  }

  setError(message) {
    this.error.innerHTML = '<div>' + message + '</div>';
  }

  showError() {
    this.errorPanel.style.display = 'block';
  }

  hideError() {
    this.errorPanel.style.display = 'none';
  }
}
