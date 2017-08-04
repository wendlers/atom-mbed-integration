'use babel';

import path from 'path';

import { BufferedProcess } from 'atom';
import MbedInstallerView from './mbed-installer-view';
import { CompositeDisposable } from 'atom';

export default {

  mbedInstallerView: null,
  mbedInstallerModalPanel: null,
  subscriptions: null,
  toolBar: null,

  activate(state) {

    require('atom-package-deps').install('mbed-integration', true)
      .then(function() {
        console.log('dependencies installed for mbed-integration');
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
    // this.modalPanel.destroy();
    this.subscriptions.dispose();
    // this.atomMbedIntegrationView.destroy();
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
  },

  showInstaller() {
    return this.mbedInstallerModalPanel.show();
  },

  hideInstaller() {
    return this.mbedInstallerModalPanel.hide();
  },

  getToolchainDir() {
    var res_dir = path.join(
      __dirname, path.join('..', 'resources')
    );

    return path.join(res_dir, 'mbed-toolchain');
  },

  setEnv() {

    var tc_dir = this.getToolchainDir();
    var tc_bin = path.join(tc_dir, 'bin');

    process.env['VIRTUAL_ENV'] = tc_dir;
    process.env['PATH'] = tc_bin + ':' + process.env['PATH'];

    atom.config.set('termination.core.autoRunCommand',
        'source $VIRTUAL_ENV/bin/activate; clear');
  },

  install() {

    var tc_dir = this.getToolchainDir();

    var script = 'mbed-installer.py';
    var cmd = path.join(res_dir, script);

    console.log('mbed installer: ' + cmd + ' => ' + tc_dir);

    this.mbedInstallerView.updateMessage('mbed-installer: installing Python virutalenv');

    var pyocd_proc = new BufferedProcess({
        command: 'python2',
        args: [cmd, tc_dir],
        stdout: (data) => {
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
            }
        }
    });

    pyocd_proc.onWillThrowError((err) => {
      err.handle();
      console.log('exited with: ' + err.message);
      this.mbedInstallerView.updateNote('Failed to install toolchain!');
    });

    return true;
  }
  /*
  serialize() {
    return {
      atomMbedIntegrationViewState: this.atomMbedIntegrationView.serialize()
    };
  },

  toggle() {
    console.log('AtomMbedIntegration was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }
  */
};
