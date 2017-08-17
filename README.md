# Mbed Development with Atom

This package tries to add as much features as possible to Atom to help you with [mbed](https://www.mbed.com/) development.

Basically the following is available after installing this package:

* A tool-bar to give you quick access to the most common tasks (compile, flash, serial monitor, mbed-cli)
* Simple 'wizzard' dialog to quickly setup / create a new mbed project
* Support to compile mbed projects (by using [mbed-cli](https://github.com/ARMmbed/mbed-cli))
* Flash .hex or .bin files to your device (by using [pyOCD](https://github.com/mbedmicro/pyOCD) or [stlink](https://github.com/texane/stlink))
* See the `printf` output from your device on a serial monitor

If you use Atom on a supported system (currently __only Linux x64__), this package will offer to install a complete mbed toolchain, including `mbed-cli`, `pyOCD` and the GCC compiler for ARM.

The ultimate goal is, that the only thing you need to install to start programming for Mbed is installing this package.

---
**NOTE**

Please note, that this package is in a very early alpha stage, and the `mbed` __toolchain installer only works on Linux x64__ (but if you install the toolchain by hand, the rest should work, see section below).

---

![screenshot](https://raw.githubusercontent.com/wendlers/atom-mbed-integration/master/doc/compile.png)

![screenshot](https://raw.githubusercontent.com/wendlers/atom-mbed-integration/master/doc/pyocd.png)

## Atom Packages Installed by this Package

In detail, the following packages will be installed as dependencies by this package:

* [tool-bar](https://atom.io/packages/tool-bar)
* [busy](https://atom.io/packages/busy)
* [busy-signal](https://atom.io/packages/busy-signal)
* [intentions](https://atom.io/packages/intentions)
* [linter-ui-default](https://atom.io/packages/linter-ui-default)
* [linter](https://atom.io/packages/linter)
* [termination](https://atom.io/packages/termination)
* [build](https://atom.io/packages/build)
* [build-mbed](https://atom.io/packages/build-mbed)
* [pyocd](https://atom.io/packages/pyocd)
* [stlink](https://atom.io/packages/stlink)
* [sermon](https://atom.io/packages/sermon)

## Python Modules Installed by this Package

Upon installation, a virtual environment for Python is created under `$ATOM_HOME/packages/mbed-integration/resources/mbed-toolchain`. The following modules are added to this environment:

* [pyserial](https://pypi.python.org/pypi/pyserial)
* [pyocd](https://pypi.python.org/pypi/pyOCD)
* [mercurial](https://pypi.python.org/pypi/Mercurial)
* [mbed-cli](https://pypi.python.org/pypi/mbed-cli)

## Binary Packages Installed by this Package

* [GNU ARM Embedded Toolchain](https://developer.arm.com/open-source/gnu-toolchain/gnu-rm/downloads) Linux 64Bit

## Prerequisites

A working __Python 2.7__ is needed ([mbed-cli](https://github.com/ARMmbed/mbed-cli#installing-mbed-cli) __only works on Python 2.7__). Also [git](https://git-scm.com/) __must be installed__ on your system. If unsure, run the following commands:

    sudo apt install python
    sudo apt install git

If you are going to use stlink, make sure you installed the `st-flash` and `st-info` binaries on your system. See [here](https://github.com/texane/stlink) on how to get the binaries.
Everything else will be installed by the installer (mbed-cli, pyocd, gcc for ARM, etc.).

However, if you run into problems with the installer getting errors like `mbed-installer: No suitable virtualenv.` or `mbed-installer: Unable to bootstrap virtualenv`, try installing `virtualenv` by hand (some distributions use a tailored version of this module):

    sudo apt install python-virtualenv

## Install

To install this package from the package repository:

    apm install mbed-integration

To install from git:

    cd $HOME/.atom/packages
    git clone https://github.com/wendlers/atom-mbed-integration mbed-integration
    cd mbed-integration
    apm install

## Usage

When installing this package, it will first install the above listed Atom package dependencies. Next, if your system supports it, the mbed toolchain will be installed (if not, see the section about installing the toolchain by hand). After this steps, the `mbed-integration` toolbar should be shown on the top of your editor. By clicking on the `rocket` symbol, the project creation dialog will be shown.

E.g. to create a new mbed project for the Nordic NRF52 DK, use the following settings:

![screenshot](https://raw.githubusercontent.com/wendlers/atom-mbed-integration/master/doc/nrf52dk.png)

To create a project for the BBC:microbit:

![screenshot](https://raw.githubusercontent.com/wendlers/atom-mbed-integration/master/doc/microbit.png)

Or the ReadBaerLabs BLNANO2:

![screenshot](https://raw.githubusercontent.com/wendlers/atom-mbed-integration/master/doc/blenano2.png)

For more details on how to setup and use the components for mebd development see:

* [Compiling mbed projects with `build-mbed`](https://atom.io/packages/build-mbed)
* [Flashing mbed projects with `pyocd`](https://atom.io/packages/pyocd)
* [Flashing mbed projects with `stlink`](https://atom.io/packages/stlink)
* [Monitor the serial line of an embedded device with `sermon`](https://atom.io/packages/sermon)

## Installing the Mbed Toolchain by Hand

If your system does not support automatic installation of the mbed toolchain (e.g. because you are using a Mac), you could install the toolchain by hand. After all, only the following things are relevant to to make it work with Atom:

1. `mbed` / `mbed-cli` binaries need to be in the _PATH_
  - follow the instructions [here](https://github.com/ARMmbed/mbed-cli#installing-mbed-cli)
2. `pyocd-flashtool` binary needs to be in the _PATH_
  - follow the instructions [here](https://github.com/mbedmicro/pyOCD)
3. `arm-none-eabi-*` binaries need to be in the _PATH_
  - download suitable binaries [here](https://developer.arm.com/open-source/gnu-toolchain/gnu-rm/downloads) (or if you really need the old versoin wich is 32bit, go [here](https://launchpad.net/gcc-arm-embedded))
  - extract to GCC_ARM (which stands for whatever directory you use)
  - add `<GCC_ARM>/gcc-arm-none-eabi-<VERSION>/bin` to your path
4. disable toolchain check in `mbed-integration` package
  - open `mbed-integration` package settings in Atom and uncheck `check mbed toolchain`
