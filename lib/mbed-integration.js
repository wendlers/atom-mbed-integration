'use babel';

import fs from 'fs';
import path from 'path';

import { BufferedProcess } from 'atom';
import MbedInstallerView from './mbed-installer-view';
import MbedNewPrjView from './mbed-newprj-view';
import { CompositeDisposable } from 'atom';
import SelectListView from 'atom-select-list'

install_proc = null;
mbedcli_proc = null;

export default {

  mbedInstallerView: null,
  mbedInstallerModalPanel: null,
  mbedNewPrjView: null,
  mbedNewPrjModalPanel: null,
  subscriptions: null,
  toolBar: null,
  selectFlashtoolView: null,
  availableFlashTools: null,
  selectedFlashTool: -1,

  config: {
    checkMbedToolchain: {
      title: 'check mebd toolchain',
      description: 'If this flag is set, the package will check on startup ' +
                   'if the mbed toolchain is present. In case no toolchain ' +
                   'found, installation will be offered.',
      type: 'boolean',
      default: true,
      order: 10
    },
    flashTool: {
      title: 'flash-tool to use',
      description: 'The flash-tool to use (`pyocd` or `stlink`)',
      type: 'string',
      default: 'pyocd',
      enum: ['pyocd', 'stlink'],
      order: 20
    },
  },

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

    this.mbedNewPrjView = new MbedNewPrjView(state.mbedNewPrjViewState);
    this.mbedNewPrjModalPanel= atom.workspace.addModalPanel({
      item: this.mbedNewPrjView.getElement(),
      visible: false
    });

    this.subscriptions = new CompositeDisposable();

    this.availableFlashTools = [];

    if(atom.packages.resolvePackagePath('pyocd') && !atom.packages.isPackageDisabled('pyocd')) {
      this.availableFlashTools = this.availableFlashTools.concat('pyocd');
    }

    if(atom.packages.resolvePackagePath('stlink') && !atom.packages.isPackageDisabled('stlink')) {
      this.availableFlashTools = this.availableFlashTools.concat('stlink');
    }

    if(this.availableFlashTools.length) {

      var idx = this.availableFlashTools.indexOf(atom.config.get("mbed-integration.flashTool"));

      if(idx > -1) {
        this.selectedFlashTool = idx;
      }

      this.selectFlashtoolView = new SelectListView({
        items: this.availableFlashTools,
        elementForItem: (item) => {
          const li = document.createElement('li')
          li.textContent = item
          return li
        },
        didConfirmSelection: (item) => {
          this.selectFlashtoolModalPanel.hide();
          this.selectedFlashTool = this.availableFlashTools.indexOf(item);
          atom.config.set("mbed-integration.flashTool", item);
          atom.notifications.addInfo('Selected flash-tool', {detail: item})
        },
        didCancelSelection: () => {
          this.selectFlashtoolModalPanel.hide();
        }
      });

      this.selectFlashtoolModalPanel = atom.workspace.addModalPanel({
        item: this.selectFlashtoolView.element,
        visible: false
      });

      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'mbed-integration:select-flashtool': () => this.selectFtToggle()
      }));
    }

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mbed-integration:installer': () => this.showInstaller()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mbed-integration:installer-close': () => this.hideInstaller()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mbed-integration:flash-tool-toggle': () => this.dispatchFlashCommand('toggle')
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mbed-integration:flash-tool-flash': () => this.dispatchFlashCommand('flash')
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mbed-integration:flash-tool-erase': () => this.dispatchFlashCommand('erase')
    }));

    this.mbedInstallerView.onInstall(
        () => this.install()
    );

    this.mbedInstallerView.onClose(
        () => this.hideInstaller()
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mbed-integration:new-project': () => this.showNewPrj()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mbed-integration:new-project-close': () => this.hideNewPrj()
    }));

    this.mbedNewPrjView.onCancel(
        () => this.hideNewPrj()
    );

    this.mbedNewPrjView.onCreate(
        () => this.createProject()
    );

    this.mbedNewPrjView.onCancel(
        () => this.hideNewPrj()
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
      icon: 'rocket',
      callback: 'mbed-integration:new-project',
      tooltip: 'create new mbed project'
    });

    this.toolBar.addSpacer();

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

    if(this.availableFlashTools.length) {

      this.toolBar.addSpacer();

      this.buttonFlashSettings = this.toolBar.addButton({
        icon: 'tasklist',
        callback: 'mbed-integration:select-flashtool',
        tooltip: 'flash-tool select'
      });

      this.buttonFlashSettings = this.toolBar.addButton({
        icon: 'settings',
        callback: 'mbed-integration:flash-tool-toggle',
        tooltip: 'flash-tool settings'
      });

      this.buttonFlashFlash = this.toolBar.addButton({
        icon: 'zap',
        callback: 'mbed-integration:flash-tool-flash',
        tooltip: 'flash-tool flash'
      });

      this.buttonFlashErase = this.toolBar.addButton({
        icon: 'flame',
        callback: 'mbed-integration:flash-tool-erase',
        tooltip: 'flash-tool erase'
      });
    }

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

    if(atom.config.get("mbed-integration.checkMbedToolchain") &&
      !this.existsVirtualEnv() && this.supportedSystem()) {
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
        m1 = '<p>It looks like there is no mbed toolchain installed yet. ' +
            'Since you are using a supported system, we could install a ' +
            'toolchain for you.</p>';
      }
      else {
        m1 = '<p>It looks like there is no mbed toolchain installed yet. ' +
            'However, your system is not supported by this ' +
            'installer. Please install the mbed toolchain by hand.</p>';
      }
      m = m + m1 +
        '<p>The startup check for the toolchain could be deactivated ' +
        'in the package settings.</p>';
    }

    this.mbedInstallerView.updateNote(m);

    this.mbedInstallerModalPanel.show();
    this.mbedInstallerView.installButton.focus();
  },

  hideInstaller() {

    if(install_proc) {
      install_proc.kill();
      install_proc = null;
      this.mbedInstallerView.setInstallMode(false);
      atom.notifications.addError('Mbed installer canceled!')
    }
    this.mbedInstallerModalPanel.hide();
  },

  showNewPrj() {

    var i = 0;
    var prjDir = path.join(atom.config.get('core.projectHome'), 'NewMbedPrj_' + i);

    while(fs.existsSync(prjDir)) {
      i++;
      prjDir = path.join(atom.config.get('core.projectHome'), 'NewMbedPrj_' + i);
    }

    this.mbedNewPrjView.clearForm();
    this.mbedNewPrjView.setNewPrjDir(prjDir);

    this.mbedNewPrjModalPanel.show();
    this.mbedNewPrjView.newPrjDir.focus();
  },

  hideNewPrj() {
    if(mbedcli_proc) {
      mbedcli_proc.kill();
      mbedcli_proc = null;
      atom.notifications.addError('Mbed project creation canceled!')
    }
    this.mbedNewPrjModalPanel.hide();
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
  },

  mbedBatch(args, callbackSuccess, callbackFail) {

    var res_dir = this.getResourcesDir();

    var script = 'mbed-batch.py';
    var cmd = path.join(res_dir, script);
    var default_args = [cmd]
    var all_args = default_args.concat(args)

    console.log('mbed batch: ' + all_args);

    var last_err = '';

    mbedcli_proc = new BufferedProcess({
        command: 'python2',
        args: all_args,
        stdout: (data) => {
          console.log('mbed batch: ' + data);
          if(data.startsWith('mbed-cli:')) {
            this.mbedNewPrjView.updateMessage(data)
          }
        },
        stderr: (data) => {
          console.log('mbed batch: ' + data);
          last_err = data;
          if(data.startsWith('mbed-cli:')) {
            this.mbedNewPrjView.updateMessage(data)
          }
        },
        exit: (code) => {
            console.log('mbed batch exited with code: ' + code);

            mbedcli_proc = null;

            if(code) {
              this.mbedNewPrjView.setError(last_err);
              callbackFail();
            }
            else {
              callbackSuccess();
            }
        }
    });

    mbedcli_proc.onWillThrowError((err) => {
      err.handle();
      console.log('mbed batch exited with: ' + err.message);
      mbedcli_proc = null;
      callbackFail()
    });
  },

  createProject() {

    this.mbedNewPrjView.projectCreationRunning(true);

    var args = [
      '--prj_dir',
      this.mbedNewPrjView.getNewPrjDir(),
      '--os',
      this.mbedNewPrjView.getMbedOs(),
      '--scm',
      this.mbedNewPrjView.getScm(),
      '--toolchain',
      this.mbedNewPrjView.getToolchain()
    ];

    if(this.mbedNewPrjView.getMcu() != '') {
      args = args.concat(['--target', this.mbedNewPrjView.getMcu()])
    }

    var libs = this.mbedNewPrjView.getLibraries();

    for(var i in libs) {
      if(libs[i] != '') {
        args = args.concat(['--library', libs[i]])
      }
    }

    this.mbedBatch(
      args,
      () => {
        this.hideNewPrj();
        atom.project.addPath(this.mbedNewPrjView.getNewPrjDir());
        atom.notifications.addSuccess("Successfully created new project");
      },
      () => {
        this.mbedNewPrjView.showError();
        this.mbedNewPrjView.projectCreationRunning(false);
      }
    );
  },

  selectFtToggle() {
    if(this.selectFlashtoolModalPanel.isVisible()) {
      return this.selectFlashtoolModalPanel.hide();
    }

    this.selectFlashtoolModalPanel.show();
    this.selectFlashtoolView.element.querySelector('.editor').focus();
  },

  dispatchFlashCommand(command) {

    if(this.selectedFlashTool == -1) {
      atom.notifications.addError('It seams like there are no flash-tools available!');
      return;
    }

    var editor = atom.workspace.getActiveTextEditor();

    if(editor) {
      var editorView = atom.views.getView(editor);
      var target = this.availableFlashTools[this.selectedFlashTool];
      atom.commands.dispatch(editorView, target + ':' + command);
    }
    else {
        atom.notifications.addError('Flashing needs an active editor!');
    }
  }
};
