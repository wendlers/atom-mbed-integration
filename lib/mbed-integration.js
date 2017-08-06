'use babel';

import fs from 'fs';
import path from 'path';

import { BufferedProcess } from 'atom';
import MbedInstallerView from './mbed-installer-view';
import { CompositeDisposable } from 'atom';


install_proc = null;

export default {

  mbedInstallerView: null,
  mbedInstallerModalPanel: null,
  subscriptions: null,
  toolBar: null,

  activate(state) {

    this.firstRun == false;

    require('atom-package-deps').install('mbed-integration', true)
      .then(function() {
        console.log('mbed-integration: all Atom dependencies installed');
      });

    this.mbedInstallerView = new MbedInstallerView(state.MbedInstallerViewState);
    this.mbedInstallerModalPanel= atom.workspace.addModalPanel({
      item: this.mbedInstallerView.getElement(),
      visible: false
    });

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mbed-integration:installer': () => this.showInstaller()
    }));

    this.mbedInstallerView.onInstall(
        () => this.install()
    );

    this.mbedInstallerView.onClose(
        () => this.hideInstaller()
    );

    this.setEnv();
  },

  deactivate() {
    this.mbedInstallerModalPanel.destroy();
    this.subscriptions.dispose();
    this.mbedInstallerView.destroy();
  },

  consumeToolBar(toolbar) {
    this.toolBar = toolbar('mbed');

    this.toolBar.addButton({
      icon: 'check',
      callback: 'build:trigger',
      tooltip: 'trigger build'
    });

    this.toolBar.addButton({
      icon: 'checklist',
      callback: 'build:select-active-target',
      tooltip: 'select active target'
    });

    this.toolBar.addSpacer();

    this.toolBar.addButton({
      icon: 'settings',
      callback: 'pyocd:toggle',
      tooltip: 'pyOCD settings'
    });

    this.toolBar.addButton({
      icon: 'zap',
      callback: 'pyocd:flash',
      tooltip: 'pyOCD flash'
    });

    this.toolBar.addButton({
      icon: 'flame',
      callback: 'pyocd:erase',
      tooltip: 'pyOCD erase'
    });

    this.toolBar.addSpacer();

    this.toolBar.addButton({
      icon: 'device-desktop',
      callback: 'sermon:toggle',
      tooltip: 'Serial monitor'
    });

    this.toolBar.addSpacer();

    this.toolBar.addButton({
      icon: 'terminal',
      callback: 'termination:new',
      tooltip: 'Open terminal'
    });

    this.toolBar.addSpacer();

    this.toolBar.addButton({
      icon: 'gear',
      callback: 'application:show-settings',
      tooltip: 'Atom Settings'
    });

    if(!this.existsVirtualEnv() && this.supportedSystem()) {
      this.showInstaller();
    }
  },

  showInstaller() {

    var m = '<p>Proceed with mbed toolchain installation?</p>';

    if(this.existsVirtualEnv()) {
      m = '<p>It looks like the mbed toolchain is already installed.</p>' + m;
    }
    else {
      if(this.supportedSystem()) {
        m = '<p>It looks like there is no mbed toolchain installed yet. ' +
            'Since you are using a supported system, we could install a ' +
            'toolchain for you.</p>' + m;
      }
      else {
        m = '<p>It looks like there is no mbed toolchain installed yet. ' +
            'However, your system is not supported by this ' +
            'installer. Please install the mbed toolchain by hand.</p>' + m;
      }
    }

    this.mbedInstallerView.updateNote(m);

    return this.mbedInstallerModalPanel.show();
  },

  hideInstaller() {
    if(install_proc) {
      install_proc.kill();
      install_proc = null;
      this.mbedInstallerView.setInstallMode(false);
      atom.notifications.addError('Mbed installer canceled!')
    }
    return this.mbedInstallerModalPanel.hide();
  },

  getResourcesDir() {
    return path.join(__dirname, path.join('..', 'resources'));
  },

  getToolchainDir() {
    return path.join(this.getResourcesDir(), 'mbed-toolchain');
  },

  supportedSystem() {
    if(process.platform == 'linux' && process.arch == 'x64') {
      console.log('mbed-integration found supported system (linux x64)');
      return true;
    }
    return false;
  },

  existsVirtualEnv() {

    var tc_dir = this.getToolchainDir();
    var tc_bin = path.join(tc_dir, 'bin');

    return fs.existsSync(path.join(tc_bin, 'activate'));
  },

  setEnv() {

    if(this.existsVirtualEnv()) {

      var tc_dir = this.getToolchainDir();
      var tc_bin = path.join(tc_dir, 'bin');

      console.log('mbed-installer activating virtualenv');

      process.env['VIRTUAL_ENV'] = tc_dir;
      process.env['PATH'] = tc_bin + ':' + process.env['PATH'];

      atom.config.set('termination.core.autoRunCommand',
          'source $VIRTUAL_ENV/bin/activate; clear');
    }
  },

  unsetEnv() {

    var tc_bin = path.join(this.getToolchainDir(), 'bin') + ':';

    if(process.env['PATH'].startsWith(tc_bin)) {

      console.log('mbed-installer deactivating virtualenv');

      delete process.env['VIRTUAL_ENV'];
      process.env['PATH'] = process.env['PATH'].substring(tc_bin.length);
      atom.config.set('termination.core.autoRunCommand','');
    }
  },

  install() {

    var tc_dir = this.getToolchainDir();
    var res_dir = this.getResourcesDir();

    var script = 'mbed-bootstrap.py';
    var cmd = path.join(res_dir, script);

    console.log('mbed installer: ' + cmd + ' => ' + tc_dir);

    this.unsetEnv();
    this.mbedInstallerView.setInstallMode(true);
    this.mbedInstallerView.updateMessage('mbed-installer: installing Python virutalenv');

    install_proc = new BufferedProcess({
        command: 'python2',
        args: [cmd, tc_dir],
        stdout: (data) => {
          console.log('mbed installer: ' + data);

          if(data.startsWith('mbed-installer:')) {
            this.mbedInstallerView.updateMessage(data)
          }
        },
        stderr: (data) => {
          console.log('mbed installer: ' + data);

          if(data.startsWith('mbed-installer:')) {
            this.mbedInstallerView.updateMessage(data)
          }
        },
        exit: (code) => {
            console.log('exited with code: ' + code);

            if(code) {
              this.mbedInstallerView.updateNote('Failed to install toolchain!');
            }
            else {
              this.mbedInstallerView.updateNote('Successfully installed toolchain!');
              this.setEnv();
            }
            this.mbedInstallerView.setInstallMode(false);
            install_proc = null;
        }
    });

    install_proc.onWillThrowError((err) => {
      err.handle();
      console.log('exited with: ' + err.message);
      this.mbedInstallerView.updateNote('Failed to install toolchain!');
      this.mbedInstallerView.setInstallMode(false);
      install_proc = null;
    });

    return true;
  }
};
